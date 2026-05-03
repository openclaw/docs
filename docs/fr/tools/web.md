---
read_when:
    - Vous voulez activer ou configurer web_search
    - Vous souhaitez activer ou configurer x_search
    - Vous devez choisir un fournisseur de recherche
    - Vous voulez comprendre la détection automatique et le basculement de fournisseur
sidebarTitle: Web Search
summary: web_search, x_search et web_fetch -- rechercher sur le Web, rechercher des publications X ou récupérer le contenu d’une page
title: Recherche Web
x-i18n:
    generated_at: "2026-05-03T21:40:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84de67b51f02e3b901bfa55017ae8e88de49295dfe6ed1103a45f034e073c087
    source_path: tools/web.md
    workflow: 16
---

L’outil `web_search` effectue des recherches sur le Web avec le fournisseur que vous avez configuré et
renvoie des résultats. Les résultats sont mis en cache par requête pendant 15 minutes (configurable).

OpenClaw inclut aussi `x_search` pour les publications X (anciennement Twitter) et
`web_fetch` pour la récupération légère d’URL. À cette étape, `web_fetch` reste
local tandis que `web_search` et `x_search` peuvent utiliser xAI Responses en arrière-plan.

<Info>
  `web_search` est un outil HTTP léger, pas une automatisation de navigateur. Pour
  les sites très dépendants de JS ou les connexions, utilisez le [Navigateur Web](/fr/tools/browser). Pour
  récupérer une URL précise, utilisez [Web Fetch](/fr/tools/web-fetch).
</Info>

## Démarrage rapide

<Steps>
  <Step title="Choose a provider">
    Choisissez un fournisseur et effectuez toute configuration requise. Certains fournisseurs sont
    sans clé, tandis que d’autres utilisent des clés API. Consultez les pages des fournisseurs ci-dessous pour
    plus de détails.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Cela stocke le fournisseur et tout identifiant nécessaire. Vous pouvez aussi définir une variable
    d’environnement (par exemple `BRAVE_API_KEY`) et ignorer cette étape pour les fournisseurs
    basés sur une API.
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
    Résultats structurés avec extraits. Prend en charge le mode `llm-context` et les filtres par pays/langue. Offre gratuite disponible.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fr/tools/duckduckgo-search">
    Solution de repli sans clé. Aucune clé API requise. Intégration non officielle basée sur HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fr/tools/exa-search">
    Recherche neuronale + par mots-clés avec extraction de contenu (mises en évidence, texte, résumés).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fr/tools/firecrawl">
    Résultats structurés. À associer de préférence à `firecrawl_search` et `firecrawl_scrape` pour une extraction approfondie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fr/tools/gemini-search">
    Réponses synthétisées par IA avec citations via l’ancrage Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fr/tools/grok-search">
    Réponses synthétisées par IA avec citations via l’ancrage Web xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fr/tools/kimi-search">
    Réponses synthétisées par IA avec citations via la recherche Web Moonshot ; les replis vers une conversation non ancrée échouent explicitement.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fr/tools/minimax-search">
    Résultats structurés via l’API de recherche MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fr/tools/ollama-search">
    Recherche via un hôte Ollama local connecté ou l’API Ollama hébergée.
  </Card>
  <Card title="Perplexity" icon="search" href="/fr/tools/perplexity-search">
    Résultats structurés avec contrôles d’extraction de contenu et filtrage par domaine.
  </Card>
  <Card title="SearXNG" icon="server" href="/fr/tools/searxng-search">
    Métarecherche auto-hébergée. Aucune clé API requise. Agrège Google, Bing, DuckDuckGo, et plus encore.
  </Card>
  <Card title="Tavily" icon="globe" href="/fr/tools/tavily">
    Résultats structurés avec profondeur de recherche, filtrage par sujet et `tavily_extract` pour l’extraction d’URL.
  </Card>
</CardGroup>

### Comparaison des fournisseurs

