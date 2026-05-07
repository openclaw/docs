---
read_when:
    - Configurar OpenClaw por primera vez
    - Buscando patrones de configuración comunes
    - Navegar a secciones específicas de configuración
summary: 'Descripción general de la configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-05-07T13:16:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b64a49882b8649280fc4f4e39bf025ccc1bdf6a813b7940a6d57ee857aea5a77
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lee una configuración opcional <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`.
La ruta de configuración activa debe ser un archivo normal. Los diseños de `openclaw.json`
con enlaces simbólicos no son compatibles con escrituras propiedad de OpenClaw; una escritura atómica puede reemplazar
la ruta en lugar de preservar el enlace simbólico. Si mantienes la configuración fuera del
directorio de estado predeterminado, apunta `OPENCLAW_CONFIG_PATH` directamente al archivo real.

Si falta el archivo, OpenClaw usa valores predeterminados seguros. Motivos comunes para añadir una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Configurar modelos, herramientas, sandboxing o automatización (Cron, hooks)
- Ajustar sesiones, multimedia, redes o UI

Consulta la [referencia completa](/es/gateway/configuration-reference) para ver todos los campos disponibles.

Los agentes y la automatización deben usar `config.schema.lookup` para obtener documentación exacta
a nivel de campo antes de editar la configuración. Usa esta página para orientación orientada a tareas y
la [referencia de configuración](/es/gateway/configuration-reference) para el mapa de campos más amplio
y los valores predeterminados.

<Tip>
**¿Primera vez con la configuración?** Empieza con `openclaw onboard` para una configuración interactiva, o consulta la guía de [Ejemplos de configuración](/es/gateway/configuration-examples) para configuraciones completas listas para copiar y pegar.
</Tip>

## Configuración mínima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Editar la configuración

<Tabs>
  <Tab title="Asistente interactivo">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (comandos de una línea)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI de control">
    Abre [http://127.0.0.1:18789](http://127.0.0.1:18789) y usa la pestaña **Configuración**.
    La UI de control renderiza un formulario a partir del esquema de configuración en vivo, incluyendo metadatos
    de documentación `title` / `description` de los campos, además de esquemas de plugins y canales cuando
    están disponibles, con un editor **JSON sin procesar** como vía de escape. Para UI de desglose
    y otras herramientas, el Gateway también expone `config.schema.lookup` para
    obtener un nodo de esquema limitado a una ruta y resúmenes de sus hijos inmediatos.
  </Tab>
  <Tab title="Edición directa">
    Edita `~/.openclaw/openclaw.json` directamente. El Gateway vigila el archivo y aplica los cambios automáticamente (consulta la [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coinciden completamente con el esquema. Las claves desconocidas, los tipos mal formados o los valores no válidos hacen que el Gateway **se niegue a iniciar**. La única excepción a nivel raíz es `$schema` (cadena), para que los editores puedan adjuntar metadatos de JSON Schema.
</Warning>

`openclaw config schema` imprime el JSON Schema canónico usado por la UI de control
y la validación. `config.schema.lookup` obtiene un único nodo limitado a una ruta más
resúmenes de hijos para herramientas de desglose. Los metadatos de documentación `title`/`description`
de los campos se trasladan a través de objetos anidados, comodines (`*`), elementos de array (`[]`) y ramas `anyOf`/
`oneOf`/`allOf`. Los esquemas de plugins y canales en tiempo de ejecución se combinan cuando se carga
el registro de manifiestos.

Cuando la validación falla:

- El Gateway no arranca
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecuta `openclaw doctor` para ver los problemas exactos
- Ejecuta `openclaw doctor --fix` (o `--yes`) para aplicar reparaciones

El Gateway conserva una copia confiable de la última configuración válida conocida después de cada inicio correcto,
pero el inicio y la recarga en caliente no la restauran automáticamente. Si `openclaw.json`
falla la validación (incluida la validación local del plugin), el inicio del Gateway falla o
la recarga se omite y el runtime actual conserva la última configuración aceptada.
Ejecuta `openclaw doctor --fix` (o `--yes`) para reparar configuración prefijada/sobrescrita o
restaurar la copia de la última configuración válida conocida. La promoción a última configuración válida conocida se omite cuando una
candidata contiene marcadores de posición de secretos redactados como `***`.

## Tareas comunes

<AccordionGroup>
  <Accordion title="Configurar un canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tiene su propia sección de configuración bajo `channels.<provider>`. Consulta la página dedicada del canal para los pasos de configuración:

    - [WhatsApp](/es/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/es/channels/telegram) - `channels.telegram`
    - [Discord](/es/channels/discord) - `channels.discord`
    - [Feishu](/es/channels/feishu) - `channels.feishu`
    - [Google Chat](/es/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/es/channels/msteams) - `channels.msteams`
    - [Slack](/es/channels/slack) - `channels.slack`
    - [Signal](/es/channels/signal) - `channels.signal`
    - [iMessage](/es/channels/imessage) - `channels.imessage`
    - [Mattermost](/es/channels/mattermost) - `channels.mattermost`

    Todos los canales comparten el mismo patrón de política de DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Elegir y configurar modelos">
    Configura el modelo principal y los fallbacks opcionales:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` define el catálogo de modelos y actúa como la lista de permitidos para `/model`.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas a la lista de permitidos sin eliminar modelos existentes. Los reemplazos simples que eliminarían entradas se rechazan salvo que pases `--replace`.
    - Las referencias de modelo usan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de imágenes de transcripción/herramientas (valor predeterminado `1200`); los valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulta [CLI de modelos](/es/concepts/models) para cambiar de modelo en el chat y [Failover de modelos](/es/concepts/model-failover) para la rotación de autenticación y el comportamiento de fallback.
    - Para proveedores personalizados/autohospedados, consulta [Proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controla quién puede enviar mensajes al bot">
    El acceso a DM se controla por canal mediante `dmPolicy`:

    - `"pairing"` (predeterminado): los remitentes desconocidos reciben un código de emparejamiento de un solo uso para aprobar
    - `"allowlist"`: solo remitentes en `allowFrom` (o en el almacén de permitidos emparejados)
    - `"open"`: permite todos los DM entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los DM

    Para grupos, usa `groupPolicy` + `groupAllowFrom` o listas de permitidos específicas del canal.

    Consulta la [referencia completa](/es/gateway/config-channels#dm-and-group-access) para obtener detalles por canal.

  </Accordion>

  <Accordion title="Configura el control de menciones en chats grupales">
    Los mensajes de grupo requieren **mención** de forma predeterminada. Configura patrones de activación por agente y mantén las respuestas visibles de salas en la ruta predeterminada de herramienta de mensajes, a menos que quieras intencionalmente respuestas finales automáticas heredadas:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Menciones de metadatos**: @-menciones nativas (WhatsApp tocar para mencionar, Telegram @bot, etc.)
    - **Patrones de texto**: patrones regex seguros en `mentionPatterns`
    - **Respuestas visibles**: `messages.visibleReplies` puede requerir envíos mediante herramienta de mensajes globalmente; `messages.groupChat.visibleReplies` lo reemplaza para grupos/canales.
    - Consulta la [referencia completa](/es/gateway/config-channels#group-chat-mention-gating) para los modos de respuesta visible, reemplazos por canal y modo de chat propio.

  </Accordion>

  <Accordion title="Restringe Skills por agente">
    Usa `agents.defaults.skills` como base compartida y luego reemplaza agentes específicos con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Omite `agents.defaults.skills` para Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar los valores predeterminados.
    - Configura `agents.list[].skills: []` para no usar Skills.
    - Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y
      la [Referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajusta el monitoreo de salud de canales del Gateway">
    Controla con qué agresividad el Gateway reinicia canales que parecen obsoletos:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Configura `gateway.channelHealthCheckMinutes: 0` para desactivar globalmente los reinicios del monitor de salud.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de comprobación.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desactivar los reinicios automáticos de un canal o cuenta sin desactivar el monitor global.
    - Consulta [Comprobaciones de salud](/es/gateway/health) para depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para todos los campos.

  </Accordion>

  <Accordion title="Ajusta el tiempo de espera del handshake WebSocket del Gateway">
    Da a los clientes locales más tiempo para completar el handshake WebSocket previo a la autenticación en hosts cargados o de baja potencia:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - El valor predeterminado es `15000` milisegundos.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` sigue teniendo prioridad para reemplazos puntuales de servicio o shell.
    - Prefiere corregir primero los bloqueos de inicio/bucle de eventos; este control es para hosts que están sanos pero son lentos durante el calentamiento.

  </Accordion>

  <Accordion title="Configura sesiones y restablecimientos">
    Las sesiones controlan la continuidad y el aislamiento de la conversación:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (compartido) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones vinculado a hilos (Discord admite `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age`).
    - Consulta [Gestión de sesiones](/es/concepts/session) para alcance, enlaces de identidad y política de envío.
    - Consulta la [referencia completa](/es/gateway/config-agents#session) para todos los campos.

  </Accordion>

  <Accordion title="Habilitar sandboxing">
    Ejecuta sesiones de agente en runtimes de sandbox aislados:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Construye primero la imagen: desde un checkout de código fuente, ejecuta `scripts/sandbox-setup.sh`; o desde una instalación npm, consulta el comando `docker build` en línea en [Sandboxing § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup).

    Consulta [Sandboxing](/es/gateway/sandboxing) para ver la guía completa y la [referencia completa](/es/gateway/config-agents#agentsdefaultssandbox) para todas las opciones.

  </Accordion>

  <Accordion title="Habilitar push respaldado por relay para compilaciones oficiales de iOS">
    El push respaldado por relay se configura en `openclaw.json`.

    Establece esto en la configuración de Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Equivalente en CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Qué hace esto:

    - Permite que el Gateway envíe `push.test`, avisos de activación y activaciones de reconexión a través del relay externo.
    - Usa una concesión de envío con alcance de registro reenviada por la app de iOS emparejada. El Gateway no necesita un token de relay para todo el despliegue.
    - Vincula cada registro respaldado por relay a la identidad del Gateway con la que se emparejó la app de iOS, de modo que otro Gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales/manuales de iOS en APNs directo. Los envíos respaldados por relay se aplican solo a compilaciones distribuidas oficiales que se registraron a través del relay.
    - Debe coincidir con la URL base del relay integrada en la compilación oficial/TestFlight de iOS, para que el tráfico de registro y envío llegue al mismo despliegue de relay.

    Flujo de extremo a extremo:

    1. Instala una compilación oficial/TestFlight de iOS que se haya compilado con la misma URL base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` en el Gateway.
    3. Empareja la app de iOS con el Gateway y deja que se conecten las sesiones de node y de operador.
    4. La app de iOS obtiene la identidad del Gateway, se registra con el relay usando App Attest más el recibo de la app, y luego publica la carga `push.apns.register` respaldada por relay en el Gateway emparejado.
    5. El Gateway almacena el identificador del relay y la concesión de envío, y luego los usa para `push.test`, avisos de activación y activaciones de reconexión.

    Notas operativas:

    - Si cambias la app de iOS a otro Gateway, vuelve a conectar la app para que pueda publicar un nuevo registro de relay vinculado a ese Gateway.
    - Si publicas una nueva compilación de iOS que apunta a un despliegue de relay distinto, la app actualiza su registro de relay en caché en lugar de reutilizar el origen de relay anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como sobrescrituras temporales de entorno.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape de desarrollo solo para loopback; no persistas URL de relay HTTP en la configuración.

    Consulta [App de iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para ver el flujo de extremo a extremo y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para el modelo de seguridad del relay.

  </Accordion>

  <Accordion title="Configurar Heartbeat (comprobaciones periódicas)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: cadena de duración (`30m`, `2h`). Establece `0m` para deshabilitarlo.
    - `target`: `last` | `none` | `<channel-id>` (por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predeterminado) o `block` para destinos de Heartbeat de estilo DM
    - Consulta [Heartbeat](/es/gateway/heartbeat) para ver la guía completa.

  </Accordion>

  <Accordion title="Configurar trabajos Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: poda sesiones de ejecución aislada completadas de `sessions.json` (predeterminado `24h`; establece `false` para deshabilitarlo).
    - `runLog`: poda `cron/runs/<jobId>.jsonl` por tamaño y líneas retenidas.
    - Consulta [trabajos Cron](/es/automation/cron-jobs) para ver la descripción general de la función y ejemplos de CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (hooks)">
    Habilita endpoints Webhook HTTP en el Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Nota de seguridad:
    - Trata todo el contenido de cargas de hooks/webhooks como entrada no confiable.
    - Usa un `hooks.token` dedicado; no reutilices el token compartido del Gateway.
    - La autenticación de hooks es solo por encabezado (`Authorization: Bearer ...` o `x-openclaw-token`); los tokens en cadenas de consulta se rechazan.
    - `hooks.path` no puede ser `/`; mantén la entrada de Webhook en una subruta dedicada, como `/hooks`.
    - Mantén deshabilitadas las marcas de omisión de contenido inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) salvo que estés haciendo depuración con alcance muy limitado.
    - Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para limitar las claves de sesión seleccionadas por el llamador.
    - Para agentes controlados por hooks, prefiere niveles de modelos modernos y sólidos y una política estricta de herramientas (por ejemplo, solo mensajería más sandboxing cuando sea posible).

    Consulta la [referencia completa](/es/gateway/configuration-reference#hooks) para todas las opciones de mapeo y la integración de Gmail.

  </Accordion>

  <Accordion title="Configurar enrutamiento multiagente">
    Ejecuta varios agentes aislados con espacios de trabajo y sesiones separados:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Consulta [Multiagente](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/config-agents#multi-agent-routing) para reglas de vinculación y perfiles de acceso por agente.

  </Accordion>

  <Accordion title="Dividir la configuración en varios archivos ($include)">
    Usa `$include` para organizar configuraciones grandes:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Archivo único**: reemplaza el objeto contenedor
    - **Array de archivos**: se fusionan en profundidad en orden (el posterior gana)
    - **Claves hermanas**: se fusionan después de los includes (sobrescriben los valores incluidos)
    - **Includes anidados**: admitidos hasta 10 niveles de profundidad
    - **Rutas relativas**: se resuelven en relación con el archivo que incluye
    - **Escrituras propiedad de OpenClaw**: cuando una escritura cambia solo una sección de nivel superior
      respaldada por un include de archivo único como `plugins: { $include: "./plugins.json5" }`,
      OpenClaw actualiza ese archivo incluido y deja `openclaw.json` intacto
    - **Escritura transitiva no admitida**: los includes raíz, los arrays de includes y los includes
      con sobrescrituras hermanas fallan de forma cerrada para escrituras propiedad de OpenClaw en lugar de
      aplanar la configuración
    - **Confinamiento**: las rutas `$include` deben resolverse bajo el directorio que contiene
      `openclaw.json`. Para compartir un árbol entre máquinas o usuarios, establece
      `OPENCLAW_INCLUDE_ROOTS` en una lista de rutas (`:` en POSIX, `;` en Windows) de
      directorios adicionales que los includes pueden referenciar. Los symlinks se resuelven
      y se vuelven a comprobar, por lo que una ruta que léxicamente vive en un directorio de configuración pero cuyo
      destino real escapa de toda raíz permitida sigue siendo rechazada.
    - **Manejo de errores**: errores claros para archivos faltantes, errores de análisis e includes circulares

  </Accordion>
</AccordionGroup>

## Recarga en caliente de la configuración

El Gateway observa `~/.openclaw/openclaw.json` y aplica los cambios automáticamente; no se necesita reinicio manual para la mayoría de las opciones.

Las ediciones directas de archivos se tratan como no confiables hasta que se validan. El observador espera
a que se estabilice la actividad de escrituras temporales/renombres del editor, lee el archivo final y rechaza
ediciones externas no válidas sin reescribir `openclaw.json`. Las escrituras de configuración propiedad de OpenClaw
usan la misma puerta de esquema antes de escribir; las sobrescrituras destructivas, como
eliminar `gateway.mode` o reducir el archivo en más de la mitad, se rechazan y
se guardan como `.rejected.*` para inspección.

Si ves `config reload skipped (invalid config)` o el arranque informa `Invalid
config`, inspecciona la configuración, ejecuta `openclaw config validate` y luego ejecuta `openclaw
doctor --fix` para reparar. Consulta [solución de problemas de Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config)
para ver la lista de comprobación.

### Modos de recarga

| Modo                   | Comportamiento                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica en caliente los cambios seguros al instante. Reinicia automáticamente para los críticos. |
| **`hot`**              | Aplica en caliente solo los cambios seguros. Registra una advertencia cuando se necesita reiniciar; tú lo gestionas. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, sea seguro o no.            |
| **`off`**              | Deshabilita la observación de archivos. Los cambios surten efecto en el siguiente reinicio manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica en caliente y qué necesita un reinicio

La mayoría de los campos se aplican en caliente sin tiempo de inactividad. En modo `hybrid`, los cambios que requieren reinicio se gestionan automáticamente.

| Categoría           | Campos                                                            | ¿Requiere reinicio? |
| ------------------- | ----------------------------------------------------------------- | ------------------- |
| Canales             | `channels.*`, `web` (WhatsApp) - todos los canales integrados y de Plugin | No              |
| Agente y modelos    | `agent`, `agents`, `models`, `routing`                            | No                  |
| Automatización      | `hooks`, `cron`, `agent.heartbeat`                                | No                  |
| Sesiones y mensajes | `session`, `messages`                                             | No                  |
| Herramientas y medios | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`            | No                  |
| UI y miscelánea     | `ui`, `logging`, `identity`, `bindings`                           | No                  |
| Servidor Gateway    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Sí**              |
| Infraestructura     | `discovery`, `plugins`                                            | **Sí**              |

<Note>
`gateway.reload` y `gateway.remote` son excepciones: cambiarlos **no** activa un reinicio.
</Note>

### Planificación de recarga

Cuando editas un archivo fuente al que se hace referencia mediante `$include`, OpenClaw planifica
la recarga desde el diseño creado por el autor de la fuente, no desde la vista en memoria aplanada.
Eso mantiene predecibles las decisiones de recarga en caliente (aplicación en caliente frente a reinicio), incluso cuando una
única sección de nivel superior vive en su propio archivo incluido, como
`plugins: { $include: "./plugins.json5" }`. La planificación de recarga falla de forma cerrada si el
diseño fuente es ambiguo.

## RPC de configuración (actualizaciones programáticas)

Para herramientas que escriben configuración mediante la API de Gateway, prefiere este flujo:

- `config.schema.lookup` para inspeccionar un subárbol (nodo de esquema superficial + resúmenes de hijos)
- `config.get` para obtener la instantánea actual junto con `hash`
- `config.patch` para actualizaciones parciales (parche de fusión JSON: los objetos se fusionan, `null`
  elimina, los arrays se reemplazan)
- `config.apply` solo cuando pretendas reemplazar toda la configuración
- `update.run` para autoactualización explícita más reinicio; incluye `continuationMessage` cuando la sesión posterior al reinicio deba ejecutar un turno de seguimiento
- `update.status` para inspeccionar el último centinela de reinicio de actualización y verificar la versión en ejecución después de un reinicio

Los agentes deben tratar `config.schema.lookup` como el primer punto de consulta para documentación y restricciones exactas
a nivel de campo. Usa [Referencia de configuración](/es/gateway/configuration-reference)
cuando necesiten el mapa de configuración más amplio, valores predeterminados o enlaces a referencias dedicadas
de subsistemas.

<Note>
Las escrituras del plano de control (`config.apply`, `config.patch`, `update.run`) están
limitadas a 3 solicitudes por 60 segundos por `deviceId+clientIp`. Las solicitudes de reinicio
se agrupan y luego aplican un tiempo de espera de 30 segundos entre ciclos de reinicio.
`update.status` es de solo lectura, pero tiene alcance de administrador porque el centinela de reinicio puede
incluir resúmenes de pasos de actualización y colas de salida de comandos.
</Note>

Ejemplo de parche parcial:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Tanto `config.apply` como `config.patch` aceptan `raw`, `baseHash`, `sessionKey`,
`note` y `restartDelayMs`. `baseHash` es obligatorio para ambos métodos cuando ya
existe una configuración.

## Variables de entorno

OpenClaw lee variables de entorno del proceso padre y además de:

- `.env` del directorio de trabajo actual (si existe)
- `~/.openclaw/.env` (respaldo global)

Ninguno de los dos archivos sobrescribe variables de entorno existentes. También puedes definir variables de entorno en línea en la configuración:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importación de entorno de shell (opcional)">
  Si está habilitado y las claves esperadas no están definidas, OpenClaw ejecuta tu shell de inicio de sesión e importa solo las claves faltantes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Variable de entorno equivalente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Sustitución de variables de entorno en valores de configuración">
  Haz referencia a variables de entorno en cualquier valor de cadena de configuración con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo coinciden nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`
- Las variables faltantes o vacías generan un error en tiempo de carga
- Escapa con `$${VAR}` para salida literal
- Funciona dentro de archivos `$include`
- Sustitución en línea: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencias secretas (env, file, exec)">
  Para campos que admiten objetos SecretRef, puedes usar:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Los detalles de SecretRef (incluido `secrets.providers` para `env`/`file`/`exec`) están en [Gestión de secretos](/es/gateway/secrets).
Las rutas de credenciales admitidas se enumeran en [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Accordion>

Consulta [Entorno](/es/help/environment) para ver la precedencia y las fuentes completas.

## Referencia completa

Para la referencia completa campo por campo, consulta **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Runbook de Gateway](/es/gateway)
