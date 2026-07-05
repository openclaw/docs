---
read_when:
    - Ejecutar arneses de codificación mediante ACP
    - Configurar sesiones de ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de canal de mensajes a una sesión persistente de ACP
    - Solución de problemas del backend ACP, el cableado de plugins o la entrega de completados
    - Ejecutar comandos /acp desde el chat
sidebarTitle: ACP agents
summary: Ejecuta arneses de programación externos (Claude Code, Cursor, Gemini CLI, Codex ACP explícito, OpenClaw ACP, OpenCode) mediante el backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-07-05T01:59:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bc48f9d2d3d379596f50132b70f07d42d860a4c633835e0bda6622fcd5be8db
    source_path: tools/acp-agents.md
    workflow: 16
---

  [Las sesiones de Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
  permit que OpenClaw ejecute arneses de codificación externos (por ejemplo Claude Code,
  Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI y otros
  arneses ACPX compatibles) mediante un Plugin backend de ACP.

  Cada generación de sesión ACP se rastrea como una [tarea en segundo plano](/es/automation/tasks).

  <Note>
  **ACP es la ruta de arneses externos, no la ruta predeterminada de Codex.** El
  Plugin nativo del servidor de aplicaciones Codex posee los controles `/codex ...` y el runtime
  integrado predeterminado `openai/gpt-*` para los turnos de agente; ACP posee
  los controles `/acp ...` y las sesiones `sessions_spawn({ runtime: "acp" })`.

  Si quieres que Codex o Claude Code se conecten como cliente MCP externo
  directamente a conversaciones existentes de canales de OpenClaw, usa
  [`openclaw mcp serve`](/es/cli/mcp) en lugar de ACP.
  </Note>

  ## ¿Qué página necesito?

  | Quieres…                                                                                       | Usa esto                              | Notas                                                                                                                                                                                                |
  | ---------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Vincular o controlar Codex en la conversación actual                                            | `/codex bind`, `/codex threads`       | Ruta nativa del servidor de aplicaciones Codex cuando el Plugin `codex` está habilitado; incluye respuestas de chat vinculadas, reenvío de imágenes, modelo/rápido/permisos, detener y controles de dirección. ACP es una alternativa explícita |
  | Ejecutar Claude Code, Gemini CLI, Codex ACP explícito u otro arnés externo _a través de_ OpenClaw | Esta página                           | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime                                                                        |
  | Exponer una sesión de OpenClaw Gateway _como_ servidor ACP para un editor o cliente             | [`openclaw acp`](/es/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw mediante stdio/WebSocket                                                                                                                           |
  | Reutilizar una CLI de IA local como modelo alternativo solo de texto                            | [Backends de CLI](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin runtime de arnés                                                                                                                       |

  ## ¿Funciona directamente?

  Sí, después de instalar el Plugin oficial de runtime ACP:

  ```bash
  openclaw plugins install @openclaw/acpx
  openclaw config set plugins.entries.acpx.enabled true
  ```

  Los checkouts de origen pueden usar el Plugin de espacio de trabajo local `extensions/acpx` después de
  `pnpm install`. Ejecuta `/acp doctor` para una comprobación de preparación.

  OpenClaw solo enseña a los agentes sobre la generación ACP cuando ACP es **realmente
  usable**: ACP debe estar habilitado, el dispatch no debe estar deshabilitado, la sesión
  actual no debe estar bloqueada por el sandbox y debe haberse cargado un backend de
  runtime. Si esas condiciones no se cumplen, las Skills del Plugin ACP y la guía ACP de
  `sessions_spawn` permanecen ocultas para que el agente no sugiera
  un backend no disponible.

  <AccordionGroup>
  <Accordion title="Advertencias de la primera ejecución">
    - Si `plugins.allow` está configurado, es un inventario de Plugin restrictivo y **debe** incluir `acpx`; de lo contrario, el backend ACP instalado se bloquea intencionalmente y `/acp doctor` informa la entrada faltante de la allowlist.
    - El adaptador Codex ACP se prepara con el Plugin `acpx` y se inicia localmente cuando es posible.
    - Codex ACP se ejecuta con un `CODEX_HOME` aislado; OpenClaw copia las entradas de proyecto de confianza y la configuración segura de enrutamiento de modelo/proveedor desde la configuración de Codex del host, mientras que la autenticación, las notificaciones y los hooks permanecen en la configuración del host.
    - Otros adaptadores de arneses de destino aún pueden obtenerse bajo demanda con `npx` la primera vez que los uses.
    - La autenticación del proveedor todavía debe existir en el host para ese arnés.
    - Si el host no tiene npm ni acceso a la red, las obtenciones de adaptadores en la primera ejecución fallan hasta que las cachés se precarguen o el adaptador se instale de otra manera.

  </Accordion>
  <Accordion title="Requisitos previos del runtime">
    ACP inicia un proceso real de arnés externo. OpenClaw posee el enrutamiento,
    el estado de tareas en segundo plano, la entrega, las vinculaciones y la política; el arnés
    posee su inicio de sesión de proveedor, catálogo de modelos, comportamiento del sistema de archivos y
    herramientas nativas.

    Antes de culpar a OpenClaw, verifica:

    - `/acp doctor` informa de un backend habilitado y saludable.
    - El id de destino está permitido por `acp.allowedAgents` cuando esa lista de permitidos está configurada.
    - El comando del arnés puede iniciarse en el host del Gateway.
    - La autenticación del proveedor está presente para ese arnés (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - El modelo seleccionado existe para ese arnés: los id de modelo no son portables entre arneses.
    - El `cwd` solicitado existe y es accesible, u omite `cwd` y deja que el backend use su valor predeterminado.
    - El modo de permisos coincide con el trabajo. Las sesiones no interactivas no pueden hacer clic en avisos de permisos nativos, por lo que las ejecuciones de codificación con mucha escritura/ejecución normalmente necesitan un perfil de permisos ACPX que pueda continuar sin interfaz.

  </Accordion>
</AccordionGroup>

Las herramientas de Plugin de OpenClaw y las herramientas integradas de OpenClaw **no** se exponen a
los arneses ACP de forma predeterminada. Habilita los puentes MCP explícitos en
[Agentes ACP - configuración](/es/tools/acp-agents-setup) solo cuando el arnés
deba llamar directamente a esas herramientas.

## Destinos de arnés compatibles

Con el backend `acpx`, usa estos id de arnés como destinos de `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id de arnés | Backend típico                                 | Notas                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adaptador ACP de Claude Code                   | Requiere autenticación de Claude Code en el host.                                   |
| `codex`    | Adaptador ACP de Codex                         | Reserva ACP explícita solo cuando `/codex` nativo no está disponible o se solicita ACP. |
| `copilot`  | Adaptador ACP de GitHub Copilot                | Requiere autenticación de Copilot CLI/runtime.                                      |
| `cursor`   | ACP de Cursor CLI (`cursor-agent acp`)         | Sobrescribe el comando de acpx si una instalación local expone un punto de entrada ACP distinto. |
| `droid`    | Factory Droid CLI                              | Requiere autenticación de Factory/Droid o `FACTORY_API_KEY` en el entorno del arnés. |
| `gemini`   | Adaptador ACP de Gemini CLI                    | Requiere autenticación de Gemini CLI o configuración de clave API.                  |
| `iflow`    | iFlow CLI                                      | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kilocode` | Kilo Code CLI                                  | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kimi`     | Kimi/Moonshot CLI                              | Requiere autenticación de Kimi/Moonshot en el host.                                 |
| `kiro`     | Kiro CLI                                       | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `opencode` | Adaptador ACP de OpenCode                      | Requiere autenticación de OpenCode CLI/proveedor.                                   |
| `openclaw` | Puente de OpenClaw Gateway mediante `openclaw acp` | Permite que un arnés compatible con ACP se comunique de vuelta con una sesión de OpenClaw Gateway. |
| `qwen`     | Qwen Code / Qwen CLI                           | Requiere autenticación compatible con Qwen en el host.                              |

Los alias personalizados de agente acpx se pueden configurar en el propio acpx, pero la
política de OpenClaw sigue comprobando `acp.allowedAgents` y cualquier
asignación `agents.list[].runtime.acp.agent` antes del envío.

## Runbook del operador

Flujo rápido de `/acp` desde el chat:

<Steps>
  <Step title="Crear">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, o explícitamente
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Trabajar">
    Continúa en la conversación o hilo vinculado (o apunta explícitamente a la
    clave de sesión).
  </Step>
  <Step title="Comprobar estado">
    `/acp status`
  </Step>
  <Step title="Ajustar">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Dirigir">
    Sin reemplazar el contexto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Detener">
    `/acp cancel` (turno actual) o `/acp close` (sesión + vinculaciones).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detalles del ciclo de vida">
    - Crear inicia o reanuda una sesión de runtime ACP, registra metadatos ACP en el almacén de sesiones de OpenClaw y puede crear una tarea en segundo plano cuando la ejecución pertenece al padre.
    - Las sesiones ACP pertenecientes al padre se tratan como trabajo en segundo plano incluso cuando la sesión de runtime es persistente; la finalización y la entrega entre superficies pasan por el notificador de tareas padre en lugar de comportarse como una sesión de chat normal orientada al usuario.
    - El mantenimiento de tareas cierra las sesiones ACP de un solo uso terminales o huérfanas pertenecientes al padre. Las sesiones ACP persistentes se conservan mientras queda una vinculación de conversación activa; las sesiones persistentes obsoletas sin una vinculación activa se cierran para que no puedan reanudarse silenciosamente después de que la tarea propietaria termine o su registro de tarea desaparezca.
    - Los mensajes de seguimiento vinculados van directamente a la sesión ACP hasta que la vinculación se cierra, pierde el foco, se restablece o caduca.
    - Los comandos del Gateway permanecen locales. `/acp ...`, `/status` y `/unfocus` nunca se envían como texto de prompt normal a un arnés ACP vinculado.
    - `cancel` aborta el turno activo cuando el backend admite cancelación; no elimina la vinculación ni los metadatos de sesión.
    - `close` finaliza la sesión ACP desde el punto de vista de OpenClaw y elimina la vinculación. Un arnés aún puede conservar su propio historial ascendente si admite reanudación.
    - El Plugin acpx limpia los árboles de procesos de envoltorio y adaptador propiedad de OpenClaw después de `close`, y recolecta huérfanos ACPX obsoletos propiedad de OpenClaw durante el inicio del Gateway.
    - Los workers de runtime inactivos son aptos para limpieza después de `acp.runtime.ttlMinutes`; los metadatos de sesión almacenados siguen disponibles para `/acp sessions`.

  </Accordion>
  <Accordion title="Reglas de enrutamiento de Codex nativo">
    Desencadenadores en lenguaje natural que deberían enrutarse al **Plugin
    nativo de Codex** cuando está habilitado:

    - "Vincula este canal de Discord a Codex."
    - "Adjunta este chat al hilo de Codex `<id>`."
    - "Muestra los hilos de Codex y luego vincula este."

    El enlace nativo de conversación de Codex es la ruta predeterminada de control de chat.
    Las herramientas dinámicas de OpenClaw siguen ejecutándose a través de OpenClaw, mientras que
    las herramientas nativas de Codex, como shell/apply-patch, se ejecutan dentro de Codex.
    Para eventos de herramientas nativas de Codex, OpenClaw inyecta un relé de
    hooks nativos por turno para que los hooks de plugins puedan bloquear `before_tool_call`, observar
    `after_tool_call` y enrutar eventos `PermissionRequest` de Codex
    mediante aprobaciones de OpenClaw. Los hooks `Stop` de Codex se retransmiten a
    `before_agent_finalize` de OpenClaw, donde los plugins pueden solicitar una pasada más del
    modelo antes de que Codex finalice su respuesta. El relé sigue siendo
    deliberadamente conservador: no muta los argumentos de herramientas nativas de Codex
    ni reescribe los registros de hilos de Codex. Usa ACP explícito solo
    cuando quieras el modelo de runtime/sesión de ACP. El límite de soporte
    de Codex embebido está documentado en el
    [contrato de soporte del arnés de Codex v1](/es/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Hoja de referencia de selección de modelo / proveedor / runtime">
    - refs de modelo de Codex heredadas - ruta de modelo de OAuth/suscripción de Codex heredada reparada por doctor.
    - `openai/*` - runtime embebido nativo del app-server de Codex para turnos de agente de OpenAI.
    - `/codex ...` - control de conversación nativo de Codex.
    - `/acp ...` o `runtime: "acp"` - control ACP/acpx explícito.

  </Accordion>
  <Accordion title="Disparadores de lenguaje natural para enrutamiento ACP">
    Disparadores que deberían enrutarse al runtime de ACP:

    - "Ejecuta esto como una sesión ACP única de Claude Code y resume el resultado."
    - "Usa Gemini CLI para esta tarea en un hilo y luego conserva los seguimientos en ese mismo hilo."
    - "Ejecuta Codex mediante ACP en un hilo en segundo plano."

    OpenClaw elige `runtime: "acp"`, resuelve el `agentId` del arnés,
    se enlaza a la conversación o hilo actual cuando es compatible, y
    enruta los seguimientos a esa sesión hasta el cierre o la expiración. Codex solo
    sigue esta ruta cuando ACP/acpx es explícito o el plugin nativo de Codex
    no está disponible para la operación solicitada.

    Para `sessions_spawn`, `runtime: "acp"` se anuncia solo cuando ACP
    está habilitado, el solicitante no está en sandbox y se cargó un backend
    de runtime de ACP. `acp.dispatch.enabled=false` pausa el despacho automático
    de hilos ACP, pero no oculta ni bloquea llamadas explícitas
    `sessions_spawn({ runtime: "acp" })`. Apunta a ids de arnés ACP como `codex`,
    `claude`, `droid`, `gemini` u `opencode`. No pases un id de agente normal
    de configuración de OpenClaw desde `agents_list` a menos que esa entrada esté
    configurada explícitamente con `agents.list[].runtime.type="acp"`;
    de lo contrario, usa el runtime de subagente predeterminado. Cuando un agente de OpenClaw
    está configurado con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` como el id de arnés subyacente.

  </Accordion>
</AccordionGroup>

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de arnés externo. Usa el **app-server
nativo de Codex** para enlace/control de conversación de Codex cuando el plugin
`codex` esté habilitado. Usa **subagentes** cuando quieras ejecuciones
delegadas nativas de OpenClaw.

| Área          | Sesión ACP                            | Ejecución de subagente             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend de ACP (por ejemplo acpx) | Runtime de subagente nativo de OpenClaw |
| Clave de sesión | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principales | `/acp ...`                            | `/subagents ...`                   |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predeterminado) |

Consulta también [Subagentes](/es/tools/subagents).

## Cómo ACP ejecuta Claude Code

Para Claude Code mediante ACP, la pila es:

1. Plano de control de sesión ACP de OpenClaw.
2. Plugin de runtime oficial `@openclaw/acpx`.
3. Adaptador ACP de Claude.
4. Maquinaria de runtime/sesión del lado de Claude.

ACP Claude es una **sesión de arnés** con controles ACP, reanudación de sesión,
seguimiento de tareas en segundo plano y enlace opcional de conversación/hilo.

Los backends CLI son runtimes locales de respaldo independientes, solo de texto; consulta
[Backends CLI](/es/gateway/cli-backends).

Para operadores, la regla práctica es:

- **¿Quieres `/acp spawn`, sesiones enlazables, controles de runtime o trabajo de arnés persistente?** Usa ACP.
- **¿Quieres un respaldo local de texto simple mediante la CLI sin procesar?** Usa backends CLI.

## Sesiones enlazadas

### Modelo mental

- **Superficie de chat** - donde las personas siguen hablando (canal de Discord, tema de Telegram, chat de iMessage).
- **Sesión ACP** - el estado durable de runtime de Codex/Claude/Gemini al que OpenClaw enruta.
- **Hilo/tema hijo** - una superficie de mensajería adicional opcional creada solo por `--thread ...`.
- **Workspace de runtime** - la ubicación del sistema de archivos (`cwd`, checkout del repo, workspace del backend) donde se ejecuta el arnés. Independiente de la superficie de chat.

### Enlaces de conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la
sesión ACP creada, sin hilo hijo, en la misma superficie de chat. OpenClaw sigue
a cargo del transporte, la autenticación, la seguridad y la entrega. Los mensajes de seguimiento en esa
conversación se enrutan a la misma sesión; `/new` y `/reset` reinician la
sesión en el lugar; `/acp close` elimina el enlace.

Ejemplos:

```text
/codex bind                                              # enlace nativo de Codex, enrutar mensajes futuros aquí
/codex model gpt-5.4                                     # ajustar el hilo nativo de Codex enlazado
/codex stop                                              # controlar el turno nativo activo de Codex
/acp spawn codex --bind here                             # respaldo ACP explícito para Codex
/acp spawn codex --thread auto                           # puede crear un hilo/tema hijo y enlazar allí
/acp spawn codex --bind here --cwd /workspace/repo       # mismo enlace de chat, Codex se ejecuta en /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reglas de enlace y exclusividad">
    - `--bind here` y `--thread ...` son mutuamente excluyentes.
    - `--bind here` solo funciona en canales que anuncian enlace de conversación actual; OpenClaw devuelve un mensaje claro de no compatible en caso contrario. Los enlaces persisten entre reinicios de Gateway.
    - En Discord, `spawnSessions` controla la creación de hilos hijo para `--thread auto|here`, no para `--bind here`.
    - Si creas una sesión para un agente ACP diferente sin `--cwd`, OpenClaw hereda por defecto el workspace del **agente de destino**. Las rutas heredadas faltantes (`ENOENT`/`ENOTDIR`) recurren al valor predeterminado del backend; otros errores de acceso (por ejemplo, `EACCES`) aparecen como errores de creación de sesión.
    - Los comandos de gestión de Gateway permanecen locales en conversaciones enlazadas: los comandos `/acp ...` los maneja OpenClaw incluso cuando el texto normal de seguimiento se enruta a la sesión ACP enlazada; `/status` y `/unfocus` también permanecen locales siempre que el manejo de comandos esté habilitado para esa superficie.

  </Accordion>
  <Accordion title="Sesiones enlazadas a hilos">
    Cuando los enlaces de hilos están habilitados para un adaptador de canal:

    - OpenClaw enlaza un hilo a una sesión ACP de destino.
    - Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP enlazada.
    - La salida de ACP se entrega de vuelta al mismo hilo.
    - Desenfocar/cerrar/archivar/tiempo de inactividad agotado o expiración por edad máxima elimina el enlace.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` y `/unfocus` son comandos de Gateway, no prompts para el arnés ACP.

    Feature flags requeridos para ACP enlazado a hilos:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` está activado de forma predeterminada (define `false` para pausar el despacho automático de hilos ACP; las llamadas explícitas `sessions_spawn({ runtime: "acp" })` siguen funcionando).
    - Creación de sesiones de hilos del adaptador de canal habilitada (predeterminado: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    El soporte de enlace de hilos es específico del adaptador. Si el adaptador
    de canal activo no admite enlaces de hilos, OpenClaw devuelve un mensaje claro
    de no compatible/no disponible.

  </Accordion>
  <Accordion title="Canales compatibles con hilos">
    - Cualquier adaptador de canal que exponga capacidad de enlace de sesión/hilo.
    - Soporte integrado actual: hilos/canales de **Discord**, temas de **Telegram** (temas de foro en grupos/supergrupos y temas de DM).
    - Los canales de plugins pueden agregar soporte mediante la misma interfaz de enlace.

  </Accordion>
</AccordionGroup>

## Enlaces de canal persistentes

Para flujos de trabajo no efímeros, configura enlaces ACP persistentes en
entradas `bindings[]` de nivel superior.

### Modelo de enlace

<ParamField path="bindings[].type" type='"acp"'>
  Marca un enlace persistente de conversación ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversación de destino. Formas por canal:

- **Canal/hilo de Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/DM de Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Prefiere ids estables de Slack; los enlaces de canal también coinciden con respuestas dentro de los hilos de ese canal.
- **Tema de foro de Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo de WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Usa números E.164 como `+15555550123` para chats directos y JID de grupos de WhatsApp como `120363424282127706@g.us` para grupos.
- **DM/grupo de iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefiere `chat_id:*` para enlaces de grupo estables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  El id del agente propietario de OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Sobrescritura opcional de ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etiqueta opcional visible para el operador.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directorio de trabajo opcional del runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Sobrescritura opcional del backend.
</ParamField>

### Valores predeterminados de runtime por agente

Usa `agents.list[].runtime` para definir los valores predeterminados de ACP una vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de arnés, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedencia de sobrescritura para sesiones enlazadas de ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valores predeterminados globales de ACP (por ejemplo, `acp.backend`)

### Ejemplo

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Comportamiento

- OpenClaw garantiza que la sesión ACP configurada exista después de la admisión específica del canal y antes de usarla.
- Los mensajes de ese canal, tema o chat se enrutan a la sesión ACP configurada.
- Los enlaces ACP configurados son propietarios de la ruta de su sesión. La difusión ramificada del canal no reemplaza la sesión ACP configurada para un enlace coincidente.
- En conversaciones enlazadas, `/new` y `/reset` restablecen la misma clave de sesión ACP in situ.
- Los enlaces temporales del entorno de ejecución (por ejemplo, los creados por flujos de enfoque de hilo) siguen aplicándose cuando están presentes.
- Para generaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas de espacios de trabajo heredadas que falten vuelven al cwd predeterminado del backend; los fallos de acceso no ausentes se muestran como errores de generación.

## Iniciar sesiones ACP

Dos formas de iniciar una sesión ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    Usa `runtime: "acp"` para iniciar una sesión ACP desde un turno de agente o
    una llamada de herramienta.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` tiene como valor predeterminado `subagent`, así que establece `runtime: "acp"` explícitamente
    para las sesiones ACP. Si se omite `agentId`, OpenClaw usa
    `acp.defaultAgent` cuando está configurado. `mode: "session"` requiere
    `thread: true` para mantener una conversación enlazada persistente.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Usa `/acp spawn` para un control explícito del operador desde el chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Marcas clave:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Consulta [Comandos slash](/es/tools/slash-commands).

  </Tab>
</Tabs>

### Parámetros de `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt inicial enviado a la sesión ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Debe ser `"acp"` para las sesiones ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id. del arnés de destino ACP. Recurre a `acp.defaultAgent` si está establecido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita el flujo de enlace de hilo cuando sea compatible.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` es de ejecución única; `"session"` es persistente. Si `thread: true` y
  se omite `mode`, OpenClaw puede usar de forma predeterminada el comportamiento persistente según la
  ruta del entorno de ejecución. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo solicitado del entorno de ejecución (validado por la política del backend/entorno de ejecución).
  Si se omite, la generación ACP hereda el espacio de trabajo del agente de destino
  cuando está configurado; las rutas heredadas que falten recurren a los valores
  predeterminados del backend, mientras que los errores de acceso reales se devuelven.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta visible para el operador usada en el texto de sesión/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reanuda una sesión ACP existente en lugar de crear una nueva. El
  agente reproduce su historial de conversación mediante `session/load`. Requiere
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite resúmenes iniciales del progreso de la ejecución ACP de vuelta a la
  sesión solicitante como eventos del sistema. Las respuestas aceptadas incluyen
  `streamLogPath`, que apunta a un registro JSONL con alcance de sesión
  (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo de retransmisión.
  Los flujos de progreso principales muestran por defecto comentarios del asistente y progreso de estado ACP,
  salvo que `streaming.progress.commentary=false`. Discord también usa por defecto
  vistas previas principales en modo de progreso cuando no hay un modo de transmisión configurado. El progreso
  de estado sigue respetando `acp.stream.tagVisibility`, por lo que etiquetas como `plan`
  permanecen ocultas salvo que se habiliten explícitamente.
</ParamField>

Las ejecuciones ACP de `sessions_spawn` usan `agents.defaults.subagents.runTimeoutSeconds` para
su límite predeterminado de turnos secundarios. La herramienta no acepta anulaciones de tiempo de espera
por llamada.

<ParamField path="model" type="string">
  Anulación explícita del modelo para la sesión secundaria ACP. Las generaciones ACP de Codex
  normalizan referencias de OpenAI como `openai/gpt-5.4` a la configuración de inicio de Codex ACP
  antes de `session/new`; las formas slash como `openai/gpt-5.4/high`
  también establecen el esfuerzo de razonamiento de Codex ACP.
  Cuando se omite, `sessions_spawn({ runtime: "acp" })` usa los valores predeterminados
  existentes del modelo de subagente (`agents.defaults.subagents.model` o
  `agents.list[].subagents.model`) cuando están configurados; de lo contrario, permite que el
  arnés ACP use su propio modelo predeterminado.
  Otros arneses deben anunciar `models` de ACP y admitir
  `session/set_model`; de lo contrario, OpenClaw/acpx falla de forma clara en vez de
  volver silenciosamente al valor predeterminado del agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esfuerzo explícito de pensamiento/razonamiento. Para Codex ACP, `minimal` se asigna a
  esfuerzo bajo, `low`/`medium`/`high`/`xhigh` se asignan directamente, y `off`
  omite la anulación de inicio del esfuerzo de razonamiento.
  Cuando se omite, las generaciones ACP usan los valores predeterminados existentes de pensamiento de subagente y
  `agents.defaults.models["provider/model"].params.thinking` por modelo
  para el modelo seleccionado.
</ParamField>

## Modos de enlace y de hilo de generación

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamiento                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Enlaza la conversación activa actual in situ; falla si no hay ninguna activa. |
    | `off`  | No crea un enlace de conversación actual.                          |

    Notas:

    - `--bind here` es la ruta de operador más sencilla para "hacer que este canal o chat esté respaldado por Codex".
    - `--bind here` no crea un hilo secundario.
    - `--bind here` solo está disponible en canales que exponen compatibilidad con enlaces de conversación actual.
    - `--bind` y `--thread` no se pueden combinar en la misma llamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamiento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | En un hilo activo: enlaza ese hilo. Fuera de un hilo: crea/enlaza un hilo secundario cuando sea compatible. |
    | `here` | Requiere el hilo activo actual; falla si no está en uno.                                                  |
    | `off`  | Sin enlace. La sesión se inicia sin enlazar.                                                                 |

    Notas:

    - En superficies de enlace sin hilos, el comportamiento predeterminado es efectivamente `off`.
    - La generación enlazada a un hilo requiere compatibilidad con la política del canal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo secundario.

  </Tab>
</Tabs>

## Modelo de entrega

Las sesiones ACP pueden ser espacios de trabajo interactivos o trabajo en segundo plano
propiedad de la sesión principal. La ruta de entrega depende de esa forma.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Las sesiones interactivas están pensadas para seguir conversando en una superficie
    de chat visible:

    - `/acp spawn ... --bind here` enlaza la conversación actual a la sesión ACP.
    - `/acp spawn ... --thread ...` enlaza un hilo/tema de canal a la sesión ACP.
    - Los `bindings[].type="acp"` configurados de forma persistente enrutan las conversaciones coincidentes a la misma sesión ACP.

    Los mensajes de seguimiento en la conversación enlazada se enrutan directamente a la
    sesión ACP, y la salida ACP se entrega de vuelta a ese mismo
    canal/hilo/tema.

    Lo que OpenClaw envía al arnés:

    - Los seguimientos enlazados normales se envían como texto de prompt, más adjuntos solo cuando el arnés/backend los admite.
    - Los comandos de gestión `/acp` y los comandos locales de Gateway se interceptan antes del despacho ACP.
    - Los eventos de finalización generados por el entorno de ejecución se materializan por destino. Los agentes OpenClaw reciben el sobre interno de contexto de entorno de ejecución de OpenClaw; los arneses ACP externos reciben un prompt simple con el resultado secundario y la instrucción. El sobre sin procesar `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca debe enviarse a arneses externos ni persistirse como texto de transcripción de usuario ACP.
    - Las entradas de transcripción ACP usan el texto de disparador visible para el usuario o el prompt de finalización simple. Los metadatos internos de eventos permanecen estructurados en OpenClaw cuando es posible y no se tratan como contenido de chat escrito por el usuario.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Las sesiones ACP de ejecución única generadas por otra ejecución de agente son secundarias
    en segundo plano, similares a los subagentes:

    - La sesión principal solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - La sesión secundaria se ejecuta en su propia sesión de arnés ACP.
    - Los turnos secundarios se ejecutan en la misma vía en segundo plano usada por las generaciones nativas de subagentes, por lo que un arnés ACP lento no bloquea trabajo no relacionado de la sesión principal.
    - Los informes de finalización vuelven por la ruta de anuncio de finalización de tarea. OpenClaw convierte los metadatos internos de finalización en un prompt ACP simple antes de enviarlo a un arnés externo, de modo que los arneses no vean marcadores de contexto de entorno de ejecución exclusivos de OpenClaw.
    - La sesión principal reescribe el resultado secundario con voz normal de asistente cuando una respuesta visible para el usuario es útil.

    **No** trates esta ruta como un chat entre pares entre la sesión principal
    y la secundaria. La sesión secundaria ya tiene un canal de finalización de vuelta a la
    sesión principal.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` puede dirigirse a otra sesión después de la generación. Para sesiones
    pares normales, OpenClaw usa una ruta de seguimiento agente a agente (A2A)
    después de inyectar el mensaje:

    - Espera la respuesta de la sesión de destino.
    - Opcionalmente permite que solicitante y destino intercambien un número acotado de turnos de seguimiento.
    - Pide al destino que produzca un mensaje de anuncio.
    - Entrega ese anuncio al canal o hilo visible.

    Esa ruta A2A es una reserva para envíos entre pares donde el remitente necesita un
    seguimiento visible. Permanece habilitada cuando una sesión no relacionada puede
    ver y enviar mensajes a un destino ACP, por ejemplo bajo configuraciones amplias de
    `tools.sessions.visibility`.

    OpenClaw omite el seguimiento A2A solo cuando el solicitante es el
    padre de su propio hijo ACP de ejecución única propiedad del padre. En ese caso,
    ejecutar A2A sobre la finalización de la tarea puede despertar al padre con el
    resultado del hijo, reenviar la respuesta del padre de vuelta al hijo y
    crear un bucle de eco padre/hijo. El resultado de `sessions_send` informa
    `delivery.status="skipped"` para ese caso de hijo con propietario porque la
    ruta de finalización ya es responsable del resultado.

  </Accordion>
  <Accordion title="Reanudar una sesión existente">
    Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de
    empezar de cero. El agente reproduce su historial de conversación mediante
    `session/load`, por lo que continúa con el contexto completo de lo anterior.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comunes:

    - Transferir una sesión de Codex de tu portátil a tu teléfono: dile a tu agente que continúe donde lo dejaste.
    - Continuar una sesión de programación que iniciaste de forma interactiva en la CLI, ahora sin interfaz mediante tu agente.
    - Retomar trabajo interrumpido por un reinicio del Gateway o un tiempo de espera por inactividad.

    Notas:

    - `resumeSessionId` solo se aplica cuando `runtime: "acp"`; el entorno de ejecución de subagente predeterminado ignora este campo exclusivo de ACP.
    - `streamTo` solo se aplica cuando `runtime: "acp"`; el entorno de ejecución de subagente predeterminado ignora este campo exclusivo de ACP.
    - `resumeSessionId` es un id de reanudación ACP/harness local del host, no una clave de sesión de canal de OpenClaw; OpenClaw sigue comprobando la política de creación de ACP y la política del agente de destino antes del envío, mientras que el backend o harness de ACP posee la autorización para cargar ese id ascendente.
    - `resumeSessionId` restaura el historial de conversación ACP ascendente; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, por lo que `mode: "session"` sigue requiriendo `thread: true`.
    - El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
    - Si no se encuentra el id de sesión, la creación falla con un error claro, sin recurrir silenciosamente a una sesión nueva.

  </Accordion>
  <Accordion title="Prueba de humo posterior al despliegue">
    Después de desplegar un Gateway, ejecuta una comprobación integral en vivo en lugar de
    confiar en las pruebas unitarias:

    1. Verifica la versión del Gateway desplegado y el commit en el host de destino.
    2. Abre una sesión temporal de puente ACPX hacia un agente en vivo.
    3. Pide a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` real y ningún error del validador.
    5. Limpia la sesión temporal de puente.

    Mantén la puerta en `mode: "run"` y omite `streamTo: "parent"`:
    `mode: "session"` vinculado a hilo y las rutas de retransmisión de flujo son pasadas
    de integración independientes y más completas.

  </Accordion>
</AccordionGroup>

## Compatibilidad con sandbox

Actualmente, las sesiones ACP se ejecutan en el entorno de ejecución del host, **no** dentro del
sandbox de OpenClaw.

<Warning>
**Límite de seguridad:**

- El harness externo puede leer/escribir según sus propios permisos de CLI y el `cwd` seleccionado.
- La política de sandbox de OpenClaw **no** envuelve la ejecución del harness ACP.
- OpenClaw sigue aplicando puertas de funciones ACP, agentes permitidos, propiedad de sesión, vinculaciones de canal y política de entrega del Gateway.
- Usa `runtime: "subagent"` para trabajo nativo de OpenClaw con sandbox aplicado.

</Warning>

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, las creaciones ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.

## Resolución de destino de sesión

La mayoría de las acciones `/acp` aceptan un destino de sesión opcional (`session-key`,
`session-id` o `session-label`).

**Orden de resolución:**

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - prueba la clave
   - luego el id de sesión con forma de UUID
   - luego la etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculado a una sesión ACP).
3. Recurso a la sesión solicitante actual.

Las vinculaciones de conversación actual y las vinculaciones de hilo participan ambas en
el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | Qué hace                                                  | Ejemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación actual o de hilo opcional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso para la sesión de destino.      | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de orientación a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula destinos de hilo.           | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de entorno de ejecución y capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo de entorno de ejecución para la sesión de destino. | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opción de configuración del entorno de ejecución. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la anulación del directorio de trabajo del entorno de ejecución. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de política de aprobación.            | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del entorno de ejecución (segundos). | `/acp timeout 120`                                            |
| `/acp model`         | Establece la anulación del modelo del entorno de ejecución. | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las anulaciones de opciones del entorno de ejecución de la sesión. | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sesiones ACP recientes desde el almacén.            | `/acp sessions`                                               |
| `/acp doctor`        | Salud del backend, capacidades y correcciones accionables. | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación. | `/acp install`                                                |

Los controles del entorno de ejecución (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` y `reset-options`) requieren
identidad de propietario desde canales externos y `operator.admin` desde clientes internos de Gateway.
Los remitentes autorizados que no sean propietarios aún pueden usar `sessions`, `doctor`,
`install` y `help`.

`/acp status` muestra las opciones efectivas del entorno de ejecución más los identificadores de sesión
de nivel de entorno de ejecución y de nivel de backend. Los errores de control no admitido se muestran
claramente cuando un backend carece de una capacidad. `/acp sessions` lee el
almacén para la sesión vinculada actual o solicitante; los tokens de destino
(`session-key`, `session-id` o `session-label`) se resuelven mediante
descubrimiento de sesiones del Gateway, incluidas las raíces `session.store`
personalizadas por agente.

### Asignación de opciones del entorno de ejecución

`/acp` tiene comandos de conveniencia y un configurador genérico. Operaciones
equivalentes:

| Comando                      | Se asigna a                          | Notas                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | clave de configuración del entorno de ejecución `model` | Para Codex ACP, OpenClaw normaliza `openai/<model>` al id de modelo del adaptador y asigna sufijos de razonamiento con barra, como `openai/gpt-5.4/high`, a `reasoning_effort`.                            |
| `/acp set thinking <level>`  | opción canónica `thinking`           | OpenClaw envía el equivalente anunciado por el backend cuando está presente, prefiriendo `thinking`, luego `effort`, `reasoning_effort` o `thought_level`. Para Codex ACP, el adaptador asigna valores a `reasoning_effort`. |
| `/acp permissions <profile>` | opción canónica `permissionProfile`  | OpenClaw envía el equivalente anunciado por el backend cuando está presente, como `approval_policy`, `permission_profile`, `permissions` o `permission_mode`.                                             |
| `/acp timeout <seconds>`     | opción canónica `timeoutSeconds`     | OpenClaw envía el equivalente anunciado por el backend cuando está presente, como `timeout` o `timeout_seconds`.                                                                                           |
| `/acp cwd <path>`            | anulación de cwd del entorno de ejecución | Actualización directa.                                                                                                                                                                                     |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa la ruta de anulación de cwd.                                                                                                                                                                 |
| `/acp reset-options`         | borra todas las anulaciones del entorno de ejecución | -                                                                                                                                                                                                          |

## Harness acpx, configuración del Plugin y permisos

Para la configuración del harness acpx (alias de Claude Code / Codex / Gemini CLI),
los puentes MCP plugin-tools y OpenClaw-tools, y los modos de permisos ACP, consulta
[Agentes ACP: configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                                   | Causa probable                                                                                                         | Solución                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | Falta el Plugin de backend, está deshabilitado o está bloqueado por `plugins.allow`.                                   | Instala y habilita el Plugin de backend, incluye `acpx` en `plugins.allow` cuando esa lista de permitidos esté configurada y luego ejecuta `/acp doctor`.                |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP está deshabilitado globalmente.                                                                                    | Establece `acp.enabled=true`.                                                                                                                                            |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | El envío automático desde mensajes normales de hilos está deshabilitado.                                               | Establece `acp.dispatch.enabled=true` para reanudar el enrutamiento automático de hilos; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando. |
| `ACP agent "<id>" is not allowed by policy`                                               | El agente no está en la lista de permitidos.                                                                           | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                              |
| `/acp doctor` reports backend not ready right after startup                               | Falta el Plugin de backend, está deshabilitado, bloqueado por la política de permitir/denegar, o su ejecutable configurado no está disponible. | Instala/habilita el Plugin de backend, vuelve a ejecutar `/acp doctor` e inspecciona el error de instalación o de política del backend si sigue sin estar en buen estado. |
| Harness command not found                                                                 | La CLI del adaptador no está instalada, falta el Plugin externo, o falló la obtención inicial de `npx` para un adaptador que no es Codex. | Ejecuta `/acp doctor`, instala/precalienta el adaptador en el host del Gateway, o configura explícitamente el comando del agente acpx.                                    |
| Model-not-found from the harness                                                          | El id del modelo es válido para otro proveedor/harness, pero no para este destino ACP.                                 | Usa un modelo listado por ese harness, configura el modelo en el harness u omite la anulación.                                                                           |
| Vendor auth error from the harness                                                        | OpenClaw está en buen estado, pero la CLI/proveedor de destino no tiene sesión iniciada.                               | Inicia sesión o proporciona la clave de proveedor requerida en el entorno del host del Gateway.                                                                          |
| `Unable to resolve session target: ...`                                                   | Token de clave/id/etiqueta incorrecto.                                                                                 | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y reintenta.                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` se usó sin una conversación activa que pueda vincularse.                                                 | Ve al chat/canal de destino y reintenta, o usa una creación sin vincular.                                                                                                |
| `Conversation bindings are unavailable for <channel>.`                                    | Al adaptador le falta la capacidad de vinculación ACP de la conversación actual.                                       | Usa `/acp spawn ... --thread ...` donde sea compatible, configura `bindings[]` de nivel superior, o cambia a un canal compatible.                                        |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` se usó fuera de un contexto de hilo.                                                                   | Ve al hilo de destino o usa `--thread auto`/`off`.                                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Otro usuario es propietario del destino de vinculación activo.                                                         | Revincula como propietario o usa otra conversación u otro hilo.                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                                          | Al adaptador le falta la capacidad de vinculación de hilos.                                                           | Usa `--thread off` o cambia a un adaptador/canal compatible.                                                                                                             |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | El runtime ACP está del lado del host; la sesión solicitante está en sandbox.                                          | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la creación ACP desde una sesión sin sandbox.                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | Se solicitó `sandbox="require"` para el runtime ACP.                                                                   | Usa `runtime="subagent"` para sandboxing obligatorio, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                    |
| `Cannot apply --model ... did not advertise model support`                                | El harness de destino no expone el cambio genérico de modelo ACP.                                                     | Usa un harness que anuncie `models`/`session/set_model` de ACP, usa refs de modelo Codex ACP, o configura el modelo directamente en el harness si tiene su propia marca de inicio. |
| Missing ACP metadata for bound session                                                    | Metadatos de sesión ACP obsoletos/eliminados.                                                                          | Recrea con `/acp spawn` y luego revincula/enfoca el hilo.                                                                                                                |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloquea escrituras/exec en una sesión ACP no interactiva.                                            | Establece `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia el gateway. Consulta [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                                | Las solicitudes de permiso están bloqueadas por `permissionMode`/`nonInteractivePermissions`.                         | Revisa los registros del gateway para `AcpRuntimeError`. Para permisos completos, establece `permissionMode=approve-all`; para degradación ordenada, establece `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                                     | El proceso del harness terminó, pero la sesión ACP no informó la finalización.                                        | Actualiza OpenClaw; la limpieza actual de acpx cosecha los procesos de wrapper y adaptador obsoletos propiedad de OpenClaw al cerrar y al iniciar Gateway.              |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | El sobre de eventos interno se filtró a través del límite ACP.                                                        | Actualiza OpenClaw y vuelve a ejecutar el flujo de finalización; los harnesses externos deberían recibir solo prompts de finalización sin formato.                       |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` pertenece al
relay de hooks nativo de Codex, no a ACP/acpx. En un chat Codex vinculado, inicia una
sesión nueva con `/new` o `/reset`; si funciona una vez y luego vuelve en la siguiente
llamada de herramienta nativa, reinicia el app-server de Codex o el Gateway de OpenClaw en lugar de
repetir `/new`. Consulta [Solución de problemas del harness Codex](/es/plugins/codex-harness#troubleshooting).
</Note>

## Relacionado

- [Agentes ACP - configuración](/es/tools/acp-agents-setup)
- [Envío de agente](/es/tools/agent-send)
- [Backends de CLI](/es/gateway/cli-backends)
- [Harness Codex](/es/plugins/codex-harness)
- [Runtime del harness Codex](/es/plugins/codex-harness-runtime)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo puente)](/es/cli/acp)
- [Subagentes](/es/tools/subagents)
