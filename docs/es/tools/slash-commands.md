---
read_when:
    - Usar o configurar comandos de chat
    - Depuración del enrutamiento de comandos o permisos
    - Entender cómo se registran los comandos de Skills
sidebarTitle: Slash commands
summary: 'Todos los comandos de barra, directivas y atajos en línea disponibles: configuración, enrutamiento y comportamiento por superficie.'
title: Comandos de barra
x-i18n:
    generated_at: "2026-07-06T10:55:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 297d7503c7c8f140279733a8417b1a9d4fd239b5bf7d9944312907d0f2119ba1
    source_path: tools/slash-commands.md
    workflow: 16
---

El Gateway gestiona comandos enviados como mensajes independientes que empiezan por `/`.
Los comandos bash solo de host usan `! <cmd>` (con `/bash <cmd>` como alias).

Cuando una conversación está vinculada a una sesión ACP, el texto normal se enruta al
arnés de ACP. Los comandos de gestión del Gateway permanecen locales: `/acp ...` siempre llega
al manejador de comandos de OpenClaw, y `/status` junto con `/unfocus` permanecen locales siempre que
el manejo de comandos esté habilitado para la superficie.

## Tres tipos de comandos

<CardGroup cols={3}>
  <Card title="Comandos" icon="terminal">
    Mensajes `/...` independientes gestionados por el Gateway. Deben enviarse como el
    único contenido del mensaje.
  </Card>
  <Card title="Directivas" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — se eliminan del mensaje antes de que el modelo
    los vea. Conservan la configuración de la sesión cuando se envían solos; actúan como sugerencias en línea
    cuando se envían con otro texto.
  </Card>
  <Card title="Atajos en línea" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — se ejecutan de inmediato y se
    eliminan antes de que el modelo vea el texto restante. Solo remitentes autorizados.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detalles del comportamiento de las directivas">
    - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
    - En mensajes **solo de directivas** (el mensaje contiene únicamente directivas), se
      conservan en la sesión y responden con una confirmación.
    - En mensajes de **chat normal** con otro texto, actúan como sugerencias en línea y
      **no** conservan la configuración de la sesión.
    - Las directivas solo se aplican a **remitentes autorizados**. Si `commands.allowFrom`
      está definido, es la única lista de permitidos utilizada; de lo contrario, la autorización proviene de
      las listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`. Los remitentes no autorizados
      ven las directivas tratadas como texto sin formato.
  </Accordion>
</AccordionGroup>

## Configuración

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Habilita el análisis de `/...` en mensajes de chat. En superficies sin comandos nativos
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), los comandos de texto
  funcionan incluso cuando se define como `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Automático: activado para Discord/Telegram; desactivado para Slack;
  se ignora para proveedores sin soporte nativo. Sobrescríbelo por canal con
  `channels.<provider>.commands.native`. En Discord, `false` omite el registro de comandos de barra;
  los comandos registrados anteriormente pueden seguir visibles hasta que se eliminen.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de Skills de forma nativa cuando se admite. Automático: activado para
  Discord/Telegram; desactivado para Slack. Sobrescríbelo con
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para ejecutar comandos de shell del host (alias `/bash <cmd>`). Requiere
  listas de permitidos de `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Cuánto tiempo espera bash antes de cambiar al modo en segundo plano (`0` lo pone en segundo plano
  inmediatamente).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lee/escribe `openclaw.json`). Solo propietarios.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lee/escribe la configuración MCP gestionada por OpenClaw en `mcp.servers`). Solo propietarios.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descubrimiento/estado de plugins más instalación y activación/desactivación). Solo propietarios para escrituras.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (sobrescrituras de configuración solo en tiempo de ejecución). Solo propietarios.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` y las acciones de herramientas de reinicio del gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Lista explícita de permitidos de propietarios para superficies de comandos solo para propietarios. Separada de
  `commands.allowFrom` y del acceso por emparejamiento de DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: requiere identidad de propietario para comandos solo para propietarios. Cuando es `true`,
  el remitente debe coincidir con `commands.ownerAllowFrom` o tener el alcance interno `operator.admin`.
  Una entrada comodín de `allowFrom` **no** es suficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla cómo aparecen los identificadores de propietario en el prompt del sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Secreto HMAC usado cuando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista de permitidos por proveedor para la autorización de comandos. Cuando se configura, es la
  **única** fuente de autorización para comandos y directivas. Usa `"*"` para un
  valor predeterminado global; las claves específicas de proveedor lo sobrescriben.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está definido.
