import { _decorator, Component, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CharacterMovement')
export default class CharacterMovement extends Component {
    @property
    speed: number = 100; // Movement speed of the character in units per second

    waypoints: Vec3[] = [
        new Vec3(-277, 196, 1),
        new Vec3(-187, 257, 1),
        new Vec3(-146, 357, 1),
        new Vec3(-9, 423, 1),
        new Vec3(-9, 728, 1)
    ];

    onLoad() {
        this.startMovingThroughWaypoints();
    }

    startMovingThroughWaypoints() {
        let sequence = tween(this.node); // 创建一个tween序列
        let previousPosition = this.node.position.clone(); // 保存初始位置
    
        this.waypoints.forEach((waypoint, index) => {
            let duration = Vec3.distance(previousPosition, waypoint) / this.speed;
            let scaleDirection = this.calculateScaleDirection(previousPosition, waypoint); // 提前计算朝向
    
            sequence = sequence
            .to(0, { scale: scaleDirection }) // Set scale instantly
            .to(duration, { position: waypoint }, { easing: 'linear' }) // Move to waypoint
            .call(() => {
                console.log(`Reached waypoint ${index + 1}: x=${waypoint.x}, y=${waypoint.y}, z=${waypoint.z}`);
            });
    
            previousPosition = waypoint; // 更新前一个位置为当前路点位置
        });
    
        sequence
            .call(() => console.log("Reached the last waypoint"))
            .start(); // 开始执行序列
    }
    
    calculateScaleDirection(fromPosition: Vec3, toPosition: Vec3): Vec3 {
        const deltaX = toPosition.x - fromPosition.x;
        return deltaX >= 0 ? new Vec3(-1, 1, 1) : new Vec3(1, 1, 1); // 根据x轴差值确定朝向
    }
}
