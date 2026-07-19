---
x-i18n:
    generated_at: "2026-07-19T13:36:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 90c6c85a837448f4e5ceccdccf73489db801ad502cbbb2f3eb04d6aff7e902f0
    source_path: plan/swarms.md
    workflow: 16
---

# Swarms — distribución entre agentes y orquestación en modo de código

Estado: Publicado — sustituido por `docs/tools/swarm.md`. Este documento se conserva como
registro del diseño de implementación.

## 1. Qué es y por qué

Un **swarm** consiste en numerosos subagentes orquestados de forma determinista desde un script
en modo de código: distribuir el trabajo entre N lectores, verificar los hallazgos de forma adversarial, sintetizar mediante un
priorizador con estado e iterar sobre puertas de decisión. El flujo de control (`Promise.all`,
`while`, `if`) _es_ la orquestación; deliberadamente **no hay un DSL de grafos,
ningún modo nuevo ni una nueva superficie de herramientas de nivel superior**.

El modo de código de OpenClaw (QuickJS-WASI, instantáneas/reanudación, solicitudes de puente) es el
sustrato. Una llamada de puente en espera sobrevive a una instantánea de la VM, al reinicio del Gateway y
se reanuda exactamente donde se detuvo; esto es más robusto que los diseños de reproducción de diarios y
no impone restricciones de determinismo a los scripts.

Nomenclatura: el nombre en el producto y la documentación es **Swarm**. Los identificadores de código se mantienen literales:
API invitada `agents.*`, configuración `tools.swarm`, columnas de grupo `swarm`.

## 2. Decisiones (responsable de mantenimiento, 2026-07-17)

- Coste: límites de configuración aplicados; presupuesto de tokens por swarm opcional. Ningún presupuesto obligatorio.
- Aprobaciones: los hijos se ejecutan con **cierre seguro / sin interacción**. Las acciones que requieren
  aprobación se rechazan; el rechazo se comunica en el resultado del hijo; el script
  decide. No se abruma al operador con solicitudes de la distribución.
- La v1 solo admite scripts ad hoc escritos por el modelo. Flujos de trabajo guardados o con nombre, entrada
  mediante CLI/cron: más adelante (el modo de código sin interfaz ya existe para cron).
- Identidad del hijo: agente de trabajo dedicado de forma predeterminada mediante la configuración `tools.swarm.defaultAgentId`
  (validada con la lista de destinos de subagentes permitidos existente); sustitución
  `agentId` por creación. El núcleo no incluye ningún id de agente integrado; la documentación recomienda una configuración
  ligera del agente `worker`.
- No se modifica el código fuente de Codex. El arnés de Codex utiliza el patrón de creación/espera (§8).

## 3. Descripción general de la arquitectura

```
script en modo de código (VM QuickJS, Gateway)       script V8 de Codex (proceso de Codex)
  agents.run(...) ── llamada de puente en espera       tools.sessions_spawn / tools.agents_wait
        │                                                │ RPC de elemento/herramienta/llamada (≤600s cada una)
        ▼                                                ▼
             NÚCLEO (independiente del arnés, este repositorio)
  sessions_spawn {collect:true, outputSchema, fastMode, groupId}
  agents_wait {ids, timeoutSeconds}
        │
  registro de subagentes (SQLite): registros de finalización del recopilador, id del grupo de swarm
        │
  hijos = sesiones de subagentes ordinarias (con límite de carril y aprobaciones con cierre seguro)
        │
  SSE sessions.changed ──► puntos de la interfaz de control / barra lateral / mensaje de estado del canal
```

Un único propietario canónico de la semántica de creación/finalización/resolución (herramientas del núcleo + registro).
Dos transportes de espera: QuickJS mantiene una llamada de puente en espera indefinidamente (instantánea);
Codex consulta `agents_wait` mediante RPC limitadas.

## 4. Puerta de configuración (v1)

Nueva `tools.swarm` (sustitución global + por agente, con el mismo patrón de combinación que
`tools.codeMode`):

```jsonc
"tools": {
  "swarm": {
    "enabled": false,            // master gate, default OFF
    "maxConcurrent": 8,          // children running at once (swarm lane cap)
    "maxChildrenPerGroup": 50,   // live children per swarm group
    "maxTotalPerGroup": 200,     // lifetime spawn count per group (runaway backstop)
    "waitTimeoutSecondsMax": 600,
    "defaultAgentId": ""         // optional; child agent id when spawn omits agentId
  }
}
```

