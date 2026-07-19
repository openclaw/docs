---
read_when:
    - Quieres que los agentes de OpenClaw usen un amplio catálogo de herramientas sin añadir al prompt el esquema de cada herramienta
    - Se desea exponer las herramientas de OpenClaw, las herramientas de MCP y las herramientas de cliente mediante una única superficie de ejecución compacta
    - Está implementando o depurando la detección de herramientas para las ejecuciones de OpenClaw
summary: 'Búsqueda de herramientas: compacta grandes catálogos de herramientas de OpenClaw mediante búsqueda, descripción y llamada'
title: Búsqueda de herramientas
x-i18n:
    generated_at: "2026-07-19T02:17:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d31322d5ef108c52fd14d48771cc3c6c43fcfbc4bfb95652bc29a55fd706c903
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search es una función experimental del entorno de ejecución de agentes de OpenClaw. Proporciona a los agentes una
forma compacta de descubrir y llamar a catálogos de herramientas grandes. Resulta útil cuando la ejecución
tiene muchas herramientas disponibles, pero es probable que el modelo solo necesite unas pocas.

Esta página documenta Tool Search de OpenClaw. No se trata de la búsqueda de herramientas
ni de la superficie de herramientas dinámicas nativas de Codex. El modo de código, la búsqueda de herramientas, las herramientas
dinámicas diferidas y las llamadas a herramientas anidadas nativos de Codex son superficies estables del arnés de Codex y
no dependen de `tools.toolSearch`.

Para consultar el entorno de ejecución genérico de OpenClaw que expone una superficie QuickJS-WASI `exec`/`wait`
en lugar de controles de Tool Search, véase [Modo de código](/tools/code-mode).

Cuando se habilita para ejecuciones de OpenClaw, el modelo recibe de forma predeterminada una herramienta
`tool_search_code`, además de cualquier herramienta exclusivamente directa cuyos resultados estructurados no puedan atravesar
el puente compacto. La herramienta de código ejecuta un cuerpo breve de JavaScript en un subproceso aislado de
Node con un puente `openclaw.tools`:

```js
const hits = await openclaw.tools.search("crear un issue de GitHub");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Fallo al iniciar",
  body: "Pasos para reproducir...",
});
```

El catálogo puede incluir herramientas de OpenClaw aptas para el catálogo, herramientas de plugins, herramientas de MCP
y herramientas proporcionadas por el cliente. El modelo no ve por adelantado todos los esquemas catalogados.
En su lugar, busca descriptores compactos, describe una herramienta seleccionada
cuando necesita el esquema exacto y llama a esa herramienta mediante OpenClaw.
Las herramientas exclusivamente directas permanecen visibles para el modelo y no se añaden al catálogo.

Las ejecuciones del arnés de Codex no reciben estos controles experimentales de Tool Search de OpenClaw.
OpenClaw transmite las capacidades del producto a Codex como herramientas dinámicas, y
Codex posee el modo de código nativo estable, la búsqueda de herramientas nativa, las herramientas dinámicas
diferidas y las llamadas a herramientas anidadas.

## Cómo se ejecuta un turno

Durante la planificación, el ejecutor integrado de OpenClaw crea el catálogo efectivo para la
ejecución:

1. Resolver la política de herramientas activa para el agente, el perfil, el entorno aislado y la sesión.
2. Enumerar las herramientas aptas de OpenClaw y de plugins.
3. Enumerar las herramientas de MCP aptas mediante el entorno de ejecución de MCP de la sesión.
4. Añadir las herramientas de cliente aptas proporcionadas para la ejecución actual.
5. Mantener las herramientas exclusivamente directas visibles para el modelo e indexar descriptores compactos para las
   herramientas restantes aptas para el catálogo.
6. Exponer el puente de código de OpenClaw, las herramientas estructuradas de respaldo o la
   superficie de directorio compacta junto con esas herramientas exclusivamente directas.

Durante la ejecución, cada llamada real a una herramienta regresa a OpenClaw. El entorno de ejecución aislado de Node
no contiene implementaciones de plugins, objetos de cliente de MCP ni secretos.
`openclaw.tools.call(...)` atraviesa el puente de vuelta al Gateway, donde
siguen aplicándose la política, la aprobación, los hooks, el registro y el tratamiento de resultados
habituales.

## Modos

`tools.toolSearch` tiene tres modos orientados al modelo:

- `code`: expone `tool_search_code`, el puente compacto de JavaScript predeterminado,
  junto con las herramientas exclusivamente directas.
- `tools`: expone `tool_search`, `tool_describe` y `tool_call` como herramientas
  estructuradas simples para los proveedores que no deban recibir código, junto con
  las herramientas exclusivamente directas.
- `directory`: expone `tool_search`, `tool_describe` y `tool_call`, además de un
  directorio acotado en el prompt con los nombres y las descripciones de las herramientas disponibles para
  los proveedores que deban ver los nombres de las herramientas sin todos sus esquemas completos. OpenClaw también puede
  exponer directamente un pequeño conjunto acotado de esquemas de herramientas probables o necesarios
  para el turno actual. Las herramientas exclusivamente directas también permanecen visibles en este modo.

