import style from './style';
import Layout from './engine';
import dataDemo from './render/dataDemo'
const __env = GameGlobal.wx || GameGlobal.tt || GameGlobal.swan;
const sharedCanvas = __env.getSharedCanvas();
const sharedContext = sharedCanvas.getContext('2d');

__env.onMessage(data => {
    if (data.type !== 'engine') {
        console.warn('Open Context get wrong type:', data.type);
        return;
    }

    switch (data.event) {
        case 'viewport':
            updateViewPort(data);
            break;

        case 'level':
            showRankList('level');
            break;

        default:
            break;
    }
});

function draw(template) {
    Layout.clear();
    Layout.init(template, style);
    Layout.layout(sharedContext);
}

function updateViewPort(data) {
    Layout.updateViewPort({
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
    });
}

function layoutOf(itemsList) {
    let out = '<view class="container" id="main"> <view class="rankList"> <scrollview class="list" scrollY="true"> ';
    const datas = itemsList.data;
    if (datas) {
        let item, index = -1;
        const len = datas.length - 1;
        while (index < len) {
            item = datas[index += 1];
            out += ' ';

            if (index < 3) {
                let imageSrc = '';
                switch (index) {
                    case 0: imageSrc = 'openDataContext/Leaderboard_GoldCrown.png'; break;
                    case 1: imageSrc = 'openDataContext/Leaderboard_SilverCrown.png'; break;
                    case 2: imageSrc = 'openDataContext/Leaderboard_BronzeCrown.png'; break;
                    default: break;
                }

                out += ' <view class="listItem"> ';
                out += ' ';
                out += ' <view id="listItemUserData"> <image class="listItemTop3Img" src="' + imageSrc
                    + '"></image> <image class="listHeadImg" src="' + (item.avatarUrl)
                    + '"></image> <text class="listItemName" value="' + (item.nickname)
                    + '"></text> </view> <text class="listItemScore" value="' + '第' + (item.level) + '波'
                    + '"></text> </view> ';
            } else {
                out += ' <view class="listItem"> ';
                out += ' ';
                out += ' <view id="listItemUserData"> <text class="listItemNum" value="' + (index + 1)
                    + '"></text> <image class="listHeadImg" src="' + (item.avatarUrl)
                    + '"></image> <text class="listItemName" value="' + (item.nickname)
                    + '"></text> </view> <text class="listItemScore" value="' + '第' + (item.level) + '波'
                    + '"></text> </view> ';
            }
        }
    }
    out += ' </scrollview></view></view>';
    return out;
}

function renderer(data) {
    const friendsData = { data: [] };// data: [{level,avatarUrl,nickname}, ...]
    for (let i = 0; i < data.length; i++) {
        const level = data[i].KVDataList.length > 0 ? data[i].KVDataList[0].value : '1';
        const item = {};
        item.level = `${level}`;
        item.avatarUrl = data[i].avatarUrl; //'openDataContext/avatar.png'
        item.nickname = data[i].nickname;
        friendsData.data.push(item);
    }
    friendsData.data.sort((a, b) => b.level - a.level);
    draw(layoutOf(friendsData));
}

function showRankList(key) {
    console.log('rank key:', key);
    // let testData = dataDemo.data;
    renderer(dataDemo)

    __env.getFriendCloudStorage({
        keyList: [key],
        success: res => {
            if (!res.data) {
                console.log('rank data is empty!');
                return;
            }
            let data = res.data;
            renderer(data)
            console.log('show rank success');
        },

        fail: err => {
            console.log('rank list show err:', err);
        }
    });
}
