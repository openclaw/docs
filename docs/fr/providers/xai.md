---
read_when:
    - Vous souhaitez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou les identifiants de modèles
summary: Utiliser les modèles xAI Grok dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-16T13:46:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw fournit un plugin de fournisseur `xai` intégré pour les modèles Grok. La
méthode recommandée est Grok OAuth avec un abonnement SuperGrok ou X Premium
éligible. Le Gateway, la configuration, le routage et les outils restent locaux ; seules les requêtes
Grok sont envoyées à l’API de xAI.

OAuth ne nécessite ni clé API xAI ni application Grok Build. xAI peut néanmoins
afficher Grok Build sur l’écran de consentement, car OpenClaw utilise le client
OAuth partagé de xAI.

## Configuration

<Steps>
  <Step title="Nouvelle installation">
    Exécutez l’intégration avec l’installation du démon, puis choisissez xAI/Grok OAuth à l’étape
    du modèle/de l’authentification :

    ```bash
    openclaw onboard --install-daemon
    ```

    Sur un VPS ou via SSH, sélectionnez directement xAI OAuth ; cette méthode utilise la vérification
    par code d’appareil et ne nécessite aucun rappel localhost :

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Installation existante">
    Connectez-vous uniquement à xAI ; ne relancez pas toute l’intégration simplement pour connecter Grok :

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Définissez séparément Grok comme modèle par défaut :

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Ne relancez toute l’intégration que si vous souhaitez intentionnellement modifier le Gateway,
    le démon, le canal, l’espace de travail ou d’autres choix de configuration.

  </Step>
  <Step title="Méthode par clé API">
    La configuration par clé API fonctionne toujours pour les clés de xAI Console et pour les surfaces multimédias
    qui nécessitent une configuration de fournisseur reposant sur une clé :

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Choisir un modèle">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw utilise l’API Responses de xAI comme transport xAI intégré. Le même
identifiant provenant de `openclaw models auth login --provider xai --method oauth` ou
`--method api-key` alimente également `web_search` (identifiant du fournisseur `grok`), `x_search`,
`code_execution`, la parole/transcription ainsi que la génération d’images/vidéos par xAI. Si vous
stockez une clé xAI sous `plugins.entries.xai.config.webSearch.apiKey`, le
fournisseur de modèles xAI intégré la réutilise également comme solution de secours.
</Note>

## Dépannage d’OAuth

- Pour SSH, Docker, un VPS ou d’autres configurations distantes, utilisez
  `openclaw models auth login --provider xai --method oauth` ; cette méthode utilise
  la vérification par code d’appareil, et non un rappel localhost.
- Si la connexion réussit mais que Grok n’est pas le modèle par défaut, exécutez
  `openclaw models set xai/grok-4.3`.
- Inspectez les profils d’authentification xAI enregistrés :

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI détermine quels comptes peuvent recevoir des jetons d’API OAuth. Si un compte
  n’est pas éligible, utilisez la méthode par clé API ou vérifiez l’abonnement du côté de xAI.

<Tip>
Utilisez `xai-oauth` lors d’une connexion depuis SSH, Docker ou un VPS. OpenClaw affiche une
URL et un code court ; terminez la connexion dans n’importe quel navigateur local pendant que le
processus distant interroge xAI jusqu’à la fin de l’échange de jetons.
</Tip>

## Catalogue intégré

