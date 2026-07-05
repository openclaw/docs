---
read_when:
    - Instalar OpenClaw en Windows
    - Elegir entre Windows Hub, Windows nativo y WSL2
    - Configurar la aplicación complementaria de Windows o el modo de nodo de Windows
summary: 'Compatibilidad con Windows: Windows Hub, CLI y Gateway nativos, configuración del gateway de WSL2, modo de nodo y solución de problemas'
title: Windows
x-i18n:
    generated_at: "2026-07-05T11:27:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1823abb4964082d1048cb80861fe1b6672e6709f29c875f98e503265b261e740
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw incluye una aplicación complementaria nativa **Windows Hub** y compatibilidad con la CLI de Windows.
Usa Windows Hub para una aplicación de escritorio con configuración, estado en la bandeja, chat, diagnósticos de Command
Center y capacidades de Node de Windows. Usa el instalador de PowerShell
directamente para la CLI/Gateway. Usa WSL2 para el runtime de Gateway más
compatible con Linux.

## Recomendado: Windows Hub

Windows Hub es la aplicación complementaria nativa de WinUI para Windows 10 20H2+ y
Windows 11. Se instala sin privilegios de administrador y se distribuye como instaladores
x64 y ARM64 firmados en las versiones de OpenClaw.

Descarga el instalador estable más reciente desde la
[página de versiones de OpenClaw](https://github.com/openclaw/openclaw/releases) o
directamente mediante `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)
- [Sumas de comprobación](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-SHA256SUMS.txt)

Si un enlace anterior devuelve 404, visita la [página de versiones](https://github.com/openclaw/openclaw/releases)
y busca los recursos `OpenClawCompanion-Setup-*` en la versión más reciente.

Después de la instalación, inicia **OpenClaw Companion** desde el menú Inicio o la
bandeja del sistema. El instalador también añade accesos directos para la configuración de Gateway, Chat, Ajustes,
Buscar actualizaciones y desinstalar.

### Qué incluye Windows Hub

- Estado en la bandeja del sistema e inicio al iniciar sesión.
- Configuración inicial para un Gateway WSL local propiedad de la aplicación.
- Ajustes de conexión para Gateways locales, remotos y con túnel SSH.
- Ventana de chat nativa y acceso a la Control UI del navegador.
- Diagnósticos de Command Center para sesiones, uso, canales, nodes, emparejamiento
  y comandos de reparación.
- Modo de Node de Windows para lienzo, pantalla, cámara,
  notificaciones, estado del dispositivo, habla y `system.run` controlado por el agente.
- Modo de servidor MCP local para clientes MCP como Claude Desktop, Claude Code
  y Cursor.

### Primer inicio

En el primer inicio, Windows Hub abre la configuración cuando no hay ningún
Gateway guardado utilizable. La ruta más rápida es **Configurar localmente**, que aprovisiona una
distribución WSL `OpenClawGateway` propiedad de la aplicación, instala el Gateway dentro de ella y
empareja la aplicación. Esto no exporta ni modifica tu distribución Ubuntu existente.

Elige **Configuración avanzada** o abre la pestaña Conexiones cuando ya tengas un
Gateway. Puedes conectarte a:

- un Gateway local en este PC
- un Gateway WSL en este PC
- un Gateway remoto por URL y token o código de configuración
- un Gateway accesible mediante un túnel SSH

Cuando termina la configuración, el icono de la bandeja se vuelve verde. Abre **Command Center** desde
la bandeja para confirmar la conexión, el emparejamiento, el estado del Node y la salud de los canales.

## Modo de Node de Windows

Windows Hub puede registrarse como un Node de OpenClaw para que el agente pueda usar las capacidades
nativas de Windows declaradas a través del Gateway. Los comandos de Node deben ser
declarados por el Node y permitidos por la política de Gateway antes de ejecutarse; consulta
[Nodes](/es/nodes#command-policy) para ver el modelo completo de permitir/denegar.

Comandos comunes:

| Familia | Comandos                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| Lienzo | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Pantalla | `screen.snapshot`; `screen.record` requiere participación explícita                          |
| Cámara | `camera.list`; `camera.snap`, `camera.clip` requieren participación explícita                  |
| Sistema | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Dispositivo | `location.get`, `device.info`, `device.status`                                       |
| Habla   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

El modo de Node requiere emparejamiento con Gateway. Si la aplicación muestra una solicitud de emparejamiento,
apruébala desde el host de Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

El Gateway solo reenvía los comandos que el Node declara y que la política del servidor
permite. Los comandos sensibles para la privacidad, como `screen.record`, `camera.snap`
y `camera.clip`, necesitan una participación explícita en `gateway.nodes.allowCommands`.

## Modo MCP local

Windows Hub puede exponer el mismo registro de capacidades nativas de Windows como servidor
MCP local en loopback, para que los clientes MCP locales puedan controlar capacidades de Windows
sin un Gateway de OpenClaw en ejecución.

Actívalo en los Ajustes de Windows Hub, en la sección de desarrollador/avanzada. La
aplicación muestra el endpoint de loopback y el token bearer una vez activado el servidor.

Matriz de modos:

| Modo de Node | Servidor MCP | Comportamiento                           |
| --------- | ---------- | ---------------------------------- |
| desactivado       | desactivado        | Aplicación de escritorio solo para el operador          |
| activado        | desactivado        | Node de Windows conectado a Gateway     |
| desactivado       | activado         | Solo servidor MCP local              |
| activado        | activado         | Node de Gateway más servidor MCP local |

## CLI y Gateway nativos de Windows

Para uso centrado en la terminal, instala OpenClaw desde PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifica:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

El inicio gestionado usa Tareas programadas de Windows cuando están disponibles. La tarea mantiene
el script legible `gateway.cmd` en el directorio de estado de OpenClaw, pero lo inicia
mediante un contenedor WScript `gateway.vbs` generado, de modo que el Gateway en segundo plano
no abre una ventana de consola visible. Si se deniega la creación de la tarea, OpenClaw
recurre a un elemento de inicio de sesión en la carpeta Inicio por usuario.

Instala el servicio Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Para uso solo de CLI sin un servicio Gateway gestionado:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 sigue siendo el runtime de Gateway más compatible con Linux en Windows. Windows
Hub puede configurar por ti un Gateway WSL propiedad de la aplicación, o puedes instalarlo manualmente dentro
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

Para configuraciones WSL sin interfaz, asegúrate de que toda la cadena de arranque se ejecute aunque nadie
inicie sesión en Windows.

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

Sustituye `Ubuntu` por el nombre de tu distribución desde:

```powershell
wsl --list --verbose
```

<Note>
Dos cambios respecto a recetas anteriores:

- **`dbus-launch true` en lugar de `/bin/true`**: en WSL >= 2.6.1.0, una
  regresión ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  termina la distribución por inactividad 15-20 segundos después de que sale el último cliente, incluso
  con linger activado. `dbus-launch true` mantiene vivo un proceso hijo de init
  como solución alternativa (discusión de la comunidad, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` en lugar de `/ru SYSTEM`**: las distribuciones WSL por usuario (la
  configuración predeterminada) no son visibles para la cuenta SYSTEM, por lo que la tarea parece
  ejecutarse, pero la distribución nunca se inicia. Ejecutarla con tu propia cuenta evita
  esto; Windows solicita tu contraseña cuando se crea la tarea.

</Note>

Después de reiniciar, verifica desde WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Exponer servicios WSL por LAN

WSL tiene su propia red virtual. Si otra máquina debe alcanzar un servicio
dentro de WSL, reenvía un puerto de Windows a la IP actual de WSL. La IP de WSL puede
cambiar después de reinicios, así que actualiza la regla de reenvío cuando sea necesario.

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

- SSH desde otra máquina apunta a la IP del host Windows, por ejemplo `ssh user@windows-host -p 2222`.
- Los Nodes remotos deben apuntar a una URL de Gateway alcanzable, no a `127.0.0.1`.
- Usa `listenaddress=0.0.0.0` para acceso LAN, `127.0.0.1` para acceso solo local.

## Solución de problemas

### El icono de la bandeja no aparece

Comprueba en el Administrador de tareas si existe `OpenClaw.Tray.WinUI.exe`. Si está en ejecución, abre el
área de iconos ocultos de la bandeja y fíjalo. Si no, inicia **OpenClaw Companion** desde
el menú Inicio.

### La configuración local falla

Abre el registro de configuración desde Windows Hub o inspecciona:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Causas comunes: WSL desactivado, virtualización bloqueada, estado WSL
obsoleto propiedad de la aplicación o un fallo de red al instalar el paquete Gateway.

### La aplicación dice que se requiere emparejamiento

Aprueba la solicitud de operador o Node desde el Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Si el dispositivo ya tenía un token, vuelve a conectarlo desde la pestaña Conexiones después de
la aprobación.

### El chat web no puede alcanzar un Gateway remoto

El chat web remoto necesita HTTPS o localhost. Para certificados autofirmados, confía
en el certificado en Windows o usa un túnel SSH hacia una URL localhost.

### Fallan los comandos `screen.snapshot`, cámara o audio

Confirma los permisos de Windows para cámara, micrófono, captura de pantalla y
notificaciones. Las instalaciones empaquetadas declaran las capacidades protegidas, pero
Windows aún puede solicitar confirmación la primera vez que un comando las usa.

### Falla la conectividad con Git o GitHub

Algunas redes bloquean o limitan HTTPS hacia GitHub. Si `git clone` o
`gh auth login` falla, prueba otra red, una VPN o un proxy HTTP/HTTPS.

Para autenticación de `gh` basada en token en la sesión actual:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Nunca confirmes tokens ni los pegues en incidencias o pull requests.

## Relacionado

- [Resumen de instalación](/es/install)
- [Configuración de Node.js](/es/install/node)
- [Nodes](/es/nodes)
- [Control UI](/es/web/control-ui)
- [Configuración de Gateway](/es/gateway/configuration)
