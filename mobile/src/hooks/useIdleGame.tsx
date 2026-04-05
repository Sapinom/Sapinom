import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  IdleState, createIdleState, tickIdle, tap as doTap,
  buyBusiness, buyManager, popBubble as doPopBubble,
  tapBusiness, prestige as doPrestige,
} from '../engine/IdleEngine';

interface IdleGameContextValue {
  state: IdleState;
  start: (name: string) => void;
  tap: () => number;
  buy: (defId: string) => boolean;
  hireManager: (defId: string) => boolean;
  tapBiz: (defId: string) => void;
  popBubble: (id: number) => { amount: number; type: string } | null;
  prestige: () => boolean;
  clearAchievement: () => void;
}

const Ctx = createContext<IdleGameContextValue>(null!);
export const useIdleGame = () => useContext(Ctx);

export function IdleGameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IdleState>({ ...createIdleState(''), started: false } as IdleState);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    if (!state.started) return;
    const interval = setInterval(() => {
      const s = ref.current;
      const now = Date.now();
      const delta = Math.min((now - s.lastTick) / 1000, 0.5);
      if (delta > 0.01) {
        tickIdle(s, delta);
        setState({ ...s });
      }
    }, 33); // ~30fps for smooth progress bars
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

  const tapBiz = useCallback((defId: string) => {
    tapBusiness(ref.current, defId);
    setState({ ...ref.current });
  }, []);

  const popBubbleFn = useCallback((id: number) => {
    const result = doPopBubble(ref.current, id);
    setState({ ...ref.current });
    return result;
  }, []);

  const prestigeFn = useCallback(() => {
    const ok = doPrestige(ref.current);
    setState({ ...ref.current });
    return ok;
  }, []);

  const clearAchievement = useCallback(() => {
    ref.current.lastAchievement = null;
    setState({ ...ref.current });
  }, []);

  return (
    <Ctx.Provider value={{ state, start, tap: tapFn, buy, hireManager, tapBiz, popBubble: popBubbleFn, prestige: prestigeFn, clearAchievement }}>
      {children}
    </Ctx.Provider>
  );
}
