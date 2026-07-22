---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Está configurando o desarrollando el plugin de llamadas de voz
    - Necesita voz en tiempo real o transcripción en streaming para telefonía
sidebarTitle: Voice call
summary: Realiza llamadas de voz salientes y acepta llamadas entrantes mediante Twilio, Telnyx o Plivo, con voz en tiempo real y transcripción por streaming opcionales
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-07-22T10:45:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 79f09f7b5cb99aace0960e283723d4f4408afa5f5dacd71f3c527fa62859f56f
    source_path: plugins/voice-call.md
    workflow: 16
---

Llamadas de voz para OpenClaw mediante un plugin: notificaciones salientes, conversaciones
de varios turnos, voz en tiempo real full-duplex, transcripción en streaming y
llamadas entrantes con políticas de listas de permitidos.

**Proveedores:** `mock` (desarrollo, sin red), `plivo` (API de voz + transferencia XML +
voz GetInput), `telnyx` (Call Control v2), `twilio` (voz programable +
Media Streams).

<Note>
El plugin de llamadas de voz se ejecuta **dentro del proceso del Gateway**. Si se utiliza un
Gateway remoto, instale y configure el plugin en la máquina que ejecuta el
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

    Use el paquete sin especificar versión para seguir la etiqueta de la versión actual. Fije una versión
