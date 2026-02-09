import React, { useRef, useEffect } from "react";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onClose: () => void;
}

const EMOJI_CATEGORIES = {
    Smileys: [
        "😀",
        "😃",
        "😄",
        "😁",
        "😅",
        "😂",
        "🤣",
        "😊",
        "😇",
        "🙂",
        "🙃",
        "😉",
        "😌",
        "😍",
        "🥰",
        "😘",
        "😗",
        "😙",
        "😚",
        "😋",
        "😛",
        "😝",
        "😜",
        "🤪",
        "🤨",
        "🧐",
        "🤓",
        "😎",
        "🥳",
        "😏",
        "😒",
        "😞",
        "😔",
        "😟",
        "😕",
        "🙁",
        "😣",
        "😖",
        "😫",
        "😩",
        "🥺",
        "😢",
        "😭",
        "😤",
        "😠",
        "😡",
        "🤬",
        "🤯",
        "😳",
        "🥵",
        "🥶",
        "😱",
        "😨",
        "😰",
        "😥",
        "😓",
    ],
    Gestures: [
        "👋",
        "🤚",
        "🖐",
        "✋",
        "🖖",
        "👌",
        "🤌",
        "🤏",
        "✌️",
        "🤞",
        "🤟",
        "🤘",
        "🤙",
        "👈",
        "👉",
        "👆",
        "🖕",
        "👇",
        "☝️",
        "👍",
        "👎",
        "✊",
        "👊",
        "🤛",
        "🤜",
        "👏",
        "🙌",
        "👐",
        "🤲",
        "🤝",
        "🙏",
    ],
    Hearts: [
        "❤️",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
        "🖤",
        "🤍",
        "🤎",
        "💔",
        "❣️",
        "💕",
        "💞",
        "💓",
        "💗",
        "💖",
        "💘",
        "💝",
        "💟",
    ],
    Objects: [
        "💬",
        "💭",
        "🗨",
        "💡",
        "💣",
        "💥",
        "💫",
        "💦",
        "💨",
        "🔥",
        "⭐",
        "✨",
        "⚡",
        "☀️",
        "🌙",
        "⛅",
        "🌈",
        "☔",
        "⛄",
        "🎉",
        "🎊",
        "🎁",
        "🎈",
        "🏆",
        "🥇",
        "🥈",
        "🥉",
        "⚽",
        "🏀",
        "🎮",
        "🎯",
        "🎲",
        "🎵",
        "🎶",
        "🎤",
        "🎧",
        "📱",
        "💻",
        "⌨️",
        "🖱️",
        "📷",
        "📸",
        "🎬",
        "📺",
        "📻",
        "☕",
        "🍕",
        "🍔",
        "🍟",
        "🌮",
        "🌯",
        "🍜",
        "🍣",
        "🍰",
        "🎂",
        "🍩",
        "🍪",
        "🍫",
        "🍬",
        "🍭",
    ],
};

export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-full mb-2 right-0 bg-popover border rounded-lg shadow-lg p-3 w-80 max-h-80 overflow-y-auto z-50"
        >
            <div className="space-y-3">
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                    <div key={category}>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                            {category}
                        </p>
                        <div className="grid grid-cols-8 gap-1">
                            {emojis.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                        onEmojiSelect(emoji);
                                        onClose();
                                    }}
                                    className="text-2xl hover:bg-accent rounded p-1 transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
