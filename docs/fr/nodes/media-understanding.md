---
read_when:
    - Concevoir ou refactoriser la compréhension des médias
    - Ajuster le prétraitement entrant audio/vidéo/image
summary: Compréhension entrante d’image/audio/vidéo (facultative) avec replis fournisseur + CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-04-23T07:05:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Compréhension des médias - Entrant (2026-01-17)

OpenClaw peut **résumer les médias entrants** (image/audio/vidéo) avant l’exécution du pipeline de réponse. Il détecte automatiquement quand des outils locaux ou des clés de fournisseur sont disponibles, et peut être désactivé ou personnalisé. Si la compréhension est désactivée, les modèles reçoivent quand même les fichiers/URL d’origine comme d’habitude.

Le comportement média spécifique au fournisseur est enregistré par les plugins fournisseur, tandis que le
cœur OpenClaw gère la configuration partagée `tools.media`, l’ordre de repli et l’intégration
au pipeline de réponse.

## Objectifs

- Facultatif : prédigérer les médias entrants en texte court pour un routage plus rapide + une meilleure analyse des commandes.
- Préserver la livraison du média d’origine au modèle (toujours).
- Prendre en charge les **API de fournisseur** et les **replis CLI**.
- Autoriser plusieurs modèles avec repli ordonné (erreur/taille/timeout).

## Comportement de haut niveau

1. Collecter les pièces jointes entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Pour chaque capacité activée (image/audio/vidéo), sélectionner les pièces jointes selon la politique (par défaut : **première**).
3. Choisir la première entrée de modèle éligible (taille + capacité + authentification).
4. Si un modèle échoue ou si le média est trop volumineux, **revenir à l’entrée suivante**.
5. En cas de succès :
   - `Body` devient un bloc `[Image]`, `[Audio]` ou `[Video]`.
   - L’audio définit `{{Transcript}}` ; l’analyse des commandes utilise le texte de légende lorsqu’il est présent,
     sinon la transcription.
   - Les légendes sont conservées sous `User text:` dans le bloc.

Si la compréhension échoue ou est désactivée, **le flux de réponse continue** avec le body + les pièces jointes d’origine.

## Vue d’ensemble de la configuration

`tools.media` prend en charge des **modèles partagés** plus des remplacements par capacité :

