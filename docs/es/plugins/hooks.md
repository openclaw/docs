---
read_when:
    - Está creando un plugin que necesita `before_tool_call`, `before_agent_reply`, hooks de mensajes o hooks del ciclo de vida.
    - Necesita bloquear, reescribir o exigir aprobación para las llamadas a herramientas desde un plugin
    - Estás decidiendo entre hooks internos y hooks de Plugin
    - Estás proyectando las activaciones de Cron de OpenClaw en un programador externo del host
summary: 'Hooks de Plugin: intercepta eventos del ciclo de vida del agente, las herramientas, los mensajes, las sesiones y el Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-07-12T14:43:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Los hooks de Plugin son puntos de extensión en proceso para los plugins de OpenClaw: permiten inspeccionar o
cambiar ejecuciones de agentes, llamadas a herramientas, el flujo de mensajes, el ciclo de vida de las sesiones, el
enrutamiento de subagentes, las instalaciones o el inicio del Gateway.

Use en su lugar [hooks internos](/es/automation/hooks) para un pequeño script
`HOOK.md` instalado por el operador que reaccione a eventos de comandos y del Gateway, como `/new`,
`/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Inicio rápido

Registre hooks tipados con `api.on(...)` desde el punto de entrada del plugin:

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
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Los controladores que pueden devolver decisiones o modificaciones se ejecutan secuencialmente en
orden descendente de `priority`; los controladores con la misma prioridad mantienen el orden de registro.
Los controladores de solo observación se ejecutan en paralelo, y los envíos de observación
sin espera pueden solaparse con eventos posteriores. No use la prioridad para ordenar
los efectos secundarios de observación.

`api.on(name, handler, opts?)` acepta:

| Opción      | Efecto                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Orden de ejecución; los valores más altos se ejecutan primero.                                                                                                                                    |
| `timeoutMs` | Tiempo máximo de espera por hook. Cuando vence, OpenClaw deja de esperar a ese controlador y continúa. No cancela el controlador ni sus efectos secundarios. Omítalo para usar el tiempo de espera predeterminado por hook del ejecutor. |

Los operadores pueden establecer límites de tiempo para los hooks sin modificar el código del plugin:

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

`hooks.timeouts.<hookName>` reemplaza a `hooks.timeoutMs`, que a su vez reemplaza el valor
`api.on(..., { timeoutMs })` definido por el autor del plugin. Cada valor debe ser un
entero positivo de hasta 600000 ms. Prefiera reemplazos por hook para los
hooks que se sabe que son lentos, de modo que un plugin no reciba un límite mayor en todas partes.

La promesa de un controlador cuyo tiempo de espera haya vencido continúa ejecutándose porque las devoluciones de llamada de los hooks no
reciben una señal de cancelación. El envío del hook puede liberar su admisión del Gateway
mientras el trabajo de ese plugin sigue en curso. Los plugins que gestionen
trabajos de larga duración deben proporcionar su propio ciclo de vida de cancelación y apagado.

Los hooks de modificación saliente `message_sending` y `reply_payload_sending` usan un
valor predeterminado de 15 segundos por controlador. Si uno agota el tiempo de espera, OpenClaw registra el error del plugin
y continúa con la carga útil más reciente para que el canal de entrega serializado pueda
completar su procesamiento. Establezca un límite mayor por hook para los plugins que realicen intencionadamente trabajos más lentos
antes de la entrega.

Los plugins de canal que usan `createReplyDispatcher` también pueden declarar un límite positivo mayor
por etapa mediante `beforeDeliverOptions: { timeoutMs }`, o al
añadir trabajo con `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Sin un límite declarado por el propietario, esas devoluciones de llamada usan el mismo valor predeterminado
de 15 segundos, de modo que una devolución de llamada bloqueada no pueda retener el canal de entrega serializado.

Cada hook recibe `event.context.pluginConfig`, la configuración resuelta para el
plugin que registró ese controlador. OpenClaw la inyecta en cada controlador sin
modificar el objeto de evento compartido que ven los demás plugins.

## Catálogo de hooks

Los hooks se agrupan según la superficie que amplían. Los nombres en **negrita** aceptan un resultado
de decisión (bloquear, cancelar, reemplazar o exigir aprobación); el resto es
solo de observación.

**Turno del agente**

