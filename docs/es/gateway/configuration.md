---
read_when:
    - Configurar OpenClaw por primera vez
    - Buscando patrones de configuración comunes
    - Navegar a secciones específicas de configuración
summary: 'Resumen general de la configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-04-30T05:40:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lee una configuración opcional <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`.
La ruta de configuración activa debe ser un archivo normal. Los diseños de `openclaw.json`
con enlaces simbólicos no son compatibles con las escrituras propiedad de OpenClaw; una escritura atómica puede reemplazar
la ruta en lugar de preservar el enlace simbólico. Si mantienes la configuración fuera del
directorio de estado predeterminado, apunta `OPENCLAW_CONFIG_PATH` directamente al archivo real.

Si falta el archivo, OpenClaw usa valores predeterminados seguros. Motivos comunes para añadir una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Configurar modelos, herramientas, sandboxing o automatización (cron, hooks)
- Ajustar sesiones, medios, redes o UI

Consulta la [referencia completa](/es/gateway/configuration-reference) para ver todos los campos disponibles.

Los agentes y la automatización deben usar `config.schema.lookup` para obtener documentación exacta a nivel de campo
antes de editar la configuración. Usa esta página para orientación orientada a tareas y
[Referencia de configuración](/es/gateway/configuration-reference) para el mapa de campos y valores predeterminados
más amplio.

