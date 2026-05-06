---
read_when:
    - Cambiar la transcripción de audio o la gestión de medios
summary: Cómo se descargan, transcriben e insertan en las respuestas los audios/notas de voz entrantes
title: Audio y notas de voz
x-i18n:
    generated_at: "2026-05-06T09:04:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / Notas de voz (2026-01-17)

## Qué funciona

- **Comprensión de medios (audio)**: Si la comprensión de audio está habilitada (o se detecta automáticamente), OpenClaw:
  1. Localiza el primer archivo adjunto de audio (ruta local o URL) y lo descarga si es necesario.
  2. Aplica `maxBytes` antes de enviarlo a cada entrada de modelo.
  3. Ejecuta la primera entrada de modelo elegible en orden (proveedor o CLI).
  4. Si falla o se omite (tamaño/tiempo de espera), prueba la siguiente entrada.
  5. Si tiene éxito, reemplaza `Body` por un bloque `[Audio]` y establece `{{Transcript}}`.
- **Análisis de comandos**: Cuando la transcripción se realiza correctamente, `CommandBody`/`RawBody` se establecen en la transcripción para que los comandos de barra sigan funcionando.
- **Registro detallado**: En `--verbose`, registramos cuándo se ejecuta la transcripción y cuándo reemplaza el cuerpo.

## Detección automática (predeterminado)

Si **no configuras modelos** y `tools.media.audio.enabled` **no** está establecido en `false`,
OpenClaw detecta automáticamente en este orden y se detiene en la primera opción funcional:

1. **Modelo de respuesta activo** cuando su proveedor admite comprensión de audio.
2. **CLI locales** (si están instaladas)
   - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (de `whisper-cpp`; usa `WHISPER_CPP_MODEL` o el modelo tiny incluido)
   - `whisper` (CLI de Python; descarga modelos automáticamente)
3. **CLI de Gemini** (`gemini`) mediante `read_many_files`
4. **Autenticación de proveedor**
   - Primero se prueban las entradas configuradas en `models.providers.*` que admiten audio
   - Orden de reserva incluido: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Para deshabilitar la detección automática, establece `tools.media.audio.enabled: false`.
Para personalizarla, establece `tools.media.audio.models`.
Nota: La detección de binarios es de mejor esfuerzo en macOS/Linux/Windows; asegúrate de que la CLI esté en `PATH` (expandimos `~`) o establece un modelo CLI explícito con una ruta completa de comando.

## Ejemplos de configuración

### Reserva con proveedor + CLI (OpenAI + Whisper CLI)

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

### Solo proveedor con control por alcance

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

### Solo proveedor (SenseAudio)

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

### Repetir la transcripción en el chat (opcional)

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

