---
read_when:
    - Ejecutar el host de Node sin interfaz
    - Emparejar un Node que no sea macOS para `system.run`
summary: Referencia de CLI para `openclaw node` (host de Node sin interfaz)
title: Node
x-i18n:
    generated_at: "2026-04-24T08:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Ejecuta un **host de Node sin interfaz** que se conecta al WebSocket del Gateway y expone
`system.run` / `system.which` en esta máquina.

## ¿Por qué usar un host de Node?

Usa un host de Node cuando quieras que los agentes **ejecuten comandos en otras máquinas** de tu
red sin instalar allí una app complementaria completa de macOS.

Casos de uso comunes:

- Ejecutar comandos en equipos remotos Linux/Windows (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener la ejecución **aislada** en el gateway, pero delegar ejecuciones aprobadas a otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz para automatización o nodos de CI.

La ejecución sigue estando protegida por **aprobaciones de ejecución** y listas de permitidos por agente en el
host de Node, por lo que puedes mantener el acceso a comandos limitado y explícito.

## Proxy del navegador (configuración cero)

Los hosts de Node anuncian automáticamente un proxy del navegador si `browser.enabled` no está
deshabilitado en el node. Esto permite que el agente use automatización del navegador en ese node
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal del perfil de navegador del node. Si
configuras `nodeHost.browserProxy.allowProfiles`, el proxy se vuelve restrictivo:
se rechaza la selección de perfiles que no estén en la lista de permitidos y las rutas persistentes de
creación/eliminación de perfiles se bloquean a través del proxy.

Desactívalo en el node si es necesario:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Ejecutar (primer plano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: Host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: Puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: Usa TLS para la conexión al gateway
- `--tls-fingerprint <sha256>`: Huella digital esperada del certificado TLS (sha256)
- `--node-id <id>`: Sobrescribe el id del node (borra el token de emparejamiento)
- `--display-name <name>`: Sobrescribe el nombre para mostrar del node

## Autenticación del Gateway para el host de Node

`openclaw node run` y `openclaw node install` resuelven la autenticación del gateway desde config/env (sin flags `--token`/`--password` en los comandos de node):

- Primero se comprueban `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Después, el respaldo de la configuración local: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de Node intencionalmente no hereda `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución de autenticación del node falla de forma segura (sin enmascaramiento mediante respaldo remoto).
- En `gateway.mode=remote`, los campos del cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también pueden aplicar según las reglas de precedencia remota.
- La resolución de autenticación del host de Node solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

Para un node que se conecta a un Gateway `ws://` no loopback en una red privada
de confianza, establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sin ello, el inicio del node
falla de forma segura y te pide usar `wss://`, un túnel SSH o Tailscale.
Esto es una aceptación explícita mediante entorno de proceso, no una clave de configuración de `openclaw.json`.
`openclaw node install` la conserva en el servicio supervisado del node cuando está
presente en el entorno del comando de instalación.

## Servicio (segundo plano)

Instala un host de Node sin interfaz como servicio de usuario.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: Host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: Puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: Usa TLS para la conexión al gateway
- `--tls-fingerprint <sha256>`: Huella digital esperada del certificado TLS (sha256)
- `--node-id <id>`: Sobrescribe el id del node (borra el token de emparejamiento)
- `--display-name <name>`: Sobrescribe el nombre para mostrar del node
- `--runtime <runtime>`: Entorno de ejecución del servicio (`node` o `bun`)
- `--force`: Reinstala/sobrescribe si ya está instalado

Administra el servicio:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` para un host de Node en primer plano (sin servicio).

Los comandos del servicio aceptan `--json` para salida legible por máquina.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.
Apruébala mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si el node vuelve a intentar el emparejamiento con detalles de autenticación cambiados (rol/scopes/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

El host de Node almacena su id de node, token, nombre para mostrar e información de conexión al gateway en
`~/.openclaw/node.json`.

## Aprobaciones de ejecución

`system.run` está controlado por aprobaciones de ejecución locales:

- `~/.openclaw/exec-approvals.json`
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para una ejecución asíncrona aprobada del node, OpenClaw prepara un `systemRunPlan`
canónico antes de solicitar confirmación. La redirección posterior aprobada de `system.run` reutiliza ese
plan almacenado, por lo que las ediciones en los campos command/cwd/session después de que se haya
creado la solicitud de aprobación se rechazan en lugar de cambiar lo que ejecuta el node.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodes](/es/nodes)
