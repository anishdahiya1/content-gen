"use client";

import { useState, useEffect } from 'react';

export function useCredits() {
  const [credits, setCredits] = useState<number>(3);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('creator_credits');
    if (saved !== null) {
      setCredits(parseInt(saved, 10));
    } else {
      localStorage.setItem('creator_credits', '3');
    }
    setIsLoaded(true);
  }, []);

  const useCredit = () => {
    if (credits > 0) {
      const newCredits = credits - 1;
      setCredits(newCredits);
      localStorage.setItem('creator_credits', newCredits.toString());
      return true;
    }
    return false;
  };

  return { credits, useCredit, isLoaded };
}
