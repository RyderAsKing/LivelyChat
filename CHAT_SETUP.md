# LivelyChat Setup Instructions

## Prerequisites

Before setting up LivelyChat, ensure you have:

- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- MySQL/MariaDB database
- Laravel Reverb requirements

## Installation Steps

### 1. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install

# Install additional packages for Echo and Reverb
npm install --save laravel-echo pusher-js
composer require laravel/reverb
```

### 2. Environment Configuration

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Update your `.env` file with your database credentials and other settings:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=livelychat
DB_USERNAME=your_username
DB_PASSWORD=your_password

BROADCAST_CONNECTION=reverb
```

Generate application key:

```bash
php artisan key:generate
```

### 3. Install and Configure Laravel Reverb

Install broadcasting:

```bash
php artisan install:broadcasting
```

This will:

- Publish the broadcasting configuration
- Set up the necessary routes and channels
- Configure Laravel Echo

After installation, make sure your `.env` has the Reverb credentials:

```env
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### 4. Database Setup

Run migrations to create the necessary tables:

```bash
php artisan migrate
```

This will create:

- `conversations` table - stores chat conversations between users
- `messages` table - stores individual messages

Optionally, seed the database with test data:

```bash
php artisan db:seed
```

### 5. Build Frontend Assets

Compile the frontend assets:

```bash
# For development
npm run dev

# For production
npm run build
```

### 6. Start the Application

You'll need to run three separate processes:

**Terminal 1 - Laravel Application:**

```bash
php artisan serve
```

**Terminal 2 - Reverb WebSocket Server:**

```bash
php artisan reverb:start
```

**Terminal 3 - Frontend Dev Server (if in development):**

```bash
npm run dev
```

### 7. Queue Worker (Optional but Recommended)

For better performance with broadcasting, run a queue worker:

```bash
php artisan queue:work
```

## Accessing the Application

1. Open your browser and navigate to `http://localhost:8000` (or your configured APP_URL)
2. Register a new account or log in
3. Navigate to `/chat` to access the messaging interface

## Features

### Real-time Messaging

- Instant message delivery using Laravel Reverb WebSockets
- Read receipts
- Typing indicators (can be added)
- Message notifications

### User Interface

- Instagram-inspired design
- Split-screen layout (conversations list + active chat)
- User search to start new conversations
- Unread message badges
- Responsive design for mobile and desktop

### Technical Implementation

- **Backend:** Laravel 11 with Inertia.js
- **Frontend:** React with TypeScript
- **Real-time:** Laravel Reverb (WebSockets)
- **UI Framework:** Tailwind CSS + ShadCN UI components
- **State Management:** Inertia.js with React hooks

## API Endpoints

### Chat Routes (authenticated users only)

- `GET /chat` - Main chat interface
- `GET /chat/{conversation}` - Specific conversation view
- `POST /chat/messages` - Send a new message
- `POST /chat/search-users` - Search for users to chat with
- `POST /chat/start-conversation` - Initiate a new conversation
- `POST /chat/{conversation}/mark-as-read` - Mark messages as read

## Broadcasting Channels

### Private Channels

- `chat.{userId}` - User-specific channel for receiving messages
- `conversation.{conversationId}` - Conversation-specific channel (optional)

### Events

- `MessageSent` - Broadcast when a new message is sent

## Database Schema

### Conversations Table

- `id` - Primary key
- `user_one_id` - Foreign key to users
- `user_two_id` - Foreign key to users
- `last_message_at` - Timestamp of last message
- Unique constraint on `[user_one_id, user_two_id]`

### Messages Table

- `id` - Primary key
- `conversation_id` - Foreign key to conversations
- `sender_id` - Foreign key to users (sender)
- `receiver_id` - Foreign key to users (receiver)
- `body` - Message text
- `is_read` - Boolean flag for read status
- Timestamps

## Troubleshooting

### WebSocket Connection Issues

If you can't connect to the WebSocket server:

1. Ensure Reverb is running: `php artisan reverb:start`
2. Check your `.env` configuration matches Reverb settings
3. Verify firewall/ports are open (default: 8080)
4. Check browser console for connection errors

### Messages Not Appearing

1. Check that broadcasting is enabled in `.env`: `BROADCAST_CONNECTION=reverb`
2. Verify Laravel Echo is properly initialized in browser console
3. Check Reverb logs for errors
4. Ensure you're authenticated (private channels require auth)

### Database Errors

If migrations fail:

1. Check database credentials in `.env`
2. Ensure MySQL/MariaDB is running
3. Verify database exists: `CREATE DATABASE livelychat;`

### Frontend Build Issues

If npm build fails:

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Vite cache: `rm -rf node_modules/.vite`

## Development Tips

### Testing Real-time Features

1. Open two browser windows/tabs
2. Log in as different users in each
3. Start a conversation and test message delivery
4. Check browser console and Reverb logs for debugging

### Adding Features

The architecture supports easy extension:

- **New message types:** Extend the `Message` model and migration
- **Typing indicators:** Add new events and listeners
- **File uploads:** Add file storage and update message schema
- **Group chats:** Extend conversation model to support multiple users
- **Emoji reactions:** Add reactions table and real-time updates

## Production Deployment

For production deployment:

1. Set `APP_ENV=production` and `APP_DEBUG=false`
2. Configure a proper WebSocket server (wss://)
3. Use a process manager (Supervisor) for queue workers and Reverb
4. Set up SSL/TLS certificates
5. Configure proper CORS settings
6. Use a production-ready database
7. Enable caching: `php artisan config:cache`

## License

This project is built on NertiaKit and uses open-source components.
