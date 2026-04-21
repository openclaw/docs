---
read_when:
    - Ejecución de harnesses de programación mediante ACP
    - Configuración de sesiones ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de un canal de mensajería a una sesión ACP persistente
    - Solución de problemas del backend ACP y la integración del plugin
    - Uso de comandos `/acp` desde el chat
summary: Usa sesiones de runtime ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP y otros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-21T13:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permiten que OpenClaw ejecute harnesses de programación externos (por ejemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI y otros harnesses ACPX compatibles) mediante un plugin de backend ACP.

Si le pides a OpenClaw en lenguaje natural "ejecuta esto en Codex" o "inicia Claude Code en un hilo", OpenClaw debe enrutar esa solicitud al runtime ACP (no al runtime nativo de subagentes). Cada creación de una sesión ACP se rastrea como una [tarea en segundo plano](/es/automation/tasks).

Si quieres que Codex o Claude Code se conecten directamente como cliente MCP externo
a conversaciones de canal existentes de OpenClaw, usa [`openclaw mcp serve`](/cli/mcp)
en lugar de ACP.

## ¿Qué página quiero?

Hay tres superficies cercanas que es fácil confundir:

| Quieres...                                                                        | Usa esto                               | Notas                                                                                                            |
| ---------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Ejecutar Codex, Claude Code, Gemini CLI u otro harness externo _a través de_ OpenClaw | Esta página: Agentes ACP               | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime |
| Exponer una sesión de OpenClaw Gateway _como_ servidor ACP para un editor o cliente | [`openclaw acp`](/cli/acp)             | Modo puente. El IDE/cliente habla ACP con OpenClaw por stdio/WebSocket                                           |
| Reutilizar una CLI de IA local como modelo alternativo solo de texto              | [CLI Backends](/es/gateway/cli-backends)  | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin runtime de harness                              |

## ¿Esto funciona de inmediato?

Normalmente, sí.

- Las instalaciones nuevas ahora incluyen el plugin de runtime `acpx` integrado habilitado de forma predeterminada.
- El plugin `acpx` integrado prefiere su binario `acpx` fijado localmente en el plugin.
- Al iniciar, OpenClaw sondea ese binario y lo autorrepara si es necesario.
- Empieza con `/acp doctor` si quieres una comprobación rápida del estado de preparación.

Lo que aún puede pasar en el primer uso:

- Puede que un adaptador de harness de destino se obtenga bajo demanda con `npx` la primera vez que uses ese harness.
- La autenticación del proveedor aún debe existir en el host para ese harness.
- Si el host no tiene acceso a npm/red, las primeras descargas del adaptador pueden fallar hasta que las cachés se precalienten o el adaptador se instale de otra forma.

Ejemplos:

- `/acp spawn codex`: OpenClaw debería estar listo para iniciar `acpx`, pero puede que el adaptador ACP de Codex aún necesite una descarga inicial.
- `/acp spawn claude`: lo mismo para el adaptador ACP de Claude, además de la autenticación del lado de Claude en ese host.

## Flujo rápido para operadores

Usa esto cuando quieras una guía práctica para `/acp`:

1. Genera una sesión:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabaja en la conversación o hilo vinculado (o apunta explícitamente a esa clave de sesión).
3. Comprueba el estado del runtime:
   - `/acp status`
4. Ajusta las opciones del runtime según sea necesario:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Reorienta una sesión activa sin reemplazar el contexto:
   - `/acp steer tighten logging and continue`
6. Detén el trabajo:
   - `/acp cancel` (detener el turno actual), o
   - `/acp close` (cerrar la sesión + eliminar vinculaciones)

## Inicio rápido para personas

Ejemplos de solicitudes naturales:

- "Vincula este canal de Discord a Codex."
- "Inicia una sesión persistente de Codex en un hilo aquí y mantenla enfocada."
- "Ejecuta esto como una sesión ACP de Claude Code de una sola vez y resume el resultado."
- "Vincula este chat de iMessage a Codex y mantén los seguimientos en el mismo espacio de trabajo."
- "Usa Gemini CLI para esta tarea en un hilo y luego mantén los seguimientos en ese mismo hilo."

Qué debería hacer OpenClaw:

1. Elegir `runtime: "acp"`.
2. Resolver el destino de harness solicitado (`agentId`, por ejemplo `codex`).
3. Si se solicita una vinculación a la conversación actual y el canal activo lo admite, vincular la sesión ACP a esa conversación.
4. En caso contrario, si se solicita una vinculación a un hilo y el canal actual lo admite, vincular la sesión ACP al hilo.
5. Enrutar los mensajes de seguimiento vinculados a esa misma sesión ACP hasta que se desenfoque/se cierre/caduque.

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de harness externo. Usa subagentes cuando quieras ejecuciones delegadas nativas de OpenClaw.

| Área          | Sesión ACP                             | Ejecución de subagente               |
| ------------- | -------------------------------------- | ------------------------------------ |
| Runtime       | Plugin de backend ACP (por ejemplo acpx) | Runtime nativo de subagentes de OpenClaw |
| Clave de sesión | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`    |
| Comandos principales | `/acp ...`                     | `/subagents ...`                     |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predeterminado) |

Consulta también [Sub-agents](/es/tools/subagents).

## Cómo ACP ejecuta Claude Code

Para Claude Code a través de ACP, la pila es:

1. Plano de control de sesiones ACP de OpenClaw
2. plugin de runtime `acpx` integrado
3. Adaptador ACP de Claude
4. Runtime/mecanismo de sesión del lado de Claude

Diferencia importante:

- ACP Claude es una sesión de harness con controles ACP, reanudación de sesión, seguimiento de tareas en segundo plano y vinculación opcional a conversación/hilo.
- Los CLI Backends son runtimes alternativos locales separados, solo de texto. Consulta [CLI Backends](/es/gateway/cli-backends).

Para operadores, la regla práctica es:

- si quieres `/acp spawn`, sesiones vinculables, controles de runtime o trabajo persistente de harness: usa ACP
- si quieres una alternativa local simple de texto mediante la CLI sin procesar: usa CLI Backends

## Sesiones vinculadas

### Vinculaciones a la conversación actual

Usa `/acp spawn <harness> --bind here` cuando quieras que la conversación actual se convierta en un espacio de trabajo ACP persistente sin crear un hilo secundario.

Comportamiento:

- OpenClaw sigue controlando el transporte del canal, la autenticación, la seguridad y la entrega.
- La conversación actual queda fijada a la clave de la sesión ACP generada.
- Los mensajes de seguimiento en esa conversación se enrutan a la misma sesión ACP.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en el mismo lugar.
- `/acp close` cierra la sesión y elimina la vinculación de la conversación actual.

Qué significa esto en la práctica:

- `--bind here` mantiene la misma superficie de chat. En Discord, el canal actual sigue siendo el canal actual.
- `--bind here` puede seguir creando una nueva sesión ACP si estás generando trabajo nuevo. La vinculación adjunta esa sesión a la conversación actual.
- `--bind here` no crea por sí solo un hilo secundario de Discord ni un tema de Telegram.
- El runtime ACP aún puede tener su propio directorio de trabajo (`cwd`) o espacio de trabajo en disco gestionado por el backend. Ese espacio de trabajo del runtime está separado de la superficie de chat y no implica un nuevo hilo de mensajería.
- Si generas para un agente ACP distinto y no pasas `--cwd`, OpenClaw hereda de forma predeterminada el espacio de trabajo del **agente de destino**, no el del solicitante.
- Si falta esa ruta de espacio de trabajo heredada (`ENOENT`/`ENOTDIR`), OpenClaw vuelve al `cwd` predeterminado del backend en lugar de reutilizar silenciosamente el árbol equivocado.
- Si el espacio de trabajo heredado existe pero no se puede acceder a él (por ejemplo `EACCES`), la creación devuelve el error de acceso real en lugar de descartar `cwd`.

Modelo mental:

- superficie de chat: donde la gente sigue hablando (`canal de Discord`, `tema de Telegram`, `chat de iMessage`)
- sesión ACP: el estado persistente del runtime de Codex/Claude/Gemini al que OpenClaw enruta
- hilo/tema secundario: una superficie de mensajería adicional opcional creada solo por `--thread ...`
- espacio de trabajo del runtime: la ubicación del sistema de archivos donde se ejecuta el harness (`cwd`, checkout del repo, espacio de trabajo del backend)

Ejemplos:

- `/acp spawn codex --bind here`: mantener este chat, generar o adjuntar una sesión ACP de Codex y enrutar aquí los mensajes futuros a ella
- `/acp spawn codex --thread auto`: OpenClaw puede crear un hilo/tema secundario y vincular allí la sesión ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: misma vinculación al chat que arriba, pero Codex se ejecuta en `/workspace/repo`

Compatibilidad con la vinculación a la conversación actual:

- Los canales de chat/mensajes que anuncian compatibilidad con la vinculación a la conversación actual pueden usar `--bind here` a través de la ruta compartida de vinculación de conversaciones.
- Los canales con semántica personalizada de hilos/temas pueden seguir proporcionando canonización específica del canal detrás de la misma interfaz compartida.
- `--bind here` siempre significa "vincular la conversación actual en el mismo lugar".
- Las vinculaciones genéricas a la conversación actual usan el almacén compartido de vinculaciones de OpenClaw y sobreviven a reinicios normales del Gateway.

Notas:

- `--bind here` y `--thread ...` son mutuamente excluyentes en `/acp spawn`.
- En Discord, `--bind here` vincula el canal o hilo actual en el mismo lugar. `spawnAcpSessions` solo se requiere cuando OpenClaw necesita crear un hilo secundario para `--thread auto|here`.
- Si el canal activo no expone vinculaciones ACP a la conversación actual, OpenClaw devuelve un mensaje claro de no compatibilidad.
- `resume` y las preguntas de "nueva sesión" son preguntas de sesión ACP, no preguntas de canal. Puedes reutilizar o reemplazar el estado del runtime sin cambiar la superficie de chat actual.

### Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un adaptador de canal, las sesiones ACP pueden vincularse a hilos:

- OpenClaw vincula un hilo a una sesión ACP de destino.
- Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
- La salida ACP se entrega de vuelta al mismo hilo.
- El desenfoque/cierre/archivo/tiempo de espera por inactividad o la caducidad por antigüedad máxima elimina la vinculación.

La compatibilidad con la vinculación a hilos es específica del adaptador. Si el adaptador del canal activo no admite vinculaciones a hilos, OpenClaw devuelve un mensaje claro de no compatibilidad/no disponibilidad.

Indicadores de función requeridos para ACP vinculado a hilos:

- `acp.enabled=true`
- `acp.dispatch.enabled` está activado de forma predeterminada (establece `false` para pausar el despacho ACP)
- indicador de creación de hilos ACP del adaptador de canal habilitado (específico del adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canales compatibles con hilos

- Cualquier adaptador de canal que exponga la capacidad de vinculación de sesiones/hilos.
- Compatibilidad integrada actual:
  - Hilos/canales de Discord
  - Temas de Telegram (temas de foro en grupos/supergrupos y temas de DM)
- Los canales Plugin pueden añadir compatibilidad mediante la misma interfaz de vinculación.

## Configuración específica del canal

Para flujos no efímeros, configura vinculaciones ACP persistentes en entradas `bindings[]` de nivel superior.

### Modelo de vinculación

- `bindings[].type="acp"` marca una vinculación persistente de conversación ACP.
- `bindings[].match` identifica la conversación de destino:
  - Canal o hilo de Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tema de foro de Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/grupal de BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Prefiere `chat_id:*` o `chat_identifier:*` para vinculaciones de grupo estables.
  - Chat DM/grupal de iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Prefiere `chat_id:*` para vinculaciones de grupo estables.
- `bindings[].agentId` es el id del agente OpenClaw propietario.
- Los reemplazos ACP opcionales viven en `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valores predeterminados de runtime por agente

