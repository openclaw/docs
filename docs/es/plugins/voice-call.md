---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el Plugin de llamadas de voz
summary: 'Plugin de llamadas de voz: llamadas salientes + entrantes mediante Twilio/Telnyx/Plivo (instalación del Plugin + configuración + CLI)'
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-04-24T05:42:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Plugin de llamadas de voz

Llamadas de voz para OpenClaw mediante un Plugin. Admite notificaciones salientes y
conversaciones de varios turnos con políticas entrantes.

Proveedores actuales:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transferencia XML + GetInput speech)
- `mock` (desarrollo/sin red)

Modelo mental rápido:

- Instala el Plugin
- Reinicia el Gateway
- Configura en `plugins.entries.voice-call.config`
- Usa `openclaw voicecall ...` o la herramienta `voice_call`

## Dónde se ejecuta (local frente a remoto)

El Plugin de llamadas de voz se ejecuta **dentro del proceso del Gateway**.

Si usas un Gateway remoto, instala/configura el Plugin en la **máquina que ejecuta el Gateway** y luego reinicia el Gateway para cargarlo.

## Instalación

### Opción A: instalar desde npm (recomendado)

```bash
openclaw plugins install @openclaw/voice-call
```

Reinicia el Gateway después.

### Opción B: instalar desde una carpeta local (desarrollo, sin copiar)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicia el Gateway después.

## Configuración

Configura en `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // o "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // o TWILIO_FROM_NUMBER para Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Clave pública del webhook de Telnyx desde el Telnyx Mission Control Portal
            // (cadena Base64; también puede configurarse mediante TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor de Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Seguridad de Webhook (recomendado para túneles/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposición pública (elige una)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opcional; primer proveedor registrado de transcripción en tiempo real cuando no se configura
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcional si OPENAI_API_KEY está configurado
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Notas:

- Twilio/Telnyx requieren una URL de Webhook **accesible públicamente**.
- Plivo requiere una URL de Webhook **accesible públicamente**.
- `mock` es un proveedor local para desarrollo (sin llamadas de red).
- Si las configuraciones antiguas siguen usando `provider: "log"`, `twilio.from` o claves heredadas `streaming.*` de OpenAI, ejecuta `openclaw doctor --fix` para reescribirlas.
- Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) salvo que `skipSignatureVerification` sea true.
- `skipSignatureVerification` es solo para pruebas locales.
- Si usas el nivel gratuito de ngrok, configura `publicUrl` con la URL exacta de ngrok; la verificación de firma siempre se aplica.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es loopback (agente local de ngrok). Úsalo solo para desarrollo local.
- Las URL del nivel gratuito de ngrok pueden cambiar o añadir comportamiento intersticial; si `publicUrl` se desvía, las firmas de Twilio fallarán. Para producción, prefiere un dominio estable o Tailscale funnel.
- Valores predeterminados de seguridad para streaming:
  - `streaming.preStartTimeoutMs` cierra sockets que nunca envían un frame `start` válido.
- `streaming.maxPendingConnections` limita el total de sockets previos al inicio sin autenticar.
- `streaming.maxPendingConnectionsPerIp` limita los sockets previos al inicio sin autenticar por IP de origen.
- `streaming.maxConnections` limita el total de sockets abiertos de flujo multimedia (pendientes + activos).
- El respaldo en runtime todavía acepta por ahora esas claves antiguas de voice-call, pero la ruta de reescritura es `openclaw doctor --fix` y el shim de compatibilidad es temporal.

## Transcripción en streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para audio de llamadas en vivo.

Comportamiento actual en runtime:

- `streaming.provider` es opcional. Si no se configura, Voice Call usa el primer
  proveedor registrado de transcripción en tiempo real.
- Los proveedores incluidos de transcripción en tiempo real incluyen Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI
  (`xai`), registrados por sus Plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `streaming.providers.<providerId>`.
- Si `streaming.provider` apunta a un proveedor no registrado, o no hay ningún proveedor
  de transcripción en tiempo real registrado, Voice Call registra una advertencia y
  omite el streaming multimedia en lugar de hacer fallar todo el Plugin.

Valores predeterminados de transcripción en streaming de OpenAI:

- API key: `streaming.providers.openai.apiKey` o `OPENAI_API_KEY`
- modelo: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Valores predeterminados de transcripción en streaming de xAI:

- API key: `streaming.providers.xai.apiKey` o `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Ejemplo:

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
                apiKey: "sk-...", // opcional si OPENAI_API_KEY está configurado
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

Usar xAI en su lugar:

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
                apiKey: "${XAI_API_KEY}", // opcional si XAI_API_KEY está configurado
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

