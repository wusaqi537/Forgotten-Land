import { createPortal } from "react-dom";
import { useQuest } from "./QuestContext";

export const Taskbar = () => {
  const { active, kills, done } = useQuest();

  if (!active) return null;   // 还没接任务不显示

  return createPortal(
    <div style={{
      position: "fixed",
      top: 16,
      left: 16,
      background: "rgba(0,0,0,0.4)",
      padding: "4px 10px",
      borderRadius: 4,
      fontSize: 18,
      color: "#fff",
      fontFamily: "sans-serif",
      pointerEvents: "none",
      zIndex: 9999,
    }}>
      {done ? "任务完成！击杀幽魂 10/10" : `击杀幽魂：${kills} / 10`}
    </div>,
    document.body
  );
};
