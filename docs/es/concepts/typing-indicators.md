---
read_when:
    - Cambiar el comportamiento o los valores predeterminados del indicador de escritura
summary: Cuándo OpenClaw muestra indicadores de escritura y cómo ajustarlos
title: Indicadores de escritura
x-i18n:
    generated_at: "2026-05-11T20:32:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Los indicadores de escritura se envían al canal de chat mientras una ejecución está activa. Usa
`agents.defaults.typingMode` para controlar **cuándo** comienza la escritura y `typingIntervalSeconds`
para controlar **con qué frecuencia** se actualiza.

## Predeterminados

Cuando `agents.defaults.typingMode` **no está definido**, OpenClaw conserva el comportamiento heredado:

- **Chats directos**: la escritura comienza inmediatamente una vez que empieza el bucle del modelo.
- **Chats grupales con una mención**: la escritura comienza inmediatamente.
- **Chats grupales sin una mención**: la escritura comienza solo cuando el texto del mensaje empieza a transmitirse en streaming.
- **Ejecuciones de Heartbeat**: la escritura comienza cuando empieza la ejecución de Heartbeat si el
  destino de Heartbeat resuelto es un chat compatible con escritura y la escritura no está deshabilitada.

## Modos

Establece `agents.defaults.typingMode` en uno de:

- `never` - ningún indicador de escritura, nunca.
- `instant` - empieza a escribir **tan pronto como comienza el bucle del modelo**, incluso si la ejecución
  después devuelve solo el token de respuesta silenciosa.
- `thinking` - empieza a escribir en el **primer delta de razonamiento** (requiere
  `reasoningLevel: "stream"` para la ejecución).
- `message` - empieza a escribir en el **primer delta de texto no silencioso** (ignora
  el token silencioso `NO_REPLY`).

Orden de “qué tan pronto se activa”:
`never` → `message` → `thinking` → `instant`

## Configuración

Establece el valor predeterminado a nivel de agente:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Sobrescribe el modo o la cadencia por sesión:

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
  con coincidencia sin distinguir mayúsculas y minúsculas).
- `thinking` solo se activa si la ejecución transmite razonamiento (`reasoningLevel: "stream"`).
  Si el modelo no emite deltas de razonamiento, la escritura no comenzará.
- La escritura de Heartbeat es una señal de actividad para el destino de entrega resuelto. Se
  inicia al comienzo de la ejecución de Heartbeat en lugar de seguir la sincronización del flujo
  de `message` o `thinking`. Establece `typingMode: "never"` para desactivarla.
- Los Heartbeats no muestran escritura cuando `target: "none"`, cuando el destino no puede
  resolverse, cuando la entrega por chat está desactivada para el heartbeat o cuando el
  canal no admite escritura.
- `typingIntervalSeconds` controla la **cadencia de actualización**, no la hora de inicio.
  El valor predeterminado es 6 segundos.

## Relacionado

<CardGroup cols={2}>
  <Card title="Presencia" href="/es/concepts/presence" icon="signal">
    Cómo el Gateway rastrea los clientes conectados y los muestra en la pestaña Instances de macOS.
  </Card>
  <Card title="Streaming y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Comportamiento de streaming saliente, límites de fragmentos y entrega específica del canal.
  </Card>
</CardGroup>
