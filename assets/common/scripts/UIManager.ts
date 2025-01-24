import { _decorator, Component, Node, instantiate, tween, Vec3, AssetManager, resources, error, assetManager, UIOpacity, director } from 'cc';
import { UILoadConfig } from '../../core/scripts/define/Types';
import { GameBoard } from '../../game/script/Test';
const { ccclass, property } = _decorator;



@ccclass('UIManager')
export class UIManager extends Component {
    private static _instance: UIManager = null;
    private _uiRoot: Node = null;
    private _uiMap: Map<string, Node> = new Map();
    private _bundleMap: Map<string, AssetManager.Bundle> = new Map();

    public static get instance(): UIManager {
        return UIManager._instance;
    }

    onLoad() {
      //  console.error("UIManager onLoad called");
        if (UIManager._instance === null) {
            UIManager._instance = this;
        } else {
            console.warn("UIManager instance already exists!");
            return; // 不更新为新的实例，直接返回
        }
        this._uiMap = new Map(); 
        this._uiRoot = this.node;
    }
    onDestroy() {
        if (UIManager._instance === this) {
            UIManager._instance = null;
        }
    }

    /**
     * 打开UI
     * @param config UI加载配置
     * @param callback 加载完成回调
     * @param animType 动画类型 (1:缩放 2:淡入)
     * @example
     * // 从默认resources加载
     * openUI({ bundle: 'resources', path: 'prefabs/UI/LoginPanel' })
     * // 从其他bundle加载
     * openUI({ bundle: 'uiBundle', path: 'prefabs/LoginPanel' })
     */
    public async openUI(config: UILoadConfig, callback?: Function, animType: number = 1) {
        
        const uiName = config.name;
      //  console.log(this._uiMap, "this._uiMap", this._uiRoot, "this._uiRoot", this._bundleMap, "this._bundleMap");
        if (this._uiMap.has(uiName)) {
            console.warn(`UI ${uiName} is already open.`);
            return;
        }
        console.log(`Opening UI: ${uiName}`);
       
        try {
            // Check if the bundle is already loaded before attempting to load the prefab
            if (!this._bundleMap.has(config.bundle)) {
                await this.loadBundle(config.bundle);
            }
        
            const prefab = await this.loadUIPrefab(config);
            if (!prefab) {
                console.error(`Failed to load prefab: ${config.bundle}/${config.path}`);
                return;
            }
        
      
            const uiNode = instantiate(prefab);
            this._uiRoot.addChild(uiNode);
            this._uiMap.set(uiName, uiNode);
            
            const content = uiNode.getChildByName('content');
            if (!content) {
                console.warn(`Content node not found in UI: ${uiName}`);
            } else {
                this.playOpenAnim(content, animType, callback);
            }
        } catch (err) {
            console.error(`加载UI失败: ${config.bundle}/${config.path}`, err);
        }
    }

    /**
     * 预加载Bundle
     * @param bundleName bundle名称
     */
    public loadBundle(bundleName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // 如果bundle已经加载过，直接返回
            if (this._bundleMap.has(bundleName)) {
                console.log(`Bundle ${bundleName} already loaded.`);
                resolve();
                return;
            }
            // 加载新的bundle
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    console.error(`加载bundle失败: ${bundleName}`, err);
                    reject(err);
                    return;
                } else {
                    console.log(`Bundle loaded successfully: ${bundleName}`);
                    this._bundleMap.set(bundleName, bundle);
                    resolve();
                }
            });
        });
    }

    /**
     * 加载UI预制体
     */
    private loadUIPrefab(config: UILoadConfig): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                // 如果是resources目录
                if (config.bundle === 'resources') {
                    resources.load(config.path, (err, prefab) => {
                        if (err) reject(err);
                        else resolve(prefab);
                    });
                    return;
                }

                // 确保bundle已加载
                if (!this._bundleMap.has(config.bundle)) {
                    await this.loadBundle(config.bundle);
                }

                // 从bundle中加载预制体
                const bundle = this._bundleMap.get(config.bundle);
                bundle.load(config.path, (err, prefab) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`Bundle loaded successfully: ${config.bundle}`);
                        resolve(prefab);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    // public closeUI(uiName: string, animType: number = 1, callback?: Function) {
    //     console.error("closeUI!!!!")
    //     const uiNode = this._uiMap.get(uiName);
       
    //     const content = uiNode.getChildByName('content');
    //     if (uiNode) {
    //         this.playCloseAnim(content, animType, () => {
    //             uiNode.destroy();
    //             this._uiMap.delete(uiName);
    //             callback?.();
    //         });
    //     }
    // }
    public closeUI(uiName: string, animType: number = 1, callback?: Function) {
        const uiNode = this._uiMap.get(uiName);
        if (!uiNode || !uiNode.isValid) {
            console.warn(`UI ${uiName} not found or already invalid`);
            return;
        }

        const content = uiNode.getChildByName('content');
        if (!content) {
            // 如果没有找到content节点，直接销毁
            uiNode.destroy();
            this._uiMap.delete(uiName);
            callback?.();
            return;
        }

        // 先从Map中移除，防止重复关闭
        this._uiMap.delete(uiName);

        // 播放关闭动画，在动画完成后再销毁节点
        this.playCloseAnim(content, animType, () => {
            if (uiNode.isValid) {
                uiNode.destroy();
            }
            callback?.();
        });
    }

    /**
     * 播放关闭动画
     */
    private playCloseAnim(uiNode: Node, animType: number, onComplete: Function) {
        switch (animType) {
            case 1: // 缩放动画
                tween(uiNode)
                    .to(0.3, { scale: new Vec3(0.1, 0.1, 1) })
                    .call(onComplete)
                    .start();
                break;
            case 2: // 淡出动画
                const uiOpacity = uiNode.getComponent(UIOpacity) || uiNode.addComponent(UIOpacity);
                tween(uiOpacity)
                    .to(0.3, { opacity: 0 })
                    .call(onComplete)
                    .start();
                break;
            default:
                onComplete();
                break;
        }
    }

    /**
     * 播放打开动画
     */
    private playOpenAnim(uiNode: Node, animType: number, onComplete?: Function) {
        switch (animType) {
            case 1: // 缩放动画
                uiNode.scale = new Vec3(0.1, 0.1, 1);
                tween(uiNode)
                    .to(0.3, { scale: new Vec3(1, 1, 1) })
                    .call(() => onComplete && onComplete()) 
                    .start();
                break;
            case 2: // 淡入动画
                const uiOpacity = uiNode.getComponent(UIOpacity) || uiNode.addComponent(UIOpacity);
                uiOpacity.opacity = 0;
                tween(uiOpacity)
                    .to(0.3, { opacity: 255 })
                    .call(() => onComplete && onComplete()) 
                    .start();
                break;
            case 3: // 从左到中心再快速往右闪并快速闪出屏幕之外
                uiNode.position = new Vec3(-100, 0, 0); // Start from left
                tween(uiNode)
                    .to(0, { position: new Vec3(-300, 0, 0) }) // Flash to right
                    .to(0.1, { position: new Vec3(0, 0, 0) }) // Flash to right
                    .delay(1) // Pause for 1 second
                    .to(0.1, { position: new Vec3(1000, 0, 0) }) // Flash out of screen
                    .call(() => onComplete && onComplete()) 
                    .start();
                break;
            default:
                onComplete?.();
                break;
        }
    }
}