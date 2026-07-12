---
read_when:
    - Modification de la transcription audio ou du traitement des médias
summary: Comment les notes audio/vocales entrantes sont téléchargées, transcrites et intégrées aux réponses
title: Notes audio et vocales
x-i18n:
    generated_at: "2026-07-12T02:45:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Fonctionnement

Lorsque la compréhension audio est activée (ou détectée automatiquement), OpenClaw :

1. Localise la première pièce jointe audio (chemin local ou URL) et la télécharge si nécessaire.
2. Applique `maxBytes` avant l’envoi à chaque entrée de modèle.
3. Exécute dans l’ordre la première entrée de modèle admissible (fournisseur ou CLI) ; si une entrée échoue ou est ignorée (taille/délai d’expiration), l’entrée suivante est essayée.
4. En cas de réussite, remplace `Body` par un bloc `[Audio]` et définit `{{Transcript}}`.

Lorsque la transcription réussit, `CommandBody`/`RawBody` sont également définis sur la transcription afin que les commandes slash continuent de fonctionner. Avec `--verbose`, les journaux indiquent quand la transcription s’exécute et quand elle remplace le corps.

## Détection automatique (par défaut)

Si vous n’avez configuré aucun modèle et que `tools.media.audio.enabled` n’est pas défini sur `false`, OpenClaw effectue la détection automatique dans l’ordre suivant et s’arrête à la première option fonctionnelle :

1. **Modèle de réponse actif**, lorsque son fournisseur prend en charge la compréhension audio.
2. **Authentification de fournisseur configurée** — toute entrée `models.providers.*` disposant d’une authentification pour un fournisseur prenant en charge la transcription audio. Cette vérification précède celle des CLI locales ; une clé API configurée est donc toujours prioritaire sur un exécutable local présent dans `PATH`.
   Priorité des fournisseurs lorsque plusieurs sont configurés : Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **CLI locales** (uniquement si aucune authentification de fournisseur n’a été résolue). OpenClaw construit une liste ordonnée de solutions de repli :
   - `whisper-cli`, avant les options CPU par défaut uniquement lorsqu’une invocation antérieure de modèle dans le processus actuel a détecté Metal ou CUDA
   - `sherpa-onnx-offline` avec son fournisseur CPU par défaut (nécessite `SHERPA_ONNX_MODEL_DIR` contenant `tokens.txt`, `encoder.onnx`, `decoder.onnx` et `joiner.onnx`)
   - `whisper-cli` lorsque Metal/CUDA est uniquement pris en charge par la compilation ou lorsque le backend sélectionné n’a pas été observé autrement
   - `parakeet-mlx` sur Apple Silicon (compatible MLX ; l’utilisation du périphérique reste non observée)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)

La provenance de l’installation ou du lien constitue une preuve de capacité, et non une preuve d’exécution. À elle seule, elle ne place jamais un candidat avant sherpa sur CPU. OpenClaw ne charge pas de modèle pendant la configuration ou les vérifications d’état uniquement pour sonder un backend.
Le whisper.cpp détecté automatiquement conserve ses journaux habituels d’exécution du modèle afin qu’OpenClaw puisse enregistrer la ligne amont `using … backend`. Les entrées CLI explicites conservent leurs indicateurs de sortie configurés.

La détection automatique de la CLI Gemini pour la compréhension des médias a été remplacée par une solution de repli utilisant la CLI Antigravity (`agy`) dans un bac à sable pour les images et les vidéos ; l’audio n’utilise aucune solution de repli CLI au-delà des exécutables locaux ci-dessus.

Pour désactiver la détection automatique, définissez `tools.media.audio.enabled: false`. Pour la personnaliser, définissez `tools.media.audio.models`.

<Note>
La détection des exécutables s’effectue au mieux sous macOS/Linux/Windows. Vérifiez que la CLI figure dans `PATH` (`~` est développé), ou définissez un modèle CLI explicite avec le chemin complet de la commande.
</Note>

Inspectez la sélection locale sans transcrire d’audio :

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