<Tip>
**¿Nuevo en la configuración?** Empieza con `openclaw onboard` para la configuración interactiva, o consulta la guía de [Ejemplos de configuración](/es/gateway/configuration-examples) para configuraciones completas listas para copiar y pegar.
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
    Abre [http://127.0.0.1:18789](http://127.0.0.1:18789) y usa la pestaña **Config**.
    La UI de control renderiza un formulario a partir del esquema de configuración en vivo, incluida la metadata de documentación
    `title` / `description` de los campos, además de esquemas de Plugin y canal cuando
    están disponibles, con un editor de **JSON sin procesar** como vía de escape. Para UIs de desglose
    y otras herramientas, el Gateway también expone `config.schema.lookup` para
    obtener un nodo de esquema acotado a una ruta, más resúmenes inmediatos de sus hijos.
  </Tab>
  <Tab title="Edición directa">
    Edita `~/.openclaw/openclaw.json` directamente. El Gateway observa el archivo y aplica los cambios automáticamente (consulta [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan completamente con el esquema. Las claves desconocidas, los tipos mal formados o los valores no válidos hacen que el Gateway **se niegue a iniciar**. La única excepción en el nivel raíz es `$schema` (cadena), para que los editores puedan adjuntar metadata de JSON Schema.
</Warning>

`openclaw config schema` imprime el JSON Schema canónico usado por la UI de control
y la validación. `config.schema.lookup` obtiene un único nodo acotado a una ruta, más
resúmenes de hijos para herramientas de desglose. La metadata de documentación de campos `title`/`description`
se transmite a través de objetos anidados, comodines (`*`), elementos de array (`[]`) y ramas `anyOf`/
`oneOf`/`allOf`. Los esquemas de Plugin y canal en tiempo de ejecución se fusionan cuando se
carga el registro de manifiestos.

Cuando falla la validación:

- El Gateway no arranca
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecuta `openclaw doctor` para ver los problemas exactos
- Ejecuta `openclaw doctor --fix` (o `--yes`) para aplicar reparaciones

El Gateway conserva una copia confiable del último estado correcto conocido después de cada arranque exitoso.
Si `openclaw.json` falla la validación más adelante (o elimina `gateway.mode`, se reduce
bruscamente, o tiene una línea de registro espuria antepuesta), OpenClaw preserva el archivo roto
como `.clobbered.*`, restaura la última copia correcta conocida y registra el motivo de la recuperación.
El siguiente turno del agente también recibe una advertencia de evento del sistema para que el agente
principal no reescriba a ciegas la configuración restaurada. La promoción a último estado correcto conocido
se omite cuando un candidato contiene marcadores de posición de secretos redactados como `***`.
Cuando todos los problemas de validación están acotados a `plugins.entries.<id>...`, OpenClaw
no realiza recuperación de archivo completo. Mantiene activa la configuración actual y
expone el fallo local del Plugin para que un esquema de Plugin o una incompatibilidad de versión del host
no pueda revertir ajustes de usuario no relacionados.

## Tareas comunes

<AccordionGroup>
  <Accordion title="Configurar un canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tiene su propia sección de configuración en `channels.<provider>`. Consulta la página dedicada del canal para ver los pasos de configuración:

    - [WhatsApp](/es/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/es/channels/telegram) — `channels.telegram`
    - [Discord](/es/channels/discord) — `channels.discord`
    - [Feishu](/es/channels/feishu) — `channels.feishu`
    - [Google Chat](/es/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/es/channels/msteams) — `channels.msteams`
    - [Slack](/es/channels/slack) — `channels.slack`
    - [Signal](/es/channels/signal) — `channels.signal`
    - [iMessage](/es/channels/imessage) — `channels.imessage`
    - [Mattermost](/es/channels/mattermost) — `channels.mattermost`

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
    Configura el modelo principal y respaldos opcionales:

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

    - `agents.defaults.models` define el catálogo de modelos y actúa como allowlist para `/model`.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas a la allowlist sin eliminar modelos existentes. Los reemplazos simples que eliminarían entradas se rechazan a menos que pases `--replace`.
    - Las referencias de modelo usan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de imágenes de transcripción/herramientas (valor predeterminado `1200`); los valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulta [CLI de modelos](/es/concepts/models) para cambiar modelos en el chat y [Conmutación por error de modelos](/es/concepts/model-failover) para la rotación de autenticación y el comportamiento de respaldo.
    - Para proveedores personalizados/autohospedados, consulta [Proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso por DM se controla por canal mediante `dmPolicy`:

    - `"pairing"` (predeterminado): los remitentes desconocidos reciben un código de emparejamiento de un solo uso para aprobarse
    - `"allowlist"`: solo remitentes en `allowFrom` (o en el almacén de permitidos emparejados)
    - `"open"`: permite todos los DMs entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los DMs

    Para grupos, usa `groupPolicy` + `groupAllowFrom` o allowlists específicas del canal.

    Consulta la [referencia completa](/es/gateway/config-channels#dm-and-group-access) para detalles por canal.

  </Accordion>

  <Accordion title="Configurar el control de menciones en chats grupales">
    Los mensajes de grupo requieren **mención** de forma predeterminada. Configura patrones de activación por agente y mantén las respuestas visibles de sala en la ruta predeterminada de herramienta de mensajes, salvo que quieras intencionadamente respuestas finales automáticas heredadas:

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

    - **Menciones de metadata**: @-menciones nativas (mencionar tocando en WhatsApp, @bot de Telegram, etc.)
    - **Patrones de texto**: patrones regex seguros en `mentionPatterns`
    - **Respuestas visibles**: `messages.visibleReplies` puede exigir envíos con la herramienta de mensajes globalmente; `messages.groupChat.visibleReplies` lo anula para grupos/canales.
    - Consulta la [referencia completa](/es/gateway/config-channels#group-chat-mention-gating) para modos de respuesta visible, anulaciones por canal y modo de chat consigo mismo.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Usa `agents.defaults.skills` como base compartida, luego anula agentes específicos
    con `agents.list[].skills`:

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

    - Omite `agents.defaults.skills` para permitir Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar los valores predeterminados.
    - Configura `agents.list[].skills: []` para no usar Skills.
    - Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y
      la [Referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar la supervisión de estado de canales del gateway">
    Controla con qué agresividad el gateway reinicia canales que parecen obsoletos:

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

    - Configura `gateway.channelHealthCheckMinutes: 0` para desactivar globalmente los reinicios del monitor de estado.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de comprobación.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desactivar los reinicios automáticos de un canal o cuenta sin desactivar el monitor global.
    - Consulta [Comprobaciones de estado](/es/gateway/health) para depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para todos los campos.

  </Accordion>

  <Accordion title="Ajustar el tiempo de espera del handshake WebSocket del gateway">
    Da a los clientes locales más tiempo para completar el handshake WebSocket previo a la autenticación en
    hosts cargados o de baja potencia:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - El valor predeterminado es `15000` milisegundos.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` todavía tiene prioridad para anulaciones puntuales de servicio o shell.
    - Prefiere corregir primero los bloqueos de inicio/bucle de eventos; este ajuste es para hosts que están sanos pero son lentos durante el calentamiento.

  </Accordion>

  <Accordion title="Configurar sesiones y restablecimientos">
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
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones vinculadas a hilos (Discord admite `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age`).
    - Consulta [Gestión de sesiones](/es/concepts/session) para el ámbito, los enlaces de identidad y la política de envío.
    - Consulta la [referencia completa](/es/gateway/config-agents#session) para todos los campos.

  </Accordion>

  <Accordion title="Habilitar sandboxing">
    Ejecuta sesiones de agentes en runtimes de sandbox aislados:

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

    Compila la imagen primero: `scripts/sandbox-setup.sh`

    Consulta [Sandboxing](/es/gateway/sandboxing) para la guía completa y la [referencia completa](/es/gateway/config-agents#agentsdefaultssandbox) para todas las opciones.

  </Accordion>

  <Accordion title="Habilitar push respaldado por relay para compilaciones oficiales de iOS">
    El push respaldado por relay se configura en `openclaw.json`.

    Establece esto en la configuración del gateway:

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

    Equivalente de CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Qué hace esto:

    - Permite que el gateway envíe `push.test`, avisos de activación y activaciones de reconexión a través del relay externo.
    - Usa una concesión de envío con ámbito de registro reenviada por la app de iOS emparejada. El gateway no necesita un token de relay para toda la implementación.
    - Vincula cada registro respaldado por relay a la identidad del gateway con la que se emparejó la app de iOS, de modo que otro gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales/manuales de iOS en APNs directo. Los envíos respaldados por relay se aplican solo a las compilaciones distribuidas oficiales que se registraron mediante el relay.
    - Debe coincidir con la URL base del relay integrada en la compilación oficial/TestFlight de iOS, para que el tráfico de registro y envío llegue a la misma implementación de relay.

    Flujo de extremo a extremo:

    1. Instala una compilación oficial/TestFlight de iOS que se haya compilado con la misma URL base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` en el gateway.
    3. Empareja la app de iOS con el gateway y permite que se conecten tanto las sesiones de nodo como las de operador.
    4. La app de iOS obtiene la identidad del gateway, se registra con el relay usando App Attest más el recibo de la app y luego publica la carga útil `push.apns.register` respaldada por relay en el gateway emparejado.
    5. El gateway almacena el identificador del relay y la concesión de envío, y luego los usa para `push.test`, avisos de activación y activaciones de reconexión.

    Notas operativas:

    - Si cambias la app de iOS a un gateway diferente, vuelve a conectar la app para que pueda publicar un nuevo registro de relay vinculado a ese gateway.
    - Si publicas una nueva compilación de iOS que apunta a una implementación de relay diferente, la app actualiza su registro de relay en caché en lugar de reutilizar el origen de relay anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como sobrescrituras temporales de entorno.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape de desarrollo solo para loopback; no persistas URLs de relay HTTP en la configuración.

    Consulta [App de iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para el flujo de extremo a extremo y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para el modelo de seguridad del relay.

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
    - Consulta [Heartbeat](/es/gateway/heartbeat) para la guía completa.

  </Accordion>

  <Accordion title="Configurar trabajos de Cron">
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

    - `sessionRetention`: elimina sesiones de ejecución aisladas completadas de `sessions.json` (predeterminado `24h`; establece `false` para deshabilitarlo).
    - `runLog`: elimina `cron/runs/<jobId>.jsonl` por tamaño y líneas conservadas.
    - Consulta [Trabajos de Cron](/es/automation/cron-jobs) para la descripción general de la función y ejemplos de CLI.

  </Accordion>

  <Accordion title="Configurar webhooks (hooks)">
    Habilita endpoints de Webhook HTTP en el Gateway:

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
    - Trata todo el contenido de cargas útiles de hook/webhook como entrada no confiable.
    - Usa un `hooks.token` dedicado; no reutilices el token compartido del Gateway.
    - La autenticación de hooks es solo por encabezado (`Authorization: Bearer ...` o `x-openclaw-token`); los tokens en la cadena de consulta se rechazan.
    - `hooks.path` no puede ser `/`; mantén la entrada de Webhook en una subruta dedicada como `/hooks`.
    - Mantén deshabilitadas las marcas de omisión de contenido inseguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) salvo que estés haciendo depuración de alcance muy limitado.
    - Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para limitar las claves de sesión seleccionadas por el llamador.
    - Para agentes impulsados por hooks, prefiere niveles de modelos modernos fuertes y una política de herramientas estricta (por ejemplo, solo mensajería más sandboxing cuando sea posible).

    Consulta la [referencia completa](/es/gateway/configuration-reference#hooks) para todas las opciones de mapeo y la integración con Gmail.

  </Accordion>

  <Accordion title="Configurar enrutamiento multiagente">
    Ejecuta múltiples agentes aislados con espacios de trabajo y sesiones independientes:

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

    Consulta [Multiagente](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/config-agents#multi-agent-routing) para las reglas de vinculación y los perfiles de acceso por agente.

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
    - **Array de archivos**: se fusionan en profundidad en orden (el último gana)
    - **Claves hermanas**: se fusionan después de los includes (sobrescriben valores incluidos)
    - **Includes anidados**: admitidos hasta 10 niveles de profundidad
    - **Rutas relativas**: se resuelven en relación con el archivo que incluye
    - **Escrituras propiedad de OpenClaw**: cuando una escritura cambia solo una sección de nivel superior
      respaldada por un include de archivo único como `plugins: { $include: "./plugins.json5" }`,
      OpenClaw actualiza ese archivo incluido y deja `openclaw.json` intacto
    - **Escritura directa no compatible**: los includes raíz, arrays de includes e includes
      con sobrescrituras hermanas fallan de forma cerrada para escrituras propiedad de OpenClaw en lugar de
      aplanar la configuración
    - **Manejo de errores**: errores claros para archivos faltantes, errores de análisis e includes circulares

  </Accordion>
</AccordionGroup>

## Recarga en caliente de configuración

El Gateway observa `~/.openclaw/openclaw.json` y aplica los cambios automáticamente; no se necesita reinicio manual para la mayoría de las opciones.

Las ediciones directas de archivos se tratan como no confiables hasta que se validan. El observador espera
a que se estabilice la actividad de escritura temporal/cambio de nombre del editor, lee el archivo final y rechaza
ediciones externas no válidas restaurando la última configuración válida conocida. Las escrituras de configuración propiedad de OpenClaw
usan la misma puerta de esquema antes de escribir; sobrescrituras destructivas como
eliminar `gateway.mode` o reducir el archivo en más de la mitad se rechazan
y se guardan como `.rejected.*` para inspección.

Los fallos de validación locales del Plugin son la excepción: si todos los problemas están bajo
`plugins.entries.<id>...`, la recarga conserva la configuración actual e informa el problema del Plugin
en lugar de restaurar `.last-good`.

Si ves `Config auto-restored from last-known-good` o
`config reload restored last-known-good config` en los registros, inspecciona el archivo
`.clobbered.*` correspondiente junto a `openclaw.json`, corrige la carga útil rechazada y luego ejecuta
`openclaw config validate`. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config)
para la lista de recuperación.

### Modos de recarga

| Modo                   | Comportamiento                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica en caliente los cambios seguros al instante. Reinicia automáticamente para los críticos.           |
| **`hot`**              | Aplica en caliente solo los cambios seguros. Registra una advertencia cuando se necesita un reinicio; tú lo gestionas. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, sea seguro o no.                                 |
| **`off`**              | Deshabilita la observación de archivos. Los cambios surten efecto en el siguiente reinicio manual.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica en caliente frente a qué necesita reinicio

La mayoría de los campos se aplican en caliente sin tiempo de inactividad. En modo `hybrid`, los cambios que requieren reinicio se gestionan automáticamente.

| Categoría            | Campos                                                            | ¿Reinicio necesario? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Canales            | `channels.*`, `web` (WhatsApp) — todos los canales integrados y de Plugin | No              |
| Agente y modelos      | `agent`, `agents`, `models`, `routing`                            | No              |
| Automatización          | `hooks`, `cron`, `agent.heartbeat`                                | No              |
| Sesiones y mensajes | `session`, `messages`                                             | No              |
| Herramientas y medios       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | No              |
| UI y varios           | `ui`, `logging`, `identity`, `bindings`                           | No              |
| Servidor Gateway      | `gateway.*` (puerto, enlace, autenticación, tailscale, TLS, HTTP)              | **Sí**         |
| Infraestructura      | `discovery`, `canvasHost`, `plugins`                              | **Sí**         |

<Note>
`gateway.reload` y `gateway.remote` son excepciones: cambiarlos **no** desencadena un reinicio.
</Note>

### Planificación de recarga

Cuando editas un archivo fuente referenciado mediante `$include`, OpenClaw planifica
la recarga a partir de la estructura definida en la fuente, no desde la vista
aplanada en memoria. Eso mantiene predecibles las decisiones de recarga en
caliente (aplicación en caliente frente a reinicio), incluso cuando una sola
sección de nivel superior reside en su propio archivo incluido, como
`plugins: { $include: "./plugins.json5" }`. La planificación de recarga falla en
modo cerrado si la estructura fuente es ambigua.

## RPC de configuración (actualizaciones programáticas)

Para herramientas que escriben configuración mediante la API del Gateway, prefiere este flujo:

- `config.schema.lookup` para inspeccionar un subárbol (nodo de esquema superficial + resúmenes
  de hijos)
- `config.get` para obtener la instantánea actual más `hash`
- `config.patch` para actualizaciones parciales (parche de combinación JSON: los objetos se fusionan, `null`
  elimina, los arreglos reemplazan)
- `config.apply` solo cuando pretendas reemplazar toda la configuración
- `update.run` para una autoactualización explícita más reinicio
- `update.status` para inspeccionar el último centinela de reinicio de actualización y verificar la versión en ejecución tras un reinicio

Los agentes deben tratar `config.schema.lookup` como la primera parada para documentación
y restricciones exactas a nivel de campo. Usa [Referencia de configuración](/es/gateway/configuration-reference)
cuando necesiten el mapa de configuración más amplio, valores predeterminados o enlaces a referencias
dedicadas de subsistemas.

<Note>
Las escrituras del plano de control (`config.apply`, `config.patch`, `update.run`) están
limitadas a 3 solicitudes cada 60 segundos por `deviceId+clientIp`. Las solicitudes de reinicio
se combinan y luego aplican un periodo de espera de 30 segundos entre ciclos de reinicio.
`update.status` es de solo lectura, pero está limitado al ámbito de administración porque el centinela de reinicio puede
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

OpenClaw lee variables de entorno del proceso padre y además:

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
  Si está habilitada y las claves esperadas no están definidas, OpenClaw ejecuta tu shell de inicio de sesión e importa solo las claves faltantes:

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
  Referencia variables de entorno en cualquier valor de cadena de configuración con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo coinciden nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`
- Las variables faltantes/vacías generan un error al cargar
- Escapa con `$${VAR}` para obtener una salida literal
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
Las rutas de credenciales compatibles se enumeran en [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Accordion>

Consulta [Entorno](/es/help/environment) para ver la precedencia y las fuentes completas.

## Referencia completa

Para la referencia completa campo por campo, consulta **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Runbook del Gateway](/es/gateway)
