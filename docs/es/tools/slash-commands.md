---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o permisos
    - Comprender cómo se registran los comandos de Skills
sidebarTitle: Slash commands
summary: 'Todos los comandos de barra diagonal, directivas y atajos en línea disponibles: configuración, enrutamiento y comportamiento por superficie.'
title: Comandos de barra diagonal
x-i18n:
    generated_at: "2026-06-27T13:09:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

El Gateway maneja comandos enviados como mensajes independientes que empiezan con `/`.
Los comandos bash solo del host usan `! <cmd>` (con `/bash <cmd>` como alias).

Cuando una conversación está vinculada a una sesión ACP, el texto normal se enruta al
arnés ACP. Los comandos de gestión del Gateway permanecen locales: `/acp ...` siempre llega
al manejador de comandos de OpenClaw, y `/status` más `/unfocus` permanecen locales siempre que
el manejo de comandos esté habilitado para la superficie.

## Tres tipos de comandos

<CardGroup cols={3}>
  <Card title="Comandos" icon="terminal">
    Mensajes independientes `/...` manejados por el Gateway. Deben enviarse como el
    único contenido del mensaje.
  </Card>
  <Card title="Directivas" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue`: se eliminan del mensaje antes de que el modelo
    lo vea. Conservan la configuración de sesión cuando se envían solas; actúan como indicaciones en línea
    cuando se envían con otro texto.
  </Card>
  <Card title="Atajos en línea" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami`: se ejecutan inmediatamente y se
    eliminan antes de que el modelo vea el texto restante. Solo remitentes autorizados.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detalles del comportamiento de las directivas">
    - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
    - En mensajes **solo de directivas** (el mensaje contiene únicamente directivas), estas
      se conservan en la sesión y responden con una confirmación.
    - En mensajes de **chat normal** con otro texto, actúan como indicaciones en línea y
      **no** conservan la configuración de sesión.
    - Las directivas solo se aplican a **remitentes autorizados**. Si `commands.allowFrom`
      está configurado, es la única lista de permitidos usada; de lo contrario, la autorización proviene de
      listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`. Los remitentes no autorizados
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
  funcionan incluso cuando se configura en `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Auto: activado para Discord/Telegram; desactivado para Slack;
  ignorado para proveedores sin soporte nativo. Sobrescribe por canal con
  `channels.<provider>.commands.native`. En Discord, `false` omite el registro de comandos de barra;
  los comandos registrados previamente pueden permanecer visibles hasta que se eliminen.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de skill de forma nativa cuando hay soporte. Auto: activado para
  Discord/Telegram; desactivado para Slack. Sobrescribe con
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para ejecutar comandos de shell del host (alias `/bash <cmd>`). Requiere
  listas de permitidos `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Cuánto tiempo espera bash antes de cambiar al modo en segundo plano (`0` lo envía a segundo plano
  inmediatamente).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lee/escribe `openclaw.json`). Solo propietario.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lee/escribe la configuración MCP gestionada por OpenClaw bajo `mcp.servers`). Solo propietario.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descubrimiento/estado de plugins más instalación y activación/desactivación). Solo propietario para escrituras.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (sobrescrituras de configuración solo en tiempo de ejecución). Solo propietario.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` y acciones de herramienta de reinicio del gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Lista explícita de permitidos del propietario para superficies de comandos solo del propietario. Separada de
  `commands.allowFrom` y del acceso de emparejamiento por DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: requiere identidad de propietario para comandos solo del propietario. Cuando es `true`,
  el remitente debe coincidir con `commands.ownerAllowFrom` o tener el alcance interno `operator.admin`.
  Una entrada comodín `allowFrom` **no** es suficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla cómo aparecen los ids de propietario en el prompt del sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Secreto HMAC usado cuando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista de permitidos por proveedor para la autorización de comandos. Cuando está configurada, es la
  **única** fuente de autorización para comandos y directivas. Usa `"*"` para un
  valor predeterminado global; las claves específicas del proveedor lo sobrescriben.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está configurado.
