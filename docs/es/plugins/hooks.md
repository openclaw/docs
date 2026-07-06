---
read_when:
    - Estás creando un Plugin que necesita before_tool_call, before_agent_reply, ganchos de mensajes o ganchos de ciclo de vida
    - Necesitas bloquear, reescribir o requerir aprobación para llamadas a herramientas de un Plugin
    - Estás decidiendo entre hooks internos y hooks de Plugin
summary: 'Hooks de Plugin: intercepta eventos del ciclo de vida del agente, la herramienta, el mensaje, la sesión y el Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-07-06T10:51:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d26bd590b880b13843e7a4959a10ccaec11a6d986253123386f34f2ac9a74c
    source_path: plugins/hooks.md
    workflow: 16
---

Los hooks de Plugin son puntos de extensión en proceso para plugins de OpenClaw: inspeccionan o
cambian ejecuciones de agente, llamadas a herramientas, flujo de mensajes, ciclo de vida de
sesiones, enrutamiento de subagentes, instalaciones o arranque del Gateway.

Usa [hooks internos](/es/automation/hooks) en su lugar para un pequeño script
`HOOK.md` instalado por el operador que reacciona a eventos de comandos y del Gateway como `/new`,
`/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Inicio rápido

Registra hooks tipados con `api.on(...)` desde la entrada del plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Los manejadores se ejecutan secuencialmente en orden descendente de `priority`; los manejadores con la misma prioridad
mantienen el orden de registro.

`api.on(name, handler, opts?)` acepta:

| Opción      | Efecto                                                                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Ordenación; los valores más altos se ejecutan primero.                                                                                                                                          |
| `timeoutMs` | Presupuesto por hook. Cuando se configura, el ejecutor aborta ese manejador después del presupuesto y continúa en lugar de bloquearse hasta el tiempo de espera del modelo configurado. Omítelo para usar el tiempo de espera predeterminado por hook del ejecutor. |

Los operadores pueden configurar presupuestos de hooks sin parchear el código del plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` sobrescribe `hooks.timeoutMs`, que sobrescribe el valor
`api.on(..., { timeoutMs })` definido por el plugin. Cada valor debe ser un
entero positivo de hasta 600000 ms. Prefiere sobrescrituras por hook para hooks
conocidamente lentos, de modo que un plugin no obtenga un presupuesto mayor en todas partes.

Cada hook recibe `event.context.pluginConfig`, la configuración resuelta para el
plugin que registró ese manejador. OpenClaw la inyecta por manejador sin
mutar el objeto de evento compartido que ven otros plugins.

## Catálogo de hooks

Los hooks se agrupan por la superficie que extienden. Los nombres en **negrita** aceptan un resultado de decisión
(bloquear, cancelar, sobrescribir o requerir aprobación); el resto son
solo de observación.

**Turno de agente**

| Hook                            | Propósito                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `before_model_resolve`          | Sobrescribir proveedor o modelo antes de cargar los mensajes de sesión                     |
| `agent_turn_prepare`            | Consumir inyecciones de turno de plugin en cola y agregar contexto del mismo turno antes de los hooks de prompt |
| `before_prompt_build`           | Agregar contexto dinámico o texto de prompt de sistema antes de la llamada al modelo       |
| `before_agent_start`            | Fase combinada solo de compatibilidad; prefiere los dos hooks anteriores                   |
| **`before_agent_run`**          | Inspeccionar el prompt final y los mensajes de sesión antes del envío al modelo; puede bloquear la ejecución |
| **`before_agent_reply`**        | Cortocircuitar el turno del modelo con una respuesta sintética o silencio                  |
| **`before_agent_finalize`**     | Inspeccionar la respuesta final natural y solicitar una pasada más del modelo              |
| `agent_end`                     | Observar mensajes finales, estado de éxito y duración de la ejecución                      |
| `heartbeat_prompt_contribution` | Agregar contexto solo de Heartbeat para plugins de monitor en segundo plano y ciclo de vida |

**Observación de conversación**

| Hook                                      | Propósito                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `model_call_started` / `model_call_ended` | Metadatos saneados de llamada a proveedor/modelo: tiempos, resultado, hashes acotados de id de solicitud. Sin contenido de prompt ni respuesta. |
| `llm_input`                               | Entrada del proveedor: prompt de sistema, prompt, historial                                                          |
| `llm_output`                              | Salida del proveedor, uso y el `contextTokenBudget` resuelto cuando esté disponible                                  |

