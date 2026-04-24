---
read_when:
    - Cambiar la transcripción de audio o el manejo de contenido multimedia
summary: Cómo se descargan, transcriben e inyectan en las respuestas el audio entrante y las notas de voz
title: Audio y notas de voz
x-i18n:
    generated_at: "2026-04-24T05:36:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Notas de voz (2026-01-17)

## Qué funciona

- **Comprensión de contenido multimedia (audio)**: si la comprensión de audio está habilitada (o se detecta automáticamente), OpenClaw:
  1. Localiza el primer adjunto de audio (ruta local o URL) y lo descarga si es necesario.
  2. Aplica `maxBytes` antes de enviarlo a cada entrada de modelo.
  3. Ejecuta la primera entrada de modelo válida en orden (proveedor o CLI).
  4. Si falla o se omite (tamaño/tiempo de espera), prueba la siguiente entrada.
  5. Si tiene éxito, reemplaza `Body` con un bloque `[Audio]` y establece `{{Transcript}}`.
- **Análisis de comandos**: cuando la transcripción tiene éxito, `CommandBody`/`RawBody` se establecen en la transcripción para que los comandos con barra sigan funcionando.
- **Registro detallado**: con `--verbose`, registramos cuándo se ejecuta la transcripción y cuándo reemplaza el cuerpo.

## Detección automática (predeterminada)

Si **no configuras modelos** y `tools.media.audio.enabled` **no** está establecido en `false`,
OpenClaw detecta automáticamente en este orden y se detiene en la primera opción que funcione:

1. **Modelo de respuesta activo** cuando su proveedor admite comprensión de audio.
2. **CLI locales** (si están instaladas)
   - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (de `whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
   - `whisper` (CLI de Python; descarga modelos automáticamente)
3. **CLI de Gemini** (`gemini`) usando `read_many_files`
4. **Autenticación del proveedor**
   - Las entradas configuradas `models.providers.*` que admiten audio se prueban primero
   - Orden de fallback incluido: OpenAI → Groq → Deepgram → Google → Mistral

Para desactivar la detección automática, establece `tools.media.audio.enabled: false`.
Para personalizarla, establece `tools.media.audio.models`.
Nota: la detección de binarios se hace en la medida de lo posible en macOS/Linux/Windows; asegúrate de que la CLI esté en `PATH` (expandimos `~`) o establece un modelo CLI explícito con la ruta completa del comando.

## Ejemplos de configuración

### Proveedor + fallback de CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Solo proveedor con restricción por alcance

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Solo proveedor (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Solo proveedor (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Enviar la transcripción al chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Notas y límites

- La autenticación del proveedor sigue el orden estándar de autenticación del modelo (perfiles de autenticación, variables de entorno, `models.providers.*.apiKey`).
- Detalles de configuración de Groq: [Groq](/es/providers/groq).
- Deepgram toma `DEEPGRAM_API_KEY` cuando se usa `provider: "deepgram"`.
- Detalles de configuración de Deepgram: [Deepgram (transcripción de audio)](/es/providers/deepgram).
- Detalles de configuración de Mistral: [Mistral](/es/providers/mistral).
- Los proveedores de audio pueden anular `baseUrl`, `headers` y `providerOptions` mediante `tools.media.audio`.
- El límite de tamaño predeterminado es 20 MB (`tools.media.audio.maxBytes`). El audio sobredimensionado se omite para ese modelo y se prueba la siguiente entrada.
- Los archivos de audio diminutos o vacíos por debajo de 1024 bytes se omiten antes de la transcripción por proveedor/CLI.
- El valor predeterminado de `maxChars` para audio está **sin establecer** (transcripción completa). Establece `tools.media.audio.maxChars` o `maxChars` por entrada para recortar la salida.
- El valor predeterminado automático de OpenAI es `gpt-4o-mini-transcribe`; establece `model: "gpt-4o-transcribe"` para mayor precisión.
- Usa `tools.media.audio.attachments` para procesar varias notas de voz (`mode: "all"` + `maxAttachments`).
- La transcripción está disponible para las plantillas como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` está desactivado de forma predeterminada; actívalo para enviar la confirmación de la transcripción al chat de origen antes del procesamiento del agente.
- `tools.media.audio.echoFormat` personaliza el texto de eco (marcador: `{transcript}`).
- La salida stdout de la CLI está limitada (5 MB); mantén la salida de la CLI concisa.

### Compatibilidad con entorno de proxy

La transcripción de audio basada en proveedor respeta las variables de entorno estándar de proxy saliente:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si no se establece ninguna variable de entorno de proxy, se usa salida directa. Si la configuración del proxy está mal formada, OpenClaw registra una advertencia y recurre a una obtención directa.

## Detección de menciones en grupos

Cuando `requireMention: true` está configurado para un chat grupal, OpenClaw ahora transcribe el audio **antes** de comprobar las menciones. Esto permite procesar notas de voz incluso cuando contienen menciones.

**Cómo funciona:**

1. Si un mensaje de voz no tiene cuerpo de texto y el grupo requiere menciones, OpenClaw realiza una transcripción "preflight".
2. Se comprueban en la transcripción los patrones de mención (por ejemplo, `@BotName`, activadores con emoji).
3. Si se encuentra una mención, el mensaje pasa por toda la canalización principal de respuesta.
4. La transcripción se usa para la detección de menciones, de modo que las notas de voz puedan pasar la restricción por menciones.

**Comportamiento de fallback:**

- Si la transcripción falla durante el preflight (tiempo de espera, error de API, etc.), el mensaje se procesa según la detección de menciones basada solo en texto.
- Esto garantiza que los mensajes mixtos (texto + audio) nunca se descarten incorrectamente.

**Exclusión por grupo/tema de Telegram:**

- Establece `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para omitir las comprobaciones de menciones mediante transcripción preflight en ese grupo.
- Establece `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para anular por tema (`true` para omitir, `false` para forzar la activación).
- El valor predeterminado es `false` (preflight habilitado cuando coinciden las condiciones de restricción por menciones).

**Ejemplo:** un usuario envía una nota de voz diciendo "Hola @Claude, ¿qué tiempo hace?" en un grupo de Telegram con `requireMention: true`. La nota de voz se transcribe, se detecta la mención y el agente responde.

## Consideraciones

- Las reglas de alcance usan primero la primera coincidencia. `chatType` se normaliza a `direct`, `group` o `room`.
- Asegúrate de que tu CLI salga con código 0 e imprima texto plano; el JSON debe procesarse mediante `jq -r .text`.
- Para `parakeet-mlx`, si pasas `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando `--output-format` es `txt` (o se omite); los formatos de salida que no son `txt` recurren al análisis de stdout.
- Mantén tiempos de espera razonables (`timeoutSeconds`, predeterminado 60 s) para evitar bloquear la cola de respuestas.
- La transcripción preflight solo procesa el **primer** adjunto de audio para la detección de menciones. El audio adicional se procesa durante la fase principal de comprensión de contenido multimedia.

## Relacionado

- [Comprensión de contenido multimedia](/es/nodes/media-understanding)
- [Modo Talk](/es/nodes/talk)
- [Activación por voz](/es/nodes/voicewake)
