---
read_when:
    - Trabajando en funciones del canal de Microsoft Teams
summary: Estado de compatibilidad del bot de Microsoft Teams, capacidades y configuración
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T13:58:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Abandonad toda esperanza, quienes entráis aquí."

Estado: se admiten texto + archivos adjuntos en MD; el envío de archivos en canales/grupos requiere `sharePointSiteId` + permisos de Graph (consulta [Envío de archivos en chats grupales](#sending-files-in-group-chats)). Las encuestas se envían mediante Adaptive Cards. Las acciones de mensaje exponen `upload-file` explícito para envíos centrados en archivos.

## Plugin integrado

Microsoft Teams se incluye como un Plugin integrado en las versiones actuales de OpenClaw, por lo que no se requiere una instalación independiente en la compilación empaquetada normal.

Si estás en una compilación antigua o en una instalación personalizada que excluye Teams integrado,
instálalo manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Pago local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin de Microsoft Teams esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden agregarlo manualmente con los comandos anteriores.
2. Crea un **Azure Bot** (App ID + secreto de cliente + tenant ID).
3. Configura OpenClaw con esas credenciales.
4. Expón `/api/messages` (puerto 3978 de forma predeterminada) mediante una URL pública o un túnel.
5. Instala el paquete de la aplicación de Teams e inicia el Gateway.

Configuración mínima (secreto de cliente):

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Para implementaciones en producción, considera usar [autenticación federada](#federated-authentication-certificate--managed-identity) (certificado o identidad administrada) en lugar de secretos de cliente.

Nota: los chats grupales están bloqueados de forma predeterminada (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respuestas en grupos, establece `channels.msteams.groupAllowFrom` (o usa `groupPolicy: "open"` para permitir a cualquier miembro, con restricción por mención).

## Objetivos

- Hablar con OpenClaw mediante MD de Teams, chats grupales o canales.
- Mantener el enrutamiento determinista: las respuestas siempre vuelven al canal del que llegaron.
- Usar un comportamiento seguro en canales de forma predeterminada (menciones obligatorias salvo que se configure lo contrario).

## Escrituras de configuración

De forma predeterminada, Microsoft Teams puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`).

Desactívalo con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Control de acceso (MD + grupos)

**Acceso a MD**

- Predeterminado: `channels.msteams.dmPolicy = "pairing"`. Los remitentes desconocidos se ignoran hasta que se aprueben.
- `channels.msteams.allowFrom` debe usar identificadores de objeto AAD estables.
- Los UPN/nombres para mostrar son mutables; la coincidencia directa está desactivada de forma predeterminada y solo se habilita con `channels.msteams.dangerouslyAllowNameMatching: true`.
- El asistente puede resolver nombres a ID mediante Microsoft Graph cuando las credenciales lo permitan.

**Acceso a grupos**

- Predeterminado: `channels.msteams.groupPolicy = "allowlist"` (bloqueado a menos que agregues `groupAllowFrom`). Usa `channels.defaults.groupPolicy` para sobrescribir el valor predeterminado cuando no esté establecido.
- `channels.msteams.groupAllowFrom` controla qué remitentes pueden activar en chats grupales/canales (recurre a `channels.msteams.allowFrom`).
- Establece `groupPolicy: "open"` para permitir a cualquier miembro (aun así, con restricción por mención de forma predeterminada).
- Para permitir **ningún canal**, establece `channels.msteams.groupPolicy: "disabled"`.

Ejemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + lista de permitidos de canales**

- Limita las respuestas en grupos/canales enumerando equipos y canales en `channels.msteams.teams`.
- Las claves deben usar ID estables de equipo e ID de conversación de canal.
- Cuando `groupPolicy="allowlist"` y hay una lista de permitidos de equipos presente, solo se aceptan los equipos/canales enumerados (con restricción por mención).
- El asistente de configuración acepta entradas `Equipo/Canal` y las almacena por ti.
- Al iniciar, OpenClaw resuelve nombres de equipos/canales y nombres de listas de permitidos de usuarios a ID (cuando los permisos de Graph lo permiten)
  y registra la asignación; los nombres de equipos/canales no resueltos se conservan tal como se escribieron, pero se ignoran para el enrutamiento de forma predeterminada, salvo que `channels.msteams.dangerouslyAllowNameMatching: true` esté habilitado.

Ejemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Cómo funciona

1. Asegúrate de que el Plugin de Microsoft Teams esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden agregarlo manualmente con los comandos anteriores.
2. Crea un **Azure Bot** (App ID + secreto + tenant ID).
3. Crea un **paquete de aplicación de Teams** que haga referencia al bot e incluya los permisos RSC a continuación.
4. Sube/instala la aplicación de Teams en un equipo (o en ámbito personal para MD).
5. Configura `msteams` en `~/.openclaw/openclaw.json` (o variables de entorno) e inicia el Gateway.
6. El Gateway escucha tráfico de Webhook de Bot Framework en `/api/messages` de forma predeterminada.

## Configuración de Azure Bot (requisitos previos)

Antes de configurar OpenClaw, debes crear un recurso de Azure Bot.

### Paso 1: crear Azure Bot

1. Ve a [Crear Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Completa la pestaña **Basics**:

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Your bot name, e.g., `openclaw-msteams` (must be unique) |
   | **Subscription**   | Select your Azure subscription                           |
   | **Resource group** | Create new or use existing                               |
   | **Pricing tier**   | **Free** for dev/testing                                 |
   | **Type of App**    | **Single Tenant** (recommended - see note below)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Aviso de desaprobación:** La creación de nuevos bots multiinquilino quedó desaprobada después del 2025-07-31. Usa **Single Tenant** para los bots nuevos.

3. Haz clic en **Review + create** → **Create** (espera ~1-2 minutos)

### Paso 2: obtener credenciales

1. Ve a tu recurso de Azure Bot → **Configuration**
2. Copia **Microsoft App ID** → este es tu `appId`
3. Haz clic en **Manage Password** → ve al registro de aplicaciones
4. En **Certificates & secrets** → **New client secret** → copia el **Value** → este es tu `appPassword`
5. Ve a **Overview** → copia **Directory (tenant) ID** → este es tu `tenantId`

### Paso 3: configurar el extremo de mensajería

1. En Azure Bot → **Configuration**
2. Establece **Messaging endpoint** en la URL de tu Webhook:
   - Producción: `https://your-domain.com/api/messages`
   - Desarrollo local: usa un túnel (consulta [Desarrollo local](#local-development-tunneling) a continuación)

### Paso 4: habilitar el canal de Teams

1. En Azure Bot → **Channels**
2. Haz clic en **Microsoft Teams** → Configure → Save
3. Acepta los términos de servicio

<a id="federated-authentication-certificate--managed-identity"></a>

## Autenticación federada (certificado + identidad administrada)

> Añadido en 2026.3.24

Para implementaciones en producción, OpenClaw admite **autenticación federada** como una alternativa más segura a los secretos de cliente. Hay dos métodos disponibles:

### Opción A: autenticación basada en certificados

Usa un certificado PEM registrado en el registro de aplicaciones de Entra ID.

**Configuración:**

1. Genera u obtén un certificado (formato PEM con clave privada).
2. En Entra ID → App Registration → **Certificates & secrets** → **Certificates** → sube el certificado público.

**Config:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variables de entorno:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opción B: Azure Managed Identity

Usa Azure Managed Identity para autenticación sin contraseña. Esto es ideal para implementaciones en infraestructura de Azure (AKS, App Service, Azure VM) donde hay una identidad administrada disponible.

**Cómo funciona:**

1. El pod/VM del bot tiene una identidad administrada (asignada por el sistema o por el usuario).
2. Una **credencial de identidad federada** vincula la identidad administrada al registro de aplicaciones de Entra ID.
3. En tiempo de ejecución, OpenClaw usa `@azure/identity` para adquirir tokens desde el extremo Azure IMDS (`169.254.169.254`).
4. El token se pasa al SDK de Teams para la autenticación del bot.

**Requisitos previos:**

- Infraestructura de Azure con identidad administrada habilitada (identidad de carga de trabajo de AKS, App Service, VM)
- Credencial de identidad federada creada en el registro de aplicaciones de Entra ID
- Acceso de red a IMDS (`169.254.169.254:80`) desde el pod/VM

**Config (identidad administrada asignada por el sistema):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Config (identidad administrada asignada por el usuario):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variables de entorno:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo para asignada por el usuario)

### Configuración de identidad de carga de trabajo de AKS

Para implementaciones de AKS que usan identidad de carga de trabajo:

1. **Habilita la identidad de carga de trabajo** en tu clúster de AKS.
2. **Crea una credencial de identidad federada** en el registro de aplicaciones de Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Anota la cuenta de servicio de Kubernetes** con el ID de cliente de la aplicación:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Etiqueta el pod** para la inyección de identidad de carga de trabajo:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Asegura el acceso de red** a IMDS (`169.254.169.254`) — si usas NetworkPolicy, agrega una regla de salida que permita tráfico a `169.254.169.254/32` en el puerto 80.

### Comparación de tipos de autenticación

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Simple setup                       | Secret rotation required, less secure |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | No shared secret over network      | Certificate management overhead       |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Passwordless, no secrets to manage | Azure infrastructure required         |

**Comportamiento predeterminado:** cuando `authType` no está establecido, OpenClaw usa autenticación con secreto de cliente de forma predeterminada. Las configuraciones existentes siguen funcionando sin cambios.

## Desarrollo local (túneles)

Teams no puede acceder a `localhost`. Usa un túnel para desarrollo local:

**Opción A: ngrok**

```bash
ngrok http 3978
# Copia la URL https, por ejemplo, https://abc123.ngrok.io
# Establece el extremo de mensajería en: https://abc123.ngrok.io/api/messages
```

**Opción B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Usa la URL de tu funnel de Tailscale como extremo de mensajería
```

## Teams Developer Portal (alternativa)

En lugar de crear manualmente un ZIP del manifiesto, puedes usar el [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Haz clic en **+ New app**
2. Completa la información básica (nombre, descripción, información del desarrollador)
3. Ve a **App features** → **Bot**
4. Selecciona **Enter a bot ID manually** y pega el App ID de tu Azure Bot
5. Marca los ámbitos: **Personal**, **Team**, **Group Chat**
6. Haz clic en **Distribute** → **Download app package**
7. En Teams: **Apps** → **Manage your apps** → **Upload a custom app** → selecciona el ZIP

Esto suele ser más fácil que editar manifiestos JSON a mano.

## Probar el bot

**Opción A: Azure Web Chat (primero verifica el Webhook)**

1. En Azure Portal → tu recurso de Azure Bot → **Test in Web Chat**
2. Envía un mensaje; deberías ver una respuesta
3. Esto confirma que tu extremo Webhook funciona antes de configurar Teams

**Opción B: Teams (después de instalar la aplicación)**

1. Instala la aplicación de Teams (carga local o catálogo de la organización)
2. Encuentra el bot en Teams y envíale un MD
3. Revisa los registros del Gateway para ver la actividad entrante

## Configuración (mínima, solo texto)

1. **Asegúrate de que el Plugin de Microsoft Teams esté disponible**
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden agregarlo manualmente:
     - Desde npm: `openclaw plugins install @openclaw/msteams`
     - Desde un pago local: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Registro del bot**
   - Crea un Azure Bot (consulta arriba) y toma nota de:
     - App ID
     - Secreto de cliente (contraseña de la aplicación)
     - Tenant ID (inquilino único)

3. **Manifiesto de la aplicación de Teams**
   - Incluye una entrada `bot` con `botId = <App ID>`.
   - Ámbitos: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (obligatorio para el manejo de archivos en ámbito personal).
   - Agrega permisos RSC (más abajo).
   - Crea iconos: `outline.png` (32x32) y `color.png` (192x192).
   - Comprime los tres archivos juntos: `manifest.json`, `outline.png`, `color.png`.

4. **Configura OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   También puedes usar variables de entorno en lugar de claves de configuración:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (opcional: `"secret"` o `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federada + certificado)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcional, no requerido para autenticación)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federada + identidad administrada)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (solo MI asignada por el usuario)

5. **Extremo del bot**
   - Establece el extremo de mensajería de Azure Bot en:
     - `https://<host>:3978/api/messages` (o tu ruta/puerto elegidos).

6. **Ejecuta el Gateway**
   - El canal de Teams se inicia automáticamente cuando el Plugin integrado o instalado manualmente está disponible y existe la configuración `msteams` con credenciales.

## Acción de información de miembros

OpenClaw expone una acción `member-info` respaldada por Graph para Microsoft Teams, de modo que los agentes y las automatizaciones puedan resolver detalles de miembros del canal (nombre para mostrar, correo electrónico, rol) directamente desde Microsoft Graph.

Requisitos:

- Permiso RSC `Member.Read.Group` (ya incluido en el manifiesto recomendado)
- Para búsquedas entre equipos: permiso de aplicación de Graph `User.Read.All` con consentimiento de administrador

La acción está controlada por `channels.msteams.actions.memberInfo` (predeterminado: habilitada cuando hay credenciales de Graph disponibles).

## Contexto del historial

- `channels.msteams.historyLimit` controla cuántos mensajes recientes de canal/grupo se envuelven en la indicación.
- Recurre a `messages.groupChat.historyLimit`. Establece `0` para desactivar (predeterminado 50).
- El historial de hilo recuperado se filtra por listas de permitidos de remitentes (`allowFrom` / `groupAllowFrom`), por lo que la siembra del contexto del hilo solo incluye mensajes de remitentes permitidos.
- El contexto de archivos adjuntos citados (`ReplyTo*` derivado del HTML de respuesta de Teams) actualmente se pasa tal como se recibe.
- En otras palabras, las listas de permitidos controlan quién puede activar el agente; hoy solo se filtran rutas concretas de contexto suplementario.
- El historial de MD puede limitarse con `channels.msteams.dmHistoryLimit` (turnos del usuario). Sobrescrituras por usuario: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permisos RSC actuales de Teams (manifiesto)

Estos son los **permisos resourceSpecific** existentes en nuestro manifiesto de la aplicación de Teams. Solo se aplican dentro del equipo/chat donde la aplicación está instalada.

**Para canales (ámbito de equipo):**

- `ChannelMessage.Read.Group` (Application) - recibir todos los mensajes del canal sin @mención
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats grupales:**

- `ChatMessage.Read.Chat` (Application) - recibir todos los mensajes del chat grupal sin @mención

## Ejemplo de manifiesto de Teams (censurado)

Ejemplo mínimo y válido con los campos obligatorios. Sustituye los ID y las URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Advertencias sobre el manifiesto (campos imprescindibles)

- `bots[].botId` **debe** coincidir con el App ID de Azure Bot.
- `webApplicationInfo.id` **debe** coincidir con el App ID de Azure Bot.
- `bots[].scopes` debe incluir las superficies que planeas usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` es obligatorio para el manejo de archivos en ámbito personal.
- `authorization.permissions.resourceSpecific` debe incluir lectura/envío de canal si quieres tráfico de canal.

### Actualizar una aplicación existente

Para actualizar una aplicación de Teams ya instalada (por ejemplo, para agregar permisos RSC):

1. Actualiza tu `manifest.json` con la nueva configuración
2. **Incrementa el campo `version`** (por ejemplo, `1.0.0` → `1.1.0`)
3. **Vuelve a comprimir** el manifiesto con los iconos (`manifest.json`, `outline.png`, `color.png`)
4. Sube el nuevo zip:
   - **Opción A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → busca tu aplicación → Upload new version
   - **Opción B (carga local):** En Teams → Apps → Manage your apps → Upload a custom app
5. **Para canales de equipo:** reinstala la aplicación en cada equipo para que los permisos nuevos surtan efecto
6. **Cierra Teams por completo y vuelve a abrirlo** (no basta con cerrar la ventana) para borrar los metadatos de aplicación en caché

## Capacidades: solo RSC frente a Graph

### Con **solo RSC de Teams** (aplicación instalada, sin permisos de la API de Graph)

Funciona:

- Leer contenido de **texto** de mensajes del canal.
- Enviar contenido de **texto** al canal.
- Recibir archivos adjuntos de **ámbito personal (MD)**.

No funciona:

- **Contenido de imagen o archivo** de canal/grupo (la carga útil solo incluye un fragmento HTML).
- Descargar archivos adjuntos almacenados en SharePoint/OneDrive.
- Leer el historial de mensajes (más allá del evento Webhook en vivo).

### Con **RSC de Teams + permisos de aplicación de Microsoft Graph**

Agrega:

- Descarga de contenidos alojados (imágenes pegadas en mensajes).
- Descarga de archivos adjuntos almacenados en SharePoint/OneDrive.
- Lectura del historial de mensajes de canal/chat mediante Graph.

### RSC frente a API de Graph

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Real-time messages**  | Yes (via webhook)    | No (polling only)                   |
| **Historical messages** | No                   | Yes (can query history)             |
| **Setup complexity**    | App manifest only    | Requires admin consent + token flow |
| **Works offline**       | No (must be running) | Yes (query anytime)                 |

**En resumen:** RSC es para escucha en tiempo real; la API de Graph es para acceso histórico. Para recuperar mensajes perdidos mientras estás sin conexión, necesitas la API de Graph con `ChannelMessage.Read.All` (requiere consentimiento de administrador).

## Medios + historial con Graph habilitado (obligatorio para canales)

Si necesitas imágenes/archivos en **canales** o quieres recuperar **historial de mensajes**, debes habilitar permisos de Microsoft Graph y conceder consentimiento de administrador.

1. En el **App Registration** de Entra ID (Azure AD), agrega permisos de **aplicación** de Microsoft Graph:
   - `ChannelMessage.Read.All` (archivos adjuntos + historial de canal)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chats grupales)
2. **Concede consentimiento de administrador** para el inquilino.
3. Incrementa la **versión del manifiesto** de la aplicación de Teams, vuelve a subirlo y **reinstala la aplicación en Teams**.
4. **Cierra Teams por completo y vuelve a abrirlo** para borrar los metadatos de aplicación en caché.

**Permiso adicional para menciones de usuario:** Las @menciones de usuario funcionan de inmediato para usuarios de la conversación. Sin embargo, si quieres buscar y mencionar dinámicamente a usuarios que **no están en la conversación actual**, agrega el permiso de aplicación `User.Read.All` y concede consentimiento de administrador.

## Limitaciones conocidas

### Tiempos de espera del Webhook

Teams entrega mensajes mediante Webhook HTTP. Si el procesamiento tarda demasiado (por ejemplo, respuestas lentas del LLM), puedes ver:

- Tiempos de espera del Gateway
- Teams reintentando el mensaje (causando duplicados)
- Respuestas descartadas

OpenClaw maneja esto respondiendo rápido y enviando respuestas de forma proactiva, pero las respuestas muy lentas aún pueden causar problemas.

### Formato

El Markdown de Teams es más limitado que el de Slack o Discord:

- El formato básico funciona: **negrita**, _cursiva_, `code`, enlaces
- El Markdown complejo (tablas, listas anidadas) puede no renderizarse correctamente
- Se admiten Adaptive Cards para encuestas y envíos de presentación semántica (consulta más abajo)

## Configuración

Ajustes clave (consulta `/gateway/configuration` para patrones compartidos de canales):

- `channels.msteams.enabled`: habilitar/deshabilitar el canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciales del bot.
- `channels.msteams.webhook.port` (predeterminado `3978`)
- `channels.msteams.webhook.path` (predeterminado `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing)
- `channels.msteams.allowFrom`: lista de permitidos de MD (se recomiendan ID de objeto AAD). El asistente resuelve nombres a ID durante la configuración cuando hay acceso a Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: interruptor de emergencia para volver a habilitar la coincidencia mutable por UPN/nombre para mostrar y el enrutamiento directo por nombre de equipo/canal.
- `channels.msteams.textChunkLimit`: tamaño de fragmento de texto saliente.
- `channels.msteams.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.msteams.mediaAllowHosts`: lista de permitidos para hosts de archivos adjuntos entrantes (predeterminada en dominios de Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista de permitidos para adjuntar encabezados Authorization en reintentos de medios (predeterminada en hosts de Graph + Bot Framework).
- `channels.msteams.requireMention`: requerir @mención en canales/grupos (predeterminado true).
- `channels.msteams.replyStyle`: `thread | top-level` (consulta [Estilo de respuesta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: sobrescritura por equipo.
- `channels.msteams.teams.<teamId>.requireMention`: sobrescritura por equipo.
- `channels.msteams.teams.<teamId>.tools`: sobrescrituras predeterminadas por equipo para políticas de herramientas (`allow`/`deny`/`alsoAllow`) usadas cuando falta una sobrescritura por canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: sobrescrituras predeterminadas por equipo y por remitente para políticas de herramientas (se admite el comodín `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: sobrescritura por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: sobrescritura por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: sobrescrituras de política de herramientas por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: sobrescrituras de política de herramientas por canal y por remitente (se admite el comodín `"*"`).
- Las claves de `toolsBySender` deben usar prefijos explícitos:
  `id:`, `e164:`, `username:`, `name:` (las claves heredadas sin prefijo siguen asignándose solo a `id:`).
- `channels.msteams.actions.memberInfo`: habilitar o deshabilitar la acción de información de miembros respaldada por Graph (predeterminado: habilitada cuando hay credenciales de Graph disponibles).
- `channels.msteams.authType`: tipo de autenticación — `"secret"` (predeterminado) o `"federated"`.
- `channels.msteams.certificatePath`: ruta al archivo de certificado PEM (federada + autenticación por certificado).
- `channels.msteams.certificateThumbprint`: huella digital del certificado (opcional, no requerida para autenticación).
- `channels.msteams.useManagedIdentity`: habilitar autenticación con identidad administrada (modo federado).
- `channels.msteams.managedIdentityClientId`: ID de cliente para identidad administrada asignada por el usuario.
- `channels.msteams.sharePointSiteId`: ID del sitio de SharePoint para cargas de archivos en chats grupales/canales (consulta [Envío de archivos en chats grupales](#sending-files-in-group-chats)).

## Enrutamiento y sesiones

- Las claves de sesión siguen el formato estándar de agente (consulta [/concepts/session](/es/concepts/session)):
  - Los mensajes directos comparten la sesión principal (`agent:<agentId>:<mainKey>`).
  - Los mensajes de canal/grupo usan el ID de conversación:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de respuesta: hilos frente a publicaciones

Teams introdujo recientemente dos estilos de interfaz de canal sobre el mismo modelo de datos subyacente:

| Style                    | Description                                               | Recommended `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | Messages appear as cards with threaded replies underneath | `thread` (default)       |
| **Threads** (Slack-like) | Messages flow linearly, more like Slack                   | `top-level`              |

**El problema:** La API de Teams no expone qué estilo de interfaz usa un canal. Si usas un `replyStyle` incorrecto:

- `thread` en un canal de estilo Threads → las respuestas aparecen anidadas de forma incómoda
- `top-level` en un canal de estilo Posts → las respuestas aparecen como publicaciones independientes de nivel superior en lugar de dentro del hilo

**Solución:** Configura `replyStyle` por canal según cómo esté configurado el canal:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Archivos adjuntos e imágenes

**Limitaciones actuales:**

- **MD:** Las imágenes y los archivos adjuntos funcionan mediante las API de archivos del bot de Teams.
- **Canales/grupos:** Los archivos adjuntos viven en el almacenamiento de M365 (SharePoint/OneDrive). La carga útil del Webhook solo incluye un fragmento HTML, no los bytes reales del archivo. **Se requieren permisos de la API de Graph** para descargar archivos adjuntos de canales.
- Para envíos explícitos centrados en archivos, usa `action=upload-file` con `media` / `filePath` / `path`; `message` opcional pasa a ser el texto/comentario adjunto, y `filename` sobrescribe el nombre cargado.

Sin permisos de Graph, los mensajes de canal con imágenes se recibirán solo como texto (el contenido de la imagen no es accesible para el bot).
De forma predeterminada, OpenClaw solo descarga medios desde nombres de host de Microsoft/Teams. Sobrescríbelo con `channels.msteams.mediaAllowHosts` (usa `["*"]` para permitir cualquier host).
Los encabezados Authorization solo se adjuntan para hosts incluidos en `channels.msteams.mediaAuthAllowHosts` (predeterminado: hosts de Graph + Bot Framework). Mantén esta lista estricta (evita sufijos multiinquilino).

## Envío de archivos en chats grupales

Los bots pueden enviar archivos en MD usando el flujo FileConsentCard (integrado). Sin embargo, **enviar archivos en chats grupales/canales** requiere configuración adicional:

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → user accepts → bot uploads | Works out of the box                            |
| **Group chats/channels** | Upload to SharePoint → share link            | Requires `sharePointSiteId` + Graph permissions |
| **Images (any context)** | Base64-encoded inline                        | Works out of the box                            |

### Por qué los chats grupales necesitan SharePoint

Los bots no tienen una unidad personal de OneDrive (el extremo `/me/drive` de la API de Graph no funciona para identidades de aplicación). Para enviar archivos en chats grupales/canales, el bot carga el archivo en un **sitio de SharePoint** y crea un enlace para compartirlo.

### Configuración

1. **Agrega permisos de la API de Graph** en Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - cargar archivos en SharePoint
   - `Chat.Read.All` (Application) - opcional, habilita enlaces para compartir por usuario

2. **Concede consentimiento de administrador** para el inquilino.

3. **Obtén el ID de tu sitio de SharePoint:**

   ```bash
   # Mediante Graph Explorer o curl con un token válido:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Ejemplo: para un sitio en "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # La respuesta incluye: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configura OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... otra configuración ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamiento al compartir

| Permission                              | Sharing behavior                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` only              | Organization-wide sharing link (anyone in org can access) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Per-user sharing link (only chat members can access)      |

Compartir por usuario es más seguro, ya que solo los participantes del chat pueden acceder al archivo. Si falta el permiso `Chat.Read.All`, el bot recurre a compartir en toda la organización.

### Comportamiento de respaldo

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Group chat + file + `sharePointSiteId` configured | Upload to SharePoint, send sharing link            |
| Group chat + file + no `sharePointSiteId`         | Attempt OneDrive upload (may fail), send text only |
| Personal chat + file                              | FileConsentCard flow (works without SharePoint)    |
| Any context + image                               | Base64-encoded inline (works without SharePoint)   |

### Ubicación donde se almacenan los archivos

Los archivos cargados se almacenan en una carpeta `/OpenClawShared/` dentro de la biblioteca de documentos predeterminada del sitio de SharePoint configurado.

## Encuestas (Adaptive Cards)

OpenClaw envía encuestas de Teams como Adaptive Cards (no existe una API nativa de encuestas en Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Los votos se registran en el Gateway en `~/.openclaw/msteams-polls.json`.
- El Gateway debe permanecer en línea para registrar votos.
- Las encuestas todavía no publican automáticamente resúmenes de resultados (inspecciona el archivo de almacenamiento si es necesario).

## Tarjetas de presentación

Envía cargas útiles de presentación semántica a usuarios o conversaciones de Teams usando la herramienta `message` o la CLI. OpenClaw las representa como Adaptive Cards de Teams a partir del contrato genérico de presentación.

El parámetro `presentation` acepta bloques semánticos. Cuando se proporciona `presentation`, el texto del mensaje es opcional.

**Herramienta de agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Para obtener detalles sobre el formato de destino, consulta [Formatos de destino](#target-formats) más abajo.

## Formatos de destino

Los destinos de MSTeams usan prefijos para distinguir entre usuarios y conversaciones:

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| User (by ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| User (by name)      | `user:<display-name>`            | `user:John Smith` (requires Graph API)              |
| Group/channel       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Group/channel (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (if contains `@thread`) |

**Ejemplos de CLI:**

```bash
# Enviar a un usuario por ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Enviar a un usuario por nombre para mostrar (activa la búsqueda en la API de Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Enviar a un chat grupal o canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Enviar una tarjeta de presentación a una conversación
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Ejemplos de herramientas de agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Nota: Sin el prefijo `user:`, los nombres se resuelven de forma predeterminada como grupo/equipo. Usa siempre `user:` cuando apuntes a personas por nombre para mostrar.

## Mensajería proactiva

- Los mensajes proactivos solo son posibles **después** de que un usuario haya interactuado, porque almacenamos referencias de conversación en ese momento.
- Consulta `/gateway/configuration` para `dmPolicy` y la restricción por lista de permitidos.

## ID de equipo y canal (problema habitual)

El parámetro de consulta `groupId` en las URL de Teams **NO** es el ID de equipo usado para la configuración. Extrae los ID de la ruta de la URL:

**URL de equipo:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID de equipo (decodifica esta URL)
```

**URL de canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID de canal (decodifica esta URL)
```

**Para la configuración:**

- ID de equipo = segmento de ruta después de `/team/` (decodificado de la URL, por ejemplo, `19:Bk4j...@thread.tacv2`)
- ID de canal = segmento de ruta después de `/channel/` (decodificado de la URL)
- **Ignora** el parámetro de consulta `groupId`

## Canales privados

Los bots tienen compatibilidad limitada en canales privados:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| Bot installation             | Yes               | Limited                |
| Real-time messages (webhook) | Yes               | May not work           |
| RSC permissions              | Yes               | May behave differently |
| @mentions                    | Yes               | If bot is accessible   |
| Graph API history            | Yes               | Yes (with permissions) |

**Soluciones alternativas si los canales privados no funcionan:**

1. Usa canales estándar para interacciones con el bot
2. Usa MD: los usuarios siempre pueden enviar mensajes directos al bot
3. Usa la API de Graph para acceso histórico (requiere `ChannelMessage.Read.All`)

## Solución de problemas

### Problemas comunes

- **Las imágenes no se muestran en canales:** faltan permisos de Graph o consentimiento de administrador. Reinstala la aplicación de Teams y cierra/reabre Teams por completo.
- **No hay respuestas en el canal:** las menciones son obligatorias de forma predeterminada; establece `channels.msteams.requireMention=false` o configura por equipo/canal.
- **Desajuste de versión (Teams sigue mostrando el manifiesto antiguo):** elimina y vuelve a agregar la aplicación, y cierra Teams por completo para actualizar.
- **401 Unauthorized desde el Webhook:** es normal al probar manualmente sin JWT de Azure; significa que el extremo es accesible, pero la autenticación falló. Usa Azure Web Chat para probar correctamente.

### Errores al subir el manifiesto

- **"Icon file cannot be empty":** El manifiesto hace referencia a archivos de icono de 0 bytes. Crea iconos PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** La aplicación sigue instalada en otro equipo/chat. Encuéntrala y desinstálala primero, o espera 5-10 minutos para la propagación.
- **"Something went wrong" al subir:** súbelo mediante [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abre las herramientas para desarrolladores del navegador (F12) → pestaña Network, y revisa el cuerpo de la respuesta para ver el error real.
- **Falló la carga local:** prueba con "Upload an app to your org's app catalog" en lugar de "Upload a custom app"; esto a menudo evita las restricciones de carga local.

### Los permisos RSC no funcionan

1. Verifica que `webApplicationInfo.id` coincida exactamente con el App ID de tu bot
2. Vuelve a subir la aplicación y reinstálala en el equipo/chat
3. Comprueba si el administrador de tu organización ha bloqueado los permisos RSC
4. Confirma que estás usando el ámbito correcto: `ChannelMessage.Read.Group` para equipos, `ChatMessage.Read.Chat` para chats grupales

## Referencias

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guía de configuración de Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - crear/administrar aplicaciones de Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requiere Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación por MD y flujo de Pairing
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y restricción por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
