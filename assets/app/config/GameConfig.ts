
import { sys, Vec3 } from "cc";
import { HTML5, OPPO, VIVO } from "cc/env";
import { ConfigFileName, IBoardParams, IInitData, IUserData, UILoadConfig } from "../../core/scripts/define/Types";
import { EPlatformType } from "../../core/scripts/define/Enums";

type TPlatformType = keyof typeof EPlatformType

/**平台 */
let platformType: TPlatformType = "web"

// 自动判断平台
if (platformType == "web") {
    if (!HTML5) {
        if (window["wx"])
            platformType = "wechat"
        if (window["qq"])
            platformType = "wechat" 
        if (window["tt"])
            platformType = "bytedance"
    }   
    if (OPPO)
        platformType = "oppo"
    if (VIVO)
        platformType = "vivo"

    if (sys.isNative)
        platformType = "taptap"
}

/**内部自定义常量逻辑 */
export const CGameData = {
    SettingUrl: "setting/prefab/SettingUI",
    PropGetUrl: "scene/prefab/ui/PropGetUI",
    FailUrl: "scene/prefab/ui/FailUI",
    LevelSelectUrl: "scene/prefab/ui/LevelSelectUI",
    SuccessUrl: "scene/prefab/ui/SuccessUI",
    RunUIUrl: "scene/prefab/ui/RunUI",
    ResetCardAnimUI: "scene/prefab/ui/ResetCardAnimUI"
}
export const uiLoadingConfigs: { [key: string]: UILoadConfig } = {
    StoreUIUrl: {
        name: "StoreUI",
        bundle: "main2",
        path: "prefab/StoreUI"
    },
    SettingUrl: {
        name: "SettingUI",
        bundle: "setting",
        path: "prefab/SettingUI"
    },
    FailUrl: {
        name: "FailUI",
        bundle: "game",
        path: "prefab/FailUI"
    },
    RunUIUrl: {
        name: "RunUI",
        bundle: "game",
        path: "prefab/RunUI"
    },
    RankUIUrl: {
        name: "RankUI",
        bundle: "main2",
        path: "prefab/RankUI"
    },
    ExchangePropUrl: {
        name: "ExchangePropUI",
        bundle: "game",
        path: "prefab/ExchangePropUI"
    },
    ShuttlePropUrl: {
        name: "ShuttlePropUI",
        bundle: "game",
        path: "prefab/ShuttlePropUI"
    },
    TipPropsUrl: {
        name: "TipsPropUI",
        bundle: "game",
        path: "prefab/TipsPropUI"
    },
    TipUIUrl: {
        name: "TipUI",
        bundle: "game",
        path: "prefab/TipUI"
    },
    CommonVedioUIUrl: {
        name: "CommonVedioUI",
        bundle: "game",
        path: "prefab/CommonVedioUI"
    },
    LayerUIUrl: {
        name: "LayerUI",
        bundle: "game",
        path: "prefab/LayerUI"
    },
    IconListUIUrl: {
        name: "IconListUI",
        bundle: "main2",
        path: "prefab/IconListUI"
    },
    UnLockCustomerUIUrl: {
        name: "UnLockCustomerUI",
        bundle: "game",
        path: "prefab/UnLockCustomerUI"
    }
};
/**本地缓存字段名称 */
export const LocalCacheKeys = {
    BackgroundMusic: "backgroundMusic",
    SoundEffects: "soundEffects",
    ShakeEffect: "shakeEffect",
    GameSave: "gameSave",//游戏保存
    IsNewUser: "isNewUser",//是否是新手
    Level: "level",//等级
    FoodStorage: "foodStorage",//食物存放区
    WaitingArea: "waitingArea",//等待区
    PropData: "propData",//道具数据
    UnlockCustomerNum: "unlockCustomerNum",//已解锁顾客的个数
    // Add more keys as needed
}
export const levelConfig: { [key: number]: number[][] } = {
    1: [
        [1, 2, 3, 1],
        [3, 1, 2, 3],
        [2, 3, 1, 2]
    ]
    // 1: [
    //     [4, 1, 1, 1],
    //     [2, 4, 2, 2],
    //     [4, 3, 3, 3]
    // ]
}
export const NewUserGameConfig = {
    row: 9,//行
    col: 10,//列
    gemType: 6,//宝石类型
}
export const NormalGameConfig = {
    row: 9,//行
    col: 10,//列
    gemType: 10,//宝石类型
}



