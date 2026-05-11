---
read_when:
    - Vous souhaitez utiliser des modèles OpenAI dans OpenClaw
    - Vous souhaitez utiliser l’authentification par abonnement Codex plutôt que des clés API
    - Vous avez besoin d’un comportement d’exécution de l’agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:53:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fournit des API développeur pour les modèles GPT, et Codex est également disponible comme agent de codage avec formule ChatGPT via les clients Codex d'OpenAI. OpenClaw garde ces surfaces séparées afin que la configuration reste prévisible.

OpenClaw utilise `openai/*` comme route canonique des modèles OpenAI. Les tours d'agent intégrés sur les modèles OpenAI passent par le runtime natif du serveur d'application Codex par défaut ; l'authentification directe par clé d'API OpenAI reste disponible pour les surfaces OpenAI hors agent, comme les images, les embeddings, la parole et le temps réel.

- **Modèles d'agent** - modèles `openai/*` via le runtime Codex ; connectez-vous avec l'authentification Codex pour l'utilisation d'un abonnement ChatGPT/Codex, ou configurez une sauvegarde par clé d'API OpenAI compatible Codex lorsque vous voulez intentionnellement une authentification par clé d'API.
- **API OpenAI hors agent** - accès direct à la plateforme OpenAI avec facturation à l'usage via `OPENAI_API_KEY` ou l'onboarding par clé d'API OpenAI.
- **Configuration héritée** - les références de modèle `openai-codex/*` sont réparées par `openclaw doctor --fix` en `openai/*` plus le runtime Codex.

OpenAI prend explicitement en charge l'utilisation OAuth par abonnement dans des outils et workflows externes comme OpenClaw.

