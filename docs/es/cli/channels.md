---
read_when:
    - Se desea añadir o eliminar cuentas de canales (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp y más)
    - Quieres comprobar el estado del canal o seguir los registros del canal en tiempo real.
    - Necesita inspeccionar o reenviar un evento entrante fallido de un canal
summary: Referencia de la CLI para `openclaw channels` (cuentas, estado, mensajes no entregados, capacidades, resolución, registros, inicio/cierre de sesión)
title: Canales
x-i18n:
    generated_at: "2026-07-21T22:38:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 858f1f65de9b26dba3be712789141bc42cd0908c3a9284e40c3273c6972a0c65
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gestiona las cuentas de los canales de chat y su estado de ejecución en el Gateway.

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

`channels list` muestra solo los canales de chat: de forma predeterminada, las cuentas configuradas, con las etiquetas de estado `installed`, `configured` y `enabled` por cuenta (`--json` para la salida procesable por máquinas). Indica `--all` para mostrar también los canales incluidos que aún no tienen ninguna cuenta configurada y los canales instalables del catálogo que todavía no están en el disco. La autenticación de proveedores y el uso de modelos se gestionan en otro lugar: `openclaw models auth list` para los perfiles de autenticación de proveedores, y `openclaw status` o `openclaw models list` para el uso y la cuota.