| Hook                            | Propósito                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Reemplazar el proveedor o modelo antes de cargar los mensajes de la sesión               |
| `agent_turn_prepare`            | Consumir las inserciones de turno en cola del plugin y añadir contexto al mismo turno antes de los hooks del prompt |
| `before_prompt_build`           | Añadir contexto dinámico o texto del prompt del sistema antes de la llamada al modelo    |
| `before_agent_start`            | Fase combinada solo por compatibilidad; prefiera los dos hooks anteriores                 |
| **`before_agent_run`**          | Inspeccionar el prompt final y los mensajes de la sesión antes de enviarlos al modelo; puede bloquear la ejecución |
| **`before_agent_reply`**        | Omitir el turno del modelo con una respuesta sintética o silencio                        |
| **`before_agent_finalize`**     | Inspeccionar la respuesta final natural y solicitar una pasada más del modelo            |
| `agent_end`                     | Observar los mensajes finales, el estado de éxito y la duración de la ejecución          |
| `heartbeat_prompt_contribution` | Añadir contexto exclusivo de Heartbeat para plugins de supervisión en segundo plano y ciclo de vida |

**Observación de conversaciones**

| Hook                                      | Propósito                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `model_call_started` / `model_call_ended` | Metadatos saneados de llamadas al proveedor/modelo: tiempos, resultado y hashes acotados de identificadores de solicitud. Sin contenido del prompt ni de la respuesta. |
| `llm_input`                               | Entrada del proveedor: prompt del sistema, prompt e historial                                                        |
| `llm_output`                              | Salida del proveedor, uso y el `contextTokenBudget` resuelto cuando esté disponible                                  |

**Herramientas**

| Hook                       | Propósito                                                        |
| -------------------------- | ---------------------------------------------------------------- |
| **`before_tool_call`**     | Reescribir los parámetros de la herramienta, bloquear la ejecución o exigir aprobación |
| `after_tool_call`          | Observar los resultados, los errores y la duración de la herramienta |
| `resolve_exec_env`         | Aportar variables de entorno propiedad del plugin a `exec`       |
| **`tool_result_persist`**  | Reescribir el mensaje del asistente generado a partir del resultado de una herramienta |
| **`before_message_write`** | Inspeccionar o bloquear la escritura de un mensaje en curso (poco frecuente) |

**Mensajes y entrega**

| Hook                            | Propósito                                                           |
| ------------------------------- | ------------------------------------------------------------------- |
| **`inbound_claim`**             | Reclamar un mensaje entrante antes del enrutamiento al agente (respuestas sintéticas) |
| **`channel_pairing_requested`** | Observar solicitudes de emparejamiento de mensajes directos recién creadas |
| `message_received`              | Observar el contenido entrante, el remitente, el hilo y los metadatos |
| **`message_sending`**           | Reescribir el contenido saliente o cancelar la entrega              |
| **`reply_payload_sending`**     | Modificar o cancelar cargas útiles de respuesta normalizadas antes de la entrega |
| `message_sent`                  | Observar el éxito o el fallo de la entrega saliente                 |
| **`before_dispatch`**           | Inspeccionar o reescribir un envío saliente antes de transferirlo al canal |
| **`reply_dispatch`**            | Participar en la canalización final de envío de respuestas          |

**Sesiones y Compaction**

| Hook                                     | Propósito                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `session_start` / `session_end`          | Seguir los límites del ciclo de vida de la sesión. `reason` es uno de `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` o `unknown`. `shutdown`/`restart` se activan desde el finalizador de apagado del Gateway cuando el proceso se detiene o se reinicia con sesiones activas, de modo que los plugins (memoria, almacenes de transcripciones) puedan finalizar las filas huérfanas en lugar de dejarlas abiertas entre reinicios. El finalizador tiene un tiempo acotado para que un plugin lento no pueda bloquear SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Observar o anotar ciclos de Compaction                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `before_reset`                           | Observar eventos de restablecimiento de sesión (`/reset`, restablecimientos mediante programación)                                                                                                                                                                                                                                                                                                                                                                  |

**Subagentes**

- `subagent_spawned` / `subagent_ended`: observan el inicio y la finalización de subagentes.
- `subagent_delivery_target`: hook de compatibilidad para la entrega de finalización cuando ningún enlace de sesión del núcleo puede proyectar una ruta.
- `subagent_spawning`: hook de compatibilidad obsoleto. El núcleo ahora prepara los enlaces de subagentes con `thread: true` mediante adaptadores de enlace de sesiones de canal antes de que se active `subagent_spawned`.
- `subagent_spawned` incluye `resolvedModel` y `resolvedProvider` cuando OpenClaw ha resuelto el modelo nativo de la sesión secundaria antes del inicio.
- `subagent_ended` contiene `targetSessionKey` (identidad: coincide con `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` o `"acp"`), `reason`, el valor opcional `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` o `"deleted"`), el valor opcional `error`, `runId`, `endedAt`, `accountId` y `sendFarewell`. **No** incluye `agentId` ni `childSessionKey`; use `targetSessionKey` para correlacionarlo con el evento `subagent_spawned` correspondiente.

