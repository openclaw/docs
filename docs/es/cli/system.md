---
read_when:
    - Quieres poner en cola un evento del sistema sin crear un trabajo cron
    - Debe habilitar o deshabilitar Heartbeat
    - Quieres inspeccionar las entradas de presencia del sistema
summary: Referencia de CLI para `openclaw system` (eventos del sistema, Heartbeat, presencia)
title: Sistema
x-i18n:
    generated_at: "2026-07-05T11:12:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Ayudantes de nivel de sistema para el Gateway: poner en cola eventos del sistema, controlar
Heartbeat y ver la presencia.

Todos los subcomandos `system` usan RPC del Gateway y aceptan las marcas de cliente compartidas:

| Marca             | Predeterminado                       | Descripción                                                                                                                                                                                              |
| ----------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` cuando configurado | URL WebSocket del Gateway.                                                                                                                                                                             |
| `--token <token>` | ninguno                             | Token del Gateway (si se requiere).                                                                                                                                                                      |
| `--timeout <ms>`  | `30000`                              | Tiempo de espera de RPC en milisegundos.                                                                                                                                                                 |
| `--expect-final`  | desactivado                          | Espera la respuesta final (agente).                                                                                                                                                                      |
| `--json`          | desactivado                          | Emite JSON. `heartbeat last/enable/disable` y `system presence` siempre imprimen la carga útil JSON RPC sin procesar independientemente de esta marca; `system event` la usa para cambiar entre JSON y una línea `ok` simple. |

## Comandos comunes

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Pone en cola un evento del sistema en la sesión **principal** de forma predeterminada. El siguiente
Heartbeat lo inyecta como una línea `System:` en el prompt. Usa `--mode now` para
activar el Heartbeat inmediatamente; `next-heartbeat` (predeterminado) espera al
siguiente ciclo programado.

Pasa `--session-key` para apuntar a una sesión específica, por ejemplo para retransmitir la
finalización de una tarea asincrónica de vuelta al canal que la inició.

<Note>
**Excepción de temporización con `--session-key`:** cuando se proporciona `--session-key`,
`--mode next-heartbeat` se contrae en una activación dirigida inmediata en lugar de
esperar al siguiente ciclo programado. Las activaciones dirigidas usan la intención de Heartbeat
`immediate`, por lo que omiten la compuerta de no vencido del ejecutor que de otro modo
pospondría (y en la práctica descartaría) una activación con intención `event`. Si quieres una
entrega diferida, omite `--session-key` para que el evento llegue a la sesión principal y
viaje con el siguiente Heartbeat regular.
</Note>

Marcas:

- `--text <text>`: texto requerido del evento del sistema.
- `--mode <mode>`: `now` o `next-heartbeat` (predeterminado).
- `--session-key <sessionKey>`: opcional; apunta a una sesión de agente específica
  en lugar de la sesión principal del agente. Las claves que no pertenecen al
  agente resuelto recurren a la sesión principal del agente.

## `system heartbeat last|enable|disable`

- `last`: muestra el último evento de Heartbeat.
- `enable`: vuelve a activar Heartbeat (usa esto si estaba desactivado).
- `disable`: pausa Heartbeat.

## `system presence`

Lista las entradas actuales de presencia del sistema que conoce el Gateway (nodos,
instancias y líneas de estado similares).

## Notas

- Requiere un Gateway en ejecución accesible por tu configuración actual (local o
  remota).
- Los eventos del sistema son efímeros y no se conservan entre reinicios.

## Relacionado

- [Referencia de CLI](/es/cli)
