---
read_when:
    - Concevoir ou refactoriser la compréhension des médias
    - Ajuster le prétraitement entrant audio/vidéo/image
summary: Compréhension entrante des images/audio/vidéo (facultative) avec repli fournisseur + CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-04-25T13:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Compréhension des médias - Entrant (2026-01-17)

OpenClaw peut **résumer les médias entrants** (image/audio/vidéo) avant que le pipeline de réponse ne s’exécute. Il détecte automatiquement quand des outils locaux ou des clés de fournisseur sont disponibles, et peut être désactivé ou personnalisé. Si la compréhension est désactivée, les modèles reçoivent toujours les fichiers/URL d’origine comme d’habitude.

Le comportement média spécifique à un fournisseur est enregistré par les Plugins fournisseur, tandis que le
cœur d’OpenClaw gère la configuration partagée `tools.media`, l’ordre de repli et l’intégration
au pipeline de réponse.

## Objectifs

- Facultatif : prédigérer les médias entrants en texte court pour un routage plus rapide + une meilleure analyse des commandes.
- Préserver la livraison du média d’origine au modèle (toujours).
- Prendre en charge les **API de fournisseur** et les **replis CLI**.
- Autoriser plusieurs modèles avec un repli ordonné (erreur/taille/délai d’expiration).

## Comportement général

1. Collecter les pièces jointes entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Pour chaque capacité activée (image/audio/vidéo), sélectionner les pièces jointes selon la politique (par défaut : **première**).
3. Choisir la première entrée de modèle éligible (taille + capacité + authentification).
4. Si un modèle échoue ou si le média est trop volumineux, **repli sur l’entrée suivante**.
5. En cas de succès :
   - `Body` devient un bloc `[Image]`, `[Audio]` ou `[Video]`.
   - L’audio définit `{{Transcript}}` ; l’analyse des commandes utilise le texte de légende lorsqu’il est présent,
     sinon la transcription.
   - Les légendes sont conservées sous `User text:` à l’intérieur du bloc.

Si la compréhension échoue ou est désactivée, **le flux de réponse continue** avec le corps et les pièces jointes d’origine.

## Aperçu de la configuration

`tools.media` prend en charge des **modèles partagés** plus des surcharges par capacité :

- `tools.media.models` : liste de modèles partagés (utilisez `capabilities` pour filtrer).
- `tools.media.image` / `tools.media.audio` / `tools.media.video` :
  - valeurs par défaut (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - surcharges de fournisseur (`baseUrl`, `headers`, `providerOptions`)
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
        /* surcharges facultatives */
      },
      audio: {
        /* surcharges facultatives */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* surcharges facultatives */
      },
    },
  },
}
```

### Entrées de modèle

Chaque entrée `models[]` peut être de type **provider** ou **cli** :

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
- `{{OutputBase}}` (chemin de base du fichier de travail, sans extension)

## Valeurs par défaut et limites

Valeurs par défaut recommandées :

- `maxChars` : **500** pour image/vidéo (court, compatible avec les commandes)
- `maxChars` : **non défini** pour l’audio (transcription complète sauf si vous fixez une limite)
- `maxBytes` :
  - image : **10MB**
  - audio : **20MB**
  - vidéo : **50MB**

Règles :

- Si le média dépasse `maxBytes`, ce modèle est ignoré et **le modèle suivant est essayé**.
- Les fichiers audio inférieurs à **1024 octets** sont traités comme vides/corrompus et ignorés avant la transcription provider/CLI.
- Si le modèle renvoie plus de `maxChars`, la sortie est tronquée.
- `prompt` utilise par défaut une forme simple « Describe the {media}. » plus l’indication `maxChars` (image/vidéo uniquement).
- Si le modèle d’image principal actif prend déjà en charge la vision nativement, OpenClaw
  ignore le bloc de résumé `[Image]` et transmet à la place l’image d’origine au
  modèle.
- Si un modèle principal Gateway/WebChat est textuel uniquement, les pièces jointes image sont
  conservées comme références déportées `media://inbound/*` afin que les outils image/PDF ou le
  modèle d’image configuré puissent encore les inspecter au lieu de perdre la pièce jointe.
- Les requêtes explicites `openclaw infer image describe --model <provider/model>`
  sont différentes : elles exécutent directement ce provider/modèle compatible image, y compris
  les références Ollama telles que `ollama/qwen2.5vl:7b`.
- Si `<capability>.enabled: true` mais qu’aucun modèle n’est configuré, OpenClaw essaie le
  **modèle de réponse actif** lorsque son fournisseur prend en charge cette capacité.

### Auto-détection de la compréhension des médias (par défaut)

Si `tools.media.<capability>.enabled` n’est **pas** défini sur `false` et que vous n’avez pas
configuré de modèles, OpenClaw détecte automatiquement dans cet ordre et **s’arrête à la première
option fonctionnelle** :

1. **Modèle de réponse actif** lorsque son fournisseur prend en charge cette capacité.
2. Références principale/de repli de **`agents.defaults.imageModel`** (image uniquement).
3. **CLI locales** (audio uniquement ; si installées)
   - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le modèle tiny intégré)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)
