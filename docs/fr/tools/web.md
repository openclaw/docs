---
read_when:
    - Vous souhaitez activer ou configurer web_search
    - Vous souhaitez activer ou configurer x_search
    - Vous devez choisir un fournisseur de recherche.
    - Vous souhaitez comprendre la détection automatique et la sélection du fournisseur
sidebarTitle: Web Search
summary: web_search, x_search et web_fetch — recherchez sur le Web, recherchez des publications sur X ou récupérez le contenu d’une page
title: Recherche sur le Web
x-i18n:
    generated_at: "2026-07-12T03:26:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` effectue des recherches sur le Web avec le fournisseur configuré et renvoie
des résultats normalisés, mis en cache par requête pendant 15 minutes (durée configurable). OpenClaw
intègre également `x_search` pour les publications sur X (anciennement Twitter) et `web_fetch` pour
la récupération légère d’URL. `web_fetch` s’exécute toujours localement ; `web_search` passe
par xAI Responses lorsque Grok est le fournisseur, tandis que `x_search` utilise toujours
xAI Responses.

<Info>
  `web_search` est un outil HTTP léger, et non un outil d’automatisation de navigateur. Pour
  les sites qui dépendent fortement de JS ou nécessitent une connexion, utilisez le [navigateur Web](/fr/tools/browser). Pour
  récupérer une URL précise, utilisez [Web Fetch](/fr/tools/web-fetch).
</Info>

## Démarrage rapide

<Steps>
  <Step title="Choisir un fournisseur">
    Choisissez un fournisseur et effectuez toute configuration requise. Certains fournisseurs
    ne nécessitent pas de clé, tandis que d’autres exigent une clé API. Consultez les pages des fournisseurs ci-dessous pour
    plus de détails.
  </Step>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    ```
    Cette commande enregistre le fournisseur et les éventuels identifiants requis. Pour les fournisseurs
    reposant sur une API, vous pouvez à la place définir la variable d’environnement du fournisseur (par exemple
    `BRAVE_API_KEY`) et ignorer cette étape.
  </Step>
  <Step title="L’utiliser">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Pour les publications sur X :

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Choisir un fournisseur

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/fr/tools/brave-search">
    Résultats structurés avec extraits. Prend en charge le mode `llm-context` et les filtres par pays et langue. Une offre gratuite est disponible.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/fr/plugins/codex-harness">
    Réponses synthétisées par l’IA et étayées par des sources via votre compte de serveur d’application Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fr/tools/duckduckgo-search">
    Fournisseur sans clé. Aucune clé API requise. Intégration non officielle reposant sur HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fr/tools/exa-search">
    Recherche neuronale et par mots-clés avec extraction de contenu (passages clés, texte, résumés).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fr/tools/firecrawl">
    Résultats structurés. À associer de préférence à `firecrawl_search` et `firecrawl_scrape` pour une extraction approfondie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fr/tools/gemini-search">
    Réponses synthétisées par l’IA avec citations, fondées sur la recherche Google.
  </Card>
  <Card title="Grok" icon="zap" href="/fr/tools/grok-search">
    Réponses synthétisées par l’IA avec citations, fondées sur le Web via xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fr/tools/kimi-search">
    Réponses synthétisées par l’IA avec citations via la recherche Web de Moonshot ; les replis vers une conversation non étayée échouent explicitement.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fr/tools/minimax-search">
    Résultats structurés via l’API de recherche MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fr/tools/ollama-search">
    Recherche via un hôte Ollama local connecté ou l’API Ollama hébergée.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/fr/tools/parallel-search">
    API Parallel Search payante (`PARALLEL_API_KEY`) ; limites de débit plus élevées et ajustement des objectifs.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/fr/tools/parallel-search">
    Option sans clé activée explicitement. Le Search MCP gratuit de Parallel, avec des extraits denses optimisés pour les LLM et sans clé API.
  </Card>
  <Card title="Perplexity" icon="search" href="/fr/tools/perplexity-search">
    Résultats structurés avec contrôles d’extraction du contenu et filtrage par domaine.
  </Card>
  <Card title="SearXNG" icon="server" href="/fr/tools/searxng-search">
    Métarecherche auto-hébergée. Aucune clé API requise. Agrège Google, Bing, DuckDuckGo et d’autres services.
  </Card>
  <Card title="Tavily" icon="globe" href="/fr/tools/tavily">
    Résultats structurés avec profondeur de recherche, filtrage par sujet et `tavily_extract` pour l’extraction d’URL.
  </Card>
</CardGroup>

### Comparaison des fournisseurs

| Fournisseur                                      | Présentation des résultats                                      | Filtres                                          | Clé API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fr/tools/brave-search)                     | Extraits structurés                                            | Pays, langue, période, mode `llm-context`        | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/fr/plugins/codex-harness)    | Synthèse par l’IA + URL des sources                            | Domaines, taille du contexte, localisation de l’utilisateur | Aucune ; utilise la connexion Codex/OpenAI                                               |
| [DuckDuckGo](/fr/tools/duckduckgo-search)           | Extraits structurés                                            | --                                               | Aucune (sans clé)                                                                       |
| [Exa](/fr/tools/exa-search)                         | Résultats structurés + contenu extrait                         | Mode neuronal/par mots-clés, date, extraction du contenu | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fr/tools/firecrawl)                    | Extraits structurés                                            | Via l’outil `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fr/tools/gemini-search)                   | Synthèse par l’IA + citations                                  | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/fr/tools/grok-search)                       | Synthèse par l’IA + citations                                  | --                                               | OAuth xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`               |
| [Kimi](/fr/tools/kimi-search)                       | Synthèse par l’IA + citations ; échec lors des replis vers une conversation non étayée | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fr/tools/minimax-search)          | Extraits structurés                                            | Région (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/fr/tools/ollama-search)        | Extraits structurés                                            | --                                               | Aucune pour les hôtes locaux connectés ; `OLLAMA_API_KEY` pour une recherche directe sur `https://ollama.com` |
| [Parallel](/fr/tools/parallel-search)               | Extraits denses classés pour le contexte des LLM               | --                                               | `PARALLEL_API_KEY` (payante)                                                            |
| [Parallel Search (Free)](/fr/tools/parallel-search) | Extraits denses classés pour le contexte des LLM               | --                                               | Aucune (Search MCP gratuit)                                                             |
| [Perplexity](/fr/tools/perplexity-search)           | Extraits structurés                                            | Pays, langue, période, domaines, limites de contenu | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fr/tools/searxng-search)                 | Extraits structurés                                            | Catégories, langue                               | Aucune (auto-hébergé)                                                                   |
| [Tavily](/fr/tools/tavily)                          | Extraits structurés                                            | Via l’outil `tavily_search`                      | `TAVILY_API_KEY`                                                                        |

