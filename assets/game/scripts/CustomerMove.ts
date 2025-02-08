/*
 * @Author: Aina
 * @Date: 2025-01-10 04:25:09
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-07 16:35:29
 * @FilePath: /chuanchuan/assets/game/scripts/CustomerMove.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
// CustomerMovement.ts
import { _decorator, Component, Vec3, tween, Tween } from 'cc';
import { CustomerMoveConfig } from '../../app/config/GameConfig';
import { CustomerState } from '../../core/scripts/define/Enums';
const { ccclass, property } = _decorator;
// 客户状态枚举

const paths = {
    1: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    2: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    3: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    4: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    5: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    6: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
}
// 离开餐桌
const leftPath = {
    1: [new Vec3(0, 0, 0), new Vec3(-100, 0, 0)],
    2: [new Vec3(0, 0, 0), new Vec3(-100, 0, 0)],
    3: [new Vec3(0, 0, 0), new Vec3(-100, 0, 0)],
    4: [new Vec3(0, 0, 0), new Vec3(-100, 0, 0)],
    5: [new Vec3(0, 0, 0), new Vec3(-100, 0, 0)],
    6: [new Vec3(0, 0, 0), new Vec3(-100, 0, 0)],
}
// 进入等待餐桌
const enterPath = {
    1: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    2: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    3: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    4: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    5: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
    6: [new Vec3(0, 0, 0), new Vec3(100, 0, 0)],
}

@ccclass('CustomerMove')
export class CustomerMove extends Component {
    @property(Vec3)
    public path: Vec3[] = []; // 路径点数组

    private currentPathIndex: number = 0;
    private currentState: CustomerState = CustomerState.Idle;

    start() {
        this.transitionToState(CustomerState.Idle);
    }

    transitionToState(newState: CustomerState) {
        this.currentState = newState;
      //  this.handleStateChange();
    }

    handleStateChange() {
        switch (this.currentState) {
            case CustomerState.Idle:
                this.startMovingThroughWaypoints(CustomerMoveConfig.speed, CustomerMoveConfig.waypoints[1]); 
                break;
            case CustomerState.IsReturning:
                this.returnWithSkewer();
                break;
            case CustomerState.JoiningQueue:
                this.joinQueue();
                break;
            case CustomerState.MovingToWaitingArea:
                this.moveToWaitingArea();
                break;
        }
    }

    setupInitialPositions() {
        // 实现设置位置的逻辑
        this.transitionToState(CustomerState.IsReturning);
    }

    returnWithSkewer() {
        // 实现返回逻辑
        this.transitionToState(CustomerState.JoiningQueue);
    }

    joinQueue() {
        // 实现加入队列的逻辑
        this.transitionToState(CustomerState.MovingToWaitingArea);
    }

    moveToWaitingArea() {
        // 实现移动到等待区的逻辑
        // 可能需要转换到其他状态或结束循环
    }

    // assets/app/config/GameConfig.ts
    startMovingThroughWaypoints(speed: number, waypoints: Vec3[], callback?: () => void) {
        Tween.stopAllByTarget(this.node);
        let sequence = tween(this.node); // 创建一个tween序列
        let previousPosition = this.node.position.clone(); // 保存初始位置
        waypoints.forEach((waypoint, index) => {
            let duration = Vec3.distance(previousPosition, waypoint) /  speed;
            // let scaleDirection = this.calculateScaleDirection(previousPosition, waypoint); // 提前计算朝向
            let scaleDirection = index === waypoints.length - 1 
            ? new Vec3(1, 1, 1) 
            : this.calculateScaleDirection(previousPosition, waypoint);
            
            sequence = sequence
            .to(0, { scale: scaleDirection }) // Set scale instantly
            .to(duration, { position: waypoint }, { easing: 'linear' }) // Move to waypoint
            .call(() => {
               // console.log(`Reached waypoint ${index + 1}: x=${waypoint.x}, y=${waypoint.y}, z=${waypoint.z}`);
            });

            previousPosition = waypoint; // 更新前一个位置为当前路点位置
        });

        sequence
            .call(() => {
                //console.log("Reached the last waypoint");
                callback?.();
            })
            .start(); // 开始执行序列
    }
    public stopAllActions() {
        Tween.stopAllByTarget(this.node);
    }

    calculateScaleDirection(fromPosition: Vec3, toPosition: Vec3): Vec3 {
        const deltaX = toPosition.x - fromPosition.x;
        return deltaX >= 0 ? new Vec3(-1, 1, 1) : new Vec3(1, 1, 1); // 根据x轴差值确定朝向
    }
}