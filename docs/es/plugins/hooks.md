---
read_when:
    - Estás creando un Plugin que necesita before_tool_call, before_agent_reply, ganchos de mensaje o ganchos de ciclo de vida
    - Debes bloquear, reescribir o requerir aprobación para las llamadas a herramientas de un Plugin
    - Estás decidiendo entre hooks internos y hooks de Plugin
summary: 'Hooks de Plugin: interceptan eventos del ciclo de vida del agente, la herramienta, el mensaje, la sesión y el Gateway'
title: Ganchos de Plugin
x-i18n:
    generated_at: "2026-05-03T21:36:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

Los hooks de Plugin son puntos de extensión en proceso para plugins de OpenClaw. Úsalos
cuando un plugin necesite inspeccionar o cambiar ejecuciones de agentes, llamadas a herramientas, flujo de mensajes,
ciclo de vida de sesiones, enrutamiento de subagentes, instalaciones o arranque del Gateway.

Usa [hooks internos](/es/automation/hooks) en su lugar cuando quieras un pequeño
script `HOOK.md` instalado por el operador para eventos de comandos y Gateway como
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

Los manejadores de hooks se ejecutan secuencialmente en orden descendente de `priority`. Los hooks
con la misma prioridad conservan el orden de registro.

`api.on(name, handler, opts?)` acepta:

- `priority` — orden de manejadores (los valores más altos se ejecutan primero).
- `timeoutMs` — presupuesto opcional por hook. Cuando se define, el ejecutor de hooks aborta ese
  manejador después de que transcurre el presupuesto y continúa con el siguiente, en lugar de
  permitir que una configuración lenta o el trabajo de recuperación consuman el tiempo de espera
  de modelo configurado por el llamador. Omítelo para usar el tiempo de espera predeterminado de observación/decisión que el
  ejecutor de hooks aplica de forma genérica.

Los operadores también pueden definir presupuestos de hooks sin parchear el código del plugin:

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

`hooks.timeouts.<hookName>` anula `hooks.timeoutMs`, que anula el valor
`api.on(..., { timeoutMs })` escrito por el plugin. Cada valor configurado debe
ser un entero positivo no mayor de 600000 milisegundos. Prefiere las
anulaciones por hook para hooks lentos conocidos, de modo que un plugin no reciba un presupuesto más largo
en todas partes.

Cada hook recibe `event.context.pluginConfig`, la configuración resuelta para el
plugin que registró ese manejador. Úsala para decisiones de hooks que necesiten
opciones actuales del plugin; OpenClaw la inyecta por manejador sin mutar el
objeto de evento compartido que ven otros plugins.

## Catálogo de hooks

Los hooks se agrupan por la superficie que extienden. Los nombres en **negrita** aceptan un
resultado de decisión (bloquear, cancelar, anular o requerir aprobación); todos los demás son
solo de observación.

**Turno del agente**

- `before_model_resolve` — anular el proveedor o modelo antes de que se carguen los mensajes de sesión
- `agent_turn_prepare` — consumir inyecciones de turno de plugin en cola y agregar contexto del mismo turno antes de los hooks de prompt
- `before_prompt_build` — agregar contexto dinámico o texto de prompt del sistema antes de la llamada al modelo
- `before_agent_start` — fase combinada solo por compatibilidad; prefiere los dos hooks anteriores
- **`before_agent_reply`** — interrumpir el turno del modelo con una respuesta sintética o silencio
- **`before_agent_finalize`** — inspeccionar la respuesta final natural y solicitar un pase más del modelo
- `agent_end` — observar mensajes finales, estado de éxito y duración de ejecución
- `heartbeat_prompt_contribution` — agregar contexto solo de Heartbeat para plugins de monitorización en segundo plano y ciclo de vida

**Observación de conversación**

- `model_call_started` / `model_call_ended` — observar metadatos saneados de llamadas de proveedor/modelo, temporización, resultado y hashes acotados de id. de solicitud sin contenido de prompt ni respuesta
- `llm_input` — observar la entrada del proveedor (prompt del sistema, prompt, historial)
- `llm_output` — observar la salida del proveedor

