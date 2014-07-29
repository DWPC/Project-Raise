var http = require('http');
var URL  = require('url');
var request = require('request');
var querystring = require('querystring');
var gotCards;
var frontObj = {};
gotStart(); // 初期化


http.createServer(function (req, res) {
	if (req.method == 'POST') {
		var body = '';
		req.on('data', function (data) { body += data; });
		req.on('end', function(){
			var query = querystring.parse(body);
			if (typeof query['name'] != 'undefined' && typeof query['position'] != 'undefined') {
				gotNameAndPosition(query['name'], query['position']);
				sendResponse(res, query['name']); // レスポンスを返している。
			} else if (typeof query['type'] != 'undefined' && typeof query['position'] != 'undefined' && query['type'] == 'sitOut') {
				gotSitOut(query['position']);
				sendResponse(res, query['position']); // レスポンスを返している。
			} else {
				sendResponse(res, query['image']); // レスポンスを返している。
				gotImage(query['image']);
			}
		});
	} else if(req.method == 'GET') {
		sendResponseToFront(req, res); // フロント部にレスポンスを返している。
	}

}).listen(3000);


function gotImage(image) {
	switch (image) {
		case 'start': gotStart(); break;
		case 'preFlop': gotPreFlop(); break;
		case 'nextGame': gotNextGame(); break;
		default : gotCard(image); break;
	}
}

function gotNameAndPosition(name, position) {
	console.log('gotNameAndPosition');
	if (!frontObj.players[Number(position)]) {
		frontObj.players[Number(position)] = {};
	}
	frontObj.players[Number(position)].name = name;
	frontObj.players[Number(position)].id   = Number(position);
	frontObj.players[Number(position)].isActive = true;
}

function gotSitOut(position) {
	console.log('gotSitOut position = '+position);
	var newPlayers = [];
	console.log(frontObj.players);
	position = Number(position);
	for (var key in frontObj.players) {
		var player = frontObj.players[frontObj.players[key].id];
		console.log('player.id = ' + player.id);
		if (player.id == position) continue;
		if (player.id > position) {
			player.id = player.id - 1;
			newPlayers[player.id] = player;
		} else {
			newPlayers[player.id] = player;
		}
	}
	frontObj.players = newPlayers;
	console.log(frontObj.players);
}

// 初期化
// スタートカードを受け取った時の処理。
function gotStart() {
	console.log('gotStart');
	frontObj = {};
	frontObj.state = 'start';
	frontObj.allPlayersNum = 0;
	frontObj.playingPlayersNum = 0;
	frontObj.button = 0;
	frontObj.foldPlayerPosition = null;
	frontObj.board = [];
	frontObj.players = [];
	gotCards = [];
}

// ネクストゲームカードを受け取った時の処理。
function gotNextGame() {
	console.log('gotNextGame');
	var resetFrontObj = {};
	frontObj.state = 'start';
	frontObj.allPlayersNum = 0;
	frontObj.playingPlayersNum = 0;
	frontObj.foldPlayerPosition = null;
	frontObj.board = [];
	var playersNum = frontObj.players.length;
	frontObj.button = (frontObj.button+1)%playersNum;
	gotCards = [];
	for (var key in frontObj.players) {
		var player = frontObj.players[key];
		frontObj.players[player.id].hand = null;
		frontObj.players[player.id].isActive = true;
		frontObj.players[player.id].win = null;
		frontObj.players[player.id].tie = null;
	}
}


// プリフロップカードを受け取った時の処理。
function gotPreFlop() {
	console.log('gotPreFlop');
	if (frontObj.state === 'start') {
		frontObj.state = 'preFlop';
		frontObj.allPlayersNum = gotCards.length/2;
		frontObj.playingPlayersNum = frontObj.allPlayersNum;
		for (var i=0; i<frontObj.allPlayersNum; i++) {
			frontObj.players[i].isActive = true;
			frontObj.players[i].win = null;
			frontObj.players[i].tie = null;
		}
		winPerApiMock();
	}
}

// トランプのカードを受け取った時の処理。
function gotCard(card) {
	console.log(card);
	switch (frontObj.state) {
		case 'start': gotCardInStart(card); break;
		case 'preFlop': gotCardInPreFlop(card); break;
		case 'flop': gotCardInFlop(card); break;
		case 'turn': gotCardInTurn(card); break;
		case 'river': gotCardInRiver(card); break;
	}
}

function gotCardInStart(card) {
	var playersNum = frontObj.players.length;
	var willGetPlayerId = (gotCards.length+frontObj.button)%playersNum;
	gotCards.push(card);
	if (typeof frontObj.players[willGetPlayerId].hand == 'undefined' || !frontObj.players[willGetPlayerId].hand) {
		frontObj.players[willGetPlayerId].hand = [card];
	} else {
		frontObj.players[willGetPlayerId].hand[1] = card;
	}
}

