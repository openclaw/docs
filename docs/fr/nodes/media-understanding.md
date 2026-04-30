---
read_when:
    - Concevoir ou refactoriser la compréhension des médias
    - Réglage du prétraitement audio/vidéo/image entrant
sidebarTitle: Media understanding
summary: Compréhension des images/audio/vidéos entrants (facultative) avec solutions de repli fournisseur + CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-04-30T07:35:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw peut **résumer les médias entrants** (image/audio/vidéo) avant l’exécution du pipeline de réponse. Il détecte automatiquement quand des outils locaux ou des clés de fournisseurs sont disponibles, et peut être désactivé ou personnalisé. Si la compréhension est désactivée, les modèles reçoivent toujours les fichiers/URL d’origine comme d’habitude.

Le comportement média propre à chaque fournisseur est enregistré par les plugins de fournisseur, tandis que le cœur d’OpenClaw gère la configuration partagée `tools.media`, l’ordre de repli et l’intégration au pipeline de réponse.

## Objectifs

- Facultatif : prédigérer les médias entrants en texte court pour un routage plus rapide et une meilleure analyse des commandes.
- Préserver la transmission du média d’origine au modèle (toujours).
- Prendre en charge les **API de fournisseurs** et les **replis CLI**.
- Autoriser plusieurs modèles avec un repli ordonné (erreur/taille/délai d’attente).

## Comportement général

<Steps>
  <Step title="Collecter les pièces jointes">
    Collecter les pièces jointes entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Sélectionner par capacité">
    Pour chaque capacité activée (image/audio/vidéo), sélectionner les pièces jointes selon la stratégie (par défaut : **première**).
  </Step>
  <Step title="Choisir le modèle">
    Choisir la première entrée de modèle admissible (taille + capacité + authentification).
  </Step>
  <Step title="Repli en cas d’échec">
    Si un modèle échoue ou si le média est trop volumineux, **se replier sur l’entrée suivante**.
  </Step>
  <Step title="Appliquer le bloc de réussite">
    En cas de réussite :

    - `Body` devient le bloc `[Image]`, `[Audio]` ou `[Video]`.
    - L’audio définit `{{Transcript}}` ; l’analyse des commandes utilise le texte de légende lorsqu’il est présent, sinon la transcription.
    - Les légendes sont conservées sous forme de `User text:` dans le bloc.

  </Step>
</Steps>

Si la compréhension échoue ou est désactivée, **le flux de réponse continue** avec le corps d’origine + les pièces jointes.

## Vue d’ensemble de la configuration

`tools.media` prend en charge des **modèles partagés** ainsi que des remplacements par capacité :

