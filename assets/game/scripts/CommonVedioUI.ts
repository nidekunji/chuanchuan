/*
 * @Author: Aina
 * @Date: 2025-01-25 19:37:35
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-25 20:33:59
 * @FilePath: /chuanchuan/assets/game/scripts/CommonVedioUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Label, Node } from 'cc';
import { CommonVedioUIConfig, uiLoadingConfigs } from '../../app/config/GameConfig';
import { sdk } from '../../sdk/sdk';
import { UIManager } from '../../common/scripts/UIManager';
import { GameBoard } from '../script/Test';
const { ccclass, property } = _decorator;

@ccclass('CommonVedioUI')
export class CommonVedioUI extends Component {
    @property(Label)
    private titleLabel: Label = null;

    @property(Label)
    private subtitleLabel: Label = null;

    @property(Node)
    private watchButton: Node = null;

    @property(Node)
    private closeButton: Node = null;

    private callback: Function = null;

    private GameBoard: GameBoard = null;
    
    onLoad() {
        
    }
    start() {
        const canvasNode = this.node.scene.getChildByName('Canvas'); // Assuming 'Canvas' is the name of the canvas node
        if (canvasNode) {
            this.GameBoard = canvasNode.getComponent(GameBoard);
        } else {
            console.error("Canvas node not found");
        }
        this.watchButton.on(Node.EventType.TOUCH_END, this.onWatchButtonClicked, this);
        this.closeButton.on(Node.EventType.TOUCH_END, this.onCloseButtonClicked, this);
    }
    public init(type: string, callback: Function) {
        let config = CommonVedioUIConfig[type];
        this.titleLabel.string = config.title;
        this.subtitleLabel.string = config.subtitle;
        this.callback = callback;
    }
    private onWatchButtonClicked() {
        if (window['wx']) {
            sdk.p.showRewardedVideoAd((r: number) => {
            if (this.node.isValid) {
                if (r) {
                    this.handleAdComplete();
                } else {
                    console.log("广告播放失败");
                    this.onCloseButtonClicked();
                }
            }
        })
        } else {
           this.handleAdComplete();
        }
    }
    private onCloseButtonClicked() {
       const uiManager = UIManager.instance;
       if (uiManager) {
        console.error("onCloseButtonClicked");
        uiManager.closeUI(uiLoadingConfigs.CommonVedioUIUrl.name);
       }
    }
    private handleAdComplete() {
        if (this.callback) {
            this.callback();
        }
        console.log("handleAdComplete");
        if (this.GameBoard) {
            if (this.GameBoard.foodStorageManager) {
                this.GameBoard.foodStorageManager.unlockNextStorageSlot();
                this.GameBoard.tipUI.showTips("解锁了新的食物存放区");
            }
        }
        this.offEvent();
        this.onCloseButtonClicked();
    }
    offEvent() {
        this.watchButton.off(Node.EventType.TOUCH_END, this.onWatchButtonClicked, this);
        this.closeButton.off(Node.EventType.TOUCH_END, this.onCloseButtonClicked, this);
    }


    update(deltaTime: number) {
        
    }
}