exacta solo cuando necesite una instalación reproducible. Reinicie el Gateway
después para que se cargue el plugin.

  </Step>
  <Step title="Configurar el proveedor y el webhook">
    Establezca la configuración en `plugins.entries.voice-call.config` (consulte
    [Configuración](#configuration) más adelante). Como mínimo: `provider`, las credenciales
    del proveedor, `fromNumber` y una URL de webhook accesible públicamente.
  </Step>
  <Step title="Verificar la configuración">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Comprueba la activación del plugin, las credenciales del proveedor, la exposición del webhook y
    que solo esté activo un modo de audio (`streaming` o `realtime`).

  </Step>
  <Step title="Prueba de humo">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambas son simulaciones de forma predeterminada. Añada `--yes` para realizar una breve llamada
    de notificación saliente:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx y Plivo, la configuración debe resolver a una **URL de webhook pública**.
Si `publicUrl`, la URL del túnel, la URL de Tailscale o la alternativa de servicio
resuelven a un bucle local o a un espacio de red privado, la configuración falla en lugar de
iniciar un proveedor que no pueda recibir webhooks del operador.
</Warning>

## Configuración

Si `enabled: true` pero al proveedor seleccionado le faltan credenciales, el inicio del Gateway
registra una advertencia de configuración incompleta con las claves que faltan y omite
el inicio del entorno de ejecución. Los comandos, las llamadas RPC y las herramientas del agente siguen devolviendo
la configuración exacta que falta cuando se utilizan.

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
            // Clave pública del webhook de Telnyx procedente de Mission Control Portal
            // (Base64; también puede establecerse mediante TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor de webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Seguridad del webhook (recomendada para túneles/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposición pública (elija una opción)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* solo Twilio; consulte Transcripción en streaming */ },
          realtime: { enabled: false /* consulte Conversaciones de voz en tiempo real */ },
        },
      },
    },
  },
}
```

### Referencia de configuración

Claves de nivel superior en `plugins.entries.voice-call.config` que no se muestran anteriormente:

| Clave                           | Valor predeterminado | Notas                                                                                              |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Interruptor principal de activación/desactivación.                                                                              |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Consulte [Llamadas entrantes](#inbound-calls).             |
| `allowFrom`                     | `[]`         | Lista de permitidos E.164 para `inboundPolicy: "allowlist"`.                                                  |
| `maxDurationSeconds`            | `300`        | Límite estricto de duración por llamada, aplicado independientemente de si se ha respondido.                                 |
| `staleCallReaperSeconds`        | `120`        | Consulte [Depurador de llamadas obsoletas](#stale-call-reaper). `0` lo desactiva.                                      |
| `silenceTimeoutMs`              | `800`        | Detección de silencio al final del habla para el flujo clásico (no en tiempo real).                               |
| `transcriptTimeoutMs`           | `180000`     | Espera máxima para obtener la transcripción de la persona que llama antes de abandonar un turno.                                       |
| `ringTimeoutMs`                 | `30000`      | Tiempo de espera del timbre para las llamadas salientes.                                                                   |
| `maxConcurrentCalls`            | `1`          | Se rechazan las llamadas salientes que superen este límite.                                                     |
| `outbound.notifyHangupDelaySec` | `3`          | Segundos de espera después de TTS antes de colgar automáticamente en modo de notificación.                                       |
| `skipSignatureVerification`     | `false`      | Solo para pruebas locales; no se debe activar nunca en producción.                                                    |
| `store`                         | sin establecer        | Sobrescribe la ruta predeterminada `$OPENCLAW_STATE_DIR/voice-calls` (normalmente `~/.openclaw/voice-calls`). |
| `agentId`                       | `"main"`     | Agente utilizado para generar respuestas y almacenar sesiones.                                            |
| `responseModel`                 | sin establecer        | Sobrescribe el modelo predeterminado para las respuestas clásicas (no en tiempo real).                                  |
| `responseSystemPrompt`          | generado    | Prompt del sistema personalizado para las respuestas clásicas.                                                        |
| `responseTimeoutMs`             | `30000`      | Tiempo de espera para generar respuestas clásicas (ms).                                                      |

Twilio utiliza de forma predeterminada su endpoint REST US1. Para procesar llamadas en una región
no estadounidense compatible, establezca `twilio.region` en `ie1` o `au1` y utilice credenciales de
esa región. Consulte
[la guía de Twilio sobre la API REST en regiones no estadounidenses](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Notas sobre exposición y seguridad de los proveedores">
    - Twilio, Telnyx y Plivo requieren una URL de webhook **accesible públicamente**.
    - `mock` es un proveedor de desarrollo local (sin llamadas de red).
    - Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) salvo que `skipSignatureVerification` sea true.
    - `skipSignatureVerification` es solo para pruebas locales.
    - En el nivel gratuito de ngrok, establezca `publicUrl` en la URL exacta de ngrok; la verificación de firmas siempre se aplica.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es un bucle local (agente local de ngrok). Solo para desarrollo local.
    - Las URL del nivel gratuito de ngrok pueden cambiar o añadir un comportamiento intersticial; si `publicUrl` se desvía, las firmas de Twilio fallan. En producción: se recomienda un dominio estable o un funnel de Tailscale.

  </Accordion>
  <Accordion title="Límites de conexiones de streaming">
    - `streaming.preStartTimeoutMs` (valor predeterminado: `5000`) cierra los sockets que nunca envían una trama `start` válida.
    - `streaming.maxPendingConnections` (valor predeterminado: `32`) limita el total de sockets no autenticados anteriores al inicio.
    - `streaming.maxPendingConnectionsPerIp` (valor predeterminado: `4`) limita los sockets no autenticados anteriores al inicio por IP de origen.
    - `streaming.maxConnections` (valor predeterminado: `128`) limita todos los sockets de flujo multimedia abiertos (pendientes + activos).

  </Accordion>
  <Accordion title="Migraciones de configuración heredada">
    El análisis de la configuración normaliza automáticamente estas claves heredadas y registra una
    advertencia que indica la ruta de sustitución; la capa de compatibilidad se elimina en una versión
    futura (`2026.6.0`), por lo que debe ejecutar `openclaw doctor --fix` para reescribir la configuración
    confirmada con la estructura canónica:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` se elimina (el contexto en tiempo real ahora utiliza el prompt generado del agente)

  </Accordion>
</AccordionGroup>

## Ámbito de la sesión

De forma predeterminada, las llamadas de voz utilizan `sessionScope: "per-phone"` para que las llamadas repetidas
de la misma persona conserven la memoria de la conversación. Establezca `sessionScope: "per-call"` cuando
cada llamada del operador deba comenzar con contexto nuevo, por ejemplo, en flujos de recepción,
reservas, IVR o puentes de Google Meet donde el mismo número de teléfono pueda
representar reuniones diferentes.

Las llamadas de voz almacenan las claves de sesión generadas en el espacio de nombres del agente configurado
(`agent:<agentId>:voice:*`). Las claves explícitas sin procesar de la integración se resuelven en el
mismo espacio de nombres: una clave `agent:<configuredAgentId>:*` canónica conserva ese
propietario y respeta los alias de `session.mainKey`/ámbito global del núcleo; la entrada
`agent:*` externa o malformada se incluye como una clave opaca en el ámbito del agente
configurado; `global` y `unknown` siguen siendo centinelas globales.

