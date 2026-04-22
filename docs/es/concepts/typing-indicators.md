---
read_when:
    - Cambiar el comportamiento o los valores predeterminados del indicador de escritura
summary: Cuándo OpenClaw muestra indicadores de escritura y cómo ajustarlos
title: Indicadores de escritura
x-i18n:
    generated_at: "2026-04-22T05:11:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Indicadores de escritura

Los indicadores de escritura se envían al canal de chat mientras una ejecución está activa. Usa
`agents.defaults.typingMode` para controlar **cuándo** comienza la escritura y `typingIntervalSeconds`
para controlar **con qué frecuencia** se actualiza.

## Valores predeterminados

Cuando `agents.defaults.typingMode` está **sin definir**, OpenClaw mantiene el comportamiento heredado:

- **Chats directos**: la escritura comienza de inmediato una vez que empieza el bucle del modelo.
- **Chats grupales con una mención**: la escritura comienza de inmediato.
- **Chats grupales sin una mención**: la escritura comienza solo cuando el texto del mensaje empieza a transmitirse.
- **Ejecuciones de Heartbeat**: la escritura comienza cuando empieza la ejecución de Heartbeat si el
  destino de Heartbeat resuelto es un chat compatible con escritura y la escritura no está deshabilitada.

## Modos

Establece `agents.defaults.typingMode` en uno de estos valores:

- `never` — ningún indicador de escritura, nunca.
- `instant` — comienza a escribir **tan pronto como empieza el bucle del modelo**, incluso si la ejecución
  después devuelve solo el token de respuesta silenciosa.
- `thinking` — comienza a escribir en el **primer delta de razonamiento** (requiere
  `reasoningLevel: "stream"` para la ejecución).
- `message` — comienza a escribir en el **primer delta de texto no silencioso** (ignora
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
  con coincidencia sin distinguir mayúsculas de minúsculas).
- `thinking` solo se activa si la ejecución transmite razonamiento (`reasoningLevel: "stream"`).
  Si el modelo no emite deltas de razonamiento, la escritura no comenzará.
- La escritura de Heartbeat es una señal de actividad del destino de entrega resuelto. Esta
  comienza al inicio de la ejecución de Heartbeat en lugar de seguir la temporización de transmisión
  de `message` o `thinking`. Establece `typingMode: "never"` para deshabilitarla.
- Los Heartbeats no muestran escritura cuando `target: "none"`, cuando el destino no puede
  resolverse, cuando la entrega al chat está deshabilitada para el Heartbeat o cuando el
  canal no admite escritura.
- `typingIntervalSeconds` controla la **cadencia de actualización**, no el momento de inicio.
  El valor predeterminado es 6 segundos.
