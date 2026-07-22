---
read_when:
    - Activación de la conversión de texto a voz para las respuestas
    - Configuración de un proveedor de TTS, una cadena de respaldo o una personalidad
    - Uso de comandos o directivas /tts
sidebarTitle: Text to speech (TTS)
summary: 'Texto a voz para respuestas salientes: proveedores, perfiles de voz, comandos de barra y salida por canal'
title: Texto a voz
x-i18n:
    generated_at: "2026-07-22T10:54:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2ae9d0cc6f77c6a8b1b379c3712fd92fbbc22dae694ecdd46a0bb35cec0d29e7
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw convierte las respuestas salientes en audio mediante **14 proveedores de voz**:
mensajes de voz nativos en Feishu, Matrix, Telegram y WhatsApp; archivos adjuntos
de audio en los demás casos; y transmisiones PCM/Ulaw para telefonía y Talk.

TTS es la mitad de salida de voz del modo `stt-tts` de Talk (`talk.speak` utiliza esta
misma ruta de síntesis). Las sesiones de Talk `realtime` nativas del proveedor sintetizan
la voz dentro del proveedor en tiempo real; las sesiones `transcription` nunca
sintetizan una respuesta de voz del asistente.

## Inicio rápido

<Steps>
  <Step title="Elegir un proveedor">
    OpenAI y ElevenLabs son las opciones alojadas más fiables. Microsoft y la
    CLI local funcionan sin una clave de API. Consulte la [matriz de proveedores](#supported-providers)
    para ver la lista completa.
  </Step>
  <Step title="Establecer la clave de API">
    Exporte la variable de entorno del proveedor (por ejemplo, `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft y la CLI local no necesitan ninguna clave.
  </Step>
  <Step title="Activar en la configuración">
    Establezca `tts.auto: "always"` y `tts.provider`:

    ```json5
    {
      tts: {
        auto: "always",
        provider: "elevenlabs",
      },
    }
    ```

  </Step>
  <Step title="Probarlo en el chat">
    `/tts status` muestra el estado actual. `/tts audio Hello from OpenClaw`
    envía una respuesta de audio puntual.
  </Step>
</Steps>

<Note>
TTS automático está **desactivado** de forma predeterminada. Cuando `tts.provider` no está establecido,
OpenClaw elige el primer proveedor configurado según el orden de selección automática del registro.
La herramienta de agente integrada `tts` solo funciona con intención explícita: el chat habitual permanece
en texto, salvo que el usuario solicite audio, utilice `/tts` o active TTS automático o la
voz mediante directivas.
</Note>

## Proveedores compatibles

| Proveedor         | Autenticación                                                                                                    | Notas                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (también `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)       | Salida nativa de notas de voz Ogg/Opus y telefonía.                                         |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS compatible con OpenAI. El valor predeterminado es `hexgrad/Kokoro-82M`.                  |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` o `XI_API_KEY`                                                                         | Clonación de voz, multilingüe y determinista mediante `seed`; transmisión para la reproducción de voz en Discord. |
| **Google Gemini** | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                                                                         | TTS por lotes de la API de Gemini; adaptable a la personalidad mediante `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                              | Salida de notas de voz y telefonía.                                                         |
| **Inworld**       | `INWORLD_API_KEY`                                                                                              | API de TTS por transmisión. Notas de voz Opus nativas y telefonía PCM.                     |
| **CLI local**     | ninguna                                                                                                         | Ejecuta un comando TTS local configurado.                                                   |
| **Microsoft**     | ninguna                                                                                                         | TTS neuronal público de Edge mediante `node-edge-tts`. Sin garantías y sin SLA.         |
| **MiniMax**       | `MINIMAX_API_KEY` (o plan de tokens: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)                 | API T2A v2. El valor predeterminado es `speech-2.8-hd`.                                 |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                              | También se utiliza para el resumen automático; admite la personalidad `instructions`.  |
| **OpenRouter**    | `OPENROUTER_API_KEY` (puede reutilizar `models.providers.openrouter.apiKey`)                                                        | Modelo predeterminado: `hexgrad/kokoro-82m`.                                                  |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token heredados: `VOLCENGINE_TTS_APPID`/`_TOKEN`)            | API HTTP de BytePlus Seed Speech.                                                           |
| **Vydra**         | `VYDRA_API_KEY`                                                                                              | Proveedor compartido de imágenes, vídeo y voz.                                              |
| **xAI**           | `XAI_API_KEY`                                                                                              | TTS por lotes de xAI. Las notas de voz Opus nativas **no** son compatibles.                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                              | TTS de MiMo mediante finalizaciones de chat de Xiaomi.                                      |

Si hay varios proveedores configurados, se utiliza primero el seleccionado y los
demás quedan como opciones de reserva. El resumen automático utiliza `summaryModel` (o
`agents.defaults.model.primary`), por lo que ese proveedor también debe estar autenticado
si se mantienen activados los resúmenes.

