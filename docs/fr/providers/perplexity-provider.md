---
read_when:
    - Vous souhaitez configurer Perplexity comme fournisseur de recherche web
    - Vous avez besoin de la clé API Perplexity ou de la configuration du proxy OpenRouter
summary: Configuration du fournisseur de recherche web Perplexity (clé API, modes de recherche, filtrage)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T03:03:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Le plugin Perplexity enregistre un fournisseur `web_search` avec deux modes de transport : l’API Perplexity Search native (résultats structurés avec filtres) et les complétions de chat Perplexity Sonar, directement ou via OpenRouter (réponses synthétisées par l’IA avec citations).

<Note>
Cette page décrit la configuration du **fournisseur** Perplexity. Pour l’**outil** Perplexity (la manière dont l’agent l’utilise), consultez [Recherche Perplexity](/fr/tools/perplexity-search).
</Note>

| Propriété              | Valeur                                                                      |
| ---------------------- | --------------------------------------------------------------------------- |
| Type                   | Fournisseur de recherche Web (et non fournisseur de modèles)                |
| Authentification       | `PERPLEXITY_API_KEY` (native) ou `OPENROUTER_API_KEY` (via OpenRouter)       |
| Chemin de configuration | `plugins.entries.perplexity.config.webSearch.apiKey`                        |
| Remplacements          | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`            |
| Obtenir une clé        | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)         |

## Installer le Plugin

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Prise en main

<Steps>
  <Step title="Définir la clé d’API">
    ```bash
    openclaw configure --section web
    ```

    Vous pouvez également définir directement la clé :

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Une clé exportée sous la forme `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY` dans l’environnement du Gateway fonctionne également.

  </Step>
  <Step title="Commencer les recherches">
    `web_search` détecte automatiquement Perplexity dès que sa clé constitue l’identifiant de recherche disponible ; aucune configuration supplémentaire n’est requise. Pour sélectionner explicitement le fournisseur :

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Modes de recherche

Le Plugin détermine le mode de transport dans l’ordre suivant :

1. Si `webSearch.baseUrl` ou `webSearch.model` est défini, les requêtes sont toujours acheminées vers les complétions de chat Sonar sur ce point de terminaison, quel que soit le type de clé.
2. Sinon, la source de la clé détermine le point de terminaison : le préfixe d’une clé configurée sélectionne le mode de transport (la configuration prévaut sur les variables d’environnement) ; une clé d’environnement utilise directement le point de terminaison correspondant.

| Préfixe de clé | Mode de transport                                          | Fonctionnalités                                            |
| -------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `pplx-`        | API Perplexity Search native (`https://api.perplexity.ai`) | Résultats structurés, filtres par domaine, langue et date   |
| `sk-or-`       | OpenRouter (`https://openrouter.ai/api/v1`), modèle Sonar  | Réponses synthétisées par l’IA avec citations               |

Une clé configurée avec tout autre préfixe utilise également l’API Search native. Le chemin des complétions de chat utilise par défaut le modèle `perplexity/sonar-pro` ; remplacez-le avec `plugins.entries.perplexity.config.webSearch.model`.

## Filtrage de l’API native

| Filtre                               | Description                                                                        | Mode de transport        |
| ------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------ |
| `count`                              | Nombre de résultats par recherche, de 1 à 10 (5 par défaut)                        | API native uniquement    |
| `freshness`                          | Période de récence : `day`, `week`, `month`, `year`                                | Les deux                 |
| `country`                            | Code pays à 2 lettres (`us`, `de`, `jp`)                                            | API native uniquement    |
| `language`                           | Code de langue ISO 639-1 (`en`, `fr`, `zh`)                                         | API native uniquement    |
| `date_after` / `date_before`         | Plage de dates de publication au format `YYYY-MM-DD`                                | API native uniquement    |
| `domain_filter`                      | 20 domaines au maximum ; liste d’autorisation ou liste d’exclusion préfixée par `-`, jamais les deux | API native uniquement |
| `max_tokens` / `max_tokens_per_page` | Budget de contenu pour l’ensemble des résultats / par page                          | API native uniquement    |

Les filtres réservés à l’API native renvoient une erreur descriptive avec le chemin des complétions de chat. `freshness` ne peut pas être combiné avec `date_after`/`date_before`.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Variable d’environnement pour les processus démons">
    <Warning>
    Une clé exportée uniquement dans un shell interactif n’est pas visible par un démon Gateway launchd/systemd, sauf si cet environnement est explicitement importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` afin que le processus Gateway puisse la lire. Consultez [Variables d’environnement](/fr/help/environment) pour connaître l’ordre de priorité complet.
    </Warning>
  </Accordion>

  <Accordion title="Configuration du proxy OpenRouter">
    Pour acheminer les recherches Perplexity via OpenRouter, définissez une `OPENROUTER_API_KEY` (préfixe `sk-or-`) au lieu d’une clé Perplexity native. OpenClaw détecte la clé et passe automatiquement au mode de transport Sonar. Cette option est utile si vous avez déjà configuré la facturation OpenRouter et souhaitez y regrouper les fournisseurs.
  </Accordion>
</AccordionGroup>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Outil de recherche Perplexity" href="/fr/tools/perplexity-search" icon="magnifying-glass">
    Manière dont l’agent lance les recherches Perplexity et interprète les résultats.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence de configuration complète, y compris les entrées de Plugin.
  </Card>
</CardGroup>
