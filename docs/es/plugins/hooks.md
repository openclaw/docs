---
read_when:
    - Estás creando un Plugin que necesita before_tool_call, before_agent_reply, ganchos de mensajes o ganchos de ciclo de vida
    - Necesitas bloquear, reescribir o requerir aprobación para las llamadas a herramientas desde un plugin
    - Estás decidiendo entre hooks internos y hooks de plugin
summary: 'Hooks de Plugin: interceptar eventos del ciclo de vida del agente, la herramienta, el mensaje, la sesión y el Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-07-05T11:34:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7526c109b1fe07d36cda945d64577c374539f6ccf3f2ba0a99796939aba6dd9a
    source_path: plugins/hooks.md
    workflow: 16
---

Los hooks de Plugin son puntos de extensión en proceso para plugins de OpenClaw:
inspeccionan o cambian ejecuciones de agente, llamadas de herramientas, flujo de
mensajes, ciclo de vida de sesiones, enrutamiento de subagentes, instalaciones o
el inicio del Gateway.

Usa [hooks internos](/es/automation/hooks) en su lugar para un script `HOOK.md`
pequeño instalado por el operador que reacciona a eventos de comandos y del
Gateway como `/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

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

Los manejadores se ejecutan secuencialmente en orden descendente de `priority`;
los manejadores con la misma prioridad conservan el orden de registro.

`api.on(name, handler, opts?)` acepta:

| Opción      | Efecto                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Orden; los valores más altos se ejecutan primero.                                                                                                                                              |
| `timeoutMs` | Presupuesto por hook. Cuando se define, el ejecutor aborta ese manejador después del presupuesto y continúa en lugar de bloquearse con el timeout configurado del modelo. Omítelo para usar el timeout predeterminado por hook del ejecutor. |

Los operadores pueden definir presupuestos de hooks sin parchear el código del plugin:

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

`hooks.timeouts.<hookName>` reemplaza a `hooks.timeoutMs`, que reemplaza el
valor `api.on(..., { timeoutMs })` escrito por el plugin. Cada valor debe ser un
entero positivo de hasta 600000 ms. Prefiere reemplazos por hook para hooks que
se sabe que son lentos, de modo que un plugin no obtenga un presupuesto mayor en
todas partes.

Cada hook recibe `event.context.pluginConfig`, la configuración resuelta para el
plugin que registró ese manejador. OpenClaw la inyecta por manejador sin mutar el
objeto de evento compartido que ven otros plugins.

## Catálogo de hooks

Los hooks se agrupan por la superficie que extienden. Los nombres en **negrita**
aceptan un resultado de decisión (bloquear, cancelar, reemplazar o exigir
aprobación); el resto son solo de observación.

**Turno de agente**

| Hook                            | Propósito                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Reemplazar el proveedor o el modelo antes de que se carguen los mensajes de sesión       |
| `agent_turn_prepare`            | Consumir inyecciones de turno de plugin en cola y añadir contexto del mismo turno antes de los hooks de prompt |
| `before_prompt_build`           | Añadir contexto dinámico o texto de prompt del sistema antes de la llamada al modelo     |
| `before_agent_start`            | Fase combinada solo de compatibilidad; prefiere los dos hooks anteriores                 |
| **`before_agent_run`**          | Inspeccionar el prompt final y los mensajes de sesión antes del envío al modelo; puede bloquear la ejecución |
| **`before_agent_reply`**        | Cortocircuitar el turno del modelo con una respuesta sintética o silencio                |
| **`before_agent_finalize`**     | Inspeccionar la respuesta final natural y solicitar una pasada más del modelo            |
| `agent_end`                     | Observar mensajes finales, estado de éxito y duración de la ejecución                    |
| `heartbeat_prompt_contribution` | Añadir contexto solo de Heartbeat para plugins de monitor en segundo plano y ciclo de vida |

**Observación de conversación**

| Hook                                      | Propósito                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `model_call_started` / `model_call_ended` | Metadatos saneados de llamada a proveedor/modelo: tiempos, resultado, hashes acotados de ID de solicitud. Sin contenido de prompt ni respuesta. |
| `llm_input`                               | Entrada del proveedor: prompt del sistema, prompt, historial                                                        |
| `llm_output`                              | Salida del proveedor, uso y el `contextTokenBudget` resuelto cuando está disponible                                 |

**Herramientas**

| Hook                       | Propósito                                                     |
| -------------------------- | ------------------------------------------------------------- |
| **`before_tool_call`**     | Reescribir parámetros de herramienta, bloquear la ejecución o exigir aprobación |
| `after_tool_call`          | Observar resultados de herramientas, errores y duración       |
| `resolve_exec_env`         | Aportar variables de entorno propiedad del plugin a `exec`    |
| **`tool_result_persist`**  | Reescribir el mensaje del asistente producido a partir de un resultado de herramienta |
| **`before_message_write`** | Inspeccionar o bloquear una escritura de mensaje en curso (raro) |

**Mensajes y entrega**

| Hook                        | Propósito                                                        |
| --------------------------- | ---------------------------------------------------------------- |
| **`inbound_claim`**         | Reclamar un mensaje entrante antes del enrutamiento del agente (respuestas sintéticas) |
| `message_received`          | Observar contenido entrante, remitente, hilo y metadatos         |
| **`message_sending`**       | Reescribir contenido saliente o cancelar la entrega              |
| **`reply_payload_sending`** | Mutar o cancelar payloads de respuesta normalizados antes de la entrega |
| `message_sent`              | Observar éxito o fallo de entrega saliente                       |
| **`before_dispatch`**       | Inspeccionar o reescribir un despacho saliente antes de entregarlo al canal |
| **`reply_dispatch`**        | Participar en la canalización final de despacho de respuestas    |

**Sesiones y Compaction**

| Hook                                     | Propósito                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `session_start` / `session_end`          | Rastrear límites del ciclo de vida de la sesión. `reason` es uno de `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` o `unknown`. `shutdown`/`restart` se disparan desde el finalizador de apagado del Gateway cuando el proceso se detiene o reinicia con sesiones activas, para que los plugins (memoria, almacenes de transcripciones) puedan finalizar filas fantasma en lugar de dejarlas abiertas entre reinicios. El finalizador está acotado para que un plugin lento no pueda bloquear SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Observar o anotar ciclos de Compaction                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `before_reset`                           | Observar eventos de restablecimiento de sesión (`/reset`, restablecimientos programáticos)                                                                                                                                                                                                                                                                                                                                                                         |

**Subagentes**

- `subagent_spawned` / `subagent_ended` - observa el lanzamiento y la finalización de subagentes.
- `subagent_delivery_target` - hook de compatibilidad para la entrega de finalización cuando ningún enlace de sesión del núcleo puede proyectar una ruta.
- `subagent_spawning` - hook de compatibilidad obsoleto. El núcleo ahora prepara enlaces de subagente `thread: true` mediante adaptadores de enlace de sesión de canal antes de que se dispare `subagent_spawned`.
- `subagent_spawned` incluye `resolvedModel` y `resolvedProvider` cuando OpenClaw ha resuelto el modelo nativo de la sesión hija antes del lanzamiento.
- `subagent_ended` lleva `targetSessionKey` (identidad - coincide con `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` o `"acp"`), `reason`, `outcome` opcional (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` o `"deleted"`), `error` opcional, `runId`, `endedAt`, `accountId` y `sendFarewell`. **No** incluye `agentId` ni `childSessionKey`; usa `targetSessionKey` para correlacionarlo con el evento `subagent_spawned` correspondiente.

