/* =========================
   DOM ELEMENTS
========================= */

const form = document.querySelector("#search-form");
const input = document.querySelector("#search");

const results = document.querySelector("#results");
const resultCount = document.querySelector("#result-count");
const resultsTitle = document.querySelector("#results-title");

const platformFilter = document.querySelector("#platform-filter");
const franchiseFilter = document.querySelector("#franchise-filter");
const storeFilter = document.querySelector("#store-filter");

const priceFilter = document.querySelector("#price-filter");
const priceValue = document.querySelector("#price-value");

const freeFilter = document.querySelector("#free-filter");
const discountFilter = document.querySelector("#discount-filter");

const sort = document.querySelector("#sort");

const resetButton = document.querySelector("#reset-filters");
const freeNav = document.querySelector("#free-nav");

const franchiseGrid = document.querySelector("#franchise-grid");
const franchiseTitle = document.querySelector("#franchise-title");

const platformButtons = document.querySelectorAll(
    "[data-platform-select]"
);

const budgetButtons = document.querySelectorAll(
    "[data-budget]"
);

const dialog = document.querySelector("#comparison-dialog");
const comparisonTitle = document.querySelector("#comparison-title");
const comparisonResults = document.querySelector("#comparison-results");
const closeDialog = document.querySelector("#close-dialog");


/* =========================
   APPLICATION STATE
========================= */

let currentPlatform = "pc";
let currentRequest = null;

let games = [];
let pcStores = [];

let unlimitedBudget = false;
let previousBudget = 20;


/* =========================
   PLATFORM CONFIGURATION
========================= */

const PLATFORMS = {

    pc: {

        name: "PC",

        franchises: [
            "Terraria",
            "Civilization",
            "The Sims",
            "Sonic",
            "Minecraft",
            "Age of Empires"
        ]

    },

    nintendo: {

        name: "Nintendo",

        franchises: [
            "Mario",
            "Zelda",
            "Pokemon",
            "Kirby",
            "Animal Crossing",
            "Splatoon",
            "Metroid",
            "Donkey Kong",
            "Fire Emblem",
            "Super Smash Bros"
        ]

    },

    ps5: {

        name: "PlayStation 5",

        franchises: [
            "Astro Bot",
            "Ratchet & Clank",
            "Gran Turismo",
            "Sackboy",
            "Final Fantasy",
            "Horizon",
            "Sonic",
            "Minecraft"
        ]

    },

    xbox: {

        name: "Xbox Series X/S",

        franchises: [
            "Forza",
            "Minecraft",
            "Ori",
            "Flight Simulator",
            "Age of Empires",
            "Sonic",
            "Psychonauts"
        ]

    }

};


/* =========================
   DOM HELPER
========================= */

function createElement(tag, className, text) {

    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}


/* =========================
   SAFE URL
========================= */

function safeUrl(value) {

    try {

        const url = new URL(value);

        return url.protocol === "https:"
            ? url.href
            : null;

    } catch {

        return null;

    }
}


/* =========================
   BUILD API PARAMETERS
========================= */

function buildParams() {

    const params = new URLSearchParams();

    params.set("platform", currentPlatform);

    const title = input.value.trim();


    /* SEARCH */

    if (title) {

        params.set("title", title);

    } else if (franchiseFilter.value) {

        params.set(
            "franchise",
            franchiseFilter.value
        );

    }


    /* BUDGET */

    if (freeFilter.checked) {

        params.set("upperPrice", "0");
        params.set("lowerPrice", "0");

    } else if (!unlimitedBudget) {

        params.set(
            "upperPrice",
            priceFilter.value
        );

    }

    params.set("pageSize", "60");


    /* STORE */

    if (storeFilter.value !== "all") {

        if (currentPlatform === "pc") {

            params.set(
                "storeID",
                storeFilter.value
            );

        } else {

            params.set(
                "storeName",
                storeFilter.value
            );

        }

    }


    /* DISCOUNTS */

    if (discountFilter.checked) {

        params.set("onSale", "1");

    }


    /* SORTING */

    switch (sort.value) {

        case "ascending":

            params.set("sortBy", "Price");
            params.set("desc", "0");

            break;


        case "descending":
        case "budget":

            params.set("sortBy", "Price");
            params.set("desc", "1");

            break;


        case "discount":

            params.set("sortBy", "Savings");
            params.set("desc", "1");

            break;


        case "rating":
        case "positivity":
        case "popularity":
        case "default":

            if (currentPlatform === "pc") {

                params.set("sortBy", "Reviews");
                params.set("desc", "1");

            } else {

                params.set("sortBy", "Price");
                params.set("desc", "1");

            }

            break;


        case "name":

            params.set("sortBy", "Title");
            params.set("desc", "0");

            break;


        case "relevance":

            params.set("sortBy", "Deal Rating");
            params.set("desc", "1");

            break;


        default:

            params.set("sortBy", "Price");
            params.set("desc", "1");

            break;

    }

    return params;
}


