import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useWebSocketConnection,
    ConnectionStatus as Status,
} from "@/hooks/useWebSocketConnection";

export function ConnectionStatus() {
    const status = useWebSocketConnection();

    const getStatusConfig = (status: Status) => {
        switch (status) {
            case "connected":
                return {
                    icon: Wifi,
                    text: "Connected",
                    color: "text-green-600 dark:text-green-500",
                    bgColor: "bg-green-100 dark:bg-green-950",
                };
            case "connecting":
                return {
                    icon: Loader2,
                    text: "Connecting...",
                    color: "text-yellow-600 dark:text-yellow-500",
                    bgColor: "bg-yellow-100 dark:bg-yellow-950",
                    animate: true,
                };
            case "disconnected":
                return {
                    icon: WifiOff,
                    text: "Disconnected",
                    color: "text-red-600 dark:text-red-500",
                    bgColor: "bg-red-100 dark:bg-red-950",
                };
        }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
        <div
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                config.bgColor,
                config.color,
            )}
        >
            <Icon
                className={cn("h-3.5 w-3.5", config.animate && "animate-spin")}
            />
            <span>{config.text}</span>
        </div>
    );
}