## Détection automatique

Les listes de fournisseurs dans la documentation et les parcours de configuration suivent l’ordre alphabétique. La détection automatique utilise un
ordre de priorité distinct et fixe, et ne choisit un fournisseur nécessitant un
identifiant (`requiresCredential !== false`) que lorsqu’elle en trouve un configuré. Si
aucun `provider` n’est défini, OpenClaw vérifie les fournisseurs dans l’ordre suivant et utilise
le premier qui est prêt :

D’abord, les fournisseurs reposant sur une API :

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordre 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordre 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` ou `models.providers.google.apiKey` (ordre 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordre 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordre 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordre 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordre 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey` ; l’option facultative `plugins.entries.exa.config.webSearch.baseUrl` remplace le point de terminaison Exa (ordre 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordre 70)
10. **Parallel** -- API Parallel Search payante via `PARALLEL_API_KEY` ou `plugins.entries.parallel.config.webSearch.apiKey` ; l’option facultative `plugins.entries.parallel.config.webSearch.baseUrl` remplace le point de terminaison (ordre 75)

Ensuite, les fournisseurs avec un point de terminaison configuré :

11. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordre 200)

Les fournisseurs sans clé tels que **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** et **Codex Hosted Search** ne sont jamais sélectionnés par la détection automatique,
même s’ils disposent d’une valeur d’ordre interne. Ils ne sont utilisés que lorsque vous
les sélectionnez explicitement avec `tools.web.search.provider` ou via
`openclaw configure --section web`. OpenClaw n’envoie pas les requêtes
`web_search` gérées à un fournisseur sans clé simplement parce qu’aucun fournisseur
reposant sur une API n’est configuré.