/* =========================
   FETCH GAMES
========================= */

async function searchGames(shouldScroll = false) {

    currentRequest?.abort();

    const controller = new AbortController();

    currentRequest = controller;

    games = [];

    updateResultsTitle();

    resultCount.textContent = "Recherche en cours...";

    showLoading();

    if (shouldScroll) {

        document.querySelector("#offers")
            ?.scrollIntoView({

                behavior: "smooth",
                block: "start"

            });

    }

    try {

        const params = buildParams();

        const endpoint =
            `/api/games/deals?${params.toString()}`;

        console.log("REQUEST:", endpoint);

        const response = await fetch(endpoint, {

            signal: controller.signal

        });

        if (!response.ok) {

            const errorData = await response.json()
                .catch(() => ({}));

            throw new Error(

                errorData.error ||
                `Erreur HTTP ${response.status}`

            );

        }

        const data = await response.json();

        if (currentRequest !== controller) {
            return;
        }

        if (!Array.isArray(data)) {

            throw new Error("Réponse API invalide");

        }


        /* PLATFORM VALIDATION */

        if (

            data.length > 0 &&
            currentPlatform !== "pc" &&
            !data.some(game =>
                game.platform === currentPlatform
            )

        ) {

            throw new Error(
                "Le backend ne renvoie pas les jeux de cette plateforme."
            );

        }


        /* PRICE VALIDATION */

        games = data.filter(game => {

            if (
                game.price == null ||
                game.price === ""
            ) {
                return false;
            }

            const price = Number(game.price);

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {
                return false;
            }

            const platform = game.platform || "pc";

            if (platform !== currentPlatform) {
                return false;
            }

            if (
                params.has("upperPrice") &&
                price > Number(params.get("upperPrice"))
            ) {
                return false;
            }

            if (freeFilter.checked && price !== 0) {
                return false;
            }

            return true;

        });


        /* CONSOLE STORES */

        if (currentPlatform !== "pc") {

            populateConsoleStores(games);

        }


        /* APPLY RANKING */

        sortGames();

        renderGames();


        /* PARTIAL RESULTS */

        if (
            response.headers.get(
                "X-GameFinder-Partial"
            ) === "1"
        ) {

            resultCount.textContent +=
                " — Certains résultats sont indisponibles";

        }

    } catch (error) {

        if (

            error.name === "AbortError" ||
            currentRequest !== controller

        ) {
            return;
        }

        console.error("SEARCH ERROR:", error);

        resultCount.textContent = "Erreur de recherche";

        showEmptyState(

            "Impossible de récupérer les jeux",
            error.message

        );

    }

}


/* =========================
   RANKING SYSTEM
========================= */

function sortGames() {

    const budget = freeFilter.checked

        ? 0

        : unlimitedBudget

            ? null

            : Number(priceFilter.value);

    games = GameRanking.sort(

        games,
        sort.value,
        budget

    );

}


/* =========================
   PLATFORM SELECTION
========================= */

function selectPlatform(platform, shouldScroll = true) {

    if (!PLATFORMS[platform]) {
        return;
    }

    currentPlatform = platform;

    document.body.dataset.platform = platform;

    platformFilter.value = platform;

    input.value = "";

    franchiseFilter.value = "";

    storeFilter.value = "all";

    unlimitedBudget = true;

    freeFilter.checked = false;

    discountFilter.checked = false;

    priceFilter.value = priceFilter.max;

    if (

        platform !== "pc" &&
        ["rating", "positivity", "popularity"].includes(
            sort.value
        )

    ) {

        sort.value = "default";

    }

    updatePlatformButtons();

    updateBudgetDisplay();

    renderFranchises();

    populateStoreOptions();

    searchGames(shouldScroll);

}


