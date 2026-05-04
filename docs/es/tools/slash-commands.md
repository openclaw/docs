---
read_when:
    - Usar o configurar comandos de chat
    - Depuración del enrutamiento de comandos o de los permisos
sidebarTitle: Slash commands
summary: 'Comandos de barra: texto frente a nativos, configuración y comandos compatibles'
title: Comandos de barra diagonal
x-i18n:
    generated_at: "2026-05-04T02:25:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49eb41674c8d0a01dbd28a2df783eb9aba3dde18d8425951a266cede825e9a84
    source_path: tools/slash-commands.md
    workflow: 16
---

Commands are handled by the Gateway. Most commands must be sent as a **standalone** message that starts with `/`. The host-only bash chat command uses `! <cmd>` (with `/bash <cmd>` as an alias).

When a conversation or thread is bound to an ACP session, normal follow-up text routes to that ACP harness. Gateway management commands still stay local: `/acp ...` always reaches the OpenClaw ACP command handler, and `/status` plus `/unfocus` stay local whenever command handling is enabled for the surface.

There are two related systems:

<AccordionGroup>
  <Accordion title="Commands">
    Standalone `/...` messages.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directives are stripped from the message before the model sees it.
    - In normal chat messages (not directive-only), they are treated as "inline hints" and do **not** persist session settings.
    - In directive-only messages (the message contains only directives), they persist to the session and reply with an acknowledgement.
    - Directives are only applied for **authorized senders**. If `commands.allowFrom` is set, it is the only allowlist used; otherwise authorization comes from channel allowlists/pairing plus `commands.useAccessGroups`. Unauthorized senders see directives treated as plain text.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Allowlisted/authorized senders only: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    They run immediately, are stripped before the model sees the message, and the remaining text continues through the normal flow.

  </Accordion>
</AccordionGroup>

