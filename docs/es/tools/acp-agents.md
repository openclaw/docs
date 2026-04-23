---
read_when:
    - Ejecutar harnesses de programación mediante ACP
    - Configurar sesiones de ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de un canal de mensajes a una sesión persistente de ACP
    - Solucionar problemas del backend de ACP y de la integración del plugin
    - Depurar la entrega de finalización de ACP o los bucles de agente a agente
    - Usar comandos `/acp` desde el chat
summary: Usa sesiones de runtime de ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP y otros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-23T05:20:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4c4c38e7a93c240f6bf30a4cc093e8717ef6459425d56a9287245adc625e51
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permiten que OpenClaw ejecute harnesses externos de programación (por ejemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI y otros harnesses ACPX compatibles) mediante un plugin backend de ACP.

Si le pides a OpenClaw en lenguaje natural que “ejecute esto en Codex” o que “inicie Claude Code en un hilo”, OpenClaw debe enrutar esa solicitud al runtime de ACP (no al runtime nativo de subagentes). Cada creación de sesión ACP se rastrea como una [tarea en segundo plano](/es/automation/tasks).

Si quieres que Codex o Claude Code se conecten como un cliente MCP externo directamente
a conversaciones de canales existentes de OpenClaw, usa [`openclaw mcp serve`](/cli/mcp)
en lugar de ACP.

## ¿Qué página quiero?

Hay tres superficies cercanas que es fácil confundir:

| Quieres...                                                                     | Usa esto                              | Notas                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Ejecutar Codex, Claude Code, Gemini CLI u otro harness externo _a través de_ OpenClaw | Esta página: agentes ACP                 | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime |
| Exponer una sesión de Gateway de OpenClaw _como_ un servidor ACP para un editor o cliente      | [`openclaw acp`](/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw por stdio/WebSocket                                          |
| Reutilizar una CLI de IA local como modelo de respaldo solo de texto                                 | [CLI Backends](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin runtime de harness                                             |

## ¿Esto funciona de inmediato?

Normalmente, sí.

- Las instalaciones nuevas ahora incluyen el plugin de runtime empaquetado `acpx` habilitado de forma predeterminada.
- El plugin empaquetado `acpx` prefiere su binario `acpx` fijado local al plugin.
- Al iniciarse, OpenClaw sondea ese binario y lo autorrepara si hace falta.
- Empieza con `/acp doctor` si quieres una comprobación rápida de disponibilidad.

Lo que todavía puede ocurrir en el primer uso:

- Un adaptador del harness de destino puede descargarse bajo demanda con `npx` la primera vez que uses ese harness.
- La autenticación del proveedor todavía debe existir en el host para ese harness.
- Si el host no tiene acceso a npm/red, las descargas del adaptador en la primera ejecución pueden fallar hasta que las cachés se precalienten o el adaptador se instale de otra forma.

Ejemplos:

- `/acp spawn codex`: OpenClaw debería estar listo para inicializar `acpx`, pero el adaptador ACP de Codex aún podría necesitar una descarga en la primera ejecución.
- `/acp spawn claude`: lo mismo para el adaptador ACP de Claude, además de la autenticación del lado de Claude en ese host.

## Flujo rápido para operadores

Úsalo cuando quieras una guía práctica de `/acp`:

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
5. Da un empujón a una sesión activa sin sustituir el contexto:
   - `/acp steer tighten logging and continue`
6. Detén el trabajo:
   - `/acp cancel` (detiene el turno actual), o
   - `/acp close` (cierra la sesión + elimina las vinculaciones)

## Inicio rápido para personas

Ejemplos de solicitudes naturales:

- "Vincula este canal de Discord a Codex."
- "Inicia una sesión persistente de Codex en un hilo aquí y mantenla enfocada."
- "Ejecuta esto como una sesión ACP de Claude Code de una sola vez y resume el resultado."
- "Vincula este chat de iMessage a Codex y mantén los seguimientos en el mismo espacio de trabajo."
- "Usa Gemini CLI para esta tarea en un hilo y luego mantén los seguimientos en ese mismo hilo."

Lo que OpenClaw debe hacer:

1. Elegir `runtime: "acp"`.
2. Resolver el destino de harness solicitado (`agentId`, por ejemplo `codex`).
3. Si se solicita la vinculación a la conversación actual y el canal activo la admite, vincular la sesión ACP a esa conversación.
4. En caso contrario, si se solicita la vinculación a un hilo y el canal actual la admite, vincular la sesión ACP al hilo.
5. Enrutar los mensajes de seguimiento vinculados a esa misma sesión ACP hasta que se desenfoque/cierre/expire.

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de harness externo. Usa subagentes cuando quieras ejecuciones delegadas nativas de OpenClaw.

| Área          | Sesión ACP                            | Ejecución de subagente              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend de ACP (por ejemplo acpx) | Runtime nativo de subagente de OpenClaw  |
| Clave de sesión   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principales | `/acp ...`                            | `/subagents ...`                   |
| Herramienta de creación    | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predeterminado) |

Consulta también [Sub-agents](/es/tools/subagents).

## Cómo ejecuta ACP Claude Code

Para Claude Code mediante ACP, la pila es:

1. Plano de control de sesiones ACP de OpenClaw
2. plugin de runtime empaquetado `acpx`
3. Adaptador ACP de Claude
4. Maquinaria de runtime/sesión del lado de Claude

Distinción importante:

- ACP Claude es una sesión de harness con controles ACP, reanudación de sesión, seguimiento de tareas en segundo plano y vinculación opcional a conversación/hilo.
- Los backends de CLI son runtimes locales independientes de solo texto. Consulta [CLI Backends](/es/gateway/cli-backends).

Para operadores, la regla práctica es:

- si quieres `/acp spawn`, sesiones vinculables, controles de runtime o trabajo persistente de harness: usa ACP
- si quieres un respaldo local de texto simple mediante la CLI sin procesar: usa CLI Backends

## Sesiones vinculadas

### Vinculaciones a la conversación actual

Usa `/acp spawn <harness> --bind here` cuando quieras que la conversación actual se convierta en un espacio de trabajo ACP duradero sin crear un hilo hijo.

Comportamiento:

- OpenClaw sigue siendo propietario del transporte del canal, la autenticación, la seguridad y la entrega.
- La conversación actual queda fijada a la clave de sesión ACP generada.
- Los mensajes de seguimiento en esa conversación se enrutan a la misma sesión ACP.
- `/new` y `/reset` restablecen en el mismo lugar esa misma sesión ACP vinculada.
- `/acp close` cierra la sesión y elimina la vinculación de la conversación actual.

Qué significa esto en la práctica:

- `--bind here` mantiene la misma superficie de chat. En Discord, el canal actual sigue siendo el canal actual.
- `--bind here` aún puede crear una nueva sesión ACP si estás generando trabajo nuevo. La vinculación adjunta esa sesión a la conversación actual.
- `--bind here` no crea por sí mismo un hilo hijo de Discord ni un tema de Telegram.
- El runtime de ACP aún puede tener su propio directorio de trabajo (`cwd`) o espacio de trabajo gestionado por el backend en disco. Ese espacio de trabajo del runtime es independiente de la superficie del chat y no implica un nuevo hilo de mensajería.
- Si generas en otro agente ACP y no pasas `--cwd`, OpenClaw hereda de forma predeterminada el espacio de trabajo del **agente de destino**, no el del solicitante.
- Si esa ruta de espacio de trabajo heredada no existe (`ENOENT`/`ENOTDIR`), OpenClaw recurre al `cwd` predeterminado del backend en lugar de reutilizar silenciosamente el árbol incorrecto.
- Si el espacio de trabajo heredado existe pero no se puede acceder a él (por ejemplo `EACCES`), la creación devuelve el error de acceso real en lugar de descartar `cwd`.

Modelo mental:

- superficie de chat: donde la gente sigue hablando (`canal de Discord`, `tema de Telegram`, `chat de iMessage`)
- sesión ACP: el estado duradero del runtime de Codex/Claude/Gemini al que OpenClaw enruta
- hilo/tema hijo: una superficie de mensajería extra opcional creada solo por `--thread ...`
- espacio de trabajo del runtime: la ubicación en el sistema de archivos donde se ejecuta el harness (`cwd`, checkout del repositorio, espacio de trabajo del backend)

Ejemplos:

- `/acp spawn codex --bind here`: mantener este chat, generar o adjuntar una sesión ACP de Codex y enrutar allí los futuros mensajes
- `/acp spawn codex --thread auto`: OpenClaw puede crear un hilo/tema hijo y vincular allí la sesión ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: misma vinculación de chat que arriba, pero Codex se ejecuta en `/workspace/repo`

Compatibilidad de vinculación a la conversación actual:

- Los canales de chat/mensajes que anuncian compatibilidad con vinculación a la conversación actual pueden usar `--bind here` mediante la ruta compartida de vinculación de conversaciones.
- Los canales con semánticas personalizadas de hilos/temas aún pueden proporcionar una canonicalización específica del canal detrás de la misma interfaz compartida.
- `--bind here` siempre significa "vincular la conversación actual en el mismo lugar".
- Las vinculaciones genéricas a la conversación actual usan el almacén compartido de vinculaciones de OpenClaw y sobreviven a los reinicios normales del gateway.

Notas:

- `--bind here` y `--thread ...` son mutuamente excluyentes en `/acp spawn`.
- En Discord, `--bind here` vincula el canal o hilo actual en el mismo lugar. `spawnAcpSessions` solo es necesario cuando OpenClaw necesita crear un hilo hijo para `--thread auto|here`.
- Si el canal activo no expone vinculaciones ACP a la conversación actual, OpenClaw devuelve un mensaje claro de no compatibilidad.
- `resume` y las preguntas de "nueva sesión" son cuestiones de sesión ACP, no del canal. Puedes reutilizar o sustituir el estado del runtime sin cambiar la superficie actual del chat.

### Sesiones vinculadas a hilos

Cuando las vinculaciones de hilos están habilitadas para un adaptador de canal, las sesiones ACP pueden vincularse a hilos:

- OpenClaw vincula un hilo a una sesión ACP de destino.
- Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
- La salida de ACP se entrega de vuelta al mismo hilo.
- El desenfoque/cierre/archivo/tiempo de espera de inactividad o la expiración por antigüedad máxima elimina la vinculación.

La compatibilidad de vinculación a hilos depende del adaptador. Si el adaptador de canal activo no admite vinculaciones a hilos, OpenClaw devuelve un mensaje claro de no compatible/no disponible.

Indicadores de función necesarios para ACP vinculado a hilos:

- `acp.enabled=true`
- `acp.dispatch.enabled` está activado de forma predeterminada (establece `false` para pausar el despacho ACP)
- Indicador de generación de hilos ACP del adaptador de canal habilitado (específico del adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canales compatibles con hilos

- Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
- Compatibilidad integrada actual:
  - Hilos/canales de Discord
  - Temas de Telegram (temas de foro en grupos/supergrupos y temas de DM)
- Los canales plugin pueden agregar compatibilidad mediante la misma interfaz de vinculación.

## Configuración específica del canal

Para flujos de trabajo no efímeros, configura vinculaciones ACP persistentes en entradas de nivel superior `bindings[]`.

### Modelo de vinculación

- `bindings[].type="acp"` marca una vinculación persistente de conversación ACP.
- `bindings[].match` identifica la conversación de destino:
  - Canal o hilo de Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tema de foro de Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/de grupo de BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefiere `chat_id:*` o `chat_identifier:*` para vinculaciones de grupo estables.
  - Chat DM/de grupo de iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefiere `chat_id:*` para vinculaciones de grupo estables.
- `bindings[].agentId` es el ID del agente OpenClaw propietario.
- Las anulaciones ACP opcionales viven bajo `bindings[].acp`:
  - `mode` (`persistent` u `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valores predeterminados del runtime por agente

Usa `agents.list[].runtime` para definir una vez los valores predeterminados de ACP por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID del harness, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedencia de anulaciones para sesiones ACP vinculadas:

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
- En conversaciones vinculadas, `/new` y `/reset` restablecen en el mismo lugar la misma clave de sesión ACP.
- Las vinculaciones temporales de runtime (por ejemplo las creadas por flujos de enfoque en hilos) siguen aplicándose cuando existen.
- Para creaciones de ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas de espacio de trabajo heredadas que faltan recurren al `cwd` predeterminado del backend; los fallos reales de acceso aparecen como errores de creación.

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

- `runtime` usa por defecto `subagent`, así que establece `runtime: "acp"` explícitamente para sesiones ACP.
- Si se omite `agentId`, OpenClaw usa `acp.defaultAgent` cuando está configurado.
- `mode: "session"` requiere `thread: true` para mantener una conversación persistente vinculada.

Detalles de la interfaz:

- `task` (obligatorio): prompt inicial enviado a la sesión ACP.
- `runtime` (obligatorio para ACP): debe ser `"acp"`.
- `agentId` (opcional): ID del harness ACP de destino. Recurre a `acp.defaultAgent` si está configurado.
- `thread` (opcional, predeterminado `false`): solicita el flujo de vinculación a hilo donde se admita.
- `mode` (opcional): `run` (una sola vez) o `session` (persistente).
  - el valor predeterminado es `run`
  - si `thread: true` y se omite mode, OpenClaw puede usar por defecto comportamiento persistente según la ruta de runtime
  - `mode: "session"` requiere `thread: true`
- `cwd` (opcional): directorio de trabajo solicitado del runtime (validado por la política del backend/runtime). Si se omite, la creación ACP hereda el espacio de trabajo del agente de destino cuando está configurado; las rutas heredadas faltantes recurren a los valores predeterminados del backend, mientras que los errores reales de acceso se devuelven.
- `label` (opcional): etiqueta visible para el operador usada en el texto de sesión/banner.
- `resumeSessionId` (opcional): reanuda una sesión ACP existente en lugar de crear una nueva. El agente vuelve a reproducir su historial de conversación mediante `session/load`. Requiere `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resúmenes de progreso de la ejecución ACP inicial de vuelta a la sesión solicitante como eventos del sistema.
  - Cuando está disponible, las respuestas aceptadas incluyen `streamLogPath` que apunta a un registro JSONL con alcance de sesión (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo de relay.

## Modelo de entrega

Las sesiones ACP pueden ser espacios de trabajo interactivos o trabajo en segundo plano propiedad de un padre. La ruta de entrega depende de esa forma.

### Sesiones ACP interactivas

Las sesiones interactivas están pensadas para seguir hablando en una superficie de chat visible:

- `/acp spawn ... --bind here` vincula la conversación actual a la sesión ACP.
- `/acp spawn ... --thread ...` vincula un hilo/tema de canal a la sesión ACP.
- Las `bindings[].type="acp"` persistentes configuradas enrutan las conversaciones coincidentes a la misma sesión ACP.

Los mensajes de seguimiento en la conversación vinculada se enrutan directamente a la sesión ACP, y la salida de ACP se entrega de vuelta a ese mismo canal/hilo/tema.

### Sesiones ACP de una sola vez propiedad del padre

Las sesiones ACP de una sola vez generadas por otra ejecución de agente son hijas en segundo plano, similares a los subagentes:

- El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
- La hija se ejecuta en su propia sesión de harness ACP.
- La finalización se informa de vuelta mediante la ruta interna de anuncio de finalización de tareas.
- El padre reescribe el resultado de la hija con voz normal de asistente cuando resulta útil una respuesta orientada al usuario.

No trates esta ruta como un chat de igual a igual entre padre e hijo. La hija ya tiene un canal de finalización de vuelta al padre.

### `sessions_send` y entrega A2A

`sessions_send` puede apuntar a otra sesión después de crearla. Para sesiones pares normales, OpenClaw usa una ruta de seguimiento agent-to-agent (A2A) después de inyectar el mensaje:

- esperar la respuesta de la sesión de destino
- opcionalmente permitir que solicitante y destino intercambien un número acotado de turnos de seguimiento
- pedir al destino que produzca un mensaje de anuncio
- entregar ese anuncio al canal o hilo visible

Esa ruta A2A es un respaldo para envíos entre pares donde el remitente necesita un seguimiento visible. Sigue habilitada cuando una sesión no relacionada puede ver y enviar mensajes a un destino ACP, por ejemplo bajo configuraciones amplias de `tools.sessions.visibility`.

OpenClaw omite el seguimiento A2A solo cuando el solicitante es el padre de su propia hija ACP de una sola vez propiedad del padre. En ese caso, ejecutar A2A además de la finalización de tareas puede despertar al padre con el resultado de la hija, reenviar la respuesta del padre de vuelta a la hija y crear un bucle de eco padre/hija. El resultado de `sessions_send` informa `delivery.status="skipped"` para ese caso de hija propia porque la ruta de finalización ya es responsable del resultado.

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

- Transferir una sesión de Codex de tu portátil a tu teléfono: dile a tu agente que retome donde lo dejaste
- Continuar una sesión de programación que iniciaste de forma interactiva en la CLI, ahora sin interfaz mediante tu agente
- Retomar trabajo que fue interrumpido por un reinicio del gateway o por tiempo de espera de inactividad

Notas:

- `resumeSessionId` requiere `runtime: "acp"`; devuelve un error si se usa con el runtime de subagente.
- `resumeSessionId` restaura el historial de conversación ACP upstream; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, así que `mode: "session"` sigue requiriendo `thread: true`.
- El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
- Si no se encuentra el ID de sesión, la creación falla con un error claro; no hay respaldo silencioso a una sesión nueva.

### Prueba rápida para operadores

Úsala después de desplegar un gateway cuando quieras una comprobación rápida en vivo de que la creación ACP
realmente funciona de extremo a extremo, no solo que pasa pruebas unitarias.

Puerta recomendada:

1. Verifica la versión/commit del gateway desplegado en el host de destino.
2. Confirma que el origen desplegado incluye la aceptación de linaje ACP en
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abre una sesión puente ACPX temporal hacia un agente activo (por ejemplo
   `razor(main)` en `jpclawhq`).
4. Pide a ese agente que llame a `sessions_spawn` con:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tarea: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifica que el agente informe:
   - `accepted=yes`
   - una `childSessionKey` real
   - ningún error de validador
6. Limpia la sesión puente ACPX temporal.

Ejemplo de prompt para el agente activo:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notas:

- Mantén esta prueba rápida en `mode: "run"` salvo que estés probando intencionalmente
  sesiones ACP persistentes vinculadas a hilos.
- No exijas `streamTo: "parent"` para la puerta básica. Esa ruta depende de
  las capacidades del solicitante/de la sesión y es una comprobación de integración aparte.
- Trata las pruebas de `mode: "session"` vinculadas a hilos como una segunda pasada
  de integración más completa desde un hilo real de Discord o un tema de Telegram.

## Compatibilidad con sandbox

Las sesiones ACP actualmente se ejecutan en el runtime del host, no dentro del sandbox de OpenClaw.

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, las creaciones ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.
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

Flags clave:

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
   - prueba primero la clave
   - luego el ID de sesión con forma UUID
   - luego la etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculado a una sesión ACP)
3. Respaldo de la sesión actual del solicitante

Las vinculaciones a la conversación actual y las vinculaciones a hilos participan ambas en el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro (`Unable to resolve session target: ...`).

## Modos de vinculación de creación

`/acp spawn` admite `--bind here|off`.

| Modo   | Comportamiento                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | Vincula la conversación activa actual en el mismo lugar; falla si no hay ninguna activa. |
| `off`  | No crea una vinculación a la conversación actual.                          |

Notas:

- `--bind here` es la ruta más sencilla para el operador para “hacer que este canal o chat esté respaldado por Codex”.
- `--bind here` no crea un hilo hijo.
- `--bind here` solo está disponible en canales que exponen compatibilidad con vinculación a la conversación actual.
- `--bind` y `--thread` no pueden combinarse en la misma llamada a `/acp spawn`.

## Modos de hilo de creación

`/acp spawn` admite `--thread auto|here|off`.

| Modo   | Comportamiento                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------- |
| `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo hijo cuando se admita. |
| `here` | Requiere un hilo activo actual; falla si no estás dentro de uno.                                                  |
| `off`  | Sin vinculación. La sesión se inicia sin vincular.                                                                 |

Notas:

- En superficies sin vinculación a hilos, el comportamiento predeterminado equivale en la práctica a `off`.
- La creación vinculada a hilos requiere compatibilidad con la política del canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo hijo.

## Controles de ACP

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

`/acp status` muestra las opciones efectivas del runtime y, cuando está disponible, los identificadores de sesión tanto a nivel de runtime como a nivel de backend.

Algunos controles dependen de las capacidades del backend. Si un backend no admite un control, OpenClaw devuelve un error claro de control no compatible.

## Recetario de comandos ACP

| Comando              | Qué hace                                              | Ejemplo                                                       |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación actual opcional o vinculación a hilo. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso de la sesión de destino.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de redirección a la sesión en ejecución.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula los destinos de hilo.                  | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones del runtime y capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo de runtime para la sesión de destino.                      | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opciones de configuración del runtime.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la anulación del directorio de trabajo del runtime.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de política de aprobación.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del runtime (segundos).                            | `/acp timeout 120`                                            |
| `/acp model`         | Establece la anulación del modelo del runtime.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las anulaciones de opciones de runtime de la sesión.                  | `/acp reset-options`                                          |
| `/acp sessions`      | Enumera las sesiones ACP recientes del almacén.                      | `/acp sessions`                                               |
| `/acp doctor`        | Estado de salud del backend, capacidades y correcciones accionables.           | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación.             | `/acp install`                                                |

`/acp sessions` lee el almacén de la sesión actual vinculada o de la sesión solicitante. Los comandos que aceptan tokens `session-key`, `session-id` o `session-label` resuelven destinos mediante el descubrimiento de sesiones del gateway, incluidas raíces `session.store` personalizadas por agente.

## Mapeo de opciones de runtime

`/acp` tiene comandos de conveniencia y un setter genérico.

Operaciones equivalentes:

- `/acp model <id>` se asigna a la clave de configuración de runtime `model`.
- `/acp permissions <profile>` se asigna a la clave de configuración de runtime `approval_policy`.
- `/acp timeout <seconds>` se asigna a la clave de configuración de runtime `timeout`.
- `/acp cwd <path>` actualiza directamente la anulación de cwd del runtime.
- `/acp set <key> <value>` es la ruta genérica.
  - Caso especial: `key=cwd` usa la ruta de anulación de cwd.
- `/acp reset-options` borra todas las anulaciones de runtime de la sesión de destino.

## Compatibilidad actual de harnesses de acpx

Alias integrados actuales de harnesses de acpx:

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

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId` a menos que tu configuración de acpx defina alias personalizados de agentes.
Si tu instalación local de Cursor todavía expone ACP como `agent acp`, anula el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor integrado predeterminado.

El uso directo de la CLI de acpx también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal de `agentId` de OpenClaw).

## Configuración necesaria

Línea base del core de ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. El valor predeterminado es true; establece false para pausar el despacho ACP mientras mantienes los controles /acp.
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

Las vinculaciones a la conversación actual no requieren creación de hilos hijos. Requieren un contexto de conversación activa y un adaptador de canal que exponga vinculaciones de conversación ACP.

Consulta [Configuration Reference](/es/gateway/configuration-reference).

## Configuración del plugin para el backend acpx

Las instalaciones nuevas incluyen el plugin de runtime empaquetado `acpx` habilitado de forma predeterminada, así que ACP
normalmente funciona sin un paso manual de instalación del plugin.

Empieza con:

```text
/acp doctor
```

Si deshabilitaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres
cambiar a una copia local de desarrollo, usa la ruta explícita del plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación en espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica el estado de salud del backend:

```text
/acp doctor
```

### Configuración de comando y versión de acpx

De forma predeterminada, el plugin backend empaquetado de acpx (`acpx`) usa el binario fijado local al plugin:

1. El comando usa por defecto `node_modules/.bin/acpx` local al plugin dentro del paquete del plugin ACPX.
2. La versión esperada usa por defecto el pin de la extensión.
3. El inicio registra inmediatamente el backend ACP como no listo.
4. Un trabajo en segundo plano verifica `acpx --version`.
5. Si el binario local al plugin falta o no coincide, ejecuta:
   `npm install --omit=dev --no-save acpx@<pinned>` y vuelve a verificar.

Puedes anular comando/versión en la configuración del plugin:

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
- `expectedVersion: "any"` desactiva la comprobación estricta de versión.
- Cuando `command` apunta a un binario/ruta personalizada, la instalación automática local al plugin queda desactivada.
- El inicio de OpenClaw sigue siendo no bloqueante mientras se ejecuta la comprobación del estado de salud del backend.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las dependencias del runtime de acpx
(binarios específicos de la plataforma) se instalan automáticamente
mediante un hook postinstall. Si la instalación automática falla, el gateway sigue iniciándose
con normalidad e informa de la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de plugins

De forma predeterminada, las sesiones ACPX **no** exponen herramientas registradas por plugins de OpenClaw al
harness ACP.

Si quieres que agentes ACP como Codex o Claude Code llamen a herramientas de plugins de
OpenClaw instaladas, como recuperación/almacenamiento de memoria, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el bootstrap de la sesión ACPX.
- Expone herramientas de plugins ya registradas por plugins de OpenClaw instalados y habilitados.
- Mantiene la función explícita y desactivada por defecto.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del harness ACP.
- Los agentes ACP obtienen acceso solo a las herramientas de plugins ya activas en el gateway.
- Trata esto como el mismo límite de confianza que permitir que esos plugins se ejecuten en
  el propio OpenClaw.
- Revisa los plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de plugins es una
comodidad adicional de adhesión explícita, no un reemplazo de la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco **no** exponen herramientas integradas de OpenClaw mediante
MCP. Habilita el puente separado de herramientas del core cuando un agente ACP necesite
herramientas integradas seleccionadas como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el bootstrap de la sesión ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene la exposición de herramientas del core explícita y desactivada por defecto.

### Configuración del tiempo de espera del runtime

El plugin empaquetado `acpx` usa por defecto un tiempo de espera de 120 segundos para
turnos de runtime embebido. Esto da a harnesses más lentos como Gemini CLI tiempo suficiente para completar
el inicio e inicialización de ACP. Anúlalo si tu host necesita un
límite de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicia el gateway después de cambiar este valor.

### Configuración del agente de sondeo de estado de salud

El plugin empaquetado `acpx` sondea un agente de harness mientras decide si el
backend de runtime embebido está listo. Por defecto usa `codex`. Si tu despliegue
usa un agente ACP predeterminado distinto, establece el agente de sondeo con ese mismo ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan sin interacción: no hay TTY para aprobar o denegar solicitudes de permiso de escritura de archivos y ejecución de shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos de harness de ACPX son independientes de las aprobaciones de exec de OpenClaw y de los flags de bypass del proveedor del backend de CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia a nivel de harness para sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente del harness sin solicitar confirmación.

| Valor           | Comportamiento                                                  |
| --------------- | --------------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y los comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y la ejecución requieren solicitudes. |
| `deny-all`      | Deniega todas las solicitudes de permiso.                       |

### `nonInteractivePermissions`

Controla qué ocurre cuando se mostraría una solicitud de permiso pero no hay un TTY interactivo disponible (lo cual siempre ocurre en sesiones ACP).

| Valor  | Comportamiento                                                          |
| ------ | ----------------------------------------------------------------------- |
| `fail` | Aborta la sesión con `AcpRuntimeError`. **(predeterminado)**            |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación controlada). |

### Configuración

Configura mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el gateway después de cambiar estos valores.

> **Importante:** Actualmente, OpenClaw usa por defecto `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden de forma controlada en lugar de fallar abruptamente.

## Solución de problemas

| Síntoma                                                                     | Causa probable                                                                  | Solución                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Falta el plugin backend o está deshabilitado.                                   | Instala y habilita el plugin backend, luego ejecuta `/acp doctor`.                                                                                                    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP está deshabilitado globalmente.                                             | Establece `acp.enabled=true`.                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | El despacho desde mensajes normales del hilo está deshabilitado.                | Establece `acp.dispatch.enabled=true`.                                                                                                                                 |
| `ACP agent "<id>" is not allowed by policy`                                 | El agente no está en la lista permitida.                                        | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                           |
| `Unable to resolve session target: ...`                                     | Token de clave/id/etiqueta incorrecto.                                          | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` se usó sin una conversación activa vinculable.                    | Muévete al chat/canal de destino y vuelve a intentarlo, o usa una creación sin vinculación.                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | El adaptador no tiene capacidad de vinculación ACP a la conversación actual.    | Usa `/acp spawn ... --thread ...` donde se admita, configura `bindings[]` de nivel superior o cambia a un canal compatible.                                          |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` se usó fuera de un contexto de hilo.                            | Muévete al hilo de destino o usa `--thread auto`/`off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Otro usuario es propietario del destino de vinculación activo.                  | Vuelve a vincular como propietario o usa otra conversación o hilo.                                                                                                    |
| `Thread bindings are unavailable for <channel>.`                            | El adaptador no tiene capacidad de vinculación a hilos.                         | Usa `--thread off` o cambia a un adaptador/canal compatible.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | El runtime de ACP está del lado del host; la sesión solicitante está en sandbox. | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la creación ACP desde una sesión sin sandbox.                                                          |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Se solicitó `sandbox="require"` para el runtime ACP.                            | Usa `runtime="subagent"` para exigir sandbox, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                        |
| Missing ACP metadata for bound session                                      | Metadatos ACP obsoletos/eliminados de la sesión vinculada.                      | Vuelve a crear con `/acp spawn`, luego vuelve a vincular/enfocar el hilo.                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloquea escrituras/ejecución en una sesión ACP no interactiva. | Establece `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia el gateway. Consulta [Configuración de permisos](#permission-configuration).      |
| ACP session fails early with little output                                  | Las solicitudes de permiso están bloqueadas por `permissionMode`/`nonInteractivePermissions`. | Revisa los registros del gateway para `AcpRuntimeError`. Para permisos completos, establece `permissionMode=approve-all`; para degradación controlada, establece `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | El proceso del harness terminó pero la sesión ACP no informó la finalización.   | Supervisa con `ps aux \| grep acpx`; mata manualmente los procesos obsoletos.                                                                                         |
