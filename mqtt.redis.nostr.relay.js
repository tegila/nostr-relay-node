const Redis = require("redis");
const redis = Redis.createClient();

const MQTT = require("mqtt");
const { parse } = require("path");
const mqtt = MQTT.connect("mqtt://localhost");

const subscription_ids = new Map();
const log = () => null;
const logs = console.log;

redis.connect().then(() => {
  log("redis connected");
  mqtt.on("connect", () => {
    log("mqtt connected");
    mqtt.subscribe("/nostr/message", (err) => {
      if (err) return log("/nostr/error", err);
    });

    mqtt.on("message", (topic, message) => {
      const promisses = [];
      const message_string = message.toString();
      log(topic, message_string);
      const parsed_message = JSON.parse(message_string);
      log(topic, parsed_message);
      const [type] = parsed_message;
      log(type);
      if (type === "EVENT") {
        const [, event] = parsed_message;
        log("EVENT", event);
        promisses.push(redis.set(event.id, JSON.stringify(event)));
        promisses.push(redis.get(event.id));
        promisses.push(
          redis.sAdd(`kind::${event.kind}::pubkey::${event.pubkey}`, event.id)
        );
        Promise.all(promisses).then((res) => {
          log(res);
          const inner_promisses = event.tags.map(([tag, pubkey]) => {
            return [
              redis.sAdd(`tag::${tag}::pubkey::${pubkey}`, event.id),
              redis.sMembers(`tag::${tag}::pubkey::${pubkey}`),
            ];
          });
          Promise.all(inner_promisses.flat(1)).then((res) => {
            log(res);
          });
        });
      } else if (type === "REQ") {
        const req_promisses = [];
        const [, subscription_id, others] = parsed_message;

        logs("others", others);
        const combinations = (x, y) =>
          [x || [], y || []].reduce((a, b) =>
            a.reduce((r, v) => r.concat(b.map((w) => [].concat(v, w))), [])
          );

        let result = combinations(others.kinds, others.authors);
        logs("kinds", result);

        req_promisses.push(
          result.map(([kind, pubkey]) => {
            logs(`kind::${kind}::pubkey::${pubkey}`);
            return redis.sMembers(`kind::${kind}::pubkey::${pubkey}`);
          })
        );

        result = combinations(others["#p"], others.pubkey);
        logs("combinations2", result);

        req_promisses.push(
          result.map(([tag, pubkey]) =>
            redis.sMembers(`tag::${tag}::pubkey::${pubkey}`)
          )
        );

        logs(req_promisses.flat(1));
        Promise.all(req_promisses.flat(1)).then((res) => {
          const flat_res = res.flat(1);
          logs("redis:", flat_res);
          if (flat_res.length == 0) return;
          redis.mGet(flat_res).then((events) => {
            logs("events:", events);
            events.forEach((event) =>
              mqtt.publish(
                `/nostr/send/${subscription_id}`,
                `["EVENT", "${subscription_id}", ${event}]`
              )
            );
          });
        });
      }
    });
  });
});

redis.on("error", (err) => log("Redis Client Error", err));
