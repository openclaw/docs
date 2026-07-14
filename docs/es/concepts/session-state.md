---
read_when:
    - Se desea que los agentes detecten cuando los usuarios u otros agentes cambian una sesión sin su conocimiento
    - Se están depurando avisos de cambios de estado, cursores de observación o `changesSince` de `session_status`
    - Quieres entender cómo los agentes principales se mantienen sincronizados con las sesiones secundarias
sidebarTitle: Session state awareness
summary: 'Registro duradero de señales del estado de sesión: versiones de estado, observadores, avisos de estado obsoleto y reconciliación'
title: Conocimiento del estado de la sesión
x-i18n:
    generated_at: "2026-07-14T13:38:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Cuando varias sesiones trabajan en el mismo problema —un administrador que delega en sesiones secundarias, una persona que entra directamente en una sesión de trabajo, dos agentes que se coordinan mediante [`sessions_send`](/es/concepts/session-tool)—, cada sesión genera suposiciones sobre las demás. Esas suposiciones quedan obsoletas en cuanto interviene otro actor. El conocimiento del estado de las sesiones es el mecanismo que detecta la intervención, informa una vez a la sesión afectada y le ofrece una forma económica de ponerse al día antes de actuar.

Tres elementos funcionan conjuntamente:

1. Un **registro de señales duradero** almacena determinados cambios de estado por sesión.
2. Los **observadores** mantienen cursores por destino y reciben un único aviso consolidado de estado obsoleto.
3. La **reconciliación** obtiene el delta exacto mediante `session_status` con `changesSince`.

## El registro de señales

OpenClaw añade un evento tipado a la base de datos de estado compartida (`session_state_events`) cuando una sesión observada cambia de forma sustancial. Los eventos contienen metadatos y un resumen de una línea, pero nunca el contenido de los mensajes.

| Tipo                   | Se registra cuando                                       | Notifica a los observadores |
| ---------------------- | -------------------------------------------------------- | --------------------------- |
| `human_direct_message` | Una persona envía un turno directamente a una sesión observada | Sí                    |
| `upstream_missing`     | Desaparece la fuente ascendente de una sesión adoptada   | Sí                          |
| `goal_changed`         | El estado del objetivo de la sesión se crea, actualiza o borra | Sí                    |
| `child_spawned`        | Se crea una sesión secundaria de un subagente o ACP      | No (inicializa el cursor)   |
| `run_completed`        | Una ejecución secundaria finaliza correctamente         | No (solo registro)          |
| `run_failed`           | Una ejecución secundaria falla, agota el tiempo de espera o se cancela | No (solo registro) |
| `compacted`            | Se compacta el historial de la sesión                    | No (solo registro)          |
| `adopted`              | Se adopta en OpenClaw una sesión de catálogo             | No (solo registro)          |

Cada evento identifica a su actor (`human`, `agent` o `system`). Las ejecuciones secundarias canceladas y aquellas cuyo tiempo de espera se agota se registran como errores, conservando en la carga útil del evento el resultado preciso (`cancelled`, `timeout` o `error`).

La **versión del estado** de una sesión es simplemente el número de secuencia más alto de su registro, almacenado en una cabecera duradera por sesión que persiste tras la depuración. Las filas de `sessions_list` incluyen `stateVersion` cuando una sesión ha registrado cambios; `session_status` siempre lo indica.

Los tipos que solo se registran existen para el historial de reconciliación, no para las notificaciones: la entrega ordinaria de la finalización de ejecuciones secundarias sigue siendo responsabilidad de los [anuncios de subagentes](/es/tools/subagents), y el registro de señales nunca la duplica.

## Observadores

Un observador es una sesión que mantiene un cursor (`session_watch_cursors`) sobre un destino. Los cursores proceden de dos fuentes:

- **Implícitos (relaciones de creación).** Cuando una sesión crea un subagente o una sesión secundaria ACP, el cursor de la sesión principal se inicializa automáticamente en la versión de creación de la sesión secundaria. Las sesiones principales nunca se suscriben manualmente.
- **Explícitos (`sessions_send watch: true`).** Cualquier coordinador puede observar un destino que no haya creado: se pasa `watch: true` a `sessions_send` y, una vez enviado correctamente el mensaje, el remitente queda registrado como observador de la sesión que realmente recibió el mensaje. El registro comienza en la versión actual del estado del destino; el historial anterior nunca genera avisos. El resultado de la herramienta indica `watched: true|false` cuando se ha establecido el parámetro.

La identidad del observador debe ser una clave de sesión que incluya el agente. En `session.scope="global"`, la clave compartida `global` resulta ambigua entre agentes, por lo que esas sesiones obtienen el registro duradero y `changesSince`, pero no avisos proactivos.

Las observaciones se limpian automáticamente: las filas de cursores caducan conforme a la retención del registro de señales, se eliminan cuando se reinicia la sesión observadora y se borran junto con cualquiera de las dos sesiones. En v1 no existe una acción para dejar de observar.

Las sesiones observadas que se adoptaron desde un catálogo de sesiones se comprueban con una cadencia fija para detectar actividad humana directa en la fuente ascendente. La actividad detectada entra en el mismo registro de señales y flujo de observadores que los demás turnos humanos directos.

