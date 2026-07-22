---
read_when:
    - Configurar OpenClaw por primera vez
    - Buscando patrones de configuración comunes
    - Navegar a secciones específicas de la configuración
summary: 'Descripción general de la configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-07-22T10:34:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 09cc04efa16f32e12d6ebcea7a1d36b336df32227fe66953c5d70107708ee6c3
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw lee una configuración <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> opcional desde `~/.openclaw/openclaw.json`. Si el archivo no existe, OpenClaw utiliza valores predeterminados seguros.

La ruta de configuración activa debe ser un archivo normal. Las escrituras gestionadas por OpenClaw lo reemplazan de forma atómica (mediante un cambio de nombre sobre la ruta), por lo que un `openclaw.json` que sea un enlace simbólico hace que se reemplace su destino en lugar de escribir a través del enlace; evite estructuras de configuración con enlaces simbólicos. Si mantiene la configuración fuera del directorio de estado predeterminado, haga que `OPENCLAW_CONFIG_PATH` apunte directamente al archivo real.

Motivos habituales para añadir una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Configurar modelos, herramientas, aislamiento o automatización (cron, hooks)
- Ajustar sesiones, contenido multimedia, redes o la interfaz de usuario

Consulte la [referencia completa](/es/gateway/configuration-reference) para ver todos los campos disponibles.

La configuración sigue una regla de dos grupos: los elementos hermanos de la raíz contienen la infraestructura y los valores predeterminados comunes a los agentes, mientras que `agents.defaults` contiene el comportamiento del bucle del agente. Las entradas de `agents.entries` pueden sobrescribir cualquiera de los grupos cuando el esquema admite una sobrescritura por agente.

