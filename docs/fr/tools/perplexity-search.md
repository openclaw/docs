---
read_when:
    - Vous souhaitez utiliser Perplexity Search pour effectuer des recherches sur le Web
    - Vous devez configurer PERPLEXITY_API_KEY ou OPENROUTER_API_KEY
summary: Compatibilité de l’API Perplexity Search et de Sonar/OpenRouter avec web_search
title: Recherche Perplexity
x-i18n:
    generated_at: "2026-07-12T15:59:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw prend en charge l’API Perplexity Search comme fournisseur `web_search`. Elle renvoie des résultats structurés comportant les champs `title`, `url` et `snippet`.

Pour assurer la compatibilité, OpenClaw prend également en charge les anciennes configurations Perplexity Sonar/OpenRouter. Si vous utilisez `OPENROUTER_API_KEY`, une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`, ou définissez `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, le fournisseur bascule vers le chemin des complétions de chat et renvoie des réponses synthétisées par l’IA avec des citations, au lieu des résultats structurés de l’API Search.

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Obtenir une clé API Perplexity

1. Créez un compte Perplexity sur [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Générez une clé API dans le tableau de bord.
3. Stockez la clé dans la configuration ou définissez `PERPLEXITY_API_KEY` dans l’environnement du Gateway.

## Compatibilité avec OpenRouter

Si vous utilisiez déjà OpenRouter pour Perplexity Sonar, conservez `provider: "perplexity"` et définissez `OPENROUTER_API_KEY` dans l’environnement du Gateway, ou stockez une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`.

Paramètres de compatibilité facultatifs :

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

**Via la configuration :** exécutez `openclaw configure --section web`. La clé est stockée dans `~/.openclaw/openclaw.json`, sous `plugins.entries.perplexity.config.webSearch.apiKey`. Ce champ accepte également les objets SecretRef.

**Via l’environnement :** définissez `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY` dans l’environnement du processus Gateway. Pour une installation du Gateway, placez-la dans `~/.openclaw/.env` (ou dans l’environnement de votre service). Consultez [Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

Si `provider: "perplexity"` est configuré et que le SecretRef de la clé Perplexity n’est pas résolu sans solution de repli dans l’environnement, le démarrage ou le rechargement échoue immédiatement.

## Paramètres de l’outil

Ces paramètres s’appliquent au chemin de l’API Perplexity Search native.

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
Filtre temporel — `day` correspond à 24 heures.
</ParamField>

<ParamField path="date_after" type="string">
Uniquement les résultats publiés après cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Uniquement les résultats publiés avant cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Tableau de domaines autorisés/interdits (20 au maximum).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Budget total de contenu (1000000 au maximum).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite de jetons par page.
</ParamField>

Pour l’ancien chemin de compatibilité Sonar/OpenRouter :

- `query`, `count` et `freshness` sont acceptés.
- `count` sert uniquement à la compatibilité dans ce cas ; la réponse reste une seule réponse synthétisée avec des citations, et non une liste de N résultats.
- Les filtres réservés à l’API Search (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) renvoient des erreurs explicites.

**Exemples :**

```javascript
// Recherche propre à un pays et une langue
await web_search({
  query: "énergie renouvelable",
  country: "DE",
  language: "de",
});

// Résultats récents (semaine écoulée)
await web_search({
  query: "actualités sur l’IA",
  freshness: "week",
});

// Recherche sur une plage de dates
await web_search({
  query: "développements de l’IA",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrage par domaine (liste d’autorisation)
await web_search({
  query: "recherche sur le climat",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtrage par domaine (liste d’exclusion — préfixer par -)
await web_search({
  query: "avis sur les produits",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Extraction de contenu supplémentaire
await web_search({
  query: "recherche détaillée sur l’IA",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Règles de filtrage par domaine

- 20 domaines au maximum par filtre.
- Les entrées de liste d’autorisation et de liste d’exclusion ne peuvent pas être combinées dans une même requête.
- Utilisez le préfixe `-` pour les entrées de la liste d’exclusion (par exemple, `["-reddit.com"]`).

## Remarques

- L’API Perplexity Search renvoie des résultats de recherche web structurés (`title`, `url`, `snippet`).
- OpenRouter, ou une valeur explicite de `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, fait revenir Perplexity aux complétions de chat Sonar à des fins de compatibilité.
- La compatibilité Sonar/OpenRouter renvoie une seule réponse synthétisée avec des citations, et non des lignes de résultats structurés.
- Les résultats sont mis en cache pendant 15 minutes par défaut (durée configurable via `cacheTtlMinutes`).

## Pages connexes

<CardGroup cols={2}>
  <Card title="Présentation de la recherche web" href="/fr/tools/web" icon="globe">
    Tous les fournisseurs et toutes les règles de détection automatique.
  </Card>
  <Card title="Recherche Brave" href="/fr/tools/brave-search" icon="shield">
    Résultats structurés avec des filtres par pays et par langue.
  </Card>
  <Card title="Recherche Exa" href="/fr/tools/exa-search" icon="magnifying-glass">
    Recherche neuronale avec extraction de contenu.
  </Card>
  <Card title="Documentation de l’API Perplexity Search" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Guide de démarrage rapide et référence officiels de l’API Perplexity Search.
  </Card>
</CardGroup>
