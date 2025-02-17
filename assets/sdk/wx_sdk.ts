import { isdk } from "./isdk";
import { SDKDir, SDKShareParam, ShareType, ResultCallback, ResultState, DataCallback, SDKStyle, SDKUserButtonType } from "./sdk_define";
import { SDKData } from "./sdk_data";


// const rewaredAd: string[] = ['adunit-e4dd374ce73ff1d8']
// const bannerAd: string[] = ['adunit-c54cc7d32181aad9']
export class wx_sdk implements isdk {
    private sdk: any = window['wx']
    protected visibleSize: { width: number, height: number } = { width: 1, height: 1 };
    protected _openContext: any;

    /**
 * 显示宽高与小游戏屏幕宽高的比例
 */
    protected screenRatio: { x: number, y: number } = { x: 1, y: 1 }

    getScreenSize(): { width: number, height: number } {
        let systemInfo = this.sdk.getSystemInfoSync();
        return { width: systemInfo.screenWidth, height: systemInfo.screenHeight }
    }
    setScreenRatio() {
        let visibleSize = this.getVisibleSize();
        console.log(' visibleSize ', visibleSize)
        let screenSize = this.getScreenSize();
        console.log(' screenSize ', screenSize)
        this.screenRatio.x = screenSize.width / visibleSize.width
        this.screenRatio.y = screenSize.height / visibleSize.height
    }

    getScreenRatio() {
        return this.screenRatio;
    }

    setVisibleSize(s: { width: number, height: number }) {
        this.visibleSize = s;
        // console.log(' setVisibleSize  this.visibleSize ', this.visibleSize)
        this.setScreenRatio()
    }

    getVisibleSize() {
        return this.visibleSize;
    }
    changeStyle(style: SDKStyle) {
        let screenRatio = this.getScreenRatio();
        console.log('changeStyle screenRatio ', screenRatio)
        // let style = param.style;
        if (style.left != undefined) {
            style.left = style.left * screenRatio.x;
        }
        if (style.top != undefined) {
            style.top = style.top * screenRatio.y;
        }
        if (style.width != undefined) {
            style.width = style.width * screenRatio.x;
        }
        if (style.height != undefined) {
            style.height = style.height * screenRatio.y;
        }
    }
    constructor() {

    }

    init(vs: { width: number, height: number }): void {
        this.setVisibleSize(vs)
        this.share.init()
    }

    protected infoButton: any;
    protected loginMgr: WXLogin = new WXLogin();


    protected customAd: WXCustomAd = new WXCustomAd();
    showCustomAd(param: { rx: number, ry: number }, index?: number): void {
        this.customAd.show(param)
    }

    postMessage(obj: any): void {
        if (!this._openContext) {
            this._openContext = this.sdk.getOpenDataContext(); // 调用微信接口获取子域句柄，使用时需要检查
        }
        this._openContext.postMessage(obj)
    }

    login(account: string, func: DataCallback): void {
        this.loginMgr.login(account, func)
    }

    getSetting(obj: { scope: string, success: Function, fail: Function }): void {
        console.log(' obj.scope ', obj.scope)
        this.sdk.getSetting({
            success: (res: any) => {
                console.log(' res ', res)
                let data = res.authSetting[obj.scope];
                console.log(' data ', data)
                if (!data) {
                    this.authorize(obj)
                } else {
                    obj.success();
                }
            }
        })
    }

