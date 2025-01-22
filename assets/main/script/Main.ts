/*
 * @Author: Aina
 * @Date: 2024-12-19 01:17:40
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-19 17:02:23
 * @FilePath: /chuanchuan/assets/main/script/Main.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, tween, Vec3, Node, director, assetManager, Director, game, UITransform } from 'cc';
const { ccclass, property } = _decorator;
import { LocalCacheKeys, uiLoadingConfigs } from '../../app/config/GameConfig';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { AudioManager } from '../../common/scripts/AudioManager';
import { UIManager } from '../../common/scripts/UIManager';
import { sdk } from '../../sdk/sdk';
import { SDKDir, ResultState } from '../../sdk/sdk_define';
@ccclass('Main')
export class HomeButtonAnimation extends Component {
    @property(Node)
    startBtn: Node = null; // 在编辑器中将按钮节点拖入此属性

    @property(Node)
    rankNode: Node = null;

    @property(Node)
    rankContent: Node = null


    private _buttonTween = null; // 保存 tween 引用，便于停止
    private _sceneName: string = "Game"

    onLoad() {
        const existingAudioManagerNode = director.getScene().getChildByName('AudioManagerNode');
        if (!existingAudioManagerNode) {
            const audioManagerNode = new Node('AudioManagerNode');
            audioManagerNode.addComponent(AudioManager);
            director.addPersistRootNode(audioManagerNode);
            this.checkAndPlayBackgroundMusic();
        }
        LocalStorageManager.clearAllCache();
        sdk.p.showBanner(0, SDKDir.BOTTOM_MID)
    
        sdk.p.getUserInfo((r: ResultState, data: any) => {
            // 如果用户没有授权
            // console.log("r", ResultState.NO)
            if (r == ResultState.NO) {
                console.log("r", ResultState.NO)
                // 获取 rankNode 的位置和尺寸
                let rankNodePosition = this.rankNode.getWorldPosition(); // 获取 rankNode 的世界坐标
                let rankNodeSize = this.rankNode.getComponent(UITransform).contentSize; // 获取 rank
                sdk.p.createInfoButton({
                                text: "", callback: (r: ResultState, data: any) => {
                                    this.onRankBtnClick();
                                },
                                right: rankNodePosition.x,
                                top: rankNodePosition.y,
                                width: rankNodeSize.width,
                                height: rankNodeSize.height
                })
            }
        });
        

        // sdk.p.getUserInfo((r: ResultState, data: any) => {
        //  //   this.rankNode.active = r == ResultState.YES;
        //     if (r == ResultState.NO) {
        //         sdk.p.createInfoButton({
        //             text: "排行榜", callback: (r: ResultState, data: any) => {
        //                 this.onRankBtnClick();
        //             }
        //         })
        //     }
        // })


    }
    start() {
        this.preloadGameBundle()
        if (!this.startBtn) {
            console.error("Button node is not assigned!");
            return;
        }
        // 创建按钮的呼吸动画
        this._buttonTween = tween(this.startBtn)
            .repeatForever(
                tween()
                    .to(1, { scale: new Vec3(1.1, 1.1, 1) }) // 放大到 1.1 倍
                    .to(1, { scale: new Vec3(1, 1, 1) })     // 缩小回 1 倍
            )
            .start();

        // 添加按钮点击事件监听
        this.startBtn.on(Node.EventType.TOUCH_END, this.onButtonClick, this);
        // LocalStorageManager.clearAllCache()


    }
    private checkAndPlayBackgroundMusic() {
        // const uiManager = UIManager.instance;
        // console.log("uiManager", uiManager)

        LocalStorageManager.setItem(LocalCacheKeys.BackgroundMusic, 'true');
        const audioManager = AudioManager.instance;
        if (audioManager) {
            audioManager.playBackgroundMusic('bgm');
        } else {
            console.error("AudioManager component not found on this node");
        }
    }
    onButtonClick() {
        // 停止按钮动画
        if (this._buttonTween) {
            this._buttonTween.stop(); // 停止动画
            this.startBtn.setScale(new Vec3(1, 1, 1)); // 重置为原始大小
        }
        sdk.p.login('', (state: ResultState, data: any) => {
            if (state == ResultState.YES) {
                director.loadScene(this._sceneName);
            }
        })

    }

    private preloadGameBundle() {
        // 检查bundle是否已加载
        const bundle = assetManager.getBundle("game");
        if (!bundle) {
            assetManager.loadBundle("game", (err, bundle) => {
                if (err) {
                    console.error("Failed to preload game bundle:", err);
                    return;
                }
            });
        } else {
            console.log("Game bundle already preloaded");
            bundle.loadScene(this._sceneName, (err, scene) => {
                if (err) {
                    console.error("Failed to load MainScene:", err);
                    return;
                }

                //  director.runScene(scene);
            });
        }

    }

    onDestroy() {
        // 清理事件监听
        if (this.startBtn && this.startBtn.isValid) {
            this.startBtn.off(Node.EventType.TOUCH_END, this.onButtonClick, this);
        }

        sdk.p.hideBanner()
    }

    showRank() {
        const uiManager = UIManager.instance;
        UIManager.instance.openUI(uiLoadingConfigs.RankUIUrl);
    }

    onRankBtnClick() {

        // sdk.p.getUserInfo((r: ResultState, data: any) => {
        //     if (r == ResultState.YES) {
        //         this.showRank();
        //     }
        // })
        sdk.p.getSetting({
            scope: "scope.WxFriendInteraction", success: () => {
                this.showRank();
            }, fail: () => {

            }
        })
        // const uiManager = UIManager.instance;
        // uiManager.openUI(uiLoadingConfigs.RankUIUrl);
    }

    onShareBtnClick() {
        sdk.p.showShare({
            index: 0, callback: (r: number) => {
                if (this.node.isValid) {

                }
            }
        })
    }
}
