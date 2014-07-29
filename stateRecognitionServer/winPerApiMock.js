var http = require('http');
var request = require('request');
var querystring = require('querystring');
var url = require('url');
var MONTE_CARLO_LOOP = 10000;

http.createServer(function (req, res) {
	if (req.method == 'POST') {
		var body = '';
		req.on('data', function (data) { body += data; });
		req.on('end', function(){
			var data = JSON.parse(body);
			var players = JSON.parse(body).players;
			for (var i=0; i<players.length; i++) {
				if (players[i].isActive)  {
					players[i].win = Math.floor(Math.random()*1000)/10;
					players[i].tie = Math.floor(Math.random()*100)/10;
				}
			}
			sendResponse(res, {players: players})
		});
	} else if(req.method == 'GET') {
		var url_parts = url.parse(req.url,true);
		var data = JSON.parse(url_parts.query.data);
		var players = data.players;
		for (var i=0; i<players.length; i++) {
			if (players[i].isActive == true)  {
				players[i].win = Math.floor(Math.random()*1000)/10;
				players[i].tie = Math.floor(Math.random()*100)/10;
			}
		}
		sendResponse(res, {players: players})
	}

}).listen(9000);

var obj = {
	pot: 3,
	board: ['As', 'Kh' , '7d'],
	suggestTargetId: 0,
	players: [
		{
			id: 0,
			isActive: true,
			win: null,
			tie: null,
			activeRate: { game: 0, preFlopActive: 0, flopActive:0, turnActive:0, riverActive: 0 },
			hand: [null, 'Kd']
		},
		{
			id: 1,
			isActive: true,
			win: null,
			tie: null,
			activeRate: { game: 0, preFlopActive: 0, flopActive:0, turnActive:0, riverActive: 0 },
			hand: null
		}
	]
};

//getWinPer(obj);
//console.log(obj);

// suggest(obj);
function suggest(obj) {
	getWinPer(obj);
	var state = getStateFromBoard(obj.board);

	console.log(betSuggestFromWinPer(obj));
}

function betSuggestFromWinPer(obj) {
	var winPer = obj.players[obj.suggestTargetId].win / 100;
	console.log('winPer = ' + winPer);
	var pot = obj.pot;
	var maxExp = -100000;
	var bestBetPer = 0;
	var betOption;
	if (winPer < 0.6) {
		betOption = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
	}
	for (var key in betOption) {
		var betPer = betOption[key];
		var exp = (pot + pot*betPer)*winPer - pot*betPer*(1-winPer);
		console.log('betPer = ' + betPer + ', exp = ' + exp);
		if (maxExp < exp) {
			maxExp = exp;
			bestBetPer = betPer;
		}
	}

	return bestBetPer;
}
function getStateFromBoard(board) {
	switch (board.length){
		case 0:
			return 'preFlop';
		case 3:
			return 'flop';
		case 4:
			return 'turn';
		case 5:
			return 'river';
	}
}