| Fournisseur                               | Style de résultat                                             | Filtres                                          | Clé API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fr/tools/brave-search)              | Extraits structurés                                            | Pays, langue, temps, mode `llm-context`          | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/fr/tools/duckduckgo-search)    | Extraits structurés                                            | --                                               | Aucune (sans clé)                                                                       |
| [Exa](/fr/tools/exa-search)                  | Structuré + extrait                                            | Mode neuronal/par mots-clés, date, extraction de contenu | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fr/tools/firecrawl)             | Extraits structurés                                            | Via l’outil `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fr/tools/gemini-search)            | Synthétisé par IA + citations                                  | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/fr/tools/grok-search)                | Synthétisé par IA + citations                                  | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/fr/tools/kimi-search)                | Synthétisé par IA + citations ; échoue sur les replis vers une conversation non ancrée | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fr/tools/minimax-search)   | Extraits structurés                                            | Région (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/fr/tools/ollama-search) | Extraits structurés                                            | --                                               | Aucune pour les hôtes locaux connectés ; `OLLAMA_API_KEY` pour la recherche directe `https://ollama.com` |
| [Perplexity](/fr/tools/perplexity-search)    | Extraits structurés                                            | Pays, langue, temps, domaines, limites de contenu | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fr/tools/searxng-search)          | Extraits structurés                                            | Catégories, langue                               | Aucune (auto-hébergé)                                                                   |
| [Tavily](/fr/tools/tavily)                   | Extraits structurés                                            | Via l’outil `tavily_search`                      | `TAVILY_API_KEY`                                                                        |

## Détection automatique

## Recherche Web OpenAI native

Les modèles OpenAI Responses directs utilisent automatiquement l’outil `web_search` hébergé par OpenAI lorsque la recherche Web OpenClaw est activée et qu’aucun fournisseur géré n’est épinglé. Ce comportement appartient au fournisseur dans le Plugin OpenAI fourni et ne s’applique qu’au trafic API OpenAI natif, pas aux URL de base de proxy compatibles OpenAI ni aux routes Azure. Définissez `tools.web.search.provider` sur un autre fournisseur comme `brave` pour conserver l’outil `web_search` géré pour les modèles OpenAI, ou définissez `tools.web.search.enabled: false` pour désactiver à la fois la recherche gérée et la recherche OpenAI native.

## Recherche Web Codex native

Les modèles compatibles Codex peuvent éventuellement utiliser l’outil `web_search` Responses natif du fournisseur au lieu de la fonction `web_search` gérée par OpenClaw.

- Configurez-le sous `tools.web.search.openaiCodex`
- Il ne s’active que pour les modèles compatibles Codex (`openai-codex/*` ou les fournisseurs utilisant `api: "openai-codex-responses"`)
- `web_search` géré s’applique toujours aux modèles non Codex
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

Si la recherche Codex native est activée mais que le modèle actuel n’est pas compatible Codex, OpenClaw conserve le comportement `web_search` géré normal.

## Sécurité réseau

Les appels de fournisseur `web_search` gérés utilisent le chemin de récupération protégé d’OpenClaw. Pour
les hôtes d’API de fournisseur approuvés, OpenClaw autorise les réponses DNS à fausse IP
Surge, Clash et sing-box dans `198.18.0.0/15` et `fc00::/7` uniquement pour ce nom d’hôte de fournisseur.
Les autres destinations privées, local loopback, link-local et de métadonnées restent bloquées.

Cette autorisation automatique ne s’applique pas aux URL `web_fetch` arbitraires. Pour
`web_fetch`, activez explicitement `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` et
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` uniquement lorsque votre
proxy approuvé possède ces plages synthétiques.

## Configurer la recherche Web

Les listes de fournisseurs dans la documentation et les flux de configuration sont alphabétiques. La détection automatique conserve un
ordre de priorité séparé.

Si aucun `provider` n’est défini, OpenClaw vérifie les fournisseurs dans cet ordre et utilise le
premier qui est prêt :

Fournisseurs basés sur une API d’abord :

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordre 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordre 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, ou `models.providers.google.apiKey` (ordre 20)
4. **Grok** -- `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordre 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordre 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordre 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordre 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey` ; `plugins.entries.exa.config.webSearch.baseUrl` optionnel remplace le point de terminaison Exa (ordre 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordre 70)

Solutions de repli sans clé ensuite :

10. **DuckDuckGo** -- repli HTML sans clé, sans compte ni clé API (ordre 100)
11. **Ollama Web Search** -- repli sans clé via votre hôte Ollama local configuré lorsqu’il est accessible et connecté avec `ollama signin` ; peut réutiliser l’authentification bearer du fournisseur Ollama lorsque l’hôte en a besoin, et peut appeler la recherche directe `https://ollama.com` lorsqu’elle est configurée avec `OLLAMA_API_KEY` (ordre 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordre 200)

