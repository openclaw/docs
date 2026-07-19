---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o de los permisos
    - Comprender cómo se registran los comandos de Skills
sidebarTitle: Slash commands
summary: 'Todos los comandos con barra diagonal, las directivas y los atajos en línea disponibles: configuración, enrutamiento y comportamiento específico de cada superficie.'
title: Comandos con barra diagonal
x-i18n:
    generated_at: "2026-07-19T02:16:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b30bc91f438175018be882f5eb93780f99a3f99335a7200092049bfd68e2ff8
    source_path: tools/slash-commands.md
    workflow: 16
---

El Gateway gestiona los comandos enviados como mensajes independientes que comienzan por `/`.
Los comandos bash exclusivos del host usan `! <cmd>` (con `/bash <cmd>` como alias).

Cuando una conversación está vinculada a una sesión ACP, el texto normal se dirige al
entorno ACP. Los comandos de administración del Gateway permanecen locales: `/acp ...` siempre llega
al gestor de comandos de OpenClaw, y `/status` junto con `/unfocus` permanecen locales siempre que
la gestión de comandos esté habilitada para la superficie.

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
    - En los mensajes que **solo contienen directivas**, estas
      se conservan en la sesión y responden con una confirmación.
    - En los mensajes de **chat normal** con otro texto, actúan como indicaciones insertadas y
      **no** conservan la configuración de la sesión.
    - Las directivas solo se aplican a **remitentes autorizados**. Si se establece `commands.allowFrom`,
      esa es la única lista de permitidos que se utiliza; de lo contrario, la autorización procede de
      las listas de permitidos o el emparejamiento del canal, además de `commands.useAccessGroups`. Para los remitentes
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
  Habilita el análisis de `/...` en los mensajes de chat. En las superficies sin comandos nativos
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), los comandos de texto
  funcionan incluso cuando se establece en `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Automático: activado para Discord/Telegram; desactivado para Slack;
  se ignora para los proveedores sin compatibilidad nativa. Se puede anular por canal con
  `channels.<provider>.commands.native`. En Discord, `false` omite el registro de comandos
  con barra; los comandos registrados anteriormente pueden seguir visibles hasta que se eliminen.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra de forma nativa los comandos de Skills cuando se admite. Automático: activado para
  Discord/Telegram; desactivado para Slack. Se puede anular con
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para ejecutar comandos del shell del host (alias `/bash <cmd>`). Requiere
  las listas de permitidos de `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Tiempo que bash espera antes de pasar al modo en segundo plano (`0` pasa
  inmediatamente a segundo plano).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lee/escribe `openclaw.json`). Solo para el propietario.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lee/escribe la configuración de MCP gestionada por OpenClaw en `mcp.servers`). Solo para el propietario.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (detección/estado de plugins, además de instalación y activación/desactivación). Las escrituras son solo para el propietario.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (anulaciones de configuración solo en tiempo de ejecución). Solo para el propietario.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` y las solicitudes externas de reinicio de `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Lista de permitidos explícita del propietario para las superficies de comandos exclusivas del propietario. Es independiente de
  `commands.allowFrom` y del acceso mediante emparejamiento de mensajes directos.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: requiere la identidad del propietario para los comandos exclusivos del propietario. Cuando es `true`,
  el remitente debe coincidir con `commands.ownerAllowFrom` o tener el ámbito interno `operator.admin`.
  Una entrada comodín `allowFrom` **no** es suficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla cómo aparecen los identificadores de propietario en el prompt del sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Secreto HMAC utilizado cuando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista de permitidos por proveedor para autorizar comandos. Cuando está configurada, es la
  **única** fuente de autorización para comandos y directivas. Se usa `"*"` como valor
  predeterminado global; las claves específicas de cada proveedor lo anulan.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Aplica las listas de permitidos y las políticas a los comandos cuando no se establece `commands.allowFrom`.
</ParamField>

## Lista de comandos

Los comandos proceden de tres fuentes:

- **Integrados en el núcleo:** `src/auto-reply/commands-registry.shared.ts`
- **Comandos de dock generados:** `src/auto-reply/commands-registry.data.ts`
- **Comandos de plugins:** llamadas `registerCommand()` del plugin

La disponibilidad depende de las opciones de configuración, la superficie del canal y los
plugins instalados y habilitados.

### Comandos del núcleo

