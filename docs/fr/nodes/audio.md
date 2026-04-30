---
read_when:
    - Modifier la transcription audio ou la gestion des médias
summary: Comment les contenus audio/notes vocales entrants sont téléchargés, transcrits et injectés dans les réponses
title: Audio et notes vocales
x-i18n:
    generated_at: "2026-04-30T07:34:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# Notes audio / vocales (2026-01-17)

## Ce qui fonctionne

- **Compréhension des médias (audio)** : si la compréhension audio est activée (ou détectée automatiquement), OpenClaw :
  1. Localise la première pièce jointe audio (chemin local ou URL) et la télécharge si nécessaire.
  2. Applique `maxBytes` avant l’envoi à chaque entrée de modèle.
  3. Exécute la première entrée de modèle admissible dans l’ordre (fournisseur ou CLI).
  4. En cas d’échec ou d’omission (taille/délai d’expiration), il essaie l’entrée suivante.
  5. En cas de réussite, il remplace `Body` par un bloc `[Audio]` et définit `{{Transcript}}`.
- **Analyse des commandes** : lorsque la transcription réussit, `CommandBody`/`RawBody` sont définis sur la transcription afin que les commandes slash continuent de fonctionner.
- **Journalisation détaillée** : avec `--verbose`, nous journalisons le lancement de la transcription et le moment où elle remplace le corps.

## Détection automatique (par défaut)

Si vous **ne configurez pas de modèles** et que `tools.media.audio.enabled` n’est **pas** défini sur `false`,
OpenClaw effectue une détection automatique dans cet ordre et s’arrête à la première option fonctionnelle :

