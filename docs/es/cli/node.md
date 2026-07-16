---
read_when:
    - Ejecución del host de Node sin interfaz gráfica
    - Emparejar un Node que no sea macOS para `system.run`
summary: Referencia de la CLI para `openclaw node` (host de Node sin interfaz gráfica)
title: Node
x-i18n:
    generated_at: "2026-07-16T11:29:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Ejecute un **host de Node sin interfaz gráfica** que se conecte al WebSocket del Gateway y exponga
`system.run` / `system.which` en esta máquina.

En macOS, la aplicación de la barra de menús ya integra este entorno de ejecución de host de Node en su propia
conexión de Node y añade capacidades nativas de Mac. Use `openclaw node run` en un
Mac solo cuando desee intencionadamente un Node sin interfaz gráfica y sin la aplicación. Ejecutar
ambos crea dos identidades de Node para la misma máquina.

## ¿Por qué usar un host de Node?

Use un host de Node cuando quiera que los agentes **ejecuten comandos en otras máquinas** de su
red sin instalar en ellas una aplicación complementaria completa para macOS.

Casos de uso habituales:

- Ejecutar comandos en equipos Linux/Windows remotos (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener exec **aislado** en el Gateway, pero delegar las ejecuciones aprobadas a otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz gráfica para automatización o nodos de CI.

La ejecución sigue protegida por **aprobaciones de exec** y listas de permitidos por agente en el
host de Node, por lo que se puede mantener el acceso a comandos limitado y explícito.

`openclaw node run` puede publicar herramientas respaldadas por plugins o MCP después de conectarse.
El Gateway confía de forma predeterminada en los descriptores del Node emparejado, aunque exige
que el comando de cada descriptor permanezca en la superficie de comandos aprobada del Node. El
agente ve cada descriptor aceptado como una herramienta de plugin normal, pero la ejecución sigue
pasando por `node.invoke`, por lo que desconectar el Node elimina la herramienta de las nuevas
ejecuciones de agentes. Los operadores del Gateway pueden desactivar la publicación con
`gateway.nodes.pluginTools.enabled: false`.

Para las herramientas MCP declarativas, añada la estructura normal del servidor MCP en
`nodeHost.mcp.servers` dentro de `openclaw.json` en la máquina del Node y, después, reinicie el
host de Node. El Node declara la familia de comandos `mcp.tools.call.v1`, sujeta a aprobación,
y publica las herramientas enumeradas después de conectarse; cambiar posteriormente la lista de servidores
no requiere volver a emparejar. Consulte
[Servidores MCP alojados en nodos](/es/nodes#node-hosted-mcp-servers).

## Proxy del navegador (sin configuración)

Los hosts de Node anuncian automáticamente un proxy del navegador si `browser.enabled` no está
desactivado en el Node. Esto permite al agente usar la automatización del navegador en ese Node
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal de perfiles del navegador del Node. Si
establece `nodeHost.browserProxy.allowProfiles`, el proxy se vuelve restrictivo:
se rechaza la selección de perfiles que no estén en la lista de permitidos y se bloquean mediante el proxy
las rutas de creación y eliminación de perfiles persistentes.

Desactívelo en el Node si es necesario:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Ejecución (en primer plano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: Host del WebSocket del Gateway (valor predeterminado: `127.0.0.1`)
- `--port <port>`: Puerto del WebSocket del Gateway (valor predeterminado: `18789`)
- `--context-path <path>`: Ruta de contexto del WebSocket del Gateway (p. ej., `/openclaw-gw`). Se añade a la URL del WebSocket.
- `--tls`: Usar TLS para la conexión con el Gateway
- `--no-tls`: Forzar una conexión de texto sin formato con el Gateway incluso cuando la configuración local del Gateway habilita TLS
- `--tls-fingerprint <sha256>`: Huella digital esperada del certificado TLS (sha256)
- `--node-id <id>`: Sobrescribir el ID de instancia del cliente almacenado en el estado SQLite compartido (no restablece el emparejamiento)
- `--display-name <name>`: Sobrescribir el nombre para mostrar del Node

## Autenticación del Gateway para el host de Node

`openclaw node run` y `openclaw node install` resuelven la autenticación del Gateway desde la configuración o el entorno (sin indicadores `--token`/`--password` en los comandos de Node):

- Primero se comprueban `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Después, se usa como alternativa la configuración local: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host de Node no hereda deliberadamente `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se puede resolver, la resolución de la autenticación del Node falla de forma segura (sin que una alternativa remota la oculte).
- En `gateway.mode=remote`, los campos del cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también son válidos conforme a las reglas de precedencia remota.
- La resolución de autenticación del host de Node solo admite variables de entorno `OPENCLAW_GATEWAY_*`.

Para un Node que se conecta a un Gateway `ws://` de texto sin formato, se aceptan el bucle local, los literales de IP
privadas, `.local` y los hosts `*.ts.net` de Tailnet. Para otros
nombres DNS privados de confianza, establezca `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sin
ello, el inicio del Node falla de forma segura y solicita usar `wss://`, un túnel SSH o
Tailscale. Esta es una activación voluntaria mediante el entorno del proceso, no una clave de configuración
`openclaw.json`.
`openclaw node install` la conserva en el servicio de Node supervisado cuando está
presente en el entorno del comando de instalación.

## Servicio (en segundo plano)

Instale un host de Node sin interfaz gráfica como servicio de usuario (launchd en macOS, systemd en
Linux y el Programador de tareas de Windows en Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: Host del WebSocket del Gateway (valor predeterminado: `127.0.0.1`)
- `--port <port>`: Puerto del WebSocket del Gateway (valor predeterminado: `18789`)
- `--context-path <path>`: Ruta de contexto del WebSocket del Gateway (p. ej., `/openclaw-gw`). Se añade a la URL del WebSocket.
- `--tls`: Usar TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: Huella digital esperada del certificado TLS (sha256)
- `--node-id <id>`: Sobrescribir el ID de instancia del cliente almacenado en el estado SQLite compartido (no restablece el emparejamiento)
- `--display-name <name>`: Sobrescribir el nombre para mostrar del Node
- `--runtime <runtime>`: Entorno de ejecución del servicio (`node`)
- `--force`: Reinstalar o sobrescribir si ya está instalado

Administre el servicio:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Use `openclaw node run` para un host de Node en primer plano (sin servicio).

Los comandos de servicio aceptan `--json` para generar resultados legibles por máquinas.

El host de Node reintenta en el mismo proceso los reinicios del Gateway y los cierres de red. Si el
Gateway informa de una pausa terminal de autenticación por token, contraseña o arranque, el host de Node
registra los detalles del cierre y sale con un código distinto de cero para que launchd, systemd o el Programador de tareas
puedan reiniciarlo con configuración y credenciales nuevas. Las pausas que requieren emparejamiento permanecen en
el flujo en primer plano para que se pueda aprobar la solicitud pendiente.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.

Cuando el host del Gateway puede conectarse por SSH al host de Node de forma no interactiva (mismo usuario,
clave de host de confianza), la solicitud pendiente se aprueba automáticamente: el Gateway
ejecuta `openclaw node identity --json` en el host de Node mediante SSH y la aprueba si
la clave del dispositivo coincide exactamente. Esta opción está activada de forma predeterminada; consulte
[Aprobación automática de dispositivos verificada mediante SSH](/es/gateway/pairing#ssh-verified-device-auto-approval-default)
para conocer los requisitos y cómo desactivarla (`gateway.nodes.pairing.sshVerify: false`).

En caso contrario, apruébela manualmente mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Inspeccione la identidad local del Node con la que verifica el Gateway:

```bash
openclaw node identity --json
```

Muestra el ID del dispositivo y la clave pública de `identity/device.json`, y nunca
crea ni modifica archivos de identidad.

En redes de nodos estrictamente controladas, el operador del Gateway puede habilitar explícitamente
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

Esta opción está desactivada de forma predeterminada (`autoApproveCidrs` no está definido). Solo se aplica al
emparejamiento `role: node` inicial sin ámbitos solicitados, desde una IP de cliente en la que
confía el Gateway. Los clientes de operador o navegador, Control UI, WebChat y las actualizaciones de rol,
ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

Si el Node vuelve a intentar el emparejamiento con datos de autenticación modificados (rol, ámbitos o clave pública),
la solicitud pendiente anterior queda reemplazada y se crea una nueva `requestId`.
Ejecute `openclaw devices list` de nuevo antes de aprobarla.

### Estado de identidad y emparejamiento

El Node sin interfaz gráfica separa su ID de instancia del cliente de la identidad firmada del dispositivo
que el Gateway usa para el emparejamiento y el enrutamiento. Este estado reside en el directorio de estado de
OpenClaw (`~/.openclaw` de forma predeterminada, o `$OPENCLAW_STATE_DIR`
cuando se establece):

| Estado                                        | Finalidad                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | ID de instancia del cliente, nombre para mostrar y metadatos de conexión del Gateway. El cliente envía este ID como `instanceId`.                     |
| `identity/device.json`                       | Par de claves Ed25519 firmado e ID de dispositivo derivado. Para conexiones firmadas, este ID de dispositivo es el ID de Node enrutado y la identidad de emparejamiento. |
| `identity/device-auth.json`                  | Tokens de dispositivos emparejados, indexados por el ID criptográfico del dispositivo y el rol.                                                                 |

`--node-id` solo cambia el ID de instancia del cliente en el estado SQLite compartido. No
cambia el ID criptográfico del dispositivo ni borra la autenticación de emparejamiento. Migrar un
`node.json` retirado con `openclaw doctor --fix` tampoco restablece el emparejamiento. Para
revocar y volver a emparejar un Node:

1. En el Gateway, ejecute `openclaw nodes remove --node <id|name|ip>`.
2. En el Node, reinicie el servicio instalado con `openclaw node restart`, o
   detenga y vuelva a ejecutar el comando en primer plano `openclaw node run`. Esto inicia el
   flujo de emparejamiento del dispositivo. Si `openclaw devices list` no muestra una solicitud
   y el Node informa de `AUTH_DEVICE_TOKEN_MISMATCH`, reinícielo o vuelva a ejecutarlo una vez
   más. El intento rechazado elimina el token local, ahora revocado; el siguiente
   intento puede solicitar el emparejamiento.
3. En el Gateway, ejecute `openclaw devices list` y, después,
   `openclaw devices approve <deviceRequestId>`.
4. Reinicie o vuelva a ejecutar el Node de nuevo. Un cliente en pausa por emparejamiento no se reanuda
   automáticamente después de la aprobación; esta reconexión crea la solicitud independiente
   de superficie de comandos.
5. En el Gateway, ejecute `openclaw nodes pending` y, después,
   `openclaw nodes approve <nodeRequestId>`.

Los dos ID de solicitud son distintos. Una política de CIDR de confianza aplicable puede
aprobar automáticamente el paso inicial de emparejamiento del dispositivo; la aprobación de la superficie de comandos sigue siendo
una comprobación independiente.

Las versiones anteriores de OpenClaw almacenaban el estado del host de Node en `node.json` y podían dejar allí un
campo `token` obsoleto. Detenga el host de Node y ejecute `openclaw doctor --fix`
una vez; Doctor importa en SQLite los campos compatibles de identidad y conexión,
descarta el campo de token sin uso, verifica la fila y elimina el archivo retirado.
Los comandos normales de Node fallan de forma segura con esta instrucción de reparación mientras permanezcan el archivo o
una reclamación interrumpida de Doctor. Mantenga privados ambos archivos de `identity/`;
contienen el par de claves del dispositivo y los tokens de autenticación.

## Aprobaciones de exec

`system.run` está protegido por aprobaciones de exec locales:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, o
  `~/.openclaw/exec-approvals.json` cuando la variable no está definida
- [Aprobaciones de exec](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para la ejecución asíncrona aprobada en nodos, OpenClaw prepara un `systemRunPlan`
canónico antes de solicitar aprobación. El posterior reenvío aprobado de `system.run` reutiliza ese
plan almacenado, por lo que las modificaciones de los campos de comando, cwd o sesión después de crear la solicitud
de aprobación se rechazan en lugar de cambiar lo que ejecuta el Node.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
