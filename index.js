const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);

app.use(express.static("public"));

const io = new Server(httpServer, {});

const fs = require("fs");
// Cargar les preguntes desde l'arxiu preguntes.json
const preguntes = JSON.parse(fs.readFileSync("preguntes.json", "utf-8"));
//generar un identificador únic per cada partida creada
const { v4: uuidv4 } = require('uuid');
const users = [];
const socketUsernames = {};
let temps;

io.on("connection", (socket) => {
   console.log('Connectat un client...')
  //socket.data.nickname = "alice";

//middleware comprovar si usuari té nickname
  socket.on("nicknameUser", (data) => {
   const nicknameUser = data.nicknameUser;


   // verificar si usuario ha proporcionat username
   if (nicknameUser) {
       // el usuari té nickname
       //console.log("nicknameUser:", nicknameUser);
       usernameUser = nicknameUser;
     
   } else {
       // no té nickname = redirecció a index.html
       console.log("Usuari no ha proporcionat nickname.");
       io.to(socket.id).emit("redirect", { redirectUrl: "/index.html" });
   }
});
 
  //socket obtenir nickname
  socket.on("nickname", function(data) {
         const socketID = socket.id;
          socket.nickname = data.nickname;
          const nicknameUser = socket.nickname;
          users.push({
              userID: socket.id,
              username: socket.nickname
          });
          const redirectUrl = "/home.html";
          // respondre al que ha enviat
          socket.emit("nickname rebut",{"response":"ok", redirectUrl, socketID, nicknameUser})
  })
  //enviar array amb tots els usuaris
  socket.on("get users", function() {
    //console.log(users);
      socket.emit("users", { users });
  });

    //socket crear partida, filtra les preguntes segons els requisits del form (quantitat i topics)
    socket.on("crear partida", function(configuracioPartida) {
      //console.log("hola");
      try {
          const { title, quantity, topics, nicknameAdmin, time } = configuracioPartida;
           //array de preguntes segons el tema
          const preguntasPorTema = {};
           //Agrupar les preguntes segons el tema escollit
          preguntes.forEach((pregunta) => {
            //evitar errors sintactics
              const tema = pregunta.modalitat.toLowerCase();
              if (topics.includes(tema)) {
                  preguntasPorTema[tema] = preguntasPorTema[tema] || [];
                  preguntasPorTema[tema].push(pregunta);
              }
          });
           // array de les preguntes finals
          const preguntesPartida = [];
           //Calcular quantes preguntes per tema faran falta
          const cantidadPorTema = Math.floor(quantity / topics.length);
           //Seleccionar preguntes de cada tema segons la cantitat seleccionada
          topics.forEach((tema) => {
              const preguntasDelTema = preguntasPorTema[tema] || [];
              preguntesPartida.push(...preguntasDelTema.slice(0, cantidadPorTema));
          });

           // SI es inpar i falta una pregunta escollir-la aleatòriament exemple: 10 preguntes / 3 temes
          const preguntasRestantes = quantity - preguntesPartida.length;
          if (preguntasRestantes > 0) {
              const temasDisponibles = topics.filter((tema) => preguntasPorTema[tema]?.length > cantidadPorTema);
              for (let i = 0; i < preguntasRestantes; i++) {
                  const temaAleatorio = temasDisponibles[Math.floor(Math.random() * temasDisponibles.length)];
                  const preguntasDelTema = preguntasPorTema[temaAleatorio] || [];
                  preguntesPartida.push(preguntasDelTema[Math.floor(Math.random() * preguntasDelTema.length)]);
              }
          }
          //generar identificador únic per la partida
          const idPartida = uuidv4();
          const salaPartida = `partida-${idPartida}`;
          //unir a l'usuari que ha creat la partida a la sala
          socket.join(salaPartida);
          //console.log(nicknameAdmin);
          socket.emit("preguntes partida", { idPartida, preguntesPartida, nicknameAdmin, time });
      } catch (error) {
          console.error("Error al procesar la sol·licitud de creació de la partida:", error);
      }
  });
 

// gestionar quan un usuari s'uneix a traves de la URL
socket.on("join game", function(data) {
   const { idPartida, nicknameUser, socketID } = data;
   const salaPartida = `partida-${idPartida}`;
   socket.join(salaPartida);

   // Asociar el socket.id amb el username
   socketUsernames[socket.id] = nicknameUser;
   console.log(`${nicknameUser} s'ha unit a la lobby: ${salaPartida}`);
  
   // Obtenir la llista d'usuaris que s'han unit a la sala i els seus usernames
   const usersInRoom = io.sockets.adapter.rooms.get(salaPartida);
   const usernamesArray = usersInRoom ? Array.from(usersInRoom).map(socketID => socketUsernames[socketID]) : [];

   //Enviar la llista d'usuaris al client per mostrar-los en la llista
   io.to(salaPartida).emit("users in room", { usersArray: Array.from(usersInRoom), usernamesArray });
   
});

// redirigir als usuaris de room(data) a game.html
socket.on("startGame", function(data) {
   const { idPartida } = data;
   const salaPartida = `partida-${idPartida}`;

   // Emitir un event a tots els usuaris de la sala per dirigir-los a game.html
   io.to(salaPartida).emit("redirectToGame");
});

//passar les preguntes a game.js
socket.on("preguntes configurades", function(data) {
   const { idPartida, preguntesPartida, nicknameAdmin, time } = data;
   const salaPartida = `partida-${idPartida}`;
    console.log("partida comensada" + idPartida)
   io.to(salaPartida).emit('start game', data);

   
});

socket.on("holaa", function(data) {
const salaPartida = `partida-${data}`;
//console.log("hola  " + salaPartida);
    io.to(salaPartida).emit("holaaa",{"response":"ok"})
});

//passar els usuaris de la sala a gmae.js

});

/*
var comptador = 1;
setInterval(() => {
  console.log('envio missatge a tots els clients')
  io.emit('salutacio', comptador);
  comptador++;
}, 5000);
*/

httpServer.listen(3000, ()=>
  console.log(`Server listening at http://localhost:3000`)
);


