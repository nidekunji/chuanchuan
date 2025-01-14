import { SDKDataType } from "./sdk_define";


/**
 * 此sdk框架自动识别使用的配置，上哪个平台就配置对应平台的广告id
 */
export let SDKData: { [key: string]: SDKDataType } = {
    dev: {
        // name: "dev",
        // sdk: ""
    },
    wx: {//微信配置这个，其他配置不用管。
        // banner: ['adunit-c54cc7d32181aad9'],
        banner: ['adunit-84f7e8364278092a'],
        reward: ['adunit-e4dd374ce73ff1d8'],
        // insert: ['adunit-0d6426d8803ebd11'],
        // blockAd: [
        //     'adunit-638b68a69862b241',//单格子广告
        //     'adunit-70e3eb5cc59ea978',//单格子广告
        // ],
        customAd: [
            'adunit-84f7e8364278092a',//左图右文
            // 'adunit-0098a6470afa6c08',//多格子广告
            // 'adunit-da4ad3bc6fa60bef',//矩阵广告
            // "adunit-879126829a525295"//矩阵广告
        ],
        share: [
            {
                shareTitle: "[有人@你]一起装扮浪漫家园",
                shareImage: "share4.jpg"
            },
            {
                shareTitle: "[有人@你]一起装修浪漫家园",
                imageUrl: ""
            }]
    },

}