Usa `agents.list[].runtime` para definir valores predeterminados de ACP una vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id del harness, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedencia de reemplazo para sesiones ACP vinculadas:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valores predeterminados globales de ACP (por ejemplo `acp.backend`)

Ejemplo:

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

Comportamiento:

- OpenClaw garantiza que la sesión ACP configurada exista antes de usarla.
- Los mensajes en ese canal o tema se enrutan a la sesión ACP configurada.
- En conversaciones vinculadas, `/new` y `/reset` restablecen la misma clave de sesión ACP en el mismo lugar.
- Las vinculaciones temporales de runtime (por ejemplo, creadas por flujos de enfoque en hilos) siguen aplicándose cuando están presentes.
- Para creaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas heredadas de espacio de trabajo que faltan vuelven al `cwd` predeterminado del backend; los fallos de acceso en rutas existentes aparecen como errores de creación.

## Iniciar sesiones ACP (interfaces)

### Desde `sessions_spawn`

Usa `runtime: "acp"` para iniciar una sesión ACP desde un turno de agente o una llamada de herramienta.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notas:

- `runtime` usa `subagent` de forma predeterminada, así que establece `runtime: "acp"` explícitamente para sesiones ACP.
- Si se omite `agentId`, OpenClaw usa `acp.defaultAgent` cuando está configurado.
- `mode: "session"` requiere `thread: true` para mantener una conversación persistente vinculada.

