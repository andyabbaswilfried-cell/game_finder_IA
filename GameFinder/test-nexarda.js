const nexarda = require("./services/nexarda.service");

async function test() {

    try {

        const title = process.argv.slice(2).join(" ")
            || "Mario Kart";

        const games = await nexarda.searchGames(title);

        console.log("Games found:", games.length);

        console.table(

            games.map(game => ({

                id: game.game_info?.id,

                title: game.game_info?.name,

                platforms: game.game_info?.platforms
                    ?.map(platform => platform.name)
                    .join(", ")

            }))

        );

        if (games.length === 0) {
            return;
        }

        const id = games[0].game_info?.id;

        if (id == null) {
            throw new Error("Game ID unavailable");
        }

        const prices = await nexarda.getGamePrices(id);

        console.log("Currency:", prices.prices.currency);

        console.table(

            prices.prices.list.map(offer => ({

                store: offer.store?.name,

                platform: offer.platform,

                edition: offer.edition_full,

                region: offer.region,

                price: offer.price,

                available: offer.available

            }))

        );

    } catch (error) {

        console.error("ERROR:", error);

    }
}

test();