/* =========================
   PLATFORM BUTTONS
========================= */

function updatePlatformButtons() {

    platformButtons.forEach(button => {

        const active =

            button.dataset.platformSelect ===
            currentPlatform;

        button.classList.toggle("active", active);

        button.setAttribute(
            "aria-pressed",
            String(active)
        );

    });

    ["rating", "positivity", "popularity"]
        .forEach(value => {

            const option = sort.querySelector(
                `option[value="${value}"]`
            );

            if (option) {

                option.disabled =
                    currentPlatform !== "pc";

            }

        });

}


/* =========================
   FRANCHISES
========================= */

function renderFranchises() {

    const configuration =
        PLATFORMS[currentPlatform];

    franchiseFilter.replaceChildren(

        new Option(
            "Toutes les licences",
            ""
        )

    );

    franchiseGrid.replaceChildren();

    franchiseTitle.textContent =
        `Les univers ${configuration.name}`;

    configuration.franchises.forEach(franchise => {

        franchiseFilter.append(

            new Option(
                franchise,
                franchise
            )

        );

        const card = createElement(
            "button",
            "franchise-card"
        );

        card.type = "button";

        card.dataset.franchise = franchise;

        card.append(

            createElement(
                "strong",
                "",
                franchise
            ),

            createElement(
                "span",
                "",
                "Découvrir les jeux →"
            )

        );

        card.addEventListener("click", () => {

            selectFranchise(franchise);

        });

        franchiseGrid.append(card);

    });

}


function selectFranchise(franchise) {

    input.value = "";

    franchiseFilter.value = franchise;

    storeFilter.value = "all";

    updateFranchiseCards();

    searchGames(true);

}


function updateFranchiseCards() {

    document.querySelectorAll("[data-franchise]")

        .forEach(card => {

            card.classList.toggle(

                "active",

                card.dataset.franchise ===
                franchiseFilter.value

            );

        });

}


/* =========================
   LOAD PC STORES
========================= */

async function loadPCStores() {

    try {

        const response = await fetch(
            "/api/games/stores"
        );

        if (!response.ok) {

            throw new Error("Boutiques indisponibles");

        }

        const data = await response.json();

        if (!Array.isArray(data)) {

            throw new Error("Réponse boutiques invalide");

        }

        pcStores = data.filter(store =>

            Number(store.isActive) === 1

        );

    } catch (error) {

        console.error("STORE ERROR:", error);

        pcStores = [];

    }

}


/* =========================
   STORE OPTIONS
========================= */

function populateStoreOptions() {

    storeFilter.replaceChildren(

        new Option(
            "Toutes les boutiques",
            "all"
        )

    );

    if (currentPlatform !== "pc") {
        return;
    }

    pcStores
        .slice()
        .sort((a, b) =>

            a.storeName.localeCompare(b.storeName)

        )
        .forEach(store => {

            storeFilter.append(

                new Option(
                    store.storeName,
                    store.storeID
                )

            );

        });

}


/* =========================
   CONSOLE STORES
========================= */

function populateConsoleStores(games) {

    const selected = storeFilter.value;

    if (selected !== "all") {
        return;
    }

    const names = new Set();

    games.forEach(game => {

        const offers = Array.isArray(game.offers)

            ? game.offers

            : [game];

        offers.forEach(offer => {

            if (offer.store) {

                names.add(offer.store);

            }

        });

    });

    storeFilter.replaceChildren(

        new Option(
            "Toutes les boutiques",
            "all"
        )

    );

    [...names]
        .sort()
        .forEach(name => {

            storeFilter.append(
                new Option(name, name)
            );

        });

}


/* =========================
   BUDGET SELECTION
========================= */

