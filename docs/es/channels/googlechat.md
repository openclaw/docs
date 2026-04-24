---
read_when:
    - Trabajando en las funciones del canal de Google Chat
summary: Estado de compatibilidad, capacidades y configuración de la aplicación Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T05:18:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

Estado: listo para mensajes directos y espacios mediante webhooks de la API de Google Chat (solo HTTP).

## Configuración rápida (principiantes)

1. Crea un proyecto de Google Cloud y habilita la **API de Google Chat**.
   - Ve a: [Credenciales de la API de Google Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Habilita la API si aún no está habilitada.
2. Crea una **cuenta de servicio**:
   - Pulsa **Create Credentials** > **Service Account**.
   - Asígnale el nombre que quieras (por ejemplo, `openclaw-chat`).
   - Deja los permisos en blanco (pulsa **Continue**).
   - Deja en blanco los usuarios principales con acceso (pulsa **Done**).
3. Crea y descarga la **clave JSON**:
   - En la lista de cuentas de servicio, haz clic en la que acabas de crear.
   - Ve a la pestaña **Keys**.
   - Haz clic en **Add Key** > **Create new key**.
   - Selecciona **JSON** y pulsa **Create**.
4. Guarda el archivo JSON descargado en tu host de gateway (por ejemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crea una aplicación de Google Chat en la [configuración de Chat de Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Completa la **Application info**:
     - **App name**: (por ejemplo, `OpenClaw`)
     - **Avatar URL**: (por ejemplo, `https://openclaw.ai/logo.png`)
     - **Description**: (por ejemplo, `Personal AI Assistant`)
   - Habilita **Interactive features**.
   - En **Functionality**, marca **Join spaces and group conversations**.
   - En **Connection settings**, selecciona **HTTP endpoint URL**.
   - En **Triggers**, selecciona **Use a common HTTP endpoint URL for all triggers** y configúralo con la URL pública de tu gateway seguida de `/googlechat`.
     - _Consejo: ejecuta `openclaw status` para encontrar la URL pública de tu gateway._
   - En **Visibility**, marca **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Escribe tu dirección de correo electrónico (por ejemplo, `user@example.com`) en el cuadro de texto.
   - Haz clic en **Save** al final.
6. **Habilita el estado de la aplicación**:
   - Después de guardar, **actualiza la página**.
   - Busca la sección **App status** (normalmente cerca de la parte superior o inferior después de guardar).
   - Cambia el estado a **Live - available to users**.
   - Haz clic en **Save** de nuevo.
7. Configura OpenClaw con la ruta de la cuenta de servicio y la audiencia del webhook:
   - Entorno: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - O configuración: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Establece el tipo y el valor de la audiencia del webhook (debe coincidir con la configuración de tu aplicación de Chat).
9. Inicia el gateway. Google Chat enviará solicitudes POST a la ruta de tu webhook.

## Añadir a Google Chat

Una vez que el gateway esté en ejecución y tu correo electrónico esté añadido a la lista de visibilidad:

1. Ve a [Google Chat](https://chat.google.com/).
2. Haz clic en el icono **+** (más) junto a **Direct Messages**.
3. En la barra de búsqueda (donde normalmente agregas personas), escribe el **App name** que configuraste en Google Cloud Console.
   - **Nota**: el bot _no_ aparecerá en la lista de exploración de "Marketplace" porque es una aplicación privada. Debes buscarlo por nombre.
4. Selecciona tu bot en los resultados.
5. Haz clic en **Add** o **Chat** para iniciar una conversación 1:1.
6. Envía "Hello" para activar el asistente.

## URL pública (solo webhook)

Los webhooks de Google Chat requieren un endpoint HTTPS público. Por seguridad, **expón solo la ruta `/googlechat`** a internet. Mantén el panel de OpenClaw y otros endpoints sensibles en tu red privada.

### Opción A: Tailscale Funnel (recomendada)

Usa Tailscale Serve para el panel privado y Funnel para la ruta pública del webhook. Esto mantiene `/` como privado mientras expone solo `/googlechat`.

1. **Comprueba a qué dirección está enlazado tu gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Anota la dirección IP (por ejemplo, `127.0.0.1`, `0.0.0.0` o tu IP de Tailscale como `100.x.x.x`).

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

4. **Autoriza el nodo para acceso con Funnel:**
   Si se te solicita, visita la URL de autorización que aparece en la salida para habilitar Funnel para este nodo en la política de tu tailnet.

5. **Verifica la configuración:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

La URL pública de tu webhook será:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Tu panel privado seguirá siendo solo para la tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Usa la URL pública (sin `:8443`) en la configuración de la aplicación de Google Chat.

> Nota: esta configuración persiste tras reinicios. Para eliminarla más adelante, ejecuta `tailscale funnel reset` y `tailscale serve reset`.

### Opción B: Proxy inverso (Caddy)

Si usas un proxy inverso como Caddy, envía por proxy solo la ruta específica:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Con esta configuración, cualquier solicitud a `your-domain.com/` se ignorará o devolverá 404, mientras que `your-domain.com/googlechat` se enruta de forma segura a OpenClaw.

### Opción C: Cloudflare Tunnel

Configura las reglas de ingreso de tu túnel para enrutar solo la ruta del webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Cómo funciona

1. Google Chat envía solicitudes POST de webhook al gateway. Cada solicitud incluye un encabezado `Authorization: Bearer <token>`.
   - OpenClaw verifica la autenticación bearer antes de leer o analizar cuerpos completos de webhook cuando el encabezado está presente.
   - Las solicitudes de complementos de Google Workspace que incluyen `authorizationEventObject.systemIdToken` en el cuerpo son compatibles mediante un presupuesto de cuerpo previo a la autenticación más estricto.
2. OpenClaw verifica el token con el `audienceType` y la `audience` configurados:
   - `audienceType: "app-url"` → la audiencia es la URL HTTPS de tu webhook.
   - `audienceType: "project-number"` → la audiencia es el número del proyecto de Cloud.
3. Los mensajes se enrutan por espacio:
   - Los mensajes directos usan la clave de sesión `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Los espacios usan la clave de sesión `agent:<agentId>:googlechat:group:<spaceId>`.
4. El acceso a mensajes directos usa emparejamiento de forma predeterminada. Los remitentes desconocidos reciben un código de emparejamiento; apruébalo con:
   - `openclaw pairing approve googlechat <code>`
5. Los espacios de grupo requieren mención con @ de forma predeterminada. Usa `botUser` si la detección de menciones necesita el nombre de usuario de la aplicación.

## Destinos

Usa estos identificadores para entrega y listas de permitidos:

- Mensajes directos: `users/<userId>` (recomendado).
- El correo electrónico sin formato `name@example.com` es mutable y solo se usa para coincidencia directa en listas de permitidos cuando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` se trata como un id de usuario, no como una lista de permitidos por correo electrónico.
- Espacios: `spaces/<spaceId>`.

## Puntos destacados de la configuración

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
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
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

- Las credenciales de la cuenta de servicio también pueden pasarse en línea con `serviceAccount` (cadena JSON).
- `serviceAccountRef` también es compatible (SecretRef de entorno/archivo), incluidas las referencias por cuenta en `channels.googlechat.accounts.<id>.serviceAccountRef`.
- La ruta de webhook predeterminada es `/googlechat` si no se configura `webhookPath`.
- `dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de principales por correo electrónico para listas de permitidos (modo de compatibilidad de emergencia).
- Las reacciones están disponibles mediante la herramienta `reactions` y `channels action` cuando `actions.reactions` está habilitado.
- Las acciones de mensaje exponen `send` para texto y `upload-file` para envíos explícitos de archivos adjuntos. `upload-file` acepta `media` / `filePath` / `path` más `message`, `filename` y destino de hilo opcionales.
- `typingIndicator` admite `none`, `message` (predeterminado) y `reaction` (la reacción requiere OAuth de usuario).
- Los archivos adjuntos se descargan a través de la API de Chat y se almacenan en la canalización de medios (tamaño limitado por `mediaMaxMb`).

Detalles de referencia de secretos: [Gestión de secretos](/es/gateway/secrets).

## Solución de problemas

### 405 Method Not Allowed

Si Google Cloud Logs Explorer muestra errores como:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Esto significa que el controlador del webhook no está registrado. Causas comunes:

1. **Canal no configurado**: falta la sección `channels.googlechat` en tu configuración. Verifícalo con:

   ```bash
   openclaw config get channels.googlechat
   ```

   Si devuelve "Config path not found", añade la configuración (consulta [Puntos destacados de la configuración](#config-highlights)).

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

- Comprueba `openclaw channels status --probe` para ver errores de autenticación o falta de configuración de audiencia.
- Si no llega ningún mensaje, confirma la URL del webhook y las suscripciones a eventos de la aplicación de Chat.
- Si el control por menciones bloquea las respuestas, establece `botUser` en el nombre del recurso de usuario de la aplicación y verifica `requireMention`.
- Usa `openclaw logs --follow` mientras envías un mensaje de prueba para ver si las solicitudes llegan al gateway.

Documentación relacionada:

- [Configuración de Gateway](/es/gateway/configuration)
- [Seguridad](/es/gateway/security)
- [Reacciones](/es/tools/reactions)

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
