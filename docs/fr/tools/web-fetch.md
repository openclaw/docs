---
read_when:
    - Vous souhaitez récupérer une URL et en extraire un contenu lisible
    - Vous devez configurer `web_fetch` ou sa solution de repli Firecrawl
    - Vous souhaitez comprendre les limites et la mise en cache de `web_fetch`
sidebarTitle: Web Fetch
summary: Outil web_fetch — récupération HTTP avec extraction de contenu lisible
title: Récupération web
x-i18n:
    generated_at: "2026-07-12T03:14:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` effectue une requête HTTP GET simple et extrait le contenu lisible (conversion du HTML en
Markdown ou en texte). Il **n’exécute pas** JavaScript. Pour les sites qui utilisent beaucoup JS ou
les pages protégées par une connexion, utilisez plutôt le [navigateur Web](/fr/tools/browser).

## Démarrage rapide

Activé par défaut, sans configuration nécessaire :

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
Tronque la sortie à ce nombre de caractères. La valeur est limitée à `tools.web.fetch.maxCharsCap`.
</ParamField>

## Fonctionnement

<Steps>
  <Step title="Récupération">
    Envoie une requête HTTP GET avec un User-Agent similaire à celui de Chrome et l’en-tête
    `Accept-Language`. Bloque les noms d’hôte privés/internes et vérifie à nouveau les redirections.
  </Step>
  <Step title="Extraction">
    Exécute Readability (extraction du contenu principal) sur la réponse HTML.
  </Step>
  <Step title="Solution de repli (facultative)">
    Si Readability échoue et qu’un fournisseur de récupération est disponible, effectue une nouvelle tentative par
    l’intermédiaire de ce fournisseur (par exemple, le mode de contournement des robots de Firecrawl).
  </Step>
  <Step title="Cache">
    Les résultats sont mis en cache pendant 15 minutes (durée configurable) afin de réduire les
    récupérations répétées de la même URL.
  </Step>
</Steps>

## Mises à jour de progression

`web_fetch` émet une ligne de progression publique uniquement si la récupération est toujours en cours
après cinq secondes :

```text
Récupération du contenu de la page...
```

Les accès rapides au cache et les réponses réseau rapides se terminent avant le déclenchement du minuteur ;
ils n’affichent donc jamais de ligne de progression. L’annulation de l’appel efface le minuteur. La
ligne de progression représente uniquement l’état de l’interface utilisateur du canal et ne contient jamais le contenu de la page récupérée.

## Configuration

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // valeur par défaut : true
        provider: "firecrawl", // facultatif ; omettre pour la détection automatique
        maxChars: 20000, // nombre de caractères de sortie par défaut ; limité par maxCharsCap
        maxCharsCap: 20000, // limite stricte du paramètre maxChars
        maxResponseBytes: 750000, // taille maximale du téléchargement avant troncature (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // autoriser un proxy d’environnement HTTP(S) de confiance à résoudre le DNS
        readability: true, // utiliser l’extraction Readability
        userAgent: "Mozilla/5.0 ...", // remplacer le User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // activation explicite pour les proxys à fausses adresses IP de confiance utilisant 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // activation explicite pour les proxys à fausses adresses IP de confiance utilisant fc00::/7
        },
      },
    },
  },
}
```

## Solution de repli Firecrawl

Si l’extraction Readability échoue, `web_fetch` peut utiliser
[Firecrawl](/fr/tools/firecrawl) comme solution de repli pour contourner les robots et améliorer l’extraction :

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // facultatif ; omettre pour la détection automatique à partir des identifiants disponibles
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // facultatif ; omettre pour un accès initial sans clé
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // durée du cache (2 jours)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` est facultatif et prend en charge les objets SecretRef.
L’ancienne configuration `tools.web.fetch.firecrawl.*` est automatiquement migrée vers
`plugins.entries.firecrawl.config.webFetch` au moyen de `openclaw doctor --fix`.

<Note>
  Si vous configurez une SecretRef pour une clé d’API Firecrawl et qu’elle n’est pas résolue, sans
  variable d’environnement `FIRECRAWL_API_KEY` de repli, le démarrage du Gateway échoue immédiatement.
