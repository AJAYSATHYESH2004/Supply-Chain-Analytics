import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (path, onMessage, dependencies = []) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let active = true;

    const connect = () => {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        console.warn("[WebSocket] No auth token found, delaying connection.");
        // Try again in 3 seconds in case login is in progress
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
        return;
      }

      // Automatically construct WebSocket URL pointing to the backend (port 8000)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Determine correct host/port. If running locally, Vite runs on 5173 but backend on 8000
      let wsHost = window.location.host;
      if (wsHost.includes('localhost:') || wsHost.includes('127.0.0.1:')) {
        wsHost = 'localhost:8000';
      }
      
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const wsUrl = `${wsProtocol}//${wsHost}${normalizedPath}?token=${token}`;

      console.log(`[WebSocket] Connecting to: ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (active) {
          setConnected(true);
          console.log(`[WebSocket] Connected: ${path}`);
        }
      };

      socket.onmessage = (event) => {
        if (active && onMessage) {
          try {
            const data = JSON.parse(event.data);
            onMessage(data);
          } catch (err) {
            console.error("[WebSocket] Failed to parse message:", err);
          }
        }
      };

      socket.onclose = (e) => {
        if (active) {
          setConnected(false);
          console.log(`[WebSocket] Connection closed: ${path}. Reconnecting in 3 seconds...`);
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      socket.onerror = (err) => {
        console.error(`[WebSocket] Socket error on ${path}:`, err);
        socket.close();
      };
    };

    connect();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [path, ...dependencies]);

  const send = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Cannot send message, socket is not connected.");
    }
  };

  return { connected, send };
};