**Herramientas**

- **`before_tool_call`** — reescribir parámetros de herramienta, bloquear la ejecución o requerir aprobación
- `after_tool_call` — observar resultados de herramienta, errores y duración
- **`tool_result_persist`** — reescribir el mensaje del asistente producido a partir de un resultado de herramienta
- **`before_message_write`** — inspeccionar o bloquear la escritura de un mensaje en curso (poco frecuente)

**Mensajes y entrega**

- **`inbound_claim`** — reclamar un mensaje entrante antes del enrutamiento del agente (respuestas sintéticas)
- `message_received` — observar contenido entrante, remitente, hilo y metadatos
- **`message_sending`** — reescribir contenido saliente o cancelar la entrega
- `message_sent` — observar éxito o fallo de entrega saliente
- **`before_dispatch`** — inspeccionar o reescribir un despacho saliente antes de la entrega al canal
- **`reply_dispatch`** — participar en la canalización final de despacho de respuesta

**Sesiones y Compaction**

- `session_start` / `session_end` — rastrear límites del ciclo de vida de sesión
- `before_compaction` / `after_compaction` — observar o anotar ciclos de Compaction
- `before_reset` — observar eventos de restablecimiento de sesión (`/reset`, restablecimientos programáticos)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordinar el enrutamiento de subagentes y la entrega de finalización

**Ciclo de vida**

- `gateway_start` / `gateway_stop` — iniciar o detener servicios propiedad del plugin con el Gateway
- `cron_changed` — observar cambios del ciclo de vida de cron propiedad del gateway (agregado, actualizado, eliminado, iniciado, finalizado, programado)
- **`before_install`** — inspeccionar escaneos de instalación de skill o plugin y bloquear opcionalmente

## Política de llamadas a herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (definido en ejecuciones impulsadas por cron) y `ctx.trace` de diagnóstico

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

- `block: true` es terminal y omite los manejadores de menor prioridad.
- `block: false` se trata como si no hubiera decisión.
- `params` reescribe los parámetros de herramienta para la ejecución.
- `requireApproval` pausa la ejecución del agente y pregunta al usuario mediante aprobaciones de plugin. El comando `/approve` puede aprobar tanto aprobaciones de exec como de plugin.
- Un `block: true` de menor prioridad todavía puede bloquear después de que un hook de mayor prioridad
  haya solicitado aprobación.
