---
read_when:
    - Depuración del estado en tiempo real en la página Dispositivos de la interfaz de control
    - Investigación de filas de instancias duplicadas u obsoletas
    - Cambio de la conexión WS del Gateway o de las balizas de eventos del sistema
summary: Cómo se generan, combinan y muestran las entradas de presencia de OpenClaw
title: Presencia
x-i18n:
    generated_at: "2026-07-21T22:38:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ac5800eebddb82e69a7d0c06733e6a19addbc57be7776e7361411866af0c60f5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw "presence" es una vista ligera y de mejor esfuerzo de:

- el propio **Gateway**, y
- los **clientes visibles para el usuario conectados al Gateway** (aplicación para Mac, WebChat, nodos, etc.)

La presencia muestra metadatos de conexión en tiempo real en la página **Dispositivos** de la interfaz de control
(en **Configuración → Dispositivos**) y en la pestaña **Instancias** de la aplicación para macOS.

Esta página trata sobre la lista de clientes del Gateway. Para detectar el Mac utilizado más recientemente
y dirigir allí las alertas de nodos, consulte
[Presencia del ordenador activo](/es/nodes/presence).

## Campos de presencia (qué se muestra)

Las entradas de presencia son objetos estructurados con campos como:

- `instanceId` (opcional, pero muy recomendado): identidad estable del cliente (normalmente `connect.client.instanceId`)
- `host`: nombre de host fácil de reconocer
- `ip`: dirección IP de mejor esfuerzo
- `version`: cadena de versión del cliente
- `deviceFamily` / `modelIdentifier`: indicaciones sobre el hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: segundos desde la última entrada del usuario, si se conoce
- `reason`: cadena de formato libre proporcionada por el cliente; el propio Gateway solo emite `self`, `connect` y `disconnect`
- `deviceId`, `roles`, `scopes`: identidad del dispositivo e indicaciones de rol/ámbito del protocolo de enlace de conexión
- `ts`: marca de tiempo de la última actualización (ms desde la época)

## Productores (de dónde procede la presencia)

Las entradas de presencia son producidas por varias fuentes y se **combinan**.

### 1) Entrada del propio Gateway

El Gateway siempre crea una entrada "propia" al iniciarse para que las interfaces muestren el host del Gateway
incluso antes de que se conecte algún cliente.

### 2) Conexión WebSocket

Cada cliente WS comienza con una solicitud `connect`. Tras completar correctamente el protocolo de enlace, el
Gateway inserta o actualiza una entrada de presencia para esa conexión.

#### Por qué no se muestran las conexiones efímeras del plano de control

Los comandos de la CLI, los clientes RPC de backend y las sondas suelen conectarse brevemente. Para evitar
conservar esa rotación durante todo el TTL de presencia, los clientes en modo `cli`, `backend`
o `probe` **no** se convierten en entradas de presencia. Los clientes en modo de prueba
se siguen registrando porque los conjuntos de pruebas los utilizan como sustitutos de clientes reales.

### 3) Balizas `system-event`

Los clientes pueden enviar balizas periódicas más completas mediante el método `system-event`. La aplicación para Mac
lo utiliza para informar del nombre de host, la IP, la versión y los metadatos de actividad. La actividad
de entrada física no forma parte de esta baliza genérica; es responsabilidad del evento nativo
específico del nodo descrito en [Presencia del ordenador activo](/es/nodes/presence). El
Mac etiqueta estas balizas con `system-presence-clear-last-input`; los Gateways actuales
utilizan ese marcador retrocompatible para eliminar cualquier dato de actividad de entrada reciente conservado de una
aplicación anterior. La baliza también contiene un valor fijo de 30 días para que los Gateways anteriores que
ignoren la etiqueta sobrescriban la actividad reciente exacta en lugar de conservarla. No se muestrea ninguna actividad nueva
para este valor de compatibilidad.

### 4) Conexiones de nodos (rol: nodo)

Cuando un nodo se conecta mediante el WebSocket del Gateway con `role: node`, el Gateway
inserta o actualiza una entrada de presencia para ese nodo (el mismo flujo que para otros clientes WS).

## Reglas de combinación y desduplicación (por qué importa `instanceId`)

Las entradas de presencia se almacenan en un único mapa en memoria, con claves que no distinguen mayúsculas de minúsculas
y que se obtienen, por orden, del primer valor disponible entre: un id de dispositivo emparejado, `connect.client.instanceId`
o, como último recurso, el id de cada conexión.

Los clientes efímeros del plano de control se excluyen por completo del seguimiento (véase
lo anterior), por lo que sus ids de conexión nunca se convierten en claves. Para los demás clientes, el uso del
id de conexión como alternativa implica que un cliente que se vuelve a conectar sin un
`instanceId` estable aparece como una fila **duplicada**.

## TTL y tamaño limitado

La presencia es efímera de forma intencionada:

- **TTL:** se eliminan las entradas con más de 5 minutos
- **Máximo de entradas:** 200 (se eliminan primero las más antiguas)

Esto mantiene la lista actualizada y evita un crecimiento ilimitado de la memoria.

## Consideración sobre conexiones remotas/túneles (IP de bucle invertido)

Cuando un cliente se conecta mediante un túnel SSH o un reenvío de puertos local, el Gateway
puede detectar la dirección remota como `127.0.0.1`. Para evitar registrar esa dirección del túnel
como IP del cliente, el procesamiento de la conexión omite por completo `ip` para los
clientes detectados como locales (bucle invertido), en lugar de escribir la dirección de bucle invertido
en la entrada.

## Consumidores

### Página Dispositivos de la interfaz de control

La página **Dispositivos** combina `system-presence` con registros duraderos de emparejamiento y
nodos. Fija primero la baliza propia del Gateway y utiliza los ids coincidentes del dispositivo o
de la instancia para los metadatos en tiempo real de plataforma, versión, modelo y actividad de entrada reciente.

### Pestaña Instancias de macOS

La aplicación para macOS representa la salida de `system-presence` y aplica un pequeño indicador
de estado (Activo/Inactivo/Obsoleto) en función de la antigüedad de la última actualización.

## Consejos de depuración

- Para ver la lista sin procesar, llame a `system-presence` en el Gateway.
- Si aparecen duplicados:
  - confirme que los clientes envían un `client.instanceId` estable en el protocolo de enlace
  - confirme que las balizas periódicas utilizan el mismo `instanceId`
  - compruebe si falta `instanceId` en la entrada derivada de la conexión (los duplicados son esperables)

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Presencia del ordenador activo" href="/es/nodes/presence" icon="computer-mouse">
    Cómo la entrada física del Mac selecciona un nodo activo y dirige las alertas de conexión.
  </Card>
  <Card title="Indicadores de escritura" href="/es/concepts/typing-indicators" icon="ellipsis">
    Cuándo se envían los indicadores de escritura y cómo ajustarlos.
  </Card>
  <Card title="Transmisión y fragmentación" href="/es/concepts/streaming" icon="bars-staggered">
    Transmisión de salida, fragmentación y formato específico de cada canal.
  </Card>
  <Card title="Arquitectura del Gateway" href="/es/concepts/architecture" icon="diagram-project">
    Componentes del Gateway y protocolo WebSocket que controla las actualizaciones de presencia.
  </Card>
  <Card title="Protocolo del Gateway" href="/es/gateway/protocol" icon="plug">
    El protocolo de comunicación para `connect`, `system-event` y `system-presence`.
  </Card>
</CardGroup>
