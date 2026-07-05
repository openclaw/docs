---
read_when:
    - Ejecución de arneses de codificación mediante ACP
    - Configuración de sesiones ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de canal de mensajes a una sesión ACP persistente
    - Solución de problemas del backend ACP, el cableado de plugins o la entrega de finalizaciones
    - Operar comandos /acp desde el chat
sidebarTitle: ACP agents
summary: Ejecuta arneses de codificación externos (Claude Code, Cursor, Gemini CLI, ACP explícito de Codex, ACP de OpenClaw, OpenCode) a través del backend de ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-07-05T11:45:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permiten que
OpenClaw ejecute arneses de codificación externos (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI y otros arneses ACPX compatibles)
mediante un plugin de backend ACP. Cada creación se rastrea como una
[tarea en segundo plano](/es/automation/tasks).

<Note>
**ACP es la ruta de arneses externos, no la ruta predeterminada de Codex.** El plugin
nativo de servidor de aplicaciones de Codex posee los controles `/codex ...` y el runtime
incrustado predeterminado `openai/gpt-*` para turnos de agente; ACP posee los controles
`/acp ...` y las sesiones `sessions_spawn({ runtime: "acp" })`.

Para permitir que Codex o Claude Code se conecten como cliente MCP externo directamente a
conversaciones existentes de canales de OpenClaw, usa
[`openclaw mcp serve`](/es/cli/mcp) en lugar de ACP.
</Note>

## ¿Qué página necesito?

| Quieres...                                                                                      | Usa esto                              | Notas                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular o controlar Codex en la conversación actual                                            | `/codex bind`, `/codex threads`       | Ruta nativa del servidor de aplicaciones de Codex cuando el plugin `codex` está habilitado: respuestas de chat vinculadas, reenvío de imágenes, modelo/rápido/permisos, detener y dirigir. ACP es una alternativa explícita |
| Ejecutar Claude Code, Gemini CLI, Codex ACP explícito u otro arnés externo _a través de_ OpenClaw | Esta página                           | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime                                             |
| Exponer una sesión de OpenClaw Gateway _como_ servidor ACP para un editor o cliente             | [`openclaw acp`](/es/cli/acp)            | Modo puente: un IDE/cliente habla ACP con OpenClaw mediante stdio/WebSocket                                                                                                  |
| Reutilizar una CLI local de IA como modelo alternativo solo de texto                            | [Backends de CLI](/es/gateway/cli-backends) | No es ACP: sin herramientas de OpenClaw, sin controles ACP, sin runtime de arnés                                                                                             |

## ¿Funciona directamente?

Sí, después de instalar el plugin oficial de runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los checkouts de código fuente pueden usar el plugin local del espacio de trabajo
`extensions/acpx` después de `pnpm install`. Ejecuta `/acp doctor` para una
comprobación de preparación.

OpenClaw solo enseña a los agentes sobre la creación con ACP cuando ACP es **realmente utilizable**:
ACP debe estar habilitado, el despacho no debe estar deshabilitado, la sesión actual no debe estar
bloqueada por el sandbox y un backend de runtime debe estar cargado y sano. Si
alguna condición falla, las Skills de ACP y la guía ACP de `sessions_spawn` permanecen ocultas
para que el agente no sugiera un backend no disponible.

