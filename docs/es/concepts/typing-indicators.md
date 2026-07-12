---
read_when:
    - Cambiar el comportamiento o los valores predeterminados del indicador de escritura
summary: Cuándo muestra OpenClaw los indicadores de escritura y cómo ajustarlos
title: Indicadores de escritura
x-i18n:
    generated_at: "2026-07-12T14:30:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Los indicadores de escritura se envían al canal de chat mientras una ejecución está activa. Use `agents.defaults.typingMode` para controlar **cuándo** comienza la escritura y `typingIntervalSeconds` para controlar **con qué frecuencia** se actualiza (cadencia de mantenimiento, 6 segundos de forma predeterminada).

## Valores predeterminados

Cuando `agents.defaults.typingMode` **no está definido**:

- **Chats directos**: la escritura comienza inmediatamente cuando se inicia el bucle del modelo.
- **Chats grupales con una mención**: la escritura comienza inmediatamente.
- **Chats grupales sin una mención**: la escritura comienza cuando la ejecución admitida presenta actividad visible para el usuario, como actividad de ejecución del sistema o texto de mensaje.
- **Ejecuciones de Heartbeat**: la escritura comienza cuando se inicia la ejecución de Heartbeat, si el destino de Heartbeat resuelto es un chat compatible con indicadores de escritura y estos no están deshabilitados.

## Modos

Establezca `agents.defaults.typingMode` en uno de los siguientes valores:

- `never` - nunca se muestra un indicador de escritura.
- `instant` - comienza a escribir **en cuanto se inicia el bucle del modelo**, aunque posteriormente la ejecución solo devuelva el token de respuesta silenciosa.
- `thinking` - comienza a escribir con el **primer incremento de razonamiento** o durante la ejecución activa del sistema después de que se acepte el turno.
- `message` - comienza a escribir con la **primera actividad de respuesta visible para el usuario**, como la ejecución activa del sistema o un incremento de texto no silencioso. Los tokens de respuesta silenciosa como `NO_REPLY` no cuentan como actividad de texto.

Orden según «qué tan pronto se activa»: `never` -> `message`/`thinking` -> `instant`.

## Configuración

Establezca el valor predeterminado a nivel del agente:

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

Sobrescriba el modo o la cadencia por sesión:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notas

- El modo `message` no se inicia a partir de tokens de respuesta silenciosa, pero la ejecución activa puede mostrar el indicador de escritura antes de que haya texto del asistente disponible.
- `thinking` sigue reaccionando al razonamiento transmitido (`reasoningLevel: "stream"`) y también puede iniciarse a partir de la ejecución activa antes de que lleguen incrementos de razonamiento.
- El indicador de escritura de Heartbeat es una señal de actividad para el destino de entrega resuelto. Comienza al iniciarse la ejecución de Heartbeat en lugar de seguir la temporización de transmisión de `message` o `thinking`. Establezca `typingMode: "never"` para deshabilitarlo.
- Los Heartbeats no muestran el indicador de escritura cuando el destino de Heartbeat es `"none"`, cuando el destino no puede resolverse, cuando la entrega por chat está deshabilitada para el Heartbeat o cuando el canal no admite indicadores de escritura.
- `typingIntervalSeconds` controla la **cadencia de actualización**, no la hora de inicio. Valor predeterminado: 6 segundos.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Presencia" href="/es/concepts/presence" icon="signal">
    Cómo realiza el Gateway el seguimiento de los clientes conectados para la página Dispositivos de la interfaz de control y la pestaña Instancias de macOS.
  </Card>
  <Card title="Transmisión y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Comportamiento de la transmisión saliente, límites de los fragmentos y entrega específica de cada canal.
  </Card>
</CardGroup>
