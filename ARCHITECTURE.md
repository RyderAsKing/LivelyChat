# LivelyChat - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (User A)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              React Components (TypeScript)                  │ │
│  │  ┌──────────────┐              ┌──────────────┐            │ │
│  │  │ Chat/Index   │              │  Chat/Show   │            │ │
│  │  │              │              │              │            │ │
│  │  │ - Conv List  │ ────────────▶│ - Messages   │            │ │
│  │  │ - User Search│              │ - Input Box  │            │ │
│  │  └──────────────┘              └──────────────┘            │ │
│  │         │                              │                    │ │
│  │         └──────────────┬───────────────┘                    │ │
│  │                        │                                     │ │
│  │                  ┌─────▼─────┐                              │ │
│  │                  │  Laravel  │                              │ │
│  │                  │   Echo    │◀──────────────┐              │ │
│  │                  └───────────┘               │              │ │
│  └────────────────────────────────────────────│─────────────┐ │
└─────────────────────────────────────────────│─────────────────┘
                                              │
                        WebSocket Connection  │
                                              │
┌─────────────────────────────────────────────▼─────────────────┐
│                    Laravel Reverb Server                       │
│                     (localhost:8080)                           │
│                                                                │
│  - Manages WebSocket connections                              │
│  - Broadcasts events to connected clients                     │
│  - Handles channel authentication                             │
│                                                                │
│  Private Channels:                                            │
│  • chat.{userId}  ──▶ User-specific message channel          │
│  • conversation.{id} ──▶ Conversation-specific (optional)    │
└─────────────────────────────────────────────────────────────┘
                                              │
                        Broadcasting Events   │
                                              │
┌─────────────────────────────────────────────▼─────────────────┐
│                   Laravel Application                          │
│                    (localhost:8000)                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Routes Layer                           │ │
│  │  routes/chat.php ──▶ Chat endpoints                       │ │
│  │  routes/channels.php ──▶ WebSocket auth                   │ │
│  └────────────────────────┬─────────────────────────────────┘ │
│                           │                                    │
│  ┌────────────────────────▼─────────────────────────────────┐ │
│  │                  Controllers                              │ │
│  │  ChatController                                           │ │
│  │  • index()  ──▶ List conversations                        │ │
│  │  • show()   ──▶ Display conversation                      │ │
│  │  • store()  ──▶ Send message + broadcast                  │ │
│  │  • searchUsers() ──▶ Find users                           │ │
│  └────────────────────────┬─────────────────────────────────┘ │
│                           │                                    │
│  ┌────────────────────────▼─────────────────────────────────┐ │
│  │                     Events                                │ │
│  │  MessageSent (ShouldBroadcastNow)                         │ │
│  │  • Broadcasts to: chat.{receiverId}, chat.{senderId}     │ │
│  └────────────────────────┬─────────────────────────────────┘ │
│                           │                                    │
│  ┌────────────────────────▼─────────────────────────────────┐ │
│  │                     Models                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │     User     │  │ Conversation │  │   Message    │   │ │
│  │  │              │  │              │  │              │   │ │
│  │  │ - id         │  │ - id         │  │ - id         │   │ │
│  │  │ - name       │  │ - user_one   │  │ - conv_id    │   │ │
│  │  │ - email      │  │ - user_two   │  │ - sender_id  │   │ │
│  │  └──────────────┘  │ - last_msg_at│  │ - receiver   │   │ │
│  │                    └──────────────┘  │ - body       │   │ │
│  │                                      │ - is_read    │   │ │
│  │                                      └──────────────┘   │ │
│  └────────────────────────┬─────────────────────────────────┘ │
│                           │                                    │
│  ┌────────────────────────▼─────────────────────────────────┐ │
│  │                    Database                               │ │
│  │  MySQL/MariaDB                                            │ │
│  │  • users                                                  │ │
│  │  • conversations (unique per user pair)                   │ │
│  │  • messages (with read receipts)                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Message Flow Diagram

```
User A: Type "Hello" and press Send
           │
           ▼
[React Component: Chat/Show.tsx]
   handleSendMessage()
           │
           ▼
[HTTP POST] /chat/messages
   Body: { receiver_id, body, conversation_id }
           │
           ▼
[ChatController@store]
   1. Validate input
   2. Find/Create Conversation
   3. Create Message record
   4. Update last_message_at
           │
           ▼
[Database] INSERT INTO messages
           │
           ▼
[MessageSent Event] broadcast()
   Channels: chat.{userB}, chat.{userA}
           │
           ├────────────────┬────────────────┐
           ▼                ▼                ▼
    [Reverb Server]   [User A Echo]   [User B Echo]
           │                │                │
           │                ▼                ▼
           │          [Skip - sender]  [Add to UI]
           │                           Message appears!
           ▼
[Response] Return message data
           │
           ▼
[User A UI] Message added locally
```

## Component Hierarchy