function getWinPer(obj) {
	var winCount = {};
	var tieCount = {};
	var deck = makeDeck(obj.board, obj.players); // deckは外に出たカードを除いたトランプデッキ
	var originalBoard = obj.board;
	var originalHand = {};
	for (var key in obj.players) {
		originalHand[obj.players[key].id] = obj.players[key].hand;
	}

	// モンテカルロループ開始！
	for (var i=0; i<MONTE_CARLO_LOOP; i++) {
		var verificationDeck = [].concat(deck);
		obj.board            = [].concat(originalBoard);
		for (var key in obj.players) {
			if (originalHand[obj.players[key].id] == null && obj.players[key].isActive == true) { // ランダムハンドだ！
				obj.players[key].hand = [];
				var cardPosition = Math.floor(Math.random() * verificationDeck.length);
				obj.players[key].hand.push(verificationDeck[cardPosition]);
				verificationDeck.splice(cardPosition, 1);
				var cardPosition = Math.floor(Math.random() * verificationDeck.length);
				obj.players[key].hand.push(verificationDeck[cardPosition]);
				verificationDeck.splice(cardPosition, 1);
			} else if (originalHand[obj.players[key].id].length == 1 || originalHand[obj.players[key].id][1] == null) {
				obj.players[key].hand = [originalHand[obj.players[key].id][0]];
				var cardPosition = Math.floor(Math.random() * verificationDeck.length);
				obj.players[key].hand[1] = verificationDeck[cardPosition];
				verificationDeck.splice(cardPosition, 1);
			} else if (originalHand[obj.players[key].id][0] == null) {
				obj.players[key].hand = ['',originalHand[obj.players[key].id][1]];
				var cardPosition = Math.floor(Math.random() * verificationDeck.length);
				obj.players[key].hand[0] = verificationDeck[cardPosition];
				verificationDeck.splice(cardPosition, 1);
			}
			console.log(obj.players[key].hand);
		}
		while (obj.board.length < 5) {
			var cardPosition = Math.floor(Math.random() * verificationDeck.length);
			obj.board.push(verificationDeck[cardPosition]);
		}
		// 準備ができたら勝者を求めよう!
		getPlayersPointAndKicker(obj);
		var winPlayers = getWinPlayer(obj);
		if (winPlayers.length == 1) {
			if (!winCount[winPlayers[0].id]) winCount[winPlayers[0].id] = 0;
			winCount[winPlayers[0].id] += 1;
		} else {
			for (var key in winPlayers) {
				if (!tieCount[winPlayers[key].id]) tieCount[winPlayers[key].id] = 0;
				tieCount[winPlayers[key].id] += 1;
			}
		}
	}
	for (var key in obj.players) {
		if (obj.players[key].isActive == true) { // 参加プレイヤー
			if (!winCount[obj.players[key].id] && !tieCount[obj.players[key].id]) {
				obj.players[key].win = 0.0;
			} else {
				if (!winCount[obj.players[key].id]) winCount[obj.players[key].id] = 0;
				if (!tieCount[obj.players[key].id]) tieCount[obj.players[key].id] = 0;
				obj.players[key].win = Math.round((winCount[obj.players[key].id] + tieCount[obj.players[key].id])/ MONTE_CARLO_LOOP * 1000) / 10;
			}
			if (!tieCount[obj.players[key].id]) {
				obj.players[key].tie = 0.0;
			} else {
				obj.players[key].tie = Math.round(tieCount[obj.players[key].id] / MONTE_CARLO_LOOP * 1000) / 10;
			}
		} else { // 不参加プレイヤー
			obj.players[key].win = 0.0;
			obj.players[key].tie = 0.0;
		}
	}
	// 勝率計算が終わった後の処理
	obj.board = originalBoard;
	for (var key in obj.players) {
		obj.players[key].hand = originalHand[obj.players[key].id];
	}
}

function makeDeck(board, players) {
	var trumps = [
		'As','2s','3s','4s','5s','6s','7s','8s','9s','Ts','Js','Qs','Ks',
		'Ah','2h','3h','4h','5h','6h','7h','8h','9h','Th','Jh','Qh','Kh',
		'Ad','2d','3d','4d','5d','6d','7d','8d','9d','Td','Jd','Qd','Kd',
		'Ac','2c','3c','4c','5c','6c','7c','8c','9c','Tc','Jc','Qc','Kc'
	];
	for (var key in board) {
		trumps.splice(trumps.indexOf(board[key]), 1);
	}
	for (var key in players) {
		if (players[key].hand == null) continue;
		trumps.splice(trumps.indexOf(players[key].hand[0]), 1);
		trumps.splice(trumps.indexOf(players[key].hand[1]), 1);
	}
	return trumps;
}

function getWinPlayer(obj) {
	var winPlayers = [];
	for (var key in obj.players) {
		if (obj.players.isActive == false) continue;
		winPlayers = updateWinPlayers(winPlayers, obj.players[key]);
	}
	return winPlayers;
}

function updateWinPlayers(winPlayers, player) {
	if (winPlayers.length == 0) {
		winPlayers.push(player);
	} else {
		var champion = winPlayers[0];
		if (champion.pointAndKicker.point < player.pointAndKicker.point) {
			return [player];
		} else if (champion.pointAndKicker.point == player.pointAndKicker.point) {
			return getSamePointWinner(winPlayers, player);
		}
	}
	return winPlayers;
}

