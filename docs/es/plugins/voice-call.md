---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el Plugin de llamadas de voz
    - Necesitas voz en tiempo real o transcripción en streaming en telefonía
sidebarTitle: Voice call
summary: Realiza llamadas de voz salientes y acepta llamadas de voz entrantes mediante Twilio, Telnyx o Plivo, con voz en tiempo real y transcripción por transmisión continua opcionales
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-05-02T21:03:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice calls for OpenClaw via a plugin. Supports outbound notifications,
multi-turn conversations, full-duplex realtime voice, streaming
transcription, and inbound calls with allowlist policies.

**Current providers:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/no network).

<Note>
The Voice Call plugin runs **inside the Gateway process**. If you use a
remote Gateway, install and configure the plugin on the machine running
the Gateway, then restart the Gateway to load it.
</Note>

## Quick start

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

    If npm reports the OpenClaw-owned package as deprecated, that package version
    is from an older external package train; use a current packaged OpenClaw
    build or the local folder path until a newer npm package is published.

    Restart the Gateway afterwards so the plugin loads.

  </Step>
  <Step title="Configure provider and webhook">
    Set config under `plugins.entries.voice-call.config` (see
    [Configuration](#configuration) below for the full shape). At minimum:
    `provider`, provider credentials, `fromNumber`, and a publicly
    reachable webhook URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    The default output is readable in chat logs and terminals. It checks
    plugin enablement, provider credentials, webhook exposure, and that
    only one audio mode (`streaming` or `realtime`) is active. Use
    `--json` for scripts.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Both are dry runs by default. Add `--yes` to actually place a short
    outbound notify call:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
For Twilio, Telnyx, and Plivo, setup must resolve to a **public webhook URL**.
If `publicUrl`, the tunnel URL, the Tailscale URL, or the serve fallback
resolves to loopback or private network space, setup fails instead of
starting a provider that cannot receive carrier webhooks.
</Warning>

## Configuration

If `enabled: true` but the selected provider is missing credentials,
Gateway startup logs a setup-incomplete warning with the missing keys and
skips starting the runtime. Commands, RPC calls, and agent tools still
return the exact missing provider configuration when used.

<Note>
Voice-call credentials accept SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, and `plugins.entries.voice-call.config.tts.providers.*.apiKey` resolve through the standard SecretRef surface; see [SecretRef credential surface](/es/reference/secretref-credential-surface).
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
                  openai: { voice: "alloy" },
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
    - Twilio, Telnyx, and Plivo all require a **publicly reachable** webhook URL.
    - `mock` is a local dev provider (no network calls).
    - Telnyx requires `telnyx.publicKey` (or `TELNYX_PUBLIC_KEY`) unless `skipSignatureVerification` is true.
    - `skipSignatureVerification` is for local testing only.
    - On ngrok free tier, set `publicUrl` to the exact ngrok URL; signature verification is always enforced.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` allows Twilio webhooks with invalid signatures **only** when `tunnel.provider="ngrok"` and `serve.bind` is loopback (ngrok local agent). Local dev only.
    - Ngrok free-tier URLs can change or add interstitial behaviour; if `publicUrl` drifts, Twilio signatures fail. Production: prefer a stable domain or a Tailscale funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` closes sockets that never send a valid `start` frame.
    - `streaming.maxPendingConnections` caps total unauthenticated pre-start sockets.
    - `streaming.maxPendingConnectionsPerIp` caps unauthenticated pre-start sockets per source IP.
    - `streaming.maxConnections` caps total open media stream sockets (pending + active).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Older configs using `provider: "log"`, `twilio.from`, or legacy
    `streaming.*` OpenAI keys are rewritten by `openclaw doctor --fix`.
    Runtime fallback still accepts the old voice-call keys for now, but
    the rewrite path is `openclaw doctor --fix` and the compat shim is
    temporary.

    Auto-migrated streaming keys:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Session scope

By default, Voice Call uses `sessionScope: "per-phone"` so repeat calls from
the same caller keep conversation memory. Set `sessionScope: "per-call"` when
each carrier call should start with fresh context, for example reception,
booking, IVR, or Google Meet bridge flows where the same phone number may
represent different meetings.

## Realtime voice conversations

`realtime` selects a full-duplex realtime voice provider for live call
audio. It is separate from `streaming`, which only forwards audio to
realtime transcription providers.

<Warning>
`realtime.enabled` cannot be combined with `streaming.enabled`. Pick one
audio mode per call.
</Warning>

Current runtime behaviour:

- `realtime.enabled` is supported for Twilio Media Streams.
- `realtime.provider` is optional. If unset, Voice Call uses the first registered realtime voice provider.
- Bundled realtime voice providers: Google Gemini Live (`google`) and OpenAI (`openai`), registered by their provider plugins.
- Provider-owned raw config lives under `realtime.providers.<providerId>`.
- Voice Call exposes the shared `openclaw_agent_consult` realtime tool by default. The realtime model can call it when the caller asks for deeper reasoning, current information, or normal OpenClaw tools.
- `realtime.fastContext.enabled` is default-off. When enabled, Voice Call first searches indexed memory/session context for the consult question and returns those snippets to the realtime model within `realtime.fastContext.timeoutMs` before falling back to the full consult agent only if `realtime.fastContext.fallbackToConsult` is true.
- If `realtime.provider` points at an unregistered provider, or no realtime voice provider is registered at all, Voice Call logs a warning and skips realtime media instead of failing the whole plugin.
- Consult session keys reuse the stored call session when available, then fall back to the configured `sessionScope` (`per-phone` by default, or `per-call` for isolated calls).

### Tool policy

`realtime.toolPolicy` controls the consult run:

| Policy           | Behavior                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose the consult tool and limit the regular agent to `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, and `memory_get`. |
| `owner`          | Expose the consult tool and let the regular agent use the normal agent tool policy.                                                      |
| `none`           | Do not expose the consult tool. Custom `realtime.tools` are still passed through to the realtime provider.                               |

### Realtime provider examples

<Tabs>
  <Tab title="Google Gemini Live">
    Defaults: API key from `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; voice `Kore`.

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
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
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

See [Google provider](/es/providers/google) and
[OpenAI provider](/es/providers/openai) for provider-specific realtime voice
options.

## Streaming transcription

`streaming` selects a realtime transcription provider for live call audio.

Current runtime behavior:

- `streaming.provider` es opcional. Si no se configura, Voice Call usa el primer proveedor de transcripción en tiempo real registrado.
- Proveedores de transcripción en tiempo real incluidos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI (`xai`), registrados por sus plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `streaming.providers.<providerId>`.
- Después de que Twilio envía un mensaje `start` de stream aceptado, Voice Call registra el stream inmediatamente, pone en cola los medios entrantes a través del proveedor de transcripción mientras el proveedor se conecta e inicia el saludo inicial solo después de que la transcripción en tiempo real está lista.
- Si `streaming.provider` apunta a un proveedor no registrado, o no hay ninguno registrado, Voice Call registra una advertencia y omite el streaming de medios en lugar de hacer fallar todo el plugin.

### Ejemplos de proveedores de streaming

<Tabs>
  <Tab title="OpenAI">
    Valores predeterminados: clave de API `streaming.providers.openai.apiKey` o
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

Voice Call usa la configuración principal `messages.tts` para voz en streaming
en llamadas. Puedes sobrescribirla en la configuración del plugin con la
**misma forma**: se fusiona en profundidad con `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft speech se ignora para las llamadas de voz.** El audio de telefonía necesita PCM;
el transporte actual de Microsoft no expone salida PCM de telefonía.
</Warning>

Notas de comportamiento:

- Las claves heredadas `tts.<provider>` dentro de la configuración del plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) son reparadas por `openclaw doctor --fix`; la configuración confirmada debe usar `tts.providers.<provider>`.
- El TTS principal se usa cuando el streaming de medios de Twilio está habilitado; de lo contrario, las llamadas recurren a voces nativas del proveedor.
- Si un stream de medios de Twilio ya está activo, Voice Call no recurre a TwiML `<Say>`. Si el TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS de telefonía recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.
- Cuando la interrupción por habla o el desmontaje del stream de Twilio limpia la cola de TTS pendiente, las solicitudes de reproducción en cola se resuelven en lugar de dejar a los llamantes esperando la finalización de la reproducción.

### Ejemplos de TTS

<Tabs>
  <Tab title="Solo TTS principal">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Sobrescribir a ElevenLabs (solo llamadas)">
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
                voiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="Sobrescritura del modelo de OpenAI (fusión profunda)">
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
                voice: "marin",
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

La política entrante tiene el valor predeterminado `disabled`. Para habilitar llamadas entrantes, configura:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` es una comprobación de identificador de llamada de baja confianza. El
plugin normaliza el valor `From` proporcionado por el proveedor y lo compara con
`allowFrom`. La verificación de Webhook autentica la entrega del proveedor y
la integridad de la carga útil, pero **no** demuestra la propiedad del número de
llamada PSTN/VoIP. Trata `allowFrom` como filtrado de identificador de llamada,
no como identidad sólida del llamante.
</Warning>

Las respuestas automáticas usan el sistema de agentes. Ajusta con `responseModel`,
`responseSystemPrompt` y `responseTimeoutMs`.

### Enrutamiento por número

Usa `numbers` cuando un plugin Voice Call recibe llamadas para varios números de teléfono
y cada número debe comportarse como una línea diferente. Por ejemplo, un
número puede usar un asistente personal informal mientras otro usa una
persona de negocio, un agente de respuesta diferente y una voz TTS diferente.

Las rutas se seleccionan a partir del número `To` marcado proporcionado por el proveedor. Las claves deben ser
números E.164. Cuando llega una llamada, Voice Call resuelve la ruta coincidente una vez,
almacena la ruta coincidente en el registro de la llamada y reutiliza esa configuración efectiva
para el saludo, la ruta clásica de respuesta automática, la ruta de consulta en tiempo real y la
reproducción de TTS. Si ninguna ruta coincide, se usa la configuración global de Voice Call.
Las llamadas salientes no usan `numbers`; pasa el destino saliente, el mensaje y la
sesión explícitamente al iniciar la llamada.

Las sobrescrituras de ruta admiten actualmente:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

El valor de ruta `tts` se fusiona en profundidad sobre la configuración global de `tts` de Voice Call, por lo que
normalmente puedes sobrescribir solo la voz del proveedor:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Contrato de salida hablada

Para las respuestas automáticas, Voice Call añade un contrato estricto de salida hablada al
prompt del sistema:

```text
{"spoken":"..."}
```

Voice Call extrae el texto de voz de forma defensiva:

- Ignora cargas útiles marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON en bloque delimitado o claves `"spoken"` en línea.
- Recurre a texto sin formato y elimina párrafos iniciales que probablemente sean de planificación/metadatos.

Esto mantiene la reproducción hablada centrada en texto dirigido al llamante y evita
filtrar texto de planificación en el audio.

### Comportamiento de inicio de conversación

Para llamadas `conversation` salientes, la gestión del primer mensaje está vinculada al estado de
reproducción en vivo:

- La limpieza de cola por interrupción y la respuesta automática se suprimen solo mientras el saludo inicial se está hablando activamente.
- Si la reproducción inicial falla, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para reintento.
- La reproducción inicial para streaming de Twilio empieza al conectar el stream sin demora adicional.
- La interrupción por habla cancela la reproducción activa y limpia entradas TTS de Twilio en cola pero aún no reproducidas. Las entradas limpiadas se resuelven como omitidas, de modo que la lógica de respuesta de seguimiento puede continuar sin esperar audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el turno de apertura propio del stream en tiempo real. Voice Call **no** publica una actualización TwiML heredada `<Say>` para ese mensaje inicial, por lo que las sesiones salientes `<Connect><Stream>` permanecen adjuntas.

### Gracia de desconexión de stream de Twilio

Cuando un stream de medios de Twilio se desconecta, Voice Call espera **2000 ms** antes de
finalizar automáticamente la llamada:

- Si el stream se reconecta durante esa ventana, la finalización automática se cancela.
- Si ningún stream se vuelve a registrar después del período de gracia, la llamada finaliza para evitar llamadas activas atascadas.

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
reconstruye la URL pública para la verificación de firma. Estas opciones
controlan qué encabezados reenviados son de confianza:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista de hosts permitidos desde encabezados de reenvío.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confía en encabezados reenviados sin una lista de permitidos.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confía en encabezados reenviados solo cuando la IP remota de la solicitud coincide con la lista.
</ParamField>

Protecciones adicionales:

- La **protección contra reproducción** de Webhook está habilitada para Twilio y Plivo. Las solicitudes Webhook válidas reproducidas se confirman pero se omiten sus efectos secundarios.
- Los turnos de conversación de Twilio incluyen un token por turno en callbacks de `<Gather>`, por lo que callbacks de voz obsoletos/reproducidos no pueden satisfacer un turno de transcripción pendiente más reciente.
- Las solicitudes Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los encabezados de firma requeridos del proveedor.
- El Webhook de voice-call usa el perfil de cuerpo preautenticación compartido (64 KB / 5 segundos) más un límite en vuelo por IP antes de la verificación de firma.

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

Cuando el Gateway ya se está ejecutando, los comandos operativos `voicecall` delegan
en el runtime voice-call propiedad del Gateway para que la CLI no vincule un segundo
servidor Webhook. Si no se puede alcanzar ningún Gateway, los comandos recurren a un
runtime de CLI independiente.

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada para llamadas de voz.
Usa `--file <path>` para apuntar a un registro diferente y `--last <n>` para limitar
el análisis a los últimos N registros (predeterminado 200). La salida incluye p50/p90/p99
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

Este repositorio incluye un documento de skill correspondiente en `skills/voice-call/SKILL.md`.

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
`publicUrl` configurada sigue fallando cuando apunta a un espacio de red local o privado,
porque el operador no puede devolver llamadas a esas direcciones. No uses
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ni `fd00::/8` como `publicUrl`.

Las llamadas salientes de Twilio en modo de notificación envían su TwiML `<Say>` inicial directamente en
la solicitud de creación de llamada, por lo que el primer mensaje hablado no depende de que Twilio
obtenga el TwiML del Webhook. Sigue siendo necesario un Webhook público para devoluciones de llamada de estado,
llamadas de conversación, DTMF previo a la conexión, transmisiones en tiempo real y control de llamadas
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

`voicecall smoke` es una ejecución de prueba salvo que pases `--yes`.

### Fallan las credenciales del proveedor

Comprueba el proveedor seleccionado y los campos de credenciales requeridos:

- Twilio: `twilio.accountSid`, `twilio.authToken` y `fromNumber`, o
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` y
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` y `fromNumber`.

Las credenciales deben existir en el host del Gateway. Editar un perfil de shell local no
afecta a un Gateway que ya está en ejecución hasta que se reinicia o recarga su
entorno.

### Las llamadas se inician pero no llegan los Webhooks del proveedor

Confirma que la consola del proveedor apunta a la URL exacta del Webhook público:

```text
https://voice.example.com/voice/webhook
```

Luego inspecciona el estado de ejecución:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causas comunes:

- `publicUrl` apunta a una ruta diferente de `serve.path`.
- La URL del túnel cambió después de que se iniciara el Gateway.
- Un proxy reenvía la solicitud pero elimina o reescribe las cabeceras de host/proto.
- El firewall o el DNS dirigen el nombre de host público a un lugar distinto del Gateway.
- El Gateway se reinició sin el Plugin Voice Call habilitado.

Cuando hay un proxy inverso o un túnel delante del Gateway, establece
`webhookSecurity.allowedHosts` en el nombre de host público, o usa
`webhookSecurity.trustedProxyIPs` para una dirección de proxy conocida. Usa
`webhookSecurity.trustForwardingHeaders` solo cuando el límite del proxy esté bajo
tu control.

### Falla la verificación de firma

Las firmas del proveedor se comprueban contra la URL pública que OpenClaw reconstruye
a partir de la solicitud entrante. Si las firmas fallan:

- Confirma que la URL del Webhook del proveedor coincide exactamente con `publicUrl`, incluido
  el esquema, el host y la ruta.
- Para las URL de nivel gratuito de ngrok, actualiza `publicUrl` cuando cambie el nombre de host del túnel.
- Asegúrate de que el proxy conserve las cabeceras originales de host y proto, o configura
  `webhookSecurity.allowedHosts`.
- No habilites `skipSignatureVerification` fuera de las pruebas locales.

### Fallan las conexiones de Twilio a Google Meet

Google Meet usa este Plugin para conexiones de acceso telefónico de Twilio. Primero verifica Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Luego verifica explícitamente el transporte de Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call está en verde pero el participante de Meet nunca se une, comprueba el número
de acceso telefónico de Meet, el PIN y `--dtmf-sequence`. La llamada telefónica puede estar correcta mientras
la reunión rechaza o ignora una secuencia DTMF incorrecta.

Google Meet pasa la secuencia DTMF de Meet y el texto de introducción a `voicecall.start`.
Para las llamadas de Twilio, Voice Call sirve primero el TwiML de DTMF, redirige de vuelta al
Webhook y luego abre la transmisión de medios en tiempo real para que la introducción guardada se genere
después de que el participante telefónico se haya unido a la reunión.

Usa `openclaw logs --follow` para el trazado de la fase en vivo. Una conexión correcta de Twilio a Meet
registra este orden:

- Google Meet delega la conexión de Twilio a Voice Call.
- Voice Call almacena el TwiML de DTMF previo a la conexión.
- El TwiML inicial de Twilio se consume y se sirve antes del manejo en tiempo real.
- Voice Call sirve TwiML en tiempo real para la llamada de Twilio.
- El puente en tiempo real se inicia con el saludo inicial en cola.

`openclaw voicecall tail` sigue mostrando registros de llamadas persistidos; es útil para
el estado de la llamada y las transcripciones, pero no todas las transiciones de Webhook/tiempo real aparecen
allí.

### La llamada en tiempo real no tiene voz

Confirma que solo haya un modo de audio habilitado. `realtime.enabled` y
`streaming.enabled` no pueden ser ambos verdaderos.

Para las llamadas de Twilio en tiempo real, verifica también:

- Hay cargado y registrado un Plugin proveedor en tiempo real.
- `realtime.provider` no está configurado o nombra un proveedor registrado.
- La clave de API del proveedor está disponible para el proceso del Gateway.
- `openclaw logs --follow` muestra que se sirvió TwiML en tiempo real, que se inició el puente en tiempo real
  y que el saludo inicial se puso en cola.

## Relacionado

- [Modo de conversación](/es/nodes/talk)
- [Texto a voz](/es/tools/tts)
- [Activación por voz](/es/nodes/voicewake)
