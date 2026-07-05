---
read_when:
    - Quieres habilitar el modo código de OpenClaw para una ejecución de agente
    - Debes explicar por qué el modo código es diferente del modo Codex Code
    - Estás revisando el contrato exec/wait, el sandbox QuickJS-WASI, la transformación de TypeScript o el puente oculto del catálogo de herramientas
    - Estás agregando o revisando una integración interna del registro de espacios de nombres de modo código
sidebarTitle: Code mode
summary: 'Modo de código de OpenClaw: una superficie de herramientas exec/wait opcional respaldada por QuickJS-WASI y un catálogo de herramientas oculto limitado al run'
title: Modo de código
x-i18n:
    generated_at: "2026-07-05T11:43:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: da4803ad63634fd0f58adf09d143032fc6740331dab4e0769fae32461812f08c
    source_path: reference/code-mode.md
    workflow: 16
---

El modo de código es una función experimental y opcional del runtime de agentes de OpenClaw. Cuando está habilitado, el modelo ya no ve todos los esquemas de herramientas habilitados; en cambio, para esa ejecución ve solo dos herramientas, `exec` y `wait`. El modelo escribe un pequeño programa en JavaScript o TypeScript que busca, describe y llama al catálogo de herramientas oculto.

Esta página documenta el modo de código de OpenClaw, no Codex Code Mode. Las dos funciones comparten un nombre y los mismos nombres de herramientas visibles para el modelo (`exec`, `wait`), pero son implementaciones separadas:

- Codex Code Mode se ejecuta dentro del arnés de programación de Codex. Su herramienta `exec` es una herramienta de gramática libre: el modelo escribe código fuente JavaScript sin procesar (opcionalmente precedido por una línea pragma `// @exec: {...}` para opciones de ejecución), ejecutado en un runtime Deno/V8.
- El modo de código de OpenClaw se ejecuta en el runtime genérico de agentes de OpenClaw y está deshabilitado salvo que se configure `tools.codeMode.enabled: true`. Su herramienta `exec` recibe una carga JSON `{ code, language }`, ejecutada en un worker QuickJS-WASI.

Ambas son superficies de ejecución de JavaScript, no superficies de comandos de shell. Trátalas como funciones independientes, implementadas de forma diferente, que casualmente exponen herramientas `exec`/`wait` con nombres idénticos.

## Qué hace

- La lista de herramientas visible para el modelo pasa a ser exactamente `exec` y `wait`.
- `exec` evalúa JavaScript o TypeScript generado por el modelo en un hilo worker QuickJS-WASI aislado.
- Todas las demás herramientas habilitadas (núcleo de OpenClaw, Plugin, MCP, cliente) se ocultan del prompt del modelo y se exponen dentro del programa invitado mediante `ALL_TOOLS` y `tools`.
- El código invitado busca en el catálogo oculto, describe el esquema de una herramienta y llama a una herramienta a través de la misma ruta de ejecución usada por los turnos normales del agente (política, aprobaciones, hooks y telemetría siguen aplicándose).
- Las herramientas MCP se agrupan bajo el espacio de nombres `MCP`; en modo de código, esta es la única forma admitida de llamarlas.
- `wait` reanuda una ejecución suspendida en modo de código cuando todavía hay llamadas a herramientas anidadas pendientes.

El modo de código cambia solo la superficie de orquestación orientada al modelo. No reemplaza herramientas, herramientas de Plugin, herramientas MCP, autenticación, política de aprobación, comportamiento de canal ni selección de modelo.

## Por qué usarlo

- Superficie de prompt más pequeña: los proveedores reciben dos herramientas de control en lugar de docenas o cientos de esquemas completos de herramientas.
- Mejor orquestación: el modelo puede usar bucles, uniones, pequeñas transformaciones, lógica condicional y llamadas a herramientas anidadas en paralelo dentro de una celda de código.
- Neutral respecto al proveedor: funciona con herramientas de OpenClaw, Plugin, MCP y cliente sin depender de ejecución de código nativa del proveedor.
- Falla de forma cerrada: si el modo de código está habilitado pero el runtime QuickJS-WASI no está disponible, la ejecución falla en lugar de volver silenciosamente a una exposición directa amplia de herramientas.

Es más útil para agentes con un catálogo grande de herramientas habilitadas, o flujos de trabajo donde el modelo necesita buscar, combinar y llamar a varias herramientas antes de responder.

## Habilitarlo

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Forma abreviada:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

El modo de código permanece desactivado cuando `tools.codeMode` se omite, es `false` o es un objeto sin `enabled: true`.

