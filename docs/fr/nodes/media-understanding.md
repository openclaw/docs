---
read_when:
    - Concevoir ou refactoriser la compréhension des médias
    - Réglage du prétraitement entrant de l’audio, de la vidéo et des images
sidebarTitle: Media understanding
summary: Compréhension entrante des images/audio/vidéos (facultatif) avec solutions de repli fournisseur + CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-06-28T05:08:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw peut **résumer les médias entrants** (image/audio/vidéo) avant l’exécution du pipeline de réponse. Il détecte automatiquement quand des outils locaux ou des clés de fournisseur sont disponibles, et peut être désactivé ou personnalisé. Si la compréhension est désactivée, les modèles reçoivent toujours les fichiers/URL d’origine comme d’habitude.

Le comportement média propre à chaque fournisseur est enregistré par les plugins de fournisseur, tandis que le cœur d’OpenClaw possède la configuration partagée `tools.media`, l’ordre de repli et l’intégration au pipeline de réponse.

## Objectifs

- Facultatif : pré-digérer les médias entrants en texte court pour un routage plus rapide et une meilleure analyse des commandes.
- Préserver la livraison du média d’origine au modèle (toujours).
- Prendre en charge les **API de fournisseur** et les **replis CLI**.
- Autoriser plusieurs modèles avec repli ordonné (erreur/taille/délai d’expiration).

## Comportement de haut niveau

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

    - `Body` devient un bloc `[Image]`, `[Audio]` ou `[Video]`.
    - L’audio définit `{{Transcript}}` ; l’analyse des commandes utilise le texte de légende lorsqu’il est présent, sinon la transcription.
    - Les légendes sont conservées comme `User text:` dans le bloc.

  </Step>
</Steps>

Si la compréhension échoue ou est désactivée, **le flux de réponse continue** avec le corps d’origine + les pièces jointes.

## Vue d’ensemble de la configuration

`tools.media` prend en charge des **modèles partagés** ainsi que des remplacements par capacité :

<AccordionGroup>
  <Accordion title="Clés de premier niveau">
    - `tools.media.models` : liste de modèles partagée (utiliser `capabilities` pour filtrer).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video` :
      - valeurs par défaut (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - remplacements de fournisseur (`baseUrl`, `headers`, `providerOptions`)
      - options audio Deepgram via `tools.media.audio.providerOptions.deepgram`
      - contrôles d’écho de transcription audio (`echoTranscript`, par défaut `false` ; `echoFormat`)
      - **liste `models` par capacité** facultative (préférée avant les modèles partagés)
      - stratégie `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (filtrage facultatif par canal/chatType/clé de session)
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

Chaque entrée `models[]` peut être **fournisseur** ou **CLI** :

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
    - `{{OutputDir}}` (répertoire de travail créé pour cette exécution)
    - `{{OutputBase}}` (chemin de base du fichier de travail, sans extension)

  </Tab>
</Tabs>

### Identifiants du fournisseur (`apiKey`)

La compréhension média par fournisseur utilise la même résolution d’authentification fournisseur que les appels de modèle normaux : profils d’authentification, variables d’environnement, puis `models.providers.<providerId>.apiKey`.

Les entrées `tools.media.*.models[]` n’acceptent pas de champ `apiKey` en ligne. La valeur `provider` dans une entrée de modèle média, comme `openai` ou `moonshot`, doit disposer d’identifiants via l’une des sources d’authentification fournisseur standard.

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

