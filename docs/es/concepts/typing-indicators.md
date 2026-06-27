---
read_when:
    - Cambiar el comportamiento o los valores predeterminados del indicador de escritura
summary: Cuándo muestra OpenClaw indicadores de escritura y cómo ajustarlos
title: Indicadores de escritura
x-i18n:
    generated_at: "2026-06-27T11:21:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Los indicadores de escritura se envían al canal de chat mientras una ejecución está activa. Usa
`agents.defaults.typingMode` para controlar **cuándo** empieza la escritura y `typingIntervalSeconds`
para controlar **con qué frecuencia** se actualiza.

## Valores predeterminados

Cuando `agents.defaults.typingMode` **no está definido**, OpenClaw conserva el comportamiento heredado:

- **Chats directos**: la escritura empieza inmediatamente cuando comienza el bucle del modelo.
- **Chats grupales con una mención**: la escritura empieza inmediatamente.
- **Chats grupales sin una mención**: la escritura empieza cuando la ejecución admitida tiene
  actividad visible para el usuario, como actividad de ejecución del arnés o texto de mensaje.
- **Ejecuciones de Heartbeat**: la escritura empieza cuando comienza la ejecución de Heartbeat si el
  destino de Heartbeat resuelto es un chat compatible con escritura y la escritura no está deshabilitada.

## Modos

Establece `agents.defaults.typingMode` en uno de estos valores:

- `never` - ningún indicador de escritura, nunca.
- `instant` - empieza a escribir **tan pronto como comienza el bucle del modelo**, incluso si la ejecución
  después devuelve solo el token de respuesta silenciosa.
- `thinking` - empieza a escribir con el **primer delta de razonamiento** o con ejecución activa
  del arnés después de aceptar el turno.
- `message` - empieza a escribir con la **primera actividad de respuesta visible para el usuario**, como
  ejecución activa del arnés o un delta de texto no silencioso. Los tokens de respuesta silenciosa como
  `NO_REPLY` no cuentan como actividad de texto.

Orden de "qué tan pronto se activa":
`never` → `message`/`thinking` → `instant`

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

- El modo `message` no se inicia a partir de tokens de respuesta silenciosa, pero la ejecución activa
  aún puede mostrar escritura antes de que haya texto del asistente disponible.
- `thinking` sigue reaccionando al razonamiento transmitido (`reasoningLevel: "stream"`),
  y también puede comenzar a partir de ejecución activa antes de que lleguen los deltas de razonamiento.
- La escritura de Heartbeat es una señal de actividad para el destino de entrega resuelto. Se
  inicia al comienzo de la ejecución de Heartbeat en lugar de seguir la temporización del flujo de `message` o `thinking`.
  Establece `typingMode: "never"` para deshabilitarla.
- Los Heartbeats no muestran escritura cuando `target: "none"`, cuando el destino no puede
  resolverse, cuando la entrega por chat está deshabilitada para el Heartbeat o cuando el
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
