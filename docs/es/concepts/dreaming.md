---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Quieres ajustar la consolidación sin contaminar `MEMORY.md`
summary: Consolidación de memoria en segundo plano con fases ligeras, profundas y REM, además de un Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T08:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming es el sistema de consolidación de memoria en segundo plano en `memory-core`.
Ayuda a OpenClaw a mover señales sólidas de corto plazo hacia memoria duradera mientras
mantiene el proceso explicable y revisable.

Dreaming es **opt-in** y está desactivado de forma predeterminada.

## Qué escribe Dreaming

Dreaming mantiene dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingestión, bloqueos).
- **Salida legible para humanos** en `DREAMS.md` (o el existente `dreams.md`) y archivos de informe de fase opcionales en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming usa tres fases cooperativas:

| Fase | Propósito                                    | Escritura duradera |
| ----- | -------------------------------------------- | ------------------ |
| Ligera | Ordenar y preparar material reciente de corto plazo | No                 |
| Profunda | Puntuar y promover candidatos duraderos      | Sí (`MEMORY.md`)   |
| REM   | Reflexionar sobre temas e ideas recurrentes  | No                 |

Estas fases son detalles internos de implementación, no "modos"
separados configurados por el usuario.

### Fase ligera

La fase ligera ingiere señales recientes de memoria diaria y rastros de recuperación, los deduplica
y prepara líneas candidatas.

- Lee del estado de recuperación de corto plazo, archivos recientes de memoria diaria y transcripciones de sesión redactadas cuando están disponibles.
- Escribe un bloque gestionado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo para una clasificación profunda posterior.
- Nunca escribe en `MEMORY.md`.

### Fase profunda

La fase profunda decide qué pasa a ser memoria a largo plazo.

- Clasifica candidatos usando puntuación ponderada y umbrales de validación.
- Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` se cumplan.
- Rehidrata fragmentos desde archivos diarios activos antes de escribir, por lo que los fragmentos obsoletos o eliminados se omiten.
- Añade entradas promovidas a `MEMORY.md`.
- Escribe un resumen `## Deep Sleep` en `DREAMS.md` y opcionalmente escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM extrae patrones y señales reflexivas.

- Construye resúmenes de temas y reflexiones a partir de rastros recientes de corto plazo.
- Escribe un bloque gestionado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo REM usadas por la clasificación profunda.
- Nunca escribe en `MEMORY.md`.

## Ingestión de transcripciones de sesión

Dreaming puede ingerir transcripciones de sesión redactadas en el corpus de Dreaming. Cuando
las transcripciones están disponibles, se incorporan en la fase ligera junto con las señales de
memoria diaria y los rastros de recuperación. El contenido personal y sensible se redacta
antes de la ingestión.

## Dream Diary

Dreaming también mantiene un **Dream Diary** narrativo en `DREAMS.md`.
Después de que cada fase tiene suficiente material, `memory-core` ejecuta un turno de
subagente en segundo plano de mejor esfuerzo (usando el modelo de runtime predeterminado) y añade una entrada breve del diario.

Este diario es para lectura humana en la IU de Dreams, no una fuente de promoción.
Los artefactos de diario/informe generados por Dreaming se excluyen de la
promoción de corto plazo. Solo los fragmentos de memoria fundamentados son aptos para promoverse a
`MEMORY.md`.

También hay una vía de relleno histórico fundamentado para trabajo de revisión y recuperación:

- `memory rem-harness --path ... --grounded` previsualiza la salida del diario fundamentado a partir de notas históricas `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` escribe entradas reversibles de diario fundamentado en `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencia de corto plazo que la fase profunda normal ya usa.
- `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de relleno preparados sin tocar entradas ordinarias del diario ni la recuperación activa normal de corto plazo.

La IU de Control expone el mismo flujo de relleno/restablecimiento del diario para que puedas inspeccionar
los resultados en la escena de Dreams antes de decidir si los candidatos fundamentados
merecen promoción. La escena también muestra una vía fundamentada diferenciada para que puedas ver
qué entradas preparadas de corto plazo provinieron de una reproducción histórica, qué elementos promovidos estuvieron guiados por fundamentación, y borrar solo las entradas preparadas fundamentadas sin
tocar el estado ordinario activo de corto plazo.

## Señales de clasificación profunda

La clasificación profunda usa seis señales base ponderadas más refuerzo de fase:

| Señal              | Peso | Descripción                                       |
| ------------------ | ---- | ------------------------------------------------- |
| Frecuencia         | 0.24 | Cuántas señales de corto plazo acumuló la entrada |
| Relevancia         | 0.30 | Calidad promedio de recuperación de la entrada    |
| Diversidad de consultas | 0.15 | Contextos distintos de consulta/día que la mostraron |
| Recencia           | 0.15 | Puntuación de frescura con decaimiento temporal   |
| Consolidación      | 0.10 | Fuerza de recurrencia en varios días              |
| Riqueza conceptual | 0.06 | Densidad de etiquetas conceptuales del fragmento/ruta |

Los aciertos de las fases ligera y REM añaden un pequeño impulso con decaimiento por recencia desde
`memory/.dreams/phase-signals.json`.

## Programación

Cuando está activado, `memory-core` gestiona automáticamente un trabajo Cron para un barrido completo de
Dreaming. Cada barrido ejecuta las fases en orden: ligera -> REM -> profunda.

Comportamiento de cadencia predeterminado:

| Ajuste               | Predeterminado |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |

## Inicio rápido

Activar Dreaming:

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

Activar Dreaming con una cadencia de barrido personalizada:

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

## Comando de barra

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flujo de trabajo de CLI

Usa la promoción de CLI para previsualizar o aplicar manualmente:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` manual usa los umbrales de la fase profunda de forma predeterminada, a menos que se sobrescriban
con indicadores de CLI.

Explica por qué un candidato específico se promovería o no se promovería:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Previsualiza reflexiones REM, verdades candidatas y salida de promoción profunda sin
escribir nada:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valores predeterminados clave

Todos los ajustes viven bajo `plugins.entries.memory-core.config.dreaming`.

| Clave       | Predeterminado |
| ----------- | -------------- |
| `enabled`   | `false`        |
| `frequency` | `0 3 * * *`    |

La política de fases, los umbrales y el comportamiento de almacenamiento son detalles
internos de implementación (no configuración orientada al usuario).

Consulta la [referencia de configuración de Memory](/es/reference/memory-config#dreaming)
para la lista completa de claves.

## IU de Dreams

Cuando está activado, la pestaña **Dreams** de Gateway muestra:

- estado actual de activación de Dreaming
- estado por fase y presencia de barrido gestionado
- recuentos de corto plazo, fundamentados, señales y promovidos hoy
- hora de la siguiente ejecución programada
- una vía fundamentada diferenciada en la escena para entradas preparadas de reproducción histórica
- un lector expandible de Dream Diary respaldado por `doctor.memory.dreamDiary`

## Relacionado

- [Memory](/es/concepts/memory)
- [Memory Search](/es/concepts/memory-search)
- [CLI de memory](/es/cli/memory)
- [referencia de configuración de Memory](/es/reference/memory-config)
