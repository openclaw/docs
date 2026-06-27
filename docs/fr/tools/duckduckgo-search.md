---
read_when:
    - Vous souhaitez un fournisseur de recherche web qui ne nécessite aucune clé API
    - Vous voulez utiliser DuckDuckGo pour web_search
    - Vous voulez un fournisseur de recherche sans clé explicitement sélectionné
summary: Recherche web DuckDuckGo -- fournisseur sans clé (expérimental, basé sur HTML)
title: Recherche DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:16:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw prend en charge DuckDuckGo comme fournisseur `web_search` **sans clé**. Aucune clé API
ni aucun compte n’est requis.

<Warning>
  DuckDuckGo est une intégration **expérimentale et non officielle** qui récupère les résultats
  depuis les pages de recherche sans JavaScript de DuckDuckGo, et non depuis une API officielle. Attendez-vous
  à des interruptions occasionnelles dues à des pages de défi anti-bot ou à des modifications HTML.
</Warning>

## Configuration

Aucune clé API n’est nécessaire : définissez simplement DuckDuckGo comme fournisseur :

<Steps>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Config

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
Résultats à renvoyer (1 à 10).
</ParamField>

<ParamField path="region" type="string">
Code de région DuckDuckGo (par exemple `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Niveau de SafeSearch.
</ParamField>

La région et SafeSearch peuvent également être définis dans la configuration du Plugin (voir ci-dessus) ; les
paramètres de l’outil remplacent les valeurs de configuration pour chaque requête.

## Remarques

- **Aucune clé API** : fonctionne après avoir sélectionné DuckDuckGo comme fournisseur
  `web_search`
- **Expérimental** : collecte les résultats depuis les pages HTML sans JavaScript de DuckDuckGo,
  et non depuis une API ou un SDK officiel
- **Risque de défi anti-bot** : DuckDuckGo peut afficher des CAPTCHA ou bloquer les requêtes
  en cas d’utilisation intensive ou automatisée
- **Analyse HTML** : les résultats dépendent de la structure de la page, qui peut changer sans
  préavis
- **Sélection explicite** : OpenClaw ne choisit pas DuckDuckGo automatiquement
  lorsqu’aucun fournisseur adossé à une API n’est configuré
- **SafeSearch est modéré par défaut** lorsqu’il n’est pas configuré

<Tip>
  Pour une utilisation en production, envisagez [Brave Search](/fr/tools/brave-search) (niveau gratuit
  disponible) ou un autre fournisseur adossé à une API.
</Tip>

## Associés

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec niveau gratuit
- [Exa Search](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
