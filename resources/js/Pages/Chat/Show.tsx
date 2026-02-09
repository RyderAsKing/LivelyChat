import React, { useState, useEffect, useRef } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Avatar } from "@/Components/ui/avatar";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Separator } from "@/Components/ui/separator";
import {
    Search,
    Send,
    ArrowLeft,
    Check,
    CheckCheck,
    Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionStatus } from "@/Components/ConnectionStatus";
import { EmojiPicker } from "@/Components/EmojiPicker";
import axios from "axios";
interface User {
    id: number;
    name: string;
    email: string;
}

interface Conversation {
    id: number;
    other_user: User;
    last_message: {
        body: string;
        created_at: string;
        is_mine: boolean;
    } | null;
    last_message_at: string | null;
    is_active?: boolean;
    unread_count?: number;
}

interface Message {
    id: number;
    body: string;
    is_mine: boolean;
    is_read: boolean;
    sender: {
        id: number;
        name: string;
    };
    created_at: string;
    created_at_full: string;
}

interface ChatShowProps {
    conversation: {
        id: number;
        other_user: User;
    };
    messages: Message[];
    conversations: Conversation[];
}

function Show({
    conversation,
    messages: initialMessages,
    conversations: initialConversations,
}: ChatShowProps) {
    const { auth } = usePage().props as any;
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [conversations, setConversations] =
        useState<Conversation[]>(initialConversations);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const typingDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const typingIsActiveRef = useRef(false);

    // Check if user is scrolled near the bottom (within 100px)
    const isNearBottom = () => {
        if (!scrollAreaRef.current) return true;
        const scrollElement = scrollAreaRef.current.querySelector(
            "[data-radix-scroll-area-viewport]",
        ) as HTMLElement;
        if (!scrollElement) return true;
        const { scrollHeight, scrollTop, clientHeight } = scrollElement;
        return scrollHeight - scrollTop - clientHeight < 100;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Focus input after message is sent
    useEffect(() => {
        if (!isSending && newMessage === "") {
            inputRef.current?.focus();
        }
    }, [isSending, newMessage]);

    useEffect(() => {
        // Only scroll if user is near the bottom
        if (isNearBottom()) {
            scrollToBottom();
        }
    }, [messages]);

    // Scroll when typing indicator appears and user is near bottom
    useEffect(() => {
        if (isOtherUserTyping && isNearBottom()) {
            scrollToBottom();
        }
    }, [isOtherUserTyping]);

    useEffect(() => {
        // Listen for new messages via Echo
        if (window.Echo) {
            const userChannel = window.Echo.private(`chat.${auth.user.id}`);
            const conversationChannel = window.Echo.private(
                `conversation.${conversation.id}`,
            );

            // Listen for new messages
            userChannel.listen(".message.sent", (e: any) => {
                // Update messages if for current conversation
                if (e.conversation_id === conversation.id) {
                    // Hide typing indicator when message is received
                    setIsOtherUserTyping(false);
                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                    }

                    const newMsg: Message = {
                        id: e.id,
                        body: e.body,
                        is_mine: e.sender_id === auth.user.id,
                        is_read: e.is_read,
                        sender: {
                            id: e.sender.id,
                            name: e.sender.name,
                        },
                        created_at: new Date(e.created_at).toLocaleTimeString(
                            "en-US",
                            {
                                hour: "2-digit",
                                minute: "2-digit",
                            },
                        ),
                        created_at_full: e.created_at,
                    };
                    setMessages((prev) => [...prev, newMsg]);

                    // Mark as read if viewing this conversation
                    if (!newMsg.is_mine) {
                        axios.post(`/chat/${conversation.id}/mark-as-read`);
                    }
                }

                // Update sidebar conversation list for ALL messages
                setConversations((prevConversations) => {
                    const updatedConversations = prevConversations.map(
                        (conv) => {
                            if (conv.id === e.conversation_id) {
                                return {
                                    ...conv,
                                    last_message: {
                                        body: e.body,
                                        created_at: new Date(
                                            e.created_at,
                                        ).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }),
                                        is_mine: e.sender_id === auth.user.id,
                                    },
                                    last_message_at: e.created_at,
                                    is_active: conv.id === conversation.id,
                                    // Only increment unread if NOT the active conversation and NOT from current user
                                    unread_count:
                                        conv.id === conversation.id ||
                                        e.sender_id === auth.user.id
                                            ? conv.unread_count
                                            : (conv.unread_count ?? 0) + 1,
                                };
                            }
                            return conv;
                        },
                    );

                    // Sort by most recent
                    return updatedConversations.sort((a, b) => {
                        const dateA = a.last_message_at
                            ? new Date(a.last_message_at).getTime()
                            : 0;
                        const dateB = b.last_message_at
                            ? new Date(b.last_message_at).getTime()
                            : 0;
                        return dateB - dateA;
                    });
                });
            });

            // Listen for typing indicator
            conversationChannel.listen(".user.typing", (e: any) => {
                if (e.user_id !== auth.user.id) {
                    setIsOtherUserTyping(true);

                    // Clear existing timeout
                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                    }

                    // Hide typing indicator after 5 seconds
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsOtherUserTyping(false);
                    }, 5000);
                }
            });

            // Listen for read receipts
            conversationChannel.listen(".message.read", (e: any) => {
                if (e.user_id !== auth.user.id) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            e.message_ids.includes(msg.id)
                                ? { ...msg, is_read: true }
                                : msg,
                        ),
                    );
                }
            });

            return () => {
                userChannel.stopListening(".message.sent");
                conversationChannel.stopListening(".user.typing");
                conversationChannel.stopListening(".message.read");
            };
        }
    }, [conversation.id, auth.user.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        typingIsActiveRef.current = false;

        // Clear typing timeout
        if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
        }

        try {
            const response = await axios.post("/chat/messages", {
                receiver_id: conversation.other_user.id,
                body: newMessage,
                conversation_id: conversation.id,
            });

            // Add the message to the local state
            setMessages((prev) => [...prev, response.data.message]);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await axios.post("/chat/search-users", {
                    query,
                });
                setSearchResults(response.data.users);
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleStartConversation = async (userId: number) => {
        try {
            const response = await axios.post("/chat/start-conversation", {
                user_id: userId,
            });
            router.visit(response.data.redirect_url);
        } catch (error) {
            console.error("Error starting conversation:", error);
        }
    };

    const handleTyping = () => {
        // Send typing event immediately on first keystroke
        if (!typingIsActiveRef.current) {
            typingIsActiveRef.current = true;
            axios
                .post(`/chat/${conversation.id}/typing`)
                .catch((error) =>
                    console.error("Error broadcasting typing:", error),
                );
        }

        // Clear existing debounce timeout
        if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
        }

        // Debounce subsequent typing broadcasts to every 1 second
        typingDebounceRef.current = setTimeout(() => {
            if (typingIsActiveRef.current) {
                axios
                    .post(`/chat/${conversation.id}/typing`)
                    .catch((error) =>
                        console.error("Error broadcasting typing:", error),
                    );
            }
        }, 1000);
    };

    const handleEmojiSelect = (emoji: string) => {
        setNewMessage((prev) => prev + emoji);
    };

    return (
        <>
            <Head title="Chat" />

            <div className="flex h-[calc(100vh-4rem)] bg-background">
                {/* Left Sidebar - Conversations List */}
                <div className="w-full md:w-96 border-r flex flex-col">
                    {/* Header */}
                    <div className="border-b p-4">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                                        {auth.user.name.charAt(0).toUpperCase()}
                                    </div>
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="font-semibold">
                                        {auth.user.name}
                                    </h2>
                                </div>
                            </div>
                            <ConnectionStatus />
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 border rounded-md bg-card">
                                <ScrollArea className="max-h-60">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            className="p-3 hover:bg-accent cursor-pointer transition-colors"
                                            onClick={() => {
                                                handleStartConversation(
                                                    user.id,
                                                );
                                                setSearchQuery("");
                                                setSearchResults([]);
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <div className="flex h-full w-full items-center justify-center bg-secondary text-secondary-foreground">
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    {/* Conversations List */}
                    <ScrollArea className="flex-1">
                        {conversations.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                <p>No conversations yet</p>
                                <p className="text-sm mt-1">
                                    Search for a user to start chatting
                                </p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() =>
                                        router.visit(`/chat/${conv.id}`)
                                    }
                                    className={cn(
                                        "p-4 cursor-pointer transition-colors border-b hover:bg-accent/50",
                                        conv.is_active && "bg-accent/50",
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-12 w-12 rounded-full overflow-visible">
                                            <div className="flex h-full w-full items-center justify-center bg-secondary text-secondary-foreground rounded-full">
                                                {conv.other_user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            {(conv.unread_count ?? 0) > 0 && (
                                                <div className="absolute -bottom-0 -right-1">
                                                    <span className="inline-flex items-center justify-center h-5 px-2 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                                                        {conv.unread_count}
                                                    </span>
                                                </div>
                                            )}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-semibold truncate">
                                                    {conv.other_user.name}
                                                </p>
                                                {conv.last_message && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {
                                                            conv.last_message
                                                                .created_at
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                            {conv.last_message && (
                                                <p className="text-sm text-muted-foreground truncate flex justify-between items-center">
                                                    {conv.last_message
                                                        .is_mine && "You: "}
                                                    {
                                                        conv.last_message.body
                                                    }{" "}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </ScrollArea>
                </div>

                {/* Right Chat Window */}
                <div className="flex-1 flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => router.visit("/chat")}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Avatar className="h-10 w-10">
                            <div className="flex h-full w-full items-center justify-center bg-secondary text-secondary-foreground">
                                {conversation.other_user.name
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold">
                                {conversation.other_user.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {conversation.other_user.email}
                            </p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>No messages yet</p>
                                    <p className="text-sm mt-1">
                                        Start the conversation!
                                    </p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "flex",
                                            message.is_mine
                                                ? "justify-end"
                                                : "justify-start",
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[70%] rounded-lg px-4 py-2",
                                                message.is_mine
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-secondary text-secondary-foreground",
                                            )}
                                        >
                                            <p className="text-sm break-words">
                                                {message.body}
                                            </p>
                                            <div className="flex items-center gap-1 justify-end mt-1">
                                                <p
                                                    className={cn(
                                                        "text-xs",
                                                        message.is_mine
                                                            ? "text-primary-foreground/70"
                                                            : "text-muted-foreground",
                                                    )}
                                                >
                                                    {message.created_at}
                                                </p>
                                                {message.is_mine &&
                                                    (message.is_read ? (
                                                        <CheckCheck className="h-3 w-3 text-blue-400" />
                                                    ) : (
                                                        <Check
                                                            className={cn(
                                                                "h-3 w-3",
                                                                message.is_mine
                                                                    ? "text-primary-foreground/70"
                                                                    : "text-muted-foreground",
                                                            )}
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isOtherUserTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2">
                                        <div className="flex items-center gap-1">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                        <form
                            onSubmit={handleSendMessage}
                            className="flex gap-2 relative"
                        >
                            <div className="flex-1 relative">
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    disabled={isSending}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                    onClick={() =>
                                        setShowEmojiPicker(!showEmojiPicker)
                                    }
                                >
                                    <Smile className="h-4 w-4" />
                                </Button>
                                {showEmojiPicker && (
                                    <EmojiPicker
                                        onEmojiSelect={handleEmojiSelect}
                                        onClose={() =>
                                            setShowEmojiPicker(false)
                                        }
                                    />
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page: React.ReactNode) => (
    <AuthenticatedLayout header={[{ name: "Chat" }]}>
        {page}
    </AuthenticatedLayout>
);

export default Show;
