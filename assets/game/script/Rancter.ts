
import { Vector2 } from "./Vector2";

// 基础接口定义
interface Point {
    x: number;
    y: number;
}

interface Size {
    width: number;
    height: number;
}



// 类型别名
type PointLike = Point | number;

// 假设这些是外部工具函数
const MathUtils = {
    toRadian(angle: number): number {
        return angle * Math.PI / 180;
    },
    isRange(value: number, target: number, range: number): boolean {
        return Math.abs(value - target) <= range;
    }
};

const Vector2Utils = {
    set(out: Vector2, x: number, y: number): Vector2 {
        out.x = x;
        out.y = y;
        return out;
    },
    sub(out: Vector2, a: Vector2, b: Vector2): Vector2 {
        out.x = a.x - b.x;
        out.y = a.y - b.y;
        return out;
    },
    add(out: Vector2, a: Vector2, b: Vector2): Vector2 {
        out.x = a.x + b.x;
        out.y = a.y + b.y;
        return out;
    }
};

export class Rectangle {
    public x: number = 0;
    public y: number = 0;
    public width: number = 0;
    public height: number = 0;
    public angle: number = 0;

    private _origin: Vector2;
    private _center: Vector2;
    private _v2s: Vector2[] | null = null;
    private _layoutOut: Vector2[][] | null = null;
    private _layoutXCount: number | null = null;
    private _layoutYCount: number | null = null;
    private _layoutCenter: boolean | null = null;
    private _quadtree: Rectangle[] | null = null;

    static TEMP = new Rectangle();
    static _layoutPointByIndex: { i?: number; j?: number } = {};

    private static readonly v2T: Vector2;  // 需要外部初始化
    private static readonly v2T2: Vector2; // 需要外部初始化
    private static readonly sizeT: Size = { width: 0, height: 0 };

    constructor(x?: number | Point, y?: number, width?: number, height?: number) {
        this._origin = new Vector2();
        this._center = new Vector2();
        this.set(x, y, width, height);
    }

    static set(self: Rectangle, x?: number | Point, y?: number, width?: number, height?: number): Rectangle {
        if (x && typeof x === "object") {
            self.x = x.x;
            self.y = x.y;
            self.width = (x as any).width || 0;
            self.height = (x as any).height || 0;
        } else {
            self.x = x as number || 0;
            self.y = y || 0;
            self.width = width || 0;
            self.height = height || 0;
        }
        return self;
    }

    static fromMinMax(out: Rectangle, min: Point, max: Point): Rectangle {
        const minX = Math.min(min.x, max.x);
        const minY = Math.min(min.y, max.y);
        const maxX = Math.max(min.x, max.x);
        const maxY = Math.max(min.y, max.y);
        out.x = minX;
        out.y = minY;
        out.width = maxX - minX;
        out.height = maxY - minY;
        return out;
    }

    static equalsXY(self: Rectangle, other: Rectangle, range: number): boolean {
        if (self.width != other.width) return false;
        if (self.height != other.height) return false;
        if (!MathUtils.isRange(self.x, other.x, range)) return false;
        if (!MathUtils.isRange(self.y, other.y, range)) return false;
        return true;
    }

    static intersection(out: Rectangle, self: Rectangle, other: Rectangle): Rectangle {
        const axMin = self.x;
        const ayMin = self.y;
        const axMax = self.x + self.width;
        const ayMax = self.y + self.height;
        const bxMin = other.x;
        const byMin = other.y;
        const bxMax = other.x + other.width;
        const byMax = other.y + other.height;

        out.x = Math.max(axMin, bxMin);
        out.y = Math.max(ayMin, byMin);
        out.width = Math.min(axMax, bxMax) - out.x;
        out.height = Math.min(ayMax, byMax) - out.y;
        return out;
    }

