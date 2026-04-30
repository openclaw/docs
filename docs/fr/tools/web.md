---
read_when:
    - Vous souhaitez activer ou configurer web_search
    - Vous souhaitez activer ou configurer x_search
    - Vous devez choisir un fournisseur de recherche
    - Vous voulez comprendre la détection automatique et le repli vers un fournisseur
sidebarTitle: Web Search
summary: web_search, x_search, et web_fetch -- rechercher sur le web, rechercher des publications X ou récupérer le contenu d'une page
title: Recherche web
x-i18n:
    generated_at: "2026-04-30T07:54:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

L’outil `web_search` recherche sur le web avec votre fournisseur configuré et
renvoie des résultats. Les résultats sont mis en cache par requête pendant 15 minutes (configurable).

OpenClaw inclut également `x_search` pour les publications X (anciennement Twitter) et
`web_fetch` pour la récupération légère d’URL. À cette phase, `web_fetch` reste
local tandis que `web_search` et `x_search` peuvent utiliser xAI Responses en arrière-plan.

<Info>
  `web_search` est un outil HTTP léger, pas une automatisation de navigateur. Pour
  les sites fortement dépendants de JS ou les connexions, utilisez le [navigateur web](/fr/tools/browser). Pour
  récupérer une URL spécifique, utilisez [Web Fetch](/fr/tools/web-fetch).
</Info>

## Démarrage rapide

<Steps>
  <Step title="Choose a provider">
    Choisissez un fournisseur et effectuez toute configuration requise. Certains fournisseurs sont
    sans clé, tandis que d’autres utilisent des clés d’API. Consultez les pages des fournisseurs ci-dessous pour
    plus de détails.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Cela stocke le fournisseur et tout identifiant nécessaire. Vous pouvez aussi définir une variable
    d’environnement (par exemple `BRAVE_API_KEY`) et ignorer cette étape pour les fournisseurs
    adossés à une API.
  </Step>
  <Step title="Use it">
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

## Choisir un fournisseur

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/fr/tools/brave-search">
    Résultats structurés avec extraits. Prend en charge le mode `llm-context` et les filtres de pays/langue. Offre gratuite disponible.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fr/tools/duckduckgo-search">
    Solution de repli sans clé. Aucune clé d’API nécessaire. Intégration non officielle basée sur HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fr/tools/exa-search">
    Recherche neuronale + par mots-clés avec extraction de contenu (passages, texte, résumés).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fr/tools/firecrawl">
    Résultats structurés. Idéal avec `firecrawl_search` et `firecrawl_scrape` pour une extraction approfondie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fr/tools/gemini-search">
    Réponses synthétisées par IA avec citations via l’ancrage Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fr/tools/grok-search">
    Réponses synthétisées par IA avec citations via l’ancrage web xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fr/tools/kimi-search">
    Réponses synthétisées par IA avec citations via la recherche web Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fr/tools/minimax-search">
    Résultats structurés via l’API de recherche MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fr/tools/ollama-search">
    Recherche via un hôte Ollama local connecté ou l’API Ollama hébergée.
  </Card>
  <Card title="Perplexity" icon="search" href="/fr/tools/perplexity-search">
    Résultats structurés avec contrôles d’extraction de contenu et filtrage par domaine.
  </Card>
  <Card title="SearXNG" icon="server" href="/fr/tools/searxng-search">
    Méta-recherche auto-hébergée. Aucune clé d’API nécessaire. Agrège Google, Bing, DuckDuckGo et plus encore.
  </Card>
  <Card title="Tavily" icon="globe" href="/fr/tools/tavily">
    Résultats structurés avec profondeur de recherche, filtrage par sujet et `tavily_extract` pour l’extraction d’URL.
  </Card>
</CardGroup>

### Comparaison des fournisseurs

| Fournisseur                               | Style de résultat          | Filtres                                          | Clé d’API                                                                               |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fr/tools/brave-search)              | Extraits structurés        | Pays, langue, période, mode `llm-context`        | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/fr/tools/duckduckgo-search)    | Extraits structurés        | --                                               | Aucune (sans clé)                                                                       |
| [Exa](/fr/tools/exa-search)                  | Structuré + extrait        | Mode neuronal/mots-clés, date, extraction de contenu | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fr/tools/firecrawl)             | Extraits structurés        | Via l’outil `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fr/tools/gemini-search)            | Synthétisé par IA + citations | --                                            | `GEMINI_API_KEY`                                                                        |
| [Grok](/fr/tools/grok-search)                | Synthétisé par IA + citations | --                                            | `XAI_API_KEY`                                                                           |
| [Kimi](/fr/tools/kimi-search)                | Synthétisé par IA + citations | --                                            | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fr/tools/minimax-search)   | Extraits structurés        | Région (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/fr/tools/ollama-search) | Extraits structurés        | --                                               | Aucune pour les hôtes locaux connectés ; `OLLAMA_API_KEY` pour la recherche directe `https://ollama.com` |
| [Perplexity](/fr/tools/perplexity-search)    | Extraits structurés        | Pays, langue, période, domaines, limites de contenu | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fr/tools/searxng-search)          | Extraits structurés        | Catégories, langue                               | Aucune (auto-hébergé)                                                                   |
| [Tavily](/fr/tools/tavily)                   | Extraits structurés        | Via l’outil `tavily_search`                      | `TAVILY_API_KEY`                                                                        |

