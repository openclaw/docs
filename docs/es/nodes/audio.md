---
read_when:
    - Cambiar la transcripción de audio o el manejo de contenido multimedia
summary: Cómo se descargan, transcriben e incorporan en las respuestas los audios y las notas de voz entrantes
title: Audio y notas de voz
x-i18n:
    generated_at: "2026-07-12T14:39:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Qué hace

Cuando la comprensión de audio está habilitada (o se detecta automáticamente), OpenClaw:

1. Localiza el primer archivo de audio adjunto (ruta local o URL) y lo descarga si es necesario.
2. Aplica `maxBytes` antes de enviarlo a cada entrada de modelo.
3. Ejecuta en orden la primera entrada de modelo apta (proveedor o CLI); si una entrada falla o se omite (tamaño/tiempo de espera), se prueba la siguiente.
4. Si tiene éxito, sustituye `Body` por un bloque `[Audio]` y establece `{{Transcript}}`.

Cuando la transcripción se completa correctamente, `CommandBody`/`RawBody` también se establecen en la transcripción para que los comandos con barra sigan funcionando. Con `--verbose`, los registros muestran cuándo se ejecuta la transcripción y cuándo sustituye el cuerpo.

## Detección automática (predeterminada)

Si no se han configurado modelos y `tools.media.audio.enabled` no es `false`, OpenClaw realiza la detección automática en este orden y se detiene en la primera opción que funciona:

1. **Modelo de respuesta activo**, cuando su proveedor admite la comprensión de audio.
2. **Autenticación de proveedor configurada**: cualquier entrada `models.providers.*` con autenticación disponible para un proveedor que admita la transcripción de audio. Esto se comprueba antes que las CLI locales, por lo que una clave de API configurada siempre prevalece sobre un binario local en `PATH`.
   Prioridad de proveedores cuando hay varios configurados: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **CLI locales** (solo si no se resolvió ninguna autenticación de proveedor). OpenClaw crea una lista ordenada de alternativas:
   - `whisper-cli`, antes que las opciones predeterminadas de CPU solo cuando una invocación anterior de un modelo en el proceso actual detectó Metal o CUDA
   - `sherpa-onnx-offline` con su proveedor de CPU predeterminado (requiere `SHERPA_ONNX_MODEL_DIR` con `tokens.txt`, `encoder.onnx`, `decoder.onnx` y `joiner.onnx`)
   - `whisper-cli` cuando Metal/CUDA solo está disponible en la compilación o, de otro modo, no se ha observado el backend seleccionado
   - `parakeet-mlx` en Apple Silicon (compatible con MLX; el uso del dispositivo sigue sin observarse)
   - `whisper` (CLI de Python; descarga los modelos automáticamente)

La procedencia de la instalación o el enlace demuestra la capacidad, no la ejecución. Por sí sola, nunca adelanta un candidato a sherpa en CPU. OpenClaw no carga ningún modelo durante la configuración ni las comprobaciones de estado solo para sondear un backend.
whisper.cpp detectado automáticamente mantiene habilitados sus registros normales de ejecución del modelo para que OpenClaw pueda registrar la línea de origen `using … backend`. Las entradas de CLI explícitas conservan sus indicadores de salida configurados.

La detección automática de Gemini CLI para la comprensión de medios se sustituyó por una alternativa de Antigravity CLI (`agy`) en un entorno aislado para imágenes y vídeo; el audio no utiliza ninguna alternativa de CLI aparte de los binarios locales anteriores.

Para deshabilitar la detección automática, establezca `tools.media.audio.enabled: false`. Para personalizarla, establezca `tools.media.audio.models`.

<Note>
La detección de binarios se realiza con el mejor esfuerzo en macOS/Linux/Windows. Asegúrese de que la CLI esté en `PATH` (`~` se expande), o establezca un modelo de CLI explícito con la ruta completa del comando.
</Note>

Inspeccione la selección local sin transcribir audio:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

El inventario de proveedores informa por separado del ganador de las alternativas locales y de la selección global de proveedor, además de los campos de backend disponible, solicitado y observado. Después de ejecutar la transcripción, `/status` informa del backend solicitado u observado en la línea de medios. Las entradas de CLI explícitas de `tools.media.audio.models` siguen omitiendo la selección automática; utilice sus indicadores específicos del backend, como `--provider=cuda` de sherpa o `--no-gpu`/`--device` de whisper.cpp.

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

### Solo proveedor con restricción por ámbito

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

### Repetir la transcripción en el chat (opcional)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // el valor predeterminado es false
        echoFormat: '📝 "{transcript}"', // opcional, admite {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Notas y límites

- La autenticación del proveedor sigue el orden estándar de autenticación de modelos (perfiles de autenticación, variables de entorno, `models.providers.*.apiKey`).
- Detalles de configuración de Groq: [Groq](/es/providers/groq).
- Deepgram utiliza `DEEPGRAM_API_KEY` cuando se usa `provider: "deepgram"`. Detalles de configuración: [Deepgram](/es/providers/deepgram).
- Detalles de configuración de Mistral: [Mistral](/es/providers/mistral).
- SenseAudio utiliza `SENSEAUDIO_API_KEY` cuando se usa `provider: "senseaudio"`. Detalles de configuración: [SenseAudio](/es/providers/senseaudio).
- Los proveedores de audio pueden sustituir `baseUrl`, `headers` y `providerOptions` mediante `tools.media.audio`.
- El límite de tamaño predeterminado es 20MB (`tools.media.audio.maxBytes`). El audio que supera el límite se omite para ese modelo y se prueba la entrada siguiente.
- Los archivos de audio de menos de 1024 bytes se omiten antes de la transcripción mediante proveedor o CLI.
- El valor predeterminado de `maxChars` para el audio está **sin establecer** (transcripción completa). Establezca `tools.media.audio.maxChars` o un valor `maxChars` por entrada para recortar la salida.
- El valor predeterminado de la detección automática de OpenAI es `gpt-4o-transcribe`; establezca `model: "gpt-4o-mini-transcribe"` para una opción más económica y rápida.
- Utilice `tools.media.audio.attachments` para procesar varias notas de voz (`mode: "all"` junto con `maxAttachments`, valor predeterminado 1).
- La transcripción está disponible para las plantillas como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` está desactivado de forma predeterminada; habilítelo para enviar una confirmación de la transcripción al chat de origen antes del procesamiento del agente.
- `tools.media.audio.echoFormat` personaliza el texto de confirmación (marcador de posición: `{transcript}`; valor predeterminado `📝 "{transcript}"`).
- La salida estándar de la CLI está limitada a 5MB; mantenga concisa la salida de la CLI.
- Los `args` de la CLI deben usar `{{MediaPath}}` para la ruta local del archivo de audio. Ejecute `openclaw doctor --fix` para migrar los marcadores de posición `{input}` obsoletos de configuraciones anteriores de `audio.transcription.command` (clave retirada: `audio.transcription`, sustituida por `tools.media.audio.models`).
- `tools.media.concurrency` limita las tareas de medios; no es un planificador de GPU.

### STT local residente

El STT local detectado automáticamente sigue usando un proceso por solicitud. OpenClaw no gestiona actualmente un servidor whisper.cpp residente porque el paquete estándar `whisper-cpp` de Homebrew deshabilita ese servidor, mientras que el ejemplo original no tiene configurada una cola de admisión limitada. Para poder habilitarlo de forma segura, un ciclo de vida residente propiedad de un plugin necesita un trabajador empaquetado y mantenido que incluya comprobaciones de estado y arranque, residencia del modelo, colas limitadas, cancelación y tiempo de espera, funcionamiento sin autenticación limitado a la interfaz de bucle invertido y ninguna alternativa en la nube.

### Compatibilidad con entornos de proxy

La transcripción de audio basada en proveedores respeta las variables de entorno estándar de proxy saliente, de acuerdo con la semántica de `EnvHttpProxyAgent` de undici:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Las variables en minúsculas tienen prioridad sobre las variables en mayúsculas; las entradas de `NO_PROXY`/`no_proxy` (nombres de host, `*.suffix` o `host:port`) omiten el proxy. Si no se establece ninguna variable de entorno de proxy, se utiliza una salida directa. Si la configuración del proxy falla (URL con formato incorrecto), OpenClaw registra una advertencia y recurre a la obtención directa.

## Detección de menciones en grupos

En los canales que admiten una comprobación previa de audio, OpenClaw transcribe el audio **antes** de comprobar las menciones cuando se establece `requireMention: true` para un chat grupal. Esto permite que una nota de voz sin texto adjunto supere el filtro de menciones cuando su transcripción contiene un patrón de mención configurado. La documentación específica de cada canal describe los transportes que requieren una mención escrita.

**Cómo funciona:**

1. Si un mensaje de voz no tiene cuerpo de texto y el grupo requiere menciones, OpenClaw realiza una transcripción previa del primer archivo de audio adjunto.
2. Se comprueba si la transcripción contiene patrones de mención (por ejemplo, `@BotName` o activadores con emojis).
3. Si se encuentra una mención, el mensaje continúa por el flujo completo de respuesta.

**Comportamiento alternativo:** si la transcripción previa falla (tiempo de espera, error de API, etc.), el mensaje recurre a la detección de menciones solo en el texto para que los mensajes mixtos (texto + audio) nunca se descarten.

**Desactivación por grupo/tema de Telegram:**

- Establezca `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para omitir las comprobaciones previas de menciones en la transcripción de ese grupo.
- Establezca `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para sustituir el valor por tema (`true` para omitirlas, `false` para forzar su habilitación).
- El valor predeterminado es `false` (la comprobación previa se habilita cuando se cumplen las condiciones de restricción por mención).

**Ejemplo:** una persona envía una nota de voz que dice «Hola, @Claude, ¿qué tiempo hace?» en un grupo de Telegram con `requireMention: true`. La nota de voz se transcribe, se detecta la mención y el agente responde.

## Consideraciones

- Las reglas de ámbito usan la primera coincidencia; `chatType` se normaliza como `direct`, `group` o `channel`.
- Asegúrese de que la CLI termine con el código 0 e imprima texto sin formato; la salida JSON debe adaptarse mediante `jq -r .text`.
- Los modos conocidos de salida a archivo son definitivos: un archivo de transcripción inferido vacío o ausente no produce ninguna transcripción, en lugar de recurrir a la salida de progreso de la CLI.
- Para `parakeet-mlx`, utilice `--output-format txt` (o `all`) con `--output-dir` y la plantilla de salida predeterminada `{filename}`. También se respetan las variables de entorno originales `PARAKEET_OUTPUT_FORMAT` y `PARAKEET_OUTPUT_TEMPLATE`. OpenClaw lee `<output-dir>/<media-basename>.txt`; el formato predeterminado `srt`, los demás formatos y las plantillas de salida personalizadas siguen usando la salida estándar.
- Mantenga tiempos de espera razonables (`timeoutSeconds`, valor predeterminado 60s) para evitar bloquear la cola de respuestas.
- La transcripción previa solo procesa el **primer** archivo de audio adjunto para detectar menciones. Los archivos de audio adjuntos adicionales se procesan durante la fase principal de comprensión de medios.

## Contenido relacionado

- [Comprensión de medios](/es/nodes/media-understanding)
- [Modo de conversación](/es/nodes/talk)
- [Activación por voz](/es/nodes/voicewake)
