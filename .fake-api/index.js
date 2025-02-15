const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server: WebSocket } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new WebSocket(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(cors());
const port = 8080;

// Simulated asset data
const assets = [
  { id: 1, symbol: "Asset 1", price: 100 },
  { id: 2, symbol: "Asset 2", price: 200 },
  { id: 3, symbol: "Asset 3", price: 300 },
];

// Simulated orders data
const orders = [
  { id: 1, type: "buy", asset: "Asset 1", quantity: 10, price: 100 },
  { id: 2, type: "sell", asset: "Asset 2", quantity: 5, price: 200 },
  { id: 3, type: "buy", asset: "Asset 3", quantity: 15, price: 300 },
];

// Simulated asset history data
const generateAssetHistory = (startValue) => {
  const history = [];
  const currentDate = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - (6 - i));
    history.push({
      time: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
      value: startValue + i * 5, // Increment value for example
    });
  }

  return history;
};

const assetHistories = {
  1: generateAssetHistory(100),
  2: generateAssetHistory(200),
  3: generateAssetHistory(300),
};

// Route to get asset history by assetId
app.get("/assets/:assetId/histories", (req, res) => {
  const assetId = parseInt(req.params.assetId, 10);
  const history = assetHistories[assetId];
  if (history) {
    res.json(history);
  } else {
    res.status(404).json({ error: "Asset history not found" });
  }
});

// Middleware to parse JSON
app.use(express.json());

// Route to list all assets
app.get("/assets", (req, res) => {
  res.json(assets);
});

// Route to list all orders
app.get("/orders", (req, res) => {
  res.json(orders);
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("a user connected");

  // Simulate price updates for each asset independently
  assets.forEach((asset) => {
    setInterval(() => {
      const priceChange = (Math.random() - 0.5) * 10;
      asset.price += priceChange;
      socket.emit(`asset-${asset.id}-price`, {
        asset,
        time: new Date(new Date().getTime() + 5 * 60000).toISOString(),
      });
    }, 1000); // Update every 1 second
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