## Détection automatique

## Recherche web OpenAI native

Les modèles OpenAI Responses directs utilisent automatiquement l’outil `web_search` hébergé d’OpenAI lorsque la recherche web OpenClaw est activée et qu’aucun fournisseur géré n’est épinglé. Ce comportement appartient au fournisseur dans le Plugin OpenAI inclus et s’applique uniquement au trafic de l’API OpenAI native, pas aux URL de base de proxy compatibles OpenAI ni aux routes Azure. Définissez `tools.web.search.provider` sur un autre fournisseur tel que `brave` pour conserver l’outil `web_search` géré pour les modèles OpenAI, ou définissez `tools.web.search.enabled: false` pour désactiver à la fois la recherche gérée et la recherche OpenAI native.

## Recherche web Codex native

Les modèles compatibles Codex peuvent facultativement utiliser l’outil `web_search` Responses natif du fournisseur au lieu de la fonction `web_search` gérée d’OpenClaw.

- Configurez-le sous `tools.web.search.openaiCodex`
- Il ne s’active que pour les modèles compatibles Codex (`openai-codex/*` ou les fournisseurs utilisant `api: "openai-codex-responses"`)
- `web_search` géré s’applique toujours aux modèles non-Codex
- `mode: "cached"` est le paramètre par défaut et recommandé
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

Si la recherche Codex native est activée mais que le modèle actuel n’est pas compatible Codex, OpenClaw conserve le comportement normal de `web_search` géré.

## Configurer la recherche web

Les listes de fournisseurs dans la documentation et les flux de configuration sont alphabétiques. La détection automatique conserve un
ordre de préséance distinct.

Si aucun `provider` n’est défini, OpenClaw vérifie les fournisseurs dans cet ordre et utilise le
premier qui est prêt :

Fournisseurs adossés à une API d’abord :

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordre 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordre 15)
3. **Gemini** -- `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey` (ordre 20)
4. **Grok** -- `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordre 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordre 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordre 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordre 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey` (ordre 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordre 70)

Solutions de repli sans clé ensuite :

10. **DuckDuckGo** -- solution de repli HTML sans clé, sans compte ni clé d’API (ordre 100)
11. **Ollama Web Search** -- solution de repli sans clé via votre hôte Ollama local configuré lorsqu’il est joignable et connecté avec `ollama signin` ; peut réutiliser l’authentification bearer du fournisseur Ollama lorsque l’hôte en a besoin, et peut appeler la recherche directe `https://ollama.com` lorsqu’elle est configurée avec `OLLAMA_API_KEY` (ordre 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordre 200)

Si aucun fournisseur n’est détecté, la recherche se replie sur Brave (vous obtiendrez une erreur de clé manquante
vous invitant à en configurer une).

<Note>
  Tous les champs de clé de fournisseur prennent en charge les objets SecretRef. Les SecretRefs limités au Plugin
  sous `plugins.entries.<plugin>.config.webSearch.apiKey` sont résolus pour les
  fournisseurs de recherche web adossés à une API inclus, notamment Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity et Tavily,
  que le fournisseur soit choisi explicitement via `tools.web.search.provider` ou
  sélectionné par détection automatique. En mode de détection automatique, OpenClaw ne résout que la
  clé du fournisseur sélectionné -- les SecretRefs non sélectionnés restent inactifs, ce qui vous permet de
  garder plusieurs fournisseurs configurés sans payer le coût de résolution pour ceux
  que vous n’utilisez pas.
</Note>

## Configuration

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configuration propre à chaque fournisseur (clés d’API, URL de base, modes) se trouve sous
`plugins.entries.<plugin>.config.webSearch.*`. Consultez les pages des fournisseurs pour
des exemples.

La sélection du fournisseur de repli `web_fetch` est séparée :

- choisissez-le avec `tools.web.fetch.provider`
- ou omettez ce champ et laissez OpenClaw détecter automatiquement le premier fournisseur web-fetch
  prêt à partir des identifiants disponibles
- aujourd’hui, le fournisseur web-fetch inclus est Firecrawl, configuré sous
  `plugins.entries.firecrawl.config.webFetch.*`

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut aussi demander :

- la région de l’API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- le modèle de recherche web Kimi par défaut (par défaut `kimi-k2.6`)

