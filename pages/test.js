const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:8080");

ws.addEventListener("message", (event) => {
  const data = event.data;
  console.log(data);
});
