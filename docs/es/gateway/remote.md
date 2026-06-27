---
read_when:
    - Ejecución o solución de problemas de configuraciones de Gateway remoto
summary: Acceso remoto mediante Gateway WS, túneles SSH y tailnets
title: Acceso remoto
x-i18n:
    generated_at: "2026-06-27T11:34:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Este repo admite acceso remoto al Gateway manteniendo un único Gateway (el principal) ejecutándose en un host dedicado (equipo de escritorio/servidor) y conectando clientes a él.

- Para **operadores (tú / la app de macOS)**: WebSocket directo por LAN/Tailnet es lo más simple cuando el gateway es accesible; el túnel SSH es la alternativa universal.
- Para **nodos (iOS/Android y dispositivos futuros)**: conéctate al **WebSocket** del Gateway (LAN/tailnet o túnel SSH según sea necesario).

## La idea central

- El WebSocket del Gateway normalmente se enlaza a **loopback** en el puerto configurado (el predeterminado es 18789).
- Para uso remoto, exponlo mediante Tailscale Serve o un enlace LAN/Tailnet de confianza, o reenvía el puerto de loopback mediante SSH.

## Configuraciones comunes de VPN y tailnet

Piensa en el **host del Gateway** como el lugar donde vive el agente. Es dueño de sesiones, perfiles de autenticación, canales y estado. Tu laptop, equipo de escritorio y nodos se conectan a ese host.

### Gateway siempre activo en tu tailnet

Ejecuta el Gateway en un host persistente (VPS o servidor doméstico) y accede a él mediante **Tailscale** o SSH.

- **Mejor UX:** mantén `gateway.bind: "loopback"` y usa **Tailscale Serve** para la UI de control.
- **LAN/Tailnet de confianza:** enlaza el gateway a una interfaz privada y conéctate directamente con `gateway.remote.transport: "direct"`.
- **Alternativa:** mantén loopback más un túnel SSH desde cualquier máquina que necesite acceso.
- **Ejemplos:** [exe.dev](/es/install/exe-dev) (VM sencilla) o [Hetzner](/es/install/hetzner) (VPS de producción).

Ideal cuando tu laptop entra en reposo con frecuencia pero quieres que el agente esté siempre activo.

### El equipo de escritorio doméstico ejecuta el Gateway

La laptop **no** ejecuta el agente. Se conecta de forma remota:

- Usa el modo remoto de la app de macOS (Configuración → General → OpenClaw se ejecuta).
- La app se conecta directamente cuando el gateway es accesible en LAN/Tailnet, o abre y administra un túnel SSH cuando eliges SSH.

Runbook: [acceso remoto en macOS](/es/platforms/mac/remote).

### La laptop ejecuta el Gateway

Mantén el Gateway local, pero exponlo de forma segura:

- Túnel SSH hacia la laptop desde otras máquinas, o
- Publica la UI de control con Tailscale Serve y mantén el Gateway solo en loopback.

Guías: [Tailscale](/es/gateway/tailscale) y [descripción general web](/es/web).

## Flujo de comandos (qué se ejecuta dónde)

Un servicio de gateway posee el estado + los canales. Los nodos son periféricos.

Ejemplo de flujo (Telegram → nodo):

- Llega un mensaje de Telegram al **Gateway**.
- Gateway ejecuta el **agente** y decide si llamar a una herramienta de nodo.
- Gateway llama al **nodo** mediante el WebSocket del Gateway (`node.*` RPC).
- El nodo devuelve el resultado; Gateway responde de vuelta a Telegram.

Notas:

- **Los nodos no ejecutan el servicio de gateway.** Solo debe ejecutarse un gateway por host, salvo que ejecutes perfiles aislados intencionalmente (consulta [Múltiples gateways](/es/gateway/multiple-gateways)).
- El "modo nodo" de la app de macOS es simplemente un cliente de nodo sobre el WebSocket del Gateway.

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
Cuando pasas `--url`, la CLI no recurre a la configuración ni a credenciales de entorno. Incluye `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Warning>

## Valores remotos predeterminados de la CLI

Puedes conservar un destino remoto para que los comandos de la CLI lo usen de forma predeterminada:

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

Cuando el gateway es solo loopback, mantén la URL en `ws://127.0.0.1:18789` y abre primero el túnel SSH.
En el transporte de túnel SSH de la app de macOS, los nombres de host de gateway descubiertos pertenecen a
`gateway.remote.sshTarget`; `gateway.remote.url` sigue siendo la URL del túnel local.
Si esos puertos difieren, establece `gateway.remote.remotePort` en el puerto del gateway en
el host SSH.

Para un gateway que ya es accesible en una LAN o Tailnet de confianza, usa el modo directo:

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

## Prioridad de credenciales

La resolución de credenciales del Gateway sigue un contrato compartido en las rutas call/probe/status y en la supervisión de aprobación de ejecución de Discord. Node-host usa el mismo contrato base con una excepción de modo local (ignora intencionalmente `gateway.remote.*`):

