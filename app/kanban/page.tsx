"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  Sparkles,
  Calendar,
  NotebookPen,
  Check,
  Edit2,
  AlertCircle,
  ClipboardList,
  ChevronRight,
  MoreVertical,
  Flag,
  Users,
  MessageSquare
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getBoards,
  createBoard,
  deleteBoard,
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  getTasks,
  saveTask,
  deleteTask,
  saveTaskPositions,
  getBoardShares,
  shareBoard,
  removeShare
} from "./actions";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense, useOthers, useSelf, useThreads, useCreateThread } from "@liveblocks/react";
import { Composer, Thread } from "@liveblocks/react-ui";
import "@liveblocks/react-ui/styles.css";
import { useActionError } from "@/hooks/use-action-error";

declare global {
  interface Liveblocks {
    ThreadMetadata: {
      taskId: string;
    };
  }
}

// Types matching DB schemas
interface KanbanBoard {
  id: number;
  userId: number | null;
  name: string;
  color: string;
  createdAt: Date;
}

interface KanbanColumn {
  id: number;
  boardId: number;
  name: string;
  position: number;
  createdAt: Date;
}

interface Label {
  text: string;
  color: string;
}

interface KanbanTask {
  id: number;
  columnId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  labels: string | null; // JSON array of Label
  syncCalendar: boolean;
  syncNotes: boolean;
  calendarItemId: number | null;
  position: number;
  createdAt: Date;
}

