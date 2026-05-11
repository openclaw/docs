---
read_when:
    - Estás creando un Plugin que necesita before_tool_call, before_agent_reply, hooks de mensajes o hooks de ciclo de vida
    - Debes bloquear, reescribir o requerir aprobación para las llamadas a herramientas de un Plugin
    - Estás decidiendo entre ganchos internos y ganchos de Plugin
summary: 'Ganchos de Plugin: intercepta eventos del ciclo de vida de agentes, herramientas, mensajes, sesiones y Gateway'
title: Ganchos de Plugin
x-i18n:
    generated_at: "2026-05-11T20:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Los hooks de Plugin son puntos de extensión en proceso para plugins de OpenClaw. Úsalos
cuando un plugin necesite inspeccionar o cambiar ejecuciones de agentes, llamadas a herramientas, flujo de mensajes,
ciclo de vida de sesiones, enrutamiento de subagentes, instalaciones o el inicio del Gateway.

Usa [hooks internos](/es/automation/hooks) en su lugar cuando quieras un pequeño
script `HOOK.md` instalado por el operador para eventos de comandos y Gateway, como
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Inicio rápido

Registra hooks de plugin tipados con `api.on(...)` desde la entrada de tu plugin:

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

Los manejadores de hooks se ejecutan secuencialmente en orden descendente de `priority`. Los hooks con la misma prioridad
mantienen el orden de registro.

`api.on(name, handler, opts?)` acepta:

- `priority`: orden del manejador (los valores más altos se ejecutan primero).
- `timeoutMs`: presupuesto opcional por hook. Cuando se establece, el ejecutor de hooks aborta ese
  manejador después de que venza el presupuesto y continúa con el siguiente, en lugar de
  permitir que una configuración lenta o trabajo de recuperación consuma el timeout de modelo configurado por el llamador.
  Omítelo para usar el timeout predeterminado de observación/decisión que el
  ejecutor de hooks aplica de forma genérica.

Los operadores también pueden establecer presupuestos de hooks sin modificar el código del plugin:

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

`hooks.timeouts.<hookName>` sobrescribe `hooks.timeoutMs`, que sobrescribe el
valor `api.on(..., { timeoutMs })` escrito por el plugin. Cada valor configurado debe
ser un entero positivo no mayor que 600000 milisegundos. Prefiere anulaciones por hook
para hooks lentos conocidos, de modo que un plugin no reciba un presupuesto más largo
en todas partes.

Cada hook recibe `event.context.pluginConfig`, la configuración resuelta para el
plugin que registró ese manejador. Úsala para decisiones de hooks que necesiten
las opciones actuales del plugin; OpenClaw la inyecta por manejador sin mutar el
objeto de evento compartido que ven otros plugins.

## Catálogo de hooks

Los hooks se agrupan por la superficie que extienden. Los nombres en **negrita** aceptan un
resultado de decisión (bloquear, cancelar, sobrescribir o requerir aprobación); todos los demás son
solo de observación.

**Turno del agente**

- `before_model_resolve`: sobrescribe el proveedor o el modelo antes de que se carguen los mensajes de sesión
- `agent_turn_prepare`: consume inyecciones de turno de plugin en cola y agrega contexto del mismo turno antes de los hooks de prompt
- `before_prompt_build`: agrega contexto dinámico o texto de prompt del sistema antes de la llamada al modelo
- `before_agent_start`: fase combinada solo por compatibilidad; prefiere los dos hooks anteriores
- **`before_agent_run`**: inspecciona el prompt final y los mensajes de sesión antes del envío al modelo y, opcionalmente, bloquea la ejecución
- **`before_agent_reply`**: interrumpe el turno del modelo con una respuesta sintética o silencio
- **`before_agent_finalize`**: inspecciona la respuesta final natural y solicita una pasada más del modelo
- `agent_end`: observa los mensajes finales, el estado de éxito y la duración de la ejecución
- `heartbeat_prompt_contribution`: agrega contexto solo de Heartbeat para plugins de monitor en segundo plano y ciclo de vida

**Observación de conversaciones**

- `model_call_started` / `model_call_ended`: observa metadatos saneados de llamadas a proveedor/modelo, tiempos, resultado y hashes acotados de ID de solicitud sin contenido de prompt ni respuesta
- `llm_input`: observa la entrada del proveedor (prompt del sistema, prompt, historial)
- `llm_output`: observa la salida del proveedor

**Herramientas**

- **`before_tool_call`**: reescribe parámetros de la herramienta, bloquea la ejecución o requiere aprobación
- `after_tool_call`: observa resultados de herramientas, errores y duración
- **`tool_result_persist`**: reescribe el mensaje del asistente producido a partir de un resultado de herramienta
- **`before_message_write`**: inspecciona o bloquea una escritura de mensaje en curso (raro)

**Mensajes y entrega**

