---
read_when:
    - Ejecutar o solucionar problemas de configuraciones remotas de Gateway
summary: Acceso remoto mediante Gateway WS, túneles SSH y tailnets
title: Acceso remoto
x-i18n:
    generated_at: "2026-07-05T11:21:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw ejecuta un Gateway (el maestro) en un host y conecta todos los clientes a él. El Gateway es propietario de las sesiones, los perfiles de autenticación, los canales y el estado; todo lo demás es un cliente.

- **Operadores** (tú, o la app de macOS): el WebSocket directo por LAN/Tailnet es lo más simple cuando el Gateway es alcanzable; el túnel SSH es la alternativa universal.
- **Nodos** (iOS/Android y otros dispositivos): se conectan al **WebSocket** del Gateway (LAN/tailnet o túnel SSH).

## La idea central

El WebSocket del Gateway se enlaza a **loopback** de forma predeterminada, en el puerto `18789` (`gateway.port`). Para uso remoto, exponlo mediante Tailscale Serve / un enlace LAN-Tailnet de confianza, o reenvía el puerto loopback por SSH.

## Opciones de topología

| Configuración                     | Dónde se ejecuta el Gateway                                                                               | Ideal para                                                                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway siempre activo en tu tailnet | Host persistente (VPS o servidor doméstico), accesible vía Tailscale o SSH                                | Portátiles que entran en suspensión a menudo pero necesitan que el agente esté siempre activo. Consulta [exe.dev](/es/install/exe-dev) (VM fácil) o [Hetzner](/es/install/hetzner) (VPS de producción). |
| Escritorio doméstico              | Escritorio; el portátil se conecta de forma remota mediante el modo remoto de la app de macOS (Settings → Connection → OpenClaw runs) | Mantener el agente en hardware que permanece encendido. Guía operativa: [acceso remoto en macOS](/es/platforms/mac/remote).                              |
| Portátil                          | Portátil, expuesto de forma segura mediante túnel SSH o Tailscale Serve (mantén `gateway.bind: "loopback"`) | Configuraciones de una sola máquina. Consulta [Tailscale](/es/gateway/tailscale) y [Web](/es/web).                                                           |

Para las configuraciones siempre activa y de portátil, prefiere mantener `gateway.bind: "loopback"` y usar **Tailscale Serve** para la interfaz de usuario de control, o un enlace LAN/Tailnet de confianza con `gateway.remote.transport: "direct"`. El túnel SSH es la alternativa que funciona desde cualquier máquina.

## Flujo de comandos (qué se ejecuta dónde)

Un Gateway es propietario del estado y los canales; los nodos son periféricos. Ejemplo (mensaje de Telegram enrutado a una herramienta de nodo):

1. El mensaje de Telegram llega al **Gateway**.
2. El Gateway ejecuta el **agente**, que decide si llamar a una herramienta de nodo.
3. El Gateway llama al **nodo** mediante el WebSocket del Gateway (RPC `node.invoke`).
4. El nodo devuelve el resultado; el Gateway responde a Telegram.

Los nodos no ejecutan el servicio Gateway. Solo debe ejecutarse un Gateway por host, salvo que ejecutes intencionadamente perfiles aislados (consulta [Múltiples gateways](/es/gateway/multiple-gateways)). El "modo nodo" de la app de macOS es solo un cliente de nodo mediante el WebSocket del Gateway.

## Túnel SSH (CLI + herramientas)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Con el túnel activo, `openclaw health` y `openclaw status --deep` alcanzan el Gateway remoto mediante `ws://127.0.0.1:18789`. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` y `openclaw gateway call` también pueden apuntar a una URL reenviada mediante `--url`.

