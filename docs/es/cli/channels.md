---
read_when:
    - Quieres agregar o eliminar cuentas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Desea comprobar el estado del canal o seguir los registros del canal
summary: Referencia de CLI para `openclaw channels` (cuentas, estado, inicio/cierre de sesión, registros)
title: Canales
x-i18n:
    generated_at: "2026-05-02T05:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9cfde99d49d63397756b182a20ae3936a6b23f2455616dc86ceb3f16a205c06
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

`channels status --probe` es la ruta en vivo: en un gateway alcanzable ejecuta comprobaciones `probeAccount` por cuenta y comprobaciones opcionales `auditAccount`, por lo que la salida puede incluir el estado del transporte junto con resultados de sondeo como `works`, `probe failed`, `audit ok` o `audit failed`.
Si no se puede acceder al gateway, `channels status` recurre a resúmenes solo de configuración en lugar de mostrar la salida del sondeo en vivo.

## Agregar / eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` muestra las opciones por canal (token, clave privada, token de app, rutas de signal-cli, etc.).
</Tip>

`channels remove` solo opera sobre plugins de canal instalados/configurados. Usa `channels add` primero para canales del catálogo instalables.
Para plugins de canal respaldados por runtime, `channels remove` también solicita al Gateway en ejecución que detenga la cuenta seleccionada antes de actualizar la configuración, de modo que deshabilitar o eliminar una cuenta no deje activo el listener anterior hasta el reinicio.

Las superficies comunes de adición no interactiva incluyen:

- canales con bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte de Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos de Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos de Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos de Nostr: `--private-key`, `--relay-urls`
- campos de Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticación respaldada por variables de entorno de la cuenta predeterminada donde sea compatible

Si se necesita instalar un plugin de canal durante un comando de adición controlado por opciones, OpenClaw usa la fuente de instalación predeterminada del canal sin abrir el aviso interactivo de instalación de plugins.

Cuando ejecutas `openclaw channels add` sin opciones, el asistente interactivo puede solicitar:

- ids de cuenta por canal seleccionado
- nombres visibles opcionales para esas cuentas
- `Bind configured channel accounts to agents now?`

Si confirmas enlazar ahora, el asistente pregunta qué agente debe ser propietario de cada cuenta de canal configurada y escribe enlaces de enrutamiento con alcance de cuenta.

También puedes gestionar las mismas reglas de enrutamiento más tarde con `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulta [agentes](/es/cli/agents)).

Cuando agregas una cuenta no predeterminada a un canal que aún usa opciones de nivel superior de cuenta única, OpenClaw promueve los valores de nivel superior con alcance de cuenta al mapa de cuentas del canal antes de escribir la cuenta nueva. La mayoría de los canales colocan esos valores en `channels.<channel>.accounts.default`, pero los canales incluidos pueden conservar en su lugar una cuenta promovida existente que coincida. Matrix es el ejemplo actual: si ya existe una cuenta con nombre, o `defaultAccount` apunta a una cuenta con nombre existente, la promoción conserva esa cuenta en lugar de crear una nueva `accounts.default`.

El comportamiento de enrutamiento se mantiene coherente:

- Los enlaces existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea automáticamente ni reescribe enlaces en modo no interactivo.
- La configuración interactiva puede agregar opcionalmente enlaces con alcance de cuenta.

Si tu configuración ya estaba en un estado mixto (cuentas con nombre presentes y valores de cuenta única de nivel superior aún establecidos), ejecuta `openclaw doctor --fix` para mover los valores con alcance de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales promueven a `accounts.default`; Matrix puede conservar en su lugar un destino existente con nombre/predeterminado.

## Inicio y cierre de sesión (interactivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` admite `--verbose`.
- `channels login` y `logout` pueden inferir el canal cuando solo hay configurado un destino de inicio de sesión compatible.
- `channels logout` prefiere la ruta en vivo del Gateway cuando es alcanzable, por lo que el cierre de sesión detiene cualquier listener activo antes de borrar el estado de autenticación del canal. Si no se puede acceder a un Gateway local, recurre a la limpieza de autenticación local.
- Ejecuta `channels login` desde una terminal en el host del gateway. Agent `exec` bloquea este flujo interactivo de inicio de sesión; las herramientas nativas de inicio de sesión de agente para el canal, como `whatsapp_login`, deben usarse desde el chat cuando estén disponibles.

## Solución de problemas

- Ejecuta `openclaw status --deep` para un sondeo amplio.
- Usa `openclaw doctor` para correcciones guiadas.
- `openclaw channels list` imprime `Claude: HTTP 403 ... user:profile` → la instantánea de uso necesita el alcance `user:profile`. Usa `--no-usage`, proporciona una clave de sesión de claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) o vuelve a autenticarte mediante Claude CLI.
- `openclaw channels status` recurre a resúmenes solo de configuración cuando no se puede acceder al gateway. Si una credencial de canal compatible está configurada mediante SecretRef pero no está disponible en la ruta del comando actual, informa esa cuenta como configurada con notas degradadas en lugar de mostrarla como no configurada.

## Sondeo de capacidades

Obtén indicios de capacidades del proveedor (intents/scopes donde estén disponibles) junto con compatibilidad de funciones estáticas:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítelo para listar todos los canales (incluidas las extensiones).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un id de canal numérico sin procesar y solo se aplica a Discord.
- Los sondeos son específicos del proveedor: intents de Discord + permisos opcionales de canal; bot de Slack + scopes de usuario; opciones de bot de Telegram + Webhook; versión del daemon de Signal; token de app de Microsoft Teams + roles/scopes de Graph (anotados donde se conocen). Los canales sin sondeos informan `Probe: unavailable`.

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
- `channels resolve` es de solo lectura. Si una cuenta seleccionada está configurada mediante SecretRef pero esa credencial no está disponible en la ruta del comando actual, el comando devuelve resultados degradados sin resolver con notas en lugar de abortar toda la ejecución.
- `channels resolve` no instala plugins de canal. Usa `channels add --channel <name>` antes de resolver nombres para un canal instalable del catálogo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de canales](/es/channels)
