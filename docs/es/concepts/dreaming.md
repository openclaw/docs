---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Quieres ajustar la consolidación sin contaminar MEMORY.md
sidebarTitle: Dreaming
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T11:11:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`. Ayuda a OpenClaw a mover señales sólidas de corto plazo a memoria duradera, manteniendo el proceso explicable y revisable.

<Note>
Dreaming es **opcional** y está desactivado de forma predeterminada.
</Note>

## Qué escribe Dreaming

Dreaming conserva dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingesta, bloqueos).
- **Salida legible por humanos** en `DREAMS.md` (o `dreams.md` existente) y archivos opcionales de informe de fase bajo `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming usa tres fases cooperativas:

| Fase  | Propósito                                      | Escritura duradera |
| ----- | ---------------------------------------------- | ------------------ |
| Light | Ordenar y preparar material reciente de corto plazo | No                 |
| Deep  | Puntuar y promover candidatos duraderos        | Sí (`MEMORY.md`)   |
| REM   | Reflexionar sobre temas e ideas recurrentes    | No                 |

Estas fases son detalles internos de implementación, no "modos" separados configurados por el usuario.

<AccordionGroup>
  <Accordion title="Fase Light">
    La fase Light ingiere señales recientes de memoria diaria y trazas de recuperación, las deduplica y prepara líneas candidatas.

    - Lee desde el estado de recuperación de corto plazo, archivos recientes de memoria diaria y transcripciones de sesión redactadas cuando están disponibles.
    - Escribe un bloque administrado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo para la clasificación Deep posterior.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    La fase Deep decide qué se convierte en memoria a largo plazo.

    - Clasifica candidatos usando puntuación ponderada y puertas de umbral.
    - Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` se superen.
    - Rehidrata fragmentos desde archivos diarios en vivo antes de escribir, por lo que se omiten fragmentos obsoletos o eliminados.
    - Agrega entradas promovidas a `MEMORY.md`.
    - Escribe un resumen `## Deep Sleep` en `DREAMS.md` y opcionalmente escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

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

Dreaming puede ingerir transcripciones de sesión redactadas en el corpus de Dreaming. Cuando las transcripciones están disponibles, se incorporan a la fase Light junto con señales de memoria diaria y trazas de recuperación. El contenido personal y sensible se redacta antes de la ingesta.

## Dream Diary

Dreaming también mantiene un **Dream Diary** narrativo en `DREAMS.md`. Después de que cada fase tiene suficiente material, `memory-core` ejecuta un turno de subagente en segundo plano con el mejor esfuerzo y agrega una entrada breve de diario. Usa el modelo de runtime predeterminado salvo que `dreaming.model` esté configurado. Si el modelo configurado no está disponible, Dream Diary reintenta una vez con el modelo predeterminado de la sesión.

<Note>
Este diario es para lectura humana en la UI de Dreams, no una fuente de promoción. Los artefactos de diario/informe generados por Dreaming se excluyen de la promoción de corto plazo. Solo los fragmentos de memoria fundamentados son elegibles para promoverse a `MEMORY.md`.
</Note>

También hay una vía de relleno histórico fundamentado para tareas de revisión y recuperación:

