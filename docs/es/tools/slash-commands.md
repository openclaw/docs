---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o permisos
summary: 'Comandos con barra: texto vs nativos, configuración y comandos compatibles'
title: Comandos con barra
x-i18n:
    generated_at: "2026-04-12T23:33:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ef6f54500fa2ce3b873a8398d6179a0882b8bf6fba38f61146c64671055505e
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos con barra

Los comandos son gestionados por el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que empiece con `/`.
El comando de chat bash solo del host usa `! <cmd>` (con `/bash <cmd>` como alias).

Hay dos sistemas relacionados:

- **Comandos**: mensajes independientes `/...`.
- **Directivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
  - En mensajes de chat normales (no solo de directivas), se tratan como “sugerencias en línea” y **no** conservan la configuración de la sesión.
  - En mensajes solo de directivas (el mensaje contiene solo directivas), se conservan en la sesión y responden con una confirmación.
  - Las directivas solo se aplican para **remitentes autorizados**. Si se establece `commands.allowFrom`, esa es la única
    lista de permitidos que se usa; de lo contrario, la autorización proviene de las listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`.
    Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

También hay algunos **atajos en línea** (solo para remitentes incluidos en la lista de permitidos/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
  - Automático: activado para Discord/Telegram; desactivado para Slack (hasta que agregues slash commands); ignorado para proveedores sin compatibilidad nativa.
  - Establece `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para anular por proveedor (bool o `"auto"`).
  - `false` limpia los comandos registrados anteriormente en Discord/Telegram al iniciar. Los comandos de Slack se administran en la app de Slack y no se eliminan automáticamente.
- `commands.nativeSkills` (predeterminado `"auto"`) registra comandos de **Skills** de forma nativa cuando hay compatibilidad.
  - Automático: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un slash command por Skill).
  - Establece `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para anular por proveedor (bool o `"auto"`).
- `commands.bash` (predeterminado `false`) habilita `! <cmd>` para ejecutar comandos del shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos de `tools.elevated`).
- `commands.bashForegroundMs` (predeterminado `2000`) controla cuánto tiempo espera bash antes de cambiar al modo en segundo plano (`0` lo envía al segundo plano inmediatamente).
- `commands.config` (predeterminado `false`) habilita `/config` (lee/escribe `openclaw.json`).
- `commands.mcp` (predeterminado `false`) habilita `/mcp` (lee/escribe la configuración de MCP administrada por OpenClaw en `mcp.servers`).
- `commands.plugins` (predeterminado `false`) habilita `/plugins` (detección/estado de plugins más controles de instalación y habilitar/deshabilitar).
- `commands.debug` (predeterminado `false`) habilita `/debug` (anulaciones solo de ejecución).
- `commands.restart` (predeterminado `true`) habilita `/restart` más las acciones de herramienta de reinicio del gateway.
- `commands.ownerAllowFrom` (opcional) establece la lista de permitidos explícita del owner para superficies de comandos/herramientas solo para owner. Esto es independiente de `commands.allowFrom`.
- `commands.ownerDisplay` controla cómo aparecen los ids del owner en el prompt del sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` establece opcionalmente el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) establece una lista de permitidos por proveedor para la autorización de comandos. Cuando se configura, es la
  única fuente de autorización para comandos y directivas (se ignoran las listas de permitidos/emparejamiento del canal y `commands.useAccessGroups`).
  Usa `"*"` para un valor predeterminado global; las claves específicas del proveedor lo anulan.
- `commands.useAccessGroups` (predeterminado `true`) aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está configurado.

## Lista de comandos

Fuente de verdad actual:

- los integrados del core provienen de `src/auto-reply/commands-registry.shared.ts`
- los dock commands generados provienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de plugins provienen de llamadas `registerCommand()` de plugins
- la disponibilidad real en tu gateway sigue dependiendo de las flags de configuración, la superficie del canal y los plugins instalados/habilitados

### Comandos integrados del core

Comandos integrados disponibles actualmente:

