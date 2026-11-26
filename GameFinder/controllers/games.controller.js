const cheapshark = require("../services/cheapshark.service");


/* =========================
   GROUP GAMES BY ID
========================= */

function groupGames(deals) {

    const gamesMap = new Map();

    for (const deal of deals) {

        const gameID = deal.gameID;

        if (!gamesMap.has(gameID)) {

            gamesMap.set(gameID, {
                ...deal,
                offers: [deal]
            });

        } else {

            const existingGame = gamesMap.get(gameID);

            existingGame.offers.push(deal);

            if (deal.price < existingGame.price) {

                gamesMap.set(gameID, {
                    ...deal,
                    offers: existingGame.offers
                });

            }
        }
    }

    return Array.from(gamesMap.values()).map(game => {

        game.offers.sort((a, b) => a.price - b.price);

        return {
            ...game,
            offerCount: game.offers.length
        };

    });
}


/* =========================
   GET DEALS
========================= */

async function getDeals(req, res) {

    try {

        console.log("Parameters:", req.query);

        const deals = await cheapshark.getDeals(req.query);

        if (!Array.isArray(deals)) {
            throw new Error("Invalid deals response");
        }

        console.log("Deals received:", deals.length);


        // Retrieve stores

        let stores = [];

        try {

            stores = await cheapshark.getStores();

            if (!Array.isArray(stores)) {
                stores = [];
            }

        } catch (error) {

            console.error("Stores error:", error.message);

        }


        // Normalize API data

        const games = deals.map(deal => {

            const store = stores.find(store =>
                String(store.storeID) === String(deal.storeID)
            );

            return {

                title: deal.title,

                gameID: deal.gameID,

                dealID: deal.dealID,

                image: deal.thumb,

                price: Number(deal.salePrice),

                normalPrice: Number(deal.normalPrice),

                discount: Number(deal.savings),

                currency: "USD",

                steamRating: Number(deal.steamRatingPercent),

                steamRatingCount: Number(deal.steamRatingCount),

                metacritic: Number(deal.metacriticScore),

                storeID: deal.storeID,

                store: store?.storeName || "Boutique inconnue",

                url: "https://www.cheapshark.com/redirect?dealID="
                    + deal.dealID

            };

        });


        // Remove duplicate games

        const uniqueGames = groupGames(games);


        // Preserve sorting after grouping

        if (req.query.sortBy === "Price") {

            uniqueGames.sort((a, b) => {

                return req.query.desc === "1"
                    ? b.price - a.price
                    : a.price - b.price;

            });

        } else if (req.query.sortBy === "Savings") {

            uniqueGames.sort((a, b) => {

                return req.query.desc === "0"
                    ? a.discount - b.discount
                    : b.discount - a.discount;

            });

        } else if (req.query.sortBy === "Title") {

            uniqueGames.sort((a, b) => {

                return req.query.desc === "1"
                    ? b.title.localeCompare(a.title)
                    : a.title.localeCompare(b.title);

            });
        }


        console.log("Original offers:", games.length);
        console.log("Unique games:", uniqueGames.length);

        res.status(200).json(uniqueGames);

    } catch (error) {

        console.error("getDeals ERROR:", error);

        res.status(502).json({
            error: error.message
        });

    }
}


/* =========================
   SEARCH GAMES
========================= */

async function searchGames(req, res) {

    try {

        const title = req.query.title;

        if (typeof title !== "string" || !title.trim()) {

            return res.status(400).json({
                error: "Title is required"
            });

        }

        const games = await cheapshark.searchGames(title.trim());

        res.status(200).json(games);

    } catch (error) {

        console.error("searchGames ERROR:", error);

        res.status(502).json({
            error: error.message
        });

    }
}


/* =========================
   GAME DETAILS
========================= */

async function getGameDetails(req, res) {

    try {

        const id = req.params.id;

        if (!/^\d+$/.test(id)) {

            return res.status(400).json({
                error: "Invalid game ID"
            });

        }

        const game = await cheapshark.getGameDetails(id);

        res.status(200).json(game);

    } catch (error) {

        console.error("getGameDetails ERROR:", error);

        res.status(502).json({
            error: error.message
        });

    }
}


/* =========================
   GET STORES
========================= */

async function getStores(req, res) {

    try {

        const stores = await cheapshark.getStores();

        res.status(200).json(stores);

    } catch (error) {

        console.error("getStores ERROR:", error);

        res.status(502).json({
            error: error.message
        });

    }
}


/* =========================
   EXPORTS
========================= */

module.exports = {
    getDeals,
    searchGames,
    getGameDetails,
    getStores
};