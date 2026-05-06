---
read_when:
    - Vous souhaitez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou des identifiants de modèle
summary: Utiliser les modèles xAI Grok dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-06T07:37:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw fournit un Plugin de fournisseur `xai` intégré pour les modèles Grok.

## Bien démarrer

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
OpenClaw utilise l’API xAI Responses comme transport xAI intégré. Le même
`XAI_API_KEY` peut également alimenter `web_search` adossé à Grok, `x_search`
de première classe, et `code_execution` distant.
Si vous stockez une clé xAI sous `plugins.entries.xai.config.webSearch.apiKey`,
le fournisseur de modèles xAI intégré réutilise aussi cette clé comme solution de repli.
Définissez `plugins.entries.xai.config.webSearch.baseUrl` pour acheminer `web_search`
de Grok et, par défaut, `x_search` via un proxy xAI Responses d’opérateur.
Le réglage de `code_execution` se trouve sous `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogue intégré

OpenClaw inclut ces familles de modèles xAI prêtes à l’emploi :

| Famille        | Identifiants de modèles                                                    |
| -------------- | -------------------------------------------------------------------------- |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                 |
| Grok 4.3       | `grok-4.3`                                                                 |
| Grok 4         | `grok-4`, `grok-4-0709`                                                    |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                                 |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                             |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`   |
| Grok Code      | `grok-code-fast-1`                                                         |

