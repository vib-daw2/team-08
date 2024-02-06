const socket = io();

const createButton = document.getElementById("createButton");
const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");
const messageElement = document.getElementById('message');
const startButton = document.getElementById('start-button');


// Gestionar el nickname de l'usuari
if (sendButton) {
  sendButton.addEventListener("click", send);
}

function send() {
  const nickname = nicknameInput.value;
  socket.emit("nickname", { nickname });
}
// Guardar els valors en sessionStorage per no perdre'ls al redireccionar
socket.on('nickname rebut', function(data) {

  console.log(data)
  if (data.redirectUrl) {
       sessionStorage.setItem('socketId', data.socketID);
       sessionStorage.setItem('nicknameUser', data.nicknameUser);
       
       const socketID = sessionStorage.getItem('socketId');
       const nicknameUser = sessionStorage.getItem('nicknameUser');
       console.log("Valor de socketId en sessionStorage:", socketID);
       console.log("Valor de nicknameUser en sessionStorage:", nicknameUser);
      // Redirigir a la pàgina que indica el servidor(home)
      window.location.href = data.redirectUrl;
  }
 })

 // Declarar l'id i username de l'usuari de forma global
const nicknameUser = sessionStorage.getItem('nicknameUser');
const socketID = sessionStorage.getItem('socketId');

// Enviar la informació al servidor
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
       console.log(messageElement);
       window.location.href = redirectUrl;
      
   });
} else {
   // Si ja s'ha redirigit eliminar la marca de sessionStorage
   sessionStorage.removeItem('redirected');
}

// Cridar "get users"
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

     // Completar automàticament el camp títol amb el nom de l'usuari
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
      
  }
 });


// Assignar un títol a la partida
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const nickname = params.get("nickname");
  const storedNickname = sessionStorage.getItem("nicknameUser");
  
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


// Entrar a una sala a través de la URL
document.addEventListener("DOMContentLoaded", function () {
  // Verificar si estas en home.html
  if (window.location.href.endsWith("home.html")) {
   
      const codiInput = document.getElementById("codiInput");
      
      const entrarButton = document.getElementById("entrarButton");

      // Redirigir a l'usuari quan cliqui "enviar" a la url proporcionada
      entrarButton.addEventListener("click", function () {
        const codiInputValue = codiInput.value;
        // Comprovar si el codi existeix
        console.log("CODI INTRODUIT: ", codiInputValue)
        socket.emit("codi partida", codiInputValue);
      });
  } else {
      
  }

  // Event "unir partida" enviat pel servidor
socket.on("unir partida", function(data) {
  // Redirigir a l'usuari a la lobby de la partida
  const { sala, nicknameCreador, codiInputValue } = data;
  const lobbyUrl = `/lobby.html?partida=${sala}&nickname=${nicknameCreador}&codiPartida=${codiInputValue}`;
   
   window.location.href = lobbyUrl;
});

// Manejar el evento "no existeix" enviado por el servidor
socket.on("no existeix", () => {
  console.log("La partida no existe.");
  const message = document.getElementById("error");
  message.textContent = "No existeix cap partida amb aquest codi";
});

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
   const { idPartida, preguntesPartida, nicknameAdmin, time, codiPartida } = dataPartida;
   console.log(dataPartida);
   sessionStorage.setItem('idPartida', idPartida);
   
   sessionStorage.setItem('dataGame', JSON.stringify(dataPartida));
   // Redirigir a la página lobby.html con el identificador único en la URL
   const lobbyUrl = `/lobby.html?partida=${dataPartida.idPartida}&nickname=${dataPartida.nicknameAdmin}&codiPartida=${codiPartida}`;
  
   window.location.href = lobbyUrl;
   
});

// Botó per començar partida
if (startButton) {
   startButton.addEventListener("click", start);
}

function start() {
  // Demanar preguntes i proporcionar-les als usuaris de la sala
   const json = sessionStorage.getItem('dataGame');
   const dataGame = JSON.parse(json);
   socket.emit("preguntes configurades", dataGame);
   

}