Les modèles OpenAI Responses constituent une exception : tant que `tools.web.search.provider`
n’est pas défini, ils utilisent la recherche Web native d’OpenAI au lieu des fournisseurs
gérés ci-dessus (voir plus bas). Définissez `tools.web.search.provider` sur
`parallel-free` (ou un autre fournisseur) pour les acheminer plutôt par le parcours géré.

<Note>
  Tous les champs de clé des fournisseurs prennent en charge les objets SecretRef. Les SecretRefs propres aux Plugins
  sous `plugins.entries.<plugin>.config.webSearch.apiKey` sont résolues pour les
  fournisseurs de recherche Web installés reposant sur une API, notamment Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity et Tavily,
  que le fournisseur soit choisi explicitement via `tools.web.search.provider` ou
  sélectionné par la détection automatique. En mode de détection automatique, OpenClaw résout uniquement la
  clé du fournisseur sélectionné ; les SecretRefs non sélectionnées restent inactives, ce qui vous permet de
  conserver plusieurs fournisseurs configurés sans payer le coût de résolution de ceux
  que vous n’utilisez pas.
</Note>

## Recherche Web native d’OpenAI

Les modèles OpenAI Responses directs (`api: "openai-responses"`, fournisseur `openai`,
sans URL de base ou avec une URL de base officielle de l’API OpenAI) utilisent automatiquement
l’outil `web_search` hébergé d’OpenAI lorsque la recherche web OpenClaw est activée et qu’aucun
fournisseur géré n’est épinglé. Ce comportement appartient au fournisseur dans le
Plugin OpenAI intégré et ne s’applique pas aux URL de base de proxys compatibles avec OpenAI ni aux
routes Azure. Définissez `tools.web.search.provider` sur un autre fournisseur tel que `brave` pour
conserver l’outil `web_search` géré pour les modèles OpenAI, ou définissez
`tools.web.search.enabled: false` pour désactiver à la fois la recherche gérée et la recherche
native d’OpenAI.

## Recherche web native de Codex

L’environnement d’exécution app-server de Codex utilise automatiquement l’outil `web_search`
hébergé de Codex lorsque la recherche web est activée et qu’aucun fournisseur géré n’est sélectionné.
La recherche hébergée native et l’outil dynamique `web_search` géré d’OpenClaw sont mutuellement
exclusifs, de sorte que la recherche gérée ne peut pas contourner les restrictions de domaine natives.
OpenClaw utilise l’outil géré lorsque la recherche hébergée est indisponible, explicitement désactivée
ou remplacée par un fournisseur géré sélectionné. OpenClaw maintient désactivée l’extension autonome
`web.run` de Codex (`features.standalone_web_search: false`), car le trafic app-server de production
rejette son espace de noms `web` défini par l’utilisateur.

- Configurez la recherche native sous `tools.web.search.openaiCodex`
- Définissez `tools.web.search.provider: "codex"` pour provisionner Codex Hosted Search en tant que
  fournisseur `web_search` géré pour n’importe quel modèle parent. Chaque appel exécute un tour
  app-server Codex éphémère et borné, et échoue si Codex n’émet pas d’élément
  `webSearch` hébergé.
- `mode: "cached"` est la préférence par défaut, mais Codex la résout en accès externe en direct
  pour les tours app-server sans restriction ; définissez `"live"` pour demander explicitement
  un accès en direct
- Définissez `tools.web.search.provider` sur un fournisseur géré tel que `brave` pour utiliser
  le `web_search` géré d’OpenClaw à la place
- Définissez `tools.web.search.openaiCodex.enabled: false` pour désactiver la recherche hébergée
  par Codex ; les autres fournisseurs gérés restent disponibles
- La restriction de la surface d’outils native de Codex maintient également le `web_search` géré
  disponible
- Lorsque `allowedDomains` est défini, le repli géré automatique échoue de manière fermée si
  la recherche hébergée est indisponible, afin que la liste d’autorisation native ne puisse pas
  être contournée
