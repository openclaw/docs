---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el Plugin voice-call
    - Necesitas voz en tiempo real o transcripción en streaming en telefonía
sidebarTitle: Voice call
summary: Realizar llamadas de voz salientes y aceptar llamadas entrantes mediante Twilio, Telnyx o Plivo, con voz en tiempo real y transcripción en streaming opcionales
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-04-26T11:36:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

Llamadas de voz para OpenClaw mediante un Plugin. Admite notificaciones salientes,
conversaciones de varios turnos, voz en tiempo real full-duplex, transcripción
en streaming y llamadas entrantes con políticas de allowlist.

**Proveedores actuales:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transferencia XML + GetInput
speech), `mock` (desarrollo/sin red).

<Note>
El Plugin Voice Call se ejecuta **dentro del proceso del Gateway**. Si usas un
Gateway remoto, instala y configura el Plugin en la máquina que ejecuta
el Gateway y luego reinicia el Gateway para cargarlo.
</Note>

## Inicio rápido

<Steps>
  <Step title="Instalar el Plugin">
    <Tabs>
      <Tab title="Desde npm (recomendado)">
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

    Reinicia el Gateway después para que se cargue el Plugin.

  </Step>
  <Step title="Configurar proveedor y Webhook">
    Establece la configuración en `plugins.entries.voice-call.config` (consulta
    [Configuración](#configuration) más abajo para la estructura completa). Como mínimo:
    `provider`, credenciales del proveedor, `fromNumber` y una URL de Webhook
    accesible públicamente.
  </Step>
  <Step title="Verificar la configuración">
    ```bash
    openclaw voicecall setup
    ```

    La salida predeterminada es legible en registros de chat y terminales. Comprueba
    la habilitación del Plugin, credenciales del proveedor, exposición del Webhook y que
    solo haya un modo de audio activo (`streaming` o `realtime`). Usa
    `--json` para scripts.

  </Step>
  <Step title="Prueba de humo">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambas son ejecuciones en seco por defecto. Añade `--yes` para realizar
    realmente una breve llamada de notificación saliente:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx y Plivo, la configuración debe resolverse a una **URL de Webhook pública**.
Si `publicUrl`, la URL del túnel, la URL de Tailscale o la alternativa de serve
se resuelve a loopback o a una red privada, la configuración falla en lugar de
iniciar un proveedor que no puede recibir Webhooks del carrier.
</Warning>

## Configuración

Si `enabled: true` pero al proveedor seleccionado le faltan credenciales,
el arranque del Gateway registra una advertencia de configuración incompleta con las claves faltantes y
omite el inicio del runtime. Los comandos, llamadas RPC y herramientas del agente siguen
devolviendo la configuración exacta del proveedor que falta cuando se usan.

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
            // Clave pública de Webhook de Telnyx del Mission Control Portal
            // (Base64; también puede establecerse mediante TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor Webhook
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* consulta Transcripción en streaming */ },
          realtime: { enabled: false /* consulta Voz en tiempo real */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Notas sobre exposición y seguridad del proveedor">
    - Twilio, Telnyx y Plivo requieren una **URL de Webhook accesible públicamente**.
    - `mock` es un proveedor local de desarrollo (sin llamadas de red).
    - Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) salvo que `skipSignatureVerification` sea true.
    - `skipSignatureVerification` es solo para pruebas locales.
    - En el nivel gratuito de ngrok, establece `publicUrl` con la URL exacta de ngrok; la verificación de firma siempre se aplica.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es loopback (agente local de ngrok). Solo desarrollo local.
    - Las URLs de ngrok del nivel gratuito pueden cambiar o añadir comportamiento intersticial; si `publicUrl` cambia, las firmas de Twilio fallan. En producción: prefiere un dominio estable o un funnel de Tailscale.

  </Accordion>
  <Accordion title="Límites de conexiones de streaming">
    - `streaming.preStartTimeoutMs` cierra sockets que nunca envían un frame `start` válido.
    - `streaming.maxPendingConnections` limita el total de sockets previos al inicio sin autenticar.
    - `streaming.maxPendingConnectionsPerIp` limita los sockets previos al inicio sin autenticar por IP de origen.
    - `streaming.maxConnections` limita el total de sockets de flujo multimedia abiertos (pendientes + activos).

  </Accordion>
  <Accordion title="Migraciones de configuración heredada">
    Las configuraciones antiguas que usan `provider: "log"`, `twilio.from` o claves heredadas
    de OpenAI en `streaming.*` se reescriben con `openclaw doctor --fix`.
    Por ahora, el fallback del runtime sigue aceptando las claves antiguas de voice-call, pero
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

## Conversaciones de voz en tiempo real

`realtime` selecciona un proveedor de voz en tiempo real full-duplex para el
audio de llamadas en vivo. Es independiente de `streaming`, que solo reenvía audio a
proveedores de transcripción en tiempo real.

<Warning>
`realtime.enabled` no puede combinarse con `streaming.enabled`. Elige un
modo de audio por llamada.
</Warning>

Comportamiento actual del runtime:

- `realtime.enabled` es compatible con Twilio Media Streams.
- `realtime.provider` es opcional. Si no se establece, Voice Call usa el primer proveedor de voz en tiempo real registrado.
- Proveedores de voz en tiempo real incluidos: Google Gemini Live (`google`) y OpenAI (`openai`), registrados por sus Plugins de proveedor.
- La configuración bruta propiedad del proveedor vive en `realtime.providers.<providerId>`.
- Voice Call expone por defecto la herramienta compartida de tiempo real `openclaw_agent_consult`. El modelo en tiempo real puede llamarla cuando quien llama pide razonamiento más profundo, información actual o herramientas normales de OpenClaw.
- Si `realtime.provider` apunta a un proveedor no registrado, o no hay ningún proveedor de voz en tiempo real registrado, Voice Call registra una advertencia y omite el contenido multimedia en tiempo real en lugar de hacer fallar todo el Plugin.
- Las claves de sesión de consulta reutilizan la sesión de voz existente cuando está disponible y, en caso contrario, recurren al número de teléfono de quien llama o de quien recibe la llamada para que las llamadas de consulta posteriores mantengan el contexto durante la llamada.

### Política de herramientas

`realtime.toolPolicy` controla la ejecución de consulta:

| Política         | Comportamiento                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expone la herramienta de consulta y limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`. |
| `owner`          | Expone la herramienta de consulta y permite que el agente normal use la política normal de herramientas del agente.                      |
| `none`           | No expone la herramienta de consulta. Las `realtime.tools` personalizadas siguen pasándose al proveedor en tiempo real.                  |

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
                instructions: "Habla brevemente. Llama a openclaw_agent_consult antes de usar herramientas más profundas.",
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

Consulta [Proveedor Google](/es/providers/google) y
[Proveedor OpenAI](/es/providers/openai) para opciones específicas
de voz en tiempo real por proveedor.

## Transcripción en streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para el audio de llamadas en vivo.

Comportamiento actual del runtime:

- `streaming.provider` es opcional. Si no se establece, Voice Call usa el primer proveedor de transcripción en tiempo real registrado.
- Proveedores de transcripción en tiempo real incluidos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI (`xai`), registrados por sus Plugins de proveedor.
- La configuración bruta propiedad del proveedor vive en `streaming.providers.<providerId>`.
- Si `streaming.provider` apunta a un proveedor no registrado, o no hay ninguno registrado, Voice Call registra una advertencia y omite el streaming multimedia en lugar de hacer fallar todo el Plugin.

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
                    apiKey: "sk-...", // opcional si OPENAI_API_KEY está establecido
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
                    apiKey: "${XAI_API_KEY}", // opcional si XAI_API_KEY está establecido
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

Voice Call usa la configuración central `messages.tts` para el
audio en streaming en llamadas. Puedes sobrescribirla en la configuración del Plugin con la
**misma estructura**: se fusiona en profundidad con `messages.tts`.

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
**Microsoft speech se ignora para llamadas de voz.** El audio de telefonía necesita PCM;
el transporte actual de Microsoft no expone salida PCM para telefonía.
</Warning>

Notas de comportamiento:

- Las claves heredadas `tts.<provider>` dentro de la configuración del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) se reparan con `openclaw doctor --fix`; la configuración confirmada debe usar `tts.providers.<provider>`.
- El TTS central se usa cuando el media streaming de Twilio está habilitado; en caso contrario, las llamadas recurren a voces nativas del proveedor.
- Si ya hay un media stream de Twilio activo, Voice Call no recurre a TwiML `<Say>`. Si el TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS de telefonía recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.
- Cuando la interrupción por voz de Twilio o el cierre del stream limpia la cola pendiente de TTS, las solicitudes de reproducción en cola se resuelven en lugar de dejar colgados a quienes llaman esperando a que termine la reproducción.

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
  <Tab title="Sobrescritura de modelo OpenAI (fusión profunda)">
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

La política entrante usa `disabled` por defecto. Para habilitar llamadas entrantes, establece:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "¡Hola! ¿En qué puedo ayudar?"
}
```

<Warning>
`inboundPolicy: "allowlist"` es un filtro de identificador de llamada de baja garantía. El
Plugin normaliza el valor `From` proporcionado por el proveedor y lo compara con
`allowFrom`. La verificación del Webhook autentica la entrega del proveedor y la
integridad de la carga útil, pero **no** prueba la propiedad del número
de llamada PSTN/VoIP. Trata `allowFrom` como filtrado por identificador de llamada, no como identidad sólida de quien llama.
</Warning>

Las respuestas automáticas usan el sistema del agente. Ajústalo con `responseModel`,
`responseSystemPrompt` y `responseTimeoutMs`.

### Contrato de salida hablada

Para respuestas automáticas, Voice Call añade un contrato estricto de salida hablada al
prompt del sistema:

```text
{"spoken":"..."}
```

Voice Call extrae el texto hablado de forma defensiva:

- Ignora cargas útiles marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON entre bloques o claves `"spoken"` inline.
- Recurre a texto plano y elimina párrafos iniciales que probablemente sean de planificación/meta.

Esto mantiene la reproducción hablada centrada en texto dirigido a quien llama y evita
filtrar texto de planificación al audio.

### Comportamiento de inicio de conversación

Para llamadas salientes `conversation`, el manejo del primer mensaje está vinculado al estado de reproducción en vivo:

- La limpieza de cola por interrupción de voz y la respuesta automática se suprimen solo mientras el saludo inicial se está reproduciendo activamente.
- Si la reproducción inicial falla, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para reintento.
- La reproducción inicial para streaming de Twilio empieza al conectarse el stream sin retraso adicional.
- La interrupción por voz aborta la reproducción activa y limpia las entradas TTS de Twilio en cola pero aún no reproducidas. Las entradas limpiadas se resuelven como omitidas, de modo que la lógica de respuesta posterior puede continuar sin esperar a audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el propio turno de apertura del stream en tiempo real. Voice Call **no** publica una actualización heredada de TwiML `<Say>` para ese mensaje inicial, de modo que las sesiones salientes `<Connect><Stream>` permanecen conectadas.

### Margen de desconexión de stream de Twilio

Cuando se desconecta un media stream de Twilio, Voice Call espera **2000 ms** antes de
finalizar automáticamente la llamada:

- Si el stream se reconecta durante esa ventana, se cancela la finalización automática.
- Si no se vuelve a registrar ningún stream tras el período de gracia, la llamada finaliza para evitar llamadas activas bloqueadas.

## Recolector de llamadas obsoletas

Usa `staleCallReaperSeconds` para finalizar llamadas que nunca reciben un
Webhook terminal (por ejemplo, llamadas en modo notify que nunca se completan). El valor predeterminado
es `0` (desactivado).

Rangos recomendados:

- **Producción:** `120`–`300` segundos para flujos de estilo notify.
- Mantén este valor **por encima de `maxDurationSeconds`** para que las llamadas normales puedan terminar. Un buen punto de partida es `maxDurationSeconds + 30–60` segundos.

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

Cuando un proxy o túnel se sitúa delante del Gateway, el Plugin
reconstruye la URL pública para la verificación de firmas. Estas opciones
controlan qué encabezados reenviados son de confianza:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts en allowlist a partir de encabezados de reenvío.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confiar en encabezados reenviados sin una allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confiar en encabezados reenviados solo cuando la IP remota de la solicitud coincide con la lista.
</ParamField>

Protecciones adicionales:

- La **protección contra repetición** de Webhooks está habilitada para Twilio y Plivo. Las solicitudes de Webhook válidas repetidas se reconocen pero se omiten para efectos secundarios.
- Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada `<Gather>`, de modo que las devoluciones de llamada de voz obsoletas o repetidas no puedan satisfacer un turno de transcripción pendiente más reciente.
- Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los encabezados de firma requeridos por el proveedor.
- El Webhook de voice-call usa el perfil compartido de cuerpo previo a autenticación (64 KB / 5 segundos) más un límite en vuelo por IP antes de la verificación de firmas.

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
openclaw voicecall call --to "+15555550123" --message "Hola desde OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias de call
openclaw voicecall continue --call-id <id> --message "¿Alguna pregunta?"
openclaw voicecall speak --call-id <id> --message "Un momento"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # resumir latencia de turnos desde registros
openclaw voicecall expose --mode funnel
```

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de voice-call.
Usa `--file <path>` para apuntar a un registro distinto y `--last <n>` para limitar
el análisis a los últimos N registros (predeterminado 200). La salida incluye p50/p90/p99
para latencia de turnos y tiempos de espera de escucha.

## Herramienta del agente

Nombre de la herramienta: `voice_call`.

| Acción          | Args                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Este repositorio incluye una Skill coincidente en `skills/voice-call/SKILL.md`.

## RPC del Gateway

| Método               | Args                      |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Relacionado

- [Modo talk](/es/nodes/talk)
- [Texto a voz](/es/tools/tts)
- [Activación por voz](/es/nodes/voicewake)
