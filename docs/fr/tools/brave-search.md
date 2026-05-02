---
read_when:
    - Vous souhaitez utiliser Brave Search pour web_search
    - Vous avez besoin d’une BRAVE_API_KEY ou des détails du forfait
summary: Configuration de l’API Brave Search pour web_search
title: Recherche Brave
x-i18n:
    generated_at: "2026-05-02T21:02:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ecb9e3e5475bb26f4058311429b558f49cdd1df907a622f93f297ac6569d65
    source_path: tools/brave-search.md
    workflow: 16
---

# API Brave Search

OpenClaw prend en charge l’API Brave Search comme fournisseur `web_search`.

## Obtenir une clé API

1. Créez un compte API Brave Search sur [https://brave.com/search/api/](https://brave.com/search/api/)
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
            mode: "web", // or "llm-context"
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

Les paramètres de recherche Brave propres au fournisseur se trouvent désormais sous `plugins.entries.brave.config.webSearch.*`.
L’ancien `tools.web.search.apiKey` se charge toujours via le shim de compatibilité, mais ce n’est plus le chemin de configuration canonique.

`webSearch.mode` contrôle le transport Brave :

- `web` (par défaut) : recherche web Brave normale avec titres, URL et extraits
- `llm-context` : API Brave LLM Context avec fragments de texte et sources pré-extraits pour l’ancrage

`webSearch.baseUrl` peut diriger les requêtes Brave vers un proxy compatible Brave
ou un gateway de confiance. OpenClaw ajoute `/res/v1/web/search` ou `/res/v1/llm/context` à
l’URL de base configurée et conserve l’URL de base dans la clé de cache. Les
endpoints publics doivent utiliser `https://` ; `http://` n’est accepté que pour les hôtes proxy de confiance en local loopback
ou sur réseau privé.

## Paramètres de l’outil

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number" default="5">
Nombre de résultats à renvoyer (1–10).
</ParamField>

<ParamField path="country" type="string">
Code pays ISO à 2 lettres (par exemple `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Code de langue ISO 639-1 pour les résultats de recherche (par exemple `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Code de langue de recherche Brave (par exemple `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Code de langue ISO pour les éléments d’interface utilisateur.
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
```

## Notes

- OpenClaw utilise l’offre Brave **Search**. Si vous disposez d’un abonnement historique (par exemple l’offre Free originale avec 2 000 requêtes/mois), il reste valide, mais n’inclut pas les fonctionnalités plus récentes comme LLM Context ni les limites de débit plus élevées.
- Chaque offre Brave inclut **5 \$US/mois de crédit gratuit** (renouvelé). L’offre Search coûte 5 \$US par 1 000 requêtes, le crédit couvre donc 1 000 requêtes/mois. Définissez votre limite d’utilisation dans le tableau de bord Brave pour éviter les frais inattendus. Consultez le [portail API Brave](https://brave.com/search/api/) pour les offres actuelles.
- L’offre Search inclut l’endpoint LLM Context et les droits d’inférence IA. Stocker les résultats pour entraîner ou ajuster des modèles nécessite une offre avec des droits de stockage explicites. Consultez les [Conditions d’utilisation](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- Le mode `llm-context` renvoie des entrées de sources ancrées au lieu de la forme d’extrait de recherche web normale.
- Le mode `llm-context` prend en charge `freshness` et les plages bornées `date_after` + `date_before`. Il ne prend pas en charge `ui_lang` ; `date_before` sans `date_after` est rejeté, car Brave exige que les plages de fraîcheur personnalisées incluent à la fois des dates de début et de fin.
- `ui_lang` doit inclure un sous-étiquette de région comme `en-US`.
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via `cacheTtlMinutes`).
- Les valeurs personnalisées de `webSearch.baseUrl` sont incluses dans l’identité du cache Brave, afin que
  les réponses propres au proxy n’entrent pas en collision.
- Activez l’indicateur de diagnostic `brave.http` pour journaliser les URL/paramètres de requête Brave, l’état/le timing des réponses et les événements hit/miss/écriture du cache de recherche pendant le dépannage. L’indicateur ne journalise jamais la clé API ni les corps de réponse, mais les requêtes de recherche peuvent être sensibles.

## Associé

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [Perplexity Search](/fr/tools/perplexity-search) -- résultats structurés avec filtrage par domaine
- [Exa Search](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
