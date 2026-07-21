---
read_when:
    - Conectar OpenClaw a un espacio de trabajo de ClickClack
    - Pruebas de identidades de bots de ClickClack
summary: Configuración del canal mediante token de bot de ClickClack y sintaxis del destino
title: ClickClack
x-i18n:
    generated_at: "2026-07-21T08:58:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 761538cdd7a916415719131b9ff2f40bf3e3e0eab0f7bda450250886acde8a64
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta OpenClaw con un espacio de trabajo ClickClack autoalojado mediante tokens de bot de ClickClack de primera clase.

Utilice esta opción cuando quiera que un agente de OpenClaw aparezca como usuario bot de ClickClack. ClickClack admite bots de servicio independientes y bots propiedad de usuarios; los bots propiedad de usuarios conservan un `owner_user_id` y reciben únicamente los ámbitos de token que se les conceden.

## Configuración rápida

En ClickClack, abra **Workspace settings → Integrations → OpenClaw**, cree un
bot mediante **Setup code (recommended)** y copie el comando generado:

```bash
openclaw channels add clickclack --code 'https://clickclack.example.com/#XXXX-XXXX-XXXX'
```

Para orígenes independientes de frontend y API, o para una API montada en una ruta, ClickClack emite en su lugar un
endpoint de reclamación exacto:

```bash
openclaw channels add clickclack --code 'https://api.example.com/services/clickclack/api/bot-setup-codes/claim#XXXX-XXXX-XXXX'
```

El código de configuración es de un solo uso y caduca después de 10 minutos. OpenClaw lo reclama,
recibe el token de bot recién generado y la configuración del espacio de trabajo, guarda la cuenta,
verifica la conexión e informa de si el Gateway en ejecución la ha detectado.
Para endpoints exactos con versión, OpenClaw valida y guarda la base canónica de la API
devuelta por ClickClack, incluido cualquier prefijo de ruta. El código de configuración
no se almacena en la configuración de OpenClaw.

Las reclamaciones mediante código de configuración usan HTTPS para servidores públicos. También se admite HTTP sin cifrar para
instalaciones locales en direcciones de bucle invertido como `localhost` y `127.0.0.1`.

Si OpenClaw ya está en ejecución, ClickClack se conecta automáticamente y no se necesita un segundo
comando. De lo contrario, inícielo con:

```bash
openclaw gateway
```

También puede proporcionar el código por separado de la URL del servidor:

```bash
openclaw channels add clickclack --code XXXX-XXXX-XXXX --base-url https://clickclack.example.com
```

Para una configuración guiada, ejecute:

```bash
openclaw onboard
```

Seleccione ClickClack y, cuando se le solicite, introduzca la URL del servidor, el token del bot y el espacio de trabajo.
La configuración guiada comprueba el servidor, el token y el espacio de trabajo después de guardar; una
comprobación fallida no descarta la configuración.

### Alternativa: token manual

