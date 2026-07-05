---
read_when:
    - Quieres que los agentes de OpenClaw usen un catálogo amplio de herramientas sin añadir todos los esquemas de herramientas al prompt
    - Quieres que las herramientas de OpenClaw, las herramientas MCP y las herramientas de cliente se expongan a través de una única superficie de runtime compacta
    - Estás implementando o depurando el descubrimiento de herramientas para ejecuciones de OpenClaw
summary: 'Búsqueda de herramientas: compacta catálogos grandes de herramientas de OpenClaw detrás de search, describe y call'
title: Búsqueda de herramientas
x-i18n:
    generated_at: "2026-07-05T11:46:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa8a7f8580fe3743bfc6082ad3ab0fef848a326539131b4804e577daa05f4137
    source_path: tools/tool-search.md
    workflow: 16
---

La Búsqueda de herramientas es una función experimental del runtime de agentes de OpenClaw. Ofrece a los agentes una forma compacta de descubrir y llamar catálogos grandes de herramientas. Es útil cuando la ejecución tiene muchas herramientas disponibles, pero es probable que el modelo solo necesite algunas.

Esta página documenta la Búsqueda de herramientas de OpenClaw. No es la superficie de búsqueda de herramientas ni de herramientas dinámicas nativa de Codex. El modo de código nativo de Codex, la búsqueda de herramientas, las herramientas dinámicas diferidas y las llamadas de herramientas anidadas son superficies estables del arnés de Codex y no dependen de `tools.toolSearch`.

Cuando se habilita para ejecuciones de OpenClaw, el modelo recibe una herramienta `tool_search_code` de forma predeterminada. Esa herramienta ejecuta un cuerpo breve de JavaScript en un subproceso aislado de Node con un puente `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

El catálogo puede incluir herramientas de OpenClaw, herramientas de plugins, herramientas MCP y herramientas proporcionadas por el cliente. El modelo no ve todos los esquemas completos por adelantado. En su lugar, busca descriptores compactos, describe una herramienta seleccionada cuando necesita el esquema exacto y llama a esa herramienta a través de OpenClaw.

Las ejecuciones del arnés de Codex no reciben estos controles experimentales de la Búsqueda de herramientas de OpenClaw. OpenClaw pasa capacidades del producto a Codex como herramientas dinámicas, y Codex es propietario del modo de código nativo estable, la búsqueda de herramientas nativa, las herramientas dinámicas diferidas y las llamadas de herramientas anidadas.

## Cómo se ejecuta un turno

Durante la planificación, el ejecutor integrado de OpenClaw crea el catálogo efectivo para la ejecución:

1. Resolver la política de herramientas activa para el agente, el perfil, el sandbox y la sesión.
2. Enumerar las herramientas de OpenClaw y de plugins elegibles.
3. Enumerar las herramientas MCP elegibles a través del runtime MCP de la sesión.
4. Agregar las herramientas de cliente elegibles suministradas para la ejecución actual.
5. Indexar descriptores compactos para la búsqueda.
6. Exponer al modelo el puente de código de OpenClaw, las herramientas estructuradas de respaldo o la superficie compacta de directorio.

Durante la ejecución, cada llamada real de herramienta vuelve a OpenClaw. El runtime aislado de Node no contiene implementaciones de plugins, objetos de cliente MCP ni secretos. `openclaw.tools.call(...)` cruza el puente de vuelta al Gateway, donde siguen aplicándose la política, la aprobación, los hooks, el registro y el manejo de resultados normales.

## Modos

`tools.toolSearch` tiene tres modos visibles para el modelo:

- `code`: expone `tool_search_code`, el puente compacto predeterminado de JavaScript.
- `tools`: expone `tool_search`, `tool_describe` y `tool_call` como herramientas estructuradas simples para proveedores que no deberían recibir código.
- `directory`: expone `tool_search`, `tool_describe` y `tool_call`, además de un directorio acotado en el prompt con nombres y descripciones de herramientas disponibles para proveedores que deberían ver nombres de herramientas sin todos los esquemas completos. OpenClaw también puede exponer directamente un conjunto pequeño y acotado de esquemas de herramientas probables o requeridos para el turno actual.

Todos los modos usan el mismo catálogo filtrado por política y la ruta normal de ejecución de OpenClaw. Si el runtime actual no puede iniciar el proceso hijo aislado de Node para el modo de código, el modo `code` predeterminado vuelve a `tools` antes de la compactación del catálogo. En el modo `directory`, las herramientas proporcionadas por el cliente permanecen directamente visibles para la ejecución actual, mientras que las herramientas de OpenClaw, de plugins y MCP pueden compactarse detrás del catálogo de directorio. Una llamada directa a un nombre exacto oculto del directorio se hidrata desde ese mismo catálogo autorizado antes de la ejecución.

Todos los modos son experimentales. Prefiere la exposición directa de herramientas para catálogos pequeños de herramientas de OpenClaw y prefiere las superficies estables nativas de Codex para ejecuciones del arnés de Codex.

No hay una configuración separada de selección de fuentes. Cuando la Búsqueda de herramientas está habilitada, el catálogo incluye herramientas elegibles de OpenClaw, MCP y de cliente después del filtrado normal de políticas.

## Por qué existe

Los catálogos grandes son útiles, pero costosos. Enviar todos los esquemas de herramientas al modelo agranda la solicitud, ralentiza la planificación y aumenta la selección accidental de herramientas.

La Búsqueda de herramientas cambia la forma:

- herramientas directas: el modelo ve todos los esquemas seleccionados antes del primer token
- modo de código de Búsqueda de herramientas: el modelo ve una herramienta de código compacta y un contrato de API breve
- modo de herramientas de Búsqueda de herramientas: el modelo ve tres herramientas estructuradas compactas de respaldo
- modo de directorio de Búsqueda de herramientas: el modelo ve un directorio acotado más controles de búsqueda/descripción/llamada y un conjunto pequeño y acotado de esquemas probables o requeridos
- durante el turno: el modelo puede cargar los esquemas restantes según sea necesario

La exposición directa de herramientas sigue siendo el valor predeterminado correcto para catálogos pequeños. La Búsqueda de herramientas funciona mejor cuando una ejecución puede ver muchas herramientas, especialmente de servidores MCP o herramientas de aplicaciones proporcionadas por el cliente.

## API

`openclaw.tools.search(query, options?)`

Busca en el catálogo efectivo de la ejecución actual. Los resultados son compactos y seguros para volver a colocarlos en el contexto del prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carga metadatos completos para un resultado de búsqueda, incluido el esquema de entrada exacto.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Llama a una herramienta seleccionada a través de OpenClaw.

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

También mantiene directamente visibles las herramientas proporcionadas por el cliente y puede exponer directamente un conjunto pequeño y acotado de esquemas de herramientas de catálogo probables o requeridos para el turno actual. Si el directorio acotado omite entradas, usa `tool_search` para encontrarlas. Si el modelo solicita directamente un nombre exacto de herramienta oculta del directorio, OpenClaw la hidrata desde el catálogo autorizado antes de la ejecución normal.
Los nombres de herramientas de cliente en modo de directorio no deben colisionar con nombres de herramientas de OpenClaw, plugins o MCP, porque el despacho diferido exacto usa esos nombres.

## Límite del runtime

El puente de código se ejecuta en un subproceso de Node de vida corta. El subproceso comienza con el modo de permisos de Node habilitado, un entorno vacío, sin permisos de sistema de archivos ni red, y sin permisos de procesos hijos ni workers. OpenClaw aplica un tiempo de espera de reloj de pared en el proceso padre y mata el subproceso al agotarse el tiempo, incluso después de continuaciones asíncronas.

El runtime solo expone:

- `console.log`, `console.warn` y `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

