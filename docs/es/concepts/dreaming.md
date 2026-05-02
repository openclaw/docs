---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Desea ajustar la consolidación sin contaminar MEMORY.md
sidebarTitle: Dreaming
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un Diario de sueños
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T20:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming es el sistema de consolidación de memoria en segundo plano en `memory-core`. Ayuda a OpenClaw a mover señales fuertes de corto plazo a memoria duradera, manteniendo el proceso explicable y revisable.

<Note>
Dreaming es **opcional** y está deshabilitado de forma predeterminada.
</Note>

## Qué escribe Dreaming

Dreaming conserva dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingesta, bloqueos).
- **Salida legible para humanos** en `DREAMS.md` (o el `dreams.md` existente) y archivos opcionales de informe de fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

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

    - Lee del estado de recuperación de corto plazo, archivos recientes de memoria diaria y transcripciones de sesión redactadas cuando están disponibles.
    - Escribe un bloque administrado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo para la posterior clasificación de Deep.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    La fase Deep decide qué se convierte en memoria a largo plazo.

    - Clasifica candidatos usando puntuación ponderada y compuertas de umbral.
    - Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` pasen.
    - Rehidrata fragmentos desde archivos diarios activos antes de escribir, por lo que se omiten fragmentos obsoletos o eliminados.
    - Anexa entradas promovidas a `MEMORY.md`.
    - Escribe un resumen `## Deep Sleep` en `DREAMS.md` y, opcionalmente, escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    La fase REM extrae patrones y señales reflexivas.

    - Construye resúmenes de temas y reflexiones a partir de trazas recientes de corto plazo.
    - Escribe un bloque administrado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo REM usadas por la clasificación de Deep.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingesta de transcripciones de sesión

Dreaming puede ingerir transcripciones de sesión redactadas en el corpus de Dreaming. Cuando las transcripciones están disponibles, se alimentan a la fase Light junto con las señales de memoria diaria y las trazas de recuperación. El contenido personal y sensible se redacta antes de la ingesta.

## Diario de sueños

Dreaming también mantiene un **Diario de sueños** narrativo en `DREAMS.md`. Después de que cada fase tenga suficiente material, `memory-core` ejecuta un turno de subagente en segundo plano con el mejor esfuerzo y anexa una breve entrada de diario. Usa el modelo de runtime predeterminado salvo que `dreaming.model` esté configurado. Si el modelo configurado no está disponible, el Diario de sueños reintenta una vez con el modelo predeterminado de la sesión.

<Note>
Este diario es para lectura humana en la interfaz de Sueños, no una fuente de promoción. Los artefactos de diario/informe generados por Dreaming se excluyen de la promoción de corto plazo. Solo los fragmentos de memoria fundamentados son elegibles para promoverse a `MEMORY.md`.
</Note>

También hay una vía de relleno histórico fundamentado para trabajo de revisión y recuperación:

<AccordionGroup>
  <Accordion title="Comandos de relleno">
    - `memory rem-harness --path ... --grounded` previsualiza salida de diario fundamentada desde notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` escribe entradas de diario fundamentadas reversibles en `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencia de corto plazo que ya usa la fase Deep normal.
    - `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de relleno preparados sin tocar entradas ordinarias del diario ni la recuperación activa de corto plazo.

  </Accordion>
</AccordionGroup>

La interfaz de Control expone el mismo flujo de relleno/restablecimiento del diario para que puedas inspeccionar los resultados en la escena de Sueños antes de decidir si los candidatos fundamentados merecen promoción. La escena también muestra una vía fundamentada distinta para que puedas ver qué entradas preparadas de corto plazo provinieron de la reproducción histórica, qué elementos promovidos fueron impulsados por información fundamentada, y borrar solo entradas preparadas exclusivamente fundamentadas sin tocar el estado ordinario activo de corto plazo.

## Señales de clasificación de Deep

La clasificación de Deep usa seis señales base ponderadas más refuerzo de fase:

| Señal                | Peso | Descripción                                             |
| -------------------- | ---- | ------------------------------------------------------- |
| Frecuencia           | 0.24 | Cuántas señales de corto plazo acumuló la entrada       |
| Relevancia           | 0.30 | Calidad media de recuperación de la entrada             |
| Diversidad de consulta | 0.15 | Contextos distintos de consulta/día que la hicieron emerger |
| Recencia             | 0.15 | Puntuación de frescura con decaimiento temporal         |
| Consolidación        | 0.10 | Fuerza de recurrencia en varios días                    |
| Riqueza conceptual   | 0.06 | Densidad de etiquetas de concepto del fragmento/ruta    |

Los aciertos de las fases Light y REM añaden un pequeño impulso con decaimiento de recencia desde `memory/.dreams/phase-signals.json`.

## Programación

Cuando está habilitado, `memory-core` administra automáticamente un trabajo Cron para un barrido completo de Dreaming. Cada barrido ejecuta las fases en orden: Light → REM → Deep.

El barrido incluye el espacio de trabajo principal del runtime y cualquier espacio de trabajo de agente configurado, deduplicados por ruta, por lo que la expansión a espacios de trabajo de subagentes no excluye el `DREAMS.md` ni el estado de memoria del agente principal.

Comportamiento de cadencia predeterminado:

| Configuración        | Predeterminado |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |
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

## Comando slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flujo de trabajo de CLI

<Tabs>
  <Tab title="Previsualizar / aplicar promoción">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual usa los umbrales de fase Deep de forma predeterminada salvo que se sobrescriban con flags de CLI.

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

Todas las configuraciones están en `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Habilita o deshabilita el barrido de Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadencia Cron para el barrido completo de Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Sobrescritura opcional del modelo de subagente del Diario de sueños. Usa un valor canónico `provider/model` cuando también configures una lista de permitidos `allowedModels` de subagente.
</ParamField>

<Warning>
`dreaming.model` requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringirlo, también configura `plugins.entries.memory-core.subagent.allowedModels`. Los fallos de confianza o de lista de permitidos permanecen visibles en lugar de recurrir silenciosamente a un valor alternativo; el reintento solo cubre errores de modelo no disponible.
</Warning>

<Note>
La política de fase, los umbrales y el comportamiento de almacenamiento son detalles internos de implementación (no configuración orientada al usuario). Consulta la [referencia de configuración de memoria](/es/reference/memory-config#dreaming) para ver la lista completa de claves.
</Note>

## Interfaz de Sueños

Cuando está habilitada, la pestaña **Sueños** del Gateway muestra:

- estado actual de habilitación de Dreaming
- estado a nivel de fase y presencia de barrido administrado
- conteos de corto plazo, fundamentados, de señales y promovidos hoy
- momento de la próxima ejecución programada
- una vía de escena fundamentada distinta para entradas preparadas de reproducción histórica
- un lector expandible del Diario de sueños respaldado por `doctor.memory.dreamDiary`

## Relacionado

- [Memoria](/es/concepts/memory)
- [CLI de memoria](/es/cli/memory)
- [Referencia de configuración de memoria](/es/reference/memory-config)
- [Búsqueda de memoria](/es/concepts/memory-search)
