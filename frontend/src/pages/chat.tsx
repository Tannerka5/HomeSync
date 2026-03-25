import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Search, 
  Send,
  Check,
  ChevronLeft,
  Pin,
  Plus,
  Loader2,
  ExternalLink,
  MapPin,
  Paperclip,
  Smile
} from "lucide-react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
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
  status: "pending" | "accepted" | "declined";
  requestedBy: number;
  isRequester: boolean;
};

type Message = {
  id: number;
  senderUserId: number;
  senderName: string;
  text: string;
  messageType?: "text" | "listing_share";
  payload?: ListingSharePayload | null;
  sentAt: string;
  isOwn: boolean;
};

type FilterType = "All" | "Unread" | "Pinned" | "Professionals" | "Collaborators" | "Requests";

type ListingSharePayload = {
  listingId: number;
  title: string;
  price: string;
  address: string;
  image?: string;
  listingUrl: string;
  mapsUrl: string;
};

type SearchResult = {
  conversationId: number;
  messageId: number;
  text: string;
  sentAt: string;
  name: string;
};

function renderMessageTextWithLinks(text: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, lineIndex) => {
        const parts = line.split(urlPattern);
        return (
          <span key={`line-${lineIndex}`}>
            {parts.map((part, partIndex) => {
              const isUrl = /^https?:\/\/[^\s]+$/.test(part);
              if (isUrl) {
                return (
                  <a
                    key={`part-${lineIndex}-${partIndex}`}
                    href={part}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:opacity-80 break-all"
                  >
                    {part}
                  </a>
                );
              }
              return <span key={`part-${lineIndex}-${partIndex}`}>{part}</span>;
            })}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </span>
        );
      })}
    </>
  );
}

function isListingSharePayload(value: unknown): value is ListingSharePayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<ListingSharePayload>;
  return (
    typeof p.listingId === "number" &&
    typeof p.title === "string" &&
    typeof p.price === "string" &&
    typeof p.address === "string" &&
    typeof p.listingUrl === "string" &&
    typeof p.mapsUrl === "string"
  );
}

