---
read_when:
    - Cambiar el comportamiento o los valores predeterminados del indicador de escritura
summary: Cuándo muestra OpenClaw los indicadores de escritura y cómo ajustarlos
title: Indicadores de escritura
x-i18n:
    generated_at: "2026-07-20T00:48:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cdaad6345ebf20ff3142020e584985c2dcc04e25f2ae4f11585e30903c9e4729
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Los indicadores de escritura se envían al canal de chat mientras una ejecución está activa. Use `agents.defaults.typingMode` para controlar **cuándo** comienza la escritura y `typingIntervalSeconds` para controlar **con qué frecuencia** se actualiza (cadencia de mantenimiento de actividad, 6 segundos de forma predeterminada).

## Valores predeterminados

Cuando `agents.defaults.typingMode` **no está establecido**:

- **Chats directos**: la escritura comienza inmediatamente cuando se inicia el bucle del modelo.
- **Chats grupales con una mención**: la escritura comienza inmediatamente.
- **Chats grupales sin una mención**: la escritura comienza cuando la ejecución admitida presenta actividad visible para el usuario, como actividad de ejecución del arnés o texto de mensaje.
- **Ejecuciones de Heartbeat**: la escritura comienza cuando se inicia la ejecución de Heartbeat, si el destino de Heartbeat resuelto es un chat compatible con la escritura y esta no está deshabilitada.

## Modos

Establezca `agents.defaults.typingMode` en uno de los siguientes valores:

- `never` - nunca se muestra el indicador de escritura.
- `instant` - comienza a mostrar que se está escribiendo **en cuanto se inicia el bucle del modelo**, incluso si posteriormente la ejecución solo devuelve el token de respuesta silenciosa.
- `thinking` - comienza a mostrar que se está escribiendo con el **primer delta de razonamiento** o durante la ejecución activa del arnés después de aceptar el turno.
- `message` - comienza a mostrar que se está escribiendo con la **primera actividad de respuesta visible para el usuario**, como la ejecución activa del arnés o un delta de texto no silencioso. Los tokens de respuesta silenciosa como `NO_REPLY` no cuentan como actividad de texto.

Orden de «cuán pronto se activa»: `never` -> `message`/`thinking` -> `instant`.

## Configuración

Establezca el valor predeterminado en el nivel del agente:

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

Sobrescriba el modo para cada sesión:

```json5
{
  session: {
    typingMode: "message",
  },
}
```

## Notas

- El modo `message` no se inicia a partir de tokens de respuesta silenciosa, pero la ejecución activa puede seguir mostrando que se está escribiendo antes de que haya texto del asistente disponible.
- `thinking` sigue reaccionando al razonamiento transmitido (`reasoningLevel: "stream"`) y también puede iniciarse a partir de la ejecución activa antes de que lleguen los deltas de razonamiento.
- La escritura de Heartbeat es una señal de actividad para el destino de entrega resuelto. Comienza al iniciarse la ejecución de Heartbeat, en lugar de seguir los tiempos del flujo de `message` o `thinking`. Establezca `typingMode: "never"` para deshabilitarla.
- Los Heartbeats no muestran que se está escribiendo cuando el destino de Heartbeat es `"none"`, cuando no se puede resolver el destino, cuando la entrega por chat está deshabilitada para el Heartbeat o cuando el canal no admite indicadores de escritura.
- `agents.defaults.typingIntervalSeconds` controla la **cadencia de actualización**, no la hora de inicio. Valor predeterminado: 6 segundos.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Presencia" href="/es/concepts/presence" icon="signal">
    Cómo realiza el Gateway el seguimiento de los clientes conectados para la página Dispositivos de la interfaz de control y la pestaña Instancias de macOS.
  </Card>
  <Card title="Transmisión y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Comportamiento de la transmisión saliente, límites de los fragmentos y entrega específica de cada canal.
  </Card>
</CardGroup>
