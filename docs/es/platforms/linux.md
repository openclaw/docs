---
read_when:
    - Buscando el estado de la aplicación complementaria para Linux
    - Activación de la cámara, la ubicación o las notificaciones en un host de Node Linux
    - Planificación de la cobertura de plataformas o de contribuciones
    - Depuración de finalizaciones por OOM de Linux o salidas con código 137 en un VPS o contenedor
summary: Compatibilidad con Linux y estado de la aplicación complementaria
title: Aplicación para Linux
x-i18n:
    generated_at: "2026-07-19T02:01:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea38a6a70596713074c0caf55512da76e4239672224c9a62c044ce25ef930c0f
    source_path: platforms/linux.md
    workflow: 16
---

El Gateway es totalmente compatible con Linux y requiere Node. Bun puede seguir utilizándose
como instalador de dependencias o ejecutor de scripts de paquetes, pero no puede ejecutar OpenClaw
porque no proporciona `node:sqlite`.

## Aplicación complementaria de escritorio

La aplicación complementaria de OpenClaw para Linux es una aplicación de escritorio Tauri para un Gateway local. Esta:

- instala la CLI de OpenClaw y el entorno de ejecución administrado de Node cuando no están presentes; las compilaciones de lanzamiento instalan automáticamente el canal estable, mientras que las compilaciones de desarrollo solicitan primero el canal
- se conecta a un Gateway en buen estado antes de intentar realizar cambios en el servicio
- delega las operaciones de instalación, inicio, detención y reinicio al servicio de usuario systemd administrado por la CLI
- descubre Gateways Bonjour cercanos y abre su interfaz de control desde el endpoint resuelto del servicio
- abre la interfaz de control proporcionada por el Gateway con su URL de autenticación resuelta
- abre la interfaz de control en modo de incorporación después de su instalación inicial, lo que
  permite importar memorias detectadas de Claude Code, Codex o Hermes al
  espacio de trabajo del agente (la misma importación sigue disponible más adelante en
  Settings → Import Memory)
- renderiza Canvas controlado por el agente y contenido A2UI incluido para un host de nodo de la CLI en la misma ubicación
- permanece disponible desde la bandeja del sistema cuando se cierra su ventana

