import { _decorator, Component, Vec2, Node, EventTouch, Vec3, UITransform, Rect, Graphics, Color, ParticleSystem2D, UIOpacity, instantiate, tween, Prefab } from "cc";
import { GameBoard } from '../script/Test';
import { AudioManager } from '../../common/scripts/AudioManager';
import { GameState } from "../../core/scripts/define/Enums";



const { ccclass, property } = _decorator;

@ccclass('TouchMgr')
export class TouchMgr extends Component {

    private touchStartPos: Vec2 = null;
    private touchStartTime: number = 0;
    private readonly CLICK_THRESHOLD = 200;  // 点击判定阈值（毫秒）
    private readonly MIN_SWIPE_DISTANCE = 1;    // 最小滑动距离
    private readonly MIN_MOVE_DISTANCE = 5;     // 最小移动距离
    private currentDirection: { dx: number, dy: number } = null;  // 保存现有的移动方向
    
    private moveDirection: 'horizontal' | 'vertical' | null = null;
    private isSwiping: boolean = false;
    // Remove the @property decorator and make gameBoard private
    private gameBoard: GameBoard = null;

    private targetGem: Node = null;
    private targetGridPosition: { x: number, y: number } = null; 

    private particleNode: Node = null;

    private dragNode: Node = null;
    private dragStartPos: Vec3 = null;
    private dragGems: Node[] = [];
    private maxEmptySlots: number = 0;
    @property(Prefab)
    gemPrefab: Prefab = null;

