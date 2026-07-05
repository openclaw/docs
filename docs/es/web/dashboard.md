---
read_when:
    - Cambiar la autenticación del panel de control o los modos de exposición
summary: Acceso y autenticación del panel de Gateway (Control UI)
title: Panel de control
x-i18n:
    generated_at: "2026-07-05T11:50:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e60ae8273560295fa2670af8ba3a26eea5b07fe2f8b07813460850785305f0b
    source_path: web/dashboard.md
    workflow: 16
---

El panel del Gateway es la interfaz de Control UI en el navegador servida en `/` de forma predeterminada (sobrescríbelo con `gateway.controlUi.basePath`).

Apertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))
- Con `gateway.tls.enabled: true`, usa `https://127.0.0.1:18789/` y `wss://127.0.0.1:18789` para el endpoint de WebSocket.

Referencias clave:

- [Control UI](/es/web/control-ui) para el uso y las capacidades de la interfaz.
- [Tailscale](/es/gateway/tailscale) para la automatización de Serve/Funnel.
- [Superficies web](/es/web) para modos de enlace y notas de seguridad.

La autenticación se aplica en el handshake de WebSocket mediante la ruta de autenticación del gateway configurada:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

Consulta `gateway.auth` en [configuración del Gateway](/es/gateway/configuration).

<Warning>
La Control UI es una **superficie de administración** (chat, configuración, aprobaciones de exec). No la expongas públicamente. La interfaz conserva los tokens de URL del panel en sessionStorage para la pestaña actual del navegador y la URL del gateway seleccionada, y los elimina de la URL después de cargar. Prefiere localhost, Tailscale Serve o un túnel SSH.
</Warning>

## Ruta rápida (recomendado)

- Después del onboarding, la CLI abre automáticamente el panel e imprime un enlace limpio (sin token).
- Reabrir en cualquier momento: `openclaw dashboard` (copia el enlace, abre un navegador si es posible, imprime una sugerencia de SSH si está en modo headless).
- Si tanto el portapapeles como la apertura del navegador fallan, `openclaw dashboard` aún imprime la URL limpia y te indica que agregues tu token (desde `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.token`) como la clave de fragmento de URL `token`; nunca imprime el valor del token en los registros.
- Si la interfaz solicita autenticación por secreto compartido, pega el token o la contraseña configurados en la configuración de Control UI.

## Conceptos básicos de autenticación (local vs. remoto)

- **Localhost**: abre `http://127.0.0.1:18789/`.
- **TLS del Gateway**: cuando `gateway.tls.enabled: true`, los enlaces de panel/estado usan `https://` y los enlaces WebSocket de Control UI usan `wss://`.
- **Fuente del token de secreto compartido**: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` puede pasarlo mediante fragmento de URL para el arranque de una sola vez; la Control UI lo conserva en sessionStorage para la pestaña actual y la URL del gateway seleccionada, no en localStorage.
- Si `gateway.auth.token` está administrado por SecretRef, `openclaw dashboard` imprime/copia/abre una URL sin token por diseño, para evitar exponer tokens administrados externamente en registros de shell, historial del portapapeles o argumentos de inicio del navegador. Si la referencia no se resuelve en tu shell actual, aún imprime la URL sin token junto con orientación práctica para configurar la autenticación.
- **Contraseña de secreto compartido**: usa la `gateway.auth.password` configurada (o `OPENCLAW_GATEWAY_PASSWORD`). El panel no conserva contraseñas entre recargas.
- **Modos con identidad**: Tailscale Serve satisface la autenticación de Control UI/WebSocket mediante encabezados de identidad cuando `gateway.auth.allowTailscale: true`; un proxy inverso no local loopback con identidad satisface `gateway.auth.mode: "trusted-proxy"`. Ninguno necesita un secreto compartido pegado para el WebSocket.
- **No localhost**: usa Tailscale Serve, un enlace de secreto compartido no local loopback, un proxy inverso no local loopback con identidad y `gateway.auth.mode: "trusted-proxy"`, o un túnel SSH. Las API HTTP siguen usando autenticación por secreto compartido, a menos que ejecutes intencionalmente `gateway.auth.mode: "none"` de ingreso privado o autenticación HTTP de proxy de confianza. Consulta [Superficies web](/es/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si ves "unauthorized" / 1008

- Confirma que se puede acceder al gateway: local `openclaw status`; remoto, túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` y luego abre `http://127.0.0.1:18789/`.
- Para `AUTH_TOKEN_MISMATCH`, los clientes pueden hacer un reintento de confianza con un token de dispositivo en caché cuando el gateway devuelve sugerencias de reintento; ese reintento reutiliza los alcances aprobados en caché del token (los llamadores con `deviceToken`/`scopes` explícitos conservan el conjunto de alcances solicitado). Si la autenticación sigue fallando después de ese reintento, resuelve manualmente la divergencia del token.
- Para `AUTH_SCOPE_MISMATCH`, el token de dispositivo fue reconocido, pero no incluye los alcances solicitados; vuelve a emparejar o aprueba el nuevo conjunto de alcances en lugar de rotar el token compartido del gateway.
- Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es: token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado, luego token de arranque.
- En la ruta asíncrona de Tailscale Serve, los intentos fallidos para el mismo `{scope, ip}` se serializan antes de que el limitador de autenticación fallida los registre, por lo que un segundo reintento incorrecto concurrente ya puede mostrar `retry later`.
- Para ver pasos de reparación de divergencia de tokens, consulta [Lista de verificación de recuperación de divergencia de tokens](/es/cli/devices#token-drift-recovery-checklist).
- Recupera o proporciona el secreto compartido desde el host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Contraseña: resuelve la `gateway.auth.password` configurada o `OPENCLAW_GATEWAY_PASSWORD`
  - Token administrado por SecretRef: resuelve el proveedor de secretos externo, o exporta `OPENCLAW_GATEWAY_TOKEN` en este shell y vuelve a ejecutar `openclaw dashboard`
  - Sin secreto compartido configurado: `openclaw doctor --generate-gateway-token`
- En la configuración del panel, pega el token o la contraseña en el campo de autenticación y luego conecta.
- El selector de idioma de la interfaz está en **Información general -> Acceso al Gateway -> Idioma**, no en Apariencia.

## Relacionado

- [Control UI](/es/web/control-ui)
- [WebChat](/es/web/webchat)
