---
read_when:
    - Vous souhaitez activer ou configurer web_search
    - Vous souhaitez activer ou configurer x_search
    - Vous devez choisir un fournisseur de recherche
    - Vous souhaitez comprendre la détection automatique et le repli de fournisseur
sidebarTitle: Web Search
summary: web_search, x_search et web_fetch — rechercher sur le web, rechercher des publications X ou récupérer le contenu d’une page
title: Recherche web
x-i18n:
    generated_at: "2026-04-23T07:12:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e568670e1e15f195dbac1a249723a2ad873d6c49217575959b8eea2cb14ef75
    source_path: tools/web.md
    workflow: 15
---

# Recherche web

L’outil `web_search` effectue une recherche sur le web avec votre fournisseur configuré et
renvoie les résultats. Les résultats sont mis en cache par requête pendant 15 minutes (configurable).

OpenClaw inclut aussi `x_search` pour les publications X (anciennement Twitter) et
`web_fetch` pour la récupération légère d’URL. Dans cette phase, `web_fetch` reste
local tandis que `web_search` et `x_search` peuvent utiliser xAI Responses en arrière-plan.

<Info>
  `web_search` est un outil HTTP léger, pas de l’automatisation de navigateur. Pour les
  sites riches en JS ou les connexions, utilisez le [Navigateur web](/fr/tools/browser). Pour
  récupérer une URL spécifique, utilisez [Web Fetch](/fr/tools/web-fetch).
</Info>

## Démarrage rapide

<Steps>
  <Step title="Choisir un fournisseur">
    Choisissez un fournisseur et effectuez toute configuration requise. Certains fournisseurs
    ne nécessitent pas de clé, tandis que d’autres utilisent des clés API. Voir les pages des fournisseurs ci-dessous pour plus de
    détails.
  </Step>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    ```
    Cela enregistre le fournisseur et tout identifiant nécessaire. Vous pouvez aussi définir une variable d’environnement
    (par exemple `BRAVE_API_KEY`) et ignorer cette étape pour les
    fournisseurs appuyés sur API.
  </Step>
  <Step title="L’utiliser">
    L’agent peut maintenant appeler `web_search` :

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Pour les publications X, utilisez :

    ```javascript
    await x_search({ query: "recettes de dîner" });
    ```

  </Step>
</Steps>

## Choisir un fournisseur

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/fr/tools/brave-search">
    Résultats structurés avec extraits. Prend en charge le mode `llm-context`, les filtres pays/langue. Niveau gratuit disponible.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fr/tools/duckduckgo-search">
    Repli sans clé. Aucune clé API requise. Intégration non officielle fondée sur HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fr/tools/exa-search">
    Recherche neuronale + par mots-clés avec extraction de contenu (surlignages, texte, résumés).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fr/tools/firecrawl">
    Résultats structurés. S’associe au mieux avec `firecrawl_search` et `firecrawl_scrape` pour une extraction approfondie.
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
    Recherche sans clé via votre hôte Ollama configuré. Nécessite `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/fr/tools/perplexity-search">
    Résultats structurés avec contrôles d’extraction de contenu et filtrage de domaine.
  </Card>
  <Card title="SearXNG" icon="server" href="/fr/tools/searxng-search">
    Méta-recherche auto-hébergée. Aucune clé API requise. Agrège Google, Bing, DuckDuckGo et plus encore.
  </Card>
  <Card title="Tavily" icon="globe" href="/fr/tools/tavily">
    Résultats structurés avec profondeur de recherche, filtrage thématique et `tavily_extract` pour l’extraction d’URL.
  </Card>
</CardGroup>

### Comparaison des fournisseurs

