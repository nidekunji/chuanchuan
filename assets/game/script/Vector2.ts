

/**
 * 2D向量工具类
 */
interface IVector2 {
    x: number;
    y: number;
}

export type TVectorSet = number | number[] | IVector2;

class Vector2 implements IVector2 {
    /** X轴坐标 */
    public x: number;
    /** Y轴坐标 */
    public y: number;

    /**
     * 创建一个二维向量实例
     * @param x X轴坐标
     * @param y Y轴坐标 
     */
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }
   

    /**
     * 设置向量值
     * @param x X坐标或向量对象或数组
     * @param y Y坐标
     */
    set(x?: number | Vector2 | number[] | TVectorSet, y?: number): Vector2 {
        if (x && (x as number[])[0] !== undefined) {
            this.x = (x as number[])[0];
            this.y = (x as number[])[1];
        } else if (x && typeof x === "object") {
            this.x = (x as Vector2).x;
            this.y = (x as Vector2).y;
        } else {
            this.x = (x as number) || 0;
            this.y = y || 0;
        }
        return this;
    }

    /**
     * 向量加法
     * @param out 输出向量
     * @param a 向量a
     * @param b 向量b
     */
    static add(out: Vector2, a: Vector2, b: Vector2): Vector2 {
        out.x = a.x + b.x;
        out.y = a.y + b.y;
        return out;
    }

    /**
     * 向量减法
     * @param out 输出向量
     * @param a 向量a
     * @param b 向量b
     */
    static sub(out: Vector2, a: Vector2, b: Vector2): Vector2 {
        out.x = a.x - b.x;
        out.y = a.y - b.y;
        return out;
    }

    /**
     * 向量缩放
     * @param out 输出向量
     * @param value 输入向量
     * @param num 缩放值或向量
     */
    static mul(out: Vector2, value: Vector2, num: number | Vector2): Vector2 {
        out.set(value); 
        if (typeof num === "number") {
            out.x *= num;
            out.y *= num;
        } else {
            out.x *= num.x;
            out.y *= num.y;
        }
        return out;
    }
    static len(value: Vector2) {
        return Math.sqrt(Vector2.lengthSqr(value));
    }
    static lengthSqr(value: Vector2) {
        return value.x * value.x + value.y * value.y;
    }
    /**
     * 向量标准化
     * @param out 输出向量
     * @param value 输入向量
     */
    static normalize(out: Vector2, value: Vector2): Vector2 {
        const x = value.x;
        const y = value.y;
        let len = x * x + y * y;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            out.x = x * len;
            out.y = y * len;
        }
        return out;
    }

    /**
     * 计算两点间距离
     * @param value1 向量1
     * @param value2 向量2
     */
    static distance(value1: Vector2, value2: Vector2): number {
        const x = value1.x - value2.x;
        const y = value1.y - value2.y;
        return Math.sqrt(x * x + y * y);
    }

    /**
     * 向量旋转
     * @param out 输出向量
     * @param value 输入向量
     * @param radians 旋转弧度
     */
    static rotate(out: Vector2, value: Vector2, radians: number): Vector2 {
        const x = value.x;
        const y = value.y;
        const sin = Math.sin(radians);
        const cos = Math.cos(radians);
        out.x = cos * x - sin * y;
        out.y = sin * x + cos * y;
        return out;
    }

    /**
     * 线性插值
     * @param out 输出向量
     * @param from 起始向量
     * @param to 目标向量
     * @param ratio 插值比率[0-1]
     */
    static lerp(out: Vector2, from: Vector2, to: Vector2, ratio: number): Vector2 {
        const x = from.x;
        const y = from.y;
        out.x = x + ratio * (to.x - x);
        out.y = y + ratio * (to.y - y);
        return out;
    }

    /**
     * 判断两个向量是否近似相等
     * @param a 向量a
     * @param b 向量b
     * @param offset 误差范围
     */
    static equals(a: Vector2, b: Vector2, offset: number = 0.01): boolean {
        if (Math.abs(a.x - b.x) <= offset && Math.abs(a.y - b.y) <= offset) {
            return true;
        }
        return false;
    }

    // 实例方法
    len() { return Vector2.len(this); }
    lengthSqr() { return Vector2.lengthSqr(this); }
    add(out: Vector2, value: Vector2): Vector2 { return Vector2.add(out, this, value); }
    addSelf(value: Vector2): Vector2 { return Vector2.add(this, this, value); }
    sub(out: Vector2, value: Vector2): Vector2 { return Vector2.sub(out, this, value); }
    subSelf(value: Vector2): Vector2 { return Vector2.sub(this, this, value); }
    mul(out: Vector2, num: number | Vector2): Vector2 { return Vector2.mul(out, this, num); }
    mulSelf(num: number | Vector2): Vector2 { return Vector2.mul(this, this, num); }
    normalize(out: Vector2): Vector2 { return Vector2.normalize(out, this); }
    normalizeSelf(): Vector2 { return Vector2.normalize(this, this); }
    rotate(out: Vector2, radians: number): Vector2 { return Vector2.rotate(out, this, radians); }
    rotateSelf(radians: number): Vector2 { return Vector2.rotate(this, this, radians); }
    equals(other: Vector2, offset?: number): boolean { return Vector2.equals(this, other, offset); }

    /**
     * 转换为字符串
     */
    toString(): string {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    // 静态常量
    static readonly ZERO: Readonly<Vector2> = new Vector2(0, 0);
    static readonly ONE: Readonly<Vector2> = new Vector2(1, 1);
    static readonly UP: Readonly<Vector2> = new Vector2(0, 1);
    static readonly RIGHT: Readonly<Vector2> = new Vector2(1, 0);
    static readonly LEFT: Readonly<Vector2> = new Vector2(-1, 0);
    static readonly DOWN: Readonly<Vector2> = new Vector2(0, -1);
}

export { Vector2 };