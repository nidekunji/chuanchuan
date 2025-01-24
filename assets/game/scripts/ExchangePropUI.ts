/*
 * @Author: Aina
 * @Date: 2025-01-13 04:39:57
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-23 21:53:07
 * @FilePath: /chuanchuan/assets/game/scripts/ExchangePropUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Node } from 'cc';
import { UIManager } from '../../common/scripts/UIManager';
import { uiLoadingConfigs } from '../../app/config/GameConfig';
import { GameBoard } from '../script/Test';
import { sdk } from '../../sdk/sdk';
const { ccclass, property } = _decorator;

@ccclass('ExchangePropUI')
export class ExchangePropUI extends Component {
    start() {

    }
    private GameBoard: GameBoard = null;

    
    onLoad() {
        const canvasNode = this.node.scene.getChildByName('Canvas'); // Assuming 'Canvas' is the name of the canvas node
        if (canvasNode) {
            this.GameBoard = canvasNode.getComponent(GameBoard);
        } else {
            console.error("Canvas node not found");
        }
    }

    update(deltaTime: number) {
        
    }
    onClickExit() {
        UIManager.instance.closeUI(uiLoadingConfigs.ExchangePropUrl.name, 1);
    }
    addExchangeProps() {
        this.GameBoard.propManager.addExchangeProps();
        this.GameBoard.tipUI.showTips("点击两个任意位置的食物，交换位置");
    }
    onClickVideo() {
        if (window['wx']) {
            sdk.p.showRewardedVideoAd((r: number) => {
            if (this.node.isValid) {
                if (r) {
                    // 成功回调
                    this.addExchangeProps();
                    this.onClickExit();
                }
            }
        })
        } else {
            // web 环境直接成功回调
            this.addExchangeProps();
            this.onClickExit();
        }
    }
}

