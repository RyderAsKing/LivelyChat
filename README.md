# LivelyChat 💬

**A modern, Instagram-inspired real-time chat application built with Laravel 11, Inertia.js, React, and Laravel Reverb.**

LivelyChat is a full-featured messaging platform that demonstrates the power of modern web technologies working together. With WebSocket-powered real-time messaging, beautiful UI components, and a robust backend, it's perfect for learning, extending, or integrating into your own projects.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Reverb](https://img.shields.io/badge/Reverb-WebSockets-orange)

---

## 🌟 Key Features

- ⚡ **Real-time Messaging** - Instant message delivery using Laravel Reverb WebSockets
- 🎨 **Instagram-Inspired UI** - Clean, modern interface with Tailwind CSS and ShadCN components
- 🔒 **Secure Private Channels** - User-specific WebSocket channels with authentication
- ✅ **Read Receipts** - Track message read status automatically
- 🔔 **Unread Badges** - Visual indicators for unread conversations
- 🔍 **User Search** - Find and start conversations with any user
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🛡️ **Type-Safe** - Full TypeScript support for better developer experience
- 🚀 **Production Ready** - Built on Laravel 11 with best practices

---

## 🎯 GitHub Project Description

**LivelyChat - Real-time Chat Application**

A production-ready, Instagram-style messaging platform built with Laravel 11, React 19, and Laravel Reverb. Features WebSocket-powered real-time messaging, read receipts, user search, and a beautiful responsive UI. Perfect for learning modern full-stack development or as a foundation for your chat features.

**Tech Stack:** Laravel • Inertia.js • React • TypeScript • Tailwind CSS • Laravel Reverb • MySQL

---

## 🚀 Quick Start

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL/MariaDB
- NPM or Yarn

### Installation (Automated)

```bash
# Clone the repository
git clone <your-repo-url>
cd LivelyChat

# Run the setup script
chmod +x setup-chat.sh
./setup-chat.sh

# Configure your .env file with database and Reverb credentials
# Then start the servers (3 terminals required)
```

### Start Development Servers

You need **three terminal windows**:

```bash
# Terminal 1 - Laravel Application
php artisan serve

# Terminal 2 - Reverb WebSocket Server
php artisan reverb:start

# Terminal 3 - Frontend Development Server
npm run dev
```

Visit **http://localhost:8000/chat** to start chatting!

### Manual Installation

See [CHAT_SETUP.md](CHAT_SETUP.md) for detailed manual installation instructions.

---

## 📸 Screenshots & Demo

### Main Chat Interface

- Split-screen layout with conversation list and active chat
- Real-time message updates without page refresh
- Unread message badges and timestamps

### User Search

- Find any user in the system
- Start new conversations instantly
- Clean, intuitive search interface

---

## 🏗️ Architecture

LivelyChat follows a modern full-stack architecture:

```
Frontend (React + TypeScript)
         ↕ (Inertia.js Bridge)
Backend (Laravel 11 Controllers)
         ↕ (Eloquent ORM)
Database (MySQL)
         +
WebSocket Layer (Laravel Reverb)
         ↕ (Laravel Echo)
Real-time Updates
```

For detailed architecture diagrams, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🛠️ Technology Stack

### Backend

- **Laravel 11** - Modern PHP framework
- **Laravel Reverb** - Official WebSocket server
- **Spatie Laravel Permission** - Role-based access control
- **MySQL/MariaDB** - Relational database

### Frontend

- **React 19** - UI library with latest features
- **TypeScript** - Type-safe JavaScript
- **Inertia.js** - Server-side routing for React
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN UI** - Beautiful, accessible components
- **Lucide React** - Modern icon library
- **Laravel Echo** - WebSocket client

---

## 📚 Core Features Explained

### Real-time Messaging

Messages are instantly delivered using WebSockets. When a user sends a message:

1. Frontend sends POST request to Laravel
2. Laravel saves message to database
3. Laravel broadcasts `MessageSent` event
4. Reverb pushes to recipient's WebSocket channel
5. Recipient's browser receives and displays message

### Read Receipts

Messages are automatically marked as read when:

- User opens a conversation
- Messages are displayed in the chat window

### User Search

Search for any registered user by name or email to start a new conversation. The system prevents duplicate conversations between the same two users.

### Conversation Management

- Conversations are automatically created when first message is sent
- Sorted by most recent activity
- Display last message preview and timestamp
- Show unread count for each conversation

---

## 📁 Project Structure

```
app/
├── Events/
│   └── MessageSent.php              # Broadcast event for new messages
├── Http/Controllers/
│   └── ChatController.php           # Main chat logic
├── Models/
│   ├── Conversation.php             # Conversation model
│   ├── Message.php                  # Message model with read receipts
│   └── User.php                     # User model with relationships

database/
├── migrations/
│   ├── *_create_conversations_table.php
│   └── *_create_messages_table.php
└── seeders/
    └── ChatSeeder.php               # Test data generator

resources/js/
├── Pages/Chat/
│   ├── Index.tsx                    # Conversation list page
│   └── Show.tsx                     # Active chat page
├── bootstrap.ts                     # Laravel Echo configuration
└── types/
    └── global.d.ts                  # TypeScript definitions

routes/
├── chat.php                         # Chat HTTP routes
└── channels.php                     # WebSocket authorization
```