    static union(out: Rectangle, self: Rectangle, other: Rectangle): Rectangle {
        const x = self.x;
        const y = self.y;
        const w = self.width;
        const h = self.height;
        const bx = other.x;
        const by = other.y;
        const bw = other.width;
        const bh = other.height;

        out.x = Math.min(x, bx);
        out.y = Math.min(y, by);
        out.width = Math.max(x + w, bx + bw) - out.x;
        out.height = Math.max(y + h, by + bh) - out.y;
        return out;
    }

    static containsRect(self: Rectangle, other: Rectangle): boolean {
        return (
            self.x <= other.x &&
            self.x + self.width >= other.x + other.width &&
            self.y <= other.y &&
            self.y + self.height >= other.y + other.height
        );
    }

    static contains(self: Rectangle, point: Point): boolean {
        return (
            self.x < point.x &&
            self.x + self.width > point.x &&
            self.y < point.y &&
            self.y + self.height > point.y
        );
    }

    static intersects(self: Rectangle, other: Rectangle): boolean {
        const maxax = self.x + self.width;
        const maxay = self.y + self.height;
        const maxbx = other.x + other.width;
        const maxby = other.y + other.height;
        return !(maxax < other.x || maxbx < self.x || maxay < other.y || maxby < self.y);
    }

    static equals(self: Rectangle, other: Rectangle): boolean {
        return (
            self.x === other.x &&
            self.y === other.y &&
            self.width === other.width &&
            self.height === other.height
        );
    }

    static angleCenter(out: Vector2[], value: Rectangle, angle: number): Vector2[] {
        const center = value.center;
        const size = value.size;
        const radian = MathUtils.toRadian(angle);

        Vector2Utils.set(out[0], -size.width / 2, -size.height / 2);
        Vector2Utils.set(out[1], size.width / 2, -size.height / 2);
        Vector2Utils.set(out[2], size.width / 2, size.height / 2);
        Vector2Utils.set(out[3], -size.width / 2, size.height / 2);

        for (const _out of out) {
            _out.rotateSelf(radian).addSelf(center);
        }
        return out;
    }

    static lerp(out: Rectangle, self: Rectangle, to: Rectangle, ratio: number): Rectangle {
        const x = self.x;
        const y = self.y;
        const w = self.width;
        const h = self.height;

        out.x = x + (to.x - x) * ratio;
        out.y = y + (to.y - y) * ratio;
        out.width = w + (to.width - w) * ratio;
        out.height = h + (to.height - h) * ratio;
        return out;
    }

    static mul(out: Rectangle, value: Rectangle, mul: number): Rectangle {
        Rectangle.v2T2.set(value.center);
        Rectangle.v2T.set(mul, mul);
        out.width = value.width * Rectangle.v2T.x;
        out.height = value.height * Rectangle.v2T.y;
        out.center = Rectangle.v2T2;
        return out;
    }

    static add(out: Rectangle, value: Rectangle, addWidth: number, addHeight: number): Rectangle {
        Rectangle.v2T2.set(value.center);
        out.width = value.width + addWidth;
        out.height = value.height + addHeight;
        out.center = Rectangle.v2T2;
        return out;
    }

    static layout(out: Vector2[][], rectangle: Rectangle, xCount: number, yCount: number, center: boolean): Vector2[][] {
        for (let i = 0; i < xCount; i++) {
            if (!out[i]) out[i] = [];
            for (let j = 0; j < yCount; j++) {
                if (!out[i][j]) out[i][j] = new Vector2();
                Rectangle.layoutPoint(out[i][j], rectangle, i, j, xCount, yCount, center);
            }
        }
        return out;
    }

    static converPointToOther(out: Vector2, point: Vector2, self: Rectangle, other: Rectangle): Vector2 {
        Vector2Utils.sub(out, self.origin, other.origin);
        Vector2Utils.add(out, out, point);
        return out;
    }

