---
read_when:
    - Trabajar en las funciones del canal de Microsoft Teams
summary: Estado, capacidades y configuración del bot de Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T10:42:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Estado: se admiten archivos adjuntos de texto + DM; el envío de archivos en canales/grupos requiere `sharePointSiteId` + permisos de Graph (consulta [Enviar archivos en chats de grupo](#sending-files-in-group-chats)). Las encuestas se envían mediante Adaptive Cards. Las acciones de mensaje exponen `upload-file` explícito para envíos centrados en archivos.

## Plugin incluido

Microsoft Teams se entrega como Plugin incluido en las versiones actuales de OpenClaw, por lo que no se requiere una instalación
separada en la compilación empaquetada normal.

Si estás en una compilación anterior o en una instalación personalizada que excluye Teams incluido,
instala el paquete npm directamente:

```bash
openclaw plugins install @openclaw/msteams
```

Usa el paquete base para seguir la etiqueta de versión oficial actual. Fija una versión
exacta solo cuando necesites una instalación reproducible.

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gestiona el registro del bot, la creación del manifiesto y la generación de credenciales en un solo comando.

**1. Instala e inicia sesión**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
La CLI de Teams está actualmente en vista previa. Los comandos y flags pueden cambiar entre versiones.
</Note>

**2. Inicia un túnel** (Teams no puede acceder a localhost)

Instala y autentica la CLI de devtunnel si aún no lo has hecho ([guía de primeros pasos](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

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
- Compila y sube un manifiesto de aplicación de Teams (con iconos)
- Registra el bot (gestionado por Teams de forma predeterminada; no se necesita suscripción de Azure)

La salida mostrará `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` y un **ID de aplicación de Teams**; anótalos para los siguientes pasos. También ofrece instalar la aplicación directamente en Teams.

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

`teams app create` te pedirá instalar la aplicación; selecciona "Install in Teams". Si lo omitiste, puedes obtener el enlace más tarde:

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
Los chats de grupo están bloqueados de forma predeterminada (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respuestas de grupo, configura `channels.msteams.groupAllowFrom`, o usa `groupPolicy: "open"` para permitir a cualquier miembro (con activación por mención).
</Note>

## Objetivos

- Hablar con OpenClaw mediante DM, chats de grupo o canales de Teams.
- Mantener el enrutamiento determinista: las respuestas siempre vuelven al canal por el que llegaron.
- Usar de forma predeterminada un comportamiento de canal seguro (menciones obligatorias salvo que se configure lo contrario).

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

- Valor predeterminado: `channels.msteams.dmPolicy = "pairing"`. Los remitentes desconocidos se ignoran hasta que se aprueban.
- `channels.msteams.allowFrom` debe usar ID de objeto AAD estables o grupos de acceso de remitentes estáticos como `accessGroup:core-team`.
- No dependas de la coincidencia por UPN/nombre visible para listas de permitidos; pueden cambiar. OpenClaw desactiva la coincidencia directa por nombre de forma predeterminada; actívala explícitamente con `channels.msteams.dangerouslyAllowNameMatching: true`.
- El asistente puede resolver nombres a ID mediante Microsoft Graph cuando las credenciales lo permiten.

**Acceso de grupo**

- Valor predeterminado: `channels.msteams.groupPolicy = "allowlist"` (bloqueado salvo que agregues `groupAllowFrom`). Usa `channels.defaults.groupPolicy` para anular el valor predeterminado cuando no esté definido.
- `channels.msteams.groupAllowFrom` controla qué remitentes o grupos de acceso de remitentes estáticos pueden activar en chats/canales de grupo (recurre a `channels.msteams.allowFrom`).
- Configura `groupPolicy: "open"` para permitir a cualquier miembro (aún con activación por mención de forma predeterminada).
- Para no permitir **ningún canal**, configura `channels.msteams.groupPolicy: "disabled"`.

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

**Lista de permitidos de Teams + canales**

- Limita las respuestas de grupos/canales listando equipos y canales en `channels.msteams.teams`.
- Las claves deben usar ID de conversación de Teams estables de enlaces de Teams, no nombres visibles mutables.
- Cuando `groupPolicy="allowlist"` y existe una lista de permitidos de equipos, solo se aceptan los equipos/canales listados (con activación por mención).
- El asistente de configuración acepta entradas `Team/Channel` y las almacena por ti.
- Al iniciar, OpenClaw resuelve nombres de equipos/canales y de listas de permitidos de usuarios a ID (cuando los permisos de Graph lo permiten)
  y registra la asignación; los nombres de equipos/canales no resueltos se conservan tal como se escribieron, pero se ignoran para el enrutamiento de forma predeterminada salvo que `channels.msteams.dangerouslyAllowNameMatching: true` esté habilitado.

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

1. Asegúrate de que el Plugin de Microsoft Teams esté disponible (incluido en las versiones actuales).
2. Crea un **Azure Bot** (ID de aplicación + secreto + ID de inquilino).
3. Compila un **paquete de aplicación de Teams** que haga referencia al bot e incluya los permisos RSC siguientes.
4. Sube/instala la aplicación de Teams en un equipo (o en ámbito personal para DM).
5. Configura `msteams` en `~/.openclaw/openclaw.json` (o variables de entorno) e inicia el Gateway.
6. El Gateway escucha tráfico de Webhook de Bot Framework en `/api/messages` de forma predeterminada.

### Paso 1: Crear Azure Bot

1. Ve a [Crear Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Completa la pestaña **Básico**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Identificador del bot** | El nombre de tu bot, por ejemplo, `openclaw-msteams` (debe ser único) |
   | **Suscripción**   | Selecciona tu suscripción de Azure                       |
   | **Grupo de recursos** | Crea uno nuevo o usa uno existente                    |
   | **Nivel de precios** | **Gratis** para desarrollo/pruebas                     |
   | **Tipo de aplicación** | **Inquilino único** (recomendado; consulta la nota siguiente) |
   | **Tipo de creación** | **Crear nuevo ID de aplicación de Microsoft**          |

<Warning>
La creación de nuevos bots multiinquilino quedó obsoleta después del 2025-07-31. Usa **Inquilino único** para bots nuevos.
</Warning>

3. Haz clic en **Revisar + crear** → **Crear** (espera ~1-2 minutos)

### Paso 2: Obtener credenciales

1. Ve a tu recurso de Azure Bot → **Configuración**
2. Copia **ID de aplicación de Microsoft** → este es tu `appId`
3. Haz clic en **Administrar contraseña** → ve al registro de la aplicación
4. En **Certificados y secretos** → **Nuevo secreto de cliente** → copia el **Valor** → este es tu `appPassword`
5. Ve a **Información general** → copia **ID de directorio (inquilino)** → este es tu `tenantId`

### Paso 3: Configurar el endpoint de mensajería

1. En Azure Bot → **Configuración**
2. Configura **Endpoint de mensajería** con la URL de tu Webhook:
   - Producción: `https://your-domain.com/api/messages`
   - Desarrollo local: usa un túnel (consulta [Desarrollo local](#local-development-tunneling) abajo)

### Paso 4: Habilitar el canal de Teams

1. En Azure Bot → **Canales**
2. Haz clic en **Microsoft Teams** → Configurar → Guardar
3. Acepta los Términos del servicio

### Paso 5: Compilar el manifiesto de la aplicación de Teams

- Incluye una entrada `bot` con `botId = <App ID>`.
- Ámbitos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obligatorio para la gestión de archivos en ámbito personal).
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

El canal de Teams se inicia automáticamente cuando el Plugin está disponible y existe configuración de `msteams` con credenciales.

</details>

## Autenticación federada (certificado más identidad administrada)

> Agregado en 2026.4.11

Para despliegues de producción, OpenClaw admite **autenticación federada** como alternativa más segura a los secretos de cliente. Hay dos métodos disponibles:

### Opción A: autenticación basada en certificado

Usa un certificado PEM registrado con tu registro de aplicación de Entra ID.

**Configuración:**

1. Genera u obtén un certificado (formato PEM con clave privada).
2. En Entra ID → Registro de aplicación → **Certificados y secretos** → **Certificados** → Sube el certificado público.

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

Usa Azure Managed Identity para autenticación sin contraseña. Es ideal para despliegues en infraestructura de Azure (AKS, App Service, VM de Azure) donde hay una identidad administrada disponible.

**Cómo funciona:**

1. El pod/VM del bot tiene una identidad administrada (asignada por el sistema o por el usuario).
2. Una **credencial de identidad federada** vincula la identidad administrada con el registro de aplicación de Entra ID.
3. En tiempo de ejecución, OpenClaw usa `@azure/identity` para adquirir tokens del endpoint IMDS de Azure (`169.254.169.254`).
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

Para despliegues de AKS que usan identidad de carga de trabajo:

1. **Habilita la identidad de carga de trabajo** en tu clúster de AKS.
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

4. **Etiqueta el pod** para la inyección de identidad de carga de trabajo:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Asegura el acceso de red** a IMDS (`169.254.169.254`): si usas NetworkPolicy, agrega una regla de salida que permita el tráfico a `169.254.169.254/32` en el puerto 80.

### Comparación de tipos de autenticación

| Método                    | Configuración                                  | Ventajas                                  | Desventajas                                           |
| ------------------------- | ---------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| **Secreto de cliente**    | `appPassword`                                  | Configuración simple                      | Requiere rotación de secretos, menos seguro           |
| **Certificado**           | `authType: "federated"` + `certificatePath`    | Sin secreto compartido a través de la red | Sobrecarga de gestión de certificados                 |
| **Identidad administrada** | `authType: "federated"` + `useManagedIdentity` | Sin contraseña, sin secretos que gestionar | Requiere infraestructura de Azure                     |

**Comportamiento predeterminado:** Cuando `authType` no está definido, OpenClaw usa de forma predeterminada la autenticación con secreto de cliente. Las configuraciones existentes siguen funcionando sin cambios.

## Desarrollo local (tunelización)

Teams no puede acceder a `localhost`. Usa un túnel de desarrollo persistente para que tu URL se mantenga igual entre sesiones:

```bash
# Configuración única:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Cada sesión de desarrollo:
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

Todas las claves de configuración pueden definirse mediante variables de entorno en su lugar:

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

La acción está controlada por `channels.msteams.actions.memberInfo` (valor predeterminado: habilitada cuando las credenciales de Graph están disponibles).

## Contexto del historial

- `channels.msteams.historyLimit` controla cuántos mensajes recientes de canal/grupo se incluyen en el prompt.
- Recurre a `messages.groupChat.historyLimit`. Configura `0` para deshabilitarlo (valor predeterminado 50).
- El historial de hilos obtenido se filtra por listas de permitidos de remitentes (`allowFrom` / `groupAllowFrom`), por lo que la inicialización del contexto del hilo solo incluye mensajes de remitentes permitidos.
- El contexto de adjuntos citados (`ReplyTo*` derivado del HTML de respuesta de Teams) actualmente se pasa tal como se recibe.
- En otras palabras, las listas de permitidos controlan quién puede activar el agente; hoy solo se filtran rutas específicas de contexto complementario.
- El historial de DM puede limitarse con `channels.msteams.dmHistoryLimit` (turnos del usuario). Sustituciones por usuario: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permisos RSC actuales de Teams (manifiesto)

Estos son los **permisos resourceSpecific existentes** en nuestro manifiesto de la app de Teams. Solo se aplican dentro del equipo/chat donde está instalada la app.

**Para canales (ámbito de equipo):**

- `ChannelMessage.Read.Group` (Application) - recibir todos los mensajes del canal sin @mención
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats de grupo:**

- `ChatMessage.Read.Chat` (Application) - recibir todos los mensajes de chats de grupo sin @mención

Para agregar permisos RSC mediante Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Ejemplo de manifiesto de Teams (censurado)

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

### Advertencias sobre el manifiesto (campos obligatorios)

- `bots[].botId` **debe** coincidir con el ID de app de Azure Bot.
- `webApplicationInfo.id` **debe** coincidir con el ID de app de Azure Bot.
- `bots[].scopes` debe incluir las superficies que planeas usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` es obligatorio para gestionar archivos en el ámbito personal.
- `authorization.permissions.resourceSpecific` debe incluir lectura/envío de canales si quieres tráfico de canales.

### Actualizar una app existente

Para actualizar una app de Teams ya instalada (por ejemplo, para agregar permisos RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Después de actualizar, reinstala la app en cada equipo para que los nuevos permisos surtan efecto, y **sal completamente y vuelve a iniciar Teams** (no basta con cerrar la ventana) para borrar los metadatos de app en caché.

<details>
<summary>Actualización manual del manifiesto (sin CLI)</summary>

1. Actualiza tu `manifest.json` con la nueva configuración
2. **Incrementa el campo `version`** (por ejemplo, `1.0.0` → `1.1.0`)
3. **Vuelve a comprimir en zip** el manifiesto con los iconos (`manifest.json`, `outline.png`, `color.png`)
4. Sube el nuevo zip:
   - **Centro de administración de Teams:** Apps de Teams → Administrar apps → busca tu app → Subir nueva versión
   - **Carga lateral:** En Teams → Apps → Administrar tus apps → Subir una app personalizada

</details>

## Capacidades: solo RSC frente a Graph

### Con **solo Teams RSC** (app instalada, sin permisos de Graph API)

Funciona:

- Leer contenido de **texto** de mensajes de canal.
- Enviar contenido de **texto** de mensajes de canal.
- Recibir archivos adjuntos de **personal (DM)**.

No funciona:

- **Contenido de imágenes o archivos** de canales/grupos (la carga útil solo incluye un stub HTML).
- Descargar archivos adjuntos almacenados en SharePoint/OneDrive.
- Leer el historial de mensajes (más allá del evento Webhook en vivo).

### Con **Teams RSC + permisos de aplicación de Microsoft Graph**

Agrega:

- Descarga de contenidos hospedados (imágenes pegadas en mensajes).
- Descarga de archivos adjuntos almacenados en SharePoint/OneDrive.
- Lectura del historial de mensajes de canales/chats mediante Graph.

### RSC frente a Graph API

| Capacidad               | Permisos RSC        | Graph API                                      |
| ----------------------- | ------------------- | ---------------------------------------------- |
| **Mensajes en tiempo real** | Sí (vía Webhook)    | No (solo sondeo)                               |
| **Mensajes históricos** | No                  | Sí (puede consultar el historial)              |
| **Complejidad de configuración** | Solo manifiesto de app | Requiere consentimiento de administrador + flujo de token |
| **Funciona sin conexión** | No (debe estar en ejecución) | Sí (consulta en cualquier momento)             |

**En resumen:** RSC sirve para escuchar en tiempo real; Graph API sirve para acceso histórico. Para ponerte al día con mensajes perdidos mientras estabas sin conexión, necesitas Graph API con `ChannelMessage.Read.All` (requiere consentimiento de administrador).

## Medios + historial con Graph habilitado (obligatorio para canales)

Si necesitas imágenes/archivos en **canales** o quieres obtener el **historial de mensajes**, debes habilitar permisos de Microsoft Graph y conceder consentimiento de administrador.

1. En **Registro de aplicaciones** de Entra ID (Azure AD), agrega **permisos de aplicación** de Microsoft Graph:
   - `ChannelMessage.Read.All` (archivos adjuntos de canal + historial)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chats de grupo)
2. **Concede consentimiento de administrador** para el inquilino.
3. Incrementa la **versión del manifiesto** de la app de Teams, vuelve a subirlo y **reinstala la app en Teams**.
4. **Sal completamente y vuelve a iniciar Teams** para borrar los metadatos de app en caché.

**Permiso adicional para menciones de usuarios:** Las @menciones de usuarios funcionan de inmediato para usuarios en la conversación. Sin embargo, si quieres buscar y mencionar dinámicamente a usuarios que **no están en la conversación actual**, agrega el permiso `User.Read.All` (Application) y concede consentimiento de administrador.

## Limitaciones conocidas

### Tiempos de espera de Webhook

Teams entrega mensajes mediante Webhook HTTP. Si el procesamiento tarda demasiado (por ejemplo, respuestas lentas de LLM), puedes ver:

- Tiempos de espera del Gateway
- Teams reintentando el mensaje (lo que causa duplicados)
- Respuestas descartadas

OpenClaw gestiona esto devolviendo la respuesta rápidamente y enviando respuestas de forma proactiva, pero las respuestas muy lentas aún pueden causar problemas.

### Compatibilidad con nube de Teams y URL de servicio

Esta ruta de Teams respaldada por el SDK está validada en vivo para la nube pública de Microsoft Teams.

Las respuestas entrantes usan el contexto de turno del SDK de Teams entrante. Las operaciones proactivas fuera de contexto (envíos, ediciones, eliminaciones, tarjetas, encuestas, mensajes de consentimiento de archivos y respuestas en cola de larga duración) usan el `serviceUrl` de la referencia de conversación almacenada. La nube pública usa de forma predeterminada el entorno de nube pública del SDK de Teams y permite referencias almacenadas en el host público de Teams Connector: `https://smba.trafficmanager.net/`.

La nube pública es el valor predeterminado. No necesitas establecer `channels.msteams.cloud` ni `channels.msteams.serviceUrl` para bots normales de nube pública.

Para nubes de Teams no públicas, establece `cloud` y el límite proactivo correspondiente cuando Microsoft publique uno:

- `channels.msteams.cloud` selecciona el ajuste preestablecido de nube del SDK de Teams para autenticación, validación de JWT, servicios de token y ámbito de Graph.
- `channels.msteams.serviceUrl` selecciona el límite del endpoint de Bot Connector usado para validar referencias de conversación almacenadas antes de envíos, ediciones, eliminaciones, tarjetas, encuestas, mensajes de consentimiento de archivos y respuestas en cola de larga duración proactivos. Es obligatorio para las nubes SDK USGov y DoD. Para China/21Vianet, OpenClaw usa el ajuste preestablecido `China` del SDK y acepta URLs de servicio almacenadas/configuradas solo en hosts de canal de Azure China Bot Framework.

Microsoft publica los endpoints globales proactivos de Bot Connector en la sección [Crear la conversación](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) de la documentación de mensajería proactiva de Teams. Usa el `serviceUrl` de la actividad entrante cuando esté disponible; si necesitas un endpoint proactivo global, usa la tabla de Microsoft.

| Entorno de Teams | Configuración de OpenClaw                                  | `serviceUrl` proactivo                            |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Público          | no se necesita configuración cloud/serviceUrl               | `https://smba.trafficmanager.net/teams`            |
| GCC              | establece `serviceUrl`; no existe un ajuste preestablecido de nube independiente del SDK de Teams | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High         | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD              | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet   | `cloud: "China"`                                            | usa el `serviceUrl` de la actividad entrante       |

Ejemplo para GCC, donde Microsoft documenta una URL de servicio proactivo independiente pero el SDK de Teams no expone un ajuste preestablecido de nube GCC independiente:

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

`channels.msteams.serviceUrl` está restringido a hosts de Bot Connector compatibles con Microsoft Teams. Cuando se configura una URL de servicio, OpenClaw comprueba que el `serviceUrl` de la conversación almacenada use el mismo host antes de ejecutar envíos, ediciones, eliminaciones, tarjetas, encuestas o respuestas en cola de larga duración proactivos. Con la configuración predeterminada de nube pública, OpenClaw falla de forma cerrada si una conversación almacenada apunta fuera del host público de Teams Connector. Recibe un mensaje nuevo de la conversación después de cambiar la configuración de nube/URL de servicio para que la referencia de conversación almacenada esté actualizada.

China/21Vianet no tiene una URL global proactiva `smba` independiente en la tabla de endpoints proactivos de Teams de Microsoft. Configura `cloud: "China"` para que el SDK de Teams use los endpoints de autenticación, token y JWT de Azure China. Los envíos proactivos requieren entonces una referencia de conversación almacenada procedente de una actividad entrante de China Teams, o una URL de servicio configurada explícitamente, en el límite del canal de Azure China Bot Framework (`*.botframework.azure.cn`). Los auxiliares de Teams respaldados por Graph están deshabilitados actualmente para `cloud: "China"` hasta que OpenClaw enrute las solicitudes de Graph a través del endpoint de Azure China Graph.

### Formato

El markdown de Teams es más limitado que el de Slack o Discord:

- El formato básico funciona: **negrita**, _cursiva_, `code`, enlaces
- El markdown complejo (tablas, listas anidadas) puede no renderizarse correctamente
- Se admiten Adaptive Cards para encuestas y envíos de presentación semántica (ver abajo)

## Configuración

Ajustes clave (consulta `/gateway/configuration` para patrones de canal compartidos):

- `channels.msteams.enabled`: habilita/deshabilita el canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciales del bot.
- `channels.msteams.cloud`: entorno de nube del SDK de Teams (`Public`, `USGov`, `USGovDoD` o `China`; predeterminado `Public`). Establécelo con `serviceUrl` para las nubes SDK USGov/DoD; China usa el ajuste preestablecido del SDK y referencias de conversación almacenadas de Azure China Bot Framework, con auxiliares respaldados por Graph deshabilitados hasta que se implemente el enrutamiento de Azure China Graph.
- `channels.msteams.serviceUrl`: límite de URL de servicio de Bot Connector para operaciones proactivas del SDK. La nube pública usa el valor predeterminado del SDK; establécelo para GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High o DoD. China acepta hosts de canal de Azure China Bot Framework cuando la referencia de conversación almacenada procede de Teams operado por 21Vianet.
- `channels.msteams.webhook.port` (predeterminado `3978`)
- `channels.msteams.webhook.path` (predeterminado `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing)
- `channels.msteams.allowFrom`: lista de permitidos de DM (se recomiendan identificadores de objeto de AAD). El asistente resuelve nombres a identificadores durante la configuración cuando el acceso a Graph está disponible.
- `channels.msteams.dangerouslyAllowNameMatching`: conmutador de emergencia para volver a habilitar la coincidencia mutable de UPN/nombre para mostrar y el enrutamiento directo por nombre de equipo/canal.
- `channels.msteams.textChunkLimit`: tamaño de fragmento de texto saliente.
- `channels.msteams.chunkMode`: `length` (predeterminado) o `newline` para dividir en líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.msteams.mediaAllowHosts`: lista de permitidos para hosts de adjuntos entrantes (predeterminada a dominios de Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista de permitidos para adjuntar encabezados Authorization en reintentos de medios (predeterminada a hosts de Graph + Bot Framework).
- `channels.msteams.requireMention`: requiere @mención en canales/grupos (predeterminado true).
- `channels.msteams.replyStyle`: `thread | top-level` (consulta [Estilo de respuesta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: anulación por equipo.
- `channels.msteams.teams.<teamId>.requireMention`: anulación por equipo.
- `channels.msteams.teams.<teamId>.tools`: anulaciones predeterminadas por equipo de política de herramientas (`allow`/`deny`/`alsoAllow`) usadas cuando falta una anulación de canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: anulaciones predeterminadas por equipo y por remitente de política de herramientas (comodín `"*"` compatible).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: anulaciones por canal de política de herramientas (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: anulaciones por canal y por remitente de política de herramientas (comodín `"*"` compatible).
- Las claves de `toolsBySender` deberían usar prefijos explícitos:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (las claves heredadas sin prefijo aún se asignan solo a `id:`).
- `channels.msteams.actions.memberInfo`: habilita o deshabilita la acción de información de miembro respaldada por Graph (predeterminado: habilitada cuando las credenciales de Graph están disponibles).
- `channels.msteams.authType`: tipo de autenticación - `"secret"` (predeterminado) o `"federated"`.
- `channels.msteams.certificatePath`: ruta al archivo de certificado PEM (autenticación federada + certificado).
- `channels.msteams.certificateThumbprint`: huella digital del certificado (opcional, no obligatoria para la autenticación).
- `channels.msteams.useManagedIdentity`: habilita la autenticación de identidad administrada (modo federado).
- `channels.msteams.managedIdentityClientId`: identificador de cliente para identidad administrada asignada por el usuario.
- `channels.msteams.sharePointSiteId`: identificador de sitio de SharePoint para subidas de archivos en chats grupales/canales (consulta [Enviar archivos en chats grupales](#sending-files-in-group-chats)).

## Enrutamiento y sesiones

- Las claves de sesión siguen el formato estándar de agente (consulta [/concepts/session](/es/concepts/session)):
  - Los mensajes directos comparten la sesión principal (`agent:<agentId>:<mainKey>`).
  - Los mensajes de canal/grupo usan el identificador de conversación:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de respuesta: hilos frente a publicaciones

Teams introdujo recientemente dos estilos de interfaz de usuario de canal sobre el mismo modelo de datos subyacente:

| Estilo                   | Descripción                                                | `replyStyle` recomendado |
| ------------------------ | ---------------------------------------------------------- | ------------------------ |
| **Publicaciones** (clásico) | Los mensajes aparecen como tarjetas con respuestas en hilo debajo | `thread` (predeterminado) |
| **Hilos** (tipo Slack)   | Los mensajes fluyen linealmente, más parecido a Slack      | `top-level`              |

**El problema:** La API de Teams no expone qué estilo de interfaz de usuario usa un canal. Si usas el `replyStyle` incorrecto:

- `thread` en un canal con estilo de Hilos → las respuestas aparecen anidadas de forma incómoda
- `top-level` en un canal con estilo de Publicaciones → las respuestas aparecen como publicaciones de nivel superior separadas en lugar de dentro del hilo

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

### Precedencia de resolución

Cuando el bot envía una respuesta a un canal, `replyStyle` se resuelve desde la anulación más específica hasta el valor predeterminado. Gana el primer valor que no sea `undefined`:

1. **Por canal** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Por equipo** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Predeterminado implícito** — derivado de `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Si estableces `requireMention: false` globalmente sin un `replyStyle` explícito, las menciones en canales con estilo de Publicaciones aparecerán como publicaciones de nivel superior incluso cuando el mensaje entrante fuera una respuesta de hilo. Fija `replyStyle: "thread"` a nivel global, de equipo o de canal para evitar sorpresas.

### Conservación del contexto de hilo

Cuando `replyStyle: "thread"` está activo y el bot recibió una @mención desde dentro de un hilo de canal, OpenClaw vuelve a adjuntar la raíz original del hilo a la referencia de conversación saliente (`19:…@thread.tacv2;messageid=<root>`) para que la respuesta llegue dentro del mismo hilo. Esto se mantiene tanto para envíos en vivo (dentro del turno) como para envíos proactivos realizados después de que haya expirado el contexto de turno de Bot Framework (por ejemplo, agentes de larga duración, respuestas en cola de llamadas a herramientas mediante `mcp__openclaw__message`).

La raíz del hilo se toma del `threadId` almacenado en la referencia de conversación. Las referencias almacenadas antiguas anteriores a `threadId` recurren a `activityId` (cualquier actividad entrante que haya inicializado la conversación por última vez), por lo que las implementaciones existentes siguen funcionando sin volver a inicializar.

Cuando `replyStyle: "top-level"` está en vigor, las entradas de hilos de canal se responden intencionalmente como nuevas publicaciones de nivel superior; no se adjunta ningún sufijo de hilo. Este es el comportamiento correcto para canales de estilo Threads; si ves publicaciones de nivel superior donde esperabas respuestas en hilo, tu `replyStyle` está configurado incorrectamente para ese canal.

## Adjuntos e imágenes

**Limitaciones actuales:**

- **MD:** Las imágenes y los archivos adjuntos funcionan mediante las API de archivos del bot de Teams.
- **Canales/grupos:** Los adjuntos residen en el almacenamiento de M365 (SharePoint/OneDrive). La carga útil del Webhook solo incluye un fragmento HTML, no los bytes reales del archivo. **Se requieren permisos de Graph API** para descargar adjuntos de canal.
- Para envíos explícitos centrados en archivos, usa `action=upload-file` con `media` / `filePath` / `path`; el `message` opcional se convierte en el texto/comentario acompañante, y `filename` reemplaza el nombre cargado.

Sin permisos de Graph, los mensajes de canal con imágenes se recibirán solo como texto (el contenido de la imagen no es accesible para el bot).
De forma predeterminada, OpenClaw solo descarga medios desde nombres de host de Microsoft/Teams. Sobrescríbelo con `channels.msteams.mediaAllowHosts` (usa `["*"]` para permitir cualquier host).
Los encabezados de autorización solo se adjuntan para hosts en `channels.msteams.mediaAuthAllowHosts` (por defecto, hosts de Graph + Bot Framework). Mantén esta lista estricta (evita sufijos multiinquilino).

## Enviar archivos en chats grupales

Los bots pueden enviar archivos en MD usando el flujo FileConsentCard (integrado). Sin embargo, **enviar archivos en chats grupales/canales** requiere configuración adicional:

| Contexto                 | Cómo se envían los archivos                 | Configuración necesaria                         |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **MD**                   | FileConsentCard → el usuario acepta → el bot carga | Funciona sin configuración adicional            |
| **Chats grupales/canales** | Cargar a SharePoint → compartir enlace    | Requiere `sharePointSiteId` + permisos de Graph |
| **Imágenes (cualquier contexto)** | Codificadas en Base64 en línea      | Funciona sin configuración adicional            |

### Por qué los chats grupales necesitan SharePoint

Los bots no tienen una unidad personal de OneDrive (el endpoint `/me/drive` de Graph API no funciona para identidades de aplicación). Para enviar archivos en chats grupales/canales, el bot los carga en un **sitio de SharePoint** y crea un enlace para compartir.

### Configuración

1. **Agrega permisos de Graph API** en Entra ID (Azure AD) → Registro de aplicación:
   - `Sites.ReadWrite.All` (Aplicación) - cargar archivos a SharePoint
   - `Chat.Read.All` (Aplicación) - opcional, habilita enlaces para compartir por usuario

2. **Concede consentimiento de administrador** para el inquilino.

3. **Obtén tu ID de sitio de SharePoint:**

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

### Comportamiento al compartir

| Permiso                                 | Comportamiento al compartir                               |
| --------------------------------------- | --------------------------------------------------------- |
| Solo `Sites.ReadWrite.All`              | Enlace para compartir en toda la organización (cualquier persona de la organización puede acceder) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Enlace para compartir por usuario (solo los miembros del chat pueden acceder) |

Compartir por usuario es más seguro, ya que solo los participantes del chat pueden acceder al archivo. Si falta el permiso `Chat.Read.All`, el bot recurre a compartir en toda la organización.

### Comportamiento de reserva

| Escenario                                         | Resultado                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat grupal + archivo + `sharePointSiteId` configurado | Cargar a SharePoint, enviar enlace para compartir |
| Chat grupal + archivo + sin `sharePointSiteId`    | Intentar carga a OneDrive (puede fallar), enviar solo texto |
| Chat personal + archivo                           | Flujo FileConsentCard (funciona sin SharePoint)    |
| Cualquier contexto + imagen                       | Codificada en Base64 en línea (funciona sin SharePoint) |

### Ubicación de los archivos almacenados

Los archivos cargados se almacenan en una carpeta `/OpenClawShared/` en la biblioteca de documentos predeterminada del sitio de SharePoint configurado.

## Encuestas (Adaptive Cards)

OpenClaw envía encuestas de Teams como Adaptive Cards (no existe una API nativa de encuestas de Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Los votos los registra el Gateway en SQLite de estado de Plugin de OpenClaw bajo `state/openclaw.sqlite`.
- Los archivos `msteams-polls.json` existentes son importados por `openclaw doctor --fix`, no por el Plugin en ejecución.
- El Gateway debe permanecer en línea para registrar votos.
- Las encuestas todavía no publican automáticamente resúmenes de resultados, y aún no hay una CLI compatible para resultados de encuestas.

## Tarjetas de presentación

Envía cargas útiles semánticas de presentación a usuarios o conversaciones de Teams mediante la herramienta `message`, la CLI o la entrega normal de respuestas. OpenClaw las renderiza como Adaptive Cards de Teams a partir del contrato de presentación genérico.

El parámetro `presentation` acepta bloques semánticos. Cuando se proporciona `presentation`, el texto del mensaje es opcional. Los botones se renderizan como acciones de envío o URL de Adaptive Card. Los menús de selección aún no son nativos en el renderizador de Teams, por lo que OpenClaw los degrada a texto legible antes de la entrega.

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

Para detalles del formato de destino, consulta [Formatos de destino](#target-formats) a continuación.

## Formatoss de destino

Los destinos de MSTeams usan prefijos para distinguir entre usuarios y conversaciones:

| Tipo de destino      | Formato                          | Ejemplo                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Usuario (por ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuario (por nombre) | `user:<display-name>`           | `user:John Smith` (requiere Graph API)              |
| Grupo/canal         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupo/canal (sin procesar) | `<conversation-id>`        | `19:abc123...@thread.tacv2` (si contiene `@thread`) |

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
Sin el prefijo `user:`, los nombres se resuelven de forma predeterminada como grupo o equipo. Usa siempre `user:` al dirigirte a personas por nombre para mostrar.
</Note>

## Mensajería proactiva

- Los mensajes proactivos solo son posibles **después** de que un usuario haya interactuado, porque en ese momento almacenamos referencias de conversación.
- Consulta `/gateway/configuration` para `dmPolicy` y el control por lista de permitidos.

## IDs de equipo y canal (problema común)

El parámetro de consulta `groupId` en las URL de Teams **NO** es el ID de equipo usado para la configuración. Extrae los IDs de la ruta de la URL en su lugar:

**URL de equipo:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL de canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Para la configuración:**

- Clave de equipo = segmento de ruta después de `/team/` (decodificado de URL, por ejemplo, `19:Bk4j...@thread.tacv2`; los inquilinos más antiguos pueden mostrar `@thread.skype`, que también es válido)
- Clave de canal = segmento de ruta después de `/channel/` (decodificado de URL)
- **Ignora** el parámetro de consulta `groupId` para el enrutamiento de OpenClaw. Es el ID de grupo de Microsoft Entra, no el ID de conversación de Bot Framework usado en actividades entrantes de Teams.

## Canales privados

Los bots tienen soporte limitado en canales privados:

| Funcionalidad                | Canales estándar | Canales privados        |
| ---------------------------- | ---------------- | ----------------------- |
| Instalación del bot          | Sí               | Limitada                |
| Mensajes en tiempo real (Webhook) | Sí          | Puede no funcionar      |
| Permisos RSC                 | Sí               | Pueden comportarse de forma diferente |
| @menciones                   | Sí               | Si el bot es accesible  |
| Historial de Graph API       | Sí               | Sí (con permisos)       |

**Soluciones alternativas si los canales privados no funcionan:**

1. Usa canales estándar para interacciones con el bot
2. Usa MD: los usuarios siempre pueden enviar mensajes directamente al bot
3. Usa Graph API para acceso histórico (requiere `ChannelMessage.Read.All`)

## Solución de problemas

### Problemas comunes

- **Las imágenes no aparecen en los canales:** faltan permisos de Graph o consentimiento de administrador. Reinstala la aplicación de Teams y cierra/reabre Teams por completo.
- **No hay respuestas en el canal:** las menciones son obligatorias de forma predeterminada; establece `channels.msteams.requireMention=false` o configura por equipo/canal.
- **Incompatibilidad de versiones (Teams todavía muestra el manifiesto antiguo):** elimina y vuelve a agregar la aplicación, y cierra Teams por completo para actualizar.
- **401 Unauthorized desde el Webhook:** esperado al probar manualmente sin JWT de Azure; significa que el endpoint es accesible, pero la autenticación falló. Usa Azure Web Chat para probar correctamente.

### Errores de carga del manifiesto

- **"Icon file cannot be empty":** El manifiesto hace referencia a archivos de icono que tienen 0 bytes. Crea iconos PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** La aplicación sigue instalada en otro equipo/chat. Búscala y desinstálala primero, o espera de 5 a 10 minutos para la propagación.
- **"Something went wrong" al cargar:** Carga mediante [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) en su lugar, abre DevTools del navegador (F12) → pestaña Network y revisa el cuerpo de la respuesta para ver el error real.
- **Error de sideload:** Prueba "Upload an app to your org's app catalog" en lugar de "Upload a custom app"; esto suele eludir las restricciones de sideload.

### Los permisos RSC no funcionan

1. Verifica que `webApplicationInfo.id` coincida exactamente con el App ID de tu bot
2. Vuelve a cargar la app y reinstálala en el equipo/chat
3. Comprueba si el administrador de tu organización ha bloqueado los permisos RSC
4. Confirma que estás usando el ámbito correcto: `ChannelMessage.Read.Group` para equipos, `ChatMessage.Read.Chat` para chats grupales

## Referencias

- [Crear Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guía de configuración de Azure Bot
- [Portal para desarrolladores de Teams](https://dev.teams.microsoft.com/apps) - crear/gestionar apps de Teams
- [Esquema del manifiesto de app de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Recibir mensajes de canal con RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referencia de permisos RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Gestión de archivos de bots de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requiere Graph)
- [Mensajería proactiva](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI de Teams para gestión de bots

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de chats grupales y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de seguridad
