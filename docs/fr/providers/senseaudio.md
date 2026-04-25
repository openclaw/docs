---
read_when:
    - Vous souhaitez utiliser la reconnaissance vocale SenseAudio pour les pièces jointes audio
    - Vous avez besoin de la variable d’environnement de clé API SenseAudio ou du chemin de config audio
summary: Reconnaissance vocale par lot SenseAudio pour les notes vocales entrantes
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:56:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio peut transcrire les pièces jointes audio/notes vocales entrantes via
le pipeline partagé `tools.media.audio` d’OpenClaw. OpenClaw envoie l’audio multipart
vers le point de terminaison de transcription compatible OpenAI et injecte le texte renvoyé
sous forme de `{{Transcript}}` plus un bloc `[Audio]`.

| Détail        | Valeur                                           |
| ------------- | ------------------------------------------------ |
| Site web      | [senseaudio.cn](https://senseaudio.cn)           |
| Documentation | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Authentification | `SENSEAUDIO_API_KEY`                          |
| Modèle par défaut | `senseaudio-asr-pro-1.5-260319`              |
| URL par défaut | `https://api.senseaudio.cn/v1`                  |

## Premiers pas

<Steps>
  <Step title="Définissez votre clé API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Activez le fournisseur audio">
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
  </Step>
  <Step title="Envoyez une note vocale">
    Envoyez un message audio via n’importe quel canal connecté. OpenClaw téléverse l’
    audio vers SenseAudio et utilise la transcription dans le pipeline de réponse.
  </Step>
</Steps>

## Options

| Option     | Chemin                                  | Description                               |
| ---------- | --------------------------------------- | ----------------------------------------- |
| `model`    | `tools.media.audio.models[].model`      | ID du modèle ASR SenseAudio               |
| `language` | `tools.media.audio.models[].language`   | Indication de langue facultative          |
| `prompt`   | `tools.media.audio.prompt`              | Invite de transcription facultative       |
| `baseUrl`  | `tools.media.audio.baseUrl` or model    | Remplace la base compatible OpenAI        |
| `headers`  | `tools.media.audio.request.headers`     | En-têtes de requête supplémentaires       |

<Note>
SenseAudio est uniquement un service STT par lot dans OpenClaw. La transcription en temps réel Voice Call
continue d’utiliser des fournisseurs prenant en charge le STT en streaming.
</Note>
