---
read_when:
    - Quieres que OpenClaw recuerde los seguimientos naturales
    - Quieres entender en qué se diferencian los registros inferidos de los recordatorios
    - Quieres revisar o descartar compromisos de seguimiento.
sidebarTitle: Commitments
summary: Memoria inferida de seguimiento para comprobaciones que no son recordatorios exactos
title: Compromisos inferidos
x-i18n:
    generated_at: "2026-07-11T23:02:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Los compromisos son recuerdos de seguimiento de corta duración. Cuando están habilitados, OpenClaw puede detectar que una conversación creó una oportunidad de retomar el contacto en el futuro y recordar volver a mencionarla más adelante.

Ejemplos:

- Mencionas una entrevista para mañana. OpenClaw puede preguntarte después cómo fue.
- Dices que estás agotado. OpenClaw puede preguntarte más adelante si dormiste.
- El agente dice que hará un seguimiento después de que algo cambie. OpenClaw puede mantener pendiente ese asunto.

Los compromisos no son hechos duraderos como `MEMORY.md` ni recordatorios exactos. Se sitúan entre la memoria y la automatización: OpenClaw recuerda una obligación vinculada a una conversación y, cuando llega el momento, Heartbeat se encarga de presentarla.

## Habilitar los compromisos

Los compromisos están desactivados de forma predeterminada (`commitments.enabled: false`). Habilítalos en la configuración:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Configuración equivalente en `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` limita cuántos seguimientos inferidos pueden entregarse por sesión de agente durante un periodo móvil de un día. El valor predeterminado es `3`.

## Cómo funciona

Después de una respuesta del agente, OpenClaw puede ejecutar en segundo plano una fase oculta de extracción en un contexto separado, con las herramientas deshabilitadas. Esta fase busca únicamente compromisos de seguimiento inferidos. No escribe en la conversación visible ni solicita al agente principal que razone sobre la extracción.

Cuando encuentra un candidato con un alto grado de confianza, OpenClaw almacena un compromiso con:

- el identificador del agente
- la clave de sesión
- el canal original y el destino de entrega
- un intervalo de vencimiento
- una breve sugerencia para retomar el contacto
- metadatos no instructivos para que Heartbeat decida si debe enviarlo

La entrega se realiza mediante Heartbeat. Cuando vence un compromiso, Heartbeat lo añade al turno de Heartbeat correspondiente al mismo ámbito de agente y canal. El mensaje advierte explícitamente que los metadatos del compromiso no son de confianza e indica al modelo que no siga sus instrucciones ni utilice herramientas debido a ellos. El modelo puede enviar un único mensaje natural de seguimiento o responder `HEARTBEAT_OK` para descartarlo. Si Heartbeat está configurado con `target: "none"`, los compromisos vencidos permanecen internos y no envían mensajes de seguimiento externos. Los mensajes de entrega de compromisos no reproducen el texto de la conversación original, sino únicamente la sugerencia de seguimiento y los metadatos, y los turnos de Heartbeat con compromisos vencidos se ejecutan sin herramientas de OpenClaw.

OpenClaw nunca entrega un compromiso inferido inmediatamente después de guardarlo. La hora de vencimiento se ajusta para que sea, como mínimo, un intervalo de Heartbeat posterior a la creación del compromiso, de modo que el seguimiento no pueda repetirse en el mismo momento en que se infirió.

## Ámbito

Los compromisos se limitan exactamente al contexto del agente y del canal en el que se crearon. Un seguimiento inferido mientras se habla con un agente en Discord no lo entrega otro agente, otro canal ni una sesión sin relación.

Este ámbito forma parte de la funcionalidad. Los mensajes naturales de seguimiento deben percibirse como la continuación de la misma conversación, no como un sistema global de recordatorios.

## Compromisos frente a recordatorios

| Necesidad                                       | Usar                                            |
| ----------------------------------------------- | ----------------------------------------------- |
| "Recuérdamelo a las 3 p. m."                    | [Tareas programadas](/es/automation/cron-jobs)     |
| "Avísame dentro de 20 minutos"                  | [Tareas programadas](/es/automation/cron-jobs)     |
| "Ejecuta este informe todos los días laborables" | [Tareas programadas](/es/automation/cron-jobs)    |
| "Tengo una entrevista mañana"                   | Compromisos                                     |
| "Estuve despierto toda la noche"                | Compromisos                                     |
| "Haz un seguimiento si no respondo a este hilo abierto" | Compromisos                             |

Las solicitudes explícitas del usuario ya corresponden al flujo del programador. Los compromisos solo se utilizan para seguimientos inferidos: situaciones en las que el usuario no solicitó un recordatorio, pero la conversación generó claramente una oportunidad útil para retomar el contacto en el futuro.

## Gestionar los compromisos

Utiliza la CLI para consultar y eliminar los compromisos almacenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulta [`openclaw commitments`](/es/cli/commitments) para ver la referencia completa del comando.

## Privacidad y coste

La extracción de compromisos utiliza una ejecución de un LLM, por lo que habilitarla añade uso del modelo en segundo plano después de los turnos aptos. Esta ejecución permanece oculta en la conversación visible para el usuario, pero puede leer el intercambio reciente necesario para determinar si existe un seguimiento.

Los compromisos almacenados forman parte del estado local de OpenClaw. Son memoria operativa, no memoria a largo plazo. Deshabilita la funcionalidad con:

```bash
openclaw config set commitments.enabled false
```

## Solución de problemas

Si no aparecen los seguimientos esperados:

- Confirma que `commitments.enabled` sea `true`.
- Consulta `openclaw commitments --all` para ver registros pendientes, descartados, pospuestos o vencidos.
- Asegúrate de que Heartbeat esté en ejecución para el agente.
- Comprueba si ya se alcanzó `commitments.maxPerDay` para esa sesión del agente.
- Recuerda que la extracción de compromisos omite los recordatorios explícitos, que deberían aparecer en [tareas programadas](/es/automation/cron-jobs).

## Temas relacionados

- [Descripción general de la memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [`openclaw commitments`](/es/cli/commitments)
- [Referencia de configuración](/es/gateway/configuration-reference#commitments)