function selectBudget(budget) {

    storeFilter.value = "all";

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
   BUDGET DISPLAY
========================= */

function updateBudgetDisplay() {

    const budget = unlimitedBudget

        ? "all"

        : String(priceFilter.value);

    priceValue.textContent = unlimitedBudget

        ? "Sans limite personnalisée"

        : `${priceFilter.value} $`;

    budgetButtons.forEach(button => {

        const active =
            button.dataset.budget === budget;

        button.classList.toggle("active", active);

        button.setAttribute(
            "aria-pressed",
            String(active)
        );

    });

}


/* =========================
   RESULTS TITLE
========================= */

function updateResultsTitle() {

    const platformName =
        PLATFORMS[currentPlatform].name;

    const title = input.value.trim();

    let heading;

    if (title) {

        heading = `${title} — ${platformName}`;

    } else if (franchiseFilter.value) {

        heading =
            `${franchiseFilter.value} — ${platformName}`;

    } else if (freeFilter.checked) {

        heading =
            `Jeux gratuits — ${platformName}`;

    } else {

        heading = `Jeux ${platformName}`;

    }

    if (!unlimitedBudget && !freeFilter.checked) {

        heading +=
            ` — ${priceFilter.value} $ maximum`;

    }

    resultsTitle.textContent = heading;

}


/* =========================
   DISCOUNT CALCULATION
========================= */

function getDiscount(game) {

    if (

        game.discount != null &&
        Number.isFinite(Number(game.discount))

    ) {

        return Math.max(

            0,

            Math.min(
                100,
                Math.round(Number(game.discount))
            )

        );

    }

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

    if (Number(price) === 0) {

        return "Gratuit";

    }

    return new Intl.NumberFormat("fr-FR", {

        style: "currency",
        currency: "USD"

    }).format(Number(price));

}


/* =========================
   FORMAT REVIEW COUNT
========================= */

function formatReviewCount(count) {

    return new Intl.NumberFormat("fr-FR")
        .format(count);

}


/* =========================
   RENDER GAMES
========================= */

function renderGames() {

    results.replaceChildren();

    resultCount.textContent =

        `${games.length} jeu(x) trouvé(s) — ` +
        PLATFORMS[currentPlatform].name;

    if (!games.length) {

        showEmptyState(

            freeFilter.checked

                ? "Aucun jeu gratuit trouvé"

                : "Aucun jeu trouvé",

            "Essayez un autre titre, une autre licence ou augmentez votre budget."

        );

        return;
    }

    const fragment =
        document.createDocumentFragment();

    games.forEach(game => {

        fragment.append(
            createGameCard(game)
        );

    });

    results.append(fragment);

}


/* =========================
   CREATE GAME CARD
========================= */

function createGameCard(game) {

    const card = createElement(
        "article",
        "game-card"
    );

    const isFree = Number(game.price) === 0;

    const discount = getDiscount(game);


    /* IMAGE */

    const imageWrapper = createElement(
        "div",
        "game-image-wrapper"
    );

    const imageUrl = safeUrl(game.image);

    if (imageUrl) {

        const image = createElement(
            "img",
            "game-image"
        );

        image.src = imageUrl;

        image.alt = game.title;

        image.loading = "lazy";

        image.addEventListener("error", () => {

            image.replaceWith(

                createElement(
                    "div",
                    "image-placeholder",
                    game.title
                )

            );

        });

        imageWrapper.append(image);

    } else {

        imageWrapper.append(

            createElement(
                "div",
                "image-placeholder",
                game.title
            )

        );

    }


    /* PLATFORM BADGE */

    imageWrapper.append(

        createElement(

            "span",
            "platform-badge",

            game.platformLabel ||
            PLATFORMS[currentPlatform].name

        )

    );


    /* DISCOUNT BADGE */

    if (isFree) {

        imageWrapper.append(

            createElement(
                "span",
                "free-badge",
                "GRATUIT"
            )

        );

    } else if (discount > 0) {

        imageWrapper.append(

            createElement(
                "span",
                "discount-badge",
                `-${discount}%`
            )

        );

    }


    /* CONTENT */

    const content = createElement(
        "div",
        "game-content"
    );

    const store = createElement(

        "span",
        "store-label",
        game.store || "Boutique inconnue"

    );

    const title = createElement(

        "h3",
        "game-title",
        game.title

    );


    /* =========================
       REVIEW INFORMATION
    ========================= */

    const rating = GameRanking.getRating(game);

    const reviewCount =
        GameRanking.getReviewCount(game);

    const reviewSection = createElement(
        "div",
        "review-section"
    );


    /* POSITIVE REVIEWS */

    const ratingElement = createElement(

        "p",

        "game-rating",

        rating >= 0

            ? `★ ${rating}% d'avis positifs`

            : "Note indisponible"

    );


    /* RATING COLOR */

    if (rating >= 90) {

        ratingElement.classList.add(
            "rating-excellent"
        );

    } else if (rating >= 75) {

        ratingElement.classList.add(
            "rating-good"
        );

    } else if (rating >= 50) {

        ratingElement.classList.add(
            "rating-average"
        );

    } else if (rating >= 0) {

        ratingElement.classList.add(
            "rating-poor"
        );

    } else {

        ratingElement.classList.add(
            "rating-unavailable"
        );

    }


    /* NUMBER OF REVIEWS */

    const reviewCountElement = createElement(

        "p",

        "review-count",

        reviewCount > 0

            ? `${formatReviewCount(reviewCount)} ${
                reviewCount === 1
                    ? "évaluation Steam"
                    : "évaluations Steam"
            }`

            : "Nombre d'avis indisponible"

    );


    /* REVIEW SECTION */

    reviewSection.append(

        ratingElement,
        reviewCountElement

    );


    /* OFFER COUNT */

    const offers =

        Array.isArray(game.offers) &&
        game.offers.length

            ? game.offers

            : [game];

    const storeCount = new Set(

        offers
            .map(offer => offer.store)
            .filter(Boolean)

    ).size;

    const offerCount = createElement(

        "p",
        "offer-count",

        `${storeCount} ${
            storeCount === 1
                ? "boutique référencée"
                : "boutiques référencées"
        }`

    );


    /* GAME BOTTOM */

    const bottom = createElement(
        "div",
        "game-bottom"
    );

    const priceLabel = createElement(

        "p",
        "price-label",

        storeCount > 1

            ? "À partir de"

            : "Prix actuel"

    );


    /* PRICE */

    const priceContainer = createElement(
        "div",
        "price-container"
    );

    priceContainer.append(

        createElement(

            "span",
            "price",
            formatPrice(game.price)

        )

    );

    if (

        game.normalPrice != null &&
        Number(game.normalPrice) >
        Number(game.price)

    ) {

        priceContainer.append(

            createElement(

                "span",
                "old-price",
                formatPrice(game.normalPrice)

            )

        );

    }

    bottom.append(
        priceLabel,
        priceContainer
    );


    /* STORE LINK */

    const fallbackUrl =

        currentPlatform === "pc" && game.dealID

            ? "https://www.cheapshark.com/redirect?dealID="
                + game.dealID

            : null;

    const url = safeUrl(
        game.url || fallbackUrl
    );

    if (url) {

        const link = createElement(

            "a",

            "offer-button",

            isFree

                ? "Voir l'offre gratuite ↗"

                : "Voir la meilleure offre ↗"

        );

        link.href = url;

        link.target = "_blank";

        link.rel = "noopener noreferrer";

        if (isFree) {

            link.classList.add("free-offer");

        }

        bottom.append(link);

    }


    /* COMPARE OFFERS */

    if (offers.length > 1 && dialog) {

        const compareButton = createElement(

            "button",

            "compare-button",

            "Comparer les offres"

        );

        compareButton.type = "button";

        compareButton.addEventListener("click", () => {

            showComparison(game);

        });

        bottom.append(compareButton);

    }


    /* ASSEMBLE CARD */

    content.append(

        store,
        title,
        reviewSection,
        offerCount,
        bottom

    );

    card.append(

        imageWrapper,
        content

    );

    return card;

}


/* =========================
   COMPARE OFFERS
========================= */

function showComparison(game) {

    comparisonTitle.textContent = game.title;

    comparisonResults.replaceChildren();

    const offers = [...game.offers]

        .sort((a, b) => a.price - b.price);

    offers.forEach(offer => {

        const row = createElement(
            "div",
            "comparison-row"
        );

        const information = createElement("div");

        const store = createElement(
            "strong",
            "",
            offer.store
        );

        const details = createElement(

            "p",

            "comparison-details",

            [

                offer.platformLabel,
                offer.edition,
                offer.region

            ].filter(Boolean).join(" · ")

        );

        information.append(
            store,
            details
        );

        const price = createElement(

            "span",
            "comparison-price",
            formatPrice(offer.price)

        );

        row.append(
            information,
            price
        );

        const url = safeUrl(offer.url);

        if (url) {

            const link = createElement(

                "a",
                "",
                "Voir l'offre ↗"

            );

            link.href = url;

            link.target = "_blank";

            link.rel = "noopener noreferrer";

            row.append(link);

        }

        comparisonResults.append(row);

    });

    dialog.showModal();

}


/* =========================
   LOADING STATE
========================= */

function showLoading() {

    results.replaceChildren();

    for (let i = 0; i < 6; i++) {

        const skeleton = createElement(

            "div",
            "skeleton-card"

        );

        skeleton.setAttribute(
            "aria-hidden",
            "true"
        );

        results.append(skeleton);

    }

}


/* =========================
   EMPTY STATE
========================= */

function showEmptyState(title, description) {

    const container = createElement(

        "div",
        "empty-state"

    );

    container.append(

        createElement("h3", "", title),

        createElement("p", "", description)

    );

    results.replaceChildren(container);

}


/* =========================
   RESET FILTERS
========================= */

function resetFilters() {

    input.value = "";

    franchiseFilter.value = "";

    storeFilter.value = "all";

    sort.value = "default";

    priceFilter.value = 20;

    previousBudget = 20;

    unlimitedBudget = false;

    freeFilter.checked = false;

    discountFilter.checked = false;

    updateBudgetDisplay();

    updateFranchiseCards();

    searchGames();

}


/* =========================
   SEARCH EVENT
========================= */

form.addEventListener("submit", event => {

    event.preventDefault();

    franchiseFilter.value = "";

    storeFilter.value = "all";

    updateFranchiseCards();

    searchGames(true);

});


/* =========================
   PLATFORM EVENTS
========================= */

platformButtons.forEach(button => {

    button.addEventListener("click", event => {

        event.preventDefault();

        selectPlatform(
            button.dataset.platformSelect
        );

    });

});


platformFilter.addEventListener("change", () => {

    selectPlatform(
        platformFilter.value,
        false
    );

});


/* =========================
   FRANCHISE EVENTS
========================= */

franchiseFilter.addEventListener("change", () => {

    input.value = "";

    storeFilter.value = "all";

    updateFranchiseCards();

    searchGames();

});


/* =========================
   BUDGET EVENTS
========================= */

budgetButtons.forEach(button => {

    button.addEventListener("click", () => {

        selectBudget(
            button.dataset.budget
        );

    });

});


/* =========================
   FREE GAMES NAVIGATION
========================= */

freeNav.addEventListener("click", event => {

    event.preventDefault();

    input.value = "";

    franchiseFilter.value = "";

    discountFilter.checked = false;

    updateFranchiseCards();

    selectBudget("0");

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
   FREE FILTER
========================= */

freeFilter.addEventListener("change", () => {

    unlimitedBudget = false;

    if (freeFilter.checked) {

        if (Number(priceFilter.value) > 0) {

            previousBudget =
                Number(priceFilter.value);

        }

        priceFilter.value = 0;

    } else {

        priceFilter.value = previousBudget;

    }

    updateBudgetDisplay();

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


resetButton.addEventListener(

    "click",
    resetFilters

);


/* =========================
   DIALOG EVENTS
========================= */

closeDialog?.addEventListener("click", () => {

    dialog?.close();

});


dialog?.addEventListener("click", event => {

    if (event.target === dialog) {

        dialog.close();

    }

});


/* =========================
   INITIALIZATION
========================= */

async function initialize() {

    console.log(
        "GameFinder initialized — Review Ranking enabled"
    );

    document.body.dataset.platform =
        currentPlatform;

    platformFilter.value =
        currentPlatform;

    updatePlatformButtons();

    updateBudgetDisplay();

    renderFranchises();

    await loadPCStores();

    populateStoreOptions();

    await searchGames();

}

initialize();