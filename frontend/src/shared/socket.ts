/*
This file keeps the small frontend websocket client with reconnect logic.
Edit this file when websocket connection flow or client-side message handling changes.
Copy this file as a starting point when you add another small websocket client helper.
*/

import type { WsMessage } from "./types";
import { getWsUrl } from "./api";

export type SocketStatus = "idle" | "connecting" | "connected" | "disconnected";

type CreateSocketOptions = {
  onMessage: (message: WsMessage) => void;
  onStatus: (status: SocketStatus) => void;
};

export function createUserSocket(options: CreateSocketOptions) {
  let ws: WebSocket | null = null;
  let stopped = false;
  let reconnectTimer: number | null = null;
  let reconnectDelayMs = 1500;

  const connect = () => {
    reconnectTimer = null;
    options.onStatus("connecting");
    ws = new WebSocket(getWsUrl());
    ws.onopen = () => {
      if (stopped) {
        ws?.close();
        return;
      }
      reconnectDelayMs = 1500;
      options.onStatus("connected");
    };
    ws.onmessage = (event) => {
      let message: WsMessage;
      try {
        message = JSON.parse(event.data) as WsMessage;
      } catch {
        console.warn("Ignored an invalid WebSocket message.");
        return;
      }
      options.onMessage(message);
    };
    ws.onerror = () => {
      if (!stopped) {
        console.warn("WebSocket error.");
      }
    };
    ws.onclose = () => {
      options.onStatus("disconnected");
      if (!stopped) {
        reconnectTimer = window.setTimeout(connect, reconnectDelayMs);
        reconnectDelayMs = Math.min(reconnectDelayMs * 2, 30000);
      }
    };
  };

  // React StrictMode may clean up an effect immediately; avoid opening a socket for that discarded mount.
  reconnectTimer = window.setTimeout(connect, 0);

  return {
    sendPing() {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    },
    stop() {
      stopped = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      if (ws?.readyState === WebSocket.OPEN) {
        ws.close();
      }
    },
  };
}
