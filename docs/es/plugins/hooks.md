---
read_when:
    - Está creando un plugin que necesita `before_tool_call`, `before_agent_reply`, hooks de mensajes o hooks de ciclo de vida
    - Necesita bloquear, reescribir o exigir aprobación para las llamadas a herramientas de un plugin
    - Estás decidiendo entre hooks internos y hooks de Plugin
    - Se están proyectando las activaciones de Cron de OpenClaw en un planificador externo del host
summary: 'Hooks de Plugin: intercepta eventos del ciclo de vida del agente, las herramientas, los mensajes, las sesiones y el Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-07-20T00:52:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330deb9a7dfbf69b8bb5c7e06f61d4d1a0db670abff20328cac5858bc893c326
    source_path: plugins/hooks.md
    workflow: 16
---

Los hooks de Plugin son puntos de extensión en proceso para los plugins de OpenClaw: permiten inspeccionar o
cambiar ejecuciones de agentes, llamadas a herramientas, el flujo de mensajes, el ciclo de vida de las sesiones, el
enrutamiento de subagentes, las instalaciones o el inicio del Gateway.

Use en su lugar los [hooks internos](/es/automation/hooks) para un pequeño script
`HOOK.md` instalado por el operador que reaccione a eventos de comandos y del Gateway, como `/new`,
`/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Inicio rápido

Registre hooks tipados con `api.on(...)` desde el punto de entrada del plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Comprobación previa de herramientas",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Ejecutar búsqueda web",
            description: `Permitir consulta de búsqueda: ${String(event.params.query ?? "")}`,
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

Los manejadores que pueden devolver decisiones o modificaciones se ejecutan secuencialmente en
orden descendente de `priority`; los manejadores con la misma prioridad mantienen el orden de registro.
Los manejadores de solo observación se ejecutan en paralelo, y los envíos de observación
sin espera pueden solaparse con eventos posteriores. No use la prioridad para ordenar
los efectos secundarios de observación.

`api.on(name, handler, opts?)` acepta:

| Opción      | Efecto                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Orden de ejecución; los valores más altos se ejecutan primero.                                                                                                                                                                      |
| `timeoutMs` | Presupuesto de espera por hook. Cuando vence, OpenClaw deja de esperar a ese manejador y continúa. No cancela el manejador ni sus efectos secundarios. Omítalo para usar el tiempo de espera predeterminado por hook del ejecutor. |

Los operadores pueden establecer presupuestos de hooks sin modificar el código del plugin:

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

`hooks.timeouts.<hookName>` prevalece sobre `hooks.timeoutMs`, que a su vez prevalece sobre el valor
`api.on(..., { timeoutMs })` definido por el autor del plugin. Cada valor debe ser un
entero positivo de hasta 600000 ms. Prefiera ajustes específicos por hook para los
hooks que se sabe que son lentos, de modo que un plugin no disponga de un presupuesto mayor en todas partes.

La promesa de un manejador cuyo tiempo de espera ha vencido continúa ejecutándose porque las devoluciones de llamada de los hooks no
reciben una señal de cancelación. El envío del hook puede liberar su admisión del Gateway
mientras el trabajo de ese plugin sigue en curso. Los plugins que controlan
trabajos de larga duración deben proporcionar su propio ciclo de vida de cancelación y cierre.

Los hooks modificadores de salida `message_sending` y `reply_payload_sending` usan un valor
predeterminado de 15 segundos por manejador. Si uno supera el tiempo de espera, OpenClaw registra el error del plugin
y continúa con la carga útil más reciente para que el canal de entrega serializado pueda
completarse. Establezca un presupuesto por hook mayor para los plugins que realizan intencionadamente
trabajos más lentos antes de la entrega.

Los plugins de canal que usan `createReplyDispatcher` también pueden declarar un
presupuesto positivo mayor por etapa con `beforeDeliverOptions: { timeoutMs }`, o al
añadir trabajo con `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Sin un presupuesto declarado por el propietario, esas devoluciones de llamada usan el mismo valor
predeterminado de 15 segundos para que una devolución de llamada bloqueada no pueda retener el canal de entrega serializado.

Cada hook recibe `event.context.pluginConfig`, la configuración resuelta para el
plugin que registró ese manejador. OpenClaw la inyecta por manejador sin
modificar el objeto de evento compartido que ven los demás plugins.

## Catálogo de hooks

Los hooks se agrupan según la superficie que amplían. Los nombres en **negrita** aceptan un resultado de
decisión (bloquear, cancelar, sustituir o requerir aprobación); el resto son
solo de observación.

**Turno del agente**

| Hook                            | Propósito                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Sustituir el proveedor o modelo antes de que se carguen los mensajes de la sesión                                  |
| `agent_turn_prepare`            | Consumir las inserciones de turno en cola del plugin y añadir contexto en el mismo turno antes de los hooks del prompt      |
| `before_prompt_build`           | Añadir contexto dinámico o texto al prompt del sistema antes de la llamada al modelo                          |
| **`before_agent_run`**          | Inspeccionar el prompt final y los mensajes de la sesión antes de enviarlos al modelo; puede bloquear la ejecución |
| **`before_agent_reply`**        | Omitir el turno del modelo con una respuesta sintética o silencio                           |
| **`before_agent_finalize`**     | Inspeccionar la respuesta final natural y solicitar una pasada adicional del modelo                         |
| `agent_end`                     | Observar los mensajes finales, el estado de éxito y la duración de la ejecución                                  |
| `heartbeat_prompt_contribution` | Añadir contexto exclusivo del Heartbeat para los plugins de supervisión en segundo plano y de ciclo de vida                  |