Si usas agentes en sandbox con servidores MCP configurados, permite también el Plugin MCP incluido en la política de herramientas del sandbox, por ejemplo `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Consulta [Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Define límites explícitos para cotas más estrictas:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

Para confirmar la forma de la carga del modelo durante la depuración, ejecuta el Gateway con registro dirigido:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Con el modo de código activo, los nombres de herramientas orientados al modelo registrados deberían ser `exec` y `wait`. Para la carga completa censurada del proveedor, añade `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` durante una sesión breve de depuración.

## Recorrido técnico

El resto de esta página cubre el contrato de runtime y los detalles de implementación para mantenedores, autores de Plugin que depuran la exposición de herramientas y operadores que validan despliegues de alto riesgo.

## Estado del runtime

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Runtime             | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| Estado predeterminado | deshabilitado                                                                             |
| Estabilidad         | superficie experimental de OpenClaw (Codex Code Mode es una superficie separada y estable del arnés de Codex) |
| Superficie objetivo | ejecuciones genéricas de agentes de OpenClaw                                                |
| Postura de seguridad | el código del modelo es hostil                                                             |
| Promesa de cara al usuario | habilitar el modo de código nunca vuelve silenciosamente a una exposición directa amplia de herramientas |

## Alcance

El modo de código es dueño de la forma de orquestación orientada al modelo para una ejecución preparada. No es dueño de la selección de modelo, el comportamiento de canal, la autenticación, la política de herramientas ni las implementaciones de herramientas.

Dentro del alcance: definiciones de `exec`/`wait` visibles para el modelo, construcción del catálogo de herramientas oculto, ejecución invitada de JavaScript/TypeScript, runtime worker QuickJS-WASI, callbacks de host para buscar/describir/llamar, estado reanudable para programas invitados suspendidos, límites de salida/tiempo de espera/memoria/llamadas pendientes/snapshot y proyección de telemetría/trayectoria para llamadas a herramientas anidadas.

Fuera del alcance: ejecución remota de código nativa del proveedor, semántica de ejecución de shell, cambios en la autorización existente de herramientas, scripts persistentes escritos por usuarios, acceso a gestor de paquetes/archivo/red/módulo en código invitado y reutilización directa de elementos internos de Codex Code Mode.

Las herramientas propiedad del proveedor, como sandboxes remotos de Python, son herramientas separadas. Consulta [Ejecución de código](/es/tools/code-execution).

## Términos

- **Modo de código**: el modo de runtime de OpenClaw que oculta las herramientas normales del modelo y expone solo `exec` y `wait`.
- **Runtime invitado**: la VM JavaScript QuickJS-WASI que evalúa el código del modelo.
- **Puente de host**: la superficie estrecha de callbacks compatible con JSON desde el código invitado de vuelta a OpenClaw.
- **Catálogo**: la lista con alcance de ejecución de herramientas efectivas después de la resolución normal de política de herramientas, Plugin, MCP y herramientas de cliente.
- **Llamada a herramienta anidada**: una llamada a herramienta hecha desde código invitado a través del puente de host.
- **Snapshot**: estado serializado de la VM QuickJS-WASI guardado para que `wait` pueda continuar una ejecución suspendida en modo de código.

## Configuración

`tools.codeMode.enabled` es la puerta de activación; definir otros campos no habilita la función por sí solo.

| Campo                 | Predeterminado                 | Límite                                          |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | booleano; solo `true` habilita el modo de código |
| `runtime`             | `"quickjs-wasi"`               | único valor admitido                            |
| `mode`                | `"only"`                       | expone `exec`/`wait`, oculta las herramientas normales del modelo |
| `languages`           | `["javascript", "typescript"]` | cualquier subconjunto de los dos                |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | limitado a `maxSearchLimit`                     |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

Si el modo de código está habilitado pero QuickJS-WASI no puede cargarse, OpenClaw falla de forma cerrada para esa ejecución; no expone silenciosamente las herramientas normales como alternativa.

## Activación

El modo de código se evalúa después de conocer la política efectiva de herramientas y antes de ensamblar la solicitud final al modelo:

1. Resolver el agente, modelo, proveedor, sandbox, canal, remitente y política de ejecución.
2. Crear la lista efectiva de herramientas de OpenClaw, añadiendo herramientas elegibles de Plugin, MCP y cliente.
3. Aplicar la política de permitir/denegar.
4. Si `tools.codeMode.enabled` es falso, continuar con la exposición normal de herramientas.
5. Si está habilitado y las herramientas están activas para la ejecución, registrar las herramientas efectivas en el catálogo de modo de código.
6. Eliminar todas las herramientas normales de la lista visible para el modelo; añadir `exec` y `wait`.

Las ejecuciones que intencionalmente no tienen herramientas (llamadas crudas al modelo, `disableTools: true` o una lista `tools.allow` vacía) no activan la superficie de modo de código incluso cuando `tools.codeMode.enabled: true` está configurado. El modo de código y OpenClaw Tool Search son mutuamente excluyentes para una ejecución; si se activa el modo de código, la Compaction de Tool Search no lo hace.

El catálogo de modo de código tiene alcance de ejecución y no debe filtrar herramientas de otro agente, sesión, remitente o ejecución.

## Herramientas visibles para el modelo

Cuando el modo de código está activo, el modelo ve exactamente `exec` y `wait`. Todas las demás herramientas habilitadas se ocultan de la lista de herramientas orientada al modelo y se registran en el catálogo de modo de código.

Usa `exec` para orquestación de herramientas, unión de datos, bucles, llamadas anidadas en paralelo y transformaciones estructuradas. Usa `wait` solo cuando `exec` devuelva un resultado reanudable `waiting`.

## `exec`

`exec` inicia una celda de modo de código y devuelve un resultado. El código de entrada es generado por el modelo y debe tratarse como hostil.

Entrada:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Reglas:

- Uno de `code` o `command` debe no estar vacío.
- `code` es el campo documentado orientado al modelo.
- `command` se acepta como un alias compatible con exec para políticas de hooks y reescrituras de confianza (la herramienta normal `exec` de shell de OpenClaw también usa un campo `command`); cuando ambos están presentes, los valores deben coincidir.
- `language` toma `"javascript"` como valor predeterminado; el esquema lo expone como un enum de cadena plano (`"javascript" | "typescript"`), no como una unión `oneOf`/`anyOf`, ya que algunos proveedores rechazan esas formas.
- Si `language` es `"typescript"`, OpenClaw transpila antes de evaluar.
- `exec` rechaza `import`, `require`, importación dinámica y patrones de cargador de módulos.
- `exec` nunca expone recursivamente la implementación normal de shell `exec`.
- Los eventos de hook externos de `exec` en modo de código llevan `toolKind: "code_mode_exec"` y `toolInputKind: "javascript" | "typescript"` (cuando se conoce), para que las políticas puedan distinguir celdas de modo de código de llamadas `exec` de estilo shell que comparten el mismo nombre de herramienta.

Resultado:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` devuelve `waiting` cuando la VM de QuickJS se suspende con estado reanudable que
aún necesita una continuación visible para el modelo; el resultado incluye un `runId` para
`wait`. Las llamadas de puente de espacios de nombres, incluidas las llamadas de espacios de nombres MCP, se drenan automáticamente
dentro de la misma llamada `exec`/`wait` mientras están listas, por lo que un bloque de código
compacto puede llamar a una herramienta MCP sin forzar una llamada de herramienta del modelo por cada espera
de espacio de nombres.

