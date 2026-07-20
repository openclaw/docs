---
read_when:
    - Está desarrollando una aplicación externa, un script, un panel, un trabajo de CI o una extensión de IDE que se comunica con OpenClaw
    - Está eligiendo entre RPC de Gateway y el SDK de plugins
    - Se está integrando con ejecuciones de agentes, sesiones, eventos, aprobaciones, modelos o herramientas del Gateway
    - Se está vinculando un controlador de alojamiento con un programador de activación externo
sidebarTitle: External apps
summary: Ruta de integración actual para aplicaciones externas, scripts, paneles, trabajos de CI y extensiones de IDE
title: Integraciones del Gateway para aplicaciones externas
x-i18n:
    generated_at: "2026-07-20T11:44:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 276c6f4173197683a60770327e131e6ab2fa4d33f416ba96c170539df7246f83
    source_path: gateway/external-apps.md
    workflow: 16
---

Las aplicaciones externas se comunican con OpenClaw mediante el protocolo del Gateway: transporte
WebSocket y métodos RPC. Se utiliza cuando un script, panel, trabajo de CI, extensión
de IDE u otro proceso necesita iniciar ejecuciones de agentes, transmitir eventos, esperar
resultados, cancelar trabajo o inspeccionar recursos del Gateway.

<Note>
  Para paquetes npm, emparejamiento de dispositivos, recuperación de reconexiones, historial, suscripciones
  y aprobaciones, consulte primero
  [Creación de un cliente del Gateway](https://docs.openclaw.ai/gateway/clients). Si la
  aplicación supervisa el Gateway como proceso secundario, consulte también
  [Integración de OpenClaw](https://docs.openclaw.ai/gateway/embedding). Durante el
  despliegue inicial del paquete, npm puede devolver `E404` hasta que se publique la primera versión
  de OpenClaw que incluya el paquete.
</Note>

<Note>
  Esta página está destinada al código externo al proceso de OpenClaw. El código de Plugin que se ejecuta
  dentro de OpenClaw debe utilizar en su lugar las subrutas documentadas de `openclaw/plugin-sdk/*`.
</Note>

## Qué está disponible actualmente

| Superficie                                                        | Estado                | Uso                                                                                                    |
| ----------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| [Guía del cliente del Gateway](https://docs.openclaw.ai/gateway/clients) | Ciclo de publicación | Paquetes npm, autenticación, reconexión, historial, eventos, aprobaciones y política de versiones.      |
| [Guía de integración](https://docs.openclaw.ai/gateway/embedding) | Ciclo de publicación | Entorno del proceso secundario, disponibilidad, ciclo de vida, recuperación, propiedad de RPC y empaquetado. |
| [Protocolo del Gateway](/es/gateway/protocol)                         | Listo                 | Transporte WebSocket, negociación de conexión, ámbitos de autenticación, control de versiones del protocolo y eventos. |
| [Referencia RPC del Gateway](/es/reference/rpc)                       | Listo                 | Métodos actuales del Gateway para agentes, sesiones, tareas, modelos, herramientas, artefactos y aprobaciones. |
| [`openclaw agent`](/es/cli/agent)                                  | Listo                 | Integración puntual con scripts cuando basta con invocar la CLI desde el shell.                         |
| [`openclaw message`](/es/cli/message)                                | Listo                 | Envío de mensajes o acciones de canal desde scripts.                                                    |

## Ruta recomendada

1. Ejecute o detecte un Gateway.
2. Conéctese mediante el [protocolo del Gateway](/es/gateway/protocol).
3. Llame a los métodos RPC documentados en la [referencia RPC del Gateway](/es/reference/rpc).
4. Fije la versión de OpenClaw con la que realiza las pruebas.
5. Vuelva a consultar la referencia RPC al actualizar OpenClaw.

Para las ejecuciones de agentes, comience con el RPC `agent` y combínelo con `agent.wait` para obtener un
resultado final. Para un estado de conversación persistente, utilice los métodos `sessions.*`.
Para integraciones de interfaz de usuario, suscríbase a los eventos del Gateway y represente únicamente las familias
de eventos que comprende la aplicación.

## Suspensión cooperativa del host

Los controladores de alojamiento que congelan o crean una instantánea de un proceso en ejecución pueden utilizar la
negociación de suspensión independiente del host:

1. Deje de admitir el tráfico entrante externo controlado por el host.
2. Llame a `gateway.suspend.prepare` con un `requestId` estable y único.
3. Si la respuesta es `busy`, mantenga el proceso en ejecución y vuelva a intentarlo más tarde.
4. Si es `ready`, guarde el valor `suspensionId` devuelto y, a continuación, congele o cree una instantánea
   del proceso antes de `expiresAtMs`.
5. Después de reanudarlo, o si se abandona la suspensión, llame a `gateway.suspend.resume`
   con ese `suspensionId` mediante el WebSocket existente o la ruta de control HTTP
   de administración.

Un Gateway preparado rechaza nuevas negociaciones de WebSocket. Un controlador WebSocket
debe mantener abierta su conexión autenticada durante la operación del host. Si no
se puede garantizar, habilite y utilice el
[Plugin RPC HTTP de administración](/es/plugins/admin-http-rpc) antes de la preparación. Si se
pierde la ruta de control, espere a que caduque el arrendamiento de dos minutos antes de
volver a conectarse; la caducidad vuelve a abrir la admisión automáticamente.

El contrato RPC es:

- `gateway.suspend.prepare` — `operator.admin`; parámetros
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; parámetros
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; parámetros
  `{ "suspensionId": "id-from-prepare" }`

Se eliminan los espacios de los extremos de los identificadores, estos deben contener un carácter que no sea un espacio en blanco y están limitados a
128 caracteres. Un resultado de preparación ocupada contiene `status: "busy"`, `reason`,
`retryAfterMs`, `activeCount` y `blockers`. Un resultado listo tiene esta forma:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

El estado devuelve `{"status":"running"}` o un resultado listo con `expiresAtMs`.
La reanudación devuelve `{"ok":true,"status":"running","resumed":true}`; si se repite
después de una reanudación correcta, devuelve `resumed: false`.

Un identificador de solicitud en conflicto o un fallo transitorio de reanudación del planificador devuelve el error reintentable
`UNAVAILABLE` con `retryAfterMs`. Durante la recuperación del planificador, la preparación, el estado
y la reanudación devuelven ese error, el Gateway permanece no disponible y en modo
de denegación ante fallos, y el host no debe congelarlo ni crear una instantánea. OpenClaw reintenta la
recuperación del planificador automáticamente y solo vuelve a abrir la admisión cuando esta se completa correctamente. Un
identificador de reanudación no coincidente devuelve `INVALID_REQUEST`. La preparación comparte el
presupuesto de escritura del plano de control del Gateway de tres intentos por minuto; respete el
retraso de reintento devuelto. Los clientes WebSocket se agrupan por dispositivo e IP. Los controladores
HTTP de administración se agrupan según la IP resuelta del cliente, por lo que los controladores detrás de un mismo
proxy pueden compartir un presupuesto.

La preparación solo permite rechazar: OpenClaw cierra la admisión de nuevas raíces, sesiones y comandos,
pausa los ciclos automáticos de Cron e inspecciona el trabajo de forma sincrónica. Si hay alguna actividad,
reanuda el planificador y vuelve a abrir la admisión antes de devolver
`busy`; no interrumpe ni espera a que finalice ese trabajo. Un arrendamiento listo dura dos
minutos. Repetir `prepare` con el mismo `requestId` lo renueva; su caducidad reanuda
el planificador antes de volver a abrir la admisión.
La emisión de un reinicio cuyo momento llega durante un arrendamiento listo espera hasta que se reanude el arrendamiento;
un reinicio en curso hace que la preparación devuelva `busy`.

Mientras está listo, `/healthz` permanece activo y `/readyz` devuelve `503`. Las respuestas
de disponibilidad locales o autenticadas incluyen `gateway-draining`; los sondeos remotos no autenticados
solo reciben `{ "ready": false }`. El sondeo de estado HTTP,
los métodos de suspensión en conexiones WebSocket existentes y una ruta RPC HTTP de administración
ya habilitada permanecen disponibles. Otros RPC devuelven el error reintentable
`UNAVAILABLE`. Las rutas HTTP integradas de trabajo de usuario y las rutas HTTP habituales de plugins,
incluidas las API compatibles con OpenAI, las operaciones de herramientas y sesiones, las observaciones de nodos y
los hooks configurados, devuelven `503` con `error.code: "gateway_unavailable"`. Las nuevas
actualizaciones de WebSocket propiedad de plugins también devuelven `503`; esto abarca la propiedad
de la actualización, no el trabajo realizado posteriormente mediante un socket de Plugin ya establecido.

Esta negociación no conserva los mensajes entrantes, no detiene los transportes de canales de terceros
ni controla la plataforma de alojamiento. El host debe bloquear su tráfico entrante
antes de la preparación y sigue siendo responsable de la activación, la creación de instantáneas o congelación y
la detención. `activeCount` es el recuento total del trabajo supervisado, mientras que `blockers`
contiene los recuentos de categorías distintos de cero y detalles limitados de las tareas. Esto no constituye una
barrera general de inactividad del proceso. Un bloqueador `background-exec` solo es agregado:
el texto de los comandos, los identificadores de procesos, la salida y los identificadores de sesión o ámbito nunca
atraviesan el protocolo. El estado de los canales, el mantenimiento, la actualización de la caché, las sesiones
WebSocket de plugins establecidas y el trabajo en segundo plano no registrado propiedad de plugins pueden
permanecer activos.
La plataforma de alojamiento debe congelar o crear una instantánea de todo el árbol de procesos y su
sistema de archivos de forma coherente; este primer contrato no permite demostrar que el trabajo no registrado
esté inactivo.

<Tip>
  Para la programación de activaciones del host, mantenga la parte orientada a OpenClaw en un
  Plugin dentro del proceso y proyecte instantáneas completas idempotentes al adaptador externo del host.
  El controlador de alojamiento no debe importar el SDK de Plugin ni reconstruir el estado de Cron
  a partir de diferencias de eventos. Consulte [Proyección externa segura de Cron
  ](/es/plugins/hooks#safe-external-cron-projection).
</Tip>

## Código de aplicaciones frente a código de plugins

Utilice RPC del Gateway cuando el código resida fuera de OpenClaw:

- Scripts de Node que inician u observan ejecuciones de agentes
- Trabajos de CI que llaman a un Gateway
- Paneles y paneles de administración
- Extensiones de IDE
- Puentes externos que no necesitan convertirse en plugins de canal
- Pruebas de integración con transportes del Gateway simulados o reales

Utilice el SDK de Plugin cuando el código se ejecute dentro de OpenClaw:

- Plugins de proveedores
- Plugins de canales
- Hooks de herramientas o del ciclo de vida
- Plugins de infraestructura de agentes
- Ayudantes de entorno de ejecución de confianza

Las aplicaciones externas no deben importar `openclaw/plugin-sdk/*`; esas subrutas están destinadas a
plugins cargados por OpenClaw.

## Contenido relacionado

- [Creación de un cliente del Gateway](https://docs.openclaw.ai/gateway/clients)
- [Integración de OpenClaw](https://docs.openclaw.ai/gateway/embedding)
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