<Warning>
El proveedor **Microsoft** incluido utiliza el servicio de TTS neuronal en línea
de Microsoft Edge mediante `node-edge-tts`. Es un servicio web público sin
SLA ni cuota publicados; debe considerarse un servicio sin garantías. El identificador de proveedor heredado `edge` se
normaliza como `microsoft` y `openclaw doctor --fix` reescribe la
configuración persistente; las configuraciones nuevas deben utilizar siempre `microsoft`.
</Warning>

## Configuración

La configuración de TTS se encuentra en `tts` dentro de `~/.openclaw/openclaw.json`. Elija un
preajuste y adapte el bloque del proveedor. Los campos `speakerVoice`/`speakerVoiceId`
que se muestran a continuación son los canónicos; los nombres de campo `voice`/`voiceId`/
`voiceName` propios de cada proveedor siguen funcionando como alias heredados.

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  tts: {
    auto: "always",
    provider: "azure-speech",
    providers: {
      "azure-speech": {
        apiKey: "${AZURE_SPEECH_KEY}",
        region: "eastus",
        speakerVoice: "en-US-JennyNeural",
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  tts: {
    auto: "always",
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        apiKey: "${ELEVENLABS_API_KEY}",
        model: "eleven_multilingual_v2",
        speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  tts: {
    auto: "always",
    provider: "google",
    providers: {
      google: {
        apiKey: "${GEMINI_API_KEY}",
        model: "gemini-3.1-flash-tts-preview",
        speakerVoice: "Kore",
        // Indicaciones opcionales de estilo en lenguaje natural:
        // audioProfile: "Habla con un tono tranquilo, como quien presenta un pódcast.",
        // speakerName: "Alex",
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  tts: {
    auto: "always",
    provider: "gradium",
    providers: {
      gradium: {
        apiKey: "${GRADIUM_API_KEY}",
        speakerVoiceId: "YTpq7expH9539ERJ",
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  tts: {
    auto: "always",
    provider: "inworld",
    providers: {
      inworld: {
        apiKey: "${INWORLD_API_KEY}",
        modelId: "inworld-tts-1.5-max",
        speakerVoiceId: "Sarah",
        temperature: 0.7,
      },
    },
  },
}
```
  </Tab>
  <Tab title="CLI local">
```json5
{
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
}
```
  </Tab>
  <Tab title="Microsoft (sin clave)">
```json5
{
  tts: {
    auto: "always",
    provider: "microsoft",
    providers: {
      microsoft: {
        enabled: true,
        speakerVoice: "en-US-MichelleNeural",
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        rate: "+0%",
        pitch: "+0%",
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  tts: {
    auto: "always",
    provider: "minimax",
    providers: {
      minimax: {
        apiKey: "${MINIMAX_API_KEY}",
        model: "speech-2.8-hd",
        speakerVoiceId: "English_expressive_narrator",
        speed: 1.0,
        vol: 1.0,
        pitch: 0,
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  tts: {
    auto: "always",
    provider: "openai",
    summaryModel: "openai/gpt-4.1-mini",
    modelOverrides: { enabled: true },
    providers: {
      openai: {
        apiKey: "${OPENAI_API_KEY}",
        model: "gpt-4o-mini-tts",
        speakerVoice: "alloy",
      },
      elevenlabs: {
        apiKey: "${ELEVENLABS_API_KEY}",
        model: "eleven_multilingual_v2",
        speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
        voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
        applyTextNormalization: "auto",
        languageCode: "en",
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  tts: {
    auto: "always",
    provider: "openrouter",
    providers: {
      openrouter: {
        apiKey: "${OPENROUTER_API_KEY}",
        model: "hexgrad/kokoro-82m",
        speakerVoice: "af_alloy",
        responseFormat: "mp3",
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  tts: {
    auto: "always",
    provider: "volcengine",
    providers: {
      volcengine: {
        apiKey: "${VOLCENGINE_TTS_API_KEY}",
        resourceId: "seed-tts-1.0",
        speakerVoice: "en_female_anna_mars_bigtts",
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  tts: {
    auto: "always",
    provider: "xai",
    providers: {
      xai: {
        apiKey: "${XAI_API_KEY}",
        speakerVoiceId: "eve",
        language: "en",
        responseFormat: "mp3",
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  tts: {
    auto: "always",
    provider: "xiaomi",
    providers: {
      xiaomi: {
        apiKey: "${XIAOMI_API_KEY}",
        model: "mimo-v2.5-tts",
        speakerVoice: "mimo_default",
        format: "mp3",
      },
    },
  },
}
```
  </Tab>
</Tabs>

Para `mimo-v2.5-tts-voicedesign` de Xiaomi, omita `speakerVoice` y establezca `style` con
la indicación de diseño de voz. OpenClaw envía esa indicación como mensaje `user` de TTS
y no envía `audio.voice` para el modelo voicedesign.

### Reemplazos de voz por agente

Utilice `agents.entries.*.tts` cuando un agente deba hablar con un proveedor,
una voz, un modelo, una personalidad o un modo de TTS automático distintos. El bloque del agente se combina de forma profunda sobre
`tts`, por lo que las credenciales del proveedor pueden permanecer en la configuración global del proveedor:

```json5
{
  tts: {
    auto: "always",
    provider: "elevenlabs",
    providers: {
      elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Para fijar una persona por agente, configure `agents.entries.*.tts.persona` junto con la
configuración del proveedor; esto anula el valor global de `tts.persona` solo para ese agente.

Orden de precedencia para las respuestas automáticas, `/tts audio`, `/tts status` y la
herramienta de agente `tts`:

1. `tts`
2. `agents.entries.*.tts` activo
3. anulación del canal, cuando el canal admite `channels.<channel>.tts`
4. anulación de la cuenta, cuando el canal pasa `channels.<channel>.accounts.<id>.tts`
5. preferencias locales de `/tts` para este host
6. directivas `[[tts:...]]` en línea cuando están habilitadas las [anulaciones controladas por el modelo](#model-driven-directives)

Las anulaciones de canal y cuenta usan la misma estructura que `tts` y
se combinan en profundidad sobre las capas anteriores, por lo que las credenciales compartidas
del proveedor pueden permanecer en `tts` mientras un canal o una cuenta de bot
cambia únicamente la voz del hablante, el modelo, la persona o el modo automático:

```json5
{
  tts: {
    provider: "openai",
    providers: {
      openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Personas

Una **persona** es una identidad oral estable que puede aplicarse de forma determinista
entre proveedores. Puede dar preferencia a un proveedor, definir la intención del prompt
independientemente del proveedor y contener vinculaciones específicas del proveedor para voces,
modelos, plantillas de prompt, semillas y ajustes de voz.

### Persona mínima

```json5
{
  tts: {
    auto: "always",
    persona: "narrator",
    personas: {
      narrator: {
        label: "Narrator",
        provider: "elevenlabs",
        providers: {
          elevenlabs: {
            speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
            modelId: "eleven_multilingual_v2",
          },
        },
      },
    },
  },
}
```

### Persona completa (configuración específica del proveedor)

```json5
{
  tts: {
    auto: "always",
    persona: "alfred",
    personas: {
      alfred: {
        label: "Alfred",
        description: "Dry, warm British butler narrator.",
        provider: "google",
        fallbackPolicy: "preserve-persona",
        providers: {
          google: {
            model: "gemini-3.1-flash-tts-preview",
            speakerVoice: "Algieba",
            promptTemplate: "audio-profile-v1",
          },
          openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
          elevenlabs: {
            speakerVoiceId: "voice_id",
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
}
```

### Resolución de la persona

La persona activa se selecciona de forma determinista:

1. Preferencia local de `/tts persona <id>`, si está configurada.
2. `tts.persona`, si está configurada.
3. Ninguna persona.

La selección del proveedor evalúa primero las opciones explícitas:

1. Anulaciones directas (CLI, Gateway, Talk y directivas TTS permitidas).
2. Preferencia local de `/tts provider <id>`.
3. `provider` de la persona activa.
4. `tts.provider`.
5. Selección automática del registro.

Para cada intento de proveedor, OpenClaw combina las configuraciones en este orden:

1. `tts.providers.<id>`
2. `tts.personas.<persona>.providers.<id>`
3. Anulaciones de solicitudes de confianza
4. Anulaciones permitidas de directivas TTS emitidas por el modelo

### Configuración personalizada de personas

La configuración `personas.<id>.prompt.*` independiente del proveedor está retirada. Doctor elimina
esos campos y remite al punto de extensión del proveedor de voz. Coloque los ajustes integrados
del proveedor en `personas.<id>.providers.<provider>` (por ejemplo, `personaPrompt` de Google
o `instructions` de OpenAI). Para una configuración personalizada, implemente un
plugin de proveedor de voz con `prepareSynthesis(ctx)` y devuelva texto ajustado,
configuración del proveedor o anulaciones antes de que se ejecute `synthesize()`.
Esto mantiene la construcción expresiva de prompts en el código del proveedor, donde se
conoce la semántica de las solicitudes.

### Política de respaldo

`fallbackPolicy` controla el comportamiento cuando una persona **no tiene vinculación**
para el proveedor que se intenta usar:

| Política            | Comportamiento                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Predeterminada.** Los campos de prompt independientes del proveedor siguen disponibles; el proveedor puede usarlos o ignorarlos.                     |
| `provider-defaults` | La persona se omite de la preparación del prompt para ese intento; el proveedor usa sus valores predeterminados neutros mientras continúa el respaldo a otros proveedores. |
| `fail`              | Omite ese intento de proveedor con `reasonCode: "not_configured"` y `personaBinding: "missing"`. Se siguen intentando los proveedores de respaldo.              |

La solicitud TTS completa solo falla cuando **todos** los proveedores intentados se omiten
o fallan.

La selección del proveedor de una sesión de Talk se limita a la sesión. Un cliente de Talk
debe elegir los identificadores de proveedor, modelo y voz, así como las configuraciones
regionales, desde `talk.catalog` y pasarlos mediante la sesión de Talk o la solicitud
de transferencia. Abrir una sesión de voz no debe modificar `tts` ni los
valores predeterminados globales del proveedor de Talk.

## Directivas controladas por el modelo

De forma predeterminada, el asistente **puede** emitir directivas `[[tts:...]]` para
anular la voz, el modelo o la velocidad en una sola respuesta, además de un bloque opcional
`[[tts:text]]...[[/tts:text]]` para indicaciones expresivas que solo deben aparecer en el audio:

```text
Aquí tiene.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](ríe) Lee la canción una vez más.[[/tts:text]]
```

Cuando `tts.auto` es `"tagged"`, **se requieren directivas** para activar
el audio. La entrega de bloques en streaming elimina las directivas del texto visible antes
de que el canal las reciba, incluso cuando están divididas entre bloques adyacentes.

`provider=...` se ignora salvo que `modelOverrides.allowProvider: true`. Cuando una
respuesta declara `provider=...`, las demás claves de esa directiva solo las analiza
ese proveedor; las claves no compatibles se eliminan y se notifican como advertencias
de directivas TTS.

**Claves de directiva disponibles:**

- `provider` (identificador de proveedor registrado; requiere `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (alias heredados: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volumen de MiniMax, `(0, 10]`)
- `pitch` (tono entero de MiniMax, de −12 a 12; los valores fraccionarios se truncan)
- `emotion` (etiqueta de emoción de Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Deshabilitar por completo las anulaciones del modelo:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Permitir el cambio de proveedor y mantener configurables los demás ajustes:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandos de barra diagonal

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
Los comandos requieren un remitente autorizado (se aplican las reglas de lista de permitidos
y propietario), y debe estar habilitado `commands.text` o el registro de comandos nativos.
</Note>

Notas de comportamiento:

- `/tts on` escribe la preferencia TTS local en `always`; `/tts off` la escribe en `off`.
- `/tts chat on|off|default` escribe una anulación de TTS automático limitada a la sesión para el chat actual.
- `/tts persona <id>` escribe la preferencia de persona local; `/tts persona off` la borra.
- `/tts latest` lee la respuesta más reciente del asistente en la transcripción de la sesión actual y la envía una vez como audio. Solo almacena un hash de esa respuesta en la entrada de la sesión para evitar envíos de voz duplicados.
- `/tts audio` genera una respuesta de audio puntual (**no** activa TTS).
- `/tts limit <chars>` acepta **100–4096** (4096 es el máximo de mensajes o pies de foto de Telegram); se rechazan los valores fuera de ese intervalo.
- `limit` y `summary` se almacenan en las **preferencias locales**, no en la configuración principal.
- `/tts status` incluye diagnósticos de respaldo para el intento más reciente: `Fallback: <primary> -> <used>`, `Attempts: ...` y detalles de cada intento (`provider:outcome(reasonCode) latency`).
- `/status` muestra el modo TTS activo, además del proveedor, modelo y voz configurados, y los metadatos saneados del endpoint personalizado cuando TTS está habilitado.

## Preferencias por usuario

Los comandos de barra diagonal escriben anulaciones locales en la ruta de preferencias TTS.
El valor predeterminado es `~/.openclaw/settings/tts.json`; anúlelo con `OPENCLAW_TTS_PREFS`. Doctor
traslada el valor global retirado `tts.prefsPath` al estado compartido de la máquina.
Las configuraciones multiagente avanzadas aún pueden establecer `agents.entries.<id>.tts.prefsPath`
cuando los agentes usan intencionadamente almacenes de preferencias separados.

| Campo almacenado | Efecto                                                                           |
| ---------------- | -------------------------------------------------------------------------------- |
| `auto`       | Anulación local del TTS automático (`always`, `off`, …)                                     |
| `provider`   | Anulación local del proveedor principal                                                  |
| `persona`    | Anulación local de la persona                                                           |
| `maxLength`  | Umbral de resumen o truncamiento (`1500` caracteres de forma predeterminada, intervalo de `/tts limit` entre 100 y 4096) |
| `summarize`  | Alternancia del resumen (valor predeterminado: `true`)                                                  |

Estas opciones anulan la configuración efectiva de `tts` junto con el bloque
`agents.entries.*.tts` activo para ese host.

## Formatos de salida

La entrega de voz TTS depende de las capacidades del canal. Los plugins de canal anuncian
si el TTS de tipo voz debe solicitar a los proveedores un destino `voice-note` nativo
o mantener la síntesis `audio-file` normal, y si el canal transcodifica
la salida no nativa antes de enviarla.

| Destino                               | Formato                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Las respuestas con notas de voz prefieren **Opus** (`opus_48000_64` de ElevenLabs, `opus` de OpenAI). 48 kHz / 64 kbps ofrece un equilibrio entre claridad y tamaño. |
| Otros canales                         | **MP3** (`mp3_44100_128` de ElevenLabs, `mp3` de OpenAI). 44.1 kHz / 128 kbps es el equilibrio predeterminado para voz.                  |
| Talk / telefonía                      | **PCM** nativo del proveedor (Inworld 22050 Hz, Google 24 kHz), o `ulaw_8000` de Gradium para telefonía.                                 |

Notas por proveedor:

- **Transcodificación de Feishu / WhatsApp:** cuando una respuesta con nota de voz llega como MP3/WebM/WAV/M4A u otro archivo probablemente de audio, el plugin del canal la transcodifica a Ogg/Opus de 48 kHz con `ffmpeg` (`libopus`, 64 kbps) antes de enviar el mensaje de voz nativo. WhatsApp envía el resultado mediante la carga útil `audio` de Baileys con `ptt: true` y `audio/ogg; codecs=opus`. Si falla la transcodificación: Feishu captura el error y recurre al envío del archivo original como un archivo adjunto normal; WhatsApp no tiene alternativa, por lo que el propio envío falla en lugar de publicar una carga útil PTT incompatible.
- **MiniMax:** MP3 (modelo `speech-2.8-hd`, frecuencia de muestreo de 32 kHz) para archivos adjuntos de audio normales; se transcodifica a Opus de 48 kHz con `ffmpeg` para destinos de notas de voz anunciados por el canal.
- **Xiaomi MiMo:** MP3 de forma predeterminada, o WAV cuando está configurado; se transcodifica a Opus de 48 kHz con `ffmpeg` para destinos de notas de voz anunciados por el canal.
- **CLI local:** utiliza el `outputFormat` configurado. Los destinos de notas de voz se convierten a Ogg/Opus y la salida de telefonía se convierte a PCM mono sin procesar de 16 kHz con `ffmpeg`.
- **Google Gemini:** devuelve PCM sin procesar de 24 kHz. OpenClaw lo encapsula como WAV para archivos adjuntos de audio, lo transcodifica a Opus de 48 kHz para destinos de notas de voz y devuelve PCM directamente para Talk/telefonía.
- **Gradium:** WAV para archivos adjuntos de audio, Opus para destinos de notas de voz y `ulaw_8000` a 8 kHz para telefonía.
- **Inworld:** MP3 para archivos adjuntos de audio normales, `OGG_OPUS` nativo para destinos de notas de voz y `PCM` sin procesar a 22050 Hz para Talk/telefonía.
- **xAI:** MP3 de forma predeterminada; la síntesis de archivos de audio puede utilizar `mp3`, `wav`, `pcm`, `mulaw` o `alaw` tanto para la salida almacenada en búfer como para la salida en streaming. Los destinos de notas de voz utilizan MP3 para el streaming y como alternativa con búfer porque las salidas `pcm`, `mulaw` y `alaw` de xAI son audio sin procesar y sin cabecera. La síntesis con búfer utiliza el endpoint REST por lotes `/v1/tts` de xAI; `textToSpeechStream` utiliza `wss://api.x.ai/v1/tts` nativo. Este no es el contrato de voz en tiempo real. No se admite el formato de notas de voz Opus nativo.
- **Microsoft:** utiliza `microsoft.outputFormat` (valor predeterminado: `audio-24khz-48kbitrate-mono-mp3`).
  - El transporte incluido acepta un `outputFormat`, pero no todos los formatos están disponibles en el servicio.
  - Los valores del formato de salida siguen los formatos de salida de Microsoft Speech (incluido Opus Ogg/WebM).
  - El `sendVoice` de Telegram acepta OGG/MP3/M4A; utilice OpenAI/ElevenLabs si necesita garantizar mensajes de voz Opus.
  - Si falla el formato de salida configurado de Microsoft, OpenClaw vuelve a intentarlo con MP3.
  - Cuando no se establece una sustitución explícita de voz y se utiliza la voz inglesa predeterminada, OpenClaw cambia automáticamente a una voz neuronal china (`zh-CN-XiaoxiaoNeural`, configuración regional `zh-CN`) si el texto de la respuesta está dominado por caracteres CJK.

Los formatos de salida de OpenAI y ElevenLabs son fijos para cada canal, como se indica anteriormente.

## Comportamiento de TTS automático

Cuando `tts.auto` está habilitado, OpenClaw:

- Omite TTS si la respuesta ya contiene contenido multimedia estructurado.
- Omite las respuestas muy cortas (menos de 10 caracteres).
- Resume las respuestas largas cuando los resúmenes están habilitados, mediante
  `summaryModel` (o `agents.defaults.model.primary`).
- Adjunta el audio generado a la respuesta.
- En `mode: "final"`, sigue enviando TTS solo de audio para las respuestas finales transmitidas
  después de que se complete el flujo de texto; el contenido multimedia generado pasa por la misma
  normalización de contenido multimedia del canal que los archivos adjuntos de respuesta normales.

Si la respuesta supera `maxLength`, OpenClaw nunca omite el audio por completo:

- **Resumen activado** (valor predeterminado) y hay disponible un modelo de resumen: resume el
  texto a aproximadamente `maxLength` caracteres y, a continuación, sintetiza el resumen.
- **Resumen desactivado**, la generación del resumen falla o no hay ninguna clave de API disponible para el
  modelo de resumen: trunca el texto a `maxLength` caracteres y sintetiza el
  texto truncado.

```text
Respuesta -> ¿TTS habilitado?
  no  -> enviar texto
  sí  -> ¿contiene contenido multimedia / es corta?
          sí  -> enviar texto
          no  -> ¿longitud > límite?
                   no  -> TTS -> adjuntar audio
                   sí  -> ¿resumen habilitado y disponible?
                            no  -> truncar -> TTS -> adjuntar audio
                            sí  -> resumir -> TTS -> adjuntar audio
```

## Referencia de campos

<AccordionGroup>
  <Accordion title="tts.* de nivel superior">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modo de TTS automático. `inbound` solo envía audio después de un mensaje de voz entrante; `tagged` solo envía audio cuando la respuesta incluye directivas `[[tts:...]]` o un bloque `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Opción heredada. `openclaw doctor --fix` la migra a `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` incluye las respuestas de herramientas/bloques además de las respuestas finales.
    </ParamField>
    <ParamField path="provider" type="string">
      Id. del proveedor de voz. Cuando no se establece, OpenClaw utiliza el primer proveedor configurado según el orden de selección automática del registro. `openclaw doctor --fix` reescribe el valor heredado `provider: "edge"` como `"microsoft"`.
    </ParamField>
    <ParamField path="persona" type="string">
      Id. de la identidad activa de `personas`. Se normaliza a minúsculas.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identidad hablada estable. Campos: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Consulte [Identidades](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modelo económico para el resumen automático; el valor predeterminado es `agents.defaults.model.primary`. Acepta `provider/model` o un alias de modelo configurado.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Permite que el modelo emita directivas TTS. El valor predeterminado de `enabled` es `true`; el de `allowProvider` es `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Configuración propiedad del proveedor indexada por el id. del proveedor de voz. `openclaw doctor --fix` reescribe los bloques directos heredados (`tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`); confirme únicamente `tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Límite estricto de caracteres de entrada para TTS. `/tts audio`, `tts.convert` y `tts.speak` fallan si se supera.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Tiempo de espera de la solicitud en milisegundos. Un valor `timeoutMs` por llamada (herramienta del agente, gateway) tiene prioridad cuando se establece; de lo contrario, un valor `tts.timeoutMs` configurado explícitamente tiene prioridad sobre cualquier valor predeterminado del proveedor definido por un plugin.
    </ParamField>
  </Accordion>

Los campos `apiKey` del proveedor pueden ser cadenas sin procesar o SecretRefs. Durante el inicio en frío del Gateway,
una SecretRef de TTS no disponible marca la capacidad TTS integrada como
configurada pero no disponible en lugar de detener el Gateway. A continuación, `tts.speak` devuelve
`UNAVAILABLE` con el motivo `SECRET_SURFACE_UNAVAILABLE`, y no se envía ninguna solicitud
al proveedor. El estado y el diagnóstico enumeran el propietario de TTS degradado y sus rutas de configuración. Las
referencias explícitas permanecen en la instantánea del entorno de ejecución, por lo que las credenciales
del entorno o del perfil no pueden seleccionar silenciosamente una cuenta distinta. Las recargas y la comprobación previa
de escritura de configuración aplican la política de degradación que tiene en cuenta al propietario: un propietario de TTS apto
y sin cambios puede conservar como obsoletas sus últimas credenciales válidas conocidas, mientras que un fallo nuevo o modificado
pasa a estar en frío sin bloquear a los propietarios en buen estado. Las referencias estructuralmente no válidas
y los valores resueltos siguen provocando un fallo de inicio o el rechazo de la actualización.

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Entorno: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Región de Azure Speech (p. ej., `eastus`). Entorno: `AZURE_SPEECH_REGION` o `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Sustitución opcional del endpoint de Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName de la voz de Azure. Valor predeterminado: `en-US-JennyNeural`. Alias heredado: `voice`.</ParamField>
    <ParamField path="lang" type="string">Código de idioma SSML. Valor predeterminado: `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` de Azure para audio estándar. Valor predeterminado: `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` de Azure para la salida de notas de voz. Valor predeterminado: `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Utiliza `ELEVENLABS_API_KEY` o `XI_API_KEY` como alternativa.</ParamField>
    <ParamField path="model" type="string">Id. del modelo. Valor predeterminado: `eleven_multilingual_v2`. Los id. heredados `eleven_turbo_v2_5`/`eleven_turbo_v2` se normalizan al modelo `flash` correspondiente.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Id. de voz de ElevenLabs. Valor predeterminado: `pMsXgVXv3BLzUgSXRplE`. Alias heredado: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (cada uno `0..1`, valores predeterminados `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, valor predeterminado `true`), `speed` (`0.5..2.0`, valor predeterminado `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modo de normalización de texto.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 de 2 letras (p. ej., `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Entero `0..4294967295` para obtener determinismo en la medida de lo posible.</ParamField>
    <ParamField path="baseUrl" type="string">Sustituye la URL base de la API de ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Utiliza como alternativa `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Si se omite, TTS puede reutilizar `models.providers.google.apiKey` antes de recurrir a las variables de entorno.</ParamField>
    <ParamField path="model" type="string">Modelo TTS de Gemini. Valor predeterminado: `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nombre de voz predefinida de Gemini. Valor predeterminado: `Kore`. Alias heredados: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Indicación de estilo en lenguaje natural que se antepone al texto hablado.</ParamField>
    <ParamField path="speakerName" type="string">Etiqueta opcional del hablante que se antepone al texto hablado cuando la indicación utiliza un hablante con nombre.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Establézcalo en `audio-profile-v1` para envolver los campos activos de indicación de persona en una estructura determinista de indicación TTS de Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Texto adicional de indicación de persona específico de Google que se añade a las notas del director de la plantilla.</ParamField>
    <ParamField path="baseUrl" type="string">Solo se acepta `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Entorno: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">URL HTTPS de la API de Gradium en `api.gradium.ai`. Valor predeterminado: `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valor predeterminado: Emma (`YTpq7expH9539ERJ`). Alias heredado: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld principal

    <ParamField path="apiKey" type="string">Entorno: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Valor predeterminado: `inworld-tts-1.5-max`. También: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valor predeterminado: `Sarah`. Alias heredado: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura de muestreo `0..2` (0 excluido).</ParamField>

  </Accordion>

  <Accordion title="CLI local (tts-local-cli)">
    <ParamField path="command" type="string">Ejecutable local o cadena de comando para TTS mediante CLI.</ParamField>
    <ParamField path="args" type="string[]">Argumentos del comando. Admite los marcadores de posición `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato de salida esperado de la CLI. Valor predeterminado: `mp3` para archivos de audio adjuntos.</ParamField>
    <ParamField path="timeoutMs" type="number">Tiempo de espera del comando en milisegundos. Valor predeterminado: `120000`.</ParamField>
    <ParamField path="cwd" type="string">Directorio de trabajo opcional del comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Sustituciones opcionales de variables de entorno para el comando.</ParamField>

    La salida estándar del comando y el audio generado o convertido están limitados a 50 MiB. La salida estándar de error de diagnóstico está limitada a 1 MiB. OpenClaw finaliza el comando y la síntesis falla cuando se supera cualquiera de los límites.

  </Accordion>

  <Accordion title="Microsoft (sin clave de API)">
    <ParamField path="enabled" type="boolean" default="true">Permite usar la síntesis de voz de Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nombre de voz neuronal de Microsoft (p. ej., `en-US-MichelleNeural`). Alias heredado: `voice`. Si está activa la voz inglesa predeterminada y el texto de respuesta contiene predominantemente caracteres CJK, OpenClaw cambia automáticamente a `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Código de idioma (p. ej., `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato de salida de Microsoft. Valor predeterminado: `audio-24khz-48kbitrate-mono-mp3`. El transporte incluido basado en Edge no admite todos los formatos.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Cadenas de porcentaje (p. ej., `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Escribe subtítulos JSON junto al archivo de audio.</ParamField>
    <ParamField path="proxy" type="string">URL del proxy para las solicitudes de síntesis de voz de Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Sustitución del tiempo de espera de la solicitud (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias heredado. Ejecute `openclaw doctor --fix` para reescribir la configuración persistente como `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Utiliza como alternativa `MINIMAX_API_KEY`. Autenticación de Token Plan mediante `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://api.minimax.io`. Entorno: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Valor predeterminado: `speech-2.8-hd`. Entorno: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valor predeterminado: `English_expressive_narrator`. Entorno: `MINIMAX_TTS_VOICE_ID`. Alias heredado: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Valor predeterminado: `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Valor predeterminado: `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Entero `-12..12`. Valor predeterminado: `0`. Los valores fraccionarios se truncan antes de la solicitud.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Utiliza como alternativa `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Id. del modelo TTS de OpenAI. Valor predeterminado: `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nombre de la voz (p. ej., `alloy`, `cedar`). Valor predeterminado: `coral`. Alias heredado: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Campo explícito `instructions` de OpenAI. Cuando se establece, los campos de indicación de persona **no** se asignan automáticamente.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Campos JSON adicionales que se combinan en los cuerpos de solicitud `/audio/speech` después de los campos TTS de OpenAI generados. Se utiliza para endpoints compatibles con OpenAI, como Kokoro, que requieren claves específicas del proveedor, como `lang`; se ignoran las claves de prototipo no seguras.</ParamField>
    <ParamField path="baseUrl" type="string">
      Sustituye el endpoint TTS de OpenAI. Orden de resolución: configuración → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Los valores no predeterminados se tratan como endpoints TTS compatibles con OpenAI, por lo que se aceptan nombres personalizados de modelos y voces, y `speed` deja de tener la comprobación de intervalo `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Entorno: `OPENROUTER_API_KEY`. Puede reutilizar `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://openrouter.ai/api/v1`. El valor heredado `https://openrouter.ai/v1` se normaliza.</ParamField>
    <ParamField path="model" type="string">Valor predeterminado: `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Valor predeterminado: `af_alloy`. Alias heredados: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Valor predeterminado: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sustitución de velocidad nativa del proveedor.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Entorno: `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Valor predeterminado: `seed-tts-1.0`. Entorno: `VOLCENGINE_TTS_RESOURCE_ID`. Utilice `seed-tts-2.0` cuando el proyecto tenga acceso a TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Cabecera de clave de aplicación. Valor predeterminado: `aGjiRDfUWi`. Entorno: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Sustituye el endpoint HTTP de TTS de Seed Speech. Entorno: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Tipo de voz. Valor predeterminado: `en_female_anna_mars_bigtts`. Entorno: `VOLCENGINE_TTS_VOICE`. Alias heredado: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Proporción de velocidad nativa del proveedor, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Etiqueta de emoción nativa del proveedor.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campos heredados de Volcengine Speech Console. Entorno: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (valor predeterminado: `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Entorno: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://api.x.ai/v1`. Entorno: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valor predeterminado: `eve`. Con autenticación, `openclaw infer tts voices --provider xai` obtiene el catálogo integrado actual; sin autenticación, enumera las alternativas sin conexión `ara`, `eve`, `leo`, `rex` y `sal`. Los id. de voces personalizadas de la cuenta se reenvían aunque no aparezcan en la lista integrada. Alias heredado: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Código de idioma BCP-47 o `auto`. Valor predeterminado: `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Valor predeterminado: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sustitución de velocidad nativa del proveedor, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Entorno: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://api.xiaomimimo.com/v1`. Entorno: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Valor predeterminado: `mimo-v2.5-tts`. Entorno: `XIAOMI_TTS_MODEL`. También admite `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Valor predeterminado: `mimo_default` para modelos con voces preestablecidas. Entorno: `XIAOMI_TTS_VOICE`. Alias heredado: `voice`. No se envía para `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Valor predeterminado: `mp3`. Entorno: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instrucción de estilo opcional en lenguaje natural que se envía como mensaje del usuario; no se pronuncia. Para `mimo-v2.5-tts-voicedesign`, esta es la indicación de diseño de voz; OpenClaw proporciona un valor predeterminado cuando se omite.</ParamField>
  </Accordion>
</AccordionGroup>

## Herramienta del agente

La herramienta `tts` convierte texto en voz y devuelve un archivo de audio adjunto para
entregar la respuesta. En Feishu, Matrix, Telegram y WhatsApp, el audio se
entrega como mensaje de voz en lugar de como archivo adjunto. Feishu y
WhatsApp pueden transcodificar en esta ruta la salida TTS que no sea Opus cuando
`ffmpeg` está disponible.

WhatsApp envía el audio mediante Baileys como nota de voz PTT (`audio` con
`ptt: true`) y envía el texto visible **por separado** del audio PTT porque
los clientes no muestran de forma coherente los subtítulos en las notas de voz.

La herramienta acepta los campos opcionales `channel` y `timeoutMs`; `timeoutMs` es un
tiempo de espera por llamada para solicitudes al proveedor, en milisegundos. Los valores por llamada sustituyen
`tts.timeoutMs`; los tiempos de espera de TTS configurados sustituyen cualquier valor predeterminado
del proveedor definido por el plugin.

## RPC del Gateway

| Método            | Propósito                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | Leer el estado actual de TTS y el último intento.     |
| `tts.enable`      | Establecer la preferencia automática local en `always`.       |
| `tts.disable`     | Establecer la preferencia automática local en `off`.          |
| `tts.convert`     | Conversión puntual de texto → audio.                        |
| `tts.setProvider` | Establecer la preferencia de proveedor local.               |
| `tts.personas`    | Enumerar las personas configuradas y la activa. |
| `tts.setPersona`  | Establecer la preferencia de persona local.                |
| `tts.providers`   | Enumerar los proveedores configurados y su estado.        |

## Enlaces de servicios

- [Guía de conversión de texto a voz de OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referencia de la API de audio de OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Conversión de texto a voz mediante REST de Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Proveedor de Azure Speech](/es/providers/azure-speech)
- [Conversión de texto a voz de ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticación de ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/es/providers/gradium)
- [API de TTS de Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP de TTS de Volcengine](/es/providers/volcengine#text-to-speech)
- [Síntesis de voz de Xiaomi MiMo](/es/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de salida de voz de Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Conversión de texto a voz de xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Temas relacionados

- [Descripción general de medios](/es/tools/media-overview)
- [Generación de música](/es/tools/music-generation)
- [Generación de vídeo](/es/tools/video-generation)
- [Comandos de barra diagonal](/es/tools/slash-commands)
- [Plugin de llamadas de voz](/es/plugins/voice-call)
