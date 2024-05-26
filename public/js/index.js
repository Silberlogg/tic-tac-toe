const player = {
    host: false,
    playedCell: "",
    roomId: null,
    role: "",
    roleId: Number,
    username: "",
    socketId: "",
    symbol: "X",
    turn: false,
    win: false,
    src: "",
    actif: true
};

const socket = io();

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('room');

if (roomId) {
    document.getElementById('start').innerText = "Rejoindre";
}

const usernameInput = document.getElementById('username');

const gameCard = document.getElementById('game-card');
const userCard = document.getElementById('user-card');

const restartArea = document.getElementById('restart-area');
const waitingArea = document.getElementById('waiting-area');

const roomsCard = document.getElementById('rooms-card');
const roomsList = document.getElementById('rooms-list');

const turnMsg = document.getElementById('turn-message');
const linkToShare = document.getElementById('link-to-share');

const loupClass = document.getElementById('role-loup');
const voyanteClass = document.getElementById('role-voyante');
const villageoisClass1 = document.getElementById('role-villageois');
const villageoisClass2 = document.getElementById('role-villageois2');
const sorciereClass = document.getElementById('role-sorciere');
const mainDiv = document.getElementById('main-div');
const playerContainerDiv = document.getElementById('players-container');
const cellierDiv = document.getElementById('cellier');
const loupNuitDiv = document.getElementById('loupNuit');
const dodoDiv = document.getElementById('dodo');

let ennemyUsername = "";

socket.emit('get rooms');
socket.on('list rooms', (rooms,wolfRooms) => {
    loupClass.classList.add('d-none');
    voyanteClass.classList.add('d-none');
    villageoisClass1.classList.add('d-none');
    villageoisClass2.classList.add('d-none');
    sorciereClass.classList.add('d-none');
    playerContainerDiv.classList.add('d-none');
    cellierDiv.classList.add('d-none');
    loupNuitDiv.classList.add('d-none');
    dodoDiv.classList.add('d-none');

    if(document.URL.includes("tic")){
    let html = "";
    if (rooms.length > 0) {
        rooms.forEach(room => {
            if (room.players.length !== 2) {
                console.log("Tic tAC ", room.players.length);
                html += `<li class="list-group-item d-flex justify-content-between">
                            <p class="p-0 m-0 flex-grow-1 fw-bold">Salon de ${room.players[0].username} - ${room.id} jeux : tic-tac-toe</p>
                            <button class="btn btn-sm btn-success join-room" data-room="${room.id}">Rejoindre</button>
                        </li>`;
            }
        });
    }
    if (html !== "") {
        roomsCard.classList.remove('d-none');
        roomsList.innerHTML = html;
        for (const element of document.getElementsByClassName('join-room')) {
            element.addEventListener('click', joinRoomTicTact, false);
    }
    }
    } else if(document.URL.includes("loup")){
        let html = "";
        if (wolfRooms.length > 0) {
            wolfRooms.forEach(room => {
                console.log("Room Loup ", room.players.length);
                if (room.players.length !== 5) {
                    html += `<li class="list-group-item d-flex justify-content-between">
                                <p class="p-0 m-0 flex-grow-1 fw-bold">Salon de ${room.players[0].username} - ${room.id} jeux : Loup-garou</p>
                                <button class="btn btn-sm btn-success join-wolfRoom" data-room="${room.id}">Rejoindre</button>
                            </li>`;
                }
            });
        }
    
        if (html !== "") {
            roomsCard.classList.remove('d-none');
            roomsList.innerHTML = html;
        for (const element of document.getElementsByClassName('join-wolfRoom')) {
        element.addEventListener('click', joinRoomWolf, false);
        }
    }


    }
    });


$("#form").on('submit', function (e) {
    e.preventDefault();

    player.username = usernameInput.value;

    if (roomId) {
        player.roomId = roomId;
    } else {
        player.host = true;
        player.turn = true;
    }

    player.socketId = socket.id;

    userCard.hidden = true;
    waitingArea.classList.remove('d-none');
    roomsCard.classList.add('d-none');

    socket.emit('playerData', player);
});

$("#formWolf").on('submit', function (e) {
    e.preventDefault();
    
    player.username = usernameInput.value;


    if (roomId) {
        player.roomId = roomId;
    } else {
        player.host = true;
        player.turn = true;
    }

    player.socketId = socket.id;

    userCard.hidden = true;
    waitingArea.classList.remove('d-none');
    roomsCard.classList.add('d-none');
    loupClass.classList.add('d-none');

    socket.emit('playerDataWolf', player);
});

