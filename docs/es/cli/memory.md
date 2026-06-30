---
read_when:
    - Quieres indexar o buscar en la memoria semántica
    - Estás depurando la disponibilidad de memoria o la indexación
    - Quieres promover la memoria a corto plazo recuperada a `MEMORY.md`
summary: Referencia de la CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memoria
x-i18n:
    generated_at: "2026-06-30T13:47:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestiona la indexación y búsqueda de memoria semántica.
Lo proporciona el plugin incluido `memory-core`. El comando está disponible cuando
`plugins.slots.memory` selecciona `memory-core` (el valor predeterminado); otros plugins de memoria
exponen sus propios espacios de nombres de CLI.

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
- `--verbose`: emite registros detallados durante las comprobaciones y la indexación.

`memory status`:

- `--deep`: comprueba la preparación del almacén vectorial local, la preparación del proveedor de embeddings y la preparación de la búsqueda vectorial semántica. `memory status` simple se mantiene rápido y no ejecuta embeddings en vivo ni descubrimiento de proveedores; un estado desconocido del almacén vectorial o del vector semántico significa que no se comprobó en ese comando. `searchMode: "search"` léxico de QMD omite las comprobaciones de vectores semánticos y el mantenimiento de embeddings incluso con `--deep`.
- `--index`: ejecuta una reindexación si el almacén está sucio (implica `--deep`).
- `--fix`: repara bloqueos de recuperación obsoletos y normaliza los metadatos de promoción.
- `--json`: imprime salida JSON.

Si `memory status` muestra `Dreaming status: blocked`, el cron de Dreaming gestionado está habilitado, pero el heartbeat que lo impulsa no se está activando para el agente predeterminado. Consulta [Dreaming nunca se ejecuta](/es/concepts/dreaming#dreaming-never-runs-status-shows-blocked) para conocer las dos causas comunes.

`memory index`:

- `--force`: fuerza una reindexación completa.

`memory search`:

- Entrada de consulta: pasa `[query]` posicional o `--query <text>`.
- Si se proporcionan ambos, `--query` tiene prioridad.
- Si no se proporciona ninguno, el comando sale con un error.
- `--agent <id>`: limita el alcance a un solo agente (valor predeterminado: el agente predeterminado).
- `--max-results <n>`: limita el número de resultados devueltos.
- `--min-score <n>`: filtra las coincidencias con puntuación baja.
- `--json`: imprime resultados JSON.

`memory promote`:

Previsualiza y aplica promociones de memoria a corto plazo.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- escribe promociones en `MEMORY.md` (valor predeterminado: solo previsualización).
- `--limit <n>` -- limita el número de candidatos mostrados.
- `--include-promoted` -- incluye entradas ya promovidas en ciclos anteriores.

Opciones completas:

- Clasifica candidatos a corto plazo de `memory/YYYY-MM-DD.md` usando señales de promoción ponderadas (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa señales a corto plazo tanto de recuperaciones de memoria como de pasadas de ingesta diaria, además de señales de refuerzo de fases ligera/REM.
- Cuando Dreaming está habilitado, `memory-core` gestiona automáticamente un trabajo cron que ejecuta un barrido completo (`light -> REM -> deep`) en segundo plano (no se requiere `openclaw cron add` manual).
- `--agent <id>`: limita el alcance a un solo agente (valor predeterminado: el agente predeterminado).
- `--limit <n>`: cantidad máxima de candidatos que devolver o aplicar.
- `--min-score <n>`: puntuación mínima ponderada de promoción.
- `--min-recall-count <n>`: recuento mínimo de recuperaciones requerido para un candidato.
- `--min-unique-queries <n>`: recuento mínimo de consultas distintas requerido para un candidato.
- `--apply`: agrega los candidatos seleccionados a `MEMORY.md` y los marca como promovidos.
- `--include-promoted`: incluye candidatos ya promovidos en la salida.
- `--json`: imprime salida JSON.

`memory promote-explain`:

Explica un candidato de promoción específico y el desglose de su puntuación.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: clave de candidato, fragmento de ruta o fragmento de texto para buscar.
- `--agent <id>`: limita el alcance a un solo agente (valor predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos ya promovidos.
- `--json`: imprime salida JSON.

`memory rem-harness`:

Previsualiza reflexiones REM, verdades candidatas y salida de promoción profunda sin escribir nada.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita el alcance a un solo agente (valor predeterminado: el agente predeterminado).
- `--include-promoted`: incluye candidatos profundos ya promovidos.
- `--json`: imprime salida JSON.

## Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano con tres
fases cooperativas: **light** (ordenar/preparar material a corto plazo), **deep** (promover hechos duraderos
a `MEMORY.md`) y **REM** (reflexionar y sacar temas a la superficie).

- Habilítalo con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Actívalo o desactívalo desde el chat con `/dreaming on|off` (o inspecciónalo con `/dreaming status`).
  Los llamadores de canal deben ser propietarios para cambiar la configuración; los clientes de Gateway necesitan
  `operator.admin`. El estado y la ayuda de solo lectura siguen disponibles para remitentes de comandos autorizados.
- Dreaming se ejecuta en un programa de barrido gestionado (`dreaming.frequency`) y ejecuta las fases en orden: light, REM, deep.
- Solo la fase deep escribe memoria duradera en `MEMORY.md`.
- La salida legible por humanos de las fases y las entradas de diario se escriben en `DREAMS.md` (o en el `dreams.md` existente), con informes opcionales por fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La clasificación usa señales ponderadas: frecuencia de recuperación, relevancia de recuperación, diversidad de consultas, recencia temporal, consolidación entre días y riqueza conceptual derivada.
- La promoción vuelve a leer la nota diaria en vivo antes de escribir en `MEMORY.md`, por lo que los fragmentos a corto plazo editados o eliminados no se promueven desde instantáneas obsoletas del almacén de recuperación.
- Las ejecuciones programadas y manuales de `memory promote` comparten los mismos valores predeterminados de la fase deep, salvo que pases anulaciones de umbral por CLI.
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
- Si los campos de clave de API remota de Active Memory efectivamente activa están configurados como SecretRefs, el comando resuelve esos valores desde la instantánea activa de Gateway. Si Gateway no está disponible, el comando falla rápidamente.
- Nota sobre desviación de versión de Gateway: esta ruta de comando requiere un Gateway que admita `secrets.resolve`; los Gateways más antiguos devuelven un error de método desconocido.
- Ajusta la cadencia de barrido programada con `dreaming.frequency`. La política de promoción deep, por lo demás, es interna, excepto por `dreaming.phases.deep.maxPromotedSnippetTokens`, que limita la longitud del fragmento promovido mientras mantiene visible la procedencia. Usa marcas de CLI en `memory promote` cuando necesites anulaciones manuales puntuales de umbral.
- `memory rem-harness --path <file-or-dir> --grounded` previsualiza `What Happened`, `Reflections` y `Possible Lasting Updates` fundamentados desde notas diarias históricas sin escribir nada.
- `memory rem-backfill --path <file-or-dir>` escribe entradas de diario fundamentadas y reversibles en `DREAMS.md` para revisión en la UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` también siembra candidatos duraderos fundamentados en el almacén de promoción a corto plazo en vivo para que la fase deep normal pueda clasificarlos.
- `memory rem-backfill --rollback` elimina entradas de diario fundamentadas escritas previamente, y `memory rem-backfill --rollback-short-term` elimina candidatos a corto plazo fundamentados preparados previamente.
- Consulta [Dreaming](/es/concepts/dreaming) para ver descripciones completas de fases y la referencia de configuración.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de memoria](/es/concepts/memory)