**Ciclo de vida**

| Hook                             | Propósito                                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Iniciar o detener servicios propiedad del plugin junto con el Gateway                                                            |
| `deactivate`                     | Alias de compatibilidad obsoleto de `gateway_stop`; use `gateway_stop` en los plugins nuevos                                      |
| `cron_reconciled`                | Conciliar con el estado completo de Cron del Gateway después del inicio o la recarga                                              |
| `cron_changed`                   | Observar cambios del ciclo de vida de Cron gestionado por el Gateway (añadido, actualizado, eliminado, iniciado, finalizado, programado) |
| **`before_install`**             | Inspeccionar el material preparado para instalar Skills o plugins desde un entorno de ejecución de plugin cargado                 |

### Solicitudes de vinculación de canales

Use `channel_pairing_requested` cuando un plugin necesite notificar a un operador o
escribir un registro de auditoría después de que el remitente de un MD no vinculado cree una solicitud
de vinculación pendiente. El Hook se ejecuta cuando se crea la solicitud; la entrega por el canal de
la respuesta de vinculación no se retrasa por controladores de Hooks lentos o con errores.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Nueva solicitud de vinculación de ${event.channel} de ${event.senderId}: ${event.code}`,
  });
});
```

El Hook es exclusivamente de observación. No aprueba, rechaza, suprime ni reescribe
la respuesta de vinculación. La carga útil incluye el canal, el `accountId` opcional,
el `senderId` con ámbito de canal, el `code` de vinculación y los metadatos del canal. Trate el
código de vinculación como una credencial de aprobación activa de un solo uso y entréguelo únicamente a un
destino de operador de confianza. Trate `metadata` como texto de identidad no confiable
proporcionado por el remitente. El Hook no incluye el cuerpo ni los archivos multimedia del mensaje entrante.

## Hooks de depuración del entorno de ejecución

Use `before_model_resolve` para cambiar de proveedor o modelo en un turno del agente; se
ejecuta antes de resolver el modelo. `llm_output` solo se ejecuta después de que un intento del modelo
produce una salida del asistente.

Para comprobar el modelo efectivo de la sesión, inspeccione los registros del entorno de ejecución y luego
use `openclaw sessions` o las superficies de sesión/estado del Gateway. Para depurar
las cargas útiles del proveedor, inicie el Gateway con `--raw-stream` y
`--raw-stream-path <path>` para escribir los eventos sin procesar del flujo del modelo en un archivo jsonl.

## Política de llamadas a herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.toolKind` y `event.toolInputKind` opcionales, discriminadores
  autoritativos del host para herramientas que comparten nombres intencionadamente; por ejemplo, las
  llamadas externas a `exec` en modo de código usan `toolKind: "code_mode_exec"` e incluyen
  `toolInputKind: "javascript" | "typescript"` cuando se conoce el lenguaje de entrada
- `event.derivedPaths` opcional, indicios de rutas de destino derivados por el host según su mejor criterio
  para formatos de herramientas conocidos, como `apply_patch`; estas rutas pueden estar
  incompletas o ser una aproximación excesiva de lo que la herramienta realmente modificará (por
  ejemplo, con entradas mal formadas o parciales)
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` y el valor de diagnóstico `ctx.trace`

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
    /** @deprecated Las aprobaciones sin resolver siempre deniegan. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Comportamiento de protección para los Hooks de ciclo de vida tipados:

- `block: true` es definitivo y omite los controladores de menor prioridad.
- `block: false` se trata como la ausencia de una decisión.
- `params` reescribe los parámetros de la herramienta para su ejecución.
- `requireApproval` pausa la ejecución del agente y solicita al usuario una decisión mediante las
  aprobaciones del plugin. `/approve` puede aprobar tanto las ejecuciones como las aprobaciones del plugin. En las
  retransmisiones nativas `PreToolUse` del modo de informe del servidor de aplicaciones de Codex, esto delega en la
  solicitud de aprobación correspondiente del servidor de aplicaciones; consulte
  [entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime#hook-boundaries).
- Un `block: true` de menor prioridad todavía puede bloquear después de que un Hook de mayor prioridad
  haya solicitado aprobación.
- `onResolution` recibe la decisión resuelta: `allow-once`, `allow-always`,
  `deny`, `timeout` o `cancelled`.

Consulte [Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests) para conocer
el enrutamiento de aprobaciones, el comportamiento de las decisiones y cuándo usar `requireApproval` en lugar
de herramientas opcionales o aprobaciones de ejecución.

Los plugins que necesiten políticas a nivel del host pueden registrar políticas de herramientas de confianza mediante
`api.registerTrustedToolPolicy(...)`. Estas se ejecutan antes que los Hooks ordinarios de
`before_tool_call` y antes que las decisiones normales de los Hooks. Las políticas de confianza
integradas se ejecutan primero; las políticas de confianza de plugins instalados se ejecutan después, en el orden de carga de
los plugins; los Hooks ordinarios de `before_tool_call` se ejecutan a continuación. Los plugins integrados conservan
la ruta existente de políticas de confianza. Los plugins instalados deben habilitarse explícitamente
y declarar cada id de política en `contracts.trustedToolPolicies`; los ids no declarados
se rechazan antes del registro. Los ids de políticas tienen el ámbito del plugin que los registra,
por lo que diferentes plugins pueden reutilizar el mismo id local. Use este nivel únicamente
para controles de confianza del host, como políticas del espacio de trabajo, aplicación de presupuestos o
seguridad de flujos de trabajo reservados.

### Hook del entorno de ejecución

`resolve_exec_env` permite que los plugins aporten variables de entorno a las invocaciones de la
herramienta `exec` antes de ejecutar el comando. Recibe:

- `event.sessionKey`
- `event.toolName`, actualmente siempre `"exec"`
- `event.host`, uno de `"gateway"`, `"sandbox"` o `"node"`
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` y `ctx.channelId`

