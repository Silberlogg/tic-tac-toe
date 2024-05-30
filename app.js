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
        let room = null;

        // On créé le salon si pas de salon déja créé
        if (!playerWolf.roomId) {
            room = createRoom(playerWolf, true);
            console.log(`[create room ] - ${room.id} - ${playerWolf.username}`);
        } else {
            // wolfRooms on prend tous les salon dispo
            // le salon réellement occupé par le joueur
            room = wolfRooms.find(r => r.id === playerWolf.roomId);

            if (room === undefined) {
                return;
            }

            playerWolf.roomId = room.id;

            // On ajoute à la liste de joueurs pour ce salon 
            //le joueur qui vient de s'inscrire
            room.players.push(playerWolf);
        }
        // On demande au serveur de retenir une valeur particulière
        socket.join(room.id);

        // On transmet au salon son identifiant son identifiant unique
        io.to(socket.id).emit('join room', room.id);
        // Si 5 joueurs on lance partie
        if (room.players.length === 5) {
            dealRolePlayers(room.players);
            room.players.forEach(player => io.to(room.id).emit('start game wolf', player, room.players));
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

        if (room.players.length === 5) {
            socket.join(room.players);
            room.players
            io.to(room.id).emit('start game', room.players);
        }
    });

    socket.on('get rooms', () => {
        console.log("chambre", rooms, wolfRooms);
        io.to(socket.id).emit('list rooms', rooms, wolfRooms);
    });

    socket.on('get rooms wolf', () => {
        console.log("chambre", wolfRooms);
        io.to(socket.id).emit('list rooms wolf', wolfRooms);
    });

    socket.on('play', (player) => {
        console.log(`[play] ${player.username}`);
        io.to(player.roomId).emit('play', player);
    });

    socket.on('playWolf', (player) => {
        console.log(`[playWolf] ${player.username}`);
        rooms.filter()
        io.to(player.roomId).emit('playWolf', player);
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
    socket.on('roleAssigned', ( player, players ) => {
        // Pour chaque joueur on envoie un évènement individualisé
       io.to(player.socketId).emit('displayRole', player, players)
    })

    socket.on('firstNightWolf' , (player) => {
        // On demande tous les salon disponibles
        allRooms = Array.from(io.sockets.adapter.rooms, ([name, value]) => ({ name, value }));


        io.to(player.socketId).emit('nightLoup', player, wolfRooms)
    })

    socket.on('firstNightVillagers' , (player) => {
        io.to(player.socketId).emit('nightVillage')
    
    })

    socket.on('endNight' , (villager) => {
        io.to(villager.socketId).emit('endGameForVillager', villager)
    })

    // évènement personnalisé pour la sorcière
    socket.on('endNightSorcierePower' , (villager, sorcierePlayer) => {
        io.to(sorcierePlayer.socketId).emit('sorcierePower', villager, sorcierePlayer)
    })
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

// Affecter rôle à chaque joueur inscrit
function dealRolePlayers(players){
    let roleArray = ['Loup-Garou', 'Villageois 1', 'Villageois 2', 'Voyante', 'Sorciere'];
    players.forEach(p =>  {
        p.role = dealRoleWolf(roleArray)
        if(p.role == 'Loup-Garou'){
            p.src="role-loup";
            p.roleId = 1;
        }
        if(p.role == 'Villageois 1'){
            p.src="role-villageois";
            p.roleId = 3;
        }
        if(p.role == 'Villageois 2'){
            p.src="role-villageois";
            p.roleId = 4;
        }
        if(p.role == 'Voyante'){
            p.src="role-voyante";
            p.roleId = 2;
        }
        if(p.role == 'Sorciere'){
            p.src="role-sorciere";
            p.roleId = 5;
            p.sorcierePowerActive = true;
        }
        console.log("player role", p.role);

        // on enlève l'index utilisé
        const index = roleArray.indexOf(p.role);
        if (index !== -1) {
            roleArray.splice(index, 1);
        }
    })
    console.log("fin traitement", players);
    return players;

}

// génere aléatoirement un index
function dealRoleWolf(roleArray){
    const randomRole = roleArray[Math.floor(Math.random() * roleArray.length)];
    return randomRole;

}