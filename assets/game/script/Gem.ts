import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, UITransform, EventTouch, Vec2, tween, Label, UIOpacity, Size } from 'cc';
import { Vector2 } from './Vector2';
import { IGemData } from '../../core/scripts/define/Types';
import { GameBoard } from './Test';

const { ccclass, property } = _decorator;



@ccclass('Gem')
export class Gem extends Component {
   

    // 世界坐标
    private targetX: number = 0;
    private targetY: number = 0;
    private _isLoaded: boolean = false;
    public data: IGemData;
    

    @property([SpriteFrame])
    gemSprites: SpriteFrame[] = [];

    @property(Label)
    private posLabel: Label = null;
    
    @property(Node)
    private maskNode: Node = null;

    @property(Sprite)
    private iconSprite: Sprite = null;

    constructor(){
        super();
        this.data = {
            type: 0,
            isRemoved: false,
            gridPosition: new Vector2(-1, -1),
            worldPosition: new Vector2(0, 0),
            scaleFactorWidth: 1,
            scaleFactorHeight: 1,
            gemWidth: 0,
            gemHeight: 0
        };
    }
    init(initData: IGemData) {
        this.reset();
        this.data = initData;
        if (initData.type !== undefined) {
            this.setType(initData.type);
        }
        if (initData.gridPosition) {
            this.setGridPosition(initData.gridPosition);
            this.posLabel.string = `(${initData.gridPosition.x}, ${initData.gridPosition.y})`;
        }
        if (initData.worldPosition) {
            this.setWorldPosition(initData.worldPosition.x, initData.worldPosition.y);
        }
        // if (initData.scaleFactor) {
        //     this.setScaleNum(initData.scaleFactor, initData.scaleFactor, 1);
        // }
        if (initData.scaleFactorWidth && initData.scaleFactorHeight) {
            this.setScaleNum(initData.scaleFactorWidth, initData.scaleFactorHeight, 1);
        }
    }   
    reset() {
        this.data = {
            type: 0,
            isRemoved: false,
            gridPosition: new Vector2(-1, -1),
            worldPosition: new Vector2(0, 0),
            scaleFactorWidth: 1,
            scaleFactorHeight: 1
        };
    }
    setType(type: number) {
        this.data.type = type;
        if (this.iconSprite && this.gemSprites[type - 1]) {
            this.iconSprite.spriteFrame = this.gemSprites[type - 1];
        }
    }
    getType(): number {
        return this.data.type;
    }
    // 设置和获取移除状态
    setRemoved(removed: boolean) {
        if (!this.isValid) return;
        this.data.isRemoved = removed;
    }
    isGemRemoved(): boolean {
        return this.data.isRemoved;
    }
    setScaleNum(scaleX: number, scaleY: number, scaleZ: number) {
        this.data.scaleFactorWidth = scaleX;
        this.data.scaleFactorHeight = scaleY;
        this.node.scale = new Vec3(scaleX, scaleY, scaleZ);
    }

    // 设置和获取网格坐标
    setGridPosition(position: Vector2) {
        this.data.gridPosition = position;
    }

    getGridPosition(): Vector2 {
        return this.data.gridPosition;
    }

    // 设置和获取世界坐标
    setWorldPosition(x: number, y: number) {
        this.targetX = x;
        this.targetY = y;
      //  this.node.setPosition(new Vec3(x, y, 0));
    }

    getWorldPosition(): { x: number, y: number } {
        return { x: this.targetX, y: this.targetY };
    }
    // 获取完整的宝石数据
    public getGemData(): IGemData {
        return { ...this.data };  // 返回数据的副本
    }
    onLoad() {
        // 确保有 UITransform 组件
        if (!this.getComponent(UITransform)) {
            this.addComponent(UITransform);
        }
        
    }
    updatePosition(gridX: number, gridY: number, worldPos: Vec3) {
        // 更新网格和世界坐标
        this.data.gridPosition.x = gridX;
        this.data.gridPosition.y = gridY;
        this.data.worldPosition.x = worldPos.x;
        this.data.worldPosition.y = worldPos.y;
        // 移动到新位置
        this.node.position = worldPos;
    }
    onBeforeDestroy() {
        // 确保所有 tween 动画被停止
        tween(this.node).stop();
        
    }
    onDestroy() {
        
    }
}

