// On définit un objet javascript player avec des attributs
const player = {
    host: false,
    playedCell: "",
    roomId: null,
    socketId: "",
    role: "",
    roleId: Number,
    username: "",
    src: "",
    actif: true,
    sorcierePowerActive: false
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
const dodoLoupDiv = document.getElementById('dodoLoup');
const reveilSorciereDiv = document.getElementById('sorcierePower');
const mangeParLoup = document.getElementById('mangeParLoup');

let ennemyUsername = "";

socket.emit('get rooms');

// Page d'accueil on liste les rooms pour le jeu loup-garou
// On cache toutes les images d'interactions du jeu
socket.on('list rooms', (rooms,wolfRooms) => {
    // On cache toutes les images et les div html
    loupClass.classList.add('d-none');
    voyanteClass.classList.add('d-none');
    villageoisClass1.classList.add('d-none');
    villageoisClass2.classList.add('d-none');
    sorciereClass.classList.add('d-none');
    playerContainerDiv.classList.add('d-none');
    cellierDiv.classList.add('d-none');
    loupNuitDiv.classList.add('d-none');
    dodoDiv.classList.add('d-none');
    dodoLoupDiv.classList.add('d-none');
    reveilSorciereDiv.classList.add('d-none');
    mangeParLoup.classList.add('d-none');

    if(document.URL.includes("tic")){
    let html = "";
    } else if(document.URL.includes("loup")){
        let html = "";
        if (wolfRooms.length > 0) {
            wolfRooms.forEach(room => {
                console.log("Room Loup ", room.players.length);
                // Au bout de 5 joueurs inscrits dans un salon on lance la partie
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
            // On ajoute à l'élément html des éléments
            roomsList.innerHTML = html;

        // Pour chaque salon on créé bouton et à chaque click lancement d'un événement javascript
        for (const element of document.getElementsByClassName('join-wolfRoom')) {
        element.addEventListener('click', joinRoomWolf, false);
        }
    }


    }
    });
// image du village qui s'affiche
function startFirstDay(players){
    console.log("début de nuit")
    cellierDiv.classList.remove('d-none');
    playerContainerDiv.classList.add('d-none');
    setTimeout(startGame, 10000, players);
}
socket.on('nightVillage', (player) => {
    dodoDiv.classList.remove('d-none')

});

// Fonction on tue un villageois (on rend son attribut actif = false)
// On regarde si la sorciere a toujours son pouvoir de guérison ou non
function wolfkilling(villager, sorcierePlayer){
    loupNuitDiv.classList.add('d-none');
    // Pour villageois choisi il est mort
    villager.actif = false;
    // Fonction pour savoir si la sorcière est vivante et a toujours son pouvoir
    if(sorcierePlayer != undefined && sorcierePlayer.sorcierePowerActive == true){
        socket.emit('endNightSorcierePower', villager, sorcierePlayer);
    } else {
        dodoLoupDiv.classList.remove('d-none');
        socket.emit('endNight', villager);
    }
}

socket.on('endGameForVillager', (villager) => {
    dodoDiv.classList.add('d-none');
    reveilSorciereDiv.classList.add('d-none');
    mangeParLoup.classList.remove('d-none');
})

// Fin de la nuit pour tous les joueurs
socket.on('endNightVillageAll', () => {
    loupNuitDiv.classList.add('d-none');
    dodoDiv.classList.add('d-none');
    dodoLoupDiv.classList.add('d-none');
    reveilSorciereDiv.classList.add('d-none');
})

// Fonction pour utilisation pouvoir de la sorcière avec deux boutons 
// soit elle sauve soit elle ne sauve pas le villageois
socket.on('sorcierePower', (villager, sorcierePlayer) => {
    console.log('sorcierePower', villager, sorcierePlayer)
    dodo.classList.add('d-none');
    reveilSorciereDiv.classList.remove('d-none');

    // On créé 2 boutons soit on sauve soit on ne sauve pas
    const buttonContainerSorciere = document.getElementById('button-container-sorciere');
    const buttonSorciereSave = document.createElement('button');
    buttonSorciereSave.textContent = "Sauver : " + villager.username;
    buttonSorciereSave.id ='acceptSave';
    buttonSorciereSave.addEventListener("click", function() {
        saveVillager(villager, sorcierePlayer);
        buttonSorciereSave.hidden;
      });
      buttonContainerSorciere.appendChild(buttonSorciereSave);

      const buttonSorciereDeny = document.createElement('button');
      buttonSorciereDeny.textContent = "Laisser mourir : " + villager.username;
      buttonSorciereDeny.id ='letDie';
      buttonSorciereDeny.addEventListener("click", function() {
        socket.emit('endNight', villager);
        buttonSorciereDeny.hidden;
        });
      buttonContainerSorciere.appendChild(buttonSorciereDeny);
});

function saveVillager(villager, sorcierePlayer){
    villager.actif = true;
    sorcierePlayer.sorcierePowerActive = false;
    socket.emit('endNight', villager);
}

// Formulaire username pour jeu tic-toc ou création salon
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

// Formulaire username pour jeu loup-garou ou création salon
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





socket.on('nightLoup', (player, wolfRooms) => {
    loupNuitDiv.classList.remove('d-none');
    let OtherVillagers = [];
    // On boucle sur chaque salon de loup-garou
        wolfRooms.forEach(r => {
            // On sélectionne le salon du joueur
            if(r.id == player.roomId){
                // On sort tous les joueurs non loup garou
                OtherVillagers = r.players.filter(p => {
                    return p.socketId !== player.socketId;
                });
            }
        });

        let sorcierePlayer = null;

    OtherVillagers.forEach(villager =>{
        // On trouve la sorcière 
        if(villager.roleId == 5 & villager.actif == true & villager.sorcierePowerActive == true)
            sorcierePlayer = villager;
       });

       
    const buttonContainer = document.getElementById('button-container');

    // Pour chaque villageois on créé un bouton
    OtherVillagers.forEach(villager => {

        const buttonCountElement = document.querySelectorAll('#killingButton');
        if(buttonCountElement.length < OtherVillagers.length){
        // On paramètre le boutton qu'on créé
        const button = document.createElement('button');
        button.textContent = villager.username;
        button.id ='killingButton';
        // On créé pour ce bouton une fonction javascript
        button.addEventListener("click", function() {
            wolfkilling(villager, sorcierePlayer);
            buttonCountElement.hidden
            loupNuitDiv.classList.add('d-none');
            dodoLoupDiv.classList.remove('d-none');
          });
        buttonContainer.appendChild(button);
        }
    });
    
});

// l'élément d'attente plus lien à partager
socket.on('join room', (roomId) => {
    player.roomId = roomId;
    linkToShare.innerHTML = `<a href="${window.location.href}?room=${player.roomId}" target="_blank">${window.location.href}?room=${player.roomId}</a>`;
});


socket.on('displayRole', ( player, players ) => {
    mainDiv.hidden;
    playerContainerDiv.classList.remove('d-none');
    document.getElementById('player1-username').innerHTML = "<p id=\"player1-username\" class=\"username\"> Ton username: " + player.username + "</p>";
    if (player.roleId == 1) {
        loupClass.classList.remove('d-none');
    } else if(player.roleId == 2){
        voyanteClass.classList.remove('d-none');
    } else if(player.roleId == 3){
        villageoisClass1.classList.remove('d-none');
    } else if(player.roleId == 4){
        villageoisClass2.classList.remove('d-none');
    } else if(player.roleId == 5){
        sorciereClass.classList.remove('d-none');
        player.sorcierePowerActive = true;
    }
    // On attends 10 secondes pour que le joueur retienne son rôle
    setTimeout(startFirstDay, 10000, players);
});


function startGame(players){
    cellierDiv.classList.add('d-none');
    players.forEach(player => {
        if(player.roleId == 1){
            // évènement pour le loup seulement
            socket.emit('firstNightWolf', player);
        } else {
            // évènement pour les villageois
            socket.emit('firstNightVillagers', player);
        }
    })
}


socket.on('start game', (players) => {
    console.log(players)
    startGame(players);
});

socket.on('start game wolf', (player, players) => {
    startGameWolf(player, players);
});

// On envoie évènement pour afficher à chaque joueur son rôle
function firstTurn(player, players){
    socket.emit('roleAssigned', player, players);
}

/* socket.on('endNightVillageAll', () => {
    LaunchMorning(players);
}) */

// Fonction pour rejoindre le salon de jeu loup-garou
const joinRoomWolf = function () {
    // Si pas de username vous pouvez pas rejoindre salon
    if (usernameInput.value !== "") {
        player.username = usernameInput.value;
        // On attribut identifiant unique
        player.socketId = socket.id;
        player.roomId = this.dataset.room;
        
        
        // On émet au serveur socket io une action
        socket.emit('playerDataWolf', player);

        userCard.hidden = true;
        waitingArea.classList.remove('d-none');
        roomsCard.classList.add('d-none');
    }
}


// Affichage première image
function startGameWolf(player, players){
    restartArea.classList.add('d-none');
    waitingArea.classList.add('d-none');
    loupClass.classList.add('d-none');
    turnMsg.classList.remove('d-none');
    firstTurn(player, players);

}

