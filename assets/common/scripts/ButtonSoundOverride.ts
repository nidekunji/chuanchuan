/*
 * @Author: Aina
 * @Date: 2025-01-25 09:31:53
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-14 17:40:18
 * @FilePath: /chuanchuan/assets/common/scripts/ButtonSoundOverride.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Button } from 'cc';
import { AudioManager } from './AudioManager';
const { ccclass } = _decorator;

@ccclass('ButtonSoundOverride')
export class ButtonSoundOverride {
    private static _instance: ButtonSoundOverride = null;
    private static _initialized: boolean = false;

    // 获取单例实例
    public static get instance(): ButtonSoundOverride {
        if (!this._instance) {
            this._instance = new ButtonSoundOverride();
            this.initialize();
        }
        return this._instance;
    }

    // 初始化方法
    private static initialize() {
        if (this._initialized) return;
        this._initialized = true;

        // 保存原始方法的引用
        Button.prototype["touchBeganClone"] = Button.prototype["_onTouchBegan"];

        // 重写方法
        Button.prototype["_onTouchBegan"] = function(event) {
            console.log("ButtonSoundOverride!!!!!");
            if (this.interactable && this.enabledInHierarchy) {
                // 使用 AudioManager 播放按钮音效
                console.log("ButtonSoundOverride!!!!!");
                AudioManager.instance.playButtonClick();
            }
            // 调用原始的处理函数
            this["touchBeganClone"](event);
        };
    }
}