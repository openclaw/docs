---
read_when:
    - Quieres que OpenClaw recuerde las preguntas de seguimiento naturales
    - Quiere entender en qué se diferencian los registros inferidos de los recordatorios
    - Quieres revisar o descartar compromisos de seguimiento
sidebarTitle: Commitments
summary: Memoria de seguimiento inferida para revisiones que no son recordatorios exactos
title: Compromisos inferidos
x-i18n:
    generated_at: "2026-04-30T05:36:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Los compromisos son recuerdos de seguimiento de corta duración. Cuando están habilitados, OpenClaw puede
detectar que una conversación creó una oportunidad de revisión futura y recordar
volver a mencionarla más adelante.

Ejemplos:

- Mencionas que tienes una entrevista mañana. OpenClaw puede hacer una revisión después.
- Dices que estás agotado. OpenClaw puede preguntar más tarde si dormiste.
- El agente dice que hará seguimiento después de que algo cambie. OpenClaw puede rastrear
  ese bucle abierto.

Los compromisos no son hechos duraderos como `MEMORY.md`, y no son recordatorios
exactos. Están entre la memoria y la automatización: OpenClaw recuerda una
obligación vinculada a la conversación, luego Heartbeat la entrega cuando vence.

## Habilitar compromisos

Los compromisos están desactivados de forma predeterminada. Habilítalos en la configuración:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

`openclaw.json` equivalente:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` limita cuántos seguimientos inferidos se pueden entregar
por sesión de agente en un día móvil. El valor predeterminado es `3`.

## Cómo funciona

Después de una respuesta del agente, OpenClaw puede ejecutar una pasada oculta de extracción en segundo plano en un
contexto separado. Esa pasada busca únicamente compromisos de seguimiento inferidos. No
escribe en la conversación visible y no le pide al agente principal
razonar sobre la extracción.

Cuando encuentra un candidato de alta confianza, OpenClaw almacena un compromiso con:

- el id del agente
- la clave de sesión
- el canal original y el destino de entrega
- una ventana de vencimiento
- una breve revisión sugerida
- suficiente contexto de origen para que Heartbeat decida si enviarlo

La entrega se realiza a través de Heartbeat. Cuando un compromiso vence, Heartbeat
añade el compromiso al turno de Heartbeat para el mismo agente y alcance de canal.
El modelo puede enviar una revisión natural o responder `HEARTBEAT_OK` para descartarlo.

OpenClaw nunca entrega un compromiso inferido inmediatamente después de escribirlo.
La hora de vencimiento se ajusta como mínimo a un intervalo de Heartbeat después de que se
crea el compromiso, por lo que el seguimiento no puede repetirse en el mismo momento en que fue
inferido.

## Alcance

Los compromisos se limitan al contexto exacto de agente y canal donde se
crearon. Un seguimiento inferido mientras se habla con un agente en Discord no lo
entrega otro agente, otro canal ni una sesión no relacionada.

Este alcance forma parte de la función. Las revisiones naturales deberían sentirse como la continuación de la misma
conversación, no como un sistema global de recordatorios.

## Compromisos frente a recordatorios

| Necesidad                                       | Usar                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "Recuérdame a las 3 p. m."                      | [Tareas programadas](/es/automation/cron-jobs) |
| "Avísame en 20 minutos"                         | [Tareas programadas](/es/automation/cron-jobs) |
| "Ejecuta este informe todos los días laborables" | [Tareas programadas](/es/automation/cron-jobs) |
| "Tengo una entrevista mañana"                   | Compromisos                              |
| "Pasé toda la noche despierto"                  | Compromisos                              |
| "Haz seguimiento si no respondo a este hilo abierto" | Compromisos                              |

Las solicitudes exactas del usuario ya pertenecen a la ruta del programador. Los compromisos son solo
para seguimientos inferidos: los momentos en que el usuario no pidió un recordatorio,
pero la conversación claramente creó una revisión futura útil.

## Gestionar compromisos

Usa la CLI para inspeccionar y borrar los compromisos almacenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulta [`openclaw commitments`](/es/cli/commitments) para la referencia del comando.

## Privacidad y coste

La extracción de compromisos usa una pasada de LLM, por lo que habilitarla añade uso de modelo en segundo plano
después de los turnos elegibles. La pasada está oculta de la conversación
visible para el usuario, pero puede leer el intercambio reciente necesario para decidir si
existe un seguimiento.

Los compromisos almacenados son estado local de OpenClaw. Son memoria operativa, no
memoria a largo plazo. Deshabilita la función con:

```bash
openclaw config set commitments.enabled false
```

## Solución de problemas

Si los seguimientos esperados no aparecen:

- Confirma que `commitments.enabled` sea `true`.
- Revisa `openclaw commitments --all` para ver registros pendientes, descartados, pospuestos o caducados.
- Asegúrate de que Heartbeat se esté ejecutando para el agente.
- Comprueba si `commitments.maxPerDay` ya se alcanzó para esa
  sesión de agente.
- Recuerda que los recordatorios exactos se omiten en la extracción de compromisos y deberían
  aparecer en [tareas programadas](/es/automation/cron-jobs) en su lugar.

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Active memory](/es/concepts/active-memory)
- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [`openclaw commitments`](/es/cli/commitments)
- [Referencia de configuración](/es/gateway/configuration-reference#commitments)
