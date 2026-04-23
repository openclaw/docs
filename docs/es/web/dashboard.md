---
read_when:
    - Cambiar la autenticación o los modos de exposición del panel
summary: Acceso y autenticación del panel del Gateway (Control UI)
title: Panel
x-i18n:
    generated_at: "2026-04-23T14:09:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# Panel (Control UI)

El panel del Gateway es la Control UI basada en navegador que se sirve en `/` de forma predeterminada
(se sobrescribe con `gateway.controlUi.basePath`).

Apertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Referencias clave:

- [Control UI](/es/web/control-ui) para uso y capacidades de la UI.
- [Tailscale](/es/gateway/tailscale) para automatización de Serve/Funnel.
- [Superficies web](/es/web) para modos de enlace y notas de seguridad.

La autenticación se aplica en el handshake de WebSocket mediante la ruta de autenticación
configurada del Gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- Encabezados de identidad de proxy confiable cuando `gateway.auth.mode: "trusted-proxy"`

Consulta `gateway.auth` en [Configuración del Gateway](/es/gateway/configuration).

Nota de seguridad: la Control UI es una **superficie de administración** (chat, configuración, aprobaciones de exec).
No la expongas públicamente. La UI mantiene los tokens de URL del panel en sessionStorage
para la sesión actual de la pestaña del navegador y la URL del Gateway seleccionada, y los elimina de la URL después de la carga.
Prefiere localhost, Tailscale Serve o un túnel SSH.

## Ruta rápida (recomendada)

- Después del onboarding, la CLI abre automáticamente el panel e imprime un enlace limpio (sin token).
- Vuelve a abrirlo en cualquier momento con: `openclaw dashboard` (copia el enlace, abre el navegador si es posible y muestra una pista de SSH si no hay interfaz).
- Si la UI solicita autenticación con secreto compartido, pega el token o la
  contraseña configurados en la configuración de Control UI.

## Conceptos básicos de autenticación (local frente a remoto)

- **Localhost**: abre `http://127.0.0.1:18789/`.
- **Fuente de token de secreto compartido**: `gateway.auth.token` (o
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` puede pasarlo mediante un fragmento de URL
  para un arranque inicial de una sola vez, y la Control UI lo mantiene en sessionStorage para la
  sesión actual de la pestaña del navegador y la URL del Gateway seleccionada en lugar de en localStorage.
- Si `gateway.auth.token` está administrado por SecretRef, `openclaw dashboard`
  imprime/copia/abre una URL sin token por diseño. Esto evita exponer
  tokens administrados externamente en registros del shell, historial del portapapeles o argumentos
  de lanzamiento del navegador.
- Si `gateway.auth.token` está configurado como SecretRef y no se resuelve en tu
  shell actual, `openclaw dashboard` sigue imprimiendo una URL sin token junto con
  una guía práctica de configuración de autenticación.
- **Contraseña de secreto compartido**: usa la `gateway.auth.password` configurada (o
  `OPENCLAW_GATEWAY_PASSWORD`). El panel no conserva contraseñas entre
  recargas.
- **Modos con identidad**: Tailscale Serve puede satisfacer la autenticación de Control UI/WebSocket
  mediante encabezados de identidad cuando `gateway.auth.allowTailscale: true`, y un
  proxy inverso no loopback con reconocimiento de identidad puede satisfacer
  `gateway.auth.mode: "trusted-proxy"`. En esos modos, el panel no
  necesita un secreto compartido pegado para el WebSocket.
- **No localhost**: usa Tailscale Serve, un enlace no loopback con secreto compartido, un
  proxy inverso no loopback con reconocimiento de identidad y
  `gateway.auth.mode: "trusted-proxy"`, o un túnel SSH. Las API HTTP siguen usando
  autenticación con secreto compartido a menos que ejecutes intencionalmente una entrada privada con
  `gateway.auth.mode: "none"` o autenticación HTTP de proxy confiable. Consulta
  [Superficies web](/es/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si ves "unauthorized" / 1008

- Asegúrate de que el Gateway sea accesible (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, los clientes pueden hacer un reintento confiable con un token de dispositivo en caché cuando el Gateway devuelve sugerencias de reintento. Ese reintento con token en caché reutiliza los ámbitos aprobados en caché del token; los llamadores con `deviceToken` explícito o `scopes` explícitos conservan su conjunto de ámbitos solicitado. Si la autenticación sigue fallando después de ese reintento, resuelve manualmente la deriva del token.
- Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es: token/contraseña compartidos explícitos primero, luego `deviceToken` explícito, luego token de dispositivo almacenado y después token de arranque.
- En la ruta asíncrona de Control UI de Tailscale Serve, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador de autenticación fallida los registre, por lo que
  el segundo reintento incorrecto concurrente ya puede mostrar `retry later`.
- Para los pasos de reparación de deriva de tokens, sigue la [Lista de verificación de recuperación de deriva de tokens](/es/cli/devices#token-drift-recovery-checklist).
- Recupera o proporciona el secreto compartido desde el host del Gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Contraseña: resuelve `gateway.auth.password` configurado o
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token administrado por SecretRef: resuelve el proveedor de secretos externo o exporta
    `OPENCLAW_GATEWAY_TOKEN` en este shell y luego vuelve a ejecutar `openclaw dashboard`
  - No hay secreto compartido configurado: `openclaw doctor --generate-gateway-token`
- En la configuración del panel, pega el token o la contraseña en el campo de autenticación
  y luego conecta.
- El selector de idioma de la UI está en **Overview -> Gateway Access -> Language**.
  Forma parte de la tarjeta de acceso, no de la sección Appearance.
