---
read_when:
    - Cambiar el comportamiento o los valores predeterminados del indicador de escritura
summary: Cuándo OpenClaw muestra indicadores de escritura y cómo ajustarlos
title: Indicadores de escritura
x-i18n:
    generated_at: "2026-05-06T05:33:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Los indicadores de escritura se envían al canal de chat mientras una ejecución está activa. Usa
`agents.defaults.typingMode` para controlar **cuándo** empieza la escritura y `typingIntervalSeconds`
para controlar **con qué frecuencia** se actualiza.

## Valores predeterminados

Cuando `agents.defaults.typingMode` **no está definido**, OpenClaw conserva el comportamiento heredado:

- **Chats directos**: la escritura empieza inmediatamente una vez que comienza el bucle del modelo.
- **Chats grupales con una mención**: la escritura empieza inmediatamente.
- **Chats grupales sin una mención**: la escritura empieza solo cuando el texto del mensaje comienza a transmitirse.
- **Ejecuciones Heartbeat**: la escritura empieza cuando comienza la ejecución Heartbeat si el
  destino Heartbeat resuelto es un chat compatible con indicadores de escritura y la escritura no está desactivada.

## Modos

Define `agents.defaults.typingMode` con uno de estos valores:

- `never` - ningún indicador de escritura, nunca.
- `instant` - empieza a escribir **tan pronto como comienza el bucle del modelo**, incluso si la ejecución
  luego devuelve solo el token de respuesta silenciosa.
- `thinking` - empieza a escribir en el **primer delta de razonamiento** (requiere
  `reasoningLevel: "stream"` para la ejecución).
- `message` - empieza a escribir en el **primer delta de texto no silencioso** (ignora
  el token silencioso `NO_REPLY`).

Orden de "qué tan pronto se activa":
`never` → `message` → `thinking` → `instant`

## Configuración

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Puedes sobrescribir el modo o la cadencia por sesión:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notas

- El modo `message` no mostrará escritura para respuestas solo silenciosas cuando toda la
  carga útil sea el token silencioso exacto (por ejemplo `NO_REPLY` / `no_reply`,
  comparado sin distinguir mayúsculas y minúsculas).
- `thinking` solo se activa si la ejecución transmite razonamiento (`reasoningLevel: "stream"`).
  Si el modelo no emite deltas de razonamiento, la escritura no empezará.
- La escritura Heartbeat es una señal de actividad para el destino de entrega resuelto. Se
  inicia al comienzo de la ejecución Heartbeat en lugar de seguir el tiempo de streaming de `message` o `thinking`.
  Define `typingMode: "never"` para desactivarla.
- Los Heartbeats no muestran escritura cuando `target: "none"`, cuando el destino no se puede
  resolver, cuando la entrega por chat está desactivada para el Heartbeat o cuando el
  canal no admite escritura.
- `typingIntervalSeconds` controla la **cadencia de actualización**, no la hora de inicio.
  El valor predeterminado es 6 segundos.

## Relacionado

<CardGroup cols={2}>
  <Card title="Presencia" href="/es/concepts/presence" icon="signal">
    Cómo el Gateway rastrea los clientes conectados y los muestra en la pestaña Instancias de macOS.
  </Card>
  <Card title="Streaming y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Comportamiento de streaming saliente, límites de fragmentos y entrega específica del canal.
  </Card>
</CardGroup>
