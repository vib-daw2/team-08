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
io.on("connection", (socket) => {
    console.log('Connectat un client...')
   //socket.data.nickname = "alice";


   //socket obtenir nickname
   socket.on("nickname", function(data) {
          
           socket.nickname = data.nickname;
           users.push({
               userID: socket.id,
               username: socket.nickname
           });
           const redirectUrl = "/home.html";
           // respondre al que ha enviat
           socket.emit("nickname rebut",{"response":"ok", redirectUrl})
   })


   socket.on("get users", function() {
       socket.emit("users", { users });
   });


     //socket crear partida, filtra les preguntes segons els requisits del form (quantitat i topics)
     socket.on("crear partida", function(configuracioPartida) {
       //console.log("hola");
       try {
           // Manejar la lógica de creación de partida aquí
           const { title, quantity, topics, nickname } = configuracioPartida;
  
           // Inicializar un objeto para almacenar preguntas por tema
           const preguntasPorTema = {};
  
           // Filtrar preguntas según la configuración recibida y agruparlas por tema
           preguntes.forEach((pregunta) => {
               const tema = pregunta.modalitat.toLowerCase();
               if (topics.includes(tema)) {
                   preguntasPorTema[tema] = preguntasPorTema[tema] || [];
                   preguntasPorTema[tema].push(pregunta);
               }
           });
  
           // Inicializar un array para almacenar las preguntas finales
           const preguntesPartida = [];
  
           // Calcular la cantidad de preguntas por tema
           const cantidadPorTema = Math.floor(quantity / topics.length);
  
           // Seleccionar preguntas de cada tema según la cantidad calculada
           topics.forEach((tema) => {
               const preguntasDelTema = preguntasPorTema[tema] || [];
               preguntesPartida.push(...preguntasDelTema.slice(0, cantidadPorTema));
           });
  
           // Si hay preguntas restantes, seleccionar al azar de los temas disponibles 9/3
           const preguntasRestantes = quantity - preguntesPartida.length;
           if (preguntasRestantes > 0) {
               const temasDisponibles = topics.filter((tema) => preguntasPorTema[tema]?.length > cantidadPorTema);
               for (let i = 0; i < preguntasRestantes; i++) {
                   const temaAleatorio = temasDisponibles[Math.floor(Math.random() * temasDisponibles.length)];
                   const preguntasDelTema = preguntasPorTema[temaAleatorio] || [];
                   preguntesPartida.push(preguntasDelTema[Math.floor(Math.random() * preguntasDelTema.length)]);
               }
           }
           const idPartida = uuidv4();
           // Asociar la sala con el identificador único
           const salaPartida = `partida-${idPartida}`;
           socket.join(salaPartida);
           // Enviar preguntas al cliente
           //console.log(nickname);
           socket.emit("preguntes partida", { idPartida, preguntesPartida, nickname });
       } catch (error) {
           console.error("Error al procesar la sol·licitud de creació de la partida:", error);
       }
   });
   
   socket.on("join game", function(data) {
       const { idPartida, nickname } = data;
       const salaPartida = 'partida-${idPartida}';
       socket.join(salaPartida);
       console.log("unit a la sala")
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