- Les exécutions uniquement par LLM avec les outils désactivés désactivent à la fois la recherche
  native et la recherche gérée
- `tools.web.search.enabled: false` désactive à la fois la recherche gérée et la recherche native

Les modifications persistantes de la politique de recherche Codex effective démarrent un nouveau fil
lié, afin qu’un fil app-server déjà chargé ne puisse pas conserver un accès obsolète à la recherche
hébergée. Les restrictions transitoires par tour utilisent un fil temporaire restreint et préservent
la liaison existante pour une reprise ultérieure.

Le trafic OpenAI ChatGPT Responses direct peut également utiliser l’outil `web_search`
hébergé d’OpenAI. Ce chemin distinct reste optionnel via
`tools.web.search.openaiCodex.enabled: true` et s’applique uniquement aux modèles
`openai/*` admissibles utilisant `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Facultatif : utiliser aussi Codex Hosted Search depuis des modèles parents non-Codex.
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

Pour les environnements d’exécution et les fournisseurs qui ne prennent pas en charge la recherche
Codex native, Codex peut utiliser le repli `web_search` géré via l’espace de noms d’outils dynamique
d’OpenClaw. Utilisez un fournisseur géré explicite lorsque vous avez besoin des contrôles réseau
propres au fournisseur d’OpenClaw plutôt que de la recherche hébergée par Codex.

La sélection de `provider: "codex"` active le Plugin `codex` intégré et utilise les mêmes
restrictions `tools.web.search.openaiCodex` présentées ci-dessus. Authentifiez d’abord
l’app-server Codex avec `openclaw models auth login --provider openai`.
L’agent parent peut utiliser n’importe quel modèle ou environnement d’exécution ; seul le processus
de recherche borné s’exécute via Codex.

## Sécurité réseau

Les appels de fournisseurs `web_search` HTTP gérés utilisent le chemin de récupération protégé
d’OpenClaw, limité au nom d’hôte propre au fournisseur actuel. Pour ce nom d’hôte uniquement,
OpenClaw autorise les réponses DNS de fausses adresses IP de Surge, Clash et sing-box dans
`198.18.0.0/15` et `fc00::/7`. Les autres destinations privées, local loopback,
locales au lien et de métadonnées restent bloquées. Codex Hosted Search constitue l’exception :
son processus borné délègue l’accès réseau à l’outil `web_search` hébergé de l’app-server Codex.

Cette autorisation automatique ne s’applique pas aux URL `web_fetch` arbitraires. Pour
`web_fetch`, activez explicitement `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` et
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` uniquement lorsque votre
proxy de confiance possède ces plages synthétiques.

## Configuration

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // valeur par défaut : true
        provider: "brave", // ou omettre pour la détection automatique
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configuration propre au fournisseur (clés d’API, URL de base, modes) se trouve sous
`plugins.entries.<plugin>.config.webSearch.*`. Gemini peut également réutiliser
`models.providers.google.apiKey` et `models.providers.google.baseUrl` comme replis de priorité
inférieure après sa configuration dédiée de recherche web et `GEMINI_API_KEY`. Consultez les
pages des fournisseurs pour obtenir des exemples.
Grok peut également réutiliser un profil d’authentification OAuth xAI provenant de
`openclaw models auth login --provider xai --method oauth` ; la configuration par clé d’API
reste le repli.

`tools.web.search.provider` est validé par rapport aux identifiants de fournisseurs de recherche web
déclarés par les manifestes des Plugins intégrés et installés. Une faute de frappe telle que `"brvae"`
fait échouer la validation de la configuration au lieu de revenir silencieusement à la détection
automatique. Si un fournisseur configuré ne dispose que de traces de Plugin obsolètes, comme un bloc
`plugins.entries.<plugin>` restant après la désinstallation d’un Plugin tiers,
OpenClaw maintient un démarrage résilient et signale un avertissement afin que vous puissiez
réinstaller le Plugin ou exécuter `openclaw doctor --fix` pour nettoyer la configuration obsolète.

La sélection du fournisseur de repli `web_fetch` est distincte :

- choisissez-le avec `tools.web.fetch.provider`
- ou omettez ce champ et laissez OpenClaw détecter automatiquement le premier fournisseur
  web-fetch prêt à l’emploi à partir des identifiants configurés
