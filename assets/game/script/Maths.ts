class Maths {
    static readonly PI: number = Math.PI;
    static readonly PI2: number = Math.PI * 2;
    static readonly _d2r: number = Maths.PI / 180.0;
    static readonly _r2d: number = 180.0 / Maths.PI;

    /**
     * Converts a number to a formatted string with optional fixed decimal places.
     * @param num The number to format.
     * @param fixed Number of decimal places to keep.
     * @returns The formatted string.
     */
    static valueByString(num: number, fixed: number = 1): string {
        const CValueByString = [
            [1000, "k"],
            [1000000, "M"],
            [1000000000, "B"]
        ];
    
        for (let i = 0; i < CValueByString.length; i++) {
            const cur = CValueByString[i];
            const next = CValueByString[i + 1];
            if (num >= (cur[0] as number) && (!next || num < (next[0] as number))) {
                const v = num / (cur[0] as number);
                return v < 100
                    ? Maths.toFixed(v, fixed) + (cur[1] as string)
                    : Math.floor(v) + (cur[1] as string);
            }
        }
        return num.toString();
    }
    

    static isRange(value1: number, value2: number, range: number): boolean {
        return Math.abs(value1 - value2) <= range;
    }

    static isEven(value: number): boolean {
        return value % 2 === 0;
    }

    static toRadian(a: number): number {
        return a * Maths._d2r;
    }

    static decimal(value: number): number {
        return value - Math.floor(value);
    }

    static toDegree(a: number, isNormalize: boolean = true): number {
        if (a === undefined) return 0;
        if (isNormalize) a = this.normalizeRadian(a);
        return a * Maths._r2d;
    }

    static normalizeRadian(angle: number): number {
        angle = angle % Maths.PI2;
        if (angle < 0) angle += Maths.PI2;
        return angle;
    }

    static normalizeAngle(angle: number): number {
        angle %= 360;
        if (angle < 0) angle += 360;
        return angle;
    }

    static lerp(a: number, b: number, r: number): number {
        return a + (b - a) * r;
    }

    static clamp01(value: number): number {
        return value < 0 ? 0 : value > 1 ? 1 : value;
    }

    static clampf(value: number, min: number, max: number): number {
        if (min > max) [min, max] = [max, min];
        return value < min ? min : value > max ? max : value;
    }

    static isClampf(value: number, min: number, max: number): boolean {
        if (min > max) [min, max] = [max, min];
        return value >= min && value <= max;
    }

    static isRandom(value: number, random: number = Math.random()): boolean {
        return value > random;
    }

    static minToMax(min: number, max: number, isInt: boolean = true, random: number = Math.random()): number {
        if (min === max) return min;
        const result = random * (max - min) + min;
        return isInt ? Math.round(result) : result;
    }

    static zeroToMax(max: number, random: number = Math.random()): number {
        return Math.floor(random * max);
    }

    static toFixed(value: number, count: number): number {
        const factor = Math.pow(10, count);
        return Math.floor(value * factor) / factor;
    }

    static arrAdd(values: number[]): number {
        return values.reduce((sum, num) => sum + num, 0);
    }

    static findNumSection(
        arr: number[],
        num: number,
        out: { i: number; count: number } = { i: 0, count: 0 },
        isContainNum: boolean = false
    ): { i: number; count: number } {
        out.i = arr.length;
        out.count = 0;

        for (let i = 0; i < arr.length; i++) {
            out.count += arr[i];
            if (isContainNum ? num <= out.count : num < out.count) {
                out.i = i;
                return out;
            }
        }

        return out;
    }

    static widgetRandom(arr: number[]): number {
        const rand = this.arrAdd(arr) * Math.random();
        let last = 0;

        for (let i = 0; i < arr.length; i++) {
            const value = arr[i];
            if (rand >= last && rand < last + value) return i;
            last += value;
        }

        return arr.length - 1;
    }

    static keep2Decimal(val: number): number {
        return Math.floor(val * 100) / 100;
    }
}

export default Maths;
