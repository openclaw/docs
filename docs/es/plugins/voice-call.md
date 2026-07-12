---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el plugin de llamadas de voz
    - Necesitas voz en tiempo real o transcripción en streaming para telefonía
sidebarTitle: Voice call
summary: Realiza llamadas de voz salientes y acepta llamadas entrantes mediante Twilio, Telnyx o Plivo, con voz en tiempo real y transcripción en streaming opcionales
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-07-11T23:24:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Llamadas de voz para OpenClaw mediante un plugin: notificaciones salientes, conversaciones
de varios turnos, voz en tiempo real bidireccional completa, transcripción en streaming y
llamadas entrantes con políticas de lista de permitidos.

**Proveedores:** `mock` (desarrollo, sin red), `plivo` (API de voz + transferencia XML +
voz de GetInput), `telnyx` (Call Control v2), `twilio` (voz programable +
Media Streams).

<Note>
El plugin de llamadas de voz se ejecuta **dentro del proceso del Gateway**. Si utiliza un
Gateway remoto, instale y configure el plugin en la máquina donde se ejecuta el
Gateway y, a continuación, reinicie el Gateway para cargarlo.
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

    Utilice el paquete sin versión para seguir la etiqueta de versión actual. Fije una versión
    exacta solo cuando necesite una instalación reproducible. Reinicie el Gateway
    después para que se cargue el plugin.

  </Step>
  <Step title="Configurar el proveedor y el Webhook">
    Establezca la configuración en `plugins.entries.voice-call.config` (consulte
    [Configuración](#configuration) más abajo). Como mínimo: `provider`, las credenciales
    del proveedor, `fromNumber` y una URL de Webhook accesible públicamente.
  </Step>
  <Step title="Verificar la configuración">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Comprueba la habilitación del plugin, las credenciales del proveedor, la exposición del Webhook y
    que solo esté activo un modo de audio (`streaming` o `realtime`).

  </Step>
  <Step title="Prueba de humo">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambos son simulaciones de forma predeterminada. Añada `--yes` para realizar una breve llamada
    de notificación saliente:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx y Plivo, la configuración debe resolverse en una **URL de Webhook pública**.
Si `publicUrl`, la URL del túnel, la URL de Tailscale o la alternativa de servicio
se resuelven en local loopback o en un espacio de red privado, la configuración falla en lugar de
iniciar un proveedor que no pueda recibir Webhooks del operador.
</Warning>

## Configuración

Si `enabled: true`, pero faltan credenciales para el proveedor seleccionado, el inicio del Gateway
registra una advertencia de configuración incompleta con las claves faltantes y omite
el inicio del entorno de ejecución. Los comandos, las llamadas RPC y las herramientas del agente siguen devolviendo
la configuración faltante exacta cuando se utilizan.

<Note>
Las credenciales de llamadas de voz aceptan SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` y `plugins.entries.voice-call.config.tts.providers.*.apiKey` se resuelven mediante la interfaz estándar de SecretRef; consulte [Interfaz de credenciales SecretRef](/es/reference/secretref-credential-surface).
</Note>

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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, ¿en qué puedo ayudarle?",
              responseSystemPrompt: "Es un especialista conciso en tarjetas de béisbol.",
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
            // region: "ie1", // opcional: us1 | ie1 | au1; el valor predeterminado es us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Clave pública del Webhook de Telnyx del Mission Control Portal
            // (Base64; también puede establecerse mediante TELNYX_PUBLIC_KEY).
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

          // Seguridad del Webhook (recomendada para túneles/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposición pública (elija una)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* consulte Transcripción en streaming */ },
          realtime: { enabled: false /* consulte Conversaciones de voz en tiempo real */ },
        },
      },
    },
  },
}
```

### Referencia de configuración

Claves de nivel superior de `plugins.entries.voice-call.config` no mostradas anteriormente:

| Clave                           | Valor predeterminado | Notas                                                                                           |
| ------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`              | Interruptor principal de activación/desactivación.                                              |
| `inboundPolicy`                 | `"disabled"`         | `disabled` \| `allowlist` \| `pairing` \| `open`. Consulte [Llamadas entrantes](#inbound-calls). |
| `allowFrom`                     | `[]`                 | Lista E.164 de permitidos para `inboundPolicy: "allowlist"`.                                     |
| `maxDurationSeconds`            | `300`                | Límite estricto de duración por llamada, aplicado independientemente de si se ha respondido.    |
| `staleCallReaperSeconds`        | `120`                | Consulte [Recolector de llamadas obsoletas](#stale-call-reaper). `0` lo desactiva.               |
| `silenceTimeoutMs`              | `800`                | Detección del silencio al final del habla para el flujo clásico (no en tiempo real).             |
| `transcriptTimeoutMs`           | `180000`             | Espera máxima de la transcripción del interlocutor antes de abandonar un turno.                  |
| `ringTimeoutMs`                 | `30000`              | Tiempo de espera del timbre para llamadas salientes.                                             |
| `maxConcurrentCalls`            | `1`                  | Se rechazan las llamadas salientes que superen este límite.                                     |
| `outbound.notifyHangupDelaySec` | `3`                  | Segundos de espera después de TTS antes de colgar automáticamente en el modo de notificación.    |
| `skipSignatureVerification`     | `false`              | Solo para pruebas locales; no lo habilite nunca en producción.                                  |
| `store`                         | sin establecer       | Sustituye la ruta predeterminada del registro de llamadas `~/.openclaw/voice-calls`.             |
| `agentId`                       | `"main"`             | Agente utilizado para generar respuestas y almacenar sesiones.                                  |
| `responseModel`                 | sin establecer       | Sustituye el modelo predeterminado para respuestas clásicas (no en tiempo real).                 |
| `responseSystemPrompt`          | generado             | Prompt de sistema personalizado para respuestas clásicas.                                       |
| `responseTimeoutMs`             | `30000`              | Tiempo de espera para generar respuestas clásicas (ms).                                          |

Twilio utiliza de forma predeterminada su endpoint REST US1. Para procesar llamadas en una región
compatible fuera de EE. UU., establezca `twilio.region` en `ie1` o `au1` y utilice credenciales de
esa región. Consulte
[la guía de Twilio para la API REST en regiones fuera de EE. UU.](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Notas sobre la exposición y la seguridad de los proveedores">
    - Twilio, Telnyx y Plivo requieren una URL de Webhook **accesible públicamente**.
    - `mock` es un proveedor de desarrollo local (sin llamadas de red).
    - Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`), a menos que `skipSignatureVerification` sea `true`.
    - `skipSignatureVerification` es solo para pruebas locales.
    - En el nivel gratuito de ngrok, establezca `publicUrl` en la URL exacta de ngrok; la verificación de firmas siempre se aplica.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es local loopback (agente local de ngrok). Solo para desarrollo local.
    - Las URL del nivel gratuito de ngrok pueden cambiar o añadir una página intermedia; si `publicUrl` cambia, las firmas de Twilio fallan. Para producción, prefiera un dominio estable o un funnel de Tailscale.

  </Accordion>
  <Accordion title="Límites de conexiones en streaming">
    - `streaming.preStartTimeoutMs` (valor predeterminado: `5000`) cierra los sockets que nunca envían una trama `start` válida.
    - `streaming.maxPendingConnections` (valor predeterminado: `32`) limita el total de sockets sin autenticar previos al inicio.
    - `streaming.maxPendingConnectionsPerIp` (valor predeterminado: `4`) limita los sockets sin autenticar previos al inicio por IP de origen.
    - `streaming.maxConnections` (valor predeterminado: `128`) limita todos los sockets abiertos de transmisión multimedia (pendientes + activos).

  </Accordion>
  <Accordion title="Migraciones de configuración antigua">
    El análisis de la configuración normaliza automáticamente estas claves antiguas y registra una
    advertencia que indica la ruta de sustitución; la capa de compatibilidad se eliminará en una versión
    futura (`2026.6.0`), así que ejecute `openclaw doctor --fix` para reescribir la configuración guardada
    con la estructura canónica:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - Se elimina `realtime.agentContext.includeSystemPrompt` (el contexto en tiempo real ahora utiliza el prompt generado del agente)

  </Accordion>
</AccordionGroup>

## Ámbito de la sesión

De forma predeterminada, Llamadas de voz utiliza `sessionScope: "per-phone"` para que las llamadas repetidas del
mismo interlocutor conserven la memoria de la conversación. Establezca `sessionScope: "per-call"` cuando
cada llamada del operador deba comenzar con un contexto nuevo, por ejemplo, para recepción,
reservas, IVR o flujos de puente de Google Meet en los que el mismo número de teléfono pueda
representar reuniones diferentes.

Llamadas de voz almacena las claves de sesión generadas en el espacio de nombres del agente configurado
(`agent:<agentId>:voice:*`). Las claves de integración explícitas sin procesar se resuelven en el
mismo espacio de nombres: una clave canónica `agent:<configuredAgentId>:*` conserva ese
propietario y respeta los alias de ámbito global/`session.mainKey` del núcleo; las entradas
`agent:*` ajenas o con formato incorrecto se delimitan como una clave opaca dentro del agente
configurado; `global` y `unknown` siguen siendo valores centinela globales.

## Conversaciones de voz en tiempo real

`realtime` selecciona un proveedor de voz en tiempo real bidireccional completa para el audio de llamadas en directo.
Es independiente de `streaming`, que solo reenvía el audio a proveedores de
transcripción en tiempo real.

<Warning>
`realtime.enabled` no puede combinarse con `streaming.enabled`. Elija un
modo de audio por llamada.
</Warning>

Comportamiento actual del entorno de ejecución:

- `realtime.enabled` es compatible con Twilio y Telnyx.
- `realtime.provider` es opcional. Si no se establece, Llamadas de voz usa el primer proveedor de voz en tiempo real registrado.
- Proveedores de voz en tiempo real incluidos: Google Gemini Live (`google`) y OpenAI (`openai`), registrados por sus Plugins de proveedor.
- La configuración sin procesar propiedad del proveedor se encuentra en `realtime.providers.<providerId>`.
- Llamadas de voz expone de forma predeterminada la herramienta compartida en tiempo real `openclaw_agent_consult`. El modelo en tiempo real puede llamarla cuando quien llama solicita un razonamiento más profundo, información actualizada o herramientas normales de OpenClaw.
- `realtime.consultPolicy` añade opcionalmente orientación sobre cuándo debe llamar el modelo en tiempo real a `openclaw_agent_consult`.
- `realtime.agentContext.enabled` está desactivado de forma predeterminada. Cuando se activa, Llamadas de voz incorpora una identidad acotada del agente y una cápsula de archivos seleccionados del espacio de trabajo en las instrucciones del proveedor en tiempo real al configurar la sesión.
- `realtime.fastContext.enabled` está desactivado de forma predeterminada. Cuando se activa, Llamadas de voz busca primero la pregunta de consulta en la memoria indexada y el contexto de la sesión, y devuelve esos fragmentos al modelo en tiempo real dentro del plazo de `realtime.fastContext.timeoutMs`; solo recurre al agente de consulta completo si `realtime.fastContext.fallbackToConsult` es `true`.
- Si `realtime.provider` apunta a un proveedor no registrado, o no hay ningún proveedor de voz en tiempo real registrado, Llamadas de voz registra una advertencia y omite los medios en tiempo real en lugar de provocar el fallo de todo el Plugin.
- `inboundPolicy` no debe ser `"disabled"` cuando `realtime.enabled` es `true`; `validateProviderConfig` rechaza esa combinación.
- Las claves de sesión de consulta reutilizan la sesión de llamada almacenada cuando está disponible y, en caso contrario, recurren al `sessionScope` configurado (`per-phone` de forma predeterminada o `per-call` para llamadas aisladas).

### Política de herramientas

`realtime.toolPolicy` controla la ejecución de la consulta:

| Política         | Comportamiento                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expone la herramienta de consulta y limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`.                         |
| `owner`          | Expone la herramienta de consulta y permite que el agente normal use la política habitual de herramientas del agente.                                               |
| `none`           | No expone la herramienta de consulta. Las herramientas personalizadas de `realtime.tools` se siguen transfiriendo al proveedor en tiempo real.                      |

`realtime.consultPolicy` controla únicamente las instrucciones del modelo en tiempo real:

| Política      | Orientación                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `auto`        | Mantiene el prompt predeterminado y permite que el proveedor decida cuándo llamar a la herramienta de consulta. |
| `substantive` | Responde directamente a enlaces conversacionales simples y consulta antes de usar hechos, memoria, herramientas o contexto. |
| `always`      | Consulta antes de cada respuesta sustantiva.                                                                     |

### Contexto de voz del agente

Active `realtime.agentContext` cuando el puente de voz deba sonar como el
agente de OpenClaw configurado sin pagar el recorrido completo de ida y vuelta
de una consulta al agente en los turnos normales. La cápsula de contexto se
añade una sola vez cuando se crea la sesión en tiempo real, por lo que no
añade latencia por turno. Las llamadas a `openclaw_agent_consult` siguen
ejecutando el agente completo de OpenClaw y deben usarse para trabajos con
herramientas, información actualizada, consultas de memoria o el estado del
espacio de trabajo.

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
    `GEMINI_API_KEY` o `GOOGLE_API_KEY`; modelo `gemini-3.1-flash-live-preview`;
    voz `Kore`. `sessionResumption` y `contextWindowCompression` están activados
    de forma predeterminada para llamadas más largas que puedan reconectarse.
    Use `silenceDurationMs`, `startSensitivity` y `endSensitivity` para ajustar
    una alternancia de turnos más rápida en el audio de telefonía.

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
                    model: "gemini-3.1-flash-live-preview",
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

Consulte [Proveedor de Google](/es/providers/google) y
[Proveedor de OpenAI](/es/providers/openai) para conocer las opciones de voz en
tiempo real específicas de cada proveedor.

## Transcripción por streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para el
audio de llamadas en directo.

Comportamiento actual en tiempo de ejecución:

- `streaming.provider` es opcional. Si no se establece, Llamadas de voz usa el primer proveedor de transcripción en tiempo real registrado.
- Proveedores de transcripción en tiempo real incluidos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI (`xai`), registrados por sus Plugins de proveedor.
- La configuración sin procesar propiedad del proveedor se encuentra en `streaming.providers.<providerId>`.
- Después de que Twilio envía un mensaje `start` de streaming aceptado, Llamadas de voz registra el streaming de inmediato, pone en cola los medios entrantes mediante el proveedor de transcripción mientras este se conecta e inicia el saludo inicial solo cuando la transcripción en tiempo real está lista.
- Si `streaming.provider` apunta a un proveedor no registrado, o no hay ninguno registrado, Llamadas de voz registra una advertencia y omite el streaming de medios en lugar de provocar el fallo de todo el Plugin.

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
    Valores predeterminados: clave de API `streaming.providers.xai.apiKey` o
    `XAI_API_KEY` (recurre a un perfil de autenticación OAuth de xAI si no se
    establece ninguna); endpoint `wss://api.x.ai/v1/stt`; codificación `mulaw`;
    frecuencia de muestreo `8000`; `endpointingMs: 800`; `interimResults: true`.

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

Llamadas de voz usa la configuración principal `messages.tts` para el
streaming de voz en las llamadas. Puede sobrescribirla en la configuración
del Plugin con la **misma estructura**; se combina en profundidad con
`messages.tts`.

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
**La voz de Microsoft se ignora en las llamadas de voz.** La síntesis de
telefonía requiere un proveedor que implemente una salida destinada a
telefonía; el proveedor de voz de Microsoft no lo hace, por lo que se omite
en las llamadas y se prueban en su lugar otros proveedores de la cadena de
respaldo.
</Warning>

Notas de comportamiento:

- Las claves heredadas `tts.<provider>` de la configuración del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) se reparan mediante `openclaw doctor --fix`; la configuración confirmada debe usar `tts.providers.<provider>`.
- El TTS principal se usa cuando el streaming de medios de Twilio está activado; de lo contrario, las llamadas recurren a las voces nativas del proveedor.
- Si ya hay un streaming de medios de Twilio activo, Llamadas de voz no recurre a `<Say>` de TwiML. Si el TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS de telefonía recurre a un proveedor secundario, Llamadas de voz registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para facilitar la depuración.
- Cuando la interrupción de voz de Twilio o la finalización del streaming vacían la cola de TTS pendiente, las solicitudes de reproducción en cola se resuelven en lugar de dejar bloqueadas a las personas que esperan que termine la reproducción.

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