**Herramientas**

| Hook                       | Propósito                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **`before_tool_call`**     | Reescribir parámetros de herramienta, bloquear la ejecución o requerir aprobación |
| `after_tool_call`          | Observar resultados de herramientas, errores y duración     |
| `resolve_exec_env`         | Aportar variables de entorno propiedad del plugin a `exec`  |
| **`tool_result_persist`**  | Reescribir el mensaje del asistente producido a partir de un resultado de herramienta |
| **`before_message_write`** | Inspeccionar o bloquear una escritura de mensaje en curso (raro) |

**Mensajes y entrega**

| Hook                            | Propósito                                                           |
| ------------------------------- | ------------------------------------------------------------------- |
| **`inbound_claim`**             | Reclamar un mensaje entrante antes del enrutamiento del agente (respuestas sintéticas) |
| **`channel_pairing_requested`** | Observar solicitudes de emparejamiento de DM recién creadas         |
| `message_received`              | Observar contenido entrante, remitente, hilo y metadatos            |
| **`message_sending`**           | Reescribir contenido saliente o cancelar la entrega                 |
| **`reply_payload_sending`**     | Mutar o cancelar cargas de respuesta normalizadas antes de la entrega |
| `message_sent`                  | Observar éxito o fallo de entrega saliente                          |
| **`before_dispatch`**           | Inspeccionar o reescribir un despacho saliente antes de transferirlo al canal |
| **`reply_dispatch`**            | Participar en la canalización final de despacho de respuestas       |

**Sesiones y Compaction**

| Hook                                     | Propósito                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `session_start` / `session_end`          | Rastrear límites del ciclo de vida de la sesión. `reason` es uno de `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` o `unknown`. `shutdown`/`restart` se disparan desde el finalizador de apagado del Gateway cuando el proceso se detiene o reinicia con sesiones activas, para que los plugins (memoria, almacenes de transcripciones) puedan finalizar filas fantasma en lugar de dejarlas abiertas entre reinicios. El finalizador está acotado para que un plugin lento no pueda bloquear SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Observar o anotar ciclos de Compaction                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `before_reset`                           | Observar eventos de restablecimiento de sesión (`/reset`, restablecimientos programáticos)                                                                                                                                                                                                                                                                                                                                                                          |

**Subagentes**

