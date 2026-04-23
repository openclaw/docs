---
read_when:
    - Vous souhaitez utiliser la synthèse vocale ElevenLabs dans OpenClaw
    - Vous souhaitez utiliser la reconnaissance vocale ElevenLabs Scribe pour les pièces jointes audio
    - Vous souhaitez utiliser la transcription en temps réel ElevenLabs pour Voice Call
summary: Utiliser la synthèse vocale ElevenLabs, Scribe STT et la transcription en temps réel avec OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T07:09:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw utilise ElevenLabs pour la synthèse vocale, la reconnaissance vocale par lot avec Scribe
v2, et la STT en streaming de Voice Call avec Scribe v2 Realtime.

| Capability               | Surface OpenClaw                                | Par défaut               |
| ------------------------ | ----------------------------------------------- | ------------------------ |
| Synthèse vocale          | `messages.tts` / `talk`                         | `eleven_multilingual_v2` |
| Reconnaissance vocale par lot | `tools.media.audio`                       | `scribe_v2`              |
| Reconnaissance vocale en streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Authentification

Définissez `ELEVENLABS_API_KEY` dans l’environnement. `XI_API_KEY` est également accepté pour
assurer la compatibilité avec l’outillage ElevenLabs existant.

```bash
export ELEVENLABS_API_KEY="..."
```

## Synthèse vocale

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

## Reconnaissance vocale

Utilisez Scribe v2 pour les pièces jointes audio entrantes et les courts segments vocaux enregistrés :

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw envoie l’audio multipart à ElevenLabs `/v1/speech-to-text` avec
`model_id: "scribe_v2"`. Les indications de langue sont mappées vers `language_code` lorsqu’elles sont présentes.

## STT en streaming pour Voice Call

Le Plugin `elevenlabs` intégré enregistre Scribe v2 Realtime pour la
transcription en streaming de Voice Call.

| Paramètre       | Chemin de configuration                                                  | Par défaut                                        |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Clé API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Revient à `ELEVENLABS_API_KEY` / `XI_API_KEY`     |
| Modèle          | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                       |
| Fréquence d’échantillonnage | `...elevenlabs.sampleRate`                                    | `8000`                                            |
| Stratégie de validation | `...elevenlabs.commitStrategy`                                   | `vad`                                             |
| Langue          | `...elevenlabs.languageCode`                                             | (non défini)                                      |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call reçoit les médias Twilio en G.711 u-law 8 kHz. Le fournisseur realtime ElevenLabs
utilise par défaut `ulaw_8000`, donc les trames de téléphonie peuvent être transmises sans
transcodage.
</Note>
