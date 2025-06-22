import { useMobileControls } from '../contexts/MobileControlsContext';
import { useQuest } from './QuestContext';
import './action-button.css';

export function ActionButton({ type }) {
  const { setJump, setAttack } = useMobileControls();
  const { jumpLevel } = useQuest();

  const handleStart = () => {
    if (type === 'jump' && jumpLevel > 0) {
      setJump(true);
    } else if (type === 'attack') {
      setAttack(true);
    }
  };

  const handleEnd = () => {
    if (type === 'jump') {
      setJump(false);
    } else if (type === 'attack') {
      setAttack(false);
    }
  };

  // 如果是跳跃按钮且未解锁跳跃能力，则不显示
  if (type === 'jump' && jumpLevel === 0) {
    return null;
  }

  return (
    <button
      className={`action-button ${type}-button`}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {type === 'jump' ? '跳跃' : '攻击'}
    </button>
  );
}