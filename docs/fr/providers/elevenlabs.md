---
read_when:
    - Vous souhaitez utiliser la synthèse vocale ElevenLabs dans OpenClaw
    - Vous souhaitez utiliser ElevenLabs Scribe pour la transcription en texte des pièces jointes audio.
    - Vous voulez la transcription en temps réel d’ElevenLabs pour les appels vocaux ou Google Meet
summary: Utiliser la synthèse vocale ElevenLabs, Scribe STT et la transcription en temps réel avec OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:24:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw utilise ElevenLabs pour la synthèse vocale, la transcription vocale par lots avec Scribe
v2, et la STT en streaming avec Scribe v2 Realtime.

| Capacité                 | Surface OpenClaw                                                     | Par défaut              |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Synthèse vocale          | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Transcription vocale par lots | `tools.media.audio`                                             | `scribe_v2`              |
| Transcription vocale en streaming | streaming Voice Call ou Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Authentification

Définissez `ELEVENLABS_API_KEY` dans l’environnement. `XI_API_KEY` est également accepté pour
la compatibilité avec les outils ElevenLabs existants.

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

Les salons vocaux Discord utilisent le point de terminaison TTS en streaming d’ElevenLabs lorsque ElevenLabs est
le fournisseur `voice.tts`/`messages.tts` sélectionné. La lecture démarre à partir du
flux audio renvoyé au lieu d’attendre qu’OpenClaw télécharge et écrive d’abord
tout le fichier audio. `latencyTier` correspond au paramètre de requête
`optimize_streaming_latency` d’ElevenLabs pour les modèles qui l’acceptent ; OpenClaw
omet ce paramètre pour `eleven_v3`, qui le rejette.

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
`model_id: "scribe_v2"`. Les indications de langue correspondent à `language_code` lorsqu’elles sont présentes.

## STT en streaming

Le Plugin `elevenlabs` inclus enregistre Scribe v2 Realtime pour Voice Call et
la transcription en streaming du mode agent Google Meet.

| Paramètre       | Chemin de configuration                                                  | Par défaut                                        |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Clé API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Se rabat sur `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modèle          | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Fréquence d’échantillonnage | `...elevenlabs.sampleRate`                                      | `8000`                                            |
| Stratégie de validation | `...elevenlabs.commitStrategy`                                      | `vad`                                             |
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
Voice Call reçoit les médias Twilio sous forme de G.711 u-law à 8 kHz. Le fournisseur realtime
ElevenLabs utilise par défaut `ulaw_8000`, ce qui permet de transférer les trames téléphoniques sans
transcodage.
</Note>

Pour le mode agent Google Meet, définissez
`plugins.entries.google-meet.config.realtime.transcriptionProvider` sur
`"elevenlabs"` et configurez le même bloc de fournisseur sous
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Connexe

- [Synthèse vocale](/fr/tools/tts)
- [Google Meet](/fr/plugins/google-meet)
- [Sélection du modèle](/fr/concepts/model-providers)
