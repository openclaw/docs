---
read_when:
    - Quieres que los agentes Pi usen un catálogo grande de herramientas sin agregar cada esquema de herramienta a la instrucción
    - Quieres que las herramientas de OpenClaw, las herramientas de MCP y las herramientas de cliente se expongan a través de una única superficie PI compacta
    - Estás implementando o depurando el descubrimiento de herramientas para ejecuciones de PI
summary: 'Búsqueda de herramientas: compacta los catálogos grandes de herramientas de Pi detrás de búsqueda, descripción y llamada'
title: Búsqueda de herramientas
x-i18n:
    generated_at: "2026-05-11T20:58:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

La Búsqueda de herramientas es una función experimental de agente PI de OpenClaw. Ofrece a los agentes PI una forma
compacta de descubrir y llamar grandes catálogos de herramientas. Es útil cuando la ejecución
tiene muchas herramientas disponibles, pero es probable que el modelo necesite solo unas pocas.

Esta página documenta la Búsqueda de herramientas PI de OpenClaw. No es la búsqueda de
herramientas nativa de Codex ni la superficie de herramientas dinámicas. El modo de código
nativo de Codex, la búsqueda de herramientas, las herramientas dinámicas diferidas y las
llamadas de herramientas anidadas son superficies estables del harness de Codex y no
dependen de `tools.toolSearch`.

Cuando está habilitada para PI, el modelo recibe una herramienta `tool_search_code` de forma predeterminada.
Esa herramienta ejecuta un cuerpo JavaScript breve en un subproceso Node aislado con un
puente `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

El catálogo puede incluir herramientas de OpenClaw, herramientas de plugins, herramientas MCP y
herramientas proporcionadas por el cliente. El modelo no ve todos los esquemas completos por adelantado.
En su lugar, busca descriptores compactos, describe una herramienta seleccionada cuando
necesita el esquema exacto y llama esa herramienta mediante OpenClaw.

Las ejecuciones del harness de Codex no reciben estos controles experimentales de Búsqueda de herramientas de OpenClaw.
OpenClaw pasa capacidades del producto a Codex como herramientas dinámicas, y
Codex posee el modo de código nativo estable, la búsqueda de herramientas nativa, las herramientas dinámicas
diferidas y las llamadas de herramientas anidadas.

## Cómo se ejecuta un turno

En el momento de planificación, el ejecutor PI integrado construye el catálogo efectivo para la
ejución:

1. Resolver la política de herramientas activa para el agente, el perfil, el sandbox y la sesión.
2. Enumerar las herramientas de OpenClaw y de plugins elegibles.
3. Enumerar las herramientas MCP elegibles mediante el runtime MCP de la sesión.
4. Agregar las herramientas de cliente elegibles suministradas para la ejecución actual.
5. Indexar descriptores compactos para la búsqueda.
6. Exponer al modelo el puente de código PI o las herramientas estructuradas de reserva.

En tiempo de ejecución, cada llamada de herramienta real vuelve a OpenClaw. El runtime Node
aislado no contiene implementaciones de plugins, objetos cliente MCP ni secretos.
`openclaw.tools.call(...)` cruza el puente de vuelta al Gateway, donde la
política, la aprobación, el hook, el registro y el manejo de resultados normales siguen aplicándose.

## Modos

`tools.toolSearch` tiene dos modos visibles para el modelo:

- `code`: expone `tool_search_code`, el puente JavaScript compacto predeterminado.
- `tools`: expone `tool_search`, `tool_describe` y `tool_call` como herramientas
  estructuradas simples para proveedores que no deberían recibir código.

Ambos modos usan el mismo catálogo y la misma ruta de ejecución. La única diferencia es la
forma que ve el modelo. Si el runtime actual no puede iniciar el proceso hijo Node
aislado de modo de código, el modo `code` predeterminado recurre a `tools` antes de
la compactación del catálogo.

Ambos modos son experimentales. Prefiere la exposición directa de herramientas para catálogos pequeños de herramientas PI
y prefiere las superficies estables nativas de Codex para ejecuciones del harness de Codex.

No hay una configuración separada de selección de fuentes. Cuando la Búsqueda de herramientas está habilitada, el
catálogo incluye herramientas elegibles de OpenClaw, MCP y cliente tras el filtrado normal de políticas.

## Por qué existe

Los catálogos grandes son útiles, pero costosos. Enviar todos los esquemas de herramientas al modelo
hace que la solicitud sea más grande, ralentiza la planificación y aumenta la selección accidental de herramientas.

La Búsqueda de herramientas cambia la forma:

- herramientas directas: el modelo ve todos los esquemas seleccionados antes del primer token
- modo de código de Búsqueda de herramientas: el modelo ve una herramienta de código compacta y un contrato de API breve
- modo de herramientas de Búsqueda de herramientas: el modelo ve tres herramientas estructuradas compactas de reserva
- durante el turno: el modelo carga solo los esquemas de herramientas que realmente necesita

La exposición directa de herramientas sigue siendo el valor predeterminado correcto para catálogos pequeños. La Búsqueda de herramientas
es mejor cuando una ejecución puede ver muchas herramientas, especialmente desde servidores MCP o
herramientas de apps proporcionadas por el cliente.

## API

`openclaw.tools.search(query, options?)`

Busca en el catálogo efectivo de la ejecución actual. Los resultados son compactos y seguros
para volver a colocarlos en el contexto del prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carga los metadatos completos de un resultado de búsqueda, incluido el esquema de entrada exacto.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Llama una herramienta seleccionada mediante OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

El modo estructurado de reserva expone las mismas operaciones como herramientas:

- `tool_search`
- `tool_describe`
- `tool_call`

## Límite del runtime

El puente de código se ejecuta en un subproceso Node de corta duración. El subproceso se inicia
con el modo de permisos de Node habilitado, un entorno vacío, sin concesiones de sistema de archivos ni
red, y sin concesiones de procesos hijos ni workers. OpenClaw aplica un
tiempo de espera de reloj de pared en el proceso padre y elimina el subproceso al agotarse el tiempo de espera, incluso
después de continuaciones asíncronas.

El runtime expone solo:

- `console.log`, `console.warn` y `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