</ParamField>

## Lista de comandos

Los comandos provienen de tres fuentes:

- **Integrados principales:** `src/auto-reply/commands-registry.shared.ts`
- **Comandos de dock generados:** `src/auto-reply/commands-registry.data.ts`
- **Comandos de Plugin:** llamadas `registerCommand()` del plugin

La disponibilidad depende de las marcas de configuración, la superficie del canal y los
plugins instalados/habilitados.

### Comandos principales

<AccordionGroup>
  <Accordion title="Sesiones y ejecuciones">
    | Comando | Descripción |
    | --- | --- |
    | `/new [model]` | Archiva la sesión actual e inicia una nueva |
    | `/reset [soft [message]]` | Restablece la sesión actual en su lugar. `soft` conserva la transcripción, descarta ids de sesión reutilizados del backend CLI y vuelve a ejecutar el inicio |
    | `/name <title>` | Nombra o renombra la sesión actual. Omite el título para ver el nombre actual y una sugerencia |
    | `/compact [instructions]` | Compacta el contexto de la sesión. Consulta [Compaction](/es/concepts/compaction) |
    | `/stop` | Aborta la ejecución actual |
    | `/session idle <duration\|off>` | Gestiona la caducidad por inactividad de la vinculación de hilo |
    | `/session max-age <duration\|off>` | Gestiona la caducidad por edad máxima de la vinculación de hilo |
    | `/export-session [path]` | Exporta la sesión actual a HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporta un paquete de trayectoria JSONL para la sesión actual. Alias: `/trajectory` |

    <Note>
      Control UI intercepta `/new` escrito para crear y cambiar a una nueva
      sesión del panel, excepto cuando `session.dmScope: "main"` está configurado
      y el padre actual es la sesión principal del agente; en ese caso `/new`
      restablece la sesión principal en su lugar. `/reset` escrito aún ejecuta el
      restablecimiento en su lugar del Gateway. Usa `/model default` cuando quieras borrar una
      selección de modelo de sesión fijada.
    </Note>

  </Accordion>

  <Accordion title="Modelo y controles de ejecución">
    | Comando | Descripción |
    | --- | --- |
    | `/think <level\|default>` | Establece el nivel de pensamiento o borra la sobrescritura de sesión. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Activa o desactiva la salida detallada. Alias: `/v` |
    | `/trace on\|off` | Activa o desactiva la salida de traza de plugins para la sesión actual |
    | `/fast [status\|auto\|on\|off\|default]` | Muestra, establece o borra el modo rápido |
    | `/reasoning [on\|off\|stream]` | Activa o desactiva la visibilidad del razonamiento. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Activa o desactiva el modo elevado. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Muestra o establece los valores predeterminados de exec |
    | `/model [name\|#\|status]` | Muestra o establece el modelo |
    | `/models [provider] [page] [limit=<n>\|all]` | Lista proveedores o modelos configurados/con autenticación disponible |
    | `/queue <mode>` | Gestiona el comportamiento de la cola de ejecuciones activas. Consulta [Queue](/es/concepts/queue) y [Queue steering](/es/concepts/queue-steering) |
    | `/steer <message>` | Inyecta orientación en la ejecución activa. Alias: `/tell`. Consulta [Steer](/es/tools/steer) |

    <AccordionGroup>
      <Accordion title="seguridad de verbose / trace / fast / reasoning">
        - `/verbose` es para depuración: mantenlo **desactivado** en el uso normal.
        - `/trace` revela solo líneas de traza/depuración propiedad del plugin; la charla detallada normal permanece desactivada.
        - `/fast auto|on|off` conserva una sobrescritura de sesión; usa la opción `inherit` de la interfaz de sesiones para borrarla.
        - `/fast` es específico del proveedor: OpenAI/Codex lo asignan a `service_tier=priority`; las solicitudes directas a Anthropic lo asignan a `service_tier=auto` o `standard_only`.
        - `/reasoning`, `/verbose` y `/trace` son riesgosos en entornos grupales: pueden revelar razonamiento interno o diagnósticos de plugins. Mantenlos desactivados en chats grupales.

      </Accordion>
      <Accordion title="Detalles del cambio de modelo">
        - `/model` conserva el nuevo modelo inmediatamente en la sesión.
        - Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
        - Si hay una ejecución activa, el cambio se marca como pendiente y se aplica en el siguiente punto de reintento limpio.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Descubrimiento y estado">
    | Comando | Descripción |
    | --- | --- |
    | `/help` | Muestra el resumen breve de ayuda |
    | `/commands` | Muestra el catálogo de comandos generado |
    | `/tools [compact\|verbose]` | Muestra lo que el agente actual puede usar ahora mismo |
    | `/status` | Muestra el estado de ejecución/tiempo de ejecución, el tiempo de actividad del Gateway y del sistema, la salud de plugins, más el uso/cuota del proveedor |
    | `/status plugins` | Muestra la salud detallada de plugins: errores de carga, cuarentenas, fallos de canal, problemas de dependencias, avisos de compatibilidad |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Gestiona el [objetivo](/es/tools/goal) duradero de la sesión actual |
    | `/diagnostics [note]` | Flujo de informe de soporte solo para propietario. Solicita aprobación de exec cada vez |
    | `/crestodian <request>` | Ejecuta el asistente de configuración y reparación de Crestodian desde un DM del propietario |
    | `/tasks` | Lista tareas en segundo plano activas/recientes para la sesión actual |
    | `/context [list\|detail\|map\|json]` | Explica cómo se ensambla el contexto |
    | `/whoami` | Muestra tu id de remitente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controla el pie de uso por respuesta (`reset`/`inherit`/`clear`/`default` borra la sobrescritura de sesión para volver a heredar el valor predeterminado configurado) o imprime un resumen local de costos |
  </Accordion>

  <Accordion title="Skills, listas de permitidos, aprobaciones">
    | Comando | Descripción |
    | --- | --- |
    | `/skill <name> [input]` | Ejecuta una skill por nombre |
    | `/allowlist [list\|add\|remove] ...` | Gestiona entradas de lista de permitidos. Solo texto |
    | `/approve <id> <decision>` | Resuelve solicitudes de aprobación de exec o plugin |
    | `/btw <question>` | Haz una pregunta lateral sin cambiar el contexto de la sesión. Alias: `/side`. Consulta [BTW](/es/tools/btw) |
  </Accordion>

  <Accordion title="Subagentes y ACP">
    | Comando | Descripción |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecciona ejecuciones de subagentes de la sesión actual |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gestiona sesiones ACP y opciones de runtime |
    | `/focus <target>` | Vincula el hilo actual de Discord o el tema de Telegram a un destino de sesión |
    | `/unfocus` | Elimina la vinculación del hilo actual |
    | `/agents` | Lista los agentes vinculados al hilo para la sesión actual |
  </Accordion>

  <Accordion title="Escrituras solo para propietario y administración">
    | Comando | Requiere | Descripción |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lee o escribe `openclaw.json`. Solo propietario |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lee o escribe la configuración del servidor MCP gestionada por OpenClaw. Solo propietario |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecciona o modifica el estado de plugins. Solo propietario para escrituras. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Sobrescrituras de configuración solo de runtime. Solo propietario |
    | `/restart` | `commands.restart: true` (predeterminado) | Reinicia OpenClaw |
    | `/send on\|off\|inherit` | owner | Define la política de envío |
  </Accordion>

  <Accordion title="Voz, TTS y control de canal">
    | Comando | Descripción |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controla TTS. Consulta [TTS](/es/tools/tts) |
    | `/activation mention\|always` | Define el modo de activación de grupo |
    | `/bash <command>` | Ejecuta un comando de shell del host. Alias: `! <command>`. Requiere `commands.bash: true` |
    | `!poll [sessionId]` | Comprueba un trabajo bash en segundo plano |
    | `!stop [sessionId]` | Detiene un trabajo bash en segundo plano |
  </Accordion>