<AccordionGroup>
  <Accordion title="Sesiones y ejecuciones">
    | Comando | Descripción |
    | --- | --- |
    | `/new [model]` | Archiva la sesión actual e inicia una nueva |
    | `/reset [soft [message]]` | Restablece la sesión actual en el mismo lugar. `soft` conserva la transcripción, descarta los identificadores de sesión reutilizados del backend de la CLI y vuelve a ejecutar el inicio |
    | `/name <title>` | Asigna o cambia el nombre de la sesión actual. Omite el título para ver el nombre actual y una sugerencia |
    | `/compact [instructions]` | Compacta el contexto de la sesión. Consulta [Compaction](/es/concepts/compaction) |
    | `/stop` | Cancela la ejecución actual |
    | `/session idle <duration\|off>` | Gestiona el vencimiento por inactividad de la vinculación de hilos |
    | `/session max-age <duration\|off>` | Gestiona el vencimiento por antigüedad máxima de la vinculación de hilos |
    | `/export-session [path]` | Solo para el propietario. Exporta la sesión actual a HTML dentro del espacio de trabajo. Alias: `/export` |
    | `/export-trajectory [path]` | Exporta un paquete de trayectoria JSONL para la sesión actual. Alias: `/trajectory` |

    Las rutas explícitas de `/export-session` sustituyen los archivos existentes dentro del
    espacio de trabajo. Omite la ruta para generar un nombre de archivo que evite colisiones.

    <Note>
      Control UI intercepta `/new` cuando se escribe para crear una nueva sesión
      de panel y cambiar a ella, excepto cuando `session.dmScope: "main"` está configurado
      y el elemento principal actual es la sesión principal del agente; en ese caso, `/new`
      restablece la sesión principal en el mismo lugar. `/reset` escrito sigue ejecutando el
      restablecimiento en el mismo lugar del Gateway. Usa `/model default` cuando se quiera borrar una
      selección de modelo fijada a la sesión.
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
    | `/login [codex\|openai\|openai-codex]` | Empareja el inicio de sesión de Codex/OpenAI desde un chat privado o una sesión de la interfaz web. Solo para el propietario o el administrador |
    | `/model [name\|#\|status]` | Muestra o establece el modelo |
    | `/models [provider] [page] [limit=<n>\|all]` | Enumera los proveedores o modelos configurados y disponibles mediante autenticación |
    | `/queue <mode>` | Gestiona el comportamiento de la cola de ejecuciones activas. Consulta [Cola](/es/concepts/queue) y [Control de la cola](/es/concepts/queue-steering) |
    | `/steer <message>` | Inserta instrucciones en la ejecución activa. Alias: `/tell`. Consulta [Orientar](/es/tools/steer) |

    <AccordionGroup>
      <Accordion title="Seguridad de los modos detallado, seguimiento, rápido y razonamiento">
        - `/verbose` está destinado a la depuración; debe mantenerse **desactivado** durante el uso normal.
        - `/trace` solo muestra las líneas de seguimiento y depuración pertenecientes al plugin; el resto de la salida detallada permanece desactivada.
        - `/fast auto|on|off` conserva una anulación de sesión; usa la opción `inherit` de la interfaz de sesiones para borrarla.
        - `/fast` es específico del proveedor: OpenAI/Codex lo asignan a `service_tier=priority`; las solicitudes directas a Anthropic lo asignan a `service_tier=auto` o `standard_only`.
        - `/reasoning`, `/verbose` y `/trace` son arriesgados en contextos grupales, ya que pueden revelar razonamientos internos o diagnósticos de plugins. Deben mantenerse desactivados en los chats grupales.

      </Accordion>
      <Accordion title="Detalles del cambio de modelo">
        - `/model` conserva inmediatamente el nuevo modelo en la sesión.
        - Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
        - Si hay una ejecución activa, el cambio se marca como pendiente y se aplica en el siguiente punto de reintento seguro.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Detección y estado">
    | Comando | Descripción |
    | --- | --- |
    | `/help` | Muestra el resumen breve de ayuda |
    | `/commands` | Muestra el catálogo de comandos generado |
    | `/tools [compact\|verbose]` | Muestra lo que el agente actual puede usar en este momento |
    | `/status` | Muestra el estado de ejecución y del entorno de ejecución, el tiempo de actividad del Gateway y del sistema, el estado de los plugins y el uso o la cuota del proveedor |
    | `/status plugins` | Muestra información detallada sobre el estado de los plugins: errores de carga, cuarentenas, fallos de plugins de canal, problemas de dependencias y avisos de compatibilidad. Requiere `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gestiona el [objetivo](/es/tools/goal) persistente de la sesión actual |
    | `/diagnostics [note]` | Flujo de informes de asistencia solo para el propietario. Solicita aprobación de ejecución cada vez |
    | `/openclaw <request>` | Ejecuta el asistente de configuración y reparación de OpenClaw desde un mensaje directo del propietario |
    | `/tasks` | Enumera las tareas en segundo plano activas o recientes de la sesión actual |
    | `/context [list\|detail\|map\|json]` | Explica cómo se compone el contexto |
    | `/whoami` | Muestra el identificador del remitente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controla el pie de uso de cada respuesta (`reset`/`inherit`/`clear`/`default` borra la anulación de la sesión para volver a heredar el valor predeterminado configurado) o muestra un resumen local de costes |
  </Accordion>

  <Accordion title="Skills, listas de permitidos, aprobaciones">
    | Comando | Descripción |
    | --- | --- |
    | `/skill <name> [input]` | Ejecutar una skill por nombre |
    | `/learn [request]` | Redactar una skill revisable a partir de la conversación actual o de fuentes indicadas mediante el [Taller de skills](/es/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gestionar entradas de la lista de permitidos. Solo texto |
    | `/approve <id> <decision>` | Resolver solicitudes de aprobación de ejecución o plugins |
    | `/btw <question>` | Formular una pregunta secundaria sin cambiar el contexto de la sesión. Alias: `/side`. Véase [BTW](/es/tools/btw) |
  </Accordion>

  <Accordion title="Subagentes y ACP">
    | Comando | Descripción |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspeccionar las ejecuciones de subagentes de la sesión actual |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gestionar sesiones ACP y opciones del entorno de ejecución. Los controles del entorno de ejecución requieren la identidad del propietario externo o del administrador interno del Gateway |
    | `/focus <target>` | Vincular el hilo actual de Discord o el tema de Telegram a un destino de sesión |
    | `/unfocus` | Eliminar la vinculación del hilo actual |
    | `/agents` | Enumerar los agentes vinculados a hilos de la sesión actual |
  </Accordion>

  <Accordion title="Escrituras y administración exclusivas del propietario">
    | Comando | Requiere | Descripción |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Leer o escribir `openclaw.json`. Solo para el propietario |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Leer o escribir la configuración de servidores MCP gestionada por OpenClaw. Solo para el propietario |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspeccionar o modificar el estado de los plugins. Las escrituras son exclusivas del propietario. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Sustituciones de configuración solo para el entorno de ejecución. Solo para el propietario |
    | `/restart` | `commands.restart: true` (predeterminado) | Reiniciar OpenClaw |
    | `/send on\|off\|inherit` | propietario | Establecer la política de envío |
  </Accordion>

  <Accordion title="Voz, TTS y control de canales">
    | Comando | Descripción |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controlar TTS. Véase [TTS](/es/tools/tts) |
    | `/activation mention\|always` | Establecer el modo de activación de grupos |
    | `/bash <command>` | Ejecutar un comando de shell del host. Alias: `! <command>`. Requiere `commands.bash: true` |
    | `!poll [sessionId]` | Comprobar un trabajo de bash en segundo plano |
    | `!stop [sessionId]` | Detener un trabajo de bash en segundo plano |
  </Accordion>
</AccordionGroup>

### Comandos de acoplamiento

Los comandos de acoplamiento cambian la ruta de respuesta de la sesión activa a otro canal vinculado.
Consulte [Acoplamiento de canales](/es/concepts/channel-docking) para obtener información sobre la configuración y la solución de problemas.

Generados a partir de plugins de canales compatibles con comandos nativos:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Los comandos de acoplamiento requieren `session.identityLinks`. El remitente de origen y el interlocutor de destino
deben pertenecer al mismo grupo de identidades.

### Comandos de plugins incluidos

| Comando                                                 | Descripción                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Activar o desactivar el Dreaming de memoria (propietario o administrador del Gateway). Véase [Dreaming](/es/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gestionar el emparejamiento de dispositivos. Véase [Emparejamiento](/es/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Habilitar temporalmente comandos de Node de alto riesgo (cámara/pantalla/ordenador/escrituras). Véase [Uso del ordenador](/es/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Gestionar la configuración de voz de Talk. Nombre nativo en Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Enviar ajustes preestablecidos de tarjetas enriquecidas de LINE. Véase [LINE](/es/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Vincular, dirigir e inspeccionar el arnés del servidor de aplicaciones de Codex (estado, hilos, reanudación, modelo, modo rápido, permisos, compactación, revisión, MCP, skills y más). Véase [Arnés de Codex](/es/plugins/codex-harness) |

Solo para QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandos de skills

Las skills que los usuarios pueden invocar se exponen como comandos de barra:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- Las skills pueden registrarse como comandos directos (por ejemplo, `/prose` para OpenProse).
- El registro de comandos nativos de skills se controla mediante `commands.nativeSkills` y
  `channels.<provider>.commands.nativeSkills`.
- Los nombres se normalizan como `a-z0-9_` (máx. 32 caracteres); las colisiones reciben sufijos numéricos.

<AccordionGroup>
  <Accordion title="Enrutamiento de comandos de skills">
    De forma predeterminada, los comandos de skills se enrutan al modelo como una solicitud normal.

    Las skills pueden declarar `command-dispatch: tool` para enrutar directamente a una herramienta
    (de forma determinista, sin intervención del modelo). Ejemplo: `/prose` (plugin OpenProse)
    — véase [OpenProse](/es/prose).

  </Accordion>
  <Accordion title="Argumentos de comandos nativos">
    Discord utiliza el autocompletado para las opciones dinámicas y los menús de botones cuando se omiten los
    argumentos obligatorios. Telegram y Slack muestran un menú de botones para los comandos con
    opciones. Las opciones dinámicas se resuelven según el modelo de la sesión de destino, por lo que las opciones
    específicas del modelo, como los niveles de `/think`, siguen la sustitución de `/model` de la sesión.
  </Accordion>
</AccordionGroup>

## `/tools`: qué puede usar el agente ahora

`/tools` responde a una pregunta del entorno de ejecución: **qué puede usar este agente ahora mismo en esta
conversación**, no un catálogo estático de configuración.

```text
/tools         # vista compacta
/tools verbose # con descripciones breves
```

Los resultados se limitan a la sesión. Cambiar de agente, canal, hilo, autorización del
remitente o modelo puede cambiar la salida. Para editar perfiles y sustituciones,
utilice el panel Herramientas de la interfaz de control o las superficies de configuración.

## `/model`: selección del modelo

```text
/model             # mostrar selector de modelos
/model list        # igual
/model 3           # seleccionar por número en el selector
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # borrar la selección de modelo de la sesión
/model status      # vista detallada con punto de conexión y modo de API
```

En Discord, `/model` y `/models` abren un selector interactivo con listas desplegables de proveedor y
modelo. El selector respeta `agents.defaults.modelPolicy.allow`,
incluidas las entradas de `provider/*`. Sin una lista de permitidos explícita, las entradas y
los alias de modelos no restringen la selección.

## `/config`: escrituras de configuración en disco

<Note>
  Solo para el propietario. Deshabilitado de forma predeterminada; habilítelo con `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configuración se valida antes de escribirla. Los cambios no válidos se rechazan. Las actualizaciones de `/config`
persisten tras los reinicios.

## `/mcp`: configuración del servidor MCP

<Note>
  Solo para el propietario. Deshabilitado de forma predeterminada; habilítelo con `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` almacena la configuración en la configuración de OpenClaw, no en los ajustes del proyecto del agente integrado.
`/mcp show` oculta los campos que contienen credenciales, los valores reconocidos de
indicadores de credenciales y los argumentos conocidos con forma de secreto. Cuando se ejecuta desde un grupo, la
configuración se envía de forma privada al propietario; si no hay disponible una ruta privada hacia el propietario,
el comando se cierra de forma segura y solicita al propietario que vuelva a intentarlo desde un chat
directo.

## `/debug`: sustituciones solo para el entorno de ejecución

<Note>
  Solo para el propietario. Deshabilitado de forma predeterminada; habilítelo con `commands.debug: true`.
  Las sustituciones se aplican inmediatamente a las nuevas lecturas de configuración, pero **no** se escriben en el disco.
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
  Las escrituras son exclusivas del propietario. Deshabilitado de forma predeterminada; habilítelo con `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` actualiza la configuración de los plugins y recarga en caliente el entorno de ejecución de
plugins del Gateway para los nuevos turnos del agente. `/plugins install` reinicia automáticamente los
Gateways gestionados porque los módulos de código fuente de los plugins han cambiado. Las instalaciones de confianza de ClawHub
y del catálogo oficial no necesitan confirmación adicional. Las fuentes arbitrarias de npm,
git, archivos, `npm-pack:` y rutas locales muestran una advertencia de procedencia y
requieren añadir `--force` al final después de revisar el código fuente. Este indicador confirma
el código fuente y permite sustituir una instalación existente; no elude
`security.installPolicy` ni las comprobaciones de seguridad del instalador. Las versiones de ClawHub con
advertencias de riesgo siguen requiriendo el indicador independiente y exclusivo del shell
`--acknowledge-clawhub-risk`. Las instalaciones desde Marketplace, vinculadas y fijadas también
siguen siendo exclusivas del shell.

## `/trace`: salida de seguimiento de plugins

```text
/trace          # mostrar el estado actual del seguimiento
/trace on
/trace off
```

`/trace` revela líneas de seguimiento y depuración de plugins limitadas a la sesión sin activar el modo
detallado completo. No sustituye a `/debug` (sustituciones del entorno de ejecución) ni a `/verbose` (salida normal
de herramientas).

## `/btw`: preguntas secundarias

`/btw` es una pregunta secundaria rápida sobre el contexto de la sesión actual. Alias: `/side`.

```text
/btw ¿qué estamos haciendo ahora mismo?
/side ¿qué cambió mientras continuaba la ejecución principal?
```

A diferencia de un mensaje normal:

- Utiliza la sesión actual como contexto de fondo.
- En las sesiones del arnés de Codex, se ejecuta como un hilo secundario efímero de Codex.
- **No** cambia el contexto futuro de la sesión.
- No se escribe en el historial de la transcripción.

Consulte [Preguntas secundarias de BTW](/es/tools/btw) para conocer el comportamiento completo.

## Notas sobre las superficies

<AccordionGroup>
  <Accordion title="Ámbito de sesión por superficie">
    - **Comandos de texto:** se ejecutan en la sesión de chat normal (los mensajes directos comparten `main`; los grupos tienen su propia sesión).
    - **Comandos nativos de Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandos nativos de Slack:** `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
    - **Comandos nativos de Telegram:** `telegram:slash:<userId>` (se dirigen a la sesión de chat mediante `CommandTargetSessionKey`)
    - **`/login codex`** envía códigos de emparejamiento de dispositivos únicamente mediante chats privados o rutas de respuesta de la interfaz web. Las invocaciones desde grupos o temas de Telegram solicitan al propietario que envíe un mensaje directo al bot.
    - **`/stop`** se dirige a la sesión de chat activa para cancelar la ejecución actual.

  </Accordion>
  <Accordion title="Detalles específicos de Slack">
    `channels.slack.slashCommand` admite un único comando de estilo `/openclaw`.
    Con `commands.native: true`, cree un comando de barra de Slack por cada comando
    integrado. Registre `/agentstatus` (no `/status`) porque Slack reserva
    `/status`. El texto `/status` sigue funcionando en los mensajes de Slack.
  </Accordion>
  <Accordion title="Ruta rápida y atajos en línea">
    - Los mensajes que solo contienen comandos de remitentes incluidos en la lista de permitidos se procesan de inmediato (omiten la cola y el modelo).
    - Los atajos en línea (`/help`, `/commands`, `/status`, `/whoami`) también funcionan integrados en mensajes normales y se eliminan antes de que el modelo vea el texto restante.
    - Los mensajes no autorizados que solo contienen comandos se ignoran silenciosamente; los tokens `/...` en línea se tratan como texto sin formato.

  </Accordion>
  <Accordion title="Notas sobre los argumentos">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (`/think: high`, `/send: on`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o el nombre de un proveedor (coincidencia aproximada); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
    - `/allowlist add|remove` requiere `commands.config: true` y respeta el `configWrites` del canal.

  </Accordion>
</AccordionGroup>

## Uso y estado del proveedor

- El **uso/cuota del proveedor** (p. ej., «Claude: 80 % restante») se muestra en `/status` para el proveedor del modelo actual cuando el seguimiento del uso está activado.
- Las **líneas de tokens/caché** de `/status` pueden recurrir a la entrada de uso más reciente de la transcripción cuando la instantánea de la sesión en vivo contiene pocos datos.
- **Ejecución frente a entorno de ejecución:** `/status` indica `Execution` para la ruta efectiva del entorno aislado y `Runtime` para indicar quién ejecuta la sesión: `OpenClaw Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP.
- **Tokens/coste por respuesta:** se controla mediante `/usage off|tokens|full`.
- `/model status` se refiere a modelos/autenticación/endpoints, no al uso.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/es/tools/skills" icon="puzzle-piece">
    Cómo se registran y controlan los comandos de barra de Skills.
  </Card>
  <Card title="Creación de Skills" href="/es/tools/creating-skills" icon="hammer">
    Cree una Skill que registre su propio comando de barra.
  </Card>
  <Card title="BTW" href="/es/tools/btw" icon="comments">
    Preguntas secundarias sin cambiar el contexto de la sesión.
  </Card>
  <Card title="Orientar" href="/es/tools/steer" icon="compass">
    Guíe al agente durante la ejecución con `/steer`.
  </Card>
</CardGroup>
