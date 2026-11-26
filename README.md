# 🎮 GameFinder

> Play more. Spend less.

GameFinder est une application web multiplateforme permettant de découvrir des jeux vidéo, de comparer leurs prix et de trouver les meilleures offres en fonction de son budget et des évaluations des joueurs.

L'objectif est de centraliser les offres de différentes boutiques sur une seule plateforme afin de faciliter la recherche de jeux vidéo et la prise de décision des utilisateurs.

---

## 📌 Sommaire

- Présentation
- Fonctionnalités
- Plateformes compatibles
- Système de recommandation
- Technologies utilisées
- API externes
- Architecture du projet
- Installation
- Documentation des endpoints
- Limites actuelles
- Roadmap

---

## 🎯 Présentation

Acheter un jeu vidéo peut nécessiter de consulter plusieurs boutiques afin de trouver le meilleur prix.

GameFinder répond à cette problématique en proposant une interface centralisée permettant de :

- Comparer les prix entre différentes boutiques.
- Découvrir des jeux adaptés à son budget.
- Identifier les jeux les mieux évalués.
- Trouver des promotions et des jeux gratuits.
- Explorer plusieurs plateformes depuis un seul site.

---

## ✨ Fonctionnalités

### 🔍 Recherche de jeux

- Recherche par titre.
- Recherche par licence.
- Filtrage par plateforme.
- Filtrage par boutique.
- Filtrage par prix maximum.
- Filtrage des promotions.
- Recherche de jeux gratuits.

### 💰 Budget Finder

Le Budget Finder permet de découvrir des jeux selon un budget prédéfini ou personnalisé.

| Budget | Catégorie |
|---|---|
| 0 $ | Jeux gratuits |
| 5 $ | Petit budget |
| 10 $ | Essentiel |
| 20 $ | Intermédiaire |
| 50 $ | Explorer |
| Tout | Sans limite personnalisée |

Un curseur permet également de personnaliser le budget maximum.

### 🛒 Comparateur de prix

- Regroupement des offres disponibles pour un même jeu.
- Identification de la meilleure offre récupérée.
- Affichage du prix initial.
- Affichage du prix actuel.
- Calcul du pourcentage de réduction.
- Comparaison des boutiques.
- Redirection vers les offres des vendeurs.

### ⭐ Évaluations des joueurs

Chaque jeu disposant de données d'évaluation affiche :

- Le pourcentage d'avis positifs.
- Le nombre total d'évaluations Steam.
- Un indicateur visuel de la qualité des évaluations.

| Pourcentage positif | Indicateur |
|---|---|
| 90 à 100 % | Excellent |
| 75 à 89 % | Bon |
| 50 à 74 % | Moyen |
| 0 à 49 % | Faible |

### 🎨 Personnalisation de l'interface

GameFinder propose cinq thèmes visuels :

- Dark Mode
- Light Mode
- Nintendo Mode
- PlayStation Mode
- Xbox Mode

Le thème sélectionné est sauvegardé dans le localStorage du navigateur afin de conserver les préférences de l'utilisateur.

### 📱 Responsive Design

L'interface s'adapte aux différentes tailles d'écran :

- Ordinateur
- Tablette
- Smartphone

---

## 🕹️ Plateformes compatibles

| Plateforme | Source des offres |
|---|---|
| PC | CheapShark |
| Nintendo Switch | NEXARDA |
| Nintendo Switch 2 | NEXARDA |
| PlayStation 5 | NEXARDA |
| Xbox Series X/S | NEXARDA |

---

## 🧠 Système de recommandation

GameFinder dispose d'un système de classement permettant de prendre en compte plusieurs critères.

### Classement intelligent

Le classement automatique repose sur les critères suivants :

1. Pertinence statistique des évaluations.
2. Prix décroissant dans la limite du budget.
3. Nombre total d'évaluations.
4. Ordre alphabétique en cas d'égalité.

### Moyenne bayésienne

Afin d'éviter de privilégier les jeux possédant un excellent pourcentage d'avis positifs mais très peu d'évaluations, GameFinder utilise une moyenne bayésienne.

```math
S = \frac{vR + mC}{v + m}
```

| Variable | Description |
|---|---|
| S | Score pondéré du jeu |
| R | Pourcentage d'avis positifs |
| v | Nombre d'évaluations |
| m | Poids de la note de référence |
| C | Note de référence |

