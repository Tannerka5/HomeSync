import { useEffect, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  FileText,
  CheckCircle2,
  Circle,
  File,
  ExternalLink,
  LayoutDashboard,
  GripVertical,
  Upload,
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
  type: string;
  title: string;
  content: string;
  status: "To Do" | "In Progress" | "Done";
  date: string;
};

export default function BoardPage() {
  const [visionItems, setVisionItems] = useState(VISION_BOARD_ITEMS);
  const [tasks, setTasks] = useState<BoardItem[]>([]);
  const [notes, setNotes] = useState<BoardItem[]>([]);
  const [documents, setDocuments] = useState<BoardItem[]>([]);
  const [taskMessage, setTaskMessage] = useState<string>("");

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
        setTaskMessage("");
      } catch {
        setTaskMessage("Could not reach backend. Start frontend and backend together with npm run dev.");
      }
    }

    loadItems();
  }, []);

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

        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full bg-primary shadow-lg shadow-primary/20 hover:bg-accent">
                <CheckCircle2 className="h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="header-task-title">Task</Label>
                  <Input id="header-task-title" placeholder="What needs to be done?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="header-due-date">Due Date</Label>
                  <Input id="header-due-date" type="date" />
                </div>
              </div>

              <DialogFooter>
                <Button>Create Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

            <Dialog>
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
                    <Input id="column-task-title" placeholder="What needs to be done?" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="column-due-date">Due Date</Label>
                    <Input id="column-due-date" type="date" />
                  </div>
                </div>

                <DialogFooter>
                  <Button>Create Task</Button>
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

                  <div className="flex-1 space-y-1.5">
                    <p
                      className={`text-sm font-medium leading-none ${
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

            <Dialog>
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
                    <Input id="document-title" placeholder="Pre-Approval Letter.pdf" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-file">Upload File</Label>
                    <Input id="document-file" type="file" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-notes">Notes</Label>
                    <Textarea
                      id="document-notes"
                      placeholder="Optional document details..."
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button>Save Document</Button>
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
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {doc.date || "No date"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label={`Open document ${doc.title}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
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

            <Dialog>
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
                    <Input id="note-title" placeholder="Note title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-content">Content</Label>
                    <Textarea id="note-content" placeholder="Write your note here..." />
                  </div>
                </div>

                <DialogFooter>
                  <Button>Save Note</Button>
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

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mr-2 text-muted-foreground"
                    aria-label="Note options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
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

          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/5"
          >
            View Full Board
          </Button>
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
                          "group relative aspect-[4/3] min-w-[220px] overflow-hidden rounded-2xl border border-border/50 shadow-sm transition-all duration-300 md:min-w-[260px]",
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