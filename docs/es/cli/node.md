---
read_when:
    - Ejecutar el host Node sin interfaz gráfica
    - Emparejar un nodo que no sea macOS para system.run
summary: Referencia de CLI para `openclaw node` (host de nodo sin interfaz gráfica)
title: Node
x-i18n:
    generated_at: "2026-07-05T11:10:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6bb4efe3852bcbb7802acd882d698c44b62579ca8756c8e50473ce1aa97cad1b
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Ejecuta un **host de nodo sin interfaz gráfica** que se conecta al WebSocket del Gateway y expone
`system.run` / `system.which` en esta máquina.

## ¿Por qué usar un host de nodo?

Usa un host de nodo cuando quieras que los agentes **ejecuten comandos en otras máquinas** de tu
red sin instalar allí una app complementaria completa de macOS.

Casos de uso comunes:

- Ejecutar comandos en equipos Linux/Windows remotos (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener exec **aislado en sandbox** en el gateway, pero delegar ejecuciones aprobadas a otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz gráfica para automatización o nodos de CI.

La ejecución sigue protegida por **aprobaciones de exec** y listas de permitidos por agente en el
host de nodo, por lo que puedes mantener el acceso a comandos acotado y explícito.

## Proxy de navegador (sin configuración)

Los hosts de nodo anuncian automáticamente un proxy de navegador si `browser.enabled` no está
deshabilitado en el nodo. Esto permite que el agente use automatización de navegador en ese nodo
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal del perfil de navegador del nodo. Si
estableces `nodeHost.browserProxy.allowProfiles`, el proxy se vuelve restrictivo:
se rechaza el uso de perfiles que no estén en la lista de permitidos, y las rutas persistentes de
creación/eliminación de perfiles se bloquean a través del proxy.

Deshabilítalo en el nodo si es necesario:

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
- `--context-path <path>`: ruta de contexto del WebSocket del Gateway (p. ej., `/openclaw-gw`). Se añade a la URL de WebSocket.
- `--tls`: usar TLS para la conexión del gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: anular el id del nodo (borra el token de emparejamiento)
- `--display-name <name>`: anular el nombre visible del nodo

## Autenticación del Gateway para host de nodo

`openclaw node run` y `openclaw node install` resuelven la autenticación del gateway desde config/env (sin flags `--token`/`--password` en los comandos de nodo):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` se comprueban primero.
- Después, respaldo de configuración local: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de nodo no hereda intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución de autenticación del nodo falla cerrada (sin enmascaramiento por respaldo remoto).
- En `gateway.mode=remote`, los campos de cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también son elegibles según las reglas de precedencia remota.
- La resolución de autenticación del host de nodo solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

Para un nodo que se conecta a un Gateway `ws://` en texto claro, se aceptan loopback, literales de IP privada,
`.local` y hosts Tailnet `*.ts.net`. Para otros nombres DNS privados
de confianza, establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sin
ello, el inicio del nodo falla cerrado y te pide usar `wss://`, un túnel SSH o
Tailscale. Esta es una opción explícita de entorno de proceso, no una clave de configuración de `openclaw.json`.
`openclaw node install` la conserva en el servicio de nodo supervisado cuando está
presente en el entorno del comando de instalación.

## Servicio (segundo plano)

Instala un host de nodo sin interfaz gráfica como servicio de usuario (launchd en macOS, systemd en
Linux, Programador de tareas de Windows en Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--context-path <path>`: ruta de contexto del WebSocket del Gateway (p. ej., `/openclaw-gw`). Se añade a la URL de WebSocket.
- `--tls`: usar TLS para la conexión del gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: anular el id del nodo (borra el token de emparejamiento)
- `--display-name <name>`: anular el nombre visible del nodo
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

Usa `openclaw node run` para un host de nodo en primer plano (sin servicio).

Los comandos de servicio aceptan `--json` para salida legible por máquina.

El host de nodo reintenta los reinicios del Gateway y los cierres de red dentro del proceso. Si el
Gateway informa una pausa terminal de autenticación por token/contraseña/bootstrap, el host de nodo
registra el detalle del cierre y sale con estado distinto de cero para que launchd/systemd/Programador de tareas
pueda reiniciarlo con configuración y credenciales actualizadas. Las pausas que requieren emparejamiento permanecen en
el flujo de primer plano para que la solicitud pendiente pueda aprobarse.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.
Apruébala mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

En redes de nodos estrictamente controladas, el operador del Gateway puede optar explícitamente por
aprobar automáticamente el emparejamiento inicial de nodos desde CIDR de confianza:

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

Esto está deshabilitado de forma predeterminada (`autoApproveCidrs` no está establecido). Solo se aplica al
emparejamiento nuevo con `role: node` sin ámbitos solicitados, desde una IP de cliente en la que el
Gateway confía. Los clientes de operador/navegador, Control UI, WebChat y las actualizaciones de rol,
ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

Si el nodo reintenta el emparejamiento con detalles de autenticación modificados (rol/ámbitos/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

El host de nodo almacena su id de nodo, token, nombre visible e información de conexión del gateway
en `node.json` en el directorio de estado de OpenClaw (`~/.openclaw` de forma predeterminada,
o `$OPENCLAW_STATE_DIR` cuando se establece).

## Aprobaciones de exec

`system.run` está protegido por aprobaciones de exec locales:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, o
  `~/.openclaw/exec-approvals.json` cuando la variable no está establecida
- [Aprobaciones de exec](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para exec de nodo asíncrono aprobado, OpenClaw prepara un `systemRunPlan` canónico
antes de solicitar aprobación. El reenvío posterior aprobado de `system.run` reutiliza ese
plan almacenado, por lo que las ediciones a los campos command/cwd/session después de que se haya
creado la solicitud de aprobación se rechazan en lugar de cambiar lo que ejecuta el nodo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodos](/es/nodes)
