---
doc-schema-version: 1
read_when:
    - Decidir cómo automatizar el trabajo con OpenClaw
    - Elegir entre Heartbeat, Cron, compromisos, ganchos y órdenes permanentes
    - Buscando el punto de entrada de automatización adecuado
summary: 'Descripción general de los mecanismos de automatización: tareas, Cron, hooks, instrucciones permanentes y Task Flow'
title: Automatización
x-i18n:
    generated_at: "2026-05-12T00:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e7604ca27feddacf48166ca2813ac63336559c115cabe0740fb5d57e93a06
    source_path: automation/index.md
    workflow: 16
---

OpenClaw ejecuta trabajo en segundo plano mediante tareas, trabajos programados, compromisos inferidos, hooks de eventos e instrucciones permanentes. Esta página le ayuda a elegir el mecanismo adecuado y a entender cómo encajan entre sí.

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

| Caso de uso                                      | Recomendado              | Por qué                                             |
| ------------------------------------------------ | ------------------------ | --------------------------------------------------- |
| Enviar informe diario a las 9 AM en punto        | Tareas programadas (Cron) | Temporización exacta, ejecución aislada             |
| Recuérdame en 20 minutos                         | Tareas programadas (Cron) | Ejecución única con temporización precisa (`--at`)  |
| Ejecutar análisis profundo semanal               | Tareas programadas (Cron) | Tarea independiente, puede usar otro modelo         |
| Revisar la bandeja de entrada cada 30 min        | Heartbeat                | Agrupa con otras comprobaciones, consciente del contexto |
| Supervisar el calendario para eventos próximos   | Heartbeat                | Encaje natural para la conciencia periódica         |
| Hacer seguimiento tras una entrevista mencionada | Compromisos inferidos    | Seguimiento similar a memoria, sin solicitud de recordatorio exacto |
| Registro cordial tras el contexto del usuario    | Compromisos inferidos    | Limitado al mismo agente y canal                    |
| Inspeccionar el estado de un subagente o ejecución ACP | Tareas en segundo plano | El registro de tareas sigue todo el trabajo desacoplado |
| Auditar qué se ejecutó y cuándo                  | Tareas en segundo plano  | `openclaw tasks list` y `openclaw tasks audit`      |
| Investigación de varios pasos y luego resumen    | Flujo de tareas          | Orquestación duradera con seguimiento de revisiones |
| Ejecutar un script al restablecer la sesión      | Hooks                    | Orientado por eventos, se activa en eventos del ciclo de vida |
| Ejecutar código en cada llamada de herramienta   | Hooks de Plugin          | Los hooks en proceso pueden interceptar llamadas de herramientas |
| Comprobar siempre el cumplimiento antes de responder | Órdenes permanentes   | Se inyectan automáticamente en cada sesión          |

### Tareas programadas (Cron) frente a Heartbeat

| Dimensión        | Tareas programadas (Cron)              | Heartbeat                              |
| ---------------- | -------------------------------------- | -------------------------------------- |
| Temporización    | Exacta (expresiones cron, ejecución única) | Aproximada (por defecto cada 30 min) |
| Contexto de sesión | Nuevo (aislado) o compartido         | Contexto completo de la sesión principal |
| Registros de tareas | Siempre se crean                    | Nunca se crean                         |
| Entrega          | Canal, webhook o silenciosa            | En línea en la sesión principal        |
| Ideal para       | Informes, recordatorios, trabajos en segundo plano | Revisiones de bandeja de entrada, calendario, notificaciones |

Use tareas programadas (Cron) cuando necesite temporización precisa o ejecución aislada. Use Heartbeat cuando el trabajo se beneficie del contexto completo de la sesión y baste con una temporización aproximada.

## Conceptos básicos

### Tareas programadas (cron)

Cron es el programador integrado del Gateway para temporización precisa. Persiste trabajos, despierta al agente en el momento correcto y puede entregar la salida a un canal de chat o a un endpoint de webhook. Admite recordatorios de ejecución única, expresiones recurrentes y disparadores de webhook entrantes.

Consulte [Tareas programadas](/es/automation/cron-jobs).

### Tareas

El registro de tareas en segundo plano sigue todo el trabajo desacoplado: ejecuciones ACP, creación de subagentes, ejecuciones cron aisladas y operaciones de CLI. Las tareas son registros, no programadores. Use `openclaw tasks list` y `openclaw tasks audit` para inspeccionarlas.