L’inventaire des fournisseurs indique séparément la solution de repli locale retenue et la sélection globale du fournisseur, ainsi que les champs de backend compatible, demandé et observé. Après l’exécution d’une transcription, `/status` indique le backend demandé ou observé dans la ligne des médias. Les entrées CLI explicites de `tools.media.audio.models` contournent toujours la sélection automatique ; utilisez leurs indicateurs propres au backend, tels que `--provider=cuda` pour sherpa ou `--no-gpu`/`--device` pour whisper.cpp.

## Exemples de configuration

### Fournisseur avec solution de repli CLI (OpenAI + CLI Whisper)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Fournisseur uniquement avec filtrage par portée

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

### Fournisseur uniquement (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Fournisseur uniquement (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Fournisseur uniquement (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Renvoyer la transcription dans la discussion (facultatif)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // false par défaut
        echoFormat: '📝 "{transcript}"', // facultatif, prend en charge {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Remarques et limites

- L’authentification du fournisseur suit l’ordre standard d’authentification des modèles (profils d’authentification, variables d’environnement, `models.providers.*.apiKey`).
- Détails de configuration de Groq : [Groq](/fr/providers/groq).
- Deepgram utilise `DEEPGRAM_API_KEY` lorsque `provider: "deepgram"` est employé. Détails de configuration : [Deepgram](/fr/providers/deepgram).
- Détails de configuration de Mistral : [Mistral](/fr/providers/mistral).
- SenseAudio utilise `SENSEAUDIO_API_KEY` lorsque `provider: "senseaudio"` est employé. Détails de configuration : [SenseAudio](/fr/providers/senseaudio).
- Les fournisseurs audio peuvent remplacer `baseUrl`, `headers` et `providerOptions` via `tools.media.audio`.
- La limite de taille par défaut est de 20 Mo (`tools.media.audio.maxBytes`). Un fichier audio dépassant cette taille est ignoré pour ce modèle et l’entrée suivante est essayée.
- Les fichiers audio de moins de 1 024 octets sont ignorés avant la transcription par le fournisseur ou la CLI.
- Par défaut, `maxChars` n’est **pas défini** pour l’audio (transcription complète). Définissez `tools.media.audio.maxChars` ou un `maxChars` propre à une entrée pour tronquer la sortie.
- Le modèle par défaut de la détection automatique OpenAI est `gpt-4o-transcribe` ; définissez `model: "gpt-4o-mini-transcribe"` pour une option moins coûteuse et plus rapide.
- Utilisez `tools.media.audio.attachments` pour traiter plusieurs notes vocales (`mode: "all"` avec `maxAttachments`, dont la valeur par défaut est 1).
- La transcription est accessible aux modèles via `{{Transcript}}`.
- `tools.media.audio.echoTranscript` est désactivé par défaut ; activez-le pour renvoyer une confirmation de transcription à la discussion d’origine avant le traitement par l’agent.
- `tools.media.audio.echoFormat` personnalise le texte renvoyé (espace réservé : `{transcript}` ; valeur par défaut : `📝 "{transcript}"`).
- La sortie standard de la CLI est limitée à 5 Mo ; veillez à ce qu’elle reste concise.
- Les `args` de la CLI doivent utiliser `{{MediaPath}}` pour le chemin local du fichier audio. Exécutez `openclaw doctor --fix` pour migrer les espaces réservés `{input}` obsolètes provenant d’anciennes configurations `audio.transcription.command` (clé retirée : `audio.transcription`, remplacée par `tools.media.audio.models`).
- `tools.media.concurrency` limite les tâches multimédias ; il ne s’agit pas d’un ordonnanceur de GPU.

### Reconnaissance vocale locale résidente

La reconnaissance vocale locale détectée automatiquement continue d’utiliser un processus par requête. OpenClaw ne gère actuellement aucun serveur whisper.cpp résident, car le paquet Homebrew standard `whisper-cpp` désactive ce serveur, tandis que l’exemple amont ne dispose d’aucune file d’admission limitée configurée. Pour pouvoir être activé en toute sécurité, un cycle de vie résident appartenant à un Plugin nécessite un processus de travail maintenu et empaqueté offrant la vérification de l’état et du démarrage, la conservation du modèle en mémoire, une mise en file d’attente limitée, l’annulation et les délais d’expiration, un fonctionnement sans authentification limité au local loopback et aucune solution de repli vers le cloud.