// Partida començada
socket.on("start game", function(data) {
  const { idPartida, preguntesPartida, nicknameAdmin, time } = data;


 const jsonString = JSON.stringify(data);
 sessionStorage.setItem('dataGlobal', jsonString);

 const jsonGlobal = sessionStorage.getItem('dataGlobal');
 const dataGameGlobal = JSON.parse(jsonGlobal);
 sessionStorage.setItem('codiPartida', dataGameGlobal.codiPartida);
 console.log("codi de la partida: ", dataGameGlobal.codiPartida)
 const lobbyUrl = `/game.html?partida=${dataGameGlobal.idPartida}&nickname=${dataGameGlobal.nicknameAdmin}`;
 window.location.href = lobbyUrl;

});



// Obtenir llista d'usuaris que formen part de la sala a la que s'ha unit
socket.on("users in room", function(data) {
  const usernamesArray = data.usernamesArray;
  // Passar els usernamesArray al servidor, i cridar-ho desde game.js
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


  //botó tornar a jugar
  const tornarJugar = document.getElementById("tornarJugar");

  let clicksChart = [0, 0, 0, 0];
  // Temps per cada pregunta
  var tempsPregunta;
  // Temps que tarda l'usuari en respondre
  var tempsResposta;
  // Fer que si l'usuari fa refresh l'envï a home
  document.addEventListener("DOMContentLoaded", function () {
    // Verificar si es una recàrrega
    if (performance.navigation.type === 1) {
      //Redirigir a home.html
      window.onload = function (e) {
        window.location.href = 'home.html';
      }
    }
  });


  // Obtenir dades de la partida(dataGameGlobal) i els usuaris de la partida(usersData)
  const jsonGlobal = sessionStorage.getItem('dataGlobal');
  const dataGameGlobal = JSON.parse(jsonGlobal);
  //console.log(dataGameGlobal);

  const usersGame = sessionStorage.getItem('usersGame');
  const usersData = JSON.parse(usersGame);
  //console.log(usersData)
  tempsPregunta = dataGameGlobal.time;
 
 // Canviar el format de users a array
const usersArray = Array.isArray(usersData) ? usersData : [usersData];

// Definir l'admin de la partida
let userAdmin = dataGameGlobal.nicknameAdmin;

// Obtenir l'usuari administrador i el del jugador connectat
const nicknameJugador = sessionStorage.getItem('nicknameUser');
const nicknameAdmin = userAdmin;
temps =  dataGameGlobal.time;

if (nicknameAdmin === nicknameJugador) {
  // Inicialitzar objecte usuaris i preguntes en servidor
  socket.emit("users started", {
      users: usersArray,
      roomId: dataGameGlobal.idPartida,
      preguntes: dataGameGlobal.preguntesPartida,
  });

  const tiempoEspera = 300;

  // Inicialitzar contador per evitar que algun usuari es quedi fora de la partida
  setTimeout(() => {
      // Emitir game started
      socket.emit("game started", {
          time: dataGameGlobal.time,
          roomId: dataGameGlobal.idPartida,
      });
  }, tiempoEspera);
}

// Rep una nova pregunta cada vegada que torna a començar el contadro
socket.on("new question", function(pregunta) {
 const { question, time } = pregunta;
 // Guardar l'objecte per passar-lo amb la resposta de l'usuari
 sessionStorage.setItem("currentQuestion", JSON.stringify(question));
 // Mostrar la pregunta per pantalla
//console.log("primera pregunta per a tots ", question)
mostrarPregunta(question);
startCountdown(time);


});

// Rep missatge quan s'acaba el temps de la pregunta (inicia el temps de espera)
socket.on("time's up", function(data) {
  const { time, roomId } = data;

  console.log("primer temps acabat!")
  socket.emit("extra time", { time, roomId });
});

// Rep un missatge quan s'acaba el segon temps (inicia la següent pregunta)
socket.on("time finished", function(data) {
  const { time, roomId } = data;
  console.log("segon temps acabat!")
  socket.emit("game started", { time, roomId });
});

// Rep les puntuacions actualitzades despres de que l'usuari respongui
socket.on("noves puntuacions", function(data) {
  const { userScores, username, isCorrecta, clickCounts } = data;
  
    //Actualitzar la variable global que guarda els clicks de cada resposta 
    for (let i = 0; i < clickCounts.length; i++) {
      clicksChart[i] += clickCounts[i];
    }
    console.log("array actualitzat: ", clicksChart)

  const nicknameP = username;
  
  
  // Actualitzem la taula
  actualitzarPuntuacions(userScores, nicknameP, isCorrecta);
});

socket.on("game over", function() {
  console.log("Game over!")
  
  
  // Mostrar botó tornar a jugar
  if(nicknameAdmin == nicknameJugador)
   {
     tornarJugar.style.display = 'block';
  
  
   }
  
  
  //reiniciar puntuacions
   const idRoom = dataGameGlobal.idPartida;
   socket.emit("restart scores", { nicknameAdmin, idRoom, usersArray });
  });
  

  
// Gestiona quan l'usuari clica una resposta
function handleButtonClick(buttonIndex) {
  const storedQuestion = sessionStorage.getItem("currentQuestion");

  if (storedQuestion) {
    // Transforma la pregunta de cadena a objecte
    const pregunta = JSON.parse(storedQuestion);

    // Emiteix la pregunta i la resposta al servidor
    console.log('Opció seleccionada:',buttonIndex);
    socket.emit('resposta', { buttonIndex, pregunta: JSON.stringify(pregunta), idPartida, nicknameUser, tempsResposta, tempsPregunta });

  }
    
  // Obtenir el botó clicat, i deshabilitar els botons
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
  }

// Emplenar taula dinàmicament
const tbodyElement = document.querySelector("#user-table tbody");

tbodyElement.innerHTML = "";

usersData.usernamesArray.forEach((username, index) => {
    // Verificar que l'usuari no sigui administrador
    if (username !== nicknameAdmin) {
        const trElement = document.createElement("tr");

        // Columna de punts (inicialment en 0)
        const tdPunts = document.createElement("td");
        tdPunts.classList.add("puntuation");
        tdPunts.textContent = "0";
        trElement.appendChild(tdPunts);
        
        // Columna nom d'usuari
        const tdUsername = document.createElement("td");
        tdUsername.textContent = username;

        // Afegit la classe user-italic a tots els elements de td username
        tdUsername.classList.add("user-italic");

        // Resaltar el usuari connectat

        if (username === nicknameUser) {
            tdUsername.classList.add("user-highlight"); 
            //console.log("usuari connectat: ", nicknameUser)
        }
        trElement.appendChild(tdUsername);

        // Columna d'encerts' (inicialment en 0)
        const tdAciertos = document.createElement("td");
        tdAciertos.textContent = "0";
        trElement.appendChild(tdAciertos);

        // Columna de fallos (inicialment en 0)
        const tdFallos = document.createElement("td");
        tdFallos.textContent = "0";
        trElement.appendChild(tdFallos);

        // Columna de percentatge correctes/incorrectes (inicialment a 0)
        const tdPorcentaje = document.createElement("td");
        tdPorcentaje.textContent = "0%";
        trElement.appendChild(tdPorcentaje);

        // Agregar la fila a tbody
        tbodyElement.appendChild(trElement);
    }
});

/////////////////

// Función para obtener las puntuaciones de los jugadores y crear el array jugadores
function obtenerPuntuaciones() {
  const jugadores = [];
  const labels = [];
  const data = [];

  // Obtener el elemento de la tabla
  const tabla = document.getElementById("user-table");

  // Obtener todas las filas de la tabla, excluyendo la fila de encabezado
  const filas = tabla.querySelectorAll("tbody tr");

  // Iterar sobre las filas y obtener la información
  filas.forEach((fila) => {
    const puntuation = parseInt(fila.querySelector(".puntuation").textContent);
    
    // Verificar la existencia del elemento con la clase user-italic
    const userItalicElement = fila.querySelector(".user-italic");
    const username = userItalicElement ? userItalicElement.textContent : '';


    // Agregar la información a los arrays
    labels.push(username);
    data.push(puntuation);
  });

  // Devolver el objeto con las propiedades necesarias para el gráfico
  return { labels, data };
}

 

////////////////


  function actualitzarPuntuacions(userScores, username, isCorrecta) {
    const table = document.getElementById("user-table");
    const rows = table.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
        const usernameCell = rows[i].cells[1];

        if (usernameCell.textContent.trim() === username) {
            const puntosCell = rows[i].cells[0];
            const aciertosCell = rows[i].cells[2];
            const fallosCell = rows[i].cells[3];
            const porcentajeCell = rows[i].cells[4];

            // Calcular el porcentatge d'encerts
            const totalRespuestas = userScores.correctes + userScores.incorrectes;
            const porcentajeAciertos = totalRespuestas === 0 ? 0 : (userScores.correctes / totalRespuestas) * 100;

            // Actualitzar la informació de l'usuari específic
            puntosCell.textContent = userScores.puntuacio;
            aciertosCell.textContent = userScores.correctes;
            fallosCell.textContent = userScores.incorrectes;
            porcentajeCell.textContent = porcentajeAciertos.toFixed(2) + "%";

            // Mostrar missatge segons la respuesta
            const mensajeCell = document.createElement("td");
            mensajeCell.textContent = isCorrecta ? "¡Correcte! ✅ " : "¡Incorrecte! ❌";
            rows[i].appendChild(mensajeCell);

            // Eliminar el missatge després de 3 segons
            setTimeout(() => {
                mensajeCell.remove();
            }, 3000);

            break;
        }
    }
}


  
  // Funció que mostra la pregunta per pantalla
   function mostrarPregunta(pregunta) {

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
  

  // Funció que comença el compte enrere del temps per respondre cada pregunta
 function startCountdown(initialTime) {

  if(nicknameAdmin == nicknameJugador)
  {
 
  // Deshabilitar botons per l'admin
  const buttons = document.querySelectorAll('.answer-btn');
  buttons.forEach((button, index) => {
  
          button.classList.remove('clicked');
          button.classList.add('disabled');
          button.disabled = true;
      
  });
  }
  // Variable local que emmagatzema la quantitat de temps del compte enrere, s'inicialitza amb el temps inicial (questionTime) 
    let remainingTime = initialTime;
 
  // Funció que actualitza el compte enrere i modifica la visibilitat dels elements HTML segons el comptador
    function updateCountdown() {
      document.getElementById('countdown').innerText = remainingTime;
      tempsResposta = remainingTime;
 
      if (remainingTime === 0) {
        updateChart(clicksChart);
        clicksChart = [0, 0, 0, 0];

    // Amaguem i mostrem els elements HTML adients quan el compte enrere s'ha acabat
     showAndHideAfterFirstCountDown();
    // Modificació estils dels botons de les respostes
     enableAllButtons();
     removeClickedStyles();
 
 
    getReadyCountDown(waitTime);
      } else if(remainingTime>0) {
    // Amaguem i mostrem els elements HTML adients durant el compte enrere
    showAndHideDuringFirstCountDown();
  }
 
 
      if (remainingTime < 0) {
    
      } else {
    // Reduïm els segons del compte enrere
     remainingTime--;
     setTimeout(updateCountdown, 1000); // Actualitzar cada segon
      }
    }
  // Executem updateCountdown() per modificar el compte enrere i assegurar-se que els elements es mostren i s'amaguen adienment
    updateCountdown();
 
 
  }




 // Funció que comença el compte enrere del temps d'espera entre pregunta i pregunta
 function startSecondCountdown(getReadyTime) {
  let remainingTime = getReadyTime;


// Funció que actualitza el compte enrere i modifica la visibilitat dels elements HTML segons el comptador
  function updateCountdown() {
    document.getElementById('second-countdown').innerText = remainingTime;


    if (remainingTime === 0) {
  numPregRestants--;
  //console.log("Número de preguntes restants"+ " " + numPregRestants);


  if(numPregRestants != 0){
      
  // Amaguem i mostrem els elements HTML adients quan el temps d'espera s'ha acabat
  showAndHideAfterSecondCountDown();
  

}else{
  ///////////////////

  // Obtener las puntuaciones y generar el gráfico cuando sea necesario
  function generarPodio() {
    const { labels, data } = obtenerPuntuaciones();
  
    // Crear el gráfico de barras solo si el contenedor es visible
    const chartContainer = document.getElementById("podi");
    if (chartContainer.style.display !== "none") {
      const ctx = document.getElementById("podio-chart").getContext("2d");
      const myChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "",
              data: data,
              backgroundColor: ["gold", "silver", "bronze"],
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            datalabels: {
              align: 'end',
              anchor: 'end',
              display: function (context) {
                return context.dataset.data[context.dataIndex] > 0; // Mostrar etiquetas solo para barras con puntuación positiva
              },
              formatter: function (value, context) {
                return context.chart.data.labels[context.dataIndex]; // Mostrar el nombre del jugador como etiqueta
              },
            },
          },
        },
      });
    }
  }
  
   


  //////////////////



  // Mostra el podi i amaga la resta d'elements
  showAndHideAtTheEnd();
   // Llamar a la función para generar el gráfico
   generarPodio();
}
    }
    if (remainingTime < 0) {
  
    } else {
  // Reduïm els segons del compte enrere
   remainingTime--;
   setTimeout(updateCountdown, 1000); // Actualitzar cada segon
    }
  }

  updateCountdown();
}

