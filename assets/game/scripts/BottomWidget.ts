/*
 * @Author: Aina
 * @Date: 2025-01-21 23:58:47
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-22 12:34:17
 * @FilePath: /chuanchuan/assets/game/scripts/BottomWidget.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, find, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BottomWidget')
export class BottomWidget extends Component {
    start() {
        this.updateBottomPosition();
    }

    update(deltaTime: number) {
        
    }
    updateBottomPosition() {
        let canvasHeight = find("Canvas").getComponent(UITransform).contentSize.height;
        let selfHeight = this.node.getComponent(UITransform).contentSize.height;
        console.error("canvasHeight", canvasHeight ,-canvasHeight/2 - selfHeight);
        // 设置位置：将节点放置在底部
        // 由于锚点是(0.5, 0)，我们需要考虑以下因素：
        // 1. 画布原点在中心，所以底部是 -canvasHeight/2
        // 2. 需要加上自身高度的一半来调整位置
        this.node.setPosition(0, -canvasHeight/2);
    }
}