**Observación de conversaciones**

| Hook                                      | Propósito                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Metadatos depurados de llamadas al proveedor/modelo: tiempos, resultado y hashes acotados de identificadores de solicitud. Sin contenido del prompt ni de la respuesta. |
| `llm_input`                               | Entrada del proveedor: prompt del sistema, prompt e historial                                                                     |
| `llm_output`                              | Salida del proveedor, uso y el valor `contextTokenBudget` resuelto cuando esté disponible                                       |

**Herramientas**

| Hook                       | Propósito                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Reescribir los parámetros de la herramienta, bloquear la ejecución o requerir aprobación |
| `after_tool_call`          | Observar los resultados y errores de la herramienta, así como la duración                |
| `resolve_exec_env`         | Aportar variables de entorno propiedad del plugin a `exec`   |
| **`tool_result_persist`**  | Reescribir el mensaje del asistente generado a partir del resultado de una herramienta |
| **`before_message_write`** | Inspeccionar o bloquear la escritura de un mensaje en curso (poco frecuente)      |

**Mensajes y entrega**

| Hook                            | Propósito                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Reclamar un mensaje entrante antes del enrutamiento al agente (respuestas sintéticas) |
| **`channel_pairing_requested`** | Observar las solicitudes de emparejamiento de mensajes directos recién creadas                         |
| `message_received`              | Observar el contenido entrante, el remitente, el hilo y los metadatos             |
| **`message_sending`**           | Reescribir el contenido saliente o cancelar la entrega                       |
| **`reply_payload_sending`**     | Modificar o cancelar cargas útiles de respuesta normalizadas antes de la entrega        |
| `message_sent`                  | Observar el éxito o el fallo de la entrega saliente                      |
| **`before_dispatch`**           | Inspeccionar o reescribir un envío saliente antes de transferirlo al canal    |
| **`reply_dispatch`**            | Participar en el pipeline final de envío de respuestas                  |

**Sesiones y Compaction**

| Hook                                     | Propósito                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Realizar un seguimiento de los límites del ciclo de vida de la sesión. `reason` es uno de `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` o `unknown`. `shutdown`/`restart` se activan desde el finalizador de cierre del Gateway cuando el proceso se detiene o reinicia con sesiones activas, de modo que los plugins (memoria, almacenes de transcripciones) puedan finalizar las filas huérfanas en lugar de dejarlas abiertas entre reinicios. El finalizador está limitado para que un plugin lento no pueda bloquear SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Observar o anotar ciclos de Compaction                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Observar eventos de restablecimiento de sesión (`/reset`, restablecimientos programáticos)                                                                                                                                                                                                                                                                                                                                                                                                     |

En las llamadas a `sessions.create` con `parentSessionKey` y `emitCommandHooks: true`, cada hijo diferenciado recibe siempre `session_start`. Los llamadores declaran si el padre también recibe el evento terminal `session_end` mediante `succeedsParent`: `true` indica un sucesor y `false` indica un hijo paralelo. Omitirlo conserva el comportamiento heredado de transición del padre. Los hooks `command:new` y `before_reset` siguen describiendo la acción `/new` solicitada en ambos casos.

**Subagentes**

- `subagent_spawned` / `subagent_ended` - observan el inicio y la finalización del subagente.
- `subagent_delivery_target` - enlace de compatibilidad para la entrega de la finalización cuando ningún enlace de sesión del núcleo puede proyectar una ruta.
- `subagent_spawning` - enlace de compatibilidad obsoleto. Ahora el núcleo prepara los enlaces de subagentes `thread: true` mediante adaptadores de enlace de sesión de canal antes de que se active `subagent_spawned`.
- `subagent_spawned` incluye `resolvedModel` y `resolvedProvider` cuando OpenClaw ha resuelto el modelo nativo de la sesión secundaria antes del inicio.
- `subagent_ended` contiene `targetSessionKey` (identidad; coincide con `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` o `"acp"`), `reason`, el valor opcional `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` o `"deleted"`), el valor opcional `error`, `runId`, `endedAt`, `accountId` y `sendFarewell`. **No** incluye `agentId` ni `childSessionKey`; use `targetSessionKey` para correlacionarlo con el evento `subagent_spawned` correspondiente.

**Ciclo de vida**

| Enlace                            | Propósito                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Iniciar o detener con el Gateway servicios que pertenecen al plugin                                            |
| `deactivate`                     | Alias de compatibilidad obsoleto de `gateway_stop`; use `gateway_stop` en plugins nuevos                       |
| `cron_reconciled`                | Conciliar con el estado completo de Cron del Gateway después del inicio o de una recarga                       |
| `cron_changed`                   | Observar cambios en el ciclo de vida de Cron administrado por el Gateway (añadido, actualizado, eliminado, iniciado, finalizado, programado) |
| **`before_install`**             | Inspeccionar el material preparado para instalar Skills o un plugin desde un entorno de ejecución de plugin cargado |

