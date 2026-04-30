---
read_when:
    - Estás implementando el SDK público propuesto para aplicaciones de OpenClaw
    - Necesitas el contrato de borrador de espacio de nombres, evento, resultado, artefacto, aprobación o seguridad para el SDK de la aplicación
    - Estás comparando los recursos del protocolo Gateway con la capa de alto nivel del SDK de la aplicación OpenClaw
sidebarTitle: App SDK API design
summary: Diseño de referencia para la API pública del SDK de la aplicación OpenClaw, la taxonomía de eventos, los artefactos, las aprobaciones y la estructura de paquetes
title: Diseño de la API del SDK de aplicaciones de OpenClaw
x-i18n:
    generated_at: "2026-04-30T06:00:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Esta página es el diseño detallado de referencia de API para el
[SDK de aplicaciones de OpenClaw](/es/concepts/openclaw-sdk) público. Está separada intencionalmente del
[SDK de Plugin](/es/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` es el paquete externo de aplicación/cliente para comunicarse con el
  Gateway. `openclaw/plugin-sdk/*` es el contrato de autoría de plugins en proceso.
  No importes subrutas del SDK de Plugin desde aplicaciones que solo necesitan ejecutar agentes.
</Note>

El SDK público de aplicaciones debe construirse en dos capas:

1. Un cliente Gateway generado de bajo nivel.
2. Un contenedor ergonómico de alto nivel con objetos `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` y `Environment`.

## Diseño de espacios de nombres

Los espacios de nombres de bajo nivel deben seguir de cerca los recursos del Gateway:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Los contenedores de alto nivel deben devolver objetos que hagan cómodos los flujos comunes:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## Contrato de eventos

El SDK público debe exponer eventos versionados, reproducibles y normalizados.

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: unknown;
};
```

`id` es un cursor de reproducción. Los consumidores deben poder reconectarse con
`events({ after: id })` y recibir los eventos perdidos cuando la retención lo permita.

Familias de eventos normalizados recomendadas:

| Evento                | Significado                                                 |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Ejecución aceptada.                                         |
| `run.queued`          | La ejecución espera un carril de sesión, runtime o entorno. |
| `run.started`         | El runtime inició la ejecución.                             |
| `run.completed`       | La ejecución finalizó correctamente.                        |
| `run.failed`          | La ejecución terminó con un error.                          |
| `run.cancelled`       | La ejecución fue cancelada.                                 |
| `run.timed_out`       | La ejecución superó su tiempo de espera.                    |
| `assistant.delta`     | Delta de texto del asistente.                               |
| `assistant.message`   | Mensaje completo del asistente o reemplazo.                 |
| `thinking.delta`      | Delta de razonamiento o plan, cuando la política permite exponerlo. |
| `tool.call.started`   | Comenzó la llamada a la herramienta.                        |
| `tool.call.delta`     | La llamada a la herramienta transmitió progreso o salida parcial. |
| `tool.call.completed` | La llamada a la herramienta se completó correctamente.       |
| `tool.call.failed`    | La llamada a la herramienta falló.                          |
| `approval.requested`  | Una ejecución o herramienta necesita aprobación.            |
| `approval.resolved`   | La aprobación fue concedida, denegada, expiró o fue cancelada. |
| `question.requested`  | El runtime solicita entrada del usuario o de la app anfitriona. |
| `question.answered`   | La app anfitriona proporcionó una respuesta.                |
| `artifact.created`    | Nuevo artefacto disponible.                                 |
| `artifact.updated`    | Un artefacto existente cambió.                              |
| `session.created`     | Sesión creada.                                              |
| `session.updated`     | Los metadatos de la sesión cambiaron.                       |
| `session.compacted`   | Se produjo la Compaction de la sesión.                      |
| `task.updated`        | El estado de la tarea en segundo plano cambió.              |
| `git.branch`          | El runtime observó o cambió el estado de la rama.           |
| `git.diff`            | El runtime produjo o cambió un diff.                        |
| `git.pr`              | El runtime abrió, actualizó o vinculó una pull request.     |

Las cargas nativas del runtime deben estar disponibles mediante `raw`, pero las apps no deben
tener que analizar `raw` para la UI normal.

## Contrato de resultados

`Run.wait()` debe devolver un envoltorio de resultado estable:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

El resultado debe ser simple y estable. Los valores de marca temporal conservan la forma del Gateway,
por lo que las ejecuciones actuales respaldadas por ciclo de vida suelen informar números de milisegundos desde epoch,
mientras que los adaptadores aún pueden exponer cadenas ISO. La UI enriquecida, las trazas de herramientas y los
detalles nativos del runtime pertenecen a los eventos y artefactos.

`accepted` es un resultado de espera no terminal: significa que el plazo de espera del Gateway
expiró antes de que la ejecución produjera un fin/error de ciclo de vida. No debe tratarse como
`timed_out`; `timed_out` se reserva para una ejecución que superó su propio tiempo de espera de runtime.

## Aprobaciones y preguntas

Las aprobaciones deben ser entidades de primera clase porque los agentes de programación cruzan constantemente
límites de seguridad.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Los eventos de aprobación deben llevar:

- id de aprobación
- id de ejecución e id de sesión
- tipo de solicitud
- resumen de la acción solicitada
- nombre de la herramienta o acción de entorno
- nivel de riesgo
- decisiones disponibles
- expiración
- si la decisión puede reutilizarse

Las preguntas están separadas de las aprobaciones. Una pregunta solicita información al usuario o a la app anfitriona. Una aprobación solicita permiso para realizar una acción.

## Modelo ToolSpace

Las apps necesitan entender la superficie de herramientas sin importar componentes internos de plugins.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

El SDK debe exponer:

- metadatos de herramienta normalizados
- origen: OpenClaw, MCP, plugin, canal, runtime o app
- resumen de esquema
- política de aprobación
- compatibilidad de runtime
- si una herramienta está oculta, es de solo lectura, puede escribir o puede actuar como anfitriona

La invocación de herramientas a través del SDK debe ser explícita y acotada. La mayoría de las apps deben
ejecutar agentes, no llamar directamente a herramientas arbitrarias.

## Modelo de artefactos

Los artefactos deben cubrir más que archivos.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

Ejemplos comunes:

- ediciones de archivos y archivos generados
- paquetes de parches
- diffs de VCS
- capturas de pantalla y salidas multimedia
- registros y paquetes de trazas
- enlaces de pull request
- trayectorias de runtime
- snapshots de workspace de entornos administrados

El acceso a artefactos debe admitir redacción, retención y URLs de descarga sin
asumir que cada artefacto es un archivo local normal.

## Modelo de seguridad

El SDK de aplicaciones debe ser explícito sobre la autoridad.

Alcances de token recomendados:

| Alcance             | Permite                                             |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Listar e inspeccionar agentes.                      |
| `agent.run`         | Iniciar ejecuciones.                                |
| `session.read`      | Leer metadatos y mensajes de sesiones.              |
| `session.write`     | Crear sesiones, enviarles contenido, bifurcarlas, compactarlas y abortarlas. |
| `task.read`         | Leer el estado de tareas en segundo plano.          |
| `task.write`        | Cancelar o modificar la política de notificación de tareas. |
| `approval.respond`  | Aprobar o denegar solicitudes.                      |
| `tools.invoke`      | Invocar directamente herramientas expuestas.        |
| `artifacts.read`    | Listar y descargar artefactos.                      |
| `environment.write` | Crear o destruir entornos administrados.            |
| `admin`             | Operaciones administrativas.                        |

Valores predeterminados:

- sin reenvío de secretos de forma predeterminada
- sin paso irrestricto de variables de entorno
- referencias a secretos en lugar de valores de secretos
- política explícita de sandbox y red
- retención explícita de entorno remoto
- aprobaciones para ejecución en el anfitrión salvo que la política demuestre lo contrario
- eventos raw de runtime redactados antes de salir del Gateway salvo que el llamador tenga un
  alcance de diagnóstico más fuerte

## Proveedor de entorno administrado

Los agentes administrados deben implementarse como proveedores de entorno.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

La primera implementación no necesita ser un SaaS alojado. Puede apuntar a
hosts node existentes, workspaces efímeros, runners de estilo CI o entornos de estilo Testbox.
El contrato importante es:

1. preparar workspace
2. enlazar entorno y secretos seguros
3. iniciar ejecución
4. transmitir eventos
5. recopilar artefactos
6. limpiar o retener según la política

Una vez que esto sea estable, un servicio en la nube alojado puede implementar el mismo contrato
de proveedor.

## Estructura de paquetes

Paquetes recomendados:

| Paquete                 | Propósito                                                     |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK público de alto nivel y cliente Gateway generado de bajo nivel. |
| `@openclaw/sdk-react`   | Hooks React opcionales para dashboards y creadores de apps.   |
| `@openclaw/sdk-testing` | Helpers de prueba y servidor Gateway falso para integraciones de apps. |

El repo ya tiene `openclaw/plugin-sdk/*` para plugins. Mantén ese espacio de nombres
separado para evitar confundir a autores de plugins con desarrolladores de apps.

## Estrategia de cliente generado

El cliente de bajo nivel debería generarse a partir de esquemas versionados del protocolo de Gateway
y luego envolverse con clases ergonómicas escritas manualmente.

Capas:

1. Esquema de Gateway como fuente de verdad.
2. Cliente TypeScript de bajo nivel generado.
3. Validadores en tiempo de ejecución para entradas externas y cargas útiles de eventos.
4. Envoltorios de alto nivel `OpenClaw`, `Agent`, `Session`, `Run`, `Task` y `Artifact`.
5. Ejemplos de recetario y pruebas de integración.

Beneficios:

- la divergencia del protocolo es visible
- las pruebas pueden comparar los métodos generados con las exportaciones de Gateway
- el SDK de aplicaciones permanece independiente de los elementos internos del Plugin SDK
- los consumidores de bajo nivel siguen teniendo acceso completo al protocolo
- los consumidores de alto nivel obtienen la pequeña API del producto

## Documentación relacionada

- [SDK de aplicaciones de OpenClaw](/es/concepts/openclaw-sdk)
- [Referencia RPC de Gateway](/es/reference/rpc)
- [Bucle del agente](/es/concepts/agent-loop)
- [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Tareas en segundo plano](/es/automation/tasks)
- [Agentes ACP](/es/tools/acp-agents)
- [Descripción general del Plugin SDK](/es/plugins/sdk-overview)