Si aucun fournisseur n’est détecté, il revient à Brave (vous obtiendrez une erreur de clé manquante
vous invitant à en configurer une).

<Note>
  Tous les champs de clé de fournisseur prennent en charge les objets SecretRef. Les SecretRefs au périmètre du Plugin
  sous `plugins.entries.<plugin>.config.webSearch.apiKey` sont résolus pour les
  fournisseurs de recherche Web basés sur une API fournis, notamment Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity et Tavily,
  que le fournisseur soit choisi explicitement via `tools.web.search.provider` ou
  sélectionné par détection automatique. En mode détection automatique, OpenClaw ne résout que la
  clé du fournisseur sélectionné -- les SecretRefs non sélectionnées restent inactives, ce qui vous permet de
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

La configuration propre au fournisseur (clés API, URL de base, modes) se trouve sous
`plugins.entries.<plugin>.config.webSearch.*`. Gemini peut aussi réutiliser
`models.providers.google.apiKey` et `models.providers.google.baseUrl` comme solutions de repli
de priorité inférieure après sa configuration de recherche web dédiée et `GEMINI_API_KEY`. Consultez les
pages des fournisseurs pour des exemples.

`tools.web.search.provider` est validé par rapport aux identifiants de fournisseurs de recherche web
déclarés par les manifestes de Plugin intégrés et installés. Une faute de frappe comme `"brvae"`
échoue à la validation de la configuration au lieu de revenir silencieusement à l’auto-détection. Si un
fournisseur configuré ne dispose que d’indices de Plugin obsolètes, comme un bloc
`plugins.entries.<plugin>` restant après la désinstallation d’un Plugin tiers,
OpenClaw conserve un démarrage résilient et signale un avertissement afin que vous puissiez réinstaller le
Plugin ou exécuter `openclaw doctor --fix` pour nettoyer la configuration obsolète.

La sélection du fournisseur de repli `web_fetch` est séparée :

- choisissez-la avec `tools.web.fetch.provider`
- ou omettez ce champ et laissez OpenClaw détecter automatiquement le premier fournisseur web-fetch
  prêt à partir des identifiants disponibles
- `web_fetch` hors bac à sable peut utiliser des fournisseurs de Plugin installés qui déclarent
  `contracts.webFetchProviders` ; les récupérations en bac à sable restent limitées aux fournisseurs intégrés
- aujourd’hui, le fournisseur web-fetch intégré est Firecrawl, configuré sous
  `plugins.entries.firecrawl.config.webFetch.*`

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut aussi demander :

- la région de l’API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- le modèle de recherche web Kimi par défaut (par défaut `kimi-k2.6`)