Todos los modos utilizan el mismo catálogo filtrado por políticas y la ruta de ejecución
normal de OpenClaw. Las herramientas marcadas como `catalogMode: "direct-only"` permanecen fuera de ese catálogo y
siguen visibles para el modelo. Si el entorno de ejecución actual no puede iniciar el proceso secundario aislado
de Node del modo de código, el modo predeterminado `code` recurre a `tools` antes de compactar
el catálogo. En el modo `directory`, las herramientas proporcionadas por el cliente permanecen directamente visibles
para la ejecución actual, mientras que las herramientas de OpenClaw, de plugins y de MCP pueden
compactarse tras el catálogo del directorio. Una llamada directa a un nombre exacto oculto
del directorio se hidrata desde ese mismo catálogo autorizado antes de ejecutarse.

Todos los modos son experimentales. Se recomienda la exposición directa de herramientas para catálogos pequeños de herramientas de
OpenClaw y las superficies estables nativas de Codex para las ejecuciones del arnés de Codex.

No existe una configuración independiente de selección de fuentes. Cuando Tool Search está habilitado, el
catálogo incluye las herramientas de OpenClaw, MCP y cliente aptas para el catálogo después del filtrado
normal de políticas; las herramientas exclusivamente directas se conservan por separado.

## Motivo de su existencia

Los catálogos grandes son útiles, pero costosos. Enviar todos los esquemas de herramientas al modelo
aumenta el tamaño de la solicitud, ralentiza la planificación e incrementa la selección accidental de
herramientas.

Tool Search cambia la estructura:

- herramientas directas: el modelo ve todos los esquemas seleccionados antes del primer token
- modo de código de Tool Search: el modelo ve una herramienta de código compacta, un contrato breve de la API
  y cualquier herramienta exclusivamente directa
- modo de herramientas de Tool Search: el modelo ve tres herramientas estructuradas compactas de respaldo,
  además de cualquier herramienta exclusivamente directa
- modo de directorio de Tool Search: el modelo ve un directorio acotado, además de
  controles de búsqueda/descripción/llamada y un pequeño conjunto acotado de esquemas probables o necesarios,
  además de cualquier herramienta exclusivamente directa
- durante el turno: el modelo puede cargar los esquemas restantes según sea necesario

La exposición directa de herramientas sigue siendo la opción predeterminada adecuada para catálogos pequeños. Tool Search
resulta más útil cuando una ejecución puede ver muchas herramientas, especialmente de servidores de MCP o
herramientas de aplicaciones proporcionadas por el cliente.

## API

`openclaw.tools.search(query, options?)`

Busca en el catálogo efectivo de la ejecución actual. Los resultados son compactos y seguros
para volver a incluirlos en el contexto del prompt. Cada coincidencia incluye una firma acotada
`input` con estilo de TypeScript, como `{ id: string; mode?: "drip" | "flood" }`, para que el
modelo pueda omitir `describe` cuando esa firma sea suficiente. Una herramienta de confianza
del núcleo de OpenClaw o de un plugin también puede incluir una indicación compacta `output`, como
`Array<{ id: string; paid: boolean }>`. Las declaraciones de esquema de salida de MCP y del cliente
no se promueven a esta indicación de confianza. Sus esquemas de entrada no confiables también se
difieren como `input: "unknown"`; utilice `describe` antes de llamarlos. Los esquemas de salida
abiertos, sobredimensionados o parciales por otros motivos omiten la indicación y permanecen
disponibles mediante `describe`.

```js
const hits = await openclaw.tools.search("evento de calendario", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carga los metadatos completos de un resultado de búsqueda, incluidos el esquema exacto de entrada y
el `outputSchema` completo de confianza cuando la herramienta declara uno.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Llama a una herramienta seleccionada mediante OpenClaw y devuelve el sobre `{ tool, result }`
sin procesar. Las herramientas que devuelven JSON normalmente colocan su valor en
`result.details`. Si una herramienta de confianza declara `outputSchema`, OpenClaw compila
el esquema antes de la ejecución y valida el `details` final después de los hooks normales de la herramienta
antes de devolver la llamada del catálogo.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planificación",
  start: "2026-05-09T14:00:00Z",
});
```

