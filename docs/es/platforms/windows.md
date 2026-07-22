---
read_when:
    - Instalación de OpenClaw en Windows
    - Elegir entre Windows Hub, Windows nativo y WSL2
    - Configuración de la aplicación complementaria para Windows o del modo Node de Windows
summary: 'Compatibilidad con Windows: Hub de Windows, CLI y Gateway nativos, configuración del Gateway en WSL2, modo Node y solución de problemas'
title: Windows
x-i18n:
    generated_at: "2026-07-22T10:39:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c231b81971e1df9f3ee4de1b102c25328c242109331c6465dc802ec003af722b
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw incluye una aplicación complementaria nativa **Windows Hub**, además de compatibilidad con la CLI en Windows.
Use Windows Hub para disponer de una aplicación de escritorio con configuración, estado en la bandeja, chat, diagnósticos de Command
Center y capacidades de Node en Windows. Use el instalador de PowerShell
directamente para la CLI/Gateway. Use WSL2 para obtener el entorno de ejecución de Gateway
más compatible con Linux.

## Recomendación: Windows Hub

Windows Hub es la aplicación complementaria WinUI nativa para Windows 10 20H2+ y
Windows 11. Se instala sin privilegios de administrador e incluye instaladores firmados para x64
y ARM64 en su propia página de versiones.

