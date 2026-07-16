---
read_when:
    - Trabajo en las funciones del canal de Microsoft Teams
summary: Estado, capacidades y configuración de la compatibilidad con bots de Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T11:22:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

Estado: se admiten texto y archivos adjuntos en mensajes directos; el envío de archivos a canales/grupos requiere `sharePointSiteId` + permisos de Graph (consulte [Envío de archivos en chats grupales](#sending-files-in-group-chats)). Las encuestas se envían mediante tarjetas adaptables. Las acciones de mensajes exponen `upload-file` explícito para los envíos que comienzan con un archivo.

## Plugin incluido

Microsoft Teams se distribuye como Plugin incluido en las versiones actuales de OpenClaw; no se requiere una instalación independiente en la compilación empaquetada normal.

En una compilación anterior o una instalación personalizada que excluya el Teams incluido, instale directamente el paquete npm:

```bash
openclaw plugins install @openclaw/msteams
```

Use el paquete sin versión para seguir la etiqueta de la versión oficial actual. Fije una versión exacta solo cuando necesite una instalación reproducible.

Copia de trabajo local (ejecución desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gestiona el registro del bot, la creación del manifiesto y la generación de credenciales con un solo comando.

**1. Instalar e iniciar sesión**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # compruebe que ha iniciado sesión y consulte la información de su inquilino
```

<Note>
La CLI de Teams está actualmente en versión preliminar. Los comandos y las opciones pueden cambiar entre versiones.
</Note>

**2. Iniciar un túnel** (Teams no puede acceder a localhost)

Instale y autentique la CLI de devtunnel si es necesario ([guía de introducción](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Configuración única (URL persistente entre sesiones):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# En cada sesión de desarrollo:
devtunnel host my-openclaw-bot
# Su endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
Se requiere `--allow-anonymous` porque Teams no puede autenticarse con devtunnels. Cada solicitud entrante del bot sigue validándose mediante el SDK de Teams.
</Note>

Alternativas: `ngrok http 3978` o `tailscale funnel 3978` (las URL pueden cambiar en cada sesión).

**3. Crear la aplicación**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Esto crea una aplicación de Entra ID (Azure AD), genera un secreto de cliente, compila y carga un manifiesto de aplicación de Teams (con iconos) y registra un bot administrado por Teams (no se necesita una suscripción de Azure). La salida incluye `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` y un **Teams App ID**; también ofrece instalar la aplicación directamente en Teams.

**4. Configurar OpenClaw** con las credenciales de la salida:

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

También se pueden usar directamente las variables de entorno: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Instalar la aplicación en Teams**

`teams app create` solicita instalar la aplicación; seleccione "Install in Teams". Para obtener más adelante el enlace de instalación:

```bash
teams app get <teamsAppId> --install-link
```

**6. Comprobar que todo funciona**

```bash
teams app doctor <teamsAppId>
```

Ejecuta diagnósticos del registro del bot, la configuración de la aplicación AAD, la validez del manifiesto y la configuración de SSO.

Para producción, considere la [autenticación federada](#federated-authentication-certificate-plus-managed-identity) (certificado o identidad administrada) en lugar de secretos de cliente.

<Note>
Los chats grupales están bloqueados de forma predeterminada (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respuestas grupales, establezca `channels.msteams.groupAllowFrom` o use `groupPolicy: "open"` para permitir a cualquier miembro (con mención obligatoria).
</Note>

## Objetivos

- Comunicarse con OpenClaw mediante mensajes directos, chats grupales o canales de Teams.
- Mantener un enrutamiento determinista: las respuestas siempre regresan al canal del que proceden.
- Usar de forma predeterminada un comportamiento seguro en los canales (se requieren menciones salvo que se configure lo contrario).

## Escrituras de configuración

De forma predeterminada, Microsoft Teams puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`).

Desactívelas con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Control de acceso (mensajes directos + grupos)

**Acceso a mensajes directos**

- Valor predeterminado: `channels.msteams.dmPolicy = "pairing"`. Los remitentes desconocidos se ignoran hasta que se aprueban.
- `channels.msteams.allowFrom` debe usar identificadores de objeto AAD estables o grupos estáticos de acceso de remitentes, como `accessGroup:core-team`.
- No se debe depender de la coincidencia de UPN/nombre para mostrar en las listas de permitidos; pueden cambiar. OpenClaw desactiva de forma predeterminada la coincidencia directa de nombres; actívela mediante `channels.msteams.dangerouslyAllowNameMatching: true`.
- El asistente puede resolver nombres como identificadores mediante Microsoft Graph cuando las credenciales lo permiten.

**Acceso a grupos**

- Valor predeterminado: `channels.msteams.groupPolicy = "allowlist"` (bloqueado salvo que se añada `groupAllowFrom`). `channels.defaults.groupPolicy` puede reemplazar el valor predeterminado compartido cuando `channels.msteams.groupPolicy` no está establecido.
- `channels.msteams.groupAllowFrom` controla qué remitentes o grupos estáticos de acceso de remitentes pueden activar acciones en chats grupales/canales (recurre a `channels.msteams.allowFrom`).
- Establezca `groupPolicy: "open"` para permitir a cualquier miembro (de forma predeterminada, sigue siendo necesaria una mención).
- Para bloquear **todos** los canales, establezca `channels.msteams.groupPolicy: "disabled"`.

Ejemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Lista de equipos + canales permitidos**

- Limite las respuestas de grupos/canales mediante una lista de equipos y canales en `channels.msteams.teams`.
- Use como claves identificadores estables de conversaciones de Teams obtenidos de enlaces de Teams, no nombres para mostrar que puedan cambiar (consulte [Identificadores de equipos y canales](#team-and-channel-ids-common-gotcha)).
- Cuando `groupPolicy="allowlist"` y una lista de equipos permitidos están presentes, solo se aceptan los equipos/canales incluidos en la lista (con mención obligatoria).
- El asistente de configuración acepta entradas de `Team/Channel` y las almacena.
- Al iniciarse, OpenClaw resuelve como identificadores los nombres de equipos/canales y de las listas de usuarios permitidos (cuando los permisos de Graph lo permiten) y registra la correspondencia. Los nombres sin resolver se conservan tal como se escribieron, pero se ignoran para el enrutamiento salvo que se establezca `channels.msteams.dangerouslyAllowNameMatching: true`.

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

### Funcionamiento

1. Asegúrese de que el Plugin de Microsoft Teams esté disponible (incluido en las versiones actuales).
2. Cree un **Azure Bot** (identificador de aplicación + secreto + identificador de inquilino).
3. Compile un **paquete de aplicación de Teams** que haga referencia al bot e incluya los permisos de RSC indicados a continuación.
4. Cargue/instale la aplicación de Teams en un equipo (o en el ámbito personal para los mensajes directos).
5. Configure `msteams` en `~/.openclaw/openclaw.json` (o las variables de entorno) e inicie el Gateway.
6. El Gateway escucha de forma predeterminada el tráfico de Webhook de Bot Framework en `/api/messages`.

### Paso 1: Crear Azure Bot

1. Vaya a [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Complete la pestaña **Basics**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | El nombre del bot, p. ej., `openclaw-msteams` (debe ser único) |
   | **Subscription**   | Seleccione la suscripción de Azure                           |
   | **Resource group** | Cree uno nuevo o use uno existente                               |
   | **Pricing tier**   | **Free** para desarrollo/pruebas                                 |
   | **Type of App**    | **Single Tenant** (recomendado; consulte la nota siguiente)          |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
La creación de nuevos bots multiinquilino quedó obsoleta después del 2025-07-31. Use **Single Tenant** para los bots nuevos.
</Warning>

3. Haga clic en **Review + create** y después en **Create** (~1-2 minutos).

### Paso 2: Obtener las credenciales

1. Recurso Azure Bot → **Configuration** → copie **Microsoft App ID** (su `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → copie el **Value** (su `appPassword`).
3. **Overview** → copie **Directory (tenant) ID** (su `tenantId`).

### Paso 3: Configurar el endpoint de mensajería

1. Azure Bot → **Configuration**.
2. Establezca **Messaging endpoint**:
   - Producción: `https://your-domain.com/api/messages`
   - Desarrollo local: use un túnel (consulte [Desarrollo local](#local-development-tunneling))

### Paso 4: Habilitar el canal de Teams

1. Azure Bot → **Channels**.
2. Haga clic en **Microsoft Teams** → Configure → Save.
3. Acepte los términos de servicio.

### Paso 5: Compilar el manifiesto de la aplicación de Teams

- Incluya una entrada `bot` con `botId = <App ID>`.
- Ámbitos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (necesario para gestionar archivos en el ámbito personal).
- Añada permisos de RSC (consulte [Permisos de RSC](#current-teams-rsc-permissions-manifest)).
- Cree los iconos: `outline.png` (32x32) y `color.png` (192x192).
- Comprima juntos `manifest.json`, `outline.png` y `color.png`.

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

El canal de Teams se inicia automáticamente cuando el Plugin está disponible y la configuración de `msteams` contiene credenciales.

</details>

## Autenticación federada (certificado más identidad administrada)

Para producción, OpenClaw admite la **autenticación federada** como alternativa a los secretos de cliente, mediante `channels.msteams.authType: "federated"`. Hay dos métodos:

### Opción A: Autenticación basada en certificados

Use un certificado PEM registrado con el registro de la aplicación de Entra ID.

**Configuración:**

1. Genere u obtenga un certificado (formato PEM con clave privada).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → cargue el certificado público.

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

Use la identidad administrada de Azure para la autenticación sin contraseña en la infraestructura de Azure (AKS, App Service, máquinas virtuales de Azure).

**Funcionamiento:**

1. El pod o la máquina virtual del bot tiene una identidad administrada (asignada por el sistema o por el usuario).
2. Una credencial de identidad federada vincula la identidad administrada con el registro de la aplicación de Entra ID.
3. Durante la ejecución, OpenClaw usa `@azure/identity` para adquirir tokens del endpoint IMDS de Azure.
4. El token se pasa al SDK de Teams para autenticar el bot.

**Requisitos previos:**

- Infraestructura de Azure con identidad administrada habilitada (identidad de carga de trabajo de AKS, App Service, VM).
- Credencial de identidad federada creada en el registro de la aplicación de Entra ID.
- Acceso de red a IMDS (`169.254.169.254:80`) desde el pod/VM.

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

**Configuración (identidad administrada asignada por el usuario):** añada `managedIdentityClientId: "<MI_CLIENT_ID>"` al bloque anterior.

**Variables de entorno:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo para la asignada por el usuario)

### Configuración de la identidad de carga de trabajo de AKS

Para implementaciones de AKS que usen identidad de carga de trabajo:

1. **Habilite la identidad de carga de trabajo** en el clúster de AKS.
2. **Cree una credencial de identidad federada** en el registro de la aplicación de Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Anote la cuenta de servicio de Kubernetes** con el identificador de cliente de la aplicación:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Etiquete el pod** para la inyección de la identidad de carga de trabajo:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Permita el acceso de red** a IMDS (`169.254.169.254`): si se usa NetworkPolicy, añada una regla de salida para `169.254.169.254/32` en el puerto 80.

### Comparación de tipos de autenticación

| Método                           | Configuración                                  | Ventajas                                        | Desventajas                                             |
| -------------------------------- | ---------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| **Secreto de cliente**           | `appPassword`                             | Configuración sencilla                          | Requiere rotar el secreto; es menos seguro              |
| **Certificado**                  | `authType: "federated"` + `certificatePath`       | No se transmite ningún secreto compartido por red | Sobrecarga de gestión de certificados                 |
| **Identidad administrada**       | `authType: "federated"` + `useManagedIdentity`       | Sin contraseña ni secretos que gestionar        | Requiere infraestructura de Azure                       |

`certificateThumbprint` puede establecerse junto con `certificatePath`, pero actualmente la ruta de autenticación no lo lee; solo se acepta para compatibilidad futura.

**Valor predeterminado:** cuando `authType` no está definido, OpenClaw usa autenticación mediante secreto de cliente (`appPassword`). Las configuraciones existentes siguen funcionando sin cambios.

## Desarrollo local (túnel)

Teams no puede acceder a `localhost`. Use un túnel de desarrollo persistente para que la URL se mantenga estable entre sesiones:

```bash
# Configuración inicial:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Cada sesión de desarrollo:
devtunnel host my-openclaw-bot
```

Alternativas: `ngrok http 3978` o `tailscale funnel 3978` (las URL pueden cambiar en cada sesión).

Si cambia la URL del túnel, actualice el punto de conexión:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Prueba del bot

**Ejecute los diagnósticos:**

```bash
teams app doctor <teamsAppId>
```

Comprueba en una sola pasada el registro del bot, la aplicación de AAD, el manifiesto y la configuración de SSO.

**Envíe un mensaje de prueba:**

1. Instale la aplicación de Teams (enlace de instalación de `teams app get <id> --install-link`).
2. Busque el bot en Teams y envíele un mensaje directo.
3. Compruebe los registros del Gateway para ver la actividad entrante.

## Variables de entorno

Estas claves de configuración relacionadas con la autenticación pueden establecerse mediante variables de entorno en lugar de `openclaw.json` (otras claves de configuración, como `groupPolicy` o `historyLimit`, solo pueden definirse en la configuración):

| Variable de entorno                  | Clave de configuración     | Notas                                      |
| ------------------------------------ | -------------------------- | ------------------------------------------ |
| `MSTEAMS_APP_ID`                  | `appId`         |                                            |
| `MSTEAMS_APP_PASSWORD`                  | `appPassword`         |                                            |
| `MSTEAMS_TENANT_ID`                  | `tenantId`         |                                            |
| `MSTEAMS_AUTH_TYPE`                  | `authType`         | `"secret"` o `"federated"`   |
| `MSTEAMS_CERTIFICATE_PATH`                  | `certificatePath`         | federada + certificado                     |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                  | `certificateThumbprint`         | se acepta, pero no se requiere para autenticar |
| `MSTEAMS_USE_MANAGED_IDENTITY`                  | `useManagedIdentity`         | federada + identidad administrada          |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                  | `managedIdentityClientId`         | solo identidad administrada asignada por el usuario |

## Acción de información de miembros

OpenClaw expone una acción `member-info` respaldada por Graph para Microsoft Teams, de modo que los agentes y las automatizaciones puedan resolver los datos verificados de la lista de miembros de una conversación configurada.

Requisitos:

- Permisos RSC `ChannelSettings.Read.Group` y `TeamMember.Read.Group` (ya incluidos en el manifiesto recomendado).

La acción está disponible siempre que estén configuradas las credenciales de Graph; no hay ningún conmutador `channels.msteams.actions.memberInfo` independiente.
Las búsquedas en canales estándar devuelven la identidad coincidente de la lista de miembros del equipo, el nombre para mostrar, el correo electrónico y los roles.
En el mensaje directo o chat grupal actual, la acción puede devolver el identificador de usuario estable del remitente de confianza.
Las búsquedas de miembros en canales privados o compartidos y en chats distintos del actual requieren permisos adicionales sobre la lista de miembros
y se rechazan con el conjunto de permisos predeterminado.

## Contexto del historial

- `channels.msteams.historyLimit` controla cuántos mensajes recientes del canal o grupo se incorporan al prompt. Usa `messages.groupChat.historyLimit` como alternativa y, después, el valor predeterminado 50. Establezca `0` para deshabilitarlo.
- El historial obtenido del hilo se filtra mediante listas de remitentes permitidos (`allowFrom` / `groupAllowFrom`), por lo que la incorporación inicial del contexto del hilo solo incluye mensajes de remitentes permitidos.
- El contexto de los archivos adjuntos citados (analizado a partir del HTML del esquema Skype Reply en los archivos adjuntos propios de una respuesta) se transmite sin filtrar; actualmente, el filtro de la lista de remitentes permitidos solo se aplica a la incorporación inicial del historial del hilo.
- El historial de mensajes directos puede limitarse con `channels.msteams.dmHistoryLimit` (turnos del usuario). Anulaciones por usuario: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permisos RSC actuales de Teams (manifiesto)

Estos son los **permisos resourceSpecific existentes** en el manifiesto de nuestra aplicación de Teams. Solo se aplican dentro del equipo o chat donde está instalada la aplicación.

**Para canales (ámbito de equipo):**

- `ChannelMessage.Read.Group` (Aplicación): recibir todos los mensajes del canal sin @mención
- `ChannelMessage.Send.Group` (Aplicación)
- `Member.Read.Group` (Aplicación)
- `Owner.Read.Group` (Aplicación)
- `ChannelSettings.Read.Group` (Aplicación)
- `TeamMember.Read.Group` (Aplicación)
- `TeamSettings.Read.Group` (Aplicación)

**Para chats grupales:**

- `ChatMessage.Read.Chat` (Aplicación): recibir todos los mensajes del chat grupal sin @mención

Añada permisos RSC mediante la CLI de Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Ejemplo de manifiesto de Teams (censurado)

Ejemplo mínimo y válido con los campos obligatorios. Sustituya los identificadores y las URL.

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

### Consideraciones del manifiesto (campos imprescindibles)

- `bots[].botId` **debe** coincidir con el identificador de aplicación de Azure Bot.
- `webApplicationInfo.id` **debe** coincidir con el identificador de aplicación de Azure Bot.
- `bots[].scopes` debe incluir las superficies que se prevé usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` es obligatorio para gestionar archivos en el ámbito personal.
- `authorization.permissions.resourceSpecific` debe incluir la lectura y el envío en canales para el tráfico de canales.

### Actualización de una aplicación existente

```bash
# Descargar, editar y volver a cargar el manifiesto
teams app manifest download <teamsAppId> manifest.json
# Editar manifest.json localmente...
teams app manifest upload manifest.json <teamsAppId>
# La versión se incrementa automáticamente si cambia el contenido
```

Después de actualizar, vuelva a instalar la aplicación en cada equipo y **cierre Teams por completo y vuelva a iniciarlo** (no basta con cerrar la ventana) para borrar los metadatos de la aplicación almacenados en caché.

<details>
<summary>Actualización manual del manifiesto (sin CLI)</summary>

1. Actualice `manifest.json` con la nueva configuración.
2. **Incremente el campo `version`** (p. ej., `1.0.0` → `1.1.0`).
3. **Vuelva a crear el archivo zip** del manifiesto con los iconos (`manifest.json`, `outline.png`, `color.png`).
4. Cargue el nuevo archivo zip:
   - **Teams Admin Center:** Teams apps → Manage apps → busque su aplicación → Upload new version.
   - **Instalación local:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Capacidades: solo RSC frente a Graph

### Con **solo RSC de Teams** (aplicación instalada, sin permisos de la API de Graph)

Funciona:

- Leer el contenido de **texto** de los mensajes del canal.
- Enviar contenido de **texto** en mensajes del canal.
- Recibir archivos adjuntos **personales (mensajes directos)**.

No funciona:

- El contenido de **imágenes o archivos** de canales o grupos (la carga útil solo incluye un fragmento HTML).
- Descargar archivos adjuntos almacenados en SharePoint/OneDrive.
- Leer el historial de mensajes más allá del evento de Webhook en tiempo real.

### Con **RSC de Teams + permisos de aplicación de Microsoft Graph**

Añade:

- Descargar contenido hospedado (imágenes pegadas en los mensajes).
- Descargar archivos adjuntos almacenados en SharePoint/OneDrive.
- Leer el historial de mensajes de canales o chats mediante Graph.

### RSC frente a la API de Graph

| Capacidad                 | Permisos RSC              | Graph API                                     |
| ------------------------- | ------------------------- | --------------------------------------------- |
| **Mensajes en tiempo real** | Sí (mediante webhook)   | No (solo sondeo)                              |
| **Mensajes históricos**   | No                        | Sí (permite consultar el historial)           |
| **Complejidad de configuración** | Solo el manifiesto de la aplicación | Requiere consentimiento del administrador + flujo de tokens |
| **Funciona sin conexión** | No (debe estar en ejecución) | Sí (se puede consultar en cualquier momento) |

**En resumen:** RSC sirve para escuchar en tiempo real; Graph API sirve para acceder al historial. Para recuperar los mensajes perdidos mientras no había conexión, se necesita Graph API con `ChannelMessage.Read.All` (requiere consentimiento del administrador).

## Contenido multimedia e historial mediante Graph

Habilite únicamente los permisos de aplicación de Microsoft Graph necesarios para los ámbitos y datos de Teams que utilice:

1. Entra ID (Azure AD) **App Registration** → añada **Application permissions** de Graph:
   - `ChannelMessage.Read.All` para los archivos adjuntos y el historial de los canales.
   - `Chat.Read.All` para los archivos adjuntos y el historial de los chats grupales.
   - `Files.Read.All` cuando sea necesario descargar los bytes de los archivos adjuntos desde el almacenamiento de SharePoint/OneDrive; las configuraciones que solo utilizan el historial no lo necesitan.
2. Seleccione **Grant admin consent** para el inquilino.
3. Incremente la **versión del manifiesto** de la aplicación de Teams, vuelva a cargarla y **reinstale la aplicación en Teams**.
4. **Cierre Teams por completo y vuelva a iniciarlo** para borrar los metadatos de la aplicación almacenados en caché.

### Recuperación de archivos de canales y grupos (`graphMediaFallback`)

Teams puede eliminar los marcadores de archivos de la actividad HTML enviada a un bot. En ese caso, la actividad de Bot Framework no se puede distinguir de un mensaje HTML normal; la referencia completa del archivo adjunto solo existe en la copia del mensaje disponible mediante Graph.

Habilite el mecanismo alternativo después de conceder los permisos anteriores:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Esto se aplica únicamente a canales y chats grupales. Añade una consulta de mensajes de Graph cada vez que una actividad HTML no produce contenido multimedia que se pueda descargar directamente, incluidos los mensajes normales o que solo contienen menciones. El valor predeterminado es `false`, por lo que las instalaciones existentes no generan automáticamente tráfico adicional de Graph ni errores de permisos.

**Menciones de usuarios:** Las @menciones funcionan de forma predeterminada para los usuarios que ya participan en la conversación. Para buscar y mencionar dinámicamente a usuarios que **no participan en la conversación actual**, añada el permiso `User.Read.All` (Application) y conceda el consentimiento del administrador.

## Limitaciones conocidas

### Tiempos de espera de los webhooks

Teams entrega los mensajes mediante un webhook HTTP. OpenClaw aplica tiempos de espera fijos del servidor HTTP al receptor de ese webhook: 30 s de inactividad, 30 s para la solicitud completa y 15 s para recibir los encabezados. El enriquecimiento opcional del contenido multimedia entrante y del contexto dispone de un presupuesto compartido de 10 segundos, pero el SDK de Teams sigue esperando a que finalice el turno del agente antes de devolver la respuesta del webhook. Si el turno completo supera el intervalo de reintento de Teams, puede ocurrir lo siguiente:

- Teams vuelve a intentar enviar el mensaje, lo que provoca duplicados.
- Se pierden respuestas.

Las respuestas se envían de forma proactiva cuando responde el agente, pero las ejecuciones lentas del agente aún pueden provocar reintentos o duplicados en Teams.

### Compatibilidad con la nube de Teams y la URL del servicio

Esta ruta de Teams basada en el SDK se ha validado en vivo para la nube pública de Microsoft Teams.

Las respuestas entrantes utilizan el contexto del turno entrante del SDK de Teams. Las operaciones proactivas fuera de contexto —envíos, ediciones, eliminaciones, tarjetas, encuestas, mensajes de consentimiento para archivos y respuestas en cola de larga duración— utilizan la referencia de conversación almacenada `serviceUrl`. La nube pública utiliza de forma predeterminada el entorno de nube pública del SDK de Teams y permite referencias almacenadas en el host público de Teams Connector: `https://smba.trafficmanager.net/`.

La nube pública es la opción predeterminada. No es necesario establecer `channels.msteams.cloud` ni `channels.msteams.serviceUrl` para los bots normales de la nube pública.

Para las nubes de Teams que no sean públicas, establezca `cloud` y el límite proactivo correspondiente cuando Microsoft publique uno:

- `channels.msteams.cloud` selecciona el preajuste de nube del SDK de Teams para la autenticación, la validación de JWT, los servicios de tokens y el ámbito de Graph.
- `channels.msteams.serviceUrl` selecciona el límite del punto de conexión de Bot Connector utilizado para validar las referencias de conversación almacenadas antes de realizar envíos, ediciones, eliminaciones, tarjetas, encuestas, mensajes de consentimiento para archivos y respuestas en cola de larga duración de forma proactiva. Es obligatorio para las nubes USGov y DoD del SDK. Para China/21Vianet, OpenClaw utiliza el preajuste `China` del SDK y solo acepta URL de servicio almacenadas o configuradas en los hosts de canal de Azure China Bot Framework.

Microsoft publica los puntos de conexión globales proactivos de Bot Connector en la sección [Crear la conversación](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) de la documentación de mensajería proactiva de Teams. Utilice el `serviceUrl` de la actividad entrante cuando esté disponible; de lo contrario, utilice la tabla de Microsoft que aparece a continuación.

| Entorno de Teams | Configuración de OpenClaw                                 | `serviceUrl` proactivo                         |
| ---------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| Public            | no se necesita configuración de nube/serviceUrl           | `https://smba.trafficmanager.net/teams`                                   |
| GCC               | establezca `serviceUrl`; no existe un preajuste de nube independiente en el SDK de Teams | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                   | `https://smba.infra.gov.teams.microsoft.us/teams`                                   |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                   | `https://smba.infra.dod.teams.microsoft.us/teams`                                   |
| China/21Vianet    | `cloud: "China"`                                        | utilice el `serviceUrl` de la actividad entrante |

Ejemplo para GCC, donde Microsoft documenta una URL de servicio proactivo independiente, pero el SDK de Teams no ofrece un preajuste de nube independiente para GCC:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Ejemplo para GCC High:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` está restringido a los hosts compatibles de Microsoft Teams Bot Connector. Cuando se configura una URL de servicio, OpenClaw comprueba que el `serviceUrl` de la conversación almacenada utilice el mismo host antes de realizar envíos, ediciones, eliminaciones, tarjetas, encuestas o respuestas en cola de larga duración de forma proactiva. Con la configuración predeterminada de la nube pública, OpenClaw aplica un cierre seguro si una conversación almacenada apunta fuera del host público de Teams Connector. Después de cambiar la configuración de la nube o de la URL de servicio, reciba un mensaje nuevo de la conversación para que la referencia almacenada de la conversación esté actualizada.

China/21Vianet no dispone de una URL `smba` proactiva global independiente en la tabla de puntos de conexión proactivos de Teams de Microsoft. Configure `cloud: "China"` para que el SDK de Teams utilice los puntos de conexión de autenticación, tokens y JWT de Azure China. Los envíos proactivos requieren entonces una referencia de conversación almacenada procedente de una actividad entrante de Teams China, o una URL de servicio configurada explícitamente, dentro del límite de los canales de Azure China Bot Framework (`*.botframework.azure.cn`). Los asistentes de Teams basados en Graph están deshabilitados para `cloud: "China"` hasta que OpenClaw enrute las solicitudes de Graph mediante el punto de conexión de Graph de Azure China.

### Formato

El Markdown de Teams es más limitado que el de Slack o Discord:

- El formato básico funciona: **negrita**, _cursiva_, `code`, enlaces.
- Es posible que el Markdown complejo (tablas y listas anidadas) no se represente correctamente.
- Se admiten Adaptive Cards para encuestas y envíos de presentaciones semánticas (véase más adelante).

## Configuración

Opciones principales (consulte [/gateway/configuration](/es/gateway/configuration) para conocer los patrones compartidos de los canales):

- `channels.msteams.enabled`: habilita/deshabilita el canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciales del bot.
- `channels.msteams.cloud`: entorno de nube del SDK de Teams (`Public`, `USGov`, `USGovDoD` o `China`; valor predeterminado: `Public`). Se configura con `serviceUrl` para las nubes del SDK de USGov/DoD; China usa el valor preestablecido del SDK y las referencias de conversación almacenadas de Azure China Bot Framework, con los asistentes respaldados por Graph deshabilitados hasta que esté disponible el enrutamiento de Graph para Azure China.
- `channels.msteams.serviceUrl`: límite de la URL del servicio Bot Connector para las operaciones proactivas del SDK. La nube pública usa el valor predeterminado del SDK; se debe configurar para GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High o DoD. China acepta hosts de canal de Azure China Bot Framework cuando la referencia de conversación almacenada procede de Teams operado por 21Vianet.
- `channels.msteams.webhook.port` (valor predeterminado: `3978`).
- `channels.msteams.webhook.path` (valor predeterminado: `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (valor predeterminado: `pairing`).
- `channels.msteams.allowFrom`: lista de permitidos de mensajes directos (se recomiendan los identificadores de objeto de AAD). El asistente resuelve los nombres como identificadores durante la configuración cuando el acceso a Graph está disponible.
- `channels.msteams.dangerouslyAllowNameMatching`: conmutador de emergencia para volver a habilitar la coincidencia mutable por UPN/nombre para mostrar y el enrutamiento directo por nombre de equipo/canal.
- `channels.msteams.textChunkLimit`: tamaño de los fragmentos de texto saliente en caracteres (valor predeterminado: `4000`, con un límite máximo estricto de `4000`, independientemente de que se configure un valor superior).
- `channels.msteams.streaming.chunkMode`: `length` (valor predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.msteams.mediaAllowHosts`: lista de permitidos para los hosts de archivos adjuntos entrantes (de forma predeterminada, los dominios de Microsoft/Teams: Graph, SharePoint/OneDrive, CDN de Teams, Bot Framework y Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: lista de permitidos para adjuntar encabezados Authorization en los reintentos de contenido multimedia (de forma predeterminada, hosts de Graph y Bot Framework).
- `channels.msteams.graphMediaFallback`: habilita las consultas de mensajes mediante Graph cuando el HTML del canal/grupo omite los marcadores de archivos (valor predeterminado: `false`; consulte [Recuperación de archivos de canales/grupos](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: anulación por canal del límite de tamaño de contenido multimedia en MB. Si no se establece, se usa `agents.defaults.mediaMaxMb`.
- `channels.msteams.requireMention`: exige una @mención en canales/grupos (valor predeterminado: `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (consulte [Estilo de respuesta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: anulación por equipo.
- `channels.msteams.teams.<teamId>.requireMention`: anulación por equipo.
- `channels.msteams.teams.<teamId>.tools`: anulaciones predeterminadas por equipo de la política de herramientas (`allow`/`deny`/`alsoAllow`) que se usan cuando falta una anulación del canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: anulaciones predeterminadas por equipo y remitente de la política de herramientas (admite el comodín `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: anulaciones por canal de la política de herramientas (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: anulaciones por canal y remitente de la política de herramientas (admite el comodín `"*"`).
- Las claves de `toolsBySender` deben usar prefijos explícitos: `channel:`, `id:`, `e164:`, `username:`, `name:` (las claves heredadas sin prefijo siguen asignándose únicamente a `id:`).
- `channels.msteams.authType`: tipo de autenticación: `"secret"` (valor predeterminado) o `"federated"`.
- `channels.msteams.certificatePath`: ruta al archivo de certificado PEM (autenticación federada y mediante certificado).
- `channels.msteams.certificateThumbprint`: huella digital del certificado; se acepta, pero no es obligatoria para la autenticación.
- `channels.msteams.useManagedIdentity`: habilita la autenticación mediante identidad administrada (modo federado).
- `channels.msteams.managedIdentityClientId`: identificador de cliente de la identidad administrada asignada por el usuario.
- `channels.msteams.sharePointSiteId`: identificador del sitio de SharePoint para cargar archivos en chats grupales/canales (consulte [Envío de archivos en chats grupales](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card de bienvenida que se muestra en el primer contacto por mensaje directo/grupal y sus botones de instrucciones sugeridas.
- `channels.msteams.responsePrefix`: texto que se antepone a las respuestas salientes.
- `channels.msteams.feedbackEnabled` (valor predeterminado: `true`), `channels.msteams.feedbackReflection` (valor predeterminado: `true`), `channels.msteams.feedbackReflectionCooldownMs`: comentarios de aprobación/desaprobación en las respuestas y seguimiento de reflexión sobre los comentarios negativos.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: conexión OAuth de Bot Framework y ámbitos delegados de Graph para flujos respaldados por SSO; `sso.enabled: true` requiere `sso.connectionName`.

## Enrutamiento y sesiones

- Las claves de sesión siguen el formato estándar del agente (consulte [/concepts/session](/es/concepts/session)):
  - Los mensajes directos comparten la sesión principal (`agent:<agentId>:<mainKey>`).
  - Los mensajes de canales/grupos usan el identificador de conversación:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de respuesta: hilos frente a publicaciones

Teams tiene dos estilos de interfaz de canal sobre el mismo modelo de datos subyacente:

| Estilo                   | Descripción                                                    | `replyStyle` recomendado |
| ------------------------ | -------------------------------------------------------------- | ------------------------ |
| **Publicaciones** (clásico) | Los mensajes aparecen como tarjetas con respuestas en hilo debajo | `thread` (valor predeterminado) |
| **Hilos** (similar a Slack) | Los mensajes fluyen linealmente, de forma más parecida a Slack | `top-level` |

**El problema:** la API de Teams no expone qué estilo de interfaz usa un canal. Si se usa el `replyStyle` incorrecto:

- `thread` en un canal con estilo Hilos → las respuestas aparecen anidadas de forma incómoda.
- `top-level` en un canal con estilo Publicaciones → las respuestas aparecen como publicaciones independientes de nivel superior en lugar de dentro del hilo.

**Solución:** configure `replyStyle` por canal en función de cómo esté configurado el canal:

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

### Precedencia de resolución

Cuando el bot envía una respuesta a un canal, `replyStyle` se resuelve desde la anulación más específica hasta el valor predeterminado. Se usa el primer valor distinto de `undefined`:

1. **Por canal** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Por equipo** - `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** - `channels.msteams.replyStyle`
4. **Valor predeterminado implícito** - derivado de `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Si se establece `requireMention: false` globalmente sin un `replyStyle` explícito, las menciones en canales con estilo Publicaciones aparecen como publicaciones de nivel superior incluso cuando el mensaje entrante era una respuesta en hilo. Fije `replyStyle: "thread"` en el nivel global, de equipo o de canal para evitar sorpresas.

Para los envíos proactivos a una conversación de canal almacenada (respuestas en cola de llamadas a herramientas, agentes de larga duración), se aplica la misma resolución de equipo/canal; los chats grupales y las conversaciones personales (mensajes directos) siempre se resuelven como `top-level` para los envíos proactivos, independientemente de `replyStyle`.

### Conservación del contexto del hilo

Cuando `replyStyle: "thread"` está vigente y el bot recibió una @mención desde un hilo de canal, OpenClaw vuelve a adjuntar la raíz del hilo original a la referencia de conversación saliente (`19:...@thread.tacv2;messageid=<root>`) para que la respuesta llegue al mismo hilo. Esto se aplica tanto a los envíos en directo (durante el turno) como a los envíos proactivos realizados después de que haya expirado el contexto de turno de Bot Framework (por ejemplo, agentes de larga duración o respuestas en cola de llamadas a herramientas mediante `mcp__openclaw__message`).

La raíz del hilo se obtiene del `threadId` almacenado en la referencia de conversación. Las referencias almacenadas más antiguas, anteriores a `threadId`, recurren a `activityId` (la actividad entrante que inicializó por última vez la conversación), de modo que las implementaciones existentes sigan funcionando sin volver a inicializarse.

Cuando `replyStyle: "top-level"` está vigente, los mensajes entrantes de hilos de canal se responden intencionadamente como nuevas publicaciones de nivel superior; no se adjunta ningún sufijo de hilo. Esto es correcto para los canales con estilo Hilos; si aparecen publicaciones de nivel superior cuando se esperaban respuestas en hilo, `replyStyle` está configurado incorrectamente para ese canal.

## Archivos adjuntos e imágenes

**Limitaciones actuales:**

- **Mensajes directos:** las imágenes y los archivos adjuntos funcionan mediante las API de archivos de bot de Teams.
- **Canales/grupos:** los archivos adjuntos residen en el almacenamiento de M365 (SharePoint/OneDrive). La carga útil del Webhook solo incluye un fragmento de HTML, no los bytes reales del archivo. **Se requieren permisos de la API de Graph** para descargar archivos adjuntos de canales.
- Para envíos explícitos que priorizan el archivo, use `action=upload-file` con `media` / `filePath` / `path`; el `message` opcional se convierte en el texto/comentario adjunto, y `filename` (o `title`) anula el nombre del archivo cargado.

Sin permisos de Graph, los mensajes de canal con imágenes llegan solo como texto (el bot no puede acceder al contenido de la imagen).
De forma predeterminada, OpenClaw solo descarga contenido multimedia de nombres de host de Microsoft/Teams. Anule este comportamiento con `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir cualquier host).
Los encabezados Authorization solo se adjuntan para los hosts incluidos en `channels.msteams.mediaAuthAllowHosts` (de forma predeterminada, hosts de Graph y Bot Framework). Mantenga esta lista estricta (evite sufijos multiinquilino).

## Envío de archivos en chats grupales

Los bots pueden enviar archivos en mensajes directos mediante el flujo FileConsentCard integrado. **El envío de archivos en chats grupales/canales** requiere configuración adicional:

| Contexto                 | Cómo se envían los archivos                         | Configuración necesaria                         |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------- |
| **Mensajes directos**    | FileConsentCard → el usuario acepta → el bot carga | Funciona sin configuración adicional            |
| **Chats grupales/canales** | Carga en SharePoint → tarjeta de archivo nativa   | Requiere `sharePointSiteId` y permisos de Graph |
| **Imágenes (cualquier contexto)** | Codificadas en Base64 e insertadas en línea | Funciona sin configuración adicional            |

### Por qué los chats grupales necesitan SharePoint

Los bots usan una identidad de aplicación, mientras que el recurso `/me` de Microsoft Graph [requiere un usuario que haya iniciado sesión](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Para enviar archivos en chats grupales/canales, el bot los carga en un **sitio de SharePoint** y crea un enlace para compartirlos.

### Configuración

1. **Añada permisos de la API de Graph** en Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (aplicación): cargar archivos en SharePoint.
   - `ChatMember.Read.All` (aplicación): permiso de ámbito general del inquilino con privilegios mínimos para enviar archivos en chats grupales. `Chat.Read.All` también funciona y ya cubre este caso cuando está habilitado el historial de chats grupales. Como alternativa por chat, use el [permiso de consentimiento específico del recurso](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **Conceda el consentimiento del administrador** para el inquilino.
3. **Obtenga el identificador de su sitio de SharePoint:**

   ```bash
   # Mediante Graph Explorer o curl con un token válido:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Ejemplo: para un sitio en "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # La respuesta incluye: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configurar OpenClaw:**

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

### Comportamiento del uso compartido

| Contexto y permiso                                                      | Comportamiento del uso compartido                                      |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Canal + `Sites.ReadWrite.All`                                              | Enlace para toda la organización (cualquier miembro puede acceder)      |
| Chat grupal + `Sites.ReadWrite.All` + un permiso compatible de lectura de miembros del chat | Enlace por usuario (solo pueden acceder los miembros del chat) |
| Chat grupal sin un permiso compatible de lectura de miembros del chat  | El envío falla de forma segura                                          |

El uso compartido por usuario es más seguro, ya que solo los participantes del chat pueden acceder al archivo. OpenClaw requiere una consulta de miembros correcta para los chats grupales; los tiempos de espera agotados, los fallos de transporte, los resultados vacíos y las denegaciones de la API de Graph hacen que el envío falle en lugar de ampliar el acceso a la organización.

### Comportamiento alternativo

| Situación                                                        | Resultado                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Chat grupal + archivo + permisos de SharePoint y de miembros configurados | Se carga en SharePoint y se envía una tarjeta de archivo nativa |
| Chat grupal + archivo + faltan permisos de SharePoint o de miembros | Falla con un error de configuración que indica cómo actuar |
| Canal + archivo + `sharePointSiteId` configurado                 | Se carga en SharePoint y se envía una tarjeta de archivo nativa |
| Chat personal + archivo                                          | Flujo FileConsentCard (funciona sin SharePoint)              |
| Cualquier contexto + imagen                                      | En línea, codificada en Base64 (funciona sin SharePoint)     |

### Ubicación de los archivos almacenados

Los archivos cargados se almacenan en una carpeta `/OpenClawShared/` de la biblioteca de documentos predeterminada del sitio de SharePoint configurado.

## Encuestas (tarjetas adaptables)

OpenClaw envía las encuestas de Teams como tarjetas adaptables (no existe una API nativa de encuestas de Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- El Gateway registra los votos en la base de datos SQLite del estado del Plugin de OpenClaw, en `state/openclaw.sqlite`.
- Los archivos `msteams-polls.json` existentes los importa `openclaw doctor --fix`, no el Plugin en ejecución.
- El Gateway debe permanecer en línea para registrar los votos.
- Las encuestas no publican automáticamente resúmenes de resultados y todavía no existe una CLI para consultar los resultados.

## Tarjetas de presentación

Envíe cargas útiles de presentación semántica a usuarios o conversaciones de Teams mediante la herramienta `message`, la CLI o la entrega normal de respuestas. OpenClaw las representa como tarjetas adaptables de Teams a partir del contrato de presentación genérico.

El parámetro `presentation` acepta bloques semánticos. Cuando se proporciona `presentation`, el texto del mensaje es opcional. Los botones se representan como acciones de envío o de URL de las tarjetas adaptables. Los menús de selección no son nativos del representador de Teams, por lo que OpenClaw los convierte en texto legible antes de la entrega.

**Herramienta del agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hola",
    blocks: [{ type: "text", text: "¡Hola!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hola","blocks":[{"type":"text","text":"¡Hola!"}]}'
```

Para obtener detalles sobre el formato de los destinos, consulte [Formatos de destino](#target-formats) más adelante.

## Formatos de destino

Los destinos de MSTeams utilizan prefijos para distinguir entre usuarios y conversaciones:

| Tipo de destino      | Formato                          | Ejemplo                                                                                                |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Usuario (por ID)     | `user:<aad-object-id>`               | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                     |
| Usuario (por nombre) | `user:<display-name>`               | `user:John Smith` (requiere la API de Graph)                                                          |
| Grupo/canal          | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                     |
| Grupo/canal (sin procesar) | `<conversation-id>`         | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` o un id de Bot Framework `a:`/`8:orgid:`/`29:` sin prefijo |

**Ejemplos de la CLI:**

```bash
# Enviar a un usuario por ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hola"

# Enviar a un usuario por su nombre para mostrar (activa una consulta a la API de Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hola"

# Enviar a un chat grupal o canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hola"

# Enviar una tarjeta de presentación a una conversación
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hola","blocks":[{"type":"text","text":"Hola"}]}'
```

**Ejemplos de la herramienta del agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "¡Hola!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hola",
    blocks: [{ type: "text", text: "Hola" }],
  },
}
```

<Note>
Sin el prefijo `user:`, los nombres se resuelven de forma predeterminada como grupos o equipos. Utilice siempre `user:` al dirigir mensajes a personas por su nombre para mostrar.
</Note>

## Mensajería proactiva

- Los mensajes proactivos solo son posibles **después** de que un usuario haya interactuado, porque OpenClaw almacena las referencias de conversación en ese momento.
- Consulte [/gateway/configuration](/es/gateway/configuration) para obtener información sobre `dmPolicy` y el control mediante listas de permitidos.

## ID de equipos y canales (error habitual)

El parámetro de consulta `groupId` de las URL de Teams **NO** es el ID de equipo utilizado para la configuración. En su lugar, extraiga los ID de la ruta de la URL:

**URL del equipo:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID de conversación del equipo (descodifique la URL)
```

**URL del canal:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID del canal (descodifique la URL)
```

**Para la configuración:**

- Clave del equipo = segmento de la ruta posterior a `/team/` (descodificado de la URL; por ejemplo, `19:Bk4j...@thread.tacv2`; los inquilinos más antiguos pueden mostrar `@thread.skype`, que también es válido).
- Clave del canal = segmento de la ruta posterior a `/channel/` (descodificado de la URL).
- **Ignore** el parámetro de consulta `groupId` para el enrutamiento de OpenClaw. Es el ID del grupo de Microsoft Entra, no el ID de conversación de Bot Framework utilizado en las actividades entrantes de Teams.

## Canales privados

Los bots tienen compatibilidad limitada con los canales privados:

| Función                      | Canales estándar | Canales privados             |
| ---------------------------- | ---------------- | ---------------------------- |
| Instalación del bot          | Sí               | Limitada                     |
| Mensajes en tiempo real (webhook) | Sí          | Puede que no funcione        |
| Permisos RSC                 | Sí               | Pueden comportarse de forma diferente |
| @menciones                   | Sí               | Si el bot es accesible       |
| Historial de la API de Graph | Sí               | Sí (con permisos)            |

**Soluciones alternativas si los canales privados no funcionan:**

1. Utilice canales estándar para interactuar con el bot.
2. Utilice mensajes directos; los usuarios siempre pueden enviar mensajes directamente al bot.
3. Utilice la API de Graph para acceder al historial (requiere `ChannelMessage.Read.All`).

## Solución de problemas

### Problemas habituales

- **Las imágenes no aparecen en los canales:** faltan permisos de Graph o el consentimiento del administrador. Reinstale la aplicación de Teams, ciérrela por completo y vuelva a abrirla.
- **No hay respuestas en el canal:** las menciones son obligatorias de forma predeterminada; establezca `channels.msteams.requireMention=false` o configure cada equipo/canal.
- **Las versiones no coinciden (Teams sigue mostrando el manifiesto antiguo):** quite y vuelva a agregar la aplicación, y cierre Teams por completo para actualizarlo.
- **401 Unauthorized del webhook:** es lo esperado al realizar pruebas manuales sin un JWT de Azure; significa que el punto de conexión es accesible, pero la autenticación ha fallado. Utilice Azure Web Chat para realizar la prueba correctamente.

### Errores al cargar el manifiesto

- **"Icon file cannot be empty":** el manifiesto hace referencia a archivos de icono de 0 bytes. Cree iconos PNG válidos (32x32 para `outline.png` y 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** la aplicación sigue instalada en otro equipo o chat. Localícela y desinstálela primero, o espere entre 5 y 10 minutos a que se propaguen los cambios.
- **"Something went wrong" al cargar:** realice la carga mediante [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra DevTools del navegador (F12) → pestaña Network y compruebe el cuerpo de la respuesta para ver el error real.
- **Error de instalación local:** pruebe "Upload an app to your org's app catalog" en lugar de "Upload a custom app"; esto suele eludir las restricciones de instalación local.

### Los permisos RSC no funcionan

1. Verifique que `webApplicationInfo.id` coincida exactamente con el ID de aplicación de su bot.
2. Vuelva a cargar la aplicación y reinstálela en el equipo/chat.
3. Compruebe si el administrador de su organización ha bloqueado los permisos RSC.
4. Confirme que utiliza el ámbito correcto: `ChannelMessage.Read.Group` para equipos y `ChatMessage.Read.Chat` para chats grupales.

## Referencias

- [Crear un bot de Azure](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guía de configuración de Azure Bot
- [Portal para desarrolladores de Teams](https://dev.teams.microsoft.com/apps) - crear y administrar aplicaciones de Teams
- [Esquema del manifiesto de aplicaciones de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Recibir mensajes de canales mediante RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referencia de permisos RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Gestión de archivos de bots de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (los canales/grupos requieren Graph)
- [Mensajería proactiva](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI de Teams para administrar bots

## Contenido relacionado

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Vinculación](/es/channels/pairing) - autenticación por mensaje directo y flujo de vinculación
- [Grupos](/es/channels/groups) - comportamiento del chat grupal y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de la seguridad
