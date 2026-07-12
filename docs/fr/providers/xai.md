---
read_when:
    - Vous souhaitez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou des identifiants de modèle
summary: Utiliser les modèles Grok de xAI dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-12T03:02:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw fournit un Plugin de fournisseur `xai` intégré pour les modèles Grok. La
méthode recommandée est l’OAuth Grok avec un abonnement SuperGrok ou X Premium
éligible. Le Gateway, la configuration, le routage et les outils restent locaux ;
seules les requêtes Grok sont envoyées à l’API de xAI.

OAuth ne nécessite ni clé d’API xAI ni application Grok Build. xAI peut néanmoins
afficher Grok Build sur l’écran de consentement, car OpenClaw utilise le client
OAuth partagé de xAI.

## Configuration

<Steps>
  <Step title="Nouvelle installation">
    Lancez l’intégration avec l’installation du démon, puis choisissez OAuth
    xAI/Grok à l’étape du modèle et de l’authentification :

    ```bash
    openclaw onboard --install-daemon
    ```

    Sur un VPS ou via SSH, sélectionnez directement OAuth xAI ; cette méthode
    utilise la vérification par code d’appareil et ne nécessite pas de rappel
    localhost :

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Installation existante">
    Connectez-vous uniquement à xAI ; ne relancez pas l’intégration complète
    simplement pour connecter Grok :

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Définissez séparément Grok comme modèle par défaut :

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Ne relancez l’intégration complète que si vous souhaitez intentionnellement
    modifier le Gateway, le démon, le canal, l’espace de travail ou d’autres
    choix de configuration.

  </Step>
  <Step title="Méthode avec clé d’API">
    La configuration par clé d’API fonctionne toujours pour les clés de la
    console xAI et pour les fonctionnalités multimédias qui nécessitent une
    configuration de fournisseur reposant sur une clé :

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
identifiant obtenu avec `openclaw models auth login --provider xai --method oauth`
ou `--method api-key` alimente également `web_search` (identifiant de fournisseur
`grok`), `x_search`, `code_execution`, la synthèse et la transcription vocales,
ainsi que la génération d’images et de vidéos xAI. Si vous stockez une clé xAI
dans `plugins.entries.xai.config.webSearch.apiKey`, le fournisseur de modèles xAI
intégré la réutilise également comme solution de repli.
</Note>

## Résolution des problèmes OAuth

- Pour SSH, Docker, un VPS ou toute autre configuration distante, utilisez
  `openclaw models auth login --provider xai --method oauth` ; cette commande
  utilise la vérification par code d’appareil, et non un rappel localhost.
- Si la connexion réussit, mais que Grok n’est pas le modèle par défaut, exécutez
  `openclaw models set xai/grok-4.3`.
- Inspectez les profils d’authentification xAI enregistrés :

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI détermine quels comptes peuvent recevoir des jetons d’API OAuth. Si un
  compte n’est pas éligible, utilisez la méthode avec clé d’API ou vérifiez
  l’abonnement du côté de xAI.

<Tip>
Utilisez `xai-oauth` pour vous connecter depuis SSH, Docker ou un VPS. OpenClaw
affiche une URL et un code court ; terminez la connexion dans n’importe quel
navigateur local pendant que le processus distant interroge xAI jusqu’à la fin
de l’échange de jetons.
</Tip>

## Catalogue intégré

