---
read_when:
    - Vous souhaitez utiliser Brave Search pour web_search
    - Vous devez disposer d’une BRAVE_API_KEY ou des détails du forfait
summary: Configuration de l'API Brave Search pour web_search
title: Recherche Brave
x-i18n:
    generated_at: "2026-05-06T07:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw prend en charge Brave Search API comme fournisseur `web_search`.

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

Les paramètres de recherche Brave propres au fournisseur résident désormais sous `plugins.entries.brave.config.webSearch.*`.
L’ancien `tools.web.search.apiKey` se charge toujours via la couche de compatibilité, mais ce n’est plus le chemin de configuration canonique.

`webSearch.mode` contrôle le transport Brave :

- `web` (par défaut) : recherche web Brave normale avec titres, URL et extraits
- `llm-context` : API Brave LLM Context avec fragments de texte pré-extraits et sources pour l’ancrage

`webSearch.baseUrl` peut diriger les requêtes Brave vers un proxy compatible Brave
ou un gateway de confiance. OpenClaw ajoute `/res/v1/web/search` ou `/res/v1/llm/context` à
l’URL de base configurée et conserve l’URL de base dans la clé de cache. Les points de terminaison
publics doivent utiliser `https://` ; `http://` n’est accepté que pour les hôtes proxy de loopback
ou de réseau privé de confiance.

## Paramètres de l’outil

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
Résultats publiés uniquement après cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Résultats publiés uniquement avant cette date (`YYYY-MM-DD`).
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

- OpenClaw utilise l’offre **Search** de Brave. Si vous disposez d’un abonnement ancien (par exemple l’offre Free originale avec 2 000 requêtes/mois), il reste valide, mais n’inclut pas les fonctionnalités plus récentes comme LLM Context ni les limites de débit supérieures.
- Chaque offre Brave inclut **5 \$US/mois de crédit gratuit** (renouvelé). L’offre Search coûte 5 \$US par 1 000 requêtes, le crédit couvre donc 1 000 requêtes/mois. Définissez votre limite d’utilisation dans le tableau de bord Brave pour éviter les frais inattendus. Consultez le [portail API Brave](https://brave.com/search/api/) pour les offres actuelles.
- L’offre Search inclut le point de terminaison LLM Context et les droits d’inférence IA. Le stockage des résultats pour entraîner ou ajuster des modèles nécessite une offre avec des droits de stockage explicites. Consultez les [conditions d’utilisation](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- Le mode `llm-context` renvoie des entrées de source ancrées au lieu de la forme normale des extraits de recherche web.
- Le mode `llm-context` prend en charge `freshness` et les plages bornées `date_after` + `date_before`. Il ne prend pas en charge `ui_lang` ; `date_before` sans `date_after` est rejeté, car Brave exige que les plages de fraîcheur personnalisées incluent à la fois une date de début et une date de fin.
- `ui_lang` doit inclure un sous-tag de région comme `en-US`.
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via `cacheTtlMinutes`).
- Les valeurs personnalisées de `webSearch.baseUrl` sont incluses dans l’identité de cache Brave, de sorte que
  les réponses propres au proxy n’entrent pas en collision.
- Activez l’indicateur de diagnostic `brave.http` pour journaliser les URL/paramètres de requête Brave, l’état/le minutage des réponses et les événements de succès/échec/écriture du cache de recherche lors du dépannage. L’indicateur ne journalise jamais la clé API ni les corps de réponse, mais les requêtes de recherche peuvent être sensibles.

## Connexe

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Perplexity Search](/fr/tools/perplexity-search) -- résultats structurés avec filtrage par domaine
- [Exa Search](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
