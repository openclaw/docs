---
read_when:
    - Instalar OpenClaw en Windows
    - Elegir entre Windows nativo y WSL2
    - Consultar el estado de la aplicación complementaria de Windows
summary: 'Compatibilidad con Windows: rutas de instalación nativas y con WSL2, daemon y limitaciones actuales'
title: Windows
x-i18n:
    generated_at: "2026-04-20T05:21:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw es compatible tanto con **Windows nativo** como con **WSL2**. WSL2 es la
ruta más estable y la recomendada para la experiencia completa: la CLI, Gateway y
las herramientas se ejecutan dentro de Linux con compatibilidad total. Windows nativo funciona para
el uso básico de la CLI y de Gateway, con algunas limitaciones indicadas más abajo.

Las aplicaciones complementarias nativas para Windows están previstas.

## WSL2 (recomendado)

- [Primeros pasos](/es/start/getting-started) (úsalo dentro de WSL)
- [Instalación y actualizaciones](/es/install/updating)
- Guía oficial de WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Estado de Windows nativo

Los flujos de la CLI nativa en Windows están mejorando, pero WSL2 sigue siendo la ruta recomendada.

Lo que funciona bien hoy en Windows nativo:

- instalador del sitio web mediante `install.ps1`
- uso local de la CLI como `openclaw --version`, `openclaw doctor` y `openclaw plugins list --json`
- pruebas básicas integradas de agente/proveedor local como:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Limitaciones actuales:

- `openclaw onboard --non-interactive` sigue esperando un gateway local accesible a menos que pases `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` y `openclaw gateway install` intentan primero usar Windows Scheduled Tasks
- si se deniega la creación de Scheduled Task, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta Startup del usuario y arranca el gateway inmediatamente
- si `schtasks` se bloquea o deja de responder, OpenClaw ahora abandona esa ruta rápidamente y recurre a la alternativa en lugar de quedarse colgado indefinidamente
- Scheduled Tasks siguen siendo la opción preferida cuando están disponibles porque proporcionan un mejor estado del supervisor

Si quieres solo la CLI nativa, sin instalar el servicio de gateway, usa una de estas opciones:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Si sí quieres inicio administrado en Windows nativo:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Si la creación de Scheduled Task está bloqueada, el modo de servicio alternativo seguirá iniciándose automáticamente después del inicio de sesión mediante la carpeta Startup del usuario actual.

## Gateway

- [Guía operativa de Gateway](/es/gateway)
- [Configuración](/es/gateway/configuration)

## Instalación del servicio de Gateway (CLI)

Dentro de WSL2:

```
openclaw onboard --install-daemon
```

O bien:

```
openclaw gateway install
```

O bien:

```
openclaw configure
```

Selecciona **Servicio de Gateway** cuando se te solicite.

Reparar/migrar:

```
openclaw doctor
```

## Inicio automático de Gateway antes del inicio de sesión en Windows

Para configuraciones sin interfaz, asegúrate de que toda la cadena de arranque se ejecute incluso cuando nadie inicie sesión en
Windows.

### 1) Mantener los servicios de usuario en ejecución sin iniciar sesión

Dentro de WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Instalar el servicio de usuario de Gateway de OpenClaw

Dentro de WSL:

```bash
openclaw gateway install
```

### 3) Iniciar WSL automáticamente al arrancar Windows

En PowerShell como administrador:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Reemplaza `Ubuntu` por el nombre de tu distribución obtenido con:

```powershell
wsl --list --verbose
```

### Verificar la cadena de inicio

Después de reiniciar (antes de iniciar sesión en Windows), comprueba desde WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avanzado: exponer servicios de WSL por la LAN (portproxy)

WSL tiene su propia red virtual. Si otra máquina necesita acceder a un servicio
que se ejecuta **dentro de WSL** (SSH, un servidor TTS local o Gateway), debes
redirigir un puerto de Windows a la IP actual de WSL. La IP de WSL cambia después de reinicios,
así que es posible que tengas que actualizar la regla de reenvío.

Ejemplo (PowerShell **como administrador**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Permite el puerto en Windows Firewall (una sola vez):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Actualiza el portproxy después de reiniciar WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Notas:

- El acceso SSH desde otra máquina apunta a la **IP del host Windows** (ejemplo: `ssh user@windows-host -p 2222`).
- Los nodos remotos deben apuntar a una URL de Gateway **accesible** (no `127.0.0.1`); usa
  `openclaw status --all` para confirmarlo.
- Usa `listenaddress=0.0.0.0` para acceso por LAN; `127.0.0.1` lo mantiene solo local.
- Si quieres automatizar esto, registra una Scheduled Task para ejecutar el paso de
  actualización al iniciar sesión.

## Instalación paso a paso de WSL2

### 1) Instalar WSL2 + Ubuntu

Abre PowerShell (Admin):

```powershell
wsl --install
# O elige una distribución explícitamente:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Reinicia si Windows lo solicita.

### 2) Habilitar systemd (obligatorio para instalar Gateway)

En tu terminal de WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Luego, desde PowerShell:

```powershell
wsl --shutdown
```

Vuelve a abrir Ubuntu y luego verifica:

```bash
systemctl --user status
```

### 3) Instalar OpenClaw (dentro de WSL)

Para una configuración inicial normal dentro de WSL, sigue el flujo de primeros pasos de Linux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Si estás desarrollando desde el código fuente en lugar de realizar la configuración inicial, usa el
bucle de desarrollo desde [Configuración](/es/start/setup):

```bash
pnpm install
# Solo la primera ejecución (o después de restablecer la configuración/espacio de trabajo local de OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

Guía completa: [Primeros pasos](/es/start/getting-started)

## Aplicación complementaria de Windows

Todavía no tenemos una aplicación complementaria para Windows. Las contribuciones son bienvenidas si quieres
contribuir a que esto suceda.
