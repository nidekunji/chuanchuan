/*
 * @Author: Aina
 * @Date: 2025-01-05 16:00:02
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-23 20:33:44
 * @FilePath: /chuanchuan/assets/common/scripts/EventDispatcher.ts
 * @Description: 事件派发器
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
// assets/game/script/EventDispatcher.ts
export class EventDispatcher {
    private static instance: EventDispatcher;
    private events: { [key: string]: Function[] } = {};

    private constructor() {}

    public static getInstance(): EventDispatcher {
        if (!EventDispatcher.instance) {
            EventDispatcher.instance = new EventDispatcher();
        }
        return EventDispatcher.instance;
    }

    public on(event: string, listener: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        // 使用 some 方法检查函数是否已存在
        const exists = this.events[event].some(l => l.toString() === listener.toString());
        if (!exists) {
            this.events[event].push(listener);
        } else {
          //  console.warn(`[EventDispatcher] Listener for event "${event}" is already registered`);
        }
    }

    public off(event: string, listener: Function) {
        if (!this.events[event]) return;
        // 使用 toString() 比较来过滤函数
        this.events[event] = this.events[event].filter(l => l.toString() !== listener.toString());
    }

    public emit(event: string, ...args: any[]) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }
}