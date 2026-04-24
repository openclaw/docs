---
read_when:
    - Usar o configurar comandos de chat
    - Depurar el enrutamiento de comandos o permisos
summary: 'Comandos slash: texto vs nativos, configuración y comandos compatibles'
title: Comandos slash
x-i18n:
    generated_at: "2026-04-24T05:55:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

Los comandos los gestiona el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que empiece por `/`.
El comando bash de chat solo para host usa `! <cmd>` (con `/bash <cmd>` como alias).

Hay dos sistemas relacionados:

- **Comandos**: mensajes independientes `/...`.
- **Directivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
  - En mensajes de chat normales (no solo directivas), se tratan como “pistas en línea” y **no** persisten la configuración de la sesión.
  - En mensajes solo de directivas (el mensaje contiene únicamente directivas), persisten en la sesión y responden con una confirmación.
  - Las directivas solo se aplican a **remitentes autorizados**. Si `commands.allowFrom` está configurado, esa es la única
    allowlist usada; de lo contrario, la autorización proviene de las allowlists/emparejamiento del canal más `commands.useAccessGroups`.
    Los remitentes no autorizados ven las directivas tratadas como texto plano.

También hay algunos **atajos en línea** (solo remitentes autorizados/en allowlist): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Se ejecutan inmediatamente, se eliminan antes de que el modelo vea el mensaje y el texto restante sigue por el flujo normal.

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
  - En superficies sin comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), los comandos de texto siguen funcionando aunque establezcas esto en `false`.
- `commands.native` (predeterminado `"auto"`) registra comandos nativos.
  - Auto: activado para Discord/Telegram; desactivado para Slack (hasta que agregues slash commands); ignorado para proveedores sin soporte nativo.
  - Establece `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para sobrescribir por proveedor (bool o `"auto"`).
  - `false` limpia los comandos registrados previamente en Discord/Telegram al iniciar. Los comandos de Slack se gestionan en la app de Slack y no se eliminan automáticamente.
- `commands.nativeSkills` (predeterminado `"auto"`) registra comandos nativos de **Skills** cuando hay soporte.
  - Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un slash command por Skill).
  - Establece `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para sobrescribir por proveedor (bool o `"auto"`).
- `commands.bash` (predeterminado `false`) habilita `! <cmd>` para ejecutar comandos de shell del host (`/bash <cmd>` es un alias; requiere allowlists de `tools.elevated`).
- `commands.bashForegroundMs` (predeterminado `2000`) controla cuánto espera bash antes de cambiar a modo en segundo plano (`0` lo envía al fondo inmediatamente).
- `commands.config` (predeterminado `false`) habilita `/config` (lee/escribe `openclaw.json`).
- `commands.mcp` (predeterminado `false`) habilita `/mcp` (lee/escribe la configuración MCP gestionada por OpenClaw en `mcp.servers`).
- `commands.plugins` (predeterminado `false`) habilita `/plugins` (descubrimiento/estado de plugins más controles de instalación + activación/desactivación).
- `commands.debug` (predeterminado `false`) habilita `/debug` (sobrescrituras solo de runtime).
- `commands.restart` (predeterminado `true`) habilita `/restart` más las acciones de herramienta de reinicio del gateway.
- `commands.ownerAllowFrom` (opcional) establece la allowlist explícita de owner para superficies de comando/herramienta solo de owner. Esto es independiente de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` por canal (opcional, predeterminado `false`) hace que los comandos solo de owner requieran **identidad de owner** para ejecutarse en esa superficie. Cuando es `true`, el remitente debe coincidir con un candidato de owner resuelto (por ejemplo una entrada en `commands.ownerAllowFrom` o metadatos nativos de owner del proveedor) o tener el ámbito interno `operator.admin` en un canal de mensajes interno. Una entrada comodín en `allowFrom` del canal, o una lista vacía/no resuelta de candidatos de owner, **no** es suficiente: los comandos solo de owner fallan en modo cerrado en ese canal. Déjalo desactivado si quieres que los comandos solo de owner estén restringidos solo por `ownerAllowFrom` y las allowlists estándar de comandos.
- `commands.ownerDisplay` controla cómo aparecen los id de owner en el prompt del sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` establece opcionalmente el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) establece una allowlist por proveedor para la autorización de comandos. Cuando está configurado, es la
  única fuente de autorización para comandos y directivas (se ignoran las allowlists/emparejamiento del canal y `commands.useAccessGroups`).
  Usa `"*"` como valor global predeterminado; las claves específicas del proveedor lo sobrescriben.
