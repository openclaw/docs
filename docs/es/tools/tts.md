---
read_when:
    - Habilitar texto a voz para las respuestas
    - Configurar un proveedor de TTS, una cadena de respaldo o una persona
    - Usar comandos o directivas de `/tts`
sidebarTitle: Text to speech (TTS)
summary: 'Texto a voz para las respuestas salientes: proveedores, personas, comandos con barra y salida por canal'
title: Texto a voz
x-i18n:
    generated_at: "2026-04-26T11:40:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw puede convertir las respuestas salientes en audio en **13 proveedores de voz**
y entregar mensajes de voz nativos en Feishu, Matrix, Telegram y WhatsApp,
archivos adjuntos de audio en cualquier otro lugar, y transmisiones PCM/Ulaw para telefonía y Talk.

## Inicio rápido

<Steps>
  <Step title="Elige un proveedor">
    OpenAI y ElevenLabs son las opciones alojadas más confiables. Microsoft y
    Local CLI funcionan sin una clave de API. Consulta la [matriz de proveedores](#supported-providers)
    para ver la lista completa.
  </Step>
  <Step title="Configura la clave de API">
    Exporta la variable de entorno de tu proveedor (por ejemplo `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft y Local CLI no necesitan clave.
  </Step>
  <Step title="Habilítalo en la configuración">
    Configura `messages.tts.auto: "always"` y `messages.tts.provider`:

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

  </Step>
  <Step title="Pruébalo en el chat">
    `/tts status` muestra el estado actual. `/tts audio Hello from OpenClaw`
    envía una respuesta de audio puntual.
  </Step>
</Steps>

<Note>
Auto-TTS está **desactivado** de forma predeterminada. Cuando `messages.tts.provider` no está configurado,
OpenClaw elige el primer proveedor configurado según el orden de selección automática del registro.
</Note>

## Proveedores compatibles

| Proveedor         | Autenticación                                                                                                    | Notas                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (también `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)      | Salida nativa de nota de voz Ogg/Opus y telefonía.                      |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` o `XI_API_KEY`                                                                              | Clonación de voz, multilingüe, determinista mediante `seed`.            |
| **Google Gemini** | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                                                                              | API TTS de Gemini; compatible con personas mediante `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Salida de nota de voz y telefonía.                                      |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS de streaming. Nota de voz Opus nativa y telefonía PCM.          |
| **Local CLI**     | ninguna                                                                                                          | Ejecuta un comando TTS local configurado.                               |
| **Microsoft**     | ninguna                                                                                                          | TTS neuronal público de Edge mediante `node-edge-tts`. Mejor esfuerzo, sin SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (o Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2. Usa `speech-2.8-hd` de forma predeterminada.                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | También se usa para el resumen automático; admite `instructions` de persona. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (puede reutilizar `models.providers.openrouter.apiKey`)                                    | Modelo predeterminado `hexgrad/kokoro-82m`.                             |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token heredados: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP de BytePlus Seed Speech.                                       |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Proveedor compartido de imágenes, video y voz.                          |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS por lotes de xAI. La nota de voz Opus nativa **no** es compatible.  |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS de MiMo mediante chat completions de Xiaomi.                        |

Si hay varios proveedores configurados, el seleccionado se usa primero y los
demás son opciones de respaldo. El resumen automático usa `summaryModel` (o
`agents.defaults.model.primary`), por lo que ese proveedor también debe estar autenticado
si mantienes los resúmenes habilitados.

<Warning>
El proveedor **Microsoft** incluido usa el servicio
TTS neuronal en línea de Microsoft Edge mediante `node-edge-tts`. Es un servicio web público sin un
SLA ni cuota publicados; trátalo como de mejor esfuerzo. El id heredado del proveedor `edge` se
normaliza a `microsoft` y `openclaw doctor --fix` reescribe la configuración
persistida; las configuraciones nuevas siempre deben usar `microsoft`.
</Warning>

## Configuración

La configuración de TTS se encuentra en `messages.tts` en `~/.openclaw/openclaw.json`. Elige un
ajuste predefinido y adapta el bloque del proveedor:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Opcional: indicaciones de estilo en lenguaje natural:
          // audioProfile: "Habla con un tono tranquilo, como el de un presentador de pódcast.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (sin clave)">
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
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
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
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Anulaciones de voz por agente

Usa `agents.list[].tts` cuando un agente deba hablar con un proveedor,
voz, modelo, persona o modo Auto-TTS diferente. El bloque del agente se fusiona en profundidad sobre
`messages.tts`, por lo que las credenciales del proveedor pueden permanecer en la configuración global del proveedor:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Para fijar una persona por agente, configura `agents.list[].tts.persona` junto con la
configuración del proveedor: anula `messages.tts.persona` global solo para ese agente.

Orden de precedencia para las respuestas automáticas, `/tts audio`, `/tts status` y la
herramienta del agente `tts`:

1. `messages.tts`
2. `agents.list[].tts` activo
3. anulación del canal, cuando el canal admite `channels.<channel>.tts`
4. anulación de la cuenta, cuando el canal pasa `channels.<channel>.accounts.<id>.tts`
5. preferencias locales de `/tts` para este host
6. directivas en línea `[[tts:...]]` cuando las [anulaciones del modelo](#model-driven-directives) están habilitadas

Las anulaciones de canal y cuenta usan la misma estructura que `messages.tts` y
se fusionan en profundidad sobre las capas anteriores, por lo que las credenciales compartidas del proveedor pueden permanecer en
`messages.tts` mientras un canal o una cuenta de bot cambia solo la voz, el modelo, la persona
o el modo automático:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Personas

Una **persona** es una identidad hablada estable que puede aplicarse de forma determinista
entre proveedores. Puede preferir un proveedor, definir una intención de prompt neutral al proveedor
y llevar enlaces específicos del proveedor para voces, modelos, plantillas de prompt,
semillas y ajustes de voz.

### Persona mínima

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrador",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### Persona completa (prompt neutral al proveedor)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Narrador mayordomo británico, seco pero cálido.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Un brillante mayordomo británico. Seco, ingenioso, cálido, encantador, emocionalmente expresivo, nunca genérico.",
            scene: "Un estudio silencioso a altas horas de la noche. Narración de micrófono cercano para un operador de confianza.",
            sampleContext: "El hablante está respondiendo a una solicitud técnica privada con confianza concisa y calidez seca.",
            style: "Refinado, sobrio, levemente divertido.",
            accent: "Inglés británico.",
            pacing: "Medido, con breves pausas dramáticas.",
            constraints: ["No leas valores de configuración en voz alta.", "No expliques la persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Resolución de persona

La persona activa se selecciona de forma determinista:

1. Preferencia local de `/tts persona <id>`, si está configurada.
2. `messages.tts.persona`, si está configurada.
3. Sin persona.

La selección del proveedor se ejecuta priorizando lo explícito:

1. Anulaciones directas (CLI, Gateway, Talk, directivas de TTS permitidas).
2. Preferencia local de `/tts provider <id>`.
3. `provider` de la persona activa.
4. `messages.tts.provider`.
5. Selección automática del registro.

Para cada intento de proveedor, OpenClaw fusiona las configuraciones en este orden:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Anulaciones de solicitudes confiables
4. Anulaciones permitidas de directivas TTS emitidas por el modelo

### Cómo usan los proveedores los prompts de persona

Los campos del prompt de persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) son **neutrales al proveedor**. Cada proveedor decide cómo
usarlos:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Envuelve los campos del prompt de persona en una estructura de prompt TTS de Gemini **solo cuando**
    la configuración efectiva del proveedor Google establece `promptTemplate: "audio-profile-v1"`
    o `personaPrompt`. Los campos antiguos `audioProfile` y `speakerName` todavía se
    anteponen como texto de prompt específico de Google. Las etiquetas de audio en línea como
    `[whispers]` o `[laughs]` dentro de un bloque `[[tts:text]]` se conservan
    dentro de la transcripción de Gemini; OpenClaw no genera estas etiquetas.
  </Accordion>
  <Accordion title="OpenAI">
    Asigna los campos del prompt de persona al campo `instructions` de la solicitud **solo cuando**
    no hay configurado un `instructions` explícito de OpenAI. `instructions`
    explícito siempre prevalece.
  </Accordion>
  <Accordion title="Otros proveedores">
    Usan solo los enlaces de persona específicos del proveedor bajo
    `personas.<id>.providers.<provider>`. Los campos del prompt de persona se ignoran
    a menos que el proveedor implemente su propio mapeo de prompt de persona.
  </Accordion>
</AccordionGroup>

### Política de respaldo

`fallbackPolicy` controla el comportamiento cuando una persona **no tiene enlace** para el
proveedor intentado:

| Política            | Comportamiento                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Predeterminada.** Los campos de prompt neutrales al proveedor siguen estando disponibles; el proveedor puede usarlos o ignorarlos.          |
| `provider-defaults` | La persona se omite de la preparación del prompt para ese intento; el proveedor usa sus valores neutros predeterminados mientras continúa el respaldo a otros proveedores. |
| `fail`              | Omite ese intento de proveedor con `reasonCode: "not_configured"` y `personaBinding: "missing"`. Los proveedores de respaldo todavía se intentan. |

Toda la solicitud TTS solo falla cuando **todos** los proveedores intentados se omiten
o fallan.

## Directivas controladas por el modelo

De forma predeterminada, el asistente **puede** emitir directivas `[[tts:...]]` para anular
la voz, el modelo o la velocidad de una sola respuesta, además de un bloque opcional
`[[tts:text]]...[[/tts:text]]` para señales expresivas que deben aparecer
solo en el audio:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Cuando `messages.tts.auto` es `"tagged"`, **las directivas son obligatorias** para activar
el audio. La entrega de bloques en streaming elimina las directivas del texto visible antes de que
el canal las vea, incluso cuando están divididas entre bloques adyacentes.

`provider=...` se ignora a menos que `modelOverrides.allowProvider: true`. Cuando una
respuesta declara `provider=...`, las otras claves de esa directiva se analizan
solo por ese proveedor; las claves no compatibles se eliminan y se informan como advertencias
de directivas TTS.

**Claves de directiva disponibles:**

- `provider` (id de proveedor registrado; requiere `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volumen de MiniMax, 0–10)
- `pitch` (tono entero de MiniMax, −12 a 12; los valores fraccionarios se truncan)
- `emotion` (etiqueta de emoción de Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Desactivar completamente las anulaciones del modelo:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Permitir el cambio de proveedor manteniendo configurables los demás controles:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandos con barra

Comando único `/tts`. En Discord, OpenClaw también registra `/voice` porque
`/tts` es un comando integrado de Discord; el texto `/tts ...` sigue funcionando.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Los comandos requieren un remitente autorizado (se aplican las reglas de allowlist/owner) y
debe estar habilitado `commands.text` o el registro de comandos nativos.
</Note>

Notas de comportamiento:

- `/tts on` escribe la preferencia local de TTS como `always`; `/tts off` la escribe como `off`.
- `/tts chat on|off|default` escribe una anulación de Auto-TTS con alcance de sesión para el chat actual.
- `/tts persona <id>` escribe la preferencia local de persona; `/tts persona off` la borra.
- `/tts latest` lee la respuesta más reciente del asistente del historial de la sesión actual y la envía como audio una vez. Solo almacena un hash de esa respuesta en la entrada de sesión para suprimir envíos de voz duplicados.
- `/tts audio` genera una respuesta de audio puntual (no **activa** TTS).
- `limit` y `summary` se almacenan en **preferencias locales**, no en la configuración principal.
- `/tts status` incluye diagnósticos de respaldo del intento más reciente: `Fallback: <primary> -> <used>`, `Attempts: ...` y detalle por intento (`provider:outcome(reasonCode) latency`).
- `/status` muestra el modo TTS activo junto con el proveedor, el modelo, la voz y los metadatos saneados del endpoint personalizado cuando TTS está habilitado.

## Preferencias por usuario

Los comandos con barra escriben anulaciones locales en `prefsPath`. El valor predeterminado es
`~/.openclaw/settings/tts.json`; se puede anular con la variable de entorno `OPENCLAW_TTS_PREFS`
o con `messages.tts.prefsPath`.

| Campo almacenado | Efecto                                      |
| ---------------- | ------------------------------------------- |
| `auto`           | Anulación local de Auto-TTS (`always`, `off`, …) |
| `provider`       | Anulación local del proveedor principal     |
| `persona`        | Anulación local de persona                  |
| `maxLength`      | Umbral de resumen (predeterminado `1500` caracteres) |
| `summarize`      | Alternancia de resumen (predeterminado `true`) |

Estas anulan la configuración efectiva de `messages.tts` más el bloque activo
`agents.list[].tts` para ese host.

## Formatos de salida (fijos)

La entrega de voz TTS está determinada por las capacidades del canal. Los plugins de canal anuncian
si el TTS de estilo de voz debe pedir a los proveedores un destino nativo `voice-note` o
mantener la síntesis normal `audio-file` y solo marcar la salida compatible para la
entrega de voz.

- **Canales compatibles con notas de voz**: las respuestas de nota de voz prefieren Opus (`opus_48000_64` de ElevenLabs, `opus` de OpenAI).
  - 48 kHz / 64 kbps es un buen equilibrio para mensajes de voz.
- **Feishu / WhatsApp**: cuando una respuesta de nota de voz se produce como MP3/WebM/WAV/M4A
  u otro archivo de audio probable, el plugin del canal la transcodifica a Ogg/Opus
  de 48 kHz con `ffmpeg` antes de enviar el mensaje de voz nativo. WhatsApp envía
  el resultado mediante la carga útil `audio` de Baileys con `ptt: true` y
  `audio/ogg; codecs=opus`. Si la conversión falla, Feishu recibe el archivo
  original como archivo adjunto; el envío de WhatsApp falla en lugar de publicar una carga útil
  PTT incompatible.
- **BlueBubbles**: mantiene la síntesis del proveedor en la ruta normal de archivo de audio; las salidas MP3
  y CAF se marcan para la entrega de memo de voz de iMessage.
- **Otros canales**: MP3 (`mp3_44100_128` de ElevenLabs, `mp3` de OpenAI).
  - 44,1 kHz / 128 kbps es el equilibrio predeterminado para la claridad del habla.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, frecuencia de muestreo de 32 kHz) para archivos adjuntos de audio normales. Para destinos de nota de voz anunciados por el canal, OpenClaw transcodifica el MP3 de MiniMax a Opus de 48 kHz con `ffmpeg` antes de la entrega cuando el canal anuncia transcodificación.
- **Xiaomi MiMo**: MP3 de forma predeterminada, o WAV cuando se configura. Para destinos de nota de voz anunciados por el canal, OpenClaw transcodifica la salida de Xiaomi a Opus de 48 kHz con `ffmpeg` antes de la entrega cuando el canal anuncia transcodificación.
- **Local CLI**: usa el `outputFormat` configurado. Los destinos de nota de voz se
  convierten a Ogg/Opus y la salida de telefonía se convierte a PCM mono sin procesar de 16 kHz
  con `ffmpeg`.
- **Google Gemini**: la API TTS de Gemini devuelve PCM sin procesar de 24 kHz. OpenClaw lo envuelve como WAV para archivos adjuntos de audio, lo transcodifica a Opus de 48 kHz para destinos de nota de voz y devuelve PCM directamente para Talk/telefonía.
- **Gradium**: WAV para archivos adjuntos de audio, Opus para destinos de nota de voz y `ulaw_8000` a 8 kHz para telefonía.
- **Inworld**: MP3 para archivos adjuntos de audio normales, `OGG_OPUS` nativo para destinos de nota de voz y `PCM` sin procesar a 22050 Hz para Talk/telefonía.
- **xAI**: MP3 de forma predeterminada; `responseFormat` puede ser `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa el endpoint TTS REST por lotes de xAI y devuelve un archivo adjunto de audio completo; el WebSocket TTS de streaming de xAI no se usa en esta ruta de proveedor. El formato nativo de nota de voz Opus no es compatible con esta ruta.
- **Microsoft**: usa `microsoft.outputFormat` (predeterminado `audio-24khz-48kbitrate-mono-mp3`).
  - El transporte incluido acepta un `outputFormat`, pero no todos los formatos están disponibles en el servicio.
  - Los valores de formato de salida siguen los formatos de salida de Microsoft Speech (incluidos Ogg/WebM Opus).
  - `sendVoice` de Telegram acepta OGG/MP3/M4A; usa OpenAI/ElevenLabs si necesitas
    mensajes de voz Opus garantizados.
  - Si falla el formato de salida de Microsoft configurado, OpenClaw vuelve a intentar con MP3.

Los formatos de salida de OpenAI/ElevenLabs son fijos por canal (ver arriba).

## Comportamiento de Auto-TTS

Cuando `messages.tts.auto` está habilitado, OpenClaw:

- Omite TTS si la respuesta ya contiene contenido multimedia o una directiva `MEDIA:`.
- Omite respuestas muy cortas (menos de 10 caracteres).
- Resume las respuestas largas cuando los resúmenes están habilitados, usando
  `summaryModel` (o `agents.defaults.model.primary`).
- Adjunta el audio generado a la respuesta.
- En `mode: "final"`, sigue enviando TTS de solo audio para respuestas finales en streaming
  después de que se complete el flujo de texto; el contenido multimedia generado pasa por la misma
  normalización multimedia del canal que los archivos adjuntos de respuesta normales.

Si la respuesta supera `maxLength` y el resumen está desactivado (o no hay clave de API para el
modelo de resumen), se omite el audio y se envía la respuesta de texto normal.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Formatos de salida por canal

| Destino                               | Formato                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Feishu / Matrix / Telegram / WhatsApp | Las respuestas de nota de voz prefieren **Opus** (`opus_48000_64` de ElevenLabs, `opus` de OpenAI). 48 kHz / 64 kbps equilibra claridad y tamaño. |
| Otros canales                         | **MP3** (`mp3_44100_128` de ElevenLabs, `mp3` de OpenAI). 44,1 kHz / 128 kbps es el valor predeterminado para voz.                 |
| Talk / telefonía                      | **PCM** nativo del proveedor (Inworld 22050 Hz, Google 24 kHz), o `ulaw_8000` de Gradium para telefonía.                          |

Notas por proveedor:

- **Transcodificación de Feishu / WhatsApp:** Cuando una respuesta de nota de voz llega como MP3/WebM/WAV/M4A, el plugin del canal la transcodifica a Ogg/Opus de 48 kHz con `ffmpeg`. WhatsApp envía mediante Baileys con `ptt: true` y `audio/ogg; codecs=opus`. Si la conversión falla: Feishu recurre a adjuntar el archivo original; el envío de WhatsApp falla en lugar de publicar una carga útil PTT incompatible.
- **MiniMax / Xiaomi MiMo:** MP3 predeterminado (32 kHz para MiniMax `speech-2.8-hd`); transcodificado a Opus de 48 kHz para destinos de nota de voz mediante `ffmpeg`.
- **Local CLI:** Usa el `outputFormat` configurado. Los destinos de nota de voz se convierten a Ogg/Opus y la salida de telefonía a PCM mono sin procesar de 16 kHz.
- **Google Gemini:** Devuelve PCM sin procesar de 24 kHz. OpenClaw lo envuelve como WAV para archivos adjuntos, lo transcodifica a Opus de 48 kHz para destinos de nota de voz y devuelve PCM directamente para Talk/telefonía.
- **Inworld:** Archivos adjuntos MP3, nota de voz `OGG_OPUS` nativa, `PCM` sin procesar de 22050 Hz para Talk/telefonía.
- **xAI:** MP3 de forma predeterminada; `responseFormat` puede ser `mp3|wav|pcm|mulaw|alaw`. Usa el endpoint por lotes REST de xAI: el WebSocket TTS de streaming **no** se usa. El formato nativo de nota de voz Opus **no** es compatible.
- **Microsoft:** Usa `microsoft.outputFormat` (predeterminado `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` de Telegram acepta OGG/MP3/M4A; usa OpenAI/ElevenLabs si necesitas mensajes de voz Opus garantizados. Si el formato de Microsoft configurado falla, OpenClaw vuelve a intentar con MP3.

Los formatos de salida de OpenAI y ElevenLabs son fijos por canal, como se indica arriba.

## Referencia de campos

<AccordionGroup>
  <Accordion title="messages.tts.* de nivel superior">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modo Auto-TTS. `inbound` solo envía audio después de un mensaje de voz entrante; `tagged` solo envía audio cuando la respuesta incluye directivas `[[tts:...]]` o un bloque `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Alternancia heredada. `openclaw doctor --fix` migra esto a `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` incluye respuestas de herramientas/bloques además de las respuestas finales.
    </ParamField>
    <ParamField path="provider" type="string">
      Id del proveedor de voz. Cuando no está configurado, OpenClaw usa el primer proveedor configurado en el orden de selección automática del registro. El valor heredado `provider: "edge"` se reescribe a `"microsoft"` mediante `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Id de la persona activa de `personas`. Se normaliza a minúsculas.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identidad hablada estable. Campos: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Consulta [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modelo económico para el resumen automático; el valor predeterminado es `agents.defaults.model.primary`. Acepta `provider/model` o un alias de modelo configurado.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Permite que el modelo emita directivas TTS. `enabled` es `true` de forma predeterminada; `allowProvider` es `false` de forma predeterminada.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Configuración propia del proveedor indexada por id del proveedor de voz. Los bloques directos heredados (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) son reescritos por `openclaw doctor --fix`; confirma solo `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Límite estricto de caracteres de entrada para TTS. `/tts audio` falla si se supera.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Tiempo de espera de la solicitud en milisegundos.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Anula la ruta JSON de preferencias locales (proveedor/límite/resumen). Valor predeterminado `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Entorno: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Región de Azure Speech (por ejemplo, `eastus`). Entorno: `AZURE_SPEECH_REGION` o `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Anulación opcional del endpoint de Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName de voz de Azure. Valor predeterminado `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Código de idioma SSML. Valor predeterminado `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` de Azure para audio estándar. Valor predeterminado `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` de Azure para salida de nota de voz. Valor predeterminado `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Recurre a `ELEVENLABS_API_KEY` o `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Id del modelo (por ejemplo, `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Id de voz de ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (cada uno `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modo de normalización de texto.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 de 2 letras (por ejemplo, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Entero `0..4294967295` para determinismo de mejor esfuerzo.</ParamField>
    <ParamField path="baseUrl" type="string">Anula la URL base de la API de ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Recurre a `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Si se omite, TTS puede reutilizar `models.providers.google.apiKey` antes de recurrir al entorno.</ParamField>
    <ParamField path="model" type="string">Modelo TTS de Gemini. Valor predeterminado `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nombre de voz predefinido de Gemini. Valor predeterminado `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt de estilo en lenguaje natural antepuesto antes del texto hablado.</ParamField>
    <ParamField path="speakerName" type="string">Etiqueta opcional del hablante antepuesta antes del texto hablado cuando el prompt usa un hablante con nombre.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Establécelo en `audio-profile-v1` para envolver los campos activos del prompt de persona en una estructura determinista de prompt TTS de Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Texto adicional de prompt de persona específico de Google que se añade a las notas del director de la plantilla.</ParamField>
    <ParamField path="baseUrl" type="string">Solo se acepta `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Entorno: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Predeterminado Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Entorno: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Predeterminado `inworld-tts-1.5-max`. También: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Predeterminado `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura de muestreo `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Ejecutable local o cadena de comando para CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Argumentos del comando. Compatible con los marcadores `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato de salida esperado del CLI. Predeterminado `mp3` para archivos adjuntos de audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Tiempo de espera del comando en milisegundos. Predeterminado `120000`.</ParamField>
    <ParamField path="cwd" type="string">Directorio de trabajo opcional del comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Anulaciones opcionales del entorno para el comando.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (sin clave de API)">
    <ParamField path="enabled" type="boolean" default="true">Permite el uso de voz de Microsoft.</ParamField>
    <ParamField path="voice" type="string">Nombre de voz neuronal de Microsoft (por ejemplo, `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Código de idioma (por ejemplo, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato de salida de Microsoft. Predeterminado `audio-24khz-48kbitrate-mono-mp3`. No todos los formatos son compatibles con el transporte incluido basado en Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Cadenas de porcentaje (por ejemplo, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Escribe subtítulos JSON junto al archivo de audio.</ParamField>
    <ParamField path="proxy" type="string">URL de proxy para solicitudes de voz de Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Anulación del tiempo de espera de la solicitud (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias heredado. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida a `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Recurre a `MINIMAX_API_KEY`. Autenticación Token Plan mediante `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.minimax.io`. Entorno: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Predeterminado `speech-2.8-hd`. Entorno: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Predeterminado `English_expressive_narrator`. Entorno: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Predeterminado `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Predeterminado `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Entero `-12..12`. Predeterminado `0`. Los valores fraccionarios se truncan antes de la solicitud.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Recurre a `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Id del modelo TTS de OpenAI (por ejemplo, `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nombre de voz (por ejemplo, `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Campo `instructions` explícito de OpenAI. Cuando se configura, los campos del prompt de persona **no** se asignan automáticamente.</ParamField>
    <ParamField path="baseUrl" type="string">
      Anula el endpoint TTS de OpenAI. Orden de resolución: configuración → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Los valores no predeterminados se tratan como endpoints TTS compatibles con OpenAI, por lo que se aceptan nombres personalizados de modelo y voz.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Entorno: `OPENROUTER_API_KEY`. Puede reutilizar `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://openrouter.ai/api/v1`. El valor heredado `https://openrouter.ai/v1` se normaliza.</ParamField>
    <ParamField path="model" type="string">Predeterminado `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Predeterminado `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Predeterminado `mp3`.</ParamField>
    <ParamField path="speed" type="number">Anulación de velocidad nativa del proveedor.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Entorno: `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Predeterminado `seed-tts-1.0`. Entorno: `VOLCENGINE_TTS_RESOURCE_ID`. Usa `seed-tts-2.0` cuando tu proyecto tenga derecho a TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Cabecera de clave de aplicación. Predeterminado `aGjiRDfUWi`. Entorno: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Anula el endpoint HTTP TTS de Seed Speech. Entorno: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Tipo de voz. Predeterminado `en_female_anna_mars_bigtts`. Entorno: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Relación de velocidad nativa del proveedor.</ParamField>
    <ParamField path="emotion" type="string">Etiqueta de emoción nativa del proveedor.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campos heredados de Volcengine Speech Console. Entorno: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (predeterminado `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Entorno: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.x.ai/v1`. Entorno: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Predeterminado `eve`. Voces en vivo: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Código de idioma BCP-47 o `auto`. Predeterminado `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Predeterminado `mp3`.</ParamField>
    <ParamField path="speed" type="number">Anulación de velocidad nativa del proveedor.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Entorno: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.xiaomimimo.com/v1`. Entorno: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Predeterminado `mimo-v2.5-tts`. Entorno: `XIAOMI_TTS_MODEL`. También compatible con `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Predeterminado `mimo_default`. Entorno: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Predeterminado `mp3`. Entorno: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instrucción opcional de estilo en lenguaje natural enviada como mensaje del usuario; no se pronuncia.</ParamField>
  </Accordion>
</AccordionGroup>

## Herramienta del agente

La herramienta `tts` convierte texto en voz y devuelve un archivo adjunto de audio para
la entrega de respuestas. En Feishu, Matrix, Telegram y WhatsApp, el audio se
entrega como un mensaje de voz en lugar de un archivo adjunto. Feishu y
WhatsApp pueden transcodificar la salida TTS no Opus en esta ruta cuando `ffmpeg` está
disponible.

WhatsApp envía audio mediante Baileys como una nota de voz PTT (`audio` con
`ptt: true`) y envía el texto visible **por separado** del audio PTT porque
los clientes no muestran de forma consistente los subtítulos en las notas de voz.

La herramienta acepta los campos opcionales `channel` y `timeoutMs`; `timeoutMs` es un
tiempo de espera por llamada para la solicitud al proveedor en milisegundos.

## RPC de Gateway

| Método            | Propósito                                 |
| ----------------- | ----------------------------------------- |
| `tts.status`      | Leer el estado actual de TTS y el último intento. |
| `tts.enable`      | Configurar la preferencia automática local en `always`. |
| `tts.disable`     | Configurar la preferencia automática local en `off`. |
| `tts.convert`     | Conversión puntual de texto → audio.      |
| `tts.setProvider` | Configurar la preferencia local del proveedor. |
| `tts.setPersona`  | Configurar la preferencia local de persona. |
| `tts.providers`   | Listar proveedores configurados y estado. |

## Enlaces del servicio

- [Guía de texto a voz de OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referencia de la API de audio de OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Texto a voz REST de Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Proveedor de Azure Speech](/es/providers/azure-speech)
- [Text to Speech de ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticación de ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/es/providers/gradium)
- [API TTS de Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS de Volcengine](/es/providers/volcengine#text-to-speech)
- [Síntesis de voz de Xiaomi MiMo](/es/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de salida de Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Texto a voz de xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Relacionado

- [Descripción general de multimedia](/es/tools/media-overview)
- [Generación de música](/es/tools/music-generation)
- [Generación de video](/es/tools/video-generation)
- [Comandos con barra](/es/tools/slash-commands)
- [Plugin de llamada de voz](/es/plugins/voice-call)
