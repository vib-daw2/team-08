const express = require("express");
const app = express();
const port = 5556;
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  
  res.send('Hello express!');
});

app.get('/hola', function(req, res) {
  
    res.send('hola!');
  });

  app.get("/form", (req, res) => {    
    const html =`<!DOCTYPE html><html><head><title>Prova</title></head><body>
       <form method='POST' action='http://localhost:5556/processar'>
         <input type='text' name='prova'>
         <input type='submit' value='enviar'></form></body></html>`;
 
    res.send(html);     
 });

 app.post("/processar", (req, res) => {
   
    console.log('peticio POST rebuda')
    console.log(req.body);
    
    res.send('Petició POST');   
   
 });

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});