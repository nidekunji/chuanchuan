import { _decorator, Component, Node, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PositionAdjuster')
export class PositionAdjuster extends Component {
    @property
    topMargin: number = 491; // 顶部边距（像素）
    
    @property
    bottomMargin: number = 193; // 底部边距（像素）
    onLoad() {
        this.adjustPosition();
    }

    adjustPosition() {
        let designHeight = 1335;
        let designWidth = 750;
        let screenHeight = view.getVisibleSize().height;
        let screenWidth = view.getVisibleSize().width;
        let scaleX = screenWidth / designWidth;
        let scaleY = screenHeight / designHeight;
        let scale = Math.min(scaleX, scaleY);
        this.node.setScale(scale, scale, 1);

    //     // 计算实际可用空间
    //     const scaledHeight = designHeight * scale;
    //     const extraSpace = screenHeight - scaledHeight;

    //     // 计算顶部和底部边距在当前缩放下的实际像素值
    //     const scaledTopMargin = this.topMargin * scale;
    //     const scaledBottomMargin = this.bottomMargin * scale;
        
    //     // 计算Y轴位置：从屏幕中心点开始，减去向上偏移量
    //     const yPos = (extraSpace / 2) - scaledTopMargin;
    //     this.node.setPosition(this.node.position.x, yPos);
    }
    
}