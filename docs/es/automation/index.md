---
read_when:
    - Decidir cómo automatizar el trabajo con OpenClaw
    - Cómo elegir entre Heartbeat, Cron, compromisos, ganchos y órdenes permanentes
    - Buscar el punto de entrada de automatización adecuado
summary: 'Descripción general de los mecanismos de automatización: tareas, Cron, hooks, instrucciones permanentes y Task Flow'
title: Automatización y tareas
x-i18n:
    generated_at: "2026-05-06T05:26:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee7f34fa4840c0e43e50d09e415b2529ef0c8bc3ccb6e3546b8a873c9458832d
    source_path: automation/index.md
    workflow: 16
---

OpenClaw ejecuta trabajo en segundo plano mediante tareas, trabajos programados, compromisos inferidos, hooks de eventos e instrucciones permanentes. Esta página te ayuda a elegir el mecanismo adecuado y a entender cómo encajan entre sí.

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

| Caso de uso                                      | Recomendado             | Por qué                                                   |
| ------------------------------------------------ | ----------------------- | --------------------------------------------------------- |
| Enviar un informe diario exactamente a las 9 a. m. | Tareas programadas (Cron) | Tiempo exacto, ejecución aislada                          |
| Recordarme en 20 minutos                         | Tareas programadas (Cron) | Ejecución única con tiempo preciso (`--at`)               |
| Ejecutar un análisis profundo semanal            | Tareas programadas (Cron) | Tarea independiente, puede usar otro modelo               |
| Revisar la bandeja de entrada cada 30 min        | Heartbeat               | Agrupa con otras comprobaciones, consciente del contexto  |
| Supervisar el calendario para próximos eventos   | Heartbeat               | Encaje natural para conciencia periódica                  |
| Hacer seguimiento tras una entrevista mencionada | Compromisos inferidos   | Seguimiento similar a memoria, sin solicitud de recordatorio exacto |
| Contacto suave de atención tras contexto del usuario | Compromisos inferidos | Limitado al mismo agente y canal                          |
| Inspeccionar el estado de un subagente o ejecución ACP | Tareas en segundo plano | El registro de tareas rastrea todo el trabajo separado    |
| Auditar qué se ejecutó y cuándo                  | Tareas en segundo plano | `openclaw tasks list` y `openclaw tasks audit`            |
| Investigación de varios pasos y luego resumir    | Flujo de tareas         | Orquestación duradera con seguimiento de revisiones       |
| Ejecutar un script al restablecer la sesión      | Hooks                   | Basado en eventos, se dispara en eventos de ciclo de vida |
| Ejecutar código en cada llamada a herramienta    | Hooks de Plugin         | Los hooks en proceso pueden interceptar llamadas a herramientas |
| Comprobar siempre cumplimiento antes de responder | Órdenes permanentes     | Se inyectan automáticamente en cada sesión                |

### Tareas programadas (Cron) frente a Heartbeat

| Dimensión        | Tareas programadas (Cron)             | Heartbeat                              |
| ---------------- | ------------------------------------- | -------------------------------------- |
| Tiempo           | Exacto (expresiones cron, ejecución única) | Aproximado (predeterminado cada 30 min) |
| Contexto de sesión | Nuevo (aislado) o compartido        | Contexto completo de la sesión principal |
| Registros de tareas | Siempre se crean                   | Nunca se crean                         |
| Entrega          | Canal, webhook o silenciosa           | En línea en la sesión principal        |
| Ideal para       | Informes, recordatorios, trabajos en segundo plano | Revisiones de bandeja de entrada, calendario, notificaciones |

Usa Tareas programadas (Cron) cuando necesites tiempo preciso o ejecución aislada. Usa Heartbeat cuando el trabajo se beneficie del contexto completo de la sesión y el tiempo aproximado sea suficiente.

## Conceptos principales

### Tareas programadas (cron)

Cron es el programador integrado del Gateway para tiempos precisos. Persiste trabajos, despierta al agente en el momento adecuado y puede entregar la salida a un canal de chat o endpoint webhook. Admite recordatorios de una sola ejecución, expresiones recurrentes y disparadores webhook entrantes.

Consulta [Tareas programadas](/es/automation/cron-jobs).

### Tareas

