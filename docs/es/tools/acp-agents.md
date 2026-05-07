---
read_when:
    - Ejecución de entornos de codificación a través de ACP
    - Configurar sesiones ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de canal de mensajes a una sesión ACP persistente
    - Solución de problemas del backend de ACP, la conexión del Plugin o la entrega de completaciones
    - Operar comandos /acp desde el chat
sidebarTitle: ACP agents
summary: Ejecuta arneses de codificación externos (Claude Code, Cursor, Gemini CLI, ACP explícito de Codex, ACP de OpenClaw, OpenCode) a través del backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-05-07T13:24:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permiten que OpenClaw ejecute arneses de codificación externos (por ejemplo, Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI y otros
arneses ACPX compatibles) mediante un plugin de backend ACP.

Cada generación de sesión ACP se rastrea como una [tarea en segundo plano](/es/automation/tasks).

<Note>
**ACP es la ruta de arnés externo, no la ruta predeterminada de Codex.** El
plugin de servidor de aplicación nativo de Codex es propietario de los controles
`/codex ...` y del runtime integrado
`agentRuntime.id: "codex"`; ACP es propietario de los controles
`/acp ...` y de las sesiones `sessions_spawn({ runtime: "acp" })`.

Si quieres que Codex o Claude Code se conecten como clientes MCP externos
directamente a conversaciones de canal existentes de OpenClaw, usa
[`openclaw mcp serve`](/es/cli/mcp) en lugar de ACP.
</Note>

## ¿Qué página necesito?

