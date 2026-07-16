---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o de los permisos
    - Cómo se registran los comandos de Skills
sidebarTitle: Slash commands
summary: 'Todos los comandos con barra diagonal, las directivas y los atajos en línea disponibles: configuración, enrutamiento y comportamiento específico de cada superficie.'
title: Comandos con barra diagonal
x-i18n:
    generated_at: "2026-07-16T12:02:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

El Gateway gestiona los comandos enviados como mensajes independientes que comienzan con `/`.
Los comandos bash exclusivos del host usan `! <cmd>` (con `/bash <cmd>` como alias).

Cuando una conversación está vinculada a una sesión ACP, el texto normal se dirige al
entorno ACP. Los comandos de administración del Gateway permanecen locales: `/acp ...` siempre llega
al controlador de comandos de OpenClaw, y `/status` junto con `/unfocus` permanecen locales siempre que
el procesamiento de comandos esté habilitado para la superficie.

## Tres tipos de comandos

<CardGroup cols={3}>
  <Card title="Comandos" icon="terminal">
    Mensajes `/...` independientes gestionados por el Gateway. Deben enviarse como
    el único contenido del mensaje.
  </Card>
  <Card title="Directivas" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue`: se eliminan del mensaje antes de que el modelo
    lo vea. Conservan la configuración de la sesión cuando se envían solas; actúan como indicaciones en línea
    cuando se envían con otro texto.
  </Card>
  <Card title="Atajos en línea" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami`: se ejecutan inmediatamente y se
    eliminan antes de que el modelo vea el texto restante. Solo para remitentes autorizados.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detalles del comportamiento de las directivas">
    - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
    - En los mensajes **que contienen únicamente directivas** (el mensaje solo contiene directivas), estas
      se conservan en la sesión y responden con una confirmación.
    - En los mensajes de **chat normal** con otro texto, actúan como indicaciones en línea y
      **no** conservan la configuración de la sesión.
    - Las directivas solo se aplican a **remitentes autorizados**. Si se establece `commands.allowFrom`,
      esta es la única lista de permitidos que se utiliza; de lo contrario, la autorización procede de
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
  Habilita el análisis de `/...` en los mensajes de chat. En superficies sin comandos nativos
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), los comandos de texto
  funcionan incluso cuando se establece en `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Automático: activado para Discord/Telegram; desactivado para Slack;
  se ignora para proveedores sin compatibilidad nativa. Se puede sustituir por canal mediante
  `channels.<provider>.commands.native`. En Discord, `false` omite el registro de comandos con barra;
  los comandos registrados anteriormente pueden permanecer visibles hasta que se eliminen.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra los comandos de Skills de forma nativa cuando se admite. Automático: activado para
  Discord/Telegram; desactivado para Slack. Se puede sustituir mediante
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para ejecutar comandos del shell del host (alias `/bash <cmd>`). Requiere
  las listas de permitidos de `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Tiempo que bash espera antes de cambiar al modo en segundo plano (`0` pasa
  inmediatamente a segundo plano).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lee/escribe `openclaw.json`). Solo para el propietario.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lee/escribe la configuración de MCP gestionada por OpenClaw en `mcp.servers`). Solo para el propietario.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (detección/estado de plugins, además de instalación y activación/desactivación). Las operaciones de escritura son solo para el propietario.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (sustituciones de configuración solo en tiempo de ejecución). Solo para el propietario.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` y las solicitudes externas de reinicio de `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Lista de permitidos explícita del propietario para superficies de comandos exclusivas del propietario. Es independiente de
  `commands.allowFrom` y del acceso mediante emparejamiento de mensajes directos.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: requiere la identidad del propietario para los comandos exclusivos del propietario. Cuando `true`,
  el remitente debe coincidir con `commands.ownerAllowFrom` o poseer el ámbito interno `operator.admin`.
  Una entrada comodín `allowFrom` **no** es suficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla cómo aparecen los identificadores del propietario en el mensaje del sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Secreto HMAC utilizado cuando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Lista de permitidos por proveedor para la autorización de comandos. Cuando está configurada, es la
  **única** fuente de autorización para comandos y directivas. Use `"*"` como valor
  predeterminado global; las claves específicas de cada proveedor lo sustituyen.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Aplica listas de permitidos y políticas a los comandos cuando `commands.allowFrom` no está establecido.
</ParamField>

## Lista de comandos

Los comandos proceden de tres fuentes:

