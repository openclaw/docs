---
read_when:
    - Concevoir ou refactoriser la compréhension des médias
    - Optimisation du prétraitement audio/vidéo/image entrant
sidebarTitle: Media understanding
summary: Compréhension entrante des images, de l’audio et de la vidéo (facultatif) avec solutions de repli du fournisseur et de la CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-06-28T05:43:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw peut **résumer les médias entrants** (image/audio/vidéo) avant l’exécution du pipeline de réponse. Il détecte automatiquement quand des outils locaux ou des clés fournisseur sont disponibles, et peut être désactivé ou personnalisé. Si la compréhension est désactivée, les modèles reçoivent toujours les fichiers/URL d’origine comme d’habitude.

Le comportement des médias propre à chaque fournisseur est enregistré par les plugins fournisseurs, tandis que le cœur d’OpenClaw possède la configuration partagée `tools.media`, l’ordre de repli et l’intégration au pipeline de réponse.

## Objectifs

- Facultatif : prétraiter les médias entrants en court texte pour un routage plus rapide et une meilleure analyse des commandes.
- Préserver la livraison des médias d’origine au modèle (toujours).
- Prendre en charge les **API fournisseur** et les **solutions de repli CLI**.
- Autoriser plusieurs modèles avec un repli ordonné (erreur/taille/délai d’expiration).

## Comportement général

<Steps>
  <Step title="Collect attachments">
    Collecter les pièces jointes entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Select per-capability">
    Pour chaque capacité activée (image/audio/vidéo), sélectionner les pièces jointes selon la politique (par défaut : **première**).
  </Step>
  <Step title="Choose model">
    Choisir la première entrée de modèle éligible (taille + capacité + authentification).
  </Step>
  <Step title="Fallback on failure">
    Si un modèle échoue ou si le média est trop volumineux, **se replier sur l’entrée suivante**.
  </Step>
  <Step title="Apply success block">
    En cas de succès :

    - `Body` devient un bloc `[Image]`, `[Audio]` ou `[Video]`.
    - L’audio définit `{{Transcript}}` ; l’analyse des commandes utilise le texte de la légende lorsqu’il est présent, sinon la transcription.
    - Les légendes sont préservées sous la forme `User text:` dans le bloc.

  </Step>
</Steps>

Si la compréhension échoue ou est désactivée, **le flux de réponse continue** avec le corps d’origine + les pièces jointes.

## Vue d’ensemble de la configuration

