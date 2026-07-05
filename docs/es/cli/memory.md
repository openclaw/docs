---
read_when:
    - Quieres indexar o buscar en la memoria semántica
    - Está depurando la disponibilidad de memoria o la indexación
    - Quieres promover la memoria a corto plazo recuperada a `MEMORY.md`
summary: Referencia de CLI para `openclaw memory` (status/index/search/promote/promote-explain/rem-harness/rem-backfill)
title: Memoria
x-i18n:
    generated_at: "2026-07-05T11:10:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestiona la indexación, búsqueda y promoción de memoria semántica a `MEMORY.md`.
Lo proporciona el plugin incluido `memory-core`, disponible cuando
`plugins.slots.memory` selecciona `memory-core` (el valor predeterminado). Otros plugins de memoria
exponen sus propios espacios de nombres de CLI.

Relacionado: concepto de [memoria](/es/concepts/memory), [Dreaming](/es/concepts/dreaming),
[referencia de configuración de memoria](/es/reference/memory-config), [wiki de memoria](/es/plugins/memory-wiki),
[wiki](/es/cli/wiki), [Plugins](/es/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Sin `--agent`, se ejecuta para todos los agentes en `agents.list`; si no hay una lista de agentes
configurada, recurre al agente predeterminado.

| Marca       | Efecto                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Comprueba la preparación del almacén vectorial, el proveedor de embeddings y la búsqueda semántica (implica llamadas adicionales al proveedor). `memory status` simple se mantiene rápido y omite esto; un estado vectorial/semántico desconocido significa que no se comprobó. El `searchMode: "search"` léxico de QMD siempre omite las comprobaciones vectoriales semánticas, incluso con `--deep`. |
| `--index`   | Reindexa si el almacén está sucio. Implica `--deep`.                                                                                                                                                                                                                                                      |
| `--fix`     | Repara bloqueos de recuperación obsoletos y normaliza los metadatos de promoción.                                                                                                                                                                                                                         |
| `--json`    | Imprime JSON.                                                                                                                                                                                                                                                                                             |
| `--verbose` | Emite registros detallados por fase.                                                                                                                                                                                                                                                                      |

Si la línea `Dreaming` permanece en `off` incluso con `dreaming.enabled: true`, o
los barridos programados nunca parecen ejecutarse, el Cron de Dreaming gestionado depende de que el
Heartbeat del agente predeterminado se active para disparar la reconciliación. Consulta
[Dreaming](/es/concepts/dreaming) para ver los detalles de programación.

El estado también enumera cualquier ruta de búsqueda adicional de `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

El mismo alcance por agente que `status`. `--force` ejecuta una reindexación completa en lugar de
una incremental. `--verbose` imprime los detalles por agente de proveedor, modelo, fuentes y
rutas adicionales antes de mostrar el progreso de indexación.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Consulta: `[query]` posicional o `--query <text>`. Si ambos están definidos, gana `--query`.
  Si ninguno está definido, el comando falla.
- `--agent <id>`: usa de forma predeterminada el agente predeterminado (no la lista completa de agentes).
- `--max-results <n>`: limita el recuento de resultados (entero positivo).
- `--min-score <n>`: filtra las coincidencias por debajo de esta puntuación.

## `memory promote`

Clasifica candidatos a corto plazo de `memory/YYYY-MM-DD.md` y, opcionalmente, agrega
las entradas principales a `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Marca                      | Predeterminado       | Efecto                                                              |
| -------------------------- | -------------------- | ------------------------------------------------------------------- |
| `--limit <n>`              |                      | Máximo de candidatos que devolver/aplicar.                          |
| `--min-score <n>`          | `0.75`               | Puntuación ponderada mínima de promoción.                           |
| `--min-recall-count <n>`   | `3`                  | Recuento mínimo de recuperaciones requerido.                        |
| `--min-unique-queries <n>` | `2`                  | Recuento mínimo de consultas distintas requerido.                   |
| `--apply`                  | solo vista previa    | Agrega los candidatos seleccionados a `MEMORY.md` y los marca como promovidos. |
| `--include-promoted`       |                      | Incluye candidatos ya promovidos en ciclos anteriores.              |
| `--json`                   |                      | Imprime JSON.                                                       |

Estos valores predeterminados de CLI difieren de los umbrales de fase profunda
del barrido programado de Dreaming (consulta [Dreaming](#dreaming) abajo); pasa marcas explícitas para igualar
el comportamiento del barrido en una ejecución manual puntual.

Señales de clasificación: frecuencia de recuperación, relevancia de recuperación, diversidad de consultas,
recencia temporal, consolidación entre días y riqueza de conceptos derivados, tomadas
tanto de recuperaciones de memoria como de pasadas de ingesta diaria, además de un refuerzo ligero/de fase REM
para revisitas repetidas de Dreaming. Antes de escribir, la promoción
vuelve a leer la nota diaria activa, por lo que las ediciones o eliminaciones de fragmentos a corto plazo
desde la clasificación se respetan en lugar de promover desde una instantánea obsoleta.

## `memory promote-explain`

Explica el desglose de puntuación de un candidato de promoción.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` coincide con la clave de un candidato (exacta o subcadena), ruta o texto del fragmento.

## `memory rem-harness`

Previsualiza reflexiones REM, verdades candidatas y salida de promoción de fase profunda
sin escribir nada.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: inicia el arnés desde archivos diarios históricos `YYYY-MM-DD.md`
  en lugar del espacio de trabajo activo.
- `--grounded`: también renderiza una vista previa fundamentada de `What Happened` / `Reflections` /
  `Possible Lasting Updates` a partir de las notas históricas.

## `memory rem-backfill`

Escribe resúmenes REM históricos fundamentados en `DREAMS.md` para revisión en la UI.
Reversible.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: obligatorio salvo que `--rollback`/`--rollback-short-term`
  esté definido. Archivo(s) o directorio de memoria diaria histórica desde donde rellenar.
- `--stage-short-term`: también inicia candidatos duraderos fundamentados en el almacén
  activo de promoción a corto plazo para que la fase profunda normal pueda clasificarlos.
- `--rollback`: elimina de `DREAMS.md` las entradas de diario fundamentadas escritas anteriormente.
- `--rollback-short-term`: elimina los candidatos fundamentados a corto plazo preparados anteriormente.

## Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano con tres fases cooperativas,
ejecutadas en orden según una programación: **ligera** (ordena/prepara material a corto plazo),
**REM** (reflexiona y saca a la superficie temas), **profunda** (promueve hechos duraderos
a `MEMORY.md`). Solo la fase profunda escribe en `MEMORY.md`.

- Actívalo con `plugins.entries.memory-core.config.dreaming.enabled: true`
  (predeterminado `false`); `memory-core` gestiona automáticamente el trabajo Cron de barrido, sin necesidad de
  `openclaw cron add` manual.
- Alterna desde el chat con `/dreaming on|off`; inspecciona con `/dreaming status`
  (o `/dreaming`/`/dreaming help`). `on`/`off` requiere estado de propietario del canal
  o `operator.admin` del Gateway; `status` y la ayuda siguen disponibles para cualquiera que
  pueda invocar el comando.
- La salida de fase legible por humanos va a `DREAMS.md` (o a un `dreams.md` existente).
  De forma predeterminada (`dreaming.storage.mode: "separate"`), cada fase también escribe un
  informe independiente en `memory/dreaming/<phase>/YYYY-MM-DD.md`; define `mode:
"inline"` para incorporar informes en el archivo de memoria diaria en su lugar, o `"both"`
  para ambos.
- Las ejecuciones programadas y manuales de `memory promote` comparten las mismas señales de
  clasificación de fase profunda; solo difieren los umbrales predeterminados (consulta la tabla de arriba frente a
  los valores programados de abajo).
- Las ejecuciones programadas se distribuyen por el espacio de trabajo de memoria de cada agente configurado.

Valores programados predeterminados (`plugins.entries.memory-core.config.dreaming`):

| Clave                                  | Predeterminado |
| -------------------------------------- | -------------- |
| `frequency`                            | `0 3 * * *`    |
| `phases.deep.minScore`                 | `0.8`          |
| `phases.deep.minRecallCount`           | `3`            |
| `phases.deep.minUniqueQueries`         | `3`            |
| `phases.deep.recencyHalfLifeDays`      | `14`           |
| `phases.deep.maxAgeDays`               | `30`           |
| `phases.deep.maxPromotedSnippetTokens` | `160`          |

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

Lista completa de claves y detalles de fases: [Dreaming](/es/concepts/dreaming),
[referencia de configuración de memoria](/es/reference/memory-config#dreaming).

## Dependencia de Gateway de SecretRef

Si los campos de clave de API remota de memoria activa están configurados como SecretRefs, los comandos de `memory`
los resuelven desde la instantánea activa del Gateway; si el Gateway no está
disponible, el comando falla rápido. Esto requiere un Gateway que admita el
método `secrets.resolve`; los gateways anteriores devuelven un error de método desconocido.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de memoria](/es/concepts/memory)