- `onResolution` recibe la decisión de aprobación resuelta — `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

Los plugins incluidos que necesiten políticas a nivel de host pueden registrar políticas de herramientas de confianza
con `api.registerTrustedToolPolicy(...)`. Estas se ejecutan antes de los hooks
`before_tool_call` ordinarios y antes de decisiones de plugins externos. Úsalas solo
para barreras de confianza del host, como política del espacio de trabajo, aplicación de presupuesto o
seguridad de flujos de trabajo reservados. Los plugins externos deben usar hooks `before_tool_call`
normales.

### Persistencia de resultados de herramientas

Los resultados de herramientas pueden incluir `details` estructurados para renderizado de UI, diagnósticos,
enrutamiento de medios o metadatos propiedad del plugin. Trata `details` como metadatos de tiempo de ejecución,
no como contenido de prompt:

- OpenClaw elimina `toolResult.details` antes de la reproducción del proveedor y la entrada de Compaction
  para que los metadatos no se conviertan en contexto del modelo.
- Las entradas de sesión persistidas conservan solo `details` acotados. Los detalles sobredimensionados se
  reemplazan por un resumen compacto y `persistedDetailsTruncated: true`.
- `tool_result_persist` y `before_message_write` se ejecutan antes del límite final
  de persistencia. Aun así, los hooks deben mantener pequeños los `details` devueltos y evitar
  colocar texto relevante para el prompt solo en `details`; coloca la salida de herramienta visible para el modelo
  en `content`.

## Hooks de prompt y modelo

Usa los hooks específicos de fase para plugins nuevos:

- `before_model_resolve`: recibe solo el prompt actual y metadatos de adjuntos.
  Devuelve `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: recibe el prompt actual, mensajes de sesión preparados
  y cualquier inyección en cola exactamente una vez drenada para esta sesión. Devuelve
  `prependContext` o `appendContext`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de sesión.
  Devuelve `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: se ejecuta solo para turnos de Heartbeat y devuelve
  `prependContext` o `appendContext`. Está pensado para monitores en segundo plano
  que necesitan resumir el estado actual sin cambiar turnos iniciados por el usuario.

`before_agent_start` permanece por compatibilidad. Prefiere los hooks explícitos anteriores
para que tu plugin no dependa de una fase combinada heredada.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa. El mismo valor también está disponible en `ctx.runId`.
Las ejecuciones impulsadas por Cron también exponen `ctx.jobId` (el id del trabajo cron de origen) para que
los hooks de plugin puedan delimitar métricas, efectos secundarios o estado a un trabajo programado
específico.

Para ejecuciones originadas en canales, `ctx.messageProvider` es la superficie de proveedor, como
`discord` o `telegram`, mientras que `ctx.channelId` es el identificador de destino de la conversación
cuando OpenClaw puede derivar uno de la clave de sesión o los metadatos
de entrega.

`agent_end` es un hook de observación y se ejecuta de forma fire-and-forget después del turno. El
ejecutor de hooks aplica un tiempo de espera de 30 segundos para que un plugin o endpoint
de embeddings bloqueado no pueda dejar la promesa del hook pendiente para siempre. Un tiempo de espera se registra y
OpenClaw continúa; no cancela el trabajo de red propiedad del plugin salvo que el
plugin también use su propia señal de aborto.

Usa `model_call_started` y `model_call_ended` para telemetría de llamadas de proveedor
que no debería recibir prompts, historial, respuestas, encabezados, cuerpos de solicitud ni id. de solicitud de proveedor en bruto. Estos hooks incluyen metadatos estables como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcional,
`durationMs`/`outcome` terminal y `upstreamRequestIdHash` cuando OpenClaw puede derivar un
hash acotado de id. de solicitud de proveedor.

`before_agent_finalize` se ejecuta solo cuando un arnés está a punto de aceptar una
respuesta final natural del asistente. No es la ruta de cancelación de `/stop` y no
se ejecuta cuando el usuario aborta un turno. Devuelve `{ action: "revise", reason }` para pedir
al arnés un pase más del modelo antes de la finalización, `{ action:
"finalize", reason? }` para forzar la finalización, u omite un resultado para continuar.
Los hooks nativos `Stop` de Codex se retransmiten a este hook como decisiones
`before_agent_finalize` de OpenClaw.

Los plugins no incluidos que necesiten `llm_input`, `llm_output`,
`before_agent_finalize` o `agent_end` deben definir:

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

Los hooks que mutan prompts y las inyecciones duraderas de siguiente turno pueden deshabilitarse por plugin
con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensiones de sesión e inyecciones de siguiente turno

Los plugins de flujo de trabajo pueden persistir un estado de sesión pequeño compatible con JSON con
`api.registerSessionExtension(...)` y actualizarlo mediante el método
`sessions.pluginPatch` del Gateway. Las filas de sesión proyectan el estado de extensión registrado
mediante `pluginExtensions`, lo que permite que Control UI y otros clientes rendericen
estado propiedad del plugin sin conocer los detalles internos del plugin.

Usa `api.enqueueNextTurnInjection(...)` cuando un plugin necesite contexto duradero para
llegar al siguiente turno del modelo exactamente una vez. OpenClaw vacía las inyecciones en cola antes de
los hooks de prompt, descarta las inyecciones vencidas y deduplica por `idempotencyKey`
por plugin. Esta es la interfaz adecuada para reanudaciones de aprobación, resúmenes de políticas,
deltas de monitores en segundo plano y continuaciones de comandos que deben ser visibles para
el modelo en el siguiente turno, pero no deben convertirse en texto permanente del prompt del sistema.

La semántica de limpieza forma parte del contrato. La limpieza de extensión de sesión y
las callbacks de limpieza del ciclo de vida del runtime reciben `reset`, `delete`, `disable` o
`restart`. El host elimina el estado persistente de extensión de sesión del plugin propietario
y las inyecciones pendientes para el siguiente turno en reset/delete/disable; restart conserva
el estado duradero de la sesión, mientras que las callbacks de limpieza permiten que los plugins liberen tareas
del planificador, contexto de ejecución y otros recursos fuera de banda de la generación anterior
del runtime.

## Hooks de mensajes

Usa hooks de mensajes para enrutamiento a nivel de canal y políticas de entrega:

- `message_received`: observa contenido entrante, remitente, `threadId`, `messageId`,
  `senderId`, correlación opcional de ejecución/sesión y metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `message_sent`: observa el éxito o fallo final.

Para respuestas TTS solo de audio, `content` puede contener la transcripción hablada oculta
aunque la carga útil del canal no tenga texto/subtítulo visible. Reescribir ese
`content` actualiza solo la transcripción visible para el hook; no se renderiza como
subtítulo multimedia.

Los contextos de hooks de mensajes exponen campos de correlación estables cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Prefiere
estos campos de primera clase antes de leer metadatos heredados.

Prefiere los campos tipados `threadId` y `replyToId` antes de usar metadatos específicos
del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se trata como sin decisión.
- El `content` reescrito continúa hacia hooks de menor prioridad salvo que un hook posterior
  cancele la entrega.

## Hooks de instalación

`before_install` se ejecuta después del escaneo integrado para instalaciones de Skills y plugins.
Devuelve hallazgos adicionales o `{ block: true, blockReason }` para detener la
instalación.

`block: true` es terminal. `block: false` se trata como sin decisión.

## Ciclo de vida de Gateway

Usa `gateway_start` para servicios de plugin que necesitan estado propiedad de Gateway. El
contexto expone `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para
inspección y actualizaciones de Cron. Usa `gateway_stop` para limpiar recursos
de larga duración.

