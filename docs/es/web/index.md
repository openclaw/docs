---
read_when:
    - Quieres acceder al Gateway mediante Tailscale
    - Quieres la interfaz de usuario de Control del navegador y la edición de configuración
summary: 'Gateway superficies web: interfaz de control, modos de enlace y seguridad'
title: Web
x-i18n:
    generated_at: "2026-07-05T11:47:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

The Gateway sirve una pequeña **Control UI del navegador** (Vite + Lit) desde el mismo puerto que el WebSocket del Gateway:

- valor predeterminado: `http://<host>:18789/`
- con `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefijo opcional: define `gateway.controlUi.basePath` (p. ej., `/openclaw`)

Las capacidades están en [Control UI](/es/web/control-ui). Esta página cubre los modos de enlace, la seguridad y otras superficies expuestas a la web.

## Configuración (activada por defecto)

Control UI está **activada por defecto** cuando los recursos están presentes (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Webhooks

Cuando `hooks.enabled=true`, el Gateway también expone un endpoint de Webhook en el mismo servidor HTTP. Consulta `hooks` en la [referencia de configuración del Gateway](/es/gateway/configuration-reference#hooks) para la autenticación y las cargas útiles.

## RPC HTTP de administración

`POST /api/v1/admin/rpc` expone métodos seleccionados del plano de control del Gateway por HTTP. Desactivado por defecto; se registra solo cuando el plugin `admin-http-rpc` está activado. Consulta [RPC HTTP de administración](/es/plugins/admin-http-rpc) para ver el modelo de autenticación, los métodos permitidos y la comparación con la API WebSocket.

## Acceso con Tailscale

<Tabs>
  <Tab title="Integrated Serve (recommended)">
    Mantén el Gateway en loopback y deja que Tailscale Serve actúe como proxy:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Inicia el gateway:

    ```bash
    openclaw gateway
    ```

    Abre `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado).

  </Tab>
  <Tab title="Tailnet bind + token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Inicia el gateway (este ejemplo no loopback usa autenticación con token de secreto compartido):

    ```bash
    openclaw gateway
    ```

    Abre `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado).

  </Tab>
  <Tab title="Public internet (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` requiere `gateway.auth.mode: "password"`; Serve y Funnel requieren `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Notas de seguridad

- La autenticación del Gateway es obligatoria por defecto: token, contraseña, proxy de confianza o encabezados de identidad de Tailscale Serve cuando estén activados.
- Los enlaces no loopback siguen **requiriendo** autenticación del gateway: autenticación por token/contraseña o un proxy inverso con identidad con `gateway.auth.mode: "trusted-proxy"`.
- El asistente de incorporación crea autenticación de secreto compartido por defecto y normalmente genera un token de gateway, incluso en loopback.
- En modo de secreto compartido, la UI envía `connect.params.auth.token` o `connect.params.auth.password` durante el handshake de WebSocket.
- Con `gateway.tls.enabled: true`, los ayudantes locales de panel/estado muestran URL `https://` y URL WebSocket `wss://`.
- En modos con identidad (Tailscale Serve, `trusted-proxy`), la comprobación de autenticación de WebSocket se satisface desde los encabezados de la solicitud en lugar de un secreto compartido.
- Para despliegues públicos no loopback de Control UI, define `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Las cargas privadas del mismo origen se aceptan sin esto para loopback, RFC1918/link-local, `.local`, `.ts.net` y hosts CGNAT de Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` activa el fallback de origen por encabezado Host; esto es una degradación de seguridad peligrosa.
- Con Serve, los encabezados de identidad de Tailscale satisfacen la autenticación de Control UI/WebSocket cuando `gateway.auth.allowTailscale: true` (no se requiere token/contraseña). Los endpoints de la API HTTP no usan encabezados de identidad de Tailscale; siempre siguen el modo de autenticación HTTP normal del gateway. Define `gateway.auth.allowTailscale: false` para requerir credenciales explícitas incluso mediante Serve. Este flujo sin token asume que el propio host del gateway es de confianza. Consulta [Tailscale](/es/gateway/tailscale) y [Seguridad](/es/gateway/security).

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`:

```bash
pnpm ui:build
```
