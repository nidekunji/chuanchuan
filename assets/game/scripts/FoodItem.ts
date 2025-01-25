/*
 * @Author: Aina
 * @Date: 2025-01-07 02:16:15
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-25 12:19:21
 * @FilePath: /chuanchuan/assets/game/scripts/FoodItem.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Node, Sprite, Label, SpriteFrame, ParticleSystem2D, Vec3, UIOpacity, tween, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FoodItem')
export class FoodItem extends Component {
    @property(Sprite)
    private foodImage: Sprite = null;

    @property(Label)
    private foodLabel: Label = null;

    @property([SpriteFrame])
    private foodImages: SpriteFrame[] = [];

    @property(ParticleSystem2D)
    private foodParticle: ParticleSystem2D = null;

    start() {
        // 初始化代码
    }
    
    init(type: number, toTable: boolean = false, callback: () => void, target: Vec3, count: number = 1) {
        this.updateFoodImageByType(type);
        this.updateFoodLabel(count);   
        this.node.active = true;
        if (this.foodParticle) {
            this.foodParticle.resetSystem();
        }
        this.node.setScale(new Vec3(0, 0, 0)); 
        let uiOpacity = this.node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.node.addComponent(UIOpacity);
        }
        uiOpacity.opacity = 255;
        
        Tween.stopAllByTarget(this.node);
        // 更夸张的果冻弹性效果
        tween(this.node)
        .to(0.1, { scale: new Vec3(0.8, 0.8, 0.8) }, { easing: 'sineOut' })     // 开始较小
        .to(0.2, { scale: new Vec3(3, 3, 3) }, { easing: 'sineOut' })     // 弹性放大
        .to(0.1, { scale: new Vec3(0.9, 0.9, 0.9) }, { easing: 'sineIn' })     // 稍微收缩
        .to(0.2, { scale: new Vec3(1.1, 1.1, 1.1) }, { easing: 'sineOut' })    // 果冻弹出效果
        .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' })         // 平滑归位
        .start();

        // 移动动画
        tween(this.node)
            .delay(0.7)  // 延迟时间也相应增加以匹配新的动画时长
            .to(0.4, { position: target })
            .call(() => {
                callback?.();
            })
            .start();
    }
    public stopAllAnimations() {
        // Stop all tweens on the node
        Tween.stopAllByTarget(this.node);
        
        // Stop tweens on UIOpacity component if it exists
        const uiOpacity = this.node.getComponent(UIOpacity);
        if (uiOpacity) {
            Tween.stopAllByTarget(uiOpacity);
        }
    }
    public blinkAndFadeOut(callback: () => void) {
        let uiOpacity = this.node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.node.addComponent(UIOpacity);
        }
        uiOpacity.opacity = 255; // Ensure full opacity at start
    
        Tween.stopAllByTarget(this.node);
        tween(this.node)
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) }, { easing: 'quadOut' })
            .start();
    
        // Opacity animation on the UIOpacity component
        tween(uiOpacity)
            .sequence(
                tween().to(0.25, { opacity: 128 }, { easing: 'sineIn' }),
                tween().to(0.25, { opacity: 255 }, { easing: 'sineOut' }),
                tween().to(0.5, { opacity: 0 }, { easing: 'sineOut' })
            )
            .call(() => {
                this.hideFoodItem(); // Hide the food item after animation
                callback?.();
            })
            .start();
    }
    
    public updateFoodImageByType(type: number) {
        if (this.foodImage && this.foodImages[type - 1]) {
            this.foodImage.spriteFrame = this.foodImages[type - 1];
        }
    }

    public updateFoodLabel(newNumber: number) {
        if (this.foodLabel) {
            this.foodLabel.string = newNumber.toString();
        }
    }

    public hideFoodItem() {
        this.node.active = false;
    }
}