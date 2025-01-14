import { _decorator, AudioSource, Component, AudioClip, assetManager, sys } from 'cc';
import { LocalCacheKeys } from '../../app/config/GameConfig';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static _instance: AudioManager | null = null;

    private backgroundMusicSource: AudioSource | null = null;
    private soundEffectsSource: AudioSource | null = null;

    public static get instance(): AudioManager {
        if (!AudioManager._instance) {
            throw new Error("AudioManager instance is not initialized yet.");
        }
        return AudioManager._instance;
    }

    onLoad() {
        if (AudioManager._instance == null) {
            AudioManager._instance = this;
        } else {
            this.destroy();
            return;
        }
        
        if (this.node) {
            this.backgroundMusicSource = this.node.addComponent(AudioSource);
            this.soundEffectsSource = this.node.addComponent(AudioSource);
        }
    }

    start() {
       
    }

    onDestroy() {
        AudioManager._instance = null;
    }

    public async playBackgroundMusic(clipName: string, loop: boolean = true, isJustPlay: boolean = true) {
        if (!this.backgroundMusicSource) return;
        this.backgroundMusicSource.stop();

        if (isJustPlay && this.isBackgroundMusicEnabled()) {
            const clip = await this.loadAudioClipFromBundle('sceneRes', clipName);
            if (clip) {
                this.backgroundMusicSource.clip = clip;
                this.backgroundMusicSource.loop = loop;
                this.backgroundMusicSource.play();
            }
        } else if (!isJustPlay) {
            const clip = await this.loadAudioClipFromBundle('sceneRes', clipName);
            if (clip) {
                this.backgroundMusicSource.clip = clip;
                this.backgroundMusicSource.loop = loop;
                this.backgroundMusicSource.play();
            }
        }
    }

    private isBackgroundMusicEnabled(): boolean {
        const enabled = LocalStorageManager.getItem(LocalCacheKeys.BackgroundMusic);
        return enabled === 'true';
    }

    private isSoundEffectsEnabled(): boolean {
        const enabled = LocalStorageManager.getItem(LocalCacheKeys.SoundEffects);
        return enabled === 'true';
    }

    public async playSoundEffect(clipName: string) {
        if (!this.soundEffectsSource || !this.isSoundEffectsEnabled()) return;

        const clip = await this.loadAudioClipFromBundle('sceneRes', clipName);
        if (clip) {
            this.soundEffectsSource.clip = clip;
            this.soundEffectsSource.play();
        }
    }

    private loadAudioClipFromBundle(bundleName: string, clipName: string): Promise<AudioClip> {
        return new Promise((resolve, reject) => {
            let bundle = assetManager.getBundle(bundleName);
            if (!bundle) {
                assetManager.loadBundle(bundleName, (err, loadedBundle) => {
                    if (err) {
                        reject(new Error(`Failed to load bundle: ${bundleName}`));
                        return;
                    }
                    bundle = loadedBundle;
                    this.loadClipFromBundle(bundle, clipName, resolve, reject);
                });
            } else {
                this.loadClipFromBundle(bundle, clipName, resolve, reject);
            }
        });
    }

    private loadClipFromBundle(bundle, clipName: string, resolve, reject) {
        bundle.load(`audio/${clipName}`, AudioClip, (err, clip) => {
            if (err) {
                reject(err);
            } else {
                resolve(clip);
            }
        });
    }

    public setBackgroundMusicEnabled(enabled: boolean) {
        if (!this.backgroundMusicSource) return;

        this.backgroundMusicSource.volume = enabled ? 1 : 0;
        if (!enabled) {
            this.backgroundMusicSource.stop();
        } else {
            this.playBackgroundMusic('bgm', true, false);
        }
    }

    public setSoundEffectsEnabled(enabled: boolean) {
        if (!this.soundEffectsSource) return;

        this.soundEffectsSource.volume = enabled ? 1 : 0;
    }
}