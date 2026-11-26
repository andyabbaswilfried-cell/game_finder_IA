const BASE_URL = "https://www.nexarda.com/api/v3";


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

    console.log("NEXARDA REQUEST:", url.toString());

    const response = await fetch(url, {

        headers: {
            "Accept": "application/json",
            "User-Agent": "GameFinder/1.0"
        },

        signal: AbortSignal.timeout(15000)

    });

    console.log("NEXARDA STATUS:", response.status);

    if (!response.ok) {

        const body = await response.text();

        console.error("NEXARDA RESPONSE:", body);

        throw new Error(
            `NEXARDA returned ${response.status}`
        );
    }

    const data = await response.json();

    if (data.success === false &&
        data.code !== "no_results_found") {

        throw new Error(
            data.message || "NEXARDA API error"
        );

    }

    return data;
}


/* =========================
   SEARCH GAMES
========================= */

async function searchGames(title = "", page = 1) {

    const data = await fetchData("search", {

        type: "games",
        q: title,
        page: page

    });

    if (data.code === "no_results_found") {
        return [];
    }

    if (!Array.isArray(data.results?.items)) {
        throw new Error("Invalid NEXARDA search response");
    }

    return data.results.items;
}


/* =========================
   GET GAME PRICES
========================= */

async function getGamePrices(id, currency = "USD") {

    const data = await fetchData("prices", {

        type: "game",
        id: id,
        currency: currency

    });

    if (!Array.isArray(data.prices?.list)) {
        throw new Error("Invalid NEXARDA prices response");
    }

    return data;
}


/* =========================
   SEARCH FRANCHISES
========================= */

async function searchFranchises(title) {

    const data = await fetchData("search", {

        type: "franchises",
        q: title

    });

    if (data.code === "no_results_found") {
        return [];
    }

    return data.results?.items || [];
}


/* =========================
   EXPORTS
========================= */

module.exports = {
    searchGames,
    getGamePrices,
    searchFranchises
};