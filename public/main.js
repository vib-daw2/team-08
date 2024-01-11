
const socket = io();

const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");
sendButton.addEventListener("click", send)

function send() {
    socket.emit("nickname", {nickname: nicknameInput.value} )
}

socket.on('nickname rebut', function(data) {

    console.log(data)

})

socket.on("connect", function() {
    console.log("Conexión establecida con el servidor");
    socket.emit("get users");
});

socket.on("users", function(users) {
    console.log("Lista de usuarios recibida:", users);
    updateUserList(users);
    
});

socket.on('salutacio', function(data) {

    console.log(data)

})

function updateUserList(users) {

    userList.innerHTML = "<h3>Llista d'Usuaris</h3>";

    users.forEach((user) => {
        const listItem = document.createElement("li");
        listItem.textContent = user.username; 
        userList.appendChild(listItem);
    });
}