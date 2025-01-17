
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
    RandomPropUrl: {
        name: "RandomPropUI",
        bundle: "game",
        path: "prefab/RandomPropUI"
    },
    TipPropsUrl: {
        name: "TipsPropUI",
        bundle: "game",
        path: "prefab/TipsPropUI"
    },
    
};
/**本地缓存字段名称 */
export const LocalCacheKeys = {
    BackgroundMusic: "backgroundMusic",
    SoundEffects: "soundEffects",
    ShakeEffect: "shakeEffect",
    GameSave: "gameSave",//游戏保存
    IsNewUser: "isNewUser",//是否是新手
    Level: "level",//等级
    // Add more keys as needed
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
    boardWidth: 728, // 棋盘总宽度
    boardHeight: 600, // 棋盘总高度
    gemWidth: 70, // 单个宝石的宽度
    gemHeight: 70, // 单个宝石的高度
    spacing: 5, // 宝石之间的间距
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
    boardWidth: 600, // 新手棋盘总宽度
    boardHeight: 600, // 新手棋盘总高度
    gemWidth: 70, // 新手单个宝石的宽度
    gemHeight: 70, // 新手单个宝石的高度
    spacing: 4, // 新手宝石之间的间距
    columns: 4, // 新手棋盘列数
    rows: 3, // 新手棋盘行数
    scaleFactor: 1.0, // 新手宝石缩放因子
    baseGemWidth: 70, // 新手基础宝石宽度
    baseGemHeight: 70, // 新手基础宝石高度
    initialMatches: 3, // 新手初始匹配数
    gemTypes: 4, // 新手宝石类型数量
    scaleFactorWidth: 1, // 缩放因子宽度
    scaleFactorHeight: 1, // 缩放因子高度
};

export const CustomerMoveConfig = {
    speed: 100, // 顾客移动速度
    waypoints: {
        1: [
            new Vec3(-285, 24, 1),
            new Vec3(-192, 89, 1),
            new Vec3(-81, 143, 1),
            new Vec3(-5, 212, 1),
            new Vec3(-5, 500, 1)
        ],
        2: [
            new Vec3(-178, 24, 1),
            new Vec3(-97, 75, 1),
            new Vec3(-7, 163, 1),
            new Vec3(-1, 211, 1),
            new Vec3(-8, 500, 1)
        ],
        3: [
            new Vec3(-67, 24, 1),
            new Vec3(-15, 81, 1),
            new Vec3(-4, 155, 1),
            new Vec3(-8, 500, 1)
        ],       
        4: [
            new Vec3(42, 24, 1),
            new Vec3(5, 81, 1),
            new Vec3(-1, 155, 1),
            new Vec3(-8, 460, 1)
        ],
        5: [
            new Vec3(153, 24, 1),
            new Vec3(73, 81, 1),
            new Vec3(5, 155, 1),
            new Vec3(-8, 500, 1)
        ],
        6: [
            new Vec3(267, 24, 1),
            new Vec3(180, 81, 1),
            new Vec3(40, 155, 1),
            new Vec3(2, 212, 1),
            new Vec3(-8, 500, 1)
        ]
    }
}
export const QueueMoveConfig = {
    speed: 100, // 顾客移动速度
    waypoints: {
        1: [
            new Vec3(-24, 159, 1),
            new Vec3(-136, 96, 1),
            new Vec3(-237, 39, 1),
            new Vec3(-287, 24, 1)
        ],
        2: [
            new Vec3(-24, 159, 1),
            new Vec3(28, 150, 1),
            new Vec3(-100, 80, 1),
            new Vec3(-178, 24, 1)
        ],
        3: [
            new Vec3(-24, 159, 1),
            new Vec3(-26, 115, 1),
            new Vec3(-60, 65, 1),
            new Vec3(-67, 24, 1)
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
            new Vec3(30, 198, 1),
        ],
        2: [
            new Vec3(1, 250, 1),
        ],
        3: [
            new Vec3(3, 285, 1),
        ],
    }
}