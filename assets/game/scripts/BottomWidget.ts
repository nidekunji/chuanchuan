/*
 * @Author: Aina
 * @Date: 2025-01-21 23:58:47
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-25 23:38:52
 * @FilePath: /chuanchuan/assets/game/scripts/BottomWidget.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, find, Node, UITransform, Widget, view, screen } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BottomWidget')
export class BottomWidget extends Component {
    start() {
        this.setupWidget();
    }

    setupWidget() {
        const canvas = find("Canvas");
        const centerNode = canvas.getChildByName("Center");
        
        // 获取Center节点的位置和高度
        const centerTransform = centerNode.getComponent(UITransform);
        const centerY = centerNode.position.y;
        const centerHeight = centerTransform.height;
        
        // 获取当前节点(bottom)的高度
        const bottomTransform = this.node.getComponent(UITransform);
        const bottomHeight = bottomTransform.height;
        
        // 计算并设置bottom节点的位置，使其紧贴center节点的底部
        const bottomPosition = centerY - (centerHeight / 2) - (bottomHeight / 2);
        this.node.setPosition(this.node.position.x, bottomPosition, this.node.position.z);
    }
}