<AccordionGroup>
  <Accordion title="Problemas comunes en la primera ejecución">
    - Si `plugins.allow` está definido, es un inventario restrictivo de plugins y **debe** incluir `acpx`, o el backend ACP instalado queda bloqueado intencionalmente (`/acp doctor` informa la entrada faltante en la lista de permitidos).
    - El adaptador ACP de Codex se distribuye con el plugin `acpx` y se inicia localmente cuando es posible.
    - Codex ACP se ejecuta con un `CODEX_HOME` aislado. OpenClaw copia las entradas de confianza de proyecto confiables más la configuración segura de enrutamiento de modelo/proveedor (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` y campos seguros `model_providers.<name>`) desde la configuración de Codex del host; la autenticación, las notificaciones y los hooks permanecen solo en la configuración del host.
    - Otros adaptadores de arneses de destino pueden obtenerse bajo demanda con `npx` en el primer uso.
    - La autenticación del proveedor ya debe existir en el host para ese arnés.
    - Si el host no tiene npm ni acceso a la red, las obtenciones de adaptadores en la primera ejecución fallan hasta que las cachés se precalientan o el adaptador se instala de otra manera.

  </Accordion>
  <Accordion title="Requisitos previos del runtime">
    ACP inicia un proceso real de arnés externo. OpenClaw posee el enrutamiento,
    el estado de tareas en segundo plano, la entrega, las vinculaciones y la política; el arnés posee
    su inicio de sesión del proveedor, catálogo de modelos, comportamiento del sistema de archivos y herramientas nativas.

    Antes de culpar a OpenClaw, verifica:

    - `/acp doctor` informa un backend habilitado y sano.
    - El id de destino está permitido por `acp.allowedAgents` cuando esa lista de permitidos está definida.
    - El comando del arnés puede iniciarse en el host de Gateway.
    - La autenticación del proveedor está presente para ese arnés (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - El modelo seleccionado existe para ese arnés; los ids de modelo no son portables entre arneses.
    - El `cwd` solicitado existe y es accesible, u omite `cwd` y deja que el backend use su valor predeterminado.
    - El modo de permisos coincide con el trabajo. Las sesiones no interactivas no pueden hacer clic en prompts de permisos nativos, por lo que las ejecuciones de codificación con mucha escritura/ejecución suelen necesitar un perfil de permisos ACPX que pueda continuar sin interfaz.

  </Accordion>
</AccordionGroup>

Las herramientas de plugins de OpenClaw y las herramientas integradas de OpenClaw **no** se exponen a los
arneses ACP de forma predeterminada. Habilita los puentes MCP explícitos en
[Agentes ACP: configuración](/es/tools/acp-agents-setup) solo cuando el arnés deba
llamar a esas herramientas directamente.

## Destinos de arnés compatibles

Con el backend `acpx`, usa estos ids como destinos de `/acp spawn <id>` o
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id de arnés | Backend típico                                | Notas                                                                               |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`     | Adaptador ACP de Claude Code                  | Requiere autenticación de Claude Code en el host.                                   |
| `codex`      | Adaptador ACP de Codex                        | Alternativa ACP explícita solo cuando `/codex` nativo no está disponible o se solicita ACP. |
| `copilot`    | Adaptador ACP de GitHub Copilot               | Requiere autenticación de Copilot CLI/runtime.                                      |
| `cursor`     | ACP de Cursor CLI (`cursor-agent acp`)        | Sobrescribe el comando de acpx si una instalación local expone un punto de entrada ACP distinto. |
| `droid`      | Factory Droid CLI                             | Requiere autenticación de Factory/Droid o `FACTORY_API_KEY` en el entorno del arnés. |
| `fast-agent` | Adaptador ACP de fast-agent-mcp               | Se obtiene bajo demanda con `uvx`.                                                  |
| `gemini`     | Adaptador ACP de Gemini CLI                   | Requiere autenticación de Gemini CLI o configuración de clave de API.               |
| `iflow`      | iFlow CLI                                     | La disponibilidad del adaptador y el control de modelo dependen de la CLI instalada. |
| `kilocode`   | Kilo Code CLI                                 | La disponibilidad del adaptador y el control de modelo dependen de la CLI instalada. |
| `kimi`       | Kimi/Moonshot CLI                             | Requiere autenticación de Kimi/Moonshot en el host.                                 |
| `kiro`       | Kiro CLI                                      | La disponibilidad del adaptador y el control de modelo dependen de la CLI instalada. |
| `mux`        | Adaptador ACP de Mux CLI                      | Se obtiene bajo demanda con `npx`.                                                  |
| `opencode`   | Adaptador ACP de OpenCode                     | Requiere autenticación de OpenCode CLI/proveedor.                                   |
| `openclaw`   | Puente de OpenClaw Gateway mediante `openclaw acp` | Permite que un arnés compatible con ACP hable de vuelta con una sesión de OpenClaw Gateway. |
| `qoder`      | Qoder CLI                                     | La disponibilidad del adaptador y el control de modelo dependen de la CLI instalada. |
| `qwen`       | Qwen Code / Qwen CLI                          | Requiere autenticación compatible con Qwen en el host.                              |
| `trae`       | Adaptador ACP de Trae CLI                     | La disponibilidad del adaptador y el control de modelo dependen de la CLI instalada. |

`pi` (pi-acp) también está registrado en el backend acpx, pero no es un arnés de codificación
en el mismo sentido que los anteriores.

Los alias de agentes acpx personalizados pueden configurarse en acpx, pero la política de OpenClaw
sigue comprobando `acp.allowedAgents` y cualquier asignación
`agents.list[].runtime.acp.agent` antes del despacho.

## Manual operativo

Flujo rápido de `/acp` desde el chat:

<Steps>
  <Step title="Crear">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, o
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
    `/acp model <provider/model>`, `/acp permissions <profile>`,
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
    - La creación crea o reanuda una sesión de runtime ACP, registra metadatos ACP en el almacén de sesiones de OpenClaw y puede crear una tarea en segundo plano cuando la ejecución pertenece al padre.
    - Las sesiones ACP pertenecientes al padre se tratan como trabajo en segundo plano incluso cuando la sesión de runtime es persistente; la finalización y la entrega entre superficies pasan por el notificador de la tarea padre en lugar de actuar como una sesión de chat normal orientada al usuario.
    - El mantenimiento de tareas cierra sesiones ACP terminales o huérfanas de un solo uso pertenecientes al padre. Las sesiones ACP persistentes se conservan mientras permanezca una vinculación de conversación activa; las sesiones persistentes obsoletas sin una vinculación activa se cierran para que no puedan reanudarse silenciosamente después de que la tarea propietaria haya terminado o su registro de tarea haya desaparecido.
    - Los mensajes de seguimiento vinculados van directamente a la sesión ACP hasta que la vinculación se cierre, pierda el foco, se restablezca o caduque.
    - Los comandos de Gateway permanecen locales. `/acp ...`, `/status` y `/unfocus` nunca se envían como texto de prompt normal a un arnés ACP vinculado.
    - `cancel` aborta el turno activo cuando el backend admite cancelación; no elimina la vinculación ni los metadatos de sesión.
    - `close` finaliza la sesión ACP desde el punto de vista de OpenClaw y elimina la vinculación. Un arnés aún puede conservar su propio historial ascendente si admite reanudación.
    - El plugin acpx limpia los árboles de procesos de wrappers y adaptadores propiedad de OpenClaw después de `close`, y recolecta huérfanos ACPX obsoletos propiedad de OpenClaw durante el inicio de Gateway.
    - Los trabajadores de runtime inactivos son aptos para limpieza después de `acp.runtime.ttlMinutes`; los metadatos de sesión almacenados siguen disponibles para `/acp sessions`.

  </Accordion>
  <Accordion title="Reglas de enrutamiento nativo de Codex">
    Disparadores en lenguaje natural que deben enrutarse al **plugin nativo de Codex**
    cuando está habilitado:

    - "Vincula este canal de Discord a Codex."
    - "Adjunta este chat al hilo `<id>` de Codex."
    - "Muestra los hilos de Codex y luego vincula este."

    La vinculación de conversaciones nativa de Codex es la ruta predeterminada de control de chat.
    Las herramientas dinámicas de OpenClaw siguen ejecutándose a través de OpenClaw, mientras que las herramientas nativas de Codex
    como shell/apply-patch se ejecutan dentro de Codex. Para eventos de herramientas nativas de Codex,
    OpenClaw inyecta un relé de hooks nativos por turno para que los hooks de plugins
    puedan bloquear `before_tool_call`, observar `after_tool_call` y enrutar eventos
    `PermissionRequest` de Codex mediante las aprobaciones de OpenClaw. Los hooks `Stop` de Codex
    se retransmiten a `before_agent_finalize` de OpenClaw, donde los plugins pueden solicitar
    una pasada más del modelo antes de que Codex finalice su respuesta. El relé se mantiene
    deliberadamente conservador: no muta los argumentos de herramientas nativas de Codex
    ni reescribe registros de hilos de Codex. Usa ACP explícito solo cuando quieras el
    modelo de runtime/sesión de ACP. El límite de soporte de Codex integrado está
    documentado en el
    [contrato de soporte de Codex harness v1](/es/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Hoja de referencia rápida de selección de modelo / proveedor / runtime">
    - refs de modelo Codex heredadas - ruta heredada de modelo OAuth/suscripción de Codex reparada por doctor.
    - `openai/*` - runtime integrado del servidor de aplicaciones nativo de Codex para turnos de agente OpenAI.
    - `/codex ...` - control de conversación nativo de Codex.
    - `/acp ...` o `runtime: "acp"` - control ACP/acpx explícito.

  </Accordion>
  <Accordion title="Disparadores de lenguaje natural para enrutamiento ACP">
    Disparadores que deben enrutarse al runtime ACP:

    - "Ejecuta esto como una sesión ACP de Claude Code de una sola ejecución y resume el resultado."
    - "Usa Gemini CLI para esta tarea en un hilo y luego conserva los seguimientos en ese mismo hilo."
    - "Ejecuta Codex mediante ACP en un hilo en segundo plano."

    OpenClaw elige `runtime: "acp"`, resuelve el `agentId` del harness, se vincula a
    la conversación o hilo actual cuando es compatible y enruta los seguimientos
    a esa sesión hasta el cierre o la expiración. Codex solo sigue esta ruta cuando
    ACP/acpx es explícito o el plugin nativo de Codex no está disponible para la
    operación solicitada.

    Para `sessions_spawn`, `runtime: "acp"` se anuncia solo cuando ACP está
    habilitado, el solicitante no está aislado en sandbox y se ha cargado un backend
    de runtime ACP. `acp.dispatch.enabled=false` pausa el despacho automático de hilos ACP
    pero no oculta ni bloquea llamadas explícitas `sessions_spawn({ runtime: "acp" })`.
    Apunta a ids de harness ACP como `codex`, `claude`, `droid`,
    `gemini` u `opencode`. No pases un id normal de agente de configuración de OpenClaw
    desde `agents_list` a menos que esa entrada esté configurada explícitamente con
    `agents.list[].runtime.type="acp"`; de lo contrario, usa el runtime de subagente
    predeterminado. Cuando un agente de OpenClaw está configurado con
    `runtime.type="acp"`, OpenClaw usa `runtime.acp.agent` como id de harness
    subyacente.

  </Accordion>
</AccordionGroup>

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de harness externo. Usa el **servidor de aplicaciones
nativo de Codex** para vinculación/control de conversaciones de Codex cuando el plugin `codex`
esté habilitado. Usa **subagentes** cuando quieras ejecuciones delegadas nativas de OpenClaw.

| Área                | Sesión ACP                             | Ejecución de subagente              |
| ------------------- | -------------------------------------- | ----------------------------------- |
| Runtime             | Plugin de backend ACP (por ejemplo acpx) | Runtime de subagente nativo de OpenClaw |
| Clave de sesión     | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`   |
| Comandos principales | `/acp ...`                            | `/subagents ...`                    |
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

Los backends CLI son runtimes locales alternativos solo de texto independientes; consulta
[Backends CLI](/es/gateway/cli-backends).

Para operadores, la regla práctica es:

- **¿Quieres `/acp spawn`, sesiones vinculables, controles de runtime o trabajo persistente de harness?** Usa ACP.
- **¿Quieres una alternativa local simple de texto mediante la CLI sin procesar?** Usa backends CLI.

## Sesiones vinculadas

### Modelo mental

- **Superficie de chat** - donde las personas siguen hablando (canal de Discord, tema de Telegram, chat de iMessage).
- **Sesión ACP** - el estado duradero de runtime Codex/Claude/Gemini al que OpenClaw enruta.
- **Hilo/tema hijo** - una superficie de mensajería adicional opcional creada solo por `--thread ...`.
- **Espacio de trabajo de runtime** - la ubicación del sistema de archivos (`cwd`, checkout del repositorio, espacio de trabajo del backend) donde se ejecuta el harness. Independiente de la superficie de chat.

### Vinculaciones de conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la
sesión ACP creada: sin hilo hijo, misma superficie de chat. OpenClaw sigue
siendo dueño del transporte, la autenticación, la seguridad y la entrega. Los mensajes de seguimiento en esa
conversación se enrutan a la misma sesión; `/new` y `/reset` restablecen la sesión
en su lugar; `/acp close` elimina la vinculación.

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
    - `--bind here` solo funciona en canales que anuncian vinculación de conversación actual; OpenClaw devuelve un mensaje claro de no compatible en caso contrario. Las vinculaciones persisten entre reinicios del Gateway.
    - En Discord, `spawnSessions` controla la creación de hilos hijos para `--thread auto|here`, no `--bind here`.
    - Si creas una sesión en un agente ACP distinto sin `--cwd`, OpenClaw hereda de forma predeterminada el espacio de trabajo del **agente de destino**. Las rutas heredadas faltantes (`ENOENT`/`ENOTDIR`) recurren al valor predeterminado del backend; otros errores de acceso (por ejemplo, `EACCES`) se muestran como errores de creación.
    - Los comandos de administración del Gateway permanecen locales en conversaciones vinculadas: los comandos `/acp ...` los maneja OpenClaw incluso cuando el texto normal de seguimiento se enruta a la sesión ACP vinculada; `/status` y `/unfocus` también permanecen locales siempre que el manejo de comandos esté habilitado para esa superficie.

  </Accordion>
  <Accordion title="Sesiones vinculadas a hilos">
    Cuando las vinculaciones de hilos están habilitadas para un adaptador de canal:

    - OpenClaw vincula un hilo a una sesión ACP de destino.
    - Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
    - La salida de ACP se entrega de vuelta al mismo hilo.
    - Desenfocar/cerrar/archivar/tiempo de inactividad agotado o expiración por edad máxima elimina la vinculación.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` y `/unfocus` son comandos del Gateway, no prompts para el harness ACP.

    Flags de funcionalidad requeridos para ACP vinculado a hilos:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` está activado de forma predeterminada (establece `false` para pausar el despacho automático de hilos ACP; las llamadas explícitas `sessions_spawn({ runtime: "acp" })` siguen funcionando).
    - Creación de sesiones de hilo del adaptador de canal habilitada (valor predeterminado: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    El soporte de vinculación de hilos es específico del adaptador. Si el adaptador de canal activo
    no admite vinculaciones de hilos, OpenClaw devuelve un mensaje claro de
    no compatible/no disponible.

  </Accordion>
  <Accordion title="Canales compatibles con hilos">
    - Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
    - Soporte integrado actual: hilos/canales de **Discord**, temas de **Telegram** (temas de foro en grupos/supergrupos y temas de DM).
    - Los canales de plugin pueden añadir soporte mediante la misma interfaz de vinculación.

  </Accordion>
</AccordionGroup>

## Vinculaciones persistentes de canales

Para flujos de trabajo no efímeros, configura vinculaciones ACP persistentes en entradas
`bindings[]` de nivel superior.

### Modelo de vinculación

<ParamField path="bindings[].type" type='"acp"'>
  Marca una vinculación persistente de conversación ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversación de destino. Formas por canal:

- **Canal/hilo de Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/DM de Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Prefiere ids estables de Slack; las vinculaciones de canal también coinciden con respuestas dentro de los hilos de ese canal.
- **Tema de foro de Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo de WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Usa números E.164 como `+15555550123` para chats directos y JIDs de grupos de WhatsApp como `120363424282127706@g.us` para grupos.
- **DM/grupo de iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefiere `chat_id:*` para vinculaciones de grupo estables.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  El id del agente propietario de OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Anulación ACP opcional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etiqueta opcional visible para el operador.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directorio de trabajo opcional del runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Anulación opcional del backend.
</ParamField>

### Valores predeterminados de runtime por agente

Usa `agents.list[].runtime` para definir valores predeterminados de ACP una vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de harness, por ejemplo `codex` o `claude`)
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

- OpenClaw garantiza que la sesión ACP configurada exista después de la admisión específica del canal y antes de usarla.
- Los mensajes en ese canal, tema o chat se enrutan a la sesión ACP configurada.
- Los enlaces ACP configurados son propietarios de su ruta de sesión. La distribución de difusión del canal no sustituye la sesión ACP configurada para un enlace coincidente.
- En conversaciones enlazadas, `/new` y `/reset` restablecen la misma clave de sesión ACP en el lugar.
- Los enlaces temporales de entorno de ejecución (por ejemplo, creados por flujos de foco de hilo) siguen aplicándose donde estén presentes.
- Para generaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas de espacio de trabajo heredadas que faltan recurren al cwd predeterminado del servicio de fondo; los fallos de acceso cuando la ruta no falta se muestran como errores de generación.

## Iniciar sesiones ACP

Dos formas de iniciar una sesión ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    Usa `runtime: "acp"` para iniciar una sesión ACP desde un turno de agente o una llamada
    de herramienta.

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
    `runtime` usa `subagent` de forma predeterminada, así que define `runtime: "acp"` explícitamente para
    las sesiones ACP. Si se omite `agentId`, OpenClaw usa `acp.defaultAgent`
    cuando está configurado. `mode: "session"` requiere `thread: true` para mantener una
    conversación enlazada persistente.
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
  Prompt inicial enviado a la sesión ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Debe ser `"acp"` para sesiones ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id. del arnés ACP de destino. Recurre a `acp.defaultAgent` si está definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita el flujo de enlace de hilo donde sea compatible.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` es de ejecución única; `"session"` es persistente. Si `thread: true` y
  se omite `mode`, OpenClaw puede usar comportamiento persistente de forma predeterminada según
  la ruta de entorno de ejecución. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo solicitado para el entorno de ejecución (validado por la política del servicio de fondo/entorno de ejecución).
  Si se omite, la generación ACP hereda el espacio de trabajo del agente de destino cuando está configurado;
  las rutas heredadas que faltan recurren a los valores predeterminados del servicio de fondo, mientras que los errores reales de acceso
  se devuelven.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta visible para el operador usada en el texto de sesión/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reanuda una sesión ACP existente en lugar de crear una nueva. El agente
  reproduce su historial de conversación mediante `session/load`. Requiere
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite resúmenes iniciales de progreso de la ejecución ACP de vuelta a la sesión solicitante
  como eventos del sistema. Las respuestas aceptadas incluyen `streamLogPath`
  que apunta a un registro JSONL con alcance de sesión (`<sessionId>.acp-stream.jsonl`) que
  puedes seguir para ver el historial completo del retransmisor. Los flujos de progreso del padre muestran los comentarios
  del asistente y el progreso de estado ACP de forma predeterminada, salvo que
  `streaming.progress.commentary=false`. Discord también usa de forma predeterminada las vistas previas del padre
  en modo de progreso cuando no hay ningún modo de transmisión configurado. El progreso de estado
  sigue respetando `acp.stream.tagVisibility`, por lo que etiquetas como `plan`
  permanecen ocultas salvo que se habiliten explícitamente.
</ParamField>

Las ejecuciones ACP de `sessions_spawn` usan `agents.defaults.subagents.runTimeoutSeconds`
para su límite predeterminado de turno hijo. La herramienta no acepta sustituciones
de tiempo de espera por llamada (`runTimeoutSeconds`/`timeoutSeconds` se rechazan con un
error de configurar-el-predeterminado).

<ParamField path="model" type="string">
  Sustitución explícita del modelo para la sesión hija ACP. Las generaciones ACP de Codex
  normalizan refs de OpenAI como `openai/gpt-5.4` a la configuración de inicio ACP de Codex
  antes de `session/new`; las formas slash como `openai/gpt-5.4/high` también definen
  el esfuerzo de razonamiento ACP de Codex. Cuando se omite, `sessions_spawn({ runtime: "acp" })`
  usa los valores predeterminados existentes de modelo de subagente (`agents.defaults.subagents.model` o
  `agents.list[].subagents.model`) cuando están configurados; de lo contrario, permite que el arnés ACP
  use su propio modelo predeterminado. Otros arneses deben anunciar `models` ACP
  y admitir `session/set_model`; de lo contrario, OpenClaw/acpx falla
  claramente en lugar de recurrir silenciosamente al valor predeterminado del agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esfuerzo explícito de pensamiento/razonamiento. Para ACP de Codex, `minimal` se asigna a esfuerzo
  bajo, `low`/`medium`/`high`/`xhigh` se asignan directamente, y `off` omite la
  sustitución de inicio del esfuerzo de razonamiento. Cuando se omite, las generaciones ACP usan los valores
  predeterminados existentes de pensamiento de subagente y
  `agents.defaults.models["provider/model"].params.thinking` por modelo para el modelo
  seleccionado.
</ParamField>

## Modos de enlace de generación e hilo

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamiento                                                               |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | Enlaza la conversación activa actual en el lugar; falla si no hay ninguna activa. |
    | `off`  | No crea un enlace de conversación actual.                          |

    Notas:

    - `--bind here` es la ruta de operador más sencilla para "hacer que este canal o chat esté respaldado por Codex".
    - `--bind here` no crea un hilo hijo.
    - `--bind here` solo está disponible en canales que exponen compatibilidad con enlace de conversación actual.
    - `--bind` y `--thread` no se pueden combinar en la misma llamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamiento                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | En un hilo activo: enlaza ese hilo. Fuera de un hilo: crea/enlaza un hilo hijo cuando sea compatible. |
    | `here` | Requiere un hilo activo actual; falla si no estás en uno.                                                  |
    | `off`  | Sin enlace. La sesión se inicia sin enlace.                                                                 |

    Notas:

    - En superficies de enlace que no son de hilo, el comportamiento predeterminado es efectivamente `off`.
    - La generación enlazada a hilo requiere compatibilidad con la política del canal:
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
    Las sesiones interactivas están pensadas para seguir conversando en una superficie de chat visible:

    - `/acp spawn ... --bind here` enlaza la conversación actual a la sesión ACP.
    - `/acp spawn ... --thread ...` enlaza un hilo/tema de canal a la sesión ACP.
    - Los `bindings[].type="acp"` configurados persistentes enrutan conversaciones coincidentes a la misma sesión ACP.

    Los mensajes de seguimiento en la conversación enlazada se enrutan directamente a la sesión
    ACP, y la salida ACP se entrega de vuelta a ese mismo
    canal/hilo/tema.

    Lo que OpenClaw envía al arnés:

    - Los seguimientos enlazados normales se envían como texto de prompt, más adjuntos solo cuando el arnés/servicio de fondo los admite.
    - Los comandos de gestión `/acp` y los comandos locales de Gateway se interceptan antes del envío ACP.
    - Los eventos de finalización generados por el entorno de ejecución se materializan por destino. Los agentes OpenClaw reciben el sobre interno de contexto de entorno de ejecución de OpenClaw; los arneses ACP externos reciben un prompt simple con el resultado hijo y la instrucción. El sobre sin procesar `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca debe enviarse a arneses externos ni persistirse como texto de transcripción de usuario ACP.
    - Las entradas de transcripción ACP usan el texto de activación visible para el usuario o el prompt de finalización simple. Los metadatos de eventos internos permanecen estructurados en OpenClaw cuando es posible y no se tratan como contenido de chat escrito por el usuario.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Las sesiones ACP de ejecución única generadas por otra ejecución de agente son hijos en segundo plano,
    similares a subagentes:

    - El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - El hijo se ejecuta en su propia sesión de arnés ACP.
    - Los turnos hijos se ejecutan en el mismo carril en segundo plano que usan las generaciones nativas de subagentes, por lo que un arnés ACP lento no bloquea trabajo no relacionado de la sesión principal.
    - Los informes de finalización vuelven por la ruta de anuncio de finalización de tarea. OpenClaw convierte metadatos internos de finalización en un prompt ACP simple antes de enviarlo a un arnés externo, por lo que los arneses no ven marcadores de contexto de entorno de ejecución exclusivos de OpenClaw.
    - El padre reescribe el resultado hijo con voz normal de asistente cuando una respuesta visible para el usuario es útil.

    **No** trates esta ruta como un chat de igual a igual entre padre e
    hijo. El hijo ya tiene un canal de finalización de vuelta al padre.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` puede apuntar a otra sesión después de la generación. Para sesiones pares
    normales, OpenClaw usa una ruta de seguimiento de agente a agente (A2A) después de
    inyectar el mensaje:

    - Espera la respuesta de la sesión de destino.
    - Opcionalmente permite que solicitante y destino intercambien un número acotado de turnos de seguimiento.
    - Pide al destino que produzca un mensaje de anuncio.
    - Entrega ese anuncio al canal o hilo visible.

    Esa ruta A2A es una alternativa para envíos entre pares en los que el remitente necesita un
    seguimiento visible. Permanece habilitada cuando una sesión no relacionada puede ver y
    enviar mensajes a un destino ACP, por ejemplo con ajustes amplios de `tools.sessions.visibility`.

    OpenClaw omite el seguimiento A2A solo cuando el solicitante es el padre de
    su propio hijo ACP de un solo uso propiedad del padre. En ese caso, ejecutar A2A encima
    de la finalización de la tarea puede despertar al padre con el resultado del hijo, reenviar
    la respuesta del padre al hijo y crear un bucle de eco padre/hijo. El resultado de
    `sessions_send` informa `delivery.status="skipped"` para ese caso de hijo propio porque
    la ruta de finalización ya es responsable del resultado.

  </Accordion>
  <Accordion title="Reanudar una sesión existente">
    Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de
    empezar de cero. El agente reproduce su historial de conversación mediante
    `session/load`, por lo que retoma con todo el contexto de lo anterior.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comunes:

    - Transfiere una sesión de Codex de tu portátil a tu teléfono: dile a tu agente que retome donde lo dejaste.
    - Continúa una sesión de programación que iniciaste de forma interactiva en la CLI, ahora sin interfaz mediante tu agente.
    - Retoma trabajo interrumpido por un reinicio del Gateway o un tiempo de espera por inactividad.

    Notas:

    - `resumeSessionId` solo se aplica cuando `runtime: "acp"`; el runtime de subagente predeterminado ignora este campo exclusivo de ACP.
    - `streamTo` solo se aplica cuando `runtime: "acp"`; el runtime de subagente predeterminado ignora este campo exclusivo de ACP.
    - `resumeSessionId` es un id de reanudación ACP/harness local del host, no una clave de sesión de canal de OpenClaw; OpenClaw sigue comprobando la política de creación ACP y la política del agente de destino antes del envío, mientras que el backend ACP o el harness son responsables de la autorización para cargar ese id ascendente.
    - `resumeSessionId` restaura el historial de conversación ACP ascendente; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, por lo que `mode: "session"` sigue requiriendo `thread: true`.
    - El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
    - Si no se encuentra el id de sesión, la creación falla con un error claro, sin alternativa silenciosa a una sesión nueva.

  </Accordion>
  <Accordion title="Prueba de humo posterior al despliegue">
    Después de desplegar un Gateway, ejecuta una comprobación integral en vivo en lugar de confiar
    en las pruebas unitarias:

    1. Verifica la versión desplegada del Gateway y el commit en el host de destino.
    2. Abre una sesión temporal de puente ACPX hacia un agente en vivo.
    3. Pide a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` real y que no haya error de validador.
    5. Limpia la sesión temporal de puente.

    Mantén la puerta en `mode: "run"` y omite `streamTo: "parent"`:
    `mode: "session"` vinculado a hilos y las rutas de retransmisión de flujo son pasadas de
    integración más completas e independientes.

  </Accordion>
</AccordionGroup>

## Compatibilidad con sandbox

Actualmente, las sesiones ACP se ejecutan en el runtime del host, **no** dentro del
sandbox de OpenClaw.

<Warning>
**Límite de seguridad:**

- El harness externo puede leer/escribir de acuerdo con sus propios permisos de CLI y el `cwd` seleccionado.
- La política de sandbox de OpenClaw **no** envuelve la ejecución del harness ACP.
- OpenClaw sigue aplicando las puertas de funcionalidad ACP, los agentes permitidos, la propiedad de sesión, los enlaces de canal y la política de entrega del Gateway.
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
2. Enlace del hilo actual (si esta conversación/hilo está enlazado a una sesión ACP).
3. Alternativa de la sesión solicitante actual.

Los enlaces de la conversación actual y los enlaces de hilo participan en el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | Qué hace                                                  | Ejemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; enlace actual o de hilo opcional.    | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso de la sesión de destino.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de dirección a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desenlaza destinos de hilo.            | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de runtime y capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Define el modo de runtime para la sesión de destino.      | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opción de configuración del runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define la sobrescritura del directorio de trabajo del runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define el perfil de política de aprobación.               | `/acp permissions strict`                                     |
| `/acp timeout`       | Define el tiempo de espera del runtime (segundos).        | `/acp timeout 120`                                            |
| `/acp model`         | Define la sobrescritura del modelo del runtime.           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las sobrescrituras de opciones de runtime de la sesión. | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sesiones ACP recientes desde el almacén.            | `/acp sessions`                                               |
| `/acp doctor`        | Salud del backend, capacidades y correcciones accionables. | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación. | `/acp install`                                                |

Los controles de runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` y `reset-options`) requieren
identidad de propietario desde canales externos y `operator.admin` desde clientes
internos del Gateway. Los remitentes autorizados que no sean propietarios aún pueden usar
`sessions`, `doctor`, `install` y `help`.

`/acp status` muestra las opciones efectivas de runtime más los identificadores de sesión
de nivel de runtime y de nivel de backend. Los errores de controles no admitidos aparecen
con claridad cuando un backend carece de una capacidad. `/acp sessions` lee el almacén
para la sesión enlazada actual o solicitante; los tokens de destino (`session-key`,
`session-id` o `session-label`) se resuelven mediante el descubrimiento de sesiones del Gateway,
incluidas raíces `session.store` personalizadas por agente.

### Asignación de opciones de runtime

`/acp` tiene comandos de conveniencia y un definidor genérico. Operaciones equivalentes:

| Comando                      | Se asigna a                          | Notas                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | clave de configuración del runtime `model` | Para Codex ACP, OpenClaw normaliza `openai/<model>` al id de modelo del adaptador y asigna sufijos de razonamiento con barra como `openai/gpt-5.4/high` a `reasoning_effort`.                              |
| `/acp set thinking <level>`  | opción canónica `thinking`           | OpenClaw envía el equivalente anunciado por el backend cuando está presente, prefiriendo `thinking`, luego `effort`, `reasoning_effort` o `thought_level`. Para Codex ACP, el adaptador asigna valores a `reasoning_effort`. |
| `/acp permissions <profile>` | opción canónica `permissionProfile`  | OpenClaw envía el equivalente anunciado por el backend cuando está presente, como `approval_policy`, `permission_profile`, `permissions` o `permission_mode`.                                             |
| `/acp timeout <seconds>`     | opción canónica `timeoutSeconds`     | OpenClaw envía el equivalente anunciado por el backend cuando está presente, como `timeout` o `timeout_seconds`.                                                                                           |
| `/acp cwd <path>`            | sobrescritura de cwd del runtime     | Actualización directa.                                                                                                                                                                                     |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa la ruta de sobrescritura de cwd.                                                                                                                                                             |
| `/acp reset-options`         | borra todas las sobrescrituras de runtime | -                                                                                                                                                                                                          |

## Harness acpx, configuración de Plugin y permisos

Para la configuración del harness acpx (alias de Claude Code / Codex / Gemini CLI),
los puentes MCP plugin-tools y OpenClaw-tools, y los modos de permisos ACP,
consulta [Agentes ACP: configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                                   | Causa probable                                                                                                         | Solución                                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | Falta el Plugin de backend, está deshabilitado o está bloqueado por `plugins.allow`.                                   | Instala y habilita el Plugin de backend, incluye `acpx` en `plugins.allow` cuando esa lista de permitidos esté configurada y luego ejecuta `/acp doctor`.              |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP está deshabilitado globalmente.                                                                                    | Configura `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | El despacho automático desde mensajes normales de hilo está deshabilitado.                                             | Configura `acp.dispatch.enabled=true` para reanudar el enrutamiento automático de hilos; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando. |
| `ACP agent "<id>" is not allowed by policy`                                               | El agente no está en la lista de permitidos.                                                                           | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                             |
| `/acp doctor` informa que el backend no está listo justo después del inicio               | Falta el Plugin de backend, está deshabilitado, está bloqueado por una política de permitir/denegar o su ejecutable configurado no está disponible. | Instala/habilita el Plugin de backend, vuelve a ejecutar `/acp doctor` e inspecciona el error de instalación o política del backend si sigue sin estar saludable.      |
| No se encontró el comando del harness                                                     | La CLI del adaptador no está instalada, falta el Plugin externo o falló la descarga de `npx` en la primera ejecución para un adaptador que no es Codex. | Ejecuta `/acp doctor`, instala/precalienta el adaptador en el host del Gateway o configura explícitamente el comando del agente acpx.                                  |
| Modelo no encontrado desde el harness                                                     | El id de modelo es válido para otro proveedor/harness, pero no para este destino ACP.                                  | Usa un modelo listado por ese harness, configura el modelo en el harness u omite la sobrescritura.                                                                      |
| Error de autenticación del proveedor desde el harness                                     | OpenClaw está saludable, pero la CLI/proveedor de destino no tiene una sesión iniciada.                                | Inicia sesión o proporciona la clave de proveedor requerida en el entorno del host del Gateway.                                                                         |
| `Unable to resolve session target: ...`                                                   | Token de clave/id/etiqueta incorrecto.                                                                                | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation`               | Se usó `--bind here` sin una conversación activa que se pueda vincular.                                                | Muévete al chat/canal de destino y vuelve a intentarlo, o usa una generación sin vincular.                                                                              |
| `Conversation bindings are unavailable for <channel>.`                                    | El adaptador no tiene capacidad de vinculación ACP de conversación actual.                                             | Usa `/acp spawn ... --thread ...` donde sea compatible, configura `bindings[]` de nivel superior o muévete a un canal compatible.                                      |
| `--thread here requires running /acp spawn inside an active ... thread`                   | Se usó `--thread here` fuera de un contexto de hilo.                                                                  | Muévete al hilo de destino o usa `--thread auto`/`off`.                                                                                                                |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Otro usuario es propietario del destino de vinculación activo.                                                         | Vuelve a vincular como propietario o usa otra conversación u otro hilo.                                                                                                |
| `Thread bindings are unavailable for <channel>.`                                          | El adaptador no tiene capacidad de vinculación de hilos.                                                              | Usa `--thread off` o muévete a un adaptador/canal compatible.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | El runtime de ACP está del lado del host; la sesión solicitante está en sandbox.                                       | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la generación ACP desde una sesión que no esté en sandbox.                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | Se solicitó `sandbox="require"` para el runtime de ACP.                                                               | Usa `runtime="subagent"` para sandboxing obligatorio, o usa ACP con `sandbox="inherit"` desde una sesión que no esté en sandbox.                                      |
| `Cannot apply --model ... did not advertise model support`                                | El harness de destino no expone el cambio genérico de modelo ACP.                                                     | Usa un harness que anuncie ACP `models`/`session/set_model`, usa refs de modelo ACP de Codex o configura el modelo directamente en el harness si tiene su propia marca de inicio. |
| Faltan metadatos ACP para la sesión vinculada                                             | Metadatos de sesión ACP obsoletos/eliminados.                                                                         | Vuelve a crearla con `/acp spawn` y luego vuelve a vincular/enfocar el hilo.                                                                                           |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloquea escrituras/ejecución en una sesión ACP no interactiva.                                       | Configura `plugins.entries.acpx.config.permissionMode` como `approve-all` y reinicia el gateway. Consulta [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| La sesión ACP falla pronto con poca salida                                                | Las solicitudes de permiso están bloqueadas por `permissionMode`/`nonInteractivePermissions`.                         | Revisa los registros del gateway para ver `AcpRuntimeError`. Para permisos completos, configura `permissionMode=approve-all`; para degradación gradual, configura `nonInteractivePermissions=deny`. |
| La sesión ACP se queda bloqueada indefinidamente después de completar el trabajo          | El proceso del harness terminó, pero la sesión ACP no informó finalización.                                           | Actualiza OpenClaw; la limpieza actual de acpx recoge procesos obsoletos de wrapper y adaptador propiedad de OpenClaw al cerrar y al iniciar el Gateway.              |
| El harness ve `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                     | El sobre de evento interno se filtró a través del límite ACP.                                                         | Actualiza OpenClaw y vuelve a ejecutar el flujo de finalización; los harnesses externos solo deberían recibir prompts de finalización sin formato.                     |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` pertenece al
relay de hooks nativo de Codex, no a ACP/acpx. En un chat de Codex vinculado, inicia una
sesión nueva con `/new` o `/reset`; si funciona una vez y luego vuelve en
la siguiente llamada de herramienta nativa, reinicia el app-server de Codex o el Gateway de OpenClaw
en lugar de repetir `/new`. Consulta
[Solución de problemas del harness Codex](/es/plugins/codex-harness#troubleshooting).
</Note>

## Relacionado

- [Agentes ACP - configuración](/es/tools/acp-agents-setup)
- [Envío de agente](/es/tools/agent-send)
- [Backends de CLI](/es/gateway/cli-backends)
- [Harness Codex](/es/plugins/codex-harness)
- [Runtime del harness Codex](/es/plugins/codex-harness-runtime)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo bridge)](/es/cli/acp)
- [Subagentes](/es/tools/subagents)
