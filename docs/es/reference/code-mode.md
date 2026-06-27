---
read_when:
    - Quieres habilitar el modo de código de OpenClaw para una ejecución de agente
    - Debes explicar por qué el modo de código es diferente del modo Codex Code
    - Estás revisando el contrato exec/wait, el sandbox QuickJS-WASI, la transformación TypeScript o el puente oculto del catálogo de herramientas
    - Estás agregando o revisando una integración interna del registro de espacios de nombres del modo de código
sidebarTitle: Code mode
summary: 'Modo código de OpenClaw: una superficie de herramientas exec/wait opcional respaldada por QuickJS-WASI y un catálogo de herramientas oculto con alcance de ejecución'
title: Modo de código
x-i18n:
    generated_at: "2026-06-27T12:48:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

El modo de código es una función experimental del entorno de ejecución de agentes de OpenClaw. Está desactivado de forma
predeterminada. Cuando lo habilitas, OpenClaw cambia lo que el modelo ve durante una ejecución:
en lugar de exponer directamente todos los esquemas de herramientas habilitados, el modelo ve solo
`exec` y `wait`.

Esta página documenta el modo de código de OpenClaw. No es el modo de código de Codex. Las dos
funciones comparten un nombre, pero las implementan entornos de ejecución diferentes y exponen
contratos de `exec` diferentes:

- El modo de código de Codex está habilitado para los hilos del servidor de la aplicación de Codex, a menos que una política
  de herramientas restringida desactive el modo de código nativo. Se ejecuta en el arnés de programación de Codex,
  donde el modelo escribe comandos de shell mediante un contrato `exec.command`.
- El modo de código de OpenClaw está deshabilitado a menos que se configure
  `tools.codeMode.enabled: true`. Se ejecuta en el entorno de ejecución genérico de agentes de OpenClaw, donde el modelo
  escribe programas JavaScript o TypeScript mediante un contrato `exec.code`.

El modo de código de Codex y la búsqueda dinámica de herramientas nativa de Codex son superficies estables del arnés de Codex.
El modo de código de OpenClaw es un adaptador experimental de superficie de herramientas propiedad de OpenClaw
para ejecuciones genéricas de OpenClaw. Usa `quickjs-wasi`, un catálogo oculto de herramientas de OpenClaw
y el ejecutor de herramientas normal de OpenClaw.

## ¿Qué es esto?

El modo de código de OpenClaw permite que el modelo escriba un pequeño programa JavaScript o TypeScript
en lugar de elegir directamente de una lista larga de herramientas.

Cuando el modo de código está activo:

- La lista de herramientas visible para el modelo es exactamente `exec` y `wait`.
- `exec` evalúa JavaScript o TypeScript generado por el modelo en un worker
  QuickJS-WASI restringido.
- Las herramientas normales de OpenClaw se ocultan del prompt del modelo y se exponen dentro del
  programa invitado mediante `ALL_TOOLS` y `tools`.
- El código invitado puede buscar en el catálogo oculto, describir una herramienta y llamar a una herramienta
  mediante la misma ruta de ejecución de OpenClaw que usan los turnos normales de agente.
- Las herramientas MCP se agrupan bajo el espacio de nombres `MCP`. En modo de código, este espacio de nombres
  es la única forma compatible de llamar a herramientas MCP.
- `wait` reanuda una ejecución en modo de código suspendida cuando todavía hay llamadas anidadas a herramientas
  pendientes.

La distinción importante: el modo de código cambia la superficie de orquestación orientada al modelo.
No reemplaza las herramientas de OpenClaw, las herramientas de Plugin, las herramientas MCP, la autenticación,
la política de aprobación, el comportamiento del canal ni la selección de modelo.

## ¿Por qué es bueno?

El modo de código hace que los catálogos grandes de herramientas sean más fáciles de usar para los modelos.

- Superficie de prompt más pequeña: los proveedores reciben dos herramientas de control en lugar de decenas
  o cientos de esquemas completos de herramientas.
- Mejor orquestación: el modelo puede usar bucles, uniones, transformaciones pequeñas,
  lógica condicional y llamadas anidadas paralelas a herramientas dentro de una celda de código.
- Neutral respecto del proveedor: funciona con herramientas de OpenClaw, Plugin, MCP y cliente sin
  depender de ejecución de código nativa del proveedor.
- La política existente sigue vigente: las llamadas anidadas a herramientas siguen pasando por la política,
  las aprobaciones, los hooks, el contexto de sesión y las rutas de auditoría de OpenClaw.
- Modo de fallo claro: cuando el modo de código está habilitado explícitamente y el entorno de ejecución
  no está disponible, OpenClaw falla de forma cerrada en lugar de volver a una exposición amplia directa de herramientas.

El modo de código es especialmente útil para agentes con un catálogo grande de herramientas habilitadas o
para flujos de trabajo en los que el modelo necesita repetidamente buscar, combinar y llamar
herramientas antes de producir una respuesta.

## Cómo habilitarlo

Agrega `tools.codeMode.enabled: true` a la configuración del agente o del entorno de ejecución:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

