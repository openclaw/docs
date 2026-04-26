---
read_when:
    - Trabajando en las funciones del canal de Microsoft Teams
summary: Estado de compatibilidad, capacidades y configuración del bot de Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

Estado: se admiten texto y archivos adjuntos en mensajes directos; el envío de archivos en canales/grupos requiere `sharePointSiteId` + permisos de Graph (consulta [Envío de archivos en chats grupales](#sending-files-in-group-chats)). Las encuestas se envían mediante Adaptive Cards. Las acciones de mensajes exponen `upload-file` explícito para envíos centrados en archivos.

## Plugin incluido

Microsoft Teams se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que no se requiere una instalación independiente en la compilación empaquetada normal.

Si usas una compilación más antigua o una instalación personalizada que excluye Teams incluido, instálalo manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

La [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gestiona el registro del bot, la creación del manifiesto y la generación de credenciales con un solo comando.

**1. Instala e inicia sesión**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verifica que has iniciado sesión y ves la información de tu inquilino
```

> **Nota:** La Teams CLI está actualmente en versión preliminar. Los comandos y las opciones pueden cambiar entre versiones.

**2. Inicia un túnel** (Teams no puede acceder a localhost)

Instala y autentica la CLI de devtunnel si aún no lo has hecho ([guía de introducción](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Configuración única (URL persistente entre sesiones):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Cada sesión de desarrollo:
devtunnel host my-openclaw-bot
# Tu endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **Nota:** `--allow-anonymous` es obligatorio porque Teams no puede autenticarse con devtunnels. Cada solicitud entrante al bot sigue siendo validada automáticamente por el SDK de Teams.

Alternativas: `ngrok http 3978` o `tailscale funnel 3978` (pero estas pueden cambiar la URL en cada sesión).

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

La salida mostrará `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` y un **Teams App ID**; anótalos para los siguientes pasos. También ofrece instalar la aplicación directamente en Teams.

**4. Configura OpenClaw** con las credenciales de la salida:

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

`teams app create` te pedirá que instales la aplicación: selecciona "Install in Teams". Si lo omitiste, puedes obtener el enlace más tarde:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifica que todo funcione**

```bash
teams app doctor <teamsAppId>
```

Esto ejecuta diagnósticos sobre el registro del bot, la configuración de la aplicación AAD, la validez del manifiesto y la configuración de SSO.

Para despliegues de producción, considera usar [autenticación federada](#federated-authentication-certificate--managed-identity) (certificado o identidad administrada) en lugar de secretos de cliente.

Nota: los chats grupales están bloqueados de forma predeterminada (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respuestas en grupos, configura `channels.msteams.groupAllowFrom` (o usa `groupPolicy: "open"` para permitir a cualquier miembro, con control por mención).

## Objetivos

- Hablar con OpenClaw mediante mensajes directos, chats grupales o canales de Teams.
- Mantener el enrutamiento determinista: las respuestas siempre regresan al canal por el que llegaron.
- Usar un comportamiento seguro en canales de forma predeterminada (las menciones son obligatorias salvo que se configure lo contrario).

## Escrituras de configuración

De forma predeterminada, Microsoft Teams puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`).

Desactívalo con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Control de acceso (mensajes directos + grupos)

**Acceso a mensajes directos**

- Predeterminado: `channels.msteams.dmPolicy = "pairing"`. Los remitentes desconocidos se ignoran hasta que se aprueban.
- `channels.msteams.allowFrom` debe usar identificadores de objeto AAD estables.
- No dependas de coincidencias de UPN/nombre para listas permitidas: pueden cambiar. OpenClaw desactiva la coincidencia directa por nombre de forma predeterminada; actívala explícitamente con `channels.msteams.dangerouslyAllowNameMatching: true`.
- El asistente puede resolver nombres a IDs mediante Microsoft Graph cuando las credenciales lo permiten.

**Acceso a grupos**

- Predeterminado: `channels.msteams.groupPolicy = "allowlist"` (bloqueado a menos que añadas `groupAllowFrom`). Usa `channels.defaults.groupPolicy` para sobrescribir el valor predeterminado cuando no esté definido.
- `channels.msteams.groupAllowFrom` controla qué remitentes pueden activar el bot en chats grupales/canales (recurre a `channels.msteams.allowFrom`).
- Establece `groupPolicy: "open"` para permitir a cualquier miembro (con control por mención de forma predeterminada).
- Para no permitir **ningún canal**, establece `channels.msteams.groupPolicy: "disabled"`.

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

**Lista permitida de Teams + canales**

- Delimita las respuestas de grupos/canales enumerando los equipos y canales en `channels.msteams.teams`.
- Las claves deben usar IDs estables de equipo y IDs de conversación del canal.
- Cuando `groupPolicy="allowlist"` y existe una lista permitida de equipos, solo se aceptan los equipos/canales enumerados (con control por mención).
- El asistente de configuración acepta entradas `Team/Channel` y las guarda por ti.
- Al iniciar, OpenClaw resuelve nombres de equipo/canal y de usuario de las listas permitidas a IDs (cuando los permisos de Graph lo permiten)
  y registra la asignación; los nombres de equipo/canal no resueltos se mantienen tal como se escribieron, pero se ignoran para el enrutamiento de forma predeterminada, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esté activado.

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
<summary><strong>Configuración manual (sin la Teams CLI)</strong></summary>

Si no puedes usar la Teams CLI, puedes configurar el bot manualmente a través de Azure Portal.

### Cómo funciona

1. Asegúrate de que el plugin de Microsoft Teams esté disponible (incluido en las versiones actuales).
2. Crea un **Azure Bot** (App ID + secreto + tenant ID).
3. Compila un **paquete de aplicación de Teams** que haga referencia al bot e incluya los permisos RSC indicados abajo.
4. Carga/instala la aplicación de Teams en un equipo (o en ámbito personal para mensajes directos).
5. Configura `msteams` en `~/.openclaw/openclaw.json` (o variables de entorno) e inicia el Gateway.
6. El Gateway escucha tráfico webhook de Bot Framework en `/api/messages` de forma predeterminada.

### Paso 1: Crear Azure Bot

1. Ve a [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Rellena la pestaña **Basics**:

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | El nombre de tu bot, por ejemplo, `openclaw-msteams` (debe ser único) |
   | **Subscription**   | Selecciona tu suscripción de Azure                       |
   | **Resource group** | Crea uno nuevo o usa uno existente                       |
   | **Pricing tier**   | **Free** para desarrollo/pruebas                         |
   | **Type of App**    | **Single Tenant** (recomendado; consulta la nota a continuación) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Aviso de deprecación:** La creación de nuevos bots multiinquilino quedó obsoleta después del 2025-07-31. Usa **Single Tenant** para bots nuevos.

3. Haz clic en **Review + create** → **Create** (espera ~1-2 minutos)

### Paso 2: Obtener credenciales

1. Ve a tu recurso Azure Bot → **Configuration**
2. Copia **Microsoft App ID** → este es tu `appId`
3. Haz clic en **Manage Password** → ve al registro de la aplicación
4. En **Certificates & secrets** → **New client secret** → copia el **Value** → este es tu `appPassword`
5. Ve a **Overview** → copia **Directory (tenant) ID** → este es tu `tenantId`

### Paso 3: Configurar el endpoint de mensajería

1. En Azure Bot → **Configuration**
2. Establece **Messaging endpoint** en la URL de tu webhook:
   - Producción: `https://your-domain.com/api/messages`
   - Desarrollo local: usa un túnel (consulta [Desarrollo local](#local-development-tunneling) más abajo)

### Paso 4: Habilitar el canal de Teams

1. En Azure Bot → **Channels**
2. Haz clic en **Microsoft Teams** → Configure → Save
3. Acepta los Términos del servicio

### Paso 5: Compilar el manifiesto de la aplicación de Teams

- Incluye una entrada `bot` con `botId = <App ID>`.
- Ámbitos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obligatorio para manejar archivos en ámbito personal).
- Añade permisos RSC (consulta [Permisos RSC](#current-teams-rsc-permissions-manifest)).
- Crea iconos: `outline.png` (32x32) y `color.png` (192x192).
- Comprime los tres archivos juntos en un zip: `manifest.json`, `outline.png`, `color.png`.

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

El canal de Teams se inicia automáticamente cuando el plugin está disponible y existe configuración `msteams` con credenciales.

</details>

## Autenticación federada (certificado + identidad administrada)

> Añadido en 2026.3.24

Para despliegues de producción, OpenClaw admite **autenticación federada** como una alternativa más segura a los secretos de cliente. Hay dos métodos disponibles:

### Opción A: Autenticación basada en certificados

Usa un certificado PEM registrado en el registro de tu aplicación de Entra ID.

**Configuración:**

1. Genera u obtén un certificado (formato PEM con clave privada).
2. En Entra ID → Registro de aplicaciones → **Certificates & secrets** → **Certificates** → carga el certificado público.

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

### Opción B: Azure Managed Identity

Usa Azure Managed Identity para autenticación sin contraseña. Esto es ideal para despliegues en infraestructura de Azure (AKS, App Service, máquinas virtuales de Azure) donde haya una identidad administrada disponible.

**Cómo funciona:**

1. El pod/VM del bot tiene una identidad administrada (asignada por el sistema o por el usuario).
2. Una **credencial de identidad federada** vincula la identidad administrada con el registro de la aplicación de Entra ID.
3. En tiempo de ejecución, OpenClaw usa `@azure/identity` para adquirir tokens desde el endpoint Azure IMDS (`169.254.169.254`).
4. El token se pasa al SDK de Teams para la autenticación del bot.

**Requisitos previos:**

- Infraestructura de Azure con identidad administrada habilitada (AKS workload identity, App Service, VM)
- Credencial de identidad federada creada en el registro de la aplicación de Entra ID
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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo para identidad administrada asignada por el usuario)

### Configuración de AKS Workload Identity

Para despliegues de AKS que usen workload identity:

1. **Habilita workload identity** en tu clúster de AKS.
2. **Crea una credencial de identidad federada** en el registro de la aplicación de Entra ID:

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

4. **Etiqueta el pod** para la inyección de workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Asegura el acceso de red** a IMDS (`169.254.169.254`): si usas NetworkPolicy, añade una regla de salida que permita tráfico a `169.254.169.254/32` en el puerto 80.

### Comparación de tipos de autenticación

| Method               | Config                                         | Ventajas                           | Desventajas                           |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Configuración sencilla             | Requiere rotación de secretos, menos seguro |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | No hay secreto compartido por red  | Sobrecarga de gestión de certificados |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Sin contraseña, sin secretos que gestionar | Requiere infraestructura de Azure |

**Comportamiento predeterminado:** Cuando `authType` no está configurado, OpenClaw usa autenticación mediante secreto de cliente de forma predeterminada. Las configuraciones existentes siguen funcionando sin cambios.

## Desarrollo local (tunelización)

Teams no puede acceder a `localhost`. Usa un túnel de desarrollo persistente para que tu URL siga siendo la misma entre sesiones:

```bash
# Configuración única:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Cada sesión de desarrollo:
devtunnel host my-openclaw-bot
```

Alternativas: `ngrok http 3978` o `tailscale funnel 3978` (las URL pueden cambiar en cada sesión).

Si cambia la URL de tu túnel, actualiza el endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Probar el bot

**Ejecutar diagnósticos:**

```bash
teams app doctor <teamsAppId>
```

Comprueba el registro del bot, la aplicación AAD, el manifiesto y la configuración de SSO en una sola pasada.

**Enviar un mensaje de prueba:**

1. Instala la aplicación de Teams (usa el enlace de instalación de `teams app get <id> --install-link`)
2. Busca el bot en Teams y envíale un mensaje directo
3. Revisa los registros del Gateway para ver la actividad entrante

## Variables de entorno

Todas las claves de configuración también pueden establecerse mediante variables de entorno:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opcional: `"secret"` o `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federada + certificado)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcional, no requerido para autenticación)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federada + identidad administrada)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (solo identidad administrada asignada por el usuario)

## Acción de información de miembros

OpenClaw expone una acción `member-info` respaldada por Graph para Microsoft Teams, de modo que los agentes y las automatizaciones puedan resolver detalles de miembros del canal (nombre visible, correo electrónico, rol) directamente desde Microsoft Graph.

Requisitos:

- Permiso RSC `Member.Read.Group` (ya incluido en el manifiesto recomendado)
- Para búsquedas entre equipos: permiso de aplicación Graph `User.Read.All` con consentimiento de administrador

La acción está controlada por `channels.msteams.actions.memberInfo` (predeterminado: habilitada cuando hay credenciales de Graph disponibles).

## Contexto del historial

- `channels.msteams.historyLimit` controla cuántos mensajes recientes de canal/grupo se incorporan al prompt.
- Recurre a `messages.groupChat.historyLimit`. Establece `0` para desactivar (predeterminado 50).
- El historial de hilos recuperado se filtra según las listas permitidas de remitentes (`allowFrom` / `groupAllowFrom`), por lo que la inicialización de contexto del hilo solo incluye mensajes de remitentes permitidos.
- El contexto de archivos adjuntos citados (`ReplyTo*` derivado del HTML de respuesta de Teams) actualmente se pasa tal como se recibe.
- En otras palabras, las listas permitidas controlan quién puede activar al agente; hoy solo se filtran ciertas rutas específicas de contexto complementario.
- El historial de mensajes directos puede limitarse con `channels.msteams.dmHistoryLimit` (turnos del usuario). Anulaciones por usuario: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permisos RSC actuales de Teams (manifiesto)

Estos son los **permisos resourceSpecific existentes** en nuestro manifiesto de aplicación de Teams. Solo se aplican dentro del equipo/chat donde está instalada la aplicación.

**Para canales (ámbito de equipo):**

- `ChannelMessage.Read.Group` (Application) - recibir todo el texto de mensajes del canal sin @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats grupales:**

- `ChatMessage.Read.Chat` (Application) - recibir todos los mensajes de chats grupales sin @mention

Para añadir permisos RSC mediante la Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Ejemplo de manifiesto de Teams (con datos redactados)

Ejemplo mínimo y válido con los campos requeridos. Sustituye los ID y las URL.

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

### Advertencias sobre el manifiesto (campos obligatorios)

- `bots[].botId` **debe** coincidir con el Azure Bot App ID.
- `webApplicationInfo.id` **debe** coincidir con el Azure Bot App ID.
- `bots[].scopes` debe incluir las superficies que planeas usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` es obligatorio para la gestión de archivos en ámbito personal.
- `authorization.permissions.resourceSpecific` debe incluir permisos de lectura/envío en canales si quieres tráfico de canal.

### Actualizar una aplicación existente

Para actualizar una aplicación de Teams ya instalada (por ejemplo, para añadir permisos RSC):

```bash
# Descarga, edita y vuelve a cargar el manifiesto
teams app manifest download <teamsAppId> manifest.json
# Edita manifest.json localmente...
teams app manifest upload manifest.json <teamsAppId>
# La versión se incrementa automáticamente si el contenido cambió
```

Después de la actualización, reinstala la aplicación en cada equipo para que los nuevos permisos surtan efecto y **cierra Teams por completo y vuelve a iniciarlo** (no solo cierres la ventana) para borrar los metadatos en caché de la aplicación.

<details>
<summary>Actualización manual del manifiesto (sin CLI)</summary>

1. Actualiza tu `manifest.json` con la nueva configuración
2. **Incrementa el campo `version`** (por ejemplo, `1.0.0` → `1.1.0`)
3. **Vuelve a comprimir** el manifiesto con los iconos (`manifest.json`, `outline.png`, `color.png`)
4. Carga el nuevo zip:
   - **Teams Admin Center:** Teams apps → Manage apps → busca tu aplicación → Upload new version
   - **Sideload:** En Teams → Apps → Manage your apps → Upload a custom app

</details>

## Capacidades: solo RSC frente a Graph

### Con **solo Teams RSC** (aplicación instalada, sin permisos de la API de Graph)

Funciona:

- Leer el contenido de **texto** de mensajes del canal.
- Enviar contenido de **texto** de mensajes al canal.
- Recibir archivos adjuntos en **ámbito personal (DM)**.

NO funciona:

- **Contenido de imágenes o archivos** en canales/grupos (la carga útil solo incluye un stub HTML).
- Descargar archivos adjuntos almacenados en SharePoint/OneDrive.
- Leer el historial de mensajes (más allá del evento webhook en vivo).

### Con **Teams RSC + permisos de aplicación de Microsoft Graph**

Añade:

- Descargar contenido hospedado (imágenes pegadas en mensajes).
- Descargar archivos adjuntos almacenados en SharePoint/OneDrive.
- Leer el historial de mensajes de canales/chats mediante Graph.

### RSC frente a la API de Graph

| Capability              | Permisos RSC         | API de Graph                         |
| ----------------------- | -------------------- | ------------------------------------ |
| **Mensajes en tiempo real** | Sí (vía webhook)  | No (solo sondeo)                     |
| **Mensajes históricos** | No                   | Sí (puede consultar historial)       |
| **Complejidad de configuración** | Solo manifiesto de aplicación | Requiere consentimiento de administrador + flujo de tokens |
| **Funciona sin conexión** | No (debe estar en ejecución) | Sí (consulta en cualquier momento) |

**En resumen:** RSC es para escucha en tiempo real; la API de Graph es para acceso histórico. Para ponerse al día con mensajes perdidos mientras estabas sin conexión, necesitas la API de Graph con `ChannelMessage.Read.All` (requiere consentimiento de administrador).

## Medios + historial habilitados con Graph (obligatorio para canales)

Si necesitas imágenes/archivos en **canales** o quieres recuperar el **historial de mensajes**, debes habilitar permisos de Microsoft Graph y otorgar consentimiento de administrador.

1. En el **registro de aplicaciones** de Entra ID (Azure AD), añade permisos de **aplicación** de Microsoft Graph:
   - `ChannelMessage.Read.All` (archivos adjuntos e historial de canal)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chats grupales)
2. **Otorga consentimiento de administrador** para el inquilino.
3. Incrementa la **versión del manifiesto** de la aplicación de Teams, vuelve a cargarlo y **reinstala la aplicación en Teams**.
4. **Cierra Teams por completo y vuelve a iniciarlo** para borrar los metadatos en caché de la aplicación.

**Permiso adicional para menciones a usuarios:** Las menciones @ a usuarios funcionan de forma inmediata para usuarios de la conversación. Sin embargo, si quieres buscar y mencionar dinámicamente usuarios que **no estén en la conversación actual**, añade el permiso de aplicación `User.Read.All` y otorga consentimiento de administrador.

## Limitaciones conocidas

### Tiempos de espera del Webhook

Teams entrega mensajes mediante webhook HTTP. Si el procesamiento tarda demasiado (por ejemplo, respuestas lentas del LLM), puedes ver:

- Tiempos de espera del Gateway
- Teams reintentando el mensaje (causando duplicados)
- Respuestas descartadas

OpenClaw maneja esto respondiendo rápido y enviando respuestas de forma proactiva, pero las respuestas muy lentas aún pueden causar problemas.

### Formato

El markdown de Teams es más limitado que el de Slack o Discord:

- El formato básico funciona: **negrita**, _cursiva_, `code`, enlaces
- El markdown complejo (tablas, listas anidadas) puede no renderizarse correctamente
- Se admiten Adaptive Cards para encuestas y envíos de presentación semántica (consulta más abajo)

## Configuración

Ajustes clave (consulta `/gateway/configuration` para patrones compartidos de canales):

- `channels.msteams.enabled`: habilita/deshabilita el canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciales del bot.
- `channels.msteams.webhook.port` (predeterminado `3978`)
- `channels.msteams.webhook.path` (predeterminado `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing)
- `channels.msteams.allowFrom`: lista permitida de mensajes directos (se recomiendan IDs de objeto AAD). El asistente resuelve nombres a IDs durante la configuración cuando hay acceso a Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: interruptor de emergencia para volver a habilitar coincidencias mutables de UPN/nombre visible y el enrutamiento directo por nombre de equipo/canal.
- `channels.msteams.textChunkLimit`: tamaño de fragmento del texto saliente.
- `channels.msteams.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.msteams.mediaAllowHosts`: lista permitida de hosts para archivos adjuntos entrantes (predeterminada en dominios de Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista permitida de hosts para adjuntar encabezados Authorization en reintentos de medios (predeterminada en hosts de Graph + Bot Framework).
- `channels.msteams.requireMention`: requiere @mention en canales/grupos (predeterminado true).
- `channels.msteams.replyStyle`: `thread | top-level` (consulta [Estilo de respuesta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: anulación por equipo.
- `channels.msteams.teams.<teamId>.requireMention`: anulación por equipo.
- `channels.msteams.teams.<teamId>.tools`: anulaciones predeterminadas por equipo para la política de herramientas (`allow`/`deny`/`alsoAllow`) usadas cuando falta una anulación a nivel de canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: anulaciones predeterminadas por equipo y por remitente para la política de herramientas (se admite comodín `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: anulaciones por canal para la política de herramientas (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: anulaciones por canal y por remitente para la política de herramientas (se admite comodín `"*"`).
- Las claves de `toolsBySender` deben usar prefijos explícitos:
  `id:`, `e164:`, `username:`, `name:` (las claves heredadas sin prefijo siguen asignándose solo a `id:`).
- `channels.msteams.actions.memberInfo`: habilita o deshabilita la acción de información de miembros respaldada por Graph (predeterminado: habilitada cuando hay credenciales de Graph disponibles).
- `channels.msteams.authType`: tipo de autenticación — `"secret"` (predeterminado) o `"federated"`.
- `channels.msteams.certificatePath`: ruta al archivo de certificado PEM (federada + autenticación por certificado).
- `channels.msteams.certificateThumbprint`: huella digital del certificado (opcional, no requerida para autenticación).
- `channels.msteams.useManagedIdentity`: habilita autenticación con identidad administrada (modo federado).
- `channels.msteams.managedIdentityClientId`: ID de cliente para identidad administrada asignada por el usuario.
- `channels.msteams.sharePointSiteId`: ID del sitio de SharePoint para cargas de archivos en chats grupales/canales (consulta [Envío de archivos en chats grupales](#sending-files-in-group-chats)).

## Enrutamiento y sesiones

- Las claves de sesión siguen el formato estándar del agente (consulta [/concepts/session](/es/concepts/session)):
  - Los mensajes directos comparten la sesión principal (`agent:<agentId>:<mainKey>`).
  - Los mensajes de canal/grupo usan el ID de conversación:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de respuesta: hilos frente a publicaciones

Recientemente, Teams introdujo dos estilos de interfaz de canal sobre el mismo modelo de datos subyacente:

| Style                    | Descripción                                              | `replyStyle` recomendado |
| ------------------------ | -------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | Los mensajes aparecen como tarjetas con respuestas en hilo debajo | `thread` (predeterminado) |
| **Threads** (Slack-like) | Los mensajes fluyen linealmente, más parecido a Slack    | `top-level`              |

**El problema:** La API de Teams no expone qué estilo de interfaz usa un canal. Si usas el `replyStyle` incorrecto:

- `thread` en un canal con estilo Threads → las respuestas aparecen anidadas de forma extraña
- `top-level` en un canal con estilo Posts → las respuestas aparecen como publicaciones separadas de nivel superior en lugar de dentro del hilo

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

- **Mensajes directos:** Las imágenes y los archivos adjuntos funcionan mediante las API de archivos del bot de Teams.
- **Canales/grupos:** Los archivos adjuntos viven en el almacenamiento de M365 (SharePoint/OneDrive). La carga útil del webhook solo incluye un stub HTML, no los bytes reales del archivo. **Se requieren permisos de la API de Graph** para descargar archivos adjuntos de canales.
- Para envíos explícitos centrados en archivos, usa `action=upload-file` con `media` / `filePath` / `path`; `message` opcional se convierte en el texto/comentario adjunto y `filename` sobrescribe el nombre cargado.

Sin permisos de Graph, los mensajes de canal con imágenes se recibirán solo como texto (el contenido de la imagen no es accesible para el bot).
De forma predeterminada, OpenClaw solo descarga medios desde nombres de host de Microsoft/Teams. Sobrescribe esto con `channels.msteams.mediaAllowHosts` (usa `["*"]` para permitir cualquier host).
Los encabezados Authorization solo se adjuntan para hosts en `channels.msteams.mediaAuthAllowHosts` (predeterminado: hosts de Graph + Bot Framework). Mantén esta lista estricta (evita sufijos multiinquilino).

## Envío de archivos en chats grupales

Los bots pueden enviar archivos en mensajes directos usando el flujo FileConsentCard (integrado). Sin embargo, **enviar archivos en chats grupales/canales** requiere configuración adicional:

| Context                  | Cómo se envían los archivos                 | Configuración necesaria                         |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → el usuario acepta → el bot carga | Funciona de forma predeterminada          |
| **Chats grupales/canales** | Carga en SharePoint → compartir enlace    | Requiere `sharePointSiteId` + permisos de Graph |
| **Imágenes (cualquier contexto)** | Inline codificado en Base64        | Funciona de forma predeterminada                |

### Por qué los chats grupales necesitan SharePoint

Los bots no tienen una unidad personal de OneDrive (el endpoint de la API de Graph `/me/drive` no funciona para identidades de aplicación). Para enviar archivos en chats grupales/canales, el bot carga el archivo en un **sitio de SharePoint** y crea un enlace para compartirlo.

### Configuración

1. **Añade permisos de la API de Graph** en Entra ID (Azure AD) → Registro de aplicaciones:
   - `Sites.ReadWrite.All` (Application) - cargar archivos en SharePoint
   - `Chat.Read.All` (Application) - opcional, habilita enlaces para compartir por usuario

2. **Otorga consentimiento de administrador** para el inquilino.

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
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamiento al compartir

| Permission                              | Comportamiento al compartir                              |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` only              | Enlace para compartir en toda la organización (cualquiera en la organización puede acceder) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Enlace para compartir por usuario (solo los miembros del chat pueden acceder) |

El uso compartido por usuario es más seguro, ya que solo los participantes del chat pueden acceder al archivo. Si falta el permiso `Chat.Read.All`, el bot recurre al uso compartido en toda la organización.

### Comportamiento de respaldo

| Scenario                                          | Resultado                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat grupal + archivo + `sharePointSiteId` configurado | Carga en SharePoint, envía enlace para compartir |
| Chat grupal + archivo + sin `sharePointSiteId`    | Intenta carga en OneDrive (puede fallar), envía solo texto |
| Chat personal + archivo                           | Flujo FileConsentCard (funciona sin SharePoint)    |
| Cualquier contexto + imagen                       | Inline codificado en Base64 (funciona sin SharePoint) |

### Ubicación donde se almacenan los archivos

Los archivos cargados se almacenan en una carpeta `/OpenClawShared/` dentro de la biblioteca de documentos predeterminada del sitio de SharePoint configurado.

## Encuestas (Adaptive Cards)

OpenClaw envía encuestas de Teams como Adaptive Cards (no existe una API nativa de encuestas de Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Los votos los registra el Gateway en `~/.openclaw/msteams-polls.json`.
- El Gateway debe permanecer en línea para registrar los votos.
- Las encuestas aún no publican automáticamente resúmenes de resultados (inspecciona el archivo de almacenamiento si es necesario).

## Tarjetas de presentación

Envía cargas útiles de presentación semántica a usuarios o conversaciones de Teams usando la herramienta `message` o la CLI. OpenClaw las renderiza como Adaptive Cards de Teams a partir del contrato genérico de presentación.

El parámetro `presentation` acepta bloques semánticos. Cuando se proporciona `presentation`, el texto del mensaje es opcional.

**Herramienta del agente:**

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

Para conocer detalles del formato del destino, consulta [Formatos de destino](#target-formats) más abajo.

## Formatos de destino

Los destinos de MSTeams usan prefijos para distinguir entre usuarios y conversaciones:

| Tipo de destino      | Formato                         | Ejemplo                                             |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Usuario (por ID)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuario (por nombre) | `user:<display-name>`            | `user:John Smith` (requiere la API de Graph)        |
| Grupo/canal          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupo/canal (sin formato) | `<conversation-id>`         | `19:abc123...@thread.tacv2` (si contiene `@thread`) |

**Ejemplos de CLI:**

```bash
# Enviar a un usuario por ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Enviar a un usuario por nombre visible (activa la búsqueda en la API de Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Enviar a un chat grupal o canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Enviar una tarjeta de presentación a una conversación
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Ejemplos de herramientas del agente:**

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

Nota: Sin el prefijo `user:`, los nombres se interpretan de forma predeterminada como resolución de grupo/equipo. Usa siempre `user:` cuando te dirijas a personas por nombre visible.

## Mensajería proactiva

- Los mensajes proactivos solo son posibles **después** de que un usuario haya interactuado, porque en ese momento almacenamos las referencias de la conversación.
- Consulta `/gateway/configuration` para `dmPolicy` y el control mediante listas permitidas.

## ID de equipo y canal (error habitual)

El parámetro de consulta `groupId` en las URL de Teams **NO** es el ID de equipo usado para la configuración. Extrae los ID de la ruta de la URL en su lugar:

**URL de equipo:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID de equipo (decodifica la URL)
```

**URL de canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID de canal (decodifica la URL)
```

**Para la configuración:**

- ID de equipo = segmento de ruta después de `/team/` (URL decodificada, por ejemplo, `19:Bk4j...@thread.tacv2`)
- ID de canal = segmento de ruta después de `/channel/` (URL decodificada)
- **Ignora** el parámetro de consulta `groupId`

## Canales privados

Los bots tienen compatibilidad limitada en canales privados:

| Feature                      | Canales estándar | Canales privados      |
| ---------------------------- | ---------------- | --------------------- |
| Instalación del bot          | Sí               | Limitada              |
| Mensajes en tiempo real (webhook) | Sí         | Puede no funcionar    |
| Permisos RSC                 | Sí               | Pueden comportarse de forma diferente |
| @mentions                    | Sí               | Si el bot es accesible |
| Historial con API de Graph   | Sí               | Sí (con permisos)     |

**Soluciones alternativas si los canales privados no funcionan:**

1. Usa canales estándar para interacciones con el bot
2. Usa mensajes directos: los usuarios siempre pueden enviar mensajes directamente al bot
3. Usa la API de Graph para acceso histórico (requiere `ChannelMessage.Read.All`)

## Solución de problemas

### Problemas comunes

- **Las imágenes no se muestran en canales:** faltan permisos de Graph o consentimiento de administrador. Reinstala la aplicación de Teams y cierra/reabre Teams por completo.
- **No hay respuestas en el canal:** las menciones son obligatorias de forma predeterminada; establece `channels.msteams.requireMention=false` o configura esto por equipo/canal.
- **Desajuste de versión (Teams sigue mostrando el manifiesto antiguo):** elimina y vuelve a añadir la aplicación, y cierra Teams por completo para actualizarlo.
- **401 Unauthorized desde el Webhook:** es normal al probar manualmente sin Azure JWT; significa que el endpoint es accesible, pero la autenticación falló. Usa Azure Web Chat para probar correctamente.

### Errores al cargar el manifiesto

- **"Icon file cannot be empty":** el manifiesto hace referencia a archivos de icono que tienen 0 bytes. Crea iconos PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** la aplicación sigue instalada en otro equipo/chat. Búscala y desinstálala primero, o espera de 5 a 10 minutos a que se propague.
- **"Something went wrong" al cargar:** cárgalo a través de [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abre las DevTools del navegador (F12) → pestaña Network, y revisa el cuerpo de la respuesta para ver el error real.
- **Sideload falla:** prueba "Upload an app to your org's app catalog" en lugar de "Upload a custom app"; esto suele evitar las restricciones de sideload.

### Los permisos RSC no funcionan

1. Verifica que `webApplicationInfo.id` coincida exactamente con el App ID de tu bot
2. Vuelve a cargar la aplicación y reinstálala en el equipo/chat
3. Comprueba si el administrador de tu organización ha bloqueado los permisos RSC
4. Confirma que usas el ámbito correcto: `ChannelMessage.Read.Group` para equipos, `ChatMessage.Read.Chat` para chats grupales

## Referencias

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guía de configuración de Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - crear/gestionar aplicaciones de Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requiere Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI para la gestión de bots

## Relacionado

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
