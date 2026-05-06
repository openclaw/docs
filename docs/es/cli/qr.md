---
read_when:
    - Quieres vincular rápidamente una aplicación de nodo móvil con un Gateway
    - Necesitas la salida de setup-code para compartirla de forma remota/manual
summary: Referencia de la CLI para `openclaw qr` (generar QR de emparejamiento móvil + código de configuración)
title: QR
x-i18n:
    generated_at: "2026-05-06T05:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un QR de emparejamiento móvil y un código de configuración a partir de tu configuración actual del Gateway.

## Uso

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opciones

- `--remote`: prefiere `gateway.remote.url`; si no está definido, `gateway.tailscale.mode=serve|funnel` aún puede proporcionar la URL pública remota
- `--url <url>`: sobrescribe la URL del gateway usada en la carga útil
- `--public-url <url>`: sobrescribe la URL pública usada en la carga útil
- `--token <token>`: sobrescribe el token del gateway contra el que se autentica el flujo de arranque
- `--password <password>`: sobrescribe la contraseña del gateway contra la que se autentica el flujo de arranque
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite el renderizado ASCII del QR
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notas

- `--token` y `--password` son mutuamente excluyentes.
- El código de configuración ahora lleva un `bootstrapToken` opaco y de corta duración, no el token/contraseña compartidos del gateway.
- En el flujo de arranque de node/operador integrado, el token principal de node todavía queda con `scopes: []`.
- Si la transferencia de arranque también emite un token de operador, permanece limitado a la lista de permitidos de arranque: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Las comprobaciones de ámbito de arranque llevan prefijo de rol. Esa lista de permitidos de operador solo satisface solicitudes de operador; los roles que no son de operador siguen necesitando ámbitos bajo su propio prefijo de rol.
- El emparejamiento móvil falla de forma cerrada para URL de gateway `ws://` de Tailscale/públicas. Las direcciones LAN privadas y los hosts Bonjour `.local` siguen siendo compatibles mediante `ws://`, pero las rutas móviles Tailscale/públicas deberían usar Tailscale Serve/Funnel o una URL de gateway `wss://`.
- Con `--remote`, OpenClaw requiere `gateway.remote.url` o
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, si las credenciales remotas efectivamente activas están configuradas como SecretRefs y no pasas `--token` ni `--password`, el comando las resuelve desde la instantánea activa del gateway. Si el gateway no está disponible, el comando falla rápidamente.
- Sin `--remote`, los SecretRefs de autenticación del gateway local se resuelven cuando no se pasa ninguna sobrescritura de autenticación de la CLI:
  - `gateway.auth.token` se resuelve cuando la autenticación por token puede ganar (`gateway.auth.mode="token"` explícito o modo inferido en el que no gana ninguna fuente de contraseña).
  - `gateway.auth.password` se resuelve cuando la autenticación por contraseña puede ganar (`gateway.auth.mode="password"` explícito o modo inferido sin un token ganador desde auth/env).
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidos SecretRefs) y `gateway.auth.mode` no está definido, la resolución del código de configuración falla hasta que el modo se defina explícitamente.
- Nota sobre desfase de versión del Gateway: esta ruta de comando requiere un gateway que admita `secrets.resolve`; los gateways más antiguos devuelven un error de método desconocido.
- Después de escanear, aprueba el emparejamiento del dispositivo con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Emparejamiento](/es/cli/pairing)
