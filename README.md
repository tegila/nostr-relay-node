PoC v2 is working very well as a private note store or as a
basic funcional nostr-relay server.

CHECK LINK
[https://github.com/tegila/nostr-relay-node/blob/master/mqtt.redis.nostr.relay.js]

TODO:
 - Nostr Live Routing

Done:
 - Nostr fast-yet-simple-store with redis
 - Study workspace using NODE-RED as a helper (fast-forwarder)
 - Live routing was done on node-red but disabled due to SPEED!!

# nostr-relay-node
nostr relay-server adapter to mqtt written in simple nodejs

# PoC v0 alfa
![sample working on Node-RED](./image.png)

# mqtt side of nostr-server
![input of mqtt-side of nostr](./demo2.png)

# relay routing path finder
![close view on routing](./demo3.png)

# updated to remove the routing (waiting to implement in js)
![routing removal](./demo4.png)
