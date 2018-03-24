'use strict';

var _ = require('lodash');
var consts = require('../consts');
var logger = require("quick-pomelo").logger.getLogger("gamePlay",__filename);

var exp = module.exports;

exp.cardPoints = {};
exp.cardPoints[consts.card.jokerRed] = consts.card.points.length + 1;
exp.cardPoints[consts.card.joker] = consts.card.points.length;
consts.card.points.forEach(function(k, i){
    exp.cardPoints[k] = i;
});

exp.pointIdx2Point = function(i) {
    if (i === consts.card.points.length) {
        return consts.card.joker;
    } else if (i === consts.card.points.length + 1) {
        return consts.card.jokerRed;
    } else {
        return consts.card.points[i];
    }
};

exp._toPointIdx = function(c, isPoint) {
    var p = isPoint ? c : c.substring(1);
    return exp.cardPoints[p];
};

exp.sortCards = function(cards, isPoint) {
    return _.sortBy(cards, function(c){
        return exp._toPointIdx(c, isPoint);
    });
};

exp.autoPlay = function(cards, must) {
    return must ? [cards[0]] : [];
};

exp.checkCardType = function(cards){
    cards.sort();
    var _cards = [];
    var isPz = false;
    var _diff = [];
    if((cards.indexOf("PLP") === 1) && (cards.indexOf("4X") === 1) && (cards.indexOf("4Y") === 1) ){
        return true;  //重炸
    }
    if(cards.indexOf("PLP") == 1){
        isPz = true;
    }
    var _obj = {};
    for(var i = 0;i<cards.length;i++){
        var _card = cards[i];
        if(_card == "PLP"){
            continue;
        }
        var s = _card.substr(1);
        if(s != "X" || s != "Y"){
            if (_diff.indexOf(s) == -1) _diff.push(s);
        }
        if(_obj[s.toString()]){
            _obj[s.toString()].push(s);
            continue;
        }
        _obj[s.toString()] = [s];
    }
    if(_obj['2']){
        if(((_obj['2'].length>=2) && (cards.indexOf("4X") === 1) || (cards.indexOf("4Y") === 1))||_obj["2"].length === 4 ){  //2个2 和1个王  4个2
            return true  
        }
    }
    var count = 0;
    var idxs =_diff.map((p) => exp._toPointIdx(p, true));
    logger.info("===========checkCardType====idxs",idxs);
    for (let i = 1; i < idxs.length; i++) {
        if(idxs[i] === idxs[i-1] + 1) {
            var _k = consts.card.points[idxs[i]];
            var _k1 = consts.card.points[idxs[i-1]+1];
            if(!_k || !_k1){
                continue;
            }
            var k = _k.toString();
            var k1 = _k1.toString();
            if((_obj[k].length ===4 && _obj[k1].length === 4)|| (_obj[k] .length === 4 && isPz == true)){
                return true;
            }
            if(_obj[k].length === 4){
                count+=1;
            }
            if(count === 3){   //三个炸弹
                return true; 
            }
        }
    }
    return false;

}
/**
 * 检查出牌是否正确
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {boolean}
 */
exp.getCardsType = function(cards,isPoint,sorted){
    var _cards = [];
    for(var i = 0;i<cards.length;i++){
        var card = cards[i];
        if(card.indexOf("L")>0){
            var str = card[3];
            str = "0"+str.toString();
            _cards.push(str);
            continue;
        }
        _cards.push(card);
    }
    return _cards;
}

exp.getLzCardsType = function(cards){
    var _cards = [];
    for(var i = 0;i<cards.length;i++){
        var card = cards[i];
        if(card.indexOf("L")>0){
            var str = card.substr(0,2);
            str = str+card[0];
            _cards.push(str);
            continue;
        }
        _cards.push(card);
    }
    return _cards;
}


exp.isCardsValid = function(cards, isPoint, sorted) {
    var res = exp.getHandType(cards, isPoint, sorted) !== -1;
    return res;
};
exp.isSDCardsValid = function(cards, isPoint, sorted) {
    var res = exp.getSDHandType(cards, isPoint, sorted) !== -1;
    return res;
};

exp.isHandThreeStraight = function(cards, isPoint, sorted) {
    if(cards.length < 3) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    var idxs = ps.map((p) => exp._toPointIdx(p, true));
    for (let i = 1; i < idxs.length; i++) {
        if(idxs[i] !== idxs[i-1] + 1) {
            return false;
        }
    }
    if(idxs[idxs.length-1] >= consts.card.points.length - 1) {
        return false;
    }
    return {main: idxs[idxs.length-1], required: cards.length};
};

/**
 * 对比牌型是否大小
 * @param cards
 * @param compared
 * @param isPoint
 * @param sorted
 * @returns {boolean}
 */
