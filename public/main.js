
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


// En el cliente (main.js)
document.addEventListener("DOMContentLoaded", function () {
    //event envio del form
    document.getElementById("createGameForm").addEventListener("submit", function (event) {
        event.preventDefault(); 
        console.log("form enviat");

        //guardar les dades del form
        const formData = {
            title: document.getElementById("title").value,
            quantity: document.getElementById("quantity").value,
            topics: Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(topic => topic.value)
        };

        // Emitir un evento al servidor con los datos del formulario
        socket.emit("crear partida", formData);
    });
});



//rebre preguntes filtrades en client
socket.on("preguntes partida", function(preguntesPartida) {
    //mostrar, iniciar...
    console.log("Preguntes per la partida:", preguntesPartida);
});