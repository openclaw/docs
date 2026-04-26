---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o de los permisos
sidebarTitle: Slash commands
summary: 'Comandos de barra: texto frente a nativo, configuración y comandos compatibles'
title: Comandos de barra
x-i18n:
    generated_at: "2026-04-26T11:40:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

Los comandos los gestiona el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que empiece con `/`. El comando de chat bash solo del host usa `! <cmd>` (con `/bash <cmd>` como alias).

Cuando una conversación o hilo está vinculado a una sesión ACP, el texto normal de seguimiento se enruta a ese arnés ACP. Los comandos de gestión del Gateway siguen siendo locales: `/acp ...` siempre llega al controlador de comandos ACP de OpenClaw, y `/status` más `/unfocus` permanecen locales siempre que la gestión de comandos esté habilitada para esa superficie.

Hay dos sistemas relacionados:

<AccordionGroup>
  <Accordion title="Comandos">
    Mensajes independientes `/...`.
  </Accordion>
  <Accordion title="Directivas">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
    - En mensajes normales de chat (no solo de directivas), se tratan como "sugerencias en línea" y **no** conservan la configuración de la sesión.
    - En mensajes compuestos solo por directivas (el mensaje contiene únicamente directivas), se conservan en la sesión y responden con una confirmación.
    - Las directivas solo se aplican a **remitentes autorizados**. Si `commands.allowFrom` está configurado, es la única lista de permitidos que se usa; de lo contrario, la autorización proviene de listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`. Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

  </Accordion>
  <Accordion title="Atajos en línea">
    Solo remitentes en la lista de permitidos/autorizados: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Se ejecutan inmediatamente, se eliminan antes de que el modelo vea el mensaje, y el texto restante continúa por el flujo normal.

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
  Habilita el análisis de `/...` en mensajes de chat. En superficies sin comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), los comandos de texto siguen funcionando aunque configures esto en `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Auto: activado para Discord/Telegram; desactivado para Slack (hasta que agregues slash commands); ignorado para proveedores sin compatibilidad nativa. Configura `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para anularlo por proveedor (booleano o `"auto"`). `false` borra los comandos previamente registrados en Discord/Telegram al iniciar. Los comandos de Slack se administran en la app de Slack y no se eliminan automáticamente.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de **skill** de forma nativa cuando se admite. Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un slash command por skill). Configura `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para anularlo por proveedor (booleano o `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para ejecutar comandos del shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos de `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controla cuánto tiempo espera bash antes de cambiar al modo en segundo plano (`0` lo envía inmediatamente a segundo plano).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lee/escribe `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lee/escribe configuración MCP administrada por OpenClaw en `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (detección/estado de Plugins más controles de instalación y habilitación/deshabilitación).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (anulaciones solo en tiempo de ejecución).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` más acciones de herramientas de reinicio del gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Define la lista explícita de permitidos del propietario para superficies de comando/herramienta solo para el propietario. Separada de `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: hace que los comandos solo para el propietario requieran **identidad del propietario** para ejecutarse en esa superficie. Cuando es `true`, el remitente debe coincidir con un candidato a propietario resuelto (por ejemplo una entrada en `commands.ownerAllowFrom` o metadatos nativos de propietario del proveedor) o tener alcance interno `operator.admin` en un canal de mensajes interno. Una entrada comodín en `allowFrom` del canal, o una lista de candidatos a propietario vacía/no resuelta, **no** es suficiente: los comandos solo para el propietario fallan de forma cerrada en ese canal. Déjalo desactivado si quieres que los comandos solo para el propietario estén restringidos únicamente por `ownerAllowFrom` y las listas de permitidos estándar de comandos.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla cómo aparecen los ID del propietario en el prompt del sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcionalmente establece el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista de permitidos por proveedor para la autorización de comandos. Cuando está configurada, es la única fuente de autorización para comandos y directivas (se ignoran las listas de permitidos/emparejamiento del canal y `commands.useAccessGroups`). Usa `"*"` para un valor global predeterminado; las claves específicas del proveedor lo sustituyen.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está configurado.
</ParamField>

## Lista de comandos

Fuente de verdad actual:

- los integrados principales provienen de `src/auto-reply/commands-registry.shared.ts`
- los comandos dock generados provienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de Plugin provienen de llamadas `registerCommand()` del Plugin
- la disponibilidad real en tu gateway sigue dependiendo de las marcas de configuración, la superficie del canal y los Plugins instalados/habilitados

### Comandos integrados principales

<AccordionGroup>
  <Accordion title="Sesiones y ejecuciones">
    - `/new [model]` inicia una nueva sesión; `/reset` es el alias de restablecimiento.
    - `/reset soft [message]` mantiene la transcripción actual, elimina los ID de sesión reutilizados del backend CLI y vuelve a ejecutar en su lugar la carga del prompt de inicio/sistema.
    - `/compact [instructions]` compacta el contexto de la sesión. Consulta [Compaction](/es/concepts/compaction).
    - `/stop` aborta la ejecución actual.
    - `/session idle <duration|off>` y `/session max-age <duration|off>` administran el vencimiento de la vinculación de hilos.
    - `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
    - `/export-trajectory [path]` exporta un [paquete de trayectoria](/es/tools/trajectory) JSONL para la sesión actual. Alias: `/trajectory`.
  </Accordion>
  <Accordion title="Controles del modelo y de ejecución">
    - `/think <level>` establece el nivel de razonamiento. Las opciones provienen del perfil del proveedor del modelo activo; los niveles comunes son `off`, `minimal`, `low`, `medium` y `high`, con niveles personalizados como `xhigh`, `adaptive`, `max` o `on` binario solo cuando se admiten. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` activa o desactiva la salida detallada. Alias: `/v`.
    - `/trace on|off` activa o desactiva la salida de rastreo del Plugin para la sesión actual.
    - `/fast [status|on|off]` muestra o establece el modo rápido.
    - `/reasoning [on|off|stream]` activa o desactiva la visibilidad del razonamiento. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` activa o desactiva el modo elevado. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece valores predeterminados de ejecución.
    - `/model [name|#|status]` muestra o establece el modelo.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` enumera proveedores o modelos de un proveedor.
    - `/queue <mode>` administra el comportamiento de la cola (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) más opciones como `debounce:2s cap:25 drop:summarize`.
  </Accordion>
  <Accordion title="Detección y estado">
    - `/help` muestra el resumen corto de ayuda.
    - `/commands` muestra el catálogo generado de comandos.
    - `/tools [compact|verbose]` muestra lo que el agente actual puede usar ahora mismo.
    - `/status` muestra el estado de ejecución/entorno de ejecución, incluidas las etiquetas `Execution`/`Runtime` y el uso/cuota del proveedor cuando está disponible.
    - `/crestodian <request>` ejecuta el asistente Crestodian de configuración y reparación desde un DM del propietario.
    - `/tasks` enumera tareas activas/recientes en segundo plano para la sesión actual.
    - `/context [list|detail|json]` explica cómo se ensambla el contexto.
    - `/whoami` muestra tu ID de remitente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen local de costes.
  </Accordion>
  <Accordion title="Skills, listas de permitidos, aprobaciones">
    - `/skill <name> [input]` ejecuta una skill por nombre.
    - `/allowlist [list|add|remove] ...` administra entradas de la lista de permitidos. Solo texto.
    - `/approve <id> <decision>` resuelve solicitudes de aprobación de ejecución.
    - `/btw <question>` hace una pregunta secundaria sin cambiar el contexto futuro de la sesión. Consulta [BTW](/es/tools/btw).
  </Accordion>
  <Accordion title="Subagentes y ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` administra ejecuciones de subagentes para la sesión actual.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` administra sesiones ACP y opciones del entorno de ejecución.
    - `/focus <target>` vincula el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
    - `/unfocus` elimina la vinculación actual.
    - `/agents` enumera los agentes vinculados por hilo para la sesión actual.
    - `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
    - `/steer <id|#> <message>` envía dirección a un subagente en ejecución. Alias: `/tell`.
  </Accordion>
  <Accordion title="Escrituras y administración solo para el propietario">
    - `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo para el propietario. Requiere `commands.config: true`.
    - `/mcp show|get|set|unset` lee o escribe configuración del servidor MCP administrada por OpenClaw en `mcp.servers`. Solo para el propietario. Requiere `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado del Plugin. `/plugin` es un alias. Solo para el propietario en operaciones de escritura. Requiere `commands.plugins: true`.
    - `/debug show|set|unset|reset` administra anulaciones de configuración solo en tiempo de ejecución. Solo para el propietario. Requiere `commands.debug: true`.
    - `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; configura `commands.restart: false` para deshabilitarlo.
    - `/send on|off|inherit` establece la política de envío. Solo para el propietario.
  </Accordion>
  <Accordion title="Voz, TTS, control del canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controla TTS. Consulta [TTS](/es/tools/tts).
    - `/activation mention|always` establece el modo de activación de grupo.
    - `/bash <command>` ejecuta un comando del shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permitidos de `tools.elevated`.
    - `!poll [sessionId]` comprueba un trabajo bash en segundo plano.
    - `!stop [sessionId]` detiene un trabajo bash en segundo plano.
  </Accordion>
</AccordionGroup>

### Comandos dock generados

Los comandos dock se generan a partir de Plugins de canal con compatibilidad con comandos nativos. Conjunto empaquetado actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de Plugin empaquetados

Los Plugins empaquetados pueden añadir más slash commands. Comandos empaquetados actuales en este repositorio:

- `/dreaming [on|off|status|help]` activa o desactiva Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` administra el flujo de emparejamiento/configuración de dispositivos. Consulta [Emparejamiento](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` activa temporalmente comandos de Node de teléfono de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` administra la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecciona y controla el arnés app-server de Codex empaquetado. Consulta [Arnés de Codex](/es/plugins/codex-harness).
- Comandos solo de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de skill

Las skills invocables por el usuario también se exponen como slash commands:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- las skills también pueden aparecer como comandos directos como `/prose` cuando la skill/el Plugin los registra.
- el registro nativo de comandos de skill está controlado por `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Notas sobre argumentos y analizador">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como cuerpo del mensaje.
    - Para el desglose completo del uso por proveedor, usa `openclaw status --usage`.
    - `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
    - En canales con varias cuentas, `/allowlist --account <id>` orientado a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
    - `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costes desde los registros de sesión de OpenClaw.
    - `/restart` está habilitado de forma predeterminada; establece `commands.restart: false` para deshabilitarlo.
    - `/plugins install <spec>` acepta las mismas especificaciones de Plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
    - `/plugins enable|disable` actualiza la configuración del Plugin y puede solicitar un reinicio.
  </Accordion>
  <Accordion title="Comportamiento específico por canal">
    - Comando nativo solo de Discord: `/vc join|leave|status` controla canales de voz (no disponible como texto). `join` requiere un guild y un canal de voz/stage seleccionado. Requiere `channels.discord.voice` y comandos nativos.
    - Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que las vinculaciones de hilos efectivas estén habilitadas (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
    - Referencia de comandos ACP y comportamiento del entorno de ejecución: [Agentes ACP](/es/tools/acp-agents).
  </Accordion>
  <Accordion title="Seguridad de verbose / trace / fast / reasoning">
    - `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en uso normal.
    - `/trace` es más limitado que `/verbose`: solo revela líneas de rastreo/depuración propiedad del Plugin y mantiene desactivada la verbosidad normal de herramientas.
    - `/fast on|off` conserva una anulación de sesión. Usa la opción `inherit` de la IU de Sesiones para borrarla y volver a los valores predeterminados de configuración.
    - `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes públicas directas a Anthropic, incluido el tráfico autenticado por OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
    - Los resúmenes de fallos de herramientas siguen mostrándose cuando corresponde, pero el texto detallado del fallo solo se incluye cuando `/verbose` está en `on` o `full`.
    - `/reasoning`, `/verbose` y `/trace` son arriesgados en entornos de grupo: pueden revelar razonamiento interno, salida de herramientas o diagnósticos del Plugin que no pretendías exponer. Es preferible dejarlos desactivados, especialmente en chats de grupo.
  </Accordion>
  <Accordion title="Cambio de modelo">
    - `/model` conserva inmediatamente el nuevo modelo de sesión.
    - Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia en el nuevo modelo en un punto limpio de reintento.
    - Si la actividad de herramientas o la salida de respuesta ya han empezado, el cambio pendiente puede permanecer en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
    - En la TUI local, `/crestodian [request]` vuelve de la TUI normal del agente a Crestodian. Esto es independiente del modo de rescate del canal de mensajes y no concede autoridad de configuración remota.
  </Accordion>
  <Accordion title="Ruta rápida y atajos en línea">
    - **Ruta rápida:** los mensajes solo de comandos de remitentes incluidos en la lista de permitidos se gestionan inmediatamente (omiten la cola y el modelo).
    - **Restricción por mención en grupo:** los mensajes solo de comandos de remitentes incluidos en la lista de permitidos omiten los requisitos de mención.
    - **Atajos en línea (solo remitentes incluidos en la lista de permitidos):** ciertos comandos también funcionan cuando están integrados en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
      - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
    - Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Los mensajes no autorizados solo de comandos se ignoran en silencio, y los tokens `/...` en línea se tratan como texto sin formato.
  </Accordion>
  <Accordion title="Comandos de skill y argumentos nativos">
    - **Comandos de skill:** las skills `user-invocable` se exponen como slash commands. Los nombres se sanitizan a `a-z0-9_` (máx. 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo, `_2`).
      - `/skill <name> [input]` ejecuta una skill por nombre (útil cuando los límites de comandos nativos impiden comandos por skill).
      - De forma predeterminada, los comandos de skill se reenvían al modelo como una solicitud normal.
      - Las skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
      - Ejemplo: `/prose` (Plugin OpenProse) — consulta [OpenProse](/es/prose).
    - **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús con botones cuando omites argumentos obligatorios). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento. Las opciones dinámicas se resuelven contra el modelo de sesión de destino, por lo que las opciones específicas del modelo, como los niveles de `/think`, siguen la anulación `/model` de esa sesión.
  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` responde a una pregunta de tiempo de ejecución, no a una pregunta de configuración: **qué puede usar este agente ahora mismo en esta conversación**.

- El valor predeterminado de `/tools` es compacto y está optimizado para una revisión rápida.
- `/tools verbose` añade descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo cambio de modo que `compact|verbose`.
- Los resultados están limitados a la sesión, por lo que cambiar el agente, canal, hilo, autorización del remitente o modelo puede cambiar la salida.
- `/tools` incluye herramientas realmente accesibles en tiempo de ejecución, incluidas herramientas principales, herramientas de Plugin conectadas y herramientas propiedad del canal.

Para editar perfiles y anulaciones, usa el panel de Herramientas de la IU de Control o las superficies de configuración/catálogo en lugar de tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra y dónde)

- **Uso/cuota del proveedor** (ejemplo: "Claude 80% left") aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% left`; para MiniMax, los campos de porcentaje de solo restante se invierten antes de mostrarse, y las respuestas `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan etiquetada por modelo.
- Las **líneas de tokens/cache** en `/status` pueden recurrir a la última entrada de uso de la transcripción cuando la instantánea de la sesión en vivo es escasa. Los valores en vivo distintos de cero existentes siguen teniendo prioridad, y el respaldo de la transcripción también puede recuperar la etiqueta del modelo del entorno de ejecución activo más un total más grande orientado al prompt cuando faltan los totales almacenados o son menores.
- **Execution frente a Runtime:** `/status` informa `Execution` para la ruta efectiva del sandbox y `Runtime` para quien está ejecutando realmente la sesión: `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
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

- `/model` y `/model list` muestran un selector compacto y numerado (familia del modelo + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de envío.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint configurado del proveedor (`baseUrl`) y el modo de API (`api`) cuando está disponible.

## Anulaciones de depuración

`/debug` te permite establecer anulaciones de configuración **solo en tiempo de ejecución** (memoria, no disco). Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Las anulaciones se aplican inmediatamente a nuevas lecturas de configuración, pero **no** escriben en `openclaw.json`. Usa `/debug reset` para borrar todas las anulaciones y volver a la configuración en disco.
</Note>

## Salida de rastreo del Plugin

`/trace` te permite activar o desactivar **líneas de rastreo/depuración del Plugin con alcance de sesión** sin activar el modo verbose completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumento muestra el estado actual del rastreo de la sesión.
- `/trace on` habilita las líneas de rastreo del Plugin para la sesión actual.
- `/trace off` las deshabilita de nuevo.
- Las líneas de rastreo del Plugin pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.
- `/trace` no sustituye a `/debug`; `/debug` sigue administrando anulaciones de configuración solo en tiempo de ejecución.
- `/trace` no sustituye a `/verbose`; la salida verbose normal de herramientas/estado sigue perteneciendo a `/verbose`.

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
La configuración se valida antes de escribirse; los cambios no válidos se rechazan. Las actualizaciones de `/config` persisten tras los reinicios.
</Note>

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidores MCP administradas por OpenClaw en `mcp.servers`. Solo para el propietario. Deshabilitado de forma predeterminada; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` almacena la configuración en la configuración de OpenClaw, no en los ajustes del proyecto propiedad de Pi. Los adaptadores del entorno de ejecución deciden qué transportes son realmente ejecutables.
</Note>

## Actualizaciones de Plugins

`/plugins` permite a los operadores inspeccionar los Plugins detectados y activar o desactivar su habilitación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Deshabilitado de forma predeterminada; habilítalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` y `/plugins show` usan detección real de Plugins contra el espacio de trabajo actual más la configuración en disco.
- `/plugins enable|disable` solo actualiza la configuración del Plugin; no instala ni desinstala Plugins.
- Después de cambios de habilitación/deshabilitación, reinicia el gateway para aplicarlos.
</Note>

## Notas sobre la superficie

<AccordionGroup>
  <Accordion title="Sesiones por superficie">
    - Los **comandos de texto** se ejecutan en la sesión normal de chat (los mensajes directos comparten `main`, los grupos tienen su propia sesión).
    - Los **comandos nativos** usan sesiones aisladas:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (apunta a la sesión del chat mediante `CommandTargetSessionKey`)
    - **`/stop`** apunta a la sesión de chat activa para poder abortar la ejecución actual.
  </Accordion>
  <Accordion title="Detalles específicos de Slack">
    `channels.slack.slashCommand` sigue siendo compatible para un único comando de estilo `/openclaw`. Si habilitas `commands.native`, debes crear un slash command de Slack por cada comando integrado (con los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.

    Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

  </Accordion>
</AccordionGroup>

## Preguntas laterales BTW

`/btw` es una **pregunta lateral** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada independiente de una sola vez **sin herramientas**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de la transcripción,
- se entrega como un resultado lateral en vivo en lugar de como un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la tarea principal sigue en curso.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [Preguntas laterales BTW](/es/tools/btw) para ver el comportamiento completo y los detalles de UX del cliente.

## Relacionado

- [Creación de skills](/es/tools/creating-skills)
- [Skills](/es/tools/skills)
- [Configuración de Skills](/es/tools/skills-config)
