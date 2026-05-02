---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Quieres ajustar la consolidación sin contaminar MEMORY.md
sidebarTitle: Dreaming
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un diario de sueños
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T22:18:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b56f93c68f53178e0998b9809ff358910956260f72ff7213b7d0dd92300f5d24
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`. Ayuda a OpenClaw a mover señales sólidas de corto plazo a la memoria duradera, manteniendo el proceso explicable y revisable.

<Note>
Dreaming es **opt-in** y está deshabilitado de forma predeterminada.
</Note>

## Qué escribe Dreaming

Dreaming conserva dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingesta, bloqueos).
- **Salida legible para humanos** en `DREAMS.md` (o el `dreams.md` existente) y archivos opcionales de informe de fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming usa tres fases cooperativas:

| Fase | Propósito                                         | Escritura duradera |
| ----- | ------------------------------------------------- | ------------------ |
| Light | Ordenar y preparar material reciente de corto plazo | No                 |
| Deep  | Puntuar y promover candidatos duraderos           | Sí (`MEMORY.md`)   |
| REM   | Reflexionar sobre temas e ideas recurrentes       | No                 |

Estas fases son detalles internos de implementación, no "modos" separados configurados por el usuario.

<AccordionGroup>
  <Accordion title="Fase Light">
    La fase Light ingiere señales recientes de memoria diaria y trazas de recuperación, las desduplica y prepara líneas candidatas.

    - Lee desde el estado de recuperación de corto plazo, archivos recientes de memoria diaria y transcripciones de sesión redactadas cuando están disponibles.
    - Escribe un bloque administrado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo para la clasificación Deep posterior.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    La fase Deep decide qué se convierte en memoria a largo plazo.

    - Clasifica candidatos usando puntuación ponderada y compuertas de umbral.
    - Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` se cumplan.
    - Rehidrata fragmentos desde archivos diarios en vivo antes de escribir, por lo que los fragmentos obsoletos o eliminados se omiten.
    - Anexa entradas promovidas a `MEMORY.md`.
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

Dreaming puede ingerir transcripciones de sesión redactadas en el corpus de Dreaming. Cuando las transcripciones están disponibles, se alimentan a la fase Light junto con señales de memoria diaria y trazas de recuperación. El contenido personal y sensible se redacta antes de la ingesta.

## Dream Diary

Dreaming también mantiene un **Dream Diary** narrativo en `DREAMS.md`. Después de que cada fase tiene suficiente material, `memory-core` ejecuta un turno de subagente en segundo plano de mejor esfuerzo y anexa una entrada breve de diario. Usa el modelo de runtime predeterminado a menos que `dreaming.model` esté configurado. Si el modelo configurado no está disponible, Dream Diary reintenta una vez con el modelo predeterminado de la sesión.

<Note>
Este diario es para lectura humana en la UI de Dreams, no una fuente de promoción. Los artefactos de diario/informe generados por Dreaming se excluyen de la promoción de corto plazo. Solo los fragmentos de memoria fundamentados son elegibles para promoverse a `MEMORY.md`.
</Note>

También hay un carril de relleno histórico fundamentado para trabajo de revisión y recuperación:

<AccordionGroup>
  <Accordion title="Comandos de relleno">
    - `memory rem-harness --path ... --grounded` previsualiza salida de diario fundamentada desde notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` escribe entradas de diario fundamentadas reversibles en `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencia de corto plazo que ya usa la fase Deep normal.
    - `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de relleno preparados sin tocar entradas ordinarias del diario ni recuperación de corto plazo en vivo.

  </Accordion>
</AccordionGroup>

La UI de Control expone el mismo flujo de relleno/restablecimiento de diario para que puedas inspeccionar los resultados en la escena Dreams antes de decidir si los candidatos fundamentados merecen promoción. La Scene también muestra un carril fundamentado distinto para que puedas ver qué entradas de corto plazo preparadas provinieron de la reproducción histórica, qué elementos promovidos fueron guiados por fundamentación, y limpiar solo entradas preparadas exclusivamente fundamentadas sin tocar el estado ordinario de corto plazo en vivo.

## Señales de clasificación Deep

La clasificación Deep usa seis señales base ponderadas más refuerzo de fase:

| Señal              | Peso | Descripción                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Frecuencia           | 0.24   | Cuántas señales de corto plazo acumuló la entrada |
| Relevancia           | 0.30   | Calidad promedio de recuperación de la entrada           |
| Diversidad de consultas     | 0.15   | Contextos distintos de consulta/día que la hicieron emerger      |
| Actualidad             | 0.15   | Puntuación de frescura con decaimiento temporal                      |
| Consolidación       | 0.10   | Fuerza de recurrencia de varios días                     |
| Riqueza conceptual | 0.06   | Densidad de etiquetas conceptuales del fragmento/ruta             |

Las coincidencias de las fases Light y REM añaden un pequeño impulso con decaimiento por actualidad desde `memory/.dreams/phase-signals.json`.

## Programación

Cuando está habilitado, `memory-core` administra automáticamente un trabajo Cron para un barrido completo de Dreaming. Cada barrido ejecuta las fases en orden: Light → REM → Deep.

El barrido incluye el espacio de trabajo principal de runtime y cualquier espacio de trabajo de agente configurado, desduplicado por ruta, por lo que la expansión a espacios de trabajo de subagentes no excluye el `DREAMS.md` ni el estado de memoria del agente principal.

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

    `memory promote` manual usa umbrales de fase Deep de forma predeterminada, a menos que se sobrescriban con flags de CLI.

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

Todas las configuraciones viven en `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Habilita o deshabilita el barrido de Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadencia Cron para el barrido completo de Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Anulación opcional del modelo de subagente de Dream Diary. Usa un valor canónico `provider/model` cuando también configures una lista de permitidos `allowedModels` de subagente.
</ParamField>

<Warning>
`dreaming.model` requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringirlo, configura también `plugins.entries.memory-core.subagent.allowedModels`. Los fallos de confianza o lista de permitidos siguen visibles en lugar de recurrir silenciosamente a un valor alternativo; el reintento solo cubre errores de modelo no disponible.
</Warning>

<Note>
La política de fases, los umbrales y el comportamiento de almacenamiento son detalles internos de implementación (no configuración orientada al usuario). Consulta la [referencia de configuración de memoria](/es/reference/memory-config#dreaming) para la lista completa de claves.
</Note>

## UI de Dreams

Cuando está habilitada, la pestaña **Dreams** del Gateway muestra:

- estado actual de habilitación de Dreaming
- estado por fase y presencia de barrido administrado
- conteos de corto plazo, fundamentados, de señal y promovidos hoy
- horario de la próxima ejecución programada
- un carril de Scene fundamentado distinto para entradas preparadas de reproducción histórica
- un lector expandible de Dream Diary respaldado por `doctor.memory.dreamDiary`

## Dreaming nunca se ejecuta: el estado muestra bloqueado

Si `openclaw memory status` informa `Dreaming status: blocked`, el Cron administrado existe, pero el Heartbeat del agente predeterminado no se está ejecutando. Comprueba que Heartbeat esté habilitado para el agente predeterminado y que su destino no sea `none`; luego vuelve a ejecutar `openclaw memory status --deep` después del siguiente intervalo de Heartbeat.

## Relacionado

- [Memoria](/es/concepts/memory)
- [CLI de memoria](/es/cli/memory)
- [Referencia de configuración de memoria](/es/reference/memory-config)
- [Búsqueda de memoria](/es/concepts/memory-search)
