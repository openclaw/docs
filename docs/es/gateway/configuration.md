---
read_when:
    - Configuración de OpenClaw por primera vez
    - Buscando patrones de configuración comunes
    - Navegar a secciones de configuración específicas
summary: 'Descripción general de la configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-07-05T11:17:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eec71e09e4600c6d8016a376bdb190818dfffaaf7eebb9d181ef71b5e95eb2c8
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lee una configuración opcional <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`. Si falta el archivo, OpenClaw usa valores predeterminados seguros.

La ruta de configuración activa debe ser un archivo normal. Las escrituras propiedad de OpenClaw lo reemplazan atómicamente (renombran sobre la ruta), por lo que un `openclaw.json` con enlace simbólico hace que se reemplace su destino en lugar de escribirse a través del enlace - evita diseños de configuración con enlaces simbólicos. Si mantienes la configuración fuera del directorio de estado predeterminado, apunta `OPENCLAW_CONFIG_PATH` directamente al archivo real.

Motivos comunes para añadir una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Definir modelos, herramientas, aislamiento de entorno o automatización (cron, hooks)
- Ajustar sesiones, medios, red o UI

Consulta la [referencia completa](/es/gateway/configuration-reference) para ver todos los campos disponibles.

Los agentes y la automatización deben usar `config.schema.lookup` para obtener la documentación exacta a nivel de campo antes de editar la configuración. Usa esta página como guía orientada a tareas y la [Referencia de configuración](/es/gateway/configuration-reference) para el mapa de campos más amplio y los valores predeterminados.

<Tip>
**¿Nuevo en configuración?** Empieza con `openclaw onboard` para una configuración interactiva, o consulta la guía de [Ejemplos de configuración](/es/gateway/configuration-examples) para configuraciones completas que puedes copiar y pegar.
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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Abre [http://127.0.0.1:18789](http://127.0.0.1:18789) y usa la pestaña **Configuración**.
    La Control UI representa un formulario desde el esquema de configuración en vivo, incluidos los metadatos de documentación de campo `title` / `description`, además de los esquemas de plugins y canales cuando están disponibles, con un editor **JSON sin procesar** como vía de escape. Para UIs de exploración detallada y otras herramientas, el gateway también expone `config.schema.lookup` para obtener un nodo de esquema con alcance de ruta más resúmenes de hijos inmediatos.
  </Tab>
  <Tab title="Direct edit">
    Edita `~/.openclaw/openclaw.json` directamente. El Gateway observa el archivo y aplica los cambios automáticamente (consulta [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coinciden completamente con el esquema. Las claves desconocidas, los tipos malformados o los valores no válidos hacen que el Gateway **se niegue a iniciar**. La única excepción a nivel raíz es `$schema` (cadena), para que los editores puedan adjuntar metadatos de JSON Schema.
</Warning>

`openclaw config schema` imprime el JSON Schema canónico usado por Control UI y la validación. `config.schema.lookup` obtiene un único nodo con alcance de ruta más resúmenes de hijos para herramientas de exploración detallada. Los metadatos de documentación de campo `title`/`description` se propagan por objetos anidados, comodines (`*`), elementos de array (`[]`) y ramas `anyOf`/`oneOf`/`allOf`. Los esquemas de plugins y canales en tiempo de ejecución se fusionan cuando se carga el registro de manifiestos.

Cuando falla la validación:

- El Gateway no arranca
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecuta `openclaw doctor` para ver los problemas exactos
- Ejecuta `openclaw doctor --fix` (`--repair` es la misma marca; `--yes` omite las solicitudes de confirmación) para aplicar reparaciones

El Gateway conserva una copia confiable de la última configuración válida conocida después de cada inicio correcto, pero el inicio y la recarga en caliente no la restauran automáticamente - solo lo hace `openclaw doctor --fix`. Si `openclaw.json` falla la validación (incluida la validación local del plugin), el inicio del Gateway falla o la recarga se omite y el runtime actual conserva la última configuración aceptada. Una escritura rechazada también se guarda como `<path>.rejected.<timestamp>` para su inspección. El Gateway bloquea escrituras que parecen sobrescrituras accidentales - eliminar `gateway.mode`, perder el bloque `meta` o reducir el archivo en más de la mitad - a menos que la escritura permita explícitamente cambios destructivos. La promoción a última configuración válida conocida se omite cuando un candidato contiene un marcador de secreto redactado como `***` o `[redacted]`.

## Tareas comunes

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tiene su propia sección de configuración en `channels.<provider>`. Consulta la página dedicada del canal para ver los pasos de configuración:

    - [Discord](/es/channels/discord) - `channels.discord`
    - [Feishu](/es/channels/feishu) - `channels.feishu`
    - [Google Chat](/es/channels/googlechat) - `channels.googlechat`
    - [iMessage](/es/channels/imessage) - `channels.imessage`
    - [Mattermost](/es/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/es/channels/msteams) - `channels.msteams`
    - [Signal](/es/channels/signal) - `channels.signal`
    - [Slack](/es/channels/slack) - `channels.slack`
    - [Telegram](/es/channels/telegram) - `channels.telegram`
    - [WhatsApp](/es/channels/whatsapp) - `channels.whatsapp`

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

  <Accordion title="Choose and configure models">
    Define el modelo principal y los respaldos opcionales:

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

    - `agents.defaults.models` define el catálogo de modelos y actúa como la lista de permitidos para `/model`; las entradas `provider/*` filtran `/model`, `/models` y los selectores de modelos a proveedores seleccionados, mientras siguen usando el descubrimiento dinámico de modelos.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas a la lista de permitidos sin eliminar modelos existentes. Los reemplazos simples que eliminarían entradas se rechazan salvo que pases `--replace`.
    - Las referencias de modelos usan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla el escalado descendente de imágenes de transcripciones/herramientas (valor predeterminado `1200`); los valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulta [CLI de modelos](/es/concepts/models) para cambiar modelos en el chat y [Conmutación por error de modelos](/es/concepts/model-failover) para la rotación de autenticación y el comportamiento de respaldo.
    - Para proveedores personalizados/autohospedados, consulta [Proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Control who can message the bot">
    El acceso a DM se controla por canal mediante `dmPolicy` (valor predeterminado `"pairing"`):

    - `"pairing"`: los remitentes desconocidos reciben un código de emparejamiento de un solo uso para aprobarlos
    - `"allowlist"`: solo remitentes en `allowFrom` (o en el almacén de permitidos emparejados)
    - `"open"`: permite todos los DM entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los DM

    Para grupos, usa `groupPolicy` (`"allowlist" | "open" | "disabled"`) más `groupAllowFrom` o listas de permitidos específicas del canal.

    Consulta la [referencia completa](/es/gateway/config-channels#dm-and-group-access) para ver detalles por canal.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    Los mensajes de grupo requieren **mención** de forma predeterminada. Configura patrones de activación por agente. Las respuestas normales de grupo/canal se publican automáticamente; opta por la ruta de herramienta de mensajes para salas compartidas donde el agente debe decidir cuándo hablar:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **Menciones de metadatos**: @-menciones nativas (mención táctil de WhatsApp, @bot de Telegram, etc.)
    - **Patrones de texto**: patrones regex seguros en `mentionPatterns`
    - **Respuestas visibles**: `messages.visibleReplies` puede requerir envíos con herramienta de mensajes globalmente; `messages.groupChat.visibleReplies` lo anula para grupos/canales.
    - Consulta la [referencia completa](/es/gateway/config-channels#group-chat-mention-gating) para ver modos de respuesta visible, anulaciones por canal y modo de chat propio.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    Usa `agents.defaults.skills` como base compartida y luego sobrescribe agentes específicos con `agents.list[].skills`:

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
    - Define `agents.list[].skills: []` para no tener Skills.
    - Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y la [Referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
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

    - Los valores mostrados son los predeterminados. Define `gateway.channelHealthCheckMinutes: 0` para deshabilitar globalmente los reinicios del monitor de salud.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de comprobación.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para deshabilitar los reinicios automáticos de un canal o cuenta sin deshabilitar el monitor global.
    - Consulta [Comprobaciones de salud](/es/gateway/health) para depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para todos los campos.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Da a los clientes locales más tiempo para completar el handshake WebSocket previo a la autenticación en hosts cargados o de baja potencia:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - El valor predeterminado es `15000` milisegundos.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` sigue teniendo prioridad para sobrescrituras puntuales de servicio o shell.
    - Prefiere corregir primero las pausas de inicio/bucle de eventos; este ajuste es para hosts que están sanos pero son lentos durante el calentamiento.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    Las sesiones controlan la continuidad y el aislamiento de la conversación:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recomendado para varios usuarios
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
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones vinculado a hilos. `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age` vinculan, desvinculan, listan y ajustan esto por sesión (Discord vincula hilos, Telegram vincula temas/conversaciones).
    - Consulta [Gestión de sesiones](/es/concepts/session) para el ámbito, los enlaces de identidad y la política de envío.
    - Consulta la [referencia completa](/es/gateway/config-agents#session) para todos los campos.

  </Accordion>

  <Accordion title="Activar el aislamiento">
    Ejecuta sesiones de agente en runtimes aislados con sandbox:

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

    Crea primero la imagen: desde un checkout del código fuente ejecuta `scripts/sandbox-setup.sh`, o desde una instalación de npm consulta el comando `docker build` en línea en [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup).

    Consulta [Aislamiento](/es/gateway/sandboxing) para la guía completa y la [referencia completa](/es/gateway/config-agents#agentsdefaultssandbox) para todas las opciones.

  </Accordion>

  <Accordion title="Activar push respaldado por relay para builds oficiales de iOS">
    El push respaldado por relay para builds públicas de App Store usa el relay alojado de OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Los despliegues de relay personalizados requieren una ruta de build/despliegue de iOS deliberadamente separada cuya URL de relay coincida con la URL de relay del gateway. Si usas una build de relay personalizada, configura esto en la configuración del gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opcional. Valor predeterminado: 10000
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

    - Permite que el gateway envíe `push.test`, avisos de activación y activaciones de reconexión a través del relay externo.
    - Usa una concesión de envío con ámbito de registro reenviada por la app de iOS emparejada. El gateway no necesita un token de relay para todo el despliegue.
    - Vincula cada registro respaldado por relay a la identidad del gateway con la que se emparejó la app de iOS, de modo que otro gateway no pueda reutilizar el registro almacenado.
    - Mantiene las builds locales/manuales de iOS en APNs directo. Los envíos respaldados por relay se aplican solo a las builds distribuidas oficiales que se registraron a través del relay.
    - Debe coincidir con la URL base del relay incorporada en la build de iOS, para que el tráfico de registro y envío llegue al mismo despliegue de relay.

    Flujo de extremo a extremo:

    1. Instala la app oficial de iOS.
    2. Opcional: configura `gateway.push.apns.relay.baseUrl` en el gateway solo cuando uses una build de relay personalizada deliberadamente separada.
    3. Empareja la app de iOS con el gateway y deja que se conecten tanto las sesiones de nodo como las de operador.
    4. La app de iOS obtiene la identidad del gateway, se registra con el relay usando App Attest más el recibo de la app y luego publica la carga útil `push.apns.register` respaldada por relay en el gateway emparejado.
    5. El gateway almacena el handle del relay y la concesión de envío, y luego los usa para `push.test`, avisos de activación y activaciones de reconexión.

    Notas operativas:

    - Si cambias la app de iOS a otro gateway, vuelve a conectar la app para que pueda publicar un nuevo registro de relay vinculado a ese gateway.
    - Si distribuyes una nueva build de iOS que apunta a otro despliegue de relay, la app actualiza su registro de relay en caché en lugar de reutilizar el origen de relay anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como sobrescrituras temporales de entorno.
    - Las URL de relay de gateway personalizadas deben coincidir con la URL base del relay incorporada en la build de iOS; la línea de lanzamiento pública de App Store rechaza las sobrescrituras de URL de relay de iOS personalizadas.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape de desarrollo solo para local loopback; no persistas URL de relay HTTP en la configuración.

    Consulta [App de iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para el flujo de extremo a extremo y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para el modelo de seguridad del relay.

  </Accordion>

  <Accordion title="Configurar Heartbeat (registros periódicos)">
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

    - `every`: cadena de duración (`30m`, `2h`). Define `0m` para desactivar. Valor predeterminado: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predeterminado) o `block` para destinos de heartbeat estilo MD
    - Consulta [Heartbeat](/es/gateway/heartbeat) para la guía completa.

  </Accordion>

  <Accordion title="Configurar trabajos Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // predeterminado; despacho de cron + ejecución aislada de turnos de agente de cron
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: elimina sesiones de ejecución aisladas completadas de `sessions.json` (predeterminado `24h`; define `false` para desactivar).
    - `runLog`: recorta las filas conservadas del historial de ejecución de cron por trabajo. El historial se almacena en SQLite; `maxBytes` (predeterminado `2_000_000`) se conserva por compatibilidad con registros de ejecución más antiguos respaldados por archivos, `keepLines` tiene como valor predeterminado `2000`.
    - Consulta [Trabajos Cron](/es/automation/cron-jobs) para la descripción general de la funcionalidad y ejemplos de CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (hooks)">
    Activa endpoints de Webhook HTTP en el Gateway:

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
    - Trata todo el contenido de cargas útiles de hooks/Webhook como entrada no confiable.
    - Usa un `hooks.token` dedicado; no reutilices secretos de autenticación activos de Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - La autenticación de hooks es solo por encabezado (`Authorization: Bearer ...` o `x-openclaw-token`); los tokens en la cadena de consulta se rechazan.
    - `hooks.path` no puede ser `/`; mantén la entrada de Webhook en una subruta dedicada como `/hooks`.
    - Mantén desactivadas las flags de omisión de contenido no seguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) salvo para depuración con alcance estricto.
    - Si activas `hooks.allowRequestSessionKey`, configura también `hooks.allowedSessionKeyPrefixes` para acotar las claves de sesión seleccionadas por el llamador.
    - Para agentes impulsados por hooks, prefiere niveles de modelo modernos sólidos y una política estricta de herramientas (por ejemplo, solo mensajería más aislamiento cuando sea posible).

    Consulta la [referencia completa](/es/gateway/configuration-reference#hooks) para todas las opciones de asignación y la integración de Gmail.

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
    - **Array de archivos**: se fusiona profundamente en orden (el último gana), hasta 10 niveles anidados de profundidad
    - **Claves hermanas**: se fusionan después de los includes (sobrescriben los valores incluidos)
    - **Rutas relativas**: se resuelven en relación con el archivo que incluye
    - **Formato de ruta**: las rutas de include no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de la resolución
    - **Escrituras propiedad de OpenClaw**: cuando una escritura cambia solo una sección de nivel superior
      respaldada por un include de archivo único como `plugins: { $include: "./plugins.json5" }`,
      OpenClaw actualiza ese archivo incluido y deja `openclaw.json` intacto
    - **Escritura directa no admitida**: los includes raíz, los arrays de includes y los includes
      con sobrescrituras hermanas fallan de forma cerrada para escrituras propiedad de OpenClaw en lugar de
      aplanar la configuración
    - **Confinamiento**: las rutas de `$include` deben resolverse bajo el directorio que contiene
      `openclaw.json`. Para compartir un árbol entre máquinas o usuarios, define
      `OPENCLAW_INCLUDE_ROOTS` como una lista de rutas (`:` en POSIX, `;` en Windows) de
      directorios adicionales que los includes pueden referenciar. Los enlaces simbólicos se resuelven
      y se vuelven a comprobar, por lo que una ruta que léxicamente vive en un directorio de configuración pero cuyo
      destino real escapa de todas las raíces permitidas sigue siendo rechazada.
    - **Manejo de errores**: errores claros para archivos faltantes, errores de parseo, includes circulares, formato de ruta no válido y longitud excesiva

  </Accordion>
</AccordionGroup>

## Recarga en caliente de configuración

El Gateway observa `~/.openclaw/openclaw.json` y aplica los cambios automáticamente: no se necesita reinicio manual para la mayoría de los ajustes.

Las ediciones directas de archivos se tratan como no confiables hasta que se validan. El watcher espera
a que se estabilice la rotación de escrituras temporales/renombrados del editor, lee el archivo final y rechaza
las ediciones externas no válidas sin reescribir `openclaw.json`. Las escrituras de configuración propiedad de OpenClaw
usan la misma puerta de esquema antes de escribir (consulta [Validación estricta](#strict-validation)
para las reglas de sobrescritura/reversión que se aplican a cada escritura).

Si ves `config reload skipped (invalid config)` o el inicio informa `Invalid
config`, inspecciona la configuración, ejecuta `openclaw config validate` y luego ejecuta `openclaw
doctor --fix` para reparar. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config)
para la lista de comprobación.

### Modos de recarga

| Modo                   | Comportamiento                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica en caliente los cambios seguros al instante. Reinicia automáticamente para los críticos. |
| **`hot`**              | Aplica en caliente solo los cambios seguros. Registra una advertencia cuando se necesita reiniciar: tú te encargas. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, sea seguro o no.                   |
| **`off`**              | Desactiva la observación de archivos. Los cambios surten efecto en el siguiente reinicio manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica en caliente y qué necesita un reinicio

La mayoría de los campos se aplican en caliente sin tiempo de inactividad; algunas secciones aplicadas en caliente reinician solo ese
subsistema (canal, Cron, Heartbeat, monitor de estado) en lugar de todo el Gateway. En
modo `hybrid`, los cambios que requieren reinicio del Gateway se gestionan automáticamente.

| Categoría           | Campos                                                                  | ¿Se necesita reiniciar el Gateway? |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| Canales             | `channels.*`, `web` (WhatsApp) - todos los canales integrados y de plugin | No (reinicia ese canal)            |
| Agente y modelos    | `agent`, `agents`, `models`, `routing`                                  | No                                 |
| Automatización      | `hooks`, `cron`, `agent.heartbeat`                                      | No (reinicia ese subsistema)       |
| Sesiones y mensajes | `session`, `messages`                                                   | No                                 |
| Herramientas y medios | `tools`, `skills`, `mcp`, `audio`, `talk`                             | No                                 |
| Configuración de Plugin | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | No (recarga el runtime del plugin) |
| UI y varios         | `ui`, `logging`, `identity`, `bindings`                                 | No                                 |
| Servidor Gateway    | `gateway.*` (puerto, enlace, auth, tailscale, TLS, HTTP, push)          | **Sí**                             |
| Infraestructura     | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Sí**                             |

<Note>
`gateway.reload` y `gateway.remote` son excepciones bajo `gateway.*`: cambiarlos **no** activa un reinicio. Los plugins individuales también pueden sobrescribir esta tabla: un plugin cargado puede declarar sus propios prefijos de configuración que activan reinicios (por ejemplo, el plugin Canvas integrado reinicia el Gateway para `plugins.enabled`, `plugins.allow` y `plugins.deny`, no solo para su propio `plugins.entries.canvas`), por lo que el comportamiento real depende de qué plugins estén activos.
</Note>

### Planificación de recarga

Cuando editas un archivo fuente referenciado mediante `$include`, OpenClaw planifica
la recarga desde el diseño definido por la fuente, no desde la vista aplanada en memoria.
Esto mantiene predecibles las decisiones de recarga en caliente (aplicación en caliente frente a reinicio), incluso cuando una
sola sección de nivel superior vive en su propio archivo incluido, como
`plugins: { $include: "./plugins.json5" }`. La planificación de recarga falla de forma cerrada si el
diseño fuente es ambiguo.

## RPC de configuración (actualizaciones programáticas)

Para herramientas que escriben configuración mediante la API del Gateway, prefiere este flujo:

- `config.schema.lookup` para inspeccionar un subárbol (nodo de esquema superficial + resúmenes
  de hijos)
- `config.get` para obtener la instantánea actual más `hash`
- `config.patch` para actualizaciones parciales (parche de fusión JSON: los objetos se fusionan, `null`
  elimina, los arrays se reemplazan cuando se confirma explícitamente con `replacePaths` si
  se eliminarían entradas)
- `config.apply` solo cuando quieras reemplazar toda la configuración
- `update.run` para autoactualización explícita más reinicio; incluye `continuationMessage` cuando la sesión posterior al reinicio deba ejecutar un turno de seguimiento
- `update.status` para inspeccionar el último sentinel de reinicio de actualización y verificar la versión en ejecución después de un reinicio

Los agentes deben tratar `config.schema.lookup` como el primer punto de consulta para documentación y restricciones exactas
a nivel de campo. Usa [Referencia de configuración](/es/gateway/configuration-reference)
cuando necesiten el mapa de configuración más amplio, valores predeterminados o enlaces a referencias dedicadas
de subsistemas.

<Note>
Las escrituras del plano de control (`config.apply`, `config.patch`, `update.run`) están
limitadas a 3 solicitudes por cada 60 segundos por `deviceId+clientIp`. Las solicitudes de reinicio
se fusionan y luego aplican un período de enfriamiento de 30 segundos entre ciclos de reinicio.
`update.status` es de solo lectura, pero está limitado al ámbito de administración porque el sentinel de reinicio puede
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
`note` y `restartDelayMs`. `baseHash` es obligatorio para ambos métodos una vez que ya existe
un archivo de configuración (una primera escritura sin configuración existente omite la comprobación).

`config.patch` también acepta `replacePaths`, un array de rutas de configuración cuyo reemplazo de array
es intencional. Si un parche reemplazara o eliminara un array existente
con menos entradas, el Gateway rechaza la escritura a menos que esa ruta exacta aparezca
en `replacePaths`; los arrays anidados bajo entradas de array usan `[]`, como
`agents.list[].skills`. Esto evita que las instantáneas truncadas de `config.get`
sobrescriban silenciosamente arrays de enrutamiento o listas de permitidos. Usa `config.apply` cuando
quieras reemplazar la configuración completa.

## Variables de entorno

OpenClaw lee variables de entorno del proceso padre y además de:

- `.env` del directorio de trabajo actual (si existe)
- `~/.openclaw/.env` (respaldo global)

Ninguno de los archivos sobrescribe variables de entorno existentes. También puedes establecer variables de entorno inline en la configuración:

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

Variable de entorno equivalente: `OPENCLAW_LOAD_SHELL_ENV=1`. `timeoutMs` predeterminado: `15000`.
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
- Las variables faltantes/vacías generan un error en tiempo de carga
- Escapa con `$${VAR}` para salida literal
- Funciona dentro de archivos `$include`
- Sustitución inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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
