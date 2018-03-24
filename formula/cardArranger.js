'use strict';

var util = require('util');
var _ = require('lodash');
var consts = require('../consts');
var cardFormula = require('./cardFormula');

var exp = module.exports;

exp._findAndRemoveCards = function(keys, cards, isIdx, findOne) {
    var foundPoints = [], found = [], newcards = [], toRemove = [], i;
    keys.forEach(function(k){
        var p = isIdx ? cardFormula.pointIdx2Point(k) : k;
        cards.forEach(function(c, j){
            var cp = c.substring(1);
            if(p === cp) {
                if (findOne && foundPoints.indexOf(cp) !== -1) {
                } else {
                    found.push(c);
                    foundPoints.push(cp);
                    toRemove.push(j);
                }
            }
        });
    });
    for (i = 0; i < cards.length; i++) {
        if(toRemove.indexOf(i) === -1) {
            newcards.push(cards[i]);
        }
    }
    cards.splice(0, cards.length);
    for (i = 0; i < newcards.length; i++) {
        cards.push(newcards[i]);
    }
    return found;
};

exp._findMulti = function(arr, count) {
    var found = [], current = -1, currentCount = 0;
    for (var i = 0; i < arr.length; i++) {
        if(current === arr[i]) {
            currentCount += 1;
        } else {
            current = arr[i];
            currentCount = 1;
        }
        if(currentCount === count) {
            found.push(arr[i]);
        }
    }
    return found;
};

exp._findStraits = function (arr, count, findOne) {
    var found = [];
    var strait = [];
    for (var i = 0; i < arr.length; i++) {
        if(arr[i] === cardFormula.cardPoints['2']) {
            break;
        }
        if(!strait.length) {
            strait.push(arr[i]);
            continue;
        }
        if(strait[strait.length-1] + 1 === arr[i]) {
            strait.push(arr[i]);
        } else if(strait[strait.length-1] === arr[i]) {
            continue;
        } else {
            strait = [arr[i]];
        }
        //logger.debug('strait: %j', strait);
        if(strait.length >= count) {
            found.push(strait);
            strait = [];
            if(findOne) {
                break;
            }
        }
    }
    return found;
};

exp._removeValues = function(arr, toRemove, removeOne) {
    var newarr = [];
    var lastVal = -1;
    for (var i = 0; i < arr.length; i++) {
        if(removeOne && lastVal == arr[i]) {
            newarr.push(arr[i]);
            continue;
        }
        if(toRemove.indexOf(arr[i]) === -1) {
            //logger.debug('push arr[%s]: %s', i, arr[i]);
            newarr.push(arr[i]);
        }
        lastVal = arr[i];
    }
    return newarr;
};

exp._addCardToStraits = function(idxs, straits) {
    var found = true, i, j;
    while(found) {
        found = false;
        for1:
        for (i = 0; i < idxs.length; i++) {
            if(idxs[i] >= cardFormula.cardPoints['2']) {
                break;
            }
            for (j = 0; j < straits.length; j++) {
                if(idxs[i] + 1 === straits[j][0]) {
                    straits[j].splice(0, 0, idxs[i]);
                    idxs = exp._removeValues(idxs, [idxs[i]], true);
                    found = true;
                    break for1;
                }
                if(idxs[i] - 1 === straits[j][straits[j].length-1]) {
                    straits[j].push(idxs[i]);
                    idxs = exp._removeValues(idxs, [idxs[i]], true);
                    found = true;
                    break for1;
                }
            }
        }
    }
    return idxs;
};

