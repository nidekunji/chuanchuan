/*
 * @Author: Aina
 * @Date: 2025-02-17 15:51:02
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-17 16:07:21
 * @FilePath: /chuanchuan/assets/main/script/Customer.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { iconList } from '../../app/config/GameConfig';
import { ResourceManager } from '../../common/scripts/ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('Customer')
export class Customer extends Component {

    @property(Sprite)
    private icon: Sprite = null;

    @property(Label)
    private iconName: Label = null;

    @property(Node)
    private lockName: Node = null;

    @property(Node)
    private selectIcon: Node = null;

    private isUnlock: boolean = false;

    start() {

    }

    update(deltaTime: number) {
        
    }
    init (isUnlock: boolean, level: number) {
        this.isUnlock = isUnlock;
        if (isUnlock) {
            this.unlockIcon(level);
        } else {
            this.lockIcon(level);
        }
    }

    unlockIcon (level: number) {        
        this.selectIcon.active = false;
        this.lockName.active = false;
        this.iconName.string = iconList[level].name;
        let path = `common/textures/${level}/spriteFrame`
        ResourceManager.loadSpriteFrame(path, (err, spriteFrame) => {
            if (err) {
                console.error("加载精灵帧失败:", err);
                return;
            }
            this.icon.spriteFrame = spriteFrame;
            // 使用加载到的 spriteFrame
            console.log("精灵帧加载成功:", spriteFrame);
        });
    }

    lockIcon (level: number) {
        this.selectIcon.active = false;
        this.lockName.active = true;
        this.iconName.node.active = false;

        let bundleName = 'main2';
        let path = `main/textures/${level}_unlock/spriteFrame`
        ResourceManager.loadSpriteFrameFromBundle(bundleName, path, (err, spriteFrame) => {
            if (err) {
                console.error('Error loading texture:', err);
            } else {
                this.icon.spriteFrame = spriteFrame;
            }
        });
    }
}
