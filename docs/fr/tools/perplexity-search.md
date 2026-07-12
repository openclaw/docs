---
read_when:
    - Vous souhaitez utiliser Perplexity Search pour effectuer des recherches sur le Web
    - Vous devez configurer PERPLEXITY_API_KEY ou OPENROUTER_API_KEY
summary: API Perplexity Search et compatibilité Sonar/OpenRouter pour web_search
title: Recherche Perplexity
x-i18n:
    generated_at: "2026-07-12T03:13:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw prend en charge l’API Perplexity Search en tant que fournisseur `web_search`. Elle renvoie des résultats structurés comportant les champs `title`, `url` et `snippet`.

À des fins de compatibilité, OpenClaw prend également en charge les anciennes configurations Perplexity Sonar/OpenRouter. Si vous utilisez `OPENROUTER_API_KEY`, une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`, ou définissez `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, le fournisseur bascule vers le chemin des complétions de conversation et renvoie des réponses synthétisées par l’IA avec des citations au lieu des résultats structurés de l’API Search.

## Installer le plugin

Installez le plugin officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Obtenir une clé API Perplexity

1. Créez un compte Perplexity sur [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Générez une clé API dans le tableau de bord.
3. Enregistrez la clé dans la configuration ou définissez `PERPLEXITY_API_KEY` dans l’environnement du Gateway.

## Compatibilité avec OpenRouter

Si vous utilisiez déjà OpenRouter pour Perplexity Sonar, conservez `provider: "perplexity"` et définissez `OPENROUTER_API_KEY` dans l’environnement du Gateway, ou enregistrez une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`.

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

**Via la configuration :** exécutez `openclaw configure --section web`. La clé est enregistrée dans `~/.openclaw/openclaw.json` sous `plugins.entries.perplexity.config.webSearch.apiKey`. Ce champ accepte également les objets SecretRef.

**Via l’environnement :** définissez `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY` dans l’environnement du processus Gateway. Pour une installation du Gateway, placez-la dans `~/.openclaw/.env` (ou dans l’environnement de votre service). Consultez [Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

Si `provider: "perplexity"` est configuré et que la SecretRef de la clé Perplexity n’est pas résolue sans solution de repli dans l’environnement, le démarrage ou le rechargement échoue immédiatement.

## Paramètres de l’outil

Ces paramètres s’appliquent au chemin de l’API Perplexity Search native.

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number" default="5">
Nombre de résultats à renvoyer (1 à 10).
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
Tableau de domaines autorisés ou refusés (20 au maximum).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Budget total de contenu (1 000 000 au maximum).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite de jetons par page.
</ParamField>

Pour l’ancien chemin de compatibilité Sonar/OpenRouter :

- `query`, `count` et `freshness` sont acceptés.
- Dans ce cas, `count` sert uniquement à la compatibilité ; la réponse reste une seule réponse synthétisée avec des citations, et non une liste de N résultats.
- Les filtres réservés à l’API Search (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) renvoient des erreurs explicites.

**Exemples :**

```javascript
// Recherche propre à un pays et à une langue
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Résultats récents (semaine écoulée)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Recherche dans une plage de dates
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrage par domaine (liste d’autorisation)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtrage par domaine (liste de refus — préfixe -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Extraction de contenu supplémentaire
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Règles de filtrage par domaine

- 20 domaines au maximum par filtre.
- Une même requête ne peut pas mélanger des entrées de liste d’autorisation et de liste de refus.
- Utilisez le préfixe `-` pour les entrées de la liste de refus (par exemple `["-reddit.com"]`).

## Remarques

- L’API Perplexity Search renvoie des résultats de recherche Web structurés (`title`, `url`, `snippet`).
- OpenRouter, ou la définition explicite de `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, fait rebascule Perplexity vers les complétions de conversation Sonar à des fins de compatibilité.
- La compatibilité Sonar/OpenRouter renvoie une seule réponse synthétisée avec des citations, et non des lignes de résultats structurées.
- Les résultats sont mis en cache pendant 15 minutes par défaut (durée configurable via `cacheTtlMinutes`).

## Voir aussi

<CardGroup cols={2}>
  <Card title="Présentation de la recherche Web" href="/fr/tools/web" icon="globe">
    Tous les fournisseurs et toutes les règles de détection automatique.
  </Card>
  <Card title="Recherche Brave" href="/fr/tools/brave-search" icon="shield">
    Résultats structurés avec des filtres par pays et par langue.
  </Card>
  <Card title="Recherche Exa" href="/fr/tools/exa-search" icon="magnifying-glass">
    Recherche neuronale avec extraction de contenu.
  </Card>
  <Card title="Documentation de l’API Perplexity Search" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Guide de démarrage rapide et documentation de référence officiels de l’API Perplexity Search.
  </Card>
</CardGroup>