- `commands.useAccessGroups` (predeterminado `true`) aplica allowlists/políticas para comandos cuando `commands.allowFrom` no está configurado.

## Lista de comandos

Fuente de verdad actual:

- los built-ins del núcleo provienen de `src/auto-reply/commands-registry.shared.ts`
- los dock commands generados provienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de plugins provienen de llamadas `registerCommand()` de plugins
- la disponibilidad real en tu gateway sigue dependiendo de flags de configuración, superficie de canal y plugins instalados/habilitados

### Comandos built-in del núcleo

Comandos built-in disponibles hoy:

- `/new [model]` inicia una sesión nueva; `/reset` es el alias de reinicio.
- `/reset soft [message]` mantiene la transcripción actual, elimina los id de sesión reutilizados del backend CLI y vuelve a ejecutar en el lugar la carga de inicio/prompt del sistema.
- `/compact [instructions]` compacta el contexto de la sesión. Consulta [/concepts/compaction](/es/concepts/compaction).
- `/stop` aborta la ejecución actual.
- `/session idle <duration|off>` y `/session max-age <duration|off>` gestionan el vencimiento del enlace al hilo.
- `/think <level>` establece el nivel de thinking. Las opciones provienen del perfil del proveedor del modelo activo; los niveles comunes son `off`, `minimal`, `low`, `medium` y `high`, con niveles personalizados como `xhigh`, `adaptive`, `max` o `on` binario solo cuando hay soporte. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` activa o desactiva la salida detallada. Alias: `/v`.
- `/trace on|off` activa o desactiva la salida de traza del plugin para la sesión actual.
- `/fast [status|on|off]` muestra o establece fast mode.
- `/reasoning [on|off|stream]` activa o desactiva la visibilidad de reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` activa o desactiva elevated mode. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece los valores predeterminados de exec.
- `/model [name|#|status]` muestra o establece el modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` enumera proveedores o modelos de un proveedor.
- `/queue <mode>` gestiona el comportamiento de la cola (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) más opciones como `debounce:2s cap:25 drop:summarize`.
- `/help` muestra el resumen corto de ayuda.
- `/commands` muestra el catálogo generado de comandos.
- `/tools [compact|verbose]` muestra lo que el agente actual puede usar ahora mismo.
- `/status` muestra el estado de runtime, incluidas etiquetas `Runtime`/`Runner` y uso/cuota del proveedor cuando está disponible.
- `/tasks` enumera las tareas activas/recientes en segundo plano de la sesión actual.
- `/context [list|detail|json]` explica cómo se ensambla el contexto.
- `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
- `/export-trajectory [path]` exporta un [trajectory bundle](/es/tools/trajectory) JSONL para la sesión actual. Alias: `/trajectory`.
- `/whoami` muestra tu id de remitente. Alias: `/id`.
- `/skill <name> [input]` ejecuta una Skill por nombre.
- `/allowlist [list|add|remove] ...` gestiona entradas de allowlist. Solo texto.
- `/approve <id> <decision>` resuelve prompts de aprobación de exec.
- `/btw <question>` hace una pregunta lateral sin cambiar el contexto futuro de la sesión. Consulta [/tools/btw](/es/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestiona ejecuciones de subagentes para la sesión actual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestiona sesiones ACP y opciones de runtime.
- `/focus <target>` vincula el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
- `/unfocus` elimina el vínculo actual.
- `/agents` enumera los agentes vinculados al hilo para la sesión actual.
- `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
- `/steer <id|#> <message>` envía steering a un subagente en ejecución. Alias: `/tell`.
- `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo owner. Requiere `commands.config: true`.
- `/mcp show|get|set|unset` lee o escribe la configuración del servidor MCP gestionada por OpenClaw en `mcp.servers`. Solo owner. Requiere `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado de plugins. `/plugin` es un alias. Solo owner para escrituras. Requiere `commands.plugins: true`.
- `/debug show|set|unset|reset` gestiona sobrescrituras de configuración solo de runtime. Solo owner. Requiere `commands.debug: true`.
- `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen local de costes.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulta [/tools/tts](/es/tools/tts).
- `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; establece `commands.restart: false` para desactivarlo.
- `/activation mention|always` establece el modo de activación de grupo.
- `/send on|off|inherit` establece la política de envío. Solo owner.
- `/bash <command>` ejecuta un comando de shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más allowlists de `tools.elevated`.
- `!poll [sessionId]` comprueba un trabajo bash en segundo plano.
- `!stop [sessionId]` detiene un trabajo bash en segundo plano.

### Dock commands generados

Los dock commands se generan a partir de plugins de canal con soporte de comando nativo. Conjunto incluido actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins incluidos

Los plugins incluidos pueden agregar más slash commands. Comandos incluidos actuales en este repositorio:

- `/dreaming [on|off|status|help]` activa o desactiva Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestiona el flujo de pairing/configuración de dispositivos. Consulta [Pairing](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporalmente comandos de alto riesgo del node del teléfono.
- `/voice status|list [limit]|set <voiceId|name>` gestiona la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecciona y controla el arnés app-server de Codex incluido. Consulta [Codex Harness](/es/plugins/codex-harness).
- Comandos solo de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de Skills

Las Skills invocables por el usuario también se exponen como slash commands:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- las Skills también pueden aparecer como comandos directos como `/prose` cuando la Skill/plugin los registra.
- el registro nativo de comandos de Skills está controlado por `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.

Notas:

- Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo `/think: high`, `/send: on`, `/help:`).
- `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como cuerpo del mensaje.
- Para un desglose completo del uso por proveedor, usa `openclaw status --usage`.
- `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
- En canales con varias cuentas, `/allowlist --account <id>` dirigido a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
- `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costes desde los registros de sesión de OpenClaw.
- `/restart` está habilitado por defecto; establece `commands.restart: false` para desactivarlo.
- `/plugins install <spec>` acepta las mismas especificaciones de plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
- `/plugins enable|disable` actualiza la configuración del plugin y puede pedir reinicio.
- Comando nativo solo de Discord: `/vc join|leave|status` controla los canales de voz (requiere `channels.discord.voice` y comandos nativos; no está disponible como texto).
- Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que los vínculos de hilo efectivos estén habilitados (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
- Referencia del comando ACP y comportamiento de runtime: [ACP Agents](/es/tools/acp-agents).
- `/verbose` está pensado para depuración y visibilidad extra; mantenlo **off** en uso normal.
- `/trace` es más limitado que `/verbose`: solo revela líneas de traza/depuración propiedad del plugin y mantiene desactivado el ruido normal detallado de herramientas.
- `/fast on|off` conserva una sobrescritura de sesión. Usa la opción `inherit` de la IU de Sesiones para borrarla y volver a los valores predeterminados de configuración.
- `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes públicas directas a Anthropic, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
- Los resúmenes de fallo de herramientas se siguen mostrando cuando corresponde, pero el texto detallado del fallo solo se incluye cuando `/verbose` está en `on` o `full`.
- `/reasoning`, `/verbose` y `/trace` son arriesgados en contextos grupales: pueden revelar razonamiento interno, salida de herramientas o diagnósticos de plugins que no pretendías exponer. Es mejor dejarlos desactivados, especialmente en chats grupales.
- `/model` conserva inmediatamente el nuevo modelo de sesión.
- Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
- Si la actividad de herramientas o la salida de respuesta ya ha comenzado, el cambio pendiente puede quedar en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- **Ruta rápida:** los mensajes solo de comando de remitentes en allowlist se gestionan inmediatamente (omiten cola + modelo).
- **Restricción por mención en grupos:** los mensajes solo de comando de remitentes en allowlist omiten los requisitos de mención.
- **Atajos en línea (solo remitentes en allowlist):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
  - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
- Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Los mensajes solo de comando no autorizados se ignoran en silencio, y los tokens `/...` en línea se tratan como texto plano.
- **Comandos de Skills:** las Skills `user-invocable` también se exponen como slash commands. Los nombres se sanean a `a-z0-9_` (máximo 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo `_2`).
  - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden comandos por Skill).
  - Por defecto, los comandos de Skills se reenvían al modelo como una solicitud normal.
  - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
  - Ejemplo: `/prose` (plugin OpenProse) — consulta [OpenProse](/es/prose).
- **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos obligatorios). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento.

## `/tools`

`/tools` responde a una pregunta de runtime, no de configuración: **qué puede usar este agente ahora mismo en
esta conversación**.

- `/tools` por defecto es compacto y está optimizado para un escaneo rápido.
- `/tools verbose` añade descripciones breves.
- Las superficies de comando nativo que admiten argumentos exponen el mismo cambio de modo como `compact|verbose`.
- Los resultados están limitados a la sesión, así que cambiar de agente, canal, hilo, autorización del remitente o modelo puede
  cambiar la salida.
- `/tools` incluye herramientas realmente accesibles en runtime, incluidas herramientas del núcleo, herramientas de plugins
  conectados y herramientas propiedad del canal.

Para editar perfiles y sobrescrituras, usa el panel Tools de la Control UI o las superficies de config/catálogo en lugar de
tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra dónde)

- **Uso/cuota del proveedor** (ejemplo: “Claude 80% left”) aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% left`; para MiniMax, los campos de porcentaje de solo restante se invierten antes de mostrarse, y las respuestas `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan con nombre de modelo.
- Las **líneas de tokens/caché** en `/status` pueden recurrir a la entrada de uso más reciente de la transcripción cuando la instantánea viva de la sesión es escasa. Los valores vivos existentes no nulos siguen teniendo prioridad, y el fallback de transcripción también puede recuperar la etiqueta activa del modelo de runtime más un total orientado al prompt mayor cuando los totales almacenados faltan o son menores.
- **Runtime vs runner:** `/status` informa `Runtime` para la ruta efectiva de ejecución y el estado del sandbox, y `Runner` para quién está ejecutando realmente la sesión: Pi embebido, un proveedor respaldado por CLI o un arnés/backend ACP.
- **Tokens/coste por respuesta** se controla con `/usage off|tokens|full` (agregado a las respuestas normales).
- `/model status` trata sobre **modelos/auth/endpoints**, no sobre uso.

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
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso Submit.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando sea posible).
- `/model status` muestra la vista detallada, incluido el endpoint configurado del proveedor (`baseUrl`) y el modo API (`api`) cuando está disponible.

## Sobrescrituras de depuración

`/debug` te permite establecer sobrescrituras de configuración **solo de runtime** (memoria, no disco). Solo owner. Desactivado por defecto; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- Las sobrescrituras se aplican inmediatamente a las nuevas lecturas de configuración, pero **no** escriben en `openclaw.json`.
- Usa `/debug reset` para borrar todas las sobrescrituras y volver a la configuración en disco.

## Salida de traza de plugins

`/trace` te permite activar o desactivar **líneas de traza/depuración de plugins limitadas a la sesión** sin activar el modo verbose completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumentos muestra el estado actual de traza de la sesión.
- `/trace on` habilita líneas de traza de plugins para la sesión actual.
- `/trace off` las vuelve a desactivar.
- Las líneas de traza de plugins pueden aparecer en `/status` y como mensaje diagnóstico de seguimiento después de la respuesta normal del asistente.
- `/trace` no sustituye a `/debug`; `/debug` sigue gestionando las sobrescrituras de configuración solo de runtime.
- `/trace` no sustituye a `/verbose`; la salida detallada normal de herramientas/estado sigue perteneciendo a `/verbose`.

## Actualizaciones de configuración

`/config` escribe en tu configuración en disco (`openclaw.json`). Solo owner. Desactivado por defecto; habilítalo con `commands.config: true`.

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
- Las actualizaciones de `/config` persisten tras reinicios.

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidor MCP gestionadas por OpenClaw en `mcp.servers`. Solo owner. Desactivado por defecto; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notas:

- `/mcp` almacena la configuración en la config de OpenClaw, no en configuraciones de proyecto propiedad de Pi.
- Los adaptadores de runtime deciden qué transportes son realmente ejecutables.

## Actualizaciones de plugins

`/plugins` permite a los operadores inspeccionar plugins descubiertos y activar o desactivar su uso en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Desactivado por defecto; habilítalo con `commands.plugins: true`.

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
- `/plugins enable|disable` solo actualiza la configuración del plugin; no instala ni desinstala plugins.
- Después de cambios de enable/disable, reinicia el gateway para aplicarlos.

## Notas de superficie

- Los **comandos de texto** se ejecutan en la sesión normal de chat (los DM comparten `main`, los grupos tienen su propia sesión).
- Los **comandos nativos** usan sesiones aisladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (apunta a la sesión del chat mediante `CommandTargetSessionKey`)
- **`/stop`** apunta a la sesión de chat activa para poder abortar la ejecución actual.
- **Slack:** `channels.slack.slashCommand` sigue siendo compatible para un único comando estilo `/openclaw`. Si habilitas `commands.native`, debes crear un slash command de Slack por cada comando built-in (con los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.
  - Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El `/status` de texto sigue funcionando en mensajes de Slack.

## Preguntas laterales BTW

`/btw` es una **pregunta lateral** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada independiente **sin herramientas** de una sola vez,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de transcripción,
- se entrega como un resultado lateral en vivo en lugar de un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la
tarea principal sigue avanzando.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [BTW Side Questions](/es/tools/btw) para ver el comportamiento completo y los
detalles de UX del cliente.

## Relacionado

- [Skills](/es/tools/skills)
- [Configuración de Skills](/es/tools/skills-config)
- [Crear Skills](/es/tools/creating-skills)
