---
read_when:
    - Ejecución o solución de problemas de configuraciones remotas del Gateway
summary: Acceso remoto mediante Gateway WS, túneles SSH y redes tailnet
title: Acceso remoto
x-i18n:
    generated_at: "2026-07-11T23:07:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw ejecuta un Gateway (el principal) en un host y conecta todos los clientes a él. El Gateway administra las sesiones, los perfiles de autenticación, los canales y el estado; todo lo demás es un cliente.

- **Operadores** (usted o la aplicación de macOS): una conexión WebSocket directa por LAN/tailnet es la opción más sencilla cuando se puede acceder al Gateway; el túnel SSH es la alternativa universal.
- **Nodes** (iOS/Android y otros dispositivos): se conectan al **WebSocket** del Gateway (mediante LAN/tailnet o un túnel SSH).

## La idea central

De forma predeterminada, el WebSocket del Gateway se vincula a **loopback** en el puerto `18789` (`gateway.port`). Para usarlo de forma remota, expóngalo mediante Tailscale Serve o una vinculación de LAN/tailnet de confianza, o reenvíe el puerto de loopback mediante SSH.

## Opciones de topología

| Configuración                             | Dónde se ejecuta el Gateway                                                                                    | Ideal para                                                                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway siempre activo en su tailnet      | Host persistente (VPS o servidor doméstico), accesible mediante Tailscale o SSH                                | Portátiles que entran en reposo con frecuencia, pero necesitan que el agente esté siempre activo. Consulte [exe.dev](/es/install/exe-dev) (máquina virtual sencilla) o [Hetzner](/es/install/hetzner) (VPS de producción). |
| Equipo de escritorio doméstico            | Equipo de escritorio; el portátil se conecta de forma remota mediante el modo remoto de la aplicación de macOS (Ajustes → Conexión → OpenClaw se ejecuta) | Mantener el agente en hardware que permanece encendido. Guía operativa: [acceso remoto de macOS](/es/platforms/mac/remote). |
| Portátil                                   | Portátil expuesto de forma segura mediante un túnel SSH o Tailscale Serve (mantenga `gateway.bind: "loopback"`) | Configuraciones de una sola máquina. Consulte [Tailscale](/es/gateway/tailscale) y [Web](/es/web).                                                         |

Para las configuraciones de Gateway siempre activo y portátil, es preferible mantener `gateway.bind: "loopback"` y usar **Tailscale Serve** para la interfaz de control, o una vinculación de LAN/tailnet de confianza con `gateway.remote.transport: "direct"`. El túnel SSH es la alternativa que funciona desde cualquier máquina.

## Flujo de comandos (qué se ejecuta y dónde)

Un Gateway administra el estado y los canales; los Nodes son periféricos. Ejemplo (mensaje de Telegram dirigido a una herramienta de Node):

1. El mensaje de Telegram llega al **Gateway**.
2. El Gateway ejecuta el **agente**, que decide si debe llamar a una herramienta de Node.
3. El Gateway llama al **Node** mediante el WebSocket del Gateway (RPC `node.invoke`).
4. El Node devuelve el resultado; el Gateway responde a Telegram.

Los Nodes no ejecutan el servicio Gateway. Solo debe ejecutarse un Gateway por host, salvo que ejecute intencionadamente perfiles aislados (consulte [Varios gateways](/es/gateway/multiple-gateways)). El «modo Node» de la aplicación de macOS es simplemente un cliente Node que usa el WebSocket del Gateway.

## Túnel SSH (CLI + herramientas)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Con el túnel activo, `openclaw health` y `openclaw status --deep` acceden al Gateway remoto mediante `ws://127.0.0.1:18789`. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` y `openclaw gateway call` también pueden apuntar a una URL reenviada mediante `--url`.