    getUserInfo(callback: (r: ResultState, res: any) => void): void {
        // 通过 wx.getSetting 查询用户是否已授权头像昵称信息
        let sdk = this.sdk;
        sdk.getSetting({
            success(res) {
                if (res.authSetting['scope.userInfo']) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                    sdk.getUserInfo({
                        success: function (res) {
                            console.log(res.userInfo)
                            callback(ResultState.YES, res)
                        }
                    })
                } else {
                    callback(ResultState.NO, res)
                }
            }
        })
    }

    createInfoButton(param: { type: string, image?: string, text?: string, callback: (r: ResultState, data: any) => void, style: SDKStyle }) {
        let sdk = this.sdk;
        // 否则，先通过 wx.createUserInfoButton 接口发起授权
        this.changeStyle(param.style)

        console.log('createInfoButton style ', param.style)
        let button = sdk.createUserInfoButton({
            type: param.type,
            text: param.text,
            image: param.image,
            style: {
                left: param.style.left,
                top: param.style.top,
                width: param.style.width,
                height: param.style.height,
                // lineHeight: 40,
                // backgroundColor: '#ff0000',
                // color: '#ffffff',
                // textAlign: 'center',
                // fontSize: 16,
                // borderRadius: 4
            }
        })
        button.onTap((res: any) => {
            // 用户同意授权后回调，通过回调可获取用户头像昵称信息
            console.log('createInfoButton onTap ', res)
            param.callback(ResultState.YES, res)
        })
        this.infoButton = button;
    }
   

    setInfoButonVisible(f: boolean): void {
        if (this.infoButton) {
            if (f) {
                this.infoButton.show()
            } else {
                this.infoButton.hide();
            }
        }
    }

    destroyInfoButton(): void {
        if (this.infoButton) {
            this.infoButton.destroy();
            this.infoButton = null;
        }
    }

    authorize(obj: { scope: string, success: Function, fail: Function }) {
        this.sdk.authorize({
            scope: obj.scope,
            success() {
                console.log('authorize success ')
                // 用户已经同意保存到相册功能，后续调用 wx.saveImageToPhotosAlbum 接口不会弹窗询问
                obj.success()
            },
            fail(err) {
                console.log('authorize fail ', err)
                obj.fail()
            },
            complete() {
                console.log('getSetting complete ')
            }
        })
    }



    getOpenDataContext() {
        return this.sdk.getOpenDataContext();
    }


    protected share: WXShare = new WXShare();
    showShare(param: SDKShareParam): void {
        this.share.open(param)
    }


    setUserCloudStorage(obj: { KVDataList: any[]; success: Function; fail: Function; }): void {
        this.sdk.setUserCloudStorage(obj)
    }

    // private _reportUserLevel(level: number, listener?: Function, target?: any) {

    //     // @ts-ignore
    //     wx.setUserCloudStorage({ //调用微信接口上报关卡等级信息，用于好友圈排行
    //         KVDataList: [
    //             { key: 'level', value: `${level}` }
    //         ],

    //         success: () => {
    //             listener ?.apply(target);
    //         },

    //         fail: (err: any) => {
    //             console.log('report level error:', err);
    //         }
    //     });
    // }

    protected rewardAd: any[] = [];
    protected videoAdCallback: (result: number) => void = null;
    protected callVedioCallback(r: number) {
      //  window['cc'].audioEngine.pauseMusic();
        if (this.videoAdCallback) {
            if (window['cc'] && window['cc'].audioEngine) {
                window['cc'].audioEngine.resumeAll();
            }
            this.videoAdCallback(r)
            this.videoAdCallback = null;
        }
        
    }
    showRewardedVideoAd(callback: (result: number) => void, index: number = 0): void {
        
        this.videoAdCallback = callback;
        let videoAd = this.rewardAd[index]
        if (!videoAd) {
            if (!SDKData.wx.reward[index]) {
                console.log('激励视频 广告配置数量错误 ', index)
                return;
            }
            videoAd = this.sdk.createRewardedVideoAd({ adUnitId: SDKData.wx.reward[index] })
            this.rewardAd[index] = videoAd;
            videoAd.onClose((res: any) => {
                console.log('激励视频 onClose res ' + res)
                // 用户点击了【关闭广告】按钮
                // 小于 2.1.0 的基础库版本，res 是一个 undefined
                if (res && res.isEnded || res === undefined) {
                    // 正常播放结束，可以下发游戏奖励
                    this.callVedioCallback(1)
                }
                else {
                    // 播放中途退出，不下发游戏奖励
                    this.callVedioCallback(0)
                }
            })
            videoAd.onLoad(() => {
                console.log('激励视频 广告加载成功')
            })
            videoAd.onError(err => {
                console.log(err)
                this.callVedioCallback(0)
            })
        }

        // 用户触发广告后，显示激励视频广告
        videoAd.show().catch(() => {
            // 失败重试
            videoAd.load()
                .then(() => videoAd.show())
                .catch(err => {
                    console.error('激励视频 广告显示失败', err)
                })
        })


    }


    protected bannerAd: BannerAd = new BannerAd();
    showBanner(index: number, dir: SDKDir): void {
        this.bannerAd.open(index, dir);
    }

    hideBanner(): void {
        this.bannerAd.hide();
    }

}

