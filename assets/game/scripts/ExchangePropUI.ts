/*
 * @Author: Aina
 * @Date: 2025-01-13 04:39:57
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-13 05:51:57
 * @FilePath: /chuanchuan/assets/game/scripts/ExchangePropUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Node } from 'cc';
import { UIManager } from '../../common/scripts/UIManager';
import { uiLoadingConfigs } from '../../app/config/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('ExchangePropUI')
export class ExchangePropUI extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }
    onClickExit() {
        UIManager.instance.closeUI(uiLoadingConfigs.ExchangePropUrl.name);
    }
}

