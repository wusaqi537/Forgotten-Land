import { useEffect, useRef, useState } from 'react';
import { useMobileControls } from '../contexts/MobileControlsContext';
import './virtual-joystick.css';

export function VirtualJoystick() {
  const { setJoystick } = useMobileControls();
  const containerRef = useRef(null);
  const stickRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const maxDistance = 50; // 最大移动距离

  const handleStart = (e) => {
    const point = e.touches ? e.touches[0] : e;
    const rect = containerRef.current.getBoundingClientRect();
    setStartPos({
      x: point.clientX - rect.left,
      y: point.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    
    const point = e.touches ? e.touches[0] : e;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = point.clientX - rect.left;
    const currentY = point.clientY - rect.top;
    
    const deltaX = currentX - startPos.x;
    const deltaY = currentY - startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaX, deltaY);
    
    const limitedDistance = Math.min(distance, maxDistance);
    const limitedX = Math.sin(angle) * limitedDistance;
    const limitedY = Math.cos(angle) * limitedDistance;
    
    if (stickRef.current) {
      stickRef.current.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
    }
    
    setJoystick({
      angle,
      moving: true
    });

    // 防止拖动时选中文本
    e.preventDefault();
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (stickRef.current) {
      stickRef.current.style.transform = 'translate(0px, 0px)';
    }
    setJoystick({
      angle: null,
      moving: false
    });
  };

  useEffect(() => {
    const stick = stickRef.current;
    if (!stick) return;

    // 触摸事件
    stick.addEventListener('touchstart', handleStart);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    // 鼠标事件
    stick.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      // 清理触摸事件
      stick.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);

      // 清理鼠标事件
      stick.removeEventListener('mousedown', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [isDragging]);

  return (
    <div className="joystick-container" ref={containerRef}>
      <div className="joystick-base">
        <div className="joystick-stick" ref={stickRef} />
      </div>
    </div>
  );
} 