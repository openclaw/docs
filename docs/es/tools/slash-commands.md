---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o de los permisos
    - Cómo se registran los comandos de Skills
sidebarTitle: Slash commands
summary: 'Todos los comandos de barra diagonal, las directivas y los atajos en línea disponibles: configuración, enrutamiento y comportamiento específico de cada superficie.'
title: Comandos de barra diagonal
x-i18n:
    generated_at: "2026-07-12T14:55:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

El Gateway gestiona los comandos enviados como mensajes independientes que comienzan por `/`.
Los comandos bash exclusivos del host usan `! <cmd>` (con `/bash <cmd>` como alias).

Cuando una conversación está vinculada a una sesión ACP, el texto normal se dirige al
entorno de ejecución ACP. Los comandos de administración del Gateway permanecen locales: `/acp ...` siempre llega
al controlador de comandos de OpenClaw, y `/status` junto con `/unfocus` permanecen locales siempre que
el procesamiento de comandos esté habilitado para la superficie.

## Tres tipos de comandos

<CardGroup cols={3}>
  <Card title="Comandos" icon="terminal">
    Mensajes independientes `/...` gestionados por el Gateway. Deben enviarse como
    único contenido del mensaje.
  </Card>
  <Card title="Directivas" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue`: se eliminan del mensaje antes de que el modelo
    lo vea. Conservan la configuración de la sesión cuando se envían solas; actúan como indicaciones insertadas
    cuando se envían con otro texto.
  </Card>
  <Card title="Atajos insertados" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami`: se ejecutan inmediatamente y se
    eliminan antes de que el modelo vea el texto restante. Solo para remitentes autorizados.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detalles del comportamiento de las directivas">
    - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
    - En mensajes que contienen **solo directivas** (el mensaje solo contiene directivas), estas
      se conservan en la sesión y responden con una confirmación.
    - En mensajes de **chat normal** con otro texto, actúan como indicaciones insertadas y
      **no** conservan la configuración de la sesión.
    - Las directivas solo se aplican a **remitentes autorizados**. Si se establece `commands.allowFrom`,
      es la única lista de permitidos que se utiliza; de lo contrario, la autorización procede de las
      listas de permitidos o el emparejamiento del canal, además de `commands.useAccessGroups`. Para los remitentes
      no autorizados, las directivas se tratan como texto sin formato.
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
  Habilita el análisis de `/...` en los mensajes de chat. En superficies sin comandos nativos
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), los comandos de texto
  funcionan incluso cuando se establece en `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Automático: activado para Discord/Telegram; desactivado para Slack;
  se ignora para proveedores sin compatibilidad nativa. Se puede sustituir por canal mediante
  `channels.<provider>.commands.native`. En Discord, `false` omite el registro de comandos de barra;
  los comandos registrados anteriormente pueden seguir visibles hasta que se eliminen.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra de forma nativa los comandos de Skills cuando se admite. Automático: activado para
  Discord/Telegram; desactivado para Slack. Se puede sustituir mediante
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para ejecutar comandos del shell del host (alias `/bash <cmd>`). Requiere
  listas de permitidos de `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Tiempo que bash espera antes de cambiar al modo en segundo plano (`0` pasa
  inmediatamente a segundo plano).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lee/escribe `openclaw.json`). Solo para el propietario.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lee/escribe la configuración de MCP administrada por OpenClaw en `mcp.servers`). Solo para el propietario.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (detección/estado de plugins, además de instalación y activación/desactivación). Escrituras solo para el propietario.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (sustituciones de configuración solo durante la ejecución). Solo para el propietario.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` y las acciones de herramientas para reiniciar el Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Lista de permitidos explícita del propietario para superficies de comandos exclusivas del propietario. Independiente de
  `commands.allowFrom` y del acceso mediante emparejamiento de mensajes directos.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: exige la identidad del propietario para los comandos exclusivos del propietario. Cuando es `true`,
  el remitente debe coincidir con `commands.ownerAllowFrom` o poseer el ámbito interno `operator.admin`.
  Una entrada comodín de `allowFrom` **no** es suficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla cómo aparecen los identificadores de propietarios en el prompt del sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Secreto HMAC utilizado cuando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista de permitidos por proveedor para la autorización de comandos. Cuando se configura, es la
  **única** fuente de autorización para comandos y directivas. Use `"*"` como valor
  predeterminado global; las claves específicas de cada proveedor lo sobrescriben.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Aplica las listas de permitidos y las políticas a los comandos cuando no se establece `commands.allowFrom`.
</ParamField>

## Lista de comandos

Los comandos provienen de tres fuentes:

- **Comandos integrados del núcleo:** `src/auto-reply/commands-registry.shared.ts`
- **Comandos de dock generados:** `src/auto-reply/commands-registry.data.ts`
- **Comandos de Plugin:** llamadas a `registerCommand()` del Plugin

La disponibilidad depende de las opciones de configuración, la superficie del canal y los
plugins instalados y habilitados.

### Comandos del núcleo

  <AccordionGroup>
  <Accordion title="Sesiones y ejecuciones">
    | Comando | Descripción |
    | --- | --- |
    | `/new [model]` | Archiva la sesión actual e inicia una nueva |
    | `/reset [soft [message]]` | Restablece la sesión actual sin sustituirla. `soft` conserva la transcripción, descarta los identificadores de sesión reutilizados del backend de la CLI y vuelve a ejecutar el inicio |
    | `/name <title>` | Asigna o cambia el nombre de la sesión actual. Omite el título para ver el nombre actual y una sugerencia |
    | `/compact [instructions]` | Compacta el contexto de la sesión. Consulta [Compaction](/es/concepts/compaction) |
    | `/stop` | Cancela la ejecución actual |
    | `/session idle <duration\|off>` | Gestiona la caducidad por inactividad de la vinculación al hilo |
    | `/session max-age <duration\|off>` | Gestiona la caducidad por antigüedad máxima de la vinculación al hilo |
    | `/export-session [path]` | Exporta la sesión actual a HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Exporta un paquete de trayectoria JSONL para la sesión actual. Alias: `/trajectory` |

    <Note>
      Control UI intercepta `/new` cuando se escribe para crear una nueva sesión
      del panel y cambiar a ella, excepto cuando está configurado `session.dmScope: "main"`
      y el elemento principal actual es la sesión principal del agente; en ese caso, `/new`
      restablece la sesión principal sin sustituirla. Al escribir `/reset`, se sigue ejecutando
      el restablecimiento sin sustitución del Gateway. Usa `/model default` cuando quieras borrar
      una selección de modelo fijada para la sesión.
    </Note>

  </Accordion>

  <Accordion title="Controles del modelo y de la ejecución">
    | Comando | Descripción |
    | --- | --- |
    | `/think <level\|default>` | Establece el nivel de razonamiento o borra la anulación de la sesión. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Activa o desactiva la salida detallada. Alias: `/v` |
    | `/trace on\|off` | Activa o desactiva la salida de seguimiento del plugin para la sesión actual |
    | `/fast [status\|auto\|on\|off\|default]` | Muestra, establece o borra el modo rápido |
    | `/reasoning [on\|off\|stream]` | Activa o desactiva la visibilidad del razonamiento. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Activa o desactiva el modo elevado. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Muestra o establece los valores predeterminados de ejecución |
    | `/login [codex\|openai\|openai-codex]` | Vincula el inicio de sesión de Codex/OpenAI desde un chat privado o una sesión de la interfaz web. Solo para propietarios o administradores |
    | `/model [name\|#\|status]` | Muestra o establece el modelo |
    | `/models [provider] [page] [limit=<n>\|all]` | Enumera los proveedores o modelos configurados o disponibles mediante autenticación |
    | `/queue <mode>` | Gestiona el comportamiento de la cola de ejecuciones activas. Consulta [Cola](/es/concepts/queue) y [Dirección de la cola](/es/concepts/queue-steering) |
    | `/steer <message>` | Inyecta directrices en la ejecución activa. Alias: `/tell`. Consulta [Dirigir](/es/tools/steer) |

    <AccordionGroup>
      <Accordion title="Seguridad de verbose / trace / fast / reasoning">
        - `/verbose` sirve para depurar; mantenlo **desactivado** durante el uso normal.
        - `/trace` solo revela las líneas de seguimiento o depuración pertenecientes al plugin; los mensajes detallados normales permanecen desactivados.
        - `/fast auto|on|off` conserva una anulación de sesión; usa la opción `inherit` de la interfaz Sessions para borrarla.
        - `/fast` depende del proveedor: OpenAI/Codex lo asignan a `service_tier=priority`; las solicitudes directas a Anthropic lo asignan a `service_tier=auto` o `standard_only`.
        - `/reasoning`, `/verbose` y `/trace` son arriesgados en entornos grupales: pueden revelar razonamiento interno o diagnósticos del plugin. Mantenlos desactivados en los chats grupales.

      </Accordion>
      <Accordion title="Detalles del cambio de modelo">
        - `/model` guarda inmediatamente el nuevo modelo en la sesión.
        - Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
        - Si hay una ejecución activa, el cambio queda marcado como pendiente y se aplica en el siguiente punto de reintento sin errores.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Descubrimiento y estado">
    | Comando | Descripción |
    | --- | --- |
    | `/help` | Muestra el resumen breve de ayuda |
    | `/commands` | Muestra el catálogo de comandos generado |
    | `/tools [compact\|verbose]` | Muestra qué puede usar el agente actual en este momento |
    | `/status` | Muestra el estado de ejecución y del entorno, el tiempo de actividad del Gateway y del sistema, el estado del plugin, además del uso y la cuota del proveedor |
    | `/status plugins` | Muestra información detallada sobre el estado de los plugins: errores de carga, cuarentenas, fallos de plugins de canal, problemas de dependencias y avisos de compatibilidad. Requiere `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gestiona el [objetivo](/es/tools/goal) persistente de la sesión actual |
    | `/diagnostics [note]` | Flujo de informes de soporte solo para propietarios. Solicita aprobación de ejecución cada vez |
    | `/crestodian <request>` | Ejecuta el asistente de configuración y reparación de Crestodian desde un mensaje directo de un propietario |
    | `/tasks` | Enumera las tareas en segundo plano activas o recientes de la sesión actual |
    | `/context [list\|detail\|map\|json]` | Explica cómo se construye el contexto |
    | `/whoami` | Muestra tu identificador de remitente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controla el pie de uso de cada respuesta (`reset`/`inherit`/`clear`/`default` borra la anulación de la sesión para volver a heredar el valor predeterminado configurado) o muestra un resumen local de costes |
  </Accordion>

  <Accordion title="Skills, listas de permitidos y aprobaciones">
    | Comando | Descripción |
    | --- | --- |
    | `/skill <name> [input]` | Ejecuta una skill por su nombre |
    | `/learn [request]` | Redacta una skill revisable a partir de la conversación actual o de fuentes indicadas mediante [Taller de skills](/es/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gestiona las entradas de la lista de permitidos. Solo texto |
    | `/approve <id> <decision>` | Resuelve solicitudes de aprobación de ejecución o de plugins |
    | `/btw <question>` | Formula una pregunta aparte sin cambiar el contexto de la sesión. Alias: `/side`. Consulta [BTW](/es/tools/btw) |
  </Accordion>

  <Accordion title="Subagentes y ACP">
    | Comando | Descripción |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecciona las ejecuciones de subagentes de la sesión actual |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gestiona las sesiones de ACP y las opciones de ejecución. Los controles de ejecución requieren la identidad de un propietario externo o de un administrador interno del Gateway |
    | `/focus <target>` | Vincula el hilo actual de Discord o el tema de Telegram a un destino de sesión |
    | `/unfocus` | Elimina la vinculación del hilo actual |
    | `/agents` | Enumera los agentes vinculados al hilo de la sesión actual |
  </Accordion>

  <Accordion title="Escrituras y administración exclusivas del propietario">
    | Comando | Requiere | Descripción |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lee o escribe `openclaw.json`. Solo para el propietario |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lee o escribe la configuración de servidores MCP gestionada por OpenClaw. Solo para el propietario |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecciona o modifica el estado de los plugins. Las escrituras son exclusivas del propietario. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Sustituciones de configuración que solo afectan a la ejecución. Solo para el propietario |
    | `/restart` | `commands.restart: true` (predeterminado) | Reinicia OpenClaw |
    | `/send on\|off\|inherit` | propietario | Establece la política de envío |
  </Accordion>

  <Accordion title="Voz, TTS y control de canales">
    | Comando | Descripción |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controla TTS. Consulta [TTS](/es/tools/tts) |
    | `/activation mention\|always` | Establece el modo de activación de grupos |
    | `/bash <command>` | Ejecuta un comando de shell en el host. Alias: `! <command>`. Requiere `commands.bash: true` |
    | `!poll [sessionId]` | Comprueba un trabajo de bash en segundo plano |
    | `!stop [sessionId]` | Detiene un trabajo de bash en segundo plano |
  </Accordion>
</AccordionGroup>

### Comandos de acoplamiento

Los comandos de acoplamiento cambian la ruta de respuesta de la sesión activa a otro canal vinculado.
Consulta [Acoplamiento de canales](/es/concepts/channel-docking) para obtener información sobre la configuración y la solución de problemas.

Generados a partir de plugins de canales compatibles con comandos nativos:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Los comandos de acoplamiento requieren `session.identityLinks`. El remitente de origen y el par de destino
deben pertenecer al mismo grupo de identidades.

### Comandos de plugins incluidos

| Comando                                                 | Descripción                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Activa o desactiva el Dreaming de memoria (propietario o administrador del Gateway). Consulta [Dreaming](/es/concepts/dreaming)                                                                    |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gestiona el emparejamiento de dispositivos. Consulta [Emparejamiento](/es/channels/pairing)                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Habilita temporalmente comandos de Node de alto riesgo (cámara/pantalla/equipo/escrituras). Consulta [Uso del equipo](/nodes/computer-use)                                                      |
| `/voice status\|list\|set <voiceId>`                    | Gestiona la configuración de voz de Talk. Nombre nativo en Discord: `/talkvoice`                                                                                                                |
| `/card ...`                                             | Envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line)                                                                                                              |
| `/codex <action> ...`                                   | Vincula, dirige e inspecciona el entorno del servidor de aplicaciones de Codex (estado, hilos, reanudación, modelo, modo rápido, permisos, compactación, revisión, MCP, Skills y más). Consulta [Entorno de Codex](/es/plugins/codex-harness) |

Solo para QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandos de Skills

Las Skills invocables por el usuario se exponen como comandos de barra:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- Las Skills pueden registrarse como comandos directos (por ejemplo, `/prose` para OpenProse).
- El registro de comandos nativos de Skills se controla mediante `commands.nativeSkills` y
  `channels.<provider>.commands.nativeSkills`.
- Los nombres se normalizan a `a-z0-9_` (máximo de 32 caracteres); las colisiones reciben sufijos numéricos.

<AccordionGroup>
  <Accordion title="Enrutamiento de comandos de Skills">
    De forma predeterminada, los comandos de Skills se envían al modelo como una solicitud normal.

    Las Skills pueden declarar `command-dispatch: tool` para enviarse directamente a una herramienta
    (de forma determinista, sin intervención del modelo). Ejemplo: `/prose` (plugin OpenProse)
    — consulta [OpenProse](/es/prose).

  </Accordion>
  <Accordion title="Argumentos de comandos nativos">
    Discord utiliza el autocompletado para las opciones dinámicas y menús de botones cuando se omiten
    los argumentos obligatorios. Telegram y Slack muestran un menú de botones para los comandos con
    opciones. Las opciones dinámicas se resuelven según el modelo de la sesión de destino, por lo que las
    opciones específicas del modelo, como los niveles de `/think`, respetan la sustitución de `/model` de la sesión.
  </Accordion>
</AccordionGroup>

## `/tools`: qué puede utilizar el agente ahora

`/tools` responde a una pregunta sobre la ejecución: **qué puede utilizar este agente ahora mismo en esta
conversación**, no un catálogo estático de configuración.

```text
/tools         # vista compacta
/tools verbose # con descripciones breves
```

Los resultados se limitan a la sesión. Cambiar de agente, canal, hilo, autorización
del remitente o modelo puede cambiar el resultado. Para editar perfiles y sustituciones,
utiliza el panel Tools de la interfaz de control o las superficies de configuración.

## `/model`: selección de modelos

```text
/model             # muestra el selector de modelos
/model list        # igual
/model 3           # selecciona por número en el selector
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # borra la selección de modelo de la sesión
/model status      # vista detallada con el endpoint y el modo de API
```

En Discord, `/model` y `/models` abren un selector interactivo con listas desplegables
de proveedores y modelos. El selector respeta `agents.defaults.models`, incluidas las
entradas `provider/*`.

## `/config`: escrituras en la configuración del disco

<Note>
  Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configuración se valida antes de escribirla. Los cambios no válidos se rechazan. Las actualizaciones de `/config`
se conservan después de los reinicios.

## `/mcp`: configuración de servidores MCP

<Note>
  Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` almacena la configuración en la configuración de OpenClaw, no en los ajustes de proyecto del agente integrado.
`/mcp show` oculta los campos que contienen credenciales, los valores reconocidos de indicadores de credenciales
y los argumentos conocidos con formato de secreto. Cuando se ejecuta desde un grupo, la
configuración se envía de forma privada al propietario; si no hay disponible una ruta privada hacia el propietario,
el comando adopta un comportamiento cerrado ante errores y solicita al propietario que vuelva a intentarlo desde un chat
directo.

## `/debug`: sustituciones que solo afectan a la ejecución

<Note>
  Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.
  Las sustituciones se aplican inmediatamente a las nuevas lecturas de configuración, pero **no** escriben en el disco.
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
  Las escrituras son exclusivas del propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` actualiza la configuración del plugin y recarga en caliente la ejecución de plugins del Gateway
para los nuevos turnos del agente. `/plugins install` reinicia automáticamente los
Gateways gestionados porque han cambiado los módulos de origen del plugin.

## `/trace`: salida de seguimiento de plugins

```text
/trace          # muestra el estado actual del seguimiento
/trace on
/trace off
```

`/trace` muestra líneas de seguimiento y depuración de plugins limitadas a la sesión sin activar el modo
detallado completo. No sustituye a `/debug` (sustituciones durante la ejecución) ni a `/verbose` (salida normal
de herramientas).

## `/btw`: preguntas secundarias

`/btw` es una pregunta secundaria rápida sobre el contexto de la sesión actual. Alias: `/side`.

```text
/btw ¿qué estamos haciendo ahora mismo?
/side ¿qué cambió mientras continuaba la ejecución principal?
```

A diferencia de un mensaje normal:

- Utiliza la sesión actual como contexto de fondo.
- En las sesiones del entorno de Codex, se ejecuta como un hilo secundario efímero de Codex.
- **No** cambia el contexto futuro de la sesión.
- No se escribe en el historial de la transcripción.

Consulta [Preguntas secundarias con BTW](/es/tools/btw) para conocer el comportamiento completo.

## Notas sobre las superficies

<AccordionGroup>
  <Accordion title="Ámbito de la sesión por superficie">
    - **Comandos de texto:** se ejecutan en la sesión de chat normal (los mensajes directos comparten `main`; los grupos tienen su propia sesión).
    - **Comandos nativos de Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandos nativos de Slack:** `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
    - **Comandos nativos de Telegram:** `telegram:slash:<userId>` (se dirigen a la sesión de chat mediante `CommandTargetSessionKey`)
    - **`/login codex`** envía códigos de emparejamiento de dispositivos únicamente mediante chats privados o rutas de respuesta de la interfaz web. Las invocaciones desde grupos o temas de Telegram solicitan al propietario que envíe un mensaje directo al bot.
    - **`/stop`** se dirige a la sesión de chat activa para cancelar la ejecución actual.

  </Accordion>
  <Accordion title="Detalles específicos de Slack">
    `channels.slack.slashCommand` admite un único comando con el formato `/openclaw`.
    Con `commands.native: true`, crea un comando de barra de Slack por cada comando
    integrado. Registra `/agentstatus` (no `/status`) porque Slack reserva
    `/status`. El comando de texto `/status` sigue funcionando en los mensajes de Slack.
  </Accordion>
  <Accordion title="Ruta rápida y atajos insertados">
    - Los mensajes que contienen únicamente comandos de remitentes incluidos en la lista de permitidos se procesan inmediatamente (omiten la cola y el modelo).
    - Los atajos insertados (`/help`, `/commands`, `/status`, `/whoami`) también funcionan dentro de mensajes normales y se eliminan antes de que el modelo reciba el texto restante.
    - Los mensajes no autorizados que contienen únicamente comandos se ignoran silenciosamente; los tokens `/...` insertados se tratan como texto sin formato.

  </Accordion>
  <Accordion title="Notas sobre los argumentos">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (`/think: high`, `/send: on`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o el nombre de un proveedor (coincidencia aproximada); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
    - `/allowlist add|remove` requiere `commands.config: true` y respeta `configWrites` del canal.

  </Accordion>
</AccordionGroup>

## Uso y estado del proveedor

- **Uso/cuota del proveedor** (p. ej., «Claude: 80 % restante») se muestra en `/status` para el proveedor del modelo actual cuando el seguimiento del uso está habilitado.
- **Las líneas de tokens/caché** de `/status` pueden recurrir a la entrada de uso más reciente de la transcripción cuando la instantánea de la sesión activa contiene pocos datos.
- **Ejecución frente a entorno de ejecución:** `/status` muestra `Execution` para la ruta efectiva del entorno aislado y `Runtime` para indicar quién ejecuta la sesión: `OpenClaw Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP.
- **Tokens/coste por respuesta:** se controla mediante `/usage off|tokens|full`.
- `/model status` proporciona información sobre modelos/autenticación/endpoints, no sobre el uso.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/es/tools/skills" icon="puzzle-piece">
    Cómo se registran y restringen los comandos con barra de Skills.
  </Card>
  <Card title="Creación de Skills" href="/es/tools/creating-skills" icon="hammer">
    Cree una habilidad que registre su propio comando con barra.
  </Card>
  <Card title="BTW" href="/es/tools/btw" icon="comments">
    Preguntas secundarias sin cambiar el contexto de la sesión.
  </Card>
  <Card title="Orientar" href="/es/tools/steer" icon="compass">
    Guíe al agente durante la ejecución con `/steer`.
  </Card>
</CardGroup>