Devuelva un `Record<string, string>` para combinarlo con el entorno de ejecución. Los controladores
se ejecutan en orden de prioridad; los resultados posteriores anulan los anteriores para la misma
clave.

La salida del Hook se filtra mediante la política de claves del entorno de ejecución del host antes de
combinarla. `PATH` siempre se descarta (la resolución de comandos y las comprobaciones de binarios seguros
dependen de ella). Se descartan las claves no válidas y las claves peligrosas que anulan valores del host, como `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, las variables de proxy (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) y las variables que anulan TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` y similares). El entorno filtrado del plugin se incluye
en los metadatos de aprobación/auditoría del Gateway y se reenvía a las solicitudes de ejecución
del host Node.

### Persistencia de resultados de herramientas

Los resultados de las herramientas pueden incluir `details` estructurados para la representación en la interfaz de usuario, los diagnósticos,
el enrutamiento de archivos multimedia o los metadatos propiedad del plugin. Trate `details` como metadatos del entorno de ejecución,
no como contenido del prompt:

- OpenClaw elimina `toolResult.details` antes de la reproducción del proveedor y de la entrada de
  Compaction para que los metadatos no formen parte del contexto del modelo.
- Las entradas de sesión persistidas solo conservan `details` con tamaño limitado. Los detalles demasiado grandes se
  sustituyen por un resumen compacto y `persistedDetailsTruncated: true`.
- `tool_result_persist` y `before_message_write` se ejecutan antes del límite final de
  persistencia. Mantenga pequeños los `details` devueltos y evite colocar texto
  relevante para el prompt únicamente en `details`; coloque la salida de la herramienta visible para el modelo en
  `content`.

## Hooks de prompt y modelo

Use los Hooks específicos de cada fase para los plugins nuevos:

- `before_model_resolve`: recibe únicamente el prompt actual y los metadatos de los
  archivos adjuntos. Devuelva `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: recibe el prompt actual, los mensajes preparados de la sesión
  y cualquier inyección en cola de ejecución exactamente una vez extraída para esta sesión.
  Devuelva `prependContext` o `appendContext`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de la sesión.
  Devuelva `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: se ejecuta únicamente en turnos de Heartbeat y devuelve
  `prependContext` o `appendContext`. Está pensado para monitores en segundo plano que
  necesitan resumir el estado actual sin modificar los turnos iniciados por el usuario.

`before_agent_start` se conserva por compatibilidad. Prefiera los Hooks explícitos
anteriores para que el plugin no dependa de una fase combinada heredada.

`before_agent_run` se ejecuta después de construir el prompt y antes de cualquier entrada del modelo,
incluida la carga de imágenes locales del prompt y la observación de `llm_input`. Recibe
la entrada actual del usuario como `prompt`, además del historial de sesión cargado en `messages`
y el prompt del sistema activo. Devuelva `{ outcome: "block", reason, message? }`
para detener la ejecución antes de que el modelo lea el prompt. `reason` es interno;
`message` es el reemplazo destinado al usuario. Solo se admiten los resultados `pass` y `block`;
las formas de decisión no compatibles provocan un cierre con denegación.

