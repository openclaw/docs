---
read_when:
    - Ejecutar arneses de programación mediante ACP
    - Configurar sesiones ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de canal de mensajes a una sesión ACP persistente
    - Solución de problemas del backend ACP y del cableado de plugins
    - Depurar la entrega de finalización de ACP o los bucles entre agentes
    - Operar comandos `/acp` desde el chat
summary: Usar sesiones de tiempo de ejecución ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP y otros agentes de arnés
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-23T14:08:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permiten que OpenClaw ejecute arneses externos de programación (por ejemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI y otros arneses ACPX compatibles) mediante un plugin de backend ACP.

Si le pides a OpenClaw en lenguaje natural que “ejecute esto en Codex” o “inicie Claude Code en un hilo”, OpenClaw debe enrutar esa solicitud al tiempo de ejecución ACP (no al tiempo de ejecución nativo de subagentes). Cada creación de sesión ACP se rastrea como una [tarea en segundo plano](/es/automation/tasks).

Si quieres que Codex o Claude Code se conecten como cliente MCP externo directamente
a conversaciones de canales existentes de OpenClaw, usa [`openclaw mcp serve`](/es/cli/mcp)
en lugar de ACP.

## ¿Qué página quiero?

Hay tres superficies cercanas que es fácil confundir:

| Quieres...                                                                        | Usa esto                              | Notas                                                                                                            |
| --------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Ejecutar Codex, Claude Code, Gemini CLI u otro arnés externo _a través de_ OpenClaw | Esta página: agentes ACP              | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de tiempo de ejecución |
| Exponer una sesión de Gateway de OpenClaw _como_ servidor ACP para un editor o cliente | [`openclaw acp`](/es/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw por stdio/WebSocket                                          |
| Reutilizar una CLI local de IA como modelo de respaldo solo de texto              | [Backends CLI](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin tiempo de ejecución de arnés                   |

## ¿Esto funciona de inmediato?

Normalmente, sí.

- Las instalaciones nuevas ahora incluyen el plugin de tiempo de ejecución `acpx` habilitado por defecto.
- El plugin incluido `acpx` prefiere su binario `acpx` fijado localmente en el plugin.
- Al arrancar, OpenClaw sondea ese binario y lo autorrepara si es necesario.
- Empieza con `/acp doctor` si quieres una comprobación rápida del estado de preparación.

Lo que todavía puede ocurrir en el primer uso:

- Un adaptador de arnés de destino puede descargarse bajo demanda con `npx` la primera vez que uses ese arnés.
- La autenticación del proveedor sigue teniendo que existir en el host para ese arnés.
- Si el host no tiene acceso a npm/red, las descargas iniciales del adaptador pueden fallar hasta que se precalienten las cachés o se instale el adaptador de otra forma.

Ejemplos:

- `/acp spawn codex`: OpenClaw debería estar listo para arrancar `acpx`, pero el adaptador ACP de Codex aún puede necesitar una descarga de primer uso.
- `/acp spawn claude`: igual para el adaptador ACP de Claude, más la autenticación del lado de Claude en ese host.

## Flujo rápido para operadores

Úsalo cuando quieras un runbook práctico de `/acp`:

1. Crea una sesión:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabaja en la conversación o hilo vinculado (o apunta explícitamente a esa clave de sesión).
3. Comprueba el estado del tiempo de ejecución:
   - `/acp status`
4. Ajusta las opciones de tiempo de ejecución según sea necesario:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Redirige una sesión activa sin reemplazar el contexto:
   - `/acp steer tighten logging and continue`
6. Detén el trabajo:
   - `/acp cancel` (detener el turno actual), o
   - `/acp close` (cerrar sesión + eliminar bindings)

## Inicio rápido para personas

Ejemplos de solicitudes naturales:

- “Vincula este canal de Discord a Codex.”
- “Inicia una sesión persistente de Codex en un hilo aquí y mantenla enfocada.”
- “Ejecuta esto como una sesión ACP de Claude Code de una sola vez y resume el resultado.”
- “Vincula este chat de iMessage a Codex y mantén los seguimientos en el mismo espacio de trabajo.”
- “Usa Gemini CLI para esta tarea en un hilo y luego mantén los seguimientos en ese mismo hilo.”

Lo que OpenClaw debe hacer:

1. Elegir `runtime: "acp"`.
2. Resolver el arnés solicitado (`agentId`, por ejemplo `codex`).
3. Si se solicita la vinculación a la conversación actual y el canal activo lo admite, vincular la sesión ACP a esa conversación.
4. En caso contrario, si se solicita vinculación a hilo y el canal actual lo admite, vincular la sesión ACP al hilo.
5. Enrutar los mensajes de seguimiento vinculados a esa misma sesión ACP hasta que se desenfoque/cierre/expire.

## ACP frente a subagentes

Usa ACP cuando quieras un tiempo de ejecución de arnés externo. Usa subagentes cuando quieras ejecuciones delegadas nativas de OpenClaw.

| Área          | Sesión ACP                            | Ejecución de subagente               |
| ------------- | ------------------------------------- | ------------------------------------ |
| Tiempo de ejecución | Plugin de backend ACP (por ejemplo acpx) | Tiempo de ejecución nativo de subagente de OpenClaw |
| Clave de sesión | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`    |
| Comandos principales | `/acp ...`                        | `/subagents ...`                     |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (tiempo de ejecución predeterminado) |

Consulta también [Subagentes](/es/tools/subagents).

## Cómo ejecuta ACP Claude Code

Para Claude Code a través de ACP, la pila es:

1. Plano de control de sesiones ACP de OpenClaw
2. Plugin de tiempo de ejecución incluido `acpx`
3. Adaptador ACP de Claude
4. Maquinaria de tiempo de ejecución/sesión del lado de Claude

Distinción importante:

- ACP Claude es una sesión de arnés con controles ACP, reanudación de sesión, seguimiento de tareas en segundo plano y vinculación opcional a conversación/hilo.
- Los backends CLI son tiempos de ejecución locales separados y solo de texto como respaldo. Consulta [Backends CLI](/es/gateway/cli-backends).

Para operadores, la regla práctica es:

- si quieres `/acp spawn`, sesiones vinculables, controles de tiempo de ejecución o trabajo persistente de arnés: usa ACP
- si quieres un respaldo local simple de texto mediante la CLI sin procesar: usa backends CLI

## Sesiones vinculadas

### Vinculaciones a la conversación actual

Usa `/acp spawn <harness> --bind here` cuando quieras que la conversación actual se convierta en un espacio de trabajo ACP duradero sin crear un hilo hijo.

Comportamiento:

- OpenClaw sigue siendo el propietario del transporte del canal, la autenticación, la seguridad y la entrega.
- La conversación actual se fija a la clave de sesión ACP creada.
- Los mensajes de seguimiento en esa conversación se enrutan a la misma sesión ACP.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en el lugar.
- `/acp close` cierra la sesión y elimina la vinculación de la conversación actual.

Qué significa esto en la práctica:

- `--bind here` mantiene la misma superficie de chat. En Discord, el canal actual sigue siendo el canal actual.
- `--bind here` puede seguir creando una nueva sesión ACP si estás generando trabajo nuevo. La vinculación adjunta esa sesión a la conversación actual.
- `--bind here` no crea por sí solo un hilo hijo de Discord ni un tema de Telegram.
- El tiempo de ejecución ACP puede seguir teniendo su propio directorio de trabajo (`cwd`) o espacio de trabajo administrado por backend en disco. Ese espacio de trabajo de tiempo de ejecución es independiente de la superficie de chat y no implica un nuevo hilo de mensajería.
- Si creas una sesión para un agente ACP distinto y no pasas `--cwd`, OpenClaw hereda por defecto el espacio de trabajo del **agente de destino**, no el del solicitante.
- Si esa ruta heredada del espacio de trabajo no existe (`ENOENT`/`ENOTDIR`), OpenClaw usa como respaldo el cwd predeterminado del backend en lugar de reutilizar silenciosamente el árbol incorrecto.
- Si el espacio de trabajo heredado existe pero no se puede acceder a él (por ejemplo `EACCES`), la creación devuelve el error real de acceso en lugar de descartar `cwd`.

Modelo mental:

- superficie de chat: donde la gente sigue hablando (`canal de Discord`, `tema de Telegram`, `chat de iMessage`)
- sesión ACP: el estado duradero del tiempo de ejecución Codex/Claude/Gemini al que OpenClaw enruta
- hilo/tema hijo: una superficie adicional opcional de mensajería creada solo por `--thread ...`
- espacio de trabajo de tiempo de ejecución: la ubicación del sistema de archivos donde corre el arnés (`cwd`, checkout del repositorio, espacio de trabajo del backend)

Ejemplos:

- `/acp spawn codex --bind here`: mantener este chat, crear o adjuntar una sesión ACP de Codex y enrutar aquí los futuros mensajes a ella
- `/acp spawn codex --thread auto`: OpenClaw puede crear un hilo/tema hijo y vincular allí la sesión ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: misma vinculación al chat que arriba, pero Codex se ejecuta en `/workspace/repo`

Compatibilidad con vinculación a la conversación actual:

- Los canales de chat/mensajería que anuncian compatibilidad con vinculación a la conversación actual pueden usar `--bind here` mediante la ruta compartida de vinculación de conversación.
- Los canales con semántica personalizada de hilo/tema pueden seguir proporcionando canonicalización específica del canal detrás de la misma interfaz compartida.
- `--bind here` siempre significa “vincular la conversación actual en el lugar”.
- Las vinculaciones genéricas a la conversación actual usan el almacén compartido de bindings de OpenClaw y sobreviven a reinicios normales del Gateway.

Notas:

- `--bind here` y `--thread ...` son mutuamente excluyentes en `/acp spawn`.
- En Discord, `--bind here` vincula el canal o hilo actual en el lugar. `spawnAcpSessions` solo es necesario cuando OpenClaw necesita crear un hilo hijo para `--thread auto|here`.
- Si el canal activo no expone bindings ACP para la conversación actual, OpenClaw devuelve un mensaje claro de no compatibilidad.
- `resume` y las preguntas sobre “sesión nueva” son preguntas de sesión ACP, no del canal. Puedes reutilizar o reemplazar el estado del tiempo de ejecución sin cambiar la superficie actual del chat.

### Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un adaptador de canal, las sesiones ACP pueden vincularse a hilos:

- OpenClaw vincula un hilo a una sesión ACP de destino.
- Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
- La salida de ACP se entrega de vuelta al mismo hilo.
- El desenfoque/cierre/archivo/expiración por inactividad o antigüedad máxima elimina la vinculación.

La compatibilidad de vinculación a hilos es específica del adaptador. Si el adaptador del canal activo no admite vinculaciones a hilos, OpenClaw devuelve un mensaje claro de no compatibilidad/no disponibilidad.

Indicadores de función requeridos para ACP vinculado a hilos:

- `acp.enabled=true`
- `acp.dispatch.enabled` está activado por defecto (establece `false` para pausar el despacho ACP)
- Indicador de creación ACP de hilos del adaptador de canal habilitado (específico del adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canales compatibles con hilos

- Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
- Compatibilidad integrada actual:
  - hilos/canales de Discord
  - temas de Telegram (temas de foro en grupos/supergrupos y temas de mensajes directos)
- Los canales de Plugin pueden añadir compatibilidad mediante la misma interfaz de binding.

## Ajustes específicos del canal

Para flujos de trabajo no efímeros, configura bindings ACP persistentes en entradas `bindings[]` de nivel superior.

### Modelo de binding

- `bindings[].type="acp"` marca un binding persistente de conversación ACP.
- `bindings[].match` identifica la conversación de destino:
  - Canal o hilo de Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tema de foro de Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/grupal de BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefiere `chat_id:*` o `chat_identifier:*` para bindings estables de grupo.
  - Chat DM/grupal de iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefiere `chat_id:*` para bindings estables de grupo.
- `bindings[].agentId` es el ID del agente OpenClaw propietario.
- Los sobrescritos ACP opcionales viven bajo `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valores predeterminados de tiempo de ejecución por agente

Usa `agents.list[].runtime` para definir los valores predeterminados ACP una vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID del arnés, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedencia de sobrescritura para sesiones ACP vinculadas:

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
- Los mensajes de ese canal o tema se enrutan a la sesión ACP configurada.
- En conversaciones vinculadas, `/new` y `/reset` restablecen la misma clave de sesión ACP en el lugar.
- Los bindings temporales de tiempo de ejecución (por ejemplo los creados por flujos de enfoque de hilos) siguen aplicándose cuando están presentes.
- Para creaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente de destino desde la configuración del agente.
- Las rutas heredadas de espacio de trabajo que falten recurren al cwd predeterminado del backend; los fallos de acceso en rutas existentes aparecen como errores de creación.

## Iniciar sesiones ACP (interfaces)

### Desde `sessions_spawn`

Usa `runtime: "acp"` para iniciar una sesión ACP desde un turno de agente o una llamada de herramienta.

```json
{
  "task": "Abre el repositorio y resume las pruebas que fallan",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notas:

- `runtime` usa `subagent` por defecto, así que establece `runtime: "acp"` explícitamente para sesiones ACP.
- Si se omite `agentId`, OpenClaw usa `acp.defaultAgent` cuando está configurado.
- `mode: "session"` requiere `thread: true` para mantener una conversación persistente vinculada.

Detalles de la interfaz:

- `task` (obligatorio): prompt inicial enviado a la sesión ACP.
- `runtime` (obligatorio para ACP): debe ser `"acp"`.
- `agentId` (opcional): ID del arnés ACP de destino. Recurre a `acp.defaultAgent` si está establecido.
- `thread` (opcional, predeterminado `false`): solicita flujo de vinculación a hilo donde sea compatible.
- `mode` (opcional): `run` (una sola vez) o `session` (persistente).
  - el valor predeterminado es `run`
  - si `thread: true` y se omite el modo, OpenClaw puede usar por defecto comportamiento persistente según la ruta de tiempo de ejecución
  - `mode: "session"` requiere `thread: true`
- `cwd` (opcional): directorio de trabajo solicitado para el tiempo de ejecución (validado por la política del backend/tiempo de ejecución). Si se omite, la creación ACP hereda el espacio de trabajo del agente de destino cuando está configurado; las rutas heredadas que faltan recurren a valores predeterminados del backend, mientras que los errores reales de acceso se devuelven.
- `label` (opcional): etiqueta orientada al operador usada en el texto de sesión/banner.
- `resumeSessionId` (opcional): reanuda una sesión ACP existente en lugar de crear una nueva. El agente vuelve a reproducir su historial de conversación mediante `session/load`. Requiere `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resúmenes del progreso de la ejecución ACP inicial de vuelta a la sesión solicitante como eventos del sistema.
  - Cuando está disponible, las respuestas aceptadas incluyen `streamLogPath` apuntando a un registro JSONL acotado a la sesión (`<sessionId>.acp-stream.jsonl`) que puedes seguir para obtener el historial completo del relay.
- `model` (opcional): sobrescritura explícita del modelo para la sesión hija ACP. Se respeta para `runtime: "acp"` para que la sesión hija use el modelo solicitado en lugar de recurrir silenciosamente al predeterminado del agente de destino.

## Modelo de entrega

Las sesiones ACP pueden ser espacios de trabajo interactivos o trabajo de fondo propiedad del padre. La ruta de entrega depende de esa forma.

### Sesiones ACP interactivas

Las sesiones interactivas están pensadas para seguir conversando en una superficie visible de chat:

- `/acp spawn ... --bind here` vincula la conversación actual a la sesión ACP.
- `/acp spawn ... --thread ...` vincula un hilo/tema de canal a la sesión ACP.
- Los `bindings[].type="acp"` persistentes configurados enrutan las conversaciones coincidentes a la misma sesión ACP.

Los mensajes de seguimiento en la conversación vinculada se enrutan directamente a la sesión ACP, y la salida de ACP se entrega de vuelta al mismo canal/hilo/tema.

### Sesiones ACP de una sola vez propiedad del padre

Las sesiones ACP de una sola vez creadas por otra ejecución de agente son hijas en segundo plano, similares a subagentes:

- El padre pide trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
- La hija se ejecuta en su propia sesión de arnés ACP.
- La finalización se informa de vuelta a través de la ruta interna de anuncio de finalización de tareas.
- El padre reescribe el resultado de la hija con voz normal de asistente cuando resulta útil una respuesta orientada al usuario.

No trates esta ruta como un chat peer-to-peer entre padre e hija. La hija ya tiene un canal de finalización de vuelta al padre.

### `sessions_send` y entrega A2A

`sessions_send` puede apuntar a otra sesión después de la creación. Para sesiones peer normales, OpenClaw usa una ruta de seguimiento agente a agente (A2A) tras inyectar el mensaje:

- esperar la respuesta de la sesión de destino
- opcionalmente permitir que solicitante y destino intercambien un número limitado de turnos de seguimiento
- pedir al destino que produzca un mensaje de anuncio
- entregar ese anuncio al canal o hilo visible

Esa ruta A2A es un respaldo para envíos entre pares donde el remitente necesita un seguimiento visible. Sigue habilitada cuando una sesión no relacionada puede ver y enviar mensajes a un objetivo ACP, por ejemplo bajo configuraciones amplias de `tools.sessions.visibility`.

OpenClaw omite el seguimiento A2A solo cuando el solicitante es el padre de su propia hija ACP de una sola vez propiedad del padre. En ese caso, ejecutar A2A encima de la finalización de tareas puede despertar al padre con el resultado de la hija, reenviar la respuesta del padre de vuelta a la hija y crear un bucle de eco padre/hija. El resultado de `sessions_send` informa `delivery.status="skipped"` para ese caso de hija propia porque la ruta de finalización ya es responsable del resultado.

### Reanudar una sesión existente

Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de empezar desde cero. El agente vuelve a reproducir su historial de conversación mediante `session/load`, por lo que retoma el contexto completo de lo ocurrido antes.

```json
{
  "task": "Continúa donde lo dejamos: corrige los fallos de prueba restantes",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comunes:

- Transferir una sesión de Codex desde tu portátil a tu teléfono: pídele a tu agente que retome donde lo dejaste
- Continuar una sesión de programación que iniciaste interactivamente en la CLI, ahora sin interfaz a través de tu agente
- Retomar trabajo que se interrumpió por un reinicio del Gateway o una expiración por inactividad

Notas:

- `resumeSessionId` requiere `runtime: "acp"`; devuelve un error si se usa con el tiempo de ejecución de subagente.
- `resumeSessionId` restaura el historial de conversación ACP upstream; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, así que `mode: "session"` sigue requiriendo `thread: true`.
- El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
- Si no se encuentra el ID de sesión, la creación falla con un error claro, sin respaldo silencioso a una sesión nueva.

### Prueba de humo para operadores

Úsala después de desplegar un Gateway cuando quieras una comprobación rápida en vivo de que la creación ACP
está funcionando realmente de extremo a extremo, no solo pasando pruebas unitarias.

Validación recomendada:

1. Verifica la versión/commit del Gateway desplegado en el host de destino.
2. Confirma que el código fuente desplegado incluya la aceptación de linaje ACP en
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abre una sesión temporal de puente ACPX hacia un agente activo (por ejemplo
   `razor(main)` en `jpclawhq`).
4. Pide a ese agente que llame a `sessions_spawn` con:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tarea: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifica que el agente informe:
   - `accepted=yes`
   - un `childSessionKey` real
   - ningún error de validador
6. Limpia la sesión temporal de puente ACPX.

Ejemplo de prompt para el agente activo:

```text
Usa la herramienta sessions_spawn ahora con runtime: "acp", agentId: "codex" y mode: "run".
Establece la tarea en: "Reply with exactly LIVE-ACP-SPAWN-OK".
Luego informa solo: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notas:

- Mantén esta prueba de humo en `mode: "run"` a menos que estés probando intencionadamente
  sesiones ACP persistentes vinculadas a hilos.
- No exijas `streamTo: "parent"` para la validación básica. Esa ruta depende de
  capacidades de solicitante/sesión y es una comprobación de integración aparte.
- Trata la prueba de `mode: "session"` vinculada a hilos como una segunda pasada de integración,
  más rica, desde un hilo real de Discord o un tema de Telegram.

## Compatibilidad con sandbox

Las sesiones ACP actualmente se ejecutan en el tiempo de ejecución del host, no dentro del sandbox de OpenClaw.

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, las creaciones ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` cuando necesites ejecución aplicada por sandbox.

### Desde el comando `/acp`

Usa `/acp spawn` para control explícito del operador desde el chat cuando sea necesario.

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

Consulta [Comandos con barra](/es/tools/slash-commands).

## Resolución de objetivo de sesión

La mayoría de las acciones `/acp` aceptan un objetivo opcional de sesión (`session-key`, `session-id` o `session-label`).

Orden de resolución:

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - primero intenta clave
   - luego ID de sesión con forma UUID
   - luego etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculado a una sesión ACP)
3. Respaldo de la sesión solicitante actual

Las vinculaciones a la conversación actual y a hilos participan ambas en el paso 2.

Si no se resuelve ningún objetivo, OpenClaw devuelve un error claro (`Unable to resolve session target: ...`).

## Modos de vinculación de creación

`/acp spawn` admite `--bind here|off`.

| Mode   | Behavior                                                                   |
| ------ | -------------------------------------------------------------------------- |
| `here` | Vincula la conversación activa actual en el lugar; falla si no hay ninguna activa. |
| `off`  | No crea una vinculación de conversación actual.                             |

Notas:

- `--bind here` es la ruta de operador más simple para “hacer que este canal o chat esté respaldado por Codex”.
- `--bind here` no crea un hilo hijo.
- `--bind here` solo está disponible en canales que exponen compatibilidad con vinculación a la conversación actual.
- `--bind` y `--thread` no pueden combinarse en la misma llamada `/acp spawn`.

## Modos de hilo de creación

`/acp spawn` admite `--thread auto|here|off`.

| Mode   | Behavior                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo hijo cuando sea compatible. |
| `here` | Requiere un hilo activo actual; falla si no estás en uno.                                            |
| `off`  | Sin vinculación. La sesión se inicia sin vincular.                                                    |

Notas:

- En superficies sin vinculación a hilos, el comportamiento predeterminado es, en la práctica, `off`.
- La creación vinculada a hilos requiere compatibilidad en la política del canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo hijo.

## Controles ACP

Familia de comandos disponibles:

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

`/acp status` muestra las opciones efectivas del tiempo de ejecución y, cuando están disponibles, tanto los identificadores de sesión a nivel de tiempo de ejecución como a nivel de backend.

Algunos controles dependen de las capacidades del backend. Si un backend no admite un control, OpenClaw devuelve un error claro de control no compatible.

## Recetario de comandos ACP

| Command              | What it does                                                | Example                                                       |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación opcional actual o a hilo.  | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso para la sesión de destino.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de dirección a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula objetivos de hilo.            | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de tiempo de ejecución y capacidades. | `/acp status`                                    |
| `/acp set-mode`      | Establece el modo de tiempo de ejecución para la sesión de destino. | `/acp set-mode plan`                                   |
| `/acp set`           | Escritura genérica de opción de configuración de tiempo de ejecución. | `/acp set model openai/gpt-5.4`                         |
| `/acp cwd`           | Establece la sobrescritura del directorio de trabajo del tiempo de ejecución. | `/acp cwd /Users/user/Projects/repo`                |
| `/acp permissions`   | Establece el perfil de política de aprobación.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del tiempo de ejecución (segundos). | `/acp timeout 120`                                       |
| `/acp model`         | Establece la sobrescritura del modelo del tiempo de ejecución. | `/acp model anthropic/claude-opus-4-6`                  |
| `/acp reset-options` | Elimina las sobrescrituras de opciones del tiempo de ejecución de la sesión. | `/acp reset-options`                                |
| `/acp sessions`      | Lista sesiones ACP recientes del almacén.                   | `/acp sessions`                                               |
| `/acp doctor`        | Estado de salud del backend, capacidades y correcciones accionables. | `/acp doctor`                                          |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación.  | `/acp install`                                                |

`/acp sessions` lee el almacén para la sesión vinculada actual o la sesión solicitante. Los comandos que aceptan tokens `session-key`, `session-id` o `session-label` resuelven objetivos mediante el descubrimiento de sesiones del Gateway, incluidas raíces personalizadas `session.store` por agente.

## Mapeo de opciones de tiempo de ejecución

`/acp` tiene comandos de conveniencia y un setter genérico.

Operaciones equivalentes:

- `/acp model <id>` se asigna a la clave de configuración de tiempo de ejecución `model`.
- `/acp permissions <profile>` se asigna a la clave de configuración de tiempo de ejecución `approval_policy`.
- `/acp timeout <seconds>` se asigna a la clave de configuración de tiempo de ejecución `timeout`.
- `/acp cwd <path>` actualiza directamente la sobrescritura de cwd del tiempo de ejecución.
- `/acp set <key> <value>` es la ruta genérica.
  - Caso especial: `key=cwd` usa la ruta de sobrescritura de cwd.
- `/acp reset-options` limpia todas las sobrescrituras de tiempo de ejecución de la sesión de destino.

## Compatibilidad actual de arneses acpx

Alias integrados actuales de arneses acpx:

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

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId` a menos que tu configuración de acpx defina alias de agente personalizados.
Si tu instalación local de Cursor todavía expone ACP como `agent acp`, sobrescribe el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal `agentId` de OpenClaw).

## Configuración requerida

Línea base principal de ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. El valor predeterminado es true; establece false para pausar el despacho ACP manteniendo los controles /acp.
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

Las vinculaciones a la conversación actual no requieren creación de hilos hijos. Requieren un contexto activo de conversación y un adaptador de canal que exponga vinculaciones ACP de conversación.

Consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del plugin para backend acpx

Las instalaciones nuevas incluyen el plugin de tiempo de ejecución `acpx` habilitado por defecto, por lo que ACP
suele funcionar sin un paso manual de instalación de plugin.

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

Instalación desde espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica el estado del backend:

```text
/acp doctor
```

### Configuración de comando y versión de acpx

Por defecto, el plugin integrado de backend acpx (`acpx`) usa el binario fijado localmente en el plugin:

1. El comando usa por defecto `node_modules/.bin/acpx` local al plugin dentro del paquete del plugin ACPX.
2. La versión esperada usa por defecto la fijación de la extensión.
3. El arranque registra inmediatamente el backend ACP como no preparado.
4. Un trabajo de aseguramiento en segundo plano verifica `acpx --version`.
5. Si el binario local al plugin falta o no coincide, ejecuta:
   `npm install --omit=dev --no-save acpx@<pinned>` y vuelve a verificar.

Puedes sobrescribir comando/versión en la configuración del plugin:

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

- `command` acepta una ruta absoluta, ruta relativa o nombre de comando (`acpx`).
- Las rutas relativas se resuelven desde el directorio de espacio de trabajo de OpenClaw.
- `expectedVersion: "any"` desactiva la comprobación estricta de versión.
- Cuando `command` apunta a un binario/ruta personalizados, se desactiva la autoinstalación local al plugin.
- El arranque de OpenClaw sigue sin bloquear mientras se ejecuta la comprobación de salud del backend.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las
dependencias de tiempo de ejecución de acpx (binarios específicos de plataforma) se instalan automáticamente
mediante un hook postinstall. Si la instalación automática falla, el Gateway sigue arrancando
con normalidad e informa de la dependencia faltante a través de `openclaw acp doctor`.

### Puente MCP de herramientas de Plugin

Por defecto, las sesiones ACPX **no** exponen herramientas registradas por plugins de OpenClaw al
arnés ACP.

Si quieres que agentes ACP como Codex o Claude Code llamen a herramientas instaladas
de Plugin de OpenClaw como recuperación/almacenamiento de memoria, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el arranque de sesiones ACPX.
- Expone herramientas de Plugin ya registradas por plugins instalados y habilitados de OpenClaw.
- Mantiene la función como explícita y desactivada por defecto.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del arnés ACP.
- Los agentes ACP solo obtienen acceso a herramientas de Plugin ya activas en el Gateway.
- Trátalo como el mismo límite de confianza que permitir que esos plugins se ejecuten dentro del propio OpenClaw.
- Revisa los plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de Plugin es una comodidad adicional de adhesión explícita, no un reemplazo de la configuración genérica de servidores MCP.

### Puente MCP de herramientas de OpenClaw

Por defecto, las sesiones ACPX tampoco exponen herramientas integradas de OpenClaw a través de
MCP. Habilita el puente separado de herramientas principales cuando un agente ACP necesite herramientas
integradas seleccionadas como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el arranque de sesiones ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene explícita la exposición de herramientas principales y desactivada por defecto.

### Configuración del tiempo de espera de tiempo de ejecución

El plugin incluido `acpx` usa por defecto un tiempo de espera de 120 segundos para
turnos de tiempo de ejecución integrados. Esto da a arneses más lentos como Gemini CLI tiempo suficiente para completar
el arranque e inicialización de ACP. Sobrescríbelo si tu host necesita un
límite de tiempo diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicia el Gateway después de cambiar este valor.

### Configuración del agente de sondeo de salud

El plugin incluido `acpx` sondea un agente de arnés al decidir si el
backend integrado de tiempo de ejecución está listo. Usa `codex` por defecto. Si tu implementación
usa otro agente ACP predeterminado, establece el agente de sondeo con ese mismo ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el Gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan sin interacción; no hay TTY para aprobar o denegar solicitudes de permisos de escritura de archivos y ejecución de shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se manejan los permisos:

Estos permisos de arnés ACPX son independientes de las aprobaciones de exec de OpenClaw y también independientes de los indicadores de omisión del proveedor en backends CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia a nivel de arnés para sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente del arnés sin solicitar confirmación.

| Value           | Behavior                                                         |
| --------------- | ---------------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y exec requieren solicitudes. |
| `deny-all`      | Deniega todas las solicitudes de permisos.                       |

### `nonInteractivePermissions`

Controla qué ocurre cuando se mostraría una solicitud de permisos pero no hay un TTY interactivo disponible (lo que siempre ocurre en sesiones ACP).

| Value  | Behavior                                                              |
| ------ | --------------------------------------------------------------------- |
| `fail` | Aborta la sesión con `AcpRuntimeError`. **(predeterminado)**          |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación elegante). |

