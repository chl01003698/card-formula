'use strict';

var util = require('util');


var exp = module.exports;

exp.sex = {
    MALE: 0,
    FEMALE: 1,
    UNKNOWN: 2
};

exp.binding = {
    types: {
        DEVICE: 0
    }
};

exp.card = {
    suit: {spade: 0, heart: 1, club: 2, diamond: 3, joker: 4},
    pack: [],
    points: ['3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A', '2'],
    joker: 'X',
    jokerRed: 'Y',
    handTypes: {
        ROCKET: 0,
        BOMB: 1,
        SOLO: 2,
        PAIR: 3,
        STRAIGHT: 4,
        CONSECUTIVE_PAIRS: 5,
        TRIO: 6,
        TRIO_SOLO: 7,
        TRIO_PAIR: 8,
        AIRPLANE: 9,
        AIRPLANE_SOLO: 10,
        AIRPLANE_PAIR: 11,
        SPACE_SHUTTLE_SOLO: 12,
        SPACE_SHUTTLE_PAIR: 13,
        FRIED:14        
    },
    handSdTypes:{
        ROCKET: 0,
        BOMB: 1,
        SOLO: 2,
        PAIR: 3,
        STRAIGHT: 4,
        CONSECUTIVE_PAIRS: 5,
        TRIO: 6,
        TRIO_SOLO: 7,
        TRIO_PAIR: 8,
        AIRPLANE: 9,
        AIRPLANE_SOLO: 10,
        AIRPLANE_PAIR: 11,
        SPACE_SHUTTLE_SOLO: 12,
        SPACE_SHUTTLE_PAIR: 13,
        THREE_STRAIGHT:3,
    },
};

exp.quitState = {
    "table":"table",
    "vote":"vote",
    "result":"result"
}
exp.card.points.forEach(function (p) {
    exp.card.pack.push(util.format('%s%s', exp.card.suit.spade, p));
    exp.card.pack.push(util.format('%s%s', exp.card.suit.heart, p));
    exp.card.pack.push(util.format('%s%s', exp.card.suit.club, p));
    exp.card.pack.push(util.format('%s%s', exp.card.suit.diamond, p));
});
exp.card.pack.push(util.format('%s%s', exp.card.suit.joker, exp.card.joker));
exp.card.pack.push(util.format('%s%s', exp.card.suit.joker, exp.card.jokerRed));

exp.gameState = {
    waitToStart: 'waitToStart',
    choosingLord: 'choosingLord',
    playing: 'playing',
    vote:"vote",
    sendCard: "sendCard",
    gameResult: "gameResult", //等待总结算
    gameOver: "gameOver", //整个桌子结束
    tableing :"tableing", //桌子中
    gameing:"gameing", //游戏中
    resulting:"resulting", // 结算中
    voteing:"voteing" //投票中
};
exp.userState = {
    offline: "offline",
    online: "online",
    waiting: "waiting",
    gaming: "gaming"
};

exp.friendState = {
    allowed: 'allowed',//已接受
    invite: 'invite',//邀请中的
};
exp.gameStateChanging = {
    waitToStart: [exp.gameState.playing, exp.gameState.choosingLord],
    choosingLord: [exp.gameState.waitToStart],
    playing: [exp.gameState.choosingLord],
};

exp.routes = {
    client: {
        area: {
            JOIN: 'area.join',          //加入
            READY: 'area.ready',        //准备
            START: 'area.start',        //游戏开始
            QUIT: 'area.quit',          //退出
            LORD_CHOOSED: 'area.lordChoosed', //叫分
            CHOOSE_LORD: 'area.chooseLord', //叫地主
            PLAY: 'area.play',  //玩法
            GAME_OVER: 'area.gameOver', //游戏结束
            VOTE: 'area.vote',    //投票
            RESULT: 'area.result', //单局结算
            TOTAL_RESULT: 'area.totalResult',  //总结算
            CHAT: 'area.chat',  //聊天
            DISSOLUTION: 'area.dissolution', //解散

        },
        table: {
            JOIN: "table.join",                  //加入
            READY: "table.ready",                //准备
            START: "table.start",                //游戏开始
            QUIT: "table.quit",                  //退出
            LORD_CHOOSED: "table.lordChoosed",   //广播玩家状态
            CHOOSE_LORD: 'table.chooseLord',    //给玩家推送按钮
            FLOW_BUREAU: "table.draw",    //流局
            PLAY: "table.play",                  //玩法
            GAME_OVER: "table.gameOver",         //游戏结束
            VOTE: "table.vote",                  //投票
            RESULT: "table.result",              //单局结算
            TOTAL_RESULT: "table.totalResult",   //总结算
            CHAT: "table.chat",                  //聊天
            DISSOLUTION: "table.dissolution",     //解散
            SEND_CARD: "table.sendCard",         //发牌
            IDENTITY: "table.identity",           //广播身份
            VICTORY: "table.victory",             //广播胜利
            BRIGHTCARD: "table.brightCard",         //明牌
            LOOKCARDS: "table.lookCard",   //明牌推送消息按钮
            TOTALMULTIPLE: "table.totalMultiple",  //推送桌面的总倍数
            KICKPULL:"table.kickPull",              //踢拉
            RECONNECTION:"table.reconnection",    //断线重连
            QUIT_TABLE:"table.quit",            //退出
            ADDTIMES:"table.addtimes"  //加倍完成
        },
        user: {
            ONLINE: 'user.online', //在线
            OFFLINE: 'user.offline', //离线消息
        },
        pomelo: {
            DISCONNECT: 'disconnect',
            TIMEOUT: 'timeout',
            ON_KICK: 'onKick',
        }
    },
    server: {
        gate: {
            GET_CONNECTOR: 'gate.gateHandler.getConnector',
        },
        connector: {
            LOGIN: 'connector.entryHandler.login',
            LOGOUT: 'connector.entryHandler.logout',
        },
        player: {
            UPDATE: 'player.playerHandler.update',
        },
        area: {
            CONNECT: 'area.areaHandler.connect',
            SEARCH_JOIN: 'area.areaHandler.searchAndJoin',
            JOIN: 'area.areaHandler.join',
            READY: 'area.areaHandler.ready',
            QUIT: 'area.areaHandler.quit',
            CHOOSE_LORD: 'area.areaHandler.chooseLord',
            PLAY: 'area.areaHandler.play',
            VOTE: 'area.areaHandler.vote', //投票
        },
        table: {
            CONNECT: 'table.tableHandler.connect',
            SEARCH_JOIN: 'table.tableHandler.searchAndJoin',
            JOIN: 'table.tableHandler.join',
            READY: 'table.tableHandler.ready',
            QUIT: 'table.tableHandler.quit',
            CHOOSE_LORD: 'table.tableHandler.chooseLord',
            PLAY: 'table.tableHandler.play',
            VOTE: 'table.tableHandler.vote', //投票
            CONTINUEGAME: "table.tableHandler.continueGame", //继续
        }
    }
};