No dependas del hook interno `gateway:startup` para servicios de runtime propiedad del plugin.

`cron_changed` se dispara para eventos del ciclo de vida de Cron propiedad de Gateway con una carga útil
de evento tipada que cubre motivos `added`, `updated`, `removed`, `started`, `finished`
y `scheduled`. El evento lleva una instantánea `PluginHookGatewayCronJob`
(incluidos `state.nextRunAtMs`, `state.lastRunStatus` y
`state.lastError` cuando está presente), además de un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Los eventos
removed aún llevan la instantánea del trabajo eliminado para que los planificadores externos puedan
reconciliar el estado. Usa `ctx.getCron?.()` y `ctx.config` del contexto de runtime
al sincronizar planificadores de activación externos, y mantén OpenClaw como la
fuente de verdad para comprobaciones de vencimiento y ejecución.

## Próximas obsolescencias

Algunas superficies adyacentes a hooks están obsoletas, pero siguen siendo compatibles. Migra
antes de la próxima versión mayor:

- **Sobres de canal en texto plano** en handlers `inbound_claim` y `message_received`.
  Lee `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar texto de sobre plano. Consulta
  [Sobres de canal en texto plano → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** se mantiene por compatibilidad. Los plugins nuevos deben usar
  `before_model_resolve` y `before_prompt_build` en lugar de la fase
  combinada.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de un `string` de formato libre.

Para la lista completa — registro de capacidad de memoria, perfil de razonamiento del proveedor,
proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores del runtime
de tareas y el cambio de nombre `command-auth` → `command-status` — consulta
[Migración de Plugin SDK → Obsolescencias activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración de Plugin SDK](/es/plugins/sdk-migration) — obsolescencias activas y calendario de eliminación
- [Creación de plugins](/es/plugins/building-plugins)
- [Resumen de Plugin SDK](/es/plugins/sdk-overview)
- [Puntos de entrada de Plugin](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Detalles internos de la arquitectura de Plugin](/es/plugins/architecture-internals)