- `subagent_spawned` / `subagent_ended` - observar el inicio y la finalización de subagentes.
- `subagent_delivery_target` - hook de compatibilidad para la entrega de finalización cuando ningún enlace de sesión del núcleo puede proyectar una ruta.
- `subagent_spawning` - hook de compatibilidad obsoleto. El núcleo ahora prepara enlaces de subagente `thread: true` mediante adaptadores de enlace de sesión de canal antes de que se dispare `subagent_spawned`.
- `subagent_spawned` incluye `resolvedModel` y `resolvedProvider` cuando OpenClaw ha resuelto el modelo nativo de la sesión hija antes del inicio.
- `subagent_ended` lleva `targetSessionKey` (identidad - coincide con `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` o `"acp"`), `reason`, `outcome` opcional (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` o `"deleted"`), `error` opcional, `runId`, `endedAt`, `accountId` y `sendFarewell`. **No** incluye `agentId` ni `childSessionKey`; usa `targetSessionKey` para correlacionarlo con el evento `subagent_spawned` correspondiente.

**Ciclo de vida**

| Hook                             | Propósito                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `gateway_start` / `gateway_stop` | Iniciar o detener servicios propiedad del plugin con el Gateway                                        |
| `deactivate`                     | Alias de compatibilidad obsoleto para `gateway_stop`; usa `gateway_stop` en plugins nuevos             |
| `cron_changed`                   | Observar cambios del ciclo de vida de Cron propiedad del Gateway (agregado, actualizado, eliminado, iniciado, terminado, programado) |
| **`before_install`**             | Inspeccionar material de instalación de skill o plugin preparado desde un runtime de plugin cargado    |

### Solicitudes de emparejamiento de canal

Usa `channel_pairing_requested` cuando un plugin necesite notificar a un operador o
escribir un registro de auditoría después de que un remitente de DM no emparejado cree una solicitud de emparejamiento
pendiente. El hook se despacha cuando se crea la solicitud; la entrega por canal de
la respuesta de emparejamiento no se retrasa por manejadores de hook lentos o con errores.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `New ${event.channel} pairing request from ${event.senderId}: ${event.code}`,
  });
});
```

El hook es solo de observación. No aprueba, rechaza, suprime ni reescribe
la respuesta de emparejamiento. La carga útil incluye el canal, `accountId`
opcional, `senderId` con ámbito de canal, `code` de emparejamiento y metadatos
del canal. Trata el código de emparejamiento como una credencial de aprobación
activa de un solo uso y entrégala solo a un destino de operador de confianza.
Trata `metadata` como texto de identidad no confiable proporcionado por el
remitente. El hook no incluye el cuerpo ni los medios del mensaje entrante.

## Hooks de runtime de depuración

Usa `before_model_resolve` para cambiar el proveedor o el modelo de un turno de agente:
se ejecuta antes de la resolución del modelo. `llm_output` solo se ejecuta
después de que un intento de modelo produce salida del asistente.

Para probar el modelo de sesión efectivo, inspecciona los registros de runtime y luego
usa `openclaw sessions` o las superficies de sesión/estado del Gateway. Para depurar
las cargas útiles del proveedor, inicia el Gateway con `--raw-stream` y
`--raw-stream-path <path>` para escribir eventos sin procesar del flujo del modelo en un archivo jsonl.

## Política de llamadas a herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.toolKind` y `event.toolInputKind` opcionales, discriminadores
  autoritativos del host para herramientas que comparten nombres de forma intencional; por ejemplo,
  las llamadas `exec` externas de modo código usan `toolKind: "code_mode_exec"` e incluyen
  `toolInputKind: "javascript" | "typescript"` cuando se conoce el lenguaje de entrada
- `event.derivedPaths` opcional, pistas de rutas de destino derivadas por el host con el mejor esfuerzo
  para envoltorios de herramientas conocidos como `apply_patch`; estas rutas pueden estar
  incompletas o sobreaproximar lo que la herramienta tocará realmente (por
  ejemplo, con entradas mal formadas o parciales)
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` y `ctx.trace` de diagnóstico

Puede devolver:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Comportamiento de protección para hooks de ciclo de vida tipados:

- `block: true` es terminal y omite los controladores de menor prioridad.
- `block: false` se trata como ausencia de decisión.
- `params` reescribe los parámetros de la herramienta para la ejecución.
- `requireApproval` pausa la ejecución del agente y pregunta al usuario mediante aprobaciones de Plugin.
  `/approve` puede aprobar tanto aprobaciones exec como de Plugin. En retransmisiones nativas
  `PreToolUse` de modo informe de app-server de Codex, esto se delega a la
  solicitud de aprobación correspondiente de app-server; consulta
  [runtime del arnés de Codex](/es/plugins/codex-harness-runtime#hook-boundaries).
- Un `block: true` de menor prioridad todavía puede bloquear después de que un hook de mayor prioridad
  haya solicitado aprobación.
- `onResolution` recibe la decisión resuelta: `allow-once`, `allow-always`,
  `deny`, `timeout` o `cancelled`.

Consulta [Solicitudes de permisos de Plugin](/es/plugins/plugin-permission-requests) para
el enrutamiento de aprobaciones, el comportamiento de decisiones y cuándo usar `requireApproval` en lugar
de herramientas opcionales o aprobaciones exec.

Los Plugins que necesiten políticas a nivel de host pueden registrar políticas de herramientas de confianza con
`api.registerTrustedToolPolicy(...)`. Estas se ejecutan antes que los hooks ordinarios
`before_tool_call` y antes que las decisiones normales de hooks. Las políticas de confianza
incluidas se ejecutan primero; las políticas de confianza de Plugins instalados se ejecutan después en el orden de carga
de Plugins; los hooks ordinarios `before_tool_call` se ejecutan después de ellas. Los Plugins incluidos conservan
la ruta existente de políticas de confianza. Los Plugins instalados deben habilitarse explícitamente
y declarar cada id de política en `contracts.trustedToolPolicies`; los ids no declarados
se rechazan antes del registro. Los ids de políticas tienen el ámbito del Plugin que las registra,
por lo que distintos Plugins pueden reutilizar el mismo id local. Usa este nivel solo
para controles confiables del host, como política de espacio de trabajo, aplicación de presupuesto o
seguridad de flujos de trabajo reservados.

### Hook de entorno exec

`resolve_exec_env` permite que los Plugins aporten variables de entorno a invocaciones de herramienta
`exec` antes de que se ejecute el comando. Recibe:

- `event.sessionKey`
- `event.toolName`, actualmente siempre `"exec"`
- `event.host`, uno de `"gateway"`, `"sandbox"` o `"node"`
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` y `ctx.channelId`

Devuelve un `Record<string, string>` para fusionarlo en el entorno exec. Los controladores
se ejecutan en orden de prioridad; los resultados posteriores sobrescriben los resultados anteriores para la misma
clave.

La salida del hook se filtra mediante la política de claves del entorno exec del host antes de
fusionarse. `PATH` siempre se descarta (la resolución de comandos y las comprobaciones de safe-bin
dependen de ella). Las claves no válidas y las claves peligrosas de sobrescritura del host, como `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, variables de proxy (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) y variables de sobrescritura TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` y similares) se descartan. El entorno filtrado del Plugin se incluye
en los metadatos de aprobación/auditoría del Gateway y se reenvía a las solicitudes de ejecución
del host node.

