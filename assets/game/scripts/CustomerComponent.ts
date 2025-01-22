/*
 * @Author: Aina
 * @Date: 2025-01-10 04:54:34
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-22 23:50:57
 * @FilePath: /chuanchuan/assets/game/scripts/CustomerComponent.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
// CustomerComponent.ts
import { _decorator, Component, Sprite, SpriteFrame, Vec3, Node, Tween, tween, Canvas, UITransform } from 'cc';
import { FrameAnimation } from '../../common/scripts/FrameAnimation';
import { CustomerMove } from './CustomerMove';
import { ResourceManager } from '../../common/scripts/ResourceManager';
import { CustomerState } from '../../core/scripts/define/Enums';
const { ccclass, property } = _decorator;

const waitingPositions = {
    1: new Vec3(-287, 24, 0),
    2: new Vec3(-178, 24, 0),
    3: new Vec3(-67, 24, 0),
    4: new Vec3(42, 24, 0),
    5: new Vec3(155, 24, 0),
    6: new Vec3(262, 24, 0)
};
const queuePositions = {
    1: new Vec3(33, 197, 0),
    2: new Vec3(22, 243, 0),
    3: new Vec3(15, 285, 0)
};
@ccclass('CustomerComponent')
export class CustomerComponent extends Component {

    private foodNode: Node = null;

    @property(Sprite)
    private foodSprite: Sprite = null;

    @property(Node)
    private finishNode: Node = null;

    customerType: number = 0; // 顾客需要的宝石类型
    tableId: number = 0; // 桌子id
    isWaiting: boolean = false; // 是否在等待区
    currentState: CustomerState = CustomerState.None;
    foodScaleX: number = 1;

    frameAnimation: FrameAnimation | null = null;
    movement: CustomerMove | null = null;

    onLoad() {
        this.frameAnimation = this.getComponent(FrameAnimation) || this.addComponent(FrameAnimation);
        
        this.movement = this.getComponent(CustomerMove) || this.addComponent(CustomerMove);
        const randomScaleX = 1;
        this.foodScaleX = randomScaleX;
        this.foodNode = this.node.getChildByName('food')!;
        this.foodNode.scale = new Vec3(this.foodScaleX, 1, 1);

        this.foodSprite = this.foodNode.getChildByName('sprite').getComponent(Sprite)!;
    }
    stopAllMovements(){
         // Stop food UI animations
        Tween.stopAllByTarget(this.foodNode);
        
        // Reset food node scale and position
        if (this.foodNode) {
            this.foodNode.scale = new Vec3(this.foodScaleX, 1, 1);
            this.foodNode.position = new Vec3(0, 0, 0);
        }

        // Stop customer movement if it exists
        if (this.movement) {
            this.movement.stopAllActions();
        }
    }
    /**
     * 
     * @param customerType 
     * @param tableId 
     * @param isWaiting 
     */
    init(customerType: number, tableId: number , isWaiting: boolean) {
        this.customerType = customerType;
        this.tableId = tableId;
        this.isWaiting = isWaiting;
        this.node.active = false;
        this.finishNode.active = false;
        
        this.node.active = true;
        if (isWaiting) {
            this.node.setPosition(waitingPositions[tableId]);
            if (this.frameAnimation) {
                this.frameAnimation.init(this.customerType);
            }
        } else {
            this.hideFoodUI();
            this.node.setPosition(queuePositions[tableId]);
        }
    }
    public getFoodSpritePosition(){
        let canvas = this.node.scene.getComponentInChildren(Canvas);
        let spriteWorldPosition = this.foodSprite.node.getWorldPosition();
        let canvasComponent = canvas.getComponent(UITransform);
        let positionRelativeToCanvas = canvasComponent.convertToNodeSpaceAR(spriteWorldPosition);
        return positionRelativeToCanvas;
    }
    
    
    public setFoodUI(){
        this.foodNode.active = false;
        if (this.isWaiting) {
            this.updateFoodSprite(()=>{
                this.showFoodUIAnim();
            });
        }
    }
    public showFoodUI(){
        this.foodNode.active = true;
        this.showFoodUIAnim();
    }
    public hideFoodUI(){
       // console.error('顾客隐藏食物UI========', this.currentState === CustomerState.JoiningQueue);
        Tween.stopAllByTarget(this.foodNode);
        this.foodNode.active = false;
        this.finishNode.active = false;
    }
    public showFoodUIAnim(){
        this.foodNode.active = true;
        Tween.stopAllByTarget(this.foodNode);
        const randomScaleX = this.foodScaleX
        let time = 0.2;
        tween(this.foodNode)
        // 放大
        .to(time, { scale: new Vec3(1.2*randomScaleX, 1.2, 1.2) })
        // 缩小
        .to(time, { scale: new Vec3(0.8*randomScaleX, 0.8, 0.8) })
        // 回到原始尺寸
        .to(time, { scale: new Vec3(1*randomScaleX, 1, 1) })
        // 循环
        .union()
        .repeatForever()
        .start();
    }
   
    
    public getCustomerType(): number {
        return this.customerType;
    }
    public updateFoodSprite(callback?: () => void) {
        let bundleName = 'game';
        let path = `res/icon/${this.customerType}_1/spriteFrame`
        ResourceManager.loadSpriteFrameFromBundle(bundleName, path, (err, spriteFrame) => {
            if (err) {
                console.error('Error loading texture:', err);
            } else {
                this.foodSprite.spriteFrame = spriteFrame;
                callback && callback();
            }
        });
    }
    // 添加方法来处理状态转换并相应地调用移动方法
private handleStateChange() {
    switch (this.currentState) {
        case CustomerState.None:
            this.hideFoodUI();
            break;
        case CustomerState.Idle:
            this.setFoodUI();
            break;
        case CustomerState.IsReturning:
            this.hideFoodUI();
            break;
        case CustomerState.JoiningQueue:
            this.hideFoodUI();
            break;
        case CustomerState.MovingToWaitingArea:
            this.hideFoodUI();
            break;
    }
}
    public updateState(state: CustomerState) {
      //  console.error('顾客状态更新========', state);
        this.currentState = state;
        if (state === CustomerState.Idle) {
            this.isWaiting = true;
        }
        this.handleStateChange();
    }
   
}