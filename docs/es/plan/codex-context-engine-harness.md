---
read_when:
    - Estás conectando el comportamiento del ciclo de vida del motor de contexto al harness de Codex
    - Necesitas que lossless-claw u otro Plugin de motor de contexto funcione con sesiones del harness incrustado codex/*
    - Estás comparando el comportamiento de contexto de PI incrustado y de app-server de Codex
summary: Especificación para hacer que el harness de app-server de Codex incluido respete los Plugins de motor de contexto de OpenClaw
title: Port del motor de contexto del harness de Codex
x-i18n:
    generated_at: "2026-04-24T05:37:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Port del motor de contexto del harness de Codex

## Estado

Borrador de especificación de implementación.

## Objetivo

Hacer que el harness de app-server de Codex incluido respete el mismo contrato de
ciclo de vida del motor de contexto de OpenClaw que ya respetan los turnos de PI incrustado.

Una sesión que use `agents.defaults.embeddedHarness.runtime: "codex"` o un
modelo `codex/*` debería seguir permitiendo que el Plugin de motor de contexto seleccionado, como
`lossless-claw`, controle el ensamblaje de contexto, la ingesta posterior al turno, el
mantenimiento y la política de Compaction a nivel de OpenClaw en la medida en que lo permita el límite del app-server de Codex.

## No objetivos

- No reimplementar los componentes internos del app-server de Codex.
- No hacer que la Compaction nativa de hilos de Codex produzca un resumen de lossless-claw.
- No exigir que los modelos que no sean Codex usen el harness de Codex.
- No cambiar el comportamiento de sesiones de ACP/acpx. Esta especificación es para la
  ruta de harness de agente incrustado no ACP únicamente.
- No hacer que Plugins de terceros registren fábricas de extensiones del app-server de Codex;
  el límite de confianza existente del Plugin incluido permanece sin cambios.

## Arquitectura actual

El bucle de ejecución incrustado resuelve el motor de contexto configurado una vez por ejecución antes de
seleccionar un harness concreto de bajo nivel:

- `src/agents/pi-embedded-runner/run.ts`
  - inicializa Plugins de motor de contexto
  - llama a `resolveContextEngine(params.config)`
  - pasa `contextEngine` y `contextTokenBudget` a
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega al harness de agente seleccionado:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

El harness de app-server de Codex está registrado por el Plugin Codex incluido:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

La implementación del harness de Codex recibe los mismos `EmbeddedRunAttemptParams`
que los intentos respaldados por PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Eso significa que el punto de enganche requerido está en código controlado por OpenClaw. El límite
externo es el propio protocolo del app-server de Codex: OpenClaw puede controlar lo que envía a
`thread/start`, `thread/resume` y `turn/start`, y puede observar
notificaciones, pero no puede cambiar el almacén interno de hilos de Codex ni el compactor nativo.

## Brecha actual

Los intentos de PI incrustado llaman directamente al ciclo de vida del motor de contexto:

- bootstrap/mantenimiento antes del intento
- assemble antes de la llamada al modelo
- afterTurn o ingest después del intento
- mantenimiento después de un turno correcto
- Compaction del motor de contexto para motores que poseen la Compaction

Código PI relevante:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Los intentos actuales del app-server de Codex ejecutan hooks genéricos de harness de agente y reflejan
la transcripción, pero no llaman a `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, ni
`params.contextEngine.maintain`.

Código Codex relevante:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamiento deseado

Para los turnos del harness de Codex, OpenClaw debería preservar este ciclo de vida:

1. Leer la transcripción reflejada de la sesión de OpenClaw.
2. Inicializar el motor de contexto activo cuando exista un archivo de sesión previo.
3. Ejecutar mantenimiento de bootstrap cuando esté disponible.
4. Ensamblar contexto usando el motor de contexto activo.
5. Convertir el contexto ensamblado en entradas compatibles con Codex.
6. Iniciar o reanudar el hilo de Codex con instrucciones para desarrolladores que incluyan cualquier
   `systemPromptAddition` del motor de contexto.
7. Iniciar el turno de Codex con el prompt ensamblado orientado al usuario.
8. Reflejar el resultado de Codex de vuelta en la transcripción de OpenClaw.
9. Llamar a `afterTurn` si está implementado; en caso contrario, a `ingestBatch`/`ingest`, usando la
   instantánea de la transcripción reflejada.
10. Ejecutar mantenimiento de turno después de turnos correctos y no abortados.
11. Preservar las señales de Compaction nativa de Codex y los hooks de Compaction de OpenClaw.

## Restricciones de diseño

### El app-server de Codex sigue siendo canónico para el estado nativo del hilo

Codex es dueño de su hilo nativo y de cualquier historial extendido interno. OpenClaw no debería
intentar mutar el historial interno del app-server excepto mediante llamadas de protocolo compatibles.

El reflejo de la transcripción de OpenClaw sigue siendo la fuente para las funciones de OpenClaw:

- historial de chat
- búsqueda
- contabilidad de `/new` y `/reset`
- futuros cambios de modelo o de harness
- estado del Plugin de motor de contexto

### El ensamblaje del motor de contexto debe proyectarse en entradas de Codex

La interfaz del motor de contexto devuelve `AgentMessage[]` de OpenClaw, no un parche de hilo de Codex. Codex app-server `turn/start` acepta una entrada de usuario actual, mientras que
`thread/start` y `thread/resume` aceptan instrucciones para desarrolladores.

Por lo tanto, la implementación necesita una capa de proyección. La primera versión segura
debería evitar fingir que puede reemplazar el historial interno de Codex. Debería inyectar
el contexto ensamblado como material determinista de prompt/instrucciones para desarrolladores alrededor
del turno actual.

### La estabilidad de la caché de prompt importa

Para motores como lossless-claw, el contexto ensamblado debería ser determinista
cuando las entradas no cambian. No añadir marcas de tiempo, identificadores aleatorios ni
orden no determinista al texto de contexto generado.

### La semántica de reserva de PI no cambia

La selección de harness sigue igual:

- `runtime: "pi"` fuerza PI
- `runtime: "codex"` selecciona el harness de Codex registrado
- `runtime: "auto"` deja que los harness de Plugin reclamen proveedores compatibles
- `fallback: "none"` desactiva la reserva a PI cuando ningún harness de Plugin coincide

Este trabajo cambia lo que ocurre después de seleccionar el harness de Codex.

## Plan de implementación

### 1. Exportar o reubicar helpers reutilizables del intento del motor de contexto

Hoy los helpers reutilizables del ciclo de vida viven bajo el ejecutor PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex no debería importar desde una ruta de implementación cuyo nombre implique PI si podemos
evitarlo.

Crear un módulo neutral al harness, por ejemplo:

- `src/agents/harness/context-engine-lifecycle.ts`

Mover o reexportar:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un pequeño wrapper alrededor de `runContextEngineMaintenance`

Mantener funcionando las importaciones de PI ya sea reexportando desde los archivos antiguos o actualizando los sitios de llamada de PI en el mismo PR.

Los nombres neutrales de los helpers no deberían mencionar PI.

Nombres sugeridos:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Añadir un helper de proyección de contexto para Codex

Añadir un nuevo módulo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilidades:

- Aceptar los `AgentMessage[]` ensamblados, el historial original reflejado y el
  prompt actual.
- Determinar qué contexto pertenece a instrucciones para desarrolladores frente a la
  entrada actual del usuario.
- Preservar el prompt actual del usuario como la solicitud procesable final.
- Renderizar mensajes previos en un formato estable y explícito.
- Evitar metadatos volátiles.

API propuesta:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Primera proyección recomendada:

- Poner `systemPromptAddition` en las instrucciones para desarrolladores.
- Poner el contexto de la transcripción ensamblada antes del prompt actual en `promptText`.
- Etiquetarlo claramente como contexto ensamblado por OpenClaw.
- Mantener el prompt actual al final.
- Excluir el prompt actual del usuario si está duplicado y ya aparece al final.

Ejemplo de forma del prompt:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Esto es menos elegante que la cirugía nativa de historial de Codex, pero es implementable
dentro de OpenClaw y preserva la semántica del motor de contexto.

Mejora futura: si el app-server de Codex expone un protocolo para reemplazar o
complementar el historial del hilo, cambiar esta capa de proyección para usar esa API.

### 3. Conectar bootstrap antes del inicio del hilo de Codex

En `extensions/codex/src/app-server/run-attempt.ts`:

- Leer el historial reflejado de la sesión como hoy.
- Determinar si el archivo de sesión existía antes de esta ejecución. Preferir un helper
  que compruebe `fs.stat(params.sessionFile)` antes de las escrituras de reflejo.
- Abrir un `SessionManager` o usar un adaptador estrecho de gestor de sesión si el helper
  lo requiere.
- Llamar al helper neutral de bootstrap cuando exista `params.contextEngine`.

Pseudoflujo:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Usar la misma convención `sessionKey` que el puente de herramientas de Codex y el
reflejo de la transcripción. Hoy Codex calcula `sandboxSessionKey` a partir de `params.sessionKey` o
`params.sessionId`; usar eso de forma consistente a menos que haya una razón para preservar
`params.sessionKey` sin procesar.

### 4. Conectar assemble antes de `thread/start` / `thread/resume` y `turn/start`

En `runCodexAppServerAttempt`:

1. Construir primero las herramientas dinámicas, para que el motor de contexto vea los nombres
   reales de herramientas disponibles.
2. Leer el historial reflejado de la sesión.
3. Ejecutar `assemble(...)` del motor de contexto cuando exista `params.contextEngine`.
4. Proyectar el resultado ensamblado en:
   - adición de instrucciones para desarrolladores
   - texto del prompt para `turn/start`

La llamada existente al hook:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

debería pasar a ser consciente del contexto:

1. calcular las instrucciones base para desarrolladores con `buildDeveloperInstructions(params)`
2. aplicar ensamblaje/proyección del motor de contexto
3. ejecutar `before_prompt_build` con el prompt/instrucciones para desarrolladores proyectados

Este orden permite que los hooks genéricos de prompt vean el mismo prompt que recibirá Codex. Si
necesitamos una paridad estricta con PI, ejecutar el ensamblaje del motor de contexto antes de la composición de hooks,
porque PI aplica `systemPromptAddition` del motor de contexto al system prompt final después de su pipeline de prompt. La invariante importante es que tanto el motor de contexto como los hooks obtengan un orden determinista y documentado.

Orden recomendado para la primera implementación:

1. `buildDeveloperInstructions(params)`
2. `assemble()` del motor de contexto
3. añadir anteponer `systemPromptAddition` a las instrucciones para desarrolladores
4. proyectar los mensajes ensamblados en el texto del prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. pasar las instrucciones finales para desarrolladores a `startOrResumeThread(...)`
7. pasar el texto final del prompt a `buildTurnStartParams(...)`

La especificación debería codificarse en pruebas para que cambios futuros no reordenen esto por accidente.

### 5. Preservar el formato estable de la caché de prompt

El helper de proyección debe producir una salida estable a nivel de bytes para entradas idénticas:

- orden estable de mensajes
- etiquetas de rol estables
- sin marcas de tiempo generadas
- sin fuga del orden de claves de objetos
- sin delimitadores aleatorios
- sin identificadores por ejecución

Usar delimitadores fijos y secciones explícitas.

### 6. Conectar el procesamiento posterior al turno después del reflejo de la transcripción

`CodexAppServerEventProjector` de Codex construye una `messagesSnapshot` local para el
turno actual. `mirrorTranscriptBestEffort(...)` escribe esa instantánea en el reflejo de transcripción de OpenClaw.

Después de que el reflejo tenga éxito o falle, llama al finalizador del motor de contexto con la
mejor instantánea de mensajes disponible:

- Prefiere el contexto completo de la sesión reflejada después de la escritura, porque `afterTurn`
  espera la instantánea de sesión, no solo el turno actual.
- Recurre a `historyMessages + result.messagesSnapshot` si no se puede volver a abrir el archivo de sesión.

Pseudoflujo:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Si el reflejo falla, sigue llamando a `afterTurn` con la instantánea de reserva, pero registra
que el motor de contexto está ingiriendo desde datos de turno de reserva.

### 7. Normalizar uso y contexto de tiempo de ejecución de caché de prompt

Los resultados de Codex incluyen uso normalizado a partir de notificaciones de tokens del app-server cuando
están disponibles. Pasa ese uso al contexto de tiempo de ejecución del motor de contexto.

Si el app-server de Codex acaba exponiendo detalles de lectura/escritura de caché, asígnalos a
`ContextEnginePromptCacheInfo`. Hasta entonces, omite `promptCache` en lugar de
inventar ceros.

### 8. Política de Compaction

Hay dos sistemas de Compaction:

1. `compact()` del motor de contexto de OpenClaw
2. `thread/compact/start` nativo del app-server de Codex

No los confundas silenciosamente.

#### `/compact` y Compaction explícita de OpenClaw

Cuando el motor de contexto seleccionado tiene `info.ownsCompaction === true`, la
Compaction explícita de OpenClaw debería preferir el resultado de `compact()` del motor de contexto para
el reflejo de transcripción de OpenClaw y el estado del Plugin.

Cuando el harness activo de Codex tiene un enlace de hilo nativo, también podemos
solicitar Compaction nativa de Codex para mantener sano el hilo del app-server, pero esto
debe informarse como una acción de backend separada en los detalles.

Comportamiento recomendado:

- Si `contextEngine.info.ownsCompaction === true`:
  - llamar primero a `compact()` del motor de contexto
  - luego llamar a la Compaction nativa de Codex en modo de mejor esfuerzo cuando exista un enlace de hilo
  - devolver el resultado del motor de contexto como resultado principal
  - incluir el estado de Compaction nativa de Codex en `details.codexNativeCompaction`
- Si el motor de contexto activo no posee la Compaction:
  - preservar el comportamiento actual de Compaction nativa de Codex

Esto probablemente requiera cambiar `extensions/codex/src/app-server/compact.ts` o
envolverlo desde la ruta genérica de Compaction, dependiendo de dónde se invoque
`maybeCompactAgentHarnessSession(...)`.

#### Eventos nativos `contextCompaction` dentro del turno de Codex

Codex puede emitir eventos de elemento `contextCompaction` durante un turno. Mantén la emisión actual
de hooks before/after compaction en `event-projector.ts`, pero no trates eso
como una Compaction completada del motor de contexto.

Para motores que poseen la Compaction, emite un diagnóstico explícito cuando Codex realice
Compaction nativa de todos modos:

- nombre de stream/evento: el stream existente `compaction` es aceptable
- detalles: `{ backend: "codex-app-server", ownsCompaction: true }`

Esto hace auditable la separación.

### 9. Comportamiento de restablecimiento de sesión y enlaces

El `reset(...)` existente del harness de Codex borra el enlace del app-server de Codex del
archivo de sesión de OpenClaw. Conserva ese comportamiento.

Asegúrate también de que la limpieza del estado del motor de contexto siga ocurriendo a través de las rutas existentes
del ciclo de vida de sesión de OpenClaw. No añadas limpieza específica de Codex a menos que el
ciclo de vida del motor de contexto actualmente pierda eventos de restablecimiento/eliminación para todos los harnesses.

### 10. Gestión de errores

Sigue la semántica de PI:

- los fallos de bootstrap registran advertencia y continúan
- los fallos de assemble registran advertencia y vuelven a los mensajes/prompt no ensamblados del pipeline
- los fallos de afterTurn/ingest registran advertencia y marcan la finalización posterior al turno como no satisfactoria
- el mantenimiento se ejecuta solo después de turnos correctos, no abortados y sin yield
- los errores de Compaction no deberían reintentarse como prompts nuevos

Adiciones específicas de Codex:

- Si falla la proyección de contexto, registrar advertencia y volver al prompt original.
- Si falla el reflejo de transcripción, seguir intentando la finalización del motor de contexto con
  mensajes de reserva.
- Si falla la Compaction nativa de Codex después de que la Compaction del motor de contexto tenga éxito,
  no hacer fallar toda la Compaction de OpenClaw cuando el motor de contexto sea el principal.

## Plan de pruebas

### Pruebas unitarias

Añadir pruebas bajo `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex llama a `bootstrap` cuando existe un archivo de sesión.
   - Codex llama a `assemble` con mensajes reflejados, presupuesto de tokens, nombres de herramientas,
     modo de citas, id de modelo y prompt.
   - `systemPromptAddition` se incluye en las instrucciones para desarrolladores.
   - Los mensajes ensamblados se proyectan en el prompt antes de la solicitud actual.
   - Codex llama a `afterTurn` después del reflejo de la transcripción.
   - Sin `afterTurn`, Codex llama a `ingestBatch` o a `ingest` por mensaje.
   - El mantenimiento del turno se ejecuta después de turnos correctos.
   - El mantenimiento del turno no se ejecuta en error de prompt, aborto o yield abortado.

2. `context-engine-projection.test.ts`
   - salida estable para entradas idénticas
   - sin duplicar el prompt actual cuando el historial ensamblado ya lo incluye
   - maneja historial vacío
   - preserva el orden de roles
   - incluye system prompt addition solo en instrucciones para desarrolladores

3. `compact.context-engine.test.ts`
   - prevalece el resultado principal del motor de contexto propietario
   - el estado de Compaction nativa de Codex aparece en los detalles cuando también se intenta
   - el fallo nativo de Codex no hace fallar la Compaction del motor de contexto propietario
   - un motor de contexto no propietario preserva el comportamiento actual de Compaction nativa

### Pruebas existentes a actualizar

- `extensions/codex/src/app-server/run-attempt.test.ts` si existe; de lo contrario,
  las pruebas de ejecución del app-server de Codex más cercanas.
- `extensions/codex/src/app-server/event-projector.test.ts` solo si cambian los detalles
  del evento de Compaction.
- `src/agents/harness/selection.test.ts` no debería necesitar cambios salvo que cambie el
  comportamiento de configuración; debería permanecer estable.
- Las pruebas del motor de contexto de PI deberían seguir pasando sin cambios.

### Pruebas de integración / en vivo

Añadir o ampliar pruebas smoke del harness de Codex en vivo:

- configurar `plugins.slots.contextEngine` con un motor de prueba
- configurar `agents.defaults.model` con un modelo `codex/*`
- configurar `agents.defaults.embeddedHarness.runtime = "codex"`
- afirmar que el motor de prueba observó:
  - bootstrap
  - assemble
  - afterTurn o ingest
  - mantenimiento

Evitar exigir lossless-claw en las pruebas core de OpenClaw. Usar un pequeño
Plugin falso de motor de contexto dentro del repositorio.

## Observabilidad

Añadir registros de depuración alrededor de llamadas del ciclo de vida del motor de contexto de Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` con motivo
- `codex native compaction completed alongside context-engine compaction`

Evitar registrar prompts completos o contenido de transcripciones.

Añadir campos estructurados cuando sea útil:

- `sessionId`
- `sessionKey` redactado u omitido según la práctica existente de registro
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migración / compatibilidad

Esto debería ser retrocompatible:

- Si no hay ningún motor de contexto configurado, el comportamiento heredado del motor de contexto debería ser
  equivalente al comportamiento actual del harness de Codex.
- Si `assemble` del motor de contexto falla, Codex debería continuar con la ruta del
  prompt original.
- Los enlaces de hilo existentes de Codex deberían seguir siendo válidos.
- La huella digital dinámica de herramientas no debería incluir la salida del motor de contexto; de lo contrario
  cada cambio de contexto podría forzar un nuevo hilo de Codex. Solo el catálogo de herramientas
  debería afectar a la huella digital dinámica de herramientas.

## Preguntas abiertas

1. ¿Debería inyectarse el contexto ensamblado por completo en el prompt del usuario, por completo
   en las instrucciones para desarrolladores o dividirse?

   Recomendación: dividirlo. Poner `systemPromptAddition` en las instrucciones para desarrolladores;
   poner el contexto de transcripción ensamblado en el envoltorio del prompt del usuario. Esto encaja mejor
   con el protocolo actual de Codex sin mutar el historial nativo del hilo.

2. ¿Debería deshabilitarse la Compaction nativa de Codex cuando un motor de contexto posee la
   Compaction?

   Recomendación: no, al menos inicialmente. La Compaction nativa de Codex aún puede ser
   necesaria para mantener vivo el hilo del app-server. Pero debe informarse como
   Compaction nativa de Codex, no como Compaction del motor de contexto.

3. ¿Debería ejecutarse `before_prompt_build` antes o después del ensamblaje del motor de contexto?

   Recomendación: después de la proyección del motor de contexto para Codex, de modo que los hooks
   genéricos del harness vean el prompt/instrucciones para desarrolladores reales que recibirá Codex. Si la paridad con PI
   requiere lo contrario, codifica el orden elegido en pruebas y documéntalo
   aquí.

4. ¿Puede el app-server de Codex aceptar en el futuro una anulación estructurada de contexto/historial?

   Desconocido. Si puede, reemplaza la capa de proyección de texto por ese protocolo y
   mantén sin cambios las llamadas del ciclo de vida.

## Criterios de aceptación

- Un turno de harness incrustado `codex/*` invoca el ciclo de vida `assemble`
  del motor de contexto seleccionado.
- Un `systemPromptAddition` del motor de contexto afecta a las instrucciones para desarrolladores de Codex.
- El contexto ensamblado afecta determinísticamente a la entrada del turno de Codex.
- Los turnos correctos de Codex llaman a `afterTurn` o a la reserva de ingest.
- Los turnos correctos de Codex ejecutan mantenimiento de turno del motor de contexto.
- Los turnos fallidos/abortados/yield-abortados no ejecutan mantenimiento de turno.
- La Compaction propiedad del motor de contexto sigue siendo la principal para el estado de OpenClaw/Plugin.
- La Compaction nativa de Codex sigue siendo auditable como comportamiento nativo de Codex.
- El comportamiento existente del motor de contexto de PI no cambia.
- El comportamiento existente del harness de Codex no cambia cuando no se selecciona ningún motor de contexto no heredado
  o cuando falla el ensamblaje.
