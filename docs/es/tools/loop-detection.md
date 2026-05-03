---
read_when:
    - Un usuario informa que los agentes se quedan atascados repitiendo llamadas a herramientas
    - Debe ajustar la protección contra llamadas repetitivas
    - Está editando las políticas de herramientas/tiempo de ejecución del agente
summary: Cómo habilitar y ajustar las barreras de protección que detectan bucles repetitivos de llamadas a herramientas
title: Detección de bucles de herramientas
x-i18n:
    generated_at: "2026-05-03T21:38:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw puede evitar que los agentes queden atrapados en patrones repetidos de llamadas a herramientas.
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

Sobrescritura por agente (opcional):

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
- `historySize`: número de llamadas recientes a herramientas conservadas para el análisis.
- `warningThreshold`: umbral antes de clasificar un patrón como solo de advertencia.
- `criticalThreshold`: umbral para bloquear patrones de bucles repetitivos.
- `globalCircuitBreakerThreshold`: umbral global del interruptor de circuito sin avance.
- `detectors.genericRepeat`: detecta patrones repetidos de misma herramienta + mismos parámetros.
- `detectors.knownPollNoProgress`: detecta patrones conocidos similares al sondeo sin cambio de estado.
- `detectors.pingPong`: detecta patrones alternos de ping-pong.

Para `exec`, las comprobaciones sin avance comparan resultados estables de comandos e ignoran metadatos volátiles del tiempo de ejecución, como duración, PID, ID de sesión y directorio de trabajo.
Cuando hay un ID de ejecución disponible, el historial reciente de llamadas a herramientas se evalúa solo dentro de esa ejecución, de modo que los ciclos programados de Heartbeat y las ejecuciones nuevas no hereden recuentos de bucles obsoletos de ejecuciones anteriores.

## Configuración recomendada

- Para modelos más pequeños, empieza con `enabled: true` y deja los valores predeterminados sin cambios. Los modelos insignia rara vez necesitan detección de bucles y pueden dejarla deshabilitada.
- Mantén los umbrales ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Si se producen falsos positivos:
  - aumenta `warningThreshold` o `criticalThreshold`
  - opcionalmente, aumenta `globalCircuitBreakerThreshold`
  - deshabilita solo el detector que cause problemas
  - reduce `historySize` para un contexto histórico menos estricto

## Registros y comportamiento esperado

Cuando se detecta un bucle, OpenClaw informa un evento de bucle y bloquea o atenúa el siguiente ciclo de herramientas según la gravedad.
Esto protege a los usuarios contra el gasto descontrolado de tokens y los bloqueos, a la vez que preserva el acceso normal a las herramientas.

- Prefiere primero la advertencia y la supresión temporal.
- Escala solo cuando se acumule evidencia repetida.

## Notas

- `tools.loopDetection` se combina con sobrescrituras a nivel de agente.
- La configuración por agente sobrescribe o amplía por completo los valores globales.
- Si no existe ninguna configuración, las barreras de protección permanecen desactivadas.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals)
- [Niveles de razonamiento](/es/tools/thinking)
- [Subagentes](/es/tools/subagents)
