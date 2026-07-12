---
read_when:
    - Quieres que los agentes detecten cuando personas u otros agentes cambian una sesión a sus espaldas
    - Está depurando avisos de cambio de estado, cursores de observación o `changesSince` de `session_status`
    - Quieres entender cómo los agentes principales se mantienen sincronizados con las sesiones secundarias
sidebarTitle: Session state awareness
summary: 'Registro duradero de señales del estado de la sesión: versiones del estado, observadores, avisos de estado obsoleto y reconciliación'
title: Conocimiento del estado de la sesión
x-i18n:
    generated_at: "2026-07-12T21:23:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06ec310fc482ce658eb37628ac33c4224349846d1ffd6e8edeac01bc84e56341
    source_path: concepts/session-state.md
    workflow: 16
---

Cuando varias sesiones trabajan en el mismo problema —un gestor que delega en sesiones secundarias, una persona que entra directamente en una sesión de trabajo, dos agentes que se coordinan mediante [`sessions_send`](/es/concepts/session-tool)—, cada sesión establece suposiciones sobre las demás. Esas suposiciones quedan obsoletas en cuanto interviene otro actor. El conocimiento del estado de las sesiones es el mecanismo que detecta la intervención, avisa una vez a la sesión afectada y le proporciona una forma económica de ponerse al día antes de actuar.

Tres elementos funcionan conjuntamente:

1. Un **registro persistente de señales** guarda determinados cambios de estado de cada sesión.
2. Los **observadores** mantienen cursores por destino y reciben un único aviso consolidado de estado obsoleto.
3. La **reconciliación** obtiene el delta exacto mediante `session_status` con `changesSince`.

## El registro de señales

OpenClaw añade un evento tipado a la base de datos de estado compartida (`session_state_events`) cuando una sesión observada cambia de forma sustancial. Los eventos contienen metadatos y un resumen de una línea, pero nunca el contenido de los mensajes.

| Tipo                   | Cuándo se registra                                                | Notifica a los observadores |
| ---------------------- | ----------------------------------------------------------------- | --------------------------- |
| `human_direct_message` | Una persona envía un turno directamente a una sesión observada    | Sí                          |
| `goal_changed`         | El estado del objetivo de la sesión se crea, actualiza o elimina  | Sí                          |
| `child_spawned`        | Se crea una sesión secundaria de subagente o ACP                   | No (inicializa el cursor)   |
| `run_completed`        | Una ejecución secundaria finaliza correctamente                   | No (solo registro)          |
| `run_failed`           | Una ejecución secundaria falla, agota el tiempo o se cancela      | No (solo registro)          |
| `compacted`            | Se compacta el historial de la sesión                             | No (solo registro)          |

Cada evento identifica a su actor (`human`, `agent` o `system`). Las ejecuciones secundarias canceladas y que agotan el tiempo se registran como fallos, y el resultado preciso (`cancelled`, `timeout` o `error`) se conserva en la carga útil del evento.

La **versión de estado** de una sesión es simplemente el número de secuencia más alto de su registro, controlado mediante una cabecera persistente por sesión que sobrevive a la depuración. Las filas de `sessions_list` incluyen `stateVersion` cuando una sesión tiene cambios registrados; `session_status` siempre lo informa.

Los tipos que solo se registran existen para el historial de reconciliación, no para las notificaciones: la entrega ordinaria de la finalización de ejecuciones secundarias sigue siendo responsabilidad de los [anuncios de subagentes](/es/tools/subagents), y el registro de señales nunca la duplica.

## Observadores

Un observador es una sesión que mantiene un cursor (`session_watch_cursors`) sobre un destino. Los cursores proceden de dos lugares:

- **Implícitos (aristas de creación).** Cuando una sesión crea un subagente o una sesión secundaria ACP, el cursor de la sesión principal se inicializa automáticamente en la versión de creación de la sesión secundaria. Las sesiones principales nunca se suscriben manualmente.
- **Explícitos (`sessions_send watch: true`).** Cualquier coordinador puede observar un destino que no haya creado: se pasa `watch: true` en `sessions_send` y, después de que el envío se despache correctamente, el remitente queda registrado como observador de la sesión que realmente recibió el mensaje. El registro comienza en la versión de estado actual del destino; el historial anterior nunca genera avisos. El resultado de la herramienta informa `watched: true|false` cuando se ha definido el parámetro.

