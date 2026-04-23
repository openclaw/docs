---
read_when:
    - Habilitar texto a voz para respuestas
    - Configurar proveedores o límites de TTS
    - Usar comandos `/tts`
summary: Texto a voz (TTS) para respuestas salientes
title: Texto a voz
x-i18n:
    generated_at: "2026-04-23T05:21:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: be8f5a8ce90c56bcce58723702d51154fea3f9fd27a69ace144e2b1e5bdd7049
    source_path: tools/tts.md
    workflow: 15
---

# Texto a voz (TTS)

OpenClaw puede convertir respuestas salientes en audio usando ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI o xAI.
Funciona en cualquier lugar donde OpenClaw pueda enviar audio.

## Servicios compatibles

- **ElevenLabs** (proveedor principal o de respaldo)
- **Google Gemini** (proveedor principal o de respaldo; usa la API TTS de Gemini)
- **Microsoft** (proveedor principal o de respaldo; la implementación incluida actual usa `node-edge-tts`)
- **MiniMax** (proveedor principal o de respaldo; usa la API T2A v2)
- **OpenAI** (proveedor principal o de respaldo; también se usa para resúmenes)
- **xAI** (proveedor principal o de respaldo; usa la API TTS de xAI)

### Notas sobre voz de Microsoft

El proveedor de voz de Microsoft incluido actualmente usa el servicio
neural TTS en línea de Microsoft Edge mediante la librería `node-edge-tts`. Es un servicio alojado (no
local), usa endpoints de Microsoft y no requiere clave API.
`node-edge-tts` expone opciones de configuración de voz y formatos de salida, pero
no todas las opciones son compatibles con el servicio. La configuración heredada y la entrada de directivas
que usan `edge` siguen funcionando y se normalizan a `microsoft`.

Como esta ruta es un servicio web público sin un SLA ni cuota publicados,
trátala como de mejor esfuerzo. Si necesitas límites garantizados y soporte, usa OpenAI
o ElevenLabs.

## Claves opcionales

Si quieres OpenAI, ElevenLabs, Google Gemini, MiniMax o xAI:

- `ELEVENLABS_API_KEY` (o `XI_API_KEY`)
- `GEMINI_API_KEY` (o `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

La voz de Microsoft **no** requiere clave API.

Si se configuran varios proveedores, el proveedor seleccionado se usa primero y los demás son opciones de respaldo.
El resumen automático usa el `summaryModel` configurado (o `agents.defaults.model.primary`),
por lo que ese proveedor también debe estar autenticado si habilitas los resúmenes.

## Enlaces del servicio

- [Guía de texto a voz de OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referencia de la API de Audio de OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Texto a voz de ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticación de ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API T2A v2 de MiniMax](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de salida de voz de Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Texto a voz de xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ¿Está habilitado de forma predeterminada?

No. El TTS automático está **desactivado** de forma predeterminada. Habilítalo en la configuración con
`messages.tts.auto` o localmente con `/tts on`.

Cuando `messages.tts.provider` no está configurado, OpenClaw elige el primer
proveedor de voz configurado según el orden de selección automática del registro.

## Configuración

La configuración de TTS se encuentra en `messages.tts` dentro de `openclaw.json`.
El esquema completo está en [Configuración del Gateway](/es/gateway/configuration).

### Configuración mínima (habilitar + proveedor)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI principal con respaldo de ElevenLabs

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft principal (sin clave API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Google Gemini principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

El TTS de Google Gemini usa la ruta de clave API de Gemini. Una clave API de Google Cloud Console
restringida a la API de Gemini es válida aquí, y es el mismo tipo de clave que usa
el proveedor incluido de generación de imágenes de Google. El orden de resolución es
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

El TTS de xAI usa la misma ruta `XAI_API_KEY` que el proveedor incluido de modelos Grok.
El orden de resolución es `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Las voces disponibles actualmente son `ara`, `eve`, `leo`, `rex`, `sal` y `una`; `eve` es
la predeterminada. `language` acepta una etiqueta BCP-47 o `auto`.

### Deshabilitar la voz de Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Límites personalizados + ruta de preferencias

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Responder solo con audio después de un mensaje de voz entrante

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Deshabilitar el resumen automático para respuestas largas

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Luego ejecuta:

```
/tts summary off
```

### Notas sobre los campos

- `auto`: modo automático de TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` solo envía audio después de un mensaje de voz entrante.
  - `tagged` solo envía audio cuando la respuesta incluye directivas `[[tts:key=value]]` o un bloque `[[tts:text]]...[[/tts:text]]`.
- `enabled`: interruptor heredado (doctor lo migra a `auto`).
- `mode`: `"final"` (predeterminado) o `"all"` (incluye respuestas de herramienta/bloque).
- `provider`: ID del proveedor de voz como `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` o `"openai"` (el respaldo es automático).
- Si `provider` **no está configurado**, OpenClaw usa el primer proveedor de voz configurado según el orden de selección automática del registro.
- El heredado `provider: "edge"` sigue funcionando y se normaliza a `microsoft`.
- `summaryModel`: modelo económico opcional para resumen automático; por defecto usa `agents.defaults.model.primary`.
  - Acepta `provider/model` o un alias de modelo configurado.
- `modelOverrides`: permite que el modelo emita directivas TTS (activado de forma predeterminada).
  - `allowProvider` usa `false` de forma predeterminada (el cambio de proveedor es opcional).
- `providers.<id>`: configuración propiedad del proveedor indexada por ID de proveedor de voz.
- Los bloques heredados directos de proveedor (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) se migran automáticamente a `messages.tts.providers.<id>` al cargar.
- `maxTextLength`: límite estricto para la entrada de TTS (caracteres). `/tts audio` falla si se supera.
- `timeoutMs`: tiempo de espera de la solicitud (ms).
- `prefsPath`: reemplaza la ruta local del JSON de preferencias (proveedor/límite/resumen).
- Los valores `apiKey` usan como respaldo variables de entorno (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: reemplaza la URL base de la API de ElevenLabs.
- `providers.openai.baseUrl`: reemplaza el endpoint TTS de OpenAI.
  - Orden de resolución: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Los valores distintos del predeterminado se tratan como endpoints TTS compatibles con OpenAI, por lo que se aceptan nombres personalizados de modelo y voz.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 de 2 letras (p. ej. `en`, `de`)
- `providers.elevenlabs.seed`: entero `0..4294967295` (determinismo por mejor esfuerzo)
- `providers.minimax.baseUrl`: reemplaza la URL base de la API de MiniMax (predeterminado `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modelo TTS (predeterminado `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificador de voz (predeterminado `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocidad de reproducción `0.5..2.0` (predeterminado 1.0).
- `providers.minimax.vol`: volumen `(0, 10]` (predeterminado 1.0; debe ser mayor que 0).
- `providers.minimax.pitch`: desplazamiento de tono `-12..12` (predeterminado 0).
- `providers.google.model`: modelo TTS de Gemini (predeterminado `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nombre de voz predefinida de Gemini (predeterminado `Kore`; también se acepta `voice`).
- `providers.google.baseUrl`: reemplaza la URL base de la API de Gemini. Solo se acepta `https://generativelanguage.googleapis.com`.
  - Si se omite `messages.tts.providers.google.apiKey`, TTS puede reutilizar `models.providers.google.apiKey` antes del respaldo por env.
- `providers.xai.apiKey`: clave API TTS de xAI (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: reemplaza la URL base de TTS de xAI (predeterminado `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: ID de voz de xAI (predeterminado `eve`; voces actuales: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: código de idioma BCP-47 o `auto` (predeterminado `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` o `alaw` (predeterminado `mp3`).
- `providers.xai.speed`: reemplazo nativo de velocidad del proveedor.
- `providers.microsoft.enabled`: permite el uso de voz de Microsoft (predeterminado `true`; sin clave API).
- `providers.microsoft.voice`: nombre de voz neural de Microsoft (p. ej. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: código de idioma (p. ej. `en-US`).
- `providers.microsoft.outputFormat`: formato de salida de Microsoft (p. ej. `audio-24khz-48kbitrate-mono-mp3`).
  - Consulta los formatos de salida de voz de Microsoft para ver valores válidos; no todos los formatos son compatibles con el transporte incluido basado en Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: cadenas de porcentaje (p. ej. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: escribe subtítulos JSON junto al archivo de audio.
- `providers.microsoft.proxy`: URL de proxy para solicitudes de voz de Microsoft.
- `providers.microsoft.timeoutMs`: reemplazo del tiempo de espera de la solicitud (ms).
- `edge.*`: alias heredado para la misma configuración de Microsoft.

## Reemplazos controlados por el modelo (activados de forma predeterminada)

De forma predeterminada, el modelo **puede** emitir directivas TTS para una única respuesta.
Cuando `messages.tts.auto` es `tagged`, estas directivas son obligatorias para activar el audio.

Cuando está habilitado, el modelo puede emitir directivas `[[tts:...]]` para reemplazar la voz
en una sola respuesta, además de un bloque opcional `[[tts:text]]...[[/tts:text]]` para
proporcionar etiquetas expresivas (risas, señales de canto, etc.) que solo deben aparecer en
el audio.

Las directivas `provider=...` se ignoran a menos que `modelOverrides.allowProvider: true`.

Ejemplo de carga útil de respuesta:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Claves de directiva disponibles (cuando están habilitadas):

- `provider` (ID del proveedor de voz registrado, por ejemplo `openai`, `elevenlabs`, `google`, `minimax` o `microsoft`; requiere `allowProvider: true`)
- `voice` (voz de OpenAI), `voiceName` / `voice_name` / `google_voice` (voz de Google), o `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (modelo TTS de OpenAI, ID de modelo de ElevenLabs o modelo de MiniMax) o `google_model` (modelo TTS de Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volumen de MiniMax, 0-10)
- `pitch` (tono de MiniMax, -12 a 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Deshabilitar todos los reemplazos del modelo:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Lista permitida opcional (habilita el cambio de proveedor mientras mantiene configurables otras opciones):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferencias por usuario

Los comandos slash escriben reemplazos locales en `prefsPath` (predeterminado:
`~/.openclaw/settings/tts.json`, reemplazable con `OPENCLAW_TTS_PREFS` o
`messages.tts.prefsPath`).

Campos almacenados:

- `enabled`
- `provider`
- `maxLength` (umbral de resumen; predeterminado 1500 caracteres)
- `summarize` (predeterminado `true`)

Estos reemplazan `messages.tts.*` para ese host.

## Formatos de salida (fijos)

- **Feishu / Matrix / Telegram / WhatsApp**: mensaje de voz Opus (`opus_48000_64` de ElevenLabs, `opus` de OpenAI).
  - 48kHz / 64kbps es un buen equilibrio para mensajes de voz.
- **Otros canales**: MP3 (`mp3_44100_128` de ElevenLabs, `mp3` de OpenAI).
  - 44.1kHz / 128kbps es el equilibrio predeterminado para claridad del habla.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, frecuencia de muestreo de 32kHz). El formato de nota de voz no es compatible de forma nativa; usa OpenAI o ElevenLabs si necesitas mensajes de voz Opus garantizados.
- **Google Gemini**: el TTS de la API Gemini devuelve PCM bruto de 24kHz. OpenClaw lo envuelve como WAV para adjuntos de audio y devuelve PCM directamente para Talk/telefonía. El formato nativo de nota de voz Opus no es compatible con esta ruta.
- **xAI**: MP3 de forma predeterminada; `responseFormat` puede ser `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa el endpoint REST TTS por lotes de xAI y devuelve un adjunto de audio completo; el WebSocket TTS en streaming de xAI no se usa en esta ruta de proveedor. El formato nativo de nota de voz Opus no es compatible con esta ruta.
- **Microsoft**: usa `microsoft.outputFormat` (predeterminado `audio-24khz-48kbitrate-mono-mp3`).
  - El transporte incluido acepta un `outputFormat`, pero no todos los formatos están disponibles desde el servicio.
  - Los valores de formato de salida siguen los formatos de salida de voz de Microsoft (incluidos Ogg/WebM Opus).
  - Telegram `sendVoice` acepta OGG/MP3/M4A; usa OpenAI/ElevenLabs si necesitas
    mensajes de voz Opus garantizados.
  - Si falla el formato de salida configurado de Microsoft, OpenClaw reintenta con MP3.

Los formatos de salida de OpenAI/ElevenLabs son fijos por canal (ver arriba).

## Comportamiento de TTS automático

Cuando está habilitado, OpenClaw:

- omite TTS si la respuesta ya contiene multimedia o una directiva `MEDIA:`.
- omite respuestas muy cortas (< 10 caracteres).
- resume respuestas largas cuando está habilitado usando `agents.defaults.model.primary` (o `summaryModel`).
- adjunta el audio generado a la respuesta.

Si la respuesta supera `maxLength` y el resumen está desactivado (o no hay clave API para el
modelo de resumen), se omite el
audio y se envía la respuesta de texto normal.

## Diagrama de flujo

```
Reply -> ¿TTS habilitado?
  no  -> enviar texto
  yes -> ¿tiene multimedia / MEDIA: / es corto?
          yes -> enviar texto
          no  -> ¿longitud > límite?
                   no  -> TTS -> adjuntar audio
                   yes -> ¿resumen habilitado?
                            no  -> enviar texto
                            yes -> resumir (`summaryModel` o `agents.defaults.model.primary`)
                                      -> TTS -> adjuntar audio
```

## Uso de comandos slash

Hay un único comando: `/tts`.
Consulta [Comandos slash](/es/tools/slash-commands) para detalles de habilitación.

Nota de Discord: `/tts` es un comando integrado de Discord, por lo que OpenClaw registra
`/voice` como comando nativo allí. El texto `/tts ...` sigue funcionando.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Notas:

- Los comandos requieren un remitente autorizado (siguen aplicándose las reglas de lista permitida/propietario).
- `commands.text` o el registro de comandos nativos deben estar habilitados.
- La configuración `messages.tts.auto` acepta `off|always|inbound|tagged`.
- `/tts on` escribe la preferencia local de TTS como `always`; `/tts off` la escribe como `off`.
- Usa la configuración cuando quieras valores predeterminados `inbound` o `tagged`.
- `limit` y `summary` se almacenan en preferencias locales, no en la configuración principal.
- `/tts audio` genera una respuesta de audio puntual (no activa TTS).
- `/tts status` incluye visibilidad de respaldo para el intento más reciente:
  - respaldo exitoso: `Fallback: <primary> -> <used>` más `Attempts: ...`
  - fallo: `Error: ...` más `Attempts: ...`
  - diagnósticos detallados: `Attempt details: provider:outcome(reasonCode) latency`
- Los fallos de API de OpenAI y ElevenLabs ahora incluyen detalles analizados del error del proveedor e ID de solicitud (cuando el proveedor los devuelve), lo que se muestra en errores/registros de TTS.

## Herramienta del agente

La herramienta `tts` convierte texto a voz y devuelve un adjunto de audio para
la entrega de la respuesta. Cuando el canal es Feishu, Matrix, Telegram o WhatsApp,
el audio se entrega como mensaje de voz en lugar de como adjunto de archivo.

## Gateway RPC

Métodos del Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