<AccordionGroup>
  <Accordion title="Clés de premier niveau">
    - `tools.media.models` : liste de modèles partagée (utilisez `capabilities` pour limiter).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video` :
      - valeurs par défaut (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - remplacements de fournisseur (`baseUrl`, `headers`, `providerOptions`)
      - options audio Deepgram via `tools.media.audio.providerOptions.deepgram`
      - contrôles d’écho de transcription audio (`echoTranscript`, valeur par défaut `false` ; `echoFormat`)
      - **liste `models` par capacité** facultative (prioritaire sur les modèles partagés)
      - stratégie `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (limitation facultative par canal/chatType/clé de session)
    - `tools.media.concurrency` : nombre maximal d’exécutions de capacités concurrentes (par défaut **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Entrées de modèle

Chaque entrée `models[]` peut être de type **fournisseur** ou **CLI** :

<Tabs>
  <Tab title="Entrée fournisseur">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
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

Valeurs par défaut recommandées :

- `maxChars` : **500** pour image/vidéo (court, adapté aux commandes)
- `maxChars` : **non défini** pour l’audio (transcription complète sauf si vous définissez une limite)
- `maxBytes` :
  - image : **10MB**
  - audio : **20MB**
  - vidéo : **50MB**

<AccordionGroup>
  <Accordion title="Règles">
    - Si le média dépasse `maxBytes`, ce modèle est ignoré et le **modèle suivant est essayé**.
    - Les fichiers audio inférieurs à **1024 octets** sont traités comme vides/corrompus et ignorés avant la transcription par fournisseur/CLI ; le contexte de réponse entrant reçoit une transcription d’espace réservé déterministe afin que l’agent sache que la note était trop petite.
    - Si le modèle renvoie plus de `maxChars`, la sortie est tronquée.
    - `prompt` utilise par défaut un simple "Describe the {media}." plus l’indication `maxChars` (image/vidéo uniquement).
    - Si le modèle d’image principal actif prend déjà en charge la vision nativement, OpenClaw ignore le bloc de résumé `[Image]` et transmet plutôt l’image d’origine au modèle.
    - Si un modèle principal Gateway/WebChat est textuel uniquement, les pièces jointes image sont conservées sous forme de références externalisées `media://inbound/*` afin que les outils image/PDF ou le modèle d’image configuré puissent toujours les inspecter au lieu de perdre la pièce jointe.
    - Les requêtes explicites `openclaw infer image describe --model <provider/model>` sont différentes : elles exécutent directement ce fournisseur/modèle compatible image, y compris les références Ollama telles que `ollama/qwen2.5vl:7b`.
    - Si `<capability>.enabled: true` mais qu’aucun modèle n’est configuré, OpenClaw essaie le **modèle de réponse actif** lorsque son fournisseur prend en charge la capacité.

  </Accordion>
</AccordionGroup>

### Détection automatique de la compréhension média (par défaut)

Si `tools.media.<capability>.enabled` n’est **pas** défini sur `false` et que vous n’avez pas configuré de modèles, OpenClaw détecte automatiquement dans cet ordre et **s’arrête à la première option fonctionnelle** :

<Steps>
  <Step title="Modèle de réponse actif">
    Modèle de réponse actif lorsque son fournisseur prend en charge la capacité.
  </Step>
  <Step title="agents.defaults.imageModel">
    Références principales/de repli `agents.defaults.imageModel` (image uniquement).
    Préférez les références `provider/model`. Les références nues sont qualifiées à partir des entrées de modèles de fournisseur compatibles image configurées uniquement lorsque la correspondance est unique.
  </Step>
  <Step title="CLI locales (audio uniquement)">
    CLI locales (si installées) :

    - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le modèle tiny intégré)
    - `whisper` (CLI Python ; télécharge les modèles automatiquement)

  </Step>
  <Step title="CLI Gemini">
    `gemini` avec `read_many_files`.
  </Step>
  <Step title="Authentification fournisseur">
    - Les entrées `models.providers.*` configurées qui prennent en charge la capacité sont essayées avant l’ordre de repli intégré.
    - Les fournisseurs de configuration image uniquement avec un modèle compatible image s’enregistrent automatiquement pour la compréhension média même lorsqu’ils ne sont pas un plugin de fournisseur intégré.
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
La détection des binaires est au mieux sur macOS/Linux/Windows ; assurez-vous que la CLI est dans `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.
</Note>

### Prise en charge des environnements proxy (modèles de fournisseur)

Lorsque la compréhension média **audio** et **vidéo** basée sur un fournisseur est activée, OpenClaw respecte les variables d’environnement de proxy sortant standard pour les appels HTTP fournisseur :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Si aucune variable d’environnement proxy n’est définie, la compréhension média utilise une sortie directe. Si la valeur du proxy est mal formée, OpenClaw consigne un avertissement et revient à une récupération directe.

## Capacités (facultatif)

Si vous définissez `capabilities`, l’entrée s’exécute uniquement pour ces types de médias. Pour les listes partagées, OpenClaw peut déduire les valeurs par défaut :

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

Pour les entrées CLI, **définissez `capabilities` explicitement** afin d’éviter les correspondances surprenantes. Si vous omettez `capabilities`, l’entrée est admissible pour la liste dans laquelle elle apparaît.

## Matrice de prise en charge des fournisseurs (intégrations OpenClaw)

| Capacité | Intégration fournisseur                                                                                                      | Notes                                                                                                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image    | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Les plugins de fournisseur enregistrent la prise en charge des images ; `openai-codex/*` utilise la plomberie du fournisseur OAuth ; `codex/*` utilise un tour limité de Codex app-server ; MiniMax et MiniMax OAuth utilisent tous deux `MiniMax-VL-01` ; les fournisseurs de configuration compatibles image s’enregistrent automatiquement. |
| Audio    | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Transcription par fournisseur (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                            |
| Vidéo    | Google, Qwen, Moonshot                                                                                                       | Compréhension vidéo par fournisseur via les plugins de fournisseur ; la compréhension vidéo Qwen utilise les points de terminaison Standard DashScope.                                                                                  |

<Note>
**Note MiniMax**

- La compréhension d’image `minimax` et `minimax-portal` provient du fournisseur média `MiniMax-VL-01` détenu par le plugin.
- Le catalogue de texte MiniMax intégré commence toujours en texte uniquement ; les entrées explicites `models.providers.minimax` matérialisent des références de chat M2.7 compatibles image.

</Note>

## Conseils de sélection des modèles

- Préférez le modèle de dernière génération le plus puissant disponible pour chaque capacité média lorsque la qualité et la sécurité comptent.
- Pour les agents avec outils qui traitent des entrées non fiables, évitez les modèles média plus anciens/faibles.
- Gardez au moins un repli par capacité pour la disponibilité (modèle de qualité + modèle plus rapide/moins cher).
- Les replis CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API de fournisseurs sont indisponibles.
- Note `parakeet-mlx` : avec `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque le format de sortie est `txt` (ou non spécifié) ; les formats non `txt` reviennent à stdout.

## Stratégie de pièces jointes

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
    - Le texte extrait du fichier est enveloppé comme **contenu externe non fiable** avant d’être ajouté au prompt média.
    - Le bloc injecté utilise des marqueurs de limite explicites comme `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées `Source: External`.
    - Ce chemin d’extraction des pièces jointes omet volontairement la longue bannière `SECURITY NOTICE:` afin d’éviter d’alourdir le prompt média ; les marqueurs de limite et les métadonnées restent toutefois présents.
    - Si un fichier ne contient aucun texte extractible, OpenClaw injecte `[No extractable text]`.
    - Si un PDF bascule vers des images de pages rendues dans ce chemin, le prompt média conserve l’espace réservé `[PDF content rendered to images; images not forwarded to model]`, car cette étape d’extraction des pièces jointes transmet des blocs de texte, et non les images PDF rendues.

  </Accordion>
</AccordionGroup>

## Exemples de configuration

<Tabs>
  <Tab title="Modèles partagés + substitutions">
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

Cela affiche les résultats par capacité et le fournisseur/modèle choisi lorsqu’il y a lieu.

## Notes

- La compréhension est effectuée **au mieux**. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont toujours transmises aux modèles même lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter les endroits où la compréhension s’exécute (par exemple uniquement les DM).

## Connexe

- [Configuration](/fr/gateway/configuration)
- [Prise en charge des images et médias](/fr/nodes/images)
