---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el Plugin de llamadas de voz
summary: 'Plugin de llamadas de voz: llamadas salientes + entrantes mediante Twilio/Telnyx/Plivo (instalación del plugin + configuración + CLI)'
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-04-24T09:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Llamada de voz (Plugin)

Llamadas de voz para OpenClaw mediante un Plugin. Admite notificaciones salientes y
conversaciones de varios turnos con políticas de entrada.

Proveedores actuales:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transferencia XML + reconocimiento de voz GetInput)
- `mock` (desarrollo/sin red)

Modelo mental rápido:

- Instala el Plugin
- Reinicia Gateway
- Configura en `plugins.entries.voice-call.config`
- Usa `openclaw voicecall ...` o la herramienta `voice_call`

## Dónde se ejecuta (local vs remoto)

El Plugin de llamadas de voz se ejecuta **dentro del proceso de Gateway**.

Si usas un Gateway remoto, instala/configura el Plugin en la **máquina que ejecuta el Gateway**, luego reinicia el Gateway para cargarlo.

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

Establece la configuración en `plugins.entries.voice-call.config`:

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
            // Clave pública del webhook de Telnyx del Portal Mission Control de Telnyx
            // (cadena Base64; también se puede establecer mediante TELNYX_PUBLIC_KEY).
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

          // Seguridad del Webhook (recomendado para túneles/proxies)
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
            provider: "openai", // opcional; primer proveedor de transcripción en tiempo real registrado cuando no se establece
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcional si OPENAI_API_KEY está configurada
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

          realtime: {
            enabled: false,
            provider: "google", // opcional; primer proveedor de voz en tiempo real registrado cuando no se establece
            providers: {
              google: {
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

Notas:

- Twilio/Telnyx requieren una URL de Webhook **accesible públicamente**.
- Plivo requiere una URL de Webhook **accesible públicamente**.
- `mock` es un proveedor local para desarrollo (sin llamadas de red).
- Si las configuraciones antiguas aún usan `provider: "log"`, `twilio.from` o claves heredadas de OpenAI en `streaming.*`, ejecuta `openclaw doctor --fix` para reescribirlas.
- Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` sea true.
- `skipSignatureVerification` es solo para pruebas locales.
- Si usas el plan gratuito de ngrok, establece `publicUrl` en la URL exacta de ngrok; la verificación de firma siempre se aplica.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es local loopback (agente local de ngrok). Úsalo solo para desarrollo local.
- Las URL del plan gratuito de ngrok pueden cambiar o agregar comportamiento intersticial; si `publicUrl` cambia, las firmas de Twilio fallarán. Para producción, prefiere un dominio estable o Tailscale funnel.
- `realtime.enabled` inicia conversaciones de voz a voz completas; no lo habilites junto con `streaming.enabled`.
- Valores predeterminados de seguridad de streaming:
  - `streaming.preStartTimeoutMs` cierra sockets que nunca envían un frame `start` válido.
- `streaming.maxPendingConnections` limita el total de sockets preinicio no autenticados.
- `streaming.maxPendingConnectionsPerIp` limita los sockets preinicio no autenticados por IP de origen.
- `streaming.maxConnections` limita el total de sockets abiertos de flujo de medios (pendientes + activos).
- El fallback en tiempo de ejecución todavía acepta por ahora esas claves antiguas de voice-call, pero la ruta de reescritura es `openclaw doctor --fix` y la capa de compatibilidad es temporal.

## Conversaciones de voz en tiempo real

`realtime` selecciona un proveedor de voz en tiempo real full duplex para el audio de llamadas en vivo.
Es independiente de `streaming`, que solo reenvía audio a proveedores de
transcripción en tiempo real.

Comportamiento actual en tiempo de ejecución:

- `realtime.enabled` es compatible con Twilio Media Streams.
- `realtime.enabled` no se puede combinar con `streaming.enabled`.
- `realtime.provider` es opcional. Si no se establece, Voice Call usa el primer
  proveedor de voz en tiempo real registrado.
- Los proveedores de voz en tiempo real incluidos son Google Gemini Live (`google`) y
  OpenAI (`openai`), registrados por sus Plugins de proveedor.
- La configuración raw propiedad del proveedor vive en `realtime.providers.<providerId>`.
- Si `realtime.provider` apunta a un proveedor no registrado, o no hay ningún proveedor de
  voz en tiempo real registrado, Voice Call registra una advertencia y omite
  los medios en tiempo real en lugar de hacer fallar todo el Plugin.

Valores predeterminados en tiempo real de Google Gemini Live:

- Clave API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`, o
  `GOOGLE_GENERATIVE_AI_API_KEY`
- modelo: `gemini-2.5-flash-native-audio-preview-12-2025`
- voz: `Kore`

Ejemplo:

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
            instructions: "Habla brevemente y pregunta antes de usar herramientas.",
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

Usa OpenAI en su lugar:

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
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Consulta [Proveedor de Google](/es/providers/google) y [Proveedor de OpenAI](/es/providers/openai)
para ver las opciones de voz en tiempo real específicas del proveedor.

## Transcripción por streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para el audio de llamadas en vivo.

Comportamiento actual en tiempo de ejecución:

- `streaming.provider` es opcional. Si no se establece, Voice Call usa el primer
  proveedor de transcripción en tiempo real registrado.
- Los proveedores de transcripción en tiempo real incluidos son Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI
  (`xai`), registrados por sus Plugins de proveedor.
- La configuración raw propiedad del proveedor vive en `streaming.providers.<providerId>`.
- Si `streaming.provider` apunta a un proveedor no registrado, o no hay ningún proveedor de
  transcripción en tiempo real registrado, Voice Call registra una advertencia y
  omite el streaming de medios en lugar de hacer fallar todo el Plugin.

Valores predeterminados de transcripción por streaming de OpenAI:

- Clave API: `streaming.providers.openai.apiKey` o `OPENAI_API_KEY`
- modelo: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Valores predeterminados de transcripción por streaming de xAI:

- Clave API: `streaming.providers.xai.apiKey` o `XAI_API_KEY`
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
                apiKey: "sk-...", // opcional si OPENAI_API_KEY está configurada
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

Usa xAI en su lugar:

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
                apiKey: "${XAI_API_KEY}", // opcional si XAI_API_KEY está configurada
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

Las claves heredadas todavía se migran automáticamente mediante `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Recolector de llamadas obsoletas

Usa `staleCallReaperSeconds` para terminar llamadas que nunca reciben un Webhook terminal
(por ejemplo, llamadas en modo notify que nunca se completan). El valor predeterminado es `0`
(deshabilitado).

Rangos recomendados:

- **Producción:** `120`–`300` segundos para flujos de estilo notify.
- Mantén este valor **por encima de `maxDurationSeconds`** para que las llamadas normales puedan
  finalizar. Un buen punto de partida es `maxDurationSeconds + 30–60` segundos.

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

## Seguridad del Webhook

Cuando un proxy o túnel se sitúa delante del Gateway, el Plugin reconstruye la
URL pública para la verificación de firma. Estas opciones controlan en qué
cabeceras reenviadas se confía.

`webhookSecurity.allowedHosts` permite una lista de hosts desde cabeceras de reenvío.

`webhookSecurity.trustForwardingHeaders` confía en las cabeceras reenviadas sin una lista de permitidos.

`webhookSecurity.trustedProxyIPs` solo confía en las cabeceras reenviadas cuando la IP remota
de la solicitud coincide con la lista.

La protección contra repetición de Webhook está habilitada para Twilio y Plivo. Las solicitudes
de Webhook válidas repetidas se reconocen, pero se omiten sus efectos secundarios.

Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada de `<Gather>`, por lo que
las devoluciones de llamada de voz obsoletas o repetidas no pueden satisfacer un turno de transcripción
pendiente más reciente.

Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan las
cabeceras de firma requeridas del proveedor.

El Webhook de voice-call usa el perfil compartido de cuerpo previo a la autenticación (64 KB / 5 segundos)
más un límite por IP de solicitudes en curso antes de la verificación de firma.

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

Voice Call usa la configuración central `messages.tts` para la
síntesis de voz en streaming en llamadas. Puedes sobrescribirla en la configuración del Plugin con la
**misma estructura**: se fusiona de forma profunda con `messages.tts`.

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

- Las claves heredadas `tts.<provider>` dentro de la configuración del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) se migran automáticamente a `tts.providers.<provider>` al cargar. Prefiere la estructura `providers` en la configuración confirmada.
- **Microsoft speech se ignora para llamadas** (el audio de telefonía necesita PCM; el transporte actual de Microsoft no expone salida PCM para telefonía).
- El TTS central se usa cuando el streaming de medios de Twilio está habilitado; de lo contrario, las llamadas vuelven a las voces nativas del proveedor.
- Si un flujo de medios de Twilio ya está activo, Voice Call no vuelve a TwiML `<Say>`. Si el TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS de telefonía vuelve a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.

### Más ejemplos

Usa solo el TTS central (sin sobrescritura):

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

Sobrescribe a ElevenLabs solo para llamadas (mantén el valor predeterminado central en otros lugares):

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

Sobrescribe solo el modelo de OpenAI para llamadas (ejemplo de fusión profunda):

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

La política de entrada usa `disabled` de forma predeterminada. Para habilitar llamadas entrantes, establece:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "¡Hola! ¿Cómo puedo ayudarte?",
}
```

`inboundPolicy: "allowlist"` es un filtro de ID de llamada de baja garantía. El Plugin
normaliza el valor `From` proporcionado por el proveedor y lo compara con `allowFrom`.
La verificación del Webhook autentica la entrega del proveedor y la integridad de la carga útil, pero
no demuestra la propiedad del número llamante PSTN/VoIP. Trata `allowFrom` como
filtrado de ID de llamada, no como una identidad fuerte del llamante.

Las respuestas automáticas usan el sistema de agentes. Ajústalo con:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrato de salida hablada

Para las respuestas automáticas, Voice Call agrega un contrato estricto de salida hablada al prompt del sistema:

- `{"spoken":"..."}`

Luego, Voice Call extrae el texto hablado de forma defensiva:

- Ignora cargas útiles marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON entre bloques delimitados o claves `"spoken"` en línea.
- Vuelve a texto sin formato y elimina párrafos iniciales probables de planificación/meta.

Esto mantiene la reproducción hablada centrada en texto orientado a la persona que llama y evita filtrar texto de planificación al audio.

### Comportamiento de inicio de conversación

Para llamadas salientes `conversation`, el manejo del primer mensaje está vinculado al estado de reproducción en vivo:

- El vaciado de la cola por interrupción y la respuesta automática se suprimen solo mientras el saludo inicial se está reproduciendo activamente.
- Si falla la reproducción inicial, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para reintento.
- La reproducción inicial para streaming de Twilio comienza al conectarse el flujo, sin demora adicional.

### Período de gracia para desconexión de flujo de Twilio

Cuando un flujo de medios de Twilio se desconecta, Voice Call espera `2000ms` antes de finalizar automáticamente la llamada:

- Si el flujo se vuelve a conectar durante esa ventana, la finalización automática se cancela.
- Si no se vuelve a registrar ningún flujo después del período de gracia, la llamada finaliza para evitar llamadas activas bloqueadas.

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
openclaw voicecall latency                     # resume la latencia de turnos desde los registros
openclaw voicecall expose --mode funnel
```

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de voice-call. Usa
`--file <path>` para apuntar a un registro diferente y `--last <n>` para limitar el análisis
a los últimos N registros (predeterminado: 200). La salida incluye p50/p90/p99 para la
latencia de turnos y los tiempos de espera de escucha.

## Herramienta del agente

Nombre de la herramienta: `voice_call`

Acciones:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Este repositorio incluye un documento de Skills correspondiente en `skills/voice-call/SKILL.md`.

## RPC de Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Relacionado

- [Texto a voz](/es/tools/tts)
- [Modo conversación](/es/nodes/talk)
- [Activación por voz](/es/nodes/voicewake)