</Note>

<Note>
  Les remplacements de `baseUrl` de Firecrawl sont strictement encadrés : le trafic hébergé utilise
  `https://api.firecrawl.dev` ; les remplacements auto-hébergés doivent cibler des points de terminaison privés ou
  internes, et `http://` n’est accepté que pour ces cibles privées.
</Note>

Comportement actuel à l’exécution :

- `tools.web.fetch.provider` sélectionne explicitement le fournisseur de récupération de repli.
- Si `provider` est omis, OpenClaw détecte automatiquement le premier fournisseur de récupération Web
  prêt à l’emploi à partir des identifiants configurés. Hors bac à sable, `web_fetch` peut utiliser
  les plugins installés qui déclarent `contracts.webFetchProviders` et enregistrent un
  fournisseur correspondant à l’exécution. Le plugin Firecrawl officiel fournit actuellement cette
  solution de repli.
- Les appels `web_fetch` en bac à sable autorisent les fournisseurs intégrés ainsi que les fournisseurs installés
  dont la provenance officielle npm ou ClawHub est vérifiée. À ce jour, cela autorise le
  plugin Firecrawl officiel ; les plugins de récupération externes tiers restent exclus.
- Si Readability est désactivé, `web_fetch` passe directement à la solution de repli du
  fournisseur sélectionné. Si aucun fournisseur n’est disponible, l’appel échoue de manière sécurisée.

## Proxy d’environnement de confiance

Si votre déploiement exige que `web_fetch` passe par un proxy HTTP(S) sortant
de confiance, définissez `tools.web.fetch.useTrustedEnvProxy: true`.

Dans ce mode, OpenClaw applique toujours les vérifications SSRF fondées sur le nom d’hôte avant d’envoyer
la requête, mais laisse le proxy résoudre le DNS au lieu d’effectuer un
épinglage DNS local. Activez cette option uniquement lorsque le proxy est contrôlé par l’opérateur et applique
la politique de trafic sortant après la résolution DNS.

<Note>
  Si aucune variable d’environnement de proxy HTTP(S) n’est configurée, ou si l’hôte cible est exclu par
  `NO_PROXY`, `web_fetch` revient au chemin strict normal avec un épinglage DNS
  local.
</Note>

## Limites et sécurité

- `maxChars` est limité à `tools.web.fetch.maxCharsCap` (valeur par défaut : `20000`)
- Le corps de la réponse est limité à `maxResponseBytes` (valeur par défaut : `750000`, comprise entre
  32000 et 10000000) avant l’analyse ; les réponses trop volumineuses sont tronquées avec un avertissement
- Les noms d’hôte privés/internes sont bloqués
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` et
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` sont des activations explicites ciblées
  destinées aux piles de proxys de confiance utilisant de fausses adresses IP ; laissez-les non définies sauf si votre proxy contrôle
  ces plages synthétiques et applique sa propre politique de destination
- Les redirections sont vérifiées et limitées par `maxRedirects` (valeur par défaut : `3`)
- `useTrustedEnvProxy` nécessite une activation explicite et ne doit être activé que pour les
  proxys contrôlés par l’opérateur qui continuent d’appliquer la politique de trafic sortant après la résolution
  DNS
- `web_fetch` fonctionne au mieux de ses possibilités : certains sites nécessitent le [navigateur Web](/fr/tools/browser)

## Profils d’outils

Si vous utilisez des profils d’outils ou des listes d’autorisation, ajoutez `web_fetch` ou `group:web` :

```json5
{
  tools: {
    allow: ["web_fetch"],
    // ou : allow: ["group:web"]  (inclut web_fetch, web_search et x_search)
  },
}
```

## Voir aussi

- [Recherche Web](/fr/tools/web) — rechercher sur le Web avec plusieurs fournisseurs
- [Navigateur Web](/fr/tools/browser) — automatisation complète du navigateur pour les sites qui utilisent beaucoup JS
- [Firecrawl](/fr/tools/firecrawl) — outils Firecrawl de recherche et d’extraction