### Prise en charge de l’environnement de proxy

La transcription audio par fournisseur respecte les variables d’environnement standard de proxy sortant, conformément à la sémantique de `EnvHttpProxyAgent` d’undici :

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Les variables en minuscules sont prioritaires sur celles en majuscules ; les entrées `NO_PROXY`/`no_proxy` (noms d’hôte, `*.suffix` ou `host:port`) contournent le proxy. Si aucune variable d’environnement de proxy n’est définie, une sortie directe est utilisée. Si la configuration du proxy échoue (URL incorrecte), OpenClaw consigne un avertissement et revient à une récupération directe.

## Détection des mentions dans les groupes

Sur les canaux prenant en charge la vérification préalable de l’audio, OpenClaw transcrit l’audio **avant** de rechercher les mentions lorsque `requireMention: true` est défini pour une discussion de groupe. Ainsi, une note vocale sans légende peut franchir le contrôle des mentions lorsque sa transcription contient un motif de mention configuré. La documentation propre à chaque canal décrit les transports qui exigent plutôt une mention saisie.

**Fonctionnement :**

1. Si un message vocal ne contient aucun corps textuel et que le groupe exige des mentions, OpenClaw effectue une transcription préalable de la première pièce jointe audio.
2. La transcription est comparée aux motifs de mention (par exemple `@BotName`, déclencheurs emoji).
3. Si une mention est trouvée, le message poursuit son parcours dans le pipeline de réponse complet.

**Comportement de repli :** si la transcription préalable échoue (délai d’expiration, erreur d’API, etc.), le message revient à une détection des mentions fondée uniquement sur le texte, afin que les messages mixtes (texte + audio) ne soient jamais ignorés.

**Désactivation par groupe/sujet Telegram :**

- Définissez `channels.telegram.groups.<chatId>.disableAudioPreflight: true` pour ignorer les vérifications préalables des mentions dans la transcription pour ce groupe.
- Définissez `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` pour remplacer le réglage par sujet (`true` pour ignorer, `false` pour forcer l’activation).
- La valeur par défaut est `false` (vérification préalable activée lorsque les conditions de filtrage par mention sont remplies).

**Exemple :** un utilisateur envoie une note vocale disant « Bonjour @Claude, quel temps fait-il ? » dans un groupe Telegram où `requireMention: true`. La note vocale est transcrite, la mention est détectée et l’agent répond.

## Points d’attention

- Les règles de portée utilisent la première correspondance ; `chatType` est normalisé en `direct`, `group` ou `channel`.
- Vérifiez que votre CLI se termine avec le code 0 et affiche du texte brut ; une sortie JSON doit être transformée avec `jq -r .text`.
- Les modes connus de sortie vers un fichier font autorité : un fichier de transcription déduit vide ou absent ne produit aucune transcription, au lieu de revenir à la sortie de progression de la CLI.
- Pour `parakeet-mlx`, utilisez `--output-format txt` (ou `all`) avec `--output-dir` et le modèle de sortie par défaut `{filename}`. Les variables d’environnement amont `PARAKEET_OUTPUT_FORMAT` et `PARAKEET_OUTPUT_TEMPLATE` sont également prises en compte. OpenClaw lit `<output-dir>/<media-basename>.txt` ; le format `srt` par défaut, les autres formats et les modèles de sortie personnalisés continuent d’utiliser la sortie standard.
- Utilisez des délais d’expiration raisonnables (`timeoutSeconds`, 60 s par défaut) afin d’éviter de bloquer la file d’attente des réponses.
- La transcription préalable ne traite que la **première** pièce jointe audio pour la détection des mentions. Les pièces jointes audio supplémentaires sont traitées pendant la phase principale de compréhension des médias.

## Pages connexes

- [Compréhension des médias](/fr/nodes/media-understanding)
- [Mode conversation](/fr/nodes/talk)
- [Activation vocale](/fr/nodes/voicewake)
