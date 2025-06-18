import { createPortal } from "react-dom";
import { useQuest } from "./QuestContext";

export const CenterTip = () => {
  const { message } = useQuest();
  if (!message) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(0,0,0,0.6)",
        padding: "10px 20px",
        borderRadius: 6,
        fontSize: 24,
        color: "#fff",
        fontFamily: "sans-serif",
        pointerEvents: "none",
        zIndex: 10000,
      }}
    >
      {message}
    </div>,
    document.body
  );
}; 