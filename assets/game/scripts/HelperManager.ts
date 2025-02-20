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
    public checkTips(): {from: {x: number, y: number}, to: {x: number, y: number}, type: number, requestNum: number} | null {
        // 首先检查是否有可以直接消除的位置
        for (let y = 0; y < this._gameBoard.boardParams.rows; y++) {
            for (let x = 0; x < this._gameBoard.boardParams.columns; x++) {
                const currentGem = this._gameBoard.gems[y][x];
                if (currentGem === 0) continue;
    
                const moveResult = [{
                    from: {x: x, y: y},
                    to: {x: x, y: y}
                }];
    
                // 检查当前位置是否可以直接消除
                if (this._gameBoard.checkPushWillMatch(moveResult) === 1) {
                    return {
                        from: {x: x, y: y},
                        to: {x: x, y: y},
                        type: currentGem,
                        requestNum: 1
                    };
                }
            }
        }
        
        let result = this.checkMoveMatch();
        if (!result) {
         //   console.log("没有可以直接消除的！")
            result = this.checkMoveMatch(2);
        }
        if (!result) {
          //  console.log("没有可以相邻消除的！")
        }
        return result;
    } 
    /**
     * 
     * @param requestNum 1 是要求三消 2是要求相邻
     * @returns 
     */
 private checkMoveMatch(requestNum: number = 1) {
    this._gameBoard.printBoard()
    // 遍历每个非空宝石
  for (let y = 0; y < this._gameBoard.boardParams.rows; y++) {
      for (let x = 0; x < this._gameBoard.boardParams.columns; x++) {
          const currentGem = this._gameBoard.gems[y][x];
          if (currentGem === 0) continue;
  
      //    console.log(`\n检查位置 (${x},${y}) 的宝石 ${currentGem}`);
  
          const directions = [
              {dx: 1, dy: 0},   // 右
              {dx: -1, dy: 0},  // 左
              {dx: 0, dy: -1},  // 下
              {dx: 0, dy: 1}    // 上
          ];
  
          for (const direction of directions) {
            //  console.log(`\n尝试方向: dx=${direction.dx}, dy=${direction.dy}`);
              
              const pushableGems = this._gameBoard.getConsecutivePushableGems(
                  {x, y},
                  direction
              );
  
              if (pushableGems.length === 0) {
               //   console.log('没有可推动的宝石');
                  continue;
              }
              
          //    console.log('可推动的宝石:', pushableGems);
              
              const emptySlots = this._gameBoard.countEmptySlots(pushableGems, direction);
           //   console.log('空位数量:', emptySlots);
              
              for (let slots = 1; slots <= emptySlots; slots++) {
                //  console.log(`\n尝试移动 ${slots} 格`);
                  
                  const moveResult = [];
                  
                  for (let i = 0; i < pushableGems.length; i++) {
                      const gem = pushableGems[i];
                      const targetPos = {
                          x: gem.x + direction.dx * slots,
                          y: gem.y - direction.dy * slots
                      };
  
                      moveResult.push({
                          from: { x: gem.x, y: gem.y },
                          to: targetPos,
                      });
                  }

                  const matchResult = this._gameBoard.checkPushWillMatch(moveResult);
                  if (matchResult == requestNum) {
                      const result = {
                          from: { x, y },
                          to: { 
                              x: x + direction.dx * slots,
                              y: y - direction.dy * slots
                          },
                          requestNum: requestNum,
                          type: currentGem
                      };
                      return result;
                  }
              }
          }
      }
  }
    return null;
 }
  
    
       
       

public showTips(): Boolean {
    if (this.fingerNode.active || this.fingerNode2.active) {
        console.log("Tips are already being shown.");
        return false;
    }
    let result = this.checkTips();

    if (result) {
       // console.log("showTips", result);
        this.setPositionAndAnimate(result.from, result.to);
        return true;
    }
    return false;
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
public showClickHint(x: number, y: number) {
    const position = {x, y};
    this.setPositionAndAnimate(position, position);
}
public hideClickHint() {
    this.hideTips();
}





    start() {

    }

    update(deltaTime: number) {
        
    }
}

