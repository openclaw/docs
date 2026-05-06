---
read_when:
    - Desea indexar o buscar en la memoria semántica
    - Estás depurando la disponibilidad de la memoria o la indexación
    - Quieres promover la memoria a corto plazo recuperada a `MEMORY.md`
summary: Referencia de CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memoria
x-i18n:
    generated_at: "2026-05-06T17:53:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7137f8a9529095204699de5fee7a0baf5d5a377792dc93b4059145d0eefab737
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestiona la indexación y búsqueda de memoria semántica.
Proporcionado por el Plugin de Active Memory (predeterminado: `memory-core`; define `plugins.slots.memory = "none"` para deshabilitarlo).

Relacionado:

- Concepto de memoria: [Memoria](/es/concepts/memory)
- Wiki de memoria: [Wiki de memoria](/es/plugins/memory-wiki)
- CLI de wiki: [wiki](/es/cli/wiki)
- Plugins: [Plugins](/es/tools/plugin)

## Ejemplos

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opciones

`memory status` y `memory index`:

- `--agent <id>`: limita el alcance a un solo agente. Sin esta opción, estos comandos se ejecutan para cada agente configurado; si no hay ninguna lista de agentes configurada, recurren al agente predeterminado.
- `--verbose`: emite registros detallados durante los sondeos y la indexación.

`memory status`:

- `--deep`: sondea la preparación del almacén vectorial local, la preparación del proveedor de embeddings y la preparación de la búsqueda vectorial semántica. `memory status` simple se mantiene rápido y no ejecuta trabajo de embeddings en vivo ni de descubrimiento de proveedores; un estado desconocido del almacén vectorial o del vector semántico significa que no se sondeó en ese comando. El `searchMode: "search"` léxico de QMD omite los sondeos de vectores semánticos y el mantenimiento de embeddings incluso con `--deep`.
- `--index`: ejecuta una reindexación si el almacén está sucio (implica `--deep`).
- `--fix`: repara bloqueos de recuperación obsoletos y normaliza los metadatos de promoción.
- `--json`: imprime la salida JSON.

