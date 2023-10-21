import { Server } from "socket.io";
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });
import axios from "axios";
import { getPNL } from "./pnl";


wss.on("connection", (ws) => {
  if (res.socket.server.io) {
    setInterval(async () => {
      try {
        const vrr = await axios.get(
          `http://localhost:3000/api/nft?wallet=${wallet}&token=${token}`
        );
        const vr = await getPNL(vrr);
        console.log(vr);
      } catch (err) {
        console.error(err);
      }
    }, 20000);
  } else {
    console.log("Socket is initializing");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    res.end();
  }
});

export default SocketHandler;
