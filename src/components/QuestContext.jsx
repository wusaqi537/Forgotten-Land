import { createContext, useContext, useState, useCallback } from 'react';

const QuestContext = createContext(null);

export const useQuest = () => useContext(QuestContext);

export const QuestProvider = ({ children }) => {
    const [active, setActive] = useState(false);   // 是否已接任务
    const [kills, setKills] = useState(0);         // 击杀数
    const [done, setDone] = useState(false);       // 是否完成
    const [rewardClaimed, setRewardClaimed] = useState(false);   // 是否已领取奖励
    const [jumpLevel, setJumpLevel] = useState(0);  // 0=无 2=双跳 4=四段跳
    const hasJumpSkill = jumpLevel>0;
    const [message, setMessage] = useState(null);                // 中央提示消息
    const [clues,setClues]=useState([]);                         // 线索列表
    const [noodleActive, setNoodleActive] = useState(false);      // 第二阶段：是否开始收集面
    const [noodleCollected, setNoodleCollected] = useState(0);    // 已收集面数
    const [noodleDone,setNoodleDone]=useState(false);
    const [noodleRewardClaimed,setNoodleRewardClaimed]=useState(false);
    const NOODLE_TARGET = 3;

    // 新增状态：是否在 NPC 附近，以及交互事件
    const [isPlayerNearNPC, setIsPlayerNearNPC] = useState(false);
    const [interactAction, setInteractAction] = useState(0);

    // 公用提示函数
    const showMessage = useCallback((msg, duration = 2000) => {
        setMessage(msg);
        if (duration > 0) {
            setTimeout(() => setMessage(null), duration);
        }
    }, []);

    const addClue=useCallback((clue)=>{
        setClues(prev=>prev.includes(clue)?prev:[...prev,clue]);
    },[]);

    // 关闭书本时调用，开始任务
    const startQuest = () => {
        setActive(true);
        showMessage("已接取任务：幽魂", 2000);
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
        setJumpLevel(2); // 双跳
        showMessage("解锁双段跳！按 E 跳跃", 2000);
        // 开启第二阶段任务
        setNoodleActive(true);
    }, [rewardClaimed]);

    // 玩家收集到一碗面时调用
    const addNoodle = useCallback(() => {
        if (!noodleActive) return;
        setNoodleCollected((prev) => {
            const next = prev + 1;
            if (next >= NOODLE_TARGET) {
                setNoodleDone(true);
                showMessage("已收集三碗面，任务完成！", 3000);
            }
            return next;
        });
    }, [noodleActive]);

    const claimNoodleReward = useCallback(() => {
        if (!noodleDone || noodleRewardClaimed) return;
        setNoodleRewardClaimed(true);
        setJumpLevel(4);
        showMessage("解锁四段跳！按 E 连跳",2000);
    }, [noodleDone,noodleRewardClaimed]);

    const value = { active, kills, done, startQuest, addKill, rewardClaimed, claimReward, hasJumpSkill, jumpLevel, message, noodleActive, noodleCollected, addNoodle, noodleDone, noodleRewardClaimed, claimNoodleReward, showMessage, clues, addClue, isPlayerNearNPC, setIsPlayerNearNPC, interactAction, setInteractAction };
    return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
};


