---
read_when:
    - Vous souhaitez utiliser la synthèse vocale ElevenLabs dans OpenClaw
    - Vous souhaitez utiliser la reconnaissance vocale ElevenLabs Scribe pour les pièces jointes audio
    - Vous souhaitez utiliser la transcription en temps réel ElevenLabs pour les appels vocaux
summary: Utilisez la parole ElevenLabs, Scribe STT et la transcription en temps réel avec OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:55:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw utilise ElevenLabs pour la synthèse vocale, la reconnaissance vocale par lot avec Scribe
v2, et la reconnaissance vocale en streaming Voice Call avec Scribe v2 Realtime.

| Fonctionnalité            | Surface OpenClaw                               | Valeur par défaut         |
| ------------------------- | ---------------------------------------------- | ------------------------- |
| Synthèse vocale           | `messages.tts` / `talk`                        | `eleven_multilingual_v2`  |
| Reconnaissance vocale par lot | `tools.media.audio`                        | `scribe_v2`               |
| Reconnaissance vocale en streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`      |

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

Définissez `modelId` sur `eleven_v3` pour utiliser la synthèse vocale ElevenLabs v3. OpenClaw conserve
`eleven_multilingual_v2` comme valeur par défaut pour les installations existantes.

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

## Reconnaissance vocale en streaming Voice Call

Le Plugin `elevenlabs` intégré enregistre Scribe v2 Realtime pour la transcription
en streaming Voice Call.

| Paramètre       | Chemin de config                                                        | Valeur par défaut                                  |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| Clé API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Revient à `ELEVENLABS_API_KEY` / `XI_API_KEY`      |
| Modèle          | `...elevenlabs.modelId`                                                 | `scribe_v2_realtime`                               |
| Format audio    | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                        |
| Fréquence d’échantillonnage | `...elevenlabs.sampleRate`                                  | `8000`                                             |
| Stratégie de validation | `...elevenlabs.commitStrategy`                                 | `vad`                                              |
| Langue          | `...elevenlabs.languageCode`                                            | (non défini)                                       |

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
Voice Call reçoit les médias Twilio en G.711 u-law à 8 kHz. Le fournisseur temps réel ElevenLabs
utilise par défaut `ulaw_8000`, ce qui permet de transférer les trames de téléphonie sans
transcodage.
</Note>

## Liens connexes

- [Synthèse vocale](/fr/tools/tts)
- [Sélection de modèle](/fr/concepts/model-providers)
