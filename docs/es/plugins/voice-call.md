---
read_when:
    - Desea realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el Plugin de llamadas de voz
    - Necesitas voz en tiempo real o transcripción en streaming para telefonía
sidebarTitle: Voice call
summary: Realiza llamadas de voz salientes y acepta llamadas de voz entrantes mediante Twilio, Telnyx o Plivo, con voz en tiempo real opcional y transcripción continua
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-04-30T05:55:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Llamadas de voz para OpenClaw mediante un plugin. Admite notificaciones salientes,
conversaciones de varios turnos, voz en tiempo real full-duplex, transcripción
en streaming y llamadas entrantes con políticas de lista de permitidos.

**Proveedores actuales:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transferencia XML + GetInput
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
    del paquete proviene de una línea de paquetes externos anterior; usa una compilación
    empaquetada actual de OpenClaw o la ruta de carpeta local hasta que se publique
    un paquete npm más reciente.

    Reinicia el Gateway después para que el plugin se cargue.

  </Step>
  <Step title="Configurar proveedor y webhook">
    Define la configuración en `plugins.entries.voice-call.config` (consulta
    [Configuración](#configuration) más abajo para ver la estructura completa). Como mínimo:
    `provider`, credenciales del proveedor, `fromNumber` y una URL de webhook
    accesible públicamente.
  </Step>
  <Step title="Verificar la configuración">
    ```bash
    openclaw voicecall setup
    ```

    La salida predeterminada es legible en registros de chat y terminales. Comprueba
    la habilitación del plugin, las credenciales del proveedor, la exposición del webhook
    y que solo haya un modo de audio (`streaming` o `realtime`) activo. Usa
    `--json` para scripts.

  </Step>
  <Step title="Prueba de humo">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambos son simulaciones de forma predeterminada. Añade `--yes` para realizar
    realmente una llamada saliente breve de notificación:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx y Plivo, la configuración debe resolverse a una **URL de webhook pública**.
Si `publicUrl`, la URL del túnel, la URL de Tailscale o el fallback de servicio
se resuelve a loopback o a espacio de red privada, la configuración falla en lugar de
iniciar un proveedor que no puede recibir webhooks del operador.
</Warning>

## Configuración

Si `enabled: true` pero al proveedor seleccionado le faltan credenciales,
el arranque del Gateway registra una advertencia de configuración incompleta con las claves faltantes y
omite el inicio del runtime. Los comandos, las llamadas RPC y las herramientas del agente aún
devuelven la configuración exacta faltante del proveedor cuando se usan.

<Note>
Las credenciales de voice-call aceptan SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` y `plugins.entries.voice-call.config.tts.providers.*.apiKey` se resuelven mediante la superficie estándar de SecretRef; consulta [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
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
    - `mock` es un proveedor de desarrollo local (sin llamadas de red).
    - Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) salvo que `skipSignatureVerification` sea true.
    - `skipSignatureVerification` es solo para pruebas locales.
    - En el nivel gratuito de ngrok, define `publicUrl` como la URL exacta de ngrok; la verificación de firma siempre se aplica.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es loopback (agente local de ngrok). Solo desarrollo local.
    - Las URL del nivel gratuito de Ngrok pueden cambiar o añadir comportamiento intersticial; si `publicUrl` se desvía, las firmas de Twilio fallan. Producción: prefiere un dominio estable o un funnel de Tailscale.

  </Accordion>
  <Accordion title="Límites de conexión de streaming">
    - `streaming.preStartTimeoutMs` cierra sockets que nunca envían un frame `start` válido.
    - `streaming.maxPendingConnections` limita el total de sockets preinicio no autenticados.
    - `streaming.maxPendingConnectionsPerIp` limita los sockets preinicio no autenticados por IP de origen.
    - `streaming.maxConnections` limita el total de sockets abiertos de stream de medios (pendientes + activos).

  </Accordion>
  <Accordion title="Migraciones de configuración heredada">
    Las configuraciones antiguas que usan `provider: "log"`, `twilio.from` o claves heredadas
    de OpenAI en `streaming.*` son reescritas por `openclaw doctor --fix`.
    El fallback de runtime aún acepta por ahora las claves antiguas de voice-call, pero
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
- Si `realtime.provider` apunta a un proveedor no registrado, o no hay ningún proveedor de voz en tiempo real registrado, Voice Call registra una advertencia y omite los medios en tiempo real en lugar de hacer fallar todo el plugin.
- Las claves de sesión de consulta reutilizan la sesión de voz existente cuando está disponible y luego recurren al número de teléfono de quien llama o recibe la llamada para que las llamadas de consulta de seguimiento mantengan el contexto durante la llamada.

### Política de herramientas

`realtime.toolPolicy` controla la ejecución de consulta:

| Política         | Comportamiento                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expone la herramienta de consulta y limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`. |
| `owner`          | Expone la herramienta de consulta y permite que el agente normal use la política normal de herramientas del agente.                      |
| `none`           | No expone la herramienta de consulta. Las `realtime.tools` personalizadas aún se pasan al proveedor en tiempo real.                     |

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

Consulta [Proveedor de Google](/es/providers/google) y
[Proveedor de OpenAI](/es/providers/openai) para ver opciones de voz en tiempo real
específicas del proveedor.

## Transcripción en streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para el audio de llamadas en vivo.

Comportamiento actual del runtime:

- `streaming.provider` es opcional. Si no se define, Voice Call usa el primer proveedor de transcripción en tiempo real registrado.
- Proveedores de transcripción en tiempo real incluidos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI (`xai`), registrados por sus plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `streaming.providers.<providerId>`.
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

Voice Call usa la configuración principal `messages.tts` para el habla en streaming en las llamadas. Puedes sobrescribirla en la configuración del Plugin con la **misma forma**; se fusiona en profundidad con `messages.tts`.

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

- Las claves heredadas `tts.<provider>` dentro de la configuración del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) son reparadas por `openclaw doctor --fix`; la configuración confirmada debe usar `tts.providers.<provider>`.
- El TTS principal se usa cuando el streaming de medios de Twilio está habilitado; de lo contrario, las llamadas vuelven a las voces nativas del proveedor.
- Si un stream de medios de Twilio ya está activo, Voice Call no recurre a TwiML `<Say>`. Si el TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS de telefonía recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.
- Cuando la interrupción por voz de Twilio o el desmontaje del stream limpia la cola de TTS pendiente, las solicitudes de reproducción en cola se resuelven en lugar de dejar colgados a los llamantes que esperan que finalice la reproducción.

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

La política de llamadas entrantes usa `disabled` de forma predeterminada. Para habilitar llamadas entrantes, establece:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` es un filtro de ID de llamante de baja garantía. El
Plugin normaliza el valor `From` suministrado por el proveedor y lo compara con
`allowFrom`. La verificación de Webhook autentica la entrega del proveedor y
la integridad de la carga útil, pero **no** prueba la propiedad del número de
llamante PSTN/VoIP. Trata `allowFrom` como filtrado de ID de llamante, no como
identidad fuerte del llamante.
</Warning>

Las respuestas automáticas usan el sistema de agentes. Ajústalas con `responseModel`,
`responseSystemPrompt` y `responseTimeoutMs`.

### Contrato de salida hablada

Para las respuestas automáticas, Voice Call añade un contrato estricto de salida hablada al
prompt del sistema:

```text
{"spoken":"..."}
```

Voice Call extrae el texto hablado de forma defensiva:

- Ignora las cargas útiles marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON cercado o claves `"spoken"` en línea.
- Recurre a texto sin formato y elimina párrafos iniciales que probablemente sean de planificación/metadatos.

Esto mantiene la reproducción hablada centrada en texto dirigido al llamante y evita
filtrar texto de planificación al audio.

### Comportamiento de inicio de conversación

Para llamadas `conversation` salientes, el manejo del primer mensaje está vinculado al estado de
reproducción en vivo:

- La limpieza de la cola por interrupción de voz y la respuesta automática se suprimen solo mientras el saludo inicial está hablando activamente.
- Si la reproducción inicial falla, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para reintentarlo.
- La reproducción inicial para streaming de Twilio comienza al conectar el stream, sin retraso adicional.
- La interrupción por voz cancela la reproducción activa y limpia las entradas de TTS de Twilio en cola pero aún no reproducidas. Las entradas limpiadas se resuelven como omitidas, de modo que la lógica de respuesta posterior puede continuar sin esperar audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el turno de apertura propio del stream en tiempo real. Voice Call **no** publica una actualización TwiML `<Say>` heredada para ese mensaje inicial, de modo que las sesiones salientes `<Connect><Stream>` permanecen adjuntas.

### Periodo de gracia al desconectar el stream de Twilio

Cuando un stream de medios de Twilio se desconecta, Voice Call espera **2000 ms** antes de
finalizar automáticamente la llamada:

- Si el stream se reconecta durante esa ventana, el fin automático se cancela.
- Si ningún stream vuelve a registrarse después del periodo de gracia, la llamada se finaliza para evitar llamadas activas bloqueadas.

## Recolector de llamadas obsoletas

Usa `staleCallReaperSeconds` para finalizar llamadas que nunca reciben un
Webhook terminal (por ejemplo, llamadas en modo notificación que nunca se completan). El valor predeterminado
es `0` (deshabilitado).

Rangos recomendados:

- **Producción:** `120`–`300` segundos para flujos de estilo notificación.
- Mantén este valor **por encima de `maxDurationSeconds`** para que las llamadas normales puedan finalizar. Un buen punto de partida es `maxDurationSeconds + 30–60` segundos.

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

Cuando un proxy o túnel está delante del Gateway, el Plugin
reconstruye la URL pública para la verificación de firma. Estas opciones
controlan qué encabezados reenviados son de confianza:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Permite hosts de los encabezados de reenvío.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confía en los encabezados reenviados sin una lista de permitidos.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Solo confía en los encabezados reenviados cuando la IP remota de la solicitud coincide con la lista.
</ParamField>

Protecciones adicionales:

- La **protección contra reproducción** de Webhook está habilitada para Twilio y Plivo. Las solicitudes de Webhook válidas reproducidas se confirman, pero se omiten para efectos secundarios.
- Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada `<Gather>`, de modo que las devoluciones de llamada de voz obsoletas/reproducidas no puedan satisfacer un turno de transcripción pendiente más reciente.
- Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los encabezados de firma requeridos por el proveedor.
- El Webhook de voice-call usa el perfil de cuerpo preautenticación compartido (64 KB / 5 segundos) más un límite de solicitudes en curso por IP antes de la verificación de firma.

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

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de voice-call.
Usa `--file <path>` para apuntar a un registro diferente y `--last <n>` para limitar
el análisis a los últimos N registros (predeterminado 200). La salida incluye p50/p90/p99
para la latencia de turnos y los tiempos de espera de escucha.

## Herramienta de agente

Nombre de la herramienta: `voice_call`.

| Acción          | Argumentos                |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Este repositorio incluye una documentación de skill correspondiente en `skills/voice-call/SKILL.md`.

## RPC del Gateway

| Método               | Argumentos                |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Relacionado

- [Modo de conversación](/es/nodes/talk)
- [Texto a voz](/es/tools/tts)
- [Activación por voz](/es/nodes/voicewake)
