/*
 * @Author: Aina
 * @Date: 2023-12-23 15:55:18
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-12 08:38:29
 * @FilePath: /chuanchuan/assets/app/App.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved. 
 */

import { sys, _decorator, Component, Sprite, Label, lerp, assetManager, UITransform, Node, director } from "cc";
import { EDITOR } from "cc/env";
import { initData } from "./config/GameConfig";
import { ResourceManager } from "../common/scripts/ResourceManager";
// 加载主包
let isEnter = false;
(function () {
    if (EDITOR)
        return
    if (isEnter)
        return
    isEnter = true

    let _wx = (window as any)["wx"]
    if (_wx && _wx.startRenderDestroy)
        _wx.startRenderDestroy()
})();


// cc启动脚本
const { ccclass, property, menu } = _decorator;

const textStr = [
    "开始营业",
    "开始营业·",
    "开始营业··",
    "开始营业···",
]


@ccclass("App")
@menu("App")
export class App extends Component {
    private spriteRatio: Sprite = null!
    private ratio = 0
    private sp: UITransform = null!
    private topText: Label = null!
    private ratioText: Label = null!
    private textTime = 0
    private textIndex = 0
    private followRatio: Node = null!
    
    private _bundleLoaded: boolean = false;
    private _loadedScene: any = null;
    
    private loadBundles(bundleNames: string[]) {
        // console.log("load bundles " + Date.now());
        let loadedCount = 0;
        bundleNames.forEach(bundleName => {
            ResourceManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    console.error("加载Bundle失败:", err);
                } else {
                    loadedCount++;
                    if (loadedCount === bundleNames.length) {
                        console.log("bundleNames load success" + Date.now())
                    }
                    if (bundleName === "main2") {
                        bundle.loadScene("Main", (err, scene) => {
                            if (err) {
                                console.error("Failed to load MainScene:", err);
                                return;
                            }
                            this._bundleLoaded = true;
                            this._loadedScene = scene;
                            this.tryEnterScene();
                        });
                    }
                }
            });
        });
    }
    private tryEnterScene() {
        if (this._bundleLoaded && this.ratio >= 0.99) {
            director.runScene(this._loadedScene);
        }
    }
    onLoad() { 
        this.loadBundles(["main2", "setting", "game", "sceneRes"]);
        let loading = this.node.getChildByName("Loading")!
        let ratio = loading.getChildByName("Ratio")!
       
        this.topText = ratio.getChildByName("TopText")!.getComponent(Label)!
        this.topText.node.active = initData.showLoadingText

        loading.getChildByName("Age")!.active = initData.showLoadingText

        let Bg = ratio.getChildByName("Bg")!
        this.spriteRatio = Bg.getChildByName("Ratio")!.getComponent(Sprite)!
        this.sp = this.spriteRatio.getComponent(UITransform)!
        this.followRatio = Bg.getChildByName("FollowRatio")!
        this.ratioText = Bg.getChildByName("RatioText")!.getComponent(Label)!
        this.updateRatio()
    }
    private updateRatio() {
        this.sp.width = Math.floor(this.ratio * 321)
        if (this.followRatio) {
            this.followRatio.setPosition(321 * (this.ratio - .5), 0)

        }
        this.ratioText.string = Math.floor(this.ratio *100) + "%"
    }
    protected update(dt: number): void {
           // 2秒
           this.ratio = lerp(this.ratio, 1, .01)
           this.updateRatio()
   
           // Check if loading is complete before scene transition
            // 如果bundle已加载完成，检查进度条是否达到要求
        if (this._bundleLoaded && this.ratio >= 0.99) {
            this.ratio = 1
            this.tryEnterScene();
        }
        this.textTime += dt
        if (this.textTime > .5) {
            this.textTime = 0
            this.topText.string = textStr[this.textIndex % textStr.length]
            this.textIndex++
        }
    }

}