### Persistencia de resultados de herramientas

Los resultados de herramientas pueden incluir `details` estructurados para renderizado de UI, diagnósticos,
enrutamiento de medios o metadatos propiedad del Plugin. Trata `details` como metadatos de runtime,
no como contenido de prompt:

- OpenClaw elimina `toolResult.details` antes de la reproducción del proveedor y la entrada de Compaction
  para que los metadatos no se conviertan en contexto del modelo.
- Las entradas de sesión persistidas conservan solo `details` acotados. Los detalles sobredimensionados se
  reemplazan por un resumen compacto y `persistedDetailsTruncated: true`.
- `tool_result_persist` y `before_message_write` se ejecutan antes del límite final
  de persistencia. Mantén pequeños los `details` devueltos y evita colocar
  texto relevante para el prompt solo en `details`; coloca la salida de herramienta visible para el modelo en
  `content`.

## Hooks de prompt y modelo

Usa los hooks específicos de fase para Plugins nuevos:

- `before_model_resolve`: recibe solo el prompt actual y los metadatos de adjuntos.
  Devuelve `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: recibe el prompt actual, los mensajes de sesión preparados
  y cualquier inyección encolada de exactamente una vez drenada para esta sesión.
  Devuelve `prependContext` o `appendContext`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de sesión.
  Devuelve `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: se ejecuta solo para turnos Heartbeat y devuelve
  `prependContext` o `appendContext`. Está pensado para monitores en segundo plano que
  necesitan resumir el estado actual sin cambiar turnos iniciados por el usuario.

`before_agent_start` permanece por compatibilidad. Prefiere los hooks explícitos
anteriores para que el Plugin no dependa de una fase combinada heredada.

`before_agent_run` se ejecuta después de construir el prompt y antes de cualquier entrada al modelo,
incluida la carga de imágenes locales del prompt y la observación `llm_input`. Recibe
la entrada actual del usuario como `prompt`, además del historial de sesión cargado en `messages`
y el prompt del sistema activo. Devuelve `{ outcome: "block", reason, message? }`
para detener la ejecución antes de que el modelo lea el prompt. `reason` es interno;
`message` es el reemplazo visible para el usuario. Solo se admiten los resultados `pass` y `block`;
las formas de decisión no admitidas fallan de forma cerrada.

Cuando se bloquea una ejecución, OpenClaw almacena solo el texto de reemplazo en
`message.content` más metadatos de bloqueo no sensibles, como el id del Plugin bloqueador
y la marca de tiempo. El texto original del usuario no se conserva en la transcripción
ni en el contexto futuro. Las razones internas de bloqueo se tratan como sensibles y
se excluyen de las cargas útiles de transcripción, historial, difusión, registro y diagnóstico.
La observabilidad debe usar campos saneados, como id del bloqueador, resultado,
marca de tiempo o una categoría segura.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa; el mismo valor también está en `ctx.runId`. Las ejecuciones
impulsadas por Cron también exponen `ctx.jobId` (el id del trabajo cron de origen) en el contexto
del turno de agente para que los hooks puedan limitar métricas, efectos secundarios o estado a un trabajo
programado específico. `ctx.jobId` no forma parte del contexto de herramienta `before_tool_call`.

Para ejecuciones originadas en canales, `ctx.channel` y `ctx.messageProvider` identifican
la superficie del proveedor, como `discord` o `telegram`, mientras que `ctx.channelId` es
el identificador de destino de la conversación cuando OpenClaw puede derivarlo de la
clave de sesión o de los metadatos de entrega.