    // Add init function
    public init(gameBoard: GameBoard) {
        this.gameBoard = gameBoard;
        console.log('TouchMgr init', this.gameBoard);
    }
    onLoad() {
        this.dragNode = new Node('DragNode');
        this.node.addChild(this.dragNode);
        this.dragNode.active = false;
    }
    start() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.particleNode = this.node.getChildByName('particle');
        if (!this.particleNode) {
            console.error('Particle node not found in TouchNode!');
        }
        const canvasUI = this.node.parent.getComponent(UITransform);
        const touchNodeUI = this.node.getComponent(UITransform);
        touchNodeUI.setContentSize(canvasUI.width, canvasUI.height);
    }

    private onTouchStart(event: EventTouch) {
        if ((this.gameBoard.currentState != GameState.Idle) && (this.gameBoard.currentState != GameState.Exchanging)) {
            console.log('游戏状态不为Idle或Exchanging，提前返回');
            return;
        }
    
        console.log('onTouchStart');
        this.touchStartPos = event.getLocation();
        this.touchStartTime = Date.now();
        const result = this.processTouch(event);
        console.log('result', result);
        
        // 重置移动方向
        this.moveDirection = null;
        this.isSwiping = false;  // 默认设置为 false
        
        if (!result) {
            return;  // 如果没有触摸到宝石，直接返回
        }
    
        console.log('触摸结果:', result);
        this.targetGem = result.item;
        this.targetGridPosition = { x: result.x, y: result.y };
        console.log('点击的目标宝石:', this.targetGem, '网格位置:', this.targetGridPosition);
        
        // 只在非交换道具模式下检查三消
        if (this.gameBoard.currentState === GameState.Idle) {
            const gemType = this.gameBoard.gems[result.y][result.x];
            const matchGroup = this.gameBoard.findMatchGroupAtPosition(result.x, result.y, gemType);
            
            console.log('匹配组:', matchGroup);
            if (matchGroup.length >= 3) {
                console.log('找到可消除的组合');
                this.isSwiping = false;  // 设置为 false 以允许点击消除
            }
        }
    }
    processTouch(event: EventTouch) {
        const centerNode = this.node.parent;
        const cube = centerNode .getChildByName('Cube');
        
        // 获取 UI 坐标
        const uiLocation = event.getUILocation();
        
        if (this.particleNode) {
            const touchNodeUI = this.node.getComponent(UITransform);
            const localPos = touchNodeUI.convertToNodeSpaceAR(new Vec3(uiLocation.x, uiLocation.y, 0));
            
            this.particleNode.setPosition(localPos);
            
            console.log('UI Location:', uiLocation);
            console.log('Local Position:', localPos);
            
            const particleSystem = this.particleNode.getComponent(ParticleSystem2D);
            if (particleSystem) {
                particleSystem.resetSystem();
            }
        }
    
        // 使用相同的坐标转换逻辑处理宝石触摸检测
        const cubeUI = cube.getComponent(UITransform);
        const cubeLocalPos = cubeUI.convertToNodeSpaceAR(new Vec3(uiLocation.x, uiLocation.y, 0));
        return this.findTouchedItem(cubeLocalPos, cube);
    }

    findTouchedItem(touchPos, cube) {
        const items = this.gameBoard.board;
        const gemWidth = this.gameBoard.boardParams.gemWidth;
        const gemHeight = this.gameBoard.boardParams.gemHeight;
        
        // 创建调试节点
        // const debugNode = new Node('DebugNode');
        // cube.addChild(debugNode);
        // const graphics = debugNode.addComponent(Graphics);
        
        // 设置最高层级
        // debugNode.setSiblingIndex(999);
        // const uiTransform = debugNode.addComponent(UITransform);
        // uiTransform.priority = 999;
        
        // 设置调试节点的大小为整个画布大小
      //  uiTransform.setContentSize(2000, 2000);  // 使用足够大的尺寸
        
        // 绘制触摸点
        // graphics.strokeColor = Color.BLUE;
        // graphics.fillColor = Color.BLUE;
        // graphics.circle(touchPos.x, touchPos.y, 5);
        // graphics.fill();  // 使用fill而不是stroke使点更明显
        // graphics.stroke();

        for (let y = 0; y < items.length; y++) {
            for (let x = 0; x < items[y].length; x++) {
                const item = items[y][x];
                if (!item) continue;
                
                const itemPos = item.position;
                
                // 计算宝石的边界框
                const bounds = new Rect(
                    itemPos.x - gemWidth / 2,
                    itemPos.y - gemHeight / 2,
                    gemWidth,
                    gemHeight
                );
                
                // // 绘制边界框
                // graphics.strokeColor = Color.GREEN;
                // graphics.lineWidth = 3;  // 加粗线条使其更容易看见
                // graphics.rect(bounds.x, bounds.y, bounds.width, bounds.height);
                // graphics.stroke();
                
                // 添加坐标文本标记（可选）
                // console.log(`Gem [${x},${y}]:`, {
                //     position: itemPos,
                //     bounds: bounds,
                //     touchPos: touchPos
                // });

                if (bounds.contains(touchPos)) {
                    // graphics.strokeColor = Color.RED;
                    // graphics.lineWidth = 4;
                    // graphics.rect(bounds.x, bounds.y, bounds.width, bounds.height);
                    // graphics.stroke();
                    
                    console.log(`Hit gem at [${x}, ${y}]`);
                    return { x, y, item };
                }
            }
        }
        
        // setTimeout(() => {
        //     debugNode.removeFromParent();
        // }, 5000);
        
        return null;
    }
    

    private onTouchMove(event: EventTouch) {
         // 如果在交换道具模式下，不处理移动
         if (this.gameBoard.currentState === GameState.Exchanging) {
            return;
        }
    
        // 如果已经在拖动中，直接更新位置
        if (this.dragNode.active) {
            this.updateDragPosition(event);
            return;
        }
    
        // 否则检查是否可以开始拖动
        if (!this.touchStartPos || !this.targetGem || 
            this.gameBoard.currentState != GameState.Idle) {
            console.log('[TouchMove] 提前返回');
            return;
        }
    
        const currentPos = event.getLocation();
        const deltaX = currentPos.x - this.touchStartPos.x;
        const deltaY = currentPos.y - this.touchStartPos.y;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
    
        if (absX < this.MIN_MOVE_DISTANCE && absY < this.MIN_MOVE_DISTANCE) {
            console.log('Movement too small, ignoring');
            return;
        }
            
        // 首次确定移动方向时
        if (!this.moveDirection && (absX > this.MIN_SWIPE_DISTANCE || absY > this.MIN_SWIPE_DISTANCE)) {
            this.moveDirection = absX > absY ? 'horizontal' : 'vertical';
            
            const direction = {
                dx: this.moveDirection === 'horizontal' ? Math.sign(deltaX) : 0,
                dy: this.moveDirection === 'vertical' ? Math.sign(deltaY) : 0
            };
            // 设置当前方向
            this.currentDirection = {
                dx: this.moveDirection === 'horizontal' ? Math.sign(deltaX) : 0,
                dy: this.moveDirection === 'vertical' ? Math.sign(deltaY) : 0
            };
    
            if (this.gameBoard.canPushInDirection(this.targetGridPosition, direction)) {
                const pushableGems = this.gameBoard.getConsecutivePushableGems(
                    this.targetGridPosition,
                    direction
                );
                // 打印可推动宝石信息
                console.log('Pushable Gems:', {
                    count: pushableGems.length,
                    gems: pushableGems
                });
    
                if (pushableGems.length > 0) {
                    this.isSwiping = true;
                    this.initializeDragGems(pushableGems, direction);
                    this.updateDragPosition(event);
                    console.log('Started dragging gems');
                }
            } else {
                console.log('Cannot push in this direction');
            }
        } else if (this.dragNode.active) {
            this.updateDragPosition(event);
        }
    }
    private initializeDragGems(pushableGems: { x: number, y: number }[], direction: { dx: number, dy: number }) {
        this.dragNode.removeAllChildren();
        this.dragGems = [];
    
        // 使用实际触摸的宝石位置，而不是数组中的第一个
        const touchedGemPos = this.targetGridPosition; // 使用实际触摸的位置
        const touchedGem = this.gameBoard.board[touchedGemPos.y][touchedGemPos.x];
        console.log('touchedGem', touchedGem, touchedGemPos);
        this.maxEmptySlots = this.gameBoard.countEmptySlots(pushableGems, direction);
        console.log('this.maxEmptySlots', this.maxEmptySlots);
        // 设置 dragNode 的初始位置为实际触摸的宝石位置
        const worldPos = new Vec3();
        touchedGem.getWorldPosition(worldPos);
        const localPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
        this.dragStartPos = localPos.clone();
        this.dragNode.setPosition(this.dragStartPos);
        this.dragNode.active = true;
        
        console.log('pushableGems', pushableGems);
        // 创建拖动宝石，注意相对位置的计算也要基于触摸点
        pushableGems.forEach(pos => {
            const originalGem = this.gameBoard.board[pos.y][pos.x];
            const dragGem = instantiate(originalGem);
            
            // 计算相对于触摸宝石的偏移
            const offsetX = (pos.x - touchedGemPos.x) * (this.gameBoard.boardParams.gemWidth + this.gameBoard.boardParams.spacing);
            const offsetY = (touchedGemPos.y - pos.y) * (this.gameBoard.boardParams.gemHeight + this.gameBoard.boardParams.spacing);
        
            console.log('offsetY', offsetY, direction.dy);
            dragGem.setPosition(new Vec3(offsetX, offsetY, 0));
            
            const opacity = dragGem.getComponent(UIOpacity) || dragGem.addComponent(UIOpacity);
            opacity.opacity = 180;
            
            const originalOpacity = originalGem.getComponent(UIOpacity) || originalGem.addComponent(UIOpacity);
            originalOpacity.opacity = 0;
            
            this.dragNode.addChild(dragGem);
            this.dragGems.push(originalGem);
        });
    }
    
    private updateDragPosition(event: EventTouch) {
        if (!this.dragNode.active || !this.moveDirection || !this.currentDirection) return;

        // Use getUIDelta to get the change in position
        const delta = event.getUIDelta();
        
        // Calculate the movement based on the direction
        const movement = this.moveDirection === 'horizontal' ? delta.x : delta.y;

        // Calculate the final position
        const finalPos = this.dragNode.position.clone();
        const cellSize = this.moveDirection === 'horizontal' ? 
            this.gameBoard.boardParams.gemWidth + this.gameBoard.boardParams.spacing :
            this.gameBoard.boardParams.gemHeight + this.gameBoard.boardParams.spacing;

        const maxDistance = this.maxEmptySlots * cellSize;

        // Limit the movement based on the initial direction
        if (this.moveDirection === 'horizontal') {
            finalPos.x += movement;
            if (this.currentDirection.dx > 0) {
                finalPos.x = Math.min(finalPos.x, this.dragStartPos.x + maxDistance);
                finalPos.x = Math.max(finalPos.x, this.dragStartPos.x); // Ensure it doesn't go backwards
            } else {
                finalPos.x = Math.max(finalPos.x, this.dragStartPos.x - maxDistance);
                finalPos.x = Math.min(finalPos.x, this.dragStartPos.x); // Ensure it doesn't go forwards
            }
        } else {
            finalPos.y += movement;
            if (this.currentDirection.dy > 0) {
                finalPos.y = Math.min(finalPos.y, this.dragStartPos.y + maxDistance);
                finalPos.y = Math.max(finalPos.y, this.dragStartPos.y); // Ensure it doesn't go backwards
            } else {
                finalPos.y = Math.max(finalPos.y, this.dragStartPos.y - maxDistance);
                finalPos.y = Math.min(finalPos.y, this.dragStartPos.y); // Ensure it doesn't go forwards
            }
        }

        this.dragNode.setPosition(finalPos);
    }



    private async onTouchEnd(event: EventTouch) {
        console.log('=== Touch End ===');
        if (!this.touchStartPos || !this.targetGem) {
            console.log('No valid touch start or target gem');
            return;
        }
        // 如果在交换道具模式下，只处理点击事件
        if (this.gameBoard.currentState === GameState.Exchanging) {
            console.log('====处理交换道具点击事件=====');
            this.gameBoard.onGemClicked({ 
                target: this.targetGem,
                gridPosition: this.targetGridPosition
            });
            this.resetTouchState();
            return;
        }
        if (this.dragNode.active) {
            // 计算移动了多少格
            const currentPos = this.dragNode.position;
            const cellSize = this.moveDirection === 'horizontal' ? 
                this.gameBoard.boardParams.gemWidth + this.gameBoard.boardParams.spacing :
                this.gameBoard.boardParams.gemHeight + this.gameBoard.boardParams.spacing;
            
            const delta = this.moveDirection === 'horizontal' ? 
                currentPos.x - this.dragStartPos.x :
                currentPos.y - this.dragStartPos.y;
    
            try {
                // 检查是否移动了足够的距离
                if (Math.abs(delta) >= this.MIN_SWIPE_DISTANCE) {
                    const slots = Math.round(delta / cellSize);
                    const direction = {
                        dx: this.moveDirection === 'horizontal' ? Math.sign(delta) : 0,
                        dy: this.moveDirection === 'vertical' ? Math.sign(delta) : 0
                    };
                    console.log('direction', direction, "slots",slots);
                    // 获取所有要移动的宝石位置
                    const pushableGems = this.gameBoard.getConsecutivePushableGems(
                        this.targetGridPosition,
                        direction
                    );
                    
                    const targetSlots = Math.abs(slots);
                    
                    // 计算每个宝石移动后的位置
                    const moveResult = pushableGems.map(gem => ({
                        from: { x: gem.x, y: gem.y },
                        to: {
                            x: gem.x + direction.dx * targetSlots,
                            y: gem.y - direction.dy * targetSlots
                        }
                    }));
                    console.log('moveResult', moveResult);
                    console.log('移动信息:', {
                        moveResult,
                        slots: targetSlots,
                        direction
                    });
    
                    // 检查移动后是否能形成三消
                    const willMatch = this.gameBoard.checkPushWillMatch(moveResult);
                    switch (willMatch) {
                        case 0:
                            console.log('不会产生三消，返回原位');
                            await this.animateBackToStart();
                            break;
                        case 1:
                            console.log('形成三消，执行消除...');
                            // 恢复原始宝石可见性
                            this.dragGems.forEach(gem => {
                                const opacity = gem.getComponent(UIOpacity);
                                if (opacity) opacity.opacity = 255;
                            });
                            this.dragNode.active = false;
                            // 更新棋盘数据并触发消除逻辑
                        this.gameBoard.currentState = GameState.Processing;
                         // 触发消除逻辑
                          await this.gameBoard.handlePushAndMatch(moveResult, true);
                            break;
                        case 2:
                            console.log('形成两个相邻宝石，执行移动...');
                            this.gameBoard.currentState = GameState.Processing;
                            await this.gameBoard.handlePushAndMatch(moveResult, false);
                            break;
                    }
                    // if (willMatch) {
                    //     console.log('形成三消，执行消除...');
                    //     // 恢复原始宝石可见性
                    //     this.dragGems.forEach(gem => {
                    //         const opacity = gem.getComponent(UIOpacity);
                    //         if (opacity) opacity.opacity = 255;
                    //     });
                    //     this.dragNode.active = false;
    
                    //     // 更新棋盘数据并触发消除逻辑
                    //     this.gameBoard.currentState = GameState.Processing;
    
                    //     // 触发消除逻辑
                    //     await this.gameBoard.handlePushAndMatch(moveResult);
                    // } else {
                    //     console.log('不会产生三消，返回原位');
                    //     await this.animateBackToStart();
                    // }
                } else {
                    console.log('移动距离不足，返回原位');
                    await this.animateBackToStart();
                }
            } catch (error) {
                console.error('处理拖动结束时发生错误:', error);
                await this.animateBackToStart();
            } finally {
                // 确保在所有情况下都恢复宝石可见性
                // 确保在所有情况下都安全地恢复宝石可见性
                this.dragGems.forEach(gem => {
                    if (gem.isValid) {  // 检查节点是否仍然有效
                        const opacity = gem.getComponent(UIOpacity);
                        if (opacity) opacity.opacity = 255;
                    }
                });
                this.dragNode.active = false;
                this.gameBoard.currentState = GameState.Idle;
            }
        } else {
            // 处理点击事件
            console.log('处理点击事件');
            if (!this.isSwiping) {
                this.gameBoard.onGemClicked({ 
                    target: this.targetGem,
                    gridPosition: this.targetGridPosition
                });
            }
        }
    
        // 重置状态
        this.resetTouchState();
    }
    

        // 添加新的辅助方法
    private animateBackToStart(): Promise<void> {
        AudioManager.instance.playSoundEffect('foodBack');
        return new Promise((resolve) => {
            tween(this.dragNode)
                .to(0.2, { position: this.dragStartPos })
                .call(() => resolve())
                .start();
        });
    }

    private resetTouchState() {
        this.touchStartPos = null;
        this.targetGem = null;
        this.moveDirection = null;
        this.currentDirection = null;  // 添加这行
        this.isSwiping = false;
        this.dragNode.active = false;
        this.dragNode.removeAllChildren();
        this.dragGems = [];
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
}