La configuration actuelle utilise :

- Une note de référence de 75 %.
- Un poids de référence de 1 000 évaluations.

### Exemple

| Jeu | Avis positifs | Évaluations | Score pondéré |
|---|---:|---:|---:|
| Jeu A | 98 % | 100 000 | 97,77 |
| Jeu B | 95 % | 50 000 | 94,61 |
| Jeu C | 97 % | 5 000 | 93,33 |
| Jeu D | 100 % | 100 | 77,27 |
| Jeu E | 100 % | 2 | 75,05 |

Ce système réduit l'influence des notes reposant sur un faible nombre d'évaluations.

En l'absence de données d'évaluation, les jeux sont classés par prix décroissant.

### Autres modes de classement

- Classement intelligent.
- Proximité du budget.
- Pourcentage d'avis positifs.
- Popularité.
- Prix croissant.
- Prix décroissant.
- Meilleure réduction.
- Pertinence fournie par l'API.
- Ordre alphabétique.

---

## 🛠️ Technologies utilisées

### Frontend

- HTML5
- CSS3
- JavaScript ES6+
- Fetch API
- DOM API
- LocalStorage
- CSS Grid
- Flexbox

### Backend

- Node.js
- Express.js
- API HTTP
- JSON
- Programmation asynchrone

### Outils de développement

- Git
- GitHub
- Visual Studio Code
- npm

---

## 🌐 API externes

### CheapShark API

CheapShark permet de récupérer les offres de jeux vidéo sur PC.

Données exploitées :

- Titres des jeux.
- Images.
- Prix actuels.
- Prix initiaux.
- Pourcentages de réduction.
- Boutiques.
- Pourcentages d'avis positifs Steam.
- Nombre d'évaluations Steam.
- Liens vers les offres.

Documentation :

https://apidocs.cheapshark.com/

### NEXARDA API

NEXARDA permet d'étendre la recherche et la comparaison des prix aux consoles.

Données exploitées :

- Titres des jeux.
- Plateformes compatibles.
- Images.
- Éditions.
- Prix.
- Boutiques.
- Régions.
- Disponibilité des offres.

Site officiel :

https://www.nexarda.com/

---

## 🏗️ Architecture du projet

GameFinder repose sur une architecture client-serveur avec une séparation des responsabilités entre les routes, les contrôleurs et les services.

```text
                         UTILISATEUR
                              │
                              ▼
                      INTERFACE WEB
                   HTML / CSS / JavaScript
                              │
                       Requête HTTP
                              │
                              ▼
                       SERVEUR EXPRESS
                              │
                              ▼
                           ROUTES
                              │
                              ▼
                        CONTROLLERS
                              │
                              ▼
                          SERVICES
                         /        \
                        /          \
                       ▼            ▼
                  CheapShark      NEXARDA
                       \            /
                        \          /
                         ▼        ▼
                    Données normalisées
                              │
                              ▼
                       Réponse JSON
                              │
                              ▼
                  Classement et affichage
```

### Organisation des fichiers

```text
GameFinder/
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
├── test-nexarda.js
│
├── controllers/
│   └── games.controller.js
│
├── routes/
│   └── games.routes.js
│
├── services/
│   ├── cheapshark.service.js
│   ├── nexarda.service.js
│   └── platforms.service.js
│
└── public/
    ├── index.html
    │
    ├── css/
    │   ├── style.css
    │   ├── themes.css
    │   └── cards.css
    │
    └── js/
        ├── script.js
        ├── ranking.js
        └── themes.js
```

### Responsabilités des fichiers

| Fichier | Responsabilité |
|---|---|
| server.js | Configuration et démarrage du serveur |
| games.routes.js | Définition des endpoints |
| games.controller.js | Traitement des requêtes HTTP |
| cheapshark.service.js | Communication avec CheapShark |
| nexarda.service.js | Communication avec NEXARDA |
| platforms.service.js | Normalisation et regroupement des offres |
| script.js | Logique principale de l'interface |
| ranking.js | Algorithmes de classement |
| themes.js | Gestion des thèmes visuels |
| style.css | Styles généraux |
| themes.css | Styles des différents thèmes |
| cards.css | Alignement des cartes |
| index.html | Structure de l'interface |

---

## ⚙️ Installation

### Prérequis

- Node.js 20 ou supérieur
- npm
- Git

### 1. Cloner le dépôt

