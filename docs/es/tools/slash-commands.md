---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o permisos
summary: 'Comandos con barra: texto frente a nativos, configuración y comandos compatibles'
title: Comandos con barra
x-i18n:
    generated_at: "2026-04-23T14:08:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos con barra

Los comandos son gestionados por el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que empiece por `/`.
El comando de chat bash solo para host usa `! <cmd>` (con `/bash <cmd>` como alias).

Hay dos sistemas relacionados:

- **Comandos**: mensajes independientes `/...`.
- **Directivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Las directivas se eliminan del mensaje antes de que lo vea el modelo.
  - En mensajes de chat normales (no solo de directivas), se tratan como “indicaciones en línea” y **no** conservan la configuración de la sesión.
  - En mensajes solo de directivas (el mensaje contiene únicamente directivas), se conservan en la sesión y responden con una confirmación.
  - Las directivas solo se aplican a **remitentes autorizados**. Si `commands.allowFrom` está establecido, es la única
    lista de permitidos utilizada; en caso contrario, la autorización proviene de las listas de permitidos/vinculación del canal más `commands.useAccessGroups`.
    Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

También hay algunos **atajos en línea** (solo remitentes permitidos/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Se ejecutan inmediatamente, se eliminan antes de que el modelo vea el mensaje y el texto restante continúa por el flujo normal.

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

- `commands.text` (predeterminado `true`) habilita el análisis de `/...` en mensajes de chat.
  - En superficies sin comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), los comandos de texto siguen funcionando incluso si estableces esto en `false`.
- `commands.native` (predeterminado `"auto"`) registra comandos nativos.
  - Auto: activado para Discord/Telegram; desactivado para Slack (hasta que añadas comandos con barra); ignorado para proveedores sin compatibilidad nativa.
  - Establece `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para reemplazarlo por proveedor (booleano o `"auto"`).
  - `false` borra los comandos registrados anteriormente en Discord/Telegram al iniciar. Los comandos de Slack se gestionan en la app de Slack y no se eliminan automáticamente.
- `commands.nativeSkills` (predeterminado `"auto"`) registra comandos de **Skills** de forma nativa cuando es compatible.
  - Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un comando con barra por cada Skill).
  - Establece `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para reemplazarlo por proveedor (booleano o `"auto"`).
- `commands.bash` (predeterminado `false`) habilita `! <cmd>` para ejecutar comandos de shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos de `tools.elevated`).
- `commands.bashForegroundMs` (predeterminado `2000`) controla cuánto tiempo espera bash antes de cambiar a modo en segundo plano (`0` lo envía inmediatamente al segundo plano).
- `commands.config` (predeterminado `false`) habilita `/config` (lee/escribe `openclaw.json`).
- `commands.mcp` (predeterminado `false`) habilita `/mcp` (lee/escribe configuración MCP gestionada por OpenClaw en `mcp.servers`).
- `commands.plugins` (predeterminado `false`) habilita `/plugins` (descubrimiento/estado de plugins más controles de instalación + activación/desactivación).
- `commands.debug` (predeterminado `false`) habilita `/debug` (anulaciones solo de tiempo de ejecución).
- `commands.restart` (predeterminado `true`) habilita `/restart` más acciones de herramientas de reinicio del gateway.
- `commands.ownerAllowFrom` (opcional) establece la lista explícita de permitidos del propietario para superficies de comandos/herramientas solo para el propietario. Esto es independiente de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` por canal (opcional, predeterminado `false`) hace que los comandos solo para el propietario requieran **identidad de propietario** para ejecutarse en esa superficie. Cuando es `true`, el remitente debe coincidir con un candidato de propietario resuelto (por ejemplo, una entrada en `commands.ownerAllowFrom` o metadatos nativos de propietario del proveedor) o tener alcance interno `operator.admin` en un canal de mensajes interno. Una entrada comodín en `allowFrom` del canal, o una lista vacía/no resuelta de candidatos de propietario, **no** es suficiente: los comandos solo para el propietario fallan en cerrado en ese canal. Déjalo desactivado si quieres que los comandos solo para el propietario estén restringidos únicamente por `ownerAllowFrom` y las listas de permitidos estándar de comandos.
- `commands.ownerDisplay` controla cómo aparecen los ids del propietario en el prompt del sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` establece opcionalmente el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) establece una lista de permitidos por proveedor para la autorización de comandos. Cuando está configurado, es la
  única fuente de autorización para comandos y directivas (se ignoran las listas de permitidos/vinculación del canal y `commands.useAccessGroups`).
  Usa `"*"` como valor predeterminado global; las claves específicas del proveedor lo reemplazan.
