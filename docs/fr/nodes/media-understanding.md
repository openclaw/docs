---
read_when:
    - Concevoir ou refactoriser la compréhension des médias
    - Ajuster le prétraitement entrant audio/vidéo/image
sidebarTitle: Media understanding
summary: Compréhension entrante des images/audio/vidéo (facultative) avec solutions de repli fournisseur + CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-04-26T11:33:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw peut **résumer les médias entrants** (image/audio/vidéo) avant l’exécution du pipeline de réponse. Il détecte automatiquement quand des outils locaux ou des clés de fournisseur sont disponibles, et cela peut être désactivé ou personnalisé. Si la compréhension est désactivée, les modèles reçoivent quand même les fichiers/URL d’origine comme d’habitude.

Le comportement média spécifique à chaque fournisseur est enregistré par les Plugins fournisseur, tandis que le cœur d’OpenClaw gère la configuration partagée `tools.media`, l’ordre de repli et l’intégration au pipeline de réponse.

## Objectifs

- Facultatif : prédigérer les médias entrants en texte court pour un routage plus rapide et une meilleure analyse des commandes.
- Préserver la livraison des médias d’origine au modèle (toujours).
- Prendre en charge les **API fournisseur** et les **solutions de repli CLI**.
- Autoriser plusieurs modèles avec repli ordonné (erreur/taille/délai d’attente).

## Comportement de haut niveau

<Steps>
  <Step title="Collecter les pièces jointes">
    Collecter les pièces jointes entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Sélectionner par capacité">
    Pour chaque capacité activée (image/audio/vidéo), sélectionner les pièces jointes selon la politique (par défaut : **première**).
  </Step>
  <Step title="Choisir le modèle">
    Choisir la première entrée de modèle éligible (taille + capacité + auth).
  </Step>
  <Step title="Utiliser le repli en cas d’échec">
    Si un modèle échoue ou si le média est trop volumineux, **revenir à l’entrée suivante**.
  </Step>
  <Step title="Appliquer le bloc de réussite">
    En cas de réussite :

    - `Body` devient un bloc `[Image]`, `[Audio]` ou `[Video]`.
    - L’audio définit `{{Transcript}}` ; l’analyse des commandes utilise le texte de légende lorsqu’il est présent, sinon la transcription.
    - Les légendes sont conservées comme `User text:` à l’intérieur du bloc.

  </Step>
</Steps>

Si la compréhension échoue ou est désactivée, **le flux de réponse continue** avec le corps + les pièces jointes d’origine.

## Vue d’ensemble de la configuration

`tools.media` prend en charge des **modèles partagés** ainsi que des remplacements par capacité :

