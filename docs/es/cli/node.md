---
read_when:
    - Ejecución del host de Node sin interfaz gráfica
    - Emparejamiento de un Node que no usa macOS para system.run
summary: Referencia de la CLI para `openclaw node` (host de Node sin interfaz gráfica)
title: Node
x-i18n:
    generated_at: "2026-07-22T20:05:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 341539d05545ddcbf6175c34af7dca49332ba55906283b9933b9c9b1732c0e4d
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Ejecute un **host de Node sin interfaz gráfica** que se conecte al WebSocket del Gateway y exponga
`system.run` / `system.which` en esta máquina.

En macOS, la aplicación de la barra de menús ya integra este entorno de ejecución del host de Node en su propia
conexión de Node y añade capacidades nativas de Mac. Use `openclaw node run` en un
Mac solo cuando quiera intencionadamente un Node sin interfaz gráfica y sin la aplicación. Ejecutar
ambos crea dos identidades de Node para la misma máquina.

## ¿Por qué usar un host de Node?

Use un host de Node cuando quiera que los agentes **ejecuten comandos en otras máquinas** de su
red sin instalar allí una aplicación complementaria completa para macOS.

Casos de uso habituales:

- Ejecutar comandos en equipos Linux/Windows remotos (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener exec **aislado** en el Gateway, pero delegar las ejecuciones aprobadas en otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz gráfica para automatizaciones o Nodes de CI.

La ejecución sigue estando protegida por **aprobaciones de exec** y listas de permitidos por agente en el
host de Node, de modo que el acceso a los comandos pueda mantenerse limitado y explícito.

`openclaw node run` puede publicar herramientas respaldadas por plugins o MCP después de conectarse.
El Gateway confía de forma predeterminada en los descriptores del Node emparejado, aunque exige
que el comando de cada descriptor permanezca en la superficie de comandos aprobada del Node. El
agente ve cada descriptor aceptado como una herramienta de plugin normal, pero la ejecución sigue
pasando por `node.invoke`, por lo que desconectar el Node elimina la herramienta de las nuevas
ejecuciones de agentes. Los operadores del Gateway pueden desactivar la publicación con
`gateway.nodes.pluginTools.enabled: false`.

Para las herramientas MCP declarativas, añada la estructura habitual del servidor MCP en
`nodeHost.mcp.servers` de `openclaw.json` en la máquina del Node y, a continuación, reinicie el
host de Node. El Node declara la familia de comandos `mcp.tools.call.v1`, sujeta a aprobación,
y publica las herramientas enumeradas después de conectarse; modificar posteriormente la lista de servidores
no requiere volver a emparejar. Consulte
[Servidores MCP alojados en Nodes](/es/nodes#node-hosted-mcp-servers).

## Proxy del navegador (sin configuración)

Los hosts de Node anuncian automáticamente un proxy del navegador si `browser.enabled` no está
desactivado en el Node. Esto permite que el agente use la automatización del navegador en ese Node
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie habitual de perfiles del navegador del Node. Si
establece `nodeHost.browserProxy.allowProfiles`, el proxy pasa a ser restrictivo:
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
- `--no-tls`: Forzar una conexión con el Gateway en texto sin cifrar aunque la configuración local del Gateway habilite TLS
- `--tls-fingerprint <sha256>`: Huella digital esperada del certificado TLS (sha256)
- `--node-id <id>`: Sustituir el ID de instancia del cliente almacenado en el estado SQLite compartido (no restablece el emparejamiento)
- `--display-name <name>`: Sustituir el nombre para mostrar del Node

## Autenticación del Gateway para el host de Node

`openclaw node run` y `openclaw node install` resuelven la autenticación del Gateway desde la configuración o las variables de entorno (sin indicadores `--token`/`--password` en los comandos del Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` se comprueban primero.
- Después se usa la configuración local como alternativa: `gateway.auth.token` / `gateway.auth.password`.
- En el modo local, el host de Node no hereda intencionadamente `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución de autenticación del Node falla de forma cerrada (sin que una alternativa remota lo oculte).
- En `gateway.mode=remote`, los campos del cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también son válidos según las reglas de precedencia remota.
- La resolución de autenticación del host de Node solo respeta las variables de entorno `OPENCLAW_GATEWAY_*`.

Para un Node que se conecte a un Gateway `ws://` en texto sin cifrar, se aceptan el bucle invertido, los literales de
IP privada, `.local` y los hosts `*.ts.net` de Tailnet. Para otros
nombres DNS privados de confianza, establezca `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; sin
esta opción, el inicio del Node falla de forma cerrada y solicita usar `wss://`, un túnel SSH o
Tailscale. Esta es una opción de participación del entorno del proceso, no una clave de configuración
`openclaw.json`.
`openclaw node install` la conserva en el servicio supervisado del Node cuando está
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
- `--node-id <id>`: Sustituir el ID de instancia del cliente almacenado en el estado SQLite compartido (no restablece el emparejamiento)
- `--display-name <name>`: Sustituir el nombre para mostrar del Node
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

Los comandos del servicio aceptan `--json` para generar una salida legible por máquinas.

El host de Node reintenta dentro del proceso cuando el Gateway se reinicia o la red cierra la conexión. Si el
Gateway informa de una pausa terminal de autenticación mediante token, contraseña o arranque, el host de Node
registra los detalles del cierre y finaliza con un código distinto de cero para que launchd, systemd o el Programador de tareas
puedan reiniciarlo con una configuración y unas credenciales actualizadas. Las pausas que requieren emparejamiento permanecen en
el flujo en primer plano para que pueda aprobarse la solicitud pendiente.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.

Cuando el host del Gateway puede conectarse mediante SSH al host de Node de forma no interactiva (mismo usuario,
clave del host de confianza), la solicitud pendiente se aprueba automáticamente: el Gateway
ejecuta `openclaw node identity --json` en el host de Node mediante SSH y la aprueba cuando
la clave del dispositivo coincide exactamente. Esta opción está habilitada de forma predeterminada; consulte
[Aprobación automática de dispositivos verificada mediante SSH](/es/gateway/pairing#ssh-verified-device-auto-approval-default)
para conocer los requisitos y cómo desactivarla (`gateway.nodes.pairing.sshVerify: false`).

De lo contrario, apruébela manualmente mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Inspeccione la identidad local del Node que verifica el Gateway:

```bash
openclaw node identity --json
```

Muestra el ID del dispositivo y la clave pública de la fila `primary` de
`state/openclaw.sqlite`, y nunca crea la base de datos ni una identidad nueva.

En redes de Nodes estrictamente controladas, el operador del Gateway puede habilitar explícitamente
la aprobación automática del primer emparejamiento del Node desde CIDR de confianza:

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
emparejamiento `role: node` nuevo, sin ámbitos solicitados y desde una IP de cliente en la que
confíe el Gateway. Los clientes de operadores o navegadores, Control UI, WebChat y las actualizaciones de
rol, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

Si el Node vuelve a intentar el emparejamiento con datos de autenticación modificados (rol, ámbitos o clave pública),
la solicitud pendiente anterior queda sustituida y se crea una nueva `requestId`.
Ejecute `openclaw devices list` de nuevo antes de aprobarla.

### Estado de identidad y emparejamiento

El Node sin interfaz gráfica separa su ID de instancia de cliente de la identidad firmada del dispositivo
que el Gateway usa para el emparejamiento y el enrutamiento. Este estado reside en el
directorio de estado de OpenClaw (`~/.openclaw` de forma predeterminada, o `$OPENCLAW_STATE_DIR`
cuando está definido):

| Estado                                                    | Finalidad                                                                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`)             | ID de instancia del cliente, nombre para mostrar y metadatos de conexión con el Gateway. El cliente envía este ID como `instanceId`.                     |
| `state/openclaw.sqlite` (`device_identities`, `primary`) | Par de claves Ed25519 firmado e ID de dispositivo derivado. Para las conexiones firmadas, este ID de dispositivo es el ID del Node enrutado y la identidad de emparejamiento. |
| `state/openclaw.sqlite` (`device_auth_tokens`)           | Tokens de dispositivos emparejados, indexados por ID criptográfico del dispositivo y rol.                                                                 |

`--node-id` cambia únicamente el ID de instancia del cliente en el estado SQLite compartido. No
cambia el ID criptográfico del dispositivo ni borra la autenticación del emparejamiento. Del mismo modo, migrar un
`node.json` retirado con `openclaw doctor --fix` no restablece el emparejamiento. Para
revocar y volver a emparejar un Node:

1. En el Gateway, ejecute `openclaw nodes remove --node <id|name|ip>`.
2. En el Node, reinicie el servicio instalado con `openclaw node restart`, o
   detenga y vuelva a ejecutar el comando en primer plano `openclaw node run`. Esto inicia el
   flujo de emparejamiento del dispositivo. Si `openclaw devices list` no muestra ninguna solicitud
   y el Node informa de `AUTH_DEVICE_TOKEN_MISMATCH`, reinícielo o vuelva a ejecutarlo una vez
   más. El intento rechazado borra el token local ya revocado; el siguiente
   intento puede solicitar el emparejamiento.
3. En el Gateway, ejecute `openclaw devices list` y, a continuación,
   `openclaw devices approve <deviceRequestId>`.
4. Reinicie o vuelva a ejecutar el Node. Un cliente en pausa por emparejamiento no se reanuda
   automáticamente tras la aprobación; esta reconexión crea la solicitud independiente
   de superficie de comandos.
5. En el Gateway, ejecute `openclaw nodes pending` y, a continuación,
   `openclaw nodes approve <nodeRequestId>`.

Los dos ID de solicitud son distintos. Una política aplicable de CIDR de confianza puede
aprobar automáticamente el primer paso de emparejamiento del dispositivo; la aprobación de la superficie de comandos sigue siendo
una comprobación independiente.

Las versiones anteriores de OpenClaw almacenaban el estado del host de Node en `node.json`, la identidad
firmada en `identity/device.json` y la autenticación emparejada en
`identity/device-auth.json`. Detenga el host de Node y ejecute
`openclaw doctor --fix` una vez; Doctor reclama cada origen retirado, lo valida,
importa y verifica la fila SQLite canónica y, a continuación, elimina el archivo antiguo. Los comandos normales
del Node fallan de forma cerrada y muestran esta instrucción de reparación mientras permanezca algún archivo retirado
o una reclamación de Doctor interrumpida. Mantenga `state/openclaw.sqlite` en privado;
contiene el par de claves del dispositivo y los tokens de autenticación.

## Aprobaciones de exec

`system.run` está sujeto a las aprobaciones locales de exec:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, o
  `~/.openclaw/exec-approvals.json` cuando la variable no está definida
- [Aprobaciones de exec](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para una ejecución asíncrona aprobada en el Node, OpenClaw prepara un `systemRunPlan`
canónico antes de solicitar la aprobación. El reenvío posterior y aprobado de `system.run` reutiliza ese
plan almacenado, de modo que se rechazan las modificaciones de los campos de comando, cwd o sesión realizadas después de crear
la solicitud de aprobación, en lugar de cambiar lo que ejecuta el Node.

## Temas relacionados

- [Referencia de la CLI](/es/cli)
- [Nodes](/es/nodes)