Cuando se bloquea una ejecución, OpenClaw almacena únicamente el texto de reemplazo en
`message.content`, además de metadatos no confidenciales del bloqueo, como el id del
plugin que bloquea y la marca de tiempo. El texto original del usuario no se conserva en la transcripción
ni en el contexto futuro. Los motivos internos del bloqueo se consideran confidenciales y
se excluyen de las cargas útiles de transcripción, historial, difusión, registro y diagnóstico.
La observabilidad debe usar campos depurados, como el id del bloqueador, el resultado,
la marca de tiempo o una categoría segura.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa; el mismo valor también está disponible en `ctx.runId`. Las ejecuciones
iniciadas por Cron también exponen `ctx.jobId` (el id del trabajo de Cron de origen) en el contexto del
turno del agente para que los Hooks puedan limitar métricas, efectos secundarios o estados a un trabajo
programado específico. `ctx.jobId` no forma parte del contexto de herramienta de `before_tool_call`.

Para las ejecuciones originadas en un canal, `ctx.channel` y `ctx.messageProvider` identifican
la superficie del proveedor, como `discord` o `telegram`, mientras que `ctx.channelId` es
el identificador de destino de la conversación cuando OpenClaw puede derivarlo de la
clave de sesión o de los metadatos de entrega.

Cuando la identidad del remitente está disponible, los contextos de los Hooks del agente también incluyen:

- `ctx.senderId`: ID del remitente con ámbito de canal (por ejemplo, `open_id` de Feishu, ID de
  usuario de Discord). Se rellena cuando la ejecución se origina en un mensaje de usuario cuyos
  metadatos del remitente se conocen.
- `ctx.chatId`: identificador de conversación nativo del transporte (por ejemplo, `chat_id`
  de Feishu, `chat_id` de Telegram). Se rellena cuando el canal de origen
  proporciona un ID de conversación nativo.
- `ctx.channelContext.sender.id`: el mismo ID del remitente que `ctx.senderId`, dentro
  de un objeto propiedad del canal que los plugins pueden ampliar con campos específicos del canal.
- `ctx.channelContext.chat.id`: el mismo ID de conversación que `ctx.chatId`,
  dentro de un objeto propiedad del canal que los plugins pueden ampliar con campos específicos
  del canal.

El núcleo solo define los campos `id` anidados. Los plugins de canales que transmitan metadatos
más completos del remitente o del chat mediante el asistente de entrada pueden ampliar
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

Los plugins de canales transmiten esos campos mediante el asistente del SDK de entrada:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Estos campos son opcionales y no están presentes en las ejecuciones originadas por el sistema (Heartbeat,
Cron, evento de ejecución).

`ctx.senderExternalId` se conserva como campo obsoleto de compatibilidad con el código fuente para
plugins anteriores. El núcleo no lo rellena; las nuevas identidades del remitente específicas
del canal deben residir en `ctx.channelContext.sender` mediante la ampliación
del módulo.

`agent_end` es un hook de observación. Las rutas del Gateway y del arnés persistente lo ejecutan
sin esperar su finalización después del turno, mientras que las rutas efímeras de ejecución única de la CLI esperan
la promesa del hook antes de limpiar el proceso, para que los plugins de confianza puedan vaciar
la observabilidad del terminal o capturar el estado. El ejecutor de hooks aplica un tiempo de espera de 30 segundos
para que un plugin bloqueado o un endpoint de integración no puedan dejar la promesa del hook
pendiente indefinidamente. Se registra el tiempo de espera y OpenClaw continúa; no
cancela el trabajo de red propiedad del plugin, salvo que este también utilice su propia señal
de cancelación.

Use `model_call_started` y `model_call_ended` para la telemetría de llamadas al proveedor
que no deba recibir prompts sin procesar, historial, respuestas, encabezados, cuerpos de
solicitud ni identificadores de solicitud del proveedor. Estos hooks incluyen metadatos estables como
`runId`, `callId`, `provider`, `model`, los valores opcionales `api`/`transport`, los valores terminales
`durationMs`/`outcome` y `upstreamRequestIdHash` cuando OpenClaw puede derivar un
hash acotado del identificador de solicitud del proveedor. Cuando el entorno de ejecución ha resuelto
los metadatos de la ventana de contexto, el evento y el contexto del hook también incluyen
`contextTokenBudget`, el presupuesto efectivo de tokens después de los límites del modelo, la configuración y el agente,
además de `contextWindowSource` y `contextWindowReferenceTokens` cuando se
aplicó un límite inferior.

