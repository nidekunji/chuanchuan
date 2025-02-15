/*
 * @Author: Aina
 * @Date: 2025-02-10 01:41:36
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-10 01:53:18
 * @FilePath: /chuanchuan/assets/game/scripts/LayerUI.ts
 * @Description:    
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Label, Node } from 'cc';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { LocalCacheKeys } from '../../app/config/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('LayerUI')
export class LayerUI extends Component {
    @property(Label)
    private levelLabel: Label = null;

    @property(Label)
    private nextLevelLabel: Label = null;

    private level: number = 1;

    start() {

    }
    onLoad() {
        this.updateLevel();
    }
    updateLevel() {
        let level = LocalStorageManager.getItem(LocalCacheKeys.Level)
        this.level = level ? parseInt(level) : 1;
        this.levelLabel.string = "第" + this.level.toString() + "波";
            // 计算下一个解锁点
            const nextUnlockLevel = Math.ceil((this.level + 1) / 5) * 5;
            const remainingWaves = nextUnlockLevel - this.level;
            this.nextLevelLabel.string = "" + remainingWaves.toString() + "";
    }

    update(deltaTime: number) {
        
    }
}