### Solicitudes de vinculación de canales

Use `channel_pairing_requested` cuando un plugin necesite notificar a un operador o
escribir un registro de auditoría después de que el remitente de un mensaje directo no vinculado cree una solicitud de vinculación
pendiente. El enlace se ejecuta cuando se crea la solicitud; los controladores de enlace lentos o con errores
no retrasan la entrega por el canal de la respuesta de vinculación.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Nueva solicitud de vinculación de ${event.channel} de ${event.senderId}: ${event.code}`,
  });
});
```

El enlace es únicamente de observación. No aprueba, rechaza, suprime ni reescribe
la respuesta de vinculación. La carga útil incluye el canal, el valor opcional `accountId`,
el `senderId` limitado al canal, el `code` de vinculación y los metadatos del canal. Trate el
código de vinculación como una credencial de aprobación activa y de un solo uso, y entréguelo únicamente a un
destino de operador de confianza. Trate `metadata` como texto de identidad no fiable
proporcionado por el remitente. El enlace no incluye el cuerpo ni los archivos multimedia del mensaje entrante.

## Enlaces de depuración del entorno de ejecución

Use `before_model_resolve` para cambiar el proveedor o el modelo de un turno del agente; se
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
- los valores opcionales `event.toolKind` y `event.toolInputKind`, discriminadores
  con autoridad del host para herramientas que comparten nombres intencionadamente; por ejemplo, las llamadas
  `exec` del modo de código externo usan `toolKind: "code_mode_exec"` e incluyen
  `toolInputKind: "javascript" | "typescript"` cuando se conoce el lenguaje de
  entrada
- el valor opcional `event.derivedPaths`, indicaciones de rutas de destino obtenidas por el host con el mejor esfuerzo
  para envoltorios de herramientas conocidos como `apply_patch`; estas rutas pueden estar
  incompletas o sobreaproximar lo que la herramienta realmente modificará (por
  ejemplo, con entradas parciales o con formato incorrecto)
- el valor opcional `event.runId`
- el valor opcional `event.toolCallId`
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` y el valor de diagnóstico `ctx.trace`
- el valor opcional `ctx.requester`, el solicitante determinado por el host que inició la ejecución
  del mensaje actual. Puede incluir `channel`, `accountId`, `senderId`,
  `senderIsOwner` y el valor nativo del proveedor `roleIds`. Los campos ausentes no están demostrados;
  no constituyen garantías falsas. Aplique una denegación predeterminada cuando la política los requiera.

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
    /** @deprecated Las aprobaciones no resueltas siempre se deniegan. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Comportamiento de protección para los enlaces de ciclo de vida tipados:

- `block: true` es terminal y omite los controladores de menor prioridad.
- `block: false` se considera que no hay decisión.
- `params` reescribe los parámetros de la herramienta para su ejecución.
- `requireApproval` pausa la ejecución del agente y solicita una decisión al usuario mediante las
  aprobaciones del plugin. `/approve` puede aprobar tanto las aprobaciones de ejecución como las del plugin. En las
  retransmisiones nativas `PreToolUse` del modo de informe del servidor de aplicaciones de Codex, esto se remite a la
  solicitud de aprobación correspondiente del servidor de aplicaciones; consulte
  [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime#hook-boundaries).
- Un `block: true` de menor prioridad aún puede bloquear después de que un enlace de mayor prioridad
  haya solicitado aprobación.
- `onResolution` recibe la decisión resuelta: `allow-once`, `allow-always`,
  `deny`, `timeout` o `cancelled`.

### Política que tiene en cuenta al remitente en un solo archivo

Un archivo de plugin independiente puede mantener en el código la política específica de la implementación
en lugar de añadir otro esquema de configuración. Este ejemplo concede todas las herramientas a los propietarios,
permite a los mantenedores configurados usar un conjunto conservador de herramientas y acciones de mensajes,
y expone `/fix` a los remitentes que ya estén autorizados por la configuración del canal:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const AGENT_ID = "maintenance-agent";
const MAINTAINER_SCOPES = [
  {
    channel: "discord",
    accountId: "operations",
    senderIds: new Set(["maintainer-user-id"]),
    roleIds: new Set(["maintainer-role-id"]),
  },
];
const MAINTAINER_TOOLS = new Set(["read", "web_fetch", "web_search", "session_status", "message"]);
const MAINTAINER_MESSAGE_ACTIONS = new Set(["react", "reply", "thread-create", "thread-reply"]);

export default definePluginEntry({
  id: "maintenance-access",
  name: "Acceso de mantenimiento",
  description: "Aplicar al agente de mantenimiento una política de herramientas que tenga en cuenta al remitente.",
  register(api) {
    api.on("before_tool_call", (event, ctx) => {
      if (ctx.agentId !== AGENT_ID) {
        return;
      }

      const requester = ctx.requester;
      if (requester?.senderIsOwner === true) {
        return;
      }

      const maintainerScope = requester
        ? MAINTAINER_SCOPES.find(
            (scope) =>
              scope.channel === requester.channel && scope.accountId === requester.accountId,
          )
        : undefined;
      const isMaintainer =
        maintainerScope !== undefined &&
        ((requester?.senderId !== undefined && maintainerScope.senderIds.has(requester.senderId)) ||
          requester?.roleIds?.some((roleId) => maintainerScope.roleIds.has(roleId)) === true);
      if (!isMaintainer) {
        return { block: true, blockReason: "Se requiere acceso de mantenedor." };
      }

      if (event.toolName === "message") {
        const action = typeof event.params.action === "string" ? event.params.action : "";
        if (MAINTAINER_MESSAGE_ACTIONS.has(action)) {
          return;
        }
        return { block: true, blockReason: `Se requiere ser propietario para message.${action || "unknown"}.` };
      }

      if (MAINTAINER_TOOLS.has(event.toolName)) {
        return;
      }
      return { block: true, blockReason: `Se requiere ser propietario para ${event.toolName}.` };
    });

    api.registerCommand({
      name: "fix",
      description: "Solicitar al agente de mantenimiento que investigue y corrija un problema.",
      acceptsArgs: true,
      requireAuth: true,
      handler: async (ctx) =>
        ctx.agentId === AGENT_ID
          ? { continueAgent: true }
          : { text: "Este comando solo está disponible en la conversación de mantenimiento." },
    });
  },
});
```

