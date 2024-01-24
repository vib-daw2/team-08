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


//crear partida
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
  //demanar preguntes i proporcionar-les als usuaris de la sala
   const json = sessionStorage.getItem('dataGame');
   const dataGame = JSON.parse(json);
   socket.emit("preguntes configurades", dataGame);
   //console.log(dataGame);

}

//partida començada
socket.on("start game", function(data) {
  const { idPartida, preguntesPartida, nicknameAdmin, time } = data;
  //console.log("Informació sobre preguntes:", data);

 const jsonString = JSON.stringify(data);
 sessionStorage.setItem('dataGlobal', jsonString);

 const jsonGlobal = sessionStorage.getItem('dataGlobal');
 const dataGameGlobal = JSON.parse(jsonGlobal);
 //console.log(dataGameGlobal);
 const lobbyUrl = `http://localhost:3000/game.html?partida=${dataGameGlobal.idPartida}&nickname=${dataGameGlobal.nicknameAdmin}`;
 window.location.href = lobbyUrl;

});



// Obtenir llista d'usuaris que formen part de la sala a la que s'ha unit
socket.on("users in room", function(data) {
  const usernamesArray = data.usernamesArray;
  //passar els usernamesArray al servidor, i cridar-ho desde game.js
  console.log("Usuaris en la sala:", usernamesArray);


  const jsonString = JSON.stringify(data);
  sessionStorage.setItem('usersGame', jsonString);

  // Obtén la referencia al elemento de la lista de usuarios
  const userListElement = document.getElementById("user-list");

  if (window.location.pathname.endsWith("lobby.html")) {
  // Limpia la lista actual
  userListElement.innerHTML = "";

  // Actualiza la lista con los nuevos usuarios
  usernamesArray.forEach(username => {
      const liElement = document.createElement("li");
      liElement.textContent = username;
      userListElement.appendChild(liElement);
  });
}
});



