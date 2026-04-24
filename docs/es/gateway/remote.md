---
read_when:
    - Ejecutar o depurar configuraciones remotas del gateway
summary: Acceso remoto mediante túneles SSH (Gateway WS) y tailnets
title: Acceso remoto
x-i18n:
    generated_at: "2026-04-24T05:30:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3753f29d6b3cc3f1a2f749cc0fdfdd60dfde8822f0ec6db0e18e5412de0980da
    source_path: gateway/remote.md
    workflow: 15
---

# Acceso remoto (SSH, túneles y tailnets)

Este repositorio admite “remoto sobre SSH” manteniendo un solo Gateway (el maestro) ejecutándose en un host dedicado (escritorio/servidor) y conectando los clientes a él.

- Para **operadores (tú / la app de macOS)**: el túnel SSH es la alternativa universal.
- Para **Nodes (iOS/Android y futuros dispositivos)**: conéctate al **WebSocket** del Gateway (LAN/tailnet o túnel SSH según sea necesario).

## La idea central

- El WebSocket del Gateway se enlaza a **loopback** en el puerto configurado (predeterminado 18789).
- Para uso remoto, reenvías ese puerto loopback mediante SSH (o usas una tailnet/VPN y haces menos túneles).

## Configuraciones comunes de VPN/tailnet (donde vive el agente)

Piensa en el **host del Gateway** como “donde vive el agente”. Es propietario de las sesiones, perfiles de autenticación, canales y estado.
Tu portátil/escritorio (y Nodes) se conectan a ese host.

### 1) Gateway siempre activo en tu tailnet (VPS o servidor doméstico)

Ejecuta el Gateway en un host persistente y accede a él mediante **Tailscale** o SSH.

- **Mejor experiencia de uso:** mantén `gateway.bind: "loopback"` y usa **Tailscale Serve** para la IU de Control.
- **Alternativa:** mantén loopback + túnel SSH desde cualquier máquina que necesite acceso.
- **Ejemplos:** [exe.dev](/es/install/exe-dev) (VM fácil) o [Hetzner](/es/install/hetzner) (VPS de producción).

Esto es ideal cuando tu portátil entra en suspensión a menudo pero quieres que el agente esté siempre activo.

### 2) El escritorio de casa ejecuta el Gateway, el portátil es control remoto

El portátil **no** ejecuta el agente. Se conecta de forma remota:

- Usa el modo **Remote over SSH** de la app de macOS (Ajustes → General → “OpenClaw runs”).
- La app abre y gestiona el túnel, así que WebChat + comprobaciones de estado “simplemente funcionan”.

Runbook: [acceso remoto en macOS](/es/platforms/mac/remote).

### 3) El portátil ejecuta el Gateway, acceso remoto desde otras máquinas

Mantén el Gateway local pero expónlo de forma segura:

- Túnel SSH al portátil desde otras máquinas, o
- Publica la IU de Control con Tailscale Serve y mantén el Gateway solo en loopback.

Guía: [Tailscale](/es/gateway/tailscale) y [Resumen de la web](/es/web).

## Flujo de comandos (qué se ejecuta y dónde)

Un servicio de gateway es propietario del estado + canales. Los Nodes son periféricos.

Ejemplo de flujo (Telegram → Node):

- El mensaje de Telegram llega al **Gateway**.
- El Gateway ejecuta el **agente** y decide si llamar a una herramienta del Node.
- El Gateway llama al **Node** por el Gateway WebSocket (`node.*` RPC).
- El Node devuelve el resultado; el Gateway responde a Telegram.

Notas:

- **Los Nodes no ejecutan el servicio de gateway.** Solo debe ejecutarse un gateway por host, salvo que ejecutes intencionadamente perfiles aislados (consulta [Varios gateways](/es/gateway/multiple-gateways)).
- El “modo Node” de la app de macOS es solo un cliente Node sobre el Gateway WebSocket.

## Túnel SSH (CLI + herramientas)

Crea un túnel local al WS del Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con el túnel activo:

- `openclaw health` y `openclaw status --deep` ahora alcanzan el gateway remoto mediante `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` y `openclaw gateway call` también pueden apuntar a la URL reenviada mediante `--url` cuando sea necesario.