Identifiants sélectionnables dans les sélecteurs de modèles. Le plugin résout toujours les anciens identifiants Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast et Grok Code pour les configurations existantes ;
consultez [compatibilité héritée et alias évolutifs](#legacy-compatibility-and-moving-aliases).

| Famille        | Identifiants de modèle                                       |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (alias : `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (alias : `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Utilisez `grok-4.5` pour les conversations générales, la programmation et les tâches agentiques lorsqu’il est disponible.
Grok 4.3 reste le modèle de configuration par défaut sûr au niveau régional ; `grok-build-0.1` et les deux
variantes datées de Grok 4.20 restent sélectionnables.
</Tip>

## Couverture fonctionnelle

Le plugin intégré associe les API xAI prises en charge aux contrats partagés de fournisseur et
d’outils d’OpenClaw. Les fonctionnalités qui ne correspondent pas au contrat partagé sont répertoriées
ci-dessous ou dans les limitations connues.

| Fonctionnalité xAI            | Surface OpenClaw                         | État                                                 |
| ----------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Chat / Responses              | Fournisseur de modèles `xai/<model>`            | Oui                                                  |
| Recherche web côté serveur    | Fournisseur `web_search` `grok`            | Oui                                                  |
| Recherche X côté serveur      | Outil `x_search`                         | Oui                                                  |
| Exécution de code côté serveur | Outil `code_execution`                   | Oui                                                  |
| Images                        | `image_generate`                        | Oui                                                  |
| Vidéos                        | `video_generate`                        | Oui                                                  |
| Synthèse vocale par lots      | `messages.tts.provider: "xai"` / `tts`  | Oui                                                  |
| TTS en streaming              | `textToSpeechStream`                    | Oui via `wss://api.x.ai/v1/tts` (pas de voix en temps réel) |
| Reconnaissance vocale par lots | Compréhension multimédia `tools.media.audio` | Oui                                                  |
| Reconnaissance vocale en streaming | Voice Call `streaming.provider: "xai"`  | Oui                                                  |
| Voix en temps réel            | Talk `talk.realtime.provider: "xai"`    | Oui ; relais via le Gateway pour les nœuds Talk natifs |
| Fichiers / lots               | Compatibilité avec l’API générique des modèles uniquement | Pas un outil OpenClaw de premier ordre              |

<Note>
OpenClaw utilise les API REST d’image/vidéo/TTS/STT de xAI pour la génération multimédia et
la transcription par lots, le WebSocket STT en streaming de xAI pour la transcription en direct
des appels vocaux, le WebSocket Grok Voice Agent de xAI pour les sessions Talk en temps réel,
et l’API Responses pour le chat, la recherche et les outils d’exécution de code.
</Note>

### Compatibilité héritée du mode rapide

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
réécrit toujours les anciennes configurations xAI comme suit. Ces identifiants cibles sont
conservés uniquement à des fins de compatibilité ; utilisez les modèles actuellement sélectionnables pour les nouvelles
configurations.

| Modèle source | Cible du mode rapide |
| ------------- | -------------------- |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Compatibilité héritée et alias évolutifs

Les anciens alias sont normalisés comme suit :

| Ancien alias                                                   | Identifiant normalisé |
| -------------------------------------------------------------- | --------------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

Les identifiants datés 0309 constituent les entrées sélectionnables du catalogue. OpenClaw envoie tous les autres
alias Grok 4.20 actuels tels quels afin que xAI conserve le contrôle de la sémantique des alias stables, latest,
bêta, expérimentaux et datés. L’alias global `grok-latest` est
également conservé tel quel.

xAI a retiré les identifiants exacts suivants. OpenClaw les conserve sous forme de lignes de compatibilité masquées
pour les configurations publiées, avec les limites et la tarification de leurs cibles de
redirection actuelles :

| Identifiants retirés                                                 | Comportement actuel              |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 avec raisonnement `low`    |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 avec raisonnement désactivé |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality       |

`openclaw doctor --fix` met à jour les valeurs par défaut persistantes des outils serveur xAI et
l’identifiant d’image de qualité retiré, supprime les lignes obsolètes du catalogue généré et répare
les métadonnées de contexte obsolètes sur les lignes 4.20 actives. Il n’épingle pas les alias
`beta-latest` 4.20 actifs à un instantané daté.

## Fonctionnalités

<Warning>
  `x_search` et `code_execution` s’exécutent sur les serveurs de xAI. xAI facture 5 $ pour 1 000
  appels d’outils, en plus des jetons d’entrée et de sortie du modèle. Lorsque le paramètre
  `enabled` de chaque outil est omis, OpenClaw ne l’expose que pour un modèle xAI actif.
  Un fournisseur de modèles non-xAI connu nécessite une valeur `enabled: true` explicite par outil ;
  un fournisseur manquant ou non résolu entraîne un refus par défaut. L’authentification xAI est toujours requise,
  et `enabled: false` désactive l’outil pour tous les fournisseurs.
</Warning>

<AccordionGroup>
  <Accordion title="Recherche web">
    Le fournisseur de recherche web `grok` intégré privilégie xAI OAuth, puis utilise en solution de secours
    `XAI_API_KEY` ou une clé de recherche web de plugin :

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Génération de vidéos">
    Le plugin `xai` intégré enregistre la génération de vidéos via l’outil partagé
    `video_generate`.

    - Modèle par défaut : `xai/grok-imagine-video`
    - Modèle supplémentaire : `xai/grok-imagine-video-1.5`
    - Modes classiques : texte vers vidéo, image vers vidéo, génération à partir d’images de référence,
      modification de vidéo distante et extension de vidéo distante
    - Mode Video 1.5 : image vers vidéo uniquement, avec exactement une image de première trame
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3` ;
      les modes classiques et Video 1.5 d’image vers vidéo héritent du format de l’image source lorsqu’il
      est omis
    - Résolutions : modes classiques `480P`/`720P` ; Video 1.5 prend également en charge `1080P` ; tous les
      modes de génération utilisent `480P` par défaut
    - Durée : 1-15 secondes pour la génération/l’image vers vidéo, 1-10 secondes lors de
      l’utilisation des rôles classiques `reference_image`, 2-10 secondes pour l’extension classique
    - Génération à partir d’images de référence : définissez `imageRoles` sur `reference_image` pour
      chaque image fournie ; xAI accepte jusqu’à 7 images de ce type
    - La modification/l’extension de vidéo hérite du format et de la résolution de la vidéo d’entrée ;
      ces opérations n’acceptent aucune substitution de géométrie
    - Délai d’expiration par défaut de l’opération : 600 secondes, sauf si `video_generate.timeoutMs`
      ou `agents.defaults.videoGenerationModel.timeoutMs` est défini

    <Warning>
    Les tampons vidéo locaux ne sont pas acceptés. Utilisez des URL `http(s)` distantes pour les entrées de
    modification/extension vidéo. Le mode image vers vidéo accepte les tampons d’image locaux, car
    OpenClaw les encode sous forme d’URL de données pour xAI.
    </Warning>

    Video 1.5 reconnaît également les identifiants `grok-imagine-video-1.5-preview` et
    `grok-imagine-video-1.5-2026-05-30` de xAI. OpenClaw transmet
    l’identifiant sélectionné sans le modifier, mais applique la même validation limitée aux images.

    Pour utiliser xAI comme fournisseur vidéo par défaut :

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Consultez [Génération de vidéos](/fr/tools/video-generation) pour connaître les paramètres partagés de l’outil,
    la sélection du fournisseur et le comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Génération d’images">
    Le plugin `xai` intégré enregistre la génération d’images via l’outil partagé
    `image_generate`.

    - Modèle d’image par défaut : `xai/grok-imagine-image`
    - Modèle supplémentaire : `xai/grok-imagine-image-quality`
    - Modes : génération de texte vers image et modification d’une image de référence
    - Entrées de référence : un `image` ou jusqu’à trois `images`
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Résolutions : `1K`, `2K`
    - Nombre : jusqu’à 4 images
    - Délai d’expiration par défaut de l’opération : 600 secondes, sauf si `image_generate.timeoutMs`
      ou `agents.defaults.imageGenerationModel.timeoutMs` est défini

    OpenClaw demande à xAI des réponses d’image `b64_json` afin que les médias générés puissent être
    stockés et transmis par le chemin normal des pièces jointes du canal. Les images de
    référence locales sont converties en URL de données ; les références `http(s)` distantes
    sont transmises sans modification.

    Pour utiliser xAI comme fournisseur d’images par défaut :

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI documente également `quality`, `mask`, `user` et un format d’image `auto`.
    OpenClaw ne transmet actuellement que les contrôles d’image communs aux différents fournisseurs ;
    ces paramètres propres au fournisseur ne sont pas exposés par `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Synthèse vocale">
    Le plugin `xai` intégré enregistre la synthèse vocale par l’intermédiaire de la surface
    de fournisseur `tts` partagée.

    - Voix : catalogue dynamique authentifié provenant de xAI ; affichez-le avec
      `openclaw infer tts voices --provider xai`
    - Voix de secours hors ligne : `ara`, `eve`, `leo`, `rex`, `sal`
    - Voix par défaut : `eve`
    - Les identifiants de voix personnalisées du compte sont transmis même s’ils sont absents de la
      réponse du catalogue intégré
    - Formats : `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Langue : code BCP-47 ou `auto`
    - Vitesse : remplacement de la vitesse propre au fournisseur
    - Le format natif Opus des messages vocaux n’est pas pris en charge

    Pour utiliser xAI comme fournisseur TTS par défaut :

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw utilise le point de terminaison par lots `/v1/tts` de xAI pour la synthèse mise en mémoire tampon,
    la découverte authentifiée du catalogue `/v1/tts/voices` et le protocole
    `wss://api.x.ai/v1/tts` natif pour la synthèse en streaming. Le streaming est limité à
    l’hôte `api.x.ai` natif ; les valeurs `baseUrl` personnalisées sont donc refusées sur ce
    chemin. Il utilise les contrôles existants de langue, de voix, de codec et de vitesse ; les
    valeurs par défaut de xAI s’appliquent à la fréquence d’échantillonnage et au débit binaire. La synthèse de fichiers audio respecte tous
    les codecs configurés. Les cibles de messages vocaux utilisent le MP3 pour le streaming et le mode de secours
    mis en mémoire tampon, car les codecs bruts de xAI ne contiennent pas de métadonnées de codec ou de fréquence. Le
    flux envoie `text.delta`, puis
    `text.done`, reçoit `audio.delta`, `audio.done` ou `error`, et applique un
    `timeoutMs` d’inactivité actualisé à chaque bloc audio. Il est distinct des
    sessions vocales en temps réel. Consultez le contrat de l’[API TTS en streaming](https://docs.x.ai/developers/rest-api-reference/inference/voice) de xAI.
    </Note>

  </Accordion>

  <Accordion title="Transcription vocale">
    Le plugin `xai` intégré enregistre la transcription vocale par lots par l’intermédiaire de la
    surface de transcription de compréhension multimédia d’OpenClaw.

    - Point de terminaison : REST xAI `/v1/stt`
    - Chemin d’entrée : téléversement multipart d’un fichier audio
    - Sélection du modèle : xAI choisit le modèle de transcription en interne ; le
      point de terminaison ne comporte aucun sélecteur de modèle
    - Utilisé partout où la transcription audio entrante lit `tools.media.audio`,
      notamment pour les segments de canaux vocaux Discord et les pièces jointes audio des canaux

    Pour imposer xAI pour la transcription audio entrante :

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    La langue peut être fournie par la configuration multimédia audio partagée ou par une demande de
    transcription individuelle. Les indications d’invite sont acceptées par la surface OpenClaw
    partagée, mais l’intégration STT REST de xAI transmet uniquement le fichier et la langue,
    car seuls ces éléments correspondent au point de terminaison public actuel de xAI.

  </Accordion>

  <Accordion title="Transcription vocale en streaming">
    Le plugin `xai` intégré enregistre également un fournisseur de transcription en temps réel
    pour l’audio des appels vocaux en direct.

    - Point de terminaison : WebSocket xAI `wss://api.x.ai/v1/stt`
    - Encodage par défaut : `mulaw`
    - Fréquence d’échantillonnage par défaut : `8000`
    - Détection de fin de parole par défaut : `800ms`
    - Transcriptions intermédiaires : activées par défaut

    Le flux multimédia Twilio de Voice Call envoie des trames audio G.711 mu-law ; le
    fournisseur xAI transmet donc directement ces trames sans transcodage :

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    La configuration détenue par le fournisseur se trouve sous
    `plugins.entries.voice-call.config.streaming.providers.xai`. Les clés
    prises en charge sont `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` ou
    `alaw`), `interimResults`, `endpointingMs` et `language`.

    <Note>
    Ce fournisseur de streaming est destiné au chemin de transcription en temps réel de Voice Call.
    Discord enregistre de courts segments et utilise à la place le chemin de transcription par lots
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel (Talk)">
    Le plugin `xai` intégré enregistre les sessions en temps réel de Grok Voice Agent pour
    le mode Talk par l’intermédiaire du contrat `registerRealtimeVoiceProvider` partagé.

    - Point de terminaison : `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Modèle par défaut : `grok-voice-latest`
    - Voix par défaut : `eve`
    - Transport : `gateway-relay` (chemins de relais iOS, Android et Control UI)
    - Audio : PCM16 24 kHz ou G.711 µ-law 8 kHz
    - Interruption : le VAD du serveur xAI interrompt la réponse ; OpenClaw efface la lecture en attente
      et tronque l’historique du fournisseur qui n’a pas été lu

    Configurez Talk sur le Gateway :

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Activez cette option uniquement si la relecture de session côté fournisseur est acceptable.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    La configuration détenue par le fournisseur est également résolue depuis
    `plugins.entries.voice-call.config.realtime.providers.xai` lorsque Voice Call
    ou les sélecteurs en temps réel partagés réutilisent la même correspondance de fournisseurs. Les clés prises en charge sont
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` et `sessionResumption`.
    `reasoningEffort` accepte uniquement `high` ou `none`, conformément à l’API xAI Voice Agent.

    Le VAD du serveur xAI crée toujours les réponses et gère les interruptions audio.
    Utilisez `consultRouting: "provider-direct"` ; le routage forcé des transcriptions et la désactivation
    de l’interruption de l’audio entrant ne sont pas pris en charge par le protocole xAI Voice Agent.

    <Note>
    xAI OAuth ou `XAI_API_KEY` peuvent authentifier la voix en temps réel. Le WebRTC géré par le
    navigateur ne fait pas encore partie de cette surface de fournisseur ; utilisez le mode Talk par relais du Gateway sur
    les nœuds natifs ou le chemin de relais de Control UI.
    </Note>

    <Note>
    `sessionResumption` utilise par défaut `false`. Lorsque cette option est définie sur `true`, OpenClaw demande
    à xAI de conserver suffisamment d’état de session pour reprendre la même conversation après une
    reconnexion, puis se reconnecte avec l’identifiant de conversation renvoyé. Laissez cette option
    désactivée lorsque la relecture ou la conservation côté fournisseur n’est pas acceptable ; les sockets
    interrompus échouent alors de manière fermée au lieu de démarrer silencieusement une nouvelle conversation.
    </Note>

  </Accordion>

  <Accordion title="Configuration de x_search">
    Le plugin xAI intégré expose `x_search` comme outil OpenClaw pour
    rechercher du contenu X (anciennement Twitter) par l’intermédiaire de Grok.

    Chemin de configuration : `plugins.entries.xai.config.xSearch`

    | Clé               | Type    | Valeur par défaut         | Description                                      |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | booléen | Automatique pour les modèles xAI | Désactiver ou activer pour un fournisseur non-xAI connu |
    | `model`           | chaîne  | `grok-4.3`                | Modèle utilisé pour les requêtes x_search                 |
    | `baseUrl`         | chaîne  | -                         | Remplacement de l’URL de base de xAI Responses                  |
    | `inlineCitations` | booléen | -                         | Inclure des citations intégrées dans les résultats              |
    | `maxTurns`        | nombre  | -                         | Nombre maximal de tours de conversation                       |
    | `timeoutSeconds`  | nombre  | `30`                      | Délai d’expiration de la requête en secondes                       |
    | `cacheTtlMinutes` | nombre  | `15`                      | Durée de vie du cache en minutes                    |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuration de l’exécution de code">
    Le plugin xAI intégré expose `code_execution` comme outil OpenClaw pour
    l’exécution de code à distance dans l’environnement bac à sable de xAI.

    Chemin de configuration : `plugins.entries.xai.config.codeExecution`

    | Clé              | Type    | Valeur par défaut        | Description                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | booléen | Automatique pour les modèles xAI | Désactiver ou activer pour un fournisseur non-xAI connu |
    | `model`          | chaîne  | `grok-4.3`               | Modèle utilisé pour les requêtes d’exécution de code           |
    | `maxTurns`       | nombre  | -                        | Nombre maximal de tours de conversation                       |
    | `timeoutSeconds` | nombre  | `30`                     | Délai d’expiration de la requête en secondes                       |

    <Note>
    Il s’agit d’une exécution à distance dans le bac à sable de xAI, et non de l’[`exec`](/fr/tools/exec) locale.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limites connues">
    - L’authentification xAI peut utiliser une clé API, une variable d’environnement, une configuration de Plugin de secours ou OAuth avec un compte xAI admissible. OAuth utilise une vérification par code d’appareil sans rappel localhost. xAI détermine quels comptes peuvent recevoir des jetons API OAuth, et la page de consentement peut afficher Grok Build même si OpenClaw ne nécessite pas l’application Grok Build.
    - OpenClaw n’expose actuellement pas la famille de modèles multi-agents de xAI. xAI fournit ces modèles par l’intermédiaire de l’API Responses, mais ils n’acceptent pas les outils côté client ou personnalisés utilisés par la boucle d’agent partagée d’OpenClaw. Consultez les
      [limitations multi-agents de xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - La voix xAI Realtime n’expose actuellement que le transport Talk par relais du Gateway. Les sessions WebSocket du fournisseur gérées par le navigateur ne sont pas encore intégrées à l’interface de contrôle.
    - L’image xAI `quality`, l’image `mask` et les rapports hauteur/largeur supplémentaires exclusivement natifs ne sont pas exposés tant que l’outil partagé `image_generate` ne dispose pas de contrôles inter-fournisseurs correspondants.

  </Accordion>

  <Accordion title="Remarques avancées">
    - OpenClaw applique automatiquement les correctifs de compatibilité xAI propres aux schémas d’outils et aux appels d’outils sur le chemin d’exécution partagé.
    - Les requêtes xAI natives utilisent par défaut `tool_stream: true`. Définissez
      `agents.defaults.models["xai/<model>"].params.tool_stream` sur `false`
      pour le désactiver.
    - Le wrapper xAI intégré supprime les limites de nombre d’occurrences non prises en charge dans les schémas ainsi que les clés de charge utile *effort* de raisonnement non prises en charge avant l’envoi de requêtes xAI natives. Grok 4.5 prend en charge un effort faible, moyen et élevé (élevé par défaut). Grok 4.3 prend en charge les valeurs aucun, faible, moyen et élevé (faible par défaut). Les autres modèles xAI capables de raisonnement n’exposent pas de contrôle configurable de l’effort, mais demandent tout de même
      `include: ["reasoning.encrypted_content"]` afin que le raisonnement chiffré antérieur puisse être réutilisé lors des tours suivants.
    - `web_search`, `x_search` et `code_execution` sont exposés comme outils OpenClaw. OpenClaw joint uniquement la fonctionnalité xAI intégrée spécifique requise par chaque outil à la requête de cet outil, au lieu de joindre tous les outils natifs à chaque tour de conversation.
    - Grok `web_search` lit `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lit `plugins.entries.xai.config.xSearch.baseUrl`, puis
      utilise en secours l’URL de base de recherche Web de Grok.
    - `x_search` et `code_execution` appartiennent au Plugin xAI intégré plutôt que d’être codés en dur dans le runtime principal des modèles.
    - `code_execution` correspond à une exécution distante dans le bac à sable xAI, et non à une exécution locale
      [`exec`](/fr/tools/exec).
  </Accordion>
</AccordionGroup>

## Tests en conditions réelles

Les chemins multimédias xAI sont couverts par des tests unitaires et des suites en conditions réelles à activation explicite. Exportez
`XAI_API_KEY` dans l’environnement du processus avant d’exécuter les sondes en conditions réelles.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Le fichier de tests en conditions réelles propre au fournisseur synthétise une TTS normale et une TTS PCM adaptée à la téléphonie, transcrit l’audio avec la STT par lots de xAI, diffuse le même PCM avec la STT en temps réel de xAI, génère une sortie texte-vers-image et modifie une image de référence.
Le fichier partagé de tests d’image en conditions réelles vérifie le même fournisseur xAI via la sélection du runtime, le mécanisme de secours, la normalisation et le chemin de pièce jointe multimédia d’OpenClaw. Le cas Video 1.5 à activation explicite envoie une image générée comme première image en 1080P et vérifie le téléchargement de la vidéo terminée.

## Contenu associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil vidéo partagé et sélection du fournisseur.
  </Card>
  <Card title="Tous les fournisseurs" href="/fr/providers/index" icon="grid-2">
    Vue d’ensemble plus générale des fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et solutions.
  </Card>
</CardGroup>
