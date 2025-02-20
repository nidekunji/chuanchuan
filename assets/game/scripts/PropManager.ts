/*
 * @Author: Aina
 * @Date: 2025-01-16 02:50:55
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-21 03:01:41
 * @FilePath: /chuanchuan/assets/game/scripts/PropManager.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Color, Component, Label, Sprite, tween, UITransform, Vec3 } from 'cc';
import { GameBoard } from '../script/Test';
import { ResourceManager } from '../../common/scripts/ResourceManager';
import { LocalCacheKeys } from '../../app/config/GameConfig';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
const { ccclass, property } = _decorator;

@ccclass('PropManager')
export class PropManager extends Component {
    private hintCount: number = 0;
    private shuffleCount: number = 0;
    private exchangeCount: number = 0;
    private _gameBoard: GameBoard = null;
    
    @property(Label)
    private hintCountLabel: Label = null;
    @property(Label)
    private shuffleCountLabel: Label = null;
    @property(Label)
    private exchangeCountLabel: Label = null;

    @property(Sprite)
    private hintButton: Sprite = null;
    @property(Sprite)
    private shuffleButton: Sprite = null;
    @property(Sprite)
    private exchangeButton: Sprite = null;

    private hintUsed: number = 0;
    private shuffleUsed: number = 0;
    private exchangeUsed: number = 0;

    private readonly MAX_HINT_USAGE = 0;
    private readonly MAX_SHUFFLE_USAGE = 0;
    private readonly MAX_EXCHANGE_USAGE = 0;

    @property(Sprite)
    private propAnimIcon: Sprite = null;  // 道具动画图标

    public init(gameBoard: GameBoard) {
        this.propAnimIcon.node.active = false;
        this._gameBoard = gameBoard;
        this.loadFromStorage();
        this.updateView();
    }
    private loadFromStorage() {
        const storageStr = LocalStorageManager.getItem(LocalCacheKeys.PropData);
        if (storageStr) {
            const data = JSON.parse(storageStr);
            this.hintCount = data.hintCount || 0;
            this.shuffleCount = data.shuffleCount || 0;
            this.exchangeCount = data.exchangeCount || 0;
            this.hintUsed = data.hintUsed || this.MAX_HINT_USAGE;
            this.shuffleUsed = data.shuffleUsed || this.MAX_SHUFFLE_USAGE;
            this.exchangeUsed = data.exchangeUsed || this.MAX_EXCHANGE_USAGE;
        } else {
            this.resetProps();
        }
    }
    private saveToStorage() {
        const data = {
            hintCount: this.hintCount,
            shuffleCount: this.shuffleCount,
            exchangeCount: this.exchangeCount,
            hintUsed: this.hintUsed,
            shuffleUsed: this.shuffleUsed,
            exchangeUsed: this.exchangeUsed
        };
        localStorage.setItem(LocalCacheKeys.PropData, JSON.stringify(data));
    }

       // 修改现有的添加道具方法
    public async addHintProps() {
        await this.playPropAnimation("提示", this.hintButton);
        this.hintCount += 3;
        this.saveToStorage();
        this.updateView();
    }

    public async addShuffleProps() {
        await this.playPropAnimation("打乱", this.shuffleButton);
        this.shuffleCount += 3;
        this.saveToStorage();
        this.updateView();
    }

    public async addExchangeProps() {
        await this.playPropAnimation("换位置", this.exchangeButton);
        this.exchangeCount += 3;
        this.saveToStorage();
        this.updateView();
    }

    public useHint() {
        if (this.hintCount > 0 && !this.hintUsed) {
            this.hintCount--;
            if (this.hintCount == 0) {
                this.hintUsed += 1;  
            }
            this.saveToStorage();
            this.updateView();
            return true;
        }
        return false;
    }

    public useShuffle() {
        if (this.shuffleCount > 0 && !this.shuffleUsed) {
            this.shuffleCount--;
            if (this.shuffleCount == 0) {
                this.shuffleUsed += 1;
            }
            this.saveToStorage();
            this.updateView();
            return true;
        }
        return false;
    }

    public useExchange() {
        if (this.exchangeCount > 0 && this.exchangeUsed < 2) {
            this.exchangeCount--;
            if (this.exchangeCount == 0) {
                this.exchangeUsed += 1;
            }
            this.saveToStorage();
            this.updateView();
            return true;
        }
        return false;
    }

    public resetProps() {
        this.propAnimIcon.node.active = false;
        this.hintCount = 0;
        this.shuffleCount = 0;
        this.exchangeCount = 0;
        // 重置使用状态
        this.hintUsed = this.MAX_HINT_USAGE;
        this.shuffleUsed = this.MAX_SHUFFLE_USAGE;
        this.exchangeUsed = this.MAX_EXCHANGE_USAGE;
        LocalStorageManager.removeItem(LocalCacheKeys.PropData);
        this.updateView();
    }
    private updatePropButtonSprite(button: Sprite, type: string, callback?: () => void) {
        const bundleName = 'game';
        const path = `res/game/${type}/spriteFrame`;
        ResourceManager.loadSpriteFrameFromBundle(bundleName, path, (err, spriteFrame) => {
            if (err) {
                console.error('Error loading texture:', err);
            } else {
                button.spriteFrame = spriteFrame;
                callback && callback();
            }
        });
    }
    updateView() {
        // 提示道具更新
        let tipName = "提示图标"
        this.hintCountLabel.node.active = false;
        if (this.hintUsed) {
            tipName = "提示图标_灰色"
        } else {
            if (this.hintCount > 0) {
                this.hintCountLabel.node.active = true;
                this.hintCountLabel.string = this.hintCount.toString();
            }
        }
        this.updatePropButtonSprite(this.hintButton, tipName);

        // 洗牌道具更新
        let shuffleName = "打乱图标"
        this.shuffleCountLabel.node.active = false;
        if (this.shuffleUsed) {
            shuffleName = "打乱图标_灰色"
        } else {
            if (this.shuffleCount > 0) {
                this.shuffleCountLabel.node.active = true;
                this.shuffleCountLabel.string = this.shuffleCount.toString();
            }
        }
        this.updatePropButtonSprite(this.shuffleButton, shuffleName);

        // 交换道具更新
        let exchangeName = "换位置图标"
        this.exchangeCountLabel.node.active = false;
        if (this.exchangeUsed >=2) {
            exchangeName = "换位置图标_灰色"
        } else {
            if (this.exchangeCount > 0) {
                this.exchangeCountLabel.node.active = true;
                this.exchangeCountLabel.string = this.exchangeCount.toString();
            }
        }
        this.updatePropButtonSprite(this.exchangeButton, exchangeName);
    }

    public getHintCount() {
        return this.hintCount;
    }
    
    public getHintUsed() {
        if (this.hintUsed >= 1) {
            return true;
        }
        return false;
    }

    public getShuffleCount() {
        return this.shuffleCount;
    }
    public getShuffleUsed() {
        if (this.shuffleUsed >= 1) {
            return true;
        }
        return false;
    }

    public getExchangeCount() {
        return this.exchangeCount;
    }
    public getExchangeUsed() {
        if (this.exchangeUsed >= 2) {
            return true;
        }
        return false;
    }
    public hasAvailableProps(): boolean {
        if (!this.getHintUsed() || !this.getShuffleUsed() || !this.getExchangeUsed()) {
            return true;
        }
        if ((this.hintCount > 0) || (this.shuffleCount > 0) || (this.exchangeCount > 0)) {
            return true;
        }
        return false;
    }
    private propType = {
        hint: "提示",
        shuffle: "打乱",
        exchange: "换位置"
    }
    private updatePropAnimIconSprite(propType: string) {
        const bundleName = 'game';
        const path = `res/game/${propType}/spriteFrame`;
        ResourceManager.loadSpriteFrameFromBundle(bundleName, path, (err, spriteFrame) => {
            if (err) {
                console.error('Error loading texture:', err);
            } else {
                this.propAnimIcon.spriteFrame = spriteFrame;
                this.propAnimIcon.node.active = true;
                this.propAnimIcon.node.setPosition(0, -140);
                this.propAnimIcon.node.scale = new Vec3(0.2, 0.2, 1);
            }
        });
    }
    /**
     * 播放道具动画
     * @param propType 道具类型 1 提示 2 打乱 3 换位置
     * @param targetButton 目标按钮
     * @returns 
     */
    private async playPropAnimation(propType: string, targetButton: Sprite) {
        // 确保动画图标存在
        if (!this.propAnimIcon) return;
        // 加载对应道具的图标
        await this.updatePropAnimIconSprite(propType);

        // 晃动动画
        const shakeAction = new Promise<void>((resolve) => {
            const duration = 0.8;
            const angle = 30;
            tween(this.propAnimIcon.node)
                .by(duration / 4, { angle: angle })
                .by(duration / 2, { angle: -2 * angle })
                .by(duration / 4, { angle: angle })
                .call(() => resolve())
                .start();
        });

        await shakeAction;
        
        
        // 飞向目标按钮的动画
        const worldPos = targetButton.node.getWorldPosition();
        const targetPos = this.propAnimIcon.node.parent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);

        const flyAction = new Promise<void>((resolve) => {
            tween(this.propAnimIcon.node)
            .to(0.5, { position: new Vec3(targetPos.x, targetPos.y, 0)})
                .call(() => {
                    this.propAnimIcon.node.active = false;
                    resolve();
                })
                .start();
        });

        await flyAction;

        // 目标按钮的放大缩小动画
        const buttonAnimation = new Promise<void>((resolve) => {
            tween(targetButton.node)
                .to(0.2, { scale: new Vec3(0.8, 0.8, 1)})
                .to(0.2, { scale: new Vec3(0.6, 0.6, 1) })
                .call(() => resolve())
                .start();
        });

        await buttonAnimation;
        this._gameBoard.tipUI.showTips("获得新道具");    
    }
    
}