Nota: reemplaza `18789` por tu `gateway.port` configurado (o `--port`/`OPENCLAW_GATEWAY_PORT`).
Nota: cuando pasas `--url`, la CLI no recurre a credenciales de config o entorno.
Incluye `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.

## Valores predeterminados remotos de la CLI

Puedes persistir un destino remoto para que los comandos de la CLI lo usen por defecto:

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

## Precedencia de credenciales

La resolución de credenciales del Gateway sigue un contrato compartido entre rutas de call/probe/status y la supervisión de aprobación exec de Discord. El host de Node usa el mismo contrato base con una excepción en modo local (ignora intencionadamente `gateway.remote.*`):

- Las credenciales explícitas (`--token`, `--password` o la herramienta `gatewayToken`) siempre tienen prioridad en las rutas de llamada que aceptan autenticación explícita.
- Seguridad en sobrescrituras de URL:
  - Las sobrescrituras de URL de CLI (`--url`) nunca reutilizan credenciales implícitas de config/env.
  - Las sobrescrituras de URL por entorno (`OPENCLAW_GATEWAY_URL`) pueden usar solo credenciales de entorno (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valores predeterminados del modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (la alternativa remota se aplica solo cuando la entrada local del token de autenticación no está definida)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (la alternativa remota se aplica solo cuando la entrada local de la contraseña de autenticación no está definida)
- Valores predeterminados del modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Excepción del modo local del host de Node: `gateway.remote.token` / `gateway.remote.password` se ignoran.
- Las comprobaciones de token en probe/status remotos son estrictas por defecto: usan solo `gateway.remote.token` (sin alternativa al token local) cuando apuntan al modo remoto.
- Las sobrescrituras de entorno del Gateway usan solo `OPENCLAW_GATEWAY_*`.

## IU de chat sobre SSH

WebChat ya no usa un puerto HTTP independiente. La IU de chat SwiftUI se conecta directamente al Gateway WebSocket.

- Reenvía `18789` por SSH (consulta arriba) y luego conecta los clientes a `ws://127.0.0.1:18789`.
- En macOS, prefiere el modo “Remote over SSH” de la app, que gestiona el túnel automáticamente.

## App de macOS "Remote over SSH"

La app de barra de menú de macOS puede manejar la misma configuración de extremo a extremo (comprobaciones de estado remotas, WebChat y reenvío de activación por voz).

Runbook: [acceso remoto en macOS](/es/platforms/mac/remote).

## Reglas de seguridad (remoto/VPN)

Versión corta: **mantén el Gateway solo en loopback** salvo que estés seguro de que necesitas un bind.

- **Loopback + SSH/Tailscale Serve** es el valor predeterminado más seguro (sin exposición pública).
- `ws://` en texto plano es solo loopback por defecto. Para redes privadas de confianza,
  establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el proceso cliente como medida de emergencia.
- Los **binds no loopback** (`lan`/`tailnet`/`custom`, o `auto` cuando loopback no está disponible) deben usar autenticación del gateway: token, password o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` son fuentes de credenciales del cliente. **No** configuran por sí solas la autenticación del servidor.
- Las rutas de llamada locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está definido.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla con cierre por defecto (sin que la alternativa remota lo oculte).
- `gateway.remote.tlsFingerprint` fija el certificado TLS remoto cuando se usa `wss://`.
- **Tailscale Serve** puede autenticar tráfico de IU de Control/WebSocket mediante cabeceras de identidad cuando `gateway.auth.allowTailscale: true`; los endpoints de la API HTTP no usan esa autenticación por cabecera de Tailscale y siguen el modo normal de autenticación HTTP del gateway. Este flujo sin token asume que el host del gateway es de confianza. Establécelo en `false` si quieres autenticación con secreto compartido en todas partes.
- La autenticación **trusted-proxy** es solo para configuraciones con proxy con reconocimiento de identidad y bind no loopback.
  Los proxies inversos loopback en el mismo host no satisfacen `gateway.auth.mode: "trusted-proxy"`.
- Trata el control del navegador como acceso de operador: solo tailnet + emparejamiento deliberado de Node.

Profundización: [Seguridad](/es/gateway/security).

### macOS: túnel SSH persistente mediante LaunchAgent

Para clientes macOS que se conectan a un gateway remoto, la configuración persistente más sencilla usa una entrada SSH `LocalForward` más un LaunchAgent para mantener el túnel activo entre reinicios y fallos.

#### Paso 1: agregar configuración SSH

Edita `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Reemplaza `<REMOTE_IP>` y `<REMOTE_USER>` por tus valores.

#### Paso 2: copiar la clave SSH (una sola vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Paso 3: configurar el token del gateway

Guarda el token en la configuración para que persista entre reinicios:

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

Nota: si tienes un LaunchAgent `com.openclaw.ssh-tunnel` sobrante de una configuración anterior, descárgalo y elimínalo.

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
- [Configuración remota del gateway](/es/gateway/remote-gateway-readme)
