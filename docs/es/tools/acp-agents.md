---
read_when:
    - Ejecución de arneses de codificación mediante ACP
    - Configurar sesiones ACP vinculadas a una conversación en canales de mensajería
    - Vincular una conversación de un canal de mensajes a una sesión persistente de ACP
    - Solución de problemas del servidor ACP, la conexión del Plugin o la entrega de finalizaciones
    - Ejecutar comandos /acp desde el chat
sidebarTitle: ACP agents
summary: Ejecuta entornos de codificación externos (Claude Code, Cursor, Gemini CLI, ACP explícito de Codex, ACP de OpenClaw, OpenCode) a través del backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-05-11T20:54:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permiten que OpenClaw ejecute arneses de codificación externos (por ejemplo Pi,
Claude Code, Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI y otros
arneses ACPX compatibles) mediante un Plugin de backend ACP.

Cada creación de sesión ACP se registra como una [tarea en segundo plano](/es/automation/tasks).

<Note>
**ACP es la ruta de arneses externos, no la ruta predeterminada de Codex.** El
Plugin nativo de servidor de aplicaciones Codex es propietario de los controles
`/codex ...` y del entorno de ejecución integrado predeterminado `openai/gpt-*`
para turnos de agente; ACP es propietario de los controles `/acp ...` y de las
sesiones `sessions_spawn({ runtime: "acp" })`.

Si quieres que Codex o Claude Code se conecten como clientes MCP externos
directamente a conversaciones existentes de canales de OpenClaw, usa
[`openclaw mcp serve`](/es/cli/mcp) en lugar de ACP.
</Note>

## ¿Qué página necesito?

