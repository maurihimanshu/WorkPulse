import { useState, useEffect, useRef } from 'react';
import { Heartbeat, SystemResourceSummary } from '../types';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

interface LiveStreamState {
  heartbeat: Heartbeat | null;
  resources: SystemResourceSummary | null;
  isMonitoring: boolean;
  connectionStatus: ConnectionStatus;
  lastSeen: Date | null;
}

const API_BASE = '/api';

export function useLiveStream(): LiveStreamState {
  const [heartbeat, setHeartbeat] = useState<Heartbeat | null>(null);
  const [resources, setResources] = useState<SystemResourceSummary | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('reconnecting');
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setConnectionStatus((prev) => (prev === 'connected' ? 'reconnecting' : prev));
      const streamUrl = `${API_BASE}/stream/live`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setConnectionStatus('connected');
        setLastSeen(new Date());
        retryCountRef.current = 0;
      };

      es.addEventListener('init', () => {
        if (!isMounted) return;
        setConnectionStatus('connected');
        setLastSeen(new Date());
      });

      es.addEventListener('heartbeat', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data: Heartbeat = JSON.parse(e.data);
          setHeartbeat(data);
          if (data.isMonitoring !== undefined) {
            setIsMonitoring(data.isMonitoring);
          }
          setLastSeen(new Date());
          setConnectionStatus('connected');
        } catch (err) {
          console.debug('Error parsing heartbeat SSE:', err);
        }
      });

      es.addEventListener('resources', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data: SystemResourceSummary = JSON.parse(e.data);
          setResources(data);
          setLastSeen(new Date());
          setConnectionStatus('connected');
        } catch (err) {
          console.debug('Error parsing resources SSE:', err);
        }
      });

      es.addEventListener('control', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(e.data);
          if (data.isMonitoring !== undefined) {
            setIsMonitoring(data.isMonitoring);
          }
          setLastSeen(new Date());
        } catch (err) {
          console.debug('Error parsing control SSE:', err);
        }
      });

      es.addEventListener('ping', () => {
        if (!isMounted) return;
        setLastSeen(new Date());
        setConnectionStatus('connected');
      });

      es.onerror = () => {
        if (!isMounted) return;
        es.close();
        eventSourceRef.current = null;
        retryCountRef.current += 1;

        if (retryCountRef.current > 3) {
          setConnectionStatus('offline');
        } else {
          setConnectionStatus('reconnecting');
        }

        const backoff = Math.min(10000, 1000 * Math.pow(1.5, retryCountRef.current));
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (isMounted) connect();
        }, backoff);
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    heartbeat,
    resources,
    isMonitoring,
    connectionStatus,
    lastSeen,
  };
}