`exec` devuelve `completed` solo cuando la VM invitada no tiene trabajo pendiente y el
valor final es compatible con JSON después de que se ejecute el adaptador de salida de OpenClaw.

## `wait`

`wait` continúa una VM de modo código suspendida.

Entrada:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

La salida es la misma unión `CodeModeResult` que devuelve `exec`.

`wait` existe porque las herramientas anidadas de OpenClaw pueden ser lentas, interactivas, estar
bloqueadas por aprobaciones o transmitir actualizaciones parciales; el modelo no debería tener que
mantener abierta una llamada `exec` larga mientras el anfitrión espera trabajo externo.

La instantánea/restauración de QuickJS-WASI es el mecanismo de reanudación:

1. `exec` evalúa el código hasta completarse, fallar o suspenderse.
2. Al suspenderse, OpenClaw toma una instantánea de la VM de QuickJS y registra el trabajo
   pendiente del anfitrión.
3. Cuando el trabajo pendiente se resuelve, `wait` restaura la instantánea de la VM y
   vuelve a registrar las devoluciones de llamada del anfitrión mediante nombres estables.
4. OpenClaw entrega resultados de herramientas anidadas en la VM restaurada y drena
   los trabajos pendientes de QuickJS.
5. `wait` devuelve `completed`, `failed` u otro resultado `waiting`.

Las instantáneas son estado de ejecución, no artefactos de usuario: viven solo en un
mapa dentro del proceso (sin escritura en base de datos ni disco), tienen límite de tamaño, caducan y están
limitadas a la ejecución y la sesión que las crearon.

`wait` falla (como resultado `failed`) cuando:

- `runId` es desconocido o su instantánea ya caducó.
- el llamador no está en el mismo ámbito de ejecución/sesión que la ejecución suspendida.
- ya hay un `wait` en curso para ese `runId`.
- falla la restauración de QuickJS-WASI.
- la reanudación superaría `maxOutputBytes` o `maxSnapshotBytes`.

## API del entorno de ejecución invitado

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` es metadato compacto para el catálogo con ámbito de ejecución; no
contiene esquemas completos de forma predeterminada.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
};
```

Las herramientas de Plugin usan `source: "openclaw"` con `sourceName` establecido en el id del
Plugin propietario; no hay un valor de origen `"plugin"` separado. `source: "mcp"` se
usa solo para entradas MCP en metadatos `sourceName`/`mcp` (y se filtra
de `ALL_TOOLS`/`tools.*`; consulta abajo).

El esquema completo se carga solo bajo demanda:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Ayudantes de catálogo:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Las funciones de herramientas de conveniencia se instalan solo para nombres seguros no ambiguos:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