exp._addTrioAndCardToStraits = function(idxs, trio, straits) {
    var added = 0;
    for (var i = 0; i < straits.length; i++) {
        if(toadd >= 3) {
            break;
        }
        //logger.debug('straits[%s]: %j', i, straits[i]);
        if(straits[i][0] - 1 === trio) {
            var idx = idxs.indexOf(straits[i][0]-2);
            if(idx !== -1) {
                added += 1;
                var idx1 = idx;
                while(idx1 >= 1 && idxs[idx1 - 1] + 1 === idxs[idx1]) {
                    idx1 = idx1 - 1;
                }
                var toadd = idxs.slice(idx1, idx + 1);
                toadd.push(trio);
                straits[i] = toadd.concat(straits[i]);
                idxs.splice(idx1, idx - idx1 + 1);
            }
        }else if(straits[i][straits[i].length - 1] + 1 === trio) {
            var straitTail = straits[i][straits[i].length - 1];
            var idx = idxs.indexOf(straitTail + 2);
            if(idx !== -1) {
                added += 1;
                var idx1 = idx;
                while(idx1 < idxs.length - 1 && idxs[idx1 + 1] - 1 === idxs[idx1]) {
                    idx1 = idx1 + 1;
                }
                var toadd = idxs.slice(idx, idx1 + 1);
                toadd.splice(0, 0, trio);
                straits[i] = straits[i].concat(toadd);
                idxs.splice(idx, idx1 - idx + 1);
            }
        }
    }
    // add left trio to idxs
    if(added > 0 && added < 3) {
        var leftCount = 3 - added;
        var testAdded = false;
        for (var j = 0; j < idxs.length; j++) {
            if(idxs[j] > trio) {
                testAdded = true;
                if(leftCount === 1) {
                    idxs.splice(j, 0, trio);
                }else {
                    idxs.splice(j, 0, trio, trio);
                }
                break;
            }
        }
        if(!testAdded) {
            if(leftCount === 1) {
                idxs.splice(idxs.length, 0, trio);
            }else {
                idxs.splice(idxs.length, 0, trio, trio);
            }
        }
    }
    return added > 0;
};

exp._promoteSolos = function(straits, solos, pairs) {
    while(true) {
        var found = false;
        for1:
        for (var i = 0; i < solos.length; i++) {
            for (var j = 0; j < straits.length; j++) {
                if(straits[j].length === 5) {
                    continue;
                }
                if(straits[j][0] === solos[i]) {
                    exp._addToIdxs(pairs, solos[i], 1);
                    solos.splice(i, 1);
                    straits[j].splice(0, 1);
                    found = true;
                    break for1;
                }else if(straits[j][straits[j].length-1] === solos[i]) {
                    exp._addToIdxs(pairs, solos[i], 1);
                    solos.splice(i, 1);
                    straits[j].pop();
                    found = true;
                    break for1;
                }
            }
        }
        if(!found) {
            break;
        }
    }
};

exp._promotePairs = function(straits, pairs, trios) {
    while(true) {
        var found = false;
        for1:
        for (var i = 0; i < pairs.length; i++) {
            for (var j = 0; j < straits.length; j++) {
                if(straits[j].length === 5) {
                    continue;
                }
                if(straits[j][0] === pairs[i]) {
                    exp._addToIdxs(trios, pairs[i], 1);
                    pairs.splice(i, 1);
                    straits[j].splice(0, 1);
                    found = true;
                    break for1;
                }else if(straits[j][straits[j].length-1] === pairs[i]) {
                    exp._addToIdxs(trios, pairs[i], 1);
                    pairs.splice(i, 1);
                    straits[j].pop();
                    found = true;
                    break for1;
                }
            }
        }
        if(!found) {
            break;
        }
    }
};

exp._joinStraits = function(straits) {
    while(true) {
        var found = false;
        for11:
        for (var i = 0; i < straits.length; i++) {
            for (var j = i + 1; j < straits.length; j++) {
                if(straits[i][straits[i].length-1] + 1 === straits[j][0]) {
                    var toadd = straits[i].concat(straits[j]);
                    straits.splice(j, 1);
                    straits.splice(i, 1, toadd);
                    found = true;
                    break for11;
                }
            }
        }
        if(!found) {
            break;
        }
    }
};

exp._insertStraits = function(straits, toInsert) {
    for (var i = 0; i < straits.length; i++) {
        if(toInsert[0] < straits[i][0]) {
            straits.splice(i, 0, toInsert);
            return;
        } else if(toInsert[0] === straits[i][0]) {
            straits.splice(toInsert.length < straits[i].length ? i : i + 1, 0, toInsert);
            return;
        }
    }
    straits.push(toInsert);
};

exp._addToIdxs = function(idxs, toAdd, count) {
    var added = false;
    for (var j = 0; j < idxs.length; j++) {
        if(idxs[j] > toAdd) {
            added = true;
            for (var i = 0; i < count; i++) {
                idxs.splice(j, 0, toAdd);
            }
            break;
        }
    }
    if(!added) {
        for (var i = 0; i < count; i++) {
            idxs.push(toAdd);
        }
    }
};

