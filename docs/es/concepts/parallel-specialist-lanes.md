---
read_when:
    - Enrutas los chats grupales a agentes dedicados
    - Quieres trabajar en paralelo sin que una tarea larga bloquee todos los chats
    - Estás diseñando una configuración de operaciones multiagente
sidebarTitle: Specialist lanes
status: active
summary: Ejecuta agentes especializados en paralelo sin saturar la capacidad compartida de modelos y herramientas
title: Líneas paralelas de especialistas
x-i18n:
    generated_at: "2026-05-11T20:32:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Los carriles de especialistas en paralelo permiten que un Gateway enrute diferentes chats o salas a
diferentes agentes, manteniendo rápida la experiencia del usuario. El truco es tratar
el paralelismo como un problema de diseño de recursos escasos, no solo como "más agentes".

## Primeros principios

Un carril de especialista solo mejora el rendimiento cuando reduce la contención por los
cuellos de botella reales:

- **Bloqueos de sesión**: solo una ejecución debe modificar una sesión determinada a la vez.
- **Capacidad global del modelo**: todas las ejecuciones de chat visibles siguen compartiendo los límites del proveedor.
- **Capacidad de herramientas**: el trabajo de shell, navegador, red y repositorio puede ser más lento
  que el propio turno del modelo.
- **Presupuesto de contexto**: las transcripciones largas hacen que cada turno futuro sea más lento y menos
  enfocado.
- **Ambigüedad de propiedad**: agentes duplicados haciendo el mismo trabajo desperdician capacidad.

OpenClaw ya serializa las ejecuciones por sesión y limita el paralelismo global mediante
la [cola de comandos](/es/concepts/queue). Los carriles de especialistas añaden una política encima:
qué agente es dueño de qué trabajo, qué permanece en el chat y qué se convierte en trabajo en segundo plano.

## Despliegue recomendado

### Fase 1: contratos de carril + trabajo pesado en segundo plano

Dale a cada carril un contrato escrito en su espacio de trabajo y en el prompt del sistema:

- **Propósito**: el trabajo del que este carril es dueño.
- **No objetivos**: trabajo que debe traspasar en lugar de intentar.
- **Presupuesto de chat**: las respuestas rápidas permanecen en el chat; las tareas largas deben acusar recibo
  brevemente y luego ejecutarse en un subagente o tarea en segundo plano.
- **Regla de traspaso**: cuando otro carril es dueño del trabajo, indica a dónde debe ir y
  proporciona un resumen compacto de traspaso.
- **Regla de riesgo de herramientas**: prefiere la superficie de herramientas más pequeña que pueda hacer el trabajo.

Esta es la fase más barata y corrige la mayor parte de los atascos: un trabajo de programación ya no
convierte el carril de investigación en melaza, y cada chat mantiene limpio su propio contexto.

### Fase 2: controles de prioridad y concurrencia

Ajusta la capacidad de cola y modelo en torno al valor de negocio de cada carril:

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

Usa chats directos/personales y agentes de operaciones de producción para el trabajo de alta prioridad. Deja que
la investigación, la redacción y la programación por lotes pasen a tareas en segundo plano cuando el sistema esté
ocupado.

### Fase 3: coordinador / controlador de tráfico

Añade un pequeño patrón de coordinador una vez que haya varios carriles activos:

- Hacer seguimiento de las tareas y responsables de carril activos.
- Detectar solicitudes duplicadas entre grupos.
- Enrutar resúmenes de traspaso entre carriles.
- Mostrar solo bloqueos, resultados completados y decisiones que deba tomar la persona.

No empieces aquí. Un coordinador sin contratos de carril solo coordina el caos.

## Plantilla mínima de contrato de carril

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## Relacionado

- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Cola de comandos](/es/concepts/queue)
- [Subagentes](/es/tools/subagents)