exp.isCardsGreater = function(cards, compared, isPoint, sorted) {
    console.log('cards: %j, compared: %j', cards, compared);
    var handInfo = exp.getHandTypeInfo(cards, isPoint, sorted);
    var compHandInfo = exp.getHandTypeInfo(compared, isPoint, sorted);
    if(handInfo.type === consts.card.handTypes.ROCKET) {
        return true;
    }
    if(compHandInfo.type === consts.card.handTypes.ROCKET) {
        return false;
    }
    if(handInfo.type === consts.card.handTypes.BOMB &&
        compHandInfo.type !== consts.card.handTypes.BOMB) {
        return true;
    }
    if(handInfo.type !== compHandInfo.type) {
        return false;
    }
    if(handInfo.info.required &&
        handInfo.info.required !== compHandInfo.info.required) {
        return false;
    }
    return handInfo.info.main > compHandInfo.info.main;
};

exp.isSDCardsGreater = function(cards, compared, isPoint, sorted) {
    console.log('cards: %j, compared: %j', cards, compared);
    var handInfo = exp.getSDHandTypeInfo(cards, isPoint, sorted);
    var compHandInfo = exp.getSDHandTypeInfo(compared, isPoint, sorted);
    if(handInfo.type === consts.card.handTypes.ROCKET) {
        return true;
    }
    if(compHandInfo.type === consts.card.handTypes.ROCKET) {
        return false;
    }
    if(handInfo.type === consts.card.handTypes.BOMB &&
        compHandInfo.type !== consts.card.handTypes.BOMB) {
        return true;
    }
    if(handInfo.type !== compHandInfo.type) {
        return false;
    }
    if(handInfo.info.required &&
        handInfo.info.required !== compHandInfo.info.required) {
        return false;
    }
    return handInfo.info.main > compHandInfo.info.main;
};

exp.isHandThreeStraight = function(cards, isPoint, sorted) {
    if(cards.length < 3) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    var idxs = ps.map((p) => exp._toPointIdx(p, true));
    for (let i = 1; i < idxs.length; i++) {
        if(idxs[i] !== idxs[i-1] + 1) {
            return false;
        }
    }
    if(idxs[idxs.length-1] >= consts.card.points.length - 1) {
        return false;
    }
    return {main: idxs[idxs.length-1], required: cards.length};
};

var handTypes = _.keys(consts.card.handTypes);
var handSDTypes = _.keys(consts.card.handSdTypes)
var handFuncNames = handTypes.map((t) => 'isHand' + t.toLowerCase().split('_').map((s)=>s.charAt(0).toUpperCase() + s.slice(1)).join(''));
var handSDFuncNames = handSDTypes.map((t) => 'isHand' + t.toLowerCase().split('_').map((s)=>s.charAt(0).toUpperCase() + s.slice(1)).join(''));

/**
 * 得到手牌类型
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.getHandType = function(cards, isPoint, sorted) {
    for (var i = 0; i < handTypes.length; i++) {
        if(exp[handFuncNames[i]](cards, isPoint, sorted)) {
            return consts.card.handTypes[handTypes[i]];
        }
    }
    return -1;
};
exp.getSDHandType = function(cards, isPoint, sorted) {
    for (var i = 0; i < handSdTypes.length; i++) {
        if(exp[handSDFuncNames[i]](cards, isPoint, sorted)) {
            return consts.card.handSdTypes[handSdTypes[i]];
        }
    }
    return -1;
};
/**
 * 获取手牌类型详细信息
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.getHandTypeInfo = function(cards, isPoint, sorted) {
    for (var i = 0; i < handTypes.length; i++) {
        var info = exp[handFuncNames[i]](cards, isPoint, sorted);
        if(info) {
            return {type: consts.card.handTypes[handTypes[i]], info: info};
        }
    }
    return null;
};

exp.getSDHandTypeInfo = function(cards, isPoint, sorted) {
    for (var i = 0; i < handSDTypes.length; i++) {
        var info = exp[handSDFuncNames[i]](cards, isPoint, sorted);
        if(info) {
            return {type: consts.card.handSDTypes[handTypes[i]], info: info};
        }
    }
    return null;
};
/**
 * 检查是否是火箭
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandRocket = function(cards, isPoint, sorted) {
    if(cards.length !== 2) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    if((ps[0] === consts.card.joker && ps[1] === consts.card.jokerRed) ||
        (ps[1] === consts.card.joker && ps[0] === consts.card.jokerRed)) {
        return {main: exp._toPointIdx(cards[cards.length-1], isPoint)};
    }
    return false;
};
/**
 * 检查是否是炸弹
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandBomb = function(cards, isPoint, sorted) {
    if(cards.length !== 4) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    if(ps[1] === ps[0] && ps[2] === ps[0] && ps[3] === ps[0]) {
        return {main: exp._toPointIdx(ps[0], true)};
    }
    return false;
};
/**
 * 检查是否单张
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandSolo = function(cards, isPoint, sorted) {
    if(cards.length !== 1) {
        return false;
    }
    return {main: exp._toPointIdx(cards[0], isPoint)};
};

/**
 * 检查是否是单王  
 */
