---
read_when:
    - Vous souhaitez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou les identifiants de modèle
summary: Utiliser les modèles xAI Grok dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:08:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw fournit un Plugin de fournisseur `xai` intégré pour les modèles Grok. Pour la plupart
des utilisateurs, le parcours recommandé est l’OAuth Grok avec un abonnement SuperGrok ou X Premium
éligible. OpenClaw reste local-first : le Gateway, la configuration, le routage et
les outils s’exécutent sur votre machine, tandis que les requêtes de modèle Grok s’authentifient via xAI
et sont envoyées à l’API de xAI.

OAuth ne nécessite pas de clé API xAI et ne nécessite pas l’application Grok Build.
xAI peut tout de même afficher Grok Build sur l’écran de consentement, car OpenClaw utilise
le client OAuth partagé de xAI.

## Choisir votre parcours de configuration

Utilisez le parcours qui correspond à l’état de votre installation OpenClaw :

<Steps>
  <Step title="New OpenClaw install">
    Exécutez l’onboarding avec installation du daemon lorsque vous configurez un nouveau
    Gateway local, puis choisissez l’option OAuth xAI/Grok à l’étape modèle/authentification :

    ```bash
    openclaw onboard --install-daemon
    ```

    Sur un VPS ou via SSH, sélectionnez directement OAuth xAI ; OpenClaw utilise la
    vérification par code d’appareil et ne nécessite pas de callback localhost :

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth ne nécessite pas de clé API xAI. OpenClaw ne nécessite pas l’application Grok
    Build. xAI peut tout de même libeller l’application de consentement comme Grok Build, car
    OpenClaw utilise le client OAuth partagé de xAI.

  </Step>
  <Step title="Existing OpenClaw install">
    Si OpenClaw est déjà configuré, connectez-vous uniquement à xAI. Ne relancez pas
    l’onboarding complet et ne réinstallez pas le daemon uniquement pour connecter Grok :

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Pour faire de Grok le modèle par défaut après la connexion, appliquez-le séparément :

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Relancez l’onboarding complet uniquement si vous souhaitez intentionnellement modifier le Gateway,
    le daemon, le canal, l’espace de travail ou d’autres choix de configuration.

  </Step>
  <Step title="API-key path">
    La configuration par clé API fonctionne toujours pour les clés xAI Console et pour les surfaces média qui
    nécessitent une configuration de fournisseur adossée à une clé :

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw utilise l’API Responses de xAI comme transport xAI intégré. Le même
identifiant issu de `openclaw models auth login --provider xai --method oauth` ou
`openclaw models auth login --provider xai --method api-key` peut aussi alimenter les fonctionnalités natives
`web_search`, `x_search`, `code_execution` distant, ainsi que la génération d’images/vidéos xAI.
La parole et la transcription nécessitent actuellement `XAI_API_KEY` ou une configuration de fournisseur.
`web_search` adossé à Grok préfère OAuth xAI et se rabat sur `XAI_API_KEY` ou
la configuration de recherche web du Plugin.
Si vous stockez une clé xAI sous `plugins.entries.xai.config.webSearch.apiKey`,
le fournisseur de modèle xAI intégré réutilise également cette clé comme repli.
Définissez `plugins.entries.xai.config.webSearch.baseUrl` pour router `web_search` Grok
et, par défaut, `x_search` via un proxy xAI Responses d’opérateur.
Le réglage de `code_execution` se trouve sous `plugins.entries.xai.config.codeExecution`.
</Note>

## Dépannage OAuth

- Pour SSH, Docker, VPS ou d’autres configurations distantes, utilisez
  `openclaw models auth login --provider xai --method oauth` ; OAuth xAI utilise
  la vérification par code d’appareil au lieu d’un callback localhost.
- Si la connexion réussit mais que Grok n’est pas le modèle par défaut, exécutez
  `openclaw models set xai/grok-4.3`.
- Pour inspecter les profils d’authentification xAI enregistrés, exécutez :

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI décide quels comptes peuvent recevoir des jetons API OAuth. Si un compte n’est pas
  éligible, essayez le parcours par clé API ou vérifiez l’abonnement côté xAI.

<Tip>
Utilisez `xai-oauth` lorsque vous vous connectez depuis SSH, Docker ou un VPS. OpenClaw affiche une
URL xAI et un code court ; terminez la connexion dans n’importe quel navigateur local pendant que le processus distant
interroge xAI pour l’échange de jeton terminé.
</Tip>

## Catalogue intégré

OpenClaw inclut d’emblée les modèles de chat xAI actuels, classés du plus récent
au plus ancien dans les sélecteurs de modèles :

