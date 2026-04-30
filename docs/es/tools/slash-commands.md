---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o permisos
sidebarTitle: Slash commands
summary: 'Comandos de barra diagonal: de texto frente a nativos, configuración y comandos compatibles'
title: Comandos de barra inclinada
x-i18n:
    generated_at: "2026-04-30T06:06:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

Los comandos son gestionados por el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que empieza con `/`. El comando de chat bash solo para host usa `! <cmd>` (con `/bash <cmd>` como alias).

Cuando una conversación o hilo está vinculado a una sesión ACP, el texto normal de seguimiento se dirige a ese entorno ACP. Los comandos de gestión del Gateway siguen siendo locales: `/acp ...` siempre llega al manejador de comandos ACP de OpenClaw, y `/status` junto con `/unfocus` permanecen locales siempre que el manejo de comandos esté habilitado para la superficie.

Hay dos sistemas relacionados:

<AccordionGroup>
  <Accordion title="Comandos">
    Mensajes `/...` independientes.
  </Accordion>
  <Accordion title="Directivas">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
    - En mensajes de chat normales (no solo directivas), se tratan como "sugerencias en línea" y **no** persisten la configuración de la sesión.
    - En mensajes solo de directivas (el mensaje contiene únicamente directivas), persisten en la sesión y responden con una confirmación.
    - Las directivas solo se aplican para **remitentes autorizados**. Si `commands.allowFrom` está definido, es la única lista de permitidos usada; de lo contrario, la autorización proviene de las listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`. Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

  </Accordion>
  <Accordion title="Atajos en línea">
    Solo remitentes en lista de permitidos/autorizados: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Se ejecutan inmediatamente, se eliminan antes de que el modelo vea el mensaje y el texto restante continúa por el flujo normal.

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
  Registra comandos nativos. Auto: activado para Discord/Telegram; desactivado para Slack (hasta que agregues comandos slash); ignorado para proveedores sin soporte nativo. Define `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para sobrescribirlo por proveedor (booleano o `"auto"`). `false` borra los comandos registrados previamente en Discord/Telegram al inicio. Los comandos de Slack se gestionan en la aplicación de Slack y no se eliminan automáticamente.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de **Skill** de forma nativa cuando es compatible. Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un comando slash por Skill). Define `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para sobrescribirlo por proveedor (booleano o `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para ejecutar comandos de shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos de `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controla cuánto tiempo espera bash antes de cambiar al modo en segundo plano (`0` pasa a segundo plano inmediatamente).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lee/escribe `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lee/escribe la configuración MCP gestionada por OpenClaw bajo `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descubrimiento/estado de plugins, además de controles de instalación y activación/desactivación).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (sobrescrituras solo en tiempo de ejecución).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` además de acciones de herramienta para reiniciar el gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Define la lista explícita de permitidos del propietario para superficies de comandos/herramientas solo para propietario. Esta es la cuenta del operador humano que puede aprobar acciones peligrosas y ejecutar comandos como `/diagnostics`, `/export-trajectory` y `/config`. Es independiente de `commands.allowFrom` y del acceso por emparejamiento de DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: hace que los comandos solo para propietario requieran **identidad de propietario** para ejecutarse en esa superficie. Cuando es `true`, el remitente debe coincidir con un candidato de propietario resuelto (por ejemplo, una entrada en `commands.ownerAllowFrom` o metadatos de propietario nativos del proveedor) o tener el alcance interno `operator.admin` en un canal de mensajes interno. Una entrada comodín en `allowFrom` del canal, o una lista vacía/no resuelta de candidatos de propietario, **no** es suficiente: los comandos solo para propietario fallan cerrados en ese canal. Déjalo desactivado si quieres que los comandos solo para propietario estén protegidos únicamente por `ownerAllowFrom` y las listas estándar de permitidos de comandos.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla cómo aparecen los ids de propietario en el prompt del sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcionalmente define el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista de permitidos por proveedor para la autorización de comandos. Cuando está configurada, es la única fuente de autorización para comandos y directivas (se ignoran las listas de permitidos/emparejamiento del canal y `commands.useAccessGroups`). Usa `"*"` para un valor global predeterminado; las claves específicas del proveedor lo sobrescriben.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está definido.
</ParamField>

## Lista de comandos

Fuente de verdad actual:

- los integrados principales vienen de `src/auto-reply/commands-registry.shared.ts`
- los comandos dock generados vienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de plugin vienen de llamadas `registerCommand()` de plugins
- la disponibilidad real en tu gateway sigue dependiendo de los indicadores de configuración, la superficie del canal y los plugins instalados/habilitados

### Comandos integrados principales

<AccordionGroup>
  <Accordion title="Sesiones y ejecuciones">
    - `/new [model]` inicia una nueva sesión; `/reset` es el alias de restablecimiento.
    - `/reset soft [message]` conserva la transcripción actual, descarta los ids de sesión reutilizados del backend CLI y vuelve a ejecutar la carga de inicio/prompt del sistema en el mismo lugar.
    - `/compact [instructions]` compacta el contexto de la sesión. Consulta [Compaction](/es/concepts/compaction).
    - `/stop` aborta la ejecución actual.
    - `/session idle <duration|off>` y `/session max-age <duration|off>` gestionan la expiración de vinculación de hilos.
    - `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
    - `/export-trajectory [path]` solicita aprobación de exec y luego exporta un [paquete de trayectoria](/es/tools/trajectory) JSONL para la sesión actual. Úsalo cuando necesites la línea temporal de prompt, herramienta y transcripción para una sesión de OpenClaw. En chats grupales, la solicitud de aprobación y el resultado de exportación van al propietario de forma privada. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Controles de modelo y ejecución">
    - `/think <level>` define el nivel de pensamiento. Las opciones provienen del perfil de proveedor del modelo activo; los niveles comunes son `off`, `minimal`, `low`, `medium` y `high`, con niveles personalizados como `xhigh`, `adaptive`, `max` o el binario `on` solo donde sea compatible. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` alterna la salida detallada. Alias: `/v`.
    - `/trace on|off` alterna la salida de trazas de plugins para la sesión actual.
    - `/fast [status|on|off]` muestra o define el modo rápido.
    - `/reasoning [on|off|stream]` alterna la visibilidad del razonamiento. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` alterna el modo elevado. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o define los valores predeterminados de exec.
    - `/model [name|#|status]` muestra o define el modelo.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lista proveedores configurados/con autenticación disponible o modelos para un proveedor; agrega `all` para explorar el catálogo completo de ese proveedor.
    - `/queue <mode>` gestiona el comportamiento de la cola (`steer`, `queue` legado, `followup`, `collect`, `steer-backlog`, `interrupt`) además de opciones como `debounce:0.5s cap:25 drop:summarize`; `/queue default` o `/queue reset` borra la sobrescritura de la sesión. Consulta [Cola de comandos](/es/concepts/queue) y [Cola de dirección](/es/concepts/queue-steering).

  </Accordion>
  <Accordion title="Descubrimiento y estado">
    - `/help` muestra el resumen breve de ayuda.
    - `/commands` muestra el catálogo de comandos generado.
    - `/tools [compact|verbose]` muestra lo que el agente actual puede usar ahora mismo.
    - `/status` muestra el estado de ejecución/tiempo de ejecución, incluidas las etiquetas `Execution`/`Runtime` y el uso/cuota del proveedor cuando esté disponible.
    - `/diagnostics [note]` es el flujo de informe de soporte solo para propietario para errores del Gateway y ejecuciones del entorno de Codex. Solicita aprobación explícita de exec cada vez antes de ejecutar `openclaw gateway diagnostics export --json`; no apruebes diagnósticos con una regla de permitir todo. Después de la aprobación, envía un informe pegable con la ruta local del paquete, resumen del manifiesto, notas de privacidad e ids de sesión relevantes. En chats grupales, la solicitud de aprobación y el informe van al propietario de forma privada. Cuando la sesión activa usa el entorno OpenAI Codex, la misma aprobación también envía comentarios relevantes de Codex a los servidores de OpenAI y la respuesta completada lista los ids de sesión de OpenClaw, ids de hilo de Codex y comandos `codex resume <thread-id>`. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).
    - `/crestodian <request>` ejecuta el asistente de configuración y reparación de Crestodian desde un DM del propietario.
    - `/tasks` lista tareas en segundo plano activas/recientes para la sesión actual.
    - `/context [list|detail|json]` explica cómo se arma el contexto.
    - `/whoami` muestra tu id de remitente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen de costo local.

  </Accordion>
  <Accordion title="Skills, listas de permitidos, aprobaciones">
    - `/skill <name> [input]` ejecuta una Skill por nombre.
    - `/allowlist [list|add|remove] ...` gestiona entradas de la lista de permitidos. Solo texto.
    - `/approve <id> <decision>` resuelve solicitudes de aprobación de exec.
    - `/btw <question>` hace una pregunta secundaria sin cambiar el contexto futuro de la sesión. Consulta [BTW](/es/tools/btw).

  </Accordion>
  <Accordion title="Subagentes y ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gestiona ejecuciones de subagentes para la sesión actual.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestiona sesiones ACP y opciones de tiempo de ejecución.
    - `/focus <target>` vincula el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
    - `/unfocus` elimina la vinculación actual.
    - `/agents` lista agentes vinculados al hilo para la sesión actual.
    - `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
    - `/steer <id|#> <message>` envía dirección a un subagente en ejecución. Alias: `/tell`.

  </Accordion>
  <Accordion title="Escrituras y administración solo del propietario">
    - `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo el propietario. Requiere `commands.config: true`.
    - `/mcp show|get|set|unset` lee o escribe la configuración de servidores MCP gestionada por OpenClaw bajo `mcp.servers`. Solo el propietario. Requiere `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado de los plugins. `/plugin` es un alias. Solo el propietario puede escribir. Requiere `commands.plugins: true`.
    - `/debug show|set|unset|reset` gestiona anulaciones de configuración solo de tiempo de ejecución. Solo el propietario. Requiere `commands.debug: true`.
    - `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; establece `commands.restart: false` para deshabilitarlo.
    - `/send on|off|inherit` establece la política de envío. Solo el propietario.

  </Accordion>
  <Accordion title="Voz, TTS y control de canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controla TTS. Consulta [TTS](/es/tools/tts).
    - `/activation mention|always` establece el modo de activación en grupo.
    - `/bash <command>` ejecuta un comando de shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permitidos de `tools.elevated`.
    - `!poll [sessionId]` comprueba un trabajo de bash en segundo plano.
    - `!stop [sessionId]` detiene un trabajo de bash en segundo plano.

  </Accordion>
</AccordionGroup>

### Comandos de anclaje generados

Los comandos de anclaje cambian la ruta de respuesta de la sesión actual a otro
canal vinculado. Consulta [Anclaje de canales](/es/concepts/channel-docking) para la configuración,
ejemplos y solución de problemas.

Los comandos de anclaje se generan a partir de plugins de canal con compatibilidad con comandos nativos. Conjunto empaquetado actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Usa comandos de anclaje desde un chat directo para cambiar la ruta de respuesta de la sesión actual a otro canal vinculado. El agente conserva el mismo contexto de sesión, pero las respuestas futuras de esa sesión se entregan al par del canal seleccionado.

Los comandos de anclaje requieren `session.identityLinks`. El remitente de origen y el par de destino deben estar en el mismo grupo de identidad, por ejemplo `["telegram:123", "discord:456"]`. Si un usuario de Telegram con id `123` envía `/dock_discord`, OpenClaw almacena `lastChannel: "discord"` y `lastTo: "456"` en la sesión activa. Si el remitente no está vinculado a un par de Discord, el comando responde con una pista de configuración en lugar de pasar al chat normal.

El anclaje solo cambia la ruta activa de la sesión. No crea cuentas de canal, concede acceso, omite listas de permitidos de canal ni mueve el historial de transcripción a otra sesión. Usa `/dock-telegram`, `/dock-slack`, `/dock-mattermost` u otro comando de anclaje generado para volver a cambiar la ruta.

### Comandos de plugins empaquetados

Los plugins empaquetados pueden añadir más comandos de barra. Comandos empaquetados actuales en este repositorio:

- `/dreaming [on|off|status|help]` activa o desactiva Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestiona el flujo de emparejamiento/configuración de dispositivos. Consulta [Emparejamiento](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporalmente comandos de nodo telefónico de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` gestiona la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecciona y controla el arnés del servidor de aplicaciones Codex empaquetado. Consulta [Arnés de Codex](/es/plugins/codex-harness).
- Comandos solo de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de Skills

