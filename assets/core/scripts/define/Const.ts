/*
 * @Author: Aina
 * @Date: 2024-12-10 00:38:12
 * @LastEditors: Aina
 * @LastEditTime: 2024-12-10 23:59:48
 * @FilePath: /chuanchuan/assets/core/scripts/define/Const.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved. 
 */
import { EPlatformType } from './Enums';

/**
 * 平台相关常量
 */
export const PLATFORM = {
    /** 支持的平台列表 */
    SUPPORT_PLATFORMS: [
        EPlatformType.web,
        EPlatformType.wechat,
        EPlatformType.bytedance,
        EPlatformType.oppo,
        EPlatformType.vivo,
        EPlatformType.huawei
    ],

    /** 广告配置 */
    AD: {
        REFRESH_TIME: 30000,
        INTERSTITIAL_INTERVAL: 30000,
        VIDEO_INTERVAL: 30000
    },

    /** 分享配置 */
    SHARE: {
        TITLE: '快来和我一起玩吧',
        IMAGE_URL: 'https://xxx.xxx.com/share.jpg'
    }
};

/**
 * 游戏相关常量
 */
export const GAME = {
    /** 默认配置 */
    DEFAULT: {
        VOLUME: 0.7,
        EFFECT_VOLUME: 1.0
    },

    /** 游戏配置 */
    CONFIG: {
        MAX_LEVEL: 100,
        MAX_SCORE: 999999,
        SAVE_INTERVAL: 30000
    }
};

/**
 * 事件名称常量
 */
export const EVENT = {
    /** 平台事件 */
    PLATFORM: {
        INIT_COMPLETE: 'platform_init_complete',
        LOGIN_SUCCESS: 'platform_login_success',
        LOGIN_FAIL: 'platform_login_fail',
        SHARE_SUCCESS: 'platform_share_success',
        SHARE_FAIL: 'platform_share_fail'
    },

    /** UI事件 */
    UI: {
        SHOW_LOADING: 'ui_show_loading',
        HIDE_LOADING: 'ui_hide_loading',
        SHOW_TOAST: 'ui_show_toast',
        SHOW_DIALOG: 'ui_show_dialog'
    },

    /** 游戏事件 */
    GAME: {
        STATE_CHANGE: 'game_state_change',
        SCORE_CHANGE: 'game_score_change',
        LEVEL_CHANGE: 'game_level_change',
        GAME_OVER: 'game_over',
        GAME_WIN: 'game_win'
    }
};

export const STORAGE_KEYS = {
    USER_DATA: 'user_data',
    // 可以继续添加其他storage keys...
} as const;

// ... 其他常量定义