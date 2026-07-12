---
read_when:
    - Quiere que los agentes de OpenClaw utilicen un catálogo de herramientas amplio sin añadir al prompt el esquema de cada herramienta
    - Quieres que las herramientas de OpenClaw, las herramientas MCP y las herramientas de cliente se expongan mediante una única superficie de ejecución compacta
    - Está implementando o depurando la detección de herramientas para ejecuciones de OpenClaw
summary: 'Búsqueda de herramientas: agrupa catálogos extensos de herramientas de OpenClaw tras las operaciones de búsqueda, descripción y llamada'
title: Búsqueda de herramientas
x-i18n:
    generated_at: "2026-07-12T14:55:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search es una función experimental del entorno de ejecución de agentes de OpenClaw. Proporciona a los agentes una
forma compacta de descubrir y llamar a catálogos de herramientas grandes. Resulta útil cuando la ejecución
tiene muchas herramientas disponibles, pero es probable que el modelo solo necesite unas pocas.

Esta página documenta Tool Search de OpenClaw. No se trata de la búsqueda de herramientas
ni de la superficie de herramientas dinámicas nativas de Codex. El modo de código, la búsqueda de herramientas, las herramientas
dinámicas diferidas y las llamadas a herramientas anidadas nativos de Codex son superficies estables del entorno de Codex y
no dependen de `tools.toolSearch`.

Cuando se habilita para ejecuciones de OpenClaw, el modelo recibe de forma predeterminada una herramienta `tool_search_code`,
además de cualquier herramienta exclusivamente directa cuyos resultados estructurados no puedan atravesar
el puente compacto. La herramienta de código ejecuta un cuerpo JavaScript breve en un subproceso
Node aislado con un puente `openclaw.tools`:

```js
const hits = await openclaw.tools.search("crear una incidencia de GitHub");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Fallo al iniciar",
  body: "Pasos para reproducir...",
});
```

El catálogo puede incluir herramientas de OpenClaw aptas para el catálogo, herramientas de plugins, herramientas de MCP
y herramientas proporcionadas por el cliente. El modelo no ve por adelantado todos los esquemas catalogados.
En su lugar, busca descriptores compactos, obtiene la descripción de una herramienta seleccionada
cuando necesita el esquema exacto y llama a esa herramienta mediante OpenClaw.
Las herramientas exclusivamente directas permanecen visibles para el modelo y no se añaden al catálogo.

Las ejecuciones del entorno de Codex no reciben estos controles experimentales de Tool Search de OpenClaw.
OpenClaw transmite las capacidades del producto a Codex como herramientas dinámicas, y
Codex gestiona el modo de código nativo estable, la búsqueda de herramientas nativa, las herramientas dinámicas
diferidas y las llamadas a herramientas anidadas.

## Cómo se ejecuta un turno

Durante la planificación, el ejecutor integrado de OpenClaw crea el catálogo efectivo para la
ejecución:

1. Resuelve la política de herramientas activa para el agente, el perfil, el entorno aislado y la sesión.
2. Enumera las herramientas de OpenClaw y de plugins aptas.
3. Enumera las herramientas de MCP aptas mediante el entorno de ejecución de MCP de la sesión.
4. Añade las herramientas aptas proporcionadas por el cliente para la ejecución actual.
5. Mantiene visibles para el modelo las herramientas exclusivamente directas e indexa descriptores compactos para las
   demás herramientas aptas para el catálogo.
6. Expone el puente de código de OpenClaw, las herramientas estructuradas de reserva o la
   superficie de directorio compacta junto con esas herramientas exclusivamente directas.

Durante la ejecución, cada llamada real a una herramienta vuelve a OpenClaw. El entorno de ejecución
Node aislado no contiene implementaciones de plugins, objetos cliente de MCP ni secretos.
`openclaw.tools.call(...)` atraviesa el puente de vuelta al Gateway, donde se siguen aplicando
la política, la aprobación, los hooks, el registro y el tratamiento de resultados normales.

