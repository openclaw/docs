---
read_when:
    - Quieres que los agentes de OpenClaw usen un amplio catálogo de herramientas sin añadir el esquema de cada herramienta al prompt
    - Quieres que las herramientas de OpenClaw, las herramientas MCP y las herramientas de cliente estén disponibles a través de una única interfaz de ejecución compacta.
    - Estás implementando o depurando la detección de herramientas para las ejecuciones de OpenClaw
summary: 'Búsqueda de herramientas: compacta los grandes catálogos de herramientas de OpenClaw tras las funciones de búsqueda, descripción y llamada'
title: Búsqueda de herramientas
x-i18n:
    generated_at: "2026-07-11T23:36:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

La Búsqueda de herramientas es una función experimental del entorno de ejecución de agentes de OpenClaw. Ofrece a los agentes una forma compacta de descubrir e invocar catálogos extensos de herramientas. Resulta útil cuando la ejecución dispone de muchas herramientas, pero es probable que el modelo solo necesite unas pocas.

Esta página documenta la Búsqueda de herramientas de OpenClaw. No se trata de la búsqueda de herramientas ni de la superficie de herramientas dinámicas nativas de Codex. El modo de código, la búsqueda de herramientas, las herramientas dinámicas diferidas y las llamadas a herramientas anidadas nativos de Codex son superficies estables del entorno de Codex y no dependen de `tools.toolSearch`.

