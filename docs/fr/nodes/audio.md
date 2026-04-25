---
read_when:
    - Modifier la transcription audio ou la gestion des médias
summary: Comment l’audio entrant et les notes vocales sont téléchargés, transcrits et injectés dans les réponses
title: Audio et notes vocales
x-i18n:
    generated_at: "2026-04-25T13:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Notes vocales (2026-01-17)

## Ce qui fonctionne

- **Compréhension des médias (audio)** : si la compréhension audio est activée (ou auto‑détectée), OpenClaw :
  1. Localise la première pièce jointe audio (chemin local ou URL) et la télécharge si nécessaire.
  2. Applique `maxBytes` avant l’envoi à chaque entrée de modèle.
  3. Exécute la première entrée de modèle éligible dans l’ordre (fournisseur ou CLI).
  4. En cas d’échec ou d’omission (taille/délai), il essaie l’entrée suivante.
  5. En cas de succès, il remplace `Body` par un bloc `[Audio]` et définit `{{Transcript}}`.
- **Analyse des commandes** : lorsque la transcription réussit, `CommandBody`/`RawBody` sont définis à partir de la transcription afin que les commandes slash continuent de fonctionner.
- **Journalisation verbeuse** : en `--verbose`, nous journalisons quand la transcription s’exécute et quand elle remplace le corps.

## Détection automatique (par défaut)

Si vous **ne configurez pas de modèles** et que `tools.media.audio.enabled` n’est **pas** défini sur `false`,
OpenClaw effectue une détection automatique dans cet ordre et s’arrête à la première option fonctionnelle :

