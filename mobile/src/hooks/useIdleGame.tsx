import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  IdleState, createIdleState, tickIdle, tap as doTap,
  buyBusiness, buyManager, buyUpgrade, startBusiness,
} from '../engine/IdleEngine';

interface IdleGameContextValue {
  state: IdleState;
  start: (name: string) => void;
  tap: () => number;
  buy: (defId: string) => boolean;
  hireManager: (defId: string) => boolean;
  upgrade: (upgradeId: string) => boolean;
  tapBusiness: (defId: string) => void;
}

const Ctx = createContext<IdleGameContextValue>(null!);
export const useIdleGame = () => useContext(Ctx);

export function IdleGameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IdleState>({ ...createIdleState(''), started: false } as IdleState);
  const ref = useRef(state);
  ref.current = state;

  // Main game loop — runs every 50ms for smooth progress bars
  useEffect(() => {
    if (!state.started) return;
    const interval = setInterval(() => {
      const s = ref.current;
      const now = Date.now();
      const delta = (now - s.lastTick) / 1000;
      if (delta > 0.01) {
        tickIdle(s, Math.min(delta, 1)); // cap delta to prevent huge jumps
        setState({ ...s });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [state.started]);

  const start = useCallback((name: string) => {
    const s = createIdleState(name);
    ref.current = s;
    setState(s);
  }, []);

  const tapFn = useCallback(() => {
    const amount = doTap(ref.current);
    setState({ ...ref.current });
    return amount;
  }, []);

  const buy = useCallback((defId: string) => {
    const ok = buyBusiness(ref.current, defId);
    setState({ ...ref.current });
    return ok;
  }, []);

  const hireManager = useCallback((defId: string) => {
    const ok = buyManager(ref.current, defId);
    setState({ ...ref.current });
    return ok;
  }, []);

  const upgrade = useCallback((upgradeId: string) => {
    const ok = buyUpgrade(ref.current, upgradeId);
    setState({ ...ref.current });
    return ok;
  }, []);

  const tapBusiness = useCallback((defId: string) => {
    startBusiness(ref.current, defId);
    setState({ ...ref.current });
  }, []);

  return (
    <Ctx.Provider value={{ state, start, tap: tapFn, buy, hireManager, upgrade, tapBusiness }}>
      {children}
    </Ctx.Provider>
  );
}
