import { Vec3, EventTouch, Quat, Component, Camera, _decorator, view, screen } from "cc";
const _worldPos = new Vec3()
const { ccclass, property, requireComponent } = _decorator;

@ccclass("CameraByCanvasSize")
@requireComponent(Camera)
export class CameraByCanvasSize extends Component {


    protected __preload(): void {
        let camera = this.getComponent(Camera)!
        const size = screen.windowSize;
        camera.orthoHeight = size.height / view.getScaleY() / 2;

        this.node.getWorldPosition(_worldPos);
        camera.node.setWorldPosition(_worldPos.x, _worldPos.y, 1000);
    }
}