- `web_fetch` hors bac à sable peut utiliser les fournisseurs de Plugins installés qui déclarent
  `contracts.webFetchProviders` ; les récupérations en bac à sable autorisent les fournisseurs
  intégrés et les installations vérifiées de Plugins officiels, mais excluent les Plugins externes
  tiers
- le Plugin Firecrawl officiel est actuellement le seul contributeur intégré à
  `webFetchProviders`, configuré sous
  `plugins.entries.firecrawl.config.webFetch.*`

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut également demander :

- la région de l’API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- le modèle de recherche web Kimi par défaut (`kimi-k2.6` par défaut)

Pour `x_search`, configurez `plugins.entries.xai.config.xSearch.*`. Il utilise le
même profil d’authentification xAI que la discussion, ou l’identifiant `XAI_API_KEY` /
de recherche web du Plugin utilisé par la recherche web Grok.
L’ancienne configuration `tools.web.x_search.*` est migrée automatiquement par `openclaw doctor --fix`.
Lorsque vous choisissez Grok pendant `openclaw onboard` ou `openclaw configure --section web`,
OpenClaw propose également une configuration facultative de `x_search` avec le même identifiant,
juste après la fin de la configuration de Grok. Il s’agit d’une étape de suivi distincte au sein du
parcours Grok, et non d’un choix distinct de fournisseur de recherche web de premier niveau. Si vous
choisissez un autre fournisseur, OpenClaw n’affiche pas l’invite `x_search`.

### Stockage des clés d’API

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

    Pour une installation du Gateway, placez-la dans `~/.openclaw/.env`.
    Consultez [Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Paramètres de l’outil

| Paramètre             | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| `query`               | Requête de recherche (obligatoire)                                           |
| `count`               | Résultats à renvoyer (1 à 10, valeur par défaut : 5)                         |
| `country`             | Code pays ISO à 2 lettres (par ex. « US », « DE »)                           |
| `language`            | Code de langue ISO 639-1 (par ex. « en », « de »)                            |
| `search_lang`         | Code de langue de recherche (Brave uniquement)                               |
| `freshness`           | Filtre temporel : `day`, `week`, `month` ou `year`                           |
| `date_after`          | Résultats postérieurs à cette date (AAAA-MM-JJ)                              |
| `date_before`         | Résultats antérieurs à cette date (AAAA-MM-JJ)                               |
| `ui_lang`             | Code de langue de l’interface utilisateur (Brave uniquement)                 |
| `domain_filter`       | Tableau de domaines autorisés/interdits (Perplexity uniquement)              |
| `max_tokens`          | Budget total de jetons de contenu, API Perplexity Search native uniquement   |
| `max_tokens_per_page` | Limite d’extraction de jetons par page, API Perplexity Search native uniquement |

<Warning>
  Tous les paramètres ne fonctionnent pas avec tous les fournisseurs. Le mode
  `llm-context` de Brave rejette `ui_lang` ; `date_before` nécessite également
  `date_after`, car les plages de fraîcheur personnalisées de Brave requièrent
  une date de début et une date de fin.
  Gemini, Grok et Kimi renvoient une réponse synthétisée unique avec des citations. Ils
  acceptent `count` pour la compatibilité avec l’outil partagé, mais cela ne modifie pas
  la forme de la réponse étayée. Gemini traite la fraîcheur `day` comme une indication
  de récence ; les valeurs de fraîcheur plus larges et les dates explicites définissent
  des plages temporelles pour l’étayage par Google Search.
  Perplexity se comporte de la même manière lorsque vous utilisez le chemin de compatibilité
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`) ; ce chemin supprime également la prise en charge de
  `max_tokens` et `max_tokens_per_page`.
  SearXNG accepte `http://` uniquement pour les hôtes de réseau privé de confiance ou
  local loopback ; les points de terminaison SearXNG publics doivent utiliser `https://`.
  Firecrawl et Tavily ne prennent en charge que `query` et `count` via `web_search`
  — utilisez leurs outils dédiés pour les options avancées.
</Warning>

## x_search

`x_search` interroge les publications X (anciennement Twitter) à l’aide de xAI et renvoie
des réponses synthétisées par l’IA avec des citations. Il accepte les requêtes en langage naturel et
des filtres structurés facultatifs. OpenClaw construit l’outil `x_search` intégré de xAI
pour chaque requête au lieu de le maintenir enregistré en permanence ; il n’est donc actif que
pendant le tour qui l’appelle effectivement.

<Warning>
  `x_search` s’exécute sur les serveurs de xAI. xAI facture 5 $ pour 1 000 appels d’outil,
  auxquels s’ajoutent les jetons d’entrée et de sortie du modèle.
</Warning>

<Note>
  La documentation de xAI indique que `x_search` prend en charge la recherche par mot-clé,
  la recherche sémantique, la recherche d’utilisateurs et la récupération de fils de discussion.
  Pour les statistiques d’engagement par publication, telles que les republications, les réponses,
  les favoris ou les vues, privilégiez une recherche ciblée sur l’URL exacte de la publication ou
  l’identifiant de statut. Les recherches générales par mot-clé peuvent trouver la bonne publication,
  mais renvoyer des métadonnées par publication moins complètes. Une bonne méthode consiste à localiser
  d’abord la publication, puis à exécuter une seconde requête `x_search` centrée sur cette publication
  exacte.
</Note>

### Configuration de x_search

Lorsque `enabled` est omis, `x_search` n’est exposé que lorsque le fournisseur
du modèle actif est `xai` et que les identifiants xAI sont disponibles. Pour un
modèle actif associé à un fournisseur connu autre que xAI, définissez
`plugins.entries.xai.config.xSearch.enabled` sur `true` afin d’autoriser
l’utilisation entre fournisseurs. Si le fournisseur du modèle actif est absent
ou non résolu, l’outil reste masqué. Définissez `enabled` sur `false` pour le
désactiver pour tous les fournisseurs. Les identifiants xAI sont toujours requis.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // requis pour un fournisseur de modèle connu autre que xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // facultatif, remplace webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // facultatif si un profil d’authentification xAI ou XAI_API_KEY est défini
            baseUrl: "https://api.x.ai/v1", // URL de base facultative partagée pour l’API Responses de xAI
          },
        },
      },
    },
  },
}
```

`x_search` envoie une requête à `<baseUrl>/responses` lorsque
`plugins.entries.xai.config.xSearch.baseUrl` est défini. Si ce champ est omis,
il utilise successivement `plugins.entries.xai.config.webSearch.baseUrl`,
l’ancien `tools.web.search.grok.baseUrl`, puis le point de terminaison public
de xAI (`https://api.x.ai/v1`).

