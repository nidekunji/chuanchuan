/*
 * @Author: Aina
 * @Date: 2024-12-10 00:38:27
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-12 00:56:10
 * @FilePath: /chuanchuan/assets/core/scripts/define/Types.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved. 
 */
import { Vec3 } from 'cc';
import { Rectangle } from '../../../game/script/Rancter';
import { Vector2 } from '../../../game/script/Vector2';
import { 
    EPlatformType, 
    EAdType, 
    EShareType, 
    EGameState 
} from './Enums';

/**
 * 平台配置接口
 */
export interface IPlatformConfig {
    platformType: EPlatformType;
    version: string;
    gameId: string;
    channelId: string;
    isTest: boolean;
}

/**
 * 广告配置接口
 */
export interface IAdConfig {
    adType: EAdType;
    adUnitId: string;
    position?: string;
    width?: number;
    height?: number;
}

/**
 * 游戏配置接口
 */
export interface IGameConfig {
    state: EGameState;
    level: number;
    score: number;
    highScore: number;
}
/**
 * 框架初始化配置
 */
export interface IInitData {
    /** 游戏名称 */
    gameName: string;

    /** 服务器配置 */
    server: {
        /** 服务器请求地址 */
        requestIp: string;
        /** 游戏ID */
        gameId: string;
    };

    /** 平台相关 */
    platformType: keyof typeof EPlatformType;
    /** 是否测试模式 */
    isTest: boolean;
    /** 是否开启日志 */
    isLog: boolean;
    /** 是否等待场景加载完毕后关闭loading */
    isWaitScene: boolean;
    /** 是否使用模块存储类型 */
    useModuleStorageType: boolean;
    /** web平台是否打开模拟UI */
    openWebSimulationUI: boolean;
    /** 是否强制使用web模拟弹窗 */
    useWebSimulationUI: boolean;

    /** UI相关 */
    /** 初始场景路径 */
    initSceneUrl: string;
    /** 点击音效路径 */
    audioClickUrl: string;
    /** 配置路径 */
    configUrl: string;
    /** 触摸移动特效预制体路径 */
    touchMovePrefabUrl: string;
    /** 触摸点击特效预制体路径 */
    touchClickPrefabUrl: string;
    /** 场景切换等待预制体路径 */
    sceneChangeWaitUrl: string;

    /** UI路径配置 */
    uiUrl: {
        index: string;
        indexBg: string;
        prop: string;
        sidebar: string;
    };

    /** 广告相关 */
    startBlockAd: number;
    rewardVideoUseShare: boolean;

    /** 分享配置 */
    share: {
        callTime: number;
        list: {
            title: string[];
            imgUrl: string[];
        };
        templateId: string[];
    };

    /** 其他配置 */
   // newUseEnterGame: boolean;
    loadingDuration: number;
    configDefine: Record<string, any>;

    /** 是否开启隐私协议 */
    openPrivacy: boolean;
    /** 是否显示加载文本 */
    showLoadingText: boolean;
    /** 版本ID */
    versionId: string;
    /** 是否开启GM */
    openGm: boolean;
    /** 加载完成颜色动画 */
    loadingCompleteColorAnim: string;
}
export interface IUserData {
    isNewUser: boolean;
    level: number;
    score: number;
    // 其他用户数据
}
export const ConfigFileName = {
    main: <any>"value",
    platform: <IConfigPlatform>null!,
    prop: <IConfigProp>null!,
    province_item: <IConfigProvinceItem>null!,
    level_item: <IConfigLevelItem>null!,
    today_item: <IConfigToDayItem>null!,
    coustom_item: <IConfigLevelItem>null!,
    card_item: <IConfigCardItem>null!,
}
interface IConfigBase {
    /**当前的ID */
    id: number;
    /**配置表名称 */
    configName: string;
}
/**一个物体的基本属性 */
interface IConfigItemBase extends IConfigBase {
/**图标路径 */
icon_url: string;
/**名字 */
id_name: number;
/**描述 */
id_describe: number;
}
interface IConfigCountBase {
    /**默认数量 */
    default_count: number;
    /**最大数量 -1 无限制 */
    max_count: number;
}
/**平台表配置 */
interface IConfigPlatform extends IConfigBase {
    banner: string;
    interstitial: string[];
    nativeTemp: string;
    rewardedVideo: string;
    nativeTempRoot: string;
    appid: string;
    /**每天第一次播放使用 */
    rewardedVideoOnce: string;
    bannerUpdate: string;
    blockOnce: string;
    blockOnceUpdate: string;
}
/**道具表配置 */
interface IConfigProp extends IConfigItemBase, IConfigCountBase {
    /**自动恢复间隔时间 */
    auto_resume: [
    /**自动恢复间隔时间 分 -1不开启 */
    number, 
    /**自动恢复间隔增加数量 */
    number, 
    /**自动恢复 离线恢复  0不启动*/
    number];
    /**获得道具时ui界面icon路径 */
    add_other_icon_url: string;
    /**1在背包展示 */
    is_package_show: number;
    /**是否播放飞行特效 */
    is_fly: number;
    /**第二天是否恢复上限 */
    is_refull: number;
    /**一天最多使用次数 */
    today_max: number;
    /**看完视频 添加道具个数 */
    video_add_count: number;
    /**看完视频 1直接使用 */
    is_video_add_use: 1 | 0;
    /**获取弹窗图片路径（title；tip；icon） */
    ui_img_url: string[];
}
 /**省份表 */
 interface IConfigProvinceItem extends IConfigItemBase {
    /**假数据最小 */
    fakemin: number;
    /**假数据最大 */
    fakemax: number;
}
/**城市表 */
interface IConfigCountryItem extends IConfigItemBase {
}
/**关卡表配置 */
export interface IConfigLevelBase extends IConfigBase {
    /**大小(x;y) */
    size: number[]
    /**1播放难度飙升动画 */
    anim: 0 | 1
    /**1播放新手引导手指提示 */
    tip: 0 | 1
    /**随机种子（默认使用关卡id随机， 大于0，当前数字随机，等于0关卡id随机，小于0纯随机） */
    seed_id: number,
}