- **`inbound_claim`**: reclama un mensaje entrante antes del enrutamiento del agente (respuestas sintéticas)
- `message_received`: observa el contenido entrante, remitente, hilo y metadatos
- **`message_sending`**: reescribe contenido saliente o cancela la entrega
- `message_sent`: observa el éxito o fallo de la entrega saliente
- **`before_dispatch`**: inspecciona o reescribe un envío saliente antes de la transferencia al canal
- **`reply_dispatch`**: participa en la canalización final de despacho de respuestas

**Sesiones y Compaction**

- `session_start` / `session_end`: rastrea límites del ciclo de vida de la sesión. El `reason` del evento es uno de `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` o `unknown`. Los valores `shutdown` y `restart` se disparan desde el finalizador de apagado del gateway cuando el proceso se detiene o reinicia mientras las sesiones siguen activas, de modo que los plugins posteriores (como almacenes de memoria o transcripciones) puedan finalizar filas fantasma que, de lo contrario, quedarían en estado abierto entre reinicios. El finalizador está acotado para que un plugin lento no pueda bloquear SIGTERM/SIGINT.
- `before_compaction` / `after_compaction`: observa o anota ciclos de Compaction
- `before_reset`: observa eventos de restablecimiento de sesión (`/reset`, restablecimientos programáticos)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordinan el enrutamiento de subagentes y la entrega de finalización

**Ciclo de vida**

- `gateway_start` / `gateway_stop` - inician o detienen servicios propiedad del plugin con el Gateway
- `cron_changed` - observan cambios del ciclo de vida de cron propiedad del gateway (agregado, actualizado, eliminado, iniciado, finalizado, programado)
- **`before_install`** - inspecciona análisis de instalación de Skills o plugins y, opcionalmente, bloquea

## Política de llamadas a herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.derivedPaths` opcional, que contiene indicios de rutas de destino derivadas del host con el mejor esfuerzo para envoltorios de herramientas conocidos como `apply_patch`; cuando están presentes, estas rutas pueden estar incompletas o sobreestimar lo que la herramienta realmente tocará (por ejemplo, con entradas mal formadas o parciales)
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, `ctx.runId`, `ctx.jobId` (establecido en ejecuciones impulsadas por cron) y `ctx.trace` de diagnóstico

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
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Reglas:

- `block: true` es terminal y omite los controladores de menor prioridad.
- `block: false` se trata como ninguna decisión.
- `params` reescribe los parámetros de la herramienta para la ejecución.
- `requireApproval` pausa la ejecución del agente y solicita al usuario mediante aprobaciones de plugin. El comando `/approve` puede aprobar tanto aprobaciones de exec como de plugin.
- Un `block: true` de menor prioridad aún puede bloquear después de que un hook de mayor prioridad haya solicitado aprobación.
- `onResolution` recibe la decisión de aprobación resuelta: `allow-once`, `allow-always`, `deny`, `timeout` o `cancelled`.

Los plugins incluidos que necesitan política a nivel de host pueden registrar políticas de herramientas de confianza con `api.registerTrustedToolPolicy(...)`. Estas se ejecutan antes de los hooks `before_tool_call` ordinarios y antes de las decisiones de plugins externos. Úsalas solo para puertas de confianza del host, como política del espacio de trabajo, aplicación de presupuestos o seguridad de flujos de trabajo reservados. Los plugins externos deben usar hooks `before_tool_call` normales.

### Persistencia de resultados de herramientas

Los resultados de herramientas pueden incluir `details` estructurados para renderizado de la interfaz, diagnósticos, enrutamiento de medios o metadatos propiedad del plugin. Trata `details` como metadatos de runtime, no como contenido del prompt:

- OpenClaw elimina `toolResult.details` antes de la reproducción del proveedor y de la entrada de Compaction para que los metadatos no se conviertan en contexto del modelo.
- Las entradas de sesión persistidas conservan solo `details` acotados. Los detalles demasiado grandes se reemplazan por un resumen compacto y `persistedDetailsTruncated: true`.
- `tool_result_persist` y `before_message_write` se ejecutan antes del límite final de persistencia. Aun así, los hooks deben mantener pequeños los `details` devueltos y evitar colocar texto relevante para el prompt solo en `details`; coloca la salida de la herramienta visible para el modelo en `content`.

## Hooks de prompt y modelo

Usa los hooks específicos de fase para plugins nuevos:

- `before_model_resolve`: recibe solo el prompt actual y los metadatos de adjuntos. Devuelve `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: recibe el prompt actual, los mensajes de sesión preparados y cualquier inyección en cola exactamente una vez drenada para esta sesión. Devuelve `prependContext` o `appendContext`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de sesión. Devuelve `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: se ejecuta solo para turnos de Heartbeat y devuelve `prependContext` o `appendContext`. Está pensado para monitores en segundo plano que necesitan resumir el estado actual sin cambiar turnos iniciados por el usuario.

