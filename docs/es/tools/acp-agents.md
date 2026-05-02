---
read_when:
    - Ejecutar arneses de codificación mediante ACP
    - Configuración de sesiones ACP vinculadas a la conversación en canales de mensajería
    - Vincular una conversación de canal de mensajes a una sesión ACP persistente
    - Solución de problemas del servidor ACP, la integración de Plugin o la entrega de finalizaciones
    - Ejecutar comandos /acp desde el chat
sidebarTitle: ACP agents
summary: Ejecuta entornos de codificación externos (Claude Code, Cursor, Gemini CLI, Codex ACP explícito, OpenClaw ACP, OpenCode) a través del backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-05-02T21:06:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permiten que OpenClaw ejecute arneses de codificación externos (por ejemplo Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI y otros
arneses ACPX compatibles) mediante un plugin de backend ACP.

Cada creación de sesión ACP se registra como una [tarea en segundo plano](/es/automation/tasks).

<Note>
**ACP es la ruta de arneses externos, no la ruta predeterminada de Codex.** El
plugin nativo del servidor de aplicaciones de Codex posee los controles
`/codex ...` y el runtime embebido `agentRuntime.id: "codex"`; ACP posee
los controles `/acp ...` y las sesiones `sessions_spawn({ runtime: "acp" })`.

Si quieres que Codex o Claude Code se conecten como cliente MCP externo
directamente a conversaciones de canales existentes de OpenClaw, usa
[`openclaw mcp serve`](/es/cli/mcp) en lugar de ACP.
</Note>

## ¿Qué página necesito?