Elija **Manual token** en ClickClack al configurar un cliente que no sea OpenClaw o
cuando necesite administrar explícitamente el token por su cuenta:

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` acepta un id de espacio de trabajo (`wsp_...`), un slug o un nombre para mostrar.
`--code` no puede combinarse con `--token`, `--token-file` ni `--use-env`.

### Alternativa: token basado en una variable de entorno

La cuenta predeterminada puede leer `CLICKCLACK_BOT_TOKEN` en lugar de almacenar un token
en la configuración:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

Las cuentas con nombre deben usar un token configurado o un archivo de token; la variable
de entorno compartida se limita intencionadamente a la cuenta predeterminada.

### Referencia de JSON5

La estructura de configuración equivalente es:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Una cuenta solo se considera configurada cuando `baseUrl`, un origen de token y
`workspace` están definidos. Un origen de token puede ser `token`, `tokenFile` o
`CLICKCLACK_BOT_TOKEN` para la cuenta predeterminada. `workspace` acepta un id de espacio de trabajo
(`wsp_...`), un slug o un nombre; el Gateway lo resuelve al id durante el inicio.

### Claves de configuración de la cuenta

| Clave                     | Valor predeterminado             | Notas                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | ninguno (obligatorio)     | URL pública de ClickClack utilizada para enlaces orientados al navegador.                                    |
| `apiBaseUrl`            | `baseUrl`           | Endpoint opcional de servidor a servidor para tráfico REST y WebSocket en tiempo real.             |
| `token`                 | ninguno                | Token del bot como cadena de texto sin formato o referencia de secreto (`source: "env" \| "file" \| "exec"`).        |
| `tokenFile`             | ninguno                | Ruta a un archivo de token del bot; tiene prioridad sobre `token`.                                |
| `workspace`             | ninguno (obligatorio)     | Id, slug o nombre del espacio de trabajo.                                                            |
| `replyMode`             | `"agent"`           | `"agent"` ejecuta el pipeline completo del agente; `"model"` envía finalizaciones directas y breves del modelo. |
| `defaultTo`             | `"channel:general"` | Destino utilizado cuando una ruta saliente no proporciona ninguno.                                      |
| `allowFrom`             | `["*"]`             | Lista de usuarios permitidos por id para mensajes directos y mensajes de canal entrantes.                                 |
| `botUserId`             | detectado automáticamente       | Se resuelve a partir de la identidad del token del bot durante el inicio.                                        |
| `agentId`               | valor predeterminado de la ruta       | Fija los mensajes entrantes de esta cuenta a un agente.                                       |
| `toolsAllow`            | ninguno                | Lista de herramientas permitidas para las respuestas del agente desde esta cuenta.                                     |
| `model`, `systemPrompt` | ninguno                | Utilizados por las finalizaciones de `replyMode: "model"`.                                               |
| `commandMenu`           | `true`              | Publica comandos nativos en el autocompletado del editor de ClickClack.                            |
| `reconnectMs`           | `1500`              | Retraso de reconexión en tiempo real (100 a 60000).                                                |
| `discussions`           | deshabilitado            | Configuración administrada del canal por sesión; consulte [Conversaciones de sesión](#session-discussions).  |

### Mantener un nombre de host público protegido por autenticación

Utilice `apiBaseUrl` cuando ClickClack y el Gateway de OpenClaw se ejecuten en el mismo host,
pero el nombre de host público de ClickClack esté protegido por un Gateway de autenticación
como Cloudflare Access:

```json5
{
  channels: {
    clickclack: {
      baseUrl: "https://clack.openclaw.ai",
      apiBaseUrl: "http://127.0.0.1:8484",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
    },
  },
}
```

El nombre de host público puede seguir estando completamente protegido por autenticación para los usuarios del navegador. OpenClaw
utiliza el endpoint de bucle invertido para las solicitudes REST, la verificación de la configuración y el
WebSocket en tiempo real, mientras que los enlaces `embedUrl` y `openUrl` de las conversaciones siguen
usando el `baseUrl` público. Si se omite `apiBaseUrl`, todo el tráfico usa
`baseUrl`, lo que conserva el comportamiento existente.

Si `plugins.allow` es una lista restrictiva no vacía, al seleccionar explícitamente
ClickClack en la configuración del canal o ejecutar `openclaw plugins enable clickclack`,
se añade `clickclack` a esa lista. La instalación durante la incorporación utiliza el mismo
comportamiento de selección explícita. Estas rutas no anulan `plugins.deny` ni una
configuración global `plugins.enabled: false`. El uso directo de
`openclaw plugins install @openclaw/clickclack` sigue la política normal
de instalación de plugins y también registra ClickClack en una lista de permitidos existente.

## Varios bots

Cada cuenta abre su propia conexión en tiempo real con ClickClack y utiliza su propio token de bot.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Conversaciones de sesión

Habilite las conversaciones en una cuenta de ClickClack para proporcionar a cada sesión de OpenClaw un
canal dedicado de ClickClack. El token de la cuenta debe incluir
`channels:write` (el paquete `bot:admin` lo incluye); el token de configuración normal `bot:write`
no puede crear ni sincronizar canales.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      discussions: {
        enabled: true,
        workspace: "default",
        controlUrlBase: "https://team.openclaw.ai",
        section: "Sessions",
      },
    },
  },
}
```

