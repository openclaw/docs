---
read_when:
    - Creación de herramientas para el host que no pueden usar el cliente RPC WebSocket del Gateway
    - Exposición de la automatización administrativa del Gateway mediante un punto de entrada privado y de confianza
    - Auditoría del modelo de seguridad para el acceso HTTP a los métodos del Gateway
summary: Exponga métodos seleccionados del plano de control del Gateway mediante el plugin integrado y opcional admin-http-rpc
title: Plugin RPC HTTP de administración
x-i18n:
    generated_at: "2026-07-12T14:42:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

El plugin incluido `admin-http-rpc` expone mediante HTTP un conjunto autorizado de métodos del plano de control del Gateway, para la automatización de hosts de confianza que no puede mantener abierta una conexión WebSocket con el Gateway.

Se distribuye con OpenClaw, pero está deshabilitado de forma predeterminada; cuando está deshabilitado, la ruta no se registra. Cuando está habilitado, añade `POST /api/v1/admin/rpc` en el mismo listener que el Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Habilítelo únicamente para herramientas privadas del host, automatización en una tailnet o un ingreso interno de confianza. Nunca exponga esta ruta directamente a Internet público.

## Antes de habilitarlo

El RPC HTTP de administración es una superficie completa del plano de control del operador: cualquier cliente que supere la autenticación HTTP del Gateway puede invocar los métodos autorizados que se indican a continuación. Habilítelo únicamente cuando se cumplan todas estas condiciones:

- El cliente es de confianza para operar el Gateway.
- El cliente no puede usar el cliente RPC de WebSocket.
- Solo se puede acceder a la ruta mediante loopback, una tailnet o un ingreso privado autenticado.
- Ha revisado los métodos permitidos y coinciden con la automatización que planea ejecutar.

Para los clientes de OpenClaw y las herramientas interactivas que pueden mantener abierta una conexión WebSocket con el Gateway, use en su lugar RPC de WebSocket.

## Habilitar

Habilite el plugin incluido:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Configuración">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

La ruta se registra durante el inicio del plugin, por lo que debe reiniciar el Gateway después de cambiar la configuración del plugin.

Deshabilítelo cuando ya no necesite la superficie HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Verificar la ruta