4. **CLI Gemini** (`gemini`) utilisant `read_many_files`
5. **Authentification fournisseur**
   - Les entrées configurées `models.providers.*` qui prennent en charge cette capacité sont
     essayées avant l’ordre de repli intégré.
   - Les fournisseurs de configuration image uniquement avec un modèle compatible image s’enregistrent automatiquement pour
     la compréhension des médias même lorsqu’ils ne sont pas un Plugin fournisseur intégré.
   - La compréhension d’image Ollama est disponible lorsqu’elle est sélectionnée explicitement, par
     exemple via `agents.defaults.imageModel` ou
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Ordre de repli intégré :
     - Audio : OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
     - Image : OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Vidéo : Google → Qwen → Moonshot

Pour désactiver l’auto-détection, définissez :

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

Remarque : la détection binaire fonctionne au mieux sur macOS/Linux/Windows ; assurez-vous que la CLI est dans `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.

### Prise en charge de l’environnement proxy (modèles provider)

Lorsque la compréhension des médias **audio** et **vidéo** basée sur un provider est activée, OpenClaw
respecte les variables d’environnement proxy sortantes standard pour les appels HTTP provider :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si aucune variable d’environnement proxy n’est définie, la compréhension des médias utilise un accès direct.
Si la valeur du proxy est mal formée, OpenClaw journalise un avertissement puis revient à un
accès direct.

## Capacités (facultatif)

Si vous définissez `capabilities`, l’entrée ne s’exécute que pour ces types de médias. Pour les
listes partagées, OpenClaw peut déduire les valeurs par défaut :

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

## Matrice de prise en charge des fournisseurs (intégrations OpenClaw)

| Capacité | Intégration fournisseur                                                                                                      | Remarques                                                                                                                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image    | OpenAI, OpenAI Codex OAuth, serveur d’application Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, fournisseurs de config | Les Plugins fournisseur enregistrent la prise en charge de l’image ; `openai-codex/*` utilise l’infrastructure provider OAuth ; `codex/*` utilise un tour borné de serveur d’application Codex ; MiniMax et MiniMax OAuth utilisent tous deux `MiniMax-VL-01` ; les fournisseurs de configuration compatibles image s’enregistrent automatiquement. |
| Audio    | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Transcription provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                 |
| Vidéo    | Google, Qwen, Moonshot                                                                                                       | Compréhension vidéo provider via les Plugins fournisseur ; la compréhension vidéo Qwen utilise les points de terminaison DashScope Standard.                                                                                           |

Remarque MiniMax :

- la compréhension d’image `minimax` et `minimax-portal` provient du provider média
  `MiniMax-VL-01` possédé par le Plugin.
- Le catalogue texte MiniMax intégré reste initialement textuel uniquement ; des entrées explicites
  `models.providers.minimax` matérialisent des références de chat M2.7 compatibles image.

## Conseils de sélection des modèles

- Préférez le modèle de dernière génération le plus solide disponible pour chaque capacité média lorsque la qualité et la sécurité comptent.
- Pour les agents avec outils traitant des entrées non fiables, évitez les anciens modèles médias plus faibles.
- Gardez au moins un repli par capacité pour la disponibilité (modèle de qualité + modèle plus rapide/moins cher).
- Les replis CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API provider ne sont pas disponibles.
- Remarque `parakeet-mlx` : avec `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque le format de sortie est `txt` (ou non spécifié) ; les formats autres que `txt` reviennent à stdout.

## Politique des pièces jointes

Le champ `attachments` par capacité contrôle quelles pièces jointes sont traitées :

- `mode` : `first` (par défaut) ou `all`
- `maxAttachments` : limite du nombre traité (par défaut **1**)
- `prefer` : `first`, `last`, `path`, `url`

Lorsque `mode: "all"`, les sorties sont étiquetées `[Image 1/2]`, `[Audio 2/2]`, etc.

Comportement d’extraction des fichiers joints :

- Le texte extrait des fichiers est encapsulé comme **contenu externe non fiable** avant
  d’être ajouté à l’invite média.
- Le bloc injecté utilise des marqueurs de limite explicites comme
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une
  ligne de métadonnées `Source: External`.
- Ce chemin d’extraction des pièces jointes omet intentionnellement la longue
  bannière `SECURITY NOTICE:` pour éviter de gonfler l’invite média ; les marqueurs de limite
  et les métadonnées restent toutefois présents.
- Si un fichier n’a pas de texte extractible, OpenClaw injecte `[No extractable text]`.
- Si un PDF revient à des images de pages rendues dans ce chemin, l’invite média conserve
  le placeholder `[PDF content rendered to images; images not forwarded to model]`
  car cette étape d’extraction de pièce jointe transmet des blocs de texte, et non les images PDF rendues.

## Exemples de configuration

### 1) Liste de modèles partagée + surcharges

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
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Cela affiche les résultats par capacité et le fournisseur/modèle choisi le cas échéant.

## Remarques

- La compréhension fonctionne **au mieux**. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont toujours transmises aux modèles même lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter où la compréhension s’exécute (par exemple uniquement dans les MP).

## Documentation liée

- [Configuration](/fr/gateway/configuration)
- [Prise en charge des images et médias](/fr/nodes/images)
