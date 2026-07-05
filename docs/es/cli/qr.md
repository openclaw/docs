---
read_when:
    - Quieres emparejar una aplicación Node móvil con un Gateway rápidamente
    - Necesitas la salida de setup-code para compartirla de forma remota/manual
summary: Referencia de CLI para `openclaw qr` (generar QR de emparejamiento móvil + código de configuración)
title: QR
x-i18n:
    generated_at: "2026-07-05T17:41:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc8e1781b654f281f53beea8ec684c743fb585f65a0ecc9823a20a0180b4ca4c
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un QR de emparejamiento móvil y un código de configuración desde tu configuración actual de Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Las aplicaciones oficiales de OpenClaw para iOS y Android se conectan automáticamente cuando sus
metadatos de código de configuración coinciden. Si una solicitud queda pendiente (por ejemplo, para un
cliente no oficial o metadatos no coincidentes), revísala y apruébala:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opciones

- `--remote`: prefiere `gateway.remote.url`; recurre a `gateway.tailscale.mode=serve|funnel` si esa URL no está definida. Ignora `publicUrl` del Plugin `device-pair`.
- `--url <url>`: sobrescribe la URL del Gateway utilizada en la carga útil
- `--public-url <url>`: sobrescribe la URL pública utilizada en la carga útil
- `--token <token>`: sobrescribe el token del Gateway contra el que se autentica el flujo de arranque
- `--password <password>`: sobrescribe la contraseña del Gateway contra la que se autentica el flujo de arranque
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite la representación ASCII del QR
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` opcional, `auth`, `urlSource`)

`--token` y `--password` son mutuamente excluyentes.

## Contenido del código de configuración

El código de configuración transporta un `bootstrapToken` opaco y de corta duración, no el token/contraseña compartido del Gateway. El flujo de arranque integrado emite:

- un token primario `node` con `scopes: []`
- un token de transferencia `operator` acotado, limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`

Los ámbitos de mutación de emparejamiento y `operator.admin` siguen requiriendo un emparejamiento de operador aprobado por separado o un flujo de token.

## Resolución de URL del Gateway

El emparejamiento móvil falla de forma cerrada con URL de Gateway `ws://` públicas/Tailscale: usa Tailscale Serve/Funnel o una URL de Gateway `wss://` para esos casos. Las direcciones LAN privadas y los hosts Bonjour `.local` siguen siendo compatibles mediante `ws://` sin cifrar.

Cuando la URL de Gateway seleccionada proviene de `gateway.bind=lan`, OpenClaw también comprueba rutas persistentes de `tailscale serve status --json`. Cualquier raíz HTTPS de Serve que redirija al puerto local loopback del Gateway activo se incluye como alternativa. Los enlaces de interfaz específica `custom` y `tailnet` no reciben esa alternativa porque un proxy Serve de loopback no puede alcanzar esos listeners. Los clientes iOS actuales prueban las rutas anunciadas en orden y guardan la primera que sea alcanzable; el campo heredado `url` permanece sin cambios para clientes antiguos.

Con `--remote`, se requiere uno de `gateway.remote.url` o `gateway.tailscale.mode=serve|funnel`.

## Resolución de autenticación (sin `--remote`)

Cuando no se pasa ninguna sobrescritura de autenticación de CLI, las SecretRefs de autenticación del Gateway local se resuelven así:

| Condición                                                                                                                    | Se resuelve como                          |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`, o modo inferido sin una fuente de contraseña ganadora                                           | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`, o modo inferido sin un token ganador desde auth/env                                         | `gateway.auth.password`                   |
| Tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidas SecretRefs) y `gateway.auth.mode` no está definido | falla; define `gateway.auth.mode` explícitamente |

## Resolución de autenticación (`--remote`)

Si las credenciales remotas efectivamente activas están configuradas como SecretRefs y no se pasa ni `--token` ni `--password`, el comando las resuelve desde la instantánea del Gateway activo. Si el Gateway no está disponible, el comando falla rápidamente.

<Note>
Esta ruta de comando requiere un Gateway compatible con el método RPC `secrets.resolve`. Los Gateway antiguos devuelven un error de método desconocido.
</Note>

## Relacionado

- [Referencia de CLI](/es/cli)
- [Dispositivos](/es/cli/devices)
- [Emparejamiento](/es/cli/pairing)
