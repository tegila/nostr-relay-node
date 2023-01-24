const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 8080 });

const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://localhost')

client.on('connect', () => {
  wss.on("connection", (ws, req) => {
    let ip = req.socket.remoteAddress;
    console.log(`ip: ${ip}`);
    ip = req.headers["x-forwarded-for"].split(",")[0].trim();
    console.log(`ip[x-forwarded-for]: ${ip}`);
    
    ws.on("message", (data) => {
      console.log('/nostr/message \"%s\"', data);
      client.publish('/nostr/message', data)
    });
  });
  
  client.subscribe('/nostr/event/+', (err) => {
    if (err) {
      client.publish('/nostr/error', err)
    }
  })
  client.on('message', function (topic, message) {
    // message is Buffer
    const message_string = message.toString();
    console.log(topic, message_string)
    //ws.send(message_string);
  })
})

//client.end()

