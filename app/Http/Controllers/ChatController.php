<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Services\ChatService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function __construct(
        protected ChatService $chatService
    ) {}

    /**
     * Display the chat interface with list of conversations.
     */
    public function index(Request $request): Response
    {
        $conversations = $this->chatService->getUserConversations($request->user());

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
        ]);
    }

    /**
     * Display a specific conversation.
     */
    public function show(Request $request, Conversation $conversation): Response
    {
        $user = $request->user();

        // Ensure the user is part of this conversation
        if (!$this->chatService->verifyUserInConversation($conversation, $user)) {
            abort(403, 'Unauthorized access to this conversation.');
        }

        // Mark all messages in this conversation as read
        $this->chatService->markConversationAsRead($conversation, $user);

        // Get messages for this conversation
        $messages = $this->chatService->getConversationMessages($conversation, $user);

        $otherUser = $conversation->getOtherUser($user->id);

        // Get all conversations for sidebar
        $conversations = $this->chatService->getUserConversations($user, $conversation->id);

        return Inertia::render('Chat/Show', [
            'conversation' => [
                'id' => $conversation->id,
                'other_user' => [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'email' => $otherUser->email,
                ],
            ],
            'messages' => $messages,
            'conversations' => $conversations,
        ]);
    }

    /**
     * Store a new message.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'body' => 'required|string|max:5000',
            'conversation_id' => 'nullable|exists:conversations,id',
        ]);

        try {
            $result = $this->chatService->createMessage(
                $request->user(),
                $validated['receiver_id'],
                $validated['body'],
                $validated['conversation_id'] ?? null
            );

            return response()->json($result);
        } catch (\Exception $e) {
            abort(403, $e->getMessage());
        }
    }

    /**
     * Search for users to start a new chat.
     */
    public function searchUsers(Request $request)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:1',
        ]);

        $users = $this->chatService->searchUsers($request->user(), $validated['query']);

        return response()->json(['users' => $users]);
    }

    /**
     * Start a new conversation with a user.
     */
    public function startConversation(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        try {
            $conversation = $this->chatService->startConversation(
                $request->user(),
                $validated['user_id']
            );

            return response()->json([
                'conversation_id' => $conversation->id,
                'redirect_url' => route('chat.show', $conversation),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Mark messages as read.
     */
    public function markAsRead(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        // Ensure the user is part of this conversation
        if (!$this->chatService->verifyUserInConversation($conversation, $user)) {
            abort(403);
        }

        $this->chatService->markConversationAsRead($conversation, $user);

        return response()->json(['success' => true]);
    }
}
