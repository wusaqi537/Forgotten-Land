import { createPortal } from "react-dom";
import { useQuest } from "./QuestContext";

export const Taskbar = () => {
  const { active, kills, done, rewardClaimed, claimReward } = useQuest();

  if (!active) return null;   // 还没接任务不显示

  let content;
  let pointer = "none";
  if (!done) {
    content = `击杀幽魂：${kills} / 10`;
  } else if (done && !rewardClaimed) {
    content = "点击领取奖励：跳跃技能";
    pointer = "auto";
  } else {
    content = "奖励已领取：跳跃技能";
  }

  return createPortal(
    <div
      onClick={() => {
        if (done && !rewardClaimed) claimReward();
      }}
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        background: "rgba(0,0,0,0.4)",
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 18,
        color: "#fff",
        fontFamily: "sans-serif",
        pointerEvents: pointer,
        cursor: done && !rewardClaimed ? "pointer" : "default",
        zIndex: 9999,
      }}
    >
      {content}
    </div>,
    document.body
  );
};
