const canvas = wx.getSharedCanvas();
/** @type { CanvasRenderingContext2D } */
const ctx = canvas.getContext('2d');
import demodata from './render/dataDemo'
const assets = new Map();
function wxImage(source) {
    const image = wx.createImage();
    image.onload = render;
    image.src = source;
    assets.set(source, image);
    return image;
}
function resLoader(source) {
    return assets.has(source) ? assets.get(source) : wxImage(source);
}
function drawImage(source, x, y) {
    const image = resLoader(source);
    ctx.drawImage(image, x, y);
}
function drawAvatar(source, x, y, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, 0, 2 * Math.PI);
    ctx.clip();
    const image = resLoader(source);
    ctx.drawImage(image, x, y, r * 2, r * 2);
    ctx.restore();
}
function drawText(text, x, y, size, color, maxWidth, textAlign) {
    ctx.font = `bold ${size}px Heiti `;
    ctx.fillStyle = '#' + color;
    ctx.textBaseline = 'top';
    ctx.textAlign = textAlign || 'left';
    ctx.fillText(text, x, y, maxWidth);
}
function drawTextImage(text, x, y, size, urlKey, textAlign) {
    var startX = x;
    var len = text.length;
    if (textAlign == 'right') {
        startX -= len * size
    }
    else if (textAlign == 'center') {
        startX -= len / 2 * size
    }
    for (let i = 0; i < len; i++) {
        const textStr = text[i];
        var str = `${urlKey}${textStr}.png`;
        drawImage(str, startX + i * size, y);
    }

}

const utils = {
    byteLength(s) {
        let len = 0;
        for (let i = 0; i < s.length; i++) {
            len += s.charCodeAt(i) > 999 ? 2 : 1;
            if (s.codePointAt(i) > 0xffff) i++;
        }
        return len;
    },
    subByteLen(s, subLen) {
        let len = 0;
        let subStr = '';
        for (let i = 0; i < s.length; i++) {
            subStr += s[i];
            len += s.charCodeAt(i) > 999 ? 2 : 1;
            if (s.codePointAt(i) > 0xffff) {
                subStr += s[i + 1];
                i++;
            }
            if (len >= subLen) break;
        }
        return subStr;
    },
    subNickName(s) {
        return utils.byteLength(s) > 8 ? utils.subByteLen(s, 6) + '...' : s;
    },
};

/** @type {WechatMinigame.UserGameData[]} */
let users = [];
/** @type {WechatMinigame.UserInfo} */
let myself = null;
let offsetY = 0;
//好友排行榜位置信息配置
//列表宽高
const area = {
    x: 0,
    y: 0,
    width: 800,
    height: 800,
};
//每条列表项数据
const userUi = {
    x: 0,
    y: area.y,
    height: 130,
    marginTop: 1,
};
//我的
const myUi = {
    x: userUi.x,
    y: 606,
};

//前3名排行榜位置信息配置
//前3名
const userUi3 = {
    x: 0,
    y: 0,
    width: 140,
    spX: 20,//间隔
};

/**渲染类型，1列表，2前3名 */
var randerType = 1;
function render() {
    if (randerType == 1) {
        render1()
    }
    else if (randerType == 2) {
        render2()
    }
}
/**列表 */
function render1() {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.width, area.height);
    ctx.clip();
    drawUsers();
    ctx.restore();
    // drawMyself();
}
/**前3名 */
function render2() {
    console.log("render2")
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawUsers3();
}

/**
 * @param {WechatMinigame.UserGameData} user
 */
function drawUser(x, y, user, i, color0) {
    drawImage('openDataContext/assets/line' + (i % 4) + '.png', x, y);
    // if (i < 3) {
    //     drawImage(`openDataContext/assets/imgRankBg3.png`, x, y);
    // } else {
    //     drawImage(`openDataContext/assets/imgRankBg.png`, x, y);
    // }
    let ofy = (userUi.height - 42) / 2
    if (i < 3) {
        drawImage(`openDataContext/assets/NO${i + 1}.png`, x + 20, y + ofy);
    } else {
        drawTextImage(`${i + 1}`, x + 48, y + ofy, 26, `openDataContext/assets/rankIndex/rankIndex_`, 'center');
    }
    ofy = (userUi.height - 88) / 2
    drawImage('openDataContext/assets/imgAvatarBg' + (i % 3) + '.png', x + 104, y + ofy);
    drawAvatar(user.avatarUrl, x + 105, y + ofy, 44);

    ofy = (userUi.height - 30) / 2
    drawText(utils.subNickName(user.nickname), x + 200, y + ofy, 30, color0);
    const detail = user.detail;
    ofy = (userUi.height - 48) / 2
    drawTextImage(`${detail.score}`, x + 550, y + ofy, 30, `openDataContext/assets/score/score_`, 'right');
    ofy = (userUi.height - 30) / 2
    drawText('波', x + 560, y + ofy, 30, color0);
}

function drawUsers() {
    users.forEach((user, i) => {
        const x = userUi.x;
        const y = userUi.y + (userUi.height + userUi.marginTop) * i + offsetY;
        if (y < userUi.y - (userUi.height + userUi.marginTop)) return;
        if (y > userUi.y + area.height) return;
        drawUser(x, y, user, i, 'AB6A3D');
    });
}

