---
read_when:
    - Buscando el estado de la aplicación complementaria para Linux
    - Habilitación de la cámara, la ubicación o las notificaciones en un host Node Linux
    - Planificación de la cobertura de plataformas o de las contribuciones
    - Depuración de cierres por OOM en Linux o del código de salida 137 en un VPS o contenedor
summary: Compatibilidad con Linux y estado de la aplicación complementaria
title: Aplicación para Linux
x-i18n:
    generated_at: "2026-07-14T13:53:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: a6759199ddb7f7fe0387e62c3b7ccdf7a33326b9539f531348ea938a7610b6b1
    source_path: platforms/linux.md
    workflow: 16
---

Gateway es totalmente compatible con Linux y requiere Node. Bun aún puede usarse
como instalador de dependencias o ejecutor de scripts de paquetes, pero no puede ejecutar OpenClaw
porque no proporciona `node:sqlite`.

## Aplicación complementaria de escritorio

La aplicación complementaria de OpenClaw para Linux es una aplicación de escritorio Tauri para un Gateway local. Esta:

- instala la CLI de OpenClaw y el entorno de ejecución de Node administrado cuando no están disponibles
- se conecta a un Gateway en buen estado antes de intentar cambiar el servicio
- delega las operaciones de instalación, inicio, detención y reinicio al servicio de usuario de systemd administrado por la CLI
- abre la interfaz de control servida por Gateway con su URL de autenticación resuelta
- permanece disponible en la bandeja del sistema cuando se cierra su ventana

