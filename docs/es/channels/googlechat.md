---
read_when:
    - Trabajo en las funcionalidades del canal de Google Chat
summary: Estado de compatibilidad, capacidades y configuración de la aplicación Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-22T10:25:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9d3fb96564294b57040327bb21ab7331bf8412eb04f879a9c7ea1018ba2bddab
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat funciona como el plugin oficial `@openclaw/googlechat`: mensajes directos y espacios mediante webhooks de la API de Google Chat (solo endpoint HTTP, sin Pub/Sub).

## Instalación

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout local (cuando se ejecuta desde un repositorio de git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuración rápida (principiantes)

1. Cree un proyecto de Google Cloud y habilite la **Google Chat API**.
   - Vaya a: [Credenciales de la API de Google Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Habilite la API si aún no está habilitada.
2. Cree una **Service Account**:
   - Pulse **Create Credentials** > **Service Account**.
   - Asígnele el nombre que desee (por ejemplo, `openclaw-chat`).
   - Deje en blanco los permisos y las entidades principales (**Continue** y después **Done**).
3. Cree y descargue la **clave JSON**:
   - Haga clic en la nueva cuenta de servicio > pestaña **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Guarde el archivo JSON descargado en el host del Gateway (por ejemplo, `~/.openclaw/googlechat-service-account.json`).
5. Cree una aplicación de Google Chat en la [configuración de Chat de Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Rellene **Application info** (nombre de la aplicación, URL del avatar y descripción).
   - Habilite **Interactive features**.
   - En **Functionality**, marque **Join spaces and group conversations**.
   - En **Connection settings**, seleccione **HTTP endpoint URL**.
   - En **Triggers**, seleccione **Use a common HTTP endpoint URL for all triggers** y establézcalo en la URL pública del Gateway seguida de `/googlechat` (consulte [URL pública](#public-url-webhook-only)).
   - En **Visibility**, marque **Make this Chat app available to specific people and groups in `<Your Domain>`** e introduzca su dirección de correo electrónico.
   - Haga clic en **Save**.
6. Habilite el estado de la aplicación: actualice la página, busque **App status**, establézcalo en **Live - available to users** y vuelva a pulsar **Save**.
7. Configure OpenClaw con la cuenta de servicio y la audiencia del webhook (debe coincidir con la configuración de la aplicación de Chat):
   - Entorno: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (solo para la cuenta predeterminada), o
   - Configuración: consulte [Aspectos destacados de la configuración](#config-highlights). `openclaw channels add --channel googlechat` también acepta `--audience-type`, `--audience`, `--webhook-path` y `--webhook-url`.
8. Inicie el Gateway. Google Chat enviará solicitudes POST a la ruta del webhook (de forma predeterminada, `/googlechat`).

## Adición a Google Chat

Cuando el Gateway esté en ejecución y su correo electrónico figure en la lista de visibilidad:

1. Vaya a [Google Chat](https://chat.google.com/).
2. Haga clic en el icono **+** (más) junto a **Direct Messages**.
3. Busque el **App name** que configuró en Google Cloud Console.
   - El bot _no_ aparece en la lista de exploración de Marketplace porque es una aplicación privada; búsquelo por su nombre.
4. Seleccione el bot, haga clic en **Add** o **Chat** y envíe un mensaje.

## URL pública (solo Webhook)

Los webhooks de Google Chat requieren un endpoint HTTPS público. Por seguridad, exponga a Internet **únicamente la ruta `/googlechat`** y mantenga privados el panel de OpenClaw y los demás endpoints.

### Opción A: Tailscale Funnel (recomendada)

Utilice Tailscale Serve para el panel privado y Funnel para la ruta pública del webhook.

1. Compruebe a qué dirección está vinculado el Gateway:

   ```bash
   ss -tlnp | grep 18789
   ```

   Anote la IP (por ejemplo, `127.0.0.1`, `0.0.0.0` o una dirección de Tailscale `100.x.x.x`).

2. Exponga el panel únicamente a la tailnet (puerto 8443):

   ```bash
   # Si está vinculado a localhost (127.0.0.1 o 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Si está vinculado únicamente a una IP de Tailscale:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Exponga públicamente solo la ruta del webhook:

   ```bash
   # Si está vinculado a localhost (127.0.0.1 o 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Si está vinculado únicamente a una IP de Tailscale:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Si se le solicita, visite la URL de autorización mostrada en la salida para habilitar Funnel en este Node.

5. Verifique:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

La URL pública del webhook es `https://<node-name>.<tailnet>.ts.net/googlechat`; el panel permanece accesible únicamente desde la tailnet en `https://<node-name>.<tailnet>.ts.net:8443/`. Utilice la URL pública (sin `:8443`) en la configuración de la aplicación de Google Chat.

> Nota: Esta configuración persiste tras los reinicios. Elimínela posteriormente con `tailscale funnel reset` y `tailscale serve reset`.

### Opción B: proxy inverso (Caddy)

Redirija únicamente la ruta del webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Las solicitudes a `your-domain.com/` se ignoran o devuelven 404, mientras que `your-domain.com/googlechat` se dirige a OpenClaw.

### Opción C: Cloudflare Tunnel

Configure las reglas de entrada del túnel para dirigir únicamente la ruta del webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Funcionamiento

1. Google Chat envía mediante POST datos JSON a la ruta del webhook del Gateway (solo POST, se requiere el tipo de contenido JSON y se limita la frecuencia por IP).
2. OpenClaw autentica cada solicitud antes de distribuirla:
   - Los eventos de la aplicación de Chat incluyen `Authorization: Bearer <token>`; el token se verifica antes de analizar el cuerpo completo.
   - Los eventos del complemento de Google Workspace incluyen el token en el cuerpo (`authorizationEventObject.systemIdToken`) y se leen con un presupuesto previo a la autenticación más estricto (16 KB, 3 s) antes de la verificación.
3. El token se comprueba con `audienceType` + `audience`:
   - `audienceType: "app-url"` → la audiencia es la URL HTTPS del webhook.
   - `audienceType: "project-number"` → la audiencia es el número del proyecto de Cloud.
   - Los tokens de complementos bajo `app-url` requieren además que `appPrincipal` esté establecido en el ID de cliente OAuth 2.0 numérico de la aplicación (21 dígitos, no un correo electrónico); de lo contrario, la verificación falla y se registra una advertencia.
4. Los mensajes se enrutan por espacio:
   - Los espacios obtienen sesiones por espacio `agent:<agentId>:googlechat:group:<spaceId>`; las respuestas se envían al hilo del mensaje.
   - De forma predeterminada, los mensajes directos se agrupan en la sesión principal del agente; establezca `session.dmScope` para disponer de sesiones de mensajes directos por interlocutor (consulte [Sesión](/es/concepts/session)).
5. El acceso mediante mensajes directos utiliza el emparejamiento de forma predeterminada. Los remitentes desconocidos reciben un código de emparejamiento; apruébelo con:
   - `openclaw pairing approve googlechat <code>`
6. Los espacios de grupo requieren una @mención de forma predeterminada. Las menciones se detectan mediante las anotaciones `USER_MENTION` de Chat dirigidas a la aplicación; establezca `botUser` (por ejemplo, `users/1234567890`) si la detección necesita el nombre del recurso de usuario de la aplicación.
7. Cuando se inicia una aprobación de ejecución o de plugin desde Google Chat y se configura un aprobador estable `users/<id>`, OpenClaw publica una tarjeta de aprobación nativa (`cardsV2`) en el espacio o hilo de origen. Los botones de la tarjeta contienen tokens de devolución de llamada opacos; la solicitud manual `/approve <id> <decision>` aparece únicamente cuando la entrega nativa no está disponible.

### Durabilidad de la entrada

Tras autenticar la solicitud, OpenClaw elimina del almacenamiento el objeto de autorización del complemento y pone en cola de forma duradera los eventos `MESSAGE` de Google Chat antes de devolver `200`. Un fallo de persistencia devuelve `503`, lo que permite que Google Chat vuelva a intentarlo en lugar de confirmar un evento que podría perderse.

Los mensajes pendientes o reintentables sobreviven a un reinicio del Gateway, permanecen serializados por espacio y utilizan el nombre del recurso de mensaje de Google Chat para evitar entradas duplicadas en la cola mientras exista el registro de finalización activo o conservado. Las acciones que no son mensajes mantienen su ruta de webhook desacoplada existente y no reciben esta garantía de cola duradera. La entrega sigue siendo al menos una vez a través del límite entre la cola y el agente, por lo que un fallo durante la transferencia puede reproducir un turno.

## Destinos

Utilice estos identificadores para la entrega y las listas de permitidos:

- Mensajes directos: `users/<userId>` (recomendado).
- Espacios: `spaces/<spaceId>`.
- El correo electrónico sin procesar `name@example.com` es mutable y solo se utiliza para buscar coincidencias en la lista de permitidos cuando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` se trata como un ID de usuario, no como una entrada de correo electrónico de la lista de permitidos.
- Se aceptan y eliminan los prefijos `googlechat:`, `google-chat:` y `gchat:`.

## Aspectos destacados de la configuración

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // o serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // solo verificación de complementos; ID de cliente OAuth numérico
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // opcional; facilita la detección de menciones
      allowBots: false,
      dmPolicy: "pairing",
      allowFrom: ["users/1234567890"],
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Solo respuestas breves.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Notas:

- Credenciales de la cuenta de servicio: `serviceAccountFile` (ruta), `serviceAccount` (cadena JSON en línea u objeto) o `serviceAccountRef` (SecretRef de entorno/archivo). Las variables de entorno `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON en línea) y `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (ruta) solo se aplican a la cuenta predeterminada. Las configuraciones con varias cuentas utilizan `channels.googlechat.accounts.<id>` con las mismas claves, incluido `serviceAccountRef` por cuenta.
- La ruta predeterminada del webhook es `/googlechat` cuando `webhookPath` no está establecido; `webhookUrl` puede proporcionar la ruta en su lugar.
- Las claves de grupo deben ser identificadores de espacio estables (`spaces/<spaceId>`). Las claves de nombre visible están obsoletas y se registran como tales.
- `dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia de entidades principales mediante correos electrónicos mutables para las listas de permitidos (modo de compatibilidad de emergencia); doctor advierte sobre las entradas de correo electrónico.
- Las acciones de reacción de Google Chat no se exponen. El plugin utiliza autenticación mediante cuenta de servicio, mientras que los endpoints de reacciones de Google Chat requieren autenticación de usuario. La configuración existente `actions.reactions` se acepta por compatibilidad, pero no tiene ningún efecto.
- Las tarjetas de aprobación nativas utilizan clics en botones `cardsV2` de Google Chat, no eventos de reacción. Los aprobadores proceden de `allowFrom` o `defaultTo` y deben ser valores numéricos estables de `users/<id>`.
- Las acciones de mensajes exponen únicamente el texto `send`. La carga de archivos adjuntos de Google Chat requiere autenticación de usuario, mientras que este plugin utiliza autenticación mediante cuenta de servicio, por lo que la carga de archivos salientes no se expone.
- `typingIndicator`: `message` (predeterminado) publica un marcador de posición `_<Bot> is typing..._` y lo edita para convertirlo en la primera respuesta; `none` lo deshabilita; `reaction` requiere OAuth de usuario y actualmente recurre a `message`, con un error registrado, al usar autenticación mediante cuenta de servicio.
- Los archivos adjuntos entrantes (el primer archivo adjunto de cada mensaje) se descargan mediante la API de Chat en el pipeline multimedia, con un límite establecido por `mediaMaxMb` (predeterminado: 20).
- Los mensajes creados por bots se ignoran de forma predeterminada. Con `allowBots: true`, los mensajes de bots aceptados utilizan la [protección compartida contra bucles de bots](/es/channels/bot-loop-protection): configure `channels.defaults.botLoopProtection` y después sobrescríbalo con `channels.googlechat.botLoopProtection` o `channels.googlechat.groups.<space>.botLoopProtection`.

Detalles de referencia sobre secretos: [Gestión de secretos](/es/gateway/secrets).

## Solución de problemas

### 405 Método no permitido

Si el Explorador de registros de Google Cloud muestra errores como:

```text
código de estado: 405, frase de motivo: respuesta de error HTTP: HTTP/1.1 405 Método no permitido
```

El controlador del Webhook no está registrado. Causas comunes:

1. **Canal no configurado**: falta la sección `channels.googlechat`. Verifíquelo con:

   ```bash
   openclaw config get channels.googlechat
   ```

   Si devuelve "Ruta de configuración no encontrada", añada la configuración (consulte [Aspectos destacados de la configuración](#config-highlights)).

2. **Plugin no habilitado**: compruebe el estado del Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Si muestra "disabled", añada `plugins.entries.googlechat.enabled: true` a la configuración.

3. **Gateway no reiniciado** después de los cambios de configuración:

   ```bash
   openclaw gateway restart
   ```

Verifique que el canal esté en ejecución:

```bash
openclaw channels status
# Debería mostrar: Google Chat predeterminado: habilitado, configurado, ...
```

### Otros problemas

- `openclaw channels status --probe` muestra los errores de autenticación y la configuración de audiencia que falta (se requieren tanto `audience` como `audienceType`).
- Si no llega ningún mensaje, confirme la URL del Webhook de la aplicación de Chat y la configuración del activador.
- Si el filtrado por menciones bloquea las respuestas, establezca `botUser` en el nombre del recurso de usuario de la aplicación y compruebe `requireMention`.
- `openclaw logs --follow` mientras se envía un mensaje de prueba muestra si las solicitudes llegan al Gateway.

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Configuración del Gateway](/es/gateway/configuration)
- [Grupos](/es/channels/groups) — comportamiento de los chats grupales y filtrado por menciones
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