<AccordionGroup>
  <Accordion title="Clés de niveau supérieur">
    - `tools.media.models` : liste de modèles partagée (utilisez `capabilities` pour filtrer).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video` :
      - valeurs par défaut (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - remplacements fournisseur (`baseUrl`, `headers`, `providerOptions`)
      - options audio Deepgram via `tools.media.audio.providerOptions.deepgram`
      - contrôles d’écho de transcription audio (`echoTranscript`, par défaut `false` ; `echoFormat`)
      - **liste `models` par capacité facultative** (prioritaire sur les modèles partagés)
      - politique `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (filtrage facultatif par canal/chatType/clé de session)
    - `tools.media.concurrency` : nombre maximal d’exécutions simultanées par capacité (par défaut **2**).
  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* liste partagée */
      ],
      image: {
        /* remplacements facultatifs */
      },
      audio: {
        /* remplacements facultatifs */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* remplacements facultatifs */
      },
    },
  },
}
```

### Entrées de modèle

Chaque entrée `models[]` peut être de type **provider** ou **cli** :

<Tabs>
  <Tab title="Entrée provider">
    ```json5
    {
      type: "provider", // par défaut si omis
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // facultatif, utilisé pour les entrées multimodales
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Entrée CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Les modèles CLI peuvent aussi utiliser :

    - `{{MediaDir}}` (répertoire contenant le fichier média)
    - `{{OutputDir}}` (répertoire temporaire créé pour cette exécution)
    - `{{OutputBase}}` (chemin de base du fichier temporaire, sans extension)

  </Tab>
</Tabs>

## Valeurs par défaut et limites

Valeurs recommandées :

- `maxChars` : **500** pour image/vidéo (court, compatible avec les commandes)
- `maxChars` : **non défini** pour l’audio (transcription complète sauf si vous fixez une limite)
- `maxBytes` :
  - image : **10MB**
  - audio : **20MB**
  - vidéo : **50MB**

<AccordionGroup>
  <Accordion title="Règles">
    - Si le média dépasse `maxBytes`, ce modèle est ignoré et **le modèle suivant est essayé**.
    - Les fichiers audio de moins de **1024 bytes** sont traités comme vides/corrompus et ignorés avant la transcription par provider/CLI ; le contexte de réponse entrant reçoit une transcription de remplacement déterministe afin que l’agent sache que la note était trop petite.
    - Si le modèle renvoie plus de `maxChars`, la sortie est tronquée.
    - `prompt` utilise par défaut une simple forme « Décrire le {média}. » plus l’indication `maxChars` (image/vidéo uniquement).
    - Si le modèle d’image principal actif prend déjà en charge la vision nativement, OpenClaw ignore le bloc de résumé `[Image]` et transmet l’image d’origine au modèle à la place.
    - Si un modèle principal Gateway/WebChat est text-only, les pièces jointes image sont conservées comme références déportées `media://inbound/*` afin que les outils image/PDF ou le modèle d’image configuré puissent toujours les inspecter au lieu de perdre la pièce jointe.
    - Les requêtes explicites `openclaw infer image describe --model <provider/model>` sont différentes : elles exécutent directement ce provider/modèle compatible image, y compris les références Ollama comme `ollama/qwen2.5vl:7b`.
    - Si `<capability>.enabled: true` mais qu’aucun modèle n’est configuré, OpenClaw essaie le **modèle de réponse actif** lorsque son fournisseur prend en charge cette capacité.
  </Accordion>
</AccordionGroup>

### Détection automatique de la compréhension des médias (par défaut)

Si `tools.media.<capability>.enabled` n’est **pas** défini à `false` et que vous n’avez pas configuré de modèles, OpenClaw détecte automatiquement dans cet ordre et **s’arrête à la première option fonctionnelle** :

<Steps>
  <Step title="Modèle de réponse actif">
    Modèle de réponse actif lorsque son fournisseur prend en charge la capacité.
  </Step>
  <Step title="agents.defaults.imageModel">
    Références primary/fallback de `agents.defaults.imageModel` (image uniquement).
  </Step>
  <Step title="CLI locales (audio uniquement)">
    CLI locales (si installées) :

    - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le petit modèle intégré)
    - `whisper` (CLI Python ; télécharge automatiquement les modèles)

  </Step>
  <Step title="CLI Gemini">
    `gemini` utilisant `read_many_files`.
  </Step>
  <Step title="Authentification provider">
    - Les entrées configurées `models.providers.*` qui prennent en charge la capacité sont essayées avant l’ordre de repli intégré.
    - Les providers de configuration image-only avec un modèle compatible image sont auto-enregistrés pour la compréhension des médias même lorsqu’ils ne sont pas un Plugin fournisseur intégré.
    - La compréhension d’image Ollama est disponible lorsqu’elle est sélectionnée explicitement, par exemple via `agents.defaults.imageModel` ou `openclaw infer image describe --model ollama/<vision-model>`.

    Ordre de repli intégré :

    - Audio : OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Image : OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Vidéo : Google → Qwen → Moonshot

  </Step>
</Steps>

