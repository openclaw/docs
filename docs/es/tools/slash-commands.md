---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o de los permisos
summary: 'Comandos de barra: texto vs. nativos, configuración y comandos compatibles'
title: Comandos de barra
x-i18n:
    generated_at: "2026-04-21T17:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26923608329ba2aeece2d4bc8edfa40ae86e03719a9f590f26ff79f57d97521d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos de barra

Los comandos son gestionados por el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que comience con `/`.
El comando de chat bash solo para host usa `! <cmd>` (con `/bash <cmd>` como alias).

Hay dos sistemas relacionados:

- **Comandos**: mensajes `/...` independientes.
- **Directivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
  - En mensajes de chat normales (no solo de directivas), se tratan como “indicaciones en línea” y **no** conservan la configuración de la sesión.
  - En mensajes que solo contienen directivas (el mensaje contiene únicamente directivas), se conservan en la sesión y responden con una confirmación.
  - Las directivas solo se aplican para **remitentes autorizados**. Si `commands.allowFrom` está configurado, es la única
    lista de permitidos utilizada; de lo contrario, la autorización proviene de las listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`.
    Los remitentes no autorizados verán las directivas tratadas como texto sin formato.

También hay algunos **atajos en línea** (solo remitentes incluidos en la lista de permitidos/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Se ejecutan de inmediato, se eliminan antes de que el modelo vea el mensaje, y el texto restante continúa por el flujo normal.

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
  - En superficies sin comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), los comandos de texto siguen funcionando incluso si configuras esto como `false`.
- `commands.native` (predeterminado: `"auto"`) registra comandos nativos.
  - Auto: activado para Discord/Telegram; desactivado para Slack (hasta que agregues comandos de barra); ignorado para proveedores sin soporte nativo.
  - Configura `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para sobrescribirlo por proveedor (bool o `"auto"`).
  - `false` borra los comandos registrados previamente en Discord/Telegram al iniciar. Los comandos de Slack se gestionan en la app de Slack y no se eliminan automáticamente.
- `commands.nativeSkills` (predeterminado: `"auto"`) registra comandos de **skill** de forma nativa cuando hay soporte.
  - Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un comando de barra por skill).
  - Configura `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para sobrescribirlo por proveedor (bool o `"auto"`).
- `commands.bash` (predeterminado: `false`) habilita `! <cmd>` para ejecutar comandos de shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos `tools.elevated`).
- `commands.bashForegroundMs` (predeterminado: `2000`) controla cuánto tiempo espera bash antes de pasar al modo en segundo plano (`0` lo manda al segundo plano de inmediato).
- `commands.config` (predeterminado: `false`) habilita `/config` (lee/escribe `openclaw.json`).
- `commands.mcp` (predeterminado: `false`) habilita `/mcp` (lee/escribe la configuración de MCP gestionada por OpenClaw en `mcp.servers`).
- `commands.plugins` (predeterminado: `false`) habilita `/plugins` (descubrimiento/estado de plugins además de controles de instalación y activación/desactivación).
- `commands.debug` (predeterminado: `false`) habilita `/debug` (sobrescrituras solo de tiempo de ejecución).
- `commands.restart` (predeterminado: `true`) habilita `/restart` además de las acciones de herramientas de reinicio del gateway.
- `commands.ownerAllowFrom` (opcional) establece la lista de permitidos explícita del propietario para superficies de comandos/herramientas solo para el propietario. Es independiente de `commands.allowFrom`.
- `commands.ownerDisplay` controla cómo aparecen los id del propietario en el prompt del sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` opcionalmente establece el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) establece una lista de permitidos por proveedor para la autorización de comandos. Cuando está configurada, es la
  única fuente de autorización para comandos y directivas (las listas de permitidos/emparejamiento del canal y `commands.useAccessGroups`
  se ignoran). Usa `"*"` como valor global predeterminado; las claves específicas de proveedor lo sobrescriben.
- `commands.useAccessGroups` (predeterminado: `true`) aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está configurado.

## Lista de comandos

Fuente de verdad actual:

