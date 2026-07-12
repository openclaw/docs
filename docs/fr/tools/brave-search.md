---
read_when:
    - Vous souhaitez utiliser Brave Search pour web_search
    - Vous avez besoin d’une `BRAVE_API_KEY` ou des détails de l’offre
summary: Configuration de l’API Brave Search pour web_search
title: Recherche Brave
x-i18n:
    generated_at: "2026-07-12T03:07:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw prend en charge l’API Brave Search comme fournisseur de `web_search`.

## Obtenir une clé d’API

1. Créez un compte d’API Brave Search sur [https://brave.com/search/api/](https://brave.com/search/api/)
2. Dans le tableau de bord, choisissez l’offre **Search** et générez une clé d’API.
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
            baseUrl: "https://api.search.brave.com", // remplacement facultatif du proxy/de l’URL de base
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

Les paramètres de recherche propres au fournisseur Brave se trouvent sous `plugins.entries.brave.config.webSearch.*` ; il s’agit du chemin de configuration canonique. Un paramètre partagé de premier niveau `tools.web.search.apiKey` et des paramètres délimités `tools.web.search.brave.*` sont toujours chargés au moyen d’une fusion de compatibilité, mais toute nouvelle configuration doit utiliser le chemin propre au Plugin indiqué ci-dessus.

`webSearch.mode` contrôle le mode de transport de Brave :

- `web` (par défaut) : recherche web Brave normale avec titres, URL et extraits
- `llm-context` : API Brave LLM Context avec des segments de texte préextraits et des sources pour l’ancrage factuel

`webSearch.baseUrl` permet d’acheminer les requêtes Brave vers un proxy
ou un Gateway de confiance compatible avec Brave. OpenClaw ajoute `/res/v1/web/search` ou `/res/v1/llm/context` à
l’URL de base configurée et conserve celle-ci dans la clé de cache. Les points de terminaison
publics doivent utiliser `https://` ; `http://` n’est accepté que pour les hôtes proxy de confiance
sur local loopback ou un réseau privé.

## Paramètres de l’outil

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number" default="5">
Nombre de résultats à renvoyer (1 à 10).
</ParamField>

<ParamField path="country" type="string">
Code pays ISO à 2 lettres (par ex. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Code de langue ISO 639-1 pour les résultats de recherche (par ex. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Code de langue de recherche Brave (par ex. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Code de langue ISO pour les éléments de l’interface utilisateur.
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

// Recherche sur une plage de dates
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Remarques

- OpenClaw utilise l’offre **Search** de Brave. Si vous disposez d’un abonnement historique (par ex. l’offre Free d’origine avec 2 000 requêtes par mois), il reste valide, mais n’inclut pas les fonctionnalités plus récentes telles que LLM Context ni les limites de débit supérieures.
- Chaque offre Brave inclut **5 \$ de crédit gratuit par mois** (renouvelé mensuellement). L’offre Search coûte 5 \$ pour 1 000 requêtes ; le crédit couvre donc 1 000 requêtes par mois. Définissez votre limite d’utilisation dans le tableau de bord Brave afin d’éviter des frais inattendus. Consultez le [portail de l’API Brave](https://brave.com/search/api/) pour connaître les offres actuelles.
- L’offre Search comprend le point de terminaison LLM Context et les droits d’inférence d’IA. Le stockage des résultats afin d’entraîner ou d’ajuster des modèles nécessite une offre accordant explicitement des droits de stockage. Consultez les [conditions d’utilisation](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- Le mode `llm-context` renvoie des entrées de sources ancrées au lieu du format d’extrait habituel de la recherche web.
- Le mode `llm-context` prend en charge `freshness` ainsi que les plages bornées `date_after` + `date_before`. Il ne prend pas en charge `ui_lang` ; `date_before` sans `date_after` est rejeté, car Brave exige que les plages de fraîcheur personnalisées incluent une date de début et une date de fin.
- `ui_lang` doit inclure un sous-tag de région, tel que `en-US`.
- Par défaut, les résultats sont mis en cache pendant 15 minutes (durée configurable via `cacheTtlMinutes`).
- Les valeurs personnalisées de `webSearch.baseUrl` sont incluses dans l’identité du cache Brave, afin que
  les réponses propres à chaque proxy n’entrent pas en collision.
- Activez l’indicateur de diagnostic `brave.http` pour journaliser les URL et paramètres de requête Brave, l’état et la durée des réponses, ainsi que les événements de succès, d’échec et d’écriture du cache de recherche lors du dépannage. L’indicateur ne journalise jamais la clé d’API ni le corps des réponses, mais les requêtes de recherche peuvent être sensibles.

## Voir aussi

- [Présentation de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Recherche Perplexity](/fr/tools/perplexity-search) -- résultats structurés avec filtrage par domaine
- [Recherche Exa](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
