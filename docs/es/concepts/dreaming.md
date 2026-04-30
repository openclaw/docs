---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Desea ajustar la consolidación sin contaminar MEMORY.md
sidebarTitle: Dreaming
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un Diario de sueños
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T05:36:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`. Ayuda a OpenClaw a mover señales sólidas de corto plazo a memoria duradera, manteniendo el proceso explicable y revisable.

<Note>
Dreaming es **opcional** y está deshabilitado de forma predeterminada.
</Note>

## Qué escribe Dreaming

Dreaming mantiene dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingesta, bloqueos).
- **Salida legible por humanos** en `DREAMS.md` (o el `dreams.md` existente) y archivos opcionales de informe de fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming usa tres fases cooperativas:

| Fase  | Propósito                                      | Escritura duradera |
| ----- | ---------------------------------------------- | ------------------ |
| Light | Ordenar y preparar material reciente de corto plazo | No                 |
| Deep  | Puntuar y promover candidatos duraderos        | Sí (`MEMORY.md`)   |
| REM   | Reflexionar sobre temas e ideas recurrentes    | No                 |

Estas fases son detalles internos de implementación, no "modos" independientes configurados por el usuario.

<AccordionGroup>
  <Accordion title="Fase Light">
    La fase Light ingiere señales recientes de memoria diaria y trazas de recuperación, las deduplica y prepara líneas candidatas.

    - Lee desde el estado de recuperación de corto plazo, archivos recientes de memoria diaria y transcripciones de sesión redactadas cuando están disponibles.
    - Escribe un bloque administrado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo para la clasificación Deep posterior.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    La fase Deep decide qué se convierte en memoria de largo plazo.

    - Clasifica candidatos usando puntuación ponderada y compuertas de umbral.
    - Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` se cumplan.
    - Rehidrata fragmentos desde archivos diarios activos antes de escribir, por lo que se omiten fragmentos obsoletos o eliminados.
    - Agrega entradas promovidas a `MEMORY.md`.
    - Escribe un resumen `## Deep Sleep` en `DREAMS.md` y, opcionalmente, escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    La fase REM extrae patrones y señales reflexivas.

    - Crea resúmenes de temas y reflexiones a partir de trazas recientes de corto plazo.
    - Escribe un bloque administrado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo REM usadas por la clasificación Deep.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingesta de transcripciones de sesión

Dreaming puede ingerir transcripciones de sesión redactadas en el corpus de Dreaming. Cuando hay transcripciones disponibles, se pasan a la fase Light junto con señales de memoria diaria y trazas de recuperación. El contenido personal y sensible se redacta antes de la ingesta.

## Diario de sueños

Dreaming también mantiene un **Diario de sueños** narrativo en `DREAMS.md`. Después de que cada fase tenga material suficiente, `memory-core` ejecuta un turno de subagente en segundo plano con el mejor esfuerzo y agrega una entrada breve al diario. Usa el modelo de runtime predeterminado salvo que `dreaming.model` esté configurado. Si el modelo configurado no está disponible, el Diario de sueños reintenta una vez con el modelo predeterminado de la sesión.

<Note>
Este diario es para lectura humana en la interfaz de sueños, no una fuente de promoción. Los artefactos de diario/informe generados por Dreaming se excluyen de la promoción de corto plazo. Solo los fragmentos de memoria fundamentados son elegibles para promoverse a `MEMORY.md`.
</Note>

También hay una vía de relleno histórico fundamentado para trabajos de revisión y recuperación:

