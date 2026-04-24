---
read_when:
    - Trabajando en funciones del canal de Microsoft Teams
summary: Estado de compatibilidad, capacidades y configuración del bot de Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T05:19:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

Se admiten texto y archivos adjuntos en DM; el envío de archivos en canales y grupos requiere `sharePointSiteId` + permisos de Graph (consulta [Envío de archivos en chats grupales](#sending-files-in-group-chats)). Las encuestas se envían mediante Adaptive Cards. Las acciones de mensaje exponen `upload-file` explícitamente para envíos centrados primero en archivos.

## Plugin incluido

Microsoft Teams se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que no se requiere una instalación independiente en la compilación empaquetada normal.

Si estás en una compilación anterior o en una instalación personalizada que excluye Teams incluido, instálalo manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiante)

1. Asegúrate de que el Plugin de Microsoft Teams esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas o personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Crea un **Azure Bot** (App ID + secreto de cliente + ID del inquilino).
3. Configura OpenClaw con esas credenciales.
4. Expón `/api/messages` (puerto 3978 de forma predeterminada) mediante una URL pública o un túnel.
5. Instala el paquete de la app de Teams e inicia el Gateway.

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

Para despliegues de producción, considera usar [autenticación federada](#federated-authentication) (certificado o identidad administrada) en lugar de secretos de cliente.

Nota: los chats grupales están bloqueados de forma predeterminada (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respuestas en grupo, configura `channels.msteams.groupAllowFrom` (o usa `groupPolicy: "open"` para permitir a cualquier miembro, con restricción por menciones).

## Escrituras de configuración

De forma predeterminada, Microsoft Teams puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`).

Desactívalo con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Control de acceso (DM y grupos)

**Acceso a DM**

- Predeterminado: `channels.msteams.dmPolicy = "pairing"`. Los remitentes desconocidos se ignoran hasta ser aprobados.
- `channels.msteams.allowFrom` debe usar ID de objeto AAD estables.
- No te bases en coincidencias de UPN/nombre para listas de permitidos; pueden cambiar. OpenClaw desactiva la coincidencia directa por nombre de forma predeterminada; actívala explícitamente con `channels.msteams.dangerouslyAllowNameMatching: true`.
- El asistente puede resolver nombres a ID mediante Microsoft Graph cuando las credenciales lo permiten.

**Acceso a grupos**

- Predeterminado: `channels.msteams.groupPolicy = "allowlist"` (bloqueado salvo que añadas `groupAllowFrom`). Usa `channels.defaults.groupPolicy` para sobrescribir el valor predeterminado cuando no esté configurado.
- `channels.msteams.groupAllowFrom` controla qué remitentes pueden activar en chats grupales/canales (recurre a `channels.msteams.allowFrom`).
- Configura `groupPolicy: "open"` para permitir a cualquier miembro (aun así, con restricción por menciones de forma predeterminada).
- Para permitir **ningún canal**, configura `channels.msteams.groupPolicy: "disabled"`.

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

- Limita las respuestas de grupo/canal enumerando equipos y canales en `channels.msteams.teams`.
- Las claves deben usar ID estables de equipo e ID de conversación del canal.
- Cuando `groupPolicy="allowlist"` y hay una lista de permitidos de equipos, solo se aceptan los equipos/canales listados (con restricción por menciones).
- El asistente de configuración acepta entradas `Team/Channel` y las almacena por ti.
- Al iniciar, OpenClaw resuelve nombres de equipo/canal y de usuarios en listas de permitidos a ID (cuando los permisos de Graph lo permiten)
  y registra la asignación; los nombres de equipo/canal no resueltos se conservan tal como se escribieron, pero se ignoran para el enrutamiento de forma predeterminada salvo que `channels.msteams.dangerouslyAllowNameMatching: true` esté habilitado.

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

## Configuración de Azure Bot

Antes de configurar OpenClaw, crea un recurso Azure Bot y captura sus credenciales.

<Steps>
  <Step title="Crear el Azure Bot">
    Ve a [Crear Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) y completa la pestaña **Básicos**:

    | Campo              | Valor                                                    |
    | ------------------ | -------------------------------------------------------- |
    | **Identificador del bot** | El nombre de tu bot, por ejemplo `openclaw-msteams` (debe ser único) |
    | **Suscripción**    | Tu suscripción de Azure                                  |
    | **Grupo de recursos** | Crea uno nuevo o usa uno existente                    |
    | **Plan de precios** | **Gratis** para desarrollo/pruebas                      |
    | **Tipo de aplicación** | **Single Tenant** (recomendado)                      |
    | **Tipo de creación** | **Create new Microsoft App ID**                        |

    <Note>
    Los nuevos bots multiinquilino quedaron obsoletos después del 2025-07-31. Usa **Single Tenant** para nuevos bots.
    </Note>

    Haz clic en **Review + create** → **Create** (espera ~1-2 minutos).

  </Step>

  <Step title="Capturar credenciales">
    Desde el recurso Azure Bot → **Configuration**:

    - copia **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → copia el valor → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Configurar el endpoint de mensajería">
    Azure Bot → **Configuration** → configura **Messaging endpoint**:

    - Producción: `https://your-domain.com/api/messages`
    - Desarrollo local: usa un túnel (consulta [Desarrollo local](#local-development-tunneling))

  </Step>

  <Step title="Habilitar el canal de Teams">
    Azure Bot → **Channels** → haz clic en **Microsoft Teams** → Configurar → Guardar. Acepta los Términos del servicio.
  </Step>
</Steps>

## Autenticación federada

> Añadido en 2026.3.24

Para despliegues de producción, OpenClaw admite **autenticación federada** como una alternativa más segura a los secretos de cliente. Hay dos métodos disponibles:

### Opción A: autenticación basada en certificados

Usa un certificado PEM registrado con el registro de la aplicación en Entra ID.

**Configuración:**

1. Genera u obtén un certificado (formato PEM con clave privada).
2. En Entra ID → Registro de aplicaciones → **Certificates & secrets** → **Certificates** → sube el certificado público.

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

### Opción B: identidad administrada de Azure

Usa identidad administrada de Azure para autenticación sin contraseña. Esto es ideal para despliegues en infraestructura de Azure (AKS, App Service, Azure VM) donde hay una identidad administrada disponible.

**Cómo funciona:**

1. El pod o la VM del bot tiene una identidad administrada (asignada por el sistema o por el usuario).
2. Una **credencial de identidad federada** vincula la identidad administrada con el registro de la aplicación en Entra ID.
3. En tiempo de ejecución, OpenClaw usa `@azure/identity` para adquirir tokens desde el endpoint Azure IMDS (`169.254.169.254`).
4. El token se pasa al SDK de Teams para la autenticación del bot.

**Requisitos previos:**

- Infraestructura de Azure con identidad administrada habilitada (identidad de carga de trabajo de AKS, App Service, VM)
- Credencial de identidad federada creada en el registro de la aplicación en Entra ID
- Acceso de red a IMDS (`169.254.169.254:80`) desde el pod o la VM

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo para la asignada por el usuario)

### Configuración de identidad de carga de trabajo en AKS

Para despliegues en AKS que usan identidad de carga de trabajo:

1. **Habilita la identidad de carga de trabajo** en tu clúster de AKS.
2. **Crea una credencial de identidad federada** en el registro de la aplicación en Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Anota la cuenta de servicio de Kubernetes** con el ID de cliente de la app:

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

5. **Asegura el acceso de red** a IMDS (`169.254.169.254`): si usas NetworkPolicy, añade una regla de salida que permita tráfico a `169.254.169.254/32` en el puerto 80.

### Comparación de tipos de autenticación

| Método               | Config                                         | Ventajas                            | Desventajas                            |
| -------------------- | ---------------------------------------------- | ----------------------------------- | -------------------------------------- |
| **Secreto de cliente** | `appPassword`                                | Configuración sencilla              | Requiere rotación de secretos, menos seguro |
| **Certificado**      | `authType: "federated"` + `certificatePath`    | No hay secreto compartido por red   | Sobrecarga de gestión de certificados  |
| **Identidad administrada** | `authType: "federated"` + `useManagedIdentity` | Sin contraseña, sin secretos que gestionar | Requiere infraestructura de Azure |

**Comportamiento predeterminado:** cuando `authType` no está configurado, OpenClaw usa autenticación por secreto de cliente de forma predeterminada. Las configuraciones existentes siguen funcionando sin cambios.

## Desarrollo local (tunelización)

Teams no puede acceder a `localhost`. Usa un túnel para desarrollo local:

**Opción A: ngrok**

```bash
ngrok http 3978
# Copia la URL https, por ejemplo, https://abc123.ngrok.io
# Configura el endpoint de mensajería en: https://abc123.ngrok.io/api/messages
```

**Opción B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Usa tu URL de Tailscale Funnel como endpoint de mensajería
```

## Teams Developer Portal (alternativa)

En lugar de crear manualmente un ZIP del manifiesto, puedes usar el [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Haz clic en **+ New app**
2. Completa la información básica (nombre, descripción, información del desarrollador)
3. Ve a **App features** → **Bot**
4. Selecciona **Enter a bot ID manually** y pega tu Azure Bot App ID
5. Marca los ámbitos: **Personal**, **Team**, **Group Chat**
6. Haz clic en **Distribute** → **Download app package**
7. En Teams: **Apps** → **Manage your apps** → **Upload a custom app** → selecciona el ZIP

Esto suele ser más fácil que editar manifiestos JSON a mano.

## Probar el bot

**Opción A: Azure Web Chat (primero verifica el webhook)**

1. En Azure Portal → tu recurso Azure Bot → **Test in Web Chat**
2. Envía un mensaje; deberías ver una respuesta
3. Esto confirma que tu endpoint webhook funciona antes de configurar Teams

**Opción B: Teams (después de instalar la app)**

1. Instala la app de Teams (carga local o catálogo de la organización)
2. Encuentra el bot en Teams y envíale un DM
3. Revisa los registros del Gateway para ver la actividad entrante

<Accordion title="Sobrescrituras mediante variables de entorno">

Cualquiera de las claves de configuración del bot/autenticación también puede establecerse mediante variables de entorno:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` o `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (federada + certificado)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (federada + identidad administrada; el ID de cliente solo para la asignada por el usuario)

</Accordion>

## Acción de información de miembro

OpenClaw expone una acción `member-info` respaldada por Graph para Microsoft Teams, de modo que los agentes y las automatizaciones puedan resolver detalles de miembros del canal (nombre para mostrar, correo electrónico, rol) directamente desde Microsoft Graph.

Requisitos:

- Permiso RSC `Member.Read.Group` (ya incluido en el manifiesto recomendado)
- Para búsquedas entre equipos: permiso de aplicación Graph `User.Read.All` con consentimiento de administrador

La acción está controlada por `channels.msteams.actions.memberInfo` (predeterminado: habilitada cuando hay credenciales de Graph disponibles).

## Contexto de historial

- `channels.msteams.historyLimit` controla cuántos mensajes recientes de canal/grupo se incorporan al prompt.
- Recurre a `messages.groupChat.historyLimit`. Configura `0` para desactivar (predeterminado 50).
- El historial de hilo recuperado se filtra mediante listas de permitidos de remitentes (`allowFrom` / `groupAllowFrom`), de modo que la inicialización del contexto del hilo solo incluye mensajes de remitentes permitidos.
- El contexto de archivos adjuntos citados (`ReplyTo*` derivado del HTML de respuesta de Teams) actualmente se pasa tal como se recibe.
- En otras palabras, las listas de permitidos controlan quién puede activar al agente; hoy solo se filtran rutas específicas de contexto suplementario.
- El historial de DM puede limitarse con `channels.msteams.dmHistoryLimit` (turnos del usuario). Sobrescrituras por usuario: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permisos RSC actuales de Teams

Estos son los **resourceSpecific permissions** existentes en el manifiesto de nuestra app de Teams. Solo se aplican dentro del equipo/chat donde está instalada la app.

**Para canales (ámbito de equipo):**

- `ChannelMessage.Read.Group` (Application): recibir todos los mensajes de canal sin @mención
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats grupales:**

- `ChatMessage.Read.Chat` (Application): recibir todos los mensajes de chat grupal sin @mención

## Ejemplo de manifiesto de Teams

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

- `bots[].botId` **debe** coincidir con el Azure Bot App ID.
- `webApplicationInfo.id` **debe** coincidir con el Azure Bot App ID.
- `bots[].scopes` debe incluir las superficies que planeas usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` es obligatorio para manejar archivos en el ámbito personal.
- `authorization.permissions.resourceSpecific` debe incluir permisos de lectura/envío de canal si quieres tráfico de canal.

### Actualizar una app existente

Para actualizar una app de Teams ya instalada (por ejemplo, para añadir permisos RSC):

1. Actualiza tu `manifest.json` con la nueva configuración
2. **Incrementa el campo `version`** (por ejemplo, `1.0.0` → `1.1.0`)
3. **Vuelve a comprimir en ZIP** el manifiesto con los iconos (`manifest.json`, `outline.png`, `color.png`)
4. Sube el nuevo ZIP:
   - **Opción A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → encuentra tu app → Upload new version
   - **Opción B (carga local):** En Teams → Apps → Manage your apps → Upload a custom app
5. **Para canales de equipo:** reinstala la app en cada equipo para que los nuevos permisos surtan efecto
6. **Cierra completamente y vuelve a abrir Teams** (no solo cierres la ventana) para limpiar los metadatos de app almacenados en caché

## Capacidades: solo RSC frente a Graph

### Solo Teams RSC (sin permisos de Microsoft Graph API)

Funciona:

- Leer contenido de **texto** de mensajes de canal.
- Enviar contenido de **texto** en mensajes de canal.
- Recibir archivos adjuntos en **mensajes personales (DM)**.

No funciona:

- Contenidos de **imagen o archivo** en canal/grupo (la carga útil solo incluye un fragmento HTML).
- Descarga de archivos adjuntos almacenados en SharePoint/OneDrive.
- Lectura del historial de mensajes (más allá del evento webhook en vivo).

### Teams RSC más permisos de aplicación de Microsoft Graph

Añade:

- Descarga de contenidos alojados (imágenes pegadas en mensajes).
- Descarga de archivos adjuntos almacenados en SharePoint/OneDrive.
- Lectura del historial de mensajes de canal/chat mediante Graph.

### RSC frente a Graph API

| Capacidad              | Permisos RSC         | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **Mensajes en tiempo real** | Sí (mediante webhook) | No (solo sondeo)                |
| **Mensajes históricos** | No                  | Sí (puede consultar historial)      |
| **Complejidad de configuración** | Solo manifiesto de app | Requiere consentimiento de administrador + flujo de tokens |
| **Funciona sin conexión** | No (debe estar en ejecución) | Sí (consulta en cualquier momento) |

**En resumen:** RSC sirve para escucha en tiempo real; Graph API sirve para acceso histórico. Para ponerte al día con mensajes perdidos mientras estabas sin conexión, necesitas Graph API con `ChannelMessage.Read.All` (requiere consentimiento de administrador).

## Multimedia + historial con Graph habilitado (obligatorio para canales)

Si necesitas imágenes/archivos en **canales** o quieres recuperar **historial de mensajes**, debes habilitar permisos de Microsoft Graph y conceder consentimiento de administrador.

1. En el **registro de la app** de Entra ID (Azure AD), añade permisos de **Application** de Microsoft Graph:
   - `ChannelMessage.Read.All` (archivos adjuntos de canal + historial)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chats grupales)
2. **Concede consentimiento de administrador** para el inquilino.
3. Incrementa la **versión del manifiesto** de la app de Teams, vuelve a subirlo y **reinstala la app en Teams**.
4. **Cierra completamente y vuelve a abrir Teams** para limpiar los metadatos de app almacenados en caché.

**Permiso adicional para menciones de usuario:** las @menciones a usuarios funcionan de forma predeterminada para usuarios de la conversación. Sin embargo, si quieres buscar dinámicamente y mencionar usuarios que **no están en la conversación actual**, añade el permiso `User.Read.All` (Application) y concede consentimiento de administrador.

## Limitaciones conocidas

### Tiempos de espera del webhook

Teams entrega mensajes mediante webhook HTTP. Si el procesamiento tarda demasiado (por ejemplo, respuestas lentas del LLM), puedes ver:

- Tiempos de espera del Gateway
- Reintentos del mensaje por parte de Teams (lo que provoca duplicados)
- Respuestas descartadas

OpenClaw lo gestiona devolviendo la respuesta rápidamente y enviando respuestas de forma proactiva, pero las respuestas muy lentas pueden seguir causando problemas.

### Formato

El Markdown de Teams es más limitado que el de Slack o Discord:

- El formato básico funciona: **negrita**, _cursiva_, `code`, enlaces
- El Markdown complejo (tablas, listas anidadas) puede no renderizarse correctamente
- Se admiten Adaptive Cards para encuestas y envíos de presentación semántica (consulta más abajo)

## Configuración

Ajustes agrupados (consulta `/gateway/configuration` para patrones compartidos de canales).

<AccordionGroup>
  <Accordion title="Núcleo y webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: credenciales del bot
    - `channels.msteams.webhook.port` (predeterminado `3978`)
    - `channels.msteams.webhook.path` (predeterminado `/api/messages`)
  </Accordion>

  <Accordion title="Autenticación">
    - `authType`: `"secret"` (predeterminado) o `"federated"`
    - `certificatePath`, `certificateThumbprint`: autenticación federada + certificado (thumbprint opcional)
    - `useManagedIdentity`, `managedIdentityClientId`: autenticación federada + identidad administrada
  </Accordion>

  <Accordion title="Control de acceso">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing)
    - `allowFrom`: lista de permitidos de DM; prefiere ID de objeto AAD; el asistente resuelve nombres cuando hay acceso a Graph disponible
    - `dangerouslyAllowNameMatching`: opción de emergencia para UPN/nombre para mostrar mutables y enrutamiento por nombre de equipo/canal
    - `requireMention`: exige @mención en canales/grupos (predeterminado `true`)
  </Accordion>

  <Accordion title="Sobrescrituras de equipo y canal">
    Todos estos sobrescriben los valores predeterminados de nivel superior:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: valores predeterminados de política de herramientas por equipo
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    Las claves de `toolsBySender` aceptan prefijos `id:`, `e164:`, `username:`, `name:` (las claves sin prefijo se asignan a `id:`). `"*"` es un comodín.

  </Accordion>

  <Accordion title="Entrega, multimedia y acciones">
    - `textChunkLimit`: tamaño de fragmento de texto saliente
    - `chunkMode`: `length` (predeterminado) o `newline` (divide en límites de párrafo antes de la longitud)
    - `mediaAllowHosts`: lista de permitidos de hosts de archivos adjuntos entrantes (predeterminada para dominios de Microsoft/Teams)
    - `mediaAuthAllowHosts`: hosts que pueden recibir cabeceras Authorization en reintentos (predeterminado para Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (consulta [Estilo de respuesta](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: activa/desactiva la acción de información de miembro respaldada por Graph (predeterminada activada cuando Graph está disponible)
    - `sharePointSiteId`: obligatorio para subidas de archivos en chats grupales/canales (consulta [Envío de archivos en chats grupales](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Enrutamiento y sesiones

- Las claves de sesión siguen el formato estándar de agente (consulta [/concepts/session](/es/concepts/session)):
  - Los mensajes directos comparten la sesión principal (`agent:<agentId>:<mainKey>`).
  - Los mensajes de canal/grupo usan el ID de conversación:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de respuesta: hilos frente a publicaciones

Teams introdujo recientemente dos estilos de interfaz de canal sobre el mismo modelo de datos subyacente:

| Estilo                  | Descripción                                               | `replyStyle` recomendado |
| ----------------------- | --------------------------------------------------------- | ------------------------ |
| **Posts** (clásico)     | Los mensajes aparecen como tarjetas con respuestas en hilo debajo | `thread` (predeterminado) |
| **Threads** (similar a Slack) | Los mensajes fluyen de forma lineal, más parecido a Slack | `top-level`              |

**El problema:** la API de Teams no expone qué estilo de interfaz usa un canal. Si usas el `replyStyle` incorrecto:

- `thread` en un canal de estilo Threads → las respuestas aparecen anidadas de forma incómoda
- `top-level` en un canal de estilo Posts → las respuestas aparecen como publicaciones separadas de nivel superior en lugar de dentro del hilo

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

## Archivos adjuntos e imágenes

**Limitaciones actuales:**

- **DM:** las imágenes y los archivos adjuntos funcionan mediante las API de archivos del bot de Teams.
- **Canales/grupos:** los archivos adjuntos viven en el almacenamiento de M365 (SharePoint/OneDrive). La carga útil del webhook solo incluye un fragmento HTML, no los bytes reales del archivo. **Se requieren permisos de Graph API** para descargar archivos adjuntos de canales.
- Para envíos explícitos centrados primero en archivos, usa `action=upload-file` con `media` / `filePath` / `path`; `message` opcional se convierte en el texto/comentario adjunto, y `filename` sobrescribe el nombre cargado.

Sin permisos de Graph, los mensajes de canal con imágenes se recibirán solo como texto (el contenido de la imagen no es accesible para el bot).
De forma predeterminada, OpenClaw solo descarga contenido multimedia desde nombres de host de Microsoft/Teams. Sobrescribe esto con `channels.msteams.mediaAllowHosts` (usa `["*"]` para permitir cualquier host).
Las cabeceras Authorization solo se adjuntan para los hosts de `channels.msteams.mediaAuthAllowHosts` (predeterminado: hosts de Graph + Bot Framework). Mantén esta lista estricta (evita sufijos multiinquilino).

## Envío de archivos en chats grupales

Los bots pueden enviar archivos en DM usando el flujo FileConsentCard (integrado). Sin embargo, **el envío de archivos en chats grupales/canales** requiere configuración adicional:

| Contexto                 | Cómo se envían los archivos               | Configuración necesaria                         |
| ------------------------ | ----------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → el usuario acepta → el bot carga | Funciona de inmediato                     |
| **Chats grupales/canales** | Subir a SharePoint → compartir enlace   | Requiere `sharePointSiteId` + permisos de Graph |
| **Imágenes (cualquier contexto)** | Inline codificado en Base64       | Funciona de inmediato                           |

### Por qué los chats grupales necesitan SharePoint

Los bots no tienen una unidad personal de OneDrive (el endpoint de Graph API `/me/drive` no funciona para identidades de aplicación). Para enviar archivos en chats grupales/canales, el bot los sube a un **sitio de SharePoint** y crea un enlace para compartir.

### Configuración

1. **Añade permisos de Graph API** en Entra ID (Azure AD) → Registro de aplicaciones:
   - `Sites.ReadWrite.All` (Application): subir archivos a SharePoint
   - `Chat.Read.All` (Application): opcional; habilita enlaces para compartir por usuario

2. **Concede consentimiento de administrador** para el inquilino.

3. **Obtén tu ID de sitio de SharePoint:**

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

### Comportamiento de uso compartido

| Permiso                                 | Comportamiento de uso compartido                        |
| --------------------------------------- | ------------------------------------------------------- |
| `Sites.ReadWrite.All` solo              | Enlace de uso compartido para toda la organización (cualquiera en la organización puede acceder) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Enlace de uso compartido por usuario (solo los miembros del chat pueden acceder) |

El uso compartido por usuario es más seguro, ya que solo los participantes del chat pueden acceder al archivo. Si falta el permiso `Chat.Read.All`, el bot recurre al uso compartido para toda la organización.

### Comportamiento de respaldo

| Escenario                                         | Resultado                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat grupal + archivo + `sharePointSiteId` configurado | Subir a SharePoint, enviar enlace para compartir |
| Chat grupal + archivo + sin `sharePointSiteId`    | Intentar carga a OneDrive (puede fallar), enviar solo texto |
| Chat personal + archivo                           | Flujo FileConsentCard (funciona sin SharePoint)   |
| Cualquier contexto + imagen                       | Inline codificado en Base64 (funciona sin SharePoint) |

### Ubicación donde se almacenan los archivos

Los archivos cargados se almacenan en una carpeta `/OpenClawShared/` en la biblioteca de documentos predeterminada del sitio de SharePoint configurado.

## Encuestas (Adaptive Cards)

OpenClaw envía encuestas de Teams como Adaptive Cards (no existe una API nativa de encuestas en Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Los votos se registran mediante el Gateway en `~/.openclaw/msteams-polls.json`.
- El Gateway debe permanecer en línea para registrar votos.
- Las encuestas aún no publican resúmenes de resultados automáticamente (inspecciona el archivo de almacenamiento si lo necesitas).

## Tarjetas de presentación

Envía cargas útiles de presentación semántica a usuarios o conversaciones de Teams usando la herramienta `message` o la CLI. OpenClaw las renderiza como Adaptive Cards de Teams a partir del contrato de presentación genérico.

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

Para detalles sobre el formato de destino, consulta [Formatos de destino](#target-formats) más abajo.

## Formatos de destino

Los destinos de MSTeams usan prefijos para distinguir entre usuarios y conversaciones:

| Tipo de destino         | Formato                         | Ejemplo                                             |
| ----------------------- | ------------------------------- | --------------------------------------------------- |
| Usuario (por ID)        | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuario (por nombre)    | `user:<display-name>`           | `user:John Smith` (requiere Graph API)              |
| Grupo/canal             | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Grupo/canal (sin prefijo) | `<conversation-id>`           | `19:abc123...@thread.tacv2` (si contiene `@thread`) |

**Ejemplos de CLI:**

```bash
# Enviar a un usuario por ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Enviar a un usuario por nombre para mostrar (activa búsqueda con Graph API)
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

Nota: sin el prefijo `user:`, los nombres se interpretan por defecto como resolución de grupo/equipo. Usa siempre `user:` cuando apuntes a personas por nombre para mostrar.

## Mensajería proactiva

- Los mensajes proactivos solo son posibles **después** de que un usuario haya interactuado, porque en ese momento almacenamos referencias de conversación.
- Consulta `/gateway/configuration` para `dmPolicy` y el control mediante listas de permitidos.

## ID de equipo y canal

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

- ID de equipo = segmento de ruta después de `/team/` (decodificado desde URL, por ejemplo, `19:Bk4j...@thread.tacv2`)
- ID de canal = segmento de ruta después de `/channel/` (decodificado desde URL)
- **Ignora** el parámetro de consulta `groupId`

## Canales privados

Los bots tienen compatibilidad limitada en canales privados:

| Función                       | Canales estándar | Canales privados      |
| ---------------------------- | ---------------- | --------------------- |
| Instalación del bot          | Sí               | Limitada              |
| Mensajes en tiempo real (webhook) | Sí         | Puede no funcionar    |
| Permisos RSC                | Sí               | Pueden comportarse de forma diferente |
| @menciones                  | Sí               | Si el bot es accesible |
| Historial con Graph API     | Sí               | Sí (con permisos)     |

**Soluciones alternativas si los canales privados no funcionan:**

1. Usa canales estándar para las interacciones con el bot
2. Usa DM: los usuarios siempre pueden enviar mensajes directos al bot
3. Usa Graph API para acceso histórico (requiere `ChannelMessage.Read.All`)

## Solución de problemas

### Problemas comunes

- **Las imágenes no se muestran en canales:** faltan permisos de Graph o el consentimiento de administrador. Reinstala la app de Teams y cierra/abre Teams por completo.
- **No hay respuestas en el canal:** las menciones son obligatorias de forma predeterminada; configura `channels.msteams.requireMention=false` o ajusta por equipo/canal.
- **Desajuste de versión (Teams sigue mostrando el manifiesto antiguo):** elimina y vuelve a añadir la app, y cierra Teams por completo para actualizar.
- **401 Unauthorized desde el webhook:** es lo esperado cuando se prueba manualmente sin JWT de Azure; significa que el endpoint es accesible, pero la autenticación falló. Usa Azure Web Chat para probar correctamente.

### Errores al subir el manifiesto

- **"Icon file cannot be empty":** el manifiesto hace referencia a archivos de icono de 0 bytes. Crea iconos PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** la app sigue instalada en otro equipo/chat. Encuéntrala y desinstálala primero, o espera entre 5 y 10 minutos para la propagación.
- **"Something went wrong" al subir:** súbelo mediante [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abre las DevTools del navegador (F12) → pestaña Network y revisa el cuerpo de la respuesta para ver el error real.
- **Fallo en la carga local:** prueba "Upload an app to your org's app catalog" en lugar de "Upload a custom app"; esto suele evitar restricciones de carga local.

### Los permisos RSC no funcionan

1. Verifica que `webApplicationInfo.id` coincida exactamente con el App ID de tu bot
2. Vuelve a subir la app y reinstálala en el equipo/chat
3. Comprueba si el administrador de tu organización ha bloqueado los permisos RSC
4. Confirma que estás usando el ámbito correcto: `ChannelMessage.Read.Group` para equipos, `ChatMessage.Read.Chat` para chats grupales

## Referencias

- [Crear Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guía de configuración de Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - crear/gestionar apps de Teams
- [Esquema del manifiesto de apps de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Recibir mensajes de canal con RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referencia de permisos RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Manejo de archivos del bot de Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requiere Graph)
- [Mensajería proactiva](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Relacionado

<CardGroup cols={2}>
  <Card title="Resumen de canales" icon="list" href="/es/channels">
    Todos los canales compatibles.
  </Card>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Autenticación por DM y flujo de Pairing.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento del chat de grupo y restricción por menciones.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enrutamiento de sesiones para mensajes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de acceso y refuerzo de seguridad.
  </Card>
</CardGroup>
