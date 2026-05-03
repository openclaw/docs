---
read_when:
    - Modifier la transcription audio ou la gestion des médias
summary: Comment les fichiers audio/notes vocales entrants sont téléchargés, transcrits et injectés dans les réponses
title: Audio et notes vocales
x-i18n:
    generated_at: "2026-05-03T07:10:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# Notes audio / vocales (2026-01-17)

## Ce qui fonctionne

- **Compréhension des médias (audio)** : Si la compréhension audio est activée (ou détectée automatiquement), OpenClaw :
  1. Localise la première pièce jointe audio (chemin local ou URL) et la télécharge si nécessaire.
  2. Applique `maxBytes` avant l’envoi à chaque entrée de modèle.
  3. Exécute la première entrée de modèle admissible dans l’ordre (fournisseur ou CLI).
  4. En cas d’échec ou d’omission (taille/délai d’attente), essaie l’entrée suivante.
  5. En cas de réussite, remplace `Body` par un bloc `[Audio]` et définit `{{Transcript}}`.
- **Analyse des commandes** : Lorsque la transcription réussit, `CommandBody`/`RawBody` sont définis sur la transcription afin que les commandes slash continuent de fonctionner.
- **Journalisation détaillée** : En mode `--verbose`, nous journalisons le lancement de la transcription et le moment où elle remplace le corps.

## Détection automatique (par défaut)

Si vous **ne configurez pas de modèles** et que `tools.media.audio.enabled` n’est **pas** défini sur `false`,
OpenClaw effectue une détection automatique dans cet ordre et s’arrête à la première option fonctionnelle :

1. **Modèle de réponse actif** lorsque son fournisseur prend en charge la compréhension audio.
2. **CLI locales** (si installées)
   - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encodeur/décodeur/joiner/tokens)
   - `whisper-cli` (depuis `whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le modèle tiny intégré)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)
3. **CLI Gemini** (`gemini`) utilisant `read_many_files`
4. **Authentification fournisseur**
   - Les entrées `models.providers.*` configurées qui prennent en charge l’audio sont essayées en premier
   - Ordre de repli intégré : OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Pour désactiver la détection automatique, définissez `tools.media.audio.enabled: false`.
Pour personnaliser, définissez `tools.media.audio.models`.
Remarque : la détection des binaires est au mieux sur macOS/Linux/Windows ; assurez-vous que la CLI est dans le `PATH` (nous développons `~`) ou définissez un modèle CLI explicite avec un chemin de commande complet.

## Exemples de configuration

### Repli fournisseur + CLI (OpenAI + CLI Whisper)

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

### Fournisseur uniquement avec contrôle par portée

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

### Répéter la transcription dans le chat (activation explicite)

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
- La limite de taille par défaut est de 20 Mo (`tools.media.audio.maxBytes`). Un audio trop volumineux est ignoré pour ce modèle et l’entrée suivante est essayée.
- Les fichiers audio minuscules/vides de moins de 1024 octets sont ignorés avant la transcription par le fournisseur/la CLI.
- La valeur par défaut de `maxChars` pour l’audio est **non définie** (transcription complète). Définissez `tools.media.audio.maxChars` ou `maxChars` par entrée pour tronquer la sortie.
- La valeur automatique par défaut pour OpenAI est `gpt-4o-mini-transcribe` ; définissez `model: "gpt-4o-transcribe"` pour une précision supérieure.
- Utilisez `tools.media.audio.attachments` pour traiter plusieurs notes vocales (`mode: "all"` + `maxAttachments`).
- La transcription est disponible pour les modèles sous la forme `{{Transcript}}`.
- `tools.media.audio.echoTranscript` est désactivé par défaut ; activez-le pour renvoyer une confirmation de transcription au chat d’origine avant le traitement par l’agent.
- `tools.media.audio.echoFormat` personnalise le texte de l’écho (espace réservé : `{transcript}`).
- La sortie stdout de la CLI est plafonnée (5 Mo) ; gardez la sortie CLI concise.
- Les `args` de la CLI doivent utiliser `{{MediaPath}}` pour le chemin du fichier audio local. Exécutez `openclaw doctor --fix` pour migrer les espaces réservés `{input}` obsolètes depuis les anciennes configurations `audio.transcription.command`.

### Prise en charge de l’environnement proxy

La transcription audio basée sur un fournisseur respecte les variables d’environnement proxy sortantes standard :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Si aucune variable d’environnement proxy n’est définie, une sortie directe est utilisée. Si la configuration du proxy est mal formée, OpenClaw journalise un avertissement et revient à une récupération directe.

## Détection des mentions dans les groupes

Lorsque `requireMention: true` est défini pour un chat de groupe, OpenClaw transcrit désormais l’audio **avant** de vérifier les mentions. Cela permet de traiter les notes vocales même lorsqu’elles contiennent des mentions.

**Fonctionnement :**

1. Si un message vocal n’a pas de corps texte et que le groupe exige des mentions, OpenClaw effectue une transcription de « prévol ».
2. La transcription est vérifiée pour rechercher des motifs de mention (par exemple, `@BotName`, déclencheurs emoji).
3. Si une mention est trouvée, le message passe par le pipeline de réponse complet.
4. La transcription est utilisée pour la détection des mentions afin que les notes vocales puissent franchir la porte des mentions.

**Comportement de repli :**

- Si la transcription échoue pendant le prévol (délai d’attente, erreur d’API, etc.), le message est traité selon la détection des mentions uniquement textuelle.
- Cela garantit que les messages mixtes (texte + audio) ne sont jamais supprimés à tort.

**Désactivation par groupe/sujet Telegram :**

- Définissez `channels.telegram.groups.<chatId>.disableAudioPreflight: true` pour ignorer les vérifications de mention par transcription de prévol pour ce groupe.
- Définissez `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` pour remplacer par sujet (`true` pour ignorer, `false` pour forcer l’activation).
- La valeur par défaut est `false` (prévol activé lorsque les conditions avec porte par mention correspondent).

**Exemple :** Un utilisateur envoie une note vocale disant « Hey @Claude, what’s the weather? » dans un groupe Telegram avec `requireMention: true`. La note vocale est transcrite, la mention est détectée et l’agent répond.

## Pièges

- Les règles de portée appliquent la première correspondance trouvée. `chatType` est normalisé en `direct`, `group` ou `room`.
- Assurez-vous que votre CLI se termine avec 0 et imprime du texte brut ; le JSON doit être adapté via `jq -r .text`.
- Pour `parakeet-mlx`, si vous transmettez `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque `--output-format` est `txt` (ou omis) ; les formats de sortie non `txt` reviennent à l’analyse de stdout.
- Gardez des délais d’attente raisonnables (`timeoutSeconds`, 60 s par défaut) pour éviter de bloquer la file de réponses.
- La transcription de prévol ne traite que la **première** pièce jointe audio pour la détection des mentions. Les pièces jointes audio supplémentaires sont traitées pendant la phase principale de compréhension des médias.

## Connexe

- [Compréhension des médias](/fr/nodes/media-understanding)
- [Mode conversation](/fr/nodes/talk)
- [Réveil vocal](/fr/nodes/voicewake)
