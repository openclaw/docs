---
read_when:
    - Vous voulez un fournisseur de recherche Web qui ne nécessite aucune clé API
    - Vous voulez utiliser DuckDuckGo pour `web_search`
    - Vous avez besoin d’un repli de recherche sans configuration
summary: Recherche Web DuckDuckGo -- fournisseur de repli sans clé (expérimental, basé sur HTML)
title: Recherche DuckDuckGo
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T07:35:49Z"
  model: gpt-5.4
  provider: openai
  source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
  source_path: tools/duckduckgo-search.md
  workflow: 15
---

OpenClaw prend en charge DuckDuckGo comme fournisseur `web_search` **sans clé**. Aucune clé API ni aucun compte ne sont requis.

<Warning>
  DuckDuckGo est une intégration **expérimentale et non officielle** qui récupère les résultats
  à partir des pages de recherche non JavaScript de DuckDuckGo — pas d’une API officielle. Attendez-vous à
  des cassures occasionnelles dues aux pages de défi anti-bot ou aux changements HTML.
</Warning>

## Configuration

Aucune clé API nécessaire — définissez simplement DuckDuckGo comme fournisseur :

<Steps>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    # Sélectionnez "duckduckgo" comme fournisseur
    ```
  </Step>
</Steps>

## Configuration

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Paramètres facultatifs au niveau Plugin pour la région et SafeSearch :

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // code de région DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate", ou "off"
          },
        },
      },
    },
  },
}
```

## Paramètres de l’outil

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number" default="5">
Nombre de résultats à renvoyer (1–10).
</ParamField>

<ParamField path="region" type="string">
Code de région DuckDuckGo (par ex. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Niveau de SafeSearch.
</ParamField>

La région et SafeSearch peuvent aussi être définis dans la configuration du Plugin (voir ci-dessus) — les
paramètres de l’outil remplacent les valeurs de configuration pour chaque requête.

## Remarques

- **Aucune clé API** — fonctionne immédiatement, sans configuration
- **Expérimental** — rassemble les résultats depuis les pages de recherche HTML non JavaScript
  de DuckDuckGo, pas depuis une API ou un SDK officiel
- **Risque de défi anti-bot** — DuckDuckGo peut servir des CAPTCHA ou bloquer les requêtes
  en cas d’usage intensif ou automatisé
- **Analyse HTML** — les résultats dépendent de la structure des pages, qui peut changer sans
  préavis
- **Ordre d’auto-détection** — DuckDuckGo est le premier repli sans clé
  (ordre 100) dans l’auto-détection. Les fournisseurs adossés à une API avec des clés configurées s’exécutent
  d’abord, puis Ollama Web Search (ordre 110), puis SearXNG (ordre 200)
- **SafeSearch vaut par défaut moderate** lorsqu’il n’est pas configuré

<Tip>
  Pour un usage de production, envisagez [Brave Search](/fr/tools/brave-search) (niveau gratuit
  disponible) ou un autre fournisseur adossé à une API.
</Tip>

## Lié

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec niveau gratuit
- [Exa Search](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
