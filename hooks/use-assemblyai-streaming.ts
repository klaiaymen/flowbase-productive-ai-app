"use client";

import { useCallback, useRef, useState } from "react";

const TARGET_SAMPLE_RATE = 16000;
const MAX_SESSION_MS = 120 * 1000;

interface UseAssemblyAlStreamingProps {
  onPartialTranscript: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onSessionEnd: () => void;
  onError: (error: string) => void;
}

function downsampleTo16BitPcm(input: Float32Array, inputSampleRate: number) {
  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    const pcm = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return pcm.buffer;
  }

  const sampleRateRatio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / sampleRateRatio);
  const pcm = new Int16Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * sampleRateRatio);
    const end = Math.min(Math.floor((i + 1) * sampleRateRatio), input.length);
    let sum = 0;

    for (let j = start; j < end; j++) {
      sum += input[j];
    }

    const sample = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return pcm.buffer;
}

export function useAssemblyAlStreaming({
  onPartialTranscript,
  onFinalTranscript,
  onSessionEnd,
  onError,
}: UseAssemblyAlStreamingProps) {
  const [isRecording, setIsRecording] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioHealthTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptHealthTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioFramesSentRef = useRef(0);
  const transcriptEventsSeenRef = useRef(0);
  const closingRef = useRef(false);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (audioHealthTimerRef.current) {
      clearTimeout(audioHealthTimerRef.current);
      audioHealthTimerRef.current = null;
    }

    if (transcriptHealthTimerRef.current) {
      clearTimeout(transcriptHealthTimerRef.current);
      transcriptHealthTimerRef.current = null;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          closingRef.current = true;
          wsRef.current.send(JSON.stringify({ type: "Terminate" }));
        } catch (e) {
          console.error("Error sending Terminate:", e);
        }
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      closingRef.current = false;
      audioFramesSentRef.current = 0;
      transcriptEventsSeenRef.current = 0;

      // 1. Request microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // 2. Fetch the temporary token from backend
      const tokenRes = await fetch("/api/assemblyai/token", { method: "POST" });
      const tokenData = await tokenRes.json().catch(() => null);
      if (!tokenRes.ok) {
        const message =
          tokenData?.message ||
          "Failed to authenticate with AssemblyAI. Check API key configuration.";
        throw new Error(message);
      }
      if (!tokenData?.token) {
        throw new Error(tokenData?.message || "AssemblyAI token response did not include a token.");
      }

      // 3. Connect to AssemblyAI Streaming WebSocket
      const wsParams = new URLSearchParams({
        sample_rate: String(TARGET_SAMPLE_RATE),
        speech_model: "u3-rt-pro",
        encoding: "pcm_s16le",
        token: tokenData.token,
      });
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?${wsParams.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // WebSocket successfully opened. Now configure audio processing.
        void (async () => {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioContext;

          if (audioContext.state === "suspended") {
            await audioContext.resume();
          }

          const source = audioContext.createMediaStreamSource(stream);
          sourceRef.current = source;

          // Buffer size of 4096, 1 input channel, 1 output channel
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          const gain = audioContext.createGain();
          gain.gain.value = 0;
          gainRef.current = gain;

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBuffer = downsampleTo16BitPcm(inputData, audioContext.sampleRate);

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(pcmBuffer);
              audioFramesSentRef.current += 1;
            }
          };

          source.connect(processor);
          processor.connect(gain);
          gain.connect(audioContext.destination);
          setIsRecording(true);

          audioHealthTimerRef.current = setTimeout(() => {
            if (audioFramesSentRef.current === 0) {
              onError("Microphone connected, but no audio frames are being captured. Try allowing mic access again or switching input devices.");
              stopRecording();
            }
          }, 3000);

          transcriptHealthTimerRef.current = setTimeout(() => {
            if (audioFramesSentRef.current > 0 && transcriptEventsSeenRef.current === 0) {
              onError("Audio is reaching the streaming connection, but AssemblyAI has not returned transcript events yet. Keep speaking clearly for a few more seconds, or check the AssemblyAI key/project access.");
            }
          }, 8000);

          // 4. Start the 2 minute (120s) timer session limit
          timeoutRef.current = setTimeout(() => {
            stopRecording();
            onSessionEnd();
          }, MAX_SESSION_MS);

        } catch (err: any) {
          console.error("Audio configuration error:", err);
          stopRecording();
          onError(err?.message || "Could not configure microphone recording.");
        }
        })();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          transcriptEventsSeenRef.current += 1;
          
          if (message.type === "Turn") {
            const transcript = message.transcript || "";
            if (message.end_of_turn) {
              onFinalTranscript(transcript);
            } else {
              onPartialTranscript(transcript);
            }
          } else if (message.type === "Error") {
            onError(message.error || message.message || "AssemblyAI streaming error.");
            stopRecording();
          } else if (message.error) {
            onError(message.error);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        onError("WebSocket connection error.");
        stopRecording();
      };

      ws.onclose = (event) => {
        if (!closingRef.current && event.code !== 1000) {
          onError(`AssemblyAI stream closed (${event.code}${event.reason ? `: ${event.reason}` : ""}).`);
        }

        if (wsRef.current === ws) {
          stopRecording();
        } else {
          setIsRecording(false);
        }
      };

    } catch (err: any) {
      console.error("Failed to start recording:", err);
      onError(err?.message || "Could not start audio stream.");
      stopRecording();
    }
  }, [onPartialTranscript, onFinalTranscript, onSessionEnd, onError, stopRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
}
