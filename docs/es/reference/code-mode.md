---
read_when:
    - Quiere habilitar el modo de código de OpenClaw para una ejecución del agente
    - Debes explicar por qué el modo de código es diferente del modo de código de Codex
    - Está revisando el contrato compacto de herramientas, el entorno aislado QuickJS-WASI, la transformación de TypeScript o el puente oculto del catálogo de herramientas.
    - Estás añadiendo o revisando una integración interna del registro de espacios de nombres del modo de código
sidebarTitle: Code mode
summary: 'Modo de código de OpenClaw: una superficie de herramientas compacta y opcional, respaldada por QuickJS-WASI y un catálogo de herramientas oculto con alcance de ejecución'
title: Modo de código
x-i18n:
    generated_at: "2026-07-12T14:49:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb69afba5b1b204a78de0ccaf5f93922588db22ff8ee3faf40cc65af6c22f6be
    source_path: reference/code-mode.md
    workflow: 16
---

El modo de código es una característica experimental y opcional del entorno de ejecución de agentes de OpenClaw. Cuando
está habilitado, el modelo deja de ver todos los esquemas de herramientas habilitados; en su lugar, ve
`exec`, `wait` y cualquier herramienta exclusivamente directa cuyo resultado estructurado no pueda atravesar
el puente de invitado que solo admite JSON. El modelo escribe un pequeño programa JavaScript o TypeScript
que busca, describe e invoca el catálogo oculto de herramientas.

Esta página documenta el modo de código de OpenClaw, no Codex Code Mode. Ambas características
comparten un nombre y los mismos nombres de herramientas de control (`exec`, `wait`), pero son
implementaciones independientes:

- Codex Code Mode se ejecuta dentro del entorno de desarrollo de Codex. Su herramienta `exec` es una
  herramienta de gramática libre: el modelo escribe código fuente JavaScript sin procesar (opcionalmente
  precedido por una línea pragma `// @exec: {...}` para las opciones de ejecución), que se ejecuta
  en un entorno de ejecución Deno/V8.
- El modo de código de OpenClaw se ejecuta en el entorno de ejecución genérico de agentes de OpenClaw y está
  deshabilitado a menos que se configure `tools.codeMode.enabled: true`. Su herramienta `exec`
  recibe una carga JSON `{ code, language }`, que se ejecuta en un proceso de trabajo QuickJS-WASI.

Ambas son superficies de ejecución de JavaScript, no superficies de comandos del shell. Deben tratarse
como características independientes, implementadas de forma diferente, que casualmente exponen
herramientas `exec`/`wait` con nombres idénticos.

## Qué hace

- La lista de herramientas visible para el modelo pasa a ser `exec`, `wait`, además de cualquier herramienta exclusivamente directa,
  como `computer`, cuyo resultado de imagen no puede atravesar el puente de invitado.
- `exec` evalúa JavaScript o TypeScript generado por el modelo en un hilo de trabajo
  QuickJS-WASI aislado.
- Todas las herramientas habilitadas que pueden incluirse en el catálogo (núcleo de OpenClaw, Plugin, MCP, cliente) se ocultan del
  prompt del modelo y se exponen dentro del programa invitado mediante `ALL_TOOLS`
  y `tools`.
- El código invitado busca en el catálogo oculto, describe el esquema de una herramienta e invoca
  una herramienta mediante la misma ruta de ejecución que usan los turnos normales del agente (las políticas,
  aprobaciones, hooks y la telemetría siguen aplicándose).
- Las herramientas MCP se agrupan bajo el espacio de nombres `MCP`; en el modo de código, esta es la
  única forma admitida de invocarlas.
- `wait` reanuda una ejecución suspendida del modo de código cuando aún hay invocaciones de herramientas
  anidadas pendientes.

El modo de código solo cambia la superficie de orquestación orientada al modelo. No
sustituye las herramientas, las herramientas de Plugin, las herramientas MCP, la autenticación, la política de aprobación, el comportamiento
del canal ni la selección del modelo.

## Por qué usarlo

- Superficie del prompt más pequeña: los proveedores reciben dos herramientas de control y solo las pocas
  herramientas directas requeridas, en lugar de decenas o cientos de esquemas completos de herramientas.
- Mejor orquestación: el modelo puede usar bucles, combinaciones, pequeñas transformaciones,
  lógica condicional e invocaciones paralelas de herramientas anidadas dentro de una sola celda de código.
- Neutral respecto al proveedor: funciona con herramientas de OpenClaw, Plugin, MCP y cliente sin
  depender de la ejecución de código nativa del proveedor.
- Falla de forma segura: si el modo de código está habilitado, pero el entorno de ejecución QuickJS-WASI
  no está disponible, la ejecución falla en lugar de recurrir silenciosamente a una exposición directa y amplia
  de herramientas.

Resulta especialmente útil para agentes con un catálogo grande de herramientas habilitadas o para flujos de trabajo en los que
el modelo necesita buscar, combinar e invocar varias herramientas antes de responder.

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

El modo de código permanece desactivado cuando `tools.codeMode` se omite, es `false` o es un objeto
sin `enabled: true`.

