---
read_when:
    - Habilitar la conversión de texto a voz para las respuestas
    - Configuración de un proveedor de TTS, una cadena de respaldo o una persona
    - Uso de comandos o directivas /tts
sidebarTitle: Text to speech (TTS)
summary: Texto a voz para respuestas salientes — proveedores, personas, comandos de barra y salida por canal
title: Texto a voz
x-i18n:
    generated_at: "2026-05-06T05:52:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac6fce14c5597938949d1e3bb8547106707b234e9b1c7a33fd49d23bae27da6e
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw puede convertir respuestas salientes en audio con **14 proveedores de voz**
y entregar mensajes de voz nativos en Feishu, Matrix, Telegram y WhatsApp,
archivos adjuntos de audio en todos los demás lugares, y transmisiones PCM/Ulaw para telefonía y Talk.

TTS es la mitad de salida de voz del modo `stt-tts` de Talk. Las sesiones de Talk
`realtime` nativas del proveedor sintetizan voz dentro del proveedor en tiempo real
en lugar de llamar a esta ruta de TTS, mientras que las sesiones de `transcription`
no sintetizan una respuesta de voz del asistente.

## Inicio rápido

<Steps>
  <Step title="Elige un proveedor">
    OpenAI y ElevenLabs son las opciones alojadas más fiables. Microsoft y
    Local CLI funcionan sin clave de API. Consulta la [matriz de proveedores](#supported-providers)
    para ver la lista completa.
  </Step>
  <Step title="Configura la clave de API">
    Exporta la variable de entorno de tu proveedor (por ejemplo `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft y Local CLI no necesitan clave.
  </Step>
  <Step title="Actívalo en la configuración">
    Define `messages.tts.auto: "always"` y `messages.tts.provider`:

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
Auto-TTS está **desactivado** de forma predeterminada. Cuando `messages.tts.provider`
no está definido, OpenClaw elige el primer proveedor configurado según el orden de
selección automática del registro. La herramienta de agente `tts` integrada solo
funciona con intención explícita: el chat normal permanece en texto a menos que
el usuario pida audio, use `/tts` o active voz por Auto-TTS/directiva.
</Note>

## Proveedores compatibles

| Proveedor         | Autenticación                                                                                                    | Notas                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (también `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)       | Salida nativa de nota de voz Ogg/Opus y telefonía.                      |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS compatible con OpenAI. Usa `hexgrad/Kokoro-82M` de forma predeterminada. |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` o `XI_API_KEY`                                                                              | Clonación de voz, multilingüe, determinista mediante `seed`.            |
| **Google Gemini** | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                                                                              | TTS de la API de Gemini; sensible a la personalidad mediante `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Salida de nota de voz y telefonía.                                      |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API de TTS en streaming. Nota de voz Opus nativa y telefonía PCM.       |
| **Local CLI**     | ninguna                                                                                                          | Ejecuta un comando local de TTS configurado.                            |
| **Microsoft**     | ninguna                                                                                                          | TTS neural público de Edge mediante `node-edge-tts`. De mejor esfuerzo, sin SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (o plan Token: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)       | API T2A v2. Usa `speech-2.8-hd` de forma predeterminada.                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | También se usa para resumen automático; admite `instructions` de personalidad. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (puede reutilizar `models.providers.openrouter.apiKey`)                                     | Modelo predeterminado `hexgrad/kokoro-82m`.                             |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token heredados: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Proveedor compartido de imagen, video y voz.                            |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS por lotes de xAI. La nota de voz Opus nativa **no** es compatible.  |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS de MiMo mediante completados de chat de Xiaomi.                     |

Si se configuran varios proveedores, se usa primero el seleccionado y los
demás quedan como opciones de respaldo. El resumen automático usa `summaryModel`
(o `agents.defaults.model.primary`), por lo que ese proveedor también debe estar
autenticado si mantienes los resúmenes activados.

<Warning>
El proveedor **Microsoft** incluido usa el servicio de TTS neural en línea de
Microsoft Edge mediante `node-edge-tts`. Es un servicio web público sin SLA ni
cuota publicados; trátalo como de mejor esfuerzo. El id de proveedor heredado
`edge` se normaliza a `microsoft` y `openclaw doctor --fix` reescribe la
configuración persistida; las configuraciones nuevas siempre deben usar
`microsoft`.
</Warning>

## Configuración

La configuración de TTS vive en `messages.tts` dentro de
`~/.openclaw/openclaw.json`. Elige un preset y adapta el bloque del proveedor:

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
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
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

### Sobrescrituras de voz por agente

Usa `agents.list[].tts` cuando un agente deba hablar con un proveedor, voz,
modelo, personalidad o modo Auto-TTS diferente. El bloque del agente se combina
en profundidad sobre `messages.tts`, de modo que las credenciales del proveedor
pueden permanecer en la configuración global del proveedor:

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

Para fijar una personalidad por agente, define `agents.list[].tts.persona`
junto con la configuración del proveedor; sobrescribe la `messages.tts.persona`
global solo para ese agente.

Orden de precedencia para respuestas automáticas, `/tts audio`, `/tts status` y la herramienta de agente
`tts`:

1. `messages.tts`
2. `agents.list[].tts` activo
3. sobrescritura de canal, cuando el canal admite `channels.<channel>.tts`
4. sobrescritura de cuenta, cuando el canal pasa `channels.<channel>.accounts.<id>.tts`
5. preferencias locales de `/tts` para este host
6. directivas en línea `[[tts:...]]` cuando las [sobrescrituras del modelo](#model-driven-directives) están habilitadas

Las sobrescrituras de canal y cuenta usan la misma forma que `messages.tts` y se
fusionan en profundidad sobre las capas anteriores, de modo que las credenciales
compartidas del proveedor pueden permanecer en `messages.tts` mientras un canal
o una cuenta de bot cambia solo la voz, el modelo, la persona o el modo automático:

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
entre proveedores. Puede preferir un proveedor, definir una intención de prompt
neutral respecto al proveedor y llevar vinculaciones específicas de proveedor para voces, modelos, plantillas de prompt, semillas y ajustes de voz.

### Persona mínima

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
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

### Persona completa (prompt neutral respecto al proveedor)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
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

### Resolución de personas

La persona activa se selecciona de forma determinista:

1. Preferencia local `/tts persona <id>`, si está establecida.
2. `messages.tts.persona`, si está establecida.
3. Ninguna persona.

La selección del proveedor se ejecuta con prioridad explícita:

1. Sobrescrituras directas (CLI, Gateway, Talk, directivas TTS permitidas).
2. Preferencia local `/tts provider <id>`.
3. `provider` de la persona activa.
4. `messages.tts.provider`.
5. Selección automática del registro.

Para cada intento de proveedor, OpenClaw fusiona configuraciones en este orden:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Sobrescrituras de solicitud de confianza
4. Sobrescrituras permitidas de directivas TTS emitidas por el modelo

### Cómo usan los proveedores los prompts de persona

Los campos de prompt de persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) son **neutrales respecto al proveedor**. Cada proveedor decide cómo
usarlos:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Envuelve los campos de prompt de persona en una estructura de prompt TTS de Gemini **solo cuando**
    la configuración efectiva del proveedor Google establece `promptTemplate: "audio-profile-v1"`
    o `personaPrompt`. Los campos antiguos `audioProfile` y `speakerName`
    se siguen anteponiendo como texto de prompt específico de Google. Las etiquetas de audio en línea como
    `[whispers]` o `[laughs]` dentro de un bloque `[[tts:text]]` se conservan
    dentro de la transcripción de Gemini; OpenClaw no genera estas etiquetas.
  </Accordion>
  <Accordion title="OpenAI">
    Asigna los campos de prompt de persona al campo `instructions` de la solicitud **solo cuando**
    no hay `instructions` explícitas de OpenAI configuradas. Las `instructions`
    explícitas siempre tienen prioridad.
  </Accordion>
  <Accordion title="Other providers">
    Usan solo las vinculaciones de persona específicas del proveedor bajo
    `personas.<id>.providers.<provider>`. Los campos de prompt de persona se ignoran
    salvo que el proveedor implemente su propia asignación de prompt de persona.
  </Accordion>
</AccordionGroup>

### Política de reserva

`fallbackPolicy` controla el comportamiento cuando una persona **no tiene vinculación** para el
proveedor intentado:

| Política           | Comportamiento                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona` | **Predeterminado.** Los campos de prompt neutrales respecto al proveedor siguen disponibles; el proveedor puede usarlos o ignorarlos.                    |
| `provider-defaults` | La persona se omite de la preparación del prompt para ese intento; el proveedor usa sus valores predeterminados neutrales mientras continúa la reserva a otros proveedores. |
| `fail`             | Omite ese intento de proveedor con `reasonCode: "not_configured"` y `personaBinding: "missing"`. Los proveedores de reserva se siguen intentando.        |

La solicitud TTS completa solo falla cuando **todos** los proveedores intentados se omiten
o fallan.

La selección del proveedor de sesión de Talk tiene alcance de sesión. Un cliente de Talk debe elegir
ids de proveedor, ids de modelo, ids de voz y locales desde `talk.catalog` y pasarlos
a través de la sesión de Talk o la solicitud de traspaso. Abrir una sesión de voz no debería
mutar `messages.tts` ni los valores predeterminados globales del proveedor de Talk.

## Directivas impulsadas por el modelo

De forma predeterminada, el asistente **puede** emitir directivas `[[tts:...]]` para sobrescribir
voz, modelo o velocidad para una sola respuesta, además de un bloque opcional
`[[tts:text]]...[[/tts:text]]` para indicaciones expresivas que deberían aparecer solo en
audio:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Cuando `messages.tts.auto` es `"tagged"`, las **directivas son obligatorias** para activar
audio. La entrega de bloques en streaming elimina las directivas del texto visible antes de que el
canal las vea, incluso cuando están divididas entre bloques adyacentes.

`provider=...` se ignora salvo que `modelOverrides.allowProvider: true`. Cuando una
respuesta declara `provider=...`, las demás claves de esa directiva son analizadas
solo por ese proveedor; las claves no admitidas se eliminan y se notifican como advertencias
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

**Deshabilitar por completo las sobrescrituras del modelo:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Permitir el cambio de proveedor mientras se mantienen configurables otros controles:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandos slash

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
Los comandos requieren un remitente autorizado (se aplican reglas de allowlist/propietario) y que
`commands.text` o el registro nativo de comandos estén habilitados.
</Note>

Notas de comportamiento:

- `/tts on` escribe la preferencia local de TTS en `always`; `/tts off` la escribe en `off`.
- `/tts chat on|off|default` escribe una sobrescritura de auto-TTS con alcance de sesión para el chat actual.
- `/tts persona <id>` escribe la preferencia local de persona; `/tts persona off` la borra.
- `/tts latest` lee la respuesta más reciente del asistente desde la transcripción de la sesión actual y la envía como audio una vez. Almacena solo un hash de esa respuesta en la entrada de sesión para suprimir envíos de voz duplicados.
- `/tts audio` genera una respuesta de audio puntual (no activa TTS).
- `limit` y `summary` se almacenan en **preferencias locales**, no en la configuración principal.
- `/tts status` incluye diagnósticos de reserva para el último intento: `Fallback: <primary> -> <used>`, `Attempts: ...` y detalle por intento (`provider:outcome(reasonCode) latency`).
- `/status` muestra el modo TTS activo además del proveedor, modelo, voz y metadatos sanitizados de endpoint personalizado configurados cuando TTS está habilitado.

## Preferencias por usuario

Los comandos slash escriben sobrescrituras locales en `prefsPath`. El valor predeterminado es
`~/.openclaw/settings/tts.json`; sobrescríbelo con la variable de entorno `OPENCLAW_TTS_PREFS`
o `messages.tts.prefsPath`.

| Campo almacenado | Efecto                                             |
| ---------------- | -------------------------------------------------- |
| `auto`           | Sobrescritura local de auto-TTS (`always`, `off`, …) |
| `provider`       | Sobrescritura local del proveedor principal        |
| `persona`        | Sobrescritura local de persona                     |
| `maxLength`      | Umbral de resumen (predeterminado `1500` caracteres) |
| `summarize`      | Alternancia de resumen (predeterminado `true`)     |

Estos sobrescriben la configuración efectiva de `messages.tts` más el bloque
`agents.list[].tts` activo para ese host.

## Formatos de salida (fijos)

La entrega de voz TTS está impulsada por las capacidades del canal. Los plugins de canal anuncian
si TTS de estilo voz debe pedir a los proveedores un destino nativo `voice-note` o
mantener la síntesis normal `audio-file` y solo marcar la salida compatible para la entrega
de voz.

- **Canales compatibles con notas de voz**: las respuestas de nota de voz prefieren Opus (`opus_48000_64` de ElevenLabs, `opus` de OpenAI).
  - 48 kHz / 64 kbps es una buena compensación para mensajes de voz.
- **Feishu / WhatsApp**: cuando una respuesta de nota de voz se produce como MP3/WebM/WAV/M4A
  u otro archivo que probablemente sea de audio, el plugin del canal la transcodifica a Ogg/Opus
  de 48 kHz con `ffmpeg` antes de enviar el mensaje de voz nativo. WhatsApp envía
  el resultado mediante la carga útil `audio` de Baileys con `ptt: true` y
  `audio/ogg; codecs=opus`. Si la conversión falla, Feishu recibe el archivo original
  como adjunto; el envío de WhatsApp falla en lugar de publicar una carga útil PTT
  incompatible.
- **BlueBubbles**: mantiene la síntesis del proveedor en la ruta normal de archivos de audio; las salidas MP3
  y CAF se marcan para la entrega de notas de voz de iMessage.
- **Otros canales**: MP3 (`mp3_44100_128` de ElevenLabs, `mp3` de OpenAI).
  - 44,1 kHz / 128 kbps es el equilibrio predeterminado para la claridad de voz.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, frecuencia de muestreo de 32 kHz) para adjuntos de audio normales. Para destinos de notas de voz anunciados por el canal, OpenClaw transcodifica el MP3 de MiniMax a Opus de 48 kHz con `ffmpeg` antes de la entrega cuando el canal anuncia transcodificación.
- **Xiaomi MiMo**: MP3 de forma predeterminada, o WAV cuando se configura. Para destinos de notas de voz anunciados por el canal, OpenClaw transcodifica la salida de Xiaomi a Opus de 48 kHz con `ffmpeg` antes de la entrega cuando el canal anuncia transcodificación.
- **CLI local**: usa el `outputFormat` configurado. Los destinos de notas de voz se
  convierten a Ogg/Opus y la salida telefónica se convierte a PCM mono sin procesar
  de 16 kHz con `ffmpeg`.
- **Google Gemini**: la TTS de la API de Gemini devuelve PCM sin procesar a 24 kHz. OpenClaw lo envuelve como WAV para adjuntos de audio, lo transcodifica a Opus de 48 kHz para destinos de notas de voz y devuelve PCM directamente para Talk/telefonía.
- **Gradium**: WAV para adjuntos de audio, Opus para destinos de notas de voz y `ulaw_8000` a 8 kHz para telefonía.
- **Inworld**: MP3 para adjuntos de audio normales, `OGG_OPUS` nativo para destinos de notas de voz y `PCM` sin procesar a 22050 Hz para Talk/telefonía.
- **xAI**: MP3 de forma predeterminada; `responseFormat` puede ser `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa el endpoint TTS REST por lotes de xAI y devuelve un adjunto de audio completo; el WebSocket de TTS en streaming de xAI no se usa en esta ruta de proveedor. Esta ruta no admite el formato nativo Opus para notas de voz.
- **Microsoft**: usa `microsoft.outputFormat` (valor predeterminado `audio-24khz-48kbitrate-mono-mp3`).
  - El transporte incluido acepta un `outputFormat`, pero no todos los formatos están disponibles en el servicio.
  - Los valores de formato de salida siguen los formatos de salida de Microsoft Speech (incluidos Ogg/WebM Opus).
  - Telegram `sendVoice` acepta OGG/MP3/M4A; usa OpenAI/ElevenLabs si necesitas
    mensajes de voz Opus garantizados.
  - Si el formato de salida de Microsoft configurado falla, OpenClaw reintenta con MP3.

Los formatos de salida de OpenAI/ElevenLabs son fijos por canal (consulta lo anterior).

## Comportamiento de TTS automático

Cuando `messages.tts.auto` está habilitado, OpenClaw:

- Omite TTS si la respuesta ya contiene medios o una directiva `MEDIA:`.
- Omite respuestas muy cortas (menos de 10 caracteres).
- Resume respuestas largas cuando los resúmenes están habilitados, usando
  `summaryModel` (o `agents.defaults.model.primary`).
- Adjunta el audio generado a la respuesta.
- En `mode: "final"`, sigue enviando TTS de solo audio para respuestas finales transmitidas en streaming
  después de que se complete el flujo de texto; los medios generados pasan por la misma
  normalización de medios del canal que los adjuntos de respuesta normales.

Si la respuesta supera `maxLength` y el resumen está desactivado (o no hay clave de API para el
modelo de resumen), el audio se omite y se envía la respuesta de texto normal.

```text
Respuesta -> TTS habilitado?
  no  -> enviar texto
  sí -> tiene medios / MEDIA: / corta?
          sí -> enviar texto
          no  -> longitud > límite?
                   no  -> TTS -> adjuntar audio
                   sí -> resumen habilitado?
                            no  -> enviar texto
                            sí -> resumir -> TTS -> adjuntar audio
```

## Formatos de salida por canal

  | Destino                               | Formato                                                                                                                               |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | Las respuestas de notas de voz prefieren **Opus** (`opus_48000_64` de ElevenLabs, `opus` de OpenAI). 48 kHz / 64 kbps equilibra claridad y tamaño. |
  | Otros canales                         | **MP3** (`mp3_44100_128` de ElevenLabs, `mp3` de OpenAI). 44.1 kHz / 128 kbps predeterminado para voz.                                 |
  | Talk / telefonía                      | **PCM** nativo del proveedor (Inworld 22050 Hz, Google 24 kHz), o `ulaw_8000` de Gradium para telefonía.                                 |

  Notas por proveedor:

  - **Transcodificación de Feishu / WhatsApp:** Cuando una respuesta de nota de voz llega como MP3/WebM/WAV/M4A, el Plugin del canal transcodifica a Ogg/Opus de 48 kHz con `ffmpeg`. WhatsApp envía mediante Baileys con `ptt: true` y `audio/ogg; codecs=opus`. Si la conversión falla: Feishu vuelve a adjuntar el archivo original; el envío de WhatsApp falla en lugar de publicar una carga PTT incompatible.
  - **MiniMax / Xiaomi MiMo:** MP3 predeterminado (32 kHz para MiniMax `speech-2.8-hd`); transcodificado a Opus de 48 kHz para destinos de nota de voz mediante `ffmpeg`.
  - **CLI local:** Usa el `outputFormat` configurado. Los destinos de nota de voz se convierten a Ogg/Opus y la salida de telefonía a PCM mono sin procesar de 16 kHz.
  - **Google Gemini:** Devuelve PCM sin procesar de 24 kHz. OpenClaw lo envuelve como WAV para adjuntos, lo transcodifica a Opus de 48 kHz para destinos de nota de voz y devuelve PCM directamente para Talk/telefonía.
  - **Inworld:** Adjuntos MP3, nota de voz nativa `OGG_OPUS`, `PCM` sin procesar de 22050 Hz para Talk/telefonía.
  - **xAI:** MP3 de forma predeterminada; `responseFormat` puede ser `mp3|wav|pcm|mulaw|alaw`. Usa el endpoint REST por lotes de xAI; TTS por WebSocket en streaming **no** se usa. El formato nativo Opus para nota de voz **no** es compatible.
  - **Microsoft:** Usa `microsoft.outputFormat` (predeterminado `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` de Telegram acepta OGG/MP3/M4A; usa OpenAI/ElevenLabs si necesitas mensajes de voz Opus garantizados. Si el formato configurado de Microsoft falla, OpenClaw reintenta con MP3.

  Los formatos de salida de OpenAI y ElevenLabs son fijos por canal como se indicó arriba.

  ## Referencia de campos

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modo Auto-TTS. `inbound` solo envía audio después de un mensaje de voz entrante; `tagged` solo envía audio cuando la respuesta incluye directivas `[[tts:...]]` o un bloque `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Interruptor heredado. `openclaw doctor --fix` migra esto a `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` incluye respuestas de herramientas/bloques además de las respuestas finales.
    </ParamField>
    <ParamField path="provider" type="string">
      Id. del proveedor de voz. Cuando no está definido, OpenClaw usa el primer proveedor configurado en el orden de selección automática del registro. El `provider: "edge"` heredado se reescribe a `"microsoft"` mediante `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Id. de persona activa de `personas`. Se normaliza a minúsculas.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identidad hablada estable. Campos: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Consulta [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modelo económico para resumen automático; el predeterminado es `agents.defaults.model.primary`. Acepta `provider/model` o un alias de modelo configurado.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Permite que el modelo emita directivas TTS. `enabled` tiene el valor predeterminado `true`; `allowProvider` tiene el valor predeterminado `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Configuración propiedad del proveedor indexada por id. de proveedor de voz. Los bloques directos heredados (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) se reescriben mediante `openclaw doctor --fix`; confirma solo `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Límite estricto para caracteres de entrada TTS. `/tts audio` falla si se supera.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Tiempo de espera de la solicitud en milisegundos.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Sobrescribe la ruta JSON de preferencias locales (proveedor/límite/resumen). Predeterminado `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, o `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Región de Azure Speech (p. ej. `eastus`). Env: `AZURE_SPEECH_REGION` o `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Sobrescritura opcional del endpoint de Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName de voz de Azure. Predeterminado `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Código de idioma SSML. Predeterminado `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` de Azure para audio estándar. Predeterminado `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` de Azure para salida de nota de voz. Predeterminado `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Recurre a `ELEVENLABS_API_KEY` o `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Id. de modelo (p. ej. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Id. de voz de ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (cada uno `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modo de normalización de texto.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 de 2 letras (p. ej. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Entero `0..4294967295` para determinismo de mejor esfuerzo.</ParamField>
    <ParamField path="baseUrl" type="string">Sobrescribe la URL base de la API de ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Recurre a `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Si se omite, TTS puede reutilizar `models.providers.google.apiKey` antes de recurrir al entorno.</ParamField>
    <ParamField path="model" type="string">Modelo TTS de Gemini. Predeterminado `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nombre de voz preconstruida de Gemini. Predeterminado `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt de estilo en lenguaje natural antepuesto antes del texto hablado.</ParamField>
    <ParamField path="speakerName" type="string">Etiqueta de hablante opcional antepuesta antes del texto hablado cuando tu prompt usa un hablante con nombre.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Establécelo en `audio-profile-v1` para envolver los campos del prompt de la persona activa en una estructura de prompt TTS determinista de Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Texto de prompt de persona adicional específico de Google añadido a las notas del director de la plantilla.</ParamField>
    <ParamField path="baseUrl" type="string">Solo se acepta `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Predeterminado Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Principal de Inworld

    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Predeterminado `inworld-tts-1.5-max`. También: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Predeterminado `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura de muestreo `0..2`.</ParamField>

  </Accordion>

  <Accordion title="CLI local (tts-local-cli)">
    <ParamField path="command" type="string">Ejecutable local o cadena de comando para TTS de CLI.</ParamField>
    <ParamField path="args" type="string[]">Argumentos del comando. Admite marcadores de posición `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato de salida de CLI esperado. Predeterminado `mp3` para adjuntos de audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Tiempo de espera del comando en milisegundos. Predeterminado `120000`.</ParamField>
    <ParamField path="cwd" type="string">Directorio de trabajo opcional del comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Sobrescrituras de entorno opcionales para el comando.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (sin clave de API)">
    <ParamField path="enabled" type="boolean" default="true">Permitir el uso de voz de Microsoft.</ParamField>
    <ParamField path="voice" type="string">Nombre de voz neuronal de Microsoft (p. ej. `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Código de idioma (p. ej. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato de salida de Microsoft. Predeterminado `audio-24khz-48kbitrate-mono-mp3`. No todos los formatos son compatibles con el transporte incluido respaldado por Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Cadenas de porcentaje (p. ej. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Escribir subtítulos JSON junto al archivo de audio.</ParamField>
    <ParamField path="proxy" type="string">URL de proxy para solicitudes de voz de Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Sobrescritura del tiempo de espera de la solicitud (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias heredado. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida en `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Recurre a `MINIMAX_API_KEY`. Autenticación de Token Plan mediante `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Predeterminado `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Predeterminado `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Predeterminado `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Predeterminado `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Entero `-12..12`. Predeterminado `0`. Los valores fraccionarios se truncan antes de la solicitud.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Recurre a `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID del modelo TTS de OpenAI (p. ej. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nombre de voz (p. ej. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Campo `instructions` explícito de OpenAI. Cuando se establece, los campos de prompt de persona **no** se asignan automáticamente.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Campos JSON adicionales fusionados en los cuerpos de solicitud de `/audio/speech` después de los campos TTS generados de OpenAI. Usa esto para endpoints compatibles con OpenAI, como Kokoro, que requieren claves específicas del proveedor como `lang`; las claves de prototipo no seguras se ignoran.</ParamField>
    <ParamField path="baseUrl" type="string">
      Sobrescribe el endpoint TTS de OpenAI. Orden de resolución: configuración → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Los valores no predeterminados se tratan como endpoints TTS compatibles con OpenAI, por lo que se aceptan nombres personalizados de modelo y voz.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Puede reutilizar `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://openrouter.ai/api/v1`. El heredado `https://openrouter.ai/v1` se normaliza.</ParamField>
    <ParamField path="model" type="string">Predeterminado `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Predeterminado `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Predeterminado `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sobrescritura de velocidad nativa del proveedor.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Predeterminado `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Usa `seed-tts-2.0` cuando tu proyecto tenga derecho a TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Encabezado de clave de app. Predeterminado `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Sobrescribe el endpoint HTTP de TTS de Seed Speech. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Tipo de voz. Predeterminado `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Relación de velocidad nativa del proveedor.</ParamField>
    <ParamField path="emotion" type="string">Etiqueta de emoción nativa del proveedor.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campos heredados de Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (predeterminado `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Predeterminado `eve`. Voces en vivo: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Código de idioma BCP-47 o `auto`. Predeterminado `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Predeterminado `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sobrescritura de velocidad nativa del proveedor.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predeterminado `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Predeterminado `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. También admite `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Predeterminado `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Predeterminado `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instrucción de estilo opcional en lenguaje natural enviada como mensaje de usuario; no se pronuncia.</ParamField>
  </Accordion>
</AccordionGroup>

## Herramienta del agente

La herramienta `tts` convierte texto a voz y devuelve un adjunto de audio para
la entrega de respuestas. En Feishu, Matrix, Telegram y WhatsApp, el audio se
entrega como mensaje de voz en lugar de como adjunto de archivo. Feishu y
WhatsApp pueden transcodificar la salida TTS no Opus en esta ruta cuando `ffmpeg` está
disponible.

WhatsApp envía audio mediante Baileys como una nota de voz PTT (`audio` con
`ptt: true`) y envía el texto visible **por separado** del audio PTT porque
los clientes no muestran de forma consistente los subtítulos en las notas de voz.

La herramienta acepta los campos opcionales `channel` y `timeoutMs`; `timeoutMs` es un
tiempo de espera de solicitud del proveedor por llamada en milisegundos.

## RPC de Gateway

| Método            | Propósito                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Leer el estado TTS actual y el último intento. |
| `tts.enable`      | Establecer la preferencia automática local en `always`.   |
| `tts.disable`     | Establecer la preferencia automática local en `off`.      |
| `tts.convert`     | Texto a audio puntual.                    |
| `tts.setProvider` | Establecer la preferencia local de proveedor.           |
| `tts.setPersona`  | Establecer la preferencia local de persona.            |
| `tts.providers`   | Listar proveedores configurados y estado.    |

## Enlaces de servicio

- [Guía de texto a voz de OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referencia de la API de audio de OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Texto a voz REST de Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Proveedor de Azure Speech](/es/providers/azure-speech)
- [Texto a voz de ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
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

- [Resumen de medios](/es/tools/media-overview)
- [Generación de música](/es/tools/music-generation)
- [Generación de video](/es/tools/video-generation)
- [Comandos de barra](/es/tools/slash-commands)
- [Plugin de llamada de voz](/es/plugins/voice-call)