1. **Modèle de réponse actif** lorsque son fournisseur prend en charge la compréhension audio.
2. **CLI locales** (si installées)
   - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
   - `whisper-cli` (de `whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le modèle tiny intégré)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)
3. **CLI Gemini** (`gemini`) avec `read_many_files`
4. **Authentification du fournisseur**
   - Les entrées configurées `models.providers.*` qui prennent en charge l’audio sont essayées en premier
   - Ordre de repli intégré : OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Pour désactiver la détection automatique, définissez `tools.media.audio.enabled: false`.
Pour la personnaliser, définissez `tools.media.audio.models`.
Remarque : la détection des binaires est réalisée au mieux sur macOS/Linux/Windows ; assurez-vous que la CLI est dans le `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.

## Exemples de configuration

### Fournisseur + repli CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
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

### Fournisseur uniquement avec restriction par portée

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
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
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

### Renvoyer la transcription dans le chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // la valeur par défaut est false
        echoFormat: '📝 "{transcript}"', // facultatif, prend en charge {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Remarques et limites

- L’authentification du fournisseur suit l’ordre standard d’authentification des modèles (profils d’authentification, variables d’environnement, `models.providers.*.apiKey`).
- Détails de configuration de Groq : [Groq](/fr/providers/groq).
- Deepgram récupère `DEEPGRAM_API_KEY` lorsque `provider: "deepgram"` est utilisé.
- Détails de configuration de Deepgram : [Deepgram (transcription audio)](/fr/providers/deepgram).
- Détails de configuration de Mistral : [Mistral](/fr/providers/mistral).
- SenseAudio récupère `SENSEAUDIO_API_KEY` lorsque `provider: "senseaudio"` est utilisé.
- Détails de configuration de SenseAudio : [SenseAudio](/fr/providers/senseaudio).
- Les fournisseurs audio peuvent remplacer `baseUrl`, `headers` et `providerOptions` via `tools.media.audio`.
- La limite de taille par défaut est de 20 Mo (`tools.media.audio.maxBytes`). Les fichiers audio trop volumineux sont ignorés pour ce modèle et l’entrée suivante est essayée.
- Les fichiers audio minuscules/vides de moins de 1024 octets sont ignorés avant la transcription par fournisseur/CLI.
- `maxChars` par défaut pour l’audio est **non défini** (transcription complète). Définissez `tools.media.audio.maxChars` ou `maxChars` par entrée pour tronquer la sortie.
- La valeur par défaut automatique d’OpenAI est `gpt-4o-mini-transcribe` ; définissez `model: "gpt-4o-transcribe"` pour une meilleure précision.
- Utilisez `tools.media.audio.attachments` pour traiter plusieurs notes vocales (`mode: "all"` + `maxAttachments`).
- La transcription est disponible dans les modèles sous la forme `{{Transcript}}`.
- `tools.media.audio.echoTranscript` est désactivé par défaut ; activez-le pour renvoyer une confirmation de transcription dans le chat d’origine avant le traitement par l’agent.
- `tools.media.audio.echoFormat` personnalise le texte de renvoi (espace réservé : `{transcript}`).
- La sortie stdout de la CLI est plafonnée (5 Mo) ; gardez une sortie CLI concise.

### Prise en charge de l’environnement proxy

La transcription audio basée sur un fournisseur respecte les variables d’environnement proxy standard pour les sorties réseau :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si aucune variable d’environnement proxy n’est définie, une sortie directe est utilisée. Si la configuration proxy est mal formée, OpenClaw journalise un avertissement et revient à un fetch direct.

## Détection des mentions dans les groupes

Lorsque `requireMention: true` est défini pour un chat de groupe, OpenClaw transcrit désormais l’audio **avant** de vérifier les mentions. Cela permet de traiter les notes vocales même lorsqu’elles contiennent des mentions.

**Fonctionnement :**

1. Si un message vocal n’a pas de corps texte et que le groupe exige des mentions, OpenClaw effectue une transcription « preflight ».
2. La transcription est vérifiée à la recherche de motifs de mention (par ex. `@BotName`, déclencheurs emoji).
3. Si une mention est trouvée, le message poursuit le pipeline complet de réponse.
4. La transcription est utilisée pour la détection des mentions afin que les notes vocales puissent franchir le filtre des mentions.

**Comportement de repli :**

- Si la transcription échoue pendant le preflight (délai d’attente, erreur API, etc.), le message est traité selon la détection des mentions fondée uniquement sur le texte.
- Cela garantit que les messages mixtes (texte + audio) ne sont jamais ignorés à tort.

**Opt-out par groupe/sujet Telegram :**

- Définissez `channels.telegram.groups.<chatId>.disableAudioPreflight: true` pour ignorer les vérifications de mention de transcription preflight pour ce groupe.
- Définissez `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` pour remplacer ce comportement par sujet (`true` pour ignorer, `false` pour forcer l’activation).
- La valeur par défaut est `false` (preflight activé lorsque les conditions avec filtre de mention correspondent).

**Exemple :** un utilisateur envoie une note vocale disant « Hey @Claude, what's the weather? » dans un groupe Telegram avec `requireMention: true`. La note vocale est transcrite, la mention est détectée, et l’agent répond.

## Pièges

- Les règles de portée utilisent le principe du premier résultat correspondant. `chatType` est normalisé en `direct`, `group` ou `room`.
- Assurez-vous que votre CLI sort avec le code 0 et imprime du texte brut ; le JSON doit être transformé via `jq -r .text`.
- Pour `parakeet-mlx`, si vous transmettez `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque `--output-format` est `txt` (ou omis) ; les formats de sortie non `txt` reviennent à l’analyse de stdout.
- Gardez des délais d’attente raisonnables (`timeoutSeconds`, 60 s par défaut) pour éviter de bloquer la file de réponses.
- La transcription preflight ne traite que la **première** pièce jointe audio pour la détection des mentions. Les audios supplémentaires sont traités pendant la phase principale de compréhension des médias.

## Connexe

- [Compréhension des médias](/fr/nodes/media-understanding)
- [Mode Talk](/fr/nodes/talk)
- [Voice wake](/fr/nodes/voicewake)