**Ciclo de vida**

| Hook                             | Propósito                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `gateway_start` / `gateway_stop` | Iniciar o detener servicios propiedad del plugin con el Gateway                                        |
| `deactivate`                     | Alias de compatibilidad obsoleto de `gateway_stop`; usa `gateway_stop` en plugins nuevos               |
| `cron_changed`                   | Observar cambios del ciclo de vida de cron propiedad del Gateway (añadido, actualizado, eliminado, iniciado, finalizado, programado) |
| **`before_install`**             | Inspeccionar material preparado de instalación de skill o plugin desde un runtime de plugin cargado    |

## Depurar hooks de runtime

Usa `before_model_resolve` para cambiar el proveedor o el modelo de un turno de
agente; se ejecuta antes de la resolución del modelo. `llm_output` solo se
ejecuta después de que un intento de modelo produce salida del asistente.

Para demostrar el modelo de sesión efectivo, inspecciona los registros de
runtime y luego usa `openclaw sessions` o las superficies de sesión/estado del
Gateway. Para depurar payloads del proveedor, inicia el Gateway con
`--raw-stream` y `--raw-stream-path <path>` para escribir eventos sin procesar
del stream del modelo en un archivo jsonl.

## Política de llamadas de herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.toolKind` y `event.toolInputKind` opcionales, discriminadores
  autoritativos del host para herramientas que comparten nombres
  intencionadamente; por ejemplo, las llamadas `exec` externas del modo código
  usan `toolKind: "code_mode_exec"` e incluyen
  `toolInputKind: "javascript" | "typescript"` cuando se conoce el lenguaje de
  entrada