Cuando se habilita para ejecuciones de OpenClaw, el modelo recibe de forma predeterminada una herramienta `tool_search_code`, además de cualquier herramienta exclusivamente directa cuyos resultados estructurados no puedan atravesar el puente compacto. La herramienta de código ejecuta un breve cuerpo de JavaScript en un subproceso aislado de Node con un puente `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

El catálogo puede incluir herramientas de OpenClaw aptas para el catálogo, herramientas de plugins, herramientas de MCP y herramientas proporcionadas por el cliente. El modelo no ve de antemano todos los esquemas catalogados. En su lugar, busca descriptores compactos, obtiene la descripción de una herramienta seleccionada cuando necesita el esquema exacto y la invoca mediante OpenClaw. Las herramientas exclusivamente directas permanecen visibles para el modelo y no se añaden al catálogo.

Las ejecuciones del entorno de Codex no reciben estos controles experimentales de la Búsqueda de herramientas de OpenClaw. OpenClaw transmite las capacidades del producto a Codex como herramientas dinámicas, y Codex controla el modo de código nativo estable, la búsqueda de herramientas nativa, las herramientas dinámicas diferidas y las llamadas a herramientas anidadas.

## Cómo se ejecuta un turno

Durante la planificación, el ejecutor integrado de OpenClaw construye el catálogo efectivo para la ejecución:

1. Resuelve la política de herramientas activa para el agente, el perfil, el entorno aislado y la sesión.
2. Enumera las herramientas aptas de OpenClaw y de los plugins.
3. Enumera las herramientas de MCP aptas mediante el entorno de ejecución de MCP de la sesión.
4. Añade las herramientas de cliente aptas proporcionadas para la ejecución actual.
5. Mantiene las herramientas exclusivamente directas visibles para el modelo e indexa descriptores compactos para las herramientas restantes aptas para el catálogo.
6. Expone el puente de código de OpenClaw, las herramientas estructuradas de respaldo o la superficie compacta de directorio junto con esas herramientas exclusivamente directas.

Durante la ejecución, cada llamada real a una herramienta vuelve a OpenClaw. El entorno aislado de Node no contiene implementaciones de plugins, objetos de cliente de MCP ni secretos. `openclaw.tools.call(...)` atraviesa el puente de vuelta al Gateway, donde siguen aplicándose la política, la aprobación, los hooks, el registro y el procesamiento de resultados habituales.

## Modos

`tools.toolSearch` tiene tres modos visibles para el modelo:

- `code`: expone `tool_search_code`, el puente compacto predeterminado de JavaScript, junto con las herramientas exclusivamente directas.
- `tools`: expone `tool_search`, `tool_describe` y `tool_call` como herramientas estructuradas simples para proveedores que no deban recibir código, junto con las herramientas exclusivamente directas.
- `directory`: expone `tool_search`, `tool_describe` y `tool_call`, además de un directorio acotado en el prompt con los nombres y las descripciones de las herramientas disponibles para proveedores que deban ver los nombres de las herramientas sin recibir todos los esquemas completos. OpenClaw también puede exponer directamente un pequeño conjunto acotado de esquemas de herramientas probables o necesarias para el turno actual. Las herramientas exclusivamente directas también permanecen visibles en este modo.

Todos los modos utilizan el mismo catálogo filtrado por políticas y la ruta de ejecución habitual de OpenClaw. Las herramientas marcadas con `catalogMode: "direct-only"` permanecen fuera de ese catálogo y siguen siendo visibles para el modelo. Si el entorno de ejecución actual no puede iniciar el proceso secundario aislado de Node para el modo de código, el modo predeterminado `code` recurre a `tools` antes de la Compaction del catálogo. En el modo `directory`, las herramientas proporcionadas por el cliente permanecen visibles directamente durante la ejecución actual, mientras que las herramientas de OpenClaw, de plugins y de MCP pueden compactarse detrás del catálogo del directorio. Una llamada directa al nombre exacto de una herramienta oculta del directorio se completa desde ese mismo catálogo autorizado antes de ejecutarse.

Todos los modos son experimentales. Prefiera la exposición directa de herramientas para catálogos pequeños de herramientas de OpenClaw y las superficies estables nativas de Codex para las ejecuciones del entorno de Codex.

No existe una configuración independiente para seleccionar las fuentes. Cuando la Búsqueda de herramientas está habilitada, el catálogo incluye las herramientas de OpenClaw, MCP y cliente aptas para el catálogo después del filtrado habitual por políticas; las herramientas exclusivamente directas se conservan por separado.

## Motivo de esta función

Los catálogos extensos son útiles, pero costosos. Enviar todos los esquemas de herramientas al modelo aumenta el tamaño de la solicitud, ralentiza la planificación e incrementa la selección accidental de herramientas.

La Búsqueda de herramientas cambia la estructura:

- herramientas directas: el modelo ve todos los esquemas seleccionados antes del primer token
- modo de código de la Búsqueda de herramientas: el modelo ve una herramienta de código compacta, un contrato breve de API y cualquier herramienta exclusivamente directa
- modo de herramientas de la Búsqueda de herramientas: el modelo ve tres herramientas estructuradas compactas de respaldo, además de cualquier herramienta exclusivamente directa
- modo de directorio de la Búsqueda de herramientas: el modelo ve un directorio acotado, controles de búsqueda/descripción/llamada y un pequeño conjunto acotado de esquemas probables o necesarios, además de cualquier herramienta exclusivamente directa
- durante el turno: el modelo puede cargar los esquemas restantes según los necesite

La exposición directa de herramientas sigue siendo la opción predeterminada adecuada para catálogos pequeños. La Búsqueda de herramientas resulta especialmente útil cuando una ejecución puede acceder a muchas herramientas, sobre todo desde servidores MCP o herramientas de aplicaciones proporcionadas por el cliente.

## API

`openclaw.tools.search(query, options?)`

Busca en el catálogo efectivo de la ejecución actual. Los resultados son compactos y seguros para volver a incluirlos en el contexto del prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carga los metadatos completos de un resultado de búsqueda, incluido el esquema exacto de entrada.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Invoca una herramienta seleccionada mediante OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

El modo estructurado de respaldo expone las mismas operaciones como herramientas:

- `tool_search`
- `tool_describe`
- `tool_call`

El modo de directorio expone:

- `tool_search`
- `tool_describe`
- `tool_call`

También mantiene visibles directamente las herramientas proporcionadas por el cliente y todas las herramientas exclusivamente directas, y puede exponer directamente un pequeño conjunto acotado de esquemas de herramientas del catálogo probables o necesarios para el turno actual. Si el directorio acotado omite entradas, utilice `tool_search` para encontrarlas. Si el modelo solicita directamente el nombre exacto de una herramienta oculta del directorio, OpenClaw la completa desde el catálogo autorizado antes de la ejecución habitual.
Los nombres de herramientas de cliente del modo de directorio no deben coincidir con nombres de herramientas de OpenClaw, de plugins o de MCP, porque el despacho diferido exacto utiliza esos nombres.

## Límite del entorno de ejecución

El puente de código se ejecuta en un subproceso de corta duración de Node. El subproceso se inicia con el modo de permisos de Node habilitado, un entorno vacío, sin permisos para el sistema de archivos ni la red y sin permisos para procesos secundarios ni workers. OpenClaw aplica un tiempo de espera de reloj de pared en el proceso principal y termina el subproceso cuando se agota, incluso después de continuaciones asíncronas.

El entorno de ejecución solo expone:

- `console.log`, `console.warn` y `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

