import { _decorator, Component, Node, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;
/**
 * 缓动类型
 */
export enum EaseType {
    Linear = 'linear',
    QuadIn = 'quadIn',
    QuadOut = 'quadOut'
}

/**
 * 节点透明度动画类
 */
@ccclass('OpacityAnimation')
export class OpacityAnimation extends Component {
    // 动画配置
    public showSpeed: number = 1;           // 渐显速度
    public hideSpeed: number = 1;           // 渐隐速度
    public showEase: EaseType = EaseType.QuadOut;  // 渐显缓动类型
    public hideEase: EaseType = EaseType.QuadIn;   // 渐隐缓动类型

    // 内部状态
    private _curOpacity: number = 1;        // 当前透明度
    private _isFadeIn: boolean = true;      // 是否为渐显
    private _onComplete: (() => void) | null = null;  // 完成回调
    private _isPlaying: boolean = false;    // 是否正在播放
    private _originOpacity: number = 255;   // 原始透明度值
    private _node: Node;                    // 目标节点
    private _uiOpacity: UIOpacity | null = null;  // UIOpacity组件

    onLoad() {
        this._initOpacity();
    }

    /**
     * 初始化节点透明度组件
     */
    private _initOpacity(): void {
        this._uiOpacity = this._node.getComponent(UIOpacity);
        if (!this._uiOpacity) {
            this._uiOpacity = this._node.addComponent(UIOpacity);
        }
        this._originOpacity = this._uiOpacity.opacity;
    }

    /**
     * 更新动画
     * @param deltaTime - 帧间隔时间(秒)
     */
    public update(deltaTime: number): void {
        if (!this._isPlaying || !this._uiOpacity) return;

        // 更新当前透明度
        this._curOpacity += deltaTime * 2 * (this._isFadeIn ? this.showSpeed : this.hideSpeed);
        
        if (this._curOpacity >= 1) {
            this._curOpacity = 1;
            this._isPlaying = false;
            if (this._onComplete) {
                this._onComplete();
                this._onComplete = null;
            }
        }

        // 计算实际透明度
        const ratio = this._ease(this._isFadeIn ? this.showEase : this.hideEase, this._curOpacity);
        const opacity = this._isFadeIn ? ratio : (1 - ratio);
        
        // 设置节点透明度
        this._uiOpacity.opacity = this._originOpacity * opacity;
    }

    /**
     * 播放动画
     * @param fadeIn - true为渐显,false为渐隐
     * @param onComplete - 动画完成回调
     * @param useAnim - 是否使用动画过渡,false则直接设置
     */
    public play(fadeIn: boolean, onComplete?: () => void, useAnim: boolean = true): void {
        if (!this._uiOpacity || this._originOpacity === 0) return;

        this._isFadeIn = fadeIn;
        this._onComplete = onComplete || null;

        if (useAnim) {
            this._curOpacity = 0;
            this._isPlaying = true;
            this._uiOpacity.opacity = this._isFadeIn ? 0 : this._originOpacity;
        } else {
            this._curOpacity = 1;
            this._isPlaying = false;
            this._uiOpacity.opacity = this._isFadeIn ? this._originOpacity : 0;
            if (onComplete) onComplete();
        }
    }

    /**
     * 停止动画
     */
    public stop(): void {
        this._isPlaying = false;
        this._onComplete = null;
    }

    /**
     * 是否播放完成
     */
    public isComplete(): boolean {
        return !this._isPlaying;
    }

    /**
     * 获取当前是否为渐显状态
     */
    public isFadeIn(): boolean {
        return this._isFadeIn;
    }

    /**
     * 缓动函数
     * @private
     */
    private _ease(type: EaseType, t: number): number {
        switch(type) {
            case EaseType.QuadIn:
                return t * t;
            case EaseType.QuadOut:
                return -t * (t - 2);
            case EaseType.Linear:
            default:
                return t;
        }
    }
}