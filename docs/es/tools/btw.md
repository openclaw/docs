---
read_when:
    - Quieres hacer una pregunta rápida aparte sobre la sesión actual
    - Estás implementando o depurando el comportamiento de BTW en distintos clientes
summary: Preguntas secundarias efímeras con /btw
title: Por cierto, preguntas secundarias
x-i18n:
    generated_at: "2026-05-03T21:38:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` te permite hacer una pregunta lateral rápida sobre la **sesión actual** sin
convertir esa pregunta en historial de conversación normal. `/side` es un alias.

Está inspirado en el comportamiento de `/btw` de Claude Code, pero adaptado al
Gateway de OpenClaw y a su arquitectura multicanal.

## Qué hace

Cuando envías:

```text
/btw what changed?
```

OpenClaw:

1. toma una instantánea del contexto actual de la sesión,
2. ejecuta una llamada de modelo separada **sin herramientas**,
3. responde solo la pregunta lateral,
4. deja intacta la ejecución principal,
5. **no** escribe la pregunta ni la respuesta BTW en el historial de la sesión,
6. emite la respuesta como un **resultado lateral en vivo** en lugar de un mensaje normal del asistente.

El modelo mental importante es:

- mismo contexto de sesión
- consulta lateral separada de una sola ejecución
- sin llamadas a herramientas
- sin contaminación del contexto futuro
- sin persistencia en la transcripción

## Qué no hace

`/btw` **no**:

- crea una nueva sesión duradera,
- continúa la tarea principal inacabada,
- ejecuta herramientas ni bucles de herramientas de agentes,
- escribe datos de pregunta/respuesta BTW en el historial de transcripción,
- aparece en `chat.history`,
- sobrevive a una recarga.

Es intencionadamente **efímero**.

## Cómo funciona el contexto

BTW usa la sesión actual solo como **contexto de fondo**.

Si la ejecución principal está activa, OpenClaw toma una instantánea del estado
actual de los mensajes e incluye el prompt principal en curso como contexto de
fondo, mientras indica explícitamente al modelo:

- responder solo la pregunta lateral,
- no reanudar ni completar la tarea principal inacabada,
- no emitir llamadas a herramientas ni seudollamadas a herramientas.

Eso mantiene BTW aislado de la ejecución principal, a la vez que le permite saber
de qué trata la sesión.

## Modelo de entrega

BTW **no** se entrega como un mensaje normal del asistente en la transcripción.

A nivel del protocolo del Gateway:

- el chat normal del asistente usa el evento `chat`
- BTW usa el evento `chat.side_result`

Esta separación es intencionada. Si BTW reutilizara la ruta normal del evento
`chat`, los clientes lo tratarían como historial de conversación regular.

Como BTW usa un evento en vivo separado y no se reproduce desde
`chat.history`, desaparece después de recargar.

## Comportamiento de la superficie

### TUI

En TUI, BTW se muestra en línea en la vista de la sesión actual, pero sigue
siendo efímero:

- visualmente distinto de una respuesta normal del asistente
- descartable con `Enter` o `Esc`
- no se reproduce al recargar

### Canales externos

En canales como Telegram, WhatsApp y Discord, BTW se entrega como una respuesta
puntual claramente etiquetada, porque esas superficies no tienen un concepto de
superposición efímera local.

La respuesta sigue tratándose como un resultado lateral, no como historial normal
de la sesión.

### Control UI / web

El Gateway emite BTW correctamente como `chat.side_result`, y BTW no se incluye
en `chat.history`, por lo que el contrato de persistencia ya es correcto para la web.

La Control UI actual todavía necesita un consumidor dedicado de `chat.side_result`
para renderizar BTW en vivo en el navegador. Hasta que ese soporte del lado del
cliente llegue, BTW es una función a nivel de Gateway con comportamiento completo
en TUI y canales externos, pero todavía no una UX de navegador completa.

## Cuándo usar BTW

Usa `/btw` cuando quieras:

- una aclaración rápida sobre el trabajo actual,
- una respuesta factual lateral mientras una ejecución larga sigue en curso,
- una respuesta temporal que no deba formar parte del contexto futuro de la sesión.

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

- [Comandos de barra diagonal](/es/tools/slash-commands)
- [Niveles de razonamiento](/es/tools/thinking)
- [Sesión](/es/concepts/session)
