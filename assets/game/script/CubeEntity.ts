// import { Node, Sprite, SpriteFrame } from "cc";
// import { IVector2, Maths, Move, NodeHelper, Sets, Vector2, _config_, _gameType, _logic, _resouces, _timer, ccclass, winCenterPostion, winSize } from "../../../main/script/Main";



// const v2T = new Vector2()

// @ccclass("CubeEntity")
// export class CubeEntity extends Entity {

//     public entityType = EEntityType.Cube
//     public isPut = true
//     public isUpdateStateMackine = true
//     public isDestroy = false
//     public isMoving() { return false }

//     private cADragTip: Node = null!

//     public data: ILogicData = null!
//     private _move = new Move()

//     public animComplete: () => void = null!

//     private isResetAnim = false
//     protected curAnimCount = 0
//     protected toAnimCount = 0
//     private tipAnimEntity: TipEntity = null!

//     public isLerpAnim = false
//     public lerpPos = new Vector2()
//     private lastChildIndex = -1
//     private lerpRatio = .2

//     public get item() { return this.getCacheComponent(Item) }

//     protected onStateEnterLoad(): void {
//         super.onStateEnterLoad()
//         this.setScaleNum(_logic.scaleRatio, false)

//         this._move.init(this.node, false, 66 * 60)


//         let pos: IVector2 = null!
//         if (!this.animComplete)
//             pos = this.data.rect.center
//         else
//             pos = _logic.ten.data.datas[_logic.animIndex].rect.center
//         this.setPositionXY(pos, false)
//     }

//     protected onStateEnterRun(): void {
//         super.onStateEnterRun()
//         if (this.animComplete) {
//             this._move.setRunData(1, data => {
//                 Vector2.set(data.target, this.data.rect.center)
//                 data.speed = 3600
//             })
//             this._move.run(this.animComplete)
//         }
//         this.updateState()
//     }


//     protected onStateUpdateRun(): void {
//         super.onStateUpdateRun()
//         if (this.isLerpAnim) {
//             Vector2.lerp(v2T, this.node.position, this.lerpPos, this.lerpRatio * _timer.dtSecond)
//             this.setPositionXY(v2T, false)

//             if (Vector2.distanceSqr(v2T, this.getCurPos()) < 1) {
//                 if (this.lastChildIndex != -1)
//                     this.node.setSiblingIndex(this.lastChildIndex)
//                 this.lastChildIndex = -1
//             }
//         }
//         else
//             this._move.onUpdate()

//         if (this.isResetAnim) {
//             this.curAnimCount++
//             if (this.curAnimCount >= this.toAnimCount) {
//                 this.toAnimCount += Maths.minToMax(5, 20)
//                 this.item.setSf(Sets.random(_logic.ten.cardIndexs))
//             }
//         }
//     }

//     public updateState() {
//         switch (this.data.state) {
//             case ELogicDataState.none:
//                 this.item.setOpacity(0)
//                 break
//             case ELogicDataState.back:
//                 this.item.setOpacity(1)
//                 this.item.setVisible(false)
//                 break
//             case ELogicDataState.card:
//                 this.item.setOpacity(1)
//                 this.item.setSf(this.data.configId)
//                 this.item.setVisible(true)
//                 break
//             case ELogicDataState.cardStatic:
//                 this.item.setOpacity(.7)
//                 this.item.setSf(this.data.configId)
//                 this.item.setVisible(true)
//                 break
//         }
//         this.setDragTip(false)
//     }

//     public setDragTip(value: boolean) {
//         this.cADragTip.active = value
//     }

//     public getCurPos() {
//         return this.data.rect.center
//     }

//     public resetItemPos(lerp = true, lerpRatio = .2) {
//         this.lerpPos.set(this.getCurPos())
//         this.lerpRatio = lerpRatio
//         if (!lerp)
//             this.setPositionXY(this.lerpPos, false)
//     }

//     public getConfigId() {
//         return this.data.configId
//     }

//     public setItemPos(pos: IVector2) {
//         this.lerpPos.set(pos)
//         this.lerpRatio = .6
//         if (this.lastChildIndex == -1) {
//             this.lastChildIndex = this.node.getSiblingIndex()
//             this.node.setSiblingIndex(this.node.parent.children.length - 1)
//         }
//     }

//     protected onStateEnterExit(arg?: string): void {
//         this._move.clear()
//         this.tipAnimStop()
//         this.isLerpAnim = false
//         this.lastChildIndex = -1
//         this.setDragTip(false)
//         super.onStateEnterExit()
//     }

//     public startScaleAnim(duration: number, complete?: () => void, randomScaleX = true) {
//         if (_logic.isTenGameType)
//             _logic.ten.changeState(this.data, ELogicDataState.card)
//         this.item.scaleAnim(duration, complete, true, randomScaleX ? "random" : "x")
//     }

//     public startMoveAnim(setIndex: boolean, complete: () => void) {
//         if (setIndex)
//             this.node.setSiblingIndex(this.node.parent.children.length - 1)

//         this._move.setRunData(1, data => {
//             Vector2.set(data.target, this.data.rect.center)
//             data.speed = 600
//         })
//         this._move.run(() => {
//             if (setIndex)
//                 this.node.setSiblingIndex(0)

//             complete()
//         })
//     }

//     public playResetAnim() {
//         this.curAnimCount = 0
//         this.toAnimCount = 0
//         this.isResetAnim = true
//     }

//     public stopResetAnim() {
//         this.curAnimCount = 0
//         this.toAnimCount = 0
//         this.isResetAnim = false

//         this.item.setSf(this.data.configId)
//     }

//     public remove(isLeft: boolean, complete?: () => void) {
//         let entity = this.entityMgr.createCubeAnim()
//         entity.startAnim(
//             this.data.configId,
//             this.node.position,
//             isLeft,
//             complete
//         )
//     }


//     public tipAnim() {
//         this.tipAnimEntity = this.scene.entityMgr.createTip(this)
//     }

//     public tipAnimStop() {
//         if (this.tipAnimEntity) {
//             this.scene.entityMgr.remove(this.tipAnimEntity)
//             this.tipAnimEntity = null!
//         }

//     }


// }