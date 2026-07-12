---
read_when:
    - Vous souhaitez utiliser la recherche Web via Tavily
    - Vous avez besoin d’une clé API Tavily
    - Vous souhaitez utiliser Tavily comme fournisseur de web_search
    - Vous souhaitez extraire du contenu à partir d’URL
summary: Outils de recherche et d’extraction Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-12T15:56:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) est une API de recherche conçue pour les applications d’IA. OpenClaw l’expose de deux manières :

- comme fournisseur `web_search` pour l’outil de recherche générique
- sous forme d’outils de Plugin explicites : `tavily_search` et `tavily_extract`

Tavily renvoie des résultats structurés optimisés pour être exploités par les LLM, avec une profondeur de recherche configurable, un filtrage par sujet, des filtres de domaines, des résumés de réponses générés par l’IA et l’extraction de contenu à partir d’URL, y compris les pages rendues en JavaScript.

| Propriété      | Valeur                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| Identifiant du Plugin | `tavily`                                                                                                     |
| Paquet         | `@openclaw/tavily-plugin`                                                                                           |
| Authentification | variable d’environnement `TAVILY_API_KEY` ou option de configuration `apiKey`                                    |
| URL de base    | `https://api.tavily.com` (par défaut) ; variable d’environnement `TAVILY_BASE_URL` ou option `baseUrl` pour la remplacer |
| Délais d’expiration | 30 s pour la recherche, 60 s pour l’extraction (par défaut)                                                    |
| Outils         | `tavily_search`, `tavily_extract`                                                                                   |

## Bien démarrer

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
  <Step title="Vérifier l’exécution de la recherche">
    Déclenchez une recherche `web_search` depuis n’importe quel agent ou appelez directement `tavily_search`.
  </Step>
</Steps>

<Tip>
La sélection de Tavily lors de l’intégration initiale ou avec `openclaw configure --section web` installe et active le Plugin Tavily officiel si nécessaire.
</Tip>

## Référence des outils

### `tavily_search`

Utilisez cet outil lorsque vous souhaitez disposer des paramètres de recherche propres à Tavily plutôt que de l’outil générique `web_search`.

| Paramètre         | Type                | Contraintes / valeur par défaut             | Description                                                   |
| ----------------- | ------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `query`           | chaîne de caractères | requis                                      | Chaîne de requête de recherche.                               |
| `search_depth`    | énumération         | `basic` (par défaut), `advanced`            | `advanced` est plus lent, mais offre une meilleure pertinence. |
| `topic`           | énumération         | `general` (par défaut), `news`, `finance`   | Filtre selon la catégorie de sujet.                           |
| `max_results`     | entier              | 1-20, valeur par défaut : `5`               | Nombre de résultats.                                          |
| `include_answer`  | booléen             | valeur par défaut : `false`                 | Inclut un résumé de réponse généré par l’IA de Tavily.         |
| `time_range`      | énumération         | `day`, `week`, `month`, `year`              | Filtre les résultats selon leur récence.                      |
| `include_domains` | tableau de chaînes  | (aucun)                                     | Inclut uniquement les résultats provenant de ces domaines.    |
| `exclude_domains` | tableau de chaînes  | (aucun)                                     | Exclut les résultats provenant de ces domaines.               |

Compromis liés à la profondeur de recherche :

| Profondeur | Vitesse     | Pertinence | Idéal pour                                      |
| ---------- | ----------- | ---------- | ----------------------------------------------- |
| `basic`    | Plus rapide | Élevée     | Requêtes générales (par défaut).                |
| `advanced` | Plus lent   | Maximale   | Recherches précises et vérification de faits.   |

### `tavily_extract`

Utilisez cet outil pour extraire du contenu épuré à partir d’une ou de plusieurs URL. Il prend en charge les pages rendues en JavaScript et le découpage axé sur une requête pour une extraction ciblée.

| Paramètre           | Type               | Contraintes / valeur par défaut       | Description                                                               |
| ------------------- | ------------------ | ------------------------------------- | ------------------------------------------------------------------------- |
| `urls`              | tableau de chaînes | requis, 1-20                          | URL dont extraire le contenu.                                             |
| `query`             | chaîne de caractères | (facultatif)                        | Reclasse les segments extraits selon leur pertinence par rapport à cette requête. |
| `extract_depth`     | énumération        | `basic` (par défaut), `advanced`      | Utilisez `advanced` pour les pages riches en JS, les SPA ou les tableaux dynamiques. |
| `chunks_per_source` | entier             | 1-5 ; **nécessite `query`**           | Nombre de segments renvoyés par URL. Génère une erreur si défini sans `query`. |
| `include_images`    | booléen            | valeur par défaut : `false`           | Inclut les URL des images dans les résultats.                             |

Compromis liés à la profondeur d’extraction :

| Profondeur | Quand l’utiliser                                      |
| ---------- | ----------------------------------------------------- |
| `basic`    | Pages simples. Essayez d’abord cette option.          |
| `advanced` | SPA rendues en JS, contenu dynamique, tableaux.       |

<Tip>
Répartissez les longues listes d’URL entre plusieurs appels à `tavily_extract` (20 au maximum par requête). Utilisez `query` avec `chunks_per_source` pour obtenir uniquement le contenu pertinent au lieu des pages complètes.
</Tip>

## Choisir le bon outil

| Besoin                                              | Outil             |
| --------------------------------------------------- | ----------------- |
| Recherche web rapide, sans option particulière      | `web_search`      |
| Recherche avec profondeur, sujet et réponses d’IA   | `tavily_search`   |
| Extraction de contenu à partir d’URL précises       | `tavily_extract`  |

<Note>
L’outil générique `web_search`, avec Tavily comme fournisseur, prend en charge `query` et `count` (jusqu’à 20 résultats). Pour utiliser les paramètres propres à Tavily (`search_depth`, `topic`, `include_answer`, filtres de domaines, plage temporelle), utilisez plutôt `tavily_search`.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Ordre de résolution de la clé d’API">
    Le client Tavily recherche sa clé d’API dans l’ordre suivant :

    1. `plugins.entries.tavily.config.webSearch.apiKey` (résolu au moyen des SecretRefs).
    2. `TAVILY_API_KEY` provenant de l’environnement du Gateway.

    `tavily_search` et `tavily_extract` génèrent tous deux une erreur de configuration si aucun des deux n’est présent.

  </Accordion>

  <Accordion title="URL de base personnalisée">
    Remplacez `plugins.entries.tavily.config.webSearch.baseUrl` ou définissez `TAVILY_BASE_URL` si vous faites passer Tavily par un proxy. La configuration est prioritaire sur la variable d’environnement. La valeur par défaut est `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` nécessite `query`">
    `tavily_extract` rejette les appels qui transmettent `chunks_per_source` sans `query`. Tavily classe les segments selon leur pertinence par rapport à la requête ; ce paramètre n’a donc aucun sens sans requête.
  </Accordion>
</AccordionGroup>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Présentation de la recherche web" href="/fr/tools/web" icon="magnifying-glass">
    Tous les fournisseurs et toutes les règles de détection automatique.
  </Card>
  <Card title="Firecrawl" href="/fr/tools/firecrawl" icon="fire">
    Recherche et extraction web avec extraction de contenu.
  </Card>
  <Card title="Recherche Exa" href="/fr/tools/exa-search" icon="binoculars">
    Recherche neuronale avec extraction de contenu.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Schéma de configuration complet pour les entrées de Plugin et le routage des outils.
  </Card>
</CardGroup>
