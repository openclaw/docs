---
read_when:
    - Configuración inicial de OpenClaw
    - Buscando patrones de configuración comunes
    - Navegar a secciones específicas de configuración
summary: 'Descripción general de la configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-07-12T14:27:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 18717d03bb923d90725b263e064f932ac30006d21f4b1b1bd98a4e39f1c92cff
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lee una configuración <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> opcional desde `~/.openclaw/openclaw.json`. Si el archivo no existe, OpenClaw usa valores predeterminados seguros.

La ruta de configuración activa debe ser un archivo normal. Las escrituras realizadas por OpenClaw lo reemplazan de forma atómica (mediante un cambio de nombre sobre la ruta), por lo que, si `openclaw.json` es un enlace simbólico, se reemplaza su destino en lugar de escribir a través del enlace; evite estructuras de configuración con enlaces simbólicos. Si mantiene la configuración fuera del directorio de estado predeterminado, haga que `OPENCLAW_CONFIG_PATH` apunte directamente al archivo real.

Motivos habituales para añadir una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Definir modelos, herramientas, aislamiento o automatización (cron, hooks)
- Ajustar sesiones, contenido multimedia, redes o interfaz de usuario

Consulte la [referencia completa](/es/gateway/configuration-reference) para conocer todos los campos disponibles.

Los agentes y la automatización deben usar `config.schema.lookup` para consultar la
documentación exacta de cada campo antes de editar la configuración. Use esta página
como guía orientada a tareas y la [referencia de configuración](/es/gateway/configuration-reference)
para consultar el mapa general de campos y los valores predeterminados.

<Tip>
**¿Es la primera vez que configura OpenClaw?** Empiece con `openclaw onboard` para realizar una configuración interactiva o consulte la guía de [ejemplos de configuración](/es/gateway/configuration-examples) para obtener configuraciones completas listas para copiar y pegar.
</Tip>

## Configuración mínima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Edición de la configuración

