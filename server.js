const io = require('socket.io')(3000, { cors: { origin: "*" } } ); //create server on port 3000

const games = {}; //hashmap of games| GameId : Array of connected socketIds
const users = {}; //hashmap of users| SocketID : Username

//WebSocket events for each client
io.on('connection', socket => {
    console.log("client connected");

    socket.on('new-user', username => {//runs on 'connection' event when client connects to server
        users[socket.id] = username //user chosen name added to array
        console.log(username + ' has joined with a socket id of ' + socket.id);
    })

    socket.on('create-new-game', () => { //when client sends request to create new game
        console.log("creating new game");
        const gameId = guid();  //create game with unique ID
        let clients = [];
        games[gameId] = clients;
        console.log("new game created with id " + gameId);
    })

    socket.on('join-game', gameIdToJoin => { //when client tries to join a game
        games[gameIdToJoin].push(socket.id);
        
        /*let gameEval = JSON.stringify(games);//debug
        console.log(gameEval);
        let gameEval2 = JSON.stringify(users);//debug
        console.log(gameEval2);*/

        for(var g in games){
            //console.log(g + ' and ' + games[g]);// gets gameid, then array of all connected socketids
            //console.log(users[games[g]]);//GETS NAME
            console.log('Game ID: ' + g + '\nConnected Users: ');
            games[g].forEach(element => { //for each client in game object
                console.log(element); //prints socketid
                console.log(users[element]); //prints name
            });

            if(games[g].length > 1){    //if 2 in game then players then start game
                console.log("Two users connected, game with id " + g + " is now starting!");
                gameLogicStart(games[g],g); //pass all users in that game and the game id to the game logic function
            }
        }
    })

    socket.on('disconnect', () => { //event when client disconnects
        console.log('User ' + users[socket.id] + ' with socketid ' + socket.id + ' disconnects');
        for(var g in games){//find client arrays in games
            const index = games[g].indexOf(socket.id); // get the index in the game objects array of clients which contains the disconnecting clients data
            if (index > -1) { // only splice array when item is found
                games[g].splice(index, 1); // 2nd parameter means remove one item only
              }
        }
        delete users[socket.id] //remove user entry from array
      })    
    
    socket.on('draw-card', data => { //when client sends request draw a card
        console.log(users[socket.id] + ' has drawn a card');

        //On draw game logic!
        let p0deck = data.p0deck;
        let p1deck = data.p1deck;

        let turnTrackReturn = data.tt;
        let gameIdReturn = data.gid;

        //need to broadcast to all changes
        if(turnTrackReturn){ //if player 1
            let drawnCard = p1deck.shift();
            games[data.gid].forEach(player => { //for each client in game object
                io.to(player).emit('card-drawn',{drawnCard: drawnCard, Player: users[socket.id]}); //send drawn card to clients
            });
            io.to(games[gameIdReturn][1]).emit('can-draw', {turnTrack: turnTrackReturn, currentGameId: gameIdReturn, p0deck: p0deck, p1deck: p1deck}); //player 1 can now draw
        }else if(turnTrackReturn == false){ //if player 0
            let drawnCard = p0deck.shift();
            games[data.gid].forEach(player => { //for each client in game object
                io.to(player).emit('card-drawn',{drawnCard: drawnCard, Player: users[socket.id]}); //send drawn card to clients
            });
            io.to(games[gameIdReturn][0]).emit('can-draw', {turnTrack: turnTrackReturn, currentGameId: gameIdReturn, p0deck: p0deck, p1deck: p1deck}); //player 0 can now draw
        }
    })

    socket.on('snap-declared', data => { //when client calls snap
        console.log(users[socket.id] + ' has called SNAP! in game id ' + data.gid);
        var lastCard1 = data.lastCards[0];
        var lastCard2 = data.lastCards[1];

        if (lastCard1.includes(lastCard2.substring(0, 2)) || lastCard2.includes(lastCard1.substring(0, 2))) {
            console.log("SNAP SNAP SNAP");
        }else{
            console.log("False Snap Delclaration");
        }
    })
})

function gameLogicStart(gamePlayers, currentGameId){
    console.log('Game Players: ' + gamePlayers + ' and Game ID: '+ currentGameId);
    gamePlayers.forEach(player => {
        io.to(player).emit('game-start'); //tell all connected clients game is starting
    });

    //STARTING SETUP FOR SNAP START
    //Deck declaration
    let player0deck = ['Ace of Hearts', '2 of Hearts', '3 of Hearts', '4 of Hearts', '5 of Hearts', '6 of Hearts', '7 of Hearts', '8 of Hearts', '9 of Hearts', '10 of Hearts', 'Jack of Hearts', 'Queen of Hearts', 'King of Hearts', 'Ace of Diamonds', '2 of Diamonds', '3 of Diamonds', '4 of Diamonds', '5 of Diamonds', '6 of Diamonds', '7 of Diamonds', '8 of Diamonds', '9 of Diamonds', '10 of Diamonds', 'Jack of Diamonds', 'Queen of Diamonds', 'King of Diamonds'];
    let player1deck = ['Ace of Clubs', '2 of Clubs', '3 of Clubs', '4 of Clubs', '5 of Clubs', '6 of Clubs', '7 of Clubs', '8 of Clubs', '9 of Clubs', '10 of Clubs', 'Jack of Clubs', 'Queen of Clubs', 'King of Clubs', 'Ace of Spades', '2 of Spades', '3 of Spades', '4 of Spades', '5 of Spades', '6 of Spades', '7 of Spades', '8 of Spades', '9 of Spades', '10 of Spades', 'Jack of Spades', 'Queen of Spades', 'King of Spades'];
    player0deck = shuffleDeck(player0deck);
    player1deck = shuffleDeck(player1deck);

    let turnTrack = false; 
    io.to(gamePlayers[0]).emit('can-draw', {turnTrack: turnTrack, currentGameId:currentGameId, p0deck: player0deck, p1deck: player1deck}); //player 0 can now draw
}

//Generates unique ID (guid) for Game ID
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }