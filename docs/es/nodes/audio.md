---
read_when:
    - Cambiar la transcripción de audio o la gestión de medios
summary: Cómo se descargan, transcriben e incorporan en las respuestas las notas de audio/voz entrantes
title: Audio y notas de voz
x-i18n:
    generated_at: "2026-07-05T11:25:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8203660ec2a09e69d5e1369a62d88170a9226dc8c9bb609964addfd4822419fc
    source_path: nodes/audio.md
    workflow: 16
---

## Qué hace

Cuando la comprensión de audio está habilitada (o se detecta automáticamente), OpenClaw:

1. Localiza el primer adjunto de audio (ruta local o URL) y lo descarga si es necesario.
2. Aplica `maxBytes` antes de enviarlo a cada entrada de modelo.
3. Ejecuta la primera entrada de modelo elegible en orden (proveedor o CLI); si una entrada falla o se omite (tamaño/tiempo de espera), se prueba la siguiente entrada.
4. Si tiene éxito, reemplaza `Body` por un bloque `[Audio]` y define `{{Transcript}}`.

Cuando la transcripción tiene éxito, `CommandBody`/`RawBody` también se definen con la transcripción para que los comandos de barra sigan funcionando. Con `--verbose`, los registros muestran cuándo se ejecuta la transcripción y cuándo reemplaza el cuerpo.

## Detección automática (predeterminada)

Si no has configurado modelos y `tools.media.audio.enabled` no es `false`, OpenClaw detecta automáticamente en este orden y se detiene en la primera opción que funcione:

1. **Modelo de respuesta activo**, cuando su proveedor admite comprensión de audio.
2. **Autenticación de proveedor configurada** — cualquier entrada `models.providers.*` con autenticación disponible para un proveedor que admita transcripción de audio. Esto se comprueba antes que las CLI locales, por lo que una clave de API configurada siempre tiene prioridad sobre un binario local en `PATH`.
   Prioridad de proveedores cuando hay varios configurados: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **CLI locales** (solo si no se resolvió autenticación de proveedor), comprobadas en este orden:
   - `sherpa-onnx-offline` (requiere `SHERPA_ONNX_MODEL_DIR` con `tokens.txt`, `encoder.onnx`, `decoder.onnx` y `joiner.onnx`)
   - `whisper-cli` (de `whisper-cpp`; usa `WHISPER_CPP_MODEL` o un modelo diminuto incluido)
   - `whisper` (CLI de Python; descarga modelos automáticamente)

La detección automática de Gemini CLI para comprensión multimedia fue reemplazada por una alternativa de Antigravity CLI (`agy`) en sandbox para imagen/video; el audio no usa una alternativa de CLI más allá de los binarios locales anteriores.

Para deshabilitar la detección automática, define `tools.media.audio.enabled: false`. Para personalizarla, define `tools.media.audio.models`.

<Note>
La detección de binarios es de máximo esfuerzo en macOS/Linux/Windows. Asegúrate de que la CLI esté en `PATH` (`~` se expande), o define un modelo de CLI explícito con una ruta completa de comando.
</Note>

## Ejemplos de configuración

### Proveedor + alternativa de CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### Enviar la transcripción al chat (opcional)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Notas y límites

- La autenticación de proveedor sigue el orden estándar de autenticación de modelos (perfiles de autenticación, variables de entorno, `models.providers.*.apiKey`).
- Detalles de configuración de Groq: [Groq](/es/providers/groq).
- Deepgram recoge `DEEPGRAM_API_KEY` cuando se usa `provider: "deepgram"`. Detalles de configuración: [Deepgram](/es/providers/deepgram).
- Detalles de configuración de Mistral: [Mistral](/es/providers/mistral).
- SenseAudio recoge `SENSEAUDIO_API_KEY` cuando se usa `provider: "senseaudio"`. Detalles de configuración: [SenseAudio](/es/providers/senseaudio).
- Los proveedores de audio pueden sobrescribir `baseUrl`, `headers` y `providerOptions` mediante `tools.media.audio`.
- El límite de tamaño predeterminado es 20 MB (`tools.media.audio.maxBytes`). El audio sobredimensionado se omite para ese modelo y se prueba la siguiente entrada.
- Los archivos de audio por debajo de 1024 bytes se omiten antes de la transcripción por proveedor/CLI.
- El `maxChars` predeterminado para audio **no está definido** (transcripción completa). Define `tools.media.audio.maxChars` o un `maxChars` por entrada para recortar la salida.
- El valor predeterminado de detección automática de OpenAI es `gpt-4o-transcribe`; define `model: "gpt-4o-mini-transcribe"` para una opción más barata/rápida.
- Usa `tools.media.audio.attachments` para procesar varias notas de voz (`mode: "all"` más `maxAttachments`, predeterminado 1).
- La transcripción está disponible para las plantillas como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` está desactivado de forma predeterminada; habilítalo para enviar una confirmación de transcripción de vuelta al chat de origen antes del procesamiento del agente.
- `tools.media.audio.echoFormat` personaliza el texto de eco (marcador de posición: `{transcript}`; predeterminado `📝 "{transcript}"`).
- La salida stdout de la CLI está limitada a 5 MB; mantén la salida de la CLI concisa.
- Los `args` de la CLI deben usar `{{MediaPath}}` para la ruta del archivo de audio local. Ejecuta `openclaw doctor --fix` para migrar los marcadores de posición obsoletos `{input}` de configuraciones antiguas de `audio.transcription.command` (clave retirada: `audio.transcription`, reemplazada por `tools.media.audio.models`).

### Compatibilidad con entorno de proxy

La transcripción de audio basada en proveedor respeta las variables de entorno estándar de proxy de salida, coincidiendo con la semántica de `EnvHttpProxyAgent` de undici:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Las variables en minúsculas tienen prioridad sobre las mayúsculas; las entradas `NO_PROXY`/`no_proxy` (nombres de host, `*.suffix` o `host:port`) omiten el proxy. Si no se definen variables de entorno de proxy, se usa salida directa. Si la configuración del proxy falla (URL mal formada), OpenClaw registra una advertencia y vuelve a la descarga directa.

## Detección de menciones en grupos

Cuando `requireMention: true` está definido para un chat grupal, OpenClaw transcribe el audio **antes** de comprobar menciones. Esto permite que las notas de voz pasen la puerta de menciones incluso cuando el mensaje no tiene cuerpo de texto.

**Cómo funciona:**

1. Si un mensaje de voz no tiene cuerpo de texto y el grupo requiere menciones, OpenClaw realiza una transcripción preliminar del primer adjunto de audio.
2. La transcripción se comprueba en busca de patrones de mención (por ejemplo `@BotName`, activadores de emoji).
3. Si se encuentra una mención, el mensaje continúa por el flujo completo de respuesta.

**Comportamiento de alternativa:** si la transcripción preliminar falla (tiempo de espera, error de API, etc.), el mensaje vuelve a la detección de menciones solo por texto para que los mensajes mixtos (texto + audio) nunca se descarten.

**Exclusión por grupo/tema de Telegram:**

- Define `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para omitir las comprobaciones preliminares de menciones por transcripción para ese grupo.
- Define `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para sobrescribir por tema (`true` para omitir, `false` para forzar la habilitación).
- El valor predeterminado es `false` (preliminar habilitado cuando coinciden las condiciones con puerta de mención).

**Ejemplo:** un usuario envía una nota de voz que dice "Hey @Claude, what's the weather?" en un grupo de Telegram con `requireMention: true`. La nota de voz se transcribe, se detecta la mención y el agente responde.

## Puntos a tener en cuenta

- Las reglas de alcance usan la primera coincidencia; `chatType` se normaliza a `direct`, `group` o `channel`.
- Asegúrate de que tu CLI termine con 0 e imprima texto sin formato; la salida JSON debe ajustarse mediante `jq -r .text`.
- Para `parakeet-mlx`, si pasas `--output-dir`, OpenClaw lee `<output-dir>/<media-basename>.txt` cuando `--output-format` es `txt` (o se omite); los formatos de salida que no son `txt` vuelven al análisis de stdout.
- Mantén los tiempos de espera razonables (`timeoutSeconds`, predeterminado 60 s) para evitar bloquear la cola de respuestas.
- La transcripción preliminar solo procesa el **primer** adjunto de audio para la detección de menciones. Los adjuntos de audio adicionales se procesan durante la fase principal de comprensión multimedia.

## Relacionado

- [Comprensión multimedia](/es/nodes/media-understanding)
- [Modo de conversación](/es/nodes/talk)
- [Activación por voz](/es/nodes/voicewake)
