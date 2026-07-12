---
read_when:
    - Ejecución de entornos de programación mediante ACP
    - Configuración de sesiones ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de un canal de mensajería a una sesión ACP persistente
    - Solución de problemas del backend de ACP, la conexión del Plugin o la entrega de finalizaciones
    - Uso de comandos /acp desde el chat
sidebarTitle: ACP agents
summary: Ejecuta entornos externos de programación (Claude Code, Cursor, Gemini CLI, Codex ACP explícito, OpenClaw ACP, OpenCode) mediante el backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-07-11T23:33:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

Las sesiones del [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permiten que
OpenClaw ejecute entornos externos de programación (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI y otros entornos ACPX compatibles)
mediante un plugin de backend ACP. Cada inicio se registra como una
[tarea en segundo plano](/es/automation/tasks).

<Note>
**ACP es la vía para entornos externos, no la vía predeterminada de Codex.** El plugin
nativo del servidor de aplicaciones de Codex controla los comandos `/codex ...` y el entorno
integrado predeterminado `openai/gpt-*` para los turnos del agente; ACP controla los comandos
`/acp ...` y las sesiones `sessions_spawn({ runtime: "acp" })`.

Para permitir que Codex o Claude Code se conecten directamente como clientes MCP externos a
conversaciones existentes de canales de OpenClaw, usa
[`openclaw mcp serve`](/es/cli/mcp) en lugar de ACP.
</Note>

## ¿Qué página necesito?

| Quieres...                                                                                              | Usa esto                              | Notas                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular o controlar Codex en la conversación actual                                                    | `/codex bind`, `/codex threads`       | Vía nativa del servidor de aplicaciones de Codex cuando el plugin `codex` está habilitado: respuestas del chat vinculado, reenvío de imágenes, modelo/modo rápido/permisos, detención y orientación. ACP es una alternativa explícita |
| Ejecutar Claude Code, Gemini CLI, Codex ACP explícitamente u otro entorno externo _mediante_ OpenClaw   | Esta página                           | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano y controles del entorno                                                                       |
| Exponer una sesión de Gateway de OpenClaw _como_ servidor ACP para un editor o cliente                  | [`openclaw acp`](/es/cli/acp)            | Modo puente: un IDE/cliente se comunica mediante ACP con OpenClaw a través de stdio/WebSocket                                                                                                          |
| Reutilizar una CLI local de IA como modelo alternativo de solo texto                                    | [Backends de CLI](/es/gateway/cli-backends) | No es ACP: no dispone de herramientas de OpenClaw, controles de ACP ni entorno de ejecución                                                                                                         |

## ¿Funciona sin configuración adicional?

Sí, después de instalar el plugin oficial del entorno ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Los repositorios de código fuente pueden usar el plugin local del espacio de trabajo
`extensions/acpx` después de ejecutar `pnpm install`. Ejecuta `/acp doctor` para comprobar
que todo esté listo.

OpenClaw solo informa a los agentes sobre el inicio de ACP cuando ACP es **realmente utilizable**:
ACP debe estar habilitado, el envío no debe estar deshabilitado, la sesión actual no debe
estar bloqueada por el entorno aislado y debe haber un backend de ejecución cargado y en buen estado. Si
alguna condición falla, las Skills de ACP y las instrucciones de ACP para `sessions_spawn`
permanecen ocultas, de modo que el agente no sugiera un backend no disponible.

<AccordionGroup>
  <Accordion title="Problemas frecuentes en la primera ejecución">
    - Si se ha definido `plugins.allow`, funciona como un inventario restrictivo de plugins y **debe** incluir `acpx`; de lo contrario, el backend ACP instalado se bloquea de manera intencionada (`/acp doctor` informa de que falta la entrada en la lista de permitidos).
    - El adaptador ACP de Codex se distribuye con el plugin `acpx` y se inicia localmente cuando es posible.
    - Codex ACP se ejecuta con un `CODEX_HOME` aislado. OpenClaw copia desde la configuración de Codex del anfitrión las entradas de confianza de proyectos y la configuración segura de enrutamiento de modelos/proveedores (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` y los campos seguros de `model_providers.<name>`); la autenticación, las notificaciones y los enlaces permanecen únicamente en la configuración del anfitrión.
    - Otros adaptadores de entornos de destino pueden descargarse bajo demanda mediante `npx` durante el primer uso.
    - La autenticación del proveedor ya debe existir en el anfitrión para ese entorno.
    - Si el anfitrión no tiene npm ni acceso a la red, las descargas de adaptadores durante la primera ejecución fallarán hasta que las cachés se precarguen o el adaptador se instale de otra manera.

  </Accordion>
  <Accordion title="Requisitos previos del entorno de ejecución">
    ACP inicia un proceso real de un entorno externo. OpenClaw controla el enrutamiento,
    el estado de las tareas en segundo plano, la entrega, las vinculaciones y las políticas; el entorno controla
    su inicio de sesión con el proveedor, catálogo de modelos, comportamiento del sistema de archivos y herramientas nativas.

    Antes de responsabilizar a OpenClaw, verifica lo siguiente:

    - `/acp doctor` informa de un backend habilitado y en buen estado.
    - El identificador de destino está permitido por `acp.allowedAgents` cuando se ha definido esa lista de permitidos.
    - El comando del entorno puede iniciarse en el anfitrión del Gateway.
    - La autenticación del proveedor está disponible para ese entorno (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - El modelo seleccionado existe para ese entorno; los identificadores de modelos no son intercambiables entre entornos.
    - El `cwd` solicitado existe y es accesible; de lo contrario, omite `cwd` y permite que el backend use su valor predeterminado.
    - El modo de permisos coincide con el trabajo. Las sesiones no interactivas no pueden hacer clic en solicitudes nativas de permisos, por lo que las ejecuciones de programación que realizan muchas operaciones de escritura o ejecución suelen necesitar un perfil de permisos ACPX que pueda continuar sin interfaz interactiva.

  </Accordion>
</AccordionGroup>

Las herramientas de plugins de OpenClaw y las herramientas integradas de OpenClaw **no** se
exponen de manera predeterminada a los entornos ACP. Habilita los puentes MCP explícitos en
[Configuración de agentes ACP](/es/tools/acp-agents-setup) solo cuando el entorno deba
invocar esas herramientas directamente.

## Destinos de entornos compatibles

Con el backend `acpx`, usa estos identificadores como destinos para `/acp spawn <id>` o
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identificador del entorno | Backend habitual                                | Notas                                                                                              |
| ------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `claude`                  | Adaptador ACP de Claude Code                    | Requiere autenticación de Claude Code en el anfitrión.                                             |
| `codex`                   | Adaptador ACP de Codex                          | Solo es una alternativa ACP explícita cuando `/codex` nativo no está disponible o se solicita ACP. |
| `copilot`                 | Adaptador ACP de GitHub Copilot                 | Requiere autenticación de la CLI o del entorno de Copilot.                                         |
| `cursor`                  | ACP de Cursor CLI (`cursor-agent acp`)          | Sustituye el comando de acpx si una instalación local expone otro punto de entrada ACP.             |
| `droid`                   | Factory Droid CLI                               | Requiere autenticación de Factory/Droid o `FACTORY_API_KEY` en el entorno del proceso.              |
| `fast-agent`              | Adaptador ACP fast-agent-mcp                    | Se descarga bajo demanda mediante `uvx`.                                                           |
| `gemini`                  | Adaptador ACP de Gemini CLI                     | Requiere autenticación de Gemini CLI o la configuración de una clave de API.                        |
| `iflow`                   | iFlow CLI                                       | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada.               |
| `kilocode`                | Kilo Code CLI                                   | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada.               |
| `kimi`                    | Kimi/Moonshot CLI                               | Requiere autenticación de Kimi/Moonshot en el anfitrión.                                           |
| `kiro`                    | Kiro CLI                                        | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada.               |
| `mux`                     | Adaptador ACP de Mux CLI                        | Se descarga bajo demanda mediante `npx`.                                                           |
| `opencode`                | Adaptador ACP de OpenCode                       | Requiere autenticación de la CLI o del proveedor de OpenCode.                                      |
| `openclaw`                | Puente de Gateway de OpenClaw mediante `openclaw acp` | Permite que un entorno compatible con ACP se comunique con una sesión de Gateway de OpenClaw. |
| `qoder`                   | Qoder CLI                                       | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada.               |
| `qwen`                    | Qwen Code / Qwen CLI                            | Requiere autenticación compatible con Qwen en el anfitrión.                                        |
| `trae`                    | Adaptador ACP de Trae CLI                       | La disponibilidad del adaptador y el control del modelo dependen de la CLI instalada.               |

`pi` (pi-acp) también está registrado en el backend acpx, pero no es un entorno de
programación en el mismo sentido que los anteriores.

Los alias personalizados de agentes acpx pueden configurarse en el propio acpx, pero la política
de OpenClaw sigue comprobando `acp.allowedAgents` y cualquier asignación
`agents.list[].runtime.acp.agent` antes del envío.

## Guía operativa

Flujo rápido de `/acp` desde el chat:

<Steps>
  <Step title="Iniciar">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` o, de forma explícita,
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Trabajar">
    Continúa en la conversación o el hilo vinculado (o especifica de manera
    explícita la clave de sesión).
  </Step>
  <Step title="Comprobar el estado">
    `/acp status`
  </Step>
  <Step title="Ajustar">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Orientar">
    Sin sustituir el contexto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Detener">
    `/acp cancel` (turno actual) o `/acp close` (sesión y vinculaciones).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detalles del ciclo de vida">
    - El inicio crea o reanuda una sesión del entorno ACP, registra los metadatos de ACP en el almacén de sesiones de OpenClaw y puede crear una tarea en segundo plano cuando la ejecución pertenece a la tarea principal.
    - Las sesiones ACP que pertenecen a la tarea principal se tratan como trabajo en segundo plano incluso cuando la sesión del entorno es persistente; la finalización y la entrega entre superficies pasan por el notificador de la tarea principal en lugar de comportarse como una sesión de chat normal visible para el usuario.
    - El mantenimiento de tareas cierra las sesiones ACP de una sola ejecución, terminales o huérfanas, que pertenecen a la tarea principal. Las sesiones ACP persistentes se conservan mientras exista una vinculación activa con una conversación; las sesiones persistentes obsoletas sin una vinculación activa se cierran para impedir que se reanuden de forma silenciosa después de que termine la tarea propietaria o desaparezca su registro.
    - Los mensajes posteriores vinculados van directamente a la sesión ACP hasta que la vinculación se cierre, pierda el foco, se restablezca o caduque.
    - Los comandos del Gateway permanecen en el ámbito local. `/acp ...`, `/status` y `/unfocus` nunca se envían como texto normal de una solicitud a un entorno ACP vinculado.
    - `cancel` cancela el turno activo cuando el backend admite la cancelación; no elimina la vinculación ni los metadatos de la sesión.
    - `close` finaliza la sesión ACP desde el punto de vista de OpenClaw y elimina la vinculación. Un entorno puede conservar su propio historial en el servicio de origen si admite la reanudación.
    - El plugin acpx limpia los árboles de procesos contenedores y adaptadores propiedad de OpenClaw después de `close`, y elimina los procesos ACPX huérfanos y obsoletos propiedad de OpenClaw durante el inicio del Gateway.
    - Los procesos inactivos del entorno pueden eliminarse después de `acp.runtime.ttlMinutes`; los metadatos almacenados de la sesión siguen disponibles para `/acp sessions`.

  </Accordion>
  <Accordion title="Reglas de enrutamiento nativo de Codex">
    Activadores en lenguaje natural que deben dirigirse al **plugin nativo de Codex**
    cuando esté habilitado:

    - "Vincula este canal de Discord con Codex".
    - "Asocia este chat al hilo `<id>` de Codex".
    - "Muestra los hilos de Codex y después vincula este".

    La vinculación nativa de conversaciones de Codex es la ruta predeterminada de control del chat.
    Las herramientas dinámicas de OpenClaw siguen ejecutándose mediante OpenClaw, mientras que las
    herramientas nativas de Codex, como shell/apply-patch, se ejecutan dentro de Codex. Para los
    eventos de herramientas nativas de Codex, OpenClaw inyecta un relé de hooks nativos por turno para
    que los hooks de los plugins puedan bloquear `before_tool_call`, observar `after_tool_call` y
    enrutar los eventos `PermissionRequest` de Codex mediante las aprobaciones de OpenClaw. Los hooks
    `Stop` de Codex se retransmiten a `before_agent_finalize` de OpenClaw, donde los plugins pueden
    solicitar una pasada adicional del modelo antes de que Codex finalice su respuesta. El relé se
    mantiene deliberadamente conservador: no modifica los argumentos de las herramientas nativas de
    Codex ni reescribe los registros de hilos de Codex. Usa ACP explícitamente solo cuando quieras el
    modelo de entorno de ejecución/sesión de ACP. El límite de compatibilidad integrada con Codex se
    documenta en el
    [contrato de compatibilidad v1 del entorno de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Guía rápida para seleccionar modelo/proveedor/entorno de ejecución">
    - referencias heredadas de modelos de Codex - ruta heredada de modelos de suscripción/OAuth de Codex reparada por doctor.
    - `openai/*` - entorno de ejecución integrado del servidor de aplicaciones nativo de Codex para los turnos del agente de OpenAI.
    - `/codex ...` - control nativo de conversaciones de Codex.
    - `/acp ...` o `runtime: "acp"` - control explícito mediante ACP/acpx.

  </Accordion>
  <Accordion title="Activadores en lenguaje natural para el enrutamiento a ACP">
    Activadores que deben enrutar al entorno de ejecución de ACP:

    - "Ejecuta esto como una sesión única de Claude Code mediante ACP y resume el resultado."
    - "Usa Gemini CLI para esta tarea en un hilo y conserva los seguimientos en ese mismo hilo."
    - "Ejecuta Codex mediante ACP en un hilo en segundo plano."

    OpenClaw selecciona `runtime: "acp"`, resuelve el `agentId` del entorno,
    se vincula a la conversación o al hilo actuales cuando sea compatible y
    enruta los seguimientos a esa sesión hasta que se cierre o caduque. Codex
    solo sigue esta ruta cuando ACP/acpx es explícito o el plugin nativo de
    Codex no está disponible para la operación solicitada.

    Para `sessions_spawn`, `runtime: "acp"` solo se anuncia cuando ACP está
    habilitado, el solicitante no está aislado y se ha cargado un backend del
    entorno de ejecución de ACP. `acp.dispatch.enabled=false` pausa el envío
    automático de hilos de ACP, pero no oculta ni bloquea las llamadas
    explícitas a `sessions_spawn({ runtime: "acp" })`. Se dirige a identificadores
    de entornos ACP como `codex`, `claude`, `droid`, `gemini` u `opencode`.
    No pases un identificador normal de agente de configuración de OpenClaw
    obtenido de `agents_list`, salvo que esa entrada esté configurada
    explícitamente con `agents.list[].runtime.type="acp"`; de lo contrario,
    usa el entorno de ejecución predeterminado de subagentes. Cuando un agente
    de OpenClaw está configurado con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` como identificador del entorno subyacente.

  </Accordion>
</AccordionGroup>

## ACP frente a subagentes

Usa ACP cuando quieras un entorno de ejecución externo. Usa el **servidor de
aplicaciones nativo de Codex** para vincular y controlar conversaciones de
Codex cuando el plugin `codex` esté habilitado. Usa **subagentes** cuando
quieras ejecuciones delegadas nativas de OpenClaw.

| Área                | Sesión ACP                                | Ejecución de subagente                    |
| ------------------- | ----------------------------------------- | ----------------------------------------- |
| Entorno de ejecución | Plugin del backend de ACP (por ejemplo, acpx) | Entorno nativo de subagentes de OpenClaw |
| Clave de sesión     | `agent:<agentId>:acp:<uuid>`              | `agent:<agentId>:subagent:<uuid>`         |
| Comandos principales | `/acp ...`                               | `/subagents ...`                          |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (entorno predeterminado) |

Consulta también [Subagentes](/es/tools/subagents).

## Cómo ejecuta ACP Claude Code

Para Claude Code mediante ACP, la pila es:

1. Plano de control de sesiones ACP de OpenClaw.
2. Plugin oficial del entorno de ejecución `@openclaw/acpx`.
3. Adaptador ACP de Claude.
4. Maquinaria de entorno de ejecución/sesión del lado de Claude.

Claude mediante ACP es una **sesión del entorno** con controles de ACP,
reanudación de sesiones, seguimiento de tareas en segundo plano y vinculación
opcional a conversaciones/hilos.

Los backends de CLI son entornos locales alternativos independientes y
exclusivamente de texto; consulta [Backends de CLI](/es/gateway/cli-backends).

Para los operadores, la regla práctica es:

- **¿Quieres `/acp spawn`, sesiones vinculables, controles del entorno de ejecución o trabajo persistente en el entorno?** Usa ACP.
- **¿Quieres una alternativa local sencilla de texto mediante la CLI sin procesar?** Usa backends de CLI.

## Sesiones vinculadas

### Modelo mental

- **Superficie de chat** - donde las personas continúan conversando (canal de Discord, tema de Telegram, chat de iMessage).
- **Sesión ACP** - el estado persistente del entorno de ejecución de Codex/Claude/Gemini al que OpenClaw dirige los mensajes.
- **Hilo/tema secundario** - una superficie de mensajería adicional opcional creada solo mediante `--thread ...`.
- **Espacio de trabajo del entorno de ejecución** - la ubicación del sistema de archivos (`cwd`, copia de trabajo del repositorio, espacio de trabajo del backend) donde se ejecuta el entorno. Es independiente de la superficie de chat.

### Vinculaciones con la conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la sesión ACP
creada, sin hilo secundario y en la misma superficie de chat. OpenClaw sigue
controlando el transporte, la autenticación, la seguridad y la entrega. Los
mensajes posteriores de esa conversación se dirigen a la misma sesión; `/new`
y `/reset` restablecen la sesión sin reemplazarla; `/acp close` elimina la
vinculación.

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
    - `--bind here` solo funciona en canales que anuncian compatibilidad con la vinculación a la conversación actual; de lo contrario, OpenClaw devuelve un mensaje claro de incompatibilidad. Las vinculaciones persisten tras reiniciar el Gateway.
    - En Discord, `spawnSessions` controla la creación de hilos secundarios para `--thread auto|here`, pero no para `--bind here`.
    - Si creas una sesión para otro agente ACP sin `--cwd`, OpenClaw hereda de forma predeterminada el espacio de trabajo **del agente de destino**. Si las rutas heredadas no existen (`ENOENT`/`ENOTDIR`), se utiliza el valor predeterminado del backend; otros errores de acceso (por ejemplo, `EACCES`) se muestran como errores de creación.
    - Los comandos de administración del Gateway permanecen locales en las conversaciones vinculadas: OpenClaw gestiona los comandos `/acp ...` incluso cuando el texto normal de seguimiento se dirige a la sesión ACP vinculada; `/status` y `/unfocus` también permanecen locales siempre que la gestión de comandos esté habilitada para esa superficie.

  </Accordion>
  <Accordion title="Sesiones vinculadas a hilos">
    Cuando las vinculaciones de hilos están habilitadas para un adaptador de canal:

    - OpenClaw vincula un hilo a una sesión ACP de destino.
    - Los mensajes posteriores de ese hilo se dirigen a la sesión ACP vinculada.
    - La salida de ACP se entrega al mismo hilo.
    - Al quitar el enfoque, cerrar, archivar o alcanzar el tiempo límite de inactividad o la antigüedad máxima, se elimina la vinculación.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` y `/unfocus` son comandos del Gateway, no instrucciones para el entorno ACP.

    Indicadores de función necesarios para ACP vinculado a hilos:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` está activado de forma predeterminada (configúralo como `false` para pausar el envío automático de hilos de ACP; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando).
    - Creación de sesiones de hilo del adaptador de canal habilitada (valor predeterminado: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    La compatibilidad con la vinculación de hilos depende del adaptador. Si el
    adaptador de canal activo no admite vinculaciones de hilos, OpenClaw
    devuelve un mensaje claro indicando que no se admite o no está disponible.

  </Accordion>
  <Accordion title="Canales compatibles con hilos">
    - Cualquier adaptador de canal que exponga la capacidad de vincular sesiones/hilos.
    - Compatibilidad integrada actual: hilos/canales de **Discord** y temas de **Telegram** (temas de foro en grupos/supergrupos y temas de mensajes directos).
    - Los canales de plugins pueden añadir compatibilidad mediante la misma interfaz de vinculación.

  </Accordion>
</AccordionGroup>

## Vinculaciones persistentes de canales

Para flujos de trabajo no efímeros, configura vinculaciones ACP persistentes
en las entradas `bindings[]` del nivel superior.

### Modelo de vinculación

<ParamField path="bindings[].type" type='"acp"'>
  Marca una vinculación persistente de conversación ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversación de destino. Formatos según el canal:

- **Canal/hilo de Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/mensaje directo de Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Da preferencia a los identificadores estables de Slack; las vinculaciones de canales también coinciden con las respuestas dentro de los hilos de ese canal.
- **Tema de foro de Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Mensaje directo/grupo de WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Usa números E.164 como `+15555550123` para chats directos e identificadores JID de grupos de WhatsApp como `120363424282127706@g.us` para grupos.
- **Mensaje directo/grupo de iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Da preferencia a `chat_id:*` para vinculaciones estables de grupos.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  El identificador del agente propietario de OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Sobrescritura opcional de ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etiqueta opcional orientada al operador.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directorio de trabajo opcional del entorno de ejecución.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Sobrescritura opcional del backend.
</ParamField>

### Valores predeterminados del entorno de ejecución por agente

Usa `agents.list[].runtime` para definir una sola vez los valores predeterminados
de ACP de cada agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identificador del entorno, por ejemplo, `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedencia de las sobrescrituras para las sesiones ACP vinculadas:**

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
- Los mensajes de ese canal, tema o chat se dirigen a la sesión ACP configurada.
- Los enlaces ACP configurados son propietarios de la ruta de su sesión. La distribución de difusión del canal no sustituye la sesión ACP configurada para un enlace coincidente.
- En las conversaciones enlazadas, `/new` y `/reset` restablecen la misma clave de sesión ACP sin sustituirla.
- Los enlaces temporales del entorno de ejecución (por ejemplo, los creados por flujos de enfoque de hilos) siguen aplicándose cuando están presentes.
- Para creaciones de ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Si no existen las rutas heredadas del espacio de trabajo, se utiliza como alternativa el cwd predeterminado del backend; los errores de acceso a rutas existentes se muestran como errores de creación.

## Iniciar sesiones ACP

Hay dos formas de iniciar una sesión ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    Usa `runtime: "acp"` para iniciar una sesión ACP desde un turno del agente o
    una llamada a una herramienta.

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
    El valor predeterminado de `runtime` es `subagent`, por lo que debes establecer
    `runtime: "acp"` explícitamente para las sesiones ACP. Si se omite `agentId`,
    OpenClaw usa `acp.defaultAgent` cuando está configurado. `mode: "session"`
    requiere `thread: true` para mantener una conversación enlazada persistente.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Usa `/acp spawn` para disponer de control explícito del operador desde el chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Opciones principales:

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
  Instrucción inicial enviada a la sesión ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Debe ser `"acp"` para las sesiones ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Identificador del entorno ACP de destino. Utiliza `acp.defaultAgent` como alternativa si está establecido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita el flujo de enlace a un hilo cuando sea compatible.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` es de ejecución única; `"session"` es persistente. Si `thread: true` y
  se omite `mode`, OpenClaw puede usar de forma predeterminada el comportamiento
  persistente según la ruta del entorno de ejecución. `mode: "session"` requiere `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directorio de trabajo solicitado para el entorno de ejecución (validado por la política del backend o del entorno de ejecución).
  Si se omite, la creación de ACP hereda el espacio de trabajo del agente de destino cuando está configurado;
  si no existen las rutas heredadas, se utilizan los valores predeterminados del backend, mientras que se
  devuelven los errores de acceso reales.
</ParamField>
<ParamField path="label" type="string">
  Etiqueta orientada al operador que se usa en el texto de la sesión o del encabezado.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Reanuda una sesión ACP existente en lugar de crear una nueva. El agente
  reproduce su historial de conversación mediante `session/load`. Requiere
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite los resúmenes iniciales del progreso de la ejecución ACP a la sesión
  solicitante como eventos del sistema. Las respuestas aceptadas incluyen `streamLogPath`,
  que apunta a un registro JSONL con ámbito de sesión (`<sessionId>.acp-stream.jsonl`) que
  puedes seguir para consultar el historial completo de retransmisión. De forma predeterminada,
  los flujos de progreso hacia el padre muestran los comentarios del asistente y el progreso
  del estado de ACP, salvo que `streaming.progress.commentary=false`. Discord también utiliza
  de forma predeterminada el modo de progreso para las vistas previas del padre cuando no se
  configura ningún modo de transmisión. El progreso del estado sigue respetando
  `acp.stream.tagVisibility`, por lo que etiquetas como `plan` permanecen ocultas salvo que
  se habiliten explícitamente.
</ParamField>

Las ejecuciones de `sessions_spawn` de ACP usan `agents.defaults.subagents.runTimeoutSeconds`
como límite predeterminado del turno secundario. La herramienta no acepta anulaciones del
tiempo de espera por llamada (`runTimeoutSeconds`/`timeoutSeconds` se rechazan con un error
que indica que debe configurarse el valor predeterminado).

<ParamField path="model" type="string">
  Anulación explícita del modelo para la sesión ACP secundaria. Las creaciones ACP de Codex
  normalizan referencias de OpenAI como `openai/gpt-5.4` en la configuración de inicio de ACP
  de Codex antes de `session/new`; las formas con barra, como `openai/gpt-5.4/high`, también
  establecen el nivel de razonamiento de ACP de Codex. Cuando se omite,
  `sessions_spawn({ runtime: "acp" })` usa los valores predeterminados existentes del modelo
  de los subagentes (`agents.defaults.subagents.model` o `agents.list[].subagents.model`)
  cuando están configurados; de lo contrario, permite que el entorno ACP use su propio modelo
  predeterminado. Los demás entornos deben anunciar `models` de ACP y admitir
  `session/set_model`; de lo contrario, OpenClaw/acpx falla de forma clara en vez de utilizar
  silenciosamente como alternativa el valor predeterminado del agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Nivel explícito de pensamiento o razonamiento. Para ACP de Codex, `minimal` se asigna a un
  nivel bajo, `low`/`medium`/`high`/`xhigh` se asignan directamente y `off` omite la anulación
  del nivel de razonamiento durante el inicio. Cuando se omite, las creaciones de ACP usan los
  valores predeterminados existentes de pensamiento de los subagentes y
  `agents.defaults.models["provider/model"].params.thinking` por modelo para el modelo
  seleccionado.
</ParamField>

## Modos de enlace e hilo de la creación

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamiento                                                                     |
    | ------ | ---------------------------------------------------------------------------------- |
    | `here` | Enlaza la conversación activa actual sin sustituirla; falla si no hay ninguna activa. |
    | `off`  | No crea un enlace con la conversación actual.                                      |

    Notas:

    - `--bind here` es la ruta más sencilla para que el operador «haga que este canal o chat use Codex».
    - `--bind here` no crea un hilo secundario.
    - `--bind here` solo está disponible en los canales que ofrecen compatibilidad con el enlace de la conversación actual.
    - `--bind` y `--thread` no pueden combinarse en la misma llamada a `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamiento                                                                                                  |
    | ------ | --------------------------------------------------------------------------------------------------------------- |
    | `auto` | En un hilo activo: enlaza ese hilo. Fuera de un hilo: crea o enlaza un hilo secundario cuando sea compatible. |
    | `here` | Requiere un hilo activo actual; falla si no se encuentra en uno.                                                |
    | `off`  | Sin enlace. La sesión se inicia sin enlazar.                                                                     |

    Notas:

    - En superficies de enlace que no admiten hilos, el comportamiento predeterminado equivale en la práctica a `off`.
    - La creación enlazada a un hilo requiere que la política del canal lo permita:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo secundario.

  </Tab>
</Tabs>

## Modelo de entrega

Las sesiones ACP pueden ser espacios de trabajo interactivos o trabajos en segundo plano
propiedad del padre. La ruta de entrega depende de esa modalidad.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Las sesiones interactivas están pensadas para continuar conversando en una superficie de chat visible:

    - `/acp spawn ... --bind here` enlaza la conversación actual con la sesión ACP.
    - `/acp spawn ... --thread ...` enlaza un hilo o tema del canal con la sesión ACP.
    - Los `bindings[].type="acp"` persistentes configurados dirigen las conversaciones coincidentes a la misma sesión ACP.

    Los mensajes posteriores de la conversación enlazada se dirigen directamente a la sesión
    ACP, y la salida de ACP se devuelve a ese mismo canal, hilo o tema.

    Lo que OpenClaw envía al entorno:

    - Los mensajes posteriores enlazados normales se envían como texto de instrucción, junto con archivos adjuntos solo cuando el entorno o el backend los admite.
    - Los comandos de administración `/acp` y los comandos locales del Gateway se interceptan antes de enviarlos a ACP.
    - Los eventos de finalización generados por el entorno de ejecución se materializan para cada destino. Los agentes de OpenClaw reciben el sobre interno de contexto del entorno de ejecución de OpenClaw; los entornos ACP externos reciben una instrucción sencilla con el resultado secundario y la indicación correspondiente. El sobre sin procesar `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca debe enviarse a entornos externos ni conservarse como texto de la transcripción del usuario de ACP.
    - Las entradas de la transcripción ACP usan el texto del desencadenante visible para el usuario o la instrucción sencilla de finalización. Los metadatos de eventos internos permanecen estructurados en OpenClaw siempre que sea posible y no se tratan como contenido de chat redactado por el usuario.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Las sesiones ACP de ejecución única creadas por otra ejecución de un agente son procesos
    secundarios en segundo plano, similares a los subagentes:

    - El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - El proceso secundario se ejecuta en su propia sesión del entorno ACP.
    - Los turnos secundarios se ejecutan en el mismo carril en segundo plano que usan las creaciones nativas de subagentes, por lo que un entorno ACP lento no bloquea el trabajo no relacionado de la sesión principal.
    - La finalización se comunica mediante la ruta de anuncio de finalización de tareas. OpenClaw convierte los metadatos internos de finalización en una instrucción ACP sencilla antes de enviarlos a un entorno externo, por lo que los entornos no ven los marcadores de contexto del entorno de ejecución exclusivos de OpenClaw.
    - El padre reformula el resultado secundario con la voz normal del asistente cuando resulta útil ofrecer una respuesta al usuario.

    **No** trates esta ruta como un chat entre pares entre el padre y el
    proceso secundario. El proceso secundario ya dispone de un canal de finalización hacia el padre.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` puede dirigirse a otra sesión después de la creación. Para las sesiones
    normales entre pares, OpenClaw usa una ruta de seguimiento de agente a agente (A2A)
    después de inyectar el mensaje:

    - Espera la respuesta de la sesión de destino.
    - Permite opcionalmente que el solicitante y el destino intercambien un número limitado de turnos posteriores.
    - Solicita al destino que genere un mensaje de anuncio.
    - Entrega ese anuncio al canal o hilo visible.

    Esa ruta A2A es una alternativa para los envíos entre pares en los que el remitente necesita un
    seguimiento visible. Permanece habilitada cuando una sesión no relacionada puede ver y
    enviar mensajes a un destino ACP, por ejemplo, con una configuración amplia de
    `tools.sessions.visibility`.

    OpenClaw omite el seguimiento A2A únicamente cuando el solicitante es el padre de
    su propio proceso secundario ACP de una sola ejecución, propiedad del padre. En ese caso, ejecutar A2A además
    de la finalización de la tarea puede activar al padre con el resultado del proceso secundario, reenviar
    la respuesta del padre al proceso secundario y crear un bucle de eco
    padre/proceso secundario. El resultado de `sessions_send` informa `delivery.status="skipped"` para
    ese caso de proceso secundario en propiedad porque la ruta de finalización ya es responsable
    del resultado.

  </Accordion>
  <Accordion title="Reanudar una sesión existente">
    Use `resumeSessionId` para continuar una sesión ACP anterior en lugar de
    comenzar desde cero. El agente reproduce su historial de conversación mediante
    `session/load`, por lo que continúa con todo el contexto de lo ocurrido anteriormente.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso habituales:

    - Transfiera una sesión de Codex desde su portátil a su teléfono: indique a su agente que continúe donde la dejó.
    - Continúe mediante su agente y sin interfaz una sesión de programación que inició de forma interactiva en la CLI.
    - Retome un trabajo interrumpido por un reinicio del Gateway o un tiempo de espera por inactividad.

    Notas:

    - `resumeSessionId` solo se aplica cuando `runtime: "acp"`; el entorno de ejecución predeterminado de subagentes ignora este campo exclusivo de ACP.
    - `streamTo` solo se aplica cuando `runtime: "acp"`; el entorno de ejecución predeterminado de subagentes ignora este campo exclusivo de ACP.
    - `resumeSessionId` es un identificador local del host para reanudar ACP o el arnés, no una clave de sesión de canal de OpenClaw; OpenClaw sigue comprobando la política de creación de ACP y la política del agente de destino antes de enviar la solicitud, mientras que el backend de ACP o el arnés gestiona la autorización para cargar ese identificador ascendente.
    - `resumeSessionId` restaura el historial de conversación de ACP ascendente; `thread` y `mode` se siguen aplicando normalmente a la nueva sesión de OpenClaw que está creando, por lo que `mode: "session"` sigue requiriendo `thread: true`.
    - El agente de destino debe admitir `session/load` (Codex y Claude Code lo admiten).
    - Si no se encuentra el identificador de sesión, la creación falla con un error claro, sin recurrir silenciosamente a una sesión nueva.

  </Accordion>
  <Accordion title="Prueba rápida posterior al despliegue">
    Después de desplegar un Gateway, ejecute una comprobación integral en vivo en lugar de confiar
    en las pruebas unitarias:

    1. Verifique la versión y el commit del Gateway desplegado en el host de destino.
    2. Abra una sesión puente ACPX temporal con un agente en vivo.
    3. Pida a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifique `accepted=yes`, un `childSessionKey` real y que no haya errores de validación.
    5. Cierre la sesión puente temporal.

    Mantenga la validación en `mode: "run"` y omita `streamTo: "parent"`:
    el `mode: "session"` vinculado a un hilo y las rutas de retransmisión de flujo son pruebas
    de integración más completas e independientes.

  </Accordion>
</AccordionGroup>

## Compatibilidad con el entorno aislado

Actualmente, las sesiones ACP se ejecutan en el entorno de ejecución del host, **no** dentro del entorno
aislado de OpenClaw.

<Warning>
**Límite de seguridad:**

- El arnés externo puede leer y escribir según sus propios permisos de la CLI y el `cwd` seleccionado.
- La política del entorno aislado de OpenClaw **no** encapsula la ejecución del arnés ACP.
- OpenClaw sigue aplicando los controles de habilitación de ACP, los agentes permitidos, la propiedad de las sesiones, las vinculaciones de canales y la política de entrega del Gateway.
- Use `runtime: "subagent"` para trabajo nativo de OpenClaw sujeto al entorno aislado.

</Warning>

Limitaciones actuales:

- Si la sesión solicitante está en un entorno aislado, la creación de ACP queda bloqueada tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.

## Resolución del destino de la sesión

La mayoría de las acciones de `/acp` aceptan un destino de sesión opcional (`session-key`,
`session-id` o `session-label`).

**Orden de resolución:**

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - primero prueba la clave
   - después, un identificador de sesión con formato UUID
   - por último, la etiqueta
2. Vinculación del hilo actual (si esta conversación o hilo está vinculado a una sesión ACP).
3. Recurso alternativo de la sesión solicitante actual.

Tanto las vinculaciones de la conversación actual como las del hilo participan en el paso 2.

Si no se puede resolver ningún destino, OpenClaw devuelve un error claro
(`Unable to resolve session target: ...`).

## Controles de ACP

| Comando              | Función                                                    | Ejemplo                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación actual o de hilo opcional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso de la sesión de destino.          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de orientación a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula los destinos del hilo.        | `/acp close`                                                  |
| `/acp status`        | Muestra el backend, el modo, el estado, las opciones del entorno de ejecución y las capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo del entorno de ejecución para la sesión de destino. | `/acp set-mode plan`                                          |
| `/acp set`           | Escribe una opción genérica de configuración del entorno de ejecución. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la anulación del directorio de trabajo del entorno de ejecución. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de la política de aprobación.           | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del entorno de ejecución (segundos). | `/acp timeout 120`                                            |
| `/acp model`         | Establece la anulación del modelo del entorno de ejecución. | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las anulaciones de opciones del entorno de ejecución de la sesión. | `/acp reset-options`                                          |
| `/acp sessions`      | Enumera las sesiones ACP recientes del almacén.             | `/acp sessions`                                               |
| `/acp doctor`        | Muestra el estado del backend, las capacidades y las correcciones aplicables. | `/acp doctor`                                                 |
| `/acp install`       | Muestra los pasos deterministas de instalación y habilitación. | `/acp install`                                                |

Los controles del entorno de ejecución (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` y `reset-options`) requieren
la identidad del propietario en los canales externos y `operator.admin` en los clientes internos
del Gateway. Los remitentes autorizados que no sean propietarios aún pueden usar `sessions`,
`doctor`, `install` y `help`.

`/acp status` muestra las opciones efectivas del entorno de ejecución, además de los
identificadores de sesión del entorno de ejecución y del backend. Los errores de controles
no admitidos se muestran claramente cuando un backend carece de una capacidad. `/acp sessions` lee el almacén
de la sesión vinculada actual o de la sesión solicitante; los tokens de destino (`session-key`,
`session-id` o `session-label`) se resuelven mediante el descubrimiento de sesiones del Gateway,
incluidas las raíces `session.store` personalizadas por agente.

### Asignación de opciones del entorno de ejecución

`/acp` dispone de comandos prácticos y un definidor genérico. Operaciones equivalentes:

| Comando                      | Se asigna a                            | Notas                                                                                                                                                                                                      |
| ---------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | clave de configuración del entorno de ejecución `model` | Para ACP de Codex, OpenClaw normaliza `openai/<model>` al identificador de modelo del adaptador y asigna sufijos de razonamiento con barra, como `openai/gpt-5.4/high`, a `reasoning_effort`.                                         |
| `/acp set thinking <level>`  | opción canónica `thinking`             | OpenClaw envía el equivalente anunciado por el backend cuando está disponible, con preferencia por `thinking`, seguido de `effort`, `reasoning_effort` o `thought_level`. Para ACP de Codex, el adaptador asigna los valores a `reasoning_effort`. |
| `/acp permissions <profile>` | opción canónica `permissionProfile`    | OpenClaw envía el equivalente anunciado por el backend cuando está disponible, como `approval_policy`, `permission_profile`, `permissions` o `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | opción canónica `timeoutSeconds`       | OpenClaw envía el equivalente anunciado por el backend cuando está disponible, como `timeout` o `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | anulación del cwd del entorno de ejecución | Actualización directa.                                                                                                                                                                                             |
| `/acp set <key> <value>`     | genérico                               | `key=cwd` usa la ruta de anulación del cwd.                                                                                                                                                                      |
| `/acp reset-options`         | borra todas las anulaciones del entorno de ejecución | -                                                                                                                                                                                                          |

## Arnés acpx, configuración del Plugin y permisos

Para obtener información sobre la configuración del arnés acpx (alias de Claude Code, Codex y Gemini CLI),
los puentes MCP de herramientas del Plugin y de OpenClaw, y los modos de permisos de ACP,
consulte [Agentes ACP: configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                                   | Causa probable                                                                                                           | Solución                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | Falta el Plugin de backend, está deshabilitado o bloqueado por `plugins.allow`.                                           | Instale y habilite el Plugin de backend, incluya `acpx` en `plugins.allow` cuando se haya definido esa lista de permitidos y, a continuación, ejecute `/acp doctor`.           |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP está deshabilitado globalmente.                                                                                       | Establezca `acp.enabled=true`.                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | El despacho automático desde mensajes normales del hilo está deshabilitado.                                              | Establezca `acp.dispatch.enabled=true` para reanudar el enrutamiento automático de hilos; las llamadas explícitas a `sessions_spawn({ runtime: "acp" })` siguen funcionando.   |
| `ACP agent "<id>" is not allowed by policy`                                               | El agente no está en la lista de permitidos.                                                                              | Use un `agentId` permitido o actualice `acp.allowedAgents`.                                                                                                                    |
| `/acp doctor` reports backend not ready right after startup                               | Falta el Plugin de backend, está deshabilitado, bloqueado por la política de permisos/denegaciones o su ejecutable configurado no está disponible. | Instale o habilite el Plugin de backend, vuelva a ejecutar `/acp doctor` e inspeccione el error de instalación o de política del backend si continúa en un estado incorrecto. |
| Harness command not found                                                                 | La CLI del adaptador no está instalada, falta el Plugin externo o falló la descarga inicial mediante `npx` para un adaptador que no es Codex. | Ejecute `/acp doctor`, instale o precargue el adaptador en el host del Gateway, o configure explícitamente el comando del agente acpx.                                       |
| Model-not-found from the harness                                                          | El identificador del modelo es válido para otro proveedor o arnés, pero no para este destino ACP.                         | Use un modelo enumerado por ese arnés, configure el modelo en el arnés u omita la sustitución.                                                                                |
| Vendor auth error from the harness                                                        | OpenClaw funciona correctamente, pero la CLI o el proveedor de destino no ha iniciado sesión.                             | Inicie sesión o proporcione la clave de proveedor necesaria en el entorno del host del Gateway.                                                                              |
| `Unable to resolve session target: ...`                                                   | El token de clave, identificador o etiqueta no es válido.                                                                 | Ejecute `/acp sessions`, copie la clave o etiqueta exacta y vuelva a intentarlo.                                                                                               |
| `--bind here requires running /acp spawn inside an active ... conversation`               | Se utilizó `--bind here` sin una conversación activa que admita vinculación.                                              | Vaya al chat o canal de destino y vuelva a intentarlo, o inicie una sesión sin vinculación.                                                                                   |
| `Conversation bindings are unavailable for <channel>.`                                    | El adaptador no dispone de la capacidad de vinculación ACP para la conversación actual.                                  | Use `/acp spawn ... --thread ...` cuando sea compatible, configure `bindings[]` en el nivel superior o cambie a un canal compatible.                                         |
| `--thread here requires running /acp spawn inside an active ... thread`                   | Se utilizó `--thread here` fuera del contexto de un hilo.                                                                 | Vaya al hilo de destino o use `--thread auto`/`off`.                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Otro usuario es el propietario del destino de vinculación activo.                                                        | Vuelva a vincularlo como propietario o use otra conversación u otro hilo.                                                                                                     |
| `Thread bindings are unavailable for <channel>.`                                          | El adaptador no dispone de capacidad para vincular hilos.                                                                 | Use `--thread off` o cambie a un adaptador o canal compatible.                                                                                                                |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | El entorno de ejecución ACP se ejecuta en el host; la sesión solicitante está aislada.                                   | Use `runtime="subagent"` desde sesiones aisladas o inicie ACP desde una sesión no aislada.                                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | Se solicitó `sandbox="require"` para el entorno de ejecución ACP.                                                         | Use `runtime="subagent"` cuando se requiera aislamiento, o use ACP con `sandbox="inherit"` desde una sesión no aislada.                                                       |
| `Cannot apply --model ... did not advertise model support`                                | El arnés de destino no expone el cambio genérico de modelos de ACP.                                                       | Use un arnés que anuncie `models`/`session/set_model` de ACP, use referencias de modelos ACP de Codex o configure el modelo directamente en el arnés si dispone de su propia opción de inicio. |
| Missing ACP metadata for bound session                                                    | Los metadatos de la sesión ACP están obsoletos o se eliminaron.                                                          | Vuelva a crearla con `/acp spawn` y, a continuación, vuelva a vincular el hilo o a enfocarlo.                                                                                 |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloquea las escrituras o la ejecución en una sesión ACP no interactiva.                                 | Establezca `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicie el Gateway. Consulte [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| La sesión ACP falla al principio y genera poca salida                                     | Las solicitudes de permiso están bloqueadas por `permissionMode`/`nonInteractivePermissions`.                            | Revise los registros del Gateway en busca de `AcpRuntimeError`. Para conceder permisos completos, establezca `permissionMode=approve-all`; para una degradación gradual, establezca `nonInteractivePermissions=deny`. |
| La sesión ACP queda bloqueada indefinidamente después de completar el trabajo             | El proceso del arnés finalizó, pero la sesión ACP no notificó la finalización.                                            | Actualice OpenClaw; la limpieza actual de acpx elimina los procesos obsoletos del contenedor y del adaptador propiedad de OpenClaw al cerrar y al iniciar el Gateway.          |
| El arnés ve `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                       | El sobre de eventos interno se filtró a través del límite de ACP.                                                        | Actualice OpenClaw y vuelva a ejecutar el flujo de finalización; los arneses externos solo deben recibir solicitudes de finalización en texto sin formato.                    |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` pertenece al
relé nativo de hooks de Codex, no a ACP/acpx. En un chat de Codex vinculado, inicie una
sesión nueva con `/new` o `/reset`; si funciona una vez y vuelve a aparecer en
la siguiente llamada a una herramienta nativa, reinicie el servidor de aplicaciones de Codex o el Gateway de OpenClaw
en lugar de repetir `/new`. Consulte
[Solución de problemas del arnés de Codex](/es/plugins/codex-harness#troubleshooting).
</Note>

## Contenido relacionado

- [Agentes ACP: configuración](/es/tools/acp-agents-setup)
- [Envío del agente](/es/tools/agent-send)
- [Backends de CLI](/es/gateway/cli-backends)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Herramientas de aislamiento multiagente](/es/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo puente)](/es/cli/acp)
- [Subagentes](/es/tools/subagents)
