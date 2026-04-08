---
read_when:
    - Quieres entender cómo funciona la memoria
    - Quieres saber qué archivos de memoria escribir
summary: Cómo OpenClaw recuerda cosas entre sesiones
title: Descripción general de la memoria
x-i18n:
    generated_at: "2026-04-08T05:03:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bb8552341b0b651609edaaae826a22fdc535d240aed4fad4af4b069454004af
    source_path: concepts/memory.md
    workflow: 15
---

# Descripción general de la memoria

OpenClaw recuerda cosas escribiendo **archivos Markdown sin formato** en el
espacio de trabajo de tu agente. El modelo solo "recuerda" lo que se guarda en
el disco; no hay ningún estado oculto.

## Cómo funciona

Tu agente tiene tres archivos relacionados con la memoria:

- **`MEMORY.md`** -- memoria a largo plazo. Hechos duraderos, preferencias y
  decisiones. Se carga al inicio de cada sesión de MD.
- **`memory/YYYY-MM-DD.md`** -- notas diarias. Contexto y observaciones en
  curso. Las notas de hoy y de ayer se cargan automáticamente.
- **`DREAMS.md`** (experimental, opcional) -- Diario de sueños y resúmenes de
  barridos de sueño para revisión humana.

Estos archivos viven en el espacio de trabajo del agente (predeterminado `~/.openclaw/workspace`).

<Tip>
Si quieres que tu agente recuerde algo, solo pídeselo: "Recuerda que prefiero
TypeScript." Lo escribirá en el archivo adecuado.
</Tip>

## Herramientas de memoria

El agente tiene dos herramientas para trabajar con la memoria:

- **`memory_search`** -- encuentra notas relevantes mediante búsqueda
  semántica, incluso cuando la redacción difiere de la original.
- **`memory_get`** -- lee un archivo de memoria específico o un intervalo de
  líneas.

Ambas herramientas las proporciona el plugin de memoria activo (predeterminado: `memory-core`).

## Plugin complementario Memory Wiki

Si quieres que la memoria duradera se comporte más como una base de conocimiento mantenida que
como simples notas sin procesar, usa el plugin integrado `memory-wiki`.

`memory-wiki` compila el conocimiento duradero en una bóveda wiki con:

- estructura de páginas determinista
- afirmaciones y evidencia estructuradas
- seguimiento de contradicciones y vigencia
- paneles generados
- resúmenes compilados para consumidores del agente/runtime
- herramientas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` y `wiki_lint`

No reemplaza al plugin de memoria activo. El plugin de memoria activo sigue
encargándose de la recuperación, la promoción y el sueño. `memory-wiki` añade una
capa de conocimiento rica en procedencia a su lado.

Consulta [Memory Wiki](/es/plugins/memory-wiki).

## Búsqueda en memoria

Cuando hay configurado un proveedor de embeddings, `memory_search` usa
**búsqueda híbrida** -- combinando similitud vectorial (significado semántico) con coincidencia por palabras clave
(términos exactos como ID y símbolos de código). Esto funciona de inmediato en cuanto tengas
una clave de API para cualquier proveedor compatible.

<Info>
OpenClaw detecta automáticamente tu proveedor de embeddings a partir de las claves de API disponibles. Si
tienes configurada una clave de OpenAI, Gemini, Voyage o Mistral, la búsqueda en memoria se
habilita automáticamente.
</Info>

Para obtener detalles sobre cómo funciona la búsqueda, las opciones de ajuste y la configuración del proveedor, consulta
[Memory Search](/es/concepts/memory-search).

## Backends de memoria

<CardGroup cols={3}>
<Card title="Integrado (predeterminado)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona de inmediato con búsqueda por palabras clave, similitud vectorial y
búsqueda híbrida. Sin dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Sidecar local-first con reranking, expansión de consultas y la capacidad de indexar
directorios fuera del espacio de trabajo.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memoria entre sesiones nativa para IA con modelado de usuario, búsqueda semántica y
conocimiento de múltiples agentes. Instalación mediante plugin.
</Card>
</CardGroup>

## Capa wiki de conocimiento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/es/plugins/memory-wiki">
Compila la memoria duradera en una bóveda wiki rica en procedencia con afirmaciones,
paneles, modo puente y flujos de trabajo compatibles con Obsidian.
</Card>
</CardGroup>

## Vaciado automático de memoria

Antes de que la [compactación](/es/concepts/compaction) resuma tu conversación, OpenClaw
ejecuta un turno silencioso que recuerda al agente que guarde el contexto importante en archivos
de memoria. Esto está activado de forma predeterminada; no necesitas configurar nada.

<Tip>
El vaciado de memoria evita la pérdida de contexto durante la compactación. Si tu agente tiene
hechos importantes en la conversación que todavía no se han escrito en un archivo,
se guardarán automáticamente antes de que ocurra el resumen.
</Tip>

## Sueño (experimental)

El sueño es un proceso opcional de consolidación en segundo plano para la memoria. Recopila
señales a corto plazo, puntúa candidatos y promueve solo los elementos que cumplen los requisitos a la
memoria a largo plazo (`MEMORY.md`).

Está diseñado para mantener alta la relación señal-ruido de la memoria a largo plazo:

- **Optativo**: desactivado de forma predeterminada.
- **Programado**: cuando está activado, `memory-core` gestiona automáticamente un trabajo cron recurrente
  para un barrido completo de sueño.
- **Con umbrales**: las promociones deben superar filtros de puntuación, frecuencia de recuperación y
  diversidad de consultas.
- **Revisable**: los resúmenes de fase y las entradas del diario se escriben en `DREAMS.md`
  para revisión humana.

Para conocer el comportamiento por fases, las señales de puntuación y los detalles del Diario de sueños, consulta
[Sueño (experimental)](/es/concepts/dreaming).

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Más información

- [Builtin Memory Engine](/es/concepts/memory-builtin) -- backend SQLite predeterminado
- [QMD Memory Engine](/es/concepts/memory-qmd) -- sidecar local-first avanzado
- [Honcho Memory](/es/concepts/memory-honcho) -- memoria entre sesiones nativa para IA
- [Memory Wiki](/es/plugins/memory-wiki) -- bóveda de conocimiento compilada y herramientas nativas de wiki
- [Memory Search](/es/concepts/memory-search) -- canalización de búsqueda, proveedores y
  ajuste
- [Dreaming (experimental)](/es/concepts/dreaming) -- promoción en segundo plano
  de la recuperación a corto plazo a la memoria a largo plazo
- [Memory configuration reference](/es/reference/memory-config) -- todas las opciones de configuración
- [Compaction](/es/concepts/compaction) -- cómo interactúa la compactación con la memoria
