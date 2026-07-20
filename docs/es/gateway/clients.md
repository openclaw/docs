---
read_when:
    - Creación de un cliente de operador, panel de control o WebChat fuera del repositorio de OpenClaw
    - Implementación de la reconexión del Gateway, el historial, las aprobaciones o el emparejamiento de dispositivos
    - Actualización de un cliente de terceros para una nueva versión del protocolo de conexión del Gateway
summary: Crear un operador de terceros o un cliente WebChat para el protocolo WebSocket del Gateway
title: Creación de un cliente de Gateway
x-i18n:
    generated_at: "2026-07-20T11:43:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fa24b196ff1fa28fb3b64d49ac25597f22cf1945aea56029e78e4375f1bdddb7
    source_path: gateway/clients.md
    workflow: 16
---

Use los paquetes publicados del Gateway para crear paneles de control para operadores, clientes de WebChat
y otras aplicaciones de terceros. Esta guía abarca el ciclo de vida del cliente en torno
al contrato de comunicación: autenticación, capacidades, recuperación tras la reconexión, historial,
suscripciones y actualizaciones de versión.

Para consultar las estructuras de las tramas, el protocolo de enlace, los errores y la superficie completa de métodos, lea la
[especificación del protocolo del Gateway](https://docs.openclaw.ai/gateway/protocol).

## Instalar los paquetes

```bash
npm install @openclaw/gateway-client @openclaw/gateway-protocol
```

<Note>
Estos paquetes se distribuyen con los ciclos de lanzamiento de OpenClaw. Durante el despliegue inicial, npm
puede devolver `E404` hasta que se publique la primera versión de OpenClaw que incluya los paquetes;
instálelos solo después de que estén disponibles las páginas del registro indicadas a continuación.
</Note>

- [`@openclaw/gateway-protocol`](https://www.npmjs.com/package/@openclaw/gateway-protocol)
  proporciona esquemas, validadores en tiempo de ejecución, tipos de TypeScript, registros de identidad y
  capacidades del cliente, lectores de errores estructurados y constantes de versión del protocolo.
  Su archivo tar de npm también incluye el contrato generado
  [`protocol.schema.json`](https://unpkg.com/@openclaw/gateway-protocol/protocol.schema.json)
  legible por máquina.
- [`@openclaw/gateway-client`](https://www.npmjs.com/package/@openclaw/gateway-client)
  es la implementación de referencia para la conexión. Importe la raíz del paquete para el cliente de Node
  y `@openclaw/gateway-client/browser` para los auxiliares compatibles con navegadores relativos al protocolo,
  la autenticación del dispositivo y la reconexión.

El punto de entrada de Node gestiona su transporte WebSocket. Un host de navegador proporciona un adaptador
WebSocket, además de almacenamiento persistente y callbacks de firma para la identidad
y el token del dispositivo.

## Elegir los ámbitos y emparejar el dispositivo

Un cliente de chat interactivo completo que también muestre solicitudes de aprobación debe solicitar
`role: "operator"` con estos ámbitos:

| Ámbito               | Uso                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `operator.read`      | `chat.history`, `sessions.list`, `sessions.subscribe`, estado del modelo y eventos de solo lectura |
| `operator.write`     | `chat.send` y modificaciones ordinarias de sesiones                                     |
| `operator.approvals` | Enumerar, mostrar y resolver aprobaciones de ejecución o de plugins                        |

Añada `operator.questions` solo si el cliente gestiona preguntas interactivas,
`operator.pairing` solo si administra dispositivos o nodos emparejados y
`operator.admin` solo para operaciones administrativas como `config.patch`.
La [referencia de ámbitos del operador](https://docs.openclaw.ai/gateway/operator-scopes)
define las reglas completas para los métodos y el momento de la aprobación.

No cree manualmente un token de portador por cliente editando `openclaw.json`. Configure
la autenticación de arranque compartida del Gateway con `openclaw configure --section
gateway` o las opciones `openclaw onboard --gateway-auth ...` y, a continuación, permita que el
emparejamiento del dispositivo genere el token del cliente:

1. Conserve una identidad de dispositivo Ed25519 en el cliente.
2. Espere a `connect.challenge`, firme la carga útil del dispositivo vinculada al desafío y envíe
   `connect` con el rol de operador y los ámbitos solicitados, además del token
   o la contraseña compartidos del Gateway para la autenticación de arranque.
3. Si el Gateway devuelve detalles estructurados de `PAIRING_REQUIRED`, muestre el ID de la solicitud
   y ponga en pausa o vuelva a intentarlo según `error.details.recommendedNextStep`.
4. En el host del Gateway, revise la solicitud con `openclaw devices list` y, a continuación,
   apruebe exactamente esa solicitud actual con `openclaw devices approve <requestId>`.
5. Vuelva a conectarse y conserve `hello-ok.auth.deviceToken` con el rol y los
   ámbitos negociados. Use ese token de dispositivo para las conexiones posteriores.

Las ampliaciones de ámbitos o roles crean una nueva solicitud de emparejamiento pendiente. La rotación del token no puede
ampliar el contrato de emparejamiento aprobado. Consulte la
[CLI de dispositivos](https://docs.openclaw.ai/cli/devices) para conocer los comandos de aprobación, rotación y
revocación.

## Anunciar las capacidades del cliente

`connect.params.caps` describe el comportamiento opcional que el cliente puede utilizar. No
concede autorización. Importe los nombres desde `GATEWAY_CLIENT_CAPS` en lugar de
duplicar literales de cadena:

```ts
import { GATEWAY_CLIENT_CAPS } from "@openclaw/gateway-protocol/client-info";

const caps = [GATEWAY_CLIENT_CAPS.TOOL_EVENTS];
```

El registro actual contiene `approvals`, `exec-approvals`, `inline-widgets`,
`run-tool-bindings`, `session-scoped-events`, `plugin-approvals`,
`task-suggestions`, `terminal-offset-seq`, `tool-events` y `ui-commands`.
Anuncie solo las capacidades que el cliente implemente realmente.

<Warning>
`tool-events` controla la transmisión en directo de la ejecución de herramientas. El Gateway solo registra
como destinatarias de los eventos estructurados de herramientas de una ejecución las conexiones
que anuncian esta capacidad. Sin ella, la conexión no recibe eventos de herramientas en directo y el
protocolo de enlace no informa de ningún error.
</Warning>

Las herramientas de agente condicionadas por capacidades constituyen un uso independiente de la misma declaración. Si una
herramienta de agente requiere una capacidad del cliente, el Gateway omite esa herramienta a menos que el
cliente de origen haya anunciado todas las capacidades necesarias.

## Recuperar el estado después de la reconexión

Trate cada reconexión correcta como una nueva proyección del historial persistente y
del estado actual de las ejecuciones en memoria:

1. Restablezca `sessions.subscribe` y la suscripción
   `sessions.messages.subscribe` de la sesión seleccionada.
2. Llame a `chat.history` para el `sessionKey` seleccionado y sustituya las filas persistentes locales
   por la proyección `messages` devuelta.
3. Si `inFlightRun` está presente, adopte su `runId`, el `text` almacenado en búfer y el
   `plan` opcional. Adopte la ejecución incluso cuando `text` esté vacío.
4. Lea `sessionInfo.hasActiveRun` y `sessionInfo.activeRunIds`. Al determinar si una ejecución
   conservada sigue controlando la interfaz de transmisión, dé preferencia a la pertenencia exacta a
   `activeRunIds`. Un valor verdadero de `hasActiveRun` sin ningún ID enumerado puede representar otra
   proyección activa del entorno de ejecución.
5. Concilie los eventos posteriores de `agent` por `payload.runId` y `payload.seq`.
   Mantenga de forma independiente la secuencia aceptada más alta para cada ejecución, ignore una
   secuencia ya vista o inferior y considere un salto hacia delante como motivo para volver a cargar
   el historial autoritativo.

La trama externa del evento también contiene un `seq` opcional, que ordena los eventos en la
conexión WebSocket actual. Se restablece con cada conexión nueva. El `seq` incluido
en la carga útil de un evento `agent` se asigna por ejecución y ordena los eventos del ciclo de vida,
del asistente, del plan, de las herramientas y de otros flujos de esa ejecución.

## Usar metadatos del historial y anclajes estables

Las filas devueltas por `chat.history` pueden incluir un contenedor de metadatos `__openclaw`:

- `id` es la identidad de la entrada de la transcripción. Úsela para las solicitudes de historial con anclaje,
  pero no como clave única de la fila mostrada.
- `seq` es la secuencia positiva del registro de la transcripción. Un registro almacenado puede proyectarse
  en más de una fila mostrada, por lo que deben mantenerse juntas las filas relacionadas con el mismo `id` y la misma secuencia.
- `kind` identifica las filas sintéticas. Un límite de Compaction usa
  `kind: "compaction"` y puede incluir `tokensBefore` y `tokensAfter` cuando un
  punto de control coincidente haya registrado esas métricas.

Retroceda por páginas con los valores `hasMore` y `nextOffset` de la respuesta. Los desplazamientos
numéricos describen la proyección actual de la transcripción, por lo que no deben conservarse como
marcadores de larga duración tras un restablecimiento o una Compaction. Conserve `__openclaw.id` en su lugar.
Para restaurar el contexto alrededor de una fila conocida, llame a `chat.history` con `messageId` y el
`sessionId` que lo devolvió. El Gateway puede resolver ese anclaje a partir del historial del
archivo de restablecimiento; las respuestas con anclaje omiten deliberadamente los metadatos numéricos de paginación.

## Suscribirse en lugar de sondear el uso

Cargue el catálogo inicial con `sessions.list` y, a continuación, llame una vez a `sessions.subscribe`
por conexión. Combine los eventos `sessions.changed` por `sessionKey`. Las cargas útiles de cambios
de sesión pueden incluir `inputTokens`, `outputTokens`, `totalTokens`,
`totalTokensFresh`, `contextTokens`, `estimatedCostUsd` en directo, ajustes del uso
de las respuestas y el estado de las ejecuciones activas.

Algunas notificaciones de cambios son solo señales de invalidación. Si un evento omite los
campos de fila que necesita la vista, actualice `sessions.list`. No sondee `usage.cost` ni
`sessions.usage` para mantener actualizada una lista de sesiones en directo; reserve esos métodos para
informes agregados o detallados bajo demanda.

## Recuperar aprobaciones de ejecución anteriores

Un cliente con `operator.approvals` debe instalar su receptor de eventos en cuanto
se complete `hello-ok` y, a continuación, llamar a `exec.approval.list` para recuperar las solicitudes
anteriores a la conexión. Concilie la lista y los eventos en directo
`exec.approval.requested` / `exec.approval.resolved` por ID de aprobación para que una
transición simultánea con la solicitud de la lista no se pierda ni vuelva a aparecer.

## Controlar las versiones del protocolo

La versión actual del protocolo de comunicación es `4`. Los clientes generales de operador y WebChat deben
negociar exactamente la versión actual con `minProtocol: 4` y `maxProtocol: 4`.
Solo los clientes de nodo autenticados y las sondas ligeras disponen de la ventana de aceptación
N-1, que actualmente abarca desde el protocolo `3` hasta `4`.

Los cambios del protocolo son primero aditivos. `protocol.schema.json` incluye metadatos
`since` de la versión de lanzamiento y metadatos de los ámbitos requeridos para los métodos principales, pero un incremento de la
versión del protocolo de comunicación sigue siendo un evento de ruptura explícito para los clientes de terceros. Fije las
versiones de los paquetes que pruebe, actualice conjuntamente el cliente y el Gateway cuando cambie la versión
del protocolo de comunicación y consulte el
[registro de cambios de OpenClaw](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)
antes de cada actualización.

## Contenido relacionado

- [Protocolo del Gateway](https://docs.openclaw.ai/gateway/protocol)
- [Integración de OpenClaw](https://docs.openclaw.ai/gateway/embedding)
- [Referencia RPC del Gateway](https://docs.openclaw.ai/reference/rpc)
- [Integraciones del Gateway para aplicaciones externas](https://docs.openclaw.ai/gateway/external-apps)
