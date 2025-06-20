import { useRef, useState } from "react";

// 返回 { angle():number|null, pressed:boolean, bind:object }
export const useVirtualJoystick = () => {
  const [pressed, setPressed] = useState(false);
  const [angle, setAngle] = useState(null);
  const originRef = useRef({ x: 0, y: 0 });

  const updateAngle = (touch) => {
    const dx = touch.clientX - originRef.current.x;
    const dy = touch.clientY - originRef.current.y;
    if (Math.hypot(dx, dy) < 10) {
      setAngle(null);
      return;
    }
    setAngle(Math.atan2(dx, -dy)); // 转成以 y 轴向上为 0 的角度（与 CharacterController 逻辑一致）
  };

  const onStart = (e) => {
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    originRef.current = { x: touch.clientX, y: touch.clientY };
    setPressed(true);
    updateAngle(touch);
  };
  const onMove = (e) => {
    e.preventDefault();
    if (!pressed) return;
    const touch = e.touches ? e.touches[0] : e;
    updateAngle(touch);
  };
  const onEnd = (e) => {
    e.preventDefault();
    setPressed(false);
    setAngle(null);
  };

  return {
    angle: () => angle,
    isJoystickPressed: () => pressed,
    bind: {
      onTouchStart: onStart,
      onTouchMove: onMove,
      onTouchEnd: onEnd,
      onTouchCancel: onEnd,
      onPointerDown: onStart,
      onPointerMove: onMove,
      onPointerUp: onEnd,
      onPointerCancel: onEnd,
    },
  };
}; 