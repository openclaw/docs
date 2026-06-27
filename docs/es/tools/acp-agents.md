---
read_when:
    - Ejecutar arneses de programación mediante ACP
    - Configurar sesiones ACP vinculadas a la conversación en canales de mensajería
    - Vincular una conversación de canal de mensajes a una sesión persistente de ACP
    - Solucionar problemas del backend ACP, el cableado de plugins o la entrega de finalización
    - Ejecutar comandos /acp desde el chat
sidebarTitle: ACP agents
summary: Ejecuta arneses de codificación externos (Claude Code, Cursor, Gemini CLI, Codex ACP explícito, OpenClaw ACP, OpenCode) mediante el backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-06-27T12:59:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permiten que OpenClaw ejecute entornos de codificación externos (por ejemplo Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI y otros
entornos ACPX compatibles) mediante un plugin de backend ACP.

Cada creación de sesión ACP se rastrea como una [tarea en segundo plano](/es/automation/tasks).

<Note>
**ACP es la ruta para entornos externos, no la ruta predeterminada de Codex.** El
plugin nativo de servidor de aplicación de Codex posee los controles `/codex ...` y el
runtime integrado `openai/gpt-*` predeterminado para los turnos del agente; ACP posee
los controles `/acp ...` y las sesiones `sessions_spawn({ runtime: "acp" })`.

Si quieres que Codex o Claude Code se conecten como cliente MCP externo
directamente a conversaciones existentes de canales de OpenClaw, usa
[`openclaw mcp serve`](/es/cli/mcp) en lugar de ACP.
</Note>

## ¿Qué página necesito?

