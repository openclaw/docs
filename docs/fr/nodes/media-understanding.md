---
read_when:
    - Conception ou refactorisation de la compréhension des médias
    - Réglage du prétraitement des contenus audio, vidéo et image entrants
sidebarTitle: Media understanding
summary: Compréhension des images, de l’audio et des vidéos entrants (facultative), avec solutions de secours via fournisseur et CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-07-12T02:46:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw peut résumer les médias entrants (image/audio/vidéo) avant l’exécution du pipeline de réponse, afin que l’analyse des commandes et le routage s’appuient sur un texte court plutôt que sur des octets bruts. La compréhension détecte automatiquement les outils locaux ou les clés de fournisseur, mais vous pouvez aussi configurer des modèles explicites. Le média d’origine est toujours transmis au modèle comme d’habitude ; si la compréhension échoue ou est désactivée, le flux de réponse se poursuit sans changement.

Les Plugins de fournisseurs enregistrent les métadonnées de capacité (quel fournisseur prend en charge quel type de média, modèle par défaut, priorité). Le cœur d’OpenClaw gère la configuration partagée `tools.media`, l’ordre de repli et l’intégration au pipeline de réponse.

## Fonctionnement

<Steps>
  <Step title="Collecter les pièces jointes">
    Collectez les pièces jointes entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Sélectionner par capacité">
    Pour chaque capacité activée (image/audio/vidéo), sélectionnez les pièces jointes conformément à la stratégie `attachments` (par défaut : uniquement la première pièce jointe).
  </Step>
  <Step title="Choisir un modèle">
    Choisissez la première entrée de modèle admissible (taille, capacité et authentification disponible).
  </Step>
  <Step title="Se replier en cas d’échec">
    Si un modèle renvoie une erreur, expire ou si le média dépasse `maxBytes`, essayez l’entrée suivante.
  </Step>
  <Step title="Appliquer en cas de réussite">
    `Body` devient un bloc `[Image]`, `[Audio]` ou `[Video]`. L’audio définit également `{{Transcript}}` ; l’analyse des commandes utilise le texte de la légende lorsqu’il est présent, sinon la transcription. Les légendes sont conservées sous la forme `User text:` dans le bloc.
  </Step>
</Steps>

## Configuration

`tools.media` contient une liste de modèles partagée ainsi que des remplacements propres à chaque capacité :

```json5
{
  tools: {
    media: {
      concurrency: 2, // nombre maximal d’exécutions simultanées de capacités (par défaut)
      models: [/* liste partagée, filtrée selon les capacités */],
      image: {/* remplacements facultatifs */},
      audio: {
        /* remplacements facultatifs */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* remplacements facultatifs */},
    },
  },
}
```

Clés propres à chaque capacité (`image`/`audio`/`video`) :