$("#restart").on('click', function () {
    restartGame();
})

socket.on('join room', (roomId) => {
    player.roomId = roomId;
    linkToShare.innerHTML = `<a href="${window.location.href}?room=${player.roomId}" target="_blank">${window.location.href}?room=${player.roomId}</a>`;
});

socket.on('roleUpdate', ( data, players ) => {
    console.log(`[roleUpdate] ${JSON.stringify(data)}`);
    mainDiv.hidden;
    playerContainerDiv.classList.remove('d-none');
    document.getElementById('player1-username').innerHTML = "<p id=\"player1-username\" class=\"username\"> Ton username: " + data.username + "</p>";
    if (data.roleId == 1) {
        loupClass.classList.remove('d-none');
    } else if(data.roleId == 2){
        voyanteClass.classList.remove('d-none');
    } else if(data.roleId == 3){
        villageoisClass1.classList.remove('d-none');
    } else if(data.roleId == 4){
        villageoisClass2.classList.remove('d-none');
    } else if(data.roleId == 5){
        sorciereClass.classList.remove('d-none');
    }
    setTimeout(startFirstDay, 5000, players);
});

function startFirstDay(players){
    console.log("début de nuit")
    cellierDiv.classList.remove('d-none');
    playerContainerDiv.classList.add('d-none');

    setTimeout(startGame, 5000, players);
}

function startGame(players){
    cellierDiv.classList.add('d-none');
    players.forEach(player => {
        if(player.roleId == 1){
            socket.emit('firstNightWolf', player);
        } else {
            socket.emit('firstNightVillagers', player);
        }
    })
}

socket.on('nightLoup', (roomsApi, player, wolfRooms) => {
    console.log('nightLoup', roomsApi);
    console.log('nightLoup roomIdPlayer', player.roomId);
    console.log('list rooms wolf', wolfRooms);
    let OtherVillagers = [];
        wolfRooms.forEach(r => {
            console.log('r.id', r.id);
            console.log('player.roomId', player.roomId);
            console.log('player.socketId', player.socketId);
            if(r.id == player.roomId){
                console.log('Je suis passé');
                OtherVillagers = r.players.filter(p => {
                    console.log('p.socketId', p.socketId);
                    console.log('player.socketId', player.socketId);
                    return p.socketId !== player.socketId;
                });
            }
        });

    console.log('OtherVillagers', OtherVillagers);   
    loupNuitDiv.classList.remove('d-none');
    
});

socket.on('nightVillage', (player) => {
    console.log('nightVillage', player)
    dodoDiv.classList.remove('d-none');
});


socket.on('start game', (players) => {
    console.log(players)
    startGame(players);
});

socket.on('start game wolf', (player, players) => {
    startGameWolf(player, players);
});

function startGameWolf(player, players){
    restartArea.classList.add('d-none');
    waitingArea.classList.add('d-none');
    loupClass.classList.add('d-none');
    turnMsg.classList.remove('d-none');
    console.log("envoi", player)
    firstTurn(player, players);

}

function firstTurn(player, players){
    console.log("combien de joueurs ? ", player)        
    socket.emit('roleAssigned', player, players);
}

function setTurnMessage(classToRemove, classToAdd, html) {
    turnMsg.classList.remove(classToRemove);
    turnMsg.classList.add(classToAdd);
    turnMsg.innerHTML = html;
}



const joinRoomWolf = function () {
    if (usernameInput.value !== "") {
        player.username = usernameInput.value;
        player.socketId = socket.id;
        player.roomId = this.dataset.room;
        
        
        socket.emit('playerDataWolf', player);

        userCard.hidden = true;
        waitingArea.classList.remove('d-none');
        roomsCard.classList.add('d-none');
    }
}

socket.on('play again', (players) => {
    restartGame(players);
})

/* socket.on('play', (ennemyPlayer) => {
    console.log("la partie est lancée ?")
    if (ennemyPlayer.socketId !== player.socketId && !ennemyPlayer.turn) {
        const playedCell = document.getElementById(`${ennemyPlayer.playedCell}`);

        playedCell.classList.add('text-danger');
        playedCell.innerHTML = 'O';

        if (ennemyPlayer.win) {
            setTurnMessage('alert-info', 'alert-danger', `C'est perdu ! <b>${ennemyPlayer.username}</b> a gagné !`);
            calculateWin(ennemyPlayer.playedCell, 'O');
            showRestartArea();
            return;
        }

        if (calculateEquality()) {
            setTurnMessage('alert-info', 'alert-warning', "C'est une egalité !");
            return;
        }

        setTurnMessage('alert-info', 'alert-success', "C'est ton tour de jouer");
        player.turn = true;
    } else {
        if (player.win) {
            $("#turn-message").addClass('alert-success').html("Félicitations, tu as gagné la partie !");
            showRestartArea();
            return;
        }

        if (calculateEquality()) {
            setTurnMessage('alert-info', 'alert-warning', "C'est une egalité !");
            showRestartArea();
            return;
        }

        setTurnMessage('alert-success', 'alert-info', `C'est au tour de <b>${ennemyUsername}</b> de jouer`)
        player.turn = false;
    }
}); */


