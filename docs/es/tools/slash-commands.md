---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o de los permisos
summary: 'Comandos slash: texto vs nativos, configuración y comandos compatibles'
title: Comandos slash
x-i18n:
    generated_at: "2026-04-08T06:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a7ee7f1a8012058279b9e632889b291d4e659e4ec81209ca8978afbb9ad4b96
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos slash

Los comandos los gestiona el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que comience con `/`.
El comando de chat bash solo para el host usa `! <cmd>` (con `/bash <cmd>` como alias).

Hay dos sistemas relacionados:

- **Comandos**: mensajes `/...` independientes.
- **Directivas**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
  - En mensajes de chat normales (no solo de directivas), se tratan como “sugerencias en línea” y **no** conservan la configuración de la sesión.
  - En mensajes solo de directivas (el mensaje contiene únicamente directivas), se conservan en la sesión y responden con un acuse de recibo.
  - Las directivas solo se aplican a **remitentes autorizados**. Si `commands.allowFrom` está configurado, es la única
    lista de permitidos que se usa; de lo contrario, la autorización proviene de las listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`.
    Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

También hay algunos **atajos en línea** (solo remitentes autorizados/en lista de permitidos): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Se ejecutan de inmediato, se eliminan antes de que el modelo vea el mensaje y el texto restante continúa por el flujo normal.

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

- `commands.text` (predeterminado: `true`) habilita el análisis de `/...` en mensajes de chat.
  - En superficies sin comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), los comandos de texto siguen funcionando aunque establezcas esto en `false`.
- `commands.native` (predeterminado: `"auto"`) registra comandos nativos.
  - Auto: activado para Discord/Telegram; desactivado para Slack (hasta que agregues comandos slash); ignorado para proveedores sin compatibilidad nativa.
  - Establece `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para sobrescribirlo por proveedor (bool o `"auto"`).
  - `false` borra los comandos registrados previamente en Discord/Telegram al iniciar. Los comandos de Slack se gestionan en la aplicación de Slack y no se eliminan automáticamente.
- `commands.nativeSkills` (predeterminado: `"auto"`) registra comandos de **Skills** de forma nativa cuando hay compatibilidad.
  - Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un comando slash por Skill).
  - Establece `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para sobrescribirlo por proveedor (bool o `"auto"`).
- `commands.bash` (predeterminado: `false`) habilita `! <cmd>` para ejecutar comandos del shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos de `tools.elevated`).
- `commands.bashForegroundMs` (predeterminado: `2000`) controla cuánto tiempo espera bash antes de cambiar al modo en segundo plano (`0` lo envía al segundo plano de inmediato).
- `commands.config` (predeterminado: `false`) habilita `/config` (lee/escribe `openclaw.json`).
- `commands.mcp` (predeterminado: `false`) habilita `/mcp` (lee/escribe la configuración de MCP administrada por OpenClaw en `mcp.servers`).
- `commands.plugins` (predeterminado: `false`) habilita `/plugins` (detección/estado de plugins más controles de instalación y habilitación/deshabilitación).
- `commands.debug` (predeterminado: `false`) habilita `/debug` (sobrescrituras solo en tiempo de ejecución).
- `commands.restart` (predeterminado: `true`) habilita `/restart` más las acciones de herramienta de reinicio del gateway.
- `commands.ownerAllowFrom` (opcional) establece la lista explícita de permitidos del propietario para superficies de comandos/herramientas solo para el propietario. Esto es independiente de `commands.allowFrom`.
- `commands.ownerDisplay` controla cómo aparecen los ID del propietario en el prompt del sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` opcionalmente establece el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) establece una lista de permitidos por proveedor para la autorización de comandos. Cuando está configurado, es la
  única fuente de autorización para comandos y directivas (las listas de permitidos/emparejamiento del canal y `commands.useAccessGroups`
  se ignoran). Usa `"*"` para un valor global predeterminado; las claves específicas del proveedor lo sobrescriben.
