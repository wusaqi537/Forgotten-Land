import ReactDOM from "react-dom";
import './attack-button.css';

export const AttackButton = ({ onPress, visible=true }) => {
  const handleTouchStart = () => { onPress(true); };
  const handleTouchEnd = () => { onPress(false); };

  const ui = (
    <button
      className="attack-btn"
      style={{ display: visible ? 'block' : 'none' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      ⚡
    </button>
  );
  return ReactDOM.createPortal(ui, document.body);
}; 