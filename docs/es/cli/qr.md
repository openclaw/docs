---
read_when:
    - Quieres emparejar rápidamente una aplicación de nodo móvil con un gateway
    - Necesitas la salida de setup-code para compartirla de forma remota/manual
summary: Referencia de CLI para `openclaw qr` (generar QR de emparejamiento móvil + código de configuración)
title: QR
x-i18n:
    generated_at: "2026-06-27T11:04:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
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

- `--remote`: prefiere `gateway.remote.url`; si no está definido, `gateway.tailscale.mode=serve|funnel` todavía puede proporcionar la URL pública remota
- `--url <url>`: sobrescribe la URL de Gateway usada en la carga útil
- `--public-url <url>`: sobrescribe la URL pública usada en la carga útil
- `--token <token>`: sobrescribe contra qué token de Gateway se autentica el flujo de arranque
- `--password <password>`: sobrescribe contra qué contraseña de Gateway se autentica el flujo de arranque
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite la representación del QR en ASCII
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notas

- `--token` y `--password` son mutuamente excluyentes.
- El código de configuración en sí ahora contiene un `bootstrapToken` opaco y de corta duración, no el token/contraseña compartido de Gateway.
- El arranque integrado con código de configuración devuelve un token principal `node` con `scopes: []` más un token de traspaso `operator` acotado para la incorporación móvil de confianza.
- El token de operador transferido está limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`; `operator.admin` y `operator.pairing` requieren un emparejamiento de operador aprobado por separado o un flujo de token.
- El emparejamiento móvil falla de forma cerrada para URL de Gateway `ws://` públicas o de Tailscale. Las direcciones LAN privadas y los hosts Bonjour `.local` siguen siendo compatibles mediante `ws://`, pero las rutas móviles públicas o de Tailscale deberían usar Tailscale Serve/Funnel o una URL de Gateway `wss://`.
- Con `--remote`, OpenClaw requiere `gateway.remote.url` o
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, si las credenciales remotas efectivamente activas están configuradas como SecretRefs y no pasas `--token` ni `--password`, el comando las resuelve desde la instantánea activa de Gateway. Si Gateway no está disponible, el comando falla rápidamente.
- Sin `--remote`, las SecretRefs de autenticación del Gateway local se resuelven cuando no se pasa ninguna sobrescritura de autenticación de CLI:
  - `gateway.auth.token` se resuelve cuando la autenticación por token puede ganar (`gateway.auth.mode="token"` explícito o modo inferido donde no gana ninguna fuente de contraseña).
  - `gateway.auth.password` se resuelve cuando la autenticación por contraseña puede ganar (`gateway.auth.mode="password"` explícito o modo inferido sin ningún token ganador desde auth/env).
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidas SecretRefs) y `gateway.auth.mode` no está definido, la resolución del código de configuración falla hasta que el modo se defina explícitamente.
- Nota sobre desajuste de versiones de Gateway: esta ruta de comando requiere un Gateway compatible con `secrets.resolve`; los Gateways más antiguos devuelven un error de método desconocido.
- Después de escanear, aprueba el emparejamiento del dispositivo con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Relacionado

- [Referencia de CLI](/es/cli)
- [Emparejamiento](/es/cli/pairing)
