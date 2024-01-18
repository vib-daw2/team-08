const socket = io();

const createButton = document.getElementById("createButton");
const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");
const messageElement = document.getElementById('message');
const startButton = document.getElementById('start-button');

if (sendButton) {
  sendButton.addEventListener("click", send);
}

function send() {
  const nickname = nicknameInput.value;
  socket.emit("nickname", { nickname });
}

socket.on('nickname rebut', function(data) {

  console.log(data)
  if (data.redirectUrl) {
       sessionStorage.setItem('socketId', data.socketID);
       sessionStorage.setItem('nicknameUser', data.nicknameUser);
       //console.log(data.socketID)
       const socketID = sessionStorage.getItem('socketId');
       const nicknameUser = sessionStorage.getItem('nicknameUser');
       console.log("Valor de socketId en sessionStorage:", socketID);
       console.log("Valor de nicknameUser en sessionStorage:", nicknameUser);
      //redirigir a la pàgina que indica el servidor(home)
      window.location.href = data.redirectUrl;
  }
 })
const nicknameUser = sessionStorage.getItem('nicknameUser');
const socketID = sessionStorage.getItem('socketId');


// Enviar la información al servidor independientemente de si el usuario proporcionó un nickname
socket.emit("nicknameUser", { nicknameUser });




// Verificar si ya se ha redirigido
// Verificar si ya se ha redirigido
const redirected = sessionStorage.getItem('redirected');


// Si no se ha redirigido, manejar el evento de redirección desde el servidor
if (!redirected) {
   socket.on("redirect", (data) => {
       const redirectUrl = data.redirectUrl;
       console.log("Redirigiendo a:", redirectUrl);


       // Marcar que ya se ha realizado la redirección en sessionStorage
       sessionStorage.setItem('redirected', 'true');


      


       // Realizar la redirección del lado del cliente
       //messageElement.innerText = "Escriu un username!";
       console.log(messageElement);
       window.location.href = redirectUrl;
      
   });
} else {
   // Si ya se ha redirigido, eliminar la marca de sessionStorage
   sessionStorage.removeItem('redirected');
}

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
     const nicknameLocal = sessionStorage.getItem("nicknameUser");

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
              nicknameAdmin: sessionStorage.getItem("nicknameUser"),
               time: document.getElementById("time").value,
          };

          // Emitir un event al servidor amb les dades del formulari
          socket.emit("crear partida", formData);
      });
  } else {
      //console.log("No estas en createGame.html");
  }
 });


//assignar un títol
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const nickname = params.get("nickname");
  const storedNickname = sessionStorage.getItem("nicknameUser");
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
const nicknameUrl = urlParams.get('nickname');
console.log(nicknameUser)
console.log(socketID)


// Enviar mensaje al servidor para unirse a la sala de la partida
if (idPartida && nicknameUrl) {
   // Enviar mensaje al servidor para unirse a la sala de la partida
  
   socket.emit("join game", { idPartida, nicknameUser, socketID });
}


// Rep la partida configurada
socket.on("preguntes partida", function(dataPartida) {
   const { idPartida, preguntesPartida, nicknameAdmin, time } = dataPartida;
   console.log(dataPartida);
   sessionStorage.setItem('idPartida', idPartida);
   
   sessionStorage.setItem('dataGame', JSON.stringify(dataPartida));
   // Redirigir a la página lobby.html con el identificador único en la URL
   const lobbyUrl = `http://localhost:3000/lobby.html?partida=${dataPartida.idPartida}&nickname=${dataPartida.nicknameAdmin}`;
   //console.log(lobbyUrl);
   window.location.href = lobbyUrl;
   
});

if (startButton) {
   startButton.addEventListener("click", start);
}


function start() {
   let IdPartida = sessionStorage.getItem('idPartida');
   // Enviar un mensaje al servidor indicando que la partida está comenzando
   socket.emit("startGame", { idPartida: IdPartida });

   const json = sessionStorage.getItem('dataGame');
   const dataGame = JSON.parse(json);
   socket.emit("preguntes configurades", dataGame);
   //console.log(dataGame);


   socket.emit("holaa", IdPartida);
   

}

socket.on("start game", function(data) {
  const { idPartida, preguntesPartida, nicknameAdmin, time } = data;
  console.log("Información sobre preguntas recibida:", data);

});

socket.on("holaaa", function () {
    
});
// Escuchar la respuesta del servidor con las preguntas

// Escuchar el evento del servidor para redirigir a los usuarios
socket.on("redirectToGame", function() {
   //window.location.href = "game.html";
   
});


// Obtenir llista d'usuaris que formen part de la sala a la que s'ha unit
socket.on("users in room", function(data) {
   const usernamesArray = data.usernamesArray;
   //passar els usernamesArray al servidor, i cridar-ho desde game.js
   console.log("Usuaris en la sala:", usernamesArray);


   // Obtén la referencia al elemento de la lista de usuarios
   const userListElement = document.getElementById("user-list");


   // Limpia la lista actual
   userListElement.innerHTML = "";

   // Actualiza la lista con los nuevos usuarios
   usernamesArray.forEach(username => {
       const liElement = document.createElement("li");
       liElement.textContent = username;
       userListElement.appendChild(liElement);
   });
});


