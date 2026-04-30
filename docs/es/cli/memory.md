---
read_when:
    - Quieres indexar o buscar en la memoria semántica
    - Estás depurando la disponibilidad de memoria o la indexación
    - Quieres promover la memoria a corto plazo recuperada a `MEMORY.md`
summary: Referencia de CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memoria
x-i18n:
    generated_at: "2026-04-30T05:34:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestiona la indexación y búsqueda de memoria semántica.
Proporcionado por el plugin Active Memory (predeterminado: `memory-core`; configura `plugins.slots.memory = "none"` para desactivarlo).

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

- `--deep`: sondea la disponibilidad de vectores e incrustaciones. `memory status` sin opciones se mantiene rápido y no ejecuta un ping de incrustación en vivo. `searchMode: "search"` léxico de QMD omite los sondeos vectoriales semánticos y el mantenimiento de incrustaciones incluso con `--deep`.
- `--index`: ejecuta una reindexación si el almacén está sucio (implica `--deep`).
- `--fix`: repara bloqueos de recuperación obsoletos y normaliza metadatos de promoción.
- `--json`: imprime salida JSON.

Si `memory status` muestra `Dreaming status: blocked`, el cron gestionado de Dreaming está habilitado, pero el heartbeat que lo impulsa no se está activando para el agente predeterminado. Consulta [Dreaming nunca se ejecuta](/es/concepts/dreaming#dreaming-never-runs-status-shows-blocked) para conocer las dos causas comunes.

`memory index`:

- `--force`: fuerza una reindexación completa.

`memory search`:

- Entrada de consulta: pasa `[query]` posicional o `--query <text>`.
- Si se proporcionan ambos, `--query` tiene prioridad.
- Si no se proporciona ninguno, el comando termina con un error.
- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--max-results <n>`: limita la cantidad de resultados devueltos.
- `--min-score <n>`: filtra coincidencias con puntuación baja.
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

- Clasifica candidatos a corto plazo de `memory/YYYY-MM-DD.md` mediante señales de promoción ponderadas (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa señales a corto plazo tanto de recuperaciones de memoria como de pasadas de ingesta diaria, además de señales de refuerzo de fases ligera/REM.
- Cuando Dreaming está habilitado, `memory-core` gestiona automáticamente un trabajo cron que ejecuta un barrido completo (`light -> REM -> deep`) en segundo plano (no se requiere `openclaw cron add` manual).
- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--limit <n>`: cantidad máxima de candidatos que devolver/aplicar.
- `--min-score <n>`: puntuación mínima ponderada de promoción.
- `--min-recall-count <n>`: cantidad mínima de recuperaciones requerida para un candidato.
- `--min-unique-queries <n>`: cantidad mínima de consultas distintas requerida para un candidato.
- `--apply`: agrega los candidatos seleccionados a `MEMORY.md` y los marca como promovidos.
- `--include-promoted`: incluye candidatos ya promovidos en la salida.
- `--json`: imprime salida JSON.

`memory promote-explain`:

Explica un candidato de promoción específico y el desglose de su puntuación.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: clave de candidato, fragmento de ruta o fragmento de texto para buscar.
- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos ya promovidos.
- `--json`: imprime salida JSON.

`memory rem-harness`:

Previsualiza reflexiones REM, verdades candidatas y salida de promoción profunda sin escribir nada.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos profundos ya promovidos.
- `--json`: imprime salida JSON.

## Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano con tres fases
cooperativas: **light** (ordenar/preparar material a corto plazo), **deep** (promover hechos duraderos
a `MEMORY.md`) y **REM** (reflexionar y exponer temas).

- Habilítalo con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Actívalo o desactívalo desde el chat con `/dreaming on|off` (o inspecciónalo con `/dreaming status`).
- Dreaming se ejecuta en un calendario de barrido gestionado (`dreaming.frequency`) y ejecuta las fases en orden: light, REM, deep.
- Solo la fase deep escribe memoria duradera en `MEMORY.md`.
- La salida de fase legible por humanos y las entradas de diario se escriben en `DREAMS.md` (o en el `dreams.md` existente), con informes opcionales por fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La clasificación usa señales ponderadas: frecuencia de recuperación, relevancia de recuperación, diversidad de consultas, recencia temporal, consolidación entre días y riqueza conceptual derivada.
- La promoción vuelve a leer la nota diaria en vivo antes de escribir en `MEMORY.md`, por lo que los fragmentos a corto plazo editados o eliminados no se promueven desde instantáneas obsoletas del almacén de recuperación.
- Las ejecuciones programadas y manuales de `memory promote` comparten los mismos valores predeterminados de la fase deep, salvo que pases anulaciones de umbral por CLI.
- Las ejecuciones automáticas se distribuyen entre los espacios de trabajo de memoria configurados.

Programación predeterminada:

- **Cadencia de barrido**: `dreaming.frequency = 0 3 * * *`
- **Umbrales deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` imprime detalles por fase (proveedor, modelo, fuentes, actividad de lotes).
- `memory status` incluye cualquier ruta adicional configurada mediante `memorySearch.extraPaths`.
- Si los campos de clave de API remota de memoria activa efectiva están configurados como SecretRefs, el comando resuelve esos valores desde la instantánea activa del Gateway. Si el Gateway no está disponible, el comando falla rápidamente.
- Nota sobre desfase de versiones del Gateway: esta ruta de comando requiere un gateway que admita `secrets.resolve`; los gateways antiguos devuelven un error de método desconocido.
- Ajusta la cadencia de barrido programado con `dreaming.frequency`. La política de promoción deep es interna en lo demás; usa flags de CLI en `memory promote` cuando necesites anulaciones manuales puntuales.
- `memory rem-harness --path <file-or-dir> --grounded` previsualiza `What Happened`, `Reflections` y `Possible Lasting Updates` fundamentados a partir de notas diarias históricas sin escribir nada.
- `memory rem-backfill --path <file-or-dir>` escribe entradas de diario fundamentadas reversibles en `DREAMS.md` para revisión en la interfaz de usuario.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` también inicializa candidatos duraderos fundamentados en el almacén de promoción a corto plazo en vivo para que la fase deep normal pueda clasificarlos.
- `memory rem-backfill --rollback` elimina entradas de diario fundamentadas escritas previamente, y `memory rem-backfill --rollback-short-term` elimina candidatos a corto plazo fundamentados preparados previamente.
- Consulta [Dreaming](/es/concepts/dreaming) para ver descripciones completas de las fases y la referencia de configuración.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de memoria](/es/concepts/memory)