Los autores de herramientas declaran los contratos de salida en la propiedad `outputSchema` de la herramienta.
Esta describe `AgentToolResult.details`, no bloques de contenido renderizados. Incluya
todas las variantes que no generen excepciones u omítala si los resultados son inestables. Véanse
[Contratos de salida del modo de código](/tools/code-mode#declared-output-contracts) y
[Plugins de herramientas](/es/plugins/tool-plugins#output-contracts).

El modo estructurado de respaldo expone las mismas operaciones como herramientas:

- `tool_search`
- `tool_describe`
- `tool_call`

El modo de directorio expone:

- `tool_search`
- `tool_describe`
- `tool_call`

También mantiene directamente visibles las herramientas proporcionadas por el cliente y todas las herramientas exclusivamente directas,
y puede exponer directamente un pequeño conjunto acotado de esquemas de herramientas del catálogo probables o necesarios
para el turno actual. Si el directorio acotado omite entradas, utilice
`tool_search` para encontrarlas. Si el modelo solicita directamente el nombre exacto de una herramienta oculta del directorio,
OpenClaw la hidrata desde el catálogo autorizado antes de la
ejecución normal.
Los nombres de herramientas del cliente en el modo de directorio no deben entrar en conflicto con los nombres de herramientas de OpenClaw, de plugins o de MCP,
porque el despacho diferido exacto utiliza esos nombres.

## Límite del entorno de ejecución

El puente de código se ejecuta en un subproceso de Node de corta duración. El subproceso se inicia
con el modo de permisos de Node habilitado, un entorno vacío, sin permisos de acceso al sistema de archivos ni a
la red, y sin permisos para procesos secundarios ni workers. OpenClaw aplica un
tiempo de espera de reloj de pared en el proceso principal y finaliza el subproceso cuando se agota, incluso
después de continuaciones asíncronas.

El entorno de ejecución solo expone:

- `console.log`, `console.warn` y `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

El comportamiento normal de OpenClaw sigue aplicándose a las llamadas finales:

- políticas de autorización y denegación de herramientas
- restricciones de herramientas por agente y por entorno aislado
- política de herramientas del canal/entorno de ejecución
- hooks de aprobación
- hooks `before_tool_call` de plugins
- identidad de sesión, registros y telemetría

## Configuración

Habilite Tool Search para las ejecuciones de OpenClaw con el puente de código predeterminado:

```bash
openclaw config set tools.toolSearch true
```

JSON equivalente:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Utilice en su lugar las herramientas estructuradas de respaldo para las ejecuciones de OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Utilice en su lugar la superficie de directorio compacta para las ejecuciones de OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Ajuste el tiempo de espera del modo de código y los límites de resultados de búsqueda (los valores mostrados son los predeterminados):

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

El entorno de ejecución limita `codeTimeoutMs` a 1000-60000, `maxSearchLimit` a 1-50 y
`searchDefaultLimit` a 1..`maxSearchLimit`.

Para deshabilitarlo:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt y telemetría

Tool Search registra suficiente telemetría para compararlo con la exposición directa de herramientas:

- total de bytes serializados de herramientas y del prompt enviados al arnés
- tamaño del catálogo y desglose por fuentes
- recuentos de búsquedas, descripciones y llamadas
- llamadas finales a herramientas ejecutadas mediante OpenClaw
- identificadores y fuentes de las herramientas seleccionadas

Los registros de sesión deben permitir responder:

- cuántos esquemas de herramientas vio el modelo por adelantado
- cuántas operaciones de búsqueda y descripción realizó
- qué herramienta final se llamó
- si el resultado procedía de OpenClaw, MCP o de una herramienta del cliente

## Validación E2E

El escenario de Gateway de QA Lab demuestra ambas rutas con el entorno de ejecución de OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Crea un plugin falso temporal con un catálogo de herramientas grande, inicia el proveedor
simulado de OpenAI, inicia una vez un Gateway en modo directo y otra con Tool Search
habilitado, y después compara las cargas útiles de las solicitudes al proveedor y los registros de sesión.

La regresión demuestra:

1. El modo directo puede llamar a la herramienta del plugin ficticio.
2. Tool Search puede llamar a la misma herramienta del plugin ficticio.
3. El modo directo expone los esquemas de las herramientas del plugin ficticio directamente al proveedor.
4. Tool Search expone únicamente el puente compacto y cualquier herramienta exclusiva del modo directo.
5. La carga útil de la solicitud de Tool Search es más pequeña para el catálogo ficticio de gran tamaño.
6. Los registros de sesión muestran los recuentos esperados de llamadas a herramientas y la telemetría de llamadas a través del puente.

## Comportamiento ante fallos

Tool Search debe impedir la ejecución en caso de fallo:

- si una herramienta no está en la política efectiva, la búsqueda no debe devolverla
- si una herramienta seleccionada deja de estar disponible, `tool_call` debe fallar
- si la política o la aprobación bloquean la ejecución, el resultado de la llamada debe informar de ese
  bloqueo en lugar de eludirlo
- si el puente de código no puede crear un entorno de ejecución aislado, se debe usar `mode: "tools"` o
  desactivar Tool Search para ese despliegue

## Contenido relacionado

- [Herramientas y plugins](/es/tools)
- [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools)
- [Herramienta Exec](/es/tools/exec)
- [Configuración de agentes ACP](/es/tools/acp-agents-setup)
- [Creación de plugins](/es/plugins/building-plugins)
