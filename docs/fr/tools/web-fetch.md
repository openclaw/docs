---
read_when:
    - Vous souhaitez récupérer une URL et en extraire le contenu lisible
    - Vous devez configurer web_fetch ou sa solution de repli Firecrawl
    - Vous voulez comprendre les limites et la mise en cache de web_fetch
sidebarTitle: Web Fetch
summary: outil web_fetch -- récupération HTTP avec extraction du contenu lisible
title: Récupération web
x-i18n:
    generated_at: "2026-04-30T07:54:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

L’outil `web_fetch` effectue une requête HTTP GET simple et extrait le contenu lisible
(HTML vers markdown ou texte). Il n’exécute **pas** JavaScript.

Pour les sites fortement dépendants de JS ou les pages protégées par connexion, utilisez plutôt le
[Navigateur web](/fr/tools/browser).

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
Format de sortie après l’extraction du contenu principal.
</ParamField>

<ParamField path="maxChars" type="number">
Tronque la sortie à ce nombre de caractères.
</ParamField>

## Fonctionnement

<Steps>
  <Step title="Récupération">
    Envoie une requête HTTP GET avec un User-Agent de type Chrome et un en-tête
    `Accept-Language`. Bloque les noms d’hôte privés/internes et revérifie les redirections.
  </Step>
  <Step title="Extraction">
    Exécute Readability (extraction du contenu principal) sur la réponse HTML.
  </Step>
  <Step title="Fallback (facultatif)">
    Si Readability échoue et que Firecrawl est configuré, réessaie via l’API
    Firecrawl avec le mode de contournement des bots.
  </Step>
  <Step title="Cache">
    Les résultats sont mis en cache pendant 15 minutes (configurable) afin de réduire les récupérations
    répétées de la même URL.
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
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Fallback Firecrawl

Si l’extraction Readability échoue, `web_fetch` peut utiliser
[Firecrawl](/fr/tools/firecrawl) comme fallback pour le contournement des bots et une meilleure extraction :

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
  Si Firecrawl est activé et que son SecretRef n’est pas résolu sans fallback par variable d’environnement
  `FIRECRAWL_API_KEY`, le démarrage du Gateway échoue rapidement.
</Note>

<Note>
  Les substitutions de `baseUrl` Firecrawl sont verrouillées : elles doivent utiliser `https://` et
  l’hôte officiel de Firecrawl (`api.firecrawl.dev`).
</Note>

Comportement d’exécution actuel :

- `tools.web.fetch.provider` sélectionne explicitement le fournisseur de fallback de récupération.
- Si `provider` est omis, OpenClaw détecte automatiquement le premier fournisseur de récupération web
  prêt à partir des identifiants disponibles. Aujourd’hui, le fournisseur intégré est Firecrawl.
- Si Readability est désactivé, `web_fetch` passe directement au fallback du fournisseur
  sélectionné. Si aucun fournisseur n’est disponible, il échoue de manière fermée.

## Limites et sécurité

- `maxChars` est limité à `tools.web.fetch.maxCharsCap`
- Le corps de la réponse est plafonné à `maxResponseBytes` avant l’analyse ; les réponses
  surdimensionnées sont tronquées avec un avertissement
- Les noms d’hôte privés/internes sont bloqués
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` et
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sont des opt-ins restreints
  pour les piles de proxy à fausse IP fiables ; laissez-les non définis sauf si votre proxy possède
  ces plages synthétiques et applique sa propre politique de destination
- Les redirections sont vérifiées et limitées par `maxRedirects`
- `web_fetch` fonctionne au mieux -- certains sites nécessitent le [Navigateur web](/fr/tools/browser)

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

## Articles liés

- [Recherche web](/fr/tools/web) -- recherchez sur le web avec plusieurs fournisseurs
- [Navigateur web](/fr/tools/browser) -- automatisation complète du navigateur pour les sites fortement dépendants de JS
- [Firecrawl](/fr/tools/firecrawl) -- outils de recherche et de scraping Firecrawl
