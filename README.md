[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge)](https://chat-eydotz5ta-luis-sarmientos-projects.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-89.3%25-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

# 💬 Real-Time Chat Application

> A production-ready real-time chat platform built as **Week 2** of my 8-week coding journey. Demonstrates advanced full-stack development, real-time WebSocket architecture, and clean code practices with modern React patterns.

## ✨ **What This Project Demonstrates**

This isn't just another chat app—it's a **production-grade application** that showcases:

- **Advanced React architecture** with custom hooks and clean separation of concerns
- **Real-time WebSocket communication** with Socket.io for instant messaging
- **Production-ready code quality** with TypeScript, error handling, and accessibility
- **Scalable database design** with PostgreSQL and proper relational modeling
- **Clean refactored codebase** reduced from 500+ lines to 320 lines through strategic hook extraction

Built in one week with a focus on maintainable, testable, and scalable architecture.

## 🏗️ **Project Architecture**

### **File Structure**

```
src/
├── components/              # Reusable UI components
│   ├── auth-button.tsx     # Google OAuth authentication
│   ├── chat-header.tsx     # App header with connection status
│   ├── message-list.tsx    # Optimized message rendering
│   ├── message-input.tsx   # Message composition with typing indicators
│   ├── room-sidebar.tsx    # Room navigation and search
│   ├── room-header.tsx     # Current room info and settings
│   ├── create-room-modal.tsx # Room creation interface
│   ├── room-manage-modal.tsx # Room management (add/remove members)
│   └── typing-indicator.tsx # Real-time typing status
├── hooks/                  # Custom React hooks (refactored)
│   ├── use-socket.ts      # Socket.io connection management
│   ├── use-typing.ts      # Typing indicator logic
│   ├── use-user-cache.ts  # Smart user data caching
│   ├── use-room-management.ts # Room operations and filtering
│   └── use-messaging.ts   # Message sending with optimistic updates
├── lib/                   # Core utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # PostgreSQL connection pooling
│   └── socket.ts         # Socket.io service (singleton pattern)
├── pages/
│   ├── api/
│   │   ├── auth/[...nextauth].ts # Authentication API routes
│   │   └── socket/io.ts   # Socket.io server implementation
│   ├── _app.tsx          # Next.js app configuration
│   ├── _document.tsx     # HTML document structure
│   └── index.tsx         # Main chat interface (320 lines - refactored)
├── types/
│   └── index.ts          # Centralized TypeScript definitions
└── styles/
    └── globals.css       # Tailwind CSS imports and custom styles
```

### **State Management Philosophy**

- **Custom hook pattern** for feature-specific logic separation
- **Optimistic updates** for immediate UI feedback
- **Smart caching** with user data and room information
- **Real-time synchronization** across multiple clients
- **Memory-efficient** message handling with pagination

### **Database Schema**

```sql
-- Users (managed by NextAuth)
users: id, name, email, image, created_at

-- Chat rooms with privacy controls
rooms: id, name, type, created_by, is_private, created_at

-- Room membership with role-based access
room_members: room_id, user_id, role, added_by, joined_at

-- Messages with optimistic update support
messages: id, room_id, user_id, content, sent_at
```

## 🔄 **Real-Time Architecture**

### **Socket.io Event System**

```typescript
// Client → Server Events
interface ClientToServerEvents {
  get_rooms: (data: GetRoomsData) => void;
  switch_room: (data: SwitchRoomData) => void;
  send_chat_message: (data: SendMessageData) => void;
  create_room: (data: CreateRoomData) => void;
  delete_room: (data: DeleteRoomData) => void;
  add_member: (data: AddMemberData) => void;
  user_typing_start: (data: TypingData) => void;
  user_typing_stop: (data: TypingData) => void;
}

// Server → Client Events
interface ServerToClientEvents {
  rooms_list: (data: RoomListUpdateData) => void;
  chat_message: (data: ChatMessageData) => void;
  message_history: (data: MessageHistoryData) => void;
  room_created: (data: RoomCreatedData) => void;
  room_deleted: (data: RoomDeletedData) => void;
  user_typing: (data: TypingEventData) => void;
  user_stopped_typing: (data: TypingEventData) => void;
  error: (error: ErrorData) => void;
}
```

### **Message Flow**

```
User Types → Optimistic UI Update → Socket Emit → Server Validation → Database Save → Broadcast → UI Confirmation
     ↓
Real-time Updates → Socket Event → State Update → React Re-render → Smooth Animation
```

## 🎨 **User Experience Features**

### **Room Management**

```
🏠 Auto-room Creation → 🔍 Search & Filter → ➕ Create Custom Rooms → 👥 Invite Members → 🗑️ Room Deletion
```

### **Real-Time Features**

- **Instant messaging** with optimistic updates
- **Typing indicators** showing who's currently typing
- **Live room updates** when members join/leave
- **Connection status** with automatic reconnection
- **Message history** loaded on room switch
- **User presence** tracking across rooms

### **Accessibility Features** ♿

- **Perfect Lighthouse accessibility score** (100/100)
- **Full keyboard navigation** with proper focus management
- **Screen reader support** with ARIA labels and semantic HTML
- **High contrast** compliance for visually impaired users
- **Focus rings** for keyboard navigation visibility

## 🛠️ **Tech Stack Details**

| Category           | Technology                                                         | Purpose                               |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------- |
| **Frontend**       | Next.js 13 + React 18 + TypeScript                                 | Full-stack React framework            |
| **Real-Time**      | [Socket.io](https://socket.io/) 4.x                                | WebSocket communication               |
| **Database**       | [PostgreSQL](https://postgresql.org/) + [Neon](https://neon.tech/) | Relational database with free hosting |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) + Google OAuth            | Secure user authentication            |
| **Styling**        | [Tailwind CSS](https://tailwindcss.com/) 3.x                       | Utility-first responsive design       |
| **Deployment**     | [Vercel](https://vercel.com/) + [Railway](https://railway.app/)    | Frontend + Backend hosting            |
| **Type Safety**    | TypeScript 5.x                                                     | Full-stack type safety                |

## 🏆 **Code Quality & Refactoring**

### **Clean Architecture Achievements**

- **Reduced complexity**: 500+ lines → 320 lines in main component
- **Single Responsibility**: Each hook handles one specific concern
- **Testable architecture**: Logic separated into pure functions
- **Reusable components**: Modular design for easy maintenance
- **Performance optimized**: Memoized calculations and smart re-renders

### **Custom Hooks (Extracted)**

```typescript
// Clean separation of concerns
useUserCache(); // 40 lines - User data caching logic
useMessaging(); // 60 lines - Message sending & optimistic updates
useRoomManagement(); // 80 lines - Room operations & filtering
useTyping(); // Typing indicator state management
useSocket(); // Socket connection lifecycle
```

### **Bug Fixes During Refactoring**

- **Room name placeholder**: Fixed to show actual room names instead of IDs
- **Memory management**: Proper cleanup of event listeners and intervals
- **Type safety**: Eliminated any types and improved interface definitions
- **Performance**: Optimized re-renders with proper dependency arrays

## 🎮 **User Interaction Patterns**

### **Message Management**

- **Optimistic updates** for instant feedback
- **Temporary IDs** for message tracking before server confirmation
- **Error handling** with retry mechanisms for failed sends
- **Message pagination** for performance with large chat histories

### **Room Navigation**

- **Auto-room selection** on first visit
- **Smart room filtering** with real-time search
- **Keyboard shortcuts** for power users
- **Breadcrumb navigation** showing current context

## 📊 **Performance & Quality**

### **Lighthouse Scores** ✨

- 🚀 **Performance**: `99/100` _(Sub-second load times)_
- ♿ **Accessibility**: `100/100` _(Full WCAG compliance)_
- ✅ **Best Practices**: `100/100` _(Security & modern standards)_
- 🔍 **SEO**: `100/100` _(Proper meta tags & structure)_

### **Real-Time Performance**

- **Message latency**: < 50ms in same region
- **Connection recovery**: Automatic reconnection with exponential backoff
- **Memory efficiency**: Bounded message history with pagination
- **Concurrent users**: Tested with multiple simultaneous connections

### **Database Performance**

- **Connection pooling**: Optimized PostgreSQL connections
- **Query optimization**: Indexed joins for room membership
- **Transaction safety**: ACID compliance for critical operations
- **Backup strategy**: Automated database backups on Neon

## 🔐 **Security Features**

### **Authentication & Authorization**

- **OAuth 2.0** with Google for secure authentication
- **JWT tokens** with proper expiration and refresh
- **Session management** with secure cookie handling
- **Role-based access** (room creators, members, admins)

### **Data Protection**

- **Input validation** on both client and server
- **SQL injection prevention** with parameterized queries
- **XSS protection** with proper output encoding
- **CORS configuration** for secure cross-origin requests

## 🚀 **Deployment Architecture**

### **Production Stack**

- **Frontend**: Vercel (CDN + Edge functions)
- **Backend API**: Railway (persistent server for Socket.io)
- **Database**: Neon PostgreSQL (managed database)
- **Authentication**: NextAuth.js with Google OAuth

### **Environment Configuration**

```bash
# Production Environment Variables
DATABASE_URL=postgresql://username:password@host/database
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secure_secret_key
```

## 🤝 **Getting Started**

### **Prerequisites**

- Node.js 18+
- PostgreSQL database (or Neon account)
- Google OAuth credentials

### **Local Development**

```bash
# Clone the repository
git clone https://github.com/yourusername/chat-app.git
cd chat-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations (if needed)
npm run db:migrate

# Start development server
npm run dev
```

### **Database Setup**

```sql
-- Create required tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Additional tables created by NextAuth and app logic
-- See /lib/db.ts for complete schema
```

## 📈 **Future Enhancements**

### **Planned Features**

- **File sharing** with drag-and-drop upload
- **Message reactions** with emoji picker
- **Thread replies** for organized conversations
- **Push notifications** for offline users
- **Voice/video calling** integration
- **Message search** across chat history
- **Custom themes** and dark mode
- **Mobile app** with React Native

### **Technical Improvements**

- **Horizontal scaling** with Redis for Socket.io
- **Advanced caching** with Redis for database queries
- **CDN integration** for file uploads
- **Analytics dashboard** for usage metrics
- **End-to-end encryption** for private messages

## 📝 **Contributing**

This is a portfolio project showcasing production-ready development practices. Feedback and suggestions are welcome!

### **Development Guidelines**

1. Follow the established hook pattern for new features
2. Maintain TypeScript strict mode compliance
3. Add comprehensive error handling for all user actions
4. Test accessibility features with screen readers
5. Ensure mobile responsiveness across devices

## 📄 **License**

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by Luis** | **Part of 8-Week Coding Journey** | **Week 2: Advanced Full-Stack Development**
