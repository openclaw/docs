---
read_when:
    - Depuración de la pestaña Instancias
    - Investigación de filas de instancia duplicadas u obsoletas
    - Cambiar la conexión WS del Gateway o las balizas system-event
summary: Cómo se producen, combinan y muestran las entradas de presencia de OpenClaw
title: Presencia
x-i18n:
    generated_at: "2026-05-06T05:31:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw "presencia" es una vista ligera y de mejor esfuerzo de:

- el propio **Gateway**, y
- **clientes conectados al Gateway** (aplicación para Mac, WebChat, CLI, etc.)

La presencia se usa principalmente para representar la pestaña **Instancias** de la aplicación de macOS y para
proporcionar visibilidad rápida al operador.

## Campos de presencia (lo que aparece)

Las entradas de presencia son objetos estructurados con campos como:

- `instanceId` (opcional, pero muy recomendado): identidad estable del cliente (normalmente `connect.client.instanceId`)
- `host`: nombre de host legible para humanos
- `ip`: dirección IP de mejor esfuerzo
- `version`: cadena de versión del cliente
- `deviceFamily` / `modelIdentifier`: indicios de hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "segundos desde la última entrada del usuario" (si se conoce)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: marca de tiempo de la última actualización (ms desde la época)

## Productores (de dónde viene la presencia)

Las entradas de presencia son producidas por varias fuentes y se **fusionan**.

### 1) Entrada propia del Gateway

El Gateway siempre inicializa una entrada "self" al arrancar para que las IU muestren el host del Gateway
incluso antes de que se conecten clientes.

### 2) Conexión WebSocket

Cada cliente WS comienza con una solicitud `connect`. Tras un protocolo de enlace correcto, el
Gateway inserta o actualiza una entrada de presencia para esa conexión.

#### Por qué los comandos puntuales de CLI no aparecen

La CLI a menudo se conecta para comandos breves y puntuales. Para evitar llenar de ruido la
lista de Instancias, `client.mode === "cli"` **no** se convierte en una entrada de presencia.

### 3) Balizas `system-event`

Los clientes pueden enviar balizas periódicas más completas mediante el método `system-event`. La aplicación para Mac
usa esto para informar el nombre de host, la IP y `lastInputSeconds`.

### 4) Conexiones de Node (role: node)

Cuando un Node se conecta a través del WebSocket del Gateway con `role: node`, el Gateway
inserta o actualiza una entrada de presencia para ese Node (el mismo flujo que otros clientes WS).

## Reglas de fusión y deduplicación (por qué `instanceId` importa)

Las entradas de presencia se almacenan en un único mapa en memoria:

- Las entradas se indexan por una **clave de presencia**.
- La mejor clave es un `instanceId` estable (de `connect.client.instanceId`) que sobrevive a los reinicios.
- Las claves no distinguen entre mayúsculas y minúsculas.

Si un cliente se reconecta sin un `instanceId` estable, puede aparecer como una fila
**duplicada**.

## TTL y tamaño limitado

La presencia es intencionalmente efímera:

- **TTL:** se eliminan las entradas con más de 5 minutos de antigüedad
- **Entradas máximas:** 200 (las más antiguas se descartan primero)

Esto mantiene la lista actualizada y evita el crecimiento ilimitado de la memoria.

## Advertencia sobre remoto/túnel (IP de loopback)

Cuando un cliente se conecta mediante un túnel SSH / reenvío de puerto local, el Gateway puede
ver la dirección remota como `127.0.0.1`. Para evitar sobrescribir una buena IP informada por el cliente,
se ignoran las direcciones remotas de loopback.

## Consumidores

### Pestaña Instancias de macOS

La aplicación de macOS representa la salida de `system-presence` y aplica un pequeño indicador de estado
(Activo/Inactivo/Obsoleto) según la antigüedad de la última actualización.

## Consejos de depuración

- Para ver la lista sin procesar, llama a `system-presence` contra el Gateway.
- Si ves duplicados:
  - confirma que los clientes envíen un `client.instanceId` estable en el protocolo de enlace
  - confirma que las balizas periódicas usen el mismo `instanceId`
  - comprueba si a la entrada derivada de la conexión le falta `instanceId` (se esperan duplicados)

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