## Modos

`tools.toolSearch` tiene tres modos orientados al modelo:

- `code`: expone `tool_search_code`, el puente JavaScript compacto predeterminado,
  junto con las herramientas exclusivamente directas.
- `tools`: expone `tool_search`, `tool_describe` y `tool_call` como herramientas
  estructuradas simples para los proveedores que no deben recibir código, junto con
  las herramientas exclusivamente directas.
- `directory`: expone `tool_search`, `tool_describe` y `tool_call`, además de un
  directorio acotado en el prompt con los nombres y las descripciones de las herramientas disponibles para
  los proveedores que deben ver los nombres de las herramientas sin todos los esquemas completos. OpenClaw también puede
  exponer directamente un pequeño conjunto acotado de esquemas de herramientas probables o requeridas
  para el turno actual. Las herramientas exclusivamente directas también permanecen visibles en este modo.

Todos los modos utilizan el mismo catálogo filtrado por políticas y la ruta de ejecución
normal de OpenClaw. Las herramientas marcadas como `catalogMode: "direct-only"` permanecen fuera de ese catálogo y
siguen siendo visibles para el modelo. Si el entorno de ejecución actual no puede iniciar el subproceso
Node aislado del modo de código, el modo `code` predeterminado recurre a `tools` antes de la compactación
del catálogo. En el modo `directory`, las herramientas proporcionadas por el cliente permanecen visibles directamente
para la ejecución actual, mientras que las herramientas de OpenClaw, de plugins y de MCP pueden
compactarse tras el catálogo del directorio. Una llamada directa a un nombre exacto oculto del
directorio se carga desde ese mismo catálogo autorizado antes de la ejecución.

Todos los modos son experimentales. Se recomienda la exposición directa de herramientas para catálogos de herramientas
pequeños de OpenClaw y las superficies estables nativas de Codex para las ejecuciones del entorno de Codex.

No existe una configuración independiente para seleccionar las fuentes. Cuando Tool Search está habilitado, el
catálogo incluye herramientas de OpenClaw, MCP y del cliente aptas para el catálogo después del filtrado
normal de políticas; las herramientas exclusivamente directas se conservan por separado.

## Por qué existe

Los catálogos grandes son útiles, pero costosos. Enviar todos los esquemas de herramientas al modelo
aumenta el tamaño de la solicitud, ralentiza la planificación e incrementa la selección accidental de
herramientas.

Tool Search cambia la estructura:

- herramientas directas: el modelo ve todos los esquemas seleccionados antes del primer token
- modo de código de Tool Search: el modelo ve una herramienta de código compacta, un contrato de API
  breve y cualquier herramienta exclusivamente directa
- modo de herramientas de Tool Search: el modelo ve tres herramientas estructuradas compactas de reserva,
  además de cualquier herramienta exclusivamente directa
- modo de directorio de Tool Search: el modelo ve un directorio acotado, además de
  controles de búsqueda/descripción/llamada y un pequeño conjunto acotado de esquemas probables o requeridos,
  además de cualquier herramienta exclusivamente directa
- durante el turno: el modelo puede cargar los esquemas restantes según sea necesario

La exposición directa de herramientas sigue siendo la opción predeterminada adecuada para catálogos pequeños. Tool Search
es más útil cuando una ejecución puede ver muchas herramientas, especialmente de servidores MCP o
herramientas de aplicaciones proporcionadas por el cliente.

## API

`openclaw.tools.search(query, options?)`

Busca en el catálogo efectivo de la ejecución actual. Los resultados son compactos y seguros
para volver a incluirlos en el contexto del prompt.

```js
const hits = await openclaw.tools.search("evento de calendario", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carga los metadatos completos de un resultado de búsqueda, incluido el esquema de entrada exacto.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Llama a una herramienta seleccionada mediante OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planificación",
  start: "2026-05-09T14:00:00Z",
});
```

El modo estructurado de reserva expone las mismas operaciones como herramientas:

- `tool_search`
- `tool_describe`
- `tool_call`

El modo de directorio expone:

- `tool_search`
- `tool_describe`
- `tool_call`

También mantiene visibles directamente las herramientas proporcionadas por el cliente y todas las herramientas exclusivamente directas,
y puede exponer directamente un pequeño conjunto acotado de esquemas de herramientas de catálogo probables o requeridas
para el turno actual. Si el directorio acotado omite entradas, utilice
`tool_search` para encontrarlas. Si el modelo solicita directamente el nombre exacto de una herramienta oculta del directorio,
OpenClaw la carga desde el catálogo autorizado antes de
la ejecución normal.
Los nombres de las herramientas del cliente en modo de directorio no deben coincidir con nombres de herramientas de OpenClaw, plugins o MCP,
porque el despacho diferido exacto utiliza esos nombres.

## Límite del entorno de ejecución

El puente de código se ejecuta en un subproceso Node de corta duración. El subproceso se inicia
con el modo de permisos de Node habilitado, un entorno vacío, sin permisos para el sistema de archivos ni la
red, y sin permisos para procesos secundarios ni workers. OpenClaw aplica un
tiempo de espera de reloj de pared en el proceso principal y termina el subproceso al agotarse el tiempo, incluso
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

Utilice en su lugar las herramientas estructuradas de reserva para las ejecuciones de OpenClaw:

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

Deshabilítelo:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt y telemetría

Tool Search registra telemetría suficiente para compararlo con la exposición directa de herramientas:

- total de bytes serializados de herramientas y del prompt enviados al entorno
- tamaño del catálogo y desglose por fuente
- recuentos de búsquedas, descripciones y llamadas
- llamadas finales a herramientas ejecutadas mediante OpenClaw
- identificadores y fuentes de las herramientas seleccionadas

Los registros de sesión deben permitir responder:

- cuántos esquemas de herramientas vio el modelo por adelantado
- cuántas operaciones de búsqueda y descripción realizó
- a qué herramienta final se llamó
- si el resultado procedía de OpenClaw, MCP o una herramienta del cliente

## Validación E2E

El escenario del Gateway de QA Lab demuestra ambas rutas con el entorno de ejecución de OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Crea un plugin falso temporal con un catálogo de herramientas grande, inicia el proveedor simulado de
OpenAI, inicia un Gateway una vez en modo directo y otra vez con Tool Search
habilitado, y luego compara las cargas de las solicitudes al proveedor y los registros de sesión.

La prueba de regresión demuestra:

1. El modo directo puede llamar a la herramienta del plugin falso.
2. Tool Search puede llamar a la misma herramienta del plugin falso.
3. El modo directo expone los esquemas de herramientas del plugin falso directamente al proveedor.
4. Tool Search expone únicamente el puente compacto y cualquier herramienta exclusivamente directa.
5. La carga de la solicitud de Tool Search es menor para el catálogo falso grande.
6. Los registros de sesión muestran los recuentos esperados de llamadas a herramientas y la telemetría de llamadas mediante el puente.

## Comportamiento ante fallos

Tool Search debe fallar de forma segura:

- si una herramienta no está incluida en la política efectiva, la búsqueda no debe devolverla
- si una herramienta seleccionada deja de estar disponible, `tool_call` debe fallar
- si la política o la aprobación bloquean la ejecución, el resultado de la llamada debe informar de ese
  bloqueo en lugar de eludirlo
- si el puente de código no puede crear un entorno de ejecución aislado, utilice `mode: "tools"` o
  deshabilite Tool Search para esa implementación

## Contenido relacionado

- [Herramientas y plugins](/es/tools)
- [Entorno aislado multiagente y herramientas](/es/tools/multi-agent-sandbox-tools)
- [Herramienta de ejecución](/es/tools/exec)
- [Configuración de agentes ACP](/es/tools/acp-agents-setup)
- [Creación de plugins](/es/plugins/building-plugins)
