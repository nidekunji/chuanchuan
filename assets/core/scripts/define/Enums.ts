import { Size } from "cc";
//import { Vector2 } from "../../../game/script/Vector2";

/**
 * 平台类型
 */
export enum EPlatformType {
    web = 'web',
    wechat = 'wechat',
    douyin = 'douyin',
    bytedance = 'bytedance',
    oppo = 'oppo',
    vivo = 'vivo',
    huawei = 'huawei',
    ios = 'ios',
    android = 'android',
    taptap = 'taptap'
}

/**
 * 广告类型
 */
export enum EAdType {
    BANNER = 'banner',
    REWARD_VIDEO = 'rewardVideo',
    INTERSTITIAL = 'interstitial',
    NATIVE = 'native'
}

/**
 * 分享类型
 */
export enum EShareType {
    NORMAL = 'normal',
    GROUP = 'group',
    FRIEND = 'friend'
}
/**
 * UI层级
 */
export enum EUILayer {
    BOTTOM = 'bottom',
    MIDDLE = 'middle',
    TOP = 'top',
    POPUP = 'popup',
    TOAST = 'toast'
}

/**
 * 音频类型
 */
export enum EAudioType {
    BGM = 'bgm',
    EFFECT = 'effect',
    UI = 'ui'
}

/**
 * 资源类型
 */
export enum EResourceType {
    PREFAB = 'prefab',
    TEXTURE = 'texture',
    AUDIO = 'audio',
    SPINE = 'spine',
    FONT = 'font'
}

/**
 * 游戏状态
 */
export enum EGameState {
    NONE = 'none',
    LOADING = 'loading',
    READY = 'ready',
    PLAYING = 'playing',
    PAUSE = 'pause',
    OVER = 'over'
}

/**
 * 网络状态
 */
export enum ENetworkState {
    NONE = 'none',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    DISCONNECT = 'disconnect',
    RECONNECTING = 'reconnecting'
}

/**
 * 玩家状态
 */
export enum EPlayerState {
    OFFLINE = 'offline',
    ONLINE = 'online',
    GAMING = 'gaming',
    WATCHING = 'watching'
}

/**
 * 道具类型
 */
export enum EItemType {
    NONE = 'none',
    COIN = 'coin',
    DIAMOND = 'diamond',
    ENERGY = 'energy',
    PROP = 'prop'
}

/**
 * 模块类型
 */
export const EModuleType = {
    none: 'none',
    platform: 'platform',
    language: 'language',
    timer: 'timer',
    resouces: 'resouces',
    ui: 'ui',
    audio: 'audio',
    scene: 'scene',
    login: 'login',
    main: 'main',
    privacy: 'privacy',
    gm: 'gm',
    guide: 'guide',
    prop: 'prop',
    rank: 'rank',
    logic: 'logic',
    gameType: 'gameType',
} as const;


export enum DragDirection {
    Horizontal,
    Vertical
}
// 为了保持类型安全，添加类型定义
export type EModuleType = typeof EModuleType[keyof typeof EModuleType];// 定义一个枚举来表示游戏的不同状态
export enum GameState {
    Idle = 'Idle',
    Processing = 'Processing',
    Shuffling = 'Shuffling',
    Animating = 'Animating',
    Pushing = 'Pushing',
    Swiping = 'Swiping',
    Exchanging = "Exchanging"
}
// 添加一个枚举类型用于客户状态
export enum CustomerState {
    None,                       // 初始
    Idle,                       // 空闲
    Eating,                     // 正在吃食物
    IsReturning,                // 带着串返回
    JoiningQueue,               // 加入队列
    MovingToWaitingArea,        // 移动到等待区
    IsQueueing,                 // 排队中
    WaitingEat,                 // 食物放入等待区等待被吃
    EatingWatingEat,            // 吃等待区的食物
}
