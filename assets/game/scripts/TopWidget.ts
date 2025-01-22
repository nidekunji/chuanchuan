/*
 * @Author: Aina
 * @Date: 2025-01-22 00:30:24
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-22 22:45:27
 * @FilePath: /chuanchuan/assets/game/scripts/TopWidget.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, find, Node, UITransform, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TopWidget')
export class TopWidget extends Component {
    start() {
        this.updateTopPosition();
    }

    update(deltaTime: number) {
        
    }
    updateTopPosition() {
        const widget = this.getComponent(Widget);
        if (!widget) return;
        
        // 获取系统信息，判断是否为刘海屏

        let safeAreaTop = 0;
        if (window['wx'] && window['wx'].getSystemInfoSync) {
            try {
                const systemInfo = window['wx'].getSystemInfoSync();
                const safeArea = systemInfo.safeArea;
                if (safeArea) {
                    // 计算顶部安全区域的偏移量
                    safeAreaTop = systemInfo.screenHeight - safeArea.top;
                     // 设置 widget 的顶部对齐和偏移
        widget.isAlignTop = true;
        widget.top = 50 + safeAreaTop;
        widget.updateAlignment();
                }
            } catch (e) {
                console.log('Get system info failed:', e);
            }
        }       
    }
}

