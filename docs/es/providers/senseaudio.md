---
read_when:
    - Se desea usar la conversión de voz a texto de SenseAudio para los archivos de audio adjuntos
    - Se necesita la variable de entorno de la clave de API de SenseAudio o la ruta de configuración de audio.
summary: Conversión de voz a texto por lotes con SenseAudio para notas de voz entrantes
title: SenseAudio
x-i18n:
    generated_at: "2026-07-22T10:46:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c0ca4a31a32eed85c1d9dcd13ebc2eaea94be370d2b1013ae8b4677949bea91d
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio transcribe los archivos adjuntos de audio y notas de voz entrantes mediante el pipeline compartido `tools.media.audio` de OpenClaw. OpenClaw envía audio multiparte al endpoint de transcripción compatible con OpenAI e inserta el texto devuelto como `{{Transcript}}` junto con un bloque `[Audio]`.

| Propiedad     | Valor                                            |
| ------------- | ------------------------------------------------ |
| Id. del proveedor | `senseaudio`                                     |
| Plugin        | incluido, `enabledByDefault: true`                |
| Contrato      | `mediaUnderstandingProviders` (audio)            |
| Variable de entorno de autenticación | `SENSEAUDIO_API_KEY`                             |
| Modelo predeterminado | `senseaudio-asr-pro-1.5-260319`                  |
| URL predeterminada | `https://api.senseaudio.cn/v1`                   |
| Sitio web     | [senseaudio.cn](https://senseaudio.cn)           |
| Documentación | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Activar el proveedor de audio">
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
  <Step title="Enviar una nota de voz">
    Envíe un mensaje de audio mediante cualquier canal conectado. OpenClaw carga el
    audio en SenseAudio y utiliza la transcripción en el pipeline de respuesta.
  </Step>
</Steps>

## Opciones

| Opción     | Ruta                            | Descripción                         |
| ---------- | ------------------------------- | ----------------------------------- |
| `model`    | `tools.media.models[].model`    | Id. del modelo ASR de SenseAudio             |
| `language` | `tools.media.models[].language` | Indicación opcional del idioma              |
| `prompt`   | `tools.media.models[].prompt`   | Prompt opcional de transcripción       |
| `baseUrl`  | `tools.media.models[].baseUrl`  | Sustituye la base compatible con OpenAI |
| `headers`  | `tools.media.models[].headers`  | Encabezados adicionales de la solicitud               |

<Note>
SenseAudio solo admite STT por lotes en OpenClaw. La transcripción en tiempo real de Voice Call
sigue utilizando proveedores compatibles con STT en streaming.
</Note>

## Contenido relacionado

- [Comprensión multimedia (audio)](/es/nodes/audio)
- [Proveedores de modelos](/es/concepts/model-providers)
