---
read_when:
    - Vous souhaitez utiliser des modèles OpenAI dans OpenClaw
    - Vous souhaitez une authentification par abonnement Codex plutôt que par clés API
    - Vous avez besoin d’un comportement d’exécution d’agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:37:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI fournit des API développeur pour les modèles GPT, et Codex est également disponible comme agent de codage du plan ChatGPT via les clients Codex d’OpenAI. OpenClaw garde ces surfaces séparées afin que la configuration reste prévisible.

  OpenClaw prend en charge trois routes de la famille OpenAI. Le préfixe du modèle sélectionne la route de fournisseur/authentification ; un paramètre d’exécution distinct sélectionne qui exécute la boucle d’agent intégrée :

  - **Clé API** — accès direct à la plateforme OpenAI avec facturation à l’usage (modèles `openai/*`)
  - **Abonnement Codex via PI** — connexion ChatGPT/Codex avec accès par abonnement (modèles `openai-codex/*`)
  - **Harness app-server Codex** — exécution native de l’app-server Codex (modèles `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)

  OpenAI prend explicitement en charge l’utilisation d’OAuth par abonnement dans des outils et workflows externes comme OpenClaw.

  Le fournisseur, le modèle, le runtime et le canal sont des couches distinctes. Si ces libellés commencent à être confondus, consultez [Runtimes d’agent](/fr/concepts/agent-runtimes) avant de modifier la configuration.

  ## Choix rapide

  | Objectif                                      | Utiliser                                         | Notes                                                                        |
  | --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
  | Facturation directe par clé API               | `openai/gpt-5.5`                                 | Définissez `OPENAI_API_KEY` ou exécutez l’onboarding de la clé API OpenAI.   |
  | GPT-5.5 avec authentification par abonnement ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Route PI par défaut pour OAuth Codex. Meilleur premier choix pour les configurations par abonnement. |
  | GPT-5.5 avec comportement natif de l’app-server Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Force le harness app-server Codex pour cette référence de modèle.            |
  | Génération ou édition d’images                | `openai/gpt-image-2`                             | Fonctionne avec `OPENAI_API_KEY` ou OAuth OpenAI Codex.                      |
  | Images avec arrière-plan transparent          | `openai/gpt-image-1.5`                           | Utilisez `outputFormat=png` ou `webp` et `openai.background=transparent`.    |

  ## Carte des noms

  Les noms se ressemblent, mais ne sont pas interchangeables :

  | Nom affiché                         | Couche            | Signification                                                                                     |
  | ----------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
  | `openai`                            | Préfixe de fournisseur | Route directe vers l’API de la plateforme OpenAI.                                             |
  | `openai-codex`                      | Préfixe de fournisseur | Route OAuth/abonnement OpenAI Codex via le runner PI normal d’OpenClaw.                        |
  | plugin `codex`                      | Plugin            | Plugin OpenClaw intégré qui fournit le runtime natif app-server Codex et les contrôles de chat `/codex`. |
  | `agentRuntime.id: codex`            | Runtime d’agent   | Force le harness natif app-server Codex pour les tours intégrés.                                 |
  | `/codex ...`                        | Ensemble de commandes de chat | Associer/contrôler les threads app-server Codex depuis une conversation.              |
  | `runtime: "acp", agentId: "codex"`  | Route de session ACP | Chemin de repli explicite qui exécute Codex via ACP/acpx.                                    |

  Cela signifie qu’une configuration peut intentionnellement contenir à la fois `openai-codex/*` et le plugin `codex`. C’est valide si vous voulez OAuth Codex via PI tout en voulant aussi disposer des contrôles de chat natifs `/codex`. `openclaw doctor` avertit de cette combinaison afin que vous puissiez confirmer qu’elle est intentionnelle ; il ne la réécrit pas.

  <Note>
  GPT-5.5 est disponible à la fois via un accès direct à l’API de la plateforme OpenAI par clé API et via des routes abonnement/OAuth. Utilisez `openai/gpt-5.5` pour le trafic direct `OPENAI_API_KEY`, `openai-codex/gpt-5.5` pour OAuth Codex via PI, ou `openai/gpt-5.5` avec `agentRuntime.id: "codex"` pour le harness natif app-server Codex.
  </Note>

  <Note>
  Activer le plugin OpenAI, ou sélectionner un modèle `openai-codex/*`, n’active pas le plugin intégré app-server Codex. OpenClaw active ce plugin uniquement lorsque vous sélectionnez explicitement le harness natif Codex avec `agentRuntime.id: "codex"` ou utilisez une ancienne référence de modèle `codex/*`.
  Si le plugin intégré `codex` est activé mais que `openai-codex/*` se résout toujours via PI, `openclaw doctor` avertit et laisse la route inchangée.
  </Note>

  ## Couverture des fonctionnalités OpenClaw

  | Fonctionnalité OpenAI       | Surface OpenClaw                                           | Statut                                                 |
  | --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses            | Fournisseur de modèle `openai/<model>`                     | Oui                                                    |
  | Modèles d’abonnement Codex  | `openai-codex/<model>` avec OAuth `openai-codex`           | Oui                                                    |
  | Harness app-server Codex    | `openai/<model>` avec `agentRuntime.id: codex`             | Oui                                                    |
  | Recherche web côté serveur  | Outil natif OpenAI Responses                               | Oui, lorsque la recherche web est activée et qu’aucun fournisseur n’est épinglé |
  | Images                      | `image_generate`                                           | Oui                                                    |
  | Vidéos                      | `video_generate`                                           | Oui                                                    |
  | Synthèse vocale             | `messages.tts.provider: "openai"` / `tts`                  | Oui                                                    |
  | Transcription audio par lot | `tools.media.audio` / compréhension des médias             | Oui                                                    |
  | Transcription vocale en streaming | Appel vocal `streaming.provider: "openai"`            | Oui                                                    |
  | Voix en temps réel          | Appel vocal `realtime.provider: "openai"` / Interface de contrôle Talk | Oui                                         |
  | Embeddings                  | Fournisseur d’embeddings mémoire                           | Oui                                                    |

  ## Premiers pas

  Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

  <Tabs>
  <Tab title="Clé API (plateforme OpenAI)">
    **Idéal pour :** l’accès direct à l’API et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord de la plateforme OpenAI](https://platform.openai.com/api-keys).
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

    | Référence de modèle     | Configuration du runtime       | Route                       | Authentification |
    | ----------------------- | ------------------------------ | --------------------------- | ---------------- |
    | `openai/gpt-5.5`        | omis / `agentRuntime.id: "pi"` | API directe de la plateforme OpenAI | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`   | omis / `agentRuntime.id: "pi"` | API directe de la plateforme OpenAI | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`        | `agentRuntime.id: "codex"`     | Harness app-server Codex    | App-server Codex |

    <Note>
    `openai/*` est la route directe par clé API OpenAI, sauf si vous forcez explicitement le harness app-server Codex. Utilisez `openai-codex/*` pour OAuth Codex via le runner PI par défaut, ou utilisez `openai/gpt-5.5` avec `agentRuntime.id: "codex"` pour l’exécution native de l’app-server Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw n’expose **pas** `openai/gpt-5.3-codex-spark`. Les requêtes API OpenAI en direct rejettent ce modèle, et le catalogue Codex actuel ne l’expose pas non plus.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex au lieu d’une clé API distincte. Le cloud Codex nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Exécuter OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez directement OAuth :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les configurations headless ou hostiles au callback, ajoutez `--device-code` pour vous connecter avec un flux de code d’appareil ChatGPT au lieu du callback navigateur localhost :

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Définir le modèle par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Résumé des routes

    | Référence de modèle | Configuration du runtime | Route | Authentification |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omis / `runtime: "pi"` | OAuth ChatGPT/Codex via PI | Connexion Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Toujours PI, sauf si un plugin revendique explicitement `openai-codex` | Connexion Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness app-server Codex | Auth app-server Codex |

    <Note>
    Continuez à utiliser l’identifiant de fournisseur `openai-codex` pour les commandes d’authentification/profil. Le préfixe de modèle `openai-codex/*` est aussi la route PI explicite pour OAuth Codex.
    Il ne sélectionne pas et n’active pas automatiquement le harness intégré app-server Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L’onboarding n’importe plus le matériel OAuth depuis `~/.codex`. Connectez-vous avec OAuth navigateur (par défaut) ou le flux de code d’appareil ci-dessus — OpenClaw gère les identifiants obtenus dans son propre magasin d’authentification d’agent.
    </Note>

    ### Indicateur d’état

    Le chat `/status` affiche quel runtime de modèle est actif pour la session en cours.
    Le harness PI par défaut apparaît sous la forme `Runtime: OpenClaw Pi Default`. Lorsque le
    harness intégré app-server Codex est sélectionné, `/status` affiche
    `Runtime: OpenAI Codex`. Les sessions existantes conservent leur identifiant de harness enregistré ; utilisez donc
    `/new` ou `/reset` après avoir modifié `agentRuntime` si vous voulez que `/status` reflète
    un nouveau choix PI/Codex.

    ### Avertissement doctor

    Si le plugin intégré `codex` est activé alors que la route
    `openai-codex/*` de cet onglet est sélectionnée, `openclaw doctor` avertit que le modèle
    se résout toujours via PI. Conservez la configuration inchangée lorsque c’est la
    route d’authentification par abonnement voulue. Passez à `openai/<model>` plus
    `agentRuntime.id: "codex"` uniquement si vous voulez l’exécution native de l’app-server Codex.

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées du modèle et la limite de contexte du runtime comme des valeurs distinctes.

    Pour `openai-codex/gpt-5.5` via OAuth Codex :

    - `contextWindow` natif : `1000000`
    - Limite `contextTokens` du runtime par défaut : `272000`

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
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte du runtime.
    </Note>

    ### Récupération du catalogue

    OpenClaw utilise les métadonnées du catalogue Codex amont pour `gpt-5.5` lorsqu’elles sont
    présentes. Si la découverte Codex en direct omet la ligne `openai-codex/gpt-5.5` alors que
    le compte est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que les exécutions
    Cron, sous-agent et modèle par défaut configuré n’échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Génération d’images

Le plugin intégré `openai` enregistre la génération d’images via l’outil `image_generate`.
Il prend en charge à la fois la génération d’images OpenAI par clé API et la
génération d’images par OAuth Codex via la même référence de modèle `openai/gpt-image-2`.

| Capacité                 | Clé API OpenAI                      | OAuth Codex                          |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| Référence de modèle      | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Authentification         | `OPENAI_API_KEY`                    | Connexion OAuth OpenAI Codex         |
| Transport                | API Images OpenAI                   | Backend Codex Responses              |
| Nombre max d’images par requête | 4                           | 4                                    |
| Mode édition             | Activé (jusqu’à 5 images de référence) | Activé (jusqu’à 5 images de référence) |
| Remplacements de taille  | Pris en charge, y compris les tailles 2K/4K | Pris en charge, y compris les tailles 2K/4K |
| Ratio d’aspect / résolution | Non transmis à l’API Images OpenAI | Mappé vers une taille prise en charge lorsque c’est sûr |

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
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération d’images à partir de texte OpenAI et l’édition d’images. `gpt-image-1.5`, `gpt-image-1` et `gpt-image-1-mini` restent utilisables comme remplacements explicites de modèle. Utilisez `openai/gpt-image-1.5` pour une sortie PNG/WebP à arrière-plan transparent ; l’API actuelle `gpt-image-2` rejette
`background: "transparent"`.

Pour une requête avec arrière-plan transparent, les agents doivent appeler `image_generate` avec
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, et
`background: "transparent"` ; l’option de fournisseur plus ancienne `openai.background` est
toujours acceptée. OpenClaw protège également les routes publiques OpenAI et
OpenAI Codex OAuth en réécrivant les requêtes transparentes par défaut `openai/gpt-image-2`
vers `gpt-image-1.5` ; Azure et les points de terminaison OpenAI-compatibles personnalisés conservent
leurs noms de déploiement/modèle configurés.

Le même paramètre est exposé pour les exécutions CLI headless :

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Utilisez les mêmes drapeaux `--output-format` et `--background` avec
`openclaw infer image edit` lorsque vous partez d’un fichier d’entrée.
`--openai-background` reste disponible comme alias spécifique à OpenAI.

Pour les installations OAuth Codex, conservez la même référence `openai/gpt-image-2`. Lorsqu’un
profil OAuth `openai-codex` est configuré, OpenClaw résout ce jeton d’accès OAuth stocké
et envoie les requêtes d’image via le backend Codex Responses. Il
n’essaie pas d’abord `OPENAI_API_KEY` et ne bascule pas silencieusement vers une clé API pour cette
requête. Configurez explicitement `models.providers.openai` avec une clé API,
une URL de base personnalisée ou un point de terminaison Azure lorsque vous voulez plutôt la route directe de l’API Images OpenAI.
Si ce point de terminaison d’image personnalisé se trouve sur un LAN de confiance ou une adresse privée, définissez également
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw garde
les points de terminaison d’image OpenAI-compatibles privés/internes bloqués à moins que cette option explicite
ne soit présente.

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

Le plugin intégré `openai` enregistre la génération de vidéos via l’outil `video_generate`.

| Capacité                | Valeur                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut       | `openai/sora-2`                                                                   |
| Modes                   | Texte vers vidéo, image vers vidéo, édition d’une seule vidéo                    |
| Entrées de référence    | 1 image ou 1 vidéo                                                                |
| Remplacements de taille | Pris en charge                                                                    |
| Autres remplacements    | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement de l’outil |

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
Consultez [Génération de vidéos](/fr/tools/video-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Contribution de prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 sur l’ensemble des fournisseurs. Elle s’applique par identifiant de modèle, donc `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` et d’autres références GPT-5 compatibles reçoivent la même surcouche. Les anciens modèles GPT-4.x ne la reçoivent pas.

Le harness natif Codex intégré utilise le même comportement GPT-5 et la même surcouche Heartbeat via les instructions développeur de l’app-server Codex, de sorte que les sessions `openai/gpt-5.x` forcées via `agentRuntime.id: "codex"` conservent le même suivi d’exécution et les mêmes indications proactives Heartbeat, même si Codex gère le reste du prompt du harness.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de la persona, la sécurité d’exécution, la discipline d’utilisation des outils, la forme de sortie, les vérifications d’achèvement et la validation. Le comportement spécifique au canal pour les réponses et les messages silencieux reste dans le prompt système partagé d’OpenClaw et la politique d’envoi sortant. Les indications GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d’interaction conviviale est distincte et configurable.

| Valeur                 | Effet                                         |
| ---------------------- | --------------------------------------------- |
| `"friendly"` (par défaut) | Active la couche de style d’interaction conviviale |
| `"on"`                 | Alias de `"friendly"`                         |
| `"off"`                | Désactive uniquement la couche de style conviviale |

<Tabs>
  <Tab title="Configuration">
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
Les valeurs ne sont pas sensibles à la casse à l’exécution, donc `"Off"` et `"off"` désactivent tous deux la couche de style conviviale.
</Tip>

<Note>
L’ancien réglage `plugins.entries.openai.config.personality` est toujours lu comme solution de repli de compatibilité lorsque le réglage partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le plugin intégré `openai` enregistre la synthèse vocale pour la surface `messages.tts`.

    | Réglage | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Utilise `OPENAI_API_KEY` comme solution de repli |
    | URL de base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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

  <Accordion title="Transcription audio">
    Le plugin intégré `openai` enregistre la transcription audio par lot via
    la surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : OpenAI REST `/v1/audio/transcriptions`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de canal vocal Discord et les
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
    configuration média audio partagée ou par la requête de transcription propre à l’appel.

  </Accordion>

  <Accordion title="Transcription en temps réel">
    Le plugin intégré `openai` enregistre la transcription en temps réel pour le plugin Voice Call.

    | Réglage | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée du silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Utilise `OPENAI_API_KEY` comme solution de repli |

    <Note>
    Utilise une connexion WebSocket à `wss://api.openai.com/v1/realtime` avec l’audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming est destiné au chemin de transcription en temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise à la place le chemin de transcription par lot `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel">
    Le plugin intégré `openai` enregistre la voix en temps réel pour le plugin Voice Call.

    | Réglage | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée du silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Utilise `OPENAI_API_KEY` comme solution de repli |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment`. Prend en charge l’appel d’outils bidirectionnel. Utilise le format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Points de terminaison Azure OpenAI

Le fournisseur `openai` intégré peut cibler une ressource Azure OpenAI pour la génération
d’images en remplaçant l’URL de base. Sur le chemin de génération d’images, OpenClaw
détecte les noms d’hôte Azure sur `models.providers.openai.baseUrl` et bascule automatiquement vers la forme de requête d’Azure.

<Note>
La voix en temps réel utilise un chemin de configuration distinct
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n’est pas affectée par `models.providers.openai.baseUrl`. Consultez l’accordéon **Voix en temps réel** sous [Voix et parole](#voice-and-speech) pour ses paramètres Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- Vous disposez déjà d’un abonnement, d’un quota ou d’un contrat d’entreprise Azure OpenAI
- Vous avez besoin des contrôles de résidence des données ou de conformité fournis par Azure
- Vous souhaitez conserver le trafic dans un tenant Azure existant

### Configuration

Pour la génération d’images Azure via le fournisseur `openai` intégré, pointez
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (et non une clé de la plateforme OpenAI) :

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

OpenClaw reconnaît ces suffixes d’hôte Azure pour la route Azure de génération d’images :

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Pour les requêtes de génération d’images sur un hôte Azure reconnu, OpenClaw :

- Envoie l’en-tête `api-key` au lieu de `Authorization: Bearer`
- Utilise des chemins ciblés par déploiement (`/openai/deployments/{deployment}/...`)
- Ajoute `?api-version=...` à chaque requête
- Utilise un délai d’expiration par défaut de 600 s pour les appels Azure de génération d’images.
  Les valeurs `timeoutMs` par appel remplacent toujours cette valeur par défaut.

Les autres URL de base (OpenAI public, proxys OpenAI-compatibles) conservent la forme
standard des requêtes d’image OpenAI.

<Note>
Le routage Azure pour le chemin de génération d’images du fournisseur `openai`
nécessite OpenClaw 2026.4.22 ou une version ultérieure. Les versions antérieures traitent tout
`openai.baseUrl` personnalisé comme le point de terminaison public OpenAI et échouent face aux déploiements
d’images Azure.
</Note>

### Version d’API

Définissez `AZURE_OPENAI_API_VERSION` pour épingler une version preview ou GA Azure spécifique
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèle sont des noms de déploiement

Azure OpenAI associe les modèles à des déploiements. Pour les requêtes Azure de génération d’images
routées via le fournisseur `openai` intégré, le champ `model` dans OpenClaw
doit être le **nom de déploiement Azure** que vous avez configuré dans le portail Azure, et non
l’identifiant public du modèle OpenAI.

Si vous créez un déploiement appelé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La même règle de nom de déploiement s’applique aux appels de génération d’images routés via
le fournisseur `openai` intégré.

### Disponibilité régionale

La génération d’images Azure n’est actuellement disponible que dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Vérifiez la liste actuelle des régions de Microsoft avant de créer un
déploiement, et confirmez que le modèle spécifique est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut rejeter des options qu’OpenAI public autorise (par exemple certaines
valeurs `background` sur `gpt-image-2`) ou ne les exposer que sur des versions de modèle spécifiques. Ces différences proviennent d’Azure et du modèle sous-jacent, pas
d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez l’ensemble
de paramètres pris en charge par votre déploiement et votre version d’API spécifiques dans le
portail Azure.

<Note>
Azure OpenAI utilise le transport natif et le comportement de compatibilité natif, mais ne reçoit pas
les en-têtes d’attribution masqués d’OpenClaw — consultez l’accordéon **Routes natives vs OpenAI-compatibles**
sous [Configuration avancée](#advanced-configuration).

Pour le trafic chat ou Responses sur Azure (au-delà de la génération d’images), utilisez le
flux d’onboarding ou une configuration de fournisseur Azure dédiée — `openai.baseUrl` seul ne
reprend pas la forme d’API/authentification Azure. Un fournisseur distinct
`azure-openai-responses/*` existe ; consultez
l’accordéon Compaction côté serveur ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise WebSocket en priorité avec repli SSE (`"auto"`) pour `openai/*` comme pour `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie un échec WebSocket précoce avant de basculer vers SSE
    - Après un échec, marque WebSocket comme dégradé pendant ~60 secondes et utilise SSE pendant le temps de refroidissement
    - Attache des en-têtes stables d’identité de session et de tour pour les nouvelles tentatives et reconnexions
    - Normalise les compteurs d’usage (`input_tokens` / `prompt_tokens`) entre les variantes de transport

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
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentation OpenAI associée :
    - [API Realtime avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Préinitialisation WebSocket">
    OpenClaw active par défaut la préinitialisation WebSocket pour `openai/*` et `openai-codex/*` afin de réduire la latence du premier tour.

    ```json5
    // Désactiver la préinitialisation
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
    OpenClaw expose un basculeur de mode rapide partagé pour `openai/*` et `openai-codex/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw mappe le mode rapide au traitement prioritaire OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont conservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

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
    Les remplacements de session priment sur la configuration. Effacer le remplacement de session dans l’interface Sessions ramène la session à la valeur par défaut configurée.
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
    `serviceTier` n’est transmis qu’aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous faites passer l’un ou l’autre fournisseur par un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), l’enveloppe de flux Pi-harness du plugin OpenAI active automatiquement la Compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu’il n’est pas disponible)

    Cela s’applique au chemin Pi harness intégré et aux hooks de fournisseur OpenAI utilisés par les exécutions intégrées. Le harness natif app-server Codex gère son propre contexte via Codex et se configure séparément avec `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` contrôle uniquement l’injection de `context_management`. Les modèles OpenAI Responses directs forcent toujours `store: true` sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentique strict">
    Pour les exécutions de la famille GPT-5 sur `openai/*`, OpenClaw peut utiliser un contrat d’exécution intégrée plus strict :

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
    - Ne traite plus un tour avec plan uniquement comme une progression réussie lorsqu’une action d’outil est disponible
    - Réessaie le tour avec une instruction d’agir immédiatement
    - Active automatiquement `update_plan` pour les travaux substantiels
    - Affiche un état bloqué explicite si le modèle continue à planifier sans agir

    <Note>
    Limité à OpenAI et Codex pour les exécutions de la famille GPT-5 uniquement. Les autres fournisseurs et les anciennes familles de modèles conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives vs OpenAI-compatibles">
    OpenClaw traite différemment les points de terminaison OpenAI directs, Codex et Azure OpenAI, par rapport aux proxys `/v1` génériques OpenAI-compatibles :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l’effort OpenAI `none`
    - Omettent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - Utilisent par défaut des schémas d’outils en mode strict
    - Attachent des en-têtes d’attribution masqués uniquement sur les hôtes natifs vérifiés
    - Conservent la forme des requêtes propre à OpenAI (`service_tier`, `store`, compatibilité du raisonnement, indices de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Suppriment `store` de Completions des payloads `openai-completions` non natifs
    - Acceptent le JSON traversant avancé `params.extra_body`/`params.extraBody` pour les proxys Completions OpenAI-compatibles
    - Acceptent `params.chat_template_kwargs` pour les proxys Completions OpenAI-compatibles tels que vLLM
    - N’imposent pas de schémas d’outils stricts ni d’en-têtes natifs uniquement

    Azure OpenAI utilise le transport natif et le comportement de compatibilité natif, mais ne reçoit pas les en-têtes d’attribution masqués.

  </Accordion>
</AccordionGroup>

## Liés

<CardGroup cols={2}>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
