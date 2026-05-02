---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el Plugin de llamadas de voz
    - Necesitas voz en tiempo real o transcripción en flujo continuo para telefonía
sidebarTitle: Voice call
summary: Realiza llamadas de voz salientes y acepta llamadas de voz entrantes mediante Twilio, Telnyx o Plivo, con voz en tiempo real opcional y transcripción en streaming
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-05-02T05:33:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: cde64fa054743d4ed3f146042bd65532af0e9eb5b792b088a856889b3d2cb3c9
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

    Si npm informa que el paquete propiedad de OpenClaw está obsoleto, esa versión
    del paquete pertenece a una línea de paquetes externos más antigua; usa una
    compilación empaquetada actual de OpenClaw o la ruta de la carpeta local hasta
    que se publique un paquete npm más reciente.

    Reinicia el Gateway después para que el plugin se cargue.

  </Step>
  <Step title="Configurar proveedor y webhook">
    Define la configuración en `plugins.entries.voice-call.config` (consulta
    [Configuración](#configuration) más abajo para ver la forma completa). Como mínimo:
    `provider`, las credenciales del proveedor, `fromNumber` y una URL de webhook
    accesible públicamente.
  </Step>
  <Step title="Verificar configuración">
    ```bash
    openclaw voicecall setup
    ```

    La salida predeterminada es legible en registros de chat y terminales. Comprueba
    la habilitación del plugin, las credenciales del proveedor, la exposición del webhook
    y que solo un modo de audio (`streaming` o `realtime`) esté activo. Usa
    `--json` para scripts.

  </Step>
  <Step title="Prueba rápida">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambos son simulaciones de forma predeterminada. Añade `--yes` para realizar realmente
    una llamada saliente breve de notificación:

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
omite iniciar el runtime. Los comandos, las llamadas RPC y las herramientas de agente aún
devuelven la configuración exacta faltante del proveedor cuando se usan.

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
    - En el nivel gratuito de ngrok, define `publicUrl` como la URL exacta de ngrok; la verificación de firma siempre se aplica.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es loopback (agente local de ngrok). Solo desarrollo local.
    - Las URL del nivel gratuito de Ngrok pueden cambiar o añadir comportamiento intersticial; si `publicUrl` se desvía, las firmas de Twilio fallan. Producción: prefiere un dominio estable o un funnel de Tailscale.

  </Accordion>
  <Accordion title="Límites de conexiones de streaming">
    - `streaming.preStartTimeoutMs` cierra sockets que nunca envían un frame `start` válido.
    - `streaming.maxPendingConnections` limita el total de sockets previos al inicio sin autenticar.
    - `streaming.maxPendingConnectionsPerIp` limita los sockets previos al inicio sin autenticar por IP de origen.
    - `streaming.maxConnections` limita el total de sockets abiertos de flujo multimedia (pendientes + activos).

  </Accordion>
  <Accordion title="Migraciones de configuración heredada">
    Las configuraciones antiguas que usan `provider: "log"`, `twilio.from` o claves
    heredadas de OpenAI en `streaming.*` son reescritas por `openclaw doctor --fix`.
    El fallback del runtime todavía acepta las claves antiguas de voice-call por ahora, pero
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

## Conversaciones de voz en tiempo real

`realtime` selecciona un proveedor de voz en tiempo real full-duplex para el audio
de llamadas en vivo. Es independiente de `streaming`, que solo reenvía audio a
proveedores de transcripción en tiempo real.

<Warning>
`realtime.enabled` no se puede combinar con `streaming.enabled`. Elige un
modo de audio por llamada.
</Warning>

Comportamiento actual del runtime:

- `realtime.enabled` es compatible con Twilio Media Streams.
- `realtime.provider` es opcional. Si no se define, Voice Call usa el primer proveedor de voz en tiempo real registrado.
- Proveedores de voz en tiempo real incluidos: Google Gemini Live (`google`) y OpenAI (`openai`), registrados por sus plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `realtime.providers.<providerId>`.
- Voice Call expone de forma predeterminada la herramienta compartida en tiempo real `openclaw_agent_consult`. El modelo en tiempo real puede llamarla cuando quien llama pide razonamiento más profundo, información actual o herramientas normales de OpenClaw.
- `realtime.fastContext.enabled` está desactivado de forma predeterminada. Cuando se habilita, Voice Call primero busca en la memoria indexada o el contexto de sesión la pregunta de consulta y devuelve esos fragmentos al modelo en tiempo real dentro de `realtime.fastContext.timeoutMs` antes de recurrir al agente de consulta completo solo si `realtime.fastContext.fallbackToConsult` es true.
- Si `realtime.provider` apunta a un proveedor no registrado, o si no hay ningún proveedor de voz en tiempo real registrado, Voice Call registra una advertencia y omite los medios en tiempo real en lugar de hacer fallar todo el plugin.
- Las claves de sesión de consulta reutilizan la sesión de voz existente cuando está disponible y luego recurren al número de teléfono del llamante/destinatario para que las llamadas de consulta de seguimiento mantengan el contexto durante la llamada.

### Política de herramientas

`realtime.toolPolicy` controla la ejecución de consulta:

| Política         | Comportamiento                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expone la herramienta de consulta y limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`. |
| `owner`          | Expone la herramienta de consulta y permite que el agente normal use la política normal de herramientas del agente.                        |
| `none`           | No expone la herramienta de consulta. Las `realtime.tools` personalizadas aún se pasan al proveedor en tiempo real.                       |

### Ejemplos de proveedores en tiempo real

<Tabs>
  <Tab title="Google Gemini Live">
    Valores predeterminados: clave de API de `realtime.providers.google.apiKey`,
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

Consulta [Proveedor de Google](/es/providers/google) y
[Proveedor de OpenAI](/es/providers/openai) para ver opciones de voz en tiempo real
específicas del proveedor.

## Transcripción en streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para el audio de llamadas en vivo.

Comportamiento actual del runtime:

- `streaming.provider` es opcional. Si no se establece, Voice Call usa el primer proveedor de transcripción en tiempo real registrado.
- Proveedores de transcripción en tiempo real incluidos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI (`xai`), registrados por sus plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive bajo `streaming.providers.<providerId>`.
- Después de que Twilio envía un mensaje `start` de flujo aceptado, Voice Call registra el flujo de inmediato, encola los medios entrantes a través del proveedor de transcripción mientras el proveedor se conecta e inicia el saludo inicial solo después de que la transcripción en tiempo real esté lista.
- Si `streaming.provider` apunta a un proveedor no registrado, o no hay ninguno registrado, Voice Call registra una advertencia y omite el streaming de medios en lugar de hacer fallar todo el plugin.

### Ejemplos de proveedor de streaming

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

Voice Call usa la configuración central `messages.tts` para el streaming
de voz en llamadas. Puedes sobrescribirla bajo la configuración del plugin con la
**misma forma** — se fusiona en profundidad con `messages.tts`.

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
- El TTS central se usa cuando el streaming de medios de Twilio está habilitado; de lo contrario, las llamadas recurren a voces nativas del proveedor.
- Si un flujo de medios de Twilio ya está activo, Voice Call no recurre a TwiML `<Say>`. Si el TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS de telefonía recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.
- Cuando la interrupción por voz de Twilio o el cierre del flujo vacía la cola TTS pendiente, las solicitudes de reproducción en cola se resuelven en lugar de dejar a los llamantes esperando indefinidamente a que termine la reproducción.

### Ejemplos de TTS

<Tabs>
  <Tab title="Solo TTS central">
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

La política entrante tiene `disabled` como valor predeterminado. Para habilitar llamadas entrantes, establece:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` es un filtro de identificador de llamada de baja garantía. El
plugin normaliza el valor `From` proporcionado por el proveedor y lo compara con
`allowFrom`. La verificación del Webhook autentica la entrega del proveedor y
la integridad de la carga útil, pero **no** prueba la propiedad del número
de llamada PSTN/VoIP. Trata `allowFrom` como filtrado de identificador de llamada, no como
identidad sólida del llamante.
</Warning>

Las respuestas automáticas usan el sistema de agentes. Ajusta con `responseModel`,
`responseSystemPrompt` y `responseTimeoutMs`.

### Contrato de salida hablada

Para las respuestas automáticas, Voice Call agrega un contrato estricto de salida hablada al
prompt del sistema:

```text
{"spoken":"..."}
```

Voice Call extrae el texto de voz de forma defensiva:

- Ignora cargas útiles marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON vallado o claves `"spoken"` en línea.
- Recurre a texto plano y elimina párrafos iniciales que probablemente sean de planificación/metadatos.

Esto mantiene la reproducción hablada centrada en el texto dirigido al llamante y evita
filtrar texto de planificación al audio.

### Comportamiento de inicio de conversación

Para llamadas `conversation` salientes, el manejo del primer mensaje está vinculado al estado de
reproducción en vivo:

- El vaciado de la cola por interrupción de voz y la respuesta automática se suprimen solo mientras el saludo inicial se está reproduciendo activamente.
- Si la reproducción inicial falla, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para reintentarse.
- La reproducción inicial para streaming de Twilio comienza al conectarse el flujo sin demora adicional.
- La interrupción por voz aborta la reproducción activa y vacía las entradas TTS de Twilio en cola pero que aún no se están reproduciendo. Las entradas vaciadas se resuelven como omitidas, de modo que la lógica de respuesta posterior puede continuar sin esperar audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el turno inicial propio del flujo en tiempo real. Voice Call **no** publica una actualización TwiML heredada `<Say>` para ese mensaje inicial, por lo que las sesiones salientes `<Connect><Stream>` permanecen adjuntas.

### Gracia de desconexión del flujo de Twilio

Cuando un flujo de medios de Twilio se desconecta, Voice Call espera **2000 ms** antes de
finalizar automáticamente la llamada:

- Si el flujo se reconecta durante esa ventana, la finalización automática se cancela.
- Si ningún flujo se vuelve a registrar después del período de gracia, la llamada se finaliza para evitar llamadas activas bloqueadas.

## Recolector de llamadas obsoletas

Usa `staleCallReaperSeconds` para finalizar llamadas que nunca reciben un
Webhook terminal (por ejemplo, llamadas en modo de notificación que nunca se completan). El valor predeterminado
es `0` (deshabilitado).

Rangos recomendados:

- **Producción:** `120`–`300` segundos para flujos de tipo notificación.
- Mantén este valor **más alto que `maxDurationSeconds`** para que las llamadas normales puedan terminar. Un buen punto de partida es `maxDurationSeconds + 30–60` segundos.

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
reconstruye la URL pública para la verificación de firmas. Estas opciones
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

- La **protección contra reproducción** de Webhook está habilitada para Twilio y Plivo. Las solicitudes válidas de Webhook reproducidas se reconocen, pero se omiten sus efectos secundarios.
- Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada `<Gather>`, por lo que las devoluciones de llamada de voz obsoletas/reproducidas no pueden satisfacer un turno de transcripción pendiente más reciente.
- Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los encabezados de firma requeridos del proveedor.
- El Webhook voice-call usa el perfil de cuerpo compartido de preautenticación (64 KB / 5 segundos) más un límite de solicitudes en curso por IP antes de la verificación de firma.

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
en el runtime de voice-call propiedad del Gateway, de modo que la CLI no enlaza un segundo
servidor de Webhook. Si no se puede alcanzar ningún Gateway, los comandos recurren a un
runtime de CLI independiente.

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de voice-call.
Usa `--file <path>` para apuntar a un registro diferente y `--last <n>` para limitar
el análisis a los últimos N registros (predeterminado 200). La salida incluye p50/p90/p99
para la latencia de turnos y los tiempos de espera de escucha.

## Herramienta de agente

Nombre de herramienta: `voice_call`.

| Acción          | Args                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Este repositorio incluye un documento de skill coincidente en `skills/voice-call/SKILL.md`.

## RPC de Gateway

| Método               | Args                                       |
| -------------------- | ------------------------------------------ |
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

Para `twilio`, `telnyx` y `plivo`, `webhook-exposure` debe estar en verde. Un
`publicUrl` configurado sigue fallando cuando apunta a espacio de red local o
privada, porque el operador no puede llamar de vuelta a esas direcciones. No uses
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ni `fd00::/8` como `publicUrl`.

Las llamadas salientes en modo de notificación de Twilio envían su TwiML `<Say>`
inicial directamente en la solicitud de creación de llamada, por lo que el primer
mensaje hablado no depende de que Twilio obtenga TwiML del Webhook. Sigue siendo
necesario un Webhook público para callbacks de estado, llamadas de conversación,
DTMF previo a la conexión, streams en tiempo real y control de llamadas posterior
a la conexión.

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

`voicecall smoke` es una ejecución de prueba a menos que pases `--yes`.

### Fallan las credenciales del proveedor

Comprueba el proveedor seleccionado y los campos de credenciales requeridos:

- Twilio: `twilio.accountSid`, `twilio.authToken` y `fromNumber`, o
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` y
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` y `fromNumber`.

Las credenciales deben existir en el host del Gateway. Editar un perfil de shell
local no afecta a un Gateway que ya se está ejecutando hasta que se reinicie o
recargue su entorno.

### Las llamadas se inician, pero no llegan los Webhooks del proveedor

Confirma que la consola del proveedor apunte a la URL exacta del Webhook público:

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

- `publicUrl` apunta a una ruta diferente de `serve.path`.
- La URL del túnel cambió después de que se iniciara el Gateway.
- Un proxy reenvía la solicitud pero elimina o reescribe los encabezados host/proto.
- El firewall o DNS enruta el nombre de host público a un lugar distinto del Gateway.
- El Gateway se reinició sin el Plugin Voice Call habilitado.

Cuando un proxy inverso o túnel esté delante del Gateway, configura
`webhookSecurity.allowedHosts` con el nombre de host público, o usa
`webhookSecurity.trustedProxyIPs` para una dirección de proxy conocida. Usa
`webhookSecurity.trustForwardingHeaders` solo cuando el límite del proxy esté bajo
tu control.

### Falla la verificación de firma

Las firmas del proveedor se comprueban contra la URL pública que OpenClaw reconstruye
a partir de la solicitud entrante. Si las firmas fallan:

- Confirma que la URL del Webhook del proveedor coincida exactamente con `publicUrl`, incluidos
  el esquema, el host y la ruta.
- Para las URL de nivel gratuito de ngrok, actualiza `publicUrl` cuando cambie el nombre de host del túnel.
- Asegúrate de que el proxy conserve los encabezados originales de host y proto, o configura
  `webhookSecurity.allowedHosts`.
- No habilites `skipSignatureVerification` fuera de las pruebas locales.

### Fallan las uniones de Google Meet con Twilio

Google Meet usa este Plugin para unirse mediante llamada telefónica de Twilio. Primero verifica Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Luego verifica explícitamente el transporte de Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call está en verde pero el participante de Meet nunca se une, comprueba el número
de marcación de Meet, el PIN y `--dtmf-sequence`. La llamada telefónica puede estar correcta mientras
la reunión rechaza o ignora una secuencia DTMF incorrecta.

Google Meet pasa la secuencia DTMF de Meet y el texto de introducción a `voicecall.start`.
Para llamadas de Twilio, Voice Call sirve primero el TwiML DTMF, redirige de vuelta al
Webhook y luego abre el stream multimedia en tiempo real para que la introducción guardada se genere
después de que el participante telefónico se haya unido a la reunión.

Usa `openclaw logs --follow` para el rastro en vivo de la fase. Una unión correcta de Twilio a Meet
registra este orden:

- Google Meet delega la unión de Twilio a Voice Call.
- Voice Call almacena el TwiML DTMF previo a la conexión.
- El TwiML inicial de Twilio se consume y se sirve antes del manejo en tiempo real.
- Voice Call sirve TwiML en tiempo real para la llamada de Twilio.
- El puente en tiempo real se inicia con el saludo inicial en cola.

`openclaw voicecall tail` sigue mostrando registros de llamadas persistidos; es útil para
el estado de las llamadas y las transcripciones, pero no todas las transiciones de Webhook/tiempo real aparecen
allí.

### La llamada en tiempo real no tiene voz

Confirma que solo haya un modo de audio habilitado. `realtime.enabled` y
`streaming.enabled` no pueden ser ambos `true`.

Para llamadas de Twilio en tiempo real, verifica también:

- Hay un Plugin de proveedor en tiempo real cargado y registrado.
- `realtime.provider` no está configurado o nombra un proveedor registrado.
- La clave de API del proveedor está disponible para el proceso del Gateway.
- `openclaw logs --follow` muestra que se sirvió TwiML en tiempo real, que el puente en tiempo real
  se inició y que el saludo inicial se puso en cola.

## Relacionado

- [Modo conversación](/es/nodes/talk)
- [Texto a voz](/es/tools/tts)
- [Activación por voz](/es/nodes/voicewake)
