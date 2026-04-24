---
read_when:
    - Un usuario informa de que los agentes se quedan atascados repitiendo llamadas a herramientas
    - Necesitas ajustar la protección contra llamadas repetitivas
    - Estás editando políticas de herramientas/runtime del agente
summary: Cómo habilitar y ajustar las barreras de protección que detectan bucles repetitivos de llamadas a herramientas
title: Detección de bucles de herramientas
x-i18n:
    generated_at: "2026-04-24T05:55:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f5824d511ec33eb1f46c77250cb779b5e3bd5b3e5f16fab9e6c0b67297f87df
    source_path: tools/loop-detection.md
    workflow: 15
---

OpenClaw puede evitar que los agentes se queden atascados en patrones repetidos de llamadas a herramientas.
La protección está **desactivada por defecto**.

Actívala solo donde haga falta, porque con ajustes estrictos puede bloquear llamadas repetidas legítimas.

## Por qué existe esto

- Detectar secuencias repetitivas que no avanzan.
- Detectar bucles de alta frecuencia sin resultado (misma herramienta, mismas entradas, errores repetidos).
- Detectar patrones específicos de llamadas repetidas para herramientas conocidas de sondeo.

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
- `historySize`: número de llamadas recientes a herramientas que se conservan para el análisis.
- `warningThreshold`: umbral antes de clasificar un patrón como solo advertencia.
- `criticalThreshold`: umbral para bloquear patrones repetitivos de bucle.
- `globalCircuitBreakerThreshold`: umbral global del cortacircuitos sin progreso.
- `detectors.genericRepeat`: detecta patrones repetidos de misma herramienta + mismos parámetros.
- `detectors.knownPollNoProgress`: detecta patrones conocidos tipo sondeo sin cambio de estado.
- `detectors.pingPong`: detecta patrones alternantes de ping-pong.

## Configuración recomendada

- Empieza con `enabled: true` y deja los valores predeterminados sin cambios.
- Mantén los umbrales ordenados como `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Si hay falsos positivos:
  - aumenta `warningThreshold` y/o `criticalThreshold`
  - (opcionalmente) aumenta `globalCircuitBreakerThreshold`
  - desactiva solo el detector que esté causando problemas
  - reduce `historySize` para tener un contexto histórico menos estricto

## Registros y comportamiento esperado

Cuando se detecta un bucle, OpenClaw informa un evento de bucle y bloquea o amortigua el siguiente ciclo de herramientas según la severidad.
Esto protege a los usuarios frente a gasto descontrolado de tokens y bloqueos, preservando al mismo tiempo el acceso normal a herramientas.

- Prefiere primero la advertencia y la supresión temporal.
- Escala solo cuando se acumula evidencia repetida.

## Notas

- `tools.loopDetection` se fusiona con las sobrescrituras a nivel de agente.
- La configuración por agente sobrescribe completamente o amplía los valores globales.
- Si no existe ninguna configuración, las barreras de protección permanecen desactivadas.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals)
- [Niveles de thinking](/es/tools/thinking)
- [Subagentes](/es/tools/subagents)
