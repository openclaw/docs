---
read_when:
    - Quieres que OpenClaw recuerde seguimientos naturales
    - Quieres entender en qué se diferencian los registros inferidos de los recordatorios
    - Quieres revisar o descartar compromisos de seguimiento
sidebarTitle: Commitments
summary: Memoria de seguimiento inferida para comprobaciones que no son recordatorios exactos
title: Compromisos inferidos
x-i18n:
    generated_at: "2026-05-01T05:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

Los compromisos son recuerdos de seguimiento de corta duración. Cuando están habilitados, OpenClaw puede
detectar que una conversación creó una oportunidad futura de comprobación y recordar
traerla de vuelta más tarde.

Ejemplos:

- Mencionas una entrevista mañana. OpenClaw puede hacer una comprobación después.
- Dices que estás agotado. OpenClaw puede preguntarte más tarde si dormiste.
- El agente dice que hará seguimiento después de que algo cambie. OpenClaw puede registrar
  ese ciclo abierto.

Los compromisos no son datos duraderos como `MEMORY.md`, y no son recordatorios
exactos. Están entre la memoria y la automatización: OpenClaw recuerda una
obligación ligada a la conversación, y luego Heartbeat la entrega cuando vence.

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
escribe en la conversación visible y no pide al agente principal
que razone sobre la extracción.

Cuando encuentra un candidato de alta confianza, OpenClaw almacena un compromiso con:

- el id del agente
- la clave de sesión
- el canal original y el destino de entrega
- una ventana de vencimiento
- una breve comprobación sugerida
- metadatos no instructivos para que Heartbeat decida si enviarlo

La entrega ocurre mediante Heartbeat. Cuando un compromiso vence, Heartbeat
añade el compromiso al turno de Heartbeat para el mismo alcance de agente y canal.
El modelo puede enviar una comprobación natural o responder `HEARTBEAT_OK` para descartarlo.
Si Heartbeat está configurado con `target: "none"`, los compromisos vencidos permanecen
internos y no envían comprobaciones externas. Los prompts de entrega de compromisos no
reproducen el texto de la conversación original, y los turnos de Heartbeat de compromisos vencidos se ejecutan
sin herramientas de OpenClaw.

OpenClaw nunca entrega un compromiso inferido inmediatamente después de escribirlo.
La hora de vencimiento se limita a al menos un intervalo de Heartbeat después de que se crea el compromiso,
por lo que el seguimiento no puede repetirse en el mismo momento en que fue
inferido.

## Alcance

Los compromisos tienen alcance limitado al contexto exacto de agente y canal donde se
crearon. Un seguimiento inferido al hablar con un agente en Discord no lo
entrega otro agente, otro canal ni una sesión no relacionada.

Este alcance es parte de la función. Las comprobaciones naturales deben sentirse como la misma
conversación continuando, no como un sistema global de recordatorios.

## Compromisos frente a recordatorios

| Necesidad                                       | Usar                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "Recuérdame a las 3 p. m."                      | [Tareas programadas](/es/automation/cron-jobs) |
| "Hazme un ping en 20 minutos"                   | [Tareas programadas](/es/automation/cron-jobs) |
| "Ejecuta este informe todos los días laborables" | [Tareas programadas](/es/automation/cron-jobs) |
| "Tengo una entrevista mañana"                   | Compromisos                              |
| "Estuve despierto toda la noche"                | Compromisos                              |
| "Haz seguimiento si no respondo a este hilo abierto" | Compromisos                              |

Las solicitudes exactas de usuario ya pertenecen a la ruta del programador. Los compromisos son solo
para seguimientos inferidos: los momentos en los que el usuario no pidió un recordatorio,
pero la conversación creó claramente una comprobación futura útil.

## Gestionar compromisos

Usa la CLI para inspeccionar y borrar compromisos almacenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulta [`openclaw commitments`](/es/cli/commitments) para la referencia del comando.

## Privacidad y costo

La extracción de compromisos usa una pasada de LLM, por lo que habilitarla añade uso de modelo en segundo plano
después de los turnos aptos. La pasada está oculta de la conversación
visible para el usuario, pero puede leer el intercambio reciente necesario para decidir si
existe un seguimiento.

Los compromisos almacenados son estado local de OpenClaw. Son memoria operativa, no
memoria a largo plazo. Deshabilita la función con:

```bash
openclaw config set commitments.enabled false
```

## Solución de problemas

Si no aparecen los seguimientos esperados:

- Confirma que `commitments.enabled` sea `true`.
- Revisa `openclaw commitments --all` para ver registros pendientes, descartados, pospuestos o vencidos.
- Asegúrate de que Heartbeat esté ejecutándose para el agente.
- Comprueba si `commitments.maxPerDay` ya se alcanzó para esa
  sesión de agente.
- Recuerda que los recordatorios exactos se omiten durante la extracción de compromisos y deberían
  aparecer en [tareas programadas](/es/automation/cron-jobs) en su lugar.

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [`openclaw commitments`](/es/cli/commitments)
- [Referencia de configuración](/es/gateway/configuration-reference#commitments)
