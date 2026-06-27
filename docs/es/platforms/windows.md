---
read_when:
    - Instalar OpenClaw en Windows
    - Elegir entre Windows Hub, Windows nativo y WSL2
    - Configuración de la aplicación complementaria de Windows o del modo de nodo de Windows
summary: 'Compatibilidad con Windows: Windows Hub, CLI y Gateway nativos, configuración del gateway de WSL2, modo node y solución de problemas'
title: Windows
x-i18n:
    generated_at: "2026-06-27T12:04:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw incluye una aplicación complementaria nativa **Windows Hub** más compatibilidad con la CLI de Windows.
Usa Windows Hub cuando quieras una aplicación de escritorio con configuración, estado en la bandeja, chat,
diagnósticos del Centro de comandos y capacidades de nodo de Windows. Usa el instalador de PowerShell
cuando quieras la CLI/Gateway directamente. Usa WSL2 cuando quieras el entorno de ejecución de Gateway
más compatible con Linux.

## Recomendado: Windows Hub

Windows Hub es la aplicación complementaria nativa de WinUI para Windows 10 20H2+ y Windows 11. Se instala sin privilegios de administrador y se publica con instaladores
x64 y ARM64 firmados en las versiones de OpenClaw.

Descarga el instalador estable más reciente desde la [página de versiones de OpenClaw](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Sumas de comprobación](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Si un enlace de descarga anterior devuelve un 404, visita la [página de versiones](https://github.com/openclaw/openclaw/releases) y busca los recursos `OpenClawCompanion-Setup-*` en la versión más reciente.

Después de instalar, inicia **OpenClaw Companion** desde el menú Inicio o la bandeja del sistema.
El instalador también agrega accesos directos para Configuración de Gateway, Chat, Configuración,
Buscar actualizaciones y desinstalar.

### Qué incluye Windows Hub

- estado de la bandeja del sistema e inicio al iniciar sesión
- configuración inicial para un Gateway WSL local propiedad de la aplicación
- configuración de conexión para Gateways locales, remotos y con túnel SSH
- ventana de chat nativa más acceso a la interfaz de usuario de control en el navegador
- diagnósticos del Centro de comandos para sesiones, uso, canales, nodos, emparejamiento y
  comandos de reparación
- modo de nodo de Windows para canvas controlado por agente, pantalla, cámara, notificaciones,
  estado del dispositivo, texto a voz, voz a texto y `system.run` controlado
- modo de servidor MCP local para clientes MCP como Claude Desktop, Claude Code y
  Cursor

### Primer inicio

En el primer inicio, Windows Hub abre la configuración cuando no hay un Gateway guardado usable.
La ruta más rápida es **Configurar localmente**, que aprovisiona una distribución WSL
`OpenClawGateway` propiedad de la aplicación, instala el Gateway dentro de ella y empareja la aplicación.
Esto no exporta ni modifica tu distribución Ubuntu existente.

Elige **Configuración avanzada** o abre la pestaña Conexiones cuando ya tengas un
Gateway. Puedes conectarte a:

- un Gateway local en este PC
- un Gateway WSL en este PC
- un Gateway remoto por URL y token o código de configuración
- un Gateway alcanzado a través de un túnel SSH

Cuando finaliza la configuración, el icono de la bandeja se vuelve verde. Abre **Centro de comandos** desde la
bandeja para confirmar la conexión, el emparejamiento, el estado del nodo y la salud del canal.

## Modo de nodo de Windows

Windows Hub puede registrarse como un nodo OpenClaw de primera clase. Entonces el agente puede usar
capacidades nativas de Windows declaradas a través del Gateway.

Los comandos comunes incluyen:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` y, con aceptación explícita, `screen.record`
- `camera.list` y, con aceptación explícita, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

El modo de nodo requiere emparejamiento con Gateway. Si la aplicación muestra una solicitud de emparejamiento, apruébala
desde el host del Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

El Gateway solo reenvía comandos que el nodo declara y la política del servidor
permite. Los comandos sensibles para la privacidad como `screen.record`, `camera.snap` y
`camera.clip` requieren aceptación explícita de `gateway.nodes.allowCommands`.

## Modo MCP local

Windows Hub puede exponer el mismo registro de capacidades nativas de Windows como servidor
MCP local en loopback. Esto es útil cuando quieres que clientes MCP locales controlen
capacidades de Windows sin un Gateway de OpenClaw en ejecución.

Actívalo en la Configuración de Windows Hub, en la sección de desarrollador/avanzada. La aplicación
muestra el endpoint de loopback y el token bearer después de activar el servidor.

Matriz de modos:

| Modo de nodo | Servidor MCP | Comportamiento                           |
| --------- | ---------- | ---------------------------------- |
| desactivado       | desactivado        | Aplicación de escritorio solo para operador          |
| activado        | desactivado        | Nodo de Windows conectado a Gateway     |
| desactivado       | activado         | Solo servidor MCP local              |
| activado        | activado         | Nodo de Gateway más servidor MCP local |

## CLI y Gateway nativos de Windows

Para uso centrado en terminal, instala OpenClaw desde PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifica:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Los flujos nativos de CLI y Gateway de Windows son compatibles y siguen mejorando.
El inicio administrado usa Tareas programadas de Windows cuando están disponibles. La tarea conserva el
script legible `gateway.cmd` en el directorio de estado de OpenClaw, pero lo inicia mediante
un contenedor WScript `gateway.vbs` generado para que el Gateway en segundo plano no abra
una ventana de consola visible. Si se deniega la creación de la tarea, OpenClaw recurre a un
elemento de inicio de sesión en la carpeta Inicio por usuario.

Para instalar el servicio Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Si solo quieres usar la CLI sin un servicio Gateway administrado:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 sigue siendo el entorno de ejecución de Gateway más compatible con Linux en Windows. Windows Hub
puede configurar por ti un Gateway WSL propiedad de la aplicación, o puedes instalarlo manualmente dentro
de tu propia distribución.

Configuración manual:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Activa systemd dentro de WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Reinicia WSL desde PowerShell:

```powershell
wsl --shutdown
```

Luego instala OpenClaw dentro de WSL con el inicio rápido de Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Inicio automático de Gateway antes del inicio de sesión de Windows

Para configuraciones WSL sin interfaz, asegúrate de que toda la cadena de arranque se ejecute incluso cuando nadie inicie sesión
en Windows.

Dentro de WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

En PowerShell como administrador:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Reemplaza `Ubuntu` por el nombre de tu distribución desde:

```powershell
wsl --list --verbose
```

> **Nota:** Dos cambios respecto a recetas anteriores:
>
> - **`dbus-launch true` en lugar de `/bin/true`** — En WSL ≥ 2.6.1.0, una regresión ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) hace que la distribución termine por inactividad entre 15 y 20 segundos después de que sale el último cliente, incluso con linger activado. `dbus-launch true` mantiene vivo un proceso hijo de init como solución alternativa ([discusión de la comunidad, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` en lugar de `/ru SYSTEM`** — Las distribuciones WSL por usuario (la configuración predeterminada) no son visibles para la cuenta SYSTEM; la tarea parece ejecutarse, pero la distribución nunca se inicia. Ejecutarla como tu propia cuenta evita esto. Windows pedirá tu contraseña cuando se cree la tarea.

Después de reiniciar, verifica desde WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Exponer servicios WSL en la LAN

WSL tiene su propia red virtual. Si otra máquina debe alcanzar un servicio dentro de
WSL, reenvía un puerto de Windows a la IP actual de WSL. La IP de WSL puede cambiar después de
reinicios, así que actualiza la regla de reenvío cuando sea necesario.

Ejemplo en PowerShell como administrador:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Notas:

- SSH desde otra máquina apunta a la IP del host de Windows, por ejemplo
  `ssh user@windows-host -p 2222`.
- Los nodos remotos deben apuntar a una URL de Gateway alcanzable, no a `127.0.0.1`.
- Usa `listenaddress=0.0.0.0` para acceso LAN. Usa `127.0.0.1` para acceso
  solo local.

## Solución de problemas

### El icono de la bandeja no aparece

Comprueba el Administrador de tareas para `OpenClaw.Tray.WinUI.exe`. Si se está ejecutando, abre el
área de iconos ocultos de la bandeja y fíjalo. Si no se está ejecutando, inicia **OpenClaw
Companion** desde el menú Inicio.

### La configuración local falla

Abre el registro de configuración desde Windows Hub o inspecciona:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Las causas comunes son WSL desactivado, virtualización bloqueada, estado WSL
obsoleto propiedad de la aplicación o un fallo de red al instalar el paquete Gateway.

### La aplicación dice que se requiere emparejamiento

Aprueba la solicitud de operador o nodo desde el Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Si el dispositivo ya tenía un token, vuelve a conectar desde la pestaña Conexiones después de la
aprobación.

### El chat web no puede alcanzar un Gateway remoto

El chat web remoto necesita HTTPS o localhost. Para certificados autofirmados, confía
en el certificado en Windows, o usa un túnel SSH a una URL localhost.

### Fallan los comandos `screen.snapshot`, cámara o audio

Confirma los permisos de Windows para cámara, micrófono, captura de pantalla y
notificaciones. Las instalaciones empaquetadas declaran las capacidades protegidas, pero Windows
aún puede pedir confirmación la primera vez que un comando las use.

### Falla la conectividad con Git o GitHub

Algunas redes bloquean o limitan HTTPS hacia GitHub. Si `git clone` o `gh auth
login` falla, prueba otra red, una VPN o un proxy HTTP/HTTPS.

Para autenticación de `gh` basada en token en la sesión actual:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Nunca confirmes tokens ni los pegues en incidencias o solicitudes de cambios.

## Relacionado

- [Descripción general de instalación](/es/install)
- [Configuración de Node.js](/es/install/node)
- [Nodos](/es/nodes)
- [Interfaz de usuario de control](/es/web/control-ui)
- [Configuración de Gateway](/es/gateway/configuration)