let gameName: string = "串了个串"
// gameName = "麻将挪对对"
// if (platformType == "vivo")
//     gameName = "麻将凑十"

export const userData: IUserData = {
    isNewUser: true,
    level: 1,
    score: 0,
}


export const initData: IInitData = {
    gameName,
    rewardVideoUseShare: false,
    isTest: true,
    isLog: true,
    platformType,
    isWaitScene: false,
    server: {
        gameId: "",
        requestIp: "",
    },
    useModuleStorageType: false,
    openWebSimulationUI: true,
    useWebSimulationUI: false,
    openPrivacy: (<TPlatformType[]>[
        // "web",
        "qq",
        "vivo",
        "oppo",
        "taptap",
    ]).indexOf(platformType) !== -1,
    showLoadingText: (<TPlatformType[]>[
        "web",
        "wechat",
        "douyin",
        "oppo",
        "vivo",
        "taptap",
    ]).indexOf(platformType) !== -1,
    versionId: gameName == "串了个串" ? "" : "2023SA0027142",
    openGm: false,
    loadingCompleteColorAnim: "#EEF2FE",
    initSceneUrl: "scene/scene/Scene",
    audioClickUrl: "main/audio/click_sound",
    configUrl: "config/configs",
    touchMovePrefabUrl: "main/particle/7/prefab",
    touchClickPrefabUrl: "main/particle/1/prefab",
    sceneChangeWaitUrl: "",
    uiUrl: {
        index: "main/prefab/index/Index/UI",
        indexBg: "main/prefab/index/IndexBgUI",
        prop: "main/prefab/prop/PropUI",
        sidebar: "ttSidebar/prefab/TTSidebarUI",
    },
    startBlockAd: 0,
    share: {
        callTime: 0,
        list: {
            title: [
                "一口气玩了20关，根本停不下来。",
                "@你，这是一款超难消除游戏",
                "超还上头的消除游戏，来冲吧",
                "不通关谁都别睡觉！",
            ],
            imgUrl: [],
        },
        templateId: [],
    },
    loadingDuration: 0,
    configDefine: ConfigFileName,
}

export const BoardInitialConfig: IBoardParams = {
    boardWidth: 709, // 棋盘总宽度
    boardHeight: 638, // 棋盘总高度
    gemWidth: 70, // 单个宝石的宽度
    gemHeight: 70, // 单个宝石的高度
    spacing: 1, // 宝石之间的间距
    columns: 10, // 棋盘列数
    rows: 9, // 棋盘行数
    scaleFactor: 1, // 宝石缩放因子
    baseGemWidth: 70, // 基础宝石宽度
    baseGemHeight: 70, // 基础宝石高度
    initialMatches: 5, // 初始匹配数
    gemTypes: 6, // 宝石类型数量
    scaleFactorWidth: 1, // 缩放因子宽度
    scaleFactorHeight: 1, // 缩放因子高度
};

