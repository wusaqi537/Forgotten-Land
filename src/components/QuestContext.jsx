import { createContext, useContext, useState, useCallback } from 'react';

const QuestContext = createContext(null);

export const useQuest = () => useContext(QuestContext);

export const QuestProvider = ({ children }) => {
    const [active, setActive] = useState(false);   // 是否已接任务
    const [kills, setKills] = useState(0);         // 击杀数
    const [done, setDone] = useState(false);       // 是否完成
    const [rewardClaimed, setRewardClaimed] = useState(false);   // 是否已领取奖励
    const [hasJumpSkill, setHasJumpSkill] = useState(false);     // 是否解锁跳跃
    const [message, setMessage] = useState(null);                // 中央提示消息

    // 关闭书本时调用，开始任务
    const startQuest = () => setActive(true);

    // 玩家击杀幽魂时调用
    const addKill = useCallback(() => {
        setKills((prev) => {
            const next = prev + 1;
            if (next >= 10) setDone(true);
            return next;
        });
    }, []);

    const claimReward = useCallback(() => {
        if (rewardClaimed) return;
        setRewardClaimed(true);
        setHasJumpSkill(true);
        setMessage("获得跳跃技能！按 E 键跳跃");
        // 2 秒后自动消失
        setTimeout(() => setMessage(null), 2000);
    }, [rewardClaimed]);

    const value = { active, kills, done, startQuest, addKill, rewardClaimed, claimReward, hasJumpSkill, message };
    return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
};