Consulte [Tareas en segundo plano](/es/automation/tasks).

### Compromisos inferidos

Los compromisos son memorias de seguimiento opcionales y de corta duración. OpenClaw los infiere a partir de conversaciones normales, los limita al mismo agente y canal, y entrega los registros vencidos mediante heartbeat. Los recordatorios exactos solicitados por el usuario siguen perteneciendo a cron.

Consulte [Compromisos inferidos](/es/concepts/commitments).

### Flujo de tareas

El flujo de tareas es el sustrato de orquestación de flujos por encima de las tareas en segundo plano. Gestiona flujos duraderos de varios pasos con modos de sincronización gestionados y reflejados, seguimiento de revisiones, y `openclaw tasks flow list|show|cancel` para inspección.

Consulte [Flujo de tareas](/es/automation/taskflow).

### Órdenes permanentes

Las órdenes permanentes otorgan al agente autoridad operativa permanente para programas definidos. Viven en archivos del espacio de trabajo (normalmente `AGENTS.md`) y se inyectan en cada sesión. Combínelas con cron para la aplicación basada en tiempo.

Consulte [Órdenes permanentes](/es/automation/standing-orders).

### Hooks

Los hooks internos son scripts orientados por eventos que se activan por eventos del ciclo de vida del agente (`/new`, `/reset`, `/stop`), compaction de sesión, arranque del gateway y flujo de mensajes. Se descubren automáticamente desde directorios y se pueden gestionar con `openclaw hooks`. Para la interceptación en proceso de llamadas de herramientas, use [hooks de Plugin](/es/plugins/hooks).

Consulte [Hooks](/es/automation/hooks).

### Heartbeat

Heartbeat es un turno periódico de la sesión principal (por defecto cada 30 minutos). Agrupa varias comprobaciones (bandeja de entrada, calendario, notificaciones) en un turno del agente con el contexto completo de la sesión. Los turnos de Heartbeat no crean registros de tareas ni amplían la frescura del restablecimiento diario/inactivo de la sesión. Use `HEARTBEAT.md` para una pequeña lista de comprobación, o un bloque `tasks:` cuando quiera comprobaciones periódicas solo de vencimientos dentro del propio heartbeat. Los archivos de heartbeat vacíos se omiten como `empty-heartbeat-file`; el modo de tareas solo de vencimientos se omite como `no-tasks-due`. Los heartbeats se aplazan mientras el trabajo de cron está activo o en cola, y `heartbeat.skipWhenBusy` también puede aplazarlos mientras los subagentes o carriles anidados están ocupados.

Consulte [Heartbeat](/es/gateway/heartbeat).

## Cómo funcionan juntos

- **Cron** gestiona programaciones precisas (informes diarios, revisiones semanales) y recordatorios de ejecución única. Todas las ejecuciones cron crean registros de tareas.
- **Heartbeat** gestiona la supervisión rutinaria (bandeja de entrada, calendario, notificaciones) en un solo turno agrupado cada 30 minutos.
- **Hooks** reaccionan a eventos específicos (restablecimientos de sesión, compaction, flujo de mensajes) con scripts personalizados. Los hooks de Plugin cubren llamadas de herramientas.
- **Órdenes permanentes** dan al agente contexto persistente y límites de autoridad.
- **Flujo de tareas** coordina flujos de varios pasos por encima de tareas individuales.
- **Tareas** siguen automáticamente todo el trabajo desacoplado para que pueda inspeccionarlo y auditarlo.

## Relacionado

- [Tareas programadas](/es/automation/cron-jobs) — programación precisa y recordatorios de ejecución única
- [Compromisos inferidos](/es/concepts/commitments) — registros de seguimiento similares a memoria
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para todo el trabajo desacoplado
- [Flujo de tareas](/es/automation/taskflow) — orquestación duradera de flujos de varios pasos
- [Hooks](/es/automation/hooks) — scripts de ciclo de vida orientados por eventos
- [Hooks de Plugin](/es/plugins/hooks) — hooks en proceso de herramientas, prompts, mensajes y ciclo de vida
- [Órdenes permanentes](/es/automation/standing-orders) — instrucciones persistentes del agente
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Referencia de configuración](/es/gateway/configuration-reference) — todas las claves de configuración
