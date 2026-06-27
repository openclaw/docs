---
read_when:
    - Cambiar la autenticación del panel de control o los modos de exposición
summary: Acceso y autenticación del panel de Gateway (interfaz de control)
title: Panel de control
x-i18n:
    generated_at: "2026-05-11T20:59:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

El panel del Gateway es la interfaz de control del navegador servida en `/` de forma predeterminada
(se puede sobrescribir con `gateway.controlUi.basePath`).

Apertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))
- Con `gateway.tls.enabled: true`, usa `https://127.0.0.1:18789/` y
  `wss://127.0.0.1:18789` para el endpoint de WebSocket.

Referencias clave:

- [Interfaz de control](/es/web/control-ui) para uso y capacidades de la interfaz de usuario.
- [Tailscale](/es/gateway/tailscale) para la automatización de Serve/Funnel.
- [Superficies web](/es/web) para modos de enlace y notas de seguridad.

La autenticación se aplica en el handshake de WebSocket mediante la ruta de autenticación
del gateway configurada:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

Consulta `gateway.auth` en [Configuración del Gateway](/es/gateway/configuration).

Nota de seguridad: la interfaz de control es una **superficie de administración** (chat, configuración, aprobaciones de ejecución).
No la expongas públicamente. La interfaz mantiene los tokens de URL del panel en sessionStorage
para la sesión actual de la pestaña del navegador y la URL de gateway seleccionada, y los elimina de la URL después de cargar.
Prefiere localhost, Tailscale Serve o un túnel SSH.

## Ruta rápida (recomendada)

- Después de la incorporación, la CLI abre automáticamente el panel e imprime un enlace limpio (sin token).
- Reabrir en cualquier momento: `openclaw dashboard` (copia el enlace, abre el navegador si es posible, muestra una sugerencia de SSH si no hay interfaz gráfica).
- Si la entrega mediante portapapeles y navegador falla, `openclaw dashboard` todavía imprime la
  URL limpia y te indica que uses el token de `OPENCLAW_GATEWAY_TOKEN` o
  `gateway.auth.token` como la clave de fragmento de URL `token`; no imprime valores de token
  en los registros.
- Si la interfaz solicita autenticación con secreto compartido, pega el token o la
  contraseña configurados en la configuración de la interfaz de control.

## Conceptos básicos de autenticación (local vs remoto)

- **Localhost**: abre `http://127.0.0.1:18789/`.
- **TLS de Gateway**: cuando `gateway.tls.enabled: true`, los enlaces de panel/estado usan
  `https://` y los enlaces de WebSocket de la interfaz de control usan `wss://`.
- **Fuente del token de secreto compartido**: `gateway.auth.token` (o
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` puede pasarlo mediante un fragmento de URL
  para un arranque único, y la interfaz de control lo mantiene en sessionStorage para la
  sesión actual de la pestaña del navegador y la URL de gateway seleccionada, en lugar de localStorage.
- Si `gateway.auth.token` está administrado por SecretRef, `openclaw dashboard`
  imprime/copia/abre una URL sin token por diseño. Esto evita exponer
  tokens administrados externamente en registros de shell, historial del portapapeles o argumentos
  de inicio del navegador.
- Si `gateway.auth.token` está configurado como SecretRef y no está resuelto en tu
  shell actual, `openclaw dashboard` todavía imprime una URL sin token junto con
  orientación accionable para configurar la autenticación.
- **Contraseña de secreto compartido**: usa la `gateway.auth.password` configurada (o
  `OPENCLAW_GATEWAY_PASSWORD`). El panel no conserva contraseñas entre
  recargas.
- **Modos con identidad**: Tailscale Serve puede satisfacer la autenticación de la interfaz de control/WebSocket
  mediante encabezados de identidad cuando `gateway.auth.allowTailscale: true`, y un
  proxy inverso no loopback con reconocimiento de identidad puede satisfacer
  `gateway.auth.mode: "trusted-proxy"`. En esos modos, el panel no
  necesita un secreto compartido pegado para el WebSocket.
- **No localhost**: usa Tailscale Serve, un enlace no loopback con secreto compartido, un
  proxy inverso no loopback con reconocimiento de identidad con
  `gateway.auth.mode: "trusted-proxy"`, o un túnel SSH. Las API HTTP aún usan
  autenticación con secreto compartido, salvo que ejecutes intencionalmente la entrada privada
  `gateway.auth.mode: "none"` o autenticación HTTP con proxy de confianza. Consulta
  [Superficies web](/es/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si ves "unauthorized" / 1008

- Asegúrate de que el gateway sea accesible (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, los clientes pueden hacer un reintento de confianza con un token de dispositivo en caché cuando el gateway devuelve sugerencias de reintento. Ese reintento con token en caché reutiliza los ámbitos aprobados en caché del token; los llamadores con `deviceToken` explícito / `scopes` explícitos conservan su conjunto de ámbitos solicitado. Si la autenticación sigue fallando después de ese reintento, resuelve manualmente la desviación del token.
- Para `AUTH_SCOPE_MISMATCH`, se reconoció el token de dispositivo, pero no incluye los ámbitos solicitados por el panel; vuelve a emparejar o aprueba el contrato de ámbitos solicitado en lugar de rotar el token compartido del Gateway.
- Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque.
- En la ruta asíncrona de la interfaz de control de Tailscale Serve, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador de autenticación fallida los registre, por lo que
  el segundo reintento incorrecto concurrente ya puede mostrar `retry later`.
- Para pasos de reparación de desviación del token, sigue la [lista de comprobación de recuperación de desviación del token](/es/cli/devices#token-drift-recovery-checklist).
- Recupera o proporciona el secreto compartido desde el host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Contraseña: resuelve la `gateway.auth.password` configurada o
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token administrado por SecretRef: resuelve el proveedor de secretos externo o exporta
    `OPENCLAW_GATEWAY_TOKEN` en este shell, y luego vuelve a ejecutar `openclaw dashboard`
  - No hay secreto compartido configurado: `openclaw doctor --generate-gateway-token`
- En la configuración del panel, pega el token o la contraseña en el campo de autenticación,
  y luego conecta.
- El selector de idioma de la interfaz está en **Resumen -> Acceso al Gateway -> Idioma**.
  Forma parte de la tarjeta de acceso, no de la sección Apariencia.

## Relacionado

- [Interfaz de control](/es/web/control-ui)
- [WebChat](/es/web/webchat)
