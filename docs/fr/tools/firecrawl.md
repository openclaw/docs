---
read_when:
    - Vous souhaitez une extraction web basée sur Firecrawl
    - Vous avez besoin d’une clé API Firecrawl
    - Vous souhaitez utiliser Firecrawl comme fournisseur web_search
    - Vous voulez une extraction anti-bot pour web_fetch
summary: Recherche, extraction et solution de repli web_fetch avec Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T07:21:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw peut utiliser **Firecrawl** de trois façons :

- comme fournisseur `web_search`
- comme outils de Plugin explicites : `firecrawl_search` et `firecrawl_scrape`
- comme extracteur de secours pour `web_fetch`

C’est un service hébergé d’extraction/de recherche qui prend en charge le contournement des bots et la mise en cache,
ce qui aide avec les sites fortement basés sur JS ou les pages qui bloquent les récupérations HTTP simples.

## Obtenir une clé API

1. Créez un compte Firecrawl et générez une clé API.
2. Stockez-la dans la configuration ou définissez `FIRECRAWL_API_KEY` dans l’environnement du Gateway.

## Configurer la recherche Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Remarques :

- Choisir Firecrawl lors de l’onboarding ou avec `openclaw configure --section web` active automatiquement le Plugin Firecrawl inclus.
- `web_search` avec Firecrawl prend en charge `query` et `count`.
- Pour les contrôles propres à Firecrawl comme `sources`, `categories` ou le scraping des résultats, utilisez `firecrawl_search`.
- `baseUrl` pointe par défaut vers Firecrawl hébergé à l’adresse `https://api.firecrawl.dev`. Les remplacements auto-hébergés ne sont autorisés que pour les endpoints privés/internes ; HTTP n’est accepté que pour ces cibles privées.
- `FIRECRAWL_BASE_URL` est le repli d’environnement partagé pour les URL de base de recherche et de scraping Firecrawl.

## Configurer le scraping Firecrawl + le repli web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Remarques :

- Les tentatives de repli Firecrawl ne s’exécutent que lorsqu’une clé API est disponible (`plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY`).
- `maxAgeMs` contrôle l’ancienneté maximale des résultats mis en cache (ms). La valeur par défaut est de 2 jours.
- L’ancienne configuration `tools.web.fetch.firecrawl.*` est migrée automatiquement par `openclaw doctor --fix`.
- Les remplacements d’URL de base/scraping Firecrawl suivent la même règle hébergé/privé que la recherche : le trafic public hébergé utilise `https://api.firecrawl.dev` ; les remplacements auto-hébergés doivent résoudre vers des endpoints privés/internes.
- `firecrawl_scrape` rejette les URL cibles manifestement privées, local loopback, de métadonnées et non HTTP(S) avant de les transmettre à Firecrawl, conformément au contrat de sécurité des cibles de `web_fetch` pour les appels explicites de scraping Firecrawl.

`firecrawl_scrape` réutilise les mêmes paramètres `plugins.entries.firecrawl.config.webFetch.*` et variables d’environnement.

### Firecrawl auto-hébergé

Définissez `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL`
lorsque vous exécutez Firecrawl vous-même. OpenClaw accepte `http://` uniquement pour les cibles local loopback,
réseau privé, `.local`, `.internal` ou `.localhost`. Les hôtes publics personnalisés
sont rejetés afin que les clés API Firecrawl ne soient pas envoyées par
accident à des endpoints arbitraires.

## Outils du Plugin Firecrawl

### `firecrawl_search`

Utilisez ceci lorsque vous voulez des contrôles de recherche propres à Firecrawl au lieu de `web_search` générique.

Paramètres principaux :

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Utilisez ceci pour les pages fortement basées sur JS ou protégées contre les bots, où `web_fetch` simple est faible.

Paramètres principaux :

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Furtivité / contournement des bots

Firecrawl expose un paramètre **mode proxy** pour le contournement des bots (`basic`, `stealth` ou `auto`).
OpenClaw utilise toujours `proxy: "auto"` plus `storeInCache: true` pour les requêtes Firecrawl.
Si le proxy est omis, Firecrawl utilise par défaut `auto`. `auto` réessaie avec des proxys furtifs si une tentative basique échoue, ce qui peut consommer plus de crédits
qu’un scraping limité à basic.

## Comment `web_fetch` utilise Firecrawl

Ordre d’extraction de `web_fetch` :

1. Readability (local)
2. Firecrawl (si sélectionné ou auto-détecté comme repli actif de web-fetch)
3. Nettoyage HTML basique (dernier repli)

Le réglage de sélection est `tools.web.fetch.provider`. Si vous l’omettez, OpenClaw
détecte automatiquement le premier fournisseur web-fetch prêt à partir des identifiants disponibles.
Aujourd’hui, le fournisseur inclus est Firecrawl.

## Connexe

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [Web Fetch](/fr/tools/web-fetch) -- outil web_fetch avec repli Firecrawl
- [Tavily](/fr/tools/tavily) -- outils de recherche + extraction
