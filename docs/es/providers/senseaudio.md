---
read_when:
    - Quieres usar la conversión de voz a texto de SenseAudio para archivos de audio adjuntos
    - Necesitas la variable de entorno de la clave de API de SenseAudio o la ruta de configuración de audio
summary: Conversión de voz a texto por lotes con SenseAudio para notas de voz entrantes
title: SenseAudio
x-i18n:
    generated_at: "2026-07-11T23:30:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio transcribe los archivos adjuntos de audio y notas de voz entrantes mediante la canalización compartida `tools.media.audio` de OpenClaw. OpenClaw envía el audio en formato multiparte al punto de conexión de transcripción compatible con OpenAI e incorpora el texto devuelto como `{{Transcript}}`, además de un bloque `[Audio]`.

| Propiedad           | Valor                                            |
| ------------------- | ------------------------------------------------ |
| Id. del proveedor   | `senseaudio`                                     |
| Plugin              | incluido, `enabledByDefault: true`                |
| Contrato            | `mediaUnderstandingProviders` (audio)            |
| Variable de entorno de autenticación | `SENSEAUDIO_API_KEY`             |
| Modelo predeterminado | `senseaudio-asr-pro-1.5-260319`                |
| URL predeterminada  | `https://api.senseaudio.cn/v1`                   |
| Sitio web           | [senseaudio.cn](https://senseaudio.cn)           |
| Documentación       | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

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
    Envía un mensaje de audio mediante cualquier canal conectado. OpenClaw sube el
    audio a SenseAudio y utiliza la transcripción en la canalización de respuesta.
  </Step>
</Steps>

## Opciones

| Opción     | Ruta                                  | Descripción                                      |
| ---------- | ------------------------------------- | ------------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | Id. del modelo ASR de SenseAudio                 |
| `language` | `tools.media.audio.models[].language` | Indicación opcional del idioma                   |
| `prompt`   | `tools.media.audio.prompt`            | Prompt opcional para la transcripción            |
| `baseUrl`  | `tools.media.audio.baseUrl` o modelo  | Reemplaza la base compatible con OpenAI          |
| `headers`  | `tools.media.audio.request.headers`   | Encabezados de solicitud adicionales             |

<Note>
SenseAudio solo admite STT por lotes en OpenClaw. La transcripción en tiempo real
de llamadas de voz sigue utilizando proveedores compatibles con STT en streaming.
</Note>

## Contenido relacionado

- [Comprensión multimedia (audio)](/es/nodes/audio)
- [Proveedores de modelos](/es/concepts/model-providers)
