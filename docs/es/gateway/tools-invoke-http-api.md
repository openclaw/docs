---
read_when:
    - Llamar a herramientas sin ejecutar un turno completo del agente
    - Creación de automatizaciones que requieren la aplicación de políticas de herramientas
summary: Invocar una única herramienta directamente mediante el punto de conexión HTTP del Gateway
title: API de invocación de herramientas
x-i18n:
    generated_at: "2026-05-06T05:36:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway expone un endpoint HTTP simple para invocar directamente una sola herramienta. Siempre está habilitado y usa la autenticación del Gateway más la política de herramientas. Al igual que la superficie compatible con OpenAI `/v1/*`, la autenticación de bearer con secreto compartido se trata como acceso de operador de confianza para todo el gateway.

- `POST /tools/invoke`
- Mismo puerto que el Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

El tamaño máximo predeterminado de la carga útil es de 2 MB.

## Autenticación

Usa la configuración de autenticación del Gateway.

Rutas comunes de autenticación HTTP:

- autenticación con secreto compartido (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticación HTTP con identidad de confianza (`gateway.auth.mode="trusted-proxy"`):
  enrute a través del proxy configurado con reconocimiento de identidad y deje que inyecte los
  encabezados de identidad requeridos
- autenticación abierta de ingreso privado (`gateway.auth.mode="none"`):
  no se requiere encabezado de autenticación

Notas:

- Cuando `gateway.auth.mode="token"`, use `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Cuando `gateway.auth.mode="password"`, use `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Cuando `gateway.auth.mode="trusted-proxy"`, la solicitud HTTP debe provenir de una
  fuente de proxy de confianza configurada; los proxies loopback en el mismo host requieren
  `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Si `gateway.auth.rateLimit` está configurado y ocurren demasiados fallos de autenticación, el endpoint devuelve `429` con `Retry-After`.

## Límite de seguridad (importante)

Trate este endpoint como una superficie de **acceso completo de operador** para la instancia del gateway.

- La autenticación bearer HTTP aquí no es un modelo estrecho de alcance por usuario.
- Un token/contraseña válido del Gateway para este endpoint debe tratarse como una credencial de propietario/operador.
- Para los modos de autenticación con secreto compartido (`token` y `password`), el endpoint restaura los valores predeterminados normales de operador completo incluso si el llamador envía un encabezado `x-openclaw-scopes` más restringido.
- La autenticación con secreto compartido también trata las invocaciones directas de herramientas en este endpoint como turnos de remitente-propietario.
- Los modos HTTP con identidad de confianza (por ejemplo, autenticación de proxy de confianza o `gateway.auth.mode="none"` en un ingreso privado) respetan `x-openclaw-scopes` cuando está presente y, de lo contrario, recurren al conjunto normal de alcances predeterminados de operador.
- Mantenga este endpoint solo en loopback/tailnet/ingreso privado; no lo exponga directamente a internet pública.

Matriz de autenticación:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - prueba la posesión del secreto compartido de operador del gateway
  - ignora `x-openclaw-scopes` más restringidos
  - restaura el conjunto completo de alcances predeterminados de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata las invocaciones directas de herramientas en este endpoint como turnos de remitente-propietario
- modos HTTP con identidad de confianza (por ejemplo, autenticación de proxy de confianza, o `gateway.auth.mode="none"` en ingreso privado)
  - autentican alguna identidad externa de confianza o límite de despliegue
  - respetan `x-openclaw-scopes` cuando el encabezado está presente
  - recurren al conjunto normal de alcances predeterminados de operador cuando el encabezado está ausente
  - solo pierden la semántica de propietario cuando el llamador restringe explícitamente los alcances y omite `operator.admin`

## Cuerpo de la solicitud

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Campos:

- `tool` (cadena, obligatorio): nombre de la herramienta que se va a invocar.
- `action` (cadena, opcional): se asigna a args si el esquema de la herramienta admite `action` y la carga útil args lo omitió.
- `args` (objeto, opcional): argumentos específicos de la herramienta.
- `sessionKey` (cadena, opcional): clave de sesión de destino. Si se omite o es `"main"`, el Gateway usa la clave de sesión principal configurada (respeta `session.mainKey` y el agente predeterminado, o `global` en el alcance global).
- `dryRun` (booleano, opcional): reservado para uso futuro; actualmente se ignora.

## Comportamiento de política y enrutamiento

La disponibilidad de herramientas se filtra mediante la misma cadena de políticas que usan los agentes del Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (si la clave de sesión se asigna a un grupo o canal)
- política de subagente (al invocar con una clave de sesión de subagente)

Si una herramienta no está permitida por la política, el endpoint devuelve **404**.

Notas importantes sobre límites:

- Las aprobaciones de exec son medidas de protección para operadores, no un límite de autorización separado para este endpoint HTTP. Si una herramienta es accesible aquí mediante autenticación del Gateway + política de herramientas, `/tools/invoke` no añade una solicitud de aprobación adicional por llamada.
- No comparta credenciales bearer del Gateway con llamadores que no sean de confianza. Si necesita separación entre límites de confianza, ejecute gateways separados (e idealmente usuarios/hosts de SO separados).

HTTP del Gateway también aplica una lista estricta de denegación de forma predeterminada (incluso si la política de sesión permite la herramienta):

- `exec` - ejecución directa de comandos (superficie RCE)
- `spawn` - creación arbitraria de procesos hijo (superficie RCE)
- `shell` - ejecución de comandos de shell (superficie RCE)
- `fs_write` - mutación arbitraria de archivos en el host
- `fs_delete` - eliminación arbitraria de archivos en el host
- `fs_move` - movimiento/cambio de nombre arbitrario de archivos en el host
- `apply_patch` - la aplicación de parches puede reescribir archivos arbitrarios
- `sessions_spawn` - orquestación de sesiones; generar agentes de forma remota es RCE
- `sessions_send` - inyección de mensajes entre sesiones
- `cron` - plano de control de automatización persistente
- `gateway` - plano de control del gateway; impide la reconfiguración mediante HTTP
- `nodes` - el relé de comandos de node puede alcanzar system.run en hosts emparejados
- `whatsapp_login` - configuración interactiva que requiere escaneo de QR en terminal; se bloquea en HTTP

Puede personalizar esta lista de denegación mediante `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Para ayudar a que las políticas de grupo resuelvan el contexto, opcionalmente puede establecer:

- `x-openclaw-message-channel: <channel>` (ejemplo: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (cuando existen varias cuentas)

## Respuestas

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (solicitud no válida o error de entrada de herramienta)
- `401` → no autorizado
- `429` → autenticación limitada por tasa (`Retry-After` establecido)
- `404` → herramienta no disponible (no encontrada o no incluida en la lista de permitidos)
- `405` → método no permitido
- `500` → `{ ok: false, error: { type, message } }` (error inesperado de ejecución de herramienta; mensaje saneado)

## Ejemplo

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Relacionado

- [Protocolo del Gateway](/es/gateway/protocol)
- [Herramientas y plugins](/es/tools)
