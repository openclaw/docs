---
read_when:
    - Un usuario informa que los agentes se quedan atascados repitiendo llamadas a herramientas
    - Debes ajustar la protección contra llamadas repetitivas
    - Estás editando las políticas de herramientas/entorno de ejecución del agente
    - Se producen abortos de `compaction_loop_persisted` después de un reintento por desbordamiento de contexto
summary: Cómo habilitar y ajustar las medidas de protección que detectan bucles repetitivos de llamadas a herramientas
title: Detección de bucles de herramientas
x-i18n:
    generated_at: "2026-07-11T23:39:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw dispone de dos mecanismos de protección que cooperan contra patrones repetitivos de llamadas a herramientas,
ambos configurados en `tools.loopDetection`:

1. **Detección de bucles** (`enabled`): desactivada de forma predeterminada. Supervisa el historial reciente
   de llamadas a herramientas para detectar patrones repetidos y reintentos de herramientas desconocidas.
2. **Protección posterior a Compaction** (`postCompactionGuard`): activada siempre que
   `enabled` no sea explícitamente `false`. Se activa después de cada reintento de Compaction y
   cancela la ejecución si el agente repite la misma terna `(tool, args, result)`
   dentro de la ventana.

Establezca `tools.loopDetection.enabled: false` para desactivar ambos mecanismos de protección.

## Por qué existe

- Detectar secuencias repetitivas que no producen ningún avance.
- Detectar bucles de alta frecuencia sin resultados (misma herramienta, mismas entradas y
  errores repetidos).
- Detectar patrones específicos de llamadas repetidas para herramientas de sondeo conocidas.
- Interrumpir los ciclos de desbordamiento de contexto -> Compaction -> mismo bucle, en lugar de permitir que
  se ejecuten indefinidamente.

## Bloque de configuración

Valores predeterminados globales, con todos los campos documentados:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // interruptor principal de los detectores basados en el historial reciente
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
        windowSize: 3, // se activa tras un reintento de Compaction; se ejecuta salvo que enabled sea explícitamente false
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

La configuración de cada agente se superpone al bloque global campo por campo (incluidos
`detectors` y `postCompactionGuard` anidados), por lo que un agente solo necesita definir los
campos que desea modificar.

### Comportamiento de los campos

