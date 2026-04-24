---
read_when:
    - Ejecutar arneses de coding mediante ACP
    - Configurar sesiones ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de un canal de mensajes a una sesión ACP persistente
    - Solucionar problemas del backend ACP y del cableado de Plugins
    - Depurar la entrega de completado ACP o los bucles agente a agente
    - Operar comandos `/acp` desde el chat
summary: Usar sesiones de runtime ACP para Claude Code, Cursor, Gemini CLI, fallback ACP explícito de Codex, ACP de OpenClaw y otros agentes de arnés
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-24T05:51:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permiten a OpenClaw ejecutar arneses externos de coding (por ejemplo Pi, Claude Code, Cursor, Copilot, ACP de OpenClaw, OpenCode, Gemini CLI y otros arneses ACPX compatibles) mediante un Plugin de backend ACP.

Si le pides a OpenClaw en lenguaje natural que vincule o controle Codex en la conversación actual, OpenClaw debe usar el Plugin nativo app-server de Codex (`/codex bind`, `/codex threads`, `/codex resume`). Si pides `/acp`, ACP, acpx o una sesión hija en segundo plano de Codex, OpenClaw puede seguir enrutando Codex mediante ACP. Cada creación de sesión ACP se registra como una [tarea en segundo plano](/es/automation/tasks).

Si le pides a OpenClaw en lenguaje natural que “inicie Claude Code en un hilo” o que use otro arnés externo, OpenClaw debe enrutar esa solicitud al runtime ACP (no al runtime nativo de subagentes).

Si quieres que Codex o Claude Code se conecten como cliente MCP externo directamente
a conversaciones de canal existentes de OpenClaw, usa [`openclaw mcp serve`](/es/cli/mcp)
en lugar de ACP.

## ¿Qué página quiero?

Hay tres superficies cercanas que es fácil confundir:

| Quieres...                                                                                     | Usa esto                              | Notas                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular o controlar Codex en la conversación actual                                           | `/codex bind`, `/codex threads`       | Ruta nativa app-server de Codex; incluye respuestas en chat vinculado, reenvío de imágenes, modelo/fast/permisos, stop y controles de dirección. ACP es un fallback explícito |
| Ejecutar Claude Code, Gemini CLI, Codex ACP explícito u otro arnés externo _a través de_ OpenClaw | Esta página: agentes ACP              | Sesiones vinculadas a chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime                                  |
| Exponer una sesión de Gateway de OpenClaw _como_ servidor ACP para un editor o cliente        | [`openclaw acp`](/es/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw por stdio/WebSocket                                                                                          |
| Reutilizar una CLI de IA local como fallback de modelo solo de texto                          | [CLI Backends](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin runtime de arnés                                                                                |

## ¿Funciona sin configuración adicional?

Normalmente, sí. Las instalaciones nuevas incluyen el Plugin de runtime `acpx` habilitado por defecto, con un binario `acpx` fijado localmente en el Plugin que OpenClaw sondea y autorrepara al iniciar. Ejecuta `/acp doctor` para una comprobación de disponibilidad.

Problemas habituales en la primera ejecución:

- Los adaptadores del arnés objetivo (Codex, Claude, etc.) pueden descargarse bajo demanda con `npx` la primera vez que los uses.
- La autenticación del proveedor debe seguir existiendo en el host para ese arnés.
- Si el host no tiene npm o acceso a la red, la primera descarga del adaptador fallará hasta que las cachés estén precalentadas o el adaptador se instale de otro modo.

## Guía operativa

Flujo rápido de `/acp` desde el chat:

1. **Crear** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto`, o explícitamente `/acp spawn codex --bind here`
2. **Trabajar** en la conversación o hilo vinculado (o apuntar explícitamente a la clave de sesión).
3. **Comprobar estado** — `/acp status`
4. **Ajustar** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Dirigir** sin reemplazar el contexto — `/acp steer tighten logging and continue`
6. **Detener** — `/acp cancel` (turno actual) o `/acp close` (sesión + vínculos)

Disparadores en lenguaje natural que deberían enrutar al Plugin nativo de Codex:

- "Vincula este canal de Discord a Codex."
- "Conecta este chat al hilo de Codex `<id>`."
- "Muestra los hilos de Codex y luego vincula este."

La vinculación nativa de conversación de Codex es la ruta predeterminada de control por chat, pero es intencionalmente conservadora para flujos interactivos de aprobación/herramientas de Codex: las herramientas dinámicas y los prompts de aprobación de OpenClaw aún no se exponen mediante esta ruta de chat vinculado, por lo que esas solicitudes se rechazan con una explicación clara. Usa la ruta del arnés Codex o el fallback ACP explícito cuando el flujo dependa de herramientas dinámicas de OpenClaw o de aprobaciones interactivas de larga duración.

Disparadores en lenguaje natural que deberían enrutar al runtime ACP:

- "Ejecuta esto como una sesión ACP one-shot de Claude Code y resume el resultado."
- "Usa Gemini CLI para esta tarea en un hilo y luego mantén los seguimientos en ese mismo hilo."
- "Ejecuta Codex mediante ACP en un hilo en segundo plano."

OpenClaw elige `runtime: "acp"`, resuelve el `agentId` del arnés, se vincula a la conversación o hilo actual cuando es compatible y enruta los seguimientos a esa sesión hasta cierre/caducidad. Codex solo sigue esta ruta cuando ACP es explícito o cuando el runtime en segundo plano solicitado aún necesita ACP.

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de arnés externo. Usa el app-server nativo de Codex para vinculación/control de conversaciones de Codex. Usa subagentes cuando quieras ejecuciones delegadas nativas de OpenClaw.

| Área          | Sesión ACP                            | Ejecución de subagente                |
| ------------- | ------------------------------------- | ------------------------------------- |
| Runtime       | Plugin de backend ACP (por ejemplo acpx) | Runtime nativo de subagente de OpenClaw |
| Clave de sesión | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`     |
| Comandos principales | `/acp ...`                     | `/subagents ...`                      |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predeterminado) |

Consulta también [Subagentes](/es/tools/subagents).

## Cómo ejecuta ACP Claude Code

Para Claude Code mediante ACP, la pila es:

1. Plano de control de sesiones ACP de OpenClaw
2. Plugin de runtime `acpx` incluido
3. Adaptador ACP de Claude
4. Runtime/sesión del lado de Claude

Distinción importante:

- ACP Claude es una sesión de arnés con controles ACP, reanudación de sesión, seguimiento de tareas en segundo plano y vinculación opcional a conversación/hilo.
- Los CLI Backends son runtimes locales separados y solo de texto. Consulta [CLI Backends](/es/gateway/cli-backends).

Para los operadores, la regla práctica es:

- si quieres `/acp spawn`, sesiones vinculables, controles de runtime o trabajo persistente del arnés: usa ACP
- si quieres un simple fallback de texto local mediante la CLI sin procesar: usa CLI Backends

## Sesiones vinculadas

### Vínculos a la conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la sesión ACP creada; sin hilo hijo, misma superficie de chat. OpenClaw sigue controlando transporte, autenticación, seguridad y entrega; los mensajes de seguimiento en esa conversación se enrutan a la misma sesión; `/new` y `/reset` reinician la sesión in situ; `/acp close` elimina el vínculo.

Modelo mental:

- **superficie de chat** — donde la gente sigue hablando (canal de Discord, topic de Telegram, chat de iMessage).
- **sesión ACP** — el estado persistente de runtime de Codex/Claude/Gemini al que OpenClaw enruta.
- **hilo/topic hijo** — una superficie adicional opcional de mensajería creada solo por `--thread ...`.
- **espacio de trabajo de runtime** — la ubicación del sistema de archivos (`cwd`, checkout del repo, espacio de trabajo del backend) donde se ejecuta el arnés. Independiente de la superficie de chat.

Ejemplos:

- `/codex bind` — mantiene este chat, crea o conecta un app-server nativo de Codex y enruta aquí los mensajes futuros.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — ajusta el hilo nativo de Codex vinculado desde el chat.
- `/codex stop` o `/codex steer focus on the failing tests first` — controla el turno activo nativo de Codex.
- `/acp spawn codex --bind here` — fallback ACP explícito para Codex.
- `/acp spawn codex --thread auto` — OpenClaw puede crear un hilo/topic hijo y vincularlo allí.
- `/acp spawn codex --bind here --cwd /workspace/repo` — mismo vínculo de chat, Codex se ejecuta en `/workspace/repo`.

Notas:

- `--bind here` y `--thread ...` son mutuamente excluyentes.
- `--bind here` solo funciona en canales que anuncian vinculación a la conversación actual; OpenClaw devuelve un mensaje claro de no compatible en caso contrario. Los vínculos persisten tras reinicios del gateway.
- En Discord, `spawnAcpSessions` solo es necesario cuando OpenClaw tiene que crear un hilo hijo para `--thread auto|here`, no para `--bind here`.
- Si creas una sesión en un ACP agent distinto sin `--cwd`, OpenClaw hereda por defecto el espacio de trabajo del **agente objetivo**. Las rutas heredadas faltantes (`ENOENT`/`ENOTDIR`) recurren al valor predeterminado del backend; otros errores de acceso (por ejemplo `EACCES`) aparecen como errores de creación.

### Sesiones vinculadas a hilos

Cuando la vinculación a hilos está habilitada para un adaptador de canal, las sesiones ACP pueden vincularse a hilos:

- OpenClaw vincula un hilo a una sesión ACP objetivo.
- Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
- La salida ACP se entrega de vuelta al mismo hilo.
- Quitar el foco/cerrar/archivar/timeout por inactividad o caducidad por antigüedad máxima elimina el vínculo.

La compatibilidad con la vinculación a hilos depende del adaptador. Si el adaptador de canal activo no admite vinculación a hilos, OpenClaw devuelve un mensaje claro de no compatible/no disponible.

Flags de función requeridas para ACP vinculado a hilos:

- `acp.enabled=true`
- `acp.dispatch.enabled` está activado por defecto (establece `false` para pausar el despacho ACP)
- Flag de creación de hilo ACP del adaptador de canal habilitada (específica del adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canales compatibles con hilos

- Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
- Compatibilidad integrada actual:
  - hilos/canales de Discord
  - topics de Telegram (topics de foro en grupos/supergrupos y topics de DM)
- Los canales Plugin pueden añadir compatibilidad mediante la misma interfaz de vinculación.

## Configuración específica de canal

Para flujos no efímeros, configura vínculos ACP persistentes en entradas de nivel superior `bindings[]`.

### Modelo de vinculación

- `bindings[].type="acp"` marca un vínculo persistente de conversación ACP.
- `bindings[].match` identifica la conversación objetivo:
  - canal o hilo de Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - topic de foro de Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - chat DM/grupal de BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefiere `chat_id:*` o `chat_identifier:*` para vínculos de grupo estables.
  - chat DM/grupal de iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefiere `chat_id:*` para vínculos de grupo estables.
- `bindings[].agentId` es el id del agente de OpenClaw propietario.
- Las sobrescrituras ACP opcionales viven bajo `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valores predeterminados de runtime por agente

Usa `agents.list[].runtime` para definir una vez los valores predeterminados de ACP por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id del arnés, por ejemplo `codex` o `claude`)
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
- Los mensajes de ese canal o topic se enrutan a la sesión ACP configurada.
- En conversaciones vinculadas, `/new` y `/reset` reinician in situ la misma clave de sesión ACP.
- Los vínculos temporales de runtime (por ejemplo, creados por flujos de foco en hilos) siguen aplicándose cuando existen.
- Para creaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el espacio de trabajo del agente objetivo desde la configuración del agente.
- Las rutas heredadas de espacio de trabajo que faltan recurren al `cwd` predeterminado del backend; los fallos de acceso reales se muestran como errores de creación.

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

- `runtime` tiene como valor predeterminado `subagent`, así que establece explícitamente `runtime: "acp"` para sesiones ACP.
- Si se omite `agentId`, OpenClaw usa `acp.defaultAgent` cuando está configurado.
- `mode: "session"` requiere `thread: true` para mantener una conversación persistente vinculada.

Detalles de la interfaz:

- `task` (obligatorio): prompt inicial enviado a la sesión ACP.
- `runtime` (obligatorio para ACP): debe ser `"acp"`.
- `agentId` (opcional): id del arnés ACP objetivo. Recurre a `acp.defaultAgent` si está configurado.
- `thread` (opcional, predeterminado `false`): solicita flujo de vinculación a hilo donde sea compatible.
- `mode` (opcional): `run` (one-shot) o `session` (persistente).
  - el valor predeterminado es `run`
  - si `thread: true` y se omite mode, OpenClaw puede usar comportamiento persistente por ruta de runtime
  - `mode: "session"` requiere `thread: true`
- `cwd` (opcional): directorio de trabajo solicitado del runtime (validado por la política del backend/runtime). Si se omite, la creación ACP hereda el espacio de trabajo del agente objetivo cuando está configurado; las rutas heredadas faltantes recurren a los valores predeterminados del backend, mientras que los errores reales de acceso se devuelven.
- `label` (opcional): etiqueta visible para el operador usada en el texto de sesión/banner.
- `resumeSessionId` (opcional): reanuda una sesión ACP existente en lugar de crear una nueva. El agente vuelve a reproducir su historial de conversación mediante `session/load`. Requiere `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resúmenes del progreso de la ejecución ACP inicial de vuelta a la sesión solicitante como eventos del sistema.
  - Cuando está disponible, las respuestas aceptadas incluyen `streamLogPath`, que apunta a un registro JSONL con alcance de sesión (`<sessionId>.acp-stream.jsonl`) que puedes seguir para obtener el historial completo del relay.
- `model` (opcional): sobrescritura explícita del modelo para la sesión hija ACP. Se respeta para `runtime: "acp"` de modo que la hija use el modelo solicitado en lugar de recurrir silenciosamente al valor predeterminado del agente objetivo.

## Modelo de entrega

Las sesiones ACP pueden ser espacios de trabajo interactivos o trabajo en segundo plano propiedad del padre. La ruta de entrega depende de esa forma.

### Sesiones ACP interactivas

Las sesiones interactivas están pensadas para seguir conversando en una superficie de chat visible:

- `/acp spawn ... --bind here` vincula la conversación actual a la sesión ACP.
- `/acp spawn ... --thread ...` vincula un hilo/topic de canal a la sesión ACP.
- Los `bindings[].type="acp"` persistentes configurados enrutan las conversaciones coincidentes a la misma sesión ACP.

Los mensajes de seguimiento en la conversación vinculada se enrutan directamente a la sesión ACP, y la salida ACP se entrega de vuelta al mismo canal/hilo/topic.

### Sesiones ACP one-shot propiedad del padre

Las sesiones ACP one-shot creadas por otra ejecución de agente son hijas en segundo plano, similares a los subagentes:

- El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
- La hija se ejecuta en su propia sesión de arnés ACP.
- La finalización se informa de vuelta mediante la ruta interna de anuncio de finalización de tareas.
- El padre reescribe el resultado de la hija con voz normal de asistente cuando resulta útil una respuesta orientada al usuario.

No trates esta ruta como un chat peer-to-peer entre padre e hijo. La hija ya tiene un canal de finalización de vuelta al padre.

### `sessions_send` y entrega A2A

`sessions_send` puede dirigirse a otra sesión después de la creación. Para sesiones peer normales, OpenClaw usa una ruta de seguimiento agente a agente (A2A) después de inyectar el mensaje:

- espera la respuesta de la sesión objetivo
- opcionalmente deja que solicitante y objetivo intercambien un número limitado de turnos de seguimiento
- pide al objetivo que produzca un mensaje de anuncio
- entrega ese anuncio al canal o hilo visible

Esa ruta A2A es un fallback para envíos entre pares donde el remitente necesita un seguimiento visible. Permanece habilitada cuando una sesión no relacionada puede ver y enviar mensajes a un objetivo ACP, por ejemplo bajo configuraciones amplias de `tools.sessions.visibility`.

OpenClaw omite el seguimiento A2A solo cuando el solicitante es el padre de su propia hija ACP one-shot. En ese caso, ejecutar A2A encima de la finalización de tareas puede despertar al padre con el resultado de la hija, reenviar la respuesta del padre de vuelta a la hija y crear un bucle eco padre/hija. El resultado de `sessions_send` informa `delivery.status="skipped"` para ese caso de hija propia porque la ruta de finalización ya es responsable del resultado.

### Reanudar una sesión existente

Usa `resumeSessionId` para continuar una sesión ACP previa en lugar de empezar desde cero. El agente vuelve a reproducir su historial de conversación mediante `session/load`, de modo que retoma el trabajo con todo el contexto anterior.

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
- Continuar una sesión de coding que empezaste de forma interactiva en la CLI, ahora sin interfaz mediante tu agente
- Retomar trabajo interrumpido por un reinicio del gateway o un timeout por inactividad

Notas:

- `resumeSessionId` requiere `runtime: "acp"`; devuelve un error si se usa con el runtime de subagente.
- `resumeSessionId` restaura el historial de conversación ACP upstream; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, por lo que `mode: "session"` sigue requiriendo `thread: true`.
- El agente objetivo debe admitir `session/load` (Codex y Claude Code lo hacen).
- Si no se encuentra el id de sesión, la creación falla con un error claro; no hay fallback silencioso a una sesión nueva.

<Accordion title="Prueba rápida posterior al despliegue">

Después de desplegar un gateway, ejecuta una comprobación end-to-end en vivo en lugar de confiar en las pruebas unitarias:

1. Verifica la versión y el commit del gateway desplegado en el host objetivo.
2. Abre una sesión puente ACPX temporal hacia un agente en vivo.
3. Pide a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Verifica `accepted=yes`, una `childSessionKey` real y la ausencia de error del validador.
5. Limpia la sesión puente temporal.

Mantén la puerta en `mode: "run"` y omite `streamTo: "parent"`: las rutas vinculadas a hilos `mode: "session"` y de relay de streaming son pasadas de integración aparte y más ricas.

</Accordion>

## Compatibilidad con sandbox

Las sesiones ACP se ejecutan actualmente en el runtime del host, no dentro del sandbox de OpenClaw.

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, los spawns ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` cuando necesites ejecución impuesta por sandbox.

### Desde el comando `/acp`

Usa `/acp spawn` para control explícito del operador desde el chat cuando sea necesario.

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

## Resolución de destino de sesión

La mayoría de las acciones `/acp` aceptan un destino opcional de sesión (`session-key`, `session-id` o `session-label`).

Orden de resolución:

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - prueba primero por clave
   - luego por id de sesión con forma UUID
   - luego por etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculado a una sesión ACP)
3. Fallback a la sesión actual del solicitante

Tanto las vinculaciones a conversación actual como las vinculaciones a hilos participan en el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro (`Unable to resolve session target: ...`).

## Modos de vinculación al crear

`/acp spawn` admite `--bind here|off`.

| Modo   | Comportamiento                                                            |
| ------ | ------------------------------------------------------------------------- |
| `here` | Vincula in situ la conversación activa actual; falla si no hay ninguna activa. |
| `off`  | No crea una vinculación a la conversación actual.                         |

Notas:

- `--bind here` es la ruta más simple para operadores que quieran “hacer que este canal o chat esté respaldado por Codex”.
- `--bind here` no crea un hilo hijo.
- `--bind here` solo está disponible en canales que exponen compatibilidad con vinculación a la conversación actual.
- `--bind` y `--thread` no pueden combinarse en la misma llamada `/acp spawn`.

## Modos de hilo al crear

`/acp spawn` admite `--thread auto|here|off`.

| Modo   | Comportamiento                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo hijo cuando sea compatible.   |
| `here` | Requiere un hilo activo actual; falla si no estás dentro de uno.                                          |
| `off`  | Sin vinculación. La sesión empieza sin vincular.                                                           |

Notas:

- En superficies sin vinculación a hilos, el comportamiento predeterminado es, en la práctica, `off`.
- La creación vinculada a hilos requiere compatibilidad de política del canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo hijo.

## Controles ACP

| Comando              | Qué hace                                                  | Ejemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación opcional a la conversación actual o a un hilo. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso de la sesión objetivo.          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de dirección a una sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula destinos de hilo.           | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de runtime y capacidades. | `/acp status`                                             |
| `/acp set-mode`      | Establece el modo de runtime para la sesión objetivo.     | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opción de configuración de runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la sobrescritura del directorio de trabajo del runtime. | `/acp cwd /Users/user/Projects/repo`                     |
| `/acp permissions`   | Establece el perfil de política de aprobación.            | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el timeout del runtime (segundos).              | `/acp timeout 120`                                            |
| `/acp model`         | Establece la sobrescritura del modelo de runtime.         | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las sobrescrituras de opciones de runtime de la sesión. | `/acp reset-options`                                     |
| `/acp sessions`      | Enumera sesiones ACP recientes del almacén.               | `/acp sessions`                                               |
| `/acp doctor`        | Salud del backend, capacidades y correcciones accionables. | `/acp doctor`                                                |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación. | `/acp install`                                               |

`/acp status` muestra las opciones efectivas de runtime además de identificadores de sesión a nivel de runtime y backend. Los errores de control no compatible se muestran claramente cuando a un backend le falta una capacidad. `/acp sessions` lee el almacén para la sesión vinculada actual o la sesión del solicitante; los tokens de destino (`session-key`, `session-id` o `session-label`) se resuelven mediante el descubrimiento de sesiones del gateway, incluidas raíces personalizadas `session.store` por agente.

## Asignación de opciones de runtime

`/acp` tiene comandos de conveniencia y un setter genérico.

Operaciones equivalentes:

- `/acp model <id>` se asigna a la clave de configuración de runtime `model`.
- `/acp permissions <profile>` se asigna a la clave de configuración de runtime `approval_policy`.
- `/acp timeout <seconds>` se asigna a la clave de configuración de runtime `timeout`.
- `/acp cwd <path>` actualiza directamente la sobrescritura del cwd del runtime.
- `/acp set <key> <value>` es la ruta genérica.
  - Caso especial: `key=cwd` usa la ruta de sobrescritura del cwd.
- `/acp reset-options` limpia todas las sobrescrituras de runtime de la sesión objetivo.

## Arnés acpx, configuración del Plugin y permisos

Para la configuración del arnés acpx (alias de Claude Code / Codex / Gemini CLI), los puentes MCP de plugin-tools y OpenClaw-tools y los modos de permisos de ACP, consulta
[Agentes ACP — configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                      | Causa probable                                                                  | Solución                                                                                                                                                                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                      | Falta el Plugin del backend o está deshabilitado.                              | Instala y habilita el Plugin del backend, luego ejecuta `/acp doctor`.                                                                                                        |
| `ACP is disabled by policy (acp.enabled=false)`                              | ACP está deshabilitado globalmente.                                             | Establece `acp.enabled=true`.                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`            | El despacho desde mensajes normales del hilo está deshabilitado.                | Establece `acp.dispatch.enabled=true`.                                                                                                                                        |
| `ACP agent "<id>" is not allowed by policy`                                  | El agente no está en la lista de permitidos.                                    | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                                   |
| `Unable to resolve session target: ...`                                      | Token de clave/id/etiqueta incorrecto.                                          | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                                |
| `--bind here requires running /acp spawn inside an active ... conversation`  | Se usó `--bind here` sin una conversación activa vinculable.                    | Ve al chat/canal objetivo y vuelve a intentarlo, o usa creación sin vinculación.                                                                                              |
| `Conversation bindings are unavailable for <channel>.`                       | El adaptador carece de capacidad ACP de vinculación a conversación actual.      | Usa `/acp spawn ... --thread ...` donde sea compatible, configura `bindings[]` de nivel superior o cambia a un canal compatible.                                             |
| `--thread here requires running /acp spawn inside an active ... thread`      | Se usó `--thread here` fuera del contexto de un hilo.                           | Ve al hilo objetivo o usa `--thread auto`/`off`.                                                                                                                              |
| `Only <user-id> can rebind this channel/conversation/thread.`                | Otro usuario controla el destino de vinculación activo.                         | Vuelve a vincular como propietario o usa otra conversación o hilo.                                                                                                            |
| `Thread bindings are unavailable for <channel>.`                             | El adaptador carece de capacidad de vinculación a hilos.                        | Usa `--thread off` o cambia a un adaptador/canal compatible.                                                                                                                  |
| `Sandboxed sessions cannot spawn ACP sessions ...`                           | El runtime ACP está del lado del host; la sesión solicitante está en sandbox.   | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la creación ACP desde una sesión sin sandbox.                                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`      | Se solicitó `sandbox="require"` para runtime ACP.                               | Usa `runtime="subagent"` para sandbox obligatorio, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                           |
| Faltan metadatos ACP para la sesión vinculada                                | Metadatos de sesión ACP obsoletos/eliminados.                                   | Vuelve a crear con `/acp spawn`, luego vuelve a vincular/enfocar el hilo.                                                                                                     |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`     | `permissionMode` bloquea escrituras/exec en sesión ACP no interactiva.          | Establece `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia el gateway. Consulta [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| La sesión ACP falla pronto con poca salida                                   | Los prompts de permisos están bloqueados por `permissionMode`/`nonInteractivePermissions`. | Revisa los registros del gateway para `AcpRuntimeError`. Para permisos completos, establece `permissionMode=approve-all`; para degradación elegante, establece `nonInteractivePermissions=deny`. |
| La sesión ACP se queda bloqueada indefinidamente tras completar el trabajo   | El proceso del arnés terminó, pero la sesión ACP no informó finalización.       | Supervisa con `ps aux \| grep acpx`; mata manualmente los procesos obsoletos.                                                                                                  |

## Relacionado

- [Subagentes](/es/tools/subagents)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [Agent send](/es/tools/agent-send)