| Famille       | Identifiants de modèle                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Le Plugin résout toujours en avant les anciens slugs Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast et Grok Code pour les configurations existantes. Les alias officiels Grok Code Fast
se normalisent en `grok-build-0.1` ; OpenClaw n’affiche plus les autres slugs upstream retirés
dans le catalogue sélectionnable.

<Tip>
Utilisez `grok-4.3` pour le chat général et `grok-build-0.1` pour les charges de travail
axées sur la génération/le codage, sauf si vous avez explicitement besoin d’un alias bêta Grok 4.20.
</Tip>

## Couverture des fonctionnalités OpenClaw

Le Plugin intégré mappe la surface d’API publique actuelle de xAI sur les contrats
partagés de fournisseur et d’outils d’OpenClaw. Les capacités qui ne correspondent pas au contrat partagé
(par exemple le TTS en streaming et la voix en temps réel) ne sont pas exposées - voir le tableau
ci-dessous.

| Capacité xAI              | Surface OpenClaw                          | État                                                                |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | fournisseur de modèle `xai/<model>`       | Oui                                                                 |
| Recherche web côté serveur | fournisseur `web_search` `grok`           | Oui                                                                 |
| Recherche X côté serveur   | outil `x_search`                          | Oui                                                                 |
| Exécution de code côté serveur | outil `code_execution`                 | Oui                                                                 |
| Images                     | `image_generate`                          | Oui                                                                 |
| Vidéos                     | `video_generate`                          | Oui                                                                 |
| Synthèse vocale par lot    | `messages.tts.provider: "xai"` / `tts`    | Oui                                                                 |
| TTS en streaming           | -                                         | Non exposé ; le contrat TTS d’OpenClaw renvoie des tampons audio complets |
| Transcription vocale par lot | `tools.media.audio` / compréhension média | Oui                                                                 |
| Transcription vocale en streaming | Voice Call `streaming.provider: "xai"` | Oui                                                               |
| Voix en temps réel         | -                                         | Pas encore exposé ; contrat de session/WebSocket différent          |
| Fichiers / lots            | Compatibilité API de modèle générique uniquement | Pas un outil OpenClaw natif                                  |

<Note>
OpenClaw utilise les API REST image/vidéo/TTS/STT de xAI pour la génération média,
la parole et la transcription par lot, le WebSocket STT en streaming de xAI pour la transcription
d’appels vocaux en direct, et l’API Responses pour les outils de modèle, de recherche et
d’exécution de code. Les fonctionnalités qui nécessitent des contrats OpenClaw différents, comme les
sessions vocales en temps réel, sont documentées ici comme des capacités upstream plutôt que
comme un comportement masqué du Plugin.
</Note>

### Mappages du mode rapide

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
réécrit les requêtes xAI natives comme suit :

| Modèle source | Cible du mode rapide |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Alias de compatibilité hérités

Les alias hérités se normalisent toujours vers les identifiants intégrés canoniques :

| Alias hérité              | Identifiant canonique                |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Fonctionnalités