| Clé                                             | Type      | Valeur par défaut                                     | Remarques                                                                                           |
| ----------------------------------------------- | --------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | auto (`false` désactive)                              | Définissez sur `false` pour désactiver la détection automatique de cette capacité                   |
| `models`                                        | tableau   | aucune                                                | Prioritaire sur la liste partagée `tools.media.models`                                              |
| `prompt`                                        | `string`  | `"Décrivez le média {media}."` (+ indication maxChars) | Image/vidéo uniquement par défaut                                                                   |
| `maxChars`                                      | `number`  | `500` (image/vidéo), non défini (audio)               | La sortie est tronquée si le modèle renvoie davantage                                               |
| `maxBytes`                                      | `number`  | image `10485760`, audio `20971520`, vidéo `52428800`  | Un média trop volumineux entraîne le passage au modèle suivant                                      |
| `timeoutSeconds`                                | `number`  | `60` (image/audio), `120` (vidéo)                     |                                                                                                     |
| `language`                                      | `string`  | non défini                                            | Indication de langue pour la transcription audio                                                    |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                     | Remplacements de requête du fournisseur ; consultez [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) |
| `attachments`                                   | objet     | `{ mode: "first", maxAttachments: 1 }`                | Consultez [Stratégie des pièces jointes](#attachment-policy)                                        |
| `scope`                                         | objet     | non défini                                            | Filtrage selon channel/chatType/keyPrefix                                                            |
| `echoTranscript`                                | `boolean` | `false`                                               | Audio uniquement : renvoie la transcription dans la discussion avant le traitement par l’agent     |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                 | Audio uniquement : espace réservé `{transcript}`                                                    |

Les options propres à Deepgram se placent sous `providerOptions.deepgram` (le champ de premier niveau `deepgram: { detectLanguage, punctuate, smartFormat }` est obsolète, mais reste pris en charge en lecture).

### Entrées de modèle

Chaque entrée `models[]` est une entrée de **fournisseur** (par défaut) ou une entrée de **CLI** :

<Tabs>
  <Tab title="Entrée de fournisseur">
    ```json5
    {
      type: "provider", // valeur par défaut si omis
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Décrivez l’image en 500 caractères maximum.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // facultatif, pour les entrées partagées multimodales
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Entrée de CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Lisez le média à l’emplacement {{MediaPath}} et décrivez-le en {{MaxChars}} caractères maximum.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Les modèles de CLI peuvent également utiliser `{{MediaDir}}` (répertoire contenant le fichier multimédia), `{{OutputDir}}` (répertoire temporaire créé pour cette exécution) et `{{OutputBase}}` (chemin de base du fichier temporaire, sans extension).

  </Tab>
</Tabs>

### Identifiants des fournisseurs

La compréhension des médias par les fournisseurs utilise la même résolution d’authentification que les appels de modèle ordinaires : profils d’authentification, variables d’environnement, puis `models.providers.<providerId>.apiKey`. Les entrées `tools.media.*.models[]` n’acceptent pas de champ `apiKey` intégré.

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

Consultez [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) pour les profils, les variables d’environnement et les URL de base personnalisées.

## Règles et comportement

- Un média dépassant `maxBytes` est ignoré pour ce modèle, puis le modèle suivant est essayé.
- Les fichiers audio de moins de 1 024 octets sont considérés comme vides ou corrompus et ignorés avant la transcription ; l’agent reçoit à la place une transcription substitutive déterministe.
- Si le modèle d’image principal actif prend déjà en charge la vision nativement, OpenClaw omet le bloc récapitulatif `[Image]` et transmet directement l’image d’origine au modèle. MiniMax constitue une exception : `minimax`, `minimax-cn`, `minimax-portal` et `minimax-portal-cn` acheminent toujours la compréhension des images via le fournisseur de médias `MiniMax-VL-01` géré par le Plugin, même si les anciennes métadonnées de discussion MiniMax M2.x déclarent accepter les images en entrée (seuls `MiniMax-M3` et les modèles ultérieurs sont considérés comme prenant en charge la vision nativement).
- Si le modèle principal du Gateway/WebChat n’accepte que le texte, les pièces jointes d’image sont conservées sous forme de références externalisées `media://inbound/*`, afin que les outils d’image/PDF ou un modèle d’image configuré puissent toujours les examiner au lieu de perdre la pièce jointe.
- La commande explicite `openclaw infer image describe --file <path> --model <provider/model>` (alias : `openclaw capability image describe`) exécute directement ce fournisseur/modèle prenant en charge les images, y compris les références Ollama telles que `ollama/qwen2.5vl:7b` lorsqu’un modèle correspondant prenant en charge les images est configuré sous `models.providers.ollama.models[]`.
- Si `<capability>.enabled` n’est pas défini sur `false`, mais qu’aucun modèle n’est configuré, OpenClaw essaie le modèle de réponse actif lorsque son fournisseur prend en charge la capacité.

### Détection automatique (par défaut)

Lorsque `tools.media.<capability>.enabled` n’est pas défini sur `false` et qu’aucun modèle n’est configuré, OpenClaw essaie les options suivantes dans l’ordre et s’arrête à la première qui fonctionne :

<Steps>
  <Step title="Modèle d’image configuré (image uniquement)">
    Références principales/de repli de `agents.defaults.imageModel`, sauf si le modèle de réponse actif prend déjà en charge la vision nativement. Privilégiez les références `provider/model` ; les références sans préfixe ne sont qualifiées à partir des entrées de modèles de fournisseur prenant en charge les images que si la correspondance est unique.
  </Step>
  <Step title="Modèle de réponse actif">
    Le modèle de réponse actif, lorsque son fournisseur prend en charge la capacité.
  </Step>
  <Step title="Authentification du fournisseur (audio uniquement, avant les CLI locales)">
    Les entrées `models.providers.*` configurées qui prennent en charge l’audio sont essayées avant les CLI locales. Ordre de priorité des fournisseurs intégrés (les égalités sont départagées par ordre alphabétique de l’identifiant du fournisseur) : Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="CLI locales (audio uniquement)">
    Les binaires locaux prêts à l’emploi constituent une liste de repli ordonnée :
    - `whisper-cli` en premier uniquement après qu’un appel de modèle antérieur dans le processus actuel a détecté Metal ou CUDA
    - `sherpa-onnx-offline` utilisant le processeur par défaut (nécessite `SHERPA_ONNX_MODEL_DIR` avec `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` lorsque l’accélération est seulement prise en charge par la compilation ou n’a pas été observée
    - `parakeet-mlx` sur Apple Silicon (compatible MLX, utilisation du périphérique non observée)
    - `whisper` (CLI Python ; utilise par défaut le modèle `turbo`, téléchargé automatiquement)

    L’inspection des capacités du moteur est mise en cache et ne charge aucun modèle. La capacité de compilation, les indicateurs de moteur demandés et le moteur observé lors d’un véritable appel restent distincts. whisper.cpp détecté automatiquement conserve les journaux d’exécution du modèle afin que la ligne indiquant le moteur sélectionné en amont puisse être enregistrée. Les entrées de CLI explicites conservent leur ordre configuré, leurs indicateurs de moteur et leurs indicateurs de sortie.

  </Step>
  <Step title="Authentification du fournisseur (image/vidéo)">
    Les entrées `models.providers.*` configurées qui prennent en charge la capacité sont essayées avant l’ordre de repli intégré. Les fournisseurs configurés uniquement pour les images et disposant d’un modèle prenant en charge les images sont automatiquement enregistrés pour la compréhension des médias, même s’ils ne sont pas un Plugin de fournisseur intégré.

    Ordre de priorité des fournisseurs intégrés (les égalités sont départagées par ordre alphabétique de l’identifiant du fournisseur) :
    - Image : Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Vidéo : Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="CLI Antigravity (image/vidéo uniquement)">
    Premier binaire `agy` ou `antigravity` installé (remplacement possible avec `OPENCLAW_ANTIGRAVITY_CLI`), isolé dans le répertoire du média.
  </Step>
</Steps>

Pour désactiver la détection automatique d’une capacité :

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
La détection des binaires s’effectue au mieux sous macOS/Linux/Windows ; vérifiez que la CLI figure dans `PATH` (`~` est développé) ou définissez une entrée de modèle de CLI explicite avec le chemin complet de la commande.
</Note>

### Prise en charge des proxys (appels de fournisseur audio/vidéo)

La compréhension **audio** et **vidéo** assurée par un fournisseur respecte les variables d’environnement standard de proxy sortant, y compris les règles d’exclusion `NO_PROXY`/`no_proxy` : `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Les variables en minuscules ont priorité sur celles en majuscules. Si aucune n’est définie, la compréhension des médias utilise une sortie directe ; si la valeur du proxy est incorrecte, OpenClaw consigne un avertissement et revient à une récupération directe. La compréhension des images ne passe pas par ce chemin de proxy.

## Capacités

Définissez `capabilities` sur une entrée `models[]` pour la limiter à des types de médias précis. Pour les listes partagées, OpenClaw déduit les valeurs par défaut pour chaque fournisseur intégré :

| Fournisseur                                                              | Capacités             |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | image                 |
| `minimax-portal`                                                         | image                 |
| `moonshot`                                                               | image + vidéo         |
| `openrouter`                                                             | image + audio         |
| `google` (API Gemini)                                                    | image + audio + vidéo |
| `qwen`                                                                   | image + vidéo         |
| `deepinfra`                                                              | image + audio         |
| `mistral`                                                                | audio                 |
| `zai`                                                                    | image                 |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | audio                 |
| Tout catalogue `models.providers.<id>.models[]` comportant un modèle compatible avec les images | image                 |

Pour les entrées de CLI, définissez explicitement `capabilities` afin d’éviter les correspondances inattendues ; si cette propriété est omise, l’entrée est admissible pour chaque liste de capacités dans laquelle elle apparaît.

## Matrice de prise en charge des fournisseurs

| Capacité | Fournisseurs                                                                                                                                               | Remarques                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | Anthropic, serveur d’application Codex, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OAuth OpenAI Codex, OpenRouter, Qwen, Z.AI, fournisseurs configurés | Les Plugins des fournisseurs enregistrent la prise en charge des images ; `openai/*` peut utiliser le routage par clé d’API ou OAuth Codex ; `codex/*` utilise un tour borné du serveur d’application Codex ; les fournisseurs configurés compatibles avec les images s’enregistrent automatiquement. |
| Audio      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Transcription par le fournisseur (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| Vidéo      | Google, Moonshot, Qwen                                                                                                                                  | Compréhension vidéo par le fournisseur au moyen de Plugins dédiés ; la compréhension vidéo de Qwen utilise les points de terminaison DashScope standard.                                                                        |

<Note>
**Remarque concernant MiniMax** : la compréhension des images pour `minimax`, `minimax-cn`, `minimax-portal` et `minimax-portal-cn` provient toujours du fournisseur multimédia `MiniMax-VL-01` appartenant au Plugin, même si les anciennes métadonnées de conversation de MiniMax M2.x déclarent accepter des images en entrée.
</Note>

## Conseils pour la sélection des modèles

- Privilégiez le modèle de génération actuelle le plus performant pour chaque capacité multimédia lorsque la qualité et la sécurité sont importantes.
- Pour les agents utilisant des outils et traitant des entrées non fiables, évitez les modèles multimédias anciens ou moins performants.
- Conservez au moins un modèle de repli par capacité pour garantir la disponibilité (un modèle de qualité et un modèle plus rapide ou moins coûteux).
- Les solutions de repli de la CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API des fournisseurs sont indisponibles.
- Les modes connus de sortie vers un fichier font autorité : un fichier de transcription déduit vide ou absent ne produit aucune transcription au lieu de se rabattre sur la sortie de progression de la CLI.
- `parakeet-mlx` : utilisez `--output-format txt` (ou `all`) avec `--output-dir` et le modèle de sortie par défaut `{filename}`. Les variables d’environnement amont `PARAKEET_OUTPUT_FORMAT` et `PARAKEET_OUTPUT_TEMPLATE` sont également prises en compte. OpenClaw lit `<output-dir>/<media-basename>.txt` ; le format `srt` par défaut, les autres formats et les modèles de sortie personnalisés continuent d’utiliser la sortie standard.

## Politique relative aux pièces jointes

La propriété `attachments` de chaque capacité détermine les pièces jointes traitées :

<ParamField path="mode" type='"first" | "all"' default="first">
  Traite uniquement la première pièce jointe sélectionnée, ou toutes les pièces jointes.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limite le nombre de pièces jointes traitées.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Définit la préférence de sélection parmi les pièces jointes candidates.
</ParamField>

Lorsque `mode: "all"`, les sorties portent des libellés tels que `[Image 1/2]`, `[Audio 2/2]`, etc.

### Extraction des pièces jointes de type fichier

- Le texte extrait d’un fichier est encapsulé comme contenu externe non fiable avant d’être ajouté à l’invite multimédia, à l’aide de marqueurs de délimitation tels que `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et d’une ligne de métadonnées `Source: External`.
- Ce chemin omet volontairement la longue bannière `SECURITY NOTICE:` afin de garder l’invite multimédia concise ; les marqueurs de délimitation et les métadonnées restent appliqués.
- Un fichier ne comportant aucun texte extractible reçoit `[No extractable text]`.
- Si un PDF se rabat sur des images de pages rendues, OpenClaw transmet ces images aux modèles de réponse compatibles avec la vision et conserve l’espace réservé `[PDF content rendered to images]` dans le bloc du fichier.

## Exemples de configuration

<Tabs>
  <Tab title="Shared models + overrides">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
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
  <Tab title="Image only">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
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

Lorsque la compréhension multimédia s’exécute, `/status` inclut une ligne récapitulative par capacité :

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Pour effectuer l’inventaire préalable, exécutez `openclaw capability audio providers`. Les lignes locales affichent séparément la solution de repli locale retenue, la sélection globale du fournisseur, l’état de disponibilité ainsi que les champs distincts du moteur compatible, demandé et observé. La même sélection locale est disponible sous forme de constat informatif de doctor :

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Remarques

- La compréhension est fournie au mieux. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont tout de même transmises aux modèles lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter les emplacements où la compréhension s’exécute (par exemple, uniquement dans les messages privés).

## Voir aussi

- [Configuration](/fr/gateway/configuration)
- [Prise en charge des images et des contenus multimédias](/fr/nodes/images)
