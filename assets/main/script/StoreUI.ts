/*
 * @Author: Aina
 * @Date: 2025-02-16 02:35:44
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-16 03:12:15
 * @FilePath: /chuanchuan/assets/main/script/StoreUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Node } from 'cc';
import { UIManager } from '../../common/scripts/UIManager';
import { LocalCacheKeys, uiLoadingConfigs } from '../../app/config/GameConfig';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { EventDispatcher } from '../../common/scripts/EventDispatcher';
const { ccclass, property } = _decorator;

@ccclass('StoreUI')
export class StoreUI extends Component {
    start() {

    }
    onClose() {
        const uiManager = UIManager.instance;
        if (uiManager) {
            uiManager.closeUI(uiLoadingConfigs.StoreUIUrl.name);
        }
        this.onNewGame();
    }

    onContinue() {
        this.onClose();

    }
    onNewGame() {
        const eventDispatcher = EventDispatcher.getInstance();
        if (eventDispatcher) {
            eventDispatcher.emit('enterGame');
        } else {
            console.error("EventDispatcher not found!!!");
        }
    }

    onRestart() {
        LocalStorageManager.removeItem(LocalCacheKeys.GameSave);
        LocalStorageManager.removeItem(LocalCacheKeys.FoodStorage);
        LocalStorageManager.removeItem(LocalCacheKeys.WaitingArea);
        LocalStorageManager.removeItem(LocalCacheKeys.PropData);
        this.onClose();
      
    }

    update(deltaTime: number) {
        
    }
}