</AccordionGroup>

### Comandos dock

Los comandos dock cambian la ruta de respuesta de la sesión activa a otro canal vinculado.
Consulta [Channel docking](/es/concepts/channel-docking) para la configuración y la solución de problemas.

Generado desde plugins de canal con compatibilidad con comandos nativos:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Los comandos dock requieren `session.identityLinks`. El remitente de origen y el par de destino
deben estar en el mismo grupo de identidad.

### Comandos de plugins incluidos

| Comando                                                                                      | Descripción                                                                       |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Activa o desactiva Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming)   |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Gestiona el emparejamiento de dispositivos. Consulta [Emparejamiento](/es/channels/pairing) |
| `/phone status\|arm ...\|disarm`                                                             | Activa temporalmente comandos de nodo telefónico de alto riesgo                    |
| `/voice status\|list\|set <voiceId>`                                                         | Gestiona la configuración de voz de Talk. Nombre nativo de Discord: `/talkvoice`  |
| `/card ...`                                                                                  | Envía presets de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line)   |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Controla el harness del servidor de aplicaciones de Codex. Consulta [Harness de Codex](/es/plugins/codex-harness) |

Solo QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandos de Skills

Las Skills invocables por el usuario se exponen como comandos de barra:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- Skills pueden registrarse como comandos directos (por ejemplo, `/prose` para OpenProse).
- El registro de comandos nativos de Skills se controla mediante `commands.nativeSkills` y
  `channels.<provider>.commands.nativeSkills`.