- `event.derivedPaths` opcional, pistas de rutas de destino derivadas por el
  host con el mejor esfuerzo para envoltorios de herramientas conocidos como
  `apply_patch`; estas rutas pueden estar incompletas o sobreaproximar lo que
  la herramienta realmente tocará (por ejemplo, con entradas mal formadas o
  parciales)
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` y el diagnóstico `ctx.trace`

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

- `block: true` es terminal y omite los manejadores de menor prioridad.
- `block: false` se trata como si no hubiera decisión.
- `params` reescribe los parámetros de la herramienta para la ejecución.
- `requireApproval` pausa la ejecución del agente y pregunta al usuario
  mediante aprobaciones de Plugin. `/approve` puede aprobar aprobaciones tanto
  de exec como de Plugin. En retransmisiones nativas `PreToolUse` en modo
  informe del app-server de Codex, esto se delega a la solicitud de aprobación
  correspondiente del app-server; consulta
  [tiempo de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime#hook-boundaries).
- Un `block: true` de menor prioridad aún puede bloquear después de que un hook
  de mayor prioridad haya solicitado aprobación.
- `onResolution` recibe la decisión resuelta: `allow-once`, `allow-always`,
  `deny`, `timeout` o `cancelled`.

Consulta [solicitudes de permisos de Plugin](/es/plugins/plugin-permission-requests) para
el enrutamiento de aprobaciones, el comportamiento de decisión y cuándo usar
`requireApproval` en lugar de herramientas opcionales o aprobaciones de exec.

Los Plugins que necesiten políticas a nivel de host pueden registrar políticas
de herramientas de confianza con `api.registerTrustedToolPolicy(...)`. Estas se
ejecutan antes que los hooks `before_tool_call` ordinarios y antes que las
decisiones normales de hooks. Las políticas de confianza empaquetadas se
ejecutan primero; las políticas de confianza de Plugins instalados se ejecutan
después, en el orden de carga de Plugins; los hooks `before_tool_call`
ordinarios se ejecutan después de ellas. Los Plugins empaquetados conservan la
ruta existente de políticas de confianza. Los Plugins instalados deben estar
habilitados explícitamente y declarar cada id de política en
`contracts.trustedToolPolicies`; los ids no declarados se rechazan antes del
registro. Los ids de política están delimitados al Plugin que los registra, por
lo que distintos Plugins pueden reutilizar el mismo id local. Usa este nivel
solo para controles de confianza del host, como políticas de espacio de
trabajo, aplicación de presupuestos o seguridad de flujos de trabajo reservados.

### Hook de entorno exec

`resolve_exec_env` permite que los Plugins aporten variables de entorno a las
invocaciones de la herramienta `exec` antes de ejecutar el comando. Recibe:

- `event.sessionKey`
- `event.toolName`, actualmente siempre `"exec"`
- `event.host`, uno de `"gateway"`, `"sandbox"` o `"node"`
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` y `ctx.channelId`

Devuelve un `Record<string, string>` para fusionarlo en el entorno de exec. Los
manejadores se ejecutan por orden de prioridad; los resultados posteriores
sobrescriben los anteriores para la misma clave.