Cargue el archivo directamente y reinicie el Gateway:

```json5
{
  agents: {
    list: [
      {
        id: "maintenance-agent",
        workspace: "~/.openclaw/workspace-maintenance",
      },
    ],
  },
  bindings: [
    {
      agentId: "maintenance-agent",
      match: {
        channel: "discord",
        accountId: "operations",
        peer: { kind: "channel", id: "maintenance-channel-id" },
      },
    },
  ],
  plugins: {
    load: { paths: ["~/.openclaw/policies/maintenance-access.ts"] },
  },
}
```

`AGENT_ID` debe identificar al agente vinculado a la conversación de mantenimiento. El
enlace selecciona ese agente para los mensajes normales y `/fix`; el archivo independiente
sigue siendo el único propietario de la política de herramientas para propietarios y mantenedores.

`requireAuth: true` reutiliza la admisión de remitentes existente de cada canal. En
Discord, una lista de permitidos `users`/`roles` de un servidor o canal puede autorizar al
público de mantenimiento. Otros canales pueden usar identificadores estables de remitentes. A continuación, el enlace
aplica la decisión más específica por herramienta a cada llamada a una herramienta durante la ejecución, incluidas
las llamadas nativas `PreToolUse` de Codex. Puede vetar una herramienta que el modelo pueda ver, pero no puede
añadir una herramienta omitida por el host. Las políticas existentes del entorno aislado, de aprobación de ejecución, de
herramientas del núcleo exclusivas para propietarios y del canal siguen aplicándose; el enlace no puede eludirlas.

Limite los identificadores de remitentes y roles a un par exacto de canal y cuenta como se muestra; ambos son
espacios de nombres locales del proveedor. Mantenga conservadoras las listas de permitidos. Añada herramientas de escritura o
ejecución solo cuando el entorno aislado y la política de aprobación de la implementación garanticen que sea
seguro. Para ejecuciones automatizadas o del sistema, decida explícitamente si la ausencia de
`ctx.requester` debe permitirse; el ejemplo la deniega para el agente especificado.

Consulte [Solicitudes de permisos de plugins](/es/plugins/plugin-permission-requests) para obtener información sobre
el enrutamiento de aprobaciones, el comportamiento de las decisiones y cuándo usar `requireApproval` en lugar
de herramientas opcionales o aprobaciones de ejecución.

Los plugins que necesiten una política a nivel de host pueden registrar políticas de herramientas de confianza mediante
`api.registerTrustedToolPolicy(...)`. Estas se ejecutan antes que los enlaces
`before_tool_call` ordinarios y antes que las decisiones normales de los enlaces. Las políticas de confianza de plugins
incluidos se ejecutan primero; las políticas de confianza de plugins instalados se ejecutan después, según el orden de carga
de los plugins; los enlaces `before_tool_call` ordinarios se ejecutan a continuación. Los plugins incluidos conservan
la ruta de políticas de confianza existente. Los plugins instalados deben habilitarse explícitamente
y declarar cada identificador de política en `contracts.trustedToolPolicies`; los identificadores no declarados
se rechazan antes del registro. Los identificadores de políticas están limitados al plugin que los registra,
por lo que distintos plugins pueden reutilizar el mismo identificador local. Use este nivel únicamente
para controles de confianza del host, como políticas del espacio de trabajo, aplicación de presupuestos o
seguridad de flujos de trabajo reservados.

### Hook del entorno de ejecución

`resolve_exec_env` permite que los plugins aporten variables de entorno a las invocaciones de herramientas `exec`
antes de que se ejecute el comando. Recibe:

