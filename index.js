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
      const [type, subscription_id, filter] = parsed_data;
      if (type === "REQ") {
        subscription_ids.set(subscription_id, {
          ws,
          req,
          filter,
          data: parsed_data,
        });
        console.log(subscription_ids);
      }
    });
  });

  mqtt.subscribe("/nostr/send/+", (err) => {
    if (err) return mqtt.publish("/nostr/error", err);
  });

  mqtt.on("message", (topic, message) => {
    if (topic.test(/send/)) {
      // message is Buffer
      const message_string = message.toString();
      console.log(topic, message_string);
      const [, , , subscription_id] = topic.split("/");
      const { ws } = subscription_ids.get(subscription_id);
      ws.send(message_string);
    }
  });
});

//mqtt.end()
