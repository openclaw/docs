---
read_when:
    - Desea añadir o eliminar cuentas de canales (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp y más)
    - Se desea comprobar el estado del canal o seguir los registros del canal en tiempo real
    - Necesita inspeccionar o volver a enviar un evento entrante fallido del canal
summary: Referencia de la CLI para `openclaw channels` (cuentas, estado, mensajes no entregados, capacidades, resolución, registros, inicio/cierre de sesión)
title: Canales
x-i18n:
    generated_at: "2026-07-19T01:52:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d276a1696aa9308867e5ec447788ffb3f2b8750c4d9744b2e68578b940558e8
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gestiona las cuentas de canales de chat y su estado de ejecución en el Gateway.

Documentación relacionada:

- Guías de canales: [Canales](/es/channels)
- Configuración del Gateway: [Configuración](/es/gateway/configuration)

## Comandos habituales

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
openclaw channels dead-letters list --channel telegram --account default
```

`channels list` muestra solo los canales de chat: de forma predeterminada, las cuentas configuradas, con etiquetas de estado `installed`, `configured` y `enabled` por cuenta (`--json` para la salida procesable por máquinas). Pase `--all` para mostrar también los canales incluidos que aún no tengan una cuenta configurada y los canales instalables del catálogo que todavía no estén en el disco. La autenticación de proveedores y el uso de modelos se gestionan en otros lugares: `openclaw models auth list` para los perfiles de autenticación de proveedores, y `openclaw status` o `openclaw models list` para el uso y la cuota.

## Estado, capacidades, resolución y registros

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (valor predeterminado: `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (requiere `--channel`), `--target <dest>` (requiere `--channel`), `--timeout <ms>` (valor predeterminado: `10000`, limitado a `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (valor predeterminado: `auto`), `--json`
- `channels logs`: `--channel <name|all>` (valor predeterminado: `all`), `--lines <n>` (valor predeterminado: `200`), `--json`

`channels status --probe` es la ruta en vivo: en un Gateway accesible ejecuta por cuenta
las comprobaciones `probeAccount` y, opcionalmente, `auditAccount`, por lo que la salida puede incluir el estado
del transporte junto con resultados de sondeo como `works`, `probe failed`, `audit ok` o `audit failed`.
Si no se puede acceder al Gateway, `channels status` recurre a resúmenes basados únicamente en la configuración
en lugar de mostrar la salida de sondeos en vivo.

## Cartas muertas de entrada

Los eventos de entrada que agotan su política de reintentos permanecen en la base de datos de estado compartida durante el período de retención existente para las entradas fallidas de la cola. Inspeccione una cuenta de canal con:

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

La vista de texto muestra los identificadores de los eventos, los motivos de los fallos, el número de intentos y el tiempo transcurrido desde los fallos. La salida JSON también incluye la carga útil retenida, los metadatos, el carril y las marcas de tiempo de los intentos para el diagnóstico.

Después de corregir el problema subyacente, vuelva a poner en cola un evento con su identificador original:

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

Ejecute estos comandos en el host del Gateway para que accedan a la misma base de datos de estado compartida que el entorno de ejecución del canal. El reenvío conserva la carga útil, los metadatos y el carril, pero restablece el contador de intentos y la antigüedad en la cola. Sustituye atómicamente el marcador de fallo del evento, por lo que, si se repite el comando mientras el evento está pendiente o reclamado, se rechaza la operación en lugar de crear un segundo envío. El canal en ejecución lo recoge durante su siguiente vaciado de entrada. Los eventos completados permanecen en estado terminal y no se pueden reenviar. Las filas fallidas creadas antes de que se añadiera la retención de cargas útiles pueden seguir apareciendo en la lista, pero su reenvío se rechaza porque la carga útil no está disponible.

`openclaw health` informa del número de cartas muertas y de la antigüedad del fallo más antiguo por cuenta de canal. `openclaw doctor` indica las cuentas afectadas y remite al comando de inspección.

No utilice `openclaw sessions`, `sessions.list` del Gateway ni la herramienta
`sessions_list` del agente como señal del estado del socket del canal. Estas superficies informan
de filas de conversaciones almacenadas, no del estado de ejecución del proveedor. Tras reiniciar un proveedor de Discord,
una cuenta conectada pero inactiva puede estar en buen estado aunque no aparezca ninguna fila de sesión de Discord
hasta el siguiente evento de conversación entrante o saliente.

## Añadir y eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` muestra las opciones específicas de cada canal (token, clave privada, token de aplicación, rutas de signal-cli, etc.).
</Tip>

`channels remove` solo funciona con plugins de canales instalados o configurados. Utilice primero `channels add` para los canales instalables del catálogo. Sin `--delete`, solicita confirmación para desactivar la cuenta y conserva su configuración; `--delete` elimina las entradas de configuración sin solicitar confirmación.
En el caso de plugins de canales respaldados por un entorno de ejecución, `channels remove` también solicita al Gateway en ejecución que detenga la cuenta seleccionada antes de actualizar la configuración, de modo que desactivar o eliminar una cuenta no deje activo el receptor anterior hasta el reinicio.

Opciones de adición no interactiva compartidas por todos los canales: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` y `--use-env` (autenticación respaldada por variables de entorno, solo para la cuenta predeterminada, cuando se admita). Las opciones específicas de cada canal incluyen:

| Canal       | Opciones                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Si es necesario instalar un plugin de canal durante un comando de adición controlado mediante opciones, OpenClaw utiliza la fuente de instalación predeterminada del canal sin abrir la solicitud interactiva de instalación del plugin.

Al ejecutar `openclaw channels add` sin opciones, el asistente interactivo puede solicitar:

- identificadores de cuenta para cada canal seleccionado
- nombres visibles opcionales para esas cuentas
- `Route these channel accounts to agents now?`

Si confirma la vinculación en ese momento, el asistente pregunta qué agente debe ser propietario de cada cuenta de canal configurada y escribe vinculaciones de enrutamiento específicas de cada cuenta.

También puede gestionar posteriormente las mismas reglas de enrutamiento con `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulte [agentes](/es/cli/agents)).

