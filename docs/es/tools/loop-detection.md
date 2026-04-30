---
read_when:
    - Un usuario informa que los agentes se quedan atascados repitiendo llamadas a herramientas
    - Debe ajustar la protección contra llamadas repetitivas
    - Está editando las políticas de herramientas/tiempo de ejecución del agente
summary: Cómo habilitar y ajustar las barreras de protección que detectan bucles repetitivos de llamadas a herramientas
title: Detección de bucles de herramientas
x-i18n:
    generated_at: "2026-04-30T06:05:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw puede evitar que los agentes se queden atascados en patrones repetidos de llamadas a herramientas.
La protección está **deshabilitada de forma predeterminada**.

Habilítala solo donde sea necesario, porque con ajustes estrictos puede bloquear llamadas repetidas legítimas.

## Por qué existe esto

- Detectar secuencias repetitivas que no avanzan.
- Detectar bucles de alta frecuencia sin resultados (misma herramienta, mismas entradas, errores repetidos).
- Detectar patrones específicos de llamadas repetidas para herramientas de sondeo conocidas.

## Bloque de configuración

Valores globales predeterminados:

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
- `criticalThreshold`: umbral para bloquear patrones de bucles repetitivos.
- `globalCircuitBreakerThreshold`: umbral global del cortacircuitos sin progreso.
- `detectors.genericRepeat`: detecta patrones repetidos de misma herramienta + mismos parámetros.
- `detectors.knownPollNoProgress`: detecta patrones conocidos similares a sondeo sin cambio de estado.
- `detectors.pingPong`: detecta patrones alternos de ping-pong.

Para `exec`, las comprobaciones sin progreso comparan resultados estables de comandos e ignoran metadatos volátiles de tiempo de ejecución como la duración, el PID, el ID de sesión y el directorio de trabajo.
Cuando hay un ID de ejecución disponible, el historial reciente de llamadas a herramientas se evalúa solo dentro de esa ejecución, para que los ciclos de Heartbeat programados y las ejecuciones nuevas no hereden recuentos de bucles obsoletos de ejecuciones anteriores.

## Configuración recomendada

- Empieza con `enabled: true`, sin cambiar los valores predeterminados.
- Mantén los umbrales ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Si se producen falsos positivos:
  - aumenta `warningThreshold` y/o `criticalThreshold`
  - (opcionalmente) aumenta `globalCircuitBreakerThreshold`
  - deshabilita solo el detector que cause problemas
  - reduce `historySize` para un contexto histórico menos estricto

## Registros y comportamiento esperado

Cuando se detecta un bucle, OpenClaw informa de un evento de bucle y bloquea o atenúa el siguiente ciclo de herramientas según la gravedad.
Esto protege a los usuarios contra el gasto descontrolado de tokens y los bloqueos, al tiempo que preserva el acceso normal a las herramientas.

- Prefiere primero la advertencia y la supresión temporal.
- Escala solo cuando se acumule evidencia repetida.

## Notas

- `tools.loopDetection` se combina con anulaciones a nivel de agente.
- La configuración por agente anula o extiende por completo los valores globales.
- Si no existe ninguna configuración, las protecciones permanecen desactivadas.

## Relacionado

- [Aprobaciones de Exec](/es/tools/exec-approvals)
- [Niveles de razonamiento](/es/tools/thinking)
- [Subagentes](/es/tools/subagents)
