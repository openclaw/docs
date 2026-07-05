---
read_when:
    - Quieres Gradium para texto a voz
    - Necesitas configurar una clave de API, voz o token de directiva de Gradium
summary: Usar texto a voz de Gradium en OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-05T11:40:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eee8cbdeeb1cbc24bca20036c475a656e7aeab222699ae05931f07d2a635bbc6
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) es un proveedor de texto a voz para OpenClaw. Genera respuestas de audio estándar (WAV), salida Opus compatible con notas de voz y audio u-law de 8 kHz para superficies de telefonía.

| Propiedad              | Valor                                |
| ---------------------- | ------------------------------------ |
| ID de proveedor        | `gradium`                            |
| Autenticación          | `GRADIUM_API_KEY` or config `apiKey` |
| URL base               | `https://api.gradium.ai` (predeterminada) |
| Voz predeterminada     | `Emma` (`YTpq7expH9539ERJ`)          |

## Instalar plugin

Gradium es un plugin externo oficial. Instálalo y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Configuración inicial

Crea una clave de API de Gradium y luego exponla con una variable de entorno o la clave de configuración. La configuración tiene prioridad sobre la variable de entorno.

<Tabs>
  <Tab title="Variable de entorno">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Clave de configuración">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Configuración

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Clave                                           | Tipo   | Descripción                                                                       |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Clave de API resuelta. Admite `${ENV}` y referencias a secretos.                  |
| `messages.tts.providers.gradium.baseUrl`        | string | Sustitución del origen de la API. Se eliminan las barras finales. Valor predeterminado `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ID de voz predeterminado usado cuando no hay una sustitución por directiva.        |

El formato de salida se elige automáticamente según la superficie de destino (consulta [Salida](#output)) y no se puede configurar en `openclaw.json`.

## Voces

| Nombre             | ID de voz           |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(predeterminada)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### Sustitución de voz por mensaje

Cuando la política de voz activa permite sustituciones de voz, cambia de voz en línea con un token de directiva (cualquiera de estos es equivalente; todos aceptan un ID de voz nativo del proveedor):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Si la política de voz deshabilita las sustituciones de voz, la directiva se consume pero se ignora.

## Salida

El formato de salida se selecciona según la superficie de destino; el proveedor no sintetiza otros formatos.

| Destino        | Formato     | Ext. de archivo | Frecuencia de muestreo | Marca compatible con voz |
| -------------- | ----------- | --------------- | ---------------------- | ------------------------ |
| Audio estándar | `wav`       | `.wav`          | proveedor              | no                       |
| Nota de voz    | `opus`      | `.opus`         | proveedor              | sí                       |
| Telefonía      | `ulaw_8000` | n/a             | 8 kHz                  | n/a                      |

## Orden de selección automática

Entre los proveedores TTS configurados, el orden de selección automática de Gradium es `30`. Consulta [Texto a voz](/es/tools/tts) para saber cómo OpenClaw elige el proveedor activo cuando `messages.tts.provider` no está fijado.

## Relacionado

- [Texto a voz](/es/tools/tts)
- [Resumen de medios](/es/tools/media-overview)
