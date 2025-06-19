import { createPortal } from "react-dom";
import { useQuest } from "./QuestContext";

export const Taskbar = () => {
  const { active, kills, done, rewardClaimed, claimReward, noodleActive, noodleCollected, noodleDone, noodleRewardClaimed, claimNoodleReward } = useQuest();

  if (!active && !noodleActive) return null;   // 未接任务亦未到第二阶段

  let content;
  let pointer = "none";

  if (!noodleActive) {
    // 第一阶段：击杀幽魂
    if (!done) {
      content = `击杀幽魂：${kills} / 10`;
    } else if (!rewardClaimed) {
      content = "点击领取奖励：跳跃技能";
      pointer = "auto";
    } else {
      content = "奖励已领取：双段跳技能";
    }
  } else {
    // 第二阶段：收集面
    if (noodleCollected < 3) {
      content = `收集面：${noodleCollected} / 3`;
    } else if(!noodleRewardClaimed){
      content = "点击领取奖励：四段跳技能";
      pointer="auto";
    } else {
      content = "奖励已领取：四段跳技能";
    }
  }

  return createPortal(
    <div
      onClick={() => {
        if (done && !rewardClaimed) claimReward();
        if (noodleDone && !noodleRewardClaimed) claimNoodleReward();
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
