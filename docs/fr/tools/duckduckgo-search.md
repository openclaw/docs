---
read_when:
    - Vous souhaitez un fournisseur de recherche web ne nécessitant aucune clé API
    - Vous souhaitez utiliser DuckDuckGo pour web_search
    - Vous souhaitez sélectionner explicitement un fournisseur de recherche sans clé
summary: Recherche web DuckDuckGo -- fournisseur sans clé (expérimental, basé sur HTML)
title: Recherche DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T03:11:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw prend en charge DuckDuckGo comme fournisseur `web_search` **sans clé**. Aucune clé d’API ni aucun compte n’est requis.

<Warning>
  DuckDuckGo est une intégration **expérimentale et non officielle** qui extrait les données des pages de recherche HTML sans JavaScript de DuckDuckGo ; il ne s’agit pas d’une API officielle. Attendez-vous à des interruptions occasionnelles dues aux pages de vérification anti-robots ou aux modifications du HTML.
</Warning>

## Configuration initiale

DuckDuckGo n’est jamais sélectionné automatiquement, car la détection automatique ne prend en compte que les fournisseurs disposant d’identifiants utilisables. Sélectionnez-le explicitement :

<Steps>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    # Sélectionnez "duckduckgo" comme fournisseur
    ```
  </Step>
</Steps>

## Configuration

Définissez directement le fournisseur dans la configuration :

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

Paramètres facultatifs du Plugin pour la région et SafeSearch :

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // Code de région DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" ou "off"
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
Nombre de résultats à renvoyer (1 à 10).
</ParamField>

<ParamField path="region" type="string">
Code de région DuckDuckGo (par exemple, `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Niveau de SafeSearch.
</ParamField>

Les paramètres d’outil `region` et `safeSearch` remplacent, pour chaque requête, les valeurs de configuration du Plugin indiquées ci-dessus.

## Remarques

- **Aucune clé d’API** — fonctionne dès que DuckDuckGo est sélectionné comme fournisseur `web_search`.
- **Expérimental** — extrait les données des pages de recherche HTML sans JavaScript de DuckDuckGo ; il ne s’agit pas d’une API ni d’un SDK officiel. Les résultats dépendent de la structure des pages, qui peut changer sans préavis.
- **Risque de vérification anti-robots** — DuckDuckGo peut présenter des CAPTCHA ou bloquer les requêtes en cas d’utilisation intensive ou automatisée.
- **Sélection explicite uniquement** — la détection automatique d’OpenClaw ne prend en compte que les fournisseurs disposant d’identifiants utilisables. Un fournisseur sans clé comme DuckDuckGo n’est donc jamais choisi automatiquement ; vous devez définir `provider: "duckduckgo"`.
- **SafeSearch utilise `moderate` par défaut** lorsqu’il n’est pas configuré.

<Tip>
  Pour une utilisation en production, envisagez [Brave Search](/fr/tools/brave-search) (offre gratuite disponible) ou un autre fournisseur reposant sur une API.
</Tip>

## Voir aussi

- [Présentation de la recherche Web](/fr/tools/web) — tous les fournisseurs et la détection automatique
- [Brave Search](/fr/tools/brave-search) — résultats structurés avec une offre gratuite
- [Exa Search](/fr/tools/exa-search) — recherche neuronale avec extraction de contenu
