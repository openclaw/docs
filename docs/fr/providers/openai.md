---
read_when:
    - Vous voulez utiliser des modèles OpenAI dans OpenClaw
    - Vous voulez l’authentification par abonnement Codex plutôt que des clés API
    - Vous avez besoin d’un comportement d’exécution d’agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:06:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fournit des API développeur pour les modèles GPT, et Codex est également disponible comme
agent de codage des offres ChatGPT via les clients Codex d’OpenAI. OpenClaw utilise un seul
id de fournisseur, `openai`, pour les deux formes d’authentification.

OpenClaw utilise `openai/*` comme route canonique des modèles OpenAI. Les tours d’agent intégrés
sur les modèles OpenAI s’exécutent par défaut via le runtime natif de serveur d’application Codex ;
l’authentification directe par clé d’API OpenAI reste disponible pour les surfaces OpenAI hors agent
telles que les images, les embeddings, la voix et le temps réel.

- **Modèles d’agent** - modèles `openai/*` via le runtime Codex ; connectez-vous avec
  l’authentification Codex pour utiliser un abonnement ChatGPT/Codex, ou configurez une sauvegarde
  par clé d’API OpenAI compatible Codex lorsque vous voulez intentionnellement une authentification par clé d’API.
- **API OpenAI hors agent** - accès direct à la plateforme OpenAI avec facturation à l’usage
  via `OPENAI_API_KEY` ou l’onboarding par clé d’API OpenAI.
- **Configuration héritée** - les références héritées de modèles Codex sont réparées par
  `openclaw doctor --fix` vers `openai/*` avec le runtime Codex.

OpenAI prend explicitement en charge l’utilisation OAuth par abonnement dans des outils et workflows externes comme OpenClaw.

Le fournisseur, le modèle, le runtime et le canal sont des couches distinctes. Si ces libellés sont
mélangés, lisez [Runtimes d’agent](/fr/concepts/agent-runtimes) avant de
modifier la configuration.

## Choix rapide

| Objectif                                             | Utiliser                                                 | Notes                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Abonnement ChatGPT/Codex avec runtime Codex natif    | `openai/gpt-5.5`                                         | Configuration d’agent OpenAI par défaut. Connectez-vous avec l’authentification Codex. |
| Facturation directe par clé d’API pour les modèles d’agent | `openai/gpt-5.5` plus un profil de clé d’API compatible Codex | Utilisez `auth.order.openai` pour placer la sauvegarde après l’authentification par abonnement. |
| Facturation directe par clé d’API via OpenClaw explicite | `openai/gpt-5.5` plus le runtime fournisseur/modèle `openclaw` | Sélectionnez un profil de clé d’API `openai` normal.                  |
| Dernier alias d’API ChatGPT Instant                  | `openai/chat-latest`                                     | Clé d’API directe uniquement. Alias mobile pour les expérimentations, pas la valeur par défaut. |
| Authentification d’abonnement ChatGPT/Codex via OpenClaw | `openai/gpt-5.5` plus le runtime fournisseur/modèle `openclaw` | Sélectionnez un profil OAuth `openai` pour la route de compatibilité. |
| Génération ou édition d’images                       | `openai/gpt-image-2`                                     | Fonctionne avec `OPENAI_API_KEY` ou OAuth OpenAI Codex.               |
| Images à arrière-plan transparent                    | `openai/gpt-image-1.5`                                   | Utilisez `outputFormat=png` ou `webp` et `openai.background=transparent`. |

## Carte des noms

Les noms se ressemblent, mais ne sont pas interchangeables :

| Nom affiché                             | Couche            | Signification                                                                                     |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Préfixe de fournisseur | Route canonique des modèles OpenAI ; les tours d’agent utilisent le runtime Codex.                |
| préfixe OpenAI Codex hérité             | Préfixe hérité    | Ancien espace de noms de modèle/profil. `openclaw doctor --fix` le migre vers `openai`.           |
| Plugin `codex`                          | Plugin            | Plugin OpenClaw groupé qui fournit le runtime natif de serveur d’application Codex et les contrôles de chat `/codex`. |
| fournisseur/modèle `agentRuntime.id: codex` | Runtime d’agent | Force le harnais natif de serveur d’application Codex pour les tours intégrés correspondants.      |
| `/codex ...`                            | Ensemble de commandes de chat | Lier/contrôler les fils de serveur d’application Codex depuis une conversation.                   |
| `runtime: "acp", agentId: "codex"`      | Route de session ACP | Chemin de repli explicite qui exécute Codex via ACP/acpx.                                         |

Cela signifie qu’une configuration peut contenir intentionnellement des références de modèle `openai/*` tandis que les
profils d’authentification pointent vers des identifiants OAuth par clé d’API ou ChatGPT/Codex. Utilisez
`auth.order.openai` pour la configuration ; `openclaw doctor --fix` réécrit les références héritées
de modèles Codex hérités, les ids hérités de profils d’authentification Codex et
l’ordre d’authentification Codex hérité vers la route OpenAI canonique.

