/*
 * @Author: Aina
 * @Date: 2025-01-05 16:00:02
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-05 16:00:11
 * @FilePath: /chuanchuan/assets/game/scripts/EventDispatcher.ts
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
        this.events[event].push(listener);
    }

    public off(event: string, listener: Function) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    public emit(event: string, ...args: any[]) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }
}