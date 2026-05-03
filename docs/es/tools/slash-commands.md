---
read_when:
    - Usar o configurar comandos de chat
    - Depuración del enrutamiento de comandos o permisos
sidebarTitle: Slash commands
summary: 'Comandos de barra diagonal: texto frente a nativos, configuración y comandos admitidos'
title: Comandos de barra diagonal
x-i18n:
    generated_at: "2026-05-03T21:39:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

Los comandos los gestiona el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que empieza con `/`. El comando de chat bash solo para el host usa `! <cmd>` (con `/bash <cmd>` como alias).

Cuando una conversación o hilo está vinculado a una sesión ACP, el texto normal de seguimiento se enruta a ese arnés ACP. Los comandos de administración del Gateway siguen siendo locales: `/acp ...` siempre llega al manejador de comandos ACP de OpenClaw, y `/status` más `/unfocus` permanecen locales siempre que el manejo de comandos esté habilitado para la superficie.

Hay dos sistemas relacionados:

<AccordionGroup>
  <Accordion title="Commands">
    Mensajes independientes `/...`.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
    - En mensajes de chat normales (no solo directivas), se tratan como "sugerencias en línea" y **no** persisten la configuración de la sesión.
    - En mensajes solo de directivas (el mensaje contiene solo directivas), se persisten en la sesión y responden con una confirmación.
    - Las directivas solo se aplican para **remitentes autorizados**. Si `commands.allowFrom` está configurado, es la única lista de permitidos usada; de lo contrario, la autorización proviene de las listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`. Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Solo remitentes en lista de permitidos/autorizados: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Se ejecutan de inmediato, se eliminan antes de que el modelo vea el mensaje, y el texto restante continúa por el flujo normal.

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
  Habilita el análisis de `/...` en mensajes de chat. En superficies sin comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), los comandos de texto siguen funcionando aunque establezcas esto en `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Auto: activado para Discord/Telegram; desactivado para Slack (hasta que agregues comandos slash); ignorado para proveedores sin soporte nativo. Establece `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para anular por proveedor (booleano o `"auto"`). En Discord, `false` omite el registro y la limpieza de comandos slash durante el inicio; los comandos registrados anteriormente pueden seguir visibles hasta que los elimines de la aplicación Discord. Los comandos de Slack se gestionan en la aplicación Slack y no se eliminan automáticamente.
</ParamField>
En Discord, las especificaciones de comandos nativos pueden incluir `descriptionLocalizations`, que OpenClaw publica como `description_localizations` de Discord e incluye en las comparaciones de reconciliación.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de **Skills** de forma nativa cuando se admite. Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un comando slash por skill). Establece `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para anular por proveedor (booleano o `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para ejecutar comandos del shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos de `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controla cuánto tiempo espera bash antes de cambiar al modo en segundo plano (`0` pasa a segundo plano de inmediato).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lee/escribe `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lee/escribe la configuración MCP gestionada por OpenClaw bajo `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descubrimiento/estado de plugins más controles de instalación y activación/desactivación).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (anulaciones solo de runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` más acciones de herramienta para reiniciar el Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Establece la lista explícita de permitidos de propietario para superficies de comandos/herramientas solo para propietarios. Esta es la cuenta del operador humano que puede aprobar acciones peligrosas y ejecutar comandos como `/diagnostics`, `/export-trajectory` y `/config`. Es independiente de `commands.allowFrom` y del acceso por emparejamiento de DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: hace que los comandos solo para propietarios requieran **identidad de propietario** para ejecutarse en esa superficie. Cuando es `true`, el remitente debe coincidir con un candidato de propietario resuelto (por ejemplo, una entrada en `commands.ownerAllowFrom` o metadatos de propietario nativos del proveedor) o tener el alcance interno `operator.admin` en un canal de mensajes interno. Una entrada comodín en `allowFrom` del canal, o una lista vacía/no resuelta de candidatos de propietario, **no** es suficiente: los comandos solo para propietarios fallan de forma cerrada en ese canal. Deja esto desactivado si quieres que los comandos solo para propietarios estén protegidos solo por `ownerAllowFrom` y las listas de permitidos de comandos estándar.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla cómo aparecen los ids de propietario en el prompt del sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcionalmente establece el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista de permitidos por proveedor para autorización de comandos. Cuando está configurada, es la única fuente de autorización para comandos y directivas (se ignoran las listas de permitidos/emparejamiento de canal y `commands.useAccessGroups`). Usa `"*"` para un valor predeterminado global; las claves específicas de proveedor lo anulan.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está configurado.
</ParamField>

## Lista de comandos

Fuente de verdad actual:

- los integrados principales provienen de `src/auto-reply/commands-registry.shared.ts`
- los comandos de dock generados provienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de plugins provienen de llamadas `registerCommand()` de plugins
- la disponibilidad real en tu gateway sigue dependiendo de flags de configuración, la superficie del canal y los plugins instalados/habilitados

### Comandos integrados principales

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` inicia una sesión nueva; `/reset` es el alias de reinicio.
    - Control UI intercepta `/new` escrito para crear y cambiar a una sesión de dashboard nueva; `/reset` escrito sigue ejecutando el reinicio in situ del Gateway.
    - `/reset soft [message]` conserva la transcripción actual, descarta ids de sesión de backend CLI reutilizados y vuelve a ejecutar la carga de inicio/prompt del sistema in situ.
    - `/compact [instructions]` compacta el contexto de la sesión. Consulta [Compaction](/es/concepts/compaction).
    - `/stop` aborta la ejecución actual.
    - `/session idle <duration|off>` y `/session max-age <duration|off>` gestionan la expiración del vínculo de hilos.
    - `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
    - `/export-trajectory [path]` solicita aprobación de exec y luego exporta un [paquete de trayectoria](/es/tools/trajectory) JSONL para la sesión actual. Úsalo cuando necesites la línea de tiempo de prompt, herramienta y transcripción para una sesión de OpenClaw. En chats grupales, el prompt de aprobación y el resultado de exportación van al propietario de forma privada. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` establece el nivel de pensamiento. Las opciones provienen del perfil del proveedor del modelo activo; los niveles comunes son `off`, `minimal`, `low`, `medium` y `high`, con niveles personalizados como `xhigh`, `adaptive`, `max`, o el binario `on` solo donde se admitan. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` alterna la salida detallada. Alias: `/v`.
    - `/trace on|off` alterna la salida de trazas de plugins para la sesión actual.
    - `/fast [status|on|off]` muestra o establece el modo rápido.
    - `/reasoning [on|off|stream]` alterna la visibilidad del razonamiento. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` alterna el modo elevado. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece valores predeterminados de exec.
    - `/model [name|#|status]` muestra o establece el modelo.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lista proveedores configurados/con autenticación disponible o modelos de un proveedor; agrega `all` para explorar el catálogo completo de ese proveedor.
    - `/queue <mode>` gestiona el comportamiento de la cola (`steer`, `queue` heredado, `followup`, `collect`, `steer-backlog`, `interrupt`) más opciones como `debounce:0.5s cap:25 drop:summarize`; `/queue default` o `/queue reset` borra la anulación de sesión. Consulta [Cola de comandos](/es/concepts/queue) y [Cola de dirección](/es/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` muestra el resumen breve de ayuda.
    - `/commands` muestra el catálogo de comandos generado.
    - `/tools [compact|verbose]` muestra lo que el agente actual puede usar ahora mismo.
    - `/status` muestra el estado de ejecución/runtime, incluidas las etiquetas `Execution`/`Runtime` y el uso/cuota del proveedor cuando esté disponible.
    - `/diagnostics [note]` es el flujo de informe de soporte solo para propietarios para bugs del Gateway y ejecuciones del arnés Codex. Solicita aprobación explícita de exec cada vez antes de ejecutar `openclaw gateway diagnostics export --json`; no apruebes diagnósticos con una regla allow-all. Tras la aprobación, envía un informe pegable con la ruta del paquete local, el resumen del manifiesto, notas de privacidad e ids de sesión relevantes. En chats grupales, el prompt de aprobación y el informe van al propietario de forma privada. Cuando la sesión activa usa el arnés OpenAI Codex, la misma aprobación también envía comentarios relevantes de Codex a servidores de OpenAI y la respuesta completada lista los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos `codex resume <thread-id>`. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).
    - `/crestodian <request>` ejecuta el asistente de configuración y reparación Crestodian desde un DM del propietario.
    - `/tasks` lista tareas en segundo plano activas/recientes para la sesión actual.
    - `/context [list|detail|json]` explica cómo se ensambla el contexto.
    - `/whoami` muestra tu id de remitente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen de coste local.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` ejecuta una skill por nombre.
    - `/allowlist [list|add|remove] ...` gestiona entradas de lista de permitidos. Solo texto.
    - `/approve <id> <decision>` resuelve prompts de aprobación de exec.
    - `/btw <question>` hace una pregunta secundaria sin cambiar el contexto futuro de la sesión. Alias: `/side`. Consulta [BTW](/es/tools/btw).

  </Accordion>
  <Accordion title="Subagentes y ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gestiona ejecuciones de subagentes para la sesión actual.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestiona sesiones ACP y opciones de runtime.
    - `/focus <target>` vincula el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
    - `/unfocus` elimina el vínculo actual.
    - `/agents` enumera los agentes vinculados al hilo para la sesión actual.
    - `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
    - `/steer <id|#> <message>` envía instrucciones a un subagente en ejecución. Alias: `/tell`.

  </Accordion>
  <Accordion title="Escrituras solo para propietarios y administración">
    - `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo propietarios. Requiere `commands.config: true`.
    - `/mcp show|get|set|unset` lee o escribe la configuración de servidor MCP gestionada por OpenClaw en `mcp.servers`. Solo propietarios. Requiere `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado de los plugins. `/plugin` es un alias. Las escrituras son solo para propietarios. Requiere `commands.plugins: true`.
    - `/debug show|set|unset|reset` gestiona anulaciones de configuración solo de runtime. Solo propietarios. Requiere `commands.debug: true`.
    - `/restart` reinicia OpenClaw cuando está habilitado. Valor predeterminado: habilitado; define `commands.restart: false` para deshabilitarlo.
    - `/send on|off|inherit` define la política de envío. Solo propietarios.

  </Accordion>
  <Accordion title="Voz, TTS y control de canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controla TTS. Consulta [TTS](/es/tools/tts).
    - `/activation mention|always` define el modo de activación de grupo.
    - `/bash <command>` ejecuta un comando de shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permitidos de `tools.elevated`.
    - `!poll [sessionId]` comprueba un trabajo bash en segundo plano.
    - `!stop [sessionId]` detiene un trabajo bash en segundo plano.

  </Accordion>
</AccordionGroup>

### Comandos de acoplamiento generados

Los comandos de acoplamiento cambian la ruta de respuesta de la sesión actual a otro
canal vinculado. Consulta [Acoplamiento de canales](/es/concepts/channel-docking) para la configuración,
ejemplos y solución de problemas.

Los comandos de acoplamiento se generan a partir de plugins de canal con compatibilidad con comandos nativos. Conjunto incluido actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Usa comandos de acoplamiento desde un chat directo para cambiar la ruta de respuesta de la sesión actual a otro canal vinculado. El agente conserva el mismo contexto de sesión, pero las respuestas futuras de esa sesión se entregan al par de canal seleccionado.

Los comandos de acoplamiento requieren `session.identityLinks`. El remitente de origen y el par de destino deben estar en el mismo grupo de identidad, por ejemplo `["telegram:123", "discord:456"]`. Si un usuario de Telegram con id `123` envía `/dock_discord`, OpenClaw almacena `lastChannel: "discord"` y `lastTo: "456"` en la sesión activa. Si el remitente no está vinculado a un par de Discord, el comando responde con una indicación de configuración en vez de pasar al chat normal.

El acoplamiento solo cambia la ruta de la sesión activa. No crea cuentas de canal, no concede acceso, no omite listas de permitidos de canal ni mueve el historial de transcripción a otra sesión. Usa `/dock-telegram`, `/dock-slack`, `/dock-mattermost` u otro comando de acoplamiento generado para volver a cambiar la ruta.

### Comandos de plugins incluidos

Los plugins incluidos pueden añadir más comandos de barra. Comandos incluidos actuales en este repositorio:

- `/dreaming [on|off|status|help]` activa o desactiva Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestiona el flujo de emparejamiento/configuración de dispositivos. Consulta [Emparejamiento](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporalmente comandos de nodo telefónico de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` gestiona la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecciona y controla el arnés de servidor de aplicación Codex incluido. Consulta [Arnés Codex](/es/plugins/codex-harness).
- Comandos solo para QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos de Skills dinámicos

Las Skills invocables por el usuario también se exponen como comandos de barra:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- Las Skills también pueden aparecer como comandos directos como `/prose` cuando la Skill/el plugin los registra.
- El registro nativo de comandos de Skills se controla mediante `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.
- Las especificaciones de comandos pueden proporcionar `descriptionLocalizations` para superficies nativas que admiten descripciones localizadas, incluido Discord.

<AccordionGroup>
  <Accordion title="Notas de argumentos y analizador">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia aproximada); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
    - Para un desglose completo del uso por proveedor, usa `openclaw status --usage`.
    - `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
    - En canales con varias cuentas, `/allowlist --account <id>` orientado a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
    - `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costos a partir de los registros de sesión de OpenClaw.
    - `/restart` está habilitado de forma predeterminada; define `commands.restart: false` para deshabilitarlo.
    - `/plugins install <spec>` acepta las mismas especificaciones de plugin que `openclaw plugins install`: ruta/archivo local, paquete npm, `git:<repo>` o `clawhub:<pkg>`, y luego solicita un reinicio de Gateway porque cambiaron los módulos de origen del plugin.
    - `/plugins enable|disable` actualiza la configuración de plugins y activa la recarga de plugins de Gateway para nuevos turnos de agente.

  </Accordion>
  <Accordion title="Comportamiento específico del canal">
    - Comando nativo solo para Discord: `/vc join|leave|status` controla canales de voz (no disponible como texto). `join` requiere un servidor y un canal de voz/escenario seleccionado. Requiere `channels.discord.voice` y comandos nativos.
    - Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que las vinculaciones de hilos efectivas estén habilitadas (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
    - Referencia de comandos ACP y comportamiento de runtime: [Agentes ACP](/es/tools/acp-agents).

  </Accordion>
  <Accordion title="Seguridad de verbose / trace / fast / razonamiento">
    - `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en el uso normal.
    - `/trace` es más limitado que `/verbose`: solo revela líneas de trace/depuración propiedad del plugin y mantiene desactivado el ruido verbose normal de herramientas.
    - `/fast on|off` persiste una anulación de sesión. Usa la opción `inherit` de la interfaz de Sessions para borrarla y volver a los valores predeterminados de configuración.
    - `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes públicas directas a Anthropic, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
    - Los resúmenes de fallos de herramientas siguen mostrándose cuando son relevantes, pero el texto detallado del fallo solo se incluye cuando `/verbose` está `on` o `full`.
    - `/reasoning`, `/verbose` y `/trace` son riesgosos en entornos de grupo: pueden revelar razonamiento interno, salida de herramientas o diagnósticos de plugins que no pretendías exponer. Prefiere dejarlos desactivados, especialmente en chats grupales.

  </Accordion>
  <Accordion title="Cambio de modelo">
    - `/model` persiste el nuevo modelo de sesión inmediatamente.
    - Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto de reintento limpio.
    - Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede permanecer en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
    - En la TUI local, `/crestodian [request]` vuelve de la TUI normal del agente a Crestodian. Esto es independiente del modo de rescate de canal de mensajes y no concede autoridad de configuración remota.

  </Accordion>
  <Accordion title="Ruta rápida y atajos en línea">
    - **Ruta rápida:** los mensajes solo de comando de remitentes en la lista de permitidos se gestionan de inmediato (omiten la cola y el modelo).
    - **Control de menciones en grupo:** los mensajes solo de comando de remitentes en la lista de permitidos omiten los requisitos de mención.
    - **Atajos en línea (solo remitentes en la lista de permitidos):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
      - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
    - Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Los mensajes solo de comando no autorizados se ignoran silenciosamente, y los tokens `/...` en línea se tratan como texto sin formato.

  </Accordion>
  <Accordion title="Comandos de Skills y argumentos nativos">
    - **Comandos de Skills:** las Skills `user-invocable` se exponen como comandos de barra. Los nombres se saneamiento a `a-z0-9_` (máx. 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo, `_2`).
      - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden comandos por Skill).
      - De forma predeterminada, los comandos de Skills se reenvían al modelo como una solicitud normal.
      - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
      - Ejemplo: `/prose` (plugin OpenProse); consulta [OpenProse](/es/prose).
    - **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos obligatorios). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento. Las opciones dinámicas se resuelven contra el modelo de la sesión de destino, por lo que las opciones específicas del modelo, como los niveles de `/think`, siguen la anulación de `/model` de esa sesión.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` responde a una pregunta de runtime, no a una pregunta de configuración: **qué puede usar este agente ahora mismo en esta conversación**.

- `/tools` predeterminado es compacto y está optimizado para un escaneo rápido.
- `/tools verbose` añade descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo selector de modo que `compact|verbose`.
- Los resultados tienen alcance de sesión, por lo que cambiar el agente, el canal, el hilo, la autorización del remitente o el modelo puede cambiar la salida.
- `/tools` incluye herramientas que son realmente accesibles en runtime, incluidas herramientas principales, herramientas de plugins conectados y herramientas propiedad del canal.

Para editar perfiles y anulaciones, usa el panel Tools de la interfaz de Control o las superficies de configuración/catálogo en vez de tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra dónde)

- **Uso/cuota del proveedor** (ejemplo: "Claude 80% restante") aparece en `/status` para el proveedor de modelos actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% restante`; para MiniMax, los campos porcentuales de solo restante se invierten antes de mostrarse, y las respuestas de `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan con etiqueta de modelo.
- **Líneas de tokens/caché** en `/status` pueden recurrir a la entrada de uso de transcripción más reciente cuando la instantánea de la sesión en vivo tiene pocos datos. Los valores en vivo existentes distintos de cero siguen teniendo prioridad, y la alternativa de transcripción también puede recuperar la etiqueta del modelo de runtime activo más un total mayor orientado al prompt cuando los totales almacenados faltan o son menores.
- **Ejecución frente a runtime:** `/status` informa `Execution` para la ruta efectiva del sandbox y `Runtime` para quién está ejecutando realmente la sesión: `OpenClaw Pi Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP.
- **Tokens/coste por respuesta** se controla con `/usage off|tokens|full` (se añade a las respuestas normales).
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

- `/model` y `/model list` muestran un selector compacto y numerado (familia de modelos + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo, más un paso de Enviar.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint del proveedor configurado (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

## Overrides de depuración

`/debug` te permite definir overrides de configuración **solo de runtime** (memoria, no disco). Solo para propietarios. Deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Los overrides se aplican inmediatamente a las nuevas lecturas de configuración, pero **no** escriben en `openclaw.json`. Usa `/debug reset` para borrar todos los overrides y volver a la configuración en disco.
</Note>

## Salida de traza de Plugin

`/trace` te permite alternar **líneas de traza/depuración de Plugin con ámbito de sesión** sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumento muestra el estado actual de traza de la sesión.
- `/trace on` habilita las líneas de traza de Plugin para la sesión actual.
- `/trace off` las deshabilita de nuevo.
- Las líneas de traza de Plugin pueden aparecer en `/status` y como un mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.
- `/trace` no reemplaza a `/debug`; `/debug` sigue gestionando overrides de configuración solo de runtime.
- `/trace` no reemplaza a `/verbose`; la salida detallada normal de herramientas/estado sigue perteneciendo a `/verbose`.

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

<Note>
La configuración se valida antes de escribirse; los cambios no válidos se rechazan. Las actualizaciones de `/config` persisten entre reinicios.
</Note>

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidor MCP gestionadas por OpenClaw bajo `mcp.servers`. Solo para propietarios. Deshabilitado de forma predeterminada; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` almacena la configuración en la configuración de OpenClaw, no en los ajustes de proyecto propiedad de Pi. Los adaptadores de runtime deciden qué transportes son realmente ejecutables.
</Note>

## Actualizaciones de Plugin

`/plugins` permite a los operadores inspeccionar Plugins descubiertos y alternar su habilitación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Deshabilitado de forma predeterminada; habilítalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` y `/plugins show` usan descubrimiento real de Plugins contra el workspace actual más la configuración en disco.
- `/plugins install` instala desde ClawHub, npm, git, directorios locales y archivos.
- `/plugins enable|disable` actualiza solo la configuración de Plugins; no instala ni desinstala Plugins.
- Los cambios de habilitación y deshabilitación recargan en caliente las superficies de runtime de Plugins de Gateway para nuevos turnos de agente; la instalación solicita un reinicio de Gateway porque cambiaron los módulos fuente del Plugin.

</Note>

## Notas de superficie

<AccordionGroup>
  <Accordion title="Sesiones por superficie">
    - **Comandos de texto** se ejecutan en la sesión de chat normal (los DM comparten `main`, los grupos tienen su propia sesión).
    - **Comandos nativos** usan sesiones aisladas:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (apunta a la sesión de chat mediante `CommandTargetSessionKey`)
    - **`/stop`** apunta a la sesión de chat activa para que pueda abortar la ejecución actual.

  </Accordion>
  <Accordion title="Detalles específicos de Slack">
    `channels.slack.slashCommand` sigue siendo compatible para un único comando de estilo `/openclaw`. Si habilitas `commands.native`, debes crear un comando slash de Slack por cada comando integrado (los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.

    Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

  </Accordion>
</AccordionGroup>

## Preguntas secundarias de paso

`/btw` es una **pregunta secundaria** rápida sobre la sesión actual. `/side` es un alias.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada independiente de una sola vez **sin herramientas**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de transcripción,
- se entrega como un resultado lateral en vivo en lugar de como un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la tarea principal sigue avanzando.

Ejemplo:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Consulta [Preguntas secundarias de paso](/es/tools/btw) para ver el comportamiento completo y los detalles de UX del cliente.

## Relacionado

- [Crear Skills](/es/tools/creating-skills)
- [Skills](/es/tools/skills)
- [Configuración de Skills](/es/tools/skills-config)
