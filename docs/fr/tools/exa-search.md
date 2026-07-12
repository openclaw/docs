---
read_when:
    - Vous souhaitez utiliser Exa pour web_search
    - Vous avez besoin d’une `EXA_API_KEY`
    - Vous souhaitez effectuer une recherche neuronale ou extraire du contenu
summary: Recherche Exa AI — recherche neuronale et par mots-clés avec extraction de contenu
title: Recherche Exa
x-i18n:
    generated_at: "2026-07-12T03:08:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) est un fournisseur de `web_search` proposant des modes de recherche neuronale, par mots-clés et
hybride, ainsi qu’une extraction de contenu intégrée (passages clés, texte,
résumés).

## Installer le Plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Obtenir une clé d’API

<Steps>
  <Step title="Créer un compte">
    Inscrivez-vous sur [exa.ai](https://exa.ai/) et générez une clé d’API depuis votre
    tableau de bord.
  </Step>
  <Step title="Stocker la clé">
    Définissez `EXA_API_KEY` dans l’environnement du Gateway, ou configurez-la via :

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
            baseUrl: "https://api.exa.ai", // facultatif ; OpenClaw ajoute /search
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

**Autre possibilité avec une variable d’environnement :** définissez `EXA_API_KEY` dans l’environnement du Gateway. Pour
une installation du Gateway, placez-la dans `~/.openclaw/.env`. Consultez
[Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

## Remplacement de l’URL de base

Définissez `plugins.entries.exa.config.webSearch.baseUrl` pour acheminer les requêtes de recherche Exa
via un proxy compatible ou un autre point de terminaison. OpenClaw
normalise les hôtes sans protocole en ajoutant `https://` au début et ajoute `/search`, sauf si
le chemin se termine déjà ainsi. Le point de terminaison résolu fait partie de la clé du cache de
recherche ; les résultats provenant de points de terminaison différents ne sont donc jamais partagés.

## Paramètres de l’outil

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number" default="5">
Nombre de résultats à renvoyer (1 à 100, dans les limites du type de recherche Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Mode de recherche.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtre temporel. Ne peut pas être combiné avec `date_after`/`date_before`.
</ParamField>

<ParamField path="date_after" type="string">
Résultats postérieurs à cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Résultats antérieurs à cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Options d’extraction du contenu (voir ci-dessous).
</ParamField>

### Extraction du contenu

Transmettez un objet `contents` pour contrôler le contenu extrait dans les résultats :

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // texte intégral de la page
    highlights: { numSentences: 3 }, // phrases clés
    summary: true, // résumé généré par l’IA
  },
});
```

| Option de contenu | Type                                                                  | Description                       |
| ----------------- | --------------------------------------------------------------------- | --------------------------------- |
| `text`            | `boolean \| { maxCharacters }`                                        | Extraire le texte intégral de la page |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extraire les phrases clés         |
| `summary`         | `boolean \| { query }`                                                | Résumé généré par l’IA            |

Si `contents` est omis, Exa utilise par défaut `{ highlights: true }` afin que les résultats
incluent des extraits de phrases clés. Les descriptions des résultats sont obtenues d’abord à partir des passages clés,
puis du résumé, puis du texte intégral, selon le premier élément disponible. Les résultats
conservent également les champs bruts `highlightScores` et `summary` de la réponse de l’API Exa
lorsqu’ils sont disponibles.

### Modes de recherche

| Mode             | Description                                      |
| ---------------- | ------------------------------------------------ |
| `auto`           | Exa choisit le meilleur mode (par défaut)        |
| `neural`         | Recherche sémantique fondée sur le sens          |
| `fast`           | Recherche rapide par mots-clés                   |
| `deep`           | Recherche approfondie et exhaustive              |
| `deep-reasoning` | Recherche approfondie avec raisonnement          |
| `instant`        | Résultats les plus rapides                       |

## Remarques

- `count` accepte jusqu’à 100, dans les limites du type de recherche Exa.
- Les résultats sont mis en cache pendant 15 minutes par défaut. Configurez les paramètres partagés
  `tools.web.search.cacheTtlMinutes` (en minutes) et
  `tools.web.search.timeoutSeconds` (30 s par défaut) pour modifier la mise en cache et
  le délai d’expiration des requêtes pour tous les fournisseurs de `web_search`, y compris Exa.

## Voir aussi

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec filtres par pays et par langue
- [Perplexity Search](/fr/tools/perplexity-search) -- résultats structurés avec filtrage par domaine