- `tools.media.models` : liste de modèles partagée (utilisez `capabilities` pour filtrer).
- `tools.media.image` / `tools.media.audio` / `tools.media.video` :
  - valeurs par défaut (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - remplacements fournisseur (`baseUrl`, `headers`, `providerOptions`)
  - options audio Deepgram via `tools.media.audio.providerOptions.deepgram`
  - contrôles d’écho de transcription audio (`echoTranscript`, par défaut `false` ; `echoFormat`)
  - **liste `models` facultative par capacité** (préférée avant les modèles partagés)
  - politique `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (filtrage facultatif par canal/chatType/clé de session)
- `tools.media.concurrency` : nombre maximal d’exécutions simultanées par capacité (par défaut **2**).

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

Chaque entrée `models[]` peut être **provider** ou **CLI** :

```json5
{
  type: "provider", // par défaut si omis
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // facultatif, utilisé pour les entrées multimodales
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

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
- `{{OutputDir}}` (répertoire de travail créé pour cette exécution)
- `{{OutputBase}}` (chemin de base du fichier temporaire, sans extension)

## Valeurs par défaut et limites

Valeurs par défaut recommandées :

- `maxChars` : **500** pour image/vidéo (court, compatible avec l’analyse de commandes)
- `maxChars` : **non défini** pour l’audio (transcription complète sauf si vous définissez une limite)
- `maxBytes` :
  - image : **10MB**
  - audio : **20MB**
  - vidéo : **50MB**

Règles :

- Si le média dépasse `maxBytes`, ce modèle est ignoré et le **modèle suivant est essayé**.
- Les fichiers audio de moins de **1024 octets** sont traités comme vides/corrompus et ignorés avant la transcription fournisseur/CLI.
- Si le modèle renvoie plus de `maxChars`, la sortie est tronquée.
- `prompt` prend par défaut la forme simple « Describe the {media}. » plus l’indication `maxChars` (image/vidéo uniquement).
- Si le modèle image principal actif prend déjà en charge la vision nativement, OpenClaw
  ignore le bloc de résumé `[Image]` et transmet à la place l’image d’origine au
  modèle.
- Les requêtes explicites `openclaw infer image describe --model <provider/model>`
  sont différentes : elles exécutent directement ce fournisseur/modèle compatible image, y compris
  les références Ollama telles que `ollama/qwen2.5vl:7b`.
- Si `<capability>.enabled: true` mais qu’aucun modèle n’est configuré, OpenClaw essaie le
  **modèle de réponse actif** lorsque son fournisseur prend en charge cette capacité.

### Détection automatique de la compréhension des médias (par défaut)

Si `tools.media.<capability>.enabled` n’est **pas** défini à `false` et que vous n’avez pas
configuré de modèles, OpenClaw effectue une détection automatique dans cet ordre et **s’arrête à la première
option fonctionnelle** :

1. **Modèle de réponse actif** lorsque son fournisseur prend en charge la capacité.
2. Références primary/fallback de **`agents.defaults.imageModel`** (image uniquement).
3. **CLI locales** (audio uniquement ; si installées)
   - `sherpa-onnx-offline` (requiert `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le modèle tiny intégré)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)
4. **CLI Gemini** (`gemini`) utilisant `read_many_files`
5. **Authentification fournisseur**
   - Les entrées configurées `models.providers.*` qui prennent en charge la capacité sont
     essayées avant l’ordre de repli intégré.
   - Les fournisseurs de configuration image uniquement avec un modèle compatible image s’enregistrent automatiquement pour
     la compréhension des médias même lorsqu’ils ne sont pas un plugin fournisseur intégré.
   - La compréhension d’images Ollama est disponible lorsqu’elle est sélectionnée explicitement, par
     exemple via `agents.defaults.imageModel` ou
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Ordre de repli intégré :
     - Audio : OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Image : OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Vidéo : Google → Qwen → Moonshot

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

Remarque : la détection binaire est fournie au mieux sur macOS/Linux/Windows ; assurez-vous que la CLI est dans le `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.

### Prise en charge de l’environnement proxy (modèles fournisseur)

Lorsque la compréhension des médias **audio** et **vidéo** basée sur un fournisseur est activée, OpenClaw
respecte les variables d’environnement de proxy sortant standard pour les appels HTTP au fournisseur :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si aucune variable d’environnement proxy n’est définie, la compréhension des médias utilise une sortie directe.
Si la valeur du proxy est mal formée, OpenClaw journalise un avertissement et revient à une
récupération directe.

## Capacités (facultatif)

Si vous définissez `capabilities`, l’entrée ne s’exécute que pour ces types de médias. Pour les listes
partagées, OpenClaw peut déduire les valeurs par défaut :

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
- Tout catalogue `models.providers.<id>.models[]` avec un modèle compatible image :
  **image**

Pour les entrées CLI, **définissez `capabilities` explicitement** pour éviter des correspondances surprenantes.
Si vous omettez `capabilities`, l’entrée est éligible pour la liste dans laquelle elle apparaît.

## Matrice de prise en charge fournisseur (intégrations OpenClaw)

| Capacité | Intégration fournisseur                                                                | Remarques                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Image     | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, fournisseurs config | Les plugins fournisseur enregistrent la prise en charge des images ; MiniMax et MiniMax OAuth utilisent tous deux `MiniMax-VL-01` ; les fournisseurs config compatibles image s’enregistrent automatiquement. |
| Audio     | OpenAI, Groq, Deepgram, Google, Mistral                                                | Transcription fournisseur (Whisper/Deepgram/Gemini/Voxtral).                                                                            |
| Vidéo     | Google, Qwen, Moonshot                                                                 | Compréhension vidéo fournisseur via des plugins fournisseur ; la compréhension vidéo Qwen utilise les endpoints DashScope Standard.      |

Remarque MiniMax :

- La compréhension d’image `minimax` et `minimax-portal` provient du fournisseur média
  `MiniMax-VL-01` possédé par le plugin.
- Le catalogue texte intégré MiniMax reste initialement texte uniquement ; les entrées explicites
  `models.providers.minimax` matérialisent des références de chat M2.7 compatibles image.

## Guide de sélection de modèle

- Préférez le modèle le plus fort et de dernière génération disponible pour chaque capacité média lorsque la qualité et la sécurité comptent.
- Pour les agents activés par outils qui gèrent des entrées non fiables, évitez les modèles média plus anciens/plus faibles.
- Conservez au moins un repli par capacité pour la disponibilité (modèle de qualité + modèle plus rapide/moins coûteux).
- Les replis CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API fournisseur sont indisponibles.
- Remarque `parakeet-mlx` : avec `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque le format de sortie est `txt` (ou non spécifié) ; les formats non `txt` reviennent à stdout.

## Politique des pièces jointes

`attachments` par capacité contrôle quelles pièces jointes sont traitées :

- `mode` : `first` (par défaut) ou `all`
- `maxAttachments` : limite le nombre traité (par défaut **1**)
- `prefer` : `first`, `last`, `path`, `url`

Lorsque `mode: "all"`, les sorties sont étiquetées `[Image 1/2]`, `[Audio 2/2]`, etc.

Comportement d’extraction des pièces jointes de fichiers :

- Le texte de fichier extrait est encapsulé comme **contenu externe non fiable** avant d’être
  ajouté au prompt média.
- Le bloc injecté utilise des marqueurs de délimitation explicites comme
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées
  `Source: External`.
- Ce chemin d’extraction de pièce jointe omet volontairement la longue
  bannière `SECURITY NOTICE:` afin d’éviter de gonfler le prompt média ; les marqueurs de
  délimitation et les métadonnées restent toutefois présents.
- Si un fichier n’a aucun texte extractible, OpenClaw injecte `[No extractable text]`.
- Si un PDF revient à des images de pages rendues dans ce chemin, le prompt média conserve
  le placeholder `[PDF content rendered to images; images not forwarded to model]`
  car cette étape d’extraction de pièce jointe transmet des blocs de texte, et non les images PDF rendues.

## Exemples de configuration

### 1) Liste de modèles partagée + remplacements

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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

### 2) Audio + vidéo uniquement (image désactivée)

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

### 3) Compréhension d’image facultative

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
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

### 4) Entrée multimodale unique (capacités explicites)

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

## Sortie d’état

Lorsque la compréhension des médias s’exécute, `/status` inclut une courte ligne de résumé :

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Cela affiche les résultats par capacité et le fournisseur/modèle choisi le cas échéant.

## Remarques

- La compréhension est fournie **au mieux**. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont toujours transmises aux modèles même lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter les endroits où la compréhension s’exécute (par ex. uniquement les messages privés).

## Documentation associée

- [Configuration](/fr/gateway/configuration)
- [Prise en charge des images et médias](/fr/nodes/images)