Pour `x_search`, configurez `plugins.entries.xai.config.xSearch.*`. Il utilise la
même solution de repli `XAI_API_KEY` que la recherche web Grok.
L’ancienne configuration `tools.web.x_search.*` est migrée automatiquement par `openclaw doctor --fix`.
Lorsque vous choisissez Grok pendant `openclaw onboard` ou `openclaw configure --section web`,
OpenClaw peut aussi proposer une configuration optionnelle de `x_search` avec la même clé.
Il s’agit d’une étape de suivi distincte dans le parcours Grok, et non d’un choix de fournisseur
de recherche web de premier niveau séparé. Si vous choisissez un autre fournisseur, OpenClaw n’affiche pas
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

    Pour une installation de Gateway, placez-la dans `~/.openclaw/.env`.
    Consultez [Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Paramètres de l’outil

| Paramètre             | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `query`               | Requête de recherche (obligatoire)                       |
| `count`               | Résultats à retourner (1-10, par défaut : 5)             |
| `country`             | Code pays ISO à 2 lettres (p. ex. "US", "DE")            |
| `language`            | Code de langue ISO 639-1 (p. ex. "en", "de")             |
| `search_lang`         | Code de langue de recherche (Brave uniquement)           |
| `freshness`           | Filtre temporel : `day`, `week`, `month` ou `year`       |
| `date_after`          | Résultats après cette date (YYYY-MM-DD)                  |
| `date_before`         | Résultats avant cette date (YYYY-MM-DD)                  |
| `ui_lang`             | Code de langue de l’interface (Brave uniquement)         |
| `domain_filter`       | Tableau de liste d’autorisation/de blocage de domaines (Perplexity uniquement) |
| `max_tokens`          | Budget total de contenu, 25000 par défaut (Perplexity uniquement) |
| `max_tokens_per_page` | Limite de tokens par page, 2048 par défaut (Perplexity uniquement) |

<Warning>
  Tous les paramètres ne fonctionnent pas avec tous les fournisseurs. Le mode `llm-context` de Brave
  rejette `ui_lang` ; `date_before` nécessite aussi `date_after`, car les plages
  de fraîcheur personnalisées de Brave exigent à la fois une date de début et une date de fin.
  Gemini, Grok et Kimi retournent une seule réponse synthétisée avec citations. Ils
  acceptent `count` pour la compatibilité avec l’outil partagé, mais cela ne change pas la
  forme de la réponse ancrée. Gemini prend en charge `freshness`, `date_after` et
  `date_before` en les convertissant en plages temporelles d’ancrage Google Search.
  Perplexity se comporte de la même manière lorsque vous utilisez le chemin de compatibilité
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`).
  SearXNG accepte `http://` uniquement pour les hôtes de réseau privé de confiance ou local loopback ;
  les points de terminaison SearXNG publics doivent utiliser `https://`.
  Firecrawl et Tavily ne prennent en charge que `query` et `count` via `web_search`
  -- utilisez leurs outils dédiés pour les options avancées.
</Warning>

## x_search

`x_search` interroge les publications X (anciennement Twitter) avec xAI et retourne
des réponses synthétisées par IA avec citations. Il accepte les requêtes en langage naturel et
des filtres structurés optionnels. OpenClaw n’active l’outil `x_search` xAI intégré
que pour la requête qui sert cet appel d’outil.

<Note>
  xAI documente `x_search` comme prenant en charge la recherche par mot-clé, la recherche sémantique, la recherche
  d’utilisateurs et la récupération de fils. Pour les statistiques d’engagement par publication, comme les repartages,
  les réponses, les signets ou les vues, préférez une recherche ciblée sur l’URL exacte de la publication
  ou l’identifiant de statut. Les recherches larges par mot-clé peuvent trouver la bonne publication, mais retourner des
  métadonnées par publication moins complètes. Un bon modèle consiste à : localiser d’abord la publication, puis
  exécuter une deuxième requête `x_search` centrée sur cette publication exacte.
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
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` publie vers `<baseUrl>/responses` lorsque
`plugins.entries.xai.config.xSearch.baseUrl` est défini. Si ce champ est omis,
il se rabat sur `plugins.entries.xai.config.webSearch.baseUrl`, puis sur
l’ancien `tools.web.search.grok.baseUrl`, et enfin sur le point de terminaison xAI public.

### Paramètres de x_search

| Paramètre                    | Description                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| `query`                      | Requête de recherche (obligatoire)                             |
| `allowed_x_handles`          | Restreindre les résultats à des identifiants X spécifiques     |
| `excluded_x_handles`         | Exclure des identifiants X spécifiques                         |
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

## Connexe

- [Web Fetch](/fr/tools/web-fetch) -- récupérer une URL et extraire du contenu lisible
- [Navigateur web](/fr/tools/browser) -- automatisation complète du navigateur pour les sites très dépendants de JS
- [Recherche Grok](/fr/tools/grok-search) -- Grok comme fournisseur `web_search`
- [Recherche web Ollama](/fr/tools/ollama-search) -- recherche web sans clé via votre hôte Ollama
