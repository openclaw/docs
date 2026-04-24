---
read_when:
    - Ejecutar o solucionar problemas de configuraciones remotas de Gateway
summary: Acceso remoto mediante túneles SSH (Gateway WS) y tailnets
title: Acceso remoto
x-i18n:
    generated_at: "2026-04-24T08:57:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# Acceso remoto (SSH, túneles y tailnets)

Este repositorio admite “remoto por SSH” al mantener un único Gateway (el maestro) en ejecución en un host dedicado (equipo de escritorio/servidor) y conectar los clientes a él.

- Para **operadores (usted / la aplicación de macOS)**: el túnel SSH es la alternativa universal.
- Para **Nodes (iOS/Android y futuros dispositivos)**: conéctese al **WebSocket** de Gateway (LAN/tailnet o túnel SSH según sea necesario).

## La idea principal

- El WebSocket de Gateway se vincula a **loopback** en el puerto configurado (el valor predeterminado es 18789).
- Para uso remoto, reenvía ese puerto loopback a través de SSH (o usa una tailnet/VPN y requiere menos túneles).

## Configuraciones comunes de VPN/tailnet (donde reside el agente)

Piense en el **host de Gateway** como “donde reside el agente”. Es propietario de las sesiones, perfiles de autenticación, canales y estado.
Su laptop/equipo de escritorio (y los Nodes) se conectan a ese host.

### 1) Gateway siempre activo en su tailnet (VPS o servidor doméstico)

Ejecute Gateway en un host persistente y acceda a él mediante **Tailscale** o SSH.

- **Mejor experiencia:** mantenga `gateway.bind: "loopback"` y use **Tailscale Serve** para la interfaz de control.
- **Alternativa:** mantenga loopback + túnel SSH desde cualquier equipo que necesite acceso.
- **Ejemplos:** [exe.dev](/es/install/exe-dev) (VM sencilla) o [Hetzner](/es/install/hetzner) (VPS de producción).

Esto es ideal cuando su laptop entra en suspensión con frecuencia, pero desea que el agente esté siempre activo.

### 2) El equipo de escritorio de casa ejecuta Gateway, la laptop es el control remoto

La laptop **no** ejecuta el agente. Se conecta de forma remota:

- Use el modo **Remoto por SSH** de la aplicación de macOS (Configuración → General → “OpenClaw runs”).
- La aplicación abre y administra el túnel, por lo que WebChat + las comprobaciones de estado “simplemente funcionan”.

Procedimiento: [acceso remoto en macOS](/es/platforms/mac/remote).

### 3) La laptop ejecuta Gateway, acceso remoto desde otros equipos

Mantenga Gateway local, pero expóngalo de forma segura:

- Use un túnel SSH hacia la laptop desde otros equipos, o
- Use Tailscale Serve para la interfaz de control y mantenga Gateway solo en loopback.

Guía: [Tailscale](/es/gateway/tailscale) y [descripción general de la web](/es/web).

## Flujo de comandos (qué se ejecuta y dónde)

Un servicio Gateway es propietario del estado + los canales. Los Nodes son periféricos.

Ejemplo de flujo (Telegram → Node):

- Un mensaje de Telegram llega al **Gateway**.
- Gateway ejecuta el **agente** y decide si debe llamar a una herramienta de Node.
- Gateway llama al **Node** a través del WebSocket de Gateway (`node.*` RPC).
- Node devuelve el resultado; Gateway responde de vuelta a Telegram.

Notas:

- **Los Nodes no ejecutan el servicio Gateway.** Solo debe ejecutarse un Gateway por host, a menos que ejecute intencionadamente perfiles aislados (consulte [Varios gateways](/es/gateway/multiple-gateways)).
- El “modo node” de la aplicación de macOS es simplemente un cliente de Node sobre el WebSocket de Gateway.

## Túnel SSH (CLI + herramientas)

Cree un túnel local hacia el WS de Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con el túnel activo:

- `openclaw health` y `openclaw status --deep` ahora llegan al Gateway remoto a través de `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` y `openclaw gateway call` también pueden apuntar a la URL reenviada mediante `--url` cuando sea necesario.

Nota: reemplace `18789` por su `gateway.port` configurado (o `--port`/`OPENCLAW_GATEWAY_PORT`).
Nota: cuando pasa `--url`, la CLI no recurre a credenciales implícitas de configuración o entorno.
Incluya `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.

## Valores predeterminados remotos de la CLI

Puede conservar un destino remoto para que los comandos de la CLI lo usen de forma predeterminada:

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

Cuando Gateway está limitado a loopback, mantenga la URL en `ws://127.0.0.1:18789` y abra primero el túnel SSH.

## Precedencia de credenciales

La resolución de credenciales de Gateway sigue un contrato compartido único en las rutas de llamada/probe/status y en la supervisión de aprobación de ejecución de Discord. Node-host usa el mismo contrato base con una excepción de modo local (ignora intencionadamente `gateway.remote.*`):