`discussions.workspace` acepta el mismo id, slug o nombre para mostrar del espacio de trabajo
que `workspace` en el nivel de la cuenta y su valor predeterminado es ese. `section` controla
la sección de la barra lateral de ClickClack y su valor predeterminado es `Sessions`. Cuando
se establece `controlUrlBase`, el canal administrado enlaza con la ruta de sesión real de la Control UI,
`/chat?session=<encoded-session-key>`.

Habilite las conversaciones exactamente en una cuenta de ClickClack. El proveedor del Gateway
no tiene selector de cuenta, por lo que se rechazan varias cuentas con conversaciones habilitadas
en lugar de elegir una según el orden de configuración.

Al abrir una conversación, se crea un canal público de ClickClack marcado como administrado
externamente. El plugin mantiene sincronizados la etiqueta de la sesión, la categoría y el estado de archivado.
Al restaurar una sesión, se restaura su canal; al borrar la categoría de la sesión,
el canal vuelve a la sección predeterminada configurada. Al eliminar una
sesión de OpenClaw, se archiva el canal de ClickClack en lugar de eliminarlo, de modo que su
historial siga disponible. El plugin concilia las vinculaciones cuando se utilizan los RPC de conversaciones
y aproximadamente una vez por minuto mientras exista alguna vinculación.

Los mensajes entrantes de un canal administrado utilizan una sesión secundaria determinista bajo
el mismo id de agente que la sesión principal asociada. Se indica al agente secundario qué
sesión principal debe observar y puede utilizar `sessions_history` y `session_status`
(`changesSince` resulta útil para las comprobaciones incrementales). Utiliza `sessions_send` únicamente
cuando las personas de la conversación le piden que retransmita o dirija la sesión principal.
La vinculación, la referencia de propiedad administrada y la identidad del par de la sesión secundaria incluyen
el id concreto de la sesión de OpenClaw junto con el servidor y el
canal de ClickClack fijados. Restablecer una clave de sesión reutilizable o redirigir una cuenta revoca
localmente el canal anterior, lo archiva cuando la credencial anterior sigue siendo válida y
no permite reutilizar su transcripción secundaria. Los mensajes que llegan mediante una
vinculación archivada, restablecida, deshabilitada o redirigida se descartan en lugar de recurrir
al enrutamiento normal de canales de la cuenta. Las vinculaciones liberadas dejan un marcador duradero
de canal revocado para que los eventos retrasados en tiempo real sigan cerrándose de forma segura. La
propiedad remota se identifica mediante el servidor de ClickClack y el id del canal, por lo que cambiar el nombre de la cuenta
local no puede convertir un canal administrado en uno ordinario.

Mantenga `tools.sessions.visibility` en su valor predeterminado más seguro, `tree`. El plugin
instala una concesión limitada al host únicamente entre cada sesión secundaria y su sesión
principal asociada, además de un enlace de política de herramientas que bloquea la detección de sesiones y los
destinos entre sesiones. Permite `sessions_history`, `session_status` y
`sessions_send` únicamente para la sesión principal asociada e impide que la llamada de estado
cambie el modelo de esa sesión. Esas herramientas deben seguir presentes en la
lista efectiva de herramientas permitidas del agente. El prompt del sistema sirve de orientación; la concesión del host
y el enlace constituyen el límite de autorización.

