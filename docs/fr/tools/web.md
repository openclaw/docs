---
read_when:
    - Vous souhaitez activer ou configurer `web_search`
    - Vous souhaitez activer ou configurer `x_search`
    - Vous devez choisir un provider de recherche
    - Vous souhaitez comprendre la détection automatique et le repli du provider
sidebarTitle: Web Search
summary: '`web_search`, `x_search` et `web_fetch` — rechercher sur le Web, rechercher dans les publications X ou récupérer le contenu d’une page'
title: Recherche Web
x-i18n:
    generated_at: "2026-04-22T04:28:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2517d660465f850b1cfdd255fbf512dc5c828b1ef22e3b24cec6aab097ebd5
    source_path: tools/web.md
    workflow: 15
---

# Recherche Web

L’outil `web_search` recherche sur le Web à l’aide de votre provider configuré et
renvoie des résultats. Les résultats sont mis en cache par requête pendant 15 minutes (configurable).

OpenClaw inclut aussi `x_search` pour les publications X (anciennement Twitter) et
`web_fetch` pour une récupération légère d’URL. Dans cette phase, `web_fetch` reste
local tandis que `web_search` et `x_search` peuvent utiliser en interne xAI Responses.

<Info>
  `web_search` est un outil HTTP léger, pas une automatisation de navigateur. Pour
  les sites lourds en JS ou les connexions, utilisez le [Navigateur Web](/fr/tools/browser). Pour
  récupérer une URL spécifique, utilisez [Web Fetch](/fr/tools/web-fetch).
</Info>

## Démarrage rapide

<Steps>
  <Step title="Choisir un provider">
    Choisissez un provider et terminez toute configuration requise. Certains providers sont
    sans clé, tandis que d’autres utilisent des clés API. Consultez les pages des providers ci-dessous pour
    les détails.
  </Step>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    ```
    Cela stocke le provider et tout identifiant nécessaire. Vous pouvez aussi définir une variable d’environnement
    (par exemple `BRAVE_API_KEY`) et ignorer cette étape pour les
    providers adossés à une API.
  </Step>
  <Step title="L’utiliser">
    L’agent peut maintenant appeler `web_search` :

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Pour les publications X, utilisez :

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Choisir un provider

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/fr/tools/brave-search">
    Résultats structurés avec extraits. Prend en charge le mode `llm-context`, les filtres pays/langue. Niveau gratuit disponible.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fr/tools/duckduckgo-search">
    Repli sans clé. Aucune clé API requise. Intégration non officielle basée sur HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fr/tools/exa-search">
    Recherche neuronale + par mots-clés avec extraction de contenu (highlights, texte, résumés).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fr/tools/firecrawl">
    Résultats structurés. S’associe idéalement à `firecrawl_search` et `firecrawl_scrape` pour une extraction approfondie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fr/tools/gemini-search">
    Réponses synthétisées par l’IA avec citations via l’ancrage Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fr/tools/grok-search">
    Réponses synthétisées par l’IA avec citations via l’ancrage Web xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fr/tools/kimi-search">
    Réponses synthétisées par l’IA avec citations via la recherche Web Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fr/tools/minimax-search">
    Résultats structurés via l’API de recherche MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fr/tools/ollama-search">
    Recherche sans clé via votre hôte Ollama configuré. Nécessite `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/fr/tools/perplexity-search">
    Résultats structurés avec contrôles d’extraction de contenu et filtrage par domaine.
  </Card>
  <Card title="SearXNG" icon="server" href="/fr/tools/searxng-search">
    Méta-recherche auto-hébergée. Aucune clé API requise. Agrège Google, Bing, DuckDuckGo, et plus encore.
  </Card>
  <Card title="Tavily" icon="globe" href="/fr/tools/tavily">
    Résultats structurés avec profondeur de recherche, filtrage par sujet, et `tavily_extract` pour l’extraction d’URL.
  </Card>
</CardGroup>

### Comparaison des providers

