/* =========================
   THEME CONFIGURATION
========================= */

const THEMES = [

    {
        id: "dark",
        name: "Dark Mode"
    },

    {
        id: "light",
        name: "Light Mode"
    },

    {
        id: "nintendo",
        name: "Nintendo Mode"
    },

    {
        id: "ps5",
        name: "PlayStation Mode"
    },

    {
        id: "xbox",
        name: "Xbox Mode"
    }

];

const THEME_STORAGE_KEY = "gamefinder-theme";

let currentTheme = "dark";


/* =========================
   LOAD SAVED THEME
========================= */

function loadSavedTheme() {

    try {

        const savedTheme = localStorage.getItem(
            THEME_STORAGE_KEY
        );

        const validTheme = THEMES.some(
            theme => theme.id === savedTheme
        );

        return validTheme
            ? savedTheme
            : "dark";

    } catch (error) {

        console.warn(
            "Impossible de récupérer le thème",
            error
        );

        return "dark";
    }
}


/* =========================
   APPLY THEME
========================= */

function applyTheme(themeID) {

    const exists = THEMES.some(
        theme => theme.id === themeID
    );

    if (!exists) {
        return;
    }

    currentTheme = themeID;

    document.body.dataset.theme = themeID;

    try {

        localStorage.setItem(
            THEME_STORAGE_KEY,
            themeID
        );

    } catch (error) {

        console.warn(
            "Impossible de sauvegarder le thème",
            error
        );

    }

    updateThemeButtons();

    console.log("THEME SELECTED:", themeID);
}


/* =========================
   UPDATE ACTIVE THEME
========================= */

function updateThemeButtons() {

    document.querySelectorAll("[data-theme-option]")

        .forEach(button => {

            const active =
                button.dataset.themeOption ===
                currentTheme;

            button.classList.toggle(
                "active",
                active
            );

            button.setAttribute(
                "aria-pressed",
                String(active)
            );

        });
}


/* =========================
   CREATE THEME SELECTOR
========================= */

function createThemeSelector() {

    const switcher = document.createElement("div");

    switcher.className = "theme-switcher";


    /* THEME TOGGLE */

    const toggle = document.createElement("button");

    toggle.type = "button";

    toggle.className = "theme-toggle";

    toggle.setAttribute(
        "aria-label",
        "Changer le thème"
    );

    toggle.setAttribute(
        "aria-expanded",
        "false"
    );

    toggle.setAttribute(
        "aria-controls",
        "theme-menu"
    );

    toggle.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">

            <circle cx="12" cy="12" r="4"></circle>

            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.42 1.42"></path>
            <path d="m17.65 17.65 1.42 1.42"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="m4.93 19.07 1.42-1.42"></path>
            <path d="m17.65 6.35 1.42-1.42"></path>

        </svg>
    `;


    /* THEME MENU */

    const menu = document.createElement("div");

    menu.className = "theme-menu";

    menu.id = "theme-menu";

    menu.hidden = true;


    /* MENU TITLE */

    const title = document.createElement("h3");

    title.textContent = "Apparence";


    /* DESCRIPTION */

    const description = document.createElement("p");

    description.className = "theme-menu-description";

    description.textContent =
        "Personnalisez votre expérience GameFinder";

    menu.append(title, description);


    /* CREATE THEME OPTIONS */

    THEMES.forEach(theme => {

        const button = document.createElement("button");

        button.type = "button";

        button.className = "theme-option";

        button.dataset.themeOption = theme.id;


        /* COLOR PREVIEW */

        const preview = document.createElement("span");

        preview.className =
            `theme-preview preview-${theme.id}`;


        /* THEME NAME */

        const name = document.createElement("span");

        name.textContent = theme.name;

        button.append(preview, name);


        /* CLICK EVENT */

        button.addEventListener("click", () => {

            applyTheme(theme.id);

            menu.hidden = true;

            toggle.setAttribute(
                "aria-expanded",
                "false"
            );

            toggle.focus();
        });

        menu.append(button);

    });


    /* OPEN AND CLOSE MENU */

    toggle.addEventListener("click", () => {

        menu.hidden = !menu.hidden;

        toggle.setAttribute(
            "aria-expanded",
            String(!menu.hidden)
        );

    });


    /* CLOSE MENU WHEN CLICKING OUTSIDE */

    document.addEventListener("click", event => {

        if (!switcher.contains(event.target)) {

            menu.hidden = true;

            toggle.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });


    /* CLOSE WITH ESCAPE */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape" && !menu.hidden) {

            menu.hidden = true;

            toggle.setAttribute(
                "aria-expanded",
                "false"
            );

            toggle.focus();
        }

    });


    /* ASSEMBLE */

    switcher.append(menu, toggle);

    document.body.append(switcher);
}


/* =========================
   INITIALIZATION
========================= */

function initializeThemes() {

    currentTheme = loadSavedTheme();

    createThemeSelector();

    applyTheme(currentTheme);

}

initializeThemes();