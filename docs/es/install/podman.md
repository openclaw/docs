---
read_when:
    - Quieres un Gateway en contenedor con Podman en lugar de Docker
summary: Ejecuta OpenClaw en un contenedor Podman sin privilegios de root
title: Podman
x-i18n:
    generated_at: "2026-07-11T23:11:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Ejecuta el Gateway de OpenClaw en un contenedor Podman sin privilegios de root, administrado por tu usuario actual sin privilegios de root.

El modelo:

- Podman ejecuta el contenedor del Gateway.
- La CLI `openclaw` del host es el plano de control.
- De forma predeterminada, el estado persistente reside en el host, en `~/.openclaw`.
- La administración cotidiana usa `openclaw --container <name> ...` en lugar de `sudo -u openclaw`, `podman exec` o un usuario de servicio independiente.

## Requisitos previos

- **Podman** en modo sin privilegios de root
- **CLI de OpenClaw** instalada en el host
- **Opcional:** `systemd --user` si deseas el inicio automático administrado mediante Quadlet
- **Opcional:** `sudo` solo si deseas usar `loginctl enable-linger "$(whoami)"` para mantener la ejecución tras el arranque en un host sin interfaz gráfica

## Inicio rápido

<Steps>
  <Step title="Configuración inicial">
    Desde la raíz del repositorio, ejecuta `./scripts/podman/setup.sh`.

    Esto compila `openclaw:local` en tu almacén Podman sin privilegios de root (o descarga `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si están definidas), crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` si no existe y crea `~/.openclaw/.env` con un `OPENCLAW_GATEWAY_TOKEN` generado si no existe.

    Variables de entorno opcionales para la compilación:

    | Variable | Efecto |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Usa una imagen existente o descargada en lugar de compilar `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Instala paquetes apt adicionales durante la compilación de la imagen (también admite la variable heredada `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Instala paquetes adicionales de Python durante la compilación de la imagen; fija sus versiones y usa únicamente índices de paquetes de confianza |
    | `OPENCLAW_EXTENSIONS` | Compila y empaqueta los plugins seleccionados compatibles e instala sus dependencias de ejecución |
    | `OPENCLAW_INSTALL_BROWSER` | Preinstala Chromium y Xvfb para la automatización del navegador (establécela en `1`) |

    Para usar en su lugar una configuración administrada mediante Quadlet (solo Linux y servicios de usuario de systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    También puedes establecer `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Iniciar el contenedor del Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Inicia el contenedor con tu uid/gid actual mediante `--userns=keep-id` y monta mediante enlaces el estado de OpenClaw dentro del contenedor.

  </Step>

  <Step title="Ejecutar la configuración inicial dentro del contenedor">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Después, abre `http://127.0.0.1:18789/` y usa el token de `~/.openclaw/.env`.

    Autenticación del modelo: usa la autenticación administrada por OpenClaw durante la configuración (claves de API de Anthropic o autenticación OAuth del navegador/mediante código de dispositivo de OpenAI Codex para OpenAI respaldado por Codex). El iniciador de Podman no monta en el contenedor de configuración ni en el del Gateway los directorios de credenciales de la CLI del host, como `~/.claude` o `~/.codex`. Los inicios de sesión existentes en la CLI del host son únicamente mecanismos prácticos para el mismo host; en instalaciones con contenedores, conserva la autenticación del proveedor en el estado montado de `~/.openclaw` que administra la configuración.

  </Step>

  <Step title="Administrar el contenedor en ejecución desde la CLI del host">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    A partir de entonces, los comandos habituales de `openclaw` se ejecutan automáticamente dentro de ese contenedor:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # incluye un análisis adicional del servicio
    openclaw doctor
    openclaw channels login
    ```

    En macOS, la máquina de Podman puede hacer que el navegador parezca no local para el Gateway. Si la interfaz de control informa errores de autenticación del dispositivo después del inicio, sigue las indicaciones sobre Tailscale en [Podman y Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

El iniciador manual solo lee una pequeña lista de claves relacionadas con Podman permitidas desde `~/.openclaw/.env` y pasa variables de entorno de ejecución explícitas al contenedor; no entrega el archivo de entorno completo a Podman.

<a id="podman-and-tailscale"></a>

## Podman y Tailscale

Para acceder mediante HTTPS o desde un navegador remoto, sigue la documentación principal de Tailscale.

Notas específicas de Podman:

- Mantén el host de publicación de Podman en `127.0.0.1`.
- Prioriza `tailscale serve` administrado por el host frente a `openclaw gateway --tailscale serve`.
- En macOS, si el contexto de autenticación del dispositivo en el navegador local no es fiable, usa el acceso mediante Tailscale en lugar de soluciones provisionales con túneles locales improvisados.

Consulta [Tailscale](/es/gateway/tailscale) y la [interfaz de control](/es/web/control-ui).

## Systemd (Quadlet, opcional)

Si ejecutaste `./scripts/podman/setup.sh --quadlet`, la configuración instala un archivo Quadlet en `~/.config/containers/systemd/openclaw.container`.

| Acción | Comando                                    |
| ------ | ------------------------------------------ |
| Iniciar | `systemctl --user start openclaw.service`  |
| Detener | `systemctl --user stop openclaw.service`   |
| Estado | `systemctl --user status openclaw.service` |
| Registros | `journalctl --user -u openclaw.service -f` |

Después de editar el archivo Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Para mantener la ejecución tras el arranque en hosts SSH o sin interfaz gráfica, habilita la persistencia de sesión para tu usuario actual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

El servicio Quadlet generado conserva una configuración predeterminada fija y reforzada: puertos publicados en `127.0.0.1` (`18789` para el Gateway y `18790` para el puente), `--bind lan` dentro del contenedor, espacio de nombres de usuario `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` y `TimeoutStartSec=300`. Lee `~/.openclaw/.env` como `EnvironmentFile` de ejecución para valores como `OPENCLAW_GATEWAY_TOKEN`, pero no utiliza la lista de anulaciones específicas de Podman permitidas por el iniciador manual. Para usar puertos de publicación personalizados, otro host de publicación u otras opciones de ejecución del contenedor, usa el iniciador manual o edita directamente `~/.config/containers/systemd/openclaw.container` y, después, recarga y reinicia el servicio.

## Configuración, entorno y almacenamiento

- **Directorio de configuración:** `~/.openclaw`
- **Directorio del espacio de trabajo:** `~/.openclaw/workspace`
- **Archivo del token:** `~/.openclaw/.env`
- **Asistente de inicio:** `./scripts/run-openclaw-podman.sh`

El script de inicio y Quadlet montan mediante enlaces el estado del host dentro del contenedor: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. De forma predeterminada, estos son directorios del host, no estado anónimo del contenedor, por lo que `openclaw.json`, los archivos `auth-profiles.json` de cada agente, el estado de canales y proveedores, las sesiones y el espacio de trabajo persisten tras reemplazar el contenedor. La configuración también incorpora valores iniciales en `gateway.controlUi.allowedOrigins` para `127.0.0.1` y `localhost` en el puerto publicado del Gateway, de modo que el panel local funcione con la vinculación no local del contenedor.

Variables de entorno útiles para el iniciador manual (guárdalas en `~/.openclaw/.env`; el iniciador lee ese archivo antes de determinar los valores predeterminados finales del contenedor y de la imagen):

| Variable                                   | Valor predeterminado | Efecto                                  |
| ------------------------------------------ | -------------------- | --------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`           | Nombre del contenedor                   |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local`     | Imagen que se ejecutará                 |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`              | Puerto del host asignado al `18789` del contenedor |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`              | Puerto del host asignado al `18790` del contenedor |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`          | Interfaz del host para los puertos publicados |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`                | Modo de vinculación del Gateway dentro del contenedor |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`            | `keep-id`, `auto` o `host`              |

Si usas valores no predeterminados para `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR`, establece las mismas variables tanto para `./scripts/podman/setup.sh` como para los comandos posteriores `./scripts/run-openclaw-podman.sh launch`; el iniciador local del repositorio no conserva las anulaciones de rutas personalizadas entre sesiones del shell.

## Actualización de imágenes

Después de recompilar o descargar una imagen nueva, reinicia el contenedor o el servicio Quadlet.
En el primer inicio de una nueva versión de OpenClaw, el Gateway ejecuta reparaciones seguras del estado y de los plugins antes de indicar que está listo.

Si el Gateway finaliza en lugar de quedar listo, ejecuta una vez la misma imagen con `openclaw doctor --fix` sobre el mismo estado y configuración montados y, después, reinicia el Gateway normalmente:

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

En hosts con SELinux, añade `,Z` a ambos montajes mediante enlace si Podman bloquea el acceso al estado montado.

## Comandos útiles

- **Registros del contenedor:** `podman logs -f openclaw`
- **Detener el contenedor:** `podman stop openclaw`
- **Eliminar el contenedor:** `podman rm -f openclaw`
- **Abrir la URL del panel desde la CLI del host:** `openclaw dashboard --no-open`
- **Estado y salud mediante la CLI del host:** `openclaw gateway status --deep` (sondeo RPC + análisis adicional del servicio)

## Solución de problemas

- **Permiso denegado (EACCES) en la configuración o el espacio de trabajo:** De forma predeterminada, el contenedor se ejecuta con `--userns=keep-id` y `--user <tu uid>:<tu gid>`. Asegúrate de que las rutas de configuración y del espacio de trabajo del host pertenezcan a tu usuario actual.
- **Inicio del Gateway bloqueado (falta `gateway.mode=local`):** Asegúrate de que exista `~/.openclaw/openclaw.json` y establezca `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea si no existe.
- **El contenedor se reinicia después de actualizar una imagen:** Ejecuta el comando puntual `openclaw doctor --fix` de [Actualización de imágenes](#upgrading-images) y vuelve a iniciar el Gateway.
- **Los comandos de la CLI del contenedor se dirigen al destino incorrecto:** Usa explícitamente `openclaw --container <name> ...` o exporta `OPENCLAW_CONTAINER=<name>` en tu shell.
- **`openclaw update` falla con `--container`:** Es el comportamiento esperado. Recompila o descarga la imagen y, después, reinicia el contenedor o el servicio Quadlet.
- **El servicio Quadlet no se inicia:** Ejecuta `systemctl --user daemon-reload` y, después, `systemctl --user start openclaw.service`. En sistemas sin interfaz gráfica, también puede ser necesario ejecutar `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloquea los montajes mediante enlace:** No modifiques el comportamiento de montaje predeterminado; el iniciador añade automáticamente `:Z` en Linux cuando SELinux está en modo obligatorio o permisivo.

## Contenido relacionado

- [Docker](/es/install/docker)
- [Proceso en segundo plano del Gateway](/es/gateway/background-process)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
