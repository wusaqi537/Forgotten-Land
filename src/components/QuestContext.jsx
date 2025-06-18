import { createContext, useContext, useState, useCallback } from 'react';

const QuestContext = createContext(null);

export const useQuest = () => useContext(QuestContext);

export const QuestProvider = ({ children }) => {
    const [active, setActive] = useState(false);   // 是否已接任务
    const [kills, setKills] = useState(0);         // 击杀数
    const [done, setDone] = useState(false);       // 是否完成

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

    const value = { active, kills, done, startQuest, addKill };
    return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
};


