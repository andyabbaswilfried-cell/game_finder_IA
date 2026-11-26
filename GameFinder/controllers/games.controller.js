const cheapshark = require('../services/cheapshark.service');
const platforms = require('../services/platforms.service');


/* =========================
   GET DEALS
========================= */

async function getDeals(req, res) {

    try {

        const query = req.query;

        if (!platforms.PLATFORMS.includes(
            query.platform || 'pc'
        )) {

            return res.status(400).json({
                error: 'Plateforme inconnue'
            });

        }

        const parameters = [

            'title',
            'franchise',
            'upperPrice',
            'lowerPrice',
            'storeName',
            'storeID',
            'sortBy',
            'desc',
            'onSale',
            'pageSize',
            'pageNumber',
            'steamRating',
            'metacritic'

        ];

        for (const key of parameters) {

            if (
                query[key] !== undefined &&
                typeof query[key] !== 'string'
            ) {

                return res.status(400).json({
                    error: `Paramètre invalide : ${key}`
                });

            }
        }

        for (const key of ['upperPrice', 'lowerPrice']) {

            if (

                query[key] !== undefined && (

                    !/^\d+(\.\d{1,2})?$/.test(query[key]) ||

                    Number(query[key]) > 10000

                )

            ) {

                return res.status(400).json({
                    error: `Budget invalide : ${key}`
                });

            }
        }

        if (

            (query.title || '').length > 250 ||

            (query.franchise || '').length > 250

        ) {

            return res.status(400).json({
                error: 'Recherche trop longue'
            });

        }

        const { games, partial } =
            await platforms.getDeals(query);

        res.set(
            'X-GameFinder-Partial',
            partial ? '1' : '0'
        );

        res.status(200).json(games);

    } catch (error) {

        console.error('getDeals:', error);

        res.status(502).json({

            error:
                'Impossible de récupérer les offres. Réessayez.'

        });

    }
}


/* =========================
   SEARCH PC GAMES
========================= */

async function searchGames(req, res) {

    try {

        const title = req.query.title;

        if (
            typeof title !== 'string' ||
            !title.trim()
        ) {

            return res.status(400).json({
                error: 'Title is required'
            });

        }

        const games =
            await cheapshark.searchGames(title.trim());

        res.json(games);

    } catch (error) {

        console.error('searchGames:', error);

        res.status(502).json({
            error: 'Unable to search games'
        });

    }
}


/* =========================
   GET PC GAME DETAILS
========================= */

async function getGameDetails(req, res) {

    try {

        if (!/^\d+$/.test(req.params.id)) {

            return res.status(400).json({
                error: 'Invalid game ID'
            });

        }

        const game =
            await cheapshark.getGameDetails(req.params.id);

        res.json(game);

    } catch (error) {

        console.error('getGameDetails:', error);

        res.status(502).json({
            error: 'Unable to retrieve game details'
        });

    }
}


/* =========================
   GET PC STORES
========================= */

async function getStores(req, res) {

    try {

        const stores = await cheapshark.getStores();

        res.json(stores);

    } catch (error) {

        console.error('getStores:', error);

        res.status(502).json({
            error: 'Unable to retrieve stores'
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