// JOC INICIAT
if (window.location.pathname.endsWith("game.html")) {
  const jsonGlobal = sessionStorage.getItem('dataGlobal');
  const dataGameGlobal = JSON.parse(jsonGlobal);
  console.log(dataGameGlobal);
 
 
  const usersGame = sessionStorage.getItem('usersGame');
  const usersData = JSON.parse(usersGame);
  console.log(usersData)
 
 
 // Asegúrate de que 'usersData' sea un array
 const usersArray = Array.isArray(usersData) ? usersData : [usersData];
 
 
 
 
 
 
 
 
 //Inicialitzar objecte d'usuaris
 socket.emit("users started", {
   users: usersArray,
   roomId: dataGameGlobal.idPartida,
   preguntes: dataGameGlobal.preguntesPartida,
 });
 
 
 //Inicialitzar contador
 socket.emit("game started", {
   time: dataGameGlobal.time,
   roomId: dataGameGlobal.idPartida,
 });
 
 
 socket.on("new question", function(data) {
 const { question } = data;
 //mostrar la pregunta per pantalla
 console.log("primera pregunta per a tots ", data)
 mostrarPregunta(data);
 });
 
 
 socket.on("time's up", function(data) {
  const { time, roomId } = data;
 
 
  console.log("primer temps acabat!")
  socket.emit("extra time", { time, roomId });
 });
 
 
 socket.on("time finished", function(data) {
  const { time, roomId } = data;
  console.log("segon temps acabat!")
  socket.emit("game started", { time, roomId });
 });
 
 
 
 
 
 
  // Función que envía el contenido de la respuesta seleccionada
  function sendAnswer(option){
    console.log('Opcio seleccionada:',option);
    socket.emit('respuestaSeleccionada', { option: option });
  }
 
 
  // Función que almacena la cantidad de clics que se ha hecho a cada botón y ejecuta la función que deshabilita el resto de los botones
  function handleButtonClick(buttonIndex) {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((button, index) => {
        if (index === buttonIndex) {
               button.classList.add('clicked');
        } else {
            button.classList.remove('clicked');
            button.classList.add('disabled');
            button.disabled = true; // Deshabilita todos los botones
        }
    });
    // Incrementar el contador de clics para el botón correspondiente
    clicks[buttonIndex]++;
 
 
    // Deshabilitar todos los botones después de que uno ha sido clicado
    disableAllButtons();
 }
 
 
  //definir l'admin de la partida
  let userAdmin = dataGameGlobal.nicknameAdmin;
 
 
 // Amagar el botó següent pregunta si l'usuari no es admin
 
 
 const nicknameJugador = sessionStorage.getItem('nicknameUser');
 const nicknameAdmin = userAdmin;
 
 
 // Obtener referencia al botón "Següent pregunta"
 let nextQuestionButton = document.getElementById("next-question");
 
 
 // Comparar los nicknames
 if (nicknameJugador !== nicknameAdmin) {
    //ocultar el botón si los nicknames no coinciden
    nextQuestionButton.style.display = "none";
 }
 
 
  //plenar taula dinàmicament
  const tbodyElement = document.querySelector("#user-table tbody");
 
 
  // Limpiar el contenido actual de la tabla
  tbodyElement.innerHTML = "";
 
 
  // Rellenar la tabla con los usuarios dinámicamente
  usersData.usernamesArray.forEach((username, index) => {
    const trElement = document.createElement("tr");
 
 
    // Columna de aciertos (inicialmente en 0)
    const tdPunts = document.createElement("td");
    tdPunts.textContent = "0";
    trElement.appendChild(tdPunts);
 
 
    // Columna de nombre de usuario
    const tdUsername = document.createElement("td");
    tdUsername.textContent = username;
    trElement.appendChild(tdUsername);
 
 
    // Columna de aciertos (inicialmente en 0)
    const tdAciertos = document.createElement("td");
    tdAciertos.textContent = "0";
    trElement.appendChild(tdAciertos);
 
 
    // Columna de fallos (inicialmente en 0)
    const tdFallos = document.createElement("td");
    tdFallos.textContent = "0";
    trElement.appendChild(tdFallos);
 
 
    // Columna de porcentaje de respuestas correctas/incorrectas (inicialmente en 0%)
    const tdPorcentaje = document.createElement("td");
    tdPorcentaje.textContent = "0%";
    trElement.appendChild(tdPorcentaje);
 
 
    // Agregar la fila a tbody
    tbodyElement.appendChild(trElement);
  });
 
 
   //var index = 0;
  //var sP= 1;
 
 
   // Aquí s'hauria de fer una funció que rebés l'id de la pregunta per servidor i omplís de forma dinàmica la posició del array
 
 
   function mostrarPregunta(pregunta) {
    // Introdueix el número de countdown
    const countD = document.getElementById("countdown");
    countD.textContent = 10; // Asumiendo que la pregunta tiene un campo 'time'
 
 
    // Introdueix la imatge corresponent a l'element img id=image
    const imaG = document.getElementById("image");
    imaG.src = pregunta.imatge;
     // Introdueix el contingut de la resposta correcta a l'element right-answer-text
    const respCorr = document.getElementById("right-answer-text");
    respCorr.textContent = pregunta.correcta;
     // Introdueix el contingut del comentari a l'element comentari
    const coment = document.getElementById("comentari");
    coment.textContent = pregunta.comentari;
     // Introdueix el contingut de la primera pregunta a l'element question
    const preguntaElem = document.getElementById("pregunta");
    preguntaElem.textContent = pregunta.pregunta;
     // Introdueix el contingut de les respostes als elements resposta-x
    const respA = document.getElementById("resposta-a");
    const respB = document.getElementById("resposta-b");
    const respC = document.getElementById("resposta-c");
    const respD = document.getElementById("resposta-d");
     respA.textContent = pregunta.respostes['a'];
    respB.textContent = pregunta.respostes['b'];
    respC.textContent = pregunta.respostes['c'];
    respD.textContent = pregunta.respostes['d'];
     // Introdueix el contingut de la font a l'element a id=referencia
    const refeR = document.getElementById("referencia");
    refeR.href = pregunta.font;
  }
 
 
 nextQuestionButton = document.getElementById("next-question");
 
 
 nextQuestionButton.addEventListener("click", function() {
    // Incrementar el índice
    preguntaIndex++;
 
 
    // Mostrar la siguiente pregunta
    mostrarPregunta(preguntaIndex);
 });
  }
 
 
 