exp._arrangeStraits = function(idxs, trios) {
    //logger.debug('idxs: %j', idxs);
    // straits of 5
    var straits = [], i, j, found;
    while(true) {
        found = exp._findStraits(idxs, 5, true);
        if(found.length) {
            straits.push(found[0]);
            idxs = exp._removeValues(idxs, found[0], true);
        } else {
            break;
        }
    }
    // add card to straits
    idxs = exp._addCardToStraits(idxs, straits);
    // join straits
    exp._joinStraits(straits);
    // check if trios and left cards could make a strait
    while(true) {
        found = false;
        for (i = 0; i < trios.length; i++) {
            if(trios[i] >= cardFormula.cardPoints['2']) {
                break;
            }
            var newidxs = idxs.slice();
            exp._addToIdxs(newidxs, trios[i], 3);

            var anyStraits = exp._findStraits(newidxs, 5, true);
            if(anyStraits.length) {
                found = true;
                trios.splice(i, 1);
                exp._insertStraits(straits, anyStraits[0]);
                idxs = exp._removeValues(newidxs, anyStraits[0], true);
                break;
            }
        }
        if(!found) {
            break;
        }
    }
    // check if trios and left cards could extends a strait
    while(true) {
        found = false;
        for (i = 0; i < trios.length; i++) {
            if(trios[i] >= cardFormula.cardPoints['2']) {
                break;
            }

            var added = exp._addTrioAndCardToStraits(idxs, trios[i], straits);
            if(added) {
                found = true;
                trios.splice(i, 1);
                break;
            }
        }
        if(!found) {
            break;
        }
    }
    //logger.debug('straits: %j, solos: %j, pairs: %j', straits, [], []);
    // add card to straits
    idxs = exp._addCardToStraits(idxs, straits);
    // join straits
    exp._joinStraits(straits);
    //logger.debug('straits: %j, solos: %j, pairs: %j', straits, [], []);
    // pairs
    var pairs = exp._findMulti(idxs, 2);
    // solos
    var solos = exp._removeValues(idxs, pairs);
    console.log('after _addCardToStraits straits: %j, solos: %j, pairs: %j', straits, solos, pairs);
    exp._promoteSolos(straits, solos, pairs);
    console.log('after _promoteSolos straits: %j, solos: %j, pairs: %j', straits, solos, pairs);
    exp._promotePairs(straits, pairs, trios);
    console.log('after _promotePairs straits: %j, solos: %j, pairs: %j', straits, solos, pairs);
    // consecutive pairs from pairs
    var consPairs = exp._findStraits(pairs, 3);
    for (i = 0; i < consPairs.length; i++) {
        pairs = exp._removeValues(pairs, consPairs[i]);
    }
    // consecutive pairs from straits
    while(true) {
        found = false;
        for (i = 1; i < straits.length; i++) {
            if(straits[i-1][0] === straits[i][0] &&
                straits[i-1][straits[i-1].length - 1] === straits[i][straits[i].length - 1]) {
                found = true;
                exp._insertStraits(consPairs, straits[i-1]);
                straits.splice(i-1, 2);
                break;
            }
        }
        if(!found) {
            break;
        }
    }
    return {
        'straits': straits,
        'consPairs': consPairs,
        'pairs': pairs,
        'solos': solos,
    };
};

// exp.card = {
//     suit : {spade : 0, heart : 1, club : 2, diamond : 3, joker : 4},
//     pack : [],
//     points : ['3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A', '2'],
//     joker: 'X',
//     jokerRed: 'Y',
//     handTypes: {
//         ROCKET: 0,
//         BOMB: 1,
//         SOLO: 2,
//         PAIR: 3,
//         STRAIGHT: 4,
//         CONSECUTIVE_PAIRS: 5,
//         TRIO: 6,
//         TRIO_SOLO: 7,
//         TRIO_PAIR: 8,
//         AIRPLANE: 9,
//         AIRPLANE_SOLO: 10,
//         AIRPLANE_PAIR: 11,
//         SPACE_SHUTTLE_SOLO: 12,
//         SPACE_SHUTTLE_PAIR:13,
//     }
// };

