---
read_when:
    - Ejecutando harnesses de coding mediante ACP
    - Configurando sesiones ACP vinculadas a conversaciones en canales de mensajería
    - Vinculando una conversación de canal de mensajería a una sesión ACP persistente
    - Solucionando problemas del backend ACP, la integración del Plugin o la entrega de finalización
    - Operando comandos `/acp` desde el chat
sidebarTitle: ACP agents
summary: Ejecuta harnesses externos de coding (Claude Code, Cursor, Gemini CLI, Codex ACP explícito, OpenClaw ACP, OpenCode) mediante el backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-26T11:38:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permiten que OpenClaw ejecute harnesses externos de coding (por ejemplo Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI y otros
harnesses ACPX compatibles) mediante un Plugin backend ACP.

Cada creación de sesión ACP se rastrea como una [tarea en segundo plano](/es/automation/tasks).

<Note>
**ACP es la ruta de harness externo, no la ruta predeterminada de Codex.** El
Plugin nativo app-server de Codex es propietario de los controles `/codex ...` y del
runtime integrado `agentRuntime.id: "codex"`; ACP es propietario de los
controles `/acp ...` y de las sesiones `sessions_spawn({ runtime: "acp" })`.

Si quieres que Codex o Claude Code se conecten como cliente MCP externo
directamente a conversaciones de canal existentes de OpenClaw, usa
[`openclaw mcp serve`](/es/cli/mcp) en lugar de ACP.
</Note>

## ¿Qué página quiero?

