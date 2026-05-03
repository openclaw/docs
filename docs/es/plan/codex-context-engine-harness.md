---
read_when:
    - Estás integrando el comportamiento del ciclo de vida del motor de contexto en el arnés de Codex
    - Necesitas lossless-claw u otro Plugin de motor de contexto para trabajar con sesiones de arnés integradas codex/*
    - Estás comparando el comportamiento del contexto de PI integrado y del contexto del servidor de aplicaciones de Codex
summary: Especificación para hacer que el arnés de servidor de aplicaciones de Codex incluido respete los Plugins del motor de contexto de OpenClaw
title: Adaptación del motor de contexto de Codex Harness
x-i18n:
    generated_at: "2026-05-03T05:29:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Estado

Especificación de implementación en borrador.

## Objetivo

Hacer que el arnés de servidor de aplicación de Codex incluido respete el mismo contrato de ciclo de vida del motor de contexto de OpenClaw que ya respetan los turnos de PI incrustados.

Una sesión que use `agents.defaults.embeddedHarness.runtime: "codex"` o un modelo `codex/*` debe seguir permitiendo que el Plugin de motor de contexto seleccionado, como `lossless-claw`, controle el ensamblaje de contexto, la ingesta posterior al turno, el mantenimiento y la política de Compaction a nivel de OpenClaw en la medida en que lo permita el límite del servidor de aplicación de Codex.

## No objetivos

- No reimplementar los componentes internos del servidor de aplicación de Codex.
- No hacer que la Compaction nativa de hilos de Codex produzca un resumen de lossless-claw.
- No exigir que los modelos que no sean Codex usen el arnés de Codex.
- No cambiar el comportamiento de sesión ACP/acpx. Esta especificación es solo para la ruta del arnés de agente incrustado que no es ACP.
- No hacer que los Plugins de terceros registren fábricas de extensiones del servidor de aplicación de Codex; el límite de confianza existente de los Plugins incluidos permanece sin cambios.

## Arquitectura actual

El bucle de ejecución incrustado resuelve el motor de contexto configurado una vez por ejecución antes de seleccionar un arnés concreto de bajo nivel:

- `src/agents/pi-embedded-runner/run.ts`
  - inicializa Plugins de motor de contexto
  - llama a `resolveContextEngine(params.config)`
  - pasa `contextEngine` y `contextTokenBudget` a `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega al arnés de agente seleccionado:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

El arnés de servidor de aplicación de Codex lo registra el Plugin de Codex incluido:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

La implementación del arnés de Codex recibe los mismos `EmbeddedRunAttemptParams` que los intentos respaldados por PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Eso significa que el punto de enlace requerido está en código controlado por OpenClaw. El límite externo es el propio protocolo del servidor de aplicación de Codex: OpenClaw puede controlar lo que envía a `thread/start`, `thread/resume` y `turn/start`, y puede observar notificaciones, pero no puede cambiar el almacén interno de hilos ni el compactador nativo de Codex.

## Brecha actual

Los intentos de PI incrustado llaman directamente al ciclo de vida del motor de contexto:

- arranque/mantenimiento antes del intento
- ensamblaje antes de la llamada al modelo
- afterTurn o ingesta después del intento
- mantenimiento después de un turno exitoso
- Compaction del motor de contexto para motores que poseen la Compaction

Código PI relevante:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Los intentos del servidor de aplicación de Codex actualmente ejecutan enlaces genéricos del arnés de agente y reflejan la transcripción, pero no llaman a `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ni `params.contextEngine.maintain`.

Código de Codex relevante:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamiento deseado

Para los turnos del arnés de Codex, OpenClaw debe preservar este ciclo de vida:

1. Leer la transcripción reflejada de la sesión de OpenClaw.
2. Arrancar el motor de contexto activo cuando exista un archivo de sesión anterior.
3. Ejecutar el mantenimiento de arranque cuando esté disponible.
4. Ensamblar el contexto usando el motor de contexto activo.
5. Convertir el contexto ensamblado en entradas compatibles con Codex.
6. Iniciar o reanudar el hilo de Codex con instrucciones de desarrollador que incluyan cualquier `systemPromptAddition` del motor de contexto.
7. Iniciar el turno de Codex con el prompt ensamblado orientado al usuario.
8. Reflejar el resultado de Codex de vuelta en la transcripción de OpenClaw.
9. Llamar a `afterTurn` si está implementado; de lo contrario, a `ingestBatch`/`ingest`, usando la instantánea de la transcripción reflejada.
10. Ejecutar el mantenimiento de turno después de turnos exitosos no abortados.
11. Preservar las señales de Compaction nativas de Codex y los enlaces de Compaction de OpenClaw.

## Restricciones de diseño

### El servidor de aplicación de Codex sigue siendo canónico para el estado nativo del hilo

Codex posee su hilo nativo y cualquier historial extendido interno. OpenClaw no debe intentar mutar el historial interno del servidor de aplicación salvo mediante llamadas de protocolo admitidas.

El reflejo de transcripción de OpenClaw sigue siendo la fuente para las funciones de OpenClaw:

- historial de chat
- búsqueda
- contabilidad de `/new` y `/reset`
- cambios futuros de modelo o arnés
- estado del Plugin de motor de contexto

### El ensamblaje del motor de contexto debe proyectarse en entradas de Codex

La interfaz del motor de contexto devuelve `AgentMessage[]` de OpenClaw, no un parche de hilo de Codex. `turn/start` del servidor de aplicación de Codex acepta una entrada de usuario actual, mientras que `thread/start` y `thread/resume` aceptan instrucciones de desarrollador.

Por lo tanto, la implementación necesita una capa de proyección. La primera versión segura debe evitar fingir que puede reemplazar el historial interno de Codex. Debe inyectar el contexto ensamblado como material determinista de prompt/instrucción de desarrollador alrededor del turno actual.

### La estabilidad de la caché de prompt importa

Para motores como lossless-claw, el contexto ensamblado debe ser determinista para entradas sin cambios. No agregues marcas de tiempo, ids aleatorios ni ordenamientos no deterministas al texto de contexto generado.

### La semántica de selección de tiempo de ejecución no cambia

La selección de arnés permanece igual:

- `runtime: "pi"` fuerza PI
- `runtime: "codex"` selecciona el arnés de Codex registrado
- `runtime: "auto"` permite que los arneses de Plugin reclamen proveedores admitidos
- las ejecuciones `auto` sin coincidencia usan PI

Este trabajo cambia lo que ocurre después de seleccionar el arnés de Codex.

## Plan de implementación

### 1. Exportar o reubicar auxiliares reutilizables de intento de motor de contexto

Hoy los auxiliares reutilizables de ciclo de vida viven bajo el ejecutor de PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex no debe importar desde una ruta de implementación cuyo nombre implica PI si podemos evitarlo.

Crea un módulo neutral respecto al arnés, por ejemplo:

- `src/agents/harness/context-engine-lifecycle.ts`

Mueve o reexporta:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un contenedor pequeño alrededor de `runContextEngineMaintenance`

Mantén funcionando las importaciones de PI, ya sea reexportando desde los archivos antiguos o actualizando los puntos de llamada de PI en el mismo PR.

Los nombres neutrales de auxiliares no deben mencionar PI.

Nombres sugeridos:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Agregar un auxiliar de proyección de contexto de Codex

Agrega un módulo nuevo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilidades:

- Aceptar el `AgentMessage[]` ensamblado, el historial reflejado original y el prompt actual.
- Determinar qué contexto corresponde a instrucciones de desarrollador frente a la entrada de usuario actual.
- Preservar el prompt de usuario actual como la solicitud accionable final.
- Renderizar mensajes anteriores en un formato estable y explícito.
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

- Colocar `systemPromptAddition` en instrucciones de desarrollador.
- Colocar el contexto de transcripción ensamblado antes del prompt actual en `promptText`.
- Etiquetarlo claramente como contexto ensamblado de OpenClaw.
- Mantener el prompt actual al final.
- Excluir el prompt de usuario actual duplicado si ya aparece al final.

Forma de prompt de ejemplo:

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

Esto es menos elegante que una cirugía nativa del historial de Codex, pero se puede implementar dentro de OpenClaw y preserva la semántica del motor de contexto.

Mejora futura: si el servidor de aplicación de Codex expone un protocolo para reemplazar o complementar el historial del hilo, cambia esta capa de proyección para usar esa API.

### 3. Conectar el arranque antes del inicio del hilo de Codex

En `extensions/codex/src/app-server/run-attempt.ts`:

- Leer el historial reflejado de la sesión como hoy.
- Determinar si el archivo de sesión existía antes de esta ejecución. Preferir un auxiliar que revise `fs.stat(params.sessionFile)` antes de las escrituras de reflejo.
- Abrir un `SessionManager` o usar un adaptador estrecho de gestor de sesión si el auxiliar lo requiere.
- Llamar al auxiliar neutral de arranque cuando exista `params.contextEngine`.

Flujo seudocódigo:

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

Usa la misma convención de `sessionKey` que el puente de herramientas de Codex y el reflejo de transcripción. Hoy Codex calcula `sandboxSessionKey` a partir de `params.sessionKey` o `params.sessionId`; úsalo de forma coherente salvo que haya una razón para preservar el `params.sessionKey` sin procesar.

### 4. Conectar el ensamblaje antes de `thread/start` / `thread/resume` y `turn/start`

En `runCodexAppServerAttempt`:

1. Construir primero las herramientas dinámicas, para que el motor de contexto vea los nombres de herramientas realmente disponibles.
2. Leer el historial reflejado de la sesión.
3. Ejecutar `assemble(...)` del motor de contexto cuando exista `params.contextEngine`.
4. Proyectar el resultado ensamblado en:
   - adición a instrucciones de desarrollador
   - texto de prompt para `turn/start`

La llamada de enlace existente:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

debe volverse consciente del contexto:

1. calcular instrucciones de desarrollador base con `buildDeveloperInstructions(params)`
2. aplicar el ensamblaje/proyección del motor de contexto
3. ejecutar `before_prompt_build` con el prompt/instrucciones de desarrollador proyectados

Este orden permite que los enlaces genéricos de prompt vean el mismo prompt que recibirá Codex. Si necesitamos paridad estricta con PI, ejecuta el ensamblaje del motor de contexto antes de la composición de enlaces, porque PI aplica `systemPromptAddition` del motor de contexto al prompt de sistema final después de su canalización de prompt. La invariancia importante es que tanto el motor de contexto como los enlaces obtengan un orden determinista y documentado.

Orden recomendado para la primera implementación:

1. `buildDeveloperInstructions(params)`
2. `assemble()` del motor de contexto
3. anexar/anteponer `systemPromptAddition` a las instrucciones de desarrollador
4. proyectar mensajes ensamblados en texto de prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. pasar las instrucciones de desarrollador finales a `startOrResumeThread(...)`
7. pasar el texto de prompt final a `buildTurnStartParams(...)`

La especificación debe codificarse en pruebas para que futuros cambios no lo reordenen accidentalmente.

### 5. Preservar el formato estable para la caché de prompt

El auxiliar de proyección debe producir una salida estable byte a byte para entradas idénticas:

- orden estable de mensajes
- etiquetas de rol estables
- sin marcas de tiempo generadas
- sin filtración del orden de claves de objetos
- sin delimitadores aleatorios
- sin ids por ejecución

Usa delimitadores fijos y secciones explícitas.

### 6. Conectar la fase posterior al turno después del reflejo de transcripción

`CodexAppServerEventProjector` de Codex construye un `messagesSnapshot` local para el
turno actual. `mirrorTranscriptBestEffort(...)` escribe esa instantánea en el
espejo de transcripción de OpenClaw.

Después de que el espejado tenga éxito o falle, llama al finalizador del motor
de contexto con la mejor instantánea de mensajes disponible:

- Prefiere el contexto completo de la sesión espejada después de la escritura, porque `afterTurn`
  espera la instantánea de la sesión, no solo el turno actual.
- Recurre a `historyMessages + result.messagesSnapshot` si el archivo de sesión
  no puede reabrirse.

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

Si el espejado falla, aun así llama a `afterTurn` con la instantánea de reserva,
pero registra que el motor de contexto está ingiriendo datos de turno de reserva.

### 7. Normalizar el uso y el contexto de ejecución de la caché de prompts

Los resultados de Codex incluyen uso normalizado a partir de notificaciones de
tokens del servidor de aplicaciones cuando están disponibles. Pasa ese uso al
contexto de ejecución del motor de contexto.

Si el servidor de aplicaciones de Codex finalmente expone detalles de lectura/escritura
de caché, mapéalos a `ContextEnginePromptCacheInfo`. Hasta entonces, omite
`promptCache` en lugar de inventar ceros.

### 8. Política de Compaction

Hay dos sistemas de Compaction:

1. `compact()` del motor de contexto de OpenClaw
2. `thread/compact/start` nativo del servidor de aplicaciones de Codex

No los mezcles silenciosamente.

#### `/compact` y Compaction explícita de OpenClaw

Cuando el motor de contexto seleccionado tiene `info.ownsCompaction === true`, la
Compaction explícita de OpenClaw debe preferir el resultado de `compact()` del motor
de contexto para el espejo de transcripción de OpenClaw y el estado del Plugin.

Cuando el arnés de Codex seleccionado tiene un enlace de hilo nativo, también
podemos solicitar la Compaction nativa de Codex como mejor esfuerzo para mantener
saludable el hilo del servidor de aplicaciones, pero esto debe informarse como una
acción de backend separada en los detalles.

Comportamiento recomendado:

- Si `contextEngine.info.ownsCompaction === true`:
  - llama primero a `compact()` del motor de contexto
  - luego llama como mejor esfuerzo a la Compaction nativa de Codex cuando exista un enlace de hilo
  - devuelve el resultado del motor de contexto como resultado principal
  - incluye el estado de Compaction nativa de Codex en `details.codexNativeCompaction`
- Si el motor de contexto activo no es propietario de la Compaction:
  - conserva el comportamiento actual de Compaction nativa de Codex

Esto probablemente requiere cambiar `extensions/codex/src/app-server/compact.ts` o
envolverlo desde la ruta genérica de Compaction, según dónde se invoque
`maybeCompactAgentHarnessSession(...)`.

#### Eventos `contextCompaction` nativos de Codex durante el turno

Codex puede emitir eventos de elemento `contextCompaction` durante un turno. Mantén
la emisión actual de hooks de Compaction antes/después en `event-projector.ts`, pero
no la trates como una Compaction del motor de contexto completada.

Para motores que son propietarios de la Compaction, emite un diagnóstico explícito
cuando Codex realice Compaction nativa de todos modos:

- nombre de flujo/evento: el flujo `compaction` existente es aceptable
- detalles: `{ backend: "codex-app-server", ownsCompaction: true }`

Esto hace que la separación sea auditable.

### 9. Restablecimiento de sesión y comportamiento de enlace

El `reset(...)` del arnés de Codex existente borra el enlace del servidor de
aplicaciones de Codex del archivo de sesión de OpenClaw. Conserva ese comportamiento.

Asegúrate también de que la limpieza del estado del motor de contexto siga
ocurriendo mediante las rutas existentes del ciclo de vida de sesiones de OpenClaw.
No agregues limpieza específica de Codex a menos que el ciclo de vida del motor
de contexto omita actualmente eventos de restablecimiento/eliminación para todos
los arneses.

### 10. Manejo de errores

Sigue la semántica de PI:

- los fallos de inicialización advierten y continúan
- los fallos de ensamblaje advierten y vuelven a mensajes/prompt de canalización sin ensamblar
- los fallos de `afterTurn`/ingesta advierten y marcan la finalización posterior al turno como no exitosa
- el mantenimiento se ejecuta solo después de turnos exitosos, no abortados y sin yield
- los errores de Compaction no deben reintentarse como prompts nuevos

Adiciones específicas de Codex:

- Si falla la proyección de contexto, advierte y vuelve al prompt original.
- Si falla el espejo de transcripción, intenta igualmente la finalización del motor de contexto con
  mensajes de reserva.
- Si la Compaction nativa de Codex falla después de que la Compaction del motor de contexto tenga éxito,
  no hagas fallar toda la Compaction de OpenClaw cuando el motor de contexto sea el principal.

## Plan de pruebas

### Pruebas unitarias

Agrega pruebas en `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex llama a `bootstrap` cuando existe un archivo de sesión.
   - Codex llama a `assemble` con mensajes espejados, presupuesto de tokens, nombres de herramientas,
     modo de citas, id de modelo y prompt.
   - `systemPromptAddition` se incluye en las instrucciones para desarrolladores.
   - Los mensajes ensamblados se proyectan en el prompt antes de la solicitud actual.
   - Codex llama a `afterTurn` después del espejado de transcripción.
   - Sin `afterTurn`, Codex llama a `ingestBatch` o a `ingest` por mensaje.
   - El mantenimiento del turno se ejecuta después de turnos exitosos.
   - El mantenimiento del turno no se ejecuta en error de prompt, aborto o aborto por yield.

2. `context-engine-projection.test.ts`
   - salida estable para entradas idénticas
   - no duplica el prompt actual cuando el historial ensamblado lo incluye
   - maneja historial vacío
   - conserva el orden de roles
   - incluye la adición al prompt del sistema solo en las instrucciones para desarrolladores

3. `compact.context-engine.test.ts`
   - el resultado principal del motor de contexto propietario prevalece
   - el estado de Compaction nativa de Codex aparece en los detalles cuando también se intenta
   - el fallo nativo de Codex no hace fallar la Compaction del motor de contexto propietario
   - el motor de contexto no propietario conserva el comportamiento actual de Compaction nativa

### Pruebas existentes que actualizar

- `extensions/codex/src/app-server/run-attempt.test.ts` si existe; de lo contrario,
  las pruebas de ejecución del servidor de aplicaciones de Codex más cercanas.
- `extensions/codex/src/app-server/event-projector.test.ts` solo si cambian los detalles de eventos
  de Compaction.
- `src/agents/harness/selection.test.ts` no debería requerir cambios a menos que cambie el
  comportamiento de configuración; debe permanecer estable.
- Las pruebas del motor de contexto de PI deben seguir pasando sin cambios.

### Pruebas de integración / en vivo

Agrega o amplía pruebas smoke en vivo del arnés de Codex:

- configura `plugins.slots.contextEngine` con un motor de prueba
- configura `agents.defaults.model` con un modelo `codex/*`
- configura `agents.defaults.embeddedHarness.runtime = "codex"`
- afirma que el motor de prueba observó:
  - bootstrap
  - assemble
  - afterTurn o ingesta
  - mantenimiento

Evita requerir lossless-claw en las pruebas centrales de OpenClaw. Usa un Plugin
pequeño y falso de motor de contexto dentro del repositorio.

## Observabilidad

Agrega registros de depuración alrededor de las llamadas del ciclo de vida del
motor de contexto de Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` con motivo
- `codex native compaction completed alongside context-engine compaction`

Evita registrar prompts completos o contenido de transcripciones.

Agrega campos estructurados donde sea útil:

- `sessionId`
- `sessionKey` redactado u omitido según la práctica de registro existente
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migración / compatibilidad

Esto debe ser compatible hacia atrás:

- Si no hay un motor de contexto configurado, el comportamiento del motor de contexto heredado debe ser
  equivalente al comportamiento actual del arnés de Codex.
- Si `assemble` del motor de contexto falla, Codex debe continuar con la ruta de
  prompt original.
- Los enlaces de hilo de Codex existentes deben seguir siendo válidos.
- La huella dinámica de herramientas no debe incluir la salida del motor de contexto; de lo contrario,
  cada cambio de contexto podría forzar un nuevo hilo de Codex. Solo el catálogo de herramientas
  debe afectar a la huella dinámica de herramientas.

## Preguntas abiertas

1. ¿Debe el contexto ensamblado inyectarse por completo en el prompt de usuario, por completo
   en las instrucciones para desarrolladores, o dividirse?

   Recomendación: dividirlo. Pon `systemPromptAddition` en las instrucciones para desarrolladores;
   pon el contexto de transcripción ensamblado en el envoltorio del prompt de usuario. Esto encaja mejor
   con el protocolo actual de Codex sin mutar el historial de hilos nativo.

2. ¿Debe deshabilitarse la Compaction nativa de Codex cuando un motor de contexto es propietario de
   la Compaction?

   Recomendación: no, no inicialmente. La Compaction nativa de Codex aún puede ser
   necesaria para mantener vivo el hilo del servidor de aplicaciones. Pero debe informarse como
   Compaction nativa de Codex, no como Compaction del motor de contexto.

3. ¿Debe `before_prompt_build` ejecutarse antes o después del ensamblaje del motor de contexto?

   Recomendación: después de la proyección del motor de contexto para Codex, para que los hooks genéricos
   del arnés vean el prompt/instrucciones para desarrolladores reales que Codex recibirá. Si la
   paridad con PI requiere lo contrario, codifica el orden elegido en las pruebas y documéntalo
   aquí.

4. ¿Puede el servidor de aplicaciones de Codex aceptar una futura anulación estructurada de contexto/historial?

   Desconocido. Si puede, reemplaza la capa de proyección de texto con ese protocolo y
   conserva las llamadas del ciclo de vida sin cambios.

## Criterios de aceptación

- Un turno de arnés embebido `codex/*` invoca el ciclo de vida `assemble` del motor de contexto seleccionado.
- Un `systemPromptAddition` del motor de contexto afecta las instrucciones para desarrolladores de Codex.
- El contexto ensamblado afecta de forma determinista la entrada del turno de Codex.
- Los turnos exitosos de Codex llaman a `afterTurn` o a la ingesta de reserva.
- Los turnos exitosos de Codex ejecutan el mantenimiento de turno del motor de contexto.
- Los turnos fallidos/abortados/abortados por yield no ejecutan mantenimiento de turno.
- La Compaction propiedad del motor de contexto sigue siendo principal para el estado de OpenClaw/Plugin.
- La Compaction nativa de Codex sigue siendo auditable como comportamiento nativo de Codex.
- El comportamiento existente del motor de contexto de PI no cambia.
- El comportamiento existente del arnés de Codex no cambia cuando no se selecciona ningún motor de contexto no heredado
  o cuando falla el ensamblaje.