Las entradas del catálogo MCP no se pueden llamar mediante `tools.call(...)` ni funciones de conveniencia
en modo código; se exponen solo a través del espacio de nombres `MCP`
generado. Los archivos de declaración de estilo TypeScript están disponibles a través de la
superficie de archivo virtual `API` de solo lectura, de modo que los agentes puedan inspeccionar las firmas MCP
sin agregar esquemas MCP al prompt:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` devuelve declaraciones compactas inferidas a partir de los
metadatos de herramientas MCP:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Los archivos de declaración son virtuales, no se escriben bajo el espacio de trabajo ni el directorio
de estado. Para cada llamada `exec` de modo código, OpenClaw crea el catálogo de herramientas
con ámbito de ejecución, conserva las entradas MCP visibles, renderiza `mcp/index.d.ts` más un
`mcp/<server>.d.ts` por cada servidor visible e inyecta esa pequeña tabla de solo lectura
en el worker de QuickJS. El código invitado ve solo el objeto `API`:
`API.list(prefix?)` devuelve metadatos de archivo y `API.read(path)` devuelve el
contenido de declaración seleccionado. Se rechazan las rutas desconocidas y los segmentos
`.`/`..`.

Esto mantiene los esquemas MCP grandes fuera del prompt del modelo: el agente aprende que la
API virtual existe a partir de la descripción de la herramienta `exec`, lee solo el archivo de
declaración necesario y luego llama a `MCP.<server>.<tool>()` con un argumento de objeto.
`MCP.<server>.$api()` sigue disponible como alternativa en línea para una
respuesta de esquema de una sola herramienta dentro del programa.

El entorno de ejecución invitado nunca ve objetos del anfitrión directamente. Las entradas y salidas cruzan
el puente como valores compatibles con JSON con límites de tamaño explícitos.

## Espacios de nombres internos

Los espacios de nombres internos dan al modo código una API de dominio concisa sin agregar más
herramientas visibles para el modelo. Una integración propiedad del cargador registra un espacio de nombres como
`Issues` o `Calendar`; el código invitado llama entonces a ese espacio de nombres dentro del
programa QuickJS mientras el modelo sigue viendo solo `exec` y `wait`.

Los espacios de nombres son internos por ahora. No hay una API pública de espacios de nombres del SDK de Plugin:
los espacios de nombres de plugins externos necesitan un contrato propiedad del cargador para que la identidad del Plugin,
los manifiestos instalados, el estado de autenticación y los descriptores de catálogo en caché no puedan desviarse
de las herramientas de Plugin que respaldan el espacio de nombres. El modo código de core posee solo el
sandbox, la serialización, el control del catálogo y el despacho del puente.

El código invitado puede usar el global directo o el mapa `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Ciclo de vida del registro

El registro de espacios de nombres es local al proceso y se indexa por id de espacio de nombres:

1. Un cargador de confianza llama a `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. El modo código crea el `ToolSearchRuntime` oculto para la ejecución y lee su
   catálogo con ámbito de ejecución.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` conserva solo los registros
   cuyos `requiredToolNames` son todos visibles y propiedad del mismo `pluginId`.
4. Cada espacio de nombres visible llama a `createScope(ctx)` para la ejecución actual,
   y recibe contexto de ejecución como `agentId`, `sessionKey`, `sessionId`,
   `runId`, configuración y estado de aborto.
5. Los datos de ámbito se serializan en un descriptor plano y se inyectan en QuickJS
   como globales directos y `namespaces.<globalName>`.
6. Las llamadas invitadas se suspenden a través del puente del worker, resuelven la ruta del espacio de nombres
   en el anfitrión, asignan la llamada a una herramienta de catálogo declarada propiedad del Plugin y
   ejecutan esa herramienta mediante `ToolSearchRuntime.callExactId`.
7. Las llamadas de puente de espacio de nombres listas se drenan automáticamente dentro de la llamada
   `exec`/`wait` activa; si el trabajo del espacio de nombres sigue pendiente al agotarse el tiempo de espera o
   el invitado cede explícitamente, `wait` reanuda el mismo entorno de ejecución de espacio de nombres
   más tarde.
8. La reversión o desinstalación del Plugin llama a
   `clearCodeModeNamespacesForPlugin(pluginId)` para que los globales obsoletos no
   sobrevivan a una carga fallida del Plugin.

Las llamadas de espacio de nombres son llamadas a herramientas de catálogo: usan los mismos hooks de política,
aprobaciones, manejo de aborto, telemetría, proyección de transcripción y comportamiento de
suspensión/reanudación que `tools.call(...)`.

### Forma del registro

