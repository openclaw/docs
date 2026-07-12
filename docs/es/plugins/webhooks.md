---
read_when:
    - Quieres activar o controlar TaskFlows desde un sistema externo
    - Estás configurando el plugin de webhooks incluido
summary: 'Plugin de Webhooks: entrada autenticada de TaskFlow para automatización externa de confianza'
title: Plugin de Webhooks
x-i18n:
    generated_at: "2026-07-11T23:27:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

El Plugin Webhooks añade rutas HTTP autenticadas para que un sistema externo
de confianza (Zapier, n8n, una tarea de CI, un servicio interno) pueda crear y controlar
TaskFlows administrados de OpenClaw mediante HTTP, sin escribir un plugin personalizado.

El plugin se ejecuta dentro del proceso del Gateway. Para un Gateway remoto, instálelo y
configúrelo en ese host y, después, reinicie el Gateway. Se distribuye sin rutas
configuradas, por lo que no realiza ninguna operación hasta que se añade al menos una ruta.

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

| Campo          | Obligatorio | Valor predeterminado           | Notas                                                   |
| -------------- | ----------- | ------------------------------ | ------------------------------------------------------- |
| `enabled`      | no          | `true`                         |                                                         |
| `path`         | no          | `/plugins/webhooks/<routeId>`  | Debe ser único entre las rutas.                         |
| `sessionKey`   | sí          | -                              | Sesión propietaria de los TaskFlows vinculados.         |
| `secret`       | sí          | -                              | Cadena de texto sin formato o SecretRef (véase abajo).  |
| `controllerId` | no          | `webhooks/<routeId>`           | Se usa como controlador predeterminado de `create_flow`. |
| `description`  | no          | -                              | Solo una nota para el operador.                         |

`secret` acepta una cadena de texto sin formato o una SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Cada ruta configurada se registra al iniciarse, independientemente de si su secreto
puede resolverse en ese momento. Un secreto que no se puede resolver no desactiva ni omite la
ruta: las solicitudes dirigidas a ella no superan la autenticación (`401`) hasta que el secreto pueda
resolverse. Los valores SecretRef vuelven a resolverse con cada solicitud, por lo que la rotación del
secreto subyacente (variable de entorno, archivo o salida de un ejecutable) surte efecto sin
reiniciar el Gateway.

## Modelo de seguridad

Cada ruta actúa con la autoridad de TaskFlow de su `sessionKey` configurada: puede
inspeccionar y modificar cualquier TaskFlow perteneciente a esa sesión. El acceso a TaskFlow
siempre se realiza mediante `api.runtime.tasks.managedFlows.bindSession(...)`, por lo que una
ruta nunca puede actuar fuera de su sesión vinculada. Para limitar el alcance de posibles daños:

- Use un secreto sólido y único para cada ruta.
- Prefiera una SecretRef frente a un secreto de texto sin formato insertado directamente.
- Vincule las rutas a la sesión más específica que se ajuste al flujo de trabajo.
- Exponga únicamente la ruta de webhook específica que necesite.

Orden de procesamiento de las solicitudes para cada ruta: comprobaciones del método HTTP
(solo `POST`) y de `Content-Type: application/json`; después, limitación de frecuencia con
ventana fija (120 solicitudes por cada ventana de 60 segundos para cada clave de ruta+IP del
cliente, con un máximo de 4096 claves registradas); a continuación, limitación de solicitudes
en curso (8 solicitudes simultáneas por clave, con un máximo de 4096 claves registradas);
después, autenticación mediante secreto compartido; y, por último, lectura del cuerpo JSON
con un límite de 256 KB y 15 segundos. Las solicitudes que no superan una comprobación
anterior nunca llegan a las posteriores.

## Formato de la solicitud

Envíe solicitudes `POST` con `Content-Type: application/json` y
`Authorization: Bearer <secret>` o `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Acciones compatibles

| Acción             | Finalidad                                                                    |
| ------------------ | ---------------------------------------------------------------------------- |
| `create_flow`      | Crea un TaskFlow administrado para la sesión de la ruta.                     |
| `get_flow`         | Obtiene un TaskFlow por identificador.                                       |
| `list_flows`       | Enumera los TaskFlows de la sesión de la ruta.                               |
| `find_latest_flow` | Obtiene el TaskFlow actualizado más recientemente.                           |
| `resolve_flow`     | Resuelve un TaskFlow mediante un token opaco.                                |
| `get_task_summary` | Obtiene el resumen de tareas de un TaskFlow.                                 |
| `set_waiting`      | Marca un TaskFlow como en espera, con datos opcionales de estado/espera.      |
| `resume_flow`      | Reanuda un TaskFlow en espera/bloqueado.                                     |
| `finish_flow`      | Marca un TaskFlow como finalizado.                                           |
| `fail_flow`        | Marca un TaskFlow como fallido.                                              |
| `request_cancel`   | Solicita una cancelación cooperativa.                                        |
| `cancel_flow`      | Cancela un TaskFlow (puede devolver `202` si aún hay procesos secundarios activos). |
| `run_task`         | Crea una tarea secundaria administrada dentro de un TaskFlow existente.      |

Las acciones de modificación (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) requieren `flowId` y `expectedRevision` para aplicar concurrencia
optimista; una revisión obsoleta devuelve `409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Valores permitidos de `runtime`: `subagent`, `acp`. `startedAt`, `lastEventAt` y
`progressSummary` solo son válidos cuando `status` es `"running"`; enviarlos
con cualquier otro estado devuelve `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
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
  "error": "TaskFlow not found.",
  "result": {}
}
```

Las vistas de flujos y tareas nunca incluyen metadatos del propietario o de la sesión, por lo que las respuestas no pueden
revelar la `sessionKey` vinculada a la ruta. Los valores de `code` incluyen `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` y
códigos de respaldo específicos de cada acción (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) cuando una modificación se rechaza por un
motivo no contemplado en los códigos mencionados anteriormente.

## Contenido relacionado

- [Hooks](/es/automation/hooks): hooks internos basados en eventos frente a este puente de TaskFlow basado en HTTP
- [Webhooks del Gateway (configuración `hooks.*`)](/es/automation/cron-jobs#webhooks): funcionalidad independiente de punto de conexión HTTP genérico del Gateway; no es lo mismo que las rutas de este plugin
- [SDK de tiempo de ejecución del plugin](/es/plugins/sdk-runtime)
- [Webhooks de la CLI](/es/cli/webhooks)
