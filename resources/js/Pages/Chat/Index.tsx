import React, { useState, useRef, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Input } from "@/Components/ui/input";
import { Avatar } from "@/Components/ui/avatar";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionStatus } from "@/Components/ConnectionStatus";
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
    unread_count?: number;
}

interface ChatIndexProps {
    conversations: Conversation[];
}

function Index({ conversations: initialConversations }: ChatIndexProps) {
    const { auth } = usePage().props as any;
    const [conversations, setConversations] =
        useState<Conversation[]>(initialConversations);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Listen for real-time messages to update conversation list
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.private(`chat.${auth.user.id}`);

            channel.listen(".message.sent", (e: any) => {
                // Update the conversation list with new message
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
                                    // Increment unread count if message is not from current user
                                    unread_count:
                                        e.sender_id === auth.user.id
                                            ? conv.unread_count
                                            : (conv.unread_count ?? 0) + 1,
                                };
                            }
                            return conv;
                        },
                    );

                    // Sort by most recent message
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

            return () => {
                channel.stopListening(".message.sent");
            };
        }
    }, [auth.user.id]);

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

    return (
        <>
            <Head title="Chat" />

            <div className="flex h-[calc(100vh-4rem)] bg-background">
                {/* Left Sidebar - Conversations List */}
                <div className="w-full md:w-96 border-r flex flex-col mx-auto md:mx-0">
                    {/* Header */}
                    <div className="p-4 border-b">
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
                                    className="p-4 cursor-pointer transition-colors border-b hover:bg-accent"
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-12 w-12">
                                            <div className="flex h-full w-full items-center justify-center bg-secondary text-secondary-foreground">
                                                {conv.other_user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
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
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {conv.last_message
                                                        .is_mine && "You: "}
                                                    {conv.last_message.body}
                                                </p>
                                            )}
                                            {(conv.unread_count ?? 0) > 0 && (
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center justify-center h-5 px-2 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                                                        {conv.unread_count}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </ScrollArea>
                </div>

                {/* Right Side - Empty State */}
                <div className="hidden md:flex flex-1 items-center justify-center bg-muted/20">
                    <div className="text-center text-muted-foreground">
                        <div className="mb-4">
                            <svg
                                className="mx-auto h-24 w-24 text-muted-foreground/20"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium">
                            Select a conversation
                        </h3>
                        <p className="text-sm mt-1">
                            Choose from your existing conversations or start a
                            new one
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AuthenticatedLayout header={[{ name: "Chat" }]}>
        {page}
    </AuthenticatedLayout>
);

export default Index;
