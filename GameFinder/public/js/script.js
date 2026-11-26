/* =========================
   DOM ELEMENTS
========================= */

const form = document.querySelector("#search-form");
const input = document.querySelector("#search");

const results = document.querySelector("#results");
const resultCount = document.querySelector("#result-count");
const resultsTitle = document.querySelector("#results-title");

const sort = document.querySelector("#sort");
const storeFilter = document.querySelector("#store-filter");

const priceFilter = document.querySelector("#price-filter");
const priceValue = document.querySelector("#price-value");

const freeFilter = document.querySelector("#free-filter");
const discountFilter = document.querySelector("#discount-filter");

const resetButton = document.querySelector("#reset-filters");
const freeNav = document.querySelector("#free-nav");

const featuredCards = document.querySelectorAll("[data-game]");
const budgetCards = document.querySelectorAll("[data-budget]");


/* =========================
   APPLICATION STATE
========================= */

let games = [];

let currentRequest = null;

let unlimitedBudget = false;

let previousBudget = 20;


/* =========================
   BUILD API PARAMETERS
========================= */

function buildParams() {

    const params = new URLSearchParams();

    const title = input.value.trim();

    if (title) {
        params.set("title", title);
    }

    if (freeFilter.checked) {

        params.set("upperPrice", "0");
        params.set("lowerPrice", "0");

    } else if (!unlimitedBudget) {

        params.set("upperPrice", priceFilter.value);

    }

    params.set("pageSize", "60");

    if (storeFilter.value !== "all") {
        params.set("storeID", storeFilter.value);
    }

    if (discountFilter.checked) {
        params.set("onSale", "1");
    }

    switch (sort.value) {

        case "ascending":

            params.set("sortBy", "Price");
            params.set("desc", "0");

            break;

        case "descending":

            params.set("sortBy", "Price");
            params.set("desc", "1");

            break;

        case "discount":

            params.set("sortBy", "Savings");
            params.set("desc", "1");

            break;

        case "rating":

            params.set("sortBy", "Reviews");
            params.set("desc", "1");

            break;

        case "name":

            params.set("sortBy", "Title");
            params.set("desc", "0");

            break;

        default:

            params.set("sortBy", "Deal Rating");
            params.set("desc", "1");
    }

    return params;
}


/* =========================
   FETCH GAME DEALS
========================= */

async function searchGames(shouldScroll = false) {

    currentRequest?.abort();

    const controller = new AbortController();

    currentRequest = controller;

    games = [];

    resultCount.textContent = "Recherche en cours...";

    updateResultsTitle();

    showLoading();

    if (shouldScroll) {

        document.querySelector("#offers").scrollIntoView({
            block: "start"
        });
    }

    try {

        const params = buildParams();

        const endpoint = `/api/games/deals?${params.toString()}`;

        console.log("API request:", endpoint);

        const response = await fetch(endpoint, {

            signal: controller.signal

        });

        if (!response.ok) {

            throw new Error(`HTTP Error: ${response.status}`);

        }

        const data = await response.json();

        if (currentRequest !== controller) {
            return;
        }

        if (!Array.isArray(data)) {

            throw new Error("Invalid API response");

        }


        /* Validate prices */

        games = data.filter(game => {

            if (game.price == null) {
                return false;
            }

            const price = Number(game.price);

            if (!Number.isFinite(price) || price < 0) {
                return false;
            }

            if (params.get("upperPrice") !== null) {

                return price <= Number(params.get("upperPrice"));

            }

            return true;

        });


        /* Client-side sorting */

        sortGames();

        renderGames();

    } catch (error) {

        if (
            error.name === "AbortError" ||
            currentRequest !== controller
        ) {
            return;
        }

        console.error("Search error:", error);

        resultCount.textContent = "Erreur de recherche";

        showEmptyState(
            "Impossible de récupérer les jeux",
            error.message
        );

    }
}


/* =========================
   FETCH STORES
========================= */

async function populateStores() {

    try {

        const response = await fetch("/api/games/stores");

        if (!response.ok) {

            throw new Error(`HTTP Error: ${response.status}`);

        }

        const stores = await response.json();

        if (!Array.isArray(stores)) {

            throw new Error("Invalid stores response");

        }

        storeFilter.replaceChildren(

            new Option("Toutes les boutiques", "all")

        );

        stores
            .filter(store => Number(store.isActive) === 1)
            .sort((a, b) => a.storeName.localeCompare(b.storeName))
            .forEach(store => {

                storeFilter.append(

                    new Option(
                        store.storeName,
                        store.storeID
                    )

                );

            });

    } catch (error) {

        console.error("Stores error:", error);

        storeFilter.replaceChildren(

            new Option("Boutiques indisponibles", "all")

        );

    }
}


/* =========================
   BUDGET MANAGEMENT
========================= */

function selectBudget(budget) {

    input.value = "";

    storeFilter.value = "all";

    discountFilter.checked = false;

    if (budget === "all") {

        unlimitedBudget = true;

        freeFilter.checked = false;

        priceFilter.value = priceFilter.max;

    } else {

        unlimitedBudget = false;

        const value = Number(budget);

        priceFilter.value = value;

        freeFilter.checked = value === 0;

        if (value > 0) {

            previousBudget = value;

        }
    }

    updateBudgetDisplay();

    searchGames(true);
}