El comportamiento normal de OpenClaw sigue aplicándose a las llamadas finales:

- políticas de permitir y denegar herramientas
- restricciones de herramientas por agente y por sandbox
- control de acceso solo para propietarios
- hooks de aprobación
- hooks `before_tool_call` de plugins
- identidad de sesión, registros y telemetría

## Configuración

Habilita la Búsqueda de herramientas para ejecuciones PI con el puente de código predeterminado:

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

Usa en su lugar las herramientas estructuradas de reserva para ejecuciones PI:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Ajusta el tiempo de espera de modo de código y los límites de resultados de búsqueda:

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

- total de bytes serializados de herramientas y prompt enviados al harness
- tamaño del catálogo y desglose por fuente
- conteos de búsquedas, descripciones y llamadas
- llamadas finales de herramientas ejecutadas mediante OpenClaw
- ids y fuentes de herramientas seleccionadas

Los registros de sesión deberían permitir responder:

- cuántos esquemas de herramientas vio el modelo por adelantado
- cuántas operaciones de búsqueda y descripción realizó
- qué herramienta final se llamó
- si el resultado provino de OpenClaw, MCP o una herramienta de cliente

## Validación E2E

El ejecutor E2E del Gateway prueba ambas rutas con el harness PI:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Crea un plugin falso temporal con un catálogo grande de herramientas, inicia el proveedor
OpenAI simulado, inicia un Gateway una vez en modo directo y otra vez con la Búsqueda de herramientas
habilitada, y luego compara las cargas útiles de solicitudes del proveedor y los registros de sesión.

La regresión prueba:

1. El modo directo puede llamar la herramienta del plugin falso.
2. La Búsqueda de herramientas puede llamar la misma herramienta del plugin falso.
3. El modo directo expone los esquemas de herramientas del plugin falso directamente al proveedor.
4. La Búsqueda de herramientas expone solo el puente compacto.
5. La carga útil de solicitud de la Búsqueda de herramientas es menor para el catálogo falso grande.
6. Los registros de sesión muestran los conteos esperados de llamadas de herramientas y la telemetría de llamadas puenteadas.

## Comportamiento ante fallos

La Búsqueda de herramientas debería fallar de forma cerrada:

- si una herramienta no está en la política efectiva, la búsqueda no debería devolverla
- si una herramienta seleccionada deja de estar disponible, `tool_call` debería fallar
- si la política o la aprobación bloquean la ejecución, el resultado de la llamada debería informar ese
  bloqueo en vez de omitirlo
- si el puente de código no puede crear un runtime aislado, usa `mode: "tools"` o
  deshabilita la Búsqueda de herramientas para ese despliegue

## Relacionado

- [Herramientas y plugins](/es/tools)
- [Sandbox multiagente y herramientas](/es/tools/multi-agent-sandbox-tools)
- [Herramienta exec](/es/tools/exec)
- [Configuración de agentes ACP](/es/tools/acp-agents-setup)
- [Crear plugins](/es/plugins/building-plugins)
