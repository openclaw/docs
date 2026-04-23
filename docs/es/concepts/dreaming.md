---
read_when:
    - Quiere que la promoción de memoria se ejecute automáticamente
    - Quiere entender qué hace cada fase de Dreaming
    - Quiere ajustar la consolidación sin contaminar `MEMORY.md`
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un Diario de Sueños
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T14:02:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`.
Ayuda a OpenClaw a mover señales fuertes de corto plazo a memoria duradera mientras
mantiene el proceso explicable y revisable.

Dreaming es **opt-in** y está deshabilitado de forma predeterminada.

## Qué escribe Dreaming

Dreaming mantiene dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuerdo, señales de fase, puntos de control de ingestión, bloqueos).
- **Salida legible por humanos** en `DREAMS.md` (o `dreams.md` existente) y archivos opcionales de informe de fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming usa tres fases cooperativas:

| Fase | Propósito                                      | Escritura duradera |
| ----- | ---------------------------------------------- | ------------------ |
| Ligera | Ordenar y preparar material reciente de corto plazo | No                 |
| Profunda  | Puntuar y promover candidatos duraderos         | Sí (`MEMORY.md`)   |
| REM   | Reflexionar sobre temas e ideas recurrentes    | No                 |

Estas fases son detalles internos de implementación, no “modos”
separados configurables por el usuario.

### Fase ligera

La fase ligera ingiere señales recientes de memoria diaria y trazas de recuerdo, las deduplica
y prepara líneas candidatas.

- Lee del estado de recuerdo a corto plazo, archivos recientes de memoria diaria y transcripciones redactadas de sesiones cuando están disponibles.
- Escribe un bloque gestionado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo para una clasificación profunda posterior.
- Nunca escribe en `MEMORY.md`.

### Fase profunda

La fase profunda decide qué pasa a ser memoria a largo plazo.

- Clasifica candidatos usando puntuación ponderada y umbrales de control.
- Requiere que se cumplan `minScore`, `minRecallCount` y `minUniqueQueries`.
- Rehidrata fragmentos desde archivos diarios activos antes de escribir, por lo que los fragmentos obsoletos/eliminados se omiten.
- Agrega entradas promovidas a `MEMORY.md`.
- Escribe un resumen `## Deep Sleep` en `DREAMS.md` y opcionalmente escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM extrae patrones y señales reflexivas.

- Construye resúmenes de temas y reflexiones a partir de trazas recientes de corto plazo.
- Escribe un bloque gestionado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo REM usadas por la clasificación profunda.
- Nunca escribe en `MEMORY.md`.

## Ingestión de transcripciones de sesión

Dreaming puede ingerir transcripciones redactadas de sesiones en el corpus de Dreaming. Cuando
las transcripciones están disponibles, se incorporan a la fase ligera junto con señales de
memoria diaria y trazas de recuerdo. El contenido personal y sensible se redacta
antes de la ingestión.

## Dream Diary

Dreaming también mantiene un **Dream Diary** narrativo en `DREAMS.md`.
Después de que cada fase tiene suficiente material, `memory-core` ejecuta un turno
de subagente en segundo plano de mejor esfuerzo (usando el modelo de ejecución predeterminado)
y agrega una entrada breve del diario.

Este diario es para lectura humana en la UI de Dreams, no una fuente de promoción.
Los artefactos de diario/informe generados por Dreaming se excluyen de la promoción
a corto plazo. Solo los fragmentos de memoria fundamentados son aptos para promoverse a
`MEMORY.md`.

También existe un carril de relleno histórico fundamentado para trabajo de revisión y recuperación:

- `memory rem-harness --path ... --grounded` previsualiza salida fundamentada del diario a partir de notas históricas `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` escribe entradas fundamentadas reversibles del diario en `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencia de corto plazo que la fase profunda normal ya usa.
- `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos preparados de relleno sin tocar entradas normales del diario ni el recuerdo activo normal de corto plazo.

La UI de Control expone el mismo flujo de relleno/restablecimiento del diario para que pueda inspeccionar
los resultados en la escena Dreams antes de decidir si los candidatos fundamentados
merecen promoción. La escena también muestra un carril fundamentado distinto para que pueda ver
qué entradas preparadas de corto plazo provinieron de una reproducción histórica, qué elementos promovidos
fueron guiados por lo fundamentado y borrar solo entradas preparadas solo fundamentadas sin
tocar el estado normal activo de corto plazo.

