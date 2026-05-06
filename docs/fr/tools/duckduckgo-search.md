---
read_when:
    - Vous voulez un fournisseur de recherche web qui ne nécessite aucune clé API
    - Vous souhaitez utiliser DuckDuckGo pour web_search
    - Vous avez besoin d’une solution de repli de recherche sans configuration
summary: Recherche web DuckDuckGo -- fournisseur de repli sans clé (expérimental, basé sur HTML)
title: Recherche DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T07:40:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw prend en charge DuckDuckGo comme fournisseur `web_search` **sans clé**. Aucune clé API ni aucun compte n’est requis.

<Warning>
  DuckDuckGo est une intégration **expérimentale et non officielle** qui récupère des résultats
  depuis les pages de recherche sans JavaScript de DuckDuckGo, et non depuis une API officielle. Prévoyez
  des ruptures occasionnelles dues à des pages de défi anti-bot ou à des modifications HTML.
</Warning>

## Configuration

Aucune clé API n’est nécessaire : définissez simplement DuckDuckGo comme fournisseur :

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
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

Paramètres optionnels au niveau du Plugin pour la région et SafeSearch :

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
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
Résultats à retourner (1-10).
</ParamField>

<ParamField path="region" type="string">
Code de région DuckDuckGo (par exemple `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Niveau SafeSearch.
</ParamField>

La région et SafeSearch peuvent aussi être définis dans la configuration du Plugin (voir ci-dessus) ; les
paramètres de l’outil remplacent les valeurs de configuration pour chaque requête.

## Notes

- **Aucune clé API** : fonctionne immédiatement, sans configuration
- **Expérimental** : collecte les résultats depuis les pages de recherche HTML sans JavaScript
  de DuckDuckGo, et non depuis une API ou un SDK officiel
- **Risque de défi anti-bot** : DuckDuckGo peut servir des CAPTCHA ou bloquer les requêtes
  en cas d’utilisation intensive ou automatisée
- **Analyse HTML** : les résultats dépendent de la structure de la page, qui peut changer sans
  préavis
- **Ordre de détection automatique** : DuckDuckGo est le premier recours sans clé
  (ordre 100) dans la détection automatique. Les fournisseurs avec API disposant de clés configurées s’exécutent
  d’abord, puis Ollama Web Search (ordre 110), puis SearXNG (ordre 200)
- **SafeSearch utilise moderate par défaut** lorsqu’il n’est pas configuré

<Tip>
  Pour une utilisation en production, envisagez [Brave Search](/fr/tools/brave-search) (offre gratuite
  disponible) ou un autre fournisseur avec API.
</Tip>

## Articles connexes

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec offre gratuite
- [Exa Search](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