El registro de tareas en segundo plano rastrea todo el trabajo separado: ejecuciones ACP, creación de subagentes, ejecuciones cron aisladas y operaciones de CLI. Las tareas son registros, no programadores. Usa `openclaw tasks list` y `openclaw tasks audit` para inspeccionarlas.

Consulta [Tareas en segundo plano](/es/automation/tasks).

### Compromisos inferidos

Los compromisos son memorias de seguimiento opcionales y de corta duración. OpenClaw los infiere de conversaciones normales, los limita al mismo agente y canal, y entrega los contactos pendientes mediante Heartbeat. Los recordatorios exactos solicitados por el usuario siguen perteneciendo a cron.

Consulta [Compromisos inferidos](/es/concepts/commitments).

### Flujo de tareas

El flujo de tareas es el sustrato de orquestación de flujos por encima de las tareas en segundo plano. Gestiona flujos duraderos de varios pasos con modos de sincronización administrados y reflejados, seguimiento de revisiones y `openclaw tasks flow list|show|cancel` para inspección.

Consulta [Flujo de tareas](/es/automation/taskflow).

### Órdenes permanentes

Las órdenes permanentes otorgan al agente autoridad operativa permanente para programas definidos. Viven en archivos del espacio de trabajo (normalmente `AGENTS.md`) y se inyectan en cada sesión. Combínalas con cron para aplicación basada en tiempo.

Consulta [Órdenes permanentes](/es/automation/standing-orders).

### Hooks

Los hooks internos son scripts basados en eventos disparados por eventos del ciclo de vida del agente (`/new`, `/reset`, `/stop`), Compaction de sesión, inicio del gateway y flujo de mensajes. Se descubren automáticamente desde directorios y se pueden gestionar con `openclaw hooks`. Para interceptar llamadas a herramientas en proceso, usa [hooks de Plugin](/es/plugins/hooks).

Consulta [Hooks](/es/automation/hooks).

### Heartbeat

Heartbeat es un turno periódico de la sesión principal (predeterminado cada 30 minutos). Agrupa varias comprobaciones (bandeja de entrada, calendario, notificaciones) en un turno de agente con contexto completo de la sesión. Los turnos de Heartbeat no crean registros de tareas y no amplían la frescura diaria o por inactividad del restablecimiento de sesión. Usa `HEARTBEAT.md` para una pequeña lista de comprobación, o un bloque `tasks:` cuando quieras comprobaciones periódicas solo pendientes dentro del propio Heartbeat. Los archivos Heartbeat vacíos se omiten como `empty-heartbeat-file`; el modo de tareas solo pendientes se omite como `no-tasks-due`. Los Heartbeats se aplazan mientras hay trabajo de cron activo o en cola, y `heartbeat.skipWhenBusy` también puede aplazarlos mientras subagentes o carriles anidados están ocupados.

Consulta [Heartbeat](/es/gateway/heartbeat).

## Cómo funcionan juntos

- **Cron** gestiona programaciones precisas (informes diarios, revisiones semanales) y recordatorios de una sola ejecución. Todas las ejecuciones cron crean registros de tareas.
- **Heartbeat** gestiona supervisión rutinaria (bandeja de entrada, calendario, notificaciones) en un turno agrupado cada 30 minutos.
- **Hooks** reaccionan a eventos específicos (restablecimientos de sesión, Compaction, flujo de mensajes) con scripts personalizados. Los hooks de Plugin cubren llamadas a herramientas.
- **Órdenes permanentes** dan al agente contexto persistente y límites de autoridad.
- **Flujo de tareas** coordina flujos de varios pasos por encima de tareas individuales.
- **Tareas** rastrean automáticamente todo el trabajo separado para que puedas inspeccionarlo y auditarlo.

## Relacionado

- [Tareas programadas](/es/automation/cron-jobs) — programación precisa y recordatorios de una sola ejecución
- [Compromisos inferidos](/es/concepts/commitments) — contactos de seguimiento similares a memoria
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para todo el trabajo separado
- [Flujo de tareas](/es/automation/taskflow) — orquestación duradera de flujos de varios pasos
- [Hooks](/es/automation/hooks) — scripts de ciclo de vida basados en eventos
- [Hooks de Plugin](/es/plugins/hooks) — hooks en proceso para herramientas, prompts, mensajes y ciclo de vida
- [Órdenes permanentes](/es/automation/standing-orders) — instrucciones persistentes del agente
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Referencia de configuración](/es/gateway/configuration-reference) — todas las claves de configuración