| Campo                            | Valor predeterminado | Efecto                                                                                                                                                                              |
| -------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`              | Interruptor principal de los detectores basados en el historial reciente. `false` también desactiva la protección posterior a Compaction.                                          |
| `historySize`                    | `30`                 | Número de llamadas recientes a herramientas que se conservan para su análisis.                                                                                                     |
| `warningThreshold`               | `10`                 | Número de repeticiones antes de que un patrón se clasifique únicamente como advertencia.                                                                                            |
| `criticalThreshold`              | `20`                 | Número de repeticiones necesario para bloquear un patrón de bucle sin avances. Si la configuración es incorrecta, el entorno de ejecución lo ajusta por encima de `warningThreshold`. |
| `unknownToolThreshold`           | `10`                 | Bloquea las llamadas repetidas a la misma herramienta no disponible después de este número de fallos. No depende de `detectors`.                                                    |
| `globalCircuitBreakerThreshold`  | `30`                 | Interruptor global de bucles sin avances para todos los detectores. Si la configuración es incorrecta, el entorno de ejecución lo ajusta por encima de `criticalThreshold`. No depende de `detectors`. |
| `detectors.genericRepeat`        | `true`               | Advierte sobre llamadas repetidas con la misma herramienta y los mismos argumentos; las bloquea cuando también devuelven resultados idénticos.                                     |
| `detectors.knownPollNoProgress`  | `true`               | Detecta patrones conocidos de sondeo sin avances (`process` con `action: "poll"`/`"log"`, `command_status`).                                                                        |
| `detectors.pingPong`             | `true`               | Detecta patrones alternos de ping-pong sin avances entre dos llamadas.                                                                                                              |
| `postCompactionGuard.windowSize` | `3`                  | Número de intentos durante los que la protección permanece activa después de Compaction y número de ternas idénticas que cancela la ejecución.                                      |

Para `exec`, el hash de ausencia de avances compara resultados estables del comando (estado,
código de salida, indicador de tiempo agotado y salida) e ignora metadatos volátiles del entorno de ejecución, como
la duración, el PID, el identificador de sesión y el directorio de trabajo. Los resultados del envío de mensajes
salientes se procesan mediante hash después de eliminar los identificadores volátiles de cada llamada (identificador del mensaje, identificador del archivo y marca de tiempo),
de modo que un resultado "enviado" no parezca idéntico a otro resultado "enviado"
distinto. Cuando hay un identificador de ejecución disponible, el historial solo se evalúa dentro de esa ejecución,
por lo que los ciclos programados de Heartbeat y las ejecuciones nuevas no heredan recuentos de bucles obsoletos
de ejecuciones anteriores.

## Configuración recomendada

- Para modelos más pequeños, establezca `enabled: true` y conserve los umbrales
  predeterminados. Los modelos principales rara vez necesitan detección basada en el historial reciente y pueden
  mantener el interruptor principal en `false` sin dejar de beneficiarse de la
  protección posterior a Compaction.
- Mantenga los umbrales ordenados como `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`; el entorno de ejecución incrementa `criticalThreshold` y
  `globalCircuitBreakerThreshold` si los establece en un valor igual o inferior al
  umbral que deben superar.
- Si se producen falsos positivos:
  - Aumente `warningThreshold` o `criticalThreshold`, o ambos.
  - Opcionalmente, aumente `globalCircuitBreakerThreshold`.
  - Desactive únicamente el detector específico que cause problemas (`detectors.<name>: false`).
  - Reduzca `historySize` para acortar la ventana del historial.
- Para desactivar todo, incluida la protección posterior a Compaction, establezca
  explícitamente `tools.loopDetection.enabled: false`.

## Protección posterior a Compaction

Después de un reintento de Compaction tras un desbordamiento de contexto, el ejecutor activa una
protección de ventana corta para las siguientes llamadas a herramientas. Si el agente emite la misma
terna `(toolName, argsHash, resultHash)` `postCompactionGuard.windowSize`
veces dentro de esa ventana, la protección concluye que Compaction no interrumpió el
bucle y cancela la ejecución con un error `compaction_loop_persisted`.

La protección está controlada por el indicador principal `tools.loopDetection.enabled`, con una
particularidad: permanece **activada cuando el indicador no está definido o es `true`** y solo se
desactiva cuando el indicador es explícitamente `false`. Esto es intencional: la protección
existe para salir de bucles de Compaction que, de otro modo, consumirían una cantidad ilimitada de tokens,
por lo que un usuario sin configuración también recibe esta protección.

```json5
{
  tools: {
    loopDetection: {
      // interruptor principal; establézcalo en false para desactivar la protección junto con los detectores basados en el historial reciente
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // valor predeterminado
      },
    },
  },
}
```

- Un valor menor de `windowSize` es más estricto (menos intentos antes de la cancelación).
- Un valor mayor de `windowSize` proporciona al agente más intentos de recuperación.
- La protección nunca cancela la ejecución mientras los resultados cambien; solo la activan los resultados
  idénticos byte por byte en toda la ventana.
- Solo se activa inmediatamente después de un reintento de Compaction, no en otros
  puntos de una ejecución.

<Note>
  La protección posterior a Compaction se ejecuta siempre que el indicador principal no sea explícitamente `false`, incluso si nunca ha definido un bloque `tools.loopDetection`. Para verificarlo, busque `post-compaction guard armed for N attempts` en el registro del Gateway inmediatamente después de un evento de Compaction.
</Note>

## Registros y comportamiento esperado

Cuando se detecta un bucle, OpenClaw registra un evento de bucle y advierte o bloquea
el siguiente ciclo de herramientas según la gravedad, lo que protege frente al consumo descontrolado de
tokens y los bloqueos, a la vez que conserva el acceso normal a las herramientas.

- Primero se emiten advertencias.
- El bloqueo se produce cuando el patrón persiste más allá del umbral de advertencia.
- Los umbrales críticos bloquean el siguiente ciclo de herramientas y muestran un motivo claro
  de detección de bucle en el registro de la ejecución.
- La protección posterior a Compaction emite errores `compaction_loop_persisted` que indican
  la herramienta responsable y el número de llamadas idénticas.

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Aprobaciones de ejecución" href="/es/tools/exec-approvals" icon="shield">
    Política de autorización y denegación para la ejecución en el shell.
  </Card>
  <Card title="Niveles de razonamiento" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento e interacción con las políticas del proveedor.
  </Card>
  <Card title="Subagentes" href="/es/tools/subagents" icon="users">
    Creación de agentes aislados para limitar comportamientos descontrolados.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-tools#toolsloopdetection" icon="gear">
    Esquema completo de `tools.loopDetection` y semántica de combinación.
  </Card>
</CardGroup>