- Los nombres se normalizan a `a-z0-9_` (máx. 32 caracteres); las colisiones reciben sufijos numéricos.

<AccordionGroup>
  <Accordion title="Despacho de comandos de Skills">
    De forma predeterminada, los comandos de Skills se enrutan al modelo como una solicitud normal.

    Skills puede declarar `command-dispatch: tool` para enrutar directamente a una herramienta
    (determinista, sin intervención del modelo). Ejemplo: `/prose` (plugin OpenProse)
    — consulta [OpenProse](/es/prose).

  </Accordion>
  <Accordion title="Argumentos de comandos nativos">
    Discord usa autocompletado para opciones dinámicas y menús de botones cuando se omiten
    argumentos requeridos. Telegram y Slack muestran un menú de botones para comandos con
    opciones. Las opciones dinámicas se resuelven contra el modelo de la sesión de destino, por lo que las opciones
    específicas del modelo, como niveles de `/think`, siguen la sobrescritura `/model` de la sesión.
  </Accordion>
</AccordionGroup>

## `/tools` — lo que el agente puede usar ahora

`/tools` responde a una pregunta de runtime: **qué puede usar este agente ahora mismo en esta
conversación** — no un catálogo de configuración estático.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Los resultados están delimitados por sesión. Cambiar el agente, canal, hilo, remitente,
autorización o modelo puede cambiar la salida. Para editar perfiles y sobrescrituras,
usa el panel Tools de la Control UI o las superficies de configuración.

## `/model` — selección de modelo

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y
modelo. El selector respeta `agents.defaults.models`, incluidas las entradas
`provider/*`.

## `/config` — escrituras de configuración en disco

<Note>
  Solo propietario. Deshabilitado de forma predeterminada — habilítalo con `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configuración se valida antes de escribir. Los cambios no válidos se rechazan. Las actualizaciones de `/config`
persisten entre reinicios.

## `/mcp` — configuración del servidor MCP

<Note>
  Solo propietario. Deshabilitado de forma predeterminada — habilítalo con `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` almacena la configuración en la configuración de OpenClaw, no en los ajustes de proyecto del agente embebido.

## `/debug` — sobrescrituras solo de runtime

<Note>
  Solo propietario. Deshabilitado de forma predeterminada — habilítalo con `commands.debug: true`.
  Las sobrescrituras se aplican inmediatamente a nuevas lecturas de configuración, pero **no** escriben en disco.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — gestión de plugins

<Note>
  Solo propietario para escrituras. Deshabilitado de forma predeterminada — habilítalo con `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` actualiza la configuración de plugins y recarga en caliente el runtime de plugins del Gateway
para nuevos turnos de agente. `/plugins install` reinicia automáticamente los Gateways
gestionados porque cambiaron los módulos fuente del plugin.

## `/trace` — salida de trazas de plugins

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` revela líneas de traza/depuración de plugins delimitadas por sesión sin el modo detallado
completo. No sustituye a `/debug` (sobrescrituras de runtime) ni a `/verbose` (salida normal de
herramientas).