Cuando la identidad del remitente está disponible, los contextos de hooks de agente también incluyen:

- `ctx.senderId`: ID del remitente con ámbito de canal (por ejemplo, `open_id` de Feishu, ID de usuario
  de Discord). Se rellena cuando la ejecución se origina en un mensaje de usuario con metadatos
  de remitente conocidos.
- `ctx.chatId`: identificador de conversación nativo del transporte (por ejemplo, `chat_id` de Feishu,
  `chat_id` de Telegram). Se rellena cuando el canal de origen
  proporciona un ID de conversación nativo.
- `ctx.channelContext.sender.id`: el mismo ID de remitente que `ctx.senderId`, bajo
  un objeto propiedad del canal que los Plugins pueden ampliar con campos específicos del canal.
- `ctx.channelContext.chat.id`: el mismo ID de conversación que `ctx.chatId`,
  bajo un objeto propiedad del canal que los Plugins pueden ampliar con campos específicos del canal.

Core solo define los campos `id` anidados. Los Plugins de canal que pasan metadatos más ricos
de remitente o chat mediante el helper entrante pueden aumentar
`PluginHookChannelSenderContext` o `PluginHookChannelChatContext` desde
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Los Plugins de canal pasan esos campos mediante el helper del SDK entrante:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Estos campos son opcionales y están ausentes para ejecuciones originadas por el sistema (heartbeat,
cron, evento exec).

`ctx.senderExternalId` permanece como un campo obsoleto de compatibilidad de código fuente para
Plugins antiguos. Core no lo rellena; las nuevas identidades de remitente específicas del canal
deben vivir bajo `ctx.channelContext.sender` mediante aumento de módulo.

`agent_end` es un hook de observación. Las rutas del Gateway y del arnés persistente lo ejecutan
fire-and-forget después del turno, mientras que las rutas CLI efímeras de una sola ejecución esperan
la promesa del hook antes de limpiar el proceso para que los Plugins de confianza puedan vaciar
observabilidad terminal o capturar estado. El ejecutor de hooks aplica un tiempo de espera de 30 segundos
para que un Plugin bloqueado o un endpoint incrustado no pueda dejar la promesa del hook
pendiente para siempre. Un tiempo de espera se registra y OpenClaw continúa; no
cancela el trabajo de red propiedad del Plugin salvo que el Plugin también use su propia señal
de aborto.

Usa `model_call_started` y `model_call_ended` para telemetría de llamadas al proveedor
que no debe recibir prompts sin procesar, historial, respuestas, encabezados, cuerpos de solicitud
ni IDs de solicitud del proveedor. Estos hooks incluyen metadatos estables como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcionales,
`durationMs`/`outcome` terminales y `upstreamRequestIdHash` cuando OpenClaw puede derivar un
hash acotado del id de solicitud del proveedor. Cuando el runtime ha resuelto
metadatos de ventana de contexto, el evento y el contexto del hook también incluyen
`contextTokenBudget`, el presupuesto efectivo de tokens después de los límites de modelo/configuración/agente,
más `contextWindowSource` y `contextWindowReferenceTokens` cuando se aplicó un
límite inferior.

`before_agent_finalize` se ejecuta solo cuando un arnés está a punto de aceptar una respuesta
final natural del asistente. No es la ruta de cancelación `/stop` y no se
ejecuta cuando el usuario aborta un turno. Devuelve `{ action: "revise", reason }` para pedir
al arnés una pasada más del modelo antes de la finalización, `{ action:
"finalize", reason? }` para forzar la finalización, u omite un resultado para continuar.
Los hooks `Stop` nativos de Codex se retransmiten a este hook como decisiones
`before_agent_finalize` de OpenClaw.

Al devolver `action: "revise"`, los plugins pueden incluir metadatos `retry` para
hacer que la pasada adicional del modelo sea acotada y segura para reproducción:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` se añade al motivo de revisión enviado al arnés.
`idempotencyKey` permite que el host cuente los reintentos de la misma solicitud de plugin
entre decisiones de finalización equivalentes, y `maxAttempts` limita cuántas pasadas
adicionales permitirá el host antes de continuar con la respuesta final natural.

Los plugins no incluidos en el paquete que necesiten hooks de conversación sin procesar (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` o `before_agent_run`) deben establecer:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Los hooks que mutan prompts y las inyecciones duraderas de siguiente turno pueden deshabilitarse por
plugin con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensiones de sesión e inyecciones de siguiente turno

