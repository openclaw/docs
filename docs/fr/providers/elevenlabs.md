---
read_when:
    - Vous souhaitez utiliser la synthèse vocale d’ElevenLabs dans OpenClaw
    - Vous souhaitez utiliser la transcription audio en texte ElevenLabs Scribe pour les pièces jointes audio
    - Vous souhaitez utiliser la transcription en temps réel d’ElevenLabs pour Voice Call ou Google Meet
summary: Utilisez la synthèse vocale ElevenLabs, la reconnaissance vocale Scribe et la transcription en temps réel avec OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T15:44:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw utilise ElevenLabs pour la synthèse vocale, la transcription vocale par lots avec Scribe
v2 et la transcription vocale en continu avec Scribe v2 Realtime. Le Plugin est inclus et
activé par défaut ; aucune étape `plugins install` n’est nécessaire.

| Fonctionnalité                      | Surface OpenClaw                                                     | Valeur par défaut       |
| ----------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Synthèse vocale                     | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Transcription vocale par lots       | `tools.media.audio`                                                  | `scribe_v2`              |
| Transcription vocale en continu     | Diffusion Voice Call ou `realtime.transcriptionProvider` de Google Meet | `scribe_v2_realtime`     |

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

Définissez `modelId` sur `eleven_v3` pour utiliser la synthèse vocale ElevenLabs v3. OpenClaw conserve
`eleven_multilingual_v2` comme valeur par défaut pour les installations existantes.

Les canaux vocaux Discord utilisent le point de terminaison de synthèse vocale en continu d’ElevenLabs lorsque
ElevenLabs est le fournisseur `voice.tts`/`messages.tts` sélectionné : la lecture commence à partir du
flux audio renvoyé au lieu d’attendre qu’OpenClaw télécharge d’abord l’intégralité du
fichier audio. `latencyTier` correspond au paramètre de requête `optimize_streaming_latency`
d’ElevenLabs pour les modèles qui l’acceptent ; OpenClaw omet ce paramètre pour
`eleven_v3`, qui le refuse.

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

OpenClaw envoie l’audio multipart à `/v1/speech-to-text` d’ElevenLabs avec
`model_id: "scribe_v2"`. Les indications de langue sont associées à `language_code` lorsqu’elles sont présentes.

## Transcription vocale en continu

Le Plugin `elevenlabs` inclus enregistre Scribe v2 Realtime pour Voice Call et
la transcription en continu en mode agent de Google Meet.

| Paramètre                | Chemin de configuration                                                     | Valeur par défaut                                  |
| ------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------- |
| Clé d’API                | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`   | Utilise à défaut `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modèle                   | `...elevenlabs.modelId`                                                     | `scribe_v2_realtime`                               |
| Format audio             | `...elevenlabs.audioFormat`                                                 | `ulaw_8000`                                        |
| Fréquence d’échantillonnage | `...elevenlabs.sampleRate`                                               | `8000`                                             |
| Stratégie de validation  | `...elevenlabs.commitStrategy`                                              | `vad`                                              |
| Langue                   | `...elevenlabs.languageCode`                                                | (non définie)                                      |

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
Voice Call reçoit les médias Twilio au format G.711 u-law à 8 kHz. Le fournisseur
temps réel ElevenLabs utilise `ulaw_8000` par défaut, ce qui permet de transférer les trames
de téléphonie sans transcodage.
</Note>

Pour le mode agent de Google Meet, définissez
`plugins.entries.google-meet.config.realtime.transcriptionProvider` sur
`"elevenlabs"` et configurez le même bloc de fournisseur sous
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Pages connexes

- [Synthèse vocale](/fr/tools/tts)
- [Google Meet](/fr/plugins/google-meet)
- [Sélection du modèle](/fr/concepts/model-providers)
