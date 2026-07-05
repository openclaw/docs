---
read_when:
    - Un usuario informa que los agentes se quedan atascados repitiendo llamadas a herramientas
    - Necesitas ajustar la protección contra llamadas repetitivas
    - Estás editando políticas de herramientas/tiempo de ejecución de agentes
    - Encontraste cancelaciones `compaction_loop_persisted` después de un reintento por desbordamiento de contexto
summary: Cómo activar y ajustar las medidas de protección que detectan bucles repetitivos de llamadas a herramientas
title: Detección de bucles de herramientas
x-i18n:
    generated_at: "2026-07-05T11:45:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw tiene dos barreras de protección cooperativas contra patrones repetitivos de llamadas a herramientas,
ambas configuradas en `tools.loopDetection`:

1. **Detección de bucles** (`enabled`) - deshabilitada de forma predeterminada. Vigila el historial
   móvil de llamadas a herramientas en busca de patrones repetidos y reintentos de herramientas desconocidas.
2. **Protección posterior a la Compaction** (`postCompactionGuard`) - habilitada siempre que
   `enabled` no sea explícitamente `false`. Se activa después de cada reintento de Compaction y
   aborta la ejecución si el agente repite la misma tripleta `(tool, args, result)`
   dentro de la ventana.

Establece `tools.loopDetection.enabled: false` para silenciar ambas barreras de protección.

## Por qué existe

- Detectar secuencias repetitivas que no avanzan.
- Detectar bucles de alta frecuencia sin resultados (misma herramienta, mismas entradas, errores
  repetidos).
- Detectar patrones específicos de llamadas repetidas para herramientas de sondeo conocidas.
- Romper ciclos de desbordamiento de contexto -> Compaction -> mismo bucle en lugar de dejarlos
  ejecutarse indefinidamente.

## Bloque de configuración

Valores predeterminados globales, con todos los campos documentados mostrados:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // interruptor principal para los detectores de historial móvil
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
        windowSize: 3, // se activa después del reintento de Compaction; se ejecuta salvo que enabled sea explícitamente false
      },
    },
  },
}
```

Anulación por agente (opcional, en `agents.list[].tools.loopDetection`):

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

La configuración por agente se superpone al bloque global campo por campo (incluidos los anidados
`detectors` y `postCompactionGuard`), por lo que un agente solo necesita definir los
campos que quiere cambiar.

### Comportamiento de los campos

| Campo                            | Predeterminado | Efecto                                                                                                                                     |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false`        | Interruptor principal para los detectores de historial móvil. `false` también deshabilita la protección posterior a la Compaction.         |
| `historySize`                    | `30`           | Número de llamadas recientes a herramientas que se conservan para el análisis.                                                             |
| `warningThreshold`               | `10`           | Recuento de repeticiones antes de que un patrón se clasifique solo como advertencia.                                                       |
| `criticalThreshold`              | `20`           | Recuento de repeticiones para bloquear un patrón de bucle sin avance. El runtime lo limita por encima de `warningThreshold` si está mal configurado. |
| `unknownToolThreshold`           | `10`           | Bloquea llamadas repetidas a la misma herramienta no disponible después de este número de fallos. No está controlado por `detectors`.       |
| `globalCircuitBreakerThreshold`  | `30`           | Disyuntor global sin avance en todos los detectores. El runtime lo limita por encima de `criticalThreshold` si está mal configurado. No está controlado por `detectors`. |
| `detectors.genericRepeat`        | `true`         | Advierte sobre llamadas repetidas con la misma herramienta y los mismos argumentos; bloquea cuando esas llamadas también devuelven resultados idénticos. |
| `detectors.knownPollNoProgress`  | `true`         | Detecta patrones de sondeo conocidos sin avance (`process` con `action: "poll"`/`"log"`, `command_status`).                               |
| `detectors.pingPong`             | `true`         | Detecta patrones alternos de ping-pong sin avance entre dos llamadas.                                                                      |
| `postCompactionGuard.windowSize` | `3`            | Intentos durante los cuales la protección permanece activa después de la Compaction, y el recuento de tripletas idénticas que aborta la ejecución. |