## `/btw` — preguntas secundarias

`/btw` es una pregunta secundaria rápida sobre el contexto de la sesión actual. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

A diferencia de un mensaje normal:

- Usa la sesión actual como contexto de fondo.
- En sesiones del harness de Codex, se ejecuta como un hilo lateral efímero de Codex.
- **No** cambia el contexto futuro de la sesión.
- No se escribe en el historial de transcripción.

Consulta [Preguntas secundarias BTW](/es/tools/btw) para ver el comportamiento completo.

## Notas de superficie

<AccordionGroup>
  <Accordion title="Alcance de sesión por superficie">
    - **Comandos de texto:** se ejecutan en la sesión de chat normal (los DM comparten `main`, los grupos tienen su propia sesión).
    - **Comandos nativos de Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandos nativos de Slack:** `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
    - **Comandos nativos de Telegram:** `telegram:slash:<userId>` (apuntan a la sesión de chat mediante `CommandTargetSessionKey`)
    - **`/stop`** apunta a la sesión de chat activa para abortar la ejecución actual.

  </Accordion>
  <Accordion title="Detalles de Slack">
    `channels.slack.slashCommand` admite un único comando de estilo `/openclaw`.
    Con `commands.native: true`, crea un comando de barra de Slack por cada comando
    integrado. Registra `/agentstatus` (no `/status`) porque Slack reserva
    `/status`. El texto `/status` sigue funcionando en mensajes de Slack.
  </Accordion>
  <Accordion title="Ruta rápida y atajos en línea">
    - Los mensajes solo de comandos de remitentes en la lista permitida se gestionan inmediatamente (omiten cola + modelo).
    - Los atajos en línea (`/help`, `/commands`, `/status`, `/whoami`) también funcionan incrustados en mensajes normales y se eliminan antes de que el modelo vea el texto restante.
    - Los mensajes solo de comandos no autorizados se ignoran silenciosamente; los tokens `/...` en línea se tratan como texto sin formato.

  </Accordion>
  <Accordion title="Notas de argumentos">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (`/think: high`, `/send: on`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia aproximada); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
    - `/allowlist add|remove` requiere `commands.config: true` y respeta `configWrites` del canal.

  </Accordion>
</AccordionGroup>

## Uso y estado del proveedor

- **Uso/cuota del proveedor** (por ejemplo, "Claude 80% left") se muestra en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado.
- **Líneas de tokens/caché** en `/status` pueden recurrir a la entrada de uso más reciente de la transcripción cuando la instantánea de sesión en vivo es escasa.
- **Ejecución vs runtime:** `/status` informa `Execution` para la ruta de sandbox efectiva y `Runtime` para quién ejecuta la sesión: `OpenClaw Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Tokens/coste por respuesta:** controlado por `/usage off|tokens|full`.
- `/model status` trata sobre modelos/autenticación/endpoints, no sobre uso.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/es/tools/skills" icon="puzzle-piece">
    Cómo se registran y restringen los comandos de barra de Skills.
  </Card>
  <Card title="Crear Skills" href="/es/tools/creating-skills" icon="hammer">
    Crea una Skill que registre su propio comando de barra.
  </Card>
  <Card title="BTW" href="/es/tools/btw" icon="comments">
    Preguntas secundarias sin cambiar el contexto de sesión.
  </Card>
  <Card title="Steer" href="/es/tools/steer" icon="compass">
    Guía al agente durante una ejecución con `/steer`.
  </Card>
</CardGroup>