Los plugins de flujo de trabajo pueden persistir un pequeño estado de sesión compatible con JSON con
`api.session.state.registerSessionExtension(...)` y actualizarlo mediante el método
`sessions.pluginPatch` del Gateway. Las filas de sesión proyectan el estado de extensión
registrado mediante `pluginExtensions`, lo que permite que Control UI y otros
clientes rendericen el estado propiedad del plugin sin conocer los detalles internos del plugin.
`api.registerSessionExtension(...)` aún funciona, pero está obsoleto en favor del
espacio de nombres `api.session.state`.

Usa `api.session.workflow.enqueueNextTurnInjection(...)` cuando un plugin necesite
contexto duradero para llegar al siguiente turno del modelo exactamente una vez (el alias de nivel superior
`api.enqueueNextTurnInjection(...)` está obsoleto y tiene el mismo
comportamiento). OpenClaw drena las inyecciones en cola antes de los hooks de prompt, descarta
las inyecciones vencidas y deduplica por `idempotencyKey` por plugin. Esta es
la interfaz adecuada para reanudaciones de aprobación, resúmenes de políticas, deltas de monitores
en segundo plano y continuaciones de comandos que deberían ser visibles para el modelo en el
siguiente turno, pero no deberían convertirse en texto permanente del prompt de sistema.

La semántica de limpieza forma parte del contrato. Las limpiezas de extensiones de sesión y
las devoluciones de llamada de limpieza del ciclo de vida en tiempo de ejecución reciben `reset`, `delete`, `disable` o
`restart`. El host elimina el estado persistente de extensión de sesión
del plugin propietario y las inyecciones pendientes de siguiente turno para reset/delete/disable; restart
conserva el estado de sesión duradero mientras que las devoluciones de llamada de limpieza permiten a los plugins liberar
trabajos del planificador, contexto de ejecución y otros recursos fuera de banda de la antigua
generación de runtime.

## Hooks de mensajes

Usa hooks de mensajes para enrutamiento y política de entrega a nivel de canal:

- `message_received`: observa contenido entrante, remitente, `threadId`,
  `messageId`, `senderId`, correlación opcional de ejecución/sesión y metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `reply_payload_sending`: reescribe objetos `ReplyPayload` normalizados
  (incluidos `presentation`, `delivery`, referencias de medios y texto) o devuelve
  `{ cancel: true }`.
- `message_sent`: observa el éxito o fallo final.

Para respuestas TTS solo de audio, `content` puede contener la transcripción hablada
oculta incluso cuando la carga útil del canal no tiene texto/caption visible.
Reescribir ese `content` actualiza solo la transcripción visible para el hook; no se
renderiza como caption de medios.

Los eventos `reply_payload_sending` pueden incluir `usageState`, una instantánea en vivo
de mejor esfuerzo por turno de modelo/uso/contexto. La entrega duradera, la reproducción recuperada y
las respuestas sin correlación exacta de ejecución lo omiten.

