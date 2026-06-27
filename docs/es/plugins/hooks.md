---
read_when:
    - Estás creando un plugin que necesita hooks `before_tool_call`, `before_agent_reply`, de mensajes o de ciclo de vida
    - Debes bloquear, reescribir o requerir aprobación para las llamadas a herramientas de un Plugin
    - Estás decidiendo entre hooks internos y hooks de plugin
summary: 'Puntos de enganche de Plugin: intercepta eventos del ciclo de vida de agente, herramienta, mensaje, sesión y Gateway'
title: Ganchos de Plugin
x-i18n:
    generated_at: "2026-06-27T12:12:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Los hooks de Plugin son puntos de extensión en proceso para plugins de OpenClaw. Úsalos
cuando un plugin necesite inspeccionar o cambiar ejecuciones de agentes, llamadas a herramientas, flujo de mensajes,
ciclo de vida de sesiones, enrutamiento de subagentes, instalaciones o inicio del Gateway.

Usa [hooks internos](/es/automation/hooks) en su lugar cuando quieras un pequeño
script `HOOK.md` instalado por el operador para eventos de comandos y del Gateway como
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

- `priority` - orden del manejador (los valores más altos se ejecutan primero).
- `timeoutMs` - presupuesto opcional por hook. Cuando se establece, el ejecutor de hooks aborta ese
  manejador después de que se agota el presupuesto y continúa con el siguiente, en vez de
  permitir que una configuración lenta o trabajo de recuperación consuma el timeout de modelo configurado
  por el llamador. Omítelo para usar el timeout predeterminado de observación/decisión que el
  ejecutor de hooks aplica de forma genérica.

Los operadores también pueden establecer presupuestos de hooks sin parchear el código del plugin:

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

`hooks.timeouts.<hookName>` reemplaza a `hooks.timeoutMs`, que reemplaza al
valor `api.on(..., { timeoutMs })` escrito por el plugin. Cada valor configurado debe
ser un entero positivo no mayor que 600000 milisegundos. Prefiere reemplazos por hook
para hooks que se sabe que son lentos, de modo que un plugin no obtenga un presupuesto más largo
en todas partes.

Cada hook recibe `event.context.pluginConfig`, la configuración resuelta para el
plugin que registró ese manejador. Úsala para decisiones de hooks que necesitan
opciones actuales del plugin; OpenClaw la inyecta por manejador sin mutar el
objeto de evento compartido visto por otros plugins.

## Catálogo de hooks

Los hooks se agrupan por la superficie que extienden. Los nombres en **negrita** aceptan un
resultado de decisión (bloquear, cancelar, reemplazar o requerir aprobación); todos los demás son
solo de observación.

**Turno del agente**

- `before_model_resolve` - reemplaza el proveedor o el modelo antes de que se carguen los mensajes de sesión
- `agent_turn_prepare` - consume inyecciones de turno de plugin en cola y agrega contexto del mismo turno antes de los hooks de prompt
- `before_prompt_build` - agrega contexto dinámico o texto de prompt del sistema antes de la llamada al modelo
- `before_agent_start` - fase combinada solo por compatibilidad; prefiere los dos hooks anteriores
- **`before_agent_run`** - inspecciona el prompt final y los mensajes de sesión antes del envío al modelo y opcionalmente bloquea la ejecución
- **`before_agent_reply`** - cortocircuita el turno del modelo con una respuesta sintética o silencio
- **`before_agent_finalize`** - inspecciona la respuesta final natural y solicita una pasada más del modelo
- `agent_end` - observa mensajes finales, estado de éxito y duración de la ejecución
- `heartbeat_prompt_contribution` - agrega contexto solo de Heartbeat para plugins de monitorización en segundo plano y ciclo de vida

**Observación de conversación**

- `model_call_started` / `model_call_ended` - observa metadatos saneados de llamadas a proveedor/modelo, tiempos, resultado y hashes acotados de identificadores de solicitud sin contenido de prompt ni de respuesta
- `llm_input` - observa la entrada del proveedor (prompt del sistema, prompt, historial)
- `llm_output` - observa la salida del proveedor, el uso y el `contextTokenBudget` resuelto cuando está disponible

