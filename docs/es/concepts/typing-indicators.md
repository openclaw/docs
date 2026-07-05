---
read_when:
    - Cambiar el comportamiento o los valores predeterminados del indicador de escritura
summary: Cuándo OpenClaw muestra indicadores de escritura y cómo ajustarlos
title: Indicadores de escritura
x-i18n:
    generated_at: "2026-07-05T11:16:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1be9429a6a5be0dd754e6a088f3afe3681def05be68db3e62c3a2a3ac4b4463
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Los indicadores de escritura se envían al canal de chat mientras una ejecución está activa. Usa `agents.defaults.typingMode` para controlar **cuándo** comienza la escritura y `typingIntervalSeconds` para controlar **con qué frecuencia** se actualiza (cadencia de keepalive, valor predeterminado de 6 segundos).

## Valores predeterminados

Cuando `agents.defaults.typingMode` está **sin definir**:

- **Chats directos**: la escritura comienza inmediatamente una vez que empieza el bucle del modelo.
- **Chats grupales con una mención**: la escritura comienza inmediatamente.
- **Chats grupales sin una mención**: la escritura comienza cuando la ejecución admitida tiene actividad visible para el usuario, como actividad de ejecución de harness o texto de mensaje.
- **Ejecuciones de Heartbeat**: la escritura comienza cuando empieza la ejecución de heartbeat, si el destino de heartbeat resuelto es un chat compatible con escritura y la escritura no está deshabilitada.

## Modos

Configura `agents.defaults.typingMode` con uno de estos valores:

- `never` - sin indicador de escritura, nunca.
- `instant` - empieza a escribir **tan pronto como comienza el bucle del modelo**, incluso si la ejecución luego devuelve solo el token de respuesta silenciosa.
- `thinking` - empieza a escribir en el **primer delta de razonamiento**, o con la ejecución activa de harness después de que se acepta el turno.
- `message` - empieza a escribir en la **primera actividad de respuesta visible para el usuario**, como ejecución activa de harness o un delta de texto no silencioso. Los tokens de respuesta silenciosa como `NO_REPLY` no cuentan como actividad de texto.

Orden de "qué tan pronto se activa": `never` -> `message`/`thinking` -> `instant`.

## Configuración

Configura el valor predeterminado a nivel de agente:

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

- El modo `message` no comienza a partir de tokens de respuesta silenciosa, pero la ejecución activa aún puede mostrar escritura antes de que haya texto del asistente disponible.
- `thinking` aún reacciona al razonamiento transmitido (`reasoningLevel: "stream"`), y también puede comenzar a partir de ejecución activa antes de que lleguen los deltas de razonamiento.
- La escritura de Heartbeat es una señal de actividad para el destino de entrega resuelto. Comienza al inicio de la ejecución de heartbeat en lugar de seguir la temporización del flujo de `message` o `thinking`. Configura `typingMode: "never"` para deshabilitarla.
- Los heartbeats no muestran escritura cuando el destino de heartbeat es `"none"`, cuando el destino no se puede resolver, cuando la entrega por chat está deshabilitada para el heartbeat o cuando el canal no admite escritura.
- `typingIntervalSeconds` controla la **cadencia de actualización**, no la hora de inicio. Valor predeterminado: 6 segundos.

## Relacionado

<CardGroup cols={2}>
  <Card title="Presencia" href="/es/concepts/presence" icon="signal">
    Cómo el Gateway rastrea los clientes conectados y los muestra en la pestaña Instancias de macOS.
  </Card>
  <Card title="Streaming y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Comportamiento de streaming saliente, límites de fragmentos y entrega específica del canal.
  </Card>
</CardGroup>