Los agentes y la automatización deben usar `config.schema.lookup` para consultar la
documentación exacta de cada campo antes de editar la configuración. Utilice esta página para obtener orientación basada en tareas y
la [referencia de configuración](/es/gateway/configuration-reference) para consultar el mapa
general de campos y valores predeterminados.

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
    openclaw onboard       # flujo completo de incorporación
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
    La interfaz de control representa un formulario a partir del esquema de configuración activo, incluidos los metadatos
    de documentación `title` / `description` de los campos, además de los esquemas de plugins y canales cuando
    estén disponibles, con un editor de **JSON sin procesar** como vía alternativa. Para interfaces
    de navegación detallada y otras herramientas, el Gateway también expone `config.schema.lookup` para
    obtener un nodo del esquema limitado a una ruta junto con resúmenes de sus elementos secundarios inmediatos.
    La configuración muestra primero los campos comunes. Cada sección mantiene sus campos avanzados
    en un grupo contraído **Avanzado (N)**; utilice **Mostrar opciones avanzadas** para expandir todos los
    grupos. La búsqueda de configuración siempre incluye ambos niveles y abre el grupo
    avanzado correspondiente cuando es necesario.
  </Tab>
  <Tab title="Edición directa">
    Edite `~/.openclaw/openclaw.json` directamente. El Gateway supervisa el archivo y aplica los cambios automáticamente (consulte la [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan por completo con el esquema. Las claves desconocidas, los tipos con formato incorrecto o los valores no válidos hacen que el Gateway **se niegue a iniciarse**. La única excepción en el nivel raíz es `$schema` (cadena), para que los editores puedan adjuntar metadatos de JSON Schema.
</Warning>

`openclaw config schema` imprime el JSON Schema canónico que utilizan la interfaz de control
y la validación. `config.schema.lookup` obtiene un único nodo limitado a una ruta junto con
resúmenes de sus elementos secundarios para herramientas de navegación detallada. Los metadatos de documentación `title`/`description` de los campos
se propagan a través de objetos anidados, comodines (`*`), elementos de matriz (`[]`) y ramas `anyOf`/
`oneOf`/`allOf`. Los esquemas de plugins y canales en tiempo de ejecución se combinan cuando se
carga el registro de manifiestos.

Cada hoja de configuración tiene un nivel de presentación común o avanzado en `uiHints`.
`advanced: false` identifica la configuración común y `advanced: true` identifica la configuración
avanzada. Una hoja hereda el nivel del ancestro más cercano cuando no tiene una indicación directa;
las rutas sin un ancestro declarado utilizan el nivel avanzado de forma predeterminada. Esto solo afecta a la presentación,
no a la validación, los valores predeterminados, el comportamiento de recarga ni a la posibilidad de establecer la clave.

Cuando falla la validación:

- El Gateway no se inicia
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecute `openclaw doctor` para ver los problemas exactos
- Ejecute `openclaw doctor --fix` (`--repair` es la misma opción; `--yes` omite las preguntas) para aplicar las reparaciones

El Gateway conserva una copia fiable de la última configuración válida después de cada inicio correcto,
pero ni el inicio ni la recarga en caliente la restauran automáticamente; solo `openclaw doctor --fix`
lo hace. Si `openclaw.json` no supera la validación (incluida la validación local de plugins), el inicio
del Gateway falla o se omite la recarga, y el entorno de ejecución actual mantiene la última
configuración aceptada. Las escrituras rechazadas también se guardan como `<path>.rejected.<timestamp>` para su inspección.
El Gateway bloquea las escrituras que parecen sobrescrituras accidentales —como eliminar `gateway.mode`,
perder el bloque `meta` o reducir el archivo en más de la mitad—, a menos que la escritura
permita explícitamente cambios destructivos. No se promociona una configuración como la última configuración válida cuando
contiene un marcador de posición de secreto censurado, como `***` o `[redacted]`.

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
    Establezca el modelo principal y las alternativas opcionales:

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

    - `agents.defaults.models` almacena alias y configuraciones por modelo; añadir una entrada nunca restringe las sobrescrituras de `/model` ni de `--model`.
    - `agents.defaults.modelPolicy.allow` es la lista explícita de elementos permitidos para las sobrescrituras y los selectores de modelos. Acepta referencias exactas y comodines `provider/*`; omítala o utilice `[]` para permitir cualquier modelo.
    - Las referencias de modelos utilizan el formato `provider/model` (por ejemplo, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de las imágenes de transcripciones y herramientas (valor predeterminado: `1200`); los valores inferiores suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulte la [CLI de modelos](/es/concepts/models) para cambiar de modelo en el chat y la [conmutación por error de modelos](/es/concepts/model-failover) para conocer la rotación de autenticación y el comportamiento de las alternativas.
    - Para proveedores personalizados o autoalojados, consulte [Proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso mediante mensajes directos se controla por canal con `dmPolicy` (valor predeterminado: `"pairing"`):

    - `"pairing"`: los remitentes desconocidos reciben un código de vinculación de un solo uso para su aprobación
    - `"allowlist"`: solo los remitentes incluidos en `allowFrom` (o en el almacén de elementos vinculados permitidos)
    - `"open"`: permite todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los mensajes directos

    Para grupos, utilice `groupPolicy` (`"allowlist" | "open" | "disabled"`) junto con `groupAllowFrom` o listas de elementos permitidos específicas del canal.

    Consulte la [referencia completa](/es/gateway/config-channels#dm-and-group-access) para obtener información específica de cada canal.

  </Accordion>

  <Accordion title="Configurar el requisito de menciones en chats de grupo">
    De forma predeterminada, los mensajes de grupo **requieren una mención**. Configure los patrones de activación por agente. Las respuestas normales de grupos o canales se publican automáticamente; habilite la ruta de la herramienta de mensajes en salas compartidas donde el agente deba decidir cuándo intervenir:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // establezca "message_tool" para exigir envíos mediante la herramienta de mensajes en todas partes
        groupChat: {
          visibleReplies: "message_tool", // activación opcional; la salida visible requiere message(action=send)
          unmentionedInbound: "room_event", // la conversación grupal continua sin menciones es contexto silencioso
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
    - **Respuestas visibles**: `messages.visibleReplies` puede exigir envíos mediante la herramienta de mensajes de forma global; `messages.groupChat.visibleReplies` sobrescribe ese comportamiento para grupos y canales.
    - Consulte la [referencia completa](/es/gateway/config-channels#group-chat-mention-gating) para conocer los modos de respuesta visible, las sobrescrituras por canal y el modo de chat consigo mismo.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Utilice `agents.defaults.skills` como base compartida y después sobrescriba agentes
    concretos con `agents.entries.*.skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hereda github y weather
          { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
          { id: "locked-down", skills: [] }, // sin Skills
        ],
      },
    }
    ```

    - Omita `agents.defaults.skills` para permitir todas las Skills de forma predeterminada.
    - Omita `agents.entries.*.skills` para heredar los valores predeterminados.
    - Establezca `agents.entries.*.skills: []` para no permitir ninguna Skill.
    - Consulte [Skills](/es/tools/skills), la [configuración de Skills](/es/tools/skills-config) y
      la [referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Configurar la supervisión del estado por canal">
    Deshabilite o habilite los reinicios automáticos por estado para un canal o una cuenta:

    ```json5
    {
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

    - Utilice `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para controlar los reinicios automáticos de un canal o una cuenta.
    - Consulte [Comprobaciones de estado](/es/gateway/health) para obtener información de depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para ver todos los campos.

  </Accordion>

  <Accordion title="Configurar sesiones y restablecimientos">
    Las sesiones controlan la continuidad y el aislamiento de las conversaciones:

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
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones vinculadas a hilos. `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age` vinculan, desvinculan, enumeran y ajustan esta configuración por sesión (Discord vincula hilos; Telegram vincula temas/conversaciones).
    - Consulte [Gestión de sesiones](/es/concepts/session) para obtener información sobre el ámbito, los vínculos de identidad y la política de envío.
    - Consulte la [referencia completa](/es/gateway/config-agents#session) para conocer todos los campos.

  </Accordion>

  <Accordion title="Activar el aislamiento">
    Ejecute las sesiones de los agentes en entornos aislados:

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

    Primero compile la imagen: desde una copia del código fuente, ejecute `scripts/sandbox-setup.sh`; o, desde una instalación de npm, consulte el comando `docker build` incluido en [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup).

    Consulte [Aislamiento](/es/gateway/sandboxing) para acceder a la guía completa y la [referencia completa](/es/gateway/config-agents#agentsdefaultssandbox) para conocer todas las opciones.

  </Accordion>

  <Accordion title="Activar las notificaciones push mediante retransmisión para compilaciones oficiales de iOS">
    Las notificaciones push mediante retransmisión para compilaciones públicas de App Store utilizan el servicio de retransmisión alojado de OpenClaw: `https://ios-push-relay.openclaw.ai`.

    Las implementaciones de retransmisión personalizadas requieren una ruta de compilación e implementación de iOS deliberadamente independiente cuya URL de retransmisión coincida con la URL de retransmisión del Gateway. Si se utiliza una compilación de retransmisión personalizada, establezca lo siguiente en la configuración del Gateway:

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

    Equivalente en la CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Función de esta configuración:

    - Permite que el Gateway envíe `push.test`, avisos de activación y activaciones de reconexión mediante el servicio de retransmisión externo.
    - Utiliza una concesión de envío limitada al registro que reenvía la aplicación iOS emparejada. El Gateway no necesita un token de retransmisión para toda la implementación.
    - Vincula cada registro mediante retransmisión con la identidad del Gateway con el que se emparejó la aplicación iOS, de modo que otro Gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales/manuales de iOS en APNs directo. Los envíos mediante retransmisión solo se aplican a compilaciones oficiales distribuidas que se registraron mediante el servicio de retransmisión.
    - Debe coincidir con la URL base de retransmisión integrada en la compilación de iOS, para que el tráfico de registro y de envío llegue a la misma implementación de retransmisión.

    Flujo integral:

    1. Instale la aplicación oficial de iOS.
    2. Opcional: configure `gateway.push.apns.relay.baseUrl` en el Gateway únicamente cuando utilice una compilación de retransmisión personalizada deliberadamente independiente.
    3. Empareje la aplicación iOS con el Gateway y permita que se conecten tanto las sesiones del nodo como las del operador.
    4. La aplicación iOS obtiene la identidad del Gateway, se registra en el servicio de retransmisión mediante App Attest y el recibo de la aplicación, y luego publica la carga útil `push.apns.register` mediante retransmisión en el Gateway emparejado.
    5. El Gateway almacena el identificador de retransmisión y la concesión de envío, y luego los utiliza para `push.test`, avisos de activación y activaciones de reconexión.

    Notas operativas:

    - Si cambia la aplicación iOS a otro Gateway, vuelva a conectarla para que pueda publicar un nuevo registro de retransmisión vinculado a ese Gateway.
    - Si distribuye una nueva compilación de iOS que apunta a otra implementación de retransmisión, la aplicación actualiza su registro de retransmisión almacenado en caché en lugar de reutilizar el origen de retransmisión anterior.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como anulaciones temporales mediante variables de entorno.
    - Las URL de retransmisión personalizadas del Gateway deben coincidir con la URL base de retransmisión integrada en la compilación de iOS; el canal de publicación pública de App Store rechaza las anulaciones personalizadas de la URL de retransmisión de iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` continúa siendo una vía de escape de desarrollo limitada a la interfaz de bucle invertido; no conserve URL de retransmisión HTTP en la configuración.

    Consulte [Aplicación iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para conocer el flujo integral y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para conocer el modelo de seguridad de la retransmisión.

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
    - `directPolicy`: `allow` (predeterminado) o `block` para destinos de Heartbeat de tipo mensaje directo
    - Consulte [Heartbeat](/es/gateway/heartbeat) para acceder a la guía completa.

  </Accordion>

  <Accordion title="Configurar tareas Cron">
    ```json5
    {
      cron: {
        enabled: true,
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: elimina de las filas de sesión de SQLite las sesiones de ejecución aisladas completadas (valor predeterminado: `24h`; establezca `false` para desactivarlo).
    - El historial de ejecuciones conserva automáticamente las 2000 filas de terminal más recientes por tarea; las filas perdidas mantienen su periodo de limpieza de 24 horas.
    - Consulte [Tareas Cron](/es/automation/cron-jobs) para obtener una descripción general de la función y ejemplos de la CLI.

  </Accordion>

  <Accordion title="Configurar webhooks (hooks)">
    Active los puntos de conexión HTTP de Webhook en el Gateway:

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
    - Trate todo el contenido de las cargas útiles de hooks/webhooks como entradas que no son de confianza.
    - Utilice un `hooks.token` específico; no reutilice secretos de autenticación activos del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - La autenticación de hooks se realiza únicamente mediante encabezados (`Authorization: Bearer ...` o `x-openclaw-token`); se rechazan los tokens en cadenas de consulta.
    - `hooks.path` no puede ser `/`; mantenga la entrada de webhooks en una subruta específica, como `/hooks`.
    - Mantenga desactivadas las opciones para omitir las protecciones frente a contenido no seguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), salvo durante una depuración de ámbito estrictamente limitado.
    - Si activa `hooks.allowRequestSessionKey`, establezca también `hooks.allowedSessionKeyPrefixes` para limitar las claves de sesión seleccionadas por el llamador.
    - Para los agentes controlados mediante hooks, se recomienda usar niveles de modelos modernos y robustos, además de una política de herramientas estricta (por ejemplo, solo mensajería y aislamiento cuando sea posible).

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

    - **Archivo único**: reemplaza el objeto contenedor
    - **Matriz de archivos**: se fusionan en profundidad y en orden (los posteriores prevalecen), con hasta 10 niveles de anidamiento
    - **Claves hermanas**: se fusionan después de las inclusiones (anulan los valores incluidos)
    - **Rutas relativas**: se resuelven con respecto al archivo que realiza la inclusión
    - **Formato de ruta**: las rutas de inclusión no deben contener bytes nulos y deben tener estrictamente menos de 4096 caracteres antes y después de la resolución
    - **Escrituras propiedad de OpenClaw**: cuando una escritura modifica únicamente una sección de nivel superior
      respaldada por una inclusión de archivo único, como `plugins: { $include: "./plugins.json5" }`,
      OpenClaw actualiza ese archivo incluido y mantiene intacto `openclaw.json`
    - **Escritura directa no compatible**: las inclusiones raíz, las matrices de inclusiones y las inclusiones
      con anulaciones mediante claves hermanas generan un fallo seguro para las escrituras propiedad de OpenClaw, en lugar de
      aplanar la configuración
    - **Confinamiento**: las rutas `$include` deben resolverse dentro del directorio que contiene
      `openclaw.json`. Para compartir un árbol entre máquinas o usuarios, establezca
      `OPENCLAW_INCLUDE_ROOTS` en una lista de rutas (`:` en POSIX, `;` en Windows) de
      directorios adicionales a los que pueden hacer referencia las inclusiones. Los enlaces simbólicos se resuelven
      y se vuelven a comprobar, por lo que una ruta que léxicamente se encuentre en un directorio de configuración, pero cuyo
      destino real salga de todas las raíces permitidas, seguirá rechazándose.
    - **Gestión de errores**: errores claros para archivos ausentes, errores de análisis, inclusiones circulares, formatos de ruta no válidos y longitudes excesivas

  </Accordion>
</AccordionGroup>

## Recarga en caliente de la configuración

El Gateway supervisa `~/.openclaw/openclaw.json` y aplica los cambios automáticamente; la mayoría de los ajustes no requieren un reinicio manual.

Las modificaciones directas de archivos se consideran no confiables hasta que se validan. El supervisor espera
a que se estabilicen las escrituras temporales y los cambios de nombre del editor, lee el archivo final y rechaza
las modificaciones externas no válidas sin volver a escribir `openclaw.json`. Las escrituras de configuración
propiedad de OpenClaw utilizan la misma validación de esquema antes de escribir (consulte [Validación estricta](#strict-validation)
para conocer las reglas de sobrescritura y reversión que se aplican a cada escritura).

Si aparece `config reload skipped (invalid config)` o el inicio informa de `Invalid
config`, inspeccione la configuración, ejecute `openclaw config validate` y, a continuación, ejecute `openclaw
doctor --fix` para repararla. Consulte [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config)
para acceder a la lista de comprobación.

### Modos de recarga

| Modo                   | Comportamiento                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica al instante los cambios seguros sin reiniciar. Reinicia automáticamente cuando los cambios son críticos.           |
| **`hot`**              | Aplica sin reiniciar únicamente los cambios seguros. Registra una advertencia cuando es necesario reiniciar; el reinicio queda a su cargo. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, sea seguro o no.                                 |
| **`off`**              | Desactiva la supervisión de archivos. Los cambios surten efecto tras el siguiente reinicio manual.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica sin reiniciar y qué requiere un reinicio

La mayoría de los campos se aplican sin reiniciar y sin tiempo de inactividad; algunas secciones aplicadas de este modo reinician únicamente ese
subsistema (canal, cron, heartbeat o monitor de estado), en lugar de todo el Gateway. En el
modo `hybrid`, los cambios que requieren reiniciar el Gateway se gestionan automáticamente.

| Categoría            | Campos                                                                  | ¿Es necesario reiniciar el Gateway?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Canales            | `channels.*`, `web` (WhatsApp): todos los canales integrados y de plugins       | No (reinicia ese canal)   |
| Agente y modelos      | `agent`, `agents`, `models`, `routing`                                  | No                           |
| Automatización          | `hooks`, `cron`, `agent.heartbeat`                                      | No (reinicia ese subsistema) |
| Sesiones y mensajes | `session`, `messages`                                                   | No                           |
| Herramientas y contenido multimedia       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | No                           |
| Configuración de plugins       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | No (recarga el entorno de ejecución del plugin)  |
| Interfaz y otros           | `ui`, `logging`, `identity`, `bindings`                                 | No                           |
| Servidor del Gateway      | `gateway.*` (puerto, enlace, autenticación, tailscale, TLS, HTTP y envío)              | **Sí**                      |
| Infraestructura      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Sí**                      |

<Note>
`gateway.reload` y `gateway.remote` son excepciones en `gateway.*`: cambiarlos **no** provoca un reinicio. Cada plugin también puede sustituir esta tabla: un plugin cargado puede declarar sus propios prefijos de configuración que provocan un reinicio (por ejemplo, el plugin Canvas incluido reinicia el Gateway debido a `plugins.enabled`, `plugins.allow` y `plugins.deny`, no solo a su propio `plugins.entries.canvas`), por lo que el comportamiento real depende de los plugins activos.
</Note>

### Planificación de la recarga

Al editar un archivo fuente al que se hace referencia mediante `$include`, OpenClaw planifica
la recarga a partir de la disposición definida en el código fuente, no de la vista aplanada en memoria.
Esto mantiene predecibles las decisiones de recarga en caliente (aplicar sin reiniciar o reiniciar), incluso cuando una
sola sección de nivel superior se encuentra en su propio archivo incluido, como
`plugins: { $include: "./plugins.json5" }`. La planificación de la recarga falla de forma segura si la
disposición del código fuente es ambigua.

## RPC de configuración (actualizaciones mediante programación)

Para las herramientas que escriben la configuración mediante la API del Gateway, se recomienda este flujo:

- `config.schema.lookup` para inspeccionar un subárbol (nodo de esquema superficial y resúmenes
  de sus elementos secundarios)
- `config.get` para obtener la instantánea actual junto con `hash`
- `config.patch` para actualizaciones parciales (parche de combinación JSON: los objetos se combinan, `null`
  elimina y los arrays se sustituyen cuando se confirma explícitamente con `replacePaths` si
  se eliminarían entradas)
- `config.apply` solo cuando se pretende sustituir toda la configuración
- `update.run` para una actualización automática explícita seguida de un reinicio; incluya `continuationMessage` cuando la sesión posterior al reinicio deba ejecutar un turno adicional
- `update.status` para inspeccionar el indicador de reinicio de la actualización más reciente y verificar la versión en ejecución después de un reinicio

Los agentes deben tratar `config.schema.lookup` como el primer punto de consulta para obtener
documentación y restricciones exactas de cada campo. Use la [referencia de configuración](/es/gateway/configuration-reference)
cuando necesite el mapa general de la configuración, los valores predeterminados o enlaces a referencias específicas
de los subsistemas.

<Note>
Las escrituras del plano de control (`config.apply`, `config.patch`, `update.run`) tienen
un límite de 30 solicitudes por cada 60 segundos, por método y por
`deviceId+clientIp`; consulte [Limitación de velocidad](/es/gateway/security/rate-limiting). Las solicitudes de reinicio
se agrupan y, posteriormente, imponen un intervalo de espera de 30 segundos entre ciclos de reinicio.
`update.status` es de solo lectura, pero está restringido a administradores porque el indicador de reinicio puede
incluir resúmenes de los pasos de actualización y los fragmentos finales de la salida de los comandos.
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

`config.patch` también acepta `replacePaths`, un array de rutas de configuración cuya sustitución
se realiza deliberadamente. Si un parche sustituye o elimina un array existente
por otro con menos entradas, el Gateway rechaza la escritura a menos que esa ruta exacta aparezca
en `replacePaths`; los arrays anidados dentro de las entradas de otro array usan `[]`, como
`agents.entries.*.skills`. Esto evita que las instantáneas truncadas de `config.get`
sobrescriban silenciosamente los arrays de enrutamiento o listas de elementos permitidos. Use `config.apply` cuando
se pretenda sustituir toda la configuración.

## Variables de entorno

OpenClaw lee las variables de entorno del proceso principal, además de:

- `.env` del directorio de trabajo actual (si está presente)
- `~/.openclaw/.env` (alternativa global)

Ninguno de los archivos sustituye las variables de entorno existentes. También es posible definir variables de entorno en línea en la configuración:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importación del entorno del shell (opcional)">
  Si se habilita y no están definidas las claves esperadas, OpenClaw ejecuta el shell de inicio de sesión e importa únicamente las claves que faltan:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Variable de entorno equivalente: `OPENCLAW_LOAD_SHELL_ENV=1`. Valor predeterminado de `timeoutMs`: `15000`.
</Accordion>

<Accordion title="Sustitución de variables de entorno en los valores de configuración">
  Haga referencia a variables de entorno en cualquier valor de cadena de la configuración mediante `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo se admiten nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`
- Las variables ausentes o vacías generan un error durante la carga
- Use la secuencia de escape `$${VAR}` para obtener una salida literal
- Funciona dentro de los archivos `$include`
- Sustitución en línea: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencias de secretos (entorno, archivo y ejecución)">
  Para los campos que admiten objetos SecretRef, puede usar:

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
      serviceAccount: {
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

Consulte [Entorno](/es/help/environment) para conocer todas las reglas de precedencia y las fuentes.

## Referencia completa

Para consultar la referencia completa campo por campo, consulte la **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_

## Contenido relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Manual operativo del Gateway](/es/gateway)
