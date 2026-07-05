---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el plugin de llamadas de voz
    - Necesitas voz en tiempo real o transcripción en streaming en telefonía
sidebarTitle: Voice call
summary: Realiza llamadas de voz salientes y acepta llamadas entrantes mediante Twilio, Telnyx o Plivo, con voz en tiempo real y transcripción en streaming opcionales
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-07-05T11:32:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6691a5764bd537a3782a2236e3f5744d411576c0f864b20a01f12096d8f7068
    source_path: plugins/voice-call.md
    workflow: 16
---

Llamadas de voz para OpenClaw mediante un plugin: notificaciones salientes, conversaciones de varios turnos, voz en tiempo real full-duplex, transcripción en streaming y llamadas entrantes con políticas de lista de permitidos.

**Proveedores:** `mock` (desarrollo, sin red), `plivo` (Voice API + transferencia XML + voz GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice + Media Streams).

<Note>
El plugin Voice Call se ejecuta **dentro del proceso del Gateway**. Si usas un Gateway remoto, instala y configura el plugin en la máquina que ejecuta el Gateway y, después, reinicia el Gateway para cargarlo.
</Note>

## Inicio rápido

<Steps>
  <Step title="Instalar el plugin">
    <Tabs>
      <Tab title="Desde npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Desde una carpeta local (desarrollo)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Usa el paquete sin versión para seguir la etiqueta de la versión actual. Fija una versión exacta solo cuando necesites una instalación reproducible. Reinicia el Gateway después para que el plugin se cargue.

  </Step>
  <Step title="Configurar proveedor y webhook">
    Establece la configuración en `plugins.entries.voice-call.config` (consulta [Configuración](#configuration) abajo). Como mínimo: `provider`, credenciales del proveedor, `fromNumber` y una URL de webhook accesible públicamente.
  </Step>
  <Step title="Verificar configuración">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Comprueba que el plugin esté habilitado, las credenciales del proveedor, la exposición del webhook y que solo haya un modo de audio (`streaming` o `realtime`) activo.

  </Step>
  <Step title="Prueba de humo">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambas son ejecuciones de prueba de forma predeterminada. Añade `--yes` para realizar una llamada saliente breve de notificación:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx y Plivo, la configuración debe resolverse en una **URL de webhook pública**. Si `publicUrl`, la URL del túnel, la URL de Tailscale o la alternativa de servicio se resuelven a loopback o a espacio de red privada, la configuración falla en lugar de iniciar un proveedor que no puede recibir webhooks del operador.
</Warning>

## Configuración

Si `enabled: true` pero al proveedor seleccionado le faltan credenciales, el inicio del Gateway registra una advertencia de configuración incompleta con las claves faltantes y omite iniciar el runtime. Los comandos, las llamadas RPC y las herramientas del agente siguen devolviendo la configuración exacta que falta cuando se usan.

<Note>
Las credenciales de voice-call aceptan SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` y `plugins.entries.voice-call.config.tts.providers.*.apiKey` se resuelven mediante la superficie estándar de SecretRef; consulta [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
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
          realtime: { enabled: false /* see Realtime voice conversations */ },
        },
      },
    },
  },
}
```

### Referencia de configuración

Claves de nivel superior en `plugins.entries.voice-call.config` no mostradas arriba:

| Clave                           | Predeterminado | Notas                                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `enabled`                       | `false`        | Interruptor maestro de activación/desactivación.                                           |
| `inboundPolicy`                 | `"disabled"`   | `disabled` \| `allowlist` \| `pairing` \| `open`. Consulta [Llamadas entrantes](#inbound-calls). |
| `allowFrom`                     | `[]`           | Lista de permitidos E.164 para `inboundPolicy: "allowlist"`.                               |
| `maxDurationSeconds`            | `300`          | Límite estricto de duración por llamada, aplicado independientemente del estado de respuesta. |
| `staleCallReaperSeconds`        | `120`          | Consulta [Recolector de llamadas obsoletas](#stale-call-reaper). `0` lo desactiva.         |
| `silenceTimeoutMs`              | `800`          | Detección de silencio de fin de habla para el flujo clásico (no realtime).                 |
| `transcriptTimeoutMs`           | `180000`       | Espera máxima de una transcripción del llamante antes de abandonar un turno.               |
| `ringTimeoutMs`                 | `30000`        | Tiempo de espera de timbrado para llamadas salientes.                                      |
| `maxConcurrentCalls`            | `1`            | Las llamadas salientes que superen este límite se rechazan.                                |
| `outbound.notifyHangupDelaySec` | `3`            | Segundos de espera después de TTS antes de colgar automáticamente en modo de notificación.  |
| `skipSignatureVerification`     | `false`        | Solo para pruebas locales; nunca lo habilites en producción.                               |
| `store`                         | sin definir    | Sobrescribe la ruta predeterminada del registro de llamadas `~/.openclaw/voice-calls`.     |
| `agentId`                       | `"main"`       | Agente usado para la generación de respuestas y el almacenamiento de sesiones.             |
| `responseModel`                 | sin definir    | Sobrescribe el modelo predeterminado para respuestas clásicas (no realtime).               |
| `responseSystemPrompt`          | generado       | Prompt del sistema personalizado para respuestas clásicas.                                 |
| `responseTimeoutMs`             | `30000`        | Tiempo de espera para la generación de respuestas clásicas (ms).                           |

<AccordionGroup>
  <Accordion title="Notas de exposición y seguridad del proveedor">
    - Twilio, Telnyx y Plivo requieren todos una URL de webhook **accesible públicamente**.
    - `mock` es un proveedor de desarrollo local (sin llamadas de red).
    - Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` sea true.
    - `skipSignatureVerification` es solo para pruebas locales.
    - En la capa gratuita de ngrok, establece `publicUrl` en la URL exacta de ngrok; la verificación de firma siempre se aplica.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es loopback (agente local de ngrok). Solo desarrollo local.
    - Las URL de la capa gratuita de Ngrok pueden cambiar o añadir comportamiento intersticial; si `publicUrl` cambia, las firmas de Twilio fallan. Producción: prefiere un dominio estable o un túnel Tailscale.

  </Accordion>
  <Accordion title="Límites de conexión de streaming">
    - `streaming.preStartTimeoutMs` (predeterminado `5000`) cierra sockets que nunca envían un frame `start` válido.
    - `streaming.maxPendingConnections` (predeterminado `32`) limita el total de sockets previos al inicio no autenticados.
    - `streaming.maxPendingConnectionsPerIp` (predeterminado `4`) limita los sockets previos al inicio no autenticados por IP de origen.
    - `streaming.maxConnections` (predeterminado `128`) limita todos los sockets de media stream abiertos (pendientes + activos).

  </Accordion>
  <Accordion title="Migraciones de configuración heredada">
    El análisis de configuración normaliza estas claves heredadas automáticamente y registra una advertencia que nombra la ruta de reemplazo; el shim se eliminará en una versión futura (`2026.6.0`), así que ejecuta `openclaw doctor --fix` para reescribir la configuración confirmada a la forma canónica:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` se elimina (el contexto realtime ahora usa el prompt de agente generado)

  </Accordion>
</AccordionGroup>

## Ámbito de sesión

De forma predeterminada, Voice Call usa `sessionScope: "per-phone"` para que las llamadas repetidas del mismo llamante conserven la memoria de la conversación. Establece `sessionScope: "per-call"` cuando cada llamada del operador deba empezar con contexto nuevo, por ejemplo en flujos de recepción, reservas, IVR o puente de Google Meet donde el mismo número de teléfono puede representar distintas reuniones.

Voice Call almacena las claves de sesión generadas en el espacio de nombres del agente configurado (`agent:<agentId>:voice:*`). Las claves de integración explícitas sin procesar se resuelven en el mismo espacio de nombres: una clave canónica `agent:<configuredAgentId>:*` conserva ese propietario y respeta el alias de `session.mainKey`/ámbito global del núcleo; la entrada `agent:*` externa o malformada se delimita como una clave opaca dentro del agente configurado; `global` y `unknown` siguen siendo centinelas globales.

## Conversaciones de voz realtime

`realtime` selecciona un proveedor de voz realtime full-duplex para audio de llamada en vivo. Está separado de `streaming`, que solo reenvía audio a proveedores de transcripción realtime.

<Warning>
`realtime.enabled` no puede combinarse con `streaming.enabled`. Elige un modo de audio por llamada.
</Warning>

Comportamiento actual del runtime:

- `realtime.enabled` es compatible con Twilio y Telnyx.
- `realtime.provider` es opcional. Si no se establece, Voice Call usa el primer proveedor de voz en tiempo real registrado.
- Proveedores de voz en tiempo real incluidos: Google Gemini Live (`google`) y OpenAI (`openai`), registrados por sus Plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `realtime.providers.<providerId>`.
- Voice Call expone de forma predeterminada la herramienta compartida en tiempo real `openclaw_agent_consult`. El modelo en tiempo real puede llamarla cuando la persona que llama pide razonamiento más profundo, información actual o herramientas normales de OpenClaw.
- `realtime.consultPolicy` agrega opcionalmente orientación sobre cuándo el modelo en tiempo real debe llamar a `openclaw_agent_consult`.
- `realtime.agentContext.enabled` está desactivado de forma predeterminada. Cuando está activado, Voice Call inyecta una identidad de agente acotada y una cápsula seleccionada de archivos del espacio de trabajo en las instrucciones del proveedor en tiempo real al configurar la sesión.
- `realtime.fastContext.enabled` está desactivado de forma predeterminada. Cuando está activado, Voice Call primero busca contexto de memoria/sesión indexado para la pregunta de consulta y devuelve esos fragmentos al modelo en tiempo real dentro de `realtime.fastContext.timeoutMs` antes de recurrir al agente de consulta completo solo si `realtime.fastContext.fallbackToConsult` es true.
- Si `realtime.provider` apunta a un proveedor no registrado, o si no hay ningún proveedor de voz en tiempo real registrado, Voice Call registra una advertencia y omite los medios en tiempo real en lugar de hacer fallar todo el Plugin.
- `inboundPolicy` no debe ser `"disabled"` cuando `realtime.enabled` es true; `validateProviderConfig` rechaza esa combinación.
- Las claves de sesión de consulta reutilizan la sesión de llamada almacenada cuando está disponible y luego recurren al `sessionScope` configurado (`per-phone` de forma predeterminada, o `per-call` para llamadas aisladas).

### Política de herramientas

`realtime.toolPolicy` controla la ejecución de consulta:

| Política        | Comportamiento                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expone la herramienta de consulta y limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`. |
| `owner`         | Expone la herramienta de consulta y permite que el agente normal use la política normal de herramientas del agente.                      |
| `none`          | No expone la herramienta de consulta. Las `realtime.tools` personalizadas siguen pasándose al proveedor en tiempo real.                  |

`realtime.consultPolicy` controla solo las instrucciones del modelo en tiempo real:

| Política      | Orientación                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------- |
| `auto`        | Mantén el prompt predeterminado y deja que el proveedor decida cuándo llamar a la herramienta de consulta. |
| `substantive` | Responde directamente a enlaces conversacionales simples y consulta antes de hechos, memoria, herramientas o contexto. |
| `always`      | Consulta antes de cada respuesta sustantiva.                                                   |

### Contexto de voz del agente

Activa `realtime.agentContext` cuando el puente de voz debe sonar como el
agente de OpenClaw configurado sin pagar una ida y vuelta completa de consulta
al agente en turnos ordinarios. La cápsula de contexto se agrega una vez cuando
se crea la sesión en tiempo real, por lo que no añade latencia por turno. Las
llamadas a `openclaw_agent_consult` siguen ejecutando el agente completo de
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
    Valores predeterminados: clave de API de `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    o `GOOGLE_API_KEY`; modelo `gemini-2.5-flash-native-audio-preview-12-2025`;
    voz `Kore`. `sessionResumption` y `contextWindowCompression` están activados
    de forma predeterminada para llamadas más largas y reconectables. Usa
    `silenceDurationMs`, `startSensitivity` y `endSensitivity` para ajustar una
    toma de turnos más rápida en audio telefónico.

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

Consulta [Proveedor de Google](/es/providers/google) y
[Proveedor de OpenAI](/es/providers/openai) para opciones de voz en tiempo real
específicas del proveedor.

## Transcripción en streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para audio de llamadas en vivo.

Comportamiento actual en tiempo de ejecución:

- `streaming.provider` es opcional. Si no se establece, Voice Call usa el primer proveedor de transcripción en tiempo real registrado.
- Proveedores de transcripción en tiempo real incluidos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI (`xai`), registrados por sus Plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `streaming.providers.<providerId>`.
- Después de que Twilio envía un mensaje `start` de stream aceptado, Voice Call registra el stream de inmediato, encola los medios entrantes a través del proveedor de transcripción mientras el proveedor se conecta e inicia el saludo inicial solo después de que la transcripción en tiempo real esté lista.
- Si `streaming.provider` apunta a un proveedor no registrado, o si no hay ninguno registrado, Voice Call registra una advertencia y omite el streaming de medios en lugar de hacer fallar todo el Plugin.

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
    Valores predeterminados: clave de API `streaming.providers.xai.apiKey` o `XAI_API_KEY` (recurre
    a un perfil de autenticación OAuth de xAI si no se establece ninguno); endpoint
    `wss://api.x.ai/v1/stt`; codificación `mulaw`; frecuencia de muestreo `8000`;
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

Voice Call usa la configuración principal `messages.tts` para voz en streaming en
llamadas. Puedes sobrescribirla en la configuración del Plugin con la **misma forma**:
se fusiona en profundidad con `messages.tts`.

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
**Microsoft speech se ignora para llamadas de voz.** La síntesis telefónica requiere
un proveedor que implemente salida orientada a telefonía; el proveedor Microsoft speech
no lo hace, por lo que se omite para llamadas y se prueban en su lugar otros proveedores
de la cadena de fallback.
</Warning>

Notas de comportamiento:

- Las claves heredadas `tts.<provider>` dentro de la configuración del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) son reparadas por `openclaw doctor --fix`; la configuración confirmada debe usar `tts.providers.<provider>`.
- Core TTS se usa cuando el streaming de medios de Twilio está activado; de lo contrario, las llamadas recurren a voces nativas del proveedor.
- Si un stream de medios de Twilio ya está activo, Voice Call no recurre a TwiML `<Say>`. Si TTS telefónico no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando TTS telefónico recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.
- Cuando la interrupción por voz de Twilio o el desmontaje del stream limpia la cola pendiente de TTS, las solicitudes de reproducción encoladas se resuelven en lugar de dejar colgadas a las personas que llaman esperando que termine la reproducción.

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

La política de llamadas entrantes tiene el valor predeterminado `disabled`. Para activar las llamadas entrantes, establece:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` es una pantalla de identificador de llamadas de baja garantía. El Plugin
normaliza el valor `From` suministrado por el proveedor y lo compara con `allowFrom`.
La verificación de Webhook autentica la entrega del proveedor y la integridad de la carga útil,
pero **no** prueba la propiedad del número de llamada PSTN/VoIP. Trata
`allowFrom` como filtrado de identificador de llamadas, no como identidad sólida de la persona que llama.
</Warning>

Las respuestas automáticas usan el sistema de agentes. Ajústalas con `responseModel`,
`responseSystemPrompt` y `responseTimeoutMs`.

### Enrutamiento por número

Usa `numbers` cuando un Plugin de Voice Call recibe llamadas para varios números de teléfono
y cada número debe comportarse como una línea diferente. Por ejemplo,
un número puede usar un asistente personal informal mientras otro usa una personalidad
empresarial, un agente de respuesta diferente y una voz TTS diferente.

Las rutas se seleccionan a partir del número marcado `To` suministrado por el proveedor. Las claves deben
ser números E.164. Cuando llega una llamada, Voice Call resuelve la ruta
coincidente una vez, almacena la ruta coincidente en el registro de la llamada y reutiliza esa
configuración efectiva para el saludo, la ruta clásica de respuesta automática, la ruta de consulta
en tiempo real y la reproducción TTS. Si ninguna ruta coincide, se usa la configuración global
de Voice Call. Las llamadas salientes no usan `numbers`; pasa el destino saliente,
el mensaje y la sesión explícitamente al iniciar la llamada.

Las anulaciones de ruta admiten actualmente:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

El valor de ruta `tts` se fusiona en profundidad sobre la configuración global `tts` de Voice Call, por lo que
normalmente puedes anular solo la voz del proveedor:

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

Para las respuestas automáticas, Voice Call añade al prompt del sistema un contrato estricto de salida hablada
que requiere una respuesta JSON `{"spoken":"..."}`. Voice Call
extrae el texto hablado de forma defensiva:

- Ignora cargas útiles marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON delimitado o claves `"spoken"` en línea.
- Recurre a texto sin formato y elimina posibles párrafos iniciales de planificación/meta.

Esto mantiene la reproducción hablada centrada en texto dirigido a la persona que llama y evita filtrar
texto de planificación al audio.

### Comportamiento de inicio de conversación

Para llamadas salientes `conversation`, la gestión del primer mensaje está vinculada al estado de reproducción
en vivo:

- La limpieza de cola por interrupción y la respuesta automática se suprimen solo mientras el saludo inicial se está pronunciando activamente.
- Si la reproducción inicial falla, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para reintento.
- La reproducción inicial para streaming de Twilio empieza al conectar el stream sin demora adicional.
- La interrupción aborta la reproducción activa y limpia las entradas TTS de Twilio en cola pero aún no reproducidas. Las entradas limpiadas se resuelven como omitidas, por lo que la lógica de respuesta posterior puede continuar sin esperar audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el turno inicial propio del stream en tiempo real. Voice Call **no** publica una actualización TwiML `<Say>` heredada para ese mensaje inicial, por lo que las sesiones salientes `<Connect><Stream>` permanecen adjuntas.

### Gracia de desconexión de stream de Twilio

Cuando un stream de medios de Twilio se desconecta, Voice Call espera **2000 ms** antes de
finalizar automáticamente la llamada:

- Si el stream se reconecta durante esa ventana, se cancela el cierre automático.
- Si ningún stream se vuelve a registrar después del periodo de gracia, la llamada se finaliza para evitar llamadas activas atascadas.

## Recolector de llamadas obsoletas

Usa `staleCallReaperSeconds` (predeterminado **120**) para finalizar llamadas que nunca son
contestadas y nunca alcanzan un estado de conversación en vivo, por ejemplo llamadas de modo notificación
en las que el proveedor nunca entrega un Webhook terminal. Configúralo en `0` para
deshabilitarlo.

El recolector se ejecuta cada 30 segundos y solo finaliza llamadas que no tienen marca de tiempo
`answeredAt` y que no están ya en un estado terminal o en vivo
(`speaking`/`listening`), por lo que las conversaciones contestadas nunca son recolectadas
por este temporizador; `maxDurationSeconds` (predeterminado 300) es el límite separado que
finaliza llamadas contestadas que duran demasiado.

Para flujos de estilo notificación en los que los operadores pueden tardar en entregar Webhooks
de timbrado/respuesta, eleva `staleCallReaperSeconds` por encima del valor predeterminado para que las llamadas
lentas pero normales no se recolecten antes de tiempo; `120`-`300` segundos es un rango razonable
de producción.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Seguridad de Webhook

Cuando un proxy o túnel se sitúa delante del Gateway, el Plugin reconstruye
la URL pública para la verificación de firma. Estas opciones controlan qué
encabezados reenviados son de confianza:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts de lista permitida desde encabezados de reenvío.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confiar en encabezados reenviados sin lista permitida.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confiar en encabezados reenviados solo cuando la IP remota de la solicitud coincide con la lista.
</ParamField>

Protecciones adicionales:

- La **protección contra repetición** de Webhook está habilitada para Twilio, Telnyx y Plivo. Las solicitudes de Webhook válidas repetidas se confirman, pero se omiten sus efectos secundarios.
- Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada `<Gather>`, por lo que las devoluciones de voz obsoletas/repetidas no pueden satisfacer un turno de transcripción pendiente más reciente.
- Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los encabezados de firma requeridos por el proveedor.
- El Webhook de voice-call usa el perfil compartido de lectura de cuerpo previa a la autenticación (cuerpo máximo de 64 KB, tiempo de espera de lectura de 5 segundos) más un límite en curso por clave (8 solicitudes concurrentes por clave de forma predeterminada) antes de la verificación de firma.

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

Cuando el Gateway ya está en ejecución, los comandos operativos `voicecall`
delegan en el runtime de voice-call propiedad del Gateway para que la CLI no enlace un
segundo servidor de Webhook. Si no se puede alcanzar ningún Gateway, los comandos recurren a
un runtime de CLI independiente.

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de voice-call. Usa
`--file <path>` para apuntar a un registro diferente y `--last <n>` para limitar
el análisis a los últimos N registros (predeterminado 200). La salida incluye min/max/promedio,
p50 y p95 para la latencia de turno y los tiempos de espera de escucha.

## Herramienta de agente

Nombre de herramienta: `voice_call`.

| Acción          | Argumentos                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

El Plugin de voice-call incluye una skill de agente correspondiente.

## RPC de Gateway

| Método                      | Argumentos                                                      | Notas                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Recurre a la configuración `toNumber` cuando se omite `to`.               |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Igual que `initiate`, pero también acepta `dtmfSequence` antes de conectar. |
| `voicecall.continue`        | `callId`, `message`                                              | Bloquea hasta que se resuelve el turno; devuelve la transcripción.        |
| `voicecall.continue.start`  | `callId`, `message`                                              | Variante asíncrona: devuelve un `operationId` inmediatamente.             |
| `voicecall.continue.result` | `operationId`                                                    | Sondea una operación `voicecall.continue.start` pendiente para obtener su resultado. |
| `voicecall.speak`           | `callId`, `message`                                              | Habla sin esperar; usa el puente en tiempo real cuando `realtime.enabled`. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | Omite `callId` para listar todas las llamadas activas.                    |

`dtmfSequence` solo es válido con `mode: "conversation"`; las llamadas en modo notificación
deben usar `voicecall.dtmf` después de que exista la llamada si necesitan dígitos posteriores a la conexión.

## Solución de problemas

### La configuración falla al exponer el Webhook

Ejecuta la configuración desde el mismo entorno que ejecuta el Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Para `twilio`, `telnyx` y `plivo`, `webhook-exposure` debe estar en verde. Un
`publicUrl` configurado sigue fallando cuando apunta a espacio de red local o privado,
porque el operador no puede llamar de vuelta a esas direcciones.
No uses `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` u otros rangos de NAT
de nivel operador como `publicUrl`.

Las llamadas salientes de Twilio en modo notificación envían su TwiML `<Say>` inicial directamente
en la solicitud de creación de llamada, por lo que el primer mensaje hablado no depende de que
Twilio obtenga TwiML desde el Webhook. Aun así se requiere un Webhook público para callbacks
de estado, llamadas de conversación, DTMF previo a la conexión, streams en tiempo real y
control de llamada posterior a la conexión.

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

`voicecall smoke` es una ejecución en seco salvo que pases `--yes`.

### Fallan las credenciales del proveedor

Comprueba el proveedor seleccionado y los campos de credenciales requeridos:

- Twilio: `twilio.accountSid`, `twilio.authToken` y `fromNumber`, o
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` y
  `fromNumber`, o `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` y
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` y `fromNumber`, o
  `PLIVO_AUTH_ID` y `PLIVO_AUTH_TOKEN`.

Las credenciales deben existir en el host del Gateway. Editar un perfil de shell local
no afecta a un Gateway que ya está en ejecución hasta que se reinicie o vuelva a cargar su
entorno.

### Las llamadas se inician, pero los Webhooks del proveedor no llegan

Confirma que la consola del proveedor apunte a la URL pública exacta del Webhook:

```text
https://voice.example.com/voice/webhook
```

Luego inspecciona el estado en tiempo de ejecución:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causas comunes:

- `publicUrl` apunta a una ruta distinta de `serve.path`.
- La URL del túnel cambió después de que se iniciara el Gateway.
- Un proxy reenvía la solicitud, pero elimina o reescribe los encabezados de host/proto.
- El firewall o el DNS enrutan el nombre de host público a un lugar distinto del Gateway.
- El Gateway se reinició sin el Plugin Voice Call habilitado.

Cuando hay un proxy inverso o un túnel delante del Gateway, configura
`webhookSecurity.allowedHosts` con el nombre de host público, o usa
`webhookSecurity.trustedProxyIPs` para una dirección de proxy conocida. Usa
`webhookSecurity.trustForwardingHeaders` solo cuando el límite del proxy esté
bajo tu control.

### La verificación de firma falla

Las firmas del proveedor se comprueban contra la URL pública que OpenClaw reconstruye
a partir de la solicitud entrante. Si las firmas fallan:

- Confirma que la URL del Webhook del proveedor coincida exactamente con `publicUrl`, incluido el esquema, el host y la ruta.
- Para las URL de nivel gratuito de ngrok, actualiza `publicUrl` cuando cambie el nombre de host del túnel.
- Asegúrate de que el proxy conserve los encabezados originales de host y proto, o configura `webhookSecurity.allowedHosts`.
- No habilites `skipSignatureVerification` fuera de las pruebas locales.

### Fallan las uniones de Google Meet con Twilio

Google Meet usa este Plugin para uniones por llamada entrante de Twilio. Primero verifica Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Luego verifica explícitamente el transporte de Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call está en verde pero el participante de Meet nunca se une, revisa el número de
llamada entrante de Meet, el PIN y `--dtmf-sequence`. La llamada telefónica puede estar sana
mientras la reunión rechaza o ignora una secuencia DTMF incorrecta.

Google Meet inicia el tramo telefónico de Twilio mediante `voicecall.start` con una
secuencia DTMF previa a la conexión. Las secuencias derivadas del PIN incluyen
`voiceCall.dtmfDelayMs` del Plugin Google Meet (valor predeterminado **12000 ms**) como dígitos
de espera iniciales de Twilio, porque los mensajes de llamada entrante de Meet pueden llegar tarde. Luego Voice Call
redirige de vuelta al manejo en tiempo real antes de que se solicite el saludo introductorio.

Usa `openclaw logs --follow` para el rastro en vivo de la fase. Una unión sana a Twilio Meet
registra este orden:

- Google Meet delega la unión de Twilio a Voice Call.
- Voice Call almacena el TwiML DTMF previo a la conexión.
- El TwiML inicial de Twilio se consume y se sirve antes del manejo en tiempo real.
- Voice Call sirve TwiML en tiempo real para la llamada de Twilio.
- Google Meet solicita el discurso introductorio con `voicecall.speak` después del retardo posterior a DTMF.

`openclaw voicecall tail` aún muestra registros de llamadas persistidos; es útil para
el estado de la llamada y las transcripciones, pero no todas las transiciones de Webhook/en tiempo real
aparecen allí.

### La llamada en tiempo real no tiene voz

Confirma que solo haya un modo de audio habilitado: `realtime.enabled` y
`streaming.enabled` no pueden ser ambos `true`.

Para llamadas Twilio/Telnyx en tiempo real, verifica también:

- Hay un Plugin proveedor en tiempo real cargado y registrado.
- `realtime.provider` no está definido o nombra un proveedor registrado.
- La clave de API del proveedor está disponible para el proceso del Gateway.
- `openclaw logs --follow` muestra que se sirvió TwiML en tiempo real, que se inició el puente en tiempo real y que se puso en cola el saludo inicial.

## Relacionado

- [Modo conversación](/es/nodes/talk)
- [Texto a voz](/es/tools/tts)
- [Activación por voz](/es/nodes/voicewake)
