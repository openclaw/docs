---
read_when:
    - Quieres emparejar rápidamente una app móvil Node con un Gateway
    - Necesitas la salida del código de configuración para compartirla de forma remota/manual
summary: Referencia de la CLI para `openclaw qr` (generar QR de emparejamiento móvil + código de configuración)
title: QR
x-i18n:
    generated_at: "2026-04-24T05:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Genera un QR de emparejamiento móvil y un código de configuración a partir de la configuración actual de tu Gateway.

## Uso

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opciones

- `--remote`: prefiere `gateway.remote.url`; si no está configurado, `gateway.tailscale.mode=serve|funnel` aún puede proporcionar la URL pública remota
- `--url <url>`: sobrescribe la URL del Gateway usada en la carga
- `--public-url <url>`: sobrescribe la URL pública usada en la carga
- `--token <token>`: sobrescribe contra qué token del Gateway se autentica el flujo bootstrap
- `--password <password>`: sobrescribe contra qué contraseña del Gateway se autentica el flujo bootstrap
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite el renderizado ASCII del QR
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notas

- `--token` y `--password` son mutuamente excluyentes.
- El propio código de configuración ahora transporta un `bootstrapToken` opaco y de corta duración, no el token/contraseña compartido del Gateway.
- En el flujo bootstrap integrado de node/operator, el token principal del Node sigue llegando con `scopes: []`.
- Si la entrega bootstrap también emite un token de operador, este permanece limitado a la lista de permitidos bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Las comprobaciones de alcance bootstrap usan prefijo de rol. Esa lista de permitidos de operador solo satisface solicitudes de operador; los roles que no son de operador siguen necesitando alcances bajo su propio prefijo de rol.
- El emparejamiento móvil falla en modo cerrado para URL de Gateway `ws://` de Tailscale/públicas. `ws://` en LAN privada sigue siendo compatible, pero las rutas móviles Tailscale/públicas deben usar Tailscale Serve/Funnel o una URL de Gateway `wss://`.
- Con `--remote`, OpenClaw requiere `gateway.remote.url` o
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, si las credenciales remotas efectivamente activas están configuradas como SecretRefs y no pasas `--token` ni `--password`, el comando las resuelve a partir de la instantánea activa del Gateway. Si el Gateway no está disponible, el comando falla de inmediato.
- Sin `--remote`, los SecretRefs de autenticación del Gateway local se resuelven cuando no se pasa una sobrescritura de autenticación por CLI:
  - `gateway.auth.token` se resuelve cuando la autenticación por token puede imponerse (explícitamente `gateway.auth.mode="token"` o modo inferido donde no gana ninguna fuente de contraseña).
  - `gateway.auth.password` se resuelve cuando la autenticación por contraseña puede imponerse (explícitamente `gateway.auth.mode="password"` o modo inferido sin un token ganador de auth/env).
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidos SecretRefs) y `gateway.auth.mode` no está definido, la resolución del código de configuración falla hasta que el modo se establezca explícitamente.
- Nota sobre desfase de versión del Gateway: esta ruta de comando requiere un Gateway que admita `secrets.resolve`; los Gateways antiguos devuelven un error de método desconocido.
- Después de escanear, aprueba el emparejamiento del dispositivo con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Relacionado

- [Referencia de CLI](/es/cli)
- [Emparejamiento](/es/cli/pairing)
