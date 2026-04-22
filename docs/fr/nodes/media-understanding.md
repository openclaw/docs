---
read_when:
    - Conception ou refactorisation de la compréhension des médias
    - Ajustement du prétraitement des médias entrants audio/vidéo/image
summary: Compréhension des images, de l’audio et de la vidéo en entrée (facultative) avec solutions de repli du provider et de la CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-04-22T04:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d80c9bcd965b521c3c782a76b9dd31eb6e6c635d8a1cc6895b6ccfaf5f9492e
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Compréhension des médias - Entrants (2026-01-17)

OpenClaw peut **résumer les médias entrants** (image/audio/vidéo) avant l’exécution du pipeline de réponse. Il détecte automatiquement quand des outils locaux ou des clés de provider sont disponibles, et peut être désactivé ou personnalisé. Si la compréhension est désactivée, les modèles reçoivent quand même les fichiers/URL d’origine comme d’habitude.

Le comportement média spécifique à un fournisseur est enregistré par les plugins du fournisseur, tandis que le
cœur d’OpenClaw possède la config partagée `tools.media`, l’ordre de repli et l’intégration au
pipeline de réponse.

## Objectifs

- Facultatif : pré-analyser les médias entrants en texte court pour un routage plus rapide + une meilleure analyse des commandes.
- Préserver la livraison des médias d’origine au modèle (toujours).
- Prendre en charge les **API de provider** et les **solutions de repli CLI**.
- Autoriser plusieurs modèles avec repli ordonné (erreur/taille/délai d’expiration).

## Comportement de haut niveau

1. Collecter les pièces jointes entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Pour chaque capacité activée (image/audio/vidéo), sélectionner les pièces jointes selon la politique (par défaut : **première**).
3. Choisir la première entrée de modèle éligible (taille + capacité + authentification).
4. Si un modèle échoue ou si le média est trop volumineux, **passer à l’entrée suivante**.
5. En cas de succès :
   - `Body` devient un bloc `[Image]`, `[Audio]` ou `[Video]`.
   - L’audio définit `{{Transcript}}` ; l’analyse des commandes utilise le texte de légende lorsqu’il est présent,
     sinon la transcription.
   - Les légendes sont conservées comme `User text:` à l’intérieur du bloc.

Si la compréhension échoue ou est désactivée, **le flux de réponse continue** avec le corps d’origine + les pièces jointes.

## Vue d’ensemble de la config

`tools.media` prend en charge des **modèles partagés** plus des remplacements par capacité :

- `tools.media.models` : liste de modèles partagés (utilisez `capabilities` pour filtrer).
- `tools.media.image` / `tools.media.audio` / `tools.media.video` :
  - valeurs par défaut (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - remplacements de provider (`baseUrl`, `headers`, `providerOptions`)
  - options audio Deepgram via `tools.media.audio.providerOptions.deepgram`
  - contrôles d’écho de transcription audio (`echoTranscript`, `false` par défaut ; `echoFormat`)
  - liste facultative de `models` **par capacité** (préférée avant les modèles partagés)
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
  type: "provider", // valeur par défaut si omise
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
- `{{OutputDir}}` (répertoire temporaire créé pour cette exécution)
- `{{OutputBase}}` (chemin de base du fichier temporaire, sans extension)

## Valeurs par défaut et limites

Valeurs par défaut recommandées :

- `maxChars` : **500** pour l’image/la vidéo (court, compatible avec l’analyse des commandes)
- `maxChars` : **non défini** pour l’audio (transcription complète sauf si vous définissez une limite)
- `maxBytes` :
  - image : **10MB**
  - audio : **20MB**
  - vidéo : **50MB**

Règles :

- Si le média dépasse `maxBytes`, ce modèle est ignoré et le **modèle suivant est essayé**.
- Les fichiers audio plus petits que **1024 octets** sont traités comme vides/corrompus et ignorés avant toute transcription par provider/CLI.
- Si le modèle renvoie plus de `maxChars`, la sortie est tronquée.
- `prompt` prend par défaut une forme simple du type « Describe the {media}. » plus l’indication `maxChars` (image/vidéo uniquement).
- Si le modèle d’image principal actif prend déjà en charge la vision nativement, OpenClaw
  ignore le bloc de résumé `[Image]` et transmet l’image d’origine directement au
  modèle à la place.
- Les requêtes explicites `openclaw infer image describe --model <provider/model>`
  sont différentes : elles exécutent directement ce provider/modèle compatible image,
  y compris les références Ollama comme `ollama/qwen2.5vl:7b`.
- Si `<capability>.enabled: true` mais qu’aucun modèle n’est configuré, OpenClaw essaie le
  **modèle de réponse actif** lorsque son provider prend en charge la capacité.

### Détection automatique de la compréhension des médias (par défaut)

Si `tools.media.<capability>.enabled` n’est **pas** défini sur `false` et que vous n’avez
pas configuré de modèles, OpenClaw détecte automatiquement dans cet ordre et **s’arrête à la première
option fonctionnelle** :

1. **Modèle de réponse actif** lorsque son provider prend en charge la capacité.
2. Références principales/de repli de **`agents.defaults.imageModel`** (image uniquement).
3. **CLI locales** (audio uniquement ; si installées)
   - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le petit modèle inclus)
   - `whisper` (CLI Python ; télécharge les modèles automatiquement)
