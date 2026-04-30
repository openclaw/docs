---
read_when:
    - Quieres acceder al Gateway a través de Tailscale
    - Quieres la interfaz de control del navegador y la edición de la configuración
summary: 'Superficies web del Gateway: interfaz de control, modos de enlace y seguridad'
title: Web
x-i18n:
    generated_at: "2026-04-30T06:07:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

El Gateway sirve una pequeña **UI de control en navegador** (Vite + Lit) desde el mismo puerto que el WebSocket del Gateway:

- predeterminado: `http://<host>:18789/`
- con `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefijo opcional: configura `gateway.controlUi.basePath` (p. ej., `/openclaw`)

Las capacidades están en [UI de control](/es/web/control-ui). El resto de esta página se centra en los modos de enlace, la seguridad y las superficies expuestas a la web.

## Webhooks

Cuando `hooks.enabled=true`, el Gateway también expone un pequeño endpoint de webhook en el mismo servidor HTTP.
Consulta [Configuración del Gateway](/es/gateway/configuration) → `hooks` para autenticación y cargas útiles.

## Configuración (activada de forma predeterminada)

La UI de control está **activada de forma predeterminada** cuando los recursos están presentes (`dist/control-ui`).
Puedes controlarla mediante configuración:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Acceso con Tailscale

### Serve integrado (recomendado)

Mantén el Gateway en loopback y deja que Tailscale Serve lo proxifique:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Luego inicia el gateway:

```bash
openclaw gateway
```

Abre:

- `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

### Enlace de tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Luego inicia el gateway (este ejemplo no loopback usa autenticación con token de secreto compartido):

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

- La autenticación del Gateway es obligatoria de forma predeterminada (token, contraseña, proxy de confianza o encabezados de identidad de Tailscale Serve cuando están activados).
- Los enlaces que no son loopback siguen **requiriendo** autenticación del gateway. En la práctica, eso significa autenticación con token/contraseña o un proxy inverso consciente de identidad con `gateway.auth.mode: "trusted-proxy"`.
- El asistente crea autenticación con secreto compartido de forma predeterminada y normalmente genera un token de gateway (incluso en loopback).
- En modo de secreto compartido, la UI envía `connect.params.auth.token` o `connect.params.auth.password`.
- Cuando `gateway.tls.enabled: true`, los ayudantes locales de panel y estado renderizan URLs de panel `https://` y URLs de WebSocket `wss://`.
- En modos con identidad, como Tailscale Serve o `trusted-proxy`, la comprobación de autenticación del WebSocket se satisface en su lugar desde los encabezados de la solicitud.
- Para despliegues de la UI de control que no sean loopback, configura `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Sin esto, el arranque del gateway se rechaza de forma predeterminada.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` activa el modo de respaldo de origen basado en el encabezado Host, pero es una degradación de seguridad peligrosa.
- Con Serve, los encabezados de identidad de Tailscale pueden satisfacer la autenticación de la UI de control/WebSocket cuando `gateway.auth.allowTailscale` es `true` (no se requiere token/contraseña). Los endpoints de la API HTTP no usan esos encabezados de identidad de Tailscale; en su lugar siguen el modo normal de autenticación HTTP del gateway. Configura `gateway.auth.allowTailscale: false` para exigir credenciales explícitas. Consulta [Tailscale](/es/gateway/tailscale) y [Seguridad](/es/gateway/security). Este flujo sin token presupone que el host del gateway es de confianza.
- `gateway.tailscale.mode: "funnel"` requiere `gateway.auth.mode: "password"` (contraseña compartida).

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```