## Estado, capacidades, resolución y registros

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (valor predeterminado: `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (requiere `--channel`), `--target <dest>` (requiere `--channel`), `--timeout <ms>` (valor predeterminado: `10000`, con un límite de `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (valor predeterminado: `auto`), `--json`
- `channels logs`: `--channel <name|all>` (valor predeterminado: `all`), `--lines <n>` (valor predeterminado: `200`), `--json`

`channels status --probe` es la ruta en vivo: en un Gateway accesible, ejecuta por cuenta
las comprobaciones `probeAccount` y, opcionalmente, `auditAccount`, por lo que la salida puede incluir el estado
del transporte y resultados de sondeos como `works`, `probe failed`, `audit ok` o `audit failed`.
Si el Gateway no está accesible, `channels status` recurre a resúmenes basados únicamente en la configuración
en lugar de mostrar la salida de sondeos en vivo.

## Cartas muertas entrantes

Los eventos entrantes que agotan su política de reintentos permanecen en la base de datos de estado compartida durante el período de retención existente para las entradas fallidas de la cola. Inspecciona una cuenta de canal con:

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

La vista de texto muestra los identificadores de los eventos, los motivos de los fallos, el número de intentos y la antigüedad de los fallos. La salida JSON también incluye la carga útil conservada, los metadatos, la vía y las marcas de tiempo de los intentos para fines de diagnóstico.

Después de corregir el problema subyacente, vuelve a poner en cola un evento con su identificador original:

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

Ejecuta estos comandos en el host del Gateway para que accedan a la misma base de datos de estado compartida que el entorno de ejecución del canal. El reenvío conserva la carga útil, los metadatos y la vía, pero restablece el contador de intentos y la antigüedad en la cola. Sustituye de forma atómica el marcador de fallo de ese evento, por lo que, si se repite el comando mientras el evento está pendiente o reclamado, se rechaza la operación en lugar de crear un segundo envío. El canal en ejecución lo recoge en el siguiente vaciado de entrada. Los eventos completados permanecen en estado terminal y no se pueden reenviar. Las filas fallidas creadas antes de que se añadiera la conservación de la carga útil pueden seguir apareciendo en la lista, pero se rechaza su reenvío porque su carga útil no está disponible.

`openclaw health` informa del número de cartas muertas y de la antigüedad del fallo más antiguo por cuenta de canal. `openclaw doctor` identifica las cuentas afectadas y remite al comando de inspección.

No utilices `openclaw sessions`, `sessions.list` del Gateway ni la herramienta
`sessions_list` del agente como señal del estado del socket del canal. Esas superficies informan
sobre filas de conversaciones almacenadas, no sobre el estado del entorno de ejecución del proveedor. Después de reiniciar un proveedor de Discord,
una cuenta conectada pero inactiva puede estar en buen estado aunque no aparezca ninguna fila de sesión
de Discord hasta el siguiente evento de conversación entrante o saliente.

## Añadir o eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` muestra las opciones de cada canal (token, clave privada, token de la aplicación, rutas de signal-cli, etc.).
</Tip>

`channels remove` solo funciona con plugins de canal instalados o configurados. Utiliza primero `channels add` para los canales instalables del catálogo. Sin `--delete`, solicita confirmación para desactivar la cuenta y conserva su configuración; `--delete` elimina las entradas de configuración sin solicitar confirmación.
En el caso de los plugins de canal respaldados por el entorno de ejecución, `channels remove` también solicita al Gateway en ejecución que detenga la cuenta seleccionada antes de actualizar la configuración, de modo que desactivar o eliminar una cuenta no deje activo el proceso de escucha anterior hasta el reinicio.

Las opciones de adición no interactiva propiedad del núcleo son `--account <id>`, `--name <name>`, `--token`, `--token-file` y `--use-env` (autenticación respaldada por variables de entorno, solo para la cuenta predeterminada y cuando sea compatible). Los plugins de canal aportan sus propias opciones de configuración, incluidas `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--workspace`, `--http-url` y `--auth-dir`. Las opciones específicas de cada canal incluyen:

| Canal       | Opciones                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Si es necesario instalar un plugin de canal durante un comando de adición mediante opciones, OpenClaw utiliza la fuente de instalación predeterminada del canal sin abrir la solicitud interactiva de instalación del plugin.

Cuando se ejecuta `openclaw channels add` sin indicar directamente una cuenta, credenciales ni opciones de configuración del canal, el asistente interactivo puede solicitar esos datos. Tanto un identificador de canal posicional como `--channel <id>` preseleccionan ese canal sin omitir las indicaciones:

```bash
openclaw channels add telegram
openclaw channels add --channel telegram
```

El asistente puede solicitar:

- identificadores de cuenta para cada canal seleccionado
- nombres visibles opcionales para esas cuentas
- `Route these channel accounts to agents now?`

Si se confirma la vinculación en ese momento, el asistente pregunta qué agente debe ser propietario de cada cuenta de canal configurada y escribe vinculaciones de enrutamiento específicas de cada cuenta.

También se pueden gestionar posteriormente las mismas reglas de enrutamiento mediante `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulta [agentes](/es/cli/agents)).

Al añadir una cuenta no predeterminada a un canal que todavía utiliza ajustes de nivel superior para una sola cuenta, OpenClaw convierte esos valores de nivel superior en el mapa de cuentas del canal antes de escribir la cuenta nueva. La conversión reutiliza una cuenta con nombre existente cuando el canal tiene exactamente una, o cuando `defaultAccount` apunta a una; en caso contrario, los valores se guardan en `channels.<channel>.accounts.default`.

El comportamiento de enrutamiento se mantiene coherente:

- Las vinculaciones existentes exclusivas del canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea ni reescribe automáticamente las vinculaciones en el modo no interactivo.
- La configuración interactiva puede añadir opcionalmente vinculaciones específicas de cada cuenta.

Si la configuración ya se encontraba en un estado mixto (con cuentas con nombre y valores de nivel superior para una sola cuenta aún definidos), ejecuta `openclaw doctor --fix` para mover los valores específicos de la cuenta a la cuenta convertida elegida para ese canal.

## Inicio y cierre de sesión (interactivos)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` admite `--account <id>` y `--verbose`; `channels logout` admite `--account <id>`.
- `channels login` y `logout` pueden deducir el canal cuando solo un canal configurado admite esa acción; si hay varios, indica `--channel`.
- `channels logout` da preferencia a la ruta del Gateway en vivo cuando está accesible, de modo que el cierre de sesión detiene cualquier proceso de escucha activo antes de borrar el estado de autenticación del canal. Si no se puede acceder a un Gateway local, recurre a la limpieza local de la autenticación; con `gateway.mode: "remote"`, el error del Gateway hace que el comando falle.
- Después de iniciar sesión correctamente, la CLI solicita a un Gateway local accesible que inicie la cuenta; en modo remoto, guarda la autenticación localmente e indica que el entorno de ejecución remoto no se ha reiniciado.
- Ejecuta `channels login` desde un terminal en el host del Gateway. El `exec` del agente bloquea este flujo interactivo de inicio de sesión; cuando estén disponibles, deben utilizarse desde el chat las herramientas de inicio de sesión nativas del canal para agentes, como `whatsapp_login`.

## Solución de problemas

- Ejecuta `openclaw status --deep` para realizar un sondeo amplio.
- Utiliza `openclaw doctor` para aplicar correcciones guiadas.
- `openclaw channels status` recurre a resúmenes basados únicamente en la configuración cuando el Gateway no está accesible. Si las credenciales de un canal compatible están configuradas mediante SecretRef, pero no están disponibles en la ruta del comando actual, informa de que esa cuenta está configurada con notas de degradación en lugar de mostrarla como no configurada.

## Sondeo de capacidades

Obtén indicaciones sobre las capacidades del proveedor (intenciones y ámbitos cuando estén disponibles), además de la compatibilidad estática con funciones:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítelo para enumerar todos los canales (incluidos los proporcionados por plugins).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un identificador numérico de canal sin formato y solo se aplica a Discord. En los canales de voz de Discord, la comprobación de permisos señala si faltan `ViewChannel`, `Connect`, `Speak`, `SendMessages` y `ReadMessageHistory`.
- Los sondeos son específicos de cada proveedor: identidad e intenciones del bot de Discord, además de permisos de canal opcionales; ámbitos de bot y usuario de Slack; opciones del bot y Webhook de Telegram; versión del daemon de Signal; token de aplicación y roles o ámbitos de Graph de Microsoft Teams (con anotaciones cuando se conocen). Los canales sin sondeos informan de `Probe: unavailable`.

## Resolver nombres a identificadores

Resuelve los nombres de canales y usuarios en identificadores mediante el directorio del proveedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notas:

- Use `--kind user|group|auto` para forzar el tipo de destino.
- La resolución prefiere las coincidencias activas cuando varias entradas comparten el mismo nombre.
- `channels resolve` es de solo lectura. Si una cuenta seleccionada se configura mediante SecretRef, pero esa credencial no está disponible en la ruta de comandos actual, el comando devuelve resultados degradados sin resolver con notas en lugar de abortar toda la ejecución.
- `channels resolve` no instala plugins de canales. Use `channels add --channel <name>` antes de resolver nombres para un canal de catálogo instalable.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Descripción general de los canales](/es/channels)
