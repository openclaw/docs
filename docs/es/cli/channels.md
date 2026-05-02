---
read_when:
    - Desea agregar o eliminar cuentas de canales (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Quieres comprobar el estado del canal o seguir los registros del canal
summary: Referencia de la CLI para `openclaw channels` (cuentas, estado, inicio/cierre de sesión, registros)
title: Canales
x-i18n:
    generated_at: "2026-05-02T20:43:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
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

`channels status --probe` es la ruta en vivo: en un Gateway accesible ejecuta comprobaciones `probeAccount` por cuenta y comprobaciones opcionales `auditAccount`, por lo que la salida puede incluir el estado del transporte más resultados de sondeo como `works`, `probe failed`, `audit ok` o `audit failed`. Si el Gateway no es accesible, `channels status` recurre a resúmenes solo de configuración en lugar de la salida de sondeo en vivo.

No uses `openclaw sessions`, Gateway `sessions.list` ni la herramienta de agente `sessions_list` como señal del estado de los sockets de canal. Esas superficies informan filas de conversaciones almacenadas, no el estado de ejecución del proveedor. Después de reiniciar un proveedor de Discord, una cuenta conectada pero inactiva puede estar en buen estado aunque no aparezca ninguna fila de sesión de Discord hasta el siguiente evento de conversación entrante o saliente.

## Añadir / eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` muestra las marcas por canal (token, clave privada, token de app, rutas de signal-cli, etc.).
</Tip>

`channels remove` solo opera en plugins de canal instalados/configurados. Usa `channels add` primero para canales instalables del catálogo. En plugins de canal respaldados por ejecución, `channels remove` también pide al Gateway en ejecución que detenga la cuenta seleccionada antes de actualizar la configuración, de modo que deshabilitar o eliminar una cuenta no deje activo el listener anterior hasta el reinicio.

Las superficies de adición no interactivas comunes incluyen:

- canales con bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos de Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos de Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos de Nostr: `--private-key`, `--relay-urls`
- campos de Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticación de cuenta predeterminada respaldada por env cuando sea compatible

Si se debe instalar un Plugin de canal durante un comando de adición controlado por marcas, OpenClaw usa el origen de instalación predeterminado del canal sin abrir el prompt interactivo de instalación de Plugin.

Cuando ejecutas `openclaw channels add` sin marcas, el asistente interactivo puede solicitar:

- ids de cuenta por canal seleccionado
- nombres para mostrar opcionales para esas cuentas
- `Bind configured channel accounts to agents now?`

Si confirmas vincular ahora, el asistente pregunta qué agente debe poseer cada cuenta de canal configurada y escribe enlaces de enrutamiento con ámbito de cuenta.

También puedes gestionar las mismas reglas de enrutamiento más tarde con `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulta [agentes](/es/cli/agents)).

Cuando añades una cuenta no predeterminada a un canal que todavía usa ajustes de nivel superior de una sola cuenta, OpenClaw promueve los valores de nivel superior con ámbito de cuenta al mapa de cuentas del canal antes de escribir la nueva cuenta. La mayoría de los canales colocan esos valores en `channels.<channel>.accounts.default`, pero los canales incluidos pueden conservar en su lugar una cuenta promovida coincidente existente. Matrix es el ejemplo actual: si ya existe una cuenta con nombre, o `defaultAccount` apunta a una cuenta con nombre existente, la promoción conserva esa cuenta en lugar de crear una nueva `accounts.default`.

El comportamiento de enrutamiento se mantiene coherente:

- Los enlaces existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea automáticamente ni reescribe enlaces en modo no interactivo.
- La configuración interactiva puede añadir opcionalmente enlaces con ámbito de cuenta.

Si tu configuración ya estaba en un estado mixto (cuentas con nombre presentes y valores de nivel superior de una sola cuenta aún establecidos), ejecuta `openclaw doctor --fix` para mover los valores con ámbito de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales se promueven a `accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado existente.

## Inicio y cierre de sesión (interactivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` admite `--verbose`.
- `channels login` y `logout` pueden inferir el canal cuando solo hay un destino de inicio de sesión compatible configurado.
- `channels logout` prefiere la ruta del Gateway en vivo cuando es accesible, de modo que el cierre de sesión detiene cualquier listener activo antes de borrar el estado de autenticación del canal. Si un Gateway local no es accesible, recurre a la limpieza de autenticación local.
- Ejecuta `channels login` desde una terminal en el host del Gateway. El agente `exec` bloquea este flujo interactivo de inicio de sesión; las herramientas de inicio de sesión nativas del canal para agentes, como `whatsapp_login`, deben usarse desde el chat cuando estén disponibles.

## Solución de problemas

- Ejecuta `openclaw status --deep` para un sondeo amplio.
- Usa `openclaw doctor` para correcciones guiadas.
- `openclaw channels list` imprime `Claude: HTTP 403 ... user:profile` → la instantánea de uso necesita el ámbito `user:profile`. Usa `--no-usage`, proporciona una clave de sesión de claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) o vuelve a autenticarte mediante Claude CLI.
- `openclaw channels status` recurre a resúmenes solo de configuración cuando el Gateway no es accesible. Si una credencial de canal compatible está configurada mediante SecretRef pero no está disponible en la ruta del comando actual, informa esa cuenta como configurada con notas degradadas en lugar de mostrarla como no configurada.

## Sondeo de capacidades

Obtén indicios de capacidades del proveedor (intents/ámbitos cuando estén disponibles) más soporte estático de características:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítelo para listar todos los canales (incluidas las extensiones).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un id de canal numérico sin formato y solo se aplica a Discord.
- Los sondeos son específicos del proveedor: intents de Discord + permisos de canal opcionales; bot de Slack + ámbitos de usuario; marcas de bot de Telegram + Webhook; versión del daemon de Signal; token de app de Microsoft Teams + roles/ámbitos de Graph (anotados donde se conocen). Los canales sin sondeos informan `Probe: unavailable`.

## Resolver nombres a ID

Resuelve nombres de canal/usuario a ID usando el directorio del proveedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notas:

- Usa `--kind user|group|auto` para forzar el tipo de destino.
- La resolución prefiere coincidencias activas cuando varias entradas comparten el mismo nombre.
- `channels resolve` es de solo lectura. Si una cuenta seleccionada está configurada mediante SecretRef pero esa credencial no está disponible en la ruta del comando actual, el comando devuelve resultados degradados sin resolver con notas en lugar de cancelar toda la ejecución.
- `channels resolve` no instala plugins de canal. Usa `channels add --channel <name>` antes de resolver nombres para un canal instalable del catálogo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de canales](/es/channels)
