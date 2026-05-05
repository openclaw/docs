---
read_when:
    - Un usuario informa que los agentes se quedan atascados repitiendo llamadas a herramientas
    - Debes ajustar la protección contra llamadas repetitivas
    - Estás editando las políticas de herramientas/entorno de ejecución del agente
summary: Cómo habilitar y ajustar las protecciones que detectan bucles repetitivos de llamadas a herramientas
title: Detección de bucles de herramientas
x-i18n:
    generated_at: "2026-05-05T01:49:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw puede evitar que los agentes se queden atascados en patrones repetidos de llamadas a herramientas.
La protección está **desactivada de forma predeterminada**.

Actívala solo donde sea necesario, porque puede bloquear llamadas repetidas legítimas con configuraciones estrictas.

## Por qué existe

- Detectar secuencias repetitivas que no progresan.
- Detectar bucles de alta frecuencia sin resultados (misma herramienta, mismas entradas, errores repetidos).
- Detectar patrones específicos de llamadas repetidas para herramientas de sondeo conocidas.

## Bloque de configuración

Valores predeterminados globales:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
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

- `enabled`: interruptor principal. `false` significa que no se realiza detección de bucles.
- `historySize`: número de llamadas recientes a herramientas conservadas para análisis.
- `warningThreshold`: umbral antes de clasificar un patrón como solo advertencia.
- `criticalThreshold`: umbral para bloquear patrones de bucle repetitivos.
- `globalCircuitBreakerThreshold`: umbral global del interruptor de circuito sin progreso.
- `detectors.genericRepeat`: detecta patrones repetidos de misma herramienta + mismos parámetros.
- `detectors.knownPollNoProgress`: detecta patrones conocidos similares a sondeo sin cambio de estado.
- `detectors.pingPong`: detecta patrones alternos de ping-pong.

Para `exec`, las comprobaciones de ausencia de progreso comparan resultados estables de comandos e ignoran metadatos volátiles de ejecución como duración, PID, ID de sesión y directorio de trabajo.
Cuando hay un ID de ejecución disponible, el historial reciente de llamadas a herramientas se evalúa solo dentro de esa ejecución, para que los ciclos de Heartbeat programados y las ejecuciones nuevas no hereden conteos de bucles obsoletos de ejecuciones anteriores.

## Configuración recomendada

- Para modelos más pequeños, empieza con `enabled: true`, sin cambiar los valores predeterminados. Los modelos insignia rara vez necesitan detección de bucles y pueden dejarla desactivada.
- Mantén los umbrales ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Si se producen falsos positivos:
  - aumenta `warningThreshold` y/o `criticalThreshold`
  - (opcionalmente) aumenta `globalCircuitBreakerThreshold`
  - desactiva solo el detector que cause problemas
  - reduce `historySize` para un contexto histórico menos estricto

## Protección posterior a Compaction

Cuando el ejecutor completa un reintento automático de Compaction (después de un desbordamiento de contexto), activa una protección de ventana breve que observa las siguientes llamadas a herramientas. Si el agente emite la _misma_ terna `(toolName, args, result)` varias veces dentro de esa ventana, la protección concluye que Compaction no rompió el bucle y aborta la ejecución con un error `compaction_loop_persisted`.

Esta es una ruta de código separada de los detectores globales de `tools.loopDetection`. Se puede configurar de forma independiente:

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: número de llamadas a herramientas posteriores a Compaction durante las cuales la protección permanece activa _y_ el conteo de ternas idénticas (herramienta, argumentos, resultado) que desencadena un aborto.

La protección nunca aborta cuando los resultados están cambiando, solo cuando los resultados son byte a byte idénticos en toda la ventana. Es intencionadamente estrecha: se activa solo inmediatamente después de un reintento de Compaction.

## Registros y comportamiento esperado

Cuando se detecta un bucle, OpenClaw informa un evento de bucle y bloquea o atenúa el siguiente ciclo de herramienta según la gravedad.
Esto protege a los usuarios del gasto descontrolado de tokens y de bloqueos, a la vez que conserva el acceso normal a las herramientas.

- Prefiere primero la advertencia y la supresión temporal.
- Escala solo cuando se acumula evidencia repetida.

## Notas

- `tools.loopDetection` se fusiona con anulaciones de nivel de agente.
- La configuración por agente anula o amplía por completo los valores globales.
- Si no existe configuración, las barreras de protección permanecen desactivadas.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals)
- [Niveles de razonamiento](/es/tools/thinking)
- [Subagentes](/es/tools/subagents)
