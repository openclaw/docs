---
read_when:
- Vous souhaitez utiliser Brave Search pour `web_search`
- You need a BRAVE_API_KEY or plan details
summary: Configuration de l’API Brave Search pour `web_search`
title: Brave Search
x-i18n:
  generated_at: '2026-04-24T07:34:40Z'
  model: gpt-5.4
  provider: openai
  source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
  source_path: tools/brave-search.md
  workflow: 15
---

# API Brave Search

OpenClaw prend en charge l’API Brave Search comme fournisseur `web_search`.

## Obtenir une clé API

1. Créez un compte Brave Search API sur [https://brave.com/search/api/](https://brave.com/search/api/)
2. Dans le tableau de bord, choisissez l’offre **Search** et générez une clé API.
3. Stockez la clé dans la configuration ou définissez `BRAVE_API_KEY` dans l’environnement du Gateway.

## Exemple de configuration

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // ou "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Les paramètres de recherche Brave propres au fournisseur vivent désormais sous `plugins.entries.brave.config.webSearch.*`.
L’ancienne clé `tools.web.search.apiKey` se charge encore via la couche de compatibilité, mais ce n’est plus le chemin de configuration canonique.

`webSearch.mode` contrôle le transport Brave :

- `web` (par défaut) : recherche web Brave normale avec titres, URL et extraits
- `llm-context` : API Brave LLM Context avec morceaux de texte pré-extraits et sources pour l’ancrage

## Paramètres de l’outil

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number" default="5">
Nombre de résultats à renvoyer (1–10).
</ParamField>

<ParamField path="country" type="string">
Code pays ISO à 2 lettres (par ex. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Code langue ISO 639-1 pour les résultats de recherche (par ex. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Code de langue de recherche Brave (par ex. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Code langue ISO pour les éléments d’interface.
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

**Exemples :**

```javascript
// Recherche spécifique à un pays et à une langue
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Résultats récents (semaine passée)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Recherche par plage de dates
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Remarques

- OpenClaw utilise l’offre Brave **Search**. Si vous avez un abonnement hérité (par ex. l’offre Free d’origine avec 2 000 requêtes/mois), il reste valide mais n’inclut pas les fonctionnalités plus récentes comme LLM Context ou des limites de débit plus élevées.
- Chaque offre Brave inclut **5 $/mois de crédit gratuit** (renouvelable). L’offre Search coûte 5 $ pour 1 000 requêtes, donc ce crédit couvre 1 000 requêtes/mois. Définissez votre limite d’utilisation dans le tableau de bord Brave pour éviter des frais inattendus. Consultez le [portail API Brave](https://brave.com/search/api/) pour les offres actuelles.
- L’offre Search inclut le point de terminaison LLM Context et les droits d’inférence IA. Stocker les résultats pour entraîner ou ajuster des modèles nécessite une offre avec des droits explicites de stockage. Voir les [Conditions d’utilisation](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- Le mode `llm-context` renvoie des entrées de source ancrées au lieu de la forme normale d’extraits de recherche web.
- Le mode `llm-context` ne prend pas en charge `ui_lang`, `freshness`, `date_after`, ni `date_before`.
- `ui_lang` doit inclure un sous-tag de région comme `en-US`.
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via `cacheTtlMinutes`).

## Associé

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Perplexity Search](/fr/tools/perplexity-search) -- résultats structurés avec filtrage de domaine
- [Exa Search](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