Pour `x_search`, configurez `plugins.entries.xai.config.xSearch.*`. Il utilise le
même repli `XAI_API_KEY` que la recherche web Grok.
L’ancienne configuration `tools.web.x_search.*` est migrée automatiquement par `openclaw doctor --fix`.
Lorsque vous choisissez Grok pendant `openclaw onboard` ou `openclaw configure --section web`,
OpenClaw peut également proposer une configuration facultative de `x_search` avec la même clé.
Il s’agit d’une étape de suivi distincte dans le parcours Grok, et non d’un choix distinct de fournisseur de recherche web de premier niveau. Si vous choisissez un autre fournisseur, OpenClaw n’affiche pas
l’invite `x_search`.

### Stockage des clés d’API

<Tabs>
  <Tab title="Config file">
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
  <Tab title="Environment variable">
    Définissez la variable d’environnement du fournisseur dans l’environnement du processus Gateway :

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Pour une installation de Gateway, placez-la dans `~/.openclaw/.env`.
    Consultez [Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Paramètres de l’outil

| Paramètre             | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| `query`               | Requête de recherche (obligatoire)                            |
| `count`               | Résultats à renvoyer (1-10, valeur par défaut : 5)            |
| `country`             | Code pays ISO à 2 lettres (par ex. "US", "DE")                |
| `language`            | Code de langue ISO 639-1 (par ex. "en", "de")                 |
| `search_lang`         | Code de langue de recherche (Brave uniquement)                |
| `freshness`           | Filtre temporel : `day`, `week`, `month` ou `year`            |
| `date_after`          | Résultats après cette date (YYYY-MM-DD)                       |
| `date_before`         | Résultats avant cette date (YYYY-MM-DD)                       |
| `ui_lang`             | Code de langue de l’interface utilisateur (Brave uniquement)  |
| `domain_filter`       | Tableau de liste d’autorisation/de blocage de domaines (Perplexity uniquement) |
| `max_tokens`          | Budget total de contenu, 25000 par défaut (Perplexity uniquement) |
| `max_tokens_per_page` | Limite de jetons par page, 2048 par défaut (Perplexity uniquement) |

<Warning>
  Tous les paramètres ne fonctionnent pas avec tous les fournisseurs. Le mode `llm-context` de Brave
  rejette `ui_lang`, `freshness`, `date_after` et `date_before`.
  Gemini, Grok et Kimi renvoient une seule réponse synthétisée avec des citations. Ils
  acceptent `count` pour la compatibilité avec les outils partagés, mais cela ne modifie pas la
  forme de la réponse ancrée.
  Perplexity se comporte de la même manière lorsque vous utilisez le chemin de compatibilité Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`).
  SearXNG accepte `http://` uniquement pour les hôtes de réseau privé de confiance ou local loopback ;
  les points de terminaison SearXNG publics doivent utiliser `https://`.
  Firecrawl et Tavily ne prennent en charge que `query` et `count` via `web_search`
  -- utilisez leurs outils dédiés pour les options avancées.
</Warning>

## x_search

`x_search` interroge les publications X (anciennement Twitter) avec xAI et renvoie
des réponses synthétisées par l’IA avec des citations. Il accepte les requêtes en langage naturel et
des filtres structurés facultatifs. OpenClaw n’active l’outil `x_search` xAI intégré
que sur la requête qui sert cet appel d’outil.

<Note>
  xAI indique que `x_search` prend en charge la recherche par mot-clé, la recherche sémantique, la recherche d’utilisateur
  et la récupération de fil. Pour les statistiques d’engagement par publication, comme les repartages,
  les réponses, les signets ou les vues, préférez une recherche ciblée avec l’URL exacte de la publication
  ou l’identifiant de statut. Les recherches larges par mot-clé peuvent trouver la bonne publication, mais renvoyer des
  métadonnées par publication moins complètes. Un bon modèle consiste à localiser d’abord la publication, puis
  à exécuter une deuxième requête `x_search` centrée sur cette publication exacte.
</Note>

### Configuration de x_search

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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### Paramètres de x_search

| Paramètre                    | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `query`                      | Requête de recherche (obligatoire)                           |
| `allowed_x_handles`          | Restreindre les résultats à des identifiants X précis        |
| `excluded_x_handles`         | Exclure des identifiants X précis                            |
| `from_date`                  | Inclure uniquement les publications à cette date ou après (YYYY-MM-DD) |
| `to_date`                    | Inclure uniquement les publications à cette date ou avant (YYYY-MM-DD) |
| `enable_image_understanding` | Autoriser xAI à inspecter les images jointes aux publications correspondantes |
| `enable_video_understanding` | Autoriser xAI à inspecter les vidéos jointes aux publications correspondantes |

### Exemple de x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Exemples

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
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
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Associés

- [Web Fetch](/fr/tools/web-fetch) -- récupérer une URL et extraire le contenu lisible
- [Web Browser](/fr/tools/browser) -- automatisation complète du navigateur pour les sites à forte charge JavaScript
- [Recherche Grok](/fr/tools/grok-search) -- Grok comme fournisseur `web_search`
- [Recherche web Ollama](/fr/tools/ollama-search) -- recherche web sans clé via votre hôte Ollama