Si `memory status` muestra `Dreaming status: blocked`, el cron gestionado de Dreaming está habilitado, pero el Heartbeat que lo impulsa no se está activando para el agente predeterminado. Consulta [Dreaming nunca se ejecuta](/es/concepts/dreaming#dreaming-never-runs-status-shows-blocked) para ver las dos causas comunes.

`memory index`:

- `--force`: fuerza una reindexación completa.

`memory search`:

- Entrada de consulta: pasa `[query]` posicional o `--query <text>`.
- Si se proporcionan ambos, `--query` tiene prioridad.
- Si no se proporciona ninguno, el comando sale con un error.
- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--max-results <n>`: limita la cantidad de resultados devueltos.
- `--min-score <n>`: filtra las coincidencias con puntuación baja.
- `--json`: imprime resultados JSON.

`memory promote`:

Previsualiza y aplica promociones de memoria a corto plazo.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- escribe promociones en `MEMORY.md` (predeterminado: solo vista previa).
- `--limit <n>` -- limita la cantidad de candidatos mostrados.
- `--include-promoted` -- incluye entradas ya promovidas en ciclos anteriores.

Opciones completas:

- Clasifica candidatos a corto plazo desde `memory/YYYY-MM-DD.md` usando señales ponderadas de promoción (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa señales a corto plazo tanto de recuperaciones de memoria como de pasadas de ingestión diaria, además de señales de refuerzo de fases ligera/REM.
- Cuando Dreaming está habilitado, `memory-core` gestiona automáticamente una tarea Cron que ejecuta un barrido completo (`light -> REM -> deep`) en segundo plano (no se requiere `openclaw cron add` manual).
- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--limit <n>`: cantidad máxima de candidatos para devolver/aplicar.
- `--min-score <n>`: puntuación ponderada mínima de promoción.
- `--min-recall-count <n>`: cantidad mínima de recuperaciones requerida para un candidato.
- `--min-unique-queries <n>`: cantidad mínima de consultas distintas requerida para un candidato.
- `--apply`: añade los candidatos seleccionados a `MEMORY.md` y los marca como promovidos.
- `--include-promoted`: incluye candidatos ya promovidos en la salida.
- `--json`: imprime la salida JSON.

`memory promote-explain`:

Explica un candidato específico de promoción y el desglose de su puntuación.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: clave de candidato, fragmento de ruta o fragmento de texto para buscar.
- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos ya promovidos.
- `--json`: imprime la salida JSON.

`memory rem-harness`:

Previsualiza reflexiones REM, verdades candidatas y salida de promoción profunda sin escribir nada.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos profundos ya promovidos.
- `--json`: imprime la salida JSON.

## Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano con tres fases cooperativas: **ligera** (ordenar/preparar material a corto plazo), **profunda** (promover hechos duraderos a `MEMORY.md`) y **REM** (reflexionar y sacar temas a la superficie).

- Habilítalo con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Actívalo o desactívalo desde el chat con `/dreaming on|off` (o inspecciónalo con `/dreaming status`).
- Dreaming se ejecuta en una programación de barrido gestionada (`dreaming.frequency`) y ejecuta las fases en orden: ligera, REM, profunda.
- Solo la fase profunda escribe memoria duradera en `MEMORY.md`.
- La salida de fase legible por humanos y las entradas de diario se escriben en `DREAMS.md` (o en el `dreams.md` existente), con informes opcionales por fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La clasificación usa señales ponderadas: frecuencia de recuperación, relevancia de recuperación, diversidad de consultas, actualidad temporal, consolidación entre días y riqueza conceptual derivada.
- La promoción vuelve a leer la nota diaria en vivo antes de escribir en `MEMORY.md`, por lo que los fragmentos a corto plazo editados o eliminados no se promueven desde instantáneas obsoletas del almacén de recuperación.
- Las ejecuciones programadas y manuales de `memory promote` comparten los mismos valores predeterminados de la fase profunda, a menos que pases reemplazos de umbral por CLI.
- Las ejecuciones automáticas se distribuyen entre los espacios de trabajo de memoria configurados.

Programación predeterminada:

- **Cadencia de barrido**: `dreaming.frequency = 0 3 * * *`
- **Umbrales profundos**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Ejemplo:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Notas:

- `memory index --verbose` imprime detalles por fase (proveedor, modelo, fuentes, actividad por lotes).
- `memory status` incluye cualquier ruta adicional configurada mediante `memorySearch.extraPaths`.
- Si los campos de claves de API remota de Active Memory efectivamente activos están configurados como SecretRefs, el comando resuelve esos valores desde la instantánea activa del Gateway. Si el Gateway no está disponible, el comando falla rápidamente.
- Nota sobre desfase de versión del Gateway: esta ruta de comando requiere un Gateway compatible con `secrets.resolve`; los gateways más antiguos devuelven un error de método desconocido.
- Ajusta la cadencia del barrido programado con `dreaming.frequency`. La política de promoción profunda es interna en otros aspectos; usa marcas de CLI en `memory promote` cuando necesites reemplazos manuales puntuales.
- `memory rem-harness --path <file-or-dir> --grounded` previsualiza `What Happened`, `Reflections` y `Possible Lasting Updates` fundamentados desde notas diarias históricas sin escribir nada.
- `memory rem-backfill --path <file-or-dir>` escribe entradas de diario fundamentadas reversibles en `DREAMS.md` para revisión en la UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` también inicializa candidatos duraderos fundamentados en el almacén activo de promoción a corto plazo para que la fase profunda normal pueda clasificarlos.
- `memory rem-backfill --rollback` elimina entradas de diario fundamentadas escritas previamente, y `memory rem-backfill --rollback-short-term` elimina candidatos fundamentados a corto plazo preparados previamente.
- Consulta [Dreaming](/es/concepts/dreaming) para ver descripciones completas de las fases y la referencia de configuración.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de memoria](/es/concepts/memory)
