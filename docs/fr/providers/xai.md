---
read_when:
    - Vous souhaitez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou les IDs de modèle
summary: Utiliser les modèles Grok de xAI dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T07:10:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw fournit un plugin fournisseur intégré `xai` pour les modèles Grok.

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
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw utilise l’API Responses de xAI comme transport xAI intégré. La même
`XAI_API_KEY` peut aussi alimenter `web_search` adossé à Grok, `x_search` natif,
et `code_execution` distant.
Si vous stockez une clé xAI sous `plugins.entries.xai.config.webSearch.apiKey`,
le fournisseur de modèles xAI intégré réutilise aussi cette clé comme repli.
Le réglage de `code_execution` se trouve sous `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogue de modèles intégrés

OpenClaw inclut ces familles de modèles xAI prêtes à l’emploi :

| Famille        | IDs de modèle                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Le plugin résout aussi vers l’avant les IDs plus récents `grok-4*` et `grok-code-fast*` lorsqu’ils
suivent la même forme d’API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` et les variantes `grok-4.20-beta-*` sont les
références Grok actuellement compatibles image dans le catalogue intégré.
</Tip>

## Couverture des fonctionnalités OpenClaw

Le plugin intégré mappe la surface d’API publique actuelle de xAI sur les contrats partagés
de fournisseur et d’outil d’OpenClaw là où le comportement s’intègre proprement.

| Capacité xAI               | Surface OpenClaw                         | Statut                                                              |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Discussion / Responses     | fournisseur de modèles `xai/<model>`     | Oui                                                                 |
| Recherche web côté serveur | fournisseur `web_search` `grok`          | Oui                                                                 |
| Recherche X côté serveur   | outil `x_search`                         | Oui                                                                 |
| Exécution de code côté serveur | outil `code_execution`               | Oui                                                                 |
| Images                     | `image_generate`                         | Oui                                                                 |
| Vidéos                     | `video_generate`                         | Oui                                                                 |
| Synthèse vocale par lot    | `messages.tts.provider: "xai"` / `tts`   | Oui                                                                 |
| TTS en streaming           | —                                        | Non exposé ; le contrat TTS d’OpenClaw renvoie des buffers audio complets |
| Speech-to-text par lot     | `tools.media.audio` / compréhension des médias | Oui                                                             |
| Speech-to-text en streaming | Voice Call `streaming.provider: "xai"`  | Oui                                                                 |
| Voix temps réel            | —                                        | Pas encore exposé ; contrat de session/WebSocket différent          |
| Fichiers / lots            | Compatibilité API modèle générique uniquement | Pas un outil OpenClaw de première classe                         |

<Note>
OpenClaw utilise les API REST image/vidéo/TTS/STT de xAI pour la génération de médias,
la parole et la transcription par lot, le WebSocket STT en streaming de xAI pour la
transcription Voice Call en direct, et l’API Responses pour les outils de modèle, recherche et
exécution de code. Les fonctionnalités qui nécessitent des contrats OpenClaw différents, comme les
sessions vocales en temps réel, sont documentées ici comme capacités amont plutôt que comme
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

### Aliases de compatibilité hérités

Les aliases hérités se normalisent toujours vers les IDs intégrés canoniques :

| Alias hérité              | ID canonique                           |
| ------------------------- | -------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                          |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                        |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`      |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning`  |

## Fonctionnalités

