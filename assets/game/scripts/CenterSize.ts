/*
 * @Author: Aina
 * @Date: 2025-01-09 23:17:17
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-22 18:31:44
 * @FilePath: /chuanchuan/assets/game/scripts/CenterSize.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Node, Vec3, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CenterSize')
export class CenterSize extends Component {
    start() {
        const windowSize = view.getVisibleSize();
        const aspectRatio = windowSize.width / windowSize.height;
        
        // 根据宽高比动态计算缩放
        if (aspectRatio < 0.5625) { // 16:9 的宽高比约为 0.5625
            const scale = windowSize.height / (windowSize.width * 1.778); // 1.778 约等于 16/9
            this.node.scale = new Vec3(scale, scale, 1);
        }
    }

    update(deltaTime: number) {
        
    }
}