Los contextos de hooks de mensajes exponen campos de correlación estables cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Los contextos entrantes
y `before_dispatch` también exponen metadatos de respuesta cuando el canal
tiene datos de mensaje citado filtrados por visibilidad: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` y `replyToIsQuote`. Prefiere estos
campos de primera clase antes de leer metadatos heredados.

Prefiere los campos tipados `threadId` y `replyToId` antes de usar metadatos
específicos del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se trata como sin decisión.
- El `content` reescrito continúa hacia hooks de menor prioridad salvo que un hook posterior
  cancele la entrega.
- `reply_payload_sending` se ejecuta después de la normalización de la carga útil y antes de la entrega
  del canal, incluidas las respuestas enrutadas de vuelta al canal de origen.
  Los manejadores se ejecutan secuencialmente y cada manejador ve la carga útil más reciente producida
  por manejadores de mayor prioridad.
- Las cargas útiles de `reply_payload_sending` no exponen marcadores de confianza del runtime como
  `trustedLocalMedia`; los plugins pueden editar la forma de la carga útil, pero no pueden conceder confianza
  a medios locales.
- `message_sending` puede devolver `cancelReason` y `metadata` acotados con una
  cancelación. Las nuevas API de ciclo de vida de mensajes exponen esto como un resultado de entrega
  suprimido con motivo `cancelled_by_message_sending_hook`; la entrega directa
  heredada sigue devolviendo una matriz de resultados vacía por compatibilidad.
- `message_sent` es solo de observación. Los fallos de manejadores se registran y no
  cambian el resultado de entrega.

## Hooks de instalación

Usa `security.installPolicy` para decisiones de permitir/bloquear propiedad del operador. Esa
política se ejecuta desde la configuración de OpenClaw, cubre rutas de instalación y actualización de la CLI, y
falla cerrada cuando está habilitada pero no disponible.

`before_install` es un hook de ciclo de vida del runtime del plugin. Se ejecuta después de
`security.installPolicy` solo en el proceso de OpenClaw donde los hooks del plugin ya
se han cargado, como los flujos de instalación respaldados por Gateway. Es útil para
observaciones, advertencias y comprobaciones de compatibilidad propiedad del plugin, pero no es
el límite principal de seguridad empresarial o del host para instalaciones. El campo
`builtinScan` permanece en la carga útil del evento por compatibilidad, pero
OpenClaw ya no ejecuta bloqueo integrado de código peligroso en tiempo de instalación, por lo que
es un resultado `ok` vacío. Devuelve hallazgos adicionales o
`{ block: true, blockReason }` para detener la instalación en ese proceso.

`block: true` es terminal. `block: false` se trata como sin decisión. Los fallos de
manejadores bloquean la instalación con fallo cerrado.

## Ciclo de vida del Gateway

Usa `gateway_start` para servicios de plugin que necesitan estado propiedad del Gateway. El
contexto expone `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para
inspección y actualizaciones de cron. Usa `gateway_stop` para limpiar recursos
de larga ejecución.

No dependas del hook interno `gateway:startup` para servicios del runtime
propiedad del plugin.

`cron_changed` se dispara para eventos de ciclo de vida de cron propiedad del Gateway con una carga útil
de evento tipada que cubre los motivos `added`, `updated`, `removed`, `started`, `finished`
y `scheduled`. El evento lleva una instantánea `PluginHookGatewayCronJob`
(incluidos `state.nextRunAtMs`, `state.lastRunStatus` y
`state.lastError` cuando están presentes) más un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Los eventos eliminados
siguen llevando la instantánea del trabajo eliminado para que los planificadores externos puedan reconciliar
estado. Usa `ctx.getCron?.()` y `ctx.config` desde el contexto del runtime cuando
sincronices planificadores externos de activación, y conserva OpenClaw como la fuente de verdad
para las comprobaciones de vencimiento y la ejecución.

## Próximas obsolescencias

Algunas superficies adyacentes a hooks están obsoletas, pero siguen siendo compatibles. Migra
antes de la próxima versión mayor:

- **Sobres de canal en texto plano** en manejadores `inbound_claim` y `message_received`.
  Lee `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar texto de sobre plano. Consulta
  [Sobres de canal en texto plano → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidad. Los nuevos plugins deberían usar
  `before_model_resolve` y `before_prompt_build` en lugar de la fase
  combinada.
- **`subagent_spawning`** permanece por compatibilidad con plugins antiguos, pero
  los nuevos plugins no deberían devolver enrutamiento de hilos desde él. Core prepara
  vinculaciones de subagentes `thread: true` mediante adaptadores de vinculación de sesión de canal
  antes de que se dispare `subagent_spawned`.
- **`deactivate`** permanece como alias de compatibilidad de limpieza obsoleto hasta
  después del 2026-08-16. Los nuevos plugins deberían usar `gateway_stop`.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de un `string` de forma libre.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** permanecen
  como alias de compatibilidad de nivel superior. Los nuevos plugins deberían usar
  `api.session.state.registerSessionExtension(...)` y
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Para la lista completa - registro de capacidad de memoria, perfil de pensamiento del proveedor,
proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores de runtime
de tareas y el cambio de nombre `command-auth` → `command-status` - consulta
[Migración del Plugin SDK → Obsolescencias activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración del Plugin SDK](/es/plugins/sdk-migration) - obsolescencias activas y cronograma de eliminación
- [Crear plugins](/es/plugins/building-plugins)
- [Descripción general del Plugin SDK](/es/plugins/sdk-overview)
- [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Detalles internos de la arquitectura de plugins](/es/plugins/architecture-internals)