**Herramientas**

- **`before_tool_call`** - reescribe parámetros de herramienta, bloquea la ejecución o requiere aprobación
- `after_tool_call` - observa resultados de herramientas, errores y duración
- `resolve_exec_env` - aporta variables de entorno propiedad del plugin a `exec`
- **`tool_result_persist`** - reescribe el mensaje del asistente producido a partir de un resultado de herramienta
- **`before_message_write`** - inspecciona o bloquea una escritura de mensaje en curso (raro)

**Mensajes y entrega**

- **`inbound_claim`** - reclama un mensaje entrante antes del enrutamiento del agente (respuestas sintéticas)
- `message_received` — observa contenido entrante, remitente, hilo y metadatos
- **`message_sending`** — reescribe contenido saliente o cancela la entrega
- **`reply_payload_sending`** — muta o cancela cargas de respuesta normalizadas antes de la entrega
- `message_sent` — observa el éxito o fallo de la entrega saliente
- **`before_dispatch`** - inspecciona o reescribe un envío saliente antes de la transferencia al canal
- **`reply_dispatch`** - participa en la canalización final de envío de respuestas

**Sesiones y Compaction**

- `session_start` / `session_end` - rastrea límites del ciclo de vida de la sesión. El `reason` del evento es uno de `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` o `unknown`. Los valores `shutdown` y `restart` se disparan desde el finalizador de apagado del gateway cuando el proceso se detiene o reinicia mientras las sesiones siguen activas, de modo que los plugins posteriores (como almacenes de memoria o transcripciones) puedan finalizar filas fantasma que de otro modo quedarían en estado abierto entre reinicios. El finalizador está acotado para que un plugin lento no pueda bloquear SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - observa o anota ciclos de Compaction
- `before_reset` - observa eventos de restablecimiento de sesión (`/reset`, restablecimientos programáticos)

**Subagentes**

