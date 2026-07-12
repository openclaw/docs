---
read_when:
    - Vous souhaitez utiliser Gemini pour web_search
    - Vous avez besoin de `GEMINI_API_KEY` ou de `models.providers.google.apiKey`
    - Vous souhaitez utiliser l’ancrage dans la recherche Google
summary: Recherche web Gemini avec ancrage dans Google Search
title: Recherche Gemini
x-i18n:
    generated_at: "2026-07-12T03:23:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw prend en charge les modèles Gemini avec une fonctionnalité intégrée d’
[ancrage dans Google Search](https://ai.google.dev/gemini-api/docs/grounding),
qui renvoie des réponses synthétisées par l’IA, étayées par des résultats Google Search en direct
et accompagnées de citations.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Accédez à [Google AI Studio](https://aistudio.google.com/apikey) et créez une
    clé API.
  </Step>
  <Step title="Enregistrer la clé">
    Définissez `GEMINI_API_KEY` dans l’environnement du Gateway, réutilisez
    `models.providers.google.apiKey` ou configurez une clé dédiée à la recherche Web avec :

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
            apiKey: "AIza...", // facultatif si GEMINI_API_KEY ou models.providers.google.apiKey est défini
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // facultatif ; utilise models.providers.google.baseUrl comme solution de repli
            model: "gemini-2.5-flash", // valeur par défaut
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

**Ordre de priorité des identifiants :** la recherche Web Gemini utilise d’abord
`plugins.entries.google.config.webSearch.apiKey`, puis `GEMINI_API_KEY`,
puis `models.providers.google.apiKey`. Pour les URL de base, la valeur dédiée
`plugins.entries.google.config.webSearch.baseUrl` est prioritaire sur
`models.providers.google.baseUrl`.

Pour une installation du Gateway, placez les clés d’environnement dans `~/.openclaw/.env`.

## Fonctionnement

Contrairement aux fournisseurs de recherche traditionnels qui renvoient une liste de liens et d’extraits,
Gemini utilise l’ancrage dans Google Search pour produire des réponses synthétisées par l’IA avec
des citations intégrées. Les résultats comprennent à la fois la réponse synthétisée et les URL
des sources.

- Les URL de citation issues de l’ancrage Gemini sont automatiquement converties depuis les URL
  de redirection Google en URL directes au moyen d’une requête HEAD passant par le chemin de
  récupération d’OpenClaw protégé contre les SSRF (suivi des redirections, validation http/https).
- La résolution des redirections utilise des paramètres SSRF stricts par défaut ; les redirections vers
  des cibles privées ou internes sont donc bloquées.

## Paramètres pris en charge

La recherche Gemini prend en charge `query`, `freshness`, `date_after` et `date_before`.

`count` est accepté pour assurer la compatibilité avec l’outil `web_search` partagé, mais l’ancrage Gemini
renvoie toujours une seule réponse synthétisée avec des citations, plutôt qu’une liste de N
résultats.

`freshness` accepte `day`, `week`, `month`, `year`, ainsi que les raccourcis partagés
`pd`, `pw`, `pm` et `py`. `day`/`pd` ajoute une instruction de récence à la requête Gemini
au lieu d’imposer une plage stricte de 24 heures. `week`, `month`, `year` et les plages explicites
`date_after`/`date_before` définissent le `timeRangeFilter` de l’ancrage Google Search de
Gemini. `country`, `language` et `domain_filter` ne sont pas pris en charge.

## Sélection du modèle

Le modèle par défaut est `gemini-2.5-flash` (rapide et économique). Tout modèle Gemini
prenant en charge l’ancrage peut être utilisé au moyen de
`plugins.entries.google.config.webSearch.model`.

## Remplacement de l’URL de base

Définissez `plugins.entries.google.config.webSearch.baseUrl` lorsque la recherche Web Gemini
doit transiter par un proxy d’opérateur ou un point de terminaison personnalisé compatible avec Gemini. Si
cette valeur n’est pas définie, la recherche Web Gemini réutilise `models.providers.google.baseUrl`. Une valeur simple
`https://generativelanguage.googleapis.com` est normalisée en
`https://generativelanguage.googleapis.com/v1beta` ; les chemins de proxy personnalisés sont conservés
tels qu’ils sont fournis après suppression des barres obliques finales.

## Voir aussi

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec extraits
- [Perplexity Search](/fr/tools/perplexity-search) -- résultats structurés et extraction de contenu
