---
read_when:
    - Vous souhaitez utiliser les modèles OpenAI dans OpenClaw
    - Vous voulez utiliser l’authentification par abonnement Codex plutôt que des clés API
    - Vous avez besoin d’un comportement d’exécution d’agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:25:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fournit des API développeur pour les modèles GPT, et Codex est également disponible comme agent de codage avec abonnement ChatGPT via les clients Codex d’OpenAI. OpenClaw garde ces surfaces séparées afin que la configuration reste prévisible.

OpenClaw utilise `openai/*` comme route canonique des modèles OpenAI. Les tours d’agent intégrés sur les modèles OpenAI passent par défaut par le runtime natif du serveur d’application Codex ; l’authentification directe par clé d’API OpenAI reste disponible pour les surfaces OpenAI hors agent, comme les images, les embeddings, la parole et le temps réel.

- **Modèles d’agent** - modèles `openai/*` via le runtime Codex ; connectez-vous avec l’authentification `openai-codex` pour utiliser un abonnement ChatGPT/Codex, ou configurez un profil de clé d’API `openai-codex` lorsque vous voulez intentionnellement une authentification par clé d’API.
- **API OpenAI hors agent** - accès direct à OpenAI Platform avec facturation à l’usage via `OPENAI_API_KEY` ou l’onboarding par clé d’API OpenAI.
- **Configuration héritée** - les références de modèle `openai-codex/*` sont réparées par `openclaw doctor --fix` vers `openai/*` avec le runtime Codex.

OpenAI prend explicitement en charge l’utilisation d’OAuth d’abonnement dans des outils et workflows externes comme OpenClaw.

Le fournisseur, le modèle, le runtime et le canal sont des couches séparées. Si ces libellés se mélangent, lisez [Runtimes d’agent](/fr/concepts/agent-runtimes) avant de modifier la configuration.

## Choix rapide

| Objectif                                             | Utiliser                                                | Notes                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Abonnement ChatGPT/Codex avec runtime Codex natif    | `openai/gpt-5.5`                                        | Configuration d’agent OpenAI par défaut. Connectez-vous avec l’authentification `openai-codex`. |
| Facturation directe par clé d’API pour les modèles d’agent | `openai/gpt-5.5` plus un profil de clé d’API `openai-codex` | Utilisez `auth.order.openai-codex` pour privilégier ce profil.        |
| Facturation directe par clé d’API via PI explicite   | `openai/gpt-5.5` plus `agentRuntime.id: "pi"`           | Sélectionnez un profil de clé d’API `openai` normal.                  |
| Dernier alias d’API ChatGPT Instant                  | `openai/chat-latest`                                    | Clé d’API directe uniquement. Alias mobile pour expérimentations, pas la valeur par défaut. |
| Authentification par abonnement ChatGPT/Codex via PI explicite | `openai/gpt-5.5` plus `agentRuntime.id: "pi"`           | Sélectionnez un profil d’authentification `openai-codex` pour la route de compatibilité. |
| Génération ou édition d’images                       | `openai/gpt-image-2`                                    | Fonctionne avec `OPENAI_API_KEY` ou OAuth OpenAI Codex.               |
| Images à arrière-plan transparent                    | `openai/gpt-image-1.5`                                  | Utilisez `outputFormat=png` ou `webp` et `openai.background=transparent`. |

## Carte de nommage

Les noms sont similaires, mais non interchangeables :

| Nom affiché                        | Couche              | Signification                                                                                    |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Préfixe de fournisseur | Route canonique des modèles OpenAI ; les tours d’agent utilisent le runtime Codex.              |
| `openai-codex`                     | Préfixe d’authentification/profil | Fournisseur de profil d’authentification OpenAI Codex OAuth/abonnement.             |
| Plugin `codex`                     | Plugin              | Plugin OpenClaw intégré qui fournit le runtime natif du serveur d’application Codex et les contrôles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime d’agent     | Force le harnais natif du serveur d’application Codex pour les tours intégrés.                   |
| `/codex ...`                       | Ensemble de commandes de chat | Lier/contrôler les fils du serveur d’application Codex depuis une conversation.           |
| `runtime: "acp", agentId: "codex"` | Route de session ACP | Chemin de repli explicite qui exécute Codex via ACP/acpx.                                       |

