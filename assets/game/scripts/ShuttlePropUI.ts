/*
 * @Author: Aina
 * @Date: 2025-01-16 03:26:36
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-16 03:32:28
 * @FilePath: /chuanchuan/assets/game/scripts/ShuttlePropUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Node } from 'cc';
import { GameBoard } from '../script/Test';
import { UIManager } from '../../common/scripts/UIManager';
import { uiLoadingConfigs } from '../../app/config/GameConfig';
import { sdk } from '../../sdk/sdk';
const { ccclass, property } = _decorator;

@ccclass('ShuttlePropUI')
export class ShuttlePropUI extends Component {
    private GameBoard: GameBoard = null;

   
    onLoad() {
        const canvasNode = this.node.scene.getChildByName('Canvas'); // Assuming 'Canvas' is the name of the canvas node
        if (canvasNode) {
            this.GameBoard = canvasNode.getComponent(GameBoard);
        } else {
            console.error("Canvas node not found");
        }
    }
    onClickClose() {
        UIManager.instance.closeUI(uiLoadingConfigs.ShuttlePropUrl.name);
    }
    onClickVideo() {
        if (window['wx']) {
            sdk.p.showRewardedVideoAd((r: number) => {
            if (this.node.isValid) {
                if (r) {
                    // 成功回调
                    this.onClickClose();
                    this.GameBoard.propManager.addShuffleProps();
                }
            }
        })
        } else {
            // web 环境直接成功回调
            this.onClickClose();
            this.GameBoard.propManager.addShuffleProps();
        }
    }

    update(deltaTime: number) {
        
    }
}