Detalles de la interfaz:

- `task` (obligatorio): prompt inicial enviado a la sesión ACP.
- `runtime` (obligatorio para ACP): debe ser `"acp"`.
- `agentId` (opcional): id del harness ACP de destino. Recurre a `acp.defaultAgent` si está establecido.
- `thread` (opcional, predeterminado `false`): solicita el flujo de vinculación a hilo cuando sea compatible.
- `mode` (opcional): `run` (una sola ejecución) o `session` (persistente).
  - el valor predeterminado es `run`
  - si `thread: true` y se omite el modo, OpenClaw puede usar un comportamiento persistente por defecto según la ruta del runtime
  - `mode: "session"` requiere `thread: true`
- `cwd` (opcional): directorio de trabajo solicitado para el runtime (validado por la política del backend/runtime). Si se omite, la creación ACP hereda el espacio de trabajo del agente de destino cuando está configurado; las rutas heredadas que faltan vuelven a los valores predeterminados del backend, mientras que los errores reales de acceso se devuelven.
- `label` (opcional): etiqueta visible para operadores usada en el texto de sesión/banner.
- `resumeSessionId` (opcional): reanuda una sesión ACP existente en lugar de crear una nueva. El agente vuelve a reproducir su historial de conversación mediante `session/load`. Requiere `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resúmenes del progreso de la ejecución ACP inicial de vuelta a la sesión solicitante como eventos del sistema.
  - Cuando está disponible, las respuestas aceptadas incluyen `streamLogPath`, que apunta a un registro JSONL con alcance de sesión (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo del relay.

### Reanudar una sesión existente

Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de empezar desde cero. El agente vuelve a reproducir su historial de conversación mediante `session/load`, por lo que retoma con el contexto completo de lo anterior.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comunes:

- Transferir una sesión de Codex de tu laptop a tu teléfono: dile a tu agente que continúe donde lo dejaste
- Continuar una sesión de programación que empezaste de forma interactiva en la CLI, ahora de forma desatendida a través de tu agente
- Retomar trabajo interrumpido por un reinicio del Gateway o un tiempo de espera por inactividad

Notas:

- `resumeSessionId` requiere `runtime: "acp"`; devuelve un error si se usa con el runtime de subagente.
- `resumeSessionId` restaura el historial de conversación ACP ascendente; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, así que `mode: "session"` sigue requiriendo `thread: true`.
- El agente de destino debe ser compatible con `session/load` (Codex y Claude Code lo son).
- Si no se encuentra el ID de sesión, la creación falla con un error claro; no hay retorno silencioso a una nueva sesión.

### Prueba rápida para operadores

Usa esto después de desplegar un Gateway cuando quieras una comprobación rápida en vivo de que la creación ACP
realmente funciona de extremo a extremo, no solo que pasa las pruebas unitarias.

Control recomendado:

1. Verifica la versión/commit del Gateway desplegado en el host de destino.
2. Confirma que el código fuente desplegado incluye la aceptación de linaje ACP en
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abre una sesión temporal de puente ACPX a un agente activo (por ejemplo
   `razor(main)` en `jpclawhq`).
4. Pide a ese agente que llame a `sessions_spawn` con:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tarea: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifica que el agente informe:
   - `accepted=yes`
   - una `childSessionKey` real
   - ningún error de validación
6. Limpia la sesión temporal de puente ACPX.

Prompt de ejemplo para el agente activo:

```text
Usa ahora la herramienta sessions_spawn con runtime: "acp", agentId: "codex" y mode: "run".
Configura la tarea como: "Reply with exactly LIVE-ACP-SPAWN-OK".
Luego informa solo: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notas:

- Mantén esta prueba rápida en `mode: "run"` a menos que estés probando
  intencionadamente sesiones ACP persistentes vinculadas a hilos.
