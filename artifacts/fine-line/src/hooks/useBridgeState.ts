import { useSyncExternalStore } from "react";
import { getBridgeState, subscribeBridge } from "../lib/cyanBridge";

export function useBridgeState() {
  return useSyncExternalStore(subscribeBridge, getBridgeState);
}