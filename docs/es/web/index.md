---
read_when:
    - Quiere acceder al Gateway por Tailscale
    - Quiere la UI de Control en el navegador y la edición de configuración
summary: 'Superficies web del Gateway: UI de Control, modos de vinculación y seguridad'
title: Web
x-i18n:
    generated_at: "2026-04-23T14:09:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

El Gateway sirve una pequeña **UI de Control en el navegador** (Vite + Lit) desde el mismo puerto que el WebSocket del Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: configure `gateway.controlUi.basePath` (por ejemplo `/openclaw`)

Las capacidades están en [UI de Control](/es/web/control-ui).
Esta página se centra en modos de vinculación, seguridad y superficies orientadas a web.

## Webhooks

Cuando `hooks.enabled=true`, el Gateway también expone un pequeño endpoint de Webhook en el mismo servidor HTTP.
Consulte [Configuración del Gateway](/es/gateway/configuration) → `hooks` para ver autenticación + cargas útiles.

## Configuración (activada por defecto)

La UI de Control está **habilitada por defecto** cuando los assets están presentes (`dist/control-ui`).
Puede controlarla mediante configuración:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcional
  },
}
```

## Acceso con Tailscale

### Serve integrado (recomendado)

Mantenga el Gateway en loopback y deje que Tailscale Serve lo proxyee:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Luego inicie el gateway:

```bash
openclaw gateway
```

Abra:

- `https://<magicdns>/` (o su `gateway.controlUi.basePath` configurado)

### Vinculación a tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Luego inicie el gateway (este ejemplo no loopback usa autenticación
con token de secreto compartido):

```bash
openclaw gateway
```

Abra:

- `http://<tailscale-ip>:18789/` (o su `gateway.controlUi.basePath` configurado)

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

- La autenticación del Gateway es obligatoria de forma predeterminada (token, contraseña, trusted-proxy o cabeceras de identidad de Tailscale Serve cuando están habilitadas).
- Las vinculaciones no loopback siguen **requiriendo** autenticación del gateway. En la práctica eso significa autenticación por token/contraseña o un proxy inverso con conocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- El asistente crea autenticación de secreto compartido de forma predeterminada y normalmente genera un
  token de gateway (incluso en loopback).
- En modo de secreto compartido, la UI envía `connect.params.auth.token` o
  `connect.params.auth.password`.
- En modos con identidad, como Tailscale Serve o `trusted-proxy`, la
  comprobación de autenticación del WebSocket se satisface a partir de las cabeceras de la solicitud.
- Para despliegues no loopback de la UI de Control, configure `gateway.controlUi.allowedOrigins`
  explícitamente (orígenes completos). Sin eso, el inicio del gateway se rechaza de forma predeterminada.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  el modo de respaldo de origen basado en cabecera Host, pero es una degradación de seguridad peligrosa.
- Con Serve, las cabeceras de identidad de Tailscale pueden satisfacer la autenticación de la UI de Control/WebSocket
  cuando `gateway.auth.allowTailscale` es `true` (no se requiere token/contraseña).
  Los endpoints de la API HTTP no usan esas cabeceras de identidad de Tailscale; siguen
  en su lugar el modo normal de autenticación HTTP del gateway. Configure
  `gateway.auth.allowTailscale: false` para exigir credenciales explícitas. Consulte
  [Tailscale](/es/gateway/tailscale) y [Security](/es/gateway/security). Este
  flujo sin token asume que el host del gateway es de confianza.
- `gateway.tailscale.mode: "funnel"` requiere `gateway.auth.mode: "password"` (contraseña compartida).

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílelos con:

```bash
pnpm ui:build
```
