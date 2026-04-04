import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState, createInitialState, gameTick, resolveChoice,
  openBusiness, hireEmployee, upgradeBusiness, takeLoan,
} from '../engine/GameState';
import { TICK_INTERVAL_MS } from '../data/constants';

interface GameContextValue {
  state: GameState;
  start: (name: string) => void;
  togglePause: () => void;
  setSpeed: (s: number) => void;
  doOpenBusiness: (type: string, name: string, city: string) => string | null;
  doHire: (bizId: number) => string | null;
  doUpgrade: (bizId: number) => string | null;
  doLoan: (amount: number, months: number) => string | null;
  doResolveChoice: (index: number) => void;
  doSetPrice: (bizId: number, price: number) => void;
}

const GameContext = createContext<GameContextValue>(null!);
export const useGame = () => useContext(GameContext);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState(''));
  const stateRef = useRef(state);
  stateRef.current = state;

  // Real-time game loop
  useEffect(() => {
    if (!state.started) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.paused || !s.started) return;

      const effectiveInterval = TICK_INTERVAL_MS / s.speed;
      const now = Date.now();
      if (now - s.lastTickTime < effectiveInterval) return;

      gameTick(s);
      setState({ ...s });
    }, 100); // check every 100ms for smooth speed changes

    return () => clearInterval(interval);
  }, [state.started]);

  const start = useCallback((name: string) => {
    const s = createInitialState(name);
    setState(s);
    stateRef.current = s;
  }, []);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    // Don't unpause if there's a pending choice
    if (s.pendingChoice) return;
    s.paused = !s.paused;
    setState({ ...s });
  }, []);

  const setSpeed = useCallback((speed: number) => {
    stateRef.current.speed = speed;
    setState({ ...stateRef.current });
  }, []);

  const doOpenBusiness = useCallback((type: string, name: string, city: string) => {
    const err = openBusiness(stateRef.current, type, name, city);
    setState({ ...stateRef.current });
    return err;
  }, []);

  const doHire = useCallback((bizId: number) => {
    const err = hireEmployee(stateRef.current, bizId);
    setState({ ...stateRef.current });
    return err;
  }, []);

  const doUpgrade = useCallback((bizId: number) => {
    const err = upgradeBusiness(stateRef.current, bizId);
    setState({ ...stateRef.current });
    return err;
  }, []);

  const doLoan = useCallback((amount: number, months: number) => {
    const err = takeLoan(stateRef.current, amount, months);
    setState({ ...stateRef.current });
    return err;
  }, []);

  const doResolveChoice = useCallback((index: number) => {
    resolveChoice(stateRef.current, index);
    setState({ ...stateRef.current });
  }, []);

  const doSetPrice = useCallback((bizId: number, price: number) => {
    const biz = stateRef.current.businesses.find(b => b.id === bizId);
    if (biz) biz.price = price;
    setState({ ...stateRef.current });
  }, []);

  return (
    <GameContext.Provider value={{
      state, start, togglePause, setSpeed,
      doOpenBusiness, doHire, doUpgrade, doLoan, doResolveChoice, doSetPrice,
    }}>
      {children}
    </GameContext.Provider>
  );
}
