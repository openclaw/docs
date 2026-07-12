---
read_when:
    - Quieres poner en cola un evento del sistema sin crear una tarea de Cron
    - Debes activar o desactivar los heartbeats
    - Quieres inspeccionar las entradas de presencia del sistema
summary: Referencia de la CLI para `openclaw system` (eventos del sistema, Heartbeat, presencia)
title: Sistema
x-i18n:
    generated_at: "2026-07-11T22:57:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Utilidades de nivel de sistema para el Gateway: poner en cola eventos del sistema, controlar
los Heartbeats y consultar la presencia.

Todos los subcomandos de `system` usan RPC del Gateway y aceptan las opciones compartidas del cliente:

| Opción            | Valor predeterminado                         | Descripción                                                                                                                                                                                                                               |
| ----------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` cuando está configurado | URL WebSocket del Gateway.                                                                                                                                                                                                                 |
| `--token <token>` | ninguno                                      | Token del Gateway (si es necesario).                                                                                                                                                                                                       |
| `--timeout <ms>`  | `30000`                                      | Tiempo de espera de RPC en milisegundos.                                                                                                                                                                                                   |
| `--expect-final`  | desactivado                                  | Espera la respuesta final (agente).                                                                                                                                                                                                        |
| `--json`          | desactivado                                  | Genera JSON. `heartbeat last/enable/disable` y `system presence` siempre imprimen la carga útil JSON sin procesar de RPC independientemente de esta opción; `system event` la usa para alternar entre JSON y una línea `ok` sin formato. |

## Comandos comunes

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

De forma predeterminada, pone en cola un evento del sistema en la sesión **principal**. El siguiente
Heartbeat lo inserta como una línea `System:` en el prompt. Use `--mode now` para
activar el Heartbeat inmediatamente; `next-heartbeat` (valor predeterminado) espera al
siguiente ciclo programado.

Pase `--session-key` para dirigirlo a una sesión específica, por ejemplo, para reenviar la
finalización de una tarea asíncrona al canal que la inició.

<Note>
**Excepción de temporización con `--session-key`:** cuando se proporciona `--session-key`,
`--mode next-heartbeat` se convierte en una activación dirigida inmediata en lugar de
esperar al siguiente ciclo programado. Las activaciones dirigidas usan la intención de Heartbeat
`immediate`, por lo que omiten la restricción de ejecución antes de tiempo del ejecutor, que de otro modo
aplazaría (y, en la práctica, descartaría) una activación con intención `event`. Si desea una
entrega diferida, omita `--session-key` para que el evento llegue a la sesión principal y
se entregue con el siguiente Heartbeat normal.
</Note>

Opciones:

- `--text <text>`: texto obligatorio del evento del sistema.
- `--mode <mode>`: `now` o `next-heartbeat` (valor predeterminado).
- `--session-key <sessionKey>`: opcional; dirige el evento a una sesión específica del agente
  en lugar de a la sesión principal del agente. Las claves que no pertenezcan al
  agente resuelto recurren a la sesión principal del agente.

## `system heartbeat last|enable|disable`

- `last`: muestra el último evento de Heartbeat.
- `enable`: vuelve a activar los Heartbeats (úselo si estaban desactivados).
- `disable`: pausa los Heartbeats.

## `system presence`

Enumera las entradas actuales de presencia del sistema que conoce el Gateway (nodos,
instancias y líneas de estado similares).

## Notas

- Requiere un Gateway en ejecución accesible mediante la configuración actual (local o
  remota).
- Los eventos del sistema son efímeros y no persisten entre reinicios.

## Relacionado

- [Referencia de la CLI](/es/cli)
