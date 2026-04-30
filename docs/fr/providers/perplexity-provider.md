---
read_when:
    - Vous souhaitez configurer Perplexity comme fournisseur de recherche web
    - Vous avez besoin de la clé API Perplexity ou de la configuration du proxy OpenRouter
summary: Configuration du fournisseur de recherche web Perplexity (clé API, modes de recherche, filtrage)
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T07:45:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Le Plugin Perplexity fournit des fonctionnalités de recherche web via l’API Perplexity
Search ou Perplexity Sonar via OpenRouter.

<Note>
Cette page concerne la configuration du **fournisseur** Perplexity. Pour l’**outil** Perplexity (comment l’agent l’utilise), consultez [outil Perplexity](/fr/tools/perplexity-search).
</Note>

| Propriété   | Valeur                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Type        | Fournisseur de recherche web (pas un fournisseur de modèles)           |
| Auth        | `PERPLEXITY_API_KEY` (direct) ou `OPENROUTER_API_KEY` (via OpenRouter) |
| Chemin de configuration | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Bien démarrer

<Steps>
  <Step title="Définir la clé API">
    Exécutez le flux interactif de configuration de la recherche web :

    ```bash
    openclaw configure --section web
    ```

    Ou définissez directement la clé :

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Commencer la recherche">
    L’agent utilisera automatiquement Perplexity pour les recherches web une fois la clé
    configurée. Aucune étape supplémentaire n’est requise.
  </Step>
</Steps>

## Modes de recherche

Le Plugin sélectionne automatiquement le transport selon le préfixe de la clé API :

<Tabs>
  <Tab title="API Perplexity native (pplx-)">
    Lorsque votre clé commence par `pplx-`, OpenClaw utilise l’API Perplexity Search
    native. Ce transport renvoie des résultats structurés et prend en charge les filtres de domaine, de langue
    et de date (voir les options de filtrage ci-dessous).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Lorsque votre clé commence par `sk-or-`, OpenClaw achemine les requêtes via OpenRouter en utilisant
    le modèle Perplexity Sonar. Ce transport renvoie des réponses synthétisées par IA avec
    des citations.
  </Tab>
</Tabs>

| Préfixe de clé | Transport                    | Fonctionnalités                                  |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | API Perplexity Search native | Résultats structurés, filtres de domaine/langue/date |
| `sk-or-`   | OpenRouter (Sonar)           | Réponses synthétisées par IA avec citations      |

## Filtrage de l’API native

<Note>
Les options de filtrage sont uniquement disponibles lors de l’utilisation de l’API Perplexity native
(clé `pplx-`). Les recherches OpenRouter/Sonar ne prennent pas en charge ces paramètres.
</Note>

Lors de l’utilisation de l’API Perplexity native, les recherches prennent en charge les filtres suivants :

| Filtre         | Description                            | Exemple                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Pays           | Code pays à 2 lettres                  | `us`, `de`, `jp`                    |
| Langue         | Code de langue ISO 639-1               | `en`, `fr`, `zh`                    |
| Plage de dates | Fenêtre de récence                     | `day`, `week`, `month`, `year`      |
| Filtres de domaine | Liste d’autorisation ou de refus (20 domaines max.) | `example.com`                       |
| Budget de contenu | Limites de jetons par réponse / par page | `max_tokens`, `max_tokens_per_page` |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Variable d’environnement pour les processus daemon">
    Si le Gateway OpenClaw s’exécute comme daemon (launchd/systemd), assurez-vous que
    `PERPLEXITY_API_KEY` est disponible pour ce processus.

    <Warning>
    Une clé définie uniquement dans `~/.profile` ne sera pas visible par un daemon
    launchd/systemd sauf si cet environnement est explicitement importé. Définissez la clé dans
    `~/.openclaw/.env` ou via `env.shellEnv` afin que le processus Gateway puisse
    la lire.
    </Warning>

  </Accordion>

  <Accordion title="Configuration du proxy OpenRouter">
    Si vous préférez acheminer les recherches Perplexity via OpenRouter, définissez une
    `OPENROUTER_API_KEY` (préfixe `sk-or-`) au lieu d’une clé Perplexity native.
    OpenClaw détectera le préfixe et basculera automatiquement vers le transport Sonar.

    <Tip>
    Le transport OpenRouter est utile si vous disposez déjà d’un compte OpenRouter
    et souhaitez une facturation consolidée entre plusieurs fournisseurs.
    </Tip>

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Outil de recherche Perplexity" href="/fr/tools/perplexity-search" icon="magnifying-glass">
    Comment l’agent invoque les recherches Perplexity et interprète les résultats.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence de configuration complète incluant les entrées de Plugin.
  </Card>
</CardGroup>
