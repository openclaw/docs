---
read_when:
    - Trabajando en funciones del canal Google Chat
summary: Estado de soporte, capacidades y configuración de la app de Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T10:36:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

Estado: Plugin descargable para DMs + espacios mediante webhooks de la API de Google Chat (solo HTTP).

## Instalación

Instala Google Chat antes de configurar el canal:

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuración rápida (principiantes)

1. Crea un proyecto de Google Cloud y habilita la **API de Google Chat**.
   - Ve a: [Credenciales de la API de Google Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Habilita la API si aún no está habilitada.
2. Crea una **cuenta de servicio**:
   - Pulsa **Crear credenciales** > **Cuenta de servicio**.
   - Asígnale el nombre que quieras (por ejemplo, `openclaw-chat`).
   - Deja los permisos en blanco (pulsa **Continuar**).
   - Deja los principales con acceso en blanco (pulsa **Listo**).
3. Crea y descarga la **clave JSON**:
   - En la lista de cuentas de servicio, haz clic en la que acabas de crear.
   - Ve a la pestaña **Claves**.
   - Haz clic en **Añadir clave** > **Crear clave nueva**.
   - Selecciona **JSON** y pulsa **Crear**.
4. Guarda el archivo JSON descargado en tu host de gateway (por ejemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crea una app de Google Chat en la [configuración de Chat de Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Completa la **información de la aplicación**:
     - **Nombre de la aplicación**: (por ejemplo, `OpenClaw`)
     - **URL del avatar**: (por ejemplo, `https://openclaw.ai/logo.png`)
     - **Descripción**: (por ejemplo, `Personal AI Assistant`)
   - Habilita **funciones interactivas**.
   - En **Funcionalidad**, marca **Unirse a espacios y conversaciones de grupo**.
   - En **Configuración de conexión**, selecciona **URL de endpoint HTTP**.
   - En **Activadores**, selecciona **Usar una URL de endpoint HTTP común para todos los activadores** y configúrala con la URL pública de tu gateway seguida de `/googlechat`.
     - _Consejo: Ejecuta `openclaw status` para encontrar la URL pública de tu gateway._
   - En **Visibilidad**, marca **Hacer que esta app de Chat esté disponible para personas y grupos específicos en `<Your Domain>`**.
   - Introduce tu dirección de correo electrónico (por ejemplo, `user@example.com`) en el cuadro de texto.
   - Haz clic en **Guardar** en la parte inferior.
6. **Habilita el estado de la app**:
   - Después de guardar, **actualiza la página**.
   - Busca la sección **Estado de la app** (normalmente cerca de la parte superior o inferior después de guardar).
   - Cambia el estado a **Live - available to users**.
   - Haz clic en **Guardar** de nuevo.
7. Configura OpenClaw con la ruta de la cuenta de servicio + la audiencia del webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - O config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Define el tipo y el valor de audiencia del webhook (deben coincidir con la configuración de tu app de Chat).
9. Inicia el gateway. Google Chat enviará POST a la ruta de tu webhook.

## Añadir a Google Chat

Una vez que el gateway esté en ejecución y tu correo electrónico se haya añadido a la lista de visibilidad:

1. Ve a [Google Chat](https://chat.google.com/).
2. Haz clic en el icono **+** (más) junto a **Mensajes directos**.
3. En la barra de búsqueda (donde normalmente añades personas), escribe el **nombre de la aplicación** que configuraste en Google Cloud Console.
   - **Nota**: El bot _no_ aparecerá en la lista de exploración de "Marketplace" porque es una app privada. Debes buscarlo por nombre.
4. Selecciona tu bot en los resultados.
5. Haz clic en **Añadir** o **Chat** para iniciar una conversación 1:1.
6. Envía "Hola" para activar el asistente.

## URL pública (solo webhook)

Los webhooks de Google Chat requieren un endpoint HTTPS público. Por seguridad, **expón únicamente la ruta `/googlechat`** a internet. Mantén el panel de OpenClaw y otros endpoints sensibles en tu red privada.

### Opción A: Tailscale Funnel (recomendado)

Usa Tailscale Serve para el panel privado y Funnel para la ruta pública del webhook. Esto mantiene `/` privado mientras expone solo `/googlechat`.

1. **Comprueba a qué dirección está enlazado tu gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Observa la dirección IP (por ejemplo, `127.0.0.1`, `0.0.0.0` o tu IP de Tailscale como `100.x.x.x`).

2. **Expón el panel solo a la tailnet (puerto 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Expón públicamente solo la ruta del webhook:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autoriza el nodo para el acceso de Funnel:**
   Si se te solicita, visita la URL de autorización que se muestra en la salida para habilitar Funnel para este nodo en tu política de tailnet.

5. **Verifica la configuración:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Tu URL pública de webhook será:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Tu panel privado se mantiene solo para la tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Usa la URL pública (sin `:8443`) en la configuración de la app de Google Chat.

> Nota: Esta configuración persiste entre reinicios. Para eliminarla más adelante, ejecuta `tailscale funnel reset` y `tailscale serve reset`.

### Opción B: proxy inverso (Caddy)

Si usas un proxy inverso como Caddy, proxy únicamente la ruta específica:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Con esta configuración, cualquier solicitud a `your-domain.com/` se ignorará o devolverá 404, mientras que `your-domain.com/googlechat` se enrutará de forma segura a OpenClaw.

### Opción C: Cloudflare Tunnel

Configura las reglas de entrada de tu túnel para enrutar únicamente la ruta del webhook:

- **Ruta**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regla predeterminada**: HTTP 404 (No encontrado)

## Cómo funciona

1. Google Chat envía POSTs de webhook al gateway. Cada solicitud incluye una cabecera `Authorization: Bearer <token>`.
   - OpenClaw verifica la autenticación bearer antes de leer o analizar los cuerpos completos de webhook cuando la cabecera está presente.
   - Las solicitudes de Google Workspace Add-on que llevan `authorizationEventObject.systemIdToken` en el cuerpo se admiten mediante un presupuesto de cuerpo de preautenticación más estricto.
2. OpenClaw verifica el token contra los valores configurados de `audienceType` + `audience`:
   - `audienceType: "app-url"` → la audiencia es tu URL HTTPS de webhook.
   - `audienceType: "project-number"` → la audiencia es el número del proyecto de Cloud.
3. Los mensajes se enrutan por espacio:
   - Los DMs usan la clave de sesión `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Los espacios usan la clave de sesión `agent:<agentId>:googlechat:group:<spaceId>`.
4. El acceso a DMs usa emparejamiento de forma predeterminada. Los remitentes desconocidos reciben un código de emparejamiento; apruébalo con:
   - `openclaw pairing approve googlechat <code>`
5. Los espacios de grupo requieren mención @ de forma predeterminada. Usa `botUser` si la detección de menciones necesita el nombre de usuario de la app.
6. Cuando una solicitud de aprobación de ejecución o Plugin se inicia desde Google Chat y se configura un aprobador estable `users/<id>`, OpenClaw publica una tarjeta de aprobación nativa de Google Chat en el espacio o hilo de origen. Los botones de la tarjeta usan tokens de callback opacos, y el prompt manual `/approve <id> <decision>` solo se muestra cuando la entrega de aprobación nativa no está disponible.

## Destinos

Usa estos identificadores para entrega y listas de permitidos:

- Mensajes directos: `users/<userId>` (recomendado).
- El correo electrónico sin procesar `name@example.com` es mutable y solo se usa para coincidencias de listas de permitidos directas cuando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` se trata como un id de usuario, no como una lista de permitidos de correo electrónico.
- Espacios: `spaces/<spaceId>`.

## Aspectos destacados de la configuración

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
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

- Las credenciales de la cuenta de servicio también se pueden pasar en línea con `serviceAccount` (cadena JSON).
- `serviceAccountRef` también es compatible (SecretRef de env/file), incluidas referencias por cuenta en `channels.googlechat.accounts.<id>.serviceAccountRef`.
- La ruta predeterminada del webhook es `/googlechat` si `webhookPath` no está definido.
- `dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia de principales de correo electrónico mutables para listas de permitidos (modo de compatibilidad de emergencia).
- Las reacciones están disponibles mediante la herramienta `reactions` y `channels action` cuando `actions.reactions` está habilitado.
- Las tarjetas de aprobación nativas usan clics de botón `cardsV2` de Google Chat, no eventos de reacción. Los aprobadores provienen de `dm.allowFrom` o `defaultTo` y deben ser valores numéricos estables `users/<id>`.
- Las acciones de mensaje exponen `send` para texto y `upload-file` para envíos explícitos de adjuntos. `upload-file` acepta `media` / `filePath` / `path`, además de `message`, `filename` y destino de hilo opcionales.
- `typingIndicator` admite `message` (predeterminado), `none` y `reaction` (`reaction` requiere OAuth de usuario).
- Los adjuntos se descargan mediante la API de Chat y se almacenan en la canalización de medios (tamaño limitado por `mediaMaxMb`).
- Los mensajes de Google Chat creados por bots se ignoran de forma predeterminada. Si configuras intencionalmente `allowBots: true`, los mensajes creados por bots aceptados usan la [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Configura `channels.defaults.botLoopProtection` y luego sobrescribe con `channels.googlechat.botLoopProtection` o `channels.googlechat.groups.<space>.botLoopProtection` cuando un espacio necesite un presupuesto distinto.

Detalles de referencia de secretos: [Gestión de secretos](/es/gateway/secrets).

## Solución de problemas

### 405 Método no permitido

Si Google Cloud Logs Explorer muestra errores como:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Esto significa que el manejador del webhook no está registrado. Causas comunes:

1. **Canal no configurado**: falta la sección `channels.googlechat` en tu configuración. Verifícalo con:

   ```bash
   openclaw config get channels.googlechat
   ```

   Si devuelve "Config path not found", añade la configuración (consulta [Aspectos destacados de la configuración](#config-highlights)).

2. **Plugin no habilitado**: comprueba el estado del Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Si muestra "disabled", añade `plugins.entries.googlechat.enabled: true` a tu configuración.

3. **Gateway no reiniciado**: después de añadir la configuración, reinicia el gateway:

   ```bash
   openclaw gateway restart
   ```

Verifica que el canal esté en ejecución:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Otros problemas

- Revisa `openclaw channels status --probe` para ver errores de autenticación o configuración de audiencia faltante.
- Si no llegan mensajes, confirma la URL del webhook de la app de Chat y las suscripciones a eventos.
- Si la compuerta de menciones bloquea respuestas, establece `botUser` en el nombre de recurso de usuario de la app y verifica `requireMention`.
- Usa `openclaw logs --follow` mientras envías un mensaje de prueba para ver si las solicitudes llegan al gateway.

Documentos relacionados:

- [Configuración del gateway](/es/gateway/configuration)
- [Seguridad](/es/gateway/security)
- [Reacciones](/es/tools/reactions)

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats de grupo y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y fortalecimiento
