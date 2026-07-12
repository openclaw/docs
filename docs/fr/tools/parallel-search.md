---
read_when:
    - Vous souhaitez effectuer des recherches sur le Web sans clé API
    - Vous souhaitez utiliser l’API Search payante de Parallel
    - Vous souhaitez des extraits denses classés selon leur efficacité dans le contexte d’un LLM
summary: Recherche parallèle — extraits denses optimisés pour les LLM à partir de sources web
title: Recherche parallèle
x-i18n:
    generated_at: "2026-07-12T03:13:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Le Plugin Parallel fournit deux fournisseurs `web_search` [Parallel](https://parallel.ai/), qui renvoient tous deux des extraits classés et optimisés pour les LLM à partir d’un index web conçu pour les agents d’IA :

| Fournisseur                   | id              | Authentification                                                                                     |
| ----------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| Recherche Parallel (gratuite) | `parallel-free` | Aucune -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuit de Parallel     |
| Recherche Parallel            | `parallel`      | `PARALLEL_API_KEY` -- API de recherche payante, limites de débit supérieures et ajustement objectif |

Définissez `tools.web.search.provider` sur `parallel-free` ou `parallel` pour en sélectionner explicitement un ; aucun des deux n’est détecté automatiquement.

<Note>
  Les modèles OpenAI Responses directs (`api: "openai-responses"`, fournisseur
  `openai`, URL de base de l’API officielle) utilisent automatiquement la
  recherche web native hébergée d’OpenAI lorsque `tools.web.search.provider`
  n’est pas défini, est vide ou vaut `"auto"` ou `"openai"` ; ils contournent
  donc Parallel par défaut. Définissez `tools.web.search.provider` sur
  `parallel-free` ou `parallel` pour les acheminer plutôt via Parallel.
  Consultez la [présentation de la recherche web](/fr/tools/web).
</Note>

## Installer le Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Clé API (fournisseur payant)

`parallel-free` ne nécessite aucune clé, mais doit tout de même être sélectionné explicitement. Le fournisseur payant `parallel` nécessite une clé API :

<Steps>
  <Step title="Créer un compte">
    Inscrivez-vous sur [platform.parallel.ai](https://platform.parallel.ai) et
    générez une clé API depuis votre tableau de bord.
  </Step>
  <Step title="Enregistrer la clé">
    Définissez `PARALLEL_API_KEY` dans l’environnement du Gateway, ou configurez-la avec :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuration

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // facultatif si PARALLEL_API_KEY est défini
            baseUrl: "https://api.parallel.ai", // facultatif ; OpenClaw ajoute /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" pour le Search MCP gratuit, ou "parallel" pour le
        // fournisseur payant adossé à l’API présenté ici.
        provider: "parallel",
      },
    },
  },
}
```

**Autre possibilité avec une variable d’environnement :** définissez `PARALLEL_API_KEY` dans l’environnement du Gateway. Pour une installation du Gateway, placez-la dans `~/.openclaw/.env`.

## Remplacement de l’URL de base

S’applique uniquement au fournisseur payant `parallel` ; `parallel-free` utilise toujours `https://search.parallel.ai/mcp` et ignore ce paramètre.

Définissez `plugins.entries.parallel.config.webSearch.baseUrl` pour acheminer les requêtes payantes via un proxy compatible ou un autre point de terminaison (par exemple, Cloudflare AI Gateway). OpenClaw normalise les hôtes sans protocole en ajoutant `https://` et ajoute `/v1/search`, sauf si le chemin se termine déjà ainsi. Le point de terminaison résolu fait partie de la clé du cache de recherche ; les résultats provenant de points de terminaison différents ne sont donc jamais partagés.

## Paramètres de l’outil

Les deux fournisseurs exposent le format de recherche natif de Parallel afin que le modèle renseigne un objectif en langage naturel ainsi que quelques courtes requêtes par mots-clés, combinaison que Parallel [recommande](https://docs.parallel.ai/search/best-practices) pour obtenir les meilleurs résultats.

<ParamField path="objective" type="string" required>
Description en langage naturel de la question ou de l’objectif sous-jacent (5 000 caractères maximum). Elle doit être autonome.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Requêtes de recherche concises par mots-clés, de 3 à 6 mots chacune (1 à 5 entrées, 200 caractères maximum chacune). Fournissez 2 à 3 requêtes variées pour obtenir les meilleurs résultats.
</ParamField>

<ParamField path="count" type="number">
Nombre de résultats à renvoyer (1 à 40).
</ParamField>

<ParamField path="session_id" type="string">
Identifiant de session Parallel facultatif provenant du `sessionId` d’un résultat précédent. Transmettez-le lors des recherches suivantes de la même tâche afin que Parallel regroupe les appels associés et améliore les résultats ultérieurs. Maximum de 1 000 caractères avec `parallel` ; le Search MCP gratuit `parallel-free` le limite à 100. Un identifiant dépassant la limite est supprimé (version payante) ou remplacé par un nouvel identifiant (version gratuite).
</ParamField>

<ParamField path="client_model" type="string">
Identifiant facultatif du modèle effectuant l’appel (par exemple `claude-opus-4-7` ou `gpt-5.6-sol`), de 100 caractères maximum. Il permet à Parallel d’adapter les paramètres par défaut aux capacités de votre modèle. Transmettez l’identifiant exact du modèle actif ; ne le raccourcissez pas en alias de famille.
</ParamField>

## Remarques

- Parallel classe et compresse les résultats pour faciliter le raisonnement des LLM, et non pour favoriser les clics humains ; attendez-vous à des extraits denses pour chaque résultat plutôt qu’au contenu de pages complètes.
- Les extraits de résultats sont renvoyés sous forme de tableau `excerpts` et sont également concaténés dans `description` pour assurer la compatibilité avec le contrat générique `web_search`.
- Les deux fournisseurs renvoient un `session_id` ; OpenClaw l’expose sous la forme `sessionId` dans la charge utile de l’outil afin que les appelants puissent regrouper les recherches suivantes. Un identifiant de session généré par Parallel, c’est-à-dire non fourni par l’appelant, est exclu de l’entrée de cache, car des tâches sans rapport utilisant des requêtes identiques ne doivent pas en hériter.
- Les valeurs `searchId`, `warnings` et `usage` de Parallel sont transmises lorsqu’elles sont présentes.
- OpenClaw transmet toujours à Parallel un nombre de résultats résolu sous la forme `advanced_settings.max_results` (`parallel`) ou applique `count` côté client après la réponse de taille fixe de Parallel (`parallel-free`). L’argument `count` de l’appelant est prioritaire, suivi de `tools.web.search.maxResults`, puis de la valeur par défaut générique de `web_search` d’OpenClaw (5) ; la valeur par défaut de l’API de Parallel est 10.
- Les résultats sont mis en cache pendant 15 minutes par défaut (`cacheTtlMinutes`).
- `parallel-free` crée un nouveau `session_id` à chaque appel lors de sa négociation MCP si l’appelant n’en fournit pas ; `parallel` le laisse non défini dans ce cas.

## Voir aussi

- [Présentation de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Recherche Exa](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
- [Recherche Perplexity](/fr/tools/perplexity-search) -- résultats structurés avec filtrage par domaine
