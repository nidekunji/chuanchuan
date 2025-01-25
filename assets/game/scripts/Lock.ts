/*
 * @Author: Aina
 * @Date: 2025-01-25 19:57:15
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-25 20:05:03
 * @FilePath: /chuanchuan/assets/game/scripts/Lock.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Node } from 'cc';
import { ResourceManager } from '../../common/scripts/ResourceManager';
import { UIManager } from '../../common/scripts/UIManager';
import { uiLoadingConfigs } from '../../app/config/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('Lock')
export class Lock extends Component {
    start() {
        this.node.on(Node.EventType.TOUCH_END, this.onLockClicked, this);
    }

    onDestroy() {
        this.node?.off(Node.EventType.TOUCH_END, this.onLockClicked, this);
    }

    private onLockClicked() {
        const uiManager = UIManager.instance;
       if (uiManager) {
        uiManager.openUI(uiLoadingConfigs.CommonVedioUIUrl);
       }
    }
}