exp.play = {
    WAIT_TIME: 5000,
    SERVER_TIME_DELAY: 1000*60,
    START_TIME: 2000,
    OUTCARD_TIME: 2000,  //出牌
    VOTE:5*1000*60
};

exp.resp = {
    codes: {
        SUCCESS: 0,
        FAILURE: -1,
        INVALID_ACTION: -2,
        TABLEING: 1   //换在座子里
    }
};

exp.cardType = {
    HandRocke: {
        name: "HandRocke", // 火箭
        multiple: 3
    },

    HandBomb: {
        name: "HandBomb", //炸弹
        multiple: 2,
        mul:3,
        zmul:4,
        softmultiple:1
    },
    HandFried: {
        name: "HandFried", //炸弹
        multiple: 8,
    },
    HandSolo: {
        name: "HandSolo", //单张
        multiple: 0
    },
    HandPair: {
        name: "HandPair", //对子
        multiple: 0
    },
    HandStraight: {
        name: "HandStraight", //顺子
        multiple: 0
    },
    HandConsecutivePairs: {
        name: "HandConsecutivePairs", //双对
        multiple: 0
    },
    HandTrio: {
        name: "HandTrio",   //三张
        multiple: 0
    },
    HandTrioSolo: {
        name: "HandTrioSolo", //三带一
        multiple: 0
    },
    HandTrioPair: {
        name: "HandTrioPair", //三带二
        multiple: 0
    },
    HandAirplane: {
        name: "HandAirplane",  //飞机
        multiple: 0
    },
    HandAirplaneSolo: {
        name: "HandAirplaneSolo",//飞机带单张
        multiple: 0
    },
    HandAirplanePair: {
        name: "HandAirplanePair",//飞机带对
        multiple: 0
    },
    HandSpaceShuttleSolo: {
        name: "HandSpaceShuttleSolo",//四带一
        multiple: 0
    },
    HandSpaceShuttlePair: {
        name: "HandSpaceShuttlePair", //四带两对
        multiple: 0
    },
    spring: {
        name: "spring",              //春天
        multiple: 2
    },
    brightBrand: {
        name: "brightBrand",         //亮牌
        multiple: 1,
    }
};

exp.lowCardType = {
    king: 2, //单王
    pairs: 2, //对子
    three: 3, //3条
    flowers: 3, //同花
    shunza: 3, //顺子
    flush: 3, // 同花顺
    doubleKing: 3,  //双王
}
exp.kickPull = {
    kick: 2,
    pull: 2,
    landlord: 1,
}

exp.multiple = {
    grabLandlord: {
        landOwner: 1,  //叫地主
        landGrab: 2   //抢地主
    }
}
exp.discarded = {
    three:{
        cards:[ //3,4,5
        "03","13","23","33",
        "04","14","24","34",
        "05","15","25","35"], 
        cardCount:13,
        less:0
    },
    four:{
        cards:[ //3,4,5,6
            "03","13","23","33",
            "04","14","24","34",
            "05","15","25","35",
            "06","16","26","36",
            
        ],
        cardCount:12,
        less:-1,
        
    }, 
    five:{
        cards:[ //3.4.5.6.7
            "03","13","23","33",
            "04","14","24","34",
            "05","15","25","35",
            "06","16","26","36",
            "07","17","27","37",
        ], 
        cardCount:10,
        less:1,
    },
    pz:{
        cards:function(){
            var _cards=[];
            for(var i = 0;i<17;i++){
                var str = "-1";
                _cards.push(str);
            }
            return _cards;
        }
    }

}
exp.roomCard = {
    "correlation":"correlation",
    "activity":"activity",
    "common":"common"
},
exp.currencyType={ //扣除优先级，roomGive>systemBind>roomBind>common
    common:'common',            //通用，用户花钱购买的
    roomBind:'roomBind',        //棋牌馆绑定　用户在棋牌馆购买的，
    systemBind:'systemBind',    //系统绑定   系统赠送
    roomGive:'roomGive',        //棋牌馆绑定，棋牌馆赠送
};

exp.propType ={
    noteDevice:'noteDevice',//记牌器
};