<Note>
GPT-5.5 est disponible à la fois via un accès direct par clé d’API OpenAI Platform et via les
routes abonnement/OAuth. Pour un abonnement ChatGPT/Codex avec exécution Codex native,
utilisez `openai/gpt-5.5` ; l’absence de configuration de runtime sélectionne désormais le harnais Codex
pour les tours d’agent OpenAI. Utilisez les profils de clé d’API OpenAI uniquement lorsque vous voulez
une authentification directe par clé d’API pour un modèle d’agent OpenAI.
</Note>

<Note>
Les tours de modèles d’agent OpenAI nécessitent le Plugin groupé de serveur d’application Codex. La configuration explicite
du runtime OpenClaw reste disponible comme route de compatibilité optionnelle. Quand OpenClaw est
explicitement sélectionné avec un profil OAuth `openai`, OpenClaw conserve la
référence de modèle publique sous la forme `openai/*` et route en interne via le transport
d’authentification Codex. Exécutez `openclaw doctor --fix` pour réparer les références obsolètes
de modèles Codex hérités, `codex-cli/*`, ou les anciens ancrages de session de runtime qui ne proviennent pas
d’une configuration de runtime explicite.
</Note>

## Couverture des fonctionnalités OpenClaw

| Capacité OpenAI          | Surface OpenClaw                                                                               | Statut                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses         | fournisseur de modèle `openai/<model>`                                                          | Oui                                                                    |
| Modèles d’abonnement Codex | `openai/<model>` avec OAuth OpenAI                                                            | Oui                                                                    |
| Références de modèles Codex héritées | références de modèles Codex héritées ou `codex-cli/<model>`                            | Réparées par doctor vers `openai/<model>`                              |
| Harnais de serveur d’application Codex | `openai/<model>` avec runtime omis ou fournisseur/modèle `agentRuntime.id: codex`     | Oui                                                                    |
| Recherche web côté serveur | Outil OpenAI Responses natif                                                                  | Oui, lorsque la recherche web est activée et qu’aucun fournisseur n’est épinglé |
| Images                   | `image_generate`                                                                                | Oui                                                                    |
| Vidéos                   | `video_generate`                                                                                | Oui                                                                    |
| Synthèse vocale          | `messages.tts.provider: "openai"` / `tts`                                                       | Oui                                                                    |
| Transcription audio par lots | `tools.media.audio` / compréhension des médias                                               | Oui                                                                    |
| Transcription audio en streaming | Voice Call `streaming.provider: "openai"`                                               | Oui                                                                    |
| Voix en temps réel       | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"`   | Oui (nécessite des crédits OpenAI Platform, pas un abonnement Codex/ChatGPT) |
| Embeddings               | fournisseur d’embeddings mémoire                                                                | Oui                                                                    |

<Note>
  La voix OpenAI Realtime (utilisée par `realtime.provider: "openai"` de Voice Call et
  Control UI Talk avec `talk.realtime.provider: "openai"`) passe par
  l’**API OpenAI Platform Realtime** publique, facturée sur les crédits OpenAI
  Platform plutôt que sur le quota d’abonnement Codex/ChatGPT. Un compte
  avec un OAuth OpenAI sain qui exécute sans problème des modèles de chat adossés à Codex
  a tout de même besoin d’un profil d’authentification par clé d’API OpenAI ou d’une clé d’API Platform avec une
  facturation Platform provisionnée pour la voix en temps réel.

Correctif : rechargez les crédits Platform sur
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
pour l’organisation qui porte vos identifiants temps réel. La voix en temps réel accepte
le profil d’authentification par clé d’API `openai` créé par `openclaw onboard --auth-choice openai-api-key`,
une clé Platform `OPENAI_API_KEY` configurée via `talk.realtime.providers.openai.apiKey`
pour Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
pour Voice Call, ou la variable d’environnement `OPENAI_API_KEY`. Les profils OAuth OpenAI
peuvent toujours exécuter des modèles de chat `openai/*` adossés à Codex dans la même
installation OpenClaw, mais ils ne configurent pas la voix en temps réel.
</Note>

## Embeddings mémoire

OpenClaw peut utiliser OpenAI, ou un point de terminaison d’embeddings compatible OpenAI, pour
l’indexation `memory_search` et les embeddings de requêtes :

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