- `event.sessionKey`
- `event.toolName`, actualmente siempre `"exec"`
- `event.host`, uno de `"gateway"`, `"sandbox"` o `"node"`
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` y `ctx.channelId`

Devuelva un `Record<string, string>` para combinarlo con el entorno de ejecución. Los controladores
se ejecutan por orden de prioridad; para una misma clave, los resultados posteriores
anulan los anteriores.

La salida del hook se filtra mediante la política de claves del entorno de ejecución del host antes
de combinarla. `PATH` siempre se descarta (la resolución de comandos y las comprobaciones de binarios seguros
dependen de esta variable). Se descartan las claves no válidas y las claves peligrosas que sobrescriben valores del host, como `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, las variables de proxy (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) y las variables que sobrescriben TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` y similares). El entorno filtrado del plugin se incluye
en los metadatos de aprobación y auditoría del Gateway y se reenvía a las solicitudes
de ejecución del host de Node.

### Persistencia de los resultados de herramientas

Los resultados de herramientas pueden incluir `details` estructurados para el renderizado de la interfaz, diagnósticos,
enrutamiento de contenido multimedia o metadatos propiedad del plugin. Trate `details` como metadatos de ejecución,
no como contenido del prompt:

- OpenClaw elimina `toolResult.details` antes de la reproducción del proveedor y de la entrada de
  Compaction para que los metadatos no se conviertan en contexto del modelo.
- Las entradas de sesión persistentes solo conservan `details` acotados. Los detalles demasiado grandes se
  sustituyen por un resumen compacto y `persistedDetailsTruncated: true`.
- `tool_result_persist` y `before_message_write` se ejecutan antes del límite final
  de persistencia. Mantenga pequeños los `details` devueltos y evite colocar
  texto relevante para el prompt únicamente en `details`; coloque la salida de herramientas visible para el modelo en
  `content`.

## Hooks del prompt y del modelo

Utilice los hooks específicos de cada fase para los plugins nuevos:

- `before_model_resolve`: recibe únicamente el prompt actual y los metadatos de los archivos
  adjuntos. Devuelva `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: recibe el prompt actual, los mensajes de sesión
  preparados y cualquier inyección en cola de ejecución única extraída para esta sesión.
  Devuelva `prependContext` o `appendContext`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de sesión.
  Devuelva `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: se ejecuta únicamente en turnos de Heartbeat y devuelve
  `prependContext` o `appendContext`. Está destinado a monitores en segundo plano que
  necesitan resumir el estado actual sin modificar los turnos iniciados por el usuario.

`before_agent_run` se ejecuta después de construir el prompt y antes de cualquier entrada al modelo,
incluida la carga de imágenes locales del prompt y la observación de `llm_input`. Recibe
la entrada actual del usuario como `prompt`, además del historial de sesión cargado en `messages`
y el prompt de sistema activo. Devuelva `{ outcome: "block", reason, message? }`
para detener la ejecución antes de que el modelo lea el prompt. `reason` es interno;
`message` es el texto de sustitución visible para el usuario. Solo se admiten los resultados `pass` y `block`;
las formas de decisión no compatibles provocan un cierre seguro.

Cuando se bloquea una ejecución, OpenClaw almacena únicamente el texto de sustitución en
`message.content`, junto con metadatos de bloqueo no sensibles, como el identificador del
plugin que produjo el bloqueo y la marca de tiempo. El texto original del usuario no se conserva en la transcripción
ni en el contexto futuro. Los motivos internos del bloqueo se consideran sensibles y
se excluyen de las cargas de transcripción, historial, difusión, registro y diagnóstico.
La observabilidad debe utilizar campos depurados, como el identificador del bloqueador, el resultado,
la marca de tiempo o una categoría segura.

Los hooks de turnos del agente, incluido `agent_end`, incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa; el mismo valor también se encuentra en `ctx.runId`. Las ejecuciones
iniciadas mediante Cron también exponen `ctx.jobId` (el identificador del trabajo Cron de origen) en el contexto
del turno del agente, para que los hooks puedan limitar métricas, efectos secundarios o estado a un trabajo
programado específico. `ctx.jobId` no forma parte del contexto de herramienta `before_tool_call`.

En las ejecuciones originadas en canales, `ctx.channel` y `ctx.messageProvider` identifican
la superficie del proveedor, como `discord` o `telegram`, mientras que `ctx.channelId` es
el identificador de destino de la conversación cuando OpenClaw puede derivarlo de la clave
de sesión o de los metadatos de entrega.

Cuando la identidad del remitente está disponible, los contextos de hooks del agente también incluyen:

- `ctx.senderId` - identificador del remitente con ámbito de canal (p. ej., `open_id` de Feishu, identificador
  de usuario de Discord). Se rellena cuando la ejecución se origina en un mensaje de usuario con
  metadatos de remitente conocidos.
- `ctx.chatId` - identificador de conversación nativo del transporte (p. ej., `chat_id`
  de Feishu, `chat_id` de Telegram). Se rellena cuando el canal de origen
  proporciona un identificador de conversación nativo.
- `ctx.channelContext.sender.id` - el mismo identificador de remitente que `ctx.senderId`, dentro
  de un objeto propiedad del canal que los plugins pueden ampliar con campos específicos del canal.
- `ctx.channelContext.chat.id` - el mismo identificador de conversación que `ctx.chatId`,
  dentro de un objeto propiedad del canal que los plugins pueden ampliar con campos específicos
  del canal.

El núcleo solo define los campos `id` anidados. Los plugins de canal que transmiten metadatos
más completos del remitente o del chat mediante el auxiliar de entrada pueden ampliar
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

Los plugins de canal transmiten esos campos mediante el auxiliar del SDK de entrada:

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

`ctx.senderExternalId` permanece como campo obsoleto de compatibilidad con el código fuente para
plugins antiguos. El núcleo no lo rellena; las nuevas identidades de remitente
específicas del canal deben residir en `ctx.channelContext.sender` mediante la ampliación
del módulo.

`agent_end` es un hook de observación. Las rutas del Gateway y del arnés persistente lo ejecutan
sin esperar su resultado después del turno, mientras que las rutas efímeras de ejecución única de la CLI esperan
la promesa del hook antes de limpiar el proceso, para que los plugins de confianza puedan vaciar
la observabilidad del terminal o capturar el estado. El ejecutor de hooks aplica un tiempo de espera de 30 segundos
para que un plugin bloqueado o un endpoint de incrustación no pueda dejar la promesa del hook
pendiente indefinidamente. Los tiempos de espera se registran y OpenClaw continúa; no se
cancela el trabajo de red propiedad del plugin, a menos que el plugin también utilice su propia
señal de cancelación.

Utilice `model_call_started` y `model_call_ended` para la telemetría de llamadas al proveedor
que no deba recibir prompts, historial, respuestas, encabezados, cuerpos de solicitudes
ni identificadores de solicitudes del proveedor sin procesar. Estos hooks incluyen metadatos estables, como
`runId`, `callId`, `provider`, `model`, los valores opcionales `api`/`transport`, los valores terminales
`durationMs`/`outcome` y `upstreamRequestIdHash` cuando OpenClaw puede derivar un
hash acotado del identificador de solicitud del proveedor. Cuando el entorno de ejecución ha resuelto
los metadatos de la ventana de contexto, el evento y el contexto del hook también incluyen
`contextTokenBudget`, el presupuesto efectivo de tokens después de los límites del modelo, la configuración y el agente,
además de `contextWindowSource` y `contextWindowReferenceTokens` cuando se ha aplicado
un límite inferior.

`before_agent_finalize` solo se ejecuta cuando un arnés está a punto de aceptar una respuesta final
natural del asistente. No es la ruta de cancelación `/stop` y no se
ejecuta cuando el usuario cancela un turno. Devuelva `{ action: "revise", reason }` para solicitar
al arnés una pasada adicional del modelo antes de finalizar, `{ action:
"finalize", reason? }` para forzar la finalización u omita el resultado para continuar.
Los controladores disponen de un presupuesto predeterminado de 15s; si se agota el tiempo de espera, OpenClaw registra el fallo y
continúa con la respuesta final original.
Los hooks nativos `Stop` de Codex se transmiten a este hook como decisiones
`before_agent_finalize` de OpenClaw.

Al devolver `action: "revise"`, los plugins pueden incluir metadatos `retry` para
que la pasada adicional del modelo esté acotada y sea segura ante repeticiones:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` se añade al motivo de revisión enviado al arnés.
`idempotencyKey` permite que el host contabilice los reintentos de una misma solicitud del plugin
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

