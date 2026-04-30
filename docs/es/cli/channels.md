---
read_when:
    - Desea agregar/eliminar cuentas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Quieres comprobar el estado del canal o seguir los registros del canal
summary: Referencia de CLI para `openclaw channels` (cuentas, estado, inicio/cierre de sesión, registros)
title: Canales
x-i18n:
    generated_at: "2026-04-30T05:32:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Administra cuentas de canales de chat y su estado de ejecución en el Gateway.

Documentos relacionados:

- Guías de canales: [Canales](/es/channels)
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

`channels status --probe` es la ruta en vivo: en un Gateway accesible, ejecuta comprobaciones `probeAccount` por cuenta y comprobaciones opcionales `auditAccount`, por lo que la salida puede incluir el estado del transporte más resultados de sondeo como `works`, `probe failed`, `audit ok` o `audit failed`. Si el Gateway no está accesible, `channels status` recurre a resúmenes basados solo en la configuración en lugar de la salida del sondeo en vivo.

## Agregar / eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` muestra las opciones por canal (token, clave privada, token de aplicación, rutas de signal-cli, etc.).
</Tip>

Las superficies comunes de agregado no interactivo incluyen:

- canales con bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Campos de transporte de Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Campos de Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Campos de Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Campos de Nostr: `--private-key`, `--relay-urls`
- Campos de Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para la autenticación respaldada por variables de entorno de la cuenta predeterminada, donde sea compatible

Si es necesario instalar un plugin de canal durante un comando de agregado controlado por opciones, OpenClaw usa la fuente de instalación predeterminada del canal sin abrir el aviso interactivo de instalación de plugins.

Cuando ejecutas `openclaw channels add` sin opciones, el asistente interactivo puede solicitar:

- ids de cuenta por canal seleccionado
- nombres para mostrar opcionales para esas cuentas
- `Bind configured channel accounts to agents now?`

Si confirmas enlazar ahora, el asistente pregunta qué agente debe poseer cada cuenta de canal configurada y escribe enlaces de enrutamiento con alcance de cuenta.

También puedes administrar las mismas reglas de enrutamiento más tarde con `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulta [agentes](/es/cli/agents)).

Cuando agregas una cuenta no predeterminada a un canal que todavía usa ajustes de nivel superior de una sola cuenta, OpenClaw promueve los valores de nivel superior con alcance de cuenta al mapa de cuentas del canal antes de escribir la cuenta nueva. La mayoría de los canales colocan esos valores en `channels.<channel>.accounts.default`, pero los canales incluidos pueden conservar una cuenta promovida existente que coincida. Matrix es el ejemplo actual: si ya existe una cuenta con nombre, o `defaultAccount` apunta a una cuenta con nombre existente, la promoción conserva esa cuenta en lugar de crear una nueva `accounts.default`.

El comportamiento de enrutamiento se mantiene coherente:

- Los enlaces existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea ni reescribe enlaces automáticamente en modo no interactivo.
- La configuración interactiva puede agregar enlaces con alcance de cuenta de forma opcional.

Si tu configuración ya estaba en un estado mixto (cuentas con nombre presentes y valores de nivel superior de una sola cuenta aún definidos), ejecuta `openclaw doctor --fix` para mover los valores con alcance de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales promueven a `accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado existente.

## Inicio y cierre de sesión (interactivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` admite `--verbose`.
- `channels login` y `logout` pueden inferir el canal cuando solo hay configurado un destino de inicio de sesión compatible.
- Ejecuta `channels login` desde una terminal en el host del Gateway. `exec` del agente bloquea este flujo de inicio de sesión interactivo; las herramientas de inicio de sesión nativas del canal para agentes, como `whatsapp_login`, deben usarse desde el chat cuando estén disponibles.

## Solución de problemas

- Ejecuta `openclaw status --deep` para un sondeo amplio.
- Usa `openclaw doctor` para correcciones guiadas.
- `openclaw channels list` imprime `Claude: HTTP 403 ... user:profile` → la instantánea de uso necesita el alcance `user:profile`. Usa `--no-usage`, proporciona una clave de sesión de claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) o vuelve a autenticarte mediante Claude CLI.
- `openclaw channels status` recurre a resúmenes basados solo en la configuración cuando el Gateway no está accesible. Si una credencial de canal compatible está configurada mediante SecretRef pero no está disponible en la ruta de comandos actual, informa esa cuenta como configurada con notas de degradación en lugar de mostrarla como no configurada.

## Sondeo de capacidades

Obtén indicios de capacidades del proveedor (intenciones/alcances cuando estén disponibles) además del soporte de características estáticas:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítelo para listar todos los canales (incluidas las extensiones).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un id de canal numérico sin procesar y solo se aplica a Discord.
- Los sondeos son específicos del proveedor: intenciones de Discord + permisos de canal opcionales; alcances de bot + usuario de Slack; flags de bot de Telegram + Webhook; versión del demonio de Signal; token de aplicación de Microsoft Teams + roles/alcances de Graph (anotados donde se conozcan). Los canales sin sondeos informan `Probe: unavailable`.

## Resolver nombres a IDs

Resuelve nombres de canal/usuario a IDs usando el directorio del proveedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notas:

- Usa `--kind user|group|auto` para forzar el tipo de destino.
- La resolución prefiere coincidencias activas cuando varias entradas comparten el mismo nombre.
- `channels resolve` es de solo lectura. Si una cuenta seleccionada está configurada mediante SecretRef pero esa credencial no está disponible en la ruta de comandos actual, el comando devuelve resultados no resueltos degradados con notas en lugar de abortar toda la ejecución.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de canales](/es/channels)