Pour les points de terminaison compatibles OpenAI qui nécessitent des libellés d’embedding asymétriques, définissez
`queryInputType` et `documentInputType` sous `memorySearch`. OpenClaw les transmet
comme champs de requête `input_type` propres au fournisseur : les embeddings de requêtes utilisent
`queryInputType` ; les morceaux de mémoire indexés et l’indexation par lots utilisent
`documentInputType`. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#provider-specific-config) pour l’exemple complet.

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé d’API (OpenAI Platform)">
    **Idéal pour :** accès direct à l’API et facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé d’API">
        Créez ou copiez une clé d’API depuis le [tableau de bord OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécuter l’onboarding">
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

    ### Résumé de la route

    | Réf. de modèle         | Configuration de runtime    | Route                       | Authentification |
    | ---------------------- | --------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omis / fournisseur/modèle `agentRuntime.id: "codex"` | Harnais de serveur d’application Codex | Profil OpenAI compatible Codex |
    | `openai/gpt-5.4-mini` | omis / fournisseur/modèle `agentRuntime.id: "codex"` | Harnais de serveur d’application Codex | Profil OpenAI compatible Codex |
    | `openai/gpt-5.5`      | fournisseur/modèle `agentRuntime.id: "openclaw"`              | Runtime intégré OpenClaw      | Profil `openai` sélectionné |

    <Note>
    Les modèles d’agent `openai/*` utilisent le harnais de serveur d’application Codex. Pour utiliser
    l’authentification par clé d’API pour un modèle d’agent, créez un profil de clé d’API compatible Codex et classez-le
    avec `auth.order.openai`; `OPENAI_API_KEY` reste le repli direct pour
    les surfaces d’API OpenAI hors agent. Exécutez `openclaw doctor --fix` pour migrer les anciennes
    entrées d’ordre d’authentification Codex héritées.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Pour essayer le modèle Instant actuel de ChatGPT depuis l’API OpenAI, définissez le modèle
    sur `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` est un alias mouvant. OpenAI le documente comme le dernier modèle Instant
    utilisé dans ChatGPT et recommande `gpt-5.5` pour l’utilisation de l’API en production, donc
    conservez `openai/gpt-5.5` comme valeur par défaut stable, sauf si vous souhaitez explicitement ce
    comportement d’alias. L’alias n’accepte actuellement que la verbosité de texte `medium`, donc
    OpenClaw normalise les remplacements incompatibles de verbosité de texte OpenAI pour ce
    modèle.

    <Warning>
    OpenClaw n’expose **pas** `gpt-5.3-codex-spark` sur la route directe par clé d’API OpenAI. Il est disponible uniquement via les entrées du catalogue d’abonnement Codex lorsque votre compte connecté l’expose.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex avec l’exécution native du serveur d’application Codex au lieu d’une clé d’API séparée. Le cloud Codex nécessite une connexion à ChatGPT.

    <Steps>
      <Step title="Exécuter OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Ou exécutez OAuth directement :

        ```bash
        openclaw models auth login --provider openai
        ```

        Pour les configurations sans interface graphique ou hostiles aux rappels, ajoutez `--device-code` pour vous connecter avec un flux par code d’appareil ChatGPT au lieu du rappel navigateur localhost :

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Utiliser la route canonique du modèle OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Aucune configuration d’exécution n’est requise pour le chemin par défaut. Les tours d’agent OpenAI
        sélectionnent automatiquement l’exécution native du serveur d’application Codex, et OpenClaw
        installe ou répare le Plugin Codex groupé lorsque cette route est choisie.
      </Step>
      <Step title="Vérifier que l’authentification Codex est disponible">
        ```bash
        openclaw models list --provider openai
        ```

        Une fois que le Gateway est en cours d’exécution, envoyez `/codex status` ou `/codex models`
        dans le chat pour vérifier l’exécution native du serveur d’application.
      </Step>
    </Steps>

    ### Résumé des routes

    | Référence du modèle | Configuration d’exécution | Route | Authentification |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omise / fournisseur/modèle `agentRuntime.id: "codex"` | Harnais natif de serveur d’application Codex | Connexion Codex ou profil d’authentification `openai` ordonné |
    | `openai/gpt-5.5` | fournisseur/modèle `agentRuntime.id: "openclaw"` | Exécution intégrée OpenClaw avec transport interne d’authentification Codex | Profil OAuth `openai` sélectionné |
    | ancienne référence Codex GPT-5.5 | réparée par doctor | Route héritée réécrite vers `openai/gpt-5.5` | Profil OAuth OpenAI migré |
    | `codex-cli/gpt-5.5` | réparée par doctor | Route CLI héritée réécrite vers `openai/gpt-5.5` | Authentification du serveur d’application Codex |

    <Warning>
    Préférez `openai/gpt-5.5` pour les nouvelles configurations d’agent adossées à un abonnement. Les anciennes
    références Codex GPT héritées sont des routes OpenClaw héritées, pas le chemin d’exécution natif Codex ;
    exécutez `openclaw doctor --fix` lorsque vous voulez les migrer vers des références canoniques
    `openai/*`. `gpt-5.3-codex-spark` reste limité aux comptes dont
    le catalogue d’abonnement Codex annonce ce modèle ; les références directes par clé d’API OpenAI et
    Azure pour celui-ci restent supprimées.
    </Warning>

    <Note>
    Le préfixe de modèle Codex hérité est une configuration héritée réparée par doctor. Pour
    la configuration courante avec abonnement plus exécution native, connectez-vous avec l’authentification Codex
    mais gardez la référence du modèle comme `openai/gpt-5.5`. Les nouvelles configurations doivent placer l’ordre
    d’authentification des agents OpenAI sous `auth.order.openai`; doctor migre les anciennes
    entrées d’ordre d’authentification Codex héritées.
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

    Avec une clé d’API de secours, conservez le modèle sur `openai/gpt-5.5` et placez l’ordre
    d’authentification sous `openai`. OpenClaw essaiera d’abord l’abonnement, puis
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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    L’intégration n’importe plus de matériel OAuth depuis `~/.codex`. Connectez-vous avec OAuth dans le navigateur (par défaut) ou avec le flux par code d’appareil ci-dessus — OpenClaw gère les identifiants obtenus dans son propre magasin d’authentification d’agent.
    </Note>

    ### Vérifier et récupérer le routage OAuth Codex

    Utilisez ces commandes pour voir quels modèle, exécution et route d’authentification votre agent
    par défaut utilise :

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Pour un agent spécifique, ajoutez `--agent <id>` :

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Si une ancienne configuration contient encore des références Codex GPT héritées ou un épinglage obsolète de session d’exécution OpenAI
    sans configuration d’exécution explicite, réparez-la :

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Si `models auth list --provider openai` n’affiche aucun profil utilisable, connectez-vous
    à nouveau :

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Utilisez `--profile-id` lorsque vous voulez plusieurs connexions OAuth Codex dans le même
    agent et souhaitez ensuite les contrôler via l’ordre d’authentification ou `/model ...@<profileId>` :

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` est la route de modèle pour les tours d’agent OpenAI via Codex. Exécutez
    `openclaw doctor --fix` pour migrer les anciens identifiants de profil avec préfixe OpenAI Codex hérité et
    les entrées d’ordre avant de vous appuyer sur l’ordre des profils.

    ### Indicateur d’état

    Le chat `/status` indique quelle exécution de modèle est active pour la session actuelle.
    Le harnais de serveur d’application Codex groupé apparaît comme `Runtime: OpenAI Codex` pour
    les tours de modèle d’agent OpenAI. Les épinglages obsolètes de session d’exécution OpenAI sont réparés vers Codex, sauf si
    la configuration épingle explicitement OpenClaw.

    ### Avertissement doctor

    Si des références de modèle Codex héritées ou des épinglages obsolètes d’exécution OpenAI restent dans la configuration ou
    l’état de session, `openclaw doctor --fix` les réécrit vers `openai/*` avec
    l’exécution Codex, sauf si OpenClaw est explicitement configuré.

    ### Plafond de fenêtre de contexte

    OpenClaw traite les métadonnées de modèle et le plafond de contexte d’exécution comme des valeurs distinctes.

    Pour `openai/gpt-5.5` via le catalogue OAuth Codex :

    - `contextWindow` natif : `1000000`
    - Plafond `contextTokens` d’exécution par défaut : `272000`

    Le plafond par défaut plus petit offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-le avec `contextTokens` :

    ```json5
    {
      models: {
        providers: {
          openai: {
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

    OpenClaw utilise les métadonnées de catalogue Codex amont pour `gpt-5.5` lorsqu’elles sont
    présentes. Si la découverte Codex en direct omet la ligne `gpt-5.5` alors que
    le compte est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que
    les exécutions cron, sous-agent et de modèle par défaut configuré n’échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Authentification native du serveur d’application Codex

Le harnais natif de serveur d’application Codex utilise des références de modèle `openai/*` plus une configuration
d’exécution omise ou fournisseur/modèle `agentRuntime.id: "codex"`, mais son authentification reste
basée sur le compte. OpenClaw sélectionne l’authentification dans cet ordre :

1. Profils d’authentification OpenAI ordonnés pour l’agent, de préférence sous
   `auth.order.openai`. Exécutez `openclaw doctor --fix` pour migrer les anciens
   identifiants de profil d’authentification Codex hérités et l’ordre d’authentification Codex hérité.
2. Le compte existant du serveur d’application, par exemple une connexion ChatGPT locale via la CLI Codex.
3. Pour les lancements locaux du serveur d’application stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsque le serveur d’application ne signale aucun compte et nécessite encore
   l’authentification OpenAI.

Cela signifie qu’une connexion locale à un abonnement ChatGPT/Codex n’est pas remplacée simplement
parce que le processus Gateway dispose aussi de `OPENAI_API_KEY` pour les modèles OpenAI directs
ou les embeddings. Le repli par clé d’API d’environnement n’est que le chemin local stdio sans compte ; il
n’est pas envoyé aux connexions WebSocket du serveur d’application. Lorsqu’un profil Codex de type abonnement
est sélectionné, OpenClaw exclut aussi `CODEX_API_KEY` et `OPENAI_API_KEY`
du processus enfant stdio du serveur d’application lancé et envoie les identifiants sélectionnés
via le RPC de connexion du serveur d’application. Lorsque ce profil d’abonnement est bloqué par une
limite d’utilisation Codex, OpenClaw peut passer au profil de clé d’API `openai:*` ordonné suivant
sans changer le modèle sélectionné ni quitter le harnais Codex. Une fois l’heure de réinitialisation de l’abonnement passée, le profil d’abonnement redevient
éligible.

## Génération d’images

Le Plugin `openai` groupé enregistre la génération d’images via l’outil `image_generate`.
Il prend en charge à la fois la génération d’images par clé d’API OpenAI et la génération d’images OAuth Codex
via la même référence de modèle `openai/gpt-image-2`.

| Capacité                | Clé d’API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Référence du modèle                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentification                      | `OPENAI_API_KEY`                   | Connexion OAuth OpenAI Codex           |
| Transport                 | API OpenAI Images                  | Backend Codex Responses              |
| Nombre max. d’images par requête    | 4                                  | 4                                    |
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
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération d’images à partir de texte OpenAI et la
modification d’images. `gpt-image-1.5`, `gpt-image-1` et `gpt-image-1-mini` restent utilisables comme
remplacements de modèle explicites. Utilisez `openai/gpt-image-1.5` pour la sortie PNG/WebP
à arrière-plan transparent ; l’API `gpt-image-2` actuelle rejette
`background: "transparent"`.

Pour une requête avec arrière-plan transparent, les agents doivent appeler `image_generate` avec
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, et
`background: "transparent"` ; l’ancienne option de fournisseur `openai.background` est
toujours acceptée. OpenClaw protège aussi les routes OAuth publiques OpenAI et
OpenAI Codex en réécrivant les requêtes transparentes par défaut `openai/gpt-image-2`
vers `gpt-image-1.5` ; Azure et les points de terminaison personnalisés compatibles
avec OpenAI conservent leurs noms de déploiement/modèle configurés.

Le même paramètre est exposé pour les exécutions CLI sans interface :

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
Utilisez `--quality low|medium|high|auto` lorsque vous devez contrôler la
qualité et le coût d’OpenAI Images. Utilisez `--openai-moderation low|auto`
pour transmettre l’indication de modération propre au fournisseur OpenAI depuis
`image generate` ou `image edit`.

Pour les installations OAuth ChatGPT/Codex, conservez la même référence
`openai/gpt-image-2`. Lorsqu’un profil OAuth `openai` est configuré, OpenClaw
résout ce jeton d’accès OAuth stocké et envoie les requêtes d’image via le
backend Codex Responses. Il n’essaie pas d’abord `OPENAI_API_KEY` et ne se rabat
pas silencieusement sur une clé API pour cette requête. Configurez explicitement
`models.providers.openai` avec une clé API, une URL de base personnalisée ou un
point de terminaison Azure lorsque vous voulez utiliser à la place la route
directe de l’API OpenAI Images.
Si ce point de terminaison d’image personnalisé se trouve sur un réseau local
fiable ou une adresse privée, définissez aussi
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw continue de
bloquer les points de terminaison d’image privés/internes compatibles avec
OpenAI sauf si cette option explicite est présente.

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

Le plugin `openai` intégré enregistre la génération de vidéos via l’outil `video_generate`.

| Capacité | Valeur |
| ---------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2` |
| Modes | Texte vers vidéo, image vers vidéo, modification d’une seule vidéo |
| Entrées de référence | 1 image ou 1 vidéo |
| Remplacements de taille | Pris en charge pour le texte vers vidéo et l’image vers vidéo |
| Autres remplacements | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement de l’outil |

Les requêtes OpenAI image vers vidéo utilisent `POST /v1/videos` avec une
`input_reference` d’image. Les modifications d’une seule vidéo utilisent
`POST /v1/videos/edits` avec la vidéo téléversée dans le champ `video`.

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
Consultez [Génération de vidéos](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Contribution d’invite GPT-5

OpenClaw ajoute une contribution d’invite GPT-5 partagée pour les exécutions de la famille GPT-5 sur les surfaces d’invite assemblées par OpenClaw. Elle s’applique par identifiant de modèle, de sorte que les routes OpenClaw/fournisseur comme les références héritées avant réparation (référence héritée Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` et d’autres références GPT-5 compatibles reçoivent la même superposition. Les anciens modèles GPT-4.x ne la reçoivent pas.

Le harnais Codex natif intégré ne reçoit pas cette superposition GPT-5 d’OpenClaw via les instructions développeur du serveur d’application Codex. Codex natif conserve le comportement de base, de modèle et de documentation de projet propre à Codex, tandis qu’OpenClaw désactive la personnalité intégrée de Codex pour les fils natifs afin que les fichiers de personnalité de l’espace de travail de l’agent restent l’autorité. OpenClaw ne contribue que le contexte d’exécution, comme la livraison par canal, les outils dynamiques OpenClaw, la délégation ACP, le contexte de l’espace de travail et les Skills OpenClaw.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de la persona, la sécurité d’exécution, la discipline des outils, la forme de sortie, les contrôles d’achèvement et la vérification sur les invites assemblées par OpenClaw correspondantes. Le comportement de réponse propre au canal et de message silencieux reste dans l’invite système OpenClaw partagée et la politique de livraison sortante. La couche de style d’interaction convivial est distincte et configurable.

| Valeur | Effet |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (par défaut) | Active la couche de style d’interaction convivial |
| `"on"` | Alias de `"friendly"` |
| `"off"` | Désactive uniquement la couche de style convivial |

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
Les valeurs sont insensibles à la casse à l’exécution, donc `"Off"` et `"off"` désactivent toutes deux la couche de style convivial.
</Tip>

<Note>
L’ancien `plugins.entries.openai.config.personality` est toujours lu comme solution de compatibilité de repli lorsque le paramètre partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le plugin `openai` intégré enregistre la synthèse vocale pour la surface `messages.tts`.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Se rabat sur `OPENAI_API_KEY` |
    | URL de base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corps supplémentaire | `messages.tts.providers.openai.extraBody` / `extra_body` | (non défini) |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` est fusionné dans le JSON de requête `/audio/speech` après les champs générés par OpenClaw ; utilisez-le donc pour les points de terminaison compatibles avec OpenAI qui nécessitent des clés supplémentaires comme `lang`. Les clés de prototype sont ignorées.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Définissez `OPENAI_TTS_BASE_URL` pour remplacer l’URL de base TTS sans affecter le point de terminaison de l’API de chat. OpenAI TTS et la voix Realtime sont tous deux configurés via une clé API OpenAI Platform ; les installations uniquement OAuth peuvent toujours utiliser les modèles de chat adossés à Codex, mais pas le retour vocal en direct OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Parole vers texte">
    Le plugin `openai` intégré enregistre la parole vers texte par lots via
    la surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : REST OpenAI `/v1/audio/transcriptions`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de salons vocaux Discord et les
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

    Les indications de langue et d’invite sont transmises à OpenAI lorsqu’elles sont fournies par la
    configuration audio média partagée ou par la requête de transcription par appel.

  </Accordion>

  <Accordion title="Transcription Realtime">
    Le plugin `openai` intégré enregistre la transcription Realtime pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Invite | `...openai.prompt` | (non défini) |
    | Durée de silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY` ou OAuth `openai` | Les clés API se connectent directement ; OAuth émet un secret client de transcription Realtime |

    <Note>
    Utilise une connexion WebSocket à `wss://api.openai.com/v1/realtime` avec de l’audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Lorsque seul OAuth `openai` est configuré, le Gateway émet un secret client de transcription Realtime éphémère avant d’ouvrir le WebSocket. Ce fournisseur de streaming est destiné au chemin de transcription Realtime de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise à la place le chemin de transcription par lots `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix Realtime">
    Le plugin `openai` intégré enregistre la voix Realtime pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voix | `...openai.voice` | `alloy` |
    | Température (pont de déploiement Azure) | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée de silence | `...openai.silenceDurationMs` | `500` |
    | Rembourrage de préfixe | `...openai.prefixPaddingMs` | `300` |
    | Effort de raisonnement | `...openai.reasoningEffort` | (non défini) |
    | Auth | Profil d’authentification par clé API `openai`, `...openai.apiKey` ou `OPENAI_API_KEY` | Clé API OpenAI Platform requise ; OAuth OpenAI ne configure pas la voix Realtime |

    Voix Realtime intégrées disponibles pour `gpt-realtime-2` : `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI recommande `marin` et `cedar` pour la meilleure qualité Realtime. Il
    s’agit d’un ensemble distinct des voix de synthèse vocale ci-dessus ; ne
    supposez pas qu’une voix TTS comme `fable`, `nova` ou `onyx` soit valide
    pour les sessions Realtime.

    <Note>
    Les ponts Realtime OpenAI backend utilisent la forme de session WebSocket Realtime GA, qui n’accepte pas `session.temperature`. Les déploiements Azure OpenAI restent disponibles via `azureEndpoint` et `azureDeployment` et conservent la forme de session compatible avec le déploiement. Prend en charge l’appel d’outils bidirectionnel et l’audio G.711 u-law.
    </Note>

    <Note>
    La voix Realtime est sélectionnée à la création de la session. OpenAI autorise la modification ultérieure de la plupart
    des champs de session, mais la voix ne peut pas être modifiée après que le
    modèle a émis de l’audio dans cette session. OpenClaw expose actuellement les
    identifiants de voix Realtime intégrés sous forme de chaînes.
    </Note>

    <Note>
    Control UI Talk utilise des sessions OpenAI en temps réel dans le navigateur avec un secret client
    éphémère émis par le Gateway et un échange SDP WebRTC direct du navigateur avec
    l'OpenAI Realtime API. Le Gateway émet ce secret client avec le profil
    d'authentification par clé API `openai` sélectionné ou la clé API OpenAI Platform configurée. Le relais
    Gateway et les ponts WebSocket en temps réel du backend Voice Call utilisent le même
    chemin d'authentification limité aux clés API pour les points de terminaison OpenAI natifs. La vérification
    en direct par les mainteneurs est disponible avec
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    les branches OpenAI vérifient à la fois le pont WebSocket backend et l'échange
    SDP WebRTC du navigateur sans journaliser de secrets.
    </Note>

  </Accordion>
</AccordionGroup>

## Points de terminaison Azure OpenAI

Le fournisseur `openai` intégré peut cibler une ressource Azure OpenAI pour la génération
d'images en remplaçant l'URL de base. Sur le chemin de génération d'images, OpenClaw
détecte les noms d'hôte Azure dans `models.providers.openai.baseUrl` et bascule
automatiquement vers la forme de requête d'Azure.

<Note>
La voix en temps réel utilise un chemin de configuration séparé
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n'est pas affectée par `models.providers.openai.baseUrl`. Consultez l'accordéon **Voix
en temps réel** sous [Voix et parole](#voice-and-speech) pour ses paramètres Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- Vous disposez déjà d'un abonnement Azure OpenAI, d'un quota ou d'un accord d'entreprise
- Vous avez besoin de résidence régionale des données ou de contrôles de conformité fournis par Azure
- Vous voulez conserver le trafic dans un locataire Azure existant

### Configuration

Pour la génération d'images Azure via le fournisseur `openai` intégré, pointez
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

OpenClaw reconnaît ces suffixes d'hôte Azure pour la route de génération d'images
Azure :

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Pour les requêtes de génération d'images sur un hôte Azure reconnu, OpenClaw :

- Envoie l'en-tête `api-key` au lieu de `Authorization: Bearer`
- Utilise des chemins limités au déploiement (`/openai/deployments/{deployment}/...`)
- Ajoute `?api-version=...` à chaque requête
- Utilise un délai d'expiration de requête par défaut de 600 s pour les appels de génération d'images Azure.
  Les valeurs `timeoutMs` par appel remplacent toujours cette valeur par défaut.

Les autres URL de base (OpenAI public, proxys compatibles OpenAI) conservent la forme
standard de requête d'image OpenAI.

<Note>
Le routage Azure pour le chemin de génération d'images du fournisseur `openai` nécessite
OpenClaw 2026.4.22 ou version ultérieure. Les versions antérieures traitent toute valeur
personnalisée de `openai.baseUrl` comme le point de terminaison OpenAI public et échoueront avec les
déploiements d'images Azure.
</Note>

### Version de l'API

Définissez `AZURE_OPENAI_API_VERSION` pour fixer une version Azure preview ou GA spécifique
pour le chemin de génération d'images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n'est pas définie.

### Les noms de modèle sont des noms de déploiement

Azure OpenAI lie les modèles aux déploiements. Pour les requêtes de génération d'images Azure
routées via le fournisseur `openai` intégré, le champ `model` dans OpenClaw
doit être le **nom de déploiement Azure** que vous avez configuré dans le portail Azure, et non
l'id du modèle OpenAI public.

Si vous créez un déploiement appelé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La même règle de nom de déploiement s'applique aux appels de génération d'images routés via
le fournisseur `openai` intégré.

### Disponibilité régionale

La génération d'images Azure n'est actuellement disponible que dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consultez la liste actuelle des régions de Microsoft avant de créer un
déploiement, et confirmez que le modèle spécifique est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n'acceptent pas toujours les mêmes paramètres d'image.
Azure peut rejeter des options qu'OpenAI public autorise (par exemple certaines
valeurs de `background` sur `gpt-image-2`) ou ne les exposer que sur des versions de modèle
spécifiques. Ces différences proviennent d'Azure et du modèle sous-jacent, pas
d'OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez l'ensemble de
paramètres pris en charge par votre déploiement et votre version d'API spécifiques dans le
portail Azure.

<Note>
Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas
les en-têtes d'attribution masqués d'OpenClaw — consultez l'accordéon **Routes natives et compatibles OpenAI**
sous [Configuration avancée](#advanced-configuration).

Pour le trafic de chat ou Responses sur Azure (au-delà de la génération d'images), utilisez le
flux d'intégration ou une configuration de fournisseur Azure dédiée — `openai.baseUrl` seul
n'adopte pas la forme d'API/d'authentification Azure. Un fournisseur
`azure-openai-responses/*` séparé existe ; consultez l'accordéon Compaction côté serveur ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket ou SSE)">
    OpenClaw utilise WebSocket en priorité avec repli SSE (`"auto"`) pour `openai/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie un premier échec WebSocket avant de se rabattre sur SSE
    - Après un échec, marque WebSocket comme dégradé pendant environ 60 secondes et utilise SSE pendant le délai de récupération
    - Attache des en-têtes d'identité de session et de tour stables pour les nouvelles tentatives et les reconnexions
    - Normalise les compteurs d'utilisation (`input_tokens` / `prompt_tokens`) entre les variantes de transport

    | Valeur | Comportement |
    |-------|----------|
    | `"auto"` (par défaut) | WebSocket d'abord, repli SSE |
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

    Documentation OpenAI associée :
    - [Realtime API avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses d'API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Mode rapide">
    OpenClaw expose un commutateur partagé de mode rapide pour `openai/*` :

    - **Chat/interface utilisateur :** `/fast status|auto|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu'il est activé, OpenClaw associe le mode rapide au traitement prioritaire d'OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont préservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`. `fastMode: "auto"` lance les nouveaux appels de modèle en mode rapide jusqu'au seuil automatique, puis lance les appels ultérieurs de nouvelle tentative, de repli, de résultat d'outil ou de continuation sans mode rapide. Le seuil est de 60 secondes par défaut ; définissez `params.fastAutoOnSeconds` sur le modèle actif pour le modifier.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Les remplacements de session priment sur la configuration. Effacer le remplacement de session dans l'interface Sessions ramène la session à la valeur par défaut configurée.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L'API d'OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

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

    Valeurs prises en charge : `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` est transmis uniquement aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous routez l'un ou l'autre fournisseur via un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), l'enveloppe de flux OpenClaw du Plugin OpenAI active automatiquement la Compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu'indisponible)

    Cela s'applique au chemin d'exécution OpenClaw intégré et aux hooks de fournisseur OpenAI utilisés par les exécutions embarquées. Le harnais de serveur d'application Codex natif gère son propre contexte via Codex et est configuré par la route d'agent par défaut d'OpenAI ou par la politique d'exécution fournisseur/modèle.

    <Tabs>
      <Tab title="Activer explicitement">
        Utile pour les points de terminaison compatibles comme Azure OpenAI Responses :

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
      <Tab title="Seuil personnalisé">
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
      <Tab title="Désactiver">
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
    `responsesServerCompaction` contrôle uniquement l'injection de `context_management`. Les modèles OpenAI Responses directs forcent toujours `store: true`, sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT strict-agentic">
    Pour les exécutions de la famille GPT-5 sur `openai/*`, OpenClaw peut utiliser un contrat d'exécution embarqué plus strict :

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Avec `strict-agentic`, OpenClaw :
    - Active automatiquement `update_plan` pour les travaux substantiels
    - Réessaie les tours structurellement vides ou uniquement constitués de raisonnement avec une continuation à réponse visible
    - Utilise des événements de plan explicites du harnais lorsque le harnais sélectionné les fournit

    OpenClaw ne classe pas la prose de l'assistant pour décider si un tour est un plan, une mise à jour de progression ou une réponse finale.

    <Note>
    Limité aux exécutions OpenAI et Codex de la famille GPT-5 uniquement. Les autres fournisseurs et les familles de modèles plus anciennes conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives et compatibles OpenAI">
    OpenClaw traite les points de terminaison OpenAI directs, Codex et Azure OpenAI différemment des proxys `/v1` génériques compatibles OpenAI :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l'effort OpenAI `none`
    - Omettent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - Définissent par défaut les schémas d'outils en mode strict
    - Attachent des en-têtes d'attribution masqués uniquement sur les hôtes natifs vérifiés
    - Conservent la mise en forme des requêtes propre à OpenAI (`service_tier`, `store`, compatibilité du raisonnement, indications de cache de prompt)

    **Routes proxy/compatibles :**
    - Utiliser un comportement de compatibilité plus souple
    - Supprimer `store` de Completions des charges utiles `openai-completions` non natives
    - Accepter le JSON de relais avancé `params.extra_body`/`params.extraBody` pour les proxys Completions compatibles OpenAI
    - Accepter `params.chat_template_kwargs` pour les proxys Completions compatibles OpenAI tels que vLLM
    - Ne pas imposer de schémas d’outils stricts ni d’en-têtes exclusivement natifs

    Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas les en-têtes d’attribution masqués.

  </Accordion>
</AccordionGroup>

## Articles connexes

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