Identifiants sélectionnables dans les sélecteurs de modèles. Le Plugin résout
toujours les anciens identifiants Grok 3, Grok 4, Grok 4 Fast, Grok 4.1 Fast et
Grok Code pour les configurations existantes ; consultez la section
[compatibilité historique et alias évolutifs](#legacy-compatibility-and-moving-aliases).

| Famille        | Identifiants de modèle                                       |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (alias : `grok-4.5-latest`, `grok-build-latest`)  |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (alias : `grok-4.3-latest`, `grok-latest`)        |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Utilisez `grok-4.5` pour les discussions générales, la programmation et les
tâches agentiques lorsqu’il est disponible. Grok 4.3 reste le choix par défaut
compatible avec toutes les régions ; `grok-build-0.1` et les deux variantes
datées de Grok 4.20 restent sélectionnables.
</Tip>

## Prise en charge des fonctionnalités

Le Plugin intégré associe les API xAI prises en charge aux contrats partagés
d’OpenClaw pour les fournisseurs et les outils. Les capacités qui ne
correspondent pas au contrat partagé sont répertoriées ci-dessous ou dans les
limitations connues.

| Capacité xAI                     | Fonctionnalité OpenClaw                  | État                                                                  |
| -------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Discussion / Responses           | Fournisseur de modèles `xai/<model>`     | Oui                                                                   |
| Recherche web côté serveur       | Fournisseur `grok` de `web_search`       | Oui                                                                   |
| Recherche X côté serveur         | Outil `x_search`                         | Oui                                                                   |
| Exécution de code côté serveur   | Outil `code_execution`                   | Oui                                                                   |
| Images                           | `image_generate`                         | Oui                                                                   |
| Vidéos                           | `video_generate`                         | Flux de travail classique complet ; image vers vidéo avec Video 1.5   |
| Synthèse vocale par lots         | `messages.tts.provider: "xai"` / `tts`   | Oui                                                                   |
| Synthèse vocale en continu       | -                                        | Pas encore mise en œuvre par le fournisseur xAI                       |
| Transcription vocale par lots    | Compréhension multimédia `tools.media.audio` | Oui                                                               |
| Transcription vocale en continu  | Appel vocal `streaming.provider: "xai"`  | Oui                                                                   |
| Voix en temps réel               | -                                        | Pas encore exposée ; nécessite un contrat de session/WebSocket distinct |
| Fichiers / traitements par lots  | Compatibilité avec l’API générique des modèles uniquement | Pas un outil OpenClaw de premier ordre |

<Note>
OpenClaw utilise les API REST de xAI pour les images, les vidéos, la synthèse
vocale et la transcription afin d’assurer la génération multimédia et la
transcription par lots, le WebSocket de transcription en continu de xAI pour la
transcription des appels vocaux en direct, ainsi que l’API Responses pour la
discussion, la recherche et les outils d’exécution de code.
</Note>

### Compatibilité historique du mode rapide

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
continue de réécrire les anciennes configurations xAI comme suit. Ces
identifiants cibles sont conservés uniquement à des fins de compatibilité ;
utilisez les modèles actuellement sélectionnables pour les nouvelles
configurations.

| Modèle source | Cible du mode rapide |
| ------------- | -------------------- |
| `grok-3`      | `grok-3-fast`        |
| `grok-3-mini` | `grok-3-mini-fast`   |
| `grok-4`      | `grok-4-fast`        |
| `grok-4-0709` | `grok-4-fast`        |

### Compatibilité historique et alias évolutifs

Les anciens alias sont normalisés comme suit :

| Ancien alias                                                   | Identifiant normalisé |
| -------------------------------------------------------------- | --------------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825`  | `grok-build-0.1`      |

Les identifiants datés 0309 sont les entrées sélectionnables du catalogue.
OpenClaw transmet tels quels tous les autres alias actuels de Grok 4.20 afin que
xAI conserve le contrôle de la sémantique des alias stables, les plus récents,
bêta, expérimentaux et datés. L’alias global `grok-latest` est également
conservé tel quel.

xAI a retiré les identifiants exacts suivants. OpenClaw les conserve sous forme
de lignes de compatibilité masquées pour les configurations déjà distribuées,
avec les limitations et la tarification de leurs cibles de redirection
actuelles :

| Identifiants retirés                                                 | Comportement actuel                         |
| -------------------------------------------------------------------- | ------------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 avec un raisonnement `low`          |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 avec le raisonnement désactivé      |
| `grok-code-fast-1`                                                   | Grok Build 0.1                              |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality                  |

`openclaw doctor --fix` met à jour les valeurs par défaut persistantes des
outils serveur xAI et l’identifiant d’image de qualité retiré, supprime les
lignes obsolètes du catalogue généré et répare les métadonnées de contexte
obsolètes des lignes 4.20 actives. Cette commande ne verrouille pas les alias
4.20 `beta-latest` actifs sur un instantané daté.

## Fonctionnalités

<Warning>
  `x_search` et `code_execution` s’exécutent sur les serveurs de xAI. xAI
  facture 5 $ pour 1 000 appels d’outil, en plus des jetons d’entrée et de sortie
  du modèle. Lorsque le paramètre `enabled` de chaque outil est omis, OpenClaw
  ne l’expose que pour un modèle xAI actif. Un fournisseur de modèles connu
  autre que xAI nécessite un paramètre explicite `enabled: true` pour chaque
  outil ; un fournisseur absent ou non résolu provoque un refus par défaut.
  L’authentification xAI est toujours requise et `enabled: false` désactive
  l’outil pour tous les fournisseurs.
</Warning>

<AccordionGroup>
  <Accordion title="Recherche web">
    Le fournisseur de recherche web `grok` intégré privilégie OAuth xAI, puis
    utilise `XAI_API_KEY` ou une clé de recherche web du Plugin comme solution
    de repli :

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Génération de vidéos">
    Le Plugin `xai` intégré enregistre la génération de vidéos par
    l’intermédiaire de l’outil partagé `video_generate`.

    - Modèle par défaut : `xai/grok-imagine-video`
    - Modèle supplémentaire : `xai/grok-imagine-video-1.5`
    - Modes classiques : texte vers vidéo, image vers vidéo, génération à partir
      d’images de référence, modification d’une vidéo distante et prolongement
      d’une vidéo distante
    - Mode Video 1.5 : image vers vidéo uniquement, avec exactement une image de
      première trame
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3` ;
      lorsqu’il est omis, le mode classique et le mode image vers vidéo de
      Video 1.5 héritent du format de l’image source
    - Résolutions : `480P`/`720P` pour le mode classique ; Video 1.5 prend
      également en charge `1080P` ; tous les modes de génération utilisent
      `480P` par défaut
    - Durée : 1 à 15 secondes pour la génération et le mode image vers vidéo,
      1 à 10 secondes avec les rôles classiques `reference_image`, 2 à
      10 secondes pour le prolongement classique
    - Génération à partir d’images de référence : définissez `imageRoles` sur
      `reference_image` pour chaque image fournie ; xAI accepte jusqu’à 7 images
      de ce type
    - La modification et le prolongement d’une vidéo héritent du format d’image
      et de la résolution de la vidéo d’entrée ; ces opérations n’acceptent
      aucune substitution des paramètres géométriques
    - Délai d’expiration par défaut de l’opération : 600 secondes, sauf si
      `video_generate.timeoutMs` ou
      `agents.defaults.videoGenerationModel.timeoutMs` est défini

    <Warning>
    Les tampons vidéo locaux ne sont pas acceptés. Utilisez des URL distantes
    `http(s)` pour les entrées de modification ou de prolongement vidéo. Le mode
    image vers vidéo accepte les tampons d’images locaux, car OpenClaw les encode
    sous forme d’URL de données pour xAI.
    </Warning>

    Video 1.5 reconnaît également les identifiants
    `grok-imagine-video-1.5-preview` et
    `grok-imagine-video-1.5-2026-05-30` de xAI. OpenClaw transmet
    l’identifiant sélectionné sans le modifier, mais applique la même validation
    limitée aux images.

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
    Consultez [Génération de vidéos](/fr/tools/video-generation) pour connaître les
    paramètres partagés de l’outil, la sélection du fournisseur et le
    comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Génération d’images">
    Le Plugin `xai` intégré enregistre la génération d’images par
    l’intermédiaire de l’outil partagé `image_generate`.

    - Modèle d’image par défaut : `xai/grok-imagine-image`
    - Modèle supplémentaire : `xai/grok-imagine-image-quality`
    - Modes : conversion de texte en image et modification d’une image de référence
    - Entrées de référence : une `image` ou jusqu’à trois `images`
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Résolutions : `1K`, `2K`
    - Nombre : jusqu’à 4 images
    - Délai d’expiration par défaut de l’opération : 600 secondes, sauf si
      `image_generate.timeoutMs` ou
      `agents.defaults.imageGenerationModel.timeoutMs` est défini

    OpenClaw demande à xAI des réponses d’image au format `b64_json` afin que
    les médias générés puissent être stockés et transmis par le chemin normal
    des pièces jointes du canal. Les images de référence locales sont
    converties en URL de données ; les références `http(s)` distantes sont
    transmises sans modification.

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
    xAI documente également `quality`, `mask`, `user` et un format d’image
    `auto`. OpenClaw ne transmet actuellement que les contrôles d’image
    communs aux différents fournisseurs ; ces paramètres propres au
    fournisseur ne sont pas exposés par `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Le plugin `xai` intégré enregistre la synthèse vocale par l’intermédiaire
    de l’interface partagée du fournisseur `tts`.

    - Voix : catalogue en direct authentifié de xAI ; affichez-le avec
      `openclaw infer tts voices --provider xai`
    - Voix de secours hors ligne : `ara`, `eve`, `leo`, `rex`, `sal`
    - Voix par défaut : `eve`
    - Les identifiants de voix personnalisées du compte sont transmis même
      lorsqu’ils sont absents de la réponse du catalogue intégré
    - Formats : `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Langue : code BCP-47 ou `auto`
    - Vitesse : remplacement de la vitesse propre au fournisseur
    - Le format vocal Opus natif pour les messages vocaux n’est pas pris en charge

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
    OpenClaw utilise le point de terminaison par lots `/v1/tts` de xAI et le
    catalogue authentifié `/v1/tts/voices`. xAI propose également la synthèse
    vocale en streaming par WebSocket, mais le fournisseur xAI intégré
    n’implémente pas encore ce point d’intégration de streaming.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Le plugin `xai` intégré enregistre la transcription vocale par lots par
    l’intermédiaire de l’interface de transcription de compréhension des
    médias d’OpenClaw.

    - Point de terminaison : REST xAI `/v1/stt`
    - Chemin d’entrée : téléversement multipartite d’un fichier audio
    - Sélection du modèle : xAI choisit le modèle de transcription en interne ;
      le point de terminaison ne comporte aucun sélecteur de modèle
    - Utilisé partout où la transcription audio entrante lit
      `tools.media.audio`, notamment pour les segments des canaux vocaux
      Discord et les pièces jointes audio des canaux

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

    La langue peut être fournie par la configuration partagée des médias audio
    ou par une requête de transcription individuelle. L’interface partagée
    d’OpenClaw accepte les indications d’invite, mais l’intégration REST STT de
    xAI ne transmet que le fichier et la langue, car seuls ces éléments
    correspondent au point de terminaison public actuel de xAI.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Le plugin `xai` intégré enregistre également un fournisseur de
    transcription en temps réel pour l’audio des appels vocaux en direct.

    - Point de terminaison : WebSocket xAI `wss://api.x.ai/v1/stt`
    - Encodage par défaut : `mulaw`
    - Fréquence d’échantillonnage par défaut : `8000`
    - Détection de fin de parole par défaut : `800ms`
    - Transcriptions intermédiaires : activées par défaut

    Le flux multimédia Twilio de Voice Call envoie des trames audio
    G.711 mu-law ; le fournisseur xAI transmet donc directement ces trames
    sans transcodage :

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

    La configuration appartenant au fournisseur se trouve sous
    `plugins.entries.voice-call.config.streaming.providers.xai`. Les clés
    prises en charge sont `apiKey`, `baseUrl`, `sampleRate`, `encoding`
    (`pcm`, `mulaw` ou `alaw`), `interimResults`, `endpointingMs` et
    `language`.

    <Note>
    Ce fournisseur de streaming est destiné au chemin de transcription en
    temps réel de Voice Call. La fonctionnalité vocale de Discord enregistre
    de courts segments et utilise plutôt le chemin de transcription par lots
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    Le plugin xAI intégré expose `x_search` comme outil OpenClaw permettant de
    rechercher du contenu sur X (anciennement Twitter) par l’intermédiaire de
    Grok.

    Chemin de configuration : `plugins.entries.xai.config.xSearch`

    | Clé               | Type    | Valeur par défaut                | Description                                                        |
    | ----------------- | ------- | -------------------------------- | ------------------------------------------------------------------ |
    | `enabled`         | boolean | Automatique pour les modèles xAI | Désactiver ou activer pour un fournisseur non-xAI connu            |
    | `model`           | string  | `grok-4.3`                       | Modèle utilisé pour les requêtes x_search                          |
    | `baseUrl`         | string  | -                                | Remplacement de l’URL de base des réponses xAI                     |
    | `inlineCitations` | boolean | -                                | Inclure des citations intégrées dans les résultats                 |
    | `maxTurns`        | number  | -                                | Nombre maximal de tours de conversation                            |
    | `timeoutSeconds`  | number  | `30`                             | Délai d’expiration de la requête en secondes                       |
    | `cacheTtlMinutes` | number  | `15`                             | Durée de vie du cache en minutes                                   |

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

  <Accordion title="Code execution configuration">
    Le plugin xAI intégré expose `code_execution` comme outil OpenClaw
    permettant d’exécuter du code à distance dans l’environnement isolé de
    xAI.

    Chemin de configuration : `plugins.entries.xai.config.codeExecution`

    | Clé              | Type    | Valeur par défaut                | Description                                             |
    | ---------------- | ------- | -------------------------------- | ------------------------------------------------------- |
    | `enabled`        | boolean | Automatique pour les modèles xAI | Désactiver ou activer pour un fournisseur non-xAI connu |
    | `model`          | string  | `grok-4.3`                       | Modèle utilisé pour les requêtes d’exécution de code    |
    | `maxTurns`       | number  | -                                | Nombre maximal de tours de conversation                 |
    | `timeoutSeconds` | number  | `30`                             | Délai d’expiration de la requête en secondes            |

    <Note>
    Il s’agit d’une exécution distante dans l’environnement isolé de xAI, et
    non de la commande locale [`exec`](/fr/tools/exec).
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

  <Accordion title="Known limits">
    - L’authentification xAI peut utiliser une clé d’API, une variable
      d’environnement, une configuration de secours du plugin ou OAuth avec
      un compte xAI admissible. OAuth utilise une vérification par code
      d’appareil sans rappel vers localhost. xAI détermine quels comptes
      peuvent recevoir des jetons d’API OAuth, et la page de consentement peut
      afficher Grok Build même si OpenClaw ne nécessite pas l’application
      Grok Build.
    - OpenClaw n’expose actuellement pas la famille de modèles multi-agents de
      xAI. xAI fournit ces modèles par l’intermédiaire de l’API Responses, mais
      ils n’acceptent pas les outils côté client ou personnalisés utilisés par
      la boucle d’agent partagée d’OpenClaw. Consultez les
      [limitations des systèmes multi-agents de xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - La voix xAI Realtime n’est pas encore enregistrée comme fournisseur
      OpenClaw. Elle nécessite un contrat de session vocale bidirectionnelle
      différent de celui de la STT par lots ou de la transcription en
      streaming.
    - Les paramètres d’image `quality` et `mask` de xAI, ainsi que le format
      d’image natif `auto`, ne sont pas exposés tant que l’outil partagé
      `image_generate` ne dispose pas des contrôles correspondants communs aux
      différents fournisseurs.
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw applique automatiquement les correctifs de compatibilité propres
      à xAI pour les schémas et les appels d’outils sur le chemin d’exécution
      partagé.
    - Les requêtes xAI natives utilisent `tool_stream: true` par défaut.
      Définissez
      `agents.defaults.models["xai/<model>"].params.tool_stream` sur `false`
      pour le désactiver.
    - Le wrapper xAI intégré supprime les limites de nombre d’occurrences non
      prises en charge dans les schémas ainsi que les clés de charge utile
      d’*effort* de raisonnement non prises en charge avant l’envoi de requêtes
      xAI natives. Grok 4.5 prend en charge les efforts faible, moyen et élevé
      (élevé par défaut). Grok 4.3 prend en charge aucun effort, ainsi que les
      efforts faible, moyen et élevé (faible par défaut). Les autres modèles
      xAI capables de raisonnement n’exposent pas de contrôle d’effort
      configurable, mais demandent tout de même
      `include: ["reasoning.encrypted_content"]` afin que le raisonnement
      chiffré antérieur puisse être réutilisé lors des tours suivants.
    - `web_search`, `x_search` et `code_execution` sont exposés comme outils
      OpenClaw. OpenClaw ne joint à la requête de chaque outil que la
      fonctionnalité intégrée xAI particulière dont celui-ci a besoin, au lieu
      de joindre tous les outils natifs à chaque tour de conversation.
    - La commande Grok `web_search` lit
      `plugins.entries.xai.config.webSearch.baseUrl`. `x_search` lit
      `plugins.entries.xai.config.xSearch.baseUrl`, puis utilise en dernier
      recours l’URL de base de recherche Web de Grok.
    - `x_search` et `code_execution` appartiennent au plugin xAI intégré au
      lieu d’être codés en dur dans le moteur d’exécution principal des
      modèles.
    - `code_execution` correspond à une exécution distante dans
      l’environnement isolé de xAI, et non à la commande locale
      [`exec`](/fr/tools/exec).
  </Accordion>
</AccordionGroup>

## Tests en direct

Les chemins multimédias xAI sont couverts par des tests unitaires et des
suites de tests en direct à activation explicite. Exportez `XAI_API_KEY` dans
l’environnement du processus avant d’exécuter les sondes en direct.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Le fichier de test en conditions réelles propre au fournisseur synthétise une TTS normale, une TTS PCM adaptée à la téléphonie, transcrit l’audio à l’aide de la STT par lots de xAI, diffuse le même flux PCM via la STT en temps réel de xAI, génère une image à partir de texte et modifie une image de référence.
Le fichier de test d’image en conditions réelles partagé vérifie le même fournisseur xAI via le chemin de sélection à l’exécution, de repli, de normalisation et de pièce jointe multimédia d’OpenClaw. Le cas Video 1.5 facultatif soumet une image générée comme première image en 1080P et vérifie le téléchargement de la vidéo terminée.

## Pages connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Tous les fournisseurs" href="/fr/providers/index" icon="grid-2">
    Vue d’ensemble générale des fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et solutions.
  </Card>
</CardGroup>