El servidor ClickClack debe admitir los campos de canal administrado (`external_managed`,
`external_ref`, `external_url` y `sidebar_section`) durante la creación y
actualización de canales, y devolverlos en las respuestas de canal. OpenClaw verifica ese contrato
antes de persistir una vinculación. Si se pierde una respuesta de creación, la siguiente apertura adopta
el canal mediante su `external_ref` aplicado por el servidor, en lugar de crear otro.
Hasta que se concilie ese resultado, la reserva pendiente pone en cuarentena
los eventos que, de otro modo, no estarían vinculados en el espacio de trabajo de destino. El conciliador general
adopta el canal cuando la misma sesión sigue activa o lo archiva después de un
restablecimiento; elimina la reserva cuando no se creó ningún canal remoto.
Esa referencia contiene un espacio de nombres duradero por instalación de OpenClaw, además de un
hash de la clave de sesión, el id concreto de la sesión, el destino de ClickClack y la generación
duradera de la vinculación. Los gateways independientes no pueden adoptar los canales de los demás,
las sesiones restablecidas no pueden heredar el historial de canales anterior y un recorrido de ida y vuelta
de una cuenta o un espacio de trabajo no puede volver a adoptar un canal anterior. Las vinculaciones también quedan fijadas a la
URL configurada del servidor ClickClack y se invalidan si la cuenta se
redirige. Cambiar o eliminar `controlUrlBase` actualiza o elimina el enlace del canal
administrado en la siguiente pasada de conciliación. Cambiar
`discussions.workspace` archiva y libera la vinculación anterior antes de que pueda
abrirse un canal en el nuevo espacio de trabajo cuando la credencial del espacio de trabajo anterior sigue
configurada. Si el token se sustituyó por una credencial limitada al espacio de trabajo que
no puede acceder al espacio de trabajo anterior, OpenClaw registra el canal anterior como revocado y
libera la vinculación sin probar el token de sustitución; archive ese canal
residual desde ClickClack.

La sesión principal adjunta también recibe una herramienta `discussion` de solo lectura. Esta lee
los mensajes más recientes y las respuestas recientes de los hilos como un registro escapado y con atribución
por mensaje, y no tiene efectos secundarios de escritura ni de ciclo de vida. Las consultas de raíces de canal y de hilos
tienen presupuestos de solicitudes fijos; el resultado advierte explícitamente cuando ese
límite de seguridad puede omitir un hilo activo más antiguo.

## Modos de respuesta

- `replyMode: "agent"` (predeterminado) procesa los mensajes entrantes mediante el pipeline normal del agente, incluido el registro de sesiones y la política de herramientas.
- `replyMode: "model"` omite el pipeline del agente y utiliza `llm.complete` del runtime del plugin para las respuestas directas del bot, que opcionalmente pueden ajustarse mediante `model` y `systemPrompt`. El proveedor y el modelo seleccionados controlan el presupuesto de finalización.

