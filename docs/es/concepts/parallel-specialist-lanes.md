---
read_when:
    - Enrutas los chats grupales a agentes dedicados
    - Quieres trabajo en paralelo sin que una tarea larga bloquee todos los chats
    - Estás diseñando una configuración operativa multiagente
sidebarTitle: Specialist lanes
status: active
summary: Ejecuta agentes especialistas en paralelo sin saturar la capacidad compartida del modelo y las herramientas
title: Vías paralelas de especialistas
x-i18n:
    generated_at: "2026-07-11T23:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Los carriles de especialistas en paralelo permiten que un Gateway dirija distintos chats o salas a distintos agentes y, al mismo tiempo, mantenga una experiencia de usuario rápida. Trate el paralelismo como un problema de diseño con recursos escasos, no solo como «más agentes».

## Principios fundamentales

Un carril de especialista solo mejora el rendimiento cuando reduce la contención por los cuellos de botella reales:

- **Bloqueos de sesión**: solo una ejecución debe modificar una sesión determinada a la vez.
- **Capacidad global del modelo**: todas las ejecuciones visibles del chat siguen compartiendo los límites del proveedor.
- **Capacidad de las herramientas**: el trabajo con el shell, el navegador, la red y el repositorio puede ser más lento que el propio turno del modelo.
- **Presupuesto de contexto**: las transcripciones largas hacen que cada turno futuro sea más lento y menos enfocado.
- **Ambigüedad de propiedad**: los agentes duplicados que realizan el mismo trabajo desperdician capacidad.

OpenClaw ya serializa las ejecuciones por sesión y limita el paralelismo global mediante la [cola de comandos](/es/concepts/queue). Los carriles de especialistas añaden una política adicional: qué agente es responsable de cada trabajo, qué permanece en el chat y qué se convierte en trabajo en segundo plano.

## Despliegue recomendado

### Fase 1: contratos de carril y trabajo pesado en segundo plano

Asigne a cada carril un contrato escrito en su espacio de trabajo y en el prompt del sistema:

- **Propósito**: el trabajo que corresponde a este carril.
- **Objetivos excluidos**: el trabajo que debe transferir en lugar de intentar realizar.
- **Presupuesto del chat**: las respuestas rápidas permanecen en el chat; para las tareas largas, se envía una confirmación breve y luego se ejecutan en un subagente o una tarea en segundo plano.
- **Regla de transferencia**: cuando el trabajo corresponda a otro carril, indique adónde debe enviarse y proporcione un resumen conciso para la transferencia.
- **Regla de riesgo de las herramientas**: prefiera la superficie de herramientas más pequeña que pueda realizar el trabajo.

Esta es la fase más económica y resuelve la mayoría de los atascos: un trabajo de programación ya no vuelve extremadamente lento el carril de investigación, y cada chat mantiene limpio su propio contexto.

### Fase 2: controles de prioridad y concurrencia

Ajuste la capacidad de la cola y del modelo según el valor empresarial de cada carril:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Use los chats directos o personales y los agentes de operaciones de producción para el trabajo de alta prioridad. Permita que la investigación, la redacción y la programación por lotes se transfieran a tareas en segundo plano cuando el sistema esté ocupado.

### Fase 3: coordinador/controlador de tráfico

Añada un pequeño patrón de coordinación cuando haya varios carriles activos:

- Lleve un registro de las tareas activas de los carriles y de sus responsables.
- Detecte solicitudes duplicadas entre grupos.
- Dirija los resúmenes de transferencia entre carriles.
- Muestre únicamente los bloqueos, los resultados completados y las decisiones que debe tomar la persona.

No empiece por aquí. Un coordinador sin contratos de carril solo coordina el caos.

## Plantilla mínima de contrato de carril

```md
# Contrato del carril

## Responsabilidades

- <trabajo del que es responsable este carril>

## Fuera de sus responsabilidades

- <trabajo que debe transferirse>

## Presupuesto del chat

- Responder directamente a las preguntas rápidas.
- Para trabajos de varios pasos, lentos o que requieran muchas herramientas: enviar una confirmación breve, iniciar o ejecutar el trabajo en segundo plano y devolver el resultado cuando termine.

## Transferencia

Si la solicitud corresponde a otro carril, responder con:

- carril de destino
- objetivo
- contexto pertinente
- siguiente acción exacta

## Enfoque de uso de herramientas

Usar la superficie de herramientas más pequeña que pueda completar la tarea. Evitar el uso amplio del shell o de la red, salvo que este carril sea responsable explícitamente de ello.
```

## Contenido relacionado

- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Cola de comandos](/es/concepts/queue)
- [Subagentes](/es/tools/subagents)
