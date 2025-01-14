// import { Component, Node, Asset } from 'cc';
// import { BaseComponent } from "../../core/base/scripts/BaseComponent";

// interface BaseEntityMgr<T, U> {
//     // Entity manager interface
// }

// interface BaseScene {
//     // Base scene interface
// }

// interface Collider2DEditorCC {
//     // Collider interface
// }

// interface CreatePrefabToEditorOnceCC {
//     node: Node;
//     prefabItemByUuid: string;
// }

// interface StateMackine<T> {
//     // State machine interface
// }

// // Required enums
// enum EEntityState {
//     Load,
//     Run,
//     Reset,
//     Over,
//     Exit
// }

// // Type definitions
// type TResoucesUrl<T> = string;

// /**
//  * Base entity class for game objects
//  */
// abstract class BaseEntity extends BaseComponent {
//     backupDescribe: string = "实体组件";
//     CLOSE_ON_CC: boolean = true;
//     abstract entityType: number;
//     abstract isPut: boolean;
//     abstract isUpdateStateMackine: boolean | (() => boolean);
//     abstract isDestroy: boolean;
//     abstract isMoving(): boolean;

//     // Update flags
//     updateStateMachineHead: boolean = false;
//     lateUpdateState: boolean = false;
    
//     // Resource loading flags
//     isPreLoadResouces: boolean = false;
//     isLoadResouces: boolean = true;
//     isLoadResoucesOnce: boolean = true;

//     // Optional collider getter
//     getCollider2DEditorCC2?(): Collider2DEditorCC;

//     // Entity management
//     entityMgr: BaseEntityMgr<BaseScene, BaseEntity>;
//     private orginCreatePrefabDelayPositon: any = null;
//     url: string = "";
//     entityID: number = 0;
//     entityStateMackine: StateMackine<EEntityState>;

//     // State machine methods
//     protected onStateEnterLoad(): void {
//         const node = this.getDelayVisibleNode();
//         if (node) {
//             this.orginCreatePrefabDelayPositon = { x: node.position.x, y: node.position.y };
//             node.position.set(5000, 5000);
//         }
//         this.isLoadResoucesOnce = true;
//     }

//     protected onStateEnterRun(): void {}
//     protected onStateUpdateRun(): void {}
//     protected onStateEnterReset(): void {}
//     protected onStateUpdateReset(): void {}
    
//     protected onStateEnterOver(isWin: boolean): void {
//         this.unscheduleAllCallbacks();
//     }
    
//     protected onStateUpdateOver(): void {}
    
//     protected onStateEnterExit(): void {
//         this.unscheduleAllCallbacks();
//     }

//     // Resource loading methods
//     loadResouces(cb: () => void): void {
//         if (typeof cb != "function") cb = null;
        
//         if (this.onLoadResouces) this.onLoadResouces();

//         const fn = () => {
//             const _fn = () => {
//                 if (this.onLoadResoucesComplete) this.onLoadResoucesComplete();
                
//                 const node = this.getDelayVisibleNode();
//                 if (node) {
//                     this.scheduleOnce(() => {
//                         node.position.set(
//                             this.orginCreatePrefabDelayPositon.x,
//                             this.orginCreatePrefabDelayPositon.y
//                         );
//                     });
//                 }
                
//                 if (cb) cb();
//                 this.isLoadResoucesOnce = false;
//             };

//             if (this.loadOtherResouces) {
//                 // Load other resources implementation needed
//                 this.loadOtherResouces().forEach(url => {
//                     // Resource loading logic
//                 });
//                 _fn();
//             } else {
//                 _fn();
//             }
//         };

//         const cb2 = () => {
//             const url = this.getResoucesUrl();
//             if (url) {
//                 this.loadResoucesByComp(url, fn);
//             } else {
//                 fn();
//             }
//         };

//         if (this.preLoadBundles) {
//             // Bundle loading implementation needed
//             this.preLoadBundles().forEach(bundle => {
//                 // Bundle loading logic
//             });
//             cb2();
//         } else {
//             cb2();
//         }
//     }

//     protected loadResoucesByComp(url: string, complete: () => void): void {
//         // Implementation needed based on component type
//     }

//     protected setSpriteLoaderCCUrl(url: string, complete: () => void): void {
//         // Sprite loading implementation needed
//     }

//     protected getResoucesUrl(): string {
//         if (!this.isLoadResouces) return null;
//         // Resource URL getting implementation needed
//         return "";
//     }

//     protected getDelayVisibleNode(): Node {
//         if (!this.isLoadResouces) return null;
//         // Node getting implementation needed
//         return null;
//     }

//     protected getCreatePrefabToEditorOnceCC(): CreatePrefabToEditorOnceCC {
//         return null;
//     }

//     // Optional lifecycle hooks
//     onLoadResouces?(): void;
//     onLoadResoucesComplete?(): void;
//     loadOtherResouces?(): TResoucesUrl<Asset>[];
//     preLoadBundles?(): string[];
//     onShapeClick?(): void;
//     onShapeClick2?(): void;

//     private unscheduleAllCallbacks(): void {
//         // Implementation needed for unscheduling callbacks
//     }

//     private scheduleOnce(callback: () => void): void {
//         // Implementation needed for scheduling one-time callbacks
//     }
// }

// export { BaseEntity, EEntityState };