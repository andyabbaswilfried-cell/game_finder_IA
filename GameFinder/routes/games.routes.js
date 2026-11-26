const express = require("express");

const router = express.Router();

const {
    getDeals,
    searchGames,
    getGameDetails,
    getStores
} = require("../controllers/games.controller");

router.get("/", getDeals);
router.get("/deals", getDeals);
router.get("/search", searchGames);
router.get("/stores", getStores);

router.get("/:id", getGameDetails);

module.exports = router;