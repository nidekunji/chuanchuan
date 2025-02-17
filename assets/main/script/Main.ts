/*
 * @Author: Aina
 * @Date: 2024-12-19 01:17:40
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-17 16:42:17
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
import { SDKDir, ResultState, getLeftTopRect, SDKUserButtonType } from '../../sdk/sdk_define';
import { EventDispatcher } from '../../common/scripts/EventDispatcher';
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
     
        sdk.p.showBanner(0, SDKDir.BOTTOM_MID)
        this.initSetting();
        sdk.p.getUserInfo((r: ResultState, data: any) => {
            this.rankNode.active = r == ResultState.YES;
            if (r == ResultState.NO) {
                let style = getLeftTopRect(this.rankNode)
                style.width = 153
                style.height = 153
                sdk.p.createInfoButton({
                    type: SDKUserButtonType.image,
                    image: "openDataContext/assets/rank_icon.png",
                    text: "排行榜", callback: (r: ResultState, data: any) => {
                        this.onRankBtnClick();
                    }, style: style
                })
            }
        })
        const eventDispatcher = EventDispatcher.getInstance();
        if (eventDispatcher) {
            eventDispatcher.on('enterGame', this.enterGame.bind(this));
        } else {
            console.error("EventDispatcher not found!!!");
        }
    }
    enterGame() {
        console.log("enterGame");
        director.loadScene(this._sceneName);
    }
    initSetting() {
        let level = LocalStorageManager.getItem(LocalCacheKeys.Level)
        if (!level || level === '1') {
            LocalStorageManager.removeItem(LocalCacheKeys.GameSave);
            LocalStorageManager.setItem(LocalCacheKeys.BackgroundMusic, 'true');
            LocalStorageManager.setItem(LocalCacheKeys.ShakeEffect, 'true');
            LocalStorageManager.setItem(LocalCacheKeys.SoundEffects, 'true');
        }
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
        this.startBtn.on(Node.EventType.TOUCH_END, this.startGame, this);
    }
    private checkAndPlayBackgroundMusic() {
        LocalStorageManager.setItem(LocalCacheKeys.BackgroundMusic, 'true');
        const audioManager = AudioManager.instance;
        if (audioManager) {
            audioManager.playBackgroundMusic('bgm');
        } else {
            console.error("AudioManager component not found on this node");
        }
    }
    startGame() {
        if (window['wx']) {
            sdk.p.destroyInfoButton()
        }
        // 停止按钮动画
        if (this._buttonTween) {
            this._buttonTween.stop(); // 停止动画
            this.startBtn.setScale(new Vec3(1, 1, 1)); // 重置为原始大小
        }
        const saveStr = LocalStorageManager.getItem(LocalCacheKeys.GameSave);
        if (!saveStr) {
            sdk.p.login('', (state: ResultState, data: any) => {
                if (state == ResultState.YES) {
                    this.enterGame();
                }
            })
        } else {
            sdk.p.login('', (state: ResultState, data: any) => {
                if (state == ResultState.YES) {
                    UIManager.instance.openUI(uiLoadingConfigs.StoreUIUrl);
                }
            })
        } 
    }

    private preloadGameBundle() {
        // 检查bundle是否已加载
        const bundle = assetManager.getBundle("game");
    if (!bundle) {
        // 先加载bundle
        assetManager.loadBundle("game", (err, bundle) => {
            if (err) {
                console.error("预加载游戏bundle失败:", err);
                return;
            }
            // 只有在bundle成功加载后才加载场景
            this.loadGameScene(bundle);
        });
    } else {
        // bundle已存在,继续加载场景
        console.log("bundle已存在,继续加载场景")
        this.loadGameScene(bundle);
    }

    }
    private loadGameScene(bundle: any) {
        bundle.preloadScene(this._sceneName, (err) => {
            if (err) {
                console.error("预加载主场景失败:", err);
                return;
            }
            console.log("游戏场景预加载成功");
        });
    }

    onDestroy() {
        // 清理事件监听
        if (this.startBtn && this.startBtn.isValid) {
            this.startBtn.off(Node.EventType.TOUCH_END, this.startGame, this);
        }
        const eventDispatcher = EventDispatcher.getInstance();
        if (eventDispatcher) {
            eventDispatcher.off('enterGame', this.enterGame.bind(this));
        } else {
            console.error("EventDispatcher not found!!!");
        }
        sdk.p.hideBanner()
    }

    showRank() {
        const uiManager = UIManager.instance;
        UIManager.instance.openUI(uiLoadingConfigs.RankUIUrl);
        sdk.p.destroyInfoButton()
    }
    clearCache() {
        LocalStorageManager.clearAllCache();
        LocalStorageManager.setItem(LocalCacheKeys.Level, '1')
        LocalStorageManager.setItem(LocalCacheKeys.BackgroundMusic, 'true');
        LocalStorageManager.setItem(LocalCacheKeys.ShakeEffect, 'true');
        LocalStorageManager.setItem(LocalCacheKeys.SoundEffects, 'true');
    }

    onRankBtnClick() {
        sdk.p.getSetting({
            scope: "scope.WxFriendInteraction", success: () => {
                this.showRank();
            }, fail: () => {

            }
        })
    }

    onShareBtnClick() {
        sdk.p.showShare({
            index: 0, callback: (r: number) => {
                if (this.node.isValid) {

                }
            }
        })
    }
    showIconList() {
        UIManager.instance.openUI(uiLoadingConfigs.IconListUIUrl);
    }
}
