---
read_when:
    - Vous souhaitez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou les identifiants de modèle
summary: Utiliser les modèles xAI Grok dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T07:17:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw fournit un plugin fournisseur `xai` intégré pour les modèles Grok.

## Premiers pas

<Steps>
  <Step title="Créer une clé API">
    Créez une clé API dans la [console xAI](https://console.x.ai/).
  </Step>
  <Step title="Définir votre clé API">
    Définissez `XAI_API_KEY`, ou exécutez :

    ```bash
    openclaw onboard --auth-choice xai-api-key
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
OpenClaw utilise l’API Responses de xAI comme transport xAI intégré. La même
`XAI_API_KEY` peut aussi alimenter `web_search` avec Grok, `x_search` de premier
ordre, et `code_execution` distant.
Si vous stockez une clé xAI sous `plugins.entries.xai.config.webSearch.apiKey`,
le fournisseur de modèles xAI intégré réutilise aussi cette clé comme solution de repli.
Définissez `plugins.entries.xai.config.webSearch.baseUrl` pour acheminer `web_search`
Grok et, par défaut, `x_search` via un proxy xAI Responses d’opérateur.
Le réglage de `code_execution` se trouve sous `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogue intégré

OpenClaw inclut ces familles de modèles xAI par défaut :

| Famille       | ID de modèles                                                            |
| ------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Le plugin résout aussi vers l’avant les nouveaux ID `grok-4*` et `grok-code-fast*`
lorsqu’ils suivent la même forme d’API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast`, et les variantes `grok-4.20-beta-*`
sont les références Grok actuellement compatibles avec les images dans le catalogue intégré.
</Tip>

## Couverture des fonctionnalités OpenClaw

Le plugin intégré mappe la surface actuelle de l’API publique de xAI sur les
contrats partagés de fournisseur et d’outils d’OpenClaw. Les capacités qui ne
correspondent pas au contrat partagé (par exemple le TTS en streaming et la voix
en temps réel) ne sont pas exposées — voir le tableau ci-dessous.

| Capacité xAI                 | Surface OpenClaw                         | État                                                                   |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses             | Fournisseur de modèle `xai/<model>`      | Oui                                                                    |
| Recherche web côté serveur   | Fournisseur `web_search` `grok`          | Oui                                                                    |
| Recherche X côté serveur     | Outil `x_search`                         | Oui                                                                    |
| Exécution de code côté serveur | Outil `code_execution`                 | Oui                                                                    |
| Images                       | `image_generate`                         | Oui                                                                    |
| Vidéos                       | `video_generate`                         | Oui                                                                    |
| Texte vers parole par lot    | `messages.tts.provider: "xai"` / `tts`   | Oui                                                                    |
| TTS en streaming             | —                                        | Non exposé ; le contrat TTS d’OpenClaw renvoie des tampons audio complets |
| Parole vers texte par lot    | `tools.media.audio` / compréhension média | Oui                                                                  |
| Parole vers texte en streaming | Voice Call `streaming.provider: "xai"` | Oui                                                                    |
| Voix en temps réel           | —                                        | Pas encore exposée ; contrat de session/WebSocket différent            |
| Fichiers / lots              | Compatibilité avec l’API de modèle générique uniquement | Pas un outil OpenClaw de premier ordre                    |

<Note>
OpenClaw utilise les API REST image/vidéo/TTS/STT de xAI pour la génération de
médias, la parole et la transcription par lot, le WebSocket STT en streaming de
xAI pour la transcription d’appels vocaux en direct, et l’API Responses pour les
outils de modèle, recherche et exécution de code. Les fonctionnalités qui
nécessitent des contrats OpenClaw différents, comme les sessions vocales en
temps réel, sont documentées ici comme des capacités amont plutôt que comme un
comportement caché du plugin.
</Note>

### Mappages du mode rapide

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
réécrit les requêtes xAI natives comme suit :

| Modèle source | Cible du mode rapide |
| ------------- | -------------------- |
| `grok-3`      | `grok-3-fast`        |
| `grok-3-mini` | `grok-3-mini-fast`   |
| `grok-4`      | `grok-4-fast`        |
| `grok-4-0709` | `grok-4-fast`        |

### Alias de compatibilité hérités

Les alias hérités sont toujours normalisés vers les ID intégrés canoniques :

| Alias hérité              | ID canonique                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Fonctionnalités

<AccordionGroup>
  <Accordion title="Recherche web">
    Le fournisseur de recherche web `grok` intégré utilise aussi `XAI_API_KEY` :

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Génération vidéo">
    Le plugin `xai` intégré enregistre la génération vidéo via l’outil partagé
    `video_generate`.

    - Modèle vidéo par défaut : `xai/grok-imagine-video`
    - Modes : texte vers vidéo, image vers vidéo, génération à partir d’image
      de référence, modification vidéo distante et extension vidéo distante
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Résolutions : `480P`, `720P`
    - Durée : 1 à 15 secondes pour la génération/image vers vidéo, 1 à 10 secondes lors de
      l’utilisation de rôles `reference_image`, 2 à 10 secondes pour l’extension
    - Génération à partir d’image de référence : définissez `imageRoles` sur `reference_image` pour
      chaque image fournie ; xAI accepte jusqu’à 7 images de ce type

    <Warning>
    Les tampons vidéo locaux ne sont pas acceptés. Utilisez des URL `http(s)` distantes pour
    les entrées de modification/extension vidéo. L’image vers vidéo accepte les tampons d’images locaux, car
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
    la sélection du fournisseur et le comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Génération d’images">
    Le plugin `xai` intégré enregistre la génération d’images via l’outil partagé
    `image_generate`.

    - Modèle d’image par défaut : `xai/grok-imagine-image`
    - Modèle supplémentaire : `xai/grok-imagine-image-pro`
    - Modes : texte vers image et modification d’image de référence
    - Entrées de référence : une `image` ou jusqu’à cinq `images`
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Résolutions : `1K`, `2K`
    - Nombre : jusqu’à 4 images

    OpenClaw demande à xAI des réponses d’image `b64_json` afin que les médias générés puissent être
    stockés et remis via le chemin normal des pièces jointes de canal. Les images de référence
    locales sont converties en URL de données ; les références distantes `http(s)` sont
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
    xAI documente aussi `quality`, `mask`, `user` et des formats natifs supplémentaires
    tels que `1:2`, `2:1`, `9:20` et `20:9`. OpenClaw ne transmet aujourd’hui que les
    contrôles d’image partagés entre fournisseurs ; les réglages natifs uniquement non pris en charge
    ne sont volontairement pas exposés via `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texte vers parole">
    Le plugin `xai` intégré enregistre le texte vers parole via la surface de fournisseur `tts`
    partagée.

    - Voix : `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voix par défaut : `eve`
    - Formats : `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Langue : code BCP-47 ou `auto`
    - Vitesse : remplacement de vitesse natif au fournisseur
    - Le format natif de note vocale Opus n’est pas pris en charge

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
    OpenClaw utilise le point de terminaison par lot `/v1/tts` de xAI. xAI propose aussi le TTS en streaming
    via WebSocket, mais le contrat de fournisseur vocal OpenClaw attend actuellement
    un tampon audio complet avant la remise de la réponse.
    </Note>

  </Accordion>

  <Accordion title="Parole vers texte">
    Le plugin `xai` intégré enregistre la parole vers texte par lot via la surface de transcription
    de compréhension média d’OpenClaw.

    - Modèle par défaut : `grok-stt`
    - Point de terminaison : REST xAI `/v1/stt`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de canaux vocaux Discord et
      les pièces jointes audio de canal

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

    La langue peut être fournie via la configuration média audio partagée ou par requête de
    transcription par appel. Les indications de prompt sont acceptées par la surface OpenClaw
    partagée, mais l’intégration REST STT xAI ne transmet que le fichier, le modèle et
    la langue, car ceux-ci correspondent clairement au point de terminaison public actuel de xAI.

  </Accordion>

  <Accordion title="Parole vers texte en streaming">
    Le plugin `xai` intégré enregistre aussi un fournisseur de transcription en temps réel
    pour l’audio des appels vocaux en direct.

    - Point de terminaison : WebSocket xAI `wss://api.x.ai/v1/stt`
    - Encodage par défaut : `mulaw`
    - Taux d’échantillonnage par défaut : `8000`
    - Détection de fin de parole par défaut : `800ms`
    - Transcriptions intermédiaires : activées par défaut

    Le flux média Twilio de Voice Call envoie des trames audio G.711 µ-law, le
    fournisseur xAI peut donc transmettre ces trames directement sans transcodage :

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

    La configuration propre au fournisseur se trouve sous
    `plugins.entries.voice-call.config.streaming.providers.xai`. Les clés prises
    en charge sont `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` ou
    `alaw`), `interimResults`, `endpointingMs` et `language`.

    <Note>
    Ce fournisseur de streaming est destiné au chemin de transcription en temps réel de Voice Call.
    La voix Discord enregistre actuellement de courts segments et utilise plutôt le chemin de
    transcription par lot `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuration de x_search">
    Le plugin xAI intégré expose `x_search` comme outil OpenClaw pour rechercher
    du contenu X (anciennement Twitter) via Grok.

    Chemin de configuration : `plugins.entries.xai.config.xSearch`

    | Clé                | Type    | Valeur par défaut  | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Activer ou désactiver x_search       |
    | `model`            | string  | `grok-4-1-fast`    | Modèle utilisé pour les requêtes x_search |
    | `baseUrl`          | string  | —                  | Remplacement de l’URL de base xAI Responses |
    | `inlineCitations`  | boolean | —                  | Inclure des citations intégrées dans les résultats |
    | `maxTurns`         | number  | —                  | Nombre maximal de tours de conversation |
    | `timeoutSeconds`   | number  | —                  | Délai d’expiration de la requête en secondes |
    | `cacheTtlMinutes`  | number  | —                  | Durée de vie du cache en minutes     |

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

  <Accordion title="Configuration de l’exécution de code">
    Le plugin xAI intégré expose `code_execution` comme outil OpenClaw pour
    l’exécution de code à distance dans l’environnement sandbox de xAI.

    Chemin de configuration : `plugins.entries.xai.config.codeExecution`

    | Clé               | Type    | Valeur par défaut  | Description                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (si la clé est disponible) | Activer ou désactiver l’exécution de code |
    | `model`           | string  | `grok-4-1-fast`    | Modèle utilisé pour les requêtes d’exécution de code |
    | `maxTurns`        | number  | —                  | Nombre maximal de tours de conversation |
    | `timeoutSeconds`  | number  | —                  | Délai d’expiration de la requête en secondes |

    <Note>
    Il s’agit de l’exécution à distance dans le sandbox xAI, et non de [`exec`](/fr/tools/exec) local.
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
    - L’authentification se fait uniquement par clé d’API aujourd’hui. Il n’existe pas encore de flux OAuth xAI ni de flux par code d’appareil dans
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` n’est pas pris en charge sur le
      chemin normal du fournisseur xAI, car il nécessite une surface d’API amont
      différente de celle du transport xAI standard d’OpenClaw.
    - La voix xAI Realtime n’est pas encore enregistrée comme fournisseur OpenClaw. Elle
      nécessite un contrat de session vocale bidirectionnelle différent de la STT par lot ou de
      la transcription en streaming.
    - Les options d’image xAI `quality`, `mask` d’image et les formats d’image supplémentaires propres au natif ne sont
      pas exposés tant que l’outil partagé `image_generate` ne dispose pas des
      contrôles inter-fournisseurs correspondants.
  </Accordion>

  <Accordion title="Notes avancées">
    - OpenClaw applique automatiquement les correctifs de compatibilité xAI propres aux schémas d’outils et aux appels d’outils
      sur le chemin du runner partagé.
    - Les requêtes xAI natives utilisent `tool_stream: true` par défaut. Définissez
      `agents.defaults.models["xai/<model>"].params.tool_stream` sur `false` pour
      le désactiver.
    - Le wrapper xAI intégré supprime les indicateurs stricts de schéma d’outil non pris en charge et
      les clés de charge utile de raisonnement avant d’envoyer les requêtes xAI natives.
    - `web_search`, `x_search` et `code_execution` sont exposés comme outils OpenClaw.
      OpenClaw active l’outil intégré xAI précis dont il a besoin dans chaque requête d’outil
      au lieu d’attacher tous les outils natifs à chaque tour de chat.
    - Grok `web_search` lit `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lit `plugins.entries.xai.config.xSearch.baseUrl`, puis
      se rabat sur l’URL de base de recherche web Grok.
    - `x_search` et `code_execution` appartiennent au plugin xAI intégré plutôt
      qu’être codés en dur dans le runtime du modèle central.
    - `code_execution` est l’exécution à distance dans le sandbox xAI, et non
      [`exec`](/fr/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Tests en direct

Les chemins multimédias xAI sont couverts par des tests unitaires et des suites en direct activables. Les
commandes en direct chargent les secrets depuis votre shell de connexion, y compris `~/.profile`, avant
de sonder `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Le fichier en direct propre au fournisseur synthétise une TTS normale, une TTS PCM adaptée à la téléphonie,
transcrit l’audio via la STT par lot de xAI, diffuse le même PCM via la STT
en temps réel de xAI, génère une sortie texte-vers-image et modifie une image de référence. Le
fichier d’image en direct partagé vérifie le même fournisseur xAI via le chemin de
sélection du runtime, de repli, de normalisation et de pièce jointe multimédia d’OpenClaw.

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil vidéo partagé et sélection du fournisseur.
  </Card>
  <Card title="Tous les fournisseurs" href="/fr/providers/index" icon="grid-2">
    Vue d’ensemble plus large des fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et correctifs.
  </Card>
</CardGroup>
