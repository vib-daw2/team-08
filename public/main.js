const socket = io();


const createButton = document.getElementById("createButton");
const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");


if (sendButton) {
   sendButton.addEventListener("click", send);
}


function send() {
   const nickname = nicknameInput.value;
   // Guardar el nickname en el almacenamiento local
   localStorage.setItem("nickname", nickname);

   socket.emit("nickname", { nickname });
}


socket.on('nickname rebut', function(data) {


   console.log(data)
   if (data.redirectUrl) {
       //redirigir a la pàgina que indica el servidor(home)
       window.location.href = data.redirectUrl;
   }
  
})


// En el cliente (main.js)

let isOnIndexPage = window.location.pathname === "/index.html";

socket.on("redirect", function(data) {
    // Verificar si ya estamos en la página de destino
    if (window.location.pathname !== data.redirectUrl) {
        // Redirigir al usuario a la URL proporcionada
        console.log("Redirigiendo a " + data.redirectUrl);
       // window.location.href = data.redirectUrl;
    }
});


socket.on("connect", function () {
   console.log("Connexió amb el servidor");
});


//cridar "get users"
socket.emit("get users");


// Gestionar la resposta amb tots els usuaris
socket.on("users", function(data) {
   const userList = data;
   console.log("Llista d'usuaris:", userList);
});








socket.on('salutacio', function(data) {


   console.log(data)


})


if (createButton) {
createButton.addEventListener("click", function() {
   // Redirigir a la pàgina createGame.html
   window.location.href = "createGame.html";
});
}




document.addEventListener("DOMContentLoaded", function () {
   // Verificar si estem en createGame.html
   if (window.location.href.endsWith("createGame.html")) {
      // Obtener el nickname del almacenamiento local
      const nicknameLocal = localStorage.getItem("nickname") || "";


      // Completar automáticamente el campo de entrada de título con el nickname
      const titleInput = document.getElementById("title");
      if (titleInput) {
          titleInput.value = "Partida de " + nicknameLocal;
      }
       document.getElementById("createGameForm").addEventListener("submit", function (event) {
           event.preventDefault();
           console.log("Formulari enviat");


           // Guardar les dades en el formulari
           const formData = {
               title: document.getElementById("title").value,
               quantity: document.getElementById("quantity").value,
               topics: Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(topic => topic.value),
               nickname: localStorage.getItem("nickname") || ""
           };


           // Emitir un event al servidor amb les dades del formulari
           socket.emit("crear partida", formData);
       });
   } else {
       //console.log("No estas en createGame.html");
   }


   //rep la partida configurada
   socket.on("preguntes partida", function(dataPartida) {
       const { idPartida, preguntesPartida, nickname } = dataPartida;
       console.log(dataPartida)
       // Redirigir a la página lobby.html con el identificador único en la URL
       const lobbyUrl = `http://localhost:3000/lobby.html?partida=${dataPartida.idPartida}&nickname=${dataPartida.nickname}`;
       console.log(lobbyUrl);
       window.location.href = lobbyUrl;
   });
  
});


//assignar un títol
document.addEventListener("DOMContentLoaded", function () {
   const params = new URLSearchParams(window.location.search);
   const nickname = params.get("nickname");
   const storedNickname = localStorage.getItem("nickname") || "";
   //console.log(storedNickname);
   // Modificar el título en lobby.html
   const titleLobby = document.getElementById("titleLobby");
   if (titleLobby && nickname) {
       titleLobby.innerText = "Partida de " + nickname;


       // Ocultar el botón de empezar partida si el nickname actual no coincide
       const startButton = document.getElementById("start-button");
       if (storedNickname !== nickname) {
           startButton.style.display = "none";
       }
   }
});




//entrar a una sala a traves de la URL
document.addEventListener("DOMContentLoaded", function () {
   // Verificar si estas en home.html
   if (window.location.href.endsWith("home.html")) {
     
       // Obtener elementos del DOM
       const linkInput = document.getElementById("linkInput");
       const entrarButton = document.getElementById("entrarButton");


       // Agregar un evento de clic al botón "Entrar"
       entrarButton.addEventListener("click", function () {
           // Obtener la URL ingresada por el usuario
           const lobbyUrl = linkInput.value;


           // Redirigir a la lobby
           window.location.href = lobbyUrl;
       });
   } else {
       //console.log("No estás en home.html");
   }
});


// Extraer parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const idPartida = urlParams.get('partida');
const nickname = urlParams.get('nickname');


// Enviar mensaje al servidor para unirse a la sala de la partida
if (idPartida && nickname) {
    // Enviar mensaje al servidor para unirse a la sala de la partida
    socket.emit("join game", { idPartida, nickname });
}

