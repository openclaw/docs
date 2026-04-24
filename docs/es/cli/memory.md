---
read_when:
    - Quieres indexar o buscar memoria semántica
    - Estás depurando la disponibilidad o indexación de memoria
    - Quieres promover la memoria a corto plazo recuperada a `MEMORY.md`
summary: Referencia de CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memoria
x-i18n:
    generated_at: "2026-04-24T05:23:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gestiona la indexación y la búsqueda de memoria semántica.
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

- `--agent <id>`: limita el alcance a un solo agente. Sin esto, estos comandos se ejecutan para cada agente configurado; si no hay ninguna lista de agentes configurada, recurren al agente predeterminado.
- `--verbose`: emite registros detallados durante las comprobaciones y la indexación.

`memory status`:

- `--deep`: comprueba la disponibilidad de vectores + embeddings.
- `--index`: ejecuta una reindexación si el almacén está sucio (implica `--deep`).
- `--fix`: repara bloqueos de recuperación obsoletos y normaliza los metadatos de promoción.
- `--json`: imprime salida JSON.

Si `memory status` muestra `Dreaming status: blocked`, el cron gestionado de Dreaming está habilitado, pero el heartbeat que lo impulsa no se está ejecutando para el agente predeterminado. Consulta [Dreaming nunca se ejecuta](/es/concepts/dreaming#dreaming-never-runs-status-shows-blocked) para ver las dos causas más comunes.

`memory index`:

- `--force`: fuerza una reindexación completa.

`memory search`:

- Entrada de consulta: pasa `[query]` posicional o `--query <text>`.
- Si se proporcionan ambos, `--query` tiene prioridad.
- Si no se proporciona ninguno, el comando termina con un error.
- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--max-results <n>`: limita el número de resultados devueltos.
- `--min-score <n>`: filtra las coincidencias de puntuación baja.
- `--json`: imprime resultados JSON.

`memory promote`:

Vista previa y aplicación de promociones de memoria a corto plazo.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- escribe promociones en `MEMORY.md` (predeterminado: solo vista previa).
- `--limit <n>` -- limita el número de candidatos mostrados.
- `--include-promoted` -- incluye entradas ya promocionadas en ciclos anteriores.

Opciones completas:

- Clasifica candidatos a corto plazo de `memory/YYYY-MM-DD.md` usando señales de promoción ponderadas (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa señales a corto plazo tanto de recuperaciones de memoria como de pasadas de ingestión diarias, además de señales de refuerzo de fase ligera/REM.
- Cuando Dreaming está habilitado, `memory-core` gestiona automáticamente un trabajo cron que ejecuta un barrido completo (`light -> REM -> deep`) en segundo plano (no hace falta `openclaw cron add` manual).
- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--limit <n>`: número máximo de candidatos a devolver/aplicar.
- `--min-score <n>`: puntuación mínima ponderada de promoción.
- `--min-recall-count <n>`: recuento mínimo de recuperación necesario para un candidato.
- `--min-unique-queries <n>`: número mínimo de consultas distintas necesario para un candidato.
- `--apply`: agrega los candidatos seleccionados a `MEMORY.md` y los marca como promocionados.
- `--include-promoted`: incluye en la salida candidatos ya promocionados.
- `--json`: imprime salida JSON.

`memory promote-explain`:

Explica un candidato de promoción específico y el desglose de su puntuación.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: clave de candidato, fragmento de ruta o fragmento de snippet para buscar.
- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos ya promocionados.
- `--json`: imprime salida JSON.

`memory rem-harness`:

Obtiene una vista previa de reflexiones REM, verdades candidatas y salida de promoción profunda sin escribir nada.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita el alcance a un solo agente (predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos profundos ya promocionados.
- `--json`: imprime salida JSON.

## Dreaming

Dreaming es el sistema en segundo plano de consolidación de memoria con tres fases
cooperativas: **light** (clasificar/preparar material a corto plazo), **deep** (promover hechos
duraderos a `MEMORY.md`) y **REM** (reflexionar y destacar temas).

- Habilítalo con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Actívalo o desactívalo desde el chat con `/dreaming on|off` (o inspecciónalo con `/dreaming status`).
- Dreaming se ejecuta con una programación gestionada de un único barrido (`dreaming.frequency`) y ejecuta las fases en orden: light, REM, deep.
- Solo la fase deep escribe memoria duradera en `MEMORY.md`.
- La salida legible por personas de cada fase y las entradas de diario se escriben en `DREAMS.md` (o en `dreams.md` existente), con informes opcionales por fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La clasificación usa señales ponderadas: frecuencia de recuperación, relevancia de recuperación, diversidad de consultas, recencia temporal, consolidación entre días y riqueza conceptual derivada.
- La promoción vuelve a leer la nota diaria activa antes de escribir en `MEMORY.md`, de modo que los snippets a corto plazo editados o eliminados no se promocionen desde instantáneas obsoletas del almacén de recuperación.
- Las ejecuciones programadas y manuales de `memory promote` comparten los mismos valores predeterminados de la fase deep, salvo que pases sobrescrituras de umbral por CLI.
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
- Si los campos de clave de API remota de memoria efectivamente activos están configurados como SecretRef, el comando resuelve esos valores a partir de la instantánea activa de gateway. Si gateway no está disponible, el comando falla rápidamente.
- Nota sobre desfase de versión de Gateway: esta ruta de comando requiere un gateway que admita `secrets.resolve`; los gateways más antiguos devuelven un error de método desconocido.
- Ajusta la cadencia del barrido programado con `dreaming.frequency`. La política de promoción deep es por lo demás interna; usa indicadores de CLI en `memory promote` cuando necesites sobrescrituras manuales puntuales.
- `memory rem-harness --path <file-or-dir> --grounded` obtiene una vista previa basada en `What Happened`, `Reflections` y `Possible Lasting Updates` a partir de notas diarias históricas sin escribir nada.
- `memory rem-backfill --path <file-or-dir>` escribe entradas de diario basadas y reversibles en `DREAMS.md` para revisión en la interfaz.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` también siembra candidatos duraderos basados en el almacén activo de promoción a corto plazo para que la fase deep normal pueda clasificarlos.
- `memory rem-backfill --rollback` elimina entradas de diario basadas escritas previamente, y `memory rem-backfill --rollback-short-term` elimina candidatos a corto plazo basados preparados previamente.
- Consulta [Dreaming](/es/concepts/dreaming) para ver descripciones completas de las fases y la referencia de configuración.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Descripción general de Memoria](/es/concepts/memory)
