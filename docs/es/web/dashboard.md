---
read_when:
    - Cambio de los modos de autenticación o exposición del panel de control
summary: Acceso y autenticación del panel del Gateway (interfaz de control)
title: Panel de control
x-i18n:
    generated_at: "2026-07-12T14:56:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

El panel del Gateway es la interfaz de control para navegador que se sirve en `/` de forma predeterminada (se puede cambiar con `gateway.controlUi.basePath`).

Apertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))
- Con `gateway.tls.enabled: true`, use `https://127.0.0.1:18789/` y `wss://127.0.0.1:18789` para el endpoint de WebSocket.

Referencias clave:

- [Interfaz de control](/es/web/control-ui) para consultar el uso y las capacidades de la interfaz.
- [Tailscale](/es/gateway/tailscale) para la automatización de Serve/Funnel.
- [Superficies web](/es/web) para consultar los modos de enlace y las notas de seguridad.

La autenticación se aplica durante el protocolo de enlace de WebSocket mediante la ruta de autenticación configurada del Gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- Encabezados de identidad del proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

Consulte `gateway.auth` en [Configuración del Gateway](/es/gateway/configuration).

<Warning>
La interfaz de control es una **superficie de administración** (chat, configuración y aprobaciones de ejecución). No la exponga públicamente. La interfaz conserva los tokens de la URL del panel en sessionStorage para la pestaña actual del navegador y la URL del Gateway seleccionada, y los elimina de la URL después de cargarla. Se recomienda usar localhost, Tailscale Serve o un túnel SSH.
</Warning>

## Vía rápida (recomendada)

- Después de la incorporación, la CLI abre automáticamente el panel e imprime un enlace limpio (sin token).
- Para volver a abrirlo en cualquier momento: `openclaw dashboard` (copia el enlace, abre un navegador si es posible e imprime una sugerencia sobre SSH si no hay entorno gráfico).
- Si fallan tanto la entrega al portapapeles como la apertura del navegador, `openclaw dashboard` sigue imprimiendo la URL limpia e indica que se añada el token (de `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.token`) como la clave `token` del fragmento de la URL; nunca imprime el valor del token en los registros.
- Si la interfaz solicita autenticación mediante secreto compartido, pegue el token o la contraseña configurados en los ajustes de la interfaz de control.

## Conceptos básicos de autenticación (local frente a remoto)