Si se usan agentes en entornos aislados con servidores MCP configurados, también se debe permitir el
Plugin MCP incluido en la política de herramientas del entorno aislado, por ejemplo,
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Consulte
[Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Establezca límites explícitos para imponer restricciones más estrictas:

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

Para confirmar la forma de la carga del modelo durante la depuración, ejecute el Gateway con
registros específicos:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Con el modo de código activo, los nombres de herramientas orientados al modelo registrados deben ser `exec` y
`wait`. Para obtener la carga completa y censurada del proveedor, añada
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` durante una sesión breve de depuración.

## Recorrido técnico

El resto de esta página abarca el contrato del entorno de ejecución y los detalles de implementación,
para responsables de mantenimiento, autores de Plugin que depuran la exposición de herramientas y operadores
que validan implementaciones de alto riesgo.

## Estado del entorno de ejecución

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Entorno de ejecución | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| Estado predeterminado | deshabilitado                                                                               |
| Estabilidad          | superficie experimental de OpenClaw (Codex Code Mode es una superficie estable e independiente del entorno de desarrollo de Codex) |
| Superficie objetivo  | ejecuciones genéricas de agentes de OpenClaw                                                |
| Postura de seguridad | el código del modelo es hostil                                                              |
| Compromiso de cara al usuario | habilitar el modo de código nunca recurre silenciosamente a una exposición directa y amplia de herramientas |

## Alcance

El modo de código controla la estructura de orquestación orientada al modelo para una ejecución preparada. No controla la selección del modelo, el comportamiento del canal, la autenticación, la política de herramientas ni las implementaciones de las herramientas.

Dentro del alcance: definiciones de herramientas de control/directas visibles para el modelo, construcción del catálogo oculto de herramientas, ejecución invitada de JavaScript/TypeScript, entorno de ejecución del proceso de trabajo de QuickJS-WASI, devoluciones de llamada del host para buscar/describir/llamar, estado reanudable para programas invitados suspendidos, límites de salida/tiempo de espera/memoria/llamadas pendientes/instantáneas y proyección de telemetría/trayectoria para llamadas a herramientas anidadas.

Fuera del alcance: ejecución remota de código nativa del proveedor, semántica de ejecución del shell, cambios en la autorización existente de herramientas, scripts persistentes creados por usuarios, acceso al gestor de paquetes/archivos/red/módulos desde el código invitado y reutilización directa de los componentes internos del modo de código de Codex.

Las herramientas controladas por el proveedor, como los entornos aislados remotos de Python, son herramientas independientes. Consulte [Ejecución de código](/es/tools/code-execution).

## Términos

- **Modo de código**: el modo de entorno de ejecución de OpenClaw que oculta las herramientas del modelo compatibles con el catálogo y expone `exec`, `wait`, además de las herramientas obligatorias exclusivamente directas.
- **Entorno de ejecución invitado**: la máquina virtual JavaScript de QuickJS-WASI que evalúa el código del modelo.
- **Puente del host**: la superficie limitada de devoluciones de llamada compatibles con JSON desde el código invitado hacia OpenClaw.
- **Catálogo**: la lista de herramientas efectivas limitada a la ejecución, después de resolver la política normal de herramientas, los plugins, MCP y las herramientas del cliente.
- **Llamada a herramienta anidada**: una llamada a herramienta realizada desde el código invitado mediante el puente del host.
- **Instantánea**: estado serializado de la máquina virtual QuickJS-WASI que se guarda para que `wait` pueda continuar una ejecución suspendida del modo de código.

## Configuración

`tools.codeMode.enabled` es el control de activación; establecer otros campos no habilita la función por sí solo.

| Campo                 | Valor predeterminado          | Límite                                          |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | booleano; solo `true` habilita el modo de código |
| `runtime`             | `"quickjs-wasi"`               | único valor compatible                          |
| `mode`                | `"only"`                       | expone herramientas de control/directas y cataloga el resto |
| `languages`           | `["javascript", "typescript"]` | cualquier subconjunto de los dos                |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | limitado a `maxSearchLimit`                     |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

Si el modo de código está habilitado pero QuickJS-WASI no puede cargarse, OpenClaw aplica un cierre seguro para esa ejecución; no expone silenciosamente las herramientas normales como alternativa.

## Activación

El modo de código se evalúa después de conocer la política efectiva de herramientas y antes de ensamblar la solicitud final al modelo:

1. Resuelve el agente, el modelo, el proveedor, el entorno aislado, el canal, el remitente y la
   política de ejecución.
2. Crea la lista efectiva de herramientas de OpenClaw y añade las herramientas de plugins, MCP y
   cliente que cumplan los requisitos.
3. Aplica la política de permisos y denegaciones.
4. Si `tools.codeMode.enabled` es false, continúa con la exposición normal de herramientas.
5. Si está habilitado y las herramientas están activas para la ejecución, conserva las herramientas
   obligatorias de acceso exclusivamente directo y registra en el catálogo del modo de código
   todas las herramientas efectivas que cumplan los requisitos del catálogo.
6. Elimina las herramientas catalogadas de la lista visible para el modelo; añade `exec` y
   `wait` junto con las herramientas de acceso exclusivamente directo conservadas.

Las ejecuciones que intencionadamente no tienen herramientas (llamadas directas al modelo, `disableTools: true`
o una lista `tools.allow` vacía) no activan la superficie del modo de código aunque
se configure `tools.codeMode.enabled: true`. El modo de código y la búsqueda de herramientas de OpenClaw
son mutuamente excluyentes en una ejecución; si se activa el modo de código, no se realiza la
Compaction de la búsqueda de herramientas.

El catálogo del modo de código tiene el ámbito de la ejecución y no debe filtrar herramientas de otro
agente, sesión, remitente o ejecución.

## Herramientas visibles para el modelo

Cuando el modo de código está activo, el modelo ve `exec`, `wait` y cualquier herramienta obligatoria
de acceso exclusivamente directo. Todas las demás herramientas habilitadas se ocultan de la lista de
herramientas presentada al modelo y se registran en el catálogo del modo de código.

Usa `exec` para orquestar herramientas, combinar datos, ejecutar bucles, realizar llamadas anidadas en paralelo
y aplicar transformaciones estructuradas. Usa `wait` únicamente cuando `exec` devuelva un resultado
`waiting` que se pueda reanudar.

## `exec`

`exec` inicia una celda del modo de código y devuelve un resultado. El código de entrada lo genera el modelo
y debe tratarse como hostil.

Entrada:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Reglas:

- Uno de `code` o `command` debe tener un valor no vacío.
- `code` es el campo documentado que se presenta al modelo.
- `command` se acepta como alias compatible con exec para políticas de hooks y
  reescrituras de confianza (la herramienta normal de ejecución de shell de OpenClaw también usa un campo
  `command`); cuando ambos están presentes, los valores deben coincidir.
- El valor predeterminado de `language` es `"javascript"`; el esquema lo expone como una enumeración plana
  de cadenas (`"javascript" | "typescript"`), no como una unión `oneOf`/`anyOf`,
  ya que algunos proveedores rechazan esas estructuras.
- Si `language` es `"typescript"`, OpenClaw transpila el código antes de evaluarlo.
- `exec` rechaza `import`, `require`, la importación dinámica y los patrones de carga
  de módulos.
- `exec` nunca expone recursivamente la implementación normal de `exec` del shell.
- Los eventos de hooks del `exec` externo del modo de código contienen `toolKind: "code_mode_exec"` y
  `toolInputKind: "javascript" | "typescript"` (cuando se conoce), para que las políticas puedan
  distinguir las celdas del modo de código de las llamadas de tipo shell a `exec` que comparten el
  mismo nombre de herramienta.

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

`exec` devuelve `waiting` cuando la VM de QuickJS se suspende con un estado reanudable que
aún necesita una continuación visible para el modelo; el resultado incluye un `runId` para
`wait`. Las llamadas al puente de espacios de nombres, incluidas las llamadas a espacios de nombres de MCP, se procesan automáticamente
dentro de la misma llamada `exec`/`wait` mientras estén listas, por lo que un bloque de código
compacto puede llamar a una herramienta MCP sin requerir una llamada de herramienta del modelo por cada
espera de espacio de nombres.

`exec` devuelve `completed` únicamente cuando la VM invitada no tiene trabajo pendiente y el
valor final es compatible con JSON después de que se ejecute el adaptador de salida de OpenClaw.

## `wait`

`wait` reanuda una máquina virtual suspendida en modo de código.

Entrada:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

La salida es la misma unión `CodeModeResult` que devuelve `exec`.

`wait` existe porque las herramientas anidadas de OpenClaw pueden ser lentas, interactivas, estar sujetas a aprobación
o transmitir actualizaciones parciales; el modelo no debería tener que mantener abierta una única llamada larga a
`exec` mientras el host espera a que finalice el trabajo externo.

La instantánea/restauración de QuickJS-WASI es el mecanismo de reanudación:

1. `exec` evalúa el código hasta que se completa, falla o se suspende.
2. Cuando se suspende, OpenClaw crea una instantánea de la máquina virtual QuickJS y registra el trabajo pendiente
   del host.
3. Cuando finaliza el trabajo pendiente, `wait` restaura la instantánea de la máquina virtual y
   vuelve a registrar las devoluciones de llamada del host mediante nombres estables.
4. OpenClaw entrega los resultados de las herramientas anidadas a la máquina virtual restaurada y procesa
   los trabajos pendientes de QuickJS.
5. `wait` devuelve un resultado `completed`, `failed` u otro resultado `waiting`.

Las instantáneas son estado de ejecución, no artefactos del usuario: solo residen en un
mapa en memoria dentro del proceso (sin escritura en la base de datos ni en el disco), tienen un tamaño limitado, caducan y están
restringidas a la ejecución y la sesión que las crearon.

`wait` falla (con un resultado `failed`) cuando:

- `runId` es desconocido o su instantánea ya caducó.
- el autor de la llamada no está en el mismo ámbito de ejecución/sesión que la ejecución suspendida.
- ya hay una operación `wait` en curso para ese `runId`.
- la restauración de QuickJS-WASI falla.
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

`ALL_TOOLS` contiene metadatos compactos del catálogo con ámbito de ejecución; de forma predeterminada, no
contiene los esquemas completos.

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
Plugin propietario; no hay un valor de origen `"plugin"` independiente. `source: "mcp"` se
usa únicamente para entradas MCP en los metadatos `sourceName`/`mcp` (y se excluye
de `ALL_TOOLS`/`tools.*`; véase más adelante).

El esquema completo se carga solo cuando se solicita:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Funciones auxiliares del catálogo:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Las funciones de herramientas prácticas se instalan solo para nombres seguros inequívocos:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// Si el catálogo oculto tiene una entrada `web_search` inequívoca:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

Las entradas del catálogo MCP no se pueden invocar mediante `tools.call(...)` ni mediante funciones
prácticas en el modo de código; solo se exponen a través del espacio de nombres `MCP`
generado. Los archivos de declaraciones con estilo de TypeScript están disponibles mediante la
superficie virtual de archivos `API` de solo lectura, por lo que los agentes pueden inspeccionar las firmas MCP
sin añadir los esquemas MCP al prompt:

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

`API.read("mcp/<server>.d.ts")` devuelve declaraciones compactas inferidas a partir de los metadatos de las herramientas MCP:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Devuelve este encabezado de API con estilo de TypeScript. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Crea una incidencia de GitHub.
   * @param owner Propietario del repositorio
   * @param repo Nombre del repositorio
   * @param title Título de la incidencia
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Los archivos de declaración son virtuales; no se escriben en el espacio de trabajo ni en el directorio de estado. Para cada llamada `exec` del modo de código, OpenClaw crea el catálogo de herramientas con ámbito de ejecución, conserva las entradas MCP visibles, genera `mcp/index.d.ts` más un archivo `mcp/<server>.d.ts` por cada servidor visible e inyecta esa pequeña tabla de solo lectura en el worker de QuickJS. El código invitado solo ve el objeto `API`: `API.list(prefix?)` devuelve los metadatos de los archivos y `API.read(path)` devuelve el contenido de la declaración seleccionada. Se rechazan las rutas desconocidas y los segmentos `.`/`..`.

Esto mantiene los esquemas MCP grandes fuera del prompt del modelo: el agente descubre que la API virtual existe mediante la descripción de la herramienta `exec`, lee únicamente el archivo de declaración necesario y, a continuación, llama a `MCP.<server>.<tool>()` con un único argumento de objeto. `MCP.<server>.$api()` sigue disponible como alternativa en línea para obtener dentro del programa la respuesta del esquema de una sola herramienta.

El entorno de ejecución invitado nunca ve directamente los objetos del host. Las entradas y salidas atraviesan el puente como valores compatibles con JSON y con límites de tamaño explícitos.

## Espacios de nombres internos

Los espacios de nombres internos proporcionan al modo de código una API de dominio concisa sin añadir más herramientas visibles para el modelo. Una integración gestionada por el cargador registra un espacio de nombres como `Issues` o `Calendar`; el código invitado llama después a ese espacio de nombres dentro del programa QuickJS, mientras que el modelo sigue viendo la superficie compacta de control/directa.

Por ahora, los espacios de nombres son internos. No existe una API pública de espacios de nombres en el SDK de plugins: los espacios de nombres de plugins externos necesitan un contrato gestionado por el cargador para que la identidad del plugin, los manifiestos instalados, el estado de autenticación y los descriptores del catálogo almacenados en caché no se desincronicen de las herramientas del plugin que respaldan el espacio de nombres. El modo de código del núcleo solo gestiona el entorno aislado, la serialización, el control de acceso al catálogo y el envío a través del puente.

El código invitado puede usar el objeto global directo o el mapa `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Ciclo de vida del registro

El registro de espacios de nombres es local al proceso y usa como clave el identificador del espacio de nombres:

1. Un cargador de confianza llama a `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. El modo de código crea el `ToolSearchRuntime` oculto para la ejecución y lee su catálogo con ámbito de ejecución.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` conserva únicamente los registros cuyos `requiredToolNames` sean todos visibles y pertenezcan al mismo `pluginId`.
4. Cada espacio de nombres visible llama a `createScope(ctx)` para la ejecución actual y recibe contexto de ejecución como `agentId`, `sessionKey`, `sessionId`, `runId`, la configuración y el estado de cancelación.
5. Los datos del ámbito se serializan en un descriptor simple y se inyectan en QuickJS como objetos globales directos y como `namespaces.<globalName>`.
6. Las llamadas del código invitado se suspenden a través del puente del worker, resuelven en el host la ruta del espacio de nombres, asignan la llamada a una herramienta declarada del catálogo propiedad del plugin y ejecutan esa herramienta mediante `ToolSearchRuntime.callExactId`.
7. Las llamadas preparadas del puente de espacios de nombres se procesan automáticamente dentro de la llamada `exec`/`wait` activa; si el trabajo del espacio de nombres sigue pendiente al agotarse el tiempo de espera o si el código invitado cede el control explícitamente, `wait` reanuda más adelante el mismo entorno de ejecución del espacio de nombres.
8. La reversión o desinstalación del plugin llama a `clearCodeModeNamespacesForPlugin(pluginId)` para que los objetos globales obsoletos no sobrevivan a una carga fallida del plugin.

Las llamadas a espacios de nombres son llamadas a herramientas del catálogo: utilizan los mismos hooks de políticas, aprobaciones, gestión de cancelaciones, telemetría, proyección de transcripciones y comportamiento de suspensión/reanudación que `tools.call(...)`.

### Estructura del registro

Registre los espacios de nombres desde la integración propietaria de las herramientas subyacentes. Mantenga el ámbito reducido y exponga únicamente verbos de dominio que se correspondan con herramientas declaradas en el catálogo.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "Ayudantes para incidencias de GitHub en el repositorio actual.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) e Issues.update(number, patch).",
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

`createCodeModeNamespaceTool(toolName, inputMapper)` marca un miembro del ámbito como una función invocable del espacio de nombres. El parámetro opcional `inputMapper` recibe los argumentos del código invitado y devuelve el objeto de entrada para la herramienta subyacente del catálogo; si no se proporciona, se usa el primer argumento del código invitado o `{}` cuando se omite.

Las funciones sin procesar del host se rechazan antes de ejecutar el código invitado:

```typescript
createScope: () => ({
  // Incorrecto: esto omite el ciclo de vida de la herramienta del catálogo y se rechazará.
  list: async () => githubClient.listIssues(),
});
```

### Propiedad y visibilidad

La propiedad del espacio de nombres está vinculada al `pluginId` del autor de la llamada de registro. `requiredToolNames` sirve tanto de control de visibilidad como de comprobación de propiedad:

- todas las herramientas requeridas deben existir en el catálogo de la ejecución
- todas las herramientas requeridas deben tener `sourceName === pluginId`
- el espacio de nombres se oculta cuando falta alguna herramienta requerida o esta pertenece a otro plugin
- cada ruta invocable solo puede dirigirse a una herramienta cuyo nombre figure en `requiredToolNames`

Esto impide que otro plugin exponga un espacio de nombres mediante el registro de una herramienta con el mismo nombre y mantiene los espacios de nombres alineados con las políticas normales del agente: si la ejecución no puede ver las herramientas subyacentes, tampoco puede ver el espacio de nombres.

Por ejemplo, un espacio de nombres de GitHub debe estar detrás de un plugin propiedad de GitHub que gestione la autenticación de GitHub, los clientes REST/GraphQL, los límites de frecuencia, las aprobaciones de escritura y las pruebas. El modo de código del núcleo no debe integrar API específicas de GitHub, la gestión de tokens ni políticas de proveedores.

### Reglas de serialización del ámbito

`createScope(ctx)` puede devolver un objeto simple que contenga valores compatibles con JSON, matrices, objetos anidados y marcadores de llamada `createCodeModeNamespaceTool(...)`. Los objetos del host nunca entran directamente en QuickJS.

El serializador rechaza:

- funciones sin procesar
- grafos de objetos circulares
- segmentos de ruta no seguros: `__proto__`, `constructor`, `prototype`, claves vacías
  o claves que contengan el separador de rutas interno
- valores de `globalName` que no sean identificadores de JavaScript
- colisiones de `globalName` con variables globales integradas del modo de código, como `tools`,
  `namespaces`, `text`, `json`, `yield_control`, `MCP`, `API`, `ALL_TOOLS` o
  `__openclaw*`

Los valores que no se puedan serializar como JSON se convierten en valores alternativos
seguros para JSON antes de cruzar el puente. Los datos binarios, identificadores, sockets, clientes e
instancias de clases deben permanecer detrás de las herramientas de catálogo ordinarias.

### Prompts

La `description` del espacio de nombres y el `prompt` opcional se añaden al esquema de `exec`
visible para el modelo solo cuando el espacio de nombres es visible para esa ejecución. Úselos
para enseñar la superficie útil mínima:

```typescript
{
  description: "Herramientas auxiliares del servicio de producción de ficción.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status) y Fictions.unpaidOver(amount).",
}
```

Mantenga los prompts centrados en el contrato del espacio de nombres, no en la configuración de autenticación, el historial
de implementación ni el comportamiento no relacionado del plugin.

### Limpieza

Los espacios de nombres son registros locales del proceso. Elimínelos cuando el plugin
propietario se deshabilite, se desinstale o se revierta:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

La limpieza del modo de código corresponde al plugin; borre los registros de espacios de nombres del plugin
cuando finalice su ciclo de vida, en lugar de conservar identificadores de desactivación por espacio de nombres.
Las pruebas pueden llamar a `clearCodeModeNamespacesForTest()` para evitar que se filtren
registros entre casos.

### Lista de comprobación de pruebas

Los cambios en espacios de nombres deben cubrir el límite de seguridad y el comportamiento del entorno invitado:

- el texto del prompt del espacio de nombres aparece solo cuando las herramientas subyacentes son visibles
- las herramientas con el mismo nombre de otro `sourceName` no exponen el espacio de nombres
- se rechazan las funciones de ámbito sin procesar
- se rechazan los identificadores de espacios de nombres falsificados y las rutas falsificadas
- las rutas invocables no pueden apuntar a herramientas no declaradas
- los objetos anidados y las referencias compartidas se serializan correctamente
- las llamadas al espacio de nombres se ejecutan mediante herramientas de catálogo y devuelven detalles seguros para JSON
- el código del entorno invitado puede capturar los fallos
- las llamadas suspendidas al espacio de nombres se reanudan mediante `wait`
- la reversión del plugin borra los registros de espacios de nombres que le pertenecen

Los espacios de nombres complementan el catálogo genérico `tools.search`/`tools.call`: use el
catálogo para herramientas habilitadas arbitrarias de OpenClaw, plugins y clientes; use `MCP`
para las herramientas de MCP; use otros espacios de nombres para las API de dominio documentadas y
propiedad de plugins, donde el código conciso sea más fiable que las consultas repetidas de esquemas.

## API de salida

- `text(value)` añade una salida legible para humanos al array `output`.
- `json(value)` añade un elemento de salida estructurado después de una serialización
  compatible con JSON.
- El valor final devuelto por el código del entorno invitado se convierte en `value` en un resultado
  `completed`.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Reglas: el orden de salida coincide con el de las llamadas del invitado; la salida está limitada por
`maxOutputBytes`; los valores no serializables se convierten en cadenas de texto simples o
errores; no se admiten valores binarios. Las imágenes y los archivos se transfieren mediante
las herramientas habituales de OpenClaw, no mediante el puente del modo de código.

## Catálogo de herramientas

El catálogo oculto incluye las herramientas después de aplicar el filtrado efectivo de políticas, en este
orden: herramientas principales de OpenClaw, herramientas de plugins incluidos, herramientas de plugins externos, herramientas MCP
y, por último, herramientas proporcionadas por el cliente para la ejecución actual.

Los identificadores del catálogo son estables dentro de una ejecución y, cuando es posible, deterministas entre
conjuntos de herramientas equivalentes. Formato real:

```text
<source>:<owner>:<tool-name>
```

donde `<source>` es `openclaw`, `mcp` o `client` (las herramientas de plugins usan
`openclaw` con el identificador del plugin como `<owner>`; las herramientas principales usan `openclaw:core:*`).
Ejemplos:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

El catálogo omite las herramientas de control del modo de código (`exec`, `wait`, `tool_search_code`,
`tool_search`, `tool_describe`, `tool_call`) y las herramientas de uso exclusivamente directo. Los controles
no deben recurrir al catálogo; las herramientas de uso exclusivamente directo siguen siendo visibles para el modelo
porque sus resultados estructurados no pueden atravesar el puente de QuickJS.

Las entradas de MCP permanecen en el catálogo con ámbito de ejecución para que las políticas, las aprobaciones, los hooks,
la telemetría, la proyección de la transcripción y los identificadores exactos de las herramientas sigan compartiéndose con
la ejecución normal de herramientas. Las vistas orientadas al entorno invitado `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` y `tools.call(...)` omiten las entradas de MCP. El espacio de nombres
generado `MCP.<server>.<tool>({ ...input })` se resuelve al identificador exacto del catálogo
y se despacha mediante la misma ruta del ejecutor.

## Interacción con la búsqueda de herramientas

El modo de código sustituye la superficie del modelo de búsqueda de herramientas de OpenClaw en las ejecuciones donde
está activo.

Cuando `tools.codeMode.enabled` es true y se activa el modo de código:

- OpenClaw no expone `tool_search_code`, `tool_search`, `tool_describe`
  ni `tool_call` como herramientas visibles para el modelo.
- La misma idea de catalogación se traslada al entorno de ejecución invitado.
- El entorno de ejecución invitado recibe metadatos compactos de `ALL_TOOLS` y funciones auxiliares de búsqueda/descripción/
  llamada para herramientas que no son MCP.
- Las llamadas de MCP usan el espacio de nombres generado `MCP` y sus encabezados `$api()`
  en lugar de `tools.call(...)`.
- Las llamadas anidadas se despachan mediante la misma ruta del ejecutor de OpenClaw que usa la búsqueda de
  herramientas.

Consulte [Búsqueda de herramientas](/es/tools/tool-search) para obtener información sobre el puente de catálogo compacto de OpenClaw
que el modo de código sustituye en las ejecuciones activas.

## Nombres de herramientas y colisiones

La herramienta `exec` visible para el modelo es la herramienta del modo de código. Si la herramienta normal de
shell `exec` de OpenClaw está habilitada, se oculta del modelo y se cataloga como
cualquier otra herramienta.

Dentro del entorno de ejecución invitado:

- `tools.call("openclaw:core:exec", input)` puede llamar a la herramienta de ejecución del shell si
  la política lo permite.
- `tools.exec(...)` se instala únicamente si la entrada del catálogo de ejecución del shell tiene un
  nombre seguro inequívoco.
- la herramienta `exec` del modo de código nunca está disponible de forma recursiva mediante `tools`.

Si dos herramientas se normalizan al mismo nombre seguro de conveniencia, OpenClaw omite la
función de conveniencia y requiere `tools.call(id, input)`.

## Ejecución anidada de herramientas

Cada llamada anidada a una herramienta cruza el puente del host y vuelve a entrar en OpenClaw,
conservando: el id. del agente activo, el id. y la clave de sesión, el contexto del remitente y del canal,
la política del entorno aislado, la política de aprobación, los hooks `before_tool_call` del Plugin, la señal de
cancelación, las actualizaciones en streaming cuando estén disponibles y los eventos de trayectoria/auditoría.

Las llamadas anidadas se proyectan en la transcripción como llamadas reales a herramientas para que los paquetes de
soporte muestren lo ocurrido; la proyección identifica la llamada principal a la herramienta
del modo de código y el id. de la herramienta anidada.

Se permiten llamadas anidadas en paralelo hasta `maxPendingToolCalls`.

## Ciclo de vida de ejecuciones e instantáneas

Cada ejecución del modo de código se rastrea en un mapa en memoria del proceso, indexado por `runId` (no
se conserva en disco ni en una base de datos). `exec`/`wait` devuelven uno de tres estados de
resultado: `completed`, `waiting` o `failed`.

- Un resultado `waiting` almacena la instantánea de QuickJS, las solicitudes pendientes del puente y
  los metadatos de ámbito (id. de ejecución del agente, id./clave de sesión) hasta que `wait` lo reanuda o
  caduca.
- La caducidad y los valores `runId` de una sesión incorrecta, una ejecución incorrecta o desconocidos/que ya se están reanudando
  no producen un estado terminal distinto; se presentan como un
  resultado `failed` (`code: "invalid_input"`) con un mensaje como `code mode
run is unavailable or expired.` o `code mode run belongs to a different
session.`.
- La instantánea de una ejecución se elimina del mapa en cuanto se resuelve como
  `completed` o `failed`, o se descarta al cerrar el Gateway (nada
  sobrevive a un reinicio: se trata de estado transitorio del entorno de ejecución).
- Para trabajos de solo lectura, `exec` puede establecer `restartSafe: true`. OpenClaw entonces rechaza
  las llamadas al catálogo con efectos secundarios y los espacios de nombres de plugins antes de la ejecución, y
  marca los resultados suspendidos como seguros para reproducción. Si un reinicio interrumpe `wait`,
  la [recuperación tras reinicio](/es/gateway/restart-recovery) reconstruye el turno a partir de la
  transcripción en lugar de restaurar la instantánea local del proceso. El turno de recuperación
  permanece limitado a herramientas principales de solo lectura auditadas y herramientas de plugins
  explícitamente seguras para reproducción.
- OpenClaw limita el número de ejecuciones suspendidas simultáneamente por proceso (64) y
  rechaza nuevas suspensiones que superen ese límite con `too many suspended code mode
runs.`.

El almacenamiento de instantáneas está limitado por `maxSnapshotBytes` por ejecución, el límite por proceso
de ejecuciones suspendidas indicado anteriormente y `snapshotTtlSeconds`.

## Entorno de ejecución QuickJS-WASI

OpenClaw carga `quickjs-wasi` como dependencia directa en el paquete propietario; no
depende de una copia transitiva instalada para una dependencia no relacionada.

Responsabilidades del entorno de ejecución: compilar/cargar el módulo WebAssembly de QuickJS-WASI;
crear una máquina virtual aislada por cada ejecución o reanudación del modo de código; registrar callbacks del host
con nombres estables; establecer límites de memoria e interrupción; evaluar JavaScript; vaciar
los trabajos pendientes; crear instantáneas del estado suspendido de la máquina virtual; restaurar instantáneas para `wait`;
liberar los manejadores y las instantáneas de la máquina virtual tras los estados terminales.

El entorno de ejecución se ejecuta en un hilo worker de Node.js, fuera del bucle de eventos
principal de OpenClaw. Un bucle infinito del invitado no debe bloquear indefinidamente el proceso
del Gateway; el controlador de interrupciones del worker aplica el tiempo de espera de reloj
independientemente de que el código invitado coopere.

## TypeScript

La compatibilidad con TypeScript es únicamente una transformación de código fuente: la entrada aceptada es una
cadena de código TypeScript; la salida es una cadena JavaScript evaluada por
QuickJS-WASI. No hay comprobación de tipos, resolución de módulos ni
`import`/`require`. Los diagnósticos se devuelven como resultados `failed`.

El compilador de TypeScript se carga de forma diferida únicamente para las celdas TypeScript; las celdas de
JavaScript simples y el modo de código deshabilitado nunca lo cargan.

## Límite de seguridad

El código del modelo es hostil. El entorno de ejecución usa defensa en profundidad:

- ejecuta QuickJS-WASI fuera del bucle de eventos principal, en un hilo worker
- carga `quickjs-wasi` como dependencia directa, no mediante Codex ni un
  paquete transitivo
- no proporciona sistema de archivos, red, subprocesos, importación de módulos, variables de entorno
  ni objetos globales del host en el invitado
- usa límites de memoria e interrupción de QuickJS, además de un tiempo de espera de reloj
  del proceso principal
- aplica límites de salida, instantáneas, registros y llamadas pendientes
- serializa los valores del puente del host mediante un adaptador JSON restringido
- convierte los errores del host en errores simples del invitado, nunca en objetos del entorno del host
- descarta las instantáneas al agotarse el tiempo, producirse una cancelación, finalizar la sesión o caducar
- rechaza el acceso recursivo a `exec`, `wait` y las herramientas de control de búsqueda de herramientas
- evita que las colisiones de nombres de conveniencia oculten los auxiliares del catálogo

El entorno aislado es una capa de seguridad; es posible que los operadores sigan necesitando
medidas de protección a nivel del sistema operativo para implementaciones de alto riesgo.

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

`invalid_input` abarca argumentos incorrectos de `exec`/`wait`, lenguajes deshabilitados,
acceso rechazado a módulos, fallos de transformación de TypeScript, valores `runId` desconocidos/caducados/
fuera del ámbito correcto y un exceso de ejecuciones suspendidas. `runtime_unavailable`
abarca un worker de QuickJS que no puede iniciarse o termina con un código distinto de cero.

Los errores devueltos al invitado son datos simples; las instancias `Error` del host, los objetos de
pila, los prototipos y las funciones del host no se transfieren a QuickJS.

## Telemetría

El campo `telemetry` de cada resultado informa de: el tamaño del catálogo oculto y un desglose
por origen (recuentos de `openclaw`/`mcp`/`client`), los recuentos acumulados de búsqueda/descripción/llamadas
del catálogo de la ejecución y los nombres de herramientas visibles para el modelo (`exec`,
`wait` y las herramientas conservadas de acceso exclusivamente directo).

La telemetría no debe incluir secretos, valores de entorno sin procesar ni entradas de herramientas
sin censurar más allá de la política de trayectoria existente de OpenClaw.

## Depuración

Use el registro específico del transporte del modelo cuando el modo de código se comporte de forma diferente a
una ejecución normal de herramientas:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Para depurar la estructura de la carga útil, use `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Esto registra una instantánea JSON limitada y censurada de la solicitud del modelo; úselo únicamente
durante la depuración, ya que los prompts y el texto de los mensajes aún pueden aparecer.

Para depurar el flujo, use `OPENCLAW_DEBUG_SSE=peek` para registrar los primeros cinco
eventos SSE redactados. El modo de código también falla de forma segura si la carga útil
final del proveedor no contiene exactamente un `exec`, un `wait` y únicamente
herramientas aprobadas de uso directo después de que se haya activado la superficie del modo de código.

## Estructura de la implementación

- contrato de configuración: `tools.codeMode`
- generador de catálogo: herramientas efectivas convertidas en entradas compactas y mapa de identificadores
- adaptador de superficie del modelo: sustituye las herramientas visibles por herramientas de control y directas
- adaptador de entorno de ejecución QuickJS-WASI: cargar, evaluar, crear instantáneas, restaurar, liberar
- supervisor de procesos de trabajo: tiempo de espera, cancelación, aislamiento de fallos
- adaptador de puente: devoluciones de llamada del host compatibles con JSON y entrega de resultados
- adaptador de transformación de TypeScript
- almacén de instantáneas: TTL, límites de tamaño, ámbito de ejecución/sesión
- proyección de trayectoria para llamadas a herramientas anidadas
- contadores de telemetría y diagnósticos

La implementación reutiliza conceptos de catálogo y ejecutor de la búsqueda de herramientas, pero
no usa un proceso secundario `node:vm` como entorno aislado.

## Lista de comprobación de validación

La cobertura del modo de código debe demostrar que:

- la configuración deshabilitada no modifica la exposición existente de herramientas
- la configuración como objeto sin `enabled: true` mantiene deshabilitado el modo de código
- la configuración habilitada expone `exec`, `wait` y únicamente las herramientas obligatorias
  de uso directo al modelo cuando las herramientas están activas para la ejecución
- las ejecuciones sin herramientas sin procesar, `disableTools` y las listas de permitidos vacías no activan
  la aplicación de requisitos sobre la carga útil del modo de código
- todas las herramientas efectivas no MCP aptas para el catálogo aparecen en `ALL_TOOLS`
- las herramientas de uso directo permanecen visibles para el modelo y no aparecen en `ALL_TOOLS`
- las herramientas denegadas no aparecen en `ALL_TOOLS`
- `tools.search`, `tools.describe` y `tools.call` funcionan con las herramientas de OpenClaw
- `API.list("mcp")` y `API.read("mcp/<server>.d.ts")` exponen declaraciones de MCP
  al estilo de TypeScript sin una llamada al puente o a una herramienta
- `$api()` del espacio de nombres MCP permanece disponible como alternativa en línea para los esquemas
- las llamadas al espacio de nombres MCP funcionan con las herramientas MCP visibles mediante una entrada de objeto, mientras
  que las entradas directas del catálogo MCP no están presentes en `tools.*`
- las herramientas de control de la búsqueda de herramientas están ocultas tanto en la superficie del modelo como en el
  catálogo oculto
- las llamadas anidadas conservan el comportamiento de aprobación y de los hooks
- el `exec` del shell está oculto para el modelo, pero puede invocarse mediante el identificador del catálogo cuando
  está permitido
- los `exec` y `wait` recursivos del modo de código no pueden invocarse desde el código invitado
- la entrada de TypeScript se transforma y evalúa sin cargar TypeScript en
  rutas deshabilitadas o exclusivas de JavaScript
- el acceso mediante `import`, `require`, al sistema de archivos, a la red y al entorno falla
- los bucles infinitos agotan el tiempo de espera y no pueden bloquear el Gateway
- los fallos por límite de memoria terminan la máquina virtual invitada
- se aplican los límites de salida y de instantáneas a las llamadas completadas y suspendidas
- `wait` reanuda una instantánea suspendida y devuelve el valor final
- los valores de `runId` caducados, cancelados, de una sesión incorrecta y desconocidos fallan
- la reproducción y la persistencia de la transcripción conservan las llamadas de control del modo de código
- la transcripción y la telemetría muestran claramente las llamadas a herramientas anidadas

## Plan de pruebas E2E

Ejecute estas pruebas como pruebas de integración o de extremo a extremo al modificar el entorno de ejecución:

1. Inicie un Gateway con `tools.codeMode.enabled: false`.
2. Envíe un turno del agente con un conjunto pequeño de herramientas directas.
3. Compruebe que las herramientas visibles para el modelo no hayan cambiado.
4. Reinicie con `tools.codeMode.enabled: true`.
5. Envíe un turno del agente con herramientas de prueba de OpenClaw, Plugin, MCP y cliente.
6. Compruebe que la lista de herramientas visibles para el modelo sea `exec`, `wait` y únicamente las herramientas
   de uso directo configuradas.
7. En `exec`, lea `ALL_TOOLS` y compruebe que las herramientas de prueba efectivas aptas para el catálogo
   estén presentes y que las herramientas de uso directo estén ausentes.
8. En `exec`, invoque herramientas de OpenClaw, Plugin y cliente mediante `tools.search`,
   `tools.describe` y `tools.call`.
9. En `exec`, invoque `API.list("mcp")` y `API.read("mcp/<server>.d.ts")`, y
   compruebe que los archivos de declaraciones describan las herramientas MCP visibles.
10. En `exec`, invoque herramientas MCP mediante `MCP.<server>.<tool>({ ...input })` y
    compruebe que las entradas directas del catálogo MCP estén ausentes de `ALL_TOOLS` y
    `tools.*`.
11. Compruebe que las herramientas denegadas estén ausentes y no puedan invocarse mediante un identificador adivinado.
12. Inicie una llamada a una herramienta anidada que se resuelva después de que `exec` devuelva `waiting`.
13. Invoque `wait` y compruebe que la máquina virtual restaurada reciba el resultado de la herramienta.
14. Compruebe que la respuesta final contenga la salida generada después de la restauración.
15. Compruebe que el agotamiento del tiempo de espera, la cancelación y la caducidad de la instantánea limpien el estado del entorno de ejecución.
16. Exporte la trayectoria y compruebe que las llamadas anidadas sean visibles bajo la llamada principal
    del modo de código.

Los cambios exclusivos de documentación en esta página deben seguir ejecutando `pnpm check:docs`.

## Contenido relacionado

- [Búsqueda de herramientas](/es/tools/tool-search)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Herramienta Exec](/es/tools/exec)
- [Ejecución de código](/es/tools/code-execution)
