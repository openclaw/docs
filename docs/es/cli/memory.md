---
read_when:
    - Quieres indexar o buscar memoria semántica
    - Estás depurando la disponibilidad o indexación de memoria
    - Quieres promover la memoria a corto plazo recuperada a `MEMORY.md`
summary: Referencia de CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: memoria
x-i18n:
    generated_at: "2026-04-23T14:01:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gestiona la indexación y búsqueda de memoria semántica.
Proporcionado por el Plugin de memoria activo (predeterminado: `memory-core`; establece `plugins.slots.memory = "none"` para desactivarlo).

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

- `--agent <id>`: limita a un solo agente. Sin esto, estos comandos se ejecutan para cada agente configurado; si no hay ninguna lista de agentes configurada, recurren al agente predeterminado.
- `--verbose`: emite registros detallados durante las sondas y la indexación.

`memory status`:

- `--deep`: comprueba la disponibilidad de vectores + embeddings.
- `--index`: ejecuta una reindexación si el almacén está sucio (implica `--deep`).
- `--fix`: repara bloqueos de recuperación obsoletos y normaliza los metadatos de promoción.
- `--json`: imprime salida JSON.

Si `memory status` muestra `Dreaming status: blocked`, el Cron administrado de Dreaming está habilitado, pero el Heartbeat que lo impulsa no se está ejecutando para el agente predeterminado. Consulta [Dreaming nunca se ejecuta](/es/concepts/dreaming#dreaming-never-runs-status-shows-blocked) para ver las dos causas habituales.

`memory index`:

- `--force`: fuerza una reindexación completa.

`memory search`:

- Entrada de consulta: pasa `[query]` posicional o `--query <text>`.
- Si se proporcionan ambos, `--query` tiene prioridad.
- Si no se proporciona ninguno, el comando sale con un error.
- `--agent <id>`: limita a un solo agente (predeterminado: el agente predeterminado).
- `--max-results <n>`: limita el número de resultados devueltos.
- `--min-score <n>`: filtra coincidencias con puntuación baja.
- `--json`: imprime resultados JSON.

`memory promote`:

Previsualiza y aplica promociones de memoria a corto plazo.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- escribe promociones en `MEMORY.md` (predeterminado: solo vista previa).
- `--limit <n>` -- limita el número de candidatos mostrados.
- `--include-promoted` -- incluye entradas ya promocionadas en ciclos anteriores.

Opciones completas:

- Clasifica candidatos a corto plazo de `memory/YYYY-MM-DD.md` usando señales de promoción ponderadas (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa señales a corto plazo tanto de recuperaciones de memoria como de pasadas de ingesta diaria, además de señales de refuerzo de fase ligera/REM.
- Cuando Dreaming está habilitado, `memory-core` administra automáticamente un trabajo de Cron que ejecuta una barrida completa (`light -> REM -> deep`) en segundo plano (no se requiere `openclaw cron add` manual).
- `--agent <id>`: limita a un solo agente (predeterminado: el agente predeterminado).
- `--limit <n>`: máximo de candidatos que se devuelven/aplican.
- `--min-score <n>`: puntuación mínima de promoción ponderada.
- `--min-recall-count <n>`: recuento mínimo de recuperación requerido para un candidato.
- `--min-unique-queries <n>`: recuento mínimo de consultas distintas requerido para un candidato.
- `--apply`: añade los candidatos seleccionados a `MEMORY.md` y los marca como promocionados.
- `--include-promoted`: incluye en la salida candidatos ya promocionados.
- `--json`: imprime salida JSON.

`memory promote-explain`:

Explica un candidato específico de promoción y el desglose de su puntuación.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: clave del candidato, fragmento de ruta o fragmento de snippet para buscar.
- `--agent <id>`: limita a un solo agente (predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos ya promocionados.
- `--json`: imprime salida JSON.

`memory rem-harness`:

Previsualiza reflexiones REM, verdades candidatas y la salida de promoción profunda sin escribir nada.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita a un solo agente (predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos profundos ya promocionados.
- `--json`: imprime salida JSON.

## Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano con tres fases
cooperativas: **light** (ordena/prepara material a corto plazo), **deep** (promueve hechos
duraderos a `MEMORY.md`) y **REM** (reflexiona y destaca temas).

- Habilítalo con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Actívalo o desactívalo desde el chat con `/dreaming on|off` (o inspecciónalo con `/dreaming status`).
- Dreaming se ejecuta con una programación administrada de barrido (`dreaming.frequency`) y ejecuta las fases en orden: light, REM, deep.
- Solo la fase deep escribe memoria duradera en `MEMORY.md`.
- La salida legible por humanos de cada fase y las entradas de diario se escriben en `DREAMS.md` (o en `dreams.md` si ya existe), con informes opcionales por fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La clasificación usa señales ponderadas: frecuencia de recuperación, relevancia de recuperación, diversidad de consultas, recencia temporal, consolidación entre días y riqueza conceptual derivada.
- La promoción vuelve a leer la nota diaria activa antes de escribir en `MEMORY.md`, por lo que los snippets a corto plazo editados o eliminados no se promocionan desde instantáneas obsoletas del almacén de recuperación.
- Las ejecuciones programadas y manuales de `memory promote` comparten los mismos valores predeterminados de la fase deep, a menos que pases sobrescrituras de umbral de CLI.
- Las ejecuciones automáticas se distribuyen entre los espacios de trabajo de memoria configurados.

Programación predeterminada:

- **Cadencia de barrido**: `dreaming.frequency = 0 3 * * *`
- **Umbrales de deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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
- Si los campos de clave de API remota de Active Memory efectivamente activos están configurados como SecretRefs, el comando resuelve esos valores desde la instantánea activa del Gateway. Si el Gateway no está disponible, el comando falla rápidamente.
- Nota sobre desajuste de versión del Gateway: esta ruta de comandos requiere un Gateway compatible con `secrets.resolve`; los Gateway más antiguos devuelven un error de método desconocido.
- Ajusta la cadencia de barrido programada con `dreaming.frequency`. En lo demás, la política de promoción deep es interna; usa indicadores de CLI en `memory promote` cuando necesites sobrescrituras manuales puntuales.
- `memory rem-harness --path <file-or-dir> --grounded` previsualiza con base real `What Happened`, `Reflections` y `Possible Lasting Updates` a partir de notas diarias históricas sin escribir nada.
- `memory rem-backfill --path <file-or-dir>` escribe entradas reversibles de diario con base real en `DREAMS.md` para revisión en la UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` también siembra candidatos duraderos con base real en el almacén activo de promoción a corto plazo para que la fase deep normal pueda clasificarlos.
- `memory rem-backfill --rollback` elimina entradas de diario con base real escritas previamente, y `memory rem-backfill --rollback-short-term` elimina candidatos con base real a corto plazo preparados previamente.
- Consulta [Dreaming](/es/concepts/dreaming) para ver descripciones completas de las fases y la referencia de configuración.
