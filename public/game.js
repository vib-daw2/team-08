//quan els usuaris entren a game reben la info necessària per la partida
if (window.location.pathname.endsWith("game.html")) {
   // Obtener la información almacenada en sessionStorage
const storedDataGame = sessionStorage.getItem('dataGame');

// Verificar si la información está presente
if (storedDataGame) {
    try {
        // Intentar parsear la cadena JSON a un objeto JavaScript
        const dataGame = JSON.parse(storedDataGame);

        // Ahora puedes trabajar con dataGame como un objeto JavaScript
        console.log(dataGame);
    } catch (error) {
        console.error("Error al parsear la cadena JSON:", error);
    }
} else {
    console.log("No hay información almacenada en sessionStorage para 'dataGame'.");
}

    //socket.emit("preguntes configurades", dataGame );
// Escuchar la respuesta del servidor con las preguntas
socket.on("start game", function(data) {
    const { idPartida, preguntesPartida, nicknameAdmin, time } = data;
    console.log("Información sobre preguntas recibida:", data);

});
}
