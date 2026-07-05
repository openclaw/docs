---
read_when:
    - Trabajando en funciones del canal de Google Chat
summary: Estado de soporte, capacidades y configuración de la app de Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-05T11:01:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb0a6298652a8bac48f5e7249884f8387bc72f9c849a9b39e73aff008b848780
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat se ejecuta como el Plugin oficial `@openclaw/googlechat`: MD y espacios mediante webhooks de la API de Google Chat (solo endpoint HTTP, sin Pub/Sub).

## Instalar

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuración rápida (principiante)

1. Crea un proyecto de Google Cloud y habilita la **API de Google Chat**.
   - Ve a: [Credenciales de la API de Google Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Habilita la API si aún no está habilitada.
2. Crea una **cuenta de servicio**:
   - Pulsa **Crear credenciales** > **Cuenta de servicio**.
   - Ponle el nombre que quieras (por ejemplo, `openclaw-chat`).
   - Deja en blanco los permisos y las entidades principales (**Continuar** y luego **Listo**).
3. Crea y descarga la **clave JSON**:
   - Haz clic en la nueva cuenta de servicio > pestaña **Claves** > **Añadir clave** > **Crear clave nueva** > **JSON** > **Crear**.
4. Guarda el archivo JSON descargado en tu host del Gateway (por ejemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crea una app de Google Chat en la [Configuración de Chat de Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Rellena **Información de la aplicación** (nombre de la app, URL del avatar, descripción).
   - Habilita **Funciones interactivas**.
   - En **Funcionalidad**, marca **Unirse a espacios y conversaciones de grupo**.
   - En **Configuración de conexión**, selecciona **URL de endpoint HTTP**.
   - En **Activadores**, selecciona **Usar una URL de endpoint HTTP común para todos los activadores** y establécela en la URL pública de tu Gateway seguida de `/googlechat` (consulta [URL pública](#public-url-webhook-only)).
   - En **Visibilidad**, marca **Hacer que esta app de Chat esté disponible para personas y grupos específicos en `<Your Domain>`** e introduce tu dirección de correo electrónico.
   - Haz clic en **Guardar**.
6. Habilita el estado de la app: actualiza la página, busca **Estado de la app**, establécelo en **En vivo: disponible para usuarios** y vuelve a hacer clic en **Guardar**.
7. Configura OpenClaw con la cuenta de servicio y la audiencia del Webhook (debe coincidir con la configuración de la app de Chat):
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (solo cuenta predeterminada), o
   - Config: consulta [Aspectos destacados de la configuración](#config-highlights). `openclaw channels add --channel googlechat` también acepta `--audience-type`, `--audience`, `--webhook-path` y `--webhook-url`.
8. Inicia el Gateway. Google Chat hará POST a tu ruta de Webhook (predeterminada: `/googlechat`).

## Añadir a Google Chat

Cuando el Gateway esté en ejecución y tu correo esté en la lista de visibilidad:

1. Ve a [Google Chat](https://chat.google.com/).
2. Haz clic en el icono **+** (más) junto a **Mensajes directos**.
3. Busca el **nombre de la app** que configuraste en Google Cloud Console.
   - El bot _no_ aparece en la lista de exploración de Marketplace porque es una app privada; búscalo por nombre.
4. Selecciona el bot, haz clic en **Añadir** o **Chat** y envía un mensaje.

## URL pública (solo Webhook)

Los webhooks de Google Chat requieren un endpoint HTTPS público. Por seguridad, expón **solo la ruta `/googlechat`** a Internet y mantén privados el panel de OpenClaw y otros endpoints.

### Opción A: Tailscale Funnel (recomendado)

Usa Tailscale Serve para el panel privado y Funnel para la ruta pública del Webhook.

1. Comprueba a qué dirección está enlazado tu Gateway:

   ```bash
   ss -tlnp | grep 18789
   ```

   Anota la IP (por ejemplo, `127.0.0.1`, `0.0.0.0` o una dirección Tailscale `100.x.x.x`).

2. Expón el panel solo a la tailnet (puerto 8443):

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to a Tailscale IP only:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Expón públicamente solo la ruta del Webhook:

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to a Tailscale IP only:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Si se te solicita, visita la URL de autorización que se muestra en la salida para habilitar Funnel para este nodo.

5. Verifica:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Tu URL pública de Webhook es `https://<node-name>.<tailnet>.ts.net/googlechat`; el panel permanece solo en la tailnet en `https://<node-name>.<tailnet>.ts.net:8443/`. Usa la URL pública (sin `:8443`) en la configuración de la app de Google Chat.

> Nota: Esta configuración persiste tras los reinicios. Elimínala más adelante con `tailscale funnel reset` y `tailscale serve reset`.

### Opción B: Proxy inverso (Caddy)

Proxy solo de la ruta del Webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Las solicitudes a `your-domain.com/` se ignoran o devuelven 404, mientras que `your-domain.com/googlechat` se enruta a OpenClaw.

### Opción C: Cloudflare Tunnel

Configura las reglas de ingreso del túnel para enrutar solo la ruta del Webhook:

- **Ruta**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regla predeterminada**: HTTP 404 (No encontrado)

## Cómo funciona

1. Google Chat envía JSON mediante POST a la ruta del Webhook del Gateway (solo POST, tipo de contenido JSON requerido, con límite de tasa por IP).
2. OpenClaw autentica cada solicitud antes de despacharla:
   - Los eventos de la aplicación de Chat llevan `Authorization: Bearer <token>`; el token se verifica antes de analizar el cuerpo completo.
   - Los eventos de complementos de Google Workspace llevan el token en el cuerpo (`authorizationEventObject.systemIdToken`) y se leen con un presupuesto de preautenticación más estricto (16 KB, 3 s) antes de la verificación.
3. El token se comprueba contra `audienceType` + `audience`:
   - `audienceType: "app-url"` → la audiencia es tu URL HTTPS del Webhook.
   - `audienceType: "project-number"` → la audiencia es el número del proyecto de Cloud.
   - Los tokens de complementos bajo `app-url` también requieren que `appPrincipal` se establezca en el ID de cliente OAuth 2.0 numérico de la aplicación (21 dígitos, no un correo electrónico); de lo contrario, la verificación falla con una advertencia registrada.
4. Los mensajes se enrutan por espacio:
   - Los espacios obtienen sesiones por espacio `agent:<agentId>:googlechat:group:<spaceId>`; las respuestas van al hilo del mensaje.
   - Los DM se agrupan en la sesión principal del agente de forma predeterminada; establece `session.dmScope` para sesiones de DM por interlocutor (consulta [Sesión](/es/concepts/session)).
5. El acceso a DM usa emparejamiento de forma predeterminada. Los remitentes desconocidos reciben un código de emparejamiento; apruébalo con:
   - `openclaw pairing approve googlechat <code>`
6. Los espacios de grupo requieren @mención de forma predeterminada. Las menciones se detectan a partir de anotaciones `USER_MENTION` de Chat dirigidas a la aplicación; establece `botUser` (por ejemplo, `users/1234567890`) si la detección necesita el nombre de recurso de usuario de la aplicación.
7. Cuando una aprobación de ejecución o Plugin se inicia desde Google Chat y hay configurado un aprobador estable `users/<id>`, OpenClaw publica una tarjeta de aprobación nativa (`cardsV2`) en el espacio o hilo de origen. Los botones de la tarjeta llevan tokens de devolución de llamada opacos; el mensaje manual `/approve <id> <decision>` aparece solo cuando la entrega nativa no está disponible.

## Destinos

Usa estos identificadores para entrega y listas de permitidos:

- Mensajes directos: `users/<userId>` (recomendado).
- Espacios: `spaces/<spaceId>`.
- El correo electrónico sin procesar `name@example.com` es mutable y solo se usa para coincidencia de listas de permitidos cuando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` se trata como un id de usuario, no como una entrada de lista de permitidos de correo electrónico.
- Los prefijos `googlechat:`, `google-chat:` y `gchat:` se aceptan y se eliminan.

## Aspectos destacados de configuración

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Notas:

- Credenciales de cuenta de servicio: `serviceAccountFile` (ruta), `serviceAccount` (cadena JSON u objeto en línea) o `serviceAccountRef` (env/file SecretRef). Las variables de entorno `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON en línea) y `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (ruta) se aplican solo a la cuenta predeterminada. Las configuraciones con varias cuentas usan `channels.googlechat.accounts.<id>` con las mismas claves, incluido `serviceAccountRef` por cuenta.
- La ruta predeterminada del Webhook es `/googlechat` cuando `webhookPath` no está establecido; `webhookUrl` puede proporcionar la ruta en su lugar.
- Las claves de grupo deben ser ids de espacio estables (`spaces/<spaceId>`). Las claves de nombre para mostrar están obsoletas y se registran como tales.
- `dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia de principales de correo electrónico mutables para listas de permitidos (modo de compatibilidad de emergencia); doctor advierte sobre entradas de correo electrónico.
- Las reacciones están habilitadas de forma predeterminada y se exponen mediante la herramienta `reactions` y `channels action`; deshabilítalas con `actions.reactions: false`.
- Las tarjetas de aprobación nativas usan clics de botones `cardsV2` de Google Chat, no eventos de reacción. Los aprobadores provienen de `dm.allowFrom` o `defaultTo` y deben ser valores numéricos estables `users/<id>`.
- Las acciones de mensaje exponen `send` para texto y `upload-file` para envíos explícitos de adjuntos. `upload-file` acepta `media` / `filePath` / `path` más `message`, `filename` y destino de hilo opcionales (`threadId` / `replyTo`).
- `typingIndicator`: `message` (predeterminado) publica un marcador de posición `_<Bot> is typing..._` y lo edita para convertirlo en la primera respuesta; `none` lo deshabilita; `reaction` requiere OAuth de usuario y actualmente vuelve a `message` con un error registrado bajo autenticación de cuenta de servicio.
- Los adjuntos entrantes (primer adjunto por mensaje) se descargan mediante la API de Chat en la canalización de medios, con un límite de `mediaMaxMb` (predeterminado 20).
- Los mensajes creados por bots se ignoran de forma predeterminada. Con `allowBots: true`, los mensajes de bot aceptados usan la [protección contra bucles de bot](/es/channels/bot-loop-protection) compartida: configura `channels.defaults.botLoopProtection` y luego sobrescribe con `channels.googlechat.botLoopProtection` o `channels.googlechat.groups.<space>.botLoopProtection`.

Detalles de referencia de secretos: [Gestión de secretos](/es/gateway/secrets).

## Solución de problemas

### 405 Método no permitido

Si Google Cloud Logs Explorer muestra errores como:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

El controlador del Webhook no está registrado. Causas comunes:

1. **Canal no configurado**: falta la sección `channels.googlechat`. Verifícalo con:

   ```bash
   openclaw config get channels.googlechat
   ```

   Si devuelve "Config path not found", agrega la configuración (consulta [Aspectos destacados de configuración](#config-highlights)).

2. **Plugin no habilitado**: comprueba el estado del Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Si muestra "disabled", agrega `plugins.entries.googlechat.enabled: true` a tu configuración.

3. **Gateway no reiniciado** después de cambios de configuración:

   ```bash
   openclaw gateway restart
   ```

Verifica que el canal esté en ejecución:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Otros problemas

- `openclaw channels status --probe` muestra errores de autenticación y configuración de audiencia faltante (`audience` y `audienceType` son ambos obligatorios).
- Si no llegan mensajes, confirma la URL del Webhook de la aplicación de Chat y la configuración del disparador.
- Si la compuerta de menciones bloquea respuestas, establece `botUser` en el nombre de recurso de usuario de la aplicación y comprueba `requireMention`.
- `openclaw logs --follow` al enviar un mensaje de prueba muestra si las solicitudes llegan al Gateway.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Configuración del Gateway](/es/gateway/configuration)
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control de menciones
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Reacciones](/es/tools/reactions)
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