Registra espacios de nombres desde la integración que posee las herramientas subyacentes. Mantén
el ámbito pequeño y expón solo verbos de dominio que se asignen a herramientas de catálogo
declaradas.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` marca un miembro de ámbito como una
función de espacio de nombres invocable. El `inputMapper` opcional recibe los argumentos
del invitado y devuelve el objeto de entrada para la herramienta de catálogo subyacente; sin
uno, se usa el primer argumento del invitado, o `{}` cuando se omite.

Las funciones sin procesar del anfitrión se rechazan antes de que se ejecute el código invitado:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Propiedad y visibilidad

La propiedad del espacio de nombres está vinculada al `pluginId` del llamador del registro.
`requiredToolNames` es a la vez una puerta de visibilidad y una verificación de propiedad:

- cada herramienta requerida debe existir en el catálogo de ejecución
- cada herramienta requerida debe tener `sourceName === pluginId`
- el espacio de nombres se oculta cuando falta alguna herramienta requerida o pertenece a
  otro Plugin
- cada ruta invocable solo puede apuntar a una herramienta nombrada en `requiredToolNames`

Esto impide que otro Plugin exponga un espacio de nombres registrando una herramienta
con el mismo nombre y mantiene los espacios de nombres alineados con la política ordinaria de agentes: si
la ejecución no puede ver las herramientas subyacentes, no puede ver el espacio de nombres.

Por ejemplo, un espacio de nombres de GitHub debería vivir detrás de un Plugin propiedad de GitHub que
posea la autenticación de GitHub, los clientes REST/GraphQL, los límites de tasa, las aprobaciones de escritura y
las pruebas. El modo código de core no debería incrustar APIs específicas de GitHub, manejo de tokens
ni política de proveedor.

### Reglas de serialización de ámbito

`createScope(ctx)` puede devolver un objeto plano que contenga valores compatibles con JSON,
arreglos, objetos anidados y marcadores de llamada `createCodeModeNamespaceTool(...)`.
Los objetos del anfitrión nunca entran directamente en QuickJS.

El serializador rechaza:

- funciones sin procesar
- grafos de objetos circulares
- segmentos de ruta inseguros: `__proto__`, `constructor`, `prototype`, claves vacías,
  o claves que contengan el separador interno de ruta
- valores de `globalName` que no son identificadores de JavaScript
- colisiones de `globalName` con globales integrados de modo código como `tools`,
  `namespaces`, `text`, `json`, `yield_control`, `MCP`, `API`, `ALL_TOOLS` o
  `__openclaw*`

Los valores que no se pueden serializar a JSON se convierten en valores alternativos seguros para JSON
antes de cruzar el puente. Los datos binarios, handles, sockets, clientes e
instancias de clases deberían permanecer detrás de herramientas de catálogo ordinarias.

### Prompts

La `description` del espacio de nombres y el `prompt` opcional se anexan al esquema
`exec` visible para el modelo solo cuando el espacio de nombres es visible para esa ejecución. Úsalos
para enseñar la superficie útil más pequeña:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Mantén los prompts centrados en el contrato del espacio de nombres, no en la configuración de autenticación, el historial
de implementación ni el comportamiento no relacionado del plugin.

### Limpieza

Los espacios de nombres son registros locales del proceso. Elimínalos cuando el
plugin propietario se deshabilite, desinstale o revierta:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

La limpieza del modo de código pertenece al plugin; borra los registros de espacios de nombres del plugin
cuando termine su ciclo de vida en lugar de mantener manejadores de desmontaje por espacio de nombres.
Las pruebas pueden llamar a `clearCodeModeNamespacesForTest()` para evitar filtrar
registros entre casos.

### Lista de comprobación de pruebas

Los cambios de espacios de nombres deben cubrir el límite de seguridad y el comportamiento del invitado:

- el texto del prompt del espacio de nombres aparece solo cuando las herramientas de respaldo son visibles
- las herramientas con el mismo nombre de otro `sourceName` no exponen el espacio de nombres
- se rechazan las funciones de alcance sin procesar
- se rechazan los ids de espacios de nombres falsificados y las rutas falsificadas
- las rutas invocables no pueden apuntar a herramientas no declaradas
- los objetos anidados y las referencias compartidas se serializan correctamente
- las llamadas al espacio de nombres se ejecutan mediante herramientas del catálogo y devuelven detalles seguros para JSON
- el código invitado puede capturar los fallos
- las llamadas suspendidas al espacio de nombres se reanudan mediante `wait`
- la reversión del plugin borra los registros de espacios de nombres propietarios

Los espacios de nombres complementan el catálogo genérico `tools.search`/`tools.call`: usa el
catálogo para herramientas arbitrarias habilitadas de OpenClaw, plugins y clientes; usa `MCP`
para herramientas MCP; usa otros espacios de nombres para APIs de dominio documentadas y propiedad del plugin
cuando el código conciso sea más fiable que las búsquedas repetidas de esquemas.

## API de salida

- `text(value)` anexa salida legible por humanos al array `output`.
- `json(value)` anexa un elemento de salida estructurado después de una serialización compatible con JSON.
- El valor devuelto final del código invitado se convierte en `value` en un resultado `completed`.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Reglas: el orden de salida coincide con las llamadas del invitado; la salida está limitada por
`maxOutputBytes`; los valores no serializables se convierten en cadenas simples o
errores; no se admiten valores binarios. Las imágenes y los archivos viajan mediante
herramientas ordinarias de OpenClaw, no mediante el puente del modo de código.

## Catálogo de herramientas

El catálogo oculto incluye herramientas después del filtrado de política efectivo, en este
orden: herramientas principales de OpenClaw, herramientas de plugins incluidos, herramientas de plugins externos, herramientas MCP
y luego herramientas proporcionadas por el cliente para la ejecución actual.

Los ids de catálogo son estables dentro de una ejecución y deterministas entre conjuntos de
herramientas equivalentes cuando es posible. Forma real:

```text
<source>:<owner>:<tool-name>
```

donde `<source>` es `openclaw`, `mcp` o `client` (las herramientas de plugin usan
`openclaw` con el id del plugin como `<owner>`; las herramientas principales usan `openclaw:core:*`).
Ejemplos:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

El catálogo omite las herramientas de control del modo de código: `exec`, `wait`, `tool_search_code`,
`tool_search`, `tool_describe`, `tool_call`. Esto evita la recursión y mantiene
estrecho el contrato orientado al modelo.

Las entradas MCP permanecen en el catálogo con alcance de ejecución para que la política, las aprobaciones, los hooks,
la telemetría, la proyección de transcripción y los ids exactos de herramientas sigan compartidos con
la ejecución normal de herramientas. Las vistas orientadas al invitado `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` y `tools.call(...)` omiten las entradas MCP. El
espacio de nombres generado `MCP.<server>.<tool>({ ...input })` se resuelve de vuelta al
id exacto del catálogo y se despacha mediante la misma ruta del ejecutor.

## Interacción con Búsqueda de herramientas

El modo de código sustituye la superficie del modelo de Búsqueda de herramientas de OpenClaw en ejecuciones donde está
activo.

Cuando `tools.codeMode.enabled` es true y se activa el modo de código:

- OpenClaw no expone `tool_search_code`, `tool_search`, `tool_describe`
  ni `tool_call` como herramientas visibles para el modelo.
- La misma idea de catalogación se mueve dentro del runtime invitado.
- El runtime invitado recibe metadatos compactos de `ALL_TOOLS` y helpers de búsqueda/descripción/
  llamada para herramientas que no son MCP.
- Las llamadas MCP usan el espacio de nombres generado `MCP` y sus encabezados `$api()` en lugar
  de `tools.call(...)`.
- Las llamadas anidadas se despachan mediante la misma ruta de ejecutor de OpenClaw que usa Búsqueda de herramientas.

Consulta [Búsqueda de herramientas](/es/tools/tool-search) para el puente de catálogo compacto de OpenClaw
que el modo de código sustituye en ejecuciones activas.

## Nombres de herramientas y colisiones

La herramienta `exec` visible para el modelo es la herramienta de modo de código. Si la herramienta normal de shell de OpenClaw
`exec` está habilitada, se oculta del modelo y se cataloga como
cualquier otra herramienta.

Dentro del runtime invitado:

- `tools.call("openclaw:core:exec", input)` puede llamar a la herramienta shell exec si
  la política lo permite.
- `tools.exec(...)` se instala solo si la entrada de catálogo shell exec tiene un
  nombre seguro no ambiguo.
- la herramienta `exec` de modo de código nunca está disponible recursivamente mediante `tools`.

Si dos herramientas se normalizan al mismo nombre seguro de conveniencia, OpenClaw omite la
función de conveniencia y exige `tools.call(id, input)`.

## Ejecución de herramientas anidadas

Cada llamada de herramienta anidada cruza el puente del host y vuelve a entrar en OpenClaw,
preservando: id de agente activo, id y clave de sesión, contexto de remitente y canal,
política de sandbox, política de aprobación, hooks `before_tool_call` de plugin, señal de cancelación,
actualizaciones de streaming cuando estén disponibles y eventos de trayectoria/auditoría.

Las llamadas anidadas se proyectan en la transcripción como llamadas de herramientas reales para que los paquetes de
soporte muestren lo ocurrido, con la proyección identificando la llamada de herramienta
de modo de código padre y el id de herramienta anidada.

Se permiten llamadas anidadas paralelas hasta `maxPendingToolCalls`.

## Ciclo de vida de ejecución e instantánea

Cada ejecución de modo de código se rastrea en un mapa en proceso indexado por `runId` (no
persistido en disco ni en una base de datos). `exec`/`wait` devuelven uno de tres estados de resultado:
`completed`, `waiting` o `failed`.

- Un resultado `waiting` almacena la instantánea de QuickJS, las solicitudes pendientes del puente y
  metadatos de alcance (id de ejecución del agente, id/clave de sesión) hasta que `wait` lo reanuda o
  caduca.
- Los valores de `runId` caducados, de sesión incorrecta, de ejecución incorrecta y desconocidos/ya en reanudación
  no producen un estado terminal distinto; emergen como un
  resultado `failed` (`code: "invalid_input"`) con un mensaje como `code mode