/**关卡表 */
export interface IConfigLevelItem extends IConfigLevelBase {
    /**视频个数 */
    video_count: number
    /**指定颜色id顺序 */
    crad_id: number[]
    /**指定颜色id对应的个数 */
    crad_count: number[]
    /**1随机排列颜色id，反之顺序排列 */
    card_random: 1 | 0
}



/**牌表 */
export interface IConfigCardItem extends IConfigItemBase {
    /**0（单个可凑10合并）；大于0，相同可合并 */
    type: number
    /**数字 */
    num: number
}

/**今日表 */
export interface IConfigToDayItem extends IConfigLevelItem {
    /**单个时间（累加总时间（分）） */
    time: number
}

export interface ILogicNuoData {
    dataIndex: number
  //  entity: CubeNuoEntity,
    configId: number,
    index: Vector2,
    rect: Rectangle,
    isRemove: boolean,
}

export interface ILogicNuoMoveSameData {
    indexs: [number, number],
    dir: [number, number],
    removeCount: number,
    moveCount: number,
}
export enum EGameType {
    none,
    index,
    /**挪对对闯关 */
    nuoLevel,
    nuoToday,
}

export interface IGemData {
    type: number;
    isRemoved: boolean;
    gridPosition: Vector2;
    worldPosition: Vector2;
    scaleFactor?: number;
    scaleFactorWidth?: number;
    scaleFactorHeight?: number;
    gemWidth?: number;
    gemHeight?: number;
}
// 拖动节点的数据接口
export interface DragGemInfo {
    node: Node;
    pos: Vec3;
    gemData: IGemData;
}

export interface DragGemData {
    node: Node;
    pos: Vec3;
    gemData: IGemData;
}
// 拖动配置接口
export interface DragConfig {
    // 要拖动的宝石数组
    gems: DragGemInfo[];
    // 基础宝石宽度
    baseGemWidth: number;
    // 基础宝石高度
    baseGemHeight: number;
    // 宝石间距
    space: number;
    // 拖动方向
    direction: {
        dx: number;
        dy: number;
    };
    // 最大可用空位数量
    maxEmptySlots: number;
}

/**
 * 棋盘参数接口
 * @interface IBoardParams
 */
export interface IBoardParams {
    /** 棋盘总宽度 */
    boardWidth: number;
    
    /** 棋盘总高度 */
    boardHeight: number;
    
    /** 单个宝石的宽度 */
    gemWidth: number;
    
    /** 单个宝石的高度 */
    gemHeight: number;
    
    /** 宝石之间的间距 */
    spacing: number;
    
    /** 棋盘列数（水平方向的宝石数量）*/
    columns: number;
    
    /** 棋盘行数（垂直方向的宝石数量）*/
    rows: number;

    /** 宝石缩放因子 */
    scaleFactor: number;  
    /** 基础宝石宽度 */
    baseGemWidth: number; 
    /** 基础宝石高度 */
    baseGemHeight: number; 
    /** 初始匹配数 可直接消除的 */
    initialMatches: number;
    /** 宝石类型数量 */
    gemTypes: number;
    /** 缩放因子宽度 */
    scaleFactorWidth: number;
    /** 缩放因子高度 */
    scaleFactorHeight: number;
}
export interface UILoadConfig {
    name: string;     // b
    bundle: string;     // bundle名称
    path: string;       // 预制体路径
}