    static layoutPoint(out: Vector2, rectangle: Rectangle, i: number, j: number, xCount: number, yCount: number, center: boolean): Vector2 {
        if (center) {
            out.x = rectangle.x + ((i + 0.5) / xCount) * rectangle.width;
            out.y = rectangle.y + ((j + 0.5) / yCount) * rectangle.height;
        } else {
            out.x = rectangle.x + (i / (xCount - 1)) * rectangle.width;
            out.y = rectangle.y + (j / (yCount - 1)) * rectangle.height;
        }
        return out;
    }

    static layoutPointByIndex(rectangle: Rectangle, point: Vector2, xCount: number, yCount: number, center: boolean): { i?: number; j?: number } {
        if (center) {
            Vector2Utils.sub(Rectangle.v2T, point, rectangle.origin);
            Rectangle._layoutPointByIndex.i = Math.floor(Rectangle.v2T.x / (xCount - 0.5));
            Rectangle._layoutPointByIndex.j = Math.floor(Rectangle.v2T.y / (yCount - 0.5));
        }
        return Rectangle._layoutPointByIndex;
    }

    static create(x?: number, y?: number, width?: number, height?: number): Rectangle {
        return new Rectangle(x, y, width, height);
    }

    static clone(rectangle: Rectangle): Rectangle {
        return new Rectangle().set(rectangle);
    }

    static polygon(out: Vector2[], value: Rectangle): Vector2[] {
        Vector2Utils.set(out[0], value.xMin, value.yMin);
        Vector2Utils.set(out[1], value.xMin, value.yMax);
        Vector2Utils.set(out[2], value.xMax, value.yMax);
        Vector2Utils.set(out[3], value.xMax, value.yMin);
        return out;
    }

    static quadtree(out: Rectangle[], value: Rectangle): Rectangle[] {
        const width = value.width / 2;
        const height = value.height / 2;

        for (let i = 0; i < 4; i++) {
            out[i].width = width;
            out[i].height = height;
        }

        // 左上角
        out[0].origin = Rectangle.v2T.set(value.x, value.y + height);
        // 右上角
        out[1].origin = Rectangle.v2T.set(value.x + width, value.y + height);
        // 左下角
        out[2].origin = Rectangle.v2T.set(value.x, value.y);
        // 右下角
        out[3].origin = Rectangle.v2T.set(value.x + width, value.y);

        return out;
    }

    // Getters & Setters
    get origin(): Vector2 {
        return this._origin.set(this.x, this.y);
    }

    set origin(value: Vector2) {
        this.x = value.x;
        this.y = value.y;
    }

    get center(): Vector2 {
        return this._center.set(this.x + this.width / 2, this.y + this.height / 2);
    }

    set center(value: Vector2) {
        this.x = value.x - this.width / 2;
        this.y = value.y - this.height / 2;
    }

    get centerDisLeft(): number {
        return this.center.x - this.width / 2;
    }

    get centerDisRight(): number {
        return this.center.x + this.width / 2;
    }

    get centerDisTop(): number {
        return this.center.y + this.height / 2;
    }

    get centerDisDown(): number {
        return this.center.y - this.height / 2;
    }

    get yMax(): number {
        return this.y + this.height;
    }

    set yMax(value: number) {
        this.height = value - this.y;
    }

    get yMin(): number {
        return this.y;
    }

    set yMin(value: number) {
        this.height += this.y - value;
        this.y = value;
    }

    get xMax(): number {
        return this.x + this.width;
    }

    set xMax(value: number) {
        this.width = value - this.x;
    }

    get xMin(): number {
        return this.x;
    }

    set xMin(value: number) {
        this.width += this.x - value;
        this.x = value;
    }

    get size(): Size {
        Rectangle.sizeT.width = this.width;
        Rectangle.sizeT.height = this.height;
        return Rectangle.sizeT;
    }

    set size(value: Size) {
        this.width = value.width;
        this.height = value.height;
    }

    get v2s(): Vector2[] {
        if (!this._v2s) {
            this._v2s = [new Vector2(), new Vector2(), new Vector2(), new Vector2()];
        }
        return this._v2s;
    }

