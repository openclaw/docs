---
read_when:
    - Quieres usar la conversión de voz a texto de SenseAudio para archivos adjuntos de audio
    - Necesitas la variable de entorno de clave de API de SenseAudio o la ruta de configuración de audio
summary: Transcripción por lotes de voz a texto de SenseAudio para notas de voz entrantes
title: SenseAudio
x-i18n:
    generated_at: "2026-07-05T11:42:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio transcribe archivos adjuntos de audio entrante y notas de voz mediante la canalización compartida `tools.media.audio` de OpenClaw. OpenClaw publica audio multipart en el endpoint de transcripción compatible con OpenAI e inyecta el texto devuelto como `{{Transcript}}` más un bloque `[Audio]`.

| Propiedad      | Valor                                            |
| ------------- | ------------------------------------------------ |
| ID de proveedor   | `senseaudio`                                     |
| Plugin        | incluido, `enabledByDefault: true`                |
| Contrato      | `mediaUnderstandingProviders` (audio)            |
| Variable de entorno de autenticación  | `SENSEAUDIO_API_KEY`                             |
| Modelo predeterminado | `senseaudio-asr-pro-1.5-260319`                  |
| URL predeterminada   | `https://api.senseaudio.cn/v1`                   |
| Sitio web       | [senseaudio.cn](https://senseaudio.cn)           |
| Documentación          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Primeros pasos

<Steps>
  <Step title="Configura tu clave de API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Habilita el proveedor de audio">
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
  <Step title="Envía una nota de voz">
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
SenseAudio solo funciona como STT por lotes en OpenClaw. La transcripción en tiempo real de llamadas de voz
sigue usando proveedores con compatibilidad de STT por streaming.
</Note>

## Relacionado

- [Comprensión de medios (audio)](/es/nodes/audio)
- [Proveedores de modelos](/es/concepts/model-providers)
