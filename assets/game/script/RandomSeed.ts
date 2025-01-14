

/*
 * @Author: Aina
 * @Date: 2024-12-21 02:56:19
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-06 06:52:45
 * @FilePath: /chuanchuan/assets/game/script/RandomSeed.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved. 
 */
export class RandomSeed {
    private _data: number = -1;
    private id: number = -1;

    /**
     * Initializes the random seed with the given ID.
     * @param id - The seed value.
     * @returns The instance itself for chaining.
     */
    init(id: number): this {
        this._data = id;
        this.id = id;
        return this;
    }

    /**
     * Resets the internal state of the random seed to its initial value.
     * @returns The instance itself for chaining.
     */
    clear(): this {
        this._data = this.id;
        return this;
    }

    /**
     * Generates a pseudo-random number between 0 and 1.
     * @returns A pseudo-random number.
     */
    run(): number {
        this._data = (this._data * 9301 + 49297) % 233280;
        return this._data / 233280.0;
    }

    /**
     * A static pool instance for managing RandomSeed objects.
     */
  
}