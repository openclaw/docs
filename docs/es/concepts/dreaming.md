---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Quieres ajustar la consolidación sin contaminar MEMORY.md
sidebarTitle: Dreaming
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un diario de sueños
title: Dreaming
x-i18n:
    generated_at: "2026-07-12T14:24:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`. Transfiere las señales sólidas de corto plazo a la memoria duradera, a la vez que mantiene el proceso explicable y revisable.

<Note>
Dreaming es **opcional** y está deshabilitado de forma predeterminada.
</Note>

## Qué escribe Dreaming

- **Estado de la máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingesta y bloqueos).
- **Salida legible para humanos** en `DREAMS.md` (o un archivo `dreams.md` existente) y archivos opcionales de informes de fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo únicamente en `MEMORY.md`.

## Modelo de fases

Dreaming ejecuta tres fases cooperativas por barrido, en este orden: ligera -> REM -> profunda. Son fases internas de implementación, no modos independientes configurados por el usuario.

| Fase     | Propósito                                           | Escritura duradera |
| -------- | --------------------------------------------------- | ------------------ |
| Ligera   | Ordenar y preparar material reciente de corto plazo | No                 |
| REM      | Reflexionar sobre temas e ideas recurrentes         | No                 |
| Profunda | Puntuar y promover candidatos duraderos             | Sí (`MEMORY.md`)   |

<AccordionGroup>
  <Accordion title="Fase ligera">
    - Lee el estado reciente de recuperación a corto plazo, los archivos de memoria diarios y las transcripciones de sesiones con datos confidenciales ocultos cuando están disponibles.
    - Elimina señales duplicadas y prepara líneas candidatas.
    - Escribe un bloque administrado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra señales de refuerzo para la clasificación profunda posterior.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase REM">
    - Genera resúmenes temáticos y reflexivos a partir de rastros recientes de corto plazo.
    - Escribe un bloque administrado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
    - Registra las señales de refuerzo REM utilizadas por la clasificación profunda.
    - Nunca escribe en `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase profunda">
    - Clasifica los candidatos mediante una puntuación ponderada y umbrales de aceptación (`minScore`, `minRecallCount` y `minUniqueQueries` deben superarse).
    - Vuelve a obtener los fragmentos de los archivos diarios activos antes de escribir, por lo que se omiten los fragmentos obsoletos o eliminados.
    - Añade las entradas promovidas a `MEMORY.md`.
    - Escribe un resumen `## Deep Sleep` en `DREAMS.md` y, opcionalmente, en `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Ingesta de transcripciones de sesiones

Dreaming puede incorporar transcripciones de sesiones expurgadas al corpus de Dreaming. Cuando están disponibles, las transcripciones alimentan la fase ligera junto con las señales de memoria diarias y las trazas de recuperación. El contenido personal y sensible se expurga antes de la incorporación.

## Diario de sueños

Dreaming mantiene un **Diario de sueños** narrativo en `DREAMS.md`. Cuando cada fase dispone de suficiente material, `memory-core` ejecuta en segundo plano, sin garantías, un turno de subagente y añade una breve entrada al diario, usando el modelo predeterminado del entorno de ejecución, salvo que se configure `dreaming.model`. Si el modelo configurado no está disponible, la ejecución del diario vuelve a intentarse una vez con el modelo predeterminado de la sesión; los fallos de confianza o de la lista de permitidos no se vuelven a intentar y permanecen visibles en los registros, en lugar de recurrir silenciosamente a una entrada de diario genérica.

<Note>
El diario está destinado a la lectura humana en la interfaz de usuario de Sueños, no es una fuente de promoción. Los artefactos del diario y de los informes se excluyen de la promoción a corto plazo; solo los fragmentos de memoria fundamentados pueden promocionarse a `MEMORY.md`.
</Note>

También existe una vía de relleno histórico fundamentado para las tareas de revisión y recuperación:

<AccordionGroup>
  <Accordion title="Comandos de relleno">
    - `memory rem-harness --path ... --grounded` ofrece una vista previa de la salida fundamentada del diario a partir de notas históricas `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` escribe entradas fundamentadas y reversibles del diario en `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidatos fundamentados y duraderos en el mismo almacén de evidencias a corto plazo que utiliza la fase profunda normal.
    - `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de relleno preparados sin modificar las entradas ordinarias del diario ni la recuperación activa a corto plazo.

  </Accordion>
</AccordionGroup>

La interfaz de usuario de Control presenta el mismo flujo de relleno y restablecimiento del diario en la pestaña Memoria del agente (página Agentes), para poder inspeccionar los resultados en la escena de sueños antes de decidir si los candidatos fundamentados merecen ser promocionados. Una vía diferenciada de Escena fundamentada muestra qué entradas a corto plazo preparadas proceden de una reproducción histórica, qué elementos promocionados se basaron principalmente en datos fundamentados y permite borrar únicamente las entradas preparadas que son exclusivamente fundamentadas, sin modificar el estado activo a corto plazo.

## Señales de clasificación profunda

La clasificación profunda utiliza seis señales base ponderadas, además del refuerzo de fase:

| Señal                 | Peso | Descripción                                              |
| --------------------- | ---- | -------------------------------------------------------- |
| Relevancia            | 0.30 | Calidad media de recuperación de la entrada              |
| Frecuencia            | 0.24 | Número de señales a corto plazo acumuladas por la entrada |
| Diversidad de consultas | 0.15 | Contextos distintos de consulta/día que la hicieron aparecer |
| Actualidad            | 0.15 | Puntuación de vigencia con decaimiento temporal          |
| Consolidación         | 0.10 | Intensidad de recurrencia durante varios días            |
| Riqueza conceptual    | 0.06 | Densidad de etiquetas conceptuales del fragmento/ruta    |