Windows Hub se publica de forma independiente de la CLI y el Gateway de OpenClaw. Descargue
el instalador estable más reciente de Hub desde la
[página de versiones de Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
o directamente mediante `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Si alguno de los enlaces anteriores devuelve un error 404, visite la [página de versiones de Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
y abra la versión estable más reciente de Windows Hub. Las versiones estables normales de OpenClaw
también replican una compilación fijada y validada para la versión de Windows Hub; esta réplica puede quedar rezagada respecto a
una versión independiente más reciente de Hub.

Después de la instalación, inicie **OpenClaw Companion** desde el menú Start o la bandeja
del sistema. El instalador también añade accesos directos para Gateway Setup, Chat, Settings,
Check for Updates y la desinstalación.

### Qué incluye Windows Hub

- Estado en la bandeja del sistema e inicio al iniciar sesión.
- Configuración inicial de un Gateway WSL local propiedad de la aplicación.
- Ajustes de conexión para Gateways locales, remotos y con túnel SSH.
- Ventana de chat nativa y acceso a la interfaz de control en el navegador.
- Diagnósticos de Command Center para sesiones, uso, canales, nodos, emparejamiento
  y comandos de reparación.
- Modo Node de Windows para canvas, pantalla, cámara, notificaciones,
  estado del dispositivo, conversación y `system.run` controlado por el agente.
- Modo de servidor MCP local para clientes MCP como Claude Desktop, Claude Code
  y Cursor.

### Primer inicio

Durante el primer inicio, Windows Hub abre la configuración cuando no hay ningún
Gateway guardado que pueda utilizarse. La ruta más rápida es **Set up locally**, que aprovisiona una
distribución WSL `OpenClawGateway` propiedad de la aplicación, instala el Gateway en ella y
empareja la aplicación. Esto no exporta ni modifica la distribución de Ubuntu existente.

Elija **Advanced setup** o abra la pestaña Connections si ya dispone de un
Gateway. Puede conectarse a:

- un Gateway local en este PC
- un Gateway WSL en este PC
- un Gateway remoto mediante una URL y un token o código de configuración
- un Gateway accesible mediante un túnel SSH

Cuando termina la configuración, el icono de la bandeja se vuelve verde. Abra **Command Center** desde
la bandeja para confirmar la conexión, el emparejamiento, el estado de Node y el estado de los canales.

## Modo Node de Windows

Windows Hub puede registrarse como un Node de OpenClaw para que el agente pueda usar las capacidades
nativas de Windows declaradas a través del Gateway. Los comandos de Node deben estar
declarados por el Node y permitidos por la política del Gateway antes de ejecutarse; consulte
[Nodos](/es/nodes#command-policy) para ver el modelo completo de permisos y denegaciones.

Comandos habituales:

| Familia | Comandos                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| Canvas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Pantalla | `screen.snapshot`; `screen.record` requiere habilitación explícita                          |
| Cámara | `camera.list`; `camera.snap`, `camera.clip` requieren habilitación explícita                  |
| Sistema | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Dispositivo | `location.get`, `device.info`, `device.status`                                       |
| Conversación   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

El modo Node requiere emparejamiento con el Gateway. Si la aplicación muestra una solicitud de emparejamiento,
apruébela desde el host del Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

El Gateway solo reenvía los comandos que declara el Node y que permite la política
del servidor. Los comandos sensibles para la privacidad, como `screen.record`, `camera.snap`
y `camera.clip`, necesitan habilitación `gateway.nodes.commands.allow` explícita.

## Modo MCP local

Windows Hub puede exponer el mismo registro de capacidades nativas de Windows como servidor
MCP local en la interfaz de bucle invertido, para que los clientes MCP locales puedan controlar las capacidades de Windows
sin que se ejecute un Gateway de OpenClaw.

Habilítelo en Settings de Windows Hub, en la sección para desarrolladores/opciones avanzadas. La
aplicación muestra el punto de conexión de bucle invertido y el token de portador cuando se habilita el servidor.

Matriz de modos:

| Modo Node | Servidor MCP | Comportamiento                           |
| --------- | ---------- | ---------------------------------- |
| desactivado       | desactivado        | Aplicación de escritorio solo para el operador          |
| activado        | desactivado        | Node de Windows conectado al Gateway     |
| desactivado       | activado         | Solo servidor MCP local              |
| activado        | activado         | Node del Gateway y servidor MCP local |

## CLI y Gateway nativos de Windows

Para un uso centrado en la terminal, instale OpenClaw desde PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifique:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

El inicio administrado usa Windows Scheduled Tasks cuando están disponibles. La tarea conserva
el script legible `gateway.cmd` en el directorio de estado de OpenClaw, pero lo inicia
mediante un contenedor WScript `gateway.vbs` generado, por lo que el Gateway en segundo plano
no abre una ventana de consola visible. Si se deniega la creación de la tarea, OpenClaw
recurre a un elemento de inicio de sesión por usuario en la carpeta Startup.

Instale el servicio de Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Para usar solo la CLI sin un servicio de Gateway administrado:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 sigue siendo el entorno de ejecución de Gateway más compatible con Linux en Windows. Windows
Hub puede configurar automáticamente un Gateway WSL propiedad de la aplicación, o puede instalarlo manualmente en
su propia distribución.

Configuración manual:

```powershell
wsl --install
# O elija una distribución explícitamente:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Habilite systemd en WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Reinicie WSL desde PowerShell:

```powershell
wsl --shutdown
```

Después, instale OpenClaw en WSL mediante el inicio rápido para Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Inicio automático del Gateway antes de iniciar sesión en Windows

Para configuraciones WSL sin interfaz gráfica, asegúrese de que se ejecute toda la cadena de arranque incluso cuando nadie
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

Sustituya `Ubuntu` por el nombre de la distribución que aparece en:

```powershell
wsl --list --verbose
```

<Note>
Dos cambios respecto a las instrucciones anteriores:

- **`dbus-launch true` en lugar de `/bin/true`**: en WSL >= 2.6.1.0, una
  regresión ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  finaliza la distribución por inactividad 15-20 segundos después de que salga el último cliente, incluso
  con la permanencia habilitada. `dbus-launch true` mantiene activo un proceso secundario de init
  como solución provisional (debate de la comunidad, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` en lugar de `/ru SYSTEM`**: las distribuciones WSL por usuario (la
  configuración predeterminada) no son visibles para la cuenta SYSTEM, por lo que la tarea parece
  ejecutarse, pero la distribución nunca se inicia. Ejecutarla con su propia cuenta evita
  este problema; Windows solicita la contraseña cuando se crea la tarea.

</Note>

Después de reiniciar, verifique desde WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Exponer servicios de WSL en la LAN

WSL tiene su propia red virtual. Si otra máquina debe acceder a un servicio
dentro de WSL, reenvíe un puerto de Windows a la dirección IP actual de WSL. La dirección IP de WSL puede
cambiar tras los reinicios, por lo que debe actualizarse la regla de reenvío cuando sea necesario.

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

- Una conexión SSH desde otra máquina apunta a la dirección IP del host de Windows, por ejemplo, `ssh user@windows-host -p 2222`.
- Los Nodes remotos deben apuntar a una URL de Gateway accesible, no a `127.0.0.1`.
- Use `listenaddress=0.0.0.0` para acceder desde la LAN y `127.0.0.1` para acceder solo de forma local.

## Solución de problemas

### El icono de la bandeja no aparece

Busque `OpenClaw.Tray.WinUI.exe` en Task Manager. Si está en ejecución, abra el
área de iconos ocultos de la bandeja y ánclelo. De lo contrario, inicie **OpenClaw Companion** desde
el menú Start.

### La configuración local falla

Abra el registro de configuración desde Windows Hub o examine:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Causas habituales: WSL deshabilitado, virtualización bloqueada, estado obsoleto de WSL
propiedad de la aplicación o un fallo de red durante la instalación del paquete de Gateway.

### La aplicación indica que es necesario el emparejamiento

Apruebe la solicitud del operador o del Node desde el Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Si el dispositivo ya tenía un token, vuelva a conectarse desde la pestaña Connections después de
la aprobación.

### El chat web no puede acceder a un Gateway remoto

El chat web remoto necesita HTTPS o localhost. En el caso de certificados autofirmados, confíe
en el certificado en Windows o use un túnel SSH hacia una URL de localhost.

### Los comandos de `screen.snapshot`, cámara o audio fallan

Confirme los permisos de Windows para la cámara, el micrófono, la captura de pantalla y las
notificaciones. Las instalaciones empaquetadas declaran las capacidades protegidas, pero
Windows puede seguir solicitando permiso la primera vez que un comando las utilice.

### Falla la conectividad con Git o GitHub

Algunas redes bloquean o limitan las conexiones HTTPS con GitHub. Si `git clone` o
`gh auth login` falla, pruebe con otra red, una VPN o un proxy HTTP/HTTPS.

Para la autenticación `gh` basada en tokens durante la sesión actual:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Nunca confirme tokens en el repositorio ni los pegue en incidencias o pull requests.

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Configuración de Node.js](/es/install/node)
- [Nodos](/es/nodes)
- [Interfaz de control](/es/web/control-ui)
- [Configuración del Gateway](/es/gateway/configuration)
