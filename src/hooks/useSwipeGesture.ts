import { useEffect, useRef, useState } from 'react';

interface TouchGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventScroll?: boolean;
}

export const useSwipeGesture = (options: UseSwipeGestureOptions) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScroll = false
  } = options;

  const [gesture, setGesture] = useState<TouchGesture | null>(null);
  const [isActive, setIsActive] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let startTouch: Touch | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startTouch = touch;
      
      const newGesture: TouchGesture = {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        distance: 0,
        direction: null
      };

      setGesture(newGesture);
      setIsActive(true);

      if (preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startTouch || !gesture) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startTouch.clientX;
      const deltaY = touch.clientY - startTouch.clientY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      let direction: TouchGesture['direction'] = null;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      const updatedGesture: TouchGesture = {
        ...gesture,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX,
        deltaY,
        distance,
        direction
      };

      setGesture(updatedGesture);

      if (preventScroll && distance > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!gesture) return;

      if (gesture.distance > threshold) {
        switch (gesture.direction) {
          case 'left':
            onSwipeLeft?.();
            break;
          case 'right':
            onSwipeRight?.();
            break;
          case 'up':
            onSwipeUp?.();
            break;
          case 'down':
            onSwipeDown?.();
            break;
        }
      }

      setGesture(null);
      setIsActive(false);
      startTouch = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gesture, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventScroll]);

  return {
    ref: elementRef,
    gesture,
    isActive,
    // Helper to get transform style for visual feedback
    getSwipeTransform: () => {
      if (!gesture || !isActive) return '';
      return `translateX(${Math.max(-100, Math.min(100, gesture.deltaX))}px)`;
    }
  };
};