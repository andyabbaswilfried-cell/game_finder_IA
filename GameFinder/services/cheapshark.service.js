const BASE_URL = "https://www.cheapshark.com/api/1.0";

let storesCache = null;
let storesCacheDate = 0;

const CACHE_DURATION = 60 * 60 * 1000;


/* =========================
   GENERIC API REQUEST
========================= */

async function fetchData(endpoint, params = {}) {

    const url = new URL(`${BASE_URL}/${endpoint}`);

    for (const [key, value] of Object.entries(params)) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            url.searchParams.set(key, String(value));
        }
    }

    console.log("REQUEST URL:", url.toString());

    const response = await fetch(url, {
        headers: {
            "User-Agent": "GameFinder/1.0",
            "Accept": "application/json"
        },
        signal: AbortSignal.timeout(15000)
    });

    console.log("HTTP STATUS:", response.status);

    if (!response.ok) {

        const body = await response.text();

        console.error("RESPONSE BODY:", body);

        throw new Error(
            `CheapShark returned ${response.status}`
        );
    }

    return await response.json();
}


/* =========================
   GET DEALS
========================= */

async function getDeals(filters = {}) {

    return fetchData("deals", filters);

}


/* =========================
   SEARCH GAMES
========================= */

async function searchGames(title) {

    return fetchData("games", { title });

}


/* =========================
   GAME DETAILS
========================= */

async function getGameDetails(id) {

    return fetchData("games", { id });

}


/* =========================
   DEAL DETAILS
========================= */

async function getDealDetails(id) {

    return fetchData("deals", { id });

}


/* =========================
   GET STORES WITH CACHE
========================= */

async function getStores() {

    const now = Date.now();

    if (
        storesCache !== null &&
        now - storesCacheDate < CACHE_DURATION
    ) {

        console.log("Stores retrieved from cache");

        return storesCache;
    }

    try {

        const stores = await fetchData("stores");

        if (!Array.isArray(stores)) {
            throw new Error("Invalid stores response");
        }

        storesCache = stores;

        storesCacheDate = Date.now();

        console.log("Stores saved in cache");

        return storesCache;

    } catch (error) {

        if (storesCache !== null) {

            console.warn("Using previous stores cache");

            return storesCache;
        }

        throw error;
    }
}


/* =========================
   EXPORTS
========================= */

module.exports = {
    getDeals,
    searchGames,
    getGameDetails,
    getDealDetails,
    getStores
};