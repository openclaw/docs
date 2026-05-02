---
read_when:
    - Vous souhaitez utiliser Gemini pour web_search
    - Vous devez fournir GEMINI_API_KEY ou models.providers.google.apiKey
    - Vous souhaitez un ancrage avec Google Search
summary: Recherche web Gemini avec ancrage Google Search
title: Recherche Gemini
x-i18n:
    generated_at: "2026-05-02T07:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw prend en charge les modèles Gemini avec
[l’ancrage Google Search](https://ai.google.dev/gemini-api/docs/grounding)
intégré, qui renvoie des réponses synthétisées par l’IA, appuyées par des résultats Google Search en direct avec
citations.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Accédez à [Google AI Studio](https://aistudio.google.com/apikey) et créez une
    clé API.
  </Step>
  <Step title="Stocker la clé">
    Définissez `GEMINI_API_KEY` dans l’environnement Gateway, réutilisez
    `models.providers.google.apiKey`, ou configurez une clé de recherche web dédiée via :

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Priorité des identifiants :** la recherche web Gemini utilise d’abord
`plugins.entries.google.config.webSearch.apiKey`, puis `GEMINI_API_KEY`,
puis `models.providers.google.apiKey`. Pour les URL de base, la valeur dédiée
`plugins.entries.google.config.webSearch.baseUrl` prévaut sur
`models.providers.google.baseUrl`.

Pour une installation Gateway, placez les clés d’environnement dans `~/.openclaw/.env`.

## Fonctionnement

Contrairement aux fournisseurs de recherche traditionnels qui renvoient une liste de liens et d’extraits,
Gemini utilise l’ancrage Google Search pour produire des réponses synthétisées par l’IA avec
des citations intégrées. Les résultats incluent à la fois la réponse synthétisée et les URL
sources.

- Les URL de citation issues de l’ancrage Gemini sont automatiquement résolues depuis les URL de
  redirection Google vers des URL directes.
- La résolution des redirections utilise le chemin de protection SSRF (HEAD + contrôles de redirection +
  validation http/https) avant de renvoyer l’URL de citation finale.
- La résolution des redirections utilise des paramètres SSRF stricts par défaut, de sorte que les redirections vers
  des cibles privées/internes sont bloquées.

## Paramètres pris en charge

La recherche Gemini prend en charge `query`, `freshness`, `date_after` et `date_before`.

`count` est accepté pour la compatibilité partagée avec `web_search`, mais l’ancrage Gemini
renvoie tout de même une seule réponse synthétisée avec des citations plutôt qu’une liste de
N résultats.

`freshness` accepte `day`, `week`, `month`, `year`, ainsi que les raccourcis partagés
`pd`, `pw`, `pm` et `py`. OpenClaw convertit ces valeurs, ou une plage explicite
`date_after`/`date_before`, en `timeRangeFilter` de l’ancrage Gemini Google Search.
`country`, `language` et `domain_filter` ne sont pas pris en charge.

## Sélection du modèle

Le modèle par défaut est `gemini-2.5-flash` (rapide et économique). Tout modèle Gemini
prenant en charge l’ancrage peut être utilisé via
`plugins.entries.google.config.webSearch.model`.

## Remplacements de l’URL de base

Définissez `plugins.entries.google.config.webSearch.baseUrl` lorsque la recherche web Gemini
doit passer par un proxy opérateur ou un endpoint personnalisé compatible avec Gemini. Si
cette valeur n’est pas définie, la recherche web Gemini réutilise `models.providers.google.baseUrl`. Une valeur simple
`https://generativelanguage.googleapis.com` est normalisée en
`https://generativelanguage.googleapis.com/v1beta` ; les chemins de proxy personnalisés sont conservés
tels que fournis après suppression des barres obliques finales.

## Articles connexes

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et l’autodétection
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec extraits
- [Perplexity Search](/fr/tools/perplexity-search) -- résultats structurés + extraction de contenu
