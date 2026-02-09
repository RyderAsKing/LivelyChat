# LivelyChat - Quick Reference

## 🚀 Getting Started (3 Steps)

### 1. Run Setup Script

```bash
./setup-chat.sh
```

### 2. Configure .env

Add these values to your `.env`:

```env
REVERB_APP_ID=123456
REVERB_APP_KEY=your-key-here
REVERB_APP_SECRET=your-secret-here
```

### 3. Start Servers (3 terminals)

```bash
# Terminal 1
php artisan serve

# Terminal 2
php artisan reverb:start

# Terminal 3
npm run dev
```

Visit: **http://localhost:8000/chat**

---

## 📦 Manual Installation

```bash
# Backend
composer require laravel/reverb
php artisan install:broadcasting

# Frontend
npm install --save laravel-echo pusher-js

# Database
php artisan migrate
php artisan db:seed --class=ChatSeeder  # Optional test data
```

---

## 🧪 Test Users (after seeding)

| Email               | Password | Name          |
| ------------------- | -------- | ------------- |
| alice@example.com   | password | Alice Johnson |
| bob@example.com     | password | Bob Smith     |
| charlie@example.com | password | Charlie Brown |

---

## 🛠️ Common Commands

```bash
# Run migrations
php artisan migrate

# Seed test data
php artisan db:seed --class=ChatSeeder

# Clear cache
php artisan config:clear
php artisan cache:clear

# Check routes
php artisan route:list --path=chat

# Monitor Reverb
php artisan reverb:start --debug
```

---

## 🔍 Debugging

### Check if Reverb is running

```bash
curl http://localhost:8080
```

### Test Echo connection (Browser Console)

```javascript
window.Echo;
// Should show Echo instance

window.Echo.connector.pusher.connection.state;
// Should show: "connected"
```

### View broadcast events

```bash
php artisan reverb:start --debug
# Watch for incoming connections and events
```

---

## 📁 Key Files

| File                                      | Purpose         |
| ----------------------------------------- | --------------- |
| `app/Http/Controllers/ChatController.php` | Main chat logic |
| `app/Events/MessageSent.php`              | Broadcast event |
| `resources/js/Pages/Chat/Show.tsx`        | Chat UI         |
| `resources/js/bootstrap.ts`               | Echo setup      |
| `routes/chat.php`                         | Chat routes     |
| `routes/channels.php`                     | WebSocket auth  |

---

## 🔐 Environment Variables

### Required for Reverb

```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

### Required for Vite

```env
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

---

## 🎯 Routes

```
GET  /chat                              Chat index
GET  /chat/{conversation}               View conversation
POST /chat/messages                     Send message
POST /chat/search-users                 Search users
POST /chat/start-conversation           Start new chat
POST /chat/{conversation}/mark-as-read  Mark as read
```

---

## 🐛 Troubleshooting

| Issue                   | Solution                                            |
| ----------------------- | --------------------------------------------------- |
| WebSocket won't connect | Check Reverb is running: `php artisan reverb:start` |
| Messages not appearing  | Verify `BROADCAST_CONNECTION=reverb` in .env        |
| CORS errors             | Check Reverb allowed origins in config              |
| Database errors         | Run `php artisan migrate`                           |
| Echo undefined          | Check `resources/js/bootstrap.ts` is imported       |

---

## 📚 Documentation

- Full Setup: `CHAT_SETUP.md`
- Implementation Details: `IMPLEMENTATION_SUMMARY.md`
- Laravel Reverb: https://laravel.com/docs/11.x/reverb
- Laravel Echo: https://laravel.com/docs/11.x/broadcasting

---

## ✨ Features

✅ Real-time messaging  
✅ Read receipts  
✅ User search  
✅ Unread badges  
✅ Instagram-style UI  
✅ Responsive design  
✅ TypeScript support  
✅ Message timestamps

---

**Quick Help:** Run `./setup-chat.sh` for automated setup!
