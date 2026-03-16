import { 
  Home, 
  Search, 
  ClipboardList, 
  MessageSquare, 
  LogIn, 
  User, 
  Menu,
  MessageCircle,
  LogOut
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
];

export const MOCK_USER = {
  name: "Alex Johnson",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  role: "Buyer"
};

export const LISTINGS = [
  {
    id: 1,
    title: "Modern Family Home",
    price: "$850,000",
    address: "123 Maple Avenue, Riverdale",
    beds: 4,
    baths: 3,
    sqft: 2500,
    image: "/images/listing-1.jpg",
    description: "Beautiful suburban home with a large backyard and renovated kitchen.",
    status: "Active"
  },
  {
    id: 2,
    title: "Downtown Loft",
    price: "$625,000",
    address: "456 Main St, Unit 4B, City Center",
    beds: 2,
    baths: 2,
    sqft: 1200,
    image: "/images/listing-2.jpg",
    description: "Industrial chic loft in the heart of the city with floor-to-ceiling windows.",
    status: "New"
  },
  {
    id: 3,
    title: "Cozy Craftsman",
    price: "$550,000",
    address: "789 Oak Lane, Green Valley",
    beds: 3,
    baths: 2,
    sqft: 1800,
    image: "/images/listing-3.jpg",
    description: "Charming craftsman style home with original details and a covered porch.",
    status: "Pending"
  },
  {
    id: 4,
    title: "Lakeside Retreat",
    price: "$1,200,000",
    address: "321 Lakeview Dr, Harbor Point",
    beds: 5,
    baths: 4,
    sqft: 3500,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    description: "Stunning waterfront property with private dock and panoramic views.",
    status: "Active"
  }
];

export const MOCK_CHATS = [
  {
    id: 1,
    name: "Sarah Miller",
    role: "Realtor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "I've scheduled the viewing for Saturday at 2 PM.",
    time: "10:30 AM",
    unread: true,
    pinned: true,
    category: "Professionals"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Lender",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "Your pre-approval letter is ready for download.",
    time: "Yesterday",
    unread: false,
    pinned: false,
    category: "Professionals"
  },
  {
    id: 3,
    name: "David Wilson",
    role: "Home Inspector",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "Here is the full report from the inspection.",
    time: "2 days ago",
    unread: false,
    pinned: false,
    category: "Professionals"
  },
  {
    id: 4,
    name: "Emma Davis",
    role: "Interior Designer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "The moodboard for the living room is ready.",
    time: "3 days ago",
    unread: true,
    pinned: true,
    category: "Professionals"
  }
];

export const MOCK_BOARD = {
  notes: [
    { id: "note-1", title: "Kitchen Renovation Ideas", content: "Open shelving, quartz countertops, brass hardware." },
    { id: "note-2", title: "Questions for Seller", content: "Age of roof? HVAC maintenance history?" }
  ],
  tasks: [
    { id: "task-1", title: "Submit Pre-approval", status: "Done", date: "Oct 15" },
    { id: "task-2", title: "Schedule Inspection", status: "In Progress", date: "Oct 20" },
    { id: "task-3", title: "Review HOA Documents", status: "To Do", date: "Oct 25" }
  ],
  documents: [
    { id: "doc-1", title: "Pre-Approval Letter.pdf", type: "pdf", date: "Oct 10" },
    { id: "doc-2", title: "Purchase Agreement.pdf", type: "pdf", date: "Oct 18" },
    { id: "doc-3", title: "Property Disclosure.pdf", type: "pdf", date: "Oct 12" }
  ],
  visionBoard: [
  { 
    id: "vision-1", 
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=400&q=80", 
    title: "Modern Kitchen" 
  },
  { 
    id: "vision-2", 
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80", 
    title: "Cozy Living Room" 
  },
  { 
    id: "vision-3", 
    image: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=400&q=80", 
    title: "Minimalist Entryway" 
  },
  { 
    id: "vision-4", 
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80", 
    title: "Luxury Bathroom" 
  }
]
};