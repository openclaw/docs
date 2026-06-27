---
read_when:
    - Vous souhaitez configurer Perplexity comme fournisseur de recherche Web
    - Vous avez besoin de la clé API Perplexity ou de la configuration du proxy OpenRouter
summary: Configuration du fournisseur de recherche web Perplexity (clé API, modes de recherche, filtrage)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:06:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Le Plugin Perplexity fournit des capacités de recherche web via l’API Perplexity
Search ou Perplexity Sonar via OpenRouter.

<Note>
Cette page concerne la configuration du **fournisseur** Perplexity. Pour l’**outil** Perplexity (la façon dont l’agent l’utilise), consultez [l’outil Perplexity](/fr/tools/perplexity-search).
</Note>

| Propriété          | Valeur                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Type        | Fournisseur de recherche web (pas un fournisseur de modèle)             |
| Authentification        | `PERPLEXITY_API_KEY` (direct) ou `OPENROUTER_API_KEY` (via OpenRouter) |
| Chemin de configuration | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Premiers pas

<Steps>
  <Step title="Set the API key">
    Exécutez le flux interactif de configuration de la recherche web :

    ```bash
    openclaw configure --section web
    ```

    Ou définissez la clé directement :

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Start searching">
    L’agent utilisera automatiquement Perplexity pour les recherches web une fois la clé
    configurée. Aucune étape supplémentaire n’est requise.
  </Step>
</Steps>

## Modes de recherche

Le Plugin sélectionne automatiquement le transport selon le préfixe de la clé API :

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Lorsque votre clé commence par `pplx-`, OpenClaw utilise l’API native Perplexity Search.
    Ce transport renvoie des résultats structurés et prend en charge les filtres de domaine,
    de langue et de date (voir les options de filtrage ci-dessous).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Lorsque votre clé commence par `sk-or-`, OpenClaw passe par OpenRouter en utilisant
    le modèle Perplexity Sonar. Ce transport renvoie des réponses synthétisées par IA avec
    citations.
  </Tab>
</Tabs>

| Préfixe de clé | Transport                    | Fonctionnalités                                   |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | API native Perplexity Search | Résultats structurés, filtres de domaine/langue/date |
| `sk-or-`   | OpenRouter (Sonar)           | Réponses synthétisées par IA avec citations      |

## Filtrage de l’API native

<Note>
Les options de filtrage ne sont disponibles que lors de l’utilisation de l’API native Perplexity
(clé `pplx-`). Les recherches OpenRouter/Sonar ne prennent pas en charge ces paramètres.
</Note>

Lors de l’utilisation de l’API native Perplexity, les recherches prennent en charge les filtres suivants :

| Filtre         | Description                            | Exemple                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Pays           | Code pays à 2 lettres                  | `us`, `de`, `jp`                    |
| Langue         | Code de langue ISO 639-1               | `en`, `fr`, `zh`                    |
| Plage de dates | Fenêtre de récence                     | `day`, `week`, `month`, `year`      |
| Filtres de domaine | Liste d’autorisation ou de refus (20 domaines max.) | `example.com`                       |
| Budget de contenu | Limites de tokens par réponse / par page | `max_tokens`, `max_tokens_per_page` |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    Si OpenClaw Gateway s’exécute en tant que daemon (launchd/systemd), assurez-vous que
    `PERPLEXITY_API_KEY` est disponible pour ce processus.

    <Warning>
    Une clé exportée uniquement dans un shell interactif ne sera pas visible par un
    daemon launchd/systemd, sauf si cet environnement est explicitement importé. Définissez
    la clé dans `~/.openclaw/.env` ou via `env.shellEnv` pour garantir que le processus
    Gateway peut la lire.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy setup">
    Si vous préférez acheminer les recherches Perplexity via OpenRouter, définissez une
    `OPENROUTER_API_KEY` (préfixe `sk-or-`) au lieu d’une clé Perplexity native.
    OpenClaw détectera le préfixe et basculera automatiquement vers le transport Sonar.

    <Tip>
    Le transport OpenRouter est utile si vous disposez déjà d’un compte OpenRouter
    et souhaitez une facturation consolidée entre plusieurs fournisseurs.
    </Tip>

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/fr/tools/perplexity-search" icon="magnifying-glass">
    Comment l’agent invoque les recherches Perplexity et interprète les résultats.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/configuration-reference" icon="gear">
    Référence de configuration complète, y compris les entrées de Plugin.
  </Card>
</CardGroup>
