const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

app.use(express.static("public"));

const io = new Server(httpServer, {});
const fs = require("fs");
let preguntes = [];

io.on("connection", (socket) => {
  
    console.log('Connectat un client...')
    //socket.data.nickname = "alice";

    //socket obtenir nickname
    socket.on("nickname", function(data) {
            console.log(data.nickname)
            
            socket.data.nickname = data.nickname;
            const redirectUrl = "/home.html";
            // respondre al que ha enviat
            socket.emit("nickname rebut",{"response":"ok", redirectUrl})
    })

    //socket obtenir usuaris
    socket.on("get users", function(data) {
        const users = [];
      
        for (let [id, socket] of io.of("/").sockets) {
            
          users.push({
            userID: id,
            username: socket.data.nickname || "NoNickname",
          });
        }
      
        io.emit("users", users);
        console.log("llista d'usuaris enviada");
      });

      //socket crear partida
      socket.on("crear partida", function(configuracioPartida) {
        try {
            // Manejar la lógica de creación de partida aquí
            const { title, quantity, topics } = configuracioPartida;

            // ... (código de filtrado y envío de preguntas)

        } catch (error) {
            console.error("Error al procesar la solicitud de creación de partida:", error);
        }
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