La identidad del observador debe ser una clave de sesión cualificada por agente. Con `session.scope="global"`, la clave compartida `global` resulta ambigua entre agentes, por lo que esas sesiones disponen del registro persistente y de `changesSince`, pero no reciben avisos proactivos.

Las observaciones se limpian automáticamente: las filas de cursor caducan con la retención del registro de señales, se eliminan cuando se restablece la sesión observadora y se borran junto con cualquiera de las sesiones. No existe una operación para dejar de observar en la v1.

## Avisos: uno, no muchos

Cuando se registra un evento que admite notificaciones y el cursor de un observador está retrasado, el observador recibe un único aviso del sistema en su siguiente turno:

```
La sesión "agent:main:subagent:child" cambió (otro actor). Reconcilie antes de actuar: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Los observadores de sesiones principales también se activan inmediatamente mediante una activación de Heartbeat; los observadores de subagentes anidados reciben el aviso en su siguiente turno.

El protocolo está diseñado expresamente para evitar el envío masivo de avisos:

- **Un aviso pendiente por cada par observador/destino.** El texto del aviso permanece idéntico byte a byte mientras está pendiente y la cola de eventos del sistema elimina los duplicados basándose en él, por lo que veinte cambios rápidos en el mismo destino siguen generando una sola línea en el prompt del observador.
- **Marca de agua congelada.** El cursor congela la posición notificada cuando se pone un aviso en cola. Los eventos sustanciales posteriores solo hacen avanzar la marca de agua sustancial; no vuelven a generar avisos.
- **Confirmación al extraer; reapertura solo si hay trabajo intercalado.** Cuando el turno del observador consume el aviso, el cursor avanza. Si llegaron más eventos sustanciales entre la puesta en cola y la extracción, se abre exactamente un nuevo aviso para los restantes.
- **Supresión propia.** Un observador nunca recibe notificaciones sobre eventos que él mismo haya provocado.
- **Recuperación tras reinicios.** Los avisos pendientes residen en una cola en memoria; un barrido de inicio vuelve a materializarlos a partir de los cursores persistentes después de reiniciar el Gateway.

## Reconciliación

El aviso indica al observador exactamente qué debe hacer. `session_status` con `changesSince: <version>` devuelve los eventos tipados posteriores a esa versión (hasta 200), sin hacer avanzar ningún cursor:

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "mensaje humano mediante telegram"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "objetivo actualizado" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` significa que la versión solicitada es anterior al historial conservado; se debe actualizar todo el estado de la sesión (`sessions_history`, `session_status`) en lugar de tratar la respuesta como un delta exacto. La señal de discontinuidad es exacta: procede de una marca de agua depurada por sesión y no se deduce mediante aritmética de secuencias.

## Almacenamiento y límites

El historial reside en la base de datos de estado compartida, con un límite de 30 días y 50,000 filas; las cabeceras por sesión siguen siendo monotónicas después de la depuración. El registro se realiza con el máximo esfuerzo: un fallo al añadir un evento queda registrado y nunca provoca el fallo del turno que lo originó; por tanto, `stateVersion` es la cabecera del registro de señales, no una versión transaccional de captura de cambios de datos.

Límites actuales:

- La entrega de avisos presupone que un único proceso del Gateway controla la base de datos de estado compartida. Varios Gateways comparten el registro persistente y `changesSince`, pero la v1 no envía avisos entre procesos.
- Los eventos de compactación abarcan los responsables de compactación del entorno de ejecución integrado; la compactación exclusiva del arnés nativo no se registra por completo.
- Los detalles de la carga útil del resultado de cancelación los generan actualmente las ejecuciones secundarias ACP; las cancelaciones de subagentes nativos aparecen como fallos genéricos.

## Contenido relacionado

- [Herramientas de sesión](/es/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Subagentes](/es/tools/subagents) — aristas de creación y anuncios de finalización
- [Heartbeat](/es/gateway/heartbeat) — cómo los avisos en cola activan las sesiones principales
- [Gestión de sesiones](/es/concepts/session) — claves, ámbitos y ciclo de vida de las sesiones
