---
read_when:
    - Vous voulez une extraction web basée sur Firecrawl
    - Vous voulez web_fetch Firecrawl sans clé
    - Vous avez besoin d’une clé API Firecrawl pour la recherche ou des limites plus élevées
    - Vous voulez utiliser Firecrawl comme fournisseur web_search
    - Vous voulez une extraction anti-bot pour web_fetch
summary: Recherche, extraction et solution de repli web_fetch Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:18:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw peut utiliser **Firecrawl** de trois façons :

- comme fournisseur `web_search`
- comme outils de Plugin explicites : `firecrawl_search` et `firecrawl_scrape`
- comme extracteur de secours pour `web_fetch`

Il s’agit d’un service hébergé d’extraction et de recherche qui prend en charge le contournement des bots et la mise en cache,
ce qui aide avec les sites riches en JS ou les pages qui bloquent les récupérations HTTP simples.

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch sans clé et clés d’API

Le secours `web_fetch` Firecrawl hébergé explicitement sélectionné prend en charge un accès de démarrage
sans clé d’API. Ajoutez `FIRECRAWL_API_KEY` dans l’environnement du gateway
ou configurez-la lorsque vous avez besoin de limites plus élevées. Firecrawl `web_search` et
`firecrawl_scrape` nécessitent une clé d’API.

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

Notes :

- Choisir Firecrawl lors de l’intégration ou avec `openclaw configure --section web` active automatiquement le Plugin Firecrawl installé.
- `web_search` avec Firecrawl prend en charge `query` et `count`.
- Pour les contrôles propres à Firecrawl comme `sources`, `categories` ou l’extraction des résultats, utilisez `firecrawl_search`.
- `baseUrl` utilise par défaut Firecrawl hébergé à l’adresse `https://api.firecrawl.dev`. Les substitutions auto-hébergées ne sont autorisées que pour les points de terminaison privés/internes ; HTTP n’est accepté que pour ces cibles privées.
- `FIRECRAWL_BASE_URL` est le secours d’environnement partagé pour les URL de base de recherche et d’extraction Firecrawl.

## Configurer le secours web_fetch Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // la sélection explicite active le secours sans clé
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

Notes :

- Le secours `web_fetch` Firecrawl explicitement sélectionné fonctionne sans clé d’API. Lorsqu’il est configuré, OpenClaw envoie `plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY` pour des limites plus élevées.
- Choisir Firecrawl pendant l’intégration ou avec `openclaw configure --section web` active le Plugin et sélectionne Firecrawl pour `web_fetch`, sauf si un autre fournisseur de récupération est déjà configuré.
- `firecrawl_scrape` nécessite une clé d’API.
- `maxAgeMs` contrôle l’ancienneté autorisée des résultats mis en cache (ms). La valeur par défaut est de 2 jours.
- La configuration héritée `tools.web.fetch.firecrawl.*` est automatiquement migrée par `openclaw doctor --fix`.
- Les substitutions d’URL de base/d’extraction Firecrawl suivent la même règle hébergé/privé que la recherche : le trafic hébergé public utilise `https://api.firecrawl.dev` ; les substitutions auto-hébergées doivent résoudre vers des points de terminaison privés/internes.
- `firecrawl_scrape` rejette les URL cibles manifestement privées, loopback, de métadonnées et non HTTP(S) avant de les transmettre à Firecrawl, conformément au contrat de sûreté des cibles de `web_fetch` pour les appels explicites d’extraction Firecrawl.

`firecrawl_scrape` réutilise les mêmes paramètres et variables d’environnement `plugins.entries.firecrawl.config.webFetch.*`, y compris sa clé d’API requise.

### Firecrawl auto-hébergé

Définissez `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL`
lorsque vous exécutez Firecrawl vous-même. OpenClaw accepte `http://` uniquement pour les cibles loopback,
de réseau privé, `.local`, `.internal` ou `.localhost`. Les hôtes personnalisés publics
sont rejetés afin que les clés d’API Firecrawl ne soient pas envoyées par
accident à des points de terminaison arbitraires.

## Outils du Plugin Firecrawl

### `firecrawl_search`

Utilisez ceci lorsque vous voulez des contrôles de recherche propres à Firecrawl plutôt que le `web_search` générique.

Paramètres principaux :

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Utilisez ceci pour les pages riches en JS ou protégées contre les bots lorsque `web_fetch` simple est insuffisant.

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
OpenClaw utilise toujours `proxy: "auto"` ainsi que `storeInCache: true` pour les requêtes Firecrawl.
Si proxy est omis, Firecrawl utilise par défaut `auto`. `auto` réessaie avec des proxys furtifs si une tentative basique échoue, ce qui peut utiliser plus de crédits
qu’une extraction uniquement basique.

## Comment `web_fetch` utilise Firecrawl

Ordre d’extraction de `web_fetch` :

1. Readability (local)
2. Firecrawl (lorsqu’il est sélectionné, ou détecté automatiquement à partir des identifiants configurés)
3. Nettoyage HTML basique (dernier secours)

Le réglage de sélection est `tools.web.fetch.provider`. Si vous l’omettez, OpenClaw
détecte automatiquement le premier fournisseur web-fetch prêt à partir des identifiants disponibles.
Le Plugin Firecrawl officiel fournit ce secours.

## Connexe

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Web Fetch](/fr/tools/web-fetch) -- outil web_fetch avec secours Firecrawl
- [Tavily](/fr/tools/tavily) -- outils de recherche + extraction
