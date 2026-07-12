---
read_when:
    - Vous souhaitez utiliser la recherche web propulsée par Tavily
    - Vous avez besoin d’une clé API Tavily
    - Vous souhaitez utiliser Tavily comme fournisseur pour `web_search`
    - Vous souhaitez extraire du contenu à partir d’URL
summary: Outils de recherche et d’extraction Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-12T03:11:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) est une API de recherche conçue pour les applications d’IA. OpenClaw l’expose de deux manières :

- comme fournisseur `web_search` pour l’outil de recherche générique
- comme outils explicites du Plugin : `tavily_search` et `tavily_extract`

Tavily renvoie des résultats structurés optimisés pour être exploités par les LLM, avec une profondeur de recherche configurable, un filtrage par sujet, des filtres de domaines, des résumés de réponses générés par l’IA et l’extraction de contenu à partir d’URL (y compris les pages rendues en JavaScript).

| Propriété     | Valeur                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| ID du Plugin  | `tavily`                                                                                                    |
| Paquet        | `@openclaw/tavily-plugin`                                                                                   |
| Authentification | variable d’environnement `TAVILY_API_KEY` ou configuration `apiKey`                                     |
| URL de base   | `https://api.tavily.com` (par défaut) ; variable d’environnement `TAVILY_BASE_URL` ou configuration `baseUrl` pour la remplacer |
| Délais d’expiration | 30 s pour la recherche, 60 s pour l’extraction (par défaut)                                          |
| Outils        | `tavily_search`, `tavily_extract`                                                                           |

## Prise en main

