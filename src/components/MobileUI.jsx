import { useEffect, useState } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { ActionButton } from './ActionButton';
import { useQuest } from './QuestContext';

export default function MobileUI() {
  const [isMobile, setIsMobile] = useState(false);
  const { active } = useQuest();

  useEffect(() => {
    const checkMobile = () => {
      // 使用更可靠的移动设备检测方法
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <>
      <VirtualJoystick />
      {active && (
        <>
          <ActionButton type="jump" />
          <ActionButton type="attack" />
        </>
      )}
    </>
  );
}