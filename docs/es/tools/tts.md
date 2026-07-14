---
read_when:
    - Activación de la conversión de texto a voz para las respuestas
    - Configuración de un proveedor de TTS, una cadena de reserva o una personalidad
    - Uso de comandos o directivas /tts
sidebarTitle: Text to speech (TTS)
summary: 'Texto a voz para respuestas salientes: proveedores, personas, comandos con barra diagonal y salida por canal'
title: Texto a voz
x-i18n:
    generated_at: "2026-07-14T14:12:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw convierte las respuestas salientes en audio mediante **14 proveedores de voz**:
mensajes de voz nativos en Feishu, Matrix, Telegram y WhatsApp; archivos adjuntos de
audio en los demás servicios; y transmisiones PCM/Ulaw para telefonía y Talk.

TTS es la parte de salida de voz del modo `stt-tts` de Talk (`talk.speak` utiliza esta
misma ruta de síntesis). En cambio, las sesiones de Talk `realtime` nativas del proveedor sintetizan
la voz dentro del proveedor en tiempo real; las sesiones `transcription` nunca
sintetizan una respuesta de voz del asistente.

## Inicio rápido

<Steps>
  <Step title="Elegir un proveedor">
    OpenAI y ElevenLabs son las opciones alojadas más fiables. Microsoft y la
    CLI local funcionan sin una clave de API. Consulte la [matriz de proveedores](#supported-providers)
    para ver la lista completa.
  </Step>
  <Step title="Configurar la clave de API">
    Exporte la variable de entorno de su proveedor (por ejemplo, `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft y la CLI local no necesitan ninguna clave.
  </Step>
  <Step title="Habilitarlo en la configuración">
    Configure `messages.tts.auto: "always"` y `messages.tts.provider`:

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
  <Step title="Probarlo en el chat">
    `/tts status` muestra el estado actual. `/tts audio Hello from OpenClaw`
    envía una respuesta de audio puntual.
  </Step>
</Steps>

<Note>
El TTS automático está **desactivado** de forma predeterminada. Cuando `messages.tts.provider` no está definido,
OpenClaw elige el primer proveedor configurado según el orden de selección automática del registro.
La herramienta de agente integrada `tts` solo responde a intenciones explícitas: el chat normal permanece
en texto, salvo que el usuario solicite audio, utilice `/tts` o habilite el TTS automático o la voz
mediante directivas.
</Note>

## Proveedores compatibles

| Proveedor         | Autenticación                                                                                                    | Notas                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (también `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)       | Salida nativa de notas de voz Ogg/Opus y telefonía.                                         |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                               | TTS compatible con OpenAI. El valor predeterminado es `hexgrad/Kokoro-82M`.                  |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` o `XI_API_KEY`                                                                          | Clonación de voz, multilingüe, determinista mediante `seed`; transmisión para reproducir voz en Discord. |
| **Google Gemini** | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                                                                          | TTS por lotes de la API de Gemini; admite personalidades mediante `promptTemplate: "audio-profile-v1"`.       |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                               | Salida de notas de voz y telefonía.                                                         |
| **Inworld**       | `INWORLD_API_KEY`                                                                                               | API de TTS en streaming. Notas de voz Opus nativas y telefonía PCM.                         |
| **CLI local**     | ninguna                                                                                                          | Ejecuta un comando TTS local configurado.                                                   |
| **Microsoft**     | ninguna                                                                                                          | TTS neuronal público de Edge mediante `node-edge-tts`. Sin garantías ni SLA.            |
| **MiniMax**       | `MINIMAX_API_KEY` (o plan de tokens: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)                 | API T2A v2. El valor predeterminado es `speech-2.8-hd`.                                  |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                               | También se utiliza para el resumen automático; admite personalidades mediante `instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (puede reutilizar `models.providers.openrouter.apiKey`)                                                         | Modelo predeterminado: `hexgrad/kokoro-82m`.                                                  |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token heredados: `VOLCENGINE_TTS_APPID`/`_TOKEN`)            | API HTTP de BytePlus Seed Speech.                                                           |
| **Vydra**         | `VYDRA_API_KEY`                                                                                               | Proveedor compartido de imágenes, vídeo y voz.                                              |
| **xAI**           | `XAI_API_KEY`                                                                                               | TTS por lotes de xAI. Las notas de voz Opus nativas **no** son compatibles.                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                               | TTS de MiMo mediante finalizaciones de chat de Xiaomi.                                      |

Si se configuran varios proveedores, se utiliza primero el seleccionado y los
demás sirven como opciones alternativas. El resumen automático utiliza `summaryModel` (o
`agents.defaults.model.primary`), por lo que ese proveedor también debe estar autenticado
si se mantienen habilitados los resúmenes.

<Warning>
El proveedor **Microsoft** incluido utiliza el servicio de TTS neuronal en línea
de Microsoft Edge mediante `node-edge-tts`. Es un servicio web público sin
SLA ni cuota publicados, por lo que debe considerarse un servicio sin garantías. El id de proveedor heredado `edge` se
normaliza como `microsoft` y `openclaw doctor --fix` reescribe la configuración
persistida; las configuraciones nuevas siempre deben utilizar `microsoft`.
</Warning>

## Configuración

La configuración de TTS se encuentra en `messages.tts`, dentro de `~/.openclaw/openclaw.json`. Elija un
preajuste y adapte el bloque del proveedor. Los campos `speakerVoice`/`speakerVoiceId`
que aparecen a continuación son los canónicos; los nombres de campo `voice`/`voiceId`/
`voiceName` propios de cada proveedor siguen funcionando como alias heredados.

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
          // Indicaciones opcionales de estilo en lenguaje natural:
          // audioProfile: "Habla con un tono sereno de presentador de pódcast.",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="CLI local">
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
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Para Xiaomi `mimo-v2.5-tts-voicedesign`, omita `speakerVoice` y establezca `style` en
la indicación de diseño de voz. OpenClaw envía esa indicación como mensaje `user` de TTS
y no envía `audio.voice` para el modelo de diseño de voz.

### Sustituciones de voz por agente

Use `agents.list[].tts` cuando un agente deba hablar con un proveedor, una voz, un modelo, una persona o un modo de TTS automático diferentes. El bloque del agente se combina en profundidad sobre `messages.tts`, por lo que las credenciales del proveedor pueden permanecer en la configuración global del proveedor:

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Para fijar una persona por agente, establezca `agents.list[].tts.persona` junto con la configuración del proveedor; esta sustituye el valor global de `messages.tts.persona` solo para ese agente.

Orden de precedencia para las respuestas automáticas, `/tts audio`, `/tts status` y la herramienta de agente `tts`:

1. `messages.tts`
2. `agents.list[].tts` activo
3. sustitución del canal, cuando el canal admite `channels.<channel>.tts`
4. sustitución de la cuenta, cuando el canal transmite `channels.<channel>.accounts.<id>.tts`
5. preferencias locales de `/tts` para este host
6. directivas `[[tts:...]]` insertadas cuando las [sustituciones controladas por el modelo](#model-driven-directives) están habilitadas

Las sustituciones de canal y cuenta usan la misma estructura que `messages.tts` y se combinan en profundidad sobre las capas anteriores, por lo que las credenciales compartidas del proveedor pueden permanecer en `messages.tts`, mientras un canal o una cuenta de bot cambia únicamente la voz del hablante, el modelo, la persona o el modo automático:

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

Una **persona** es una identidad oral estable que puede aplicarse de forma determinista entre proveedores. Puede dar preferencia a un proveedor, definir una intención de instrucción independiente del proveedor y contener vinculaciones específicas del proveedor para voces, modelos, plantillas de instrucciones, semillas y ajustes de voz.

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
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### Persona completa (instrucción independiente del proveedor)

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
  },
}
```

### Resolución de la persona

La persona activa se selecciona de forma determinista:

1. Preferencia local de `/tts persona <id>`, si está establecida.
2. `messages.tts.persona`, si está establecida.
3. Sin persona.

La selección del proveedor prioriza los valores explícitos:

1. Sustituciones directas (CLI, Gateway, Talk y directivas TTS permitidas).
2. Preferencia local de `/tts provider <id>`.
3. `provider` de la persona activa.
4. `messages.tts.provider`.
5. Selección automática del registro.

Para cada intento de proveedor, OpenClaw combina las configuraciones en este orden:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Sustituciones de solicitudes de confianza
4. Sustituciones permitidas de directivas TTS emitidas por el modelo

### Cómo usan los proveedores las instrucciones de persona

Los campos de instrucciones de persona (`profile`, `scene`, `sampleContext`, `style`, `accent`, `pacing`, `constraints`) son **independientes del proveedor**. Cada proveedor decide cómo usarlos:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Envuelve los campos de instrucciones de persona en una estructura de instrucciones TTS de Gemini **solo cuando** la configuración efectiva del proveedor de Google establece `promptTemplate: "audio-profile-v1"` o `personaPrompt`. Los campos antiguos `audioProfile` y `speakerName` se siguen anteponiendo como texto de instrucciones específico de Google. Las etiquetas de audio insertadas, como `[whispers]` o `[laughs]`, dentro de un bloque `[[tts:text]]` se conservan en la transcripción de Gemini; OpenClaw no genera estas etiquetas.
  </Accordion>
  <Accordion title="OpenAI">
    Asigna los campos de instrucciones de persona al campo `instructions` de la solicitud **solo cuando** no se configura ningún `instructions` explícito de OpenAI. Un `instructions` explícito siempre tiene prioridad.
  </Accordion>
  <Accordion title="Otros proveedores">
    Usan únicamente las vinculaciones de persona específicas del proveedor incluidas en `personas.<id>.providers.<provider>`. Los campos de instrucciones de persona se ignoran, salvo que el proveedor implemente su propia asignación de instrucciones de persona.
  </Accordion>
</AccordionGroup>

### Política de respaldo

`fallbackPolicy` controla el comportamiento cuando una persona **no tiene ninguna vinculación** para el proveedor que se intenta usar:

| Política              | Comportamiento                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Valor predeterminado.** Los campos de instrucciones independientes del proveedor siguen disponibles; el proveedor puede usarlos o ignorarlos.                                            |
| `provider-defaults` | La persona se omite de la preparación de instrucciones para ese intento; el proveedor usa sus valores predeterminados neutros mientras continúa el respaldo con otros proveedores. |
| `fail`              | Omite ese intento de proveedor con `reasonCode: "not_configured"` y `personaBinding: "missing"`. Se siguen intentando los proveedores de respaldo.              |

La solicitud TTS completa solo falla cuando **todos** los proveedores intentados se omiten o fallan.

La selección del proveedor de una sesión de Talk se limita a la sesión. Un cliente de Talk debe elegir los identificadores de proveedor, modelo y voz, así como las configuraciones regionales, desde `talk.catalog` y transmitirlos mediante la solicitud de sesión o transferencia de Talk. Abrir una sesión de voz no debe modificar `messages.tts` ni los valores predeterminados globales del proveedor de Talk.

## Directivas controladas por el modelo

De forma predeterminada, el asistente **puede** emitir directivas `[[tts:...]]` para sustituir la voz, el modelo o la velocidad en una sola respuesta, además de un bloque opcional `[[tts:text]]...[[/tts:text]]` para indicaciones expresivas que solo deben aparecer en el audio:

```text
Aquí está.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](se ríe) Lee la canción una vez más.[[/tts:text]]
```

Cuando `messages.tts.auto` es `"tagged"`, las **directivas son obligatorias** para activar el audio. La entrega de bloques por streaming elimina las directivas del texto visible antes de que el canal las reciba, incluso cuando están divididas entre bloques adyacentes.

`provider=...` se ignora salvo que `modelOverrides.allowProvider: true`. Cuando una respuesta declara `provider=...`, las demás claves de esa directiva solo las analiza ese proveedor; las claves no compatibles se eliminan y se notifican como advertencias de directivas TTS.

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

**Deshabilitar por completo las sustituciones del modelo:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Permitir el cambio de proveedor y mantener configurables los demás controles:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandos con barra

Comando único `/tts`. En Discord, OpenClaw también registra `/voice` porque `/tts` es un comando integrado de Discord; el texto `/tts ...` sigue funcionando.

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
Los comandos requieren un remitente autorizado (se aplican las reglas de lista de permitidos o de propietario) y debe estar habilitado `commands.text` o el registro de comandos nativos.
</Note>

Notas de comportamiento:

- `/tts on` escribe la preferencia local de TTS en `always`; `/tts off` la escribe en `off`.
- `/tts chat on|off|default` escribe una sustitución de TTS automático limitada a la sesión para el chat actual.
- `/tts persona <id>` escribe la preferencia local de persona; `/tts persona off` la borra.
- `/tts latest` lee la respuesta más reciente del asistente de la transcripción de la sesión actual y la envía una vez como audio. Solo almacena un hash de esa respuesta en la entrada de la sesión para impedir envíos de voz duplicados.
- `/tts audio` genera una respuesta de audio puntual (**no** activa TTS).
- `/tts limit <chars>` acepta **100–4096** (4096 es el máximo de caracteres para mensajes o pies de foto de Telegram); los valores fuera de ese intervalo se rechazan.
- `limit` y `summary` se almacenan en las **preferencias locales**, no en la configuración principal.
- `/tts status` incluye diagnósticos de respaldo del intento más reciente: `Fallback: <primary> -> <used>`, `Attempts: ...` y detalles de cada intento (`provider:outcome(reasonCode) latency`).
- `/status` muestra el modo TTS activo, además del proveedor, el modelo, la voz y los metadatos saneados del endpoint personalizado configurados cuando TTS está habilitado.

## Preferencias por usuario

Los comandos con barra escriben sustituciones locales en `prefsPath`. El valor predeterminado es `~/.openclaw/settings/tts.json`; puede sustituirse con la variable de entorno `OPENCLAW_TTS_PREFS` o `messages.tts.prefsPath`.

| Campo almacenado | Efecto                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | Anulación local de TTS automático (`always`, `off`, …)                                     |
| `provider`   | Anulación local del proveedor principal                                                  |
| `persona`    | Anulación local de la personalidad                                                           |
| `maxLength`  | Umbral de resumen/truncamiento (valor predeterminado: `1500` caracteres; intervalo de `/tts limit`: 100–4096) |
| `summarize`  | Conmutador de resumen (valor predeterminado: `true`)                                                  |

Estos valores anulan la configuración efectiva de `messages.tts` junto con el bloque
`agents.list[].tts` activo para ese host.

## Formatos de salida

La entrega de voz mediante TTS depende de las capacidades del canal. Los plugins de canal anuncian
si el TTS de tipo voz debe solicitar a los proveedores un destino `voice-note` nativo o
mantener la síntesis `audio-file` normal, y si el canal transcodifica
la salida no nativa antes de enviarla.

| Destino                                | Formato                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Las respuestas en forma de nota de voz prefieren **Opus** (`opus_48000_64` de ElevenLabs, `opus` de OpenAI). 48 kHz / 64 kbps ofrece un equilibrio entre claridad y tamaño. |
| Otros canales                        | **MP3** (`mp3_44100_128` de ElevenLabs, `mp3` de OpenAI). 44.1 kHz / 128 kbps es el equilibrio predeterminado para la voz.                  |
| Conversación / telefonía                      | **PCM** nativo del proveedor (Inworld 22050 Hz, Google 24 kHz), o `ulaw_8000` de Gradium para telefonía.                                 |

Notas por proveedor:

- **Transcodificación de Feishu / WhatsApp:** cuando una respuesta en forma de nota de voz llega como MP3/WebM/WAV/M4A u otro archivo que probablemente sea de audio, el plugin de canal la transcodifica a Ogg/Opus de 48 kHz con `ffmpeg` (`libopus`, 64 kbps) antes de enviar el mensaje de voz nativo. WhatsApp envía el resultado mediante la carga útil `audio` de Baileys con `ptt: true` y `audio/ogg; codecs=opus`. Si falla la transcodificación, Feishu detecta el error y recurre al envío del archivo original como un archivo adjunto normal; WhatsApp no dispone de alternativa, por lo que el propio envío falla en lugar de publicar una carga útil PTT incompatible.
- **MiniMax:** MP3 (modelo `speech-2.8-hd`, frecuencia de muestreo de 32 kHz) para archivos adjuntos de audio normales; se transcodifica a Opus de 48 kHz con `ffmpeg` para destinos de notas de voz anunciados por el canal.
- **Xiaomi MiMo:** MP3 de forma predeterminada, o WAV cuando está configurado; se transcodifica a Opus de 48 kHz con `ffmpeg` para destinos de notas de voz anunciados por el canal.
- **CLI local:** utiliza el valor `outputFormat` configurado. Los destinos de notas de voz se convierten a Ogg/Opus y la salida de telefonía se convierte a PCM mono sin procesar de 16 kHz con `ffmpeg`.
- **Google Gemini:** devuelve PCM sin procesar de 24 kHz. OpenClaw lo encapsula como WAV para archivos adjuntos de audio, lo transcodifica a Opus de 48 kHz para destinos de notas de voz y devuelve PCM directamente para Conversación/telefonía.
- **Gradium:** WAV para archivos adjuntos de audio, Opus para destinos de notas de voz y `ulaw_8000` a 8 kHz para telefonía.
- **Inworld:** MP3 para archivos adjuntos de audio normales, `OGG_OPUS` nativo para destinos de notas de voz y `PCM` sin procesar a 22050 Hz para Conversación/telefonía.
- **xAI:** MP3 de forma predeterminada; la síntesis de archivos de audio puede utilizar `mp3`, `wav`, `pcm`, `mulaw` o `alaw` tanto para la salida almacenada en búfer como para la salida en streaming. Los destinos de notas de voz utilizan MP3 para el streaming y la alternativa almacenada en búfer porque las salidas `pcm`, `mulaw` y `alaw` de xAI son audio sin procesar y sin encabezado. La síntesis almacenada en búfer utiliza el endpoint REST por lotes `/v1/tts` de xAI; `textToSpeechStream` utiliza `wss://api.x.ai/v1/tts` nativo. Este no es el contrato de voz en tiempo real. No se admite el formato de nota de voz Opus nativo.
- **Microsoft:** utiliza `microsoft.outputFormat` (valor predeterminado: `audio-24khz-48kbitrate-mono-mp3`).
  - El transporte incluido acepta un valor `outputFormat`, pero el servicio no ofrece todos los formatos.
  - Los valores del formato de salida siguen los formatos de salida de Microsoft Speech (incluidos Ogg/WebM Opus).
  - El valor `sendVoice` de Telegram acepta OGG/MP3/M4A; utilice OpenAI/ElevenLabs si necesita garantizar mensajes de voz Opus.
  - Si falla el formato de salida de Microsoft configurado, OpenClaw vuelve a intentarlo con MP3.
  - Cuando no se establece una anulación explícita de la voz y se utiliza la voz predeterminada en inglés, OpenClaw cambia automáticamente a una voz neuronal en chino (`zh-CN-XiaoxiaoNeural`, configuración regional `zh-CN`) si el texto de la respuesta es predominantemente CJK.

