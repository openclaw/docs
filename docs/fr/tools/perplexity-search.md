---
read_when:
    - Vous souhaitez utiliser Perplexity Search pour la recherche web
    - Vous devez configurer PERPLEXITY_API_KEY ou OPENROUTER_API_KEY
summary: Compatibilité de l’API Perplexity Search et de Sonar/OpenRouter pour web_search
title: Recherche Perplexity
x-i18n:
    generated_at: "2026-06-27T18:20:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef003238bc38dd3d92b98654598cba05fb1c324d8ca766a683cf1defe5bd435
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw prend en charge l’API Perplexity Search comme fournisseur `web_search`.
Elle renvoie des résultats structurés avec les champs `title`, `url` et `snippet`.

Pour la compatibilité, OpenClaw prend également en charge les configurations Perplexity Sonar/OpenRouter héritées.
Si vous utilisez `OPENROUTER_API_KEY`, une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`, ou si vous définissez `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, le fournisseur bascule vers le chemin chat-completions et renvoie des réponses synthétisées par IA avec citations au lieu de résultats structurés de l’API Search.

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Obtenir une clé d’API Perplexity

1. Créez un compte Perplexity sur [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Générez une clé d’API dans le tableau de bord
3. Stockez la clé dans la configuration ou définissez `PERPLEXITY_API_KEY` dans l’environnement Gateway.

## Compatibilité OpenRouter

Si vous utilisiez déjà OpenRouter pour Perplexity Sonar, conservez `provider: "perplexity"` et définissez `OPENROUTER_API_KEY` dans l’environnement Gateway, ou stockez une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`.

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
Ce champ accepte aussi les objets SecretRef.

**Via l’environnement :** définissez `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
dans l’environnement du processus Gateway. Pour une installation de Gateway, placez-la dans
`~/.openclaw/.env` (ou dans l’environnement de votre service). Consultez [Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

Si `provider: "perplexity"` est configuré et que la SecretRef de la clé Perplexity n’est pas résolue sans solution de repli dans l’environnement, le démarrage/rechargement échoue rapidement.

## Paramètres de l’outil

Ces paramètres s’appliquent au chemin de l’API Perplexity Search native.

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number" default="5">
Nombre de résultats à renvoyer (1-10).
</ParamField>

<ParamField path="country" type="string">
Code pays ISO à 2 lettres (p. ex. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Code de langue ISO 639-1 (p. ex. `en`, `de`, `fr`).
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
Tableau de domaines autorisés/refusés (max. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Budget total de contenu (max. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite de jetons par page.
</ParamField>

Pour le chemin de compatibilité Sonar/OpenRouter hérité :

- `query`, `count` et `freshness` sont acceptés
- `count` existe uniquement pour la compatibilité dans ce chemin ; la réponse reste une seule
  réponse synthétisée avec citations plutôt qu’une liste de N résultats
- Les filtres propres à l’API Search comme `country`, `language`, `date_after`,
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

### Règles de filtre de domaine

- Maximum 20 domaines par filtre
- Impossible de mélanger liste d’autorisation et liste de refus dans une même requête
- Utilisez le préfixe `-` pour les entrées de liste de refus (p. ex. `["-reddit.com"]`)

## Notes

- L’API Perplexity Search renvoie des résultats de recherche web structurés (`title`, `url`, `snippet`)
- OpenRouter ou `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` explicite fait rebasculer Perplexity vers les chat completions Sonar pour compatibilité
- La compatibilité Sonar/OpenRouter renvoie une seule réponse synthétisée avec citations, pas des lignes de résultats structurées
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via `cacheTtlMinutes`)

## Associés

<CardGroup cols={2}>
  <Card title="Vue d’ensemble de la recherche web" href="/fr/tools/web" icon="globe">
    Tous les fournisseurs et règles d’auto-détection.
  </Card>
  <Card title="Recherche Brave" href="/fr/tools/brave-search" icon="shield">
    Résultats structurés avec filtres de pays et de langue.
  </Card>
  <Card title="Recherche Exa" href="/fr/tools/exa-search" icon="magnifying-glass">
    Recherche neuronale avec extraction de contenu.
  </Card>
  <Card title="Documentation de l’API Perplexity Search" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Guide de démarrage rapide et référence officiels de l’API Perplexity Search.
  </Card>
</CardGroup>