`tools.media` prend en charge des **modèles partagés** ainsi que des remplacements par capacité :

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models` : liste de modèles partagée (utilisez `capabilities` pour limiter).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video` :
      - valeurs par défaut (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - remplacements fournisseur (`baseUrl`, `headers`, `providerOptions`)
      - options audio Deepgram via `tools.media.audio.providerOptions.deepgram`
      - contrôles d’écho de transcription audio (`echoTranscript`, valeur par défaut `false` ; `echoFormat`)
      - liste **`models` par capacité** facultative (prioritaire sur les modèles partagés)
      - politique `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (limitation facultative par canal/chatType/clé de session)
    - `tools.media.concurrency` : nombre maximal d’exécutions de capacités simultanées (par défaut **2**).

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
  <Tab title="Provider entry">
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
  <Tab title="CLI entry">
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

  </Tab>
</Tabs>

### Identifiants fournisseur (`apiKey`)

La compréhension des médias par fournisseur utilise la même résolution d’authentification fournisseur que les appels de modèle normaux : profils d’authentification, variables d’environnement, puis `models.providers.<providerId>.apiKey`.

Les entrées `tools.media.*.models[]` n’acceptent pas de champ `apiKey` en ligne. La valeur `provider` dans une entrée de modèle média, comme `openai` ou `moonshot`, doit disposer d’identifiants disponibles via l’une des sources d’authentification fournisseur standard.

Exemple minimal :

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Pour la référence complète sur l’authentification fournisseur, y compris les profils, les variables d’environnement et les URL de base personnalisées, consultez [Outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Valeurs par défaut et limites

Valeurs par défaut recommandées :

- `maxChars` : **500** pour image/vidéo (court, adapté aux commandes)
- `maxChars` : **non défini** pour l’audio (transcription complète sauf si vous définissez une limite)
- `maxBytes` :
  - image : **10 Mo**
  - audio : **20 Mo**
  - vidéo : **50 Mo**

<AccordionGroup>
  <Accordion title="Rules">
    - Si un média dépasse `maxBytes`, ce modèle est ignoré et le **modèle suivant est essayé**.
    - Les fichiers audio inférieurs à **1024 octets** sont considérés comme vides/corrompus et ignorés avant la transcription par fournisseur/CLI ; le contexte de réponse entrant reçoit une transcription d’espace réservé déterministe afin que l’agent sache que la note était trop petite.
    - Si le modèle renvoie plus que `maxChars`, la sortie est tronquée.
    - `prompt` utilise par défaut un simple « Describe the {media}. » plus les indications `maxChars` (image/vidéo uniquement).
    - Si le modèle d’image principal actif prend déjà en charge la vision nativement, OpenClaw ignore le bloc de résumé `[Image]` et transmet plutôt l’image d’origine au modèle.
    - Si un modèle principal Gateway/WebChat est uniquement textuel, les pièces jointes image sont préservées sous forme de références déchargées `media://inbound/*`, afin que les outils image/PDF ou le modèle d’image configuré puissent toujours les inspecter au lieu de perdre la pièce jointe.
    - Les requêtes explicites `openclaw infer image describe --model <provider/model>` sont différentes : elles exécutent directement ce fournisseur/modèle compatible image, y compris les références Ollama comme `ollama/qwen2.5vl:7b`.
    - Si `<capability>.enabled: true` mais qu’aucun modèle n’est configuré, OpenClaw essaie le **modèle de réponse actif** lorsque son fournisseur prend en charge la capacité.

  </Accordion>
</AccordionGroup>

### Détection automatique de la compréhension des médias (par défaut)

Si `tools.media.<capability>.enabled` n’est **pas** défini sur `false` et que vous n’avez pas configuré de modèles, OpenClaw effectue une détection automatique dans cet ordre et **s’arrête à la première option fonctionnelle** :

<Steps>
  <Step title="Active reply model">
    Modèle de réponse actif lorsque son fournisseur prend en charge la capacité.
  </Step>
  <Step title="agents.defaults.imageModel">
    Références principales/de repli `agents.defaults.imageModel` (image uniquement).
    Préférez les références `provider/model`. Les références nues sont qualifiées à partir des entrées de modèle fournisseur compatibles image configurées uniquement lorsque la correspondance est unique.
  </Step>
  <Step title="Local CLIs (audio only)">
    CLI locaux (si installés) :

    - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le petit modèle intégré)
    - `whisper` (CLI Python ; télécharge automatiquement les modèles)

  </Step>
  <Step title="Gemini CLI">
    `gemini` avec `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - Les entrées `models.providers.*` configurées qui prennent en charge la capacité sont essayées avant l’ordre de repli intégré.
    - Les fournisseurs de configuration uniquement image avec un modèle compatible image s’enregistrent automatiquement pour la compréhension des médias, même lorsqu’ils ne sont pas un plugin fournisseur intégré.
    - La compréhension d’image Ollama est disponible lorsqu’elle est sélectionnée explicitement, par exemple via `agents.defaults.imageModel` ou `openclaw infer image describe --model ollama/<vision-model>`.

    Ordre de repli intégré :

    - Audio : OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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
La détection binaire fonctionne au mieux sur macOS/Linux/Windows ; assurez-vous que la CLI est dans `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.
</Note>

### Prise en charge de l’environnement proxy (modèles fournisseur)

Lorsque la compréhension des médias **audio** et **vidéo** basée sur fournisseur est activée, OpenClaw respecte les variables d’environnement de proxy sortant standard pour les appels HTTP fournisseur :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Si aucune variable d’environnement de proxy n’est définie, la compréhension des médias utilise une sortie directe. Si la valeur du proxy est mal formée, OpenClaw journalise un avertissement et se replie sur une récupération directe.

## Capacités (facultatif)

Si vous définissez `capabilities`, l’entrée ne s’exécute que pour ces types de médias. Pour les listes partagées, OpenClaw peut inférer les valeurs par défaut :

