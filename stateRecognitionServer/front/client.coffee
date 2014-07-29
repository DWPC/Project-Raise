config =
  viewTestingFlag: false,
  canvasWidth: 640,
  canvasHeight: 360,
  originalCardWidth: 48,
  originalCardHeight: 64,
  displayCardWidth: 36,
  displayCardHeight: 48,
  space: 8,
  boardWidthSpace: 6,
  boardHeightSpace: 6,
  cardFontSize: 30,
  markFontSize: 30,
  markAdjust: 20,
  state:  'loading'
config.url = 'http://157.7.200.224:3000'
config.url = 'http://localhost:3000'
config.displayCardWidth  = config.cardFontSize*2-11
config.displayCardHeight = config.cardFontSize
config.displayWidth = config.displayCardWidth*2
config.displayHeight = Number(config.canvasHeight/5)
config.boxWidth    = config.displayWidth
config.boxHeight   = config.displayHeight-config.displayCardHeight-config.space
config.boardWidth  = config.displayCardWidth*5 + config.boardWidthSpace*2
config.boardHeight = config.cardFontSize + config.boardHeightSpace*2
config.fontSize  = Number(config.boxHeight/2)


$(document).ready ->
  createCanvas()
  setInterval ->
    executeAjax()
  , 500

createCanvas = () ->
  page = "<canvas id='canvas' width='" + config.canvasWidth + "' height='" + config.canvasHeight + "'> </canvas>"
  $('#canvasDiv').html(page)
  canvas = $('#canvas').get(0)
  canvas.width  = config.canvasWidth
  canvas.height = config.canvasHeight
  config.ctx    = canvas.getContext("2d")

executeAjax = () ->
  $.ajax(
    {
      url: config.url,
      dataType: 'JSONP',
      jsonpCallback: 'callback',
      type: 'GET',
      success: (json) ->
        players = json.players
        board = json.board
        drawBackGround()
        for player in players
          drawBox(player.id)
          if player.isActive == true
            drawPlayerHands(player.id, player.hand)
          drawPlayerWinperAndName(player.id, player.win, player.name, player.isActive)
          if board && board.length > 0
            drawBoard(board)
    }
  )


drawBackGround = () ->
  # config.ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight)
  setColorAndFont('yellow', 0)
  config.ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight)

drawBox = (playerId) ->
  playerId = Number(playerId)
  drawX = Math.floor(playerId/5)*(config.canvasWidth-config.boxWidth)
  drawY = Math.floor(playerId%5)*config.displayHeight + config.displayCardHeight
  halfBoxHeight = Math.floor(config.boxHeight/2)
  setColorAndFont('black', 0)
  config.ctx.fillRect(drawX, drawY, config.boxWidth, halfBoxHeight)
  setColorAndFont('white', 0)
  drawY += halfBoxHeight
  config.ctx.fillRect(drawX, drawY, config.boxWidth, halfBoxHeight)

drawPlayerHands = (playerId, playerHands) ->
  drawX = Math.floor(playerId/5)*(config.canvasWidth-config.boxWidth)
  drawY = Math.floor(playerId%5)*config.displayHeight
  if playerHands && playerHands[0]
    drawcard(playerHands[0], drawX, drawY)
  if playerHands && playerHands[1]
    drawX += config.displayCardWidth
    drawcard(playerHands[1], drawX, drawY)

drawPlayerWinperAndName = (playerId, winPer, playerName, isActive) ->
  setColorAndFont('white', config.fontSize)
  drawX = Math.floor(playerId/5)*(config.canvasWidth - config.boxWidth) + 3
  drawY = Math.floor(playerId%5)*config.displayHeight + config.displayCardHeight + config.fontSize - 2
  if playerName
    config.ctx.fillText(playerName, drawX, drawY)
  drawY += config.fontSize
  if typeof isActive == 'undefined'
    return
  setColorAndFont('black', config.fontSize)
  if isActive == false
    config.ctx.fillText('Fold', drawX, drawY)
    return
  if winPer
    config.ctx.fillText(winPer, drawX, drawY)

drawBoard = (board) ->
  setColorAndFont('green', 0)
  drawX = Number(config.canvasWidth/2)-Number(config.boardWidth/2)
  drawY = config.canvasHeight - config.boardHeight
  config.ctx.fillRect(drawX, drawY, config.boardWidth, config.boardHeight)
  drawX += config.boardWidthSpace
  drawY += config.boardHeightSpace
  for card in board
    drawcard(card, drawX, drawY)
    drawX += config.displayCardWidth

drawcard = (card,x,y) ->
  setColorAndFont('white', 0)
  config.ctx.fillRect(x, y, config.cardFontSize*2-11, config.cardFontSize)
  drawX = x+2
  drawY = y+config.cardFontSize-3
  switch card.charAt 1
    when 's'
      setColorAndFont('black', config.cardFontSize)
      config.ctx.fillText(card.charAt(0), drawX, drawY)
      setColorAndFont('black', config.markFontSize)
      config.ctx.fillText('♠', drawX+config.markAdjust, drawY)
    when 'c'
      setColorAndFont('green', config.cardFontSize)
      config.ctx.fillText(card.charAt(0), drawX, drawY)
      setColorAndFont('green', config.markFontSize)
      config.ctx.fillText('♣', drawX+config.markAdjust, drawY)
    when 'd'
      setColorAndFont('blue', config.cardFontSize)
      config.ctx.fillText(card.charAt(0), drawX, drawY)
      setColorAndFont('blue', config.markFontSize)
      config.ctx.fillText('♦', drawX+config.markAdjust, drawY)
    when 'h'
      setColorAndFont('red', config.cardFontSize)
      config.ctx.fillText(card.charAt(0), drawX, drawY)
      setColorAndFont('red', config.markFontSize)
      config.ctx.fillText('♥', drawX+config.markAdjust, drawY)

setColorAndFont = (color,size) ->
  config.ctx.fillStyle = color
  config.ctx.font = "bold "+size+"px \'ITC HIGHLANDER\'"
