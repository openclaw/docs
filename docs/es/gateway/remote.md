---
read_when:
    - Ejecutar o solucionar problemas de configuraciones de Gateway remoto
summary: Acceso remoto mediante Gateway WS, túneles SSH y tailnets
title: Acceso remoto
x-i18n:
    generated_at: "2026-07-03T23:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Este repositorio admite acceso remoto al Gateway manteniendo un único Gateway (el maestro) ejecutándose en un host dedicado (escritorio/servidor) y conectando clientes a él.

- Para **operadores (tú / la app de macOS)**: WebSocket directo por LAN/Tailnet es lo más sencillo cuando el Gateway es alcanzable; el túnel SSH es la alternativa universal.
- Para **nodos (iOS/Android y dispositivos futuros)**: conéctalos al **WebSocket** del Gateway (LAN/tailnet o túnel SSH según sea necesario).

## La idea central

- El WebSocket del Gateway normalmente se enlaza a **loopback** en tu puerto configurado (18789 de forma predeterminada).
- Para uso remoto, expónlo mediante Tailscale Serve o un enlace confiable de LAN/Tailnet, o reenvía el puerto loopback por SSH.

## Configuraciones comunes de VPN y tailnet

Piensa en el **host del Gateway** como el lugar donde vive el agente. Es dueño de sesiones, perfiles de autenticación, canales y estado. Tu portátil, escritorio y nodos se conectan a ese host.

### Gateway siempre activo en tu tailnet

Ejecuta el Gateway en un host persistente (VPS o servidor doméstico) y accede a él mediante **Tailscale** o SSH.

- **Mejor UX:** mantén `gateway.bind: "loopback"` y usa **Tailscale Serve** para la Control UI.
- **LAN/Tailnet confiable:** enlaza el Gateway a una interfaz privada y conéctate directamente con `gateway.remote.transport: "direct"`.
- **Alternativa:** mantén loopback más un túnel SSH desde cualquier máquina que necesite acceso.
- **Ejemplos:** [exe.dev](/es/install/exe-dev) (VM sencilla) o [Hetzner](/es/install/hetzner) (VPS de producción).

Ideal cuando tu portátil entra en reposo a menudo, pero quieres que el agente esté siempre activo.

### El escritorio doméstico ejecuta el Gateway

El portátil **no** ejecuta el agente. Se conecta remotamente:

- Usa el modo remoto de la app de macOS (Ajustes → General → OpenClaw se ejecuta).
- La app se conecta directamente cuando el Gateway es alcanzable por LAN/Tailnet, o abre y gestiona un túnel SSH cuando eliges SSH.

Runbook: [acceso remoto en macOS](/es/platforms/mac/remote).

### El portátil ejecuta el Gateway

Mantén el Gateway local, pero expónlo de forma segura:

- Túnel SSH hacia el portátil desde otras máquinas, o
- Tailscale Serve para la Control UI y mantener el Gateway solo en loopback.

Guías: [Tailscale](/es/gateway/tailscale) y [resumen web](/es/web).

## Flujo de comandos (qué se ejecuta dónde)

Un servicio Gateway posee el estado + los canales. Los nodos son periféricos.

Ejemplo de flujo (Telegram → nodo):

- Un mensaje de Telegram llega al **Gateway**.
- El Gateway ejecuta el **agente** y decide si debe llamar a una herramienta del nodo.
- El Gateway llama al **nodo** a través del WebSocket del Gateway (`node.*` RPC).
- El nodo devuelve el resultado; el Gateway responde de vuelta a Telegram.

Notas:

- **Los nodos no ejecutan el servicio Gateway.** Solo debe ejecutarse un Gateway por host, a menos que ejecutes perfiles aislados intencionalmente (consulta [Múltiples gateways](/es/gateway/multiple-gateways)).
- El “modo nodo” de la app de macOS es solo un cliente de nodo sobre el WebSocket del Gateway.

## Túnel SSH (CLI + herramientas)

Crea un túnel local al Gateway WS remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con el túnel activo:

- `openclaw health` y `openclaw status --deep` ahora alcanzan el Gateway remoto mediante `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` y `openclaw gateway call` también pueden apuntar a la URL reenviada mediante `--url` cuando sea necesario.