- No exijas `streamTo: "parent"` para el control básico. Esa ruta depende de
  las capacidades del solicitante/la sesión y es una comprobación de integración aparte.
- Trata la prueba de `mode: "session"` vinculada a hilos como una segunda
  pasada de integración más completa desde un hilo real de Discord o un tema de Telegram.

## Compatibilidad con sandbox

Actualmente, las sesiones ACP se ejecutan en el runtime del host, no dentro del sandbox de OpenClaw.

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, las creaciones ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` no es compatible con `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` cuando necesites ejecución forzada por sandbox.

### Desde el comando `/acp`

Usa `/acp spawn` para un control explícito del operador desde el chat cuando sea necesario.

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

Consulta [Slash Commands](/es/tools/slash-commands).

## Resolución del destino de sesión

La mayoría de las acciones `/acp` aceptan un destino de sesión opcional (`session-key`, `session-id` o `session-label`).

Orden de resolución:

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - intenta primero la clave
   - luego el id de sesión con forma de UUID
   - luego la etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculado a una sesión ACP)
3. Recurso a la sesión solicitante actual

Tanto las vinculaciones a la conversación actual como las vinculaciones a hilos participan en el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro (`Unable to resolve session target: ...`).

## Modos de vinculación al crear

`/acp spawn` admite `--bind here|off`.

| Modo   | Comportamiento                                                         |
| ------ | ---------------------------------------------------------------------- |
| `here` | Vincula la conversación activa actual en el mismo lugar; falla si no hay ninguna activa. |
| `off`  | No crea una vinculación a la conversación actual.                      |

Notas:

- `--bind here` es la vía más sencilla para operadores para "hacer que este canal o chat esté respaldado por Codex".
- `--bind here` no crea un hilo secundario.
- `--bind here` solo está disponible en canales que exponen compatibilidad con vinculación a la conversación actual.
- `--bind` y `--thread` no pueden combinarse en la misma llamada a `/acp spawn`.

## Modos de hilo al crear

`/acp spawn` admite `--thread auto|here|off`.

| Modo   | Comportamiento                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------- |
| `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo secundario cuando sea compatible. |
| `here` | Requiere un hilo activo actual; falla si no estás dentro de uno.                                          |
| `off`  | Sin vinculación. La sesión se inicia sin vincular.                                                         |

Notas:

- En superficies sin vinculación a hilos, el comportamiento predeterminado es de hecho `off`.
- La creación vinculada a hilos requiere compatibilidad con la política del canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo secundario.

## Controles ACP

Familia de comandos disponible:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` muestra las opciones efectivas del runtime y, cuando está disponible, tanto los identificadores de sesión a nivel de runtime como a nivel de backend.

Algunos controles dependen de las capacidades del backend. Si un backend no es compatible con un control, OpenClaw devuelve un error claro de control no compatible.

## Recetario de comandos ACP

| Comando              | Qué hace                                                  | Ejemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación actual o a hilo opcional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso para la sesión de destino.      | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de dirección a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula los destinos de hilo.       | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de runtime y capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo de runtime para la sesión de destino.   | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opción de configuración de runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece el reemplazo del directorio de trabajo del runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de política de aprobación.            | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del runtime (segundos).     | `/acp timeout 120`                                            |
| `/acp model`         | Establece el reemplazo del modelo de runtime.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina los reemplazos de opciones de runtime de la sesión. | `/acp reset-options`                                        |
| `/acp sessions`      | Lista las sesiones ACP recientes desde el almacén.        | `/acp sessions`                                               |
| `/acp doctor`        | Estado del backend, capacidades y correcciones accionables. | `/acp doctor`                                               |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación. | `/acp install`                                              |

`/acp sessions` lee el almacén para la sesión actual vinculada o solicitante. Los comandos que aceptan tokens `session-key`, `session-id` o `session-label` resuelven destinos mediante el descubrimiento de sesiones del Gateway, incluidas raíces `session.store` personalizadas por agente.

## Asignación de opciones de runtime

`/acp` tiene comandos de conveniencia y un setter genérico.

Operaciones equivalentes:

- `/acp model <id>` se asigna a la clave de configuración de runtime `model`.
- `/acp permissions <profile>` se asigna a la clave de configuración de runtime `approval_policy`.
- `/acp timeout <seconds>` se asigna a la clave de configuración de runtime `timeout`.
- `/acp cwd <path>` actualiza directamente el reemplazo de cwd del runtime.
- `/acp set <key> <value>` es la ruta genérica.
  - Caso especial: `key=cwd` usa la ruta de reemplazo de cwd.
- `/acp reset-options` borra todos los reemplazos de runtime de la sesión de destino.

## Compatibilidad actual de harnesses acpx

Alias integrados actuales de harnesses acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId` a menos que tu configuración de acpx defina alias personalizados de agente.
Si tu instalación local de Cursor aún expone ACP como `agent acp`, reemplaza el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal de `agentId` de OpenClaw).

