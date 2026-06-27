---
read_when:
    - Estás integrando el comportamiento del ciclo de vida del motor de contexto en el arnés de Codex
    - Necesitas lossless-claw u otro plugin de motor de contexto para trabajar con sesiones de arnés integradas de codex/*
    - Estás comparando el comportamiento del contexto integrado de OpenClaw y del servidor de aplicaciones de Codex
summary: Especificación para hacer que el arnés de app-server de Codex incluido respete los plugins de motor de contexto de OpenClaw
title: Puerto del motor de contexto del arnés de Codex
x-i18n:
    generated_at: "2026-06-27T11:57:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Estado

Especificación de implementación en borrador.

## Objetivo

Hacer que el arnés app-server de Codex incluido respete el mismo contrato de ciclo de vida del motor de contexto de OpenClaw que ya respetan los turnos integrados de OpenClaw.

Una sesión que use proveedor/modelo `agentRuntime.id: "codex"` o un modelo `codex/*` debería seguir permitiendo que el plugin de motor de contexto seleccionado, como `lossless-claw`, controle el ensamblado de contexto, la ingesta posterior al turno, el mantenimiento y la política de Compaction a nivel de OpenClaw en la medida en que lo permita el límite del app-server de Codex.

## No objetivos

- No reimplementar los componentes internos del app-server de Codex.
- No hacer que la Compaction nativa de hilos de Codex produzca un resumen de lossless-claw.
- No exigir que los modelos que no sean de Codex usen el arnés de Codex.
- No cambiar el comportamiento de sesiones ACP/acpx. Esta especificación es solo para la ruta del arnés de agente integrado que no es ACP.
- No hacer que plugins de terceros registren fábricas de extensiones del app-server de Codex; el límite de confianza existente del plugin incluido permanece sin cambios.

## Arquitectura actual

El bucle de ejecución integrado resuelve el motor de contexto configurado una vez por ejecución antes de seleccionar un arnés concreto de bajo nivel:

- `src/agents/embedded-agent-runner/run.ts`
  - inicializa plugins de motor de contexto
  - llama a `resolveContextEngine(params.config)`
  - pasa `contextEngine` y `contextTokenBudget` a `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega en el arnés de agente seleccionado:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

El arnés app-server de Codex lo registra el plugin de Codex incluido:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

La implementación del arnés de Codex recibe los mismos `EmbeddedRunAttemptParams` que los intentos integrados de OpenClaw:

- `extensions/codex/src/app-server/run-attempt.ts`

Eso significa que el punto de enlace requerido está en código controlado por OpenClaw. El límite externo es el propio protocolo del app-server de Codex: OpenClaw puede controlar lo que envía a `thread/start`, `thread/resume` y `turn/start`, y puede observar notificaciones, pero no puede cambiar el almacén interno de hilos de Codex ni el compactador nativo.

## Brecha actual

Los intentos integrados de OpenClaw llaman directamente al ciclo de vida del motor de contexto:

- arranque/mantenimiento antes del intento
- ensamblado antes de la llamada al modelo
- afterTurn o ingesta después del intento
- mantenimiento después de un turno exitoso
- Compaction del motor de contexto para motores que poseen la Compaction

Código relevante de OpenClaw:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Los intentos del app-server de Codex actualmente ejecutan enlaces genéricos del arnés de agente y reflejan la transcripción, pero no llaman a `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ni `params.contextEngine.maintain`.

Código relevante de Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamiento deseado

Para turnos del arnés de Codex, OpenClaw debería preservar este ciclo de vida:

1. Leer la transcripción reflejada de la sesión de OpenClaw.
2. Arrancar el motor de contexto activo cuando exista un archivo de sesión previo.
3. Ejecutar mantenimiento de arranque cuando esté disponible.
4. Ensamblar contexto usando el motor de contexto activo.
5. Convertir el contexto ensamblado en entradas compatibles con Codex.
6. Iniciar o reanudar el hilo de Codex con instrucciones para desarrollador que incluyan cualquier `systemPromptAddition` del motor de contexto.
7. Iniciar el turno de Codex con el prompt ensamblado orientado al usuario.
8. Reflejar el resultado de Codex de vuelta en la transcripción de OpenClaw.
9. Llamar a `afterTurn` si está implementado; en caso contrario, `ingestBatch`/`ingest`, usando la instantánea de transcripción reflejada.
10. Ejecutar mantenimiento de turno después de turnos exitosos no abortados.
11. Preservar las señales de Compaction nativa de Codex y los enlaces de Compaction de OpenClaw.

## Restricciones de diseño

### El app-server de Codex sigue siendo canónico para el estado nativo del hilo

Codex posee su hilo nativo y cualquier historial extendido interno. OpenClaw no debería intentar mutar el historial interno del app-server salvo mediante llamadas de protocolo admitidas.

El reflejo de transcripción de OpenClaw sigue siendo la fuente para las funciones de OpenClaw:

- historial de chat
- búsqueda
- contabilidad de `/new` y `/reset`
- cambio futuro de modelo o arnés
- estado del plugin de motor de contexto

### El ensamblado del motor de contexto debe proyectarse en entradas de Codex

La interfaz del motor de contexto devuelve `AgentMessage[]` de OpenClaw, no un parche de hilo de Codex. `turn/start` del app-server de Codex acepta una entrada de usuario actual, mientras que `thread/start` y `thread/resume` aceptan instrucciones para desarrollador.

Por lo tanto, la implementación necesita una capa de proyección. La primera versión segura debería evitar fingir que puede reemplazar el historial interno de Codex. Debería inyectar el contexto ensamblado como material determinista de prompt/instrucciones para desarrollador alrededor del turno actual.

### La estabilidad de la caché de prompts importa

Para motores como lossless-claw, el contexto ensamblado debería ser determinista para entradas sin cambios. No añadas marcas de tiempo, ids aleatorios ni ordenamiento no determinista al texto de contexto generado.

### La semántica de selección de runtime no cambia

La selección de arnés permanece como está:

- `runtime: "openclaw"` selecciona el arnés integrado de OpenClaw
- `runtime: "codex"` selecciona el arnés de Codex registrado
- `runtime: "auto"` permite que los arneses de plugins reclamen proveedores admitidos
- las ejecuciones `auto` sin coincidencia usan el arnés integrado de OpenClaw

Este trabajo cambia lo que ocurre después de que se selecciona el arnés de Codex.

## Plan de implementación

### 1. Exportar o reubicar helpers reutilizables de intentos del motor de contexto

Hoy los helpers reutilizables del ciclo de vida viven bajo el ejecutor de agente integrado:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex debería importar helpers neutrales al arnés en lugar de alcanzar detalles de implementación del ejecutor.

Crea un módulo neutral al arnés, por ejemplo:

- `src/agents/harness/context-engine-lifecycle.ts`

Mueve o reexporta:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un envoltorio pequeño alrededor de `runContextEngineMaintenance`

Actualiza los sitios de llamada del arnés integrado en el mismo PR.

Los nombres de helpers neutrales no deberían mencionar el arnés integrado.

Nombres sugeridos:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Añadir un helper de proyección de contexto de Codex

Añade un módulo nuevo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilidades:

- Aceptar los `AgentMessage[]` ensamblados, el historial reflejado original y el prompt actual.
- Determinar qué contexto pertenece a las instrucciones para desarrollador frente a la entrada de usuario actual.
- Preservar el prompt de usuario actual como la solicitud accionable final.
- Representar mensajes previos en un formato estable y explícito.
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

- Poner `systemPromptAddition` en las instrucciones para desarrollador.
- Poner el contexto de transcripción ensamblado antes del prompt actual en `promptText`.
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

Esto es menos elegante que una cirugía nativa del historial de Codex, pero es implementable dentro de OpenClaw y preserva la semántica del motor de contexto.

Mejora futura: si el app-server de Codex expone un protocolo para reemplazar o complementar el historial del hilo, cambia esta capa de proyección para usar esa API.

### 3. Conectar el arranque antes del inicio del hilo de Codex

En `extensions/codex/src/app-server/run-attempt.ts`:

- Leer el historial de sesión reflejado como hoy.
- Determinar si el archivo de sesión existía antes de esta ejecución. Preferir un helper que verifique `fs.stat(params.sessionFile)` antes de escrituras de reflejo.
- Abrir un `SessionManager` o usar un adaptador estrecho de gestor de sesión si el helper lo requiere.
- Llamar al helper de arranque neutral cuando exista `params.contextEngine`.

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

### 4. Conectar ensamblado antes de `thread/start` / `thread/resume` y `turn/start`

En `runCodexAppServerAttempt`:

1. Construir primero las herramientas dinámicas, para que el motor de contexto vea los nombres de herramientas realmente disponibles.
2. Leer el historial de sesión reflejado.
3. Ejecutar `assemble(...)` del motor de contexto cuando exista `params.contextEngine`.
4. Proyectar el resultado ensamblado en:
   - adición a instrucciones para desarrollador
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

debería volverse consciente del contexto:

1. calcular instrucciones base para desarrollador con `buildDeveloperInstructions(params)`
2. aplicar ensamblado/proyección del motor de contexto
3. ejecutar `before_prompt_build` con el prompt/instrucciones para desarrollador proyectados

Este orden permite que los enlaces genéricos de prompt vean el mismo prompt que recibirá Codex. Si necesitamos paridad estricta con OpenClaw, ejecuta el ensamblado del motor de contexto antes de la composición de enlaces, porque el arnés integrado aplica `systemPromptAddition` del motor de contexto al prompt de sistema final después de su canalización de prompt. El invariante importante es que tanto el motor de contexto como los enlaces obtengan un orden determinista y documentado.

Orden recomendado para la primera implementación:

1. `buildDeveloperInstructions(params)`
2. `assemble()` del motor de contexto
3. anexar/anteponer `systemPromptAddition` a las instrucciones para desarrollador
4. proyectar los mensajes ensamblados en texto de prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. pasar las instrucciones finales para desarrollador a `startOrResumeThread(...)`
7. pasar el texto final del prompt a `buildTurnStartParams(...)`

La especificación debería codificarse en pruebas para que los cambios futuros no lo reordenen por accidente.

### 5. Preservar el formato estable para caché de prompts

El helper de proyección debe producir salida estable byte a byte para entradas idénticas:

- orden estable de mensajes
- etiquetas de rol estables
- sin marcas de tiempo generadas
- sin fuga de orden de claves de objeto
- sin delimitadores aleatorios
- sin ids por ejecución

Usa delimitadores fijos y secciones explícitas.

### 6. Conectar el post-turno después del reflejo de transcripción

`CodexAppServerEventProjector` de Codex construye un `messagesSnapshot` local para el
turno actual. `mirrorTranscriptBestEffort(...)` escribe esa instantánea en el
espejo de transcripción de OpenClaw.

Después de que el espejado tenga éxito o falle, llama al finalizador del motor
de contexto con la mejor instantánea de mensajes disponible:

- Prefiere el contexto completo de la sesión espejada después de la escritura,
  porque `afterTurn` espera la instantánea de la sesión, no solo el turno actual.
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

Si el espejado falla, aun así llama a `afterTurn` con la instantánea de respaldo,
pero registra que el motor de contexto está ingiriendo desde datos de turno de
respaldo.

### 7. Normalizar el uso y el contexto de ejecución de caché de prompt

Los resultados de Codex incluyen uso normalizado de las notificaciones de tokens
del app-server cuando está disponible. Pasa ese uso al contexto de ejecución del
motor de contexto.

Si el app-server de Codex finalmente expone detalles de lectura/escritura de
caché, asígnalos a `ContextEnginePromptCacheInfo`. Hasta entonces, omite
`promptCache` en lugar de inventar ceros.

### 8. Política de Compaction

Hay dos sistemas de Compaction:

1. `compact()` del motor de contexto de OpenClaw
2. `thread/compact/start` nativo del app-server de Codex

No los confluyas silenciosamente.

#### `/compact` y Compaction explícita de OpenClaw

Cuando el motor de contexto seleccionado tenga `info.ownsCompaction === true`,
la Compaction explícita de OpenClaw debería preferir el resultado de `compact()`
del motor de contexto para el espejo de transcripción de OpenClaw y el estado
del plugin.

Cuando el arnés de Codex seleccionado tenga un enlace de hilo nativo, también
podemos solicitar la Compaction nativa de Codex para mantener saludable el hilo
del app-server, pero esto debe informarse como una acción de backend separada
en los detalles.

Comportamiento recomendado:

- Si `contextEngine.info.ownsCompaction === true`:
  - llama primero a `compact()` del motor de contexto
  - luego llama, en mejor esfuerzo, a la Compaction nativa de Codex cuando exista
    un enlace de hilo
  - devuelve el resultado del motor de contexto como resultado principal
  - incluye el estado de la Compaction nativa de Codex en `details.codexNativeCompaction`
- Si el motor de contexto activo no posee la Compaction:
  - conserva el comportamiento actual de Compaction nativa de Codex

Esto probablemente requiera cambiar `extensions/codex/src/app-server/compact.ts`
o envolverlo desde la ruta genérica de Compaction, según dónde se invoque
`maybeCompactAgentHarnessSession(...)`.

#### Eventos contextCompaction nativos de Codex dentro del turno

Codex puede emitir eventos de elemento `contextCompaction` durante un turno.
Mantén la emisión actual de hooks de Compaction antes/después en
`event-projector.ts`, pero no trates eso como una Compaction completada del
motor de contexto.

Para los motores que poseen la Compaction, emite un diagnóstico explícito cuando
Codex realice Compaction nativa de todos modos:

- nombre de flujo/evento: el flujo `compaction` existente es aceptable
- detalles: `{ backend: "codex-app-server", ownsCompaction: true }`

Esto hace auditable la separación.

### 9. Restablecimiento de sesión y comportamiento de enlace

El `reset(...)` existente del arnés de Codex borra el enlace del app-server de
Codex del archivo de sesión de OpenClaw. Conserva ese comportamiento.

Asegúrate también de que la limpieza del estado del motor de contexto siga
ocurriendo mediante las rutas existentes del ciclo de vida de sesión de
OpenClaw. No agregues limpieza específica de Codex a menos que el ciclo de vida
del motor de contexto omita actualmente eventos de restablecimiento/eliminación
para todos los arneses.

### 10. Manejo de errores

Sigue la semántica integrada de OpenClaw:

- los fallos de arranque advierten y continúan
- los fallos de ensamblado advierten y recurren a mensajes/prompt de canalización
  sin ensamblar
- los fallos de afterTurn/ingestión advierten y marcan la finalización posterior
  al turno como no exitosa
- el mantenimiento se ejecuta solo después de turnos exitosos, no abortados y sin
  aborto por yield
- los errores de Compaction no deberían reintentarse como prompts nuevos

Adiciones específicas de Codex:

- Si falla la proyección de contexto, advierte y recurre al prompt original.
- Si falla el espejo de transcripción, intenta aun así la finalización del motor
  de contexto con mensajes de respaldo.
- Si la Compaction nativa de Codex falla después de que la Compaction del motor
  de contexto tenga éxito, no hagas fallar toda la Compaction de OpenClaw cuando
  el motor de contexto sea el principal.

## Plan de pruebas

### Pruebas unitarias

Agrega pruebas bajo `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex llama a `bootstrap` cuando existe un archivo de sesión.
   - Codex llama a `assemble` con mensajes espejados, presupuesto de tokens,
     nombres de herramientas, modo de citas, id de modelo y prompt.
   - `systemPromptAddition` se incluye en las instrucciones de desarrollador.
   - Los mensajes ensamblados se proyectan en el prompt antes de la solicitud actual.
   - Codex llama a `afterTurn` después del espejado de transcripción.
   - Sin `afterTurn`, Codex llama a `ingestBatch` o a `ingest` por mensaje.
   - El mantenimiento del turno se ejecuta después de turnos exitosos.
   - El mantenimiento del turno no se ejecuta ante error de prompt, aborto o
     aborto por yield.

2. `context-engine-projection.test.ts`
   - salida estable para entradas idénticas
   - no duplica el prompt actual cuando el historial ensamblado lo incluye
   - maneja historial vacío
   - conserva el orden de roles
   - incluye la adición al prompt de sistema solo en las instrucciones de desarrollador

3. `compact.context-engine.test.ts`
   - gana el resultado principal del motor de contexto propietario
   - el estado de la Compaction nativa de Codex aparece en los detalles cuando
     también se intenta
   - el fallo nativo de Codex no hace fallar la Compaction del motor de contexto
     propietario
   - el motor de contexto no propietario conserva el comportamiento actual de
     Compaction nativa

### Pruebas existentes que actualizar

- `extensions/codex/src/app-server/run-attempt.test.ts` si existe; si no, las
  pruebas de ejecución del app-server de Codex más cercanas.
- `extensions/codex/src/app-server/event-projector.test.ts` solo si cambian los
  detalles del evento de Compaction.
- `src/agents/harness/selection.test.ts` no debería necesitar cambios a menos
  que cambie el comportamiento de configuración; debería permanecer estable.
- Las pruebas integradas del motor de contexto del arnés deberían seguir pasando
  sin cambios.

### Pruebas de integración / en vivo

Agrega o amplía pruebas de humo en vivo del arnés de Codex:

- configura `plugins.slots.contextEngine` con un motor de prueba
- configura `agents.defaults.model` con un modelo `codex/*`
- configura el proveedor/modelo `agentRuntime.id = "codex"`
- afirma que el motor de prueba observó:
  - bootstrap
  - assemble
  - afterTurn o ingestión
  - mantenimiento

Evita requerir lossless-claw en las pruebas de núcleo de OpenClaw. Usa un plugin
pequeño de motor de contexto falso dentro del repositorio.

## Observabilidad

Agrega registros de depuración alrededor de las llamadas del ciclo de vida del
motor de contexto de Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` con motivo
- `codex native compaction completed alongside context-engine compaction`

Evita registrar prompts completos o contenidos de transcripción.

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

Esto debería ser compatible hacia atrás:

- Si no hay motor de contexto configurado, el comportamiento heredado del motor
  de contexto debería ser equivalente al comportamiento actual del arnés de Codex.
- Si falla `assemble` del motor de contexto, Codex debería continuar con la ruta
  de prompt original.
- Los enlaces de hilo existentes de Codex deberían seguir siendo válidos.
- La huella dinámica de herramientas no debería incluir la salida del motor de
  contexto; de lo contrario, cada cambio de contexto podría forzar un hilo nuevo
  de Codex. Solo el catálogo de herramientas debería afectar la huella dinámica
  de herramientas.

## Preguntas abiertas

1. ¿El contexto ensamblado debería inyectarse por completo en el prompt de
   usuario, por completo en las instrucciones de desarrollador, o dividirse?

   Recomendación: dividirlo. Coloca `systemPromptAddition` en las instrucciones
   de desarrollador; coloca el contexto de transcripción ensamblado en el
   envoltorio del prompt de usuario. Esto encaja mejor con el protocolo actual
   de Codex sin mutar el historial de hilo nativo.

2. ¿Debería deshabilitarse la Compaction nativa de Codex cuando un motor de
   contexto posee la Compaction?

   Recomendación: no, no inicialmente. La Compaction nativa de Codex todavía
   puede ser necesaria para mantener vivo el hilo del app-server. Pero debe
   informarse como Compaction nativa de Codex, no como Compaction del motor de
   contexto.

3. ¿`before_prompt_build` debería ejecutarse antes o después del ensamblado del
   motor de contexto?

   Recomendación: después de la proyección del motor de contexto para Codex, de
   modo que los hooks genéricos del arnés vean el prompt y las instrucciones de
   desarrollador reales que recibirá Codex. Si la paridad con el arnés integrado
   requiere lo contrario, codifica el orden elegido en pruebas y documéntalo aquí.

4. ¿Puede el app-server de Codex aceptar una futura anulación estructurada de
   contexto/historial?

   Se desconoce. Si puede, reemplaza la capa de proyección de texto por ese
   protocolo y conserva sin cambios las llamadas del ciclo de vida.

## Criterios de aceptación

- Un turno de arnés embebido `codex/*` invoca el ciclo de vida `assemble` del
  motor de contexto seleccionado.
- Un `systemPromptAddition` del motor de contexto afecta las instrucciones de
  desarrollador de Codex.
- El contexto ensamblado afecta de forma determinista la entrada del turno de Codex.
- Los turnos exitosos de Codex llaman a `afterTurn` o al respaldo de ingestión.
- Los turnos exitosos de Codex ejecutan el mantenimiento de turno del motor de contexto.
- Los turnos fallidos/abortados/con aborto por yield no ejecutan mantenimiento de turno.
- La Compaction propiedad del motor de contexto sigue siendo principal para el
  estado de OpenClaw/plugin.
- La Compaction nativa de Codex sigue siendo auditable como comportamiento nativo de Codex.
- El comportamiento existente del motor de contexto del arnés integrado no cambia.
- El comportamiento existente del arnés de Codex no cambia cuando no se selecciona
  ningún motor de contexto no heredado o cuando falla el ensamblado.