Para `exec`, el hash sin avance compara resultados estables del comando (estado,
código de salida, marca de tiempo agotado, salida) e ignora metadatos volátiles del runtime como
duración, PID, ID de sesión y directorio de trabajo. Los resultados de envío de mensajes salientes
se calculan con los identificadores volátiles por llamada (ID de mensaje, ID de archivo, marca de tiempo)
eliminados, por lo que un resultado "sent" no parece idéntico a otro resultado "sent"
diferente. Cuando hay un ID de ejecución disponible, el historial se evalúa solo dentro de esa ejecución,
por lo que los ciclos programados de Heartbeat y las ejecuciones nuevas no heredan recuentos de bucle obsoletos
de ejecuciones anteriores.

## Configuración recomendada

- Para modelos más pequeños, establece `enabled: true` y deja los umbrales en sus
  valores predeterminados. Los modelos insignia rara vez necesitan detección de historial móvil y pueden
  dejar el interruptor principal en `false` mientras siguen beneficiándose de la
  protección posterior a la Compaction.
- Mantén los umbrales ordenados como `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`; el runtime aumenta `criticalThreshold` y
  `globalCircuitBreakerThreshold` si los defines en el umbral que deben superar o por debajo de él.
- Si se producen falsos positivos:
  - Aumenta `warningThreshold` y/o `criticalThreshold`.
  - Opcionalmente, aumenta `globalCircuitBreakerThreshold`.
  - Deshabilita solo el detector específico que causa problemas (`detectors.<name>: false`).
  - Reduce `historySize` para una ventana histórica más corta.
- Para deshabilitarlo todo, incluida la protección posterior a la Compaction, establece
  `tools.loopDetection.enabled: false` explícitamente.

## Protección posterior a la Compaction

Después de un reintento de Compaction tras un desbordamiento de contexto, el ejecutor activa una
protección de ventana corta sobre las siguientes llamadas a herramientas. Si el agente emite la misma
tripleta `(toolName, argsHash, resultHash)` `postCompactionGuard.windowSize`
veces dentro de esa ventana, la protección concluye que la Compaction no rompió el
bucle y aborta la ejecución con un error `compaction_loop_persisted`.

La protección está controlada por la marca principal `tools.loopDetection.enabled` con un
matiz: permanece **habilitada cuando la marca no está definida o es `true`**, y solo se
desactiva cuando la marca es explícitamente `false`. Esto es intencional: la protección
existe para escapar de bucles de Compaction que de otro modo consumirían tokens sin límite,
por lo que un usuario sin configuración sigue recibiendo la protección.

```json5
{
  tools: {
    loopDetection: {
      // interruptor principal; establece false para deshabilitar la protección junto con los detectores móviles
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // predeterminado
      },
    },
  },
}
```

- Un `windowSize` más bajo es más estricto (menos intentos antes de abortar).
- Un `windowSize` más alto le da al agente más intentos de recuperación.
- La protección nunca aborta mientras los resultados cambian; solo la activan
  resultados idénticos byte a byte en toda la ventana.
- Solo se activa inmediatamente después de un reintento de Compaction, no en otros
  puntos de una ejecución.

<Note>
  La protección posterior a la Compaction se ejecuta siempre que la marca principal no sea explícitamente `false`, incluso si nunca escribiste un bloque `tools.loopDetection`. Para verificarlo, busca `post-compaction guard armed for N attempts` en el registro del Gateway inmediatamente después de un evento de Compaction.
</Note>

## Registros y comportamiento esperado

Cuando se detecta un bucle, OpenClaw registra un evento de bucle y advierte o bloquea
el siguiente ciclo de herramientas según la gravedad, protegiendo contra el gasto descontrolado de tokens
y bloqueos mientras preserva el acceso normal a herramientas.

- Las advertencias llegan primero.
- El bloqueo sigue cuando un patrón persiste más allá del umbral de advertencia.
- Los umbrales críticos bloquean el siguiente ciclo de herramientas y muestran una razón clara
  de detección de bucle en el registro de la ejecución.
- La protección posterior a la Compaction emite errores `compaction_loop_persisted` que nombran
  la herramienta infractora y el recuento de llamadas idénticas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Aprobaciones de exec" href="/es/tools/exec-approvals" icon="shield">
    Política de permitir/denegar para la ejecución de shell.
  </Card>
  <Card title="Niveles de pensamiento" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento e interacción con la política del proveedor.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    Generación de agentes aislados para limitar comportamientos descontrolados.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-tools#toolsloopdetection" icon="gear">
    Esquema completo de `tools.loopDetection` y semántica de combinación.
  </Card>
</CardGroup>
