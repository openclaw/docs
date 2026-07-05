---
read_when:
    - Quieres emparejar rápidamente una aplicación móvil de Node con un Gateway
    - Necesitas la salida de código de configuración para compartir de forma remota/manual
summary: Referencia de CLI para `openclaw qr` (generar QR de emparejamiento móvil + código de configuración)
title: QR
x-i18n:
    generated_at: "2026-07-05T11:11:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0caa7b53694ce63fab7fe1554809833c5df2b7499709a9137f3199ce01409757
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
metadatos del código de configuración coinciden. Si una solicitud queda pendiente (por ejemplo, para un
cliente no oficial o metadatos no coincidentes), revísala y apruébala:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opciones

- `--remote`: prefiere `gateway.remote.url`; recurre a `gateway.tailscale.mode=serve|funnel` si esa URL no está definida. Ignora `device-pair` plugin `publicUrl`.
- `--url <url>`: anula la URL del Gateway usada en la carga útil
- `--public-url <url>`: anula la URL pública usada en la carga útil
- `--token <token>`: anula el token del Gateway con el que se autentica el flujo de arranque
- `--password <password>`: anula la contraseña del Gateway con la que se autentica el flujo de arranque
- `--setup-code-only`: imprime solo el código de configuración
- `--no-ascii`: omite la representación QR en ASCII
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

`--token` y `--password` son mutuamente excluyentes.

## Contenido del código de configuración

El código de configuración transporta un `bootstrapToken` opaco y de corta duración, no el token/contraseña compartido del Gateway. El flujo de arranque integrado emite:

- un token principal `node` con `scopes: []`
- un token acotado de transferencia `operator` limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`

Los ámbitos de mutación de emparejamiento y `operator.admin` siguen requiriendo un emparejamiento de operador aprobado o un flujo de token independiente.

## Resolución de URL del Gateway

El emparejamiento móvil falla de forma cerrada para URL de Gateway Tailscale/públicas `ws://`: usa Tailscale Serve/Funnel o una URL de Gateway `wss://` para esas. Las direcciones LAN privadas y los hosts Bonjour `.local` siguen siendo compatibles mediante `ws://` sin cifrar.

Con `--remote`, se requiere uno de `gateway.remote.url` o `gateway.tailscale.mode=serve|funnel`.

## Resolución de autenticación (sin `--remote`)

Cuando no se pasa ninguna anulación de autenticación de CLI, las SecretRefs de autenticación del Gateway local se resuelven así:

| Condición                                                                                                                    | Resuelve                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`, o modo inferido sin una fuente de contraseña ganadora                                           | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`, o modo inferido sin un token ganador de auth/env                                            | `gateway.auth.password`                   |
| Tanto `gateway.auth.token` como `gateway.auth.password` están configurados (incluidas SecretRefs) y `gateway.auth.mode` no está definido | falla; define `gateway.auth.mode` explícitamente |

## Resolución de autenticación (`--remote`)

Si se han configurado credenciales remotas efectivamente activas como SecretRefs y no se pasa ni `--token` ni `--password`, el comando las resuelve desde la instantánea activa del Gateway. Si el Gateway no está disponible, el comando falla rápidamente.

<Note>
Esta ruta de comando requiere un Gateway que admita el método RPC `secrets.resolve`. Los Gateways más antiguos devuelven un error de método desconocido.
</Note>

## Relacionado

- [Referencia de CLI](/es/cli)
- [Dispositivos](/es/cli/devices)
- [Emparejamiento](/es/cli/pairing)