/* =========================
   UPDATE BUDGET DISPLAY
========================= */

function updateBudgetDisplay() {

    const budget = unlimitedBudget

        ? "all"

        : String(priceFilter.value);

    priceValue.textContent = unlimitedBudget

        ? "Sans limite personnalisée"

        : `${priceFilter.value} $`;

    budgetCards.forEach(card => {

        const active = card.dataset.budget === budget;

        card.classList.toggle("active", active);

        card.setAttribute("aria-pressed", String(active));

    });
}


/* =========================
   UPDATE RESULTS TITLE
========================= */

function updateResultsTitle() {

    const title = input.value.trim();

    if (freeFilter.checked) {

        resultsTitle.textContent = title

            ? `${title} — offres gratuites`

            : "Jeux gratuits";

    } else if (title) {

        resultsTitle.textContent = `Résultats pour ${title}`;

    } else if (unlimitedBudget) {

        resultsTitle.textContent = "Toutes les offres";

    } else {

        resultsTitle.textContent =
            `Jeux à ${priceFilter.value} $ ou moins`;

    }
}


/* =========================
   SORT GAMES
========================= */

function sortGames() {

    switch (sort.value) {

        case "ascending":

            games.sort((a, b) => a.price - b.price);

            break;

        case "descending":

            games.sort((a, b) => b.price - a.price);

            break;

        case "discount":

            games.sort(
                (a, b) => getDiscount(b) - getDiscount(a)
            );

            break;

        case "rating":

            games.sort((a, b) => {

                return (
                    Number(b.steamRating) -
                    Number(a.steamRating)
                ) || (
                    Number(b.steamRatingCount) -
                    Number(a.steamRatingCount)
                );

            });

            break;

        case "name":

            games.sort(
                (a, b) => a.title.localeCompare(b.title)
            );

            break;
    }
}


/* =========================
   DISCOUNT CALCULATION
========================= */

function getDiscount(game) {

    const price = Number(game.price);

    const normalPrice = Number(game.normalPrice);

    if (
        !Number.isFinite(normalPrice) ||
        normalPrice <= 0 ||
        price >= normalPrice
    ) {
        return 0;
    }

    return Math.round(

        ((normalPrice - price) / normalPrice) * 100

    );
}


/* =========================
   FORMAT PRICE
========================= */

function formatPrice(price) {

    return new Intl.NumberFormat("fr-FR", {

        style: "currency",

        currency: "USD"

    }).format(Number(price));
}


/* =========================
   RENDER RESULTS
========================= */

function renderGames() {

    results.replaceChildren();

    const budgetLabel = unlimitedBudget

        ? "Toutes les offres"

        : `Budget : ${priceFilter.value} $`;

    resultCount.textContent =
        `${games.length} jeu(x) trouvé(s) — ${budgetLabel}`;

    if (games.length === 0) {

        if (freeFilter.checked) {

            showEmptyState(

                "Aucun jeu gratuit trouvé",

                "Aucune offre gratuite ne correspond actuellement à vos critères."

            );

        } else {

            showEmptyState(

                "Aucun jeu trouvé",

                "Essayez de modifier votre budget ou vos filtres."

            );

        }

        return;
    }

    const fragment = document.createDocumentFragment();

    games.forEach(game => {

        fragment.append(createGameCard(game));

    });

    results.append(fragment);
}


/* =========================
   CREATE GAME CARD
========================= */