El comportamiento habitual de OpenClaw sigue aplicándose a las llamadas finales:

- políticas de autorización y denegación de herramientas
- restricciones de herramientas por agente y por entorno aislado
- política de herramientas del canal o del entorno de ejecución
- hooks de aprobación
- hooks `before_tool_call` de los plugins
- identidad de sesión, registros y telemetría

## Configuración

Habilite la Búsqueda de herramientas para las ejecuciones de OpenClaw con el puente de código predeterminado:

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

Utilice en su lugar la superficie compacta de directorio para las ejecuciones de OpenClaw:

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

El entorno de ejecución limita `codeTimeoutMs` al intervalo 1000-60000, `maxSearchLimit` al intervalo 1-50 y `searchDefaultLimit` al intervalo 1..`maxSearchLimit`.

Deshabilítela:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt y telemetría

La Búsqueda de herramientas registra telemetría suficiente para compararla con la exposición directa de herramientas:

- total de bytes serializados de herramientas y del prompt enviados al entorno
- tamaño del catálogo y desglose por fuentes
- número de búsquedas, descripciones y llamadas
- llamadas finales a herramientas ejecutadas mediante OpenClaw
- identificadores y fuentes de las herramientas seleccionadas

Los registros de sesión deben permitir responder:

- cuántos esquemas de herramientas vio el modelo de antemano
- cuántas operaciones de búsqueda y descripción realizó
- qué herramienta final se invocó
- si el resultado procedía de OpenClaw, MCP o una herramienta de cliente

## Validación E2E

El escenario de Gateway de QA Lab demuestra ambas rutas con el entorno de ejecución de OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Crea un plugin falso temporal con un catálogo extenso de herramientas, inicia el proveedor simulado de OpenAI, inicia un Gateway una vez en modo directo y otra con la Búsqueda de herramientas habilitada, y después compara las cargas útiles de las solicitudes al proveedor y los registros de sesión.

La prueba de regresión demuestra:

1. El modo directo puede invocar la herramienta del plugin falso.
2. La Búsqueda de herramientas puede invocar la misma herramienta del plugin falso.
3. El modo directo expone los esquemas de herramientas del plugin falso directamente al proveedor.
4. La Búsqueda de herramientas solo expone el puente compacto y cualquier herramienta exclusivamente directa.
5. La carga útil de la solicitud de la Búsqueda de herramientas es más pequeña para el catálogo falso extenso.
6. Los registros de sesión muestran el número esperado de llamadas a herramientas y la telemetría de llamadas a través del puente.

## Comportamiento ante fallos

La Búsqueda de herramientas debe fallar de forma cerrada:

- si una herramienta no está permitida por la política efectiva, la búsqueda no debe devolverla
- si una herramienta seleccionada deja de estar disponible, `tool_call` debe fallar
- si la política o la aprobación bloquean la ejecución, el resultado de la llamada debe informar de ese bloqueo en lugar de eludirlo
- si el puente de código no puede crear un entorno aislado, utilice `mode: "tools"` o deshabilite la Búsqueda de herramientas para ese despliegue

## Contenido relacionado

- [Herramientas y plugins](/es/tools)
- [Entorno aislado multiagente y herramientas](/es/tools/multi-agent-sandbox-tools)
- [Herramienta de ejecución](/es/tools/exec)
- [Configuración de agentes ACP](/es/tools/acp-agents-setup)
- [Creación de plugins](/es/plugins/building-plugins)
