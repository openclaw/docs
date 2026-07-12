---
read_when:
    - Quieres vincular rápidamente una aplicación de Node móvil con un Gateway
    - Necesita la salida del código de configuración para compartirla de forma remota o manual.
summary: Referencia de la CLI para `openclaw qr` (generar un código QR de vinculación móvil y un código de configuración)
title: QR
x-i18n:
    generated_at: "2026-07-12T14:23:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un código QR de emparejamiento móvil y un código de configuración a partir de la configuración actual del Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Las aplicaciones oficiales de OpenClaw para iOS y Android se conectan automáticamente cuando coinciden los metadatos de sus códigos de configuración. Si una solicitud sigue pendiente (por ejemplo, para un cliente no oficial o por metadatos que no coinciden), revísela y apruébela:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opciones

- `--remote`: da preferencia a `gateway.remote.url`; si esa URL no está definida, recurre a `gateway.tailscale.mode=serve|funnel`. Ignora el `publicUrl` del Plugin `device-pair`.
- `--url <url>`: reemplaza la URL del gateway utilizada en la carga útil
- `--public-url <url>`: reemplaza la URL pública utilizada en la carga útil
- `--token <token>`: reemplaza el token del gateway con el que se autentica el flujo de arranque
- `--password <password>`: reemplaza la contraseña del gateway con la que se autentica el flujo de arranque
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite la representación ASCII del código QR
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` opcional, `auth`, `urlSource`)

`--token` y `--password` son mutuamente excluyentes.

## Contenido del código de configuración

El código de configuración contiene un `bootstrapToken` opaco y de corta duración, no el token ni la contraseña compartidos del gateway. El flujo de arranque integrado emite:

- un token `node` principal con `scopes: []`
- un token de transferencia `operator` limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`

Los ámbitos de modificación del emparejamiento y `operator.admin` aún requieren un emparejamiento de operador aprobado por separado o un flujo de tokens.

## Resolución de la URL del Gateway

El emparejamiento móvil rechaza de forma segura las URL `ws://` del gateway públicas o de Tailscale: utilice Tailscale Serve/Funnel o una URL `wss://` del gateway en esos casos. Las direcciones de LAN privadas y los hosts Bonjour `.local` siguen siendo compatibles mediante `ws://` sin cifrar.

Cuando la URL del Gateway seleccionada proviene de `gateway.bind=lan`, OpenClaw también comprueba las rutas persistentes de `tailscale serve status --json`. Cualquier raíz HTTPS de Serve que actúe como proxy del puerto de bucle local del Gateway activo se incluye como alternativa. El comando QR añade esta alternativa solo para `lan`; `custom` y `tailnet` conservan sus rutas anunciadas explícitamente. Los clientes actuales de iOS prueban las rutas anunciadas en orden y guardan la primera que sea accesible; el campo heredado `url` permanece sin cambios para los clientes antiguos.

Con `--remote`, se requiere `gateway.remote.url` o `gateway.tailscale.mode=serve|funnel`.

## Resolución de autenticación (sin `--remote`)

Cuando no se proporciona ninguna opción de autenticación mediante la CLI, las SecretRefs de autenticación del gateway local se resuelven de la siguiente manera:

| Condición                                                                                                                    | Se resuelve como                          |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`, o modo inferido sin una fuente de contraseña con prioridad                                      | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`, o modo inferido sin un token con prioridad procedente de la autenticación o del entorno       | `gateway.auth.password`                   |
| Se configuran tanto `gateway.auth.token` como `gateway.auth.password` (incluidas SecretRefs) y `gateway.auth.mode` no está definido | falla; defina `gateway.auth.mode` explícitamente |

## Resolución de autenticación (`--remote`)

Si las credenciales remotas efectivamente activas están configuradas como SecretRefs y no se proporciona `--token` ni `--password`, el comando las resuelve a partir de la instantánea activa del gateway. Si el gateway no está disponible, el comando falla de inmediato.

<Note>
Esta ruta del comando requiere un gateway compatible con el método RPC `secrets.resolve`. Los gateways antiguos devuelven un error de método desconocido.
</Note>

## Temas relacionados

- [Referencia de la CLI](/es/cli)
- [Dispositivos](/es/cli/devices)
- [Emparejamiento](/es/cli/pairing)