    // Instance methods
    layoutSelf(xCount: number, yCount: number, center: boolean): Vector2[][] {
        if (!this._layoutOut) this._layoutOut = [];
        this._layoutXCount = xCount;
        this._layoutYCount = yCount;
        this._layoutCenter = center;
        return Rectangle.layout(this._layoutOut, this, xCount, yCount, center);
    }

    layoutPoint(out: Vector2, i: number, j: number): Vector2 {
        return Rectangle.layoutPoint(out, this, i, j, this._layoutXCount!, this._layoutYCount!, this._layoutCenter!);
    }

    layoutPointByIndex(point: Vector2): { i?: number; j?: number } {
        return Rectangle.layoutPointByIndex(this, point, this._layoutXCount!, this._layoutYCount!, this._layoutCenter!);
    }

    polygon(): Vector2[] {
        return Rectangle.polygon(this.v2s, this);
    }

    set(x?: number | Point, y?: number, width?: number, height?: number): Rectangle {
        return Rectangle.set(this, x, y, width, height);
    }

    lerp(out: Rectangle, to: Rectangle, ratio: number): Rectangle {
        return Rectangle.lerp(out, this, to, ratio);
    }

    lerpSelf(to: Rectangle, ratio: number): Rectangle {
        return Rectangle.lerp(this, this, to, ratio);
    }

    equals(other: Rectangle): boolean {
        return Rectangle.equals(this, other);
    }

    intersects(other: Rectangle): boolean {
        return Rectangle.intersects(this, other);
    }

    contains(point: Point): boolean {
        return Rectangle.contains(this, point);
    }

    containsRect(other: Rectangle): boolean {
        return Rectangle.containsRect(this, other);
    }

    union(out: Rectangle, other: Rectangle): Rectangle {
        return Rectangle.union(out, this, other);
    }

    unionSelf(other: Rectangle): Rectangle {
        return Rectangle.union(this, this, other);
    }

    intersection(out: Rectangle, other: Rectangle): Rectangle {
        return Rectangle.intersection(out, this, other);
    }

    intersectionSelf(other: Rectangle): Rectangle {
        return Rectangle.intersection(this, this, other);
    }

    equalsXY(other: Rectangle, range: number): boolean {
        return Rectangle.equalsXY(this, other, range);
    }

    mul(out: Rectangle, mul: number): Rectangle {
        return Rectangle.mul(out, this, mul);
    }

    mulSelf(mul: number): Rectangle {
        return Rectangle.mul(this, this, mul);
    }

    add(out: Rectangle, addWidth: number, addHeight: number): Rectangle {
        return Rectangle.add(out, this, addWidth, addHeight);
    }

    addSelf(addWidth: number, addHeight: number): Rectangle {
        return Rectangle.add(this, this, addWidth, addHeight);
    }

    layout(out: Vector2[][], xCount: number, yCount: number, center: boolean): Vector2[][] {
        return Rectangle.layout(out, this, xCount, yCount, center);
    }

    converPointToOther(out: Vector2, point: Vector2, other: Rectangle): Vector2 {
        return Rectangle.converPointToOther(out, point, this, other);
    }

    fromMinMax(min: Point, max: Point): Rectangle {
        return Rectangle.fromMinMax(this, min, max);
    }

    clone(): Rectangle {
        return Rectangle.clone(this);
    }

    angleCenter(addAngle: number = 0): Vector2[] {
        return this.angle != 0 ? Rectangle.angleCenter(this.v2s, this, this.angle + addAngle) : Rectangle.polygon(this.v2s, this);
    }

    quadtree(): Rectangle[] {
        if (!this._quadtree) {
            this._quadtree = [];
            for (let i = 0; i < 4; i++) {
                this._quadtree[i] = new Rectangle();
            }
        }
        return Rectangle.quadtree(this._quadtree, this);
    }
}