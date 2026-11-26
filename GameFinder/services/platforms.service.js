const cheapshark = require('./cheapshark.service');
const nexarda = require('./nexarda.service');

const PLATFORMS = ['pc', 'nintendo', 'ps5', 'xbox'];

const DISCOVERY = {
    nintendo: [
        'Mario Kart 8 Deluxe',
        'Super Mario Odyssey',
        'Kirby and the Forgotten Land',
        'Animal Crossing New Horizons',
        'The Legend of Zelda Breath of the Wild',
        'Stardew Valley',
        'Terraria',
        'Mario Kart World'
    ],

    ps5: [
        'Astro Bot',
        'Gran Turismo 7',
        'Sackboy A Big Adventure',
        'Ratchet and Clank Rift Apart',
        'Overcooked All You Can Eat',
        'Minecraft',
        'Sonic Superstars',
        'Moving Out 2'
    ],

    xbox: [
        'Forza Horizon 5',
        'Forza Motorsport',
        'Minecraft',
        'Ori and the Will of the Wisps',
        'Microsoft Flight Simulator',
        'Overcooked All You Can Eat',
        'Sonic Superstars',
        'Moving Out 2'
    ]
};

const FREE_DISCOVERY = {
    nintendo: [
        'Rocket League',
        'Fall Guys',
        'Pokemon Unite',
        'Disney Speedstorm',
        'Brawlhalla',
        'Sky Children of the Light'
    ],

    ps5: [
        'Rocket League',
        'Fall Guys',
        'Disney Speedstorm',
        'Brawlhalla',
        'Trackmania',
        'Sky Children of the Light'
    ],

    xbox: [
        'Rocket League',
        'Fall Guys',
        'Disney Speedstorm',
        'Brawlhalla',
        'Trackmania',
        'Asphalt Legends Unite'
    ]
};


/* =========================
   CACHE AND REQUEST QUEUE
========================= */

const CACHE_TTL = 10 * 60 * 1000;

const cache = new Map();
const pending = new Map();

let running = 0;

const queue = [];

function schedule(task) {

    return new Promise((resolve, reject) => {

        const start = () => {

            running++;

            Promise.resolve()
                .then(task)
                .then(resolve, reject)
                .finally(() => {

                    running--;

                    if (queue.length) {
                        queue.shift()();
                    }

                });
        };

        if (running < 3) {

            start();

        } else if (queue.length < 60) {

            queue.push(start);

        } else {

            reject(new Error(
                'Trop de recherches simultanées. Réessayez.'
            ));

        }
    });
}


async function cached(key, task) {

    const entry = cache.get(key);

    if (entry && Date.now() < entry.expires) {
        return entry.value;
    }

    if (pending.has(key)) {
        return pending.get(key);
    }

    const promise = schedule(task)
        .then(value => {

            cache.delete(key);

            cache.set(key, {
                value,
                expires: Date.now() + CACHE_TTL
            });

            if (cache.size > 150) {
                cache.delete(cache.keys().next().value);
            }

            return value;

        })
        .finally(() => pending.delete(key));

    pending.set(key, promise);

    return promise;
}


/* =========================
   DATA VALIDATION
========================= */