La política de llamadas entrantes tiene el valor predeterminado `disabled`.
Para activar las llamadas entrantes, establezca:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` es un filtro de identificación de llamadas de baja fiabilidad. El Plugin
normaliza el valor `From` proporcionado por el proveedor y lo compara con `allowFrom`.
La verificación del Webhook autentica la entrega del proveedor y la integridad de la carga útil,
pero **no** demuestra la titularidad del número de llamada PSTN/VoIP. Trate
`allowFrom` como un filtro de identificación de llamadas, no como una identidad sólida de quien llama.
</Warning>

Las respuestas automáticas usan el sistema de agentes. Ajústelas con `responseModel`,
`responseSystemPrompt` y `responseTimeoutMs`.

### Enrutamiento por número

Use `numbers` cuando un Plugin Voice Call reciba llamadas para varios números de teléfono
y cada número deba comportarse como una línea diferente. Por ejemplo,
un número puede usar un asistente personal informal, mientras que otro usa una identidad
empresarial, un agente de respuesta diferente y una voz TTS distinta.

Las rutas se seleccionan a partir del número `To` marcado que proporciona el proveedor. Las claves deben
ser números E.164. Cuando llega una llamada, Voice Call resuelve una sola vez la
ruta coincidente, almacena la ruta correspondiente en el registro de la llamada y reutiliza esa
configuración efectiva para el saludo, la ruta clásica de respuesta automática, la ruta de
consulta en tiempo real y la reproducción TTS. Si ninguna ruta coincide, se usa la configuración
global de Voice Call. Las llamadas salientes no usan `numbers`; pase explícitamente el
destino saliente, el mensaje y la sesión al iniciar la llamada.

Actualmente, las rutas permiten sobrescribir:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

El valor de ruta `tts` se combina en profundidad con la configuración global `tts` de Voice Call, por lo que
normalmente puede sobrescribir solo la voz del proveedor:

```json5
{
  inboundGreeting: "Hola desde la línea principal.",
  responseSystemPrompt: "Eres el asistente de voz predeterminado.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, ¿en qué puedo ayudarle?",
      responseSystemPrompt: "Eres un especialista conciso en tarjetas de béisbol.",
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
que exige una respuesta JSON `{"spoken":"..."}`. Voice Call
extrae el texto hablado de forma defensiva:

- Ignora las cargas útiles marcadas como contenido de razonamiento o error.
- Analiza JSON directo, JSON delimitado o claves `"spoken"` en línea.
- Recurre al texto sin formato y elimina los párrafos introductorios que probablemente sean de planificación o metacontenido.

Esto mantiene la reproducción hablada centrada en el texto dirigido a quien llama y evita filtrar
texto de planificación al audio.

### Comportamiento al iniciar la conversación

En las llamadas `conversation` salientes, el manejo del primer mensaje está vinculado al estado de
reproducción en vivo:

- El vaciado de la cola por interrupción de voz y la respuesta automática se suprimen únicamente mientras se está reproduciendo activamente el saludo inicial.
- Si la reproducción inicial falla, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para volver a intentarlo.
- La reproducción inicial para la transmisión de Twilio comienza al conectarse el flujo, sin demora adicional.
- La interrupción de voz cancela la reproducción activa y elimina las entradas TTS de Twilio que están en cola pero aún no se reproducen. Las entradas eliminadas se resuelven como omitidas, por lo que la lógica de respuestas posteriores puede continuar sin esperar un audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el turno inicial propio del flujo en tiempo real. Voice Call **no** publica una actualización TwiML `<Say>` heredada para ese mensaje inicial, por lo que las sesiones salientes `<Connect><Stream>` permanecen conectadas.

### Período de gracia para la desconexión del flujo de Twilio

Cuando se desconecta un flujo multimedia de Twilio, Voice Call espera **2000 ms** antes de
finalizar automáticamente la llamada:

- Si el flujo se vuelve a conectar durante ese intervalo, se cancela la finalización automática.
- Si ningún flujo vuelve a registrarse tras el período de gracia, la llamada finaliza para evitar llamadas activas bloqueadas.

## Depurador de llamadas obsoletas

Use `staleCallReaperSeconds` (valor predeterminado: **120**) para finalizar las llamadas que nunca
se responden ni alcanzan un estado de conversación en vivo; por ejemplo, llamadas en modo de
notificación cuyo proveedor nunca entrega un Webhook terminal. Establézcalo en `0` para
desactivarlo.

El depurador se ejecuta cada 30 segundos y solo finaliza las llamadas que no tienen una marca de tiempo
`answeredAt` y que todavía no están en un estado terminal o en vivo
(`speaking`/`listening`), por lo que este temporizador nunca depura las conversaciones respondidas;
`maxDurationSeconds` (valor predeterminado: 300) es el límite independiente que
finaliza las llamadas respondidas que duran demasiado.

En los flujos de tipo notificación en los que los operadores pueden tardar en entregar los Webhooks
de timbre o respuesta, aumente `staleCallReaperSeconds` por encima del valor predeterminado para que las llamadas
lentas pero normales no se depuren antes de tiempo; entre `120` y `300` segundos es un intervalo
razonable para producción.

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

## Seguridad de los Webhooks

Cuando un proxy o túnel se encuentra delante del Gateway, el Plugin reconstruye
la URL pública para verificar la firma. Estas opciones controlan qué
encabezados reenviados son de confianza:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts permitidos de los encabezados de reenvío.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confía en los encabezados reenviados sin una lista de permitidos.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confía en los encabezados reenviados únicamente cuando la IP remota de la solicitud coincide con la lista.
</ParamField>

Protecciones adicionales:

- La **protección contra repetición** de Webhooks está habilitada para Twilio, Telnyx y Plivo. Las solicitudes de Webhook válidas repetidas se confirman, pero se omiten sus efectos secundarios.
- Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada de `<Gather>`, por lo que las devoluciones de llamada de voz obsoletas o repetidas no pueden satisfacer un turno de transcripción pendiente más reciente.
- Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los encabezados de firma obligatorios del proveedor.
- El Webhook de voice-call usa el perfil compartido de lectura del cuerpo previa a la autenticación (cuerpo máximo de 64 KB y tiempo de espera de lectura de 5 segundos), además de un límite de solicitudes en curso por clave (8 solicitudes simultáneas por clave de forma predeterminada) antes de verificar la firma.

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
delegan en el entorno de ejecución de voice-call propiedad del Gateway, de modo que la CLI no vincula un
segundo servidor de Webhooks. Si no se puede acceder a ningún Gateway, los comandos recurren a
un entorno de ejecución independiente de la CLI.

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de voice-call. Use
`--file <path>` para especificar un registro diferente y `--last <n>` para limitar
el análisis a los últimos N registros (valor predeterminado: 200). La salida incluye mínimo, máximo y promedio,
p50 y p95 para la latencia de los turnos y los tiempos de espera de escucha.

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

El Plugin voice-call incluye una Skills de agente correspondiente.

## RPC del Gateway

| Método                      | Argumentos                                                       | Notas                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Recurre a la configuración `toNumber` cuando se omite `to`.                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Igual que `initiate`, pero también acepta `dtmfSequence` antes de la conexión.           |
| `voicecall.continue`        | `callId`, `message`                                              | Bloquea hasta que se resuelve el turno; devuelve la transcripción.                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | Variante asíncrona: devuelve inmediatamente un `operationId`.                      |
| `voicecall.continue.result` | `operationId`                                                    | Consulta una operación `voicecall.continue.start` pendiente para obtener su resultado.      |
| `voicecall.speak`           | `callId`, `message`                                              | Habla sin esperar; usa el puente en tiempo real cuando `realtime.enabled`. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | Omita `callId` para enumerar todas las llamadas activas.                                   |

`dtmfSequence` solo es válido con `mode: "conversation"`; las llamadas en modo de notificación
deben usar `voicecall.dtmf` después de que exista la llamada si necesitan dígitos
posteriores a la conexión.

## Solución de problemas

### Falla la exposición del Webhook durante la configuración

Ejecute la configuración desde el mismo entorno en el que se ejecuta el Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Para `twilio`, `telnyx` y `plivo`, `webhook-exposure` debe estar en verde. Una
`publicUrl` configurada seguirá fallando cuando apunte a un espacio de red local o privado,
porque el operador no puede devolver llamadas a esas direcciones.
No use `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` ni otros intervalos de NAT
de nivel de operador como `publicUrl`.

Las llamadas salientes de Twilio en modo de notificación envían su TwiML `<Say>` inicial directamente
en la solicitud de creación de llamada, por lo que el primer mensaje hablado no depende de
que Twilio obtenga el TwiML del Webhook. Sigue siendo necesario un Webhook público para las devoluciones
de llamada de estado, las llamadas de conversación, DTMF antes de la conexión, los flujos en tiempo real y
el control de llamadas después de la conexión.

Use una ruta de exposición pública:

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

Después de cambiar la configuración, reinicie o recargue el Gateway y, a continuación, ejecute:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` es una ejecución de prueba a menos que pase `--yes`.

### Fallan las credenciales del proveedor

Compruebe el proveedor seleccionado y los campos de credenciales obligatorios:

- Twilio: `twilio.accountSid`, `twilio.authToken` y `fromNumber`, o
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` y
  `fromNumber`, o `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` y
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` y `fromNumber`, o
  `PLIVO_AUTH_ID` y `PLIVO_AUTH_TOKEN`.

Las credenciales deben existir en el host del Gateway. Editar un perfil del shell local
no afecta a un Gateway que ya está en ejecución hasta que este se reinicie o vuelva a cargar
su entorno.

### Las llamadas se inician, pero los Webhooks del proveedor no llegan

Confirme que la consola del proveedor apunte a la URL pública exacta del Webhook:

```text
https://voice.example.com/voice/webhook
```

A continuación, inspeccione el estado de ejecución:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causas habituales:

- `publicUrl` apunta a una ruta distinta de `serve.path`.
- La URL del túnel cambió después de que se iniciara el Gateway.
- Un proxy reenvía la solicitud, pero elimina o reescribe las cabeceras de host/protocolo.
- El cortafuegos o el DNS dirige el nombre de host público a un lugar distinto del Gateway.
- El Gateway se reinició sin el Plugin de llamadas de voz habilitado.

Cuando haya un proxy inverso o un túnel delante del Gateway, establezca
`webhookSecurity.allowedHosts` en el nombre de host público, o use
`webhookSecurity.trustedProxyIPs` para una dirección de proxy conocida. Use
`webhookSecurity.trustForwardingHeaders` únicamente cuando el límite del proxy esté
bajo su control.

### Falla la verificación de la firma

Las firmas del proveedor se comprueban con la URL pública que OpenClaw reconstruye
a partir de la solicitud entrante. Si las firmas fallan:

- Confirme que la URL del Webhook del proveedor coincida exactamente con `publicUrl`, incluidos el esquema, el host y la ruta.
- Para las URL del nivel gratuito de ngrok, actualice `publicUrl` cuando cambie el nombre de host del túnel.
- Asegúrese de que el proxy conserve las cabeceras originales de host y protocolo, o configure `webhookSecurity.allowedHosts`.
- No habilite `skipSignatureVerification` fuera de las pruebas locales.

### Fallan las conexiones de Google Meet mediante Twilio

Google Meet usa este Plugin para conectarse mediante el acceso telefónico de Twilio. Primero, verifique las llamadas
de voz:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

A continuación, verifique explícitamente el transporte de Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Si las llamadas de voz funcionan correctamente, pero el participante nunca se conecta a Meet, compruebe el
número de acceso telefónico de Meet, el PIN y `--dtmf-sequence`. La llamada telefónica puede funcionar correctamente
aunque la reunión rechace o ignore una secuencia DTMF incorrecta.

Google Meet inicia el tramo telefónico de Twilio mediante `voicecall.start` con una
secuencia DTMF previa a la conexión. Las secuencias derivadas del PIN incluyen el
valor `voiceCall.dtmfDelayMs` del Plugin de Google Meet (valor predeterminado: **12000 ms**)
como dígitos iniciales de espera de Twilio, ya que las indicaciones de acceso telefónico de Meet
pueden llegar tarde. A continuación, Llamadas de voz redirige el flujo de nuevo al procesamiento
en tiempo real antes de solicitar el saludo inicial.

Use `openclaw logs --follow` para consultar el seguimiento de las fases en directo. Una conexión
correcta de Twilio a Meet registra este orden:

- Google Meet delega la conexión mediante Twilio a Llamadas de voz.
- Llamadas de voz almacena el TwiML de DTMF previo a la conexión.
- El TwiML inicial de Twilio se consume y se entrega antes del procesamiento en tiempo real.
- Llamadas de voz entrega el TwiML en tiempo real para la llamada de Twilio.
- Google Meet solicita la locución introductoria con `voicecall.speak` después del retraso posterior a DTMF.

`openclaw voicecall tail` sigue mostrando los registros persistentes de las llamadas; resulta útil para
consultar el estado de las llamadas y las transcripciones, pero no todas las transiciones de Webhook o
en tiempo real aparecen allí.

### La llamada en tiempo real no tiene voz

Confirme que solo esté habilitado un modo de audio: `realtime.enabled` y
`streaming.enabled` no pueden tener ambos el valor verdadero.

Para las llamadas en tiempo real de Twilio/Telnyx, verifique también lo siguiente:

- Se ha cargado y registrado un Plugin de proveedor en tiempo real.
- `realtime.provider` no está definido o especifica un proveedor registrado.
- La clave de API del proveedor está disponible para el proceso del Gateway.
- `openclaw logs --follow` muestra que se entregó el TwiML en tiempo real, se inició el puente en tiempo real y se puso en cola el saludo inicial.

## Contenido relacionado

- [Modo de conversación](/es/nodes/talk)
- [Texto a voz](/es/tools/tts)
- [Activación por voz](/es/nodes/voicewake)