- Zod: unión `boolean | strict object` como `CodeModeSchema`
  (`src/config/zod-schema.agent-runtime.ts`); `swarm: true` → `{enabled: true}`.
- Tipos en `src/config/types.tools.ts` (tanto por agente como `tools` de nivel superior),
  etiquetas en `schema.labels.ts`, ayuda en `schema.help.runtime.ts`.
- Función auxiliar de resolución `resolveSwarmConfig(cfg, agentId)` que refleja
  `resolveCodeModeConfig` (`src/agents/code-mode.ts:215`) y limita todos los números.
- Efectos de la puerta cuando está deshabilitada: la herramienta `agents_wait` no aparece en los catálogos;
  los parámetros `collect`/`outputSchema`/`fastMode`/`groupId` de `sessions_spawn`
  se rechazan con un error claro que indica la clave de configuración. Ningún otro comportamiento cambia.
- `defaultAgentId` se valida mediante `resolveSubagentAllowedTargetIds`
  (`src/agents/subagent-target-policy.ts`); id desconocido → error de creación, sin alternativa.

## 5. Núcleo: creación en modo recopilador + `agents_wait` (v1)

### 5.1 Adiciones a `sessions_spawn` (todas condicionadas a que swarm esté habilitado)

- `collect: boolean`: cuando es verdadero, la ejecución hija se registra con
  `expectsCompletionMessage: false` y un **registro de finalización del recopilador**
  en lugar de la entrega de anuncios u orientación. La herramienta devuelve `{ runId, sessionKey }`
  inmediatamente. Sin vinculación a canal o hilo.
- `outputSchema: object`: JSON Schema. El hijo recibe una herramienta
  `structured_output` sintética añadida a su superficie de herramientas; un añadido al prompt del sistema
  le indica que debe llamarla exactamente una vez con su resultado final. Si la validación
  falla, el hijo recibe un aviso para volver a intentarlo una vez; después, el registro de finalización
  contiene `structured: undefined`, además del texto sin procesar y un `schemaError`.
- `fastMode: true | "auto" | false`: se transmite al parche de la sesión hija
  junto con el modelo y el razonamiento mediante `resolveSubagentModelAndThinkingPlan`
  (`src/agents/subagent-spawn-plan.ts`), utilizando el eje `FastMode` existente
  (`src/shared/fast-mode.ts`). Si se omite, se hereda.
- `groupId: string`: marca del grupo de swarm. El valor predeterminado es
  `swarm:<requesterSessionKey>:<runId-of-requesting-run>`. Se conserva en el
  registro y en la fila de la sesión hija. Se utiliza para los límites, el listado, el
  archivado por lotes y los puntos.
- `label: string` ya existe; se muestra en los puntos y en `subagents list`.
- Id del agente hijo: `params.agentId` → de lo contrario `tools.swarm.defaultAgentId` → de lo contrario
  el agente solicitante (comportamiento existente).

### 5.2 Aprobaciones con cierre seguro

Los hijos recopiladores se ejecutan con un contexto de aprobación no interactivo: cualquier llamada a una herramienta
que requiera la aprobación del operador se resuelve como un rechazo estructurado
(`approval_required`) visible para el hijo, del cual se espera que informe del
bloqueo en su resultado. Implementación: reutilizar la infraestructura existente de políticas de aprobación
de ejecución/herramientas con un solucionador `deny` forzado para las ejecuciones hijas en modo recopilador.
Los hijos recopiladores no emiten eventos de aprobación en las superficies del operador.

### 5.3 Herramienta `agents_wait` (nueva, condicionada)

```
agents_wait({ ids: string[], timeoutSeconds?: number })
→ {
    completed: [{ runId, status: "done"|"failed"|"killed"|"timeout",
                  result: string, structured?: unknown, schemaError?: string,
                  sessionKey, label?, usage?: {inputTokens, outputTokens} }],
    pending: string[]
  }
```

- Devuelve el resultado en cuanto se completa **al menos un** id (semántica de primera finalización/carrera,
  que permite pipelines) o, cuando se agota el tiempo de espera, con `completed: []`.
