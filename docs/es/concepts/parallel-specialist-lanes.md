---
read_when:
    - Diriges chats grupales a agentes dedicados
    - Quieres trabajo en paralelo sin que una tarea larga bloquee todas las conversaciones
    - Estás diseñando una configuración de operaciones multiagente
sidebarTitle: Specialist lanes
status: active
summary: Ejecuta agentes especializados en paralelo sin saturar la capacidad compartida de modelos y herramientas
title: Líneas paralelas de especialistas
x-i18n:
    generated_at: "2026-05-02T20:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Los carriles especializados paralelos permiten que un Gateway enrute distintos chats o salas a
distintos agentes, manteniendo rápida la experiencia del usuario. El truco consiste en tratar
el paralelismo como un problema de diseño de recursos escasos, no solo como "más agentes".

## Principios básicos

Un carril especializado solo mejora el rendimiento cuando reduce la contención de los
cuellos de botella reales:

- **Bloqueos de sesión**: solo una ejecución debe modificar una sesión determinada a la vez.
- **Capacidad global del modelo**: todas las ejecuciones visibles de chat siguen compartiendo los límites del proveedor.
- **Capacidad de herramientas**: el trabajo con shell, navegador, red y repositorio puede ser más lento
  que el propio turno del modelo.
- **Presupuesto de contexto**: las transcripciones largas hacen que cada turno futuro sea más lento y menos
  enfocado.
- **Ambigüedad de propiedad**: los agentes duplicados que hacen el mismo trabajo desperdician capacidad.

OpenClaw ya serializa las ejecuciones por sesión y limita el paralelismo global mediante
la [cola de comandos](/es/concepts/queue). Los carriles especializados añaden una política encima:
qué agente es propietario de qué trabajo, qué permanece en el chat y qué pasa a ser trabajo en segundo plano.

## Despliegue recomendado

### Fase 1: contratos de carril + trabajo pesado en segundo plano

Dale a cada carril un contrato escrito en su espacio de trabajo y prompt del sistema:

- **Propósito**: el trabajo del que es propietario este carril.
- **No objetivos**: trabajo que debe transferir en lugar de intentar hacer.
- **Presupuesto de chat**: las respuestas rápidas permanecen en el chat; las tareas largas deben confirmarse
  brevemente y luego ejecutarse en un subagente o tarea en segundo plano.
- **Regla de transferencia**: cuando otro carril es propietario del trabajo, indica a dónde debe ir y
  proporciona un resumen compacto de transferencia.
- **Regla de riesgo de herramientas**: prefiere la superficie de herramientas más pequeña que pueda hacer el trabajo.

Esta es la fase más barata y corrige la mayor parte de los atascos: un trabajo de programación ya no
convierte el carril de investigación en melaza, y cada chat mantiene limpio su propio contexto.

### Fase 2: controles de prioridad y concurrencia

Ajusta la cola y la capacidad del modelo según el valor empresarial de cada carril:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
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

Usa chats directos/personales y agentes de operaciones de producción para el trabajo de alta prioridad. Deja
que la investigación, la redacción y la programación por lotes pasen a tareas en segundo plano cuando el sistema esté
ocupado.

### Fase 3: coordinador / controlador de tráfico

Añade un patrón de coordinador pequeño cuando haya varios carriles activos:

- Hacer seguimiento de las tareas y propietarios activos de los carriles.
- Detectar solicitudes duplicadas entre grupos.
- Enrutar resúmenes de transferencia entre carriles.
- Mostrar solo bloqueos, resultados completados y decisiones que el humano debe tomar.

No empieces por aquí. Un coordinador sin contratos de carril solo coordina el caos.

## Plantilla mínima de contrato de carril

```md
# Contrato de carril

## Propiedad

- <trabajo del que este carril es responsable>

## No es propietario de

- <trabajo que se debe transferir>

## Presupuesto de chat

- Responde directamente las preguntas rápidas.
- Para trabajo de varios pasos, lento o intensivo en herramientas: confirma brevemente, genera/envía a segundo plano
  el trabajo y luego devuelve el resultado cuando esté completo.

## Transferencia

Si otro carril es propietario de la solicitud, responde con:

- carril de destino
- objetivo
- contexto relevante
- siguiente acción exacta

## Postura de herramientas

Usa la superficie de herramientas más pequeña que pueda completar la tarea. Evita trabajo amplio con shell o
red salvo que este carril sea explícitamente propietario de ello.
```

## Relacionado

- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Cola de comandos](/es/concepts/queue)
- [Subagentes](/es/tools/subagents)