Los hooks que modifican el prompt y las inyecciones duraderas para el siguiente turno pueden deshabilitarse por
plugin mediante `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensiones de sesión e inyecciones para el siguiente turno

Los plugins de flujo de trabajo pueden conservar un estado de sesión pequeño compatible con JSON mediante
`api.session.state.registerSessionExtension(...)` y actualizarlo mediante el método
`sessions.pluginPatch` del Gateway. Las filas de sesión proyectan el estado
de extensión registrado mediante `pluginExtensions`, lo que permite que Control UI y otros
clientes rendericen el estado propiedad del plugin sin conocer sus detalles internos.
`api.registerSessionExtension(...)` sigue funcionando, pero está obsoleto en favor del
espacio de nombres `api.session.state`.

Utilice `api.session.workflow.enqueueNextTurnInjection(...)` cuando un plugin necesite
que un contexto duradero llegue al siguiente turno del modelo exactamente una vez (el elemento de nivel superior
`api.enqueueNextTurnInjection(...)` es un alias obsoleto con el mismo
comportamiento). OpenClaw extrae las inyecciones en cola antes de los hooks del prompt, descarta
las inyecciones caducadas y elimina duplicados por `idempotencyKey` en cada plugin. Esta es
la interfaz adecuada para reanudaciones de aprobaciones, resúmenes de políticas, cambios de monitores
en segundo plano y continuaciones de comandos que deban ser visibles para el modelo en el
siguiente turno, pero que no deban convertirse en texto permanente del prompt de sistema.

La semántica de limpieza forma parte del contrato. Las devoluciones de llamada de limpieza de extensiones de sesión y
del ciclo de vida del entorno de ejecución reciben `reset`, `delete`, `disable` o
`restart`. El host elimina el estado persistente de extensión de sesión
y las inyecciones pendientes para el siguiente turno del plugin propietario al restablecer, eliminar o deshabilitar; el reinicio
conserva el estado duradero de la sesión, mientras que las devoluciones de llamada de limpieza permiten que los plugins liberen
trabajos del programador, contexto de ejecución y otros recursos fuera de banda de la generación
anterior del entorno de ejecución.

## Hooks de mensajes

Utilice hooks de mensajes para el enrutamiento y la política de entrega a nivel de canal:

- `message_received`: observa el contenido entrante, el remitente, `threadId`,
  `messageId`, `senderId`, la correlación opcional de ejecución/sesión y los metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `reply_payload_sending`: reescribe objetos `ReplyPayload` normalizados
  (incluidos `presentation`, `delivery`, referencias multimedia y texto) o devuelve
  `{ cancel: true }`.
- `message_sent`: observa el éxito o el fallo final.

En las respuestas TTS que solo contienen audio, `content` puede contener la transcripción
hablada oculta, incluso cuando la carga del canal no incluye texto ni subtítulos visibles.
Reescribir ese `content` solo actualiza la transcripción visible para el hook; no se
renderiza como subtítulo del contenido multimedia.

Los eventos `reply_payload_sending` pueden incluir `usageState`, una instantánea en vivo
de mejor esfuerzo por turno del modelo, uso y contexto. La entrega duradera, la reproducción recuperada y
las respuestas sin una correlación exacta con la ejecución lo omiten.

Los contextos de hooks de mensajes exponen campos de correlación estables cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Los contextos de entrada
y `before_dispatch` también exponen metadatos de respuesta cuando el canal
dispone de datos de mensajes citados filtrados según la visibilidad: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` y `replyToIsQuote`. Se deben priorizar estos
campos de primera clase antes de leer metadatos heredados.

