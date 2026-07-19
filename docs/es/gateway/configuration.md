---
read_when:
    - Configurar OpenClaw por primera vez
    - Buscando patrones de configuración comunes
    - Navegación a secciones específicas de la configuración
summary: 'Descripción general de la configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-07-19T01:53:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0fa0f0cd54052ebb3a2aa4cd5600d7bdcb65a0a499a07d7e62496ee23464afdd
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lee una configuración opcional <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`. Si falta el archivo, OpenClaw utiliza valores predeterminados seguros.

La ruta de configuración activa debe ser un archivo normal. Las escrituras realizadas por OpenClaw lo sustituyen de forma atómica (se cambia el nombre sobre la ruta), por lo que, si `openclaw.json` es un enlace simbólico, se sustituye su destino en lugar de escribir a través del enlace; evite las configuraciones basadas en enlaces simbólicos. Si mantiene la configuración fuera del directorio de estado predeterminado, haga que `OPENCLAW_CONFIG_PATH` apunte directamente al archivo real.

Motivos habituales para añadir una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Configurar modelos, herramientas, aislamiento o automatización (cron, hooks)
- Ajustar sesiones, contenido multimedia, redes o interfaz de usuario

Consulte la [referencia completa](/es/gateway/configuration-reference) para conocer todos los campos disponibles.

Los agentes y la automatización deben utilizar `config.schema.lookup` para consultar la
documentación exacta de cada campo antes de editar la configuración. Utilice esta página para obtener orientación por tareas y
la [Referencia de configuración](/es/gateway/configuration-reference) para consultar el mapa general
de campos y los valores predeterminados.

<Tip>
**¿Es la primera vez que configura OpenClaw?** Comience con `openclaw onboard` para realizar la configuración interactiva o consulte la guía de [Ejemplos de configuración](/es/gateway/configuration-examples), que contiene configuraciones completas listas para copiar y pegar.
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
    Abra [http://127.0.0.1:18789](http://127.0.0.1:18789) y utilice la pestaña **Configuración**.
    La interfaz de control genera un formulario a partir del esquema de configuración activo, incluidos los metadatos de documentación
    `title` / `description` de los campos, además de los esquemas de plugins y canales cuando
    están disponibles, con un editor de **JSON sin procesar** como vía alternativa. Para interfaces
    de exploración detallada y otras herramientas, el Gateway también expone `config.schema.lookup` para
    obtener un nodo de esquema limitado a una ruta junto con resúmenes de sus elementos secundarios inmediatos.
  </Tab>
  <Tab title="Edición directa">
    Edite `~/.openclaw/openclaw.json` directamente. El Gateway supervisa el archivo y aplica los cambios automáticamente (consulte la [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan por completo con el esquema. Las claves desconocidas, los tipos incorrectos o los valores no válidos hacen que el Gateway **se niegue a iniciarse**. La única excepción en el nivel raíz es `$schema` (cadena), que permite a los editores adjuntar metadatos de JSON Schema.
</Warning>

`openclaw config schema` imprime el JSON Schema canónico utilizado por la interfaz de control
y la validación. `config.schema.lookup` obtiene un único nodo limitado a una ruta junto con
resúmenes de sus elementos secundarios para herramientas de exploración detallada. Los metadatos de documentación `title`/`description` de los campos
se propagan por objetos anidados, comodines (`*`), elementos de matriz (`[]`) y ramas `anyOf`/
`oneOf`/`allOf`. Los esquemas de plugins y canales en tiempo de ejecución se combinan cuando se
carga el registro de manifiestos.

Cuando falla la validación:

- El Gateway no se inicia
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecute `openclaw doctor` para ver los problemas exactos
- Ejecute `openclaw doctor --fix` (`--repair` es la misma opción; `--yes` omite las solicitudes de confirmación) para aplicar las reparaciones

El Gateway conserva una copia fiable de la última configuración válida después de cada inicio correcto,
pero ni el inicio ni la recarga en caliente la restauran automáticamente; solo `openclaw doctor --fix`
lo hace. Si `openclaw.json` no supera la validación (incluida la validación local de un plugin), el Gateway
no se inicia o se omite la recarga, y el entorno de ejecución actual conserva la última
configuración aceptada. Una escritura rechazada también se guarda como `<path>.rejected.<timestamp>` para su inspección.
El Gateway bloquea las escrituras que parecen sobrescrituras accidentales —como eliminar `gateway.mode`,
perder el bloque `meta` o reducir el archivo a menos de la mitad de su tamaño—, salvo que la escritura
permita explícitamente cambios destructivos. No se promueve una configuración a última configuración válida cuando
contiene un marcador de posición de secreto oculto, como `***` o `[redacted]`.

## Tareas habituales

<AccordionGroup>
  <Accordion title="Configurar un canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tiene su propia sección de configuración bajo `channels.<provider>`. Consulte la página dedicada al canal para conocer los pasos de configuración:

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
    Configure el modelo principal y las alternativas opcionales:

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

    - `agents.defaults.models` almacena alias y ajustes por modelo; añadir una entrada nunca restringe las sustituciones de `/model` o `--model`.
    - `agents.defaults.modelPolicy.allow` es la lista explícita de elementos permitidos para sustituciones y selectores de modelos. Acepta referencias exactas y comodines `provider/*`; omítala o utilice `[]` para permitir cualquier modelo.
    - Las referencias de modelos utilizan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de imágenes de transcripciones y herramientas (valor predeterminado: `1200`); los valores más bajos suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulte la [CLI de modelos](/es/concepts/models) para cambiar de modelo en el chat y la [Conmutación por error de modelos](/es/concepts/model-failover) para conocer la rotación de autenticación y el comportamiento de las alternativas.
    - Para proveedores personalizados o autoalojados, consulte [Proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso mediante mensajes directos se controla por canal mediante `dmPolicy` (valor predeterminado: `"pairing"`):

    - `"pairing"`: los remitentes desconocidos reciben un código de vinculación de un solo uso para su aprobación
    - `"allowlist"`: solo se permiten los remitentes incluidos en `allowFrom` (o en el almacén de permitidos vinculados)
    - `"open"`: permite todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los mensajes directos

    Para los grupos, utilice `groupPolicy` (`"allowlist" | "open" | "disabled"`) junto con `groupAllowFrom` o listas de elementos permitidos específicas del canal.

    Consulte la [referencia completa](/es/gateway/config-channels#dm-and-group-access) para obtener detalles de cada canal.

  </Accordion>

  <Accordion title="Configurar el requisito de menciones en chats grupales">
    De forma predeterminada, los mensajes de grupo **requieren una mención**. Configure patrones de activación por agente. Las respuestas normales de grupos o canales se publican automáticamente; habilite la ruta de la herramienta de mensajes en salas compartidas donde el agente deba decidir cuándo intervenir:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // establezca "message_tool" para exigir envíos mediante la herramienta de mensajes en todas partes
        groupChat: {
          visibleReplies: "message_tool", // habilitación opcional; la salida visible requiere message(action=send)
          unmentionedInbound: "room_event", // la conversación grupal continua sin menciones constituye contexto silencioso
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

    - **Menciones en metadatos**: menciones @ nativas (mención mediante toque en WhatsApp, @bot en Telegram, etc.)
    - **Patrones de texto**: patrones de expresiones regulares seguros en `mentionPatterns`
    - **Respuestas visibles**: `messages.visibleReplies` puede exigir envíos mediante la herramienta de mensajes de forma global; `messages.groupChat.visibleReplies` lo sustituye para grupos y canales.
    - Consulte la [referencia completa](/es/gateway/config-channels#group-chat-mention-gating) para conocer los modos de respuesta visible, las sustituciones por canal y el modo de chat con uno mismo.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Utilice `agents.defaults.skills` como base compartida y, a continuación, sustituya la configuración de agentes
    específicos con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hereda github y weather
          { id: "docs", skills: ["docs-search"] }, // sustituye los valores predeterminados
          { id: "locked-down", skills: [] }, // sin Skills
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para permitir todas las Skills de forma predeterminada.
    - Omita `agents.list[].skills` para heredar los valores predeterminados.
    - Establezca `agents.list[].skills: []` para no permitir ninguna Skill.
    - Consulte [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y
      la [Referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar la supervisión del estado de los canales del Gateway">
    Controle con qué intensidad reinicia el Gateway los canales que parecen inactivos:

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

    - Los valores mostrados son los predeterminados. Establezca `gateway.channelHealthCheckMinutes: 0` para desactivar globalmente los reinicios del monitor de estado.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de comprobación.
    - Utilice `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desactivar los reinicios automáticos de un canal o una cuenta sin desactivar el monitor global.
    - Consulte [Comprobaciones de estado](/es/gateway/health) para el diagnóstico operativo y la [referencia completa](/es/gateway/configuration-reference#gateway) para conocer todos los campos.

  </Accordion>

  <Accordion title="Ajustar el tiempo de espera del protocolo de enlace WebSocket del Gateway">
    Conceda a los clientes locales más tiempo para completar el protocolo de enlace WebSocket previo a la autenticación en
    hosts con mucha carga o de baja potencia:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - El valor predeterminado es de `15000` milisegundos.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` sigue teniendo prioridad para anulaciones puntuales del servicio o del shell.
    - Se recomienda corregir primero los bloqueos del inicio o del bucle de eventos; este ajuste está destinado a hosts que funcionan correctamente, pero son lentos durante el calentamiento.

  </Accordion>

  <Accordion title="Configurar sesiones y restablecimientos">
    Las sesiones controlan la continuidad y el aislamiento de las conversaciones:

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
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones vinculadas a hilos. `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age` vinculan, desvinculan, enumeran y ajustan esta configuración por sesión (Discord vincula hilos; Telegram vincula temas o conversaciones).
    - Consulte [Gestión de sesiones](/es/concepts/session) para obtener información sobre el ámbito, los vínculos de identidad y la política de envío.
    - Consulte la [referencia completa](/es/gateway/config-agents#session) para conocer todos los campos.

  </Accordion>

  <Accordion title="Activar el aislamiento">
    Ejecute sesiones de agentes en entornos aislados:

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

    Compile primero la imagen: desde un checkout del código fuente, ejecute `scripts/sandbox-setup.sh`; si realizó una instalación mediante npm, consulte el comando `docker build` incluido en [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup).

    Consulte [Aislamiento](/es/gateway/sandboxing) para obtener la guía completa y la [referencia completa](/es/gateway/config-agents#agentsdefaultssandbox) para conocer todas las opciones.

  </Accordion>

  <Accordion title="Activar notificaciones push mediante relay para compilaciones oficiales de iOS">
    Las notificaciones push mediante relay para las compilaciones públicas de App Store utilizan el relay alojado de OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Las implementaciones de relay personalizadas requieren una ruta de compilación e implementación de iOS deliberadamente independiente cuya URL de relay coincida con la URL de relay del gateway. Si se utiliza una compilación con relay personalizado, establezca lo siguiente en la configuración del gateway:

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

    Funciones:

    - Permite que el gateway envíe `push.test`, señales de activación y activaciones de reconexión a través del relay externo.
    - Utiliza una autorización de envío limitada al registro y reenviada por la aplicación iOS emparejada. El gateway no necesita un token de relay para toda la implementación.
    - Vincula cada registro respaldado por relay con la identidad del gateway con la que se emparejó la aplicación iOS, de modo que ningún otro gateway pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales o manuales de iOS en APNs directas. Los envíos mediante relay solo se aplican a las compilaciones distribuidas oficiales que se registraron mediante el relay.
    - Debe coincidir con la URL base del relay integrada en la compilación de iOS, para que el tráfico de registro y envío llegue a la misma implementación del relay.

    Flujo integral:

    1. Instale la aplicación oficial de iOS.
    2. Opcional: configure `gateway.push.apns.relay.baseUrl` en el gateway únicamente cuando utilice una compilación con relay personalizado deliberadamente independiente.
    3. Empareje la aplicación iOS con el gateway y permita que se conecten tanto las sesiones del Node como las del operador.
    4. La aplicación iOS obtiene la identidad del gateway, se registra en el relay mediante App Attest y el recibo de la aplicación y, a continuación, publica la carga útil `push.apns.register` respaldada por relay en el gateway emparejado.
    5. El gateway almacena el identificador del relay y la autorización de envío y, a continuación, los utiliza para `push.test`, las señales de activación y las activaciones de reconexión.

    Notas operativas:

    - Si se cambia la aplicación iOS a otro gateway, vuelva a conectar la aplicación para que pueda publicar un nuevo registro del relay vinculado a ese gateway.
    - Si se distribuye una nueva compilación de iOS que apunta a otra implementación del relay, la aplicación actualiza su registro del relay almacenado en caché en lugar de reutilizar el origen del relay anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como anulaciones temporales mediante variables de entorno.
    - Las URL de relay personalizadas del gateway deben coincidir con la URL base del relay integrada en la compilación de iOS; el canal de publicación pública de App Store rechaza las anulaciones de la URL de relay personalizada de iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continúa siendo una vía de escape de desarrollo exclusiva para loopback; no almacene URL HTTP de relay en la configuración.

    Consulte [Aplicación iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para conocer el flujo integral y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para conocer el modelo de seguridad del relay.

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
    - `directPolicy`: `allow` (predeterminado) o `block` para destinos de Heartbeat de tipo DM
    - Consulte [Heartbeat](/es/gateway/heartbeat) para obtener la guía completa.

  </Accordion>

  <Accordion title="Configurar trabajos Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // valor predeterminado; despacho Cron + ejecución aislada del turno del agente Cron
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: elimina las sesiones de ejecución aisladas completadas de las filas de sesiones de SQLite (valor predeterminado: `24h`; establezca `false` para desactivarlo).
    - El historial de ejecución conserva automáticamente las 2000 filas terminales más recientes por trabajo; las filas perdidas mantienen su periodo de limpieza de 24 horas.
    - Consulte [Trabajos Cron](/es/automation/cron-jobs) para obtener una descripción general de la función y ejemplos de la CLI.

  </Accordion>

  <Accordion title="Configurar webhooks (hooks)">
    Active los endpoints de Webhook HTTP en el Gateway:

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
    - Trate todo el contenido de las cargas útiles de hooks o webhooks como entrada no fiable.
    - Utilice un `hooks.token` específico; no reutilice secretos de autenticación activos del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - La autenticación de hooks solo se admite mediante encabezados (`Authorization: Bearer ...` o `x-openclaw-token`); se rechazan los tokens de la cadena de consulta.
    - `hooks.path` no puede ser `/`; mantenga la entrada de webhooks en una subruta específica, como `/hooks`.
    - Mantenga desactivadas las marcas que omiten la protección contra contenido no seguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), salvo durante una depuración estrictamente delimitada.
    - Si activa `hooks.allowRequestSessionKey`, establezca también `hooks.allowedSessionKeyPrefixes` para limitar las claves de sesión seleccionadas por quien realiza la llamada.
    - Para los agentes controlados mediante hooks, se recomienda utilizar niveles de modelos modernos y potentes y una política estricta de herramientas (por ejemplo, solo mensajería y aislamiento cuando sea posible).

    Consulte la [referencia completa](/es/gateway/configuration-reference#hooks) para conocer todas las opciones de asignación y la integración con Gmail.

  </Accordion>

  <Accordion title="Configurar el enrutamiento multiagente">
    Ejecute varios agentes aislados con espacios de trabajo y sesiones independientes:

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

    Consulte [Multiagente](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/config-agents#multi-agent-routing) para conocer las reglas de vinculación y los perfiles de acceso por agente.

  </Accordion>

  <Accordion title="Dividir la configuración en varios archivos ($include)">
    Utilice `$include` para organizar configuraciones grandes:

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

    - **Archivo único**: sustituye el objeto contenedor
    - **Matriz de archivos**: se combinan en profundidad y en orden (prevalece el último), hasta 10 niveles de anidamiento
    - **Claves del mismo nivel**: se combinan después de las inclusiones (anulan los valores incluidos)
    - **Rutas relativas**: se resuelven con respecto al archivo que realiza la inclusión
    - **Formato de ruta**: las rutas de inclusión no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de la resolución
    - **Escrituras propiedad de OpenClaw**: cuando una escritura modifica únicamente una sección de nivel superior
      respaldada por una inclusión de archivo único, como `plugins: { $include: "./plugins.json5" }`,
      OpenClaw actualiza ese archivo incluido y deja `openclaw.json` intacto
    - **Escritura directa no compatible**: las inclusiones raíz, las matrices de inclusiones y las inclusiones
      con anulaciones del mismo nivel fallan de forma segura durante las escrituras propiedad de OpenClaw, en lugar de
      aplanar la configuración
    - **Confinamiento**: las rutas `$include` deben resolverse dentro del directorio que contiene
      `openclaw.json`. Para compartir un árbol entre máquinas o usuarios, establezca
      `OPENCLAW_INCLUDE_ROOTS` en una lista de rutas (`:` en POSIX, `;` en Windows) de
      directorios adicionales a los que pueden hacer referencia las inclusiones. Los enlaces simbólicos se resuelven
      y se vuelven a comprobar, por lo que una ruta que se encuentre léxicamente en un directorio de configuración, pero cuyo
      destino real esté fuera de todas las raíces permitidas, también se rechaza.
    - **Gestión de errores**: errores claros para archivos ausentes, errores de análisis, inclusiones circulares, formatos de ruta no válidos y longitudes excesivas

  </Accordion>
</AccordionGroup>

## Recarga en caliente de la configuración

El Gateway supervisa `~/.openclaw/openclaw.json` y aplica los cambios automáticamente; no es necesario reiniciar manualmente para la mayoría de los ajustes.

Las modificaciones directas del archivo se consideran no fiables hasta que se validan. El observador espera
a que finalice la actividad de escritura temporal y cambio de nombre del editor, lee el archivo definitivo y rechaza
las modificaciones externas no válidas sin reescribir `openclaw.json`. Las escrituras de configuración
propiedad de OpenClaw utilizan la misma validación del esquema antes de escribir (consulte [Validación estricta](#strict-validation)
para conocer las reglas de sobrescritura y reversión que se aplican a cada escritura).

Si aparece `config reload skipped (invalid config)` o el inicio informa de `Invalid
config`, inspeccione la configuración, ejecute `openclaw config validate` y, a continuación, ejecute `openclaw
doctor --fix` para repararla. Consulte [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config)
para ver la lista de comprobación.

### Modos de recarga

| Modo                   | Comportamiento                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica al instante y sin reiniciar los cambios seguros. Se reinicia automáticamente para los críticos.           |
| **`hot`**              | Solo aplica sin reiniciar los cambios seguros. Registra una advertencia cuando es necesario reiniciar; el reinicio queda a su cargo. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, sea seguro o no.                                 |
| **`off`**              | Desactiva la supervisión de archivos. Los cambios surten efecto en el siguiente reinicio manual.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica sin reiniciar y qué requiere un reinicio

La mayoría de los campos se aplican sin interrupción ni reinicio; algunas secciones que se aplican sin reiniciar reinician únicamente ese
subsistema (canal, cron, heartbeat, monitor de estado) en lugar de todo el Gateway. En el
modo `hybrid`, los cambios que requieren reiniciar el Gateway se gestionan automáticamente.

| Categoría            | Campos                                                                  | ¿Es necesario reiniciar el Gateway?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Canales            | `channels.*`, `web` (WhatsApp): todos los canales integrados y de plugins       | No (reinicia ese canal)   |
| Agente y modelos      | `agent`, `agents`, `models`, `routing`                                  | No                           |
| Automatización          | `hooks`, `cron`, `agent.heartbeat`                                      | No (reinicia ese subsistema) |
| Sesiones y mensajes | `session`, `messages`                                                   | No                           |
| Herramientas y contenido multimedia       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | No                           |
| Configuración de plugins       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | No (recarga el entorno de ejecución de plugins)  |
| Interfaz de usuario y otros           | `ui`, `logging`, `identity`, `bindings`                                 | No                           |
| Servidor del Gateway      | `gateway.*` (puerto, enlace, autenticación, tailscale, TLS, HTTP, envío)              | **Sí**                      |
| Infraestructura      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Sí**                      |

<Note>
`gateway.reload` y `gateway.remote` son excepciones en `gateway.*`: modificarlos **no** provoca un reinicio. Los plugins individuales también pueden reemplazar esta tabla: un plugin cargado puede declarar sus propios prefijos de configuración que provocan reinicios (por ejemplo, el plugin Canvas incluido reinicia el Gateway para `plugins.enabled`, `plugins.allow` y `plugins.deny`, no solo para su propio `plugins.entries.canvas`), por lo que el comportamiento real depende de qué plugins estén activos.
</Note>

### Planificación de la recarga

Al editar un archivo de origen al que se hace referencia mediante `$include`, OpenClaw planifica
la recarga a partir de la disposición definida en el origen, no de la vista aplanada en memoria.
Esto mantiene predecibles las decisiones de recarga en caliente (aplicar sin reiniciar o reiniciar), incluso cuando una
única sección de nivel superior reside en su propio archivo incluido, como
`plugins: { $include: "./plugins.json5" }`. La planificación de la recarga se interrumpe de forma segura si la
disposición del origen es ambigua.

## RPC de configuración (actualizaciones mediante programación)

Para las herramientas que escriben la configuración mediante la API del Gateway, se recomienda este flujo:

- `config.schema.lookup` para inspeccionar un subárbol (nodo de esquema superficial y resúmenes
  de sus elementos secundarios)
- `config.get` para obtener la instantánea actual junto con `hash`
- `config.patch` para actualizaciones parciales (parche de combinación JSON: los objetos se combinan, `null`
  elimina y los arreglos se reemplazan cuando se confirma explícitamente con `replacePaths` si
  se eliminarían entradas)
- `config.apply` solo cuando se pretenda reemplazar toda la configuración
- `update.run` para una actualización propia explícita seguida de un reinicio; incluya `continuationMessage` cuando la sesión posterior al reinicio deba ejecutar un turno de seguimiento
- `update.status` para inspeccionar el indicador de reinicio de la actualización más reciente y verificar la versión en ejecución tras un reinicio

Los agentes deben considerar `config.schema.lookup` como el primer recurso para consultar la documentación y las restricciones exactas
de cada campo. Use la [Referencia de configuración](/es/gateway/configuration-reference)
cuando necesiten el mapa de configuración más amplio, los valores predeterminados o enlaces a referencias
específicas de los subsistemas.

<Note>
Las escrituras del plano de control (`config.apply`, `config.patch`, `update.run`) están
limitadas a 30 solicitudes por cada 60 segundos, por método y por
`deviceId+clientIp`; consulte [Limitación de frecuencia](/gateway/security/rate-limiting). Las solicitudes de reinicio
se agrupan y luego se impone un periodo de espera de 30 segundos entre ciclos de reinicio.
`update.status` es de solo lectura, pero está restringido a administradores porque el indicador de reinicio puede
incluir resúmenes de los pasos de actualización y los últimos fragmentos de la salida de comandos.
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
`note` y `restartDelayMs`. `baseHash` es obligatorio para ambos métodos una vez que ya
existe un archivo de configuración (la primera escritura sin una configuración existente omite la comprobación).

`config.patch` también acepta `replacePaths`, un arreglo de rutas de configuración cuyo reemplazo del arreglo
es intencional. Si un parche reemplazara o eliminara un arreglo existente
con menos entradas, el Gateway rechaza la escritura salvo que esa ruta exacta aparezca
en `replacePaths`; los arreglos anidados dentro de entradas de arreglos usan `[]`, como
`agents.list[].skills`. Esto evita que las instantáneas truncadas de `config.get`
sobrescriban silenciosamente los arreglos de enrutamiento o de listas de permitidos. Use `config.apply` cuando
se pretenda reemplazar toda la configuración.

## Variables de entorno

OpenClaw lee las variables de entorno del proceso principal, además de:

- `.env` del directorio de trabajo actual (si está presente)
- `~/.openclaw/.env` (alternativa global)

Ninguno de estos archivos reemplaza las variables de entorno existentes. También es posible establecer variables de entorno directamente en la configuración:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importación de variables de entorno del shell (opcional)">
  Si está habilitada y no se han definido las claves esperadas, OpenClaw ejecuta el shell de inicio de sesión e importa únicamente las claves que faltan:

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
  Haga referencia a variables de entorno en cualquier valor de cadena de la configuración mediante `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo coinciden los nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`
- Las variables ausentes o vacías provocan un error durante la carga
- Use la secuencia de escape `$${VAR}` para obtener una salida literal
- Funciona dentro de archivos `$include`
- Sustitución en línea: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Consulte [Entorno](/es/help/environment) para conocer todas las fuentes y el orden de precedencia.

## Referencia completa

Para consultar la referencia completa campo por campo, consulte la **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_

## Contenido relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Manual de operaciones del Gateway](/es/gateway)
