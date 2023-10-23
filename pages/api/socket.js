const WebSocket = require("ws");
import { getPNL } from "./pnl";

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
  });
  const sendUpdates = async () => {
    try {
      const vrr = await axios.get(
        `http://localhost:3000/api/nft?wallet=${wallet}&token=${token}`
      );

      const vr = await getPNL(vrr);
      ws.send(JSON.stringify(vr));
    } catch (err) {
      console.error(err);
    }
  };

  const updateInterval = setInterval(sendUpdates, 20000);

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(updateInterval);
  });
});
export default SocketHandler;