Las Skills invocables por el usuario también se exponen como comandos de barra:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- Las Skills también pueden aparecer como comandos directos como `/prose` cuando la skill/plugin los registra.
- El registro de comandos nativos de Skills se controla mediante `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Notas sobre argumentos y analizador">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia aproximada); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
    - Para el desglose completo del uso por proveedor, usa `openclaw status --usage`.
    - `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
    - En canales con varias cuentas, `/allowlist --account <id>` dirigido a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
    - `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen de costos local desde los registros de sesión de OpenClaw.
    - `/restart` está habilitado de forma predeterminada; establece `commands.restart: false` para deshabilitarlo.
    - `/plugins install <spec>` acepta las mismas especificaciones de Plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
    - `/plugins enable|disable` actualiza la configuración de Plugin y puede solicitar un reinicio.

  </Accordion>
  <Accordion title="Comportamiento específico del canal">
    - Comando nativo solo de Discord: `/vc join|leave|status` controla canales de voz (no disponible como texto). `join` requiere un servidor y un canal de voz/escenario seleccionado. Requiere `channels.discord.voice` y comandos nativos.
    - Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que las vinculaciones de hilos efectivas estén habilitadas (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
    - Referencia de comandos ACP y comportamiento en tiempo de ejecución: [agentes ACP](/es/tools/acp-agents).

  </Accordion>
  <Accordion title="Seguridad de verbose / trace / fast / razonamiento">
    - `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en el uso normal.
    - `/trace` es más específico que `/verbose`: solo revela líneas de traza/depuración propiedad de plugins y mantiene desactivado el ruido detallado normal de las herramientas.
    - `/fast on|off` conserva una anulación de sesión. Usa la opción `inherit` de la interfaz de usuario Sessions para borrarla y volver a los valores predeterminados de configuración.
    - `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints Responses nativos, mientras que las solicitudes públicas directas de Anthropic, incluido el tráfico autenticado por OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
    - Los resúmenes de fallos de herramientas se siguen mostrando cuando son relevantes, pero el texto detallado del fallo solo se incluye cuando `/verbose` está `on` o `full`.
    - `/reasoning`, `/verbose` y `/trace` son riesgosos en contextos de grupo: pueden revelar razonamiento interno, salida de herramientas o diagnósticos de plugins que no pretendías exponer. Prefiere dejarlos desactivados, especialmente en chats grupales.

  </Accordion>
  <Accordion title="Cambio de modelo">
    - `/model` conserva el nuevo modelo de sesión inmediatamente.
    - Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
    - Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede permanecer en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
    - En la TUI local, `/crestodian [request]` vuelve de la TUI normal del agente a Crestodian. Esto es independiente del modo de rescate de canal de mensajes y no concede autoridad de configuración remota.

  </Accordion>
  <Accordion title="Ruta rápida y atajos en línea">
    - **Ruta rápida:** los mensajes solo de comando de remitentes en la lista de permitidos se manejan inmediatamente (omiten cola + modelo).
    - **Puerta por mención en grupo:** los mensajes solo de comando de remitentes en la lista de permitidos omiten los requisitos de mención.
    - **Atajos en línea (solo remitentes en la lista de permitidos):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
      - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
    - Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Los mensajes solo de comando no autorizados se ignoran silenciosamente, y los tokens `/...` en línea se tratan como texto sin formato.

  </Accordion>
  <Accordion title="Comandos de Skills y argumentos nativos">
    - **Comandos de Skills:** las Skills `user-invocable` se exponen como comandos de barra. Los nombres se saneaan a `a-z0-9_` (máximo 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo, `_2`).
      - `/skill <name> [input]` ejecuta una skill por nombre (útil cuando los límites de comandos nativos impiden comandos por skill).
      - De forma predeterminada, los comandos de Skills se reenvían al modelo como una solicitud normal.
      - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
      - Ejemplo: `/prose` (Plugin OpenProse) — consulta [OpenProse](/es/prose).
    - **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos obligatorios). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento. Las opciones dinámicas se resuelven contra el modelo de sesión de destino, por lo que las opciones específicas del modelo, como los niveles de `/think`, siguen la anulación de `/model` de esa sesión.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` responde a una pregunta de tiempo de ejecución, no a una pregunta de configuración: **qué puede usar este agente ahora mismo en esta conversación**.

