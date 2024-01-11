
const socket = io();

const createButton = document.getElementById("createButton");
const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");

if (sendButton) {
    sendButton.addEventListener("click", send);
}
function send() {
    socket.emit("nickname", {nickname: nicknameInput.value} )
}

socket.on('nickname rebut', function(data) {

    console.log(data)
    if (data.redirectUrl) {
        //redirigir a la pàgina que indica el servidor
        window.location.href = data.redirectUrl;
    }
})

socket.on("connect", function() {
    console.log("Conexió amb el servidor");
    //socket.emit("get users");
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
    // Verificar si estamos en createGame.html
    if (window.location.href.endsWith("createGame.html")) {
        // Evento de envío del formulario
        document.getElementById("createGameForm").addEventListener("submit", function (event) {
            event.preventDefault(); 
            console.log("Formulario enviado");

            // Guardar los datos del formulario
            const formData = {
                title: document.getElementById("title").value,
                quantity: document.getElementById("quantity").value,
                topics: Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(topic => topic.value)
            };

            // Emitir un evento al servidor con los datos del formulario
            socket.emit("crear partida", formData);
        });
    } else {
        console.log("Este código no se ejecutará porque no estás en createGame.html");
    }


      // Manejar el evento de preguntas partida del servidor
      socket.on("preguntes partida", function(preguntesPartida) {
        console.log("hola");
        console.log("Preguntas para la partida recibidas:", preguntesPartida);

        // Aquí puedes manejar las preguntas recibidas, por ejemplo, mostrarlas en la interfaz.
        // Puedes agregar tu lógica para mostrar las preguntas en el formato que desees.
    });
});




