---
read_when:
    - Vous voulez utiliser Gemini pour web_search
    - Vous avez besoin d’une GEMINI_API_KEY ou de models.providers.google.apiKey
    - Vous voulez l’ancrage Google Search
summary: Recherche web Gemini avec ancrage Google Search
title: Recherche Gemini
x-i18n:
    generated_at: "2026-06-27T18:18:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw prend en charge les modèles Gemini avec
[l’ancrage Google Search](https://ai.google.dev/gemini-api/docs/grounding)
intégré, qui renvoie des réponses synthétisées par l’IA, étayées par des
résultats Google Search en direct avec citations.

## Obtenir une clé d’API

<Steps>
  <Step title="Créer une clé">
    Accédez à [Google AI Studio](https://aistudio.google.com/apikey) et créez une
    clé d’API.
  </Step>
  <Step title="Stocker la clé">
    Définissez `GEMINI_API_KEY` dans l’environnement du Gateway, réutilisez
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

Pour une installation du Gateway, placez les clés d’environnement dans `~/.openclaw/.env`.

## Fonctionnement

Contrairement aux fournisseurs de recherche traditionnels qui renvoient une liste de liens et d’extraits,
Gemini utilise l’ancrage Google Search pour produire des réponses synthétisées par l’IA avec
des citations intégrées. Les résultats incluent à la fois la réponse synthétisée et les URL
sources.

- Les URL de citation issues de l’ancrage Gemini sont automatiquement résolues depuis les URL de redirection Google
  vers des URL directes.
- La résolution des redirections utilise le chemin de protection SSRF (HEAD + vérifications de redirection +
  validation http/https) avant de renvoyer l’URL de citation finale.
- La résolution des redirections utilise des valeurs par défaut SSRF strictes, les redirections vers des
  cibles privées/internes sont donc bloquées.

## Paramètres pris en charge

La recherche Gemini prend en charge `query`, `freshness`, `date_after` et `date_before`.

`count` est accepté pour la compatibilité partagée avec `web_search`, mais l’ancrage Gemini
renvoie toujours une seule réponse synthétisée avec citations plutôt qu’une liste de
N résultats.

`freshness` accepte `day`, `week`, `month`, `year`, ainsi que les raccourcis partagés
`pd`, `pw`, `pm` et `py`. `day`/`pd` ajoute une instruction de récence à la requête Gemini
au lieu d’une plage stricte de 24 heures. `week`, `month`, `year` et les plages explicites
`date_after`/`date_before` définissent le `timeRangeFilter` de l’ancrage Google Search de Gemini.
`country`, `language` et `domain_filter` ne sont pas pris en charge.

## Sélection du modèle

Le modèle par défaut est `gemini-2.5-flash` (rapide et économique). Tout modèle Gemini
prenant en charge l’ancrage peut être utilisé via
`plugins.entries.google.config.webSearch.model`.

## Remplacements de l’URL de base

Définissez `plugins.entries.google.config.webSearch.baseUrl` lorsque la recherche web Gemini
doit transiter par un proxy opérateur ou un point de terminaison personnalisé compatible avec Gemini. Si
cette valeur n’est pas définie, la recherche web Gemini réutilise `models.providers.google.baseUrl`. Une valeur simple
`https://generativelanguage.googleapis.com` est normalisée en
`https://generativelanguage.googleapis.com/v1beta` ; les chemins de proxy personnalisés sont conservés
tels que fournis après suppression des barres obliques finales.

## Voir aussi

- [Vue d’ensemble de la recherche web](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec extraits
- [Perplexity Search](/fr/tools/perplexity-search) -- résultats structurés + extraction de contenu