## Señales de clasificación profunda

La clasificación profunda usa seis señales base ponderadas más refuerzo de fase:

| Señal              | Peso | Descripción                                         |
| ------------------ | ---- | --------------------------------------------------- |
| Frecuencia         | 0.24 | Cuántas señales de corto plazo acumuló la entrada   |
| Relevancia         | 0.30 | Calidad media de recuperación de la entrada         |
| Diversidad de consultas | 0.15 | Contextos distintos de consulta/día que la mostraron |
| Recencia           | 0.15 | Puntuación de frescura con decaimiento temporal     |
| Consolidación      | 0.10 | Intensidad de recurrencia en varios días            |
| Riqueza conceptual | 0.06 | Densidad de etiquetas conceptuales de fragmento/ruta |

Los aciertos de fase ligera y REM añaden un pequeño impulso con decaimiento por recencia desde
`memory/.dreams/phase-signals.json`.

## Programación

Cuando está habilitado, `memory-core` gestiona automáticamente un trabajo de Cron para un barrido
completo de Dreaming. Cada barrido ejecuta las fases en orden: ligera -> REM -> profunda.

Comportamiento de cadencia predeterminado:

| Configuración        | Predeterminado |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |

## Inicio rápido

Habilitar Dreaming:

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

Habilitar Dreaming con una cadencia de barrido personalizada:

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

## Comando slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flujo de trabajo de CLI

Use la promoción por CLI para previsualizar o aplicar manualmente:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` manual usa de forma predeterminada los umbrales de la fase profunda a menos que se sobrescriban
con indicadores de CLI.

Explique por qué un candidato específico se promovería o no:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Previsualice reflexiones REM, verdades candidatas y salida de promoción profunda sin
escribir nada:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valores predeterminados clave

Todos los ajustes viven en `plugins.entries.memory-core.config.dreaming`.

| Clave       | Predeterminado |
| ----------- | -------------- |
| `enabled`   | `false`        |
| `frequency` | `0 3 * * *`    |

La política de fases, los umbrales y el comportamiento de almacenamiento son detalles internos
de implementación (no configuración orientada al usuario).

Consulte [Referencia de configuración de memoria](/es/reference/memory-config#dreaming)
para la lista completa de claves.

## UI de Dreams

Cuando está habilitada, la pestaña **Dreams** del Gateway muestra:

- estado actual de Dreaming habilitado
- estado por fase y presencia de barrido gestionado
- recuentos de corto plazo, fundamentados, señales y promovidos hoy
- momento de la siguiente ejecución programada
- un carril de escena fundamentado distinto para entradas preparadas de reproducción histórica
- un lector expandible de Dream Diary respaldado por `doctor.memory.dreamDiary`

## Solución de problemas

### Dreaming nunca se ejecuta (el estado muestra blocked)

El Cron gestionado de Dreaming depende del Heartbeat del agente predeterminado. Si el Heartbeat no se activa para ese agente, el Cron pone en cola un evento del sistema que nadie consume y Dreaming silenciosamente no se ejecuta. Tanto `openclaw memory status` como `/dreaming status` informarán `blocked` en ese caso y nombrarán al agente cuyo Heartbeat es el bloqueo.

Dos causas comunes:

- Otro agente declara un bloque `heartbeat:` explícito. Cuando cualquier entrada en `agents.list` tiene su propio bloque `heartbeat`, solo esos agentes generan Heartbeat: los valores predeterminados dejan de aplicarse a todos los demás, por lo que el agente predeterminado puede quedar silencioso. Mueva la configuración de Heartbeat a `agents.defaults.heartbeat`, o agregue un bloque `heartbeat` explícito en el agente predeterminado. Consulte [Ámbito y precedencia](/es/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` es `0`, está vacío o no se puede analizar. El Cron no tiene intervalo para programarse, por lo que el Heartbeat está efectivamente deshabilitado. Configure `every` con una duración positiva como `30m`. Consulte [Valores predeterminados](/es/gateway/heartbeat#defaults).

## Relacionado

- [Heartbeat](/es/gateway/heartbeat)
- [Memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [CLI de memory](/es/cli/memory)
- [Referencia de configuración de memoria](/es/reference/memory-config)
