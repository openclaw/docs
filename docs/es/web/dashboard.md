---
read_when:
    - Cambiar la autenticación del panel de control o los modos de exposición
summary: Acceso y autenticación del panel de Gateway (IU de control)
title: Panel de control
x-i18n:
    generated_at: "2026-05-05T01:50:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

El panel del Gateway es la UI de control en el navegador servida en `/` de forma predeterminada
(se puede sobrescribir con `gateway.controlUi.basePath`).

Apertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))
- Con `gateway.tls.enabled: true`, usa `https://127.0.0.1:18789/` y
  `wss://127.0.0.1:18789` para el endpoint WebSocket.

Referencias clave:

- [UI de control](/es/web/control-ui) para el uso y las capacidades de la UI.
- [Tailscale](/es/gateway/tailscale) para la automatización de Serve/Funnel.
- [Superficies web](/es/web) para los modos de enlace y las notas de seguridad.

La autenticación se aplica en el handshake WebSocket mediante la ruta de autenticación
del gateway configurada:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

Consulta `gateway.auth` en [configuración del Gateway](/es/gateway/configuration).

Nota de seguridad: la UI de control es una **superficie de administración** (chat, configuración, aprobaciones de exec).
No la expongas públicamente. La UI conserva los tokens de URL del panel en sessionStorage
para la sesión actual de la pestaña del navegador y la URL del gateway seleccionada, y los elimina de la URL después de cargar.
Prefiere localhost, Tailscale Serve o un túnel SSH.

## Ruta rápida (recomendada)

- Después del onboarding, la CLI abre automáticamente el panel e imprime un enlace limpio (sin token).
- Vuelve a abrirlo en cualquier momento: `openclaw dashboard` (copia el enlace, abre el navegador si es posible, muestra una sugerencia de SSH si no hay interfaz gráfica).
- Si fallan el portapapeles y la entrega al navegador, `openclaw dashboard` igualmente imprime la
  URL limpia y te indica que uses el token de `OPENCLAW_GATEWAY_TOKEN` o
  `gateway.auth.token` como clave de fragmento de URL `token`; no imprime valores de token
  en los registros.
- Si la UI solicita autenticación con secreto compartido, pega el token o la
  contraseña configurados en la configuración de la UI de control.

## Conceptos básicos de autenticación (local vs. remoto)

- **Localhost**: abre `http://127.0.0.1:18789/`.
- **TLS del Gateway**: cuando `gateway.tls.enabled: true`, los enlaces de panel/estado usan
  `https://` y los enlaces WebSocket de la UI de control usan `wss://`.
- **Origen del token de secreto compartido**: `gateway.auth.token` (o
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` puede pasarlo mediante fragmento de URL
  para el arranque inicial de una sola vez, y la UI de control lo conserva en sessionStorage para la
  sesión actual de la pestaña del navegador y la URL del gateway seleccionada en lugar de localStorage.
- Si `gateway.auth.token` está gestionado por SecretRef, `openclaw dashboard`
  imprime/copia/abre una URL sin token por diseño. Esto evita exponer
  tokens gestionados externamente en registros de shell, historial del portapapeles o argumentos
  de lanzamiento del navegador.
- Si `gateway.auth.token` está configurado como SecretRef y no se resuelve en tu
  shell actual, `openclaw dashboard` igualmente imprime una URL sin token más
  orientación práctica para configurar la autenticación.
- **Contraseña de secreto compartido**: usa la `gateway.auth.password` configurada (o
  `OPENCLAW_GATEWAY_PASSWORD`). El panel no conserva contraseñas entre
  recargas.
- **Modos con identidad**: Tailscale Serve puede satisfacer la autenticación de la UI de control/WebSocket
  mediante encabezados de identidad cuando `gateway.auth.allowTailscale: true`, y un
  proxy inverso con reconocimiento de identidad que no sea loopback puede satisfacer
  `gateway.auth.mode: "trusted-proxy"`. En esos modos el panel no
  necesita un secreto compartido pegado para el WebSocket.
- **No localhost**: usa Tailscale Serve, un enlace de secreto compartido que no sea loopback, un
  proxy inverso con reconocimiento de identidad que no sea loopback con
  `gateway.auth.mode: "trusted-proxy"`, o un túnel SSH. Las API HTTP siguen usando
  autenticación con secreto compartido a menos que ejecutes intencionalmente
  `gateway.auth.mode: "none"` para ingreso privado o autenticación HTTP trusted-proxy. Consulta
  [Superficies web](/es/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si ves "unauthorized" / 1008

- Asegúrate de que el gateway sea accesible (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, los clientes pueden hacer un reintento de confianza con un token de dispositivo en caché cuando el gateway devuelve sugerencias de reintento. Ese reintento con token en caché reutiliza los ámbitos aprobados en caché del token; los llamadores con `deviceToken` explícito / `scopes` explícitos conservan su conjunto de ámbitos solicitado. Si la autenticación sigue fallando después de ese reintento, resuelve manualmente la divergencia del token.
- Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque.
- En la ruta asíncrona de la UI de control de Tailscale Serve, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador de autenticación fallida los registre, por lo que
  el segundo reintento incorrecto concurrente ya puede mostrar `retry later`.
- Para los pasos de reparación de divergencia de token, sigue la [lista de verificación de recuperación de divergencia de token](/es/cli/devices#token-drift-recovery-checklist).
- Recupera o suministra el secreto compartido desde el host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Contraseña: resuelve la `gateway.auth.password` configurada o
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gestionado por SecretRef: resuelve el proveedor de secretos externo o exporta
    `OPENCLAW_GATEWAY_TOKEN` en este shell, y luego vuelve a ejecutar `openclaw dashboard`
  - Sin secreto compartido configurado: `openclaw doctor --generate-gateway-token`
- En la configuración del panel, pega el token o la contraseña en el campo de autenticación,
  y luego conecta.
- El selector de idioma de la UI está en **Overview -> Gateway Access -> Language**.
  Forma parte de la tarjeta de acceso, no de la sección Appearance.

## Relacionado

- [UI de control](/es/web/control-ui)
- [WebChat](/es/web/webchat)