class BannerAd {
    protected height: number = 50;
    protected width: number = 300;
    protected dir: SDKDir = SDKDir.BOTTOM_MID
    protected rx: number = 0;
    protected ry: number = 0;
    protected sdk = window['wx']
    protected ad: any;
    protected index: number = 0;
    open(index: number, dir: SDKDir) {
        this.dir = dir;
        if (this.ad) {
            this.ad.destroy();
            this.ad = null;
        }
        if (!this.ad) {
            let style = this.getStyle();
            let adUnitID = SDKData.wx.banner[index]
            console.log('WXBannerAd create  this.adUnitID', adUnitID, style)
            this.ad = this.sdk.createBannerAd({
                adUnitId: adUnitID,
                adIntervals: 30,
                style: style
            })
            this.ad.onLoad(() => {
                console.log('WXBannerAd onLoad')
                this.show();
            })
            this.ad.onError(() => {

            })

            this.ad.onResize((data: any) => {
                console.log('banner onResize', data)
                this.width = data.width;
                this.height = data.height;
                this.updateSize()
            })

        }
    }

    show() {
        this.ad.show()
            .catch(err => console.log('show', err))
    }

    hide() {
        if (this.ad) {
            this.ad.hide();
        }
    }
    updateSize() {
        let winSize = this.sdk.getSystemInfoSync();
        console.log('updateSize', this.width, this.height, this.ad)
        if (this.width != 0 && this.height != 0 && this.ad) {

            switch (this.dir) {
                case SDKDir.BOTTOM_LEFT:
                    this.ad.style.top = (winSize.windowHeight - this.height);
                    this.ad.style.left = 0;
                    break;
                case SDKDir.BOTTOM_MID:
                    this.ad.style.top = (winSize.windowHeight - this.height);
                    this.ad.style.left = (winSize.windowWidth - this.width) / 2;
                    break;
                case SDKDir.RIGHT_MID:
                    this.ad.style.top = (winSize.windowHeight - this.height) / 2;
                    this.ad.style.left = winSize.windowWidth - this.width;
                    break;
                case SDKDir.MID:
                    this.ad.style.top = (winSize.windowHeight - this.height) / 2;
                    this.ad.style.left = (winSize.windowWidth - this.width) / 2;
                    break;
                case SDKDir.TOP_MID:
                    this.ad.style.top = 0;
                    this.ad.style.left = (winSize.windowWidth - this.width) / 2;
                    break;
                case SDKDir.XY:
                    this.ad.style.top = this.ry * winSize.windowHeight;
                    this.ad.style.left = this.rx * winSize.windowWidth;
                    break;
            }

        }
    }
    getStyle(): any {
        let winSize = this.sdk.getSystemInfoSync();
        let x = 0
        let y = 0
        switch (this.dir) {
            case SDKDir.BOTTOM_MID:
                x = (winSize.windowWidth - this.width) / 2
                y = winSize.windowHeight - this.height;
                break;
            case SDKDir.UP_MID:
                x = (winSize.windowWidth - this.width) / 2
                y = 0
                break;
            case SDKDir.MID:
                x = (winSize.windowWidth - this.width) / 2
                y = (winSize.windowHeight - this.height) / 2;
                break;
            case SDKDir.RIGHT_MID:
                x = (winSize.windowWidth - this.width)
                y = (winSize.windowHeight - this.height) / 2;
                break;
            case SDKDir.LEFT_TOP:
                x = 0
                y = 0
                break;
            case SDKDir.BOTTOM_LEFT:
                x = 0
                y = winSize.windowHeight - this.height;
                break;
            case SDKDir.XY:
                x = this.rx * winSize.windowWidth;
                y = this.ry * winSize.windowHeight;
                break;
            case SDKDir.WHITE:
                x = -this.width + 1
                y = -this.height + 1

                break;
        }
        return {
            left: x,
            top: y,
            width: this.width,
            height: this.height,
        }
    }
}