## Conversaciones de voz en tiempo real

`realtime` selecciona un proveedor de voz full-duplex en tiempo real para el audio en directo de las llamadas.
Es independiente de `streaming`, que solo reenvía el audio a proveedores de
transcripción en tiempo real.

<Warning>
`realtime.enabled` no puede combinarse con `streaming.enabled`. Elija un
modo de audio por llamada.
</Warning>

Comportamiento actual del entorno de ejecución:

- `realtime.enabled` es compatible con Twilio y Telnyx.
- `realtime.provider` es opcional. Si no se establece, Voice Call utiliza el primer proveedor de voz en tiempo real registrado.
- Proveedores de voz en tiempo real incluidos: Google Gemini Live (`google`) y OpenAI (`openai`), registrados por sus plugins de proveedor.
- La configuración sin procesar propiedad del proveedor se encuentra en `realtime.providers.<providerId>`.
- Voice Call expone de forma predeterminada la herramienta compartida en tiempo real `openclaw_agent_consult`. El modelo en tiempo real puede llamarla cuando quien llama solicita un razonamiento más profundo, información actual o herramientas normales de OpenClaw.
- `realtime.consultPolicy` añade opcionalmente orientación sobre cuándo debe llamar el modelo en tiempo real a `openclaw_agent_consult`.
- `realtime.agentContext.enabled` está desactivado de forma predeterminada. Cuando se habilita, Voice Call inserta una identidad de agente acotada y una cápsula de archivos seleccionados del espacio de trabajo en las instrucciones del proveedor en tiempo real al configurar la sesión.
- `realtime.fastContext.enabled` está desactivado de forma predeterminada. Cuando se habilita, Voice Call busca primero en la memoria indexada y el contexto de la sesión la pregunta de consulta, y devuelve esos fragmentos al modelo en tiempo real dentro de `realtime.fastContext.timeoutMs` antes de recurrir al agente de consulta completo, solo si `realtime.fastContext.fallbackToConsult` es true.
- Si `realtime.provider` apunta a un proveedor no registrado, o si no hay ningún proveedor de voz en tiempo real registrado, Voice Call registra una advertencia y omite los medios en tiempo real en lugar de provocar un fallo de todo el plugin.
- `inboundPolicy` no debe ser `"disabled"` cuando `realtime.enabled` es true; `validateProviderConfig` rechaza esa combinación.
- Las claves de sesión de consulta reutilizan la sesión de llamada almacenada cuando está disponible y, si no, recurren al `sessionScope` configurado (`per-phone` de forma predeterminada o `per-call` para llamadas aisladas).

### Política de herramientas

`realtime.toolPolicy` controla la ejecución de la consulta:

| Política           | Comportamiento                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expone la herramienta de consulta y limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`. |
| `owner`          | Expone la herramienta de consulta y permite que el agente normal utilice la política habitual de herramientas del agente.                                                      |
| `none`           | No expone la herramienta de consulta. Los `realtime.tools` personalizados se siguen transfiriendo al proveedor en tiempo real.                               |

`realtime.consultPolicy` controla únicamente las instrucciones del modelo en tiempo real:

| Política        | Orientación                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Mantiene el prompt predeterminado y permite que el proveedor decida cuándo llamar a la herramienta de consulta.              |
| `substantive` | Responde directamente a los enlaces conversacionales sencillos y consulta antes de abordar hechos, memoria, herramientas o contexto. |
| `always`      | Consulta antes de cada respuesta sustancial.                                                        |

### Contexto de voz del agente

Habilite `realtime.agentContext` cuando el puente de voz deba sonar como el
agente de OpenClaw configurado sin incurrir en un ciclo completo de consulta al agente en
los turnos normales. La cápsula de contexto se añade una vez al crear la sesión
en tiempo real, por lo que no añade latencia por turno. Las llamadas a
`openclaw_agent_consult` siguen ejecutando el agente completo de OpenClaw y deben utilizarse
para trabajos con herramientas, información actual, consultas de memoria o estado del espacio de trabajo.

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
    o `GOOGLE_API_KEY`; modelo `gemini-3.1-flash-live-preview`;
    voz `Kore`. `sessionResumption` y `contextWindowCompression` están habilitados de forma predeterminada
    para llamadas más largas y reconectables. Utilice `silenceDurationMs`,
    `startSensitivity` y `endSensitivity` para ajustar una alternancia de turnos más rápida con
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
                instructions: "Habla brevemente. Llama a openclaw_agent_consult antes de usar herramientas más avanzadas.",
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
[Proveedor de OpenAI](/es/providers/openai) para ver las opciones de voz en tiempo real
específicas de cada proveedor.

## Transcripción en streaming

`streaming` conecta Twilio Media Streams a un proveedor de transcripción en tiempo real.
La ruta de streaming clásica requiere `provider: "twilio"`; se rechaza la configuración con
Telnyx, Plivo o simulación. El audio en directo de Telnyx utiliza en su lugar la ruta
`realtime.enabled` con autenticación independiente.

Comportamiento actual en tiempo de ejecución:

- `streaming.provider` es opcional. Si no se establece, Voice Call utiliza el primer proveedor de transcripción en tiempo real registrado.
- Proveedores de transcripción en tiempo real incluidos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI (`xai`), registrados por sus plugins de proveedor.
- La configuración sin procesar propiedad del proveedor se encuentra en `streaming.providers.<providerId>`.
- Después de que Twilio envía un mensaje `start` de streaming aceptado, Voice Call registra el streaming inmediatamente, pone en cola los medios entrantes mediante el proveedor de transcripción mientras este se conecta e inicia el saludo inicial solo cuando la transcripción en tiempo real está lista.
- Si `streaming.provider` apunta a un proveedor no registrado, o si no hay ninguno registrado, Voice Call registra una advertencia y omite el streaming de medios en lugar de provocar un fallo de todo el plugin.

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
    Valores predeterminados: clave de API `streaming.providers.xai.apiKey` o `XAI_API_KEY` (recurre
    a un perfil de autenticación OAuth de xAI si no se establece ninguna); endpoint
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

Voice Call utiliza la configuración principal `tts` para la síntesis de voz en streaming en
las llamadas. Puede sobrescribirla en la configuración del plugin con la **misma estructura**;
se combina de forma recursiva con `tts`.

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
**La síntesis de voz de Microsoft se ignora en las llamadas de voz.** La síntesis para telefonía requiere
un proveedor que implemente una salida destinada a telefonía; el proveedor de síntesis de voz de Microsoft
no lo hace, por lo que se omite en las llamadas y se prueban en su lugar otros proveedores de la
cadena de respaldo.
</Warning>

Notas de comportamiento:

- Las claves heredadas `tts.<provider>` dentro de la configuración del plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) son reparadas por `openclaw doctor --fix`; la configuración confirmada debe utilizar `tts.providers.<provider>`.
- Se utiliza el TTS principal cuando el streaming de medios de Twilio está habilitado; de lo contrario, las llamadas recurren a las voces nativas del proveedor.
- Si ya hay un streaming de medios de Twilio activo, Voice Call no recurre a `<Say>` de TwiML. Si el TTS para telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS para telefonía recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para facilitar la depuración.
- Cuando la interrupción por voz de Twilio o el cierre del streaming vacían la cola de TTS pendiente, las solicitudes de reproducción en cola se resuelven en lugar de dejar bloqueadas las llamadas que esperan que termine la reproducción.

### Ejemplos de TTS

<Tabs>
  <Tab title="Solo TTS del núcleo">
```json5
{
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "alloy" },
    },
  },
}
```
  </Tab>
  <Tab title="Sustituir por ElevenLabs (solo llamadas)">
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
  <Tab title="Sustitución del modelo de OpenAI (fusión profunda)">
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

La política de llamadas entrantes usa de forma predeterminada `disabled`. Para habilitar las llamadas entrantes, configure:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "¡Hola! ¿Cómo puedo ayudar?",
}
```

<Warning>
`inboundPolicy: "allowlist"` es una comprobación de identificación de llamada con un nivel de garantía bajo. El plugin
normaliza el valor `From` proporcionado por el proveedor y lo compara con `allowFrom`.
La verificación del Webhook autentica la entrega del proveedor y la integridad de la carga útil,
pero **no** demuestra la titularidad del número de llamada PSTN/VoIP. Considere
`allowFrom` un filtro de identificación de llamada, no una identidad sólida de la persona que llama.
</Warning>

Las respuestas automáticas usan el sistema del agente. Ajústelas con `responseModel`,
`responseSystemPrompt` y `responseTimeoutMs`.

