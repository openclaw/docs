---
read_when:
    - Cambiando los modos de autenticación o exposición del panel
summary: Acceso y autenticación del panel del gateway (Control UI)
title: Panel
x-i18n:
    generated_at: "2026-04-24T05:57:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

El panel del Gateway es la Control UI del navegador servida en `/` por defecto
(anúlalo con `gateway.controlUi.basePath`).

Apertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Referencias clave:

- [Control UI](/es/web/control-ui) para uso y capacidades de la interfaz.
- [Tailscale](/es/gateway/tailscale) para automatización de Serve/Funnel.
- [Superficies web](/es/web) para modos de bind y notas de seguridad.

La autenticación se aplica en el handshake de WebSocket mediante la ruta
de autenticación del gateway configurada:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de trusted-proxy cuando `gateway.auth.mode: "trusted-proxy"`

Consulta `gateway.auth` en [Configuración de Gateway](/es/gateway/configuration).

Nota de seguridad: Control UI es una **superficie de administración** (chat, configuración, aprobaciones de exec).
No la expongas públicamente. La UI mantiene los tokens de URL del panel en sessionStorage
para la sesión actual de la pestaña del navegador y la URL de gateway seleccionada, y los elimina de la URL después de cargar.
Prefiere localhost, Tailscale Serve o un túnel SSH.

## Ruta rápida (recomendada)

- Después de la incorporación, la CLI abre automáticamente el panel e imprime un enlace limpio (sin token).
- Vuelve a abrirlo en cualquier momento: `openclaw dashboard` (copia el enlace, abre el navegador si es posible y muestra una sugerencia SSH si no hay interfaz gráfica).
- Si la UI solicita autenticación por secreto compartido, pega el token o
  la contraseña configurados en los ajustes de Control UI.

## Conceptos básicos de autenticación (local frente a remoto)

- **Localhost**: abre `http://127.0.0.1:18789/`.
- **Origen de token de secreto compartido**: `gateway.auth.token` (o
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` puede pasarlo mediante fragmento de URL
  para arranque único, y Control UI lo mantiene en sessionStorage para la
  sesión actual de la pestaña del navegador y la URL de gateway seleccionada en lugar de localStorage.
- Si `gateway.auth.token` está gestionado por SecretRef, `openclaw dashboard`
  imprime/copia/abre una URL sin token por diseño. Esto evita exponer
  tokens gestionados externamente en registros del shell, historial del portapapeles o argumentos
  de lanzamiento del navegador.
- Si `gateway.auth.token` está configurado como SecretRef y no se resuelve en tu
  shell actual, `openclaw dashboard` sigue imprimiendo una URL sin token además de
  orientación práctica de configuración de autenticación.
- **Contraseña de secreto compartido**: usa la `gateway.auth.password` configurada (o
  `OPENCLAW_GATEWAY_PASSWORD`). El panel no conserva contraseñas entre recargas.
- **Modos con identidad**: Tailscale Serve puede satisfacer la autenticación de Control UI/WebSocket
  mediante encabezados de identidad cuando `gateway.auth.allowTailscale: true`, y un
  proxy inverso no-loopback con reconocimiento de identidad puede satisfacer
  `gateway.auth.mode: "trusted-proxy"`. En esos modos, el panel no necesita
  pegar un secreto compartido para el WebSocket.
- **No localhost**: usa Tailscale Serve, un bind no-loopback con secreto compartido, un
  proxy inverso no-loopback con reconocimiento de identidad y
  `gateway.auth.mode: "trusted-proxy"`, o un túnel SSH. Las API HTTP siguen usando
  autenticación por secreto compartido a menos que ejecutes intencionadamente un ingress privado con
  `gateway.auth.mode: "none"` o autenticación HTTP de trusted-proxy. Consulta
  [Superficies web](/es/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si ves "unauthorized" / 1008

- Asegúrate de que el gateway sea accesible (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, los clientes pueden hacer un reintento confiable con un token de dispositivo en caché cuando el gateway devuelve pistas de reintento. Ese reintento con token en caché reutiliza los alcances aprobados en caché del token; quienes llamen con `deviceToken` explícito / `scopes` explícitos mantienen su conjunto de alcances solicitado. Si la autenticación sigue fallando después de ese reintento, resuelve manualmente el desfase del token.
- Fuera de esa ruta de reintento, la precedencia normal de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, después token de dispositivo almacenado y por último token de arranque.
- En la ruta asíncrona de Tailscale Serve para Control UI, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador de autenticación fallida los registre, de modo
  que el segundo reintento erróneo concurrente ya puede mostrar `retry later`.
- Para los pasos de reparación de desfase de token, sigue la [Lista de comprobación para recuperación de desfase de token](/es/cli/devices#token-drift-recovery-checklist).
- Recupera o proporciona el secreto compartido desde el host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Contraseña: resuelve la `gateway.auth.password` configurada o
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gestionado por SecretRef: resuelve el proveedor de secretos externo o exporta
    `OPENCLAW_GATEWAY_TOKEN` en este shell y luego vuelve a ejecutar `openclaw dashboard`
  - No hay secreto compartido configurado: `openclaw doctor --generate-gateway-token`
- En los ajustes del panel, pega el token o la contraseña en el campo de autenticación
  y luego conecta.
- El selector de idioma de la UI está en **Overview -> Gateway Access -> Language**.
  Forma parte de la tarjeta de acceso, no de la sección Appearance.

## Relacionado

- [Control UI](/es/web/control-ui)
- [WebChat](/es/web/webchat)
