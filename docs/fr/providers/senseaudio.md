---
read_when:
    - Vous voulez utiliser la conversion parole-texte de SenseAudio pour les pièces jointes audio
    - Vous avez besoin de la variable d’environnement de clé API SenseAudio ou du chemin de configuration audio
summary: Transcription vocale par lots SenseAudio pour les notes vocales entrantes
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T07:36:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SenseAudio peut transcrire les pièces jointes audio entrantes et les notes vocales via le pipeline partagé `tools.media.audio` d’OpenClaw. OpenClaw publie l’audio multipart vers le point de terminaison de transcription compatible OpenAI et injecte le texte retourné sous forme de `{{Transcript}}` ainsi qu’un bloc `[Audio]`.

| Propriété     | Valeur                                           |
| ------------- | ------------------------------------------------ |
| Identifiant du fournisseur | `senseaudio`                          |
| Plugin        | intégré, `enabledByDefault: true`                |
| Contrat       | `mediaUnderstandingProviders` (audio)            |
| Variable d’environnement d’authentification | `SENSEAUDIO_API_KEY` |
| Modèle par défaut | `senseaudio-asr-pro-1.5-260319`              |
| URL par défaut | `https://api.senseaudio.cn/v1`                  |
| Site web      | [senseaudio.cn](https://senseaudio.cn)           |
| Documentation | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Bien démarrer

<Steps>
  <Step title="Set your API key">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Enable the audio provider">
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
  <Step title="Send a voice note">
    Envoyez un message audio via n’importe quel canal connecté. OpenClaw téléverse
    l’audio vers SenseAudio et utilise la transcription dans le pipeline de réponse.
  </Step>
</Steps>

## Options

| Option     | Chemin                                | Description                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Identifiant du modèle ASR SenseAudio |
| `language` | `tools.media.audio.models[].language` | Indication de langue facultative    |
| `prompt`   | `tools.media.audio.prompt`            | Invite de transcription facultative |
| `baseUrl`  | `tools.media.audio.baseUrl` ou modèle | Remplacer la base compatible OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | En-têtes de requête supplémentaires |

<Note>
SenseAudio est uniquement STT par lots dans OpenClaw. La transcription en temps réel des appels vocaux
continue d’utiliser des fournisseurs prenant en charge le STT en streaming.
</Note>

## Connexe

- [Compréhension des médias (audio)](/fr/nodes/audio)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