### Enrutamiento por número

Use `numbers` cuando un Plugin de llamadas de voz reciba llamadas para varios números
de teléfono y cada número deba comportarse como una línea diferente. Por ejemplo,
un número puede usar un asistente personal informal, mientras que otro usa una
personalidad empresarial, un agente de respuesta diferente y una voz TTS distinta.

Las rutas se seleccionan a partir del número marcado `To` proporcionado por el proveedor. Las claves deben
ser números E.164. Cuando llega una llamada, Llamadas de voz resuelve una vez la
ruta coincidente, almacena la ruta encontrada en el registro de la llamada y reutiliza esa
configuración efectiva para el saludo, la ruta clásica de respuesta automática, la
ruta de consulta en tiempo real y la reproducción de TTS. Si ninguna ruta coincide, se
usa la configuración global de Llamadas de voz. Las llamadas salientes no usan `numbers`; pase
explícitamente el destino saliente, el mensaje y la sesión al iniciar la llamada.

Actualmente, las sustituciones de ruta admiten:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

El valor de ruta `tts` se fusiona en profundidad sobre la configuración global `tts` de Llamadas de voz, por lo que
normalmente se puede sustituir solo la voz del proveedor:

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
      inboundGreeting: "Silver Fox Cards, ¿cómo puedo ayudar?",
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

Para las respuestas automáticas, Llamadas de voz añade un contrato estricto de salida hablada al
prompt del sistema que exige una respuesta JSON `{"spoken":"..."}`. Llamadas de voz
extrae el texto hablado de forma defensiva:

- Ignora las cargas útiles marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON delimitado o claves `"spoken"` en línea.
- Recurre al texto sin formato y elimina los párrafos iniciales que probablemente sean de planificación o metacontenido.

Esto mantiene la reproducción hablada centrada en el texto dirigido a la persona que llama y evita filtrar
texto de planificación en el audio.

### Comportamiento al iniciar una conversación

Para las llamadas salientes `conversation`, el tratamiento del primer mensaje está vinculado al estado de
reproducción en directo:

- El vaciado de la cola por interrupción y la respuesta automática se suprimen solo mientras el saludo inicial se está reproduciendo activamente.
- Si falla la reproducción inicial, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para volver a intentarlo.
- La reproducción inicial para la transmisión de Twilio comienza al conectarse la transmisión, sin demora adicional.
- La interrupción detiene la reproducción activa y borra las entradas TTS de Twilio que están en cola pero aún no se reproducen. Las entradas eliminadas se resuelven como omitidas, de modo que la lógica de respuesta posterior puede continuar sin esperar un audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el turno inicial propio de la transmisión en tiempo real. Llamadas de voz **no** publica una actualización TwiML heredada `<Say>` para ese mensaje inicial, por lo que las sesiones salientes `<Connect><Stream>` permanecen vinculadas.

### Período de gracia para la desconexión de transmisiones de Twilio

Cuando se desconecta una transmisión multimedia de Twilio, Llamadas de voz espera **2000 ms** antes de
finalizar automáticamente la llamada:

- Si la transmisión se vuelve a conectar durante ese período, se cancela la finalización automática.
- Si ninguna transmisión se vuelve a registrar después del período de gracia, la llamada finaliza para evitar llamadas activas bloqueadas.

## Recolector de llamadas obsoletas

Use `staleCallReaperSeconds` (valor predeterminado: **120**) para finalizar llamadas que nunca
se responden ni alcanzan un estado de conversación en directo, por ejemplo, llamadas en modo de
notificación para las que el proveedor nunca entrega un Webhook terminal. Establézcalo en `0` para
deshabilitarlo.

El recolector se ejecuta cada 30 segundos y solo finaliza las llamadas que no tienen
una marca de tiempo `answeredAt` y que todavía no están en un estado terminal o en directo
(`speaking`/`listening`), por lo que este temporizador nunca recolecta las conversaciones
respondidas; `maxDurationSeconds` (valor predeterminado: 300) es el límite independiente que
finaliza las llamadas respondidas que duran demasiado.

Para los flujos de tipo notificación en los que los operadores pueden tardar en entregar los Webhooks
de timbre/respuesta, aumente `staleCallReaperSeconds` por encima del valor predeterminado para que las
llamadas lentas pero normales no se recolecten antes de tiempo; `120`-`300` segundos es un intervalo razonable para producción.

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

