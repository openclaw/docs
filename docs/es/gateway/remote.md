---
read_when:
    - Ejecutar o solucionar problemas de configuraciones remotas de Gateway
summary: Acceso remoto mediante túneles SSH (Gateway WS) y redes tailnet
title: Acceso remoto
x-i18n:
    generated_at: "2026-04-30T05:43:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

Este repo admite “remoto por SSH” manteniendo un único Gateway (el maestro) en ejecución en un host dedicado (escritorio/servidor) y conectando clientes a él.

- Para **operadores (tú / la app de macOS)**: el túnel SSH es la alternativa universal.
- Para **nodos (iOS/Android y dispositivos futuros)**: conéctate al **WebSocket** del Gateway (LAN/tailnet o túnel SSH según sea necesario).

## La idea central

- El WebSocket del Gateway se enlaza a **loopback** en el puerto configurado (el valor predeterminado es 18789).
- Para uso remoto, reenvías ese puerto loopback por SSH (o usas una tailnet/VPN y necesitas menos túneles).

## Configuraciones comunes de VPN y tailnet

Piensa en el **host del Gateway** como el lugar donde vive el agente. Es dueño de las sesiones, perfiles de autenticación, canales y estado. Tu portátil, escritorio y nodos se conectan a ese host.

### Gateway siempre activo en tu tailnet

Ejecuta el Gateway en un host persistente (VPS o servidor doméstico) y accede a él mediante **Tailscale** o SSH.

- **Mejor UX:** mantén `gateway.bind: "loopback"` y usa **Tailscale Serve** para la interfaz de control.
- **Alternativa:** mantén loopback más un túnel SSH desde cualquier máquina que necesite acceso.
- **Ejemplos:** [exe.dev](/es/install/exe-dev) (VM sencilla) o [Hetzner](/es/install/hetzner) (VPS de producción).

Ideal cuando tu portátil entra en suspensión a menudo pero quieres que el agente esté siempre activo.

### El escritorio doméstico ejecuta el Gateway

El portátil **no** ejecuta el agente. Se conecta de forma remota:

- Usa el modo **Remoto por SSH** de la app de macOS (Configuración → General → OpenClaw se ejecuta).
- La app abre y administra el túnel, por lo que WebChat y las comprobaciones de estado funcionan directamente.

Runbook: [acceso remoto en macOS](/es/platforms/mac/remote).

### El portátil ejecuta el Gateway

Mantén el Gateway local, pero expónlo de forma segura:

- Túnel SSH al portátil desde otras máquinas, o
- Tailscale Serve para la interfaz de control y mantén el Gateway solo en loopback.

Guías: [Tailscale](/es/gateway/tailscale) y [vista general web](/es/web).

## Flujo de comandos (qué se ejecuta dónde)

Un servicio de gateway posee el estado + los canales. Los nodos son periféricos.

Ejemplo de flujo (Telegram → nodo):

- Un mensaje de Telegram llega al **Gateway**.
- Gateway ejecuta el **agente** y decide si llamar a una herramienta de nodo.
- Gateway llama al **nodo** mediante el WebSocket del Gateway (`node.*` RPC).
- El nodo devuelve el resultado; Gateway responde de vuelta a Telegram.

Notas:

- **Los nodos no ejecutan el servicio de gateway.** Solo debería ejecutarse un gateway por host, salvo que ejecutes perfiles aislados intencionalmente (consulta [Múltiples gateways](/es/gateway/multiple-gateways)).
- El “modo nodo” de la app de macOS es solo un cliente de nodo sobre el WebSocket del Gateway.

## Túnel SSH (CLI + herramientas)

Crea un túnel local hacia el WS del Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con el túnel activo:

- `openclaw health` y `openclaw status --deep` ahora alcanzan el gateway remoto mediante `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` y `openclaw gateway call` también pueden apuntar a la URL reenviada mediante `--url` cuando sea necesario.

