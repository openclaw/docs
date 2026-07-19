---
read_when:
    - Se desea habilitar el modo de código de OpenClaw para una ejecución del agente
    - Debes explicar por qué Code Mode es diferente de Codex Code Mode
    - Está revisando el contrato compacto de herramientas, el entorno aislado QuickJS-WASI, la transformación de TypeScript o el puente oculto del catálogo de herramientas
    - Está añadiendo o revisando una integración interna del registro de espacios de nombres en modo código
sidebarTitle: Code Mode
summary: Usa el modo de código de OpenClaw para descubrir, invocar y combinar amplios catálogos de herramientas en flujos de trabajo compactos de JavaScript o TypeScript
title: Modo de código
x-i18n:
    generated_at: "2026-07-19T02:12:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b3edb486f470860fdf309d2e059517e6e174b48928bd3ffce06016d340b34820
    source_path: tools/code-mode.md
    workflow: 16
---

El modo de código es una función experimental y opcional del runtime de agentes de OpenClaw. Cuando
está habilitado, el modelo deja de ver todos los esquemas de herramientas habilitadas; en su lugar, ve
`exec`, `wait` y cualquier herramienta exclusivamente directa cuyo resultado estructurado no pueda atravesar
el puente de invitado exclusivo para JSON. El modelo escribe un pequeño programa JavaScript o TypeScript
que busca, describe y llama al catálogo de herramientas oculto.

Esta página documenta el modo de código de OpenClaw, no Codex Code Mode. Las dos funciones
comparten un nombre y los mismos nombres de herramientas de control (`exec`, `wait`), pero son
implementaciones independientes:

- Codex Code Mode se ejecuta dentro del entorno de programación de Codex. Su herramienta `exec` es una
  herramienta de gramática libre: el modelo escribe código fuente JavaScript sin procesar (opcionalmente
  precedido por una línea pragma `// @exec: {...}` para las opciones de ejecución), que se ejecuta
  en el runtime de Code Mode de V8 integrado en el proceso de Codex.
- El modo de código de OpenClaw se ejecuta en el runtime genérico de agentes de OpenClaw y está
  deshabilitado a menos que se configure `tools.codeMode.enabled: true`. Su herramienta `exec`
  acepta una carga útil JSON `{ code, language }`, que se ejecuta en un
  worker QuickJS-WASI.

Ambas son superficies de ejecución de JavaScript, no superficies de comandos de shell. Deben tratarse
como funciones independientes con implementaciones diferentes que, por casualidad, exponen
herramientas `exec`/`wait` con nombres idénticos.

## Qué hace

- La lista de herramientas visible para el modelo pasa a ser `exec`, `wait`, además de cualquier herramienta exclusivamente directa
  como `computer` o el cargador de visión nativa `image`, cuyo resultado de imagen
  no puede atravesar el puente de invitado.
- `exec` evalúa JavaScript o TypeScript generado por el modelo en un hilo de
  worker QuickJS-WASI aislado.
- Todas las herramientas habilitadas aptas para el catálogo (núcleo de OpenClaw, Plugin, MCP, cliente) se ocultan como
  herramientas independientes del modelo y se exponen dentro del programa invitado mediante `ALL_TOOLS`
  y `tools`.
- La descripción de `exec` incluye un índice rápido acotado de identificadores exactos del catálogo de OpenClaw/Plugin,
  indicaciones compactas de entrada e indicaciones compactas de salida declarada cuando una
  herramienta de confianza proporciona un esquema de salida. Omite las descripciones, los esquemas completos,
  las entradas de MCP y las entradas que exceden el límite; la consulta del catálogo desde el invitado sigue siendo la alternativa.
- El código invitado busca en el catálogo oculto, describe el esquema de una herramienta y llama
  a una herramienta mediante la misma ruta de ejecución utilizada por los turnos normales del agente (las políticas,
  aprobaciones, extensiones y telemetría siguen aplicándose).
- Las herramientas de MCP se agrupan bajo el espacio de nombres `MCP`; en el modo de código, esta es la
  única forma admitida de llamarlas.
- `wait` reanuda una ejecución suspendida del modo de código cuando todavía hay
  llamadas anidadas a herramientas pendientes.

El modo de código solo cambia la superficie de orquestación orientada al modelo. No
sustituye las herramientas, las herramientas de Plugin, las herramientas de MCP, la autenticación, la política de aprobación, el comportamiento
del canal ni la selección del modelo.

## Por qué usarlo

- Superficie del prompt más pequeña: los proveedores reciben dos herramientas de control, un índice acotado de herramientas nativas
  y solo las pocas herramientas directas necesarias, en lugar de decenas o cientos
  de esquemas completos de herramientas.
- Mejor orquestación: el modelo puede usar bucles, combinaciones, pequeñas transformaciones,
  lógica condicional y llamadas anidadas paralelas a herramientas dentro de una única celda de código.
- Menos viajes de ida y vuelta del modelo: un contrato de salida declarado permite al modelo llamar y
  transformar el resultado de una herramienta en un único `exec`; las salidas desconocidas siguen devolviéndose primero sin procesar.
- Independiente del proveedor: funciona con herramientas de OpenClaw, Plugin, MCP y cliente sin
  depender de la ejecución de código nativa del proveedor.
- Falla de forma cerrada: si el modo de código está habilitado pero el runtime QuickJS-WASI no está
  disponible, la ejecución falla en lugar de recurrir silenciosamente a una exposición directa
  amplia de herramientas.

Resulta especialmente útil para agentes con un catálogo amplio de herramientas habilitadas o para flujos de trabajo en los que
el modelo necesita buscar, combinar y llamar a varias herramientas antes de responder.

Mantenga la exposición directa de herramientas para un catálogo pequeño o un modelo que no escriba de forma fiable
programas cortos. Use [Búsqueda de herramientas](/es/tools/tool-search) cuando desee un
catálogo compacto, pero prefiera controles estructurados de búsqueda/descripción/llamada en lugar del
invitado QuickJS-WASI.

## Inicio rápido

### Habilitar el modo de código

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

El modo de código permanece desactivado cuando se omite `tools.codeMode`, se usa `false` o se proporciona un objeto
sin `enabled: true`.

Si se usan agentes en entornos aislados con servidores MCP configurados, también debe permitirse el
Plugin MCP incluido en la política de herramientas del entorno aislado, por ejemplo,
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Consulte
[Configuración: herramientas y proveedores personalizados](/es/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Defina límites explícitos para establecer restricciones más estrictas:

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

### Qué hace el modelo

Para una herramienta con una salida declarada como
`Array<{ id: string; paid: boolean; tons: number }>`, un programa invitado puede
seleccionarla, llamarla y transformarla:

```javascript
const [shipmentTool] = await tools.search("listar envíos");
const shipments = await tools.callValue(shipmentTool.id, {});
return shipments.filter((shipment) => !shipment.paid && shipment.tons > 10);
```

Cuando una línea del índice rápido termina en `-> ?`, la forma de la salida es desconocida. El primer
`exec` debe devolver `await tools.callValue(...)` sin cambios. Un `exec` posterior puede
transformar el valor observado. Esto requiere un turno adicional del modelo, pero evita que el
modelo adivine los nombres de los campos.

### Verificar la superficie activa

Para confirmar la forma de la carga útil del modelo durante la depuración, ejecute el Gateway con
registros específicos:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Con el modo de código activo, los nombres registrados de las herramientas orientadas al modelo deben ser `exec` y
`wait`. Para obtener la carga útil completa y censurada del proveedor, añada
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` durante una breve sesión de depuración.

## Recorrido técnico

El resto de esta página aborda el contrato del runtime y los detalles de implementación
para responsables de mantenimiento, autores de Plugins que depuran la exposición de herramientas y operadores
que validan despliegues de alto riesgo.

## Estado del runtime

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Runtime             | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| Estado predeterminado       | deshabilitado                                                                                    |
| Estabilidad           | superficie experimental de OpenClaw (Codex Code Mode es una superficie independiente y estable del entorno de Codex) |
| Superficie de destino      | ejecuciones genéricas de agentes de OpenClaw                                                                 |
| Postura de seguridad    | el código del modelo es hostil                                                                       |
| Compromiso de cara al usuario | habilitar el modo de código nunca recurre silenciosamente a una exposición directa amplia de herramientas                  |

## Alcance

El modo de código controla la forma de orquestación orientada al modelo para una ejecución preparada. No
controla la selección del modelo, el comportamiento del canal, la autenticación, la política de herramientas ni las
implementaciones de herramientas.

Dentro del alcance: definiciones de herramientas directas y de control visibles para el modelo, construcción del catálogo
de herramientas ocultas, ejecución invitada de JavaScript/TypeScript, runtime de worker
QuickJS-WASI, devoluciones de llamada del host para buscar/describir/llamar, estado reanudable para
programas invitados suspendidos, límites de salida/tiempo de espera/memoria/llamadas pendientes/instantáneas
y proyección de telemetría/trayectoria para llamadas anidadas a herramientas.

Fuera del alcance: ejecución remota de código nativa del proveedor, semántica de ejecución
de shell, cambios en la autorización existente de herramientas, scripts persistentes creados por el usuario,
acceso a gestores de paquetes/archivos/red/módulos desde el código invitado y reutilización directa
de componentes internos de Codex Code Mode.

Las herramientas controladas por el proveedor, como los entornos aislados remotos de Python, son herramientas independientes. Consulte
[Ejecución de código](/es/tools/code-execution).

## Términos

- **Modo de código**: modo del runtime de OpenClaw que oculta las herramientas del modelo compatibles
  con el catálogo y expone `exec`, `wait`, además de las herramientas exclusivamente directas necesarias.
- **Runtime invitado**: máquina virtual JavaScript QuickJS-WASI que evalúa el código del modelo.
- **Puente del host**: superficie restringida de devoluciones de llamada compatibles con JSON desde el código invitado
  hacia OpenClaw.
- **Catálogo**: lista de herramientas efectivas con alcance de ejecución después de la resolución normal de
  la política de herramientas, los Plugins, MCP y las herramientas de cliente.
- **Llamada anidada a una herramienta**: llamada a una herramienta realizada desde el código invitado mediante el puente
  del host.
- **Instantánea**: estado serializado de la máquina virtual QuickJS-WASI guardado para que `wait` pueda continuar
  una ejecución suspendida del modo de código.

## Configuración

`tools.codeMode.enabled` es la condición de activación; configurar otros campos no
habilita la función por sí solo.

| Campo                 | Valor predeterminado                        | Restricción                                           |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | booleano; solo `true` habilita el modo de código          |
| `runtime`             | `"quickjs-wasi"`               | único valor admitido                            |
| `mode`                | `"only"`                       | expone las herramientas directas/de control y cataloga las demás |
| `languages`           | `["javascript", "typescript"]` | cualquier subconjunto de las dos                           |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | limitado a `maxSearchLimit`                     |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

Si el modo de código está habilitado pero QuickJS-WASI no puede cargarse, OpenClaw falla de forma cerrada
para esa ejecución; no expone silenciosamente las herramientas normales como alternativa.

## Activación

El modo de código se evalúa después de conocer la política efectiva de herramientas y antes de
ensamblar la solicitud final del modelo:

1. Resuelva el agente, el modelo, el proveedor, el entorno aislado, el canal, el remitente y la política de
   ejecución.
2. Cree la lista efectiva de herramientas de OpenClaw, añadiendo las herramientas elegibles de plugins, MCP y
   clientes.
3. Aplique la política de permisos y denegaciones.
4. Si `tools.codeMode.enabled` es falso, continúe con la exposición normal de herramientas.
5. Si está habilitado y hay herramientas activas para la ejecución, conserve las herramientas obligatorias
   exclusivamente directas y registre en el catálogo del modo de código cada herramienta efectiva
   que cumpla los requisitos del catálogo.
6. Elimine las herramientas catalogadas de la lista visible para el modelo; añada `exec` y
   `wait` junto con las herramientas exclusivamente directas conservadas.

Las ejecuciones que intencionadamente no tienen herramientas (llamadas directas al modelo, `disableTools: true`
o una lista `tools.allow` vacía) no activan la superficie del modo de código, aunque
`tools.codeMode.enabled: true` esté configurado. El modo de código y la búsqueda de herramientas de OpenClaw
son mutuamente excluyentes en una ejecución; si se activa el modo de código, no se realiza la
Compaction de la búsqueda de herramientas.

El catálogo del modo de código tiene el ámbito de la ejecución y no debe filtrar herramientas de otro
agente, sesión, remitente o ejecución.

## Herramientas visibles para el modelo

Cuando el modo de código está activo, el modelo ve `exec`, `wait` y cualquier herramienta obligatoria
exclusivamente directa. Todas las demás herramientas habilitadas quedan ocultas de la lista de herramientas
orientada al modelo y se registran en el catálogo del modo de código.

Utilice `exec` para la orquestación de herramientas, la combinación de datos, los bucles, las llamadas anidadas en paralelo
y las transformaciones estructuradas. Utilice `wait` solo cuando `exec` devuelva un resultado
`waiting` reanudable.

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

- Uno de `code` o `command` debe contener un valor.
- `code` es el campo documentado orientado al modelo.
- `command` se acepta como alias compatible con exec para las políticas de enlaces y
  las reescrituras de confianza (la herramienta de ejecución de shell normal de OpenClaw también utiliza un campo
  `command`); cuando ambos están presentes, los valores deben coincidir.
- `language` tiene como valor predeterminado `"javascript"`; el esquema lo expone como una enumeración
  plana de cadenas (`"javascript" | "typescript"`), no como una unión `oneOf`/`anyOf`,
  ya que algunos proveedores rechazan esas estructuras.
- Si `language` es `"typescript"`, OpenClaw transpila antes de la evaluación.
- `exec` rechaza `import`, `require`, las importaciones dinámicas y los patrones
  de cargadores de módulos.
- `exec` nunca expone de forma recursiva la implementación normal del shell `exec`.
- Los eventos externos del enlace `exec` del modo de código incluyen `toolKind: "code_mode_exec"` y
  `toolInputKind: "javascript" | "typescript"` (cuando se conocen), para que las políticas puedan
  distinguir las celdas del modo de código de las llamadas `exec` de estilo shell que comparten el
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

`exec` devuelve `waiting` cuando el entorno invitado se suspende con un estado reanudable que aún
requiere una continuación visible para el modelo: un `yield_control(...)` explícito o una
llamada a una herramienta del puente que no se haya resuelto dentro del plazo de ejecución. El resultado
incluye un `runId` para `wait`. Las llamadas a herramientas del puente —`tools.search`/`describe`/
`call` y llamadas a espacios de nombres, incluidas las llamadas a espacios de nombres MCP— se procesan automáticamente
dentro de la misma llamada `exec`/`wait` mientras se resuelvan dentro del plazo, de modo que un
bloque de código compacto que espere varias herramientas se ejecute por completo en un turno del modelo,
en lugar de requerir una llamada de herramienta del modelo por cada espera. Las ejecuciones resistentes a reinicios nunca
se procesan automáticamente; su trabajo pendiente sigue pasando por las comprobaciones seguras para la reproducción.

`exec` devuelve `completed` solo cuando la máquina virtual invitada no tiene trabajo pendiente y el
valor final es compatible con JSON después de ejecutarse el adaptador de salida de OpenClaw.

## `wait`

`wait` continúa una máquina virtual suspendida del modo de código.

Entrada:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

La salida es la misma unión `CodeModeResult` que devuelve `exec`.

`wait` existe porque las herramientas anidadas de OpenClaw pueden ser lentas, interactivas, estar sujetas a
aprobación o transmitir actualizaciones parciales; el modelo no debería tener que mantener abierta una llamada
`exec` prolongada mientras el host espera trabajo externo.

El mecanismo de reanudación consiste en crear y restaurar instantáneas de QuickJS-WASI:

1. `exec` evalúa el código hasta que se completa, falla o se suspende.
2. Tras la suspensión, OpenClaw crea una instantánea de la máquina virtual QuickJS y registra el trabajo
   pendiente del host.
3. Cuando el trabajo pendiente termina, `wait` restaura la instantánea de la máquina virtual y
   vuelve a registrar las retrollamadas del host mediante nombres estables.
4. OpenClaw entrega los resultados de las herramientas anidadas a la máquina virtual restaurada y procesa
   los trabajos pendientes de QuickJS.
5. `wait` devuelve `completed`, `failed` u otro resultado `waiting`.

Las instantáneas son estado de ejecución, no artefactos del usuario: solo residen en un
mapa dentro del proceso (sin escritura en bases de datos ni en disco), tienen un tamaño limitado, caducan y su
ámbito se limita a la ejecución y la sesión que las crearon.

`wait` falla (como resultado `failed`) cuando:

- `runId` es desconocido o su instantánea ya ha caducado.
- el llamador no se encuentra en el mismo ámbito de ejecución/sesión que la ejecución suspendida.
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

`ALL_TOOLS` contiene metadatos compactos del catálogo con ámbito de ejecución; de forma predeterminada, no contiene
los esquemas completos. La descripción de `exec` visible para el modelo también incluye un
subconjunto limitado y determinista de identificadores exactos de OpenClaw/plugins, indicaciones compactas de entrada
e indicaciones declaradas y fiables de salida. Las descripciones permanecen diferidas para que
el texto hostil del catálogo no pueda dirigir al modelo. Cuando ese índice omita una herramienta,
lea `ALL_TOOLS` o llame a `tools.search(...)` dentro del programa invitado.

La flecha de cada línea del índice rápido describe el valor `tools.callValue(...)`.
`-> Array<{ id: string }>` es una indicación declarada de salida; `-> ?` indica que la salida es desconocida.
Las salidas desconocidas mantienen primero su forma original: devuelva el valor sin cambios, obsérvelo y después
fíltrelo o transfórmelo en una llamada `exec` posterior, en lugar de adivinar nombres de campos. Esto también
se aplica cuando la lectura de una salida declarada alimenta una llamada `-> ?` final: devuelva el
valor original de esa llamada sin envolverlo en la estructura de respuesta solicitada.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
  input: string;
  output?: string;
};
```

`input` es una firma compacta de estilo TypeScript para el caso habitual. Utilice
`tools.describe(...)` cuando aún sea necesario el esquema completo exacto. Las entradas remotas de MCP
y de clientes utilizan `input: "unknown"` para que sus esquemas que no son de confianza permanezcan
diferidos hasta `describe`. `output` solo está
presente cuando existe una indicación compacta completa derivada de un elemento `outputSchema` fiable
del núcleo de OpenClaw o de un plugin. Las declaraciones de esquemas de salida de MCP y clientes no se incorporan
a esta indicación fiable del catálogo.

Las herramientas de plugins utilizan `source: "openclaw"`, con `sourceName` establecido en el identificador del
plugin propietario; no existe un valor de origen `"plugin"` independiente. `source: "mcp"` se
utiliza únicamente para las entradas MCP en los metadatos `sourceName`/`mcp` (y se excluye
de `ALL_TOOLS`/`tools.*`; véase más adelante).

El esquema completo solo se carga bajo demanda:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
  outputSchema?: unknown;
};
```

Funciones auxiliares del catálogo:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  callValue(id: string, input?: unknown): Promise<unknown>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Las funciones de herramientas de conveniencia se instalan únicamente para nombres seguros no ambiguos:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.callValue(fileRead.id, { path: "README.md" });

// Si el catálogo oculto tiene una entrada `web_search` no ambigua:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

`tools.callValue(...)` devuelve directamente el valor JSON `details` de una herramienta normal.
`tools.call(...)` conserva el envoltorio `{ tool, result }` original para los llamadores
que necesiten bloques de contenido u otros metadatos del resultado.

## Contratos de salida declarados

Las herramientas de OpenClaw pueden declarar `outputSchema` para el valor estructurado colocado en
`AgentToolResult.details`. Esto resulta útil para el modo de código y la búsqueda de herramientas; no es
un esquema de respuesta de herramienta nativo del proveedor y no modifica la exposición directa de herramientas.

Para una herramienta creada con `defineToolPlugin`, declare el esquema junto a
`parameters`:

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const Shipment = Type.Object(
  {
    id: Type.String(),
    paid: Type.Boolean(),
    tons: Type.Number(),
  },
  { additionalProperties: false },
);

export default defineToolPlugin({
  id: "shipping",
  name: "Shipping",
  description: "Herramientas de envíos.",
  tools: (tool) => [
    tool({
      name: "shipping_list",
      description: "Enumera los envíos.",
      parameters: Type.Object({}),
      outputSchema: Type.Array(Shipment),
      execute: async () => loadShipments(),
    }),
  ],
});
```

Para `api.registerTool(...)` o una herramienta de fábrica, incluya la misma propiedad `outputSchema`
en el objeto `AnyAgentTool` devuelto.

Los contratos integrados actuales incluyen `agents_list`, `apply_patch`,
`conversations_list`, `conversations_send`, `conversations_turn`, `edit`,
`openclaw`, `read`, `screen`,
`sessions_history`, `sessions_list`, `sessions_search`, `sessions_send`,
`session_status`, `spawn_task`, `terminal`, `web_fetch` y `web_search`.
Los pasos directos exactos pueden reutilizar el esquema del protocolo al que pertenecen en lugar de
duplicar un contrato exclusivo del modelo. Por ejemplo, las herramientas de conversación exponen
los mismos esquemas de resultados del Gateway que utilizan `conversations.list`,
`conversations.send` y `conversations.turn`; `web_fetch` posee un esquema
local de la herramienta cuya indicación expone metadatos estables, texto, estado de caché y
metadatos de desbordamiento anidados; `web_search` declara su unión exacta de
resultados normalizados/respuesta/error/datos sin procesar como una indicación completa del índice rápido.
Los contratos del sistema de archivos devuelven resultados estructurados de lectura de texto,
imagen, truncamiento y ausencia opcional; el estado explícito de los cambios de edición junto con
datos de diferencia/parche; y resúmenes de rutas de aplicación de parches. Cuando el índice
rápido declara los campos, una celda puede combinar el descubrimiento y la entrega
sin un turno de inspección independiente:

```javascript
const listed = await tools.conversations_list({ query: "bot de compilación" });
const target = listed.conversations.find((item) => item.label === "Bot de compilación");
if (!target) throw new Error("conversación no encontrada");
return await tools.conversations_send({
  conversationRef: target.conversationRef,
  message: "La compilación ha finalizado.",
});
```

Las llamadas anidadas siguen usando la política, los hooks y las aprobaciones normales de las herramientas.
Si un contrato completo es exacto, pero demasiado grande para el índice rápido acotado, sigue
disponible mediante `tools.describe(...)` y la flecha permanece como `-> ?`.

Las reglas de los contratos son estrictas:

- Describa el valor `details` exacto compatible con JSON, no bloques
  `content` renderizados ni un sobre del proveedor.
- Incluya todas las variantes de éxito o error que no generen excepciones. Omita `outputSchema` cuando
  la herramienta no tenga un resultado estructurado estable.
- Cierre las capas de objetos con `{ additionalProperties: false }` para obtener una
  indicación completa del índice rápido. Los esquemas abiertos, sobredimensionados o parciales por otros motivos siguen
  disponibles mediante `tools.describe(...)`, pero no permiten usar los campos en un solo turno.
- OpenClaw compila el esquema antes de ejecutar la herramienta y, a continuación, valida el
  `details` final después de los hooks normales de la herramienta y antes de que se devuelva una llamada
  al catálogo. Un esquema no válido impide ejecutar la herramienta; una discrepancia provoca un fallo sin imprimir
  el valor.
- Las indicaciones compactas son deterministas y acotadas. `tools.describe(...)` expone
  el esquema de confianza completo cuando la indicación compacta resulta insuficiente.
- El código de los plugins instalados ya es código local de confianza. Los metadatos remotos de MCP y del cliente
  siguen sin ser de confianza y no pueden optar por estas indicaciones del índice rápido.

