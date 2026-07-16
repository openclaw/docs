---
read_when:
    - Quiere emparejar rápidamente una aplicación de nodo móvil con un Gateway
    - Necesita la salida del código de configuración para compartirla de forma remota o manual.
summary: Referencia de la CLI para `openclaw qr` (generar el código QR de vinculación móvil y el código de configuración)
title: QR
x-i18n:
    generated_at: "2026-07-16T11:35:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un código QR de vinculación móvil y un código de configuración a partir de la configuración actual del Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Las aplicaciones oficiales de OpenClaw para iOS y Android se conectan automáticamente cuando coinciden los metadatos de sus códigos de configuración. Si una solicitud permanece pendiente (por ejemplo, debido a un cliente no oficial o a metadatos que no coinciden), revísela y apruébela:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opciones

- `--remote`: prioriza `gateway.remote.url`; recurre a `gateway.tailscale.mode=serve|funnel` si esa URL no está definida. Ignora `device-pair` del Plugin `publicUrl`.
- `--url <url>`: sustituye la URL del Gateway utilizada en la carga útil
- `--public-url <url>`: sustituye la URL pública utilizada en la carga útil
- `--token <token>`: sustituye el token del Gateway con el que se autentica el flujo de arranque
- `--password <password>`: sustituye la contraseña del Gateway con la que se autentica el flujo de arranque
- `--limited`: omite el acceso administrativo al Gateway del token de operador transferido
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite la representación ASCII del código QR
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` opcional, `auth`, `access`, `accessDowngraded` opcional, `urlSource`)

`--token` y `--password` son mutuamente excluyentes.

## Contenido del código de configuración

El código de configuración contiene un `bootstrapToken` opaco y de corta duración, no el token ni la contraseña compartidos del Gateway. Para un endpoint `wss://` (o un bucle invertido en el mismo host), el flujo de arranque predeterminado emite:

- un token principal `node` con `scopes: []`
- un token de transferencia `operator` completo para dispositivos móviles nativos con `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`

Utilice `--limited` para conservar el mismo token de nodo y omitir `operator.admin` de la transferencia al operador. El ámbito de modificación de vinculaciones nunca se transfiere mediante un código de configuración.

La configuración mediante `ws://` de LAN en texto sin formato sigue disponible, pero OpenClaw utiliza automáticamente el perfil limitado porque un observador de la red podría capturar el token portador de arranque y adelantarse en su uso. Configure `wss://` o Tailscale Serve y, a continuación, genere un código nuevo para obtener acceso completo.

## Resolución de la URL del Gateway

La vinculación móvil aplica un cierre seguro para las URL de Gateway `ws://` públicas o de Tailscale: utilice Tailscale Serve/Funnel o una URL de Gateway `wss://` para ellas. Las direcciones de LAN privadas y los hosts Bonjour `.local` siguen siendo compatibles mediante `ws://` sin cifrar, con acceso limitado del operador, como se describe anteriormente.

Cuando la URL del Gateway seleccionada procede de `gateway.bind=lan`, OpenClaw también comprueba las rutas persistentes `tailscale serve status --json`. Cualquier raíz HTTPS de Serve que actúe como proxy del puerto de bucle invertido del Gateway activo se incluye como alternativa. El comando QR añade esta alternativa solo para `lan`; `custom` y `tailnet` conservan sus rutas anunciadas explícitamente. Los clientes actuales de iOS prueban las rutas anunciadas en orden y guardan la primera accesible; el campo heredado `url` permanece sin cambios para los clientes antiguos.

Con `--remote`, se requiere uno de `gateway.remote.url` o `gateway.tailscale.mode=serve|funnel`.

## Resolución de autenticación (sin `--remote`)

Cuando no se proporciona ninguna sustitución de autenticación de la CLI, las SecretRefs de autenticación del Gateway local se resuelven de la siguiente manera:

| Condición                                                                                                                    | Se resuelve como                           |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `gateway.auth.mode="token"`, o modo inferido sin una fuente de contraseña que prevalezca                                                | `gateway.auth.token`                         |
| `gateway.auth.mode="password"`, o modo inferido sin un token de auth/env que prevalezca                                                    | `gateway.auth.password`                         |
| Tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidas las SecretRefs) y `gateway.auth.mode` no está definido | falla; defina `gateway.auth.mode` explícitamente |

## Resolución de autenticación (`--remote`)

Si las credenciales remotas efectivamente activas están configuradas como SecretRefs y no se proporciona ni `--token` ni `--password`, el comando las resuelve a partir de la instantánea activa del Gateway. Si el Gateway no está disponible, el comando falla de inmediato.

<Note>
Esta ruta del comando requiere un Gateway compatible con el método RPC `secrets.resolve`. Los Gateway más antiguos devuelven un error de método desconocido.
</Note>

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Dispositivos](/es/cli/devices)
- [Vinculación](/es/cli/pairing)
