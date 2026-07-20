---
read_when:
    - Quieres que un script de Code Mode distribuya el trabajo entre varios agentes
    - Necesita resultados estructurados de procesos secundarios, puntos de decisión o pipelines de primera finalización
    - Estás habilitando o ajustando los límites de tools.swarm
    - Se desea observar los procesos secundarios del recopilador en el panel de la sesión
sidebarTitle: Swarm
summary: Orqueste subagentes simultáneos desde scripts de Code Mode con resultados estructurados, expansión en paralelo limitada y progreso en tiempo real
title: Enjambre
x-i18n:
    generated_at: "2026-07-20T11:44:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00881c10c314eca667dd826584bfc83a4d848d8995e68905e4e53782d61c59cd
    source_path: tools/swarm.md
    workflow: 16
---

Swarm es una forma experimental y opcional de orquestar muchos subagentes desde un
script de [Modo de código](/es/tools/code-mode). Utilice el flujo de control normal de JavaScript o TypeScript,
como `Promise.all`, `while` y `if`, para distribuir el trabajo, recopilar
resultados y tomar decisiones.

No hay ningún DSL de grafos ni un formato de flujo de trabajo independiente. El programa es la
orquestación. Swarm añade al programa procesos secundarios recopiladores que admiten espera, resultados estructurados,
concurrencia limitada e informes de progreso.

## Habilitar Swarm

La opción recomendada es **Settings → Labs → Swarm** en la interfaz de control. El
interruptor entra en vigor inmediatamente y escribe `tools.swarm.enabled` en la
configuración.

También puede habilitar Swarm directamente en `openclaw.json`:

```json5
{
  tools: {
    swarm: {
      enabled: true,
      maxConcurrent: 8,
      maxChildrenPerGroup: 50,
      maxTotalPerGroup: 200,
      waitTimeoutSecondsMax: 600,
      defaultAgentId: "",
    },
  },
}
```

La forma abreviada booleana habilita o deshabilita la función y mantiene todos los demás valores
predeterminados:

```json5
{
  tools: {
    swarm: true,
  },
}
```

| Campo                   | Valor predeterminado | Descripción                                                                                                                    |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`               | `false` | Expone las opciones de creación en modo recopilador, `agents_wait` y la API invitada `agents.*` del Modo de código.                                   |
| `maxConcurrent`         | `8`     | Número máximo de procesos secundarios recopiladores que se ejecutan simultáneamente en un grupo de Swarm. Los procesos secundarios adicionales aceptados se ponen en cola en orden FIFO.          |
| `maxChildrenPerGroup`   | `50`    | Número máximo de procesos secundarios recopiladores activos en un grupo.                                                                                  |
| `maxTotalPerGroup`      | `200`   | Número máximo de procesos secundarios recopiladores que un grupo puede crear durante su vida útil. Este es el mecanismo de contención para la creación descontrolada.                            |
| `waitTimeoutSecondsMax` | `600`   | Tiempo de espera máximo aceptado por una llamada a `agents_wait`. El valor predeterminado de la llamada es de 30 segundos.                                            |
| `defaultAgentId`        | `""`    | Agente de destino utilizado cuando una creación omite `agentId`. Un valor vacío utiliza el agente solicitante. Se aplican las listas de agentes permitidos existentes. |

Los valores numéricos deben ser enteros positivos. OpenClaw limita
`maxConcurrent` a `1`–`1000`, `maxChildrenPerGroup` a `1`–`10000`,
`maxTotalPerGroup` a `1`–`100000` y `waitTimeoutSecondsMax` a
`1`–`86400`.

Puede sobrescribir Swarm para un agente configurado con
`agents.list[].tools.swarm`. El objeto por agente se combina sobre el objeto
`tools.swarm` de nivel superior.

## Requisitos

Las variables globales invitadas `agents.run`, `phase` y `log` requieren tanto Swarm como
el Modo de código de OpenClaw:

```json5
{
  tools: {
    codeMode: true,
    swarm: true,
  },
}
```

El Modo de código también debe tener acceso efectivo a `sessions_spawn`. Los perfiles de herramientas,
las políticas de permisos y denegaciones, las reglas del proveedor y la política del entorno aislado pueden eliminar esa herramienta.
Consulte [Activación del Modo de código](/es/tools/code-mode#activation) y
[Subagentes](/es/tools/subagents) si un script informa de que `sessions_spawn` no está
disponible.

Los valores `defaultAgentId` y `agentId` por ejecución deben indicar un destino configurado
permitido por la política `subagents.allowAgents` del solicitante. OpenClaw rechaza
los destinos desconocidos o no permitidos en lugar de recurrir a otro agente.

## Escribir un script de Swarm

Cuando Swarm está habilitado, el Modo de código expone esta API invitada:

```typescript
type AgentRunOptions = {
  label?: string;
  model?: string;
  thinking?: string;
  fastMode?: boolean | "auto";
  agentId?: string;
  schema?: Record<string, unknown>;
  phase?: string;
};