También se acepta la forma abreviada:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

El modo de código permanece desactivado cuando `tools.codeMode` se omite, es `false` o es un objeto
sin `enabled: true`.

Cuando uses agentes aislados con servidores MCP configurados, asegúrate también de que la
política de herramientas del sandbox permita el Plugin MCP incluido, por ejemplo con
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Consulta
[Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Usa límites explícitos cuando quieras límites más estrictos:

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

Para confirmar la forma de la carga útil del modelo durante la depuración, ejecuta el Gateway con
registro dirigido:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Con el modo de código activo, los nombres de herramientas orientados al modelo registrados deberían ser `exec` y
`wait`. Si necesitas la carga útil redactada del proveedor, agrega
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` durante una sesión breve de depuración.

## Recorrido técnico

El resto de esta página describe el contrato del entorno de ejecución y los detalles de implementación.
Está destinada a mantenedores, autores de Plugin que depuran la exposición de herramientas y
operadores que validan despliegues de alto riesgo.

## Estado del entorno de ejecución

- Entorno de ejecución: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Estado predeterminado: deshabilitado.
- Estabilidad: superficie experimental de OpenClaw; el modo de código de Codex es una superficie estable separada
  del arnés de Codex.
- Superficie objetivo: ejecuciones genéricas de agentes de OpenClaw.
- Postura de seguridad: el código del modelo es hostil.
- Promesa de cara al usuario: habilitar el modo de código nunca vuelve silenciosamente a una exposición amplia
  directa de herramientas.

## Alcance

El modo de código posee la forma de orquestación orientada al modelo para una ejecución preparada. No
posee la selección de modelo, el comportamiento del canal, la autenticación, la política de herramientas ni las implementaciones
de herramientas.

Dentro del alcance:

- definiciones de herramientas `exec` y `wait` visibles para el modelo
- construcción del catálogo oculto de herramientas
- ejecución invitada de JavaScript y TypeScript
- entorno de ejecución worker QuickJS-WASI
- callbacks del host para búsqueda en catálogo, descripción de esquema y llamada a herramienta
- estado reanudable para programas invitados suspendidos
- límites de salida, tiempo de espera, memoria, llamadas pendientes y snapshots
- telemetría y proyección de trayectoria para llamadas anidadas a herramientas

Fuera del alcance:

- ejecución remota de código nativa del proveedor
- semántica de ejecución de shell
- cambiar la autorización existente de herramientas
- scripts persistentes escritos por usuarios
- acceso a gestor de paquetes, archivos, red o módulos en código invitado
- reutilización directa de los componentes internos del modo de código de Codex

Las herramientas propiedad del proveedor, como sandboxes remotos de Python, siguen siendo herramientas separadas. Consulta
[Ejecución de código](/es/tools/code-execution).

## Términos

**Modo de código** es el modo del entorno de ejecución de OpenClaw que oculta las herramientas normales del modelo y
expone solo `exec` y `wait`.

**Entorno de ejecución invitado** es la VM JavaScript QuickJS-WASI que evalúa el código del modelo.

**Puente de host** es la superficie estrecha de callbacks compatibles con JSON desde el código invitado
de vuelta a OpenClaw.

**Catálogo** es la lista con alcance de ejecución de herramientas efectivas después de la política normal de herramientas,
la resolución de Plugin, MCP y herramientas de cliente.

**Llamada anidada a herramienta** es una llamada a herramienta realizada desde código invitado mediante el puente de host.

**Snapshot** es el estado serializado de la VM QuickJS-WASI guardado para que `wait` pueda continuar una
ejecución en modo de código suspendida.

## Configuración

`tools.codeMode.enabled` es la puerta de activación. Establecer otros campos de modo de código
no habilita la función.

Campos admitidos:

- `enabled`: booleano. Valor predeterminado `false`. Habilita el modo de código solo cuando es `true`.
- `runtime`: `"quickjs-wasi"`. Único entorno de ejecución admitido.
- `mode`: `"only"`. Expone `exec` y `wait`, oculta las herramientas normales del modelo.
- `languages`: arreglo de `"javascript"` y `"typescript"`. El valor predeterminado incluye
  ambos.
- `timeoutMs`: límite de reloj de pared para un `exec` o `wait`. Valor predeterminado `10000`.
  Límite del entorno de ejecución: `100` a `60000`.
- `memoryLimitBytes`: límite del heap de QuickJS. Valor predeterminado `67108864`. Límite del entorno de ejecución:
  `1048576` a `1073741824`.
- `maxOutputBytes`: límite para texto devuelto, JSON y registros. Valor predeterminado `65536`.
  Límite del entorno de ejecución: `1024` a `10485760`.
- `maxSnapshotBytes`: límite para snapshots serializados de VM. Valor predeterminado `10485760`.
  Límite del entorno de ejecución: `1024` a `268435456`.
- `maxPendingToolCalls`: límite para llamadas anidadas concurrentes a herramientas. Valor predeterminado `16`.
  Límite del entorno de ejecución: `1` a `128`.
- `snapshotTtlSeconds`: cuánto tiempo puede reanudarse una VM suspendida. Valor predeterminado `900`.
  Límite del entorno de ejecución: `1` a `86400`.
- `searchDefaultLimit`: número predeterminado de resultados de búsqueda del catálogo oculto. Valor predeterminado `8`.
  El entorno de ejecución lo limita a `maxSearchLimit`.
- `maxSearchLimit`: número máximo de resultados de búsqueda del catálogo oculto. Valor predeterminado `50`.
  Límite del entorno de ejecución: `1` a `50`.

Si el modo de código está habilitado pero QuickJS-WASI no puede cargarse, OpenClaw falla de forma cerrada para
esa ejecución. No expone silenciosamente herramientas normales como alternativa.

## Activación

El modo de código se evalúa después de conocer la política efectiva de herramientas y antes de que se
ensamble la solicitud final al modelo.

Orden de activación:

1. Resolver el agente, modelo, proveedor, sandbox, canal, remitente y política de ejecución.
2. Construir la lista efectiva de herramientas de OpenClaw.
3. Agregar herramientas de Plugin, MCP y cliente elegibles.
4. Aplicar políticas de permitir y denegar.
5. Si `tools.codeMode.enabled` es falso, continuar con la exposición normal de herramientas.
6. Si está habilitado y las herramientas están activas para la ejecución, registrar las herramientas efectivas en
   el catálogo de modo de código.
7. Eliminar todas las herramientas normales de la lista de herramientas visible para el modelo.
8. Agregar `exec` y `wait` de modo de código.

Las ejecuciones que intencionalmente no tienen herramientas, como llamadas sin procesar al modelo, `disableTools`
o una lista de permitidos vacía, no activan la superficie de modo de código aunque la configuración
contenga `tools.codeMode.enabled: true`.

El catálogo de modo de código tiene alcance de ejecución. No debe filtrar herramientas de otro agente,
sesión, remitente o ejecución.

## Herramientas visibles para el modelo

Cuando el modo de código está activo, el modelo ve exactamente estas herramientas de nivel superior:

- `exec`
- `wait`

Todas las demás herramientas habilitadas se ocultan de la lista de herramientas orientada al modelo y se registran
en el catálogo de modo de código.

El modelo debería usar `exec` para orquestación de herramientas, unión de datos, bucles,
llamadas anidadas paralelas y transformaciones estructuradas. El modelo debería usar
`wait` solo cuando `exec` devuelva un resultado `waiting` reanudable.

## `exec`

`exec` inicia una celda de modo de código y devuelve un resultado. El código de entrada lo genera el modelo
y debe tratarse como hostil.

Entrada:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Reglas de entrada:

- Uno de `code` o `command` debe no estar vacío.
- `code` es el campo documentado orientado al modelo.
- `command` se acepta como alias compatible con exec para políticas de hooks y
  reescrituras de confianza; cuando ambos están presentes, los valores deben coincidir.
- Los eventos de hooks `exec` externos de modo de código incluyen `toolKind: "code_mode_exec"` e
  incluyen `toolInputKind: "javascript" | "typescript"` cuando se conoce el lenguaje de entrada,
  para que las políticas puedan distinguir las celdas de modo de código de las llamadas `exec` de estilo shell
  que comparten el mismo nombre de herramienta.
- `language` usa `"javascript"` de forma predeterminada.
- Si `language` es `"typescript"`, OpenClaw transpila antes de evaluar.
- `exec` rechaza `import`, `require`, importación dinámica y patrones de cargador de módulos
  en v1.
- `exec` no expone recursivamente la implementación normal de `exec` de shell.

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

`exec` devuelve `waiting` cuando la VM QuickJS se suspende con estado reanudable que
todavía necesita una continuación visible para el modelo. El resultado incluye un `runId` para
`wait`. Las llamadas al puente de espacios de nombres, incluidas las llamadas al espacio de nombres MCP, se vacían automáticamente
dentro de la misma llamada `exec`/`wait` mientras están listas, de modo que un bloque de código compacto
pueda inspeccionar `$api()` y llamar a una herramienta MCP sin forzar una llamada de herramienta del modelo por cada
await de espacio de nombres.

`exec` devuelve `completed` solo cuando la VM invitada no tiene trabajo pendiente y el
valor final es compatible con JSON después de que se ejecuta el adaptador de salida de OpenClaw.

## `wait`

`wait` continúa una VM suspendida en modo código.

Entrada:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

La salida es la misma unión `CodeModeResult` que devuelve `exec`.

`wait` existe porque las herramientas anidadas de OpenClaw pueden ser lentas, interactivas, estar
bloqueadas por aprobaciones o transmitir actualizaciones parciales. El modelo no debería tener que mantener abierta una llamada larga a
`exec` mientras el host espera trabajo externo.

La instantánea y restauración de QuickJS-WASI es el mecanismo de reanudación v1:

1. `exec` evalúa código hasta que se completa, falla o se suspende.
2. Al suspenderse, OpenClaw toma una instantánea de la VM de QuickJS y registra el trabajo de host
   pendiente.
3. Cuando el trabajo pendiente se resuelve, `wait` restaura la instantánea de la VM.
4. OpenClaw vuelve a registrar callbacks de host mediante nombres estables.
5. OpenClaw entrega los resultados de herramientas anidadas en la VM restaurada.
6. OpenClaw vacía los trabajos pendientes de QuickJS.
7. `wait` devuelve un resultado `completed`, `failed` u otro resultado `waiting`.

Las instantáneas son estado de runtime, no artefactos de usuario. Tienen límite de tamaño, expiran
y están acotadas a la ejecución y la sesión que las crearon.

`wait` falla cuando:

- `runId` es desconocido.
- la instantánea expiró.
- la ejecución o sesión padre se abortó.
- el llamador no está en el mismo alcance de ejecución/sesión.
- falla la restauración de QuickJS-WASI.
- restaurar superaría los límites configurados.

## API de runtime invitado

El runtime invitado expone una API global pequeña:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` es metadato compacto para el catálogo con alcance de ejecución. No contiene
esquemas completos de forma predeterminada.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

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

Las entradas de catálogo MCP no se pueden llamar mediante `tools.call(...)` ni funciones de conveniencia
en modo código. Se exponen solo mediante el espacio de nombres `MCP`
generado. Los archivos de declaración de estilo TypeScript están disponibles mediante la
superficie de archivo virtual `API` de solo lectura, para que los agentes puedan inspeccionar las firmas MCP
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

Los archivos de declaración son virtuales, no archivos escritos bajo el workspace ni el
directorio de estado. Para cada llamada `exec` en modo código, OpenClaw construye el catálogo de herramientas
con alcance de ejecución, conserva las entradas MCP visibles, renderiza `mcp/index.d.ts` más una
declaración `mcp/<server>.d.ts` por cada servidor visible e inyecta esa pequeña
tabla de solo lectura en el worker de QuickJS. El código invitado ve solo el objeto `API`:
`API.list(prefix?)` devuelve metadatos de archivo y `API.read(path)` devuelve el
contenido de declaración seleccionado. Las rutas desconocidas y los segmentos `.` / `..` se rechazan.

Esto mantiene los esquemas MCP grandes fuera del prompt del modelo. El agente aprende que la
API virtual existe a partir de la descripción de la herramienta `exec`, lee solo el
archivo de declaración necesario y luego llama a `MCP.<server>.<tool>()` con un argumento de objeto.
`MCP.<server>.$api()` sigue disponible como alternativa inline cuando el agente
necesita una respuesta de esquema de una sola herramienta dentro del programa.

El runtime invitado no debe exponer objetos del host directamente. Las entradas y salidas cruzan
el puente como valores compatibles con JSON con límites de tamaño explícitos.

## Espacios de nombres internos

Los espacios de nombres internos dan al modo código una API de dominio concisa sin agregar más
herramientas visibles para el modelo. Una integración propiedad del cargador puede registrar un espacio de nombres
como `Issues`, `Fictions` o `Calendar`; el código invitado luego llama a ese espacio de nombres
dentro del programa QuickJS mientras OpenClaw sigue mostrando solo `exec` y `wait` al
modelo.

Los espacios de nombres son internos por ahora. No hay una API pública de espacios de nombres del SDK de Plugin:
los espacios de nombres de plugins externos necesitan un contrato propiedad del cargador para que la identidad del plugin,
los manifiestos instalados, el estado de autenticación y los descriptores de catálogo en caché no puedan desviarse
de las herramientas del plugin que respaldan el espacio de nombres. El modo código del core posee solo el
sandbox, la serialización, el filtrado del catálogo y el despacho del puente.

El código invitado puede usar entonces el global directo o el mapa `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Ciclo de vida del registro

El registro de espacios de nombres es local al proceso y está indexado por id de espacio de nombres. Una
ejecución típica sigue esta ruta:

1. Un cargador de confianza llama a `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. El modo código crea el `ToolSearchRuntime` oculto para la ejecución y lee su
   catálogo con alcance de ejecución.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` conserva solo los registros
   cuyos `requiredToolNames` son todos visibles y propiedad del mismo `pluginId`.
4. Cada espacio de nombres visible llama a `createScope(ctx)` para la ejecución actual. El
   alcance recibe contexto de ejecución como `agentId`, `sessionKey`, `sessionId`,
   `runId`, configuración y estado de aborto.
5. Los datos de alcance se serializan en un descriptor simple y se inyectan en QuickJS como
   globals directos y `namespaces.<globalName>`.
6. Las llamadas invitadas se suspenden mediante el puente del worker, resuelven la ruta del espacio de nombres en
   el host, asignan la llamada a una herramienta de catálogo declarada y propiedad del plugin, y ejecutan
   esa herramienta mediante `ToolSearchRuntime.call`.
7. OpenClaw vacía automáticamente las llamadas de puente de espacio de nombres listas dentro de la llamada activa
   a la herramienta `exec`/`wait`. Si el trabajo del espacio de nombres sigue pendiente al expirar el tiempo de espera o
   el invitado cede explícitamente, `wait` reanuda el mismo runtime de espacio de nombres más tarde.
8. La reversión o desinstalación del plugin llama a `clearCodeModeNamespacesForPlugin(pluginId)`
   para que los globals obsoletos no sobrevivan a una carga fallida del plugin.

El invariante importante: las llamadas de espacio de nombres son llamadas a herramientas de catálogo. Usan los
mismos hooks de política, aprobaciones, manejo de abortos, telemetría, proyección de transcripción
y comportamiento de suspensión/reanudación que `tools.call(...)`.

### Forma de registro

Registra espacios de nombres desde la integración que posee las herramientas subyacentes. Mantén el
alcance pequeño y expón solo verbos de dominio que se asignen a herramientas de catálogo declaradas.

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

`createCodeModeNamespaceTool(toolName, inputMapper)` marca un miembro de alcance como una
función de espacio de nombres invocable. El `inputMapper` opcional recibe los argumentos
invitados y devuelve el objeto de entrada para la herramienta de catálogo subyacente. Sin un
mapeador de entrada, se usa el primer argumento invitado, o `{}` cuando se omite.

Las funciones de host sin procesar se rechazan antes de que se ejecute el código invitado:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Propiedad y visibilidad

La propiedad del espacio de nombres está vinculada al `pluginId` del llamador del registro.
`requiredToolNames` es a la vez una puerta de visibilidad y una comprobación de propiedad:

- toda herramienta requerida debe existir en el catálogo de ejecución
- toda herramienta requerida debe tener `sourceName === pluginId`
- el espacio de nombres se oculta cuando cualquier herramienta requerida falta o pertenece a otro
  plugin
- cada ruta invocable puede apuntar solo a una herramienta nombrada en `requiredToolNames`

Esto evita que otro plugin exponga un espacio de nombres registrando una herramienta con el
mismo nombre. También mantiene los espacios de nombres alineados con la política ordinaria de agentes:
si la ejecución no puede ver las herramientas subyacentes, no puede ver el espacio de nombres.

Por ejemplo, un espacio de nombres de GitHub debería vivir detrás de una extensión propiedad de GitHub que
posea autenticación de GitHub, clientes REST o GraphQL, límites de tasa, aprobaciones de escritura y
pruebas. El modo código del core no debería incrustar APIs específicas de GitHub, manejo de tokens ni
política de proveedor.

### Reglas de serialización de alcance

`createScope(ctx)` puede devolver un objeto simple que contenga valores compatibles con JSON,
arrays, objetos anidados y marcadores de llamada `createCodeModeNamespaceTool(...)`.
Los objetos de host nunca entran directamente en QuickJS.

El serializador rechaza:

- funciones sin procesar
- grafos de objetos circulares
- segmentos de ruta inseguros: `__proto__`, `constructor`, `prototype`, claves vacías o
  claves que contienen el separador de ruta interno
- valores `globalName` que no son identificadores JavaScript
- colisiones de `globalName` con globals integrados del modo código como `tools`,
  `namespaces`, `text`, `json`, `yield_control` o `__openclaw*`

Los valores que no se pueden serializar como JSON se convierten a valores de reserva seguros para JSON
antes de cruzar el puente. Los datos binarios, handles, sockets, clientes e
instancias de clases deberían permanecer detrás de herramientas de catálogo ordinarias.

### Prompts

La `description` del espacio de nombres y el `prompt` opcional se agregan al esquema `exec`
visible para el modelo solo cuando el espacio de nombres es visible para esa ejecución. Úsalos
para enseñar la superficie útil más pequeña:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Mantén los prompts centrados en el contrato del espacio de nombres, no en la configuración de autenticación, el historial de
implementación ni comportamiento no relacionado del plugin.

### Limpieza

Los espacios de nombres son registros locales al proceso. Elimínalos cuando el plugin
propietario se deshabilite, se desinstale o se revierta:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

La limpieza del modo de código es propiedad del plugin; borra los registros de
espacios de nombres del plugin cuando termine su ciclo de vida, en lugar de
mantener manejadores de desmontaje por espacio de nombres. Las pruebas pueden
llamar a `clearCodeModeNamespacesForTest()` para evitar fugas de registros
entre casos.

### Lista de comprobación de pruebas

Los cambios de espacio de nombres deben cubrir el límite de seguridad y el
comportamiento del invitado:

- el texto del prompt del espacio de nombres aparece solo cuando las herramientas de respaldo son visibles
- las herramientas con el mismo nombre de otro `sourceName` no exponen el espacio de nombres
- se rechazan las funciones de alcance sin procesar
- se rechazan los ids de espacio de nombres falsificados y las rutas falsificadas
- las rutas invocables no pueden apuntar a herramientas no declaradas
- los objetos anidados y las referencias compartidas se serializan correctamente
- las llamadas de espacio de nombres se ejecutan mediante herramientas de catálogo y devuelven detalles seguros para JSON
- el código invitado puede capturar los fallos
- las llamadas de espacio de nombres suspendidas se reanudan mediante `wait`
- la reversión del plugin borra los registros de espacio de nombres de su propiedad

Los espacios de nombres complementan el catálogo genérico `tools.search` / `tools.call`. Usa el
catálogo para herramientas arbitrarias habilitadas de OpenClaw, plugins y clientes; usa `MCP` para
herramientas MCP; usa otros espacios de nombres para APIs de dominio documentadas y propiedad de plugins donde
el código conciso sea más fiable que las búsquedas repetidas de esquemas.

## API de salida

`text(value)` agrega salida legible por humanos al arreglo `output`.

`json(value)` agrega un elemento de salida estructurado después de una
serialización compatible con JSON.

El valor final devuelto por el código invitado se convierte en `value` en un resultado `completed`.

Elemento de salida:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Reglas de salida:

- el orden de salida coincide con las llamadas del invitado
- la salida está limitada por `maxOutputBytes`
- los valores no serializables se convierten en cadenas simples o errores
- los valores binarios no son compatibles en v1
- las imágenes y los archivos viajan mediante herramientas ordinarias de OpenClaw, no mediante el
  puente del modo de código

## Catálogo de herramientas

El catálogo oculto incluye herramientas después del filtrado de políticas efectivo:

1. Herramientas principales de OpenClaw.
2. Herramientas de plugins incluidos.
3. Herramientas de plugins externos.
4. Herramientas MCP.
5. Herramientas proporcionadas por el cliente para la ejecución actual.

Los ids de catálogo son estables dentro de una ejecución y deterministas entre conjuntos de herramientas equivalentes
cuando sea posible.

Forma de id recomendada:

```text
<source>:<owner>:<tool-name>
```

Ejemplos:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

El catálogo omite las herramientas de control del modo de código:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Esto evita la recursión y mantiene estrecho el contrato orientado al modelo.

Las entradas MCP permanecen en el catálogo con alcance de ejecución para que la política, las aprobaciones, los hooks,
la telemetría, la proyección de transcripción y los ids exactos de herramientas sigan compartiéndose con la ejecución
normal de herramientas. Las vistas orientadas al invitado `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` y `tools.call(...)` omiten las entradas MCP. El espacio de nombres
generado `MCP.<server>.<tool>({ ...input })` se resuelve de vuelta al
id exacto del catálogo y luego despacha por la misma ruta de ejecutor.

## Interacción con Búsqueda de herramientas

El modo de código sustituye la superficie de modelo Búsqueda de herramientas de OpenClaw para ejecuciones donde está
activo.

Cuando `tools.codeMode.enabled` es true y el modo de código se activa:

- OpenClaw no expone `tool_search_code`, `tool_search`, `tool_describe`,
  ni `tool_call` como herramientas visibles para el modelo.
- La misma idea de catalogación se mueve dentro del runtime invitado.
- El runtime invitado recibe metadatos compactos de `ALL_TOOLS` y helpers de búsqueda, descripción
  e invocación para herramientas no MCP.
- Las llamadas MCP usan el espacio de nombres `MCP` generado y sus encabezados `$api()` en lugar
  de `tools.call(...)`.
- Las llamadas anidadas despachan por la misma ruta de ejecutor de OpenClaw que usa Búsqueda de herramientas.

La página existente [Búsqueda de herramientas](/es/tools/tool-search) describe el puente de catálogo compacto de OpenClaw.
El modo de código es la alternativa genérica de OpenClaw para ejecuciones que pueden usar
`exec` y `wait`.

## Nombres de herramientas y colisiones

La herramienta `exec` visible para el modelo es la herramienta del modo de código. Si la herramienta normal de shell
`exec` de OpenClaw está habilitada, se oculta del modelo y se cataloga como cualquier
otra herramienta.

Dentro del runtime invitado:

- `tools.call("openclaw:core:exec", input)` puede llamar a la herramienta shell exec si
  la política lo permite.
- `tools.exec(...)` se instala solo si la entrada de catálogo shell exec tiene un
  nombre seguro no ambiguo.
- la herramienta `exec` del modo de código nunca está disponible recursivamente mediante `tools`.

Si dos herramientas se normalizan al mismo nombre de conveniencia seguro, OpenClaw omite la
función de conveniencia y requiere `tools.call(id, input)`.

## Ejecución anidada de herramientas

Cada llamada de herramienta anidada cruza el puente del host y vuelve a entrar en OpenClaw.

La ejecución anidada preserva:

- id del agente activo
- id de sesión y clave de sesión
- contexto del remitente y canal
- política de sandbox
- política de aprobación
- hooks `before_tool_call` del plugin
- señal de cancelación
- actualizaciones de streaming cuando estén disponibles
- eventos de trayectoria y auditoría

Las llamadas anidadas se proyectan en la transcripción como llamadas de herramientas reales para que los paquetes de soporte
puedan mostrar qué ocurrió. La proyección identifica la llamada de herramienta de modo de código padre
y el id de la herramienta anidada.

Las llamadas anidadas paralelas se permiten hasta `maxPendingToolCalls`.

## Estado del runtime

Cada ejecución de modo de código tiene una máquina de estados:

- `running`: la VM se está ejecutando o hay llamadas anidadas en curso.
- `waiting`: existe una instantánea de la VM y puede reanudarse con `wait`.
- `completed`: se devolvió el valor final; se eliminó la instantánea.
- `failed`: se devolvió un error; se eliminó la instantánea.
- `expired`: la instantánea o el estado pendiente superó la retención; no puede reanudarse.
- `aborted`: se canceló la ejecución/sesión padre; se eliminó la instantánea.

El estado tiene alcance por ejecución de agente, sesión e id de llamada de herramienta. Una llamada `wait` de una
ejecución o sesión diferente falla.

El almacenamiento de instantáneas está acotado:

- bytes máximos de instantánea por ejecución
- instantáneas vivas máximas por proceso
- TTL de instantánea
- limpieza al final de la ejecución
- limpieza al apagar el Gateway donde no se admite persistencia

## Runtime QuickJS-WASI

OpenClaw carga `quickjs-wasi` como dependencia directa en el paquete propietario. El
runtime no depende de una copia transitiva instalada para proxy, PAC u otras
dependencias no relacionadas.

Responsabilidades del runtime:

- compilar o cargar el módulo WebAssembly QuickJS-WASI
- crear una VM aislada por ejecución o reanudación de modo de código
- registrar callbacks del host con nombres estables
- establecer límites de memoria e interrupción
- evaluar JavaScript
- drenar trabajos pendientes
- tomar instantáneas del estado suspendido de la VM
- restaurar instantáneas para `wait`
- liberar manejadores de VM e instantáneas después de estados terminales

El runtime se ejecuta fuera del bucle de eventos principal de OpenClaw en un worker. Un
bucle infinito del invitado no debe bloquear indefinidamente el proceso Gateway.

## TypeScript

La compatibilidad con TypeScript es solo una transformación de código fuente:

- entrada aceptada: una cadena de código TypeScript
- salida: cadena JavaScript evaluada por QuickJS-WASI
- sin verificación de tipos
- sin resolución de módulos
- sin `import` ni `require` en v1
- los diagnósticos se devuelven como resultados `failed`

El compilador de TypeScript se carga de forma diferida solo para celdas TypeScript. Las celdas de
JavaScript simple y el modo de código deshabilitado no cargan el compilador.

La transformación debe preservar números de línea útiles cuando sea factible.

## Límite de seguridad

El código del modelo es hostil. El runtime usa defensa en profundidad:

- ejecutar QuickJS-WASI fuera del bucle de eventos principal
- cargar `quickjs-wasi` como dependencia directa, no mediante Codex ni un paquete
  transitivo
- sin sistema de archivos, red, subprocesos, importación de módulos, variables de entorno ni
  objetos globales del host en el invitado
- usar límites de memoria e interrupción de QuickJS
- aplicar timeout de reloj de pared del proceso padre
- aplicar límites de salida, instantánea, log y llamadas pendientes
- serializar valores del puente del host mediante un adaptador JSON estrecho
- convertir errores del host en errores simples del invitado, nunca objetos del realm del host
- descartar instantáneas en timeout, cancelación, fin de sesión o vencimiento
- rechazar acceso recursivo a `exec`, `wait` y herramientas de control de Búsqueda de herramientas
- evitar que colisiones de nombres de conveniencia oculten helpers de catálogo

El sandbox es una capa de seguridad. Los operadores aún pueden necesitar endurecimiento a nivel de SO
para implementaciones de alto riesgo.

## Códigos de error

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

Los errores devueltos al invitado son datos simples. Las instancias `Error` del host, los objetos de pila,
los prototipos y las funciones del host no cruzan hacia QuickJS.

## Telemetría

El modo de código informa:

- nombres de herramientas visibles enviados al modelo
- tamaño del catálogo oculto y desglose por fuente
- recuentos de `exec` y `wait`
- recuentos de búsqueda, descripción e invocación anidadas
- ids de herramientas anidadas llamadas
- fallos de límites de timeout, memoria, instantánea y salida
- eventos del ciclo de vida de instantáneas

La telemetría no debe incluir secretos, valores de entorno sin procesar ni entradas de herramientas sin redactar
más allá de la política existente de trayectoria de OpenClaw.

## Depuración

Usa logging dirigido de transporte de modelo cuando el modo de código se comporte de forma diferente a una
ejecución normal de herramienta:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Para depurar la forma de la carga útil, usa `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Esto registra una instantánea JSON acotada y redactada de la solicitud al modelo; solo debe
usarse durante la depuración porque los prompts y el texto de mensajes aún pueden aparecer.

Para depuración de streams, usa `OPENCLAW_DEBUG_SSE=peek` para registrar los primeros cinco
eventos SSE redactados. El modo de código también falla en cerrado si la carga útil final del proveedor
no contiene exactamente `exec` y `wait` después de que la superficie de modo de código se haya
activado.

## Diseño de implementación

Unidades de implementación:

- contrato de configuración: `tools.codeMode`
- constructor de catálogo: herramientas efectivas a entradas compactas y mapa de ids
- adaptador de superficie de modelo: reemplazar herramientas visibles con `exec` y `wait`
- adaptador de runtime QuickJS-WASI: cargar, evaluar, instantánea, restaurar, liberar
- supervisor de worker: timeout, cancelación, aislamiento de fallos
- adaptador de puente: callbacks del host seguros para JSON y entrega de resultados
- adaptador de transformación TypeScript
- almacén de instantáneas: TTL, límites de tamaño, alcance por ejecución/sesión
- proyección de trayectoria para llamadas de herramientas anidadas
- contadores de telemetría y diagnósticos

La implementación reutiliza conceptos de catálogo y ejecutor de Búsqueda de herramientas, pero
no usa el hijo `node:vm` como sandbox.

## Lista de comprobación de validación

La cobertura del modo de código debe demostrar:

- la configuración deshabilitada deja sin cambios la exposición de herramientas existente
- la configuración de objeto sin `enabled: true` deja deshabilitado el modo de código
- la configuración habilitada expone solo `exec` y `wait` al modelo cuando las herramientas están
  activas para la ejecución
- las ejecuciones sin herramientas sin procesar, `disableTools` y las listas de permitidos vacías no activan la aplicación obligatoria de la carga útil del modo de código
- todas las herramientas efectivas que no son MCP aparecen en `ALL_TOOLS`
- las herramientas denegadas no aparecen en `ALL_TOOLS`
- `tools.search`, `tools.describe` y `tools.call` funcionan para herramientas de OpenClaw
- `API.list("mcp")` y `API.read("mcp/<server>.d.ts")` exponen declaraciones MCP de estilo TypeScript
  sin una llamada de puente/herramienta
- el espacio de nombres MCP `$api()` permanece disponible como alternativa insertada para esquemas
- las llamadas al espacio de nombres MCP funcionan para herramientas MCP visibles con una entrada de objeto, mientras que
  las entradas directas del catálogo MCP están ausentes de `tools.*`
- las herramientas de control de Búsqueda de herramientas están ocultas tanto de la superficie del modelo como del catálogo
  oculto
- las llamadas anidadas conservan el comportamiento de aprobación y hooks
- el `exec` de shell está oculto para el modelo, pero puede llamarse por id de catálogo cuando está permitido
- `exec` y `wait` recursivos del modo de código no pueden llamarse desde código invitado
- la entrada TypeScript se transforma y evalúa sin cargar TypeScript en rutas
  deshabilitadas o solo JavaScript
- `import`, `require`, el sistema de archivos, la red y el acceso al entorno fallan
- los bucles infinitos agotan el tiempo de espera y no pueden bloquear el Gateway
- los fallos del límite de memoria terminan la VM invitada
- los límites de salida e instantánea se aplican para llamadas completadas y suspendidas
- `wait` reanuda una instantánea suspendida y devuelve el valor final
- los valores `runId` caducados, abortados, de sesión incorrecta y desconocidos fallan
- la reproducción y persistencia de la transcripción conservan las llamadas de control del modo de código
- la transcripción y la telemetría muestran claramente las llamadas de herramienta anidadas

## Plan de pruebas E2E

Ejecuta estas como pruebas de integración o de extremo a extremo al cambiar el runtime:

1. Inicia un Gateway con `tools.codeMode.enabled: false`.
2. Envía un turno de agente con un pequeño conjunto directo de herramientas.
3. Comprueba que las herramientas visibles para el modelo no cambian.
4. Reinicia con `tools.codeMode.enabled: true`.
5. Envía un turno de agente con herramientas de prueba de OpenClaw, plugin, MCP y cliente.
6. Comprueba que la lista de herramientas visible para el modelo es exactamente `exec`, `wait`.
7. En `exec`, lee `ALL_TOOLS` y comprueba que las herramientas de prueba efectivas están presentes.
8. En `exec`, llama a herramientas de OpenClaw/plugin/cliente mediante `tools.search`,
   `tools.describe` y `tools.call`.
9. En `exec`, llama a `API.list("mcp")` y `API.read("mcp/<server>.d.ts")`, y
   comprueba que los archivos de declaración describen las herramientas MCP visibles.
10. En `exec`, llama a herramientas MCP mediante `MCP.<server>.<tool>({ ...input })` y
    comprueba que las entradas directas del catálogo MCP están ausentes de `ALL_TOOLS` y `tools.*`.
11. Comprueba que las herramientas denegadas están ausentes y no pueden llamarse mediante un id adivinado.
12. Inicia una llamada de herramienta anidada que se resuelve después de que `exec` devuelva `waiting`.
13. Llama a `wait` y comprueba que la VM restaurada recibe el resultado de la herramienta.
14. Comprueba que la respuesta final contiene la salida producida después de restaurar.
15. Comprueba que el tiempo de espera, la cancelación y la caducidad de instantáneas limpian el estado del runtime.
16. Exporta la trayectoria y comprueba que las llamadas anidadas son visibles bajo la llamada
    principal de modo de código.

Los cambios solo de documentación en esta página aun así deben ejecutar `pnpm check:docs`.

## Relacionado

- [Búsqueda de herramientas](/es/tools/tool-search)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Herramienta Exec](/es/tools/exec)
- [Ejecución de código](/es/tools/code-execution)
