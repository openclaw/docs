---
doc-schema-version: 1
read_when:
    - Decidir cómo automatizar el trabajo con OpenClaw
    - Elegir entre Heartbeat, Cron, compromisos, hooks y órdenes permanentes
    - Buscando el punto de entrada de automatización adecuado
summary: 'Descripción general de los mecanismos de automatización: tareas, Cron, puntos de enlace, órdenes permanentes y flujo de tareas'
title: Automatización
x-i18n:
    generated_at: "2026-07-05T11:01:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 210f2a33012e854e48aa145c665e16e7ffe861c91a2566507e81d809bb2b955c
    source_path: automation/index.md
    workflow: 16
---

OpenClaw ejecuta trabajo en segundo plano mediante tareas, trabajos programados, compromisos inferidos, hooks de eventos e instrucciones permanentes. Usa esta página para elegir el mecanismo adecuado.

## Guía rápida de decisión

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Caso de uso                                      | Recomendado                    | Por qué                                           |
| ----------------------------------------------- | ------------------------------ | ------------------------------------------------- |
| Enviar un informe diario exactamente a las 9 AM | Tareas programadas (Cron)      | Temporización exacta, ejecución aislada           |
| Recuérdame en 20 minutos                        | Tareas programadas (Cron)      | Única ejecución con temporización precisa (`--at`) |
| Ejecutar análisis profundo semanal              | Tareas programadas (Cron)      | Tarea independiente, puede usar otro modelo       |
| Revisar la bandeja de entrada cada 30 min       | Heartbeat                      | Agrupa con otras comprobaciones, con contexto     |
| Monitorizar el calendario para próximos eventos | Heartbeat                      | Encaja de forma natural con la conciencia periódica |
| Revisar después de una entrevista mencionada    | Compromisos inferidos          | Seguimiento similar a memoria, sin solicitud exacta de recordatorio |
| Seguimiento ligero tras el contexto del usuario | Compromisos inferidos          | Limitado al mismo agente y canal                  |
| Inspeccionar el estado de un subagente o ejecución ACP | Tareas en segundo plano | El registro de tareas rastrea todo el trabajo separado |
| Auditar qué se ejecutó y cuándo                 | Tareas en segundo plano        | `openclaw tasks list` y `openclaw tasks audit`    |
| Investigación de varios pasos y luego resumen   | Flujo de tareas                | Orquestación duradera con seguimiento de revisiones |
| Ejecutar un script al restablecer la sesión     | Hooks                          | Basado en eventos, se activa en eventos del ciclo de vida |
| Ejecutar código en cada llamada de herramienta  | Hooks de Plugin                | Los hooks en proceso pueden interceptar llamadas de herramientas |
| Comprobar siempre el cumplimiento antes de responder | Órdenes permanentes       | Se inyectan automáticamente en cada sesión        |

### Tareas programadas (Cron) frente a Heartbeat

| Dimensión        | Tareas programadas (Cron)             | Heartbeat                                  |
| ---------------- | ------------------------------------- | ------------------------------------------ |
| Temporización    | Exacta (expresiones cron, única ejecución) | Aproximada (predeterminado cada 30 min) |
| Contexto de sesión | Nuevo (aislado) o compartido        | Contexto completo de la sesión principal   |
| Registros de tareas | Siempre se crean                   | Nunca se crean                             |
| Entrega          | Canal, Webhook o silenciosa           | En línea en la sesión principal            |
| Ideal para       | Informes, recordatorios, trabajos en segundo plano | Revisiones de bandeja de entrada, calendario, notificaciones |

Usa Tareas programadas (Cron) cuando necesites temporización precisa o ejecución aislada. Usa Heartbeat cuando el trabajo se beneficie del contexto completo de la sesión y baste una temporización aproximada.

## Conceptos principales

### Tareas programadas (cron)

Cron es el planificador integrado del Gateway para temporización precisa. Persiste trabajos, despierta al agente en el momento adecuado y puede entregar la salida a un canal de chat o a un punto de conexión Webhook. Admite recordatorios de una sola ejecución, expresiones recurrentes y disparadores Webhook entrantes.

Consulta [Tareas programadas](/es/automation/cron-jobs).

### Tareas

El registro de tareas en segundo plano rastrea todo el trabajo separado: ejecuciones ACP, creación de subagentes, ejecuciones cron aisladas y operaciones de CLI. Las tareas son registros, no planificadores. Usa `openclaw tasks list` y `openclaw tasks audit` para inspeccionarlas.

