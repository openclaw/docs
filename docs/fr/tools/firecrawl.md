---
read_when:
    - Vous souhaitez une extraction web reposant sur Firecrawl
    - Vous souhaitez utiliser Firecrawl Search sans clé (gratuit) ou web_fetch sans clé
    - Vous avez besoin d’une clé API Firecrawl pour effectuer des recherches ou bénéficier de limites plus élevées.
    - Vous souhaitez utiliser Firecrawl comme fournisseur de web_search
    - Vous souhaitez une extraction avec contournement des protections anti-bot pour `web_fetch`
summary: Recherche et extraction Firecrawl, avec repli sur web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T13:52:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw peut utiliser **Firecrawl** de trois façons :

- comme fournisseur de `web_search`
- comme outils de plugin explicites : `firecrawl_search` et `firecrawl_scrape`
- comme extracteur de secours pour `web_fetch`

Il s’agit d’un service hébergé d’extraction et de recherche qui prend en charge le contournement des protections antibot et la mise en cache, ce qui est utile pour les sites qui utilisent beaucoup JavaScript ou les pages qui bloquent les requêtes HTTP ordinaires.

## Installer le plugin

Installez le plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Accès sans clé et clés API

Firecrawl enregistre deux fournisseurs de `web_search` :

- **Recherche Firecrawl** (`firecrawl`) — utilise l’API `/v2/search` hébergée avec votre
  clé ; détecté automatiquement lorsqu’une clé est présente.
- **Recherche Firecrawl (gratuite)** (`firecrawl-free`) — utilise l’offre de démarrage hébergée
  sans clé ; aucune clé API n’est requise. Cette option est disponible **uniquement sur activation explicite** et n’est jamais sélectionnée automatiquement, car
  sa sélection envoie vos requêtes de recherche à l’offre gratuite de Firecrawl.

La solution de secours Firecrawl `web_fetch` sélectionnée explicitement fonctionne également sans clé. Les
outils explicites `firecrawl_search` et `firecrawl_scrape` nécessitent une clé API. Ajoutez
`FIRECRAWL_API_KEY` à l’environnement du Gateway ou configurez-la pour bénéficier de limites plus élevées.

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

- Le choix de Firecrawl lors de l’intégration initiale ou dans `openclaw configure --section web` active automatiquement le plugin Firecrawl installé.
- Choisissez **Recherche Firecrawl (gratuite)** lors de l’intégration initiale (ou définissez `provider: "firecrawl-free"`) pour fonctionner sans clé API. Le fournisseur **Recherche Firecrawl** avec clé envoie `plugins.entries.firecrawl.config.webSearch.apiKey` ou `FIRECRAWL_API_KEY`.
- `web_search` avec Firecrawl prend en charge `query` et `count`.
- Pour les contrôles propres à Firecrawl, tels que `sources`, `categories` ou l’extraction des résultats, utilisez `firecrawl_search`.
- `baseUrl` utilise par défaut Firecrawl hébergé à l’adresse `https://api.firecrawl.dev`. Les substitutions auto-hébergées ne sont autorisées que pour les points de terminaison privés/internes ; HTTP n’est accepté que pour ces cibles privées.
- `FIRECRAWL_BASE_URL` est la variable d’environnement de secours partagée pour les URL de base de recherche et d’extraction Firecrawl.
- Les requêtes de recherche Firecrawl ont par défaut un délai d’expiration de 30 secondes ; le paramètre `timeoutSeconds` de `firecrawl_search` le remplace pour chaque appel.

## Configurer la solution de secours Firecrawl pour web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
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

Remarques :