| Fournisseur                                | Style de résultat            | Filtres                                          | Clé API                                                                           |
| ------------------------------------------ | ---------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [Brave](/fr/tools/brave-search)               | Extraits structurés          | Pays, langue, temps, mode `llm-context`          | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/fr/tools/duckduckgo-search)     | Extraits structurés          | --                                               | Aucune (sans clé)                                                                 |
| [Exa](/fr/tools/exa-search)                   | Structuré + extrait          | Mode neuronal/mots-clés, date, extraction de contenu | `EXA_API_KEY`                                                                  |
| [Firecrawl](/fr/tools/firecrawl)              | Extraits structurés          | Via l’outil `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/fr/tools/gemini-search)             | Synthétisé par IA + citations | --                                              | `GEMINI_API_KEY`                                                                  |
| [Grok](/fr/tools/grok-search)                 | Synthétisé par IA + citations | --                                              | `XAI_API_KEY`                                                                     |
| [Kimi](/fr/tools/kimi-search)                 | Synthétisé par IA + citations | --                                              | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/fr/tools/minimax-search)    | Extraits structurés          | Région (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web Search](/fr/tools/ollama-search)  | Extraits structurés          | --                                               | Aucune par défaut ; `ollama signin` requis, peut réutiliser l’auth bearer du fournisseur Ollama |
| [Perplexity](/fr/tools/perplexity-search)     | Extraits structurés          | Pays, langue, temps, domaines, limites de contenu | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                     |
| [SearXNG](/fr/tools/searxng-search)           | Extraits structurés          | Catégories, langue                               | Aucune (auto-hébergé)                                                             |
| [Tavily](/fr/tools/tavily)                    | Extraits structurés          | Via l’outil `tavily_search`                      | `TAVILY_API_KEY`                                                                  |

## Détection automatique

## Recherche web OpenAI native

Les modèles OpenAI Responses directs utilisent automatiquement l’outil `web_search` hébergé d’OpenAI lorsque la recherche web OpenClaw est activée et qu’aucun fournisseur géré n’est épinglé. Il s’agit d’un comportement appartenant au fournisseur dans le Plugin OpenAI intégré et il ne s’applique qu’au trafic API OpenAI natif, pas aux URL de base proxy compatibles OpenAI ni aux routes Azure. Définissez `tools.web.search.provider` sur un autre fournisseur tel que `brave` pour conserver l’outil géré `web_search` pour les modèles OpenAI, ou définissez `tools.web.search.enabled: false` pour désactiver à la fois la recherche gérée et la recherche OpenAI native.

## Recherche web Codex native

Les modèles compatibles Codex peuvent facultativement utiliser l’outil `web_search` natif du fournisseur Responses à la place de la fonction gérée `web_search` d’OpenClaw.

- Configurez-le sous `tools.web.search.openaiCodex`
- Il ne s’active que pour les modèles compatibles Codex (`openai-codex/*` ou les fournisseurs utilisant `api: "openai-codex-responses"`)
- Le `web_search` géré continue de s’appliquer aux modèles non Codex
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

Si la recherche Codex native est activée mais que le modèle actuel n’est pas compatible Codex, OpenClaw conserve le comportement normal du `web_search` géré.

## Configuration de la recherche web

Les listes de fournisseurs dans la documentation et les flux de configuration sont par ordre alphabétique. La détection automatique conserve un
ordre de priorité distinct.

Si aucun `provider` n’est défini, OpenClaw vérifie les fournisseurs dans cet ordre et utilise le
premier qui est prêt :

D’abord les fournisseurs appuyés sur API :

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordre 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordre 15)
3. **Gemini** -- `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey` (ordre 20)
4. **Grok** -- `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordre 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordre 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordre 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordre 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey` (ordre 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordre 70)

Puis les replis sans clé :

10. **DuckDuckGo** -- repli HTML sans clé, sans compte ni clé API (ordre 100)
11. **Ollama Web Search** -- repli sans clé via votre hôte Ollama configuré ; nécessite qu’Ollama soit joignable et connecté avec `ollama signin`, et peut réutiliser l’auth bearer du fournisseur Ollama si l’hôte en a besoin (ordre 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordre 200)

Si aucun fournisseur n’est détecté, il revient à Brave (vous obtiendrez une
erreur de clé manquante vous invitant à en configurer une).

<Note>
  Tous les champs de clé de fournisseur prennent en charge les objets SecretRef. Les SecretRefs limités au Plugin
  sous `plugins.entries.<plugin>.config.webSearch.apiKey` sont résolus pour les fournisseurs intégrés
  Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity et Tavily
  que le fournisseur soit choisi explicitement via `tools.web.search.provider` ou
  sélectionné via la détection automatique. En mode détection automatique, OpenClaw ne résout que la
  clé du fournisseur sélectionné — les SecretRefs non sélectionnés restent inactifs, ce qui vous permet
  de garder plusieurs fournisseurs configurés sans payer le coût de résolution pour
  ceux que vous n’utilisez pas.
</Note>

## Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // ou omettre pour la détection automatique
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configuration spécifique au fournisseur (clés API, URL de base, modes) se trouve sous
`plugins.entries.<plugin>.config.webSearch.*`. Voir les pages des fournisseurs pour
des exemples.

La sélection du fournisseur de repli `web_fetch` est distincte :

- choisissez-la avec `tools.web.fetch.provider`
- ou omettez ce champ et laissez OpenClaw détecter automatiquement le premier fournisseur web-fetch prêt à partir des identifiants disponibles
- aujourd’hui, le fournisseur web-fetch intégré est Firecrawl, configuré sous
  `plugins.entries.firecrawl.config.webFetch.*`

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut aussi demander :

- la région API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- le modèle de recherche web Kimi par défaut (par défaut `kimi-k2.6`)

Pour `x_search`, configurez `plugins.entries.xai.config.xSearch.*`. Il utilise le
même repli `XAI_API_KEY` que la recherche web Grok.
L’ancienne configuration `tools.web.x_search.*` est migrée automatiquement par `openclaw doctor --fix`.
Lorsque vous choisissez Grok pendant `openclaw onboard` ou `openclaw configure --section web`,
OpenClaw peut aussi proposer une configuration facultative `x_search` avec la même clé.
Il s’agit d’une étape de suivi distincte dans le chemin Grok, pas d’un choix de niveau supérieur
séparé pour le fournisseur de recherche web. Si vous choisissez un autre fournisseur, OpenClaw n’affiche pas
l’invite `x_search`.

### Stockage des clés API

<Tabs>
  <Tab title="Fichier de configuration">
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
    Définissez la variable d’environnement du fournisseur dans l’environnement du processus Gateway :

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Pour une installation Gateway, placez-la dans `~/.openclaw/.env`.
    Voir [Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Paramètres de l’outil

| Paramètre             | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Requête de recherche (obligatoire)                    |
| `count`               | Résultats à renvoyer (1-10, par défaut : 5)           |
| `country`             | Code pays ISO à 2 lettres (par ex. "US", "DE")        |
| `language`            | Code de langue ISO 639-1 (par ex. "en", "de")         |
| `search_lang`         | Code de langue de recherche (Brave uniquement)        |
| `freshness`           | Filtre temporel : `day`, `week`, `month` ou `year`    |
| `date_after`          | Résultats après cette date (YYYY-MM-DD)               |
| `date_before`         | Résultats avant cette date (YYYY-MM-DD)               |
| `ui_lang`             | Code de langue de l’interface (Brave uniquement)      |
| `domain_filter`       | Tableau de liste d’autorisation/de refus de domaines (Perplexity uniquement) |
| `max_tokens`          | Budget total de contenu, par défaut 25000 (Perplexity uniquement) |
| `max_tokens_per_page` | Limite de tokens par page, par défaut 2048 (Perplexity uniquement) |

<Warning>
  Tous les paramètres ne fonctionnent pas avec tous les fournisseurs. Le mode Brave `llm-context`
  rejette `ui_lang`, `freshness`, `date_after` et `date_before`.
  Gemini, Grok et Kimi renvoient une réponse synthétisée unique avec citations. Ils
  acceptent `count` pour la compatibilité avec l’outil partagé, mais cela ne modifie pas la
  forme de la réponse ancrée.
  Perplexity se comporte de la même manière lorsque vous utilisez le chemin de compatibilité
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`).
  SearXNG n’accepte `http://` que pour des hôtes de confiance sur réseau privé ou loopback ;
  les points de terminaison SearXNG publics doivent utiliser `https://`.
  Firecrawl et Tavily ne prennent en charge que `query` et `count` via `web_search`
  -- utilisez leurs outils dédiés pour les options avancées.
</Warning>

## x_search

`x_search` interroge les publications X (anciennement Twitter) via xAI et renvoie
des réponses synthétisées par IA avec citations. Il accepte des requêtes en langage naturel et
des filtres structurés facultatifs. OpenClaw n’active l’outil intégré `x_search` xAI
que pour la requête qui sert cet appel d’outil.

<Note>
  xAI documente `x_search` comme prenant en charge la recherche par mots-clés, la recherche sémantique, la recherche par utilisateur
  et la récupération de fil. Pour les statistiques par publication telles que reposts,
  replies, bookmarks ou views, préférez une recherche ciblée sur l’URL exacte de la publication
  ou son ID de statut. Les recherches larges par mots-clés peuvent trouver la bonne publication mais renvoyer des métadonnées par publication moins complètes. Un bon schéma consiste à : localiser d’abord la publication, puis
  exécuter une seconde requête `x_search` focalisée sur cette publication exacte.
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
            apiKey: "xai-...", // facultatif si XAI_API_KEY est défini
          },
        },
      },
    },
  },
}
```

### Paramètres de x_search

| Paramètre                    | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Requête de recherche (obligatoire)                     |
| `allowed_x_handles`          | Limiter les résultats à des handles X spécifiques      |
| `excluded_x_handles`         | Exclure des handles X spécifiques                      |
| `from_date`                  | N’inclure que les publications à partir de cette date (YYYY-MM-DD) |
| `to_date`                    | N’inclure que les publications jusqu’à cette date (YYYY-MM-DD) |
| `enable_image_understanding` | Permettre à xAI d’inspecter les images jointes aux publications correspondantes |
| `enable_video_understanding` | Permettre à xAI d’inspecter les vidéos jointes aux publications correspondantes |

### Exemple de x_search

```javascript
await x_search({
  query: "recettes de dîner",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistiques par publication : utilisez l’URL exacte du statut ou l’ID du statut lorsque c’est possible
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

// Filtrage de domaine (Perplexity uniquement)
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

- [Web Fetch](/fr/tools/web-fetch) -- récupérer une URL et extraire du contenu lisible
- [Navigateur web](/fr/tools/browser) -- automatisation complète du navigateur pour les sites riches en JS
- [Grok Search](/fr/tools/grok-search) -- Grok comme fournisseur `web_search`
- [Ollama Web Search](/fr/tools/ollama-search) -- recherche web sans clé via votre hôte Ollama
