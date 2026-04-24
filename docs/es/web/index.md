---
read_when:
    - Quieres acceder al Gateway mediante Tailscale
    - Quieres la UI de Control del navegador y la edición de configuración
summary: 'Superficies web de Gateway: UI de Control, modos de bind y seguridad'
title: Web
x-i18n:
    generated_at: "2026-04-24T05:57:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Gateway sirve una pequeña **UI de Control del navegador** (Vite + Lit) desde el mismo puerto que el WebSocket de Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo `/openclaw`)

Las capacidades se describen en [UI de Control](/es/web/control-ui).
Esta página se centra en los modos de bind, la seguridad y las superficies orientadas a web.

## Webhooks

Cuando `hooks.enabled=true`, Gateway también expone un pequeño endpoint de Webhook en el mismo servidor HTTP.
Consulta [Configuración de Gateway](/es/gateway/configuration) → `hooks` para autenticación + cargas útiles.

## Configuración (activada por defecto)

La UI de Control está **habilitada por defecto** cuando los activos están presentes (`dist/control-ui`).
Puedes controlarla mediante configuración:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcional
  },
}
```

## Acceso con Tailscale

### Serve integrado (recomendado)

Mantén Gateway en loopback y deja que Tailscale Serve actúe como proxy:

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

### Bind a tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Luego inicia el gateway (este ejemplo sin loopback usa autenticación
con token de secreto compartido):

```bash
openclaw gateway
```

Abre:

- `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

### Internet pública (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // o OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Notas de seguridad

- La autenticación de Gateway es obligatoria por defecto (token, contraseña, trusted-proxy o cabeceras de identidad de Tailscale Serve cuando están habilitadas).
- Los binds sin loopback siguen **requiriendo** autenticación de gateway. En la práctica eso significa autenticación por token/contraseña o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- El asistente crea autenticación de secreto compartido por defecto y normalmente genera un
  token de gateway (incluso en loopback).
- En modo de secreto compartido, la UI envía `connect.params.auth.token` o
  `connect.params.auth.password`.
- En modos con identidad como Tailscale Serve o `trusted-proxy`, la
  comprobación de autenticación del WebSocket se satisface en su lugar a partir de las cabeceras de la solicitud.
- Para despliegues de UI de Control sin loopback, establece `gateway.controlUi.allowedOrigins`
  explícitamente (orígenes completos). Sin eso, el inicio del gateway se rechaza por defecto.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  el modo de respaldo de origen mediante cabecera Host, pero es una degradación de seguridad peligrosa.
- Con Serve, las cabeceras de identidad de Tailscale pueden satisfacer la autenticación de la UI de Control/WebSocket
  cuando `gateway.auth.allowTailscale` es `true` (no se requiere token/contraseña).
  Los endpoints de la API HTTP no usan esas cabeceras de identidad de Tailscale; siguen
  en su lugar el modo normal de autenticación HTTP del gateway. Establece
  `gateway.auth.allowTailscale: false` para requerir credenciales explícitas. Consulta
  [Tailscale](/es/gateway/tailscale) y [Seguridad](/es/gateway/security). Este
  flujo sin token asume que el host del gateway es de confianza.
- `gateway.tailscale.mode: "funnel"` requiere `gateway.auth.mode: "password"` (contraseña compartida).

## Compilar la UI

Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```
