// assets/core/scripts/manager/ResourceManager.ts

import { _decorator, assetManager, Asset, Prefab, Texture2D, AudioClip, SpriteFrame, resources   } from "cc";

export class ResourceManager {
    private static bundles: { [key: string]: any } = {}; // 使用 any 类型以适应不同的环境
       /**
     * 从resources文件夹加载资源
     * @param path resources文件夹下的资源路径（不需要包含'resources/'前缀）
     * @param type 资源类型
     * @param callback 回调函数
     */
       static loadFromResources<T extends Asset>(path: string, type: new () => T, callback?: (err: Error | null, asset: T | null) => void) {
        resources.load(path, type, (err, asset: T) => {
            if (err) {
                console.error(`Failed to load resource from resources folder at ${path}: ${err}`);
                if (callback) {
                    callback(err, null);
                }
                return;
            }
            if (callback) {
                callback(null, asset);
            }
        });
    }
    /**
     * 加载单个资源
     * @param path 资源路径
     * @param type 资源类型
     * @param callback 回调函数
     */
    static loadResource<T extends Asset>(path: string, type: new () => T, callback: (err: Error | null, asset: T | null) => void) {
        assetManager.loadAny({ path: path, type: type }, (err, asset: T) => {
            if (err) {
                console.error(`Failed to load resource at ${path}: ${err}`);
                callback(err, null);
                return;
            }
            callback(null, asset);
        });
    }
     /**
     * 加载精灵帧
     * @param path 精灵帧路径
     * @param callback 回调函数
     */
     static loadSpriteFrame(path: string, callback: (err: Error | null, spriteFrame: SpriteFrame | null) => void) {
        this.loadResource<SpriteFrame>(path, SpriteFrame, callback);
    }

    /**
     * 加载多个资源
     * @param paths 资源路径数组
     * @param type 资源类型
     * @param callback 回调函数
     */
    static loadResources<T extends Asset>(paths: string[], type: new () => T, callback: (err: Error | null, assets: Array<T> | null) => void) {
        assetManager.loadAny(paths.map(path => ({ path: path, type: type })), (err, assets: Array<T>) => {
            if (err) {
                console.error(`Failed to load resources: ${err}`);
                callback(err, null);
                return;
            }
            callback(null, assets);
        });
    }
    /**
     * 加载Bundle
     * @param bundleName Bundle的名称
     * @param callback 回调函数
     */
    static loadBundle(bundleName: string, callback: (err: Error | null, bundle: any | null) => void) {
        if (this.bundles[bundleName]) {
         //   console.log(`${bundleName} bundle is already loaded.`);
            callback(null, this.bundles[bundleName]);
            return;
        }

        assetManager.loadBundle(bundleName, (err, bundle) => {
            if (err) {
                console.error(`Failed to load ${bundleName} bundle:`, err);
                callback(err, null);
                return;
            }
            this.bundles[bundleName] = bundle;
        //    console.log(`${bundleName} bundle loaded successfully.`);
            callback(null, bundle);
        });
    }

    /**
     * 从Bundle加载资源
     * @param bundleName Bundle的名称
     * @param path 资源路径
     * @param type 资源类型
     * @param callback 回调函数
     */
    static loadResourceFromBundle<T extends Asset>(bundleName: string, path: string, type: new () => T, callback: (err: Error | null, asset: T | null) => void) {
        this.loadBundle(bundleName, (err, bundle) => {
            if (err) {
                console.error(`Failed to load bundle ${bundleName}:`, err);
                callback(err, null);
                return;
            }
            if (!bundle) {
                console.error(`Bundle ${bundleName} is not loaded and could not be found.`);
                callback(new Error(`Bundle ${bundleName} not loaded`), null);
                return;
            }
          //  console.log(`Bundle ${bundleName} is loaded, proceeding to load resource.`);
            bundle.load(path, type, (err, asset: T) => {
                if (err) {
                    console.error(`Failed to load resource ${path} from ${bundleName} bundle:`, err);
                    callback(err, null);
                    return;
                }
                callback(null, asset);
            });
        });
    }

    /**
     * 加载预制体
     * @param path 预制体路径
     * @param callback 回调函数
     */
    static loadPrefab(path: string, callback: (err: Error | null, prefab: Prefab | null) => void) {
        this.loadResource<Prefab>(path, Prefab, callback);
    }

    /**
     * 加载图片
     * @param path 图片路径
     * @param callback 回调函数
     */
    static loadTexture(path: string, callback: (err: Error | null, texture: Texture2D | null) => void) {
        this.loadResource<Texture2D>(path, Texture2D, callback);
    }
    // 添加一个新方法来加载SpriteFrame
    static loadSpriteFrameFromBundle(bundleName: string, path: string, callback: (err: Error | null, spriteFrame: SpriteFrame | null) => void) {
    this.loadResourceFromBundle<SpriteFrame>(bundleName, path, SpriteFrame, callback);
}

    static loadTextureFromBundle(bundleName: string, path: string, callback: (err: Error | null, texture: Texture2D | null) => void) {
            this.loadResourceFromBundle<Texture2D>(bundleName, path, Texture2D, callback);
    }

    /**
     * 加载音乐
     * @param path 音乐路径
     * @param callback 回调函数
     */
    static loadAudioClip(path: string, callback: (err: Error | null, audioClip: AudioClip | null) => void) {
        this.loadResource<AudioClip>(path, AudioClip, callback);
    }
}