`before_agent_finalize` solo se ejecuta cuando un arnés está a punto de aceptar una respuesta
final natural del asistente. No es la ruta de cancelación `/stop` y no se
ejecuta cuando el usuario interrumpe un turno. Devuelva `{ action: "revise", reason }` para pedir
al arnés una pasada adicional del modelo antes de la finalización, `{ action:
"finalize", reason? }` para forzar la finalización, u omita el resultado para continuar.
Los controladores tienen un presupuesto predeterminado de 15s; si se agota el tiempo de espera, OpenClaw registra el fallo y
continúa con la respuesta final original.
Los hooks nativos `Stop` de Codex se retransmiten a este hook como decisiones
`before_agent_finalize` de OpenClaw.

Al devolver `action: "revise"`, los plugins pueden incluir metadatos `retry` para
que la pasada adicional del modelo sea acotada y segura frente a repeticiones:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` se añade al motivo de revisión enviado al arnés.
`idempotencyKey` permite al host contar los reintentos de la misma solicitud del plugin
entre decisiones de finalización equivalentes, y `maxAttempts` limita cuántas pasadas
adicionales permitirá el host antes de continuar con la respuesta final natural.

Los plugins no incluidos que necesiten hooks de conversación sin procesar (`before_model_resolve`,
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

Los hooks que modifican prompts y las inyecciones persistentes para el siguiente turno pueden deshabilitarse por
plugin con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensiones de sesión e inyecciones para el siguiente turno

Los plugins de flujo de trabajo pueden conservar un estado de sesión pequeño y compatible con JSON mediante
`api.session.state.registerSessionExtension(...)` y actualizarlo a través del
método `sessions.pluginPatch` del Gateway. Las filas de sesión proyectan el estado de las
extensiones registradas mediante `pluginExtensions`, lo que permite que Control UI y otros
clientes representen el estado propiedad del plugin sin conocer sus detalles internos.
`api.registerSessionExtension(...)` sigue funcionando, pero está obsoleto en favor del
espacio de nombres `api.session.state`.

Use `api.session.workflow.enqueueNextTurnInjection(...)` cuando un plugin necesite
que un contexto persistente llegue exactamente una vez al siguiente turno del modelo (el alias de nivel superior
`api.enqueueNextTurnInjection(...)` está obsoleto y tiene el mismo
comportamiento). OpenClaw extrae las inyecciones en cola antes de los hooks de prompts, descarta
las inyecciones caducadas y elimina duplicados por `idempotencyKey` para cada plugin. Esta es
la interfaz adecuada para reanudaciones de aprobaciones, resúmenes de políticas, cambios de monitores
en segundo plano y continuaciones de comandos que deban ser visibles para el modelo en el
siguiente turno, pero que no deban convertirse en texto permanente del prompt del sistema.

La semántica de limpieza forma parte del contrato. Las devoluciones de llamada de limpieza de extensiones de sesión y
del ciclo de vida del entorno de ejecución reciben `reset`, `delete`, `disable` o
`restart`. El host elimina el estado persistente de las extensiones de sesión del plugin propietario
y las inyecciones pendientes para el siguiente turno en caso de restablecimiento, eliminación o deshabilitación; el reinicio
conserva el estado persistente de la sesión, mientras que las devoluciones de llamada de limpieza permiten que los plugins liberen
tareas del programador, contexto de ejecución y otros recursos fuera de banda de la
generación anterior del entorno de ejecución.

## Hooks de mensajes

Use hooks de mensajes para el enrutamiento y la política de entrega a nivel de canal:

- `message_received`: observa el contenido entrante, el remitente, `threadId`,
  `messageId`, `senderId`, la correlación opcional de ejecución/sesión y los metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `reply_payload_sending`: reescribe objetos `ReplyPayload` normalizados
  (incluidos `presentation`, `delivery`, las referencias multimedia y el texto) o devuelve
  `{ cancel: true }`.
- `message_sent`: observa el éxito o el fallo final.

En las respuestas TTS que solo contienen audio, `content` puede contener la transcripción hablada
oculta incluso cuando la carga útil del canal no tiene texto ni subtítulo visibles.
Reescribir ese `content` solo actualiza la transcripción visible para el hook; no se
representa como subtítulo multimedia.

Los eventos `reply_payload_sending` pueden incluir `usageState`, una instantánea en vivo
de mejor esfuerzo por turno del modelo, el uso y el contexto. La entrega persistente, la repetición recuperada y
las respuestas sin una correlación exacta con la ejecución lo omiten.

Los contextos de los hooks de mensajes exponen campos de correlación estables cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Los contextos entrantes
y de `before_dispatch` también exponen metadatos de respuesta cuando el canal
dispone de datos filtrados por visibilidad del mensaje citado: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` y `replyToIsQuote`. Prefiera estos
campos de primera clase antes de leer metadatos heredados.

