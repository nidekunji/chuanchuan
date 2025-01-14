/*
 * @Author: Aina
 * @Date: 2024-12-21 14:04:34
 * @LastEditors: Aina
 * @LastEditTime: 2024-12-21 14:04:40
 * @FilePath: /chuanchuan/assets/game/script/CallBack.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved. 
 */
/**
 * 完成回调处理类
 * 用于避免回调嵌套的情况
 */
export class CompleteCallBack {
    /** 当前回调函数 */
    public cb: Function | null;
    
    /** 保存原始回调函数 */
    public _cb: Function | null;

    constructor() {
        this.cb = null;
        this._cb = null;
    }

    /**
     * 设置回调函数
     * @param cb 回调函数,默认为null
     */
    public set(cb: Function | null = null): void {
        this.cb = cb;
        this._cb = cb;
    }

    /**
     * 执行回调函数
     * @param param 回调参数
     * @returns 回调函数的返回值,如果没有回调则返回null
     */
    public run(...param: any[]): any {
        // 避免回调嵌套,先缓存当前回调
        let cb = this.cb;
        // 清空当前回调
        this.cb = null;
        // 执行回调(如果存在)
        if (cb) {
            return cb(...param);
        }
        return null;
    }

    /**
     * 清空回调函数
     */
    public clear(): void {
        this.cb = null;
    }
}