<Note>
Sustituya `18789` por el valor configurado de `gateway.port` (o `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` nunca recurre a las credenciales de la configuración ni del entorno. Proporcione `--token` o `--password` explícitamente; sin ellos, el cliente no envía credenciales y la conexión falla si el Gateway de destino requiere autenticación.
</Warning>

## Valores remotos predeterminados de la CLI

Guarde un destino remoto para que los comandos de la CLI lo usen de forma predeterminada:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Cuando el Gateway solo use loopback, mantenga la URL como `ws://127.0.0.1:18789` y abra primero el túnel SSH. En el transporte mediante túnel SSH de la aplicación de macOS, el nombre de host del Gateway detectado se especifica en `gateway.remote.sshTarget` (`user@host` o `user@host:port`); `gateway.remote.url` conserva la URL del túnel local. Si el puerto remoto es distinto del local, configure `gateway.remote.remotePort`.

La verificación de la clave del host es estricta de forma predeterminada (`gateway.remote.sshHostKeyPolicy: "strict"`). Establézcala en `"openssh"` para delegarla en su configuración efectiva de OpenSSH; revise la configuración SSH del usuario y del sistema antes de habilitar esta opción.

Para un Gateway al que ya se pueda acceder mediante una LAN o tailnet de confianza, use el modo directo:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Precedencia de credenciales

La resolución de credenciales del Gateway sigue un contrato compartido en las rutas de llamada, sondeo y estado, así como en la supervisión de aprobaciones de ejecución de Discord. El host de Node usa el mismo contrato con una excepción para el modo local (ignora `gateway.remote.*`).

- Las credenciales explícitas (`--token`, `--password` o el `gatewayToken` de una herramienta) siempre tienen prioridad en las rutas de llamada que aceptan autenticación explícita.
- Seguridad de la sustitución de URL:
  - `--url` de la CLI nunca reutiliza credenciales implícitas de la configuración o del entorno.
  - `OPENCLAW_GATEWAY_URL` del entorno solo puede usar credenciales del entorno (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valores predeterminados del modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (solo se recurre al valor remoto cuando no se ha establecido el token local)
  - contraseña: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (solo se recurre al valor remoto cuando no se ha establecido la contraseña local)
- Valores predeterminados del modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - contraseña: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Excepción del modo local del host de Node: se ignoran `gateway.remote.token` / `gateway.remote.password`.
- Las comprobaciones del token de sondeo y estado remotos son estrictas de forma predeterminada: al apuntar al modo remoto, solo usan `gateway.remote.token` (sin recurrir al token local).
- Las sustituciones del entorno del Gateway solo usan `OPENCLAW_GATEWAY_*`.

## Acceso remoto a la interfaz de chat

WebChat no tiene un puerto HTTP independiente; la interfaz de chat de SwiftUI se conecta directamente al WebSocket del Gateway.

- Reenvíe `18789` mediante SSH (consulte la sección anterior) y conecte después los clientes a `ws://127.0.0.1:18789`.
- Para el modo directo mediante LAN/tailnet, conecte los clientes a la URL privada `ws://` o segura `wss://` configurada.
- En macOS, el modo remoto de la aplicación administra automáticamente el transporte seleccionado.

## Modo remoto de la aplicación de macOS

La aplicación de la barra de menús de macOS gestiona la misma configuración de principio a fin: comprobaciones del estado remoto, WebChat y reenvío de Activación por voz. Guía operativa: [acceso remoto de macOS](/es/platforms/mac/remote).

## Reglas de seguridad (acceso remoto/VPN)

Mantenga el Gateway **solo en loopback**, salvo que esté seguro de que necesita una vinculación.

- **Loopback + SSH/Tailscale Serve** es la opción predeterminada más segura (sin exposición pública).
- Se acepta `ws://` sin cifrar para loopback, redes privadas/LAN (RFC 1918), direcciones de vínculo local, CGNAT y hosts `.local` y `.ts.net`. Los hosts remotos públicos deben usar `wss://`.
- Las **vinculaciones que no sean de loopback** (`lan`/`tailnet`/`custom`, o `auto` cuando loopback no esté disponible) deben usar la autenticación del Gateway: token, contraseña o un proxy inverso con reconocimiento de identidad y `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` son fuentes de credenciales del cliente; no configuran por sí mismas la autenticación del servidor.
- Las rutas de llamada locales solo pueden recurrir a `gateway.remote.*` cuando `gateway.auth.*` no esté configurado.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se puede resolver, la resolución falla de forma cerrada (sin que un valor remoto alternativo oculte el problema).
- `gateway.remote.tlsFingerprint` fija el certificado TLS remoto para `wss://`, incluido el modo directo de macOS. Sin una huella almacenada, macOS solo la fija en el primer uso después de superar la validación de confianza normal del sistema; los Gateways autofirmados o con una CA privada necesitan una huella explícita o Remote over SSH.
- **Tailscale Serve** puede autenticar el tráfico de la interfaz de control/WebSocket mediante encabezados de identidad cuando `gateway.auth.allowTailscale: true`. Los puntos de conexión de la API HTTP no usan esa autenticación por encabezado y, en su lugar, siguen el modo normal de autenticación HTTP del Gateway. Este flujo sin token presupone que el host del Gateway es de confianza; establézcalo en `false` para usar autenticación mediante secreto compartido en todas partes.
- La autenticación mediante **proxy de confianza** espera de forma predeterminada un proxy con reconocimiento de identidad que no use loopback. Los proxies inversos de loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` de forma explícita.
- Trate el control mediante navegador como acceso de operador: solo mediante tailnet y con un emparejamiento intencionado del Node.

Información detallada: [Seguridad](/es/gateway/security).

### macOS: túnel SSH persistente mediante LaunchAgent

Para los clientes de macOS, la configuración persistente más sencilla usa una entrada `LocalForward` en la configuración de SSH, junto con un LaunchAgent que mantiene el túnel activo tras reinicios y fallos.

#### Paso 1: añadir la configuración de SSH

Edite `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Sustituya `<REMOTE_IP>` y `<REMOTE_USER>` por sus valores.

#### Paso 2: copiar la clave SSH (una sola vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Paso 3: configurar el token del Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Use `gateway.remote.password` en su lugar si el Gateway remoto utiliza autenticación mediante contraseña. `OPENCLAW_GATEWAY_TOKEN` sigue siendo válido como sustitución en el entorno del shell, pero la configuración persistente del cliente remoto es `gateway.remote.token` / `gateway.remote.password`.

#### Paso 4: crear el LaunchAgent

Guárdelo como `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Paso 5: cargar el LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

El túnel se inicia automáticamente al iniciar sesión, se reinicia si falla y mantiene activo el puerto reenviado.

<Note>
Si conserva un LaunchAgent `com.openclaw.ssh-tunnel` de una configuración anterior, descárguelo y elimínelo.
</Note>

#### Solución de problemas

```bash
# Check if the tunnel is running
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Restart the tunnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Stop the tunnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrada de configuración                 | Qué hace                                                              |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789`     | Reenvía el puerto local 18789 al puerto remoto 18789                   |
| `ssh -N`                                 | SSH sin ejecutar comandos remotos (solo reenvío de puertos)           |
| `KeepAlive`                              | Reinicia automáticamente el túnel si falla                            |
| `RunAtLoad`                              | Inicia el túnel cuando el LaunchAgent se carga al iniciar sesión       |

## Contenido relacionado

- [Tailscale](/es/gateway/tailscale)
- [Autenticación](/es/gateway/authentication)
- [Configuración de un Gateway remoto](/es/gateway/remote-gateway-readme)