<Note>
Reemplaza `18789` por tu `gateway.port` configurado (o `--port` u `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Cuando pasas `--url`, la CLI no recurre a credenciales de configuración o entorno. Incluye `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
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

Cuando el Gateway está solo en loopback, mantén la URL en `ws://127.0.0.1:18789` y abre primero el túnel SSH.
En el transporte de túnel SSH de la app de macOS, los nombres de host del Gateway descubiertos pertenecen a
`gateway.remote.sshTarget`; `gateway.remote.url` sigue siendo la URL del túnel local.
Si esos puertos difieren, configura `gateway.remote.remotePort` con el puerto del Gateway en
el host SSH.
La verificación de clave de host es estricta de forma predeterminada. Los alias gestionados pueden usar explícitamente
su política de confianza efectiva de OpenSSH con
`gateway.remote.sshHostKeyPolicy: "openssh"`; revisa la configuración SSH correspondiente de usuario y sistema
antes de activarla.

Para un Gateway que ya es alcanzable en una LAN o Tailnet confiable, usa el modo directo:

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

La resolución de credenciales del Gateway sigue un contrato compartido en las rutas de llamada/sondeo/estado y la supervisión de aprobación de ejecución en Discord. Node-host usa el mismo contrato base con una excepción de modo local (ignora intencionalmente `gateway.remote.*`):

- Las credenciales explícitas (`--token`, `--password` o `gatewayToken` de herramienta) siempre prevalecen en rutas de llamada que aceptan autenticación explícita.
- Seguridad de anulación de URL:
  - Las anulaciones de URL de la CLI (`--url`) nunca reutilizan credenciales implícitas de configuración/entorno.
  - Las anulaciones de URL de entorno (`OPENCLAW_GATEWAY_URL`) pueden usar solo credenciales de entorno (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valores predeterminados del modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (la alternativa remota se aplica solo cuando la entrada de token de autenticación local no está definida)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (la alternativa remota se aplica solo cuando la entrada de contraseña de autenticación local no está definida)
- Valores predeterminados del modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Excepción de modo local de Node-host: `gateway.remote.token` / `gateway.remote.password` se ignoran.
- Las comprobaciones de token de sondeo/estado remoto son estrictas de forma predeterminada: usan solo `gateway.remote.token` (sin alternativa de token local) cuando apuntan al modo remoto.
- Las anulaciones de entorno del Gateway usan solo `OPENCLAW_GATEWAY_*`.

## Acceso remoto a la interfaz de chat

WebChat ya no usa un puerto HTTP separado. La interfaz de chat de SwiftUI se conecta directamente al WebSocket del Gateway.

- Reenvía `18789` por SSH (consulta arriba), luego conecta clientes a `ws://127.0.0.1:18789`.
- Para el modo directo LAN/Tailnet, conecta clientes a la URL privada `ws://` configurada o a una URL segura `wss://`.
- En macOS, prefiere el modo remoto de la app, que gestiona automáticamente el transporte seleccionado.

## Modo remoto de la app de macOS

La app de barra de menús de macOS puede controlar la misma configuración de punta a punta (comprobaciones de estado remoto, WebChat y reenvío de Voice Wake).

Runbook: [acceso remoto en macOS](/es/platforms/mac/remote).

## Reglas de seguridad (remoto/VPN)

Versión corta: **mantén el Gateway solo en loopback** a menos que tengas claro que necesitas un enlace.

- **Loopback + SSH/Tailscale Serve** es el valor predeterminado más seguro (sin exposición pública).
- `ws://` en texto claro se acepta para loopback, LAN, link-local, `.local`, `.ts.net` y hosts CGNAT de Tailscale. Los hosts remotos públicos deben usar `wss://`.
- Los **enlaces no loopback** (`lan`/`tailnet`/`custom`, o `auto` cuando loopback no está disponible) deben usar autenticación del Gateway: token, contraseña o un proxy inverso consciente de identidad con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` son fuentes de credenciales del cliente. **No** configuran la autenticación del servidor por sí solas.
- Las rutas de llamada local pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está definido.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla cerrada (sin enmascaramiento por alternativa remota).
- `gateway.remote.tlsFingerprint` fija el certificado TLS remoto cuando se usa `wss://`, incluido el modo directo de macOS. Sin un pin configurado o previamente almacenado, macOS solo fija un certificado de primer uso después de que pase la confianza normal del sistema; los gateways autofirmados o con CA privada en los que macOS aún no confía necesitan una huella explícita o Remoto sobre SSH.
- **Tailscale Serve** puede autenticar tráfico de Control UI/WebSocket mediante encabezados
  de identidad cuando `gateway.auth.allowTailscale: true`; los endpoints de API HTTP no
  usan esa autenticación de encabezado de Tailscale y en su lugar siguen el modo normal de autenticación HTTP
  del Gateway. Este flujo sin token asume que el host del Gateway es confiable. Configúralo en
  `false` si quieres autenticación con secreto compartido en todas partes.
- La autenticación **trusted-proxy** espera configuraciones no loopback de proxy consciente de identidad de forma predeterminada.
  Los proxies inversos loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Trata el control desde navegador como acceso de operador: solo tailnet + emparejamiento deliberado de nodos.

Análisis profundo: [Seguridad](/es/gateway/security).

### macOS: túnel SSH persistente mediante LaunchAgent

Para clientes macOS que se conectan a un Gateway remoto, la configuración persistente más sencilla usa una entrada de configuración SSH `LocalForward` más un LaunchAgent para mantener vivo el túnel entre reinicios y fallos.

#### Paso 1: agregar configuración SSH

Edita `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Reemplaza `<REMOTE_IP>` y `<REMOTE_USER>` con tus valores.

#### Paso 2: copiar la clave SSH (una vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Paso 3: configurar el token del Gateway

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
- [Configuración de Gateway remoto](/es/gateway/remote-gateway-readme)