<Tabs>
  <Tab title="Asistente interactivo">
    ```bash
    openclaw onboard       # flujo de incorporación completo
    openclaw configure     # asistente de configuración
    ```
  </Tab>
  <Tab title="CLI (comandos de una línea)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Interfaz de control">
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) y use la pestaña **Config**.
    La interfaz de control representa un formulario a partir del esquema de configuración activo,
    incluidos los metadatos de documentación `title` / `description` de los campos y los esquemas
    de plugins y canales cuando están disponibles, con un editor **Raw JSON** como vía alternativa.
    Para interfaces de exploración en profundidad y otras herramientas, el Gateway también expone
    `config.schema.lookup` para obtener un nodo del esquema limitado a una ruta junto con resúmenes
    de sus elementos secundarios inmediatos.
  </Tab>
  <Tab title="Edición directa">
    Edite `~/.openclaw/openclaw.json` directamente. El Gateway supervisa el archivo y aplica los cambios automáticamente (consulte la [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan por completo con el esquema. Las claves desconocidas, los tipos mal formados o los valores no válidos hacen que el Gateway **se niegue a iniciarse**. La única excepción en el nivel raíz es `$schema` (cadena), para que los editores puedan adjuntar metadatos de JSON Schema.
</Warning>

`openclaw config schema` imprime el JSON Schema canónico que usan la interfaz de control
y la validación. `config.schema.lookup` obtiene un único nodo limitado a una ruta junto con
resúmenes de sus elementos secundarios para herramientas de exploración en profundidad.
Los metadatos de documentación `title`/`description` de los campos se propagan por objetos
anidados, comodines (`*`), elementos de matriz (`[]`) y ramas `anyOf`/`oneOf`/`allOf`.
Los esquemas de plugins y canales en tiempo de ejecución se combinan cuando se carga el
registro de manifiestos.

Cuando falla la validación:

- El Gateway no se inicia
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecute `openclaw doctor` para ver los problemas exactos
- Ejecute `openclaw doctor --fix` (`--repair` es la misma opción; `--yes` omite las solicitudes de confirmación) para aplicar las reparaciones

El Gateway conserva una copia fiable de la última configuración válida después de cada inicio
correcto, pero el inicio y la recarga en caliente no la restauran automáticamente; solo
`openclaw doctor --fix` lo hace. Si `openclaw.json` no supera la validación (incluida la
validación local de plugins), el Gateway no se inicia o se omite la recarga, y el entorno de
ejecución actual conserva la última configuración aceptada. Una escritura rechazada también
se guarda como `<path>.rejected.<timestamp>` para su inspección. El Gateway bloquea las
escrituras que parecen sobrescrituras accidentales —como eliminar `gateway.mode`, perder el
bloque `meta` o reducir el archivo a menos de la mitad de su tamaño—, a menos que la escritura
permita explícitamente cambios destructivos. No se promociona una configuración candidata a
última configuración válida conocida si contiene un marcador de secreto censurado, como
`***` o `[redacted]`.

## Tareas habituales

<AccordionGroup>
  <Accordion title="Configurar un canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tiene su propia sección de configuración en `channels.<provider>`. Consulte la página específica del canal para conocer los pasos de configuración:

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

    Todos los canales comparten el mismo patrón de política de mensajes directos:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // solo para allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Elegir y configurar modelos">
    Defina el modelo principal y los modelos alternativos opcionales:

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

    - `agents.defaults.models` define el catálogo de modelos y actúa como lista de permitidos para `/model`; las entradas `provider/*` filtran `/model`, `/models` y los selectores de modelos a los proveedores seleccionados, a la vez que se sigue usando el descubrimiento dinámico de modelos.
    - Use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas a la lista de permitidos sin eliminar los modelos existentes. Los reemplazos simples que eliminarían entradas se rechazan a menos que se especifique `--replace`.
    - Las referencias de modelos usan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de las imágenes de transcripciones y herramientas (valor predeterminado: `1200`); los valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulte la [CLI de modelos](/es/concepts/models) para cambiar de modelo en el chat y la [conmutación por error de modelos](/es/concepts/model-failover) para conocer la rotación de autenticación y el comportamiento de los modelos alternativos.
    - Para proveedores personalizados o autoalojados, consulte [Proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso a los mensajes directos se controla por canal mediante `dmPolicy` (valor predeterminado: `"pairing"`):

    - `"pairing"`: los remitentes desconocidos reciben un código de emparejamiento de un solo uso que debe aprobarse
    - `"allowlist"`: solo se permiten los remitentes incluidos en `allowFrom` (o en el almacén de remitentes emparejados permitidos)
    - `"open"`: se permiten todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: se ignoran todos los mensajes directos

    Para los grupos, use `groupPolicy` (`"allowlist" | "open" | "disabled"`) junto con `groupAllowFrom` o listas de permitidos específicas del canal.

    Consulte la [referencia completa](/es/gateway/config-channels#dm-and-group-access) para conocer los detalles de cada canal.

  </Accordion>

  <Accordion title="Configurar el requisito de mención en chats grupales">
    De forma predeterminada, los mensajes grupales **requieren una mención**. Configure patrones de activación para cada agente. Las respuestas normales de grupos y canales se publican automáticamente; habilite la ruta de la herramienta de mensajes para las salas compartidas en las que el agente deba decidir cuándo intervenir:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // establezca "message_tool" para exigir envíos mediante la herramienta de mensajes en todas partes
        groupChat: {
          visibleReplies: "message_tool", // opcional; la salida visible requiere message(action=send)
          unmentionedInbound: "room_event", // la conversación grupal permanente sin menciones se usa como contexto silencioso
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

    - **Menciones de metadatos**: menciones @ nativas (tocar para mencionar en WhatsApp, @bot en Telegram, etc.)
    - **Patrones de texto**: patrones de expresiones regulares seguros en `mentionPatterns`
    - **Respuestas visibles**: `messages.visibleReplies` puede exigir envíos mediante la herramienta de mensajes globalmente; `messages.groupChat.visibleReplies` lo reemplaza para grupos y canales.
    - Consulte la [referencia completa](/es/gateway/config-channels#group-chat-mention-gating) para conocer los modos de respuesta visible, las sustituciones por canal y el modo de chat con uno mismo.

  </Accordion>

  <Accordion title="Restringir las Skills por agente">
    Use `agents.defaults.skills` como base compartida y, después, sustituya la configuración de
    agentes específicos mediante `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hereda github, weather
          { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
          { id: "locked-down", skills: [] }, // sin Skills
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para permitir todas las Skills de forma predeterminada.
    - Omita `agents.list[].skills` para heredar los valores predeterminados.
    - Establezca `agents.list[].skills: []` para no permitir ninguna Skill.
    - Consulte [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y
      la [referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar la supervisión del estado de los canales del Gateway">
    Controle con qué agresividad el Gateway reinicia los canales que parecen inactivos:

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

    - Los valores mostrados son los predeterminados. Establezca `gateway.channelHealthCheckMinutes: 0` para deshabilitar globalmente los reinicios del monitor de estado.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de comprobación.
    - Use `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para deshabilitar los reinicios automáticos de un canal o una cuenta sin deshabilitar el monitor global.
    - Consulte [Comprobaciones de estado](/es/gateway/health) para la depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para conocer todos los campos.

  </Accordion>

  <Accordion title="Ajustar el tiempo de espera del protocolo de enlace WebSocket del Gateway">
    Conceda más tiempo a los clientes locales para completar el protocolo de enlace WebSocket
    previo a la autenticación en hosts con mucha carga o pocos recursos:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - El valor predeterminado es `15000` milisegundos.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` sigue teniendo prioridad para sustituciones puntuales en servicios o shells.
    - Es preferible corregir primero los bloqueos del inicio o del bucle de eventos; este ajuste está destinado a hosts que funcionan correctamente, pero son lentos durante el calentamiento.

  </Accordion>

  <Accordion title="Configurar sesiones y restablecimientos">
    Las sesiones controlan la continuidad y el aislamiento de las conversaciones:

    ```json5
    {
      session: {
    ```
    ```json5
        dmScope: "per-channel-peer",  // recomendado para varios usuarios
    ```
    ```json5
        threadBindings: {
    ```
    ```json5
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
    ```
    ```json5
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```
    - `dmScope`: `main` (compartido) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones vinculadas a hilos. `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age` vinculan, desvinculan, enumeran y ajustan esta configuración por sesión (Discord vincula hilos; Telegram vincula temas/conversaciones).
    - Consulte [Gestión de sesiones](/es/concepts/session) para obtener información sobre el ámbito, los vínculos de identidad y la política de envío.
    - Consulte la [referencia completa](/es/gateway/config-agents#session) para conocer todos los campos.

  </Accordion>

  <Accordion title="Habilitar el aislamiento">
    Ejecuta las sesiones del agente en entornos de ejecución aislados:

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

    Primero, crea la imagen: desde un repositorio de código fuente, ejecuta `scripts/sandbox-setup.sh`; si se trata de una instalación mediante npm, consulta el comando `docker build` incluido en [Entorno aislado § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup).

    Consulta [Aislamiento](/es/gateway/sandboxing) para ver la guía completa y la [referencia completa](/es/gateway/config-agents#agentsdefaultssandbox) para conocer todas las opciones.

  </Accordion>

  <Accordion title="Habilitar las notificaciones push mediante retransmisión para las compilaciones oficiales de iOS">
    Las notificaciones push mediante retransmisión para las compilaciones públicas de la App Store utilizan el servicio de retransmisión alojado de OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Las implementaciones de retransmisión personalizadas requieren una ruta de compilación e implementación de iOS deliberadamente independiente cuya URL de retransmisión coincida con la URL de retransmisión del Gateway. Si utilizas una compilación con retransmisión personalizada, establece lo siguiente en la configuración del Gateway:

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

    Equivalente en la CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Qué hace esto:

    - Permite que el Gateway envíe `push.test`, avisos de activación y activaciones de reconexión mediante el relé externo.
    - Usa una autorización de envío limitada al registro y reenviada por la aplicación iOS emparejada. El Gateway no necesita un token de relé para toda la implementación.
    - Vincula cada registro respaldado por el relé con la identidad del Gateway con el que se emparejó la aplicación iOS, de modo que otro Gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales o manuales de iOS en APNs directo. Los envíos respaldados por el relé solo se aplican a las compilaciones oficiales distribuidas que se registraron mediante el relé.
    - Debe coincidir con la URL base del relé integrada en la compilación de iOS, para que el tráfico de registro y de envío llegue a la misma implementación del relé.

    Flujo de extremo a extremo:

    1. Instale la aplicación oficial de iOS.
    2. Opcional: configure `gateway.push.apns.relay.baseUrl` en el Gateway solo cuando utilice una compilación personalizada que emplee deliberadamente un relé independiente.
    3. Empareje la aplicación iOS con el Gateway y permita que se conecten tanto las sesiones del Node como las del operador.
    4. La aplicación iOS obtiene la identidad del Gateway, se registra en el relé mediante App Attest junto con el recibo de la aplicación y, a continuación, publica la carga útil `push.apns.register` respaldada por el relé en el Gateway emparejado.
    5. El Gateway almacena el identificador del relé y la autorización de envío y, a continuación, los usa para `push.test`, los avisos de activación y las activaciones de reconexión.

    Notas operativas:

    - Si cambia la aplicación iOS a otro Gateway, vuelva a conectar la aplicación para que pueda publicar un nuevo registro de relé vinculado a ese Gateway.
    - Si distribuye una nueva compilación de iOS que apunta a otra implementación del relé, la aplicación actualiza su registro de relé almacenado en caché en lugar de reutilizar el origen del relé anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como sobrescrituras temporales mediante variables de entorno.
    - Las URL de relé personalizadas del Gateway deben coincidir con la URL base del relé integrada en la compilación de iOS; el canal de publicación de la App Store rechaza las sobrescrituras personalizadas de la URL del relé de iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape de desarrollo exclusiva para la interfaz de bucle invertido; no conserve URL de relé HTTP en la configuración.

    Consulte [Aplicación iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para conocer el flujo de extremo a extremo y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para conocer el modelo de seguridad del relé.

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

    - `every`: cadena de duración (`30m`, `2h`). Establezca `0m` para desactivarlo. Valor predeterminado: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (por ejemplo, `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (valor predeterminado) o `block` para destinos de Heartbeat similares a mensajes directos
    - Consulte [Heartbeat](/es/gateway/heartbeat) para ver la guía completa.

  </Accordion>

  <Accordion title="Configurar trabajos de Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // valor predeterminado; despacho de Cron + ejecución aislada del turno del agente de Cron
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: elimina las sesiones de ejecuciones aisladas completadas de las filas de sesiones de SQLite (valor predeterminado: `24h`; usar `false` para deshabilitarlo).
    - `runLog`: elimina las filas conservadas del historial de ejecuciones de Cron por trabajo. El historial se almacena en SQLite; `maxBytes` (valor predeterminado: `2_000_000`) se conserva por compatibilidad con registros de ejecución anteriores basados en archivos y `keepLines` tiene como valor predeterminado `2000`.
    - Consultar [Trabajos de Cron](/es/automation/cron-jobs) para obtener una descripción general de la función y ejemplos de la CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (hooks)">
    Habilitar los endpoints de Webhook HTTP en el Gateway:

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
    - Tratar todo el contenido de las cargas útiles de hooks/Webhooks como entrada no confiable.
    - Usar un `hooks.token` específico; no reutilizar secretos de autenticación activos del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - La autenticación de hooks solo admite encabezados (`Authorization: Bearer ...` o `x-openclaw-token`); se rechazan los tokens en la cadena de consulta.
    - `hooks.path` no puede ser `/`; mantener la entrada de Webhooks en una subruta específica, como `/hooks`.
    - Mantener deshabilitadas las opciones para omitir la protección contra contenido no seguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), salvo para una depuración de alcance muy limitado.
    - Si se habilita `hooks.allowRequestSessionKey`, establecer también `hooks.allowedSessionKeyPrefixes` para limitar las claves de sesión seleccionadas por quien realiza la llamada.
    - Para los agentes controlados mediante hooks, se recomienda usar niveles de modelos modernos y potentes, así como una política de herramientas estricta (por ejemplo, solo mensajería y aislamiento cuando sea posible).

    Consultar la [referencia completa](/es/gateway/configuration-reference#hooks) para conocer todas las opciones de asignación y la integración con Gmail.

  </Accordion>

  <Accordion title="Configurar el enrutamiento multiagente">
    Ejecutar varios agentes aislados con espacios de trabajo y sesiones independientes:

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

    Consultar [Multiagente](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/config-agents#multi-agent-routing) para conocer las reglas de vinculación y los perfiles de acceso por agente.

  </Accordion>

  <Accordion title="Dividir la configuración en varios archivos ($include)">
    Usar `$include` para organizar configuraciones extensas:

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

    - **Archivo único**: sustituye el objeto que lo contiene
    - **Matriz de archivos**: se fusionan en profundidad en orden (prevalecen los posteriores), con hasta 10 niveles de anidamiento
    - **Claves del mismo nivel**: se fusionan después de las inclusiones (sobrescriben los valores incluidos)
    - **Rutas relativas**: se resuelven en relación con el archivo que realiza la inclusión
    - **Formato de ruta**: las rutas de inclusión no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de su resolución
    - **Escrituras propiedad de OpenClaw**: cuando una escritura modifica únicamente una sección de nivel superior
      respaldada por una inclusión de un solo archivo, como `plugins: { $include: "./plugins.json5" }`,
      OpenClaw actualiza ese archivo incluido y deja `openclaw.json` intacto
    - **Escritura directa no compatible**: las inclusiones raíz, las matrices de inclusiones y las inclusiones
      con sobrescrituras del mismo nivel producen un fallo seguro en las escrituras propiedad de OpenClaw, en lugar de
      aplanar la configuración
    - **Confinamiento**: las rutas de `$include` deben resolverse dentro del directorio que contiene
      `openclaw.json`. Para compartir un árbol entre máquinas o usuarios, establecer
      `OPENCLAW_INCLUDE_ROOTS` en una lista de rutas (`:` en POSIX, `;` en Windows) de
      directorios adicionales a los que pueden hacer referencia las inclusiones. Los enlaces simbólicos se resuelven
      y se vuelven a comprobar, por lo que una ruta que léxicamente se encuentra dentro de un directorio de configuración, pero cuyo
      destino real queda fuera de todas las raíces permitidas, se sigue rechazando.
    - **Gestión de errores**: errores claros para archivos ausentes, errores de análisis, inclusiones circulares, formatos de ruta no válidos y longitudes excesivas

  </Accordion>
</AccordionGroup>

## Recarga en caliente de la configuración

El Gateway supervisa `~/.openclaw/openclaw.json` y aplica los cambios automáticamente; no es necesario reiniciarlo manualmente para la mayoría de los ajustes.

Las ediciones directas del archivo se consideran no confiables hasta que se validan. El observador espera
a que finalicen las operaciones temporales de escritura y cambio de nombre del editor, lee el archivo definitivo y rechaza
las ediciones externas no válidas sin reescribir `openclaw.json`. Las escrituras de configuración
propiedad de OpenClaw usan la misma validación de esquema antes de escribir (consultar [Validación estricta](#strict-validation)
para conocer las reglas de sobrescritura y reversión que se aplican a cada escritura).

Si aparece `config reload skipped (invalid config)` o el inicio informa de `Invalid
config`, revisar la configuración, ejecutar `openclaw config validate` y, a continuación, ejecutar `openclaw
doctor --fix` para repararla. Consultar [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config)
para ver la lista de comprobación.

### Modos de recarga

| Modo                    | Comportamiento                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica al instante y en caliente los cambios seguros. Se reinicia automáticamente cuando los cambios son críticos. |
| **`hot`**               | Solo aplica en caliente los cambios seguros. Registra una advertencia cuando se necesita un reinicio; debe gestionarse manualmente. |
| **`restart`**           | Reinicia el Gateway ante cualquier cambio de configuración, sea seguro o no.                                          |
| **`off`**               | Deshabilita la supervisión de archivos. Los cambios surten efecto tras el siguiente reinicio manual.                  |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica en caliente y qué requiere un reinicio

La mayoría de los campos se aplican en caliente sin tiempo de inactividad; algunas secciones aplicadas en caliente reinician únicamente ese
subsistema (canal, cron, heartbeat, monitor de estado) en lugar de todo el Gateway. En
el modo `hybrid`, los cambios que requieren reiniciar el Gateway se gestionan automáticamente.

| Categoría           | Campos                                                                  | ¿Es necesario reiniciar el Gateway? |
| ------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| Canales             | `channels.*`, `web` (WhatsApp): todos los canales integrados y de plugins | No (reinicia ese canal)             |
| Agente y modelos    | `agent`, `agents`, `models`, `routing`                                  | No                                  |
| Automatización      | `hooks`, `cron`, `agent.heartbeat`                                      | No (reinicia ese subsistema)        |
| Sesiones y mensajes | `session`, `messages`                                                   | No                                  |
| Herramientas y medios | `tools`, `skills`, `mcp`, `audio`, `talk`                             | No                                  |
| Configuración de plugins | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | No (recarga el entorno de ejecución de plugins) |
| Interfaz y varios   | `ui`, `logging`, `identity`, `bindings`                                 | No                                  |
| Servidor del Gateway | `gateway.*` (puerto, enlace, autenticación, tailscale, TLS, HTTP, envío) | **Sí**                              |
| Infraestructura     | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Sí**                              |

<Note>
`gateway.reload` y `gateway.remote` son excepciones dentro de `gateway.*`: cambiarlos **no** provoca un reinicio. Los plugins individuales también pueden invalidar esta tabla: un plugin cargado puede declarar sus propios prefijos de configuración que provocan reinicios (por ejemplo, el plugin Canvas incluido reinicia el Gateway para `plugins.enabled`, `plugins.allow` y `plugins.deny`, no solo para su propio `plugins.entries.canvas`), por lo que el comportamiento real depende de qué plugins estén activos.
</Note>

### Planificación de la recarga

Cuando se edita un archivo de origen al que se hace referencia mediante `$include`, OpenClaw planifica
la recarga a partir de la estructura definida en el origen, no de la vista aplanada en memoria.
Esto mantiene previsibles las decisiones de recarga en caliente (aplicar en caliente o reiniciar), incluso cuando una
única sección de nivel superior se encuentra en su propio archivo incluido, como
`plugins: { $include: "./plugins.json5" }`. La planificación de la recarga falla de forma segura si la
estructura de origen es ambigua.

## RPC de configuración (actualizaciones mediante programación)

Para las herramientas que escriben la configuración a través de la API del Gateway, se recomienda este flujo:

- `config.schema.lookup` para inspeccionar un subárbol (nodo de esquema superficial y resúmenes
  de sus elementos secundarios)
- `config.get` para obtener la instantánea actual junto con `hash`
- `config.patch` para actualizaciones parciales (parche de combinación JSON: los objetos se combinan, `null`
  elimina y los arreglos se reemplazan cuando se confirman explícitamente con `replacePaths` si
  se eliminarían entradas)
- `config.apply` solo cuando se pretenda reemplazar toda la configuración
- `update.run` para realizar explícitamente una actualización automática seguida de un reinicio; incluya `continuationMessage` cuando la sesión posterior al reinicio deba ejecutar un turno de seguimiento
- `update.status` para inspeccionar el último indicador de reinicio de actualización y verificar la versión en ejecución después de un reinicio

Los agentes deben considerar `config.schema.lookup` como el primer recurso para consultar la documentación y las restricciones exactas
de cada campo. Use la [Referencia de configuración](/es/gateway/configuration-reference)
cuando necesiten el mapa de configuración general, los valores predeterminados o enlaces a referencias
específicas de los subsistemas.

<Note>
Las escrituras del plano de control (`config.apply`, `config.patch`, `update.run`) tienen
un límite de 3 solicitudes por cada 60 segundos y por `deviceId+clientIp`. Las solicitudes de reinicio
se agrupan y luego imponen un periodo de espera de 30 segundos entre ciclos de reinicio.
`update.status` es de solo lectura, pero está restringido a administradores porque el indicador de reinicio puede
incluir resúmenes de los pasos de actualización y las partes finales de la salida de comandos.
</Note>

Ejemplo de parche parcial:

```bash
openclaw gateway call config.get --params '{}'  # capturar payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Tanto `config.apply` como `config.patch` aceptan `raw`, `baseHash`, `sessionKey`,
`note` y `restartDelayMs`. `baseHash` es obligatorio para ambos métodos cuando ya
existe un archivo de configuración (la primera escritura sin una configuración existente omite la comprobación).

`config.patch` también acepta `replacePaths`, un arreglo de rutas de configuración cuyo reemplazo
de arreglos es intencionado. Si un parche reemplazara o eliminara un arreglo existente
por otro con menos entradas, el Gateway rechaza la escritura a menos que esa ruta exacta aparezca
en `replacePaths`; los arreglos anidados dentro de entradas de arreglos usan `[]`, como
`agents.list[].skills`. Esto evita que las instantáneas truncadas de `config.get`
sobrescriban silenciosamente los arreglos de enrutamiento o listas de permitidos. Use `config.apply` cuando
pretenda reemplazar toda la configuración.

## Variables de entorno

OpenClaw lee las variables de entorno del proceso principal, además de:

- `.env` del directorio de trabajo actual (si existe)
- `~/.openclaw/.env` (alternativa global)

Ninguno de los archivos reemplaza las variables de entorno existentes. También se pueden definir variables de entorno integradas en la configuración:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importación del entorno del shell (opcional)">
  Si se habilita y las claves esperadas no están definidas, OpenClaw ejecuta el shell de inicio de sesión e importa únicamente las claves ausentes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Variable de entorno equivalente: `OPENCLAW_LOAD_SHELL_ENV=1`. Valor predeterminado de `timeoutMs`: `15000`.
</Accordion>

<Accordion title="Sustitución de variables de entorno en valores de configuración">
  Haga referencia a las variables de entorno en cualquier valor de cadena de configuración mediante `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo se reconocen nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`
- Las variables ausentes o vacías generan un error durante la carga
- Use `$${VAR}` como escape para obtener una salida literal
- Funciona dentro de archivos `$include`
- Sustitución integrada: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencias a secretos (entorno, archivo, ejecución)">
  Para los campos que admiten objetos SecretRef, se puede usar:

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

Los detalles de SecretRef (incluido `secrets.providers` para `env`/`file`/`exec`) se encuentran en [Gestión de secretos](/es/gateway/secrets).
Las rutas de credenciales compatibles se enumeran en [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Accordion>

Consulte [Entorno](/es/help/environment) para conocer todas las precedencias y fuentes.

## Referencia completa

Para consultar la referencia completa campo por campo, consulte la **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_

## Contenido relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Manual de operaciones del Gateway](/es/gateway)
