---
read_when:
    - Quieres activar o controlar TaskFlow desde un sistema externo
    - Estás configurando el Plugin incluido de Webhooks
summary: 'Plugin de Webhooks: entrada autenticada de TaskFlow para automatización externa de confianza'
title: Plugin de Webhooks
x-i18n:
    generated_at: "2026-04-24T05:42:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (Plugin)

El Plugin de Webhooks añade rutas HTTP autenticadas que vinculan la
automatización externa con los TaskFlow de OpenClaw.

Úsalo cuando quieras que un sistema de confianza como Zapier, n8n, un trabajo de CI o un
servicio interno cree y controle TaskFlow gestionados sin tener que escribir primero un plugin personalizado.

## Dónde se ejecuta

El Plugin de Webhooks se ejecuta dentro del proceso del Gateway.

Si tu Gateway se ejecuta en otra máquina, instala y configura el Plugin en
ese host del Gateway y luego reinicia el Gateway.

## Configurar rutas

Establece la configuración en `plugins.entries.webhooks.config`:

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

Campos de la ruta:

- `enabled`: opcional, predeterminado `true`
- `path`: opcional, predeterminado `/plugins/webhooks/<routeId>`
- `sessionKey`: sesión obligatoria que posee los TaskFlow vinculados
- `secret`: secreto compartido o SecretRef obligatorio
- `controllerId`: id opcional del controlador para los flujos gestionados creados
- `description`: nota opcional para el operador

Entradas `secret` compatibles:

- Cadena simple
- SecretRef con `source: "env" | "file" | "exec"`

Si una ruta respaldada por secreto no puede resolver su secreto al arrancar, el Plugin omite
esa ruta y registra una advertencia en lugar de exponer un endpoint roto.

## Modelo de seguridad

Se considera que cada ruta actúa con la autoridad de TaskFlow de la
`sessionKey` configurada.

Esto significa que la ruta puede inspeccionar y modificar TaskFlow propiedad de esa sesión, así
que deberías:

- Usar un secreto fuerte y único por ruta
- Preferir referencias de secretos en lugar de secretos en texto claro en línea
- Vincular rutas a la sesión más estrecha que se ajuste al flujo de trabajo
- Exponer solo la ruta específica de webhook que necesites

El Plugin aplica:

- Autenticación mediante secreto compartido
- Límites de tamaño de cuerpo de solicitud y tiempo de espera
- Limitación de velocidad de ventana fija
- Limitación de solicitudes en curso
- Acceso a TaskFlow vinculado al propietario mediante `api.runtime.taskFlow.bindSession(...)`

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

## Acciones compatibles

El Plugin acepta actualmente estos valores JSON de `action`:

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

## Forma de la respuesta

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

El Plugin elimina intencionadamente los metadatos de propietario/sesión de las respuestas del webhook.

## Documentación relacionada

- [SDK de runtime de Plugins](/es/plugins/sdk-runtime)
- [Resumen de hooks y webhooks](/es/automation/hooks)
- [CLI de webhooks](/es/cli/webhooks)
