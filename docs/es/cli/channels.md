---
read_when:
    - Quieres agregar o eliminar cuentas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Quieres comprobar el estado de los canales o seguir sus registros tail
summary: Referencia de la CLI para `openclaw channels` (cuentas, estado, inicio/cierre de sesión, registros)
title: Canales
x-i18n:
    generated_at: "2026-04-24T05:22:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gestiona las cuentas de canales de chat y su estado de ejecución en el Gateway.

Documentación relacionada:

- Guías de canales: [Canales](/es/channels/index)
- Configuración del Gateway: [Configuración](/es/gateway/configuration)

## Comandos comunes

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Estado / capacidades / resolución / registros

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` es la ruta en vivo: en un Gateway accesible ejecuta comprobaciones por cuenta
de `probeAccount` y `auditAccount` opcionales, por lo que la salida puede incluir el estado del
transporte además de resultados de comprobación como `works`, `probe failed`, `audit ok` o `audit failed`.
Si el Gateway no es accesible, `channels status` recurre a resúmenes basados solo en la configuración
en lugar de salida de comprobación en vivo.

## Agregar / eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Consejo: `openclaw channels add --help` muestra flags por canal (token, clave privada, token de aplicación, rutas de signal-cli, etc.).

Las superficies comunes no interactivas para agregar incluyen:

- canales con token de bot: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte de Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos de Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos de Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos de Nostr: `--private-key`, `--relay-urls`
- campos de Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticación respaldada por variables de entorno de la cuenta predeterminada cuando sea compatible

Cuando ejecutas `openclaw channels add` sin flags, el asistente interactivo puede preguntar:

- ids de cuenta por canal seleccionado
- nombres visibles opcionales para esas cuentas
- `Bind configured channel accounts to agents now?`

Si confirmas vincular ahora, el asistente pregunta qué agente debe ser propietario de cada cuenta de canal configurada y escribe enlaces de enrutamiento con alcance por cuenta.

También puedes gestionar las mismas reglas de enrutamiento después con `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulta [agents](/es/cli/agents)).

Cuando agregas una cuenta no predeterminada a un canal que todavía usa configuración de nivel superior de cuenta única, OpenClaw promociona los valores de nivel superior con alcance por cuenta al mapa de cuentas del canal antes de escribir la nueva cuenta. La mayoría de los canales colocan esos valores en `channels.<channel>.accounts.default`, pero los canales incluidos pueden conservar en su lugar una cuenta promocionada existente que coincida. Matrix es el ejemplo actual: si ya existe una cuenta con nombre, o si `defaultAccount` apunta a una cuenta con nombre existente, la promoción conserva esa cuenta en lugar de crear una nueva `accounts.default`.

El comportamiento de enrutamiento se mantiene consistente:

- Los enlaces existentes solo por canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea ni reescribe enlaces automáticamente en modo no interactivo.
- La configuración interactiva puede agregar opcionalmente enlaces con alcance por cuenta.

Si tu configuración ya estaba en un estado mixto (cuentas con nombre presentes y valores de cuenta única de nivel superior todavía establecidos), ejecuta `openclaw doctor --fix` para mover los valores con alcance por cuenta a la cuenta promocionada elegida para ese canal. La mayoría de los canales promocionan a `accounts.default`; Matrix puede conservar un destino con nombre/predeterminado existente en su lugar.

## Inicio / cierre de sesión (interactivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Notas:

- `channels login` admite `--verbose`.
- `channels login` / `logout` pueden inferir el canal cuando solo hay un destino de inicio de sesión compatible configurado.

## Solución de problemas

- Ejecuta `openclaw status --deep` para una comprobación amplia.
- Usa `openclaw doctor` para correcciones guiadas.
- `openclaw channels list` imprime `Claude: HTTP 403 ... user:profile` → la instantánea de uso necesita el alcance `user:profile`. Usa `--no-usage`, o proporciona una clave de sesión de claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), o vuelve a autenticarte mediante Claude CLI.
- `openclaw channels status` recurre a resúmenes basados solo en la configuración cuando el Gateway no es accesible. Si una credencial de canal compatible está configurada mediante SecretRef pero no está disponible en la ruta del comando actual, informa esa cuenta como configurada con notas degradadas en lugar de mostrarla como no configurada.

## Comprobación de capacidades

Obtén sugerencias de capacidades del proveedor (intents/scopes cuando estén disponibles) además de compatibilidad estática de funciones:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítelo para listar todos los canales (incluidas las extensiones).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un id de canal numérico sin procesar y solo se aplica a Discord.
- Las comprobaciones son específicas del proveedor: intents de Discord + permisos de canal opcionales; scopes de bot + usuario de Slack; flags de bot + Webhook de Telegram; versión de daemon de Signal; token de aplicación + roles/scopes de Graph de Microsoft Teams (anotados cuando se conocen). Los canales sin comprobaciones informan `Probe: unavailable`.

## Resolver nombres a ids

Resuelve nombres de canal/usuario a ids usando el directorio del proveedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notas:

- Usa `--kind user|group|auto` para forzar el tipo de destino.
- La resolución prefiere coincidencias activas cuando varias entradas comparten el mismo nombre.
- `channels resolve` es de solo lectura. Si una cuenta seleccionada está configurada mediante SecretRef pero esa credencial no está disponible en la ruta del comando actual, el comando devuelve resultados degradados no resueltos con notas en lugar de abortar toda la ejecución.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de canales](/es/channels)