4. **Gemini CLI** (`gemini`) utilisant `read_many_files`
5. **Authentification de provider**
   - Les entrées configurées `models.providers.*` qui prennent en charge la capacité sont
     essayées avant l’ordre de repli inclus.
   - Les providers de config limités à l’image avec un modèle compatible image s’enregistrent automatiquement pour
     la compréhension des médias même lorsqu’ils ne sont pas un plugin fournisseur inclus.
   - La compréhension des images Ollama est disponible lorsqu’elle est sélectionnée explicitement, par
     exemple via `agents.defaults.imageModel` ou
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Ordre de repli inclus :
     - Audio : OpenAI → Groq → Deepgram → Google → Mistral
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

Remarque : la détection des binaires est effectuée au mieux sur macOS/Linux/Windows ; assurez-vous que la CLI se trouve dans le `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.

### Prise en charge de l’environnement proxy (modèles de provider)

Lorsque la compréhension des médias **audio** et **vidéo** basée sur un provider est activée, OpenClaw
respecte les variables d’environnement proxy standard pour les appels HTTP du provider :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si aucune variable d’environnement proxy n’est définie, la compréhension des médias utilise une sortie directe.
Si la valeur du proxy est mal formée, OpenClaw enregistre un avertissement et revient à une
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
- `deepgram` : **audio**
- Tout catalogue `models.providers.<id>.models[]` avec un modèle compatible image :
  **image**

Pour les entrées CLI, **définissez `capabilities` explicitement** afin d’éviter des correspondances surprenantes.
Si vous omettez `capabilities`, l’entrée est éligible pour la liste dans laquelle elle apparaît.

## Matrice de prise en charge des providers (intégrations OpenClaw)

| Capability | Intégration de provider                                                               | Notes                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, providers de config | Les plugins fournisseurs enregistrent la prise en charge des images ; MiniMax et MiniMax OAuth utilisent tous deux `MiniMax-VL-01` ; les providers de config compatibles image s’enregistrent automatiquement. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                               | Transcription par provider (Whisper/Deepgram/Gemini/Voxtral).                                                                            |
| Vidéo      | Google, Qwen, Moonshot                                                                | Compréhension vidéo par provider via des plugins fournisseurs ; la compréhension vidéo Qwen utilise les points de terminaison Standard DashScope. |

Remarque MiniMax :

- La compréhension d’images `minimax` et `minimax-portal` provient du provider média
  `MiniMax-VL-01` détenu par le Plugin.
- Le catalogue de texte MiniMax inclus reste initialement limité au texte ; les entrées explicites
  `models.providers.minimax` matérialisent des références de chat M2.7 compatibles image.

## Conseils de sélection de modèle

- Préférez le modèle de dernière génération le plus puissant disponible pour chaque capacité média lorsque la qualité et la sécurité comptent.
- Pour les agents avec outils activés traitant des entrées non fiables, évitez les modèles média plus anciens/plus faibles.
- Conservez au moins une solution de repli par capacité pour la disponibilité (modèle de qualité + modèle plus rapide/moins cher).
- Les solutions de repli CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API de provider ne sont pas disponibles.
- Remarque `parakeet-mlx` : avec `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque le format de sortie est `txt` (ou non spécifié) ; les formats non `txt` reviennent à stdout.

## Politique des pièces jointes

Le paramètre `attachments` par capacité contrôle les pièces jointes à traiter :

- `mode` : `first` (par défaut) ou `all`
- `maxAttachments` : limite du nombre traité (par défaut **1**)
- `prefer` : `first`, `last`, `path`, `url`

Lorsque `mode: "all"`, les sorties sont étiquetées `[Image 1/2]`, `[Audio 2/2]`, etc.

Comportement d’extraction des pièces jointes de fichier :

- Le texte extrait du fichier est encapsulé comme **contenu externe non fiable** avant d’être
  ajouté au prompt média.
- Le bloc injecté utilise des marqueurs de frontière explicites comme
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de
  métadonnées `Source: External`.
- Ce chemin d’extraction des pièces jointes omet intentionnellement la longue
  bannière `SECURITY NOTICE:` afin d’éviter d’alourdir le prompt média ; les marqueurs
  de frontière et les métadonnées restent toutefois présents.
- Si un fichier ne contient aucun texte extractible, OpenClaw injecte `[No extractable text]`.
- Si un PDF revient à des images de pages rendues dans ce chemin, le prompt média conserve
  l’espace réservé `[PDF content rendered to images; images not forwarded to model]`
  car cette étape d’extraction des pièces jointes transmet des blocs de texte, et non les images PDF rendues.

## Exemples de config

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

### 4) Entrée unique multimodale (capacités explicites)

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

## Sortie de statut

Lorsque la compréhension des médias s’exécute, `/status` inclut une courte ligne de résumé :

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Cela affiche les résultats par capacité et le provider/modèle choisi le cas échéant.

## Remarques

- La compréhension est **best-effort**. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont toujours transmises aux modèles même lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter les endroits où la compréhension s’exécute (par exemple uniquement les DMs).

## Documentation associée

- [Configuration](/fr/gateway/configuration)
- [Image & Media Support](/fr/nodes/images)
