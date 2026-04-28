---
read_when:
    - Vous voulez utiliser Exa pour `web_search`
    - Vous avez besoin d’un `EXA_API_KEY`
    - Vous voulez la recherche neuronale ou l’extraction de contenu
summary: Recherche Exa AI — recherche neuronale et par mots-clés avec extraction de contenu
title: Recherche Exa
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T07:36:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw prend en charge [Exa AI](https://exa.ai/) comme fournisseur `web_search`. Exa
propose des modes de recherche neuronale, par mots-clés et hybrides avec extraction de contenu
intégrée (highlights, texte, résumés).

## Obtenir une clé API

<Steps>
  <Step title="Créer un compte">
    Inscrivez-vous sur [exa.ai](https://exa.ai/) et générez une clé API depuis votre
    tableau de bord.
  </Step>
  <Step title="Stocker la clé">
    Définissez `EXA_API_KEY` dans l’environnement du Gateway, ou configurez via :

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // facultatif si EXA_API_KEY est défini
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternative par variable d’environnement :** définissez `EXA_API_KEY` dans l’environnement du Gateway.
Pour une installation de gateway, placez-la dans `~/.openclaw/.env`.

## Paramètres de l’outil

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number">
Résultats à renvoyer (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Mode de recherche.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtre temporel.
</ParamField>

<ParamField path="date_after" type="string">
Résultats après cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Résultats avant cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Options d’extraction de contenu (voir ci-dessous).
</ParamField>

### Extraction de contenu

Exa peut renvoyer du contenu extrait en plus des résultats de recherche. Passez un objet `contents`
pour l’activer :

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Option de contenu | Type                                                                  | Description                   |
| ----------------- | --------------------------------------------------------------------- | ----------------------------- |
| `text`            | `boolean \| { maxCharacters }`                                        | Extraire le texte complet de la page |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extraire les phrases clés     |
| `summary`         | `boolean \| { query }`                                                | Résumé généré par IA          |

### Modes de recherche

| Mode             | Description                               |
| ---------------- | ----------------------------------------- |
| `auto`           | Exa choisit le meilleur mode (par défaut) |
| `neural`         | Recherche sémantique / basée sur le sens  |
| `fast`           | Recherche rapide par mots-clés            |
| `deep`           | Recherche approfondie                     |
| `deep-reasoning` | Recherche approfondie avec raisonnement   |
| `instant`        | Résultats les plus rapides                |

## Remarques

- Si aucune option `contents` n’est fournie, Exa utilise par défaut `{ highlights: true }`
  afin que les résultats incluent des extraits de phrases clés
- Les résultats conservent les champs `highlightScores` et `summary` de la réponse
  API Exa lorsqu’ils sont disponibles
- Les descriptions de résultat sont résolues d’abord à partir des highlights, puis du résumé, puis
  du texte complet — selon ce qui est disponible
- `freshness` et `date_after`/`date_before` ne peuvent pas être combinés — utilisez un
  seul mode de filtrage temporel
- Jusqu’à 100 résultats peuvent être renvoyés par requête (sous réserve des limites de
  type de recherche Exa)
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via
  `cacheTtlMinutes`)
- Exa est une intégration API officielle avec des réponses JSON structurées

## Associé

- [Vue d’ensemble de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Recherche Brave](/fr/tools/brave-search) -- résultats structurés avec filtres pays/langue
- [Recherche Perplexity](/fr/tools/perplexity-search) -- résultats structurés avec filtrage de domaines
