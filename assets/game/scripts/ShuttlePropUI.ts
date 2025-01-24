/*
 * @Author: Aina
 * @Date: 2025-01-16 03:26:36
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-23 23:15:06
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
    private _isDestroyed: boolean = false;

   
    onLoad() {
        const canvasNode = this.node.scene.getChildByName('Canvas'); // Assuming 'Canvas' is the name of the canvas node
        if (canvasNode) {
            this.GameBoard = canvasNode.getComponent(GameBoard);
        } else {
            console.error("Canvas node not found");
        }
    }
    onClickClose() {
        if (this.node)
        UIManager.instance.closeUI(uiLoadingConfigs.ShuttlePropUrl.name);
    }
    onClickVideo() {
        if (window['wx']) {
            // 记录当前实例
            const currentInstance = this;
            
            console.log('开始播放广告，当前状态:', {
                hasNode: !!this.node,
                isValid: this.node?.isValid,
                isDestroyed: this._isDestroyed
            });

            sdk.p.showRewardedVideoAd((r: number) => {
                console.log('广告回调，当前状态:', {
                    hasNode: !!currentInstance.node,
                    isValid: currentInstance.node?.isValid,
                    isDestroyed: currentInstance._isDestroyed,
                    result: r
                });
                if (!r) {
                    this.GameBoard.tipUI.showTips("没有广告");     
                    currentInstance.onClickClose();
                }

                // 使用保存的实例引用检查
                if (!currentInstance._isDestroyed && currentInstance.node?.isValid) {
                    if (r) {
                       currentInstance.GameBoard.propManager.addShuffleProps();
                       currentInstance.onClickClose();
                    }
                } else {
                    
                    console.error('组件状态异常:', {
                        isDestroyed: currentInstance._isDestroyed,
                        hasNode: !!currentInstance.node,
                        nodeValid: currentInstance.node?.isValid
                    });
                }
            });
        } else {
            // web 环境直接成功回调
            console.log("web 环境直接成功回调")
            this.GameBoard.propManager.addShuffleProps();
            this.onClickClose();
        }
    }

    onDestroy() {
        console.log('ShuttlePropUI 被销毁');
        this._isDestroyed = true;
    }
    // onClickVideo() {
    //     if (window['wx']) {
    //         sdk.p.showRewardedVideoAd((r: number) => {
    //         if (this.node.isValid) {
    //             if (r) {
    //                 // 成功回
    //                 this.GameBoard.propManager.addShuffleProps();
    //                 this.onClickClose();
    //             }
    //         }
    //     })
    //     } else {
    //         // web 环境直接成功回调
    //         this.GameBoard.propManager.addShuffleProps();
    //         this.onClickClose();
    //     }
    // }

    update(deltaTime: number) {
        
    }
}