Prefiera los campos tipados `threadId` y `replyToId` antes de utilizar metadatos
específicos del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se considera que no toma ninguna decisión.
- El `content` reescrito continúa hacia los hooks de menor prioridad, salvo que un hook posterior
  cancele la entrega.
- `reply_payload_sending` se ejecuta después de normalizar la carga útil y antes de la entrega
  al canal, incluidas las respuestas reenviadas al canal de origen.
  Los controladores se ejecutan secuencialmente y cada controlador ve la carga útil más reciente producida
  por los controladores de mayor prioridad.
- Las cargas útiles de `reply_payload_sending` no exponen marcadores de confianza del entorno de ejecución como
  `trustedLocalMedia`; los plugins pueden modificar la estructura de la carga útil, pero no pueden conceder confianza
  al contenido multimedia local.
- `message_sending` puede devolver `cancelReason` y `metadata` acotados junto con una
  cancelación. Las nuevas API del ciclo de vida de los mensajes exponen esto como un resultado de
  entrega suprimida con el motivo `cancelled_by_message_sending_hook`; la entrega
  directa heredada sigue devolviendo una matriz de resultados vacía por compatibilidad.
- `message_sent` es solo de observación. Los fallos de los controladores se registran y no
  cambian el resultado de la entrega.

## Hooks de instalación

Use `security.installPolicy` para las decisiones de permitir o bloquear que corresponden al operador. Esa
política se ejecuta desde la configuración de OpenClaw, abarca las rutas de instalación y actualización de la CLI y
aplica un bloqueo preventivo cuando está habilitada pero no está disponible.

`before_install` es un hook del ciclo de vida del entorno de ejecución de plugins. Se ejecuta después de
`security.installPolicy` únicamente en el proceso de OpenClaw donde los hooks de plugins ya
se han cargado, como en los flujos de instalación respaldados por el Gateway. Resulta útil para
observaciones, advertencias y comprobaciones de compatibilidad que corresponden al plugin, pero no es
el límite principal de seguridad empresarial o del host para las instalaciones. El campo
`builtinScan` permanece en la carga útil del evento por compatibilidad, pero
OpenClaw ya no ejecuta el bloqueo integrado de código peligroso durante la instalación, por lo que
es un resultado `ok` vacío. Devuelva hallazgos adicionales o
`{ block: true, blockReason }` para detener la instalación en ese proceso.

`block: true` es terminal. `block: false` se considera que no toma ninguna decisión. Los fallos de los
controladores bloquean la instalación de forma preventiva.

## Ciclo de vida del Gateway

Use `gateway_start` para iniciar servicios generales de plugins y `gateway_stop` para
limpiar recursos de larga duración. El programador de Cron aún puede estar cargándose cuando
se ejecuta `gateway_start`, por lo que no debe utilizarlo como señal de referencia para una proyección
externa de Cron.

No dependa del hook interno `gateway:startup` para los servicios del entorno de ejecución
propiedad del plugin.

`cron_reconciled` se activa después de que el programador de Cron del Gateway y sus observadores de salida
hayan conciliado su estado persistente. Se activa tanto durante el inicio
inicial como al sustituir el programador durante una recarga de configuración. El evento informa
del `reason` (`startup` o `reload`) y del estado efectivo `enabled`. Un Cron
deshabilitado también emite el evento con `enabled: false`, lo que permite que una proyección externa
elimine activaciones obsoletas. Use `ctx.getCron?.()` para obtener la instancia exacta del programador que
completó la conciliación; una recarga posterior no redirige esa devolución de llamada.
`ctx.abortSignal` pertenece a esa misma instantánea del programador. El Gateway la cancela en cuanto
se prepara un programador más reciente o comienza el apagado. Propáguela a todos
los efectos secundarios persistentes y no acepte la instantánea después de su cancelación.
Esta es una señal del ciclo de vida del programador, no una señal de activación de plugins: una
recarga en caliente exclusiva del plugin no la vuelve a emitir. Un consumidor recién habilitado recibe
su primera referencia en la siguiente sustitución del programador o inicio del Gateway.

Al igual que con otros hooks de observación, las devoluciones de llamada de `gateway_start` y `cron_reconciled`
pueden solaparse. Si ambos controladores comparten la inicialización del plugin, coordínelos
mediante una promesa de disponibilidad local del plugin en lugar de depender del orden de las devoluciones de llamada.

