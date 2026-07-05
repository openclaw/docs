---
read_when:
    - Trabajando en las funciones del canal de Microsoft Teams
summary: Estado de soporte, capacidades y configuración del bot de Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-05T11:03:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00ce5e18ce45700233e62fff3d9dc8f013a0eacd103d9ca6f2c6256643121ca7
    source_path: channels/msteams.md
    workflow: 16
---

Estado: se admiten texto y adjuntos en DM; el envío de archivos en canales/grupos requiere `sharePointSiteId` + permisos de Graph (consulta [Enviar archivos en chats grupales](#sending-files-in-group-chats)). Las encuestas se envían mediante Adaptive Cards. Las acciones de mensaje exponen `upload-file` explícito para envíos centrados primero en archivos.

## Plugin incluido

Microsoft Teams se distribuye como Plugin incluido en las versiones actuales de OpenClaw; no se requiere una instalación separada en la compilación empaquetada normal.

En una compilación anterior o una instalación personalizada que excluya Teams incluido, instala el paquete npm directamente:

```bash
openclaw plugins install @openclaw/msteams
```

Usa el paquete base para seguir la etiqueta de la versión oficial actual. Fija una versión exacta solo cuando necesites una instalación reproducible.

Checkout local (ejecutado desde un repositorio git):

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
La CLI de Teams está actualmente en vista previa. Los comandos y las marcas pueden cambiar entre versiones.
</Note>

**2. Inicia un túnel** (Teams no puede acceder a localhost)

Instala y autentica la CLI de devtunnel si es necesario ([guía de introducción](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` es obligatorio porque Teams no puede autenticarse con devtunnels. Cada solicitud entrante del bot sigue siendo validada por el SDK de Teams.
</Note>

Alternativas: `ngrok http 3978` o `tailscale funnel 3978` (las URL pueden cambiar en cada sesión).

**3. Crea la aplicación**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Esto crea una aplicación de Entra ID (Azure AD), genera un secreto de cliente, compila y carga un manifiesto de aplicación de Teams (con iconos) y registra un bot administrado por Teams (no se necesita suscripción de Azure). La salida incluye `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` y un **ID de aplicación de Teams**; también ofrece instalar la aplicación directamente en Teams.

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

`teams app create` te pide instalar la aplicación; selecciona "Install in Teams". Para obtener el enlace de instalación más tarde:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifica que todo funcione**

```bash
teams app doctor <teamsAppId>
```

Ejecuta diagnósticos sobre el registro del bot, la configuración de la aplicación AAD, la validez del manifiesto y la configuración de SSO.

Para producción, considera la [autenticación federada](#federated-authentication-certificate-plus-managed-identity) (certificado o identidad administrada) en lugar de secretos de cliente.

<Note>
Los chats grupales están bloqueados de forma predeterminada (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respuestas en grupos, define `channels.msteams.groupAllowFrom` o usa `groupPolicy: "open"` para permitir cualquier miembro (condicionado a mención).
</Note>

## Objetivos

- Hablar con OpenClaw mediante DM de Teams, chats grupales o canales.
- Mantener el enrutamiento determinista: las respuestas siempre vuelven al canal desde el que llegaron.
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
- `channels.msteams.allowFrom` debe usar ID de objeto AAD estables o grupos estáticos de acceso de remitentes como `accessGroup:core-team`.
- No dependas de coincidencias por UPN/nombre visible para listas de permitidos; pueden cambiar. OpenClaw desactiva la coincidencia directa de nombres de forma predeterminada; actívala con `channels.msteams.dangerouslyAllowNameMatching: true`.
- El asistente puede resolver nombres a ID mediante Microsoft Graph cuando las credenciales lo permiten.

**Acceso de grupo**

- Valor predeterminado: `channels.msteams.groupPolicy = "allowlist"` (bloqueado salvo que agregues `groupAllowFrom`). `channels.defaults.groupPolicy` puede sobrescribir el valor compartido predeterminado cuando `channels.msteams.groupPolicy` no está definido.
- `channels.msteams.groupAllowFrom` controla qué remitentes o grupos estáticos de acceso de remitentes pueden activar en chats grupales/canales (recurre a `channels.msteams.allowFrom`).
- Define `groupPolicy: "open"` para permitir cualquier miembro (sigue condicionado a mención de forma predeterminada).
- Para bloquear **todos** los canales, define `channels.msteams.groupPolicy: "disabled"`.

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

**Lista de permitidos de equipo + canal**

- Limita las respuestas de grupos/canales enumerando equipos y canales en `channels.msteams.teams`.
- Usa ID de conversación de Teams estables tomados de enlaces de Teams como claves, no nombres visibles mutables (consulta [ID de equipo y canal](#team-and-channel-ids-common-gotcha)).
- Cuando `groupPolicy="allowlist"` y hay una lista de permitidos de equipos, solo se aceptan los equipos/canales enumerados (condicionados a mención).
- El asistente de configuración acepta entradas `Team/Channel` y las almacena por ti.
- Al inicio, OpenClaw resuelve nombres de equipo/canal y de listas de permitidos de usuarios a ID (cuando los permisos de Graph lo permiten) y registra la asignación. Los nombres sin resolver se conservan tal como se escribieron, pero se ignoran para el enrutamiento salvo que `channels.msteams.dangerouslyAllowNameMatching: true` esté definido.

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

### Cómo funciona

1. Asegúrate de que el Plugin de Microsoft Teams esté disponible (incluido en las versiones actuales).
2. Crea un **Azure Bot** (ID de aplicación + secreto + ID de inquilino).
3. Compila un **paquete de aplicación de Teams** que haga referencia al bot e incluya los permisos RSC siguientes.
4. Carga/instala la aplicación de Teams en un equipo (o ámbito personal para DM).
5. Configura `msteams` en `~/.openclaw/openclaw.json` (o variables de entorno) e inicia el Gateway.
6. El Gateway escucha tráfico de Webhook de Bot Framework en `/api/messages` de forma predeterminada.

### Paso 1: Crea un Azure Bot

1. Ve a [Crear Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Completa la pestaña **Datos básicos**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Identificador del bot** | Nombre de tu bot, p. ej., `openclaw-msteams` (debe ser único) |
   | **Suscripción**   | Selecciona tu suscripción de Azure                       |
   | **Grupo de recursos** | Crea uno nuevo o usa uno existente                    |
   | **Nivel de precios** | **Gratis** para desarrollo/pruebas                     |
   | **Tipo de aplicación** | **Inquilino único** (recomendado; consulta la nota siguiente) |
   | **Tipo de creación** | **Crear nuevo ID de aplicación de Microsoft**          |

<Warning>
La creación de nuevos bots multiinquilino quedó obsoleta después del 2025-07-31. Usa **Inquilino único** para bots nuevos.
</Warning>

3. Haz clic en **Revisar y crear** y luego en **Crear** (~1-2 minutos).

### Paso 2: Obtén credenciales

1. Recurso Azure Bot → **Configuración** → copia **ID de aplicación de Microsoft** (tu `appId`).
2. **Administrar contraseña** → Registro de aplicación → **Certificados y secretos** → **Nuevo secreto de cliente** → copia el **Valor** (tu `appPassword`).
3. **Información general** → copia **ID de directorio (inquilino)** (tu `tenantId`).

### Paso 3: Configura el extremo de mensajería

1. Azure Bot → **Configuración**.
2. Define **Extremo de mensajería**:
   - Producción: `https://your-domain.com/api/messages`
   - Desarrollo local: usa un túnel (consulta [Desarrollo local](#local-development-tunneling))

### Paso 4: Habilita el canal de Teams

1. Azure Bot → **Canales**.
2. Haz clic en **Microsoft Teams** → Configurar → Guardar.
3. Acepta los Términos del servicio.

### Paso 5: Compila el manifiesto de la aplicación de Teams

- Incluye una entrada `bot` con `botId = <App ID>`.
- Ámbitos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obligatorio para el manejo de archivos en ámbito personal).
- Agrega permisos RSC (consulta [Permisos RSC](#current-teams-rsc-permissions-manifest)).
- Crea iconos: `outline.png` (32x32) y `color.png` (192x192).
- Comprime `manifest.json`, `outline.png` y `color.png` juntos.

### Paso 6: Configura OpenClaw

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

### Paso 7: Ejecuta el Gateway

El canal de Teams se inicia automáticamente cuando el Plugin está disponible y la configuración `msteams` tiene credenciales.

</details>

## Autenticación federada (certificado más identidad administrada)

Para producción, OpenClaw admite **autenticación federada** como alternativa a los secretos de cliente, mediante `channels.msteams.authType: "federated"`. Dos métodos:

### Opción A: Autenticación basada en certificado

Usa un certificado PEM registrado con el registro de aplicación de Entra ID.

**Configuración:**

1. Genera u obtén un certificado (formato PEM con clave privada).
2. Entra ID → Registro de aplicación → **Certificados y secretos** → **Certificados** → carga el certificado público.

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

Usa Azure Managed Identity para autenticación sin contraseña en infraestructura de Azure (AKS, App Service, máquinas virtuales de Azure).

**Cómo funciona:**

1. El pod/VM del bot tiene una identidad administrada (asignada por el sistema o por el usuario).
2. Una credencial de identidad federada vincula la identidad administrada con el registro de aplicación de Entra ID.
3. En tiempo de ejecución, OpenClaw usa `@azure/identity` para adquirir tokens desde el extremo IMDS de Azure.
4. El token se pasa al SDK de Teams para la autenticación del bot.

**Requisitos previos:**

- Infraestructura de Azure con identidad administrada habilitada (identidad de carga de trabajo de AKS, App Service, VM).
- Credencial de identidad federada creada en el registro de aplicación de Entra ID.
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

**Configuración (identidad administrada asignada por el usuario):** agrega `managedIdentityClientId: "<MI_CLIENT_ID>"` al bloque anterior.

**Variables de entorno:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo asignada por el usuario)

### Configuración de AKS Workload Identity

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

5. **Permite el acceso de red** a IMDS (`169.254.169.254`): si usas NetworkPolicy, agrega una regla de salida para `169.254.169.254/32` en el puerto 80.

### Comparación de tipos de autenticación

| Método                  | Config                                         | Ventajas                           | Desventajas                                    |
| ----------------------- | ---------------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| **Secreto de cliente**  | `appPassword`                                  | Configuración simple               | Requiere rotación de secretos, menos seguro    |
| **Certificado**         | `authType: "federated"` + `certificatePath`    | Sin secreto compartido en la red   | Sobrecarga de gestión de certificados          |
| **Identidad administrada** | `authType: "federated"` + `useManagedIdentity` | Sin contraseña, sin secretos que gestionar | Requiere infraestructura de Azure              |

`certificateThumbprint` se puede establecer junto con `certificatePath`, pero la ruta de autenticación no lo lee actualmente; se acepta solo para compatibilidad futura.

**Predeterminado:** cuando `authType` no está establecido, OpenClaw usa autenticación con secreto de cliente (`appPassword`). Las configuraciones existentes siguen funcionando sin cambios.

## Desarrollo local (túneles)

Teams no puede acceder a `localhost`. Usa un túnel de desarrollo persistente para que la URL se mantenga estable entre sesiones:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternativas: `ngrok http 3978` o `tailscale funnel 3978` (las URL pueden cambiar en cada sesión).

Si la URL del túnel cambia, actualiza el endpoint:

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

1. Instala la aplicación de Teams (enlace de instalación desde `teams app get <id> --install-link`).
2. Busca el bot en Teams y envía un DM.
3. Revisa los registros de Gateway para ver la actividad entrante.

## Variables de entorno

Estas claves de configuración relacionadas con la autenticación se pueden establecer mediante variables de entorno en lugar de `openclaw.json` (otras claves de configuración, como `groupPolicy` o `historyLimit`, solo están disponibles en la configuración):

| Variable de entorno                  | Clave de configuración   | Notas                                  |
| ------------------------------------ | ------------------------- | -------------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                        |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                        |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                        |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` o `"federated"`             |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | federado + certificado                 |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | aceptado, no requerido para autenticación |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | federado + identidad administrada      |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | solo identidad administrada asignada por el usuario |

## Acción de información de miembros

OpenClaw expone una acción de mensaje `member-info` respaldada por Graph para Microsoft Teams, de modo que los agentes y las automatizaciones puedan resolver detalles de miembros del canal (nombre para mostrar, correo electrónico, cargo, UPN, ubicación de oficina) directamente desde Microsoft Graph.

Requisitos:

- Permiso RSC `Member.Read.Group` (ya incluido en el manifiesto recomendado).
- Para búsquedas entre equipos: permiso de aplicación de Graph `User.Read.All` con consentimiento de administrador.

La acción se ejecuta siempre que las credenciales de Graph estén configuradas; falla con un error de autenticación de Graph cuando no lo están. No hay un interruptor `channels.msteams.actions.memberInfo` separado.

## Contexto de historial

- `channels.msteams.historyLimit` controla cuántos mensajes recientes de canal/grupo se envuelven en el prompt. Recurre a `messages.groupChat.historyLimit` y luego usa 50 de forma predeterminada. Establece `0` para deshabilitarlo.
- El historial de hilos obtenido se filtra por listas de remitentes permitidos (`allowFrom` / `groupAllowFrom`), por lo que la inicialización del contexto del hilo solo incluye mensajes de remitentes permitidos.
- El contexto de adjuntos citados (analizado desde el HTML del esquema de respuesta de Skype en los adjuntos propios de una respuesta) se pasa sin filtrar; actualmente, solo la inicialización del historial de hilos aplica el filtro de lista de remitentes permitidos.
- El historial de DM se puede limitar con `channels.msteams.dmHistoryLimit` (turnos de usuario). Sustituciones por usuario: `channels.msteams.dms["<user_id>"].historyLimit`.

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

**Para chats grupales:**

- `ChatMessage.Read.Chat` (Application) - recibir todos los mensajes del chat grupal sin @mention

Agrega permisos RSC mediante la CLI de Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Manifiesto de ejemplo de Teams (redactado)

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

### Advertencias del manifiesto (campos obligatorios)

- `bots[].botId` **debe** coincidir con el App ID de Azure Bot.
- `webApplicationInfo.id` **debe** coincidir con el App ID de Azure Bot.
- `bots[].scopes` debe incluir las superficies que planeas usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` es obligatorio para la gestión de archivos en el ámbito personal.
- `authorization.permissions.resourceSpecific` debe incluir lectura/envío de canales para el tráfico de canales.

### Actualizar una aplicación existente

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Después de actualizar, reinstala la aplicación en cada equipo y **sal completamente de Teams y vuelve a iniciarlo** (no solo cierres la ventana) para borrar los metadatos de aplicación en caché.

<details>
<summary>Actualización manual del manifiesto (sin CLI)</summary>

1. Actualiza `manifest.json` con la nueva configuración.
2. **Incrementa el campo `version`** (por ejemplo, `1.0.0` → `1.1.0`).
3. **Vuelve a comprimir** el manifiesto con iconos (`manifest.json`, `outline.png`, `color.png`).
4. Sube el nuevo zip:
   - **Centro de administración de Teams:** Aplicaciones de Teams → Administrar aplicaciones → busca tu aplicación → Cargar nueva versión.
   - **Carga lateral:** Teams → Aplicaciones → Administrar tus aplicaciones → Cargar una aplicación personalizada.

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
- Leer historial de mensajes más allá del evento Webhook en vivo.

### Con **RSC de Teams + permisos de aplicación de Microsoft Graph**

Agrega:

- Descargar contenido hospedado (imágenes pegadas en mensajes).
- Descargar adjuntos de archivos almacenados en SharePoint/OneDrive.
- Leer historial de mensajes de canales/chats mediante Graph.

### RSC frente a Graph API

| Capacidad                | Permisos RSC          | Graph API                                      |
| ------------------------ | --------------------- | ---------------------------------------------- |
| **Mensajes en tiempo real** | Sí (vía Webhook)      | No (solo sondeo)                               |
| **Mensajes históricos**  | No                    | Sí (puede consultar historial)                 |
| **Complejidad de configuración** | Solo manifiesto de aplicación | Requiere consentimiento de administrador + flujo de token |
| **Funciona sin conexión** | No (debe estar en ejecución) | Sí (consulta en cualquier momento)             |

**Resumen:** RSC sirve para escucha en tiempo real; Graph API sirve para acceso histórico. Para ponerte al día con mensajes perdidos mientras estabas sin conexión, necesitas Graph API con `ChannelMessage.Read.All` (requiere consentimiento de administrador).

## Medios + historial habilitados con Graph (requerido para canales)

Para imágenes/archivos en **canales**, o para obtener **historial de mensajes**, habilita permisos de Microsoft Graph y concede consentimiento de administrador:

1. **Registro de aplicación** de Entra ID (Azure AD) → agrega **permisos de aplicación** de Graph:
   - `ChannelMessage.Read.All` (adjuntos de canal + historial)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chats grupales)
2. **Concede consentimiento de administrador** para el tenant.
3. Incrementa la **versión del manifiesto** de la aplicación de Teams, vuelve a subirlo y **reinstala la aplicación en Teams**.
4. **Sal completamente de Teams y vuelve a iniciarlo** para borrar los metadatos de aplicación en caché.

**Menciones de usuario:** las @mentions funcionan de inmediato para usuarios que ya están en la conversación. Para buscar y mencionar dinámicamente a usuarios **que no están en la conversación actual**, agrega el permiso `User.Read.All` (Application) y concede consentimiento de administrador.

## Limitaciones conocidas

### Tiempos de espera de Webhook

Teams entrega mensajes mediante Webhook HTTP. OpenClaw aplica tiempos de espera fijos del servidor HTTP a ese listener de Webhook: 30 s de inactividad, 30 s de solicitud total, 15 s para recibir encabezados. Si el procesamiento del agente tarda más que la propia ventana de reintento del cliente, puedes ver:

- Teams reintentando el mensaje (lo que causa duplicados).
- Respuestas descartadas.

OpenClaw confirma el webhook rápidamente (antes de que termine el procesamiento del agente) y envía respuestas de forma proactiva cuando el agente responde, pero las ejecuciones de agente muy lentas aún pueden provocar reintentos/duplicados del lado de Teams.

### Compatibilidad con la nube y la URL de servicio de Teams

Esta ruta de Teams respaldada por SDK está validada en vivo para la nube pública de Microsoft Teams.

Las respuestas entrantes usan el contexto de turno entrante del SDK de Teams. Las operaciones proactivas fuera de contexto - envíos, ediciones, eliminaciones, tarjetas, encuestas, mensajes de consentimiento de archivos y respuestas en cola de larga duración - usan el `serviceUrl` de la referencia de conversación almacenada. La nube pública usa de forma predeterminada el entorno de nube pública del SDK de Teams y permite referencias almacenadas en el host público de Teams Connector: `https://smba.trafficmanager.net/`.

La nube pública es la predeterminada. No necesitas configurar `channels.msteams.cloud` ni `channels.msteams.serviceUrl` para bots normales de nube pública.

Para nubes de Teams no públicas, configura `cloud` y el límite proactivo correspondiente cuando Microsoft publique uno:

- `channels.msteams.cloud` selecciona el preset de nube del SDK de Teams para autenticación, validación de JWT, servicios de tokens y ámbito de Graph.
- `channels.msteams.serviceUrl` selecciona el límite del endpoint de Bot Connector usado para validar referencias de conversación almacenadas antes de envíos, ediciones, eliminaciones, tarjetas, encuestas, mensajes de consentimiento de archivos y respuestas en cola de larga duración proactivos. Es obligatorio para las nubes SDK USGov y DoD. Para China/21Vianet, OpenClaw usa el preset `China` del SDK y acepta URL de servicio almacenadas/configuradas solo en hosts de canal de Azure China Bot Framework.

Microsoft publica los endpoints globales proactivos de Bot Connector en la sección [Crear la conversación](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) de la documentación de mensajería proactiva de Teams. Usa el `serviceUrl` de la actividad entrante cuando esté disponible; de lo contrario, usa la tabla de Microsoft que aparece abajo.

| Entorno de Teams | Configuración de OpenClaw                                  | `serviceUrl` proactivo                            |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Público           | no se necesita configuración de cloud/serviceUrl            | `https://smba.trafficmanager.net/teams`            |
| GCC               | configura `serviceUrl`; no existe un preset de nube GCC separado del SDK de Teams | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | usa el `serviceUrl` de la actividad entrante       |

Ejemplo para GCC, donde Microsoft documenta una URL de servicio proactiva separada pero el SDK de Teams no expone un preset de nube GCC separado:

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

`channels.msteams.serviceUrl` está restringido a hosts compatibles de Microsoft Teams Bot Connector. Cuando se configura una URL de servicio, OpenClaw comprueba que el `serviceUrl` de la conversación almacenada use el mismo host antes de ejecutar envíos, ediciones, eliminaciones, tarjetas, encuestas o respuestas en cola de larga duración proactivos. Con la configuración predeterminada de nube pública, OpenClaw falla de forma cerrada si una conversación almacenada apunta fuera del host público de Teams Connector. Recibe un mensaje nuevo de la conversación después de cambiar la configuración de nube/URL de servicio para que la referencia de conversación almacenada esté actualizada.

China/21Vianet no tiene una URL global proactiva `smba` separada en la tabla de endpoints proactivos de Teams de Microsoft. Configura `cloud: "China"` para que el SDK de Teams use los endpoints de autenticación, tokens y JWT de Azure China. Los envíos proactivos requieren entonces una referencia de conversación almacenada de una actividad entrante de China Teams, o una URL de servicio configurada explícitamente, en el límite de canal de Azure China Bot Framework (`*.botframework.azure.cn`). Los helpers de Teams respaldados por Graph están deshabilitados para `cloud: "China"` hasta que OpenClaw enrute las solicitudes de Graph a través del endpoint de Azure China Graph.

### Formato

El markdown de Teams es más limitado que el de Slack o Discord:

- El formato básico funciona: **negrita**, _cursiva_, `code`, enlaces.
- El markdown complejo (tablas, listas anidadas) puede no renderizarse correctamente.
- Las Adaptive Cards son compatibles para encuestas y envíos de presentación semántica (ver abajo).

## Configuración

Ajustes clave (consulta [/gateway/configuration](/es/gateway/configuration) para patrones compartidos de canales):

- `channels.msteams.enabled`: habilita/deshabilita el canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciales del bot.
- `channels.msteams.cloud`: entorno de nube del SDK de Teams (`Public`, `USGov`, `USGovDoD` o `China`; predeterminado `Public`). Configúralo con `serviceUrl` para las nubes SDK USGov/DoD; China usa el preset del SDK y referencias de conversación almacenadas de Azure China Bot Framework, con helpers respaldados por Graph deshabilitados hasta que se publique el enrutamiento de Azure China Graph.
- `channels.msteams.serviceUrl`: límite de URL de servicio de Bot Connector para operaciones proactivas del SDK. La nube pública usa el valor predeterminado del SDK; configúralo para GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High o DoD. China acepta hosts de canal de Azure China Bot Framework cuando la referencia de conversación almacenada proviene de Teams operado por 21Vianet.
- `channels.msteams.webhook.port` (predeterminado `3978`).
- `channels.msteams.webhook.path` (predeterminado `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado `pairing`).
- `channels.msteams.allowFrom`: lista de permitidos de DM (se recomiendan los ID de objeto de AAD). El asistente resuelve nombres a ID durante la configuración cuando el acceso a Graph está disponible.
- `channels.msteams.dangerouslyAllowNameMatching`: conmutador de emergencia para volver a habilitar la coincidencia mutable por UPN/nombre visible y el enrutamiento directo por nombre de equipo/canal.
- `channels.msteams.textChunkLimit`: tamaño de fragmento de texto saliente en caracteres (predeterminado `4000`, y limitado estrictamente a `4000` aunque se configure un valor mayor).
- `channels.msteams.chunkMode`: `length` (predeterminado) o `newline` para dividir en líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.msteams.mediaAllowHosts`: lista de permitidos para hosts de adjuntos entrantes (valores predeterminados a dominios de Microsoft/Teams: Graph, SharePoint/OneDrive, CDN de Teams, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: lista de permitidos para adjuntar encabezados Authorization en reintentos de medios (valores predeterminados a hosts de Graph + Bot Framework).
- `channels.msteams.mediaMaxMb`: anulación del límite de tamaño de medios por canal en MB. Recurre a `agents.defaults.mediaMaxMb` cuando no está configurado.
- `channels.msteams.requireMention`: requiere @mención en canales/grupos (predeterminado `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (consulta [Estilo de respuesta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: anulación por equipo.
- `channels.msteams.teams.<teamId>.requireMention`: anulación por equipo.
- `channels.msteams.teams.<teamId>.tools`: anulaciones predeterminadas de política de herramientas por equipo (`allow`/`deny`/`alsoAllow`) usadas cuando falta una anulación de canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: anulaciones predeterminadas de política de herramientas por equipo y por remitente (se admite el comodín `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: anulación por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: anulaciones de política de herramientas por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: anulaciones de política de herramientas por canal y por remitente (se admite el comodín `"*"`).
- Las claves de `toolsBySender` deben usar prefijos explícitos: `channel:`, `id:`, `e164:`, `username:`, `name:` (las claves heredadas sin prefijo aún se asignan solo a `id:`).
- `channels.msteams.authType`: tipo de autenticación - `"secret"` (predeterminado) o `"federated"`.
- `channels.msteams.certificatePath`: ruta al archivo de certificado PEM (autenticación federada + certificado).
- `channels.msteams.certificateThumbprint`: huella digital del certificado; se acepta, no es obligatoria para la autenticación.
- `channels.msteams.useManagedIdentity`: habilita autenticación con identidad administrada (modo federado).
- `channels.msteams.managedIdentityClientId`: ID de cliente para identidad administrada asignada por el usuario.
- `channels.msteams.sharePointSiteId`: ID de sitio de SharePoint para cargas de archivos en chats grupales/canales (consulta [Enviar archivos en chats grupales](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card de bienvenida mostrada en el primer contacto por DM/grupo, y sus botones de prompts sugeridos.
- `channels.msteams.responsePrefix`: texto prefijado a las respuestas salientes.
- `channels.msteams.feedbackEnabled` (predeterminado `true`), `channels.msteams.feedbackReflection` (predeterminado `true`), `channels.msteams.feedbackReflectionCooldownMs`: feedback de pulgar arriba/abajo en respuestas y seguimiento de reflexión ante feedback negativo.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: conexión OAuth de Bot Framework y ámbitos delegados de Graph para flujos respaldados por SSO; `sso.enabled: true` requiere `sso.connectionName`.

## Enrutamiento y sesiones

- Las claves de sesión siguen el formato estándar del agente (consulta [/concepts/session](/es/concepts/session)):
  - Los mensajes directos comparten la sesión principal (`agent:<agentId>:<mainKey>`).
  - Los mensajes de canal/grupo usan el id de conversación:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de respuesta: hilos frente a publicaciones

Teams tiene dos estilos de interfaz de canal sobre el mismo modelo de datos subyacente:

| Estilo                   | Descripción                                               | `replyStyle` recomendado |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Publicaciones** (clásico) | Los mensajes aparecen como tarjetas con respuestas en hilo debajo | `thread` (predeterminado) |
| **Hilos** (tipo Slack)   | Los mensajes fluyen linealmente, más como Slack           | `top-level`              |

**El problema:** la API de Teams no expone qué estilo de interfaz usa un canal. Si usas el `replyStyle` incorrecto:

- `thread` en un canal con estilo de hilos → las respuestas aparecen anidadas de forma incómoda.
- `top-level` en un canal con estilo de publicaciones → las respuestas aparecen como publicaciones independientes de nivel superior en lugar de dentro del hilo.

**Solución:** configura `replyStyle` por canal según cómo esté configurado el canal:

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

1. **Por canal** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Por equipo** - `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** - `channels.msteams.replyStyle`
4. **Predeterminado implícito** - derivado de `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Si configuras `requireMention: false` globalmente sin un `replyStyle` explícito, las menciones en canales de estilo Publicaciones aparecen como publicaciones de nivel superior incluso cuando la entrada fue una respuesta de hilo. Fija `replyStyle: "thread"` en el nivel global, de equipo o de canal para evitar sorpresas.

Para envíos proactivos a una conversación de canal almacenada (respuestas de llamadas a herramientas en cola, agentes de larga duración), se aplica la misma resolución de equipo/canal; los chats grupales y las conversaciones personales (DM) siempre se resuelven como `top-level` para envíos proactivos, independientemente de `replyStyle`.

### Conservación del contexto de hilo

Cuando `replyStyle: "thread"` está activo y se @mencionó al bot desde dentro de un hilo de canal, OpenClaw vuelve a adjuntar la raíz del hilo original a la referencia de conversación saliente (`19:...@thread.tacv2;messageid=<root>`) para que la respuesta llegue dentro del mismo hilo. Esto se cumple tanto para envíos en vivo (dentro del turno) como para envíos proactivos realizados después de que el contexto de turno de Bot Framework haya expirado (por ejemplo, agentes de larga duración, respuestas de llamadas a herramientas en cola mediante `mcp__openclaw__message`).

La raíz del hilo se toma del `threadId` almacenado en la referencia de conversación. Las referencias almacenadas más antiguas que preceden a `threadId` recurren a `activityId` (cualquier actividad entrante que haya inicializado la conversación por última vez), por lo que las implementaciones existentes siguen funcionando sin volver a inicializarse.

Cuando `replyStyle: "top-level"` está activo, las entradas de hilos de canal se responden intencionadamente como nuevas publicaciones de nivel superior; no se adjunta ningún sufijo de hilo. Esto es correcto para canales de estilo Hilos; las publicaciones de nivel superior donde esperabas respuestas en hilo significan que `replyStyle` está configurado incorrectamente para ese canal.

## Adjuntos e imágenes

**Limitaciones actuales:**

- **DM:** las imágenes y los archivos adjuntos funcionan mediante las API de archivos de bot de Teams.
- **Canales/grupos:** los adjuntos viven en el almacenamiento de M365 (SharePoint/OneDrive). La carga del Webhook solo incluye un fragmento HTML, no los bytes reales del archivo. **Se requieren permisos de Graph API** para descargar adjuntos de canal.
- Para envíos explícitos centrados en archivos, usa `action=upload-file` con `media` / `filePath` / `path`; el `message` opcional se convierte en el texto/comentario que acompaña, y `filename` (o `title`) sobrescribe el nombre subido.

Sin permisos de Graph, los mensajes de canal con imágenes llegan solo como texto (el contenido de la imagen no es accesible para el bot).
De forma predeterminada, OpenClaw solo descarga medios desde nombres de host de Microsoft/Teams. Sobrescribe esto con `channels.msteams.mediaAllowHosts` (usa `["*"]` para permitir cualquier host).
Los encabezados de autorización solo se adjuntan para hosts en `channels.msteams.mediaAuthAllowHosts` (valores predeterminados: hosts de Graph + Bot Framework). Mantén esta lista estricta (evita sufijos multiinquilino).

## Enviar archivos en chats grupales

Los bots pueden enviar archivos en DM usando el flujo integrado FileConsentCard. **Enviar archivos en chats grupales/canales** requiere configuración adicional:

| Contexto                 | Cómo se envían los archivos                  | Configuración necesaria                        |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → el usuario acepta → el bot sube | Funciona sin configuración adicional        |
| **Chats grupales/canales** | Subir a SharePoint → compartir enlace      | Requiere `sharePointSiteId` + permisos de Graph |
| **Imágenes (cualquier contexto)** | Codificadas en Base64 en línea       | Funciona sin configuración adicional            |

### Por qué los chats grupales necesitan SharePoint

Los bots no tienen una unidad personal de OneDrive (`/me/drive` no funciona para identidades de aplicación). Para enviar archivos en chats grupales/canales, el bot sube a un **sitio de SharePoint** y crea un enlace para compartir.

### Configuración

1. **Agrega permisos de Graph API** en Entra ID (Azure AD) → Registro de aplicación:
   - `Sites.ReadWrite.All` (Aplicación) - subir archivos a SharePoint.
   - `Chat.Read.All` (Aplicación) - opcional, habilita enlaces para compartir por usuario.
2. **Concede consentimiento de administrador** para el inquilino.
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

### Comportamiento al compartir

| Permiso                                | Comportamiento al compartir                              |
| -------------------------------------- | -------------------------------------------------------- |
| Solo `Sites.ReadWrite.All`             | Enlace para compartir en toda la organización (cualquiera de la organización puede acceder) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Enlace para compartir por usuario (solo los miembros del chat pueden acceder) |

Compartir por usuario es más seguro, ya que solo los participantes del chat pueden acceder al archivo. Si falta `Chat.Read.All`, el bot recurre a compartir en toda la organización.

### Comportamiento de reserva

| Escenario                                        | Resultado                                          |
| ------------------------------------------------ | -------------------------------------------------- |
| Chat grupal + archivo + `sharePointSiteId` configurado | Subir a SharePoint, enviar enlace para compartir |
| Chat grupal + archivo + sin `sharePointSiteId`   | Intentar subida a OneDrive (puede fallar), enviar solo texto |
| Chat personal + archivo                          | Flujo FileConsentCard (funciona sin SharePoint)    |
| Cualquier contexto + imagen                      | Codificada en Base64 en línea (funciona sin SharePoint) |

### Ubicación de archivos almacenados

Los archivos subidos se almacenan en una carpeta `/OpenClawShared/` en la biblioteca de documentos predeterminada del sitio de SharePoint configurado.

## Encuestas (Adaptive Cards)

OpenClaw envía encuestas de Teams como Adaptive Cards (no hay una API nativa de encuestas de Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Los votos se registran por el Gateway en el estado de Plugin SQLite de OpenClaw bajo `state/openclaw.sqlite`.
- Los archivos `msteams-polls.json` existentes son importados por `openclaw doctor --fix`, no por el Plugin en ejecución.
- El Gateway debe permanecer en línea para registrar votos.
- Las encuestas no publican automáticamente resúmenes de resultados, y todavía no hay una CLI de resultados de encuesta.

## Tarjetas de presentación

Envía cargas de presentación semánticas a usuarios o conversaciones de Teams usando la herramienta `message`, la CLI o la entrega normal de respuestas. OpenClaw las renderiza como Adaptive Cards de Teams desde el contrato de presentación genérico.

El parámetro `presentation` acepta bloques semánticos. Cuando se proporciona `presentation`, el texto del mensaje es opcional. Los botones se renderizan como acciones de envío o URL de Adaptive Card. Los menús de selección no son nativos en el renderizador de Teams, por lo que OpenClaw los degrada a texto legible antes de la entrega.

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

Para obtener detalles sobre el formato de destino, consulta [Formatos de destino](#target-formats) a continuación.

## Formatos de destino

Los destinos de MSTeams usan prefijos para distinguir entre usuarios y conversaciones:

| Tipo de destino      | Formato                          | Ejemplo                                                                                                |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Usuario (por ID)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| Usuario (por nombre) | `user:<display-name>`            | `user:John Smith` (requiere Graph API)                                                                 |
| Grupo/canal          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| Grupo/canal (sin procesar) | `<conversation-id>`        | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces`, o un ID de Bot Framework simple `a:`/`8:orgid:`/`29:` |

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

**Ejemplos de herramienta de agente:**

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
Sin el prefijo `user:`, los nombres se resuelven de forma predeterminada como grupo o equipo. Usa siempre `user:` cuando apuntes a personas por nombre para mostrar.
</Note>

## Mensajería proactiva

- Los mensajes proactivos solo son posibles **después** de que un usuario haya interactuado, porque OpenClaw almacena referencias de conversación en ese momento.
- Consulta [/gateway/configuration](/es/gateway/configuration) para `dmPolicy` y el control por lista de permitidos.

## ID de equipo y canal (problema común)

El parámetro de consulta `groupId` en las URL de Teams **NO** es el ID de equipo usado para la configuración. Extrae los ID de la ruta de la URL en su lugar:

**URL de equipo:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL de canal:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Para la configuración:**

- Clave de equipo = segmento de ruta después de `/team/` (decodificado de URL, por ejemplo, `19:Bk4j...@thread.tacv2`; los inquilinos más antiguos pueden mostrar `@thread.skype`, que también es válido).
- Clave de canal = segmento de ruta después de `/channel/` (decodificado de URL).
- **Ignora** el parámetro de consulta `groupId` para el enrutamiento de OpenClaw. Es el ID de grupo de Microsoft Entra, no el ID de conversación de Bot Framework usado en las actividades entrantes de Teams.

## Canales privados

Los bots tienen soporte limitado en canales privados:

| Función                      | Canales estándar | Canales privados        |
| ---------------------------- | ---------------- | ----------------------- |
| Instalación del bot          | Sí               | Limitada                |
| Mensajes en tiempo real (Webhook) | Sí          | Puede no funcionar      |
| Permisos RSC                 | Sí               | Pueden comportarse de forma diferente |
| @menciones                   | Sí               | Si el bot es accesible  |
| Historial de Graph API       | Sí               | Sí (con permisos)       |

**Soluciones alternativas si los canales privados no funcionan:**

1. Usa canales estándar para las interacciones del bot.
2. Usa DMs; los usuarios siempre pueden enviar mensajes directamente al bot.
3. Usa Graph API para acceso histórico (requiere `ChannelMessage.Read.All`).

## Solución de problemas

### Problemas comunes

- **Las imágenes no aparecen en los canales:** faltan permisos de Graph o consentimiento del administrador. Reinstala la aplicación de Teams y cierra por completo/vuelve a abrir Teams.
- **No hay respuestas en el canal:** las menciones son obligatorias de forma predeterminada; establece `channels.msteams.requireMention=false` o configúralo por equipo/canal.
- **Incompatibilidad de versión (Teams sigue mostrando el manifiesto antiguo):** elimina y vuelve a agregar la aplicación, y cierra por completo Teams para actualizar.
- **401 Unauthorized desde Webhook:** es esperado al probar manualmente sin un JWT de Azure; significa que el endpoint es accesible, pero falló la autenticación. Usa Azure Web Chat para probar correctamente.

### Errores de carga del manifiesto

- **"Icon file cannot be empty":** el manifiesto referencia archivos de icono que tienen 0 bytes. Crea iconos PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** la aplicación aún está instalada en otro equipo/chat. Encuéntrala y desinstálala primero, o espera de 5 a 10 minutos para la propagación.
- **"Something went wrong" al cargar:** carga mediante [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) en su lugar, abre las herramientas de desarrollo del navegador (F12) → pestaña Network, y revisa el cuerpo de la respuesta para ver el error real.
- **Falla de sideload:** prueba "Upload an app to your org's app catalog" en lugar de "Upload a custom app"; esto a menudo evita las restricciones de sideload.

### Los permisos RSC no funcionan

1. Verifica que `webApplicationInfo.id` coincida exactamente con el App ID de tu bot.
2. Vuelve a cargar la aplicación y reinstálala en el equipo/chat.
3. Comprueba si el administrador de tu organización ha bloqueado los permisos RSC.
4. Confirma que estás usando el ámbito correcto: `ChannelMessage.Read.Group` para equipos, `ChatMessage.Read.Chat` para chats grupales.

## Referencias

- [Crear Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guía de configuración de Azure Bot
- [Portal para desarrolladores de Teams](https://dev.teams.microsoft.com/apps) - crear/administrar aplicaciones de Teams
- [Esquema del manifiesto de la aplicación de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Recibir mensajes de canal con RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referencia de permisos RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Manejo de archivos del bot de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requiere Graph)
- [Mensajería proactiva](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI de Teams para la administración del bot

## Relacionado

- [Descripción general de canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - flujo de autenticación y emparejamiento por DM
- [Grupos](/es/channels/groups) - comportamiento de chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y endurecimiento
