/*
 * @Author: Aina
 * @Date: 2025-01-14 04:28:04
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-16 03:48:50
 * @FilePath: /chuanchuan/assets/main/script/RankUI.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { _decorator, Component, Node, Toggle, log } from 'cc';
const { ccclass, property } = _decorator;
import { WECHAT } from 'cc/env';
import { sdk } from '../../sdk/sdk';
import { UIManager } from '../../common/scripts/UIManager';
import { uiLoadingConfigs } from '../../app/config/GameConfig';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
@ccclass('RankUI')
export class RankUI extends Component {


    @property(Node)
    content:Node = null;

    start() {
        let store = LocalStorageManager.getItem('level');
        let level: number = 1;
        if (store) {
            level = parseInt(store);
        } 
        // let level: number = LocalStorageManager.getItem('level') || 10;
        
        sdk.p.setUserCloudStorage({ //调用微信接口上报关卡等级信息，用于好友圈排行
            KVDataList: [
                { key: 'level', value: `${level}` }
            ],

            success: () => {
                sdk.p.postMessage({ type: 'engine', event: 'level' })
            },

            fail: (err: any) => {
                console.log('report level error:', err);
            }
        });
    }

    update(deltaTime: number) {

    }

    onToggleClick(toggle: Toggle, data: string) {
        log('onToggleClick data ', data)
        log('onToggleClick toggle ', toggle)
        toggle.isChecked = true;

    }

    onBackBtnClick() {
        UIManager.instance.closeUI(uiLoadingConfigs.RankUIUrl.name);
    }

}


