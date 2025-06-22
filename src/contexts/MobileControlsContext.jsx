import { createContext, useContext, useState } from 'react';

const MobileControlsContext = createContext();

export const useMobileControls = () => useContext(MobileControlsContext);

export const MobileControlsProvider = ({ children }) => {
  const [joystick, setJoystick] = useState({ angle: null, moving: false });
  const [jump, setJump] = useState(false);
  const [attack, setAttack] = useState(false);

  const value = {
    joystick,
    setJoystick,
    jump,
    setJump,
    attack,
    setAttack,
  };

  return (
    <MobileControlsContext.Provider value={value}>
      {children}
    </MobileControlsContext.Provider>
  );
};