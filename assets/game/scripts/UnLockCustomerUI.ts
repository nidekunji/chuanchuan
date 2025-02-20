/*
 * @Author: Aina
 * @Date: 2025-02-19 06:52:45
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-19 07:26:05
 * @FilePath: /chuanchuan/assets/game/scripts/UnLockCustomerUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Node, tween, Vec3, UIOpacity, SpriteFrame, Sprite, assetManager, director } from 'cc';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { LocalCacheKeys, uiLoadingConfigs } from '../../app/config/GameConfig';
import { ResourceManager } from '../../common/scripts/ResourceManager';
import { UIManager } from '../../common/scripts/UIManager';
import { GameBoard } from '../script/Test';
const { ccclass, property } = _decorator;

@ccclass('UnLockCustomerUI')
export class UnLockCustomerUI extends Component {
    @property(Node)
    private lightCircle: Node = null;    // 光圈节点

    @property(Node)
    private characterNode: Node = null;   // 人物节点

    private characterOpacity: UIOpacity = null;

    private GameBoard: GameBoard;

    start() {
        const canvasNode = this.node.scene.getChildByName('Canvas'); // Assuming 'Canvas' is the name of the canvas node
        if (canvasNode) {
            this.GameBoard = canvasNode.getComponent(GameBoard);
        } else {
            console.error("Canvas node not found");
        }
        // 确保人物节点上有 UIOpacity 组件
        this.characterOpacity = this.characterNode.getComponent(UIOpacity);
        if (!this.characterOpacity) {
            this.characterOpacity = this.characterNode.addComponent(UIOpacity);
        }
        this.setCustomerSprite(() => {
            this.playUnlockEffect();
        });
    }

    private playUnlockEffect() {
        // 光圈简单缩放动画
        tween(this.lightCircle)
            .to(0.2, { scale: new Vec3(1.5, 1.5, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();

        // 人物诞生动画
        this.characterNode.scale = new Vec3(0, 0, 1);
        this.characterOpacity.opacity = 0;

        // 人物放大动画
        tween(this.characterNode)
            .to(0.4, { scale: new Vec3(3, 3, 1) })
            .start();

        // 透明度动画
        tween(this.characterOpacity)
            .to(0.4, { opacity: 255 })
            .start();
    }
    setCustomerSprite(callback: Function) {
        let origalNum = LocalStorageManager.getItem(LocalCacheKeys.UnlockCustomerNum)
        let currentNum = 1
        if (origalNum) {
            currentNum = parseInt(origalNum)
        }
        let path = `texture/${currentNum}/spriteFrame`
        ResourceManager.loadFromResources(path, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                return;
            }
            this.characterNode.getComponent(Sprite).spriteFrame = spriteFrame;
            callback()
        });
    }

    private playFloatingAnimation() {
        // 持续的轻微上下浮动动画
        tween(this.characterNode)
            .repeatForever(
                tween()
                    .to(1, { position: new Vec3(0, 5, 0) })
                    .to(1, { position: new Vec3(0, 0, 0) })
            )
            .start();
    }

    
    public onClickClose() {
        UIManager.instance.closeUI(uiLoadingConfigs.UnLockCustomerUIUrl.name)
    }
    public onRestart() {
        this.onClickClose()
        UIManager.instance.closeUI(uiLoadingConfigs.FailUrl.name)
        if (this.GameBoard) {
            this.GameBoard.resetGame(); // Call the resetGame method on GameBoard
        } else {
            console.error('GameBoard is not initialized');
        }
        
    }
    public onClickMainMenu() {
        assetManager.loadBundle("main2", (err, bundle) => {
            if (err) {
                console.error("Failed to load main2 bundle:", err);
                return;
            }
            console.log("main2 bundle loaded successfully   !!!!");
            bundle.loadScene("Main", (err, scene) => {
                if (err) {
                    console.error("Failed to load MainScene:", err);
                    return;
                }
                console.log(scene, "scene");
                director.runScene(scene);
            });
        });
    }
}

