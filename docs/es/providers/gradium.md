---
read_when:
    - Quieres Gradium para la conversión de texto a voz
    - Necesita configurar la clave de API, la voz o el token de directiva de Gradium.
summary: Usar la conversión de texto a voz de Gradium en OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-12T14:47:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) es un proveedor de texto a voz para OpenClaw. Genera respuestas de audio estándar (WAV), salida Opus compatible con notas de voz y audio u-law de 8 kHz para interfaces de telefonía.

| Propiedad       | Valor                                |
| --------------- | ------------------------------------ |
| Id. del proveedor | `gradium`                          |
| Autenticación   | `GRADIUM_API_KEY` o `apiKey` en la configuración |
| URL base        | `https://api.gradium.ai` (predeterminada) |
| Voz predeterminada | `Emma` (`YTpq7expH9539ERJ`)       |

## Instalar el plugin

Gradium es un plugin externo oficial. Instálelo y, a continuación, reinicie Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Configuración inicial

Cree una clave de API de Gradium y, a continuación, expóngala mediante una variable de entorno o la clave de configuración. La configuración tiene prioridad sobre la variable de entorno.

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

| Clave                                           | Tipo   | Descripción                                                                                             |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Clave de API resuelta. Admite `${ENV}` y referencias a secretos.                                       |
| `messages.tts.providers.gradium.baseUrl`        | string | URL HTTPS de la API de Gradium en `api.gradium.ai`. Se eliminan las barras diagonales finales. Valor predeterminado: `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | Id. de voz predeterminado que se utiliza cuando no existe una directiva de sustitución.                 |

El formato de salida se elige automáticamente según la interfaz de destino (consulte [Salida](#output)) y no se puede configurar en `openclaw.json`.

## Voces

| Nombre             | Id. de voz         |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(predeterminada)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### Sustitución de voz por mensaje

Cuando la política de voz activa permite sustituir la voz, cambie de voz en línea mediante un token de directiva (todos los siguientes son equivalentes y aceptan un id. de voz nativo del proveedor):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Si la política de voz desactiva la sustitución de voz, la directiva se consume, pero se ignora.

## Salida

El formato de salida se selecciona según la interfaz de destino; el proveedor no sintetiza otros formatos.

| Destino        | Formato     | Extensión de archivo | Frecuencia de muestreo | Indicador de compatibilidad con voz |
| -------------- | ----------- | -------------------- | ---------------------- | ----------------------------------- |
| Audio estándar | `wav`       | `.wav`               | proveedor              | no                                  |
| Nota de voz    | `opus`      | `.opus`              | proveedor              | sí                                  |
| Telefonía      | `ulaw_8000` | n/d                  | 8 kHz                  | n/d                                 |

## Orden de selección automática

Entre los proveedores de TTS configurados, el orden de selección automática de Gradium es `30`. Consulte [Texto a voz](/es/tools/tts) para saber cómo OpenClaw elige el proveedor activo cuando `messages.tts.provider` no está fijado.

## Contenido relacionado

- [Texto a voz](/es/tools/tts)
- [Descripción general de los medios](/es/tools/media-overview)