- `timeoutSeconds` tiene un valor predeterminado de 30, limitado a `waitTimeoutSecondsMax`.
- Idempotente: los ids ya completados vuelven a devolver sus registros (los registros se
  conservan hasta archivar el grupo). Id desconocido → entrada de error por id, no una excepción.
- Propiedad: solo la sesión que creó una ejecución (o su cadena de padres) puede esperarla;
  la misma regla de propiedad que `wait` en el modo de código (`code-mode.ts:1684`).
- Registro: los registros de finalización residen en el almacén SQLite existente del registro de subagentes
  (`subagent-registry.store.sqlite.ts`): campos nuevos, ningún almacén nuevo ni
  incremento de la versión del esquema (solo columnas adicionales; consulte la restricción de §9).

### 5.4 Aplicación de límites

- `maxConcurrent`: los hijos recopiladores se ejecutan en el carril de subagentes existente, pero
  se contabilizan por grupo de swarm; las creaciones que superan el límite se ponen en cola FIFO (en el host,
  en la ruta de creación; se devuelve runId inmediatamente y la ejecución comienza cuando se libera un espacio).
- `maxChildrenPerGroup` / `maxTotalPerGroup`: la creación se rechaza con un error con tipo
  cuando se supera el límite; el texto del error indica la clave de configuración.
- Profundidad: los hijos recopiladores mantienen la semántica de `DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH`
  (los hijos son hojas salvo que el anidamiento se configure explícitamente).

## 6. Contrato de pruebas (v1, carril A)

- Unitarias: resolución y limitación de la configuración; rechazos de la puerta cuando está deshabilitada; valores
  predeterminados de groupId; aplicación de límites (poner en cola + rechazar); semántica de carrera de espera; idempotencia
  de la espera; denegación de propiedad; validación de salida estructurada + aviso para volver a intentarlo +
  ruta de schemaError; transmisión de fastMode al parche de sesión; validación de defaultAgentId.
- Integración (vitest, entorno de ejecución del modelo simulado): crear 3 hijos recopiladores, esperar
  en un bucle, comprobar el orden de primera finalización y el vaciado final; simulación de reinicio
  del Gateway: recarga del registro → la espera se resuelve a partir de la finalización conservada.
- Todas las pruebas se ubican junto a `*.test.ts`; no hay llamadas a modelos reales.

## 7. Superficie invitada de QuickJS (carril B, después del núcleo)

- Variables globales invitadas instaladas en `CONTROLLER_SOURCE`
  (`src/agents/code-mode.worker.ts:190-374`), nombres reservados añadidos en
  `code-mode-namespaces.ts`:
  - `agents.run(prompt, opts) → Promise<result|structured>`: simplificación:
    creación de recopilador + espera estacionada mediante un método de puente dedicado (`agentWait`)
    que el host resuelve al finalizar (sin consultas; compatible con instantáneas).
  - `agents.session(system, opts) → Promise<handle>`;
    `handle.send(input, opts) → Promise<...>`; `handle.close()`. (v1.1:
    se publica después de run(); utiliza `mode:"session"` + registros de recopilador por turno).
  - `phase(title)`, `log(message)`: notificaciones de puente sin espera de respuesta →
    eventos de progreso del swarm.
- Métodos de puente añadidos a `CodeModeBridgeMethod` (`code-mode.ts:91`):
  `agentSpawn`, `agentWait`, `swarmNote`. `agentSpawn`/`agentWait` son
  seguros ante reproducciones **por construcción**: la clave de idempotencia `(codeModeRunId, bridgeId)`
  se almacena en el registro; al reiniciar, se vuelve a resolver a partir de las finalizaciones conservadas
  y nunca se crean duplicados.
- Las llamadas de puente `agentWait` pendientes prolongan el TTL de la instantánea de la ejecución (el conjunto
  de agentes pendientes es la señal; no hay ninguna marca).
- El archivo virtual `API.read("agents.d.ts")` documenta la superficie con tipos y los
  patrones de distribución / puerta / ciclo (`createCodeModeApiVirtualFiles`,
  `code-mode-namespaces.ts:876`).

## 8. Proyección del arnés de Codex (carril posterior)

- `sessions_spawn` (con parámetros nuevos) y `agents_wait` pasan por el
  puente de herramientas dinámicas existente; dentro de los scripts en modo de código de Codex aparecen como
  `tools.*` automáticamente (verificado: `codex-rs/code-mode/src/runtime/globals.rs:14-65`,
  `codex-rs/core/src/tools/spec_plan.rs:448-507`).
