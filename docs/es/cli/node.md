---
read_when:
    - Ejecutar el host de Node sin interfaz gráfica
    - Emparejar un nodo que no sea macOS para system.run
summary: Referencia de la CLI para `openclaw node` (host de nodo sin interfaz gráfica)
title: Node
x-i18n:
    generated_at: "2026-06-27T11:02:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Ejecuta un **host de Node sin interfaz** que se conecta al WebSocket del Gateway y expone
`system.run` / `system.which` en esta máquina.

## ¿Por qué usar un host de Node?

Usa un host de Node cuando quieras que los agentes **ejecuten comandos en otras máquinas** de tu
red sin instalar allí una app complementaria completa de macOS.

Casos de uso comunes:

- Ejecutar comandos en equipos Linux/Windows remotos (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener exec **aislado en sandbox** en el Gateway, pero delegar ejecuciones aprobadas a otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz para nodos de automatización o CI.

La ejecución sigue protegida por **aprobaciones de exec** y listas de permitidos por agente en el
host de Node, para que puedas mantener el acceso a comandos acotado y explícito.

## Proxy de navegador (sin configuración)

Los hosts de Node anuncian automáticamente un proxy de navegador si `browser.enabled` no está
deshabilitado en el Node. Esto permite que el agente use automatización de navegador en ese Node
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal de perfiles de navegador del Node. Si
configuras `nodeHost.browserProxy.allowProfiles`, el proxy se vuelve restrictivo:
se rechaza el direccionamiento a perfiles que no estén en la lista de permitidos, y las rutas de
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

- `--host <host>`: host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usar TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: sobrescribir el id del Node (borra el token de emparejamiento)
- `--display-name <name>`: sobrescribir el nombre visible del Node

## Autenticación del Gateway para el host de Node

`openclaw node run` y `openclaw node install` resuelven la autenticación del Gateway desde config/env (sin flags `--token`/`--password` en comandos de Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` se comprueban primero.
- Luego se usa la configuración local como respaldo: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de Node no hereda intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución de autenticación del Node falla de forma cerrada (sin enmascaramiento por respaldo remoto).
- En `gateway.mode=remote`, los campos de cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también son elegibles según las reglas de precedencia remota.
- La resolución de autenticación del host de Node solo respeta variables de entorno `OPENCLAW_GATEWAY_*`.

Para un Node que se conecta a un Gateway `ws://` en texto plano, se aceptan local loopback, literales de IP
privada, `.local` y hosts Tailnet `*.ts.net`. Para otros nombres
de DNS privada de confianza, configura `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sin
eso, el inicio del Node falla de forma cerrada y te pide usar `wss://`, un túnel SSH o
Tailscale. Esto es una aceptación explícita del entorno del proceso, no una clave de configuración
de `openclaw.json`.
`openclaw node install` lo conserva en el servicio supervisado del Node cuando está
presente en el entorno del comando de instalación.

## Servicio (segundo plano)

Instala un host de Node sin interfaz como servicio de usuario.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usar TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: sobrescribir el id del Node (borra el token de emparejamiento)
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

Usa `openclaw node run` para un host de Node en primer plano (sin servicio).

Los comandos de servicio aceptan `--json` para salida legible por máquina.

El host de Node reintenta el reinicio del Gateway y los cierres de red dentro del proceso. Si el
Gateway informa una pausa terminal de autenticación por token/contraseña/bootstrap, el host de Node
registra el detalle de cierre y sale con código distinto de cero para que launchd/systemd pueda reiniciarlo con
configuración y credenciales actualizadas. Las pausas que requieren emparejamiento permanecen en el flujo
de primer plano para que la solicitud pendiente pueda aprobarse.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.
Apruébala con:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

En redes de Nodes estrechamente controladas, el operador del Gateway puede optar explícitamente por
aprobar automáticamente el primer emparejamiento de Node desde CIDR de confianza:

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

Esto está deshabilitado de forma predeterminada. Solo se aplica a emparejamientos nuevos de `role: node` sin
alcances solicitados. Los clientes de operador/navegador, Control UI, WebChat y las actualizaciones de rol,
alcance, metadatos o clave pública siguen requiriendo aprobación manual.

Si el Node reintenta el emparejamiento con detalles de autenticación modificados (rol/alcances/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

El host de Node almacena su id de Node, token, nombre visible e información de conexión al Gateway en
`~/.openclaw/node.json`.

## Aprobaciones de exec

`system.run` está protegido por aprobaciones locales de exec:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, o
  `~/.openclaw/exec-approvals.json` cuando la variable no está definida
- [Aprobaciones de exec](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para exec asíncrono aprobado en Node, OpenClaw prepara un `systemRunPlan` canónico
antes de solicitar aprobación. El reenvío aprobado posterior de `system.run` reutiliza ese plan
almacenado, por lo que los cambios en campos de comando/cwd/sesión después de que se creó la solicitud
de aprobación se rechazan en lugar de cambiar lo que ejecuta el Node.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodes](/es/nodes)
