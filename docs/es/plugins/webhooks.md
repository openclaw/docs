---
read_when:
    - Se desea activar o controlar TaskFlows desde un sistema externo
    - Está configurando el plugin de webhooks incluido.
summary: 'Plugin de Webhooks: entrada autenticada de TaskFlow para automatización externa de confianza'
title: Plugin de Webhooks
x-i18n:
    generated_at: "2026-07-19T02:03:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77e455450d6183635c76a1e8002feeb287deb4ff242dbd555ef9d0f2b21ce5f6
    source_path: plugins/webhooks.md
    workflow: 16
---

El plugin Webhooks añade rutas HTTP autenticadas para que un sistema externo de
confianza (Zapier, n8n, una tarea de CI, un servicio interno) pueda crear y controlar
TaskFlows administrados de OpenClaw mediante HTTP, sin escribir un plugin personalizado.

El plugin se ejecuta dentro del proceso del Gateway. Para un Gateway remoto, instálelo y
configúrelo en ese host y, después, reinicie el Gateway. Se distribuye sin rutas
configuradas, por lo que no hace nada hasta que se añade al menos una ruta.

## Configurar rutas

Establezca la configuración en `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Puente de TaskFlow para Zapier",
            },
          },
        },
      },
    },
  },
}
```

Campos de la ruta:

| Campo          | Obligatorio | Valor predeterminado           | Notas                                         |
| -------------- | ----------- | ----------------------------- | --------------------------------------------- |
| `enabled`      | no       | `true`                        |                                               |
| `path`         | no       | `/plugins/webhooks/<routeId>` | Debe ser único entre las rutas.                 |
| `sessionKey`   | sí      | -                             | Sesión propietaria de los TaskFlows vinculados.        |
| `secret`       | sí      | -                             | Cadena de texto sin formato o una SecretRef (véase más adelante).          |
| `controllerId` | no       | `webhooks/<routeId>`          | Se usa como controlador `create_flow` predeterminado. |
| `description`  | no       | -                             | Solo una nota para el operador.                           |

`secret` acepta una cadena de texto sin formato o una SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Las SecretRefs se resuelven en la instantánea de configuración de inicio del Gateway. Cuando
no se puede resolver el secreto de una ruta, el Gateway continúa ejecutándose y esa ruta
concreta permanece registrada, pero inactiva: las solicitudes reciben un fallo de
autenticación genérico (`401`). Las demás rutas siguen disponibles. Corrija
el origen de la SecretRef y, después, vuelva a cargar o reinicie el Gateway para activar
la nueva instantánea. Los valores de SecretRef nunca se resuelven en la ruta pública de
las solicitudes.

## Modelo de seguridad

Cada ruta actúa con la autoridad de TaskFlow de su `sessionKey` configurada: puede
inspeccionar y modificar cualquier TaskFlow que pertenezca a esa sesión. El acceso a TaskFlow
siempre se realiza mediante `api.runtime.tasks.managedFlows.bindSession(...)`, por lo que una
ruta nunca puede actuar fuera de su sesión vinculada. Para limitar el alcance de los daños:

- Use un secreto seguro y único para cada ruta.
- Prefiera una SecretRef a un secreto de texto sin formato insertado directamente.
- Vincule las rutas a la sesión más restringida que se adapte al flujo de trabajo.
- Exponga únicamente la ruta de Webhook específica que necesite.

Orden de procesamiento de las solicitudes para cada ruta: comprobaciones del método HTTP
(solo `POST`) y de `Content-Type: application/json`; después, limitación de velocidad
mediante ventana fija (120 solicitudes por cada ventana de 60 segundos por clave de
ruta+IP del cliente, con hasta 4,096 claves registradas); después, limitación de solicitudes
en curso (8 solicitudes simultáneas por clave, con hasta 4,096 claves registradas);
después, autenticación mediante secreto compartido; y, por último, lectura del cuerpo JSON
con un límite de 256 KB / 15 segundos. Las solicitudes que no superan una comprobación
anterior nunca llegan a las posteriores.

## Formato de la solicitud

Envíe solicitudes `POST` con `Content-Type: application/json` y
`Authorization: Bearer <secret>` o `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Revisar la cola de entrada"}'
```

## Acciones admitidas

| Acción             | Finalidad                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | Crear un TaskFlow administrado para la sesión de la ruta.                 |
| `get_flow`         | Obtener un TaskFlow por identificador.                                          |
| `list_flows`       | Enumerar los TaskFlows de la sesión de la ruta.                            |
| `find_latest_flow` | Obtener el TaskFlow actualizado más recientemente.                          |
| `resolve_flow`     | Resolver un TaskFlow mediante un token opaco.                                |
| `get_task_summary` | Obtener el resumen de tareas de un TaskFlow.                             |
| `set_waiting`      | Marcar un TaskFlow como en espera, con datos opcionales de estado/espera.            |
| `resume_flow`      | Reanudar un TaskFlow en espera/bloqueado.                                 |
| `finish_flow`      | Marcar un TaskFlow como finalizado.                                          |
| `fail_flow`        | Marcar un TaskFlow como fallido.                                            |
| `request_cancel`   | Solicitar la cancelación cooperativa.                                  |
| `cancel_flow`      | Cancelar un TaskFlow (puede devolver `202` si las tareas secundarias siguen activas). |
| `run_task`         | Crear una tarea secundaria administrada dentro de un TaskFlow existente.           |

Las acciones que realizan modificaciones (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) requieren `flowId` y `expectedRevision` para el control de
concurrencia optimista; una revisión obsoleta devuelve `409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Revisar la cola de entrada",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Valores `runtime` permitidos: `subagent`, `acp`. `startedAt`, `lastEventAt` y
`progressSummary` solo son válidos cuando `status` es `"running"`; enviarlos
con cualquier otro estado devuelve `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspeccionar el siguiente lote de mensajes"
}
```

## Estructura de la respuesta

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "No se encontró el TaskFlow.",
  "result": {}
}
```

Las vistas de flujos y tareas nunca incluyen metadatos del propietario o de la sesión, por
lo que las respuestas no pueden filtrar el `sessionKey` vinculado de la ruta. Los valores de `code` incluyen `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` y
códigos de reserva específicos de cada acción (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) cuando se rechaza una modificación por un
motivo que no cubren los códigos mencionados anteriormente.

## Temas relacionados

- [Hooks](/es/automation/hooks) - hooks internos controlados por eventos frente a este puente de TaskFlow basado en HTTP
- [Webhooks del Gateway (configuración `hooks.*`)](/es/automation/cron-jobs#webhooks) - funcionalidad independiente de endpoint HTTP genérico del Gateway; no es lo mismo que las rutas de este plugin
- [SDK de ejecución de plugins](/es/plugins/sdk-runtime)
- [Webhooks de la CLI](/es/cli/webhooks)
