---
read_when:
    - Depurar la pestaña Instances
    - Investigar filas de instancias duplicadas o obsoletas
    - Cambiar las balizas de conexión WS del Gateway o de eventos del sistema
summary: Cómo se producen, fusionan y muestran las entradas de presencia de OpenClaw
title: Presencia
x-i18n:
    generated_at: "2026-04-24T05:26:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

La “presencia” de OpenClaw es una vista ligera y best-effort de:

- el propio **Gateway**, y
- los **clientes conectados al Gateway** (app de macOS, WebChat, CLI, etc.)

La presencia se usa principalmente para renderizar la pestaña **Instances** de la app de macOS y para
proporcionar visibilidad rápida al operador.

## Campos de presencia (qué aparece)

Las entradas de presencia son objetos estructurados con campos como:

- `instanceId` (opcional, pero muy recomendable): identidad estable del cliente (normalmente `connect.client.instanceId`)
- `host`: nombre de host legible para humanos
- `ip`: dirección IP en modo best-effort
- `version`: cadena de versión del cliente
- `deviceFamily` / `modelIdentifier`: pistas de hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “segundos desde la última entrada del usuario” (si se conoce)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: marca de tiempo de la última actualización (ms desde época Unix)

## Productores (de dónde viene la presencia)

Las entradas de presencia se producen desde múltiples fuentes y se **fusionan**.

### 1) Entrada propia del Gateway

El Gateway siempre inicializa una entrada “self” al arrancar para que las interfaces muestren el host del gateway
incluso antes de que se conecte cualquier cliente.

### 2) Conexión WebSocket

Cada cliente WS comienza con una solicitud `connect`. Tras un handshake correcto, el
Gateway realiza un upsert de una entrada de presencia para esa conexión.

#### Por qué los comandos CLI puntuales no aparecen

La CLI a menudo se conecta para comandos breves y puntuales. Para evitar saturar la
lista de Instances, `client.mode === "cli"` **no** se convierte en una entrada de presencia.

### 3) Balizas `system-event`

Los clientes pueden enviar balizas periódicas más ricas mediante el método `system-event`. La app de macOS
usa esto para informar del nombre del host, la IP y `lastInputSeconds`.

### 4) Conexiones de Node (`role: node`)

Cuando un Node se conecta por el WebSocket del Gateway con `role: node`, el Gateway
realiza un upsert de una entrada de presencia para ese Node (el mismo flujo que para otros clientes WS).

## Reglas de fusión + desduplicación (por qué importa `instanceId`)

Las entradas de presencia se almacenan en un único mapa en memoria:

- Las entradas se indexan por una **clave de presencia**.
- La mejor clave es un `instanceId` estable (de `connect.client.instanceId`) que sobreviva a reinicios.
- Las claves no distinguen entre mayúsculas y minúsculas.

Si un cliente se reconecta sin un `instanceId` estable, puede aparecer como una
fila **duplicada**.

## TTL y tamaño limitado

La presencia es intencionadamente efímera:

- **TTL:** las entradas de más de 5 minutos se eliminan
- **Máximo de entradas:** 200 (se eliminan primero las más antiguas)

Esto mantiene la lista fresca y evita el crecimiento descontrolado de memoria.

## Consideración para remoto/túnel (IPs de loopback)

Cuando un cliente se conecta mediante un túnel SSH / redirección local de puertos, el Gateway puede
ver la dirección remota como `127.0.0.1`. Para evitar sobrescribir una buena IP informada por el cliente,
las direcciones remotas de loopback se ignoran.

## Consumidores

### Pestaña Instances de macOS

La app de macOS renderiza la salida de `system-presence` y aplica un pequeño indicador de estado
(Active/Idle/Stale) según la antigüedad de la última actualización.

## Consejos de depuración

- Para ver la lista sin procesar, llama a `system-presence` contra el Gateway.
- Si ves duplicados:
  - confirma que los clientes envían un `client.instanceId` estable en el handshake
  - confirma que las balizas periódicas usan el mismo `instanceId`
  - comprueba si a la entrada derivada de la conexión le falta `instanceId` (en ese caso, los duplicados son esperables)

## Relacionado

- [Indicadores de escritura](/es/concepts/typing-indicators)
- [Streaming y fragmentación](/es/concepts/streaming)