<Note>
Reemplaza `18789` por tu `gateway.port` configurado (o `--port` u `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Cuando pasas `--url`, la CLI no vuelve a credenciales de configuración o entorno. Incluye `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Warning>

## Valores predeterminados remotos de la CLI

Puedes persistir un destino remoto para que los comandos de la CLI lo usen de forma predeterminada:

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

Cuando el gateway sea solo loopback, mantén la URL en `ws://127.0.0.1:18789` y abre primero el túnel SSH.
En el transporte de túnel SSH de la app de macOS, los nombres de host de gateway descubiertos pertenecen a
`gateway.remote.sshTarget`; `gateway.remote.url` sigue siendo la URL del túnel local.

## Precedencia de credenciales

La resolución de credenciales de Gateway sigue un contrato compartido en las rutas call/probe/status y en el monitoreo de aprobación de ejecución de Discord. Node-host usa el mismo contrato base con una excepción de modo local (ignora intencionalmente `gateway.remote.*`):

- Las credenciales explícitas (`--token`, `--password` o la herramienta `gatewayToken`) siempre ganan en rutas de llamada que aceptan autenticación explícita.
- Seguridad de anulación de URL:
  - Las anulaciones de URL de la CLI (`--url`) nunca reutilizan credenciales implícitas de configuración/entorno.
  - Las anulaciones de URL de entorno (`OPENCLAW_GATEWAY_URL`) solo pueden usar credenciales de entorno (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valores predeterminados del modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (la alternativa remota solo aplica cuando la entrada local de token de autenticación no está definida)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (la alternativa remota solo aplica cuando la entrada local de contraseña de autenticación no está definida)
- Valores predeterminados del modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Excepción de modo local de node-host: `gateway.remote.token` / `gateway.remote.password` se ignoran.
- Las comprobaciones de token probe/status remotas son estrictas de forma predeterminada: usan solo `gateway.remote.token` (sin alternativa de token local) cuando apuntan al modo remoto.
- Las anulaciones de entorno de Gateway usan solo `OPENCLAW_GATEWAY_*`.

## Interfaz de chat por SSH

WebChat ya no usa un puerto HTTP separado. La interfaz de chat SwiftUI se conecta directamente al WebSocket del Gateway.

- Reenvía `18789` por SSH (consulta arriba), luego conecta los clientes a `ws://127.0.0.1:18789`.
- En macOS, prefiere el modo “Remoto por SSH” de la app, que administra el túnel automáticamente.

## Remoto por SSH en la app de macOS

La app de barra de menús de macOS puede manejar la misma configuración de extremo a extremo (comprobaciones de estado remotas, WebChat y reenvío de Voice Wake).

Runbook: [acceso remoto en macOS](/es/platforms/mac/remote).

## Reglas de seguridad (remoto/VPN)

Versión corta: **mantén el Gateway solo en loopback** salvo que tengas claro que necesitas un enlace.

- **Loopback + SSH/Tailscale Serve** es el valor predeterminado más seguro (sin exposición pública).
- `ws://` en texto claro es solo loopback de forma predeterminada. Para redes privadas de confianza,
  establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el proceso cliente como
  medida de emergencia. No hay equivalente en `openclaw.json`; esto debe estar en el
  entorno del proceso para el cliente que realiza la conexión WebSocket.
- Los **enlaces no-loopback** (`lan`/`tailnet`/`custom`, o `auto` cuando loopback no está disponible) deben usar autenticación de gateway: token, contraseña o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` son fuentes de credenciales de cliente. **No** configuran la autenticación del servidor por sí mismas.
- Las rutas de llamada locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está definido.
- Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin enmascaramiento mediante alternativa remota).
- `gateway.remote.tlsFingerprint` fija el certificado TLS remoto cuando se usa `wss://`.
- **Tailscale Serve** puede autenticar el tráfico de la interfaz de control/WebSocket mediante encabezados
  de identidad cuando `gateway.auth.allowTailscale: true`; los endpoints de la API HTTP no
  usan esa autenticación por encabezado de Tailscale y, en su lugar, siguen el modo de autenticación HTTP
  normal del gateway. Este flujo sin token supone que el host del gateway es de confianza. Establécelo en
  `false` si quieres autenticación por secreto compartido en todas partes.
- La autenticación **trusted-proxy** espera configuraciones de proxy con reconocimiento de identidad que no sean loopback de forma predeterminada.
  Los proxies inversos loopback del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Trata el control desde el navegador como acceso de operador: solo tailnet + emparejamiento de nodos deliberado.

Análisis detallado: [Seguridad](/es/gateway/security).

### macOS: túnel SSH persistente mediante LaunchAgent

Para clientes macOS que se conectan a un gateway remoto, la configuración persistente más sencilla usa una entrada de configuración SSH `LocalForward` más un LaunchAgent para mantener el túnel activo entre reinicios y bloqueos.

#### Paso 1: añadir configuración SSH

Edita `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Reemplaza `<REMOTE_IP>` y `<REMOTE_USER>` por tus valores.

#### Paso 2: copiar la clave SSH (una vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Paso 3: configurar el token del gateway

Almacena el token en la configuración para que persista entre reinicios:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Paso 4: crear el LaunchAgent

Guarda esto como `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

El túnel se iniciará automáticamente al iniciar sesión, se reiniciará si falla y mantendrá activo el puerto reenviado.

<Note>
Si tienes un LaunchAgent `com.openclaw.ssh-tunnel` restante de una configuración anterior, descárgalo y elimínalo.
</Note>

#### Solución de problemas

Comprueba si el túnel se está ejecutando:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Reinicia el túnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Detén el túnel:

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
