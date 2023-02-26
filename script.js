const socket = io('http://localhost:3000') //socket host location (server runs on port 3000)

const username = prompt('What is your name?')
socket.emit('new-user', username)

let turnTrackCl = false;
let gameId = undefined;
let p0deck = undefined;
let p1deck = undefined;
let lastCards = [undefined, undefined];

document.getElementById("snap-btn").disabled = false; //enable snap button

function createGame(){ //send request to create new game
    socket.emit('create-new-game');
}

function joinGame(){ //send request to join a game
    const gameIdToJoin = document.getElementById('game-id-input').value;
    socket.emit('join-game', gameIdToJoin);
}

function drawFunction(){
    document.getElementById("draw-btn").disabled = true; //disables draw button
    socket.emit('draw-card',{tt: !turnTrackCl, gid: gameId, p0deck: p0deck, p1deck: p1deck}); //turnTrack inverted on return to server
}

function snapFunction(){
    socket.emit('snap-declared', {lastCards:lastCards, gid: gameId}); //declare snap
}

socket.on('game-start', data => {
    document.getElementById("snap-ui").style.display = "block"; //show game ui
    document.getElementById("game-container").style.display = "block"; //show game ui
    document.getElementById("snap-btn").disabled = false; //enable snap button
    document.getElementById("create-game").style.display = "none"; //hide create game ui   
    document.getElementById("join-game").style.display = "none"; //hide join game ui
    displayInGameContainer('Game is now starting!')
  })

socket.on('can-draw', data => {
    document.getElementById("draw-btn").disabled = false; //enable draw button
    turnTrackCl = data.turnTrack;
    gameId = data.currentGameId;
    p0deck = data.p0deck;
    p1deck = data.p1deck;
  })

socket.on('card-drawn', data => {
    var playerWhoDrew = data.Player;
    var cardDrawn = data.drawnCard;
    displayInGameContainer(`${playerWhoDrew} draw the card: ${cardDrawn}`);
    lastCards.unshift(cardDrawn);
    lastCards.splice(2,2);
    let xxx = JSON.stringify(lastCards);
    console.log(xxx);
  })

function displayInGameContainer(message){ //communicate changes in game state to user (game UI)
    const messageElement = document.createElement('div')
    messageElement.innerText = message
    document.getElementById("game-container").append(messageElement);
}