- **Localhost**: abra `http://127.0.0.1:18789/`.
- **TLS del Gateway**: cuando `gateway.tls.enabled: true`, los enlaces del panel y de estado usan `https://`, y los enlaces WebSocket de la interfaz de control usan `wss://`.
- **Origen del token de secreto compartido**: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` puede pasarlo mediante el fragmento de la URL para la inicialización única; la interfaz de control lo conserva en sessionStorage para la pestaña actual y la URL del Gateway seleccionada, no en localStorage.
- Si `gateway.auth.token` está administrado mediante SecretRef, `openclaw dashboard` imprime, copia y abre deliberadamente una URL sin token para evitar exponer tokens administrados externamente en los registros del shell, el historial del portapapeles o los argumentos de apertura del navegador. Si la referencia no se puede resolver en el shell actual, aún imprime la URL sin token junto con instrucciones prácticas para configurar la autenticación.
- **Contraseña de secreto compartido**: use el valor configurado de `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`). El panel no conserva las contraseñas entre recargas.
- **Modos con identidad**: Tailscale Serve satisface la autenticación de la interfaz de control/WebSocket mediante encabezados de identidad cuando `gateway.auth.allowTailscale: true`; un proxy inverso con reconocimiento de identidad que no sea de bucle invertido satisface `gateway.auth.mode: "trusted-proxy"`. Ninguno de ellos requiere pegar un secreto compartido para WebSocket.
- **Fuera de localhost**: use Tailscale Serve, un enlace que no sea de bucle invertido con secreto compartido, un proxy inverso con reconocimiento de identidad que no sea de bucle invertido con `gateway.auth.mode: "trusted-proxy"` o un túnel SSH. Las API HTTP siguen usando autenticación mediante secreto compartido, salvo que se ejecute intencionadamente `gateway.auth.mode: "none"` con acceso de entrada privado o autenticación HTTP mediante proxy de confianza. Consulte [Superficies web](/es/web).

## Abrir en Telegram

Los bots de Telegram pueden abrir el panel como una miniaplicación de Telegram mediante `/dashboard`.

Requisitos:

- `gateway.tailscale.mode: "serve"` o `"funnel"` para que Telegram obtenga una URL HTTPS de la miniaplicación.
- El remitente de Telegram debe ser el propietario del bot: un identificador numérico de usuario de Telegram en `commands.ownerAllowFrom` o en el valor efectivo de `channels.telegram.allowFrom` de la cuenta seleccionada.
- Ejecute `/dashboard` en un mensaje directo con el bot. Las invocaciones en grupos solo indican que se abra el comando en un mensaje directo y no incluyen ningún botón.
- Instalaciones con Docker: los modos Serve/Funnel requieren que el Gateway se enlace al bucle invertido junto a `tailscaled`, algo que las redes en puente con puertos publicados no pueden satisfacer. Ejecute el contenedor del Gateway con `network_mode: host` y monte en el contenedor el socket `tailscaled` del host (`/var/run/tailscale`), además de la CLI `tailscale`.

La miniaplicación realiza una transferencia única del propietario y redirige a la interfaz de control con un token de inicialización de corta duración. No expone un token compartido del Gateway en la URL.

Fuera del alcance de v1:

- El iframe web de Telegram no es compatible.
- Tailscale Serve/Funnel es la única ruta de URL publicada compatible.

<a id="if-you-see-unauthorized-1008"></a>

## Si aparece "unauthorized" / 1008

- Confirme que se puede acceder al Gateway: en local, `openclaw status`; en remoto, cree un túnel SSH con `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` y, a continuación, abra `http://127.0.0.1:18789/`.
- Para `AUTH_TOKEN_MISMATCH`, los clientes pueden realizar un reintento de confianza con un token de dispositivo almacenado en caché cuando el Gateway devuelve indicaciones de reintento; ese reintento reutiliza los ámbitos aprobados almacenados en caché del token (los llamadores que especifican `deviceToken`/`scopes` conservan el conjunto de ámbitos solicitado). Si la autenticación sigue fallando después de ese reintento, resuelva manualmente la divergencia del token.
- Para `AUTH_SCOPE_MISMATCH`, el token del dispositivo se reconoció, pero no contiene los ámbitos solicitados; vuelva a emparejar el dispositivo o apruebe el nuevo conjunto de ámbitos en lugar de rotar el token compartido del Gateway.
- Fuera de esa ruta de reintento, la precedencia de la autenticación de conexión es: token/contraseña compartidos explícitos, después `deviceToken` explícito, después token de dispositivo almacenado y, por último, token de inicialización.
- En la ruta asíncrona de Tailscale Serve, los intentos fallidos para el mismo `{scope, ip}` se serializan antes de que el limitador de autenticaciones fallidas los registre, por lo que un segundo reintento incorrecto simultáneo ya puede mostrar `retry later`.
- Para conocer los pasos de reparación de la divergencia de tokens, consulte la [Lista de comprobación para recuperar la divergencia de tokens](/es/cli/devices#token-drift-recovery-checklist).
- Recupere o proporcione el secreto compartido desde el host del Gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Contraseña: resuelva el valor configurado de `gateway.auth.password` o `OPENCLAW_GATEWAY_PASSWORD`
  - Token administrado mediante SecretRef: resuelva el proveedor externo de secretos o exporte `OPENCLAW_GATEWAY_TOKEN` en este shell y vuelva a ejecutar `openclaw dashboard`
  - No hay ningún secreto compartido configurado: `openclaw doctor --generate-gateway-token`
- En los ajustes del panel, pegue el token o la contraseña en el campo de autenticación y, a continuación, conéctese.
- El selector de idioma de la interfaz se encuentra en **Settings -> General -> Language**, no en Appearance.

## Relacionado

- [Interfaz de control](/es/web/control-ui)
- [WebChat](/es/web/webchat)