- Las credenciales explícitas (`--token`, `--password` o la herramienta `gatewayToken`) siempre prevalecen en las rutas de llamada que aceptan autenticación explícita.
- Seguridad de reemplazo de URL:
  - Los reemplazos de URL de la CLI (`--url`) nunca reutilizan credenciales implícitas de configuración/entorno.
  - Los reemplazos de URL del entorno (`OPENCLAW_GATEWAY_URL`) solo pueden usar credenciales del entorno (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valores predeterminados del modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (la alternativa remota se aplica solo cuando la entrada del token de autenticación local no está configurada)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (la alternativa remota se aplica solo cuando la entrada de la contraseña de autenticación local no está configurada)
- Valores predeterminados del modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Excepción de modo local de Node-host: `gateway.remote.token` / `gateway.remote.password` se ignoran.
- Las comprobaciones de token de probe/status remotos son estrictas de forma predeterminada: usan solo `gateway.remote.token` (sin alternativa al token local) cuando apuntan al modo remoto.
- Los reemplazos de entorno de Gateway usan solo `OPENCLAW_GATEWAY_*`.

## Interfaz de chat sobre SSH

WebChat ya no usa un puerto HTTP independiente. La interfaz de chat SwiftUI se conecta directamente al WebSocket de Gateway.

- Reenvíe `18789` por SSH (consulte arriba) y luego conecte los clientes a `ws://127.0.0.1:18789`.
- En macOS, prefiera el modo “Remoto por SSH” de la aplicación, que administra el túnel automáticamente.

## Aplicación de macOS: "Remoto por SSH"

La aplicación de barra de menú de macOS puede controlar esta misma configuración de extremo a extremo (comprobaciones de estado remotas, WebChat y reenvío de activación por voz).

Procedimiento: [acceso remoto en macOS](/es/platforms/mac/remote).

## Reglas de seguridad (remoto/VPN)

Versión corta: **mantenga Gateway solo en loopback** a menos que esté seguro de que necesita una vinculación.

- **Loopback + SSH/Tailscale Serve** es la opción predeterminada más segura (sin exposición pública).
- `ws://` en texto sin cifrar es solo para loopback de forma predeterminada. Para redes privadas de confianza,
  configure `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el proceso cliente como
  medida de emergencia. No existe un equivalente en `openclaw.json`; esto debe estar en el
  entorno del proceso del cliente que realiza la conexión WebSocket.
- Las **vinculaciones que no son loopback** (`lan`/`tailnet`/`custom`, o `auto` cuando loopback no está disponible) deben usar autenticación de Gateway: token, contraseña o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` son fuentes de credenciales del cliente. **No** configuran por sí mismos la autenticación del servidor.
- Las rutas de llamada locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está configurado.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se puede resolver, la resolución falla de forma segura (sin enmascaramiento mediante alternativa remota).
- `gateway.remote.tlsFingerprint` fija el certificado TLS remoto cuando se usa `wss://`.
- **Tailscale Serve** puede autenticar el tráfico de la interfaz de control/WebSocket mediante encabezados de identidad
  cuando `gateway.auth.allowTailscale: true`; los endpoints de la API HTTP no
  usan esa autenticación de encabezado de Tailscale y, en su lugar, siguen el modo
  normal de autenticación HTTP del gateway. Este flujo sin token asume que el host del gateway es de confianza. Establézcalo en
  `false` si desea autenticación con secreto compartido en todas partes.
- La autenticación **trusted-proxy** es solo para configuraciones de proxy con reconocimiento de identidad y sin loopback.
  Los proxies inversos loopback en el mismo host no cumplen `gateway.auth.mode: "trusted-proxy"`.
- Trate el control desde el navegador como acceso de operador: solo tailnet + emparejamiento deliberado de Nodes.

Análisis detallado: [Seguridad](/es/gateway/security).

### macOS: túnel SSH persistente mediante LaunchAgent

Para clientes de macOS que se conectan a un gateway remoto, la configuración persistente más sencilla usa una entrada de configuración SSH `LocalForward` más un LaunchAgent para mantener activo el túnel tras reinicios y fallos.

#### Paso 1: agregar la configuración de SSH

Edite `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Reemplace `<REMOTE_IP>` y `<REMOTE_USER>` por sus valores.

#### Paso 2: copiar la clave SSH (una sola vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Paso 3: configurar el token de Gateway

Almacene el token en la configuración para que persista tras los reinicios:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Paso 4: crear el LaunchAgent

Guarde esto como `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

El túnel se iniciará automáticamente al iniciar sesión, se reiniciará tras fallos y mantendrá activo el puerto reenviado.

Nota: si tiene un LaunchAgent `com.openclaw.ssh-tunnel` residual de una configuración anterior, descárguelo y elimínelo.

#### Solución de problemas

Compruebe si el túnel está en ejecución:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Reinicie el túnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Detenga el túnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrada de configuración             | Qué hace                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Reenvía el puerto local 18789 al puerto remoto 18789         |
| `ssh -N`                             | SSH sin ejecutar comandos remotos (solo reenvío de puertos)  |
| `KeepAlive`                          | Reinicia automáticamente el túnel si falla                   |
| `RunAtLoad`                          | Inicia el túnel cuando el LaunchAgent se carga al iniciar sesión |

## Relacionado

- [Tailscale](/es/gateway/tailscale)
- [Autenticación](/es/gateway/authentication)
- [Configuración de gateway remoto](/es/gateway/remote-gateway-readme)
