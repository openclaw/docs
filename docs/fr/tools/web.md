---
read_when:
    - Vous voulez activer ou configurer web_search
    - Vous souhaitez activer ou configurer x_search
    - Vous devez choisir un fournisseur de recherche
    - Vous voulez comprendre la détection automatique et la sélection du fournisseur
sidebarTitle: Web Search
summary: web_search, x_search et web_fetch -- rechercher sur le web, rechercher des publications X ou récupérer le contenu d'une page
title: Recherche Web
x-i18n:
    generated_at: "2026-06-27T18:22:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

L’outil `web_search` recherche sur le Web à l’aide de votre fournisseur configuré et
renvoie des résultats. Les résultats sont mis en cache par requête pendant 15 minutes (configurable).

OpenClaw inclut également `x_search` pour les publications X (anciennement Twitter) et
`web_fetch` pour la récupération légère d’URL. À cette étape, `web_fetch` reste
local, tandis que `web_search` et `x_search` peuvent utiliser xAI Responses en arrière-plan.

<Info>
  `web_search` est un outil HTTP léger, pas une automatisation de navigateur. Pour les
  sites fortement dépendants de JS ou les connexions, utilisez le [navigateur Web](/fr/tools/browser). Pour
  récupérer une URL spécifique, utilisez [Web Fetch](/fr/tools/web-fetch).
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
    Cela stocke le fournisseur et tout identifiant nécessaire. Vous pouvez également définir une variable
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
  <Card title="Codex Hosted Search" icon="search" href="/fr/plugins/codex-harness">
    Réponses ancrées synthétisées par IA via votre compte de serveur d’application Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fr/tools/duckduckgo-search">
    Fournisseur sans clé. Aucune clé API requise. Intégration non officielle basée sur HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fr/tools/exa-search">
    Recherche neuronale + par mots-clés avec extraction de contenu (temps forts, texte, résumés).
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
    Réponses synthétisées par IA avec citations via la recherche Web Moonshot ; les solutions de repli vers une conversation non ancrée échouent explicitement.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fr/tools/minimax-search">
    Résultats structurés via l’API de recherche MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fr/tools/ollama-search">
    Recherche via un hôte Ollama local connecté ou l’API Ollama hébergée.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/fr/tools/parallel-search">
    API Parallel Search payante (`PARALLEL_API_KEY`) ; limites de débit plus élevées et réglage des objectifs.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/fr/tools/parallel-search">
    Option sans clé. Search MCP gratuit de Parallel, avec extraits denses optimisés pour les LLM et sans clé API.
  </Card>
  <Card title="Perplexity" icon="search" href="/fr/tools/perplexity-search">
    Résultats structurés avec contrôles d’extraction de contenu et filtrage par domaine.
  </Card>
  <Card title="SearXNG" icon="server" href="/fr/tools/searxng-search">
    Métarecherche auto-hébergée. Aucune clé API requise. Agrège Google, Bing, DuckDuckGo et plus encore.
  </Card>
  <Card title="Tavily" icon="globe" href="/fr/tools/tavily">
    Résultats structurés avec profondeur de recherche, filtrage par sujet et `tavily_extract` pour l’extraction d’URL.
  </Card>
</CardGroup>

### Comparaison des fournisseurs