class WXShare {
    //由于微信无法得到分享结果，所以以时间来判断是否成功。
    protected time: number = 0;
    protected sdk: any = window['wx']
    protected callback: (r: number) => void;

    protected data: ShareType[] = []
    init() {
        this.data = SDKData.wx.share
        this.sdk.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        });

        this.sdk.updateShareMenu({
            withShareTicket: true
        })

        this.sdk.onShareAppMessage(() => {
            // 用户点击了“转发”按钮
            return this.getData(0)
        })
        this.sdk.onShow(() => {
            this.backGame()
        })
    }


    open(param: SDKShareParam) {
        this.callback = param.callback;
        let data = this.getData(param.index)
        this.sdk.shareAppMessage(data)
        this.time = Date.now();
    }


    protected getData(index: number): any {
        let data = this.data[index]
        return data;
    }



    protected backGame() {

        if (this.callback) {
            let disTime = Date.now() - this.time
            if (disTime >= 3000) {
                this.callback(1);
            } else {
                this.callback(0);
            }
            this.callback = null;
        }
    }


}


class WXLogin {

    protected sdk: any = window['wx']
    checkSession(callback: ResultCallback) {
        this.sdk.checkSession({
            success(res: any) {
                console.log(`session未过期`);
                callback(ResultState.YES);
            },
            fail(res: any) {
                console.log(`session已过期，需要重新登录`);
                callback(ResultState.NO);
            }
        });
    }


    login(account: string, func: DataCallback) {
        let isForce: boolean = false;
        this.sdk.login({
            force: isForce,
            success(res: any) {
                console.log(`login调用成功${res.code} ${res.anonymousCode}`);
                func(ResultState.YES, res)
            },
            fail(res: any) {
                // console.log(`login调用失败`);
                if (isForce) {
                    func(ResultState.NO, res)
                } else {
                    func(ResultState.YES, res)
                }

            }
        });

    }

    getUserInfo(withCredentials: string, lang: string, func: DataCallback) {
        this.sdk.getUserInfo({
            withCredentials: withCredentials,
            lang: lang,
            success(res: any) {
                console.log(`getUserInfo调用成功${res.userInfo}`);
                func(ResultState.YES, res)
            },
            fail(res: any) {
                console.log(`getUserInfo调用失败`, res);
                func(ResultState.NO, null)
            }
        });
    }

    logout() {

    }

    showUserAgreement(func: ResultCallback) {
        this.sdk.showUserAgreement({
            success() {
                func(ResultState.YES)
            },
            fail() {
                func(ResultState.NO)
            }
        })
    }
}


class WXCustomAd {

    protected sdk: any = window['wx']
    protected rx: number = 0;
    protected ry: number = 0;
    protected ad: any = null;

    getStyle() {

        let winSize = this.sdk.getSystemInfoSync();
        let left = winSize.windowWidth * this.rx;
        let top = winSize.windowHeight * this.ry;
        // let left = 0
        // let top = 0;
        return {
            left: left,
            top: top,
        }
    }

    show(param: { rx: number, ry: number }, index: number = 0): void {
        if (this.ad) {
            this.ad.destroy();
            this.ad = null;
        }
        if (param.rx != undefined) {
            this.rx = param.rx;
            this.ry = param.ry;
        }

        if (!this.ad) {
            if (!SDKData.wx.customAd[index]) {
                return;
            }
            let adUnitID = SDKData.wx.customAd[index]
            this.ad = this.sdk.createCustomAd({
                adUnitId: adUnitID,
                adIntervals: 30,
                style: this.getStyle(),
            })
            this.ad.onLoad(() => {

            });
            this.ad.onError(() => {

            });
            // this.ad.onHide(this.getFunc(this.onHide));
            // this.ad.onClose(this.getFunc(this.onClose));
        }
        if (this.ad) {
            this.ad.show();
        }
    }



}