// Preset Colors for Boards
const BOARD_COLORS = [
  { id: "emerald", name: "Emerald", hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-100", border: "border-emerald-200" },
  { id: "cyan", name: "Cyan", hex: "#06b6d4", bg: "bg-cyan-500", text: "text-cyan-700", ring: "ring-cyan-100", border: "border-cyan-200" },
  { id: "amber", name: "Amber", hex: "#f59e0b", bg: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-100", border: "border-amber-200" },
  { id: "violet", name: "Violet", hex: "#8b5cf6", bg: "bg-violet-500", text: "text-violet-700", ring: "ring-violet-100", border: "border-violet-200" },
  { id: "rose", name: "Rose", hex: "#f43f5e", bg: "bg-rose-500", text: "text-rose-700", ring: "ring-rose-100", border: "border-rose-200" },
  { id: "slate", name: "Slate", hex: "#64748b", bg: "bg-slate-500", text: "text-slate-700", ring: "ring-slate-100", border: "border-slate-200" }
];

// Priority Styling Configurations
const PRIORITY_STYLES = {
  high: { label: "High Priority", bg: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-500" },
  medium: { label: "Medium Priority", bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  low: { label: "Low Priority", bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" }
};

// Pastel options for tags
const TAG_COLORS = [
  { id: "emerald", bg: "bg-emerald-100/70 text-emerald-800 border-emerald-200/50" },
  { id: "cyan", bg: "bg-cyan-100/70 text-cyan-800 border-cyan-200/50" },
  { id: "orange", bg: "bg-orange-100/70 text-orange-800 border-orange-200/50" },
  { id: "violet", bg: "bg-violet-100/70 text-violet-800 border-violet-200/50" },
  { id: "rose", bg: "bg-rose-100/70 text-rose-800 border-rose-200/50" }
];

export default function KanbanPage() {
  // State
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoard, setActiveBoard] = useState<KanbanBoard | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Board Modal state
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardColor, setNewBoardColor] = useState("emerald");

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [taskTargetColumnId, setTaskTargetColumnId] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskSyncCalendar, setTaskSyncCalendar] = useState(false);
  const [taskSyncNotes, setTaskSyncNotes] = useState(false);
  const [taskLabels, setTaskLabels] = useState<Label[]>([]);
  
  // Tag creation temporary state
  const [tempTagText, setTempTagText] = useState("");
  const [tempTagColor, setTempTagColor] = useState("emerald");

  // Column creation state
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");

  // Drag and Drop state
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);
  const [isDragOverColId, setIsDragOverColId] = useState<number | null>(null);

  // Auth-aware error handler — redirects to /sign-in on 401
  const handleError = useActionError();

  // Load Boards
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const data = await getBoards();
        setBoards(data);
        if (data.length > 0) {
          setActiveBoard(data[0]);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch boards:", error);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Load Columns and Tasks when active board changes
  useEffect(() => {
    if (!activeBoard) {
      setColumns([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    const loadBoardDetails = async () => {
      try {
        setLoading(true);
        const [colData, taskData] = await Promise.all([
          getColumns(activeBoard.id),
          getTasks(activeBoard.id)
        ]);
        setColumns(colData);
        setTasks(taskData as KanbanTask[]);
      } catch (error) {
        console.error("Failed to load board columns/tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBoardDetails();
  }, [activeBoard]);

  // Create Board handler
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const board = await createBoard(newBoardName.trim(), newBoardColor);
      setBoards(prev => [...prev, board]);
      setActiveBoard(board);
      setNewBoardName("");
      setNewBoardColor("emerald");
      setIsBoardModalOpen(false);
    } catch (error: any) {
      handleError(error, "Failed to create board.");
      console.error("Failed to create board:", error);
    }
  };

  // Delete Board handler
  const handleDeleteBoard = async (boardId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent select board
    if (!confirm("Are you sure you want to delete this board? This will delete all columns and tasks inside it, and remove synced calendar events.")) return;

    try {
      await deleteBoard(boardId);
      setBoards(prev => {
        const next = prev.filter(b => b.id !== boardId);
        if (activeBoard?.id === boardId) {
          setActiveBoard(next.length > 0 ? next[0] : null);
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to delete board:", error);
    }
  };

  // Create Column handler
  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim() || !activeBoard) return;

    if (columns.length >= 5) {
      alert("A maximum of 5 columns are allowed per board.");
      return;
    }

    try {
      const col = await createColumn(activeBoard.id, newColumnName.trim());
      setColumns(prev => [...prev, col]);
      setNewColumnName("");
      setIsAddingColumn(false);
    } catch (error) {
      console.error("Failed to add column:", error);
    }
  };

  // Rename Column handler
  const handleRenameColumn = async (columnId: number) => {
    if (!editingColumnName.trim()) return;
    try {
      const updated = await updateColumn(columnId, editingColumnName.trim());
      setColumns(prev => prev.map(c => c.id === columnId ? updated : c));
      setEditingColumnId(null);
      setEditingColumnName("");
    } catch (error) {
      console.error("Failed to rename column:", error);
    }
  };

  // Delete Column handler
  const handleDeleteColumn = async (columnId: number) => {
    if (!confirm("Are you sure you want to delete this column and all its tasks?")) return;
    try {
      await deleteColumn(columnId);
      setColumns(prev => prev.filter(c => c.id !== columnId));
      setTasks(prev => prev.filter(t => t.columnId !== columnId));
    } catch (error) {
      console.error("Failed to delete column:", error);
    }
  };

  // Open Task Modal for Add
  const openAddTaskModal = (columnId: number) => {
    setEditingTask(null);
    setTaskTargetColumnId(columnId);
    setTaskTitle("");
    setTaskDescription("");
    setTaskDueDate(new Date().toISOString().split("T")[0]); // default to today
    setTaskPriority("medium");
    setTaskSyncCalendar(false);
    setTaskSyncNotes(false);
    setTaskLabels([]);
    setTempTagText("");
    setIsTaskModalOpen(true);
  };

  // Open Task Modal for Edit
  const openEditTaskModal = (task: KanbanTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setTaskTargetColumnId(task.columnId);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskDueDate(task.dueDate || new Date().toISOString().split("T")[0]);
    setTaskPriority(task.priority);
    setTaskSyncCalendar(task.syncCalendar);
    setTaskSyncNotes(task.syncNotes);
    setTaskLabels(JSON.parse(task.labels || "[]"));
    setTempTagText("");
    setIsTaskModalOpen(true);
  };

  // Add tag locally to modal state
  const handleAddLocalTag = () => {
    if (!tempTagText.trim()) return;
    if (taskLabels.some(l => l.text.toLowerCase() === tempTagText.trim().toLowerCase())) return;

    setTaskLabels(prev => [...prev, { text: tempTagText.trim(), color: tempTagColor }]);
    setTempTagText("");
  };

  // Remove tag locally from modal state
  const handleRemoveLocalTag = (text: string) => {
    setTaskLabels(prev => prev.filter(l => l.text !== text));
  };

  // Save Task handler
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || taskTargetColumnId === null) return;

    try {
      const payload = {
        id: editingTask?.id,
        columnId: taskTargetColumnId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        dueDate: taskDueDate || null,
        priority: taskPriority,
        labels: JSON.stringify(taskLabels),
        syncCalendar: taskSyncCalendar,
        syncNotes: taskSyncNotes,
        calendarItemId: editingTask?.calendarItemId,
      };

      const saved = await saveTask(payload);

      if (editingTask) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? (saved as any) : t));
      } else {
        setTasks(prev => [...prev, saved as any]);
      }

      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  // Delete Task handler
  const handleDeleteTask = async () => {
    if (!editingTask) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(editingTask.id);
      setTasks(prev => prev.filter(t => t.id !== editingTask.id));
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, task: KanbanTask) => {
    setDraggedTask(task);
    e.dataTransfer.setData("text/plain", task.id.toString());
  };

  const handleDragOverColumn = (e: React.DragEvent, columnId: number) => {
    e.preventDefault();
    if (isDragOverColId !== columnId) {
      setIsDragOverColId(columnId);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverColId(null);
  };

  // Local helper to update state positions optimistically
  const updateLocalPositions = (taskOrders: { id: number; position: number; columnId: number }[]) => {
    setTasks(prev => {
      return prev.map(t => {
        const match = taskOrders.find(o => o.id === t.id);
        if (match) {
          return { ...t, position: match.position, columnId: match.columnId };
        }
        return t;
      });
    });
  };

  const handleDropColumn = async (columnId: number) => {
    setIsDragOverColId(null);
    if (!draggedTask) return;

    // Moving/ordering task in column
    const sourceColumnId = draggedTask.columnId;

    // If source matches target column, we rearrange to the end unless dropped on card
    if (sourceColumnId === columnId) {
      const colTasks = tasks.filter(t => t.columnId === columnId).sort((a, b) => a.position - b.position);
      const otherTasks = colTasks.filter(t => t.id !== draggedTask.id);
      const updatedTasks = [...otherTasks, { ...draggedTask }];
      
      const taskOrders = updatedTasks.map((t, idx) => ({ id: t.id, position: idx, columnId }));
      updateLocalPositions(taskOrders);
      await saveTaskPositions(taskOrders);
    } else {
      // Move to target column (end of column)
      const colTasks = tasks.filter(t => t.columnId === columnId).sort((a, b) => a.position - b.position);
      const updatedTasks = [...colTasks, { ...draggedTask, columnId }];
      
      const taskOrders = updatedTasks.map((t, idx) => ({ id: t.id, position: idx, columnId }));
      
      // Update source column to maintain 0-based consecutive indexes
      const srcTasks = tasks.filter(t => t.columnId === sourceColumnId && t.id !== draggedTask.id).sort((a, b) => a.position - b.position);
      srcTasks.forEach((t, idx) => {
        taskOrders.push({ id: t.id, position: idx, columnId: sourceColumnId });
      });
      updateLocalPositions(taskOrders);
      await saveTaskPositions(taskOrders);
    }
    setDraggedTask(null);
  };

  const handleDropCard = async (e: React.DragEvent, targetIndex: number, targetColumnId: number) => {
    e.stopPropagation(); // stop triggering handleDropColumn
    setIsDragOverColId(null);
    if (!draggedTask) return;

    const sourceColumnId = draggedTask.columnId;

    let targetTasks = tasks.filter(t => t.columnId === targetColumnId && t.id !== draggedTask.id).sort((a, b) => a.position - b.position);
    targetTasks.splice(targetIndex, 0, { ...draggedTask, columnId: targetColumnId });

    let taskOrders: any[] = [];
    targetTasks.forEach((t, idx) => {
      taskOrders.push({ id: t.id, position: idx, columnId: targetColumnId });
    });

    if (sourceColumnId !== targetColumnId) {
      const srcTasks = tasks.filter(t => t.columnId === sourceColumnId && t.id !== draggedTask.id).sort((a, b) => a.position - b.position);
      srcTasks.forEach((t, idx) => {
        taskOrders.push({ id: t.id, position: idx, columnId: sourceColumnId });
      });
    }

    updateLocalPositions(taskOrders);
    await saveTaskPositions(taskOrders);
    setDraggedTask(null);
  };

  // Helper colors details
  const getBoardColor = (colorId: string) => {
    return BOARD_COLORS.find(c => c.id === colorId) || BOARD_COLORS[0];
  };

  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      resolveUsers={async ({ userIds }) => {
        const response = await fetch(`/api/users/resolve?ids=${userIds.join(",")}`);
        if (!response.ok) return [];
        return response.json();
      }}
      resolveMentionSuggestions={async ({ text }) => {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(text)}`);
        if (!response.ok) return [];
        return response.json();
      }}
    >
      <AppShell>
        {/* Page Header */}
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/90 bg-white/74 p-4 shadow-[0_20px_60px_rgba(52,86,118,0.1)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              Task Management
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Kanban / Task Boards
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Cozy workspace boards to design, classify, and drag tasks through sprints. Toggle calendar updates and note tags dynamically.
            </p>
          </div>
        </header>

        {/* Main Two-Panel Workspace */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
          
          {/* Left Panel: Boards Management */}
          <section className="flex flex-col rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-md h-fit min-h-[400px]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">My Boards</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{boards.length}</span>
            </div>

            <Button
              type="button"
              className="w-full h-10 mb-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-200/70 hover:from-amber-600 hover:to-orange-600 font-semibold text-xs"
              onClick={() => setIsBoardModalOpen(true)}
            >
              <Plus className="mr-1.5 size-4" />
              New Board
            </Button>

            {/* Boards List */}
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[300px] pr-1">
              {boards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/20 border border-dashed border-slate-200/80 rounded-2xl">
                  <ClipboardList className="size-6 text-slate-300 mb-1" />
                  <p className="text-[11px] font-bold text-slate-400">No boards active</p>
                  <p className="text-[9px] text-slate-400/80 px-4 mt-0.5">Click "+ New Board" to design a workspace board.</p>
                </div>
              ) : (
                boards.map(b => {
                  const bCol = getBoardColor(b.color);
                  const isActive = activeBoard?.id === b.id;

                  return (
                    <button
                      key={b.id}
                      onClick={() => setActiveBoard(b)}
                      className={cn(
                        "group flex items-center justify-between w-full h-10 px-3 rounded-xl border text-left text-xs font-bold transition-all duration-200 hover:bg-white hover:shadow-sm",
                        isActive
                          ? "bg-white border-amber-200/80 text-slate-900 shadow-sm ring-1 ring-amber-100"
                          : "bg-transparent border-transparent text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("size-2.5 rounded-full shrink-0", bCol.bg)} />
                        <span className="truncate">{b.name}</span>
                      </div>
                      <span
                        onClick={(e) => handleDeleteBoard(b.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                        title="Delete Board"
                      >
                        <Trash2 className="size-3.5" />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Panel: Selected Board View */}
          <section className="flex flex-col min-w-0">
            {!activeBoard ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200/80 rounded-[2rem] bg-white/40 p-12 text-center min-h-[400px]">
                <Sparkles className="size-10 text-amber-400 mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-900">Welcome to Flowbase Kanban</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">Create or select a board from the left sidebar to start charting your sprint tasks, syncing calendar, and tags.</p>
                <Button
                  type="button"
                  className="mt-4 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-200 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => setIsBoardModalOpen(true)}
                >
                  Create your first Board
                </Button>
              </div>
            ) : (
              <RoomProvider id={`kanban-board-${activeBoard.id}`} initialPresence={{}}>
                <ClientSideSuspense fallback={
                  <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
                    <Sparkles className="size-8 text-amber-500 animate-spin" />
                    <p className="text-sm font-semibold text-slate-500 mt-2">Connecting to Board Room...</p>
                  </div>
                }>
                  <CollaborativeBoardContent
                    activeBoard={activeBoard}
                    columns={columns}
                    setColumns={setColumns}
                    loading={loading}
                    tasks={tasks}
                    setTasks={setTasks}
                    isAddingColumn={isAddingColumn}
                    setIsAddingColumn={setIsAddingColumn}
                    newColumnName={newColumnName}
                    setNewColumnName={setNewColumnName}
                    editingColumnId={editingColumnId}
                    setEditingColumnId={setEditingColumnId}
                    editingColumnName={editingColumnName}
                    setEditingColumnName={setEditingColumnName}
                    isTaskModalOpen={isTaskModalOpen}
                    setIsTaskModalOpen={setIsTaskModalOpen}
                    editingTask={editingTask}
                    setEditingTask={setEditingTask}
                    taskTargetColumnId={taskTargetColumnId}
                    setTaskTargetColumnId={setTaskTargetColumnId}
                    taskTitle={taskTitle}
                    setTaskTitle={setTaskTitle}
                    taskDescription={taskDescription}
                    setTaskDescription={setTaskDescription}
                    taskDueDate={taskDueDate}
                    setTaskDueDate={setTaskDueDate}
                    taskPriority={taskPriority}
                    setTaskPriority={setTaskPriority}
                    taskSyncCalendar={taskSyncCalendar}
                    setTaskSyncCalendar={setTaskSyncCalendar}
                    taskSyncNotes={taskSyncNotes}
                    setTaskSyncNotes={setTaskSyncNotes}
                    taskLabels={taskLabels}
                    setTaskLabels={setTaskLabels}
                    tempTagText={tempTagText}
                    setTempTagText={setTempTagText}
                    tempTagColor={tempTagColor}
                    setTempTagColor={setTempTagColor}
                    draggedTask={draggedTask}
                    setDraggedTask={setDraggedTask}
                    isDragOverColId={isDragOverColId}
                    setIsDragOverColId={setIsDragOverColId}
                    handleCreateColumn={handleCreateColumn}
                    handleRenameColumn={handleRenameColumn}
                    handleDeleteColumn={handleDeleteColumn}
                    openAddTaskModal={openAddTaskModal}
                    openEditTaskModal={openEditTaskModal}
                    handleAddLocalTag={handleAddLocalTag}
                    handleRemoveLocalTag={handleRemoveLocalTag}
                    handleSaveTask={handleSaveTask}
                    handleDeleteTask={handleDeleteTask}
                    handleDragStart={handleDragStart}
                    handleDragOverColumn={handleDragOverColumn}
                    handleDragLeaveColumn={handleDragLeaveColumn}
                    handleDropColumn={handleDropColumn}
                    handleDropCard={handleDropCard}
                    getBoardColor={getBoardColor}
                  />
                </ClientSideSuspense>
              </RoomProvider>
            )}
          </section>

        </div>

        {/* Board Modal (Add) */}
        {isBoardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={() => setIsBoardModalOpen(false)}
            />

            <div className="relative w-full max-w-sm transform rounded-[2rem] border border-white/90 bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-950 flex items-center gap-1.5">
                  <Sparkles className="size-4.5 text-amber-500" />
                  <span>Create Kanban Board</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsBoardModalOpen(false)}
                  className="grid size-8 place-items-center rounded-full hover:bg-slate-100 text-slate-400 transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBoard} className="mt-4 flex flex-col gap-4">
                {/* Board Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="board-name" className="text-xs font-bold text-slate-600">Board Name</label>
                  <input
                    id="board-name"
                    type="text"
                    required
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="e.g., Growth Sprint, Design System"
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-400 focus:outline-none"
                    autoFocus
                  />
                </div>

                {/* Color Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Theme Color</label>
                  <div className="flex gap-2.5 items-center justify-between bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                    {BOARD_COLORS.map(c => {
                      const isSelected = newBoardColor === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setNewBoardColor(c.id)}
                          className={cn(
                            "relative grid size-8 place-items-center rounded-full text-white shadow-sm transition hover:scale-105",
                            c.bg,
                            isSelected && "ring-4 " + c.ring
                          )}
                          title={c.name}
                        >
                          {isSelected && <Check className="size-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3.5 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl text-slate-700 hover:bg-slate-50"
                    onClick={() => setIsBoardModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-200 hover:from-amber-600 hover:to-orange-600"
                  >
                    Create Board
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AppShell>
    </LiveblocksProvider>
  );
}

interface CollaborativeBoardContentProps {
  activeBoard: KanbanBoard;
  columns: KanbanColumn[];
  loading: boolean;
  tasks: KanbanTask[];
  setTasks: React.Dispatch<React.SetStateAction<KanbanTask[]>>;
  setColumns: React.Dispatch<React.SetStateAction<KanbanColumn[]>>;
  isAddingColumn: boolean;
  setIsAddingColumn: React.Dispatch<React.SetStateAction<boolean>>;
  newColumnName: string;
  setNewColumnName: React.Dispatch<React.SetStateAction<string>>;
  editingColumnId: number | null;
  setEditingColumnId: React.Dispatch<React.SetStateAction<number | null>>;
  editingColumnName: string;
  setEditingColumnName: React.Dispatch<React.SetStateAction<string>>;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingTask: KanbanTask | null;
  setEditingTask: React.Dispatch<React.SetStateAction<KanbanTask | null>>;
  taskTargetColumnId: number | null;
  setTaskTargetColumnId: React.Dispatch<React.SetStateAction<number | null>>;
  taskTitle: string;
  setTaskTitle: React.Dispatch<React.SetStateAction<string>>;
  taskDescription: string;
  setTaskDescription: React.Dispatch<React.SetStateAction<string>>;
  taskDueDate: string;
  setTaskDueDate: React.Dispatch<React.SetStateAction<string>>;
  taskPriority: "low" | "medium" | "high";
  setTaskPriority: React.Dispatch<React.SetStateAction<"low" | "medium" | "high">>;
  taskSyncCalendar: boolean;
  setTaskSyncCalendar: React.Dispatch<React.SetStateAction<boolean>>;
  taskSyncNotes: boolean;
  setTaskSyncNotes: React.Dispatch<React.SetStateAction<boolean>>;
  taskLabels: Label[];
  setTaskLabels: React.Dispatch<React.SetStateAction<Label[]>>;
  tempTagText: string;
  setTempTagText: React.Dispatch<React.SetStateAction<string>>;
  tempTagColor: string;
  setTempTagColor: React.Dispatch<React.SetStateAction<string>>;
  draggedTask: KanbanTask | null;
  setDraggedTask: React.Dispatch<React.SetStateAction<KanbanTask | null>>;
  isDragOverColId: number | null;
  setIsDragOverColId: React.Dispatch<React.SetStateAction<number | null>>;
  
  handleCreateColumn: (e: React.FormEvent) => Promise<void>;
  handleRenameColumn: (columnId: number) => Promise<void>;
  handleDeleteColumn: (columnId: number) => Promise<void>;
  openAddTaskModal: (columnId: number) => void;
  openEditTaskModal: (task: KanbanTask, e: React.MouseEvent) => void;
  handleAddLocalTag: () => void;
  handleRemoveLocalTag: (text: string) => void;
  handleSaveTask: (e: React.FormEvent) => Promise<void>;
  handleDeleteTask: () => Promise<void>;
  handleDragStart: (e: React.DragEvent, task: KanbanTask) => void;
  handleDragOverColumn: (e: React.DragEvent, columnId: number) => void;
  handleDragLeaveColumn: (e: React.DragEvent) => void;
  handleDropColumn: (columnId: number) => Promise<void>;
  handleDropCard: (e: React.DragEvent, targetIndex: number, targetColumnId: number) => Promise<void>;
  getBoardColor: (colorId: string) => any;
}

function CollaborativeBoardContent({
  activeBoard,
  columns,
  loading,
  tasks,
  setTasks,
  setColumns,
  isAddingColumn,
  setIsAddingColumn,
  newColumnName,
  setNewColumnName,
  editingColumnId,
  setEditingColumnId,
  editingColumnName,
  setEditingColumnName,
  isTaskModalOpen,
  setIsTaskModalOpen,
  editingTask,
  setEditingTask,
  taskTargetColumnId,
  setTaskTargetColumnId,
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  taskDueDate,
  setTaskDueDate,
  taskPriority,
  setTaskPriority,
  taskSyncCalendar,
  setTaskSyncCalendar,
  taskSyncNotes,
  setTaskSyncNotes,
  taskLabels,
  setTaskLabels,
  tempTagText,
  setTempTagText,
  tempTagColor,
  setTempTagColor,
  draggedTask,
  setDraggedTask,
  isDragOverColId,
  setIsDragOverColId,
  handleCreateColumn,
  handleRenameColumn,
  handleDeleteColumn,
  openAddTaskModal,
  openEditTaskModal,
  handleAddLocalTag,
  handleRemoveLocalTag,
  handleSaveTask,
  handleDeleteTask,
  handleDragStart,
  handleDragOverColumn,
  handleDragLeaveColumn,
  handleDropColumn,
  handleDropCard,
  getBoardColor
}: CollaborativeBoardContentProps) {
  // Liveblocks presence & comments hooks
  const others = useOthers();
  const self = useSelf();
  const { threads } = useThreads();
  const createThread = useCreateThread();

  // Local state for board sharing/collaboration modal
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [shares, setShares] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);

  // Load shares when collaboration modal is opened
  const fetchShares = async () => {
    try {
      setLoadingShares(true);
      const data = await getBoardShares(activeBoard.id);
      setShares(data);
    } catch (error) {
      console.error("Failed to fetch board shares:", error);
    } finally {
      setLoadingShares(false);
    }
  };

  useEffect(() => {
    if (isCollaborationOpen) {
      fetchShares();
    }
  }, [activeBoard.id, isCollaborationOpen]);

  // Invite handler
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      const newShare = await shareBoard(activeBoard.id, inviteEmail.trim());
      setShares(prev => [...prev, newShare]);
      setInviteEmail("");
    } catch (error: any) {
      alert(error.message || "Failed to invite collaborator");
    } finally {
      setInviting(false);
    }
  };

  // Remove share handler
  const handleRemoveInvite = async (shareId: number) => {
    if (!confirm("Are you sure you want to remove this user's access?")) return;
    try {
      await removeShare(activeBoard.id, shareId);
      setShares(prev => prev.filter(s => s.id !== shareId));
    } catch (error: any) {
      alert(error.message || "Failed to remove collaborator");
    }
  };

  // Get comments count for a specific task
  const getCommentCount = (taskId: number) => {
    if (!threads) return 0;
    const taskThreads = threads.filter(t => t.metadata.taskId === taskId.toString());
    return taskThreads.reduce((acc, t) => acc + t.comments.length, 0);
  };

  // Filter threads for active editing task
  const activeTaskThreads = threads
    ? threads.filter(t => t.metadata.taskId === editingTask?.id.toString())
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Board Header Details */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className={cn("size-3.5 rounded-full shadow-sm", getBoardColor(activeBoard.color).bg)} />
          <h2 className="text-xl font-bold text-slate-900">{activeBoard.name}</h2>
        </div>

        {/* Collaboration & Column Add Options */}
        <div className="flex items-center gap-2">
          {/* Active Collaborators Avatars */}
          <div className="flex items-center gap-3 bg-white/50 border border-slate-100/80 rounded-2xl px-3 py-1.5 shadow-sm backdrop-blur-sm mr-1">
            <div className="flex items-center -space-x-2 overflow-hidden">
              {self?.info && (
                <div
                  key="self"
                  className="relative inline-block size-7 rounded-full ring-2 ring-white bg-slate-100 shrink-0"
                  title={`${self.info.name || "You"} (You)`}
                >
                  <img
                    className="size-full rounded-full"
                    src={self.info.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(self.id || "self")}`}
                    alt={self.info.name || "You"}
                  />
                  <span className="absolute bottom-0 right-0 block size-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
              )}
              {others.map(({ connectionId, info }) => (
                <div
                  key={connectionId}
                  className="relative inline-block size-7 rounded-full ring-2 ring-white bg-slate-100 shrink-0 animate-fade-in"
                  title={info?.name || "Collaborator"}
                >
                  <img
                    className="size-full rounded-full"
                    src={info?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${connectionId}`}
                    alt={info?.name || "Collaborator"}
                  />
                  <span className="absolute bottom-0 right-0 block size-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
              ))}
            </div>

            {/* Invite Button */}
            <Button
              type="button"
              variant="outline"
              className="h-7.5 rounded-lg border-amber-200 bg-white/90 text-amber-700 hover:bg-amber-50 font-bold text-[10px] flex items-center gap-1 shadow-sm px-2.5 cursor-pointer"
              onClick={() => setIsCollaborationOpen(true)}
            >
              <Users className="size-3 text-amber-500" />
              <span>Share</span>
            </Button>
          </div>

          {/* Add Column Option */}
          {columns.length < 5 ? (
            isAddingColumn ? (
              <form onSubmit={handleCreateColumn} className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <input
                  type="text"
                  required
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Column name..."
                  className="h-8 px-2 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none w-[130px]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="grid size-7 place-items-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingColumn(false);
                    setNewColumnName("");
                  }}
                  className="grid size-7 place-items-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="size-3.5" />
                </button>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-amber-200 bg-white/80 text-amber-700 hover:bg-amber-50 font-bold text-xs"
                onClick={() => setIsAddingColumn(true)}
              >
                <Plus className="mr-1 size-3.5" />
                Add Column
              </Button>
            )
          ) : (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
              Max 5 columns reached
            </span>
          )}
        </div>
      </div>

      {/* Columns Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          <Sparkles className="size-8 text-amber-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 mt-2">Syncing Kanban Board...</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none scrollbar-thin">
          {columns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/80 rounded-[2rem] bg-white/40 p-12 text-center min-h-[300px]">
              <AlertCircle className="size-8 text-amber-500 mb-2" />
              <p className="text-sm font-bold text-slate-600">No columns in this board</p>
              <p className="text-xs text-slate-400 mt-0.5">Click "Add Column" above to add lists.</p>
            </div>
          ) : (
            columns.map(col => {
              const colTasks = tasks.filter(t => t.columnId === col.id).sort((a, b) => a.position - b.position);
              const isDragActive = isDragOverColId === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOverColumn(e, col.id)}
                  onDragLeave={handleDragLeaveColumn}
                  onDrop={() => handleDropColumn(col.id)}
                  className={cn(
                    "w-[260px] shrink-0 flex flex-col rounded-2xl border bg-white/60 p-3 shadow-sm min-h-[420px] transition-all duration-200 border-slate-100",
                    isDragActive && "border-2 border-dashed border-amber-500 bg-amber-50/40 ring-2 ring-amber-100"
                  )}
                >
                  {/* Column Header */}
                  <div className="mb-3 flex items-center justify-between">
                    {editingColumnId === col.id ? (
                      <div className="flex items-center gap-1 w-full bg-white px-1 py-0.5 rounded-lg border border-slate-200 shadow-inner">
                        <input
                          type="text"
                          value={editingColumnName}
                          onChange={(e) => setEditingColumnName(e.target.value)}
                          className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none w-full px-1"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameColumn(col.id)}
                          className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition"
                        >
                          <Check className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingColumnId(null);
                            setEditingColumnName("");
                          }}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 transition"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full group">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-500 truncate max-w-[130px]">{col.name}</p>
                          <span className="grid place-items-center h-5 px-1.5 rounded-full bg-white text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100/50">
                            {colTasks.length}
                          </span>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingColumnId(col.id);
                              setEditingColumnName(col.name);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition mr-0.5 cursor-pointer"
                            title="Rename Column"
                          >
                            <Edit2 className="size-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(col.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition cursor-pointer"
                            title="Delete Column"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Task List */}
                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[360px] pb-2 scrollbar-thin select-none">
                    {colTasks.map((task, idx) => {
                      const priStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
                      const labelsList: Label[] = JSON.parse(task.labels || "[]");
                      const commentCount = getCommentCount(task.id);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDrop={(e) => handleDropCard(e, idx, col.id)}
                          onClick={(e) => openEditTaskModal(task, e)}
                          className={cn(
                            "p-3 rounded-xl border bg-white flex flex-col gap-2 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing border-slate-100 relative hover:shadow-md hover:scale-[1.01] hover:border-amber-200/50"
                          )}
                        >
                          {/* Task Title */}
                          <p className="text-xs font-bold text-slate-800 leading-snug break-words">{task.title}</p>
                          
                          {/* Description Snippet */}
                          {task.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>
                          )}

                          {/* Labels */}
                          {labelsList.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {labelsList.map((lbl, lIdx) => {
                                const tagStyle = TAG_COLORS.find(tc => tc.id === lbl.color) || TAG_COLORS[0];
                                return (
                                  <span
                                    key={`${lbl.text}-${lIdx}`}
                                    className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-wide", tagStyle.bg)}
                                  >
                                    {lbl.text}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Card Footer Detail */}
                          <div className="flex items-center justify-between gap-1.5 mt-1 border-t border-slate-100 pt-2 text-[10px] font-semibold text-slate-500">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Priority Dot */}
                              <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider", priStyle.bg)}>
                                <span className={cn("size-1 rounded-full", priStyle.dot)} />
                                {task.priority}
                              </span>
                              
                              {/* Due Date Indicator */}
                              {task.dueDate && (
                                <span className="flex items-center gap-0.5 text-slate-400 font-bold text-[9px]">
                                  <Calendar className="size-3" />
                                  {task.dueDate.split("-").slice(1).join("/")}
                                </span>
                              )}

                              {/* Comment count badge */}
                              {commentCount > 0 && (
                                <span className="flex items-center gap-0.5 text-cyan-600 font-bold text-[9px] bg-cyan-50 border border-cyan-100/50 px-1 py-0.5 rounded-md" title="Comments">
                                  <MessageSquare className="size-3 text-cyan-500" />
                                  <span>{commentCount}</span>
                                </span>
                              )}
                            </div>

                            {/* Sync Indicators */}
                            <div className="flex items-center gap-1">
                              {task.syncCalendar && (
                                <span className="p-0.5 bg-orange-50 border border-orange-100 rounded text-orange-600" title="Synced with Calendar">
                                  <Calendar className="size-2.5" />
                                </span>
                              )}
                              {task.syncNotes && (
                                <span className="p-0.5 bg-rose-50 border border-rose-100 rounded text-rose-600" title="Linked to Notes">
                                  <NotebookPen className="size-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Task Trigger */}
                  <button
                    onClick={() => openAddTaskModal(col.id)}
                    className="mt-2 w-full h-8 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-white/50 text-[11px] font-bold text-slate-500 hover:bg-white hover:text-slate-800 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="size-3.5 text-slate-400" />
                    Add Task
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Collaboration / Share Dialog */}
      {isCollaborationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCollaborationOpen(false)}
          />

          <div className="relative w-full max-w-md transform rounded-[2rem] border border-white/90 bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-1.5">
                <Users className="size-4.5 text-amber-500" />
                <span>Board Collaboration</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCollaborationOpen(false)}
                className="grid size-8 place-items-center rounded-full hover:bg-slate-100 text-slate-400 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Invite input form */}
            <form onSubmit={handleInvite} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invite member by email..."
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-400 focus:outline-none"
              />
              <Button
                type="submit"
                disabled={inviting}
                className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600 text-xs font-bold px-4"
              >
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </form>

            {/* List current shares */}
            <div className="mt-5">
              <h4 className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-2.5">Access Control</h4>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {loadingShares ? (
                  <div className="flex items-center justify-center py-6 text-slate-400 text-xs font-semibold italic">
                    Loading board access list...
                  </div>
                ) : shares.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-[11px] font-semibold">
                    Not shared with other users yet.
                  </div>
                ) : (
                  shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                          <img
                            className="size-full rounded-full"
                            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(share.email)}`}
                            alt={share.email}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {share.userName || share.email.split("@")[0]}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{share.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!share.hasAccount ? (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600">
                            Pending
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                            Active
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveInvite(share.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition cursor-pointer"
                          title="Revoke Access"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal (Add / Edit) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsTaskModalOpen(false);
              setEditingTask(null);
            }}
          />

          <div className={cn(
            "relative w-full transform rounded-[2rem] border border-white/90 bg-white/95 p-5 shadow-2xl backdrop-blur-xl transition-all max-h-[90vh] overflow-y-auto scrollbar-thin",
            editingTask ? "max-w-3xl" : "max-w-md"
          )}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-1.5">
                <Sparkles className="size-4.5 text-amber-500" />
                <span>{editingTask ? "Edit Sprint Task" : "Add Board Task"}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setEditingTask(null);
                }}
                className="grid size-8 place-items-center rounded-full hover:bg-slate-100 text-slate-400 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Split layout: form on the left, discussion on the right */}
            <div className={cn("grid gap-5 mt-4", editingTask ? "md:grid-cols-[1.2fr_1fr]" : "grid-cols-1")}>
              
              {/* Left Side: Form Details */}
              <form onSubmit={handleSaveTask} className="flex flex-col gap-4">
                
                {/* Task Title */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="task-title" className="text-xs font-bold text-slate-600">Task Title</label>
                  <input
                    id="task-title"
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task title or description summary..."
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-400 focus:outline-none"
                    autoFocus
                  />
                </div>

                {/* Task Description */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="task-desc" className="text-xs font-bold text-slate-600">Description</label>
                  <textarea
                    id="task-desc"
                    rows={2}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Add details, notes, or list subtasks..."
                    className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Due Date & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="task-due" className="text-xs font-bold text-slate-600">Due Date</label>
                    <input
                      id="task-due"
                      type="date"
                      required
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="task-priority" className="text-xs font-bold text-slate-600">Priority</label>
                    <select
                      id="task-priority"
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-amber-400 focus:outline-none"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>

                {/* Label Tag Builder */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Labels</label>
                  
                  {/* Current tags */}
                  {taskLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {taskLabels.map((lbl, idx) => {
                        const colStyle = TAG_COLORS.find(tc => tc.id === lbl.color) || TAG_COLORS[0];
                        return (
                          <span
                            key={`${lbl.text}-${idx}`}
                            className={cn("text-[9px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1", colStyle.bg)}
                          >
                            <span>{lbl.text}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLocalTag(lbl.text)}
                              className="text-slate-400 hover:text-slate-950 font-bold cursor-pointer"
                            >
                              <X className="size-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Add new tag */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempTagText}
                      onChange={(e) => setTempTagText(e.target.value)}
                      placeholder="New tag name..."
                      className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                    
                    {/* Tag color select */}
                    <div className="flex gap-1 items-center bg-slate-50 px-2 rounded-xl border border-slate-100">
                      {TAG_COLORS.map(tc => {
                        const isSel = tempTagColor === tc.id;
                        const cItem = BOARD_COLORS.find(bc => bc.id === tc.id) || BOARD_COLORS[0];
                        return (
                          <button
                            key={tc.id}
                            type="button"
                            onClick={() => setTempTagColor(tc.id)}
                            className={cn(
                              "size-5 rounded-full ring-offset-1 shrink-0 cursor-pointer",
                              cItem.bg,
                              isSel && "ring-2 ring-slate-400"
                            )}
                          />
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLocalTag}
                      className="h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Sync toggles */}
                <div className="flex flex-col gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-orange-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Sync with Calendar</p>
                        <p className="text-[10px] text-slate-400">Creates/updates calendar task event dynamically</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={taskSyncCalendar}
                      onChange={(e) => setTaskSyncCalendar(e.target.checked)}
                      className="size-4 accent-amber-500 rounded focus:ring-amber-400 focus:ring-2 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <div className="flex items-center gap-2">
                      <NotebookPen className="size-4 text-rose-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Link with Notes</p>
                        <p className="text-[10px] text-slate-400">Display linked notes flag on task card</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={taskSyncNotes}
                      onChange={(e) => setTaskSyncNotes(e.target.checked)}
                      className="size-4 accent-amber-500 rounded focus:ring-amber-400 focus:ring-2 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-1">
                  {editingTask ? (
                    <button
                      type="button"
                      onClick={handleDeleteTask}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setIsTaskModalOpen(false);
                        setEditingTask(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-200 hover:from-amber-600 hover:to-orange-600"
                    >
                      Save Task
                    </Button>
                  </div>
                </div>
              </form>

              {/* Right Side: Discussions (Only visible on Edit Task) */}
              {editingTask && (
                <div className="border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-5 flex flex-col h-full min-h-[300px]">
                  <h4 className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-3 flex items-center gap-1.5">
                    <MessageSquare className="size-4 text-cyan-500 shrink-0" />
                    <span>Discussions</span>
                  </h4>

                  {/* Comments lists container */}
                  <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-3 scrollbar-thin">
                    {activeTaskThreads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/40 border border-dashed border-slate-200/65 rounded-[1.5rem]">
                        <MessageSquare className="size-7 text-slate-300 mb-1.5" />
                        <p className="text-[11px] font-bold text-slate-400">No discussions yet</p>
                        <p className="text-[9px] text-slate-400/80 px-6 mt-0.5">Start a real-time discussion thread below.</p>
                      </div>
                    ) : (
                      activeTaskThreads.map(thread => (
                        <Thread key={thread.id} thread={thread} />
                      ))
                    )}
                  </div>

                  {/* Reply/Composer Input */}
                  <div className="mt-3.5 border-t border-slate-100 pt-3">
                    {activeTaskThreads.length === 0 ? (
                      <Composer
                        metadata={{ taskId: editingTask.id.toString() }}
                      />
                    ) : (
                      <Composer
                        threadId={activeTaskThreads[0].id}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