<AccordionGroup>
  <Accordion title="Web search">
    Le fournisseur de recherche web `grok` intégré préfère OAuth xAI, puis se rabat
    sur `XAI_API_KEY` ou une clé de recherche web du Plugin :

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    Le Plugin `xai` intégré enregistre la génération vidéo via l’outil partagé
    `video_generate`.

    - Modèle vidéo par défaut : `xai/grok-imagine-video`
    - Modes : texte-vers-vidéo, image-vers-vidéo, génération par image de référence, modification
      vidéo distante et extension vidéo distante
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Résolutions : `480P`, `720P`
    - Durée : 1 à 15 secondes pour la génération/image-vers-vidéo, 1 à 10 secondes lors de
      l’utilisation de rôles `reference_image`, 2 à 10 secondes pour l’extension
    - Génération par image de référence : définissez `imageRoles` sur `reference_image` pour
      chaque image fournie ; xAI accepte jusqu’à 7 images de ce type
    - Délai d’expiration par défaut de l’opération : 600 secondes, sauf si `video_generate.timeoutMs`
      ou `agents.defaults.videoGenerationModel.timeoutMs` est défini

    <Warning>
    Les tampons vidéo locaux ne sont pas acceptés. Utilisez des URL `http(s)` distantes pour
    les entrées de modification/extension vidéo. Image-vers-vidéo accepte les tampons d’images locaux, car
    OpenClaw peut les encoder en URL de données pour xAI.
    </Warning>

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
    Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés,
    la sélection du fournisseur et le comportement de bascule.
    </Note>

  </Accordion>

  <Accordion title="Image generation">
    Le Plugin `xai` intégré enregistre la génération d’images via l’outil partagé
    `image_generate`.

    - Modèle d’image par défaut : `xai/grok-imagine-image`
    - Modèle supplémentaire : `xai/grok-imagine-image-quality`
    - Modes : texte-vers-image et modification par image de référence
    - Entrées de référence : une `image` ou jusqu’à cinq `images`
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Résolutions : `1K`, `2K`
    - Nombre : jusqu’à 4 images
    - Délai d’expiration par défaut de l’opération : 600 secondes, sauf si `image_generate.timeoutMs`
      ou `agents.defaults.imageGenerationModel.timeoutMs` est défini

    OpenClaw demande à xAI des réponses d’image `b64_json` afin que les médias générés puissent être
    stockés et livrés via le chemin normal des pièces jointes de canal. Les images de référence
    locales sont converties en URL de données ; les références `http(s)` distantes sont
    transmises telles quelles.

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
    xAI documente aussi `quality`, `mask`, `user` et des ratios natifs
    supplémentaires tels que `1:2`, `2:1`, `9:20` et `20:9`. OpenClaw ne transmet
    aujourd'hui que les contrôles d'image partagés entre fournisseurs ; les réglages
    non pris en charge et propres au natif ne sont volontairement pas exposés via
    `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Synthèse vocale">
    Le Plugin `xai` inclus enregistre la synthèse vocale via la surface de
    fournisseur `tts` partagée.

    - Voix : `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voix par défaut : `eve`
    - Formats : `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Langue : code BCP-47 ou `auto`
    - Vitesse : surcharge de vitesse native du fournisseur
    - Le format natif Opus de note vocale n'est pas pris en charge

    Pour utiliser xAI comme fournisseur TTS par défaut :

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw utilise le point de terminaison xAI par lots `/v1/tts`. xAI propose
    aussi la TTS en streaming via WebSocket, mais le contrat de fournisseur vocal
    d'OpenClaw attend actuellement un tampon audio complet avant la livraison de
    la réponse.
    </Note>

  </Accordion>

  <Accordion title="Reconnaissance vocale">
    Le Plugin `xai` inclus enregistre la reconnaissance vocale par lots via la
    surface de transcription de compréhension des médias d'OpenClaw.

    - Modèle par défaut : `grok-stt`
    - Point de terminaison : REST xAI `/v1/stt`
    - Chemin d'entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, notamment les segments de canaux vocaux Discord et
      les pièces jointes audio des canaux

    Pour forcer xAI pour la transcription audio entrante :

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    La langue peut être fournie via la configuration de média audio partagée ou
    par requête de transcription. Les indications de prompt sont acceptées par la
    surface OpenClaw partagée, mais l'intégration STT REST de xAI ne transmet que
    le fichier, le modèle et la langue, car ces éléments correspondent clairement
    au point de terminaison public xAI actuel.

  </Accordion>

  <Accordion title="Reconnaissance vocale en streaming">
    Le Plugin `xai` inclus enregistre aussi un fournisseur de transcription en
    temps réel pour l'audio des appels vocaux en direct.

    - Point de terminaison : WebSocket xAI `wss://api.x.ai/v1/stt`
    - Encodage par défaut : `mulaw`
    - Fréquence d'échantillonnage par défaut : `8000`
    - Détection de fin par défaut : `800ms`
    - Transcriptions intermédiaires : activées par défaut

    Le flux média Twilio de Voice Call envoie des trames audio G.711 µ-law, donc
    le fournisseur xAI peut transmettre ces trames directement sans transcodage :

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
    `plugins.entries.voice-call.config.streaming.providers.xai`. Les clés prises
    en charge sont `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` ou
    `alaw`), `interimResults`, `endpointingMs` et `language`.

    <Note>
    Ce fournisseur de streaming concerne le chemin de transcription en temps réel
    de Voice Call. La voix Discord enregistre actuellement de courts segments et
    utilise plutôt le chemin de transcription par lots `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuration de x_search">
    Le Plugin xAI inclus expose `x_search` comme outil OpenClaw pour rechercher
    du contenu X (anciennement Twitter) via Grok.

    Chemin de configuration : `plugins.entries.xai.config.xSearch`

    | Clé                | Type    | Valeur par défaut  | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Activer ou désactiver x_search       |
    | `model`            | string  | `grok-4-1-fast`    | Modèle utilisé pour les requêtes x_search |
    | `baseUrl`          | string  | -                  | Surcharge de l'URL de base xAI Responses |
    | `inlineCitations`  | boolean | -                  | Inclure des citations en ligne dans les résultats |
    | `maxTurns`         | number  | -                  | Nombre maximal de tours de conversation |
    | `timeoutSeconds`   | number  | -                  | Délai d'expiration de la requête en secondes |
    | `cacheTtlMinutes`  | number  | -                  | Durée de vie du cache en minutes     |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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

  <Accordion title="Configuration de l'exécution de code">
    Le Plugin xAI inclus expose `code_execution` comme outil OpenClaw pour
    l'exécution de code à distance dans l'environnement sandbox de xAI.

    Chemin de configuration : `plugins.entries.xai.config.codeExecution`

    | Clé               | Type    | Valeur par défaut  | Description                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (si la clé est disponible) | Activer ou désactiver l'exécution de code |
    | `model`           | string  | `grok-4-1-fast`    | Modèle utilisé pour les requêtes d'exécution de code |
    | `maxTurns`        | number  | -                  | Nombre maximal de tours de conversation |
    | `timeoutSeconds`  | number  | -                  | Délai d'expiration de la requête en secondes |

    <Note>
    Il s'agit de l'exécution sandbox xAI à distance, pas de [`exec`](/fr/tools/exec)
    local.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limites connues">
    - L'authentification xAI peut utiliser une clé d'API, une variable
      d'environnement, un repli de configuration du Plugin ou OAuth avec un
      compte xAI éligible. OAuth utilise une vérification par code d'appareil
      sans rappel localhost. xAI décide quels comptes peuvent recevoir des
      jetons d'API OAuth, et la page de consentement peut afficher Grok Build
      même si OpenClaw n'exige pas l'application Grok Build.
    - OpenClaw n'expose pas actuellement la famille de modèles multi-agents de
      xAI. xAI sert ces modèles via l'API Responses, mais ils n'acceptent pas les
      outils côté client ni les outils personnalisés utilisés par la boucle
      d'agent partagée d'OpenClaw. Consultez les
      [limites multi-agents de xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - La voix Realtime de xAI n'est pas encore enregistrée comme fournisseur
      OpenClaw. Elle nécessite un contrat de session vocale bidirectionnelle
      différent de la STT par lots ou de la transcription en streaming.
    - Les options d'image xAI `quality`, `mask` et les ratios d'aspect
      supplémentaires uniquement natifs ne sont pas exposés tant que l'outil
      partagé `image_generate` ne dispose pas de contrôles correspondants
      entre fournisseurs.
  </Accordion>

  <Accordion title="Notes avancées">
    - OpenClaw applique automatiquement les correctifs de compatibilité de schéma
      d'outils et d'appels d'outils propres à xAI sur le chemin du lanceur partagé.
    - Les requêtes xAI natives utilisent par défaut `tool_stream: true`. Définissez
      `agents.defaults.models["xai/<model>"].params.tool_stream` sur `false` pour
      le désactiver.
    - Le wrapper xAI inclus retire les indicateurs stricts de schéma d'outils non
      pris en charge et les clés de charge utile de raisonnement *effort* avant
      d'envoyer les requêtes xAI natives. Seuls `grok-4.3` / `grok-4.3-*`
      annoncent un effort de raisonnement configurable ; tous les autres modèles
      xAI capables de raisonnement demandent toujours
      `include: ["reasoning.encrypted_content"]` afin que le raisonnement chiffré
      précédent puisse être rejoué lors des tours suivants.
    - `web_search`, `x_search` et `code_execution` sont exposés comme outils
      OpenClaw. OpenClaw active l'intégration xAI intégrée précise dont il a
      besoin dans chaque requête d'outil au lieu d'attacher tous les outils
      natifs à chaque tour de chat.
    - Le `web_search` de Grok lit `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lit `plugins.entries.xai.config.xSearch.baseUrl`, puis se replie
      sur l'URL de base de recherche Web Grok.
    - `x_search` et `code_execution` appartiennent au Plugin xAI inclus plutôt
      que d'être codés en dur dans le runtime de modèle principal.
    - `code_execution` est l'exécution sandbox xAI à distance, pas
      [`exec`](/fr/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Tests en direct

Les chemins média xAI sont couverts par des tests unitaires et des suites en
direct à activation explicite. Exportez `XAI_API_KEY` dans l'environnement du
processus avant d'exécuter les sondes en direct.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Le fichier en direct propre au fournisseur synthétise une TTS normale, une TTS
PCM adaptée à la téléphonie, transcrit l'audio via la STT par lots de xAI,
diffuse le même PCM via la STT en temps réel de xAI, génère une sortie texte vers
image et modifie une image de référence. Le fichier en direct d'image partagé
vérifie le même fournisseur xAI via le chemin de sélection du runtime, de repli,
de normalisation et de pièce jointe média d'OpenClaw.

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de bascule.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres d'outil vidéo partagés et sélection du fournisseur.
  </Card>
  <Card title="Tous les fournisseurs" href="/fr/providers/index" icon="grid-2">
    Vue d'ensemble plus large des fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et correctifs.
  </Card>
</CardGroup>