1. **Modèle de réponse actif** lorsque son fournisseur prend en charge la compréhension audio.
2. **CLI locaux** (si installés)
   - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
   - `whisper-cli` (depuis `whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le modèle tiny groupé)
   - `whisper` (CLI Python ; télécharge les modèles automatiquement)
3. **CLI Gemini** (`gemini`) avec `read_many_files`
4. **Authentification fournisseur**
   - Les entrées `models.providers.*` configurées qui prennent en charge l’audio sont essayées en premier
   - Ordre de repli groupé : OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Pour désactiver la détection automatique, définissez `tools.media.audio.enabled: false`.
Pour personnaliser, définissez `tools.media.audio.models`.
Remarque : la détection des binaires est au mieux sur macOS/Linux/Windows ; assurez-vous que le CLI est dans `PATH` (nous développons `~`) ou définissez un modèle CLI explicite avec un chemin de commande complet.

## Exemples de configuration

### Fournisseur + repli CLI (OpenAI + CLI Whisper)

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

### Fournisseur uniquement avec contrôle par périmètre

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

### Renvoyer la transcription dans la discussion (activation explicite)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Notes et limites

- L’authentification fournisseur suit l’ordre standard d’authentification des modèles (profils d’authentification, variables d’environnement, `models.providers.*.apiKey`).
- Détails de configuration de Groq : [Groq](/fr/providers/groq).
- Deepgram récupère `DEEPGRAM_API_KEY` lorsque `provider: "deepgram"` est utilisé.
- Détails de configuration de Deepgram : [Deepgram (transcription audio)](/fr/providers/deepgram).
- Détails de configuration de Mistral : [Mistral](/fr/providers/mistral).
- SenseAudio récupère `SENSEAUDIO_API_KEY` lorsque `provider: "senseaudio"` est utilisé.
- Détails de configuration de SenseAudio : [SenseAudio](/fr/providers/senseaudio).
- Les fournisseurs audio peuvent remplacer `baseUrl`, `headers` et `providerOptions` via `tools.media.audio`.
- La limite de taille par défaut est de 20MB (`tools.media.audio.maxBytes`). Les fichiers audio trop volumineux sont ignorés pour ce modèle et l’entrée suivante est essayée.
- Les fichiers audio minuscules/vides de moins de 1024 octets sont ignorés avant la transcription par fournisseur/CLI.
- Le `maxChars` par défaut pour l’audio est **non défini** (transcription complète). Définissez `tools.media.audio.maxChars` ou `maxChars` par entrée pour tronquer la sortie.
- La valeur par défaut automatique d’OpenAI est `gpt-4o-mini-transcribe` ; définissez `model: "gpt-4o-transcribe"` pour une meilleure précision.
- Utilisez `tools.media.audio.attachments` pour traiter plusieurs notes vocales (`mode: "all"` + `maxAttachments`).
- La transcription est disponible pour les modèles sous la forme `{{Transcript}}`.
- `tools.media.audio.echoTranscript` est désactivé par défaut ; activez-le pour renvoyer une confirmation de transcription à la discussion d’origine avant le traitement par l’agent.
- `tools.media.audio.echoFormat` personnalise le texte d’écho (espace réservé : `{transcript}`).
- La sortie stdout du CLI est limitée (5MB) ; gardez la sortie du CLI concise.
- Les `args` du CLI doivent utiliser `{{MediaPath}}` pour le chemin du fichier audio local. Exécutez `openclaw doctor --fix` pour migrer les espaces réservés `{input}` obsolètes depuis les anciennes configurations `audio.transcription.command`.

### Prise en charge de l’environnement proxy

La transcription audio basée sur un fournisseur respecte les variables d’environnement proxy sortantes standard :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Si aucune variable d’environnement proxy n’est définie, une sortie directe est utilisée. Si la configuration proxy est mal formée, OpenClaw journalise un avertissement et revient à une récupération directe.

## Détection des mentions dans les groupes

Lorsque `requireMention: true` est défini pour une discussion de groupe, OpenClaw transcrit désormais l’audio **avant** de vérifier les mentions. Cela permet de traiter les notes vocales même lorsqu’elles contiennent des mentions.

**Fonctionnement :**

1. Si un message vocal n’a pas de corps textuel et que le groupe exige des mentions, OpenClaw effectue une transcription « preflight ».
2. La transcription est vérifiée à la recherche de motifs de mention (par exemple, `@BotName`, déclencheurs emoji).
3. Si une mention est trouvée, le message poursuit le pipeline complet de réponse.
4. La transcription est utilisée pour la détection des mentions afin que les notes vocales puissent franchir le filtre de mention.

**Comportement de repli :**

- Si la transcription échoue pendant le preflight (délai d’expiration, erreur d’API, etc.), le message est traité selon la détection de mention uniquement textuelle.
- Cela garantit que les messages mixtes (texte + audio) ne sont jamais ignorés à tort.

**Désactivation par groupe/sujet Telegram :**

- Définissez `channels.telegram.groups.<chatId>.disableAudioPreflight: true` pour ignorer les vérifications de mentions par transcription preflight pour ce groupe.
- Définissez `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` pour remplacer par sujet (`true` pour ignorer, `false` pour forcer l’activation).
- La valeur par défaut est `false` (preflight activé lorsque les conditions avec filtrage par mention correspondent).

**Exemple :** un utilisateur envoie une note vocale disant « Hey @Claude, quel temps fait-il ? » dans un groupe Telegram avec `requireMention: true`. La note vocale est transcrite, la mention est détectée et l’agent répond.

## Pièges

- Les règles de périmètre utilisent la première correspondance gagnante. `chatType` est normalisé en `direct`, `group` ou `room`.
- Assurez-vous que votre CLI se termine avec 0 et imprime du texte brut ; JSON doit être adapté via `jq -r .text`.
- Pour `parakeet-mlx`, si vous transmettez `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque `--output-format` est `txt` (ou omis) ; les formats de sortie non `txt` se replient sur l’analyse de stdout.
- Gardez des délais d’expiration raisonnables (`timeoutSeconds`, 60 s par défaut) afin d’éviter de bloquer la file de réponses.
- La transcription preflight ne traite que la **première** pièce jointe audio pour la détection des mentions. L’audio supplémentaire est traité pendant la phase principale de compréhension des médias.

## Connexe

- [Compréhension des médias](/fr/nodes/media-understanding)
- [Mode conversation](/fr/nodes/talk)
- [Réveil vocal](/fr/nodes/voicewake)
