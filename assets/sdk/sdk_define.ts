


export enum SDKDir {
    BOTTOM_MID,//屏幕下中，常用
    BOTTOM_LEFT,//屏幕下左
    TOP_MID,//屏幕上中
    RIGHT_MID,//屏幕右中
    LEFT_TOP,//屏幕左上
    UP_MID,//屏幕上中
    MID,//屏幕中间
    XY,//根据给定屏幕百分比设置广告位置
    NONE,
    WHITE,//白点，宽高为1的banner


}
export type ResultCallback = (result: number) => void
export type SDKShareParam = {
    index: number,
    callback: ResultCallback,
    videoPath?: string,
    url?: string,
}

export type ShareType = {
    title?: string
    shareTitle?: string,
    shareImage?: string,
    imageUrl?: string,
    desc?: string,
    imageUrlId?: string,
    extra?: any,
    success?: () => void,
    fail?: (e: any) => void,
}
export type RecorderType = {
    video?: string,

    channel?: string,
    title?: string,

    extra?: {
        videoPath: string
    },
    success?: () => void,
    fail?: (e: any) => void;
    callback?: (error: any) => void;

}
export type LaunchOptionsConfigType = {

    appId: string,
    query: string,
    extraData: any

}

export type SDKDataType = {
    gameId?: string,
    recorder?: RecorderType,
    share?: ShareType[],
    launchOptionsConfig?: LaunchOptionsConfigType[],


    banner?: string[],
    reward?: string[],
    insert?: string[],
    customAd?: string[],
    native?: string[]
    boxBanner?: string[]
    appbox?: string[],
    blockAd?: string[],

    gameBannerAd?: string[]
    portal?: string[]
    selfrender?: string[]
}

export enum ResultState {
    NO,
    YES,
    PROGRESS,
}

export type DataCallback = (result: ResultState, data: any) => void;