La salida del hook se filtra mediante la política de claves de entorno exec del
host antes de fusionarse. `PATH` siempre se descarta (la resolución de comandos
y las comprobaciones de binarios seguros dependen de él). Se descartan las
claves no válidas y las claves peligrosas de sobrescritura del host, como
`LD_*`, `DYLD_*`, `NODE_OPTIONS`, variables de proxy (`HTTP_PROXY`,
`HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY`) y variables de sobrescritura de TLS
(`NODE_TLS_REJECT_UNAUTHORIZED`, `SSL_CERT_FILE` y similares). El entorno de
Plugin filtrado se incluye en los metadatos de aprobación/auditoría del Gateway
y se reenvía a las solicitudes de ejecución del host node.

### Persistencia de resultados de herramientas

Los resultados de herramientas pueden incluir `details` estructurados para
renderizado de UI, diagnósticos, enrutamiento de medios o metadatos propiedad
del Plugin. Trata `details` como metadatos de tiempo de ejecución, no como
contenido del prompt:

- OpenClaw elimina `toolResult.details` antes de la reproducción del proveedor y
  de la entrada de Compaction, para que los metadatos no se conviertan en
  contexto del modelo.
- Las entradas de sesión persistidas conservan solo `details` acotados. Los
  detalles sobredimensionados se reemplazan por un resumen compacto y
  `persistedDetailsTruncated: true`.
- `tool_result_persist` y `before_message_write` se ejecutan antes del límite
  final de persistencia. Mantén los `details` devueltos pequeños y evita poner
  texto relevante para el prompt solo en `details`; coloca la salida de la
  herramienta visible para el modelo en `content`.

## Hooks de prompt y modelo

Usa los hooks específicos de fase para nuevos Plugins:

- `before_model_resolve`: recibe solo el prompt actual y los metadatos de
  adjuntos. Devuelve `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: recibe el prompt actual, los mensajes de sesión
  preparados y cualquier inyección encolada de ejecución exacta una vez
  drenada para esta sesión. Devuelve `prependContext` o `appendContext`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de sesión.
  Devuelve `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: se ejecuta solo para turnos de Heartbeat y
  devuelve `prependContext` o `appendContext`. Está pensado para monitores en
  segundo plano que necesitan resumir el estado actual sin cambiar los turnos
  iniciados por el usuario.

`before_agent_start` permanece por compatibilidad. Prefiere los hooks explícitos
anteriores para que el Plugin no dependa de una fase combinada heredada.

`before_agent_run` se ejecuta después de la construcción del prompt y antes de
cualquier entrada del modelo, incluida la carga de imágenes locales del prompt
y la observación `llm_input`. Recibe la entrada actual del usuario como
`prompt`, además del historial de sesión cargado en `messages` y el prompt del
sistema activo. Devuelve `{ outcome: "block", reason, message? }` para detener
la ejecución antes de que el modelo lea el prompt. `reason` es interno;
`message` es el reemplazo visible para el usuario. Solo se admiten resultados
`pass` y `block`; las formas de decisión no compatibles fallan cerradas.

Cuando se bloquea una ejecución, OpenClaw almacena solo el texto de reemplazo en
`message.content`, además de metadatos no sensibles del bloqueo, como el id del
Plugin que bloquea y la marca de tiempo. El texto original del usuario no se
conserva en la transcripción ni en el contexto futuro. Los motivos internos del
bloqueo se tratan como sensibles y se excluyen de las cargas de transcripción,
historial, difusión, registro y diagnósticos. La observabilidad debe usar
campos saneados como id del bloqueador, resultado, marca de tiempo o una
categoría segura.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa; el mismo valor también está en `ctx.runId`. Las
ejecuciones impulsadas por Cron también exponen `ctx.jobId` (el id del trabajo
cron de origen) en el contexto del turno de agente, para que los hooks puedan
delimitar métricas, efectos secundarios o estado a un trabajo programado
específico. `ctx.jobId` no forma parte del contexto de herramienta de
`before_tool_call`.

Para ejecuciones originadas en canales, `ctx.channel` y `ctx.messageProvider`
identifican la superficie del proveedor, como `discord` o `telegram`, mientras
que `ctx.channelId` es el identificador del destino de conversación cuando
OpenClaw puede derivarlo de la clave de sesión o de los metadatos de entrega.

Cuando la identidad del remitente está disponible, los contextos de hooks de
agente también incluyen:

- `ctx.senderId` - ID de remitente delimitado al canal (p. ej., `open_id` de
  Feishu, ID de usuario de Discord). Se rellena cuando la ejecución se origina
  en un mensaje de usuario con metadatos de remitente conocidos.