Consulte [Plugins de herramientas](/es/plugins/tool-plugins#output-contracts) para conocer los detalles
de creación de plugins.

Las entradas del catálogo MCP no se pueden invocar mediante `tools.callValue(...)`,
`tools.call(...)` ni funciones auxiliares en el modo de código; se exponen
únicamente mediante el espacio de nombres `MCP` generado. Los archivos de declaraciones
con estilo de TypeScript están disponibles mediante la superficie de archivos virtuales de solo lectura `API`, por lo que los agentes pueden
inspeccionar las firmas MCP sin añadir esquemas MCP al prompt:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigar los registros del gateway",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` devuelve declaraciones compactas inferidas de los metadatos
de las herramientas MCP:

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

Los archivos de declaraciones son virtuales; no se escriben en el espacio de trabajo ni en el directorio
de estado. Para cada llamada `exec` del modo de código, OpenClaw crea el catálogo
de herramientas limitado a la ejecución, conserva las entradas MCP visibles, renderiza `mcp/index.d.ts` más un
`mcp/<server>.d.ts` por cada servidor visible e inyecta esa pequeña tabla de solo lectura
en el proceso de trabajo de QuickJS. El código invitado solo ve el objeto `API`:
`API.list(prefix?)` devuelve metadatos de archivos y `API.read(path)` devuelve el
contenido de la declaración seleccionada. Se rechazan las rutas desconocidas y los segmentos
`.`/`..`.

Esto mantiene los esquemas MCP grandes fuera del prompt del modelo: el agente descubre que
la API virtual existe a partir de la descripción de la herramienta `exec`, lee solo el
archivo de declaraciones necesario y, a continuación, llama a `MCP.<server>.<tool>()` con un argumento de objeto.
`MCP.<server>.$api()` sigue disponible como alternativa integrada para una
respuesta del esquema de una sola herramienta dentro del programa.

El entorno de ejecución invitado nunca ve directamente los objetos del host. Las entradas y salidas atraviesan
el puente como valores compatibles con JSON con límites de tamaño explícitos.

## Espacios de nombres internos

Los espacios de nombres internos proporcionan al modo de código una API de dominio concisa sin añadir más
herramientas visibles para el modelo. Una integración propiedad del cargador registra un espacio de nombres como
`Issues` o `Calendar`; el código invitado llama entonces a ese espacio de nombres dentro del
programa QuickJS mientras el modelo sigue viendo la superficie compacta de control/directa.

Por ahora, los espacios de nombres son internos. No existe una API pública de espacios de nombres del SDK de plugins:
los espacios de nombres de plugins externos necesitan un contrato propiedad del cargador para que la identidad del plugin,
los manifiestos instalados, el estado de autenticación y los descriptores de catálogo almacenados en caché no se desvíen
de las herramientas del plugin que respaldan el espacio de nombres. El modo de código del núcleo solo es responsable del
entorno aislado, la serialización, el control de acceso al catálogo y el despacho del puente.

El código invitado puede usar tanto el global directo como el mapa `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Ciclo de vida del registro

El registro de espacios de nombres es local al proceso y utiliza como clave el identificador del espacio de nombres:

1. Un cargador de confianza llama a `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. El modo de código crea el `ToolSearchRuntime` oculto para la ejecución y lee su
   catálogo limitado a la ejecución.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` conserva únicamente los registros
   cuyos `requiredToolNames` sean todos visibles y pertenezcan al mismo `pluginId`.
4. Cada espacio de nombres visible llama a `createScope(ctx)` para la ejecución actual,
   y recibe contexto de ejecución como `agentId`, `sessionKey`, `sessionId`,
   `runId`, la configuración y el estado de cancelación.
5. Los datos del ámbito se serializan en un descriptor simple y se inyectan en QuickJS
   como variables globales directas y `namespaces.<globalName>`.
6. Las llamadas del invitado se suspenden a través del puente del proceso de trabajo, resuelven la ruta del espacio de nombres
   en el host, asignan la llamada a una herramienta de catálogo declarada que pertenece al plugin y
   ejecutan esa herramienta mediante `ToolSearchRuntime.callExactId`.
7. Las llamadas preparadas del puente del espacio de nombres se vacían automáticamente dentro de la llamada activa
   `exec`/`wait`; si el trabajo del espacio de nombres sigue pendiente cuando se agota el tiempo de espera o
   el invitado cede explícitamente, `wait` reanuda más tarde el mismo entorno de ejecución
   del espacio de nombres.
8. La reversión o desinstalación de un plugin llama a
   `clearCodeModeNamespacesForPlugin(pluginId)` para que las variables globales obsoletas no
   sobrevivan a una carga fallida del plugin.

Las llamadas a espacios de nombres son llamadas a herramientas del catálogo: utilizan los mismos hooks de políticas,
aprobaciones, gestión de cancelaciones, telemetría, proyección de transcripciones y
comportamiento de suspensión/reanudación que `tools.call(...)`.

### Forma del registro

Registre los espacios de nombres desde la integración propietaria de las herramientas subyacentes. Mantenga
un ámbito reducido y exponga únicamente verbos de dominio que se asignen a herramientas declaradas del
catálogo.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "Ayudantes para incidencias de GitHub del repositorio actual.",
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

`createCodeModeNamespaceTool(toolName, inputMapper)` marca un miembro del ámbito como una
función invocable del espacio de nombres. El `inputMapper` opcional recibe los argumentos
del invitado y devuelve el objeto de entrada para la herramienta de catálogo subyacente; si no se proporciona,
se utiliza el primer argumento del invitado, o `{}` si se omite.

Las funciones sin procesar del host se rechazan antes de ejecutar el código invitado:

```typescript
createScope: () => ({
  // Incorrecto: esto evita el ciclo de vida de la herramienta de catálogo y será rechazado.
  list: async () => githubClient.listIssues(),
});
```

### Propiedad y visibilidad

La propiedad del espacio de nombres está vinculada al `pluginId` del autor de la llamada de registro.
`requiredToolNames` actúa tanto como control de visibilidad como comprobación de propiedad:

- todas las herramientas requeridas deben existir en el catálogo de la ejecución
- todas las herramientas requeridas deben tener `sourceName === pluginId`
- el espacio de nombres se oculta cuando falta alguna herramienta requerida o esta pertenece a
  otro plugin
- cada ruta invocable solo puede dirigirse a una herramienta nombrada en `requiredToolNames`

Esto impide que otro plugin exponga un espacio de nombres registrando una herramienta
con el mismo nombre y mantiene los espacios de nombres alineados con la política normal del agente: si
la ejecución no puede ver las herramientas subyacentes, tampoco puede ver el espacio de nombres.

Por ejemplo, un espacio de nombres de GitHub debe estar detrás de un plugin propiedad de GitHub que
sea responsable de la autenticación de GitHub, los clientes REST/GraphQL, los límites de velocidad, las aprobaciones
de escritura y las pruebas. El modo de código del núcleo no debe integrar API específicas de GitHub, la gestión de tokens
ni la política del proveedor.

### Reglas de serialización del ámbito

`createScope(ctx)` puede devolver un objeto simple que contenga valores compatibles
con JSON, matrices, objetos anidados y marcadores de llamada `createCodeModeNamespaceTool(...)`.
Los objetos del host nunca entran directamente en QuickJS.

El serializador rechaza:

- funciones sin procesar
- grafos de objetos circulares
- segmentos de ruta no seguros: `__proto__`, `constructor`, `prototype`, claves vacías
  o claves que contengan el separador interno de rutas
- valores `globalName` que no sean identificadores de JavaScript
- colisiones de `globalName` con variables globales integradas del modo de código como `tools`,
  `namespaces`, `text`, `json`, `yield_control`, `MCP`, `API`, `ALL_TOOLS` o
  `__openclaw*`

Los valores que no se pueden serializar como JSON se convierten en valores alternativos
compatibles con JSON antes de atravesar el puente. Los datos binarios, identificadores, sockets, clientes e
instancias de clases deben permanecer detrás de herramientas normales del catálogo.

### Prompts

El `description` del espacio de nombres y el `prompt` opcional se añaden al esquema
`exec` visible para el modelo únicamente cuando el espacio de nombres es visible para esa ejecución. Úselos
para enseñar la superficie útil más pequeña:

```typescript
{
  description: "Ayudantes del servicio de producción de ficción.",
  prompt:
    "Usa Fictions.riskAudit(), Fictions.promoteIfReady(id, status) y Fictions.unpaidOver(amount).",
}
```

Mantén los prompts centrados en el contrato del espacio de nombres, no en la configuración de autenticación, el historial de implementación ni el comportamiento no relacionado de plugins.

### Limpieza

Los espacios de nombres son registros locales del proceso. Elimínalos cuando el plugin propietario se deshabilite, desinstale o revierta:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

La limpieza del modo código es responsabilidad del plugin; borra los registros de espacios de nombres del plugin cuando finalice su ciclo de vida, en lugar de conservar manejadores de desmontaje para cada espacio de nombres. Las pruebas pueden llamar a `clearCodeModeNamespacesForTest()` para evitar que los registros se filtren entre casos.

### Lista de comprobación de pruebas

Los cambios en los espacios de nombres deben abarcar el límite de seguridad y el comportamiento del entorno invitado:

- el texto del prompt del espacio de nombres aparece solo cuando las herramientas subyacentes son visibles
- las herramientas con el mismo nombre de otro `sourceName` no exponen el espacio de nombres
- se rechazan las funciones de ámbito sin procesar
- se rechazan los identificadores de espacios de nombres y las rutas falsificados
- las rutas invocables no pueden apuntar a herramientas no declaradas
- los objetos anidados y las referencias compartidas se serializan correctamente
- las llamadas al espacio de nombres se ejecutan mediante las herramientas del catálogo y devuelven detalles compatibles con JSON
- el código invitado puede capturar los fallos
- las llamadas suspendidas al espacio de nombres se reanudan mediante `wait`
- la reversión del plugin borra los registros de espacios de nombres que le pertenecen

Los espacios de nombres complementan el catálogo genérico `tools.search`/`tools.call`: usa el catálogo para cualquier herramienta habilitada de OpenClaw, plugins y clientes; usa `MCP` para las herramientas MCP; usa otros espacios de nombres para las API de dominio documentadas y pertenecientes a plugins cuando el código conciso sea más fiable que las consultas repetidas de esquemas.

## API de salida

- `text(value)` añade una salida legible para personas al array `output`.
- `json(value)` añade un elemento de salida estructurado tras una serialización compatible con JSON.
- El valor final devuelto por el código invitado se convierte en `value` en un resultado `completed`.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Reglas: el orden de salida coincide con el de las llamadas del entorno invitado; la salida está limitada por `maxOutputBytes`; los valores no serializables se convierten en cadenas simples o errores; no se admiten valores binarios. Las imágenes y los archivos se transfieren mediante herramientas ordinarias de OpenClaw, no mediante el puente del modo código.

## Catálogo de herramientas

El catálogo oculto incluye las herramientas después de aplicar el filtrado efectivo de políticas, en este orden: herramientas del núcleo de OpenClaw, herramientas de plugins incluidos, herramientas de plugins externos, herramientas MCP y, por último, herramientas proporcionadas por el cliente para la ejecución actual.

Los identificadores del catálogo son estables dentro de una ejecución y, cuando es posible, deterministas entre conjuntos de herramientas equivalentes. Formato real:

```text
<source>:<owner>:<tool-name>
```

donde `<source>` es `openclaw`, `mcp` o `client` (las herramientas de plugins usan `openclaw` con el identificador del plugin como `<owner>`; las herramientas del núcleo usan `openclaw:core:*`). Ejemplos:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

El catálogo omite las herramientas de control del modo código (`exec`, `wait`, `tool_search_code`, `tool_search`, `tool_describe`, `tool_call`) y las herramientas solo directas. Los controles no deben invocarse recursivamente mediante el catálogo; las herramientas solo directas permanecen visibles para el modelo porque sus resultados estructurados no pueden atravesar el puente de QuickJS.

Las entradas MCP permanecen en el catálogo limitado a la ejecución para que las políticas, aprobaciones, hooks, telemetría, proyección de la transcripción e identificadores exactos de herramientas sigan siendo compartidos con la ejecución normal de herramientas. Las vistas `ALL_TOOLS`, `tools.search(...)`, `tools.describe(...)`, `tools.callValue(...)` y `tools.call(...)` expuestas al entorno invitado omiten las entradas MCP. El espacio de nombres `MCP.<server>.<tool>({ ...input })` generado se resuelve de nuevo al identificador exacto del catálogo y se despacha mediante la misma ruta del ejecutor.

## Interacción con Tool Search

El modo código sustituye la superficie de modelo Tool Search de OpenClaw en las ejecuciones donde está activo.

Cuando `tools.codeMode.enabled` es true y se activa el modo código:

- OpenClaw no expone `tool_search_code`, `tool_search`, `tool_describe` ni `tool_call` como herramientas visibles para el modelo.
- La misma idea de catalogación se traslada al entorno de ejecución invitado.
- El entorno de ejecución invitado recibe metadatos compactos `ALL_TOOLS` y ayudantes de búsqueda/descripción/llamada para herramientas que no son MCP.
- Las llamadas MCP usan el espacio de nombres `MCP` generado y sus encabezados `$api()` en lugar de `tools.call(...)`.
- Las llamadas anidadas se despachan mediante la misma ruta del ejecutor de OpenClaw que usa Tool Search.

Consulta [Tool Search](/es/tools/tool-search) para obtener información sobre el puente de catálogo compacto de OpenClaw que el modo código sustituye en las ejecuciones activas.

## Nombres de herramientas y colisiones

La herramienta `exec` visible para el modelo es la herramienta del modo código. Si la herramienta de shell normal `exec` de OpenClaw está habilitada, se oculta al modelo y se cataloga como cualquier otra herramienta.

Dentro del entorno de ejecución invitado:

- `tools.call("openclaw:core:exec", input)` puede llamar a la herramienta de ejecución del shell si la política lo permite.
- `tools.exec(...)` se instala solo si la entrada del catálogo para la ejecución del shell tiene un nombre seguro e inequívoco.
- la herramienta `exec` del modo código nunca está disponible de forma recursiva mediante `tools`.

Si dos herramientas se normalizan al mismo nombre práctico seguro, OpenClaw omite la función práctica y exige `tools.call(id, input)`.

## Ejecución de herramientas anidadas

Cada llamada a una herramienta anidada atraviesa el puente del host y vuelve a entrar en OpenClaw, conservando: el identificador del agente activo, el identificador y la clave de sesión, el contexto del remitente y del canal, la política del sandbox, la política de aprobación, los hooks `before_tool_call` de plugins, la señal de cancelación, las actualizaciones de streaming cuando estén disponibles y los eventos de trayectoria/auditoría.

Las llamadas anidadas se proyectan en la transcripción como llamadas reales a herramientas para que los paquetes de soporte muestren lo ocurrido, y la proyección identifica la llamada a la herramienta del modo código principal y el identificador de la herramienta anidada.

Se permiten llamadas anidadas en paralelo hasta `maxPendingToolCalls`.

## Ciclo de vida de ejecuciones y snapshots

Cada ejecución del modo código se registra en un mapa dentro del proceso cuya clave es `runId` (no se persiste en disco ni en una base de datos). `exec`/`wait` devuelve uno de tres estados de resultado: `completed`, `waiting` o `failed`.

- Un resultado `waiting` almacena el snapshot de QuickJS, las solicitudes pendientes del puente y los metadatos de ámbito (identificador de ejecución del agente, identificador/clave de sesión) hasta que `wait` lo reanuda o caduca.
- Los valores `runId` caducados, de una sesión incorrecta, de una ejecución incorrecta y desconocidos/ya en reanudación no producen un estado terminal distinto; se presentan como un resultado `failed` (`code: "invalid_input"`) con un mensaje como `code mode
run is unavailable or expired.` o `code mode run belongs to a different
session.`.
- El snapshot de una ejecución se elimina del mapa en cuanto se resuelve como `completed` o `failed`, o se descarta al apagarse el Gateway (nada sobrevive a un reinicio: se trata de un estado transitorio del entorno de ejecución).
- Para trabajos de solo lectura, `exec` puede establecer `restartSafe: true`. A continuación, OpenClaw rechaza antes de la ejecución las llamadas al catálogo y los espacios de nombres de plugins que tengan efectos secundarios, y marca los resultados suspendidos como seguros para su reproducción. Si un reinicio interrumpe `wait`, la [recuperación tras un reinicio](/es/gateway/restart-recovery) reconstruye el turno a partir de la transcripción en lugar de restaurar el snapshot local del proceso. El propio turno de recuperación sigue limitado a herramientas del núcleo auditadas de solo lectura y a herramientas de plugins explícitamente seguras para su reproducción.
- OpenClaw limita el número de ejecuciones suspendidas simultáneamente por proceso (64) y rechaza las nuevas suspensiones que superen ese límite con `too many suspended code mode
runs.`.

El almacenamiento de snapshots está limitado por `maxSnapshotBytes` por ejecución, el límite de ejecuciones suspendidas por proceso indicado anteriormente y `snapshotTtlSeconds`.

## Entorno de ejecución QuickJS-WASI

OpenClaw carga `quickjs-wasi` como dependencia directa en el paquete propietario; no depende de una copia transitiva instalada para una dependencia no relacionada.

Responsabilidades del entorno de ejecución: compilar/cargar el módulo WebAssembly de QuickJS-WASI; crear una máquina virtual aislada por cada ejecución o reanudación del modo código; registrar callbacks del host con nombres estables; establecer límites de memoria e interrupción; evaluar JavaScript; vaciar los trabajos pendientes; crear snapshots del estado suspendido de la máquina virtual; restaurar snapshots para `wait`; liberar los manejadores de la máquina virtual y los snapshots tras los estados terminales.

El entorno de ejecución se ejecuta en un hilo de trabajo de Node.js, fuera del bucle de eventos principal de OpenClaw. Un bucle infinito del entorno invitado no debe bloquear indefinidamente el proceso del Gateway; el manejador de interrupciones del hilo de trabajo aplica el tiempo de espera de reloj independientemente de que el código invitado coopere.

## TypeScript

La compatibilidad con TypeScript es solo una transformación del código fuente: la entrada aceptada es una única cadena de código TypeScript; la salida es una cadena JavaScript evaluada por QuickJS-WASI. No hay comprobación de tipos, resolución de módulos ni `import`/`require`. Los diagnósticos se devuelven como resultados `failed`.

El compilador de TypeScript se carga de forma diferida solo para las celdas de TypeScript; las celdas de JavaScript sin formato y el modo código deshabilitado nunca lo cargan.

## Límite de seguridad

El código del modelo es hostil. El entorno de ejecución aplica defensa en profundidad:

- ejecuta QuickJS-WASI fuera del bucle de eventos principal, en un hilo de trabajo
- carga `quickjs-wasi` como dependencia directa, no mediante Codex ni un paquete transitivo
- no hay sistema de archivos, red, subprocesos, importación de módulos, variables de entorno ni objetos globales del host en el entorno invitado
- usa límites de memoria e interrupción de QuickJS, además de un tiempo de espera de reloj del proceso principal
- aplica límites de salida, snapshots, registros y llamadas pendientes
- serializa los valores del puente del host mediante un adaptador JSON restringido
- convierte los errores del host en errores simples del entorno invitado, nunca en objetos del dominio del host
- descarta los snapshots al agotarse el tiempo de espera, cancelarse, finalizar la sesión o caducar
- rechaza el acceso recursivo a `exec`, `wait` y las herramientas de control de Tool Search
- evita que las colisiones de nombres prácticos oculten los ayudantes del catálogo

El sandbox es una capa de seguridad; los operadores pueden seguir necesitando medidas de protección a nivel del sistema operativo para implementaciones de alto riesgo.

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

`invalid_input` abarca los argumentos `exec`/`wait` incorrectos, los lenguajes deshabilitados, el acceso rechazado a módulos, los fallos de transformación de TypeScript, los valores `runId` desconocidos/caducados/de ámbito incorrecto y el exceso de ejecuciones suspendidas. `runtime_unavailable` abarca un hilo de trabajo de QuickJS que no consigue iniciarse o que termina con un código distinto de cero.

Los errores devueltos al entorno invitado son datos simples; las instancias `Error` del host, los objetos de pila, los prototipos y las funciones del host no se transfieren a QuickJS.

## Telemetría

El campo `telemetry` de cada resultado informa de: el tamaño del catálogo oculto y un desglose por origen (recuentos `openclaw`/`mcp`/`client`), los recuentos acumulados de búsquedas/descripciones/llamadas para el catálogo de la ejecución y los nombres de herramientas visibles para el modelo (`exec`, `wait` y las herramientas solo directas conservadas).

La telemetría no debe incluir secretos, valores de entorno sin procesar ni entradas de herramientas sin censurar más allá de la política de trayectoria existente de OpenClaw.

## Depuración

Usa registros específicos del transporte del modelo cuando el modo código se comporte de forma diferente a una ejecución normal de herramientas:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Para depurar la estructura de la carga útil, use `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Esto registra una instantánea JSON limitada y censurada de la solicitud al modelo; úselo solo
durante la depuración, ya que los prompts y el texto de los mensajes aún pueden aparecer.

Para depurar el flujo, use `OPENCLAW_DEBUG_SSE=peek` a fin de registrar los primeros cinco
eventos SSE censurados. El modo de código también falla de forma segura si la carga útil final
del proveedor no contiene exactamente un `exec`, un `wait` y solo herramientas
directas aprobadas después de que se haya activado la superficie del modo de código.

## Estructura de la implementación

- contrato de configuración: `tools.codeMode`
- generador del catálogo: herramientas efectivas convertidas en entradas compactas y mapa de identificadores
- adaptador de la superficie del modelo: sustituye las herramientas visibles por herramientas de control/directas
- adaptador del entorno de ejecución QuickJS-WASI: carga, evaluación, instantánea, restauración y eliminación
- supervisor de procesos de trabajo: tiempo de espera, interrupción y aislamiento de fallos
- adaptador del puente: devoluciones de llamada del host compatibles con JSON y entrega de resultados
- adaptador de transformación de TypeScript
- almacén de instantáneas: TTL, límites de tamaño y ámbito de ejecución/sesión
- proyección de trayectoria para llamadas a herramientas anidadas
- contadores de telemetría y diagnósticos

La implementación reutiliza conceptos de catálogo y ejecutor de la búsqueda de herramientas, pero
no utiliza un elemento secundario `node:vm` como entorno aislado.

## Lista de comprobación de validación

La cobertura del modo de código debe demostrar lo siguiente:

- la configuración desactivada no modifica la exposición existente de herramientas
- la configuración de objeto sin `enabled: true` mantiene desactivado el modo de código
- la configuración activada expone `exec`, `wait` y solo las herramientas directas necesarias
  al modelo cuando las herramientas están activas para la ejecución
- las ejecuciones sin herramientas en bruto, `disableTools` y las listas de permitidos vacías no activan
  la aplicación de requisitos a la carga útil del modo de código
- todas las herramientas efectivas que no son de MCP y son aptas para el catálogo aparecen en `ALL_TOOLS`
- las herramientas directas permanecen visibles para el modelo y no aparecen en `ALL_TOOLS`
- las herramientas denegadas no aparecen en `ALL_TOOLS`
- `tools.search`, `tools.describe`, `tools.callValue` y `tools.call` funcionan con las herramientas de OpenClaw
- `API.list("mcp")` y `API.read("mcp/<server>.d.ts")` exponen declaraciones de MCP con estilo de TypeScript
  sin una llamada al puente o a una herramienta
- el espacio de nombres `$api()` de MCP permanece disponible como alternativa en línea para los esquemas
- las llamadas al espacio de nombres de MCP funcionan para las herramientas de MCP visibles con una entrada de objeto, mientras
  que las entradas directas del catálogo de MCP no aparecen en `tools.*`
- las herramientas de control de la búsqueda de herramientas permanecen ocultas tanto en la superficie del modelo como en el
  catálogo oculto
- las llamadas anidadas conservan el comportamiento de aprobación y de los enlaces
- el `exec` del shell está oculto para el modelo, pero se puede invocar mediante el identificador del catálogo cuando
  está permitido
- los elementos recursivos `exec` y `wait` del modo de código no pueden invocarse desde el código invitado
- la entrada de TypeScript se transforma y evalúa sin cargar TypeScript en
  las rutas desactivadas o exclusivas de JavaScript
- el acceso a `import`, `require`, el sistema de archivos, la red y el entorno falla
- los bucles infinitos agotan el tiempo de espera y no pueden bloquear el Gateway
- los fallos por límite de memoria terminan la máquina virtual invitada
- los límites de salida y de instantáneas se aplican a las llamadas completadas y suspendidas
- `wait` reanuda una instantánea suspendida y devuelve el valor final
- los valores `runId` caducados, interrumpidos, de una sesión incorrecta y desconocidos fallan
- la reproducción y la persistencia de la transcripción conservan las llamadas de control del modo de código
- la transcripción y la telemetría muestran claramente las llamadas a herramientas anidadas

## Plan de pruebas E2E

Ejecute estas pruebas como pruebas de integración o de extremo a extremo cuando modifique el entorno de ejecución:

1. Inicie un Gateway con `tools.codeMode.enabled: false`.
2. Envíe un turno del agente con un conjunto pequeño de herramientas directas.
3. Compruebe que las herramientas visibles para el modelo no hayan cambiado.
4. Reinicie con `tools.codeMode.enabled: true`.
5. Envíe un turno del agente con herramientas de prueba de OpenClaw, plugins, MCP y cliente.
6. Compruebe que la lista de herramientas visibles para el modelo sea `exec`, `wait` y solo las herramientas
   directas configuradas.
7. En `exec`, lea `ALL_TOOLS` y compruebe que las herramientas de prueba efectivas aptas para el catálogo
   estén presentes y que las herramientas directas estén ausentes.
8. En `exec`, invoque las herramientas de OpenClaw, plugins y cliente mediante `tools.search`,
   `tools.describe` y `tools.callValue` (o mediante `tools.call` en bruto).
9. En `exec`, invoque `API.list("mcp")` y `API.read("mcp/<server>.d.ts")` y
   compruebe que los archivos de declaración describan las herramientas de MCP visibles.
10. En `exec`, invoque las herramientas de MCP mediante `MCP.<server>.<tool>({ ...input })` y
    compruebe que las entradas directas del catálogo de MCP estén ausentes de `ALL_TOOLS` y
    `tools.*`.
11. Compruebe que las herramientas denegadas estén ausentes y no puedan invocarse mediante un identificador supuesto.
12. Inicie una llamada a una herramienta anidada que se resuelva después de que `exec` devuelva `waiting`.
13. Invoque `wait` y compruebe que la máquina virtual restaurada reciba el resultado de la herramienta.
14. Compruebe que la respuesta final contenga la salida generada después de la restauración.
15. Compruebe que el tiempo de espera, la interrupción y la caducidad de la instantánea limpien el estado del entorno de ejecución.
16. Exporte la trayectoria y compruebe que las llamadas anidadas sean visibles bajo la llamada
    principal del modo de código.

Los cambios exclusivamente de documentación en esta página deben seguir ejecutando `pnpm check:docs`.

## Temas relacionados

- [Búsqueda de herramientas](/es/tools/tool-search)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Herramienta Exec](/es/tools/exec)
- [Ejecución de código](/es/tools/code-execution)