- La autenticación de proveedor sigue el orden estándar de autenticación de modelos (perfiles de autenticación, variables de entorno, `models.providers.*.apiKey`).
- Detalles de configuración de Groq: [Groq](/es/providers/groq).
- Deepgram recoge `DEEPGRAM_API_KEY` cuando se usa `provider: "deepgram"`.
- Detalles de configuración de Deepgram: [Deepgram (transcripción de audio)](/es/providers/deepgram).
- Detalles de configuración de Mistral: [Mistral](/es/providers/mistral).
- SenseAudio recoge `SENSEAUDIO_API_KEY` cuando se usa `provider: "senseaudio"`.
- Detalles de configuración de SenseAudio: [SenseAudio](/es/providers/senseaudio).
- Los proveedores de audio pueden sobrescribir `baseUrl`, `headers` y `providerOptions` mediante `tools.media.audio`.
- El límite de tamaño predeterminado es 20MB (`tools.media.audio.maxBytes`). El audio que excede el tamaño se omite para ese modelo y se prueba la siguiente entrada.
- Los archivos de audio diminutos/vacíos por debajo de 1024 bytes se omiten antes de la transcripción por proveedor/CLI.
- El `maxChars` predeterminado para audio **no está establecido** (transcripción completa). Establece `tools.media.audio.maxChars` o `maxChars` por entrada para recortar la salida.
- El valor automático predeterminado de OpenAI es `gpt-4o-mini-transcribe`; establece `model: "gpt-4o-transcribe"` para mayor precisión.
- Usa `tools.media.audio.attachments` para procesar varias notas de voz (`mode: "all"` + `maxAttachments`).
- La transcripción está disponible para las plantillas como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` está desactivado de forma predeterminada; actívalo para enviar la confirmación de transcripción al chat de origen antes del procesamiento del agente.
- `tools.media.audio.echoFormat` personaliza el texto de repetición (marcador de posición: `{transcript}`).
- La salida stdout de la CLI está limitada (5MB); mantén la salida de la CLI concisa.
- Los `args` de la CLI deben usar `{{MediaPath}}` para la ruta local del archivo de audio. Ejecuta `openclaw doctor --fix` para migrar marcadores de posición `{input}` obsoletos de configuraciones antiguas de `audio.transcription.command`.

### Compatibilidad con entorno de proxy

La transcripción de audio basada en proveedores respeta las variables de entorno de proxy saliente estándar:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Si no se establecen variables de entorno de proxy, se usa salida directa. Si la configuración de proxy tiene un formato incorrecto, OpenClaw registra una advertencia y vuelve a la obtención directa.

## Detección de menciones en grupos

Cuando se establece `requireMention: true` para un chat de grupo, OpenClaw ahora transcribe audio **antes** de comprobar menciones. Esto permite procesar notas de voz incluso cuando contienen menciones.

**Cómo funciona:**

1. Si un mensaje de voz no tiene cuerpo de texto y el grupo requiere menciones, OpenClaw realiza una transcripción "preflight".
2. La transcripción se comprueba en busca de patrones de mención (por ejemplo, `@BotName`, activadores de emoji).
3. Si se encuentra una mención, el mensaje pasa por el flujo completo de respuesta.
4. La transcripción se usa para la detección de menciones, de modo que las notas de voz puedan pasar la puerta de mención.

**Comportamiento de reserva:**

- Si la transcripción falla durante preflight (tiempo de espera, error de API, etc.), el mensaje se procesa según la detección de menciones solo de texto.
- Esto garantiza que los mensajes mixtos (texto + audio) nunca se descarten incorrectamente.

**Exclusión por grupo/tema de Telegram:**

- Establece `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para omitir las comprobaciones de mención de transcripción preflight para ese grupo.
- Establece `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para sobrescribir por tema (`true` para omitir, `false` para forzar la habilitación).
- El valor predeterminado es `false` (preflight habilitado cuando coinciden las condiciones con puerta de mención).

**Ejemplo:** Un usuario envía una nota de voz diciendo "Hey @Claude, what's the weather?" en un grupo de Telegram con `requireMention: true`. La nota de voz se transcribe, la mención se detecta y el agente responde.

## Puntos a tener en cuenta

- Las reglas de alcance usan la primera coincidencia. `chatType` se normaliza a `direct`, `group` o `room`.
- Asegúrate de que tu CLI salga con 0 e imprima texto sin formato; JSON debe adaptarse mediante `jq -r .text`.
- Para `parakeet-mlx`, si pasas `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando `--output-format` es `txt` (o se omite); los formatos de salida que no sean `txt` recurren al análisis de stdout.
- Mantén tiempos de espera razonables (`timeoutSeconds`, predeterminado 60s) para evitar bloquear la cola de respuestas.
- La transcripción preflight solo procesa el **primer** archivo adjunto de audio para la detección de menciones. El audio adicional se procesa durante la fase principal de comprensión de medios.

## Relacionado

- [Comprensión de medios](/es/nodes/media-understanding)
- [Modo de conversación](/es/nodes/talk)
- [Activación por voz](/es/nodes/voicewake)