- **Comandos integrados del núcleo:** `src/auto-reply/commands-registry.shared.ts`
- **Comandos de dock generados:** `src/auto-reply/commands-registry.data.ts`
- **Comandos de plugins:** llamadas `registerCommand()` de plugins

La disponibilidad depende de los indicadores de configuración, la superficie del canal y los
plugins instalados y habilitados.

### Comandos del núcleo

<AccordionGroup>
  <Accordion title="Sesiones y ejecuciones">
    | Comando | Descripción |
    | --- | --- |
    | `/new [model]` | Archiva la sesión actual e inicia una nueva |
    | `/reset [soft [message]]` | Restablece la sesión actual sin sustituirla. `soft` conserva la transcripción, descarta los identificadores de sesión reutilizados del backend de la CLI y vuelve a ejecutar el inicio |
    | `/name <title>` | Asigna o cambia el nombre de la sesión actual. Omita el título para ver el nombre actual y una sugerencia |
    | `/compact [instructions]` | Compacta el contexto de la sesión. Consulte [Compaction](/es/concepts/compaction) |
    | `/stop` | Cancela la ejecución actual |
    | `/session idle <duration\|off>` | Gestiona el vencimiento por inactividad de la vinculación del hilo |
    | `/session max-age <duration\|off>` | Gestiona el vencimiento por antigüedad máxima de la vinculación del hilo |
    | `/export-session [path]` | Solo para el propietario. Exporta la sesión actual a HTML dentro del espacio de trabajo. Alias: `/export` |
    | `/export-trajectory [path]` | Exporta un paquete de trayectoria JSONL para la sesión actual. Alias: `/trajectory` |

    Las rutas `/export-session` explícitas sustituyen los archivos existentes dentro del
    espacio de trabajo. Omita la ruta para generar un nombre de archivo protegido contra colisiones.

    <Note>
      La interfaz de control intercepta el texto `/new` para crear una sesión nueva del
      panel y cambiar a ella, excepto cuando `session.dmScope: "main"` está configurado
      y el elemento principal actual es la sesión principal del agente; en ese caso, `/new`
      restablece la sesión principal sin sustituirla. El texto `/reset` continúa ejecutando el
      restablecimiento sin sustitución del Gateway. Use `/model default` cuando quiera borrar una
      selección de modelo fijada para la sesión.
    </Note>

  </Accordion>

  <Accordion title="Controles del modelo y la ejecución">
    | Comando | Descripción |
    | --- | --- |
    | `/think <level\|default>` | Establece el nivel de razonamiento o borra la sustitución de la sesión. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Activa o desactiva la salida detallada. Alias: `/v` |
    | `/trace on\|off` | Activa o desactiva la salida de seguimiento de plugins para la sesión actual |
    | `/fast [status\|auto\|on\|off\|default]` | Muestra, establece o borra el modo rápido |
    | `/reasoning [on\|off\|stream]` | Activa o desactiva la visibilidad del razonamiento. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Activa o desactiva el modo elevado. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Muestra o establece los valores predeterminados de ejecución |
    | `/login [codex\|openai\|openai-codex]` | Empareja el inicio de sesión de Codex/OpenAI desde un chat privado o una sesión de la interfaz web. Solo para el propietario o el administrador |
    | `/model [name\|#\|status]` | Muestra o establece el modelo |
    | `/models [provider] [page] [limit=<n>\|all]` | Enumera los proveedores o modelos configurados o disponibles mediante autenticación |
    | `/queue <mode>` | Gestiona el comportamiento de la cola de ejecuciones activas. Consulte [Cola](/es/concepts/queue) y [Dirección de la cola](/es/concepts/queue-steering) |
    | `/steer <message>` | Inserta indicaciones en la ejecución activa. Alias: `/tell`. Consulte [Dirigir](/es/tools/steer) |

    <AccordionGroup>
      <Accordion title="Seguridad de los modos detallado, seguimiento, rápido y razonamiento">
        - `/verbose` sirve para depuración; manténgalo **desactivado** durante el uso normal.
        - `/trace` solo revela líneas de seguimiento o depuración propiedad de plugins; la salida detallada normal permanece desactivada.
        - `/fast auto|on|off` conserva una sustitución de sesión; use la opción `inherit` de la interfaz de sesiones para borrarla.
        - `/fast` es específico del proveedor: OpenAI/Codex lo asignan a `service_tier=priority`; las solicitudes directas a Anthropic lo asignan a `service_tier=auto` o `standard_only`.
        - `/reasoning`, `/verbose` y `/trace` son arriesgados en entornos grupales, ya que pueden revelar razonamiento interno o diagnósticos de plugins. Manténgalos desactivados en los chats grupales.

      </Accordion>
      <Accordion title="Detalles del cambio de modelo">
        - `/model` conserva inmediatamente el nuevo modelo en la sesión.
        - Si el agente está inactivo, la siguiente ejecución lo utiliza de inmediato.
        - Si hay una ejecución activa, el cambio se marca como pendiente y se aplica en el siguiente punto de reintento limpio.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Detección y estado">
    | Comando | Descripción |
    | --- | --- |
    | `/help` | Muestra el resumen breve de ayuda |
    | `/commands` | Muestra el catálogo de comandos generado |
    | `/tools [compact\|verbose]` | Muestra lo que el agente actual puede utilizar en este momento |
    | `/status` | Muestra el estado de ejecución y del entorno, el tiempo de actividad del Gateway y del sistema, el estado de los plugins, además del uso y la cuota de los proveedores |
    | `/status plugins` | Muestra información detallada sobre el estado de los plugins: errores de carga, cuarentenas, fallos de plugins de canales, problemas de dependencias y avisos de compatibilidad. Requiere `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gestiona el [objetivo](/es/tools/goal) persistente de la sesión actual |
    | `/diagnostics [note]` | Flujo de informes de soporte exclusivo del propietario. Solicita aprobación para la ejecución cada vez |
    | `/openclaw <request>` | Ejecuta el asistente de configuración y reparación de OpenClaw desde un mensaje directo del propietario |
    | `/tasks` | Enumera las tareas en segundo plano activas o recientes de la sesión actual |
    | `/context [list\|detail\|map\|json]` | Explica cómo se construye el contexto |
    | `/whoami` | Muestra el identificador del remitente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controla el pie de uso de cada respuesta (`reset`/`inherit`/`clear`/`default` borra la sustitución de la sesión para volver a heredar el valor predeterminado configurado) o imprime un resumen local de costes |
  </Accordion>

  <Accordion title="Skills, listas de permitidos, aprobaciones">
    | Comando | Descripción |
    | --- | --- |
    | `/skill <name> [input]` | Ejecutar una skill por nombre |
    | `/learn [request]` | Redactar una skill revisable a partir de la conversación actual o de fuentes especificadas mediante el [Taller de skills](/es/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gestionar entradas de la lista de permitidos. Solo texto |
    | `/approve <id> <decision>` | Resolver solicitudes de aprobación de ejecución o de plugins |
    | `/btw <question>` | Hacer una pregunta secundaria sin cambiar el contexto de la sesión. Alias: `/side`. Véase [BTW](/es/tools/btw) |
  </Accordion>

  <Accordion title="Subagentes y ACP">
    | Comando | Descripción |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspeccionar las ejecuciones de subagentes de la sesión actual |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gestionar sesiones ACP y opciones del entorno de ejecución. Los controles del entorno de ejecución requieren la identidad del propietario externo o del administrador interno del Gateway |
    | `/focus <target>` | Vincular el hilo actual de Discord o el tema de Telegram a un destino de sesión |
    | `/unfocus` | Eliminar la vinculación del hilo actual |
    | `/agents` | Mostrar los agentes vinculados a hilos de la sesión actual |
  </Accordion>

  <Accordion title="Escrituras y administración exclusivas del propietario">
    | Comando | Requiere | Descripción |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Leer o escribir `openclaw.json`. Solo para el propietario |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Leer o escribir la configuración de servidores MCP gestionada por OpenClaw. Solo para el propietario |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspeccionar o modificar el estado de los plugins. Las escrituras son exclusivas del propietario. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Sustituciones de configuración exclusivas del entorno de ejecución. Solo para el propietario |
    | `/restart` | `commands.restart: true` (predeterminado) | Reiniciar OpenClaw |
    | `/send on\|off\|inherit` | propietario | Establecer la política de envío |
  </Accordion>

  <Accordion title="Voz, TTS y control de canales">
    | Comando | Descripción |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controlar TTS. Véase [TTS](/es/tools/tts) |
    | `/activation mention\|always` | Establecer el modo de activación de grupos |
    | `/bash <command>` | Ejecutar un comando de shell en el host. Alias: `! <command>`. Requiere `commands.bash: true` |
    | `!poll [sessionId]` | Consultar una tarea de bash en segundo plano |
    | `!stop [sessionId]` | Detener una tarea de bash en segundo plano |
  </Accordion>
</AccordionGroup>

### Comandos de acoplamiento

Los comandos de acoplamiento cambian la ruta de respuesta de la sesión activa a otro canal vinculado.
Consulte [Acoplamiento de canales](/es/concepts/channel-docking) para obtener información sobre la configuración y la resolución de problemas.

Generados a partir de plugins de canal compatibles con comandos nativos:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Los comandos de acoplamiento requieren `session.identityLinks`. El remitente de origen y el interlocutor de destino
deben pertenecer al mismo grupo de identidades.

### Comandos de plugins incluidos

| Comando                                                 | Descripción                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Activar o desactivar el Dreaming de la memoria (propietario o administrador del Gateway). Véase [Dreaming](/es/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gestionar el emparejamiento de dispositivos. Véase [Emparejamiento](/es/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Habilitar temporalmente comandos de Node de alto riesgo (cámara/pantalla/ordenador/escrituras). Véase [Uso del ordenador](/es/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Gestionar la configuración de voz de Talk. Nombre nativo en Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Enviar ajustes preestablecidos de tarjetas enriquecidas de LINE. Véase [LINE](/es/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Vincular, dirigir e inspeccionar el arnés del servidor de aplicaciones de Codex (estado, hilos, reanudación, modelo, modo rápido, permisos, compactación, revisión, MCP, skills y más). Véase [Arnés de Codex](/es/plugins/codex-harness) |

Solo para QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandos de skills

Las skills que pueden invocar los usuarios se exponen como comandos con barra:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- Las skills pueden registrarse como comandos directos (p. ej., `/prose` para OpenProse).
- El registro de comandos nativos de skills se controla mediante `commands.nativeSkills` y
  `channels.<provider>.commands.nativeSkills`.
- Los nombres se normalizan a `a-z0-9_` (máx. 32 caracteres); las colisiones reciben sufijos numéricos.

<AccordionGroup>
  <Accordion title="Despacho de comandos de skills">
    De forma predeterminada, los comandos de skills se dirigen al modelo como una solicitud normal.

    Las skills pueden declarar `command-dispatch: tool` para dirigirse directamente a una herramienta
    (de forma determinista, sin intervención del modelo). Ejemplo: `/prose` (plugin OpenProse)
    — consulte [OpenProse](/es/prose).

  </Accordion>
  <Accordion title="Argumentos de comandos nativos">
    Discord utiliza el autocompletado para las opciones dinámicas y menús de botones cuando se omiten
    argumentos obligatorios. Telegram y Slack muestran un menú de botones para los comandos con
    opciones. Las opciones dinámicas se resuelven según el modelo de la sesión de destino, por lo que las
    opciones específicas del modelo, como los niveles de `/think`, siguen la sustitución `/model` de la sesión.
  </Accordion>
</AccordionGroup>

## `/tools`: qué puede usar ahora el agente

`/tools` responde una pregunta sobre el entorno de ejecución: **qué puede usar este agente ahora mismo en esta
conversación**, no un catálogo de configuración estático.

```text
/tools         # vista compacta
/tools verbose # con descripciones breves
```

Los resultados se limitan a la sesión. Cambiar de agente, canal, hilo, autorización del remitente
o modelo puede cambiar la salida. Para editar perfiles y sustituciones,
utilice el panel Tools de la interfaz de control o las superficies de configuración.

## `/model`: selección de modelos

```text
/model             # mostrar selector de modelos
/model list        # igual
/model 3           # seleccionar por número en el selector
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # borrar la selección de modelo de la sesión
/model status      # vista detallada con endpoint y modo de API
```

En Discord, `/model` y `/models` abren un selector interactivo con listas desplegables de proveedor y
modelo. El selector respeta `agents.defaults.models`, incluidas las
entradas `provider/*`.

## `/config`: escrituras de configuración en disco

<Note>
  Solo para el propietario. Deshabilitadas de forma predeterminada; habilítelas con `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configuración se valida antes de escribirla. Los cambios no válidos se rechazan. Las actualizaciones de `/config`
se conservan tras los reinicios.

## `/mcp`: configuración de servidores MCP

<Note>
  Solo para el propietario. Deshabilitada de forma predeterminada; habilítela con `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` almacena la configuración en la configuración de OpenClaw, no en los ajustes del proyecto del agente integrado.
`/mcp show` oculta los campos que contienen credenciales, los valores de indicadores de credenciales
reconocidos y los argumentos con formatos conocidos de secretos. Cuando se ejecuta desde un grupo, la
configuración se envía de forma privada al propietario; si no hay disponible una ruta privada hacia este,
el comando falla de forma segura y le solicita que vuelva a intentarlo desde un
chat directo.

## `/debug`: sustituciones exclusivas del entorno de ejecución

<Note>
  Solo para el propietario. Deshabilitadas de forma predeterminada; habilítelas con `commands.debug: true`.
  Las sustituciones se aplican de inmediato a las nuevas lecturas de configuración, pero **no** se escriben en el disco.
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
  Las escrituras son exclusivas del propietario. Deshabilitada de forma predeterminada; habilítela con `commands.plugins: true`.
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

`/plugins enable|disable` actualiza la configuración de plugins y vuelve a cargar en caliente el entorno de ejecución de
plugins del Gateway para los nuevos turnos del agente. `/plugins install` reinicia automáticamente los
Gateways gestionados porque los módulos de código fuente de los plugins han cambiado. Las instalaciones de ClawHub
de confianza y del catálogo oficial no necesitan confirmación adicional. Las fuentes arbitrarias de npm,
git, archivos, `npm-pack:` y rutas locales muestran una advertencia sobre su procedencia y
requieren añadir `--force` al final después de revisar el código fuente. Este indicador confirma
la procedencia y permite sustituir una instalación existente; no omite
`security.installPolicy` ni las comprobaciones de seguridad del instalador. Las versiones de ClawHub con
advertencias de riesgo siguen requiriendo el indicador independiente y exclusivo de shell
`--acknowledge-clawhub-risk`. Las instalaciones de marketplace, vinculadas y fijadas también
siguen siendo exclusivas del shell.

## `/trace`: salida de trazas de plugins

```text
/trace          # mostrar el estado actual de las trazas
/trace on
/trace off
```

`/trace` muestra las líneas de traza y depuración de plugins limitadas a la sesión sin activar el modo
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
- No se escribe en el historial de transcripciones.

Consulte [Preguntas secundarias de BTW](/es/tools/btw) para conocer el comportamiento completo.

## Notas sobre las superficies

<AccordionGroup>
  <Accordion title="Ámbito de la sesión por superficie">
    - **Comandos de texto:** se ejecutan en la sesión de chat normal (los mensajes directos comparten `main`; los grupos tienen su propia sesión).
    - **Comandos nativos de Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandos nativos de Slack:** `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
    - **Comandos nativos de Telegram:** `telegram:slash:<userId>` (se dirigen a la sesión del chat mediante `CommandTargetSessionKey`)
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
    - Los mensajes que solo contienen comandos de remitentes incluidos en la lista de permitidos se procesan inmediatamente (omiten la cola y el modelo).
    - Los atajos en línea (`/help`, `/commands`, `/status`, `/whoami`) también funcionan insertados en mensajes normales y se eliminan antes de que el modelo vea el texto restante.
    - Los mensajes no autorizados que solo contienen comandos se ignoran silenciosamente; los tokens `/...` en línea se tratan como texto sin formato.

  </Accordion>
  <Accordion title="Notas sobre los argumentos">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (`/think: high`, `/send: on`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o el nombre de un proveedor (coincidencia aproximada); si no hay ninguna coincidencia, el texto se trata como el cuerpo del mensaje.
    - `/allowlist add|remove` requiere `commands.config: true` y respeta el `configWrites` del canal.

  </Accordion>
</AccordionGroup>

## Uso y estado del proveedor

- El **uso o la cuota del proveedor** (p. ej., «Claude: 80 % restante») se muestra en `/status` para el proveedor del modelo actual cuando el seguimiento del uso está habilitado.
- Las **líneas de tokens/caché** de `/status` pueden recurrir a la entrada de uso más reciente de la transcripción cuando la instantánea de la sesión activa contiene pocos datos.
- **Ejecución frente a entorno de ejecución:** `/status` informa de `Execution` para la ruta efectiva del entorno aislado y de `Runtime` para indicar quién ejecuta la sesión: `OpenClaw Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP.
- **Tokens/coste por respuesta:** se controla mediante `/usage off|tokens|full`.
- `/model status` se refiere a modelos, autenticación y endpoints, no al uso.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Skills" href="/es/tools/skills" icon="puzzle-piece">
    Cómo se registran y restringen los comandos de barra de las Skills.
  </Card>
  <Card title="Creación de Skills" href="/es/tools/creating-skills" icon="hammer">
    Cree una Skill que registre su propio comando de barra.
  </Card>
  <Card title="Por cierto" href="/es/tools/btw" icon="comments">
    Preguntas secundarias sin cambiar el contexto de la sesión.
  </Card>
  <Card title="Orientación" href="/es/tools/steer" icon="compass">
    Guíe al agente durante la ejecución con `/steer`.
  </Card>
</CardGroup>