Pour la référence complète de l’authentification fournisseur, y compris les profils, les variables d’environnement et les URL de base personnalisées, consultez [Outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Valeurs par défaut et limites

Valeurs par défaut recommandées :

- `maxChars` : **500** pour image/vidéo (court, adapté aux commandes)
- `maxChars` : **non défini** pour l’audio (transcription complète sauf si vous définissez une limite)
- `maxBytes` :
  - image : **10 Mo**
  - audio : **20 Mo**
  - vidéo : **50 Mo**

<AccordionGroup>
  <Accordion title="Règles">
    - Si le média dépasse `maxBytes`, ce modèle est ignoré et le **modèle suivant est essayé**.
    - Les fichiers audio inférieurs à **1024 octets** sont traités comme vides/corrompus et ignorés avant la transcription par fournisseur/CLI ; le contexte de réponse entrante reçoit une transcription d’espace réservé déterministe pour que l’agent sache que la note était trop petite.
    - Si le modèle renvoie plus de `maxChars`, la sortie est tronquée.
    - `prompt` utilise par défaut un simple "Describe the {media}." plus l’indication `maxChars` (image/vidéo uniquement).
    - Si le modèle d’image principal actif prend déjà en charge la vision nativement, OpenClaw ignore le bloc de résumé `[Image]` et transmet plutôt l’image d’origine au modèle.
    - Si un modèle principal Gateway/WebChat est uniquement textuel, les pièces jointes d’image sont conservées comme références déchargées `media://inbound/*` afin que les outils image/PDF ou le modèle d’image configuré puissent toujours les inspecter au lieu de perdre la pièce jointe.
    - Les requêtes explicites `openclaw infer image describe --model <provider/model>` sont différentes : elles exécutent directement ce fournisseur/modèle compatible image, y compris les références Ollama comme `ollama/qwen2.5vl:7b`.
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
    Préférez les références `provider/model`. Les références nues sont qualifiées à partir des entrées de modèle de fournisseur compatible image configurées uniquement lorsque la correspondance est unique.
  </Step>
  <Step title="CLI locales (audio uniquement)">
    CLI locales (si installées) :

    - `sherpa-onnx-offline` (requiert `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le modèle tiny intégré)
    - `whisper` (CLI Python ; télécharge automatiquement les modèles)

  </Step>
  <Step title="CLI Gemini">
    `gemini` utilisant `read_many_files`.
  </Step>
  <Step title="Authentification fournisseur">
    - Les entrées `models.providers.*` configurées qui prennent en charge la capacité sont essayées avant l’ordre de repli intégré.
    - Les fournisseurs de configuration image uniquement avec un modèle compatible image s’enregistrent automatiquement pour la compréhension média même lorsqu’ils ne sont pas un plugin de fournisseur intégré.
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
La détection binaire est de type meilleur effort sur macOS/Linux/Windows ; assurez-vous que la CLI est sur `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.
</Note>

### Prise en charge de l’environnement proxy (modèles fournisseur)

Lorsque la compréhension média **audio** et **vidéo** basée sur fournisseur est activée, OpenClaw respecte les variables d’environnement proxy sortantes standard pour les appels HTTP au fournisseur :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Si aucune variable d’environnement proxy n’est définie, la compréhension média utilise une sortie directe. Si la valeur du proxy est mal formée, OpenClaw journalise un avertissement et se rabat sur une récupération directe.

## Capacités (facultatif)

Si vous définissez `capabilities`, l’entrée s’exécute uniquement pour ces types de médias. Pour les listes partagées, OpenClaw peut inférer les valeurs par défaut :

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

Pour les entrées CLI, **définissez `capabilities` explicitement** afin d’éviter des correspondances inattendues. Si vous omettez `capabilities`, l’entrée est admissible pour la liste dans laquelle elle apparaît.

## Matrice de prise en charge des capacités (intégrations OpenClaw)

| Capacité | Intégration fournisseur                                                                                                      | Notes                                                                                                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image    | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, fournisseurs de configuration | Les plugins de fournisseur enregistrent la prise en charge des images ; `openai/*` peut utiliser un routage par clé API ou Codex OAuth ; `codex/*` utilise un tour limité du Codex app-server ; MiniMax et MiniMax OAuth utilisent tous deux `MiniMax-VL-01` ; les fournisseurs de configuration compatibles image s’enregistrent automatiquement. |
| Audio    | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Transcription fournisseur (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                     |
| Vidéo    | Google, Qwen, Moonshot                                                                                                       | Compréhension vidéo fournisseur via les plugins de fournisseur ; la compréhension vidéo Qwen utilise les points de terminaison Standard DashScope.                                                                                          |

<Note>
**Note MiniMax**

- La compréhension des images pour `minimax`, `minimax-cn`, `minimax-portal` et `minimax-portal-cn` provient du fournisseur multimédia `MiniMax-VL-01` propre au Plugin.
- Le routage automatique des images continue d’utiliser `MiniMax-VL-01`, même si les métadonnées héritées de chat MiniMax M2.x déclarent une entrée image.

</Note>

## Conseils de sélection de modèle

- Privilégiez le modèle de dernière génération le plus performant disponible pour chaque capacité multimédia lorsque la qualité et la sécurité comptent.
- Pour les agents avec outils qui traitent des entrées non fiables, évitez les modèles multimédias plus anciens ou moins performants.
- Conservez au moins une solution de secours par capacité pour la disponibilité (modèle de qualité + modèle plus rapide/moins coûteux).
- Les solutions de secours CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API des fournisseurs ne sont pas disponibles.
- Note `parakeet-mlx` : avec `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque le format de sortie est `txt` (ou non spécifié) ; les formats autres que `txt` se rabattent sur stdout.

## Politique des pièces jointes

Par capacité, `attachments` contrôle quelles pièces jointes sont traitées :

<ParamField path="mode" type='"first" | "all"' default="first">
  Indique s’il faut traiter la première pièce jointe sélectionnée ou toutes les pièces jointes.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limite le nombre d’éléments traités.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Préférence de sélection parmi les pièces jointes candidates.
</ParamField>

Lorsque `mode: "all"`, les sorties sont libellées `[Image 1/2]`, `[Audio 2/2]`, etc.

<AccordionGroup>
  <Accordion title="Comportement d’extraction des pièces jointes fichiers">
    - Le texte de fichier extrait est encapsulé comme **contenu externe non fiable** avant d’être ajouté au prompt multimédia.
    - Le bloc injecté utilise des marqueurs de limite explicites comme `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées `Source: External`.
    - Ce chemin d’extraction des pièces jointes omet intentionnellement la longue bannière `SECURITY NOTICE:` afin d’éviter d’alourdir le prompt multimédia ; les marqueurs de limite et les métadonnées restent toutefois présents.
    - Si un fichier ne contient aucun texte extractible, OpenClaw injecte `[No extractable text]`.
    - Si un PDF se rabat sur des images de pages rendues dans ce chemin, OpenClaw transmet ces images de pages aux modèles de réponse compatibles vision et conserve l’espace réservé `[PDF content rendered to images]` dans le bloc de fichier.

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
  <Tab title="Entrée multimodale unique">
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

## Notes

- La compréhension fonctionne **au mieux**. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont toujours transmises aux modèles même lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter l’endroit où la compréhension s’exécute (par exemple uniquement dans les DM).

## Voir aussi

- [Configuration](/fr/gateway/configuration)
- [Prise en charge des images et des médias](/fr/nodes/images)