run is unavailable or expired.` o `code mode run belongs to a different
session.`.
- La instantánea de una ejecución se elimina del mapa tan pronto como se resuelve como
  `completed` o `failed`, o se descarta al apagar el Gateway (nada
  sobrevive a un reinicio, por diseño: esto es estado transitorio del runtime).
- OpenClaw limita el número de ejecuciones suspendidas simultáneamente por proceso (64) y
  rechaza nuevas suspensiones por encima de ese límite con `too many suspended code mode
runs.`.

El almacenamiento de instantáneas está limitado por `maxSnapshotBytes` por ejecución, el límite por proceso
de ejecuciones suspendidas anterior y `snapshotTtlSeconds`.

## Runtime QuickJS-WASI

OpenClaw carga `quickjs-wasi` como dependencia directa en el paquete propietario; no
depende de una copia transitiva instalada para una dependencia no relacionada.

Responsabilidades del runtime: compilar/cargar el módulo WebAssembly QuickJS-WASI;
crear una VM aislada por cada ejecución o reanudación de modo de código; registrar callbacks del host
con nombres estables; establecer límites de memoria e interrupción; evaluar JavaScript; drenar
trabajos pendientes; crear instantáneas del estado suspendido de la VM; restaurar instantáneas para `wait`;
desechar manejadores de VM e instantáneas después de estados terminales.

El runtime se ejecuta en un hilo worker de Node.js, fuera del bucle de eventos principal de OpenClaw.
Un bucle infinito del invitado no debe bloquear indefinidamente el proceso Gateway;
el manejador de interrupciones del worker aplica el tiempo límite de reloj de pared
independientemente de que el código invitado coopere.

## TypeScript

El soporte de TypeScript es solo una transformación de fuente: la entrada aceptada es una
cadena de código TypeScript; la salida es una cadena JavaScript evaluada por
QuickJS-WASI. No hay comprobación de tipos, resolución de módulos ni
`import`/`require`. Los diagnósticos se devuelven como resultados `failed`.

El compilador de TypeScript se carga de forma diferida solo para celdas TypeScript; las celdas de
JavaScript simple y el modo de código deshabilitado nunca lo cargan.

## Límite de seguridad

El código del modelo es hostil. El runtime usa defensa en profundidad:

- ejecuta QuickJS-WASI fuera del bucle de eventos principal, en un hilo worker
- carga `quickjs-wasi` como dependencia directa, no mediante Codex ni un
  paquete transitivo
- sin sistema de archivos, red, subprocesos, importación de módulos, variables de entorno
  ni objetos globales del host en el invitado
- usa límites de memoria e interrupción de QuickJS más un tiempo límite de reloj de pared
  del proceso padre
- aplica límites de salida, instantánea, registro y llamadas pendientes
- serializa los valores del puente del host mediante un adaptador JSON estrecho
- convierte errores del host en errores simples del invitado, nunca en objetos del ámbito del host
- descarta instantáneas por timeout, cancelación, fin de sesión o caducidad
- rechaza acceso recursivo a `exec`, `wait` y herramientas de control de Búsqueda de herramientas
- evita que las colisiones de nombres de conveniencia oculten helpers del catálogo

El sandbox es una capa de seguridad; los operadores aún pueden necesitar endurecimiento a nivel de SO
para despliegues de alto riesgo.

## Códigos de error

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` cubre argumentos incorrectos de `exec`/`wait`, lenguajes deshabilitados,
acceso a módulos rechazado, fallos de transformación de TypeScript, valores de `runId` desconocidos/caducados/
con alcance incorrecto y demasiadas ejecuciones suspendidas. `runtime_unavailable`
cubre un worker QuickJS que no logra iniciar o sale con código distinto de cero.

