const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

app.use(express.static("public"));

const io = new Server(httpServer, {});


io.on("connection", (socket) => {
  
    console.log('Connectat un client...')
    //socket.data.nickname = "alice";
    socket.on("nickname", function(data) {
            console.log(data.nickname)
            
            socket.data.nickname = data.nickname;
           
            // respondre al que ha enviat
            socket.emit("nickname rebut",{"response":"ok"})

            // respondre a la resta de clients menys el que ha enviat
            // socket.broadcast.emit(/* ... */);

            // Totes les funcions disponibles les tenim a
            //  https://socket.io/docs/v4/emit-cheatsheet/
    })
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