function getSamePointWinner(winPlayers, player) {
	var champion = winPlayers[0];
	switch (champion.pointAndKicker.point){
	case 0: // ハイカード
		for (var i = 0; i<5; i++) {
			if (getNumFromCard(champion.pointAndKicker.kicker[i]) > getNumFromCard(player.pointAndKicker.kicker[i])) {
				return winPlayers;
			} else if (getNumFromCard(champion.pointAndKicker.kicker[i]) < getNumFromCard(player.pointAndKicker.kicker[i])) {
				return [player]
			}
		}
		winPlayers.push(player);
		return winPlayers;

	case 1: // ワンペア
		if (getNumFromCard(champion.pointAndKicker.pairNumString) > getNumFromCard(player.pointAndKicker.pairNumString)) {
			return winPlayers;
		} else if (getNumFromCard(champion.pointAndKicker.pairNumString) < getNumFromCard(player.pointAndKicker.pairNumString)) {
			return [player]
		}
		for (var i = 0; i<3; i++) {
			if (getNumFromCard(champion.pointAndKicker.kicker[i]) > getNumFromCard(player.pointAndKicker.kicker[i])) {
				return winPlayers;
			} else if (getNumFromCard(champion.pointAndKicker.kicker[i]) < getNumFromCard(player.pointAndKicker.kicker[i])) {
				return [player]
			}
		}
		winPlayers.push(player);
		return winPlayers;

	case 2: // ツーペア
		for (var i = 0; i<2; i++) {
			if (getNumFromCard(champion.pointAndKicker.twoPairStringNum[i]) > getNumFromCard(player.pointAndKicker.twoPairStringNum[i])) {
				return winPlayers;
			} else if (getNumFromCard(champion.pointAndKicker.twoPairStringNum[i]) < getNumFromCard(player.pointAndKicker.twoPairStringNum[i])) {
				return [player]
			}
		}
		if (getNumFromCard(champion.pointAndKicker.kicker[0]) > getNumFromCard(player.pointAndKicker.kicker[0])) {
			return winPlayers;
		} else if (getNumFromCard(champion.pointAndKicker.kicker[0]) < getNumFromCard(player.pointAndKicker.kicker[0])) {
			return [player]
		}
		winPlayers.push(player);
		return winPlayers;

	case 3: // スリーカード
		if (getNumFromCard(champion.pointAndKicker.numStringThere) > getNumFromCard(player.pointAndKicker.numStringThere)) {
			return winPlayers;
		} else if (getNumFromCard(champion.pointAndKicker.numStringThere) < getNumFromCard(player.pointAndKicker.numStringThere)) {
			return [player]
		}
		for (var i = 0; i<2; i++) {
			if (getNumFromCard(champion.pointAndKicker.kicker[i]) > getNumFromCard(player.pointAndKicker.kicker[i])) {
				return winPlayers;
			} else if (getNumFromCard(champion.pointAndKicker.kicker[i]) < getNumFromCard(player.pointAndKicker.kicker[i])) {
				return [player]
			}
		}
		winPlayers.push(player);
		return winPlayers;

	case 4: // ストレート
		if (getNumFromCard(champion.pointAndKicker.kicker[0]) > getNumFromCard(player.pointAndKicker.kicker[0])) {
			return winPlayers;
		} else if (getNumFromCard(champion.pointAndKicker.kicker[0]) < getNumFromCard(player.pointAndKicker.kicker[0])) {
			return [player]
		}
		winPlayers.push(player);
		return winPlayers;

	case 5: // フラッシュ
		for (var i = 0; i<5; i++) {
			if (getNumFromCard(champion.pointAndKicker.kicker[i]) > getNumFromCard(player.pointAndKicker.kicker[i])) {
				return winPlayers;
			} else if (getNumFromCard(champion.pointAndKicker.kicker[i]) < getNumFromCard(player.pointAndKicker.kicker[i])) {
				return [player]
			}
		}
		winPlayers.push(player);
		return winPlayers;

	case 6: // フルハウス
		if (getNumFromCard(champion.pointAndKicker.numStringThere) > getNumFromCard(player.pointAndKicker.numStringThere)) {
			return winPlayers;
		} else if (getNumFromCard(champion.pointAndKicker.numStringThere) < getNumFromCard(player.pointAndKicker.numStringThere)) {
			return [player]
		}
		if (getNumFromCard(champion.pointAndKicker.numStringTwo) > getNumFromCard(player.pointAndKicker.numStringTwo)) {
			return winPlayers;
		} else if (getNumFromCard(champion.pointAndKicker.numStringTwo) < getNumFromCard(player.pointAndKicker.numStringTwo)) {
			return [player]
		}
		winPlayers.push(player);
		return winPlayers;

	case 7: // フォーカード
		if (getNumFromCard(champion.pointAndKicker.numString) > getNumFromCard(player.pointAndKicker.numString)) {
			return winPlayers;
		} else if (getNumFromCard(champion.pointAndKicker.numString) < getNumFromCard(player.pointAndKicker.numString)) {
			return [player]
		}
		if (getNumFromCard(champion.pointAndKicker.kicker[0]) > getNumFromCard(player.pointAndKicker.kicker[0])) {
			return winPlayers;
		} else if (getNumFromCard(champion.pointAndKicker.kicker[0]) < getNumFromCard(player.pointAndKicker.kicker[0])) {
			return [player]
		}
		winPlayers.push(player);
		return winPlayers;

	case 8: // ストレートフラッシュ
		if (getNumFromCard(champion.pointAndKicker.kicker[0]) > getNumFromCard(player.pointAndKicker.kicker[0])) {
			return winPlayers;
		} else if (getNumFromCard(champion.pointAndKicker.kicker[0]) < getNumFromCard(player.pointAndKicker.kicker[0])) {
			return [player]
		}
		winPlayers.push(player);
		return winPlayers;
	}
	winPlayers.push(player);
	return winPlayers;
}

