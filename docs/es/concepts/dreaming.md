---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Quieres ajustar la consolidación sin contaminar `MEMORY.md`
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un Diario de sueños
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T05:25:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a2a399259e1ec9db52f761308686c7d6d377fd21528b77a9057fa690802c3db
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`.
Ayuda a OpenClaw a mover señales fuertes de corto plazo a memoria duradera mientras
mantiene el proceso explicable y revisable.

Dreaming es **opt-in** y está deshabilitado de forma predeterminada.

## Qué escribe Dreaming

Dreaming mantiene dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recall, señales de fase, checkpoints de ingesta, bloqueos).
- **Salida legible por humanos** en `DREAMS.md` (o el `dreams.md` existente) y archivos de informe de fase opcionales en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming usa tres fases cooperativas:

| Fase | Propósito                                 | Escritura duradera |
| ----- | ----------------------------------------- | ------------------ |
| Light | Ordenar y preparar material reciente de corto plazo | No         |
| Deep  | Puntuar y promover candidatos duraderos   | Sí (`MEMORY.md`)   |
| REM   | Reflexionar sobre temas e ideas recurrentes | No               |

Estas fases son detalles internos de implementación, no “modos”
configurados por el usuario por separado.

### Fase Light

La fase Light ingiere señales recientes de memoria diaria y trazas de recall, las deduplica
y prepara líneas candidatas.

- Lee desde el estado de recall de corto plazo, archivos recientes de memoria diaria y transcripciones de sesión redactadas cuando están disponibles.
- Escribe un bloque gestionado `## Light Sleep` cuando el almacenamiento incluye salida inline.
- Registra señales de refuerzo para el posterior ranking deep.
- Nunca escribe en `MEMORY.md`.

### Fase Deep

La fase Deep decide qué se convierte en memoria a largo plazo.

- Clasifica candidatos usando puntuación ponderada y umbrales de control.
- Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` se cumplan.
- Rehidrata fragmentos desde archivos diarios activos antes de escribir, por lo que los fragmentos obsoletos/eliminados se omiten.
- Añade entradas promovidas a `MEMORY.md`.
- Escribe un resumen `## Deep Sleep` en `DREAMS.md` y opcionalmente escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM extrae patrones y señales reflexivas.

- Construye resúmenes de temas y reflexiones a partir de trazas recientes de corto plazo.
- Escribe un bloque gestionado `## REM Sleep` cuando el almacenamiento incluye salida inline.
- Registra señales de refuerzo REM usadas por el ranking deep.
- Nunca escribe en `MEMORY.md`.

## Ingesta de transcripciones de sesión

Dreaming puede ingerir transcripciones de sesión redactadas en el corpus de dreaming. Cuando
las transcripciones están disponibles, se incorporan a la fase Light junto con señales de
memoria diaria y trazas de recall. El contenido personal y sensible se redacta
antes de la ingesta.

## Diario de sueños

Dreaming también mantiene un **Diario de sueños** narrativo en `DREAMS.md`.
Después de que cada fase tenga suficiente material, `memory-core` ejecuta un turno en segundo plano best-effort
de subagente (usando el modelo de runtime predeterminado) y añade una breve entrada de diario.

Este diario es para lectura humana en la UI de Dreams, no una fuente de promoción.
Los artefactos de diario/informe generados por dreaming se excluyen de la
promoción de corto plazo. Solo los fragmentos de memoria fundamentados son elegibles para promoverse a
`MEMORY.md`.

También hay una ruta de backfill histórico fundamentado para trabajo de revisión y recuperación:

- `memory rem-harness --path ... --grounded` previsualiza la salida de diario fundamentado a partir de notas históricas `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` escribe entradas reversibles de diario fundamentado en `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencias de corto plazo que ya usa la fase deep normal.
- `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de backfill preparados sin tocar entradas normales del diario ni el recall activo normal de corto plazo.

La UI de control expone el mismo flujo de backfill/restablecimiento del diario para que puedas inspeccionar
los resultados en la escena Dreams antes de decidir si los candidatos fundamentados
merecen promoción. La escena también muestra una ruta fundamentada diferenciada para que puedas ver
qué entradas preparadas de corto plazo proceden de reproducción histórica, qué elementos promovidos fueron guiados por datos fundamentados y limpiar solo entradas preparadas exclusivamente fundamentadas sin
tocar el estado normal activo de corto plazo.

