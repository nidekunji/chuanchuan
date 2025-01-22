/*
 * @Author: Aina
 * @Date: 2025-01-21 11:06:13
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-21 11:49:01
 * @FilePath: /chuanchuan/assets/game/scripts/TipUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Label, Node, Tween, tween, UIOpacity } from 'cc';
import { UIManager } from '../../common/scripts/UIManager';
import { uiLoadingConfigs } from '../../app/config/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('TipUI')
export class TipUI extends Component {
    @property({type:Label})
    private tipLabel: Label;
    start() {

    }
    init() {
        Tween.stopAllByTarget(this.node);
        this.node.active = false;
    }

    public showTips(message: string) {
        // 设置消息文本
        this.tipLabel.string = message;
        Tween.stopAllByTarget(this.node);
        // 重置初始位置和透明度
        this.node.setPosition(0, 0); 
        const opacityComp = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        opacityComp.opacity = 255;
        this.node.active = true;
        
         // 创建动画序列
         const moveTween = this.node.position.clone().add3f(0, 50, 0); // 向上移动的目标位置
         // 执行动画：同时移动和淡出
         const sequence = tween(this.node)
         .to(1, { 
             position: moveTween,
             [opacityComp.uuid]: {
                 opacity: 0
             }
         }, { easing: 'backOut' }) // 移动和淡出同时进行
         .call(() => {
             this.node.active = false; // 动画结束后隐藏节点
         })
         .start();
    }
    update(deltaTime: number) {
        
    }
}