// Constant que emmagatzema el temps d'espera entre una pregunta i una altra
const waitTime= 5;

// Variable que emmagatzema el número de preguntes de la partida que resten per mostrar
var numPregRestants = dataGameGlobal.preguntesPartida.length;


// Funció que mostra el comptador de temps d'espera entre pregunta i pregunta, executa i guarda en la constant la funció startSecondCountdown amb paràmetre del temps d'espera
function getReadyCountDown(waitTime){
    toggleElementVisibility(document.getElementById('second-countdown-container'), true);
const secondCountdown = startSecondCountdown(waitTime);
};


// Gràfic de barres
let myChart;
function updateChart(clickCounts) {
  //Destruir el gràfic anterior si existeix
  if (myChart) {
      myChart.destroy();
  }
  //console.log("Valor de clickCounts en chart:", clickCounts);

  var ctx = document.getElementById("myChart").getContext("2d");
  myChart = new Chart(ctx, {
      type: "bar",
      data: {
          labels: [document.getElementById("resposta-a").textContent, document.getElementById("resposta-b").textContent, document.getElementById("resposta-c").textContent, document.getElementById("resposta-d").textContent],
          datasets: [{
              label: "",
              data: clickCounts,
              backgroundColor: ["rgba(255, 99, 132, 0.5)", "rgba(54, 162, 235, 0.5)", "rgba(255, 206, 86, 0.5)", "rgba(75, 192, 192, 0.5)"],
              borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)", "rgba(75, 192, 192, 1)"],
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });
}

// Enviar missatge al servidor quan es clica "tornar a jugar"
tornarJugar.addEventListener("click", function () {
  // Tornar els usuaris al lobby i reiniciar els objectes
  const idRoom = dataGameGlobal.idPartida;
socket.emit("play again", { nicknameAdmin, idRoom, usersArray });
});


// Redirigir a l'usuari a la lobby
socket.on("back to lobby", function(data) {
const { nicknameAdmin, idRoom } = data;
const codiPartida = sessionStorage.getItem('codiPartida');

   const lobbyUrl = `/lobby.html?partida=${idRoom}&nickname=${nicknameAdmin}&codiPartida=${codiPartida}`;
   window.location.href = lobbyUrl;
});

}