function getPlayersPointAndKicker(obj) {
	for (var key in obj.players) {
		if (obj.players.isActive == false) continue;
		var pointAndKicker = getPointAndKicker(obj.board, obj.players[key].hand);
		obj.players[key].pointAndKicker = pointAndKicker;
	}
}


function getPointAndKicker(board, hand){
	var sevenBord = createSevenBoard(board, hand);
	this.hasStraitFlush = hasStraitFlush(sevenBord);
	if (this.hasStraitFlush.result == true) {
		//console.log('has StraitFlush');
		//console.log(this.hasStraitFlush.kicker);
		return {
			point: 8,
			kicker: this.hasStraitFlush.kicker
		}
	}
	this.hasFourCard = hasFourCard(sevenBord);
	if (this.hasFourCard.result == true) {
		//console.log('has FourCard');
		//console.log(this.hasFourCard.numString);
		//console.log(this.hasFourCard.kicker);
		return {
			point: 7,
			numString: this.hasFourCard.numString,
			kicker: this.hasFourCard.kicker
		}
	}
	this.hasFullHouse = hasFullHouse(sevenBord);
	if (this.hasFullHouse.result == true) {
		//console.log('has FullHouse');
		//console.log(this.hasFullHouse.numStringThere);
		//console.log(this.hasFullHouse.numStringTwo);
		return {
			point: 6,
			numStringThere: this.hasFullHouse.numStringThere,
			numStringTwo: this.hasFullHouse.numStringTwo
		}
	}
	this.hasFlush = hasFlush(sevenBord);
	if (this.hasFlush.result == true) {
		//console.log('has Flush');
		//console.log(this.hasFlush.mark);
		//console.log(this.hasFlush.kicker);
		return {
			point: 5,
			mark: this.hasFlush.mark,
			kicker: this.hasFlush.kicker
		}
	}
	this.hasStraight = hasStraight(sevenBord);
	if (this.hasStraight.result == true) {
		//console.log('has Straight');
		//console.log(this.hasStraight.kicker);
		return {
			point: 4,
			kicker: this.hasStraight.kicker
		}
	}
	this.hasThreeCard = hasThreeCard(sevenBord);
	if (this.hasThreeCard.result == true) {
		//console.log('has ThreeCard');
		//console.log(this.hasThreeCard.numStringThere);
		//console.log(this.hasThreeCard.kicker);
		return {
			point: 3,
			numStringThere: this.hasThreeCard.numStringThere,
			kicker: this.hasThreeCard.kicker
		}
	}
	this.hasTwoPair = hasTwoPair(sevenBord);
	if (this.hasTwoPair.result == true) {
		//console.log('has TwoPair');
		//console.log(this.hasTwoPair.twoPairStringNum);
		//console.log(this.hasTwoPair.kicker);
		return {
			point: 2,
			twoPairStringNum: this.hasTwoPair.twoPairStringNum,
			kicker: this.hasTwoPair.kicker
		}
	}
	this.hasPair = hasPair(sevenBord);
	if (this.hasPair.result == true) {
		//console.log('has hasPair');
		//console.log(this.hasPair.pairNumString);
		//console.log(this.hasPair.kicker);
		return {
			point: 1,
			pairNumString: this.hasPair.pairNumString,
			kicker: this.hasPair.kicker
		}
	}
	// ハイカード
	//console.log('high cards');
	//console.log([sevenBord[0], sevenBord[1], sevenBord[2], sevenBord[3], sevenBord[4]]);
	return {
		point: 0,
		kicker: [sevenBord[0], sevenBord[1], sevenBord[2], sevenBord[3], sevenBord[4]]
	}
}

