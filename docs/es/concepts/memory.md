---
read_when:
    - Quieres entender cómo funciona Memory
    - Quieres saber qué archivos de memory escribir
summary: Cómo OpenClaw recuerda cosas entre sesiones
title: Resumen de Memory
x-i18n:
    generated_at: "2026-04-24T05:25:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw recuerda cosas escribiendo **archivos Markdown simples** en el
espacio de trabajo de tu agente. El modelo solo “recuerda” lo que se guarda en
disco; no hay estado oculto.

## Cómo funciona

Tu agente tiene tres archivos relacionados con memory:

- **`MEMORY.md`**: memory a largo plazo. Hechos duraderos, preferencias y
  decisiones. Se carga al inicio de cada sesión de DM.
- **`memory/YYYY-MM-DD.md`**: notas diarias. Contexto continuo y observaciones.
  Las notas de hoy y de ayer se cargan automáticamente.
- **`DREAMS.md`** (opcional): Diario de sueños y resúmenes de barridos de
  dreaming para revisión humana, incluidas entradas de backfill histórico fundamentado.

Estos archivos viven en el espacio de trabajo del agente (predeterminado `~/.openclaw/workspace`).

<Tip>
Si quieres que tu agente recuerde algo, solo pídeselo: “Recuerda que prefiero
TypeScript”. Lo escribirá en el archivo apropiado.
</Tip>

## Herramientas de memory

El agente tiene dos herramientas para trabajar con memory:

- **`memory_search`**: encuentra notas relevantes usando búsqueda semántica, incluso cuando
  la redacción difiere del original.
- **`memory_get`**: lee un archivo de memory específico o un rango de líneas.

Ambas herramientas las proporciona el Plugin de memory activo (predeterminado: `memory-core`).

## Plugin complementario Memory Wiki

Si quieres que la memory duradera se comporte más como una base de conocimiento mantenida que
como simples notas en bruto, usa el Plugin incluido `memory-wiki`.

`memory-wiki` compila el conocimiento duradero en una bóveda wiki con:

- estructura de página determinista
- afirmaciones y evidencias estructuradas
- seguimiento de contradicciones y vigencia
- paneles generados
- resúmenes compilados para consumidores de agente/runtime
- herramientas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` y `wiki_lint`

No sustituye al Plugin de memory activo. El Plugin de memory activo sigue siendo
propietario del recall, la promoción y dreaming. `memory-wiki` añade una capa de
conocimiento rica en procedencia a su lado.

Consulta [Memory Wiki](/es/plugins/memory-wiki).

## Búsqueda de memory

Cuando se configura un proveedor de embeddings, `memory_search` usa **búsqueda
híbrida**: combina similitud vectorial (significado semántico) con coincidencia por palabras clave
(términos exactos como ID y símbolos de código). Esto funciona desde el primer momento una vez que tienes
una API key para cualquier proveedor compatible.

<Info>
OpenClaw detecta automáticamente tu proveedor de embeddings a partir de las API keys disponibles. Si
tienes configurada una clave de OpenAI, Gemini, Voyage o Mistral, la búsqueda de memory queda
habilitada automáticamente.
</Info>

Para más detalles sobre cómo funciona la búsqueda, opciones de ajuste y configuración de proveedores, consulta
[Memory Search](/es/concepts/memory-search).

## Backends de memory

<CardGroup cols={3}>
<Card title="Integrado (predeterminado)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona desde el primer momento con búsqueda por palabras clave, similitud vectorial y
búsqueda híbrida. Sin dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Sidecar local-first con reranking, expansión de consultas y capacidad de indexar
directorios fuera del espacio de trabajo.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memory nativa de IA entre sesiones con modelado de usuario, búsqueda semántica y
conciencia multiagente. Requiere instalar un Plugin.
</Card>
</CardGroup>

## Capa wiki de conocimiento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/es/plugins/memory-wiki">
Compila memory duradera en una bóveda wiki rica en procedencia con afirmaciones,
paneles, modo puente y flujos compatibles con Obsidian.
</Card>
</CardGroup>

## Vaciado automático de memory

Antes de que [Compaction](/es/concepts/compaction) resuma tu conversación, OpenClaw
ejecuta un turno silencioso que recuerda al agente guardar el contexto importante en archivos de memory.
Esto está activado de forma predeterminada; no necesitas configurar nada.

<Tip>
El vaciado de memory evita la pérdida de contexto durante Compaction. Si tu agente tiene
hechos importantes en la conversación que aún no se han escrito en un archivo,
se guardarán automáticamente antes de que ocurra el resumen.
</Tip>

## Dreaming

Dreaming es un proceso opcional de consolidación en segundo plano para memory. Recoge
señales de corto plazo, puntúa candidatos y promueve solo los elementos que cumplen los requisitos a
memory a largo plazo (`MEMORY.md`).

Está diseñado para mantener alta la señal en la memory a largo plazo:

- **Opt-in**: desactivado de forma predeterminada.
- **Programado**: cuando está habilitado, `memory-core` gestiona automáticamente un trabajo de Cron recurrente
  para un barrido completo de dreaming.
- **Con umbrales**: las promociones deben superar controles de puntuación, frecuencia de recall y
  diversidad de consultas.
- **Revisable**: los resúmenes de fase y las entradas de diario se escriben en `DREAMS.md`
  para revisión humana.

Para comportamiento de fases, señales de puntuación y detalles del Diario de sueños, consulta
[Dreaming](/es/concepts/dreaming).

## Backfill fundamentado y promoción activa

El sistema de dreaming ahora tiene dos rutas de revisión estrechamente relacionadas:

- **Dreaming activo** trabaja desde el almacén de dreaming de corto plazo bajo
  `memory/.dreams/` y es lo que usa la fase deep normal al decidir qué
  puede graduarse a `MEMORY.md`.
- **Backfill fundamentado** lee notas históricas `memory/YYYY-MM-DD.md` como
  archivos de día independientes y escribe salida estructurada de revisión en `DREAMS.md`.

El backfill fundamentado es útil cuando quieres reproducir notas antiguas e inspeccionar qué
cree el sistema que es duradero sin editar manualmente `MEMORY.md`.

Cuando usas:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

los candidatos duraderos fundamentados no se promueven directamente. Se preparan en
el mismo almacén de dreaming de corto plazo que ya usa la fase deep normal. Eso
significa que:

- `DREAMS.md` sigue siendo la superficie de revisión humana.
- el almacén de corto plazo sigue siendo la superficie de ranking orientada a la máquina.
- `MEMORY.md` sigue siendo escrito solo por la promoción deep.

Si decides que la reproducción no fue útil, puedes eliminar los artefactos preparados
sin tocar las entradas normales del diario ni el estado normal de recall:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Comprobar el estado del índice y el proveedor
openclaw memory search "query"  # Buscar desde la línea de comandos
openclaw memory index --force   # Reconstruir el índice
```

## Lecturas adicionales

- [Motor de Memory integrado](/es/concepts/memory-builtin): backend predeterminado basado en SQLite
- [Motor de Memory QMD](/es/concepts/memory-qmd): sidecar avanzado local-first
- [Memory Honcho](/es/concepts/memory-honcho): memory nativa de IA entre sesiones
- [Memory Wiki](/es/plugins/memory-wiki): bóveda de conocimiento compilada y herramientas nativas de wiki
- [Memory Search](/es/concepts/memory-search): canal de búsqueda, proveedores y
  ajuste
- [Dreaming](/es/concepts/dreaming): promoción en segundo plano
  desde recall de corto plazo a memory a largo plazo
- [Referencia de configuración de Memory](/es/reference/memory-config): todos los ajustes de configuración
- [Compaction](/es/concepts/compaction): cómo interactúa Compaction con memory

## Relacionado

- [Active Memory](/es/concepts/active-memory)
- [Memory Search](/es/concepts/memory-search)
- [Motor de memory integrado](/es/concepts/memory-builtin)
- [Memory Honcho](/es/concepts/memory-honcho)