Las claves heredadas siguen migrándose automáticamente con `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Recolector de llamadas obsoletas

Usa `staleCallReaperSeconds` para finalizar llamadas que nunca reciben un Webhook terminal
(por ejemplo, llamadas en modo notify que nunca se completan). El valor predeterminado es `0`
(deshabilitado).

Rangos recomendados:

- **Producción:** `120`–`300` segundos para flujos tipo notify.
- Mantén este valor **por encima de `maxDurationSeconds`** para que las llamadas normales puedan
  terminar. Un buen punto de partida es `maxDurationSeconds + 30–60` segundos.

Ejemplo:

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

Cuando un proxy o túnel está delante del Gateway, el Plugin reconstruye la
URL pública para la verificación de firma. Estas opciones controlan qué cabeceras reenviadas son confiables.

`webhookSecurity.allowedHosts` define una lista de hosts permitidos desde cabeceras de reenvío.

`webhookSecurity.trustForwardingHeaders` confía en las cabeceras reenviadas sin una lista de permitidos.

`webhookSecurity.trustedProxyIPs` solo confía en las cabeceras reenviadas cuando la
IP remota de la solicitud coincide con la lista.

La protección contra repetición de Webhooks está habilitada para Twilio y Plivo. Las solicitudes
de Webhook repetidas y válidas se reconocen, pero se omiten para efectos secundarios.

Los turnos de conversación de Twilio incluyen un token por turno en los callbacks `<Gather>`, de modo
que los callbacks de voz obsoletos o repetidos no pueden satisfacer un turno de transcripción pendiente más reciente.

Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan
las cabeceras de firma requeridas por el proveedor.

El Webhook de voice-call usa el perfil compartido de cuerpo preautenticado (64 KB / 5 segundos)
más un límite de solicitudes simultáneas por IP antes de la verificación de firma.

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

## TTS para llamadas

Voice Call usa la configuración central `messages.tts` para
streaming de voz en llamadas. Puedes sobrescribirla bajo la configuración del Plugin con la
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

Notas:

- Las claves heredadas `tts.<provider>` dentro de la configuración del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) se migran automáticamente a `tts.providers.<provider>` al cargar. Prefiere la forma `providers` en la configuración confirmada.
- **Microsoft speech se ignora para llamadas de voz** (el audio de telefonía necesita PCM; el transporte actual de Microsoft no expone salida PCM para telefonía).
- Se usa el TTS central cuando el streaming multimedia de Twilio está habilitado; en caso contrario, las llamadas recurren a voces nativas del proveedor.
- Si ya hay activo un media stream de Twilio, Voice Call no recurre a TwiML `<Say>`. Si el TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS de telefonía recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.

### Más ejemplos

Usar solo el TTS central (sin sobrescritura):

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

Sobrescribir a ElevenLabs solo para llamadas (mantener el predeterminado central en otros casos):

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

Sobrescribir solo el modelo de OpenAI para llamadas (ejemplo de fusión en profundidad):

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

## Llamadas entrantes

La política entrante usa `disabled` de forma predeterminada. Para habilitar llamadas entrantes, configura:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` es un filtro de ID de llamada de baja garantía. El Plugin
normaliza el valor `From` proporcionado por el proveedor y lo compara con `allowFrom`.
La verificación del Webhook autentica la entrega del proveedor y la integridad de la carga útil, pero
no demuestra la propiedad del número de llamada PSTN/VoIP. Trata `allowFrom` como
filtrado de ID de llamada, no como una identidad fuerte del llamante.

Las respuestas automáticas usan el sistema del agente. Ajústalo con:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrato de salida hablada

Para las respuestas automáticas, Voice Call añade un contrato estricto de salida hablada al prompt del sistema:

- `{"spoken":"..."}`

Después Voice Call extrae el texto de voz de forma defensiva:

- Ignora cargas útiles marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON entre bloques delimitados o claves `"spoken"` inline.
- Recurre a texto plano y elimina párrafos iniciales que probablemente sean introducciones de planificación/meta.

Esto mantiene la reproducción hablada centrada en texto orientado al llamante y evita filtrar texto de planificación al audio.

### Comportamiento de arranque de conversación

Para llamadas salientes en modo `conversation`, el manejo del primer mensaje está vinculado al estado de reproducción en vivo:

- El vaciado de cola por interrupción y la respuesta automática se suprimen solo mientras el saludo inicial se está reproduciendo activamente.
- Si falla la reproducción inicial, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para reintento.
- La reproducción inicial para streaming de Twilio comienza al conectar el stream, sin retraso adicional.

### Período de gracia tras desconexión del stream de Twilio

Cuando se desconecta un media stream de Twilio, Voice Call espera `2000ms` antes de finalizar automáticamente la llamada:

- Si el stream se reconecta durante esa ventana, se cancela la finalización automática.
- Si no se vuelve a registrar ningún stream tras el período de gracia, la llamada se finaliza para evitar llamadas activas atascadas.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias de call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # resume la latencia por turno a partir de los registros
openclaw voicecall expose --mode funnel
```

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de voice-call. Usa
`--file <path>` para apuntar a otro registro y `--last <n>` para limitar el análisis
a los últimos N registros (predeterminado 200). La salida incluye p50/p90/p99 para la
latencia por turno y tiempos de espera de escucha.

## Herramienta de agente

Nombre de la herramienta: `voice_call`

Acciones:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Este repositorio incluye una Skill doc correspondiente en `skills/voice-call/SKILL.md`.

## RPC del Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Relacionado

- [Texto a voz](/es/tools/tts)
- [Modo Talk](/es/nodes/talk)
- [Activación por voz](/es/nodes/voicewake)