- La solution de secours Firecrawl `web_fetch` sélectionnée explicitement fonctionne sans clé API. Lorsqu’elle est configurée, OpenClaw envoie `plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY` pour bénéficier de limites plus élevées.
- Le choix de Firecrawl lors de l’intégration initiale ou dans `openclaw configure --section web` active le plugin et sélectionne Firecrawl pour `web_fetch`, sauf si un autre fournisseur de récupération est déjà configuré.
- `firecrawl_scrape` nécessite une clé API.
- `maxAgeMs` contrôle l’ancienneté maximale des résultats mis en cache (ms). La valeur par défaut est de 172 800 000 ms (2 jours).
- `onlyMainContent` utilise par défaut `true` ; `timeoutSeconds` utilise par défaut 60.
- L’ancienne configuration `tools.web.fetch.firecrawl.*` et `tools.web.search.firecrawl.*` est automatiquement migrée par `openclaw doctor --fix`.
- Les substitutions des URL d’extraction/de base Firecrawl suivent la même règle d’hébergement/de confidentialité que la recherche : le trafic hébergé public utilise `https://api.firecrawl.dev` ; les substitutions auto-hébergées doivent se résoudre vers des points de terminaison privés/internes.
- `firecrawl_scrape` rejette les URL cibles manifestement privées, de bouclage, de métadonnées et non HTTP(S) avant de les transmettre à Firecrawl, conformément au contrat de sécurité des cibles de `web_fetch` pour les appels d’extraction Firecrawl explicites.

`firecrawl_scrape` réutilise les mêmes paramètres `plugins.entries.firecrawl.config.webFetch.*` et variables d’environnement, y compris la clé API requise.

### Firecrawl auto-hébergé

Définissez `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL` lorsque vous exécutez Firecrawl vous-même. OpenClaw accepte `http://` uniquement pour les cibles de bouclage, de réseau privé, `.local`, `.internal` ou `.localhost`. Les hôtes publics personnalisés sont rejetés afin d’éviter que les clés API Firecrawl ne soient envoyées accidentellement à des points de terminaison arbitraires.

## Outils du plugin Firecrawl

### `firecrawl_search`

Utilisez cet outil lorsque vous souhaitez employer les contrôles de recherche propres à Firecrawl plutôt que le contrôle générique `web_search`. Nécessite une clé API.

Paramètres :

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (noms d’hôte uniquement ; mutuellement exclusifs)
- `tbs` (filtre temporel, par exemple `qdr:d`, `qdr:w`, `sbd:1`)
- `location` et `country` (ciblage géographique)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Utilisez cet outil pour les pages qui utilisent beaucoup JavaScript ou sont protégées contre les bots, lorsque la récupération `web_fetch` ordinaire est insuffisante.

Paramètres :

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Mode furtif / contournement des protections antibot

`firecrawl_scrape` et la solution de secours Firecrawl `web_fetch` utilisent par défaut `proxy: "auto"` avec `storeInCache: true`, sauf si l’appelant remplace ces paramètres. `firecrawl_search` et le fournisseur Firecrawl `web_search` ne disposent pas de contrôles `proxy`/`storeInCache` ; le mode proxy furtif s’applique uniquement aux requêtes d’extraction/de récupération.

Le mode `proxy` de Firecrawl contrôle le contournement des protections antibot (`basic`, `stealth` ou `auto`). `auto` réessaie avec des proxys furtifs si une tentative de base échoue, ce qui peut consommer davantage de crédits qu’une extraction limitée au mode de base.

## Comment `web_fetch` utilise Firecrawl

Ordre d’extraction de `web_fetch` :

1. Readability (local)
2. Fournisseur de récupération configuré, tel que Firecrawl (lorsqu’il est sélectionné ou automatiquement détecté à partir des identifiants configurés)
3. Nettoyage HTML de base (dernière solution de secours)

Le paramètre de sélection est `tools.web.fetch.provider`. Si vous l’omettez, OpenClaw détecte automatiquement le premier fournisseur de récupération Web prêt à l’emploi à partir des identifiants disponibles. Le plugin Firecrawl officiel fournit cette solution de secours.

## Voir aussi

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Récupération Web](/fr/tools/web-fetch) -- outil web_fetch avec solution de secours Firecrawl
- [Tavily](/fr/tools/tavily) -- outils de recherche et d’extraction
