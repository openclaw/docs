---
read_when:
    - Vous voulez une recherche Web basée sur Tavily
    - Vous avez besoin d’une clé API Tavily
    - Vous voulez utiliser Tavily comme fournisseur `web_search`
    - Vous voulez extraire du contenu à partir d’URL
summary: Outils de recherche et d’extraction Tavily
title: Tavily
x-i18n:
    generated_at: "2026-06-27T18:21:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) est une API de recherche conçue pour les applications d’IA. OpenClaw l’expose de deux façons :

- comme fournisseur `web_search` pour l’outil de recherche générique
- comme outils de Plugin explicites : `tavily_search` et `tavily_extract`

Tavily renvoie des résultats structurés optimisés pour la consommation par les LLM, avec profondeur de recherche configurable, filtrage par sujet, filtres de domaines, résumés de réponse générés par IA et extraction de contenu à partir d’URL (y compris les pages rendues par JavaScript).

| Propriété      | Valeur                              |
| -------------- | ----------------------------------- |
| ID du Plugin   | `tavily`                            |
| Package        | `@openclaw/tavily-plugin`           |
| Authentification | `TAVILY_API_KEY` ou config `apiKey` |
| URL de base    | `https://api.tavily.com` (par défaut) |
| Outils         | `tavily_search`, `tavily_extract`   |

## Bien démarrer

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Get an API key">
    Créez un compte Tavily sur [tavily.com](https://tavily.com), puis générez une clé API dans le tableau de bord.
  </Step>
  <Step title="Configure the plugin and provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify search runs">
    Déclenchez une recherche `web_search` depuis n’importe quel agent, ou appelez directement `tavily_search`.
  </Step>
</Steps>

<Tip>
Choisir Tavily pendant l’intégration ou avec `openclaw configure --section web` installe et active le Plugin officiel Tavily si nécessaire.
</Tip>

## Référence des outils

### `tavily_search`

Utilisez ceci lorsque vous voulez des contrôles de recherche propres à Tavily au lieu du `web_search` générique.

| Paramètre         | Type                 | Contraintes / valeur par défaut        | Description                                      |
| ----------------- | -------------------- | -------------------------------------- | ------------------------------------------------ |
| `query`           | chaîne               | requis                                 | Chaîne de requête de recherche. Restez sous 400 caractères. |
| `search_depth`    | énumération          | `basic` (par défaut), `advanced`       | `advanced` est plus lent mais plus pertinent.    |
| `topic`           | énumération          | `general` (par défaut), `news`, `finance` | Filtrer par famille de sujets.                |
| `max_results`     | entier               | 1-20                                   | Nombre de résultats.                            |
| `include_answer`  | booléen              | `false` par défaut                     | Inclure un résumé de réponse généré par l’IA de Tavily. |
| `time_range`      | énumération          | `day`, `week`, `month`, `year`         | Filtrer les résultats par récence.              |
| `include_domains` | tableau de chaînes   | (aucun)                                | Inclure uniquement les résultats de ces domaines. |
| `exclude_domains` | tableau de chaînes   | (aucun)                                | Exclure les résultats de ces domaines.          |

Compromis de profondeur de recherche :

| Profondeur | Vitesse     | Pertinence | Idéal pour                                      |
| ---------- | ----------- | ---------- | ---------------------------------------------- |
| `basic`    | Plus rapide | Élevée     | Requêtes généralistes (par défaut).            |
| `advanced` | Plus lente  | Maximale   | Recherche précise et vérification factuelle.   |

### `tavily_extract`

Utilisez ceci pour extraire du contenu propre depuis une ou plusieurs URL. Gère les pages rendues par JavaScript et prend en charge le découpage ciblé par requête pour une extraction précise.

| Paramètre           | Type               | Contraintes / valeur par défaut | Description                                                 |
| ------------------- | ------------------ | ------------------------------- | ----------------------------------------------------------- |
| `urls`              | tableau de chaînes | requis, 1-20                    | URL depuis lesquelles extraire le contenu.                  |
| `query`             | chaîne             | (facultatif)                    | Réordonner les fragments extraits selon leur pertinence pour cette requête. |
| `extract_depth`     | énumération        | `basic` (par défaut), `advanced` | Utilisez `advanced` pour les pages chargées en JS, les SPA ou les tableaux dynamiques. |
| `chunks_per_source` | entier             | 1-5 ; **requiert `query`**      | Fragments renvoyés par URL. Erreur si défini sans `query`.  |
| `include_images`    | booléen            | `false` par défaut              | Inclure les URL d’images dans les résultats.                |

Compromis de profondeur d’extraction :

| Profondeur | Quand l’utiliser                             |
| ---------- | -------------------------------------------- |
| `basic`    | Pages simples. Essayez ceci en premier.      |
| `advanced` | SPA rendues par JS, contenu dynamique, tableaux. |

<Tip>
Regroupez les grandes listes d’URL en plusieurs appels `tavily_extract` (20 maximum par requête). Utilisez `query` avec `chunks_per_source` pour obtenir uniquement le contenu pertinent au lieu de pages complètes.
</Tip>

## Choisir le bon outil

| Besoin                                      | Outil            |
| ------------------------------------------- | ---------------- |
| Recherche web rapide, sans options spéciales | `web_search`     |
| Recherche avec profondeur, sujet, réponses IA | `tavily_search`  |
| Extraire le contenu d’URL spécifiques        | `tavily_extract` |

<Note>
L’outil générique `web_search` avec Tavily comme fournisseur prend en charge `query` et `count` (jusqu’à 20 résultats). Pour les contrôles propres à Tavily (`search_depth`, `topic`, `include_answer`, filtres de domaines, plage temporelle), utilisez plutôt `tavily_search`.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="API key resolution order">
    Le client Tavily recherche sa clé API dans cet ordre :

    1. `plugins.entries.tavily.config.webSearch.apiKey` (résolue via SecretRefs).
    2. `TAVILY_API_KEY` depuis l’environnement du Gateway.

    `tavily_extract` génère une erreur de configuration si aucune des deux n’est présente.

  </Accordion>

  <Accordion title="Custom base URL">
    Remplacez `plugins.entries.tavily.config.webSearch.baseUrl` si vous faites passer Tavily par un proxy. La valeur par défaut est `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` rejette les appels qui transmettent `chunks_per_source` sans `query`. Tavily classe les fragments selon leur pertinence par rapport à la requête, donc ce paramètre n’a pas de sens sans requête.
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/fr/tools/web" icon="magnifying-glass">
    Tous les fournisseurs et règles de détection automatique.
  </Card>
  <Card title="Firecrawl" href="/fr/tools/firecrawl" icon="fire">
    Recherche plus scraping avec extraction de contenu.
  </Card>
  <Card title="Exa Search" href="/fr/tools/exa-search" icon="binoculars">
    Recherche neuronale avec extraction de contenu.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Schéma de configuration complet pour les entrées de Plugin et le routage des outils.
  </Card>
</CardGroup>
