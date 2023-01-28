const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 8080 });

const MQTT = require("mqtt");
const mqtt = MQTT.connect("mqtt://localhost");

const subscription_ids = new Map();

mqtt.on("connect", () => {
  wss.on("connection", (ws, req) => {
    let ip = req.socket.remoteAddress;
    console.log(`ip: ${ip}`);
    ip = req.headers["x-forwarded-for"].split(",")[0].trim();
    console.log(`ip[x-forwarded-for]: ${ip}`);

    ws.on("message", (data) => {
      console.log('/nostr/message "%s"', data);
      mqtt.publish("/nostr/message", data);
      const parsed_data = JSON.parse(data);
      
      const [type] = parsed_data;
      if (type === "REQ") {
        const [, subscription_id, filter] = parsed_data;
        console.log(subscription_id);
        subscription_ids.set(subscription_id, {
          ws,
          req,
          filter,
          data: parsed_data,
        });
        //console.log(subscription_ids);
      }
    });
  });
  const log = console.log;

  mqtt.subscribe("/nostr/send/+", (err) => {
    if (err) return log("/nostr/error", err);
  });

  mqtt.on("message", (topic, message) => {
    log(topic);
    if (/send/.test(topic)) {
      // message is Buffer
      const message_string = message.toString();
      log(topic, message_string);
      const [, , , subscription_id] = topic.split("/");
      log(subscription_id);
      const subscription = subscription_ids.get(subscription_id);
      //log(subscription);
      if(!subscription) return log("/nostr/error", JSON.stringify(subscription));
      const { ws } = subscription;
      if(!ws) return log("/nostr/error", JSON.stringify(subscription_ids));
      ws.send(message_string);
    }
  });
});

//mqtt.end()
