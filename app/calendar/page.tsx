"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  X,
  Sparkles,
  Inbox,
  Calendar,
  Layers,
  AlertCircle
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getCalendarItems,
  saveCalendarItem,
  deleteCalendarItem,
  updateCalendarItemDate
} from "./actions";

// Types matching the DB schema
interface CalendarItem {
  id: number;
  userId: number | null;
  title: string;
  description: string | null;
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:MM
  type: string; // 'task' | 'reminder'
  category: string; // 'work' | 'learning' | 'urgent' | 'ideas' | 'personal'
  createdAt: Date;
}

// Preset Categories with matching color classes
const CATEGORIES = [
  { id: "work", name: "Work / Project", color: "emerald", bg: "bg-emerald-100/80 text-emerald-900 border-emerald-200/80", dot: "bg-emerald-500", text: "text-emerald-700" },
  { id: "learning", name: "AI / Learning", color: "cyan", bg: "bg-cyan-100/80 text-cyan-900 border-cyan-200/80", dot: "bg-cyan-500", text: "text-cyan-700" },
  { id: "urgent", name: "Urgent", color: "orange", bg: "bg-orange-100/80 text-orange-900 border-orange-200/80", dot: "bg-orange-500", text: "text-orange-700" },
  { id: "ideas", name: "Ideas / Creative", color: "violet", bg: "bg-violet-100/80 text-violet-900 border-violet-200/80", dot: "bg-violet-500", text: "text-violet-700" },
  { id: "personal", name: "Personal", color: "rose", bg: "bg-rose-100/80 text-rose-900 border-rose-200/80", dot: "bg-rose-500", text: "text-rose-700" }
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Month navigation state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11

  // Drag and drop state
  const [activeDragDate, setActiveDragDate] = useState<string | null>(null);
  const [isDragOverDraftPanel, setIsDragOverDraftPanel] = useState(false);

  // Quick draft state
  const [quickDraftTitle, setQuickDraftTitle] = useState("");
  const [quickDraftType, setQuickDraftType] = useState<"task" | "reminder">("task");

  // Modal / Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalType, setModalType] = useState<"task" | "reminder">("task");
  const [modalDate, setModalDate] = useState("");
  const [modalTime, setModalTime] = useState("");
  const [modalCategory, setModalCategory] = useState("work");

  // Load items on mount and month change
  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getCalendarItems();
      // Ensure serialized formats if dates returned as string/Date objects
      const formattedData: CalendarItem[] = data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }));
      setItems(formattedData);
    } catch (error) {
      console.error("Failed to load calendar items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Prev/Next month handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Grid calculation helpers
  const isTodayDate = (y: number, m: number, d: number) => {
    const today = new Date();
    return today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  };

  const getDaysGrid = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const grid: { dateString: string; dayOfMonth: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Prepend previous month's trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      grid.push({
        dateString: `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        dayOfMonth: d,
        isCurrentMonth: false,
        isToday: isTodayDate(prevY, prevM, d)
      });
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        dateString: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        dayOfMonth: i,
        isCurrentMonth: true,
        isToday: isTodayDate(currentYear, currentMonth, i)
      });
    }

    // Append next month's leading days (pad to 42 cells total)
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      grid.push({
        dateString: `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        dayOfMonth: i,
        isCurrentMonth: false,
        isToday: isTodayDate(nextY, nextM, i)
      });
    }

    return grid;
  };

  const getCategoryDetails = (catId: string) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("text/plain", id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverCell = (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    if (activeDragDate !== dateString) {
      setActiveDragDate(dateString);
    }
  };

  const handleDragLeaveCell = (e: React.DragEvent) => {
    e.preventDefault();
    setActiveDragDate(null);
  };

  const handleDropOnCell = async (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    setActiveDragDate(null);
    const idStr = e.dataTransfer.getData("text/plain");
    if (!idStr) return;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return;

    // Optimistically update
    const prevItems = [...items];
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, date: dateString } : item))
    );

    try {
      await updateCalendarItemDate(id, dateString);
    } catch (error) {
      console.error("Drop save failed:", error);
      setItems(prevItems); // revert
    }
  };

  const handleDragOverDraftPanel = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOverDraftPanel) {
      setIsDragOverDraftPanel(true);
    }
  };

  const handleDragLeaveDraftPanel = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDraftPanel(false);
  };

  const handleDropOnDraftPanel = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDraftPanel(false);
    const idStr = e.dataTransfer.getData("text/plain");
    if (!idStr) return;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return;

    // Optimistically update
    const prevItems = [...items];
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, date: null } : item))
    );

    try {
      await updateCalendarItemDate(id, null);
    } catch (error) {
      console.error("Drop draft failed:", error);
      setItems(prevItems); // revert
    }
  };

  // Quick draft add
  const handleQuickDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDraftTitle.trim()) return;

    try {
      const newItem = await saveCalendarItem({
        title: quickDraftTitle.trim(),
        type: quickDraftType,
        category: "work",
        date: null,
        time: null,
        description: ""
      });

      // Update state
      setItems(prev => [...prev, newItem as any]);
      setQuickDraftTitle("");
    } catch (error) {
      console.error("Quick draft save failed:", error);
    }
  };

  // Add / Edit form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    try {
      const payload = {
        id: editingItem?.id,
        title: modalTitle.trim(),
        description: modalDescription.trim() || null,
        type: modalType,
        date: modalDate || null,
        time: modalTime || null,
        category: modalCategory
      };

      const saved = await saveCalendarItem(payload);

      if (editingItem) {
        setItems(prev => prev.map(item => (item.id === editingItem.id ? (saved as any) : item)));
      } else {
        setItems(prev => [...prev, saved as any]);
      }

      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Modal save failed:", error);
    }
  };

  const handleDeleteItem = async () => {
    if (!editingItem) return;
    if (!confirm("Are you sure you want to delete this calendar item?")) return;

    try {
      await deleteCalendarItem(editingItem.id);
      setItems(prev => prev.filter(item => item.id !== editingItem.id));
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const openAddModal = (dateString: string | null) => {
    setEditingItem(null);
    setModalTitle("");
    setModalDescription("");
    setModalType("task");
    setModalDate(dateString || "");
    setModalTime("");
    setModalCategory("work");
    setIsModalOpen(true);
  };

  const openEditModal = (item: CalendarItem, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening empty date modal
    setEditingItem(item);
    setModalTitle(item.title);
    setModalDescription(item.description || "");
    setModalType(item.type as "task" | "reminder");
    setModalDate(item.date || "");
    setModalTime(item.time || "");
    setModalCategory(item.category);
    setIsModalOpen(true);
  };

  // Separate lists
  const scheduledItems = items.filter(item => item.date !== null);
  const draftItems = items.filter(item => item.date === null);
  const daysGrid = getDaysGrid();

  return (
    <AppShell>
      <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/90 bg-white/74 p-4 shadow-[0_20px_60px_rgba(52,86,118,0.1)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            Calendar rhythm
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Plan your schedule & organize thoughts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A cozy space to assign tasks, reminders, and draft ideas. Drag and drop to schedule or reschedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-cyan-100 bg-white/85 text-slate-700 hover:bg-cyan-50"
            onClick={handleGoToToday}
          >
            Today
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200/70 hover:from-orange-600 hover:to-amber-600"
            onClick={() => openAddModal(null)}
          >
            <Plus className="mr-2 size-4" />
            New Draft Task
          </Button>
        </div>
      </header>

      {/* Main Calendar + Panel Layout */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Left Side: Monthly Calendar */}
        <section className="flex flex-col rounded-3xl border border-white/90 bg-white/78 p-5 shadow-[0_10px_40px_rgba(47,75,107,0.05)] backdrop-blur-md">
          {/* Calendar Header / Nav */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
              <Calendar className="size-6 text-orange-500" />
              <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-xs font-bold uppercase tracking-wider text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          {loading && items.length === 0 ? (
            <div className="grid grid-cols-7 gap-1.5 min-h-[500px] border border-dashed border-slate-200 rounded-2xl place-items-center bg-slate-50/50">
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="size-8 text-orange-500 animate-spin" />
                <p className="text-sm font-semibold text-slate-500">Syncing database...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {daysGrid.map((day, idx) => {
                const cellItems = scheduledItems.filter(item => item.date === day.dateString);
                const isDragActive = activeDragDate === day.dateString;

                return (
                  <div
                    key={`${day.dateString}-${idx}`}
                    onDragOver={(e) => handleDragOverCell(e, day.dateString)}
                    onDragLeave={handleDragLeaveCell}
                    onDrop={(e) => handleDropOnCell(e, day.dateString)}
                    onClick={() => openAddModal(day.dateString)}
                    className={cn(
                      "min-h-[110px] rounded-2xl border bg-white/70 p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm relative group hover:bg-white hover:border-orange-200 hover:shadow-md",
                      day.isCurrentMonth ? "border-slate-100" : "border-slate-100/50 bg-slate-50/30 opacity-60",
                      day.isToday && "ring-2 ring-orange-400 bg-orange-50/20 border-orange-200",
                      isDragActive && "border-2 border-dashed border-orange-500 bg-orange-50/50 scale-[0.98] ring-2 ring-orange-200"
                    )}
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-xs font-bold text-slate-700",
                          day.isToday && "bg-orange-500 text-white shadow-sm shadow-orange-200"
                        )}
                      >
                        {day.dayOfMonth}
                      </span>
                      {day.isToday && (
                        <span className="text-[9px] font-black uppercase text-orange-600 tracking-wider">Today</span>
                      )}
                    </div>

                    {/* Cell Items (Tasks/Reminders) */}
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] scrollbar-thin select-none">
                      {cellItems.map(item => {
                        const cat = getCategoryDetails(item.category);
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={(e) => openEditModal(item, e)}
                            className={cn(
                              "text-[11px] font-bold py-1 px-1.5 rounded-lg border flex items-center justify-between gap-1 shadow-sm transition-all hover:scale-102 hover:shadow-md",
                              cat.bg
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={cn("size-1.5 shrink-0 rounded-full", cat.dot)} />
                              <span className="truncate">{item.title}</span>
                            </div>
                            {item.time && (
                              <span className="text-[9px] opacity-75 shrink-0 flex items-center gap-0.5 font-semibold">
                                <Clock className="size-2.5" />
                                {item.time}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Draft Task Panel */}
        <section
          onDragOver={handleDragOverDraftPanel}
          onDragLeave={handleDragLeaveDraftPanel}
          onDrop={handleDropOnDraftPanel}
          className={cn(
            "flex flex-col h-full rounded-3xl border border-white/90 bg-white/78 p-5 shadow-[0_10px_40px_rgba(47,75,107,0.05)] backdrop-blur-md transition-all duration-300",
            isDragOverDraftPanel && "border-2 border-dashed border-orange-500 bg-orange-50/50 scale-[0.98]"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <Inbox className="size-5 text-orange-500" />
              <span>Draft Tasks</span>
            </h2>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
              {draftItems.length}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Unscheduled tasks. Drag one onto any calendar day, or drag calendar events back here to clear their dates.
          </p>

          {/* Quick Draft Form */}
          <form onSubmit={handleQuickDraftSubmit} className="mb-4 flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={quickDraftTitle}
                onChange={(e) => setQuickDraftTitle(e.target.value)}
                placeholder="Quick draft title..."
                className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-orange-400 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 size-6 grid place-items-center rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuickDraftType("task")}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                    quickDraftType === "task" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-600"
                  )}
                >
                  Task
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDraftType("reminder")}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                    quickDraftType === "reminder" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-600"
                  )}
                >
                  Reminder
                </button>
              </div>
            </div>
          </form>

          {/* Draft Items List */}
          <div className="flex-1 overflow-y-auto max-h-[420px] pr-1 flex flex-col gap-2 min-h-[120px] scrollbar-thin">
            {draftItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center bg-slate-50/30">
                <Inbox className="size-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-400">No draft tasks</p>
                <p className="text-[10px] text-slate-400 max-w-[160px] mt-1">Add a quick draft above or click "+ Add Draft"</p>
              </div>
            ) : (
              draftItems.map(item => {
                const cat = getCategoryDetails(item.category);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onClick={(e) => openEditModal(item, e)}
                    className={cn(
                      "p-3 rounded-2xl border flex flex-col gap-1.5 shadow-sm transition-all hover:scale-102 hover:shadow-md cursor-pointer bg-white relative group border-slate-100"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate flex-1">{item.title}</p>
                      <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border tracking-wider", cat.bg)}>
                        {item.type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn("size-2 rounded-full", cat.dot)} />
                      <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{cat.name}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Modal Dialog for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsModalOpen(false);
              setEditingItem(null);
            }}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md transform rounded-[2rem] border border-white/90 bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Sparkles className="size-5 text-orange-500" />
                <span>{editingItem ? "Edit Calendar Item" : "Create Calendar Item"}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }}
                className="grid size-8 place-items-center rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="mt-4 flex flex-col gap-4">
              {/* Type Switcher */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalType("task")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold rounded-xl border transition",
                    modalType === "task" ? "bg-orange-50 border-orange-200 text-orange-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Task
                </button>
                <button
                  type="button"
                  onClick={() => setModalType("reminder")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold rounded-xl border transition",
                    modalType === "reminder" ? "bg-orange-50 border-orange-200 text-orange-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Reminder
                </button>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-xs font-bold text-slate-600">Title</label>
                <input
                  id="title"
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="What are you scheduling?"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-orange-400 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-xs font-bold text-slate-600">Description</label>
                <textarea
                  id="description"
                  rows={2}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Add notes or details..."
                  className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-orange-400 focus:outline-none resize-none"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="date" className="text-xs font-bold text-slate-600">Date (Optional)</label>
                  <input
                    id="date"
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-orange-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="time" className="text-xs font-bold text-slate-600">Time (Optional)</label>
                  <input
                    id="time"
                    type="time"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-orange-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Color Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const isActive = modalCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setModalCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition",
                          isActive ? cat.bg + " ring-2 ring-orange-200 scale-102" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <span className={cn("size-2 rounded-full", cat.dot)} />
                        <span>{cat.name.split(" / ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={handleDeleteItem}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
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
                      setIsModalOpen(false);
                      setEditingItem(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-amber-600"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
