const express = require("express");
const path = require("path");

const gamesRoutes = require("./routes/games.routes");

const app = express();

const PORT = process.env.PORT || 3300;

app.use(express.json());

app.use(
    express.static(path.join(__dirname, "public"))
);

app.use("/api/games", gamesRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});