## Config

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
  Enables parsing `/...` in chat messages. On surfaces without native commands (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), text commands still work even if you set this to `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registers native commands. Auto: on for Discord/Telegram; off for Slack (until you add slash commands); ignored for providers without native support. Set `channels.discord.commands.native`, `channels.telegram.commands.native`, or `channels.slack.commands.native` to override per provider (bool or `"auto"`). On Discord, `false` skips slash-command registration and cleanup during startup; previously registered commands may remain visible until you remove them from the Discord app. Slack commands are managed in the Slack app and are not removed automatically.
</ParamField>
On Discord, native command specs may include `descriptionLocalizations`, which OpenClaw publishes as Discord `description_localizations` and includes in reconcile comparisons.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registers **skill** commands natively when supported. Auto: on for Discord/Telegram; off for Slack (Slack requires creating a slash command per skill). Set `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, or `channels.slack.commands.nativeSkills` to override per provider (bool or `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Enables `! <cmd>` to run host shell commands (`/bash <cmd>` is an alias; requires `tools.elevated` allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controls how long bash waits before switching to background mode (`0` backgrounds immediately).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Enables `/config` (reads/writes `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Enables `/mcp` (reads/writes OpenClaw-managed MCP config under `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Enables `/plugins` (plugin discovery/status plus install + enable/disable controls).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Enables `/debug` (runtime-only overrides).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Enables `/restart` plus gateway restart tool actions.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Sets the explicit owner allowlist for owner-only command/tool surfaces. This is the human operator account that can approve dangerous actions and run commands such as `/diagnostics`, `/export-trajectory`, and `/config`. It is separate from `commands.allowFrom` and from DM pairing access.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per-channel: makes owner-only commands require **owner identity** to run on that surface. When `true`, the sender must either match a resolved owner candidate (for example an entry in `commands.ownerAllowFrom` or provider-native owner metadata) or hold internal `operator.admin` scope on an internal message channel. A wildcard entry in channel `allowFrom`, or an empty/unresolved owner-candidate list, is **not** sufficient — owner-only commands fail closed on that channel. Leave this off if you want owner-only commands gated only by `ownerAllowFrom` and the standard command allowlists.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controls how owner ids appear in the system prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Optionally sets the HMAC secret used when `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Per-provider allowlist for command authorization. When configured, it is the only authorization source for commands and directives (channel allowlists/pairing and `commands.useAccessGroups` are ignored). Use `"*"` for a global default; provider-specific keys override it.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Enforces allowlists/policies for commands when `commands.allowFrom` is not set.
</ParamField>

## Command list

Current source-of-truth:

- core built-ins come from `src/auto-reply/commands-registry.shared.ts`
- generated dock commands come from `src/auto-reply/commands-registry.data.ts`
- plugin commands come from plugin `registerCommand()` calls
- actual availability on your gateway still depends on config flags, channel surface, and installed/enabled plugins

### Core built-in commands

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` starts a new session; `/reset` is the reset alias.
    - Control UI intercepts typed `/new` to create and switch to a fresh dashboard session; typed `/reset` still runs the Gateway's in-place reset.
    - `/reset soft [message]` keeps the current transcript, drops reused CLI backend session ids, and reruns startup/system-prompt loading in-place.
    - `/compact [instructions]` compacts the session context. See [Compaction](/es/concepts/compaction).
    - `/stop` aborts the current run.
    - `/session idle <duration|off>` and `/session max-age <duration|off>` manage thread-binding expiry.
    - `/export-session [path]` exports the current session to HTML. Alias: `/export`.
    - `/export-trajectory [path]` asks for exec approval, then exports a JSONL [trajectory bundle](/es/tools/trajectory) for the current session. Use it when you need the prompt, tool, and transcript timeline for one OpenClaw session. In group chats, the approval prompt and export result go to the owner privately. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` sets the thinking level. Options come from the active model's provider profile; common levels are `off`, `minimal`, `low`, `medium`, and `high`, with custom levels such as `xhigh`, `adaptive`, `max`, or binary `on` only where supported. Aliases: `/thinking`, `/t`.
    - `/verbose on|off|full` toggles verbose output. Alias: `/v`.
    - `/trace on|off` toggles plugin trace output for the current session.
    - `/fast [status|on|off]` shows or sets fast mode.
    - `/reasoning [on|off|stream]` toggles reasoning visibility. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` toggles elevated mode. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` shows or sets exec defaults.
    - `/model [name|#|status]` shows or sets the model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lists configured/auth-available providers or models for a provider; add `all` to browse that provider's full catalog.
    - `/queue <mode>` manages queue behavior (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus options like `debounce:0.5s cap:25 drop:summarize`; `/queue default` or `/queue reset` clears the session override. See [Command queue](/es/concepts/queue) and [Steering queue](/es/concepts/queue-steering).
    - `/steer <message>` injects guidance into the active run for the current session, independent of `/queue` mode. It does not start a new run when the session is idle. Alias: `/tell`. See [Steer](/es/tools/steer).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` shows the short help summary.
    - `/commands` shows the generated command catalog.
    - `/tools [compact|verbose]` shows what the current agent can use right now.
    - `/status` shows execution/runtime status, including `Execution`/`Runtime` labels and provider usage/quota when available.
    - `/diagnostics [note]` is the owner-only support-report flow for Gateway bugs and Codex harness runs. It asks for explicit exec approval every time before running `openclaw gateway diagnostics export --json`; do not approve diagnostics with an allow-all rule. After approval, it sends a pasteable report with the local bundle path, manifest summary, privacy notes, and relevant session ids. In group chats, the approval prompt and report go to the owner privately. When the active session uses the OpenAI Codex harness, the same approval also sends relevant Codex feedback to OpenAI servers and the completed reply lists the OpenClaw session ids, Codex thread ids, and `codex resume <thread-id>` commands. See [Diagnostics Export](/es/gateway/diagnostics).
    - `/crestodian <request>` runs the Crestodian setup and repair helper from an owner DM.
    - `/tasks` lists active/recent background tasks for the current session.
    - `/context [list|detail|json]` explains how context is assembled.
    - `/whoami` shows your sender id. Alias: `/id`.
    - `/usage off|tokens|full|cost` controls the per-response usage footer or prints a local cost summary.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` runs a skill by name.
    - `/allowlist [list|add|remove] ...` manages allowlist entries. Text-only.
    - `/approve <id> <decision>` resolves exec approval prompts.
    - `/btw <question>` asks a side question without changing future session context. Alias: `/side`. See [BTW](/es/tools/btw).

  </Accordion>
  <Accordion title="Subagentes y ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` administra ejecuciones de subagentes para la sesión actual.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` administra sesiones ACP y opciones de ejecución.
    - `/focus <target>` vincula el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
    - `/unfocus` elimina el vínculo actual.
    - `/agents` enumera agentes vinculados al hilo para la sesión actual.
    - `/kill <id|#|all>` cancela uno o todos los subagentes en ejecución.
    - `/subagents steer <id|#> <message>` envía indicaciones a un subagente en ejecución. Consulta [Dirigir](/es/tools/steer).

  </Accordion>
  <Accordion title="Escrituras solo para propietarios y administración">
    - `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo propietarios. Requiere `commands.config: true`.
    - `/mcp show|get|set|unset` lee o escribe la configuración de servidores MCP administrada por OpenClaw en `mcp.servers`. Solo propietarios. Requiere `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado del plugin. `/plugin` es un alias. Solo propietarios para escrituras. Requiere `commands.plugins: true`.
    - `/debug show|set|unset|reset` administra anulaciones de configuración solo de ejecución. Solo propietarios. Requiere `commands.debug: true`.
    - `/restart` reinicia OpenClaw cuando está habilitado. Valor predeterminado: habilitado; establece `commands.restart: false` para deshabilitarlo.
    - `/send on|off|inherit` establece la política de envío. Solo propietarios.

  </Accordion>
  <Accordion title="Voz, TTS y control de canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controla TTS. Consulta [TTS](/es/tools/tts).
    - `/activation mention|always` establece el modo de activación de grupo.
    - `/bash <command>` ejecuta un comando de shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permitidos de `tools.elevated`.
    - `!poll [sessionId]` comprueba un trabajo de bash en segundo plano.
    - `!stop [sessionId]` detiene un trabajo de bash en segundo plano.

  </Accordion>
</AccordionGroup>

### Comandos de acoplamiento generados

Los comandos de acoplamiento cambian la ruta de respuesta de la sesión actual a otro
canal vinculado. Consulta [Acoplamiento de canales](/es/concepts/channel-docking) para ver la configuración,
ejemplos y solución de problemas.

Los comandos de acoplamiento se generan a partir de plugins de canal con compatibilidad con comandos nativos. Conjunto incluido actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Usa comandos de acoplamiento desde un chat directo para cambiar la ruta de respuesta de la sesión actual a otro canal vinculado. El agente mantiene el mismo contexto de sesión, pero las respuestas futuras de esa sesión se entregan al par del canal seleccionado.

Los comandos de acoplamiento requieren `session.identityLinks`. El remitente de origen y el par de destino deben estar en el mismo grupo de identidad, por ejemplo `["telegram:123", "discord:456"]`. Si un usuario de Telegram con id `123` envía `/dock_discord`, OpenClaw almacena `lastChannel: "discord"` y `lastTo: "456"` en la sesión activa. Si el remitente no está vinculado a un par de Discord, el comando responde con una sugerencia de configuración en lugar de pasar al chat normal.

El acoplamiento cambia solo la ruta de la sesión activa. No crea cuentas de canal, no concede acceso, no omite listas de permitidos del canal ni mueve el historial de transcripción a otra sesión. Usa `/dock-telegram`, `/dock-slack`, `/dock-mattermost` u otro comando de acoplamiento generado para volver a cambiar la ruta.

### Comandos de plugins incluidos

Los plugins incluidos pueden añadir más comandos de barra. Comandos incluidos actuales en este repositorio:

- `/dreaming [on|off|status|help]` activa o desactiva Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` administra el flujo de emparejamiento/configuración de dispositivos. Consulta [Emparejamiento](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporalmente comandos de nodo telefónico de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` administra la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecciona y controla el arnés de servidor de aplicación Codex incluido. Consulta [Arnés de Codex](/es/plugins/codex-harness).
- Comandos solo de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de Skills

Las Skills invocables por usuarios también se exponen como comandos de barra:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- Las Skills también pueden aparecer como comandos directos, como `/prose`, cuando la Skill o el plugin los registra.
- El registro nativo de comandos de Skills se controla mediante `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.
- Las especificaciones de comandos pueden proporcionar `descriptionLocalizations` para superficies nativas compatibles con descripciones localizadas, incluido Discord.

<AccordionGroup>
  <Accordion title="Notas sobre argumentos y analizador">
    - Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
    - Para ver el desglose completo de uso por proveedor, usa `openclaw status --usage`.
    - `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
    - En canales con varias cuentas, `/allowlist --account <id>` orientado a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
    - `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen de costos local desde los registros de sesión de OpenClaw.
    - `/restart` está habilitado de forma predeterminada; establece `commands.restart: false` para deshabilitarlo.
    - `/plugins install <spec>` acepta las mismas especificaciones de plugin que `openclaw plugins install`: ruta/archivo local, paquete npm, `git:<repo>` o `clawhub:<pkg>`, y luego solicita un reinicio del Gateway porque cambiaron los módulos fuente del plugin.
    - `/plugins enable|disable` actualiza la configuración del plugin y activa la recarga de plugins del Gateway para nuevos turnos del agente.

  </Accordion>
  <Accordion title="Comportamiento específico del canal">
    - Comando nativo solo de Discord: `/vc join|leave|status` controla canales de voz (no está disponible como texto). `join` requiere un servidor y un canal de voz/escenario seleccionado. Requiere `channels.discord.voice` y comandos nativos.
    - Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que estén habilitados los vínculos de hilos efectivos (`session.threadBindings.enabled` o `channels.discord.threadBindings.enabled`).
    - Referencia de comandos ACP y comportamiento de ejecución: [Agentes ACP](/es/tools/acp-agents).

  </Accordion>
  <Accordion title="Seguridad de detallado / traza / rápido / razonamiento">
    - `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en uso normal.
    - `/trace` es más limitado que `/verbose`: solo revela líneas de traza/depuración propiedad del plugin y mantiene desactivado el ruido detallado normal de herramientas.
    - `/fast on|off` persiste una anulación de sesión. Usa la opción `inherit` de la interfaz de sesiones para borrarla y volver a los valores predeterminados de configuración.
    - `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes públicas directas de Anthropic, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
    - Los resúmenes de fallos de herramientas se siguen mostrando cuando son relevantes, pero el texto detallado del fallo solo se incluye cuando `/verbose` está en `on` o `full`.
    - `/reasoning`, `/verbose` y `/trace` son riesgosos en entornos grupales: pueden revelar razonamiento interno, salida de herramientas o diagnósticos de plugins que no querías exponer. Prefiere dejarlos desactivados, especialmente en chats grupales.

  </Accordion>
  <Accordion title="Cambio de modelo">
    - `/model` persiste el nuevo modelo de sesión inmediatamente.
    - Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
    - Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto de reintento limpio.
    - Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede permanecer en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
    - En la TUI local, `/crestodian [request]` vuelve de la TUI normal del agente a Crestodian. Esto es independiente del modo de rescate por canal de mensajes y no concede autoridad remota de configuración.

  </Accordion>
  <Accordion title="Ruta rápida y atajos en línea">
    - **Ruta rápida:** los mensajes que contienen solo comandos de remitentes en la lista de permitidos se manejan de inmediato (omiten la cola y el modelo).
    - **Control de menciones en grupo:** los mensajes que contienen solo comandos de remitentes en la lista de permitidos omiten los requisitos de mención.
    - **Atajos en línea (solo remitentes en la lista de permitidos):** ciertos comandos también funcionan cuando están insertados en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
      - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
    - Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Los mensajes no autorizados que contienen solo comandos se ignoran silenciosamente, y los tokens `/...` en línea se tratan como texto sin formato.

  </Accordion>
  <Accordion title="Comandos de Skills y argumentos nativos">
    - **Comandos de Skills:** las Skills `user-invocable` se exponen como comandos de barra. Los nombres se sanejan a `a-z0-9_` (máximo 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo, `_2`).
      - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden comandos por Skill).
      - De forma predeterminada, los comandos de Skills se reenvían al modelo como una solicitud normal.
      - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
      - Ejemplo: `/prose` (plugin OpenProse); consulta [OpenProse](/es/prose).
    - **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos requeridos). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento. Las opciones dinámicas se resuelven contra el modelo de sesión de destino, por lo que las opciones específicas del modelo, como los niveles de `/think`, siguen la anulación `/model` de esa sesión.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` responde una pregunta de ejecución, no una pregunta de configuración: **qué puede usar este agente ahora mismo en esta conversación**.

- `/tools` predeterminado es compacto y está optimizado para una revisión rápida.
- `/tools verbose` añade descripciones breves.
- Las superficies de comandos nativos compatibles con argumentos exponen el mismo cambio de modo que `compact|verbose`.
- Los resultados tienen alcance de sesión, por lo que cambiar el agente, canal, hilo, autorización del remitente o modelo puede cambiar la salida.
- `/tools` incluye herramientas que son realmente accesibles en tiempo de ejecución, incluidas herramientas principales, herramientas de plugins conectados y herramientas propiedad del canal.

Para editar perfiles y anulaciones, usa el panel Herramientas de la interfaz de control o las superficies de configuración/catálogo en lugar de tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra dónde)

- **Uso/cuota del proveedor** (ejemplo: "Claude 80% restante") aparece en `/status` para el proveedor de modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% restante`; para MiniMax, los campos de porcentaje solo de restante se invierten antes de mostrarse, y las respuestas `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan con etiqueta de modelo.
- Las **líneas de tokens/caché** en `/status` pueden recurrir a la entrada de uso de la transcripción más reciente cuando la instantánea de la sesión en vivo es escasa. Los valores en vivo existentes distintos de cero siguen teniendo prioridad, y el respaldo de la transcripción también puede recuperar la etiqueta del modelo de runtime activo más un total mayor orientado al prompt cuando los totales almacenados faltan o son menores.
- **Ejecución frente a runtime:** `/status` informa `Execution` para la ruta efectiva del sandbox y `Runtime` para quién está ejecutando realmente la sesión: `OpenClaw Pi Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP.
- Los **tokens/costo por respuesta** se controlan con `/usage off|tokens|full` (se añade a las respuestas normales).
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
- En Discord, `/model` y `/models` abren un selector interactivo con desplegables de proveedor y modelo, más un paso de envío.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint configurado del proveedor (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

## Anulaciones de depuración

`/debug` te permite definir anulaciones de configuración **solo de runtime** (memoria, no disco). Solo para el propietario. Deshabilitado por defecto; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Las anulaciones se aplican inmediatamente a las nuevas lecturas de configuración, pero **no** se escriben en `openclaw.json`. Usa `/debug reset` para borrar todas las anulaciones y volver a la configuración en disco.
</Note>

## Salida de traza de Plugin

`/trace` te permite alternar **líneas de traza/depuración de Plugin con alcance de sesión** sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumentos muestra el estado de traza de la sesión actual.
- `/trace on` habilita las líneas de traza de Plugin para la sesión actual.
- `/trace off` las deshabilita de nuevo.
- Las líneas de traza de Plugin pueden aparecer en `/status` y como mensaje de diagnóstico posterior tras la respuesta normal del asistente.
- `/trace` no reemplaza a `/debug`; `/debug` sigue gestionando anulaciones de configuración solo de runtime.
- `/trace` no reemplaza a `/verbose`; la salida normal detallada de herramientas/estado sigue perteneciendo a `/verbose`.

## Actualizaciones de configuración

`/config` escribe en tu configuración en disco (`openclaw.json`). Solo para el propietario. Deshabilitado por defecto; habilítalo con `commands.config: true`.

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

`/mcp` escribe definiciones de servidores MCP gestionadas por OpenClaw bajo `mcp.servers`. Solo para el propietario. Deshabilitado por defecto; habilítalo con `commands.mcp: true`.

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

## Actualizaciones de Plugin

`/plugins` permite a los operadores inspeccionar Plugins descubiertos y alternar su habilitación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Deshabilitado por defecto; habilítalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` y `/plugins show` usan descubrimiento real de Plugins contra el espacio de trabajo actual más la configuración en disco.
- `/plugins install` instala desde ClawHub, npm, git, directorios locales y archivos comprimidos.
- `/plugins enable|disable` actualiza solo la configuración del Plugin; no instala ni desinstala Plugins.
- Los cambios de habilitación y deshabilitación recargan en caliente las superficies de runtime de Plugins del Gateway para nuevos turnos de agentes; la instalación solicita un reinicio del Gateway porque cambiaron los módulos de origen del Plugin.

</Note>

## Notas de superficie

<AccordionGroup>
  <Accordion title="Sesiones por superficie">
    - Los **comandos de texto** se ejecutan en la sesión normal de chat (los DM comparten `main`, los grupos tienen su propia sesión).
    - Los **comandos nativos** usan sesiones aisladas:
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

## Preguntas secundarias BTW

`/btw` es una **pregunta secundaria** rápida sobre la sesión actual. `/side` es un alias.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada puntual separada **sin herramientas**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de transcripciones,
- se entrega como un resultado secundario en vivo en lugar de como un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la tarea principal sigue avanzando.

Ejemplo:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Consulta [Preguntas secundarias BTW](/es/tools/btw) para ver el comportamiento completo y los detalles de UX del cliente.

## Relacionado

- [Crear Skills](/es/tools/creating-skills)
- [Skills](/es/tools/skills)
- [Configuración de Skills](/es/tools/skills-config)