- los integrados del núcleo provienen de `src/auto-reply/commands-registry.shared.ts`
- los comandos de dock generados provienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de plugins provienen de llamadas a `registerCommand()` del plugin
- la disponibilidad real en tu gateway sigue dependiendo de los indicadores de configuración, la superficie del canal y los plugins instalados/activados

### Comandos integrados del núcleo

Comandos integrados disponibles hoy:

- `/new [model]` inicia una nueva sesión; `/reset` es el alias de reinicio.
- `/reset soft [message]` mantiene la transcripción actual, elimina los id de sesión reutilizados del backend de CLI y vuelve a ejecutar en su lugar la carga de inicio/del prompt del sistema.
- `/compact [instructions]` compacta el contexto de la sesión. Consulta [/concepts/compaction](/es/concepts/compaction).
- `/stop` aborta la ejecución actual.
- `/session idle <duration|off>` y `/session max-age <duration|off>` gestionan el vencimiento de la vinculación del hilo.
- `/think <level>` establece el nivel de pensamiento. Las opciones provienen del perfil de proveedor del modelo activo; los niveles habituales son `off`, `minimal`, `low`, `medium` y `high`, con niveles personalizados como `xhigh`, `adaptive`, `max`, o solo binario `on` donde sea compatible. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` alterna la salida detallada. Alias: `/v`.
- `/trace on|off` alterna la salida de rastreo de plugins para la sesión actual.
- `/fast [status|on|off]` muestra o establece el modo rápido.
- `/reasoning [on|off|stream]` alterna la visibilidad del razonamiento. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna el modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece los valores predeterminados de exec.
- `/model [name|#|status]` muestra o establece el modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` enumera proveedores o modelos de un proveedor.
- `/queue <mode>` gestiona el comportamiento de la cola (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) además de opciones como `debounce:2s cap:25 drop:summarize`.
- `/help` muestra el resumen breve de ayuda.
- `/commands` muestra el catálogo de comandos generado.
- `/tools [compact|verbose]` muestra lo que el agente actual puede usar en este momento.
- `/status` muestra el estado de ejecución, incluido el uso/cuota del proveedor cuando está disponible.
- `/tasks` enumera las tareas en segundo plano activas/recientes para la sesión actual.
- `/context [list|detail|json]` explica cómo se ensambla el contexto.
- `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
- `/whoami` muestra tu id de remitente. Alias: `/id`.
- `/skill <name> [input]` ejecuta una skill por nombre.
- `/allowlist [list|add|remove] ...` gestiona entradas de la lista de permitidos. Solo texto.
- `/approve <id> <decision>` resuelve solicitudes de aprobación de exec.
- `/btw <question>` hace una pregunta lateral sin cambiar el contexto futuro de la sesión. Consulta [/tools/btw](/es/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestiona ejecuciones de subagentes para la sesión actual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestiona sesiones de ACP y opciones de ejecución.
- `/focus <target>` vincula el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
- `/unfocus` elimina la vinculación actual.
- `/agents` enumera los agentes vinculados al hilo para la sesión actual.
- `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
- `/steer <id|#> <message>` envía dirección a un subagente en ejecución. Alias: `/tell`.
- `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo para el propietario. Requiere `commands.config: true`.
- `/mcp show|get|set|unset` lee o escribe la configuración del servidor MCP gestionada por OpenClaw en `mcp.servers`. Solo para el propietario. Requiere `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado de plugins. `/plugin` es un alias. Solo para el propietario en operaciones de escritura. Requiere `commands.plugins: true`.
- `/debug show|set|unset|reset` gestiona sobrescrituras de configuración solo de tiempo de ejecución. Solo para el propietario. Requiere `commands.debug: true`.
- `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen local de costos.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulta [/tools/tts](/es/tools/tts).
- `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; configura `commands.restart: false` para deshabilitarlo.
- `/activation mention|always` establece el modo de activación de grupo.
- `/send on|off|inherit` establece la política de envío. Solo para el propietario.
- `/bash <command>` ejecuta un comando de shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` además de listas de permitidos `tools.elevated`.
- `!poll [sessionId]` consulta un trabajo bash en segundo plano.
- `!stop [sessionId]` detiene un trabajo bash en segundo plano.

### Comandos de dock generados

Los comandos de dock se generan a partir de plugins de canal con soporte para comandos nativos. Conjunto incluido actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins incluidos

Los plugins incluidos pueden agregar más comandos de barra. Comandos incluidos actuales en este repositorio:

- `/dreaming [on|off|status|help]` alterna Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestiona el flujo de emparejamiento/configuración de dispositivos. Consulta [Pairing](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` activa temporalmente comandos de Node de teléfono de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` gestiona la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecciona y controla el arnés app-server de Codex incluido. Consulta [Codex Harness](/es/plugins/codex-harness).
- Comandos solo para QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de Skills

Las Skills invocables por el usuario también se exponen como comandos de barra:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- las skills también pueden aparecer como comandos directos como `/prose` cuando la skill/el plugin las registra.
- el registro nativo de comandos de skill está controlado por `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.

Notas:

- Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
- Para el desglose completo de uso del proveedor, usa `openclaw status --usage`.
- `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
- En canales con varias cuentas, `/allowlist --account <id>` orientado a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
- `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costos a partir de los registros de sesión de OpenClaw.
- `/restart` está habilitado de forma predeterminada; configura `commands.restart: false` para deshabilitarlo.
- `/plugins install <spec>` acepta las mismas especificaciones de plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
- `/plugins enable|disable` actualiza la configuración del plugin y puede solicitar un reinicio.
- Comando nativo solo de Discord: `/vc join|leave|status` controla los canales de voz (requiere `channels.discord.voice` y comandos nativos; no está disponible como texto).
- Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que las vinculaciones efectivas de hilos estén habilitadas (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
- Referencia del comando ACP y comportamiento en tiempo de ejecución: [ACP Agents](/es/tools/acp-agents).
- `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en el uso normal.
- `/trace` es más limitado que `/verbose`: solo revela líneas de rastreo/depuración propiedad del plugin y mantiene desactivado el ruido normal detallado de herramientas.
- `/fast on|off` conserva una sobrescritura de sesión. Usa la opción `inherit` de la UI de Sessions para borrarla y volver a los valores predeterminados de la configuración.
- `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes públicas directas a Anthropic, incluido el tráfico autenticado por OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
- Los resúmenes de fallos de herramientas siguen mostrándose cuando es relevante, pero el texto detallado del fallo solo se incluye cuando `/verbose` está en `on` o `full`.
- `/reasoning`, `/verbose` y `/trace` son riesgosos en entornos de grupo: pueden revelar razonamiento interno, salida de herramientas o diagnósticos de plugins que no pretendías exponer. Es preferible dejarlos desactivados, especialmente en chats grupales.
- `/model` conserva el nuevo modelo de sesión de inmediato.
- Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
- Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede quedar en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- **Ruta rápida:** los mensajes que contienen solo comandos de remitentes en la lista de permitidos se gestionan de inmediato (omiten cola + modelo).
- **Control por mención en grupos:** los mensajes que contienen solo comandos de remitentes en la lista de permitidos omiten los requisitos de mención.
- **Atajos en línea (solo remitentes en la lista de permitidos):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el resto del texto.
  - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
- Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Los mensajes no autorizados que contienen solo comandos se ignoran silenciosamente, y los tokens `/...` en línea se tratan como texto sin formato.
- **Comandos de Skills:** las skills `user-invocable` se exponen como comandos de barra. Los nombres se normalizan a `a-z0-9_` (máx. 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo, `_2`).
  - `/skill <name> [input]` ejecuta una skill por nombre (útil cuando los límites de comandos nativos impiden usar comandos por skill).
  - De forma predeterminada, los comandos de skills se reenvían al modelo como una solicitud normal.
  - Las skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
  - Ejemplo: `/prose` (plugin OpenProse) — consulta [OpenProse](/es/prose).
- **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos obligatorios). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento.

## `/tools`

`/tools` responde una pregunta de tiempo de ejecución, no una pregunta de configuración: **qué puede usar este agente ahora mismo en
esta conversación**.

- El valor predeterminado de `/tools` es compacto y está optimizado para un escaneo rápido.
- `/tools verbose` agrega descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo cambio de modo que `compact|verbose`.
- Los resultados tienen alcance de sesión, así que cambiar de agente, canal, hilo, autorización del remitente o modelo puede
  cambiar la salida.
- `/tools` incluye las herramientas realmente accesibles en tiempo de ejecución, incluidas herramientas del núcleo, herramientas de
  plugins conectados y herramientas propiedad del canal.

Para editar perfiles y sobrescrituras, usa el panel Tools de la UI de Control o las superficies de configuración/catálogo en lugar
de tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra dónde)

