import { useQuest } from "./QuestContext";
import { VirtualJoystickUI } from "./VirtualJoystickUI";
import { ActionButton } from "./ActionButton";
import './action-button.css';

export const UI = ({ isMobile, joystick, setAttackPressed, setJumpPressed }) => {
  const { active, isPlayerNearNPC, setInteractAction } = useQuest();

  if (!isMobile) {
    return null;
  }

  return (
    <>
      <VirtualJoystickUI bind={joystick.bind} />
      <div className="action-btn-wrapper">
        {isPlayerNearNPC && (
          <ActionButton
            text="交谈"
            onClick={(pressed) => { if(pressed) setInteractAction(p => p + 1) }}
          />
        )}
        <ActionButton
          text="跳跃"
          onClick={(pressed) => setJumpPressed(pressed)}
        />
        {active && (
          <ActionButton
            text="⚡"
            onClick={(pressed) => setAttackPressed(pressed)}
            className="attack-btn-action"
          />
        )}
      </div>
    </>
  );
}; 