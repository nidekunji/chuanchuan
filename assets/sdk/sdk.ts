import { isdk } from "./isdk";
import { wx_sdk } from "./wx_sdk";
import { web_sdk } from "./web_sdk";


export class sdk {

    private static _p: isdk = null;


    static get p(): isdk {
        if (!this._p) {
            this.initP();
        }
        return this._p
    }

    static set p(p: isdk) {
        this._p = p;
    }

    private static initP() {
        if (window['wx']) {
            this._p = new wx_sdk()
        } else {
            this._p = new web_sdk()
        }
    }

    static init(name: string, data: any) {

        this.initP();
    }

}