import { _decorator, Component, dragonBones, instantiate, Node, tween, Tween, UITransform, Vec3 } from 'cc';
import { GameBoard } from '../script/Test';
const { ccclass, property } = _decorator;

@ccclass('HelperManager')
export class HelperManager extends Component {
    private _gameBoard: GameBoard = null;

    @property(Node)
    private fingerNode: Node = null;

    @property(Node)
    private fingerNode2: Node = null;

    @property(Node)
    private particleNode: Node = null;

    // 添加成员变量来存储宝石副本
    private gemCopies: Node[] = [];

    public init(gameBoard: GameBoard) {
        this._gameBoard = gameBoard;
        this.fingerNode.active = false;
    }
    public checkTips(): {from: {x: number, y: number}, to: {x: number, y: number}} | null {
        // 检查水平方向的直接消除
        for (let y = 0; y < this._gameBoard.boardParams.rows; y++) {
            let sameTypes: number[] = [];
            let positions: number[] = [];
            
            // 收集非空格的宝石（水平方向）
            for (let x = 0; x < this._gameBoard.boardParams.columns; x++) {
                const gemType = this._gameBoard.gems[y][x];
                if (gemType !== 0) {
                    sameTypes.push(gemType);
                    positions.push(x);
                }
            }
            
            // 检查是否有三个相同的
            for (let i = 0; i < sameTypes.length - 2; i++) {
                if (sameTypes[i] === sameTypes[i + 1] && sameTypes[i] === sameTypes[i + 2]) {
                    // 返回中间位置用于点击
                    return {
                        from: {x: positions[i + 1], y: y},
                        to: {x: positions[i + 1], y: y}
                    };
                }
            }
        }
    
        // 检查垂直方向的直接消除
        for (let x = 0; x < this._gameBoard.boardParams.columns; x++) {
            let sameTypes: number[] = [];
            let positions: number[] = [];
            
            // 收集非空格的宝石（垂直方向）
            for (let y = 0; y < this._gameBoard.boardParams.rows; y++) {
                const gemType = this._gameBoard.gems[y][x];
                if (gemType !== 0) {
                    sameTypes.push(gemType);
                    positions.push(y);
                }
            }
            
            // 检查是否有三个相同的
            for (let i = 0; i < sameTypes.length - 2; i++) {
                if (sameTypes[i] === sameTypes[i + 1] && sameTypes[i] === sameTypes[i + 2]) {
                    // 返回中间位置用于点击
                    return {
                        from: {x: x, y: positions[i + 1]},
                        to: {x: x, y: positions[i + 1]}
                    };
                }
            }
        }
    
        // 检查水平方向的推动
        for (let y = 0; y < this._gameBoard.boardParams.rows; y++) {
            for (let x = 0; x < this._gameBoard.boardParams.columns; x++) {
                const currentGem = this._gameBoard.gems[y][x];
                if (currentGem === 0) continue;
    
                // 检查向右推动的可能性
                if (x < this._gameBoard.boardParams.columns - 1) {
                    // 收集右边所有空格的位置
                    let emptyPositions: number[] = [];
                    let consecutiveEmptyCount = 0;
                    for (let checkX = x + 1; checkX < this._gameBoard.boardParams.columns; checkX++) {
                        if (this._gameBoard.gems[y][checkX] === 0) {
                            consecutiveEmptyCount++;
                            emptyPositions.push(checkX);
                        } else {
                            break;  // 遇到非空格就停止
                        }
                    }
    
                    // 尝试推到每一个空格位置
                    for (let i = 0; i < emptyPositions.length; i++) {
                        const targetX = emptyPositions[i];
                        // 计算这次推动需要多少个空格
                        const gemsBeforeTarget = targetX - x - 1; // 目标位置到当前宝石之间的宝石数
                        const requiredEmptySpaces = gemsBeforeTarget + 1; // 需要的空格数（包括目标位置）
                        
                        // 检查是否有足够的空格
                        if (consecutiveEmptyCount >= requiredEmptySpaces) {
                            const moveResult = [{
                                from: {x: x, y: y},
                                to: {x: targetX, y: y}
                            }];
    
                            if (this._gameBoard.checkPushWillMatch(moveResult) === 1) {
                                return {
                                    from: {x: x, y: y},
                                    to: {x: targetX, y: y}
                                };
                            }
                        }
                    }
                }
    
                // 检查向左推动的可能性
                if (x > 0) {
                    // 收集左边所有空格的位置
                    let emptyPositions: number[] = [];
                    let consecutiveEmptyCount = 0;
                    for (let checkX = x - 1; checkX >= 0; checkX--) {
                        if (this._gameBoard.gems[y][checkX] === 0) {
                            consecutiveEmptyCount++;
                            emptyPositions.push(checkX);
                        } else {
                            break;  // 遇到非空格就停止
                        }
                    }
    
                    // 尝试推到每一个空格位置
                    for (let i = 0; i < emptyPositions.length; i++) {
                        const targetX = emptyPositions[i];
                        // 计算这次推动需要多少个空格
                        const gemsBeforeTarget = x - targetX - 1; // 目标位置到当前宝石之间的宝石数
                        const requiredEmptySpaces = gemsBeforeTarget + 1; // 需要的空格数（包括目标位置）
                        
                        // 检查是否有足够的空格
                        if (consecutiveEmptyCount >= requiredEmptySpaces) {
                            const moveResult = [{
                                from: {x: x, y: y},
                                to: {x: targetX, y: y}
                            }];
    
                            if (this._gameBoard.checkPushWillMatch(moveResult) === 1) {
                                return {
                                    from: {x: x, y: y},
                                    to: {x: targetX, y: y}
                                };
                            }
                        }
                    }
                }
            }
        }
    
        // 检查垂直方向的推动
        for (let y = 0; y < this._gameBoard.boardParams.rows; y++) {
            for (let x = 0; x < this._gameBoard.boardParams.columns; x++) {
                const currentGem = this._gameBoard.gems[y][x];
                if (currentGem === 0) continue;
    
                // 检查向上推动的可能性
                if (y > 0) {
                    // 收集上方所有空格的位置
                    let emptyPositions: number[] = [];
                    let consecutiveEmptyCount = 0;
                    for (let checkY = y - 1; checkY >= 0; checkY--) {
                        if (this._gameBoard.gems[checkY][x] === 0) {
                            consecutiveEmptyCount++;
                            emptyPositions.push(checkY);
                        } else {
                            break;  // 遇到非空格就停止
                        }
                    }
    
                    // 尝试推到每一个空格位置
                    for (let i = 0; i < emptyPositions.length; i++) {
                        const targetY = emptyPositions[i];
                        // 计算这次推动需要多少个空格
                        const gemsAboveTarget = y - targetY - 1; // 目标位置到当前宝石之间的宝石数
                        const requiredEmptySpaces = gemsAboveTarget + 1; // 需要的空格数（包括目标位置）
                        
                        // 检查是否有足够的空格
                        if (consecutiveEmptyCount >= requiredEmptySpaces) {
                            const moveResult = [{
                                from: {x: x, y: y},
                                to: {x: x, y: targetY}
                            }];
    
                            if (this._gameBoard.checkPushWillMatch(moveResult) === 1) {
                                return {
                                    from: {x: x, y: y},
                                    to: {x: x, y: targetY}
                                };
                            }
                        }
                    }
                }
    
                // 检查向下推动的可能性
                if (y < this._gameBoard.boardParams.rows - 1) {
                    // 收集下方所有空格的位置
                    let emptyPositions: number[] = [];
                    let consecutiveEmptyCount = 0;
                    for (let checkY = y + 1; checkY < this._gameBoard.boardParams.rows; checkY++) {
                        if (this._gameBoard.gems[checkY][x] === 0) {
                            consecutiveEmptyCount++;
                            emptyPositions.push(checkY);
                        } else {
                            break;  // 遇到非空格就停止
                        }
                    }
    
                    // 尝试推到每一个空格位置
                    for (let i = 0; i < emptyPositions.length; i++) {
                        const targetY = emptyPositions[i];
                        // 计算这次推动需要多少个空格
                        const gemsBelowTarget = targetY - y - 1; // 目标位置到当前宝石之间的宝石数
                        const requiredEmptySpaces = gemsBelowTarget + 1; // 需要的空格数（包括目标位置）
                        
                        // 检查是否有足够的空格
                        if (consecutiveEmptyCount >= requiredEmptySpaces) {
                            const moveResult = [{
                                from: {x: x, y: y},
                                to: {x: x, y: targetY}
                            }];
    
                            if (this._gameBoard.checkPushWillMatch(moveResult) === 1) {
                                return {
                                    from: {x: x, y: y},
                                    to: {x: x, y: targetY}
                                };
                            }
                        }
                    }
                }
            }
        }
    
        return null;
    }

public showTips() {
    if (this.fingerNode.active || this.fingerNode2.active) {
        console.log("Tips are already being shown.");
        return;
    }
    let result = this.checkTips();
    if (result) {
        console.log("showTips", result);
        this.setPositionAndAnimate(result.from, result.to);
    }
}
public hideTips() {
    Tween.stopAllByTarget(this.fingerNode);
    Tween.stopAllByTarget(this.fingerNode2);
    this.fingerNode.active = false;
    this.fingerNode2.active = false;

}
public getGemNodeAtPosition(x: number, y: number): Node | null {
    if (y >= 0 && y < this._gameBoard.boardParams.rows && x >= 0 && x < this._gameBoard.boardParams.columns) {
        return this._gameBoard.board[y][x];
    }
    return null;
}
private calculatePosition(x: number, y: number): Vec3 {
    const startX = this._gameBoard._gemStartPos.x;
    const startY = this._gameBoard._gemStartPos.y;
    const gemWidth = this._gameBoard.boardParams.gemWidth;
    const gemHeight = this._gameBoard.boardParams.gemHeight;
    const spacing = this._gameBoard.boardParams.spacing;

    const localX = startX + x * (gemWidth + spacing);
    const localY = startY - y * (gemHeight + spacing);
    const localPos = new Vec3(localX, localY, 0);

    // 使用正确的父节点 UITransform
    const cubeNodeUITransform = this._gameBoard.cubeNode.getComponent(UITransform);
    if (cubeNodeUITransform) {
        return cubeNodeUITransform.convertToWorldSpaceAR(localPos);
    } else {
        console.error("UITransform component not found on cubeNode.");
        return localPos; // Fallback to local position if conversion is not possible
    }
}
public playFingerAnimation() {
    // 获取龙骨动画组件并播放动画
    const armatureDisplay = this.fingerNode.getComponent(dragonBones.ArmatureDisplay);
    if (armatureDisplay) {
        armatureDisplay.playAnimation("newAnimation", 0); // 替换 "animation_name" 为实际动画名称
    } else {
        console.error("DragonBones component not found on fingerNode.");
    }
}

public stopFingerAnimation() {
    // 获取龙骨动画组件并停止动画
    const armatureDisplay = this.fingerNode.getComponent(dragonBones.ArmatureDisplay);
    if (armatureDisplay) {
       // armatureDisplay.playAnimation("newAnimation", -1);
        armatureDisplay.armature().animation.stop('newAnimation');
    } else {
        console.error("DragonBones component not found on fingerNode.");
    }
}
private getPathGemPositions(from: {x: number, y: number}, to: {x: number, y: number}): {x: number, y: number}[] {
    const positions: {x: number, y: number}[] = [];
    
    // 如果是同一位置，直接返回该位置
    if (from.x === to.x && from.y === to.y) {
        return [from];
    }

    // 确定移动方向
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // 水平移动
    if (dy === 0) {
        const step = dx > 0 ? 1 : -1;
        for (let x = from.x; step > 0 ? x <= to.x : x >= to.x; x += step) {
            positions.push({x, y: from.y});
        }
    }
    // 垂直移动
    else if (dx === 0) {
        const step = dy > 0 ? 1 : -1;
        for (let y = from.y; step > 0 ? y <= to.y : y >= to.y; y += step) {
            positions.push({x: from.x, y});
        }
    }
    
    return positions;
}

private setPositionAndAnimate(from: {x: number, y: number}, to: {x: number, y: number}) {
    this.fingerNode.active = true;
    const cubeNodeUITransform = this._gameBoard.cubeNode.getComponent(UITransform);
    const canvasUITransform = this.node.getComponent(UITransform);

    // 计算起始和结束位置的世界坐标
    let fromPosWorld = this.calculatePosition(from.x, from.y);
    let toPosWorld = this.calculatePosition(to.x, to.y);

    // 将世界坐标转换为 canvas 的局部坐标
    let fromPosCanvas = canvasUITransform.convertToNodeSpaceAR(fromPosWorld);
    let toPosCanvas = canvasUITransform.convertToNodeSpaceAR(toPosWorld);
    fromPosCanvas.y = fromPosCanvas.y - this._gameBoard.boardParams.gemHeight / 2;
    toPosCanvas.y = toPosCanvas.y - this._gameBoard.boardParams.gemHeight / 2;

    // 获取路径上的所有位置
    const pathPositions = this.getPathGemPositions(from, to);
    const gemCopies: Node[] = [];

    if (from.x == to.x && from.y == to.y) {
        // 如果起始和结束位置相同，只设置位置
        this.playFingerAnimation();
        this.fingerNode.setPosition(fromPosCanvas);
    } else {
        this.fingerNode.active = false;
        Tween.stopAllByTarget(this.fingerNode);
        this.stopFingerAnimation();
        this.fingerNode2.active = true;
        this.fingerNode2.setPosition(fromPosCanvas);
        // 手指的动画
        tween(this.fingerNode2)
            .sequence(
                tween().to(1, { position: toPosCanvas }),
                tween().call(() => {
                    // 隐藏手指
                    this.fingerNode2.active = false;
                }),
                tween().delay(0.3), // 短暂延迟
                tween().call(() => {
                    // 重置位置并显示
                    this.fingerNode2.setPosition(fromPosCanvas);
                    this.fingerNode2.active = true;
                })
            )
            .repeatForever()
            .start();
    }
}





    start() {

    }

    update(deltaTime: number) {
        
    }
}

