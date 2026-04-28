---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Quieres ajustar la consolidación sin contaminar `MEMORY.md`
sidebarTitle: Dreaming
summary: Consolidación de memoria en segundo plano con fases ligeras, profundas y REM, además de un Diario de Sueños
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:26:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`. Ayuda a OpenClaw a mover señales fuertes de corto plazo a memoria duradera mientras mantiene el proceso explicable y revisable.

<Note>
Dreaming es **opcional** y está deshabilitado de forma predeterminada.
</Note>

## Qué escribe Dreaming

Dreaming mantiene dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingestión, bloqueos).
- **Salida legible por humanos** en `DREAMS.md` (o el `dreams.md` existente) y archivos opcionales de informe de fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming usa tres fases cooperativas:

| Fase | Propósito                                   | Escritura duradera |
| ----- | ------------------------------------------- | ------------------ |
| Light | Ordenar y preparar material reciente de corto plazo | No                 |
| Deep  | Puntuar y promover candidatos duraderos     | Sí (`MEMORY.md`)   |
| REM   | Reflexionar sobre temas e ideas recurrentes | No                 |

Estas fases son detalles internos de implementación, no “modos” configurados por el usuario.

<AccordionGroup>
  <Accordion title="Fase Light">
    La fase Light ingiere señales recientes de memoria diaria y trazas de recuperación, elimina duplicados y prepara líneas candidatas.

    - Lee del estado de recuperación a corto plazo, archivos recientes de memoria diaria y transcripciones redactadas de sesiones cuando están disponibles.
    - Escribe un bloque gestionado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo para el ranking profundo posterior.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    La fase Deep decide qué se convierte en memoria a largo plazo.

    - Ordena los candidatos usando puntuación ponderada y umbrales de filtrado.
    - Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` se cumplan.
    - Rehidrata fragmentos desde archivos diarios activos antes de escribir, por lo que se omiten los fragmentos obsoletos o eliminados.
    - Añade las entradas promovidas a `MEMORY.md`.
    - Escribe un resumen `## Deep Sleep` en `DREAMS.md` y opcionalmente escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    La fase REM extrae patrones y señales reflexivas.

    - Construye resúmenes de temas y reflexiones a partir de trazas recientes de corto plazo.
    - Escribe un bloque gestionado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo REM usadas por el ranking profundo.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestión de transcripciones de sesión

Dreaming puede ingerir transcripciones redactadas de sesiones en el corpus de Dreaming. Cuando las transcripciones están disponibles, se incorporan a la fase Light junto con las señales de memoria diaria y las trazas de recuperación. El contenido personal y sensible se redacta antes de la ingestión.

## Diario de Sueños

Dreaming también mantiene un **Diario de Sueños** narrativo en `DREAMS.md`. Después de que cada fase tenga suficiente material, `memory-core` ejecuta un turno de subagente en segundo plano de mejor esfuerzo (usando el modelo de runtime predeterminado) y añade una breve entrada al diario.

<Note>
Este diario es para lectura humana en la UI de Dreams, no una fuente de promoción. Los artefactos de diario/informe generados por Dreaming se excluyen de la promoción a corto plazo. Solo los fragmentos de memoria fundamentados pueden promocionarse a `MEMORY.md`.
</Note>

También existe una vía de relleno histórico fundamentado para trabajo de revisión y recuperación:

<AccordionGroup>
  <Accordion title="Comandos de relleno">
    - `memory rem-harness --path ... --grounded` muestra una vista previa de la salida fundamentada del diario a partir de notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` escribe entradas de diario fundamentadas y reversibles en `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencia a corto plazo que ya usa la fase Deep normal.
    - `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de relleno preparados sin tocar las entradas normales del diario ni la recuperación activa normal a corto plazo.

  </Accordion>
</AccordionGroup>

La Control UI expone el mismo flujo de relleno/restablecimiento del diario para que puedas inspeccionar resultados en la escena Dreams antes de decidir si los candidatos fundamentados merecen promoción. La escena también muestra una vía fundamentada distinta para que puedas ver qué entradas preparadas de corto plazo proceden de reproducción histórica, qué elementos promocionados fueron guiados por contenido fundamentado y limpiar solo las entradas preparadas solo fundamentadas sin tocar el estado normal activo de corto plazo.

## Señales de ranking profundo

El ranking profundo usa seis señales base ponderadas más el refuerzo de fase:

| Señal              | Peso | Descripción                                       |
| ------------------ | ---- | ------------------------------------------------- |
| Frecuencia         | 0.24 | Cuántas señales de corto plazo acumuló la entrada |
| Relevancia         | 0.30 | Calidad media de recuperación de la entrada       |
| Diversidad de consultas | 0.15 | Contextos distintos de consulta/día que la hicieron aparecer |
| Recencia           | 0.15 | Puntuación de frescura con decaimiento temporal   |
| Consolidación      | 0.10 | Fuerza de recurrencia en varios días              |
| Riqueza conceptual | 0.06 | Densidad de etiquetas de concepto desde el fragmento/ruta |

Los aciertos de las fases Light y REM añaden un pequeño refuerzo con decaimiento temporal desde `memory/.dreams/phase-signals.json`.

## Programación

Cuando está habilitado, `memory-core` gestiona automáticamente un trabajo Cron para una ejecución completa de Dreaming. Cada ejecución procesa las fases en orden: Light → REM → Deep.

Comportamiento de cadencia predeterminado:

| Configuración         | Predeterminado |
| --------------------- | -------------- |
| `dreaming.frequency`  | `0 3 * * *`    |

## Inicio rápido

<Tabs>
  <Tab title="Habilitar Dreaming">
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
  </Tab>
  <Tab title="Cadencia personalizada de ejecución">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## Comando con barra

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flujo de trabajo de la CLI

<Tabs>
  <Tab title="Vista previa / aplicación de promoción">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual usa los umbrales de la fase Deep de forma predeterminada, salvo que se sobrescriban con flags de CLI.

  </Tab>
  <Tab title="Explicar promoción">
    Explica por qué un candidato específico se promocionaría o no:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Vista previa de REM harness">
    Muestra una vista previa de reflexiones REM, verdades candidatas y salida de promoción profunda sin escribir nada:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valores predeterminados clave

Toda la configuración reside en `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Habilita o deshabilita la ejecución de Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadencia Cron para la ejecución completa de Dreaming.
</ParamField>

<Note>
La política de fases, los umbrales y el comportamiento de almacenamiento son detalles internos de implementación (no configuración orientada al usuario). Consulta [Memory configuration reference](/es/reference/memory-config#dreaming) para ver la lista completa de claves.
</Note>

## UI de Dreams

Cuando está habilitada, la pestaña **Dreams** del Gateway muestra:

- estado actual de habilitación de Dreaming
- estado por fase y presencia de ejecución gestionada
- recuentos de corto plazo, fundamentados, señales y promocionados hoy
- hora de la siguiente ejecución programada
- una vía distinta en la escena para entradas preparadas de reproducción histórica fundamentada
- un lector expandible del Diario de Sueños respaldado por `doctor.memory.dreamDiary`

## Relacionado

- [Memory](/es/concepts/memory)
- [Memory CLI](/es/cli/memory)
- [Memory configuration reference](/es/reference/memory-config)
- [Memory search](/es/concepts/memory-search)
