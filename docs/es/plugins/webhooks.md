---
read_when:
    - Quieres activar o controlar TaskFlows desde un sistema externo
    - Está configurando el Plugin de Webhooks incluido
summary: 'Plugin de Webhooks: entrada autenticada de TaskFlow para automatización externa de confianza'
title: Plugin de Webhooks
x-i18n:
    generated_at: "2026-04-30T05:55:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhooks (Plugin)

El Plugin Webhooks añade rutas HTTP autenticadas que vinculan automatización
externa con TaskFlows de OpenClaw.

Úsalo cuando quieras que un sistema de confianza, como Zapier, n8n, un trabajo
de CI o un servicio interno, cree y dirija TaskFlows gestionados sin escribir
primero un Plugin personalizado.

## Dónde se ejecuta

El Plugin Webhooks se ejecuta dentro del proceso del Gateway.

Si tu Gateway se ejecuta en otra máquina, instala y configura el Plugin en ese
host del Gateway y luego reinicia el Gateway.

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
              description: "Puente de TaskFlow para Zapier",
            },
          },
        },
      },
    },
  },
}
```

Campos de ruta:

- `enabled`: opcional, el valor predeterminado es `true`
- `path`: opcional, el valor predeterminado es `/plugins/webhooks/<routeId>`
- `sessionKey`: sesión requerida que posee los TaskFlows vinculados
- `secret`: secreto compartido o SecretRef requerido
- `controllerId`: id de controlador opcional para los flujos gestionados creados
- `description`: nota opcional para el operador

Entradas de `secret` admitidas:

- Cadena de texto sin formato
- SecretRef con `source: "env" | "file" | "exec"`

Si una ruta respaldada por un secreto no puede resolver su secreto al iniciar, el Plugin omite
esa ruta y registra una advertencia en lugar de exponer un endpoint defectuoso.

## Modelo de seguridad

Cada ruta es de confianza para actuar con la autoridad de TaskFlow de su
`sessionKey` configurada.

Esto significa que la ruta puede inspeccionar y modificar TaskFlows propiedad de esa sesión, por lo que
deberías:

- Usar un secreto fuerte y único por ruta
- Preferir referencias a secretos en lugar de secretos en texto plano en línea
- Vincular rutas a la sesión más limitada que se ajuste al flujo de trabajo
- Exponer solo la ruta de Webhook específica que necesitas

El Plugin aplica:

- Autenticación con secreto compartido
- Guardas de tamaño del cuerpo de la solicitud y de tiempo de espera
- Limitación de tasa de ventana fija
- Limitación de solicitudes en curso
- Acceso a TaskFlow vinculado al propietario mediante `api.runtime.tasks.managedFlows.bindSession(...)`

## Formato de solicitud

Envía solicitudes `POST` con:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` o `x-openclaw-webhook-secret: <secret>`

Ejemplo:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Acciones admitidas

Actualmente, el Plugin acepta estos valores JSON de `action`:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Crea un TaskFlow gestionado para la sesión vinculada de la ruta.

Ejemplo:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Crea una tarea hija gestionada dentro de un TaskFlow gestionado existente.

Los runtimes permitidos son:

- `subagent`
- `acp`

Ejemplo:

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

Las respuestas correctas devuelven:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Las solicitudes rechazadas devuelven:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

El Plugin elimina intencionadamente los metadatos de propietario/sesión de las respuestas de Webhook.

## Documentación relacionada

- [SDK de runtime de Plugin](/es/plugins/sdk-runtime)
- [Resumen de hooks y webhooks](/es/automation/hooks)
- [Webhooks de CLI](/es/cli/webhooks)
