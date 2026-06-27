---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el plugin de llamadas de voz
    - Necesitas voz en tiempo real o transcripción en streaming por telefonía
sidebarTitle: Voice call
summary: Realiza llamadas de voz salientes y acepta llamadas de voz entrantes mediante Twilio, Telnyx o Plivo, con voz en tiempo real opcional y transcripción en streaming
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-06-27T12:32:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

Llamadas de voz para OpenClaw mediante un plugin. Admite notificaciones salientes,
conversaciones de varios turnos, voz en tiempo real full-duplex, transcripción
en streaming y llamadas entrantes con políticas de lista de permitidos.

**Proveedores actuales:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (desarrollo/sin red).

<Note>
El plugin Voice Call se ejecuta **dentro del proceso Gateway**. Si usas un
Gateway remoto, instala y configura el plugin en la máquina que ejecuta
el Gateway y luego reinicia el Gateway para cargarlo.
</Note>

## Inicio rápido

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Usa el paquete sin versión para seguir la etiqueta de la versión oficial actual. Fija una
    versión exacta solo cuando necesites una instalación reproducible.

    Reinicia el Gateway después para que el plugin se cargue.

  </Step>
  <Step title="Configure provider and webhook">
    Define la configuración en `plugins.entries.voice-call.config` (consulta
    [Configuración](#configuration) más abajo para ver la forma completa). Como mínimo:
    `provider`, las credenciales del proveedor, `fromNumber` y una URL de webhook
    accesible públicamente.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    La salida predeterminada es legible en registros de chat y terminales. Comprueba
    la habilitación del plugin, las credenciales del proveedor, la exposición del webhook y que
    solo esté activo un modo de audio (`streaming` o `realtime`). Usa
    `--json` para scripts.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambas son simulaciones de forma predeterminada. Añade `--yes` para realizar realmente una llamada
    saliente breve de notificación:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx y Plivo, la configuración debe resolverse en una **URL de webhook pública**.
Si `publicUrl`, la URL del túnel, la URL de Tailscale o el fallback de servicio
se resuelve a loopback o a espacio de red privada, la configuración falla en lugar de
iniciar un proveedor que no puede recibir webhooks del operador.
</Warning>

## Configuración

Si `enabled: true` pero al proveedor seleccionado le faltan credenciales,
el arranque del Gateway registra una advertencia de configuración incompleta con las claves faltantes y
omite iniciar el runtime. Los comandos, las llamadas RPC y las herramientas de agente todavía
devuelven la configuración exacta faltante del proveedor cuando se usan.

<Note>
Las credenciales de Voice Call aceptan SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` y `plugins.entries.voice-call.config.tts.providers.*.apiKey` se resuelven mediante la superficie SecretRef estándar; consulta [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { speakerVoice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx y Plivo requieren una URL de webhook **accesible públicamente**.
    - `mock` es un proveedor de desarrollo local (sin llamadas de red).
    - Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` sea true.
    - `skipSignatureVerification` es solo para pruebas locales.
    - En el nivel gratuito de ngrok, define `publicUrl` con la URL exacta de ngrok; la verificación de firma siempre se aplica.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es loopback (agente local de ngrok). Solo desarrollo local.
    - Las URL del nivel gratuito de ngrok pueden cambiar o añadir comportamiento intersticial; si `publicUrl` se desvía, las firmas de Twilio fallan. Producción: prefiere un dominio estable o un funnel de Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` cierra sockets que nunca envían un marco `start` válido.
    - `streaming.maxPendingConnections` limita el total de sockets preinicio sin autenticar.
    - `streaming.maxPendingConnectionsPerIp` limita los sockets preinicio sin autenticar por IP de origen.
    - `streaming.maxConnections` limita el total de sockets de media stream abiertos (pendientes + activos).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Las configuraciones antiguas que usan `provider: "log"`, `twilio.from` o claves heredadas
    `streaming.*` de OpenAI son reescritas por `openclaw doctor --fix`.
    El fallback de runtime todavía acepta las claves antiguas de voice-call por ahora, pero
    la ruta de reescritura es `openclaw doctor --fix` y el shim de compatibilidad es
    temporal.

    Claves de streaming migradas automáticamente:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Alcance de sesión

De forma predeterminada, Voice Call usa `sessionScope: "per-phone"` para que las llamadas repetidas del
mismo llamante conserven la memoria de conversación. Define `sessionScope: "per-call"` cuando
cada llamada del operador deba comenzar con contexto nuevo, por ejemplo en recepción,
reservas, IVR o flujos de puente de Google Meet donde el mismo número de teléfono puede
representar reuniones distintas.

Voice Call almacena las claves de sesión generadas en el espacio de nombres del agente configurado
(`agent:<agentId>:voice:*`) para que la memoria de llamadas sobreviva a la canonicalización de claves
de sesión del Gateway tras reinicios. Las claves explícitas sin procesar de integraciones usan el mismo
espacio de nombres de agente. Una clave canónica `agent:<configuredAgentId>:*` conserva ese propietario,
y sus alias principales respetan `session.mainKey` del núcleo y el alcance global. Las entradas
`agent:*` externas o malformadas se delimitan como una clave opaca bajo el agente configurado;
`global` y `unknown` permanecen como centinelas globales. El arranque del Gateway promueve claves
sin procesar antiguas en almacenes predeterminados o con plantilla `{agentId}` cuando la ruta prueba un
único propietario. En almacenes personalizados fijos, las filas heredadas ambiguas permanecen intactas porque
no contienen suficiente información para elegir un propietario; las llamadas nuevas usan
historial canónico con alcance de agente.

## Conversaciones de voz en tiempo real

`realtime` selecciona un proveedor de voz en tiempo real full-duplex para audio de llamada
en vivo. Está separado de `streaming`, que solo reenvía audio a
proveedores de transcripción en tiempo real.

<Warning>
`realtime.enabled` no se puede combinar con `streaming.enabled`. Elige un
modo de audio por llamada.
</Warning>

Comportamiento actual del runtime:

- `realtime.enabled` es compatible con Twilio Media Streams.
- `realtime.provider` es opcional. Si no se define, Voice Call usa el primer proveedor registrado de voz en tiempo real.
- Proveedores de voz en tiempo real incluidos: Google Gemini Live (`google`) y OpenAI (`openai`), registrados por sus plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `realtime.providers.<providerId>`.
- Voice Call expone la herramienta compartida en tiempo real `openclaw_agent_consult` de forma predeterminada. El modelo en tiempo real puede llamarla cuando el llamante pide razonamiento más profundo, información actual o herramientas normales de OpenClaw.
- `realtime.consultPolicy` añade opcionalmente orientación sobre cuándo el modelo en tiempo real debe llamar a `openclaw_agent_consult`.
- `realtime.agentContext.enabled` está desactivado de forma predeterminada. Cuando se habilita, Voice Call inyecta una identidad de agente acotada y una cápsula seleccionada de archivos del espacio de trabajo en las instrucciones del proveedor en tiempo real durante la configuración de la sesión.
- `realtime.fastContext.enabled` está desactivado de forma predeterminada. Cuando se habilita, Voice Call primero busca en memoria indexada/contexto de sesión para la pregunta de consulta y devuelve esos fragmentos al modelo en tiempo real dentro de `realtime.fastContext.timeoutMs` antes de hacer fallback al agente de consulta completo solo si `realtime.fastContext.fallbackToConsult` es true.
- Si `realtime.provider` apunta a un proveedor no registrado, o si no hay ningún proveedor de voz en tiempo real registrado, Voice Call registra una advertencia y omite la media en tiempo real en lugar de hacer fallar todo el plugin.
- Las claves de sesión de consulta reutilizan la sesión de llamada almacenada cuando está disponible, y luego hacen fallback al `sessionScope` configurado (`per-phone` de forma predeterminada, o `per-call` para llamadas aisladas).

### Política de herramientas

`realtime.toolPolicy` controla la ejecución de consulta:

| Política         | Comportamiento                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expone la herramienta de consulta y limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`. |
| `owner`          | Expone la herramienta de consulta y permite que el agente normal use la política normal de herramientas de agente.                       |
| `none`           | No expone la herramienta de consulta. Las `realtime.tools` personalizadas aún se pasan al proveedor en tiempo real.                     |

`realtime.consultPolicy` controla solo las instrucciones del modelo en tiempo real:

| Política      | Orientación                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `auto`        | Mantiene el prompt predeterminado y permite que el proveedor decida cuándo llamar a la herramienta de consulta. |
| `substantive` | Responde directamente a conectores conversacionales simples y consulta antes de hechos, memoria, herramientas o contexto. |
| `always`      | Consulta antes de cada respuesta sustantiva.                                                   |

### Contexto de voz del agente

Habilita `realtime.agentContext` cuando el puente de voz deba sonar como el
agente de OpenClaw configurado sin pagar una ida y vuelta completa de consulta
al agente en los turnos ordinarios. La cápsula de contexto se añade una vez
cuando se crea la sesión en tiempo real, por lo que no añade latencia por turno.
Las llamadas a `openclaw_agent_consult` siguen ejecutando el agente completo de
OpenClaw y deben usarse para trabajo con herramientas, información actual,
consultas de memoria o estado del espacio de trabajo.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Ejemplos de proveedores en tiempo real

<Tabs>
  <Tab title="Google Gemini Live">
    Valores predeterminados: clave de API de `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` o `GOOGLE_GENERATIVE_AI_API_KEY`; modelo
    `gemini-2.5-flash-native-audio-preview-12-2025`; voz `Kore`.
    `sessionResumption` y `contextWindowCompression` están activados por defecto
    para llamadas más largas y reconectables. Usa `silenceDurationMs`,
    `startSensitivity` y `endSensitivity` para ajustar turnos más rápidos en
    audio de telefonía.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Consulta [proveedor de Google](/es/providers/google) y
[proveedor de OpenAI](/es/providers/openai) para ver opciones de voz en tiempo real
específicas del proveedor.

## Transcripción en streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para audio
de llamadas en vivo.

Comportamiento actual en tiempo de ejecución:

- `streaming.provider` es opcional. Si no se define, Voice Call usa el primer proveedor de transcripción en tiempo real registrado.
- Proveedores de transcripción en tiempo real incluidos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI (`xai`), registrados por sus plugins de proveedor.
- La configuración sin procesar propiedad del proveedor se encuentra en `streaming.providers.<providerId>`.
- Después de que Twilio envía un mensaje `start` de stream aceptado, Voice Call registra el stream de inmediato, pone en cola los medios entrantes a través del proveedor de transcripción mientras el proveedor se conecta e inicia el saludo inicial solo después de que la transcripción en tiempo real esté lista.
- Si `streaming.provider` apunta a un proveedor no registrado, o no hay ninguno registrado, Voice Call registra una advertencia y omite el streaming de medios en lugar de hacer fallar todo el plugin.

### Ejemplos de proveedores de streaming

<Tabs>
  <Tab title="OpenAI">
    Valores predeterminados: clave de API `streaming.providers.openai.apiKey` u
    `OPENAI_API_KEY`; modelo `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    Valores predeterminados: clave de API `streaming.providers.xai.apiKey` o `XAI_API_KEY`;
    endpoint `wss://api.x.ai/v1/stt`; codificación `mulaw`; frecuencia de muestreo `8000`;
    `endpointingMs: 800`; `interimResults: true`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## TTS para llamadas

Voice Call usa la configuración central `messages.tts` para voz en streaming
en llamadas. Puedes sobrescribirla bajo la configuración del plugin con la
**misma forma**; se fusiona en profundidad con `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**La voz de Microsoft se ignora en las llamadas de voz.** El audio de telefonía
necesita PCM; el transporte actual de Microsoft no expone salida PCM de telefonía.
</Warning>

Notas de comportamiento:

- Las claves heredadas `tts.<provider>` dentro de la configuración del plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) las repara `openclaw doctor --fix`; la configuración confirmada debe usar `tts.providers.<provider>`.
- El TTS central se usa cuando el streaming de medios de Twilio está habilitado; de lo contrario, las llamadas recurren a voces nativas del proveedor.
- Si un stream de medios de Twilio ya está activo, Voice Call no recurre a TwiML `<Say>`. Si TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando TTS de telefonía recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.
- Cuando la interrupción por voz de Twilio o el desmontaje del stream limpia la cola TTS pendiente, las solicitudes de reproducción en cola se resuelven en lugar de dejar colgados a los llamantes que esperan la finalización de la reproducción.

### Ejemplos de TTS

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI model override (deep-merge)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                speakerVoice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## Llamadas entrantes

La política de llamadas entrantes tiene `disabled` como valor predeterminado. Para habilitar llamadas entrantes, define:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` es un filtro de identificador de llamada de baja
fiabilidad. El plugin normaliza el valor `From` proporcionado por el proveedor y
lo compara con `allowFrom`. La verificación del Webhook autentica la entrega del
proveedor y la integridad de la carga útil, pero **no** demuestra la propiedad
del número llamante PSTN/VoIP. Trata `allowFrom` como filtrado de identificador
de llamada, no como identidad sólida del llamante.
</Warning>

Las respuestas automáticas usan el sistema de agente. Ajústalas con
`responseModel`, `responseSystemPrompt` y `responseTimeoutMs`.

### Enrutamiento por número

Usa `numbers` cuando un plugin de Voice Call recibe llamadas para varios números
de teléfono y cada número debe comportarse como una línea diferente. Por ejemplo,
un número puede usar un asistente personal informal mientras otro usa una
persona de negocio, un agente de respuesta distinto y una voz TTS diferente.

Las rutas se seleccionan a partir del número marcado `To` proporcionado por el
proveedor. Las claves deben ser números E.164. Cuando llega una llamada, Voice
Call resuelve la ruta coincidente una vez, almacena la ruta coincidente en el
registro de la llamada y reutiliza esa configuración efectiva para el saludo, la
ruta clásica de respuesta automática, la ruta de consulta en tiempo real y la
reproducción TTS. Si no coincide ninguna ruta, se usa la configuración global de
Voice Call. Las llamadas salientes no usan `numbers`; pasa explícitamente el
destino saliente, el mensaje y la sesión al iniciar la llamada.

Las sobrescrituras de ruta admiten actualmente:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

El valor de ruta `tts` se fusiona en profundidad sobre la configuración global
`tts` de Voice Call, por lo que normalmente puedes sobrescribir solo la voz del
proveedor:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Contrato de salida hablada

Para las respuestas automáticas, Voice Call añade un contrato estricto de salida
hablada al prompt del sistema:

```text
{"spoken":"..."}
```

Voice Call extrae el texto hablado de forma defensiva:

- Ignora las cargas útiles marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON cercado o claves `"spoken"` en línea.
- Recurre a texto plano y elimina párrafos iniciales que probablemente sean de planificación/metadatos.

Esto mantiene la reproducción hablada centrada en texto dirigido al llamante y
evita filtrar texto de planificación al audio.

### Comportamiento de inicio de conversación

Para llamadas `conversation` salientes, el manejo del primer mensaje está ligado
al estado de reproducción en vivo:

- La limpieza de la cola por interrupción de voz y la respuesta automática se suprimen solo mientras el saludo inicial está hablando activamente.
- Si falla la reproducción inicial, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para reintentarlo.
- La reproducción inicial para streaming de Twilio empieza al conectarse el stream, sin demora adicional.
- La interrupción por voz aborta la reproducción activa y limpia las entradas TTS de Twilio en cola pero aún no reproducidas. Las entradas limpiadas se resuelven como omitidas, por lo que la lógica de respuesta de seguimiento puede continuar sin esperar audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el turno de apertura propio del stream en tiempo real. Voice Call **no** publica una actualización TwiML `<Say>` heredada para ese mensaje inicial, por lo que las sesiones salientes `<Connect><Stream>` permanecen adjuntas.

### Gracia ante desconexión del stream de Twilio

Cuando un flujo multimedia de Twilio se desconecta, Voice Call espera **2000 ms** antes de
finalizar automáticamente la llamada:

- Si el flujo se vuelve a conectar durante esa ventana, la finalización automática se cancela.
- Si ningún flujo se vuelve a registrar después del período de gracia, la llamada se finaliza para evitar llamadas activas bloqueadas.

## Recolector de llamadas obsoletas

Usa `staleCallReaperSeconds` para finalizar llamadas que nunca reciben un
Webhook terminal (por ejemplo, llamadas en modo de notificación que nunca se completan). El valor predeterminado
es `0` (deshabilitado).

Rangos recomendados:

- **Producción:** `120`-`300` segundos para flujos de estilo notificación.
- Mantén este valor **por encima de `maxDurationSeconds`** para que las llamadas normales puedan finalizar. Un buen punto de partida es `maxDurationSeconds + 30-60` segundos.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Seguridad de Webhook

Cuando un proxy o túnel está delante del Gateway, el plugin
reconstruye la URL pública para verificar la firma. Estas opciones
controlan qué encabezados reenviados son de confianza:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista de hosts permitidos desde encabezados de reenvío.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confiar en encabezados reenviados sin una lista de permitidos.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confiar en encabezados reenviados solo cuando la IP remota de la solicitud coincida con la lista.
</ParamField>

Protecciones adicionales:

- La **protección contra reproducción** de Webhook está habilitada para Twilio y Plivo. Las solicitudes válidas de Webhook reproducidas se confirman, pero se omiten sus efectos secundarios.
- Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada `<Gather>`, por lo que las devoluciones de llamada de voz obsoletas o reproducidas no pueden satisfacer un turno de transcripción pendiente más reciente.
- Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los encabezados de firma requeridos del proveedor.
- El Webhook de voice-call usa el perfil compartido de cuerpo previo a la autenticación (64 KB / 5 segundos), además de un límite por IP para solicitudes en curso antes de la verificación de firma.

Ejemplo con un host público estable:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

Cuando el Gateway ya está en ejecución, los comandos operativos de `voicecall` delegan
en el runtime de voice-call propiedad del Gateway para que la CLI no vincule un segundo
servidor de Webhook. Si no se puede alcanzar ningún Gateway, los comandos recurren a un
runtime de CLI independiente.

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de voice-call.
Usa `--file <path>` para apuntar a un registro diferente y `--last <n>` para limitar
el análisis a los últimos N registros (predeterminado: 200). La salida incluye p50/p90/p99
para la latencia de turno y los tiempos de espera de escucha.

## Herramienta de agente

Nombre de la herramienta: `voice_call`.

| Acción          | Argumentos                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

El plugin voice-call incluye un skill de agente correspondiente.

## RPC de Gateway

| Método              | Argumentos                                 |
| ------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` solo es válido con `mode: "conversation"`. Las llamadas en modo de notificación
deben usar `voicecall.dtmf` después de que exista la llamada si necesitan dígitos
posteriores a la conexión.

## Solución de problemas

### La configuración falla en la exposición del Webhook

Ejecuta la configuración desde el mismo entorno que ejecuta el Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Para `twilio`, `telnyx` y `plivo`, `webhook-exposure` debe estar en verde. Una
`publicUrl` configurada sigue fallando cuando apunta a espacio de red local o privado,
porque el operador no puede devolver llamadas a esas direcciones. No uses
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ni `fd00::/8` como `publicUrl`.

Las llamadas salientes de Twilio en modo de notificación envían su TwiML inicial `<Say>` directamente en
la solicitud de creación de llamada, por lo que el primer mensaje hablado no depende de que Twilio
obtenga TwiML del Webhook. Sigue siendo necesario un Webhook público para devoluciones de llamada de estado,
llamadas de conversación, DTMF previo a la conexión, flujos en tiempo real y control de llamadas
posterior a la conexión.

Usa una ruta de exposición pública:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Después de cambiar la configuración, reinicia o recarga el Gateway y luego ejecuta:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` es una simulación a menos que pases `--yes`.

### Fallan las credenciales del proveedor

Comprueba el proveedor seleccionado y los campos de credenciales requeridos:

- Twilio: `twilio.accountSid`, `twilio.authToken` y `fromNumber`, o
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` y
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` y `fromNumber`.

Las credenciales deben existir en el host del Gateway. Editar un perfil de shell local no
afecta a un Gateway que ya está en ejecución hasta que se reinicie o recargue su
entorno.

### Las llamadas se inician, pero no llegan los Webhooks del proveedor

Confirma que la consola del proveedor apunta a la URL pública exacta del Webhook:

```text
https://voice.example.com/voice/webhook
```

Luego inspecciona el estado del runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causas comunes:

- `publicUrl` apunta a una ruta diferente de `serve.path`.
- La URL del túnel cambió después de que se iniciara el Gateway.
- Un proxy reenvía la solicitud, pero elimina o reescribe los encabezados de host/proto.
- El firewall o DNS enruta el nombre de host público a un lugar distinto del Gateway.
- El Gateway se reinició sin el plugin Voice Call habilitado.

Cuando un proxy inverso o túnel está delante del Gateway, establece
`webhookSecurity.allowedHosts` en el nombre de host público, o usa
`webhookSecurity.trustedProxyIPs` para una dirección de proxy conocida. Usa
`webhookSecurity.trustForwardingHeaders` solo cuando el límite del proxy esté bajo
tu control.

### Falla la verificación de firma

Las firmas del proveedor se comprueban contra la URL pública que OpenClaw reconstruye
a partir de la solicitud entrante. Si las firmas fallan:

- Confirma que la URL de Webhook del proveedor coincida exactamente con `publicUrl`, incluido
  el esquema, el host y la ruta.
- Para las URL de nivel gratuito de ngrok, actualiza `publicUrl` cuando cambie el nombre de host del túnel.
- Asegúrate de que el proxy conserve los encabezados originales de host y proto, o configura
  `webhookSecurity.allowedHosts`.
- No habilites `skipSignatureVerification` fuera de las pruebas locales.

### Fallan las uniones de Google Meet con Twilio

Google Meet usa este plugin para uniones de acceso telefónico con Twilio. Primero verifica Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Luego verifica explícitamente el transporte de Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call está en verde, pero el participante de Meet nunca se une, comprueba el número de acceso
telefónico de Meet, el PIN y `--dtmf-sequence`. La llamada telefónica puede estar en buen estado mientras
la reunión rechaza o ignora una secuencia DTMF incorrecta.

Google Meet inicia el tramo telefónico de Twilio mediante `voicecall.start` con una
secuencia DTMF previa a la conexión. Las secuencias derivadas del PIN incluyen
`voiceCall.dtmfDelayMs` del plugin de Google Meet como dígitos iniciales de espera de Twilio. El valor predeterminado es 12 segundos
porque las indicaciones de acceso telefónico de Meet pueden llegar tarde. Luego Voice Call redirige de vuelta al
manejo en tiempo real antes de que se solicite el saludo de introducción.

Usa `openclaw logs --follow` para la traza de la fase en vivo. Una unión correcta de Twilio a Meet
registra este orden:

- Google Meet delega la unión de Twilio a Voice Call.
- Voice Call almacena el TwiML de DTMF previo a la conexión.
- El TwiML inicial de Twilio se consume y se sirve antes del manejo en tiempo real.
- Voice Call sirve TwiML en tiempo real para la llamada de Twilio.
- Google Meet solicita voz de introducción con `voicecall.speak` después del retraso posterior a DTMF.

`openclaw voicecall tail` todavía muestra registros de llamadas persistidos; es útil para
el estado de llamadas y transcripciones, pero no todas las transiciones de Webhook/en tiempo real aparecen
allí.

### La llamada en tiempo real no tiene voz

Confirma que solo un modo de audio esté habilitado. `realtime.enabled` y
`streaming.enabled` no pueden ser ambos `true`.

Para llamadas de Twilio en tiempo real, verifica también:

- Hay un plugin de proveedor en tiempo real cargado y registrado.
- `realtime.provider` no está establecido o nombra un proveedor registrado.
- La clave de API del proveedor está disponible para el proceso del Gateway.
- `openclaw logs --follow` muestra que se sirvió TwiML en tiempo real, que el puente en tiempo real
  se inició y que el saludo inicial se puso en cola.

## Relacionado

- [Modo Talk](/es/nodes/talk)
- [Texto a voz](/es/tools/tts)
- [Activación por voz](/es/nodes/voicewake)
