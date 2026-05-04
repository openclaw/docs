---
read_when:
    - Vous voulez la synthèse vocale ElevenLabs dans OpenClaw
    - Vous souhaitez utiliser la transcription vocale ElevenLabs Scribe pour les pièces jointes audio
    - Vous souhaitez la transcription en temps réel d’ElevenLabs pour Appel vocal ou Google Meet
summary: Utiliser la synthèse vocale ElevenLabs, Scribe STT et la transcription en temps réel avec OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:05:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw utilise ElevenLabs pour la synthèse vocale, la transcription vocale par lots avec Scribe
v2 et la STT en streaming avec Scribe v2 Realtime.

| Capacité                | Surface OpenClaw                                                       | Par défaut               |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------ |
| Synthèse vocale         | `messages.tts` / `talk`                                                | `eleven_multilingual_v2` |
| Transcription vocale par lots | `tools.media.audio`                                             | `scribe_v2`              |
| Transcription vocale en streaming | streaming d’appel vocal ou Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Authentification

Définissez `ELEVENLABS_API_KEY` dans l’environnement. `XI_API_KEY` est également accepté pour
assurer la compatibilité avec les outils ElevenLabs existants.

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

Définissez `modelId` sur `eleven_v3` pour utiliser la TTS ElevenLabs v3. OpenClaw conserve
`eleven_multilingual_v2` comme valeur par défaut pour les installations existantes.

## Transcription vocale

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

## STT en streaming

Le Plugin `elevenlabs` fourni enregistre Scribe v2 Realtime pour l’appel vocal et
la transcription en streaming en mode agent Google Meet.

| Paramètre       | Chemin de configuration                                                  | Par défaut                                        |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Clé API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Se rabat sur `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modèle          | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Fréquence d’échantillonnage | `...elevenlabs.sampleRate`                                      | `8000`                                            |
| Stratégie de commit | `...elevenlabs.commitStrategy`                                       | `vad`                                             |
| Langue          | `...elevenlabs.languageCode`                                              | (non défini)                                      |

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
L’appel vocal reçoit les médias Twilio en u-law G.711 à 8 kHz. Le fournisseur temps réel ElevenLabs
utilise `ulaw_8000` par défaut, ce qui permet de transférer les trames téléphoniques sans
transcodage.
</Note>

Pour le mode agent Google Meet, définissez
`plugins.entries.google-meet.config.realtime.transcriptionProvider` sur
`"elevenlabs"` et configurez le même bloc de fournisseur sous
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Connexe

- [Synthèse vocale](/fr/tools/tts)
- [Google Meet](/fr/plugins/google-meet)
- [Sélection de modèle](/fr/concepts/model-providers)
