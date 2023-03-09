var socket = undefined;

try{
    socket = io('http://localhost:3000');
} catch{
    document.getElementById("container").style.display = "none"; //hide startup game ui   
    document.getElementById("game-id-display").innerText = "Game server is down.\nPlease try again later."; //status
    document.getElementById("game-id-display").display = "inline"; //displayed
}

//const socket = io('http://localhost:3000') //socket host location (server runs on port 3000)
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

socket.on('game-created', data => {
    socket.emit('join-game', data.gameId); //automatically join created game
    const createdGameId = ("Share the following code with your friends so they can join your game: \n\n" + data.gameId);
    document.getElementById("game-id-display").innerText = createdGameId; //display created game id
    document.getElementById("game-id-display").display = "inline"; //show created game id
    document.getElementById("container").style.display = "none"; //hide startup game ui   
})

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
    document.getElementById("container").style.display = "none"; //hide startup game ui   
    document.getElementById("game-id-display").style.display = "none"; //hide game id share text 
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
    displayInGameContainer(`${playerWhoDrew} drew the card: ${cardDrawn}`);
    lastCards.unshift(cardDrawn);
    lastCards.splice(2,2);
    let xxx = JSON.stringify(lastCards);
    console.log(xxx);
  })
  
  socket.on('snap-reached', data => {
    var playerWhoCalled = data.playerWhoCalled;
    if(data.declaration === 'true'){
        displayInGameContainer(`${playerWhoCalled} called SNAP correctly. ${playerWhoCalled} has won the game.`);
        document.getElementById("snap-btn").disabled = true; //disable snap button
        document.getElementById("draw-btn").disabled = true; //disable draw button
    }else if(data.declaration === 'false'){
        displayInGameContainer(`${playerWhoCalled} called SNAP incorrectly. The game continues.`);
    }
  })

function displayInGameContainer(message){ //communicate changes in game state to user (game UI)
    const messageElement = document.createElement('div')
    messageElement.innerText = message
    document.getElementById("game-container").append(messageElement);
}