- `ctx.chatId` - identificador de conversación nativo del transporte (p. ej.,
  `chat_id` de Feishu, `chat_id` de Telegram). Se rellena cuando el canal de
  origen proporciona un ID de conversación nativo.
- `ctx.channelContext.sender.id` - el mismo ID de remitente que `ctx.senderId`,
  bajo un objeto propiedad del canal que los Plugins pueden ampliar con campos
  específicos del canal.
- `ctx.channelContext.chat.id` - el mismo ID de conversación que `ctx.chatId`,
  bajo un objeto propiedad del canal que los Plugins pueden ampliar con campos
  específicos del canal.

El núcleo solo define los campos `id` anidados. Los Plugins de canal que pasan
metadatos más ricos de remitente o chat mediante el helper de entrada pueden
aumentar `PluginHookChannelSenderContext` o `PluginHookChannelChatContext` desde
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Los Plugins de canal pasan esos campos mediante el helper del SDK de entrada:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Estos campos son opcionales y están ausentes en ejecuciones originadas por el
sistema (heartbeat, cron, exec-event).

`ctx.senderExternalId` permanece como campo obsoleto de compatibilidad de código
fuente para Plugins antiguos. El núcleo no lo rellena; las nuevas identidades
de remitente específicas del canal deben vivir bajo `ctx.channelContext.sender`
mediante aumento de módulo.

`agent_end` es un hook de observación. Las rutas de Gateway y arnés persistente
lo ejecutan sin esperar el resultado después del turno, mientras que las rutas
CLI de un solo uso y corta duración esperan la promesa del hook antes de la
limpieza del proceso para que los Plugins de confianza puedan volcar
observabilidad terminal o capturar estado. El ejecutor de hooks aplica un
tiempo de espera de 30 segundos para que un Plugin bloqueado o un endpoint de
incrustación no pueda dejar la promesa del hook pendiente para siempre. Se
registra el tiempo de espera y OpenClaw continúa; no cancela el trabajo de red
propiedad del Plugin salvo que el Plugin también use su propia señal de
anulación.

Usa `model_call_started` y `model_call_ended` para telemetría de llamadas de
proveedor que no deba recibir prompts sin procesar, historial, respuestas,
cabeceras, cuerpos de solicitud ni IDs de solicitud del proveedor. Estos hooks
incluyen metadatos estables como `runId`, `callId`, `provider`, `model`, los
opcionales `api`/`transport`, `durationMs`/`outcome` terminales y
`upstreamRequestIdHash` cuando OpenClaw puede derivar un hash acotado del id de
solicitud del proveedor. Cuando el runtime ha resuelto metadatos de ventana de
contexto, el evento y el contexto del hook también incluyen
`contextTokenBudget`, el presupuesto efectivo de tokens después de los límites
de modelo/configuración/agente, además de `contextWindowSource` y
`contextWindowReferenceTokens` cuando se aplicó un límite inferior.

`before_agent_finalize` se ejecuta solo cuando un arnés está a punto de aceptar
una respuesta final natural del asistente. No es la ruta de cancelación `/stop`
y no se ejecuta cuando el usuario aborta un turno. Devuelve `{ action:
"revise", reason }` para pedir al arnés una pasada más del modelo antes de la
finalización, `{ action: "finalize", reason? }` para forzar la finalización, u
omite un resultado para continuar. Los hooks nativos `Stop` de Codex se
retransmiten a este hook como decisiones `before_agent_finalize` de OpenClaw.

