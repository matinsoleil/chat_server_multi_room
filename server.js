var express = require('express')
var http  = require('http')
var bodyParser = require('body-parser');
var app = express()
const server = http.createServer(app);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

 
var redis = require("redis"),
    cacheClient = redis.createClient();


cacheClient.on("error", function (err) {
    console.log("Error " + err);
});

cacheClient.set("string key", "string val", redis.print);

app.set('json spaces', 40);


app.get('/message/:id', function (req, res) {
 
  res.json({ a: req.params.id, query:req.query });
})

app.post('/message/:id',function(req, res){


})

app.get('/conversation/:id', function (req, res) {
  let conversationId =req.params.id;
  try{
    cacheClient.hgetall('conversation.'+conversationId, function(err, results) {
      if (err) {
          // do something like callback(err) or whatever
      } else {
         var conversation =Object.keys(results).map(
          function(key){
              return results[key];
          }
        );
        let output = [];
        conversation.forEach(function(itm){
           ITM=JSON.parse(itm);
           output.push(ITM);  
        });
    
  
       res.json(output);
  
      }
   }.bind(this))
   }catch(e){
       console.log(e);
   }
})
 
app.post('/conversation/:id', function (req, res) {
    
  req.body.forEach(function(message){
    let conversationId =req.params.id;
    cacheClient.hset('conversation.'+conversationId,message.id,JSON.stringify(message));

   })
  res.json({ success: 'update' });

})



app.post('/contacts/:id', function (req, res) {

  req.body.forEach(function(contact){
     let contactId =req.params.id;
    cacheClient.hset('contact.'+contactId,contact.id,JSON.stringify(contact));

   })
  res.json({ success: 'update' });
})



app.get('/contacts/:id', function (req, res) {
  let contactId =req.params.id;
  try{
  cacheClient.hgetall('contact.'+contactId, function(err, results) {
    if (err) {
        // do something like callback(err) or whatever
    } else {
       var contacts =Object.keys(results).map(
        function(key){
            return results[key];
        }
      );
      let output = [];
      contacts.forEach(function(itm){
         ITM=JSON.parse(itm);
         output.push(ITM);  
      });
  

     res.json(output);

    }
 }.bind(this))
 }catch(e){
     console.log(e);
 }

})


app.get('/user/:id', function (req, res) {

  let userId =req.params.id;
  try{
  cacheClient.hgetall('user.'+userId, function(err, results) {
    if (err) {
        // do something like callback(err) or whatever
    } else {
       if(results){
       var user =Object.keys(results).map(
        function(key){
            return results[key];
        }
      );
      let output = [];
      user.forEach(function(itm){
         ITM=JSON.parse(itm);
         output.push(ITM);  
      });
      res.json(output);
      }else{
      let notfound = {message:'not found'};  
      res.json(notfound);   
      }

    }
 }.bind(this))
 }catch(e){
     console.log(e);
      let error = {error:'bad request'}
      res.json();
 }
  
})


app.post('/user/:id', function (req, res) {

  let userId =req.params.id;
  req.body.forEach(function(item){
    
   cacheClient.hset('user.'+userId,item.id,JSON.stringify(item));

  })
 res.json({ success: 'update' });

})


app.get('/conexion/:id', function (req, res) {
  res.json([{ state: 'ok' }]);
})

app.post('/conexion/:id', function (req, res) {
  let userId =req.params.id;
  req.body.forEach(function(item){
    
   cacheClient.hset('conexion.'+userId,item.id,JSON.stringify(item));

  })
 res.json({ success: 'update' });
})



const WebSocket = require('ws');
var conversation = '';
const wss = new WebSocket.Server({ server });
console.log('start');
// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', function connection(ws, req) {
  ws.id = req.headers['sec-websocket-key']; 
  conversation = (req.url).substring(1);
  ws.conversation =   (req.url).substr(1);
  ws.on('message', function incoming(data) {
    // Conversation
    wss.clients.forEach(function each(client) { 
      if (client !== ws && client.readyState === WebSocket.OPEN && client.conversation === ws.conversation) {
        try { 
            client.send(data);
        }
        catch (e) { /* handle error */ 
            console.log('not send');     
        }
        if(typeof data === 'string' && data!== ''){
         try{
         console.log(data);
         objectData=JSON.parse(data,true);
         console.log(objectData);
         cacheClient.hset(client.conversation,objectData.id,data);
         objectData = '';
         }
         catch (e) {
             
             console.log('Bad Data');
             console.log(data);
         }
        }
        data = '';
      }
    });
  });
});


server.listen(process.env.PORT || 8888, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
