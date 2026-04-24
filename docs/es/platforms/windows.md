---
read_when:
    - Instalar OpenClaw en Windows
    - Elegir entre Windows nativo y WSL2
    - Buscar el estado de la app complementaria para Windows
summary: 'Compatibilidad con Windows: rutas de instalación nativa y WSL2, daemon y limitaciones actuales'
title: Windows
x-i18n:
    generated_at: "2026-04-24T05:39:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw admite tanto **Windows nativo** como **WSL2**. WSL2 es la ruta más
estable y la recomendada para la experiencia completa: la CLI, Gateway y las
herramientas se ejecutan dentro de Linux con compatibilidad total. Windows nativo
funciona para la CLI principal y el uso de Gateway, con algunas limitaciones indicadas más abajo.

Las apps complementarias nativas para Windows están planificadas.

## WSL2 (recomendado)

- [Getting Started](/es/start/getting-started) (úsalo dentro de WSL)
- [Instalación y actualizaciones](/es/install/updating)
- Guía oficial de WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Estado de Windows nativo

Los flujos de CLI nativos de Windows están mejorando, pero WSL2 sigue siendo la ruta recomendada.

Lo que funciona bien en Windows nativo hoy:

- instalador del sitio web mediante `install.ps1`
- uso local de CLI como `openclaw --version`, `openclaw doctor` y `openclaw plugins list --json`
- smoke embebido de agente/proveedor local como:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Limitaciones actuales:

- `openclaw onboard --non-interactive` sigue esperando un gateway local accesible a menos que pases `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` y `openclaw gateway install` intentan primero usar Tareas programadas de Windows
- si se deniega la creación de Tarea programada, OpenClaw usa como respaldo un elemento de inicio de sesión por usuario en la carpeta Startup e inicia el gateway inmediatamente
- si `schtasks` se bloquea o deja de responder, OpenClaw ahora aborta rápidamente esa ruta y usa el respaldo en lugar de quedarse colgado indefinidamente
- Las Tareas programadas siguen siendo preferibles cuando están disponibles porque proporcionan mejor estado del supervisor

Si quieres solo la CLI nativa, sin instalación del servicio gateway, usa una de estas opciones:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Si sí quieres inicio gestionado en Windows nativo:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Si la creación de la Tarea programada está bloqueada, el modo de servicio de respaldo seguirá iniciándose automáticamente tras el inicio de sesión mediante la carpeta Startup del usuario actual.

## Gateway

- [Guía operativa de Gateway](/es/gateway)
- [Configuración](/es/gateway/configuration)

## Instalación del servicio Gateway (CLI)

Dentro de WSL2:

```
openclaw onboard --install-daemon
```

O:

```
openclaw gateway install
```

O:

```
openclaw configure
```

Selecciona **Servicio Gateway** cuando se te solicite.

Reparar/migrar:

```
openclaw doctor
```

## Inicio automático de Gateway antes del inicio de sesión en Windows

Para configuraciones sin interfaz, asegúrate de que toda la cadena de arranque se ejecute incluso cuando nadie inicie sesión en
Windows.

### 1) Mantener servicios de usuario en ejecución sin inicio de sesión

Dentro de WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Instalar el servicio de usuario del gateway de OpenClaw

Dentro de WSL:

```bash
openclaw gateway install
```

### 3) Iniciar WSL automáticamente al arrancar Windows

En PowerShell como Administrador:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Reemplaza `Ubuntu` por el nombre de tu distribución desde:

```powershell
wsl --list --verbose
```

### Verificar la cadena de inicio

Después de reiniciar (antes de iniciar sesión en Windows), comprueba desde WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avanzado: exponer servicios de WSL por LAN (portproxy)

WSL tiene su propia red virtual. Si otra máquina necesita acceder a un servicio
que se ejecuta **dentro de WSL** (SSH, un servidor TTS local o Gateway), debes
reenviar un puerto de Windows a la IP actual de WSL. La IP de WSL cambia tras reinicios,
por lo que puede que necesites actualizar la regla de reenvío.

Ejemplo (PowerShell **como Administrador**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Permite el puerto en el Firewall de Windows (una sola vez):

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

- El SSH desde otra máquina debe apuntar a la **IP del host Windows** (ejemplo: `ssh user@windows-host -p 2222`).
- Los nodos remotos deben apuntar a una URL de Gateway **accesible** (no `127.0.0.1`); usa
  `openclaw status --all` para confirmarlo.
- Usa `listenaddress=0.0.0.0` para acceso por LAN; `127.0.0.1` lo mantiene solo local.
- Si quieres automatizarlo, registra una Tarea programada para ejecutar el paso de actualización
  al iniciar sesión.

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

### 2) Habilitar systemd (obligatorio para instalar el gateway)

En tu terminal WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Luego desde PowerShell:

```powershell
wsl --shutdown
```

Vuelve a abrir Ubuntu y luego verifica:

```bash
systemctl --user status
```

### 3) Instalar OpenClaw (dentro de WSL)

Para una configuración normal inicial dentro de WSL, sigue el flujo Linux de Getting Started:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Si estás desarrollando desde código fuente en lugar de hacer la incorporación inicial, usa el
bucle de desarrollo desde código fuente de [Setup](/es/start/setup):

```bash
pnpm install
# Solo la primera vez (o después de restablecer tu configuración/espacio de trabajo local de OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

Guía completa: [Getting Started](/es/start/getting-started)

## App complementaria de Windows

Todavía no tenemos una app complementaria para Windows. Las contribuciones son bienvenidas si quieres
hacerla realidad.

## Relacionado

- [Resumen de instalación](/es/install)
- [Plataformas](/es/platforms)
