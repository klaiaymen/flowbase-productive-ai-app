"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { isAuthError } from "@/lib/errors";

/**
 * Returns a stable `handleError` function.
 *
 * Usage:
 *   const handleError = useActionError();
 *   ...
 *   } catch (err) {
 *     handleError(err);        // → redirects to /sign-in on UNAUTHORIZED
 *   }
 */
export function useActionError() {
  const router = useRouter();

  const handleError = useCallback(
    (err: unknown, fallbackMessage?: string) => {
      if (isAuthError(err)) {
        // Push user to sign-in; after authenticating Clerk redirects them back
        router.push("/sign-in");
        return;
      }
      // Non-auth errors: surface a friendly message
      const message =
        err instanceof Error
          ? err.message
          : fallbackMessage ?? "Something went wrong. Please try again.";
      alert(message);
      console.error(err);
    },
    [router]
  );

  return handleError;
}
