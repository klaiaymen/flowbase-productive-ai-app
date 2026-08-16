"use client";

import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Info,
  Users,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Rocket,
  PauseCircle,
  XCircle,
  FileText,
  Save,
  ShieldCheck,
  AlertTriangle,
  Tag,
  Check,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateBoardDetails, getBoardMembers } from "@/app/kanban/actions";
import { Role } from "@/db/schema";

export interface KanbanBoard {
  id: number;
  userId: number | null;
  name: string;
  color: string;
  description?: string | null;
  manualStatus?: string | null;
  createdAt: Date;
}

export interface KanbanColumn {
  id: number;
  boardId: number;
  name: string;
  position: number;
  createdAt: Date;
}

export interface Label {
  text: string;
  color: string;
}

export interface KanbanTask {
  id: number;
  columnId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  labels: string | null; // JSON array of Label
  assignedTo?: string | null;
  syncCalendar: boolean;
  syncNotes: boolean;
  calendarItemId: number | null;
  position: number;
  createdAt: Date;
}

export interface MemberInfo {
  email: string;
  name: string | null;
  roleLabel: string;
}

export interface ProjectStatusInfo {
  key: "planned" | "in_progress" | "testing" | "ready_for_launch" | "completed" | "on_hold" | "cancelled";
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: any;
  alertType: "info" | "warning" | "error" | "success";
  alertTitle: string;
  alertMessage: string;
  isManual: boolean;
  isHalted: boolean;
}