agents.run(prompt: string, options?: AgentRunOptions & { schema?: undefined }): Promise<string>;
agents.run<T>(prompt: string, options: AgentRunOptions & { schema: Record<string, unknown> }): Promise<T>;
phase(title: string): void;
log(message: string): void;
```

Sin `schema`, `agents.run()` se resuelve con el texto final del proceso secundario. Con un
esquema JSON, se resuelve con el valor enviado mediante la herramienta
`structured_output` del proceso secundario. Un proceso secundario fallido, terminado, con tiempo de espera agotado o con un esquema no válido
rechaza la promesa con un `SwarmAgentError`. Consulte las declaraciones generadas exactas
y los patrones breves de orquestación en `API.read("agents.d.ts")`
dentro del Modo de código.

Utilice `label` para asignar al proceso secundario un nombre reconocible en el panel y la barra lateral. Utilice
`phase` en las opciones para publicar una fase inmediatamente antes de que se inicie ese proceso secundario,
o llame a `phase()` cuando varios procesos secundarios pertenezcan a la misma etapa.
`log()` publica una breve nota de progreso. Las llamadas de progreso son de ejecución asíncrona sin espera;
no retrasan el script si la interfaz de usuario no está disponible.

### Distribuir en paralelo con resultados estructurados

Este ejemplo inicia un investigador por tema, espera a que todos terminen y, después,
solicita a un proceso secundario final que sintetice sus informes estructurados:

```javascript
const reportSchema = {
  type: "object",
  properties: {
    finding: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: ["finding", "evidence", "confidence"],
  additionalProperties: false,
};

const topics = ["authentication", "storage", "recovery"];
phase("Revisión independiente");

const reports = await Promise.all(
  topics.map((topic) =>
    agents.run(`Revisa la ruta de ${topic}. Devuelve un hallazgo con pruebas.`, {
      label: `review-${topic}`,
      thinking: "high",
      fastMode: "auto",
      schema: reportSchema,
    }),
  ),
);

phase("Síntesis");
log(`Se recopilaron ${reports.length} informes independientes.`);

return await agents.run(
  `Concilia estos informes y explica los desacuerdos:\n${JSON.stringify(reports)}`,
  { label: "synthesis" },
);
```

`Promise.all` es el límite de distribución y recopilación. OpenClaw inicia hasta
`maxConcurrent` procesos secundarios para el grupo y pone el resto en cola según el orden
de envío.

### Repetir según una condición de decisión

Utilice un bucle `while` limitado cuando cada iteración determine si se necesita
otra:

```javascript
const gateSchema = {
  type: "object",
  properties: {
    ready: { type: "boolean" },
    reason: { type: "string" },
    nextAction: { type: "string" },
  },
  required: ["ready", "reason", "nextAction"],
  additionalProperties: false,
};

let pass = 0;
let decision = { ready: false, reason: "No comprobado", nextAction: "Revisar" };

while (!decision.ready && pass < 4) {
  pass += 1;
  phase(`Iteración de decisión ${pass}`);
  decision = await agents.run(
    `Comprueba si las pruebas de la versión están completas. Decisión anterior: ${JSON.stringify(decision)}`,
    {
      label: `release-gate-${pass}`,
      schema: gateSchema,
    },
  );
  log(decision.reason);
}

if (!decision.ready) {
  throw new Error(`La condición sigue sin cumplirse tras ${pass} iteraciones: ${decision.nextAction}`);
}

return decision;
```

Limite siempre los bucles de decisión. `maxTotalPerGroup` es el mecanismo de seguridad
final, no un sustituto de una condición de finalización clara.

### Procesar el primer proceso secundario que termine

`agents.run()` devuelve una promesa ordinaria, por lo que `Promise.race` puede reaccionar al
primer proceso secundario del Modo de código. Para los sistemas de pruebas que llaman a las herramientas de nivel inferior,
`agents_wait` proporciona el mismo límite de primera finalización: devuelve el resultado en cuanto
finaliza al menos una ejecución solicitada o cuando vence el tiempo de espera limitado.
Consulte [Usar Swarm desde otros sistemas de pruebas](#use-swarm-from-other-harnesses) para ver el
bucle de vaciado completo.

## Comportamiento de los procesos secundarios recopiladores

Los procesos secundarios recopiladores son sesiones de subagentes aisladas ordinarias con una ruta de
finalización diferente. Escriben un resultado de recopilación persistente que el proceso principal puede
esperar, en lugar de anunciar o dirigir una respuesta de vuelta a la sesión principal.

El agente de destino se resuelve en este orden:

1. `agentId` en la llamada de creación o `agents.run()`.
2. `tools.swarm.defaultAgentId`.
3. El agente solicitante.

Un agente trabajador dedicado y ligero resulta útil cuando los procesos secundarios de Swarm necesitan una
superficie de herramientas más pequeña, un modelo más económico o una política de entorno aislado más estricta. OpenClaw no incluye
un identificador de agente `worker` integrado; configure uno antes de establecerlo como predeterminado.
Refuerce ese trabajador con `tools.swarm: false` en su configuración por agente para que
pueda ser creado, pero no pueda iniciar Swarms desde sus propias sesiones de nivel superior:

```json5
{
  tools: { swarm: { enabled: true, defaultAgentId: "worker" } },
  agents: {
    list: [
      {
        id: "main",
        default: true,
        subagents: { allowAgents: ["worker"] },
      },
      { id: "worker", tools: { swarm: false } },
    ],
  },
}
```

Las aprobaciones de los recopiladores se deniegan de forma segura. Un proceso secundario nunca abre una solicitud de aprobación
para el operador. Las acciones de herramientas que requerirían aprobación se deniegan y el proceso secundario puede
informar de la denegación en su resultado para que el script decida qué hacer después.

Para la salida estructurada, OpenClaw añade una herramienta sintética `structured_output` al
proceso secundario y valida su carga útil con el esquema JSON proporcionado. Una carga útil no
válida o ausente recibe un aviso correctivo. Si el reintento sigue sin
validarse, la finalización del recopilador conserva el texto sin procesar del proceso secundario, deja
`structured` sin definir e incluye `schemaError`. El resultado `agents_wait` de
nivel inferior expone esos campos para la lógica de recuperación explícita.

### Los procesos secundarios son hojas

Los procesos secundarios de Swarm son hojas de forma predeterminada. La protección universal
`agents.defaults.subagents.maxSpawnDepth` impide que un proceso secundario cree
sus propios procesos secundarios con la profundidad predeterminada de `1`. El patrón de orquestación habitual consiste en
devolver el trabajo al proceso principal, no en crear más trabajo desde un proceso secundario:

```javascript
const plan = await agents.run("Planifica este trabajo como tareas independientes.", {
  schema: {
    type: "object",
    properties: { tasks: { type: "array", items: { type: "string" } } },
    required: ["tasks"],
    additionalProperties: false,
  },
});
return await Promise.all(plan.tasks.map((task) => agents.run(task)));
```

Los subagentes anidados son una opción que el operador debe habilitar mediante
`agents.defaults.subagents.maxSpawnDepth` y no se recomiendan para Swarm.
Los límites de grupo, los presupuestos y la observabilidad presuponen grupos de recopiladores planos.

Cada proceso secundario tiene un único propietario de admisión. Los procesos secundarios de anuncio e interactivos utilizan
`agents.defaults.subagents.maxChildrenPerAgent` (valor predeterminado: `5`) y no cuentan
los procesos secundarios recopiladores. Los procesos secundarios recopiladores solo utilizan `maxChildrenPerGroup` y
`maxTotalPerGroup`; no consumen el presupuesto de procesos secundarios por sesión. La protección de profundidad
de creación sigue aplicándose a ambos modos.

Después de la admisión, los procesos secundarios por encima de `maxConcurrent` se ponen en cola FIFO dentro de su grupo de Swarm,
anidado en la vía global de subagentes. Estas capas de concurrencia ponen
el trabajo en cola en lugar de rechazarlo. Una creación de recopilador que exceda cualquiera de los límites del grupo
se rechaza e incluye la clave de configuración correspondiente en el error.

## Observar un Swarm

Abra el panel de la sesión principal en la interfaz de control mientras un Swarm esté activo.
El widget de Swarm representa cada grupo de recopiladores activo como un punto por proceso secundario con
el estado en cola, en ejecución, completado o fallido. Las etiquetas aparecen en la información emergente de los puntos, por lo que las etiquetas
breves y estables facilitan la lectura de los Swarms más grandes.

La barra lateral de la sesión conserva el árbol principal/secundario habitual. Expanda la fila del proceso principal
para inspeccionar un proceso secundario recopilador o abrir su transcripción sin perder la jerarquía
del Swarm.

Los resultados de los recopiladores se pueden seguir esperando hasta que se archive su grupo. Una vez que todos
los miembros alcanzan su plazo de retención, OpenClaw archiva los procesos secundarios del grupo
como un lote para que los Swarms completados no permanezcan en el árbol de sesiones activo.

## Usar Swarm desde otros sistemas de pruebas

Se puede usar Swarm sin el modo Code de OpenClaw. Sus herramientas principales son
independientes del arnés: inicie procesos secundarios recopiladores con
`sessions_spawn({ collect: true })` y procéselos mediante llamadas limitadas a `agents_wait`.

El modo Code de Codex expone automáticamente las herramientas dinámicas de OpenClaw aptas bajo
`tools.*`. No usa la API invitada QuickJS de OpenClaw ni requiere
`tools.codeMode`, pero `tools.swarm` debe seguir habilitado. Las llamadas
`agents_wait` del arnés de Codex admiten el tiempo de espera completo de 600 segundos. Use este patrón:

```javascript
const tasks = [
  "Compruebe la ruta de autenticación.",
  "Compruebe la ruta de almacenamiento.",
  "Compruebe la ruta de recuperación.",
];

const launches = await Promise.all(
  tasks.map((task, index) =>
    tools.sessions_spawn({
      task,
      collect: true,
      label: `review-${index + 1}`,
    }),
  ),
);

for (const launch of launches) {
  if (launch.status !== "accepted") {
    throw new Error(launch.error ?? "No se aceptó el inicio del recopilador.");
  }
}

const pending = new Set(launches.map((launch) => launch.runId));
const completed = [];

while (pending.size > 0) {
  const ids = [...pending].slice(0, 1000);
  const batch = await tools.agents_wait({
    ids,
    timeoutSeconds: 30,
  });

  // Rote esta ventana limitada después de los identificadores que aún no se hayan comprobado.
  for (const runId of ids) {
    if (pending.delete(runId)) pending.add(runId);
  }

  for (const item of batch.completed) {
    pending.delete(item.runId);
    if (item.status !== "done") {
      throw new Error(item.schemaError ?? item.result ?? `${item.runId}: ${item.status}`);
    }
    completed.push(item); // Procese cada resultado en cuanto finalice.
  }

  for (const failure of batch.errors ?? []) {
    pending.delete(failure.runId);
    throw new Error(`${failure.runId}: ${failure.error}`);
  }
}

return completed;
```

Cada llamada a `agents_wait` acepta entre 1 y 1000 identificadores de ejecución. Devuelve:

```typescript
type AgentsWaitResult = {
  completed: Array<{
    runId: string;
    status: "done" | "failed" | "killed" | "timeout";
    result: string;
    structured?: unknown;
    schemaError?: string;
    sessionKey: string;
    label?: string;
    usage?: { inputTokens: number; outputTokens: number };
  }>;
  pending: string[];
  errors?: Array<{
    runId: string;
    error: "not_found" | "not_owner";
  }>;
};
```

La llamada devuelve el resultado inmediatamente cuando algún proceso secundario solicitado ya se ha completado,
cuando finaliza al menos uno de los procesos secundarios pendientes, cuando no quedan identificadores pendientes válidos
o cuando vence su tiempo de espera. Los registros completados son idempotentes, por lo que pasar un
identificador de ejecución ya completado vuelve a devolver su resultado. Solo la sesión que inició
el recopilador o su cadena de procesos principales autorizada puede esperarlo.

Se trata de sondeo largo limitado, no de un bucle continuo de consulta de estado. Siga pasando únicamente los
identificadores de ejecución restantes hasta que `pending` esté vacío. El modo recopilador admite
subagentes nativos de OpenClaw; no admite el entorno de ejecución ACP, la vinculación de hilos, sesiones
visibles ni el modo de sesión persistente.

## Límites y hoja de ruta

Swarm v1 ejecuta procesos secundarios recopiladores de una sola ejecución; la API `agents.session()`
prevista añadirá procesos de trabajo con estado y múltiples turnos. Actualmente, los procesos secundarios se ejecutan en el
canal de subagentes del Gateway local; la ubicación en la nube está prevista como una opción
explícita de inicio. Las definiciones de flujos de trabajo guardadas y un DSL de grafos no forman parte de la
orientación actual de Swarm.

## Contenido relacionado

- [Modo Code](/es/tools/code-mode) para el entorno de ejecución invitado QuickJS y las reglas de activación
- [Subagentes](/es/tools/subagents) para la política de procesos secundarios, el aislamiento y el comportamiento de las sesiones
- [Herramientas de entorno aislado multiagente](/es/tools/multi-agent-sandbox-tools) para las restricciones por agente
- [Descripción general de las herramientas](/es/tools) para los perfiles de herramientas y el enrutamiento de políticas