### Paramètres de x_search

| Paramètre                    | Description                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| `query`                      | Requête de recherche (requise)                                   |
| `allowed_x_handles`          | Limite les résultats à 20 identifiants X au maximum              |
| `excluded_x_handles`         | Exclut 20 identifiants X au maximum                              |
| `from_date`                  | Inclut uniquement les publications à partir de cette date (AAAA-MM-JJ) |
| `to_date`                    | Inclut uniquement les publications jusqu’à cette date incluse (AAAA-MM-JJ) |
| `enable_image_understanding` | Autorise xAI à examiner les images jointes aux publications correspondantes |
| `enable_video_understanding` | Autorise xAI à examiner les vidéos jointes aux publications correspondantes |

`allowed_x_handles` et `excluded_x_handles` sont mutuellement exclusifs.

### Exemple de x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistiques par publication : utilisez si possible l’URL exacte du statut ou son identifiant
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

// Résultats récents (semaine écoulée)
await web_search({ query: "AI developments", freshness: "week" });

// Plage de dates
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrage par domaine (Perplexity uniquement)
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

## Voir aussi

- [Récupération de contenu Web](/fr/tools/web-fetch) -- récupère une URL et en extrait le contenu lisible
- [Navigateur Web](/fr/tools/browser) -- automatisation complète du navigateur pour les sites utilisant intensivement JavaScript
- [Recherche Grok](/fr/tools/grok-search) -- Grok comme fournisseur de `web_search`
- [Recherche Web Ollama](/fr/tools/ollama-search) -- recherche Web sans clé via votre hôte Ollama