Use `health` como la solicitud segura más pequeña:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Una respuesta correcta tiene `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Cuando el plugin está deshabilitado, la ruta devuelve `404` porque no está registrada.

## Autenticación

La ruta del plugin usa la autenticación HTTP del Gateway.

Vías de autenticación habituales:

- autenticación mediante secreto compartido (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
- autenticación HTTP de confianza con identidad (`gateway.auth.mode="trusted-proxy"`): dirija la ruta a través del proxy configurado con reconocimiento de identidad y permita que este inserte los encabezados de identidad necesarios
- autenticación abierta mediante ingreso privado (`gateway.auth.mode="none"`): no se requiere ningún encabezado de autenticación

## Modelo de seguridad

Trate este plugin como una superficie completa de operador del Gateway.

- Al habilitar el plugin, se ofrece intencionadamente acceso a los métodos RPC de administración autorizados en `/api/v1/admin/rpc`.
- El plugin declara el contrato reservado de manifiesto `contracts.gatewayMethodDispatch: ["authenticated-request"]`, que permite que su ruta HTTP autenticada por el Gateway despache métodos del plano de control dentro del proceso. Esto no es un entorno aislado: el contrato evita el uso accidental de asistentes reservados del SDK, pero los plugins de confianza siguen ejecutándose en el proceso del Gateway.
- La autenticación mediante portador de secreto compartido (modos `token`/`password`) demuestra la posesión del secreto de operador del Gateway; en esa vía se ignoran los encabezados `x-openclaw-scopes` más restringidos y se restauran los valores predeterminados normales del operador completo.
- La autenticación HTTP de confianza con identidad (modo `trusted-proxy`) respeta `x-openclaw-scopes` cuando está presente.
- `gateway.auth.mode="none"` significa que esta ruta no está autenticada si el plugin está habilitado. Úselo únicamente detrás de un ingreso privado en el que confíe plenamente.
- Las solicitudes se despachan mediante los mismos controladores de métodos y comprobaciones de ámbitos del Gateway que el RPC de WebSocket, después de que se supere la autenticación de la ruta del plugin.
- Se puede seguir accediendo a la ruta durante un arrendamiento de suspensión preparado. La validación acotada de solicitudes y la respuesta local de detección `commands.list` siguen disponibles. De los métodos despachados al Gateway, solo `gateway.suspend.prepare`, `gateway.suspend.status` y `gateway.suspend.resume` pueden ejecutarse mientras la admisión está cerrada; los demás métodos autorizados devuelven la respuesta reintentable normal `UNAVAILABLE` del Gateway.
- Mantenga esta ruta en loopback, una tailnet o un ingreso privado de confianza. No la exponga directamente a Internet público. Use gateways separados cuando los clientes atraviesen límites de confianza.

## Solicitud

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Campos:

- `id` (cadena, opcional): se copia en la respuesta. Se genera un UUID cuando se omite.
- `method` (cadena, obligatorio): nombre de método permitido del Gateway.
- `params` (cualquier tipo, opcional): parámetros específicos del método.

El tamaño máximo predeterminado del cuerpo de la solicitud es de 1 MB.

## Respuesta

Las respuestas correctas usan la estructura RPC del Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Los errores de métodos del Gateway usan:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

El estado HTTP depende del código de error:

| Código de error            | Estado HTTP |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| cualquier otro código      | 500         |

## Métodos permitidos

- detección: `commands.list`
  Devuelve los nombres de los métodos RPC HTTP permitidos por este plugin.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- configuración: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- canales: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- modelos: `models.list`, `models.authStatus`
- agentes: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- aprobaciones: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- dispositivos: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nodos: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tareas: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnósticos: `doctor.memory.status`, `update.status`

Los demás métodos del Gateway permanecen bloqueados hasta que se añadan intencionadamente.

## Comparación con WebSocket

La ruta RPC normal de WebSocket del Gateway sigue siendo la API preferida del plano de control para los clientes de OpenClaw. Use RPC HTTP de administración únicamente para herramientas del host que necesiten una superficie HTTP de solicitud y respuesta.

Los clientes WebSocket con token compartido que no tengan una identidad de dispositivo de confianza no pueden autodeclarar ámbitos de administración durante la conexión. RPC HTTP de administración sigue deliberadamente el modelo existente de operador HTTP de confianza: cuando el plugin está habilitado, la autenticación mediante portador de secreto compartido se trata como acceso de operador completo para esta superficie de administración.

## Solución de problemas

`404 Not Found`

: El plugin está deshabilitado, el Gateway no se ha reiniciado desde que se habilitó o la solicitud se dirige a un proceso de Gateway diferente.

`401 Unauthorized`

: La solicitud no cumplió la autenticación HTTP del Gateway. Compruebe el token de portador o los encabezados de identidad del proxy de confianza.

`405 Method Not Allowed`

: La solicitud usó un método distinto de `POST`.

`413 Payload Too Large`

: El cuerpo de la solicitud superó el límite de 1 MB.

`400 INVALID_REQUEST`

: El cuerpo de la solicitud no es JSON válido, falta el campo `method`, el método no está en la lista de permitidos del plugin o un identificador de reanudación de suspensión no coincide con el arrendamiento activo.

`503 UNAVAILABLE`

: El método del Gateway se está iniciando, tiene una limitación de frecuencia, está suspendido o espera una operación de suspensión o reanudación en competencia. Inspeccione `error.details` cuando esté presente y respete `error.retryAfterMs` antes de volver a intentarlo.

## Relacionado

- [Ámbitos del operador](/es/gateway/operator-scopes)
- [Seguridad del Gateway](/es/gateway/security)
- [Acceso remoto](/es/gateway/remote)
- [Manifiesto del plugin](/es/plugins/manifest#contracts-reference)
- [Subrutas del SDK](/es/plugins/sdk-subpaths)