| Quieres…                                                                                     | Usa esto                              | Notas                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular o controlar Codex en la conversación actual                                         | `/codex bind`, `/codex threads`       | Ruta nativa de app-server de Codex cuando el Plugin `codex` está habilitado; incluye respuestas vinculadas al chat, reenvío de imágenes, modelo/fast/permisos, stop y controles de guía. ACP es un fallback explícito |
| Ejecutar Claude Code, Gemini CLI, Codex ACP explícito u otro harness externo _a través de_ OpenClaw | Esta página                     | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime                                                              |
| Exponer una sesión de OpenClaw Gateway _como_ servidor ACP para un editor o cliente          | [`openclaw acp`](/es/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw sobre stdio/WebSocket                                                                                                                     |
| Reutilizar una AI CLI local como modelo fallback solo de texto                               | [CLI Backends](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin runtime de harness                                                                                                           |

## ¿Esto funciona de inmediato?

Normalmente sí. Las instalaciones nuevas incluyen el Plugin de runtime `acpx`
habilitado por defecto con un binario `acpx` fijado localmente al Plugin que OpenClaw sondea
y autorrepara al arrancar. Ejecuta `/acp doctor` para una comprobación de preparación.

OpenClaw solo enseña a los agentes sobre la creación de ACP cuando ACP es **realmente
usable**: ACP debe estar habilitado, el despacho no debe estar desactivado, la
sesión actual no debe estar bloqueada por sandbox y debe haberse
cargado un backend de runtime. Si no se cumplen esas condiciones, las Skills del Plugin ACP y la guía ACP de
`sessions_spawn` permanecen ocultas para que el agente no sugiera
un backend no disponible.

<AccordionGroup>
  <Accordion title="Problemas habituales de la primera ejecución">
    - Si `plugins.allow` está establecido, es un inventario restrictivo de Plugins y **debe** incluir `acpx`; de lo contrario, el valor predeterminado incluido queda bloqueado intencionadamente y `/acp doctor` informa de la entrada faltante en la lista permitida.
    - Los adaptadores de harness de destino (Codex, Claude, etc.) pueden descargarse bajo demanda con `npx` la primera vez que los uses.
    - La autenticación del proveedor debe seguir existiendo en el host para ese harness.
    - Si el host no tiene npm o acceso a red, las descargas de adaptadores en la primera ejecución fallan hasta que se precalienten las cachés o el adaptador se instale de otra forma.
  </Accordion>
  <Accordion title="Requisitos previos de runtime">
    ACP lanza un proceso real de harness externo. OpenClaw es propietario del enrutamiento,
    estado de tareas en segundo plano, entrega, vinculaciones y políticas; el harness
    es propietario de su inicio de sesión del proveedor, catálogo de modelos, comportamiento del sistema de archivos y
    herramientas nativas.

    Antes de culpar a OpenClaw, verifica:

    - `/acp doctor` informa de un backend habilitado y en buen estado.
    - El ID de destino está permitido por `acp.allowedAgents` cuando esa lista permitida está establecida.
    - El comando del harness puede iniciarse en el host del Gateway.
    - La autenticación del proveedor está presente para ese harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - El modelo seleccionado existe para ese harness: los IDs de modelo no son portables entre harnesses.
    - El `cwd` solicitado existe y es accesible, o bien omite `cwd` y deja que el backend use su valor predeterminado.
    - El modo de permisos coincide con el trabajo. Las sesiones no interactivas no pueden hacer clic en avisos nativos de permisos, por lo que las ejecuciones de coding con mucha escritura/exec suelen necesitar un perfil de permisos ACPX que pueda continuar sin interfaz.

  </Accordion>
</AccordionGroup>

Las herramientas de Plugins de OpenClaw y las herramientas integradas de OpenClaw **no** se exponen a
los harnesses ACP de forma predeterminada. Habilita los puentes MCP explícitos en
[Agentes ACP — configuración](/es/tools/acp-agents-setup) solo cuando el harness
deba llamar directamente a esas herramientas.

## Destinos de harness compatibles

Con el backend incluido `acpx`, usa estos IDs de harness como objetivos de `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | Backend típico                                 | Notas                                                                                 |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `claude`   | Adaptador ACP de Claude Code                   | Requiere autenticación de Claude Code en el host.                                     |
| `codex`    | Adaptador ACP de Codex                         | Fallback ACP explícito solo cuando `/codex` nativo no está disponible o se solicita ACP. |
| `copilot`  | Adaptador ACP de GitHub Copilot                | Requiere autenticación de Copilot CLI/runtime.                                        |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Sobrescribe el comando acpx si una instalación local expone un punto de entrada ACP distinto. |
| `droid`    | Factory Droid CLI                              | Requiere autenticación de Factory/Droid o `FACTORY_API_KEY` en el entorno del harness. |
| `gemini`   | Adaptador ACP de Gemini CLI                    | Requiere autenticación de Gemini CLI o configuración de clave API.                    |
| `iflow`    | iFlow CLI                                      | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kilocode` | Kilo Code CLI                                  | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kimi`     | CLI de Kimi/Moonshot                           | Requiere autenticación de Kimi/Moonshot en el host.                                   |
| `kiro`     | Kiro CLI                                       | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `opencode` | Adaptador ACP de OpenCode                      | Requiere OpenCode CLI/autenticación del proveedor.                                    |
| `openclaw` | Puente de OpenClaw Gateway mediante `openclaw acp` | Permite que un harness compatible con ACP hable de vuelta con una sesión de OpenClaw Gateway. |
| `pi`       | Pi/runtime integrado de OpenClaw               | Usado para experimentos de harness nativos de OpenClaw.                               |
| `qwen`     | Qwen Code / Qwen CLI                           | Requiere autenticación compatible con Qwen en el host.                                |

Los alias personalizados de agentes acpx pueden configurarse en el propio acpx, pero la
política de OpenClaw sigue comprobando `acp.allowedAgents` y cualquier asignación
`agents.list[].runtime.acp.agent` antes del despacho.

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
  <Step title="Guiar">
    Sin reemplazar el contexto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Detener">
    `/acp cancel` (turno actual) o `/acp close` (sesión + vinculaciones).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detalles del ciclo de vida">
    - Crear genera o reanuda una sesión de runtime ACP, registra metadatos ACP en el almacén de sesiones de OpenClaw y puede crear una tarea en segundo plano cuando la ejecución pertenece al padre.
    - Los mensajes de seguimiento vinculados van directamente a la sesión ACP hasta que la vinculación se cierra, se desfocaliza, se restablece o expira.
    - Los comandos del Gateway permanecen locales. `/acp ...`, `/status` y `/unfocus` nunca se envían como texto normal del prompt a un harness ACP vinculado.
    - `cancel` aborta el turno activo cuando el backend admite cancelación; no elimina la vinculación ni los metadatos de la sesión.
    - `close` finaliza la sesión ACP desde el punto de vista de OpenClaw y elimina la vinculación. Un harness puede seguir manteniendo su propio historial ascendente si admite reanudación.
    - Los workers de runtime inactivos son candidatos a limpieza después de `acp.runtime.ttlMinutes`; los metadatos almacenados de sesión siguen disponibles para `/acp sessions`.
  </Accordion>
  <Accordion title="Reglas de enrutamiento nativo de Codex">
    Disparadores en lenguaje natural que deben enrutar al **Plugin nativo de Codex**
    cuando está habilitado:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    La vinculación nativa de conversaciones de Codex es la ruta de control de chat predeterminada.
    Las herramientas dinámicas de OpenClaw siguen ejecutándose a través de OpenClaw, mientras
    que las herramientas nativas de Codex, como shell/apply-patch, se ejecutan dentro de Codex.
    Para eventos de herramientas nativas de Codex, OpenClaw inyecta un relay nativo
    de hooks por turno para que los hooks de Plugin puedan bloquear `before_tool_call`, observar
    `after_tool_call` y enrutar eventos `PermissionRequest` de Codex
    a través de las aprobaciones de OpenClaw. Los hooks `Stop` de Codex se reenvían a
    `before_agent_finalize` de OpenClaw, donde los Plugins pueden solicitar un pase más
    del modelo antes de que Codex finalice su respuesta. El relay sigue siendo
    deliberadamente conservador: no muta argumentos de herramientas nativas de Codex
    ni reescribe registros de hilos de Codex. Usa ACP explícito solo
    cuando quieras el modelo ACP de runtime/sesión. El límite de compatibilidad de Codex
    embebido está documentado en el
    [contrato de compatibilidad v1 de Codex harness](/es/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Hoja de referencia de selección de modelo / proveedor / runtime">
    - `openai-codex/*` — ruta PI Codex OAuth/suscripción.
    - `openai/*` más `agentRuntime.id: "codex"` — runtime integrado nativo de app-server de Codex.
    - `/codex ...` — control nativo de conversación de Codex.
    - `/acp ...` o `runtime: "acp"` — control ACP/acpx explícito.
  </Accordion>
  <Accordion title="Disparadores en lenguaje natural para enrutamiento ACP">
    Disparadores que deben enrutar al runtime ACP:

    - "Run this as a one-shot Claude Code ACP session and summarize the result."
    - "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
    - "Run Codex through ACP in a background thread."

    OpenClaw elige `runtime: "acp"`, resuelve el `agentId` del harness,
    se vincula a la conversación o hilo actual cuando es compatible, y
    enruta los seguimientos a esa sesión hasta el cierre/la expiración. Codex solo
    sigue esta ruta cuando ACP/acpx es explícito o el Plugin nativo de Codex
    no está disponible para la operación solicitada.

    Para `sessions_spawn`, `runtime: "acp"` se anuncia solo cuando ACP
    está habilitado, quien solicita no está en sandbox y un backend de runtime ACP
    está cargado. Apunta a IDs de harness ACP como `codex`,
    `claude`, `droid`, `gemini` o `opencode`. No pases un ID normal
    de agente de configuración de OpenClaw desde `agents_list` a menos que esa entrada esté
    configurada explícitamente con `agents.list[].runtime.type="acp"`;
    en caso contrario usa el runtime predeterminado de subagente. Cuando un agente de OpenClaw
    está configurado con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` como ID subyacente del harness.

  </Accordion>
</AccordionGroup>

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de harness externo. Usa **app-server nativo de Codex**
para la vinculación/control de conversaciones de Codex cuando el Plugin `codex`
esté habilitado. Usa **subagentes** cuando quieras ejecuciones delegadas nativas de OpenClaw.

| Área          | Sesión ACP                            | Ejecución de subagente              |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (por ejemplo acpx) | Runtime nativo de subagente de OpenClaw |
| Clave de sesión | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`   |
| Comandos principales | `/acp ...`                     | `/subagents ...`                    |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predeterminado) |

Consulta también [Subagentes](/es/tools/subagents).

## Cómo ejecuta ACP Claude Code

Para Claude Code a través de ACP, la pila es:

1. Plano de control de sesión ACP de OpenClaw.
2. Plugin de runtime incluido `acpx`.
3. Adaptador ACP de Claude.
4. Mecanismo de runtime/sesión del lado de Claude.

ACP Claude es una **sesión de harness** con controles ACP, reanudación de sesión,
seguimiento de tareas en segundo plano y vinculación opcional a conversación/hilo.

Los CLI backends son runtimes fallback locales separados solo de texto; consulta
[CLI Backends](/es/gateway/cli-backends).

Para operadores, la regla práctica es:

- **¿Quieres `/acp spawn`, sesiones vinculables, controles de runtime o trabajo persistente de harness?** Usa ACP.
- **¿Quieres un fallback simple de texto local a través de la CLI sin procesar?** Usa CLI backends.

## Sesiones vinculadas

### Modelo mental

- **Superficie de chat** — donde la gente sigue hablando (canal de Discord, tema de Telegram, chat de iMessage).
- **Sesión ACP** — el estado duradero de runtime de Codex/Claude/Gemini al que OpenClaw enruta.
- **Hilo/tema hijo** — una superficie adicional opcional de mensajería creada solo por `--thread ...`.
- **Espacio de trabajo de runtime** — la ubicación del sistema de archivos (`cwd`, checkout del repositorio, espacio de trabajo del backend) donde se ejecuta el harness. Independiente de la superficie de chat.

### Vinculaciones a la conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la
sesión ACP creada, sin hilo hijo, misma superficie de chat. OpenClaw sigue
siendo propietario del transporte, autenticación, seguridad y entrega. Los mensajes de seguimiento en esa
conversación se enrutan a la misma sesión; `/new` y `/reset` restablecen la
sesión en su lugar; `/acp close` elimina la vinculación.

Ejemplos:

```text
/codex bind                                              # vinculación nativa de Codex, enruta aquí mensajes futuros
/codex model gpt-5.4                                     # ajusta el hilo nativo de Codex vinculado
/codex stop                                              # controla el turno nativo activo de Codex
/acp spawn codex --bind here                             # fallback ACP explícito para Codex
/acp spawn codex --thread auto                           # puede crear un hilo/tema hijo y vincular allí
/acp spawn codex --bind here --cwd /workspace/repo       # misma vinculación de chat, Codex se ejecuta en /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reglas de vinculación y exclusividad">
    - `--bind here` y `--thread ...` son mutuamente excluyentes.
    - `--bind here` solo funciona en canales que anuncian vinculación a la conversación actual; de lo contrario OpenClaw devuelve un mensaje claro de no compatibilidad. Las vinculaciones persisten entre reinicios del gateway.
    - En Discord, `spawnAcpSessions` solo se requiere cuando OpenClaw necesita crear un hilo hijo para `--thread auto|here`, no para `--bind here`.
    - Si creas una sesión para un agente ACP diferente sin `--cwd`, OpenClaw hereda por defecto el espacio de trabajo del **agente de destino**. Las rutas heredadas faltantes (`ENOENT`/`ENOTDIR`) recurren al valor predeterminado del backend; otros errores de acceso (por ejemplo `EACCES`) aparecen como errores de creación.
    - Los comandos de gestión del Gateway permanecen locales en conversaciones vinculadas: los comandos `/acp ...` son gestionados por OpenClaw incluso cuando el texto normal de seguimiento se enruta a la sesión ACP vinculada; `/status` y `/unfocus` también permanecen locales siempre que la gestión de comandos esté habilitada para esa superficie.
  </Accordion>
  <Accordion title="Sesiones vinculadas a hilos">
    Cuando las vinculaciones de hilo están habilitadas para un adaptador de canal:

    - OpenClaw vincula un hilo a una sesión ACP de destino.
    - Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
    - La salida ACP se entrega de vuelta al mismo hilo.
    - Unfocus/close/archive/idle-timeout o la expiración por antigüedad máxima eliminan la vinculación.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` y `/unfocus` son comandos del Gateway, no prompts para el harness ACP.

    Indicadores de función requeridos para ACP vinculado a hilos:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` está activado por defecto (establece `false` para pausar el despacho ACP).
    - Indicador de creación de hilos ACP habilitado en el adaptador de canal (específico del adaptador):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    La compatibilidad con vinculaciones de hilo depende del adaptador. Si el adaptador
    de canal activo no admite vinculaciones de hilo, OpenClaw devuelve un mensaje claro
    de no compatible/no disponible.

  </Accordion>
  <Accordion title="Canales compatibles con hilos">
    - Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
    - Compatibilidad integrada actual: hilos/canales de **Discord**, temas de **Telegram** (temas de foro en grupos/supergrupos y temas en mensajes directos).
    - Los canales de Plugins pueden añadir compatibilidad a través de la misma interfaz de vinculación.
  </Accordion>
</AccordionGroup>

## Vinculaciones persistentes de canal

Para flujos de trabajo no efímeros, configura vinculaciones ACP persistentes en
las entradas `bindings[]` de nivel superior.

### Modelo de vinculación

<ParamField path="bindings[].type" type='"acp"'>
  Marca una vinculación persistente de conversación ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversación de destino. Formas por canal:

- **Canal/hilo de Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Tema de foro de Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo de BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefiere `chat_id:*` o `chat_identifier:*` para vinculaciones estables de grupo.
- **DM/grupo de iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefiere `chat_id:*` para vinculaciones estables de grupo.
</ParamField>
  <ParamField path="bindings[].agentId" type="string">
  El ID del agente propietario de OpenClaw.
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Sobrescritura ACP opcional.
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  Etiqueta opcional orientada al operador.
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  Directorio de trabajo opcional del runtime.
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  Sobrescritura opcional del backend.
  </ParamField>

### Valores predeterminados de runtime por agente

Usa `agents.list[].runtime` para definir valores predeterminados ACP una sola vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID del harness, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedencia de sobrescritura para sesiones ACP vinculadas:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valores predeterminados globales de ACP (por ejemplo `acp.backend`)

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
- En conversaciones vinculadas, `/new` y `/reset` restablecen la misma clave de sesión ACP en su lugar.
- Las vinculaciones temporales de runtime (por ejemplo, creadas por flujos de enfoque de hilo) siguen aplicándose donde estén presentes.
- Para creaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas heredadas faltantes del espacio de trabajo recurren al cwd predeterminado del backend; los fallos de acceso no debidos a ausencia aparecen como errores de creación.

## Iniciar sesiones ACP

Dos formas de iniciar una sesión ACP:

<Tabs>
  <Tab title="Desde sessions_spawn">
    Usa `runtime: "acp"` para iniciar una sesión ACP desde un turno de agente o
    una llamada a herramienta.

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
    `runtime` usa `subagent` por defecto, así que establece `runtime: "acp"` explícitamente
    para sesiones ACP. Si se omite `agentId`, OpenClaw usa
    `acp.defaultAgent` cuando está configurado. `mode: "session"` requiere
    `thread: true` para mantener una conversación persistente vinculada.
    </Note>

  </Tab>
  <Tab title="Desde el comando /acp">
    Usa `/acp spawn` para control explícito del operador desde el chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Banderas clave:

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
  Prompt inicial enviado a la sesión de ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Debe ser `"acp"` para las sesiones de ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id del arnés de destino de ACP. Usa `acp.defaultAgent` como respaldo si está configurado.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita el flujo de vinculación de hilo cuando sea compatible.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` es de una sola ejecución; `"session"` es persistente. Si `thread: true` y
  se omite `mode`, OpenClaw puede usar por defecto un comportamiento persistente según
  la ruta del runtime. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo solicitado para el runtime (validado por la política del backend/runtime).
  Si se omite, el inicio de ACP hereda el espacio de trabajo del agente de destino
  cuando está configurado; las rutas heredadas que falten vuelven a los valores predeterminados del backend,
  mientras que los errores reales de acceso se devuelven.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta orientada al operador usada en el texto de sesión/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reanuda una sesión de ACP existente en lugar de crear una nueva. El
  agente reproduce su historial de conversación mediante `session/load`. Requiere
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite los resúmenes iniciales del progreso de la ejecución de ACP de vuelta a la
  sesión solicitante como eventos del sistema. Las respuestas aceptadas incluyen
  `streamLogPath` que apunta a un registro JSONL con alcance de sesión
  (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo de retransmisión.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Aborta el turno hijo de ACP después de N segundos. `0` mantiene el turno en la
  ruta sin tiempo de espera del Gateway. El mismo valor se aplica a la ejecución del Gateway
  y al runtime de ACP para que los arneses bloqueados o sin cuota no
  ocupen indefinidamente el carril del agente padre.
</ParamField>
<ParamField path="model" type="string">
  Anulación explícita del modelo para la sesión hija de ACP. Los inicios de Codex ACP
  normalizan referencias de OpenClaw Codex como `openai-codex/gpt-5.4` a la configuración de inicio de Codex
  ACP antes de `session/new`; las formas con barra como
  `openai-codex/gpt-5.4/high` también establecen el esfuerzo de razonamiento de Codex ACP.
  Otros arneses deben anunciar `models` de ACP y admitir
  `session/set_model`; de lo contrario, OpenClaw/acpx falla claramente en lugar de
  recurrir silenciosamente al valor predeterminado del agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esfuerzo explícito de pensamiento/razonamiento. Para Codex ACP, `minimal` se asigna a
  esfuerzo bajo, `low`/`medium`/`high`/`xhigh` se asignan directamente, y `off`
  omite la anulación del esfuerzo de razonamiento en el inicio.
</ParamField>

## Modos de vinculación de inicio y de hilo

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamiento                                                               |
    | ------ | --------------------------------------------------------------------------- |
    | `here` | Vincula la conversación activa actual en su lugar; falla si no hay ninguna activa. |
    | `off`  | No crea una vinculación con la conversación actual.                         |

    Notas:

    - `--bind here` es la ruta de operador más simple para “hacer que este canal o chat use Codex”.
    - `--bind here` no crea un hilo hijo.
    - `--bind here` solo está disponible en canales que exponen compatibilidad con la vinculación de la conversación actual.
    - `--bind` y `--thread` no se pueden combinar en la misma llamada a `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamiento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------------- |
    | `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo hijo cuando sea compatible. |
    | `here` | Requiere el hilo activo actual; falla si no está en uno.                                                 |
    | `off`  | Sin vinculación. La sesión se inicia sin vincular.                                                        |

    Notas:

    - En superficies sin vinculación de hilo, el comportamiento predeterminado es en la práctica `off`.
    - El inicio vinculado a hilo requiere compatibilidad con la política del canal:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo hijo.

  </Tab>
</Tabs>

## Modelo de entrega

Las sesiones de ACP pueden ser espacios de trabajo interactivos o
trabajo en segundo plano propiedad del padre. La ruta de entrega depende
de esa forma.

<AccordionGroup>
  <Accordion title="Sesiones interactivas de ACP">
    Las sesiones interactivas están pensadas para seguir conversando en una superficie de chat visible:

    - `/acp spawn ... --bind here` vincula la conversación actual a la sesión de ACP.
    - `/acp spawn ... --thread ...` vincula un hilo/tema del canal a la sesión de ACP.
    - Las `bindings[].type="acp"` persistentes configuradas enrutan las conversaciones coincidentes a la misma sesión de ACP.

    Los mensajes de seguimiento en la conversación vinculada se enrutan directamente a la
    sesión de ACP, y la salida de ACP se entrega de vuelta a ese mismo
    canal/hilo/tema.

    Lo que OpenClaw envía al arnés:

    - Los seguimientos vinculados normales se envían como texto del prompt, además de archivos adjuntos solo cuando el arnés/backend los admite.
    - Los comandos de administración `/acp` y los comandos locales del Gateway se interceptan antes del envío a ACP.
    - Los eventos de finalización generados por el runtime se materializan según el destino. Los agentes de OpenClaw reciben el sobre interno de contexto de runtime de OpenClaw; los arneses externos de ACP reciben un prompt simple con el resultado del hijo y una instrucción. El sobre bruto `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca debe enviarse a arneses externos ni persistirse como texto de transcripción de usuario de ACP.
    - Las entradas de transcripción de ACP usan el texto del activador visible para el usuario o el prompt simple de finalización. Los metadatos internos del evento permanecen estructurados en OpenClaw cuando es posible y no se tratan como contenido de chat creado por el usuario.

  </Accordion>
  <Accordion title="Sesiones de ACP de una sola ejecución propiedad del padre">
    Las sesiones de ACP de una sola ejecución iniciadas por otra ejecución de agente son hijos en segundo plano,
    similares a subagentes:

    - El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - El hijo se ejecuta en su propia sesión de arnés ACP.
    - Los turnos del hijo se ejecutan en el mismo carril en segundo plano usado por los inicios de subagentes nativos, para que un arnés ACP lento no bloquee otro trabajo no relacionado de la sesión principal.
    - La finalización informa de vuelta a través de la ruta de anuncio de finalización de tareas. OpenClaw convierte los metadatos internos de finalización en un prompt simple de ACP antes de enviarlos a un arnés externo, para que los arneses no vean marcadores de contexto de runtime exclusivos de OpenClaw.
    - El padre reescribe el resultado del hijo con una voz normal de asistente cuando conviene una respuesta orientada al usuario.

    **No** trates esta ruta como un chat entre pares entre
    padre e hijo. El hijo ya tiene un canal de finalización de vuelta al
    padre.

  </Accordion>
  <Accordion title="Entrega de sessions_send y A2A">
    `sessions_send` puede dirigirse a otra sesión después del inicio. Para sesiones entre pares normales, OpenClaw usa una ruta de seguimiento agente a agente (A2A) después de inyectar el mensaje:

    - Espera la respuesta de la sesión de destino.
    - Opcionalmente permite que el solicitante y el destino intercambien un número limitado de turnos de seguimiento.
    - Solicita al destino que produzca un mensaje de anuncio.
    - Entrega ese anuncio al canal o hilo visible.

    Esa ruta A2A es una alternativa para envíos entre pares cuando el remitente necesita un seguimiento visible. Permanece habilitada cuando una sesión no relacionada puede
    ver y enviar mensajes a un destino ACP, por ejemplo con configuraciones amplias de
    `tools.sessions.visibility`.

    OpenClaw omite el seguimiento A2A solo cuando el solicitante es el
    padre de su propio hijo ACP de una sola ejecución propiedad del padre. En ese caso,
    ejecutar A2A además de la finalización de la tarea puede despertar al padre con el
    resultado del hijo, reenviar la respuesta del padre de vuelta al hijo, y
    crear un bucle de eco padre/hijo. El resultado de `sessions_send` informa
    `delivery.status="skipped"` para ese caso de hijo propio porque la
    ruta de finalización ya es responsable del resultado.

  </Accordion>
  <Accordion title="Reanudar una sesión existente">
    Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de
    empezar desde cero. El agente reproduce su historial de conversación mediante
    `session/load`, para que retome con el contexto completo de lo ocurrido antes.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso habituales:

    - Transferir una sesión de Codex de tu laptop a tu teléfono: dile a tu agente que retome donde lo dejaste.
    - Continuar una sesión de programación que iniciaste de forma interactiva en la CLI, ahora sin interfaz mediante tu agente.
    - Retomar trabajo que fue interrumpido por un reinicio del gateway o por tiempo de inactividad.

    Notas:

    - `resumeSessionId` requiere `runtime: "acp"` — devuelve un error si se usa con el runtime de subagente.
    - `resumeSessionId` restaura el historial de conversación ACP ascendente; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, por lo que `mode: "session"` sigue requiriendo `thread: true`.
    - El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
    - Si no se encuentra el id de sesión, el inicio falla con un error claro: no hay un cambio silencioso a una sesión nueva.

  </Accordion>
  <Accordion title="Prueba rápida posterior al despliegue">
    Después de desplegar un gateway, ejecuta una verificación integral en vivo en lugar de
    confiar en las pruebas unitarias:

    1. Verifica la versión y el commit del gateway desplegado en el host de destino.
    2. Abre una sesión puente ACPX temporal hacia un agente activo.
    3. Pide a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` real, y que no haya error de validación.
    5. Limpia la sesión puente temporal.

    Mantén la validación en `mode: "run"` y omite `streamTo: "parent"`:
    `mode: "session"` vinculado a hilos y las rutas de retransmisión de flujo son pases de integración separados y más completos.

  </Accordion>
</AccordionGroup>

## Compatibilidad con sandbox

Las sesiones de ACP actualmente se ejecutan en el runtime del host, **no** dentro del
sandbox de OpenClaw.

<Warning>
**Límite de seguridad:**

- El arnés externo puede leer/escribir según sus propios permisos de CLI y el `cwd` seleccionado.
- La política de sandbox de OpenClaw **no** encapsula la ejecución del arnés ACP.
- OpenClaw sigue aplicando puertas de funciones de ACP, agentes permitidos, propiedad de la sesión, vinculaciones de canal y política de entrega del Gateway.
- Usa `runtime: "subagent"` para trabajo nativo de OpenClaw con sandbox obligatorio.
</Warning>

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, los inicios de ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.

## Resolución del destino de la sesión

La mayoría de las acciones `/acp` aceptan un destino de sesión opcional (`session-key`,
`session-id`, o `session-label`).

**Orden de resolución:**

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - primero intenta con la clave
   - luego con el id de sesión con forma de UUID
   - luego con la etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculado a una sesión de ACP).
3. Respaldo de la sesión solicitante actual.

Las vinculaciones de la conversación actual y las vinculaciones de hilo participan ambas en
el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro
(`Unable to resolve session target: ...`).

## Controles de ACP

| Comando              | Qué hace                                                     | Ejemplo                                                       |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión de ACP; vinculación actual o de hilo opcional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso de la sesión de destino.           | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de dirección a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula los destinos de hilo.          | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de runtime y capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo de runtime para la sesión de destino.      | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opciones de configuración del runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la anulación del directorio de trabajo del runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de política de aprobación.               | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del runtime (segundos).        | `/acp timeout 120`                                            |
| `/acp model`         | Establece la anulación del modelo del runtime.               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las anulaciones de opciones de runtime de la sesión. | `/acp reset-options`                                          |
| `/acp sessions`      | Lista las sesiones recientes de ACP del almacén.             | `/acp sessions`                                               |
| `/acp doctor`        | Estado del backend, capacidades y soluciones accionables.    | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y activación.     | `/acp install`                                                |

`/acp status` muestra las opciones de runtime efectivas junto con los identificadores de sesión a nivel de runtime y
backend. Los errores de controles no compatibles aparecen
claramente cuando un backend carece de una capacidad. `/acp sessions` lee el
almacén para la sesión actual vinculada o solicitante; los tokens de destino
(`session-key`, `session-id`, o `session-label`) se resuelven mediante
la detección de sesiones del gateway, incluidas las raíces
personalizadas `session.store` por agente.

### Asignación de opciones de runtime

`/acp` tiene comandos de conveniencia y un setter genérico. Operaciones
equivalentes:

| Comando                      | Se asigna a                          | Notas                                                                                                                                                                              |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | clave de configuración de runtime `model`           | Para Codex ACP, OpenClaw normaliza `openai-codex/<model>` al id de modelo del adaptador y asigna sufijos de razonamiento con barra como `openai-codex/gpt-5.4/high` a `reasoning_effort`. |
| `/acp set thinking <level>`  | clave de configuración de runtime `thinking`        | Para Codex ACP, OpenClaw envía el `reasoning_effort` correspondiente cuando el adaptador admite uno.                                                                             |
| `/acp permissions <profile>` | clave de configuración de runtime `approval_policy` | —                                                                                                                                                                                  |
| `/acp timeout <seconds>`     | clave de configuración de runtime `timeout`         | —                                                                                                                                                                                  |
| `/acp cwd <path>`            | anulación de cwd del runtime                 | Actualización directa.                                                                                                                                                             |
| `/acp set <key> <value>`     | genérico                              | `key=cwd` usa la ruta de anulación de cwd.                                                                                                                                         |
| `/acp reset-options`         | borra todas las anulaciones de runtime         | —                                                                                                                                                                                  |

## arnés acpx, configuración de Plugin y permisos

Para la configuración del arnés acpx (alias de Claude Code / Codex / Gemini CLI),
los puentes MCP de herramientas de Plugin y herramientas de OpenClaw, y los modos de permisos de ACP, consulta
[Agentes ACP — configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                    | Causa probable                                                                  | Solución                                                                                                                                                                  |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                    | Falta el Plugin del backend, está deshabilitado o está bloqueado por `plugins.allow`. | Instala y habilita el Plugin del backend, incluye `acpx` en `plugins.allow` cuando esa allowlist esté configurada y luego ejecuta `/acp doctor`.                         |
| `ACP is disabled by policy (acp.enabled=false)`                            | ACP está deshabilitado globalmente.                                             | Establece `acp.enabled=true`.                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`          | El envío desde mensajes normales del hilo está deshabilitado.                   | Establece `acp.dispatch.enabled=true`.                                                                                                                                    |
| `ACP agent "<id>" is not allowed by policy`                                | El agente no está en la allowlist.                                              | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                              |
| `/acp doctor` reports backend not ready right after startup                | La comprobación de dependencias del Plugin o la autorreparación aún se está ejecutando. | Espera un momento y vuelve a ejecutar `/acp doctor`; si sigue sin estar sano, inspecciona el error de instalación del backend y la política de allow/deny del Plugin.    |
| Harness command not found                                                  | La CLI del adaptador no está instalada o falló la primera descarga con `npx`.   | Instala o precalienta el adaptador en el host del Gateway, o configura explícitamente el comando del agente acpx.                                                        |
| Model-not-found from the harness                                           | El id del modelo es válido para otro proveedor/arnés pero no para este destino ACP. | Usa un modelo listado por ese arnés, configura el modelo en el arnés o omite la anulación.                                                                               |
| Vendor auth error from the harness                                         | OpenClaw está sano, pero la CLI/proveedor de destino no ha iniciado sesión.     | Inicia sesión o proporciona la clave del proveedor requerida en el entorno del host del Gateway.                                                                          |
| `Unable to resolve session target: ...`                                    | Token de clave/id/etiqueta incorrecto.                                          | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` se usó sin una conversación activa que se pueda vincular.         | Ve al chat/canal de destino y vuelve a intentarlo, o usa un inicio sin vinculación.                                                                                      |
| `Conversation bindings are unavailable for <channel>.`                     | El adaptador no tiene capacidad de vinculación ACP para la conversación actual.  | Usa `/acp spawn ... --thread ...` cuando sea compatible, configura `bindings[]` de nivel superior o cambia a un canal compatible.                                       |
| `--thread here requires running /acp spawn inside an active ... thread`    | `--thread here` se usó fuera de un contexto de hilo.                             | Ve al hilo de destino o usa `--thread auto`/`off`.                                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`              | Otro usuario es propietario del destino de vinculación activo.                  | Vuelve a vincular como propietario o usa otra conversación o hilo.                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                           | El adaptador no tiene capacidad de vinculación de hilo.                          | Usa `--thread off` o cambia a un adaptador/canal compatible.                                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                         | El runtime de ACP está en el host; la sesión solicitante está en sandbox.        | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta el inicio de ACP desde una sesión sin sandbox.                                                             |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`    | Se solicitó `sandbox="require"` para el runtime de ACP.                          | Usa `runtime="subagent"` para sandbox obligatorio, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                       |
| `Cannot apply --model ... did not advertise model support`                 | El arnés de destino no expone el cambio de modelo genérico de ACP.               | Usa un arnés que anuncie `models`/`session/set_model` de ACP, usa referencias de modelo de Codex ACP o configura el modelo directamente en el arnés si tiene su propia bandera de inicio. |
| Missing ACP metadata for bound session                                     | Metadatos de sesión ACP obsoletos o eliminados.                                  | Vuelve a crearla con `/acp spawn` y luego vuelve a vincular/enfocar el hilo.                                                                                              |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`   | `permissionMode` bloquea escrituras/ejecución en una sesión ACP no interactiva.  | Establece `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia el gateway. Consulta [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                 | Los prompts de permisos están bloqueados por `permissionMode`/`nonInteractivePermissions`. | Revisa los registros del gateway para ver `AcpRuntimeError`. Para permisos completos, establece `permissionMode=approve-all`; para degradación controlada, establece `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                      | El proceso del arnés terminó pero la sesión ACP no informó la finalización.      | Supervisa con `ps aux \| grep acpx`; mata manualmente los procesos obsoletos.                                                                                             |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                       | El sobre de evento interno se filtró a través del límite de ACP.                 | Actualiza OpenClaw y vuelve a ejecutar el flujo de finalización; los arneses externos deben recibir solo prompts simples de finalización.                                |

## Relacionado

- [Agentes ACP — configuración](/es/tools/acp-agents-setup)
- [Envío de agente](/es/tools/agent-send)
- [Backends de CLI](/es/gateway/cli-backends)
- [Arnés Codex](/es/plugins/codex-harness)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo bridge)](/es/cli/acp)
- [Subagentes](/es/tools/subagents)