---

## 🔌 API Endpoints

| Method | Endpoint                            | Description                             |
| ------ | ----------------------------------- | --------------------------------------- |
| GET    | `/chat`                             | Main chat interface (conversation list) |
| GET    | `/chat/{conversation}`              | View specific conversation              |
| POST   | `/chat/messages`                    | Send a new message                      |
| POST   | `/chat/search-users`                | Search for users to chat with           |
| POST   | `/chat/start-conversation`          | Start a new conversation                |
| POST   | `/chat/{conversation}/mark-as-read` | Mark messages as read                   |

---

## 🔐 WebSocket Channels

### Private Channels

- `chat.{userId}` - User-specific channel for receiving messages
- Requires authentication via Laravel Sanctum/session

### Events

- `MessageSent` - Broadcast when a new message is sent
    - Sent to both sender and receiver channels
    - Contains message data and conversation info

---

## 🧪 Testing

### Test Users (After Seeding)

```bash
php artisan db:seed --class=ChatSeeder
```

| Email               | Password | Name          |
| ------------------- | -------- | ------------- |
| alice@example.com   | password | Alice Johnson |
| bob@example.com     | password | Bob Smith     |
| charlie@example.com | password | Charlie Brown |

### Testing Real-time Features

1. Open two browser windows (or use incognito mode)
2. Log in as different users in each window
3. Navigate to `/chat` in both
4. Send messages and watch them appear instantly
5. Check browser console for WebSocket connection status

---

## 🐛 Troubleshooting

### WebSocket Connection Issues

**Problem:** Can't connect to Reverb server

**Solutions:**

- Ensure Reverb is running: `php artisan reverb:start`
- Check `.env` has correct Reverb configuration
- Verify firewall allows port 8080
- Check browser console for connection errors

### Messages Not Appearing

**Problem:** Messages don't show up in real-time

**Solutions:**

- Verify `BROADCAST_CONNECTION=reverb` in `.env`
- Check Laravel Echo is initialized (browser console)
- Review Reverb logs for broadcasting errors
- Ensure you're authenticated (private channels require auth)

### Database Errors

**Problem:** Migration failures

**Solutions:**

- Verify database credentials in `.env`
- Ensure MySQL/MariaDB is running
- Create database: `CREATE DATABASE livelychat;`
- Run migrations fresh: `php artisan migrate:fresh`

For more troubleshooting tips, see [CHAT_SETUP.md](CHAT_SETUP.md).

---

## 🔮 Future Enhancements

Potential features to add:

- 📝 **Typing Indicators** - Show when someone is typing
- 📎 **File Sharing** - Send images, documents, and media
- 👥 **Group Chats** - Multi-user conversations
- ✏️ **Message Editing** - Edit or delete sent messages
- 😀 **Emoji Reactions** - React to messages with emojis
- 🔔 **Push Notifications** - Browser notifications for new messages
- 🟢 **Online Status** - Show user online/offline status
- 🔍 **Message Search** - Search within conversations
- 🎤 **Voice Messages** - Record and send voice notes
- 📞 **Video Calls** - Integrate WebRTC for video calling

---

## 📖 Documentation

- **[CHAT_SETUP.md](CHAT_SETUP.md)** - Comprehensive setup guide
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Implementation details and file overview
- **[QUICK_START.md](QUICK_START.md)** - Quick reference guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture diagrams

### External Resources

- [Laravel 11 Documentation](https://laravel.com/docs/11.x)
- [Laravel Reverb Documentation](https://laravel.com/docs/11.x/reverb)
- [Laravel Echo Documentation](https://laravel.com/docs/11.x/broadcasting#client-side-installation)
- [Inertia.js Documentation](https://inertiajs.com/)
- [ShadCN UI Components](https://ui.shadcn.com/)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code:

- Follows Laravel and React best practices
- Includes appropriate tests
- Has clear commit messages
- Updates documentation as needed

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built on top of **NertiaKit** Laravel + Inertia.js starter kit
- UI components from **ShadCN UI**
- Icons from **Lucide React**
- Inspired by modern messaging platforms

---

## 💬 Support

If you encounter any issues or have questions:

1. Check the [Documentation](#-documentation)
2. Review [Troubleshooting](#-troubleshooting)
3. Open an [Issue](../../issues)
4. Start a [Discussion](../../discussions)

---

## 🌟 Show Your Support

If you find this project helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔀 Contributing code
- 📢 Sharing with others

---

**Built with ❤️ using Laravel, React, and modern web technologies**