`cron_changed` se activa para los eventos del ciclo de vida de Cron propiedad del Gateway con una carga útil
de evento tipada que abarca los motivos `added`, `updated`, `removed`, `started`, `finished`
y `scheduled`. El evento transporta una instantánea `PluginHookGatewayCronJob`
(incluidos `state.nextRunAtMs`, `state.lastRunStatus` y
`state.lastError` cuando están presentes), además de un `PluginHookGatewayCronDeliveryStatus`
con valor `not-requested` | `delivered` | `not-delivered` | `unknown`. Los eventos de eliminación
son posteriores a la confirmación: solo se activan después de que la eliminación persistente se complete correctamente y siguen incluyendo
la instantánea de la tarea eliminada para que los programadores externos puedan conciliar el estado.

Un evento `scheduled` es posterior a la confirmación: solo se activa después de que una escritura persistente
correcta cambie el valor efectivo `nextRunAtMs` de una tarea existente, sin incluir el evento explícito
`added`, `updated` o `removed` del ciclo de vida de esa tarea. El valor de nivel superior
`event.nextRunAtMs` es la siguiente activación confirmada; cuando está ausente, la tarea no tiene
una siguiente activación. Trate estos eventos como indicios de conciliación, no como un registro ordenado
de cambios. Úselos como indicios combinables para volver a leer el último programador capturado por
`cron_reconciled`; no adopte el programador de un contexto `cron_changed`.
Mantenga OpenClaw como fuente de verdad para las comprobaciones de vencimiento y la ejecución.

### Proyección externa segura de Cron

Proyecte una instantánea completa de activaciones en lugar de reenviar los cambios de eventos de Cron. La
operación `replaceAll` del adaptador externo debe ser atómica e idempotente, y debe
resolverse únicamente después de que el host haya aceptado la instantánea de forma persistente. También debe
respetar la señal de cancelación proporcionada: si la señal se cancela antes de la aceptación
persistente, el adaptador no debe aceptar esa instantánea.

Este patrón mantiene en ejecución un único trabajador con el estado más reciente. Solo `cron_reconciled`
adopta una instancia del programador; `cron_changed` únicamente solicita a ese trabajador que vuelva a leer
la instancia autoritativa, por lo que un indicio tardío no puede restaurar un programador anterior.
Una revisión más reciente cancela el intento activo del host antes de que pueda aceptar una instantánea
obsoleta.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Cuando `cron_reconciled` informa `enabled: false`, la misma ruta llama a
`replaceAll([])` y elimina las activaciones externas obsoletas. En este ejemplo,
los reintentos y el retroceso son locales al proceso y tratan los fallos del
adaptador en tiempo de ejecución como transitorios; valide la configuración no
reintentable antes del registro. OpenClaw no proporciona un buzón de salida para
los efectos de los hooks de plugins. Si el proceso finaliza antes de la aceptación
duradera, el siguiente inicio del Gateway emite una nueva instantánea autoritativa
de `cron_reconciled`. `gateway_stop` cancela el trabajo en curso del host, espera
a que el worker termine y, a continuación, cierra el adaptador.

## Próximas obsolescencias

Algunas superficies relacionadas con hooks están obsoletas, pero siguen siendo
compatibles. Migre antes de la próxima versión principal:

- **Sobres de canal en texto sin formato** en los controladores `inbound_claim`
  y `message_received`. Lea `BodyForAgent` y los bloques estructurados de
  contexto de usuario en lugar de analizar el texto plano del sobre. Consulte
  [Sobres de canal en texto sin formato → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** se mantiene por compatibilidad. Los plugins nuevos
  deben usar `before_model_resolve` y `before_prompt_build` en lugar de la fase
  combinada.
- **`subagent_spawning`** se mantiene por compatibilidad con plugins anteriores,
  pero los plugins nuevos no deben devolver desde él el enrutamiento de hilos.
  El núcleo prepara los enlaces de subagentes `thread: true` mediante adaptadores
  de enlace de sesiones de canal antes de que se active `subagent_spawned`.
- **`deactivate`** se mantiene como alias obsoleto de compatibilidad para la
  limpieza hasta después de 2026-08-16. Los plugins nuevos deben usar
  `gateway_stop`.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de un `string` de formato libre.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** se
  mantienen como alias de compatibilidad de nivel superior. Los plugins nuevos
  deben usar `api.session.state.registerSessionExtension(...)` y
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Para consultar la lista completa —registro de capacidades de memoria, perfil de
razonamiento del proveedor, proveedores de autenticación externos, tipos de
descubrimiento de proveedores, accesores del entorno de ejecución de tareas y
el cambio de nombre de `command-auth` → `command-status`—, consulte
[Migración del SDK de Plugin → Obsolescencias activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración del SDK de Plugin](/es/plugins/sdk-migration) - obsolescencias activas y calendario de eliminación
- [Creación de plugins](/es/plugins/building-plugins)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Aspectos internos de la arquitectura de plugins](/es/plugins/architecture-internals)
