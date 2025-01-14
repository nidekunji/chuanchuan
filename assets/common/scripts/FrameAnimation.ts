/*
 * @Author: Aina
 * @Date: 2025-01-03 21:37:19
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-13 03:43:36
 * @FilePath: /chuanchuan/assets/common/scripts/FrameAnimation.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Sprite, SpriteFrame, Node, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FrameAnimation')
export class FrameAnimation extends Component {
    @property([SpriteFrame])
    frames: SpriteFrame[] = [];

    @property(Number)
    frameRate: number = 1; // frames per second

    private currentFrame: number = 0;
    private elapsedTime: number = 0;
    private sprite: Sprite = null!;
    private startFrameId: number = 0;
    private endFrameId: number = 1;
    private customerId: number = 0;


    onLoad() {
        this.sprite = this.getComponent(Sprite)!;
    }
    init(type: number, frameRate: number = 1, scaleX: number = 1) {
        if (frameRate !== undefined) {
            this.frameRate = frameRate;
        }
        this.customerId = type;
       
        this.startFrameId = (type - 1) * 2;
        this.endFrameId = this.startFrameId + 1;
        let node = this.node; // 获取当前组件所在的节点
        if (node) {
            node.setScale(new Vec3(scaleX, 1, 1)); // 设置节点的缩放
        }
        if (this.endFrameId >= this.frames.length) {
            console.warn(`Type ${type} results in endFrameId ${this.endFrameId} which is out of bounds. Adjusting to last valid index.`);
            this.endFrameId = this.frames.length - 1;
        }
    }

    update(dt: number) {
        if (this.frames.length === 0) return;
        this.elapsedTime += dt;
        const frameDuration = 1 / this.frameRate;
    
        if (this.elapsedTime >= frameDuration) {
            this.elapsedTime -= frameDuration;
            this.currentFrame = (this.currentFrame + 1) % (this.endFrameId - this.startFrameId + 1) + this.startFrameId;
            this.sprite.spriteFrame = this.frames[this.currentFrame];
        }
    }
}