// プリフロップでカード情報を受け取った時の処理。
function gotCardInPreFlop(card) {
	var indexNum = gotCards.indexOf(card);
	if (indexNum != -1) { // 同じカードがみつかった場合
		foldedAndRecalculation((indexNum+frontObj.button) % frontObj.allPlayersNum); // 降りたと認識
	} else { // 同じカードがない場合
		frontObj.board.push(card);
		if (frontObj.board.length == 3) { // フロップに３枚が来たのを確認
			frontObj.state = 'flop'; // フロップになったことを認識
			winPerApiMock();
		}
	}
}
// フロップでカード情報を受け取った時の処理。
function gotCardInFlop(card) {
	var indexNum = gotCards.indexOf(card);
	if (indexNum != -1) { // 同じカードがみつかった場合
		foldedAndRecalculation((indexNum+frontObj.button) % frontObj.allPlayersNum); // 降りたと認識
	} else { // 同じカードがない場合
		frontObj.board.push(card);
		frontObj.state = 'turn'; // ターンになったことを認識
		winPerApiMock();
	}
}
// ターンでカード情報を受け取った時の処理。
function gotCardInTurn(card) {
	var indexNum = gotCards.indexOf(card);
	if (indexNum != -1) { // 同じカードがみつかった場合
		foldedAndRecalculation((indexNum+frontObj.button) % frontObj.allPlayersNum); // 降りたと認識
	} else { // 同じカードがない場合
		frontObj.board.push(card);
		frontObj.state = 'river'; // リバーになったことを認識
		winPerApiMock();
	}
}
// リバーでカード情報を受け取った時の処理。
function gotCardInRiver(card) {
	var indexNum = gotCards.indexOf(card);
	if (indexNum != -1) { // 同じカードがみつかった場合
		foldedAndRecalculation((indexNum+frontObj.button) % frontObj.allPlayersNum); // 降りたと認識
	}
}

// 降りたプレーヤーが出た時に勝率を再計算する。
function foldedAndRecalculation(playerId) {
	if (frontObj.players[playerId].isActive == false) return;
	frontObj.foldPlayerPosition = playerId;
	frontObj.players[playerId].isActive = false;
	frontObj.players[playerId].win = 0;
	frontObj.players[playerId].tie = 0;
	frontObj.playingPlayersNum -= 1;
	winPerApiMock();
}

function winPerApiMock() {
	console.log('winPerApiMock');
	var sendJson = {
		"board": frontObj.board,
		"players": frontObj.players
	};
	var url = 'http://h-koeda-so.office.dwango.co.jp:9000/odds';
	var url = 'http://localhost:9000/odds';
	var options = {
		url: url,
		headers: {  'Content-Type': 'application/json' },
		json: true,
		body: JSON.stringify(sendJson)
	};
	console.log('send');
	console.log(sendJson);
	request.post(options, function(error, response, body){
		if (!error && response.statusCode == 200) {
			// var gotPlayers = JSON.parse(body);
			console.log(body);
			var players = body['players'];
			for (var key in players) {
				console.log(frontObj.players[Number(players[key].id)].isActive);
				console.log(players[key].win);
				if (frontObj.players[Number(players[key].id)].isActive == true) {
					frontObj.players[Number(players[key].id)].win = players[key].win;
					frontObj.players[Number(players[key].id)].tie = players[key].tie;
				}
			}
		} else {
			console.log('error: '+ response.statusCode);
		}
	});
}

/*
function winPerApiMock() {
	console.log('winPerApiMock');
	var sendJson = {
		"board": frontObj.board,
		"players": frontObj.players
	};
	var url = 'http://localhost:9000?data=' + JSON.stringify(sendJson);
	http.get(url, function(res) {
	 var body = '';
	 res.setEncoding('utf8');
	 res.on('data', function(chunk) { body += chunk; });
	 res.on('end', function() {
	 var gotPlayers = JSON.parse(body);
	 for (var i=0; i<frontObj.allPlayersNum; i++) {
		if (frontObj.players[i].isActive == true) {
			frontObj.players[i].win = gotPlayers[i].win;
			frontObj.players[i].tie = gotPlayers[i].tie;
	    }
	 }
	 });
	 });
}
*/

function sendResponse(response, gotImage) {
	response.writeHead(200, {'Content-type': 'application/json; charset=UTF-8'});
	response.write(gotImage);
	response.end();
}

function sendResponseToFront(req, res) {
	var query = URL.parse(req.url, true).query;
	var data = JSON.stringify(frontObj);
	var callback;
	for (var key in query) {
		var val = query[key];
		if (key === 'callback' && /^[a-zA-Z]+[0-9a-zA-Z]*$/.test(val) ) {
			callback = val;
		}
	}
	res.writeHead(200, {'Content-Type':'application/json; charset=utf-8'});
	frontObj.foldPlayerPosition = null;
	res.end( callback ? callback + "(" + data + ");" : data );
}