Pour désactiver la détection automatique, définissez :

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
La détection des binaires est faite au mieux sur macOS/Linux/Windows ; assurez-vous que la CLI est dans `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin complet vers la commande.
</Note>

### Prise en charge des variables d’environnement proxy (modèles provider)

Lorsque la compréhension des médias **audio** et **vidéo** basée sur un provider est activée, OpenClaw respecte les variables d’environnement proxy sortantes standard pour les appels HTTP provider :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si aucune variable d’environnement proxy n’est définie, la compréhension des médias utilise une sortie directe. Si la valeur du proxy est mal formée, OpenClaw journalise un avertissement et revient à une récupération directe.

## Capacités (facultatif)

Si vous définissez `capabilities`, l’entrée ne s’exécute que pour ces types de média. Pour les listes partagées, OpenClaw peut déduire les valeurs par défaut :

- `openai`, `anthropic`, `minimax` : **image**
- `minimax-portal` : **image**
- `moonshot` : **image + vidéo**
- `openrouter` : **image**
- `google` (API Gemini) : **image + audio + vidéo**
- `qwen` : **image + vidéo**
- `mistral` : **audio**
- `zai` : **image**
- `groq` : **audio**
- `xai` : **audio**
- `deepgram` : **audio**
- Tout catalogue `models.providers.<id>.models[]` avec un modèle compatible image : **image**

Pour les entrées CLI, **définissez `capabilities` explicitement** pour éviter des correspondances surprenantes. Si vous omettez `capabilities`, l’entrée est éligible pour la liste dans laquelle elle apparaît.

## Matrice de prise en charge des providers (intégrations OpenClaw)

| Capacité | Intégration provider                                                                                                         | Remarques                                                                                                                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, providers de configuration | Les Plugins fournisseur enregistrent la prise en charge des images ; `openai-codex/*` utilise la plomberie provider OAuth ; `codex/*` utilise un tour Codex app-server borné ; MiniMax et MiniMax OAuth utilisent tous deux `MiniMax-VL-01` ; les providers de configuration compatibles image sont auto-enregistrés. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Transcription provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                  |
| Vidéo      | Google, Qwen, Moonshot                                                                                                       | Compréhension vidéo provider via les Plugins fournisseur ; la compréhension vidéo Qwen utilise les endpoints Standard DashScope.                                                                                                      |

<Note>
**Remarque MiniMax**

- La compréhension d’image `minimax` et `minimax-portal` provient du provider média `MiniMax-VL-01` détenu par le Plugin.
- Le catalogue texte MiniMax intégré démarre encore en text-only ; des entrées explicites `models.providers.minimax` matérialisent des références de chat M2.7 compatibles image.
  </Note>

## Recommandations de sélection de modèle

- Préférez le modèle le plus récent et le plus solide disponible pour chaque capacité média lorsque la qualité et la sécurité comptent.
- Pour les agents avec outils qui traitent des entrées non fiables, évitez les anciens modèles média ou les plus faibles.
- Gardez au moins un repli par capacité pour la disponibilité (modèle de qualité + modèle plus rapide/moins cher).
- Les solutions de repli CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API provider sont indisponibles.
- Remarque `parakeet-mlx` : avec `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque le format de sortie est `txt` (ou non précisé) ; les formats non `txt` reviennent à stdout.

## Politique des pièces jointes

Le paramètre `attachments` par capacité contrôle quelles pièces jointes sont traitées :

<ParamField path="mode" type='"first" | "all"' default="first">
  Indique s’il faut traiter la première pièce jointe sélectionnée ou toutes.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limite le nombre traité.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Préférence de sélection parmi les pièces jointes candidates.
</ParamField>

Lorsque `mode: "all"`, les sorties sont étiquetées `[Image 1/2]`, `[Audio 2/2]`, etc.

<AccordionGroup>
  <Accordion title="Comportement d’extraction des pièces jointes de fichier">
    - Le texte extrait du fichier est encapsulé comme **contenu externe non fiable** avant d’être ajouté au prompt média.
    - Le bloc injecté utilise des marqueurs de frontière explicites tels que `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées `Source: External`.
    - Ce chemin d’extraction des pièces jointes omet volontairement la longue bannière `SECURITY NOTICE:` afin d’éviter d’alourdir le prompt média ; les marqueurs de frontière et les métadonnées restent toutefois présents.
    - Si un fichier n’a pas de texte extractible, OpenClaw injecte `[No extractable text]`.
    - Si un PDF retombe sur des images de pages rendues dans ce chemin, le prompt média conserve l’espace réservé `[PDF content rendered to images; images not forwarded to model]` car cette étape d’extraction de pièces jointes transmet des blocs de texte, pas les images PDF rendues.
  </Accordion>
</AccordionGroup>

## Exemples de configuration

<Tabs>
  <Tab title="Modèles partagés + remplacements">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Audio + vidéo uniquement">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Image uniquement">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Entrée unique multimodale">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Sortie d’état

Lorsque la compréhension des médias s’exécute, `/status` inclut une courte ligne de résumé :

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Cela affiche les résultats par capacité et le provider/modèle choisi lorsque c’est applicable.

## Remarques

- La compréhension est **au mieux**. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont toujours transmises aux modèles même lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter les endroits où la compréhension s’exécute (par ex. uniquement en DM).

## Associé

- [Configuration](/fr/gateway/configuration)
- [Image & media support](/fr/nodes/images)
