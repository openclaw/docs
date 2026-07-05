---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Quieres ajustar la consolidación sin contaminar MEMORY.md
sidebarTitle: Dreaming
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un Diario de Sueños
title: Dreaming
x-i18n:
    generated_at: "2026-07-05T11:13:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 220b41de84a3cecf932f1409faa7e53f17c3845fa90f4b67f5add6e224196aae
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`. Traslada señales fuertes de corto plazo a la memoria duradera mientras mantiene el proceso explicable y revisable.

<Note>
Dreaming es **opt-in** y está desactivado de forma predeterminada.
</Note>

## Qué escribe dreaming

- **Estado de la máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingesta, bloqueos).
- **Salida legible por humanos** en `DREAMS.md` (o un `dreams.md` existente) y archivos opcionales de informe de fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming ejecuta tres fases cooperativas por barrido, en orden: ligera -> REM -> profunda. Estas son fases internas de implementación, no modos separados configurados por el usuario.

| Fase | Propósito                                   | Escritura duradera     |
| ----- | ----------------------------------------- | ----------------- |
| Ligera | Ordenar y preparar material reciente de corto plazo | No                |
| REM   | Reflexionar sobre temas e ideas recurrentes     | No                |
| Profunda  | Puntuar y promover candidatos duraderos      | Sí (`MEMORY.md`) |

<AccordionGroup>
  <Accordion title="Fase ligera">
    - Lee el estado reciente de recuperación de corto plazo, archivos diarios de memoria y transcripciones de sesión redactadas cuando están disponibles.
    - Deduplica señales y prepara líneas candidatas.
    - Escribe un bloque gestionado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo para la clasificación profunda posterior.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase REM">
    - Crea resúmenes de temas y reflexiones a partir de trazas recientes de corto plazo.
    - Escribe un bloque gestionado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo REM usadas por la clasificación profunda.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase profunda">
    - Clasifica candidatos con puntuación ponderada y puertas de umbral (`minScore`, `minRecallCount`, `minUniqueQueries` deben cumplirse todas).
    - Rehidrata fragmentos desde archivos diarios activos antes de escribir, por lo que se omiten fragmentos obsoletos o eliminados.
    - Anexa entradas promovidas a `MEMORY.md`.
    - Escribe un resumen `## Deep Sleep` en `DREAMS.md` y, opcionalmente, en `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Ingesta de transcripciones de sesión

Dreaming puede ingerir transcripciones de sesión redactadas en el corpus de dreaming. Cuando están disponibles, las transcripciones alimentan la fase ligera junto con señales de memoria diaria y trazas de recuperación. El contenido personal y sensible se redacta antes de la ingesta.

## Diario de sueños

Dreaming mantiene un **Diario de sueños** narrativo en `DREAMS.md`. Después de que cada fase tenga material suficiente, `memory-core` ejecuta un turno de subagente en segundo plano con el mejor esfuerzo y anexa una entrada breve de diario, usando el modelo de runtime predeterminado a menos que `dreaming.model` esté configurado. Si el modelo configurado no está disponible, la ejecución del diario reintenta una vez con el modelo predeterminado de la sesión; los fallos de confianza o de lista de permitidos no se reintentan y permanecen visibles en los registros en lugar de volver silenciosamente a una entrada genérica de diario.

<Note>
El diario es para lectura humana en la IU de Sueños, no una fuente de promoción. Los artefactos de diario/informe se excluyen de la promoción de corto plazo; solo los fragmentos de memoria fundamentados son elegibles para promoverse a `MEMORY.md`.
</Note>

También hay un carril de relleno histórico fundamentado para trabajos de revisión y recuperación:

<AccordionGroup>
  <Accordion title="Comandos de relleno">
    - `memory rem-harness --path ... --grounded` previsualiza salida de diario fundamentada a partir de notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` escribe entradas reversibles de diario fundamentado en `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencia de corto plazo que usa la fase profunda normal.
    - `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de relleno preparados sin tocar entradas ordinarias de diario ni la recuperación activa de corto plazo.

  </Accordion>
</AccordionGroup>

La IU de Control expone el mismo flujo de relleno/restablecimiento de diario para que puedas inspeccionar resultados en la escena de Sueños antes de decidir si los candidatos fundamentados merecen promoción. Un carril de escena fundamentada distinto muestra qué entradas de corto plazo preparadas provinieron de reproducción histórica, qué elementos promovidos fueron dirigidos por fundamentación y te permite borrar solo entradas preparadas exclusivamente fundamentadas sin tocar el estado activo de corto plazo.

## Señales de clasificación profunda

La clasificación profunda usa seis señales base ponderadas más refuerzo de fase:

| Señal              | Peso | Descripción                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Relevancia           | 0.30   | Calidad media de recuperación para la entrada           |
| Frecuencia           | 0.24   | Cuántas señales de corto plazo acumuló la entrada |
| Diversidad de consultas     | 0.15   | Contextos distintos de consulta/día que la hicieron aparecer      |
| Recencia             | 0.15   | Puntuación de frescura con decaimiento temporal                      |
| Consolidación       | 0.10   | Fuerza de recurrencia de varios días                     |
| Riqueza conceptual | 0.06   | Densidad de etiquetas conceptuales del fragmento/ruta             |

Los aciertos de las fases ligera y REM añaden un pequeño impulso con decaimiento por recencia desde `memory/.dreams/phase-signals.json`.

Los resultados de pruebas sombra pueden superponerse a la puntuación base como una señal de revisión antes de cualquier escritura duradera: una prueba útil da a un candidato un pequeño impulso acotado, una prueba neutral lo mantiene diferido y una prueba dañina lo marca como rechazado para esa pasada de puntuación. Esta señal es solo de informe: puede cambiar el orden de candidatos o los metadatos de revisión, pero nunca escribe en `MEMORY.md` ni promueve un candidato por sí sola.

### Cobertura de informes de pruebas sombra de QA

QA Lab incluye un escenario solo de informe para explorar cómo una futura prueba sombra de dreaming podría revisar una memoria candidata antes de la promoción: un agente compara una respuesta de referencia con una respuesta que puede usar la memoria candidata y luego escribe un informe local con un veredicto, motivo y marcas de riesgo. Esta cobertura está limitada a QA: verifica que el artefacto de informe permanezca separado de `MEMORY.md` y que el agente nunca afirme que el candidato fue promovido. No añade comportamiento de pruebas sombra en producción ni cambia el motor de promoción de fase profunda.

El ejecutor de pruebas sombra de `memory-core` mantiene el mismo contrato solo de informe para rutas de código que necesitan un artefacto estable. Acepta el candidato, la instrucción de prueba, el resultado de referencia, el resultado del candidato, el veredicto, el motivo, las marcas de riesgo y las referencias de evidencia, y luego escribe un informe con `promotion action: report-only`. Los veredictos útiles se asignan a una recomendación `promote`, los veredictos neutrales se asignan a `defer` y los veredictos dañinos se asignan a `reject`; ninguno de ellos escribe en `MEMORY.md` ni aplica promoción de fase profunda.

## Programación

Cuando está habilitado, `memory-core` autogestiona un trabajo Cron para un barrido completo de dreaming, deduplicado entre el espacio de trabajo principal del runtime y cualquier espacio de trabajo de agente configurado, de modo que la expansión a espacios de trabajo de subagentes no excluya el `DREAMS.md` ni el estado de memoria del agente principal.

| Ajuste              | Predeterminado       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | modelo predeterminado |

## Inicio rápido

<Tabs>
  <Tab title="Habilitar dreaming">
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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` y `/dreaming off` requieren estado de propietario para llamadores de canal u `operator.admin` para clientes de Gateway. `/dreaming status` y `/dreaming help` son de solo lectura.

## Flujo de trabajo de CLI

<Tabs>
  <Tab title="Vista previa / aplicación de promoción">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manual usa los umbrales de fase profunda de forma predeterminada, a menos que se sobrescriban con flags de CLI.

  </Tab>
  <Tab title="Explicar promoción">
    Explica por qué un candidato específico se promovería o no:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Vista previa del arnés REM">
    Previsualiza reflexiones REM, verdades candidatas y salida de promoción profunda sin escribir nada:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valores predeterminados clave

Todos los ajustes viven en `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Habilita o deshabilita el barrido de dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadencia Cron para el barrido completo de dreaming.
</ParamField>
<ParamField path="model" type="string">
  Sobrescritura opcional del modelo de subagente del Diario de sueños. Usa un valor canónico `provider/model` cuando también configures una lista de permitidos `allowedModels` de subagente.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Recuento máximo estimado de tokens conservado de cada fragmento de recuperación de corto plazo promovido a `MEMORY.md`. La procedencia de clasificación sigue visible.
</ParamField>

<Warning>
`dreaming.model` requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringirlo, configura también `plugins.entries.memory-core.subagent.allowedModels`. El reintento automático solo cubre errores de modelo no disponible; los fallos de confianza o lista de permitidos permanecen visibles en los registros en lugar de volver silenciosamente.
</Warning>

<Note>
La mayor parte de la política de fases, los umbrales y el comportamiento de almacenamiento son detalles internos de implementación. Consulta [Referencia de configuración de memoria](/es/reference/memory-config#dreaming) para ver la lista completa de claves.
</Note>

## IU de Sueños

Cuando está habilitada, la pestaña **Sueños** de Gateway muestra:

- estado actual de habilitación de dreaming
- estado a nivel de fase y presencia de barrido gestionado
- recuentos de corto plazo, fundamentados, de señales y promovidos hoy
- momento de la próxima ejecución programada
- un carril de escena fundamentada distinto para entradas de reproducción histórica preparadas
- un lector expandible del Diario de sueños respaldado por `doctor.memory.dreamDiary`

## Relacionado

- [Memoria](/es/concepts/memory)
- [CLI de memoria](/es/cli/memory)
- [Referencia de configuración de memoria](/es/reference/memory-config)
- [Búsqueda de memoria](/es/concepts/memory-search)
