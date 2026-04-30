---
read_when:
    - Trabajando en funciones del canal de Microsoft Teams
summary: Estado de soporte, capacidades y configuración del bot de Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T05:29:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

Estado: se admiten texto y adjuntos por DM; el envío de archivos en canales/grupos requiere `sharePointSiteId` + permisos de Graph (consulta [Envío de archivos en chats grupales](#sending-files-in-group-chats)). Las encuestas se envían mediante Adaptive Cards. Las acciones de mensaje exponen `upload-file` explícito para envíos centrados primero en archivos.

## Plugin incluido

Microsoft Teams se distribuye como plugin incluido en las versiones actuales de OpenClaw, así que no se requiere una instalación separada en la compilación empaquetada normal.

Si estás en una compilación anterior o una instalación personalizada que excluye Teams incluido, instala un paquete npm actual cuando haya uno publicado:

```bash
openclaw plugins install @openclaw/msteams
```

Si npm informa que el paquete propiedad de OpenClaw está obsoleto, usa una compilación empaquetada actual de OpenClaw o la ruta de checkout local hasta que se publique un paquete npm más reciente.

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gestiona el registro del bot, la creación del manifiesto y la generación de credenciales con un solo comando.

**1. Instala e inicia sesión**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
La CLI de Teams está actualmente en vista previa. Los comandos y las opciones pueden cambiar entre versiones.
</Note>

**2. Inicia un túnel** (Teams no puede acceder a localhost)

Instala y autentica la CLI de devtunnel si aún no lo has hecho ([guía de introducción](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` es obligatorio porque Teams no puede autenticarse con devtunnels. Cada solicitud entrante del bot sigue siendo validada automáticamente por el SDK de Teams.
</Note>

Alternativas: `ngrok http 3978` o `tailscale funnel 3978` (pero estas pueden cambiar las URL en cada sesión).

**3. Crea la aplicación**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Este único comando:

- Crea una aplicación de Entra ID (Azure AD)
- Genera un secreto de cliente
- Compila y carga un manifiesto de aplicación de Teams (con iconos)
- Registra el bot (gestionado por Teams de forma predeterminada; no se necesita suscripción de Azure)

La salida mostrará `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` y un **ID de aplicación de Teams**; anótalos para los pasos siguientes. También ofrece instalar la aplicación directamente en Teams.

**4. Configura OpenClaw** usando las credenciales de la salida:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

O usa variables de entorno directamente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Instala la aplicación en Teams**

`teams app create` te pedirá que instales la aplicación; selecciona "Instalar en Teams". Si lo omitiste, puedes obtener el enlace más tarde:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifica que todo funcione**

```bash
teams app doctor <teamsAppId>
```

Esto ejecuta diagnósticos sobre el registro del bot, la configuración de la aplicación AAD, la validez del manifiesto y la configuración de SSO.

Para despliegues de producción, considera usar [autenticación federada](/es/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificado o identidad administrada) en lugar de secretos de cliente.

<Note>
Los chats grupales están bloqueados de forma predeterminada (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respuestas de grupo, define `channels.msteams.groupAllowFrom` o usa `groupPolicy: "open"` para permitir a cualquier miembro (limitado por mención).
</Note>

## Objetivos

- Hablar con OpenClaw mediante DM, chats grupales o canales de Teams.
- Mantener el enrutamiento determinista: las respuestas siempre vuelven al canal por el que llegaron.
- Usar por defecto un comportamiento seguro en canales (menciones obligatorias salvo que se configure lo contrario).

## Escrituras de configuración

De forma predeterminada, Microsoft Teams puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`).

Desactívalo con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Control de acceso (DM + grupos)

**Acceso por DM**

- Valor predeterminado: `channels.msteams.dmPolicy = "pairing"`. Los remitentes desconocidos se ignoran hasta que se aprueben.
- `channels.msteams.allowFrom` debe usar IDs de objeto AAD estables.
- No dependas de coincidencias por UPN/nombre para mostrar en listas de permitidos; pueden cambiar. OpenClaw desactiva la coincidencia directa por nombre de forma predeterminada; actívala explícitamente con `channels.msteams.dangerouslyAllowNameMatching: true`.
- El asistente puede resolver nombres a IDs mediante Microsoft Graph cuando las credenciales lo permitan.

**Acceso de grupo**

- Valor predeterminado: `channels.msteams.groupPolicy = "allowlist"` (bloqueado salvo que agregues `groupAllowFrom`). Usa `channels.defaults.groupPolicy` para anular el valor predeterminado cuando no esté definido.
- `channels.msteams.groupAllowFrom` controla qué remitentes pueden activar en chats grupales/canales (recurre a `channels.msteams.allowFrom`).
- Define `groupPolicy: "open"` para permitir a cualquier miembro (aún limitado por mención de forma predeterminada).
- Para no permitir **ningún canal**, define `channels.msteams.groupPolicy: "disabled"`.

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

**Lista de permitidos de Teams + canales**

- Limita el alcance de las respuestas de grupo/canal listando equipos y canales en `channels.msteams.teams`.
- Las claves deben usar IDs de conversación de Teams estables desde enlaces de Teams, no nombres para mostrar mutables.
- Cuando `groupPolicy="allowlist"` y existe una lista de permitidos de equipos, solo se aceptan los equipos/canales listados (limitados por mención).
- El asistente de configuración acepta entradas `Team/Channel` y las almacena por ti.
- Al iniciarse, OpenClaw resuelve nombres de listas de permitidos de equipo/canal y usuario a IDs (cuando los permisos de Graph lo permiten)
  y registra el mapeo; los nombres de equipo/canal no resueltos se conservan tal como se escribieron, pero se ignoran para el enrutamiento de forma predeterminada salvo que `channels.msteams.dangerouslyAllowNameMatching: true` esté activado.

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

<details>
<summary><strong>Configuración manual (sin la CLI de Teams)</strong></summary>

Si no puedes usar la CLI de Teams, puedes configurar el bot manualmente mediante Azure Portal.

### Cómo funciona

1. Asegúrate de que el plugin de Microsoft Teams esté disponible (incluido en las versiones actuales).
2. Crea un **Azure Bot** (ID de aplicación + secreto + ID de inquilino).
3. Compila un **paquete de aplicación de Teams** que haga referencia al bot e incluya los permisos RSC siguientes.
4. Carga/instala la aplicación de Teams en un equipo (o ámbito personal para DM).
5. Configura `msteams` en `~/.openclaw/openclaw.json` (o variables de entorno) e inicia el Gateway.
6. El Gateway escucha tráfico Webhook de Bot Framework en `/api/messages` de forma predeterminada.

### Paso 1: Crear Azure Bot

1. Ve a [Crear Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Completa la pestaña **Conceptos básicos**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Identificador del bot** | El nombre de tu bot, por ejemplo, `openclaw-msteams` (debe ser único) |
   | **Suscripción**   | Selecciona tu suscripción de Azure                           |
   | **Grupo de recursos** | Crea uno nuevo o usa uno existente                               |
   | **Nivel de precios**   | **Gratis** para desarrollo/pruebas                                 |
   | **Tipo de aplicación**    | **Inquilino único** (recomendado; consulta la nota siguiente)         |
   | **Tipo de creación**  | **Crear nuevo ID de aplicación de Microsoft**                          |

<Warning>
La creación de nuevos bots multiinquilino quedó obsoleta después del 2025-07-31. Usa **Inquilino único** para bots nuevos.
</Warning>

3. Haz clic en **Revisar y crear** → **Crear** (espera aproximadamente 1-2 minutos)

### Paso 2: Obtener credenciales

1. Ve a tu recurso de Azure Bot → **Configuración**
2. Copia **ID de aplicación de Microsoft** → este es tu `appId`
3. Haz clic en **Administrar contraseña** → ve al registro de la aplicación
4. En **Certificados y secretos** → **Nuevo secreto de cliente** → copia el **Valor** → este es tu `appPassword`
5. Ve a **Información general** → copia **ID de directorio (inquilino)** → este es tu `tenantId`

### Paso 3: Configurar el endpoint de mensajería

1. En Azure Bot → **Configuración**
2. Define **Endpoint de mensajería** como tu URL de Webhook:
   - Producción: `https://your-domain.com/api/messages`
   - Desarrollo local: usa un túnel (consulta [Desarrollo local](#local-development-tunneling) más abajo)

### Paso 4: Habilitar el canal de Teams

1. En Azure Bot → **Canales**
2. Haz clic en **Microsoft Teams** → Configurar → Guardar
3. Acepta los Términos del Servicio

### Paso 5: Crear el manifiesto de aplicación de Teams

- Incluye una entrada `bot` con `botId = <App ID>`.
- Ámbitos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obligatorio para el manejo de archivos en ámbito personal).
- Agrega permisos RSC (consulta [Permisos RSC](#current-teams-rsc-permissions-manifest)).
- Crea iconos: `outline.png` (32x32) y `color.png` (192x192).
- Comprime los tres archivos juntos: `manifest.json`, `outline.png`, `color.png`.

### Paso 6: Configurar OpenClaw

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

Variables de entorno: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Paso 7: Ejecutar el Gateway

El canal de Teams se inicia automáticamente cuando el plugin está disponible y existe una configuración `msteams` con credenciales.

</details>

## Autenticación federada (certificado más identidad administrada)

> Agregado en 2026.4.11

Para despliegues de producción, OpenClaw admite **autenticación federada** como una alternativa más segura a los secretos de cliente. Hay dos métodos disponibles:

### Opción A: Autenticación basada en certificado

Usa un certificado PEM registrado con tu registro de aplicación de Entra ID.

**Configuración:**

1. Genera u obtén un certificado (formato PEM con clave privada).
2. En Entra ID → Registro de aplicación → **Certificados y secretos** → **Certificados** → Carga el certificado público.

**Configuración:**

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

### Opción B: Identidad administrada de Azure

Usa Azure Managed Identity para autenticación sin contraseña. Esto es ideal para despliegues en infraestructura de Azure (AKS, App Service, máquinas virtuales de Azure) donde haya una identidad administrada disponible.

**Cómo funciona:**

1. El pod/VM del bot tiene una identidad administrada (asignada por el sistema o asignada por el usuario).
2. Una **credencial de identidad federada** vincula la identidad administrada con el registro de aplicación de Entra ID.
3. En tiempo de ejecución, OpenClaw usa `@azure/identity` para adquirir tokens desde el endpoint IMDS de Azure (`169.254.169.254`).
4. El token se pasa al SDK de Teams para la autenticación del bot.

**Requisitos previos:**

- Infraestructura de Azure con identidad administrada habilitada (identidad de carga de trabajo de AKS, App Service, VM)
- Credencial de identidad federada creada en el registro de aplicación de Entra ID
- Acceso de red a IMDS (`169.254.169.254:80`) desde el pod/VM

**Configuración (identidad administrada asignada por el sistema):**

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

**Configuración (identidad administrada asignada por el usuario):**

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
2. **Crea una credencial de identidad federada** en el registro de aplicación de Entra ID:

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

5. **Asegura el acceso de red** a IMDS (`169.254.169.254`): si usas NetworkPolicy, agrega una regla de salida que permita el tráfico a `169.254.169.254/32` en el puerto 80.

### Comparación de tipos de autenticación

| Método                   | Configuración                                  | Ventajas                               | Desventajas                                      |
| ------------------------ | ---------------------------------------------- | -------------------------------------- | ------------------------------------------------ |
| **Secreto de cliente**   | `appPassword`                                  | Configuración sencilla                 | Requiere rotación de secretos, menos seguro      |
| **Certificado**          | `authType: "federated"` + `certificatePath`    | Sin secreto compartido por la red      | Sobrecarga de gestión de certificados            |
| **Identidad administrada** | `authType: "federated"` + `useManagedIdentity` | Sin contraseña, sin secretos que gestionar | Requiere infraestructura de Azure                |

**Comportamiento predeterminado:** Cuando `authType` no está definido, OpenClaw usa de forma predeterminada la autenticación con secreto de cliente. Las configuraciones existentes siguen funcionando sin cambios.

## Desarrollo local (túnel)

Teams no puede acceder a `localhost`. Usa un túnel de desarrollo persistente para que tu URL se mantenga igual entre sesiones:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternativas: `ngrok http 3978` o `tailscale funnel 3978` (las URL pueden cambiar en cada sesión).

Si la URL de tu túnel cambia, actualiza el endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Probar el bot

**Ejecuta diagnósticos:**

```bash
teams app doctor <teamsAppId>
```

Comprueba el registro del bot, la aplicación AAD, el manifiesto y la configuración de SSO en una sola pasada.

**Envía un mensaje de prueba:**

1. Instala la aplicación de Teams (usa el enlace de instalación de `teams app get <id> --install-link`)
2. Busca el bot en Teams y envía un DM
3. Revisa los registros del Gateway para ver la actividad entrante

## Variables de entorno

Todas las claves de configuración también se pueden establecer mediante variables de entorno:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opcional: `"secret"` o `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federado + certificado)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcional, no requerido para la autenticación)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federado + identidad administrada)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (solo MI asignada por el usuario)

## Acción de información de miembros

OpenClaw expone una acción `member-info` respaldada por Graph para Microsoft Teams, de modo que los agentes y las automatizaciones puedan resolver detalles de miembros del canal (nombre para mostrar, correo electrónico, rol) directamente desde Microsoft Graph.

Requisitos:

- Permiso RSC `Member.Read.Group` (ya incluido en el manifiesto recomendado)
- Para búsquedas entre equipos: permiso de aplicación de Graph `User.Read.All` con consentimiento de administrador

La acción está controlada por `channels.msteams.actions.memberInfo` (predeterminado: habilitada cuando hay credenciales de Graph disponibles).

## Contexto del historial

- `channels.msteams.historyLimit` controla cuántos mensajes recientes de canal/grupo se envuelven en el prompt.
- Recurre a `messages.groupChat.historyLimit`. Establece `0` para deshabilitarlo (predeterminado 50).
- El historial de hilos obtenido se filtra mediante listas de remitentes permitidos (`allowFrom` / `groupAllowFrom`), por lo que la inicialización de contexto de hilo solo incluye mensajes de remitentes permitidos.
- El contexto de adjuntos citados (`ReplyTo*` derivado del HTML de respuesta de Teams) actualmente se pasa tal como se recibe.
- En otras palabras, las listas de permitidos controlan quién puede activar el agente; hoy solo se filtran rutas específicas de contexto suplementario.
- El historial de DM se puede limitar con `channels.msteams.dmHistoryLimit` (turnos del usuario). Sobrescrituras por usuario: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permisos RSC actuales de Teams (manifiesto)

Estos son los **permisos resourceSpecific existentes** en nuestro manifiesto de aplicación de Teams. Solo se aplican dentro del equipo/chat donde está instalada la aplicación.

**Para canales (ámbito de equipo):**

- `ChannelMessage.Read.Group` (Application) - recibir todos los mensajes del canal sin @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats de grupo:**

- `ChatMessage.Read.Chat` (Application) - recibir todos los mensajes del chat de grupo sin @mention

Para agregar permisos RSC mediante la CLI de Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Ejemplo de manifiesto de Teams (redactado)

Ejemplo mínimo y válido con los campos requeridos. Reemplaza los ID y las URL.

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

### Advertencias del manifiesto (campos obligatorios)

- `bots[].botId` **debe** coincidir con el ID de aplicación del Azure Bot.
- `webApplicationInfo.id` **debe** coincidir con el ID de aplicación del Azure Bot.
- `bots[].scopes` debe incluir las superficies que planeas usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` es obligatorio para el manejo de archivos en el ámbito personal.
- `authorization.permissions.resourceSpecific` debe incluir lectura/envío de canales si quieres tráfico de canales.

### Actualizar una aplicación existente

Para actualizar una aplicación de Teams ya instalada (por ejemplo, para agregar permisos RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Después de actualizar, reinstala la aplicación en cada equipo para que los nuevos permisos surtan efecto y **sal completamente de Teams y vuelve a iniciarlo** (no solo cierres la ventana) para borrar los metadatos de aplicación en caché.

<details>
<summary>Actualización manual del manifiesto (sin CLI)</summary>

1. Actualiza tu `manifest.json` con la nueva configuración
2. **Incrementa el campo `version`** (por ejemplo, `1.0.0` → `1.1.0`)
3. **Vuelve a comprimir** el manifiesto con los iconos (`manifest.json`, `outline.png`, `color.png`)
4. Sube el nuevo zip:
   - **Centro de administración de Teams:** Aplicaciones de Teams → Administrar aplicaciones → busca tu aplicación → Subir nueva versión
   - **Carga lateral:** En Teams → Aplicaciones → Administrar tus aplicaciones → Subir una aplicación personalizada

</details>

## Capacidades: solo RSC frente a Graph

### Con **solo RSC de Teams** (aplicación instalada, sin permisos de Graph API)

Funciona:

- Leer contenido de **texto** de mensajes de canal.
- Enviar contenido de **texto** de mensajes de canal.
- Recibir adjuntos de archivos **personales (DM)**.

NO funciona:

- **Contenido de imágenes o archivos** de canal/grupo (la carga útil solo incluye un stub HTML).
- Descargar adjuntos almacenados en SharePoint/OneDrive.
- Leer historial de mensajes (más allá del evento Webhook en vivo).

### Con **RSC de Teams + permisos de aplicación de Microsoft Graph**

Agrega:

- Descargar contenido hospedado (imágenes pegadas en mensajes).
- Descargar adjuntos de archivos almacenados en SharePoint/OneDrive.
- Leer historial de mensajes de canal/chat mediante Graph.

### RSC frente a Graph API

| Capacidad                  | Permisos RSC         | Graph API                                     |
| -------------------------- | -------------------- | --------------------------------------------- |
| **Mensajes en tiempo real** | Sí (vía Webhook)     | No (solo sondeo)                              |
| **Mensajes históricos**    | No                   | Sí (puede consultar historial)                |
| **Complejidad de configuración** | Solo manifiesto de aplicación | Requiere consentimiento de administrador + flujo de token |
| **Funciona sin conexión**  | No (debe estar en ejecución) | Sí (consulta en cualquier momento)            |

**Conclusión:** RSC sirve para escuchar en tiempo real; Graph API sirve para acceso histórico. Para ponerte al día con mensajes perdidos mientras estabas sin conexión, necesitas Graph API con `ChannelMessage.Read.All` (requiere consentimiento de administrador).

## Medios e historial habilitados por Graph (requerido para canales)

Si necesitas imágenes/archivos en **canales** o quieres obtener **historial de mensajes**, debes habilitar permisos de Microsoft Graph y conceder consentimiento de administrador.

1. En **Registro de aplicación** de Entra ID (Azure AD), agrega **permisos de aplicación** de Microsoft Graph:
   - `ChannelMessage.Read.All` (adjuntos de canal + historial)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chats de grupo)
2. **Concede consentimiento de administrador** para el inquilino.
3. Incrementa la **versión del manifiesto** de la aplicación de Teams, vuelve a subirlo y **reinstala la aplicación en Teams**.
4. **Sal completamente de Teams y vuelve a iniciarlo** para borrar los metadatos de aplicación en caché.

**Permiso adicional para menciones de usuario:** Las @mentions de usuario funcionan de forma predeterminada para usuarios en la conversación. Sin embargo, si quieres buscar y mencionar dinámicamente a usuarios que **no están en la conversación actual**, agrega el permiso `User.Read.All` (Application) y concede consentimiento de administrador.

## Limitaciones conocidas

### Tiempos de espera del Webhook

Teams entrega mensajes mediante Webhook HTTP. Si el procesamiento tarda demasiado (por ejemplo, respuestas lentas de LLM), puedes ver:

- Tiempos de espera del Gateway
- Teams reintentando el mensaje (lo que provoca duplicados)
- Respuestas descartadas

OpenClaw gestiona esto devolviendo una respuesta rápidamente y enviando respuestas de forma proactiva, pero las respuestas muy lentas aún pueden causar problemas.

### Formato

El Markdown de Teams es más limitado que el de Slack o Discord:

- El formato básico funciona: **negrita**, _cursiva_, `code`, enlaces
- Es posible que el Markdown complejo (tablas, listas anidadas) no se renderice correctamente
- Las Adaptive Cards se admiten para encuestas y envíos de presentación semántica (consulta a continuación)

## Configuración

Ajustes clave (consulta `/gateway/configuration` para patrones de canales compartidos):

- `channels.msteams.enabled`: habilita/deshabilita el canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciales del bot.
- `channels.msteams.webhook.port` (predeterminado `3978`)
- `channels.msteams.webhook.path` (predeterminado `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing)
- `channels.msteams.allowFrom`: lista de permitidos de mensajes directos (se recomiendan IDs de objeto de AAD). El asistente resuelve nombres a IDs durante la configuración cuando el acceso a Graph está disponible.
- `channels.msteams.dangerouslyAllowNameMatching`: interruptor de emergencia para volver a habilitar la coincidencia mutable de UPN/nombre para mostrar y el enrutamiento directo por nombre de equipo/canal.
- `channels.msteams.textChunkLimit`: tamaño de fragmento de texto saliente.
- `channels.msteams.chunkMode`: `length` (predeterminado) o `newline` para dividir en líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.msteams.mediaAllowHosts`: lista de permitidos para hosts de adjuntos entrantes (predeterminada a dominios de Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista de permitidos para adjuntar encabezados Authorization en reintentos de medios (predeterminada a hosts de Graph + Bot Framework).
- `channels.msteams.requireMention`: requiere @mención en canales/grupos (predeterminado true).
- `channels.msteams.replyStyle`: `thread | top-level` (consulta [Estilo de respuesta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: anulación por equipo.
- `channels.msteams.teams.<teamId>.requireMention`: anulación por equipo.
- `channels.msteams.teams.<teamId>.tools`: anulaciones predeterminadas por equipo de la política de herramientas (`allow`/`deny`/`alsoAllow`) usadas cuando falta una anulación de canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: anulaciones predeterminadas por equipo y remitente de la política de herramientas (comodín `"*"` admitido).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: anulaciones por canal de la política de herramientas (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: anulaciones por canal y remitente de la política de herramientas (comodín `"*"` admitido).
- Las claves de `toolsBySender` deben usar prefijos explícitos:
  `id:`, `e164:`, `username:`, `name:` (las claves heredadas sin prefijo siguen asignándose solo a `id:`).
- `channels.msteams.actions.memberInfo`: habilita o deshabilita la acción de información de miembros respaldada por Graph (predeterminado: habilitada cuando hay credenciales de Graph disponibles).
- `channels.msteams.authType`: tipo de autenticación — `"secret"` (predeterminado) o `"federated"`.
- `channels.msteams.certificatePath`: ruta al archivo de certificado PEM (autenticación federada + certificado).
- `channels.msteams.certificateThumbprint`: huella digital del certificado (opcional, no requerida para la autenticación).
- `channels.msteams.useManagedIdentity`: habilita la autenticación con identidad administrada (modo federado).
- `channels.msteams.managedIdentityClientId`: ID de cliente para la identidad administrada asignada por el usuario.
- `channels.msteams.sharePointSiteId`: ID del sitio de SharePoint para cargas de archivos en chats grupales/canales (consulta [Enviar archivos en chats grupales](#sending-files-in-group-chats)).

## Enrutamiento y sesiones

- Las claves de sesión siguen el formato estándar del agente (consulta [/concepts/session](/es/concepts/session)):
  - Los mensajes directos comparten la sesión principal (`agent:<agentId>:<mainKey>`).
  - Los mensajes de canal/grupo usan el id de conversación:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de respuesta: hilos frente a publicaciones

Teams introdujo recientemente dos estilos de interfaz de canal sobre el mismo modelo de datos subyacente:

| Estilo                   | Descripción                                                  | `replyStyle` recomendado |
| ------------------------ | ------------------------------------------------------------ | ------------------------ |
| **Publicaciones** (clásico) | Los mensajes aparecen como tarjetas con respuestas en hilos debajo | `thread` (predeterminado) |
| **Hilos** (tipo Slack)   | Los mensajes fluyen linealmente, más parecido a Slack        | `top-level`              |

**El problema:** La API de Teams no expone qué estilo de interfaz usa un canal. Si usas el `replyStyle` incorrecto:

- `thread` en un canal con estilo Hilos → las respuestas aparecen anidadas de forma incómoda
- `top-level` en un canal con estilo Publicaciones → las respuestas aparecen como publicaciones independientes de nivel superior en lugar de dentro del hilo

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

## Adjuntos e imágenes

**Limitaciones actuales:**

- **Mensajes directos:** Las imágenes y los adjuntos de archivos funcionan mediante las API de archivos de bot de Teams.
- **Canales/grupos:** Los adjuntos residen en el almacenamiento de M365 (SharePoint/OneDrive). La carga útil del Webhook solo incluye un fragmento HTML, no los bytes reales del archivo. **Se requieren permisos de Graph API** para descargar adjuntos de canal.
- Para envíos explícitos donde el archivo va primero, usa `action=upload-file` con `media` / `filePath` / `path`; el `message` opcional se convierte en el texto/comentario adjunto, y `filename` anula el nombre cargado.

Sin permisos de Graph, los mensajes de canal con imágenes se recibirán solo como texto (el contenido de la imagen no es accesible para el bot).
De forma predeterminada, OpenClaw solo descarga medios desde nombres de host de Microsoft/Teams. Anula esto con `channels.msteams.mediaAllowHosts` (usa `["*"]` para permitir cualquier host).
Los encabezados Authorization solo se adjuntan para hosts en `channels.msteams.mediaAuthAllowHosts` (predeterminado a hosts de Graph + Bot Framework). Mantén esta lista estricta (evita sufijos multiinquilino).

## Enviar archivos en chats grupales

Los bots pueden enviar archivos en mensajes directos usando el flujo FileConsentCard (integrado). Sin embargo, **enviar archivos en chats grupales/canales** requiere configuración adicional:

| Contexto                 | Cómo se envían los archivos                    | Configuración necesaria                         |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------- |
| **Mensajes directos**    | FileConsentCard → el usuario acepta → el bot carga | Funciona de inmediato                           |
| **Chats grupales/canales** | Cargar a SharePoint → compartir enlace          | Requiere `sharePointSiteId` + permisos de Graph |
| **Imágenes (cualquier contexto)** | Codificadas en línea en Base64              | Funciona de inmediato                           |

### Por qué los chats grupales necesitan SharePoint

Los bots no tienen una unidad personal de OneDrive (el endpoint de Graph API `/me/drive` no funciona para identidades de aplicación). Para enviar archivos en chats grupales/canales, el bot los carga en un **sitio de SharePoint** y crea un enlace para compartir.

### Configuración

1. **Añade permisos de Graph API** en Entra ID (Azure AD) → Registro de aplicación:
   - `Sites.ReadWrite.All` (Application) - cargar archivos a SharePoint
   - `Chat.Read.All` (Application) - opcional, habilita enlaces para compartir por usuario

2. **Concede consentimiento de administrador** para el tenant.

3. **Obtén el ID de tu sitio de SharePoint:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configura OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamiento de uso compartido

| Permiso                                | Comportamiento de uso compartido                         |
| -------------------------------------- | -------------------------------------------------------- |
| Solo `Sites.ReadWrite.All`             | Enlace para compartir en toda la organización (cualquiera en la organización puede acceder) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Enlace para compartir por usuario (solo los miembros del chat pueden acceder) |

El uso compartido por usuario es más seguro porque solo los participantes del chat pueden acceder al archivo. Si falta el permiso `Chat.Read.All`, el bot recurre al uso compartido en toda la organización.

### Comportamiento de respaldo

| Escenario                                         | Resultado                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat grupal + archivo + `sharePointSiteId` configurado | Cargar a SharePoint, enviar enlace para compartir |
| Chat grupal + archivo + sin `sharePointSiteId`    | Intentar carga a OneDrive (puede fallar), enviar solo texto |
| Chat personal + archivo                           | Flujo FileConsentCard (funciona sin SharePoint)    |
| Cualquier contexto + imagen                       | Codificada en línea en Base64 (funciona sin SharePoint) |

### Ubicación de los archivos almacenados

Los archivos cargados se almacenan en una carpeta `/OpenClawShared/` en la biblioteca de documentos predeterminada del sitio de SharePoint configurado.

## Encuestas (Adaptive Cards)

OpenClaw envía encuestas de Teams como Adaptive Cards (no existe una API nativa de encuestas de Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Los votos los registra el Gateway en `~/.openclaw/msteams-polls.json`.
- El Gateway debe permanecer en línea para registrar votos.
- Las encuestas aún no publican automáticamente resúmenes de resultados (inspecciona el archivo de almacenamiento si es necesario).

## Tarjetas de presentación

Envía cargas útiles de presentación semántica a usuarios o conversaciones de Teams usando la herramienta `message` o la CLI. OpenClaw las renderiza como Teams Adaptive Cards desde el contrato de presentación genérico.

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

Para detalles sobre el formato de destino, consulta [Formatos de destino](#target-formats) a continuación.

## Formatos de destino

Los destinos de MSTeams usan prefijos para distinguir entre usuarios y conversaciones:

| Tipo de destino     | Formato                          | Ejemplo                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Usuario (por ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuario (por nombre) | `user:<display-name>`           | `user:John Smith` (requiere Graph API)              |
| Grupo/canal         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupo/canal (sin procesar) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (si contiene `@thread`) |

**Ejemplos de CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
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

<Note>
Sin el prefijo `user:`, los nombres usan de forma predeterminada la resolución de grupo o equipo. Usa siempre `user:` al dirigirte a personas por nombre para mostrar.
</Note>

## Mensajería proactiva

- Los mensajes proactivos solo son posibles **después** de que un usuario haya interactuado, porque almacenamos las referencias de conversación en ese momento.
- Consulta `/gateway/configuration` para `dmPolicy` y la restricción por lista de permitidos.

## ID de equipo y canal (problema habitual)

El parámetro de consulta `groupId` en las URL de Teams **NO** es el ID de equipo que se usa para la configuración. Extrae los ID desde la ruta de la URL en su lugar:

**URL de equipo:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID de conversación del equipo (decodifica esta URL)
```

**URL de canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID de canal (decodifica esta URL)
```

**Para la configuración:**

- Clave de equipo = segmento de ruta después de `/team/` (URL decodificada, por ejemplo, `19:Bk4j...@thread.tacv2`; los tenants antiguos pueden mostrar `@thread.skype`, que también es válido)
- Clave de canal = segmento de ruta después de `/channel/` (URL decodificada)
- **Ignora** el parámetro de consulta `groupId` para el enrutamiento de OpenClaw. Es el ID de grupo de Microsoft Entra, no el ID de conversación de Bot Framework usado en las actividades entrantes de Teams.

## Canales privados

Los bots tienen soporte limitado en canales privados:

| Función                         | Canales estándar | Canales privados                     |
| ------------------------------- | ---------------- | ------------------------------------ |
| Instalación del bot             | Sí               | Limitada                             |
| Mensajes en tiempo real (Webhook) | Sí             | Puede que no funcione                |
| Permisos RSC                    | Sí               | Pueden comportarse de forma distinta |
| @menciones                      | Sí               | Si el bot está accesible             |
| Historial de Graph API          | Sí               | Sí (con permisos)                    |

**Soluciones alternativas si los canales privados no funcionan:**

1. Usa canales estándar para las interacciones con el bot
2. Usa mensajes directos: los usuarios siempre pueden enviar mensajes directamente al bot
3. Usa Graph API para el acceso histórico (requiere `ChannelMessage.Read.All`)

## Solución de problemas

### Problemas comunes

- **Las imágenes no se muestran en los canales:** faltan permisos de Graph o consentimiento del administrador. Reinstala la aplicación de Teams y cierra Teams por completo y vuelve a abrirlo.
- **No hay respuestas en el canal:** las menciones son obligatorias de forma predeterminada; establece `channels.msteams.requireMention=false` o configúralo por equipo/canal.
- **Incompatibilidad de versiones (Teams sigue mostrando el manifiesto antiguo):** elimina y vuelve a agregar la aplicación, y cierra Teams por completo para actualizar.
- **401 Unauthorized desde el Webhook:** es lo esperado al probar manualmente sin Azure JWT: significa que se puede acceder al endpoint, pero falló la autenticación. Usa Azure Web Chat para probar correctamente.

### Errores de carga del manifiesto

- **"Icon file cannot be empty":** el manifiesto hace referencia a archivos de icono de 0 bytes. Crea iconos PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** la aplicación sigue instalada en otro equipo/chat. Búscala y desinstálala primero, o espera de 5 a 10 minutos para la propagación.
- **"Something went wrong" al cargar:** en su lugar, carga desde [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abre DevTools del navegador (F12) → pestaña Network y revisa el cuerpo de la respuesta para ver el error real.
- **Falla la instalación por sideload:** prueba "Upload an app to your org's app catalog" en lugar de "Upload a custom app"; esto suele evitar las restricciones de sideload.

### Los permisos RSC no funcionan

1. Verifica que `webApplicationInfo.id` coincida exactamente con el App ID de tu bot
2. Vuelve a cargar la aplicación y reinstálala en el equipo/chat
3. Comprueba si el administrador de tu organización ha bloqueado los permisos RSC
4. Confirma que estás usando el ámbito correcto: `ChannelMessage.Read.Group` para equipos, `ChatMessage.Read.Chat` para chats grupales

## Referencias

- [Crear Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guía de configuración de Azure Bot
- [Portal para desarrolladores de Teams](https://dev.teams.microsoft.com/apps) - crear/gestionar aplicaciones de Teams
- [Esquema del manifiesto de la aplicación de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Recibir mensajes de canal con RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referencia de permisos RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Manejo de archivos de bots de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requiere Graph)
- [Mensajería proactiva](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI de Teams para la gestión de bots

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por mensaje directo y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y fortalecimiento