Las versiones estables compiladas desde `main` incluyen paquetes `.deb` y AppImage como recursos en la
[versión de GitHub](https://github.com/openclaw/openclaw/releases) de la etiqueta,
denominados `OpenClaw-<version>-amd64.deb` y `OpenClaw-<version>-amd64.AppImage`,
con un archivo de suma de comprobación `SHA256SUMS.linux-app.txt` junto a ellos. Descargue el
`.deb` e instálelo con `sudo apt install ./OpenClaw-<version>-amd64.deb`,
o marque el AppImage como ejecutable y ejecútelo directamente. El entorno de ejecución de AppImage
necesita FUSE 2 (`sudo apt install libfuse2`, o `libfuse2t64` en Ubuntu 24.04+);
sin este, ejecute el AppImage con `APPIMAGE_EXTRACT_AND_RUN=1`.

También puede compilar los mismos paquetes desde una copia de trabajo del código fuente:

```bash
cd apps/linux/src-tauri
pnpm dlx @tauri-apps/cli@2.11.4 build --bundles deb,appimage
```

El flujo de trabajo de CI `Linux App` carga los mismos paquetes como el
artefacto `openclaw-linux-companion` para las solicitudes de incorporación de cambios que modifican la aplicación y para las
ejecuciones manuales. Consulte `apps/linux/README.md` en el repositorio para conocer las dependencias
de compilación de Linux y los comandos de desarrollo.

## Alternativa mediante CLI y SSH

La CLI sigue siendo la opción más sencilla para un servidor sin interfaz gráfica, un VPS o un Gateway remoto:

1. Instale Node 24.15+ (recomendado), Node 22.22.3+ (LTS) o Node 25.9+.
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Desde su portátil: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abra `http://127.0.0.1:18789/` y autentíquese con el secreto compartido configurado
   (token de forma predeterminada; contraseña si `gateway.auth.mode` es `"password"`).

Guía completa del servidor: [Servidor Linux](/es/vps). Ejemplo paso a paso de un VPS:
[exe.dev](/es/install/exe-dev).

## Capacidades de Node

El plugin de Node para Linux incluido proporciona a la CLI capacidades de dispositivo de servicio `openclaw node` sin requerir la aplicación de escritorio. Los comandos solo se anuncian al Gateway cuando su capacidad está habilitada y existe la herramienta local necesaria.

| Capacidad                              | Valor predeterminado | Requisito                                                           |
| --------------------------------------- | ------- | --------------------------------------------------------------------- |
| Notificaciones de escritorio (`system.notify`) | Activado      | `notify-send` de libnotify y una sesión de notificaciones de escritorio       |
| Fotos y clips de cámara (`camera.*`)    | Desactivado     | FFmpeg, acceso a una cámara V4L2 y PulseAudio o PipeWire para el audio de los clips |
| Ubicación (`location.get`)               | Desactivado     | GeoClue2 y su demostración `where-am-i`                                    |

Configure el plugin en `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          notify: { enabled: true },
          camera: { enabled: true },
          location: { enabled: true },
        },
      },
    },
  },
}
```

Reinicie el servicio Node después de cambiar estos ajustes. La disponibilidad se determina una vez por proceso y el anuncio del Node se reconstruye al reiniciar.

Gateway aprueba la superficie de comandos y capacidades del Node por separado del emparejamiento del dispositivo. En el primer inicio, o después de habilitar más capacidades, apruebe la superficie pendiente:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Un Node puede estar conectado y emparejado con el dispositivo mientras sus valores efectivos de `caps` y `commands` permanecen vacíos hasta que finalice esta aprobación.

Los dispositivos de cámara deben ser legibles por el usuario del servicio, normalmente mediante el grupo `video`. Los clips de cámara usan la fuente predeterminada de PulseAudio o PipeWire cuando `includeAudio` es true; el audio del micrófono solo existe como esa pista del clip, no como un comando independiente. La ubicación requiere que la política de GeoClue del host permita al usuario del servicio Node.

`camera.snap` y `camera.clip` también requieren habilitación explícita en Gateway mediante `gateway.nodes.allowCommands`. Consulte [Captura de cámara](/es/nodes/camera) y [Comando de ubicación](/es/nodes/location-command) para conocer las cargas útiles, los límites y los errores.

## Instalación

- [Primeros pasos](/es/start/getting-started)
- [Instalación y actualizaciones](/es/install/updating)
- Opcional: [Flujo de trabajo de paquetes con Bun](/es/install/bun), [Nix](/es/install/nix), [Docker](/es/install/docker)

## Servicio Gateway (systemd)

Instálelo con una de estas opciones:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # seleccione "Servicio Gateway" cuando se le solicite
```

Repare o migre una instalación existente:

```bash
openclaw doctor
```

`openclaw gateway install` genera de forma predeterminada una unidad de **usuario** de systemd. La guía
completa del servicio, incluida la variante de unidad de nivel de **sistema** para hosts compartidos o
siempre activos, se encuentra en el [manual operativo de Gateway](/es/gateway#supervision-and-service-lifecycle).

Escriba una unidad manualmente solo para una configuración personalizada. Ejemplo mínimo de unidad de usuario
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (perfil: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Habilítela:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presión de memoria y terminaciones por OOM

En Linux, el kernel elige una víctima de OOM cuando un host, una máquina virtual o un cgroup de contenedor
se queda sin memoria. Gateway es una mala víctima porque mantiene sesiones
y conexiones de canales de larga duración, por lo que OpenClaw prioriza, cuando es posible, la terminación
de los procesos secundarios transitorios.

Para los procesos secundarios de Linux aptos, OpenClaw encapsula el comando en un breve
adaptador `/bin/sh` que aumenta el valor `oom_score_adj` del propio proceso secundario a `1000` y, a continuación,
ejecuta mediante `exec` el comando real. Esto no requiere privilegios: un proceso siempre puede aumentar
su propia puntuación de OOM.

Superficies de procesos secundarios cubiertas:

- Procesos secundarios de comandos administrados por el supervisor
- Procesos secundarios de shell PTY
- Procesos secundarios de servidores stdio de MCP
- Procesos de navegador/Chrome iniciados por OpenClaw (mediante el entorno de ejecución de procesos del SDK del plugin)

El encapsulador es exclusivo de Linux y se omite cuando `/bin/sh` no está disponible, o cuando
el entorno del proceso secundario establece `OPENCLAW_CHILD_OOM_SCORE_ADJ` en `0`, `false`, `no` o
`off`.

Verifique un proceso secundario:

```bash
cat /proc/<child-pid>/oom_score_adj
```

El valor esperado para los procesos secundarios cubiertos es `1000`; el propio proceso de Gateway
conserva su puntuación normal (normalmente `0`).

El valor `OOMPolicy=continue` de la unidad de systemd mantiene activo el servicio Gateway cuando
el eliminador de OOM selecciona un proceso secundario transitorio, en lugar de marcar como fallida toda la
unidad y reiniciar todos los canales; el proceso secundario o la sesión que ha fallado informa de su
propio error.

Esto no sustituye al ajuste normal de la memoria. Si un VPS o contenedor termina procesos secundarios repetidamente,
aumente el límite de memoria, reduzca la concurrencia o añada controles de recursos
más estrictos (`MemoryMax=` de systemd, límites de memoria del contenedor).

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Raspberry Pi](/es/install/raspberry-pi)
- [Manual operativo de Gateway](/es/gateway)
- [Configuración de Gateway](/es/gateway/configuration)
