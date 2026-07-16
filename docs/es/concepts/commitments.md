---
read_when:
    - Quieres que OpenClaw recuerde los seguimientos naturales
    - Quieres entender en qué se diferencian las confirmaciones inferidas de los recordatorios
    - Desea revisar o descartar los compromisos de seguimiento
sidebarTitle: Commitments
summary: Memoria de seguimiento inferida para comprobaciones que no son recordatorios exactos
title: Compromisos inferidos
x-i18n:
    generated_at: "2026-07-16T11:31:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Los compromisos son recuerdos de seguimiento de corta duración. Cuando están habilitados, OpenClaw puede
detectar que una conversación creó una oportunidad de volver a ponerse en contacto en el futuro y recordarla
para retomarla más adelante.

Ejemplos:

- Se menciona una entrevista para mañana. OpenClaw puede preguntar después cómo fue.
- Se dice que se está agotado. OpenClaw puede preguntar más adelante si se durmió.
- El agente dice que hará un seguimiento después de que algo cambie. OpenClaw puede realizar un seguimiento
  de ese asunto pendiente.

Los compromisos no son hechos duraderos como `MEMORY.md` ni son
recordatorios exactos. Se sitúan entre la memoria y la automatización: OpenClaw recuerda una
obligación vinculada a una conversación y, después, Heartbeat la entrega cuando corresponde.

## Habilitar los compromisos

Los compromisos están desactivados de forma predeterminada (`commitments.enabled: false`). Se habilitan en la configuración:

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

`commitments.maxPerDay` limita cuántos seguimientos inferidos pueden entregarse
por sesión de agente durante un día móvil. El valor predeterminado es `3`.

## Cómo funciona

Después de una respuesta del agente, OpenClaw puede ejecutar en segundo plano una fase oculta de extracción en un
contexto independiente, con las herramientas deshabilitadas. Esa fase busca únicamente compromisos de seguimiento inferidos.
No escribe en la conversación visible ni pide al agente principal
que razone sobre la extracción.

Cuando encuentra un candidato con un alto grado de confianza, OpenClaw almacena un compromiso con:

- el identificador del agente
- la clave de sesión
- el canal original y el destino de entrega
- un intervalo de vencimiento
- un breve mensaje sugerido para retomar el contacto
- metadatos no instructivos para que Heartbeat decida si debe enviarlo

La entrega se realiza mediante Heartbeat. Cuando vence un compromiso, Heartbeat
lo añade al turno de Heartbeat para el mismo ámbito de agente y canal.
El prompt advierte explícitamente que los metadatos del compromiso no son de confianza e indica
al modelo que no siga sus instrucciones ni use herramientas por causa de ellos. El
modelo puede enviar un único mensaje natural para retomar el contacto o responder `HEARTBEAT_OK` para descartarlo.
Si Heartbeat está configurado con `target: "none"`, los compromisos vencidos permanecen
internos y no se envían mensajes externos para retomar el contacto. Los prompts de entrega de compromisos no
reproducen el texto de la conversación original, sino únicamente el mensaje sugerido para retomar el contacto y los
metadatos, y los turnos de Heartbeat de compromisos vencidos se ejecutan sin herramientas de OpenClaw.

OpenClaw nunca entrega un compromiso inferido inmediatamente después de escribirlo.
La hora de vencimiento se limita a un mínimo de un intervalo de Heartbeat posterior a la creación del compromiso,
por lo que el seguimiento no puede repetirse en el mismo momento en que se
infirió.

## Ámbito

Los compromisos se limitan al contexto exacto de agente y canal donde se
crearon. Un seguimiento inferido al hablar con un agente en Discord no lo
entrega otro agente, otro canal ni una sesión no relacionada.

Este ámbito forma parte de la función. Los mensajes naturales para retomar el contacto deben percibirse como la continuación de la misma
conversación, no como un sistema global de recordatorios.

## Compromisos frente a recordatorios

| Necesidad                                       | Usar                                     |
| ----------------------------------------------- | ---------------------------------------- |
| "Recuérdame a las 3 p. m."                      | [Tareas programadas](/es/automation/cron-jobs) |
| "Avísame dentro de 20 minutos"                  | [Tareas programadas](/es/automation/cron-jobs) |
| "Ejecuta este informe todos los días laborables" | [Tareas programadas](/es/automation/cron-jobs) |
| "Tengo una entrevista mañana"                   | Compromisos                              |
| "Estuve despierto toda la noche"                | Compromisos                              |
| "Haz un seguimiento si no respondo a este hilo abierto" | Compromisos                     |

Las solicitudes exactas de los usuarios ya corresponden a la ruta del programador. Los compromisos son únicamente
para seguimientos inferidos: aquellos momentos en los que el usuario no solicitó un recordatorio,
pero la conversación creó claramente una oportunidad útil de retomar el contacto en el futuro.

## Gestionar los compromisos

Se usa la CLI para inspeccionar y borrar los compromisos almacenados:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consulte [`openclaw commitments`](/es/cli/commitments) para ver la referencia completa del comando.

## Privacidad y coste

La extracción de compromisos usa una fase de LLM, por lo que habilitarla añade uso del modelo en segundo plano
después de los turnos aptos. La fase se oculta de la conversación
visible para el usuario, pero puede leer el intercambio reciente necesario para decidir si
existe un seguimiento.

Los compromisos almacenados son memoria operativa local de OpenClaw en la base de datos de estado
compartida de SQLite, no memoria a largo plazo. La función se deshabilita con:

```bash
openclaw config set commitments.enabled false
```

## Solución de problemas

Si no aparecen los seguimientos esperados:

- Confirme que `commitments.enabled` sea `true`.
- Compruebe `openclaw commitments --all` para consultar registros pendientes, descartados, pospuestos o caducados.
- Asegúrese de que Heartbeat esté ejecutándose para el agente.
- Compruebe si ya se ha alcanzado `commitments.maxPerDay` para esa
  sesión de agente.
- Recuerde que la extracción de compromisos omite los recordatorios exactos y que estos deben
  aparecer en [tareas programadas](/es/automation/cron-jobs).

## Contenido relacionado

- [Descripción general de la memoria](/es/concepts/memory)
- [Active Memory](/es/concepts/active-memory)
- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [`openclaw commitments`](/es/cli/commitments)
- [Referencia de configuración](/es/gateway/configuration-reference#commitments)
