---
read_when:
    - Construir herramientas de host que no pueden usar el cliente RPC WebSocket de Gateway
    - Exponer la automatización administrativa de Gateway detrás de una entrada privada de confianza
    - Auditando el modelo de seguridad para el acceso HTTP a los métodos de Gateway
summary: Expón métodos seleccionados del plano de control del Gateway mediante el plugin admin-http-rpc incluido y opcional
title: Plugin RPC HTTP de administración
x-i18n:
    generated_at: "2026-07-05T11:29:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 075135d2248acc859e60a72639350e16ed43785e9a353396fd47c3b02a4b0f5a
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

El plugin incluido `admin-http-rpc` expone por HTTP un conjunto de métodos del plano de control de Gateway en una lista permitida, para automatización de hosts de confianza que no puede mantener abierta una conexión WebSocket con Gateway.

Se distribuye con OpenClaw, pero está deshabilitado de forma predeterminada; cuando está deshabilitado, la ruta no se registra. Cuando está habilitado, agrega `POST /api/v1/admin/rpc` en el mismo listener que Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Habilítalo solo para herramientas privadas del host, automatización de tailnet o una entrada interna de confianza. Nunca expongas esta ruta directamente a internet público.

## Antes de habilitarlo

RPC HTTP de administración es una superficie completa del plano de control para operadores: cualquier llamador que supere la autenticación HTTP de Gateway puede invocar los métodos permitidos que se indican abajo. Habilítalo solo cuando todo esto sea cierto:

- El llamador es de confianza para operar Gateway.
- El llamador no puede usar el cliente RPC WebSocket.
- La ruta solo es accesible en loopback, una tailnet o una entrada privada autenticada.
- Has revisado los métodos permitidos y coinciden con la automatización que planeas ejecutar.

Para clientes de OpenClaw y herramientas interactivas que pueden mantener abierta una conexión WebSocket con Gateway, usa RPC WebSocket en su lugar.

## Habilitar

Habilita el plugin incluido:

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

La ruta se registra durante el inicio del plugin, así que reinicia Gateway después de cambiar la configuración del plugin.

Deshabilítalo cuando ya no necesites la superficie HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Verificar la ruta

Usa `health` como la solicitud segura más pequeña:

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

La ruta del plugin usa autenticación HTTP de Gateway.

Rutas de autenticación comunes:

- autenticación de secreto compartido (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
- autenticación HTTP con identidad de confianza (`gateway.auth.mode="trusted-proxy"`): enruta a través del proxy configurado con reconocimiento de identidad y deja que inyecte los encabezados de identidad requeridos
- autenticación abierta de entrada privada (`gateway.auth.mode="none"`): no se requiere encabezado de autenticación

## Modelo de seguridad

Trata este plugin como una superficie completa de operador de Gateway.

- Habilitar el plugin ofrece intencionalmente acceso a los métodos RPC de administración permitidos en `/api/v1/admin/rpc`.
- El plugin declara el contrato de manifiesto reservado `contracts.gatewayMethodDispatch: ["authenticated-request"]`, que es lo que permite que su ruta HTTP autenticada por Gateway despache métodos del plano de control en el proceso. Esto no es un sandbox: el contrato evita el uso accidental de helpers reservados del SDK, pero los plugins de confianza siguen ejecutándose en el proceso de Gateway.
- La autenticación bearer de secreto compartido (modos `token`/`password`) prueba la posesión del secreto del operador de Gateway; los encabezados `x-openclaw-scopes` más restringidos se ignoran en esa ruta y se restauran los valores predeterminados normales de operador completo.
- La autenticación HTTP con identidad de confianza (modo `trusted-proxy`) respeta `x-openclaw-scopes` cuando están presentes.
- `gateway.auth.mode="none"` significa que esta ruta no está autenticada si el plugin está habilitado. Usa eso solo detrás de una entrada privada en la que confíes plenamente.
- Las solicitudes se despachan a través de los mismos handlers de métodos de Gateway y comprobaciones de alcance que RPC WebSocket, después de que la autenticación de la ruta del plugin se supere.
- Mantén esta ruta en loopback, tailnet o una entrada privada de confianza. No la expongas directamente a internet público. Usa gateways separados cuando los llamadores crucen límites de confianza.

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
- `method` (cadena, obligatorio): nombre de método de Gateway permitido.
- `params` (cualquier valor, opcional): parámetros específicos del método.

El tamaño máximo predeterminado del cuerpo de la solicitud es de 1 MB.

## Respuesta

Las respuestas correctas usan la forma RPC de Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Los errores de método de Gateway usan:

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

El estado HTTP sigue el código de error:

| Código de error            | Estado HTTP |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| cualquier otro código      | 500         |

## Métodos permitidos

- descubrimiento: `commands.list`
  Devuelve los nombres de métodos RPC HTTP permitidos por este plugin.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- configuración: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- canales: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- modelos: `models.list`, `models.authStatus`
- agentes: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- aprobaciones: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- dispositivos: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nodos: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tareas: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnósticos: `doctor.memory.status`, `update.status`

Otros métodos de Gateway se bloquean hasta que se agreguen intencionalmente.

## Comparación con WebSocket

La ruta RPC WebSocket normal de Gateway sigue siendo la API de plano de control preferida para clientes de OpenClaw. Usa RPC HTTP de administración solo para herramientas de host que necesitan una superficie HTTP de solicitud/respuesta.

Los clientes WebSocket con token compartido sin una identidad de dispositivo de confianza no pueden autodeclarar alcances de administración durante la conexión. RPC HTTP de administración sigue deliberadamente el modelo existente de operador HTTP de confianza: cuando el plugin está habilitado, la autenticación bearer de secreto compartido se trata como acceso de operador completo para esta superficie de administración.

## Solución de problemas

`404 Not Found`

: El plugin está deshabilitado, Gateway no se ha reiniciado desde que se habilitó, o la solicitud va a un proceso de Gateway diferente.

`401 Unauthorized`

: La solicitud no satisfizo la autenticación HTTP de Gateway. Comprueba el token bearer o los encabezados de identidad de trusted-proxy.

`405 Method Not Allowed`

: La solicitud usó algo distinto de `POST`.

`413 Payload Too Large`

: El cuerpo de la solicitud superó el límite de 1 MB.

`400 INVALID_REQUEST`

: El cuerpo de la solicitud no es JSON válido, falta el campo `method` o el método no está en la lista permitida del plugin.

`503 UNAVAILABLE`

: El handler del método de Gateway no está disponible. Revisa los logs de Gateway y vuelve a intentarlo después de que Gateway termine de iniciar.

## Relacionado

- [Alcances de operador](/es/gateway/operator-scopes)
- [Seguridad de Gateway](/es/gateway/security)
- [Acceso remoto](/es/gateway/remote)
- [Manifiesto de Plugin](/es/plugins/manifest#contracts-reference)
- [Subrutas de SDK](/es/plugins/sdk-subpaths)
