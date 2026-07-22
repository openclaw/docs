---
read_when:
    - Se desea indexar o buscar en la memoria semántica
    - Estás depurando la disponibilidad o la indexación de la memoria
    - Quieres promover la memoria a corto plazo recuperada a `MEMORY.md`
summary: Referencia de la CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness/rem-backfill)
title: Memoria
x-i18n:
    generated_at: "2026-07-22T10:29:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6354745f8622ee80345325fa6f3e7d6c5f280cb63b9cdb100a766cf9e300af59
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestiona la indexación y búsqueda de memoria semántica, así como su promoción a `MEMORY.md`.
Lo proporciona el plugin `memory-core` incluido y está disponible cuando
`plugins.slots.memory` selecciona `memory-core` (el valor predeterminado). Otros plugins de memoria
exponen sus propios espacios de nombres de la CLI.

Relacionado: concepto de [memoria](/es/concepts/memory), [Dreaming](/es/concepts/dreaming),
[referencia de configuración de memoria](/es/reference/memory-config), [wiki de memoria](/es/plugins/memory-wiki),
[wiki](/es/cli/wiki), [plugins](/es/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Sin `--agent`, se ejecuta para cada agente de `agents.entries`; si no se configura ninguna lista de agentes,
recurre al agente predeterminado.

| Indicador        | Efecto                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Comprueba la disponibilidad del almacén vectorial, el proveedor de embeddings y la búsqueda semántica (implica llamadas adicionales al proveedor). El comando `memory status` básico sigue siendo rápido y omite esta comprobación; un estado vectorial o semántico desconocido significa que no se comprobó. El `searchMode: "search"` léxico de QMD siempre omite las comprobaciones de vectores semánticos, incluso con `--deep`. |
| `--index`   | Vuelve a indexar si el almacén está desactualizado. Implica `--deep`.                                                                                                                                                                                                                                                          |
| `--fix`     | Repara los bloqueos de recuperación obsoletos y normaliza los metadatos de promoción.                                                                                                                                                                                                                                               |
| `--json`    | Imprime JSON.                                                                                                                                                                                                                                                                                               |
| `--verbose` | Emite registros detallados de cada fase.                                                                                                                                                                                                                                                                             |

Si la línea `Dreaming` permanece como `off` incluso con `dreaming.enabled: true`, o
parece que los barridos programados nunca se ejecutan, el Cron administrado de Dreaming depende de que
se active el Heartbeat del agente predeterminado para iniciar la reconciliación. Consulta
[Dreaming](/es/concepts/dreaming) para obtener información sobre la programación.

El estado también enumera las rutas de búsqueda adicionales de `memory.search.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

Utiliza el mismo ámbito por agente que `status`. `--force` ejecuta una reindexación completa en lugar de
una incremental. `--verbose` imprime el proveedor, el modelo, las fuentes y
los detalles de las rutas adicionales de cada agente antes de mostrar el progreso de la indexación.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Consulta: `[query]` posicional o `--query <text>`. Si se establecen ambos, prevalece `--query`.
  Si no se establece ninguno, el comando genera un error.
- `--agent <id>`: el valor predeterminado es el agente predeterminado (no la lista completa de agentes).
- `--max-results <n>`: limita la cantidad de resultados (entero positivo).
- `--min-score <n>`: excluye las coincidencias con una puntuación inferior a esta.

## `memory promote`

Clasifica los candidatos a corto plazo de `memory/YYYY-MM-DD.md` y, opcionalmente, añade
las entradas mejor clasificadas a `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Indicador                       | Valor predeterminado      | Efecto                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | Número máximo de candidatos que se devolverán o aplicarán.                                   |
| `--min-score <n>`          | `0.75`       | Puntuación ponderada mínima de promoción.                                 |
| `--min-recall-count <n>`   | `3`          | Número mínimo de recuperaciones requerido.                                    |
| `--min-unique-queries <n>` | `2`          | Número mínimo de consultas distintas requerido.                            |
| `--apply`                  | solo vista previa | Añade los candidatos seleccionados a `MEMORY.md` y los marca como promocionados. |
| `--include-promoted`       |              | Incluye los candidatos ya promocionados en ciclos anteriores.           |
| `--json`                   |              | Imprime JSON.                                                       |

Estos valores predeterminados de la CLI difieren de los umbrales de la fase profunda
del barrido programado de Dreaming (consulta [Dreaming](#dreaming) más adelante); especifica indicadores explícitos para reproducir
el comportamiento del barrido en una ejecución manual puntual.

Señales de clasificación: frecuencia de recuperación, relevancia de la recuperación, diversidad de consultas,
proximidad temporal, consolidación entre días y riqueza de conceptos derivados, obtenidas
tanto de las recuperaciones de memoria como de las pasadas de ingesta diaria, además de un ligero refuerzo
de las fases ligera/REM para las revisitas repetidas de Dreaming. Antes de escribir, la promoción
vuelve a leer la nota diaria activa, por lo que se respetan las modificaciones o eliminaciones de fragmentos
a corto plazo realizadas después de la clasificación, en lugar de promoverlos desde una instantánea obsoleta.

## `memory promote-explain`

Explica el desglose de la puntuación de un candidato de promoción.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` busca coincidencias con la clave de un candidato (exactas o por subcadena), su ruta o el texto
del fragmento.

## `memory rem-harness`

Muestra una vista previa de las reflexiones REM, las verdades candidatas y el resultado de promoción de la fase profunda
sin escribir nada.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: inicializa el entorno de pruebas a partir de archivos diarios históricos de `YYYY-MM-DD.md`
  en lugar del espacio de trabajo activo.
- `--grounded`: también genera una vista previa fundamentada de `What Happened` / `Reflections` /
  `Possible Lasting Updates` a partir de las notas históricas.

## `memory rem-backfill`

Escribe resúmenes REM históricos fundamentados en `DREAMS.md` para revisarlos en la interfaz.
Es reversible.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: obligatorio a menos que se establezca `--rollback`/`--rollback-short-term`.
  Archivos históricos de memoria diaria o directorio que se usarán para el relleno.
- `--stage-short-term`: también incorpora candidatos duraderos fundamentados al almacén activo
  de promoción a corto plazo para que la fase profunda normal pueda clasificarlos.
- `--rollback`: elimina las entradas fundamentadas del diario escritas anteriormente en
  `DREAMS.md`.
- `--rollback-short-term`: elimina los candidatos fundamentados a corto plazo
  preparados anteriormente.

## Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano con tres fases cooperativas
que se ejecutan en orden según una misma programación: **ligera** (ordena y prepara material
a corto plazo), **REM** (reflexiona y revela temas) y **profunda** (promueve hechos duraderos
a `MEMORY.md`). Solo la fase profunda escribe en `MEMORY.md`.

- Se habilita con `plugins.entries.memory-core.config.dreaming.enabled: true`
  (valor predeterminado: `false`); `memory-core` administra automáticamente el trabajo Cron de barrido, sin necesidad de
  `openclaw cron add` manual.
- Se puede activar o desactivar desde el chat con `/dreaming on|off` e inspeccionar con `/dreaming status`
  (o `/dreaming`/`/dreaming help`). `on`/`off` requiere ser propietario del canal
  o disponer de `operator.admin` del Gateway; `status` y la ayuda siguen disponibles para cualquiera que
  pueda invocar el comando.
- El resultado legible de cada fase se guarda en `DREAMS.md` (o en un `dreams.md` existente).
  De forma predeterminada (`dreaming.storage.mode: "separate"`), cada fase también escribe un
  informe independiente en `memory/dreaming/<phase>/YYYY-MM-DD.md`; establece `mode:
"inline"` para integrar los informes en el archivo de memoria diaria, o `"both"`
  para usar ambos.
- Las ejecuciones programadas y manuales de `memory promote` comparten las mismas señales de clasificación
  de la fase profunda; solo difieren los umbrales predeterminados (consulta la tabla anterior y los
  valores predeterminados programados que aparecen a continuación).
- Las ejecuciones programadas se distribuyen entre los espacios de trabajo de memoria de todos los agentes configurados.

Valores predeterminados programados (`plugins.entries.memory-core.config.dreaming`):

| Clave                                    | Valor predeterminado     |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

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

Lista completa de claves y detalles de las fases: [Dreaming](/es/concepts/dreaming),
[referencia de configuración de memoria](/es/reference/memory-config#dreaming).

## Dependencia del Gateway para SecretRef

Si los campos de claves de API remotas de Active Memory se configuran como SecretRefs, los comandos `memory`
los resuelven a partir de la instantánea activa del Gateway; si el Gateway no está
disponible, el comando falla de inmediato. Esto requiere un Gateway compatible con el
método `secrets.resolve`; los Gateway más antiguos devuelven un error de método desconocido.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Descripción general de la memoria](/es/concepts/memory)
