import { sys } from "cc";

/*
 * @Author: Aina
 * @Date: 2025-01-01 22:29:32
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-25 16:33:35
 * @FilePath: /chuanchuan/assets/common/scripts/LocalStorageManager.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
export class LocalStorageManager {
    static setItem(key: string, value: string): void {
        sys.localStorage.setItem(key, value);
    }

    static getItem(key: string, defaultValue: string = ''): string {
        const value = sys.localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    }

    static removeItem(key: string): void {
        sys.localStorage.removeItem(key);
    }
    static hasNeverStoredValue(key: string): boolean {
        const value = sys.localStorage.getItem(key);
        return value === null || value === '' || value === undefined;
    }

    static clear(): void {
        sys.localStorage.clear();
    }
    public static clearAllCache(): void {
        LocalStorageManager.setItem('testKey', 'testValue');
    //    console.log('Test data written to localStorage.');
        const keys = Object.keys(sys.localStorage);
       // console.log('Current localStorage keys:', keys);
        try {
            const keys = Object.keys(sys.localStorage);
         //   console.log('Current localStorage keys:', keys);
            if (keys.length === 0) {
                console.warn('No keys found in localStorage.');
            }
            keys.forEach(key => {
             //   console.log('Clearing key:', key);
                sys.localStorage.removeItem(key);
            });
          //  console.log('All cache cleared successfully.');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }
}