Se deben priorizar los campos tipados `threadId` y `replyToId` antes de usar metadatos
específicos del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se trata como si no hubiera decisión.
- El `content` reescrito continúa hacia hooks de menor prioridad, salvo que un hook posterior
  cancele la entrega.
- `reply_payload_sending` se ejecuta después de normalizar la carga útil y antes de la entrega
  por el canal, incluidas las respuestas reenviadas al canal de origen.
  Los controladores se ejecutan secuencialmente y cada uno recibe la carga útil más reciente producida
  por los controladores de mayor prioridad.
- Las cargas útiles de `reply_payload_sending` no exponen marcadores de confianza del entorno de ejecución como
  `trustedLocalMedia`; los plugins pueden modificar la estructura de la carga útil, pero no pueden conceder confianza local
  a los archivos multimedia.
- `message_sending` puede devolver `cancelReason` y un `metadata` limitado junto con una
  cancelación. Las nuevas API del ciclo de vida de mensajes exponen esto como un resultado de entrega
  suprimida con el motivo `cancelled_by_message_sending_hook`; la entrega directa
  heredada sigue devolviendo un arreglo de resultados vacío por compatibilidad.
- `message_sent` es solo de observación. Los errores de los controladores se registran y no
  modifican el resultado de la entrega.

## Instalar hooks

Se debe usar `security.installPolicy` para las decisiones de permiso o bloqueo gestionadas por el operador. Esa
política se ejecuta desde la configuración de OpenClaw, abarca las rutas de instalación y actualización de la CLI y
adopta un cierre seguro cuando está habilitada pero no disponible.

`before_install` es un hook del ciclo de vida del entorno de ejecución del plugin. Se ejecuta después de
`security.installPolicy` únicamente en el proceso de OpenClaw en el que los hooks del plugin ya
se han cargado, como en los flujos de instalación respaldados por el Gateway. Resulta útil para
observaciones, advertencias y comprobaciones de compatibilidad propias del plugin, pero no es
el límite de seguridad principal de la empresa o del host para las instalaciones. El campo
`builtinScan` permanece en la carga útil del evento por compatibilidad, pero
OpenClaw ya no ejecuta el bloqueo integrado de código peligroso durante la instalación, por lo que
es un resultado `ok` vacío. Devuelva hallazgos adicionales o
`{ block: true, blockReason }` para detener la instalación en ese proceso.

`block: true` es terminal. `block: false` se trata como si no hubiera decisión. Los errores de los controladores
bloquean la instalación mediante cierre seguro.

## Ciclo de vida del Gateway

Se debe usar `gateway_start` para iniciar servicios generales del plugin y `gateway_stop` para
limpiar recursos de larga duración. Es posible que el planificador de cron aún se esté cargando cuando
se ejecute `gateway_start`, por lo que no debe usarse como señal de referencia para una proyección
externa de cron.

No se debe depender del hook interno `gateway:startup` para servicios del entorno de ejecución
gestionados por el plugin.

`cron_reconciled` se activa después de que el planificador de cron del Gateway y sus observadores de salida
hayan conciliado su estado persistente. Se activa tanto durante el inicio
inicial como al sustituir el planificador durante una recarga de configuración. El evento informa de
`reason` (`startup` o `reload`) y del estado efectivo de `enabled`. Un cron
deshabilitado también emite el evento con `enabled: false`, lo que permite que una proyección externa
elimine activaciones obsoletas. Se debe usar `ctx.getCron?.()` para la instancia exacta del planificador que
completó la conciliación; una recarga posterior no redirige esa devolución de llamada.
`ctx.abortSignal` controla esa misma instantánea del planificador. El Gateway la cancela en cuanto
se activa un planificador más reciente o comienza el apagado. Debe propagarse a todos
los efectos secundarios persistentes y la instantánea no debe aceptarse después de su cancelación.
Esta es una señal del ciclo de vida del planificador, no una señal de activación del plugin: una
recarga en caliente que solo afecte al plugin no vuelve a emitirla. Un consumidor recién habilitado recibe
su primera referencia en la siguiente sustitución del planificador o al iniciar el Gateway.

