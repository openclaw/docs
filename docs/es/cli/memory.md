---
read_when:
    - Quieres indexar o buscar en la memoria semántica
    - Estás depurando la disponibilidad o la indexación de la memoria
    - Quieres promover la memoria a corto plazo recuperada a `MEMORY.md`
summary: Referencia de la CLI para `openclaw memory` (estado/índice/búsqueda/promoción/explicación de promoción/arnés REM/retrorelleno REM)
title: Memoria
x-i18n:
    generated_at: "2026-07-11T23:00:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestiona la indexación y búsqueda de memoria semántica, así como su promoción a `MEMORY.md`.
Lo proporciona el plugin incluido `memory-core` y está disponible cuando
`plugins.slots.memory` selecciona `memory-core` (el valor predeterminado). Otros plugins de memoria
exponen sus propios espacios de nombres de CLI.

Relacionado: concepto de [memoria](/es/concepts/memory), [Dreaming](/es/concepts/dreaming),
[referencia de configuración de memoria](/es/reference/memory-config), [wiki de memoria](/es/plugins/memory-wiki),
[wiki](/es/cli/wiki), [plugins](/es/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Sin `--agent`, se ejecuta para cada agente de `agents.list`; si no se ha
configurado ninguna lista de agentes, recurre al agente predeterminado.

| Opción      | Efecto                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Comprueba la disponibilidad del almacén vectorial, el proveedor de incrustaciones y la búsqueda semántica (implica llamadas adicionales al proveedor). `memory status` sin opciones sigue siendo rápido y omite esta comprobación; un estado vectorial o semántico desconocido significa que no se comprobó. El modo léxico de QMD `searchMode: "search"` siempre omite las comprobaciones vectoriales semánticas, incluso con `--deep`. |
| `--index`   | Vuelve a indexar si el almacén tiene cambios pendientes. Implica `--deep`.                                                                                                                                                                                                                                 |
| `--fix`     | Repara los bloqueos de recuperación obsoletos y normaliza los metadatos de promoción.                                                                                                                                                                                                                      |
| `--json`    | Imprime JSON.                                                                                                                                                                                                                                                                                              |
| `--verbose` | Emite registros detallados de cada fase.                                                                                                                                                                                                                                                                   |

Si la línea `Dreaming` permanece en `off` incluso con `dreaming.enabled: true`, o
parece que los barridos programados nunca se ejecutan, el Cron administrado de Dreaming depende de que
se active el Heartbeat del agente predeterminado para iniciar la reconciliación. Consulta
[Dreaming](/es/concepts/dreaming) para obtener información sobre la programación.

El estado también enumera las rutas de búsqueda adicionales de `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

Tiene el mismo ámbito por agente que `status`. `--force` ejecuta una reindexación completa en lugar de
una incremental. `--verbose` muestra el proveedor, el modelo, las fuentes y
los detalles de las rutas adicionales de cada agente antes de mostrar el progreso de la indexación.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Consulta: `[query]` posicional o `--query <text>`. Si se especifican ambos, prevalece `--query`.
  Si no se especifica ninguno, el comando genera un error.
- `--agent <id>`: usa de forma predeterminada el agente predeterminado (no la lista completa de agentes).
- `--max-results <n>`: limita el número de resultados (entero positivo).
- `--min-score <n>`: excluye las coincidencias cuya puntuación sea inferior a este valor.

## `memory promote`

Clasifica los candidatos a corto plazo de `memory/YYYY-MM-DD.md` y, opcionalmente, añade
las entradas principales a `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Opción                     | Valor predeterminado | Efecto                                                                   |
| -------------------------- | -------------------- | ------------------------------------------------------------------------ |
| `--limit <n>`              |                      | Número máximo de candidatos que se devolverán o aplicarán.               |
| `--min-score <n>`          | `0.75`               | Puntuación ponderada mínima de promoción.                                |
| `--min-recall-count <n>`   | `3`                  | Número mínimo de recuperaciones requerido.                               |
| `--min-unique-queries <n>` | `2`                  | Número mínimo de consultas distintas requerido.                          |
| `--apply`                  | solo vista previa    | Añade los candidatos seleccionados a `MEMORY.md` y los marca como promovidos. |
| `--include-promoted`       |                      | Incluye los candidatos ya promovidos en ciclos anteriores.               |
| `--json`                   |                      | Imprime JSON.                                                            |

Estos valores predeterminados de la CLI difieren de los umbrales de la fase profunda
del barrido programado de Dreaming (consulta [Dreaming](#dreaming) más adelante); especifica opciones explícitas para reproducir
el comportamiento del barrido en una ejecución manual puntual.

Señales de clasificación: frecuencia de recuperación, relevancia de la recuperación, diversidad de consultas,
recencia temporal, consolidación entre días y riqueza conceptual derivada, obtenidas
tanto de las recuperaciones de memoria como de las pasadas de ingesta diaria, además de un ligero refuerzo de las fases ligera/REM
por las revisitas repetidas de Dreaming. Antes de escribir, la promoción
vuelve a leer la nota diaria activa, por lo que respeta las ediciones o eliminaciones de fragmentos a corto plazo
realizadas desde la clasificación, en lugar de promover contenido de una instantánea obsoleta.

## `memory promote-explain`

Explica el desglose de la puntuación de un candidato a promoción.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` coincide con la clave de un candidato (de forma exacta o por subcadena), su ruta o el texto
del fragmento.

## `memory rem-harness`

Muestra una vista previa de las reflexiones REM, las posibles verdades y el resultado de la promoción de la fase profunda
sin escribir nada.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: inicializa el entorno de pruebas a partir de archivos diarios históricos
  `YYYY-MM-DD.md` en lugar del espacio de trabajo activo.
- `--grounded`: también genera una vista previa fundamentada de `What Happened` / `Reflections` /
  `Possible Lasting Updates` a partir de las notas históricas.

## `memory rem-backfill`

Escribe resúmenes REM históricos fundamentados en `DREAMS.md` para revisarlos en la interfaz de usuario.
Es reversible.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: obligatorio salvo que se especifique `--rollback`/`--rollback-short-term`.
  Archivo o archivos históricos de memoria diaria, o directorio, desde los que realizar el rellenado retrospectivo.
- `--stage-short-term`: también incorpora candidatos duraderos fundamentados al almacén activo
  de promociones a corto plazo para que la fase profunda normal pueda clasificarlos.
- `--rollback`: elimina de `DREAMS.md` las entradas fundamentadas del diario escritas anteriormente.
- `--rollback-short-term`: elimina los candidatos fundamentados a corto plazo preparados anteriormente.

## Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano con tres fases cooperativas
que se ejecutan en orden según una única programación: **ligera** (ordena y prepara el material
a corto plazo), **REM** (reflexiona y revela temas) y **profunda** (promueve hechos duraderos
a `MEMORY.md`). Solo la fase profunda escribe en `MEMORY.md`.

- Actívalo con `plugins.entries.memory-core.config.dreaming.enabled: true`
  (valor predeterminado: `false`); `memory-core` administra automáticamente el trabajo Cron de barrido, por lo que no es necesario
  ejecutar manualmente `openclaw cron add`.
- Actívalo o desactívalo desde el chat con `/dreaming on|off`; consulta su estado con `/dreaming status`
  (o `/dreaming`/`/dreaming help`). `on`/`off` requiere tener la condición de propietario del canal
  o `operator.admin` del Gateway; el estado y la ayuda siguen disponibles para cualquiera que
  pueda invocar el comando.
- El resultado legible de las fases se guarda en `DREAMS.md` (o en un archivo `dreams.md` existente).
  De forma predeterminada (`dreaming.storage.mode: "separate"`), cada fase también escribe un
  informe independiente en `memory/dreaming/<phase>/YYYY-MM-DD.md`; establece `mode:
"inline"` para integrar los informes en el archivo de memoria diaria, o `"both"`
  para usar ambos.
- Las ejecuciones programadas y manuales de `memory promote` comparten las mismas señales de clasificación
  de la fase profunda; solo difieren los umbrales predeterminados (consulta la tabla anterior y los
  valores programados predeterminados a continuación).
- Las ejecuciones programadas se distribuyen por el espacio de trabajo de memoria de cada agente configurado.

Valores programados predeterminados (`plugins.entries.memory-core.config.dreaming`):

| Clave                                  | Valor predeterminado |
| -------------------------------------- | -------------------- |
| `frequency`                            | `0 3 * * *`          |
| `phases.deep.minScore`                 | `0.8`                |
| `phases.deep.minRecallCount`           | `3`                  |
| `phases.deep.minUniqueQueries`         | `3`                  |
| `phases.deep.recencyHalfLifeDays`      | `14`                 |
| `phases.deep.maxAgeDays`               | `30`                 |
| `phases.deep.maxPromotedSnippetTokens` | `160`                |

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

Si los campos de clave de API remota de Active Memory están configurados como SecretRefs, los comandos de `memory`
los resuelven a partir de la instantánea activa del Gateway; si el Gateway no está
disponible, el comando falla inmediatamente. Esto requiere un Gateway compatible con el
método `secrets.resolve`; los Gateway más antiguos devuelven un error de método desconocido.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Descripción general de la memoria](/es/concepts/memory)
