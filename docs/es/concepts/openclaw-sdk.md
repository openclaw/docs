---
read_when:
    - Estás creando una aplicación externa, un script, un panel, un trabajo de CI o una extensión de IDE que se comunica con OpenClaw
    - Estás eligiendo entre el App SDK y el Plugin SDK
    - Está integrando con ejecuciones de agentes de Gateway, sesiones, eventos, aprobaciones, modelos o herramientas
sidebarTitle: App SDK
summary: SDK público de OpenClaw App para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
title: SDK de la aplicación de OpenClaw
x-i18n:
    generated_at: "2026-04-30T05:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

El **SDK de aplicaciones de OpenClaw** es la API cliente pública para aplicaciones fuera del
proceso de OpenClaw. Usa `@openclaw/sdk` cuando un script, panel, trabajo de CI, extensión de IDE
u otra aplicación externa quiera conectarse al Gateway, iniciar ejecuciones de agentes,
transmitir eventos, esperar resultados, cancelar trabajo o inspeccionar recursos del Gateway.

<Note>
  El SDK de aplicaciones es distinto del [SDK de Plugin](/es/plugins/sdk-overview).
  `@openclaw/sdk` se comunica con el Gateway desde fuera de OpenClaw.
  `openclaw/plugin-sdk/*` es solo para plugins que se ejecutan dentro de OpenClaw y
  registran proveedores, canales, herramientas, hooks o runtimes de confianza.
</Note>

## Lo Que Se Distribuye Hoy

`@openclaw/sdk` se distribuye con:

| Superficie                | Estado  | Qué hace                                                                     |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Listo   | Punto de entrada principal del cliente. Posee el transporte, la conexión, las solicitudes y los eventos. |
| `GatewayClientTransport`  | Listo   | Transporte WebSocket respaldado por el cliente del Gateway.                  |
| `oc.agents`               | Listo   | Lista, crea, actualiza, elimina y obtiene handles de agentes.                |
| `Agent.run()`             | Listo   | Inicia una ejecución `agent` del Gateway y devuelve un `Run`.                |
| `oc.runs`                 | Listo   | Crea, obtiene, espera, cancela y transmite ejecuciones.                      |
| `Run.events()`            | Listo   | Transmite eventos normalizados por ejecución con reproducción para ejecuciones rápidas. |
| `Run.wait()`              | Listo   | Llama a `agent.wait` y devuelve un `RunResult` estable.                      |
| `Run.cancel()`            | Listo   | Llama a `sessions.abort` por id de ejecución, con clave de sesión cuando está disponible. |
| `oc.sessions`             | Listo   | Crea, resuelve, envía a, parchea, compacta y obtiene handles de sesión.      |
| `Session.send()`          | Listo   | Llama a `sessions.send` y devuelve un `Run`.                                 |
| `oc.models`               | Listo   | Llama a `models.list` y al RPC de estado `models.authStatus` actual.         |
| `oc.tools`                | Parcial | Lista el catálogo de herramientas y las herramientas efectivas; la invocación directa de herramientas no está conectada. |
| `oc.approvals`            | Listo   | Lista y resuelve aprobaciones de exec mediante RPCs de aprobación del Gateway. |
| `oc.rawEvents()`          | Listo   | Expone eventos sin procesar del Gateway para consumidores avanzados.         |
| `normalizeGatewayEvent()` | Listo   | Convierte eventos sin procesar del Gateway a la forma de evento estable del SDK. |

El SDK también exporta los tipos principales que usan esas superficies:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` y tipos de resultado relacionados.

## Conectarse A Un Gateway

Crea un cliente con una URL explícita del Gateway, o inyecta un transporte personalizado para
pruebas y runtimes de aplicaciones embebidas.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` es equivalente a `url`. La opción
`gateway: "auto"` es aceptada por el constructor, pero el descubrimiento automático del Gateway
todavía no es una función independiente del SDK; pasa `url` cuando la aplicación aún no sabe
cómo descubrir el Gateway.

Para pruebas, pasa un objeto que implemente `OpenClawTransport`:

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## Ejecutar Un Agente

Usa `oc.agents.get(id)` cuando la aplicación quiera un handle de agente y luego llama a
`agent.run()`.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

Las referencias de modelo calificadas por proveedor, como `openai/gpt-5.5`, se dividen en overrides
`provider` y `model` del Gateway. `timeoutMs` permanece en milisegundos en el SDK y
se convierte a segundos de timeout del Gateway para el RPC `agent`.

