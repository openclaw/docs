---
read_when:
    - Está creando una aplicación externa, un script, un panel, una tarea de CI o una extensión de IDE que se comunica con OpenClaw
    - Está eligiendo entre RPC de Gateway y el SDK de Plugin
    - Está integrando ejecuciones de agentes, sesiones, eventos, aprobaciones, modelos o herramientas del Gateway
    - Está emparejando un controlador de alojamiento con un programador de activación externo
sidebarTitle: External apps
summary: Ruta de integración actual para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
title: Integraciones del Gateway para aplicaciones externas
x-i18n:
    generated_at: "2026-07-12T14:34:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Las aplicaciones externas se comunican con OpenClaw mediante el protocolo del Gateway: transporte
WebSocket y métodos RPC. Úselo cuando un script, panel, trabajo de CI, extensión
de IDE u otro proceso necesite iniciar ejecuciones de agentes, transmitir eventos, esperar
resultados, cancelar trabajo o inspeccionar recursos del Gateway.

<Warning>
  Todavía no hay ningún paquete cliente público de npm. No añada nombres de paquetes
  cliente de OpenClaw como dependencias de la aplicación hasta que las notas de la versión anuncien
  un paquete publicado y esta página incluya instrucciones de instalación.
</Warning>

<Note>
  Esta página está destinada al código externo al proceso de OpenClaw. El código de Plugin que se ejecuta
  dentro de OpenClaw debe usar en su lugar las subrutas documentadas de `openclaw/plugin-sdk/*`.
</Note>

## Qué está disponible actualmente

| Interfaz                                | Estado    | Uso                                                                                                  |
| --------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| [Protocolo del Gateway](/es/gateway/protocol) | Disponible | Transporte WebSocket, negociación de conexión, ámbitos de autenticación, versionado del protocolo y eventos. |
| [Referencia RPC del Gateway](/es/reference/rpc) | Disponible | Métodos actuales del Gateway para agentes, sesiones, tareas, modelos, herramientas, artefactos y aprobaciones. |
| [`openclaw agent`](/es/cli/agent)          | Disponible | Integración puntual con scripts cuando basta con invocar la CLI desde el shell.                      |
| [`openclaw message`](/es/cli/message)      | Disponible | Envío de mensajes o acciones de canal desde scripts.                                                 |

Se está desarrollando internamente un futuro paquete de biblioteca cliente, pero todavía no es una
interfaz pública de instalación. Trátelo como un detalle de implementación preliminar hasta que una
versión anuncie un paquete publicado y versionado.

## Ruta recomendada

1. Ejecute o detecte un Gateway.
2. Conéctese mediante el [protocolo del Gateway](/es/gateway/protocol).
3. Llame a los métodos RPC documentados en la [referencia RPC del Gateway](/es/reference/rpc).
4. Fije la versión de OpenClaw con la que realiza las pruebas.
5. Vuelva a consultar la referencia RPC al actualizar OpenClaw.

Para las ejecuciones de agentes, comience con el RPC `agent` y combínelo con `agent.wait` para obtener un
resultado terminal. Para conservar el estado de conversación, use los métodos `sessions.*`.
Para integraciones de interfaz de usuario, suscríbase a los eventos del Gateway y represente únicamente las familias
de eventos que comprenda la aplicación.

## Suspensión cooperativa del host

Los controladores de alojamiento que congelan o crean una instantánea de un proceso en ejecución pueden usar la
negociación de suspensión independiente del host:

1. Deje de admitir el tráfico de entrada externo controlado por el host.
2. Llame a `gateway.suspend.prepare` con un `requestId` estable y único.
3. Si la respuesta es `busy`, mantenga el proceso en ejecución y vuelva a intentarlo más tarde.
4. Si es `ready`, guarde el `suspensionId` devuelto y, a continuación, congele el proceso o cree
   una instantánea antes de `expiresAtMs`.
5. Después de reanudarlo, o si se abandona la suspensión, llame a `gateway.suspend.resume`
   con ese `suspensionId` mediante la conexión WebSocket existente o la ruta de control
   HTTP de administración.

Un Gateway preparado rechaza nuevas negociaciones WebSocket. Un controlador WebSocket
debe mantener abierta su conexión autenticada durante toda la operación del host. Si no
se puede garantizar, habilite y use el
[Plugin RPC HTTP de administración](/es/plugins/admin-http-rpc) antes de la preparación. Si se
pierde la ruta de control, espere a que caduque el arrendamiento de dos minutos antes de
volver a conectarse; la caducidad reabre la admisión automáticamente.

El contrato RPC es:

- `gateway.suspend.prepare` — `operator.admin`; parámetros
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; parámetros
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; parámetros
  `{ "suspensionId": "id-from-prepare" }`

Los identificadores se recortan, deben contener un carácter que no sea un espacio en blanco y están limitados a
128 caracteres. Un resultado de preparación ocupado tiene `status: "busy"`, `reason`,
`retryAfterMs`, `activeCount` y `blockers`. Un resultado preparado tiene esta forma:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

El estado devuelve `{"status":"running"}` o un resultado preparado con `expiresAtMs`.
La reanudación devuelve `{"ok":true,"status":"running","resumed":true}`; repetirla
después de una reanudación correcta devuelve `resumed: false`.

