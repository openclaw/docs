---
read_when:
    - Llamar herramientas sin ejecutar un turno completo del agente
    - Crear automatizaciones que necesiten aplicación de políticas de herramientas
summary: Invocar una sola herramienta directamente mediante el endpoint HTTP del Gateway
title: API de invocación de herramientas
x-i18n:
    generated_at: "2026-04-24T05:31:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Invocación de herramientas (HTTP)

El Gateway de OpenClaw expone un endpoint HTTP simple para invocar directamente una sola herramienta. Siempre está habilitado y usa autenticación del Gateway más política de herramientas. Al igual que la superficie compatible con OpenAI `/v1/*`, la autenticación bearer con secreto compartido se trata como acceso de operador de confianza para todo el gateway.

- `POST /tools/invoke`
- Mismo puerto que el Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

El tamaño máximo predeterminado de la carga útil es 2 MB.

## Autenticación

Usa la configuración de autenticación del Gateway.

Rutas comunes de autenticación HTTP:

- autenticación con secreto compartido (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticación HTTP confiable con identidad (`gateway.auth.mode="trusted-proxy"`):
  enruta mediante el proxy con reconocimiento de identidad configurado y deja que inyecte
  las cabeceras de identidad requeridas
- autenticación abierta de ingreso privado (`gateway.auth.mode="none"`):
  no se requiere cabecera de autenticación

Notas:

- Cuando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Cuando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Cuando `gateway.auth.mode="trusted-proxy"`, la solicitud HTTP debe venir de una
  fuente de proxy confiable configurada y no loopback; los proxies loopback en el mismo host no
  satisfacen este modo.
- Si `gateway.auth.rateLimit` está configurado y ocurren demasiados fallos de autenticación, el endpoint devuelve `429` con `Retry-After`.

## Límite de seguridad (importante)

Trata este endpoint como una superficie de **acceso completo de operador** para la instancia del gateway.

- La autenticación bearer HTTP aquí no es un modelo de alcance estrecho por usuario.
- Un token/password válido del Gateway para este endpoint debe tratarse como una credencial de propietario/operador.
- Para modos de autenticación con secreto compartido (`token` y `password`), el endpoint restaura los valores predeterminados normales completos de operador incluso si el llamador envía una cabecera `x-openclaw-scopes` más restringida.
- La autenticación con secreto compartido también trata las invocaciones directas de herramientas en este endpoint como turnos de remitente propietario.
- Los modos HTTP confiables con identidad (por ejemplo, autenticación de proxy confiable o `gateway.auth.mode="none"` en un ingreso privado) respetan `x-openclaw-scopes` cuando está presente y, en caso contrario, recurren al conjunto normal de alcances predeterminados de operador.
- Mantén este endpoint solo en loopback/tailnet/ingreso privado; no lo expongas directamente al internet público.

Matriz de autenticación:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - demuestra posesión del secreto compartido de operador del gateway
  - ignora `x-openclaw-scopes` más restringido
  - restaura el conjunto completo predeterminado de alcances de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata las invocaciones directas de herramientas en este endpoint como turnos de remitente propietario
- modos HTTP confiables con identidad (por ejemplo autenticación de proxy confiable, o `gateway.auth.mode="none"` en ingreso privado)
  - autentican alguna identidad externa confiable o límite de despliegue
  - respetan `x-openclaw-scopes` cuando la cabecera está presente
  - recurren al conjunto normal predeterminado de alcances de operador cuando la cabecera está ausente
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

- `tool` (string, obligatorio): nombre de la herramienta que se va a invocar.
- `action` (string, opcional): se asigna a args si el esquema de la herramienta admite `action` y la carga útil de args lo omitió.
- `args` (object, opcional): argumentos específicos de la herramienta.
- `sessionKey` (string, opcional): clave de la sesión de destino. Si se omite o es `"main"`, el Gateway usa la clave de sesión principal configurada (respeta `session.mainKey` y el agente predeterminado, o `global` en alcance global).
- `dryRun` (boolean, opcional): reservado para uso futuro; actualmente se ignora.

## Comportamiento de política + enrutamiento

La disponibilidad de herramientas se filtra mediante la misma cadena de políticas que usan los agentes del Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- políticas de grupo (si la clave de sesión se asigna a un grupo o canal)
- política de subagente (cuando se invoca con una clave de sesión de subagente)

Si una herramienta no está permitida por la política, el endpoint devuelve **404**.

Notas importantes sobre límites:

- Las aprobaciones de exec son barreras de protección del operador, no un límite de autorización separado para este endpoint HTTP. Si una herramienta es accesible aquí mediante autenticación del Gateway + política de herramientas, `/tools/invoke` no agrega un prompt adicional de aprobación por llamada.
- No compartas credenciales bearer del Gateway con llamadores no confiables. Si necesitas separación entre límites de confianza, ejecuta gateways separados (e idealmente usuarios/hosts del SO separados).

El HTTP del Gateway también aplica una denylist rígida por defecto (incluso si la política de sesión permite la herramienta):

- `exec` — ejecución directa de comandos (superficie RCE)
- `spawn` — creación arbitraria de procesos hijo (superficie RCE)
- `shell` — ejecución de comandos de shell (superficie RCE)
- `fs_write` — mutación arbitraria de archivos en el host
- `fs_delete` — eliminación arbitraria de archivos en el host
- `fs_move` — mover/renombrar archivos arbitrariamente en el host
- `apply_patch` — la aplicación de parches puede reescribir archivos arbitrarios
- `sessions_spawn` — orquestación de sesiones; generar agentes remotamente es RCE
- `sessions_send` — inyección de mensajes entre sesiones
- `cron` — plano de control de automatización persistente
- `gateway` — plano de control del gateway; evita la reconfiguración mediante HTTP
- `nodes` — el relé de comandos de Node puede alcanzar `system.run` en hosts emparejados
- `whatsapp_login` — configuración interactiva que requiere escaneo QR en terminal; se cuelga en HTTP

Puedes personalizar esta denylist mediante `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Herramientas adicionales que se bloquearán sobre HTTP /tools/invoke
      deny: ["browser"],
      // Quita herramientas de la denylist predeterminada
      allow: ["gateway"],
    },
  },
}
```

Para ayudar a las políticas de grupo a resolver el contexto, puedes establecer opcionalmente:

- `x-openclaw-message-channel: <channel>` (ejemplo: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (cuando existen varias cuentas)

## Respuestas

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (solicitud inválida o error de entrada de herramienta)
- `401` → no autorizado
- `429` → autenticación limitada por tasa (`Retry-After` establecido)
- `404` → herramienta no disponible (no encontrada o no incluida en allowlist)
- `405` → método no permitido
- `500` → `{ ok: false, error: { type, message } }` (error inesperado al ejecutar la herramienta; mensaje saneado)

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