Al añadir una cuenta no predeterminada a un canal que todavía utiliza ajustes de nivel superior para una sola cuenta, OpenClaw traslada esos valores de nivel superior al mapa de cuentas del canal antes de escribir la nueva cuenta. El traslado reutiliza una cuenta con nombre existente cuando el canal tiene exactamente una, o cuando `defaultAccount` apunta a una; de lo contrario, los valores se almacenan en `channels.<channel>.accounts.default`.

El comportamiento de enrutamiento se mantiene coherente:

- Las vinculaciones existentes que solo especifican el canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea ni modifica automáticamente las vinculaciones en el modo no interactivo.
- La configuración interactiva puede añadir opcionalmente vinculaciones específicas de cada cuenta.

Si la configuración ya se encontraba en un estado mixto (con cuentas con nombre presentes y valores de nivel superior para una sola cuenta todavía definidos), ejecute `openclaw doctor --fix` para mover los valores específicos de la cuenta a la cuenta trasladada elegida para ese canal.

## Inicio y cierre de sesión (interactivos)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` admite `--account <id>` y `--verbose`; `channels logout` admite `--account <id>`.
- `channels login` y `logout` pueden inferir el canal cuando solo un canal configurado admite esa acción; si hay varios, pase `--channel`.
- `channels logout` prefiere la ruta del Gateway en vivo cuando este es accesible, de modo que el cierre de sesión detiene cualquier receptor activo antes de borrar el estado de autenticación del canal. Si no se puede acceder a un Gateway local, recurre a la limpieza de la autenticación local; con `gateway.mode: "remote"`, el error del Gateway hace que el comando falle.
- Después de un inicio de sesión correcto, la CLI solicita a un Gateway local accesible que inicie la cuenta; en el modo remoto, guarda la autenticación localmente e indica que el entorno de ejecución remoto no se ha reiniciado.
- Ejecute `channels login` desde un terminal en el host del Gateway. `exec` del agente bloquea este flujo interactivo de inicio de sesión; para iniciar sesión desde el chat, deben utilizarse las herramientas de inicio de sesión del agente nativas del canal, como `whatsapp_login`, cuando estén disponibles.

## Solución de problemas

- Ejecute `openclaw status --deep` para realizar un sondeo general.
- Utilice `openclaw doctor` para obtener correcciones guiadas.
- `openclaw channels status` recurre a resúmenes basados únicamente en la configuración cuando no se puede acceder al Gateway. Si las credenciales de un canal compatible están configuradas mediante SecretRef, pero no están disponibles en la ruta del comando actual, informa de que la cuenta está configurada e incluye notas sobre su estado degradado, en lugar de mostrarla como no configurada.

## Sondeo de capacidades

Obtenga indicaciones sobre las capacidades del proveedor (intenciones y ámbitos, cuando estén disponibles), además de la compatibilidad estática con funciones:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítalo para enumerar todos los canales (incluidos los proporcionados por plugins).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un identificador numérico de canal sin procesar y solo se aplica a Discord. Para los canales de voz de Discord, la comprobación de permisos señala la ausencia de `ViewChannel`, `Connect`, `Speak`, `SendMessages` y `ReadMessageHistory`.
- Los sondeos son específicos del proveedor: identidad del bot, intenciones y permisos opcionales del canal para Discord; ámbitos de bot y usuario para Slack; indicadores del bot y Webhook para Telegram; versión del demonio para Signal; token de aplicación y roles o ámbitos de Graph para Microsoft Teams (con anotaciones cuando se conocen). Los canales sin sondeos indican `Probe: unavailable`.

## Resolver nombres en identificadores

Resuelva nombres de canales y usuarios en identificadores mediante el directorio del proveedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notas:

- Utilice `--kind user|group|auto` para forzar el tipo de destino.
- La resolución da preferencia a las coincidencias activas cuando varias entradas tienen el mismo nombre.
- `channels resolve` es de solo lectura. Si una cuenta seleccionada está configurada mediante SecretRef, pero esa credencial no está disponible en la ruta del comando actual, el comando devuelve resultados degradados sin resolver con notas, en lugar de cancelar toda la ejecución.
- `channels resolve` no instala plugins de canales. Utilice `channels add --channel <name>` antes de resolver nombres para un canal instalable del catálogo.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Descripción general de los canales](/es/channels)
