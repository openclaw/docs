---
read_when:
    - Quieres vincular rápidamente una aplicación de nodo móvil con un Gateway
    - Necesitas la salida del código de configuración para compartirla de forma remota o manual.
summary: Referencia de la CLI para `openclaw qr` (generar código QR de emparejamiento móvil + código de configuración)
title: QR
x-i18n:
    generated_at: "2026-07-11T22:57:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un código QR de vinculación móvil y un código de configuración a partir de la configuración actual de tu Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Las aplicaciones oficiales de OpenClaw para iOS y Android se conectan automáticamente cuando los metadatos de su código de configuración coinciden. Si una solicitud permanece pendiente (por ejemplo, para un cliente no oficial o por metadatos que no coinciden), revísala y apruébala:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opciones

- `--remote`: da preferencia a `gateway.remote.url`; si esa URL no está definida, recurre a `gateway.tailscale.mode=serve|funnel`. Ignora `publicUrl` del Plugin `device-pair`.
- `--url <url>`: reemplaza la URL del Gateway utilizada en la carga útil
- `--public-url <url>`: reemplaza la URL pública utilizada en la carga útil
- `--token <token>`: reemplaza el token del Gateway con el que se autentica el flujo de arranque
- `--password <password>`: reemplaza la contraseña del Gateway con la que se autentica el flujo de arranque
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite la representación del código QR en ASCII
- `--json`: genera JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` opcional, `auth`, `urlSource`)

`--token` y `--password` son mutuamente excluyentes.

## Contenido del código de configuración

El código de configuración contiene un `bootstrapToken` opaco y de corta duración, no el token ni la contraseña compartidos del Gateway. El flujo de arranque integrado emite:

- un token principal de `node` con `scopes: []`
- un token de traspaso limitado de `operator`, restringido a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`

Los ámbitos de modificación de vinculaciones y `operator.admin` siguen requiriendo una vinculación de operador aprobada por separado o un flujo de token.

## Resolución de la URL del Gateway

La vinculación móvil rechaza de forma segura las URL `ws://` públicas o de Tailscale para el Gateway: usa Tailscale Serve/Funnel o una URL `wss://` del Gateway en esos casos. Las direcciones LAN privadas y los hosts Bonjour `.local` siguen siendo compatibles mediante `ws://` sin cifrar.

Cuando la URL seleccionada del Gateway proviene de `gateway.bind=lan`, OpenClaw también comprueba las rutas persistentes de `tailscale serve status --json`. Cualquier raíz HTTPS de Serve que actúe como proxy del puerto local loopback del Gateway activo se incluye como alternativa. El comando QR añade esta alternativa solo para `lan`; `custom` y `tailnet` mantienen sus rutas anunciadas explícitamente. Los clientes actuales de iOS prueban las rutas anunciadas en orden y guardan la primera que sea accesible; el campo heredado `url` permanece sin cambios para los clientes más antiguos.

Con `--remote`, se requiere `gateway.remote.url` o `gateway.tailscale.mode=serve|funnel`.

## Resolución de autenticación (sin `--remote`)

Cuando no se proporciona una opción de autenticación mediante la CLI, las SecretRefs de autenticación del Gateway local se resuelven de la siguiente manera:

| Condición                                                                                                                    | Se resuelve como                          |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`, o modo inferido sin una fuente de contraseña prevalente                                         | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`, o modo inferido sin un token prevalente procedente de la autenticación o del entorno          | `gateway.auth.password`                   |
| Tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidas SecretRefs) y `gateway.auth.mode` no está definido | falla; define `gateway.auth.mode` explícitamente |

## Resolución de autenticación (`--remote`)

Si las credenciales remotas activas efectivas están configuradas como SecretRefs y no se proporciona ni `--token` ni `--password`, el comando las resuelve a partir de la instantánea activa del Gateway. Si el Gateway no está disponible, el comando falla de inmediato.

<Note>
Esta ruta del comando requiere un Gateway compatible con el método RPC `secrets.resolve`. Los Gateway más antiguos devuelven un error de método desconocido.
</Note>

## Temas relacionados

- [Referencia de la CLI](/es/cli)
- [Dispositivos](/es/cli/devices)
- [Vinculación](/es/cli/pairing)
