import { isdk } from "./isdk";
import { SDKDir, SDKShareParam, DataCallback, ResultState } from "./sdk_define";


export class web_sdk implements isdk {

    setUserCloudStorage(obj: { KVDataList: any[]; success: Function; fail: Function; }): void {

    }

    getOpenDataContext() {

    }

    postMessage(obj: any): void {
    }


    login(account: string, func: DataCallback): void {
        func(ResultState.YES, '')
    }

    getSetting(obj: { scope: string, success: Function, fail: Function }): void {
        obj.success()
    }

    showRewardedVideoAd(callback: (result: number) => void, index: number = 0): void {
        callback(1)
    }

    showBanner(index: number, dir: SDKDir): void {

    }

    hideBanner(): void {

    }

    showShare(param: SDKShareParam): void {
        param.callback(1)
    }


    showCustomAd(param: { rx: number, ry: number }, index?: number): void {

    }
}