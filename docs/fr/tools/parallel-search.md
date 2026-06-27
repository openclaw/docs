---
read_when:
    - Vous voulez effectuer une recherche web sans clé API
    - Vous voulez l’API Search payante de Parallel
    - Vous voulez des extraits denses classés pour optimiser l’efficacité du contexte LLM
summary: Recherche parallèle -- extraits denses optimisés pour les LLM provenant de sources web
title: Recherche parallèle
x-i18n:
    generated_at: "2026-06-27T18:19:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Le Plugin Parallel fournit deux fournisseurs `web_search` [Parallel](https://parallel.ai/) :

- **Parallel Search (Free)** (`parallel-free`) -- le [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) gratuit de Parallel. Ne nécessite aucun compte ni clé API. Sélectionnez-le explicitement lorsque vous voulez utiliser le chemin de recherche hébergé de Parallel sans clé.
- **Parallel Search** (`parallel`) -- l’API de recherche payante de Parallel. Nécessite une `PARALLEL_API_KEY` et offre des limites de débit plus élevées ainsi qu’un réglage des objectifs.

Les deux renvoient des extraits classés et optimisés pour les LLM à partir d’un index web conçu pour les agents IA. Définissez `tools.web.search.provider` sur `parallel-free` ou `parallel` pour en choisir un explicitement.

<Note>
  Les modèles OpenAI Responses utilisent la recherche web native d’OpenAI lorsque
  `tools.web.search.provider` n’est pas défini, ils contournent donc les fournisseurs Parallel.
  Définissez `tools.web.search.provider` sur `parallel-free` ou `parallel` pour les router
  via Parallel.
</Note>

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Clé API (fournisseur payant)

`parallel-free` ne nécessite aucune clé API, mais il doit tout de même être sélectionné comme fournisseur géré. Le fournisseur payant `parallel` a besoin d’une clé API :

<Steps>
  <Step title="Create an account">
    Inscrivez-vous sur [platform.parallel.ai](https://platform.parallel.ai) et
    générez une clé API depuis votre tableau de bord.
  </Step>
  <Step title="Store the key">
    Définissez `PARALLEL_API_KEY` dans l’environnement Gateway, ou configurez-la via :

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
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Autre option d’environnement :** définissez `PARALLEL_API_KEY` dans l’environnement Gateway. Pour une installation gateway, placez-la dans `~/.openclaw/.env`.

## Remplacement de l’URL de base

Le remplacement de l’URL de base s’applique uniquement au fournisseur payant `parallel`. Le fournisseur gratuit `parallel-free` utilise toujours `https://search.parallel.ai/mcp`.

Définissez `plugins.entries.parallel.config.webSearch.baseUrl` lorsque les requêtes Parallel doivent passer par un proxy compatible ou un autre point de terminaison Parallel (par exemple, le Cloudflare AI Gateway). OpenClaw normalise les hôtes nus en ajoutant `https://` au début et ajoute `/v1/search`, sauf si le chemin se termine déjà ainsi. Le point de terminaison résolu est inclus dans la clé de cache de recherche, de sorte que les résultats provenant de différents points de terminaison Parallel ne sont pas partagés.

## Paramètres de l’outil

OpenClaw expose la forme de recherche native de Parallel afin que le modèle puisse renseigner à la fois l’objectif en langage naturel et quelques courtes requêtes par mots-clés — l’association que Parallel [recommande](https://docs.parallel.ai/search/best-practices) pour obtenir les meilleurs résultats.

<ParamField path="objective" type="string" required>
Description en langage naturel de la question ou de l’objectif sous-jacent (5 000
caractères maximum). Doit être autonome.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Requêtes de recherche concises par mots-clés, 3 à 6 mots chacune (1 à 5 entrées,
200 caractères maximum chacune). Fournissez 2 à 3 requêtes diverses pour de meilleurs résultats.
</ParamField>

<ParamField path="count" type="number">
Résultats à renvoyer (1 à 40).
</ParamField>

<ParamField path="session_id" type="string">
Identifiant de session Parallel facultatif (1 000 caractères maximum sur `parallel` ; le
Search MCP gratuit `parallel-free` le limite à 100). Transmettez le `sessionId` d’un résultat
Parallel précédent lors des recherches de suivi faisant partie de la même tâche afin que Parallel
puisse regrouper les appels associés et améliorer les résultats suivants. Un identifiant qui dépasse la limite est
abandonné et un nouveau est généré.
</ParamField>

<ParamField path="client_model" type="string">
Identifiant facultatif du modèle effectuant l’appel (par exemple `claude-opus-4-7`,
`gpt-5.5`). Permet à Parallel d’adapter les paramètres par défaut aux
capacités de votre modèle. Transmettez le slug exact du modèle actif ; ne le raccourcissez pas en
alias de famille.
</ParamField>

## Notes

- Parallel classe et compresse les résultats selon leur utilité pour le raisonnement LLM, et non selon
  le taux de clic humain ; attendez-vous à des extraits denses dans chaque résultat plutôt qu’à
  du contenu de page complet
- Les extraits de résultats reviennent sous forme de tableau `excerpts` et sont également joints dans
  le champ `description` pour compatibilité avec le contrat générique `web_search`
- Parallel renvoie un `session_id` dans chaque réponse ; OpenClaw l’expose sous forme de
  `sessionId` dans la charge utile de l’outil afin que les appelants puissent regrouper les recherches de suivi
- `searchId`, `warnings` et `usage` de Parallel sont transmis lorsqu’ils sont
  présents
- OpenClaw transmet toujours un nombre de résultats résolu à Parallel sous
  `advanced_settings.max_results`. L’argument `count` de l’appelant prévaut, puis le
  paramètre de premier niveau `tools.web.search.maxResults`, sinon la valeur par défaut
  générique `web_search` d’OpenClaw (5). Cela maintient un volume de résultats cohérent
  lors du passage d’un fournisseur à l’autre ; Parallel utilise par défaut 10 de son côté
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via
  `cacheTtlMinutes`)
- Le fournisseur gratuit `parallel-free` accepte les mêmes paramètres. Il applique
  `count` côté client et génère un `session_id` par appel lorsqu’aucun n’est
  fourni.

## Associés

- [Vue d’ensemble de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Recherche Exa](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
- [Recherche Perplexity](/fr/tools/perplexity-search) -- résultats structurés avec filtrage par domaine