<Steps>
  <Step title="Installer le Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Obtenir une clé d’API">
    Créez un compte Tavily sur [tavily.com](https://tavily.com), puis générez une clé d’API dans le tableau de bord.
  </Step>
  <Step title="Configurer le Plugin et le fournisseur">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // facultatif si TAVILY_API_KEY est défini
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
  <Step title="Vérifier l’exécution des recherches">
    Déclenchez une recherche `web_search` depuis n’importe quel agent, ou appelez directement `tavily_search`.
  </Step>
</Steps>

<Tip>
La sélection de Tavily lors de l’intégration ou dans `openclaw configure --section web` installe et active le Plugin Tavily officiel si nécessaire.
</Tip>

## Référence des outils

### `tavily_search`

Utilisez cet outil lorsque vous souhaitez disposer des options de recherche propres à Tavily plutôt que de l’outil générique `web_search`.

| Paramètre         | Type                | Contraintes / valeur par défaut         | Description                                                   |
| ----------------- | ------------------- | --------------------------------------- | ------------------------------------------------------------- |
| `query`           | chaîne de caractères | obligatoire                             | Chaîne de la requête de recherche.                            |
| `search_depth`    | énumération         | `basic` (par défaut), `advanced`        | `advanced` est plus lent, mais offre une meilleure pertinence. |
| `topic`           | énumération         | `general` (par défaut), `news`, `finance` | Filtre par famille de sujets.                               |
| `max_results`     | entier              | 1 à 20, `5` par défaut                  | Nombre de résultats.                                          |
| `include_answer`  | booléen             | `false` par défaut                      | Inclut un résumé de réponse généré par l’IA de Tavily.         |
| `time_range`      | énumération         | `day`, `week`, `month`, `year`          | Filtre les résultats selon leur récence.                      |
| `include_domains` | tableau de chaînes  | (aucun)                                 | Inclut uniquement les résultats provenant de ces domaines.    |
| `exclude_domains` | tableau de chaînes  | (aucun)                                 | Exclut les résultats provenant de ces domaines.               |

Compromis lié à la profondeur de recherche :

| Profondeur | Vitesse     | Pertinence | Idéal pour                                       |
| ---------- | ----------- | ---------- | ------------------------------------------------ |
| `basic`    | Plus rapide | Élevée     | Requêtes générales (par défaut).                 |
| `advanced` | Plus lent   | Maximale   | Recherches de précision et vérification de faits. |

### `tavily_extract`

Utilisez cet outil pour extraire du contenu épuré à partir d’une ou de plusieurs URL. Il prend en charge les pages rendues en JavaScript et le découpage ciblé selon une requête pour une extraction précise.

| Paramètre           | Type                | Contraintes / valeur par défaut | Description                                                              |
| ------------------- | ------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| `urls`              | tableau de chaînes  | obligatoire, 1 à 20             | URL dont le contenu doit être extrait.                                   |
| `query`             | chaîne de caractères | (facultatif)                     | Reclasse les fragments extraits selon leur pertinence pour cette requête. |
| `extract_depth`     | énumération         | `basic` (par défaut), `advanced` | Utilisez `advanced` pour les pages riches en JS, les SPA ou les tableaux dynamiques. |
| `chunks_per_source` | entier              | 1 à 5 ; **nécessite `query`**   | Nombre de fragments renvoyés par URL. Génère une erreur s’il est défini sans `query`. |
| `include_images`    | booléen             | `false` par défaut              | Inclut les URL des images dans les résultats.                            |

Compromis lié à la profondeur d’extraction :

| Profondeur | Quand l’utiliser                                      |
| ---------- | ----------------------------------------------------- |
| `basic`    | Pages simples. Essayez d’abord cette option.          |
| `advanced` | SPA rendues en JS, contenu dynamique et tableaux.     |

<Tip>
Répartissez les longues listes d’URL entre plusieurs appels à `tavily_extract` (20 au maximum par requête). Utilisez `query` avec `chunks_per_source` pour obtenir uniquement le contenu pertinent plutôt que des pages complètes.
</Tip>

## Choisir le bon outil

| Besoin                                               | Outil             |
| ---------------------------------------------------- | ----------------- |
| Recherche web rapide, sans option particulière       | `web_search`      |
| Recherche avec profondeur, sujet et réponses de l’IA | `tavily_search`   |
| Extraction du contenu d’URL précises                 | `tavily_extract`  |

<Note>
L’outil générique `web_search` utilisant Tavily comme fournisseur prend en charge `query` et `count` (jusqu’à 20 résultats). Pour les options propres à Tavily (`search_depth`, `topic`, `include_answer`, filtres de domaines et période), utilisez plutôt `tavily_search`.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Ordre de résolution de la clé d’API">
    Le client Tavily recherche sa clé d’API dans l’ordre suivant :

    1. `plugins.entries.tavily.config.webSearch.apiKey` (résolue au moyen de SecretRefs).
    2. `TAVILY_API_KEY` dans l’environnement du Gateway.

    `tavily_search` et `tavily_extract` génèrent tous deux une erreur de configuration si aucune des deux n’est présente.

  </Accordion>

  <Accordion title="URL de base personnalisée">
    Remplacez `plugins.entries.tavily.config.webSearch.baseUrl`, ou définissez `TAVILY_BASE_URL`, si vous faites transiter Tavily par un proxy. La configuration est prioritaire sur la variable d’environnement. La valeur par défaut est `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` nécessite `query`">
    `tavily_extract` rejette les appels qui transmettent `chunks_per_source` sans `query`. Tavily classe les fragments selon leur pertinence par rapport à la requête ; ce paramètre n’a donc aucun sens sans requête.
  </Accordion>
</AccordionGroup>

## Rubriques connexes

<CardGroup cols={2}>
  <Card title="Présentation de la recherche web" href="/fr/tools/web" icon="magnifying-glass">
    Tous les fournisseurs et toutes les règles de détection automatique.
  </Card>
  <Card title="Firecrawl" href="/fr/tools/firecrawl" icon="fire">
    Recherche et collecte de données avec extraction de contenu.
  </Card>
  <Card title="Recherche Exa" href="/fr/tools/exa-search" icon="binoculars">
    Recherche neuronale avec extraction de contenu.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Schéma de configuration complet des entrées de Plugins et du routage des outils.
  </Card>
</CardGroup>