Consulta [Tareas en segundo plano](/es/automation/tasks).

### Compromisos inferidos

Los compromisos son memorias de seguimiento opcionales y de corta duración. OpenClaw los infiere a partir de conversaciones normales, los limita al mismo agente y canal, y entrega los seguimientos vencidos mediante Heartbeat. Los recordatorios exactos solicitados por el usuario siguen perteneciendo a cron.

Consulta [Compromisos inferidos](/es/concepts/commitments).

### Flujo de tareas

Flujo de tareas es el sustrato de orquestación de flujos por encima de las tareas en segundo plano. Gestiona flujos duraderos de varios pasos con modos de sincronización gestionados y reflejados, seguimiento de revisiones y `openclaw tasks flow list|show|cancel` para inspección.

Consulta [Flujo de tareas](/es/automation/taskflow).

### Órdenes permanentes

Las órdenes permanentes otorgan al agente autoridad operativa permanente para programas definidos. Viven en archivos del espacio de trabajo (normalmente `AGENTS.md`) y se inyectan en cada sesión. Combínalas con cron para aplicar reglas basadas en tiempo.

Consulta [Órdenes permanentes](/es/automation/standing-orders).

### Hooks

Los hooks internos son scripts basados en eventos que se activan por eventos del ciclo de vida del agente (`/new`, `/reset`, `/stop`), Compaction de sesión, inicio del Gateway y flujo de mensajes. Se descubren desde directorios de hooks y se gestionan con `openclaw hooks`. Para interceptación de llamadas de herramientas en proceso, usa [hooks de Plugin](/es/plugins/hooks).

Consulta [Hooks](/es/automation/hooks).

### Heartbeat

Heartbeat es un turno periódico de la sesión principal (predeterminado cada 30 minutos). Agrupa varias comprobaciones (bandeja de entrada, calendario, notificaciones) en un solo turno del agente con el contexto completo de la sesión. Los turnos de Heartbeat no crean registros de tareas y no amplían la frescura de restablecimiento diario/inactivo de la sesión. Usa `HEARTBEAT.md` para una lista de comprobación pequeña, o un bloque `tasks:` cuando quieras comprobaciones periódicas solo al vencer dentro del propio Heartbeat. Los archivos Heartbeat vacíos se omiten como `empty-heartbeat-file`; el modo de tareas solo al vencer se omite como `no-tasks-due`. Los Heartbeats se aplazan mientras el trabajo cron está activo o en cola, y `heartbeat.skipWhenBusy` también puede aplazar un agente mientras el subagente con clave de sesión de ese mismo agente o sus lanes anidadas están ocupadas.

Consulta [Heartbeat](/es/gateway/heartbeat).

## Cómo funcionan juntos

- **Cron** gestiona programaciones precisas (informes diarios, revisiones semanales) y recordatorios de una sola ejecución. Todas las ejecuciones cron crean registros de tareas.
- **Heartbeat** gestiona la monitorización rutinaria (bandeja de entrada, calendario, notificaciones) en un turno agrupado cada 30 minutos.
- **Hooks** reaccionan a eventos específicos (restablecimientos de sesión, Compaction, flujo de mensajes) con scripts personalizados. Los hooks de Plugin cubren las llamadas de herramientas.
- **Órdenes permanentes** dan al agente contexto persistente y límites de autoridad.
- **Flujo de tareas** coordina flujos de varios pasos por encima de tareas individuales.
- **Tareas** rastrean automáticamente todo el trabajo separado para que puedas inspeccionarlo y auditarlo.

## Relacionado

- [Tareas programadas](/es/automation/cron-jobs) — programación precisa y recordatorios de una sola ejecución
- [Compromisos inferidos](/es/concepts/commitments) — seguimientos similares a memoria
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para todo el trabajo separado
- [Flujo de tareas](/es/automation/taskflow) — orquestación duradera de flujos de varios pasos
- [Hooks](/es/automation/hooks) — scripts de ciclo de vida basados en eventos
- [Hooks de Plugin](/es/plugins/hooks) — hooks en proceso para herramientas, prompts, mensajes y ciclo de vida
- [Órdenes permanentes](/es/automation/standing-orders) — instrucciones persistentes del agente
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Referencia de configuración](/es/gateway/configuration-reference) — todas las claves de configuración