function createGameCard(game) {

    const card = document.createElement("article");

    card.className = "game-card";

    const isFree = Number(game.price) === 0;

    const discount = getDiscount(game);


    /* IMAGE */

    const imageWrapper = document.createElement("div");

    imageWrapper.className = "game-image-wrapper";

    const image = document.createElement("img");

    image.className = "game-image";

    if (game.image) {
        image.src = game.image;
    }

    image.alt = game.title;

    image.loading = "lazy";

    imageWrapper.append(image);


    /* FREE / DISCOUNT BADGE */

    if (isFree) {

        const badge = document.createElement("span");

        badge.className = "free-badge";

        badge.textContent = "GRATUIT";

        imageWrapper.append(badge);

    } else if (discount > 0) {

        const badge = document.createElement("span");

        badge.className = "discount-badge";

        badge.textContent = `-${discount}%`;

        imageWrapper.append(badge);
    }


    /* CONTENT */

    const content = document.createElement("div");

    content.className = "game-content";


    /* STORE */

    const store = document.createElement("span");

    store.className = "store-label";

    store.textContent = game.store || "Boutique inconnue";


    /* TITLE */

    const title = document.createElement("h3");

    title.className = "game-title";

    title.textContent = game.title;


    /* RATING */

    const rating = document.createElement("p");

    rating.className = "game-rating";

    if (Number(game.steamRatingCount) > 0) {

        rating.textContent =
            `★ ${game.steamRating}% d'avis positifs`;

    } else {

        rating.textContent = "Note indisponible";

    }


    /* OFFER COUNT */

    const offerCount = document.createElement("p");

    offerCount.className = "offer-count";

    const storeCount = Array.isArray(game.offers)

        ? new Set(
            game.offers
                .map(offer => offer.storeID)
                .filter(Boolean)
        ).size

        : 1;

    offerCount.textContent =

        `${storeCount} boutique(s) référencée(s)`;


    /* BOTTOM */

    const bottom = document.createElement("div");

    bottom.className = "game-bottom";


    /* PRICE LABEL */

    const priceLabel = document.createElement("p");

    priceLabel.className = "price-label";

    priceLabel.textContent = storeCount > 1

        ? "À partir de"

        : "Prix actuel";


    /* PRICE */

    const priceContainer = document.createElement("div");

    priceContainer.className = "price-container";

    const price = document.createElement("span");

    price.className = "price";

    price.textContent = isFree

        ? "Gratuit"

        : formatPrice(game.price);

    priceContainer.append(price);


    /* ORIGINAL PRICE */

    if (discount > 0) {

        const oldPrice = document.createElement("span");

        oldPrice.className = "old-price";

        oldPrice.textContent = formatPrice(game.normalPrice);

        priceContainer.append(oldPrice);

    }


    /* STORE LINK */

    const link = document.createElement("a");

    link.className = "offer-button";

    link.href = game.url ||
        `https://www.cheapshark.com/redirect?dealID=${game.dealID}`;

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    if (isFree) {

        link.classList.add("free-offer");

        link.textContent = "Voir l'offre gratuite ↗";

    } else {

        link.textContent = "Voir la meilleure offre ↗";

    }


    /* ASSEMBLE */

    bottom.append(
        priceLabel,
        priceContainer,
        link
    );

    content.append(
        store,
        title,
        rating,
        offerCount,
        bottom
    );

    card.append(imageWrapper, content);

    return card;
}


/* =========================
   LOADING STATE
========================= */

function showLoading() {

    results.replaceChildren();

    for (let i = 0; i < 6; i++) {

        const skeleton = document.createElement("div");

        skeleton.className = "skeleton-card";

        skeleton.setAttribute("aria-hidden", "true");

        results.append(skeleton);

    }
}


/* =========================
   EMPTY STATE
========================= */

function showEmptyState(title, description) {

    const container = document.createElement("div");

    container.className = "empty-state";

    const icon = document.createElement("span");

    icon.className = "empty-icon";

    icon.textContent = "⌕";

    const heading = document.createElement("h3");

    heading.textContent = title;

    const paragraph = document.createElement("p");

    paragraph.textContent = description;

    container.append(icon, heading, paragraph);

    results.replaceChildren(container);
}


/* =========================
   RESET FILTERS
========================= */

function resetFilters() {

    input.value = "";

    unlimitedBudget = false;

    previousBudget = 20;

    priceFilter.value = 20;

    freeFilter.checked = false;

    discountFilter.checked = false;

    storeFilter.value = "all";

    sort.value = "default";

    updateBudgetDisplay();

    searchGames();
}


/* =========================
   SEARCH FORM
========================= */

form.addEventListener("submit", event => {

    event.preventDefault();

    searchGames(true);

});


/* =========================
   BUDGET CARDS
========================= */

budgetCards.forEach(card => {

    card.addEventListener("click", () => {

        selectBudget(card.dataset.budget);

    });

});


/* =========================
   FREE GAMES NAVIGATION
========================= */

freeNav.addEventListener("click", event => {

    event.preventDefault();

    selectBudget("0");

});


/* =========================
   FEATURED GAMES
========================= */

featuredCards.forEach(card => {

    card.addEventListener("click", () => {

        input.value = card.dataset.game;

        unlimitedBudget = true;

        freeFilter.checked = false;

        discountFilter.checked = false;

        storeFilter.value = "all";

        priceFilter.value = priceFilter.max;

        updateBudgetDisplay();

        searchGames(true);

    });

});


/* =========================
   FREE FILTER
========================= */

freeFilter.addEventListener("change", () => {

    unlimitedBudget = false;

    if (freeFilter.checked) {

        if (Number(priceFilter.value) > 0) {

            previousBudget = Number(priceFilter.value);

        }

        priceFilter.value = 0;

    } else {

        priceFilter.value = previousBudget;

    }

    updateBudgetDisplay();

    searchGames();
});


/* =========================
   PRICE FILTER
========================= */

priceFilter.addEventListener("input", () => {

    unlimitedBudget = false;

    const price = Number(priceFilter.value);

    freeFilter.checked = price === 0;

    if (price > 0) {

        previousBudget = price;

    }

    updateBudgetDisplay();

});

priceFilter.addEventListener("change", () => {

    searchGames();

});


/* =========================
   OTHER FILTERS
========================= */

storeFilter.addEventListener("change", () => {

    searchGames();

});

discountFilter.addEventListener("change", () => {

    searchGames();

});

sort.addEventListener("change", () => {

    searchGames();

});

resetButton.addEventListener("click", resetFilters);


/* =========================
   INITIALIZATION
========================= */

async function initialize() {

    updateBudgetDisplay();

    await populateStores();

    await searchGames();

}

initialize();