Al devolver `action: "revise"`, los Plugins pueden incluir metadatos `retry`
para que la pasada adicional del modelo sea acotada y segura para reproducción:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` se añade al motivo de revisión enviado al arnés.
`idempotencyKey` permite que el host cuente los reintentos de la misma solicitud
de Plugin entre decisiones de finalización equivalentes, y `maxAttempts` limita
cuántas pasadas adicionales permitirá el host antes de continuar con la
respuesta final natural.

Los Plugins no empaquetados que necesiten hooks de conversación sin procesar
(`before_model_resolve`, `before_agent_reply`, `llm_input`, `llm_output`,
`before_agent_finalize`, `agent_end` o `before_agent_run`) deben establecer:

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

Los hooks que mutan prompts y las inyecciones duraderas del siguiente turno se
pueden deshabilitar por Plugin con
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensiones de sesión e inyecciones del siguiente turno

Los plugins de flujo de trabajo pueden persistir un estado de sesión pequeño compatible con JSON con
`api.session.state.registerSessionExtension(...)` y actualizarlo mediante el método
`sessions.pluginPatch` del Gateway. Las filas de sesión proyectan el estado de extensión
registrado mediante `pluginExtensions`, lo que permite que Control UI y otros
clientes representen el estado propiedad del plugin sin conocer los detalles internos del plugin.
`api.registerSessionExtension(...)` todavía funciona, pero está obsoleto en favor del
espacio de nombres `api.session.state`.

Usa `api.session.workflow.enqueueNextTurnInjection(...)` cuando un plugin necesita
que un contexto duradero llegue exactamente una vez al siguiente turno del modelo (el alias
de nivel superior `api.enqueueNextTurnInjection(...)` está obsoleto y tiene el mismo
comportamiento). OpenClaw consume las inyecciones en cola antes de los ganchos de prompt, descarta
las inyecciones expiradas y deduplica por `idempotencyKey` por plugin. Esta es
la unión adecuada para reanudaciones de aprobaciones, resúmenes de políticas, deltas de monitores
en segundo plano y continuaciones de comandos que deben ser visibles para el modelo en el
siguiente turno, pero no deben convertirse en texto permanente del prompt del sistema.

La semántica de limpieza forma parte del contrato. Las devoluciones de llamada de limpieza de
extensiones de sesión y de limpieza del ciclo de vida del runtime reciben `reset`, `delete`, `disable` o
`restart`. El host elimina el estado persistente de extensión de sesión del plugin propietario
y las inyecciones pendientes del siguiente turno para reset/delete/disable; restart
conserva el estado duradero de sesión mientras las devoluciones de llamada de limpieza permiten que los plugins liberen
trabajos del programador, contexto de ejecución y otros recursos fuera de banda de la antigua
generación del runtime.

## Ganchos de mensajes

Usa ganchos de mensajes para la política de enrutamiento y entrega a nivel de canal:

- `message_received`: observa contenido entrante, remitente, `threadId`,
  `messageId`, `senderId`, correlación opcional de ejecución/sesión y metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `reply_payload_sending`: reescribe objetos `ReplyPayload` normalizados
  (incluidos `presentation`, `delivery`, referencias de medios y texto) o devuelve
  `{ cancel: true }`.
- `message_sent`: observa el éxito o fallo final.

En respuestas TTS solo de audio, `content` puede contener la transcripción hablada
oculta incluso cuando la carga útil del canal no tiene texto/pie de foto visible.
Reescribir ese `content` solo actualiza la transcripción visible para el gancho; no se
representa como pie de foto de medio.

Los eventos `reply_payload_sending` pueden incluir `usageState`, una instantánea en vivo
de mejor esfuerzo por turno del modelo/uso/contexto. La entrega duradera, la repetición recuperada y
las respuestas sin correlación exacta de ejecución la omiten.

Los contextos de ganchos de mensajes exponen campos de correlación estables cuando están disponibles:
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
- `message_sending` con `cancel: false` se trata como ausencia de decisión.
- El `content` reescrito continúa hacia los ganchos de menor prioridad a menos que un gancho posterior
  cancele la entrega.
- `reply_payload_sending` se ejecuta después de la normalización de la carga útil y antes de la entrega
  por el canal, incluidas las respuestas enrutadas de vuelta al canal de origen.
  Los controladores se ejecutan secuencialmente y cada controlador ve la carga útil más reciente producida
  por los controladores de mayor prioridad.
- Las cargas útiles de `reply_payload_sending` no exponen marcadores de confianza del runtime como
  `trustedLocalMedia`; los plugins pueden editar la forma de la carga útil, pero no pueden conceder confianza
  a medios locales.
- `message_sending` puede devolver `cancelReason` y `metadata` acotados con una
  cancelación. Las nuevas API de ciclo de vida de mensajes exponen esto como un resultado de
  entrega suprimida con razón `cancelled_by_message_sending_hook`; la entrega directa
  heredada sigue devolviendo un arreglo de resultados vacío por compatibilidad.
- `message_sent` es solo de observación. Los fallos de los controladores se registran y no
  cambian el resultado de la entrega.

## Ganchos de instalación

Usa `security.installPolicy` para decisiones de permitir/bloquear propiedad del operador. Esa
política se ejecuta desde la configuración de OpenClaw, cubre las rutas de instalación y actualización de la CLI, y
falla de forma cerrada cuando está habilitada pero no disponible.

`before_install` es un gancho de ciclo de vida del runtime de plugins. Se ejecuta después de
`security.installPolicy` solo en el proceso de OpenClaw donde los ganchos de plugins ya se
han cargado, como los flujos de instalación respaldados por Gateway. Es útil para
observaciones, advertencias y comprobaciones de compatibilidad propiedad del plugin, pero no es
el límite principal de seguridad empresarial o del host para instalaciones. El campo
`builtinScan` permanece en la carga útil del evento por compatibilidad, pero
OpenClaw ya no ejecuta bloqueo integrado de código peligroso en tiempo de instalación, por lo que es
un resultado `ok` vacío. Devuelve hallazgos adicionales o
`{ block: true, blockReason }` para detener la instalación en ese proceso.

`block: true` es terminal. `block: false` se trata como ausencia de decisión. Los fallos de
controladores bloquean la instalación con fallo cerrado.

## Ciclo de vida del Gateway

Usa `gateway_start` para servicios de plugins que necesitan estado propiedad del Gateway. El
contexto expone `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para
inspección y actualizaciones de cron. Usa `gateway_stop` para limpiar recursos
de larga duración.