Le Plugin résout aussi vers l’avant les identifiants `grok-4*` et
`grok-code-fast*` plus récents lorsqu’ils suivent la même forme d’API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast`, et les variantes
`grok-4.20-beta-*` sont les références Grok actuellement compatibles avec les images
dans le catalogue intégré.
</Tip>

## Couverture des fonctionnalités OpenClaw

Le Plugin intégré mappe la surface actuelle de l’API publique de xAI sur les
contrats partagés de fournisseur et d’outils d’OpenClaw. Les capacités qui ne
correspondent pas au contrat partagé (par exemple le TTS en streaming et la voix
en temps réel) ne sont pas exposées - voir le tableau ci-dessous.

| Capacité xAI                 | Surface OpenClaw                          | Statut                                                              |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses             | fournisseur de modèles `xai/<model>`      | Oui                                                                 |
| Recherche web côté serveur   | fournisseur `web_search` `grok`           | Oui                                                                 |
| Recherche X côté serveur     | outil `x_search`                          | Oui                                                                 |
| Exécution de code côté serveur | outil `code_execution`                  | Oui                                                                 |
| Images                       | `image_generate`                          | Oui                                                                 |
| Vidéos                       | `video_generate`                          | Oui                                                                 |
| Synthèse vocale par lot      | `messages.tts.provider: "xai"` / `tts`    | Oui                                                                 |
| TTS en streaming             | -                                         | Non exposé ; le contrat TTS d’OpenClaw renvoie des tampons audio complets |
| Reconnaissance vocale par lot | `tools.media.audio` / compréhension média | Oui                                                               |
| Reconnaissance vocale en streaming | Voice Call `streaming.provider: "xai"` | Oui                                                              |
| Voix en temps réel           | -                                         | Pas encore exposée ; contrat de session/WebSocket différent         |
| Fichiers / lots              | Compatibilité API de modèle générique seulement | Pas un outil OpenClaw de première classe                       |

<Note>
OpenClaw utilise les API REST image/vidéo/TTS/STT de xAI pour la génération de médias,
la parole et la transcription par lot, le WebSocket STT en streaming de xAI pour la
transcription des appels vocaux en direct, et l’API Responses pour les outils de modèle,
de recherche et d’exécution de code. Les fonctionnalités qui nécessitent des contrats
OpenClaw différents, comme les sessions vocales en temps réel, sont documentées ici
comme des capacités en amont plutôt que comme un comportement masqué du Plugin.
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

Les alias hérités sont toujours normalisés vers les identifiants intégrés canoniques :

| Alias hérité              | Identifiant canonique                 |
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

  <Accordion title="Génération de vidéos">
    Le Plugin `xai` intégré enregistre la génération de vidéos via l’outil partagé
    `video_generate`.

    - Modèle vidéo par défaut : `xai/grok-imagine-video`
    - Modes : texte-vers-vidéo, image-vers-vidéo, génération avec image de référence, modification de vidéo distante, et extension de vidéo distante
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Résolutions : `480P`, `720P`
    - Durée : 1 à 15 secondes pour la génération/image-vers-vidéo, 1 à 10 secondes lors de l’utilisation de rôles `reference_image`, 2 à 10 secondes pour l’extension
    - Génération avec image de référence : définissez `imageRoles` sur `reference_image` pour chaque image fournie ; xAI accepte jusqu’à 7 images de ce type

    <Warning>
    Les tampons vidéo locaux ne sont pas acceptés. Utilisez des URL `http(s)` distantes pour
    les entrées de modification/extension de vidéo. Image-vers-vidéo accepte les tampons d’images locaux, car
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
    Consultez [Génération de vidéos](/fr/tools/video-generation) pour les paramètres d’outil partagés,
    la sélection du fournisseur et le comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Génération d’images">
    Le Plugin `xai` intégré enregistre la génération d’images via l’outil partagé
    `image_generate`.

    - Modèle d’image par défaut : `xai/grok-imagine-image`
    - Modèle supplémentaire : `xai/grok-imagine-image-pro`
    - Modes : texte-vers-image et modification avec image de référence
    - Entrées de référence : une `image` ou jusqu’à cinq `images`
    - Formats d’image : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Résolutions : `1K`, `2K`
    - Nombre : jusqu’à 4 images

    OpenClaw demande à xAI des réponses d’image `b64_json`, afin que les médias générés puissent être
    stockés et livrés via le chemin normal des pièces jointes de canal. Les images de référence locales
    sont converties en URL de données ; les références `http(s)` distantes sont transmises telles quelles.

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
    xAI documente aussi `quality`, `mask`, `user`, et des formats natifs supplémentaires
    comme `1:2`, `2:1`, `9:20`, et `20:9`. OpenClaw transmet aujourd’hui uniquement les
    contrôles d’image partagés entre fournisseurs ; les réglages non pris en charge propres au fournisseur
    ne sont volontairement pas exposés via `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Synthèse vocale">
    Le Plugin `xai` intégré enregistre la synthèse vocale via la surface partagée de fournisseur `tts`.

    - Voix : `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voix par défaut : `eve`
    - Formats : `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Langue : code BCP-47 ou `auto`
    - Vitesse : remplacement de vitesse natif du fournisseur
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
    via WebSocket, mais le contrat du fournisseur de parole OpenClaw attend actuellement
    un tampon audio complet avant la livraison de la réponse.
    </Note>

  </Accordion>

  <Accordion title="Reconnaissance vocale">
    Le Plugin `xai` intégré enregistre la reconnaissance vocale par lot via la surface de transcription
    de compréhension média d’OpenClaw.

    - Modèle par défaut : `grok-stt`
    - Point de terminaison : REST xAI `/v1/stt`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de canal vocal Discord et
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
    transcription individuelle. Les indications de prompt sont acceptées par la surface OpenClaw
    partagée, mais l’intégration REST STT xAI ne transmet que le fichier, le modèle et
    la langue, car ils correspondent clairement au point de terminaison public xAI actuel.

  </Accordion>

  <Accordion title="Reconnaissance vocale en streaming">
    Le Plugin `xai` intégré enregistre aussi un fournisseur de transcription en temps réel
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

    La configuration détenue par le fournisseur se trouve sous
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
    Le plugin xAI groupé expose `x_search` comme outil OpenClaw pour rechercher du
    contenu X (anciennement Twitter) via Grok.

    Chemin de configuration : `plugins.entries.xai.config.xSearch`

    | Clé                | Type    | Valeur par défaut  | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Activer ou désactiver x_search       |
    | `model`            | string  | `grok-4-1-fast`    | Modèle utilisé pour les requêtes x_search |
    | `baseUrl`          | string  | -                  | Remplacement de l’URL de base xAI Responses |
    | `inlineCitations`  | boolean | -                  | Inclure des citations en ligne dans les résultats |
    | `maxTurns`         | number  | -                  | Nombre maximal de tours de conversation |
    | `timeoutSeconds`   | number  | -                  | Délai d’expiration de la requête en secondes |
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

  <Accordion title="Configuration de l’exécution de code">
    Le plugin xAI groupé expose `code_execution` comme outil OpenClaw pour
    l’exécution de code à distance dans l’environnement sandbox de xAI.

    Chemin de configuration : `plugins.entries.xai.config.codeExecution`

    | Clé               | Type    | Valeur par défaut  | Description                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (si la clé est disponible) | Activer ou désactiver l’exécution de code |
    | `model`           | string  | `grok-4-1-fast`    | Modèle utilisé pour les requêtes d’exécution de code |
    | `maxTurns`        | number  | -                  | Nombre maximal de tours de conversation |
    | `timeoutSeconds`  | number  | -                  | Délai d’expiration de la requête en secondes |

    <Note>
    Il s’agit de l’exécution sandbox xAI à distance, et non de [`exec`](/fr/tools/exec) local.
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
    - L’authentification utilise uniquement une clé API aujourd’hui. Il n’existe
      pas encore de flux OAuth xAI ni de flux par code d’appareil dans OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` n’est pas pris en charge sur le
      chemin normal du fournisseur xAI, car il nécessite une surface d’API amont
      différente du transport xAI standard d’OpenClaw.
    - La voix xAI Realtime n’est pas encore enregistrée comme fournisseur OpenClaw. Elle
      nécessite un contrat de session vocale bidirectionnelle différent de la STT par lot ou
      de la transcription en streaming.
    - La `quality` d’image xAI, le `mask` d’image et les proportions supplémentaires propres au natif ne sont
      pas exposés tant que l’outil partagé `image_generate` ne dispose pas des
      contrôles inter-fournisseurs correspondants.
  </Accordion>

  <Accordion title="Notes avancées">
    - OpenClaw applique automatiquement les correctifs de compatibilité xAI propres aux schémas d’outils et aux appels d’outils
      sur le chemin du runner partagé.
    - Les requêtes xAI natives utilisent `tool_stream: true` par défaut. Définissez
      `agents.defaults.models["xai/<model>"].params.tool_stream` sur `false` pour
      le désactiver.
    - Le wrapper xAI groupé supprime les indicateurs stricts de schéma d’outil non pris en charge et
      les clés de charge utile de raisonnement avant d’envoyer les requêtes xAI natives.
    - `web_search`, `x_search` et `code_execution` sont exposés comme outils OpenClaw.
      OpenClaw active l’intégration xAI spécifique dont il a besoin dans chaque requête d’outil
      au lieu d’attacher tous les outils natifs à chaque tour de discussion.
    - Le `web_search` de Grok lit `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lit `plugins.entries.xai.config.xSearch.baseUrl`, puis
      se replie sur l’URL de base de la recherche web Grok.
    - `x_search` et `code_execution` appartiennent au plugin xAI groupé plutôt
      que d’être codés en dur dans le runtime du modèle principal.
    - `code_execution` est une exécution sandbox xAI à distance, et non
      [`exec`](/fr/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Tests live

Les chemins multimédias xAI sont couverts par des tests unitaires et des suites live à activer explicitement. Les commandes live
chargent les secrets depuis votre shell de connexion, y compris `~/.profile`, avant
de sonder `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Le fichier live propre au fournisseur synthétise du TTS normal, du TTS PCM adapté à la téléphonie,
transcrit l’audio via la STT par lot xAI, diffuse le même PCM via la STT
en temps réel de xAI, génère une sortie texte-vers-image et modifie une image de référence. Le
fichier live d’image partagé vérifie le même fournisseur xAI via le chemin de
sélection du runtime, de repli, de normalisation et de pièce jointe multimédia d’OpenClaw.

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil vidéo partagé et sélection du fournisseur.
  </Card>
  <Card title="Tous les fournisseurs" href="/fr/providers/index" icon="grid-2">
    Vue d’ensemble élargie des fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et correctifs.
  </Card>
</CardGroup>