- `commands.useAccessGroups` (predeterminado `true`) aplica listas de permitidos/políticas a los comandos cuando `commands.allowFrom` no está establecido.

## Lista de comandos

Fuente de referencia actual:

- los comandos integrados del núcleo provienen de `src/auto-reply/commands-registry.shared.ts`
- los comandos dock generados provienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de plugins provienen de llamadas `registerCommand()` del Plugin
- la disponibilidad real en tu gateway sigue dependiendo de flags de configuración, superficie del canal y plugins instalados/habilitados

### Comandos integrados del núcleo

Comandos integrados disponibles hoy:

- `/new [model]` inicia una sesión nueva; `/reset` es el alias de reinicio.
- `/reset soft [message]` mantiene la transcripción actual, elimina los ids reutilizados de sesión del backend de CLI y vuelve a ejecutar la carga del prompt de inicio/sistema en el mismo lugar.
- `/compact [instructions]` compacta el contexto de la sesión. Consulta [/concepts/compaction](/es/concepts/compaction).
- `/stop` aborta la ejecución actual.
- `/session idle <duration|off>` y `/session max-age <duration|off>` gestionan el vencimiento de la vinculación del hilo.
- `/think <level>` establece el nivel de pensamiento. Las opciones provienen del perfil del proveedor del modelo activo; los niveles habituales son `off`, `minimal`, `low`, `medium` y `high`, con niveles personalizados como `xhigh`, `adaptive`, `max` o el binario `on` solo cuando son compatibles. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` alterna la salida detallada. Alias: `/v`.
- `/trace on|off` alterna la salida de rastreo del Plugin para la sesión actual.
- `/fast [status|on|off]` muestra o establece el modo rápido.
- `/reasoning [on|off|stream]` alterna la visibilidad del razonamiento. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna el modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece los valores predeterminados de exec.
- `/model [name|#|status]` muestra o establece el modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` enumera proveedores o modelos de un proveedor.
- `/queue <mode>` gestiona el comportamiento de la cola (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) más opciones como `debounce:2s cap:25 drop:summarize`.
- `/help` muestra el resumen breve de ayuda.
- `/commands` muestra el catálogo de comandos generado.
- `/tools [compact|verbose]` muestra lo que el agente actual puede usar en este momento.
- `/status` muestra el estado del tiempo de ejecución, incluidas las etiquetas `Runtime`/`Runner` y el uso/cuota del proveedor cuando están disponibles.
- `/tasks` enumera las tareas en segundo plano activas/recientes de la sesión actual.
- `/context [list|detail|json]` explica cómo se ensambla el contexto.
- `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
- `/export-trajectory [path]` exporta un [bundle de trayectoria](/es/tools/trajectory) JSONL para la sesión actual. Alias: `/trajectory`.
- `/whoami` muestra tu id de remitente. Alias: `/id`.
- `/skill <name> [input]` ejecuta una Skill por nombre.
- `/allowlist [list|add|remove] ...` gestiona entradas de la lista de permitidos. Solo texto.
- `/approve <id> <decision>` resuelve prompts de aprobación de exec.
- `/btw <question>` hace una pregunta lateral sin cambiar el contexto futuro de la sesión. Consulta [/tools/btw](/es/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestiona ejecuciones de subagentes para la sesión actual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestiona sesiones ACP y opciones de tiempo de ejecución.
- `/focus <target>` vincula el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
- `/unfocus` elimina la vinculación actual.
- `/agents` enumera los agentes vinculados a hilos para la sesión actual.
- `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
- `/steer <id|#> <message>` envía dirección a un subagente en ejecución. Alias: `/tell`.
- `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo para propietarios. Requiere `commands.config: true`.
- `/mcp show|get|set|unset` lee o escribe la configuración de servidor MCP gestionada por OpenClaw en `mcp.servers`. Solo para propietarios. Requiere `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado del Plugin. `/plugin` es un alias. Solo para propietarios en escrituras. Requiere `commands.plugins: true`.
- `/debug show|set|unset|reset` gestiona anulaciones de configuración solo en tiempo de ejecución. Solo para propietarios. Requiere `commands.debug: true`.
- `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen local de costos.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulta [/tools/tts](/es/tools/tts).
- `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; establece `commands.restart: false` para deshabilitarlo.
- `/activation mention|always` establece el modo de activación de grupos.
- `/send on|off|inherit` establece la política de envío. Solo para propietarios.
- `/bash <command>` ejecuta un comando de shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permitidos de `tools.elevated`.
- `!poll [sessionId]` comprueba un trabajo bash en segundo plano.
- `!stop [sessionId]` detiene un trabajo bash en segundo plano.

### Comandos dock generados

Los comandos dock se generan a partir de plugins de canal con compatibilidad con comandos nativos. Conjunto incluido actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de Plugins incluidos

Los Plugins incluidos pueden añadir más comandos con barra. Comandos incluidos actuales en este repositorio:

- `/dreaming [on|off|status|help]` alterna Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestiona el flujo de vinculación/configuración de dispositivos. Consulta [Pairing](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` activa temporalmente comandos Node de teléfono de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` gestiona la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía ajustes predefinidos de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecciona y controla el arnés app-server de Codex incluido. Consulta [Codex Harness](/es/plugins/codex-harness).
- Comandos solo de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de Skills

Las Skills invocables por el usuario también se exponen como comandos con barra:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- las Skills también pueden aparecer como comandos directos como `/prose` cuando la Skill/el Plugin los registra.
- el registro nativo de comandos de Skills está controlado por `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.

Notas:

- Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
- Para el desglose completo de uso por proveedor, usa `openclaw status --usage`.
- `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
- En canales con varias cuentas, `/allowlist --account <id>` dirigido a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
- `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costos a partir de los registros de sesión de OpenClaw.
- `/restart` está habilitado de forma predeterminada; establece `commands.restart: false` para deshabilitarlo.
- `/plugins install <spec>` acepta las mismas especificaciones de Plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
- `/plugins enable|disable` actualiza la configuración del Plugin y puede solicitar un reinicio.
- Comando nativo solo de Discord: `/vc join|leave|status` controla canales de voz (requiere `channels.discord.voice` y comandos nativos; no disponible como texto).
- Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que las vinculaciones efectivas de hilos estén habilitadas (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
- Referencia de comandos ACP y comportamiento del tiempo de ejecución: [ACP Agents](/es/tools/acp-agents).
- `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en uso normal.
- `/trace` es más limitado que `/verbose`: solo revela líneas de rastreo/depuración propiedad del Plugin y mantiene desactivado el ruido normal detallado de herramientas.
- `/fast on|off` conserva una anulación de sesión. Usa la opción `inherit` de la interfaz de sesiones para borrarla y volver a los valores predeterminados de configuración.
- `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos Responses, mientras que las solicitudes directas públicas a Anthropic, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
- Los resúmenes de fallo de herramientas siguen mostrándose cuando es relevante, pero el texto detallado del fallo solo se incluye cuando `/verbose` está en `on` o `full`.
- `/reasoning`, `/verbose` y `/trace` son arriesgados en configuraciones de grupo: pueden revelar razonamiento interno, salida de herramientas o diagnósticos de Plugin que no pretendías exponer. Es preferible dejarlos desactivados, especialmente en chats grupales.
- `/model` conserva inmediatamente el nuevo modelo de sesión.
- Si el agente está inactivo, la siguiente ejecución lo usará de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
- Si la actividad de herramientas o la salida de respuesta ya ha comenzado, el cambio pendiente puede permanecer en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- **Ruta rápida:** los mensajes que contienen solo comandos de remitentes permitidos se gestionan inmediatamente (omiten cola + modelo).
- **Restricción por mención en grupos:** los mensajes que contienen solo comandos de remitentes permitidos omiten los requisitos de mención.
- **Atajos en línea (solo remitentes permitidos):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
  - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
- Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Los mensajes solo de comandos no autorizados se ignoran silenciosamente, y los tokens `/...` en línea se tratan como texto sin formato.
- **Comandos de Skills:** las Skills `user-invocable` se exponen como comandos con barra. Los nombres se sanean a `a-z0-9_` (máximo 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo, `_2`).
  - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden comandos por Skill).
  - De forma predeterminada, los comandos de Skills se reenvían al modelo como una solicitud normal.
  - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
  - Ejemplo: `/prose` (Plugin OpenProse) — consulta [OpenProse](/es/prose).
- **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos requeridos). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento.

## `/tools`

`/tools` responde a una pregunta de tiempo de ejecución, no de configuración: **qué puede usar este agente ahora mismo en
esta conversación**.

- `/tools` predeterminado es compacto y está optimizado para un escaneo rápido.
- `/tools verbose` añade descripciones cortas.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo cambio de modo como `compact|verbose`.
- Los resultados tienen alcance de sesión, por lo que cambiar de agente, canal, hilo, autorización del remitente o modelo puede
  cambiar la salida.
- `/tools` incluye herramientas realmente accesibles en tiempo de ejecución, incluidas herramientas del núcleo, herramientas de
  Plugin conectadas y herramientas propiedad del canal.

Para editar perfiles y anulaciones, usa el panel Tools de la interfaz Control o las superficies de configuración/catálogo en lugar
de tratar `/tools` como un catálogo estático.

## Superficies de uso (qué aparece dónde)

- **Uso/cuota del proveedor** (ejemplo: “Claude 80% left”) aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% left`; para MiniMax, los campos de porcentaje solo restante se invierten antes de mostrarse, y las respuestas `model_remains` priorizan la entrada del modelo de chat más una etiqueta de plan con etiqueta de modelo.
- **Líneas de tokens/caché** en `/status` pueden recurrir a la última entrada de uso de la transcripción cuando la instantánea de la sesión activa es escasa. Los valores activos distintos de cero siguen teniendo prioridad, y la reserva de transcripción también puede recuperar la etiqueta activa del modelo de tiempo de ejecución más un total orientado a prompts más grande cuando faltan los totales almacenados o son menores.
- **Tiempo de ejecución frente a runner:** `/status` informa `Runtime` para la ruta de ejecución efectiva y el estado del sandbox, y `Runner` para quién está ejecutando realmente la sesión: Pi integrado, un proveedor respaldado por CLI o un arnés/backend ACP.
- **Tokens/costo por respuesta** está controlado por `/usage off|tokens|full` (se añade a las respuestas normales).
- `/model status` trata de **modelos/autenticación/endpoints**, no de uso.

## Selección de modelo (`/model`)

`/model` se implementa como una directiva.

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

- `/model` y `/model list` muestran un selector compacto numerado (familia de modelos + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de envío.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint del proveedor configurado (`baseUrl`) y el modo API (`api`) cuando están disponibles.

## Anulaciones de depuración

`/debug` te permite establecer anulaciones de configuración **solo de tiempo de ejecución** (memoria, no disco). Solo para propietarios. Deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- Las anulaciones se aplican inmediatamente a nuevas lecturas de configuración, pero **no** escriben en `openclaw.json`.
- Usa `/debug reset` para borrar todas las anulaciones y volver a la configuración en disco.

## Salida de rastreo de Plugin

`/trace` te permite alternar **líneas de rastreo/depuración de Plugin con alcance de sesión** sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumentos muestra el estado actual de rastreo de la sesión.
- `/trace on` habilita líneas de rastreo de Plugin para la sesión actual.
- `/trace off` las vuelve a deshabilitar.
- Las líneas de rastreo de Plugin pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.
- `/trace` no sustituye a `/debug`; `/debug` sigue gestionando las anulaciones de configuración solo de tiempo de ejecución.
- `/trace` no sustituye a `/verbose`; la salida detallada normal de herramientas/estado sigue perteneciendo a `/verbose`.

## Actualizaciones de configuración

`/config` escribe en tu configuración en disco (`openclaw.json`). Solo para propietarios. Deshabilitado de forma predeterminada; habilítalo con `commands.config: true`.

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
- Las actualizaciones de `/config` se conservan tras los reinicios.

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidor MCP gestionadas por OpenClaw en `mcp.servers`. Solo para propietarios. Deshabilitado de forma predeterminada; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notas:

- `/mcp` almacena configuración en la configuración de OpenClaw, no en ajustes de proyecto propiedad de Pi.
- Los adaptadores de tiempo de ejecución deciden qué transportes son realmente ejecutables.

## Actualizaciones de Plugin

`/plugins` permite a los operadores inspeccionar los plugins detectados y alternar su activación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Deshabilitado de forma predeterminada; habilítalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notas:

- `/plugins list` y `/plugins show` usan descubrimiento real de plugins frente al espacio de trabajo actual más la configuración en disco.
- `/plugins enable|disable` actualiza solo la configuración del Plugin; no instala ni desinstala plugins.
- Después de cambios de activación/desactivación, reinicia el gateway para aplicarlos.

## Notas sobre superficies

- **Comandos de texto** se ejecutan en la sesión normal de chat (los MD comparten `main`, los grupos tienen su propia sesión).
- **Comandos nativos** usan sesiones aisladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (apunta a la sesión de chat mediante `CommandTargetSessionKey`)
- **`/stop`** apunta a la sesión de chat activa para que pueda abortar la ejecución actual.
- **Slack:** `channels.slack.slashCommand` sigue siendo compatible para un único comando de estilo `/openclaw`. Si habilitas `commands.native`, debes crear un comando con barra de Slack por cada comando integrado (mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.
  - Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

## Preguntas laterales BTW

`/btw` es una **pregunta lateral** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada independiente **sin herramientas** y de una sola vez,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de la transcripción,
- se entrega como resultado lateral en vivo en lugar de como un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la
tarea principal sigue en marcha.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [BTW Side Questions](/es/tools/btw) para el comportamiento completo y los
detalles de la experiencia del cliente.