`before_agent_start` se mantiene por compatibilidad. Prefiere los hooks explícitos anteriores para que tu plugin no dependa de una fase combinada heredada.

`before_agent_run` se ejecuta después de la construcción del prompt y antes de cualquier entrada del modelo, incluida la carga de imágenes locales del prompt y la observación `llm_input`. Recibe la entrada de usuario actual como `prompt`, además del historial de sesión cargado en `messages` y el prompt del sistema activo. Devuelve `{ outcome: "block", reason, message? }` para detener la ejecución antes de que el modelo pueda leer el prompt. `reason` es interno; `message` es el reemplazo visible para el usuario. Los únicos resultados admitidos son `pass` y `block`; las formas de decisión no admitidas fallan cerradas.

Cuando se bloquea una ejecución, OpenClaw almacena solo el texto de reemplazo en `message.content` más metadatos de bloqueo no sensibles, como el id del plugin bloqueador y la marca de tiempo. El texto original del usuario no se conserva en la transcripción ni en el contexto futuro. Las razones internas de bloqueo se tratan como sensibles y se excluyen de transcripciones, historial, difusión, logs y cargas útiles de diagnóstico. La observabilidad debe usar campos saneados, como id del bloqueador, resultado, marca de tiempo o una categoría segura.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede identificar la ejecución activa. El mismo valor también está disponible en `ctx.runId`. Las ejecuciones impulsadas por Cron también exponen `ctx.jobId` (el id del trabajo cron de origen) para que los hooks de plugin puedan acotar métricas, efectos secundarios o estado a un trabajo programado específico.

Para ejecuciones originadas en canales, `ctx.messageProvider` es la superficie del proveedor, como `discord` o `telegram`, mientras que `ctx.channelId` es el identificador de destino de la conversación cuando OpenClaw puede derivarlo de la clave de sesión o de los metadatos de entrega.

`agent_end` es un hook de observación y se ejecuta sin esperar resultado después del turno. El ejecutor de hooks aplica un tiempo de espera de 30 segundos para que un plugin bloqueado o un endpoint de embeddings no pueda dejar la promesa del hook pendiente indefinidamente. Un tiempo de espera se registra en logs y OpenClaw continúa; no cancela el trabajo de red propiedad del plugin a menos que el plugin también use su propia señal de aborto.

Use `model_call_started` y `model_call_ended` para la telemetría de llamadas al proveedor
que no debe recibir prompts sin procesar, historial, respuestas, encabezados, cuerpos de
solicitud ni ID de solicitud del proveedor. Estos hooks incluyen metadatos estables como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcionales, `durationMs`/`outcome`
terminales y `upstreamRequestIdHash` cuando OpenClaw puede derivar un hash acotado del ID
de solicitud del proveedor.

`before_agent_finalize` se ejecuta solo cuando un harness está a punto de aceptar una
respuesta final natural del asistente. No es la ruta de cancelación `/stop` y no se
ejecuta cuando el usuario aborta un turno. Devuelve `{ action: "revise", reason }` para
pedir al harness una pasada más del modelo antes de finalizar, `{ action:
"finalize", reason? }` para forzar la finalización, u omite un resultado para continuar.
Los hooks nativos `Stop` de Codex se retransmiten a este hook como decisiones
`before_agent_finalize` de OpenClaw.

Al devolver `action: "revise"`, los plugins pueden incluir metadatos `retry` para hacer
que la pasada adicional del modelo sea acotada y segura para repetición:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` se agrega al motivo de revisión enviado al harness.
`idempotencyKey` permite que el host cuente los reintentos para la misma solicitud del
plugin entre decisiones de finalización equivalentes, y `maxAttempts` limita cuántas
pasadas adicionales permitirá el host antes de continuar con la respuesta final natural.

Los plugins no incluidos que necesitan hooks de conversación sin procesar (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` o `before_agent_run`) deben configurar:

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

Los hooks que modifican prompts y las inyecciones duraderas para el siguiente turno se pueden desactivar por plugin
con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensiones de sesión e inyecciones para el siguiente turno

Los plugins de workflow pueden persistir un estado de sesión pequeño compatible con JSON con
`api.registerSessionExtension(...)` y actualizarlo mediante el método
`sessions.pluginPatch` del Gateway. Las filas de sesión proyectan el estado de extensión registrado
mediante `pluginExtensions`, lo que permite que Control UI y otros clientes representen el estado
propiedad del plugin sin conocer sus detalles internos.