- `subagent_spawned` / `subagent_ended` - observa el lanzamiento y la finalización de subagentes.
- `subagent_delivery_target` - hook de compatibilidad para la entrega de finalización cuando ningún enlace de sesión del núcleo puede proyectar una ruta.
- `subagent_spawning` - hook de compatibilidad obsoleto. El núcleo ahora prepara enlaces de subagente `thread: true` mediante adaptadores de enlace de sesión de canal antes de que se dispare `subagent_spawned`.
- `subagent_spawned` incluye `resolvedModel` y `resolvedProvider` cuando OpenClaw ha resuelto el modelo nativo de la sesión hija antes del lanzamiento.
- `subagent_ended` lleva `targetSessionKey` (identidad — esto coincide con `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` o `"acp"`), `reason`, `outcome` opcional (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` o `"deleted"`), `error` opcional, `runId`, `endedAt`, `accountId` y `sendFarewell`. **No** incluye `agentId` ni `childSessionKey`; usa `targetSessionKey` para correlacionarlo con el evento `subagent_spawned` correspondiente.

**Ciclo de vida**

- `gateway_start` / `gateway_stop` - inicia o detiene servicios propiedad del plugin con el Gateway
- `deactivate` - alias de compatibilidad obsoleto para `gateway_stop`; usa `gateway_stop` en plugins nuevos
- `cron_changed` - observa cambios del ciclo de vida de cron propiedad del gateway (agregado, actualizado, eliminado, iniciado, finalizado, programado)
- **`before_install`** - inspecciona material de instalación de skill o plugin preparado desde un runtime de
  plugin cargado

## Depurar hooks de runtime

Usa `before_model_resolve` cuando un plugin necesite cambiar el proveedor o el modelo
para un turno de agente. Se ejecuta antes de la resolución del modelo; `llm_output` solo se ejecuta después de
que un intento de modelo produce salida del asistente.

Para comprobar el modelo de sesión efectivo, inspecciona los registros de runtime y luego
usa `openclaw sessions` o las superficies de sesión/estado del Gateway. Al depurar
cargas de proveedor, inicia el Gateway con `--raw-stream` y
`--raw-stream-path <path>`; esas banderas escriben eventos sin procesar del flujo del modelo en un archivo jsonl.

## Política de llamadas a herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.toolKind` y `event.toolInputKind` opcionales, discriminadores con autoridad del host
  para herramientas que comparten nombres intencionadamente; por ejemplo, las llamadas `exec` externas
  en modo código usan `toolKind: "code_mode_exec"` e
  incluyen `toolInputKind: "javascript" | "typescript"` cuando se conoce el lenguaje de entrada
- `event.derivedPaths` opcional, que contiene pistas de rutas de destino derivadas por el host, de mejor esfuerzo,
  para envoltorios de herramientas conocidos como `apply_patch`; cuando están presentes,
  estas rutas pueden estar incompletas o pueden sobreaproximar lo que la herramienta
  tocará realmente (por ejemplo, con entradas mal formadas o parciales)
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (establecido en ejecuciones impulsadas por cron), `ctx.toolKind`,
  `ctx.toolInputKind` y `ctx.trace` de diagnóstico

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

Comportamiento de guardia de hooks para hooks de ciclo de vida tipados:

- `block: true` es terminal y omite manejadores de menor prioridad.
- `block: false` se trata como ausencia de decisión.
- `params` reescribe los parámetros de la herramienta para la ejecución.
- `requireApproval` pausa la ejecución del agente y pregunta al usuario mediante aprobaciones de plugin. El comando `/approve` puede aprobar tanto aprobaciones de exec como de plugin.
  En relés nativos `PreToolUse` del modo informe del servidor de aplicaciones Codex, esto se difiere
  a la solicitud de aprobación correspondiente del servidor de aplicaciones; consulta [runtime del harness de Codex](/es/plugins/codex-harness-runtime#hook-boundaries).
- Un `block: true` de menor prioridad aún puede bloquear después de que un hook de mayor prioridad
  haya solicitado aprobación.
- `onResolution` recibe la decisión de aprobación resuelta - `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

Consulta [Solicitudes de permisos de Plugin](/es/plugins/plugin-permission-requests) para
enrutamiento de aprobaciones, comportamiento de decisiones y cuándo usar `requireApproval` en lugar
de herramientas opcionales o aprobaciones de exec.

Los plugins que necesiten política de nivel de host pueden registrar políticas de herramientas de confianza con
`api.registerTrustedToolPolicy(...)`. Estas se ejecutan antes de los hooks
`before_tool_call` ordinarios y antes de las decisiones normales de hooks. Las políticas de confianza
incluidas se ejecutan primero; las políticas de confianza de plugins instalados se ejecutan después en orden de carga
de plugins; los hooks `before_tool_call` ordinarios se ejecutan después de ellas. Los plugins incluidos conservan
la ruta de política de confianza existente. Los plugins instalados deben habilitarse explícitamente
y declarar cada id de política en `contracts.trustedToolPolicies`; los ids no declarados
se rechazan antes del registro. Los ids de política tienen alcance al plugin que los registra,
por lo que diferentes plugins pueden reutilizar el mismo id local. Usa este nivel solo
para controles de confianza del host como política de espacio de trabajo, aplicación de presupuesto o
seguridad de flujos de trabajo reservados.

### Hook de entorno de Exec

`resolve_exec_env` permite que los plugins aporten variables de entorno a invocaciones de herramientas
`exec` después de que se construye el entorno exec base y antes de que se
ejecute el comando. Recibe:

- `event.sessionKey`
- `event.toolName`, actualmente siempre `"exec"`
- `event.host`, uno de `"gateway"`, `"sandbox"` o `"node"`
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` y `ctx.channelId`

Devuelve un `Record<string, string>` para fusionarlo en el entorno exec. Los manejadores
se ejecutan en orden de prioridad, y los resultados de hooks posteriores reemplazan los resultados de hooks anteriores para
la misma clave.

La salida del hook se filtra mediante la política de claves del entorno de ejecución del host antes de
fusionarse. Se descartan las claves no válidas, `PATH` y las claves peligrosas de anulación del host, como
`LD_*`, `DYLD_*`, `NODE_OPTIONS`, variables de proxy y variables de anulación de TLS.
El entorno filtrado del plugin se incluye en los metadatos de aprobación/auditoría del Gateway
y se reenvía a las solicitudes de ejecución de node-host.

### Persistencia de resultados de herramientas

Los resultados de herramientas pueden incluir `details` estructurados para renderizado de UI, diagnósticos,
enrutamiento de medios o metadatos propiedad del plugin. Trata `details` como metadatos de runtime,
no como contenido del prompt:

- OpenClaw elimina `toolResult.details` antes de la repetición del proveedor y la entrada de Compaction
  para que los metadatos no se conviertan en contexto del modelo.
- Las entradas de sesión persistidas conservan solo `details` acotados. Los detalles demasiado grandes se
  reemplazan por un resumen compacto y `persistedDetailsTruncated: true`.
- `tool_result_persist` y `before_message_write` se ejecutan antes del límite final de
  persistencia. Aun así, los hooks deben mantener pequeños los `details` devueltos y evitar
  colocar texto relevante para el prompt solo en `details`; coloca la salida de herramienta visible para el modelo
  en `content`.

## Hooks de prompt y modelo

Usa los hooks específicos de fase para plugins nuevos:

- `before_model_resolve`: recibe solo el prompt actual y los metadatos de adjuntos.
  Devuelve `providerOverride` o `modelOverride`.
- `agent_turn_prepare`: recibe el prompt actual, los mensajes de sesión preparados
  y cualquier inyección encolada de exactamente una vez drenada para esta sesión. Devuelve
  `prependContext` o `appendContext`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de sesión.
  Devuelve `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` o `appendSystemContext`.
- `heartbeat_prompt_contribution`: se ejecuta solo para turnos de Heartbeat y devuelve
  `prependContext` o `appendContext`. Está pensado para monitores en segundo plano
  que necesitan resumir el estado actual sin cambiar los turnos iniciados por el usuario.

`before_agent_start` se mantiene por compatibilidad. Prefiere los hooks explícitos anteriores
para que tu plugin no dependa de una fase combinada heredada.

`before_agent_run` se ejecuta después de la construcción del prompt y antes de cualquier entrada al modelo,
incluida la carga de imágenes locales del prompt y la observación de `llm_input`. Recibe
la entrada actual del usuario como `prompt`, además del historial de sesión cargado en `messages`
y el prompt de sistema activo. Devuelve `{ outcome: "block", reason, message? }`
para detener la ejecución antes de que el modelo pueda leer el prompt. `reason` es interno;
`message` es el reemplazo visible para el usuario. Los únicos resultados compatibles son
`pass` y `block`; las formas de decisión no compatibles fallan de forma cerrada.

Cuando se bloquea una ejecución, OpenClaw almacena solo el texto de reemplazo en
`message.content`, además de metadatos de bloqueo no sensibles, como el id del plugin
bloqueador y la marca de tiempo. El texto original del usuario no se conserva en la transcripción ni en el contexto futuro. Los motivos internos de bloqueo se tratan como sensibles y se excluyen de las cargas de transcripción, historial, difusión, registro y diagnósticos. La observabilidad
debe usar campos saneados, como id del bloqueador, resultado, marca de tiempo o una categoría
segura.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa. El mismo valor también está disponible en `ctx.runId`.
Las ejecuciones impulsadas por Cron también exponen `ctx.jobId` (el id del trabajo Cron de origen), de modo que
los hooks de plugin puedan acotar métricas, efectos secundarios o estado a un trabajo programado
específico.

Para ejecuciones originadas en canales, `ctx.channel` y `ctx.messageProvider` identifican
la superficie del proveedor, como `discord` o `telegram`, mientras que `ctx.channelId` es
el identificador de destino de la conversación cuando OpenClaw puede derivarlo de la clave de sesión
o de los metadatos de entrega.

Cuando la identidad del remitente está disponible, los contextos de hook de agente también incluyen:

- `ctx.senderId` — ID de remitente acotado al canal (por ejemplo, Feishu `open_id`, ID de usuario de Discord). Se rellena cuando la ejecución se origina en un mensaje de usuario con metadatos de remitente conocidos.
- `ctx.chatId` — identificador de conversación nativo del transporte (por ejemplo, Feishu
  `chat_id`, Telegram `chat_id`). Se rellena cuando el canal de origen
  proporciona un ID de conversación nativo.
- `ctx.channelContext.sender.id` — el mismo ID de remitente que `ctx.senderId`, bajo un
  objeto propiedad del canal que los plugins pueden extender con campos específicos del canal.
- `ctx.channelContext.chat.id` — el mismo ID de conversación que `ctx.chatId`, bajo un
  objeto propiedad del canal que los plugins pueden extender con campos específicos del canal.

Core solo define los campos `id` anidados. Los plugins de canal que pasan metadatos
más completos de remitente o chat mediante el helper de entrada pueden ampliar
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

Los plugins de canal pasan esos campos mediante el helper del SDK de entrada:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Estos campos son opcionales y están ausentes para ejecuciones originadas por el sistema (Heartbeat,
Cron, exec-event).

`ctx.senderExternalId` se mantiene como un campo obsoleto de compatibilidad de código fuente para
plugins antiguos. Core no lo rellena; las nuevas identidades de remitente específicas de canal
deben vivir bajo `ctx.channelContext.sender` mediante ampliación de módulo.

`agent_end` es un hook de observación. Las rutas de Gateway y de arnés persistente lo ejecutan
sin esperar su resultado después del turno, mientras que las rutas CLI de un solo uso y corta duración esperan a que se resuelva la promesa del
hook antes de la limpieza del proceso, para que los plugins de confianza puedan vaciar la observabilidad
de terminal o capturar estado. El ejecutor de hooks aplica un tiempo de espera de 30 segundos, de modo que un
plugin bloqueado o un endpoint incrustado no pueda dejar la promesa del hook pendiente
para siempre. Se registra un tiempo de espera y OpenClaw continúa; no cancela
el trabajo de red propiedad del plugin a menos que el plugin también use su propia señal de cancelación.

Usa `model_call_started` y `model_call_ended` para telemetría de llamadas a proveedor
que no debe recibir prompts sin procesar, historial, respuestas, encabezados, cuerpos de solicitud
ni ID de solicitudes del proveedor. Estos hooks incluyen metadatos estables, como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcional,
`durationMs`/`outcome` terminal y `upstreamRequestIdHash` cuando OpenClaw puede derivar un
hash acotado del id de solicitud del proveedor. Cuando el runtime ha resuelto metadatos
de ventana de contexto, el evento y el contexto del hook también incluyen `contextTokenBudget`, el
presupuesto efectivo de tokens después de los límites de modelo/configuración/agente, además de
`contextWindowSource` y `contextWindowReferenceTokens` cuando se aplicó un límite inferior.

`before_agent_finalize` se ejecuta solo cuando un arnés está a punto de aceptar una respuesta final
natural del asistente. No es la ruta de cancelación `/stop` y no se ejecuta
cuando el usuario aborta un turno. Devuelve `{ action: "revise", reason }` para pedir
al arnés una pasada más del modelo antes de la finalización, `{ action:
"finalize", reason? }` para forzar la finalización, u omite un resultado para continuar.
Los hooks nativos `Stop` de Codex se retransmiten a este hook como decisiones
`before_agent_finalize` de OpenClaw.

Al devolver `action: "revise"`, los plugins pueden incluir metadatos `retry` para hacer que
la pasada adicional del modelo sea acotada y segura para repetición:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` se añade al motivo de revisión enviado al arnés.
`idempotencyKey` permite al host contar reintentos para la misma solicitud de plugin entre
decisiones de finalización equivalentes, y `maxAttempts` limita cuántas pasadas adicionales
permitirá el host antes de continuar con la respuesta final natural.

Los plugins no incluidos que necesiten hooks de conversación sin procesar (`before_model_resolve`,
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

Los hooks que mutan prompts y las inyecciones duraderas para el siguiente turno se pueden desactivar por plugin
con `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensiones de sesión e inyecciones del siguiente turno

Los plugins de flujo de trabajo pueden persistir un pequeño estado de sesión compatible con JSON mediante
`api.registerSessionExtension(...)` y actualizarlo a través del método
`sessions.pluginPatch` del Gateway. Las filas de sesión proyectan el estado de extensión registrado
mediante `pluginExtensions`, lo que permite que Control UI y otros clientes rendericen
estado propiedad del plugin sin conocer sus detalles internos.

Usa `api.enqueueNextTurnInjection(...)` cuando un plugin necesite que contexto duradero
llegue exactamente una vez al siguiente turno del modelo. OpenClaw drena las inyecciones encoladas antes de
los hooks de prompt, descarta las inyecciones vencidas y deduplica por `idempotencyKey`
por plugin. Esta es la superficie correcta para reanudaciones de aprobación, resúmenes de política,
deltas de monitores en segundo plano y continuaciones de comandos que deben ser visibles para
el modelo en el siguiente turno, pero no deben convertirse en texto permanente del prompt de sistema.

Las semánticas de limpieza forman parte del contrato. La limpieza de extensiones de sesión y
los callbacks de limpieza del ciclo de vida del runtime reciben `reset`, `delete`, `disable` o
`restart`. El host elimina el estado persistente de extensión de sesión del plugin propietario
y las inyecciones pendientes del siguiente turno para reset/delete/disable; restart conserva
el estado de sesión duradero mientras los callbacks de limpieza permiten a los plugins liberar trabajos
del planificador, contexto de ejecución y otros recursos fuera de banda de la antigua generación
del runtime.

## Hooks de mensajes

Usa hooks de mensajes para enrutamiento de nivel de canal y política de entrega:

- `message_received`: observa contenido entrante, remitente, `threadId`, `messageId`,
  `senderId`, correlación opcional de ejecución/sesión y metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `reply_payload_sending`: reescribe objetos `ReplyPayload` normalizados (incluidos
  `presentation`, `delivery`, referencias de medios y texto) o devuelve `{ cancel: true }`.
- `message_sent`: observa el éxito o fallo final.

Para respuestas TTS solo de audio, `content` puede contener la transcripción hablada oculta
aunque la carga del canal no tenga texto/caption visible. Reescribir ese
`content` actualiza solo la transcripción visible para el hook; no se renderiza como un
caption de medios.

Los eventos `reply_payload_sending` pueden incluir `usageState`, una instantánea en vivo de mejor esfuerzo
por turno de modelo/uso/contexto. La entrega duradera, la repetición recuperada y
las respuestas sin correlación exacta de ejecución lo omiten.

Los contextos de hooks de mensajes exponen campos de correlación estables cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Los contextos de entrada
y `before_dispatch` también exponen metadatos de respuesta cuando el canal tiene
datos de mensajes citados filtrados por visibilidad: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` y `replyToIsQuote`. Prefiere estos campos de primera clase
antes de leer metadatos heredados.

Prefiere los campos tipados `threadId` y `replyToId` antes de usar metadatos
específicos del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se trata como sin decisión.
- El `content` reescrito continúa hacia los hooks de menor prioridad, a menos que un hook posterior
  cancele la entrega.
- `reply_payload_sending` se ejecuta después de la normalización del payload y antes de la entrega del canal,
  incluidas las respuestas enrutadas de vuelta al canal de origen. Los controladores
  se ejecutan secuencialmente y cada controlador ve el payload más reciente producido por
  los controladores de mayor prioridad.
- Los payloads de `reply_payload_sending` no exponen marcadores de confianza en tiempo de ejecución como
  `trustedLocalMedia`; los plugins pueden editar la forma del payload, pero no pueden conceder confianza a medios
  locales.
- `message_sending` puede devolver `cancelReason` y `metadata` acotados con una
  cancelación. Las nuevas API de ciclo de vida de mensajes exponen esto como un resultado de entrega suprimida
  con la razón `cancelled_by_message_sending_hook`; la entrega directa heredada
  sigue devolviendo un arreglo de resultados vacío por compatibilidad.
- `message_sent` es solo de observación. Los fallos de los controladores se registran y no
  cambian el resultado de entrega.

## Instalar hooks

Use `security.installPolicy` para decisiones de permitir/bloquear propiedad del operador. Esa
política se ejecuta desde la configuración de OpenClaw, cubre las rutas de instalación y actualización de la CLI, y falla
en modo cerrado cuando está habilitada pero no disponible.

`before_install` es un hook de ciclo de vida del entorno de ejecución de plugins. Se ejecuta después de
`security.installPolicy` solo en el proceso de OpenClaw donde los hooks de plugins ya se han cargado,
como los flujos de instalación respaldados por Gateway. Es útil para
observaciones, advertencias y comprobaciones de compatibilidad propiedad del plugin, pero no es el
límite principal de seguridad empresarial o del host para las instalaciones. El campo `builtinScan`
permanece en el payload del evento por compatibilidad, pero OpenClaw ya no
ejecuta bloqueo integrado de código peligroso en tiempo de instalación, por lo que es un resultado `ok`
vacío. Devuelva hallazgos adicionales o `{ block: true, blockReason }` para detener la
instalación en ese proceso.

`block: true` es terminal. `block: false` se trata como sin decisión.
Los fallos de los controladores bloquean la instalación en modo cerrado.

## Ciclo de vida de Gateway

Use `gateway_start` para servicios de plugins que necesitan estado propiedad de Gateway. El
contexto expone `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para
inspección y actualizaciones de cron. Use `gateway_stop` para limpiar recursos de larga ejecución.

No dependa del hook interno `gateway:startup` para servicios de tiempo de ejecución propiedad del plugin.

`cron_changed` se dispara para eventos de ciclo de vida de cron propiedad de Gateway con un payload de evento
tipado que cubre las razones `added`, `updated`, `removed`, `started`, `finished`
y `scheduled`. El evento lleva una instantánea `PluginHookGatewayCronJob`
(incluidos `state.nextRunAtMs`, `state.lastRunStatus` y
`state.lastError` cuando están presentes) más un `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Los eventos eliminados
siguen llevando la instantánea del trabajo eliminado para que los programadores externos puedan
reconciliar el estado. Use `ctx.getCron?.()` y `ctx.config` del contexto de tiempo de ejecución
al sincronizar programadores de activación externos, y mantenga OpenClaw como la
fuente de verdad para comprobaciones de vencimiento y ejecución.

## Próximas obsolescencias

Algunas superficies adyacentes a hooks están obsoletas, pero siguen siendo compatibles. Migre
antes de la próxima versión mayor:

- **Sobres de canal de texto plano** en los controladores `inbound_claim` y `message_received`.
  Lea `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar texto plano del sobre. Consulte
  [Sobres de canal de texto plano → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidad. Los plugins nuevos deberían usar
  `before_model_resolve` y `before_prompt_build` en lugar de la fase
  combinada.
- **`subagent_spawning`** permanece por compatibilidad con plugins más antiguos, pero
  los plugins nuevos no deberían devolver enrutamiento de hilos desde él. El núcleo prepara
  enlaces de subagente `thread: true` mediante adaptadores de enlace de sesión de canal
  antes de que se dispare `subagent_spawned`.
- **`deactivate`** permanece como alias de compatibilidad de limpieza obsoleto hasta
  después del 2026-08-16. Los plugins nuevos deberían usar `gateway_stop`.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de un `string` de forma libre.

Para ver la lista completa - registro de capacidades de memoria, perfil de razonamiento del proveedor,
proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores del tiempo de ejecución
de tareas y el cambio de nombre `command-auth` → `command-status` - consulte
[Migración del SDK de Plugin → Obsolescencias activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración del SDK de Plugin](/es/plugins/sdk-migration) - obsolescencias activas y cronograma de eliminación
- [Crear plugins](/es/plugins/building-plugins)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Puntos de entrada de Plugin](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Elementos internos de la arquitectura de Plugin](/es/plugins/architecture-internals)
