import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  disabled?: boolean;
}

export const usePullToRefresh = (options: UsePullToRefreshOptions) => {
  const {
    onRefresh,
    threshold = 80,
    resistance = 2.5,
    disabled = false
  } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    let startY = 0;
    let currentY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if scrolled to top
      scrollTop = container.scrollTop;
      if (scrollTop > 0) return;

      startY = e.touches[0].clientY;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || scrollTop > 0) return;

      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0) {
        // Apply resistance for smooth feel
        const distance = Math.min(diff / resistance, threshold * 1.5);
        setPullDistance(distance);
        
        // Prevent default scroll if pulling down significantly
        if (diff > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setIsPulling(false);
      setPullDistance(0);
      startY = 0;
      currentY = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, resistance, onRefresh, disabled, isRefreshing]);

  return {
    ref: containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    // Helper to get pull indicator transform
    getPullTransform: () => {
      const scale = Math.min(pullDistance / threshold, 1);
      const opacity = Math.min(pullDistance / (threshold * 0.5), 1);
      return {
        transform: `translateY(${pullDistance}px) scale(${0.8 + scale * 0.2})`,
        opacity: opacity
      };
    },
    // Check if should show refresh indicator
    shouldShowRefreshIndicator: () => pullDistance > threshold * 0.5 || isRefreshing
  };
};