Al igual que con otros hooks de observación, las devoluciones de llamada `gateway_start` y `cron_reconciled`
pueden solaparse. Si ambos controladores comparten la inicialización del plugin, deben
coordinarse mediante una promesa local de preparación del plugin, en lugar de depender del orden de las devoluciones de llamada.

`cron_changed` se activa para los eventos del ciclo de vida de cron gestionados por el Gateway con una carga útil
de evento tipada que abarca los motivos `added`, `updated`, `removed`, `started`, `finished`
y `scheduled`. El evento incluye una instantánea `PluginHookGatewayCronJob`
(incluidos `state.nextRunAtMs`, `state.lastRunStatus` y
`state.lastError` cuando están presentes), además de un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Los eventos eliminados
son posteriores a la confirmación: se activan únicamente después de que la eliminación persistente se complete correctamente y siguen incluyendo
la instantánea de la tarea eliminada para que los planificadores externos puedan conciliar el estado.

Un evento `scheduled` es posterior a la confirmación: se activa únicamente después de que una escritura persistente correcta
modifique el `nextRunAtMs` efectivo de una tarea existente, sin incluir el evento explícito del ciclo de vida
`added`, `updated` o `removed` de esa tarea. El `event.nextRunAtMs` de nivel superior
es la siguiente activación confirmada; cuando no está presente, la tarea no tiene
una próxima activación. Estos eventos deben tratarse como indicaciones de conciliación, no como un registro
ordenado de cambios. Deben usarse como indicaciones combinables para volver a leer el planificador capturado por última vez por
`cron_reconciled`; no se debe adoptar el planificador de un contexto `cron_changed`.
OpenClaw debe mantenerse como fuente de verdad para las comprobaciones de vencimiento y la ejecución.

### Proyección externa segura de cron

Se debe proyectar una instantánea completa de activaciones, en lugar de reenviar los cambios de los eventos de cron. La
operación `replaceAll` del adaptador externo debe ser atómica e idempotente, y
debe resolverse únicamente después de que el host haya aceptado la instantánea de forma persistente. También debe
respetar la señal de cancelación proporcionada: si la señal se cancela antes de la
aceptación persistente, el adaptador no debe aceptar esa instantánea.

Este patrón mantiene en ejecución un único trabajador con el estado más reciente. Únicamente `cron_reconciled`
adopta una instancia del planificador; `cron_changed` solo solicita que ese trabajador vuelva a leer
la instancia autoritativa, de modo que una indicación tardía no pueda restaurar un planificador anterior.
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
        api.logger.warn(`falló la proyección externa de cron; se volverá a intentar en ${retryMs}ms`);
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
      api.logger.warn("la conciliación de cron no expuso un planificador");
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

Cuando `cron_reconciled` informa de `enabled: false`, la misma ruta llama a
`replaceAll([])` y elimina las activaciones externas obsoletas. Los reintentos y el retroceso de este ejemplo
son locales al proceso y tratan los errores del adaptador del entorno de ejecución como transitorios; se debe validar
la configuración no recuperable antes del registro. OpenClaw no proporciona una
bandeja de salida para los efectos de los hooks del plugin. Si el proceso finaliza antes de la aceptación persistente,
el siguiente inicio del Gateway emite una nueva instantánea autoritativa de `cron_reconciled`.
`gateway_stop` cancela el trabajo del host en curso, espera a que finalice el trabajador y, a continuación,
cierra el adaptador.

## Próximas obsolescencias

Algunas superficies relacionadas con hooks están obsoletas, pero todavía son compatibles. Deben migrarse
antes de la próxima versión principal:

- **Sobres de canal en texto sin formato** en los controladores `inbound_claim` y `message_received`.
  Lea `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar el texto plano del sobre. Consulte
  [Sobres de canal en texto sin formato → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`subagent_spawning`** se mantiene por compatibilidad con plugins anteriores, pero
  los plugins nuevos no deben devolver desde ahí el enrutamiento de hilos. El núcleo prepara
  los enlaces de subagentes `thread: true` mediante adaptadores de enlace de sesiones de canal
  antes de que se active `subagent_spawned`.
- **`deactivate`** se mantiene como alias obsoleto de compatibilidad para la limpieza hasta
  después de 2026-08-16. Los plugins nuevos deben usar `gateway_stop`.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de un `string` de formato libre.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** se mantienen
  como alias de compatibilidad de nivel superior. Los plugins nuevos deben usar
  `api.session.state.registerSessionExtension(...)` y
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Para consultar la lista completa —registro de capacidades de memoria, perfil de razonamiento
del proveedor, proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores del entorno de ejecución
de tareas y el cambio de nombre de `command-auth` → `command-status`—, consulte
[Migración del SDK de plugins → Funciones obsoletas activas](/es/plugins/sdk-migration#active-deprecations).

## Contenido relacionado

- [Migración del SDK de plugins](/es/plugins/sdk-migration) - funciones obsoletas activas y calendario de eliminación
- [Creación de plugins](/es/plugins/building-plugins)
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Puntos de entrada de plugins](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Detalles internos de la arquitectura de plugins](/es/plugins/architecture-internals)
