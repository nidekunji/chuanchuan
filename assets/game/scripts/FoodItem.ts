/*
 * @Author: Aina
 * @Date: 2025-01-07 02:16:15
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-11 21:57:54
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
            this.foodParticle.resetSystem(); // This will play the particle system once
        }
    
        this.node.setScale(new Vec3(0, 0, 0)); 
        // 检查 node 是否有 UIOpacity 组件，如果没有则添加
        let uiOpacity = this.node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.node.addComponent(UIOpacity);
        }
        uiOpacity.opacity = 255; // 设置透明度为 0
        Tween.stopAllByTarget(this.node);
        tween(this.node)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' }) 
            .start();
        tween(this.node)
            .delay(0.4) 
            .to(0.3, { position: target}) 
            .call(() => {
                callback?.();
            })
            .start();
    }
    public blinkAndFadeOut() {
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