- `commands.useAccessGroups` (predeterminado: `true`) aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está configurado.

## Lista de comandos

Fuente de verdad actual:

- los integrados del núcleo provienen de `src/auto-reply/commands-registry.shared.ts`
- los comandos dock generados provienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de plugins provienen de llamadas `registerCommand()` del plugin
- la disponibilidad real en tu gateway sigue dependiendo de las marcas de configuración, la superficie del canal y los plugins instalados/habilitados

### Comandos integrados del núcleo

Comandos integrados disponibles hoy:

- `/new [model]` inicia una sesión nueva; `/reset` es el alias de restablecimiento.
- `/compact [instructions]` compacta el contexto de la sesión. Consulta [/concepts/compaction](/es/concepts/compaction).
- `/stop` aborta la ejecución actual.
- `/session idle <duration|off>` y `/session max-age <duration|off>` gestionan la caducidad de la vinculación al hilo.
- `/think <off|minimal|low|medium|high|xhigh>` establece el nivel de razonamiento. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` activa o desactiva la salida detallada. Alias: `/v`.
- `/fast [status|on|off]` muestra o establece el modo rápido.
- `/reasoning [on|off|stream]` activa o desactiva la visibilidad del razonamiento. Alias: `/reason`.
- `/elevated [on|off|ask|full]` activa o desactiva el modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece los valores predeterminados de exec.
- `/model [name|#|status]` muestra o establece el modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` enumera proveedores o modelos de un proveedor.
- `/queue <mode>` gestiona el comportamiento de la cola (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) más opciones como `debounce:2s cap:25 drop:summarize`.
- `/help` muestra el resumen breve de ayuda.
- `/commands` muestra el catálogo de comandos generado.
- `/tools [compact|verbose]` muestra lo que el agente actual puede usar ahora mismo.
- `/status` muestra el estado de tiempo de ejecución, incluido el uso/cuota del proveedor cuando esté disponible.
- `/tasks` enumera las tareas en segundo plano activas/recientes de la sesión actual.
- `/context [list|detail|json]` explica cómo se ensambla el contexto.
- `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
- `/whoami` muestra tu ID de remitente. Alias: `/id`.
- `/skill <name> [input]` ejecuta una Skill por nombre.
- `/allowlist [list|add|remove] ...` gestiona entradas de la lista de permitidos. Solo texto.
- `/approve <id> <decision>` resuelve solicitudes de aprobación de exec.
- `/btw <question>` hace una pregunta secundaria sin cambiar el contexto futuro de la sesión. Consulta [/tools/btw](/es/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestiona ejecuciones de subagentes para la sesión actual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestiona sesiones de ACP y opciones de tiempo de ejecución.
- `/focus <target>` vincula el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
- `/unfocus` elimina la vinculación actual.
- `/agents` enumera los agentes vinculados al hilo para la sesión actual.
- `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
- `/steer <id|#> <message>` envía instrucciones a un subagente en ejecución. Alias: `/tell`.
- `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo para el propietario. Requiere `commands.config: true`.
- `/mcp show|get|set|unset` lee o escribe la configuración del servidor MCP administrada por OpenClaw en `mcp.servers`. Solo para el propietario. Requiere `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado de los plugins. `/plugin` es un alias. Solo para el propietario en escrituras. Requiere `commands.plugins: true`.
- `/debug show|set|unset|reset` gestiona sobrescrituras de configuración solo en tiempo de ejecución. Solo para el propietario. Requiere `commands.debug: true`.
- `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen local de costos.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulta [/tools/tts](/es/tools/tts).
- `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; establece `commands.restart: false` para deshabilitarlo.
- `/activation mention|always` establece el modo de activación de grupo.
- `/send on|off|inherit` establece la política de envío. Solo para el propietario.
- `/bash <command>` ejecuta un comando del shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permitidos de `tools.elevated`.
- `!poll [sessionId]` comprueba un trabajo bash en segundo plano.
- `!stop [sessionId]` detiene un trabajo bash en segundo plano.

### Comandos dock generados

Los comandos dock se generan a partir de plugins de canal con compatibilidad de comandos nativos. Conjunto integrado actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins integrados

Los plugins integrados pueden añadir más comandos slash. Comandos integrados actuales en este repositorio:

- `/dreaming [on|off|status|help]` activa o desactiva el ensueño de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestiona el flujo de emparejamiento/configuración del dispositivo. Consulta [Pairing](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` activa temporalmente comandos del nodo del teléfono de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` gestiona la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- Comandos solo de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de Skills

Las Skills invocables por el usuario también se exponen como comandos slash:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- las Skills también pueden aparecer como comandos directos como `/prose` cuando la Skill/el plugin los registra.
- el registro nativo de comandos de Skills se controla con `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.

Notas:

- Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
- Para ver el desglose completo de uso por proveedor, usa `openclaw status --usage`.
- `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
- En canales con varias cuentas, `/allowlist --account <id>` orientado a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
- `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costos a partir de los registros de sesión de OpenClaw.
- `/restart` está habilitado de forma predeterminada; establece `commands.restart: false` para deshabilitarlo.
- `/plugins install <spec>` acepta las mismas especificaciones de plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
- `/plugins enable|disable` actualiza la configuración del plugin y puede solicitar un reinicio.
- Comando nativo solo de Discord: `/vc join|leave|status` controla los canales de voz (requiere `channels.discord.voice` y comandos nativos; no está disponible como texto).
- Los comandos de vinculación a hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que las vinculaciones efectivas a hilos estén habilitadas (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
- Referencia del comando ACP y comportamiento de tiempo de ejecución: [ACP Agents](/es/tools/acp-agents).
- `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en el uso normal.
- `/fast on|off` conserva una sobrescritura de sesión. Usa la opción `inherit` de la interfaz de usuario de Sessions para borrarla y volver a los valores predeterminados de configuración.
- `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes directas públicas a Anthropic, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
- Los resúmenes de errores de herramientas siguen mostrándose cuando corresponde, pero el texto detallado del error solo se incluye cuando `/verbose` está en `on` o `full`.
- `/reasoning` (y `/verbose`) son arriesgados en entornos de grupo: pueden revelar razonamiento interno o salida de herramientas que no pretendías exponer. Es preferible dejarlos desactivados, especialmente en chats grupales.
- `/model` conserva de inmediato el nuevo modelo de sesión.
- Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
- Si ya comenzó la actividad de herramientas o la salida de la respuesta, el cambio pendiente puede permanecer en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- **Ruta rápida:** los mensajes de solo comando de remitentes en lista de permitidos se gestionan de inmediato (omiten cola + modelo).
- **Restricción por mención en grupos:** los mensajes de solo comando de remitentes en lista de permitidos omiten los requisitos de mención.
- **Atajos en línea (solo remitentes en lista de permitidos):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el resto del mensaje.
  - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
- Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Los mensajes de solo comando no autorizados se ignoran silenciosamente y los tokens `/...` en línea se tratan como texto sin formato.
- **Comandos de Skills:** las Skills `user-invocable` se exponen como comandos slash. Los nombres se sanitizan a `a-z0-9_` (máximo 32 caracteres); las colisiones obtienen sufijos numéricos (por ejemplo, `_2`).
  - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden comandos por Skill).
  - De forma predeterminada, los comandos de Skills se reenvían al modelo como una solicitud normal.
  - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
  - Ejemplo: `/prose` (plugin OpenProse) — consulta [OpenProse](/es/prose).
- **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos obligatorios). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento.

## `/tools`

`/tools` responde a una pregunta de tiempo de ejecución, no a una pregunta de configuración: **qué puede usar este agente ahora mismo en
esta conversación**.

- El valor predeterminado de `/tools` es compacto y está optimizado para una lectura rápida.
- `/tools verbose` añade descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo cambio de modo que `compact|verbose`.
- Los resultados están limitados a la sesión, por lo que cambiar el agente, el canal, el hilo, la autorización del remitente o el modelo puede
  cambiar la salida.
- `/tools` incluye herramientas que realmente son accesibles en tiempo de ejecución, incluidas herramientas del núcleo, herramientas de
  plugins conectados y herramientas propiedad del canal.

Para editar perfiles y sobrescrituras, usa el panel Tools de la interfaz de usuario de Control o las superficies de config/catálogo en lugar
de tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra y dónde)

- **Uso/cuota del proveedor** (ejemplo: “Claude 80% restante”) aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% restante`; para MiniMax, los campos porcentuales de solo restante se invierten antes de mostrarse, y las respuestas `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan etiquetada con el modelo.
- Las **líneas de tokens/caché** en `/status` pueden recurrir a la última entrada de uso de la transcripción cuando la instantánea de sesión en vivo es escasa. Los valores en vivo existentes que no sean cero siguen teniendo prioridad, y el recurso a la transcripción también puede recuperar la etiqueta del modelo de tiempo de ejecución activo más un total orientado al prompt más grande cuando los totales almacenados faltan o son menores.
- **Tokens/costo por respuesta** se controla con `/usage off|tokens|full` (se agrega a las respuestas normales).
- `/model status` trata sobre **modelos/autenticación/endpoints**, no sobre el uso.

## Selección de modelo (`/model`)

`/model` está implementado como una directiva.

Ejemplos:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Notas:

- `/model` y `/model list` muestran un selector compacto numerado (familia de modelo + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de envío.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint del proveedor configurado (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

## Sobrescrituras de depuración

`/debug` te permite establecer sobrescrituras de configuración **solo en tiempo de ejecución** (memoria, no disco). Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- Las sobrescrituras se aplican de inmediato a las nuevas lecturas de configuración, pero **no** escriben en `openclaw.json`.
- Usa `/debug reset` para borrar todas las sobrescrituras y volver a la configuración en disco.

## Actualizaciones de configuración

`/config` escribe en tu configuración en disco (`openclaw.json`). Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.config: true`.

Ejemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Notas:

- La configuración se valida antes de escribir; los cambios no válidos se rechazan.
- Las actualizaciones de `/config` se conservan entre reinicios.

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidor MCP administradas por OpenClaw en `mcp.servers`. Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notas:

- `/mcp` almacena la configuración en la config de OpenClaw, no en los ajustes del proyecto propiedad de Pi.
- Los adaptadores de tiempo de ejecución deciden qué transportes son realmente ejecutables.

## Actualizaciones de plugins

`/plugins` permite a los operadores inspeccionar los plugins detectados y alternar su habilitación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Deshabilitado de forma predeterminada; habilítalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notas:

- `/plugins list` y `/plugins show` usan detección real de plugins en el espacio de trabajo actual más la configuración en disco.
- `/plugins enable|disable` actualiza solo la configuración del plugin; no instala ni desinstala plugins.
- Después de cambios de habilitación/deshabilitación, reinicia el gateway para aplicarlos.

## Notas de superficie

- Los **comandos de texto** se ejecutan en la sesión de chat normal (los mensajes directos comparten `main`, los grupos tienen su propia sesión).
- Los **comandos nativos** usan sesiones aisladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (se dirige a la sesión de chat mediante `CommandTargetSessionKey`)
- **`/stop`** apunta a la sesión de chat activa para que pueda abortar la ejecución actual.
- **Slack:** `channels.slack.slashCommand` sigue siendo compatible para un único comando estilo `/openclaw`. Si habilitas `commands.native`, debes crear un comando slash de Slack por cada comando integrado (los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.
  - Excepción de comando nativo de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

## Preguntas secundarias BTW

`/btw` es una **pregunta secundaria** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada independiente **sin herramientas**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de la transcripción,
- se entrega como un resultado lateral en vivo en lugar de como un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la
tarea principal sigue en curso.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [BTW Side Questions](/es/tools/btw) para ver el comportamiento completo y los
detalles de la experiencia de cliente.
