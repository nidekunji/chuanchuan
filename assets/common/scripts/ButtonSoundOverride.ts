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
        Button.prototype["touchBeganClone"] = Button.prototype["_onTouchEnded"];

        // 重写方法
        Button.prototype["_onTouchEnded"] = function(event) {
            if (this.interactable && this.enabledInHierarchy) {
                // 使用 AudioManager 播放按钮音效
                AudioManager.instance.playButtonClick();
            }
            // 调用原始的处理函数
            this["touchBeganClone"](event);
        };
    }
}