```
App
 └─ Pages/
     ├─ Chat/Index.tsx
     │   ├─ User Profile Header
     │   ├─ Search Bar
     │   │   └─ Search Results Dropdown
     │   ├─ Conversation List
     │   │   └─ Conversation Item × N
     │   │       ├─ Avatar
     │   │       ├─ User Name
     │   │       ├─ Last Message
     │   │       ├─ Timestamp
     │   │       └─ Unread Badge
     │   └─ Empty State
     │
     └─ Chat/Show.tsx
         ├─ Left Sidebar (same as Index)
         │   ├─ User Profile Header
         │   ├─ Search Bar
         │   └─ Conversation List (with active state)
         │
         └─ Right Chat Window
             ├─ Chat Header
             │   ├─ Avatar
             │   ├─ User Name
             │   └─ User Email
             │
             ├─ Messages Area (ScrollArea)
             │   └─ Message Bubble × N
             │       ├─ Body (text)
             │       ├─ Timestamp
             │       └─ Alignment (left/right)
             │
             └─ Input Area
                 ├─ Text Input
                 └─ Send Button
```

## Data Flow

```
┌────────────┐
│  User      │
│  Action    │
└─────┬──────┘
      │
      ▼
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Frontend  │────▶│  Backend   │────▶│  Database  │
│  (React)   │     │  (Laravel) │     │  (MySQL)   │
└─────┬──────┘     └─────┬──────┘     └────────────┘
      │                  │
      │                  │
      │                  ▼
      │            ┌────────────┐
      │            │   Event    │
      │            │ Broadcast  │
      │            └─────┬──────┘
      │                  │
      │                  ▼
      │            ┌────────────┐
      └────────────│   Reverb   │
   WebSocket      │   Server   │
   Updates        └─────┬──────┘
      ▲                 │
      │                 │
      └─────────────────┘
           Real-time
```

## Authentication Flow (WebSocket)

```
1. User loads chat page
        │
        ▼
2. Laravel Echo connects to Reverb
        │
        ▼
3. Echo requests channel subscription
   Channel: private-chat.{userId}
        │
        ▼
4. Reverb calls Laravel auth endpoint
   GET /broadcasting/auth
        │
        ▼
5. Laravel validates CSRF + Session
   routes/channels.php authorization
        │
        ├─ Authorized ──▶ Subscribe to channel
        │
        └─ Not Authorized ──▶ Reject subscription
                                     │
                                     ▼
                              Connection denied
```

## Technology Stack Layers

```
┌───────────────────────────────────────────┐
│           Presentation Layer              │
│  React 19 + TypeScript + Tailwind CSS    │
│  ShadCN UI Components + Lucide Icons     │
└──────────────┬────────────────────────────┘
               │
┌──────────────▼────────────────────────────┐
│          Application Layer                │
│  Inertia.js (SPA-like experience)        │
│  Laravel Echo (WebSocket client)         │
└──────────────┬────────────────────────────┘
               │
┌──────────────▼────────────────────────────┐
│           Business Logic Layer            │
│  Laravel 11 Controllers + Models         │
│  Spatie Permissions (Authorization)      │
└──────────────┬────────────────────────────┘
               │
┌──────────────▼────────────────────────────┐
│          Real-time Layer                  │
│  Laravel Reverb (WebSocket Server)       │
│  Broadcasting Events + Channels          │
└──────────────┬────────────────────────────┘
               │
┌──────────────▼────────────────────────────┐
│           Data Layer                      │
│  MySQL/MariaDB Database                  │
│  Eloquent ORM                            │
└───────────────────────────────────────────┘
```

## File Structure Map

```
LivelyChat/
├── app/
│   ├── Events/
│   │   └── MessageSent.php ..................... Broadcast event
│   ├── Http/Controllers/
│   │   └── ChatController.php .................. Main logic
│   └── Models/
│       ├── Conversation.php .................... Chat container
│       ├── Message.php ......................... Individual msg
│       └── User.php ............................ User relations
│
├── database/
│   ├── migrations/
│   │   ├── *_create_conversations_table.php ... Conv schema
│   │   └── *_create_messages_table.php ........ Msg schema
│   └── seeders/
│       └── ChatSeeder.php ...................... Test data
│
├── resources/js/
│   ├── Pages/Chat/
│   │   ├── Index.tsx ........................... Conv list UI
│   │   └── Show.tsx ............................ Chat UI
│   ├── bootstrap.ts ............................ Echo setup
│   └── types/
│       └── global.d.ts ......................... TS types
│
├── routes/
│   ├── chat.php ................................ HTTP routes
│   └── channels.php ............................ WS auth
│
├── config/
│   └── broadcasting.php ........................ Reverb config
│
└── Documentation/
    ├── CHAT_SETUP.md ........................... Full setup
    ├── IMPLEMENTATION_SUMMARY.md ............... Overview
    └── QUICK_START.md .......................... Quick ref
```

---

**Legend:**

- `─▶` : Data/Control Flow
- `◀─` : Response/Callback
- `×N` : Multiple instances
- `│` : Vertical connection
- `└─` : Branch/Option