<AccordionGroup>
  <Accordion title="Comandos de relleno">
    - `memory rem-harness --path ... --grounded` previsualiza salida de diario fundamentada desde notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` escribe entradas de diario fundamentadas y reversibles en `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencia de corto plazo que ya usa la fase Deep normal.
    - `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de relleno preparados sin tocar entradas ordinarias del diario ni la recuperación de corto plazo activa.

  </Accordion>
</AccordionGroup>

La interfaz de control expone el mismo flujo de relleno/restablecimiento del diario para que puedas inspeccionar los resultados en la escena de sueños antes de decidir si los candidatos fundamentados merecen promoción. La escena también muestra una vía fundamentada distinta para que puedas ver qué entradas de corto plazo preparadas provienen de la reproducción histórica, qué elementos promovidos fueron impulsados por contenido fundamentado, y borrar solo entradas preparadas exclusivamente fundamentadas sin tocar el estado ordinario activo de corto plazo.

## Señales de clasificación Deep

La clasificación Deep usa seis señales base ponderadas más refuerzo de fase:

| Señal              | Peso | Descripción                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Frecuencia           | 0.24   | Cuántas señales de corto plazo acumuló la entrada |
| Relevancia           | 0.30   | Calidad media de recuperación para la entrada     |
| Diversidad de consultas | 0.15   | Contextos distintos de consulta/día que la hicieron aparecer |
| Recencia             | 0.15   | Puntuación de frescura con decaimiento temporal   |
| Consolidación       | 0.10   | Fuerza de recurrencia en varios días              |
| Riqueza conceptual | 0.06   | Densidad de etiquetas de concepto del fragmento/ruta |

Los aciertos de las fases Light y REM agregan un pequeño impulso con decaimiento por recencia desde `memory/.dreams/phase-signals.json`.

## Programación

Cuando está habilitado, `memory-core` administra automáticamente un trabajo de Cron para un barrido completo de Dreaming. Cada barrido ejecuta las fases en orden: Light → REM → Deep.

Comportamiento de cadencia predeterminado:

| Configuración              | Predeterminado       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | modelo predeterminado |

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
  <Tab title="Cadencia de barrido personalizada">
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

## Comando de barra

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flujo de trabajo de CLI

<Tabs>
  <Tab title="Vista previa / aplicación de promoción">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual usa los umbrales de la fase Deep de forma predeterminada salvo que se anulen con flags de CLI.

  </Tab>
  <Tab title="Explicar promoción">
    Explica por qué un candidato específico se promovería o no:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Vista previa de arnés REM">
    Previsualiza reflexiones REM, verdades candidatas y salida de promoción Deep sin escribir nada:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valores predeterminados clave

Todas las configuraciones viven en `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Habilita o deshabilita el barrido de Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadencia de Cron para el barrido completo de Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Anulación opcional del modelo de subagente del Diario de sueños. Usa un valor canónico `provider/model` cuando también configures una lista de permitidos `allowedModels` de subagente.
</ParamField>

<Warning>
`dreaming.model` requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringirlo, configura también `plugins.entries.memory-core.subagent.allowedModels`. Los fallos de confianza o de lista de permitidos permanecen visibles en lugar de recurrir silenciosamente a otro modelo; el reintento solo cubre errores de modelo no disponible.
</Warning>

<Note>
La política de fases, los umbrales y el comportamiento de almacenamiento son detalles internos de implementación (no configuración orientada al usuario). Consulta la [referencia de configuración de memoria](/es/reference/memory-config#dreaming) para ver la lista completa de claves.
</Note>

## Interfaz de sueños

Cuando está habilitada, la pestaña **Sueños** del Gateway muestra:

- estado actual de habilitación de Dreaming
- estado a nivel de fase y presencia de barrido administrado
- conteos de corto plazo, fundamentados, de señales y promovidos hoy
- horario de la próxima ejecución programada
- una vía de escena fundamentada distinta para entradas preparadas de reproducción histórica
- un lector expandible del Diario de sueños respaldado por `doctor.memory.dreamDiary`

## Relacionado

- [Memoria](/es/concepts/memory)
- [CLI de memoria](/es/cli/memory)
- [Referencia de configuración de memoria](/es/reference/memory-config)
- [Búsqueda de memoria](/es/concepts/memory-search)
