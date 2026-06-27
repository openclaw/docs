---
read_when:
    - Vous voulez récupérer une URL et en extraire le contenu lisible
    - Vous devez configurer web_fetch ou son repli Firecrawl
    - Vous voulez comprendre les limites et la mise en cache de web_fetch
sidebarTitle: Web Fetch
summary: outil web_fetch -- récupération HTTP avec extraction de contenu lisible
title: Récupération web
x-i18n:
    generated_at: "2026-06-27T18:22:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

L’outil `web_fetch` effectue un simple GET HTTP et extrait le contenu lisible
(HTML vers Markdown ou texte). Il n’exécute **pas** JavaScript.

Pour les sites qui dépendent fortement de JS ou les pages protégées par connexion, utilisez plutôt le
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
Format de sortie après extraction du contenu principal.
</ParamField>

<ParamField path="maxChars" type="number">
Tronque la sortie à ce nombre de caractères.
</ParamField>

## Fonctionnement

<Steps>
  <Step title="Fetch">
    Envoie un GET HTTP avec un User-Agent semblable à celui de Chrome et un en-tête
    `Accept-Language`. Bloque les noms d’hôte privés/internes et revérifie les redirections.
  </Step>
  <Step title="Extract">
    Exécute Readability (extraction du contenu principal) sur la réponse HTML.
  </Step>
  <Step title="Fallback (optional)">
    Si Readability échoue et que Firecrawl est sélectionné, réessaie via l’API
    Firecrawl avec le mode de contournement des bots.
  </Step>
  <Step title="Cache">
    Les résultats sont mis en cache pendant 15 minutes (configurable) afin de réduire les
    récupérations répétées de la même URL.
  </Step>
</Steps>

## Mises à jour de progression

`web_fetch` émet une ligne de progression publique uniquement lorsque la récupération est toujours en attente
après cinq secondes :

```text
Fetching page content...
```

Les accès rapides au cache et les réponses réseau rapides se terminent avant le déclenchement du minuteur ; ils
n’affichent donc pas de ligne de progression. Si l’appel est annulé, le minuteur est effacé.
Lorsque la récupération finit par se terminer, l’agent reçoit le résultat normal de l’outil ;
la ligne de progression n’est qu’un état d’interface de canal et ne contient jamais le contenu
de la page récupérée.

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

## Solution de secours Firecrawl

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` est facultatif et prend en charge les objets SecretRef.
La configuration héritée `tools.web.fetch.firecrawl.*` est migrée automatiquement par `openclaw doctor --fix`.

<Note>
  Si vous configurez une SecretRef de clé d’API Firecrawl et qu’elle n’est pas résolue sans solution de secours
  d’environnement `FIRECRAWL_API_KEY`, le démarrage du Gateway échoue rapidement.
</Note>

<Note>
  Les substitutions de `baseUrl` Firecrawl sont verrouillées : le trafic hébergé utilise
  `https://api.firecrawl.dev` ; les substitutions auto-hébergées doivent cibler des points de terminaison privés ou
  internes, et `http://` n’est accepté que pour ces cibles privées.
</Note>

Comportement d’exécution actuel :

- `tools.web.fetch.provider` sélectionne explicitement le fournisseur de secours de récupération.
- Si `provider` est omis, OpenClaw détecte automatiquement le premier fournisseur web-fetch prêt
  à partir des identifiants configurés. `web_fetch` non isolé peut utiliser les plugins installés
  qui déclarent `contracts.webFetchProviders` et enregistrent un fournisseur correspondant
  à l’exécution. Le Plugin Firecrawl officiel fournit cette solution de secours.
- Les appels `web_fetch` isolés autorisent les fournisseurs intégrés ainsi que les fournisseurs installés
  dont la provenance npm officielle ou ClawHub est vérifiée. Aujourd’hui, cela autorise le
  Plugin Firecrawl officiel ; les plugins de récupération externes tiers restent exclus.
- Si Readability est désactivé, `web_fetch` passe directement à la solution de secours du
  fournisseur sélectionné. Si aucun fournisseur n’est disponible, il échoue en mode fermé.

## Proxy d’environnement approuvé

Si votre déploiement exige que `web_fetch` passe par un proxy sortant
HTTP(S) approuvé, définissez `tools.web.fetch.useTrustedEnvProxy: true`.

Dans ce mode, OpenClaw applique toujours les contrôles SSRF fondés sur le nom d’hôte avant d’envoyer
la requête, mais laisse le proxy résoudre le DNS au lieu d’effectuer un épinglage DNS local.
Activez ce mode uniquement lorsque le proxy est contrôlé par l’opérateur et applique
la politique sortante après la résolution DNS.

<Note>
  Si aucune variable d’environnement de proxy HTTP(S) n’est configurée, ou si l’hôte cible est exclu par
  `NO_PROXY`, `web_fetch` revient au chemin strict normal avec épinglage DNS
  local.
</Note>

## Limites et sécurité

- `maxChars` est limité à `tools.web.fetch.maxCharsCap`
- Le corps de réponse est plafonné à `maxResponseBytes` avant l’analyse ; les réponses
  trop volumineuses sont tronquées avec un avertissement
- Les noms d’hôte privés/internes sont bloqués
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` et
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sont des opt-ins étroits
  pour les piles de proxy à fausses IP approuvées ; laissez-les non définis sauf si votre proxy possède
  ces plages synthétiques et applique sa propre politique de destination
- Les redirections sont vérifiées et limitées par `maxRedirects`
- `useTrustedEnvProxy` est un opt-in explicite et ne doit être activé que pour les
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

## Associés

- [Recherche Web](/fr/tools/web) -- recherchez sur le Web avec plusieurs fournisseurs
- [Navigateur Web](/fr/tools/browser) -- automatisation complète du navigateur pour les sites dépendant fortement de JS
- [Firecrawl](/fr/tools/firecrawl) -- outils de recherche et de scraping Firecrawl