El comportamiento normal de OpenClaw sigue aplicándose a las llamadas finales:

- políticas de permitir y denegar herramientas
- restricciones de herramientas por agente y por sandbox
- política de herramientas de canal/runtime
- hooks de aprobación
- hooks `before_tool_call` de plugins
- identidad de sesión, registros y telemetría

## Configuración

Habilita la Búsqueda de herramientas para ejecuciones de OpenClaw con el puente de código predeterminado:

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

Usa en su lugar las herramientas estructuradas de respaldo para ejecuciones de OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Usa en su lugar la superficie compacta de directorio para ejecuciones de OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Ajusta el tiempo de espera del modo de código y los límites de resultados de búsqueda (los valores mostrados son los predeterminados):

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

El runtime limita `codeTimeoutMs` a 1000-60000, `maxSearchLimit` a 1-50 y `searchDefaultLimit` a 1..`maxSearchLimit`.

Deshabilítala:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt y telemetría

La Búsqueda de herramientas registra suficiente telemetría para compararla con la exposición directa de herramientas:

- bytes serializados totales de herramientas y prompt enviados al arnés
- tamaño del catálogo y desglose por fuente
- conteos de búsqueda, descripción y llamada
- llamadas finales de herramientas ejecutadas a través de OpenClaw
- ids y fuentes de herramientas seleccionadas

Los registros de sesión deberían permitir responder:

- cuántos esquemas de herramientas vio el modelo por adelantado
- cuántas operaciones de búsqueda y descripción realizó
- qué herramienta final se llamó
- si el resultado provino de OpenClaw, MCP o una herramienta de cliente

## Validación E2E

El escenario de Gateway de QA Lab prueba ambas rutas con el runtime de OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Crea un plugin falso temporal con un catálogo grande de herramientas, inicia el proveedor simulado de OpenAI, inicia un Gateway una vez en modo directo y otra vez con la Búsqueda de herramientas habilitada, y luego compara las cargas útiles de solicitud del proveedor y los registros de sesión.

La regresión demuestra:

1. El modo directo puede llamar a la herramienta del plugin falso.
2. La Búsqueda de herramientas puede llamar a la misma herramienta del plugin falso.
3. El modo directo expone directamente al proveedor los esquemas de herramientas del plugin falso.
4. La Búsqueda de herramientas expone solo el puente compacto.
5. La carga útil de solicitud de la Búsqueda de herramientas es más pequeña para el catálogo falso grande.
6. Los registros de sesión muestran los conteos esperados de llamadas de herramientas y la telemetría de llamadas puenteadas.

## Comportamiento ante fallos

La Búsqueda de herramientas debe fallar de forma cerrada:

- si una herramienta no está en la política efectiva, la búsqueda no debería devolverla
- si una herramienta seleccionada deja de estar disponible, `tool_call` debería fallar
- si la política o la aprobación bloquea la ejecución, el resultado de la llamada debería informar ese bloqueo en lugar de omitirlo
- si el puente de código no puede crear un runtime aislado, usa `mode: "tools"` o deshabilita la Búsqueda de herramientas para ese despliegue

## Relacionado

- [Herramientas y plugins](/es/tools)
- [Sandbox multiagente y herramientas](/es/tools/multi-agent-sandbox-tools)
- [Herramienta Exec](/es/tools/exec)
- [Configuración de agentes ACP](/es/tools/acp-agents-setup)
- [Crear plugins](/es/plugins/building-plugins)