| Fournisseur                                      | Style de résultat                                             | Filtres                                          | Clé API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fr/tools/brave-search)                     | Extraits structurés                                            | Pays, langue, heure, mode `llm-context`          | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/fr/plugins/codex-harness)    | Synthèse par IA + URL sources                                  | Domaines, taille du contexte, emplacement utilisateur | Aucune ; utilise la connexion Codex/OpenAI                                               |
| [DuckDuckGo](/fr/tools/duckduckgo-search)           | Extraits structurés                                            | --                                               | Aucune (sans clé)                                                                       |
| [Exa](/fr/tools/exa-search)                         | Structuré + extrait                                            | Mode neuronal/mots-clés, date, extraction de contenu | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fr/tools/firecrawl)                    | Extraits structurés                                            | Via l’outil `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fr/tools/gemini-search)                   | Synthèse par IA + citations                                    | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/fr/tools/grok-search)                       | Synthèse par IA + citations                                    | --                                               | OAuth xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`               |
| [Kimi](/fr/tools/kimi-search)                       | Synthèse par IA + citations ; échoue sur les solutions de repli vers une conversation non ancrée | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fr/tools/minimax-search)          | Extraits structurés                                            | Région (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/fr/tools/ollama-search)        | Extraits structurés                                            | --                                               | Aucune pour les hôtes locaux connectés ; `OLLAMA_API_KEY` pour la recherche directe `https://ollama.com` |
| [Parallel](/fr/tools/parallel-search)               | Extraits denses classés pour le contexte LLM                   | --                                               | `PARALLEL_API_KEY` (payant)                                                             |
| [Parallel Search (Free)](/fr/tools/parallel-search) | Extraits denses classés pour le contexte LLM                   | --                                               | Aucune (Search MCP gratuit)                                                             |
| [Perplexity](/fr/tools/perplexity-search)           | Extraits structurés                                            | Pays, langue, heure, domaines, limites de contenu | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fr/tools/searxng-search)                 | Extraits structurés                                            | Catégories, langue                               | Aucune (auto-hébergé)                                                                   |
| [Tavily](/fr/tools/tavily)                          | Extraits structurés                                            | Via l’outil `tavily_search`                      | `TAVILY_API_KEY`                                                                        |

## Détection automatique

## Recherche Web OpenAI native

Les modèles OpenAI Responses directs utilisent automatiquement l’outil `web_search` hébergé par OpenAI lorsque la recherche Web OpenClaw est activée et qu’aucun fournisseur géré n’est épinglé. Il s’agit d’un comportement détenu par le fournisseur dans le Plugin OpenAI groupé, qui ne s’applique qu’au trafic API OpenAI natif, pas aux URL de base de proxy compatibles OpenAI ni aux routes Azure. Définissez `tools.web.search.provider` sur un autre fournisseur, tel que `brave`, pour conserver l’outil `web_search` géré pour les modèles OpenAI, ou définissez `tools.web.search.enabled: false` pour désactiver à la fois la recherche gérée et la recherche OpenAI native.

## Recherche Web Codex native

Le runtime de serveur d’application Codex utilise automatiquement l’outil `web_search` hébergé par Codex
lorsque la recherche Web est activée et qu’aucun fournisseur géré n’est sélectionné. La recherche hébergée
native et l’outil dynamique `web_search` géré par OpenClaw s’excluent mutuellement,
de sorte que la recherche gérée ne peut pas contourner les restrictions de domaine natives. OpenClaw utilise l’outil
géré lorsque la recherche hébergée est indisponible, explicitement désactivée ou
remplacée par un fournisseur géré sélectionné. OpenClaw garde l’extension autonome
`web.run` de Codex désactivée, car le trafic de serveur d’application en production rejette son
espace de noms `web` défini par l’utilisateur.

- Configurez la recherche native sous `tools.web.search.openaiCodex`
- Définissez `tools.web.search.provider: "codex"` pour provisionner Codex Hosted Search comme
  fournisseur `web_search` géré pour n’importe quel modèle parent. Chaque appel exécute un
  tour éphémère borné du serveur d’application Codex et échoue si Codex n’émet pas un élément
  `webSearch` hébergé.
- `mode: "cached"` est la préférence par défaut, mais Codex la résout en accès
  externe en direct pour les tours de serveur d’application sans restriction ; définissez `"live"` pour demander
  explicitement un accès en direct
- Définissez `tools.web.search.provider` sur un fournisseur géré tel que `brave` pour utiliser
  le `web_search` géré par OpenClaw à la place
- Définissez `tools.web.search.openaiCodex.enabled: false` pour désactiver la recherche
  hébergée par Codex ; les autres fournisseurs gérés restent disponibles
- Restreindre la surface d’outil native de Codex maintient également `web_search` géré
  disponible
- Lorsque `allowedDomains` est défini, la solution de repli gérée automatique échoue de façon fermée si
  la recherche hébergée est indisponible, afin que la liste d’autorisation native ne puisse pas être contournée
- Les exécutions LLM uniquement avec outils désactivés désactivent à la fois la recherche native et gérée
- `tools.web.search.enabled: false` désactive à la fois la recherche gérée et native

