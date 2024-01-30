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
const userScores = {};
const preguntesPerSala = {};
let currentQuestionIndex = 0;
const clickCounts = [0, 0, 0, 0];


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




  socket.on("crear partida", function(configuracioPartida) {
    try {
        const { title, quantity, topics, nicknameAdmin, time } = configuracioPartida;
        // Array de preguntas por tema
        const preguntasPorTema = {};
        // Agrupar las preguntas según el tema elegido
        preguntes.forEach((pregunta) => {
          const tema = pregunta.modalitat.toLowerCase();
          if (topics.includes(tema)) {
              preguntasPorTema[tema] = preguntasPorTema[tema] || [];
              preguntasPorTema[tema].push(pregunta);
          }
        });
        // Array de las preguntas finales
        const preguntesPartida = [];
  
        // Seleccionar preguntas aleatorias de cada tema según la cantidad seleccionada
        topics.forEach((tema) => {
            const preguntasDelTema = preguntasPorTema[tema] || [];
            // Obtener una selección aleatoria de preguntas de este tema
            const preguntasAleatorias = shuffleArray(preguntasDelTema).slice(0, Math.floor(quantity / topics.length));
            preguntesPartida.push(...preguntasAleatorias);
        });
  
        // Función para mezclar aleatoriamente un array
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
  
        // Si queda un número impar de preguntas, elegir aleatoriamente una pregunta de cualquier tema
        const preguntasRestantes = quantity - preguntesPartida.length;
        if (preguntasRestantes > 0) {
            const temasDisponibles = topics.filter((tema) => preguntasPorTema[tema]?.length > Math.floor(quantity / topics.length));
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


//inicialitzar objecte de preguntes d'aquella partida
socket.on("users started", function(data) {
  const { users, roomId, preguntes } = data;
  const salaPartida = `partida-${roomId}`;
 
 
  //guardar les preguntes en l'objecte global
  preguntesPerSala[salaPartida] = preguntes;
  currentQuestionIndex = 0;
 
  //console.log(userScores[salaPartida][users[0]], preguntesPerSala[salaPartida]);
 });
 
 
 socket.on("game started", function(data) {
  const { time, roomId } = data;
  const salaPartida = `partida-${roomId}`;
  //console.log("sala de la partida ", salaPartida);



  const roomsInfo = io.sockets.adapter.rooms;

    // Verificar si la sala específica existe en la información de las salas
    if (roomsInfo.has(salaPartida)) {
        // Obtener la cantidad de conexiones en la sala específica
        const connectionsInRoom = roomsInfo.get(salaPartida).size;

        // Mostrar la cantidad de conexiones por consola
        console.log("Cantidad de conexiones en la sala " + salaPartida + ":", connectionsInRoom);
    }

  //obtenir les preguntes de l'objecte global
  const preguntes = preguntesPerSala[salaPartida];
  const timeNumeric = parseInt(time) * 1000;

  //console.log(preguntes)
  // Iniciar el temporitzador per la pregunta actual
  let timer = setTimeout(() => {
    console.log("times up enviat!")
    socket.emit("time's up", { time, roomId });
  }, timeNumeric);
  
  //comprovar que hi han més preguntes
  if (currentQuestionIndex < preguntes.length) {
    //hi ha més preguntes, enviar-la
    io.to(salaPartida).emit("new question", { question: preguntes[currentQuestionIndex], time: time });
    console.log(currentQuestionIndex)
    currentQuestionIndex++;
  } else {
    // no hi ha més preguntes, enviar "game over"
    io.to(salaPartida).emit("game over");
  }
 });

 //Quan acaba el temps de la pregunta, donar 7 segons per comprovar els resultats
 socket.on("extra time", function(data) {
  const { time, roomId } = data;
  const salaPartida = `partida-${roomId}`;
  //console.log("hola desde time's up")

  //Afegir un contador abans de començar la següent pregunta
  setTimeout(() => {
    //console.log(time, roomId)
    // Emitir "game started" per a que comensi la següent
    socket.emit("time finished", { time, roomId });
  }, 7000); // 5000 mil·Lisegons = 5 segundos
});

// Rebre les respostes, comprovar el resultat i actualitzar objecte "userScores"
socket.on("resposta", function(data) {
  const { buttonIndex, pregunta, idPartida, nicknameUser, tempsResposta, tempsPregunta } = data;
  const preguntaObj = JSON.parse(pregunta);
  
 // Mapear letras a índices numéricos
const indexMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };

// Obtener el índice numérico correspondiente a la letra
const numericIndex = indexMap[buttonIndex];

// Incrementar el contador en el array clickCounts usando el índice numérico
clickCounts[numericIndex]++;

  console.log("array: ", clickCounts)
  //console.log("temps de la resposta: ", tempsResposta)
  const username = nicknameUser;
  const salaPartida = `partida-${idPartida}`;
  //console.log("resposta clicada", preguntaObj.respostes[buttonIndex], "amb temps: ", tempsPregunta);

  // Verificar si el usuario ya tiene una puntuación asociada
  if (!userScores[nicknameUser]) {
    userScores[nicknameUser] = {
      puntuacio: 0,
      correctes: 0,
      incorrectes: 0,
    };
  }

  // Respuesta del usuario y respuesta correcta
  const respostaUsuari = preguntaObj.respostes[buttonIndex];
  const respostaCorrecta = preguntaObj.correcta;

  // Calcular la puntuación basada en el tiempo restante y la precisión
  let puntuacio = 0;
  let isCorrecta = false;
  if (respostaUsuari === respostaCorrecta) {
    // Respuesta correcta: calcular la puntuación basada en el tiempo restante
    const maxPuntuacio = 750; // Puntuación máxima posible
    const minPuntuacio = 100; // Puntuación mínima posible
    const tempsMaxim = tempsPregunta; // Tiempo máximo permitido para obtener la puntuación máxima (en segundos)
    const tempsMinim = 1; // Tiempo mínimo permitido para obtener la puntuación mínima (en segundos)
    const tempsRestantNormalitzat = tempsResposta / tempsMaxim; // Normalizar el tiempo restante

    // Calcular la puntuación basada en el tiempo restante y la precisión
    puntuacio = Math.round(minPuntuacio + (maxPuntuacio - minPuntuacio) * tempsRestantNormalitzat * 0.5); // Ajustar el factor de tiempo

    // Actualizar la puntuación y las respuestas correctas
    userScores[nicknameUser].correctes++;

    // Actualizar la puntuación acumulada del usuario
    userScores[nicknameUser].puntuacio += puntuacio;

    // Definir que la resposta es correcta
    isCorrecta = true;
  } else {
    // Respuesta incorrecta: no sumar puntos, solo actualizar las respuestas incorrectas
    userScores[nicknameUser].incorrectes++;
  }

  // Enviar al cliente el objeto "userScores" actualizado
  io.to(salaPartida).emit("noves puntuacions", { userScores: userScores[nicknameUser], username, isCorrecta, clickCounts });
});



socket.on('disconnect', function() {
  console.log("desconnectat!")
//modificar el objecte d'users
});


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