export const NewUserBoardConfig: IBoardParams = {
    boardWidth: 284, // 新手棋盘总宽度 (4 * (70 + 1))
    boardHeight: 213, // 新手棋盘总高度 (3 * (70 + 1))
    gemWidth: 70, // 新手单个宝石的宽度
    gemHeight: 70, // 新手单个宝石的高度
    spacing: 1, // 新手宝石之间的间距
    columns: 4, // 新手棋盘列数
    rows: 3, // 新手棋盘行数
    scaleFactor: 1.0, // 新手宝石缩放因子
    baseGemWidth: 70, // 新手基础宝石宽度
    baseGemHeight: 70, // 新手基础宝石高度
    initialMatches: 2, // 新手初始匹配数
    gemTypes: 4, // 新手宝石类型数量
    scaleFactorWidth: 1, // 缩放因子宽度
    scaleFactorHeight: 1, // 缩放因子高度
};
// 移动回去
export const CustomerMoveConfig = {
    speed: 100, // 顾客移动速度
    waypoints: {
        1: [
            new Vec3(-92, 57, 1),
            new Vec3(-48, 95, 1),
            new Vec3(-41, 135, 1),
            new Vec3(-25, 212, 1),  // shifted left
            new Vec3(-25, 700, 1)   // shifted left
        ],
        2: [
            new Vec3(-6, 57, 1),
            new Vec3(-48, 95, 1),
            new Vec3(-41, 135, 1),
            new Vec3(-25, 211, 1),  
            new Vec3(-25, 700, 1)  
        ],
        3: [
            new Vec3(57, 33, 1),
            new Vec3(-48, 95, 1),
            new Vec3(-41, 135, 1),
            new Vec3(-25, 700, 1)   // shifted left
        ],       
        4: [
            new Vec3(42, 24, 1),
            new Vec3(5, 81, 1),
            new Vec3(-11, 155, 1),  // shifted left
            new Vec3(-25, 700, 1)   // shifted left
        ],
        5: [
            new Vec3(153, 24, 1),
            new Vec3(73, 81, 1),
            new Vec3(-30, 155, 1),   // shifted left
            new Vec3(-25, 700, 1)   // shifted left
        ],
        6: [
            new Vec3(267, 24, 1),
            new Vec3(180, 81, 1),
            new Vec3(20, 155, 1),
            new Vec3(-25, 212, 1),   // shifted left
            new Vec3(-25, 700, 1)   // shifted left
        ]
    }
}


export const QueueMoveConfig = {
    speed: 100, // 顾客移动速度
    waypoints: {
        1: [
            new Vec3(-15, 86, 1),
            new Vec3(-83, 36, 1),
            new Vec3(-114, 3, 1),
        ],
        2: [
            new Vec3(5, 61, 1),
            new Vec3(-6, 15, 0)
        ],
        3: [
            new Vec3(85, 78, 1),
            new Vec3(103, 2, 0),
        ],
        4: [
            new Vec3(-24, 159, 1),
            new Vec3(42, 24, 1)
        ],
        5: [
            new Vec3(-24, 159, 1),
            new Vec3(71, 134, 1),
            new Vec3(117, 68, 1),
            new Vec3(155, 24, 1)
        ],
        6: [
            new Vec3(-24, 159, 1),
            new Vec3(71, 134, 1),
            new Vec3(117, 68, 1),
            new Vec3(155, 24, 1),
            new Vec3(262, 24, 1)
        ]
    }
}
// 移动往前
export const EnterQueueMoveConfig = {
    speed: 100, // 顾客移动速度
    waypoints: {
        1: [
            new Vec3(43, 137, 1),//第一个
        ],
        2: [
            new Vec3(28, 219, 1),// 第二个
        ],
        3: [
            new Vec3(61, 310, 1),// 第三个
        ],
    }
}

export const CommonVedioUIConfig = {
    unlockSlot: {
        title: "解锁食物槽",
        subtitle: "解锁桌子以便接待更多的顾客",
    },
    "exchangeProp": {
        title: "交换道具",
        subtitle: "看广告，免费获得10000金币",
    },
    "resetCard": {
        title: "看广告，免费获得10000金币",
        subtitle: "看广告，免费获得10000金币",
    }
}
export const lockLevel = 5;
export function checkIsUnlockCustomer(originalLevel: number, currentLevel: number): boolean {
    if (currentLevel < lockLevel) return false
    return currentLevel - originalLevel >= lockLevel
}

export const iconList = {
   1: {
        name: '老鼠',
   },
   2: {
        name: '小白兔',
   },
   3: {
        name: '卡皮吧啦',
   },
   4: {
        name: '小狗',
   },
   5: {
        name: '浣熊',
   },
   6: {
        name: '小蛇',
   },
   7:{
        name: '狐狸',
   }
}