function hasPair(sevenBord) {
	for (var i=0; i<6; i++) {
		if (sevenBord[i].charAt(0) == sevenBord[i+1].charAt(0)) { // ペアがあった！
			var pairNumString = sevenBord[i].charAt(0);
			var kicker = [];
			for (var key in sevenBord) {
				if (pairNumString != sevenBord[key].charAt(0))  {
					kicker.push(sevenBord[key]);
					if (kicker.length == 3) {
						return {result: true, pairNumString: pairNumString, kicker: kicker};
					}
				}
			}
		}
	}
	return {result: false};
}

function hasTwoPair(sevenBord) {
	var twoPairStringNum = [];
	var kicker = [];
	for (var i=0; i<6; i++) {
		if (sevenBord[i].charAt(0) == sevenBord[i+1].charAt(0)) {
			twoPairStringNum.push(sevenBord[i].charAt(0));
			if (twoPairStringNum.length == 2) { // ツーペアがあった！
				if (kicker.length == 0) kicker = [sevenBord[4]];
				return {result: true, twoPairStringNum: twoPairStringNum, kicker: kicker[0]};
			}
			i++;
		} else {
			kicker.push(sevenBord[i]);
		}
	}
	return {result: false};
}

function hasThreeCard(sevenBord) {
	var countNum = {};
	for (var key in sevenBord) {
		var numStringThere = sevenBord[key].charAt(0);
		if (!countNum[numStringThere]) {
			countNum[numStringThere] = 1;
		} else {
			countNum[numStringThere] += 1;
			if (countNum[numStringThere] >= 3) { // ３カードあった！（大きい順にならんでいるので、始めにみつけた３カードが最強）
				var kicker = [];
				for (var key in sevenBord) {
					if (numStringThere != sevenBord[key].charAt(0)) {
						kicker.push(sevenBord[key]);
						if (kicker.length == 2) {
							return {result: true, numStringThere: numStringThere, kicker: kicker};
						}
					}
				}
			}
		}
	}
	return {result: false};
}

function hasStraight(sevenBord) {
	var kicker = [];
	var continuingNumCounter = 1;
	for (var key in sevenBord) {
		var num = getNumFromCard(sevenBord[key]);
		if (Number(key) == (sevenBord.length-1)) { // 最後か？（Aと２の結合カウント）
			if (num == 2 && 'A' == sevenBord[0].charAt(0)) {
				continuingNumCounter += 1;
				kicker.push(sevenBord[key]);
				if (continuingNumCounter == 5) {
					kicker.push(sevenBord[0]);
					return {
						result: true,
						kicker: kicker
					};
				}
			}
		} else {
			if ((num - 1) == getNumFromCard(sevenBord[Number(key)+1])) {
				continuingNumCounter += 1;
				kicker.push(sevenBord[key]);
				if (continuingNumCounter == 5) {
					kicker.push(sevenBord[Number(key)+1]);
					return {
						result: true,
						kicker: kicker
					};

				}
			} else if (num == getNumFromCard(sevenBord[Number(key)+1])) { // 同じ数字が連続した場合はスキップ
				continue;
			} else {
				continuingNumCounter = 1;
				kicker = [];
			}
		}
	}
	return {result: false};
}