No dependas del gancho interno `gateway:startup` para servicios de runtime
propiedad de plugins.

`cron_changed` se dispara para eventos de ciclo de vida de cron propiedad del Gateway con una carga útil
de evento tipada que cubre las razones `added`, `updated`, `removed`, `started`, `finished`
y `scheduled`. El evento lleva una instantánea `PluginHookGatewayCronJob`
(incluidos `state.nextRunAtMs`, `state.lastRunStatus` y
`state.lastError` cuando está presente) además de un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Los eventos eliminados
siguen llevando la instantánea del trabajo eliminado para que los programadores externos puedan conciliar
el estado. Usa `ctx.getCron?.()` y `ctx.config` desde el contexto del runtime cuando
sincronices programadores externos de activación, y mantén a OpenClaw como la fuente de verdad
para comprobaciones de vencimiento y ejecución.

## Próximas obsolescencias

Algunas superficies adyacentes a ganchos están obsoletas, pero todavía se admiten. Migra
antes de la próxima versión mayor:

- **Sobres de canal en texto sin formato** en controladores `inbound_claim` y `message_received`.
  Lee `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar texto plano de sobre. Consulta
  [Sobres de canal en texto sin formato → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidad. Los plugins nuevos deben usar
  `before_model_resolve` y `before_prompt_build` en lugar de la fase
  combinada.
- **`subagent_spawning`** permanece por compatibilidad con plugins antiguos, pero
  los plugins nuevos no deben devolver enrutamiento de hilos desde él. El núcleo prepara
  enlaces de subagentes `thread: true` mediante adaptadores de vinculación de sesiones de canal
  antes de que se dispare `subagent_spawned`.
- **`deactivate`** permanece como alias de compatibilidad de limpieza obsoleto hasta
  después del 2026-08-16. Los plugins nuevos deben usar `gateway_stop`.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de un `string` de forma libre.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** permanecen
  como alias de compatibilidad de nivel superior. Los plugins nuevos deben usar
  `api.session.state.registerSessionExtension(...)` y
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Para la lista completa - registro de capacidad de memoria, perfil de razonamiento del proveedor,
proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores de runtime
de tareas y el cambio de nombre `command-auth` → `command-status` - consulta
[Migración del SDK de Plugin → Obsolescencias activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración del SDK de Plugin](/es/plugins/sdk-migration) - obsolescencias activas y calendario de eliminación
- [Crear plugins](/es/plugins/building-plugins)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Puntos de entrada de Plugin](/es/plugins/sdk-entrypoints)
- [Ganchos internos](/es/automation/hooks)
- [Aspectos internos de la arquitectura de Plugin](/es/plugins/architecture-internals)