Les changements persistants de politique de recherche Codex effective démarrent un nouveau fil lié afin
qu’un fil de serveur d’application déjà chargé ne puisse pas conserver un accès de recherche hébergée obsolète.
Les restrictions transitoires par tour utilisent un fil restreint temporaire et préservent
la liaison existante pour une reprise ultérieure.

Le trafic OpenAI ChatGPT Responses direct peut également utiliser l’outil
`web_search` hébergé par OpenAI. Ce chemin distinct reste optionnel via
`tools.web.search.openaiCodex.enabled: true` et ne s’applique qu’aux modèles
`openai/*` éligibles utilisant `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

Pour les runtimes et fournisseurs qui ne prennent pas en charge la recherche Codex native, Codex peut
utiliser la solution de repli `web_search` gérée via l’espace de noms d’outils dynamiques d’OpenClaw.
Utilisez un fournisseur géré explicite lorsque vous avez besoin des contrôles réseau propres au fournisseur
d’OpenClaw au lieu de la recherche hébergée par Codex.

La sélection de `provider: "codex"` active le plugin `codex` groupé et utilise les
mêmes restrictions `tools.web.search.openaiCodex` indiquées ci-dessus. Authentifiez
d'abord le serveur d'application Codex avec `openclaw models auth login --provider openai`.
L'agent parent peut utiliser n'importe quel modèle ou runtime ; seul le worker de
recherche bornée passe par Codex.

## Sécurité réseau

Les appels au fournisseur HTTP géré `web_search` utilisent le chemin fetch protégé d'OpenClaw. Pour
les hôtes d'API de fournisseurs de confiance, OpenClaw autorise les réponses DNS
fake-IP de Surge, Clash et sing-box dans `198.18.0.0/15` et `fc00::/7` uniquement pour ce nom d'hôte de fournisseur.
Les autres destinations privées, loopback, link-local et de métadonnées restent bloquées.
Codex Hosted Search est l'exception : son worker borné délègue l'accès réseau
à l'outil `web_search` hébergé du serveur d'application Codex.

Cette autorisation automatique ne s'applique pas aux URL `web_fetch` arbitraires. Pour
`web_fetch`, activez `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` et
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` explicitement uniquement lorsque votre
proxy de confiance possède ces plages synthétiques.

## Configuration de la recherche web

Les listes de fournisseurs dans la documentation et les flux de configuration sont alphabétiques. L'auto-détection conserve un
ordre de priorité séparé.

Si aucun `provider` n'est défini, OpenClaw vérifie les fournisseurs dans cet ordre et utilise le
premier qui est prêt :

Fournisseurs adossés à une API d'abord :

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordre 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordre 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` ou `models.providers.google.apiKey` (ordre 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordre 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordre 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordre 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordre 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey` ; `plugins.entries.exa.config.webSearch.baseUrl` facultatif remplace le point de terminaison Exa (ordre 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordre 70)
10. **Parallel** -- API Parallel Search payante via `PARALLEL_API_KEY` ou `plugins.entries.parallel.config.webSearch.apiKey` ; `plugins.entries.parallel.config.webSearch.baseUrl` facultatif remplace le point de terminaison (ordre 75)

Fournisseurs de points de terminaison configurés ensuite :

11. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordre 200)

Les fournisseurs sans clé tels que **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** et **Codex Hosted Search** ne sont disponibles que lorsque vous
les sélectionnez explicitement avec `tools.web.search.provider` ou via
`openclaw configure --section web`. OpenClaw n'envoie pas les requêtes
`web_search` gérées à un fournisseur sans clé simplement parce qu'aucun fournisseur adossé à une API
n'est configuré.

Les modèles OpenAI Responses font exception : tant que `tools.web.search.provider` n'est
pas défini, ils utilisent la recherche web native d'OpenAI au lieu des fournisseurs gérés
ci-dessus. Définissez `tools.web.search.provider` sur `parallel-free` (ou un autre fournisseur)
pour les router via le chemin géré.