Las versiones estables compiladas desde `main` incluyen paquetes `.deb` y AppImage como recursos en la
[versión de GitHub](https://github.com/openclaw/openclaw/releases) correspondiente a la etiqueta,
con los nombres `OpenClaw-<version>-amd64.deb` y `OpenClaw-<version>-amd64.AppImage`,
junto con un archivo de suma de comprobación `SHA256SUMS.linux-app.txt`. Descargue
`.deb` e instálelo con `sudo apt install ./OpenClaw-<version>-amd64.deb`,
o marque AppImage como ejecutable y ejecútelo directamente. El entorno de ejecución de AppImage
necesita FUSE 2 (`sudo apt install libfuse2`, o `libfuse2t64` en Ubuntu 24.04+);
sin este, ejecute AppImage con `APPIMAGE_EXTRACT_AND_RUN=1`.

También se pueden compilar los mismos paquetes desde un checkout del código fuente:

```bash
cd apps/linux/src-tauri
pnpm dlx @tauri-apps/cli@2.11.4 build --bundles deb,appimage
```

El flujo de trabajo de CI `Linux App` carga los mismos paquetes como el
artefacto `openclaw-linux-companion` para los pull requests que modifican la aplicación y para las
ejecuciones manuales. Consulte `apps/linux/README.md` en el repositorio para conocer las dependencias
de compilación de Linux y los comandos de desarrollo.

### Quick Chat

Abra Quick Chat con `Ctrl+Shift+Space` o mediante el elemento **Quick Chat** de la bandeja. La insignia del agente
muestra el avatar, emoji o monograma configurado; selecciónela para cambiar de agente.
Los mensajes utilizan la sesión principal del agente seleccionado y respetan el ámbito global de las sesiones.
El cliente nativo de Rust posee una identidad de dispositivo Ed25519 persistente. Utiliza el
token o la contraseña compartidos de la transferencia de la CLI únicamente para iniciar el emparejamiento y, después, almacena y
prioriza el token de dispositivo emitido por el Gateway en las conexiones posteriores. La identidad y el
token de dispositivo se guardan en el directorio de configuración de la aplicación, en un archivo con modo `0600`; el WebView de Quick
Chat no recibe las credenciales ni el WebSocket.

Cuando la conexión nativa no está disponible, Quick Chat muestra **Gateway
unreachable — retrying** y deshabilita el envío hasta que se restablezca la conexión. Un dispositivo remoto
que haya alcanzado la fase de emparejamiento muestra en su lugar **Approve this device in the dashboard
(Nodes)**, con un identificador corto del dispositivo cuando el Gateway proporciona uno. Un
Gateway que requiere una credencial compartida ausente muestra **Gateway requires a
credential — open the dashboard on the gateway host**; en ese estado no hay ninguna solicitud de emparejamiento
pendiente de aprobación. Las instrucciones de corrección proporcionadas por el servidor
sustituyen estos avisos alternativos cuando son más específicas.
Para los Gateways TLS, la CLI entrega a la aplicación la huella digital SHA-256
del certificado del Gateway; el cliente nativo fija ese certificado e informa de **Gateway TLS
trust failed — check the certificate fingerprint** por separado de la indisponibilidad.
Los Gateways cuyo secreto compartido está configurado mediante una SecretRef lo omiten en la
transferencia de la CLI. Las instalaciones emparejadas existentes siguen funcionando mediante el token de dispositivo
almacenado, pero una instalación nueva no puede crear una solicitud de emparejamiento pendiente con autenticación
mediante secreto compartido sin esa credencial de inicio.
El canje mediante código de configuración y `bootstrapToken` necesita una interfaz de producto específica y queda
como trabajo posterior; Quick Chat no intenta ejecutar ninguno de estos flujos.

En X11, utilice el engranaje de Quick Chat para registrar o restablecer un atajo personalizado. El
conmutador **Quick Chat shortcut** de la bandeja permite habilitarlo o deshabilitarlo sin deshabilitar el
elemento **Quick Chat** normal de la bandeja. Los atajos globales no están disponibles en Wayland, por lo que
la configuración del atajo se oculta y el elemento de la bandeja sigue siendo el punto de entrada.
Después de aceptar un envío, Quick Chat permanece abierto y transmite la respuesta en texto sin formato del agente
seleccionado debajo del editor. Pulse `Esc` para cerrar la barra y su respuesta;
`Ctrl+Enter` sigue abriendo el panel de control.

### Canvas

Canvas para Linux utiliza dos procesos que cooperan. `openclaw node run` sigue siendo la única conexión de nodo del Gateway; el Plugin `linux-canvas` incluido reenvía las llamadas `canvas.*` a la aplicación de escritorio en ejecución mediante un socket Unix exclusivo del usuario. La aplicación controla una ventana WebView bajo demanda, incluido el renderizador A2UI incorporado y el puente de acciones de vuelta al agente.

El Plugin está habilitado de forma predeterminada. Solo anuncia Canvas cuando el socket de escritorio existe en `$XDG_RUNTIME_DIR/openclaw-canvas.sock`, o en `/tmp/openclaw-canvas-$UID.sock` cuando `XDG_RUNTIME_DIR` no está disponible. Deshabilítelo con `plugins.entries.linux-canvas.enabled: false`. En un servidor Linux sin interfaz gráfica y sin la aplicación de escritorio, Canvas no se anuncia.

Linux v1 utiliza una sola ventana de Canvas. Las páginas HTTP y HTTPS se pueden renderizar, pero las acciones A2UI solo se aceptan desde el renderizador incluido.

## Alternativa mediante CLI y SSH

La CLI sigue siendo la opción más sencilla para un servidor sin interfaz gráfica, un VPS o un Gateway remoto:

1. Instale Node 24.15+ (recomendado), Node 22.22.3+ (LTS) o Node 25.9+.
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Desde el equipo portátil: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Abra `http://127.0.0.1:18789/` y autentíquese con el secreto compartido configurado
   (token de forma predeterminada; contraseña si `gateway.auth.mode` es `"password"`).

Guía completa del servidor: [Servidor Linux](/es/vps). Ejemplo de VPS paso a paso:
[exe.dev](/es/install/exe-dev).

## Capacidades del Node

El Plugin de Node para Linux incluido proporciona a la CLI las capacidades de dispositivo del servicio `openclaw node` sin requerir la aplicación de escritorio. Los comandos solo se anuncian al Gateway cuando su capacidad está habilitada y la herramienta local requerida está disponible.

| Capacidad                              | Valor predeterminado | Requisito                                                           |
| --------------------------------------- | ------- | --------------------------------------------------------------------- |
| Notificaciones de escritorio (`system.notify`) | Activado      | `notify-send` de libnotify y una sesión de notificaciones de escritorio       |
| Fotos y clips de cámara (`camera.*`)    | Desactivado     | FFmpeg, acceso a una cámara V4L2 y PulseAudio o PipeWire para el audio de los clips |
| Ubicación (`location.get`)               | Desactivado     | GeoClue2 y su demostración `where-am-i`                                    |

Configure el Plugin en `openclaw.json`:

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

Reinicie el servicio del nodo después de cambiar esta configuración. La disponibilidad se determina una vez por proceso y el anuncio del nodo se vuelve a generar al reiniciar.

El Gateway aprueba la superficie de comandos y capacidades del nodo por separado del emparejamiento del dispositivo. En el primer inicio, o después de habilitar más capacidades, apruebe la superficie pendiente:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Un nodo puede estar conectado y emparejado como dispositivo mientras sus valores efectivos de `caps` y `commands` permanecen vacíos hasta que se complete esta aprobación.

Los dispositivos de cámara deben ser legibles por el usuario del servicio, normalmente mediante el grupo `video`. Los clips de cámara utilizan la fuente predeterminada de PulseAudio o PipeWire cuando `includeAudio` es true; el audio del micrófono solo existe como pista de ese clip, no como comando independiente. La ubicación requiere que la política GeoClue del host permita al usuario del servicio del nodo.

`camera.snap` y `camera.clip` también requieren habilitación explícita en el Gateway mediante `gateway.nodes.allowCommands`. Consulte [Captura de cámara](/es/nodes/camera) y [Comando de ubicación](/es/nodes/location-command) para conocer las cargas útiles, los límites y los errores.

## Instalación

- [Primeros pasos](/es/start/getting-started)
- [Instalación y actualizaciones](/es/install/updating)
- Opcional: [Flujo de trabajo de paquetes con Bun](/es/install/bun), [Nix](/es/install/nix), [Docker](/es/install/docker)

## Servicio del Gateway (systemd)

Instálelo mediante una de estas opciones:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # seleccione "Servicio del Gateway" cuando se le solicite
```

Repare o migre una instalación existente:

```bash
openclaw doctor
```

`openclaw gateway install` genera una unidad de **usuario** de systemd de forma predeterminada. La guía
completa del servicio, incluida la variante de unidad de nivel **sistema** para hosts compartidos o
siempre activos, se encuentra en el [manual de operaciones del Gateway](/es/gateway#supervision-and-service-lifecycle).

Escriba una unidad manualmente solo para una configuración personalizada. Ejemplo mínimo de unidad de usuario
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=Gateway de OpenClaw (perfil: <profile>, v<version>)
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

Las unidades escritas manualmente no heredan el dimensionamiento adaptativo del montón que `openclaw gateway install` configura para los servicios administrados del Gateway. Se recomienda utilizar el instalador administrado o establecer un límite explícito del montón en el supervisor personalizado después de tener en cuenta el margen para la memoria nativa.

Habilítelo:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presión de memoria y finalizaciones por OOM

En Linux, el kernel selecciona una víctima de OOM cuando un host, una máquina virtual o un cgroup de contenedor
se queda sin memoria. El Gateway es una mala elección como víctima porque mantiene sesiones
y conexiones de canales de larga duración, por lo que OpenClaw favorece que los procesos secundarios
transitorios se finalicen primero cuando sea posible.

Para los procesos secundarios de Linux aptos, OpenClaw envuelve el comando en un pequeño
shim `/bin/sh` que eleva el valor `oom_score_adj` del propio proceso secundario a `1000` y, después,
ejecuta mediante `exec` el comando real. Esto no requiere privilegios: un proceso siempre puede aumentar
su propia puntuación de OOM.

Superficies de procesos secundarios cubiertas:

- Procesos secundarios de comandos administrados por el supervisor
- Procesos secundarios de shell PTY
- Procesos secundarios de servidores MCP mediante stdio
- Procesos de navegador/Chrome iniciados por OpenClaw (mediante el entorno de ejecución de procesos del SDK del Plugin)

El envoltorio es exclusivo de Linux y se omite cuando `/bin/sh` no está disponible, o cuando
el entorno del proceso secundario establece `OPENCLAW_CHILD_OOM_SCORE_ADJ` en `0`, `false`, `no` o
`off`.

Compruebe un proceso secundario:

```bash
cat /proc/<child-pid>/oom_score_adj
```

El valor esperado para los procesos secundarios cubiertos es `1000`; el propio proceso del Gateway
mantiene su puntuación normal (por lo general, `0`).

El valor `OOMPolicy=continue` de la unidad systemd mantiene activo el servicio del Gateway cuando
el eliminador de OOM selecciona un proceso secundario transitorio, en lugar de marcar toda la
unidad como fallida y reiniciar todos los canales; el proceso secundario o la sesión que falló informa de su
propio error.

Esto no sustituye el ajuste normal de la memoria. Si un VPS o contenedor finaliza repetidamente
procesos secundarios, aumente el límite de memoria, reduzca la concurrencia o añada controles
de recursos más estrictos (`MemoryMax=` de systemd, límites de memoria del contenedor).

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Raspberry Pi](/es/install/raspberry-pi)
- [Guía operativa del Gateway](/es/gateway)
- [Configuración del Gateway](/es/gateway/configuration)