- **Uso/cuota del proveedor** (ejemplo: “Claude 80% left”) aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% left`; para MiniMax, los campos de porcentaje de solo restante se invierten antes de mostrarse, y las respuestas `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan con la etiqueta del modelo.
- Las **líneas de tokens/caché** en `/status` pueden recurrir a la última entrada de uso de la transcripción cuando la instantánea de la sesión en vivo es escasa. Los valores en vivo no nulos existentes siguen teniendo prioridad, y el recurso de transcripción también puede recuperar la etiqueta activa del modelo en ejecución además de un total más grande orientado al prompt cuando faltan los totales almacenados o son menores.
- Los **tokens/costo por respuesta** se controlan con `/usage off|tokens|full` (se agregan a las respuestas normales).
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

- `/model` y `/model list` muestran un selector compacto numerado (familia de modelos + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo además de un paso Submit.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint configurado del proveedor (`baseUrl`) y el modo API (`api`) cuando están disponibles.

## Sobrescrituras de depuración

`/debug` te permite establecer sobrescrituras de configuración **solo en tiempo de ejecución** (en memoria, no en disco). Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.

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

## Salida de rastreo de plugins

`/trace` te permite alternar líneas de **rastreo/depuración de plugins con alcance de sesión** sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumento muestra el estado actual de rastreo de la sesión.
- `/trace on` habilita líneas de rastreo de plugins para la sesión actual.
- `/trace off` las vuelve a deshabilitar.
- Las líneas de rastreo de plugins pueden aparecer en `/status` y como un mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.
- `/trace` no sustituye a `/debug`; `/debug` sigue gestionando sobrescrituras de configuración solo en tiempo de ejecución.
- `/trace` no sustituye a `/verbose`; la salida normal detallada de herramientas/estado sigue perteneciendo a `/verbose`.

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
- Las actualizaciones de `/config` persisten tras los reinicios.

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidor MCP gestionadas por OpenClaw en `mcp.servers`. Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notas:

- `/mcp` almacena la configuración en la configuración de OpenClaw, no en ajustes de proyecto propiedad de Pi.
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

- `/plugins list` y `/plugins show` usan descubrimiento real de plugins contra el espacio de trabajo actual más la configuración en disco.
- `/plugins enable|disable` actualiza solo la configuración del plugin; no instala ni desinstala plugins.
- Después de cambios de habilitación/deshabilitación, reinicia el gateway para aplicarlos.

## Notas sobre superficies

- **Comandos de texto** se ejecutan en la sesión normal de chat (los mensajes directos comparten `main`, los grupos tienen su propia sesión).
- **Comandos nativos** usan sesiones aisladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (apunta a la sesión del chat mediante `CommandTargetSessionKey`)
- **`/stop`** apunta a la sesión activa del chat para poder abortar la ejecución actual.
- **Slack:** `channels.slack.slashCommand` sigue siendo compatible para un único comando estilo `/openclaw`. Si habilitas `commands.native`, debes crear un comando de barra de Slack por cada comando integrado (con los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.
  - Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

## Preguntas laterales con BTW

`/btw` es una **pregunta lateral** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada separada de un solo uso **sin herramientas**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de la transcripción,
- se entrega como un resultado lateral en vivo en lugar de un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la tarea principal
sigue en curso.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [BTW Side Questions](/es/tools/btw) para ver el comportamiento completo y los detalles
de UX del cliente.
