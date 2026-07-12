---
read_when:
    - Instalación de OpenClaw en Windows
    - Elegir entre Windows Hub, Windows nativo y WSL2
    - Configuración de la aplicación complementaria para Windows o del modo Node de Windows
summary: 'Compatibilidad con Windows: Hub de Windows, CLI y Gateway nativos, configuración del Gateway en WSL2, modo Node y solución de problemas'
title: Windows
x-i18n:
    generated_at: "2026-07-12T14:37:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw incluye una aplicación complementaria nativa **Windows Hub**, además de compatibilidad con la CLI de Windows.
Use Windows Hub para disponer de una aplicación de escritorio con configuración, estado en la bandeja, chat, diagnósticos del Centro de comandos y capacidades de nodo de Windows. Use el instalador de PowerShell directamente para la CLI/Gateway. Use WSL2 para obtener el entorno de ejecución del Gateway con mayor compatibilidad con Linux.

## Recomendado: Windows Hub

Windows Hub es la aplicación complementaria nativa WinUI para Windows 10 20H2+ y Windows 11. Se instala sin privilegios de administrador e incluye instaladores firmados para x64 y ARM64 en su propia página de versiones.

Windows Hub se publica de forma independiente de la CLI y el Gateway de OpenClaw. Descargue el instalador estable más reciente de Hub desde la
[página de versiones de Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
o directamente mediante `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Si alguno de los enlaces anteriores devuelve un error 404, visite la [página de versiones de Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
y abra la versión estable más reciente de Windows Hub. Las versiones estables normales de OpenClaw también replican una compilación fijada y validada para la versión de Windows Hub; esa réplica puede ir por detrás de una versión independiente más reciente de Hub.

Después de la instalación, inicie **OpenClaw Companion** desde el menú Start o la bandeja del sistema. El instalador también añade accesos directos para Configuración del Gateway, Chat, Ajustes, Buscar actualizaciones y desinstalación.

### Qué incluye Windows Hub

- Estado en la bandeja del sistema e inicio al iniciar sesión.
- Configuración inicial de un Gateway WSL local administrado por la aplicación.
- Ajustes de conexión para Gateways locales, remotos y con túnel SSH.
- Ventana de chat nativa y acceso a la interfaz de control en el navegador.
- Diagnósticos del Centro de comandos para sesiones, uso, canales, nodos, emparejamiento y comandos de reparación.
- Modo de nodo de Windows para canvas, pantalla, cámara, notificaciones, estado del dispositivo, conversación y `system.run` controlado por el agente.
- Modo de servidor MCP local para clientes MCP como Claude Desktop, Claude Code y Cursor.

### Primer inicio

En el primer inicio, Windows Hub abre la configuración si no hay ningún Gateway guardado que se pueda usar. La ruta más rápida es **Configurar localmente**, que aprovisiona una distribución WSL `OpenClawGateway` administrada por la aplicación, instala el Gateway en ella y empareja la aplicación. Esto no exporta ni modifica su distribución de Ubuntu existente.

Elija **Configuración avanzada** o abra la pestaña Conexiones si ya dispone de un Gateway. Puede conectarse a:

- un Gateway local en este PC
- un Gateway WSL en este PC
- un Gateway remoto mediante URL y token o código de configuración
- un Gateway accesible mediante un túnel SSH

Cuando finaliza la configuración, el icono de la bandeja se vuelve verde. Abra **Centro de comandos** desde la bandeja para confirmar la conexión, el emparejamiento, el estado del nodo y el estado de los canales.

## Modo de nodo de Windows

Windows Hub puede registrarse como nodo de OpenClaw para que el agente pueda usar las capacidades nativas de Windows declaradas a través del Gateway. Los comandos del nodo deben estar declarados por el nodo y permitidos por la política del Gateway antes de ejecutarse; consulte
[Nodos](/es/nodes#command-policy) para conocer el modelo completo de permisos y denegaciones.

Comandos habituales:

| Familia | Comandos                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| Canvas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Pantalla | `screen.snapshot`; `screen.record` requiere habilitación explícita                          |
| Cámara | `camera.list`; `camera.snap`, `camera.clip` requieren habilitación explícita                  |
| Sistema | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Dispositivo | `location.get`, `device.info`, `device.status`                                       |
| Conversación   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

El modo de nodo requiere emparejamiento con el Gateway. Si la aplicación muestra una solicitud de emparejamiento, apruébela desde el host del Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

El Gateway solo reenvía los comandos que el nodo declara y que permite la política del servidor. Los comandos sensibles para la privacidad, como `screen.record`, `camera.snap` y `camera.clip`, necesitan habilitación explícita en `gateway.nodes.allowCommands`.

## Modo MCP local

Windows Hub puede exponer el mismo registro de capacidades nativas de Windows como servidor MCP local en la interfaz de bucle invertido, de modo que los clientes MCP locales puedan controlar las capacidades de Windows sin un Gateway de OpenClaw en ejecución.

Actívelo en los Ajustes de Windows Hub, en la sección para desarrolladores o de opciones avanzadas. La aplicación muestra el endpoint de bucle invertido y el token de portador una vez activado el servidor.

Matriz de modos:

| Modo de nodo | Servidor MCP | Comportamiento                           |
| --------- | ---------- | ---------------------------------- |
| desactivado       | desactivado        | Aplicación de escritorio solo para el operador          |
| activado        | desactivado        | Nodo de Windows conectado al Gateway     |
| desactivado       | activado         | Solo servidor MCP local              |
| activado        | activado         | Nodo del Gateway y servidor MCP local |

## CLI y Gateway nativos de Windows

Para usar OpenClaw principalmente desde la terminal, instálelo desde PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifique:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

El inicio administrado usa Windows Scheduled Tasks cuando están disponibles. La tarea conserva el script legible `gateway.cmd` en el directorio de estado de OpenClaw, pero lo inicia mediante un contenedor WScript `gateway.vbs` generado, por lo que el Gateway en segundo plano no abre una ventana de consola visible. Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta Startup.

Instale el servicio del Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Para usar únicamente la CLI sin un servicio administrado del Gateway:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 sigue siendo el entorno de ejecución del Gateway con mayor compatibilidad con Linux en Windows. Windows Hub puede configurar un Gateway WSL administrado por la aplicación, o puede instalarlo manualmente en su propia distribución.

Configuración manual:

```powershell
wsl --install
# O elija una distribución explícitamente:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Active systemd dentro de WSL:

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

A continuación, instale OpenClaw dentro de WSL mediante la guía de inicio rápido para Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Inicio automático del Gateway antes de iniciar sesión en Windows

En configuraciones WSL sin interfaz gráfica, asegúrese de que se ejecute toda la cadena de arranque aunque nadie inicie sesión en Windows.

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

Sustituya `Ubuntu` por el nombre de su distribución obtenido mediante:

```powershell
wsl --list --verbose
```

<Note>
Dos cambios con respecto a las instrucciones anteriores:

- **`dbus-launch true` en lugar de `/bin/true`**: en WSL >= 2.6.1.0, una
  regresión ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  finaliza por inactividad la distribución entre 15 y 20 segundos después de que salga el último cliente, incluso
  con la permanencia activada. `dbus-launch true` mantiene activo un proceso secundario de init
  como solución alternativa (debate de la comunidad, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` en lugar de `/ru SYSTEM`**: las distribuciones WSL por usuario (la
  configuración predeterminada) no son visibles para la cuenta SYSTEM, por lo que la tarea parece
  ejecutarse, pero la distribución nunca se inicia. Ejecutarla con su propia cuenta evita
  este problema; Windows solicita su contraseña al crear la tarea.

</Note>

Después de reiniciar, verifique desde WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Exponer servicios WSL en la LAN

WSL tiene su propia red virtual. Si otra máquina debe acceder a un servicio dentro de WSL, reenvíe un puerto de Windows a la dirección IP actual de WSL. La dirección IP de WSL puede cambiar después de los reinicios, por lo que debe actualizar la regla de reenvío cuando sea necesario.

Ejemplo en PowerShell como administrador:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "No se encontró la dirección IP de WSL." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Notas:

- Las conexiones SSH desde otra máquina deben dirigirse a la dirección IP del host de Windows, por ejemplo, `ssh user@windows-host -p 2222`.
- Los nodos remotos deben apuntar a una URL del Gateway accesible, no a `127.0.0.1`.
- Use `listenaddress=0.0.0.0` para el acceso mediante la LAN y `127.0.0.1` para el acceso únicamente local.

## Solución de problemas

### El icono de la bandeja no aparece

Busque `OpenClaw.Tray.WinUI.exe` en Task Manager. Si está en ejecución, abra el área de iconos ocultos de la bandeja y fíjelo. Si no lo está, inicie **OpenClaw Companion** desde el menú Start.

### La configuración local falla

Abra el registro de configuración desde Windows Hub o examine:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Causas habituales: WSL desactivado, virtualización bloqueada, estado obsoleto de WSL administrado por la aplicación o un fallo de red durante la instalación del paquete del Gateway.

### La aplicación indica que se requiere emparejamiento

Apruebe la solicitud del operador o del nodo desde el Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Si el dispositivo ya tenía un token, vuelva a conectarlo desde la pestaña Conexiones después de la aprobación.

### El chat web no puede acceder a un Gateway remoto

El chat web remoto necesita HTTPS o localhost. Para certificados autofirmados, marque el certificado como de confianza en Windows o use un túnel SSH hacia una URL de localhost.

### Fallan los comandos `screen.snapshot`, de cámara o de audio

Confirme los permisos de Windows para la cámara, el micrófono, la captura de pantalla y las notificaciones. Las instalaciones empaquetadas declaran las capacidades protegidas, pero Windows aún puede solicitar permiso la primera vez que un comando las use.

### Falla la conectividad con Git o GitHub

Algunas redes bloquean o limitan las conexiones HTTPS a GitHub. Si falla `git clone` o `gh auth login`, pruebe otra red, una VPN o un proxy HTTP/HTTPS.

Para la autenticación de `gh` mediante token en la sesión actual:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Nunca confirme tokens en el repositorio ni los pegue en incidencias o solicitudes de incorporación de cambios.

## Relacionado

- [Descripción general de la instalación](/es/install)
- [Configuración de Node.js](/es/install/node)
- [Nodos](/es/nodes)
- [Interfaz de control](/es/web/control-ui)
- [Configuración del Gateway](/es/gateway/configuration)
