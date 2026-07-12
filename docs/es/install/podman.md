---
read_when:
    - Quieres un Gateway en contenedores con Podman en lugar de Docker
summary: Ejecutar OpenClaw en un contenedor Podman sin privilegios de root
title: Podman
x-i18n:
    generated_at: "2026-07-12T14:37:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Ejecuta el Gateway de OpenClaw en un contenedor Podman sin privilegios de root, administrado por el usuario actual sin privilegios de root.

El modelo:

- Podman ejecuta el contenedor del Gateway.
- La CLI `openclaw` del host es el plano de control.
- De forma predeterminada, el estado persistente reside en el host, en `~/.openclaw`.
- La administración diaria usa `openclaw --container <name> ...` en lugar de `sudo -u openclaw`, `podman exec` o un usuario de servicio independiente.

## Requisitos previos

- **Podman** en modo sin privilegios de root
- **CLI de OpenClaw** instalada en el host
- **Opcional:** `systemd --user` si se desea un inicio automático administrado por Quadlet
- **Opcional:** `sudo` solo si se desea usar `loginctl enable-linger "$(whoami)"` para mantener la persistencia tras el arranque en un host sin monitor

## Inicio rápido

<Steps>
  <Step title="Configuración inicial">
    Desde la raíz del repositorio, ejecuta `./scripts/podman/setup.sh`.

    Esto compila `openclaw:local` en el almacenamiento de Podman sin privilegios de root (o descarga `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si están definidas), crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` si no existe y crea `~/.openclaw/.env` con un `OPENCLAW_GATEWAY_TOKEN` generado si no existe.

    Variables de entorno opcionales para el proceso de compilación:

    | Variable | Efecto |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Usa una imagen existente o descargada en lugar de compilar `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Instala paquetes apt adicionales durante la compilación de la imagen (también acepta la variable heredada `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Instala paquetes de Python adicionales durante la compilación de la imagen; fija las versiones y usa únicamente índices de paquetes de confianza |
    | `OPENCLAW_EXTENSIONS` | Compila y empaqueta los plugins compatibles seleccionados e instala sus dependencias de ejecución |
    | `OPENCLAW_INSTALL_BROWSER` | Preinstala Chromium y Xvfb para la automatización del navegador (establece el valor en `1`) |

    Para usar en su lugar una configuración administrada por Quadlet (solo Linux y servicios de usuario de systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    También se puede establecer `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Iniciar el contenedor del Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Inicia el contenedor con el uid/gid del usuario actual mediante `--userns=keep-id` y monta mediante enlace el estado de OpenClaw en el contenedor.

  </Step>

  <Step title="Ejecutar la incorporación dentro del contenedor">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Después, abre `http://127.0.0.1:18789/` y usa el token de `~/.openclaw/.env`.

    Autenticación del modelo: usa la autenticación administrada por OpenClaw durante la configuración (claves de API de Anthropic o autenticación OAuth en el navegador o mediante código de dispositivo de OpenAI Codex para OpenAI basado en Codex). El iniciador de Podman no monta en el contenedor de configuración ni en el del Gateway los directorios de credenciales de las CLI del host, como `~/.claude` o `~/.codex`. Los inicios de sesión existentes en las CLI del host son únicamente mecanismos prácticos para el mismo host; para las instalaciones en contenedores, conserva la autenticación del proveedor en el estado `~/.openclaw` montado que administra la configuración.

  </Step>

  <Step title="Administrar el contenedor en ejecución desde la CLI del host">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    A continuación, los comandos normales de `openclaw` se ejecutan automáticamente dentro de ese contenedor:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # incluye un análisis adicional del servicio
    openclaw doctor
    openclaw channels login
    ```

    En macOS, la máquina de Podman puede hacer que el navegador no parezca local para el Gateway. Si la interfaz de control informa de errores de autenticación del dispositivo después del inicio, sigue las indicaciones de Tailscale en [Podman y Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

El iniciador manual lee únicamente una pequeña lista de claves relacionadas con Podman permitidas desde `~/.openclaw/.env` y pasa variables de entorno de ejecución explícitas al contenedor; no entrega a Podman el archivo de entorno completo.

<a id="podman-and-tailscale"></a>

## Podman y Tailscale

Para HTTPS o el acceso remoto mediante navegador, siga la documentación principal de Tailscale.

Notas específicas de Podman:

- Mantenga el host de publicación de Podman en `127.0.0.1`.
- Prefiera `tailscale serve` gestionado por el host en lugar de `openclaw gateway --tailscale serve`.
- En macOS, si el contexto de autenticación del dispositivo del navegador local no es fiable, use el acceso mediante Tailscale en lugar de soluciones provisionales con túneles locales ad hoc.

Consulte [Tailscale](/es/gateway/tailscale) y la [interfaz de control](/es/web/control-ui).

## Systemd (Quadlet, opcional)

Si ejecutó `./scripts/podman/setup.sh --quadlet`, la configuración instala un archivo Quadlet en `~/.config/containers/systemd/openclaw.container`.

| Acción | Comando                                    |
| ------ | ------------------------------------------ |
| Iniciar  | `systemctl --user start openclaw.service`  |
| Detener   | `systemctl --user stop openclaw.service`   |
| Estado | `systemctl --user status openclaw.service` |
| Registros   | `journalctl --user -u openclaw.service -f` |

Después de editar el archivo Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Para conservar el servicio tras el arranque en hosts SSH/sin interfaz gráfica, habilite la persistencia de la sesión para el usuario actual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

El servicio Quadlet generado mantiene una configuración predeterminada fija y reforzada: puertos publicados en `127.0.0.1` (`18789` para el gateway y `18790` para el puente), `--bind lan` dentro del contenedor, espacio de nombres de usuario `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` y `TimeoutStartSec=300`. Lee `~/.openclaw/.env` como un `EnvironmentFile` en tiempo de ejecución para valores como `OPENCLAW_GATEWAY_TOKEN`, pero no utiliza la lista de anulaciones específicas de Podman permitidas por el iniciador manual. Para personalizar los puertos de publicación, el host de publicación u otras opciones de ejecución del contenedor, use en su lugar el iniciador manual, o edite directamente `~/.config/containers/systemd/openclaw.container` y, a continuación, vuelva a cargar y reinicie el servicio.

## Configuración, entorno y almacenamiento

- **Directorio de configuración:** `~/.openclaw`
- **Directorio del espacio de trabajo:** `~/.openclaw/workspace`
- **Archivo del token:** `~/.openclaw/.env`
- **Herramienta auxiliar de inicio:** `./scripts/run-openclaw-podman.sh`

El script de inicio y Quadlet montan mediante bind el estado del host en el contenedor: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. De forma predeterminada, estos son directorios del host, no un estado anónimo del contenedor, por lo que `openclaw.json`, los archivos `auth-profiles.json` de cada agente, el estado de canales y proveedores, las sesiones y el espacio de trabajo se conservan al reemplazar el contenedor. La configuración también inicializa `gateway.controlUi.allowedOrigins` para `127.0.0.1` y `localhost` en el puerto publicado del Gateway, de modo que el panel local funcione con la vinculación del contenedor a una interfaz que no sea de bucle invertido.

Variables de entorno útiles para el iniciador manual (guárdelas en `~/.openclaw/.env`; el iniciador lee ese archivo antes de finalizar los valores predeterminados del contenedor y la imagen):

| Variable                                   | Valor predeterminado | Efecto                                           |
| ------------------------------------------ | -------------------- | ------------------------------------------------ |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`           | Nombre del contenedor                            |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local`     | Imagen que se ejecutará                          |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`              | Puerto del host asignado al `18789` del contenedor |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`              | Puerto del host asignado al `18790` del contenedor |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`          | Interfaz del host para los puertos publicados    |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`                | Modo de vinculación del Gateway dentro del contenedor |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`            | `keep-id`, `auto` o `host`                       |

Si usa un valor no predeterminado para `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR`, establezca las mismas variables tanto para `./scripts/podman/setup.sh` como para los comandos posteriores `./scripts/run-openclaw-podman.sh launch`; el iniciador local del repositorio no conserva las sustituciones de rutas personalizadas entre shells.

## Actualización de imágenes

Después de recompilar o descargar una imagen nueva, reinicie el contenedor o el servicio Quadlet.
En el primer inicio de una nueva versión de OpenClaw, el Gateway ejecuta reparaciones seguras del estado y de los plugins antes de indicar que está listo.

Si el Gateway finaliza en lugar de quedar listo, ejecute una vez la misma imagen con
`openclaw doctor --fix` sobre el mismo estado y configuración montados y, a continuación, reinicie el
Gateway normalmente:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

En hosts con SELinux, añada `,Z` a ambos montajes bind si Podman bloquea el acceso al
estado montado.

## Comandos útiles

- **Registros del contenedor:** `podman logs -f openclaw`
- **Detener el contenedor:** `podman stop openclaw`
- **Eliminar el contenedor:** `podman rm -f openclaw`
- **Abrir la URL del panel desde la CLI del host:** `openclaw dashboard --no-open`
- **Estado y salud mediante la CLI del host:** `openclaw gateway status --deep` (sondeo RPC + análisis adicional del servicio)

## Solución de problemas

- **Permiso denegado (EACCES) en la configuración o el espacio de trabajo:** De forma predeterminada, el contenedor se ejecuta con `--userns=keep-id` y `--user <your uid>:<your gid>`. Asegúrese de que las rutas de configuración y del espacio de trabajo del host pertenezcan al usuario actual.
- **Inicio del Gateway bloqueado (falta `gateway.mode=local`):** Asegúrese de que exista `~/.openclaw/openclaw.json` y establezca `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea si falta.
- **El contenedor se reinicia después de actualizar una imagen:** Ejecute el comando puntual `openclaw doctor --fix` de [Actualización de imágenes](#upgrading-images) y, a continuación, vuelva a iniciar el Gateway.
- **Los comandos de la CLI del contenedor llegan al destino incorrecto:** Use explícitamente `openclaw --container <name> ...` o exporte `OPENCLAW_CONTAINER=<name>` en el shell.
- **`openclaw update` falla con `--container`:** Es lo esperado. Recompile o descargue la imagen y, a continuación, reinicie el contenedor o el servicio Quadlet.
- **El servicio Quadlet no se inicia:** Ejecute `systemctl --user daemon-reload` y, a continuación, `systemctl --user start openclaw.service`. En sistemas sin interfaz gráfica, también puede ser necesario ejecutar `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloquea los montajes bind:** Mantenga el comportamiento de montaje predeterminado; el iniciador añade automáticamente `:Z` en Linux cuando SELinux está en modo enforcing o permissive.

## Contenido relacionado

- [Docker](/es/install/docker)
- [Proceso en segundo plano del Gateway](/es/gateway/background-process)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
