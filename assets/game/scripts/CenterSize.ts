/*
 * @Author: Aina
 * @Date: 2025-01-09 23:17:17
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-09 23:20:57
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
        console.log("windowSize", windowSize.height);
        if (windowSize.height < 854) {
            this.node.scale = new Vec3(0.8, 0.8, 1);
        }
    }

    update(deltaTime: number) {
        
    }
}