function numberOrNull(value) {

    if (
        value == null ||
        value === '' ||
        typeof value === 'boolean'
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}


function safeUrl(value) {

    try {

        const url = new URL(value);

        return url.protocol === 'https:'
            ? value
            : null;

    } catch {

        return null;

    }
}


/* =========================
   PLATFORM VALIDATION
========================= */

function validOffer(offer, platform) {

    const price = numberOrNull(offer.price);

    if (
        offer.available !== true ||
        price === null ||
        price < 0
    ) {
        return false;
    }

    const edition = String(
        offer.edition_full || ''
    ).toUpperCase();

    const family = String(
        offer.platform || ''
    ).toLowerCase();

    const tags = [
        ...edition.matchAll(/\bFOR:([A-Z0-9-]+)\b/g)
    ].map(match => match[1]);


    if (platform === 'nintendo') {

        return family === 'nintendo' &&
            tags.some(tag =>
                ['SWITCH', 'SWITCH-2'].includes(tag)
            );
    }

    if (platform === 'ps5') {

        return family === 'playstation' &&
            tags.includes('PS5');

    }

    if (platform === 'xbox') {

        return [
            'xbox',
            'xbox play anywhere'
        ].includes(family) &&
            tags.includes('XBOX-XS');

    }

    return false;
}


/* =========================
   BUDGET FILTER
========================= */

function matchesBudget(offer, query) {

    const upper = numberOrNull(query.upperPrice);
    const lower = numberOrNull(query.lowerPrice);

    return (
        upper === null ||
        offer.price <= upper
    ) && (
        lower === null ||
        offer.price >= lower
    ) && (
        query.onSale !== '1' ||
        offer.discount > 0
    ) && (
        !query.storeName ||
        offer.store === query.storeName
    );
}


/* =========================
   REMOVE DUPLICATES
========================= */

function groupGames(offers) {

    const map = new Map();

    for (const offer of offers) {

        const key =
            `${offer.source}:${offer.gameID}:${offer.platform}`;

        if (!map.has(key)) {
            map.set(key, []);
        }

        map.get(key).push(offer);
    }

    return [...map.values()].map(list => {

        list.sort((a, b) => a.price - b.price);

        return {
            ...list[0],
            offers: list,
            offerCount: list.length
        };

    });
}


/* =========================
   SORT GAMES
========================= */

function sortGames(games, query) {

    const direction = query.desc === '1' ? -1 : 1;

    const field = {
        Price: 'price',
        Savings: 'discount',
        Reviews: 'steamRating',
        Metacritic: 'metacritic',
        Title: 'title'
    }[query.sortBy];

    if (field) {

        games.sort((a, b) => {

            if (a[field] == null) {
                return b[field] == null ? 0 : 1;
            }

            if (b[field] == null) {
                return -1;
            }

            return direction * (
                field === 'title'
                    ? a.title.localeCompare(b.title)
                    : a[field] - b[field]
            );
        });
    }

    return games;
}


/* =========================
   PC - CHEAPSHARK
========================= */

async function getPCDeals(query) {

    const allowed = [
        'title',
        'upperPrice',
        'lowerPrice',
        'storeID',
        'onSale',
        'sortBy',
        'desc',
        'pageNumber',
        'pageSize',
        'steamRating',
        'metacritic'
    ];

    const filters = Object.fromEntries(

        allowed
            .filter(key => typeof query[key] === 'string')
            .map(key => [key, query[key]])

    );

    if (!filters.title && query.franchise) {
        filters.title = query.franchise;
    }

    if (
        !filters.sortBy ||
        filters.sortBy === 'Deal Rating'
    ) {
        filters.sortBy = 'DealRating';
    }

    if (filters.upperPrice === undefined) {
        filters.upperPrice = '50';
    }

    if (filters.sortBy === 'Price') {

        filters.desc = query.desc === '1'
            ? '1'
            : '0';

    }

    if ([
        'DealRating',
        'Savings',
        'Reviews',
        'Metacritic'
    ].includes(filters.sortBy)) {

        filters.desc = query.desc === '0'
            ? '1'
            : '0';

    }

    const raw = await cheapshark.getDeals(filters);

    if (!Array.isArray(raw)) {
        throw new Error('Réponse CheapShark invalide');
    }

    let stores = [];
    let partial = false;

    try {

        stores = await cheapshark.getStores();

        if (!Array.isArray(stores)) {

            stores = [];
            partial = true;

        }

    } catch (error) {

        console.warn('CheapShark stores:', error.message);

        partial = true;
    }

    const names = new Map(

        stores.map(store => [
            String(store.storeID),
            store.storeName
        ])

    );

    const offers = raw.flatMap(deal => {

        const price = numberOrNull(deal.salePrice);

        if (
            price === null ||
            price < 0 ||
            !deal.gameID ||
            !deal.dealID
        ) {
            return [];
        }

        return [{

            title: deal.title,

            gameID: String(deal.gameID),

            dealID: deal.dealID,

            image: safeUrl(deal.thumb),

            price,

            normalPrice: numberOrNull(deal.normalPrice),

            discount: numberOrNull(deal.savings) ?? 0,

            currency: 'USD',

            steamRating:
                Number(deal.steamRatingCount) > 0
                    ? numberOrNull(deal.steamRatingPercent)
                    : null,

            steamRatingCount:
                Number(deal.steamRatingCount) || 0,

            metacritic:
                numberOrNull(deal.metacriticScore),

            storeID: String(deal.storeID),

            store:
                names.get(String(deal.storeID)) ||
                'Boutique inconnue',

            platform: 'pc',

            platformLabel: 'PC',

            edition: null,

            region: null,

            source: 'cheapshark',

            url:
                'https://www.cheapshark.com/redirect?dealID='
                + deal.dealID

        }];

    }).filter(offer => matchesBudget(offer, query));

    return {

        games: sortGames(groupGames(offers), query),

        partial

    };
}


/* =========================
   GAME PLATFORM FAMILY
========================= */

function belongsToFamily(item, platform) {

    const names = item.game_info?.platforms?.map(
        p => String(p.name).toLowerCase()
    );

    if (!Array.isArray(names) || !names.length) {
        return true;
    }

    const expected = {

        nintendo: ['nintendo'],

        ps5: ['playstation'],

        xbox: ['xbox', 'xbox play anywhere']

    }[platform];

    return names.some(name => expected.includes(name));
}


/* =========================
   CONSOLES - NEXARDA
========================= */

async function getConsoleDeals(platform, query) {

    const title = (
        query.title ||
        query.franchise ||
        ''
    ).trim();

    const terms = title

        ? [title]

        : (
            query.upperPrice === '0'
                ? FREE_DISCOVERY
                : DISCOVERY
        )[platform];

    let partial = false;
    let successes = 0;

    const candidates = new Map();


    /* SEARCH GAMES */

    const searched = await Promise.allSettled(

        terms.map(term => cached(

            'search:' + term.toLowerCase(),

            () => nexarda.searchGames(term)

        ))

    );

    searched.forEach(result => {

        if (result.status === 'rejected') {

            partial = true;

            console.warn(
                'NEXARDA search:',
                result.reason?.message
            );

            return;
        }

        if (!Array.isArray(result.value)) {

            partial = true;

            return;
        }

        successes++;

        const items = result.value.filter(item =>

            item.game_info?.id != null &&
            belongsToFamily(item, platform)

        );

        for (const item of items.slice(0, title ? 10 : 2)) {

            candidates.set(
                String(item.game_info.id),
                item
            );

        }
    });

    if (!successes) {
        throw new Error('Recherche NEXARDA indisponible');
    }


    /* GET PRICES */

    const items = [...candidates.values()].slice(0, 10);

    const priced = await Promise.allSettled(

        items.map(item => cached(

            'prices:USD:' + item.game_info.id,

            () => nexarda.getGamePrices(
                item.game_info.id,
                'USD'
            )

        ))

    );

    const offers = [];

    let pricedCount = 0;

    priced.forEach((result, index) => {

        if (result.status === 'rejected') {

            partial = true;

            console.warn(
                'NEXARDA prices:',
                result.reason?.message
            );

            return;
        }

        const data = result.value;

        if (
            data.prices?.currency !== 'USD' ||
            !Array.isArray(data.prices.list)
        ) {

            partial = true;

            return;
        }

        pricedCount++;

        const item = items[index];

        for (const raw of data.prices.list) {

            if (!validOffer(raw, platform)) {
                continue;
            }

            const price = numberOrNull(raw.price);

            const discount =
                numberOrNull(raw.discount) ?? 0;

            const store = raw.store?.name;

            const url = safeUrl(raw.url);

            if (!store || !url) {
                continue;
            }

            const tags = String(raw.edition_full);

            const platformLabel =

                platform === 'nintendo'

                    ? (
                        tags.includes('FOR:SWITCH-2')
                            ? 'Switch 2'
                            : 'Switch'
                    )

                    : platform === 'ps5'

                        ? 'PS5'

                        : 'Xbox Series X/S';

            offers.push({

                title:
                    item.game_info.name ||
                    data.info?.name ||
                    item.title,

                gameID: String(item.game_info.id),

                dealID: null,

                image:
                    safeUrl(data.info?.banner) ||
                    safeUrl(data.info?.cover) ||
                    safeUrl(item.image),

                price,

                normalPrice: null,

                discount:
                    discount > 0 && discount <= 100
                        ? discount
                        : 0,

                currency: 'USD',

                steamRating: null,

                steamRatingCount: 0,

                metacritic: null,

                storeID: store,

                store,

                platform,

                platformLabel,

                edition:
                    raw.edition ||
                    raw.edition_full,

                region: raw.region || null,

                source: 'nexarda',

                url

            });
        }
    });

    if (items.length && !pricedCount) {

        throw new Error(
            'Prix NEXARDA indisponibles'
        );

    }

    const filtered = offers.filter(
        offer => matchesBudget(offer, query)
    );

    return {

        games: sortGames(groupGames(filtered), query),

        partial

    };
}


/* =========================
   API SELECTION
========================= */

async function getDeals(query) {

    const platform = query.platform || 'pc';

    if (!PLATFORMS.includes(platform)) {

        throw new Error('Plateforme inconnue');

    }

    return platform === 'pc'

        ? getPCDeals(query)

        : getConsoleDeals(platform, query);

}


/* =========================
   EXPORTS
========================= */

module.exports = {

    getDeals,

    groupGames,

    validOffer,

    PLATFORMS

};