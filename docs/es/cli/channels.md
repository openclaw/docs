---
read_when:
    - Quieres añadir o eliminar cuentas de canales (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp y más)
    - Quieres comprobar el estado del canal o seguir en tiempo real los registros del canal
summary: Referencia de la CLI para `openclaw channels` (cuentas, estado, capacidades, resolución, registros, inicio/cierre de sesión)
title: Canales
x-i18n:
    generated_at: "2026-07-11T22:58:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
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
```

`channels list` muestra únicamente los canales de chat: de forma predeterminada, las cuentas configuradas, con etiquetas de estado `installed`, `configured` y `enabled` para cada cuenta (`--json` para obtener una salida procesable por máquinas). Usa `--all` para mostrar también los canales incluidos que todavía no tienen ninguna cuenta configurada y los canales instalables del catálogo que aún no están en el disco. La autenticación de proveedores y el uso de modelos se gestionan en otros lugares: `openclaw models auth list` para los perfiles de autenticación de proveedores y `openclaw status` u `openclaw models list` para el uso y la cuota.

## Estado, capacidades, resolución y registros

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (valor predeterminado: `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (requiere `--channel`), `--target <dest>` (requiere `--channel`), `--timeout <ms>` (valor predeterminado: `10000`, con un máximo de `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (valor predeterminado: `auto`), `--json`
- `channels logs`: `--channel <name|all>` (valor predeterminado: `all`), `--lines <n>` (valor predeterminado: `200`), `--json`

`channels status --probe` es la ruta de comprobación en vivo: en un Gateway accesible, ejecuta las comprobaciones `probeAccount` y, opcionalmente, `auditAccount` para cada cuenta, por lo que la salida puede incluir el estado del transporte y resultados de comprobación como `works`, `probe failed`, `audit ok` o `audit failed`.
Si no se puede acceder al Gateway, `channels status` utiliza resúmenes basados únicamente en la configuración en lugar de mostrar los resultados de la comprobación en vivo.

No uses `openclaw sessions`, `sessions.list` del Gateway ni la herramienta `sessions_list` del agente como indicador del estado de los sockets de los canales. Estas superficies muestran filas de conversaciones almacenadas, no el estado de ejecución del proveedor. Tras reiniciar un proveedor de Discord, una cuenta conectada pero inactiva puede estar en buen estado aunque no aparezca ninguna fila de sesión de Discord hasta el siguiente evento de conversación entrante o saliente.

## Añadir y eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` muestra las opciones específicas de cada canal (token, clave privada, token de aplicación, rutas de signal-cli, etc.).
</Tip>

`channels remove` solo funciona con plugins de canales instalados o configurados. Usa primero `channels add` para los canales instalables del catálogo. Sin `--delete`, solicita deshabilitar la cuenta y conserva su configuración; `--delete` elimina las entradas de configuración sin pedir confirmación.
En los plugins de canales respaldados por un entorno de ejecución, `channels remove` también solicita al Gateway en ejecución que detenga la cuenta seleccionada antes de actualizar la configuración, de modo que deshabilitar o eliminar una cuenta no deje activo el proceso de escucha anterior hasta el reinicio.

Opciones no interactivas compartidas entre canales para añadir cuentas: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` y `--use-env` (autenticación respaldada por variables de entorno, solo para la cuenta predeterminada, cuando sea compatible). Las opciones específicas de cada canal incluyen:

| Canal       | Opciones                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Si es necesario instalar un plugin de canal durante un comando para añadir una cuenta mediante opciones, OpenClaw utiliza la fuente de instalación predeterminada del canal sin abrir la solicitud interactiva de instalación del plugin.

Cuando ejecutas `openclaw channels add` sin opciones, el asistente interactivo puede solicitar:

- identificadores de cuenta para cada canal seleccionado
- nombres de visualización opcionales para esas cuentas
- `¿Quieres enrutar ahora estas cuentas de canales a agentes?`

Si confirmas la vinculación inmediata, el asistente pregunta qué agente debe ser propietario de cada cuenta de canal configurada y escribe vinculaciones de enrutamiento específicas de cada cuenta.

También puedes gestionar posteriormente las mismas reglas de enrutamiento con `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulta [agentes](/es/cli/agents)).

