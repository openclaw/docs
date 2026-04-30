---
read_when:
    - Quieres entender cómo funciona la memoria
    - Quieres saber qué archivos de memoria escribir
summary: Cómo OpenClaw recuerda información entre sesiones
title: Descripción general de la memoria
x-i18n:
    generated_at: "2026-04-30T05:37:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw recuerda cosas escribiendo **archivos Markdown sin formato** en el espacio de trabajo de tu agente. El modelo solo "recuerda" lo que se guarda en disco; no hay estado oculto.

## Cómo funciona

Tu agente tiene tres archivos relacionados con la memoria:

- **`MEMORY.md`** — memoria a largo plazo. Hechos duraderos, preferencias y decisiones. Se carga al inicio de cada sesión de DM.
- **`memory/YYYY-MM-DD.md`** — notas diarias. Contexto continuo y observaciones. Las notas de hoy y de ayer se cargan automáticamente.
- **`DREAMS.md`** (opcional) — diario de Dreaming y resúmenes de barridos de Dreaming para revisión humana, incluidas entradas históricas de relleno fundamentadas.

Estos archivos viven en el espacio de trabajo del agente (valor predeterminado: `~/.openclaw/workspace`).

<Tip>
Si quieres que tu agente recuerde algo, solo pídeselo: "Recuerda que prefiero TypeScript". Lo escribirá en el archivo apropiado.
</Tip>

## Compromisos inferidos

Algunos seguimientos futuros no son hechos duraderos. Si mencionas una entrevista mañana, el recuerdo útil puede ser "hacer seguimiento después de la entrevista", no "guardar esto para siempre en `MEMORY.md`".

[Commitments](/es/concepts/commitments) son memorias de seguimiento opcionales y de corta duración para ese caso. OpenClaw las infiere en una pasada oculta en segundo plano, las limita al mismo agente y canal, y entrega los seguimientos vencidos mediante heartbeat. Los recordatorios explícitos siguen usando [tareas programadas](/es/automation/cron-jobs).

## Herramientas de memoria

El agente tiene dos herramientas para trabajar con la memoria:

- **`memory_search`** — encuentra notas relevantes mediante búsqueda semántica, incluso cuando la redacción difiere de la original.
- **`memory_get`** — lee un archivo de memoria específico o un rango de líneas.

Ambas herramientas las proporciona el Plugin de active memory (valor predeterminado: `memory-core`).

## Plugin complementario Memory Wiki

Si quieres que la memoria duradera se comporte más como una base de conocimiento mantenida que como simples notas sin procesar, usa el Plugin incluido `memory-wiki`.

`memory-wiki` compila conocimiento duradero en una bóveda wiki con:

- estructura de páginas determinista
- afirmaciones y evidencias estructuradas
- seguimiento de contradicciones y vigencia
- paneles generados
- resúmenes compilados para consumidores de agente/runtime
- herramientas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` y `wiki_lint`

No reemplaza al Plugin de active memory. El Plugin de active memory sigue siendo dueño de la recuperación, la promoción y Dreaming. `memory-wiki` añade una capa de conocimiento rica en procedencia junto a él.

Consulta [Memory Wiki](/es/plugins/memory-wiki).

## Búsqueda de memoria

Cuando se configura un proveedor de embeddings, `memory_search` usa **búsqueda híbrida**, que combina similitud vectorial (significado semántico) con coincidencia por palabras clave (términos exactos como identificadores y símbolos de código). Esto funciona de inmediato una vez que tienes una clave de API para cualquier proveedor compatible.

<Info>
OpenClaw detecta automáticamente tu proveedor de embeddings a partir de las claves de API disponibles. Si tienes configurada una clave de OpenAI, Gemini, Voyage o Mistral, la búsqueda de memoria se habilita automáticamente.
</Info>

Para obtener detalles sobre cómo funciona la búsqueda, opciones de ajuste y configuración de proveedores, consulta [Memory Search](/es/concepts/memory-search).

## Backends de memoria

<CardGroup cols={3}>
<Card title="Incorporado (predeterminado)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona de inmediato con búsqueda por palabras clave, similitud vectorial y búsqueda híbrida. Sin dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Sidecar local-first con reordenación, expansión de consultas y la capacidad de indexar directorios fuera del espacio de trabajo.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memoria entre sesiones nativa de IA con modelado de usuario, búsqueda semántica y conciencia multiagente. Instalación de Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/es/plugins/memory-lancedb">
Memoria incluida respaldada por LanceDB con embeddings compatibles con OpenAI, recuperación automática, captura automática y compatibilidad con embeddings locales de Ollama.
</Card>
</CardGroup>

## Capa de wiki de conocimiento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/es/plugins/memory-wiki">
Compila memoria duradera en una bóveda wiki rica en procedencia con afirmaciones, paneles, modo puente y flujos de trabajo compatibles con Obsidian.
</Card>
</CardGroup>

## Vaciado automático de memoria

Antes de que [Compaction](/es/concepts/compaction) resuma tu conversación, OpenClaw ejecuta un turno silencioso que le recuerda al agente guardar el contexto importante en archivos de memoria. Esto está activado de forma predeterminada; no necesitas configurar nada.

Para mantener ese turno de mantenimiento en un modelo local, establece una anulación exacta del modelo de vaciado de memoria:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

La anulación se aplica solo al turno de vaciado de memoria y no hereda la cadena de respaldo de la sesión activa.

<Tip>
El vaciado de memoria evita la pérdida de contexto durante Compaction. Si tu agente tiene hechos importantes en la conversación que aún no se han escrito en un archivo, se guardarán automáticamente antes de que ocurra el resumen.
</Tip>

## Dreaming

Dreaming es una pasada opcional de consolidación en segundo plano para la memoria. Recopila señales a corto plazo, puntúa candidatos y solo promueve elementos calificados a la memoria a largo plazo (`MEMORY.md`).

Está diseñado para mantener la memoria a largo plazo con una alta proporción de señales útiles:

- **Opcional**: desactivado de forma predeterminada.
- **Programado**: cuando está habilitado, `memory-core` administra automáticamente una tarea Cron recurrente para un barrido completo de Dreaming.
- **Con umbrales**: las promociones deben superar controles de puntuación, frecuencia de recuperación y diversidad de consultas.
- **Revisable**: los resúmenes de fases y las entradas de diario se escriben en `DREAMS.md` para revisión humana.

Para el comportamiento por fase, señales de puntuación y detalles del diario de Dreaming, consulta [Dreaming](/es/concepts/dreaming).

## Relleno fundamentado y promoción en vivo

El sistema de Dreaming ahora tiene dos canales de revisión estrechamente relacionados:

- **Dreaming en vivo** trabaja desde el almacén de Dreaming a corto plazo bajo `memory/.dreams/` y es lo que usa la fase profunda normal al decidir qué puede graduarse a `MEMORY.md`.
- **Relleno fundamentado** lee notas históricas `memory/YYYY-MM-DD.md` como archivos diarios independientes y escribe salida de revisión estructurada en `DREAMS.md`.

El relleno fundamentado es útil cuando quieres reproducir notas antiguas e inspeccionar qué considera duradero el sistema sin editar manualmente `MEMORY.md`.

Cuando usas:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

los candidatos duraderos fundamentados no se promueven directamente. Se preparan en el mismo almacén de Dreaming a corto plazo que ya usa la fase profunda normal. Eso significa:

- `DREAMS.md` sigue siendo la superficie de revisión humana.
- el almacén a corto plazo sigue siendo la superficie de clasificación orientada a la máquina.
- `MEMORY.md` sigue siendo escrito solo por promoción profunda.

Si decides que la reproducción no fue útil, puedes eliminar los artefactos preparados sin tocar las entradas ordinarias del diario ni el estado normal de recuperación:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Lecturas adicionales

- [Motor de memoria incorporado](/es/concepts/memory-builtin): backend SQLite predeterminado.
- [Motor de memoria QMD](/es/concepts/memory-qmd): sidecar local-first avanzado.
- [Memoria Honcho](/es/concepts/memory-honcho): memoria entre sesiones nativa de IA.
- [Memory LanceDB](/es/plugins/memory-lancedb): Plugin respaldado por LanceDB con embeddings compatibles con OpenAI.
- [Memory Wiki](/es/plugins/memory-wiki): bóveda de conocimiento compilada y herramientas nativas de wiki.
- [Búsqueda de memoria](/es/concepts/memory-search): canalización de búsqueda, proveedores y ajuste.
- [Dreaming](/es/concepts/dreaming): promoción en segundo plano desde recuperación a corto plazo a memoria a largo plazo.
- [Referencia de configuración de memoria](/es/reference/memory-config): todas las opciones de configuración.
- [Compaction](/es/concepts/compaction): cómo interactúa Compaction con la memoria.

## Relacionado

- [Active memory](/es/concepts/active-memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Motor de memoria incorporado](/es/concepts/memory-builtin)
- [Memoria Honcho](/es/concepts/memory-honcho)
- [Memory LanceDB](/es/plugins/memory-lancedb)
- [Commitments](/es/concepts/commitments)
