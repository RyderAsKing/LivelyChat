import { useState, useEffect } from "react";

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export const useWebSocketConnection = () => {
    const [status, setStatus] = useState<ConnectionStatus>("connecting");

    useEffect(() => {
        if (!window.Echo) {
            setStatus("disconnected");
            return;
        }

        const connector = window.Echo.connector;

        // Check initial connection state
        if (connector.pusher.connection.state === "connected") {
            setStatus("connected");
        }

        // Listen for connection state changes
        const handleConnected = () => setStatus("connected");
        const handleConnecting = () => setStatus("connecting");
        const handleDisconnected = () => setStatus("disconnected");
        const handleUnavailable = () => setStatus("disconnected");
        const handleFailed = () => setStatus("disconnected");

        connector.pusher.connection.bind("connected", handleConnected);
        connector.pusher.connection.bind("connecting", handleConnecting);
        connector.pusher.connection.bind("disconnected", handleDisconnected);
        connector.pusher.connection.bind("unavailable", handleUnavailable);
        connector.pusher.connection.bind("failed", handleFailed);

        return () => {
            connector.pusher.connection.unbind("connected", handleConnected);
            connector.pusher.connection.unbind("connecting", handleConnecting);
            connector.pusher.connection.unbind(
                "disconnected",
                handleDisconnected,
            );
            connector.pusher.connection.unbind(
                "unavailable",
                handleUnavailable,
            );
            connector.pusher.connection.unbind("failed", handleFailed);
        };
    }, []);

    return status;
};