- Las credenciales explícitas (`--token`, `--password` o `gatewayToken` de herramienta) siempre prevalecen en las rutas de llamada que aceptan autenticación explícita.
- Seguridad de sustitución de URL:
  - Las sustituciones de URL de la CLI (`--url`) nunca reutilizan credenciales implícitas de configuración/entorno.
  - Las sustituciones de URL por entorno (`OPENCLAW_GATEWAY_URL`) pueden usar solo credenciales de entorno (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valores predeterminados del modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (la alternativa remota se aplica solo cuando la entrada de token de autenticación local no está establecida)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (la alternativa remota se aplica solo cuando la entrada de contraseña de autenticación local no está establecida)
- Valores predeterminados del modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Excepción de modo local de Node-host: `gateway.remote.token` / `gateway.remote.password` se ignoran.
- Las comprobaciones de token probe/status remotas son estrictas de forma predeterminada: usan solo `gateway.remote.token` (sin alternativa de token local) al apuntar al modo remoto.
- Las sustituciones de entorno del Gateway usan solo `OPENCLAW_GATEWAY_*`.

## Acceso remoto a la UI de chat

WebChat ya no usa un puerto HTTP separado. La UI de chat de SwiftUI se conecta directamente al WebSocket del Gateway.

- Reenvía `18789` mediante SSH (consulta arriba), luego conecta los clientes a `ws://127.0.0.1:18789`.
- Para el modo directo LAN/Tailnet, conecta los clientes a la URL privada `ws://` configurada o a la URL segura `wss://`.
- En macOS, prefiere el modo remoto de la app, que administra automáticamente el transporte seleccionado.

## Modo remoto de la app de macOS

La app de barra de menús de macOS puede controlar la misma configuración de extremo a extremo (comprobaciones de estado remoto, WebChat y reenvío de Voice Wake).

Runbook: [acceso remoto en macOS](/es/platforms/mac/remote).

## Reglas de seguridad (remoto/VPN)

Versión corta: **mantén el Gateway solo en loopback** salvo que tengas claro que necesitas un enlace.

- **Loopback + SSH/Tailscale Serve** es el valor predeterminado más seguro (sin exposición pública).
- `ws://` sin cifrar se acepta para loopback, LAN, link-local, `.local`, `.ts.net` y hosts CGNAT de Tailscale. Los hosts remotos públicos deben usar `wss://`.
- Los **enlaces que no son loopback** (`lan`/`tailnet`/`custom`, o `auto` cuando loopback no está disponible) deben usar autenticación de gateway: token, contraseña o un proxy inverso con identidad con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` son fuentes de credenciales de cliente. **No** configuran la autenticación del servidor por sí solas.
- Las rutas de llamada locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin alternativa remota que lo enmascare).
- `gateway.remote.tlsFingerprint` fija el certificado TLS remoto al usar `wss://`, incluido el modo directo de macOS. Sin un pin configurado o almacenado previamente, macOS solo fija un certificado de primer uso después de que pase la confianza normal del sistema; los gateways autofirmados o de CA privada en los que macOS aún no confía necesitan una huella explícita o Remote over SSH.
- **Tailscale Serve** puede autenticar el tráfico de la UI de control/WebSocket mediante encabezados de identidad
  cuando `gateway.auth.allowTailscale: true`; los endpoints de la API HTTP no
  usan esa autenticación de encabezado de Tailscale y en su lugar siguen el modo
  de autenticación HTTP normal del gateway. Este flujo sin token asume que el host del gateway es de confianza. Establécelo en
  `false` si quieres autenticación con secreto compartido en todas partes.
- La autenticación **trusted-proxy** espera configuraciones de proxy con identidad que no sean loopback de forma predeterminada.
  Los proxies inversos de loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Trata el control desde navegador como acceso de operador: solo tailnet + emparejamiento deliberado de nodos.

Análisis detallado: [Seguridad](/es/gateway/security).

### macOS: túnel SSH persistente mediante LaunchAgent

Para clientes macOS que se conectan a un gateway remoto, la configuración persistente más sencilla usa una entrada de configuración SSH `LocalForward` más un LaunchAgent para mantener vivo el túnel entre reinicios y fallos.

#### Paso 1: añade la configuración SSH

Edita `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Reemplaza `<REMOTE_IP>` y `<REMOTE_USER>` por tus valores.

#### Paso 2: copia la clave SSH (una sola vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Paso 3: configura el token del gateway

Almacena el token en la configuración para que persista entre reinicios:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Paso 4: crea el LaunchAgent

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

#### Paso 5: carga el LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

El túnel se iniciará automáticamente al iniciar sesión, se reiniciará si falla y mantendrá activo el puerto reenviado.

<Note>
Si tienes un LaunchAgent `com.openclaw.ssh-tunnel` sobrante de una configuración anterior, descárgalo y elimínalo.
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