function hasFullHouse(sevenBord) {
	var countNum = {};
	for (var key in sevenBord) {
		var numStringThere = sevenBord[key].charAt(0);
		if (!countNum[numStringThere]) {
			countNum[numStringThere] = 1;
		} else {
			countNum[numStringThere] += 1;
			if (countNum[numStringThere] >= 3) { // ３カードあった！（大きい順にならんでいるので、始めにみつけた３カードが最強）
				countNum = {};
				for (var key in sevenBord) {
					var numStringTwo = sevenBord[key].charAt(0);
					if (numStringThere != numStringTwo) {
						if (!countNum[numStringTwo]) {
							countNum[numStringTwo] = 1;
						} else {
							countNum[numStringTwo] += 1;
							if (countNum[numStringTwo] >= 2) { // フルハウス発見！（）こちらも始めに見つかった２ペアが最強
								return {result: true, numStringThere: numStringThere, numStringTwo: numStringTwo};
							}
						}
					}
				}
			}
		}
	}
	return {result: false};
}

function hasFourCard(sevenBord) {
	var countNum = {};
	for (var key in sevenBord) {
		var numString = sevenBord[key].charAt(0);
		if (!countNum[numString]) {
			countNum[numString] = 1;
		} else {
			countNum[numString] += 1;
			if (countNum[numString] >= 4) { // ４カードあった！キッカーを見つけよう！
				var kicker = [];
				for (var key in sevenBord) {
					if (numString != sevenBord[key].charAt(0)) {
						kicker.push(sevenBord[key].charAt(0));
						return {result: true, numString: numString, kicker: kicker};
					}
				}
			}
		}
	}
	return {result: false};
}

function hasFlush(sevenBord){
	var countMarks = { s: 0, h: 0, d: 0, c: 0 };
	for (var key in sevenBord) {
		var mark = sevenBord[key].charAt(1);
		countMarks[mark] += 1;
		if (countMarks[mark] >= 5) { // フラッシュがあった（見つけた順からキッカー）
			var kicker = [];
			for (var key in sevenBord) {
				if (sevenBord[key].charAt(1) == mark) {
					kicker.push(sevenBord[key].charAt(0));
					if (kicker.length == 5) return {result: true, mark: mark, kicker: kicker};
				}
			}
		}
	}
	return {result: false};
}

function hasStraitFlush(sevenBord){
	this.hasFlush = hasFlush(sevenBord);
	if (this.hasFlush.result == false) return false;
	var mark = this.hasFlush.mark;
	return hasStraitByMark(sevenBord, mark);
}

function hasStraitByMark(sevenBord, mark) {
	var sameMarkBoard = [];
	for(var key in sevenBord) {
		if (sevenBord[key].charAt(1) == mark) sameMarkBoard.push(sevenBord[key]);
	}
	this.hasStraight = hasStraight(sameMarkBoard);
	if (this.hasStraight.result == true) {
		return {
			result: true,
			kicker: this.hasStraight.kicker
		}
	}
	return {result: false};
}

// 大きい順に並んだ７枚のボードを作成します。
function createSevenBoard(board, hand) {
	var gotSevenBoard = board.concat(hand);
	return gotSevenBoard.sort(function(a, b) {
		return ( getNumFromCard(a) < getNumFromCard(b) ? 1 : -1);
	});
}

// カードから数値を取得します。
function getNumFromCard(card){
	switch (card.charAt(0)){
		case 'A':
			return 14;
		case 'K':
			return 13;
		case 'Q':
			return 12;
		case 'J':
			return 11;
		case 'T':
			return 10;
	}
	return Number(card.charAt(0));
}



function sendResponse(response, players) {
	response.writeHead(200, {'Content-type': 'application/json; charset=UTF-8'});
	response.write(JSON.stringify(players));
	response.end();
}
