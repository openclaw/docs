---
read_when:
    - Quieres hacer una pregunta secundaria rápida sobre la sesión actual
    - Estás implementando o depurando el comportamiento de BTW entre clientes
summary: Preguntas secundarias efímeras con /btw
title: Por cierto, preguntas secundarias
x-i18n:
    generated_at: "2026-06-27T13:01:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` te permite hacer una pregunta lateral rápida sobre la **sesión actual** sin
convertir esa pregunta en historial de conversación normal. `/side` es un alias.

Está modelado a partir del comportamiento `/btw` de Claude Code, pero adaptado al
Gateway de OpenClaw y a su arquitectura multicanal.

## Qué hace

Cuando envías:

```text
/btw what changed?
```

OpenClaw:

1. toma una instantánea del contexto de la sesión actual,
2. ejecuta una consulta lateral efímera separada,
3. responde solo la pregunta lateral,
4. deja intacta la ejecución principal,
5. **no** escribe la pregunta ni la respuesta de BTW en el historial de la sesión,
6. emite la respuesta como un **resultado lateral en vivo** en lugar de como un mensaje normal del asistente.

El modelo mental importante es:

- el mismo contexto de sesión
- una consulta lateral separada de un solo uso
- el mismo transporte de arnés nativo cuando la sesión usa un arnés nativo
- sin contaminación futura del contexto
- sin persistencia de transcripción

En sesiones con arnés de Codex, BTW permanece dentro de Codex bifurcando el hilo
activo de app-server como un hilo lateral efímero. Esto mantiene intactos OAuth de
Codex y el comportamiento de hilos nativos, a la vez que aísla la respuesta lateral
de la transcripción principal. Al igual que `/side` de Codex, el hilo lateral conserva
los permisos actuales de Codex y la superficie de herramientas nativas, con barreras
de seguridad que indican al modelo que no trate el trabajo heredado del hilo principal
como instrucciones activas.

Para alias de entorno de ejecución de CLI, BTW usa el backend de CLI propietario en
modo de pregunta lateral en lugar de recurrir a una llamada directa al proveedor.
OpenClaw inicializa contexto de conversación saneado en una invocación nueva de CLI
de un solo uso, desactiva el agrupamiento de herramientas MCP de OpenClaw y el estado
reutilizable de sesión de CLI para esa invocación, y permite que el backend agregue
cualquier marca nativa de CLI de no reanudar o sin herramientas que admita. Los entornos
de ejecución directos no CLI mantienen la ruta directa de un solo uso.

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

Si la ejecución principal está activa, OpenClaw toma una instantánea del estado actual
de los mensajes e incluye la indicación principal en curso como contexto de fondo,
mientras indica explícitamente al modelo:

- responde solo la pregunta lateral,
- no reanudes ni completes la tarea principal sin terminar,
- no dirijas la conversación principal.

Eso mantiene BTW aislado de la ejecución principal, sin dejar de hacerlo consciente
de qué trata la sesión.

## Modelo de entrega

BTW **no** se entrega como un mensaje normal de transcripción del asistente.

En el nivel del protocolo Gateway:

- el chat normal del asistente usa el evento `chat`
- BTW usa el evento `chat.side_result`

Esta separación es intencional. Si BTW reutilizara la ruta normal del evento `chat`,
los clientes lo tratarían como historial de conversación regular.

Como BTW usa un evento en vivo separado y no se reproduce desde `chat.history`,
desaparece después de recargar.

## Comportamiento de superficie

### TUI

En TUI, BTW se representa en línea en la vista de la sesión actual, pero sigue siendo
efímero:

- visualmente distinto de una respuesta normal del asistente
- descartable con `Enter` o `Esc`
- no se reproduce al recargar

### Canales externos

En canales como Telegram, WhatsApp y Discord, BTW se entrega como una respuesta
puntual claramente etiquetada porque esas superficies no tienen un concepto local
de superposición efímera.

La respuesta sigue tratándose como un resultado lateral, no como historial normal
de la sesión.

### Control UI / web

El Gateway emite BTW correctamente como `chat.side_result`, y BTW no se incluye
en `chat.history`, por lo que el contrato de persistencia ya es correcto para web.

La Control UI actual todavía necesita un consumidor dedicado de `chat.side_result`
para representar BTW en vivo en el navegador. Hasta que llegue ese soporte del lado
del cliente, BTW es una función a nivel de Gateway con comportamiento completo en
TUI y canales externos, pero todavía no una UX completa de navegador.

## Cuándo usar BTW

Usa `/btw` cuando quieras:

- una aclaración rápida sobre el trabajo actual,
- una respuesta factual lateral mientras una ejecución larga sigue en curso,
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

No uses `/btw` cuando quieras que la respuesta forme parte del contexto de trabajo
futuro de la sesión.

En ese caso, pregunta normalmente en la sesión principal en lugar de usar BTW.

## Relacionado

<CardGroup cols={2}>
  <Card title="Comandos de barra" href="/es/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos y directivas de chat.
  </Card>
  <Card title="Niveles de pensamiento" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento para la llamada al modelo de pregunta lateral.
  </Card>
  <Card title="Sesión" href="/es/concepts/session" icon="comments">
    Claves de sesión, historial y semántica de persistencia.
  </Card>
  <Card title="Comando de dirección" href="/es/tools/steer" icon="arrow-right">
    Inyecta un mensaje de dirección en la ejecución activa sin finalizarla.
  </Card>
</CardGroup>