function drawMyself() {
    if (!myself) return;
    const i = users.findIndex(
        (user) => user.avatarUrl === myself.avatarUrl && user.nickname === myself.nickName
    );
    if (i === -1) return;
    const user = users[i];
    drawUser(myUi.x, myUi.y, user, i, 'AB6A3D');
}

/**
 * @param {WechatMinigame.UserGameData} user
 */
function drawUser3(x, y, user, i, isMy) {
    if (isMy) {
        drawImage(`openDataContext/assets/rank3/imgBgMy.png`, x, y);
        drawImage(`openDataContext/assets/rank3/imgScoreBgMy.png`, x + 31, y + 139);
    }
    else {
        drawImage(`openDataContext/assets/rank3/imgBg.png`, x, y);
        drawImage(`openDataContext/assets/rank3/imgScoreBg.png`, x + 31, y + 139);
    }
    if (i == 0) {
        drawImage(`openDataContext/assets/rank3/rank3Cap.png`, x + 73, y + 15);
    }
    drawImage(`openDataContext/assets/rank3/rankIndex${i + 1}.png`, x + 13, y + 14);
    drawImage(`openDataContext/assets/rank3/imgAvatarBg.png`, x + 37, y + 31);
    drawAvatar(user.avatarUrl, x + 40, y + 35, 30);

    drawText(utils.subNickName(user.nickname), x + 70, y + 105, 18, 'AB6A3D', undefined, 'center');
    const detail = user.detail;
    drawText(`${detail.score}`, x + 70, y + 144, 16, isMy ? '829b35' : 'AB6A3D', undefined, 'center');
}

function drawUsers3() {
    users = users.slice(0, 3)
    users.forEach((user, i) => {
        const x = userUi3.x + (userUi3.spX + userUi3.width) * i;
        const y = userUi3.y;
        drawUser3(x, y, user, i, user.avatarUrl === myself.avatarUrl && user.nickname === myself.nickName);
    });
}

function draw(res) {
    users.length = 0;
    let key = 'level'
    res.data.forEach((user) => {
        // console.log(' user ', user)
        let itemData = user.KVDataList.find((item) => item.key === key)
        // console.log(' itemData ', itemData)
        if (!itemData) return;
        if (!itemData.value) return;
        // const detail = JSON.parse(itemData.value);

        const { avatarUrl, nickname } = user;
        users.push({
            avatarUrl,
            nickname,
            detail: {
                score: itemData.value,
                // updateTime: detail.updateTime,
            },
        });
    });
    users.sort(
        (a, b) =>
            b.detail.score - a.detail.score || a.detail.updateTime - b.detail.updateTime
    );
    //test 加多10个，看看超过列表高度显示情况
    // if (users.length) {
    //     for (let i = 0; i < 10; i++) {
    //         users.push(users[0])
    //     }
    // }
    render();
}

function init() {
    offsetY = 0;
    render();

    // draw(demodata)
    var key = 'level';
    wx.getFriendCloudStorage({
        keyList: [key],
        success(res) {
            draw(res)
        },
        fail(res) {
            ctx.fillText('加载失败', 1028, 463);
        },
    });
    wx.getUserInfo({
        openIdList: ['selfOpenId'],
        success(res) {
            myself = res.data[0];
            render();
        },
    });
}

function scroll(value) {
    if (!isScrollEnable) return;
    offsetY += value;
    offsetY = Math.max(
        offsetY,
        -(userUi.height + userUi.marginTop) * (users.length) + area.height - userUi.marginTop
    );
    offsetY = Math.min(offsetY, 0);
    render();
}

let isScrollEnable = false;
wx.onMessage((res) => {
    console.log("onMessage", res);
    switch (res.event) {
        case 'level': {
            isScrollEnable = true;
            randerType = 1;
            init();
            break;
        }
        case 'render3': {
            isScrollEnable = false;
            randerType = 2;
            init();
            break;
        }
        case 'close': {
            isScrollEnable = false;
            break;
        }
    }
});

init();

const systemInfo = wx.getSystemInfoSync();
const ratio = 1125 / systemInfo.screenWidth;

let lastTouch = 0;
let lastTime = 0;
let frameId = 0;
let rate = 0;
let stopId = 0;
wx.onTouchStart((e) => {
    cancelAnimationFrame(frameId);
    lastTouch = e.changedTouches[0].clientY;
    lastTime = Date.now();
});
wx.onTouchMove((e) => {
    const p = e.changedTouches[0].clientY;
    rate = p - lastTouch;
    scroll((p - lastTouch) * ratio);
    lastTouch = p;
    lastTime = Date.now();
});
wx.onTouchEnd((e) => {
    const p = e.changedTouches[0].clientY;
    if (Date.now() - lastTime < 50) startInertia(rate * ratio);
});

/**
 * @param {number} v
 */
function startInertia(v) {
    v *= 1.3;
    const go = () => {
        scroll(v);
        v -= (v / Math.abs(v)) * 0.3;
        if (Math.abs(v) > 3) {
            frameId = requestAnimationFrame(go);
        }
    };
    frameId = requestAnimationFrame(go);
}