export function computeProjectStatus(
  board: KanbanBoard,
  columns: KanbanColumn[],
  tasks: KanbanTask[]
): ProjectStatusInfo {
  const manual = board.manualStatus;

  if (manual === "on_hold") {
    return {
      key: "on_hold",
      label: "On Hold (En pause)",
      badgeBg: "bg-amber-100/90",
      badgeText: "text-amber-900",
      badgeBorder: "border-amber-300",
      icon: PauseCircle,
      alertType: "warning",
      alertTitle: "Projet en pause (On Hold)",
      alertMessage: "Le projet est temporairement arrêté : Problème de budget, ressources ou décision.",
      isManual: true,
      isHalted: true,
    };
  }

  if (manual === "cancelled") {
    return {
      key: "cancelled",
      label: "Cancelled (Annulé)",
      badgeBg: "bg-rose-100/90",
      badgeText: "text-rose-900",
      badgeBorder: "border-rose-300",
      icon: XCircle,
      alertType: "error",
      alertTitle: "Projet Annulé (Cancelled)",
      alertMessage: "Projet abandonné : Arrêt définitif.",
      isManual: true,
      isHalted: true,
    };
  }

  const getColName = (colId: number) => {
    const col = columns.find((c) => c.id === colId);
    return col ? col.name.toLowerCase() : "";
  };

  const isTodoCol = (colId: number) => {
    const name = getColName(colId);
    return name.includes("todo") || name.includes("to do") || name.includes("à faire") || name.includes("a faire") || name.includes("backlog");
  };

  const isInProgressCol = (colId: number) => {
    const name = getColName(colId);
    return name.includes("progress") || name.includes("en cours") || name.includes("doing") || name.includes("in_progress");
  };

  const isDoneCol = (colId: number) => {
    const name = getColName(colId);
    return name.includes("done") || name.includes("terminé") || name.includes("termine") || name.includes("complete") || name.includes("finished");
  };

  const hasLabelMatch = (task: KanbanTask, keywords: string[]) => {
    if (!task.labels) return false;
    try {
      const parsed: Label[] = JSON.parse(task.labels);
      return parsed.some((l) =>
        keywords.some((kw) => l.text.toLowerCase().includes(kw))
      );
    } catch {
      return false;
    }
  };

  // Rule 5: If all tasks are in done column -> Completed
  const allTasksDone = tasks.length > 0 && tasks.every((t) => isDoneCol(t.columnId));
  if (allTasksDone) {
    return {
      key: "completed",
      label: "Completed (Terminé)",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-900",
      badgeBorder: "border-emerald-300",
      icon: CheckCircle2,
      alertType: "success",
      alertTitle: "Projet Terminé",
      alertMessage: "Toutes les tâches du projet sont finalisées et dans la colonne Done.",
      isManual: false,
      isHalted: false,
    };
  }

  // Rule 4: If there is one task with label deploiement -> Ready for Launch
  const hasDeployLabel = tasks.some((t) =>
    hasLabelMatch(t, ["deploiement", "déploiement", "deployment", "deploy", "release"])
  );
  if (hasDeployLabel) {
    return {
      key: "ready_for_launch",
      label: "Ready for Launch",
      badgeBg: "bg-sky-100",
      badgeText: "text-sky-900",
      badgeBorder: "border-sky-300",
      icon: Rocket,
      alertType: "info",
      alertTitle: "Prêt pour le Lancement",
      alertMessage: "Au moins une tâche possède l'étiquette 'déploiement'. Le projet est prêt pour la mise en production.",
      isManual: false,
      isHalted: false,
    };
  }

  // Rule 3: If there is one task with label test -> Testing / Validation
  const hasTestLabel = tasks.some((t) =>
    hasLabelMatch(t, ["test", "testing", "validation", "qa"])
  );
  if (hasTestLabel) {
    return {
      key: "testing",
      label: "Testing / Validation",
      badgeBg: "bg-purple-100",
      badgeText: "text-purple-900",
      badgeBorder: "border-purple-300",
      icon: Tag,
      alertType: "info",
      alertTitle: "En Phase de Test & Validation",
      alertMessage: "Au moins une tâche possède l'étiquette 'test'. Le projet est en phase de recettes et validation.",
      isManual: false,
      isHalted: false,
    };
  }

  // Rule 2: If there is at least one task in progress column -> In progress
  const hasInProgressTask = tasks.some((t) => isInProgressCol(t.columnId));
  if (hasInProgressTask) {
    return {
      key: "in_progress",
      label: "In progress (En cours)",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-900",
      badgeBorder: "border-blue-300",
      icon: Clock,
      alertType: "info",
      alertTitle: "Projet En Cours",
      alertMessage: "Au moins une tâche est actuellement en cours d'exécution.",
      isManual: false,
      isHalted: false,
    };
  }

  // Rule 1: If all tasks are in to do column (or 0 tasks) -> Planned
  const allTasksTodo = tasks.length === 0 || tasks.every((t) => isTodoCol(t.columnId));
  if (allTasksTodo) {
    return {
      key: "planned",
      label: "Planned (Planifié)",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-800",
      badgeBorder: "border-slate-300",
      icon: FileText,
      alertType: "info",
      alertTitle: "Projet Planifié",
      alertMessage: "Toutes les tâches sont en préparation dans la colonne To do.",
      isManual: false,
      isHalted: false,
    };
  }

  return {
    key: "in_progress",
    label: "In progress (En cours)",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-900",
    badgeBorder: "border-blue-300",
    icon: Clock,
    alertType: "info",
    alertTitle: "Projet En Cours",
    alertMessage: "L'activité sur le projet est en cours de progression.",
    isManual: false,
    isHalted: false,
  };
}

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: KanbanBoard;
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  currentUser: {
    id: number;
    email: string;
    role: Role;
    name: string | null;
  } | null;
  onBoardUpdated: (updated: KanbanBoard) => void;
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  board,
  columns,
  tasks,
  currentUser,
  onBoardUpdated,
}: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "status" | "stats">("general");
  const [description, setDescription] = useState(board.description || "");
  const [manualStatus, setManualStatus] = useState<string>(board.manualStatus || "auto");
  const [savingDesc, setSavingDesc] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [descSuccess, setDescSuccess] = useState(false);

  const isChefDeProjet =
    currentUser?.role === "chef_projet" ||
    currentUser?.role === "superuser" ||
    currentUser?.role === "pmo" ||
    board.userId === currentUser?.id;

  const currentStatusInfo = computeProjectStatus(board, columns, tasks);

  useEffect(() => {
    setDescription(board.description || "");
    setManualStatus(board.manualStatus || "auto");
  }, [board]);

  useEffect(() => {
    if (isOpen) {
      const loadMembers = async () => {
        try {
          setLoadingMembers(true);
          const data = await getBoardMembers(board.id);
          setMembers(data);
        } catch (err) {
          console.error("Failed to load project members:", err);
        } finally {
          setLoadingMembers(false);
        }
      };
      loadMembers();
    }
  }, [isOpen, board.id]);

  if (!isOpen) return null;

  const handleSaveDescription = async () => {
    if (!isChefDeProjet) return;
    try {
      setSavingDesc(true);
      const updated = await updateBoardDetails(board.id, { description });
      onBoardUpdated(updated as any);
      setDescSuccess(true);
      setTimeout(() => setDescSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || "Impossible de sauvegarder la description.");
    } finally {
      setSavingDesc(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!isChefDeProjet) return;
    try {
      setSavingStatus(true);
      const payloadStatus = newStatus === "auto" ? null : newStatus;
      const updated = await updateBoardDetails(board.id, { manualStatus: payloadStatus });
      setManualStatus(newStatus);
      onBoardUpdated(updated as any);
    } catch (err: any) {
      alert(err.message || "Impossible de mettre à jour le statut du projet.");
    } finally {
      setSavingStatus(false);
    }
  };

  // Compute Statistics
  const totalTasks = tasks.length;
  const highPriorityCount = tasks.filter((t) => t.priority === "high").length;
  const mediumPriorityCount = tasks.filter((t) => t.priority === "medium").length;
  const lowPriorityCount = tasks.filter((t) => t.priority === "low").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const col = columns.find((c) => c.id === t.columnId);
    const colName = col ? col.name.toLowerCase() : "";
    const isDone = colName.includes("done") || colName.includes("terminé");
    return t.dueDate < todayStr && !isDone;
  });

  const unassignedTasks = tasks.filter((t) => !t.assignedTo || !t.assignedTo.trim());

  // Task distribution by column
  const columnStats = columns.map((col) => {
    const colTasks = tasks.filter((t) => t.columnId === col.id);
    const percent = totalTasks > 0 ? Math.round((colTasks.length / totalTasks) * 100) : 0;
    return {
      colId: col.id,
      colName: col.name,
      count: colTasks.length,
      percent,
    };
  });

  const doneColIds = columns.filter((c) => {
    const n = c.name.toLowerCase();
    return n.includes("done") || n.includes("terminé") || n.includes("complete");
  }).map((c) => c.id);

  const completedTaskCount = tasks.filter((t) => doneColIds.includes(t.columnId)).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTaskCount / totalTasks) * 100) : 0;

  const StatusIcon = currentStatusInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl transform overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-2xl backdrop-blur-2xl transition-all my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-200">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{board.name}</h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-xs",
                    currentStatusInfo.badgeBg,
                    currentStatusInfo.badgeText,
                    currentStatusInfo.badgeBorder
                  )}
                >
                  <StatusIcon className="size-3.5" />
                  <span>{currentStatusInfo.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Détails du projet, membres affectés et métriques de suivi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-6 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer",
              activeTab === "general"
                ? "border-amber-500 text-amber-600 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <FileText className="size-4" />
            <span>Description & Membres</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer",
              activeTab === "status"
                ? "border-amber-500 text-amber-600 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <AlertCircle className="size-4" />
            <span>Statut du Projet & Alertes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer",
              activeTab === "stats"
                ? "border-amber-500 text-amber-600 bg-amber-50/40"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <BarChart2 className="size-4" />
            <span>Statistiques ({totalTasks})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: General & Description */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Description Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-amber-500" />
                    <span>Description du projet</span>
                  </label>
                  {isChefDeProjet ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldCheck className="size-3 text-amber-600" /> Chef de Projet (Modifiable)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      Lecture seule
                    </span>
                  )}
                </div>

                {isChefDeProjet ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ajouter une description détaillée des objectifs, du périmètre et du contexte du projet..."
                      className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition shadow-xs"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-400">
                        Seul le Chef de Projet peut rédiger ou modifier la description.
                      </p>
                      <Button
                        type="button"
                        onClick={handleSaveDescription}
                        disabled={savingDesc}
                        className="h-8 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-200 flex items-center gap-1.5"
                      >
                        <Save className="size-3.5" />
                        <span>{savingDesc ? "Enregistrement..." : "Enregistrer"}</span>
                      </Button>
                    </div>
                    {descSuccess && (
                      <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
                        <Check className="size-3.5" /> Description sauvegardée avec succès !
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 min-h-[90px]">
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {description.trim() ? description : "Aucune description fournie par le Chef de Projet pour le moment."}
                    </p>
                  </div>
                )}
              </div>

              {/* Members Assigned Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="size-3.5 text-amber-500" />
                    <span>Membres affectés au projet ({members.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Détectés depuis les partages & tâches assignées
                  </span>
                </div>

                {loadingMembers ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-semibold animate-pulse">
                    Chargement de la liste des membres...
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                    <p className="text-xs text-slate-400 font-medium">Aucun membre ou partage trouvé pour ce projet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {members.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-xs hover:border-amber-200 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-white font-bold text-xs grid place-items-center uppercase shrink-0 shadow-xs">
                            {m.email.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{m.name || m.email}</p>
                            <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                          {m.roleLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Status & Alerts */}
          {activeTab === "status" && (
            <div className="space-y-6">
              {/* Alert Callout for Current Project Status */}
              <div
                className={cn(
                  "p-4 rounded-2xl border flex items-start gap-3 shadow-xs",
                  currentStatusInfo.alertType === "warning" && "bg-amber-50/90 border-amber-200 text-amber-900",
                  currentStatusInfo.alertType === "error" && "bg-rose-50/90 border-rose-200 text-rose-900",
                  currentStatusInfo.alertType === "success" && "bg-emerald-50/90 border-emerald-200 text-emerald-900",
                  currentStatusInfo.alertType === "info" && "bg-sky-50/90 border-sky-200 text-sky-900"
                )}
              >
                <StatusIcon className="size-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider">{currentStatusInfo.alertTitle}</h4>
                  <p className="text-xs leading-relaxed font-medium">{currentStatusInfo.alertMessage}</p>
                </div>
              </div>

              {/* Manual Override Settings (For Chef de Projet) */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-amber-500" />
                    <span>Contrôle Manuel du Statut par le Chef de Projet</span>
                  </h4>
                  {!isChefDeProjet && (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                      Réservé au Chef de Projet
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Le statut est calculé automatiquement d'après l'avancement des tâches et étiquettes. Cependant, seul le Chef de Projet peut interrompre ou annuler manuellement le projet.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {/* Option 1: Automatic */}
                  <button
                    type="button"
                    disabled={!isChefDeProjet || savingStatus}
                    onClick={() => handleStatusChange("auto")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer",
                      manualStatus === "auto" || !manualStatus
                        ? "bg-white border-amber-400 ring-2 ring-amber-100 shadow-xs"
                        : "bg-white/60 border-slate-200 hover:border-slate-300 opacity-80",
                      !isChefDeProjet && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">⚡ Automatique</span>
                      {(manualStatus === "auto" || !manualStatus) && <Check className="size-3.5 text-amber-500" />}
                    </div>
                    <p className="text-[10px] text-slate-500">Calcul dynamique basé sur les colonnes & labels</p>
                  </button>

                  {/* Option 2: On Hold */}
                  <button
                    type="button"
                    disabled={!isChefDeProjet || savingStatus}
                    onClick={() => handleStatusChange("on_hold")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer",
                      manualStatus === "on_hold"
                        ? "bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-xs"
                        : "bg-white/60 border-slate-200 hover:border-amber-200 opacity-80",
                      !isChefDeProjet && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800">⏸️ On Hold</span>
                      {manualStatus === "on_hold" && <Check className="size-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-amber-700/80">
                      Projet temporairement arrêté (Budget, ressources ou décision)
                    </p>
                  </button>

                  {/* Option 3: Cancelled */}
                  <button
                    type="button"
                    disabled={!isChefDeProjet || savingStatus}
                    onClick={() => handleStatusChange("cancelled")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer",
                      manualStatus === "cancelled"
                        ? "bg-rose-50 border-rose-400 ring-2 ring-rose-200 shadow-xs"
                        : "bg-white/60 border-slate-200 hover:border-rose-200 opacity-80",
                      !isChefDeProjet && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800">🚫 Cancelled</span>
                      {manualStatus === "cancelled" && <Check className="size-3.5 text-rose-600" />}
                    </div>
                    <p className="text-[10px] text-rose-700/80">Projet abandonné : Arrêt définitif du projet</p>
                  </button>
                </div>
              </div>

              {/* Alerting Warnings Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  <span>Alertes de suivi opérationnel</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Overdue alert */}
                  <div
                    className={cn(
                      "p-3.5 rounded-xl border flex items-start gap-3",
                      overdueTasks.length > 0 ? "bg-rose-50/80 border-rose-200 text-rose-900" : "bg-slate-50 border-slate-100 text-slate-600"
                    )}
                  >
                    <Clock className="size-4.5 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold">Tâches en retard : {overdueTasks.length}</h5>
                      <p className="text-[11px] mt-0.5">
                        {overdueTasks.length > 0
                          ? `${overdueTasks.length} tâche(s) ont dépassé leur date d'échéance.`
                          : "Aucune tâche en retard sur ce projet."}
                      </p>
                    </div>
                  </div>

                  {/* Unassigned alert */}
                  <div
                    className={cn(
                      "p-3.5 rounded-xl border flex items-start gap-3",
                      unassignedTasks.length > 0 ? "bg-amber-50/80 border-amber-200 text-amber-900" : "bg-slate-50 border-slate-100 text-slate-600"
                    )}
                  >
                    <UserCheck className="size-4.5 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold">Tâches non assignées : {unassignedTasks.length}</h5>
                      <p className="text-[11px] mt-0.5">
                        {unassignedTasks.length > 0
                          ? `${unassignedTasks.length} tâche(s) n'ont pas encore de membre assigné.`
                          : "Toutes les tâches sont assignées."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Project Statistics */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* Overall Progress KPI Bar */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Taux d'achèvement global</span>
                  <span className="text-sm font-black text-amber-400">{completionPercentage}%</span>
                </div>
                <div className="h-3 w-full bg-slate-700/80 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {completedTaskCount} sur {totalTasks} tâche(s) terminées au total
                </p>
              </div>

              {/* Column-by-Column Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Répartition par colonne
                </h4>
                <div className="space-y-2">
                  {columnStats.map((cs) => (
                    <div key={cs.colId} className="p-3 rounded-xl border border-slate-100 bg-white space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>{cs.colName}</span>
                        <span>{cs.count} tâche(s) ({cs.percent}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${cs.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Répartition par niveau de priorité
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 text-center">
                    <span className="text-lg font-black text-rose-700">{highPriorityCount}</span>
                    <p className="text-[10px] font-bold text-rose-800 uppercase mt-0.5">Haute priorité</p>
                  </div>

                  <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/50 text-center">
                    <span className="text-lg font-black text-amber-700">{mediumPriorityCount}</span>
                    <p className="text-[10px] font-bold text-amber-800 uppercase mt-0.5">Moyenne priorité</p>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 text-center">
                    <span className="text-lg font-black text-emerald-700">{lowPriorityCount}</span>
                    <p className="text-[10px] font-bold text-emerald-800 uppercase mt-0.5">Basse priorité</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3.5 bg-slate-50/60 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400 font-medium">
            Projet #{board.id} • Créé le {new Date(board.createdAt).toLocaleDateString()}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 rounded-xl border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
