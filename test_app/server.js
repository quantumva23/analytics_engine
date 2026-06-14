const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/ingest", (req, res) => {
  const { projectKey, events } = req.body;
  console.log("\n--- Batch received ---");
  console.log("Project key:", projectKey);
  console.log("Events:", JSON.stringify(events, null, 2));
  res.json({ ok: true, received: events.length });
});

app.listen(4000, () => {
  console.log("Server running at http://localhost:4000");
});