| Quieres…                                                                                         | Usa esto                              | Notas                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular o controlar Codex en la conversación actual                                             | `/codex bind`, `/codex threads`       | Ruta nativa del servidor de aplicación de Codex cuando el plugin `codex` está habilitado; incluye respuestas de chat vinculadas, reenvío de imágenes, modelo/rápido/permisos, detener y controles de dirección. ACP es un respaldo explícito |
| Ejecutar Claude Code, Gemini CLI, Codex ACP explícito u otro arnés externo _a través de_ OpenClaw | Esta página                           | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime                                                                        |
| Exponer una sesión de OpenClaw Gateway _como_ servidor ACP para un editor o cliente              | [`openclaw acp`](/es/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw por stdio/WebSocket                                                                                                                                 |
| Reutilizar una CLI de IA local como modelo de respaldo solo de texto                             | [Backends de CLI](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin runtime de arnés                                                                                                                       |

## ¿Funciona sin configuración adicional?

Sí, después de instalar el plugin oficial de runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los checkouts de código fuente pueden usar el plugin de workspace local `extensions/acpx` después de
`pnpm install`. Ejecuta `/acp doctor` para una comprobación de preparación.

OpenClaw solo enseña a los agentes sobre la generación ACP cuando ACP es **realmente
utilizable**: ACP debe estar habilitado, el dispatch no debe estar deshabilitado, la sesión
actual no debe estar bloqueada por sandbox y debe haber un backend de runtime
cargado. Si esas condiciones no se cumplen, las Skills del plugin ACP y la
guía ACP de `sessions_spawn` permanecen ocultas para que el agente no sugiera
un backend no disponible.

<AccordionGroup>
  <Accordion title="Problemas habituales de la primera ejecución">
    - Si `plugins.allow` está configurado, es un inventario restrictivo de plugins y **debe** incluir `acpx`; de lo contrario, el backend ACP instalado queda bloqueado intencionalmente y `/acp doctor` informa la entrada faltante en la lista de permitidos.
    - El adaptador ACP de Codex se prepara con el plugin `acpx` y se inicia localmente cuando es posible.
    - Codex ACP se ejecuta con un `CODEX_HOME` aislado; OpenClaw copia solo las entradas de proyecto de confianza desde la configuración de Codex del host y confía en el workspace activo, dejando la autenticación, las notificaciones y los hooks en la configuración del host.
    - Otros adaptadores de arneses de destino aún pueden obtenerse bajo demanda con `npx` la primera vez que los uses.
    - La autenticación del proveedor aún debe existir en el host para ese arnés.
    - Si el host no tiene npm ni acceso a la red, las obtenciones de adaptadores en la primera ejecución fallan hasta que las cachés se precalienten o el adaptador se instale de otra forma.

  </Accordion>
  <Accordion title="Requisitos previos de runtime">
    ACP inicia un proceso real de arnés externo. OpenClaw es propietario del enrutamiento,
    el estado de tareas en segundo plano, la entrega, las vinculaciones y la política; el arnés
    es propietario de su inicio de sesión de proveedor, catálogo de modelos, comportamiento del sistema de archivos y
    herramientas nativas.

    Antes de culpar a OpenClaw, verifica:

    - `/acp doctor` informa un backend habilitado y en buen estado.
    - El id de destino está permitido por `acp.allowedAgents` cuando esa lista de permitidos está configurada.
    - El comando del arnés puede iniciarse en el host del Gateway.
    - La autenticación del proveedor está presente para ese arnés (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - El modelo seleccionado existe para ese arnés: los ids de modelo no son portables entre arneses.
    - El `cwd` solicitado existe y es accesible, o omite `cwd` y deja que el backend use su valor predeterminado.
    - El modo de permisos coincide con el trabajo. Las sesiones no interactivas no pueden hacer clic en solicitudes de permisos nativas, por lo que las ejecuciones de codificación con mucha escritura/ejecución normalmente necesitan un perfil de permisos ACPX que pueda continuar sin interfaz.

  </Accordion>
</AccordionGroup>

Las herramientas de plugin de OpenClaw y las herramientas integradas de OpenClaw **no** se exponen a
arneses ACP de forma predeterminada. Habilita los puentes MCP explícitos en
[Agentes ACP: configuración](/es/tools/acp-agents-setup) solo cuando el arnés
deba llamar a esas herramientas directamente.

## Objetivos de arnés compatibles

Con el backend `acpx`, usa estos ids de arnés como destinos de `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id de arnés | Backend típico                                  | Notas                                                                               |
| ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`    | Adaptador ACP de Claude Code                    | Requiere autenticación de Claude Code en el host.                                   |
| `codex`     | Adaptador ACP de Codex                          | Respaldo ACP explícito solo cuando `/codex` nativo no está disponible o se solicita ACP. |
| `copilot`   | Adaptador ACP de GitHub Copilot                 | Requiere autenticación de CLI/runtime de Copilot.                                   |
| `cursor`    | ACP de Cursor CLI (`cursor-agent acp`)          | Sobrescribe el comando acpx si una instalación local expone un punto de entrada ACP diferente. |
| `droid`     | Factory Droid CLI                               | Requiere autenticación de Factory/Droid o `FACTORY_API_KEY` en el entorno del arnés. |
| `gemini`    | Adaptador ACP de Gemini CLI                     | Requiere autenticación de Gemini CLI o configuración de clave de API.               |
| `iflow`     | iFlow CLI                                       | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kilocode`  | Kilo Code CLI                                   | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kimi`      | Kimi/Moonshot CLI                               | Requiere autenticación de Kimi/Moonshot en el host.                                 |
| `kiro`      | Kiro CLI                                        | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `opencode`  | Adaptador ACP de OpenCode                       | Requiere autenticación de CLI/proveedor de OpenCode.                                |
| `openclaw`  | Puente de OpenClaw Gateway mediante `openclaw acp` | Permite que un arnés compatible con ACP hable de vuelta con una sesión de OpenClaw Gateway. |
| `pi`        | Runtime integrado Pi/OpenClaw                   | Se usa para experimentos de arnés nativos de OpenClaw.                              |
| `qwen`      | Qwen Code / Qwen CLI                            | Requiere autenticación compatible con Qwen en el host.                              |

Los alias personalizados de agentes acpx pueden configurarse en el propio acpx, pero la política de OpenClaw
sigue comprobando `acp.allowedAgents` y cualquier
mapeo `agents.list[].runtime.acp.agent` antes del dispatch.

## Guía operativa

Flujo rápido de `/acp` desde el chat:

<Steps>
  <Step title="Generar">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, o explícitamente
    `/acp spawn codex --bind here`.
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
    - La generación crea o reanuda una sesión de runtime ACP, registra metadatos ACP en el almacén de sesiones de OpenClaw y puede crear una tarea en segundo plano cuando la ejecución pertenece al padre.
    - Las sesiones ACP que pertenecen al padre se tratan como trabajo en segundo plano incluso cuando la sesión de runtime es persistente; la finalización y la entrega entre superficies pasan por el notificador de tareas padre en lugar de comportarse como una sesión normal de chat orientada al usuario.
    - El mantenimiento de tareas cierra las sesiones ACP de una sola ejecución, terminales o huérfanas, que pertenecen al padre. Las sesiones ACP persistentes se conservan mientras permanezca una vinculación de conversación activa; las sesiones persistentes obsoletas sin una vinculación activa se cierran para que no puedan reanudarse silenciosamente después de que la tarea propietaria haya terminado o su registro de tarea haya desaparecido.
    - Los mensajes de seguimiento vinculados van directamente a la sesión ACP hasta que la vinculación se cierre, deje de estar enfocada, se restablezca o expire.
    - Los comandos de Gateway permanecen locales. `/acp ...`, `/status` y `/unfocus` nunca se envían como texto normal de prompt a un arnés ACP vinculado.
    - `cancel` aborta el turno activo cuando el backend admite cancelación; no elimina la vinculación ni los metadatos de sesión.
    - `close` finaliza la sesión ACP desde el punto de vista de OpenClaw y elimina la vinculación. Un arnés aún puede conservar su propio historial upstream si admite reanudación.
    - El plugin acpx limpia los árboles de procesos de wrapper y adaptador propiedad de OpenClaw después de `close`, y recolecta huérfanos ACPX obsoletos propiedad de OpenClaw durante el inicio del Gateway.
    - Los workers de runtime inactivos son elegibles para limpieza después de `acp.runtime.ttlMinutes`; los metadatos de sesión almacenados permanecen disponibles para `/acp sessions`.

  </Accordion>
  <Accordion title="Reglas de enrutamiento nativo de Codex">
    Disparadores en lenguaje natural que deberían enrutarse al **plugin nativo de Codex**
    cuando está habilitado:

    - "Vincula este canal de Discord a Codex."
    - "Adjunta este chat al hilo de Codex `<id>`."
    - "Muestra los hilos de Codex y luego vincula este."

    La vinculación de conversaciones nativa de Codex es la ruta predeterminada de control de chat.
    Las herramientas dinámicas de OpenClaw siguen ejecutándose a través de OpenClaw, mientras
    que las herramientas nativas de Codex, como shell/apply-patch, se ejecutan dentro de Codex.
    Para los eventos de herramientas nativas de Codex, OpenClaw inyecta un relé de hooks nativo
    por turno para que los hooks de plugins puedan bloquear `before_tool_call`, observar
    `after_tool_call` y enrutar los eventos `PermissionRequest` de Codex
    mediante las aprobaciones de OpenClaw. Los hooks `Stop` de Codex se retransmiten a
    `before_agent_finalize` de OpenClaw, donde los plugins pueden solicitar una pasada más
    del modelo antes de que Codex finalice su respuesta. El relé sigue siendo
    deliberadamente conservador: no modifica los argumentos de herramientas nativas de Codex
    ni reescribe los registros de hilos de Codex. Usa ACP explícito solo
    cuando quieras el modelo de runtime/sesión de ACP. El límite de soporte integrado de Codex
    está documentado en el
    [contrato de soporte de Codex harness v1](/es/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Guía rápida de selección de modelo / proveedor / runtime">
    - `openai-codex/*` - ruta de modelo heredada de OAuth/suscripción de Codex reparada por doctor.
    - `openai/*` - runtime integrado del servidor de aplicación nativo de Codex para turnos de agentes de OpenAI.
    - `/codex ...` - control de conversación nativo de Codex.
    - `/acp ...` o `runtime: "acp"` - control ACP/acpx explícito.

  </Accordion>
  <Accordion title="Disparadores en lenguaje natural para enrutamiento ACP">
    Disparadores que deberían enrutar al runtime de ACP:

    - "Ejecuta esto como una sesión única de ACP de Claude Code y resume el resultado."
    - "Usa Gemini CLI para esta tarea en un hilo y luego mantén los seguimientos en ese mismo hilo."
    - "Ejecuta Codex mediante ACP en un hilo en segundo plano."

    OpenClaw elige `runtime: "acp"`, resuelve el `agentId` del harness,
    se vincula a la conversación o hilo actual cuando es compatible y
    enruta los seguimientos a esa sesión hasta el cierre o la expiración. Codex solo
    sigue esta ruta cuando ACP/acpx es explícito o el plugin nativo de Codex
    no está disponible para la operación solicitada.

    Para `sessions_spawn`, `runtime: "acp"` se anuncia solo cuando ACP
    está habilitado, el solicitante no está en sandbox y hay cargado un backend
    de runtime ACP. `acp.dispatch.enabled=false` pausa el despacho automático
    de hilos ACP, pero no oculta ni bloquea llamadas explícitas a
    `sessions_spawn({ runtime: "acp" })`. Apunta a ids de harness ACP como `codex`,
    `claude`, `droid`, `gemini` u `opencode`. No pases un id de agente normal de
    la configuración de OpenClaw desde `agents_list` a menos que esa entrada esté
    configurada explícitamente con `agents.list[].runtime.type="acp"`;
    en caso contrario, usa el runtime de subagente predeterminado. Cuando un agente de OpenClaw
    está configurado con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` como el id de harness subyacente.

  </Accordion>
</AccordionGroup>

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de harness externo. Usa el **servidor de aplicación nativo de Codex**
para la vinculación/control de conversaciones de Codex cuando el plugin `codex`
esté habilitado. Usa **subagentes** cuando quieras ejecuciones delegadas
nativas de OpenClaw.

| Área                | Sesión ACP                            | Ejecución de subagente             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin de backend ACP (por ejemplo acpx) | Runtime de subagente nativo de OpenClaw |
| Clave de sesión | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principales | `/acp ...`                            | `/subagents ...`                   |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predeterminado) |

Consulta también [Subagentes](/es/tools/subagents).

## Cómo ACP ejecuta Claude Code

Para Claude Code mediante ACP, la pila es:

1. Plano de control de sesiones ACP de OpenClaw.
2. Plugin de runtime oficial `@openclaw/acpx`.
3. Adaptador ACP de Claude.
4. Maquinaria de runtime/sesión del lado de Claude.

ACP Claude es una **sesión de harness** con controles ACP, reanudación de sesión,
seguimiento de tareas en segundo plano y vinculación opcional de conversación/hilo.

Los backends de CLI son runtimes locales de reserva solo de texto independientes; consulta
[Backends de CLI](/es/gateway/cli-backends).

Para los operadores, la regla práctica es:

- **¿Quieres `/acp spawn`, sesiones vinculables, controles de runtime o trabajo persistente de harness?** Usa ACP.
- **¿Quieres una reserva simple de texto local mediante la CLI sin procesar?** Usa backends de CLI.

## Sesiones vinculadas

### Modelo mental

- **Superficie de chat** - donde las personas siguen hablando (canal de Discord, tema de Telegram, chat de iMessage).
- **Sesión ACP** - el estado durable del runtime de Codex/Claude/Gemini al que OpenClaw enruta.
- **Hilo/tema hijo** - una superficie de mensajería adicional opcional creada solo por `--thread ...`.
- **Espacio de trabajo del runtime** - la ubicación del sistema de archivos (`cwd`, checkout del repositorio, espacio de trabajo del backend) donde se ejecuta el harness. Independiente de la superficie de chat.

### Vinculaciones de conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la
sesión ACP creada: sin hilo hijo, misma superficie de chat. OpenClaw sigue
poseyendo transporte, autenticación, seguridad y entrega. Los mensajes de seguimiento en esa
conversación se enrutan a la misma sesión; `/new` y `/reset` restablecen la
sesión in situ; `/acp close` elimina la vinculación.

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
    - En Discord, `spawnSessions` controla la creación de hilos hijo para `--thread auto|here`, no para `--bind here`.
    - Si creas una sesión en un agente ACP distinto sin `--cwd`, OpenClaw hereda de forma predeterminada el espacio de trabajo del **agente de destino**. Las rutas heredadas que faltan (`ENOENT`/`ENOTDIR`) vuelven al valor predeterminado del backend; otros errores de acceso (por ejemplo, `EACCES`) aparecen como errores de creación.
    - Los comandos de administración del Gateway permanecen locales en conversaciones vinculadas: los comandos `/acp ...` los maneja OpenClaw incluso cuando el texto normal de seguimiento se enruta a la sesión ACP vinculada; `/status` y `/unfocus` también permanecen locales siempre que el manejo de comandos esté habilitado para esa superficie.

  </Accordion>
  <Accordion title="Sesiones vinculadas a hilos">
    Cuando las vinculaciones de hilos están habilitadas para un adaptador de canal:

    - OpenClaw vincula un hilo a una sesión ACP de destino.
    - Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
    - La salida de ACP se entrega de vuelta al mismo hilo.
    - Desenfocar/cerrar/archivar/tiempo de inactividad agotado o expiración por edad máxima elimina la vinculación.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` y `/unfocus` son comandos del Gateway, no prompts para el harness ACP.

    Indicadores de características requeridos para ACP vinculado a hilos:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` está activado de forma predeterminada (configúralo en `false` para pausar el despacho automático de hilos ACP; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando).
    - Creación de sesiones de hilo del adaptador de canal habilitada (valor predeterminado: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    La compatibilidad con vinculación de hilos es específica del adaptador. Si el adaptador de canal activo
    no admite vinculaciones de hilos, OpenClaw devuelve un mensaje claro
    de no compatibilidad/no disponibilidad.

  </Accordion>
  <Accordion title="Canales compatibles con hilos">
    - Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
    - Compatibilidad integrada actual: hilos/canales de **Discord**, temas de **Telegram** (temas de foro en grupos/supergrupos y temas de DM).
    - Los canales de plugins pueden agregar compatibilidad mediante la misma interfaz de vinculación.

  </Accordion>
</AccordionGroup>

## Vinculaciones persistentes de canales

Para flujos de trabajo no efímeros, configura vinculaciones ACP persistentes en
entradas `bindings[]` de nivel superior.

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
  Sobrescritura ACP opcional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etiqueta opcional orientada al operador.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directorio de trabajo opcional del runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Sobrescritura opcional de backend.
</ParamField>

### Valores predeterminados de runtime por agente

Usa `agents.list[].runtime` para definir los valores predeterminados de ACP una vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de harness, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedencia de sobrescritura para sesiones vinculadas ACP:**

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
- Los mensajes de ese canal o tema se enrutan a la sesión ACP configurada.
- En conversaciones vinculadas, `/new` y `/reset` restablecen la misma clave de sesión ACP en el lugar.
- Las vinculaciones temporales en tiempo de ejecución (por ejemplo, las creadas por flujos de enfoque en hilo) siguen aplicándose donde estén presentes.
- Para creaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas heredadas de espacio de trabajo que faltan vuelven al cwd predeterminado del backend; los fallos de acceso no debidos a ausencia se muestran como errores de creación.

## Iniciar sesiones ACP

Dos formas de iniciar una sesión ACP:

<Tabs>
  <Tab title="Desde sessions_spawn">
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
    `runtime` usa `subagent` de forma predeterminada, así que establece `runtime: "acp"` explícitamente
    para sesiones ACP. Si se omite `agentId`, OpenClaw usa
    `acp.defaultAgent` cuando está configurado. `mode: "session"` requiere
    `thread: true` para mantener una conversación vinculada persistente.
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

    Flags clave:

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
  Instrucción inicial enviada a la sesión ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Debe ser `"acp"` para sesiones ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id del arnés ACP de destino. Recurre a `acp.defaultAgent` si está definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita el flujo de vinculación de hilo donde sea compatible.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` es de una sola ejecución; `"session"` es persistente. Si `thread: true` y
  se omite `mode`, OpenClaw puede usar de forma predeterminada el comportamiento persistente según
  la ruta del entorno de ejecución. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo de entorno de ejecución solicitado (validado por la política
  del backend/entorno de ejecución). Si se omite, la creación ACP hereda el espacio
  de trabajo del agente de destino cuando está configurado; las rutas heredadas que
  faltan recurren a los valores predeterminados del backend, mientras que los errores
  de acceso reales se devuelven.
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
  (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver todo el historial de retransmisión.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Aborta el turno ACP hijo después de N segundos. `0` mantiene el turno en la
  ruta sin tiempo de espera del Gateway. El mismo valor se aplica a la ejecución del Gateway
  y al entorno de ejecución ACP para que los arneses detenidos o con cuota agotada no
  ocupen indefinidamente el carril del agente padre.
</ParamField>
<ParamField path="model" type="string">
  Sobrescritura explícita del modelo para la sesión ACP hija. Las creaciones ACP de Codex
  normalizan referencias de OpenClaw Codex como `openai-codex/gpt-5.4` a la configuración
  de inicio ACP de Codex antes de `session/new`; las formas slash como
  `openai-codex/gpt-5.4/high` también establecen el esfuerzo de razonamiento ACP de Codex.
  Otros arneses deben anunciar `models` de ACP y admitir
  `session/set_model`; de lo contrario, OpenClaw/acpx falla claramente en lugar de
  volver silenciosamente al valor predeterminado del agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esfuerzo explícito de pensamiento/razonamiento. Para Codex ACP, `minimal` se asigna a
  esfuerzo bajo, `low`/`medium`/`high`/`xhigh` se asignan directamente, y `off`
  omite la sobrescritura de inicio de esfuerzo de razonamiento.
</ParamField>

## Modos de vinculación y de hilo al crear sesiones

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamiento                                                        |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Vincula la conversación activa actual en el lugar; falla si no hay ninguna activa. |
    | `off`  | No crea una vinculación de conversación actual.                       |

    Notas:

    - `--bind here` es la ruta de operador más simple para "hacer que este canal o chat esté respaldado por Codex."
    - `--bind here` no crea un hilo hijo.
    - `--bind here` solo está disponible en canales que exponen compatibilidad con vinculación de conversación actual.
    - `--bind` y `--thread` no se pueden combinar en la misma llamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamiento                                                                                       |
    | ------ | ---------------------------------------------------------------------------------------------------- |
    | `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo hijo cuando sea compatible. |
    | `here` | Requiere el hilo activo actual; falla si no estás en uno.                                            |
    | `off`  | Sin vinculación. La sesión empieza sin vincular.                                                     |

    Notas:

    - En superficies de vinculación sin hilos, el comportamiento predeterminado es efectivamente `off`.
    - La creación vinculada a hilo requiere compatibilidad con la política del canal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo hijo.

  </Tab>
</Tabs>

## Modelo de entrega

Las sesiones ACP pueden ser espacios de trabajo interactivos o trabajo
en segundo plano propiedad del padre. La ruta de entrega depende de esa forma.

<AccordionGroup>
  <Accordion title="Sesiones ACP interactivas">
    Las sesiones interactivas están pensadas para seguir conversando en una superficie
    de chat visible:

    - `/acp spawn ... --bind here` vincula la conversación actual a la sesión ACP.
    - `/acp spawn ... --thread ...` vincula un hilo/tema de canal a la sesión ACP.
    - Las `bindings[].type="acp"` persistentes configuradas enrutan las conversaciones coincidentes a la misma sesión ACP.

    Los mensajes de seguimiento en la conversación vinculada se enrutan directamente a la
    sesión ACP, y la salida ACP se entrega de vuelta a ese mismo
    canal/hilo/tema.

    Lo que OpenClaw envía al arnés:

    - Los seguimientos vinculados normales se envían como texto de instrucción, además de adjuntos solo cuando el arnés/backend los admite.
    - Los comandos de gestión `/acp` y los comandos locales del Gateway se interceptan antes del despacho ACP.
    - Los eventos de finalización generados en tiempo de ejecución se materializan por destino. Los agentes OpenClaw reciben el sobre de contexto de entorno de ejecución interno de OpenClaw; los arneses ACP externos reciben una instrucción simple con el resultado hijo y la instrucción. El sobre sin procesar `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca debe enviarse a arneses externos ni persistirse como texto de transcripción de usuario ACP.
    - Las entradas de transcripción ACP usan el texto de activación visible para el usuario o la instrucción simple de finalización. Los metadatos internos de eventos permanecen estructurados en OpenClaw cuando es posible y no se tratan como contenido de chat escrito por el usuario.

  </Accordion>
  <Accordion title="Sesiones ACP de una sola ejecución propiedad del padre">
    Las sesiones ACP de una sola ejecución creadas por otra ejecución de agente son
    hijas en segundo plano, similares a subagentes:

    - El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - El hijo se ejecuta en su propia sesión de arnés ACP.
    - Los turnos hijos se ejecutan en el mismo carril en segundo plano que usan las creaciones nativas de subagentes, así que un arnés ACP lento no bloquea trabajo no relacionado de la sesión principal.
    - La finalización informa de vuelta mediante la ruta de anuncio de finalización de tarea. OpenClaw convierte los metadatos internos de finalización en una instrucción ACP simple antes de enviarla a un arnés externo, para que los arneses no vean marcadores de contexto de entorno de ejecución exclusivos de OpenClaw.
    - El padre reescribe el resultado hijo con voz normal de asistente cuando es útil una respuesta visible para el usuario.

    **No** trates esta ruta como un chat de igual a igual entre padre
    e hijo. El hijo ya tiene un canal de finalización de vuelta al
    padre.

  </Accordion>
  <Accordion title="sessions_send y entrega A2A">
    `sessions_send` puede apuntar a otra sesión después de la creación. Para sesiones
    pares normales, OpenClaw usa una ruta de seguimiento agente a agente (A2A)
    después de inyectar el mensaje:

    - Espera la respuesta de la sesión de destino.
    - Opcionalmente permite que el solicitante y el destino intercambien una cantidad limitada de turnos de seguimiento.
    - Pide al destino que produzca un mensaje de anuncio.
    - Entrega ese anuncio al canal o hilo visible.

    Esa ruta A2A es una alternativa para envíos entre pares donde el remitente necesita un
    seguimiento visible. Permanece habilitada cuando una sesión no relacionada puede
    ver y enviar mensajes a un destino ACP, por ejemplo bajo configuraciones amplias de
    `tools.sessions.visibility`.

    OpenClaw omite el seguimiento A2A solo cuando el solicitante es el
    padre de su propio hijo ACP de una sola ejecución propiedad del padre. En ese caso,
    ejecutar A2A encima de la finalización de tarea puede activar al padre con el
    resultado del hijo, reenviar la respuesta del padre al hijo y
    crear un bucle de eco padre/hijo. El resultado de `sessions_send` informa
    `delivery.status="skipped"` para ese caso de hijo propio porque la
    ruta de finalización ya es responsable del resultado.

  </Accordion>
  <Accordion title="Reanudar una sesión existente">
    Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de
    empezar de cero. El agente reproduce su historial de conversación mediante
    `session/load`, así que retoma con todo el contexto de lo anterior.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comunes:

    - Transferir una sesión Codex de tu portátil a tu teléfono: dile a tu agente que retome donde lo dejaste.
    - Continuar una sesión de programación que iniciaste de forma interactiva en la CLI, ahora sin interfaz mediante tu agente.
    - Retomar trabajo que fue interrumpido por un reinicio de Gateway o un tiempo de espera por inactividad.

    Notas:

    - `resumeSessionId` solo se aplica cuando `runtime: "acp"`; el entorno de ejecución de subagente predeterminado ignora este campo exclusivo de ACP.
    - `streamTo` solo se aplica cuando `runtime: "acp"`; el entorno de ejecución de subagente predeterminado ignora este campo exclusivo de ACP.
    - `resumeSessionId` es un id de reanudación ACP/de arnés local del host, no una clave de sesión de canal de OpenClaw; OpenClaw sigue comprobando la política de creación ACP y la política del agente de destino antes del despacho, mientras que el backend ACP o el arnés poseen la autorización para cargar ese id ascendente.
    - `resumeSessionId` restaura el historial de conversación ACP ascendente; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión OpenClaw que estás creando, así que `mode: "session"` sigue requiriendo `thread: true`.
    - El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
    - Si no se encuentra el id de sesión, la creación falla con un error claro: no hay retorno silencioso a una sesión nueva.

  </Accordion>
  <Accordion title="Prueba de humo posterior al despliegue">
    Después de un despliegue de Gateway, ejecuta una comprobación integral en vivo en lugar de
    confiar en las pruebas unitarias:

    1. Verifica la versión y el commit del Gateway desplegado en el host de destino.
    2. Abre una sesión temporal de puente ACPX hacia un agente en vivo.
    3. Pide a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` real y ningún error del validador.
    5. Limpia la sesión temporal de puente.

    Mantén la compuerta en `mode: "run"` y omite `streamTo: "parent"`:
    `mode: "session"` enlazado al hilo y las rutas de retransmisión de flujo son pasadas
    de integración más completas e independientes.

  </Accordion>
</AccordionGroup>

## Compatibilidad con sandbox

Actualmente, las sesiones ACP se ejecutan en el runtime del host, **no** dentro del
sandbox de OpenClaw.

<Warning>
**Límite de seguridad:**

- El arnés externo puede leer/escribir según sus propios permisos de CLI y el `cwd` seleccionado.
- La política de sandbox de OpenClaw **no** envuelve la ejecución del arnés ACP.
- OpenClaw sigue aplicando las compuertas de funciones ACP, los agentes permitidos, la propiedad de sesión, las vinculaciones de canal y la política de entrega del Gateway.
- Usa `runtime: "subagent"` para trabajo nativo de OpenClaw con sandbox aplicado.

</Warning>

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, los spawns ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.

## Resolución del destino de sesión

La mayoría de las acciones `/acp` aceptan un destino de sesión opcional (`session-key`,
`session-id` o `session-label`).

**Orden de resolución:**

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - prueba la clave
   - luego el id de sesión con forma de UUID
   - luego la etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculado a una sesión ACP).
3. Repliegue a la sesión solicitante actual.

Tanto las vinculaciones de la conversación actual como las vinculaciones de hilo participan en
el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | Qué hace                                                    | Ejemplo                                                       |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación actual o de hilo opcional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso para la sesión de destino.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de dirección a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula los destinos de hilo.         | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de runtime y capacidades. | `/acp status`                                             |
| `/acp set-mode`      | Establece el modo de runtime para la sesión de destino.     | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opción de configuración de runtime.   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la anulación del directorio de trabajo del runtime. | `/acp cwd /Users/user/Projects/repo`                        |
| `/acp permissions`   | Establece el perfil de política de aprobación.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del runtime (segundos).       | `/acp timeout 120`                                            |
| `/acp model`         | Establece la anulación del modelo de runtime.               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las anulaciones de opciones de runtime de la sesión. | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sesiones ACP recientes desde el almacén.              | `/acp sessions`                                               |
| `/acp doctor`        | Estado del backend, capacidades y correcciones accionables. | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación.  | `/acp install`                                                |

`/acp status` muestra las opciones efectivas de runtime más los identificadores de sesión de nivel de runtime y
de nivel de backend. Los errores de control no admitido aparecen
claramente cuando un backend carece de una capacidad. `/acp sessions` lee el
almacén para la sesión vinculada actual o la sesión solicitante; los tokens de destino
(`session-key`, `session-id` o `session-label`) se resuelven mediante
el descubrimiento de sesiones del Gateway, incluidas las raíces `session.store`
personalizadas por agente.

### Asignación de opciones de runtime

`/acp` tiene comandos de conveniencia y un setter genérico. Operaciones
equivalentes:

| Comando                      | Se asigna a                          | Notas                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | clave de configuración de runtime `model` | Para Codex ACP, OpenClaw normaliza `openai-codex/<model>` al id de modelo del adaptador y asigna sufijos de razonamiento con barra como `openai-codex/gpt-5.4/high` a `reasoning_effort`. |
| `/acp set thinking <level>`  | clave de configuración de runtime `thinking` | Para Codex ACP, OpenClaw envía el `reasoning_effort` correspondiente donde el adaptador admite uno.                                                                          |
| `/acp permissions <profile>` | clave de configuración de runtime `approval_policy` | -                                                                                                                                                                      |
| `/acp timeout <seconds>`     | clave de configuración de runtime `timeout` | -                                                                                                                                                                      |
| `/acp cwd <path>`            | anulación de cwd del runtime         | Actualización directa.                                                                                                                                                        |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa la ruta de anulación de cwd.                                                                                                                                     |
| `/acp reset-options`         | borra todas las anulaciones de runtime | -                                                                                                                                                                            |

## Arnés acpx, configuración de Plugin y permisos

Para la configuración del arnés acpx (alias de Claude Code / Codex / Gemini CLI),
los puentes MCP de plugin-tools y OpenClaw-tools, y los modos de permisos
ACP, consulta
[Agentes ACP: configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                     | Causa probable                                                                                                         | Solución                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Falta el Plugin de backend, está deshabilitado o está bloqueado por `plugins.allow`.                                                       | Instala y habilita el Plugin de backend, incluye `acpx` en `plugins.allow` cuando esa lista de permitidos esté configurada, luego ejecuta `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP está deshabilitado globalmente.                                                                                                 | Configura `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | El envío automático desde mensajes de hilo normales está deshabilitado.                                                               | Configura `acp.dispatch.enabled=true` para reanudar el enrutamiento automático de hilos; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | El agente no está en la lista de permitidos.                                                                                                | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Falta el Plugin de backend, está deshabilitado, está bloqueado por una política de permiso/denegación o su ejecutable configurado no está disponible.        | Instala/habilita el Plugin de backend, vuelve a ejecutar `/acp doctor` e inspecciona el error de instalación o de política del backend si sigue sin estar sano.                                           |
| Harness command not found                                                   | La CLI del adaptador no está instalada, falta el Plugin externo o la obtención inicial de `npx` falló para un adaptador que no es Codex. | Ejecuta `/acp doctor`, instala/precalienta el adaptador en el host del Gateway o configura explícitamente el comando del agente acpx.                                                      |
| Model-not-found from the harness                                            | El id de modelo es válido para otro proveedor/harness, pero no para este destino ACP.                                                | Usa un modelo listado por ese harness, configura el modelo en el harness u omite la sobrescritura.                                                                            |
| Vendor auth error from the harness                                          | OpenClaw está sano, pero no se ha iniciado sesión en la CLI/proveedor de destino.                                                     | Inicia sesión o proporciona la clave de proveedor requerida en el entorno del host del Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token de clave/id/etiqueta incorrecto.                                                                                                | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | Se usó `--bind here` sin una conversación activa vinculable.                                                            | Ve al chat/canal de destino y vuelve a intentarlo, o usa una generación sin vincular.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | El adaptador carece de capacidad de vinculación ACP para la conversación actual.                                                             | Usa `/acp spawn ... --thread ...` donde sea compatible, configura `bindings[]` de nivel superior o cambia a un canal compatible.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | Se usó `--thread here` fuera de un contexto de hilo.                                                                         | Ve al hilo de destino o usa `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Otro usuario es propietario del destino de vinculación activo.                                                                           | Vuelve a vincular como propietario o usa otra conversación o hilo.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | El adaptador carece de capacidad de vinculación de hilos.                                                                               | Usa `--thread off` o cambia a un adaptador/canal compatible.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | El runtime ACP está del lado del host; la sesión solicitante está en sandbox.                                                              | Usa `runtime="subagent"` desde sesiones en sandbox o ejecuta la generación ACP desde una sesión sin sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Se solicitó `sandbox="require"` para el runtime ACP.                                                                         | Usa `runtime="subagent"` para exigir sandbox, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | El harness de destino no expone cambio genérico de modelo ACP.                                                        | Usa un harness que anuncie `models`/`session/set_model` de ACP, usa refs de modelo ACP de Codex o configura el modelo directamente en el harness si tiene su propia opción de inicio. |
| Missing ACP metadata for bound session                                      | Metadatos de sesión ACP obsoletos/eliminados.                                                                                    | Vuelve a crear con `/acp spawn`, luego vuelve a vincular/enfocar el hilo.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloquea escrituras/exec en una sesión ACP no interactiva.                                                    | Configura `plugins.entries.acpx.config.permissionMode` como `approve-all` y reinicia el gateway. Consulta [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Los prompts de permiso están bloqueados por `permissionMode`/`nonInteractivePermissions`.                                        | Revisa los logs del gateway para `AcpRuntimeError`. Para permisos completos, configura `permissionMode=approve-all`; para una degradación correcta, configura `nonInteractivePermissions=deny`.        |
| ACP session stalls indefinitely after completing work                       | El proceso del harness terminó, pero la sesión ACP no informó la finalización.                                                    | Actualiza OpenClaw; la limpieza actual de acpx elimina los procesos obsoletos de envoltorio y adaptador propiedad de OpenClaw al cerrar y al iniciar el Gateway.                                             |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | La envoltura de evento interna se filtró a través del límite ACP.                                                                | Actualiza OpenClaw y vuelve a ejecutar el flujo de finalización; los harnesses externos deberían recibir solo prompts de finalización sin formato.                                                          |

## Relacionado

- [Agentes ACP: configuración](/es/tools/acp-agents-setup)
- [Envío de agente](/es/tools/agent-send)
- [Backends de CLI](/es/gateway/cli-backends)
- [Harness de Codex](/es/plugins/codex-harness)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo puente)](/es/cli/acp)
- [Subagentes](/es/tools/subagents)
