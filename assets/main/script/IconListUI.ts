/*
 * @Author: Aina
 * @Date: 2025-02-17 16:12:53
 * @LastEditors: Aina
 * @LastEditTime: 2025-02-19 06:46:16
 * @FilePath: /chuanchuan/assets/main/script/IconListUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, instantiate, Label, Node, Prefab } from 'cc';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { checkIsUnlockCustomer, iconList, LocalCacheKeys, uiLoadingConfigs } from '../../app/config/GameConfig';
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
    

    private currentUnlockCustomerNum: number = 1;
    private unLockNum: number = 0;
    private totalNum: number = 7;
    private selectedIconNode: Node | null = null; // 添加跟踪选中icon的变量
    start() {
        this.init();
    }
    init () {
        this.unLockNum = this.getCurrentUnlockCustomerNum();
        this.createIconList();
        this.totalLockNum.string = "客人(" + this.unLockNum +"" + "/" + this.totalNum.toString() +")";
    }
    private getCurrentUnlockCustomerNum(): number {
        let total = LocalStorageManager.getItem(LocalCacheKeys.UnlockCustomerNum)
        return total ? parseInt(total) : 1;
    }
    private async createIconList() {
        
        for (let i = 1; i <= this.totalNum; i++) {
            let isUnlocked = i <= this.unLockNum;
            await this.createIconItem(isUnlocked, i);
        }
    }
        // 添加处理icon选中的方法
        private onIconSelected(node: Node, iconComponent: Icon) {
              // 如果点击的是当前选中的icon，取消选中
              if (this.selectedIconNode === node) {
                iconComponent.setSelected(false);
                this.selectedIconNode = null;
                return;
            }
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
                    node.on(Node.EventType.TOUCH_START, () => {
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
