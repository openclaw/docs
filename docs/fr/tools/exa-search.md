---
read_when:
    - Vous voulez utiliser Exa pour web_search
    - Vous avez besoin d’une EXA_API_KEY
    - Vous voulez une recherche neuronale ou une extraction de contenu
summary: Recherche Exa AI -- recherche neuronale et par mots-clés avec extraction de contenu
title: Recherche Exa
x-i18n:
    generated_at: "2026-06-27T18:17:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw prend en charge [Exa AI](https://exa.ai/) comme fournisseur `web_search`. Exa
propose des modes de recherche neuronale, par mots-clés et hybride, avec
extraction de contenu intégrée (extraits, texte, résumés).

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez Gateway:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Obtenir une clé API

<Steps>
  <Step title="Créer un compte">
    Inscrivez-vous sur [exa.ai](https://exa.ai/) et générez une clé API depuis votre
    tableau de bord.
  </Step>
  <Step title="Stocker la clé">
    Définissez `EXA_API_KEY` dans l’environnement Gateway, ou configurez-la via:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**Alternative par environnement:** définissez `EXA_API_KEY` dans l’environnement Gateway.
Pour une installation de Gateway, placez-la dans `~/.openclaw/.env`.

## Remplacement de l’URL de base

Définissez `plugins.entries.exa.config.webSearch.baseUrl` lorsque les requêtes de recherche Exa
doivent passer par un proxy compatible ou un autre point de terminaison Exa. OpenClaw
normalise les hôtes nus en ajoutant `https://` au début et ajoute `/search`, sauf si le
chemin se termine déjà ainsi. Le point de terminaison résolu est inclus dans la clé de cache
de recherche, afin que les résultats provenant de différents points de terminaison Exa ne soient pas partagés.

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

Exa peut renvoyer le contenu extrait avec les résultats de recherche. Transmettez un objet `contents`
pour l’activer:

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

| Option de contenu | Type                                                                  | Description                         |
| ----------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `text`            | `boolean \| { maxCharacters }`                                        | Extraire le texte complet de la page |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extraire les phrases clés           |
| `summary`         | `boolean \| { query }`                                                | Résumé généré par IA                |

### Modes de recherche

| Mode             | Description                                      |
| ---------------- | ------------------------------------------------ |
| `auto`           | Exa choisit le meilleur mode (par défaut)        |
| `neural`         | Recherche sémantique/fondée sur le sens          |
| `fast`           | Recherche rapide par mots-clés                   |
| `deep`           | Recherche approfondie complète                   |
| `deep-reasoning` | Recherche approfondie avec raisonnement          |
| `instant`        | Résultats les plus rapides                       |

## Notes

- Si aucune option `contents` n’est fournie, Exa utilise par défaut `{ highlights: true }`
  afin que les résultats incluent des extraits de phrases clés
- Les résultats conservent les champs `highlightScores` et `summary` de la réponse de l’API Exa
  lorsqu’ils sont disponibles
- Les descriptions des résultats sont résolues à partir des extraits en premier, puis du résumé, puis
  du texte complet — selon ce qui est disponible
- `freshness` et `date_after`/`date_before` ne peuvent pas être combinés — utilisez un seul
  mode de filtre temporel
- Jusqu’à 100 résultats peuvent être renvoyés par requête (sous réserve des limites
  du type de recherche Exa)
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via
  `cacheTtlMinutes`)
- Exa est une intégration d’API officielle avec des réponses JSON structurées

## Associé

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec filtres de pays/langue
- [Perplexity Search](/fr/tools/perplexity-search) -- résultats structurés avec filtrage par domaine
