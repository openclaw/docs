---
read_when:
    - Depuración de la pestaña Instancias
    - Investigación de filas de instancia duplicadas u obsoletas
    - Cambiar la conexión WS del gateway o las señales de eventos del sistema
summary: Cómo se producen, combinan y muestran las entradas de presencia de OpenClaw
title: Presencia
x-i18n:
    generated_at: "2026-07-05T11:15:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b8a2bf688fd94bd7145ca511fec259b9c868ea9bcbe75b12587f747dfaadf4d
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw "presencia" es una vista ligera y de mejor esfuerzo de:

- el **Gateway** en sí, y
- **clientes conectados al Gateway** (app para Mac, WebChat, CLI, etc.)

La presencia se usa principalmente para renderizar la pestaña **Instancias** de la app de macOS y para
proporcionar visibilidad rápida al operador.

## Campos de presencia (lo que aparece)

Las entradas de presencia son objetos estructurados con campos como:

- `instanceId` (opcional, pero muy recomendado): identidad estable del cliente (normalmente `connect.client.instanceId`)
- `host`: nombre de host legible para humanos
- `ip`: dirección IP de mejor esfuerzo
- `version`: cadena de versión del cliente
- `deviceFamily` / `modelIdentifier`: pistas de hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: segundos desde la última entrada del usuario, si se conoce
- `reason`: cadena de formato libre proporcionada por el cliente; el Gateway en sí solo emite `self`, `connect` y `disconnect`
- `deviceId`, `roles`, `scopes`: identidad del dispositivo y pistas de rol/alcance del handshake de conexión
- `ts`: marca de tiempo de la última actualización (ms desde epoch)

## Productores (de dónde viene la presencia)

Las entradas de presencia se producen desde varias fuentes y se **fusionan**.

### 1) Entrada propia del Gateway

El Gateway siempre inicializa una entrada "propia" al arrancar para que las interfaces muestren el host del gateway
incluso antes de que se conecten clientes.

### 2) Conexión WebSocket

Cada cliente WS comienza con una solicitud `connect`. Tras un handshake correcto, el
Gateway inserta o actualiza una entrada de presencia para esa conexión.

#### Por qué los comandos puntuales de la CLI no aparecen

La CLI suele conectarse para comandos breves y puntuales. Para evitar llenar de ruido la
lista Instancias, `client.mode === "cli"` **no** se convierte en una entrada de presencia.

### 3) Señales `system-event`

Los clientes pueden enviar señales periódicas más completas mediante el método `system-event`. La app para Mac
usa esto para informar el nombre de host, la IP y `lastInputSeconds`.

### 4) Conexiones de Node (rol: node)

Cuando un nodo se conecta mediante el WebSocket del Gateway con `role: node`, el Gateway
inserta o actualiza una entrada de presencia para ese nodo (el mismo flujo que otros clientes WS).

## Reglas de fusión y deduplicación (por qué importa `instanceId`)

Las entradas de presencia se almacenan en un único mapa en memoria, con claves sin distinguir
mayúsculas/minúsculas según el primer valor disponible de, en orden: un id de dispositivo emparejado, `connect.client.instanceId`,
o el id por conexión como último recurso.

Los clientes CLI se excluyen por completo del seguimiento (ver arriba), por lo que su
id de conexión nunca se convierte en una clave. Para cualquier otro cliente, el fallback del id de conexión
significa que un cliente que se reconecta sin un `instanceId` estable aparece
como una fila **duplicada**.

## TTL y tamaño acotado

La presencia es intencionalmente efímera:

- **TTL:** las entradas de más de 5 minutos se purgan
- **Entradas máximas:** 200 (las más antiguas se descartan primero)

Esto mantiene la lista actualizada y evita el crecimiento ilimitado de memoria.

## Advertencia de remoto/túnel (IP de loopback)

Cuando un cliente se conecta mediante un túnel SSH / reenvío de puerto local, el Gateway
puede ver la dirección remota como `127.0.0.1`. Para evitar registrar esa dirección de túnel
como la IP del cliente, el manejo de conexión omite `ip` por completo para los clientes
locales detectados (loopback) en lugar de escribir la dirección de loopback
en la entrada.

## Consumidores

### Pestaña Instancias de macOS

La app de macOS renderiza la salida de `system-presence` y aplica un pequeño indicador
de estado (Activo/Inactivo/Desactualizado) según la antigüedad de la última actualización.

## Consejos de depuración

- Para ver la lista sin procesar, llama a `system-presence` contra el Gateway.
- Si ves duplicados:
  - confirma que los clientes envían un `client.instanceId` estable en el handshake
  - confirma que las señales periódicas usan el mismo `instanceId`
  - comprueba si a la entrada derivada de la conexión le falta `instanceId` (los duplicados son esperados)

## Relacionado

<CardGroup cols={2}>
  <Card title="Indicadores de escritura" href="/es/concepts/typing-indicators" icon="ellipsis">
    Cuándo se envían los indicadores de escritura y cómo ajustarlos.
  </Card>
  <Card title="Streaming y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Streaming saliente, fragmentación y formato por canal.
  </Card>
  <Card title="Arquitectura del Gateway" href="/es/concepts/architecture" icon="diagram-project">
    Componentes del Gateway y el protocolo WebSocket que impulsa las actualizaciones de presencia.
  </Card>
  <Card title="Protocolo del Gateway" href="/es/gateway/protocol" icon="plug">
    El protocolo de cable para `connect`, `system-event` y `system-presence`.
  </Card>
</CardGroup>
