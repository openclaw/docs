---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Está configurando o desarrollando el Plugin de llamadas de voz
    - Necesitas voz en tiempo real o transcripción en streaming para telefonía
sidebarTitle: Voice call
summary: Realiza llamadas de voz salientes y acepta llamadas de voz entrantes a través de Twilio, Telnyx o Plivo, con voz en tiempo real opcional y transcripción en streaming
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-05-02T22:21:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

Llamadas de voz para OpenClaw mediante un Plugin. Admite notificaciones salientes,
conversaciones de varios turnos, voz en tiempo real full-duplex, transcripción
en streaming y llamadas entrantes con políticas de lista de permitidos.

**Proveedores actuales:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transferencia XML + GetInput
speech), `mock` (desarrollo/sin red).

<Note>
El Plugin Voice Call se ejecuta **dentro del proceso Gateway**. Si usas un
Gateway remoto, instala y configura el Plugin en la máquina que ejecuta
el Gateway y luego reinicia el Gateway para cargarlo.
</Note>

## Inicio rápido

<Steps>
  <Step title="Instalar el Plugin">
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

    Usa el paquete sin versión para seguir la etiqueta de la versión oficial actual. Fija una
    versión exacta solo cuando necesites una instalación reproducible.

    Reinicia el Gateway después para que el Plugin se cargue.

  </Step>
  <Step title="Configurar proveedor y webhook">
    Define la configuración en `plugins.entries.voice-call.config` (consulta
    [Configuración](#configuration) abajo para ver la estructura completa). Como mínimo:
    `provider`, credenciales del proveedor, `fromNumber` y una URL de webhook
    accesible públicamente.
  </Step>
  <Step title="Verificar la configuración">
    ```bash
    openclaw voicecall setup
    ```

    La salida predeterminada es legible en registros de chat y terminales. Comprueba
    la activación del Plugin, las credenciales del proveedor, la exposición del webhook y que
    solo un modo de audio (`streaming` o `realtime`) esté activo. Usa
    `--json` para scripts.

  </Step>
  <Step title="Prueba de humo">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambas son ejecuciones de prueba de forma predeterminada. Agrega `--yes` para realizar realmente una llamada
    saliente breve de notificación:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx y Plivo, la configuración debe resolverse a una **URL de webhook pública**.
Si `publicUrl`, la URL del túnel, la URL de Tailscale o la alternativa de servicio
se resuelven a loopback o a un espacio de red privada, la configuración falla en lugar de
iniciar un proveedor que no pueda recibir webhooks de operadores.
</Warning>

## Configuración

Si `enabled: true` pero al proveedor seleccionado le faltan credenciales,
el inicio del Gateway registra una advertencia de configuración incompleta con las claves faltantes y
omite el inicio del runtime. Los comandos, las llamadas RPC y las herramientas de agente todavía
devuelven la configuración exacta faltante del proveedor cuando se usan.

<Note>
Las credenciales de voice-call aceptan SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` y `plugins.entries.voice-call.config.tts.providers.*.apiKey` se resuelven mediante la superficie estándar de SecretRef; consulta [superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
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
  <Accordion title="Notas de exposición y seguridad del proveedor">
    - Twilio, Telnyx y Plivo requieren una URL de webhook **accesible públicamente**.
    - `mock` es un proveedor local de desarrollo (sin llamadas de red).
    - Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` sea true.
    - `skipSignatureVerification` es solo para pruebas locales.
    - En el nivel gratuito de ngrok, define `publicUrl` como la URL exacta de ngrok; la verificación de firmas siempre se aplica.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es loopback (agente local de ngrok). Solo desarrollo local.
    - Las URL del nivel gratuito de Ngrok pueden cambiar o agregar un comportamiento intersticial; si `publicUrl` se desvía, las firmas de Twilio fallan. Producción: prefiere un dominio estable o un funnel de Tailscale.

  </Accordion>
  <Accordion title="Límites de conexión de streaming">
    - `streaming.preStartTimeoutMs` cierra sockets que nunca envían un frame `start` válido.
    - `streaming.maxPendingConnections` limita el total de sockets previos al inicio sin autenticar.
    - `streaming.maxPendingConnectionsPerIp` limita los sockets previos al inicio sin autenticar por IP de origen.
    - `streaming.maxConnections` limita el total de sockets de flujo multimedia abiertos (pendientes + activos).

  </Accordion>
  <Accordion title="Migraciones de configuración heredada">
    Las configuraciones más antiguas que usan `provider: "log"`, `twilio.from` o claves heredadas
    `streaming.*` de OpenAI son reescritas por `openclaw doctor --fix`.
    La alternativa del runtime todavía acepta las claves antiguas de voice-call por ahora, pero
    la ruta de reescritura es `openclaw doctor --fix` y la capa de compatibilidad es
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
mismo interlocutor conserven la memoria de conversación. Define `sessionScope: "per-call"` cuando
cada llamada del operador deba comenzar con contexto nuevo, por ejemplo en flujos de recepción,
reservas, IVR o puente de Google Meet donde el mismo número de teléfono puede
representar reuniones distintas.

## Conversaciones de voz en tiempo real

`realtime` selecciona un proveedor de voz en tiempo real full-duplex para el audio
de llamada en vivo. Es independiente de `streaming`, que solo reenvía audio a
proveedores de transcripción en tiempo real.

<Warning>
`realtime.enabled` no se puede combinar con `streaming.enabled`. Elige un
modo de audio por llamada.
</Warning>

Comportamiento actual del runtime:

- `realtime.enabled` es compatible con Twilio Media Streams.
- `realtime.provider` es opcional. Si no se define, Voice Call usa el primer proveedor de voz en tiempo real registrado.
- Proveedores de voz en tiempo real incluidos: Google Gemini Live (`google`) y OpenAI (`openai`), registrados por sus Plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `realtime.providers.<providerId>`.
- Voice Call expone de forma predeterminada la herramienta compartida en tiempo real `openclaw_agent_consult`. El modelo en tiempo real puede llamarla cuando el interlocutor pide razonamiento más profundo, información actual o herramientas normales de OpenClaw.
- `realtime.fastContext.enabled` está desactivado de forma predeterminada. Cuando está activado, Voice Call primero busca en la memoria indexada o en el contexto de sesión la pregunta de consulta y devuelve esos fragmentos al modelo en tiempo real dentro de `realtime.fastContext.timeoutMs` antes de recurrir al agente de consulta completo solo si `realtime.fastContext.fallbackToConsult` es true.
- Si `realtime.provider` apunta a un proveedor no registrado, o si no hay ningún proveedor de voz en tiempo real registrado, Voice Call registra una advertencia y omite los medios en tiempo real en lugar de hacer fallar todo el Plugin.
- Las claves de sesión de consulta reutilizan la sesión de llamada almacenada cuando está disponible y luego recurren al `sessionScope` configurado (`per-phone` de forma predeterminada, o `per-call` para llamadas aisladas).

### Política de herramientas

`realtime.toolPolicy` controla la ejecución de consulta:

| Política        | Comportamiento                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expone la herramienta de consulta y limita el agente regular a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`. |
| `owner`          | Expone la herramienta de consulta y permite que el agente regular use la política normal de herramientas del agente.                    |
| `none`           | No expone la herramienta de consulta. Las `realtime.tools` personalizadas todavía se pasan al proveedor en tiempo real.                 |

### Ejemplos de proveedores en tiempo real

<Tabs>
  <Tab title="Google Gemini Live">
    Valores predeterminados: clave de API desde `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` o `GOOGLE_GENERATIVE_AI_API_KEY`; modelo
    `gemini-2.5-flash-native-audio-preview-12-2025`; voz `Kore`.

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

Consulta [proveedor Google](/es/providers/google) y
[proveedor OpenAI](/es/providers/openai) para opciones de voz en tiempo real
específicas del proveedor.

## Transcripción en streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para el audio de llamada en vivo.

Comportamiento actual del runtime:

- `streaming.provider` es opcional. Si no se define, Voice Call usa el primer proveedor de transcripción en tiempo real registrado.
- Proveedores de transcripción en tiempo real incluidos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI (`xai`), registrados por sus Plugins proveedores.
- La configuración sin procesar propiedad del proveedor vive en `streaming.providers.<providerId>`.
- Después de que Twilio envía un mensaje `start` de stream aceptado, Voice Call registra el stream inmediatamente, encola los medios entrantes a través del proveedor de transcripción mientras el proveedor se conecta e inicia el saludo inicial solo después de que la transcripción en tiempo real esté lista.
- Si `streaming.provider` apunta a un proveedor no registrado, o no hay ninguno registrado, Voice Call registra una advertencia y omite el streaming de medios en lugar de hacer fallar todo el Plugin.

### Ejemplos de proveedor de streaming

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

Voice Call usa la configuración principal `messages.tts` para el streaming de
voz en llamadas. Puedes sobrescribirla bajo la configuración del Plugin con la
**misma forma**; se fusiona en profundidad con `messages.tts`.

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
**La voz de Microsoft se ignora para las llamadas de voz.** El audio de telefonía necesita PCM;
el transporte actual de Microsoft no expone salida PCM de telefonía.
</Warning>

Notas de comportamiento:

- Las claves heredadas `tts.<provider>` dentro de la configuración del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) se reparan con `openclaw doctor --fix`; la configuración confirmada debe usar `tts.providers.<provider>`.
- El TTS principal se usa cuando el streaming de medios de Twilio está habilitado; de lo contrario, las llamadas recurren a voces nativas del proveedor.
- Si un stream de medios de Twilio ya está activo, Voice Call no recurre a TwiML `<Say>`. Si el TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS de telefonía recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.
- Cuando la interrupción por voz o el desmontaje del stream de Twilio vacía la cola TTS pendiente, las solicitudes de reproducción encoladas se resuelven en lugar de dejar a los llamantes esperando a que termine la reproducción.

### Ejemplos de TTS

<Tabs>
  <Tab title="Core TTS only">
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

La política entrante usa `disabled` de forma predeterminada. Para habilitar llamadas entrantes, define:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` es un filtro de identificador de llamada de baja garantía. El
Plugin normaliza el valor `From` suministrado por el proveedor y lo compara con
`allowFrom`. La verificación del Webhook autentica la entrega del proveedor y la
integridad del payload, pero **no** demuestra la propiedad del número de llamada
PSTN/VoIP. Trata `allowFrom` como filtrado de identificador de llamada, no como una
identidad fuerte del llamante.
</Warning>

Las respuestas automáticas usan el sistema de agentes. Ajústalas con `responseModel`,
`responseSystemPrompt` y `responseTimeoutMs`.

### Enrutamiento por número

Usa `numbers` cuando un Plugin Voice Call recibe llamadas para varios números de
teléfono y cada número debe comportarse como una línea diferente. Por ejemplo, un
número puede usar un asistente personal informal mientras otro usa una identidad de
negocio, un agente de respuesta diferente y una voz TTS diferente.

Las rutas se seleccionan a partir del número marcado `To` suministrado por el proveedor. Las claves deben ser
números E.164. Cuando llega una llamada, Voice Call resuelve la ruta coincidente una vez,
guarda la ruta coincidente en el registro de la llamada y reutiliza esa configuración efectiva
para el saludo, la ruta clásica de respuesta automática, la ruta de consulta en tiempo real y la reproducción
TTS. Si no coincide ninguna ruta, se usa la configuración global de Voice Call.
Las llamadas salientes no usan `numbers`; pasa explícitamente el destino saliente, el mensaje y la
sesión al iniciar la llamada.

Las sobrescrituras de ruta admiten actualmente:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

El valor de ruta `tts` se fusiona en profundidad sobre la configuración global `tts` de Voice Call, por lo que
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

Voice Call extrae el texto hablado de forma defensiva:

- Ignora los payloads marcados como contenido de razonamiento/error.
- Analiza JSON directo, JSON vallado o claves `"spoken"` en línea.
- Recurre a texto plano y elimina párrafos iniciales que probablemente sean de planificación/metadatos.

Esto mantiene la reproducción hablada centrada en texto dirigido al llamante y evita
filtrar texto de planificación al audio.

### Comportamiento de inicio de conversación

Para llamadas `conversation` salientes, el manejo del primer mensaje está vinculado al estado de reproducción
en vivo:

- La limpieza de la cola por interrupción de voz y la respuesta automática se suprimen solo mientras el saludo inicial se está reproduciendo activamente.
- Si la reproducción inicial falla, la llamada vuelve a `listening` y el mensaje inicial permanece encolado para reintentarse.
- La reproducción inicial para streaming de Twilio comienza al conectarse el stream, sin demora adicional.
- La interrupción por voz aborta la reproducción activa y limpia entradas TTS de Twilio encoladas pero aún no en reproducción. Las entradas limpiadas se resuelven como omitidas, de modo que la lógica de respuesta de seguimiento puede continuar sin esperar audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el turno inicial propio del stream en tiempo real. Voice Call **no** publica una actualización TwiML `<Say>` heredada para ese mensaje inicial, por lo que las sesiones salientes `<Connect><Stream>` permanecen adjuntas.

### Periodo de gracia de desconexión del stream de Twilio

Cuando se desconecta un stream de medios de Twilio, Voice Call espera **2000 ms** antes de
finalizar automáticamente la llamada:

- Si el stream se reconecta durante esa ventana, la finalización automática se cancela.
- Si ningún stream vuelve a registrarse después del periodo de gracia, la llamada se finaliza para evitar llamadas activas atascadas.

## Recolector de llamadas obsoletas

Usa `staleCallReaperSeconds` para finalizar llamadas que nunca reciben un Webhook
terminal (por ejemplo, llamadas en modo de notificación que nunca se completan). El valor predeterminado
es `0` (deshabilitado).

Rangos recomendados:

- **Producción:** `120`-`300` segundos para flujos de estilo notificación.
- Mantén este valor **por encima de `maxDurationSeconds`** para que las llamadas normales puedan terminar. Un buen punto de partida es `maxDurationSeconds + 30-60` segundos.

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

Cuando un proxy o túnel se sitúa delante del Gateway, el Plugin
reconstruye la URL pública para la verificación de firma. Estas opciones
controlan qué encabezados reenviados son de confianza:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista de permitidos de hosts de los encabezados de reenvío.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confía en encabezados reenviados sin una lista de permitidos.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confía en encabezados reenviados solo cuando la IP remota de la solicitud coincide con la lista.
</ParamField>

Protecciones adicionales:

- La **protección contra repetición** de Webhook está habilitada para Twilio y Plivo. Las solicitudes de Webhook válidas repetidas se confirman, pero se omiten sus efectos secundarios.
- Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada `<Gather>`, por lo que las devoluciones de llamada de voz obsoletas/repetidas no pueden satisfacer un turno de transcripción pendiente más reciente.
- Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los encabezados de firma requeridos por el proveedor.
- El Webhook de voice-call usa el perfil compartido de cuerpo previo a la autenticación (64 KB / 5 segundos) más un límite por IP de solicitudes en curso antes de la verificación de firma.

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

Cuando el Gateway ya está en ejecución, los comandos operativos `voicecall` delegan
en el runtime de voice-call propiedad del Gateway para que la CLI no vincule un segundo
servidor de Webhook. Si no se puede acceder a ningún Gateway, los comandos recurren a un
runtime de CLI independiente.

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de llamadas de voz.
Usa `--file <path>` para apuntar a un registro distinto y `--last <n>` para limitar
el análisis a los últimos N registros (predeterminado 200). La salida incluye p50/p90/p99
para la latencia de turno y los tiempos de espera de escucha.

## Herramienta del agente

Nombre de la herramienta: `voice_call`.

| Acción          | Argumentos                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Este repositorio incluye un documento de Skills correspondiente en `skills/voice-call/SKILL.md`.

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
porque el operador no puede devolver la llamada a esas direcciones. No uses
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ni `fd00::/8` como `publicUrl`.

Las llamadas salientes de Twilio en modo de notificación envían su TwiML `<Say>` inicial directamente en
la solicitud de creación de llamada, por lo que el primer mensaje hablado no depende de que Twilio
obtenga el TwiML del Webhook. Sigue siendo necesario un Webhook público para devoluciones de llamada de estado,
llamadas de conversación, DTMF previo a la conexión, transmisiones en tiempo real y control de llamada
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

`voicecall smoke` es una ejecución de prueba, salvo que pases `--yes`.

### Fallan las credenciales del proveedor

Comprueba el proveedor seleccionado y los campos de credenciales obligatorios:

- Twilio: `twilio.accountSid`, `twilio.authToken` y `fromNumber`, o
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` y
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` y `fromNumber`.

Las credenciales deben existir en el host del Gateway. Editar un perfil de shell local
no afecta a un Gateway que ya está en ejecución hasta que se reinicia o recarga su
entorno.

### Las llamadas se inician, pero los Webhooks del proveedor no llegan

Confirma que la consola del proveedor apunta a la URL pública exacta del Webhook:

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
- El firewall o DNS enruta el nombre de host público a un lugar distinto del Gateway.
- El Gateway se reinició sin el Plugin Voice Call habilitado.

Cuando hay un proxy inverso o túnel delante del Gateway, establece
`webhookSecurity.allowedHosts` en el nombre de host público, o usa
`webhookSecurity.trustedProxyIPs` para una dirección de proxy conocida. Usa
`webhookSecurity.trustForwardingHeaders` solo cuando el límite del proxy esté bajo
tu control.

### Falla la verificación de firma

Las firmas del proveedor se comprueban contra la URL pública que OpenClaw reconstruye
a partir de la solicitud entrante. Si las firmas fallan:

- Confirma que la URL del Webhook del proveedor coincide exactamente con `publicUrl`, incluidos
  esquema, host y ruta.
- Para las URL de nivel gratuito de ngrok, actualiza `publicUrl` cuando cambie el nombre de host del túnel.
- Asegúrate de que el proxy conserve los encabezados originales de host y proto, o configura
  `webhookSecurity.allowedHosts`.
- No habilites `skipSignatureVerification` fuera de pruebas locales.

### Fallan las uniones de Google Meet con Twilio

Google Meet usa este Plugin para uniones de acceso telefónico con Twilio. Primero verifica Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Luego verifica explícitamente el transporte de Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call está en verde pero el participante de Meet nunca se une, revisa el número de acceso
telefónico de Meet, el PIN y `--dtmf-sequence`. La llamada telefónica puede estar funcionando mientras
la reunión rechaza o ignora una secuencia DTMF incorrecta.

Google Meet pasa la secuencia DTMF de Meet y el texto de introducción a `voicecall.start`.
Para llamadas de Twilio, Voice Call sirve primero el TwiML DTMF, redirige de vuelta al
Webhook y luego abre la transmisión multimedia en tiempo real para que la introducción guardada se genere
después de que el participante telefónico se haya unido a la reunión.

Usa `openclaw logs --follow` para la traza de fase en vivo. Una unión saludable de Twilio a Meet
registra este orden:

- Google Meet delega la unión con Twilio a Voice Call.
- Voice Call almacena el TwiML DTMF previo a la conexión.
- El TwiML inicial de Twilio se consume y se sirve antes del manejo en tiempo real.
- Voice Call sirve TwiML en tiempo real para la llamada de Twilio.
- El puente en tiempo real se inicia con el saludo inicial en cola.

`openclaw voicecall tail` sigue mostrando registros de llamadas persistidos; es útil para
el estado de llamadas y las transcripciones, pero no todas las transiciones de Webhook/tiempo real aparecen
allí.

### La llamada en tiempo real no tiene voz

Confirma que solo haya un modo de audio habilitado. `realtime.enabled` y
`streaming.enabled` no pueden ser ambos verdaderos.

Para llamadas de Twilio en tiempo real, verifica también:

- Hay un Plugin de proveedor en tiempo real cargado y registrado.
- `realtime.provider` no está establecido o nombra un proveedor registrado.
- La clave de API del proveedor está disponible para el proceso del Gateway.
- `openclaw logs --follow` muestra TwiML en tiempo real servido, el puente en tiempo real
  iniciado y el saludo inicial en cola.

## Relacionado

- [Modo de conversación](/es/nodes/talk)
- [Texto a voz](/es/tools/tts)
- [Activación por voz](/es/nodes/voicewake)
