---
read_when:
    - Quieres emparejar rápidamente una aplicación Node móvil con un Gateway
    - Necesitas la salida del código de configuración para compartir de forma remota/manual
summary: Referencia de CLI para `openclaw qr` (generar QR de emparejamiento móvil + código de configuración)
title: QR
x-i18n:
    generated_at: "2026-07-04T17:48:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un QR de emparejamiento móvil y un código de configuración a partir de tu configuración actual de Gateway.

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
- `--url <url>`: sobrescribe la URL de Gateway usada en la carga útil
- `--public-url <url>`: sobrescribe la URL pública usada en la carga útil
- `--token <token>`: sobrescribe contra qué token de Gateway se autentica el flujo de arranque
- `--password <password>`: sobrescribe contra qué contraseña de Gateway se autentica el flujo de arranque
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite la representación QR ASCII
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notas

- `--token` y `--password` son mutuamente excluyentes.
- El propio código de configuración ahora lleva un `bootstrapToken` opaco y de corta duración, no el token/contraseña compartidos de Gateway.
- El arranque integrado con código de configuración devuelve un token principal de `node` con `scopes: []`, más un token acotado de transferencia de `operator` para la incorporación móvil de confianza.
- El token de operador transferido se limita a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`; los ámbitos de mutación de emparejamiento y `operator.admin` siguen requiriendo un emparejamiento de operador aprobado por separado o un flujo de token.
- El emparejamiento móvil falla de forma cerrada para URL de Gateway `ws://` públicas/de Tailscale. Las direcciones LAN privadas y los hosts Bonjour `.local` siguen siendo compatibles mediante `ws://`, pero las rutas móviles públicas/de Tailscale deberían usar Tailscale Serve/Funnel o una URL de Gateway `wss://`.
- Con `--remote`, OpenClaw requiere `gateway.remote.url` o
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, si las credenciales remotas efectivamente activas están configuradas como SecretRefs y no pasas `--token` ni `--password`, el comando las resuelve desde la instantánea activa de Gateway. Si Gateway no está disponible, el comando falla rápidamente.
- Sin `--remote`, las SecretRefs de autenticación de Gateway local se resuelven cuando no se pasa una anulación de autenticación por CLI:
  - `gateway.auth.token` se resuelve cuando la autenticación por token puede prevalecer (`gateway.auth.mode="token"` explícito o modo inferido donde no prevalece ninguna fuente de contraseña).
  - `gateway.auth.password` se resuelve cuando la autenticación por contraseña puede prevalecer (`gateway.auth.mode="password"` explícito o modo inferido sin ningún token prevaleciente de auth/env).
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidas SecretRefs) y `gateway.auth.mode` no está definido, la resolución del código de configuración falla hasta que el modo se defina explícitamente.
- Nota sobre desfase de versión de Gateway: esta ruta de comando requiere un Gateway que admita `secrets.resolve`; los Gateway más antiguos devuelven un error de método desconocido.
- Las apps oficiales de OpenClaw para iOS y Android se conectan automáticamente cuando sus
  metadatos de código de configuración coinciden. Si una solicitud permanece pendiente (por ejemplo, para un
  cliente no oficial o metadatos no coincidentes), revísala y apruébala con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Relacionado

- [Referencia de CLI](/es/cli)
- [Emparejamiento](/es/cli/pairing)
