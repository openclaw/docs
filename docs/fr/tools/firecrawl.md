---
read_when:
    - Vous souhaitez une extraction web adossée à Firecrawl
    - You need a Firecrawl API key
    - Vous souhaitez utiliser Firecrawl comme fournisseur `web_search`
    - Vous souhaitez une extraction anti-bot pour `web_fetch`
summary: Recherche Firecrawl, extraction et repli `web_fetch`
title: Firecrawl
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T07:36:42Z"
  model: gpt-5.4
  provider: openai
  source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
  source_path: tools/firecrawl.md
  workflow: 15
---

OpenClaw peut utiliser **Firecrawl** de trois façons :

- comme fournisseur `web_search`
- comme outils de plugin explicites : `firecrawl_search` et `firecrawl_scrape`
- comme extracteur de repli pour `web_fetch`

Il s’agit d’un service hébergé d’extraction/recherche qui prend en charge le contournement des bots et la mise en cache,
ce qui aide pour les sites très dépendants de JavaScript ou les pages qui bloquent les requêtes HTTP simples.

## Obtenir une clé API

1. Créez un compte Firecrawl et générez une clé API.
2. Stockez-la dans la configuration ou définissez `FIRECRAWL_API_KEY` dans l’environnement du gateway.

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

- Choisir Firecrawl dans l’onboarding ou `openclaw configure --section web` active automatiquement le plugin Firecrawl intégré.
- `web_search` avec Firecrawl prend en charge `query` et `count`.
- Pour les contrôles spécifiques à Firecrawl comme `sources`, `categories` ou l’extraction des résultats, utilisez `firecrawl_search`.
- Les remplacements de `baseUrl` doivent rester sur `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` est le repli env partagé pour les URL de base de recherche et d’extraction Firecrawl.

## Configurer l’extraction Firecrawl + le repli `web_fetch`

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
- `maxAgeMs` contrôle l’ancienneté maximale autorisée des résultats mis en cache (ms). La valeur par défaut est 2 jours.
- L’ancienne configuration `tools.web.fetch.firecrawl.*` est migrée automatiquement par `openclaw doctor --fix`.
- Les remplacements d’URL de base pour l’extraction Firecrawl sont limités à `https://api.firecrawl.dev`.

`firecrawl_scrape` réutilise les mêmes paramètres `plugins.entries.firecrawl.config.webFetch.*` et variables d’environnement.

## Outils de plugin Firecrawl

### `firecrawl_search`

Utilisez ceci lorsque vous voulez des contrôles de recherche spécifiques à Firecrawl plutôt que `web_search` générique.

Paramètres principaux :

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Utilisez ceci pour les pages fortement dépendantes de JS ou protégées contre les bots, lorsque `web_fetch` simple est insuffisant.

Paramètres principaux :

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / contournement des bots

Firecrawl expose un paramètre de **mode proxy** pour le contournement des bots (`basic`, `stealth` ou `auto`).
OpenClaw utilise toujours `proxy: "auto"` plus `storeInCache: true` pour les requêtes Firecrawl.
Si `proxy` est omis, Firecrawl utilise par défaut `auto`. `auto` réessaie avec des proxys stealth si une tentative basique échoue, ce qui peut consommer plus de crédits
qu’une extraction basique uniquement.

## Comment `web_fetch` utilise Firecrawl

Ordre d’extraction de `web_fetch` :

1. Readability (local)
2. Firecrawl (si sélectionné ou auto-détecté comme repli actif de web-fetch)
3. Nettoyage HTML basique (repli final)

Le paramètre de sélection est `tools.web.fetch.provider`. Si vous l’omettez, OpenClaw
détecte automatiquement le premier fournisseur web-fetch prêt à partir des identifiants disponibles.
Aujourd’hui, le fournisseur intégré est Firecrawl.

## Associé

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Web Fetch](/fr/tools/web-fetch) -- outil `web_fetch` avec repli Firecrawl
- [Tavily](/fr/tools/tavily) -- outils de recherche + extraction
