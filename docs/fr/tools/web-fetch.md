---
read_when:
    - Vous voulez récupérer une URL et extraire un contenu lisible
    - Vous devez configurer `web_fetch` ou son repli Firecrawl
    - Vous voulez comprendre les limites et la mise en cache de `web_fetch`
sidebarTitle: Web Fetch
summary: Outil `web_fetch` — récupération HTTP avec extraction de contenu lisible
title: Web Fetch
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:39:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

L’outil `web_fetch` effectue un simple HTTP GET et extrait un contenu lisible
(HTML vers markdown ou texte). Il **n’exécute pas** JavaScript.

Pour les sites fortement dépendants de JS ou les pages protégées par connexion, utilisez plutôt le
[Web Browser](/fr/tools/browser).

## Démarrage rapide

`web_fetch` est **activé par défaut** -- aucune configuration nécessaire. L’agent peut
l’appeler immédiatement :

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Paramètres de l’outil

<ParamField path="url" type="string" required>
URL à récupérer. `http(s)` uniquement.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Format de sortie après extraction du contenu principal.
</ParamField>

<ParamField path="maxChars" type="number">
Tronquer la sortie à ce nombre de caractères.
</ParamField>

## Comment cela fonctionne

<Steps>
  <Step title="Récupération">
    Envoie un HTTP GET avec un User-Agent de type Chrome et un en-tête `Accept-Language`.
    Bloque les noms d’hôte privés/internes et revérifie les redirections.
  </Step>
  <Step title="Extraction">
    Exécute Readability (extraction du contenu principal) sur la réponse HTML.
  </Step>
  <Step title="Repli (facultatif)">
    Si Readability échoue et que Firecrawl est configuré, réessaie via l’API
    Firecrawl avec le mode de contournement de bot.
  </Step>
  <Step title="Cache">
    Les résultats sont mis en cache pendant 15 minutes (configurable) afin de réduire les
    récupérations répétées de la même URL.
  </Step>
</Steps>

## Configuration

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
      },
    },
  },
}
```

## Repli Firecrawl

Si l’extraction Readability échoue, `web_fetch` peut se replier sur
[Firecrawl](/fr/tools/firecrawl) pour le contournement de bot et une meilleure extraction :

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` prend en charge les objets SecretRef.
L’ancienne configuration `tools.web.fetch.firecrawl.*` est migrée automatiquement par `openclaw doctor --fix`.

<Note>
  Si Firecrawl est activé et que son SecretRef n’est pas résolu sans
  variable d’environnement de repli `FIRECRAWL_API_KEY`, le démarrage du gateway échoue immédiatement.
</Note>

<Note>
  Les remplacements de `baseUrl` Firecrawl sont strictement verrouillés : ils doivent utiliser `https://` et
  l’hôte officiel Firecrawl (`api.firecrawl.dev`).
</Note>

Comportement actuel à l’exécution :

- `tools.web.fetch.provider` sélectionne explicitement le fournisseur de repli de récupération.
- Si `provider` est omis, OpenClaw détecte automatiquement le premier fournisseur
  web-fetch prêt à partir des identifiants disponibles. Aujourd’hui, le fournisseur intégré est Firecrawl.
- Si Readability est désactivé, `web_fetch` passe directement au
  fournisseur de repli sélectionné. Si aucun fournisseur n’est disponible, il échoue de manière fermée.

## Limites et sécurité

- `maxChars` est borné à `tools.web.fetch.maxCharsCap`
- Le corps de réponse est plafonné à `maxResponseBytes` avant analyse ; les réponses
  surdimensionnées sont tronquées avec un avertissement
- Les noms d’hôte privés/internes sont bloqués
- Les redirections sont contrôlées et limitées par `maxRedirects`
- `web_fetch` fonctionne au mieux -- certains sites nécessitent le [Web Browser](/fr/tools/browser)

## Profils d’outils

Si vous utilisez des profils d’outils ou des listes d’autorisation, ajoutez `web_fetch` ou `group:web` :

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Associé

- [Web Search](/fr/tools/web) -- rechercher sur le web avec plusieurs fournisseurs
- [Web Browser](/fr/tools/browser) -- automatisation complète du navigateur pour les sites très dépendants de JS
- [Firecrawl](/fr/tools/firecrawl) -- outils de recherche et de scraping Firecrawl
