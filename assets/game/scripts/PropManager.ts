/*
 * @Author: Aina
 * @Date: 2025-01-16 02:50:55
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-14 01:46:08
 * @FilePath: /chuanchuan/assets/game/scripts/PropManager.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Color, Component, Label, Sprite } from 'cc';
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

    public init(gameBoard: GameBoard) {
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
            this.hintUsed = data.hintUsed || 0;
            this.shuffleUsed = data.shuffleUsed || 0;
            this.exchangeUsed = data.exchangeUsed || 0;
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

    public addHintProps() {
        this.hintCount += 3;
        this.saveToStorage();
        this.updateView();
    }

    public addShuffleProps() {
        this.shuffleCount += 3;
        this.saveToStorage();
        this.updateView();
    }

    public addExchangeProps() {
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
        this.hintCount = 0;
        this.shuffleCount = 0;
        this.exchangeCount = 0;
        // 重置使用状态
        this.hintUsed = 0;
        this.shuffleUsed = 0;
        this.exchangeUsed = 0;
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
}
