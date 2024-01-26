const socket = io();

const createButton = document.getElementById("createButton");
const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");
const messageElement = document.getElementById('message');
const startButton = document.getElementById('start-button');




//Gestionar el nickname de l'usuari
if (sendButton) {
  sendButton.addEventListener("click", send);
}

function send() {
  const nickname = nicknameInput.value;
  socket.emit("nickname", { nickname });
}
//guardar els valors en sessionStorage per no perdre'ls al redireccionar
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

 //declarar el id i username de l'usuari de forma global
const nicknameUser = sessionStorage.getItem('nicknameUser');
const socketID = sessionStorage.getItem('socketId');

//Enviar la informació al servidor
socket.emit("nicknameUser", { nicknameUser });


// Verificar usuari té nickname o no
const redirected = sessionStorage.getItem('redirected');

// Si no s'ha redirigit, gestionar-ho desde servidor
if (!redirected) {
   socket.on("redirect", (data) => {
       const redirectUrl = data.redirectUrl;
       console.log("Redirigiendo a:", redirectUrl);

       // Marcar que ja s'ha fet la redirecció en sessionStorage
       sessionStorage.setItem('redirected', 'true');

       // Realitzar la redirecció a index.html
       //messageElement.innerText = "Escriu un username!";
       console.log(messageElement);
       window.location.href = redirectUrl;
      
   });
} else {
   // Si ja s'ha redirigit eliminar la marca de sessionStorage
   sessionStorage.removeItem('redirected');
}

//cridar "get users"
socket.emit("get users");

// Gestionar la resposta amb tots els usuaris
socket.on("users", function(data) {
  const userList = data;
  console.log("Llista d'usuaris:", userList);
});

// Redirigir a la pàgina per crear partida
if (createButton) {
createButton.addEventListener("click", function() {
  window.location.href = "createGame.html";
});
}

// Crear partida
document.addEventListener("DOMContentLoaded", function () {
  // Verificar si estem en createGame.html
  if (window.location.href.endsWith("createGame.html")) {
     // Obtenir el nickname del sessionStorage
     const nicknameLocal = sessionStorage.getItem("nicknameUser");

     // CCompletar automàticament el camp títol amb el nom de l'usuari
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


//assignar un títol a la partida
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const nickname = params.get("nickname");
  const storedNickname = sessionStorage.getItem("nicknameUser");
  //console.log(storedNickname);
  // Modificar el títol en lobby.html
  const titleLobby = document.getElementById("titleLobby");
  if (titleLobby && nickname) {
      titleLobby.innerText = "Partida de " + nickname;

      // Ocultar el botó "Començar partida" si l'user no és administrador
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
   
      const linkInput = document.getElementById("linkInput");
      const entrarButton = document.getElementById("entrarButton");

      // Redirigir a l'usuari quan cliqui "enviar" a la url proporcionada
      entrarButton.addEventListener("click", function () {
          // Url proporcionada per l'usuari
          const lobbyUrl = linkInput.value;
          // Redirigir a la lobby
          window.location.href = lobbyUrl;
      });
  } else {
      //console.log("No estás en home.html");
  }
});

// Extreure paràmetres de la URL (per comprovar que l'usuari ha entrat en una partida)
const urlParams = new URLSearchParams(window.location.search);
const idPartida = urlParams.get('partida');
const nicknameUrl = urlParams.get('nickname');

console.log(nicknameUser)
console.log(socketID)


// Enviar missatge al servidor per unir-se a la sala
if (idPartida && nicknameUrl) {

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

//botó per començar partida
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

  // Obtenir la referència de la llista d'usuaris de lobby
  const userListElement = document.getElementById("user-list");

  if (window.location.pathname.endsWith("lobby.html")) {
  // Neteja la llista actual
  userListElement.innerHTML = "";

  // Actualitza la llista amb els nous usuaris
  usernamesArray.forEach(username => {
      const liElement = document.createElement("li");
      liElement.textContent = username;
      userListElement.appendChild(liElement);
  });
}
});


