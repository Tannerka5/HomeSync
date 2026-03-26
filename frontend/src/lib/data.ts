import {
  Home,
  Search,
  ClipboardList,
  MessageSquare,
  BarChart3,
} from "lucide-react";

export const NAVIGATION_ITEMS = [
  { 
    label: "Home", 
    path: "/", 
    icon: Home,
    subtitle: "Overview of your buying journey" 
  },
  { 
    label: "Listings", 
    path: "/listings", 
    icon: Search,
    subtitle: "Let's find your future home!" 
  },
  { 
    label: "Collaboration Board", 
    path: "/board", 
    icon: ClipboardList,
    subtitle: "Keep notes and tasks organized" 
  },
  {
    label: "Chat",
    path: "/chat",
    icon: MessageSquare,
    subtitle: "Connect with your team"
  },
  {
    label: "Admin",
    path: "/admin",
    icon: BarChart3,
    subtitle: "Platform OKR dashboard"
  },
];