Los formatos de salida de OpenAI y ElevenLabs son fijos para cada canal, tal como se indica anteriormente.

## Comportamiento de TTS automático

Cuando `messages.tts.auto` está habilitado, OpenClaw:

- Omite TTS si la respuesta ya contiene contenido multimedia estructurado.
- Omite las respuestas muy cortas (menos de 10 caracteres).
- Resume las respuestas largas cuando los resúmenes están habilitados, mediante
  `summaryModel` (o `agents.defaults.model.primary`).
- Adjunta el audio generado a la respuesta.
- En `mode: "final"`, sigue enviando TTS de solo audio para las respuestas finales transmitidas
  después de que finaliza la transmisión de texto; el contenido multimedia generado pasa por la misma
  normalización de contenido multimedia del canal que los archivos adjuntos normales de las respuestas.

Si la respuesta supera `maxLength`, OpenClaw nunca omite el audio por completo:

- **Resumen activado** (valor predeterminado) y hay un modelo de resumen disponible: resume el
  texto a aproximadamente `maxLength` caracteres y, a continuación, sintetiza el resumen.
- **Resumen desactivado**, el resumen falla o no hay ninguna clave de API disponible para el
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
  <Accordion title="messages.tts.* de nivel superior">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modo de TTS automático. `inbound` solo envía audio después de un mensaje de voz entrante; `tagged` solo envía audio cuando la respuesta incluye directivas `[[tts:...]]` o un bloque `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Opción heredada. `openclaw doctor --fix` la migra a `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` incluye las respuestas de herramientas y bloques además de las respuestas finales.
    </ParamField>
    <ParamField path="provider" type="string">
      Identificador del proveedor de voz. Si no se establece, OpenClaw utiliza el primer proveedor configurado según el orden de selección automática del registro. `provider: "edge"` heredado se reescribe como `"microsoft"` mediante `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Identificador de la persona activa de `personas`. Se normaliza a minúsculas.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identidad de voz estable. Campos: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Consulte [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modelo económico para el resumen automático; el valor predeterminado es `agents.defaults.model.primary`. Acepta `provider/model` o un alias de modelo configurado.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Permite que el modelo emita directivas TTS. El valor predeterminado de `enabled` es `true`; el de `allowProvider` es `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Ajustes controlados por el proveedor, indexados por el identificador del proveedor de voz. `openclaw doctor --fix` reescribe los bloques directos heredados (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`); confirme únicamente `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Límite estricto de caracteres de entrada para TTS. `/tts audio`, `tts.convert` y `tts.speak` fallan si se supera.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Tiempo de espera de la solicitud en milisegundos. Si se establece un `timeoutMs` por llamada (herramienta del agente, Gateway), este tiene prioridad; de lo contrario, un `messages.tts.timeoutMs` configurado explícitamente tiene prioridad sobre cualquier valor predeterminado del proveedor definido por el Plugin.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Sustituye la ruta local del archivo JSON de preferencias (proveedor/límite/resumen). Valor predeterminado: `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Variable de entorno: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Región de Azure Speech (p. ej., `eastus`). Variable de entorno: `AZURE_SPEECH_REGION` o `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Sustitución opcional del punto de conexión de Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName de la voz de Azure. Valor predeterminado: `en-US-JennyNeural`. Alias heredado: `voice`.</ParamField>
    <ParamField path="lang" type="string">Código de idioma SSML. Valor predeterminado: `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` de Azure para audio estándar. Valor predeterminado: `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` de Azure para la salida de notas de voz. Valor predeterminado: `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Utiliza `ELEVENLABS_API_KEY` o `XI_API_KEY` como alternativa.</ParamField>
    <ParamField path="model" type="string">Identificador del modelo. Valor predeterminado: `eleven_multilingual_v2`. Los identificadores heredados `eleven_turbo_v2_5`/`eleven_turbo_v2` se normalizan al modelo `flash` correspondiente.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Identificador de voz de ElevenLabs. Valor predeterminado: `pMsXgVXv3BLzUgSXRplE`. Alias heredado: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (cada uno `0..1`, valores predeterminados `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, valor predeterminado `true`), `speed` (`0.5..2.0`, valor predeterminado `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modo de normalización de texto.</ParamField>
    <ParamField path="languageCode" type="string">Código ISO 639-1 de 2 letras (p. ej., `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Entero `0..4294967295` para obtener determinismo en la medida de lo posible.</ParamField>
    <ParamField path="baseUrl" type="string">Sustituye la URL base de la API de ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Recurre a `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Si se omite, TTS puede reutilizar `models.providers.google.apiKey` antes de recurrir a la variable de entorno.</ParamField>
    <ParamField path="model" type="string">Modelo TTS de Gemini. Valor predeterminado: `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nombre de voz predefinida de Gemini. Valor predeterminado: `Kore`. Alias heredados: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Instrucción de estilo en lenguaje natural que se antepone al texto hablado.</ParamField>
    <ParamField path="speakerName" type="string">Etiqueta opcional del hablante que se antepone al texto hablado cuando la instrucción utiliza un hablante con nombre.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Establézcalo en `audio-profile-v1` para envolver los campos de instrucción de la personalidad activa en una estructura determinista de instrucciones TTS de Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Texto adicional de instrucciones de personalidad específico de Google que se añade a las notas del director de la plantilla.</ParamField>
    <ParamField path="baseUrl" type="string">Solo se acepta `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Variable de entorno: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">URL HTTPS de la API de Gradium en `api.gradium.ai`. Valor predeterminado: `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valor predeterminado: Emma (`YTpq7expH9539ERJ`). Alias heredado: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Proveedor principal Inworld

    <ParamField path="apiKey" type="string">Variable de entorno: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Valor predeterminado: `inworld-tts-1.5-max`. También: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valor predeterminado: `Sarah`. Alias heredado: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura de muestreo `0..2` (sin incluir 0).</ParamField>

  </Accordion>

  <Accordion title="CLI local (tts-local-cli)">
    <ParamField path="command" type="string">Ejecutable local o cadena de comando para TTS mediante CLI.</ParamField>
    <ParamField path="args" type="string[]">Argumentos del comando. Admite los marcadores de posición `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato de salida esperado de la CLI. Valor predeterminado: `mp3` para archivos de audio adjuntos.</ParamField>
    <ParamField path="timeoutMs" type="number">Tiempo de espera del comando en milisegundos. Valor predeterminado: `120000`.</ParamField>
    <ParamField path="cwd" type="string">Directorio de trabajo opcional del comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Valores opcionales que sobrescriben las variables de entorno del comando.</ParamField>

    La salida estándar del comando y el audio generado o convertido están limitados a 50 MiB. La salida de error de diagnóstico está limitada a 1 MiB. OpenClaw finaliza el comando y la síntesis falla cuando se supera cualquiera de los límites.

  </Accordion>

  <Accordion title="Microsoft (sin clave de API)">
    <ParamField path="enabled" type="boolean" default="true">Permite utilizar la síntesis de voz de Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nombre de la voz neuronal de Microsoft (p. ej., `en-US-MichelleNeural`). Alias heredado: `voice`. Si está activa la voz inglesa predeterminada y el texto de la respuesta contiene principalmente caracteres CJK, OpenClaw cambia automáticamente a `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Código de idioma (p. ej., `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato de salida de Microsoft. Valor predeterminado: `audio-24khz-48kbitrate-mono-mp3`. El transporte incluido basado en Edge no admite todos los formatos.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Cadenas de porcentajes (p. ej., `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Escribe subtítulos JSON junto al archivo de audio.</ParamField>
    <ParamField path="proxy" type="string">URL del proxy para las solicitudes de síntesis de voz de Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Valor que sobrescribe el tiempo de espera de la solicitud (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias heredado. Ejecute `openclaw doctor --fix` para reescribir la configuración persistente como `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Recurre a `MINIMAX_API_KEY`. Autenticación de Token Plan mediante `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://api.minimax.io`. Variable de entorno: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Valor predeterminado: `speech-2.8-hd`. Variable de entorno: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valor predeterminado: `English_expressive_narrator`. Variable de entorno: `MINIMAX_TTS_VOICE_ID`. Alias heredado: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Valor predeterminado: `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Valor predeterminado: `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Entero `-12..12`. Valor predeterminado: `0`. Los valores fraccionarios se truncan antes de la solicitud.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Recurre a `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identificador del modelo TTS de OpenAI. Valor predeterminado: `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nombre de la voz (p. ej., `alloy`, `cedar`). Valor predeterminado: `coral`. Alias heredado: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Campo `instructions` explícito de OpenAI. Cuando se establece, los campos de instrucciones de personalidad **no** se asignan automáticamente.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Campos JSON adicionales que se fusionan en los cuerpos de solicitud `/audio/speech` después de los campos TTS de OpenAI generados. Utilícelo para puntos de conexión compatibles con OpenAI, como Kokoro, que requieren claves específicas del proveedor como `lang`; se ignoran las claves de prototipo no seguras.</ParamField>
    <ParamField path="baseUrl" type="string">
      Sobrescribe el punto de conexión TTS de OpenAI. Orden de resolución: configuración → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Los valores no predeterminados se consideran puntos de conexión TTS compatibles con OpenAI, por lo que se aceptan nombres personalizados de modelos y voces, y `speed` pierde su comprobación del intervalo `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Variable de entorno: `OPENROUTER_API_KEY`. Puede reutilizar `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://openrouter.ai/api/v1`. El valor heredado `https://openrouter.ai/v1` se normaliza.</ParamField>
    <ParamField path="model" type="string">Valor predeterminado: `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Valor predeterminado: `af_alloy`. Alias heredados: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Valor predeterminado: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Valor que sobrescribe la velocidad nativa del proveedor.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Variable de entorno: `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Valor predeterminado: `seed-tts-1.0`. Variable de entorno: `VOLCENGINE_TTS_RESOURCE_ID`. Utilice `seed-tts-2.0` cuando el proyecto tenga habilitado TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Encabezado de clave de aplicación. Valor predeterminado: `aGjiRDfUWi`. Variable de entorno: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Sobrescribe el punto de conexión HTTP de TTS de Seed Speech. Variable de entorno: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Tipo de voz. Valor predeterminado: `en_female_anna_mars_bigtts`. Variable de entorno: `VOLCENGINE_TTS_VOICE`. Alias heredado: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Proporción de velocidad nativa del proveedor, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Etiqueta de emoción nativa del proveedor.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campos heredados de Volcengine Speech Console. Variables de entorno: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (valor predeterminado: `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Variable de entorno: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://api.x.ai/v1`. Variable de entorno: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valor predeterminado: `eve`. Con autenticación, `openclaw infer tts voices --provider xai` obtiene el catálogo integrado actual; sin autenticación, muestra las alternativas sin conexión `ara`, `eve`, `leo`, `rex` y `sal`. Los identificadores de voces personalizadas de la cuenta se reenvían aunque no figuren en la lista integrada. Alias heredado: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Código de idioma BCP-47 o `auto`. Valor predeterminado: `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Valor predeterminado: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Valor que sobrescribe la velocidad nativa del proveedor, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Variable de entorno: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valor predeterminado: `https://api.xiaomimimo.com/v1`. Variable de entorno: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Valor predeterminado: `mimo-v2.5-tts`. Variable de entorno: `XIAOMI_TTS_MODEL`. También admite `mimo-v2-tts` y `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Valor predeterminado: `mimo_default` para los modelos con voces preestablecidas. Variable de entorno: `XIAOMI_TTS_VOICE`. Alias heredado: `voice`. No se envía para `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Valor predeterminado: `mp3`. Variable de entorno: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instrucción opcional de estilo en lenguaje natural que se envía como mensaje del usuario; no se pronuncia. Para `mimo-v2.5-tts-voicedesign`, esta es la instrucción de diseño de voz; OpenClaw proporciona un valor predeterminado cuando se omite.</ParamField>
  </Accordion>
</AccordionGroup>

## Herramienta del agente

La herramienta `tts` convierte texto en voz y devuelve un archivo de audio adjunto para la entrega de la respuesta. En Feishu, Matrix, Telegram y WhatsApp, el audio se entrega como mensaje de voz en lugar de como archivo adjunto. Feishu y WhatsApp pueden transcodificar la salida TTS que no sea Opus en esta ruta cuando `ffmpeg` está disponible.

WhatsApp envía el audio mediante Baileys como una nota de voz PTT (`audio` con `ptt: true`) y envía el texto visible **por separado** del audio PTT porque los clientes no muestran de forma uniforme los subtítulos en las notas de voz.

La herramienta acepta los campos opcionales `channel` y `timeoutMs`; `timeoutMs` es un tiempo de espera por llamada para la solicitud al proveedor, en milisegundos. Los valores por llamada sobrescriben `messages.tts.timeoutMs`; los tiempos de espera de TTS configurados sobrescriben cualquier valor predeterminado del proveedor definido por el Plugin.

## RPC del Gateway

| Método            | Propósito                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | Leer el estado actual de TTS y el último intento.     |
| `tts.enable`      | Establecer la preferencia automática local en `always`.       |
| `tts.disable`     | Establecer la preferencia automática local en `off`.          |
| `tts.convert`     | Convertir texto en audio una sola vez.                        |
| `tts.setProvider` | Establecer la preferencia local de proveedor.               |
| `tts.personas`    | Enumerar las personas configuradas y la activa. |
| `tts.setPersona`  | Establecer la preferencia local de persona.                |
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
- [API de MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP de TTS de Volcengine](/es/providers/volcengine#text-to-speech)
- [Síntesis de voz de Xiaomi MiMo](/es/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de salida de voz de Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Conversión de texto a voz de xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Contenido relacionado

- [Descripción general de medios](/es/tools/media-overview)
- [Generación de música](/es/tools/music-generation)
- [Generación de vídeo](/es/tools/video-generation)
- [Comandos con barra diagonal](/es/tools/slash-commands)
- [Plugin de llamadas de voz](/es/plugins/voice-call)
