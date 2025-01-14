/*
 * @Author: Aina
 * @Date: 2025-01-05 16:41:56
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-13 05:50:42
 * @FilePath: /chuanchuan/assets/game/scripts/FailUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, assetManager, Component, director, Label, Node, UITransform } from 'cc';
import { uiLoadingConfigs } from '../../app/config/GameConfig';
import { UIManager } from '../../common/scripts/UIManager';
import { EventDispatcher } from '../../common/scripts/EventDispatcher';
import { GameBoard } from '../script/Test';
const { ccclass, property } = _decorator;

@ccclass('FailUI')
export class FailUI extends Component {
    
    private eventDispatcher: EventDispatcher;
    @property(Node)
    ratioNode: Node = null; // 在编辑器中将按钮节点拖入此属性
    @property(Label)
    ratioLabel: Label = null; // 在编辑器中将按钮节点拖入此属性

    private GameBoard: GameBoard;

    onLoad() {
        const canvasNode = this.node.scene.getChildByName('Canvas'); // Assuming 'Canvas' is the name of the canvas node
        if (canvasNode) {
            this.GameBoard = canvasNode.getComponent(GameBoard);
        } else {
            console.error("Canvas node not found");
        }
    }
    start() {
        this.updateScoreAndProgress();
    }

    update(deltaTime: number) {
        
    }
    updateScoreAndProgress() {
        let sp = this.ratioNode.getComponent(UITransform)!
        
       // console.log(Math.floor(this.GameBoard.getProgressFromProgressBar().currentScore / this.GameBoard.getProgressFromProgressBar().totalPossibleScore) * 321)
       let progress = this.GameBoard.getProgressFromProgressBar().currentScore / this.GameBoard.getProgressFromProgressBar().totalPossibleScore
       if (progress > 1) {
        progress = 1
       }
        sp.width = progress * 321;
        this.ratioLabel.string = `你一共挣了 ${this.GameBoard.getProgressFromProgressBar().currentScore } 个金币` 
    }
    onClickReset() {
        UIManager.instance.closeUI(uiLoadingConfigs.FailUrl.name);
        console.log("onClickReset", this.eventDispatcher);
        if (this.GameBoard) {
            this.GameBoard.resetGame(); // Call the resetGame method on GameBoard
        } else {
            console.error('GameBoard is not initialized');
        }
    }
    onClickMainMenu() {
        console.log("onClickMainMenu");
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

