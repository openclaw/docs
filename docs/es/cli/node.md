---
read_when:
    - Ejecutar el host de Node sin interfaz gráfica
    - Emparejamiento de un nodo no macOS para system.run
summary: Referencia de CLI para `openclaw node` (host de Node sin interfaz)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Ejecuta un **host Node sin interfaz gráfica** que se conecta al WebSocket del Gateway y expone
`system.run` / `system.which` en esta máquina.

## ¿Por qué usar un host Node?

Usa un host Node cuando quieras que los agentes **ejecuten comandos en otras máquinas** de tu
red sin instalar allí una app complementaria completa de macOS.

Casos de uso comunes:

- Ejecutar comandos en equipos Linux/Windows remotos (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener la ejecución **en sandbox** en el Gateway, pero delegar ejecuciones aprobadas a otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz gráfica para automatización o nodos de CI.

La ejecución sigue protegida por **aprobaciones de ejecución** y listas de permitidos por agente en el
host Node, para que puedas mantener el acceso a comandos acotado y explícito.

## Proxy de navegador (sin configuración)

Los hosts Node anuncian automáticamente un proxy de navegador si `browser.enabled` no está
deshabilitado en el Node. Esto permite que el agente use automatización de navegador en ese Node
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal del perfil de navegador del Node. Si
configuras `nodeHost.browserProxy.allowProfiles`, el proxy se vuelve restrictivo:
se rechaza la selección de perfiles que no estén en la lista de permitidos, y las rutas de
creación/eliminación de perfiles persistentes se bloquean a través del proxy.

Deshabilítalo en el Node si es necesario:

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

- `--host <host>`: host WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usar TLS para la conexión con el gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: sobrescribir el id de Node (borra el token de emparejamiento)
- `--display-name <name>`: sobrescribir el nombre visible del Node

## Autenticación de Gateway para host Node

`openclaw node run` y `openclaw node install` resuelven la autenticación del gateway desde config/env (sin flags `--token`/`--password` en los comandos de Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` se comprueban primero.
- Luego se usa la configuración local como alternativa: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host Node no hereda intencionadamente `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se puede resolver, la resolución de autenticación de Node falla de forma cerrada (sin enmascaramiento mediante alternativa remota).
- En `gateway.mode=remote`, los campos de cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también son elegibles según las reglas de precedencia remota.
- La resolución de autenticación del host Node solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

Para un Node que se conecta a un Gateway `ws://` que no es local loopback en una red privada
de confianza, configura `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sin esto, el inicio del Node
falla de forma cerrada y te pide usar `wss://`, un túnel SSH o Tailscale.
Esta es una habilitación explícita del entorno del proceso, no una clave de configuración de `openclaw.json`.
`openclaw node install` la persiste en el servicio supervisado del Node cuando está
presente en el entorno del comando de instalación.

## Servicio (segundo plano)

Instala un host Node sin interfaz gráfica como servicio de usuario.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usar TLS para la conexión con el gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: sobrescribir el id de Node (borra el token de emparejamiento)
- `--display-name <name>`: sobrescribir el nombre visible del Node
- `--runtime <runtime>`: runtime del servicio (`node` o `bun`)
- `--force`: reinstalar/sobrescribir si ya está instalado

Gestiona el servicio:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` para un host Node en primer plano (sin servicio).

Los comandos de servicio aceptan `--json` para salida legible por máquina.

El host Node reintenta el reinicio del Gateway y los cierres de red dentro del proceso. Si el
Gateway informa una pausa terminal de autenticación por token/contraseña/bootstrap, el host Node
registra el detalle del cierre y sale con código distinto de cero para que launchd/systemd pueda reiniciarlo con
configuración y credenciales nuevas. Las pausas que requieren emparejamiento permanecen en el flujo
de primer plano para que la solicitud pendiente pueda aprobarse.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.
Apruébala mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

En redes de Node estrictamente controladas, el operador del Gateway puede habilitar explícitamente
la aprobación automática del emparejamiento inicial de Node desde CIDR de confianza:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Esto está deshabilitado de forma predeterminada. Solo se aplica al emparejamiento nuevo con `role: node`
sin ámbitos solicitados. Los clientes de operador/navegador, Control UI, WebChat y las actualizaciones de rol,
ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

Si el Node reintenta el emparejamiento con detalles de autenticación cambiados (rol/ámbitos/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

El host Node almacena su id de Node, token, nombre visible e información de conexión del gateway en
`~/.openclaw/node.json`.

## Aprobaciones de ejecución

`system.run` está controlado por aprobaciones de ejecución locales:

- `~/.openclaw/exec-approvals.json`
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para la ejecución async aprobada en Node, OpenClaw prepara un `systemRunPlan`
canónico antes de solicitar confirmación. El posterior reenvío aprobado de `system.run` reutiliza ese
plan almacenado, por lo que las ediciones a los campos de comando/cwd/sesión después de que se haya creado la solicitud de aprobación
se rechazan en lugar de cambiar lo que ejecuta el Node.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodes](/es/nodes)