<Note>
  Tous les champs de clé de fournisseur prennent en charge les objets SecretRef. Les SecretRefs à portée de plugin
  sous `plugins.entries.<plugin>.config.webSearch.apiKey` sont résolus pour les
  fournisseurs de recherche web adossés à une API installés, notamment Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity et Tavily,
  que le fournisseur soit choisi explicitement via `tools.web.search.provider` ou
  sélectionné par auto-détection. En mode auto-détection, OpenClaw ne résout que la
  clé du fournisseur sélectionné -- les SecretRefs non sélectionnées restent inactives, ce qui vous permet de
  conserver plusieurs fournisseurs configurés sans payer le coût de résolution de ceux
  que vous n'utilisez pas.
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

La configuration propre au fournisseur (clés d'API, URL de base, modes) se trouve sous
`plugins.entries.<plugin>.config.webSearch.*`. Gemini peut aussi réutiliser
`models.providers.google.apiKey` et `models.providers.google.baseUrl` comme solutions de repli
de priorité inférieure après sa configuration dédiée de recherche web et `GEMINI_API_KEY`. Consultez les
pages des fournisseurs pour des exemples.
Grok peut aussi réutiliser un profil d'authentification xAI OAuth provenant de `openclaw models auth login
--provider xai --method oauth` ; la configuration par clé d'API reste la solution de repli.

`tools.web.search.provider` est validé par rapport aux identifiants de fournisseurs de recherche web
déclarés par les manifestes de plugins groupés et installés. Une faute de frappe telle que `"brvae"`
échoue à la validation de configuration au lieu de revenir silencieusement à l'auto-détection. Si un
fournisseur configuré ne dispose que de preuves de plugin obsolètes, comme un bloc
`plugins.entries.<plugin>` résiduel après la désinstallation d'un plugin tiers,
OpenClaw garde le démarrage résilient et signale un avertissement afin que vous puissiez réinstaller le
plugin ou exécuter `openclaw doctor --fix` pour nettoyer la configuration obsolète.

La sélection du fournisseur de repli `web_fetch` est séparée :

- choisissez-le avec `tools.web.fetch.provider`
- ou omettez ce champ et laissez OpenClaw auto-détecter le premier fournisseur web-fetch
  prêt à partir des identifiants configurés
- `web_fetch` non sandboxé peut utiliser les fournisseurs de plugins installés qui déclarent
  `contracts.webFetchProviders` ; les fetches sandboxés autorisent les fournisseurs groupés et
  les installations vérifiées de plugins officiels, mais excluent les plugins externes tiers
- le plugin officiel Firecrawl fournit le repli web-fetch, configuré sous
  `plugins.entries.firecrawl.config.webFetch.*`

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut aussi demander :

- la région de l'API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- le modèle de recherche web Kimi par défaut (par défaut `kimi-k2.6`)

Pour `x_search`, configurez `plugins.entries.xai.config.xSearch.*`. Il utilise le
même profil d'authentification xAI que le chat, ou l'identifiant `XAI_API_KEY` / de recherche web de plugin
utilisé par la recherche web Grok.
La configuration héritée `tools.web.x_search.*` est migrée automatiquement par `openclaw doctor --fix`.
Lorsque vous choisissez Grok pendant `openclaw onboard` ou `openclaw configure --section web`,
OpenClaw peut aussi proposer la configuration facultative de `x_search` avec le même identifiant.
Il s'agit d'une étape de suivi séparée dans le chemin Grok, et non d'un choix séparé de fournisseur de recherche web
de premier niveau. Si vous choisissez un autre fournisseur, OpenClaw n'affiche pas
l'invite `x_search`.

### Stockage des clés d'API

<Tabs>
  <Tab title="Fichier de configuration">
    Exécutez `openclaw configure --section web` ou définissez la clé directement :

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
  <Tab title="Variable d'environnement">
    Définissez la variable d'environnement du fournisseur dans l'environnement du processus Gateway :

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Pour une installation de gateway, placez-la dans `~/.openclaw/.env`.
    Consultez [Variables d'environnement](/fr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Paramètres de l'outil

| Paramètre             | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Requête de recherche (obligatoire)                    |
| `count`               | Résultats à renvoyer (1-10, par défaut : 5)           |
| `country`             | Code pays ISO à 2 lettres (par ex. "US", "DE")        |
| `language`            | Code de langue ISO 639-1 (par ex. "en", "de")        |
| `search_lang`         | Code de langue de recherche (Brave uniquement)        |
| `freshness`           | Filtre temporel : `day`, `week`, `month` ou `year`    |
| `date_after`          | Résultats après cette date (YYYY-MM-DD)               |
| `date_before`         | Résultats avant cette date (YYYY-MM-DD)               |
| `ui_lang`             | Code de langue de l'interface (Brave uniquement)      |
| `domain_filter`       | Tableau de liste d'autorisation/refus de domaines (Perplexity uniquement) |
| `max_tokens`          | Budget total de contenu, 25000 par défaut (Perplexity uniquement) |
| `max_tokens_per_page` | Limite de tokens par page, 2048 par défaut (Perplexity uniquement) |

<Warning>
  Tous les paramètres ne fonctionnent pas avec tous les fournisseurs. Le mode Brave `llm-context`
  rejette `ui_lang` ; `date_before` nécessite aussi `date_after` parce que les plages de
  fraîcheur personnalisées Brave exigent à la fois une date de début et une date de fin.
  Gemini, Grok et Kimi renvoient une réponse synthétisée avec des citations. Ils
  acceptent `count` pour la compatibilité avec l'outil partagé, mais cela ne modifie pas la
  forme de réponse ancrée dans les sources. Gemini traite la fraîcheur `day` comme une indication de récence ; les valeurs de
  fraîcheur plus larges et les dates explicites définissent les plages temporelles de grounding Google Search.
  Perplexity se comporte de la même façon lorsque vous utilisez le chemin de compatibilité
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`).
  SearXNG accepte `http://` uniquement pour les hôtes de réseau privé ou loopback de confiance ;
  les points de terminaison SearXNG publics doivent utiliser `https://`.
  Firecrawl et Tavily ne prennent en charge que `query` et `count` via `web_search`
  -- utilisez leurs outils dédiés pour les options avancées.