- `/new [model]` inicia una nueva sesión; `/reset` es el alias de reinicio.
- `/compact [instructions]` compacta el contexto de la sesión. Consulta [/concepts/compaction](/es/concepts/compaction).
- `/stop` aborta la ejecución actual.
- `/session idle <duration|off>` y `/session max-age <duration|off>` administran la expiración de la vinculación del hilo.
- `/think <off|minimal|low|medium|high|xhigh>` establece el nivel de pensamiento. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` alterna la salida detallada. Alias: `/v`.
- `/trace on|off` alterna la salida de rastreo del Plugin para la sesión actual.
- `/fast [status|on|off]` muestra o establece el modo rápido.
- `/reasoning [on|off|stream]` alterna la visibilidad del razonamiento. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna el modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece los valores predeterminados de ejecución.
- `/model [name|#|status]` muestra o establece el modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista proveedores o modelos de un proveedor.
- `/queue <mode>` administra el comportamiento de cola (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) más opciones como `debounce:2s cap:25 drop:summarize`.
- `/help` muestra el resumen corto de ayuda.
- `/commands` muestra el catálogo de comandos generado.
- `/tools [compact|verbose]` muestra lo que el agente actual puede usar ahora mismo.
- `/status` muestra el estado de ejecución, incluido el uso/cuota del proveedor cuando está disponible.
- `/tasks` lista las tareas activas/recientes en segundo plano de la sesión actual.
- `/context [list|detail|json]` explica cómo se ensambla el contexto.
- `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
- `/whoami` muestra tu id de remitente. Alias: `/id`.
- `/skill <name> [input]` ejecuta una Skill por nombre.
- `/allowlist [list|add|remove] ...` administra entradas de la lista de permitidos. Solo texto.
- `/approve <id> <decision>` resuelve solicitudes de aprobación de ejecución.
- `/btw <question>` hace una pregunta lateral sin cambiar el contexto futuro de la sesión. Consulta [/tools/btw](/es/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` administra ejecuciones de subagentes para la sesión actual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` administra sesiones de ACP y opciones de ejecución.
- `/focus <target>` vincula el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
- `/unfocus` elimina la vinculación actual.
- `/agents` lista los agentes vinculados al hilo para la sesión actual.
- `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
- `/steer <id|#> <message>` envía instrucciones a un subagente en ejecución. Alias: `/tell`.
- `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo para owner. Requiere `commands.config: true`.
- `/mcp show|get|set|unset` lee o escribe la configuración de servidor MCP administrada por OpenClaw en `mcp.servers`. Solo para owner. Requiere `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado del Plugin. `/plugin` es un alias. Las escrituras son solo para owner. Requiere `commands.plugins: true`.
- `/debug show|set|unset|reset` administra anulaciones de configuración solo de ejecución. Solo para owner. Requiere `commands.debug: true`.
- `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen de costos local.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulta [/tools/tts](/es/tools/tts).
- `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; establece `commands.restart: false` para deshabilitarlo.
- `/activation mention|always` establece el modo de activación de grupo.
- `/send on|off|inherit` establece la política de envío. Solo para owner.
- `/bash <command>` ejecuta un comando del shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permitidos de `tools.elevated`.
- `!poll [sessionId]` comprueba un trabajo bash en segundo plano.
- `!stop [sessionId]` detiene un trabajo bash en segundo plano.

### Dock commands generados

Los dock commands se generan a partir de plugins de canal con compatibilidad de comandos nativos. Conjunto integrado actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins integrados

Los plugins integrados pueden agregar más comandos con barra. Comandos integrados actuales en este repo:

- `/dreaming [on|off|status|help]` alterna Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` administra el flujo de emparejamiento/configuración de dispositivos. Consulta [Pairing](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporalmente comandos de Node del teléfono de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` administra la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecciona y controla el arnés integrado del servidor de apps de Codex. Consulta [Codex Harness](/es/plugins/codex-harness).
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

- Los comandos aceptan opcionalmente `:` entre el comando y los argumentos (por ejemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
- Para un desglose completo del uso por proveedor, usa `openclaw status --usage`.
- `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
- En canales con varias cuentas, `/allowlist --account <id>` orientado a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
- `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costos a partir de los registros de sesión de OpenClaw.
- `/restart` está habilitado de forma predeterminada; establece `commands.restart: false` para deshabilitarlo.
- `/plugins install <spec>` acepta las mismas especificaciones de Plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
- `/plugins enable|disable` actualiza la configuración del Plugin y puede solicitar un reinicio.
- Comando nativo solo de Discord: `/vc join|leave|status` controla canales de voz (requiere `channels.discord.voice` y comandos nativos; no está disponible como texto).
- Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que las vinculaciones efectivas de hilos estén habilitadas (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
- Referencia del comando ACP y comportamiento en tiempo de ejecución: [ACP Agents](/es/tools/acp-agents).
- `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en el uso normal.
- `/trace` es más limitado que `/verbose`: solo revela líneas de rastreo/depuración propiedad del Plugin y mantiene desactivado el ruido normal detallado de herramientas.
- `/fast on|off` conserva una anulación de sesión. Usa la opción `inherit` de la interfaz de Sessions para borrarla y volver a los valores predeterminados de configuración.
- `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes públicas directas a Anthropic, incluido el tráfico autenticado por OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
- Los resúmenes de fallos de herramientas siguen mostrándose cuando corresponde, pero el texto detallado de fallos solo se incluye cuando `/verbose` está `on` o `full`.
- `/reasoning`, `/verbose` y `/trace` son arriesgados en entornos de grupo: pueden revelar razonamiento interno, salida de herramientas o diagnósticos del Plugin que no pretendías exponer. Es preferible dejarlos desactivados, especialmente en chats grupales.
- `/model` conserva el nuevo modelo de sesión inmediatamente.
- Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
- Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede seguir en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- **Ruta rápida:** los mensajes solo de comando de remitentes en la lista de permitidos se gestionan inmediatamente (omiten cola + modelo).
- **Filtrado por mención en grupos:** los mensajes solo de comando de remitentes en la lista de permitidos omiten los requisitos de mención.
- **Atajos en línea (solo remitentes en la lista de permitidos):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
  - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
- Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Los mensajes no autorizados que solo contienen comandos se ignoran silenciosamente, y los tokens en línea `/...` se tratan como texto sin formato.
- **Comandos de Skills:** las Skills `user-invocable` se exponen como comandos con barra. Los nombres se normalizan a `a-z0-9_` (máx. 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo, `_2`).
  - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden comandos por Skill).
  - De forma predeterminada, los comandos de Skills se reenvían al modelo como una solicitud normal.
  - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
  - Ejemplo: `/prose` (Plugin OpenProse) — consulta [OpenProse](/es/prose).
- **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos obligatorios). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento.

## `/tools`

`/tools` responde una pregunta de tiempo de ejecución, no una pregunta de configuración: **lo que este agente puede usar ahora mismo en
esta conversación**.

- `/tools` predeterminado es compacto y está optimizado para un escaneo rápido.
- `/tools verbose` agrega descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo cambio de modo `compact|verbose`.
- Los resultados tienen alcance de sesión, así que cambiar el agente, canal, hilo, autorización del remitente o modelo puede
  cambiar la salida.
- `/tools` incluye herramientas realmente accesibles en tiempo de ejecución, incluidas herramientas del core, herramientas de plugins
  conectados y herramientas propiedad del canal.

Para editar perfiles y anulaciones, usa el panel Tools de Control UI o las superficies de configuración/catálogo en lugar
de tratar `/tools` como un catálogo estático.

## Superficies de uso (qué aparece dónde)

- **Uso/cuota del proveedor** (ejemplo: “Claude 80% left”) aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas de proveedor a `% left`; para MiniMax, los campos de porcentaje de solo restante se invierten antes de mostrarse, y las respuestas `model_remains` priorizan la entrada del modelo de chat junto con una etiqueta de plan etiquetada con el modelo.
- **Líneas de tokens/caché** en `/status` pueden recurrir a la última entrada de uso de la transcripción cuando la instantánea de sesión en vivo es escasa. Los valores en vivo distintos de cero ya existentes siguen teniendo prioridad, y el respaldo en la transcripción también puede recuperar la etiqueta del modelo de ejecución activo más un total orientado al prompt mayor cuando faltan los totales almacenados o son menores.
- **Tokens/costo por respuesta** se controlan con `/usage off|tokens|full` (se añaden a las respuestas normales).
- `/model status` trata sobre **modelos/autenticación/endpoints**, no sobre uso.

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

- `/model` y `/model list` muestran un selector compacto numerado (familia de modelo + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con listas desplegables de proveedor y modelo más un paso Submit.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint configurado del proveedor (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

## Anulaciones de depuración

`/debug` te permite establecer anulaciones de configuración **solo de ejecución** (memoria, no disco). Solo para owner. Está deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- Las anulaciones se aplican inmediatamente a las nuevas lecturas de configuración, pero **no** escriben en `openclaw.json`.
- Usa `/debug reset` para borrar todas las anulaciones y volver a la configuración en disco.

## Salida de rastreo del Plugin

`/trace` te permite alternar **líneas de rastreo/depuración del Plugin con alcance de sesión** sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumento muestra el estado actual de rastreo de la sesión.
- `/trace on` habilita líneas de rastreo del Plugin para la sesión actual.
- `/trace off` vuelve a deshabilitarlas.
- Las líneas de rastreo del Plugin pueden aparecer en `/status` y como un mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.
- `/trace` no reemplaza a `/debug`; `/debug` sigue administrando anulaciones de configuración solo de ejecución.
- `/trace` no reemplaza a `/verbose`; la salida detallada normal de herramientas/estado sigue perteneciendo a `/verbose`.

## Actualizaciones de configuración

`/config` escribe en tu configuración en disco (`openclaw.json`). Solo para owner. Está deshabilitado de forma predeterminada; habilítalo con `commands.config: true`.

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
- Las actualizaciones de `/config` persisten tras reiniciar.

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidor MCP administradas por OpenClaw en `mcp.servers`. Solo para owner. Está deshabilitado de forma predeterminada; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notas:

- `/mcp` almacena la configuración en la configuración de OpenClaw, no en ajustes del proyecto propiedad de Pi.
- Los adaptadores de tiempo de ejecución deciden qué transportes son realmente ejecutables.

## Actualizaciones de plugins

`/plugins` permite a los operadores inspeccionar plugins detectados y alternar su habilitación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Está deshabilitado de forma predeterminada; habilítalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notas:

- `/plugins list` y `/plugins show` usan descubrimiento real de plugins contra el workspace actual más la configuración en disco.
- `/plugins enable|disable` solo actualiza la configuración del Plugin; no instala ni desinstala plugins.
- Después de cambios de habilitar/deshabilitar, reinicia el gateway para aplicarlos.

## Notas de superficie

- **Comandos de texto** se ejecutan en la sesión normal de chat (los DMs comparten `main`, los grupos tienen su propia sesión).
- **Comandos nativos** usan sesiones aisladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (apunta a la sesión de chat mediante `CommandTargetSessionKey`)
- **`/stop`** apunta a la sesión de chat activa para poder abortar la ejecución actual.
- **Slack:** `channels.slack.slashCommand` todavía es compatible para un único comando estilo `/openclaw`. Si habilitas `commands.native`, debes crear un comando con barra de Slack por cada comando integrado (con los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.
  - Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

## Preguntas laterales BTW

`/btw` es una **pregunta lateral** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada independiente **sin herramientas**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de la transcripción,
- se entrega como un resultado lateral en vivo en lugar de un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la tarea principal sigue en marcha.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [BTW Side Questions](/es/tools/btw) para conocer el comportamiento completo y
los detalles de UX del cliente.
