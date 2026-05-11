---
read_when:
    - Vous souhaitez une recherche web basée sur Tavily
    - Vous avez besoin d’une clé API Tavily
    - Vous souhaitez utiliser Tavily comme fournisseur web_search
    - Vous voulez extraire du contenu à partir d’URL
summary: Outils de recherche et d’extraction Tavily
title: Tavily
x-i18n:
    generated_at: "2026-05-11T21:00:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) est une API de recherche conçue pour les applications d’IA. OpenClaw l’expose de deux manières :

- comme fournisseur `web_search` pour l’outil de recherche générique
- comme outils de plugin explicites : `tavily_search` et `tavily_extract`

Tavily renvoie des résultats structurés optimisés pour la consommation par les LLM, avec une profondeur de recherche configurable, un filtrage par sujet, des filtres de domaine, des résumés de réponse générés par l’IA et l’extraction de contenu depuis des URL (y compris les pages rendues par JavaScript).

| Propriété       | Valeur                              |
| --------------- | ----------------------------------- |
| ID du Plugin    | `tavily`                            |
| Authentification | `TAVILY_API_KEY` or config `apiKey` |
| URL de base     | `https://api.tavily.com` (par défaut) |
| Outils groupés  | `tavily_search`, `tavily_extract`   |

## Premiers pas

<Steps>
  <Step title="Obtenir une clé API">
    Créez un compte Tavily sur [tavily.com](https://tavily.com), puis générez une clé API dans le tableau de bord.
  </Step>
  <Step title="Configurer le plugin et le fournisseur">
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
  <Step title="Vérifier que la recherche s’exécute">
    Déclenchez un `web_search` depuis n’importe quel agent, ou appelez directement `tavily_search`.
  </Step>
</Steps>

<Tip>
Choisir Tavily lors de l’intégration ou avec `openclaw configure --section web` active automatiquement le plugin Tavily groupé.
</Tip>

## Référence des outils

### `tavily_search`

Utilisez ceci lorsque vous voulez des contrôles de recherche propres à Tavily au lieu de `web_search` générique.

| Paramètre         | Type         | Contraintes / valeur par défaut        | Description                                     |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | requis                                 | Chaîne de requête de recherche. Gardez-la sous 400 caractères. |
| `search_depth`    | enum         | `basic` (par défaut), `advanced`       | `advanced` est plus lent mais plus pertinent.   |
| `topic`           | enum         | `general` (par défaut), `news`, `finance` | Filtrer par famille de sujets.               |
| `max_results`     | integer      | 1-20                                   | Nombre de résultats.                            |
| `include_answer`  | boolean      | par défaut `false`                     | Inclure un résumé de réponse généré par l’IA de Tavily. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Filtrer les résultats par récence.              |
| `include_domains` | string array | (aucun)                                | Inclure uniquement les résultats de ces domaines. |
| `exclude_domains` | string array | (aucun)                                | Exclure les résultats de ces domaines.          |

Compromis de profondeur de recherche :

| Profondeur | Vitesse      | Pertinence | Idéal pour                            |
| ---------- | ------------ | ---------- | ------------------------------------ |
| `basic`    | Plus rapide  | Élevée     | Requêtes polyvalentes (par défaut).  |
| `advanced` | Plus lent    | Maximale   | Recherche précise et vérification des faits. |

### `tavily_extract`

Utilisez ceci pour extraire du contenu propre depuis une ou plusieurs URL. Gère les pages rendues par JavaScript et prend en charge le découpage ciblé par requête pour une extraction ciblée.

| Paramètre           | Type         | Contraintes / valeur par défaut | Description                                                 |
| ------------------- | ------------ | ------------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | requis, 1-20                    | URL depuis lesquelles extraire le contenu.                  |
| `query`             | string       | (facultatif)                    | Reclasser les fragments extraits selon leur pertinence pour cette requête. |
| `extract_depth`     | enum         | `basic` (par défaut), `advanced` | Utilisez `advanced` pour les pages riches en JS, les SPA ou les tableaux dynamiques. |
| `chunks_per_source` | integer      | 1-5 ; **nécessite `query`**     | Fragments renvoyés par URL. Génère une erreur si défini sans `query`. |
| `include_images`    | boolean      | par défaut `false`              | Inclure les URL d’images dans les résultats.                |

Compromis de profondeur d’extraction :

| Profondeur | Quand l’utiliser                          |
| ---------- | ------------------------------------------ |
| `basic`    | Pages simples. Essayez ceci en premier.    |
| `advanced` | SPA rendues par JS, contenu dynamique, tableaux. |

<Tip>
Répartissez les listes d’URL plus longues dans plusieurs appels `tavily_extract` (20 maximum par requête). Utilisez `query` avec `chunks_per_source` pour obtenir uniquement le contenu pertinent au lieu de pages complètes.
</Tip>

## Choisir le bon outil

| Besoin                               | Outil            |
| ------------------------------------ | ---------------- |
| Recherche web rapide, sans options particulières | `web_search`     |
| Recherche avec profondeur, sujet, réponses IA | `tavily_search`  |
| Extraire du contenu depuis des URL spécifiques | `tavily_extract` |

<Note>
L’outil `web_search` générique avec Tavily comme fournisseur prend en charge `query` et `count` (jusqu’à 20 résultats). Pour les contrôles propres à Tavily (`search_depth`, `topic`, `include_answer`, filtres de domaine, plage temporelle), utilisez plutôt `tavily_search`.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Ordre de résolution de la clé API">
    Le client Tavily recherche sa clé API dans cet ordre :

    1. `plugins.entries.tavily.config.webSearch.apiKey` (résolu via SecretRefs).
    2. `TAVILY_API_KEY` depuis l’environnement du gateway.

    `tavily_extract` génère une erreur de configuration si aucun des deux n’est présent.

  </Accordion>

  <Accordion title="URL de base personnalisée">
    Remplacez `plugins.entries.tavily.config.webSearch.baseUrl` si vous faites passer Tavily par un proxy. La valeur par défaut est `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` nécessite `query`">
    `tavily_extract` rejette les appels qui passent `chunks_per_source` sans `query`. Tavily classe les fragments selon leur pertinence pour la requête, donc le paramètre n’a aucun sens sans requête.
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Vue d’ensemble de Web Search" href="/fr/tools/web" icon="magnifying-glass">
    Tous les fournisseurs et règles de détection automatique.
  </Card>
  <Card title="Firecrawl" href="/fr/tools/firecrawl" icon="fire">
    Recherche avec scraping et extraction de contenu.
  </Card>
  <Card title="Exa Search" href="/fr/tools/exa-search" icon="binoculars">
    Recherche neuronale avec extraction de contenu.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Schéma de configuration complet pour les entrées de plugin et le routage des outils.
  </Card>
</CardGroup>