- `openai`, `anthropic`, `minimax` : **image**
- `minimax-portal` : **image**
- `moonshot` : **image + vidéo**
- `openrouter` : **image + audio**
- `google` (API Gemini) : **image + audio + vidéo**
- `qwen` : **image + vidéo**
- `mistral` : **audio**
- `zai` : **image**
- `groq` : **audio**
- `xai` : **audio**
- `deepgram` : **audio**
- Tout catalogue `models.providers.<id>.models[]` avec un modèle compatible image : **image**

Pour les entrées CLI, **définissez `capabilities` explicitement** afin d’éviter les correspondances surprenantes. Si vous omettez `capabilities`, l’entrée est éligible pour la liste dans laquelle elle apparaît.

## Matrice de prise en charge des fournisseurs (intégrations OpenClaw)

| Capacité | Intégration fournisseur                                                                                                      | Notes                                                                                                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Image    | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, fournisseurs de configuration | Les plugins fournisseurs enregistrent la prise en charge des images ; `openai/*` peut utiliser le routage par clé API ou Codex OAuth ; `codex/*` utilise un tour Codex app-server borné ; MiniMax et MiniMax OAuth utilisent tous deux `MiniMax-VL-01` ; les fournisseurs de configuration compatibles image s’enregistrent automatiquement. |
| Audio    | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Transcription fournisseur (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                    |
| Vidéo    | Google, Qwen, Moonshot                                                                                                       | Compréhension vidéo fournisseur via les plugins fournisseurs ; la compréhension vidéo Qwen utilise les points de terminaison Standard DashScope.                                                                                           |

<Note>
**Note MiniMax**

- La compréhension d’images de `minimax`, `minimax-cn`, `minimax-portal` et `minimax-portal-cn` provient du fournisseur multimédia `MiniMax-VL-01` détenu par le plugin.
- Le routage automatique des images continue d’utiliser `MiniMax-VL-01`, même si les métadonnées de chat héritées MiniMax M2.x indiquent une entrée image.

</Note>

## Conseils de sélection des modèles

- Préférez le modèle de dernière génération le plus puissant disponible pour chaque capacité multimédia lorsque la qualité et la sécurité comptent.
- Pour les agents avec outils traitant des entrées non fiables, évitez les modèles multimédias plus anciens ou plus faibles.
- Conservez au moins une solution de repli par capacité pour la disponibilité (modèle de qualité + modèle plus rapide/moins cher).
- Les solutions de repli CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API des fournisseurs ne sont pas disponibles.
- Remarque sur `parakeet-mlx` : avec `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque le format de sortie est `txt` (ou non spécifié) ; les formats non `txt` se replient sur stdout.

## Politique des pièces jointes

Par capacité, `attachments` contrôle les pièces jointes traitées :

<ParamField path="mode" type='"first" | "all"' default="first">
  Indique s’il faut traiter la première pièce jointe sélectionnée ou toutes les traiter.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limite le nombre traité.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Préférence de sélection parmi les pièces jointes candidates.
</ParamField>

Lorsque `mode: "all"`, les sorties sont étiquetées `[Image 1/2]`, `[Audio 2/2]`, etc.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Le texte extrait du fichier est encapsulé comme **contenu externe non fiable** avant d’être ajouté à l’invite multimédia.
    - Le bloc injecté utilise des marqueurs de délimitation explicites comme `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées `Source: External`.
    - Ce chemin d’extraction des pièces jointes omet intentionnellement la longue bannière `SECURITY NOTICE:` afin d’éviter d’alourdir l’invite multimédia ; les marqueurs de délimitation et les métadonnées restent toutefois présents.
    - Si un fichier n’a pas de texte extractible, OpenClaw injecte `[No extractable text]`.
    - Si un PDF se replie sur des images de pages rendues dans ce chemin, OpenClaw transmet ces images de pages aux modèles de réponse compatibles avec la vision et conserve l’espace réservé `[PDF content rendered to images]` dans le bloc du fichier.

  </Accordion>
</AccordionGroup>

## Exemples de configuration

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

Lorsque la compréhension multimédia s’exécute, `/status` inclut une courte ligne de résumé :

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Cela affiche les résultats par capacité et le fournisseur/modèle choisi le cas échéant.

## Remarques

- La compréhension est fournie **au mieux**. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont toujours transmises aux modèles, même lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter les endroits où la compréhension s’exécute (par exemple uniquement les messages directs).

## Liens associés

- [Configuration](/fr/gateway/configuration)
- [Prise en charge des images et médias](/fr/nodes/images)