</Warning>

## x_search

Les requêtes `x_search` recherchent des publications X (anciennement Twitter) avec xAI et renvoient
des réponses synthétisées par l'IA avec des citations. L'outil accepte les requêtes en langage naturel et
les filtres structurés facultatifs. OpenClaw n'active l'outil `x_search` xAI intégré
que sur la requête qui sert cet appel d'outil.

<Note>
  xAI documente `x_search` comme prenant en charge la recherche par mots-clés, la recherche sémantique, la recherche d'utilisateur
  et la récupération de fils. Pour les statistiques d'engagement par publication telles que les reposts,
  les réponses, les signets ou les vues, préférez une recherche ciblée de l'URL exacte de la publication
  ou de l'ID de statut. Les recherches larges par mots-clés peuvent trouver la bonne publication mais renvoyer des
  métadonnées par publication moins complètes. Un bon schéma consiste à localiser d'abord la publication, puis à
  exécuter une seconde requête `x_search` centrée sur cette publication exacte.
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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
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
il se replie sur `plugins.entries.xai.config.webSearch.baseUrl`, puis sur
l'ancien `tools.web.search.grok.baseUrl`, et enfin sur le point de terminaison xAI public.

### Paramètres de x_search

| Paramètre                    | Description                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| `query`                      | Requête de recherche (obligatoire)                             |
| `allowed_x_handles`          | Limiter les résultats à des identifiants X précis              |
| `excluded_x_handles`         | Exclure des identifiants X précis                              |
| `from_date`                  | Inclure uniquement les publications à partir de cette date (YYYY-MM-DD) |
| `to_date`                    | Inclure uniquement les publications jusqu’à cette date incluse (YYYY-MM-DD) |
| `enable_image_understanding` | Autoriser xAI à inspecter les images jointes aux publications correspondantes |
| `enable_video_understanding` | Autoriser xAI à inspecter les vidéos jointes aux publications correspondantes |

### Exemple x_search

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

- [Récupération Web](/fr/tools/web-fetch) -- récupérer une URL et extraire le contenu lisible
- [Navigateur Web](/fr/tools/browser) -- automatisation complète du navigateur pour les sites fortement dépendants de JS
- [Recherche Grok](/fr/tools/grok-search) -- Grok comme fournisseur de `web_search`
- [Recherche Web Ollama](/fr/tools/ollama-search) -- recherche Web sans clé via votre hôte Ollama
