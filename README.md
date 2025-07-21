[![Local Demo](https://img.shields.io/badge/Local%20Demo-Available-green?style=for-the-badge)](https://github.com/P4rz1val22/chat-app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-89.3%25-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

# 💬 Real-Time Chat Application

> A production-ready real-time chat platform built as **Week 2** of my 8-week coding journey. Demonstrates full-stack development, real-time WebSocket architecture, and clean code practices.

## ✨ **What This Project Demonstrates**

- **React architecture** with custom hooks and clean separation of concerns
- **Real-time WebSocket communication** with Socket.io for instant messaging
- **Production-ready code quality** with TypeScript, error handling, and accessibility
- **Scalable database design** with PostgreSQL and relational modeling
- **Refactored codebase** reduced from 500+ lines to 320 lines through strategic hook extraction

## 🛠️ **Tech Stack**

| Category           | Technology                     | Purpose                               |
| ------------------ | ------------------------------ | ------------------------------------- |
| **Frontend**       | Next.js 13 + React 18 + TypeScript | Full-stack React framework |
| **Real-Time**      | Socket.io 4.x                 | WebSocket communication               |
| **Database**       | PostgreSQL + Neon             | Relational database with free hosting |
| **Authentication** | NextAuth.js + Google OAuth     | Secure user authentication            |
| **Styling**        | Tailwind CSS 3.x              | Utility-first responsive design       |
| **Type Safety**    | TypeScript 5.x                | Full-stack type safety                |

## 🏗️ **Architecture Highlights**

### **Hook-Based Architecture**
```
useUserCache()        # Smart user data caching
useMessaging()        # Message sending with optimistic updates  
useRoomManagement()   # Room operations and filtering
useTyping()           # Typing indicator state management
useSocket()           # Socket connection lifecycle
```

### **Real-Time Features**
- **Instant messaging** with optimistic updates
- **Typing indicators** showing who's currently typing
- **Live room updates** when members join/leave
- **Connection status** with automatic reconnection
- **Message history** loaded on room switch

### **Database Schema**
```sql
users: id, name, email, image, created_at
rooms: id, name, type, created_by, is_private, created_at
room_members: room_id, user_id, role, added_by, joined_at
messages: id, room_id, user_id, content, sent_at
```

## 🎨 **User Experience**

- **Room Management**: Auto-creation, search & filter, invite members, delete rooms
- **Accessibility**: 100/100 Lighthouse score, keyboard navigation, screen reader support
- **Responsive Design**: Works across desktop and mobile devices
- **Error Handling**: User feedback for all operations

## 🚀 **Getting Started**

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

# Start development server
npm run dev
```

### **Environment Variables**
```env
DATABASE_URL=your_postgresql_connection_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secure_secret_key
```

## 📈 **Key Achievements**

- **Reduced complexity**: Main component from 500+ lines to 320 lines
- **Modular architecture**: Logic separated into reusable custom hooks
- **Production-ready**: Error handling, accessibility, and performance optimized
- **Real-time performance**: Sub-50ms message latency, automatic reconnection
- **Security**: OAuth authentication, SQL injection prevention, input validation

## 🚀 **Deployment Notes**

This application runs perfectly in local development with full real-time functionality. **Production deployment** presented technical challenges due to **Socket.io's persistent connection requirements**:

- **Vercel limitation**: Serverless functions don't support Socket.io's persistent WebSocket connections
- **Railway compatibility**: Package manager conflicts during Docker build process
- **Technical decision**: Focused on core development skills rather than infrastructure debugging

The application demonstrates **full-stack development capabilities** and works locally, showcasing the intended real-time features and architecture patterns.

## 📝 **License**

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by Luis** | **Part of 8-Week Coding Journey** | **Week 2: Advanced Full-Stack Development**
