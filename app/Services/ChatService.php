<?php

namespace App\Services;

use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Collection;

class ChatService
{
    /**
     * Get all conversations for a user with formatted data.
     */
    public function getUserConversations(User $user, ?int $activeConversationId = null): Collection
    {
        return Conversation::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->with(['userOne', 'userTwo', 'latestMessage'])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function ($conversation) use ($user, $activeConversationId) {
                return $this->formatConversation($conversation, $user, $activeConversationId);
            });
    }

    /**
     * Format a conversation for API response.
     */
    public function formatConversation(Conversation $conversation, User $user, ?int $activeConversationId = null): array
    {
        $otherUser = $conversation->getOtherUser($user->id);

        return [
            'id' => $conversation->id,
            'other_user' => [
                'id' => $otherUser->id,
                'name' => $otherUser->name,
                'email' => $otherUser->email,
            ],
            'last_message' => $conversation->latestMessage ? [
                'body' => $conversation->latestMessage->body,
                'created_at' => $conversation->latestMessage->created_at->diffForHumans(),
                'is_mine' => $conversation->latestMessage->sender_id === $user->id,
            ] : null,
            'last_message_at' => $conversation->last_message_at?->toISOString(),
            'is_active' => $activeConversationId ? $conversation->id === $activeConversationId : null,
            'unread_count' => $this->getUnreadCount($conversation->id, $user->id),
        ];
    }

    /**
     * Get formatted messages for a conversation.
     */
    public function getConversationMessages(Conversation $conversation, User $user): Collection
    {
        return $conversation->messages()
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($user) {
                return $this->formatMessage($message, $user);
            });
    }

    /**
     * Format a message for API response.
     */
    public function formatMessage(Message $message, User $user): array
    {
        return [
            'id' => $message->id,
            'body' => $message->body,
            'is_mine' => $message->sender_id === $user->id,
            'is_read' => $message->is_read,
            'sender' => [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
            ],
            'created_at' => $message->created_at->format('H:i'),
            'created_at_full' => $message->created_at->toISOString(),
        ];
    }

    /**
     * Get unread message count for a conversation.
     */
    public function getUnreadCount(int $conversationId, int $userId): int
    {
        return Message::where('conversation_id', $conversationId)
            ->where('receiver_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Mark all messages in a conversation as read for a user.
     */
    public function markConversationAsRead(Conversation $conversation, User $user): int
    {
        $messageIds = Message::where('conversation_id', $conversation->id)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->pluck('id')
            ->toArray();

        if (empty($messageIds)) {
            return 0;
        }

        $count = Message::whereIn('id', $messageIds)->update(['is_read' => true]);

        // Broadcast read receipt to the conversation channel
        broadcast(new MessageRead($conversation->id, $messageIds, $user->id));

        return $count;
    }

    /**
     * Create a new message in a conversation.
     */
    public function createMessage(
        User $sender,
        int $receiverId,
        string $body,
        ?int $conversationId = null
    ): array {
        // Find or create conversation
        if ($conversationId) {
            $conversation = Conversation::findOrFail($conversationId);

            // Verify sender is part of this conversation
            if ($conversation->user_one_id !== $sender->id && $conversation->user_two_id !== $sender->id) {
                throw new \Exception('Unauthorized access to this conversation.');
            }
        } else {
            $conversation = Conversation::findOrCreateBetween($sender->id, $receiverId);
        }

        // Create the message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'receiver_id' => $receiverId,
            'body' => $body,
            'is_read' => false,
        ]);

        // Update conversation's last_message_at
        $conversation->update([
            'last_message_at' => now(),
        ]);

        // Load sender relationship for broadcasting
        $message->load('sender');

        // Broadcast the event
        broadcast(new MessageSent($message))->toOthers();

        return [
            'message' => $this->formatMessage($message, $sender),
            'conversation_id' => $conversation->id,
        ];
    }

    /**
     * Search for users excluding the current user.
     */
    public function searchUsers(User $currentUser, string $query, int $limit = 10): Collection
    {
        return User::where('id', '!=', $currentUser->id)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                    ->orWhere('email', 'like', '%' . $query . '%');
            })
            ->limit($limit)
            ->get(['id', 'name', 'email']);
    }

    /**
     * Start or get existing conversation between two users.
     */
    public function startConversation(User $user, int $otherUserId): Conversation
    {
        // Prevent starting conversation with self
        if ($user->id === $otherUserId) {
            throw new \InvalidArgumentException('Cannot start conversation with yourself.');
        }

        return Conversation::findOrCreateBetween($user->id, $otherUserId);
    }

    /**
     * Verify if a user is part of a conversation.
     */
    public function verifyUserInConversation(Conversation $conversation, User $user): bool
    {
        return $conversation->user_one_id === $user->id || $conversation->user_two_id === $user->id;
    }
}
