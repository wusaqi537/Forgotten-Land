import ReactDOM from "react-dom";
import './virtual-joystick.css';

export const VirtualJoystickUI = ({ visible = true, bind }) => {
  if (!visible) {
    return null;
  }
  const ui = (
    <div className="vj-wrapper" {...bind}>
      <div className="vj-base" />
    </div>
  );
  return ReactDOM.createPortal(ui, document.body);
}; 