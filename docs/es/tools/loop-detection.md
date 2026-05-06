---
read_when:
    - Un usuario informa que los agentes se quedan atascados repitiendo llamadas a herramientas
    - Debes ajustar la protección contra llamadas repetitivas
    - Estás editando políticas de herramientas/tiempo de ejecución de agentes
    - Se producen abortos `compaction_loop_persisted` después de un reintento por desbordamiento de contexto
summary: Cómo habilitar y ajustar las protecciones que detectan bucles repetitivos de llamadas a herramientas
title: Detección de bucles de herramientas
x-i18n:
    generated_at: "2026-05-06T05:52:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw tiene dos protecciones cooperantes para patrones repetitivos de llamadas a herramientas:

1. **Detección de bucles** (`tools.loopDetection.enabled`) — deshabilitada de forma predeterminada. Vigila el historial móvil de llamadas a herramientas para detectar patrones repetidos y reintentos con herramientas desconocidas.
2. **Protección posterior a Compaction** (`tools.loopDetection.postCompactionGuard`) — habilitada de forma predeterminada, a menos que `tools.loopDetection.enabled` sea explícitamente `false`. Se arma después de cada reintento de Compaction y aborta la ejecución cuando el agente emite el mismo triple `(tool, args, result)` dentro de la ventana.

Ambas se configuran en el mismo bloque `tools.loopDetection`, pero la protección posterior a Compaction se ejecuta siempre que el interruptor maestro no esté explícitamente apagado. Establece `tools.loopDetection.enabled: false` para silenciar ambas superficies.

## Por qué existe

- Detectar secuencias repetitivas que no progresan.
- Detectar bucles de alta frecuencia sin resultados (misma herramienta, mismas entradas, errores repetidos).
- Detectar patrones específicos de llamadas repetidas para herramientas de sondeo conocidas.
- Evitar que ciclos de desbordamiento de contexto, luego Compaction y luego el mismo bucle se ejecuten indefinidamente.

## Bloque de configuración

Valores predeterminados globales, con todos los campos documentados mostrados:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
      },
    },
  },
}
```

Anulación por agente (opcional):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Comportamiento de los campos

| Campo                            | Predeterminado | Efecto                                                                                                                          |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`        | Interruptor maestro para los detectores de historial móvil. Establecerlo en `false` también deshabilita la protección posterior a Compaction. |
| `historySize`                    | `30`           | Número de llamadas a herramientas recientes que se conservan para el análisis.                                                  |
| `warningThreshold`               | `10`           | Umbral antes de que un patrón se clasifique solo como advertencia.                                                              |
| `criticalThreshold`              | `20`           | Umbral para bloquear patrones repetitivos de bucle.                                                                             |
| `unknownToolThreshold`           | `10`           | Bloquea llamadas repetidas a la misma herramienta no disponible después de esta cantidad de fallos.                             |
| `globalCircuitBreakerThreshold`  | `30`           | Umbral del disyuntor global sin progreso en todos los detectores.                                                              |
| `detectors.genericRepeat`        | `true`         | Detecta patrones repetidos de misma herramienta + mismos parámetros.                                                           |
| `detectors.knownPollNoProgress`  | `true`         | Detecta patrones conocidos similares a sondeo sin cambio de estado.                                                            |
| `detectors.pingPong`             | `true`         | Detecta patrones alternos de ping-pong.                                                                                        |
| `postCompactionGuard.windowSize` | `3`            | Número de llamadas a herramientas posteriores a Compaction durante las cuales la protección permanece armada, y cantidad de triples idénticos que aborta la ejecución. |

Para `exec`, las comprobaciones sin progreso comparan resultados estables de comandos e ignoran metadatos volátiles de tiempo de ejecución, como duración, PID, ID de sesión y directorio de trabajo. Cuando hay un ID de ejecución disponible, el historial reciente de llamadas a herramientas se evalúa solo dentro de esa ejecución, de modo que los ciclos de Heartbeat programados y las ejecuciones nuevas no hereden conteos de bucles obsoletos de ejecuciones anteriores.

## Configuración recomendada

- Para modelos más pequeños, establece `enabled: true` y deja los umbrales en sus valores predeterminados. Los modelos insignia rara vez necesitan detección de historial móvil y pueden dejar el interruptor maestro en `false` mientras siguen beneficiándose de la protección posterior a Compaction.
- Mantén los umbrales ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Si se producen falsos positivos:
  - Aumenta `warningThreshold` o `criticalThreshold`, o ambos.
  - Opcionalmente, aumenta `globalCircuitBreakerThreshold`.
  - Deshabilita solo el detector específico que causa problemas (`detectors.<name>: false`).
  - Reduce `historySize` para un contexto histórico menos estricto.
- Para deshabilitarlo todo (incluida la protección posterior a Compaction), establece explícitamente `tools.loopDetection.enabled: false`.

## Protección posterior a Compaction

Cuando el ejecutor completa un reintento de Compaction después de un desbordamiento de contexto, arma una protección de ventana corta que vigila las siguientes llamadas a herramientas. Si el agente emite el mismo triple `(toolName, argsHash, resultHash)` varias veces dentro de la ventana, la protección concluye que Compaction no rompió el bucle y aborta la ejecución con un error `compaction_loop_persisted`.

La protección está controlada por la marca maestra `tools.loopDetection.enabled`, con un matiz: permanece **habilitada cuando la marca no está definida o es `true`** y solo se desactiva cuando la marca es explícitamente `false`. Esto es intencional. La protección existe para escapar de bucles de Compaction que, de otro modo, consumirían tokens sin límite, por lo que un usuario sin configuración también recibe la protección.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- Un `windowSize` menor es más estricto (menos intentos antes de abortar).
- Un `windowSize` mayor da al agente más intentos de recuperación.
- La protección nunca aborta cuando los resultados cambian, solo cuando los resultados son idénticos byte a byte en toda la ventana.
- Es intencionalmente estrecha: solo se activa inmediatamente después de un reintento de Compaction.

<Note>
  La protección posterior a Compaction se ejecuta siempre que la marca maestra no sea explícitamente `false`, incluso si nunca escribiste un bloque `tools.loopDetection`. Para verificarlo, busca `post-compaction guard armed for N attempts` en el registro del gateway inmediatamente después de un evento de Compaction.
</Note>

## Registros y comportamiento esperado

Cuando se detecta un bucle, OpenClaw informa un evento de bucle y atenúa o bloquea el siguiente ciclo de herramientas según la gravedad. Esto protege a los usuarios contra gasto descontrolado de tokens y bloqueos, mientras conserva el acceso normal a herramientas.

- Las advertencias llegan primero.
- La supresión sigue cuando los patrones persisten más allá del umbral de advertencia.
- Los umbrales críticos bloquean el siguiente ciclo de herramientas y muestran una razón clara de detección de bucles en el registro de ejecución.
- La protección posterior a Compaction emite errores `compaction_loop_persisted` con el nombre de la herramienta infractora y el conteo de llamadas idénticas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec approvals" href="/es/tools/exec-approvals" icon="shield">
    Política de permitir/denegar para ejecución de shell.
  </Card>
  <Card title="Thinking levels" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento e interacción con la política del proveedor.
  </Card>
  <Card title="Sub-agents" href="/es/tools/subagents" icon="users">
    Creación de agentes aislados para limitar comportamientos descontrolados.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de `tools.loopDetection` y semántica de fusión.
  </Card>
</CardGroup>