## Configuración obligatoria

Línea base principal de ACP:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuración de vinculación a hilos es específica del adaptador de canal. Ejemplo para Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si la creación ACP vinculada a hilos no funciona, verifica primero el indicador de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Las vinculaciones a la conversación actual no requieren crear hilos secundarios. Requieren un contexto de conversación activo y un adaptador de canal que exponga vinculaciones de conversación ACP.

Consulta [Configuration Reference](/es/gateway/configuration-reference).

## Configuración del plugin para el backend acpx

Las instalaciones nuevas incluyen el plugin de runtime `acpx` integrado habilitado de forma predeterminada, así que ACP
normalmente funciona sin un paso manual de instalación del plugin.

Empieza con:

```text
/acp doctor
```

Si deshabilitaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres
cambiar a un checkout local de desarrollo, usa la ruta explícita del plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación de espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica el estado del backend:

```text
/acp doctor
```

### Configuración del comando y la versión de acpx

De forma predeterminada, el plugin integrado del backend acpx (`acpx`) usa el binario fijado localmente en el plugin:

1. El comando usa por defecto el `node_modules/.bin/acpx` local del plugin dentro del paquete del plugin ACPX.
2. La versión esperada usa por defecto la fijación de la extensión.
3. El inicio registra inmediatamente el backend ACP como no listo.
4. Un trabajo de comprobación en segundo plano verifica `acpx --version`.
5. Si falta el binario local del plugin o no coincide, ejecuta:
   `npm install --omit=dev --no-save acpx@<pinned>` y vuelve a verificar.

Puedes reemplazar comando/versión en la configuración del plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Notas:

- `command` acepta una ruta absoluta, una ruta relativa o un nombre de comando (`acpx`).
- Las rutas relativas se resuelven desde el directorio del espacio de trabajo de OpenClaw.
- `expectedVersion: "any"` desactiva la coincidencia estricta de versión.
- Cuando `command` apunta a un binario/ruta personalizada, se desactiva la instalación automática local del plugin.
- El inicio de OpenClaw sigue sin bloquearse mientras se ejecuta la comprobación de estado del backend.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las dependencias del runtime de acpx
(binarios específicos de la plataforma) se instalan automáticamente
mediante un hook postinstall. Si la instalación automática falla, el Gateway sigue iniciándose
con normalidad e informa de la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de plugin

De forma predeterminada, las sesiones ACPX **no** exponen a
el harness ACP las herramientas registradas por plugins de OpenClaw.

Si quieres que agentes ACP como Codex o Claude Code llamen a herramientas
de plugins instalados de OpenClaw, como recuperación/almacenamiento de memoria, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el arranque de la sesión ACPX.
- Expone herramientas de plugin ya registradas por plugins de OpenClaw instalados y habilitados.
- Mantiene la función como explícita y desactivada de forma predeterminada.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del harness ACP.
- Los agentes ACP obtienen acceso solo a herramientas de plugins ya activas en el Gateway.
- Trátalo como el mismo límite de confianza que permitir que esos plugins se ejecuten en
  el propio OpenClaw.
- Revisa los plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de plugin es una comodidad adicional de activación opcional, no un reemplazo de la configuración genérica de servidor MCP.

### Configuración del tiempo de espera del runtime

El plugin `acpx` integrado usa de forma predeterminada un tiempo de espera de 120 segundos
para turnos de runtime integrados. Esto da a harnesses más lentos como Gemini CLI tiempo suficiente para completar
el inicio e inicialización de ACP. Reemplázalo si tu host necesita un límite de
runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicia el Gateway después de cambiar este valor.

### Configuración del agente de sondeo de estado

