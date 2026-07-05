---
read_when:
    - Quieres añadir o eliminar cuentas de canal (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp y más)
    - Quieres comprobar el estado del canal o seguir los registros del canal
summary: Referencia de CLI para `openclaw channels` (cuentas, estado, capacidades, resolución, registros, inicio/cierre de sesión)
title: Canales
x-i18n:
    generated_at: "2026-07-05T11:08:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gestiona las cuentas de canales de chat y su estado en tiempo de ejecución en el Gateway.

Documentación relacionada:

- Guías de canales: [Canales](/es/channels)
- Configuración del Gateway: [Configuración](/es/gateway/configuration)

## Comandos comunes

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` muestra solo canales de chat: cuentas configuradas de forma predeterminada, con etiquetas de estado `installed`, `configured` y `enabled` por cuenta (`--json` para salida legible por máquina). Pasa `--all` para mostrar también canales incluidos que aún no tienen una cuenta configurada y canales del catálogo instalables que aún no están en disco. La autenticación de proveedores y el uso de modelos viven en otro lugar: `openclaw models auth list` para perfiles de autenticación de proveedor, `openclaw status` u `openclaw models list` para uso/cuota.

## Estado / capacidades / resolución / registros

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (predeterminado `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (requiere `--channel`), `--target <dest>` (requiere `--channel`), `--timeout <ms>` (predeterminado `10000`, limitado a `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (predeterminado `auto`), `--json`
- `channels logs`: `--channel <name|all>` (predeterminado `all`), `--lines <n>` (predeterminado `200`), `--json`

`channels status --probe` es la ruta en vivo: en un Gateway alcanzable ejecuta comprobaciones
`probeAccount` por cuenta y comprobaciones opcionales `auditAccount`, por lo que la salida puede incluir el estado
del transporte más resultados de sondeo como `works`, `probe failed`, `audit ok` o `audit failed`.
Si no se puede alcanzar el Gateway, `channels status` recurre a resúmenes basados solo en la configuración
en lugar de la salida de sondeo en vivo.

No uses `openclaw sessions`, Gateway `sessions.list` ni la herramienta de agente
`sessions_list` como señal de estado de socket de canal. Esas superficies informan
filas de conversaciones almacenadas, no el estado en tiempo de ejecución del proveedor. Después de un reinicio del proveedor de Discord,
una cuenta conectada pero inactiva puede estar sana aunque no aparezca ninguna fila de sesión
de Discord hasta el siguiente evento de conversación entrante o saliente.

## Agregar / eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` muestra las marcas por canal (token, clave privada, token de aplicación, rutas de signal-cli, etc.).
</Tip>

`channels remove` solo opera sobre plugins de canal instalados/configurados. Usa primero `channels add` para canales instalables del catálogo. Sin `--delete`, pregunta si quieres deshabilitar la cuenta y conserva su configuración; `--delete` elimina las entradas de configuración sin pedir confirmación.
Para plugins de canal respaldados por runtime, `channels remove` también pide al Gateway en ejecución que detenga la cuenta seleccionada antes de actualizar la configuración, por lo que deshabilitar o eliminar una cuenta no deja activo el listener anterior hasta el reinicio.

Marcas de adición no interactiva compartidas entre canales: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` y `--use-env` (autenticación respaldada por entorno, solo cuenta predeterminada, donde sea compatible). Las marcas específicas de canal incluyen:

| Canal       | Marcas                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Si se debe instalar un Plugin de canal durante un comando de adición controlado por marcas, OpenClaw usa el origen de instalación predeterminado del canal sin abrir el aviso interactivo de instalación de plugins.

Cuando ejecutas `openclaw channels add` sin marcas, el asistente interactivo puede pedir:

- ids de cuenta por canal seleccionado
- nombres visibles opcionales para esas cuentas
- `Route these channel accounts to agents now?`

Si confirmas enlazar ahora, el asistente pregunta qué agente debe poseer cada cuenta de canal configurada y escribe enlaces de enrutamiento con ámbito de cuenta.

También puedes administrar las mismas reglas de enrutamiento más adelante con `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulta [agentes](/es/cli/agents)).