Usa `api.enqueueNextTurnInjection(...)` cuando un plugin necesite que contexto duradero
llegue exactamente una vez al siguiente turno del modelo. OpenClaw vacía las inyecciones en cola antes de
los hooks de prompt, descarta las inyecciones vencidas y deduplica por `idempotencyKey`
por plugin. Esta es la interfaz adecuada para reanudaciones de aprobación, resúmenes de políticas,
deltas de monitores en segundo plano y continuaciones de comandos que deben ser visibles para
el modelo en el siguiente turno, pero no deben convertirse en texto permanente del prompt del sistema.

La semántica de limpieza forma parte del contrato. La limpieza de extensiones de sesión y
los callbacks de limpieza del ciclo de vida en runtime reciben `reset`, `delete`, `disable` o
`restart`. El host elimina el estado persistente de extensión de sesión del plugin propietario
y las inyecciones pendientes para el siguiente turno en reset/delete/disable; restart conserva
el estado de sesión duradero mientras los callbacks de limpieza permiten que los plugins liberen
trabajos del programador, contexto de ejecución y otros recursos fuera de banda de la antigua generación
del runtime.

## Hooks de mensaje

Usa hooks de mensaje para el enrutamiento a nivel de canal y la política de entrega:

- `message_received`: observa el contenido entrante, remitente, `threadId`, `messageId`,
  `senderId`, correlación opcional de ejecución/sesión y metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `message_sent`: observa el éxito o fallo final.

Para respuestas TTS solo de audio, `content` puede contener la transcripción hablada oculta
incluso cuando la carga útil del canal no tiene texto/caption visible. Reescribir ese
`content` actualiza solo la transcripción visible para el hook; no se renderiza como caption
de medios.

Los contextos de hooks de mensaje exponen campos de correlación estables cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Prefiere
estos campos de primera clase antes de leer metadatos heredados.

Prefiere los campos tipados `threadId` y `replyToId` antes de usar metadatos específicos del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se trata como ausencia de decisión.
- El `content` reescrito continúa hacia hooks de menor prioridad salvo que un hook posterior
  cancele la entrega.
- `message_sending` puede devolver `cancelReason` y `metadata` acotados con una
  cancelación. Las nuevas API de ciclo de vida de mensajes lo exponen como un resultado de entrega suprimida
  con motivo `cancelled_by_message_sending_hook`; la entrega directa heredada
  sigue devolviendo un array de resultados vacío por compatibilidad.
- `message_sent` es solo de observación. Los fallos de handlers se registran y no
  cambian el resultado de entrega.

## Hooks de instalación

`before_install` se ejecuta después del escaneo integrado para instalaciones de Skills y plugins.
Devuelve hallazgos adicionales o `{ block: true, blockReason }` para detener la
instalación.

`block: true` es terminal. `block: false` se trata como ausencia de decisión.

## Ciclo de vida del Gateway

Usa `gateway_start` para servicios de plugin que necesitan estado propiedad del Gateway. El
contexto expone `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para
inspección y actualizaciones de cron. Usa `gateway_stop` para limpiar recursos
de larga duración.

No dependas del hook interno `gateway:startup` para servicios en runtime propiedad del plugin.

`cron_changed` se dispara para eventos del ciclo de vida de cron propiedad del gateway con una
carga útil de evento tipada que cubre los motivos `added`, `updated`, `removed`, `started`, `finished`
y `scheduled`. El evento lleva una instantánea `PluginHookGatewayCronJob`
(incluidos `state.nextRunAtMs`, `state.lastRunStatus` y
`state.lastError` cuando está presente), además de un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Los eventos eliminados
siguen llevando la instantánea del trabajo eliminado para que los programadores externos puedan
conciliar el estado. Usa `ctx.getCron?.()` y `ctx.config` desde el contexto del runtime
al sincronizar programadores de activación externos, y mantén OpenClaw como la
fuente de verdad para comprobaciones de vencimiento y ejecución.

## Próximas deprecaciones

Algunas superficies adyacentes a hooks están obsoletas, pero aún son compatibles. Migra
antes de la próxima versión mayor:

- **Envoltorios de canal en texto plano** en handlers `inbound_claim` y `message_received`.
  Lee `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar texto plano de envoltorio. Consulta
  [Envoltorios de canal en texto plano → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** se mantiene por compatibilidad. Los plugins nuevos deben usar
  `before_model_resolve` y `before_prompt_build` en lugar de la fase combinada.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de un `string` de formato libre.

Para la lista completa - registro de capacidad de memoria, perfil de razonamiento del proveedor,
proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores del runtime
de tareas y el cambio de nombre de `command-auth` → `command-status` - consulta
[Migración del Plugin SDK → Deprecaciones activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración del Plugin SDK](/es/plugins/sdk-migration) - deprecaciones activas y cronograma de eliminación
- [Construir plugins](/es/plugins/building-plugins)
- [Resumen del Plugin SDK](/es/plugins/sdk-overview)
- [Puntos de entrada del Plugin](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Elementos internos de arquitectura de plugins](/es/plugins/architecture-internals)
