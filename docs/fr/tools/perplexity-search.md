---
read_when:
    - Vous souhaitez utiliser Perplexity Search pour la recherche web
    - Vous devez configurer PERPLEXITY_API_KEY ou OPENROUTER_API_KEY
summary: API de recherche Perplexity et compatibilité Sonar/OpenRouter avec web_search
title: Recherche Perplexity
x-i18n:
    generated_at: "2026-05-06T07:42:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 113abafae66acd8aaa0302b687ba13347eb44a81a4217b61bb68f07d8a119cb0
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw prend en charge Perplexity Search API comme fournisseur `web_search`.
Elle renvoie des résultats structurés avec les champs `title`, `url` et `snippet`.

Pour des raisons de compatibilité, OpenClaw prend également en charge les configurations héritées Perplexity Sonar/OpenRouter.
Si vous utilisez `OPENROUTER_API_KEY`, une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`, ou si vous définissez `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, le fournisseur bascule vers le chemin des complétions de chat et renvoie des réponses synthétisées par l'IA avec citations au lieu de résultats structurés de la Search API.

## Obtenir une clé d'API Perplexity

1. Créez un compte Perplexity sur [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Générez une clé d'API dans le tableau de bord
3. Stockez la clé dans la configuration ou définissez `PERPLEXITY_API_KEY` dans l'environnement du Gateway.

## Compatibilité OpenRouter

Si vous utilisiez déjà OpenRouter pour Perplexity Sonar, conservez `provider: "perplexity"` et définissez `OPENROUTER_API_KEY` dans l'environnement du Gateway, ou stockez une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`.

Contrôles de compatibilité facultatifs :

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Exemples de configuration

### API Perplexity Search native

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Compatibilité OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Où définir la clé

**Via la configuration :** exécutez `openclaw configure --section web`. La clé est stockée dans
`~/.openclaw/openclaw.json` sous `plugins.entries.perplexity.config.webSearch.apiKey`.
Ce champ accepte également les objets SecretRef.

**Via l'environnement :** définissez `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
dans l'environnement du processus Gateway. Pour une installation du gateway, placez-la dans
`~/.openclaw/.env` (ou dans l'environnement de votre service). Consultez [Variables d'environnement](/fr/help/faq#env-vars-and-env-loading).

Si `provider: "perplexity"` est configuré et que la SecretRef de la clé Perplexity n'est pas résolue sans solution de repli par variable d'environnement, le démarrage/rechargement échoue immédiatement.

## Paramètres de l'outil

Ces paramètres s'appliquent au chemin de l'API Perplexity Search native.

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number" default="5">
Nombre de résultats à renvoyer (1-10).
</ParamField>

<ParamField path="country" type="string">
Code pays ISO à 2 lettres (par exemple `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Code de langue ISO 639-1 (par exemple `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtre temporel - `day` correspond à 24 heures.
</ParamField>

<ParamField path="date_after" type="string">
Uniquement les résultats publiés après cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Uniquement les résultats publiés avant cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Tableau de domaines en liste d'autorisation/liste de blocage (20 max).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Budget total de contenu (max 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite de tokens par page.
</ParamField>

Pour le chemin de compatibilité hérité Sonar/OpenRouter :

- `query`, `count` et `freshness` sont acceptés
- `count` n'y sert qu'à la compatibilité ; la réponse reste une seule réponse
  synthétisée avec citations plutôt qu'une liste de N résultats
- Les filtres réservés à la Search API, comme `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` et `max_tokens_per_page`
  renvoient des erreurs explicites

**Exemples :**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Règles du filtre de domaine

- Maximum 20 domaines par filtre
- Impossible de mélanger liste d'autorisation et liste de blocage dans la même requête
- Utilisez le préfixe `-` pour les entrées de liste de blocage (par exemple `["-reddit.com"]`)

## Notes

- Perplexity Search API renvoie des résultats de recherche web structurés (`title`, `url`, `snippet`)
- OpenRouter ou `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` explicite fait rebascule Perplexity vers les complétions de chat Sonar pour la compatibilité
- La compatibilité Sonar/OpenRouter renvoie une seule réponse synthétisée avec citations, et non des lignes de résultats structurés
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via `cacheTtlMinutes`)

## Connexe

<CardGroup cols={2}>
  <Card title="Vue d'ensemble de la recherche web" href="/fr/tools/web" icon="globe">
    Tous les fournisseurs et règles de détection automatique.
  </Card>
  <Card title="Recherche Brave" href="/fr/tools/brave-search" icon="shield">
    Résultats structurés avec filtres de pays et de langue.
  </Card>
  <Card title="Recherche Exa" href="/fr/tools/exa-search" icon="magnifying-glass">
    Recherche neuronale avec extraction de contenu.
  </Card>
  <Card title="Documentation de Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Guide de démarrage rapide et référence officiels de Perplexity Search API.
  </Card>
</CardGroup>
