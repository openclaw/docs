---
read_when:
    - Vous souhaitez récupérer une URL et en extraire le contenu lisible
    - Vous devez configurer web_fetch ou sa solution de repli Firecrawl
    - Vous voulez comprendre les limites et la mise en cache de web_fetch
sidebarTitle: Web Fetch
summary: outil web_fetch -- récupération HTTP avec extraction de contenu lisible
title: Récupération web
x-i18n:
    generated_at: "2026-05-06T18:00:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

L’outil `web_fetch` effectue un simple HTTP GET et extrait le contenu lisible
(HTML vers markdown ou texte). Il n’exécute **pas** JavaScript.

Pour les sites fortement dépendants de JS ou les pages protégées par connexion, utilisez plutôt le
[Navigateur Web](/fr/tools/browser).

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
Tronque la sortie à ce nombre de caractères.
</ParamField>

## Fonctionnement

<Steps>
  <Step title="Récupération">
    Envoie un HTTP GET avec un User-Agent semblable à Chrome et un en-tête
    `Accept-Language`. Bloque les noms d’hôte privés/internes et revérifie les redirections.
  </Step>
  <Step title="Extraction">
    Exécute Readability (extraction du contenu principal) sur la réponse HTML.
  </Step>
  <Step title="Repli (facultatif)">
    Si Readability échoue et que Firecrawl est configuré, réessaie via l’API
    Firecrawl avec le mode de contournement des bots.
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

Si l’extraction Readability échoue, `web_fetch` peut se replier sur
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
L’ancienne configuration `tools.web.fetch.firecrawl.*` est migrée automatiquement par `openclaw doctor --fix`.

<Note>
  Si Firecrawl est activé et que sa SecretRef n’est pas résolue sans solution de repli par variable d’environnement
  `FIRECRAWL_API_KEY`, le démarrage du Gateway échoue rapidement.
</Note>

<Note>
  Les remplacements de `baseUrl` Firecrawl sont verrouillés : le trafic hébergé utilise
  `https://api.firecrawl.dev` ; les remplacements auto-hébergés doivent cibler des points de terminaison privés ou
  internes, et `http://` n’est accepté que pour ces cibles privées.
</Note>

Comportement d’exécution actuel :

- `tools.web.fetch.provider` sélectionne explicitement le fournisseur de repli de récupération.
- Si `provider` est omis, OpenClaw détecte automatiquement le premier fournisseur web-fetch
  prêt à partir des identifiants disponibles. Les appels `web_fetch` non isolés en bac à sable peuvent utiliser
  les plugins installés qui déclarent `contracts.webFetchProviders` et enregistrent un
  fournisseur correspondant à l’exécution. Aujourd’hui, le fournisseur groupé est Firecrawl.
- Les appels `web_fetch` isolés en bac à sable restent limités aux fournisseurs groupés.
- Si Readability est désactivé, `web_fetch` passe directement au repli du
  fournisseur sélectionné. Si aucun fournisseur n’est disponible, il échoue de manière fermée.

## Proxy d’environnement de confiance

Si votre déploiement exige que `web_fetch` passe par un proxy sortant
HTTP(S) de confiance, définissez `tools.web.fetch.useTrustedEnvProxy: true`.

Dans ce mode, OpenClaw applique toujours les vérifications SSRF basées sur le nom d’hôte avant d’envoyer
la requête, mais il laisse le proxy résoudre le DNS au lieu d’effectuer un épinglage DNS
local. Activez cette option uniquement lorsque le proxy est contrôlé par l’opérateur et applique
la politique sortante après la résolution DNS.

<Note>
  Si aucune variable d’environnement de proxy HTTP(S) n’est configurée, ou si l’hôte cible est exclu par
  `NO_PROXY`, `web_fetch` revient au chemin strict normal avec épinglage DNS
  local.
</Note>

## Limites et sécurité

- `maxChars` est plafonné à `tools.web.fetch.maxCharsCap`
- Le corps de la réponse est plafonné à `maxResponseBytes` avant l’analyse ; les réponses
  surdimensionnées sont tronquées avec un avertissement
- Les noms d’hôte privés/internes sont bloqués
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` et
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sont des activations explicites limitées
  pour les piles de proxy à fausse IP de confiance ; laissez-les non définies sauf si votre proxy possède
  ces plages synthétiques et applique sa propre politique de destination
- Les redirections sont vérifiées et limitées par `maxRedirects`
- `useTrustedEnvProxy` est une activation explicite et ne doit être activée que pour les
  proxys contrôlés par l’opérateur qui appliquent toujours la politique sortante après la résolution
  DNS
- `web_fetch` fonctionne au mieux -- certains sites nécessitent le [Navigateur Web](/fr/tools/browser)

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

- [Recherche Web](/fr/tools/web) -- rechercher sur le Web avec plusieurs fournisseurs
- [Navigateur Web](/fr/tools/browser) -- automatisation complète du navigateur pour les sites fortement dépendants de JS
- [Firecrawl](/fr/tools/firecrawl) -- outils de recherche et d’extraction Firecrawl