Le fournisseur, le modèle, le runtime et le canal sont des couches distinctes. Si ces libellés sont mélangés, lisez [Runtimes d'agent](/fr/concepts/agent-runtimes) avant de modifier la configuration.

## Choix rapide

| Objectif                                             | Utiliser                                                 | Notes                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Abonnement ChatGPT/Codex avec runtime Codex natif    | `openai/gpt-5.5`                                         | Configuration d'agent OpenAI par défaut. Connectez-vous avec l'authentification Codex. |
| Facturation directe par clé d'API pour les modèles d'agent | `openai/gpt-5.5` plus un profil de clé d'API compatible Codex | Utilisez `auth.order.openai` pour placer la sauvegarde après l'authentification par abonnement. |
| Facturation directe par clé d'API via PI explicite   | `openai/gpt-5.5` plus le runtime fournisseur/modèle `pi` | Sélectionnez un profil de clé d'API `openai` normal.                  |
| Dernier alias d'API ChatGPT Instant                  | `openai/chat-latest`                                     | Clé d'API directe uniquement. Alias mobile pour les expérimentations, pas la valeur par défaut. |
| Authentification par abonnement ChatGPT/Codex via PI explicite | `openai/gpt-5.5` plus le runtime fournisseur/modèle `pi` | Sélectionnez un profil d'authentification `openai-codex` pour la route de compatibilité. |
| Génération ou modification d'images                  | `openai/gpt-image-2`                                     | Fonctionne avec `OPENAI_API_KEY` ou OpenAI Codex OAuth.               |
| Images à arrière-plan transparent                    | `openai/gpt-image-1.5`                                   | Utilisez `outputFormat=png` ou `webp` et `openai.background=transparent`. |

## Carte de nommage

Les noms sont similaires, mais ne sont pas interchangeables :

| Nom que vous voyez                      | Couche                     | Signification                                                                                                        |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | Préfixe de fournisseur     | Route canonique des modèles OpenAI ; les tours d'agent utilisent le runtime Codex.                                   |
| `openai-codex`                          | Préfixe d'authentification/profil hérité | Ancien espace de noms de profil OAuth/abonnement OpenAI Codex. Les profils existants et `auth.order.openai-codex` fonctionnent toujours. |
| plugin `codex`                          | Plugin                     | Plugin OpenClaw groupé qui fournit le runtime natif du serveur d'application Codex et les contrôles de chat `/codex`. |
| fournisseur/modèle `agentRuntime.id: codex` | Runtime d'agent            | Force le harnais natif du serveur d'application Codex pour les tours intégrés correspondants.                        |
| `/codex ...`                            | Jeu de commandes de chat   | Lier/contrôler les fils du serveur d'application Codex depuis une conversation.                                      |
| `runtime: "acp", agentId: "codex"`      | Route de session ACP       | Chemin de repli explicite qui exécute Codex via ACP/acpx.                                                            |

Cela signifie qu'une configuration peut contenir intentionnellement des références de modèle `openai/*` tandis que les profils d'authentification pointent encore vers des identifiants compatibles Codex. Préférez `auth.order.openai` pour les nouvelles configurations ; les profils `openai-codex:*` existants et `auth.order.openai-codex` restent pris en charge. `openclaw doctor --fix` réécrit les références de modèle héritées `openai-codex/*` vers la route canonique des modèles OpenAI.

<Note>
GPT-5.5 est disponible via l'accès direct par clé d'API à la plateforme OpenAI et via les routes abonnement/OAuth. Pour un abonnement ChatGPT/Codex plus l'exécution Codex native, utilisez `openai/gpt-5.5` ; une configuration de runtime non définie sélectionne désormais le harnais Codex pour les tours d'agent OpenAI. Utilisez les profils de clé d'API OpenAI uniquement lorsque vous voulez une authentification directe par clé d'API pour un modèle d'agent OpenAI.
</Note>

<Note>
Les tours de modèle d'agent OpenAI nécessitent le plugin de serveur d'application Codex groupé. La configuration explicite du runtime PI reste disponible comme route de compatibilité optionnelle. Lorsque PI est explicitement sélectionné avec un profil d'authentification `openai-codex`, OpenClaw conserve la référence de modèle publique sous la forme `openai/*` et route PI en interne via le transport hérité d'authentification Codex. Exécutez `openclaw doctor --fix` pour réparer les références de modèle `openai-codex/*` obsolètes ou les anciens épinglages de session PI qui ne proviennent pas d'une configuration explicite du runtime.
</Note>

## Couverture des fonctionnalités OpenClaw

| Capacité OpenAI         | Surface OpenClaw                                                                  | État                                                   |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses        | Fournisseur de modèle `openai/<model>`                                            | Oui                                                    |
| Modèles d'abonnement Codex | `openai/<model>` avec OAuth `openai-codex`                                     | Oui                                                    |
| Références de modèle Codex héritées | `openai-codex/<model>`                                                | Réparées par doctor en `openai/<model>`                |
| Harnais de serveur d'application Codex | `openai/<model>` avec runtime omis ou fournisseur/modèle `agentRuntime.id: codex` | Oui                                                    |
| Recherche web côté serveur | Outil OpenAI Responses natif                                                   | Oui, lorsque la recherche web est activée et qu'aucun fournisseur n'est épinglé |
| Images                  | `image_generate`                                                                  | Oui                                                    |
| Vidéos                  | `video_generate`                                                                  | Oui                                                    |
| Synthèse vocale         | `messages.tts.provider: "openai"` / `tts`                                         | Oui                                                    |
| Transcription audio par lots | `tools.media.audio` / compréhension média                                    | Oui                                                    |
| Transcription audio en streaming | Appel vocal `streaming.provider: "openai"`                               | Oui                                                    |
| Voix en temps réel      | Appel vocal `realtime.provider: "openai"` / Parler dans l'interface de contrôle   | Oui                                                    |
| Embeddings              | Fournisseur d'embeddings mémoire                                                  | Oui                                                    |

## Embeddings mémoire

OpenClaw peut utiliser OpenAI, ou un endpoint d'embeddings compatible OpenAI, pour l'indexation `memory_search` et les embeddings de requête :

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Pour les endpoints compatibles OpenAI qui nécessitent des libellés d'embedding asymétriques, définissez `queryInputType` et `documentInputType` sous `memorySearch`. OpenClaw les transmet comme champs de requête `input_type` propres au fournisseur : les embeddings de requête utilisent `queryInputType` ; les fragments de mémoire indexés et l'indexation par lots utilisent `documentInputType`. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#provider-specific-config) pour l'exemple complet.

## Démarrage

Choisissez votre méthode d'authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé d'API (plateforme OpenAI)">
    **Idéal pour :** l'accès direct à l'API et la facturation à l'usage.

    <Steps>
      <Step title="Obtenir votre clé d'API">
        Créez ou copiez une clé d'API depuis le [tableau de bord de la plateforme OpenAI](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécuter l'onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou transmettez la clé directement :

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Résumé des routes

    | Réf. de modèle        | Configuration du runtime   | Route                       | Authentification |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omis / fournisseur/modèle `agentRuntime.id: "codex"` | Harnais de serveur d'application Codex | Profil OpenAI compatible Codex |
    | `openai/gpt-5.4-mini` | omis / fournisseur/modèle `agentRuntime.id: "codex"` | Harnais de serveur d'application Codex | Profil OpenAI compatible Codex |
    | `openai/gpt-5.5`      | fournisseur/modèle `agentRuntime.id: "pi"`              | Runtime intégré PI      | Profil `openai` ou profil `openai-codex` sélectionné |

    <Note>
    Les modèles d'agent `openai/*` utilisent le harnais de serveur d'application Codex. Pour utiliser l'authentification par clé d'API avec un modèle d'agent, créez un profil de clé d'API compatible Codex et ordonnez-le avec `auth.order.openai` ; `OPENAI_API_KEY` reste le repli direct pour les surfaces d'API OpenAI hors agent. Les anciennes entrées `auth.order.openai-codex` fonctionnent toujours.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Pour essayer le modèle Instant actuel de ChatGPT depuis l'API OpenAI, définissez le modèle sur `openai/chat-latest` :

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` est un alias mobile. OpenAI le documente comme le dernier modèle Instant utilisé dans ChatGPT et recommande `gpt-5.5` pour l'utilisation de l'API en production ; gardez donc `openai/gpt-5.5` comme valeur par défaut stable, sauf si vous voulez explicitement ce comportement d'alias. L'alias accepte actuellement uniquement la verbosité de texte `medium`, OpenClaw normalise donc les remplacements de verbosité de texte OpenAI incompatibles pour ce modèle.

    <Warning>
    OpenClaw n'expose **pas** `openai/gpt-5.3-codex-spark`. Les requêtes API OpenAI en direct rejettent ce modèle, et le catalogue Codex actuel ne l'expose pas non plus.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex avec l’exécution native du serveur d’application Codex au lieu d’une clé d’API distincte. Le cloud Codex nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez OAuth directement :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les configurations sans interface ou incompatibles avec les rappels, ajoutez `--device-code` pour vous connecter avec un flux de code d’appareil ChatGPT au lieu du rappel du navigateur localhost :

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Aucune configuration d’exécution n’est requise pour le chemin par défaut. Les tours d’agent OpenAI
        sélectionnent automatiquement l’exécution native du serveur d’application Codex, et OpenClaw
        installe ou répare le Plugin Codex inclus lorsque cette route est choisie.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Une fois le Gateway en cours d’exécution, envoyez `/codex status` ou `/codex models`
        dans le chat pour vérifier l’exécution native du serveur d’application.
      </Step>
    </Steps>

    ### Résumé des routes

    | Référence de modèle | Configuration d’exécution | Route | Authentification |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omise / fournisseur/modèle `agentRuntime.id: "codex"` | Harnais natif de serveur d’application Codex | Connexion Codex ou profil d’authentification `openai` ordonné |
    | `openai/gpt-5.5` | fournisseur/modèle `agentRuntime.id: "pi"` | Exécution intégrée PI avec transport d’authentification Codex interne | Profil `openai-codex` sélectionné |
    | `openai-codex/gpt-5.5` | réparée par doctor | Route héritée réécrite en `openai/gpt-5.5` | Profil `openai-codex` existant |

    <Warning>
    Ne configurez pas les anciennes références de modèles `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ou
    `openai-codex/gpt-5.3*`. Les comptes OAuth ChatGPT/Codex rejettent désormais
    ces modèles. Utilisez `openai/gpt-5.5` ; les tours d’agent OpenAI sélectionnent désormais l’exécution Codex
    par défaut.
    </Warning>

    <Note>
    Le préfixe de modèle `openai-codex/*` est une configuration héritée réparée par doctor. Pour
    la configuration courante combinant abonnement et exécution native, connectez-vous avec l’authentification Codex,
    mais conservez la référence de modèle `openai/gpt-5.5`. Les nouvelles configurations doivent placer l’ordre
    d’authentification de l’agent OpenAI sous `auth.order.openai` ; les anciennes entrées `auth.order.openai-codex`
    restent valides.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    Avec une clé d’API de secours, conservez le modèle sur `openai/gpt-5.5` et placez
    l’ordre d’authentification sous `openai`. OpenClaw essaiera d’abord l’abonnement, puis
    la clé d’API, tout en restant sur le harnais Codex :

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    L’onboarding n’importe plus de matériel OAuth depuis `~/.codex`. Connectez-vous avec OAuth dans le navigateur (par défaut) ou avec le flux de code d’appareil ci-dessus — OpenClaw gère les identifiants obtenus dans son propre magasin d’authentification d’agent.
    </Note>

    ### Vérifier et récupérer le routage OAuth Codex

    Utilisez ces commandes pour voir quels modèle, exécution et route d’authentification votre agent
    par défaut utilise :

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Pour un agent spécifique, ajoutez `--agent <id>` :

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Si une ancienne configuration contient encore `openai-codex/gpt-*` ou un ancien verrou de session OpenAI PI
    sans configuration d’exécution explicite, réparez-la :

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Si `models auth list --provider openai-codex` n’affiche aucun profil utilisable, reconnectez-vous :

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` est la route de modèle pour les tours d’agent OpenAI via Codex. L’identifiant
    de fournisseur d’authentification/profil `openai-codex` reste accepté pour les profils
    existants et l’affichage par la CLI.

    ### Indicateur d’état

    Le chat `/status` affiche quelle exécution de modèle est active pour la session actuelle.
    Le harnais de serveur d’application Codex inclus apparaît comme `Runtime: OpenAI Codex` pour
    les tours de modèle d’agent OpenAI. Les anciens verrous de session PI sont réparés vers Codex sauf si
    la configuration verrouille explicitement PI.

    ### Avertissement de doctor

    Si des routes `openai-codex/*` ou d’anciens verrous OpenAI PI restent dans la configuration ou
    l’état de session, `openclaw doctor --fix` les réécrit en `openai/*` avec l’exécution
    Codex, sauf si PI est explicitement configuré.

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées de modèle et la limite de contexte d’exécution comme des valeurs distinctes.

    Pour `openai/gpt-5.5` via le catalogue OAuth Codex :

    - `contextWindow` natif : `1000000`
    - Limite `contextTokens` d’exécution par défaut : `272000`

    La limite par défaut plus faible offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-la avec `contextTokens` :

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte d’exécution.
    </Note>

    ### Récupération du catalogue

    OpenClaw utilise les métadonnées du catalogue Codex amont pour `gpt-5.5` lorsqu’elles sont
    présentes. Si la découverte Codex en direct omet la ligne `gpt-5.5` alors que
    le compte est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que
    les exécutions Cron, de sous-agent et de modèle par défaut configuré n’échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Authentification native du serveur d’application Codex

Le harnais natif de serveur d’application Codex utilise des références de modèle `openai/*` avec une
configuration d’exécution omise ou `agentRuntime.id: "codex"` au niveau fournisseur/modèle, mais son authentification
reste basée sur le compte. OpenClaw sélectionne l’authentification dans cet ordre :

1. Profils d’authentification OpenAI ordonnés pour l’agent, de préférence sous
   `auth.order.openai`. Les profils `openai-codex:*` existants et
   `auth.order.openai-codex` restent valides pour les installations plus anciennes.
2. Le compte existant du serveur d’application, comme une connexion ChatGPT locale de la CLI Codex.
3. Pour les lancements locaux du serveur d’application stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsque le serveur d’application ne signale aucun compte et nécessite encore
   une authentification OpenAI.

Cela signifie qu’une connexion locale avec abonnement ChatGPT/Codex n’est pas remplacée simplement
parce que le processus Gateway dispose aussi de `OPENAI_API_KEY` pour les modèles OpenAI directs
ou les embeddings. Le recours à une clé d’API d’environnement est uniquement le chemin local stdio sans compte ; il
n’est pas envoyé aux connexions WebSocket du serveur d’application. Lorsqu’un profil Codex de type abonnement
est sélectionné, OpenClaw garde également `CODEX_API_KEY` et `OPENAI_API_KEY`
hors du processus enfant stdio du serveur d’application lancé, et envoie les identifiants sélectionnés
via le RPC de connexion du serveur d’application. Lorsque ce profil d’abonnement est bloqué par une
limite d’utilisation Codex, OpenClaw peut basculer vers le prochain profil de clé d’API `openai:*` ordonné
sans changer le modèle sélectionné ni quitter le harnais Codex. Une fois l’heure de réinitialisation de l’abonnement
passée, le profil d’abonnement redevient éligible.

## Génération d’images

Le Plugin `openai` inclus enregistre la génération d’images via l’outil `image_generate`.
Il prend en charge à la fois la génération d’images avec clé d’API OpenAI et la génération d’images OAuth Codex
via la même référence de modèle `openai/gpt-image-2`.

| Capacité                | Clé d’API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Référence de modèle                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentification                      | `OPENAI_API_KEY`                   | Connexion OAuth OpenAI Codex           |
| Transport                 | API OpenAI Images                  | Backend Codex Responses              |
| Images max. par requête    | 4                                  | 4                                    |
| Mode édition                 | Activé (jusqu’à 5 images de référence) | Activé (jusqu’à 5 images de référence)   |
| Remplacements de taille            | Pris en charge, y compris les tailles 2K/4K   | Pris en charge, y compris les tailles 2K/4K     |
| Format d’image / résolution | Non transmis à l’API OpenAI Images | Mappé vers une taille prise en charge lorsque c’est sûr |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de bascule.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération texte-vers-image OpenAI et
l’édition d’images. `gpt-image-1.5`, `gpt-image-1` et `gpt-image-1-mini` restent utilisables comme
remplacements de modèle explicites. Utilisez `openai/gpt-image-1.5` pour une sortie
PNG/WebP à arrière-plan transparent ; l’API `gpt-image-2` actuelle rejette
`background: "transparent"`.

Pour une requête avec arrière-plan transparent, les agents doivent appeler `image_generate` avec
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, et
`background: "transparent"` ; l’ancienne option de fournisseur `openai.background` est
toujours acceptée. OpenClaw protège aussi les routes publiques OpenAI et
OpenAI Codex OAuth en réécrivant les requêtes transparentes `openai/gpt-image-2` par défaut
vers `gpt-image-1.5` ; Azure et les points de terminaison personnalisés compatibles OpenAI conservent
leurs noms de déploiement/modèle configurés.

Le même réglage est exposé pour les exécutions CLI sans interface :

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Utilisez les mêmes indicateurs `--output-format` et `--background` avec
`openclaw infer image edit` lorsque vous partez d’un fichier d’entrée.
`--openai-background` reste disponible comme alias spécifique à OpenAI.

Pour les installations OAuth Codex, conservez la même référence `openai/gpt-image-2`. Lorsqu’un
profil OAuth `openai-codex` est configuré, OpenClaw résout ce jeton d’accès OAuth stocké
et envoie les requêtes d’image via le backend Codex Responses. Il
n’essaie pas d’abord `OPENAI_API_KEY` et ne bascule pas silencieusement vers une clé d’API pour cette
requête. Configurez explicitement `models.providers.openai` avec une clé d’API,
une URL de base personnalisée ou un point de terminaison Azure lorsque vous voulez utiliser la route directe de l’API OpenAI Images.
Si ce point de terminaison d’image personnalisé se trouve sur un réseau local/adresse privée de confiance, définissez également
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw garde les points de terminaison d’image
privés/internes compatibles OpenAI bloqués sauf si cette option d’adhésion est
présente.

Générer :

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Générer un PNG transparent :

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Modifier :

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Génération de vidéos

Le Plugin `openai` intégré enregistre la génération vidéo via l’outil `video_generate`.

| Capacité              | Valeur                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Modèle par défaut     | `openai/sora-2`                                                                                  |
| Modes                 | Texte vers vidéo, image vers vidéo, modification d’une seule vidéo                               |
| Entrées de référence  | 1 image ou 1 vidéo                                                                               |
| Remplacements de taille | Pris en charge                                                                                 |
| Autres remplacements  | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement de l’outil |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de basculement.
</Note>

## Contribution de prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 entre fournisseurs. Elle s’applique par id de modèle, donc `openai/gpt-5.5`, les références héritées antérieures à la réparation telles que `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` et les autres références GPT-5 compatibles reçoivent la même surcouche. Les anciens modèles GPT-4.x ne la reçoivent pas.

Le harnais Codex natif intégré utilise le même comportement GPT-5 et la même surcouche Heartbeat via les instructions développeur du serveur d’application Codex, donc les sessions `openai/gpt-5.x` acheminées via Codex conservent les mêmes consignes de suivi et de Heartbeat proactif, même si Codex possède le reste du prompt du harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de persona, la sécurité d’exécution, la discipline d’outils, la forme de sortie, les vérifications d’achèvement et la vérification. Le comportement de réponse propre au canal et de message silencieux reste dans le prompt système OpenClaw partagé et la politique de livraison sortante. Le guidage GPT-5 est toujours activé pour les modèles correspondants. La couche de style d’interaction conviviale est distincte et configurable.

| Valeur                 | Effet                                            |
| ---------------------- | ------------------------------------------------ |
| `"friendly"` (par défaut) | Active la couche de style d’interaction conviviale |
| `"on"`                 | Alias de `"friendly"`                            |
| `"off"`                | Désactive uniquement la couche de style conviviale |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Les valeurs ne sont pas sensibles à la casse à l’exécution, donc `"Off"` et `"off"` désactivent toutes deux la couche de style conviviale.
</Tip>

<Note>
L’ancien `plugins.entries.openai.config.personality` est toujours lu comme solution de compatibilité lorsque le paramètre partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le Plugin `openai` intégré enregistre la synthèse vocale pour la surface `messages.tts`.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |
    | URL de base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corps supplémentaire | `messages.tts.providers.openai.extraBody` / `extra_body` | (non défini) |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` est fusionné dans le JSON de requête `/audio/speech` après les champs générés par OpenClaw ; utilisez-le donc pour les points de terminaison compatibles OpenAI qui exigent des clés supplémentaires telles que `lang`. Les clés de prototype sont ignorées.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Définissez `OPENAI_TTS_BASE_URL` pour remplacer l’URL de base TTS sans affecter le point de terminaison de l’API de chat. OpenAI TTS reste configuré via une clé API ; pour un retour vocal en direct uniquement OAuth, utilisez plutôt le chemin vocal Realtime au lieu de la parole STT -> TTS en mode agent.
    </Note>

  </Accordion>

  <Accordion title="Transcription vocale">
    Le Plugin `openai` intégré enregistre la transcription vocale par lots via
    la surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : OpenAI REST `/v1/audio/transcriptions`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de salon vocal Discord et les
      pièces jointes audio de canal

    Pour forcer OpenAI pour la transcription audio entrante :

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Les indications de langue et de prompt sont transmises à OpenAI lorsqu’elles sont fournies par la
    configuration média audio partagée ou par la demande de transcription par appel.

  </Accordion>

  <Accordion title="Transcription en temps réel">
    Le Plugin `openai` inclus enregistre la transcription en temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée du silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Authentification | `...openai.apiKey`, `OPENAI_API_KEY`, ou OAuth `openai-codex` | Les clés API se connectent directement ; OAuth crée un secret client de transcription Realtime |

    <Note>
    Utilise une connexion WebSocket à `wss://api.openai.com/v1/realtime` avec de l’audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Lorsque seul OAuth `openai-codex` est configuré, le Gateway crée un secret client éphémère de transcription Realtime avant d’ouvrir le WebSocket. Ce fournisseur de streaming est destiné au chemin de transcription en temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise plutôt le chemin de transcription par lots `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel">
    Le Plugin `openai` inclus enregistre la voix en temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voix | `...openai.voice` | `alloy` |
    | Température (pont de déploiement Azure) | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée du silence | `...openai.silenceDurationMs` | `500` |
    | Remplissage de préfixe | `...openai.prefixPaddingMs` | `300` |
    | Effort de raisonnement | `...openai.reasoningEffort` | (non défini) |
    | Authentification | `...openai.apiKey`, `OPENAI_API_KEY`, ou OAuth `openai-codex` | Browser Talk et les ponts backend non Azure peuvent utiliser OAuth Codex |

    Voix Realtime intégrées disponibles pour `gpt-realtime-2` : `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI recommande `marin` et `cedar` pour la meilleure qualité Realtime. Il
    s’agit d’un ensemble distinct des voix de synthèse vocale ci-dessus ; ne partez pas du principe qu’une voix TTS
    comme `fable`, `nova` ou `onyx` est valide pour les sessions Realtime.

    <Note>
    Les ponts OpenAI realtime backend utilisent la forme de session WebSocket Realtime GA, qui n’accepte pas `session.temperature`. Les déploiements Azure OpenAI restent disponibles via `azureEndpoint` et `azureDeployment` et conservent la forme de session compatible avec le déploiement. Prend en charge les appels d’outils bidirectionnels et l’audio G.711 u-law.
    </Note>

    <Note>
    La voix Realtime est sélectionnée lors de la création de la session. OpenAI autorise la modification ultérieure de la plupart
    des champs de session, mais la voix ne peut pas être modifiée après que le
    modèle a émis de l’audio dans cette session. OpenClaw expose actuellement les
    identifiants des voix Realtime intégrées sous forme de chaînes.
    </Note>

    <Note>
    Control UI Talk utilise des sessions realtime navigateur OpenAI avec un secret client
    éphémère créé par le Gateway et un échange SDP WebRTC direct depuis le navigateur avec l’API
    OpenAI Realtime. Lorsqu’aucune clé API OpenAI directe n’est configurée, le
    Gateway peut créer ce secret client avec le profil OAuth `openai-codex`
    sélectionné. Le relais Gateway et les ponts WebSocket realtime backend Voice Call utilisent
    le même repli OAuth pour les points de terminaison OpenAI natifs. La vérification live
    par les mainteneurs est disponible avec
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ;
    les segments OpenAI vérifient à la fois le pont WebSocket backend et l’échange SDP WebRTC
    du navigateur sans journaliser de secrets.
    </Note>

  </Accordion>
</AccordionGroup>

## Points de terminaison Azure OpenAI

Le fournisseur `openai` inclus peut cibler une ressource Azure OpenAI pour la génération
d’images en remplaçant l’URL de base. Sur le chemin de génération d’images, OpenClaw
détecte les noms d’hôte Azure sur `models.providers.openai.baseUrl` et bascule
automatiquement vers la forme de requête d’Azure.

<Note>
La voix Realtime utilise un chemin de configuration distinct
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n’est pas affectée par `models.providers.openai.baseUrl`. Consultez l’accordéon **Voix
en temps réel** sous [Voix et parole](#voice-and-speech) pour ses paramètres
Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- Vous disposez déjà d’un abonnement Azure OpenAI, d’un quota ou d’un accord d’entreprise
- Vous avez besoin de la résidence régionale des données ou des contrôles de conformité fournis par Azure
- Vous souhaitez conserver le trafic à l’intérieur d’un tenant Azure existant

### Configuration

Pour la génération d’images Azure via le fournisseur `openai` inclus, pointez
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (et non une clé OpenAI Platform) :

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw reconnaît ces suffixes d’hôte Azure pour la route de génération d’images
Azure :

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Pour les requêtes de génération d’images sur un hôte Azure reconnu, OpenClaw :

- Envoie l’en-tête `api-key` au lieu de `Authorization: Bearer`
- Utilise des chemins limités au déploiement (`/openai/deployments/{deployment}/...`)
- Ajoute `?api-version=...` à chaque requête
- Utilise un délai d’expiration de requête par défaut de 600 s pour les appels de génération d’images Azure.
  Les valeurs `timeoutMs` par appel remplacent toujours cette valeur par défaut.

Les autres URL de base (OpenAI public, proxys compatibles OpenAI) conservent la forme
standard des requêtes d’image OpenAI.

<Note>
Le routage Azure pour le chemin de génération d’images du fournisseur `openai` nécessite
OpenClaw 2026.4.22 ou version ultérieure. Les versions antérieures traitent tout
`openai.baseUrl` personnalisé comme le point de terminaison OpenAI public et échoueront avec les
déploiements d’images Azure.
</Note>

### Version de l’API

Définissez `AZURE_OPENAI_API_VERSION` pour figer une version Azure spécifique en préversion ou GA
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèles sont des noms de déploiements

Azure OpenAI associe les modèles à des déploiements. Pour les requêtes de génération d’images Azure
acheminées via le fournisseur `openai` intégré, le champ `model` dans OpenClaw
doit être le **nom de déploiement Azure** que vous avez configuré dans le portail Azure, et non
l’identifiant public du modèle OpenAI.

Si vous créez un déploiement appelé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La même règle de nom de déploiement s’applique aux appels de génération d’images acheminés via
le fournisseur `openai` intégré.

### Disponibilité régionale

La génération d’images Azure n’est actuellement disponible que dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consultez la liste actuelle des régions de Microsoft avant de créer un
déploiement, et confirmez que le modèle spécifique est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut rejeter des options qu’OpenAI public autorise (par exemple certaines
valeurs `background` sur `gpt-image-2`) ou ne les exposer que sur des versions de modèle
spécifiques. Ces différences viennent d’Azure et du modèle sous-jacent, pas
d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, consultez
l’ensemble de paramètres pris en charge par votre déploiement spécifique et votre version d’API dans le
portail Azure.

<Note>
Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas
les en-têtes d’attribution masqués d’OpenClaw — consultez l’accordéon **Native vs OpenAI-compatible
routes** sous [Configuration avancée](#advanced-configuration).

Pour le trafic chat ou Responses sur Azure (au-delà de la génération d’images), utilisez le
flux d’onboarding ou une configuration de fournisseur Azure dédiée — `openai.baseUrl` seul
ne reprend pas la forme d’API/auth Azure. Un fournisseur distinct
`azure-openai-responses/*` existe ; consultez
l’accordéon Compaction côté serveur ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise WebSocket en priorité avec repli SSE (`"auto"`) pour `openai/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie un échec WebSocket précoce une fois avant de se replier sur SSE
    - Après un échec, marque WebSocket comme dégradé pendant environ 60 secondes et utilise SSE pendant le refroidissement
    - Attache des en-têtes stables d’identité de session et de tour pour les nouvelles tentatives et les reconnexions
    - Normalise les compteurs d’utilisation (`input_tokens` / `prompt_tokens`) entre les variantes de transport

    | Valeur | Comportement |
    |-------|----------|
    | `"auto"` (par défaut) | WebSocket d’abord, repli SSE |
    | `"sse"` | Forcer SSE uniquement |
    | `"websocket"` | Forcer WebSocket uniquement |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentation OpenAI associée :
    - [API Realtime avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw expose un interrupteur partagé de mode rapide pour `openai/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw mappe le mode rapide au traitement prioritaire OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont préservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Les remplacements de session l’emportent sur la configuration. Effacer le remplacement de session dans l’interface Sessions ramène la session à la valeur par défaut configurée.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    L’API d’OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valeurs prises en charge : `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` est transmis uniquement aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous acheminez l’un ou l’autre fournisseur via un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), l’enveloppe de flux Pi-harness du Plugin OpenAI active automatiquement la Compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu’indisponible)

    Cela s’applique au chemin Pi harness intégré et aux hooks de fournisseur OpenAI utilisés par les exécutions embarquées. Le harness serveur d’application Codex natif gère son propre contexte via Codex et est configuré par la route d’agent par défaut d’OpenAI ou par la politique d’exécution fournisseur/modèle.

    <Tabs>
      <Tab title="Enable explicitly">
        Utile pour les points de terminaison compatibles comme Azure OpenAI Responses :

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Custom threshold">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Disable">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` contrôle uniquement l’injection de `context_management`. Les modèles OpenAI Responses directs forcent toujours `store: true` sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    Pour les exécutions de la famille GPT-5 sur `openai/*`, OpenClaw peut utiliser un contrat d’exécution embarqué plus strict :

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Avec `strict-agentic`, OpenClaw :
    - Ne traite plus un tour contenant seulement un plan comme une progression réussie lorsqu’une action d’outil est disponible
    - Réessaie le tour avec une orientation pour agir maintenant
    - Active automatiquement `update_plan` pour les travaux substantiels
    - Affiche un état bloqué explicite si le modèle continue à planifier sans agir

    <Note>
    Limité aux exécutions des familles GPT-5 d’OpenAI et Codex uniquement. Les autres fournisseurs et les familles de modèles plus anciennes conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw traite les points de terminaison directs OpenAI, Codex et Azure OpenAI différemment des proxies génériques compatibles OpenAI `/v1` :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l’effort OpenAI `none`
    - Omettent le raisonnement désactivé pour les modèles ou proxies qui rejettent `reasoning.effort: "none"`
    - Définissent par défaut les schémas d’outils en mode strict
    - Attachent des en-têtes d’attribution masqués uniquement sur les hôtes natifs vérifiés
    - Conservent la mise en forme de requête propre à OpenAI (`service_tier`, `store`, compatibilité de raisonnement, indices de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus permissif
    - Suppriment `store` de Completions des charges utiles `openai-completions` non natives
    - Acceptent la transmission directe JSON avancée `params.extra_body`/`params.extraBody` pour les proxies Completions compatibles OpenAI
    - Acceptent `params.chat_template_kwargs` pour les proxies Completions compatibles OpenAI comme vLLM
    - Ne forcent pas les schémas d’outils stricts ni les en-têtes réservés au natif

    Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas les en-têtes d’attribution masqués.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Image generation" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Video generation" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="OAuth and auth" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