Un identificador de solicitud en conflicto o un fallo transitorio al reanudar el planificador devuelve
`UNAVAILABLE`, que permite reintentos, con `retryAfterMs`. Durante la recuperación del planificador, la preparación, el estado
y la reanudación devuelven ese error, el Gateway permanece no preparado y
cerrado ante fallos, y el host no debe congelarlo ni crear una instantánea. OpenClaw vuelve a intentar
la operación del planificador automáticamente y solo reabre la admisión después de que la recuperación se complete correctamente. Un
identificador de reanudación que no coincida devuelve `INVALID_REQUEST`. La preparación comparte el presupuesto de escritura
del plano de control del Gateway de tres intentos por minuto; respete el retraso de reintento
devuelto. Los clientes WebSocket se agrupan por dispositivo e IP. Los controladores HTTP
de administración se agrupan por la IP de cliente resuelta, por lo que los controladores situados detrás de un mismo
proxy pueden compartir un presupuesto.

La preparación solo rechaza: OpenClaw cierra la admisión de nuevas operaciones raíz, sesiones y comandos,
pausa las activaciones automáticas de cron e inspecciona el trabajo de forma síncrona. Si hay alguna tarea
activa, reanuda el planificador y reabre la admisión antes de devolver
`busy`; no interrumpe ni evacua ese trabajo. Un arrendamiento preparado dura dos
minutos. Repetir `prepare` con el mismo `requestId` lo renueva; al caducar, se reanuda
el planificador antes de reabrir la admisión.
Una emisión de reinicio cuyo momento llegue durante un arrendamiento preparado espera hasta que el arrendamiento
se reanude; un reinicio en curso hace que la preparación devuelva `busy`.

Mientras está preparado, `/healthz` sigue activo y `/readyz` devuelve `503`. Las respuestas de
disponibilidad locales o autenticadas incluyen `gateway-draining`; los sondeos remotos
no autenticados solo reciben `{ "ready": false }`. El sondeo de estado HTTP,
los métodos de suspensión en conexiones WebSocket existentes y una ruta RPC HTTP
de administración ya habilitada siguen disponibles. Otros RPC devuelven
`UNAVAILABLE`, que permite reintentos. Las rutas HTTP integradas de trabajo del usuario y las rutas HTTP
ordinarias de Plugin, incluidas las API compatibles con OpenAI, las operaciones de herramientas y sesiones,
las observaciones de nodos y los hooks configurados, devuelven `503` con `error.code: "gateway_unavailable"`. Las nuevas
actualizaciones WebSocket propiedad de plugins también devuelven `503`; esto abarca la
propiedad de la actualización, no el trabajo realizado posteriormente mediante un socket de Plugin ya establecido.

Esta negociación no conserva los mensajes entrantes, no detiene los transportes de canales de
terceros ni controla la plataforma de alojamiento. El host debe bloquear su tráfico de entrada
antes de la preparación y sigue siendo responsable de la activación, la creación de instantáneas o congelación y
la detención. `activeCount` es el recuento agregado del trabajo supervisado, mientras que `blockers`
contiene los recuentos de categorías distintos de cero y detalles limitados de las tareas. Esto no es una
barrera general de inactividad del proceso. Un bloqueador `background-exec` solo es agregado:
el texto de los comandos, los identificadores de procesos, la salida y los identificadores de sesión o ámbito nunca
atraviesan el protocolo. El estado de los canales, el mantenimiento, la actualización de la caché, las sesiones
WebSocket de plugins ya establecidas y el trabajo en segundo plano no registrado propiedad de plugins pueden
seguir activos.
La plataforma de alojamiento debe congelar o crear una instantánea de forma coherente de todo el árbol de procesos y su
sistema de archivos; este primer contrato no puede demostrar que el trabajo no registrado esté inactivo.

<Tip>
  Para programar la activación del host, mantenga la parte orientada a OpenClaw en un Plugin
  dentro del proceso y proyecte instantáneas completas idempotentes al adaptador externo del host.
  El controlador de alojamiento no debe importar el SDK de Plugin ni reconstruir el estado de cron
  a partir de diferencias entre eventos. Consulte [Proyección externa segura de
  cron](/es/plugins/hooks#safe-external-cron-projection).
</Tip>

## Código de aplicación frente a código de Plugin

Use RPC del Gateway cuando el código esté fuera de OpenClaw:

- Scripts de Node que inician u observan ejecuciones de agentes
- Trabajos de CI que llaman a un Gateway
- paneles y paneles de administración
- extensiones de IDE
- puentes externos que no necesitan convertirse en plugins de canal
- pruebas de integración con transportes del Gateway simulados o reales

Use el SDK de Plugin cuando el código se ejecute dentro de OpenClaw:

- plugins de proveedor
- plugins de canal
- hooks de herramientas o del ciclo de vida
- plugins del entorno de ejecución de agentes
- ayudantes de entorno de ejecución de confianza

Las aplicaciones externas no deben importar `openclaw/plugin-sdk/*`; esas subrutas son para
plugins cargados por OpenClaw.

## Contenido relacionado

- [Protocolo del Gateway](/es/gateway/protocol)
- [Referencia RPC del Gateway](/es/reference/rpc)
- [Comando de agente de la CLI](/es/cli/agent)
- [Comando de mensajes de la CLI](/es/cli/message)
- [Bucle del agente](/es/concepts/agent-loop)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Sesiones](/es/concepts/session)
- [Tareas en segundo plano](/es/automation/tasks)
- [Agentes ACP](/es/tools/acp-agents)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
