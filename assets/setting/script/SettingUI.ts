/*
 * @Author: Aina
 * @Date: 2025-01-14 04:28:04
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-14 17:35:11
 * @FilePath: /chuanchuan/assets/setting/script/SettingUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Color, Component, EventTouch, Layers, Node, Sprite, sys, UITransform, Vec3 } from 'cc';
import { initData, LocalCacheKeys, uiLoadingConfigs } from '../../app/config/GameConfig';
import { AudioManager } from '../../common/scripts/AudioManager';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { UIManager } from '../../common/scripts/UIManager';
import { EventDispatcher } from '../../common/scripts/EventDispatcher';
const { ccclass, property } = _decorator;

@ccclass('SettingUI')
export class SettingUI extends Component {

    private isBackgroundMusicOn: boolean = true;
    private isSoundEffectsOn: boolean = true;
    private isVibrateSwitch: boolean= true;

    @property(Node)
    private musicNode: Node = null;
    @property(Node)
    private soundNode: Node = null;

    @property(Node)
    private shakeNode: Node = null  
    

    onLoad() {
       // console.error("SettingUI onLoad!!!!", LocalStorageManager.getItem(LocalCacheKeys.BackgroundMusic))
        console.log("SettingUI onLoad!!!!",  LocalStorageManager.getItem(LocalCacheKeys.SoundEffects))
         this.isBackgroundMusicOn = LocalStorageManager.getItem(LocalCacheKeys.BackgroundMusic) === 'true';
         this.isSoundEffectsOn = LocalStorageManager.getItem(LocalCacheKeys.SoundEffects) === 'true';
         this.isVibrateSwitch = LocalStorageManager.getItem(LocalCacheKeys.ShakeEffect) === 'true';
         console.log(this.isBackgroundMusicOn,this.isSoundEffectsOn,this.isVibrateSwitch)
         this.updateView();
         const canvasNode = this.node.scene.getChildByName('Canvas'); // Assuming 'Canvas' is the name of the canvas node
         if (canvasNode) {
         } else {
             console.error("Canvas node not found");
         }
    }
    onClickReset() {
        console.log("onClickReset");
        UIManager.instance.closeUI(uiLoadingConfigs.SettingUrl.name);
        const eventDispatcher = EventDispatcher.getInstance();
        if (eventDispatcher) {
            eventDispatcher.emit('restartGame');
        } else {
            console.error("EventDispatcher not found!!!");
        }
    }
    abandonChallenge() {
        // Close the current UI
      //  this.onClickReset();
      LocalStorageManager.removeItem(LocalCacheKeys.GameSave);
      LocalStorageManager.removeItem(LocalCacheKeys.FoodStorage);
      LocalStorageManager.removeItem(LocalCacheKeys.WaitingArea);
      LocalStorageManager.removeItem(LocalCacheKeys.PropData);
        UIManager.instance.closeUI(uiLoadingConfigs.SettingUrl.name);
        UIManager.instance.openUI(uiLoadingConfigs.FailUrl);
    }

    onClickExit() {
        UIManager.instance.closeUI(uiLoadingConfigs.SettingUrl.name);
    }

    onClickSwitchBackgroundMusic() {
        this.isBackgroundMusicOn = !this.isBackgroundMusicOn;
       AudioManager.instance.setBackgroundMusicEnabled(this.isBackgroundMusicOn);
        LocalStorageManager.setItem(LocalCacheKeys.BackgroundMusic, this.isBackgroundMusicOn.toString());
        this.updateView();
    }
    onClickSwitchVibrateSwitch() {
        this.isVibrateSwitch = !this.isVibrateSwitch;
        LocalStorageManager.setItem(LocalCacheKeys.ShakeEffect,this.isVibrateSwitch.toString());
        this.updateView();
    }

    onClickSwitchSoundEffects() {
        this.isSoundEffectsOn = !this.isSoundEffectsOn;
        AudioManager.instance.setSoundEffectsEnabled(this.isSoundEffectsOn);
        LocalStorageManager.setItem(LocalCacheKeys.SoundEffects, this.isSoundEffectsOn.toString());
        this.updateView();
    }

    updateView() {
         // 更新 UI 以反映背景音乐和音效的状态
         let offset = 32
        if (!this.isBackgroundMusicOn) {
            this.musicNode.children[1].setPosition(new Vec3(-offset, 0, 0));
        } else {
            this.musicNode.children[1].setPosition(new Vec3(offset, 0, 0));
        }

        if (!this.isSoundEffectsOn) {
            this.soundNode.children[1].setPosition(new Vec3(-offset, 0, 0));
        } else {
            this.soundNode.children[1].setPosition(new Vec3(offset, 0, 0));
        }
        if (!this.isVibrateSwitch) {
            this.shakeNode.children[1].setPosition(new Vec3(-offset, 0, 0));
        } else {
            this.shakeNode.children[1].setPosition(new Vec3(offset, 0, 0));
        }

    }

    start() {
       
    }
    update(deltaTime: number) {
        
    }
}