Cela signifie qu’une configuration peut intentionnellement contenir à la fois des références de modèle `openai/*` et des profils d’authentification `openai-codex`. `openclaw doctor --fix` réécrit les références de modèle héritées `openai-codex/*` vers la route canonique des modèles OpenAI.

<Note>
GPT-5.5 est disponible à la fois via l’accès direct par clé d’API OpenAI Platform et via les routes abonnement/OAuth. Pour l’abonnement ChatGPT/Codex avec exécution Codex native, utilisez `openai/gpt-5.5` ; une configuration de runtime non définie sélectionne désormais le harnais Codex pour les tours d’agent OpenAI. Utilisez des profils de clé d’API OpenAI uniquement lorsque vous voulez une authentification directe par clé d’API pour un modèle d’agent OpenAI.
</Note>

<Note>
Les tours de modèles d’agent OpenAI nécessitent le Plugin de serveur d’application Codex intégré. La configuration explicite du runtime PI reste disponible comme route de compatibilité opt-in. Lorsque PI est explicitement sélectionné avec un profil d’authentification `openai-codex`, OpenClaw conserve la référence publique du modèle sous la forme `openai/*` et route PI en interne via le transport hérité d’authentification Codex. Exécutez `openclaw doctor --fix` pour réparer les références de modèle `openai-codex/*` obsolètes ou les anciens épinglages de session PI qui ne proviennent pas d’une configuration de runtime explicite.
</Note>

## Couverture des fonctionnalités OpenClaw

| Capacité OpenAI          | Surface OpenClaw                                                   | Statut                                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Réponses           | Fournisseur de modèles `openai/<model>`                           | Oui                                                    |
| Modèles d’abonnement Codex | `openai/<model>` avec OAuth `openai-codex`                        | Oui                                                    |
| Références de modèle Codex héritées | `openai-codex/<model>`                                     | Réparées par doctor vers `openai/<model>`              |
| Harnais du serveur d’application Codex | `openai/<model>` avec runtime omis ou `agentRuntime.id: codex` | Oui                                               |
| Recherche web côté serveur | Outil OpenAI Responses natif                                      | Oui, lorsque la recherche web est activée et qu’aucun fournisseur n’est épinglé |
| Images                    | `image_generate`                                                  | Oui                                                    |
| Vidéos                    | `video_generate`                                                  | Oui                                                    |
| Texte vers parole         | `messages.tts.provider: "openai"` / `tts`                         | Oui                                                    |
| Parole vers texte par lot | `tools.media.audio` / compréhension des médias                    | Oui                                                    |
| Parole vers texte en streaming | Voice Call `streaming.provider: "openai"`                    | Oui                                                    |
| Voix en temps réel        | Voice Call `realtime.provider: "openai"` / Control UI Talk        | Oui                                                    |
| Embeddings                | Fournisseur d’embeddings mémoire                                  | Oui                                                    |

## Embeddings mémoire

OpenClaw peut utiliser OpenAI, ou un point de terminaison d’embeddings compatible OpenAI, pour l’indexation `memory_search` et les embeddings de requête :

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

