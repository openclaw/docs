---
read_when:
    - Quieres activar o controlar TaskFlows desde un sistema externo
    - Está configurando el plugin de webhooks incluido
summary: 'Plugin Webhooks: entrada TaskFlow autenticada para automatización externa de confianza'
title: Plugin de Webhooks
x-i18n:
    generated_at: "2026-07-05T11:38:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

El plugin Webhooks añade rutas HTTP autenticadas para que un sistema externo
de confianza (Zapier, n8n, un trabajo de CI, un servicio interno) pueda crear y controlar
TaskFlows administrados de OpenClaw mediante HTTP, sin escribir un plugin personalizado.

El plugin se ejecuta dentro del proceso de Gateway. Para un Gateway remoto, instálalo y
configúralo en ese host, y luego reinicia Gateway. Se distribuye sin rutas
configuradas, por lo que no hace nada hasta que agregues al menos una ruta.

## Configurar rutas

Define la configuración en `plugins.entries.webhooks.config`:

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
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Campos de ruta:

| Campo          | Obligatorio | Predeterminado                | Notas                                         |
| -------------- | ----------- | ----------------------------- | --------------------------------------------- |
| `enabled`      | no          | `true`                        |                                               |
| `path`         | no          | `/plugins/webhooks/<routeId>` | Debe ser único entre las rutas.               |
| `sessionKey`   | sí          | -                             | Sesión propietaria de los TaskFlows vinculados. |
| `secret`       | sí          | -                             | Cadena sin formato o SecretRef (abajo).       |
| `controllerId` | no          | `webhooks/<routeId>`          | Se usa como controlador `create_flow` predeterminado. |
| `description`  | no          | -                             | Solo nota para el operador.                   |

`secret` acepta una cadena sin formato o un SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Cada ruta configurada se registra al inicio independientemente de si su secreto
se puede resolver en ese momento. Un secreto que no se puede resolver no deshabilita ni omite la
ruta: las solicitudes a ella fallan la autenticación (`401`) hasta que el secreto pueda
resolverse. Los valores SecretRef se resuelven de nuevo en cada solicitud, por lo que rotar el
secreto subyacente (variable de entorno, archivo o salida de exec) surte efecto sin
reiniciar Gateway.

## Modelo de seguridad

Cada ruta actúa con la autoridad de TaskFlow de su `sessionKey` configurada:
puede inspeccionar y modificar cualquier TaskFlow propiedad de esa sesión. El acceso a TaskFlow
siempre pasa por `api.runtime.tasks.managedFlows.bindSession(...)`, por lo que una
ruta nunca puede actuar fuera de su sesión vinculada. Para limitar el alcance del impacto:

- Usa un secreto fuerte y único por ruta.
- Prefiere un SecretRef en lugar de un secreto en texto plano en línea.
- Vincula las rutas a la sesión más limitada que se ajuste al flujo de trabajo.
- Expón solo la ruta de webhook específica que necesitas.

Orden de manejo de solicitudes para cada ruta: comprobaciones del método HTTP (`POST` únicamente) y
`Content-Type: application/json`, luego limitación de tasa de ventana fija (120
solicitudes por ventana de 60 segundos por clave de ruta+IP-del-cliente, hasta 4096 claves
rastreadas), luego limitación de solicitudes en curso (8 solicitudes concurrentes por clave, hasta
4096 claves rastreadas), luego autenticación con secreto compartido, y después una lectura de cuerpo JSON de 256 KB /
15 segundos. Las solicitudes que fallan una comprobación anterior nunca llegan a
las posteriores.

## Formato de solicitud

Envía solicitudes `POST` con `Content-Type: application/json` y
`Authorization: Bearer <secret>` o `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Acciones admitidas

| Acción             | Propósito                                                          |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | Crear un TaskFlow administrado para la sesión de la ruta.          |
| `get_flow`         | Obtener un TaskFlow por id.                                        |
| `list_flows`       | Listar TaskFlows para la sesión de la ruta.                        |
| `find_latest_flow` | Obtener el TaskFlow actualizado más recientemente.                 |
| `resolve_flow`     | Resolver un TaskFlow mediante un token opaco.                      |
| `get_task_summary` | Obtener el resumen de tarea de un TaskFlow.                        |
| `set_waiting`      | Marcar un TaskFlow como en espera, con datos opcionales de estado/espera. |
| `resume_flow`      | Reanudar un TaskFlow en espera/bloqueado.                          |
| `finish_flow`      | Marcar un TaskFlow como finalizado.                                |
| `fail_flow`        | Marcar un TaskFlow como fallido.                                   |
| `request_cancel`   | Solicitar cancelación cooperativa.                                 |
| `cancel_flow`      | Cancelar un TaskFlow (puede devolver `202` si los hijos siguen activos). |
| `run_task`         | Crear una tarea hija administrada dentro de un TaskFlow existente. |

Las acciones de modificación (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) requieren `flowId` y `expectedRevision` para concurrencia
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

Valores de `runtime` permitidos: `subagent`, `acp`. `startedAt`, `lastEventAt` y
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

## Forma de respuesta

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

Las vistas de flujo y tarea nunca incluyen metadatos de propietario/sesión, por lo que las respuestas no pueden
filtrar la `sessionKey` vinculada de la ruta. Los valores de `code` incluyen `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected` y
códigos de respaldo específicos de acción (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) cuando una modificación se rechaza por un
motivo no cubierto por los códigos nombrados arriba.

## Relacionado

- [Hooks](/es/automation/hooks): hooks internos impulsados por eventos frente a este puente TaskFlow basado en HTTP
- [Webhooks de Gateway (configuración `hooks.*`)](/es/automation/cron-jobs#webhooks): funcionalidad separada de endpoint HTTP genérico de Gateway; no es lo mismo que las rutas de este plugin
- [SDK de runtime de Plugin](/es/plugins/sdk-runtime)
- [webhooks de CLI](/es/cli/webhooks)