| Provider                                  | Style de résultat            | Filtres                                          | Clé API                                                                           |
| ----------------------------------------- | ---------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [Brave](/fr/tools/brave-search)              | Extraits structurés          | Pays, langue, heure, mode `llm-context`          | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/fr/tools/duckduckgo-search)    | Extraits structurés          | --                                               | Aucune (sans clé)                                                                 |
| [Exa](/fr/tools/exa-search)                  | Structuré + extrait          | Mode neuronal / mots-clés, date, extraction de contenu | `EXA_API_KEY`                                                                 |
| [Firecrawl](/fr/tools/firecrawl)             | Extraits structurés          | Via l’outil `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/fr/tools/gemini-search)            | Synthétisé par IA + citations | --                                              | `GEMINI_API_KEY`                                                                  |
| [Grok](/fr/tools/grok-search)                | Synthétisé par IA + citations | --                                              | `XAI_API_KEY`                                                                     |
| [Kimi](/fr/tools/kimi-search)                | Synthétisé par IA + citations | --                                              | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/fr/tools/minimax-search)   | Extraits structurés          | Région (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web Search](/fr/tools/ollama-search) | Extraits structurés          | --                                               | Aucune par défaut ; `ollama signin` requis, peut réutiliser l’authentification Bearer du provider Ollama |
| [Perplexity](/fr/tools/perplexity-search)    | Extraits structurés          | Pays, langue, heure, domaines, limites de contenu | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/fr/tools/searxng-search)          | Extraits structurés          | Catégories, langue                               | Aucune (auto-hébergé)                                                             |
| [Tavily](/fr/tools/tavily)                   | Extraits structurés          | Via l’outil `tavily_search`                      | `TAVILY_API_KEY`                                                                  |

## Détection automatique

## Recherche Web native Codex

Les modèles compatibles Codex peuvent éventuellement utiliser l’outil `web_search` natif du provider Responses au lieu de la fonction `web_search` gérée par OpenClaw.

- Configurez-le sous `tools.web.search.openaiCodex`
- Il ne s’active que pour les modèles compatibles Codex (`openai-codex/*` ou les providers utilisant `api: "openai-codex-responses"`)
- Le `web_search` géré s’applique toujours aux modèles non Codex
- `mode: "cached"` est le réglage par défaut et recommandé
- `tools.web.search.enabled: false` désactive à la fois la recherche gérée et la recherche native

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Si la recherche native Codex est activée mais que le modèle actuel n’est pas compatible Codex, OpenClaw conserve le comportement normal de `web_search` géré.

## Configurer la recherche Web

Les listes de providers dans la documentation et les flux de configuration sont alphabétiques. La détection automatique conserve un
ordre de priorité distinct.

Si aucun `provider` n’est défini, OpenClaw vérifie les providers dans cet ordre et utilise le
premier qui est prêt :

Providers adossés à une API d’abord :

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordre 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordre 15)
3. **Gemini** -- `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey` (ordre 20)
4. **Grok** -- `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordre 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordre 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordre 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordre 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey` (ordre 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordre 70)

Replis sans clé ensuite :

10. **DuckDuckGo** -- repli HTML sans clé, sans compte ni clé API (ordre 100)
11. **Ollama Web Search** -- repli sans clé via votre hôte Ollama configuré ; nécessite qu’Ollama soit accessible et connecté avec `ollama signin` et peut réutiliser l’authentification Bearer du provider Ollama si l’hôte en a besoin (ordre 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordre 200)

Si aucun provider n’est détecté, il se replie sur Brave (vous obtiendrez une
erreur de clé manquante vous invitant à en configurer une).

<Note>
  Tous les champs de clé de provider prennent en charge des objets SecretRef. Les SecretRefs à portée de plugin
  sous `plugins.entries.<plugin>.config.webSearch.apiKey` sont résolus pour les
  providers inclus Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity et Tavily,
  que le provider soit choisi explicitement via `tools.web.search.provider` ou
  sélectionné via la détection automatique. En mode détection automatique, OpenClaw ne résout que la
  clé du provider sélectionné -- les SecretRefs non sélectionnés restent inactifs, vous pouvez donc
  garder plusieurs providers configurés sans payer le coût de résolution pour
  ceux que vous n’utilisez pas.
</Note>

## Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // par défaut : true
        provider: "brave", // ou omettre pour la détection automatique
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La config spécifique au provider (clés API, URL de base, modes) se trouve sous
`plugins.entries.<plugin>.config.webSearch.*`. Consultez les pages des providers pour
des exemples.

La sélection du provider de repli `web_fetch` est distincte :

- choisissez-le avec `tools.web.fetch.provider`
- ou omettez ce champ et laissez OpenClaw détecter automatiquement le premier
  provider web-fetch prêt à partir des identifiants disponibles
- aujourd’hui le provider web-fetch inclus est Firecrawl, configuré sous
  `plugins.entries.firecrawl.config.webFetch.*`

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut aussi demander :

- la région API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- le modèle par défaut de recherche Web Kimi (par défaut `kimi-k2.6`)

Pour `x_search`, configurez `plugins.entries.xai.config.xSearch.*`. Il utilise le
même repli `XAI_API_KEY` que la recherche Web Grok.
L’ancienne config `tools.web.x_search.*` est migrée automatiquement par `openclaw doctor --fix`.
Lorsque vous choisissez Grok pendant `openclaw onboard` ou `openclaw configure --section web`,
OpenClaw peut aussi proposer la configuration facultative de `x_search` avec la même clé.
Il s’agit d’une étape de suivi distincte à l’intérieur du chemin Grok, et non d’un choix
de provider de recherche Web séparé au niveau supérieur. Si vous choisissez un autre provider, OpenClaw n’affiche pas
le prompt `x_search`.

### Stocker les clés API

<Tabs>
  <Tab title="Fichier de config">
    Exécutez `openclaw configure --section web` ou définissez directement la clé :

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Variable d’environnement">
    Définissez la variable d’environnement du provider dans l’environnement du processus Gateway :

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Pour une installation Gateway, placez-la dans `~/.openclaw/.env`.
    Voir [Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Paramètres de l’outil

| Parameter             | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Requête de recherche (obligatoire)                    |
| `count`               | Résultats à renvoyer (1-10, par défaut : 5)           |
| `country`             | Code pays ISO à 2 lettres (par ex. `"US"`, `"DE"`)    |
| `language`            | Code langue ISO 639-1 (par ex. `"en"`, `"de"`)        |
| `search_lang`         | Code de langue de recherche (Brave uniquement)        |
| `freshness`           | Filtre temporel : `day`, `week`, `month` ou `year`    |
| `date_after`          | Résultats après cette date (YYYY-MM-DD)               |
| `date_before`         | Résultats avant cette date (YYYY-MM-DD)               |
| `ui_lang`             | Code langue d’interface (Brave uniquement)            |
| `domain_filter`       | Tableau de liste d’autorisation / refus de domaines (Perplexity uniquement) |
| `max_tokens`          | Budget total de contenu, 25000 par défaut (Perplexity uniquement) |
| `max_tokens_per_page` | Limite de jetons par page, 2048 par défaut (Perplexity uniquement) |

<Warning>
  Tous les paramètres ne fonctionnent pas avec tous les providers. Le mode Brave `llm-context`
  rejette `ui_lang`, `freshness`, `date_after` et `date_before`.
  Gemini, Grok et Kimi renvoient une réponse synthétisée unique avec citations. Ils
  acceptent `count` pour la compatibilité avec l’outil partagé, mais cela ne change pas la
  forme de la réponse ancrée.
  Perplexity se comporte de la même façon lorsque vous utilisez le chemin de compatibilité
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`).
  SearXNG accepte `http://` uniquement pour les hôtes loopback ou de réseau privé de confiance ;
  les points de terminaison SearXNG publics doivent utiliser `https://`.
  Firecrawl et Tavily ne prennent en charge que `query` et `count` via `web_search`
  -- utilisez leurs outils dédiés pour les options avancées.
</Warning>

## x_search

`x_search` interroge les publications X (anciennement Twitter) à l’aide de xAI et renvoie
des réponses synthétisées par l’IA avec citations. Il accepte des requêtes en langage naturel et
des filtres structurés facultatifs. OpenClaw active uniquement l’outil `x_search` xAI intégré sur la requête qui sert cet appel d’outil.

<Note>
  xAI documente `x_search` comme prenant en charge la recherche par mots-clés, la recherche sémantique, la recherche d’utilisateur
  et la récupération de fil. Pour les statistiques d’engagement par publication comme les republications,
  réponses, signets ou vues, préférez une recherche ciblée de l’URL exacte de la publication
  ou de l’identifiant du statut. Les recherches larges par mots-clés peuvent trouver la bonne publication mais renvoyer des métadonnées par publication moins complètes. Un bon schéma consiste à : localiser d’abord la publication, puis
  lancer une seconde requête `x_search` focalisée sur cette publication exacte.
</Note>

### Config x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // facultatif si XAI_API_KEY est défini
          },
        },
      },
    },
  },
}
```

### Paramètres x_search

| Parameter                    | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Requête de recherche (obligatoire)                     |
| `allowed_x_handles`          | Limiter les résultats à des handles X spécifiques      |
| `excluded_x_handles`         | Exclure des handles X spécifiques                      |
| `from_date`                  | Inclure uniquement les publications à cette date ou après (YYYY-MM-DD) |
| `to_date`                    | Inclure uniquement les publications à cette date ou avant (YYYY-MM-DD) |
| `enable_image_understanding` | Permettre à xAI d’inspecter les images jointes aux publications correspondantes |
| `enable_video_understanding` | Permettre à xAI d’inspecter les vidéos jointes aux publications correspondantes |

### Exemple x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistiques par publication : utilisez l’URL exacte du statut ou l’identifiant du statut lorsque c’est possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Exemples

```javascript
// Recherche de base
await web_search({ query: "OpenClaw plugin SDK" });

// Recherche spécifique à l’Allemagne
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Résultats récents (semaine passée)
await web_search({ query: "AI developments", freshness: "week" });

// Plage de dates
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrage de domaines (Perplexity uniquement)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profils d’outils

Si vous utilisez des profils d’outils ou des listes d’autorisation, ajoutez `web_search`, `x_search` ou `group:web` :

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // ou : allow: ["group:web"]  (inclut web_search, x_search et web_fetch)
  },
}
```

## Liens associés

- [Web Fetch](/fr/tools/web-fetch) -- récupérer une URL et extraire un contenu lisible
- [Web Browser](/fr/tools/browser) -- automatisation complète du navigateur pour les sites lourds en JS
- [Grok Search](/fr/tools/grok-search) -- Grok comme provider `web_search`
- [Ollama Web Search](/fr/tools/ollama-search) -- recherche Web sans clé via votre hôte Ollama