- `agents_wait` recibe la clase de tiempo de espera prolongado para herramientas dinámicas (límite de 600s;
  `extensions/codex/src/app-server/dynamic-tool-execution.ts:37-39`) y se
  marca como seguro ante tiempos de espera y reproducciones.
- Clave de grupo para padres de Codex: `swarm:<parentSessionKey>:<turnId>`.
- Los subagentes `spawn_agent` nativos de Codex coexisten; sus filas de reflejo de tareas alimentan
  la misma superficie de progreso.

## 9. Persistencia y retención

- No hay almacenes nuevos. Los registros amplían las tablas SQLite existentes del registro de subagentes;
  los hijos son filas `sessions` ordinarias. Solo columnas adicionales:
  **cualquier cambio que requiera incrementar la versión del esquema de SQLite necesita primero
  la aprobación explícita de un responsable de mantenimiento** (política del repositorio).
- Id del grupo de swarm en el registro + metadatos de la sesión hija.
- Retención: los registros de recopiladores completados sobreviven hasta el **archivado del grupo**:
  cuando termina la ejecución padre (o vence el TTL), los hijos del grupo se archivan
  como un lote (ampliar el barrido `DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES`
  existente para que opere por grupo).

## 10. Superficie de progreso («los puntos») — carril posterior

- Implícita, controlada por el arnés. Derivada del SSE `sessions.changed` existente +
  el registro; las notas `phase`/`log` añaden semántica. Sin representación controlada por agentes.
- Interfaz de control: representador `swarm` en la familia de widgets del espacio de trabajo
  (`ui/src/lib/workspace/widgets/`): cuadrícula de puntos agrupada por fase, línea
  del narrador, estado/etiqueta/modelo por punto; el árbol de hijos de la barra lateral no cambia.
- Canales: un mensaje de estado editado y limitado por grupo (seguir
  `docs/concepts/streaming.md`; nunca mensajes por hijo).

## 11. Página Labs (interfaz de control, línea independiente)

Settings → **Labs**: conmutadores de funciones experimentales, con **Code Mode**
y **Swarm** como primeras entradas. Cada fila: nombre, descripción de una línea, enlace a la documentación y conmutador conectado
mediante el RPC `config.patch` existente (parche de fusión RFC 7396 — establecer
`tools.codeMode.enabled` / `tools.swarm.enabled`), además de una indicación de «reinicio necesario»
cuando corresponda. Es fácil de encontrar, pero el texto deja claro el estado experimental.
i18n: todas las cadenas pasan por el pipeline normal de `en.ts` + sincronización.

## 12. Ubicación (más adelante)

- `placement` se elige al crear: `"local"` (predeterminado) | `"cloud:<profile>"` mediante
  el envío existente al entorno de trabajo (`sessions.dispatch`); ubicación agrupada
  más adelante si los procesos secundarios del entorno aislado SSH de la máquina compartida resultan insuficientes.
- La VM del orquestador permanece siempre en el Gateway; settle/dots/budget son
  independientes de la ubicación.

## 13. Fuera de alcance

- Sin DSL de grafos: el flujo de control es el grafo (deliberado y documentado).
- Sin cambios en el código fuente de Codex; sin reutilización de los componentes internos de Code Mode de Codex.
- Sin flujos de trabajo guardados/con nombre en v1; sin punto de entrada de CLI.
- Sin propagación de la aprobación del operador por cada proceso secundario.
- Sin aprovisionamiento en la nube 1:1 a escala de distribución.
- Sin adaptadores de compatibilidad en tiempo de ejecución en estado estable; swarm es una superficie nueva y protegida.

## 14. Fases de compilación / división de los PR

1. **Línea A (núcleo)**: configuración de §4 + creación/espera/límites/aprobaciones de §5 + pruebas de §6.
2. **Línea C (página Labs)**: §11 — independiente, puede integrarse primero.
3. **Línea B (superficie de QuickJS)**: §7 — después de integrar los contratos de A.
4. Renderizador de puntos (§10), proyección de Codex (§8), `agents.session` (§7 v1.1),
   ubicación (§12), reescritura de la documentación de usuario — PR posteriores en ese orden.

Cada PR: Pipeline de CI en verde, `$autoreview` limpio, desactivado de forma predeterminada, rama main lista para publicarse.