Cuando agregas una cuenta no predeterminada a un canal que todavía usa ajustes de nivel superior de cuenta única, OpenClaw promociona esos valores de nivel superior al mapa de cuentas del canal antes de escribir la nueva cuenta. La promoción reutiliza una cuenta nombrada existente cuando el canal tiene exactamente una, o cuando `defaultAccount` apunta a una; de lo contrario, los valores terminan en `channels.<channel>.accounts.default`.

El comportamiento de enrutamiento se mantiene coherente:

- Los enlaces existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea ni reescribe enlaces automáticamente en modo no interactivo.
- La configuración interactiva puede agregar opcionalmente enlaces con ámbito de cuenta.

Si tu configuración ya estaba en un estado mixto (cuentas nombradas presentes y valores de cuenta única de nivel superior aún establecidos), ejecuta `openclaw doctor --fix` para mover los valores con ámbito de cuenta a la cuenta promocionada elegida para ese canal.

## Inicio y cierre de sesión (interactivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` admite `--account <id>` y `--verbose`; `channels logout` admite `--account <id>`.
- `channels login` y `logout` pueden inferir el canal cuando solo un canal configurado admite esa acción; con varios, pasa `--channel`.
- `channels logout` prefiere la ruta del Gateway en vivo cuando es alcanzable, por lo que el cierre de sesión detiene cualquier listener activo antes de limpiar el estado de autenticación del canal. Si no se puede alcanzar un Gateway local, recurre a la limpieza de autenticación local; con `gateway.mode: "remote"` el error del gateway hace fallar el comando.
- Después de un inicio de sesión correcto, la CLI pide a un Gateway local alcanzable que inicie la cuenta; en modo remoto guarda la autenticación localmente y señala que el runtime remoto no se reinició.
- Ejecuta `channels login` desde una terminal en el host del gateway. `exec` del agente bloquea este flujo de inicio de sesión interactivo; las herramientas nativas de inicio de sesión del agente del canal, como `whatsapp_login`, deben usarse desde el chat cuando estén disponibles.

## Solución de problemas

- Ejecuta `openclaw status --deep` para un sondeo amplio.
- Usa `openclaw doctor` para correcciones guiadas.
- `openclaw channels status` recurre a resúmenes basados solo en la configuración cuando no se puede alcanzar el gateway. Si una credencial de canal compatible está configurada mediante SecretRef pero no está disponible en la ruta de comando actual, informa esa cuenta como configurada con notas degradadas en lugar de mostrarla como no configurada.

## Sondeo de capacidades

Obtén pistas de capacidades del proveedor (intenciones/ámbitos donde estén disponibles) más compatibilidad estática de funciones:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítelo para listar todos los canales (incluidos los canales proporcionados por plugins).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un id de canal numérico sin formato y solo se aplica a Discord. Para canales de voz de Discord, la comprobación de permisos marca como ausentes `ViewChannel`, `Connect`, `Speak`, `SendMessages` y `ReadMessageHistory`.
- Los sondeos son específicos del proveedor: identidad de bot de Discord + intenciones más permisos de canal opcionales; bot de Slack + ámbitos de usuario; marcas de bot de Telegram + Webhook; versión del daemon de Signal; token de aplicación de Microsoft Teams + roles/ámbitos de Graph (anotados cuando se conocen). Los canales sin sondeos informan `Probe: unavailable`.

## Resolver nombres a IDs

Resuelve nombres de canales/usuarios a IDs usando el directorio del proveedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notas:

- Usa `--kind user|group|auto` para forzar el tipo de destino.
- La resolución prefiere coincidencias activas cuando varias entradas comparten el mismo nombre.
- `channels resolve` es de solo lectura. Si una cuenta seleccionada está configurada mediante SecretRef pero esa credencial no está disponible en la ruta de comando actual, el comando devuelve resultados degradados sin resolver con notas en lugar de abortar toda la ejecución.
- `channels resolve` no instala plugins de canal. Usa `channels add --channel <name>` antes de resolver nombres para un canal instalable del catálogo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Descripción general de canales](/es/channels)
