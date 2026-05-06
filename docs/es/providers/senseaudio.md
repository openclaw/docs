---
read_when:
    - Quieres la conversión de voz a texto de SenseAudio para archivos adjuntos de audio
    - Necesitas la variable de entorno de la clave de API de SenseAudio o la ruta de configuración de audio
summary: Transcripción de voz a texto por lotes de SenseAudio para notas de voz entrantes
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T05:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 775d27439d8f1598c6639df936f8a80f105ced9b915e98f7ff73d9049ac1b6a2
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio puede transcribir audio entrante y adjuntos de notas de voz mediante la canalización compartida `tools.media.audio` de OpenClaw. OpenClaw publica audio multiparte en el endpoint de transcripción compatible con OpenAI e inyecta el texto devuelto como `{{Transcript}}` más un bloque `[Audio]`.

| Propiedad      | Valor                                            |
| ------------- | ------------------------------------------------ |
| ID del proveedor   | `senseaudio`                                     |
| Plugin        | incluido, `enabledByDefault: true`                |
| Contrato      | `mediaUnderstandingProviders` (audio)            |
| Variable de entorno de autenticación  | `SENSEAUDIO_API_KEY`                             |
| Modelo predeterminado | `senseaudio-asr-pro-1.5-260319`                  |
| URL predeterminada   | `https://api.senseaudio.cn/v1`                   |
| Sitio web       | [senseaudio.cn](https://senseaudio.cn)           |
| Documentación          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Primeros pasos

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
    Envía un mensaje de audio a través de cualquier canal conectado. OpenClaw sube el
    audio a SenseAudio y usa la transcripción en la canalización de respuesta.
  </Step>
</Steps>

## Opciones

| Opción     | Ruta                                  | Descripción                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID del modelo ASR de SenseAudio             |
| `language` | `tools.media.audio.models[].language` | Indicación de idioma opcional              |
| `prompt`   | `tools.media.audio.prompt`            | Prompt de transcripción opcional       |
| `baseUrl`  | `tools.media.audio.baseUrl` o modelo  | Sobrescribe la base compatible con OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Encabezados de solicitud adicionales               |

<Note>
SenseAudio solo es STT por lotes en OpenClaw. La transcripción en tiempo real de llamadas de voz
sigue usando proveedores con compatibilidad con STT en streaming.
</Note>