<AccordionGroup>
  <Accordion title="Recherche web">
    Le fournisseur de recherche web intégré `grok` utilise aussi `XAI_API_KEY` :

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Génération de vidéo">
    Le plugin intégré `xai` enregistre la génération de vidéo via l’outil partagé
    `video_generate`.

    - Modèle vidéo par défaut : `xai/grok-imagine-video`
    - Modes : texte-vers-vidéo, image-vers-vidéo, édition vidéo distante et extension
      vidéo distante
    - Rapports d’aspect : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Résolutions : `480P`, `720P`
    - Durée : 1 à 15 secondes pour la génération/image-vers-vidéo, 2 à 10 secondes pour
      l’extension

    <Warning>
    Les buffers vidéo locaux ne sont pas acceptés. Utilisez des URL `http(s)` distantes pour les
    entrées d’édition/extension vidéo. Image-vers-vidéo accepte les buffers d’image locaux car
    OpenClaw peut les encoder en data URLs pour xAI.
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
    Voir [Génération de vidéo](/fr/tools/video-generation) pour les paramètres partagés d’outil,
    la sélection du fournisseur et le comportement de repli.
    </Note>

  </Accordion>

  <Accordion title="Génération d’image">
    Le plugin intégré `xai` enregistre la génération d’image via l’outil partagé
    `image_generate`.

    - Modèle d’image par défaut : `xai/grok-imagine-image`
    - Modèle supplémentaire : `xai/grok-imagine-image-pro`
    - Modes : texte-vers-image et édition à partir d’image de référence
    - Entrées de référence : une `image` ou jusqu’à cinq `images`
    - Rapports d’aspect : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Résolutions : `1K`, `2K`
    - Nombre : jusqu’à 4 images

    OpenClaw demande à xAI des réponses d’image `b64_json` afin que les médias générés puissent être
    stockés et livrés via le chemin normal des pièces jointes de canal. Les images de référence
    locales sont converties en data URLs ; les références distantes `http(s)` sont
    transmises telles quelles.

    Pour utiliser xAI comme fournisseur d’image par défaut :

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
    xAI documente aussi `quality`, `mask`, `user`, et des ratios natifs supplémentaires
    comme `1:2`, `2:1`, `9:20` et `20:9`. OpenClaw ne transmet aujourd’hui que les
    contrôles d’image partagés inter-fournisseurs ; les paramètres natifs non pris en charge
    sont volontairement non exposés via `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Synthèse vocale">
    Le plugin intégré `xai` enregistre la synthèse vocale via la surface partagée du fournisseur
    `tts`.

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
    OpenClaw utilise l’endpoint batch `/v1/tts` de xAI. xAI propose aussi du TTS en streaming
    via WebSocket, mais le contrat actuel du fournisseur de parole OpenClaw attend
    un buffer audio complet avant la livraison de la réponse.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Le plugin intégré `xai` enregistre le speech-to-text par lot via la
    surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `grok-stt`
    - Endpoint : REST xAI `/v1/stt`
    - Chemin d’entrée : téléversement multipart de fichier audio
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de canal vocal Discord et
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

    La langue peut être fournie via la configuration média audio partagée ou par
    requête de transcription par appel. Les indications de prompt sont acceptées par la surface partagée
    OpenClaw, mais l’intégration REST STT xAI ne transmet que le fichier, le modèle et
    la langue parce que ce sont les éléments qui correspondent proprement à l’endpoint public xAI actuel.

  </Accordion>

  <Accordion title="Speech-to-text en streaming">
    Le plugin intégré `xai` enregistre aussi un fournisseur de transcription temps réel
    pour l’audio Voice Call en direct.

    - Endpoint : WebSocket xAI `wss://api.x.ai/v1/stt`
    - Encodage par défaut : `mulaw`
    - Fréquence d’échantillonnage par défaut : `8000`
    - Fin de phrase par défaut : `800ms`
    - Transcriptions intermédiaires : activées par défaut

    Le flux média Twilio de Voice Call envoie des trames audio G.711 µ-law, donc le
    fournisseur xAI peut transmettre directement ces trames sans transcodage :

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
    `plugins.entries.voice-call.config.streaming.providers.xai`. Les
    clés prises en charge sont `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, ou
    `alaw`), `interimResults`, `endpointingMs`, et `language`.

    <Note>
    Ce fournisseur en streaming est destiné au chemin de transcription temps réel de Voice Call.
    La voix Discord enregistre actuellement de courts segments et utilise à la place le chemin de transcription par lot
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuration `x_search`">
    Le plugin xAI intégré expose `x_search` comme outil OpenClaw pour rechercher
    du contenu X (anciennement Twitter) via Grok.

    Chemin de configuration : `plugins.entries.xai.config.xSearch`

    | Clé                | Type    | Par défaut         | Description                              |
    | ------------------ | ------- | ------------------ | ---------------------------------------- |
    | `enabled`          | boolean | —                  | Activer ou désactiver `x_search`         |
    | `model`            | string  | `grok-4-1-fast`    | Modèle utilisé pour les requêtes `x_search` |
    | `inlineCitations`  | boolean | —                  | Inclure des citations inline dans les résultats |
    | `maxTurns`         | number  | —                  | Nombre maximal de tours de conversation  |
    | `timeoutSeconds`   | number  | —                  | Timeout de requête en secondes           |
    | `cacheTtlMinutes`  | number  | —                  | Durée de vie du cache en minutes         |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    l’exécution de code distante dans l’environnement sandbox de xAI.

    Chemin de configuration : `plugins.entries.xai.config.codeExecution`

    | Clé               | Type    | Par défaut                  | Description                                 |
    | ----------------- | ------- | --------------------------- | ------------------------------------------- |
    | `enabled`         | boolean | `true` (si une clé est disponible) | Activer ou désactiver l’exécution de code |
    | `model`           | string  | `grok-4-1-fast`             | Modèle utilisé pour les requêtes d’exécution de code |
    | `maxTurns`        | number  | —                           | Nombre maximal de tours de conversation     |
    | `timeoutSeconds`  | number  | —                           | Timeout de requête en secondes              |

    <Note>
    Il s’agit d’une exécution sandbox xAI distante, et non de [`exec`](/fr/tools/exec) local.
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
    - L’authentification repose aujourd’hui uniquement sur la clé API. Il n’existe pas encore de flux OAuth ou device-code xAI dans
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` n’est pas pris en charge sur le
      chemin fournisseur xAI normal car il nécessite une surface d’API amont différente de celle du transport xAI standard d’OpenClaw.
    - La voix xAI Realtime n’est pas encore enregistrée comme fournisseur OpenClaw. Elle
      nécessite un contrat de session vocale bidirectionnelle différent de STT par lot ou de la transcription en streaming.
    - La `quality` d’image xAI, le `mask` d’image, et les rapports d’aspect supplémentaires réservés au natif
      ne sont pas exposés tant que l’outil partagé `image_generate` ne dispose pas de contrôles inter-fournisseurs correspondants.
  </Accordion>

  <Accordion title="Remarques avancées">
    - OpenClaw applique automatiquement des correctifs de compatibilité spécifiques à xAI pour le schéma d’outil et l’appel d’outil
      sur le chemin d’exécution partagé.
    - Les requêtes xAI natives utilisent par défaut `tool_stream: true`. Définissez
      `agents.defaults.models["xai/<model>"].params.tool_stream` à `false` pour
      le désactiver.
    - Le wrapper xAI intégré retire les indicateurs stricts non pris en charge du schéma d’outil et
      les clés de charge utile reasoning avant d’envoyer les requêtes xAI natives.
    - `web_search`, `x_search` et `code_execution` sont exposés comme outils OpenClaw.
      OpenClaw active le built-in xAI spécifique dont il a besoin dans chaque requête d’outil
      au lieu d’attacher tous les outils natifs à chaque tour de discussion.
    - `x_search` et `code_execution` appartiennent au plugin xAI intégré plutôt qu’au runtime
      du modèle cœur codé en dur.
    - `code_execution` est une exécution sandbox xAI distante, et non
      [`exec`](/fr/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Tests live

Les chemins média xAI sont couverts par des tests unitaires et des suites live à activation explicite. Les
commandes live chargent les secrets depuis votre shell de connexion, y compris `~/.profile`, avant
de sonder `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Le fichier live spécifique au fournisseur synthétise un TTS normal, un TTS PCM
adapté à la téléphonie, transcrit l’audio via le STT batch xAI, diffuse le même PCM via le STT temps réel xAI,
génère une sortie texte-vers-image, et édite une image de référence. Le
fichier live image partagé vérifie le même fournisseur xAI via la sélection runtime
d’OpenClaw, le repli, la normalisation et le chemin des pièces jointes média.

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de repli.
  </Card>
  <Card title="Génération de vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Tous les fournisseurs" href="/fr/providers/index" icon="grid-2">
    Vue d’ensemble plus large des fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et correctifs.
  </Card>
</CardGroup>
