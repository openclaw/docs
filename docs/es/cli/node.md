---
read_when:
    - Ejecución del host Node sin interfaz gráfica
    - Emparejar un nodo que no sea macOS para system.run
summary: Referencia de CLI para `openclaw node` (host Node sin interfaz gráfica)
title: Node
x-i18n:
    generated_at: "2026-07-01T12:47:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Ejecuta un **host de nodo sin interfaz gráfica** que se conecta al WebSocket del Gateway y expone
`system.run` / `system.which` en esta máquina.

## ¿Por qué usar un host de nodo?

Usa un host de nodo cuando quieras que los agentes **ejecuten comandos en otras máquinas** de tu
red sin instalar allí una aplicación complementaria completa para macOS.

Casos de uso comunes:

- Ejecutar comandos en equipos Linux/Windows remotos (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener exec **en sandbox** en el Gateway, pero delegar ejecuciones aprobadas a otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz gráfica para nodos de automatización o CI.

La ejecución sigue estando protegida por **aprobaciones de exec** y listas de permitidos por agente en el
host de nodo, de modo que puedes mantener el acceso a comandos acotado y explícito.

## Proxy de navegador (sin configuración)

Los hosts de nodo anuncian automáticamente un proxy de navegador si `browser.enabled` no está
deshabilitado en el nodo. Esto permite que el agente use automatización de navegador en ese nodo
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal del perfil de navegador del nodo. Si
configuras `nodeHost.browserProxy.allowProfiles`, el proxy se vuelve restrictivo:
se rechaza la selección de perfiles que no estén en la lista de permitidos, y las rutas de
creación/eliminación de perfiles persistentes se bloquean a través del proxy.

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
- `--context-path <path>`: ruta de contexto del WebSocket del Gateway (p. ej., `/openclaw-gw`). Se añade a la URL del WebSocket.
- `--tls`: usar TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: sobrescribir el id del nodo (borra el token de emparejamiento)
- `--display-name <name>`: sobrescribir el nombre visible del nodo

## Autenticación del Gateway para el host de nodo

`openclaw node run` y `openclaw node install` resuelven la autenticación del Gateway desde config/env (sin flags `--token`/`--password` en comandos de nodo):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` se comprueban primero.
- Luego, alternativa de configuración local: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de nodo no hereda intencionadamente `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución de autenticación del nodo falla de forma cerrada (sin enmascaramiento por alternativa remota).
- En `gateway.mode=remote`, los campos del cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también son elegibles según las reglas de precedencia remota.
- La resolución de autenticación del host de nodo solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

Para un nodo que se conecta a un Gateway `ws://` sin cifrar, se aceptan loopback, literales de IP
privada, `.local` y hosts Tailnet `*.ts.net`. Para otros nombres
DNS privados de confianza, configura `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sin
ello, el arranque del nodo falla de forma cerrada y te pide usar `wss://`, un túnel SSH o
Tailscale. Esta es una opción explícita del entorno del proceso, no una clave de configuración de `openclaw.json`.
`openclaw node install` la conserva en el servicio de nodo supervisado cuando está
presente en el entorno del comando de instalación.

## Servicio (segundo plano)

Instala un host de nodo sin interfaz gráfica como servicio de usuario.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host del WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (predeterminado: `18789`)
- `--context-path <path>`: ruta de contexto del WebSocket del Gateway (p. ej., `/openclaw-gw`). Se añade a la URL del WebSocket.
- `--tls`: usar TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: sobrescribir el id del nodo (borra el token de emparejamiento)
- `--display-name <name>`: sobrescribir el nombre visible del nodo
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

El host de nodo reintenta dentro del proceso los reinicios del Gateway y los cierres de red. Si el
Gateway informa una pausa terminal de autenticación por token/contraseña/bootstrap, el host de nodo
registra el detalle del cierre y sale con código distinto de cero para que launchd/systemd pueda reiniciarlo con
configuración y credenciales actualizadas. Las pausas que requieren emparejamiento permanecen en el flujo de
primer plano para que la solicitud pendiente pueda aprobarse.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.
Apruébala mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

En redes de nodos estrechamente controladas, el operador del Gateway puede optar explícitamente por
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

Esto está deshabilitado de forma predeterminada. Solo se aplica al emparejamiento nuevo con `role: node` y
sin scopes solicitados. Los clientes de operador/navegador, Control UI, WebChat, y las actualizaciones de rol,
scope, metadatos o clave pública siguen requiriendo aprobación manual.

Si el nodo reintenta el emparejamiento con detalles de autenticación modificados (rol/scopes/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

El host de nodo almacena su id de nodo, token, nombre visible e información de conexión al Gateway en
`~/.openclaw/node.json`.

## Aprobaciones de exec

`system.run` está controlado por aprobaciones locales de exec:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, o
  `~/.openclaw/exec-approvals.json` cuando la variable no está definida
- [Aprobaciones de exec](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para exec de nodo asíncrono aprobado, OpenClaw prepara un `systemRunPlan` canónico
antes de solicitar confirmación. El reenvío posterior aprobado de `system.run` reutiliza ese
plan almacenado, por lo que las ediciones en los campos command/cwd/session después de que se haya
creado la solicitud de aprobación se rechazan en lugar de cambiar lo que ejecuta el nodo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodos](/es/nodes)
