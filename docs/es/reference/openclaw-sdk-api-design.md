---
read_when:
    - Estás implementando el SDK público propuesto para la aplicación de OpenClaw
    - Necesitas el contrato preliminar de espacio de nombres, evento, resultado, artefacto, aprobación o seguridad para el SDK de la aplicación
    - Estás comparando los recursos del protocolo Gateway con el wrapper de alto nivel del SDK de la aplicación OpenClaw
sidebarTitle: App SDK API design
summary: Diseño de referencia para la API pública del SDK de aplicaciones de OpenClaw, la taxonomía de eventos, los artefactos, las aprobaciones y la estructura de paquetes
title: Diseño de la API del SDK de aplicaciones de OpenClaw
x-i18n:
    generated_at: "2026-05-06T05:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Esta página es el diseño de referencia detallada de la API para el [OpenClaw App SDK](/es/concepts/openclaw-sdk) público. Está separada intencionadamente del [Plugin SDK](/es/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` es el paquete externo de aplicación/cliente para comunicarse con el Gateway. `openclaw/plugin-sdk/*` es el contrato de creación de Plugin en proceso.
  No importes subrutas del Plugin SDK desde aplicaciones que solo necesitan ejecutar agentes.
</Note>

El SDK público de aplicaciones debe construirse en dos capas:

1. Un cliente Gateway generado de bajo nivel.
2. Un envoltorio ergonómico de alto nivel con objetos `OpenClaw`, `Agent`, `Session`, `Run`,
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
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Los envoltorios de alto nivel deben devolver objetos que hagan agradables los flujos comunes:

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

| Evento                | Significado                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `run.created`         | Ejecución aceptada.                                                |
| `run.queued`          | La ejecución espera una vía de sesión, runtime o entorno.          |
| `run.started`         | El runtime inició la ejecución.                                    |
| `run.completed`       | La ejecución finalizó correctamente.                               |
| `run.failed`          | La ejecución terminó con un error.                                 |
| `run.cancelled`       | La ejecución fue cancelada.                                        |
| `run.timed_out`       | La ejecución superó su tiempo de espera.                           |
| `assistant.delta`     | Delta de texto del asistente.                                      |
| `assistant.message`   | Mensaje completo del asistente o reemplazo.                        |
| `thinking.delta`      | Delta de razonamiento o plan, cuando la política permite exponerlo. |
| `tool.call.started`   | Comenzó la llamada a la herramienta.                               |
| `tool.call.delta`     | La llamada a la herramienta transmitió progreso o salida parcial.  |
| `tool.call.completed` | La llamada a la herramienta devolvió correctamente.                |
| `tool.call.failed`    | La llamada a la herramienta falló.                                 |
| `approval.requested`  | Una ejecución o herramienta necesita aprobación.                   |
| `approval.resolved`   | La aprobación fue concedida, denegada, expiró o fue cancelada.     |
| `question.requested`  | El runtime pide entrada al usuario o a la aplicación anfitriona.   |
| `question.answered`   | La aplicación anfitriona proporcionó una respuesta.                |
| `artifact.created`    | Nuevo artefacto disponible.                                        |
| `artifact.updated`    | Un artefacto existente cambió.                                     |
| `session.created`     | Sesión creada.                                                     |
| `session.updated`     | Los metadatos de la sesión cambiaron.                              |
| `session.compacted`   | Se produjo la Compaction de la sesión.                             |
| `task.updated`        | El estado de la tarea en segundo plano cambió.                     |
| `git.branch`          | El runtime observó o cambió el estado de la rama.                  |
| `git.diff`            | El runtime produjo o cambió un diff.                               |
| `git.pr`              | El runtime abrió, actualizó o vinculó una pull request.            |

Las cargas útiles nativas del runtime deben estar disponibles mediante `raw`, pero las aplicaciones no deben tener que analizar `raw` para la interfaz normal.

## Contrato de resultado

`Run.wait()` debe devolver un contenedor de resultado estable:

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

El resultado debe ser simple y estable. Los valores de marca de tiempo conservan la forma del Gateway, por lo que las ejecuciones actuales respaldadas por ciclo de vida suelen informar números de milisegundos desde la época, mientras que los adaptadores aún pueden exponer cadenas ISO. La interfaz enriquecida, los rastros de herramientas y los detalles nativos del runtime pertenecen a eventos y artefactos.

`accepted` es un resultado de espera no terminal: significa que el plazo de espera del Gateway expiró antes de que la ejecución produjera un final/error de ciclo de vida. No debe tratarse como `timed_out`; `timed_out` se reserva para una ejecución que superó su propio tiempo de espera de runtime.

## Aprobaciones y preguntas

Las aprobaciones deben ser de primera clase porque los agentes de codificación cruzan constantemente límites de seguridad.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Los eventos de aprobación deben incluir:

- id de aprobación
- id de ejecución e id de sesión
- tipo de solicitud
- resumen de la acción solicitada
- nombre de herramienta o acción de entorno
- nivel de riesgo
- decisiones disponibles
- expiración
- si la decisión puede reutilizarse

