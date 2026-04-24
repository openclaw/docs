---
read_when:
    - Quieres hacer una pregunta lateral rápida sobre la sesión actual
    - Estás implementando o depurando el comportamiento de BTW en distintos clientes
summary: Preguntas laterales efímeras con /btw
title: Preguntas laterales BTW
x-i18n:
    generated_at: "2026-04-24T05:52:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw` te permite hacer una pregunta lateral rápida sobre la **sesión actual** sin
convertir esa pregunta en historial normal de conversación.

Está modelado a partir del comportamiento `/btw` de Claude Code, pero adaptado a la arquitectura multi-canal y de Gateway de OpenClaw.

## Qué hace

Cuando envías:

```text
/btw what changed?
```

OpenClaw:

1. toma una instantánea del contexto de la sesión actual,
2. ejecuta una llamada de modelo separada **sin herramientas**,
3. responde solo a la pregunta lateral,
4. deja intacta la ejecución principal,
5. **no** escribe la pregunta ni la respuesta de BTW en el historial de la sesión,
6. emite la respuesta como un **resultado lateral en vivo** en lugar de como un mensaje normal del asistente.

El modelo mental importante es:

- mismo contexto de sesión
- consulta lateral separada de una sola vez
- sin llamadas de herramientas
- sin contaminar contexto futuro
- sin persistencia en la transcripción

## Qué no hace

`/btw` **no**:

- crea una nueva sesión duradera,
- continúa la tarea principal inacabada,
- ejecuta herramientas ni bucles de herramientas del agente,
- escribe los datos de pregunta/respuesta de BTW en el historial de transcripción,
- aparece en `chat.history`,
- sobrevive a una recarga.

Es intencionadamente **efímero**.

## Cómo funciona el contexto

BTW usa la sesión actual solo como **contexto de fondo**.

Si la ejecución principal está activa en ese momento, OpenClaw toma una instantánea del estado actual de los mensajes e incluye el prompt principal en curso como contexto de fondo, mientras le indica explícitamente al modelo:

- responder solo a la pregunta lateral,
- no reanudar ni completar la tarea principal inacabada,
- no emitir llamadas de herramientas ni pseudo-llamadas de herramientas.

Eso mantiene BTW aislado de la ejecución principal y al mismo tiempo consciente de
sobre qué trata la sesión.

## Modelo de entrega

BTW **no** se entrega como un mensaje normal del asistente en la transcripción.

A nivel de protocolo Gateway:

- el chat normal del asistente usa el evento `chat`
- BTW usa el evento `chat.side_result`

Esta separación es intencionada. Si BTW reutilizara la ruta normal del evento `chat`,
los clientes lo tratarían como historial normal de conversación.

Como BTW usa un evento separado en vivo y no se reproduce desde
`chat.history`, desaparece tras una recarga.

## Comportamiento de la superficie

### TUI

En TUI, BTW se renderiza en línea en la vista de la sesión actual, pero sigue
siendo efímero:

- visiblemente distinto de una respuesta normal del asistente
- descartable con `Enter` o `Esc`
- no se reproduce al recargar

### Canales externos

En canales como Telegram, WhatsApp y Discord, BTW se entrega como una
respuesta puntual claramente etiquetada porque esas superficies no tienen un concepto local de superposición efímera.

La respuesta sigue tratándose como un resultado lateral, no como historial normal de sesión.

### Control UI / web

El Gateway emite BTW correctamente como `chat.side_result`, y BTW no se incluye
en `chat.history`, por lo que el contrato de persistencia ya es correcto para web.

La Control UI actual aún necesita un consumidor dedicado de `chat.side_result` para
renderizar BTW en vivo en el navegador. Hasta que llegue ese soporte del lado del cliente, BTW es una función a nivel de Gateway con comportamiento completo en TUI y canales externos, pero todavía no una UX completa de navegador.

## Cuándo usar BTW

Usa `/btw` cuando quieras:

- una aclaración rápida sobre el trabajo actual,
- una respuesta lateral factual mientras una ejecución larga sigue en curso,
- una respuesta temporal que no debería formar parte del contexto futuro de la sesión.

Ejemplos:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Cuándo no usar BTW

No uses `/btw` cuando quieras que la respuesta pase a formar parte del
contexto de trabajo futuro de la sesión.

En ese caso, pregunta normalmente en la sesión principal en lugar de usar BTW.

## Relacionado

- [Comandos de barra](/es/tools/slash-commands)
- [Niveles de thinking](/es/tools/thinking)
- [Sesión](/es/concepts/session)