Si la fuente ascendente de una sesión adoptada se elimina externamente, tres comprobaciones consecutivas sin encontrarla (aproximadamente tres ciclos del monitor) generan una única señal `upstream_missing` para sus observadores y eliminan el vínculo ascendente. Volver a continuar la sesión del catálogo crea un vínculo nuevo.

## Avisos: uno, no muchos

Cuando se produce un evento que admite notificación y el cursor de un observador está atrasado, el observador recibe un aviso del sistema en su siguiente turno:

```
La sesión "agent:main:subagent:child" ha cambiado (otro actor). Reconcilie antes de actuar: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Los observadores de sesiones principales también se activan inmediatamente mediante una activación de Heartbeat; los observadores que sean subagentes anidados reciben el aviso en su siguiente turno.

El protocolo se ha diseñado deliberadamente para evitar el envío excesivo de avisos:

- **Un aviso pendiente por cada par observador/destino.** Mientras está pendiente, el texto del aviso permanece idéntico byte por byte y la cola de eventos del sistema elimina sus duplicados, por lo que veinte cambios rápidos en el mismo destino siguen generando una única línea en el prompt del observador.
- **Marca de agua congelada.** El cursor congela la posición notificada cuando se pone un aviso en cola. Los eventos sustanciales posteriores solo hacen avanzar la marca de agua sustancial; no vuelven a generar notificaciones.
- **Confirmación al consumir; reapertura solo si hay actividad intercalada.** Cuando el turno del observador consume el aviso, el cursor avanza. Si llegaron más eventos sustanciales entre la puesta en cola y el consumo, se abre exactamente un aviso nuevo para los eventos restantes.
- **Supresión de eventos propios.** Un observador nunca recibe notificaciones sobre eventos que él mismo haya provocado.
- **Recuperación tras reinicios.** Los avisos pendientes se mantienen en una cola en memoria; después de reiniciar el Gateway, una exploración inicial vuelve a materializarlos a partir de los cursores duraderos.

## Reconciliación

El aviso indica exactamente al observador qué debe hacer. `session_status` con `changesSince: <version>` devuelve los eventos tipados posteriores a esa versión (hasta 200), sin hacer avanzar ningún cursor:

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

`historyGap: true` significa que la versión solicitada es anterior al historial conservado; se debe actualizar el estado completo de la sesión (`sessions_history`, `session_status`) en lugar de tratar la respuesta como un delta exacto. La señal de discontinuidad es exacta: procede de una marca de agua depurada por sesión, no se infiere mediante cálculos de secuencias.

## Almacenamiento y límites

El historial reside en la base de datos de estado compartida y está limitado a 30 días y 50,000 filas; las cabeceras por sesión siguen siendo monotónicas después de la depuración. El registro se realiza con el máximo esfuerzo posible: si falla una adición, el error se registra y nunca hace fallar el turno de origen, por lo que `stateVersion` es una cabecera del registro de señales, no una versión transaccional de captura de cambios de datos.

Límites actuales:

- La entrega de avisos presupone que un único proceso del Gateway controla la base de datos de estado compartida. Varios Gateways comparten el registro duradero y `changesSince`, pero v1 no envía avisos entre procesos.
- Los eventos de Compaction abarcan a los responsables de Compaction del entorno de ejecución integrado; la Compaction exclusiva del arnés nativo no se registra por completo.
- Los detalles de la carga útil de los resultados cancelados los generan actualmente las ejecuciones secundarias ACP; las cancelaciones de subagentes nativos aparecen como errores genéricos.
- La detección de eco propio en la fuente ascendente compara texto normalizado del usuario. Un prompt externo que coincida con uno de los 10 mensajes de usuario más recientes enviados desde OpenClaw en la sesión se considera un eco propio.
- Una única fila JSONL local de Claude cuyo tamaño supere el límite de análisis de 1 MiB por ciclo bloquea el cursor de esa sesión en v1; los bytes sin clasificar nunca se omiten.
- Las comprobaciones de Claude en nodos emparejados clasifican los 50 elementos más recientes de la transcripción en cada ciclo. Las ráfagas mayores pueden quedar fuera de la ventana de análisis de v1.
- Las lecturas del historial de Claude en nodos emparejados no exponen un resultado definitivo que indique que no se encontró el hilo, por lo que las eliminaciones remotas de Claude no se clasifican como `upstream_missing` en v1.
- Las sesiones de catálogo que no se hayan adoptado permanecen fuera de la capa de conocimiento del estado en v1.
- Las sesiones adoptadas antes de esta función no contienen ningún vínculo ascendente; continúelas una vez desde el catálogo para iniciar la supervisión ascendente.
- Los vínculos ascendentes presuponen que cada clave de sesión adoptada corresponde a un único agente propietario (la adopción utiliza el agente predeterminado del almacén). La adopción por varios agentes del mismo hilo externo no se supervisa en v1.

## Contenido relacionado

- [Herramientas de sesión](/es/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Subagentes](/es/tools/subagents) — relaciones de creación y anuncios de finalización
- [Heartbeat](/es/gateway/heartbeat) — cómo los avisos en cola activan las sesiones principales
- [Administración de sesiones](/es/concepts/session) — claves, ámbitos y ciclo de vida de las sesiones
