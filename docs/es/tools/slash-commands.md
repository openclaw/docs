---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o permisos
sidebarTitle: Slash commands
summary: 'Comandos de barra diagonal: texto frente a nativos, configuración y comandos compatibles'
title: Comandos de barra diagonal
x-i18n:
    generated_at: "2026-05-02T21:07:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

Los comandos los gestiona el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que empieza por `/`. El comando de chat bash solo para el host usa `! <cmd>` (con `/bash <cmd>` como alias).

Cuando una conversación o hilo está vinculado a una sesión ACP, el texto normal de seguimiento se enruta a ese arnés ACP. Los comandos de gestión del Gateway siguen siendo locales: `/acp ...` siempre llega al manejador de comandos ACP de OpenClaw, y `/status` junto con `/unfocus` permanecen locales siempre que el manejo de comandos esté habilitado para la superficie.

Hay dos sistemas relacionados:

<AccordionGroup>
  <Accordion title="Comandos">
    Mensajes `/...` independientes.
  </Accordion>
  <Accordion title="Directivas">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
    - En mensajes de chat normales (no solo de directivas), se tratan como "pistas en línea" y **no** conservan la configuración de la sesión.
    - En mensajes solo de directivas (el mensaje contiene únicamente directivas), se conservan en la sesión y responden con una confirmación.
    - Las directivas solo se aplican para **remitentes autorizados**. Si `commands.allowFrom` está configurado, es la única lista de permitidos usada; de lo contrario, la autorización proviene de las listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`. Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

  </Accordion>
  <Accordion title="Atajos en línea">
    Solo remitentes incluidos en la lista de permitidos/autorizados: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Se ejecutan de inmediato, se eliminan antes de que el modelo vea el mensaje y el texto restante continúa por el flujo normal.

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
  Habilita el análisis de `/...` en mensajes de chat. En superficies sin comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), los comandos de texto siguen funcionando aunque lo configures en `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Auto: activado para Discord/Telegram; desactivado para Slack (hasta que agregues comandos de barra); se ignora para proveedores sin soporte nativo. Configura `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para sobrescribir por proveedor (booleano o `"auto"`). `false` borra los comandos registrados previamente en Discord/Telegram al iniciar. Los comandos de Slack se gestionan en la app de Slack y no se eliminan automáticamente.
</ParamField>
En Discord, las especificaciones de comandos nativos pueden incluir `descriptionLocalizations`, que OpenClaw publica como `description_localizations` de Discord e incluye en las comparaciones de conciliación.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de **Skill** de forma nativa cuando se admite. Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un comando de barra por cada Skill). Configura `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para sobrescribir por proveedor (booleano o `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para ejecutar comandos de shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos de `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controla cuánto tiempo espera bash antes de cambiar al modo en segundo plano (`0` lo envía al segundo plano de inmediato).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lee/escribe `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lee/escribe la configuración MCP gestionada por OpenClaw en `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descubrimiento/estado de plugins más controles de instalación y habilitación/deshabilitación).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (sobrescrituras solo en tiempo de ejecución).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` más acciones de herramienta para reiniciar el Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Establece la lista explícita de permitidos del propietario para superficies de comandos/herramientas solo para el propietario. Esta es la cuenta del operador humano que puede aprobar acciones peligrosas y ejecutar comandos como `/diagnostics`, `/export-trajectory` y `/config`. Está separada de `commands.allowFrom` y del acceso por emparejamiento de mensajes directos.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: hace que los comandos solo para el propietario requieran **identidad de propietario** para ejecutarse en esa superficie. Cuando es `true`, el remitente debe coincidir con un candidato de propietario resuelto (por ejemplo, una entrada en `commands.ownerAllowFrom` o metadatos de propietario nativos del proveedor) o tener el alcance interno `operator.admin` en un canal de mensajes interno. Una entrada comodín en `allowFrom` del canal, o una lista de candidatos de propietario vacía/no resuelta, **no** es suficiente: los comandos solo para el propietario fallan de forma cerrada en ese canal. Déjalo desactivado si quieres que los comandos solo para el propietario estén protegidos únicamente por `ownerAllowFrom` y las listas de permitidos estándar de comandos.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla cómo aparecen los ids de propietario en el prompt del sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcionalmente establece el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista de permitidos por proveedor para la autorización de comandos. Cuando está configurada, es la única fuente de autorización para comandos y directivas (se ignoran las listas de permitidos/emparejamiento del canal y `commands.useAccessGroups`). Usa `"*"` como valor predeterminado global; las claves específicas de proveedor lo sobrescriben.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está configurado.
</ParamField>

## Lista de comandos

Fuente de verdad actual:

- los integrados del núcleo provienen de `src/auto-reply/commands-registry.shared.ts`
- los comandos del dock generados provienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de plugins provienen de llamadas `registerCommand()` de plugins
- la disponibilidad real en tu gateway sigue dependiendo de los indicadores de configuración, la superficie del canal y los plugins instalados/habilitados

### Comandos integrados del núcleo

<AccordionGroup>
  <Accordion title="Sesiones y ejecuciones">
    - `/new [model]` inicia una sesión nueva; `/reset` es el alias de restablecimiento.
    - Control UI intercepta `/new` escrito para crear y cambiar a una sesión de panel nueva; `/reset` escrito sigue ejecutando el restablecimiento in situ del Gateway.
    - `/reset soft [message]` conserva la transcripción actual, descarta los ids de sesión del backend CLI reutilizados y vuelve a ejecutar la carga de inicio/prompt del sistema in situ.
    - `/compact [instructions]` compacta el contexto de la sesión. Consulta [Compaction](/es/concepts/compaction).
    - `/stop` aborta la ejecución actual.
    - `/session idle <duration|off>` y `/session max-age <duration|off>` gestionan la caducidad del enlace de hilos.
    - `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
    - `/export-trajectory [path]` solicita aprobación de ejecución y luego exporta un [paquete de trayectoria](/es/tools/trajectory) JSONL para la sesión actual. Úsalo cuando necesites la línea temporal de prompt, herramienta y transcripción para una sesión de OpenClaw. En chats grupales, la solicitud de aprobación y el resultado de exportación se envían al propietario en privado. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Controles de modelo y ejecución">
    - `/think <level>` establece el nivel de pensamiento. Las opciones provienen del perfil de proveedor del modelo activo; los niveles comunes son `off`, `minimal`, `low`, `medium` y `high`, con niveles personalizados como `xhigh`, `adaptive`, `max` o el binario `on` solo donde se admite. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` alterna la salida detallada. Alias: `/v`.
    - `/trace on|off` alterna la salida de traza de plugins para la sesión actual.
    - `/fast [status|on|off]` muestra o establece el modo rápido.
    - `/reasoning [on|off|stream]` alterna la visibilidad del razonamiento. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` alterna el modo elevado. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece los valores predeterminados de ejecución.
    - `/model [name|#|status]` muestra o establece el modelo.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lista los proveedores configurados/con autenticación disponible o los modelos de un proveedor; agrega `all` para explorar el catálogo completo de ese proveedor.
    - `/queue <mode>` gestiona el comportamiento de la cola (`steer`, `queue` heredado, `followup`, `collect`, `steer-backlog`, `interrupt`) más opciones como `debounce:0.5s cap:25 drop:summarize`; `/queue default` o `/queue reset` borra la sobrescritura de la sesión. Consulta [Cola de comandos](/es/concepts/queue) y [Cola de dirección](/es/concepts/queue-steering).

  </Accordion>
  <Accordion title="Descubrimiento y estado">
    - `/help` muestra el resumen breve de ayuda.
    - `/commands` muestra el catálogo de comandos generado.
    - `/tools [compact|verbose]` muestra qué puede usar ahora mismo el agente actual.
    - `/status` muestra el estado de ejecución/tiempo de ejecución, incluidas las etiquetas `Execution`/`Runtime` y el uso/cuota del proveedor cuando está disponible.
    - `/diagnostics [note]` es el flujo de informe de soporte solo para el propietario para errores del Gateway y ejecuciones del arnés Codex. Solicita aprobación explícita de ejecución cada vez antes de ejecutar `openclaw gateway diagnostics export --json`; no apruebes diagnósticos con una regla de permitir todo. Tras la aprobación, envía un informe que se puede pegar con la ruta del paquete local, el resumen del manifiesto, notas de privacidad e ids de sesión relevantes. En chats grupales, la solicitud de aprobación y el informe se envían al propietario en privado. Cuando la sesión activa usa el arnés OpenAI Codex, la misma aprobación también envía comentarios relevantes de Codex a los servidores de OpenAI, y la respuesta completada lista los ids de sesión de OpenClaw, los ids de hilos de Codex y los comandos `codex resume <thread-id>`. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).
    - `/crestodian <request>` ejecuta el asistente de configuración y reparación de Crestodian desde un mensaje directo del propietario.
    - `/tasks` lista tareas en segundo plano activas/recientes de la sesión actual.
    - `/context [list|detail|json]` explica cómo se ensambla el contexto.
    - `/whoami` muestra tu id de remitente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen local de costos.

  </Accordion>
  <Accordion title="Skills, listas de permitidos, aprobaciones">
    - `/skill <name> [input]` ejecuta una Skill por nombre.
    - `/allowlist [list|add|remove] ...` gestiona entradas de la lista de permitidos. Solo texto.
    - `/approve <id> <decision>` resuelve solicitudes de aprobación de ejecución.
    - `/btw <question>` hace una pregunta secundaria sin cambiar el contexto futuro de la sesión. Consulta [BTW](/es/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` administra ejecuciones de subagentes para la sesión actual.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` administra sesiones ACP y opciones de ejecución.
    - `/focus <target>` vincula el hilo de Discord o el tema/conversación de Telegram actual a un destino de sesión.
    - `/unfocus` elimina el vínculo actual.
    - `/agents` enumera los agentes vinculados al hilo para la sesión actual.
    - `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
    - `/steer <id|#> <message>` envía instrucciones a un subagente en ejecución. Alias: `/tell`.

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo para el propietario. Requiere `commands.config: true`.
    - `/mcp show|get|set|unset` lee o escribe la configuración del servidor MCP administrado por OpenClaw bajo `mcp.servers`. Solo para el propietario. Requiere `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado de los plugins. `/plugin` es un alias. Las escrituras son solo para el propietario. Requiere `commands.plugins: true`.
    - `/debug show|set|unset|reset` administra anulaciones de configuración solo de runtime. Solo para el propietario. Requiere `commands.debug: true`.
    - `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; establece `commands.restart: false` para deshabilitarlo.
    - `/send on|off|inherit` establece la política de envío. Solo para el propietario.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controla TTS. Consulta [TTS](/es/tools/tts).
    - `/activation mention|always` establece el modo de activación de grupo.
    - `/bash <command>` ejecuta un comando de shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permisos `tools.elevated`.
    - `!poll [sessionId]` comprueba un trabajo bash en segundo plano.
    - `!stop [sessionId]` detiene un trabajo bash en segundo plano.

  </Accordion>
</AccordionGroup>

### Comandos dock generados

Los comandos dock cambian la ruta de respuesta de la sesión actual a otro
canal vinculado. Consulta [Acoplamiento de canales](/es/concepts/channel-docking) para configuración,
ejemplos y solución de problemas.

Los comandos dock se generan a partir de plugins de canal con soporte de comandos nativos. Conjunto incluido actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Usa comandos dock desde un chat directo para cambiar la ruta de respuesta de la sesión actual a otro canal vinculado. El agente conserva el mismo contexto de sesión, pero las respuestas futuras de esa sesión se entregan al peer del canal seleccionado.

Los comandos dock requieren `session.identityLinks`. El remitente de origen y el peer de destino deben estar en el mismo grupo de identidad, por ejemplo `["telegram:123", "discord:456"]`. Si un usuario de Telegram con id `123` envía `/dock_discord`, OpenClaw almacena `lastChannel: "discord"` y `lastTo: "456"` en la sesión activa. Si el remitente no está vinculado a un peer de Discord, el comando responde con una sugerencia de configuración en lugar de pasar al chat normal.

Docking solo cambia la ruta de la sesión activa. No crea cuentas de canal, concede acceso, omite listas de permisos de canales ni mueve el historial de transcripción a otra sesión. Usa `/dock-telegram`, `/dock-slack`, `/dock-mattermost` u otro comando dock generado para volver a cambiar la ruta.

### Comandos de plugins incluidos

Los plugins incluidos pueden agregar más comandos slash. Comandos incluidos actuales en este repositorio:

- `/dreaming [on|off|status|help]` activa o desactiva Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` administra el flujo de emparejamiento/configuración de dispositivos. Consulta [Emparejamiento](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporalmente comandos de nodo telefónico de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` administra la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecciona y controla el arnés de servidor de aplicación Codex incluido. Consulta [Arnés de Codex](/es/plugins/codex-harness).
- Comandos exclusivos de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de Skills

Las Skills invocables por el usuario también se exponen como comandos slash:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- Las Skills también pueden aparecer como comandos directos como `/prose` cuando la Skill o el plugin los registra.
- El registro de comandos nativos de Skills se controla mediante `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.
- Las especificaciones de comandos pueden proporcionar `descriptionLocalizations` para superficies nativas que admiten descripciones localizadas, incluido Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (p. ej., `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia aproximada); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
    - Para ver el desglose completo de uso por proveedor, usa `openclaw status --usage`.
    - `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
    - En canales con varias cuentas, `/allowlist --account <id>` dirigido a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
    - `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen de costos local desde los registros de sesión de OpenClaw.
    - `/restart` está habilitado de forma predeterminada; establece `commands.restart: false` para deshabilitarlo.
    - `/plugins install <spec>` acepta las mismas especificaciones de plugin que `openclaw plugins install`: ruta/archivo local, paquete npm, `git:<repo>` o `clawhub:<pkg>`, y luego solicita un reinicio de Gateway porque cambiaron los módulos fuente del plugin.
    - `/plugins enable|disable` actualiza la configuración del plugin y activa la recarga de plugins de Gateway para nuevos turnos del agente.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Comando nativo exclusivo de Discord: `/vc join|leave|status` controla canales de voz (no disponible como texto). `join` requiere un servidor y un canal de voz/escenario seleccionado. Requiere `channels.discord.voice` y comandos nativos.
    - Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que estén habilitados los vínculos efectivos de hilos (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
    - Referencia de comandos ACP y comportamiento de runtime: [Agentes ACP](/es/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en el uso normal.
    - `/trace` es más específico que `/verbose`: solo revela líneas de seguimiento/depuración propiedad del plugin y mantiene desactivado el ruido verbose normal de herramientas.
    - `/fast on|off` persiste una anulación de sesión. Usa la opción `inherit` de la IU Sessions para borrarla y volver a los valores predeterminados de configuración.
    - `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos Responses, mientras que las solicitudes públicas directas a Anthropic, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
    - Los resúmenes de fallos de herramientas siguen mostrándose cuando son relevantes, pero el texto detallado del fallo solo se incluye cuando `/verbose` está `on` o `full`.
    - `/reasoning`, `/verbose` y `/trace` son riesgosos en entornos de grupo: pueden revelar razonamiento interno, salida de herramientas o diagnósticos de plugins que no pretendías exponer. Es preferible dejarlos desactivados, especialmente en chats grupales.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` persiste inmediatamente el nuevo modelo de sesión.
    - Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
    - Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede permanecer en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
    - En la TUI local, `/crestodian [request]` vuelve de la TUI normal del agente a Crestodian. Esto es independiente del modo de rescate de canales de mensajes y no concede autoridad de configuración remota.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Ruta rápida:** los mensajes de solo comando de remitentes permitidos se gestionan de inmediato (omiten cola + modelo).
    - **Control de menciones en grupos:** los mensajes de solo comando de remitentes permitidos omiten los requisitos de mención.
    - **Atajos inline (solo remitentes permitidos):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
      - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
    - Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Los mensajes de solo comando no autorizados se ignoran silenciosamente, y los tokens inline `/...` se tratan como texto sin formato.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Comandos de Skills:** las Skills `user-invocable` se exponen como comandos slash. Los nombres se saneean a `a-z0-9_` (máximo 32 caracteres); las colisiones reciben sufijos numéricos (p. ej., `_2`).
      - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden comandos por Skill).
      - De forma predeterminada, los comandos de Skills se reenvían al modelo como una solicitud normal.
      - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
      - Ejemplo: `/prose` (plugin OpenProse) — consulta [OpenProse](/es/prose).
    - **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos requeridos). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento. Las opciones dinámicas se resuelven contra el modelo de la sesión de destino, por lo que las opciones específicas del modelo, como los niveles de `/think`, siguen la anulación de `/model` de esa sesión.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` responde una pregunta de runtime, no una pregunta de configuración: **qué puede usar este agente ahora mismo en esta conversación**.

- `/tools` predeterminado es compacto y está optimizado para un escaneo rápido.
- `/tools verbose` agrega descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo cambio de modo que `compact|verbose`.
- Los resultados están delimitados por sesión, por lo que cambiar el agente, el canal, el hilo, la autorización del remitente o el modelo puede cambiar la salida.
- `/tools` incluye herramientas que son realmente accesibles en runtime, incluidas herramientas core, herramientas de plugins conectados y herramientas propiedad del canal.

Para editar perfiles y anulaciones, usa el panel Tools de la IU Control o las superficies de configuración/catálogo en lugar de tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra dónde)

- **Uso/cuota del proveedor** (ejemplo: "Claude 80% left") aparece en `/status` para el proveedor de modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% left`; para MiniMax, los campos de porcentaje de solo restante se invierten antes de mostrarse, y las respuestas de `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan con la etiqueta del modelo.
- **Líneas de tokens/caché** en `/status` pueden recurrir a la entrada de uso más reciente de la transcripción cuando la instantánea de sesión en vivo es escasa. Los valores en vivo no nulos existentes siguen teniendo prioridad, y el respaldo de transcripción también puede recuperar la etiqueta del modelo de runtime activo más un total mayor orientado al prompt cuando faltan los totales almacenados o son menores.
- **Ejecución frente a runtime:** `/status` informa `Execution` para la ruta efectiva del sandbox y `Runtime` para quién está ejecutando realmente la sesión: `OpenClaw Pi Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP.
- **Tokens/coste por respuesta** se controla con `/usage off|tokens|full` (se añade a las respuestas normales).
- `/model status` trata sobre **modelos/autenticación/endpoints**, no sobre uso.

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