| Quieres…                                                                                         | Usa esto                              | Notas                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vincular o controlar Codex en la conversación actual                                             | `/codex bind`, `/codex threads`       | Ruta nativa del servidor de aplicaciones de Codex cuando el plugin `codex` está habilitado; incluye respuestas de chat vinculadas, reenvío de imágenes, modelo/rápido/permisos, detener y controles de guía. ACP es una alternativa explícita |
| Ejecutar Claude Code, Gemini CLI, Codex ACP explícito u otro arnés externo _a través de_ OpenClaw | Esta página                           | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime                                                                          |
| Exponer una sesión de OpenClaw Gateway _como_ servidor ACP para un editor o cliente              | [`openclaw acp`](/es/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw mediante stdio/WebSocket                                                                                                                             |
| Reutilizar una CLI de IA local como modelo alternativo solo de texto                             | [Backends de CLI](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin runtime de arnés                                                                                                                        |

## ¿Funciona sin configuración adicional?

Sí, después de instalar el plugin oficial de runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los checkouts de código fuente pueden usar el plugin local del workspace `extensions/acpx` después de
`pnpm install`. Ejecuta `/acp doctor` para una comprobación de preparación.

OpenClaw solo enseña a los agentes sobre la creación de ACP cuando ACP es **realmente
utilizable**: ACP debe estar habilitado, el dispatch no debe estar deshabilitado, la sesión
actual no debe estar bloqueada por sandbox y debe haber un backend de runtime
cargado. Si esas condiciones no se cumplen, las Skills del plugin ACP y la
guía de ACP de `sessions_spawn` permanecen ocultas para que el agente no sugiera
un backend no disponible.

<AccordionGroup>
  <Accordion title="Problemas comunes del primer uso">
    - Si `plugins.allow` está definido, es un inventario de plugins restrictivo y **debe** incluir `acpx`; de lo contrario, el backend ACP instalado se bloquea intencionalmente y `/acp doctor` informa la entrada faltante en la lista de permitidos.
    - El adaptador ACP de Codex se prepara con el plugin `acpx` y se inicia localmente cuando es posible.
    - Otros adaptadores de arneses de destino aún pueden descargarse bajo demanda con `npx` la primera vez que los uses.
    - La autenticación del proveedor aún debe existir en el host para ese arnés.
    - Si el host no tiene npm o acceso de red, las descargas de adaptadores del primer uso fallan hasta que las cachés se precalientan o el adaptador se instala de otra manera.

  </Accordion>
  <Accordion title="Requisitos previos del runtime">
    ACP inicia un proceso real de arnés externo. OpenClaw posee el enrutamiento,
    el estado de tareas en segundo plano, la entrega, las vinculaciones y la política; el arnés
    posee su inicio de sesión de proveedor, catálogo de modelos, comportamiento del sistema de archivos y
    herramientas nativas.

    Antes de culpar a OpenClaw, verifica:

    - `/acp doctor` informa un backend habilitado y saludable.
    - El id de destino está permitido por `acp.allowedAgents` cuando esa lista de permitidos está definida.
    - El comando del arnés puede iniciarse en el host del Gateway.
    - La autenticación del proveedor está presente para ese arnés (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - El modelo seleccionado existe para ese arnés; los ids de modelo no son portátiles entre arneses.
    - El `cwd` solicitado existe y es accesible, u omite `cwd` y deja que el backend use su valor predeterminado.
    - El modo de permisos coincide con el trabajo. Las sesiones no interactivas no pueden hacer clic en solicitudes nativas de permisos, por lo que las ejecuciones de codificación con mucha escritura/ejecución normalmente necesitan un perfil de permisos ACPX que pueda continuar sin interfaz.

  </Accordion>
</AccordionGroup>

Las herramientas de plugins de OpenClaw y las herramientas integradas de OpenClaw **no** se exponen a
arneses ACP de forma predeterminada. Habilita los puentes MCP explícitos en
[Agentes ACP — configuración](/es/tools/acp-agents-setup) solo cuando el arnés
deba llamar a esas herramientas directamente.

## Objetivos de arnés compatibles

Con el backend `acpx`, usa estos ids de arnés como objetivos de `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id de arnés | Backend típico                                 | Notas                                                                               |
| ----------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`    | Adaptador ACP de Claude Code                   | Requiere autenticación de Claude Code en el host.                                   |
| `codex`     | Adaptador ACP de Codex                         | Solo alternativa ACP explícita cuando `/codex` nativo no está disponible o se solicita ACP. |
| `copilot`   | Adaptador ACP de GitHub Copilot                | Requiere autenticación de CLI/runtime de Copilot.                                   |
| `cursor`    | ACP de Cursor CLI (`cursor-agent acp`)         | Sobrescribe el comando acpx si una instalación local expone un entrypoint ACP diferente. |
| `droid`     | Factory Droid CLI                              | Requiere autenticación de Factory/Droid o `FACTORY_API_KEY` en el entorno del arnés. |
| `gemini`    | Adaptador ACP de Gemini CLI                    | Requiere autenticación de Gemini CLI o configuración de clave API.                  |
| `iflow`     | iFlow CLI                                      | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kilocode`  | Kilo Code CLI                                  | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kimi`      | Kimi/Moonshot CLI                              | Requiere autenticación de Kimi/Moonshot en el host.                                 |
| `kiro`      | Kiro CLI                                       | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `opencode`  | Adaptador ACP de OpenCode                      | Requiere autenticación de OpenCode CLI/proveedor.                                   |
| `openclaw`  | Puente de OpenClaw Gateway mediante `openclaw acp` | Permite que un arnés compatible con ACP hable de vuelta a una sesión de OpenClaw Gateway. |
| `pi`        | Pi/runtime embebido de OpenClaw                | Usado para experimentos de arneses nativos de OpenClaw.                             |
| `qwen`      | Qwen Code / Qwen CLI                           | Requiere autenticación compatible con Qwen en el host.                              |

Los alias personalizados de agente acpx pueden configurarse en el propio acpx, pero la política de OpenClaw
sigue comprobando `acp.allowedAgents` y cualquier mapeo
`agents.list[].runtime.acp.agent` antes del dispatch.

## Runbook del operador

Flujo rápido de `/acp` desde el chat:

<Steps>
  <Step title="Crear">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, o
    `/acp spawn codex --bind here` explícito.
  </Step>
  <Step title="Trabajar">
    Continúa en la conversación o hilo vinculado (o apunta a la clave
    de sesión explícitamente).
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
    - La creación crea o reanuda una sesión de runtime ACP, registra metadatos ACP en el almacén de sesiones de OpenClaw y puede crear una tarea en segundo plano cuando la ejecución pertenece al padre.
    - Las sesiones ACP pertenecientes al padre se tratan como trabajo en segundo plano incluso cuando la sesión de runtime es persistente; la finalización y la entrega entre superficies pasan por el notificador de tareas padre en lugar de actuar como una sesión de chat normal orientada al usuario.
    - El mantenimiento de tareas cierra sesiones ACP de un solo uso pertenecientes al padre que están terminales o huérfanas. Las sesiones ACP persistentes se conservan mientras queda una vinculación de conversación activa; las sesiones persistentes obsoletas sin una vinculación activa se cierran para que no puedan reanudarse silenciosamente después de que la tarea propietaria haya terminado o su registro de tarea haya desaparecido.
    - Los mensajes de seguimiento vinculados van directamente a la sesión ACP hasta que la vinculación se cierra, se desenfoca, se restablece o caduca.
    - Los comandos del Gateway permanecen locales. `/acp ...`, `/status` y `/unfocus` nunca se envían como texto de prompt normal a un arnés ACP vinculado.
    - `cancel` aborta el turno activo cuando el backend admite cancelación; no elimina la vinculación ni los metadatos de sesión.
    - `close` finaliza la sesión ACP desde el punto de vista de OpenClaw y elimina la vinculación. Un arnés aún puede conservar su propio historial ascendente si admite reanudación.
    - Los workers de runtime inactivos son aptos para limpieza después de `acp.runtime.ttlMinutes`; los metadatos de sesión almacenados siguen disponibles para `/acp sessions`.

  </Accordion>
  <Accordion title="Reglas de enrutamiento nativo de Codex">
    Disparadores de lenguaje natural que deberían dirigirse al **plugin nativo de Codex**
    cuando está habilitado:

    - "Vincula este canal de Discord a Codex."
    - "Adjunta este chat al hilo de Codex `<id>`."
    - "Muestra los hilos de Codex, luego vincula este."

    La vinculación de conversaciones nativas de Codex es la ruta predeterminada de control de chat.
    Las herramientas dinámicas de OpenClaw siguen ejecutándose a través de OpenClaw, mientras que
    las herramientas nativas de Codex, como shell/apply-patch, se ejecutan dentro de Codex.
    Para eventos de herramientas nativas de Codex, OpenClaw inyecta un relé de hook nativo
    por turno para que los hooks de plugins puedan bloquear `before_tool_call`, observar
    `after_tool_call` y enrutar eventos `PermissionRequest` de Codex
    mediante aprobaciones de OpenClaw. Los hooks `Stop` de Codex se retransmiten a
    `before_agent_finalize` de OpenClaw, donde los plugins pueden solicitar una pasada más
    del modelo antes de que Codex finalice su respuesta. El relé sigue siendo
    deliberadamente conservador: no muta los argumentos de herramientas nativas de Codex
    ni reescribe los registros de hilos de Codex. Usa ACP explícito solo
    cuando quieras el modelo de runtime/sesión de ACP. El límite de soporte
    embebido de Codex está documentado en el
    [contrato de soporte de arnés Codex v1](/es/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Hoja de referencia rápida de selección de modelo / proveedor / runtime">
    - `openai-codex/*` — ruta de OAuth/suscripción de PI Codex.
    - `openai/*` más `agentRuntime.id: "codex"` — runtime incrustado nativo del servidor de aplicación de Codex.
    - `/codex ...` — control de conversación nativo de Codex.
    - `/acp ...` o `runtime: "acp"` — control explícito de ACP/acpx.

  </Accordion>
  <Accordion title="Disparadores de lenguaje natural para enrutamiento ACP">
    Disparadores que deben enrutarse al runtime ACP:

    - "Ejecuta esto como una sesión ACP de Claude Code de una sola ejecución y resume el resultado."
    - "Usa Gemini CLI para esta tarea en un hilo y luego mantén los seguimientos en ese mismo hilo."
    - "Ejecuta Codex mediante ACP en un hilo en segundo plano."

    OpenClaw elige `runtime: "acp"`, resuelve el `agentId` del arnés,
    se vincula a la conversación o hilo actual cuando se admite, y
    enruta los seguimientos a esa sesión hasta el cierre/la expiración. Codex solo
    sigue esta ruta cuando ACP/acpx es explícito o el Plugin nativo de Codex
    no está disponible para la operación solicitada.

    Para `sessions_spawn`, `runtime: "acp"` se anuncia solo cuando ACP
    está habilitado, el solicitante no está en sandbox y hay un backend
    de runtime ACP cargado. `acp.dispatch.enabled=false` pausa el despacho
    automático de hilos ACP, pero no oculta ni bloquea las llamadas explícitas
    a `sessions_spawn({ runtime: "acp" })`. Apunta a ids de arnés ACP como `codex`,
    `claude`, `droid`, `gemini` u `opencode`. No pases un id de agente normal
    de configuración de OpenClaw desde `agents_list` a menos que esa entrada esté
    configurada explícitamente con `agents.list[].runtime.type="acp"`;
    de lo contrario, usa el runtime de subagente predeterminado. Cuando un agente
    de OpenClaw se configura con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` como el id de arnés subyacente.

  </Accordion>
</AccordionGroup>

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de arnés externo. Usa el **servidor de aplicación
nativo de Codex** para vinculación/control de conversaciones de Codex cuando el Plugin
`codex` esté habilitado. Usa **subagentes** cuando quieras ejecuciones delegadas
nativas de OpenClaw.

| Área                 | Sesión ACP                            | Ejecución de subagente             |
| -------------------- | ------------------------------------- | ---------------------------------- |
| Runtime              | Plugin de backend ACP (por ejemplo acpx) | Runtime de subagente nativo de OpenClaw |
| Clave de sesión      | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principales | `/acp ...`                            | `/subagents ...`                   |
| Herramienta de inicio | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predeterminado) |

Consulta también [Subagentes](/es/tools/subagents).

## Cómo ACP ejecuta Claude Code

Para Claude Code mediante ACP, la pila es:

1. Plano de control de sesión ACP de OpenClaw.
2. Plugin de runtime oficial `@openclaw/acpx`.
3. Adaptador ACP de Claude.
4. Maquinaria de runtime/sesión del lado de Claude.

ACP Claude es una **sesión de arnés** con controles ACP, reanudación de sesión,
seguimiento de tareas en segundo plano y vinculación opcional de conversación/hilo.

Los backends CLI son runtimes de reserva locales separados, de solo texto; consulta
[Backends CLI](/es/gateway/cli-backends).

Para los operadores, la regla práctica es:

- **¿Quieres `/acp spawn`, sesiones vinculables, controles de runtime o trabajo persistente de arnés?** Usa ACP.
- **¿Quieres una reserva local simple de texto mediante la CLI sin procesar?** Usa backends CLI.

## Sesiones vinculadas

### Modelo mental

- **Superficie de chat** — donde las personas siguen hablando (canal de Discord, tema de Telegram, chat de iMessage).
- **Sesión ACP** — el estado durable de runtime de Codex/Claude/Gemini al que OpenClaw enruta.
- **Hilo/tema hijo** — una superficie de mensajería adicional opcional creada solo por `--thread ...`.
- **Espacio de trabajo de runtime** — la ubicación del sistema de archivos (`cwd`, checkout del repo, espacio de trabajo del backend) donde se ejecuta el arnés. Independiente de la superficie de chat.

### Vinculaciones a la conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la
sesión ACP iniciada: sin hilo hijo, misma superficie de chat. OpenClaw sigue
siendo dueño del transporte, la autenticación, la seguridad y la entrega. Los mensajes
de seguimiento en esa conversación se enrutan a la misma sesión; `/new` y `/reset` reinician la
sesión en el lugar; `/acp close` elimina la vinculación.

Ejemplos:

```text
/codex bind                                              # vinculación nativa de Codex, enruta futuros mensajes aquí
/codex model gpt-5.4                                     # ajusta el hilo nativo vinculado de Codex
/codex stop                                              # controla el turno nativo activo de Codex
/acp spawn codex --bind here                             # reserva ACP explícita para Codex
/acp spawn codex --thread auto                           # puede crear un hilo/tema hijo y vincular allí
/acp spawn codex --bind here --cwd /workspace/repo       # misma vinculación de chat, Codex se ejecuta en /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reglas de vinculación y exclusividad">
    - `--bind here` y `--thread ...` son mutuamente excluyentes.
    - `--bind here` solo funciona en canales que anuncian vinculación a la conversación actual; OpenClaw devuelve un mensaje claro de no admitido en caso contrario. Las vinculaciones persisten entre reinicios del Gateway.
    - En Discord, `spawnSessions` controla la creación de hilos hijos para `--thread auto|here`, no para `--bind here`.
    - Si inicias un agente ACP diferente sin `--cwd`, OpenClaw hereda de forma predeterminada el espacio de trabajo del **agente de destino**. Las rutas heredadas faltantes (`ENOENT`/`ENOTDIR`) recurren al valor predeterminado del backend; otros errores de acceso (por ejemplo, `EACCES`) aparecen como errores de inicio.
    - Los comandos de administración del Gateway permanecen locales en conversaciones vinculadas: los comandos `/acp ...` los gestiona OpenClaw incluso cuando el texto normal de seguimiento se enruta a la sesión ACP vinculada; `/status` y `/unfocus` también permanecen locales siempre que el manejo de comandos esté habilitado para esa superficie.

  </Accordion>
  <Accordion title="Sesiones vinculadas a hilos">
    Cuando las vinculaciones de hilos están habilitadas para un adaptador de canal:

    - OpenClaw vincula un hilo a una sesión ACP de destino.
    - Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
    - La salida de ACP se entrega de vuelta al mismo hilo.
    - Desenfocar/cerrar/archivar/tiempo de inactividad agotado o expiración por edad máxima elimina la vinculación.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` y `/unfocus` son comandos de Gateway, no prompts para el arnés ACP.

    Indicadores de característica requeridos para ACP vinculado a hilos:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` está activado de forma predeterminada (establece `false` para pausar el despacho automático de hilos ACP; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando).
    - Inicios de sesiones de hilo de adaptador de canal habilitados (predeterminado: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    La compatibilidad con vinculación de hilos es específica del adaptador. Si el adaptador
    de canal activo no admite vinculaciones de hilos, OpenClaw devuelve un mensaje claro
    de no admitido/no disponible.

  </Accordion>
  <Accordion title="Canales con soporte de hilos">
    - Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
    - Soporte integrado actual: hilos/canales de **Discord**, temas de **Telegram** (temas de foro en grupos/supergrupos y temas de DM).
    - Los canales de Plugin pueden agregar soporte mediante la misma interfaz de vinculación.

  </Accordion>
</AccordionGroup>

## Vinculaciones persistentes de canal

Para flujos de trabajo no efímeros, configura vinculaciones ACP persistentes en
entradas de nivel superior `bindings[]`.

### Modelo de vinculación

<ParamField path="bindings[].type" type='"acp"'>
  Marca una vinculación de conversación ACP persistente.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversación de destino. Formas por canal:

- **Canal/hilo de Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Tema de foro de Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo de BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefiere `chat_id:*` o `chat_identifier:*` para vinculaciones de grupo estables.
- **DM/grupo de iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefiere `chat_id:*` para vinculaciones de grupo estables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  El id del agente propietario de OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Anulación opcional de ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etiqueta opcional orientada al operador.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directorio de trabajo de runtime opcional.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Anulación opcional del backend.
</ParamField>

### Valores predeterminados de runtime por agente

Usa `agents.list[].runtime` para definir valores predeterminados de ACP una vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de arnés, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedencia de anulaciones para sesiones vinculadas ACP:**

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

- OpenClaw garantiza que la sesión ACP configurada exista antes de usarla.
- Los mensajes en ese canal o tema se enrutan a la sesión ACP configurada.
- En conversaciones vinculadas, `/new` y `/reset` reinician la misma clave de sesión ACP en el lugar.
- Las vinculaciones temporales de runtime (por ejemplo, creadas por flujos de enfoque de hilos) siguen aplicándose donde estén presentes.
- Para inicios ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas de espacio de trabajo heredadas faltantes recurren al cwd predeterminado del backend; los fallos de acceso no faltantes aparecen como errores de inicio.

## Iniciar sesiones ACP

Dos formas de iniciar una sesión ACP:

<Tabs>
  <Tab title="Desde sessions_spawn">
    Usa `runtime: "acp"` para iniciar una sesión ACP desde un turno de agente o
    llamada de herramienta.

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
    `thread: true` para mantener una conversación vinculada persistente.
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

    Indicadores clave:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Consulta [comandos Slash](/es/tools/slash-commands).

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
  Id del harness de destino ACP. Recurre a `acp.defaultAgent` si está definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita el flujo de vinculación de hilo cuando sea compatible.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` es de una sola ejecución; `"session"` es persistente. Si `thread: true` y
  se omite `mode`, OpenClaw puede usar de forma predeterminada el comportamiento persistente según la
  ruta de runtime. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo solicitado del runtime (validado por la política del backend/runtime).
  Si se omite, el spawn ACP hereda el espacio de trabajo del agente de destino
  cuando está configurado; las rutas heredadas faltantes recurren a los valores predeterminados
  del backend, mientras que los errores reales de acceso se devuelven.
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
  `"parent"` transmite los resúmenes de progreso iniciales de la ejecución ACP de vuelta a la
  sesión solicitante como eventos del sistema. Las respuestas aceptadas incluyen
  `streamLogPath`, que apunta a un registro JSONL con alcance de sesión
  (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo de retransmisión.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Aborta el turno hijo ACP después de N segundos. `0` mantiene el turno en la
  ruta sin tiempo de espera del Gateway. El mismo valor se aplica a la ejecución del Gateway
  y al runtime ACP para que los harnesses atascados o con cuota agotada no
  ocupen indefinidamente la vía del agente padre.
</ParamField>
<ParamField path="model" type="string">
  Sobrescritura explícita de modelo para la sesión hija ACP. Los spawns Codex ACP
  normalizan las referencias OpenClaw Codex como `openai-codex/gpt-5.4` a la configuración de inicio
  de Codex ACP antes de `session/new`; las formas slash como
  `openai-codex/gpt-5.4/high` también establecen el esfuerzo de razonamiento de Codex ACP.
  Otros harnesses deben anunciar `models` de ACP y admitir
  `session/set_model`; de lo contrario, OpenClaw/acpx falla de forma clara en lugar de
  recurrir silenciosamente al valor predeterminado del agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esfuerzo explícito de pensamiento/razonamiento. Para Codex ACP, `minimal` se asigna a
  esfuerzo bajo, `low`/`medium`/`high`/`xhigh` se asignan directamente, y `off`
  omite la sobrescritura de inicio de esfuerzo de razonamiento.
</ParamField>

## Modos de vinculación y de hilo de spawn

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamiento                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Vincula la conversación activa actual en su lugar; falla si no hay ninguna activa. |
    | `off`  | No crea una vinculación de conversación actual.                          |

    Notas:

    - `--bind here` es la ruta de operador más sencilla para "hacer que este canal o chat esté respaldado por Codex".
    - `--bind here` no crea un hilo hijo.
    - `--bind here` solo está disponible en canales que exponen compatibilidad con vinculación de conversación actual.
    - `--bind` y `--thread` no se pueden combinar en la misma llamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamiento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo hijo cuando sea compatible. |
    | `here` | Requiere el hilo activo actual; falla si no estás en uno.                                                  |
    | `off`  | Sin vinculación. La sesión empieza sin vincular.                                                                 |

    Notas:

    - En superficies de vinculación sin hilos, el comportamiento predeterminado es efectivamente `off`.
    - El spawn vinculado a hilo requiere compatibilidad con la política del canal:
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
    - Las vinculaciones persistentes configuradas `bindings[].type="acp"` enrutan conversaciones coincidentes a la misma sesión ACP.

    Los mensajes posteriores en la conversación vinculada se enrutan directamente a la
    sesión ACP, y la salida de ACP se entrega de vuelta a ese mismo
    canal/hilo/tema.

    Lo que OpenClaw envía al harness:

    - Los seguimientos vinculados normales se envían como texto de prompt, más adjuntos solo cuando el harness/backend los admite.
    - Los comandos de administración `/acp` y los comandos locales de Gateway se interceptan antes del envío ACP.
    - Los eventos de finalización generados por el runtime se materializan por destino. Los agentes OpenClaw reciben el sobre interno de contexto de runtime de OpenClaw; los harnesses ACP externos reciben un prompt simple con el resultado hijo y la instrucción. El sobre sin procesar `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca debe enviarse a harnesses externos ni persistirse como texto de transcripción de usuario ACP.
    - Las entradas de transcripción ACP usan el texto de activación visible para el usuario o el prompt de finalización simple. Los metadatos de eventos internos permanecen estructurados en OpenClaw cuando es posible y no se tratan como contenido de chat escrito por el usuario.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Las sesiones ACP de una sola ejecución generadas por otra ejecución de agente son hijos
    en segundo plano, similares a subagentes:

    - El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - El hijo se ejecuta en su propia sesión de harness ACP.
    - Los turnos hijos se ejecutan en la misma vía en segundo plano usada por los spawns nativos de subagente, por lo que un harness ACP lento no bloquea trabajo no relacionado de la sesión principal.
    - Los informes de finalización vuelven por la ruta de anuncio de finalización de tarea. OpenClaw convierte los metadatos internos de finalización en un prompt ACP simple antes de enviarlo a un harness externo, para que los harnesses no vean marcadores de contexto de runtime exclusivos de OpenClaw.
    - El padre reescribe el resultado hijo con voz normal de asistente cuando una respuesta visible para el usuario es útil.

    **No** trates esta ruta como un chat de igual a igual entre padre
    e hijo. El hijo ya tiene un canal de finalización de vuelta al
    padre.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` puede apuntar a otra sesión después del spawn. Para sesiones
    de pares normales, OpenClaw usa una ruta de seguimiento agente a agente (A2A)
    después de inyectar el mensaje:

    - Espera la respuesta de la sesión de destino.
    - Opcionalmente permite que solicitante y destino intercambien un número acotado de turnos de seguimiento.
    - Pide al destino que produzca un mensaje de anuncio.
    - Entrega ese anuncio al canal o hilo visible.

    Esa ruta A2A es una alternativa para envíos de pares donde el remitente necesita un
    seguimiento visible. Permanece habilitada cuando una sesión no relacionada puede
    ver y enviar mensajes a un destino ACP, por ejemplo bajo configuraciones amplias de
    `tools.sessions.visibility`.

    OpenClaw omite el seguimiento A2A solo cuando el solicitante es el
    padre de su propio hijo ACP de una sola ejecución propiedad del padre. En ese caso,
    ejecutar A2A encima de la finalización de tarea puede despertar al padre con el
    resultado del hijo, reenviar la respuesta del padre de vuelta al hijo y
    crear un bucle de eco padre/hijo. El resultado de `sessions_send` informa
    `delivery.status="skipped"` para ese caso de hijo propio porque la
    ruta de finalización ya es responsable del resultado.

  </Accordion>
  <Accordion title="Resume an existing session">
    Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de
    empezar de cero. El agente reproduce su historial de conversación mediante
    `session/load`, así que continúa con todo el contexto de lo ocurrido antes.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comunes:

    - Transfiere una sesión Codex de tu portátil a tu teléfono: dile a tu agente que continúe donde lo dejaste.
    - Continúa una sesión de programación que empezaste de forma interactiva en la CLI, ahora sin interfaz mediante tu agente.
    - Retoma trabajo interrumpido por un reinicio del gateway o un tiempo de espera por inactividad.

    Notas:

    - `resumeSessionId` solo se aplica cuando `runtime: "acp"`; el runtime predeterminado de subagente ignora este campo exclusivo de ACP.
    - `streamTo` solo se aplica cuando `runtime: "acp"`; el runtime predeterminado de subagente ignora este campo exclusivo de ACP.
    - `resumeSessionId` es un id de reanudación ACP/harness local al host, no una clave de sesión de canal de OpenClaw; OpenClaw todavía comprueba la política de spawn ACP y la política del agente de destino antes del envío, mientras que el backend ACP o el harness posee la autorización para cargar ese id upstream.
    - `resumeSessionId` restaura el historial de conversación ACP upstream; `thread` y `mode` todavía se aplican con normalidad a la nueva sesión OpenClaw que estás creando, así que `mode: "session"` todavía requiere `thread: true`.
    - El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
    - Si no se encuentra el id de sesión, el spawn falla con un error claro, sin recurrir silenciosamente a una nueva sesión.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Después de un despliegue del gateway, ejecuta una comprobación end-to-end en vivo en lugar de
    confiar en pruebas unitarias:

    1. Verifica la versión y el commit del gateway desplegado en el host de destino.
    2. Abre una sesión puente ACPX temporal hacia un agente en vivo.
    3. Pide a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` real y ningún error de validador.
    5. Limpia la sesión puente temporal.

    Mantén la puerta en `mode: "run"` y omite `streamTo: "parent"`:
    el `mode: "session"` vinculado a hilo y las rutas de retransmisión de streaming son
    pases de integración más completos y separados.

  </Accordion>
</AccordionGroup>

## Compatibilidad con sandbox

Actualmente, las sesiones ACP se ejecutan en el runtime del host, **no** dentro del
sandbox de OpenClaw.

<Warning>
**Límite de seguridad:**

- El ejecutor externo puede leer/escribir según sus propios permisos de CLI y el `cwd` seleccionado.
- La política de sandbox de OpenClaw **no** envuelve la ejecución del ejecutor ACP.
- OpenClaw sigue aplicando las puertas de funcionalidad de ACP, los agentes permitidos, la propiedad de sesión, los enlaces de canal y la política de entrega del Gateway.
- Usa `runtime: "subagent"` para trabajo nativo de OpenClaw con sandbox aplicado.

</Warning>

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, los inicios ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.

## Resolución del destino de sesión

La mayoría de las acciones `/acp` aceptan un destino de sesión opcional (`session-key`,
`session-id` o `session-label`).

**Orden de resolución:**

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - prueba la clave
   - luego el id de sesión con forma de UUID
   - luego la etiqueta
2. Enlace del hilo actual (si esta conversación/hilo está enlazado a una sesión ACP).
3. Respaldo a la sesión solicitante actual.

Los enlaces de conversación actual y los enlaces de hilo participan ambos en
el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | Qué hace                                                  | Ejemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; enlace actual o de hilo opcional.    | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso para la sesión de destino.      | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de dirección a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desenlaza destinos de hilo.            | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de ejecución, capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo de ejecución para la sesión de destino. | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opción de configuración de ejecución. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la anulación del directorio de trabajo de ejecución. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de política de aprobación.            | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera de ejecución (segundos).    | `/acp timeout 120`                                            |
| `/acp model`         | Establece la anulación del modelo de ejecución.           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las anulaciones de opciones de ejecución de sesión. | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sesiones ACP recientes desde el almacén.            | `/acp sessions`                                               |
| `/acp doctor`        | Salud del backend, capacidades, correcciones accionables. | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación. | `/acp install`                                                |

`/acp status` muestra las opciones efectivas de ejecución más los identificadores de sesión de nivel de ejecución y
de nivel de backend. Los errores de control no admitido aparecen
claramente cuando a un backend le falta una capacidad. `/acp sessions` lee el
almacén para la sesión enlazada actual o solicitante; los tokens de destino
(`session-key`, `session-id` o `session-label`) se resuelven mediante el
descubrimiento de sesiones del Gateway, incluidas las raíces `session.store`
personalizadas por agente.

### Asignación de opciones de ejecución

`/acp` tiene comandos de conveniencia y un establecedor genérico. Operaciones
equivalentes:

| Comando                      | Se asigna a                          | Notas                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | clave de configuración de ejecución `model` | Para Codex ACP, OpenClaw normaliza `openai-codex/<model>` al id de modelo del adaptador y asigna sufijos de razonamiento con barra como `openai-codex/gpt-5.4/high` a `reasoning_effort`. |
| `/acp set thinking <level>`  | clave de configuración de ejecución `thinking` | Para Codex ACP, OpenClaw envía el `reasoning_effort` correspondiente donde el adaptador admite uno.                                                                            |
| `/acp permissions <profile>` | clave de configuración de ejecución `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | clave de configuración de ejecución `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | anulación de cwd de ejecución        | Actualización directa.                                                                                                                                                        |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa la ruta de anulación de cwd.                                                                                                                                     |
| `/acp reset-options`         | borra todas las anulaciones de ejecución | —                                                                                                                                                                              |

## ejecutor acpx, configuración del plugin y permisos

Para la configuración del ejecutor acpx (alias de Claude Code / Codex / Gemini CLI),
los puentes MCP de plugin-tools y OpenClaw-tools, y los modos de
permisos ACP, consulta
[agentes ACP — configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                     | Causa probable                                                                                                           | Solución                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente, deshabilitado o bloqueado por `plugins.allow`.                                                       | Instala y habilita el plugin de backend, incluye `acpx` en `plugins.allow` cuando esa lista de permitidos esté configurada y luego ejecuta `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP deshabilitado globalmente.                                                                                                 | Configura `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Envío automático desde mensajes normales de hilo deshabilitado.                                                               | Configura `acp.dispatch.enabled=true` para reanudar el enrutamiento automático de hilos; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente no incluido en la lista de permitidos.                                                                                                | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` informa que el backend no está listo justo después del inicio | Falta el plugin de backend, está deshabilitado, bloqueado por una política de permisos/denegación, o su ejecutable configurado no está disponible.        | Instala/habilita el plugin de backend, vuelve a ejecutar `/acp doctor` e inspecciona el error de instalación o política del backend si sigue en mal estado.                                           |
| Comando del arnés no encontrado                                                   | La CLI del adaptador no está instalada, falta el plugin externo o la obtención inicial con `npx` falló para un adaptador que no es Codex. | Ejecuta `/acp doctor`, instala/precalienta el adaptador en el host del Gateway o configura explícitamente el comando del agente acpx.                                                      |
| Modelo no encontrado desde el arnés                                            | El id del modelo es válido para otro proveedor/arnés, pero no para este destino ACP.                                                | Usa un modelo listado por ese arnés, configura el modelo en el arnés u omite la sobrescritura.                                                                            |
| Error de autenticación del proveedor desde el arnés                                          | OpenClaw está en buen estado, pero la CLI/proveedor de destino no tiene sesión iniciada.                                                     | Inicia sesión o proporciona la clave de proveedor requerida en el entorno del host del Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token de clave/id/etiqueta incorrecto.                                                                                                | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sin una conversación activa vinculable.                                                            | Muévete al chat/canal de destino y vuelve a intentarlo, o usa un spawn sin vinculación.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | El adaptador carece de capacidad de vinculación ACP con la conversación actual.                                                             | Usa `/acp spawn ... --thread ...` donde sea compatible, configura `bindings[]` de nivel superior o muévete a un canal compatible.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fuera de un contexto de hilo.                                                                         | Muévete al hilo de destino o usa `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Otro usuario posee el destino de vinculación activo.                                                                           | Vuelve a vincular como propietario o usa otra conversación o hilo.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | El adaptador carece de capacidad de vinculación de hilos.                                                                               | Usa `--thread off` o muévete a un adaptador/canal compatible.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | El runtime de ACP está del lado del host; la sesión solicitante está en sandbox.                                                              | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta el spawn de ACP desde una sesión sin sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Se solicitó `sandbox="require"` para el runtime de ACP.                                                                         | Usa `runtime="subagent"` para sandboxing requerido, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | El arnés de destino no expone cambio genérico de modelo ACP.                                                        | Usa un arnés que anuncie ACP `models`/`session/set_model`, usa referencias de modelo ACP de Codex o configura el modelo directamente en el arnés si tiene su propia marca de inicio. |
| Faltan metadatos ACP para la sesión vinculada                                      | Metadatos de sesión ACP obsoletos/eliminados.                                                                                    | Vuelve a crearla con `/acp spawn` y luego vuelve a vincular/enfocar el hilo.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloquea escrituras/ejecución en una sesión ACP no interactiva.                                                    | Configura `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia el gateway. Consulta [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| La sesión ACP falla al inicio con poca salida                                  | Las solicitudes de permiso están bloqueadas por `permissionMode`/`nonInteractivePermissions`.                                        | Revisa los registros del gateway para `AcpRuntimeError`. Para permisos completos, configura `permissionMode=approve-all`; para degradación gradual, configura `nonInteractivePermissions=deny`.        |
| La sesión ACP se queda detenida indefinidamente después de completar el trabajo                       | El proceso del arnés finalizó, pero la sesión ACP no informó la finalización.                                                    | Supervisa con `ps aux \| grep acpx`; elimina manualmente los procesos obsoletos.                                                                                                       |
| El arnés ve `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | El sobre de evento interno se filtró a través del límite ACP.                                                                | Actualiza OpenClaw y vuelve a ejecutar el flujo de finalización; los arneses externos solo deberían recibir prompts de finalización simples.                                                          |

## Relacionado

- [Agentes ACP: configuración](/es/tools/acp-agents-setup)
- [Envío de agente](/es/tools/agent-send)
- [Backends de CLI](/es/gateway/cli-backends)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo puente)](/es/cli/acp)
- [Subagentes](/es/tools/subagents)
