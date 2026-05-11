---
read_when:
    - Quieres hacer una pregunta rápida aparte sobre la sesión actual
    - Está implementando o depurando el comportamiento de BTW en distintos clientes
summary: Preguntas secundarias efímeras con /btw
title: Por cierto, preguntas secundarias
x-i18n:
    generated_at: "2026-05-11T20:55:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` te permite hacer una pregunta secundaria rápida sobre la **sesión actual** sin
convertir esa pregunta en historial normal de conversación. `/side` es un alias.

Está modelado a partir del comportamiento de `/btw` de Claude Code, pero adaptado al
Gateway y a la arquitectura multicanal de OpenClaw.

## Qué hace

Cuando envías:

```text
/btw what changed?
```

OpenClaw:

1. captura una instantánea del contexto de la sesión actual,
2. ejecuta una consulta secundaria efímera independiente,
3. responde solo la pregunta secundaria,
4. deja intacta la ejecución principal,
5. **no** escribe la pregunta ni la respuesta de BTW en el historial de la sesión,
6. emite la respuesta como un **resultado secundario en vivo** en lugar de un mensaje normal del asistente.

El modelo mental importante es:

- mismo contexto de sesión
- consulta secundaria independiente de una sola vez
- mismo transporte de harness nativo cuando la sesión usa un harness nativo
- sin contaminación de contexto futura
- sin persistencia de transcripción

Para las sesiones del harness de Codex, BTW permanece dentro de Codex al bifurcar el hilo activo
de app-server como un hilo secundario efímero. Eso mantiene intactos OAuth de Codex y el
comportamiento de hilos nativos, a la vez que sigue aislando la respuesta secundaria de la transcripción
principal. Igual que `/side` de Codex, el hilo secundario conserva los permisos actuales de Codex
y la superficie de herramientas nativa, con medidas de protección que indican al modelo que no
trate el trabajo heredado del hilo principal como instrucciones activas. Los runtimes que no son de Codex
mantienen la ruta directa anterior de una sola vez.

## Qué no hace

`/btw` **no**:

- crea una nueva sesión duradera,
- continúa la tarea principal sin terminar,
- escribe datos de la pregunta/respuesta de BTW en el historial de transcripción,
- aparece en `chat.history`,
- sobrevive a una recarga.

Es intencionalmente **efímero**.

## Cómo funciona el contexto

BTW usa la sesión actual solo como **contexto de fondo**.

Si la ejecución principal está activa en ese momento, OpenClaw captura una instantánea del estado actual
de los mensajes e incluye el prompt principal en curso como contexto de fondo, mientras
indica explícitamente al modelo:

- responder solo la pregunta secundaria,
- no reanudar ni completar la tarea principal sin terminar,
- no dirigir la conversación principal.

Eso mantiene BTW aislado de la ejecución principal, a la vez que le permite saber de qué
trata la sesión.

## Modelo de entrega

BTW **no** se entrega como un mensaje normal de transcripción del asistente.

En el nivel de protocolo del Gateway:

- el chat normal del asistente usa el evento `chat`
- BTW usa el evento `chat.side_result`

Esta separación es intencional. Si BTW reutilizara la ruta normal del evento `chat`,
los clientes lo tratarían como historial de conversación regular.

Como BTW usa un evento en vivo separado y no se reproduce desde
`chat.history`, desaparece después de recargar.

## Comportamiento de superficie

### TUI

En TUI, BTW se representa en línea en la vista de la sesión actual, pero sigue siendo
efímero:

- visualmente distinto de una respuesta normal del asistente
- descartable con `Enter` o `Esc`
- no se reproduce al recargar

### Canales externos

En canales como Telegram, WhatsApp y Discord, BTW se entrega como una
respuesta puntual claramente etiquetada porque esas superficies no tienen un concepto de superposición
efímera local.

La respuesta sigue tratándose como un resultado secundario, no como historial normal de la sesión.

### UI de control / web

El Gateway emite BTW correctamente como `chat.side_result`, y BTW no se incluye
en `chat.history`, por lo que el contrato de persistencia ya es correcto para web.

La UI de control actual todavía necesita un consumidor dedicado de `chat.side_result` para
representar BTW en vivo en el navegador. Hasta que llegue ese soporte del lado del cliente, BTW es una
función a nivel de Gateway con comportamiento completo en TUI y canales externos, pero todavía no
una UX completa en navegador.

## Cuándo usar BTW

Usa `/btw` cuando quieras:

- una aclaración rápida sobre el trabajo actual,
- una respuesta factual secundaria mientras una ejecución larga sigue en progreso,
- una respuesta temporal que no debería formar parte del contexto futuro de la sesión.

Ejemplos:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Cuándo no usar BTW

No uses `/btw` cuando quieras que la respuesta pase a formar parte del contexto
de trabajo futuro de la sesión.

En ese caso, pregunta normalmente en la sesión principal en lugar de usar BTW.

## Relacionado

<CardGroup cols={2}>
  <Card title="Slash commands" href="/es/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos y directivas de chat.
  </Card>
  <Card title="Thinking levels" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento para la llamada al modelo de pregunta secundaria.
  </Card>
  <Card title="Session" href="/es/concepts/session" icon="comments">
    Claves de sesión, historial y semántica de persistencia.
  </Card>
  <Card title="Steer command" href="/es/tools/steer" icon="arrow-right">
    Inyecta un mensaje de dirección en la ejecución activa sin terminarla.
  </Card>
</CardGroup>
