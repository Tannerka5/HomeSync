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
  GripVertical
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
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const VISION_BOARD_ITEMS = [
  { id: "vision-1", image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=400&q=80", title: "Modern Kitchen" },
  { id: "vision-2", image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80", title: "Cozy Living Room" },
  { id: "vision-3", image: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=400&q=80", title: "Minimalist Entryway" },
  { id: "vision-4", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80", title: "Luxury Bathroom" },
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
        prev.map((t) => (t.id === updatedTask.id ? { ...t, status: updatedTask.status } : t)),
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
    <div className="container mx-auto px-4 py-6 md:py-10 h-full flex flex-col space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading">Collaboration Board</h1>
          <p className="text-muted-foreground mt-1">Share notes, tasks, and documents with your agent.</p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-accent rounded-full">
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
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Note title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" placeholder="Write your note here..." />
                </div>
              </div>
              <DialogFooter>
                <Button>Save Note</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-full border-primary/20 hover:bg-primary/5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
               <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task</Label>
                  <Input id="task-title" placeholder="What needs to be done?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input id="due-date" type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button>Create Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vision Board Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">Vision Board</h2>
              <p className="text-sm text-muted-foreground">Drag and drop to reorder your inspiration</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">View Full Board</Button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="vision-board" direction="horizontal">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide min-h-[200px]"
              >
                {visionItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "relative group min-w-[200px] md:min-w-[250px] aspect-[4/3] rounded-2xl overflow-hidden border border-border/50 shadow-sm transition-all duration-300",
                          snapshot.isDragging ? "shadow-2xl scale-105 z-50 ring-2 ring-primary" : "hover:shadow-lg"
                        )}
                      >
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white">
                          <p className="font-medium text-sm drop-shadow-md">{item.title}</p>
                        </div>
                        <div
                          {...provided.dragHandleProps}
                          className="absolute top-2 right-2 p-1.5 bg-black/20 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
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

      {/* Traditional Board Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 items-start">
        {/* Notes Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h3 className="font-semibold text-foreground flex items-center gap-2">
               <span className="bg-yellow-100 text-yellow-700 p-1.5 rounded-xl"><FileText className="h-4 w-4" /></span>
               Notes
             </h3>
             <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">{notes.length}</Badge>
          </div>
          
          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-400 group rounded-2xl">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-base font-bold leading-tight group-hover:text-primary transition-colors">{note.title}</CardTitle>
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
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tasks Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h3 className="font-semibold text-foreground flex items-center gap-2">
               <span className="bg-primary/10 text-primary p-1.5 rounded-xl"><CheckCircle2 className="h-4 w-4" /></span>
               Tasks
             </h3>
             <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">{tasks.length}</Badge>
          </div>
          {taskMessage ? (
            <p className="text-xs text-muted-foreground px-1">{taskMessage}</p>
          ) : null}
          
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow group rounded-2xl border-border/50">
                <CardContent className="p-4 flex items-start gap-4">
                  <button
                    className="mt-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
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
                    <p className={`text-sm font-medium leading-none ${task.status === "Done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3">
                      <Badge variant={task.status === "Done" ? "secondary" : task.status === "In Progress" ? "default" : "outline"} className="text-[10px] h-5 px-2 rounded-md font-bold uppercase tracking-wider">
                        {task.status}
                      </Badge>
                      {task.date && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 opacity-70" />
                          {task.date}
                        </div>
                      )}
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
             <h3 className="font-semibold text-foreground flex items-center gap-2">
               <span className="bg-blue-100 text-blue-700 p-1.5 rounded-xl"><File className="h-4 w-4" /></span>
               Documents
             </h3>
             <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">{documents.length}</Badge>
          </div>
          
          <div className="space-y-3">
             {documents.map((doc) => (
               <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer rounded-2xl border-border/50 group">
                 <CardContent className="p-4 flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 group-hover:bg-red-500 group-hover:text-white transition-colors">
                     <FileText className="h-5 w-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{doc.title}</p>
                     <p className="text-xs text-muted-foreground mt-0.5">{doc.date}</p>
                   </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                    aria-label="Open document"
                  >
                     <ExternalLink className="h-4 w-4" />
                   </Button>
                 </CardContent>
               </Card>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}