// JOC INICIAT (quan entren a game.html)
if (window.location.pathname.endsWith("game.html")) {

  //fer que si l'usuari fa refresh l'envï a home
  document.addEventListener("DOMContentLoaded", function () {
    //verificar si es una recàrrega
    if (performance.navigation.type === 1) {
      //Redirigir a home.html
      window.onload = function (e) {
        window.location.href = 'home.html';
      }
    }
  });

  //obtenir dades de la partida(dataGameGlobal) i els usuaris de la partida(usersData)
  const jsonGlobal = sessionStorage.getItem('dataGlobal');
  const dataGameGlobal = JSON.parse(jsonGlobal);
  console.log(dataGameGlobal);

  const usersGame = sessionStorage.getItem('usersGame');
  const usersData = JSON.parse(usersGame);
  console.log(usersData)

 
 // Canviar el format de users a array
const usersArray = Array.isArray(usersData) ? usersData : [usersData];

//definir l'admin de la partida
let userAdmin = dataGameGlobal.nicknameAdmin;

// Obtenir l'usuari administrador i el del jugador connectat
const nicknameJugador = sessionStorage.getItem('nicknameUser');
const nicknameAdmin = userAdmin;

if(nicknameAdmin == nicknameJugador)
{
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

//deshabilitar botons per l'admin
const buttons = document.querySelectorAll('.answer-btn');
buttons.forEach((button, index) => {

        button.classList.remove('clicked');
        button.classList.add('disabled');
        button.disabled = true; // Deshabilita todos los botones
    
});
}

socket.on("new question", function(pregunta) {
 const { question } = pregunta;
 //guardar l'objecte per passar-lo amb la resposta de l'usuari
 sessionStorage.setItem("currentQuestion", JSON.stringify(pregunta));
 //mostrar la pregunta per pantalla
console.log("primera pregunta per a tots ", pregunta)
mostrarPregunta(pregunta);
//actualitzar contador

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

socket.on("noves puntuacions", function(data) {
  const { userScores, username } = data;

  const nicknameP = username;
  console.log("Puntuaciones actualizadas:", userScores , "per a ", nicknameP);
  
  //actualitzar la taula...
  actualitzarPuntuacions(userScores, nicknameP);
});

socket.on("game over", function() {
console.log("Game over!")
window.location.href = 'podio.html';

});

  
// Función que almacena la cantidad de clics que se ha hecho a cada botón y ejecuta la función que deshabilita el resto de los botones
function handleButtonClick(buttonIndex) {
  const storedQuestion = sessionStorage.getItem("currentQuestion");

  if (storedQuestion) {
    // Convierte la pregunta de cadena a objeto
    const pregunta = JSON.parse(storedQuestion);

    // Emite la respuesta y la pregunta al servidor
    console.log('Opció seleccionada:',buttonIndex);
    socket.emit('resposta', { buttonIndex, pregunta: JSON.stringify(pregunta), idPartida, nicknameUser });

  }
    
  //Obtenir el botó clicat, i deshabilitar els botons
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((button, index) => {
        if (index === buttonIndex) {
               button.classList.add('clicked');
        } else {
            button.classList.remove('clicked');
            button.classList.add('disabled');
            button.disabled = true; 
        }
    });
    // Incrementar el contador de clics para el botón correspondiente
    clicks[buttonIndex]++;
  
  }

  //plenar taula dinàmicament
  const tbodyElement = document.querySelector("#user-table tbody");

  tbodyElement.innerHTML = "";

  usersData.usernamesArray.forEach((username, index) => {
    // Verificar que l'usuari no sigui administrador
    if (username !== nicknameAdmin) {
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
    }
  });

  //actualitzar la taula de jugadors cada resposta
  function actualitzarPuntuacions(userScores, username) { //username ha de ser el del que ha actualitzat
    // Obtener la tabla y sus filas
    const table = document.getElementById("user-table");
    const rows = table.getElementsByTagName("tr");

    // Iterar sobre las filas y actualizar la información del usuario específico (jan)
    for (let i = 0; i < rows.length; i++) {
        const usernameCell = rows[i].cells[1]; // La celda que contiene el nombre de usuario

        // Comprobar si la fila pertenece al usuario específico (jan)
        if (usernameCell.textContent.trim() === username) {
            const puntosCell = rows[i].cells[0];
            const aciertosCell = rows[i].cells[2];
            const fallosCell = rows[i].cells[3];
            const porcentajeCell = rows[i].cells[4];

            // Actualizar la información del usuario específico
            puntosCell.textContent = userScores.puntuacio;
            aciertosCell.textContent = userScores.correctes;
            fallosCell.textContent = userScores.incorrectes;
            // Calcular y actualizar el porcentaje
            const porcentaje = (userScores.correctes / (userScores.correctes + userScores.incorrectes)) * 100;
            porcentajeCell.textContent = porcentaje.toFixed(2) + "%";
            break; // Salir del bucle después de actualizar la fila del usuario específico
        }
    }
}

  
  //var index = 0;
  //var sP= 1;

   // Aquí s'hauria de fer una funció que rebés l'id de la pregunta per servidor i omplís de forma dinàmica la posició del array

   function mostrarPregunta(pregunta) {
    // Introdueix el número de countdown 
    //const countD = document.getElementById("countdown");
    //countD.textContent = 10; // Asumiendo que la pregunta tiene un campo 'time'

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
  

}
 


 
