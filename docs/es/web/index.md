---
read_when:
    - Quieres acceder al Gateway a través de Tailscale
    - Quieres la interfaz de Control del navegador y la edición de configuración
summary: 'Superficies web del Gateway: Control UI, modos de enlace y seguridad'
title: Web
x-i18n:
    generated_at: "2026-06-27T13:16:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway sirve una pequeña **IU de control del navegador** (Vite + Lit) desde el mismo puerto que el WebSocket de Gateway:

- predeterminado: `http://<host>:18789/`
- con `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Las capacidades están en [IU de control](/es/web/control-ui). El resto de esta página se centra en los modos de enlace, la seguridad y las superficies expuestas a la web.

## Webhooks

Cuando `hooks.enabled=true`, Gateway también expone un pequeño endpoint de Webhook en el mismo servidor HTTP.
Consulta [Configuración de Gateway](/es/gateway/configuration) → `hooks` para autenticación + payloads.

## RPC HTTP de administración

RPC HTTP de administración expone métodos seleccionados del plano de control de Gateway en `POST /api/v1/admin/rpc`.
Está desactivado de forma predeterminada y solo se registra cuando el plugin `admin-http-rpc` está habilitado.
Consulta [RPC HTTP de administración](/es/plugins/admin-http-rpc) para el modelo de autenticación, los métodos permitidos y la comparación con WebSocket.

## Configuración (activada de forma predeterminada)

La IU de control está **habilitada de forma predeterminada** cuando los recursos están presentes (`dist/control-ui`).
Puedes controlarla mediante la configuración:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Acceso con Tailscale

### Serve integrado (recomendado)

Mantén Gateway en loopback y deja que Tailscale Serve lo proxifique:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Luego inicia gateway:

```bash
openclaw gateway
```

Abre:

- `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

### Enlace de Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Luego inicia gateway (este ejemplo no loopback usa autenticación con token de secreto compartido):

```bash
openclaw gateway
```

Abre:

- `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

### Internet público (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Notas de seguridad

- La autenticación de Gateway es obligatoria de forma predeterminada (token, contraseña, trusted-proxy o encabezados de identidad de Tailscale Serve cuando están habilitados).
- Los enlaces no loopback aún **requieren** autenticación de gateway. En la práctica, eso significa autenticación con token/contraseña o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- El asistente crea autenticación con secreto compartido de forma predeterminada y normalmente genera un token de gateway (incluso en loopback).
- En modo de secreto compartido, la IU envía `connect.params.auth.token` o `connect.params.auth.password`.
- Cuando `gateway.tls.enabled: true`, el panel local y los ayudantes de estado renderizan URL de panel `https://` y URL de WebSocket `wss://`.
- En modos con identidad, como Tailscale Serve o `trusted-proxy`, la comprobación de autenticación de WebSocket se satisface desde los encabezados de la solicitud.
- Para despliegues públicos no loopback de la IU de control, establece `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas privadas del mismo origen en LAN/Tailnet se aceptan para loopback, RFC1918/link-local, `.local`, `.ts.net` y hosts CGNAT de Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de reserva de origen basado en el encabezado Host, pero es una degradación de seguridad peligrosa.
- Con Serve, los encabezados de identidad de Tailscale pueden satisfacer la autenticación de la IU de control/WebSocket cuando `gateway.auth.allowTailscale` es `true` (no se requiere token/contraseña). Los endpoints de API HTTP no usan esos encabezados de identidad de Tailscale; siguen el modo normal de autenticación HTTP del gateway. Establece `gateway.auth.allowTailscale: false` para requerir credenciales explícitas. Consulta [Tailscale](/es/gateway/tailscale) y [Seguridad](/es/gateway/security). Este flujo sin token asume que el host de gateway es confiable.
- `gateway.tailscale.mode: "funnel"` requiere `gateway.auth.mode: "password"` (contraseña compartida).

## Compilar la IU

Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```