### Configuración

Configúralo mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el Gateway después de cambiar estos valores.

> **Importante:** actualmente OpenClaw usa por defecto `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP sin interacción, cualquier escritura o exec que active una solicitud de permisos puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden de forma elegante en lugar de bloquearse.

## Solución de problemas

| Symptom                                                                      | Likely cause                                                                    | Fix                                                                                                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                      | Falta el plugin de backend o está deshabilitado.                                | Instala y habilita el plugin de backend, luego ejecuta `/acp doctor`.                                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                              | ACP está deshabilitado globalmente.                                             | Establece `acp.enabled=true`.                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`            | El despacho desde mensajes normales del hilo está deshabilitado.                | Establece `acp.dispatch.enabled=true`.                                                                                                                            |
| `ACP agent "<id>" is not allowed by policy`                                  | El agente no está en la lista de permitidos.                                    | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                      |
| `Unable to resolve session target: ...`                                      | Token de clave/id/etiqueta incorrecto.                                          | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation`  | Se usó `--bind here` sin una conversación activa vinculable.                    | Ve al chat/canal de destino y vuelve a intentarlo, o usa una creación sin vincular.                                                                              |
| `Conversation bindings are unavailable for <channel>.`                       | El adaptador carece de capacidad ACP de vinculación a la conversación actual.   | Usa `/acp spawn ... --thread ...` donde sea compatible, configura `bindings[]` de nivel superior o cambia a un canal compatible.                                |
| `--thread here requires running /acp spawn inside an active ... thread`      | Se usó `--thread here` fuera de un contexto de hilo.                            | Ve al hilo de destino o usa `--thread auto`/`off`.                                                                                                                |
| `Only <user-id> can rebind this channel/conversation/thread.`                | Otro usuario es propietario del objetivo activo de binding.                     | Vuelve a vincular como propietario o usa otra conversación o hilo.                                                                                                |
| `Thread bindings are unavailable for <channel>.`                             | El adaptador carece de capacidad de vinculación a hilos.                        | Usa `--thread off` o cambia a un adaptador/canal compatible.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                           | El tiempo de ejecución ACP está en el host; la sesión solicitante está en sandbox. | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la creación ACP desde una sesión sin sandbox.                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`      | Se solicitó `sandbox="require"` para el tiempo de ejecución ACP.                | Usa `runtime="subagent"` para sandboxing obligatorio, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                           |
| Missing ACP metadata for bound session                                       | Metadatos ACP obsoletos/eliminados de la sesión.                                | Vuelve a crear con `/acp spawn`, luego vuelve a vincular/enfocar el hilo.                                                                                       |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`     | `permissionMode` bloquea escrituras/exec en sesiones ACP sin interacción.       | Establece `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia el Gateway. Consulta [Configuración de permisos](#permission-configuration). |
| ACP session fails early with little output                                   | Las solicitudes de permisos están bloqueadas por `permissionMode`/`nonInteractivePermissions`. | Revisa los registros del Gateway para `AcpRuntimeError`. Para permisos completos, establece `permissionMode=approve-all`; para degradación elegante, establece `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                        | El proceso del arnés terminó pero la sesión ACP no informó su finalización.     | Supervisa con `ps aux \| grep acpx`; mata manualmente los procesos obsoletos.                                                                                    |
