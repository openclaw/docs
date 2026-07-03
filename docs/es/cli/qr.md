---
read_when:
    - Quieres emparejar rápidamente una aplicación de nodo móvil con un Gateway
    - Necesitas la salida de setup-code para compartirla de forma remota/manual
summary: Referencia de CLI para `openclaw qr` (generar QR de emparejamiento móvil + código de configuración)
title: QR
x-i18n:
    generated_at: "2026-07-03T13:16:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
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
- `--url <url>`: sobrescribe la URL del Gateway usada en la carga útil
- `--public-url <url>`: sobrescribe la URL pública usada en la carga útil
- `--token <token>`: sobrescribe contra qué token del Gateway se autentica el flujo de arranque
- `--password <password>`: sobrescribe contra qué contraseña del Gateway se autentica el flujo de arranque
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite la representación ASCII del QR
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notas

- `--token` y `--password` son mutuamente excluyentes.
- El código de configuración ahora lleva un `bootstrapToken` opaco y de corta duración, no el token/contraseña compartidos del Gateway.
- El arranque integrado mediante código de configuración devuelve un token primario `node` con `scopes: []` más un token delimitado de traspaso de `operator` para incorporación móvil de confianza.
- El token de operador traspasado está limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`; los ámbitos de mutación de emparejamiento y `operator.admin` todavía requieren un emparejamiento de operador aprobado o un flujo de token aparte.
- El emparejamiento móvil falla de forma cerrada para URL de Gateway `ws://` de Tailscale/públicas. Las direcciones LAN privadas y hosts Bonjour `.local` siguen siendo compatibles mediante `ws://`, pero las rutas móviles de Tailscale/públicas deberían usar Tailscale Serve/Funnel o una URL de Gateway `wss://`.
- Con `--remote`, OpenClaw requiere `gateway.remote.url` o
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, si las credenciales remotas efectivamente activas están configuradas como SecretRefs y no pasas `--token` ni `--password`, el comando las resuelve a partir de la instantánea activa del Gateway. Si el Gateway no está disponible, el comando falla rápido.
- Sin `--remote`, las SecretRefs de autenticación del Gateway local se resuelven cuando no se pasa ninguna sobrescritura de autenticación por CLI:
  - `gateway.auth.token` se resuelve cuando la autenticación por token puede ganar (`gateway.auth.mode="token"` explícito o modo inferido en el que no gana ninguna fuente de contraseña).
  - `gateway.auth.password` se resuelve cuando la autenticación por contraseña puede ganar (`gateway.auth.mode="password"` explícito o modo inferido sin un token ganador de auth/env).
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidas SecretRefs) y `gateway.auth.mode` no está definido, la resolución del código de configuración falla hasta que el modo se defina explícitamente.
- Nota sobre desfase de versión del Gateway: esta ruta de comando requiere un Gateway que admita `secrets.resolve`; los Gateway antiguos devuelven un error de método desconocido.
- Después de escanear, aprueba el emparejamiento del dispositivo con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Relacionado

- [Referencia de CLI](/es/cli)
- [Emparejamiento](/es/cli/pairing)
