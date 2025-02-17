/*
 * @Author: Aina
 * @Date: 2025-02-17 16:12:53
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-17 18:41:44
 * @FilePath: /chuanchuan/assets/main/script/IconListUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, instantiate, Label, Node, Prefab } from 'cc';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { getUnlockedCustomerLevel, iconList, LocalCacheKeys, uiLoadingConfigs } from '../../app/config/GameConfig';
import { ResourceManager } from '../../common/scripts/ResourceManager';
import { Icon } from './Icon';
import { UIManager } from '../../common/scripts/UIManager';
const { ccclass, property } = _decorator;

@ccclass('IconListUI')
export class IconListUI extends Component {
    @property(Node)
    content: Node = null!;

    @property(Label)
    totalLockNum: Label = null!;
    

    private currentLevel: number = 1;
    private unLockNum: number = 0;
    private totalNum: number = 50;
    private selectedIconNode: Node | null = null; // 添加跟踪选中icon的变量
    start() {
        this.init();
    }
    init () {
        this.currentLevel = this.getCurrentLevel();
        this.createIconList();
        this.totalLockNum.string = "客人(" + this.unLockNum +"" + "/" + this.totalNum.toString() +")";
    }
    private getCurrentLevel(): number {
        return 60;
        let level = LocalStorageManager.getItem(LocalCacheKeys.Level)
        return level ? parseInt(level) : 1;
    }
    private async createIconList() {
        this.unLockNum = getUnlockedCustomerLevel(this.currentLevel);
        
        for (let i = 1; i <= this.totalNum; i++) {
            let isUnlocked = i <= this.unLockNum;
            await this.createIconItem(isUnlocked, i);
        }
    }
        // 添加处理icon选中的方法
        private onIconSelected(node: Node, iconComponent: Icon) {
            console.log('onIconSelected', node, iconComponent);
            // 如果之前有选中的icon，取消其选中状态
            if (this.selectedIconNode && this.selectedIconNode !== node) {
                const prevIconComp = this.selectedIconNode.getComponent(Icon);
                if (prevIconComp) {
                    prevIconComp.setSelected(false);
                }
            }
            
            // 设置新的选中状态
            this.selectedIconNode = node;
            iconComponent.setSelected(true);
        }
    private createIconItem(isUnlocked: boolean, level: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const prefabPath = 'prefab/Icon';
            ResourceManager.loadResourceFromBundle('main2', prefabPath, Prefab, (err, prefab) => {
                if (err || !prefab) {
                    console.error(`Failed to load icon prefab:`, err);
                    reject(err);
                    return;
                }
                const node = instantiate(prefab);
                node.name = `icon_${level}`;
                let iconComponent = node.getComponent(Icon);
                if (iconComponent) {
                    iconComponent.init(isUnlocked, level);
                    node.on(Node.EventType.TOUCH_END, () => {
                        if (isUnlocked) {
                            this.onIconSelected(node, iconComponent);
                        }
                    });
                }
                node.active = true;
                this.content.addChild(node);
                resolve();
            });
        });
    }
   

    update(deltaTime: number) {
        
    }
    onClose() {
        UIManager.instance.closeUI(uiLoadingConfigs.IconListUIUrl.name);
    }
}
