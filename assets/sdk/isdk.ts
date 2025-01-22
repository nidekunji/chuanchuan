import { SDKDir, SDKShareParam, DataCallback, ResultState } from "./sdk_define";


export interface isdk {



    setUserCloudStorage(obj: { //调用微信接口上报关卡等级信息，用于好友圈排行
        KVDataList: any[],

        success: Function,

        fail: Function
    }): void;

    createInfoButton(param: { text: string,  callback: (r: ResultState, data: any) => void, right?: number, top?: number, width?: number, height?: number }): void

    getUserInfo(callback: (r: ResultState, res: any) => void): void

    getOpenDataContext(): any

    postMessage(obj: any): void;

    login(account: string, func: DataCallback): void;

    getSetting(obj: { scope: string, success: Function, fail: Function }): void;

    showRewardedVideoAd(callback: (result: number) => void, index?: number): void

    showBanner(index: number, dir: SDKDir): void;

    hideBanner(): void;

    showShare(param: SDKShareParam): void;

    login(account: string, func: DataCallback): void;

    showCustomAd(param: { rx: number, ry: number }, index?: number): void
}

