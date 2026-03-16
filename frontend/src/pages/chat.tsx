import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Send, 
  Paperclip,
  Smile,
  Check,
  ChevronLeft,
  Pin,
  Plus,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ChatPreview = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  pinned: boolean;
  category: string;
};

type Message = {
  id: number;
  senderUserId: number;
  senderName: string;
  text: string;
  sentAt: string;
  isOwn: boolean;
};

type FilterType = "All" | "Unread" | "Pinned" | "Professionals";

export default function ChatPage() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChats() {
      try {
        const res = await fetch("/api/chats", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setChats(data);
          if (data.length > 0) setSelectedChatId(data[0].id);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    loadChats();
  }, []);

  const loadMessages = useCallback(async (chatId: number) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, { credentials: "include" });
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (selectedChatId) loadMessages(selectedChatId);
  }, [selectedChatId, loadMessages]);

  async function sendMessage() {
    if (!messageInput.trim() || !selectedChatId) return;
    try {
      const res = await fetch(`/api/chats/${selectedChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messageText: messageInput }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setMessageInput("");
      }
    } catch { /* ignore */ }
  }

  const filteredChats = chats.filter(chat => {
    if (activeFilter === "Unread") return chat.unread;
    if (activeFilter === "Pinned") return chat.pinned;
    if (activeFilter === "Professionals") return chat.role !== "Buyer";
    return true;
  });

  const selectedChat = chats.find(c => c.id === selectedChatId) ?? chats[0];

  const filters: FilterType[] = ["All", "Unread", "Pinned", "Professionals"];

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-background">
      {/* Chat List Sidebar */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r flex flex-col bg-background transition-all duration-300 relative z-20",
        selectedChatId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-5 space-y-5 border-b shadow-sm bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-heading">Messages</h1>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <Input placeholder="Search conversations..." className="pl-9 bg-muted/50 border-none rounded-2xl h-11 focus-visible:ring-primary/20" />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-full h-8 px-4 text-xs font-bold uppercase tracking-wider transition-all",
                  activeFilter === filter 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "border-border/50 text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                )}
              >
                {filter}
                {filter === "Unread" && chats.some(c => c.unread) && (
                  <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={cn(
                  "flex items-start gap-4 p-5 text-left transition-all hover:bg-muted/30 border-b border-border/30 last:border-0 group relative overflow-hidden",
                  selectedChatId === chat.id ? "bg-primary/5 after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:h-12 after:w-1 after:bg-primary after:rounded-r-full" : ""
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-14 w-14 border-2 border-background shadow-sm ring-1 ring-border/50">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  {chat.unread && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 border-2 border-background shadow-sm" />
                  )}
                  {chat.pinned && (
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm border border-border/50">
                      <Pin className="h-2.5 w-2.5 text-primary fill-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden pt-0.5">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={cn(
                      "font-bold truncate text-sm transition-colors",
                      chat.unread ? "text-foreground" : "text-foreground/80 group-hover:text-primary"
                    )}>
                      {chat.name}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/60 ml-2 shrink-0 uppercase tracking-tighter">
                      {chat.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                     <Badge variant="secondary" className="text-[9px] h-4 px-1.5 rounded-sm font-black uppercase tracking-widest bg-muted/60 text-muted-foreground/80">
                       {chat.role}
                     </Badge>
                  </div>
                  <p className={cn(
                    "text-xs truncate leading-relaxed",
                    chat.unread ? "font-bold text-foreground" : "text-muted-foreground/70"
                  )}>
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            ))}
            {filteredChats.length === 0 && (
              <div className="p-10 text-center space-y-3">
                <div className="bg-muted/30 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-muted-foreground opacity-20" />
                </div>
                <p className="text-sm font-bold text-muted-foreground/80">No {activeFilter.toLowerCase()} chats found</p>
                <p className="text-xs text-muted-foreground/50">Try selecting a different filter</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-muted/20 w-full transition-all duration-500 relative z-10",
        !selectedChatId ? "hidden md:flex" : "flex"
      )}>
        {/* Chat Header */}
        <div className="h-20 border-b bg-background/95 backdrop-blur flex items-center justify-between px-6 shrink-0 shadow-sm relative z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden -ml-2 rounded-full" onClick={() => setSelectedChatId(null)}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            {selectedChat && (
            <>
            <div className="relative">
              <Avatar className="h-11 w-11 border-2 border-background shadow-sm ring-1 ring-border/50">
                <AvatarFallback className="font-bold">{selectedChat.name[0]}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background shadow-sm" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-none mb-1">{selectedChat.name}</h3>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Now &bull; {selectedChat.role}</p>
              </div>
            </div>
            </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all">
              <Video className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/40" />
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6 pt-6">
          <div className="space-y-6 max-w-4xl mx-auto pb-10">
             {messages.length === 0 && (
               <p className="text-center text-sm text-muted-foreground py-10">No messages yet. Start the conversation!</p>
             )}
             {messages.map((msg) => (
               msg.isOwn ? (
                 <div key={msg.id} className="flex gap-4 flex-row-reverse group">
                   <div className="flex flex-col gap-2 items-end max-w-[75%]">
                     <div className="bg-primary text-primary-foreground rounded-3xl rounded-tr-none p-4 shadow-lg shadow-primary/10 border border-primary/20">
                       <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                     </div>
                     <div className="flex items-center gap-2 mr-1">
                       <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                         {new Date(msg.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                       </span>
                       <div className="flex -space-x-1">
                         <Check className="h-2.5 w-2.5 text-primary" />
                         <Check className="h-2.5 w-2.5 text-primary" />
                       </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div key={msg.id} className="flex gap-4 group">
                   <Avatar className="h-9 w-9 mt-1 border border-border/50 shadow-sm shrink-0">
                     <AvatarFallback>{msg.senderName[0]?.toUpperCase()}</AvatarFallback>
                   </Avatar>
                   <div className="flex flex-col gap-2 max-w-[75%]">
                     <div className="bg-white border border-border/40 rounded-3xl rounded-tl-none p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                       <p className="text-sm leading-relaxed text-foreground/90">{msg.text}</p>
                     </div>
                     <div className="flex items-center gap-2 ml-1">
                       <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                         {new Date(msg.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                       </span>
                     </div>
                   </div>
                 </div>
               )
             ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 bg-background/80 backdrop-blur-xl border-t shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] relative z-10">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
             <div className="flex items-center gap-1 shrink-0">
               <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                 <Paperclip className="h-5 w-5" />
               </Button>
               <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                 <Smile className="h-5 w-5" />
               </Button>
             </div>
             
             <div className="flex-1 bg-muted/40 rounded-[28px] border border-border/50 focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/30 transition-all flex items-center pr-1.5 overflow-hidden">
               <Input 
                 className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent min-h-[52px] py-4 px-5 text-sm placeholder:text-muted-foreground/50 placeholder:font-medium" 
                 placeholder={selectedChat ? `Message ${selectedChat.name.split(' ')[0]}...` : "Select a conversation..."}
                 value={messageInput}
                 onChange={(e) => setMessageInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && messageInput && sendMessage()}
               />
               <Button 
                 size="icon" 
                 className={cn(
                  "h-10 w-10 rounded-full shrink-0 transition-all duration-300",
                  messageInput ? "bg-primary text-white scale-100 opacity-100 shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground scale-90 opacity-0 pointer-events-none"
                 )}
                 onClick={sendMessage}
               >
                 <Send className="h-4 w-4" />
               </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}