## Señales de ranking deep

El ranking deep usa seis señales base ponderadas más refuerzo por fase:

| Señal               | Peso | Descripción                                       |
| ------------------- | ---- | ------------------------------------------------- |
| Frecuencia          | 0.24 | Cuántas señales de corto plazo acumuló la entrada |
| Relevancia          | 0.30 | Calidad media de recuperación de la entrada       |
| Diversidad de consultas | 0.15 | Contextos distintos de consulta/día en los que apareció |
| Recencia            | 0.15 | Puntuación de frescura con decaimiento temporal   |
| Consolidación       | 0.10 | Fuerza de recurrencia en varios días              |
| Riqueza conceptual  | 0.06 | Densidad de etiquetas conceptuales del fragmento/ruta |

Los aciertos de las fases Light y REM añaden un pequeño impulso con decaimiento temporal desde
`memory/.dreams/phase-signals.json`.

## Programación

Cuando está habilitado, `memory-core` gestiona automáticamente un trabajo de Cron para un barrido completo de dreaming. Cada barrido ejecuta las fases en orden: light -> REM -> deep.

Comportamiento predeterminado de cadencia:

| Configuración        | Predeterminado |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |

## Inicio rápido

Habilitar dreaming:

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

Habilitar dreaming con una cadencia de barrido personalizada:

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

Usa la promoción por CLI para previsualizar o aplicar manualmente:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` manual usa los umbrales de la fase deep de forma predeterminada salvo que se sobrescriban
con flags de CLI.

Explica por qué un candidato específico se promovería o no:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Previsualiza reflexiones REM, verdades candidatas y salida de promoción deep sin
escribir nada:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valores predeterminados clave

Toda la configuración vive bajo `plugins.entries.memory-core.config.dreaming`.

| Clave       | Predeterminado |
| ----------- | -------------- |
| `enabled`   | `false`        |
| `frequency` | `0 3 * * *`    |

La política de fases, los umbrales y el comportamiento de almacenamiento son detalles internos de implementación
(no configuración orientada al usuario).

Consulta [Referencia de configuración de Memory](/es/reference/memory-config#dreaming)
para la lista completa de claves.

## UI de Dreams

Cuando está habilitada, la pestaña **Dreams** del Gateway muestra:

- estado actual de habilitación de dreaming
- estado a nivel de fase y presencia de barrido gestionado
- recuentos de corto plazo, fundamentados, señales y promovidos hoy
- hora de la siguiente ejecución programada
- una ruta diferenciada en la Scene para entradas preparadas de reproducción histórica fundamentada
- un lector expandible de Diario de sueños respaldado por `doctor.memory.dreamDiary`

## Solución de problemas

### Dreaming nunca se ejecuta (el estado muestra blocked)

El Cron gestionado de dreaming depende del Heartbeat del agente predeterminado. Si el Heartbeat no se activa para ese agente, el Cron pone en cola un evento del sistema que nadie consume y dreaming silenciosamente no se ejecuta. Tanto `openclaw memory status` como `/dreaming status` informarán `blocked` en ese caso y nombrarán el agente cuyo Heartbeat es el bloqueo.

Dos causas comunes:

- Otro agente declara un bloque `heartbeat:` explícito. Cuando cualquier entrada en `agents.list` tiene su propio bloque `heartbeat`, solo esos agentes generan Heartbeat; los valores predeterminados dejan de aplicarse a todos los demás, por lo que el agente predeterminado puede quedar inactivo. Mueve la configuración de Heartbeat a `agents.defaults.heartbeat`, o añade un bloque `heartbeat` explícito al agente predeterminado. Consulta [Ámbito y precedencia](/es/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` es `0`, está vacío o no se puede interpretar. El Cron no tiene intervalo para programarse, así que el Heartbeat queda efectivamente deshabilitado. Configura `every` con una duración positiva como `30m`. Consulta [Valores predeterminados](/es/gateway/heartbeat#defaults).

## Relacionado

- [Heartbeat](/es/gateway/heartbeat)
- [Memory](/es/concepts/memory)
- [Memory Search](/es/concepts/memory-search)
- [CLI de memory](/es/cli/memory)
- [Referencia de configuración de Memory](/es/reference/memory-config)
