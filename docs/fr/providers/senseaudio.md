---
read_when:
    - Vous souhaitez utiliser la conversion de la parole en texte de SenseAudio pour les pièces jointes audio
    - Vous devez définir la variable d’environnement de la clé API SenseAudio ou le chemin de configuration audio
summary: Transcription vocale par lots avec SenseAudio pour les notes vocales entrantes
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T15:46:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio transcrit les pièces jointes audio entrantes et les notes vocales via le pipeline partagé `tools.media.audio` d’OpenClaw. OpenClaw envoie l’audio en plusieurs parties au point de terminaison de transcription compatible avec OpenAI et injecte le texte renvoyé sous la forme de `{{Transcript}}`, accompagné d’un bloc `[Audio]`.

| Propriété       | Valeur                                           |
| --------------- | ------------------------------------------------ |
| ID du fournisseur | `senseaudio`                                   |
| Plugin          | intégré, `enabledByDefault: true`                 |
| Contrat         | `mediaUnderstandingProviders` (audio)             |
| Variable d’environnement d’authentification | `SENSEAUDIO_API_KEY` |
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
  <Step title="Envoyer une note vocale">
    Envoyez un message audio via n’importe quel canal connecté. OpenClaw téléverse
    l’audio vers SenseAudio et utilise la transcription dans le pipeline de réponse.
  </Step>
</Steps>

## Options

| Option     | Chemin                                | Description                                      |
| ---------- | ------------------------------------- | ------------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | ID du modèle ASR SenseAudio                      |
| `language` | `tools.media.audio.models[].language` | Indication facultative de la langue              |
| `prompt`   | `tools.media.audio.prompt`            | Invite de transcription facultative              |
| `baseUrl`  | `tools.media.audio.baseUrl` ou modèle | Remplace l’URL de base compatible avec OpenAI    |
| `headers`  | `tools.media.audio.request.headers`   | En-têtes de requête supplémentaires              |

<Note>
Dans OpenClaw, SenseAudio prend uniquement en charge la transcription parole-texte par lots. La transcription en temps réel des appels vocaux
continue d’utiliser des fournisseurs prenant en charge la transcription parole-texte en streaming.
</Note>

## Contenu associé

- [Compréhension des médias (audio)](/fr/nodes/audio)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