Los errores devueltos al invitado son datos simples; las instancias `Error` del host, objetos de pila,
prototipos y funciones del host no cruzan a QuickJS.

## Telemetría

El campo `telemetry` de cada resultado informa: tamaño del catálogo oculto y desglose por fuente
(conteos `openclaw`/`mcp`/`client`), conteos acumulados de búsqueda/descripción/llamada
para el catálogo de la ejecución y los nombres de herramientas visibles para el modelo (`exec`,
`wait`).

La telemetría no debe incluir secretos, valores de entorno sin procesar ni entradas de herramientas
sin redactar más allá de la política de trayectoria existente de OpenClaw.

## Depuración

Usa registro dirigido del transporte del modelo cuando el modo de código se comporte de forma distinta a
una ejecución normal de herramienta:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Para depurar la forma del payload, usa `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Esto registra una instantánea JSON limitada y redactada de la solicitud del modelo; úsalo solo
durante la depuración, ya que los prompts y el texto de mensajes aún pueden aparecer.

Para depurar streams, usa `OPENCLAW_DEBUG_SSE=peek` para registrar los primeros cinco
eventos SSE redactados. El modo de código también falla en cerrado si el payload final del proveedor
no contiene exactamente `exec` y `wait` después de que la superficie de modo de código
se haya activado.

## Diseño de implementación

- contrato de configuración: `tools.codeMode`
- constructor de catálogo: herramientas efectivas a entradas compactas y mapa de ids
- adaptador de superficie del modelo: reemplazar herramientas visibles por `exec` y `wait`
- adaptador de runtime QuickJS-WASI: cargar, evaluar, crear instantánea, restaurar, desechar
- supervisor de worker: timeout, cancelación, aislamiento de fallos
- adaptador de puente: callbacks del host seguros para JSON y entrega de resultados
- adaptador de transformación de TypeScript
- almacén de instantáneas: TTL, límites de tamaño, alcance de ejecución/sesión
- proyección de trayectoria para llamadas de herramientas anidadas
- contadores de telemetría y diagnósticos

La implementación reutiliza conceptos de catálogo y ejecutor de Búsqueda de herramientas, pero
no usa un hijo `node:vm` como sandbox.

## Lista de comprobación de validación

La cobertura del modo de código debe demostrar:

- la configuración deshabilitada deja sin cambios la exposición existente de herramientas
- la configuración de objeto sin `enabled: true` deja deshabilitado el modo código
- la configuración habilitada expone solo `exec` y `wait` al modelo cuando las herramientas están
  activas para la ejecución
- las ejecuciones sin herramientas en bruto, `disableTools` y las listas de permitidos vacías no activan
  la aplicación de la carga útil del modo código
- todas las herramientas no MCP efectivas aparecen en `ALL_TOOLS`
- las herramientas denegadas no aparecen en `ALL_TOOLS`
- `tools.search`, `tools.describe` y `tools.call` funcionan para las herramientas de OpenClaw
- `API.list("mcp")` y `API.read("mcp/<server>.d.ts")` exponen declaraciones MCP de estilo TypeScript
  sin una llamada de puente/herramienta
- el espacio de nombres MCP `$api()` sigue disponible como alternativa en línea para esquemas
- las llamadas al espacio de nombres MCP funcionan para herramientas MCP visibles con una entrada de objeto, mientras
  las entradas directas del catálogo MCP están ausentes de `tools.*`
- las herramientas de control de Búsqueda de herramientas están ocultas tanto de la superficie del modelo como del
  catálogo oculto
- las llamadas anidadas conservan el comportamiento de aprobación y hooks
- `exec` de shell está oculto para el modelo, pero se puede llamar por id de catálogo cuando
  está permitido
- `exec` y `wait` recursivos en modo código no se pueden llamar desde código invitado
- la entrada TypeScript se transforma y evalúa sin cargar TypeScript en
  rutas deshabilitadas o solo JavaScript
- `import`, `require`, el sistema de archivos, la red y el acceso al entorno fallan
- los bucles infinitos agotan el tiempo de espera y no pueden bloquear el Gateway
- los fallos del límite de memoria terminan la VM invitada
- los límites de salida e instantánea se aplican para llamadas completadas y suspendidas
- `wait` reanuda una instantánea suspendida y devuelve el valor final
- los valores de `runId` expirados, cancelados, de sesión incorrecta y desconocidos fallan
- la reproducción y persistencia de la transcripción conservan las llamadas de control del modo código
- la transcripción y la telemetría muestran claramente las llamadas a herramientas anidadas

## Plan de pruebas E2E

Ejecuta estas pruebas como pruebas de integración o de extremo a extremo al cambiar el runtime:

1. Inicia un Gateway con `tools.codeMode.enabled: false`.
2. Envía un turno de agente con un pequeño conjunto directo de herramientas.
3. Afirma que las herramientas visibles para el modelo no han cambiado.
4. Reinicia con `tools.codeMode.enabled: true`.
5. Envía un turno de agente con herramientas de prueba de OpenClaw, plugin, MCP y cliente.
6. Afirma que la lista de herramientas visibles para el modelo es exactamente `exec`, `wait`.
7. En `exec`, lee `ALL_TOOLS` y afirma que las herramientas de prueba efectivas están
   presentes.
8. En `exec`, llama a herramientas de OpenClaw/plugin/cliente mediante `tools.search`,
   `tools.describe` y `tools.call`.
9. En `exec`, llama a `API.list("mcp")` y `API.read("mcp/<server>.d.ts")` y
   afirma que los archivos de declaración describen herramientas MCP visibles.
10. En `exec`, llama a herramientas MCP mediante `MCP.<server>.<tool>({ ...input })` y
    afirma que las entradas directas del catálogo MCP están ausentes de `ALL_TOOLS` y
    `tools.*`.
11. Afirma que las herramientas denegadas están ausentes y no pueden llamarse mediante un id adivinado.
12. Inicia una llamada a herramienta anidada que se resuelve después de que `exec` devuelva `waiting`.
13. Llama a `wait` y afirma que la VM restaurada recibe el resultado de la herramienta.
14. Afirma que la respuesta final contiene la salida producida después de la restauración.
15. Afirma que el tiempo de espera agotado, la cancelación y la expiración de instantáneas limpian el estado del runtime.
16. Exporta la trayectoria y afirma que las llamadas anidadas son visibles bajo la llamada
    principal de modo código.

Los cambios solo de documentación en esta página aun así deben ejecutar `pnpm check:docs`.

## Relacionado

- [Búsqueda de herramientas](/es/tools/tool-search)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
- [Herramienta Exec](/es/tools/exec)
- [Ejecución de código](/es/tools/code-execution)