Las coincidencias de las fases ligera y REM añaden un pequeño refuerzo con decaimiento temporal desde `memory/.dreams/phase-signals.json`.

Los resultados de las pruebas paralelas pueden añadirse a la puntuación base como señal de revisión antes de cualquier escritura duradera: una prueba útil proporciona al candidato un pequeño refuerzo acotado, una prueba neutral mantiene su aplazamiento y una prueba perjudicial lo marca como rechazado para esa pasada de puntuación. Esta señal solo se incluye en los informes: puede cambiar el orden de los candidatos o los metadatos de revisión, pero nunca escribe en `MEMORY.md` ni promociona por sí sola a un candidato.

### Cobertura de informes de pruebas paralelas de control de calidad

QA Lab incluye un escenario de solo informe para explorar cómo una futura prueba en paralelo de Dreaming podría revisar una memoria candidata antes de su promoción: un agente compara una respuesta de referencia con una respuesta que puede usar la memoria candidata y, a continuación, escribe un informe local con un veredicto, un motivo e indicadores de riesgo. Esta cobertura se limita al control de calidad: verifica que el artefacto del informe permanezca separado de `MEMORY.md` y que el agente nunca afirme que la candidata fue promovida. No añade comportamiento de pruebas en paralelo en producción ni cambia el motor de promoción de la fase profunda.

El ejecutor de pruebas en paralelo de `memory-core` mantiene el mismo contrato de solo informe para las rutas de código que necesitan un artefacto estable. Acepta la candidata, el prompt de la prueba, el resultado de referencia, el resultado de la candidata, el veredicto, el motivo, los indicadores de riesgo y las referencias de evidencia; después, escribe un informe con `promotion action: report-only`. Los veredictos favorables se asignan a una recomendación `promote`, los neutros a `defer` y los perjudiciales a `reject`; ninguno de ellos escribe en `MEMORY.md` ni aplica la promoción de la fase profunda.

## Programación

Cuando está habilitado, `memory-core` administra automáticamente un trabajo Cron para una ejecución completa de Dreaming, deduplicado entre el espacio de trabajo principal del entorno de ejecución y cualquier espacio de trabajo de agente configurado, de modo que la distribución entre espacios de trabajo de subagentes no excluya el archivo `DREAMS.md` ni el estado de memoria del agente principal.

| Configuración        | Valor predeterminado |
| -------------------- | -------------------- |
| `dreaming.frequency` | `0 3 * * *`          |
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

## Comando con barra diagonal

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` y `/dreaming off` requieren el estado de propietario para quienes invocan desde canales o `operator.admin` para los clientes del Gateway. `/dreaming status` y `/dreaming help` son de solo lectura.

## Flujo de trabajo de la CLI

<Tabs>
  <Tab title="Vista previa o aplicación de la promoción">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    De forma predeterminada, la ejecución manual de `memory promote` usa los umbrales de la fase profunda, salvo que se reemplacen mediante indicadores de la CLI.

  </Tab>
  <Tab title="Explicar la promoción">
    Explica por qué una candidata específica se promovería o no:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Vista previa del entorno de pruebas REM">
    Previsualiza las reflexiones REM, las verdades candidatas y el resultado de la promoción profunda sin escribir nada:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valores predeterminados principales

Todas las opciones se encuentran en `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Habilita o deshabilita la ejecución de Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadencia Cron para la ejecución completa de Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Reemplazo opcional del modelo del subagente Dream Diary. Usa un valor canónico `provider/model` cuando también se configure una lista de permitidos `allowedModels` para el subagente.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Número máximo estimado de tokens que se conserva de cada fragmento de recuperación a corto plazo promovido a `MEMORY.md`. La procedencia de la clasificación permanece visible.
</ParamField>

<Warning>
`dreaming.model` requiere `plugins.entries.memory-core.subagent.allowModelOverride: true`. Para restringirlo, configura también `plugins.entries.memory-core.subagent.allowedModels`. El reintento automático solo abarca los errores de modelo no disponible; los fallos de confianza o de la lista de permitidos permanecen visibles en los registros, en lugar de recurrir silenciosamente a una alternativa.
</Warning>

<Note>
La mayor parte de las políticas de fases, los umbrales y el comportamiento de almacenamiento son detalles internos de implementación. Consulta la [referencia de configuración de memoria](/es/reference/memory-config#dreaming) para ver la lista completa de claves.
</Note>

## Interfaz de Dreams

Cuando está habilitada, la pestaña **Dreams** del Gateway muestra:

- el estado actual de habilitación de Dreaming
- el estado de cada fase y la presencia de la ejecución administrada
- los recuentos de elementos a corto plazo, fundamentados, de señales y promovidos hoy
- la hora de la próxima ejecución programada
- una vía Scene fundamentada e independiente para las entradas preparadas de reproducción histórica
- un lector ampliable de Dream Diary respaldado por `doctor.memory.dreamDiary`

## Temas relacionados

- [Memoria](/es/concepts/memory)
- [CLI de memoria](/es/cli/memory)
- [Referencia de configuración de memoria](/es/reference/memory-config)
- [Búsqueda en memoria](/es/concepts/memory-search)