Pour les points de terminaison compatibles OpenAI qui nécessitent des libellés d’embeddings asymétriques, définissez `queryInputType` et `documentInputType` sous `memorySearch`. OpenClaw les transmet comme champs de requête `input_type` propres au fournisseur : les embeddings de requête utilisent `queryInputType` ; les fragments de mémoire indexés et l’indexation par lot utilisent `documentInputType`. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#provider-specific-config) pour l’exemple complet.

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé d’API (OpenAI Platform)">
    **Idéal pour :** l’accès direct à l’API et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé d’API">
        Créez ou copiez une clé d’API depuis le [tableau de bord OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou transmettez directement la clé :

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

    | Référence de modèle    | Configuration du runtime    | Route                       | Authentification |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omise / `agentRuntime.id: "codex"` | Harnais du serveur d’application Codex | profil `openai-codex` |
    | `openai/gpt-5.4-mini` | omise / `agentRuntime.id: "codex"` | Harnais du serveur d’application Codex | profil `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | Runtime intégré PI      | profil `openai` ou profil `openai-codex` sélectionné |

    <Note>
    Les modèles d’agent `openai/*` utilisent le harnais du serveur d’application Codex. Pour utiliser l’authentification par clé d’API avec un modèle d’agent, créez un profil de clé d’API `openai-codex` et ordonnez-le avec `auth.order.openai-codex` ; `OPENAI_API_KEY` reste le repli direct pour les surfaces d’API OpenAI hors agent.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Pour essayer le modèle Instant actuel de ChatGPT depuis l’API OpenAI, définissez le modèle sur `openai/chat-latest` :

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` est un alias mobile. OpenAI le documente comme le dernier modèle Instant utilisé dans ChatGPT et recommande `gpt-5.5` pour l’utilisation de l’API en production ; conservez donc `openai/gpt-5.5` comme valeur par défaut stable, sauf si vous voulez explicitement le comportement de cet alias. L’alias n’accepte actuellement que la verbosité de texte `medium`, donc OpenClaw normalise les surcharges incompatibles de verbosité de texte OpenAI pour ce modèle.

    <Warning>
    OpenClaw n’expose **pas** `openai/gpt-5.3-codex-spark`. Les requêtes live à l’API OpenAI rejettent ce modèle, et le catalogue Codex actuel ne l’expose pas non plus.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex avec l’exécution native du serveur d’application Codex au lieu d’une clé d’API séparée. Le cloud Codex nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Exécuter Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez OAuth directement :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les configurations sans interface graphique ou hostiles aux callbacks, ajoutez `--device-code` pour vous connecter avec un flux de code d’appareil ChatGPT au lieu du callback navigateur localhost :

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Utiliser la route canonique des modèles OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Aucune configuration d'exécution n'est requise pour le chemin par défaut. Les tours d'agent OpenAI
        sélectionnent automatiquement l'exécution native de serveur d'application Codex, et OpenClaw
        installe ou répare le Plugin Codex intégré lorsque cette route est choisie.
      </Step>
      <Step title="Vérifier que l'authentification Codex est disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Une fois le Gateway en cours d'exécution, envoyez `/codex status` ou `/codex models`
        dans le chat pour vérifier l'exécution native de serveur d'application.
      </Step>
    </Steps>

    ### Résumé des routes

    | Réf. de modèle | Configuration d'exécution | Route | Authentification |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omise / `agentRuntime.id: "codex"` | Harnais natif de serveur d'application Codex | Connexion Codex ou profil `openai-codex` sélectionné |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | Exécution intégrée PI avec transport interne d'authentification Codex | Profil `openai-codex` sélectionné |
    | `openai-codex/gpt-5.5` | réparée par doctor | Route héritée réécrite vers `openai/gpt-5.5` | Profil `openai-codex` existant |

    <Warning>
    Ne configurez pas les anciennes références de modèles `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ou
    `openai-codex/gpt-5.3*`. Les comptes OAuth ChatGPT/Codex rejettent maintenant
    ces modèles. Utilisez `openai/gpt-5.5`; les tours d'agent OpenAI sélectionnent maintenant l'exécution Codex
    par défaut.
    </Warning>

    <Note>
    Continuez à utiliser l'id de fournisseur `openai-codex` pour les commandes d'authentification/profil. Le
    préfixe de modèle `openai-codex/*` est une configuration héritée réparée par doctor. Pour la
    configuration courante avec abonnement et exécution native, connectez-vous avec `openai-codex`
    mais gardez la référence de modèle `openai/gpt-5.5`.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    <Note>
    L'intégration initiale n'importe plus de matériel OAuth depuis `~/.codex`. Connectez-vous avec OAuth dans le navigateur (par défaut) ou avec le flux par code d'appareil ci-dessus — OpenClaw gère les identifiants obtenus dans son propre magasin d'authentification d'agents.
    </Note>

    ### Vérifier et récupérer le routage OAuth Codex

    Utilisez ces commandes pour voir quel modèle, quelle exécution et quelle route d'authentification votre agent
    par défaut utilise :

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Pour un agent spécifique, ajoutez `--agent <id>` :

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Si une ancienne configuration contient encore `openai-codex/gpt-*` ou un épinglage de session OpenAI PI
    obsolète sans configuration d'exécution explicite, réparez-la :

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Si `models auth list --provider openai-codex` n'affiche aucun profil utilisable, reconnectez-vous :

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` reste l'id de fournisseur d'authentification/profil. `openai/*` est la
    route de modèle pour les tours d'agent OpenAI via Codex.

    ### Indicateur d'état

    Le chat `/status` montre quelle exécution de modèle est active pour la session actuelle.
    Le harnais de serveur d'application Codex intégré apparaît comme `Runtime: OpenAI Codex` pour
    les tours de modèle d'agent OpenAI. Les épinglages de session PI obsolètes sont réparés vers Codex, sauf si
    la configuration épingle explicitement PI.

    ### Avertissement de doctor

    Si des routes `openai-codex/*` ou des épinglages OpenAI PI obsolètes restent dans la configuration ou
    l'état de session, `openclaw doctor --fix` les réécrit vers `openai/*` avec l'exécution
    Codex, sauf si PI est explicitement configuré.

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées de modèle et la limite de contexte d'exécution comme des valeurs distinctes.

    Pour `openai/gpt-5.5` via le catalogue OAuth Codex :

    - `contextWindow` natif : `1000000`
    - Limite `contextTokens` d'exécution par défaut : `272000`

    La limite par défaut plus petite offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-la avec `contextTokens` :

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
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte d'exécution.
    </Note>

    ### Récupération du catalogue

    OpenClaw utilise les métadonnées du catalogue Codex amont pour `gpt-5.5` lorsqu'elles sont
    présentes. Si la découverte Codex en direct omet la ligne `gpt-5.5` alors que
    le compte est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que
    les exécutions cron, de sous-agent et de modèle par défaut configuré n'échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Authentification native du serveur d'application Codex

Le harnais natif de serveur d'application Codex utilise des références de modèle `openai/*` plus une configuration
d'exécution omise ou `agentRuntime.id: "codex"`, mais son authentification reste
fondée sur le compte. OpenClaw
sélectionne l'authentification dans cet ordre :

1. Un profil d'authentification OpenClaw `openai-codex` explicite lié à l'agent.
2. Le compte existant du serveur d'application, comme une connexion ChatGPT locale avec la CLI Codex.
3. Pour les lancements locaux de serveur d'application stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsque le serveur d'application ne signale aucun compte et nécessite toujours
   une authentification OpenAI.

Cela signifie qu'une connexion locale avec abonnement ChatGPT/Codex n'est pas remplacée simplement
parce que le processus Gateway dispose aussi de `OPENAI_API_KEY` pour les modèles OpenAI directs
ou les embeddings. Le repli par clé API d'environnement n'est que le chemin local stdio sans compte ; elle
n'est pas envoyée aux connexions WebSocket du serveur d'application. Lorsqu'un profil Codex
de type abonnement est sélectionné, OpenClaw garde aussi `CODEX_API_KEY` et `OPENAI_API_KEY`
hors du processus enfant stdio de serveur d'application lancé et envoie les identifiants sélectionnés
via le RPC de connexion du serveur d'application.

## Génération d'images

Le Plugin `openai` intégré enregistre la génération d'images via l'outil `image_generate`.
Il prend en charge à la fois la génération d'images avec clé API OpenAI et la génération d'images
avec OAuth Codex via la même référence de modèle `openai/gpt-image-2`.

| Capacité                  | Clé API OpenAI                    | OAuth Codex                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Réf. de modèle            | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentification          | `OPENAI_API_KEY`                   | Connexion OAuth OpenAI Codex         |
| Transport                 | API OpenAI Images                  | Backend Codex Responses              |
| Nombre max. d'images par requête | 4                            | 4                                    |
| Mode édition              | Activé (jusqu'à 5 images de référence) | Activé (jusqu'à 5 images de référence) |
| Remplacements de taille   | Pris en charge, y compris les tailles 2K/4K | Pris en charge, y compris les tailles 2K/4K |
| Format d'image / résolution | Non transmis à l'API OpenAI Images | Mappé vers une taille prise en charge lorsque c'est sûr |

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
Consultez [Génération d'images](/fr/tools/image-generation) pour les paramètres d'outil partagés, la sélection du fournisseur et le comportement de bascule.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération texte-vers-image OpenAI comme pour l'édition
d'images. `gpt-image-1.5`, `gpt-image-1` et `gpt-image-1-mini` restent utilisables comme
remplacements explicites de modèle. Utilisez `openai/gpt-image-1.5` pour une sortie
PNG/WebP à arrière-plan transparent ; l'API `gpt-image-2` actuelle rejette
`background: "transparent"`.

Pour une requête d'arrière-plan transparent, les agents doivent appeler `image_generate` avec
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, et
`background: "transparent"` ; l'ancienne option de fournisseur `openai.background` est
toujours acceptée. OpenClaw protège aussi les routes OAuth OpenAI public et
OpenAI Codex en réécrivant les requêtes transparentes `openai/gpt-image-2` par défaut
vers `gpt-image-1.5` ; Azure et les endpoints personnalisés compatibles OpenAI conservent
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
`openclaw infer image edit` lorsque vous partez d'un fichier d'entrée.
`--openai-background` reste disponible comme alias spécifique à OpenAI.

Pour les installations OAuth Codex, conservez la même référence `openai/gpt-image-2`. Lorsqu'un
profil OAuth `openai-codex` est configuré, OpenClaw résout ce jeton d'accès OAuth
stocké et envoie les requêtes d'image via le backend Codex Responses. Il
n'essaie pas d'abord `OPENAI_API_KEY` et ne bascule pas silencieusement vers une clé API pour cette
requête. Configurez explicitement `models.providers.openai` avec une clé API,
une URL de base personnalisée ou un endpoint Azure lorsque vous voulez la route directe de l'API OpenAI Images
à la place.
Si cet endpoint d'image personnalisé se trouve sur un LAN/adresse privée de confiance, définissez aussi
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw garde
les endpoints d'image privés/internes compatibles OpenAI bloqués sauf si cette adhésion explicite est
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

Le Plugin `openai` intégré enregistre la génération de vidéos via l'outil `video_generate`.

| Capacité          | Valeur                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2`                                                                   |
| Modes            | Texte-vers-vidéo, image-vers-vidéo, édition d'une seule vidéo                     |
| Entrées de référence | 1 image ou 1 vidéo                                                            |
| Remplacements de taille | Pris en charge                                                            |
| Autres remplacements | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement d'outil |

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
Consultez [Génération de vidéos](/fr/tools/video-generation) pour les paramètres d'outil partagés, la sélection du fournisseur et le comportement de bascule.
</Note>

## Contribution de prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 sur l'ensemble des fournisseurs. Elle s'applique par id de modèle, donc `openai/gpt-5.5`, les références héritées avant réparation comme `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` et les autres références compatibles GPT-5 reçoivent la même couche. Les anciens modèles GPT-4.x ne la reçoivent pas.

Le harnais Codex natif intégré utilise le même comportement GPT-5 et la même couche Heartbeat via les instructions développeur du serveur d'application Codex, de sorte que les sessions `openai/gpt-5.x` forcées via `agentRuntime.id: "codex"` conservent les mêmes consignes de suivi et de Heartbeat proactif, même si Codex possède le reste du prompt du harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de persona, la sécurité d’exécution, la discipline des outils, la forme de sortie, les vérifications d’achèvement et la vérification. Le comportement de réponse propre au canal et de message silencieux reste dans le prompt système partagé d’OpenClaw et la politique de livraison sortante. Les consignes GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d’interaction amicale est séparée et configurable.

| Valeur                 | Effet                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (par défaut) | Active la couche de style d’interaction amicale |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Désactive uniquement la couche de style amical |

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
Les valeurs ne tiennent pas compte de la casse à l’exécution, donc `"Off"` et `"off"` désactivent toutes deux la couche de style amical.
</Tip>

<Note>
L’ancien `plugins.entries.openai.config.personality` est toujours lu comme solution de compatibilité de repli lorsque le paramètre partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Le Plugin `openai` inclus enregistre la synthèse vocale pour la surface `messages.tts`.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Se replie sur `OPENAI_API_KEY` |
    | URL de base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corps supplémentaire | `messages.tts.providers.openai.extraBody` / `extra_body` | (non défini) |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` est fusionné dans le JSON de requête `/audio/speech` après les champs générés par OpenClaw ; utilisez-le donc pour les points de terminaison compatibles OpenAI qui exigent des clés supplémentaires comme `lang`. Les clés de prototype sont ignorées.

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
    Définissez `OPENAI_TTS_BASE_URL` pour remplacer l’URL de base TTS sans affecter le point de terminaison de l’API de chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Le Plugin `openai` inclus enregistre la conversion parole-texte par lots via
    la surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : REST OpenAI `/v1/audio/transcriptions`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de salons vocaux Discord et les
      pièces jointes audio des canaux

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
    configuration média audio partagée ou par la requête de transcription propre à l’appel.

  </Accordion>

  <Accordion title="Realtime transcription">
    Le Plugin `openai` inclus enregistre la transcription en temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée du silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Se replie sur `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket vers `wss://api.openai.com/v1/realtime` avec de l’audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming est destiné au chemin de transcription en temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise plutôt le chemin de transcription par lots `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Le Plugin `openai` inclus enregistre la voix en temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Valeur par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée du silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Se replie sur `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment` pour les ponts temps réel du backend. Prend en charge les appels d’outils bidirectionnels. Utilise le format audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk utilise des sessions temps réel OpenAI dans le navigateur avec un secret client éphémère
    émis par le Gateway et un échange SDP WebRTC direct du navigateur avec l’API
    OpenAI Realtime. La vérification en direct par les mainteneurs est disponible avec
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ;
    le segment OpenAI émet un secret client dans Node, génère une offre SDP de navigateur
    avec un faux média de microphone, l’envoie à OpenAI et applique la réponse SDP
    sans journaliser de secrets.
    </Note>

  </Accordion>
</AccordionGroup>

## Points de terminaison Azure OpenAI

Le fournisseur `openai` inclus peut cibler une ressource Azure OpenAI pour la génération
d’images en remplaçant l’URL de base. Sur le chemin de génération d’images, OpenClaw
détecte les noms d’hôte Azure sur `models.providers.openai.baseUrl` et bascule
automatiquement vers la forme de requête Azure.

<Note>
La voix en temps réel utilise un chemin de configuration séparé
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n’est pas affectée par `models.providers.openai.baseUrl`. Consultez l’accordéon **Voix
en temps réel** sous [Voix et parole](#voice-and-speech) pour ses paramètres
Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- Vous avez déjà un abonnement Azure OpenAI, un quota ou un contrat entreprise
- Vous avez besoin de la résidence régionale des données ou des contrôles de conformité fournis par Azure
- Vous voulez garder le trafic dans une location Azure existante

### Configuration

Pour la génération d’images Azure via le fournisseur `openai` inclus, pointez
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (pas une clé OpenAI Platform) :

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
- Utilise un délai d’expiration par défaut de 600 s pour les appels de génération d’images Azure.
  Les valeurs `timeoutMs` propres à l’appel remplacent toujours cette valeur par défaut.

Les autres URL de base (OpenAI public, proxys compatibles OpenAI) conservent la forme
standard des requêtes d’image OpenAI.

<Note>
Le routage Azure pour le chemin de génération d’images du fournisseur `openai` exige
OpenClaw 2026.4.22 ou version ultérieure. Les versions antérieures traitent tout
`openai.baseUrl` personnalisé comme le point de terminaison OpenAI public et échoueront avec les déploiements
d’images Azure.
</Note>

### Version d’API

Définissez `AZURE_OPENAI_API_VERSION` pour épingler une version Azure preview ou GA spécifique
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèles sont des noms de déploiements

Azure OpenAI lie les modèles aux déploiements. Pour les requêtes de génération d’images Azure
routées via le fournisseur `openai` inclus, le champ `model` dans OpenClaw
doit être le **nom de déploiement Azure** que vous avez configuré dans le portail Azure, et non
l’identifiant du modèle OpenAI public.

Si vous créez un déploiement appelé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La même règle de nom de déploiement s’applique aux appels de génération d’images routés via
le fournisseur `openai` inclus.

### Disponibilité régionale

La génération d’images Azure est actuellement disponible uniquement dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consultez la liste actuelle des régions Microsoft avant de créer un
déploiement, et confirmez que le modèle spécifique est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut rejeter des options qu’OpenAI public autorise (par exemple certaines
valeurs `background` sur `gpt-image-2`) ou les exposer uniquement sur certaines versions
de modèle. Ces différences viennent d’Azure et du modèle sous-jacent, pas
d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez le
jeu de paramètres pris en charge par votre déploiement et votre version d’API spécifiques dans le
portail Azure.

<Note>
Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas
les en-têtes d’attribution masqués d’OpenClaw — consultez l’accordéon **Routes natives ou compatibles OpenAI**
sous [Configuration avancée](#advanced-configuration).

Pour le trafic de chat ou Responses sur Azure (au-delà de la génération d’images), utilisez le
flux d’intégration ou une configuration de fournisseur Azure dédiée — `openai.baseUrl` seul
n’adopte pas la forme API/auth d’Azure. Un fournisseur
`azure-openai-responses/*` distinct existe ; consultez
l’accordéon Compaction côté serveur ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise d’abord WebSocket avec repli SSE (`"auto"`) pour `openai/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie un échec WebSocket précoce une fois avant de se replier sur SSE
    - Après un échec, marque WebSocket comme dégradé pendant environ 60 secondes et utilise SSE pendant le refroidissement
    - Attache des en-têtes d’identité de session et de tour stables pour les nouvelles tentatives et reconnexions
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

    Documentation OpenAI connexe :
    - [API Realtime avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses de l’API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Préchauffage WebSocket">
    OpenClaw active le préchauffage WebSocket par défaut pour `openai/*` afin de réduire la latence du premier tour.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode rapide">
    OpenClaw expose un basculement partagé de mode rapide pour `openai/*` :

    - **Chat/IU :** `/fast status|on|off`
    - **Config :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw associe le mode rapide au traitement prioritaire d’OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont conservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

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
    Les remplacements de session prévalent sur la configuration. Effacer le remplacement de session dans l’IU Sessions rétablit la valeur par défaut configurée pour la session.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L’API d’OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

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
    `serviceTier` est transmis uniquement aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous routez l’un ou l’autre fournisseur via un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), l’enveloppe de flux Pi-harness du Plugin OpenAI active automatiquement la compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu’il est indisponible)

    Cela s’applique au chemin Pi harness intégré et aux hooks de fournisseur OpenAI utilisés par les exécutions intégrées. Le harness natif du serveur d’application Codex gère son propre contexte via Codex et se configure séparément avec `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` contrôle uniquement l’injection de `context_management`. Les modèles OpenAI Responses directs forcent toujours `store: true`, sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT strictement agentique">
    Pour les exécutions de la famille GPT-5 sur `openai/*`, OpenClaw peut utiliser un contrat d’exécution intégré plus strict :

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Avec `strict-agentic`, OpenClaw :
    - Ne considère plus un tour limité à un plan comme une progression réussie lorsqu’une action d’outil est disponible
    - Réessaie le tour avec une orientation pour agir immédiatement
    - Active automatiquement `update_plan` pour les travaux substantiels
    - Affiche un état bloqué explicite si le modèle continue à planifier sans agir

    <Note>
    Limité aux exécutions des familles GPT-5 d’OpenAI et de Codex uniquement. Les autres fournisseurs et les anciennes familles de modèles conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives et compatibles OpenAI">
    OpenClaw traite différemment les points de terminaison OpenAI directs, Codex et Azure OpenAI par rapport aux proxys `/v1` génériques compatibles OpenAI :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l’effort `none` d’OpenAI
    - Omettent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - Utilisent par défaut le mode strict pour les schémas d’outils
    - Joignent des en-têtes d’attribution masqués uniquement sur les hôtes natifs vérifiés
    - Conservent la mise en forme des requêtes propre à OpenAI (`service_tier`, `store`, compatibilité du raisonnement, indications de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Retirent `store` de Completions des charges utiles `openai-completions` non natives
    - Acceptent le JSON de transmission avancée `params.extra_body`/`params.extraBody` pour les proxys Completions compatibles OpenAI
    - Acceptent `params.chat_template_kwargs` pour les proxys Completions compatibles OpenAI comme vLLM
    - Ne forcent pas les schémas d’outils stricts ni les en-têtes réservés aux routes natives

    Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas les en-têtes d’attribution masqués.

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres d’outil d’image partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres d’outil vidéo partagés et sélection du fournisseur.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
