---
read_when:
    - Depuración del estado en tiempo real en la página Dispositivos de la interfaz de control
    - Investigación de filas de instancias duplicadas u obsoletas
    - Cambiar la conexión WS del Gateway o las señales de eventos del sistema
summary: Cómo se generan, combinan y muestran las entradas de presencia de OpenClaw
title: Presencia
x-i18n:
    generated_at: "2026-07-14T13:38:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

La «presencia» de OpenClaw es una vista ligera y de disponibilidad razonable de:

- el propio **Gateway**, y
- los **clientes visibles para el usuario conectados al Gateway** (aplicación para Mac, WebChat, nodos, etc.)

La presencia muestra metadatos de conexión en tiempo real en la página **Dispositivos** de la interfaz de control
(en **Configuración → Dispositivos**) y en la pestaña **Instancias** de la aplicación para macOS.

Esta página trata sobre la lista de clientes del Gateway. Para detectar el Mac utilizado más recientemente
y dirigir allí las alertas de los nodos, consulte
[Presencia del equipo activo](/es/nodes/presence).

## Campos de presencia (qué se muestra)

Las entradas de presencia son objetos estructurados con campos como:

- `instanceId` (opcional, pero muy recomendable): identidad estable del cliente (normalmente `connect.client.instanceId`)
- `host`: nombre de host fácil de reconocer
- `ip`: dirección IP determinada con disponibilidad razonable
- `version`: cadena de versión del cliente
- `deviceFamily` / `modelIdentifier`: indicaciones sobre el hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: segundos transcurridos desde la última entrada del usuario, si se conoce
- `reason`: cadena de formato libre proporcionada por el cliente; el propio Gateway solo emite `self`, `connect` y `disconnect`
- `deviceId`, `roles`, `scopes`: identidad del dispositivo e indicaciones de rol y ámbito procedentes del protocolo de enlace de conexión
- `ts`: marca de tiempo de la última actualización (ms desde la época)

## Productores (de dónde procede la presencia)

Las entradas de presencia se generan a partir de varias fuentes y se **combinan**.

### 1) Entrada del propio Gateway

El Gateway siempre crea una entrada «propia» al iniciarse para que las interfaces de usuario muestren el host del Gateway
incluso antes de que se conecte ningún cliente.

### 2) Conexión WebSocket

Cada cliente WS comienza con una solicitud `connect`. Tras completarse correctamente el protocolo de enlace, el
Gateway inserta o actualiza una entrada de presencia para esa conexión.

#### Por qué no aparecen las conexiones efímeras del plano de control

Los comandos de la CLI, los clientes RPC de backend y las sondas suelen conectarse brevemente. Para evitar
conservar esa rotación durante todo el TTL de presencia, los clientes en modo `cli`, `backend`
o `probe` **no** se convierten en entradas de presencia. Los clientes en modo de prueba
se siguen registrando porque los conjuntos de pruebas los utilizan como sustitutos de clientes reales.

### 3) Señales `system-event`

Los clientes pueden enviar señales periódicas más detalladas mediante el método `system-event`. La aplicación para Mac
lo utiliza para informar del nombre de host, la IP y `lastInputSeconds`.

### 4) Conexiones de nodos (rol: nodo)

Cuando un nodo se conecta mediante el WebSocket del Gateway con `role: node`, el Gateway
inserta o actualiza una entrada de presencia para ese nodo (el mismo flujo que para los demás clientes WS).

## Reglas de combinación y desduplicación (por qué importa `instanceId`)

Las entradas de presencia se almacenan en un único mapa en memoria, con claves que no distinguen entre mayúsculas y minúsculas
y que se obtienen del primer valor disponible, en este orden: un id de dispositivo emparejado, `connect.client.instanceId`
o, como último recurso, el id de cada conexión.

Los clientes efímeros del plano de control se excluyen por completo del seguimiento (véase
la sección anterior), por lo que sus identificadores de conexión nunca se convierten en claves. Para todos los demás clientes, el uso
del identificador de conexión como alternativa implica que un cliente que se vuelve a conectar sin un
`instanceId` estable aparece como una fila **duplicada**.

## TTL y tamaño limitado

La presencia es efímera de forma intencionada:

- **TTL:** se eliminan las entradas con más de 5 minutos
- **Número máximo de entradas:** 200 (las más antiguas se eliminan primero)

Esto mantiene la lista actualizada y evita un crecimiento ilimitado de la memoria.

## Consideración sobre conexiones remotas y túneles (direcciones IP de bucle invertido)

Cuando un cliente se conecta mediante un túnel SSH o un reenvío de puerto local, el Gateway
puede ver la dirección remota como `127.0.0.1`. Para evitar registrar la dirección del túnel
como la IP del cliente, el procesamiento de la conexión omite por completo `ip` para
los clientes detectados como locales (bucle invertido), en lugar de escribir la dirección de bucle invertido
en la entrada.

## Consumidores

### Página Dispositivos de la interfaz de control

La página **Dispositivos** combina `system-presence` con los registros persistentes
de emparejamiento y nodos. Fija primero la señal propia del Gateway y utiliza identificadores de dispositivo
o instancia coincidentes para obtener metadatos en tiempo real sobre la plataforma, la versión, el modelo y el tiempo desde la última entrada.

### Pestaña Instancias de macOS

La aplicación para macOS muestra la salida de `system-presence` y aplica un pequeño indicador
de estado (Activo/Inactivo/Obsoleto) según el tiempo transcurrido desde la última actualización.

## Consejos de depuración

- Para ver la lista sin procesar, llame a `system-presence` en el Gateway.
- Si aparecen duplicados:
  - confirme que los clientes envían un `client.instanceId` estable durante el protocolo de enlace
  - confirme que las señales periódicas utilizan el mismo `instanceId`
  - compruebe si falta `instanceId` en la entrada derivada de la conexión (en ese caso, los duplicados son normales)

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Presencia del equipo activo" href="/es/nodes/presence" icon="computer-mouse">
    Cómo la entrada física en el Mac selecciona un nodo activo y dirige las alertas de conexión.
  </Card>
  <Card title="Indicadores de escritura" href="/es/concepts/typing-indicators" icon="ellipsis">
    Cuándo se envían los indicadores de escritura y cómo ajustarlos.
  </Card>
  <Card title="Transmisión y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Transmisión saliente, fragmentación y formato por canal.
  </Card>
  <Card title="Arquitectura del Gateway" href="/es/concepts/architecture" icon="diagram-project">
    Componentes del Gateway y protocolo WebSocket que controla las actualizaciones de presencia.
  </Card>
  <Card title="Protocolo del Gateway" href="/es/gateway/protocol" icon="plug">
    El protocolo de comunicación para `connect`, `system-event` y `system-presence`.
  </Card>
</CardGroup>
