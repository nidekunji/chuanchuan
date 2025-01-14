import { _decorator, Component, Size, view, UITransform } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

let _uiMaxSize: Size = null;

/**竖屏手机最大高度 */
function uiMaxSize(): Size {
    if (_uiMaxSize == null) {
        _uiMaxSize = view.getVisibleSize().clone();
        if (_uiMaxSize.height / _uiMaxSize.width > 1.98) {
            _uiMaxSize.height = _uiMaxSize.width * 1.98;
        }
    }
    return _uiMaxSize;
}

/**
 * 可视范围控制组件
 * 用于控制UI在不同屏幕尺寸下的显示范围
 */
@ccclass("MaxBoxCC")
@executeInEditMode
export class MaxBoxCC extends Component {
    backupDescribe = "可视范围控制";

    @property({ serializable: true })
    private _bottomOffset = 0;

    @property({ serializable: true })
    private _topOffset = 0;

    @property({ serializable: true }) 
    private _isTop = true;

    @property({ serializable: true })
    private _isBottom = true;

    private _transform: UITransform = null;

    /**空出底部的世界坐标 */
    static worldYBottom(): number {
        return (view.getVisibleSize().height - uiMaxSize().height) / 2;
    }

    /**空出顶部的世界坐标 */
    static worldYTop(): number {
        let h = uiMaxSize().height;
        return (view.getVisibleSize().height - h) / 2 + h;
    }

    @property({
        displayName: "空出顶部"
    })
    set isTop(value: boolean) {
        if (this._isTop == value) return;
        this._isTop = value;
        this.updateView();
    }
    get isTop(): boolean { return this._isTop; }

    @property({
        visible() { return this._isBottom; },
        displayName: "顶部长度偏移"
    })
    set topOffset(value: number) {
        if (this._topOffset == value) return;
        this._topOffset = value;
        this.updateView();
    }
    get topOffset(): number { return this._topOffset; }

    @property({
        displayName: "空出底部"
    })
    set isBottom(value: boolean) {
        if (this._isBottom == value) return;
        this._isBottom = value;
        this.updateView();
    }
    get isBottom(): boolean { return this._isBottom; }

    @property({
        visible() { return this._isBottom; },
        displayName: "底部长度偏移"
    })
    set bottomOffset(value: number) {
        if (this._bottomOffset == value) return;
        this._bottomOffset = value;
        this.updateView();
    }
    get bottomOffset(): number { return this._bottomOffset; }

    onLoad() {
        this._transform = this.getComponent(UITransform);
        if (!this._transform) {
            this._transform = this.addComponent(UITransform);
        }
        this.updateView();
    }

    /**
     * 编辑器模式下更新视图
     */
    onEditorUpdateData() {
        this.updateView();
    }

    /**
     * 更新视图尺寸和位置
     */
    private updateView() {
        if (!this._transform) return;

        let size = uiMaxSize();
        let w = size.width;
        let h = size.height;
        let wH = view.getVisibleSize().height;
        let offset = (wH - h) / 2;
        let y = 0;

        if (!this._isTop) {
            h += offset;
            y += offset / 2;
        } else if (!this._isBottom) {
            h += offset;
            y -= offset / 2;
        } else if (!this._isTop && this._isBottom) {
            h = wH;
        }

        if (offset != 0) {
            if (this._isTop) {
                if (this._topOffset != 0) {
                    h += this._topOffset;
                    y += this._topOffset / 2;
                }
            }
            if (this._isBottom) {
                if (this._bottomOffset != 0) {
                    h += this._bottomOffset;
                    y -= this._bottomOffset / 2;
                }
            }
        }

        this.setPosition(y);
        this.setSize(w, h);
    }

    /**
     * 设置节点位置
     */
    private setPosition(y: number) {
        const pos = this.node.position;
        this.node.setPosition(this.node.position.x, y, this.node.position.z);
    }

    /**
     * 设置节点尺寸
     */
    private setSize(width: number, height: number) {
        this._transform.width = width;
        this._transform.height = height;
    }
}