<AccordionGroup>
  <Accordion title="Comandos de relleno">
    - `memory rem-harness --path ... --grounded` previsualiza la salida de diario fundamentada desde notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` escribe entradas de diario fundamentadas y reversibles en `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencia de corto plazo que ya usa la fase Deep normal.
    - `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de relleno preparados sin tocar entradas de diario ordinarias ni recuperación de corto plazo en vivo.

  </Accordion>
</AccordionGroup>

La UI de Control expone el mismo flujo de relleno/restablecimiento del diario para que puedas inspeccionar los resultados en la escena Dreams antes de decidir si los candidatos fundamentados merecen promoción. La Scene también muestra una vía fundamentada distinta para que puedas ver qué entradas de corto plazo preparadas vinieron de reproducción histórica, qué elementos promovidos fueron dirigidos por fundamentación, y borrar solo entradas preparadas exclusivamente fundamentadas sin tocar el estado ordinario de corto plazo en vivo.

## Señales de clasificación Deep

La clasificación Deep usa seis señales base ponderadas más refuerzo de fase:

| Señal                | Peso | Descripción                                             |
| -------------------- | ---- | ------------------------------------------------------- |
| Frecuencia           | 0.24 | Cuántas señales de corto plazo acumuló la entrada       |
| Relevancia           | 0.30 | Calidad promedio de recuperación para la entrada        |
| Diversidad de consultas | 0.15 | Contextos distintos de consulta/día que la hicieron aparecer |
| Recencia             | 0.15 | Puntuación de frescura con decaimiento temporal         |
| Consolidación        | 0.10 | Fuerza de recurrencia en varios días                    |
| Riqueza conceptual   | 0.06 | Densidad de etiquetas de concepto del fragmento/ruta    |

Los aciertos de fase Light y REM agregan un pequeño impulso con decaimiento por recencia desde `memory/.dreams/phase-signals.json`.

Los resultados de pruebas sombra se pueden superponer sobre esa puntuación base como una señal de revisión antes de cualquier escritura duradera. Una prueba útil da al candidato un pequeño impulso acotado, una prueba neutral lo mantiene diferido y una prueba perjudicial lo marca como rechazado para esa pasada de puntuación. Esta señal sigue siendo solo de informe: puede cambiar el orden de candidatos o los metadatos de revisión, pero no escribe en `MEMORY.md` ni promueve el candidato por sí sola.

## Cobertura de informes de pruebas sombra de QA

QA Lab incluye un escenario solo de informe para explorar cómo una futura prueba sombra de Dreaming podría revisar una memoria candidata antes de la promoción. El escenario pide a un agente comparar una respuesta de referencia con una respuesta que puede usar la memoria candidata y luego escribir un informe local con un veredicto, motivo e indicadores de riesgo.

Esta cobertura está intencionalmente acotada a QA. Verifica que el artefacto de informe permanezca separado de `MEMORY.md` y que el agente no afirme que el candidato fue promovido. No agrega comportamiento de pruebas sombra en producción ni cambia el motor de promoción de la fase Deep.

El ejecutor de pruebas sombra de `memory-core` mantiene ese mismo contrato solo de informe para rutas de código que necesitan un artefacto estable. Acepta el candidato, prompt de prueba, resultado de referencia, resultado del candidato, veredicto, motivo, indicadores de riesgo y referencias de evidencia, y luego escribe un informe con `promotion action: report-only`. Los veredictos útiles se asignan a una recomendación `promote`, los veredictos neutrales a `defer` y los veredictos perjudiciales a `reject`; ninguna de esas recomendaciones escribe en `MEMORY.md` ni aplica promoción de fase Deep.

## Programación

Cuando está activado, `memory-core` administra automáticamente un trabajo Cron para un barrido completo de Dreaming. Cada barrido ejecuta las fases en orden: Light → REM → Deep.

El barrido incluye el espacio de trabajo principal del runtime y cualquier espacio de trabajo de agente configurado, deduplicado por ruta, para que el despliegue en abanico de espacios de trabajo de subagentes no excluya el `DREAMS.md` ni el estado de memoria del agente principal.

Comportamiento de cadencia predeterminado:

| Configuración        | Predeterminado |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |
| `dreaming.model`     | modelo predeterminado |

## Inicio rápido

<Tabs>
  <Tab title="Activar Dreaming">
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

## Comando slash

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

    El `memory promote` manual usa de forma predeterminada los umbrales de fase Deep salvo que se sobrescriban con flags de CLI.

  </Tab>
  <Tab title="Explicar promoción">
    Explica por qué un candidato específico se promovería o no:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Vista previa del arnés REM">
    Previsualiza reflexiones REM, verdades candidatas y salida de promoción Deep sin escribir nada:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valores predeterminados clave

Todas las configuraciones viven bajo `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Activa o desactiva el barrido de Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadencia Cron para el barrido completo de Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Anulación opcional del modelo de subagente de Dream Diary. Usa un valor canónico `provider/model` cuando también configures una lista de permitidos `allowedModels` para subagente.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Recuento máximo estimado de tokens conservado de cada fragmento de recuperación de corto plazo promovido a `MEMORY.md`. La procedencia de clasificación permanece visible.
</ParamField>

<Warning>
`dreaming.model` requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringirlo, configura también `plugins.entries.memory-core.subagent.allowedModels`. Los fallos de confianza o de lista de permitidos permanecen visibles en lugar de recurrir silenciosamente a otro modelo; el reintento solo cubre errores de modelo no disponible.
</Warning>

<Note>
La mayor parte de la política de fases, umbrales y comportamiento de almacenamiento son detalles internos de implementación. Consulta [Referencia de configuración de memoria](/es/reference/memory-config#dreaming) para la lista completa de claves.
</Note>

## UI de Dreams

Cuando está activado, la pestaña **Dreams** del Gateway muestra:

- estado actual de activación de Dreaming
- estado por fase y presencia de barrido administrado
- recuentos de corto plazo, fundamentados, de señales y promovidos hoy
- hora de la próxima ejecución programada
- una vía Scene fundamentada distinta para entradas preparadas de reproducción histórica
- un lector expandible de Dream Diary respaldado por `doctor.memory.dreamDiary`

## Dreaming nunca se ejecuta: el estado muestra bloqueado

Si `openclaw memory status` informa `Dreaming status: blocked`, el Cron administrado existe pero el Heartbeat del agente predeterminado no está disparándose. Comprueba que Heartbeat esté activado para el agente predeterminado y que su destino no sea `none`; luego ejecuta `openclaw memory status --deep` de nuevo después del siguiente intervalo de Heartbeat.

## Relacionado

- [Memoria](/es/concepts/memory)
- [CLI de memoria](/es/cli/memory)
- [Referencia de configuración de memoria](/es/reference/memory-config)
- [Búsqueda de memoria](/es/concepts/memory-search)