Las preguntas están separadas de las aprobaciones. Una pregunta solicita información al usuario o a la aplicación anfitriona. Una aprobación solicita permiso para realizar una acción.

## Modelo ToolSpace

Las aplicaciones necesitan entender la superficie de herramientas sin importar elementos internos de Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

El SDK debe exponer:

- metadatos normalizados de herramientas
- origen: OpenClaw, MCP, Plugin, canal, runtime o aplicación
- resumen del esquema
- política de aprobación
- compatibilidad de runtime
- si una herramienta está oculta, es de solo lectura, puede escribir o puede actuar como anfitriona

La invocación de herramientas mediante el SDK debe ser explícita y con alcance definido. La mayoría de las aplicaciones deben ejecutar agentes, no llamar directamente a herramientas arbitrarias.

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
- enlaces a pull requests
- trayectorias de runtime
- instantáneas de espacios de trabajo de entorno gestionado

El acceso a artefactos debe admitir censura, retención y URL de descarga sin asumir que cada artefacto es un archivo local normal.

## Modelo de seguridad

El SDK de aplicaciones debe ser explícito sobre la autoridad.

Alcances de token recomendados:

| Alcance             | Permite                                                   |
| ------------------- | --------------------------------------------------------- |
| `agent.read`        | Listar e inspeccionar agentes.                            |
| `agent.run`         | Iniciar ejecuciones.                                      |
| `session.read`      | Leer metadatos y mensajes de sesión.                      |
| `session.write`     | Crear, enviar a, bifurcar, compactar y abortar sesiones.  |
| `task.read`         | Leer el estado de tareas en segundo plano.                |
| `task.write`        | Cancelar o modificar la política de notificación de tareas. |
| `approval.respond`  | Aprobar o denegar solicitudes.                            |
| `tools.invoke`      | Invocar directamente herramientas expuestas.              |
| `artifacts.read`    | Listar y descargar artefactos.                            |
| `environment.write` | Crear o destruir entornos gestionados.                    |
| `admin`             | Operaciones administrativas.                              |

Valores predeterminados:

- sin reenvío de secretos de forma predeterminada
- sin transferencia irrestricta de variables de entorno
- referencias a secretos en lugar de valores de secretos
- política explícita de sandbox y red
- retención explícita de entorno remoto
- aprobaciones para ejecución en el anfitrión salvo que la política demuestre lo contrario
- eventos raw de runtime censurados antes de salir del Gateway salvo que el llamador tenga un alcance de diagnóstico más fuerte

## Proveedor de entorno gestionado

Los agentes gestionados deben implementarse como proveedores de entorno.

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

La primera implementación no necesita ser un SaaS hospedado. Puede apuntar a hosts Node existentes, espacios de trabajo efímeros, ejecutores de estilo CI o entornos de estilo Testbox. El contrato importante es:

1. preparar el espacio de trabajo
2. vincular entorno y secretos seguros
3. iniciar ejecución
4. transmitir eventos
5. recopilar artefactos
6. limpiar o retener según la política

Una vez que esto sea estable, un servicio en la nube hospedado puede implementar el mismo contrato de proveedor.

## Estructura de paquetes

Paquetes recomendados:

| Paquete                 | Propósito                                                     |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK público de alto nivel y cliente Gateway generado de bajo nivel. |
| `@openclaw/sdk-react`   | Hooks React opcionales para paneles y creadores de aplicaciones. |
| `@openclaw/sdk-testing` | Ayudantes de prueba y servidor Gateway falso para integraciones de aplicaciones. |

El repositorio ya tiene `openclaw/plugin-sdk/*` para Plugins. Mantén ese espacio de nombres separado para evitar confundir a autores de Plugin con desarrolladores de aplicaciones.

## Estrategia de cliente generado

El cliente de bajo nivel debe generarse a partir de esquemas versionados del protocolo Gateway y luego envolverse con clases ergonómicas escritas a mano.

Capas:

1. Fuente de verdad del esquema de Gateway.
2. Cliente TypeScript generado de bajo nivel.
3. Validadores en tiempo de ejecución para entradas externas y cargas útiles de eventos.
4. Envoltorios de alto nivel `OpenClaw`, `Agent`, `Session`, `Run`, `Task` y `Artifact`.
5. Ejemplos de recetario y pruebas de integración.

Beneficios:

- la desviación del protocolo es visible
- las pruebas pueden comparar los métodos generados con las exportaciones de Gateway
- el SDK de aplicaciones se mantiene independiente de los componentes internos del Plugin SDK
- los consumidores de bajo nivel siguen teniendo acceso completo al protocolo
- los consumidores de alto nivel obtienen la pequeña API de producto

## Relacionado

- [SDK de aplicaciones OpenClaw](/es/concepts/openclaw-sdk)
- [Referencia RPC de Gateway](/es/reference/rpc)
- [Bucle del agente](/es/concepts/agent-loop)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Tareas en segundo plano](/es/automation/tasks)
- [Agentes ACP](/es/tools/acp-agents)
- [Descripción general del Plugin SDK](/es/plugins/sdk-overview)
