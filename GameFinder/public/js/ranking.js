/* =========================
   GAME RANKING SYSTEM
========================= */

const GameRanking = {

    /* =========================
       RANKING CONFIGURATION
    ========================= */

    MINIMUM_REVIEWS: 1000,

    REFERENCE_RATING: 75,


    /* =========================
       POSITIVE RATING
    ========================= */

    getRating(game) {

        const rating = Number(game.steamRating);

        if (
            game.steamRating == null ||
            game.steamRating === "" ||
            !Number.isFinite(rating) ||
            rating < 0 ||
            rating > 100 ||
            this.getReviewCount(game) === 0
        ) {
            return -1;
        }

        return rating;

    },


    /* =========================
       REVIEW COUNT
    ========================= */

    getReviewCount(game) {

        const count = Number(game.steamRatingCount);

        return Number.isFinite(count) && count > 0
            ? count
            : 0;

    },


    /* =========================
       BAYESIAN SCORE
    ========================= */

    getRelevanceScore(game) {

        const rating = this.getRating(game);

        const count = this.getReviewCount(game);

        if (rating < 0 || count === 0) {

            return -1;

        }

        const minimum = this.MINIMUM_REVIEWS;

        const reference = this.REFERENCE_RATING;

        return (

            count * rating +
            minimum * reference

        ) / (

            count + minimum

        );

    },


    /* =========================
       DISCOUNT
    ========================= */

    getDiscount(game) {

        return Number(game.discount) || 0;

    },


    /* =========================
       FILTER BY BUDGET
    ========================= */

    filterByBudget(games, budget = null) {

        return games.filter(game => {

            if (
                game.price == null ||
                game.price === ""
            ) {
                return false;
            }

            const price = Number(game.price);

            return (

                Number.isFinite(price) &&

                price >= 0 &&

                (
                    budget === null ||
                    price <= Number(budget)
                )

            );

        });

    },


    /* =========================
       SMART RANKING
    ========================= */

    smartRanking(games, budget = null) {

        return this.filterByBudget(games, budget)

            .sort((a, b) => {

                const scoreA =
                    this.getRelevanceScore(a);

                const scoreB =
                    this.getRelevanceScore(b);


                /* PRIORITY 1: REVIEW RELEVANCE */

                if (scoreA !== scoreB) {

                    return scoreB - scoreA;

                }


                /* PRIORITY 2: PRICE */

                const priceDifference =

                    Number(b.price) -
                    Number(a.price);

                if (priceDifference !== 0) {

                    return priceDifference;

                }


                /* PRIORITY 3: REVIEW COUNT */

                const reviewDifference =

                    this.getReviewCount(b) -
                    this.getReviewCount(a);

                if (reviewDifference !== 0) {

                    return reviewDifference;

                }


                /* PRIORITY 4: ALPHABETICAL ORDER */

                return a.title.localeCompare(b.title);

            });

    },


    /* =========================
       RAW POSITIVITY RANKING
    ========================= */

    byPositivity(games, budget = null) {

        return this.filterByBudget(games, budget)

            .sort((a, b) => {

                return (

                    this.getRating(b) -
                    this.getRating(a)

                ) || (

                    this.getRelevanceScore(b) -
                    this.getRelevanceScore(a)

                ) || (

                    Number(b.price) -
                    Number(a.price)

                );

            });

    },


    /* =========================
       BUDGET PROXIMITY
    ========================= */

    byBudget(games, budget = null) {

        return this.filterByBudget(games, budget)

            .sort((a, b) => {

                return (

                    Number(b.price) -
                    Number(a.price)

                ) || (

                    this.getRelevanceScore(b) -
                    this.getRelevanceScore(a)

                );

            });

    },


    /* =========================
       POPULARITY
    ========================= */

    byPopularity(games, budget = null) {

        return this.filterByBudget(games, budget)

            .sort((a, b) => {

                return (

                    this.getReviewCount(b) -
                    this.getReviewCount(a)

                ) || (

                    this.getRelevanceScore(b) -
                    this.getRelevanceScore(a)

                ) || (

                    Number(b.price) -
                    Number(a.price)

                );

            });

    },


    /* =========================
       MAIN SORT FUNCTION
    ========================= */

    sort(games, mode = "default", budget = null) {

        const filtered = this.filterByBudget(
            games,
            budget
        );

        switch (mode) {


            /* SMART RANKING */

            case "default":
            case "smart":

                return this.smartRanking(
                    filtered,
                    budget
                );


            /* POSITIVE REVIEWS */

            case "rating":
            case "positivity":

                return this.byPositivity(
                    filtered,
                    budget
                );


            /* POPULARITY */

            case "popularity":

                return this.byPopularity(
                    filtered,
                    budget
                );


            /* BUDGET PROXIMITY */

            case "budget":

                return this.byBudget(
                    filtered,
                    budget
                );


            /* ASCENDING PRICE */

            case "ascending":

                return filtered.sort(
                    (a, b) => a.price - b.price
                );


            /* DESCENDING PRICE */

            case "descending":

                return filtered.sort(
                    (a, b) => b.price - a.price
                );


            /* DISCOUNT */

            case "discount":

                return filtered.sort(

                    (a, b) =>
                        this.getDiscount(b) -
                        this.getDiscount(a)

                );


            /* ALPHABETICAL ORDER */

            case "name":

                return filtered.sort(

                    (a, b) =>
                        a.title.localeCompare(b.title)

                );


            /* API RELEVANCE */

            case "relevance":

                return filtered;


            default:

                return this.smartRanking(
                    filtered,
                    budget
                );

        }

    }

};