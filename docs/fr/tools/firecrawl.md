---
read_when:
    - Vous souhaitez une extraction web propulsée par Firecrawl
    - Vous souhaitez utiliser `web_fetch` de Firecrawl sans clé
    - Vous avez besoin d’une clé API Firecrawl pour effectuer des recherches ou bénéficier de limites plus élevées
    - Vous souhaitez utiliser Firecrawl comme fournisseur de web_search
    - Vous souhaitez contourner les protections anti-bot pour `web_fetch`
summary: Recherche et extraction Firecrawl, avec repli sur web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T03:12:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw peut utiliser **Firecrawl** de trois manières :

- comme fournisseur de `web_search`
- comme outils de Plugin explicites : `firecrawl_search` et `firecrawl_scrape`
- comme extracteur de secours pour `web_fetch`

Il s’agit d’un service hébergé d’extraction et de recherche qui prend en charge le contournement des robots et la mise en cache, ce qui est utile pour les sites utilisant beaucoup de JavaScript ou les pages qui bloquent les requêtes HTTP simples.

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch sans clé et clés d’API

Le mécanisme de secours hébergé Firecrawl explicitement sélectionné pour `web_fetch` permet un accès initial sans clé d’API. Ajoutez `FIRECRAWL_API_KEY` à l’environnement du Gateway ou configurez-la lorsque vous avez besoin de limites plus élevées. Les fonctions Firecrawl `web_search` et `firecrawl_scrape` nécessitent une clé d’API.

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

- Choisir Firecrawl lors de l’intégration ou dans `openclaw configure --section web` active automatiquement le Plugin Firecrawl installé.
- Avec Firecrawl, `web_search` prend en charge `query` et `count`.
- Pour utiliser des options propres à Firecrawl comme `sources`, `categories` ou l’extraction des résultats, utilisez `firecrawl_search`.
- Par défaut, `baseUrl` pointe vers le service Firecrawl hébergé à l’adresse `https://api.firecrawl.dev`. Les substitutions auto-hébergées ne sont autorisées que pour les points de terminaison privés ou internes ; HTTP n’est accepté que pour ces cibles privées.
- `FIRECRAWL_BASE_URL` est la variable d’environnement de secours commune aux URL de base de recherche et d’extraction de Firecrawl.
- Les requêtes de recherche Firecrawl ont un délai d’expiration par défaut de 30 secondes ; le paramètre `timeoutSeconds` de `firecrawl_search` le remplace pour chaque appel.

## Configurer le mécanisme de secours Firecrawl pour web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // la sélection explicite active le mécanisme de secours sans clé
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

- Le mécanisme de secours Firecrawl explicitement sélectionné pour `web_fetch` fonctionne sans clé d’API. Lorsqu’elle est configurée, OpenClaw envoie `plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY` afin de bénéficier de limites plus élevées.
- Choisir Firecrawl pendant l’intégration ou dans `openclaw configure --section web` active le Plugin et sélectionne Firecrawl pour `web_fetch`, sauf si un autre fournisseur de récupération est déjà configuré.
- `firecrawl_scrape` nécessite une clé d’API.
- `maxAgeMs` détermine l’ancienneté maximale des résultats mis en cache (en ms). La valeur par défaut est de 172 800 000 ms (2 jours).
- `onlyMainContent` vaut `true` par défaut ; `timeoutSeconds` vaut 60 par défaut.
- Les anciennes configurations `tools.web.fetch.firecrawl.*` et `tools.web.search.firecrawl.*` sont migrées automatiquement par `openclaw doctor --fix`.
- Les substitutions de l’URL d’extraction ou de base de Firecrawl suivent la même règle relative aux services hébergés et privés que la recherche : le trafic public hébergé utilise `https://api.firecrawl.dev` ; les substitutions auto-hébergées doivent mener à des points de terminaison privés ou internes.
- `firecrawl_scrape` rejette les URL cibles manifestement privées, local loopback, de métadonnées ou utilisant un protocole autre que HTTP(S) avant de les transmettre à Firecrawl, conformément au contrat de sécurité des cibles de `web_fetch` pour les appels explicites à l’extraction Firecrawl.

`firecrawl_scrape` réutilise les mêmes paramètres `plugins.entries.firecrawl.config.webFetch.*` et variables d’environnement, y compris la clé d’API requise.

### Firecrawl auto-hébergé

Définissez `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` ou `FIRECRAWL_BASE_URL` lorsque vous exécutez vous-même Firecrawl. OpenClaw n’accepte `http://` que pour les cibles local loopback, de réseau privé, `.local`, `.internal` ou `.localhost`. Les hôtes publics personnalisés sont rejetés afin d’éviter que les clés d’API Firecrawl ne soient accidentellement envoyées à des points de terminaison arbitraires.

## Outils du Plugin Firecrawl

### `firecrawl_search`

Utilisez cet outil lorsque vous souhaitez disposer des options de recherche propres à Firecrawl plutôt que de l’outil générique `web_search`.

Paramètres :

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Utilisez cet outil pour les pages utilisant beaucoup de JavaScript ou protégées contre les robots, lorsque la fonction `web_fetch` simple n’est pas suffisamment efficace.

Paramètres :

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Furtivité et contournement des robots

`firecrawl_scrape` et le mécanisme de secours Firecrawl de `web_fetch` utilisent par défaut `proxy: "auto"` et `storeInCache: true`, sauf si l’appelant remplace ces paramètres. `firecrawl_search` et le fournisseur Firecrawl de `web_search` ne proposent aucune option `proxy` ou `storeInCache` ; le mode de proxy furtif ne s’applique qu’aux requêtes d’extraction et de récupération.

Le mode `proxy` de Firecrawl contrôle le contournement des robots (`basic`, `stealth` ou `auto`). Le mode `auto` réessaie avec des proxys furtifs si une tentative simple échoue, ce qui peut consommer davantage de crédits qu’une extraction limitée au mode simple.

## Utilisation de Firecrawl par `web_fetch`

Ordre d’extraction de `web_fetch` :

1. Readability (local)
2. Fournisseur de récupération configuré, tel que Firecrawl (lorsqu’il est sélectionné ou détecté automatiquement à partir des identifiants configurés)
3. Nettoyage HTML simple (dernier mécanisme de secours)

Le paramètre de sélection est `tools.web.fetch.provider`. Si vous l’omettez, OpenClaw détecte automatiquement le premier fournisseur de récupération Web opérationnel à partir des identifiants disponibles. Le Plugin Firecrawl officiel fournit ce mécanisme de secours.

## Voir aussi

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Récupération Web](/fr/tools/web-fetch) -- outil `web_fetch` avec mécanisme de secours Firecrawl
- [Tavily](/fr/tools/tavily) -- outils de recherche et d’extraction
