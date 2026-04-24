---
read_when:
    - Ejecutar el host Node sin interfaz
    - Vincular un nodo que no sea macOS para `system.run`
summary: Referencia de la CLI para `openclaw node` (host Node sin interfaz)
title: Node
x-i18n:
    generated_at: "2026-04-24T05:23:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 002412b2ca7d0ed301cc29480ba7323ddb68dc6656bd6b739afab8179fa71664
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Ejecuta un **host Node sin interfaz** que se conecta al WebSocket del Gateway y expone
`system.run` / `system.which` en esta máquina.

## ¿Por qué usar un host Node?

Usa un host Node cuando quieras que los agentes **ejecuten comandos en otras máquinas** de tu
red sin instalar allí una aplicación complementaria completa de macOS.

Casos de uso comunes:

- Ejecutar comandos en equipos Linux/Windows remotos (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener la ejecución en **sandbox** en el Gateway, pero delegar ejecuciones aprobadas a otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz para automatización o nodos de CI.

La ejecución sigue estando protegida por **aprobaciones de ejecución** y listas de permitidos por agente en el
host Node, por lo que puedes mantener el acceso a comandos delimitado y explícito.

## Proxy del navegador (configuración cero)

Los hosts Node anuncian automáticamente un proxy del navegador si `browser.enabled` no está
desactivado en el nodo. Esto permite que el agente use automatización del navegador en ese nodo
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal de perfiles de navegador del nodo. Si
estableces `nodeHost.browserProxy.allowProfiles`, el proxy pasa a ser restrictivo:
se rechaza el direccionamiento a perfiles que no estén en la lista de permitidos, y las rutas persistentes de
creación/eliminación de perfiles quedan bloqueadas a través del proxy.

Desactívalo en el nodo si es necesario:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Ejecutar (en primer plano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usar TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: anular el id del nodo (borra el token de vinculación)
- `--display-name <name>`: anular el nombre para mostrar del nodo

## Autenticación del Gateway para el host Node

`openclaw node run` y `openclaw node install` resuelven la autenticación del Gateway a partir de la configuración/entorno (sin indicadores `--token`/`--password` en los comandos de node):

- Primero se comprueban `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Luego, el respaldo de configuración local: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host Node intencionadamente no hereda `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución de autenticación del nodo falla con cierre seguro (sin enmascaramiento mediante respaldo remoto).
- En `gateway.mode=remote`, los campos del cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también pueden aplicarse según las reglas de precedencia remota.
- La resolución de autenticación del host Node solo respeta variables de entorno `OPENCLAW_GATEWAY_*`.

## Servicio (en segundo plano)

Instala un host Node sin interfaz como servicio de usuario.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usar TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: anular el id del nodo (borra el token de vinculación)
- `--display-name <name>`: anular el nombre para mostrar del nodo
- `--runtime <runtime>`: runtime del servicio (`node` o `bun`)
- `--force`: reinstalar/sobrescribir si ya está instalado

Gestionar el servicio:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` para un host Node en primer plano (sin servicio).

Los comandos de servicio aceptan `--json` para salida legible por máquina.

## Vinculación

La primera conexión crea una solicitud pendiente de vinculación de dispositivo (`role: node`) en el Gateway.
Apruébala mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si el nodo vuelve a intentar la vinculación con detalles de autenticación cambiados (rol/ámbitos/clave pública),
la solicitud pendiente anterior queda reemplazada y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

El host Node almacena su id de nodo, token, nombre para mostrar e información de conexión del Gateway en
`~/.openclaw/node.json`.

## Aprobaciones de ejecución

`system.run` está controlado por aprobaciones locales de ejecución:

- `~/.openclaw/exec-approvals.json`
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para ejecución asíncrona aprobada del nodo, OpenClaw prepara un `systemRunPlan`
canónico antes de solicitar aprobación. El reenvío posterior aprobado de `system.run` reutiliza ese
plan almacenado, por lo que se rechazan las ediciones en los campos command/cwd/session después de que se haya
creado la solicitud de aprobación, en lugar de cambiar lo que ejecuta el nodo.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