- `/model` y `/model list` muestran un selector compacto y numerado (familia de modelos + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo, además de un paso de envío.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint de proveedor configurado (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

## Sustituciones de depuración

`/debug` te permite establecer sustituciones de configuración **solo de runtime** (memoria, no disco). Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Las sustituciones se aplican inmediatamente a las nuevas lecturas de configuración, pero **no** se escriben en `openclaw.json`. Usa `/debug reset` para borrar todas las sustituciones y volver a la configuración en disco.
</Note>

## Salida de traza de Plugin

`/trace` te permite alternar **líneas de traza/depuración de plugins con alcance de sesión** sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumento muestra el estado actual de trazas de la sesión.
- `/trace on` habilita las líneas de traza de plugins para la sesión actual.
- `/trace off` las deshabilita de nuevo.
- Las líneas de traza de plugins pueden aparecer en `/status` y como un mensaje de diagnóstico posterior después de la respuesta normal del asistente.
- `/trace` no reemplaza a `/debug`; `/debug` sigue gestionando sustituciones de configuración solo de runtime.
- `/trace` no reemplaza a `/verbose`; la salida detallada normal de herramientas/estado sigue perteneciendo a `/verbose`.

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

<Note>
La configuración se valida antes de escribir; los cambios no válidos se rechazan. Las actualizaciones de `/config` persisten entre reinicios.
</Note>

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidores MCP gestionadas por OpenClaw bajo `mcp.servers`. Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` almacena la configuración en la configuración de OpenClaw, no en ajustes de proyecto propiedad de Pi. Los adaptadores de runtime deciden qué transportes son realmente ejecutables.
</Note>

## Actualizaciones de plugins

`/plugins` permite a los operadores inspeccionar plugins descubiertos y alternar su habilitación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Deshabilitado de forma predeterminada; habilítalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` y `/plugins show` usan descubrimiento real de plugins contra el espacio de trabajo actual más la configuración en disco.
- `/plugins install` instala desde ClawHub, npm, git, directorios locales y archivos.
- `/plugins enable|disable` solo actualiza la configuración de plugins; no instala ni desinstala plugins.
- Los cambios de habilitación y deshabilitación recargan en caliente las superficies de runtime de plugins del Gateway para nuevos turnos de agente; la instalación solicita un reinicio del Gateway porque los módulos fuente del plugin cambiaron.

</Note>

## Notas de superficie

<AccordionGroup>
  <Accordion title="Sesiones por superficie">
    - **Comandos de texto** se ejecutan en la sesión de chat normal (los MD comparten `main`; los grupos tienen su propia sesión).
    - **Comandos nativos** usan sesiones aisladas:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (apunta a la sesión de chat mediante `CommandTargetSessionKey`)
    - **`/stop`** apunta a la sesión de chat activa para poder abortar la ejecución actual.

  </Accordion>
  <Accordion title="Detalles específicos de Slack">
    `channels.slack.slashCommand` sigue siendo compatible con un único comando de estilo `/openclaw`. Si habilitas `commands.native`, debes crear un comando slash de Slack por cada comando integrado (los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.

    Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

  </Accordion>
</AccordionGroup>

## Preguntas secundarias BTW

`/btw` es una **pregunta secundaria** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada puntual separada **sin herramientas**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de transcripción,
- se entrega como un resultado secundario en vivo en lugar de como un mensaje normal del asistente.

Esto hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la tarea principal sigue avanzando.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [Preguntas secundarias BTW](/es/tools/btw) para ver el comportamiento completo y los detalles de UX del cliente.

## Relacionado

- [Crear skills](/es/tools/creating-skills)
- [Skills](/es/tools/skills)
- [Configuración de Skills](/es/tools/skills-config)
