---
read_when:
    - Vous souhaitez utiliser la transcription audio de SenseAudio pour les pièces jointes audio
    - Vous devez définir la variable d’environnement de la clé API SenseAudio ou le chemin de configuration audio.
summary: Transcription audio en texte par lots avec SenseAudio pour les messages vocaux entrants
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T03:03:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio transcrit les pièces jointes audio entrantes et les messages vocaux via le pipeline partagé `tools.media.audio` d’OpenClaw. OpenClaw envoie les données audio en plusieurs parties au point de terminaison de transcription compatible avec OpenAI et injecte le texte renvoyé sous la forme `{{Transcript}}`, accompagné d’un bloc `[Audio]`.

| Propriété       | Valeur                                           |
| --------------- | ------------------------------------------------ |
| Identifiant du fournisseur | `senseaudio`                           |
| Plugin          | intégré, `enabledByDefault: true`                 |
| Contrat         | `mediaUnderstandingProviders` (audio)             |
| Variable d’environnement d’authentification | `SENSEAUDIO_API_KEY`    |
| Modèle par défaut | `senseaudio-asr-pro-1.5-260319`                 |
| URL par défaut  | `https://api.senseaudio.cn/v1`                    |
| Site web        | [senseaudio.cn](https://senseaudio.cn)            |
| Documentation   | [senseaudio.cn/docs](https://senseaudio.cn/docs)  |

## Prise en main

<Steps>
  <Step title="Définir votre clé API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Activer le fournisseur audio">
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
  <Step title="Envoyer un message vocal">
    Envoyez un message audio via n’importe quel canal connecté. OpenClaw téléverse
    les données audio vers SenseAudio et utilise la transcription dans le pipeline de réponse.
  </Step>
</Steps>

## Options

| Option     | Chemin                                | Description                                  |
| ---------- | ------------------------------------- | -------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Identifiant du modèle ASR SenseAudio         |
| `language` | `tools.media.audio.models[].language` | Indication facultative de la langue          |
| `prompt`   | `tools.media.audio.prompt`            | Invite de transcription facultative          |
| `baseUrl`  | `tools.media.audio.baseUrl` ou modèle | Remplace la base compatible avec OpenAI      |
| `headers`  | `tools.media.audio.request.headers`   | En-têtes de requête supplémentaires          |

<Note>
Dans OpenClaw, SenseAudio prend uniquement en charge la reconnaissance vocale par lots. La transcription en temps réel des appels vocaux
continue d’utiliser des fournisseurs prenant en charge la reconnaissance vocale en continu.
</Note>

## Voir aussi

- [Compréhension des médias (audio)](/fr/nodes/audio)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
