---
read_when:
    - Instalación de OpenClaw en Windows
    - Elegir entre Windows nativo y WSL2
    - Buscando el estado de la aplicación complementaria de Windows
summary: 'Soporte para Windows: rutas de instalación nativa y en WSL2, demonio y salvedades actuales'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw admite tanto **Windows nativo** como **WSL2**. WSL2 es la ruta más
estable y recomendada para la experiencia completa: la CLI, el Gateway y las
herramientas se ejecutan dentro de Linux con compatibilidad completa. Windows nativo funciona para
el uso básico de la CLI y el Gateway, con algunas salvedades indicadas abajo.

Las aplicaciones complementarias nativas para Windows están planificadas.

## WSL2 (recomendado)

- [Primeros pasos](/es/start/getting-started) (usar dentro de WSL)
- [Instalación y actualizaciones](/es/install/updating)
- Guía oficial de WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Estado de Windows nativo

Los flujos de la CLI en Windows nativo están mejorando, pero WSL2 sigue siendo la ruta recomendada.

Lo que funciona bien hoy en Windows nativo:

- instalador del sitio web mediante `install.ps1`
- uso local de la CLI, como `openclaw --version`, `openclaw doctor` y `openclaw plugins list --json`
- prueba de humo de agente/proveedor local integrado como:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Salvedades actuales:

- `openclaw onboard --non-interactive` todavía espera un gateway local accesible, a menos que pases `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` y `openclaw gateway install` intentan usar primero las Tareas programadas de Windows
- si se deniega la creación de la Tarea programada, OpenClaw recurre a un elemento de inicio de sesión en la carpeta Inicio por usuario e inicia el gateway inmediatamente
- si `schtasks` se bloquea o deja de responder, OpenClaw ahora aborta rápidamente esa ruta y recurre a la alternativa en lugar de quedarse colgado indefinidamente
- las Tareas programadas siguen siendo preferibles cuando están disponibles porque proporcionan un mejor estado de supervisor

Si solo quieres la CLI nativa, sin instalar el servicio del gateway, usa una de estas opciones:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Si quieres inicio administrado en Windows nativo:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Si la creación de Tareas programadas está bloqueada, el modo de servicio alternativo sigue iniciándose automáticamente después del inicio de sesión a través de la carpeta Inicio del usuario actual.

## Gateway

- [Runbook del Gateway](/es/gateway)
- [Configuración](/es/gateway/configuration)

## Instalación del servicio del Gateway (CLI)

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

Selecciona **Servicio del Gateway** cuando se solicite.

Reparar/migrar:

```
openclaw doctor
```

## Inicio automático del Gateway antes del inicio de sesión de Windows

Para configuraciones sin pantalla, asegúrate de que toda la cadena de arranque se ejecute incluso cuando nadie inicie sesión en
Windows.

### 1) Mantener los servicios de usuario en ejecución sin inicio de sesión

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

En PowerShell como administrador:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Reemplaza `Ubuntu` por el nombre de tu distribución de:

```powershell
wsl --list --verbose
```

### Verificar la cadena de inicio

Después de reiniciar (antes de iniciar sesión en Windows), comprueba desde WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avanzado: exponer servicios de WSL en la LAN (portproxy)

WSL tiene su propia red virtual. Si otra máquina necesita acceder a un servicio
que se ejecuta **dentro de WSL** (SSH, un servidor TTS local o el Gateway), debes
reenviar un puerto de Windows a la IP actual de WSL. La IP de WSL cambia después de reinicios,
por lo que es posible que tengas que actualizar la regla de reenvío.

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

Permite el puerto a través del Firewall de Windows (una sola vez):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Actualiza el portproxy después de que WSL se reinicie:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Notas:

- SSH desde otra máquina apunta a la **IP del host Windows** (ejemplo: `ssh user@windows-host -p 2222`).
- Los nodos remotos deben apuntar a una URL del Gateway **accesible** (no `127.0.0.1`); usa
  `openclaw status --all` para confirmarlo.
- Usa `listenaddress=0.0.0.0` para acceso LAN; `127.0.0.1` lo mantiene solo local.
- Si quieres que esto sea automático, registra una Tarea programada para ejecutar el paso de actualización
  al iniciar sesión.

## Instalación de WSL2 paso a paso

### 1) Instalar WSL2 + Ubuntu

Abre PowerShell (administrador):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Reinicia si Windows lo solicita.

### 2) Habilitar systemd (necesario para instalar el gateway)

En tu terminal de WSL:

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

Vuelve a abrir Ubuntu y verifica:

```bash
systemctl --user status
```

### 3) Instalar OpenClaw (dentro de WSL)

Para una configuración normal por primera vez dentro de WSL, sigue el flujo de Primeros pasos de Linux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Si estás desarrollando desde el código fuente en lugar de hacer la incorporación inicial, usa el
bucle de desarrollo desde código fuente de [Configuración](/es/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Guía completa: [Primeros pasos](/es/start/getting-started)

## Aplicación complementaria para Windows

Todavía no tenemos una aplicación complementaria para Windows. Las contribuciones son bienvenidas si quieres
ayudar a hacerla realidad.

## Conectividad de Git y GitHub (colaboradores)

Algunas redes bloquean o limitan HTTPS hacia GitHub. Si `git clone` falla con tiempos de espera
o reinicios de conexión, prueba otra red, una VPN o un proxy HTTP/HTTPS proporcionado por tu
organización.

Si `gh auth login` falla durante el flujo de dispositivo del navegador (por ejemplo, un tiempo de espera
al acceder a `github.com:443`), autentícate con un token de acceso personal en su lugar:

1. Crea un token con al menos el alcance `repo` (PAT clásico) o acceso
   detallado equivalente.
2. En PowerShell para la sesión actual:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. Si `gh auth status` advierte que falta `read:org`, genera un token que incluya
   ese alcance y reasigna la variable:

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org` solo se aplica cuando te autenticaste mediante `gh auth login`
y tienes credenciales almacenadas para actualizar (no cuando usas `GH_TOKEN`).

Nunca confirmes tokens ni los pegues en issues o pull requests.

## Relacionado

- [Resumen de instalación](/es/install)
- [Plataformas](/es/platforms)