| Quieres…                                                                                         | Usa esto                              | Notas                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular o controlar Codex en la conversación actual                                             | `/codex bind`, `/codex threads`       | Ruta nativa del servidor de aplicación de Codex cuando el plugin `codex` está habilitado; incluye respuestas de chat vinculadas, reenvío de imágenes, modelo/rápido/permisos, detener y controles de dirección. ACP es una alternativa explícita |
| Ejecutar Claude Code, Gemini CLI, Codex ACP explícito u otro entorno externo _a través de_ OpenClaw | Esta página                           | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime                                                                           |
| Exponer una sesión de OpenClaw Gateway _como_ servidor ACP para un editor o cliente              | [`openclaw acp`](/es/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw por stdio/WebSocket                                                                                                                                   |
| Reutilizar una CLI de IA local como modelo alternativo solo de texto                             | [Backends CLI](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin runtime de entorno                                                                                                                        |

## ¿Funciona sin configuración adicional?

Sí, después de instalar el plugin oficial de runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los checkouts de origen pueden usar el plugin local del workspace `extensions/acpx` después de
`pnpm install`. Ejecuta `/acp doctor` para una comprobación de preparación.

OpenClaw solo informa a los agentes sobre la creación de ACP cuando ACP es **realmente
usable**: ACP debe estar habilitado, el despacho no debe estar deshabilitado, la sesión
actual no debe estar bloqueada por el sandbox y debe haber un backend de runtime
cargado. Si no se cumplen esas condiciones, las Skills del plugin ACP y la guía ACP de
`sessions_spawn` permanecen ocultas para que el agente no sugiera
un backend no disponible.

<AccordionGroup>
  <Accordion title="Advertencias de la primera ejecución">
    - Si `plugins.allow` está definido, es un inventario restrictivo de plugins y **debe** incluir `acpx`; de lo contrario, el backend ACP instalado se bloquea intencionalmente y `/acp doctor` informa la entrada faltante en la lista de permitidos.
    - El adaptador ACP de Codex se prepara con el plugin `acpx` y se inicia localmente cuando es posible.
    - Codex ACP se ejecuta con un `CODEX_HOME` aislado; OpenClaw copia entradas de proyecto confiables y configuración segura de enrutamiento de modelo/proveedor desde la configuración de Codex del host, mientras que la autenticación, las notificaciones y los hooks permanecen en la configuración del host.
    - Otros adaptadores de entornos de destino aún pueden descargarse bajo demanda con `npx` la primera vez que los uses.
    - La autenticación del proveedor aún debe existir en el host para ese entorno.
    - Si el host no tiene npm o acceso a la red, las descargas de adaptadores de primera ejecución fallan hasta que las cachés se precalienten o el adaptador se instale de otra manera.

  </Accordion>
  <Accordion title="Requisitos previos del runtime">
    ACP inicia un proceso real de entorno externo. OpenClaw posee el enrutamiento,
    el estado de tareas en segundo plano, la entrega, las vinculaciones y la política; el entorno
    posee su inicio de sesión del proveedor, catálogo de modelos, comportamiento del sistema de archivos y
    herramientas nativas.

    Antes de culpar a OpenClaw, verifica:

    - `/acp doctor` informa un backend habilitado y saludable.
    - El id de destino está permitido por `acp.allowedAgents` cuando esa lista de permitidos está definida.
    - El comando del entorno puede iniciarse en el host del Gateway.
    - La autenticación del proveedor está presente para ese entorno (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - El modelo seleccionado existe para ese entorno; los ids de modelo no son portables entre entornos.
    - El `cwd` solicitado existe y es accesible, u omite `cwd` y deja que el backend use su valor predeterminado.
    - El modo de permisos coincide con el trabajo. Las sesiones no interactivas no pueden hacer clic en solicitudes de permisos nativas, por lo que las ejecuciones de codificación con mucha escritura/ejecución normalmente necesitan un perfil de permisos ACPX que pueda continuar sin intervención.

  </Accordion>
</AccordionGroup>

Las herramientas de plugins de OpenClaw y las herramientas integradas de OpenClaw **no** se exponen a
los entornos ACP de forma predeterminada. Habilita los puentes MCP explícitos en
[agentes ACP - configuración](/es/tools/acp-agents-setup) solo cuando el entorno
deba llamar a esas herramientas directamente.

## Destinos de entornos compatibles

Con el backend `acpx`, usa estos ids de entorno como destinos de `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID de entorno | Backend típico                                  | Notas                                                                               |
| ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`      | Adaptador ACP de Claude Code                    | Requiere autenticación de Claude Code en el host.                                   |
| `codex`       | Adaptador ACP de Codex                          | Alternativa ACP explícita solo cuando `/codex` nativo no está disponible o se solicita ACP. |
| `copilot`     | Adaptador ACP de GitHub Copilot                 | Requiere autenticación de Copilot CLI/runtime.                                      |
| `cursor`      | ACP de Cursor CLI (`cursor-agent acp`)          | Sobrescribe el comando acpx si una instalación local expone un punto de entrada ACP diferente. |
| `droid`       | Factory Droid CLI                               | Requiere autenticación de Factory/Droid o `FACTORY_API_KEY` en el entorno del harness. |
| `gemini`      | Adaptador ACP de Gemini CLI                     | Requiere autenticación de Gemini CLI o configuración de clave de API.               |
| `iflow`       | iFlow CLI                                       | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kilocode`    | Kilo Code CLI                                   | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `kimi`        | Kimi/Moonshot CLI                               | Requiere autenticación de Kimi/Moonshot en el host.                                 |
| `kiro`        | Kiro CLI                                        | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada. |
| `opencode`    | Adaptador ACP de OpenCode                       | Requiere autenticación de OpenCode CLI/proveedor.                                   |
| `openclaw`    | Puente de OpenClaw Gateway mediante `openclaw acp` | Permite que un entorno compatible con ACP hable de vuelta con una sesión de OpenClaw Gateway. |
| `qwen`        | Qwen Code / Qwen CLI                            | Requiere autenticación compatible con Qwen en el host.                              |

Los alias personalizados de agentes acpx se pueden configurar en acpx, pero la política de OpenClaw
aún comprueba `acp.allowedAgents` y cualquier
mapeo `agents.list[].runtime.acp.agent` antes del despacho.

## Runbook del operador

Flujo rápido de `/acp` desde el chat:

<Steps>
  <Step title="Crear">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, o explícitamente
    `/acp spawn codex --bind here`.
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
    - Las sesiones ACP pertenecientes al padre se tratan como trabajo en segundo plano incluso cuando la sesión de runtime es persistente; la finalización y la entrega entre superficies pasan por el notificador de tareas padre en lugar de actuar como una sesión de chat normal visible para el usuario.
    - El mantenimiento de tareas cierra sesiones ACP terminales o huérfanas de un solo uso pertenecientes al padre. Las sesiones ACP persistentes se conservan mientras permanezca una vinculación de conversación activa; las sesiones persistentes obsoletas sin una vinculación activa se cierran para que no puedan reanudarse silenciosamente después de que la tarea propietaria haya terminado o su registro de tarea haya desaparecido.
    - Los mensajes de seguimiento vinculados van directamente a la sesión ACP hasta que la vinculación se cierre, pierda foco, se restablezca o expire.
    - Los comandos de Gateway permanecen locales. `/acp ...`, `/status` y `/unfocus` nunca se envían como texto de prompt normal a un entorno ACP vinculado.
    - `cancel` aborta el turno activo cuando el backend admite cancelación; no elimina la vinculación ni los metadatos de sesión.
    - `close` finaliza la sesión ACP desde el punto de vista de OpenClaw y elimina la vinculación. Un entorno aún puede conservar su propio historial upstream si admite reanudación.
    - El plugin acpx limpia los árboles de procesos de envoltorios y adaptadores propiedad de OpenClaw después de `close`, y recolecta huérfanos ACPX obsoletos propiedad de OpenClaw durante el inicio de Gateway.
    - Los workers de runtime inactivos son elegibles para limpieza después de `acp.runtime.ttlMinutes`; los metadatos de sesión almacenados permanecen disponibles para `/acp sessions`.

  </Accordion>
  <Accordion title="Reglas de enrutamiento nativas de Codex">
    Activadores en lenguaje natural que deben enrutarse al **plugin nativo de Codex**
    cuando esté habilitado:

    - "Vincula este canal de Discord a Codex."
    - "Adjunta este chat al hilo de Codex `<id>`."
    - "Muestra los hilos de Codex y luego vincula este."

    La vinculación nativa de conversaciones de Codex es la ruta predeterminada de control de chat.
    Las herramientas dinámicas de OpenClaw siguen ejecutándose a través de OpenClaw, mientras que
    las herramientas nativas de Codex, como shell/apply-patch, se ejecutan dentro de Codex.
    Para los eventos de herramientas nativas de Codex, OpenClaw inyecta un relay de hooks nativo
    por turno para que los hooks de Plugin puedan bloquear `before_tool_call`, observar
    `after_tool_call` y enrutar los eventos `PermissionRequest` de Codex
    a través de las aprobaciones de OpenClaw. Los hooks `Stop` de Codex se retransmiten a
    `before_agent_finalize` de OpenClaw, donde los plugins pueden solicitar una pasada más del
    modelo antes de que Codex finalice su respuesta. El relay se mantiene
    deliberadamente conservador: no muta los argumentos de herramientas nativas de Codex
    ni reescribe los registros de hilos de Codex. Usa ACP explícito solo
    cuando quieras el modelo de runtime/sesión de ACP. El límite de soporte
    de Codex integrado está documentado en el
    [contrato de soporte v1 del arnés de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Model / provider / runtime selection cheat sheet">
    - referencias de modelo heredadas de Codex - ruta de modelo OAuth/suscripción heredada de Codex reparada por doctor.
    - `openai/*` - runtime integrado nativo del servidor de aplicaciones de Codex para turnos de agente de OpenAI.
    - `/codex ...` - control de conversación nativo de Codex.
    - `/acp ...` o `runtime: "acp"` - control ACP/acpx explícito.

  </Accordion>
  <Accordion title="ACP-routing natural-language triggers">
    Disparadores que deben enrutar al runtime ACP:

    - "Ejecuta esto como una sesión ACP de Claude Code de una sola ejecución y resume el resultado."
    - "Usa Gemini CLI para esta tarea en un hilo y luego mantén los seguimientos en ese mismo hilo."
    - "Ejecuta Codex a través de ACP en un hilo en segundo plano."

    OpenClaw elige `runtime: "acp"`, resuelve el `agentId` del arnés,
    se vincula a la conversación o hilo actual cuando se admite, y
    enruta los seguimientos a esa sesión hasta su cierre/caducidad. Codex solo
    sigue esta ruta cuando ACP/acpx es explícito o el plugin nativo de Codex
    no está disponible para la operación solicitada.

    Para `sessions_spawn`, `runtime: "acp"` se anuncia solo cuando ACP
    está habilitado, el solicitante no está en sandbox y hay cargado un backend
    de runtime ACP. `acp.dispatch.enabled=false` pausa el envío automático
    de hilos ACP, pero no oculta ni bloquea las llamadas explícitas a
    `sessions_spawn({ runtime: "acp" })`. Apunta a ids de arnés ACP como `codex`,
    `claude`, `droid`, `gemini` u `opencode`. No pases un id normal
    de agente de configuración de OpenClaw desde `agents_list` a menos que esa entrada esté
    configurada explícitamente con `agents.list[].runtime.type="acp"`;
    de lo contrario, usa el runtime predeterminado de subagente. Cuando un agente de OpenClaw
    está configurado con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` como el id de arnés subyacente.

  </Accordion>
</AccordionGroup>

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de arnés externo. Usa el **servidor de aplicaciones
nativo de Codex** para vinculación/control de conversaciones de Codex cuando el plugin `codex`
esté habilitado. Usa **subagentes** cuando quieras ejecuciones delegadas
nativas de OpenClaw.

| Área          | Sesión ACP                            | Ejecución de subagente             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin de backend ACP (por ejemplo acpx) | Runtime de subagente nativo de OpenClaw |
| Clave de sesión | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principales | `/acp ...`                     | `/subagents ...`                   |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predeterminado) |

Consulta también [Subagentes](/es/tools/subagents).

## Cómo ACP ejecuta Claude Code

Para Claude Code a través de ACP, la pila es:

1. Plano de control de sesión ACP de OpenClaw.
2. Plugin de runtime oficial `@openclaw/acpx`.
3. Adaptador ACP de Claude.
4. Maquinaria de runtime/sesión del lado de Claude.

ACP Claude es una **sesión de arnés** con controles ACP, reanudación de sesión,
seguimiento de tareas en segundo plano y vinculación opcional de conversación/hilo.

Los backends de CLI son runtimes locales de reserva separados solo de texto; consulta
[Backends de CLI](/es/gateway/cli-backends).

Para operadores, la regla práctica es:

- **¿Quieres `/acp spawn`, sesiones vinculables, controles de runtime o trabajo persistente de arnés?** Usa ACP.
- **¿Quieres una reserva local simple de texto a través de la CLI sin procesar?** Usa backends de CLI.

## Sesiones vinculadas

### Modelo mental

- **Superficie de chat** - donde las personas siguen conversando (canal de Discord, tema de Telegram, chat de iMessage).
- **Sesión ACP** - el estado de runtime duradero de Codex/Claude/Gemini al que OpenClaw enruta.
- **Hilo/tema hijo** - una superficie de mensajería adicional opcional creada solo por `--thread ...`.
- **Espacio de trabajo de runtime** - la ubicación del sistema de archivos (`cwd`, checkout del repositorio, espacio de trabajo del backend) donde se ejecuta el arnés. Independiente de la superficie de chat.

### Vinculaciones de conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la
sesión ACP creada: sin hilo hijo, la misma superficie de chat. OpenClaw sigue
poseyendo transporte, autenticación, seguridad y entrega. Los mensajes de seguimiento en esa
conversación se enrutan a la misma sesión; `/new` y `/reset` restablecen la
sesión in situ; `/acp close` elimina la vinculación.

Ejemplos:

```text
/codex bind                                              # vinculación nativa de Codex, enruta mensajes futuros aquí
/codex model gpt-5.4                                     # ajusta el hilo nativo vinculado de Codex
/codex stop                                              # controla el turno nativo activo de Codex
/acp spawn codex --bind here                             # reserva ACP explícita para Codex
/acp spawn codex --thread auto                           # puede crear un hilo/tema hijo y vincularlo allí
/acp spawn codex --bind here --cwd /workspace/repo       # misma vinculación de chat, Codex se ejecuta en /workspace/repo
```

<AccordionGroup>
  <Accordion title="Binding rules and exclusivity">
    - `--bind here` y `--thread ...` son mutuamente excluyentes.
    - `--bind here` solo funciona en canales que anuncian vinculación de conversación actual; de lo contrario, OpenClaw devuelve un mensaje claro de no compatibilidad. Las vinculaciones persisten entre reinicios del Gateway.
    - En Discord, `spawnSessions` controla la creación de hilos hijos para `--thread auto|here`, no `--bind here`.
    - Si creas hacia un agente ACP diferente sin `--cwd`, OpenClaw hereda de forma predeterminada el espacio de trabajo del **agente de destino**. Las rutas heredadas faltantes (`ENOENT`/`ENOTDIR`) recurren al valor predeterminado del backend; otros errores de acceso (por ejemplo, `EACCES`) aparecen como errores de creación.
    - Los comandos de administración del Gateway permanecen locales en conversaciones vinculadas: los comandos `/acp ...` los maneja OpenClaw incluso cuando el texto normal de seguimiento se enruta a la sesión ACP vinculada; `/status` y `/unfocus` también permanecen locales siempre que el manejo de comandos esté habilitado para esa superficie.

  </Accordion>
  <Accordion title="Thread-bound sessions">
    Cuando las vinculaciones de hilos están habilitadas para un adaptador de canal:

    - OpenClaw vincula un hilo a una sesión ACP de destino.
    - Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
    - La salida de ACP se entrega de vuelta al mismo hilo.
    - Desenfocar/cerrar/archivar/tiempo de inactividad o caducidad por edad máxima elimina la vinculación.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` y `/unfocus` son comandos de Gateway, no prompts para el arnés ACP.

    Feature flags requeridos para ACP vinculado a hilos:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` está activado de forma predeterminada (establece `false` para pausar el envío automático de hilos ACP; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando).
    - Creación de sesiones de hilo del adaptador de canal habilitada (predeterminado: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    El soporte de vinculación de hilos es específico del adaptador. Si el adaptador
    de canal activo no admite vinculaciones de hilos, OpenClaw devuelve un mensaje
    claro de no compatible/no disponible.

  </Accordion>
  <Accordion title="Thread-supporting channels">
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
  Marca una vinculación persistente de conversación ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversación de destino. Formas por canal:

- **Canal/hilo de Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/DM de Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Prefiere ids estables de Slack; las vinculaciones de canal también coinciden con respuestas dentro de los hilos de ese canal.
- **Tema de foro de Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo de WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Usa números E.164 como `+15555550123` para chats directos y JID de grupos de WhatsApp como `120363424282127706@g.us` para grupos.
- **DM/grupo de iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefiere `chat_id:*` para vinculaciones de grupos estables.

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
  Directorio de trabajo de runtime opcional.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Anulación opcional del backend.
</ParamField>

### Valores predeterminados de runtime por agente

Usa `agents.list[].runtime` para definir los valores predeterminados de ACP una vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de arnés, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedencia de anulación para sesiones ACP vinculadas:**

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
- Los enlaces ACP configurados son propietarios de su ruta de sesión. La distribución en abanico de la difusión del canal no sustituye la sesión ACP configurada para un enlace coincidente.
- En conversaciones enlazadas, `/new` y `/reset` restablecen la misma clave de sesión ACP en el mismo lugar.
- Los enlaces temporales de runtime (por ejemplo, los creados por flujos de enfoque de hilo) siguen aplicándose donde estén presentes.
- Para generaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas de espacios de trabajo heredadas ausentes recurren al cwd predeterminado del backend; los errores de acceso no ausentes se muestran como errores de generación.

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
    Usa `/acp spawn` para el control explícito del operador desde el chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Opciones clave:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Consulta [comandos slash](/es/tools/slash-commands).

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
  Id. del arnés ACP de destino. Recurre a `acp.defaultAgent` si está establecido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita el flujo de enlace de hilo donde sea compatible.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` es de una sola ejecución; `"session"` es persistente. Si `thread: true` y
  se omite `mode`, OpenClaw puede usar de forma predeterminada el comportamiento persistente según
  la ruta del runtime. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo del runtime solicitado (validado por la política del backend/runtime).
  Si se omite, la generación ACP hereda el espacio de trabajo del agente de destino
  cuando está configurado; las rutas heredadas ausentes recurren a los valores predeterminados
  del backend, mientras que los errores de acceso reales se devuelven.
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
  `"parent"` transmite resúmenes iniciales de progreso de la ejecución ACP de vuelta a la
  sesión solicitante como eventos de sistema. Las respuestas aceptadas incluyen
  `streamLogPath`, que apunta a un registro JSONL con ámbito de sesión
  (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo de retransmisión.
  Los flujos de progreso del padre muestran comentarios del asistente y progreso de estado ACP de forma
  predeterminada, salvo que `streaming.progress.commentary=false`. Discord también usa de forma predeterminada
  vistas previas del padre en modo de progreso cuando no hay ningún modo de flujo configurado. El progreso
  de estado sigue respetando `acp.stream.tagVisibility`, por lo que etiquetas como `plan`
  permanecen ocultas salvo que se habiliten explícitamente.
</ParamField>

Las ejecuciones ACP de `sessions_spawn` usan `agents.defaults.subagents.runTimeoutSeconds` como
límite predeterminado de turnos secundarios. La herramienta no acepta anulaciones de tiempo de espera
por llamada.

<ParamField path="model" type="string">
  Anulación explícita del modelo para la sesión ACP secundaria. Las generaciones ACP de Codex
  normalizan refs de OpenAI como `openai/gpt-5.4` a la configuración de inicio de ACP de Codex
  antes de `session/new`; las formas slash como `openai/gpt-5.4/high`
  también establecen el esfuerzo de razonamiento de ACP de Codex.
  Cuando se omite, `sessions_spawn({ runtime: "acp" })` usa los valores predeterminados existentes
  del modelo de subagente (`agents.defaults.subagents.model` o
  `agents.list[].subagents.model`) cuando están configurados; de lo contrario, permite que el
  arnés ACP use su propio modelo predeterminado.
  Otros arneses deben anunciar `models` de ACP y admitir
  `session/set_model`; de lo contrario, OpenClaw/acpx falla con claridad en vez de
  recurrir silenciosamente al valor predeterminado del agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esfuerzo explícito de pensamiento/razonamiento. Para ACP de Codex, `minimal` se asigna a
  esfuerzo bajo, `low`/`medium`/`high`/`xhigh` se asignan directamente, y `off`
  omite la anulación de inicio de esfuerzo de razonamiento.
  Cuando se omite, las generaciones ACP usan los valores predeterminados existentes de pensamiento de subagente y
  `agents.defaults.models["provider/model"].params.thinking` por modelo
  para el modelo seleccionado.
</ParamField>

## Modos de enlace y de hilo de generación

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamiento                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Enlaza la conversación activa actual en el mismo lugar; falla si no hay ninguna activa. |
    | `off`  | No crea un enlace de conversación actual.                          |

    Notas:

    - `--bind here` es la ruta de operador más sencilla para "hacer que este canal o chat esté respaldado por Codex".
    - `--bind here` no crea un hilo secundario.
    - `--bind here` solo está disponible en canales que exponen compatibilidad con enlace de conversación actual.
    - `--bind` y `--thread` no pueden combinarse en la misma llamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamiento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | En un hilo activo: enlaza ese hilo. Fuera de un hilo: crea/enlaza un hilo secundario cuando sea compatible. |
    | `here` | Requiere el hilo activo actual; falla si no se está en uno.                                                  |
    | `off`  | Sin enlace. La sesión se inicia sin enlazar.                                                                 |

    Notas:

    - En superficies de enlace que no son de hilo, el comportamiento predeterminado es efectivamente `off`.
    - La generación enlazada a hilo requiere compatibilidad con la política del canal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo secundario.

  </Tab>
</Tabs>

## Modelo de entrega

Las sesiones ACP pueden ser espacios de trabajo interactivos o trabajo en segundo plano
propiedad del padre. La ruta de entrega depende de esa forma.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Las sesiones interactivas están pensadas para seguir conversando en una superficie de chat
    visible:

    - `/acp spawn ... --bind here` enlaza la conversación actual a la sesión ACP.
    - `/acp spawn ... --thread ...` enlaza un hilo/tema de canal a la sesión ACP.
    - Los `bindings[].type="acp"` persistentes configurados enrutan las conversaciones coincidentes a la misma sesión ACP.

    Los mensajes de seguimiento en la conversación enlazada se enrutan directamente a la
    sesión ACP, y la salida de ACP se entrega de vuelta al mismo
    canal/hilo/tema.

    Lo que OpenClaw envía al arnés:

    - Los seguimientos enlazados normales se envían como texto de prompt, además de adjuntos solo cuando el arnés/backend los admite.
    - Los comandos de gestión `/acp` y los comandos locales de Gateway se interceptan antes del envío ACP.
    - Los eventos de finalización generados por el runtime se materializan por destino. Los agentes de OpenClaw reciben el sobre de contexto de runtime interno de OpenClaw; los arneses ACP externos reciben un prompt sin formato con el resultado secundario y la instrucción. El sobre sin procesar `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca debe enviarse a arneses externos ni persistirse como texto de transcripción de usuario de ACP.
    - Las entradas de transcripción ACP usan el texto desencadenador visible para el usuario o el prompt de finalización sin formato. Los metadatos de eventos internos se mantienen estructurados en OpenClaw cuando es posible y no se tratan como contenido de chat escrito por el usuario.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Las sesiones ACP de una sola ejecución generadas por otra ejecución de agente son
    secundarias en segundo plano, similares a los subagentes:

    - El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - El secundario se ejecuta en su propia sesión de arnés ACP.
    - Los turnos secundarios se ejecutan en el mismo carril en segundo plano usado por las generaciones nativas de subagentes, por lo que un arnés ACP lento no bloquea el trabajo no relacionado de la sesión principal.
    - La finalización informa de vuelta mediante la ruta de anuncio de finalización de tarea. OpenClaw convierte los metadatos internos de finalización en un prompt ACP sin formato antes de enviarlo a un arnés externo, para que los arneses no vean marcadores de contexto de runtime exclusivos de OpenClaw.
    - El padre reescribe el resultado secundario con la voz normal del asistente cuando resulta útil una respuesta visible para el usuario.

    **No** trates esta ruta como un chat de igual a igual entre padre
    y secundario. El secundario ya tiene un canal de finalización de vuelta al
    padre.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` puede apuntar a otra sesión después de la generación. Para sesiones de pares
    normales, OpenClaw usa una ruta de seguimiento agente a agente (A2A)
    después de inyectar el mensaje:

    - Espera la respuesta de la sesión de destino.
    - Opcionalmente permite que solicitante y destino intercambien un número acotado de turnos de seguimiento.
    - Pide al destino que produzca un mensaje de anuncio.
    - Entrega ese anuncio al canal o hilo visible.

    Esa ruta A2A es un respaldo para envíos entre pares donde el remitente necesita un
    seguimiento visible. Permanece habilitada cuando una sesión no relacionada puede
    ver y enviar mensajes a un destino ACP, por ejemplo, con configuraciones amplias de
    `tools.sessions.visibility`.

    OpenClaw omite el seguimiento A2A solo cuando el solicitante es el
    padre de su propio hijo ACP de un solo uso propiedad del padre. En ese caso,
    ejecutar A2A encima de la finalización de la tarea puede despertar al padre con el
    resultado del hijo, reenviar la respuesta del padre al hijo y
    crear un bucle de eco padre/hijo. El resultado de `sessions_send` informa
    `delivery.status="skipped"` para ese caso de hijo propio porque la
    ruta de finalización ya es responsable del resultado.

  </Accordion>
  <Accordion title="Resume an existing session">
    Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de
    empezar desde cero. El agente reproduce su historial de conversación mediante
    `session/load`, por lo que retoma con el contexto completo de lo anterior.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comunes:

    - Transfiere una sesión de Codex desde tu portátil a tu teléfono: dile a tu agente que retome donde lo dejaste.
    - Continúa una sesión de programación que iniciaste de forma interactiva en la CLI, ahora sin interfaz mediante tu agente.
    - Retoma trabajo interrumpido por un reinicio del Gateway o un tiempo de espera por inactividad.

    Notas:

    - `resumeSessionId` solo se aplica cuando `runtime: "acp"`; el runtime de subagente predeterminado ignora este campo exclusivo de ACP.
    - `streamTo` solo se aplica cuando `runtime: "acp"`; el runtime de subagente predeterminado ignora este campo exclusivo de ACP.
    - `resumeSessionId` es un id de reanudación ACP/harness local al host, no una clave de sesión de canal de OpenClaw; OpenClaw sigue comprobando la política de creación ACP y la política del agente de destino antes del despacho, mientras que el backend ACP o el harness son responsables de la autorización para cargar ese id ascendente.
    - `resumeSessionId` restaura el historial de conversación ACP ascendente; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, por lo que `mode: "session"` sigue requiriendo `thread: true`.
    - El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
    - Si no se encuentra el id de sesión, la creación falla con un error claro, sin recurrir silenciosamente a una nueva sesión.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Después de desplegar un Gateway, ejecuta una comprobación integral en vivo en lugar de
    confiar en las pruebas unitarias:

    1. Verifica la versión y el commit del Gateway desplegado en el host de destino.
    2. Abre una sesión temporal de puente ACPX hacia un agente en vivo.
    3. Pide a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` real y ningún error de validador.
    5. Limpia la sesión temporal de puente.

    Mantén la compuerta en `mode: "run"` y omite `streamTo: "parent"`:
    las rutas vinculadas a hilos de `mode: "session"` y de retransmisión de streams son
    pases de integración más completos y separados.

  </Accordion>
</AccordionGroup>

## Compatibilidad con sandbox

Actualmente, las sesiones ACP se ejecutan en el runtime del host, **no** dentro del
sandbox de OpenClaw.

<Warning>
**Límite de seguridad:**

- El harness externo puede leer/escribir según sus propios permisos de CLI y el `cwd` seleccionado.
- La política de sandbox de OpenClaw **no** envuelve la ejecución del harness ACP.
- OpenClaw sigue aplicando compuertas de funciones ACP, agentes permitidos, propiedad de sesión, enlaces de canal y política de entrega del Gateway.
- Usa `runtime: "subagent"` para trabajo nativo de OpenClaw aplicado por sandbox.

</Warning>

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, las creaciones ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.

## Resolución del destino de sesión

La mayoría de acciones `/acp` aceptan un destino de sesión opcional (`session-key`,
`session-id` o `session-label`).

**Orden de resolución:**

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - prueba la clave
   - luego el id de sesión con forma de UUID
   - luego la etiqueta
2. Enlace del hilo actual (si esta conversación/hilo está enlazado a una sesión ACP).
3. Reserva de la sesión solicitante actual.

Los enlaces de la conversación actual y los enlaces de hilo participan ambos en
el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | Qué hace                                                    | Ejemplo                                                       |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; enlace actual o de hilo opcional.      | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso para la sesión de destino.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía instrucción de dirección a la sesión en ejecución.    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula destinos de hilo.             | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de runtime y capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo de runtime para la sesión de destino.     | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opción de configuración de runtime.   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la anulación del directorio de trabajo del runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de política de aprobación.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del runtime (segundos).       | `/acp timeout 120`                                            |
| `/acp model`         | Establece la anulación del modelo del runtime.              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina anulaciones de opciones de runtime de la sesión.    | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sesiones ACP recientes desde el almacén.              | `/acp sessions`                                               |
| `/acp doctor`        | Salud del backend, capacidades y correcciones accionables.  | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación.  | `/acp install`                                                |

`/acp status` muestra las opciones de runtime efectivas junto con identificadores de sesión
a nivel de runtime y de backend. Los errores de controles no admitidos aparecen
claramente cuando un backend carece de una capacidad. `/acp sessions` lee el
almacén para la sesión enlazada actual o solicitante; los tokens de destino
(`session-key`, `session-id` o `session-label`) se resuelven mediante
descubrimiento de sesiones del Gateway, incluidas raíces personalizadas `session.store`
por agente.

### Asignación de opciones de runtime

`/acp` tiene comandos de conveniencia y un configurador genérico. Operaciones
equivalentes:

| Comando                      | Se asigna a                          | Notas                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | clave de configuración de runtime `model` | Para Codex ACP, OpenClaw normaliza `openai/<model>` al id de modelo del adaptador y asigna sufijos de razonamiento con barra como `openai/gpt-5.4/high` a `reasoning_effort`.                            |
| `/acp set thinking <level>`  | opción canónica `thinking`           | OpenClaw envía el equivalente anunciado por el backend cuando está presente, prefiriendo `thinking`, luego `effort`, `reasoning_effort` o `thought_level`. Para Codex ACP, el adaptador asigna valores a `reasoning_effort`. |
| `/acp permissions <profile>` | opción canónica `permissionProfile`  | OpenClaw envía el equivalente anunciado por el backend cuando está presente, como `approval_policy`, `permission_profile`, `permissions` o `permission_mode`.                                            |
| `/acp timeout <seconds>`     | opción canónica `timeoutSeconds`     | OpenClaw envía el equivalente anunciado por el backend cuando está presente, como `timeout` o `timeout_seconds`.                                                                                           |
| `/acp cwd <path>`            | anulación de cwd del runtime         | Actualización directa.                                                                                                                                                                                     |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa la ruta de anulación de cwd.                                                                                                                                                                  |
| `/acp reset-options`         | borra todas las anulaciones de runtime | -                                                                                                                                                                                                          |

## Harness acpx, configuración de Plugin y permisos

Para la configuración del harness acpx (alias de Claude Code / Codex / Gemini CLI),
los puentes MCP plugin-tools y OpenClaw-tools, y los modos de permisos ACP,
consulta
[agentes ACP - configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                     | Causa probable                                                                                                           | Solución                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Falta el Plugin de backend, está deshabilitado o está bloqueado por `plugins.allow`.                                                       | Instala y habilita el Plugin de backend, incluye `acpx` en `plugins.allow` cuando esa lista de permitidos esté configurada y luego ejecuta `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP está deshabilitado globalmente.                                                                                                 | Configura `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | El despacho automático desde mensajes normales de hilo está deshabilitado.                                                               | Configura `acp.dispatch.enabled=true` para reanudar el enrutamiento automático de hilos; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | El agente no está en la lista de permitidos.                                                                                                | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` informa que el backend no está listo justo después del inicio                 | Falta el Plugin de backend, está deshabilitado, está bloqueado por una política de permitir/denegar, o su ejecutable configurado no está disponible.        | Instala/habilita el Plugin de backend, vuelve a ejecutar `/acp doctor` e inspecciona el error de instalación del backend o de política si sigue en mal estado.                                           |
| No se encuentra el comando del harness                                                   | La CLI del adaptador no está instalada, falta el Plugin externo o falló la obtención inicial de `npx` para un adaptador que no es Codex. | Ejecuta `/acp doctor`, instala/precalienta el adaptador en el host del Gateway o configura explícitamente el comando del agente acpx.                                                      |
| Modelo no encontrado desde el harness                                            | El id de modelo es válido para otro proveedor/harness, pero no para este destino ACP.                                                | Usa un modelo listado por ese harness, configura el modelo en el harness u omite la anulación.                                                                            |
| Error de autenticación del proveedor desde el harness                                          | OpenClaw está en buen estado, pero la CLI/proveedor de destino no ha iniciado sesión.                                                     | Inicia sesión o proporciona la clave de proveedor requerida en el entorno del host del Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token de clave/id/etiqueta incorrecto.                                                                                                | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | Se usó `--bind here` sin una conversación activa vinculable.                                                            | Muévete al chat/canal de destino y vuelve a intentarlo, o usa un spawn sin vincular.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | El adaptador carece de la capacidad de vinculación ACP de la conversación actual.                                                             | Usa `/acp spawn ... --thread ...` donde sea compatible, configura `bindings[]` de nivel superior o muévete a un canal compatible.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | Se usó `--thread here` fuera de un contexto de hilo.                                                                         | Muévete al hilo de destino o usa `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Otro usuario es propietario del destino de vinculación activo.                                                                           | Vuelve a vincular como propietario o usa una conversación o hilo diferente.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | El adaptador carece de capacidad de vinculación de hilos.                                                                               | Usa `--thread off` o muévete a un adaptador/canal compatible.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | El runtime ACP está del lado del host; la sesión solicitante está en sandbox.                                                              | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta ACP spawn desde una sesión sin sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Se solicitó `sandbox="require"` para el runtime ACP.                                                                         | Usa `runtime="subagent"` para sandboxing requerido, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | El harness de destino no expone el cambio genérico de modelo ACP.                                                        | Usa un harness que anuncie `models`/`session/set_model` de ACP, usa referencias de modelo ACP de Codex o configura el modelo directamente en el harness si tiene su propia marca de inicio. |
| Faltan metadatos ACP para la sesión vinculada                                      | Metadatos de sesión ACP obsoletos/eliminados.                                                                                    | Vuelve a crearla con `/acp spawn` y luego vuelve a vincular/enfocar el hilo.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloquea escrituras/exec en una sesión ACP no interactiva.                                                    | Configura `plugins.entries.acpx.config.permissionMode` como `approve-all` y reinicia el Gateway. Consulta [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| La sesión ACP falla al inicio con poca salida                                  | Las solicitudes de permiso están bloqueadas por `permissionMode`/`nonInteractivePermissions`.                                        | Revisa los logs del Gateway para buscar `AcpRuntimeError`. Para permisos completos, configura `permissionMode=approve-all`; para degradación gradual, configura `nonInteractivePermissions=deny`.        |
| La sesión ACP se queda bloqueada indefinidamente después de completar el trabajo                       | El proceso del harness finalizó, pero la sesión ACP no informó la finalización.                                                    | Actualiza OpenClaw; la limpieza actual de acpx recoge los procesos wrapper y adaptador obsoletos propiedad de OpenClaw al cerrar y al iniciar el Gateway.                                             |
| El harness ve `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | La envoltura de evento interna se filtró a través del límite ACP.                                                                | Actualiza OpenClaw y vuelve a ejecutar el flujo de finalización; los harnesses externos solo deberían recibir prompts de finalización simples.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` pertenece al
relay de hook nativo de Codex, no a ACP/acpx. En un chat de Codex vinculado, inicia una
sesión nueva con `/new` o `/reset`; si funciona una vez y luego vuelve en la siguiente
llamada a herramienta nativa, reinicia el servidor de la app de Codex o el Gateway de OpenClaw en lugar de
repetir `/new`. Consulta [Solución de problemas del harness de Codex](/es/plugins/codex-harness#troubleshooting).
</Note>

## Relacionado

- [Agentes ACP: configuración](/es/tools/acp-agents-setup)
- [Envío de agente](/es/tools/agent-send)
- [Backends de CLI](/es/gateway/cli-backends)
- [Harness de Codex](/es/plugins/codex-harness)
- [Runtime del harness de Codex](/es/plugins/codex-harness-runtime)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo puente)](/es/cli/acp)
- [Subagentes](/es/tools/subagents)