/* function startGame(players) {
    restartArea.classList.add('d-none');
    waitingArea.classList.add('d-none');
    gameCard.classList.remove('d-none');
    turnMsg.classList.remove('d-none');

    const ennemyPlayer = players.find(p => p.socketId != player.socketId);
    ennemyUsername = ennemyPlayer.username;

    if (player.host && player.turn) {
        setTurnMessage('alert-info', 'alert-success', "C'est ton tour de jouer");
    } else {
        setTurnMessage('alert-success', 'alert-info', `C'est au tour de <b>${ennemyUsername}</b> de jouer`);
    }
} */

/* function restartGame(players = null) {
    if (player.host && !players) {
        player.turn = true;
        socket.emit('play again', player.roomId);
    }

    const cells = document.getElementsByClassName('cell');

    for (const cell of cells) {
        cell.innerHTML = '';
        cell.classList.remove('win-cell', 'text-danger');
    }

    turnMsg.classList.remove('alert-warning', 'alert-danger');

    if (!player.host) {
        player.turn = false;
    }

    player.win = false;

    if (players) {
        startGame(players);
    }
} */

/* function showRestartArea() {
    if (player.host) {
        restartArea.classList.remove('d-none');
    }
} */

/* const joinRoomTicTact = function () {
    if (usernameInput.value !== "") {
        player.username = usernameInput.value;
        player.socketId = socket.id;
        player.roomId = this.dataset.room;
        
        socket.emit('playerData', player);

        userCard.hidden = true;
        waitingArea.classList.remove('d-none');
        roomsCard.classList.add('d-none');
    }
} */

/* function calculateEquality() {
    let equality = true;
    const cells = document.getElementsByClassName('cell');

    for (const cell of cells) {
        if (cell.textContent === '') {
            equality = false;
        }
    }

    return equality;
}

function calculateWin(playedCell, symbol = player.symbol) {
    let row = playedCell[5];
    let column = playedCell[7];


    // 1) VERTICAL (check if all the symbols in clicked cell's column are the same)
    let win = true;

    for (let i = 1; i < 4; i++) {
        if ($(`#cell-${i}-${column}`).text() !== symbol) {
            win = false;
        }
    }

    if (win) {
        for (let i = 1; i < 4; i++) {
            $(`#cell-${i}-${column}`).addClass("win-cell");
        }

        return win;
    }

    // 2) HORIZONTAL (check the clicked cell's row)

    win = true;
    for (let i = 1; i < 4; i++) {
        if ($(`#cell-${row}-${i}`).text() !== symbol) {
            win = false;
        }
    }

    if (win) {
        for (let i = 1; i < 4; i++) {
            $(`#cell-${row}-${i}`).addClass("win-cell");
        }

        return win;
    }

    // 3) MAIN DIAGONAL (for the sake of simplicity it checks even if the clicked cell is not in the main diagonal)

    win = true;

    for (let i = 1; i < 4; i++) {
        if ($(`#cell-${i}-${i}`).text() !== symbol) {
            win = false;
        }
    }

    if (win) {
        for (let i = 1; i < 4; i++) {
            $(`#cell-${i}-${i}`).addClass("win-cell");
        }

        return win;
    }

    // 3) SECONDARY DIAGONAL

    win = false;
    if ($("#cell-1-3").text() === symbol) {
        if ($("#cell-2-2").text() === symbol) {
            if ($("#cell-3-1").text() === symbol) {
                win = true;

                $("#cell-1-3").addClass("win-cell");
                $("#cell-2-2").addClass("win-cell");
                $("#cell-3-1").addClass("win-cell");

                return win;
            }
        }
    }

    $(".cell").on("click", function (e) {
        const playedCell = this.getAttribute('id');
        if (this.innerText === "" && player.turn) {
            player.playedCell = playedCell;
            this.innerText = player.symbol;
            player.win = calculateWin(playedCell);
            player.turn = false;
            socket.emit('play', player);
        }
    }); 
}*/