</ParamField>

## Lista de comandos

Los comandos provienen de tres fuentes:

- **Integrados del núcleo:** `src/auto-reply/commands-registry.shared.ts`
- **Comandos de dock generados:** `src/auto-reply/commands-registry.data.ts`
- **Comandos de Plugin:** llamadas `registerCommand()` de plugin

La disponibilidad depende de las banderas de configuración, la superficie del canal y los
plugins instalados/habilitados.

### Comandos del núcleo

<AccordionGroup>
  <Accordion title="Sesiones y ejecuciones">
    | Comando | Descripción |
    | --- | --- |
    | `/new [model]` | Archiva la sesión actual e inicia una nueva |
    | `/reset [soft [message]]` | Restablece la sesión actual en el mismo lugar. `soft` conserva la transcripción, elimina los identificadores de sesión del backend de CLI reutilizados y vuelve a ejecutar el inicio |
    | `/name <title>` | Asigna o cambia el nombre de la sesión actual. Omite el título para ver el nombre actual y una sugerencia |
    | `/compact [instructions]` | Compacta el contexto de la sesión. Consulta [Compaction](/es/concepts/compaction) |
    | `/stop` | Cancela la ejecución actual |
    | `/session idle <duration\|off>` | Gestiona la expiración por inactividad de la vinculación de hilos |
    | `/session max-age <duration\|off>` | Gestiona la expiración por edad máxima de la vinculación de hilos |
    | `/export-session [path]` | Exporta la sesión actual a HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporta un paquete de trayectoria JSONL para la sesión actual. Alias: `/trajectory` |

    <Note>
      La interfaz de control intercepta `/new` escrito para crear y cambiar a una nueva
      sesión de panel, excepto cuando `session.dmScope: "main"` está configurado
      y el padre actual es la sesión principal del agente; en ese caso `/new`
      restablece la sesión principal en el mismo lugar. `/reset` escrito sigue ejecutando el
      restablecimiento en el mismo lugar del Gateway. Usa `/model default` cuando quieras borrar una
      selección de modelo de sesión fijada.
    </Note>

  </Accordion>

  <Accordion title="Modelo y controles de ejecución">
    | Comando | Descripción |
    | --- | --- |
    | `/think <level\|default>` | Define el nivel de pensamiento o borra la sobrescritura de la sesión. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Activa o desactiva la salida detallada. Alias: `/v` |
    | `/trace on\|off` | Activa o desactiva la salida de trazas de plugins para la sesión actual |
    | `/fast [status\|auto\|on\|off\|default]` | Muestra, define o borra el modo rápido |
    | `/reasoning [on\|off\|stream]` | Activa o desactiva la visibilidad del razonamiento. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Activa o desactiva el modo elevado. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Muestra o define los valores predeterminados de exec |
    | `/login [codex\|openai\|openai-codex]` | Empareja el inicio de sesión de Codex/OpenAI desde un chat privado o una sesión de interfaz web. Solo propietario/administrador |
    | `/model [name\|#\|status]` | Muestra o define el modelo |
    | `/models [provider] [page] [limit=<n>\|all]` | Lista proveedores o modelos configurados/con autenticación disponible |
    | `/queue <mode>` | Gestiona el comportamiento de la cola de ejecuciones activas. Consulta [Cola](/es/concepts/queue) y [Dirección de cola](/es/concepts/queue-steering) |
    | `/steer <message>` | Inyecta orientación en la ejecución activa. Alias: `/tell`. Consulta [Dirigir](/es/tools/steer) |

    <AccordionGroup>
      <Accordion title="Seguridad de verbose / trace / fast / reasoning">
        - `/verbose` es para depuración; mantenlo **desactivado** durante el uso normal.
        - `/trace` revela solo líneas de traza/depuración propiedad del plugin; el ruido detallado normal permanece desactivado.
        - `/fast auto|on|off` conserva una sobrescritura de sesión; usa la opción `inherit` de la interfaz de sesiones para borrarla.
        - `/fast` es específico del proveedor: OpenAI/Codex lo asigna a `service_tier=priority`; las solicitudes directas a Anthropic lo asignan a `service_tier=auto` o `standard_only`.
        - `/reasoning`, `/verbose` y `/trace` son riesgosos en entornos grupales; pueden revelar razonamiento interno o diagnósticos de plugins. Mantenlos desactivados en chats grupales.

      </Accordion>
      <Accordion title="Detalles del cambio de modelo">
        - `/model` conserva el nuevo modelo inmediatamente en la sesión.
        - Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
        - Si hay una ejecución activa, el cambio queda marcado como pendiente y se aplica en el siguiente punto de reintento limpio.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Descubrimiento y estado">
    | Comando | Descripción |
    | --- | --- |
    | `/help` | Muestra el resumen breve de ayuda |
    | `/commands` | Muestra el catálogo de comandos generado |
    | `/tools [compact\|verbose]` | Muestra lo que el agente actual puede usar ahora mismo |
    | `/status` | Muestra el estado de ejecución/runtime, el tiempo activo del Gateway y del sistema, la salud de plugins, además del uso/cuota del proveedor |
    | `/status plugins` | Muestra salud detallada de plugins: errores de carga, cuarentenas, fallos de plugins de canal, problemas de dependencias, avisos de compatibilidad. Requiere `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gestiona el [objetivo](/es/tools/goal) durable de la sesión actual |
    | `/diagnostics [note]` | Flujo de informe de soporte solo para propietario. Pide aprobación de exec cada vez |
    | `/crestodian <request>` | Ejecuta el asistente de configuración y reparación Crestodian desde un mensaje directo del propietario |
    | `/tasks` | Lista tareas en segundo plano activas/recientes para la sesión actual |
    | `/context [list\|detail\|map\|json]` | Explica cómo se ensambla el contexto |
    | `/whoami` | Muestra tu identificador de remitente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controla el pie de uso por respuesta (`reset`/`inherit`/`clear`/`default` borra la sobrescritura de sesión para volver a heredar el valor predeterminado configurado) o imprime un resumen local de coste |
  </Accordion>

  <Accordion title="Skills, listas de permitidos, aprobaciones">
    | Comando | Descripción |
    | --- | --- |
    | `/skill <name> [input]` | Ejecuta una skill por nombre |
    | `/learn [request]` | Redacta una skill revisable a partir de la conversación actual o fuentes nombradas mediante [Skill Workshop](/es/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gestiona entradas de la lista de permitidos. Solo texto |
    | `/approve <id> <decision>` | Resuelve prompts de aprobación de exec o plugins |
    | `/btw <question>` | Haz una pregunta secundaria sin cambiar el contexto de la sesión. Alias: `/side`. Consulta [BTW](/es/tools/btw) |
  </Accordion>

  <Accordion title="Subagentes y ACP">
    | Comando | Descripción |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecciona ejecuciones de subagentes para la sesión actual |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gestiona sesiones ACP y opciones de runtime. Los controles de runtime requieren propietario externo o identidad de administrador interno de Gateway |
    | `/focus <target>` | Vincula el hilo actual de Discord o el tema de Telegram a un destino de sesión |
    | `/unfocus` | Elimina la vinculación del hilo actual |
    | `/agents` | Lista los agentes vinculados al hilo para la sesión actual |
  </Accordion>

  <Accordion title="Escrituras solo para propietarios y administración">
    | Comando | Requiere | Descripción |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lee o escribe `openclaw.json`. Solo propietarios |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lee o escribe la configuración de servidor MCP gestionada por OpenClaw. Solo propietarios |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecciona o modifica el estado de plugins. Solo propietarios para escrituras. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Sobrescrituras de configuración solo en runtime. Solo propietarios |
    | `/restart` | `commands.restart: true` (predeterminado) | Reinicia OpenClaw |
    | `/send on\|off\|inherit` | propietario | Define la política de envío |
  </Accordion>

  <Accordion title="Voz, TTS, control de canal">
    | Comando | Descripción |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controla TTS. Consulta [TTS](/es/tools/tts) |
    | `/activation mention\|always` | Define el modo de activación de grupo |
    | `/bash <command>` | Ejecuta un comando de shell del host. Alias: `! <command>`. Requiere `commands.bash: true` |
    | `!poll [sessionId]` | Comprueba un trabajo de bash en segundo plano |
    | `!stop [sessionId]` | Detiene un trabajo de bash en segundo plano |
  </Accordion>
</AccordionGroup>

### Comandos de Dock

Los comandos de Dock cambian la ruta de respuesta de la sesión activa a otro canal vinculado.
Consulta [Acoplamiento de canales](/es/concepts/channel-docking) para configuración y resolución de problemas.

Generado a partir de plugins de canal con compatibilidad con comandos nativos:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Los comandos de Dock requieren `session.identityLinks`. El remitente de origen y el par de destino
deben estar en el mismo grupo de identidad.

### Comandos de plugins incluidos

| Comando                                                 | Descripción                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Activa o desactiva memory dreaming (propietario o administrador de Gateway). Consulta [Dreaming](/es/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gestiona el emparejamiento de dispositivos. Consulta [Emparejamiento](/es/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Arma temporalmente comandos de nodo telefónico de alto riesgo                                                                                                                                                  |
| `/voice status\|list\|set <voiceId>`                    | Gestiona la configuración de voz de Talk. Nombre nativo en Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Vincula, dirige e inspecciona el arnés de servidor de aplicación de Codex (estado, hilos, reanudar, modelo, rápido, permisos, compactar, revisión, mcp, Skills y más). Consulta [Arnés de Codex](/es/plugins/codex-harness) |

Solo QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandos de Skill

Las Skills invocables por el usuario se exponen como comandos de barra diagonal:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- Skills pueden registrarse como comandos directos (por ejemplo, `/prose` para OpenProse).
- El registro de comandos nativos de Skills se controla mediante `commands.nativeSkills` y
  `channels.<provider>.commands.nativeSkills`.
- Los nombres se saneen a `a-z0-9_` (máximo 32 caracteres); las colisiones reciben sufijos numéricos.

<AccordionGroup>
  <Accordion title="Despacho de comandos de Skill">
    De forma predeterminada, los comandos de Skill se enrutan al modelo como una solicitud normal.

    Skills pueden declarar `command-dispatch: tool` para enrutar directamente a una herramienta
    (determinista, sin intervención del modelo). Ejemplo: `/prose` (Plugin OpenProse)
    — consulta [OpenProse](/es/prose).

  </Accordion>
  <Accordion title="Argumentos de comandos nativos">
    Discord usa autocompletado para opciones dinámicas y menús de botones cuando se omiten
    los argumentos requeridos. Telegram y Slack muestran un menú de botones para comandos con
    opciones. Las opciones dinámicas se resuelven frente al modelo de la sesión de destino, por lo que las opciones
    específicas del modelo, como los niveles de `/think`, siguen la sobrescritura `/model` de la sesión.
  </Accordion>
</AccordionGroup>

## `/tools`: lo que el agente puede usar ahora

`/tools` responde a una pregunta de runtime: **qué puede usar este agente ahora mismo en esta
conversación** — no un catálogo de configuración estático.

```text
/tools         # vista compacta
/tools verbose # con descripciones breves
```

Los resultados están limitados a la sesión. Cambiar el agente, canal, hilo, autorización
del remitente o modelo puede cambiar la salida. Para editar perfiles y sobrescrituras,
usa el panel de Tools de la interfaz de Control o las superficies de configuración.

## `/model`: selección de modelo

```text
/model             # mostrar selector de modelos
/model list        # igual
/model 3           # seleccionar por número desde el selector
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # borrar la selección de modelo de la sesión
/model status      # vista detallada con endpoint y modo de API
```

En Discord, `/model` y `/models` abren un selector interactivo con proveedor y
menús desplegables de modelo. El selector respeta `agents.defaults.models`, incluidas
las entradas `provider/*`.

## `/config`: escrituras de configuración en disco

<Note>
  Solo propietarios. Deshabilitado de forma predeterminada — habilítalo con `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configuración se valida antes de escribir. Los cambios no válidos se rechazan. `/config`
persiste las actualizaciones entre reinicios.

## `/mcp`: configuración de servidor MCP

<Note>
  Solo propietarios. Deshabilitado de forma predeterminada — habilítalo con `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` almacena la configuración en la configuración de OpenClaw, no en ajustes de proyecto de agente embebido.

## `/debug`: sobrescrituras solo en runtime

<Note>
  Solo propietarios. Deshabilitado de forma predeterminada — habilítalo con `commands.debug: true`.
  Las sobrescrituras se aplican inmediatamente a nuevas lecturas de configuración, pero **no** escriben en disco.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: gestión de plugins

<Note>
  Solo propietarios para escrituras. Deshabilitado de forma predeterminada — habilítalo con `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` actualiza la configuración de plugins y recarga en caliente el runtime de plugins de Gateway
para nuevos turnos de agente. `/plugins install` reinicia automáticamente los Gateways gestionados
porque cambiaron los módulos de origen del plugin.

## `/trace`: salida de trazas de plugins

```text
/trace          # mostrar el estado actual de las trazas
/trace on
/trace off
```

`/trace` revela líneas de traza/depuración de plugins limitadas a la sesión sin el modo detallado
completo. No reemplaza a `/debug` (sobrescrituras de runtime) ni a `/verbose` (salida normal
de herramientas).

## `/btw`: preguntas secundarias

`/btw` es una pregunta secundaria rápida sobre el contexto de la sesión actual. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

A diferencia de un mensaje normal:

- Usa la sesión actual como contexto de fondo.
- En sesiones del arnés de Codex, se ejecuta como un hilo secundario efímero de Codex.
- **No** cambia el contexto futuro de la sesión.
- No se escribe en el historial de la transcripción.

Consulta [Preguntas secundarias BTW](/es/tools/btw) para ver el comportamiento completo.

## Notas de superficie

<AccordionGroup>
  <Accordion title="Alcance de sesión por superficie">
    - **Comandos de texto:** se ejecutan en la sesión de chat normal (los DM comparten `main`, los grupos tienen su propia sesión).
    - **Comandos nativos de Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandos nativos de Slack:** `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
    - **Comandos nativos de Telegram:** `telegram:slash:<userId>` (dirigen a la sesión de chat mediante `CommandTargetSessionKey`)
    - **`/login codex`** envía códigos de emparejamiento de dispositivos solo a través de chat privado o rutas de respuesta de la Web UI. Las invocaciones en grupos/temas de Telegram piden al propietario que envíe un DM al bot en su lugar.
    - **`/stop`** apunta a la sesión de chat activa para abortar la ejecución actual.

  </Accordion>
  <Accordion title="Detalles específicos de Slack">
    `channels.slack.slashCommand` admite un único comando de estilo `/openclaw`.
    Con `commands.native: true`, crea un comando de barra diagonal de Slack por cada
    comando integrado. Registra `/agentstatus` (no `/status`) porque Slack reserva
    `/status`. El texto `/status` sigue funcionando en mensajes de Slack.
  </Accordion>
  <Accordion title="Ruta rápida y accesos directos en línea">
    - Los mensajes solo de comandos de remitentes permitidos se gestionan de inmediato (omiten cola + modelo).
    - Los accesos directos en línea (`/help`, `/commands`, `/status`, `/whoami`) también funcionan incrustados en mensajes normales y se eliminan antes de que el modelo vea el texto restante.
    - Los mensajes solo de comandos no autorizados se ignoran silenciosamente; los tokens `/...` en línea se tratan como texto plano.

  </Accordion>
  <Accordion title="Notas de argumentos">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (`/think: high`, `/send: on`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
    - `/allowlist add|remove` requiere `commands.config: true` y respeta `configWrites` del canal.

  </Accordion>
</AccordionGroup>

## Uso y estado del proveedor

- **Uso/cuota del proveedor** (por ejemplo, "Claude 80% left") se muestra en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado.
- **Líneas de tokens/caché** en `/status` pueden recurrir a la entrada de uso de transcripción más reciente cuando la instantánea de sesión en vivo es escasa.
- **Ejecución vs runtime:** `/status` informa `Execution` para la ruta efectiva del sandbox y `Runtime` para quién ejecuta la sesión: `OpenClaw Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP.
- **Tokens/costo por respuesta:** controlado por `/usage off|tokens|full`.
- `/model status` trata sobre modelos/autenticación/endpoints, no sobre uso.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/es/tools/skills" icon="puzzle-piece">
    Cómo se registran y controlan los comandos slash de Skills.
  </Card>
  <Card title="Crear Skills" href="/es/tools/creating-skills" icon="hammer">
    Crea una skill que registre su propio comando slash.
  </Card>
  <Card title="BTW" href="/es/tools/btw" icon="comments">
    Preguntas secundarias sin cambiar el contexto de la sesión.
  </Card>
  <Card title="Steer" href="/es/tools/steer" icon="compass">
    Guía al agente durante la ejecución con `/steer`.
  </Card>
</CardGroup>