| Quieres…                                                                                         | Usa esto                              | Notas                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular o controlar Codex en la conversación actual                                             | `/codex bind`, `/codex threads`       | Ruta nativa del servidor de aplicaciones Codex cuando el Plugin `codex` está habilitado; incluye respuestas de chat vinculadas, reenvío de imágenes, modelo/rápido/permisos, detener y controles de dirección. ACP es una alternativa explícita |
| Ejecutar Claude Code, Gemini CLI, Codex ACP explícito u otro arnés externo _a través de_ OpenClaw | Esta página                           | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de entorno de ejecución                                                                                |
| Exponer una sesión de OpenClaw Gateway _como_ servidor ACP para un editor o cliente              | [`openclaw acp`](/es/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw mediante stdio/WebSocket                                                                                                                                                |
| Reutilizar una CLI de IA local como modelo alternativo solo de texto                             | [Backends de CLI](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin entorno de ejecución de arnés                                                                                                                              |

## ¿Funciona sin configuración adicional?

Sí, después de instalar el Plugin oficial de entorno de ejecución ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los checkouts de código fuente pueden usar el Plugin de espacio de trabajo local
`extensions/acpx` después de `pnpm install`. Ejecuta `/acp doctor` para una
comprobación de preparación.

OpenClaw solo informa a los agentes sobre la creación de ACP cuando ACP es
**realmente utilizable**: ACP debe estar habilitado, el despacho no debe estar
deshabilitado, la sesión actual no debe estar bloqueada por el sandbox y debe
haber un backend de entorno de ejecución cargado. Si no se cumplen esas
condiciones, las Skills del Plugin ACP y la guía de ACP para `sessions_spawn`
permanecen ocultas para que el agente no sugiera un backend no disponible.

<AccordionGroup>
  <Accordion title="Problemas habituales en la primera ejecución">
    - Si `plugins.allow` está definido, es un inventario restrictivo de plugins y **debe** incluir `acpx`; de lo contrario, el backend ACP instalado queda bloqueado intencionadamente y `/acp doctor` informa de la entrada faltante en la lista de permitidos.
    - El adaptador ACP de Codex se prepara con el Plugin `acpx` y se inicia localmente cuando es posible.
    - Codex ACP se ejecuta con un `CODEX_HOME` aislado; OpenClaw copia solo las entradas de proyecto confiables desde la configuración de Codex del host y confía en el espacio de trabajo activo, dejando la autenticación, las notificaciones y los hooks en la configuración del host.
    - Otros adaptadores de arnés de destino aún pueden obtenerse bajo demanda con `npx` la primera vez que los uses.
    - La autenticación del proveedor aún debe existir en el host para ese arnés.
    - Si el host no tiene npm ni acceso a la red, las obtenciones de adaptadores en la primera ejecución fallan hasta que las cachés se preparen previamente o el adaptador se instale de otra manera.

  </Accordion>
  <Accordion title="Requisitos previos del entorno de ejecución">
    ACP inicia un proceso real de arnés externo. OpenClaw es propietario del
    enrutamiento, el estado de las tareas en segundo plano, la entrega, las
    vinculaciones y la política; el arnés es propietario de su inicio de sesión
    del proveedor, catálogo de modelos, comportamiento del sistema de archivos y
    herramientas nativas.

    Antes de culpar a OpenClaw, verifica:

    - `/acp doctor` informa de un backend habilitado y saludable.
    - El id de destino está permitido por `acp.allowedAgents` cuando esa lista de permitidos está definida.
    - El comando del arnés puede iniciarse en el host del Gateway.
    - La autenticación del proveedor está presente para ese arnés (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - El modelo seleccionado existe para ese arnés; los ids de modelo no son portables entre arneses.
    - El `cwd` solicitado existe y es accesible, o se omite `cwd` y se deja que el backend use su valor predeterminado.
    - El modo de permisos coincide con el trabajo. Las sesiones no interactivas no pueden hacer clic en prompts de permisos nativos, por lo que las ejecuciones de codificación con muchas escrituras/ejecuciones normalmente necesitan un perfil de permisos ACPX que pueda continuar sin intervención.

  </Accordion>
</AccordionGroup>

Las herramientas de Plugin de OpenClaw y las herramientas integradas de
OpenClaw **no** se exponen a los arneses ACP de forma predeterminada. Habilita
los puentes MCP explícitos en [Agentes ACP: configuración](/es/tools/acp-agents-setup)
solo cuando el arnés deba llamar directamente a esas herramientas.

## Destinos de arnés compatibles

Con el backend `acpx`, usa estos ids de arnés como destinos de
`/acp spawn <id>` o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id de arnés | Backend típico                                  | Notas                                                                               |
| ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`    | Adaptador ACP de Claude Code                    | Requiere autenticación de Claude Code en el host.                                   |
| `codex`     | Adaptador ACP de Codex                          | Alternativa ACP explícita solo cuando `/codex` nativo no está disponible o se solicita ACP. |
| `copilot`   | Adaptador ACP de GitHub Copilot                 | Requiere autenticación de Copilot CLI/entorno de ejecución.                         |
| `cursor`    | ACP de Cursor CLI (`cursor-agent acp`)          | Sobrescribe el comando de acpx si una instalación local expone un punto de entrada ACP distinto. |
| `droid`     | Factory Droid CLI                               | Requiere autenticación de Factory/Droid o `FACTORY_API_KEY` en el entorno del arnés. |
| `gemini`    | Adaptador ACP de Gemini CLI                     | Requiere autenticación de Gemini CLI o configuración de clave de API.               |
| `iflow`     | iFlow CLI                                       | La disponibilidad del adaptador y el control de modelos dependen de la CLI instalada. |
| `kilocode`  | Kilo Code CLI                                   | La disponibilidad del adaptador y el control de modelos dependen de la CLI instalada. |
| `kimi`      | Kimi/Moonshot CLI                               | Requiere autenticación de Kimi/Moonshot en el host.                                 |
| `kiro`      | Kiro CLI                                        | La disponibilidad del adaptador y el control de modelos dependen de la CLI instalada. |
| `opencode`  | Adaptador ACP de OpenCode                       | Requiere autenticación de OpenCode CLI/proveedor.                                   |
| `openclaw`  | Puente de OpenClaw Gateway mediante `openclaw acp` | Permite que un arnés compatible con ACP hable de vuelta con una sesión de OpenClaw Gateway. |
| `pi`        | Entorno de ejecución Pi/OpenClaw integrado      | Se usa para experimentos de arneses nativos de OpenClaw.                            |
| `qwen`      | Qwen Code / Qwen CLI                            | Requiere autenticación compatible con Qwen en el host.                              |

Los alias personalizados de agente acpx pueden configurarse en el propio acpx,
pero la política de OpenClaw aún comprueba `acp.allowedAgents` y cualquier
asignación `agents.list[].runtime.acp.agent` antes de despachar.

## Runbook del operador

Flujo rápido de `/acp` desde el chat:

<Steps>
  <Step title="Crear">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` o
    `/acp spawn codex --bind here` explícito.
  </Step>
  <Step title="Trabajar">
    Continúa en la conversación o hilo vinculado (o apunta a la clave de sesión
    explícitamente).
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
    - La creación crea o reanuda una sesión de entorno de ejecución ACP, registra metadatos ACP en el almacén de sesiones de OpenClaw y puede crear una tarea en segundo plano cuando la ejecución pertenece al padre.
    - Las sesiones ACP pertenecientes al padre se tratan como trabajo en segundo plano incluso cuando la sesión de entorno de ejecución es persistente; la finalización y la entrega entre superficies pasan por el notificador de tareas padre en lugar de actuar como una sesión de chat normal visible para el usuario.
    - El mantenimiento de tareas cierra sesiones ACP puntuales terminales o huérfanas pertenecientes al padre. Las sesiones ACP persistentes se conservan mientras quede una vinculación de conversación activa; las sesiones persistentes obsoletas sin una vinculación activa se cierran para que no puedan reanudarse silenciosamente después de que la tarea propietaria haya terminado o su registro de tarea haya desaparecido.
    - Los mensajes de seguimiento vinculados van directamente a la sesión ACP hasta que la vinculación se cierre, pierda el foco, se restablezca o caduque.
    - Los comandos del Gateway permanecen locales. `/acp ...`, `/status` y `/unfocus` nunca se envían como texto normal de prompt a un arnés ACP vinculado.
    - `cancel` aborta el turno activo cuando el backend admite cancelación; no elimina la vinculación ni los metadatos de sesión.
    - `close` finaliza la sesión ACP desde el punto de vista de OpenClaw y elimina la vinculación. Un arnés aún puede conservar su propio historial ascendente si admite reanudación.
    - El Plugin acpx limpia los árboles de procesos de envoltorio y adaptador propiedad de OpenClaw después de `close`, y recolecta huérfanos ACPX obsoletos propiedad de OpenClaw durante el inicio del Gateway.
    - Los workers de entorno de ejecución inactivos son aptos para limpieza después de `acp.runtime.ttlMinutes`; los metadatos de sesión almacenados siguen disponibles para `/acp sessions`.

  </Accordion>
  <Accordion title="Reglas de enrutamiento de Codex nativo">
    Disparadores en lenguaje natural que deben enrutarse al **Plugin nativo de
    Codex** cuando está habilitado:

    - "Vincula este canal de Discord a Codex."
    - "Adjunta este chat al hilo de Codex `<id>`."
    - "Muestra los hilos de Codex y luego vincula este."

    La vinculación nativa de conversaciones de Codex es la ruta predeterminada de control del chat.
    Las herramientas dinámicas de OpenClaw siguen ejecutándose a través de OpenClaw, mientras que
    las herramientas nativas de Codex, como shell/apply-patch, se ejecutan dentro de Codex.
    Para los eventos de herramientas nativas de Codex, OpenClaw inyecta un reenvío nativo
    de ganchos por turno para que los ganchos de plugins puedan bloquear `before_tool_call`, observar
    `after_tool_call` y enrutar los eventos `PermissionRequest` de Codex
    mediante las aprobaciones de OpenClaw. Los ganchos `Stop` de Codex se reenvían a
    `before_agent_finalize` de OpenClaw, donde los plugins pueden solicitar una pasada más del
    modelo antes de que Codex finalice su respuesta. El reenvío sigue siendo
    deliberadamente conservador: no muta los argumentos de herramientas nativas de Codex
    ni reescribe los registros de hilos de Codex. Usa ACP explícito solo
    cuando quieras el modelo de entorno de ejecución/sesión de ACP. El límite de soporte
    de Codex integrado está documentado en el
    [contrato de soporte v1 del arnés de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Hoja de referencia de selección de modelo / proveedor / entorno de ejecución">
    - `openai-codex/*` - ruta heredada de modelo OAuth/suscripción de Codex reparada por doctor.
    - `openai/*` - entorno de ejecución integrado en el servidor de aplicación nativo de Codex para turnos de agente de OpenAI.
    - `/codex ...` - control nativo de conversación de Codex.
    - `/acp ...` o `runtime: "acp"` - control explícito de ACP/acpx.

  </Accordion>
  <Accordion title="Activadores de lenguaje natural para enrutamiento ACP">
    Activadores que deben enrutarse al entorno de ejecución ACP:

    - "Ejecuta esto como una sesión ACP de Claude Code de una sola ejecución y resume el resultado."
    - "Usa Gemini CLI para esta tarea en un hilo y luego mantén los mensajes de seguimiento en ese mismo hilo."
    - "Ejecuta Codex mediante ACP en un hilo en segundo plano."

    OpenClaw selecciona `runtime: "acp"`, resuelve el `agentId` del arnés,
    se vincula a la conversación o el hilo actuales cuando sea compatible, y
    enruta los mensajes de seguimiento a esa sesión hasta su cierre/expiración. Codex solo
    sigue esta ruta cuando ACP/acpx es explícito o el Plugin nativo de Codex
    no está disponible para la operación solicitada.

    Para `sessions_spawn`, `runtime: "acp"` se anuncia solo cuando ACP
    está habilitado, el solicitante no está aislado, y hay cargado un backend
    de entorno de ejecución ACP. `acp.dispatch.enabled=false` pausa el despacho automático
    de hilos ACP, pero no oculta ni bloquea las llamadas explícitas a
    `sessions_spawn({ runtime: "acp" })`. Tiene como destino ids de arnés ACP como `codex`,
    `claude`, `droid`, `gemini` u `opencode`. No pases un id de agente
    normal de configuración de OpenClaw desde `agents_list` a menos que esa entrada esté
    configurada explícitamente con `agents.list[].runtime.type="acp"`;
    de lo contrario, usa el entorno de ejecución de sub-agente predeterminado. Cuando un agente de OpenClaw
    está configurado con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` como id del arnés subyacente.

  </Accordion>
</AccordionGroup>

## ACP frente a sub-agentes

Usa ACP cuando quieras un entorno de ejecución de arnés externo. Usa el **servidor de aplicación
nativo de Codex** para la vinculación/control de conversaciones de Codex cuando el Plugin `codex`
esté habilitado. Usa **sub-agentes** cuando quieras ejecuciones delegadas
nativas de OpenClaw.

| Área          | Sesión ACP                           | Ejecución de sub-agente                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Entorno de ejecución       | Plugin de backend ACP (por ejemplo acpx) | Entorno de ejecución nativo de sub-agente de OpenClaw  |
| Clave de sesión   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principales | `/acp ...`                            | `/subagents ...`                   |
| Herramienta de creación    | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (entorno de ejecución predeterminado) |

Consulta también [Sub-agentes](/es/tools/subagents).

## Cómo ACP ejecuta Claude Code

Para Claude Code mediante ACP, la pila es:

1. Plano de control de sesiones ACP de OpenClaw.
2. Plugin oficial de entorno de ejecución `@openclaw/acpx`.
3. Adaptador ACP de Claude.
4. Maquinaria de entorno de ejecución/sesión del lado de Claude.

Claude en ACP es una **sesión de arnés** con controles ACP, reanudación de sesión,
seguimiento de tareas en segundo plano y vinculación opcional de conversación/hilo.

Los backends de CLI son entornos de ejecución locales de respaldo, separados y solo de texto - consulta
[Backends de CLI](/es/gateway/cli-backends).

Para operadores, la regla práctica es:

- **¿Quieres `/acp spawn`, sesiones vinculables, controles del entorno de ejecución o trabajo persistente con arnés?** Usa ACP.
- **¿Quieres un respaldo local de texto simple mediante la CLI directa?** Usa backends de CLI.

## Sesiones vinculadas

### Modelo mental

- **Superficie de chat** - donde las personas siguen conversando (canal de Discord, tema de Telegram, chat de iMessage).
- **Sesión ACP** - el estado duradero del entorno de ejecución de Codex/Claude/Gemini al que OpenClaw enruta.
- **Hilo/tema secundario** - una superficie de mensajería adicional opcional creada solo por `--thread ...`.
- **Espacio de trabajo del entorno de ejecución** - la ubicación del sistema de archivos (`cwd`, checkout del repositorio, espacio de trabajo del backend) donde se ejecuta el arnés. Independiente de la superficie de chat.

### Vinculaciones de conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la
sesión ACP creada - sin hilo secundario, la misma superficie de chat. OpenClaw mantiene
el control del transporte, la autenticación, la seguridad y la entrega. Los mensajes de seguimiento en esa
conversación se enrutan a la misma sesión; `/new` y `/reset` restablecen la
sesión en el mismo lugar; `/acp close` elimina la vinculación.

Ejemplos:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reglas de vinculación y exclusividad">
    - `--bind here` y `--thread ...` son mutuamente excluyentes.
    - `--bind here` solo funciona en canales que anuncian vinculación de conversación actual; OpenClaw devuelve un mensaje claro de no compatibilidad en caso contrario. Las vinculaciones persisten entre reinicios del Gateway.
    - En Discord, `spawnSessions` condiciona la creación de hilos secundarios para `--thread auto|here` - no para `--bind here`.
    - Si creas una sesión en un agente ACP diferente sin `--cwd`, OpenClaw hereda el espacio de trabajo del **agente de destino** de forma predeterminada. Las rutas heredadas faltantes (`ENOENT`/`ENOTDIR`) recurren al valor predeterminado del backend; otros errores de acceso (p. ej. `EACCES`) se exponen como errores de creación.
    - Los comandos de gestión del Gateway permanecen locales en conversaciones vinculadas - OpenClaw gestiona los comandos `/acp ...` incluso cuando el texto normal de seguimiento se enruta a la sesión ACP vinculada; `/status` y `/unfocus` también permanecen locales siempre que la gestión de comandos esté habilitada para esa superficie.

  </Accordion>
  <Accordion title="Sesiones vinculadas a hilos">
    Cuando las vinculaciones de hilos están habilitadas para un adaptador de canal:

    - OpenClaw vincula un hilo a una sesión ACP de destino.
    - Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
    - La salida de ACP se entrega de vuelta al mismo hilo.
    - Quitar foco/cerrar/archivar/tiempo de espera por inactividad o expiración por edad máxima elimina la vinculación.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` y `/unfocus` son comandos de Gateway, no instrucciones para el arnés ACP.

    Marcas de función requeridas para ACP vinculado a hilos:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` está activado de forma predeterminada (configúralo en `false` para pausar el despacho automático de hilos ACP; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando).
    - Creación de sesiones de hilo del adaptador de canal habilitada (valor predeterminado: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    La compatibilidad con vinculación de hilos es específica de cada adaptador. Si el adaptador
    de canal activo no admite vinculaciones de hilos, OpenClaw devuelve un mensaje claro
    de no compatibilidad/no disponibilidad.

  </Accordion>
  <Accordion title="Canales compatibles con hilos">
    - Cualquier adaptador de canal que exponga la capacidad de vinculación de sesión/hilo.
    - Compatibilidad integrada actual: hilos/canales de **Discord**, temas de **Telegram** (temas de foro en grupos/supergrupos y temas de mensajes directos).
    - Los canales de plugins pueden agregar compatibilidad mediante la misma interfaz de vinculación.

  </Accordion>
</AccordionGroup>

## Vinculaciones persistentes de canal

Para flujos de trabajo no efímeros, configura vinculaciones ACP persistentes en
entradas `bindings[]` de nivel superior.

### Modelo de vinculación

<ParamField path="bindings[].type" type='"acp"'>
  Marca una vinculación persistente de conversación ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversación de destino. Formas por canal:

- **Canal/hilo de Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/mensaje directo de Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Prefiere identificadores estables de Slack; las vinculaciones de canal también coinciden con las respuestas dentro de los hilos de ese canal.
- **Tema de foro de Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Mensaje directo/grupo de iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefiere `chat_id:*` para vinculaciones de grupo estables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  El id del agente propietario de OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Anulación ACP opcional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etiqueta opcional orientada al operador.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directorio de trabajo opcional del entorno de ejecución.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Anulación opcional del backend.
</ParamField>

### Valores predeterminados del entorno de ejecución por agente

Usa `agents.list[].runtime` para definir los valores predeterminados de ACP una vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de arnés, p. ej. `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedencia de anulaciones para sesiones vinculadas ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valores predeterminados globales de ACP (p. ej. `acp.backend`)

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

- OpenClaw garantiza que la sesión ACP configurada exista antes de usarla.
- Los mensajes en ese canal o tema se enrutan a la sesión ACP configurada.
- En conversaciones vinculadas, `/new` y `/reset` restablecen la misma clave de sesión ACP en el mismo lugar.
- Los enlaces temporales en tiempo de ejecución (por ejemplo, los creados por flujos de enfoque en hilos) siguen aplicándose cuando están presentes.
- Para creaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas de espacio de trabajo heredadas que faltan recurren al cwd predeterminado del backend; los fallos de acceso que no sean por ausencia se muestran como errores de creación.

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
    `runtime` toma `subagent` como valor predeterminado, así que establece `runtime: "acp"` explícitamente
    para sesiones ACP. Si se omite `agentId`, OpenClaw usa
    `acp.defaultAgent` cuando está configurado. `mode: "session"` requiere
    `thread: true` para mantener una conversación vinculada persistente.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Usa `/acp spawn` para control explícito del operador desde el chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Flags clave:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Consulta [Comandos de barra](/es/tools/slash-commands).

  </Tab>
</Tabs>

### Parámetros de `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt inicial enviado a la sesión ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Debe ser `"acp"` para sesiones ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id. del harness ACP de destino. Recurre a `acp.defaultAgent` si está definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita el flujo de enlace de hilo donde sea compatible.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` es de una sola ejecución; `"session"` es persistente. Si `thread: true` y
  se omite `mode`, OpenClaw puede usar de forma predeterminada un comportamiento persistente según
  la ruta de tiempo de ejecución. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo solicitado para el tiempo de ejecución (validado por la política
  del backend/tiempo de ejecución). Si se omite, la creación ACP hereda el espacio de trabajo del agente
  de destino cuando está configurado; las rutas heredadas que faltan recurren a los valores
  predeterminados del backend, mientras que los errores reales de acceso se devuelven.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta orientada al operador usada en el texto de sesión/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reanuda una sesión ACP existente en lugar de crear una nueva. El
  agente reproduce su historial de conversación mediante `session/load`. Requiere
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite resúmenes del progreso inicial de la ejecución ACP a la
  sesión solicitante como eventos del sistema. Las respuestas aceptadas incluyen
  `streamLogPath`, que apunta a un registro JSONL con ámbito de sesión
  (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo del relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Cancela el turno hijo ACP después de N segundos. `0` mantiene el turno en la
  ruta sin tiempo de espera del gateway. El mismo valor se aplica a la ejecución del Gateway
  y al tiempo de ejecución ACP para que los harnesses bloqueados o sin cuota no
  ocupen indefinidamente el carril del agente padre.
</ParamField>
<ParamField path="model" type="string">
  Sobrescritura explícita del modelo para la sesión hija ACP. Las creaciones ACP de Codex
  normalizan referencias de OpenClaw Codex como `openai-codex/gpt-5.4` a la configuración
  de inicio de Codex ACP antes de `session/new`; las formas de slash como
  `openai-codex/gpt-5.4/high` también establecen el esfuerzo de razonamiento de Codex ACP.
  Otros harnesses deben anunciar `models` de ACP y admitir
  `session/set_model`; de lo contrario OpenClaw/acpx falla claramente en lugar de
  volver silenciosamente al valor predeterminado del agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esfuerzo explícito de pensamiento/razonamiento. Para Codex ACP, `minimal` se asigna a
  esfuerzo bajo, `low`/`medium`/`high`/`xhigh` se asignan directamente, y `off`
  omite la sobrescritura de inicio de esfuerzo de razonamiento.
</ParamField>

## Modos de enlace y de hilo de creación

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamiento                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Vincula la conversación activa actual en el mismo lugar; falla si no hay ninguna activa. |
    | `off`  | No crea un enlace de conversación actual.                          |

    Notas:

    - `--bind here` es la ruta de operador más simple para “hacer que este canal o chat esté respaldado por Codex”.
    - `--bind here` no crea un hilo hijo.
    - `--bind here` solo está disponible en canales que exponen compatibilidad con enlaces de conversación actual.
    - `--bind` y `--thread` no pueden combinarse en la misma llamada a `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamiento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo hijo cuando sea compatible. |
    | `here` | Requiere un hilo activo actual; falla si no estás en uno.                                                  |
    | `off`  | Sin enlace. La sesión se inicia sin vincular.                                                                 |

    Notas:

    - En superficies sin enlace de hilo, el comportamiento predeterminado es efectivamente `off`.
    - La creación vinculada a hilo requiere compatibilidad de política del canal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo hijo.

  </Tab>
</Tabs>

## Modelo de entrega

Las sesiones ACP pueden ser espacios de trabajo interactivos o trabajo en segundo plano
propiedad del padre. La ruta de entrega depende de esa forma.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Las sesiones interactivas están pensadas para seguir conversando en una superficie
    de chat visible:

    - `/acp spawn ... --bind here` vincula la conversación actual a la sesión ACP.
    - `/acp spawn ... --thread ...` vincula un hilo/tema de canal a la sesión ACP.
    - Los `bindings[].type="acp"` configurados de forma persistente enrutan las conversaciones coincidentes a la misma sesión ACP.

    Los mensajes posteriores en la conversación vinculada se enrutan directamente a la
    sesión ACP, y la salida ACP se entrega de vuelta a ese mismo
    canal/hilo/tema.

    Lo que OpenClaw envía al harness:

    - Los seguimientos vinculados normales se envían como texto de prompt, además de adjuntos solo cuando el harness/backend los admite.
    - Los comandos de gestión `/acp` y los comandos locales del Gateway se interceptan antes del envío ACP.
    - Los eventos de finalización generados en tiempo de ejecución se materializan por destino. Los agentes de OpenClaw reciben el sobre de contexto de tiempo de ejecución interno de OpenClaw; los harnesses ACP externos reciben un prompt simple con el resultado hijo y la instrucción. El sobre bruto `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca debe enviarse a harnesses externos ni persistirse como texto de transcripción de usuario ACP.
    - Las entradas de transcripción ACP usan el texto de disparador visible para el usuario o el prompt de finalización simple. Los metadatos internos de eventos permanecen estructurados en OpenClaw cuando es posible y no se tratan como contenido de chat escrito por el usuario.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Las sesiones ACP de una sola ejecución creadas por otra ejecución de agente son hijos
    en segundo plano, similares a los subagentes:

    - El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - El hijo se ejecuta en su propia sesión de harness ACP.
    - Los turnos hijos se ejecutan en el mismo carril en segundo plano usado por las creaciones de subagentes nativos, por lo que un harness ACP lento no bloquea el trabajo no relacionado de la sesión principal.
    - La finalización informa de vuelta mediante la ruta de anuncio de finalización de tarea. OpenClaw convierte los metadatos internos de finalización en un prompt ACP simple antes de enviarlos a un harness externo, por lo que los harnesses no ven marcadores de contexto de tiempo de ejecución exclusivos de OpenClaw.
    - El padre reescribe el resultado hijo en una voz normal de asistente cuando una respuesta visible para el usuario es útil.

    **No** trates esta ruta como un chat peer-to-peer entre padre
    e hijo. El hijo ya tiene un canal de finalización de vuelta al
    padre.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` puede apuntar a otra sesión después de la creación. Para sesiones peer
    normales, OpenClaw usa una ruta de seguimiento agente a agente (A2A)
    después de inyectar el mensaje:

    - Espera la respuesta de la sesión de destino.
    - Opcionalmente permite que solicitante y destino intercambien un número acotado de turnos de seguimiento.
    - Pide al destino que produzca un mensaje de anuncio.
    - Entrega ese anuncio al canal o hilo visible.

    Esa ruta A2A es una alternativa para envíos peer donde el remitente necesita un
    seguimiento visible. Permanece habilitada cuando una sesión no relacionada puede
    ver y enviar mensajes a un destino ACP, por ejemplo bajo configuraciones amplias de
    `tools.sessions.visibility`.

    OpenClaw omite el seguimiento A2A solo cuando el solicitante es el
    padre de su propio hijo ACP de una sola ejecución propiedad del padre. En ese caso,
    ejecutar A2A además de la finalización de tarea puede despertar al padre con el
    resultado del hijo, reenviar la respuesta del padre de vuelta al hijo y
    crear un bucle de eco padre/hijo. El resultado de `sessions_send` informa
    `delivery.status="skipped"` para ese caso de hijo propio porque la
    ruta de finalización ya es responsable del resultado.

  </Accordion>
  <Accordion title="Resume an existing session">
    Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de
    empezar de cero. El agente reproduce su historial de conversación mediante
    `session/load`, así que retoma con el contexto completo de lo anterior.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comunes:

    - Transfiere una sesión Codex desde tu laptop a tu teléfono: dile a tu agente que retome donde lo dejaste.
    - Continúa una sesión de programación que iniciaste interactivamente en la CLI, ahora sin interfaz mediante tu agente.
    - Retoma trabajo interrumpido por un reinicio del gateway o un tiempo de espera por inactividad.

    Notas:

    - `resumeSessionId` solo aplica cuando `runtime: "acp"`; el tiempo de ejecución predeterminado de subagente ignora este campo exclusivo de ACP.
    - `streamTo` solo aplica cuando `runtime: "acp"`; el tiempo de ejecución predeterminado de subagente ignora este campo exclusivo de ACP.
    - `resumeSessionId` es un id. de reanudación ACP/harness local del host, no una clave de sesión de canal de OpenClaw; OpenClaw aún comprueba la política de creación ACP y la política del agente de destino antes del envío, mientras que el backend ACP o harness posee la autorización para cargar ese id. upstream.
    - `resumeSessionId` restaura el historial de conversación ACP upstream; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, así que `mode: "session"` sigue requiriendo `thread: true`.
    - El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
    - Si no se encuentra el id. de sesión, la creación falla con un error claro: sin fallback silencioso a una sesión nueva.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Después de un despliegue del gateway, ejecuta una comprobación end-to-end en vivo en lugar de
    confiar en pruebas unitarias:

    1. Verifica la versión y el commit del Gateway desplegado en el host de destino.
    2. Abre una sesión temporal de puente ACPX hacia un agente en vivo.
    3. Pide a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` real y ningún error de validador.
    5. Limpia la sesión temporal de puente.

    Mantén la compuerta en `mode: "run"` y omite `streamTo: "parent"`:
    las rutas de `mode: "session"` vinculadas al hilo y de retransmisión de flujo son pases
    de integración más completos independientes.

  </Accordion>
</AccordionGroup>

## Compatibilidad del entorno aislado

Actualmente, las sesiones ACP se ejecutan en el entorno de ejecución del host, **no** dentro del
entorno aislado de OpenClaw.

<Warning>
**Límite de seguridad:**

- El arnés externo puede leer/escribir según sus propios permisos de CLI y el `cwd` seleccionado.
- La política de entorno aislado de OpenClaw **no** envuelve la ejecución del arnés ACP.
- OpenClaw sigue aplicando compuertas de funciones ACP, agentes permitidos, propiedad de sesión, vinculaciones de canal y política de entrega del Gateway.
- Usa `runtime: "subagent"` para trabajo nativo de OpenClaw con entorno aislado aplicado.

</Warning>

Limitaciones actuales:

- Si la sesión solicitante está en entorno aislado, los lanzamientos ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.

## Resolución del destino de sesión

La mayoría de las acciones `/acp` aceptan un destino de sesión opcional (`session-key`,
`session-id` o `session-label`).

**Orden de resolución:**

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - prueba la clave
   - luego el id de sesión con forma de UUID
   - luego la etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculada a una sesión ACP).
3. Alternativa de sesión solicitante actual.

Tanto las vinculaciones de conversación actual como las vinculaciones de hilo participan en
el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | Qué hace                                                     | Ejemplo                                                       |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación actual o de hilo opcional.  | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso para la sesión de destino.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de dirección a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula destinos de hilo.              | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de runtime, capacidades. | `/acp status`                                              |
| `/acp set-mode`      | Define el modo de runtime para la sesión de destino.         | `/acp set-mode plan`                                          |
| `/acp set`           | Escribe una opción genérica de configuración de runtime.     | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define la sustitución del directorio de trabajo del runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define el perfil de política de aprobación.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Define el tiempo de espera del runtime (segundos).           | `/acp timeout 120`                                            |
| `/acp model`         | Define la sustitución del modelo del runtime.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina sustituciones de opciones de runtime de la sesión.   | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sesiones ACP recientes del almacén.                    | `/acp sessions`                                               |
| `/acp doctor`        | Salud del backend, capacidades y correcciones accionables.   | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación.   | `/acp install`                                                |

`/acp status` muestra las opciones efectivas del runtime más los identificadores de sesión de nivel de runtime y
de nivel de backend. Los errores de control no admitido aparecen
claramente cuando un backend carece de una capacidad. `/acp sessions` lee el
almacén para la sesión vinculada actual o solicitante; los tokens de destino
(`session-key`, `session-id` o `session-label`) se resuelven mediante el
descubrimiento de sesiones del Gateway, incluidas las raíces `session.store`
personalizadas por agente.

### Mapeo de opciones de runtime

`/acp` tiene comandos de conveniencia y un definidor genérico. Operaciones
equivalentes:

| Comando                      | Se mapea a                           | Notas                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | clave de configuración de runtime `model` | Para Codex ACP, OpenClaw normaliza `openai-codex/<model>` al id de modelo del adaptador y mapea sufijos de razonamiento con barra, como `openai-codex/gpt-5.4/high`, a `reasoning_effort`.                |
| `/acp set thinking <level>`  | opción canónica `thinking`           | OpenClaw envía el equivalente anunciado por el backend cuando está presente, prefiriendo `thinking`, luego `effort`, `reasoning_effort` o `thought_level`. Para Codex ACP, el adaptador mapea valores a `reasoning_effort`. |
| `/acp permissions <profile>` | opción canónica `permissionProfile`  | OpenClaw envía el equivalente anunciado por el backend cuando está presente, como `approval_policy`, `permission_profile`, `permissions` o `permission_mode`.                                             |
| `/acp timeout <seconds>`     | opción canónica `timeoutSeconds`     | OpenClaw envía el equivalente anunciado por el backend cuando está presente, como `timeout` o `timeout_seconds`.                                                                                           |
| `/acp cwd <path>`            | sustitución de cwd del runtime       | Actualización directa.                                                                                                                                                                                     |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa la ruta de sustitución de cwd.                                                                                                                                                               |
| `/acp reset-options`         | borra todas las sustituciones de runtime | -                                                                                                                                                                                                       |

## Arnés acpx, configuración de Plugin y permisos

Para la configuración del arnés acpx (alias de Claude Code / Codex / Gemini CLI),
los puentes MCP plugin-tools y OpenClaw-tools, y los modos de permiso ACP, consulta
[Agentes ACP: configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                     | Causa probable                                                                                                           | Corrección                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Falta el Plugin del backend, está deshabilitado o bloqueado por `plugins.allow`.                                                       | Instala y habilita el Plugin del backend, incluye `acpx` en `plugins.allow` cuando esa lista de permitidos esté configurada y luego ejecuta `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP está deshabilitado globalmente.                                                                                                 | Configura `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | El despacho automático desde mensajes normales de hilo está deshabilitado.                                                               | Configura `acp.dispatch.enabled=true` para reanudar el enrutamiento automático de hilos; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | El agente no está en la lista de permitidos.                                                                                                | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` informa que el backend no está listo justo después del inicio                 | Falta el Plugin del backend, está deshabilitado, bloqueado por una política de permisos/denegaciones o su ejecutable configurado no está disponible.        | Instala/habilita el Plugin del backend, vuelve a ejecutar `/acp doctor` e inspecciona el error de instalación o de política del backend si sigue sin estar sano.                                           |
| No se encuentra el comando del arnés                                                   | La CLI del adaptador no está instalada, falta el Plugin externo o la obtención inicial de `npx` falló para un adaptador que no es de Codex. | Ejecuta `/acp doctor`, instala/precalienta el adaptador en el host del Gateway o configura explícitamente el comando del agente de acpx.                                                      |
| Modelo no encontrado desde el arnés                                            | El id del modelo es válido para otro proveedor/arnés, pero no para este destino ACP.                                                | Usa un modelo listado por ese arnés, configura el modelo en el arnés u omite la anulación.                                                                            |
| Error de autenticación del proveedor desde el arnés                                          | OpenClaw está sano, pero la CLI/proveedor de destino no tiene sesión iniciada.                                                     | Inicia sesión o proporciona la clave de proveedor requerida en el entorno del host del Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token de clave/id/etiqueta incorrecto.                                                                                                | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | Se usó `--bind here` sin una conversación activa enlazable.                                                            | Muévete al chat/canal de destino y vuelve a intentarlo, o usa una generación sin enlace.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | El adaptador no tiene capacidad de enlace ACP para la conversación actual.                                                             | Usa `/acp spawn ... --thread ...` cuando sea compatible, configura `bindings[]` de nivel superior o muévete a un canal compatible.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | Se usó `--thread here` fuera de un contexto de hilo.                                                                         | Muévete al hilo de destino o usa `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Otro usuario posee el destino de enlace activo.                                                                           | Vuelve a enlazar como propietario o usa otra conversación o hilo.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | El adaptador no tiene capacidad de enlace de hilos.                                                                               | Usa `--thread off` o muévete a un adaptador/canal compatible.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | El tiempo de ejecución de ACP está del lado del host; la sesión solicitante está en sandbox.                                                              | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la generación de ACP desde una sesión sin sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Se solicitó `sandbox="require"` para el tiempo de ejecución de ACP.                                                                         | Usa `runtime="subagent"` para requerir sandboxing, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | El arnés de destino no expone el cambio genérico de modelo de ACP.                                                        | Usa un arnés que anuncie ACP `models`/`session/set_model`, usa referencias de modelo ACP de Codex o configura el modelo directamente en el arnés si tiene su propia bandera de inicio. |
| Faltan metadatos de ACP para la sesión enlazada                                      | Metadatos de sesión ACP obsoletos/eliminados.                                                                                    | Vuelve a crearla con `/acp spawn` y luego vuelve a enlazar/enfocar el hilo.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloquea escrituras/ejecución en una sesión ACP no interactiva.                                                    | Configura `plugins.entries.acpx.config.permissionMode` como `approve-all` y reinicia el gateway. Consulta [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| La sesión ACP falla pronto con poca salida                                  | Las solicitudes de permiso están bloqueadas por `permissionMode`/`nonInteractivePermissions`.                                        | Revisa los logs del gateway en busca de `AcpRuntimeError`. Para permisos completos, configura `permissionMode=approve-all`; para degradación gradual, configura `nonInteractivePermissions=deny`.        |
| La sesión ACP queda detenida indefinidamente después de completar el trabajo                       | El proceso del arnés terminó, pero la sesión ACP no informó finalización.                                                    | Actualiza OpenClaw; la limpieza actual de acpx recoge los procesos obsoletos de envoltorio y adaptador propiedad de OpenClaw al cerrar y al iniciar el Gateway.                                             |
| El arnés ve `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | El sobre de evento interno se filtró a través del límite de ACP.                                                                | Actualiza OpenClaw y vuelve a ejecutar el flujo de finalización; los arneses externos solo deberían recibir prompts de finalización sin formato.                                                          |

## Relacionado

- [Agentes ACP - configuración](/es/tools/acp-agents-setup)
- [Envío de agente](/es/tools/agent-send)
- [Backends de CLI](/es/gateway/cli-backends)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Tiempo de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo puente)](/es/cli/acp)
- [Subagentes](/es/tools/subagents)
