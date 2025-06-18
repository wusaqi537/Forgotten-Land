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
    const [noodleActive, setNoodleActive] = useState(false);      // 第二阶段：是否开始收集面
    const [noodleCollected, setNoodleCollected] = useState(0);    // 已收集面数
    const NOODLE_TARGET = 3;

    // 关闭书本时调用，开始任务
    const startQuest = () => {
        setActive(true);
        setMessage("已接取任务：幽魂");
        setTimeout(() => setMessage(null), 2000);
    };

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
        // 两秒后自动消失
        setTimeout(() => setMessage(null), 2000);
        // 开启第二阶段任务
        setNoodleActive(true);
    }, [rewardClaimed]);

    // 玩家收集到一碗面时调用
    const addNoodle = useCallback(() => {
        if (!noodleActive) return;
        setNoodleCollected((prev) => {
            const next = prev + 1;
            if (next >= NOODLE_TARGET) {
                setMessage("已收集三碗面，任务完成！");
                // 三秒后提示消失
                setTimeout(() => setMessage(null), 3000);
            }
            return next;
        });
    }, [noodleActive]);

    const value = { active, kills, done, startQuest, addKill, rewardClaimed, claimReward, hasJumpSkill, message, noodleActive, noodleCollected, addNoodle };
    return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
};


