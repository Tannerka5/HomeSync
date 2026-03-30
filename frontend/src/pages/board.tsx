import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Calendar,
  FileText,
  CheckCircle2,
  Circle,
  File,
  ExternalLink,
  LayoutDashboard,
  GripVertical,
  Upload,
  Loader2,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Trash2,
  Pencil,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingChatAction, ListingHeartAction } from "@/components/listing-actions";

const VISION_BOARD_ITEMS = [
  {
    id: "vision-1",
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=400&q=80",
    title: "Modern Kitchen",
  },
  {
    id: "vision-2",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80",
    title: "Cozy Living Room",
  },
  {
    id: "vision-3",
    image:
      "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=400&q=80",
    title: "Minimalist Entryway",
  },
  {
    id: "vision-4",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80",
    title: "Luxury Bathroom",
  },
];

type BoardItem = {
  id: string;
  numericId: number;
  listingId?: number;
  type: string;
  title: string;
  content: string;
  status: "To Do" | "In Progress" | "Done";
  date: string;
};

type ListingCandidateContent = {
  address?: string;
  mapsUrl?: string;
  price?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  image?: string;
  description?: string;
};

type ListingDetails = {
  id: number;
  title: string;
  price: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  image?: string;
  image_urls?: string[];
  description?: string;
  status?: string;
};