`run.wait()` usa el RPC `agent.wait` del Gateway. Una fecha límite de espera que vence
mientras la ejecución sigue activa devuelve `status: "accepted"` en lugar de fingir que
la ejecución en sí agotó el tiempo. Los timeouts de runtime, las ejecuciones abortadas y las ejecuciones canceladas se
normalizan a `timed_out` o `cancelled`.

## Crear Y Reutilizar Sesiones

Usa sesiones cuando la aplicación quiera estado de transcripción duradero.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` llama a `sessions.send` y devuelve un `Run`. Los handles de sesión también
admiten:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Transmitir Eventos

El SDK normaliza eventos sin procesar del Gateway en un sobre `OpenClawEvent` estable:

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
  raw?: GatewayEvent;
};
```

Los tipos de evento comunes incluyen:

| Tipo de evento       | Evento de origen del Gateway                  |
| --------------------- | ------------------------------------------- |
| `run.started`         | Inicio del ciclo de vida de `agent`         |
| `run.completed`       | Fin del ciclo de vida de `agent`            |
| `run.failed`          | Error del ciclo de vida de `agent`          |
| `run.cancelled`       | Fin del ciclo de vida abortado/cancelado    |
| `run.timed_out`       | Fin del ciclo de vida por timeout           |
| `assistant.delta`     | Delta de transmisión del asistente          |
| `assistant.message`   | Mensaje del asistente                       |
| `thinking.delta`      | Flujo de pensamiento o plan                 |
| `tool.call.started`   | Inicio de herramienta/elemento/comando      |
| `tool.call.delta`     | Actualización de herramienta/elemento/comando |
| `tool.call.completed` | Finalización de herramienta/elemento/comando |
| `tool.call.failed`    | Fallo de herramienta/elemento/comando o estado bloqueado |
| `approval.requested`  | Solicitud de aprobación de exec o plugin    |
| `approval.resolved`   | Resolución de aprobación de exec o plugin   |
| `session.created`     | Creación de `sessions.changed`              |
| `session.updated`     | Actualización de `sessions.changed`         |
| `session.compacted`   | Compactación de `sessions.changed`          |
| `task.updated`        | Eventos de actualización de tarea           |
| `artifact.updated`    | Eventos de flujo de parches                 |
| `raw`                 | Cualquier evento sin asignación estable del SDK todavía |

`Run.events()` filtra eventos a un id de ejecución y reproduce eventos ya vistos para
ejecuciones rápidas. Eso significa que el flujo documentado es seguro:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Para flujos de toda la aplicación, usa `oc.events()`. Para frames sin procesar del Gateway, usa
`oc.rawEvents()`.

## Modelos, Herramientas Y Aprobaciones

Los helpers de modelo se asignan a los métodos actuales del Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Los helpers de herramientas exponen el catálogo del Gateway y la vista de herramientas efectivas:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Los helpers de aprobación usan los RPCs de aprobación de exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Explícitamente No Admitido Hoy

El SDK incluye nombres para el modelo de producto que queremos, pero no finge silenciosamente
que existan RPCs del Gateway. Actualmente estas llamadas lanzan errores explícitos de no admitido:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Los campos por ejecución `workspace`, `runtime`, `environment` y `approvals` están tipados
como forma futura, pero el Gateway actual no admite esos overrides en
el RPC `agent`. Si los llamadores los pasan, el SDK lanza un error antes de enviar la ejecución
para que el trabajo no se ejecute accidentalmente con el comportamiento predeterminado de workspace, runtime,
environment o aprobación.

## SDK De Aplicaciones Frente A SDK De Plugin

Usa el SDK de aplicaciones cuando el código vive fuera de OpenClaw:

- scripts de Node que inician u observan ejecuciones de agentes
- trabajos de CI que llaman a un Gateway
- paneles y paneles de administración
- extensiones de IDE
- puentes externos que no necesitan convertirse en plugins de canal
- pruebas de integración con transportes del Gateway falsos o reales

Usa el SDK de Plugin cuando el código se ejecuta dentro de OpenClaw:

- plugins de proveedor
- plugins de canal
- hooks de herramienta o ciclo de vida
- plugins de arnés de agente
- helpers de runtime de confianza

El código del SDK de aplicaciones debe importar desde `@openclaw/sdk`. El código de Plugin debe importar desde
subrutas documentadas de `openclaw/plugin-sdk/*`. No mezcles los dos contratos.

## Documentos Relacionados

- [Diseño de la API del SDK de aplicaciones de OpenClaw](/es/reference/openclaw-sdk-api-design)
- [Referencia de RPC del Gateway](/es/reference/rpc)
- [Bucle de agente](/es/concepts/agent-loop)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Sesiones](/es/concepts/session)
- [Tareas en segundo plano](/es/automation/tasks)
- [Agentes ACP](/es/tools/acp-agents)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
