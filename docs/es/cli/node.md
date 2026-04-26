---
read_when:
    - Ejecutando el host Node sin interfaz
    - Emparejar un Node que no sea macOS para `system.run`
summary: Referencia de CLI para `openclaw node` (host Node sin interfaz)
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Ejecuta un **host Node sin interfaz** que se conecta al WebSocket del Gateway y expone
`system.run` / `system.which` en esta máquina.

## ¿Por qué usar un host Node?

Usa un host Node cuando quieras que los agentes **ejecuten comandos en otras máquinas** de tu
red sin instalar allí una app complementaria completa para macOS.

Casos de uso comunes:

- Ejecutar comandos en máquinas Linux/Windows remotas (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener exec **en sandbox** en el Gateway, pero delegar ejecuciones aprobadas a otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz para automatización o nodos de CI.

La ejecución sigue estando protegida por **aprobaciones de ejecución** y listas de permitidos por agente en el
host Node, para que puedas mantener el acceso a comandos acotado y explícito.

## Proxy del navegador (configuración cero)

Los hosts Node anuncian automáticamente un proxy del navegador si `browser.enabled` no está
deshabilitado en el nodo. Esto permite que el agente use automatización del navegador en ese nodo
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal del perfil de navegador del nodo. Si
estableces `nodeHost.browserProxy.allowProfiles`, el proxy pasa a ser restrictivo:
se rechaza la selección de perfiles no incluidos en la lista de permitidos y se bloquean
las rutas persistentes de creación/eliminación de perfiles a través del proxy.

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

## Ejecutar (primer plano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usa TLS para la conexión al Gateway
- `--tls-fingerprint <sha256>`: huella digital esperada del certificado TLS (sha256)
- `--node-id <id>`: sobrescribe el id del nodo (borra el token de emparejamiento)
- `--display-name <name>`: sobrescribe el nombre visible del nodo

## Autenticación del Gateway para host Node

`openclaw node run` y `openclaw node install` resuelven la autenticación del Gateway desde config/env (sin flags `--token`/`--password` en los comandos de nodo):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` se comprueban primero.
- Luego se usa el respaldo de configuración local: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host Node intencionalmente no hereda `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución de autenticación del nodo falla de forma cerrada (sin enmascaramiento por respaldo remoto).
- En `gateway.mode=remote`, los campos del cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también pueden usarse según las reglas de precedencia remota.
- La resolución de autenticación del host Node solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

Para un nodo que se conecte a un Gateway `ws://` no loopback en una red privada de confianza,
establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sin ello, el inicio del nodo falla de forma cerrada
y te pide usar `wss://`, un túnel SSH o Tailscale.
Esta es una activación por entorno de proceso, no una clave de configuración de `openclaw.json`.
`openclaw node install` la conserva en el servicio supervisado del nodo cuando está
presente en el entorno del comando de instalación.

## Servicio (segundo plano)

Instala un host Node sin interfaz como servicio de usuario.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usa TLS para la conexión al Gateway
- `--tls-fingerprint <sha256>`: huella digital esperada del certificado TLS (sha256)
- `--node-id <id>`: sobrescribe el id del nodo (borra el token de emparejamiento)
- `--display-name <name>`: sobrescribe el nombre visible del nodo
- `--runtime <runtime>`: entorno de ejecución del servicio (`node` o `bun`)
- `--force`: reinstala/sobrescribe si ya está instalado

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

El host Node reintenta internamente los reinicios del Gateway y los cierres de red. Si el
Gateway informa una pausa terminal de autenticación por token/contraseña/bootstrap, el host Node
registra el detalle del cierre y sale con valor distinto de cero para que launchd/systemd pueda reiniciarlo con
configuración y credenciales nuevas. Las pausas que requieren emparejamiento se mantienen en el flujo
de primer plano para que la solicitud pendiente pueda aprobarse.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.
Apruébala mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

En redes de nodos muy controladas, el operador del Gateway puede activar explícitamente
la aprobación automática del primer emparejamiento de nodos desde CIDR de confianza:

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

Esto está deshabilitado de forma predeterminada. Solo se aplica al emparejamiento inicial `role: node` sin
alcances solicitados. Los clientes operator/browser, Control UI, WebChat y las ampliaciones de rol,
alcance, metadatos o clave pública siguen requiriendo aprobación manual.

Si el nodo vuelve a intentar el emparejamiento con detalles de autenticación cambiados (rol/alcances/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Vuelve a ejecutar `openclaw devices list` antes de aprobar.

El host Node almacena su id de nodo, token, nombre visible e información de conexión al gateway en
`~/.openclaw/node.json`.

## Aprobaciones de ejecución

`system.run` está protegido por aprobaciones locales de ejecución:

- `~/.openclaw/exec-approvals.json`
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para ejecución asíncrona aprobada en Node, OpenClaw prepara un `systemRunPlan`
canónico antes de solicitar aprobación. El reenvío `system.run` aprobado posterior reutiliza ese
plan almacenado, por lo que las ediciones de los campos command/cwd/session después de que se haya
creado la solicitud de aprobación se rechazan en lugar de cambiar lo que ejecuta el nodo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodes](/es/nodes)