export default function BoardPage() {
  const [visionItems, setVisionItems] = useState(VISION_BOARD_ITEMS);
  const [tasks, setTasks] = useState<BoardItem[]>([]);
  const [notes, setNotes] = useState<BoardItem[]>([]);
  const [documents, setDocuments] = useState<BoardItem[]>([]);
  const [listingCandidates, setListingCandidates] = useState<BoardItem[]>([]);
  const [taskMessage, setTaskMessage] = useState<string>("");
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [chats, setChats] = useState<Array<{ id: number; name: string; role: string }>>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatSending, setChatSending] = useState(false);
  const [chatSendError, setChatSendError] = useState<string | null>(null);
  const [hasLoadedChatsForDialogOpen, setHasLoadedChatsForDialogOpen] = useState(false);
  const [listingDetailsById, setListingDetailsById] = useState<Record<number, ListingDetails>>({});
  const [listingDetailsLoading, setListingDetailsLoading] = useState(false);
  const visionFileInputRef = useRef<HTMLInputElement | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docNotes, setDocNotes] = useState("");
  const [isDocOpen, setIsDocOpen] = useState(false);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } catch {
      return null;
    }
  };

  const createBoardItem = async (itemType: string, title: string, content: string, dueDate?: string) => {
    try {
      let formattedDate = dueDate;
      if (formattedDate && formattedDate.length === 10) {
        formattedDate = `${formattedDate}T00:00:00Z`;
      }

      const res = await fetch("/api/board/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemType, title: title || "Untitled", bodyText: content, dueDate: formattedDate }),
      });
      if (!res.ok) throw new Error("Failed to create item");
      const item = await res.json();
      if (itemType === "task") setTasks(p => [item, ...p]);
      if (itemType === "document") setDocuments(p => [item, ...p]);
      if (itemType === "note") setNotes(p => [item, ...p]);
    } catch (err) {
      setTaskMessage("Failed to create item");
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    setIsUploading(true);
    await createBoardItem("task", taskTitle, "", taskDueDate || undefined);
    setTaskTitle(""); setTaskDueDate(""); setIsTaskOpen(false);
    setIsUploading(false);
  };

  const handleCreateNote = async () => {
    if (!noteTitle.trim()) return;
    setIsUploading(true);
    await createBoardItem("note", noteTitle, noteContent);
    setNoteTitle(""); setNoteContent(""); setIsNoteOpen(false);
    setIsUploading(false);
  };

  const handleCreateDocument = async () => {
    if (!docTitle.trim() || !docFile) return;
    setIsUploading(true);
    const url = await uploadFile(docFile);
    if (!url) {
      setTaskMessage("File upload failed");
      setIsUploading(false);
      return;
    }
    const content = docNotes ? `${url}\n\nNotes:\n${docNotes}` : url;
    await createBoardItem("document", docTitle, content);
    setDocTitle(""); setDocFile(null); setDocNotes(""); setIsDocOpen(false);
    setIsUploading(false);
  };

  async function handleVisionImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileUrl = await uploadFile(file);
    if (!fileUrl) {
      setTaskMessage("Vision image upload failed");
      setIsUploading(false);
      return;
    }

    try {
      const titleStr = file.name.replace(/\.[^/.]+$/, "") || "Vision Image";
      const res = await fetch("/api/board/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          itemType: "vision_board", 
          title: titleStr, 
          bodyText: fileUrl 
        }),
      });
      if (!res.ok) throw new Error("Failed to create item");
      const newBackendItem = await res.json();
      
      const newVisionItem = {
        id: `vision-${newBackendItem.numericId}`,
        image: fileUrl,
        title: titleStr,
      };

      setVisionItems((prev) => [...prev, newVisionItem]);
    } catch {
      setTaskMessage("Failed to save vision item");
    } finally {
      setIsUploading(false);
    }
    event.target.value = "";
  }

  async function deleteVisionItem(itemId: string) {
    const numericIdMatch = itemId.match(/vision-(\d+)/);
    if (numericIdMatch) {
      const numericId = numericIdMatch[1];
      try {
        await fetch(`/api/board/items/${numericId}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch { /* ignore */ }
    }
    setVisionItems((prev) => prev.filter((item) => item.id !== itemId));
  }
  
  function parseListingCandidateContent(content: string): ListingCandidateContent {
    try {
      const parsed = JSON.parse(content) as unknown;
      if (parsed && typeof parsed === "object") {
        return parsed as ListingCandidateContent;
      }
      return {};
    } catch {
      return {};
    }
  }

  useEffect(() => {
    document.title = "Board · HomeSync";
  }, []);

  useEffect(() => {
    async function loadItems() {
      try {
        const response = await fetch("/api/board/items", { credentials: "include" });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          setTaskMessage(payload.message ?? "Unable to load board items.");
          return;
        }

        const data = (await response.json()) as BoardItem[];
        setTasks(data.filter((d) => d.type === "task"));
        setNotes(data.filter((d) => d.type === "note"));
        setDocuments(data.filter((d) => d.type === "document"));
        setListingCandidates(
          data.filter((d) => d.type === "listing_candidate"),
        );
        const visionData = data.filter((d) => d.type === "vision_board");
        if (visionData.length > 0) {
          setVisionItems(visionData.map(d => ({ id: `vision-${d.numericId}`, image: d.content, title: d.title })));
        }
        setTaskMessage("");
      } catch {
        setTaskMessage("Could not reach backend. Start frontend and backend together with npm run dev.");
      }
    }

    loadItems();
  }, []);

  const selectedCandidate =
    selectedCandidateId !== null
      ? listingCandidates.find((c) => c.id === selectedCandidateId) ?? null
      : null;

  async function ensureListingDetails(listingId?: number) {
    if (typeof listingId !== "number") return;
    if (listingDetailsById[listingId]) return;

    setListingDetailsLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as ListingDetails;
      setListingDetailsById((prev) => ({ ...prev, [listingId]: data }));
    } catch {
      // Keep fallback candidate JSON when details endpoint fails.
    } finally {
      setListingDetailsLoading(false);
    }
  }

  useEffect(() => {
    if (!chatDialogOpen) return;
    if (hasLoadedChatsForDialogOpen) return;

    let cancelled = false;
    async function loadChats() {
      setChatsLoading(true);
      setChatsError(null);
      try {
        const res = await fetch("/api/chats", { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) setChatsError(body.message ?? "Failed to load chats.");
          return;
        }

        const data = (await res.json()) as Array<{ id: number; name: string; role: string }>;
        if (cancelled) return;
        setChats(data);
        setSelectedChatId(data.length > 0 ? data[0].id : null);
        setHasLoadedChatsForDialogOpen(true);
      } catch {
        if (!cancelled) setChatsError("Could not reach backend.");
      } finally {
        if (!cancelled) setChatsLoading(false);
      }
    }

    loadChats();
    return () => {
      cancelled = true;
    };
  }, [chatDialogOpen, hasLoadedChatsForDialogOpen]);

  function openChatDialogForCandidate(candidateId: string) {
    setSelectedCandidateId(candidateId);
    setChatDialogOpen(true);
    setHasLoadedChatsForDialogOpen(false);
    setChats([]);
    setSelectedChatId(null);
    setChatsError(null);
    setChatSendError(null);
    setChatSending(false);
  }

  function retryLoadChats() {
    setHasLoadedChatsForDialogOpen(false);
    setChats([]);
    setSelectedChatId(null);
    setChatsError(null);
  }

  async function removeCandidateFromBoard(candidate: BoardItem) {
    try {
      const response = await fetch(`/api/board/items/${candidate.numericId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) return;
      setListingCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
      if (selectedCandidateId === candidate.id) {
        setSelectedCandidateId(null);
      }
    } catch {
      // keep current UI state
    }
  }

  async function sendCandidateToChat() {
    if (!selectedCandidate || !selectedChatId) return;
    const parsed = parseListingCandidateContent(selectedCandidate.content);
    const address = parsed.address ?? selectedCandidate.title;
    const mapsUrl = parsed.mapsUrl ?? "";

    setChatSending(true);
    setChatSendError(null);
    try {
      const listingId =
        typeof selectedCandidate.listingId === "number"
          ? selectedCandidate.listingId
          : null;
      const listingUrl = listingId
        ? `${window.location.origin}/listings?listingId=${listingId}`
        : "";
      const messageText = `Shared a listing: ${selectedCandidate.title}${parsed.price ? ` (${parsed.price})` : ""}`;
      const res = await fetch(`/api/chats/${selectedChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          listingId
            ? {
                messageText,
                messageType: "listing_share",
                payload: {
                  listingId,
                  title: selectedCandidate.title,
                  price: parsed.price ?? "Saved Home",
                  address,
                  image: parsed.image,
                  listingUrl,
                  mapsUrl,
                },
              }
            : { messageText },
        ),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setChatSendError(body.message ?? "Unable to send message.");
        return;
      }

      setChatDialogOpen(false);
      setSelectedCandidateId(null);
    } catch {
      setChatSendError("Could not reach backend.");
    } finally {
      setChatSending(false);
    }
  }

  async function toggleTaskStatus(taskId: string) {
    const numericId = Number(taskId.replace("task-", ""));
    if (!Number.isInteger(numericId)) return;

    try {
      const response = await fetch(`/api/board/items/${numericId}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setTaskMessage(payload.message ?? "Failed to update task.");
        return;
      }

      const updatedTask = payload as BoardItem;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === updatedTask.id ? { ...t, status: updatedTask.status } : t
        )
      );

      setTaskMessage(`Updated "${updatedTask.title}" to ${updatedTask.status}.`);
    } catch {
      setTaskMessage("Unable to update task right now.");
    }
  }

  // ---- Edit/Delete state ----
  const [editingItem, setEditingItem] = useState<BoardItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");

  const deleteItem = async (numericId: number, type: "task" | "note" | "document") => {
    try {
      await fetch(`/api/board/items/${numericId}`, { method: "DELETE", credentials: "include" });
      if (type === "task") setTasks(p => p.filter(t => t.numericId !== numericId));
      if (type === "note") setNotes(p => p.filter(n => n.numericId !== numericId));
      if (type === "document") setDocuments(p => p.filter(d => d.numericId !== numericId));
    } catch { /* ignore */ }
  };

  const openEdit = (item: BoardItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    // Pre-fill date: tasks store it in item.date (formatted), send empty so PATCH doesn't overwrite
    setEditDate("");
  };

  const saveEdit = async () => {
    if (!editingItem || !editTitle.trim()) return;
    try {
      let dueDatePayload: string | undefined = undefined;
      if (editingItem.type === "task" && editDate) {
        dueDatePayload = `${editDate}T00:00:00Z`;
      }
      const res = await fetch(`/api/board/items/${editingItem.numericId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: editTitle, bodyText: editContent, ...(dueDatePayload ? { dueDate: dueDatePayload } : {}) }),
      });
      if (!res.ok) return;
      const updated: BoardItem = await res.json();
      if (editingItem.type === "task") setTasks(p => p.map(t => t.numericId === updated.numericId ? { ...t, ...updated } : t));
      if (editingItem.type === "note") setNotes(p => p.map(n => n.numericId === updated.numericId ? { ...n, ...updated } : n));
      setEditingItem(null);
    } catch { /* ignore */ }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(visionItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setVisionItems(items);
  };

  return (
    <div className="container mx-auto h-full px-4 py-6 md:py-10">
      {/* Header */}
      <section className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Collaboration Board
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Keep tasks, documents, and notes organized in one place while saving your inspiration below.
          </p>
        </div>
      </section>

      {/* Status / Error Message */}
      {taskMessage ? (
        <div className="mb-6 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {taskMessage}
        </div>
      ) : null}

      {/* Main board columns: Tasks, Documents, Notes */}
      <section className="mb-10 grid grid-cols-1 items-start gap-8 xl:grid-cols-3">
        {/* Tasks Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <span className="rounded-xl bg-primary/10 p-1.5 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                Tasks
              </h2>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">
                {tasks.length}
              </Badge>
            </div>

            <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full border-primary/20 hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="column-task-title">Task</Label>
                    <Input id="column-task-title" placeholder="What needs to be done?" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTask(); }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="column-due-date">Due Date</Label>
                    <Input id="column-due-date" type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                  </div>
                </div>

                <DialogFooter>
                  <Button disabled={isUploading || !taskTitle.trim()} onClick={handleCreateTask}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="group rounded-2xl border-border/50 transition-shadow hover:shadow-md"
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <button
                    className="mt-1 shrink-0 text-muted-foreground transition-colors hover:text-primary"
                    onClick={() => toggleTaskStatus(task.id)}
                    aria-label={`Toggle status for ${task.title}`}
                  >
                    {task.status === "Done" ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <p
                      className={`text-sm font-medium leading-none truncate ${
                        task.status === "Done"
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          task.status === "Done"
                            ? "secondary"
                            : task.status === "In Progress"
                            ? "default"
                            : "outline"
                        }
                        className="h-5 rounded-md px-2 text-[10px] font-bold uppercase tracking-wider"
                      >
                        {task.status}
                      </Badge>

                      {task.date ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 opacity-70" />
                          {task.date}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => openEdit(task)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${task.title}`}
                      onClick={() => deleteItem(task.numericId, "task")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Documents Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <span className="rounded-xl bg-blue-100 p-1.5 text-blue-700">
                  <File className="h-4 w-4" />
                </span>
                Documents
              </h2>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">
                {documents.length}
              </Badge>
            </div>

            <Dialog open={isDocOpen} onOpenChange={setIsDocOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full border-primary/20 hover:bg-primary/5"
                >
                  <Upload className="h-4 w-4" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Document</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-title">Document Title</Label>
                    <Input id="document-title" placeholder="Pre-Approval Letter.pdf" value={docTitle} onChange={e => setDocTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-file">Upload File</Label>
                    <Input id="document-file" type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-notes">Notes</Label>
                    <Textarea
                      id="document-notes"
                      placeholder="Optional document details..."
                      value={docNotes}
                      onChange={e => setDocNotes(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button disabled={isUploading || !docTitle.trim() || !docFile} onClick={handleCreateDocument}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Document
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="group cursor-pointer rounded-2xl border-border/50 transition-shadow hover:shadow-md"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors group-hover:bg-red-500 group-hover:text-white">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold transition-colors group-hover:text-primary">
                      {doc.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {(() => {
                        const notesMatch = doc.content.match(/\n\nNotes:\n([\s\S]*)/);
                        return notesMatch ? notesMatch[1].trim() : (doc.date || "");
                      })()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                      aria-label={`Open document ${doc.title}`}
                      onClick={() => {
                        const urlMatch = doc.content.match(/^\/uploads\/[^\s\n]+/);
                        if (urlMatch) window.open(urlMatch[0], "_blank");
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${doc.title}`}
                      onClick={() => deleteItem(doc.numericId, "document")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Notes Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <span className="rounded-xl bg-yellow-100 p-1.5 text-yellow-700">
                  <FileText className="h-4 w-4" />
                </span>
                Notes
              </h2>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">
                {notes.length}
              </Badge>
            </div>

            <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full border-primary/20 hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Note</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="note-title">Title</Label>
                    <Input id="note-title" placeholder="Note title" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-content">Content</Label>
                    <Textarea id="note-content" placeholder="Write your note here..." value={noteContent} onChange={e => setNoteContent(e.target.value)} />
                  </div>
                </div>

                <DialogFooter>
                  <Button disabled={isUploading || !noteTitle.trim() || !noteContent.trim()} onClick={handleCreateNote}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Note
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="group rounded-2xl border-l-4 border-l-yellow-400 transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-base font-bold leading-tight transition-colors group-hover:text-primary">
                    {note.title}
                  </CardTitle>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary"
                      aria-label={`Edit ${note.title}`}
                      onClick={() => openEdit(note)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 -mr-2 rounded-full text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${note.title}`}
                      onClick={() => deleteItem(note.numericId, "note")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1">
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Edit dialog (tasks & notes) */}
      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.type === "task" ? "Task" : "Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            {editingItem?.type === "task" && (
              <div className="space-y-2">
                <Label htmlFor="edit-date">Due Date</Label>
                <Input id="edit-date" type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
            )}
            {editingItem?.type === "note" && (
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea id="edit-content" value={editContent} onChange={e => setEditContent(e.target.value)} rows={5} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button disabled={!editTitle.trim()} onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Potential Homes */}
      <section className="mb-10">
        <div className="flex items-center justify-between px-1 mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">Potential Homes</h2>
              <p className="text-sm text-muted-foreground">
                Homes you added from Listings.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">
            {listingCandidates.length}
          </Badge>
        </div>

        {listingCandidates.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-muted/20 px-4 py-10 text-center">
            <p className="text-sm font-bold text-muted-foreground">
              No potential homes yet.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Open a listing and use “Add to Potential Homes”.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {listingCandidates.map((candidate) => {
              const parsed = parseListingCandidateContent(candidate.content);
              const details =
                typeof candidate.listingId === "number"
                  ? listingDetailsById[candidate.listingId]
                  : undefined;
              const displayBeds =
                typeof details?.beds === "number" ? details.beds : parsed.beds;
              const displayBaths =
                typeof details?.baths === "number" ? details.baths : parsed.baths;
              const displaySqft =
                typeof details?.sqft === "number" ? details.sqft : parsed.sqft;
              const heartHoverText = "Remove from collaboration board";
              const candidateImage =
                details?.image ?? parsed.image ?? "/images/listing-placeholder.jpg";
              const detailAddress =
                parsed.address ??
                (details?.addressLine1
                  ? [details.addressLine1, details.city, details.state, details.zip]
                      .filter(Boolean)
                      .join(", ")
                  : candidate.title);
              const detailPrice = details?.price ?? parsed.price ?? "Saved Home";
              const detailDescription = details?.description ?? parsed.description;
              const detailStatus = details?.status ?? candidate.status;
              const detailMapsUrl = parsed.mapsUrl;

              return (
                <Dialog
                  key={candidate.id}
                  onOpenChange={(open) => {
                    if (open) {
                      void ensureListingDetails(candidate.listingId);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          (e.currentTarget as HTMLDivElement).click();
                        }
                      }}
                      className="group cursor-pointer rounded-xl border border-border/50 bg-card text-left text-card-foreground shadow hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col h-full p-4"
                    >
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted/20">
                        <img
                          src={candidateImage}
                          alt={`Photo of ${candidate.title}`}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                          <ListingChatAction
                            onClick={() => openChatDialogForCandidate(candidate.id)}
                            disabled={chatSending}
                            label="Send to chat"
                          />
                          <ListingHeartAction
                            onClick={() => removeCandidateFromBoard(candidate)}
                            inBoard
                            hoverLabel={heartHoverText}
                          />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <p className="text-white font-bold text-xl">
                            {detailPrice}
                          </p>
                        </div>
                      </div>

                      <CardContent className="p-0 flex-1 space-y-3 pt-4">
                        <div>
                          <h2 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                            {candidate.title}
                          </h2>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{detailAddress}</span>
                          </div>
                        </div>

                        {(typeof displayBeds === "number" ||
                          typeof displayBaths === "number" ||
                          typeof displaySqft === "number") && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                            {typeof displayBeds === "number" ? (
                              <div className="flex items-center gap-1">
                                <BedDouble className="h-4 w-4" />
                                <span>{displayBeds} Beds</span>
                              </div>
                            ) : (
                              <div />
                            )}
                            {typeof displayBaths === "number" ? (
                              <div className="flex items-center gap-1">
                                <Bath className="h-4 w-4" />
                                <span>{displayBaths} Baths</span>
                              </div>
                            ) : (
                              <div />
                            )}
                            {typeof displaySqft === "number" ? (
                              <div className="flex items-center gap-1">
                                <Maximize className="h-4 w-4" />
                                <span>{displaySqft} sqft</span>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </DialogTrigger>

                  <DialogContent className="w-[min(92vw,760px)] h-[min(88vh,760px)] overflow-hidden p-0 gap-0 border-none shadow-2xl">
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="w-full shrink-0 bg-card p-4 border-b border-border/40">
                        <div className="relative h-56 sm:h-72 w-full rounded-xl overflow-hidden bg-muted">
                          <img
                            src={candidateImage}
                            alt={`Photo of ${candidate.title}`}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-card">
                        <div>
                          <div className="flex justify-between items-start mb-2 gap-3">
                            <DialogTitle className="text-2xl font-bold text-foreground">
                              {candidate.title}
                            </DialogTitle>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                {detailPrice}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Status: {detailStatus}
                              </p>
                            </div>
                          </div>
                          {detailMapsUrl ? (
                            <a
                              href={detailMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <MapPin className="h-4 w-4" />
                              {detailAddress}
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground">{detailAddress}</p>
                          )}
                        </div>
                        {listingDetailsLoading && !details ? (
                          <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading additional details...
                          </p>
                        ) : null}
                        {(typeof displayBeds === "number" ||
                          typeof displayBaths === "number" ||
                          typeof displaySqft === "number") && (
                          <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                            <div className="text-center">
                              {typeof displayBeds === "number" ? (
                                <>
                                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                                  <p className="text-xl font-bold">{displayBeds}</p>
                                </>
                              ) : null}
                            </div>
                            <div className="text-center border-l border-border/50">
                              {typeof displayBaths === "number" ? (
                                <>
                                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                                  <p className="text-xl font-bold">{displayBaths}</p>
                                </>
                              ) : null}
                            </div>
                            <div className="text-center border-l border-border/50">
                              {typeof displaySqft === "number" ? (
                                <>
                                  <p className="text-sm text-muted-foreground">Square Feet</p>
                                  <p className="text-xl font-bold">{displaySqft}</p>
                                </>
                              ) : null}
                            </div>
                          </div>
                        )}
                        {detailDescription ? (
                          <div className="space-y-2">
                            <h3 className="font-semibold">About this home</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {detailDescription}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        )}
      </section>

      <Dialog
        open={chatDialogOpen}
        onOpenChange={(open) => {
          setChatDialogOpen(open);
          if (!open) {
            setSelectedCandidateId(null);
            setSelectedChatId(null);
            setHasLoadedChatsForDialogOpen(false);
            setChatsError(null);
            setChatSendError(null);
            setChatSending(false);
            setChats([]);
          }
        }}
      >
        <DialogContent className="w-[min(92vw,720px)] overflow-hidden">
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Send to Chat
            </DialogTitle>

            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              {selectedCandidate ? (
                <div className="space-y-1">
                  <p className="font-bold">{selectedCandidate.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {parseListingCandidateContent(selectedCandidate.content).address ??
                      selectedCandidate.title}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a home first.
                </p>
              )}
            </div>

            {chatsError ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{chatsError}</p>
                <Button type="button" variant="outline" size="sm" onClick={retryLoadChats}>
                  Retry loading conversations
                </Button>
              </div>
            ) : null}

            {chatsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading conversations...
              </div>
            ) : chats.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Choose a person</p>
                <Select
                  value={selectedChatId !== null ? String(selectedChatId) : undefined}
                  onValueChange={(v) => {
                    const num = Number(v);
                    setSelectedChatId(Number.isFinite(num) ? num : null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a conversation" />
                  </SelectTrigger>
                  <SelectContent>
                    {chats.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No conversations found. Start a chat with someone first.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={retryLoadChats}>
                  Refresh conversations
                </Button>
              </div>
            )}

            {chatSendError ? <p className="text-sm text-destructive">{chatSendError}</p> : null}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setChatDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!selectedChatId || chatSending || !selectedCandidate}
                onClick={sendCandidateToChat}
              >
                {chatSending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vision Board */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">Vision Board</h2>
              <p className="text-sm text-muted-foreground">
                Inspiration comes after the action items.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={visionFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleVisionImageUpload}
            />

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hover:bg-primary/5"
              onClick={() => visionFileInputRef.current?.click()}
            >
              <Plus className="h-4 w-4" />
              Add Inspiration
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="vision-board" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex min-h-[200px] gap-4 overflow-x-auto pb-4"
              >
                {visionItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "group relative min-w-[220px] max-w-[260px] h-[195px] md:min-w-[260px] overflow-hidden rounded-2xl border border-border/50 shadow-sm transition-all duration-300 shrink-0",
                          snapshot.isDragging
                            ? "z-50 scale-105 shadow-2xl ring-2 ring-primary"
                            : "hover:shadow-lg"
                        )}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <div className="absolute bottom-3 left-3 text-white">
                          <p className="text-sm font-medium drop-shadow-md">{item.title}</p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVisionItem(item.id);
                          }}
                          className="absolute left-2 top-2 rounded-lg bg-black/30 p-1.5 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-red-500 group-hover:opacity-100"
                          aria-label={`Delete vision item: ${item.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div
                          {...provided.dragHandleProps}
                          className="absolute right-2 top-2 cursor-grab rounded-lg bg-black/20 p-1.5 text-white opacity-0 backdrop-blur-md transition-opacity active:cursor-grabbing group-hover:opacity-100"
                          aria-label={`Reorder vision item: ${item.title}`}
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </section>
    </div>
  );
}