Cuando añades una cuenta no predeterminada a un canal que todavía utiliza ajustes de nivel superior para una sola cuenta, OpenClaw traslada esos valores de nivel superior al mapa de cuentas del canal antes de escribir la cuenta nueva. El traslado reutiliza una cuenta existente con nombre cuando el canal tiene exactamente una o cuando `defaultAccount` apunta a una; de lo contrario, los valores se guardan en `channels.<channel>.accounts.default`.

El comportamiento del enrutamiento se mantiene coherente:

- Las vinculaciones existentes que solo especifican el canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea ni reescribe automáticamente vinculaciones en el modo no interactivo.
- La configuración interactiva puede añadir opcionalmente vinculaciones específicas de cada cuenta.

Si tu configuración ya se encontraba en un estado mixto (con cuentas con nombre y valores de nivel superior para una sola cuenta todavía establecidos), ejecuta `openclaw doctor --fix` para trasladar los valores específicos de la cuenta a la cuenta promovida que se haya elegido para ese canal.

## Inicio y cierre de sesión (interactivos)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` admite `--account <id>` y `--verbose`; `channels logout` admite `--account <id>`.
- `channels login` y `logout` pueden deducir el canal cuando solo hay un canal configurado que admite esa acción; si hay varios, especifica `--channel`.
- `channels logout` utiliza preferentemente la ruta del Gateway en vivo cuando está accesible, de modo que el cierre de sesión detiene cualquier proceso de escucha activo antes de borrar el estado de autenticación del canal. Si no se puede acceder a un Gateway local, recurre a la limpieza local de la autenticación; con `gateway.mode: "remote"`, el error del Gateway hace que el comando falle.
- Tras iniciar sesión correctamente, la CLI solicita a un Gateway local accesible que inicie la cuenta; en modo remoto, guarda la autenticación localmente e indica que el entorno de ejecución remoto no se ha reiniciado.
- Ejecuta `channels login` desde un terminal en el host del Gateway. La herramienta `exec` del agente bloquea este flujo interactivo de inicio de sesión; cuando estén disponibles, deben usarse desde el chat las herramientas de inicio de sesión del agente nativas del canal, como `whatsapp_login`.

## Solución de problemas

- Ejecuta `openclaw status --deep` para realizar una comprobación amplia.
- Usa `openclaw doctor` para obtener correcciones guiadas.
- `openclaw channels status` utiliza resúmenes basados únicamente en la configuración cuando no se puede acceder al Gateway. Si las credenciales de un canal compatible se configuran mediante SecretRef, pero no están disponibles en la ruta actual del comando, muestra la cuenta como configurada con notas de funcionamiento degradado en lugar de indicarla como no configurada.

## Comprobación de capacidades

Obtén indicaciones sobre las capacidades del proveedor (intenciones y ámbitos cuando estén disponibles), además de la compatibilidad estática con funciones:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítelo para mostrar todos los canales (incluidos los proporcionados por plugins).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un identificador numérico de canal sin formato y solo se aplica a Discord. Para los canales de voz de Discord, la comprobación de permisos marca la ausencia de `ViewChannel`, `Connect`, `Speak`, `SendMessages` y `ReadMessageHistory`.
- Las comprobaciones son específicas de cada proveedor: identidad del bot e intenciones de Discord, además de permisos de canal opcionales; ámbitos de bot y usuario de Slack; opciones del bot y Webhook de Telegram; versión del daemon de Signal; token de aplicación y roles o ámbitos de Graph de Microsoft Teams (con anotaciones cuando se conocen). Los canales sin comprobaciones muestran `Comprobación: no disponible`.

## Resolver nombres en identificadores

Resuelve nombres de canales o usuarios en identificadores mediante el directorio del proveedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notas:

- Usa `--kind user|group|auto` para forzar el tipo de destino.
- Cuando varias entradas comparten el mismo nombre, la resolución da preferencia a las coincidencias activas.
- `channels resolve` es de solo lectura. Si una cuenta seleccionada está configurada mediante SecretRef, pero esas credenciales no están disponibles en la ruta actual del comando, el comando devuelve resultados sin resolver y en estado degradado con notas, en lugar de cancelar toda la ejecución.
- `channels resolve` no instala plugins de canales. Usa `channels add --channel <name>` antes de resolver nombres para un canal instalable del catálogo.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Descripción general de los canales](/es/channels)
