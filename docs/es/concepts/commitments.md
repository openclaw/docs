---
read_when:
    - Quieres que OpenClaw recuerde seguimientos naturales
    - Quieres entender en qué se diferencian los registros inferidos de los recordatorios
    - Quieres revisar o descartar compromisos de seguimiento
sidebarTitle: Commitments
summary: Memoria de seguimiento inferida para registros que no son recordatorios exactos
title: Compromisos inferidos
x-i18n:
    generated_at: "2026-07-05T11:11:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Los compromisos son memorias de seguimiento de corta duración. Cuando están habilitados, OpenClaw puede
detectar que una conversación creó una oportunidad futura de comprobación y recordar
retomarla más adelante.

Ejemplos:

- Mencionas una entrevista mañana. OpenClaw puede hacer una comprobación después.
- Dices que estás agotado. OpenClaw puede preguntar más tarde si dormiste.
- El agente dice que hará seguimiento después de que algo cambie. OpenClaw puede rastrear
  ese bucle abierto.

Los compromisos no son hechos duraderos como `MEMORY.md`, y no son recordatorios
exactos. Se ubican entre la memoria y la automatización: OpenClaw recuerda una
obligación vinculada a la conversación, luego Heartbeat la entrega cuando vence.

## Habilitar compromisos

Los compromisos están desactivados de forma predeterminada (`commitments.enabled: false`). Habilítalos en la configuración:

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
contexto separado, con las herramientas deshabilitadas. Esa pasada solo busca compromisos de seguimiento inferidos. No
escribe en la conversación visible y no le pide al agente principal
que razone sobre la extracción.

Cuando encuentra un candidato de alta confianza, OpenClaw almacena un compromiso con:

- el id del agente
- la clave de sesión
- el canal original y el destino de entrega
- una ventana de vencimiento
- una comprobación breve sugerida
- metadatos no instructivos para que Heartbeat decida si enviarlo

La entrega se realiza mediante Heartbeat. Cuando un compromiso vence, Heartbeat
agrega el compromiso al turno de Heartbeat para el mismo ámbito de agente y canal.
El prompt advierte explícitamente que los metadatos del compromiso no son de confianza e instruye
al modelo a no seguir instrucciones en ellos ni usar herramientas debido a ellos. El
modelo puede enviar una comprobación natural o responder `HEARTBEAT_OK` para descartarlo.
Si Heartbeat está configurado con `target: "none"`, los compromisos vencidos permanecen
internos y no envían comprobaciones externas. Los prompts de entrega de compromisos no
reproducen el texto original de la conversación, solo la comprobación sugerida y los
metadatos, y los turnos de Heartbeat de compromisos vencidos se ejecutan sin herramientas de OpenClaw.

OpenClaw nunca entrega un compromiso inferido inmediatamente después de escribirlo.
La hora de vencimiento se limita a al menos un intervalo de Heartbeat después de que se crea el compromiso,
por lo que el seguimiento no puede repetirse en el mismo momento en que fue
inferido.

## Alcance

Los compromisos se limitan al contexto exacto de agente y canal donde fueron
creados. Un seguimiento inferido mientras se habla con un agente en Discord no es
entregado por otro agente, otro canal o una sesión no relacionada.

Este alcance es parte de la funcionalidad. Las comprobaciones naturales deben sentirse como si la misma
conversación continuara, no como un sistema global de recordatorios.

## Compromisos vs recordatorios

| Necesidad                                       | Usar                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "Recuérdame a las 3 PM"                         | [Tareas programadas](/es/automation/cron-jobs) |
| "Avísame en 20 minutos"                         | [Tareas programadas](/es/automation/cron-jobs) |
| "Ejecuta este informe todos los días laborables" | [Tareas programadas](/es/automation/cron-jobs) |
| "Tengo una entrevista mañana"                   | Compromisos                              |
| "Estuve despierto toda la noche"                | Compromisos                              |
| "Haz seguimiento si no respondo a este hilo abierto" | Compromisos                              |

Las solicitudes exactas del usuario ya pertenecen a la ruta del programador. Los compromisos son solo
para seguimientos inferidos: los momentos en que el usuario no pidió un recordatorio,
pero la conversación claramente creó una comprobación futura útil.

## Gestionar compromisos

Usa la CLI para inspeccionar y borrar compromisos almacenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulta [`openclaw commitments`](/es/cli/commitments) para la referencia completa del comando.

## Privacidad y costo

La extracción de compromisos usa una pasada de LLM, por lo que habilitarla agrega uso del modelo
en segundo plano después de turnos elegibles. La pasada está oculta de la conversación
visible para el usuario, pero puede leer el intercambio reciente necesario para decidir si
existe un seguimiento.

Los compromisos almacenados son estado local de OpenClaw. Son memoria operativa, no
memoria a largo plazo. Deshabilita la funcionalidad con:

```bash
openclaw config set commitments.enabled false
```

## Solución de problemas

Si los seguimientos esperados no aparecen:

- Confirma que `commitments.enabled` sea `true`.
- Revisa `openclaw commitments --all` para ver registros pendientes, descartados, pospuestos o vencidos.
- Asegúrate de que Heartbeat se esté ejecutando para el agente.
- Comprueba si `commitments.maxPerDay` ya se alcanzó para esa
  sesión de agente.
- Recuerda que los recordatorios exactos se omiten en la extracción de compromisos y deberían
  aparecer bajo [tareas programadas](/es/automation/cron-jobs) en su lugar.

## Relacionado

- [Resumen de memoria](/es/concepts/memory)
- [Active memory](/es/concepts/active-memory)
- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [`openclaw commitments`](/es/cli/commitments)
- [Referencia de configuración](/es/gateway/configuration-reference#commitments)