function renderMessageBody(msg: Message) {
  const payload = isListingSharePayload(msg.payload) ? msg.payload : null;
  const isListingShare = msg.messageType === "listing_share" && payload !== null;

  if (!isListingShare) {
    return (
      <p className="text-sm leading-relaxed font-medium">
        {renderMessageTextWithLinks(msg.text)}
      </p>
    );
  }

  return (
    <div className="space-y-3 min-w-[240px]">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">
          Listing share
        </p>
        <p className="text-sm font-bold leading-snug">{payload.title}</p>
      </div>
      {payload.image ? (
        <img
          src={payload.image}
          alt={payload.title}
          className="w-full h-36 object-cover rounded-xl border border-border/30"
        />
      ) : null}
      <div className="space-y-1">
        <p className="text-base font-bold">{payload.price}</p>
        <p className="text-xs opacity-80">{payload.address}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={payload.listingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-current/20 px-3 py-1.5 text-xs font-semibold hover:opacity-80"
        >
          Open listing
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <a
          href={payload.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-current/20 px-3 py-1.5 text-xs font-semibold hover:opacity-80"
        >
          Open in Maps
          <MapPin className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const [newChatMessage, setNewChatMessage] = useState("");
  const [newChatError, setNewChatError] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newSocket = io({ path: "/socket.io" });
    setSocket(newSocket);
    
    newSocket.on("new_message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    newSocket.on("typing_start", ({ userId }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    newSocket.on("typing_stop", ({ userId }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    newSocket.on("new_request", () => {
      // Reload chat list when a new request is received
      fetch("/api/chats", { credentials: "include" })
        .then(res => res.json())
        .then(data => setChats(data))
        .catch(() => {});
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && selectedChatId) {
      socket.emit("join_room", selectedChatId);
    }
  }, [socket, selectedChatId]);

  const togglePin = async (e: React.MouseEvent, chatId: number, isPinned: boolean) => {
    e.preventDefault(); // Prevent standard right-click menu
    
    // Optimistic update
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, pinned: !isPinned } : c));
    
    try {
      const method = isPinned ? "DELETE" : "POST";
      const res = await fetch(`/api/chats/${chatId}/pin`, { method, credentials: "include" });
      if (!res.ok) {
        // Revert on failure
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, pinned: isPinned } : c));
      }
    } catch {
      // Revert on failure
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, pinned: isPinned } : c));
    }
  };

  const handleRequest = async (chatId: number, action: 'accept' | 'decline') => {
    try {
      const res = await fetch(`/api/chats/${chatId}/${action}`, { method: "PATCH", credentials: "include" });
      if (res.ok) {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, status: action === 'accept' ? 'accepted' : 'declined' } : c));
        if (action === 'decline') setSelectedChatId(null);
      }
    } catch { /* ignore */ }
  };

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewChatError("");
    if (!newChatEmail.trim() || !newChatMessage.trim()) {
      setNewChatError("Both email and an initial message are required.");
      return;
    }

    try {
      const res = await fetch("/api/chats/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newChatEmail.trim(), messageText: newChatMessage.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowNewChatModal(false);
        setNewChatEmail("");
        setNewChatMessage("");
        // Reload chats
        const chatsRes = await fetch("/api/chats", { credentials: "include" });
        if (chatsRes.ok) setChats(await chatsRes.json());
        
        // Force the tab back to "All" so the new requested conversation isn't hidden if on Requests tab
        setActiveFilter("All");
        if (data.id) setSelectedChatId(data.id);
      } else {
        setNewChatError(data.message || "Failed to start chat.");
      }
    } catch {
      setNewChatError("Network error.");
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/chats/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
        if (res.ok) {
          setSearchResults(await res.json());
        }
      } catch (e) {
        /* ignore */
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    document.title = "Chat · HomeSync";
  }, []);

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
      if (res.ok) {
        setMessages(await res.json());
        
        // Optimistically clear unread and notify server
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread: false } : c));
        fetch(`/api/chats/${chatId}/read-all`, { method: "POST", credentials: "include" }).catch(() => {});
      }
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
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!chat.name.toLowerCase().includes(q) && !chat.lastMessage.toLowerCase().includes(q)) return false;
    }
    
    const isPendingReceiver = chat.status === "pending" && !chat.isRequester;

    if (activeFilter === "Requests") {
      return isPendingReceiver;
    }
    
    if (isPendingReceiver || chat.status === "declined") return false;

    if (activeFilter === "Unread") return chat.unread;
    if (activeFilter === "Pinned") return chat.pinned;
    if (activeFilter === "Professionals") return chat.role.toLowerCase() !== "buyer" && chat.role.toLowerCase() !== "collaborator";
    if (activeFilter === "Collaborators") return chat.role.toLowerCase() === "buyer" || chat.role.toLowerCase() === "collaborator";
    return true;
  });

  const selectedChat = chats.find(c => c.id === selectedChatId) ?? chats[0];

  const filters: FilterType[] = ["All", "Unread", "Pinned", "Professionals", "Collaborators", "Requests"];

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
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setShowNewChatModal(true)}
              aria-label="Start a new message"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-9 pr-9 bg-muted/50 border-none rounded-2xl h-11 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30 transition-colors"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
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
            {searchQuery ? (
              <div className="p-4 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Message Results</p>
                {isSearching ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground py-4">No messages found for "{searchQuery}"</p>
                ) : searchResults.map(res => (
                  <button
                    key={res.messageId}
                    onClick={() => setSelectedChatId(res.conversationId)}
                    className="w-full text-left p-3 rounded-xl hover:bg-muted transition-colors text-sm border border-border/40"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">{res.name}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {new Date(res.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{res.text}</p>
                  </button>
                ))}
              </div>
            ) : filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={cn(
                  "flex items-start gap-4 p-5 text-left transition-all hover:bg-muted/30 border-b border-border/30 last:border-0 group relative overflow-hidden cursor-pointer",
                  selectedChatId === chat.id ? "bg-primary/5 after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:h-12 after:w-1 after:bg-primary after:rounded-r-full" : ""
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-14 w-14 border-2 border-background shadow-sm ring-1 ring-border/50">
                    <AvatarImage src={chat.avatar} alt={`${chat.name} avatar`} />
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
                  <div className="flex justify-between items-start mb-1 min-w-0">
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold truncate text-sm transition-colors",
                          chat.unread ? "text-foreground" : "text-foreground/80 group-hover:text-primary"
                        )}>
                          {chat.name}
                        </span>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 rounded-sm font-black uppercase tracking-widest bg-muted/60 text-muted-foreground/80 shrink-0">
                          {chat.role}
                        </Badge>
                      </div>
                      <p className={cn(
                        "text-xs truncate leading-relaxed mt-0.5",
                        chat.unread ? "font-bold text-foreground" : "text-muted-foreground/90"
                      )}>
                        {chat.lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                        {chat.time}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(e, chat.id, chat.pinned);
                        }}
                        className={cn(
                          "hover:bg-primary/10 p-1.5 -mr-1.5 -mb-1.5 rounded-full transition-colors",
                          chat.pinned ? "text-primary" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-primary/80"
                        )}
                        title={chat.pinned ? "Unpin conversation" : "Pin conversation"}
                        aria-label={chat.pinned ? "Unpin conversation" : "Pin conversation"}
                      >
                        <Pin className={cn("h-3.5 w-3.5", chat.pinned && "fill-current")} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!searchQuery && filteredChats.length === 0 && (
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
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2 rounded-full"
              onClick={() => setSelectedChatId(null)}
              aria-label="Back to conversations"
            >
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
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6 pt-6">
          <div className="space-y-6 max-w-4xl mx-auto pb-10">
              {selectedChat?.status === "pending" && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div className="text-sm font-medium">
                    <span className="font-bold">{selectedChat.name}</span> wants to connect with you.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRequest(selectedChat.id, 'decline')}>Decline</Button>
                    <Button size="sm" onClick={() => handleRequest(selectedChat.id, 'accept')}>Accept</Button>
                  </div>
                </div>
              )}
             {messages.length === 0 && (
               <p className="text-center text-sm text-muted-foreground py-10">No messages yet. Start the conversation!</p>
             )}
             {messages.map((msg) => (
               msg.isOwn ? (
                 <div key={msg.id} className="flex gap-4 flex-row-reverse group">
                   <div className="flex flex-col gap-2 items-end max-w-[75%]">
                     <div className="bg-primary text-primary-foreground rounded-3xl rounded-tr-none p-4 shadow-lg shadow-primary/10 border border-primary/20">
                      {renderMessageBody(msg)}
                     </div>
                     <div className="flex items-center gap-2 mr-1">
                      <span className="text-[9px] font-bold text-muted-foreground/90 uppercase tracking-wider">
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
                     <div className="bg-white border border-border/40 rounded-3xl rounded-tl-none p-4 shadow-sm hover:shadow-md transition-shadow duration-300 text-foreground/90">
                      {renderMessageBody(msg)}
                     </div>
                    <div className="flex items-center gap-2 ml-1">
                      <span className="text-[9px] font-bold text-muted-foreground/90 uppercase tracking-wider">
                         {new Date(msg.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                       </span>
                     </div>
                   </div>
                 </div>
               )
             ))}
              {typingUsers.size > 0 && (
                <div className="flex gap-4 group">
                  <div className="flex flex-col gap-2 max-w-[75%]">
                    <div className="bg-white border border-border/40 rounded-3xl rounded-tl-none p-3 shadow-sm text-foreground/90 text-sm font-medium italic text-muted-foreground">
                      User is typing...
                    </div>
                  </div>
                </div>
              )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 bg-background/80 backdrop-blur-xl border-t shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] relative z-10">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
             <div className="flex items-center gap-1 shrink-0 relative">
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                 aria-label="Attach a file"
               >
                 <Paperclip className="h-5 w-5" />
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                 className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                 aria-label="Add an emoji"
               >
                 <Smile className="h-5 w-5" />
               </Button>
               {showEmojiPicker && (
                 <div className="absolute bottom-14 left-0 z-50 shadow-xl rounded-xl border border-border/50 overflow-hidden">
                   <Picker 
                     data={data} 
                     onEmojiSelect={(emoji: any) => {
                       setMessageInput(prev => prev + emoji.native);
                       setShowEmojiPicker(false);
                     }}
                     theme="light"
                     previewPosition="none"
                   />
                 </div>
               )}
             </div>
             
             <div className="flex-1 bg-muted/40 rounded-[28px] border border-border/50 focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/30 transition-all flex items-center pr-1.5 overflow-hidden">
               <Input 
                 className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent min-h-[52px] py-4 px-5 text-sm placeholder:text-muted-foreground/90 placeholder:font-medium disabled:opacity-50" 
                 placeholder={selectedChat?.status === "pending" ? "Accept request to message..." : selectedChat ? `Message ${selectedChat.name.split(' ')[0]}...` : "Select a conversation..."}
                 value={messageInput}
                 disabled={selectedChat?.status === "pending" || !selectedChat}
                 onChange={(e) => setMessageInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && messageInput && selectedChat?.status !== "pending" && sendMessage()}
               />
               <Button 
                 size="icon" 
                 className={cn(
                  "h-10 w-10 rounded-full shrink-0 transition-all duration-300",
                  messageInput && selectedChat?.status !== "pending" ? "bg-primary text-white scale-100 opacity-100 shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground scale-90 opacity-0 pointer-events-none"
                 )}
                 onClick={sendMessage}
                 disabled={selectedChat?.status === "pending"}
                 aria-label="Send message"
               >
                 <Send className="h-4 w-4" />
               </Button>
             </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 relative">
            <button 
              onClick={() => setShowNewChatModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold font-heading mb-2">New Conversation</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter the email address of the person you'd like to connect with.</p>
            
            <form onSubmit={handleStartNewChat} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recipient Email</label>
                  <Input
                    autoFocus
                    placeholder="name@example.com"
                    type="email"
                    value={newChatEmail}
                    onChange={(e) => setNewChatEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Message</label>
                  <textarea
                    placeholder="Introduce yourself..."
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                {newChatError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm font-medium">
                    {newChatError}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowNewChatModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!newChatEmail.trim() || !newChatMessage.trim()}>
                  Send Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}