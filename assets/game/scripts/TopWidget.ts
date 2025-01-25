/*
 * @Author: Aina
 * @Date: 2025-01-22 00:30:24
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-25 23:47:11
 * @FilePath: /chuanchuan/assets/game/scripts/TopWidget.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, find, Node, UITransform, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TopWidget')
export class TopWidget extends Component {
    @property(Node)
    levelNode: Node = null;

    start() {
        this.updateTopPosition();
    }

    update(deltaTime: number) {
        
    }
    updateTopPosition() {
        const widget = this.getComponent(Widget);
        if (!widget) return;
        
        // 获取系统信息，判断是否为刘海屏
        // if (window['wx'] && window['wx'].getMenuButtonBoundingClientRect) {
        //     const rect = window['wx'].getMenuButtonBoundingClientRect();
        //     if (rect) {
        //         widget.isAlignTop = true;
        //         // 根据胶囊按钮位置设置顶部UI元素的顶部边距
        //         // 可以添加一些额外的边距来保持美观的间隔
        //         console.log("rect.bottom",rect.bottom+40);
        //         widget.top = rect.bottom + 10; // 在胶囊按钮下方留出10像素的间隔
        //         widget.updateAlignment();
        //     }
        // }
        let safeAreaTop = 0;
        if (window['wx'] && window['wx'].getSystemInfoSync) {
            try {
                const systemInfo = window['wx'].getSystemInfoSync();
                const safeArea = systemInfo.safeArea;
                if (safeArea) {
                    // 使用 safeArea.top 直接作为顶部UI元素的偏移
                    safeAreaTop = safeArea.top;
                    console.log("safeAreaTop!!!!!!",safeAreaTop);
                    // 设置 widget 的顶部对齐和偏移
                    widget.isAlignTop = true;
                    widget.top = safeAreaTop+40; // 这里可以根据需要添加额外的偏移量
                    widget.updateAlignment();
                    this.levelNode.setPosition(0,this.levelNode.position.y+safeAreaTop-40+51);
                }
            } catch (e) {
                console.log('Get system info failed:', e);
            }
        }
        // let safeAreaTop = 0;
        // if (window['wx'] && window['wx'].getSystemInfoSync) {
        //     try {
        //         const systemInfo = window['wx'].getSystemInfoSync();
        //         const safeArea = systemInfo.safeArea;
        //         if (safeArea) {
        //             // 计算顶部安全区域的偏移量
        //             safeAreaTop = systemInfo.screenHeight - safeArea.top;
        //             console.log("safeAreaTop",safeAreaTop);
        //              // 设置 widget 的顶部对齐和偏移
        //             // widget.isAlignTop = true;
        //             // widget.top = 50 + safeAreaTop;
        //             // widget.updateAlignment();
        //         }
        //     } catch (e) {
        //         console.log('Get system info failed:', e);
        //     }
        // }       
    }
}

