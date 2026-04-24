---
read_when:
    - Cambiar el comportamiento o los valores predeterminados de los indicadores de escritura
summary: Cuándo OpenClaw muestra indicadores de escritura y cómo ajustarlos
title: Indicadores de escritura
x-i18n:
    generated_at: "2026-04-24T05:27:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

Los indicadores de escritura se envían al canal de chat mientras una ejecución está activa. Usa
`agents.defaults.typingMode` para controlar **cuándo** empieza la escritura y `typingIntervalSeconds`
para controlar **con qué frecuencia** se actualiza.

## Valores predeterminados

Cuando `agents.defaults.typingMode` está **sin definir**, OpenClaw mantiene el comportamiento heredado:

- **Chats directos**: la escritura comienza inmediatamente una vez que empieza el bucle del modelo.
- **Chats grupales con mención**: la escritura comienza inmediatamente.
- **Chats grupales sin mención**: la escritura comienza solo cuando el texto del mensaje empieza a transmitirse.
- **Ejecuciones de Heartbeat**: la escritura comienza cuando empieza la ejecución de Heartbeat si el
  destino de Heartbeat resuelto es un chat compatible con escritura y la escritura no está deshabilitada.

## Modos

Establece `agents.defaults.typingMode` en uno de estos valores:

- `never` — no mostrar indicador de escritura nunca.
- `instant` — comenzar a escribir **tan pronto como empieza el bucle del modelo**, incluso si la ejecución
  luego devuelve solo el token de respuesta silenciosa.
- `thinking` — comenzar a escribir en el **primer delta de razonamiento** (requiere
  `reasoningLevel: "stream"` para la ejecución).
- `message` — comenzar a escribir en el **primer delta de texto no silencioso** (ignora
  el token silencioso `NO_REPLY`).

Orden de “qué tan pronto se activa”:
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
  carga útil sea exactamente el token silencioso (por ejemplo `NO_REPLY` / `no_reply`,
  con coincidencia sin distinción entre mayúsculas y minúsculas).
- `thinking` solo se activa si la ejecución transmite razonamiento (`reasoningLevel: "stream"`).
  Si el modelo no emite deltas de razonamiento, la escritura no comenzará.
- La escritura de Heartbeat es una señal de actividad para el destino de entrega resuelto. Comienza
  al inicio de la ejecución de Heartbeat en lugar de seguir la temporización de streaming de `message` o `thinking`.
  Establece `typingMode: "never"` para desactivarla.
- Los Heartbeats no muestran escritura cuando `target: "none"`, cuando no se puede
  resolver el destino, cuando la entrega de chat está deshabilitada para el Heartbeat o cuando el
  canal no admite escritura.
- `typingIntervalSeconds` controla la **cadencia de actualización**, no el momento de inicio.
  El valor predeterminado es 6 segundos.

## Relacionado

- [Presencia](/es/concepts/presence)
- [Streaming y fragmentación](/es/concepts/streaming)
