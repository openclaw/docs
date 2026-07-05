---
read_when:
    - Quieres hacer una pregunta rápida aparte sobre la sesión actual
    - Está implementando o depurando el comportamiento de BTW en distintos clientes
summary: Preguntas secundarias efímeras con /btw
title: Por cierto, preguntas secundarias
x-i18n:
    generated_at: "2026-07-05T11:45:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c20220c037e4b6963b1708f75dc7f268a76b88b297363e9b65e6d3d8bfa6d26a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (alias `/side`) hace una pregunta secundaria rápida sobre la **sesión
actual** sin añadirla al historial de conversación. Está modelado a partir de
`/btw` de Claude Code, adaptado al Gateway de OpenClaw y a la arquitectura
multicanal.

```text
/btw what changed?
/side what does this error mean?
```

## Qué hace

1. Captura una instantánea de la sesión actual como contexto de fondo (incluido cualquier
   prompt de ejecución principal en curso).
2. Ejecuta una consulta secundaria separada y de una sola vez, indicándole al modelo que responda solo a la
   pregunta secundaria y que no reanude ni dirija la tarea principal.
3. Entrega la respuesta como un resultado secundario en vivo, no como un mensaje normal del asistente.
4. Nunca escribe la pregunta ni la respuesta en el historial de la sesión ni en `chat.history`.

La ejecución principal, si hay una activa, queda intacta.

Para sesiones del arnés de Codex, BTW bifurca el hilo activo del servidor de aplicaciones de Codex en
un hilo hijo efímero en lugar de ejecutar una llamada separada al proveedor. Esto
mantiene intactos el OAuth de Codex y el comportamiento nativo de herramientas/hilos, y el hilo
bifurcado conserva la política de aprobación, el sandbox y la superficie de herramientas nativas actuales
del hilo padre. El hilo bifurcado recibe un prompt de límite que le indica al modelo que
todo lo anterior es contexto de referencia heredado, no instrucciones activas,
y que solo los mensajes posteriores al límite están activos. `/btw` requiere un
hilo de Codex existente; envía primero un mensaje normal.

Para los alias de tiempo de ejecución de CLI, BTW invoca el backend de CLI propietario en modo de
pregunta secundaria de una sola vez: siembra contexto de conversación saneado en una invocación nueva de CLI
con la agrupación de herramientas y el estado de sesión reutilizable deshabilitados, y añade
cualquier flag de no reanudar/sin herramientas que admita el backend. Los tiempos de ejecución directos (no CLI)
usan en su lugar una llamada directa y de una sola vez al proveedor.

## Qué no hace

`/btw` no crea una sesión duradera, no continúa la tarea principal sin terminar,
no persiste datos de pregunta/respuesta en el historial de transcripción ni sobrevive a una recarga.

## Modelo de entrega

El chat normal del asistente usa el evento `chat` del Gateway. BTW usa un evento
`chat.side_result` separado para que los clientes no puedan confundirlo con el historial de
conversación normal. Como no se reproduce desde `chat.history`, desaparece
después de recargar.

## Comportamiento de superficie

| Superficie        | Comportamiento                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Se muestra en línea en el registro del chat, claramente distinto de una respuesta normal, descartable con `Enter` o `Esc`.                              |
| Canales externos  | Se entrega como una respuesta única claramente etiquetada (Telegram, WhatsApp, Discord no tienen superposición efímera local).                          |
| Control UI / web  | El Gateway emite `chat.side_result` correctamente y se excluye de `chat.history`, pero Control UI aún no tiene consumidor para renderizarlo en vivo en el navegador. |

## Cuándo usarlo

Usa `/btw` para una aclaración rápida, una respuesta secundaria factual mientras una ejecución larga
sigue en progreso, o una respuesta temporal que no deba entrar en el contexto
futuro de la sesión.

```text
/btw what file are we editing?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

Para cualquier cosa que quieras que forme parte del contexto de trabajo futuro
de la sesión, pregunta normalmente en la sesión principal.

## Relacionado

<CardGroup cols={2}>
  <Card title="Comandos de barra" href="/es/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos y directivas de chat.
  </Card>
  <Card title="Niveles de pensamiento" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento para la llamada al modelo de pregunta secundaria.
  </Card>
  <Card title="Sesión" href="/es/concepts/session" icon="comments">
    Claves de sesión, historial y semántica de persistencia.
  </Card>
  <Card title="Comando steer" href="/es/tools/steer" icon="arrow-right">
    Inyecta un mensaje de direccionamiento en la ejecución activa sin finalizarla.
  </Card>
</CardGroup>