<Note>
Sustituye `18789` por tu `gateway.port` configurado (o `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` nunca recurre a la configuración ni a credenciales de entorno. Pasa `--token` o `--password` explícitamente; sin ellos, el cliente no envía credenciales y la conexión falla si el Gateway de destino requiere autenticación.
</Warning>

## Valores predeterminados remotos de la CLI

Persiste un destino remoto para que los comandos de CLI lo usen de forma predeterminada:

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

Cuando el Gateway solo escucha en loopback, mantén la URL en `ws://127.0.0.1:18789` y abre primero el túnel SSH. En el transporte de túnel SSH de la app de macOS, el nombre de host del Gateway descubierto va en `gateway.remote.sshTarget` (`user@host` o `user@host:port`); `gateway.remote.url` permanece como la URL del túnel local. Si el puerto remoto difiere del local, configura `gateway.remote.remotePort`.

La verificación de clave de host es estricta de forma predeterminada (`gateway.remote.sshHostKeyPolicy: "strict"`). Configúrala en `"openssh"` para delegar en tu configuración efectiva de OpenSSH; revisa tus ajustes SSH de usuario y sistema antes de habilitarlo.

Para un Gateway ya accesible en una LAN o Tailnet de confianza, usa el modo directo:

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

La resolución de credenciales del Gateway sigue un contrato compartido en las rutas call/probe/status y en la monitorización de aprobación de ejecución de Discord. Node-host usa el mismo contrato con una excepción de modo local (ignora `gateway.remote.*`).

- Las credenciales explícitas (`--token`, `--password` o el `gatewayToken` de una herramienta) siempre tienen prioridad en las rutas de llamada que aceptan autenticación explícita.
- Seguridad de sobrescritura de URL:
  - La CLI `--url` nunca reutiliza credenciales implícitas de configuración/entorno.
  - Env `OPENCLAW_GATEWAY_URL` puede usar solo credenciales de entorno (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valores predeterminados del modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (alternativa remota solo cuando el token local no está configurado)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (alternativa remota solo cuando la contraseña local no está configurada)
- Valores predeterminados del modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Excepción de modo local de Node-host: `gateway.remote.token` / `gateway.remote.password` se ignoran.
- Las comprobaciones de token de probe/status remotos son estrictas de forma predeterminada: usan solo `gateway.remote.token` (sin alternativa de token local) cuando apuntan al modo remoto.
- Las sobrescrituras de entorno del Gateway usan solo `OPENCLAW_GATEWAY_*`.

## Acceso remoto a la interfaz de chat

WebChat no tiene un puerto HTTP separado; la interfaz de chat SwiftUI se conecta directamente al WebSocket del Gateway.

- Reenvía `18789` por SSH (ver arriba) y luego conecta los clientes a `ws://127.0.0.1:18789`.
- Para el modo directo LAN/Tailnet, conecta los clientes a la URL privada `ws://` o segura `wss://` configurada.
- En macOS, el modo remoto de la app gestiona automáticamente el transporte seleccionado.

## Modo remoto de la app de macOS

La app de barra de menú de macOS gestiona la misma configuración de extremo a extremo: comprobaciones de estado remoto, WebChat y reenvío de Voice Wake. Guía operativa: [acceso remoto en macOS](/es/platforms/mac/remote).

## Reglas de seguridad (remoto/VPN)

Mantén el Gateway **solo en loopback** salvo que tengas claro que necesitas un enlace.

- **Loopback + SSH/Tailscale Serve** es el valor predeterminado más seguro (sin exposición pública).
- `ws://` en texto claro se acepta para loopback, privada/LAN (RFC 1918), link-local, CGNAT, hosts `.local` y `.ts.net`. Los hosts remotos públicos deben usar `wss://`.
- Los **enlaces que no son loopback** (`lan`/`tailnet`/`custom`, o `auto` cuando loopback no está disponible) deben usar autenticación de Gateway: token, contraseña o un proxy inverso consciente de identidad con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` son fuentes de credenciales de cliente; por sí solas no configuran la autenticación del servidor.
- Las rutas de llamada locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está configurado.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla cerrada (sin enmascaramiento por alternativa remota).
- `gateway.remote.tlsFingerprint` fija el certificado TLS remoto para `wss://`, incluido el modo directo de macOS. Sin un pin almacenado, macOS solo fija en el primer uso después de que pase la confianza normal del sistema; los Gateways autofirmados o con CA privada necesitan una huella explícita o remoto por SSH.
- **Tailscale Serve** puede autenticar el tráfico de la interfaz de usuario de control/WebSocket mediante encabezados de identidad cuando `gateway.auth.allowTailscale: true`. Los endpoints de la API HTTP no usan esa autenticación por encabezado y, en su lugar, siguen el modo de autenticación HTTP normal del Gateway. Este flujo sin token asume que el host del Gateway es de confianza; configúralo en `false` para autenticación con secreto compartido en todas partes.
- La autenticación **trusted-proxy** espera de forma predeterminada un proxy consciente de identidad que no sea loopback. Los proxies inversos loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Trata el control desde navegador como acceso de operador: solo tailnet y emparejamiento de nodos deliberado.

Análisis detallado: [Seguridad](/es/gateway/security).

### macOS: túnel SSH persistente mediante LaunchAgent

Para clientes macOS, la configuración persistente más sencilla usa una entrada de configuración SSH `LocalForward` más un LaunchAgent que mantiene el túnel activo entre reinicios y fallos.

#### Paso 1: añadir configuración SSH

Edita `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Sustituye `<REMOTE_IP>` y `<REMOTE_USER>` por tus valores.

#### Paso 2: copiar la clave SSH (una sola vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Paso 3: configurar el token del gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Usa `gateway.remote.password` en su lugar si el Gateway remoto usa autenticación por contraseña. `OPENCLAW_GATEWAY_TOKEN` sigue siendo válido como sobrescritura a nivel de shell, pero la configuración duradera de cliente remoto es `gateway.remote.token` / `gateway.remote.password`.

#### Paso 4: crear el LaunchAgent

Guarda como `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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
Si tienes un LaunchAgent `com.openclaw.ssh-tunnel` sobrante de una configuración anterior, descárgalo y elimínalo.
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

| Entrada de configuración              | Qué hace                                                     |
| ------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`  | Reenvía el puerto local 18789 al puerto remoto 18789         |
| `ssh -N`                              | SSH sin ejecutar comandos remotos (solo reenvío de puertos)  |
| `KeepAlive`                           | Reinicia el túnel automáticamente si falla                   |
| `RunAtLoad`                           | Inicia el túnel cuando el LaunchAgent se carga al iniciar sesión |

## Relacionado

- [Tailscale](/es/gateway/tailscale)
- [Autenticación](/es/gateway/authentication)
- [Configuración de Gateway remoto](/es/gateway/remote-gateway-readme)
