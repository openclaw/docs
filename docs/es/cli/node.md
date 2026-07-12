---
read_when:
    - Ejecución del host de Node sin interfaz gráfica
    - Emparejar un Node que no sea macOS para system.run
summary: Referencia de la CLI para `openclaw node` (host de Node sin interfaz gráfica)
title: Node
x-i18n:
    generated_at: "2026-07-12T21:23:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c350655e902f36ecf578c98edf0583ee6621dea6b916cc8da08c35673fef8e49
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Ejecuta un **host de Node sin interfaz gráfica** que se conecta al WebSocket del Gateway y expone
`system.run` / `system.which` en esta máquina.

En macOS, la aplicación de la barra de menús ya integra este entorno de ejecución del host de Node en su propia
conexión de Node y añade capacidades nativas de Mac. Usa `openclaw node run` en un
Mac solo cuando quieras intencionadamente un Node sin interfaz gráfica y sin la aplicación. Ejecutar
ambos crea dos identidades de Node para la misma máquina.

## ¿Por qué usar un host de Node?

Usa un host de Node cuando quieras que los agentes **ejecuten comandos en otras máquinas** de tu
red sin instalar en ellas una aplicación complementaria completa de macOS.

Casos de uso habituales:

- Ejecutar comandos en equipos Linux/Windows remotos (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener la ejecución **aislada** en el Gateway, pero delegar las ejecuciones aprobadas en otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz gráfica para nodos de automatización o CI.

La ejecución sigue protegida mediante **aprobaciones de ejecución** y listas de permitidos por agente en el
host de Node, de modo que puedes mantener el acceso a los comandos limitado y explícito.

`openclaw node run` puede publicar herramientas respaldadas por plugins o MCP después de conectarse.
El Gateway confía de forma predeterminada en los descriptores del Node emparejado, pero exige que
el comando de cada descriptor permanezca dentro de la superficie de comandos aprobada del Node. El
agente ve cada descriptor aceptado como una herramienta de plugin normal, pero la ejecución sigue
pasando por `node.invoke`, por lo que desconectar el Node elimina la herramienta de las nuevas
ejecuciones de agentes. Los operadores del Gateway pueden deshabilitar la publicación con
`gateway.nodes.pluginTools.enabled: false`.

Para las herramientas MCP declarativas, añade la estructura normal de servidor MCP en
`nodeHost.mcp.servers` en el archivo `openclaw.json` de la máquina del Node y, después, reinicia el
host de Node. El Node declara la familia de comandos `mcp.tools.call.v1`, sujeta a aprobación,
y publica las herramientas indicadas después de conectarse; cambiar posteriormente la lista de servidores
no requiere volver a emparejar. Consulta
[Servidores MCP alojados en Nodes](/es/nodes#node-hosted-mcp-servers).

## Proxy del navegador (sin configuración)

Los hosts de Node anuncian automáticamente un proxy del navegador si `browser.enabled` no está
deshabilitado en el Node. Esto permite que el agente use la automatización del navegador en ese Node
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal de perfiles del navegador del Node. Si
configuras `nodeHost.browserProxy.allowProfiles`, el proxy se vuelve restrictivo:
se rechaza el uso de perfiles que no estén en la lista de permitidos y se bloquean mediante el proxy
las rutas de creación y eliminación de perfiles persistentes.

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

## Ejecutar (en primer plano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host del WebSocket del Gateway (valor predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (valor predeterminado: `18789`)
- `--context-path <path>`: ruta de contexto del WebSocket del Gateway (p. ej., `/openclaw-gw`). Se añade a la URL del WebSocket.
- `--tls`: usar TLS para la conexión con el Gateway
- `--no-tls`: forzar una conexión de texto sin cifrar con el Gateway incluso cuando la configuración local del Gateway habilite TLS
- `--tls-fingerprint <sha256>`: huella digital esperada del certificado TLS (sha256)
- `--node-id <id>`: sustituir el identificador de instancia del cliente heredado almacenado en `node.json` (no restablece el emparejamiento)
- `--display-name <name>`: sustituir el nombre para mostrar del Node

## Autenticación del Gateway para el host de Node

`openclaw node run` y `openclaw node install` resuelven la autenticación del Gateway a partir de la configuración o las variables de entorno (los comandos de Node no tienen indicadores `--token`/`--password`):

- Primero se comprueban `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Después, se usa la configuración local como alternativa: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de Node no hereda intencionadamente `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución de la autenticación del Node falla de forma cerrada (sin que una alternativa remota oculte el error).
- En `gateway.mode=remote`, los campos del cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también son válidos según las reglas de precedencia remota.
- La resolución de autenticación del host de Node solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

Para un Node que se conecta a un Gateway `ws://` de texto sin cifrar, se aceptan
el bucle invertido, los literales de IP privada, `.local` y los hosts `*.ts.net` de Tailnet. Para otros
nombres DNS privados de confianza, configura `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sin
ello, el inicio del Node falla de forma cerrada y solicita usar `wss://`, un túnel SSH o
Tailscale. Esta es una activación opcional mediante el entorno del proceso, no una clave de configuración de
`openclaw.json`.
`openclaw node install` la conserva en el servicio supervisado del Node cuando está
presente en el entorno del comando de instalación.

## Servicio (en segundo plano)

Instala un host de Node sin interfaz gráfica como servicio de usuario (launchd en macOS, systemd en
Linux y el Programador de tareas de Windows en Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host del WebSocket del Gateway (valor predeterminado: `127.0.0.1`)
- `--port <port>`: puerto del WebSocket del Gateway (valor predeterminado: `18789`)
- `--context-path <path>`: ruta de contexto del WebSocket del Gateway (p. ej., `/openclaw-gw`). Se añade a la URL del WebSocket.
- `--tls`: usar TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: huella digital esperada del certificado TLS (sha256)
- `--node-id <id>`: sustituir el identificador de instancia del cliente heredado almacenado en `node.json` (no restablece el emparejamiento)
- `--display-name <name>`: sustituir el nombre para mostrar del Node
- `--runtime <runtime>`: entorno de ejecución del servicio (`node` o `bun`)
- `--force`: reinstalar o sobrescribir si ya está instalado

Administra el servicio:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` para ejecutar un host de Node en primer plano (sin servicio).

Los comandos del servicio aceptan `--json` para producir una salida legible por máquinas.

El host de Node reintenta dentro del proceso tras el reinicio del Gateway y los cierres de red. Si el
Gateway informa de una pausa terminal en la autenticación mediante token, contraseña o arranque, el host de Node
registra los detalles del cierre y termina con un código distinto de cero para que launchd, systemd o el Programador de tareas
puedan reiniciarlo con una configuración y credenciales actualizadas. Las pausas que requieren emparejamiento permanecen en
el flujo en primer plano para que pueda aprobarse la solicitud pendiente.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.

Cuando el host del Gateway puede conectarse mediante SSH al host de Node de forma no interactiva (mismo usuario,
clave de host de confianza), la solicitud pendiente se aprueba automáticamente: el Gateway
ejecuta `openclaw node identity --json` en el host de Node mediante SSH y la aprueba cuando
la clave del dispositivo coincide exactamente. Esta opción está habilitada de forma predeterminada; consulta
[Autoaprobación de dispositivos verificados mediante SSH](/es/gateway/pairing#ssh-verified-device-auto-approval-default)
para conocer los requisitos y cómo deshabilitarla (`gateway.nodes.pairing.sshVerify: false`).

De lo contrario, apruébala manualmente mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Inspecciona la identidad local del Node con la que el Gateway realiza la verificación:

```bash
openclaw node identity --json
```

Muestra el identificador del dispositivo y la clave pública de `identity/device.json`, y nunca
crea ni modifica archivos de identidad.

En redes de Nodes estrictamente controladas, el operador del Gateway puede habilitar explícitamente
la aprobación automática del emparejamiento inicial de Nodes desde CIDR de confianza:

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

Esta opción está deshabilitada de forma predeterminada (`autoApproveCidrs` no está configurado). Solo se aplica al
emparejamiento nuevo con `role: node`, sin ámbitos solicitados y desde una IP de cliente en la que el
Gateway confíe. Los clientes de operador o navegador, Control UI, WebChat y las actualizaciones de rol,
ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

Si el Node vuelve a intentar el emparejamiento con datos de autenticación modificados (rol, ámbitos o clave pública),
la solicitud pendiente anterior queda reemplazada y se crea un nuevo `requestId`.
Ejecuta de nuevo `openclaw devices list` antes de aprobar.

### Estado de identidad y emparejamiento

El Node sin interfaz gráfica separa su identificador de instancia de cliente heredado de la identidad firmada del dispositivo
que el Gateway usa para el emparejamiento y el enrutamiento. Estos archivos se encuentran en el
directorio de estado de OpenClaw (`~/.openclaw` de forma predeterminada, o `$OPENCLAW_STATE_DIR`
cuando se configura):

| Archivo                     | Finalidad                                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | Identificador de instancia del cliente bajo la clave heredada `nodeId`, nombre para mostrar y metadatos de conexión al Gateway. El cliente envía este valor como `instanceId`.                                 |
| `identity/device.json`      | Par de claves Ed25519 firmado e identificador del dispositivo derivado. Para las conexiones firmadas, este identificador del dispositivo es el identificador del Node enrutado y la identidad de emparejamiento. |
| `identity/device-auth.json` | Tokens de dispositivos emparejados, indexados por el identificador criptográfico del dispositivo y el rol.                                                                                                    |

`--node-id` solo cambia el identificador de instancia del cliente en `node.json`. No
cambia el identificador criptográfico del dispositivo ni borra la autenticación del emparejamiento. Del mismo modo, eliminar solo
`node.json` no restablece el emparejamiento. Para revocar y volver a emparejar un Node:

1. En el Gateway, ejecuta `openclaw nodes remove --node <id|name|ip>`.
2. En el Node, reinicia el servicio instalado con `openclaw node restart`, o
   detén y vuelve a ejecutar el comando en primer plano `openclaw node run`. Esto inicia el
   flujo de emparejamiento del dispositivo. Si `openclaw devices list` no muestra una solicitud
   y el Node informa de `AUTH_DEVICE_TOKEN_MISMATCH`, reinícialo o vuelve a ejecutarlo una vez
   más. El intento rechazado borra el token local ahora revocado; el siguiente
   intento puede solicitar el emparejamiento.
3. En el Gateway, ejecuta `openclaw devices list` y, después,
   `openclaw devices approve <deviceRequestId>`.
4. Reinicia o vuelve a ejecutar el Node. Un cliente en pausa por emparejamiento no se reanuda
   automáticamente tras la aprobación; esta reconexión crea la solicitud independiente
   de superficie de comandos.
5. En el Gateway, ejecuta `openclaw nodes pending` y, después,
   `openclaw nodes approve <nodeRequestId>`.

Los dos identificadores de solicitud son distintos. Una política de CIDR de confianza aplicable puede
aprobar automáticamente el paso de emparejamiento inicial del dispositivo; la aprobación de la superficie de comandos sigue siendo
una comprobación independiente.

Las versiones anteriores de OpenClaw podían dejar un campo heredado `token` en `node.json`.
La versión actual de OpenClaw no usa ese campo y lo elimina la próxima vez que el host de Node
guarda el archivo. Mantén privados ambos archivos de `identity/`; contienen el
par de claves del dispositivo y los tokens de autenticación.

## Aprobaciones de ejecución

`system.run` está sujeto a aprobaciones locales de ejecución:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, o
  `~/.openclaw/exec-approvals.json` cuando la variable no está configurada
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para la ejecución asíncrona aprobada en un Node, OpenClaw prepara un `systemRunPlan` canónico
antes de solicitar la aprobación. El posterior reenvío aprobado de `system.run` reutiliza ese plan
almacenado, por lo que las modificaciones de los campos de comando, directorio de trabajo o sesión después de crear la solicitud
de aprobación se rechazan en lugar de cambiar lo que ejecuta el Node.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Nodes](/es/nodes)
