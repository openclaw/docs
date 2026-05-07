---
read_when:
    - Quieres añadir o quitar cuentas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Quiere comprobar el estado del canal o seguir los registros del canal
summary: Referencia de la CLI para `openclaw channels` (cuentas, estado, inicio/cierre de sesión, registros)
title: Canales
x-i18n:
    generated_at: "2026-05-07T13:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gestiona las cuentas de canales de chat y su estado de ejecución en el Gateway.

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
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` muestra solo canales de chat: cuentas configuradas de forma predeterminada, con etiquetas de estado `installed`, `configured` y `enabled` por cuenta. Pasa `--all` para mostrar también los canales incluidos que aún no tienen una cuenta configurada y los canales del catálogo instalables que todavía no están en disco. Los proveedores de autenticación (OAuth + claves de API) y las instantáneas de uso/cuota de proveedores de modelos ya no se imprimen aquí; usa `openclaw models auth list` para los perfiles de autenticación de proveedores y `openclaw status` u `openclaw models list` para el uso.

## Estado / capacidades / resolución / registros

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` es la ruta en vivo: en un gateway alcanzable ejecuta comprobaciones `probeAccount` y, opcionalmente, `auditAccount` por cuenta, por lo que la salida puede incluir el estado del transporte más resultados de sondeo como `works`, `probe failed`, `audit ok` o `audit failed`.
Si el gateway no es alcanzable, `channels status` recurre a resúmenes solo de configuración en lugar de salida de sondeo en vivo.

No uses `openclaw sessions`, Gateway `sessions.list` ni la herramienta `sessions_list` del agente como señal de estado del socket del canal. Esas superficies informan filas de conversaciones almacenadas, no el estado de ejecución del proveedor. Después de reiniciar un proveedor de Discord, una cuenta conectada pero sin actividad puede estar sana aunque no aparezca ninguna fila de sesión de Discord hasta el siguiente evento de conversación entrante o saliente.

## Agregar / eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` muestra flags por canal (token, clave privada, token de app, rutas de signal-cli, etc.).
</Tip>

`channels remove` solo opera sobre plugins de canal instalados/configurados. Usa primero `channels add` para canales instalables del catálogo.
Para plugins de canal respaldados por ejecución, `channels remove` también solicita al Gateway en ejecución que detenga la cuenta seleccionada antes de actualizar la configuración, de modo que deshabilitar o eliminar una cuenta no deje activo el listener anterior hasta el reinicio.

Las superficies comunes de agregado no interactivo incluyen:

- canales con bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte de Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos de Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos de Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos de Nostr: `--private-key`, `--relay-urls`
- campos de Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticación respaldada por variables de entorno de la cuenta predeterminada cuando esté admitido

Si un plugin de canal debe instalarse durante un comando de agregado controlado por flags, OpenClaw usa el origen de instalación predeterminado del canal sin abrir el prompt interactivo de instalación de plugins.

Cuando ejecutas `openclaw channels add` sin flags, el asistente interactivo puede solicitar:

- ids de cuenta por canal seleccionado
- nombres visibles opcionales para esas cuentas
- `Bind configured channel accounts to agents now?`

Si confirmas vincular ahora, el asistente pregunta qué agente debe poseer cada cuenta de canal configurada y escribe vinculaciones de enrutamiento con alcance de cuenta.

También puedes gestionar las mismas reglas de enrutamiento más tarde con `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulta [agentes](/es/cli/agents)).

Cuando agregas una cuenta no predeterminada a un canal que todavía usa ajustes de nivel superior de cuenta única, OpenClaw promueve los valores de nivel superior con alcance de cuenta al mapa de cuentas del canal antes de escribir la cuenta nueva. La mayoría de los canales colocan esos valores en `channels.<channel>.accounts.default`, pero los canales incluidos pueden conservar en su lugar una cuenta promovida coincidente existente. Matrix es el ejemplo actual: si ya existe una cuenta con nombre, o `defaultAccount` apunta a una cuenta con nombre existente, la promoción conserva esa cuenta en lugar de crear una nueva `accounts.default`.

El comportamiento de enrutamiento permanece consistente:

- Las vinculaciones existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea ni reescribe automáticamente vinculaciones en modo no interactivo.
- La configuración interactiva puede agregar opcionalmente vinculaciones con alcance de cuenta.

Si tu configuración ya estaba en un estado mixto (cuentas con nombre presentes y valores de cuenta única de nivel superior todavía definidos), ejecuta `openclaw doctor --fix` para mover los valores con alcance de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales promueven a `accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado existente.

## Inicio y cierre de sesión (interactivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` admite `--verbose`.
- `channels login` y `logout` pueden inferir el canal cuando solo hay configurado un destino de inicio de sesión admitido.
- `channels logout` prefiere la ruta del Gateway en vivo cuando es alcanzable, por lo que el cierre de sesión detiene cualquier listener activo antes de borrar el estado de autenticación del canal. Si no se puede alcanzar un Gateway local, recurre a la limpieza local de autenticación.
- Ejecuta `channels login` desde una terminal en el host del gateway. `exec` del agente bloquea este flujo de inicio de sesión interactivo; las herramientas nativas de inicio de sesión de canal para agentes, como `whatsapp_login`, deben usarse desde el chat cuando estén disponibles.

## Solución de problemas

- Ejecuta `openclaw status --deep` para un sondeo amplio.
- Usa `openclaw doctor` para correcciones guiadas.
- `openclaw channels list` ya no imprime instantáneas de uso/cuota de proveedores de modelos. Para eso, usa `openclaw status` (vista general) u `openclaw models list` (por proveedor).
- `openclaw channels status` recurre a resúmenes solo de configuración cuando el gateway no es alcanzable. Si una credencial de canal admitida está configurada mediante SecretRef pero no está disponible en la ruta de comando actual, informa esa cuenta como configurada con notas de degradación en lugar de mostrarla como no configurada.

## Sondeo de capacidades

Obtén pistas de capacidades del proveedor (intents/scopes donde estén disponibles) más compatibilidad de funcionalidades estáticas:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítelo para listar todos los canales (incluidas las extensions).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un id de canal numérico sin procesar y solo se aplica a Discord. Para canales de voz de Discord, la comprobación de permisos marca la falta de `ViewChannel`, `Connect`, `Speak`, `SendMessages` y `ReadMessageHistory`.
- Los sondeos son específicos del proveedor: intents de Discord + permisos de canal opcionales; scopes de bot + usuario de Slack; flags de bot + webhook de Telegram; versión del demonio de Signal; token de app + roles/scopes de Graph de Microsoft Teams (anotados cuando se conocen). Los canales sin sondeos informan `Probe: unavailable`.

## Resolver nombres a IDs

Resuelve nombres de canales/usuarios a IDs mediante el directorio del proveedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notas:

- Usa `--kind user|group|auto` para forzar el tipo de destino.
- La resolución prefiere coincidencias activas cuando varias entradas comparten el mismo nombre.
- `channels resolve` es de solo lectura. Si una cuenta seleccionada está configurada mediante SecretRef pero esa credencial no está disponible en la ruta de comando actual, el comando devuelve resultados no resueltos degradados con notas en lugar de abortar toda la ejecución.
- `channels resolve` no instala plugins de canal. Usa `channels add --channel <name>` antes de resolver nombres para un canal instalable del catálogo.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Vista general de canales](/es/channels)
