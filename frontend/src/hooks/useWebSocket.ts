import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketMessage, Question } from '@/types/api';

interface UseWebSocketOptions {
  onNewQuestion?: (question: Question) => void;
  onQuestionAnswered?: (question: Question) => void;
}

interface UseWebSocketReturn {
  lastMessage: WebSocketMessage | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  error: string | null;
}

/**
 * WebSocket hook for real-time Q&A updates
 * @param sessionId - Session ID to connect to
 * @param options - Callbacks for handling events
 */
export const useWebSocket = (sessionId: number, options?: UseWebSocketOptions): UseWebSocketReturn => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const optionsRef = useRef(options);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    if (!sessionId) return;

    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/session/${sessionId}/`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected to session', sessionId);
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('📨 WebSocket message received:', message.type, message.data);
          setLastMessage(message);

          // Handle specific message types with callbacks
          if (message.type === 'new_question' && optionsRef.current?.onNewQuestion) {
            optionsRef.current.onNewQuestion(message.data);
          } else if (message.type === 'question_answered' && optionsRef.current?.onQuestionAnswered) {
            optionsRef.current.onQuestionAnswered(message.data);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (!event.wasClean && sessionId) {
          console.log('🔄 Will attempt to reconnect in 3 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [sessionId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', message);
    } else {
      console.warn('⚠️ WebSocket is not connected. Cannot send message.');
    }
  }, []);

  return { lastMessage, isConnected, sendMessage, error };
};
