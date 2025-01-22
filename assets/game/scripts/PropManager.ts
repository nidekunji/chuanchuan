/*
 * @Author: Aina
 * @Date: 2025-01-16 02:50:55
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-21 11:54:26
 * @FilePath: /chuanchuan/assets/game/scripts/PropManager.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Label } from 'cc';
import { GameBoard } from '../script/Test';
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

    public init(gameBoard: GameBoard) {
        this._gameBoard = gameBoard;
        this.resetProps();
    }

    public addHintProps() {
        this.hintCount += 3;
        this.updateView();
    }

    public addShuffleProps() {
        this.shuffleCount += 3;
        this.updateView();
    }

    public addExchangeProps() {
        console.log("!!!!addExchangeProps");
        this.exchangeCount += 3;
        this.updateView();
    }

    public useHint() {
        if (this.hintCount > 0) {
            this.hintCount--;
            this.updateView();
            return true;
        }
        return false;
    }

    public useShuffle() {
        if (this.shuffleCount > 0) {
            this.shuffleCount--;
            this.updateView();
            return true;
        }
        return false;
    }

    public useExchange() {
        if (this.exchangeCount > 0) {
            this.exchangeCount--;
            this.updateView();
            return true;
        }
        return false;
    }

    public resetProps() {
        this.hintCount = 0;
        this.shuffleCount = 0;
        this.exchangeCount = 0;
        this.updateView();
    }
    updateView() {
        if (this.hintCount == 0) {
            this.hintCountLabel.node.active = false;
        } else {
            this.hintCountLabel.node.active = true;
            this.hintCountLabel.string = this.hintCount.toString();
        }
        if (this.shuffleCount == 0) {
            this.shuffleCountLabel.node.active = false;
        } else {
            this.shuffleCountLabel.node.active = true;
            this.shuffleCountLabel.string = this.shuffleCount.toString();
        }
        if (this.exchangeCount == 0) {
            this.exchangeCountLabel.node.active = false;
        } else {
            this.exchangeCountLabel.node.active = true;
            this.exchangeCountLabel.string = this.exchangeCount.toString();
        }
    }

    public getHintCount() {
        return this.hintCount;
    }

    public getShuffleCount() {
        return this.shuffleCount;
    }

    public getExchangeCount() {
        return this.exchangeCount;
    }
}