El modo de modelo ejecuta las finalizaciones con el id resuelto del agente del bot, lo que requiere
el bit de confianza explícito `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Mantenga desactivado el bit de confianza si solo utiliza el modo de respuesta predeterminado `agent`; en
ese caso no es necesario.

## Menú de comandos

Al iniciar el gateway, cada cuenta configurada publica los comandos nativos de
OpenClaw en ClickClack. Aparecen en el autocompletado del editor con la etiqueta del
identificador del bot. El conjunto publicado se sustituye por completo en cada inicio,
incluida la eliminación de un menú obsoleto cuando el catálogo de comandos nativos está vacío.

La sincronización del menú de comandos está activada de forma predeterminada. Establezca `commandMenu: false` en una cuenta
para desactivarla:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

El token necesita `commands:write`. Los paquetes actuales `bot:write` y
`bot:admin` de ClickClack incluyen ese ámbito, que también puede concederse
de forma individual. Es posible que los tokens creados antes de que se introdujeran los menús de comandos necesiten que se
añada el ámbito o que se sustituyan.

La sincronización se realiza con el mejor esfuerzo posible y se ejecuta una vez por cada inicio del gateway. La falta de un ámbito o un fallo de
red registra una advertencia; un servidor ClickClack antiguo sin el endpoint registra el caso
en el nivel de depuración. Ninguno de estos fallos bloquea el inicio en tiempo real. Los menús permanecen
disponibles mientras el agente está sin conexión y se eliminan cuando el bot abandona el
espacio de trabajo.

Esta versión solo publica especificaciones de comandos nativos. Los alias y los
catálogos de comandos de Skills, plugins o personalizados no se añaden al menú. Si un
nombre también está registrado como comando de barra HTTP, ClickClack procesa primero ese
registro; los demás comandos del menú continúan mediante la entrega normal de
mensajes.

Utilice el modo `agent` para obtener pruebas de correlación entre servicios. Para un
id de mensaje autoritativo de ClickClack con su formato canónico `msg_<ulid>`, el canal deriva
el id de ejecución determinista de OpenClaw `clickclack:<message-id>`. Cada llamada al modelo
es entonces visible en los diagnósticos como `clickclack:<message-id>:model:<n>`; cuando ese
turno utiliza ClawRouter, se envía el mismo id de llamada al modelo como `X-Request-ID`.
El modo `model` omite los diagnósticos normales de ejecución y sesión del agente y, por tanto,
no es adecuado para esta ruta de pruebas.

Cuando un evento en tiempo real contiene un `payload.correlation_id` validado, el
canal lo transmite como `X-Correlation-ID` en la obtención autoritativa del mensaje y
en las solicitudes de respuesta de ClickClack resultantes. Los valores utilizan el conjunto seguro
de 128 caracteres de ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` y `-`); los valores no válidos
se omiten. Estas correlaciones solo contienen identificadores, nunca cuerpos de mensajes,
prompts, finalizaciones, credenciales ni resultados de herramientas.

## Entrega duradera de contenido multimedia

Las respuestas del agente que contienen contenido multimedia utilizan obligatoriamente la entrega duradera. OpenClaw asigna
nonces estables por parte para los mensajes y las cargas antes de la primera escritura en ClickClack, de modo que
un reintento reutiliza la misma carga y el mismo mensaje en lugar de consumir cuota de almacenamiento
o publicar duplicados. Si una carga ya existe después de un reinicio,
OpenClaw no vuelve a leer la ruta local original ni la URL remota del contenido multimedia.

Este contrato de recuperación requiere un servidor ClickClack que admita:

- `GET /api/uploads/by-nonce` con
  `X-ClickClack-Upload-Nonce: supported` en resultados encontrados y no encontrados.
- `GET /api/messages/by-nonce` con
  `X-ClickClack-Message-Nonce: supported` en resultados encontrados y no encontrados.
- Creación idempotente de mensajes y asociación de archivos adjuntos para el mismo
  nonce y la misma carga limitados al propietario.

Un error 404 genérico de un servidor antiguo no se considera prueba de que un envío esté ausente.
OpenClaw deja la entrega sin resolver en lugar de arriesgarse a crear un duplicado; actualice
ClickClack antes de habilitar respuestas del agente que generen contenido multimedia.

## Filas de actividad del agente

De forma predeterminada, un canal de ClickClack no muestra nada mientras se ejecuta un turno del agente; solo se publica la respuesta final. Establezca `agentActivity: true` en una cuenta para publicar filas de mensaje duraderas `agent_commentary` y `agent_tool` mientras el turno está en curso:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Requisitos y comportamiento:

- **Desactivado de forma predeterminada.** Las configuraciones estándar y los servidores ClickClack antiguos no se ven afectados.
- **Requiere el ámbito de token `agent_activity:write`.** Este ámbito es independiente de `bot:write` y no se hereda de este; cree el token del bot con `--scopes bot:write,agent_activity:write` (o conceda el ámbito a un token existente) antes de habilitar la opción.
- **Degradación con el mejor esfuerzo posible.** Si el token no tiene `agent_activity:write` o el servidor rechaza las escrituras de actividad, los fallos se registran y la respuesta final sigue entregándose con normalidad; no aparece ninguna fila de actividad.
- Las filas se agrupan por turno (`turn_id`), se fusionan para que cada paso lógico corresponda a una fila y las filas de herramientas utilizan el mismo formato de progreso que Discord/Slack/Telegram (nombre de la herramienta más detalles del comando).
- **Metadatos de atribución.** Las publicaciones creadas por el agente (las filas de actividad y la respuesta final) incluyen los campos `author_model` y `author_thinking` resueltos a partir del modelo realmente utilizado para el turno (incluso después de aplicar un fallback). Los servidores que no definen estas columnas ignoran los campos JSON desconocidos; los servidores que los persisten pueden responder «qué modelo dijo esta línea y con qué nivel de razonamiento» para cada mensaje.

## Destinos

- `channel:<name-or-id>` envía a un canal del espacio de trabajo. Los destinos sin prefijo usan `channel:` de forma predeterminada.
- `dm:<user_id>` crea o reutiliza una conversación directa con ese usuario.
- `thread:<message_id>` responde en el hilo cuya raíz es ese mensaje.

Los destinos salientes explícitos también pueden incluir el prefijo de proveedor `clickclack:` o `cc:`.

El contenido multimedia saliente utiliza la API de carga de ClickClack y, a continuación, adjunta la carga duradera
al mensaje de canal, la respuesta de hilo o el mensaje directo creados. Los archivos locales y las URL remotas
de contenido multimedia compatibles siguen la política normal de acceso a contenido multimedia de OpenClaw, con un límite
de 64 MiB por archivo. Los envíos duraderos en cola utilizan nonces independientes y limitados al propietario para cada
carga y cada parte del mensaje; después, vuelven a intentar asociar los archivos adjuntos con esos mismos
objetos. Consulte [Entrega duradera de contenido multimedia](#durable-media-delivery) para conocer el contrato del servidor
y el comportamiento de recuperación.

Ejemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permisos

Los ámbitos de los tokens de ClickClack se aplican mediante la API de ClickClack.

- `bot:read`: lectura de datos de espacios de trabajo, canales, mensajes, hilos, mensajes directos, tiempo real y perfiles.
- `bot:write`: `bot:read` más mensajes de canal, respuestas de hilos, mensajes directos, cargas y publicación del menú de comandos.
- `bot:admin`: `bot:write` más creación de canales.
- `commands:write`: publicación del menú de comandos del bot. Se incluye en los paquetes actuales `bot:write` y `bot:admin`, y puede concederse de forma individual.
- `agent_activity:write`: filas duraderas de actividad del agente (`agent_commentary` / `agent_tool`). No se hereda de `bot:write` ni de `bot:admin`; solo es obligatorio cuando se establece `agentActivity: true`.

OpenClaw solo necesita el paquete actual `bot:write` para el chat normal del agente y la sincronización del menú de comandos. Añada `agent_activity:write` al habilitar las [filas de actividad del agente](#agent-activity-rows).

## Solución de problemas

- `ClickClack is not configured for account "<id>"`: establezca `baseUrl`, `token` (por ejemplo, mediante `CLICKCLACK_BOT_TOKEN`) y `workspace` para esa cuenta.
- `ClickClack workspace not found: <value>`: establezca `workspace` en el id, slug o nombre del espacio de trabajo devuelto por ClickClack.
- No hay respuestas entrantes: confirme que el token tiene acceso de lectura en tiempo real y tenga en cuenta que el bot ignora sus propios mensajes y los mensajes de otros bots.
- Los envíos al canal fallan: compruebe que el bot sea miembro del espacio de trabajo y tenga `bot:write`.
- No hay menú de comandos: confirme que `commandMenu` no sea `false`, que el servidor ClickClack admita `PUT /api/bots/self/commands` y que el token tenga `commands:write`.
