const { Socket } = require('socket.io');

const express = require('express');

const app = express();
const http = require('http').createServer(app);
const path = require('path');
const port = 8080;

/**
 * @type {Socket}
 */
const io = require('socket.io')(http);

app.use('/bootstrap/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/bootstrap/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates/index.html'));
});

app.get('/games/tic-tac-toe', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates/games/tic-tac-toe.html'));
});

app.get('/games/loup-garou', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates/games/loup-garou.html'));
});

http.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
});

let rooms = [];
let wolfRooms = [];


io.on('connection', (socket) => {
    console.log(`[connection] ${socket.id}`);

    socket.on('playerDataWolf', (playerWolf) => {
        console.log(`[playerDataWolf] ${playerWolf.username}`);

        let room = null;

        if (!playerWolf.roomId) {
            room = createRoom(playerWolf, true);
            console.log(`[create room ] - ${room.id} - ${playerWolf.username}`);
        } else {
            room = wolfRooms.find(r => r.id === playerWolf.roomId);

            if (room === undefined) {
                return;
            }

            playerWolf.roomId = room.id;
            room.players.push(playerWolf);
        }

        socket.join(room.id);

        io.to(socket.id).emit('join room', room.id);




        if (room.players.length === 2) {
            let roleArray = ['Loup-Garou', 'Villageois 1', 'Villageois 2', 'Voyante', 'Sorcière'];
            room.players.forEach(p =>  {
                console.log("player", p);
                p.role = dealRoleWolf(roleArray)
                console.log("player role", p.role);

                const index = roleArray.indexOf(p.role);
                if (index !== -1) {
                    roleArray.splice(index, 1);
                }
            }

            )
            console.log("la partie est lancée");
            io.to(room.id).emit('start game wolf', room.players);
        }
    });





    socket.on('playerData', (player) => {
        console.log(`[playerDataTicTac] ${player.username}`);

        let room = null;

        if (!player.roomId) {
            room = createRoom(player, false);
            console.log(`[create room ] - ${room.id} - ${player.username}`);
        } else {
            room = rooms.find(r => r.id === player.roomId);

            if (room === undefined) {
                return;
            }

            player.roomId = room.id;
            room.players.push(player);
        }

        socket.join(room.id);

        io.to(socket.id).emit('join room', room.id, false);

        if (room.players.length === 2) {
            io.to(room.id).emit('start game', room.players);
        }
    });

    socket.on('get rooms', () => {
        console.log("chambre", rooms, wolfRooms);
        io.to(socket.id).emit('list rooms', rooms, wolfRooms);
    });

    socket.on('play', (player) => {
        console.log(`[play] ${player.username}`);
        io.to(player.roomId).emit('play', player);
    });

    socket.on('play again', (roomId) => {
        const room = rooms.find(r => r.id === roomId);

        if (room && room.players.length === 2) {
            io.to(room.id).emit('play again', room.players);
        }
    })

    socket.on('disconnect', () => {
        console.log(`[disconnect] ${socket.id}`);
        let room = null;

        rooms.forEach(r => {
            r.players.forEach(p => {
                if (p.socketId === socket.id && p.host) {
                    room = r;
                    rooms = rooms.filter(r => r !== room);
                }
            })
        })
    });
});







function createRoom(player, isWolfRoom) {
    const room = { id: roomId(), players: [], wolf:false };

    player.roomId = room.id;
    room.players.push(player);
    if(isWolfRoom){
        wolfRooms.push(room);
    } else {
        rooms.push(room);
    }

    return room;
}


function roomId() {
    return Math.random().toString(36).substr(2, 9);
}

function dealRoleWolf(roleArray){
    console.log("la liste", roleArray, roleArray.length)
    const randomRole = roleArray[Math.floor(Math.random() * roleArray.length)];
    console.log("role" , randomRole);
    return randomRole;

}