## Seguridad del Webhook

Cuando hay un proxy o túnel delante del Gateway, el plugin reconstruye
la URL pública para verificar la firma. Estas opciones controlan qué
encabezados reenviados son de confianza:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts permitidos de los encabezados de reenvío.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confiar en los encabezados reenviados sin una lista de permitidos.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confiar en los encabezados reenviados solo cuando la IP remota de la solicitud coincida con la lista.
</ParamField>

Protecciones adicionales:

- La **protección contra repetición** de Webhooks está habilitada para Twilio, Telnyx y Plivo. Las solicitudes válidas de Webhook repetidas se confirman, pero se omiten sus efectos secundarios.
- Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada `<Gather>`, por lo que las devoluciones de llamada de voz obsoletas o repetidas no pueden satisfacer un turno de transcripción pendiente más reciente.
- Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los encabezados de firma requeridos por el proveedor.
- El Webhook de llamadas de voz usa el perfil compartido de lectura del cuerpo previo a la autenticación (cuerpo máximo de 64 KB y tiempo de espera de lectura de 5 segundos), además de un límite de solicitudes en curso por clave (8 solicitudes simultáneas por clave de forma predeterminada) antes de verificar la firma.

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
openclaw voicecall latency                      # resume la latencia de los turnos a partir de los registros
openclaw voicecall expose --mode funnel
```

Cuando el Gateway ya está en ejecución, los comandos operativos `voicecall`
delegan en el entorno de ejecución de llamadas de voz propiedad del Gateway para que la CLI no vincule un
segundo servidor de Webhooks. Si no se puede acceder a ningún Gateway, los comandos recurren a
un entorno de ejecución independiente de la CLI.

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de llamadas de voz. Use
`--file <path>` para indicar un registro diferente y `--last <n>` para limitar
el análisis a los últimos N registros (valor predeterminado: 200). La salida incluye mínimo/máximo/promedio,
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

El plugin de llamadas de voz incluye una Skills de agente correspondiente.

## RPC del Gateway

| Método                      | Argumentos                                                             | Notas                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Recurre a la configuración de `toNumber` cuando se omite `to`.                     |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Igual que `initiate`, pero también acepta `dtmfSequence` previo a la conexión.           |
| `voicecall.continue`        | `callId`, `message`                                              | Bloquea hasta que se resuelve el turno; devuelve la transcripción.                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | Variante asíncrona: devuelve inmediatamente un `operationId`.                      |
| `voicecall.continue.result` | `operationId`                                                    | Consulta periódicamente el resultado de una operación `voicecall.continue.start` pendiente.      |
| `voicecall.speak`           | `callId`, `message`                                              | Habla sin esperar; usa el puente en tiempo real cuando `realtime.enabled`. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | Omita `callId` para enumerar todas las llamadas activas.                                   |

`dtmfSequence` solo es válido con `mode: "conversation"`; las llamadas en modo de notificación
que necesiten dígitos posteriores a la conexión deben usar `voicecall.dtmf` después de que
exista la llamada.

## Solución de problemas

### La configuración no logra exponer el webhook

Ejecute la configuración desde el mismo entorno donde se ejecuta el Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Para `twilio`, `telnyx` y `plivo`, `webhook-exposure` debe estar en verde. Un
`publicUrl` configurado sigue fallando cuando apunta a un espacio de red local
o privado, porque el operador no puede devolver llamadas a esas direcciones.
No use `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` ni otros rangos
de NAT de nivel de operador como `publicUrl`.

Las llamadas salientes de Twilio en modo de notificación envían su TwiML `<Say>` inicial
directamente en la solicitud de creación de llamada, por lo que el primer mensaje hablado no depende
de que Twilio obtenga el TwiML del webhook. Sigue siendo necesario un webhook público para las
devoluciones de llamada de estado, las llamadas conversacionales, DTMF previo a la conexión,
las transmisiones en tiempo real y el control de llamadas posterior a la conexión.

Use una vía de exposición pública:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // o
          tunnel: { provider: "ngrok" },
          // o
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

`voicecall smoke` es una ejecución de prueba a menos que se pase `--yes`.

### Fallan las credenciales del proveedor

Compruebe el proveedor seleccionado y los campos de credenciales obligatorios:

- Twilio: `twilio.accountSid`, `twilio.authToken` y `fromNumber`, o
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` y
  `fromNumber`, o `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` y
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` y `fromNumber`, o
  `PLIVO_AUTH_ID` y `PLIVO_AUTH_TOKEN`.

Las credenciales deben existir en el host del Gateway. Editar un perfil de shell local
no afecta a un Gateway que ya se está ejecutando hasta que se reinicie o recargue su
entorno.

### Las llamadas se inician, pero no llegan los webhooks del proveedor

Confirme que la consola del proveedor apunta a la URL pública exacta del webhook:

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
- Un proxy reenvía la solicitud, pero elimina o reescribe los encabezados de host/protocolo.
- El firewall o DNS dirige el nombre de host público a un lugar distinto del Gateway.
- El Gateway se reinició sin el plugin Voice Call habilitado.

Cuando haya un proxy inverso o un túnel delante del Gateway, establezca
`webhookSecurity.allowedHosts` en el nombre de host público o use
`webhookSecurity.trustedProxyIPs` para una dirección de proxy conocida. Use
`webhookSecurity.trustForwardingHeaders` únicamente cuando el límite del proxy
esté bajo su control.

### Falla la verificación de firmas

Las firmas del proveedor se comprueban con la URL pública que OpenClaw reconstruye
a partir de la solicitud entrante. Si las firmas fallan:

- Confirme que la URL del webhook del proveedor coincida exactamente con `publicUrl`, incluidos el esquema, el host y la ruta.
- Para las URL del nivel gratuito de ngrok, actualice `publicUrl` cuando cambie el nombre de host del túnel.
- Asegúrese de que el proxy conserve los encabezados originales de host y protocolo, o configure `webhookSecurity.allowedHosts`.
- No habilite `skipSignatureVerification` fuera de las pruebas locales.

### Fallan las conexiones de Google Meet mediante Twilio

Google Meet usa este plugin para conectarse mediante el acceso telefónico de Twilio. Primero, verifique Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

A continuación, verifique explícitamente el transporte de Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call está en verde, pero el participante nunca se conecta a Meet, compruebe el número
de acceso telefónico de Meet, el PIN y `--dtmf-sequence`. La llamada telefónica puede funcionar
correctamente aunque la reunión rechace o ignore una secuencia DTMF incorrecta.

Google Meet inicia el tramo telefónico de Twilio mediante `voicecall.start` con una
secuencia DTMF previa a la conexión. Las secuencias derivadas del PIN incluyen el
`voiceCall.dtmfDelayMs` del plugin de Google Meet (valor predeterminado: **12000 ms**) como dígitos
de espera iniciales de Twilio, ya que las indicaciones de acceso telefónico de Meet pueden llegar tarde.
Voice Call vuelve a redirigir al procesamiento en tiempo real antes de solicitar el saludo introductorio.

Use `openclaw logs --follow` para ver el seguimiento de fases en tiempo real. Una conexión de Meet
mediante Twilio que funciona correctamente registra este orden:

- Google Meet delega la conexión de Twilio en Voice Call.
- Voice Call almacena el TwiML de DTMF previo a la conexión.
- El TwiML inicial de Twilio se consume y se sirve antes del procesamiento en tiempo real.
- Voice Call sirve TwiML en tiempo real para la llamada de Twilio.
- Google Meet solicita la locución introductoria con `voicecall.speak` después del retraso posterior al DTMF.

`openclaw voicecall tail` sigue mostrando los registros de llamadas persistentes; resulta útil para
el estado de las llamadas y las transcripciones, pero no todas las transiciones de webhook
o en tiempo real aparecen allí.

### La llamada en tiempo real no tiene voz

Confirme que solo esté habilitado un modo de audio: `realtime.enabled` y
`streaming.enabled` no pueden ser ambos verdaderos.

Para las llamadas en tiempo real de Twilio/Telnyx, verifique también:

- Hay un plugin de proveedor en tiempo real cargado y registrado.
- `realtime.provider` no está establecido o nombra un proveedor registrado.
- La clave de API del proveedor está disponible para el proceso del Gateway.
- `openclaw logs --follow` muestra que se sirvió el TwiML en tiempo real, se inició el puente en tiempo real y se puso en cola el saludo inicial.

## Temas relacionados

- [Modo de conversación](/es/nodes/talk)
- [Texto a voz](/es/tools/tts)
- [Activación por voz](/es/nodes/voicewake)
