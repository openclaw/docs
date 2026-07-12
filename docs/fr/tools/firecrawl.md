---
read_when:
    - Vous souhaitez une extraction web reposant sur Firecrawl
    - Vous souhaitez utiliser `web_fetch` de Firecrawl sans clé.
    - Vous avez besoin d’une clé API Firecrawl pour effectuer des recherches ou bénéficier de limites plus élevées
    - Vous souhaitez utiliser Firecrawl comme fournisseur de `web_search`
    - Vous souhaitez une extraction avec contournement des protections anti-bot pour `web_fetch`
summary: Recherche et extraction Firecrawl, avec solution de repli pour web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T15:57:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw peut utiliser **Firecrawl** de trois manières :

- comme fournisseur de `web_search`
- comme outils explicites du Plugin : `firecrawl_search` et `firecrawl_scrape`
- comme extracteur de secours pour `web_fetch`

Il s’agit d’un service hébergé d’extraction et de recherche qui prend en charge le contournement des protections antibot et la mise en cache, ce qui est utile pour les sites utilisant beaucoup JavaScript ou les pages qui bloquent les requêtes HTTP simples.

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch sans clé et clés API

La solution de secours hébergée Firecrawl pour `web_fetch`, lorsqu’elle est explicitement sélectionnée, permet un accès initial sans clé API. Ajoutez `FIRECRAWL_API_KEY` à l’environnement du Gateway ou configurez-la lorsque vous avez besoin de limites plus élevées. Le `web_search` de Firecrawl et `firecrawl_scrape` nécessitent une clé API.

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

- Choisir Firecrawl lors de l’intégration initiale ou avec `openclaw configure --section web` active automatiquement le Plugin Firecrawl installé.
- `web_search` avec Firecrawl prend en charge `query` et `count`.
- Pour les contrôles propres à Firecrawl comme `sources`, `categories` ou l’extraction des résultats, utilisez `firecrawl_search`.
- Par défaut, `baseUrl` utilise le service Firecrawl hébergé à l’adresse `https://api.firecrawl.dev`. Les remplacements autohébergés ne sont autorisés que pour les points de terminaison privés ou internes ; HTTP n’est accepté que pour ces cibles privées.
- `FIRECRAWL_BASE_URL` est la variable d’environnement de secours commune pour les URL de base de recherche et d’extraction Firecrawl.
- Les requêtes de recherche Firecrawl ont par défaut un délai d’expiration de 30 secondes ; le paramètre `timeoutSeconds` de `firecrawl_search` le remplace pour chaque appel.

## Configurer la solution de secours Firecrawl pour web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // la sélection explicite active la solution de secours sans clé
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

- La solution de secours Firecrawl explicitement sélectionnée pour `web_fetch` fonctionne sans clé API. Lorsqu’elle est configurée, OpenClaw envoie `plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY` afin de bénéficier de limites plus élevées.
- Choisir Firecrawl lors de l’intégration initiale ou avec `openclaw configure --section web` active le Plugin et sélectionne Firecrawl pour `web_fetch`, sauf si un autre fournisseur de récupération est déjà configuré.
- `firecrawl_scrape` nécessite une clé API.
- `maxAgeMs` détermine l’ancienneté maximale des résultats mis en cache (ms). La valeur par défaut est de 172 800 000 ms (2 jours).
- `onlyMainContent` vaut `true` par défaut ; `timeoutSeconds` vaut 60 par défaut.
- L’ancienne configuration `tools.web.fetch.firecrawl.*` et `tools.web.search.firecrawl.*` est automatiquement migrée par `openclaw doctor --fix`.
- Les remplacements des URL de base et d’extraction Firecrawl suivent la même règle d’hébergement et de confidentialité que la recherche : le trafic public hébergé utilise `https://api.firecrawl.dev` ; les remplacements autohébergés doivent pointer vers des points de terminaison privés ou internes.
- `firecrawl_scrape` rejette les URL cibles manifestement privées, de bouclage, de métadonnées et non HTTP(S) avant de les transmettre à Firecrawl, conformément au contrat de sécurité des cibles de `web_fetch` pour les appels explicites d’extraction Firecrawl.

`firecrawl_scrape` réutilise les mêmes paramètres `plugins.entries.firecrawl.config.webFetch.*` et variables d’environnement, notamment sa clé API obligatoire.

### Firecrawl autohébergé

Définissez `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL` lorsque vous exécutez vous-même Firecrawl. OpenClaw n’accepte `http://` que pour les cibles de bouclage, de réseau privé, `.local`, `.internal` ou `.localhost`. Les hôtes publics personnalisés sont rejetés afin d’éviter que les clés API Firecrawl soient envoyées accidentellement à des points de terminaison arbitraires.

## Outils du Plugin Firecrawl

### `firecrawl_search`

Utilisez cet outil lorsque vous souhaitez disposer des contrôles de recherche propres à Firecrawl plutôt que de ceux du générique `web_search`.

Paramètres :

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Utilisez cet outil pour les pages utilisant beaucoup JavaScript ou protégées contre les robots, pour lesquelles le simple `web_fetch` est insuffisant.

Paramètres :

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Furtivité et contournement des protections antibot

`firecrawl_scrape` et la solution de secours Firecrawl pour `web_fetch` utilisent par défaut `proxy: "auto"` avec `storeInCache: true`, sauf si l’appelant remplace ces paramètres. `firecrawl_search` et le fournisseur Firecrawl de `web_search` ne proposent aucun contrôle `proxy`/`storeInCache` ; le mode de proxy furtif ne s’applique qu’aux requêtes d’extraction et de récupération.

Le mode `proxy` de Firecrawl contrôle le contournement des protections antibot (`basic`, `stealth` ou `auto`). `auto` effectue une nouvelle tentative avec des proxys furtifs si une tentative de base échoue, ce qui peut consommer davantage de crédits qu’une extraction limitée au mode de base.

## Utilisation de Firecrawl par `web_fetch`

Ordre d’extraction de `web_fetch` :

1. Readability (local)
2. Fournisseur de récupération configuré, tel que Firecrawl (lorsqu’il est sélectionné ou détecté automatiquement à partir des identifiants configurés)
3. Nettoyage HTML de base (ultime solution de secours)

Le paramètre de sélection est `tools.web.fetch.provider`. Si vous l’omettez, OpenClaw détecte automatiquement le premier fournisseur de récupération Web opérationnel à partir des identifiants disponibles. Le Plugin Firecrawl officiel fournit cette solution de secours.

## Pages connexes

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Récupération Web](/fr/tools/web-fetch) -- outil web_fetch avec solution de secours Firecrawl
- [Tavily](/fr/tools/tavily) -- outils de recherche et d’extraction
