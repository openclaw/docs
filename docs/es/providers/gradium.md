---
read_when:
    - Quieres Gradium para texto a voz
    - Necesitas configurar la clave de API de Gradium, la voz o el token de directiva
summary: Usar texto a voz de Gradium en OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T12:37:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) es un proveedor de texto a voz para OpenClaw. El Plugin puede generar respuestas de audio normales (WAV), salida Opus compatible con notas de voz y audio u-law de 8 kHz para superficies de telefonía.

| Propiedad       | Valor                                |
| --------------- | ------------------------------------ |
| ID de proveedor | `gradium`                            |
| Autenticación   | `GRADIUM_API_KEY` o config `apiKey`  |
| URL base        | `https://api.gradium.ai` (predeterminado) |
| Voz predeterminada | `Emma` (`YTpq7expH9539ERJ`)       |

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Configuración

Crea una clave de API de Gradium y luego expónla a OpenClaw con una variable de entorno o con la clave de configuración.

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

El Plugin comprueba primero el `apiKey` resuelto y recurre a la variable de entorno `GRADIUM_API_KEY`.

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

| Clave                                           | Tipo   | Descripción                                                                                   |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Clave de API resuelta. Admite `${ENV}` y referencias a secretos.                              |
| `messages.tts.providers.gradium.baseUrl`        | string | Sobrescribe el origen de la API. Las barras finales se eliminan. El valor predeterminado es `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ID de voz predeterminado usado cuando no hay una sobrescritura por directiva.                 |

El formato de audio de salida lo selecciona automáticamente el runtime según la superficie de destino y no se puede configurar desde `openclaw.json`. Consulta [Salida](#output) más abajo.

## Voces

| Nombre    | ID de voz          |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Voz predeterminada: Emma.

### Sobrescritura de voz por mensaje

Cuando la política de voz activa permite sobrescrituras de voz, puedes cambiar de voz en línea mediante un token de directiva. Usa `speakerVoiceId` para los IDs de voz nativos del proveedor.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Si la política de voz desactiva las sobrescrituras de voz, la directiva se consume pero se ignora.

## Salida

El runtime elige el formato de salida a partir de la superficie de destino. Actualmente, el proveedor no sintetiza otros formatos.

| Destino        | Formato     | Ext. de archivo | Frecuencia de muestreo | Indicador compatible con voz |
| -------------- | ----------- | --------------- | ---------------------- | ---------------------------- |
| Audio estándar | `wav`       | `.wav`          | proveedor              | no                           |
| Nota de voz    | `opus`      | `.opus`         | proveedor              | sí                           |
| Telefonía      | `ulaw_8000` | n/a             | 8 kHz                  | n/a                          |

## Orden de selección automática

Entre los proveedores de TTS configurados, el orden de selección automática de Gradium es `30`. Consulta [Texto a voz](/es/tools/tts) para ver cómo OpenClaw elige el proveedor activo cuando `messages.tts.provider` no está fijado.

## Relacionado

- [Texto a voz](/es/tools/tts)
- [Resumen de medios](/es/tools/media-overview)