El plugin `acpx` integrado sondea un agente harness mientras decide si el
backend de runtime integrado está listo. De forma predeterminada usa `codex`. Si tu despliegue
usa un agente ACP predeterminado diferente, establece el agente de sondeo con ese mismo id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el Gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay TTY para aprobar o denegar solicitudes de permiso de escritura de archivos y ejecución de shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos de harness ACPX son independientes de las aprobaciones exec de OpenClaw y también de los indicadores de omisión del proveedor en CLI Backends, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia a nivel de harness para las sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente harness sin solicitar confirmación.

| Valor           | Comportamiento                                                |
| --------------- | ------------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos shell. |
| `approve-reads` | Aprueba automáticamente solo lecturas; las escrituras y la ejecución requieren solicitudes. |
| `deny-all`      | Deniega todas las solicitudes de permiso.                     |

### `nonInteractivePermissions`

Controla qué ocurre cuando se mostraría una solicitud de permiso, pero no hay un TTY interactivo disponible (lo cual siempre ocurre en sesiones ACP).

| Valor  | Comportamiento                                                          |
| ------ | ----------------------------------------------------------------------- |
| `fail` | Aborta la sesión con `AcpRuntimeError`. **(predeterminado)**            |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación controlada). |

### Configuración

Establécelo mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el Gateway después de cambiar estos valores.

> **Importante:** OpenClaw actualmente usa por defecto `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden de forma controlada en lugar de bloquearse.

## Solución de problemas

| Síntoma                                                                    | Causa probable                                                                  | Solución                                                                                                                                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                    | Falta el plugin de backend o está deshabilitado.                                | Instala y habilita el plugin de backend, luego ejecuta `/acp doctor`.                                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                            | ACP está deshabilitado globalmente.                                             | Establece `acp.enabled=true`.                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`          | El despacho desde mensajes normales del hilo está deshabilitado.                | Establece `acp.dispatch.enabled=true`.                                                                                                                            |
| `ACP agent "<id>" is not allowed by policy`                                | El agente no está en la lista de permitidos.                                    | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                      |
| `Unable to resolve session target: ...`                                    | Token de clave/id/etiqueta incorrecto.                                          | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` se usó sin una conversación activa que permita vinculación.       | Ve al chat/canal de destino y vuelve a intentarlo, o usa una creación sin vinculación.                                                                           |
| `Conversation bindings are unavailable for <channel>.`                     | El adaptador no tiene capacidad de vinculación ACP a la conversación actual.    | Usa `/acp spawn ... --thread ...` cuando sea compatible, configura `bindings[]` de nivel superior o cambia a un canal compatible.                               |
| `--thread here requires running /acp spawn inside an active ... thread`    | `--thread here` se usó fuera de un contexto de hilo.                            | Ve al hilo de destino o usa `--thread auto`/`off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`              | Otro usuario es propietario del destino de vinculación activo.                  | Vuelve a vincular como propietario o usa una conversación o hilo diferente.                                                                                      |
| `Thread bindings are unavailable for <channel>.`                           | El adaptador no tiene capacidad de vinculación a hilos.                         | Usa `--thread off` o cambia a un adaptador/canal compatible.                                                                                                     |
| `Sandboxed sessions cannot spawn ACP sessions ...`                         | El runtime ACP está en el host; la sesión solicitante está en sandbox.          | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la creación ACP desde una sesión sin sandbox.                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`    | Se solicitó `sandbox="require"` para el runtime ACP.                            | Usa `runtime="subagent"` si necesitas sandbox obligatorio, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                      |
| Missing ACP metadata for bound session                                     | Metadatos de sesión ACP obsoletos/eliminados.                                   | Vuelve a crearla con `/acp spawn`, luego vuelve a vincular/enfocar el hilo.                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`   | `permissionMode` bloquea escrituras/ejecución en una sesión ACP no interactiva. | Establece `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia el Gateway. Consulta [Permission configuration](#permission-configuration). |
| ACP session fails early with little output                                 | Las solicitudes de permiso están bloqueadas por `permissionMode`/`nonInteractivePermissions`. | Revisa los registros del Gateway para ver `AcpRuntimeError`. Para permisos completos, establece `permissionMode=approve-all`; para degradación controlada, establece `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                      | El proceso harness terminó, pero la sesión ACP no informó la finalización.      | Supervisa con `ps aux \| grep acpx`; elimina manualmente los procesos obsoletos.                                                                                 |