exp.getMultiCards = function(playerCards,count){

    var MultArr = [];

    var cards = playerCards.slice();
    var ps = cards.map((c) => c.substring(1));
    var idxs = ps.map((p) => cardFormula._toPointIdx(p, true));
    idxs.sort(function (a, b) { return a - b });

    var MultIndexs = exp._findMulti(idxs, count);
    idxs = exp._removeValues(idxs, MultIndexs);

    MultIndexs.forEach(function (idx) {
        MultArr.push(exp._findAndRemoveCards([idx], playerCards, true));
    });

    return MultArr;

};
exp.getTargetCards = function(playerCards,targetCards) {

    var retArr = [];
    var res ;

    var handType = cardFormula.getHandType(targetCards);

    if(targetCards.length > playerCards.length){

        res = exp.arrangeCards(playerCards);


        for (var index in res.bombs) {
            retArr.push(res.bombs[index]);
        }
        for (var index in res.rocket) {
            retArr.push(res.rocket[index]);
        }

        return retArr;

    }


    switch(handType){
        case  consts.card.handTypes.ROCKET: {
            return retArr;

        }break;
        case  consts.card.handTypes.BOMB:{

            res = exp.arrangeCards(playerCards);

            for(var index in res.bombs){
                var bomb = res.bombs[index];
                if(cardFormula.isCardsGreater(bomb, targetCards, false, true)){
                    retArr.push(bomb);
                    
                }
            }
        }break;
        case  consts.card.handTypes.SOLO:{
            
            res = exp.arrangeCards(playerCards);

            for (var index in res.solos) {
                var solo = res.solos[index];
                if (cardFormula.isCardsGreater(solo, targetCards, false, true)) {
                    retArr.push(solo);
                }
            }

            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;

        case  consts.card.handTypes.PAIR:{
            
            var pairsArr = exp.getMultiCards(playerCards,2);

            for (var index in pairsArr) {
                var pair = pairsArr[index];
                if (cardFormula.isCardsGreater(pair, targetCards, false, true)) {
                    retArr.push(pair);

                }
            }
            res = exp.arrangeCards(playerCards);
            
            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.STRAIGHT:{

            var len = targetCards.length;
            
            var foundStraits =exp._findStraits(playerCards, len, true);


            res = exp.arrangeCards(foundStraits);

            for (var index in foundStraits) {
                var foundStrait = foundStraits[index];
                if (cardFormula.isCardsGreater(foundStrait, targetCards, false, true)) {
                    retArr.push(foundStrait);

                }
            }
            
            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.CONSECUTIVE_PAIRS:{
            
            res = exp.arrangeCards(playerCards);

            for (index in res.consPairs) {
                var consPair = res.consPairs[index];
                if (cardFormula.isCardsGreater(consPair, targetCards, false, true)) {
                    retArr.push(consPair);

                }
            }

            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.TRIO:{
            
            var triosArr = exp.getMultiCards(playerCards,3);
            for (var index in triosArr) {
                var trio = triosArr[index];
                if (cardFormula.isCardsGreater(trio, targetCards, false, true)) {
                    retArr.push(trio);
                }
            }
            res = exp.arrangeCards(playerCards);
            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.TRIO_SOLO:{
            
            res = exp.arrangeCards(playerCards);

            for (var index in res.trios) {
                var trio = res.trios[index];
                for (var vindex in res.solos) {
                    var solo = res.solos[vindex];
                    trio.concat(solo)
                    if (cardFormula.isCardsGreater(trio, targetCards, false, true)) {
                        retArr.push(trio);
                    }
                }  
            }
            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;

        case  consts.card.handTypes.TRIO_PAIR:{
            
            res = exp.arrangeCards(playerCards);

            for (var index in res.trios) {
                var trio = res.trios[index];
                for (var vindex in res.solos) {
                    var solo = res.solos[vindex];
                    if (cardFormula.isCardsGreater(trio, targetCards, false, true)) {
                        retArr.push(trio);
                    }
                }  
            }

            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.AIRPLANE:{
            
            res = exp.arrangeCards(playerCards);

            for (var index in res.airplanes) {

                var airplane = res.airplanes[index];
            
                if (cardFormula.isCardsGreater(airplane, targetCards, false, true)) {
                    retArr.push(airplane);
                }
            }

            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.AIRPLANE:{
            
            res = exp.arrangeCards(playerCards);

            for (var airplane in res.airplanes) {
            
                if (cardFormula.isCardsGreater(airplane, targetCards, false, true)) {
                    retArr.push(airplane);
                }
            }

            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.AIRPLANE_SOLO:{
            
            res = exp.arrangeCards(playerCards);

            var count = 2;

            if(targetCards.length == 8){
                count = 2;
            }else if(targetCards.length == 12){
                count = 3;
            }else if(targetCards.length == 16){
                count = 4;
            }else if(targetCards.length == 20){
                count = 5;
            }
                

            for (var i in res.airplanes) {
                var airplane = res.airplanes[i];

                for (var index = 0; index <  res.solos.length-count; index++) {
                    for (var vindex = 0; vindex <  count; vindex++) {
                        airplane.concat( res.solos[vindex]);
                   
                    }
                    if (cardFormula.isCardsGreater(airplane, targetCards, false, true)) {
                        retArr.push(airplane);

                    }

                }
            
              
            }

            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.AIRPLANE_PAIR:{
            
            res = exp.arrangeCards(playerCards);
            var count = 2;
            if(targetCards.length == 10){
                count = 2;

            }else if(targetCards.length == 15){
                count = 3;

            }else if(targetCards.length == 20){
                count = 4;
            }

            for (var i in res.airplanes) {
                var airplane = res.airplanes[i];
            
                for (var index = 0; index <  res.pairs.length-count; index++) {
                    for (var vindex = 0; vindex <  count; vindex++) {
                        airplane.concat( res.pairs[vindex]);
                   
                    }
                    if (cardFormula.isCardsGreater(airplane, targetCards, false, true)) {
                        retArr.push(bomb);

                    }

                }
            
                if (cardFormula.isCardsGreater(airplane, targetCards, false, true)) {
                    retArr.push(airplane);
                }
            }

            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.SPACE_SHUTTLE_SOLO:{
            
            res = exp.arrangeCards(playerCards);
            
            if(playerCards.length >= 6)
            {
                for (var i in res.bombs) {
                    var bomb = res.bombs[i];
                    for (var index = 0; index <  res.solos.length-1; index++) {
                        bomb.concat( res.solos[index]);
                        bomb.concat( res.solos[index+1]);
                        if (cardFormula.isCardsGreater(bomb, targetCards, false, true)) {
                            retArr.push(bomb);
    
                        }
    
                    }
                       
                }
            }
        
            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;
        case  consts.card.handTypes.SPACE_SHUTTLE_PAIR:{
            res = exp.arrangeCards(playerCards);
            
            if(playerCards.length >= 8)
            {
                for (var i in res.bombs) {
                    var bomb = res.bombs[i];
                    for (var index = 0; index <  res.pairs.length-1; index++) {
                        bomb.concat( res.pairs[index]);
                        bomb.concat( res.pairs[index+1]);
                        if (cardFormula.isCardsGreater(bomb, targetCards, false, true)) {
                            retArr.push(bomb);
    
                        }
    
                    }
                       
                }
            }
        
            for (var index in res.bombs) {
                retArr.push(res.bombs[index]);
            }
            for (var index in res.rocket) {
                retArr.push(res.rocket[index]);
            }
        } break;

      


    }

    return retArr;




};
exp.arrangeCards = function(cards) {
    cards = cards.slice();
    var arranged = {
        rocket: [],
        bombs: [],
        airplanes: [],
        trios: [],
        straits: [],
        consPairs: [],
        pairs: [],
        solos: [],
    };
    if(!cards || !cards.length) {
        return arranged;
    }
    var ps = cards.map((c) => c.substring(1));
    var idxs = ps.map((p) => cardFormula._toPointIdx(p, true));
    idxs.sort(function(a, b){return a - b});
    // rocket
    if(idxs.length >= 2 && idxs[idxs.length-1] === cardFormula.cardPoints[consts.card.jokerRed] &&
        idxs[idxs.length-2] === cardFormula.cardPoints[consts.card.joker]) {
        arranged.rocket.push(exp._findAndRemoveCards([consts.card.joker, consts.card.jokerRed], cards));
        idxs = idxs.slice(0, idxs.length-2);
    }
    // bombs
    var bombs = exp._findMulti(idxs, 4);
    idxs = exp._removeValues(idxs, bombs);
    bombs.forEach(function(idx){
        arranged.bombs.push(exp._findAndRemoveCards([idx], cards, true));
    });
    // trios and airplanes
    var trios = exp._findMulti(idxs, 3);
    var airplanes = exp._findStraits(trios, 2);
    idxs = exp._removeValues(idxs, trios);
    for (var i = 0; i < airplanes.length; i++) {
        trios = exp._removeValues(trios, airplanes[i]);
    }
    airplanes.forEach(function(idxs){
        arranged.airplanes.push(exp._findAndRemoveCards(idxs, cards, true));
    });
    // straits, pairs, consecutive pairs, solos
    var arrangeResult = exp._arrangeStraits(idxs, trios);
    trios.forEach(function(idx){
        arranged.trios.push(exp._findAndRemoveCards([idx], cards, true));
    });
    arrangeResult.straits.forEach(function(idxs){
        arranged.straits.push(exp._findAndRemoveCards(idxs, cards, true, true));
    });
    arrangeResult.pairs.forEach(function(idx){
        arranged.pairs.push(exp._findAndRemoveCards([idx], cards, true));
    });
    arrangeResult.consPairs.forEach(function(idxs){
        arranged.consPairs.push(exp._findAndRemoveCards(idxs, cards, true));
    });
    arrangeResult.solos.forEach(function(idx){
        arranged.solos.push(exp._findAndRemoveCards([idx], cards, true, true));
    });
    if(cards.length) {
        console.log('cards must be empty when arranged.');
    }
    return arranged;
};
exp.arrangeCardsExt = function(cards) {
    cards = cards.slice();
    var arranged = {
        rocket: [],
        bombs: [],
        airplanes: [],
        trios: [],
        straits: [],
        consPairs: [],
        pairs: [],
        solos: [],
    };
    if(!cards || !cards.length) {
        return arranged;
    }
    var ps = cards.map((c) => c.substring(1));
    var idxs = ps.map((p) => cardFormula._toPointIdx(p, true));
    idxs.sort(function(a, b){return a - b});
    // rocket
    if(idxs.length >= 2 && idxs[idxs.length-1] === cardFormula.cardPoints[consts.card.jokerRed] &&
        idxs[idxs.length-2] === cardFormula.cardPoints[consts.card.joker]) {
        arranged.rocket.push(exp._findAndRemoveCards([consts.card.joker, consts.card.jokerRed], cards));
        idxs = idxs.slice(0, idxs.length-2);
    }
    // bombs
    var bombs = exp._findMulti(idxs, 4);
    idxs = exp._removeValues(idxs, bombs);
    bombs.forEach(function(idx){
        arranged.bombs.push(exp._findAndRemoveCards([idx], cards, true));
    });
    // trios and airplanes
    var trios = exp._findMulti(idxs, 3);
    var airplanes = exp._findStraits(trios, 2);
    idxs = exp._removeValues(idxs, trios);
    for (var i = 0; i < airplanes.length; i++) {
        trios = exp._removeValues(trios, airplanes[i]);
    }
    airplanes.forEach(function(idxs){
        arranged.airplanes.push(exp._findAndRemoveCards(idxs, cards, true));
    });
    // straits, pairs, consecutive pairs, solos
    var arrangeResult = exp._arrangeStraits(idxs, trios);
    trios.forEach(function(idx){
        arranged.trios.push(exp._findAndRemoveCards([idx], cards, true));
    });
    arrangeResult.straits.forEach(function(idxs){
        arranged.straits.push(exp._findAndRemoveCards(idxs, cards, true, true));
    });
    arrangeResult.pairs.forEach(function(idx){
        arranged.pairs.push(exp._findAndRemoveCards([idx], cards, true));
    });
    arrangeResult.consPairs.forEach(function(idxs){
        arranged.consPairs.push(exp._findAndRemoveCards(idxs, cards, true));
    });
    arrangeResult.solos.forEach(function(idx){
        arranged.solos.push(exp._findAndRemoveCards([idx], cards, true, true));
    });
    if(cards.length) {
        console.log('cards must be empty when arranged.');
    }
    return arranged;
};

