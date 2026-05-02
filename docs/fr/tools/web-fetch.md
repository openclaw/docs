---
read_when:
    - Vous voulez récupérer une URL et en extraire le contenu lisible
    - Vous devez configurer web_fetch ou sa solution de secours Firecrawl
    - Vous voulez comprendre les limites et la mise en cache de web_fetch
sidebarTitle: Web Fetch
summary: outil web_fetch -- récupération HTTP avec extraction de contenu lisible
title: Récupération web
x-i18n:
    generated_at: "2026-05-02T07:22:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

L’outil `web_fetch` effectue un simple HTTP GET et extrait le contenu lisible
(HTML en markdown ou texte). Il n’exécute **pas** JavaScript.

Pour les sites très dépendants de JS ou les pages protégées par connexion, utilisez plutôt le
[Web Browser](/fr/tools/browser).

## Démarrage rapide

`web_fetch` est **activé par défaut** -- aucune configuration n’est nécessaire. L’agent peut
l’appeler immédiatement :

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Paramètres de l’outil

<ParamField path="url" type="string" required>
URL à récupérer. `http(s)` uniquement.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Format de sortie après l’extraction du contenu principal.
</ParamField>

<ParamField path="maxChars" type="number">
Tronquer la sortie à ce nombre de caractères.
</ParamField>

## Fonctionnement

<Steps>
  <Step title="Récupérer">
    Envoie un HTTP GET avec un User-Agent semblable à Chrome et un en-tête
    `Accept-Language`. Bloque les noms d’hôte privés/internes et revérifie les redirections.
  </Step>
  <Step title="Extraire">
    Exécute Readability (extraction du contenu principal) sur la réponse HTML.
  </Step>
  <Step title="Solution de repli (facultative)">
    Si Readability échoue et que Firecrawl est configuré, réessaie via l’API
    Firecrawl avec le mode de contournement des bots.
  </Step>
  <Step title="Cache">
    Les résultats sont mis en cache pendant 15 minutes (configurable) afin de réduire les
    récupérations répétées de la même URL.
  </Step>
</Steps>

## Config

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
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Repli Firecrawl

Si l’extraction Readability échoue, `web_fetch` peut se rabattre sur
[Firecrawl](/fr/tools/firecrawl) pour le contournement des bots et une meilleure extraction :

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
La configuration héritée `tools.web.fetch.firecrawl.*` est migrée automatiquement par `openclaw doctor --fix`.

<Note>
  Si Firecrawl est activé et que sa SecretRef n’est pas résolue sans solution de repli
  d’environnement `FIRECRAWL_API_KEY`, le démarrage du Gateway échoue rapidement.
</Note>

<Note>
  Les substitutions de `baseUrl` Firecrawl sont verrouillées : le trafic hébergé utilise
  `https://api.firecrawl.dev` ; les substitutions auto-hébergées doivent cibler des points de terminaison privés ou
  internes, et `http://` n’est accepté que pour ces cibles privées.
</Note>

Comportement d’exécution actuel :

- `tools.web.fetch.provider` sélectionne explicitement le fournisseur de repli de récupération.
- Si `provider` est omis, OpenClaw détecte automatiquement le premier fournisseur web-fetch
  prêt à partir des identifiants disponibles. `web_fetch` non isolé peut utiliser des
  plugins installés qui déclarent `contracts.webFetchProviders` et enregistrent un
  fournisseur correspondant à l’exécution. Aujourd’hui, le fournisseur groupé est Firecrawl.
- Les appels `web_fetch` isolés restent limités aux fournisseurs groupés.
- Si Readability est désactivé, `web_fetch` passe directement au repli du
  fournisseur sélectionné. Si aucun fournisseur n’est disponible, il échoue de manière fermée.

## Limites et sécurité

- `maxChars` est limité à `tools.web.fetch.maxCharsCap`
- Le corps de la réponse est plafonné à `maxResponseBytes` avant l’analyse ; les réponses
  trop volumineuses sont tronquées avec un avertissement
- Les noms d’hôte privés/internes sont bloqués
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` et
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sont des activations facultatives étroites
  pour les piles de proxy à fausses IP de confiance ; laissez-les non définies sauf si votre proxy possède
  ces plages synthétiques et applique sa propre politique de destination
- Les redirections sont vérifiées et limitées par `maxRedirects`
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

## Connexe

- [Web Search](/fr/tools/web) -- rechercher sur le Web avec plusieurs fournisseurs
- [Web Browser](/fr/tools/browser) -- automatisation complète du navigateur pour les sites très dépendants de JS
- [Firecrawl](/fr/tools/firecrawl) -- outils de recherche et de scraping Firecrawl