- `/tools` predeterminado es compacto y está optimizado para una lectura rápida.
- `/tools verbose` añade descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo cambio de modo que `compact|verbose`.
- Los resultados tienen ámbito de sesión, por lo que cambiar el agente, canal, hilo, autorización del remitente o modelo puede cambiar la salida.
- `/tools` incluye herramientas que son realmente alcanzables en tiempo de ejecución, incluidas herramientas centrales, herramientas de Plugin conectadas y herramientas propiedad del canal.

Para editar perfiles y anulaciones, usa el panel Tools de la Control UI o las superficies de configuración/catálogo en lugar de tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra dónde)

- **Uso/cuota del proveedor** (ejemplo: "Claude 80% restante") aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas de proveedor a `% left`; para MiniMax, los campos de porcentaje solo restante se invierten antes de mostrarse, y las respuestas `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan con etiqueta de modelo.
- **Líneas de tokens/caché** en `/status` pueden recurrir a la entrada de uso de transcripción más reciente cuando la instantánea de sesión en vivo es escasa. Los valores en vivo no nulos existentes siguen ganando, y el respaldo de transcripción también puede recuperar la etiqueta del modelo de tiempo de ejecución activo más un total mayor orientado al prompt cuando los totales almacenados faltan o son menores.
- **Ejecución frente a tiempo de ejecución:** `/status` informa `Execution` para la ruta efectiva de sandbox y `Runtime` para quién está ejecutando realmente la sesión: `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Tokens/costo por respuesta** se controla mediante `/usage off|tokens|full` (se añade a las respuestas normales).
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
- En Discord, `/model` y `/models` abren un selector interactivo con desplegables de proveedor y modelo más un paso Submit.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint configurado del proveedor (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

## Anulaciones de depuración

`/debug` te permite definir sobrescrituras de configuración **solo en tiempo de ejecución** (memoria, no disco). Solo propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Las sobrescrituras se aplican inmediatamente a las nuevas lecturas de configuración, pero **no** se escriben en `openclaw.json`. Usa `/debug reset` para borrar todas las sobrescrituras y volver a la configuración en disco.
</Note>

## Salida de trazas de Plugin

`/trace` te permite alternar **líneas de traza/depuración de Plugin con alcance de sesión** sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumento muestra el estado de traza de la sesión actual.
- `/trace on` habilita las líneas de traza de Plugin para la sesión actual.
- `/trace off` vuelve a deshabilitarlas.
- Las líneas de traza de Plugin pueden aparecer en `/status` y como mensaje diagnóstico de seguimiento después de la respuesta normal del asistente.
- `/trace` no reemplaza a `/debug`; `/debug` sigue gestionando sobrescrituras de configuración solo en tiempo de ejecución.
- `/trace` no reemplaza a `/verbose`; la salida detallada normal de herramientas/estado sigue perteneciendo a `/verbose`.

## Actualizaciones de configuración

`/config` escribe en tu configuración en disco (`openclaw.json`). Solo propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.config: true`.

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

`/mcp` escribe definiciones de servidor MCP gestionadas por OpenClaw bajo `mcp.servers`. Solo propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` almacena la configuración en la configuración de OpenClaw, no en los ajustes de proyecto propiedad de Pi. Los adaptadores de tiempo de ejecución deciden qué transportes son realmente ejecutables.
</Note>

## Actualizaciones de Plugin

`/plugins` permite a los operadores inspeccionar plugins descubiertos y alternar la habilitación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Deshabilitado de forma predeterminada; habilítalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` y `/plugins show` usan descubrimiento real de Plugin contra el espacio de trabajo actual más la configuración en disco.
- `/plugins enable|disable` actualiza solo la configuración de Plugin; no instala ni desinstala plugins.
- Después de cambios de habilitación/deshabilitación, reinicia el gateway para aplicarlos.

</Note>

## Notas de superficie

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **Comandos de texto** se ejecutan en la sesión de chat normal (los DM comparten `main`, los grupos tienen su propia sesión).
    - **Comandos nativos** usan sesiones aisladas:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (apunta a la sesión de chat mediante `CommandTargetSessionKey`)
    - **`/stop`** apunta a la sesión de chat activa para que pueda abortar la ejecución actual.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` sigue siendo compatible para un único comando de estilo `/openclaw`. Si habilitas `commands.native`, debes crear un comando de barra de Slack por cada comando integrado (los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.

    Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

  </Accordion>
</AccordionGroup>

## Preguntas secundarias BTW

`/btw` es una **pregunta secundaria** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada única separada **sin herramientas**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de transcripción,
- se entrega como un resultado secundario en vivo en lugar de un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la tarea principal sigue en marcha.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [Preguntas secundarias BTW](/es/tools/btw) para ver el comportamiento completo y los detalles de UX del cliente.

## Relacionado

- [Crear Skills](/es/tools/creating-skills)
- [Skills](/es/tools/skills)
- [Configuración de Skills](/es/tools/skills-config)
