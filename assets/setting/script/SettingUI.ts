import { _decorator, Color, Component, EventTouch, Layers, Node, Sprite, sys, UITransform } from 'cc';
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

    @property(Node)
    private musicNode: Node = null;
    @property(Node)
    private soundNode: Node = null;

    private eventDispatcher: EventDispatcher;
    
    

    onLoad() {
        
         // 从全局缓存中读取初始开关状态
        //  console.log(LocalStorageManager.getItem(LocalCacheKeys.BackgroundMusic),'effect' )
        //  console.log(LocalStorageManager.getItem(LocalCacheKeys.SoundEffects),'music')
         this.isBackgroundMusicOn = LocalStorageManager.getItem(LocalCacheKeys.BackgroundMusic) === 'true';
         this.isSoundEffectsOn = LocalStorageManager.getItem(LocalCacheKeys.SoundEffects) === 'true';
         console.log(this.isBackgroundMusicOn, "this.isBackgroundMusicOn")
         console.log(this.isSoundEffectsOn, "this.isSoundEffectsOn")
         this.eventDispatcher = EventDispatcher.getInstance();
         this.updateView();
    }
    onClickReset() {
        UIManager.instance.closeUI(uiLoadingConfigs.SettingUrl.name);
        this.eventDispatcher.emit('restartGame');
    }
    abandonChallenge() {
        // Close the current UI
        UIManager.instance.closeUI(uiLoadingConfigs.SettingUrl.name);
        UIManager.instance.openUI(uiLoadingConfigs.FailUrl);
    }

    onClickExit() {
        UIManager.instance.closeUI(uiLoadingConfigs.SettingUrl.name);
    }

    onClickSwitchBackgroundMusic() {
        this.isBackgroundMusicOn = !this.isBackgroundMusicOn;
     //   AudioManager.instance.setBackgroundMusicEnabled(this.isBackgroundMusicOn);
        LocalStorageManager.setItem(LocalCacheKeys.BackgroundMusic, this.isBackgroundMusicOn.toString());
        this.updateView();
    }

    onClickSwitchSoundEffects() {
        this.isSoundEffectsOn = !this.isSoundEffectsOn;
     //   AudioManager.instance.setSoundEffectsEnabled(this.isSoundEffectsOn);
        LocalStorageManager.setItem(LocalCacheKeys.SoundEffects, this.isSoundEffectsOn.toString());
        this.updateView();
    }

    updateView() {
         // 更新 UI 以反映背景音乐和音效的状态
        if (!this.isBackgroundMusicOn) {
            // Show child node 1 for musicNode
            this.musicNode.children[0].active = true;
            this.musicNode.children[1].active = false;
        } else {
            // Show child node 2 for musicNode
            this.musicNode.children[0].active = false;
            this.musicNode.children[1].active = true;
        }

        if (!this.isSoundEffectsOn) {
            // Show child node 1 for soundNode
            this.soundNode.children[0].active = true;
            this.soundNode.children[1].active = false;
        } else {
            // Show child node 2 for soundNode
            this.soundNode.children[0].active = false;
            this.soundNode.children[1].active = true;
        }
    }

    start() {
       
    }
    update(deltaTime: number) {
        
    }
}