exp.isHandKing = function(cards,isPoint,sorted){
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    if((ps[0] === consts.card.joker || ps[0] === consts.card.jokerRed)){
        return {main: exp._toPointIdx(cards[0], isPoint)};
    }
    return false;
}
/**
 * 检查是否是同花
 */
exp.isHandFlowers = function(cards,isPoint,sorted){
    if(cards.length<=1){
        return false;
    };
    var ps = isPoint ? cards : cards.map((c) => c.substring(0,1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    for(var i= 0;i<ps.length;i++){
        var a = ps[i+1]?ps[i+1]:ps[0];
        var b = ps[i];
        if(a !=b){
            return false;
        }
    }
    return true;
}
/**
 * 检查是否是对子
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandPair = function(cards, isPoint, sorted) {
    if(cards.length !== 2) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    if(ps[1] === ps[0]) {
        return {main: exp._toPointIdx(ps[0], true)};
    }
    return false;
};
/**
 * 检查是否是顺子
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandStraight = function(cards, isPoint, sorted) {
    if(cards.length < 5) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    var idxs = ps.map((p) => exp._toPointIdx(p, true));
    for (let i = 1; i < idxs.length; i++) {
        if(idxs[i] !== idxs[i-1] + 1) {
            return false;
        }
    }
    if(idxs[idxs.length-1] >= consts.card.points.length - 1) {
        return false;
    }
    return {main: idxs[idxs.length-1], required: cards.length};
};
/**
 * 检查底牌是否是顺子
 */
exp.isHandThree = function(cards,num,isPoint,sorted){
    if(cards.length != num){
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    var idxs = ps.map((p) => exp._toPointIdx(p, true));
    for (let i = 1; i < idxs.length; i++) {
        if(idxs[i] !== idxs[i-1] + 1) {
            return false;
        }
    }
    if(idxs[idxs.length-1] >= consts.card.points.length - 1) {
        return false;
    }
    return {main: idxs[idxs.length-1], required: cards.length};
};

/**
 * 检查是否是双对
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandConsecutivePairs = function(cards, isPoint, sorted) {
    if(cards.length < 6 || cards.length % 2 !== 0) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    if(_.indexOf(['2', consts.card.joker, consts.card.jokerRed], ps[ps.length-1]) !== -1) {
        return false;
    }
    for (var i = 0; i < ps.length / 2; i++) {
        if(ps[i*2] !== ps[i*2 + 1]) {
            return false;
        }
        if(i > 0 && exp._toPointIdx(ps[i*2-1], true) + 1 !== exp._toPointIdx(ps[i*2], true)) {
            return false;
        }
    }
    return {main: exp._toPointIdx(ps[ps.length-1], true), required: cards.length/2};
};
/**
 * 检查是否是三张
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandTrio = function(cards, isPoint, sorted) {
    if(cards.length !== 3) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    if(ps[1] === ps[0] && ps[2] === ps[0]) {
        return {main: exp._toPointIdx(ps[0], true)};
    }
    return false;
};


/**
 * 检查是否三带一
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandTrioSolo = function(cards, isPoint, sorted) {
    if(cards.length !== 4) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    if(ps[1] === ps[0] ? (ps[2] === ps[0] && ps[3] !== ps[0]) : (ps[2] === ps[1] && ps[3] === ps[1])) {
        return {main: exp._toPointIdx(ps[1], true)};
    }
    return false;
};

/**
 * 检查是否是三带队
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandTrioPair = function(cards, isPoint, sorted) {
    if(cards.length !== 5) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    if(ps[2] === ps[1] ? (ps[0] === ps[1] && ps[4] === ps[3] && ps[3] !== ps[2]) :
        (ps[0] === ps[1] && ps[3] === ps[2] && ps[4] === ps[2])) {
        return {main: exp._toPointIdx(ps[2], true)};
    }
    return false;
};
/**
 * 检查是否是飞机  333  444
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandAirplane = function(cards, isPoint, sorted) {
    if(cards.length < 6 || cards.length % 3 !== 0) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    for (var i = 0; i < ps.length / 3; i++) {
        if(ps[i*3+2] !== ps[i*3] || ps[i*3+1] !== ps[i*3]) {
            return false;
        }
        if(i > 0 && exp._toPointIdx(ps[i*3-1], true) + 1 !== exp._toPointIdx(ps[i*3], true)) {
            return false;
        }
    }
    if(ps[ps.length -1] === '2') {
        return false;
    }
    return {main: exp._toPointIdx(ps[ps.length-1], true), required: cards.length/3};
};
/**
 * 检查飞机带单张  333 444 56
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandAirplaneSolo = function(cards, isPoint, sorted) {
    if(cards.length < 8 || cards.length % 4 !== 0) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    var trios = [];
    for (let i = 2; i < ps.length; i++) {
        if(ps[i] === ps[i-2] && ps[i-1] === ps[i-2]) {
            if(_.indexOf(trios, ps[i]) === -1) {
                trios.push(ps[i]);
            }
        }
    }
    if(trios.length < 2) {
        return false;
    }
    if(trios[trios.length -1] === '2') {
        return false;
    }
    var trioIdxs = trios.map((p) => exp._toPointIdx(p, true));
    for (let i = 1; i < trioIdxs.length; i++) {
        if(trioIdxs[i] !== trioIdxs[i-1] + 1) {
            return false;
        }
    }
    return {main: trioIdxs[trioIdxs.length-1], required: cards.length/4};
};
/**
 * 检查飞机是否带对 333 444 55 66
 */
exp.isHandAirplanePair = function(cards, isPoint, sorted) {
    if(cards.length < 10 || cards.length % 5 !== 0) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    var trios = [];
    for (let i = 2; i < ps.length; i++) {
        if(ps[i] === ps[i-2] && ps[i-1] === ps[i-2]) {
            if(_.indexOf(trios, ps[i]) === -1) {
                trios.push(ps[i]);
            }
        }
    }
    if(trios.length < 2) {
        return false;
    }
    if(trios[trios.length -1] === '2') {
        return false;
    }
    var trioIdxs = trios.map((p) => exp._toPointIdx(p, true));
    for (let i = 1; i < trioIdxs.length; i++) {
        if(trioIdxs[i] !== trioIdxs[i-1] + 1) {
            return false;
        }
    }
    var pairs = [];
    for (let i = 0; i < ps.length; i++) {
        if(_.indexOf(trios, ps[i]) === -1) {
            pairs.push(ps[i]);
        }
    }
    if(exp._isPairs(pairs)) {
        return {main: trioIdxs[trioIdxs.length-1], required: cards.length/5};
    }
    return false;
};
/**
 * 检查是否是四带一 3333 4,5
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandSpaceShuttleSolo = function(cards, isPoint, sorted) {
    if(cards.length !== 6) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    var fours = [];
    for (let i = 3; i < ps.length; i++) {
        if(ps[i] === ps[i-3] && ps[i-1] === ps[i-3] && ps[i-2] === ps[i-3]) {
            if(_.indexOf(fours, ps[i]) === -1) {
                fours.push(ps[i]);
            }
        }
    }
    if(fours.length < 1) {
        return false;
    }
    return {main: exp._toPointIdx(fours[fours.length-1], true)};
};

exp._isPairs = function(pairs) {
    if(pairs.length % 2 !== 0) {
        return false;
    }
    for (let i = 0; i < pairs.length/2; i++) {
        if(pairs[i*2] !== pairs[i*2+1]) {
            return false;
        }
    }
    return true;
};
/**
 * 检查四带两对    3333  44 55
 * @param cards
 * @param isPoint
 * @param sorted
 * @returns {*}
 */
exp.isHandSpaceShuttlePair = function(cards, isPoint, sorted) {
    if(cards.length !== 8) {
        return false;
    }
    var ps = isPoint ? cards : cards.map((c) => c.substring(1));
    ps = sorted ? ps : exp.sortCards(ps, true);
    var fours = [];
    for (let i = 3; i < ps.length; i++) {
        if(ps[i] === ps[i-3] && ps[i-1] === ps[i-3] && ps[i-2] === ps[i-3]) {
            if(_.indexOf(fours, ps[i]) === -1) {
                fours.push(ps[i]);
            }
        }
    }
    if(fours.length < 1) {
        return false;
    }
    var pairs = [];
    for (let i = 0; i < ps.length; i++) {
        if(_.indexOf(fours, ps[i]) === -1) {
            pairs.push(ps[i]);
        }
    }
    if(exp._isPairs(pairs)) {
        return {main: exp._toPointIdx(fours[fours.length-1], true)};
    }
    return false;
};

exp.arrangeCards = function(cards, sorted) {
    var trios = [], solos = [], pairs = [], straights = [], bombs = [];
    cards = sorted ? cards : exp.sortCards(cards, true);
    var ps = cards.map(exp._toPointIdx);
    // TODO:
    // for (var i = 0; i < ps.length; i++) {
    //  ps[i]
    // }
};


