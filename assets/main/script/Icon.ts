/*
 * @Author: Aina
 * @Date: 2025-02-17 15:51:02
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-17 18:48:01
 * @FilePath: /chuanchuan/assets/main/script/Icon.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { _decorator, Component, Label, Node, Sprite, SpriteFrame, tween, Vec3 } from 'cc';
import { iconList } from '../../app/config/GameConfig';
import { ResourceManager } from '../../common/scripts/ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('Icon')
export class Icon extends Component {

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
        this.selectIcon.active = false;
        if (isUnlock) {
            this.unlockIcon(level);
        } else {
            this.lockIcon(level);
        }
    }

    unlockIcon (level: number) {  
            
        if (level > 7) {
            level = Math.floor(Math.random() * 7) + 1;
        } 
        this.selectIcon.active = false;
        this.lockName.active = false;
        this.iconName.string = iconList[level].name;
        let path = `texture/${level}/spriteFrame`
        ResourceManager.loadFromResources(path, SpriteFrame, (err, spriteFrame) => {
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
        if (level > 7) {
            level = Math.floor(Math.random() * 6) + 2; // Generate random number between 2-7
        }
        this.selectIcon.active = false;
        this.lockName.active = true;
        this.iconName.node.active = false;

        let bundleName = 'main2';
        let path = `texture/main/${level}_unlock/spriteFrame`
        ResourceManager.loadSpriteFrameFromBundle(bundleName, path, (err, spriteFrame) => {
            if (err) {
                console.error('Error loading texture:', err);
            } else {
                this.icon.spriteFrame = spriteFrame;
            }
        });
    }
    onSelect () {
        if (this.isUnlock) {
            this.selectIcon.active = !this.selectIcon.active;
        }
    }
    public setSelected(isSelected: boolean) {
        console.log('isSelected', isSelected, this.node, this.isUnlock);
        if (this.isUnlock) {
            this.selectIcon.active = isSelected;
            
            // 停止当前正在进行的所有动作
            tween(this.node).stop();
            // 确保节点恢复到原始比例 1.0
            this.node.setScale(new Vec3(1, 1, 1));
            
            // 添加缩放动画
            if (isSelected) {
                // 选中时先缩小后放大
                tween(this.node)
                .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) })
                .to(0.1, { scale: new Vec3(1.0, 1.0, 1.0) })
                .start();
            }
        }
    }
}
