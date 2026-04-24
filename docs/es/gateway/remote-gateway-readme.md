---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Configuración de túnel SSH para que OpenClaw.app se conecte a un Gateway remoto
title: Configuración de Gateway remoto
x-i18n:
    generated_at: "2026-04-24T05:30:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc5df551839db87a36be7c1b29023c687c418d13337075490436335a8bb1635d
    source_path: gateway/remote-gateway-readme.md
    workflow: 15
---

> Este contenido se ha fusionado en [Acceso remoto](/es/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Consulta esa página para ver la guía actual.

# Ejecutar OpenClaw.app con un Gateway remoto

OpenClaw.app usa tunelización SSH para conectarse a un Gateway remoto. Esta guía muestra cómo configurarlo.

## Resumen

```mermaid
flowchart TB
    subgraph Client["Client Machine"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(local port)"]
        T["SSH Tunnel"]

        A --> B
        B --> T
    end
    subgraph Remote["Remote Machine"]
        direction TB
        C["Gateway WebSocket"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Configuración rápida

### Paso 1: añadir configuración SSH

Edita `~/.ssh/config` y añade:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # p. ej., 172.27.187.184
    User <REMOTE_USER>            # p. ej., jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Sustituye `<REMOTE_IP>` y `<REMOTE_USER>` por tus valores.

### Paso 2: copiar la clave SSH

Copia tu clave pública a la máquina remota (introduce la contraseña una vez):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Paso 3: configurar la autenticación del Gateway remoto

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Usa `gateway.remote.password` en su lugar si tu Gateway remoto usa autenticación por contraseña.
`OPENCLAW_GATEWAY_TOKEN` sigue siendo válido como sobrescritura a nivel de shell, pero la
configuración duradera del cliente remoto es `gateway.remote.token` / `gateway.remote.password`.

### Paso 4: iniciar el túnel SSH

```bash
ssh -N remote-gateway &
```

### Paso 5: reiniciar OpenClaw.app

```bash
# Cierra OpenClaw.app (⌘Q) y luego vuelve a abrirla:
open /path/to/OpenClaw.app
```

Ahora la app se conectará al Gateway remoto a través del túnel SSH.

---

## Inicio automático del túnel al iniciar sesión

Para que el túnel SSH se inicie automáticamente cuando inicies sesión, crea un Launch Agent.

### Crear el archivo PLIST

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

### Cargar el Launch Agent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Ahora el túnel:

- Se iniciará automáticamente al iniciar sesión
- Se reiniciará si falla
- Seguirá ejecutándose en segundo plano

Nota heredada: elimina cualquier LaunchAgent `com.openclaw.ssh-tunnel` sobrante si existe.

---

## Solución de problemas

**Comprobar si el túnel está en ejecución:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**Reiniciar el túnel:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**Detener el túnel:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Cómo funciona

| Componente                           | Qué hace                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Reenvía el puerto local 18789 al puerto remoto 18789         |
| `ssh -N`                             | SSH sin ejecutar comandos remotos (solo reenvío de puertos)  |
| `KeepAlive`                          | Reinicia automáticamente el túnel si falla                   |
| `RunAtLoad`                          | Inicia el túnel cuando se carga el agente                    |

OpenClaw.app se conecta a `ws://127.0.0.1:18789` en tu máquina cliente. El túnel SSH reenvía esa conexión al puerto 18789 de la máquina remota donde se está ejecutando el Gateway.

## Relacionado

- [Acceso remoto](/es/gateway/remote)
- [Tailscale](/es/gateway/tailscale)