```bash
git clone URL_DU_DEPOT
```

### 2. Accéder au projet

Placez-vous dans le dossier contenant le fichier package.json.

```bash
cd GameFinder
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Démarrer le serveur

```bash
node server.js
```

### 5. Accéder à l'application

Ouvrez votre navigateur à l'adresse suivante :

```text
http://localhost:3300
```

---

## 📡 Documentation des endpoints

### Récupérer les offres

```http
GET /api/games/deals
```

### Paramètres disponibles

| Paramètre | Description |
|---|---|
| platform | Plateforme sélectionnée |
| title | Nom du jeu recherché |
| franchise | Licence recherchée |
| upperPrice | Prix maximum |
| lowerPrice | Prix minimum |
| storeID | Identifiant d'une boutique PC |
| storeName | Nom d'une boutique console |
| onSale | Offres en promotion uniquement |
| sortBy | Critère de classement demandé |
| desc | Ordre décroissant |
| pageSize | Nombre d'offres demandées pour le PC |
| pageNumber | Numéro de page pour le PC |

### Exemples de requêtes

Récupérer les jeux PC à moins de 20 dollars :

```http
GET /api/games/deals?platform=pc&upperPrice=20
```

Rechercher les jeux Mario sur Nintendo :

```http
GET /api/games/deals?platform=nintendo&title=Mario
```

Récupérer les jeux PS5 à moins de 50 dollars :

```http
GET /api/games/deals?platform=ps5&upperPrice=50
```

Récupérer les jeux gratuits sur PC :

```http
GET /api/games/deals?platform=pc&upperPrice=0&lowerPrice=0
```

### Autres endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| GET | /api/games | Récupérer les offres |
| GET | /api/games/deals | Rechercher et filtrer les offres |
| GET | /api/games/search | Rechercher des jeux PC |
| GET | /api/games/stores | Récupérer les boutiques PC |
| GET | /api/games/:id | Récupérer les informations d'un jeu PC |

---

## 🚧 Limites actuelles

- Les prix sont actuellement exprimés en dollars américains.
- Les catalogues dépendent des données fournies par les API externes.
- Les évaluations Steam concernent principalement les jeux PC.
- Les évaluations des jeux Nintendo, PlayStation et Xbox ne sont pas encore intégrées.
- Le classement repose uniquement sur les offres récupérées.
- Le catalogue des consoles n'est pas exhaustif.
- Certaines offres peuvent être indisponibles selon la région.
- Les prix peuvent évoluer entre leur affichage et la consultation de la boutique.
- Le nombre d'évaluations ne constitue pas un décompte vérifié d'utilisateurs distincts.

---

## 🚀 Roadmap

### Fonctionnalités principales

- [x] Recherche de jeux vidéo
- [x] Intégration de CheapShark
- [x] Intégration de NEXARDA
- [x] Support multiplateforme
- [x] Comparateur de prix
- [x] Budget Finder
- [x] Recherche de jeux gratuits
- [x] Recherche par licence
- [x] Filtrage par boutique
- [x] Classement par positivité
- [x] Classement par popularité
- [x] Classement bayésien
- [x] Affichage du nombre d'évaluations
- [x] Personnalisation des thèmes
- [x] Responsive Design

### Améliorations futures

- [ ] Support des prix en euros
- [ ] Pagination des résultats
- [ ] Évaluations multiplateformes
- [ ] Filtres par genre de jeu
- [ ] Filtres par nombre minimum d'évaluations
- [ ] Historique des prix
- [ ] Alertes de baisse de prix
- [ ] Liste de jeux favoris
- [ ] Comptes utilisateurs
- [ ] Base de données
- [ ] Recommandations personnalisées
- [ ] Tests unitaires et tests d'intégration
- [ ] Déploiement en production

---

## ⚠️ Disclaimer

GameFinder est un projet étudiant indépendant.

GameFinder n'est pas affilié à Nintendo, Sony, Microsoft, Valve ou aux boutiques référencées.

Les marques, logos et images des jeux appartiennent à leurs propriétaires respectifs.

Les achats sont effectués directement auprès des boutiques externes. GameFinder ne traite aucune transaction financière.

---

## 👨‍💻 Auteur

Projet développé dans le cadre d'un apprentissage du développement web full stack.

**GameFinder — 2026**

---



### Play more. Spend less.

Discover. Compare. Play.

</div>