---
read_when:
    - Trabajando en funciones del canal de Google Chat
summary: Estado de soporte, capacidades y configuración de la app de Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

Estado: Plugin descargable para MD + espacios mediante webhooks de Google Chat API (solo HTTP).

## Instalación

Instala Google Chat antes de configurar el canal:

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuración rápida (principiante)

1. Crea un proyecto de Google Cloud y habilita la **Google Chat API**.
   - Ve a: [Credenciales de Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Habilita la API si aún no está habilitada.
2. Crea una **cuenta de servicio**:
   - Pulsa **Crear credenciales** > **Cuenta de servicio**.
   - Ponle el nombre que quieras (por ejemplo, `openclaw-chat`).
   - Deja los permisos en blanco (pulsa **Continuar**).
   - Deja los principales con acceso en blanco (pulsa **Listo**).
3. Crea y descarga la **clave JSON**:
   - En la lista de cuentas de servicio, haz clic en la que acabas de crear.
   - Ve a la pestaña **Claves**.
   - Haz clic en **Añadir clave** > **Crear clave nueva**.
   - Selecciona **JSON** y pulsa **Crear**.
4. Guarda el archivo JSON descargado en tu host de Gateway (por ejemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crea una aplicación de Google Chat en la [configuración de Chat de Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Rellena la **información de la aplicación**:
     - **Nombre de la aplicación**: (por ejemplo, `OpenClaw`)
     - **URL del avatar**: (por ejemplo, `https://openclaw.ai/logo.png`)
     - **Descripción**: (por ejemplo, `Asistente personal de IA`)
   - Habilita **Funciones interactivas**.
   - En **Funcionalidad**, marca **Unirse a espacios y conversaciones de grupo**.
   - En **Configuración de conexión**, selecciona **URL de endpoint HTTP**.
   - En **Activadores**, selecciona **Usar una URL de endpoint HTTP común para todos los activadores** y configúrala con la URL pública de tu Gateway seguida de `/googlechat`.
     - _Consejo: Ejecuta `openclaw status` para encontrar la URL pública de tu Gateway._
   - En **Visibilidad**, marca **Hacer que esta aplicación de Chat esté disponible para personas y grupos específicos en `<Your Domain>`**.
   - Introduce tu dirección de correo electrónico (por ejemplo, `user@example.com`) en el cuadro de texto.
   - Haz clic en **Guardar** en la parte inferior.
6. **Habilita el estado de la aplicación**:
   - Después de guardar, **actualiza la página**.
   - Busca la sección **Estado de la aplicación** (normalmente cerca de la parte superior o inferior después de guardar).
   - Cambia el estado a **Activa - disponible para usuarios**.
   - Haz clic en **Guardar** de nuevo.
7. Configura OpenClaw con la ruta de la cuenta de servicio + audiencia del Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - O config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Configura el tipo + valor de audiencia del Webhook (debe coincidir con la configuración de tu aplicación de Chat).
9. Inicia el Gateway. Google Chat enviará POST a la ruta de tu Webhook.

## Añadir a Google Chat

Una vez que el Gateway esté en ejecución y tu correo esté añadido a la lista de visibilidad:

1. Ve a [Google Chat](https://chat.google.com/).
2. Haz clic en el icono **+** (más) junto a **Mensajes directos**.
3. En la barra de búsqueda (donde normalmente añades personas), escribe el **nombre de la aplicación** que configuraste en Google Cloud Console.
   - **Nota**: El bot _no_ aparecerá en la lista de exploración de "Marketplace" porque es una aplicación privada. Debes buscarlo por nombre.
4. Selecciona tu bot en los resultados.
5. Haz clic en **Añadir** o **Chat** para iniciar una conversación 1:1.
6. Envía "Hola" para activar el asistente.

## URL pública (solo Webhook)

Los webhooks de Google Chat requieren un endpoint HTTPS público. Por seguridad, **expón únicamente la ruta `/googlechat`** a Internet. Mantén el panel de OpenClaw y otros endpoints sensibles en tu red privada.

### Opción A: Tailscale Funnel (recomendado)

Usa Tailscale Serve para el panel privado y Funnel para la ruta pública del Webhook. Esto mantiene `/` privado y expone solo `/googlechat`.

1. **Comprueba a qué dirección está vinculado tu Gateway:**

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

3. **Expón públicamente solo la ruta del Webhook:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autoriza el nodo para acceso a Funnel:**
   Si se te solicita, visita la URL de autorización que aparece en la salida para habilitar Funnel para este nodo en tu política de tailnet.

5. **Verifica la configuración:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Tu URL pública de Webhook será:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Tu panel privado permanece solo para la tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Usa la URL pública (sin `:8443`) en la configuración de la aplicación de Google Chat.

> Nota: Esta configuración persiste tras los reinicios. Para eliminarla más adelante, ejecuta `tailscale funnel reset` y `tailscale serve reset`.

### Opción B: Proxy inverso (Caddy)

Si usas un proxy inverso como Caddy, proxy solo la ruta específica:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Con esta configuración, cualquier solicitud a `your-domain.com/` se ignorará o devolverá 404, mientras que `your-domain.com/googlechat` se enruta de forma segura a OpenClaw.

### Opción C: Cloudflare Tunnel

Configura las reglas de entrada de tu túnel para enrutar solo la ruta del Webhook:

- **Ruta**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regla predeterminada**: HTTP 404 (No encontrado)

## Cómo funciona

1. Google Chat envía POST de Webhook al Gateway. Cada solicitud incluye un encabezado `Authorization: Bearer <token>`.
   - OpenClaw verifica la autenticación bearer antes de leer/analizar cuerpos completos de Webhook cuando el encabezado está presente.
   - Las solicitudes de Google Workspace Add-on que llevan `authorizationEventObject.systemIdToken` en el cuerpo son compatibles mediante un presupuesto de cuerpo de preautenticación más estricto.
2. OpenClaw verifica el token con el `audienceType` + `audience` configurados:
   - `audienceType: "app-url"` → la audiencia es tu URL HTTPS de Webhook.
   - `audienceType: "project-number"` → la audiencia es el número del proyecto de Cloud.
3. Los mensajes se enrutan por espacio:
   - Los MD usan la clave de sesión `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Los espacios usan la clave de sesión `agent:<agentId>:googlechat:group:<spaceId>`.
4. El acceso por MD usa emparejamiento de forma predeterminada. Los remitentes desconocidos reciben un código de emparejamiento; apruébalo con:
   - `openclaw pairing approve googlechat <code>`
5. Los espacios de grupo requieren @mención de forma predeterminada. Usa `botUser` si la detección de menciones necesita el nombre de usuario de la aplicación.

## Destinos

Usa estos identificadores para entrega y listas de permitidos:

- Mensajes directos: `users/<userId>` (recomendado).
- El correo sin procesar `name@example.com` es mutable y solo se usa para coincidencia de lista de permitidos directa cuando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` se trata como un id de usuario, no como una lista de permitidos de correo.
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

- Las credenciales de la cuenta de servicio también pueden pasarse en línea con `serviceAccount` (cadena JSON).
- `serviceAccountRef` también es compatible (env/file SecretRef), incluidas refs por cuenta en `channels.googlechat.accounts.<id>.serviceAccountRef`.
- La ruta predeterminada del Webhook es `/googlechat` si `webhookPath` no está configurado.
- `dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia de principales de correo mutable para listas de permitidos (modo de compatibilidad de emergencia).
- Las reacciones están disponibles mediante la herramienta `reactions` y `channels action` cuando `actions.reactions` está habilitado.
- Las acciones de mensaje exponen `send` para texto y `upload-file` para envíos explícitos de adjuntos. `upload-file` acepta `media` / `filePath` / `path` más `message`, `filename` y destino de hilo opcionales.
- `typingIndicator` admite `none`, `message` (predeterminado) y `reaction` (`reaction` requiere OAuth de usuario).
- Los adjuntos se descargan mediante la Chat API y se almacenan en la canalización de medios (tamaño limitado por `mediaMaxMb`).

Detalles de referencia de secretos: [Gestión de secretos](/es/gateway/secrets).

## Solución de problemas

### 405 Method Not Allowed

Si Google Cloud Logs Explorer muestra errores como:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Esto significa que el manejador del Webhook no está registrado. Causas comunes:

1. **Canal no configurado**: Falta la sección `channels.googlechat` en tu configuración. Verifícalo con:

   ```bash
   openclaw config get channels.googlechat
   ```

   Si devuelve "Config path not found", añade la configuración (consulta [Aspectos destacados de la configuración](#config-highlights)).

2. **Plugin no habilitado**: Comprueba el estado del Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Si muestra "disabled", añade `plugins.entries.googlechat.enabled: true` a tu configuración.

3. **Gateway no reiniciado**: Después de añadir la configuración, reinicia el Gateway:

   ```bash
   openclaw gateway restart
   ```

Verifica que el canal esté en ejecución:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Otros problemas

- Comprueba `openclaw channels status --probe` para detectar errores de autenticación o configuración de audiencia faltante.
- Si no llegan mensajes, confirma la URL del Webhook de la aplicación de Chat + las suscripciones a eventos.
- Si el control de menciones bloquea las respuestas, configura `botUser` con el nombre de recurso de usuario de la aplicación y verifica `requireMention`.
- Usa `openclaw logs --follow` mientras envías un mensaje de prueba para ver si las solicitudes llegan al Gateway.

Documentación relacionada:

- [Configuración del Gateway](/es/gateway/configuration)
- [Seguridad](/es/gateway/security)
- [Reacciones](/es/tools/reactions)

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
