---
read_when:
    - Quieres un gateway en contenedor con Podman en lugar de Docker
summary: Ejecuta OpenClaw en un contenedor Podman sin root
title: Podman
x-i18n:
    generated_at: "2026-07-05T11:24:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70b35745eb2ecee734fe686d2f4eb19f462214fbf40fca19fc906ea73d5d28c0
    source_path: install/podman.md
    workflow: 16
---

Ejecuta el Gateway de OpenClaw en un contenedor Podman sin root, gestionado por tu usuario actual no root.

El modelo:

- Podman ejecuta el contenedor del Gateway.
- Tu CLI `openclaw` del host es el plano de control.
- El estado persistente vive en el host bajo `~/.openclaw` de forma predeterminada.
- La gestión diaria usa `openclaw --container <name> ...` en lugar de `sudo -u openclaw`, `podman exec` o un usuario de servicio separado.

## Requisitos previos

- **Podman** en modo sin root
- **CLI de OpenClaw** instalada en el host
- **Opcional:** `systemd --user` si quieres inicio automático gestionado por Quadlet
- **Opcional:** `sudo` solo si quieres `loginctl enable-linger "$(whoami)"` para persistencia al arranque en un host sin monitor

## Inicio rápido

<Steps>
  <Step title="Configuración única">
    Desde la raíz del repositorio, ejecuta `./scripts/podman/setup.sh`.

    Esto compila `openclaw:local` en tu almacén Podman sin root (o descarga `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si están definidas), crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` si falta, y crea `~/.openclaw/.env` con un `OPENCLAW_GATEWAY_TOKEN` generado si falta.

    Variables de entorno opcionales en tiempo de compilación:

    | Variable | Efecto |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Usa una imagen existente/descargada en lugar de compilar `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Instala paquetes apt adicionales durante la compilación de la imagen (también acepta el valor heredado `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Instala paquetes de Python adicionales durante la compilación de la imagen; fija versiones y usa solo índices de paquetes en los que confíes |
    | `OPENCLAW_EXTENSIONS` | Preinstala dependencias de plugins en tiempo de compilación |
    | `OPENCLAW_INSTALL_BROWSER` | Preinstala Chromium y Xvfb para automatización del navegador (definir en `1`) |

    Para una configuración gestionada por Quadlet en su lugar (solo Linux + servicios de usuario systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    O define `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Iniciar el contenedor del Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Inicia el contenedor como tu uid/gid actual con `--userns=keep-id` y monta mediante bind tu estado de OpenClaw dentro del contenedor.

  </Step>

  <Step title="Ejecutar la incorporación dentro del contenedor">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Luego abre `http://127.0.0.1:18789/` y usa el token de `~/.openclaw/.env`.

    Autenticación de modelo: usa autenticación gestionada por OpenClaw durante la configuración (claves API de Anthropic, o autenticación OAuth de navegador/código de dispositivo de OpenAI Codex para OpenAI respaldado por Codex). El lanzador de Podman no monta directorios de credenciales de CLI del host como `~/.claude` o `~/.codex` dentro del contenedor de configuración o del Gateway. Los inicios de sesión existentes de la CLI del host son solo rutas de conveniencia en el mismo host; para instalaciones en contenedor, mantén la autenticación del proveedor en el estado montado `~/.openclaw` que gestiona la configuración.

  </Step>

  <Step title="Gestionar el contenedor en ejecución desde la CLI del host">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Luego los comandos normales de `openclaw` se ejecutan dentro de ese contenedor automáticamente:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # includes extra service scan
    openclaw doctor
    openclaw channels login
    ```

    En macOS, Podman machine puede hacer que el navegador parezca no local para el Gateway. Si la UI de control informa errores de autenticación de dispositivo después del inicio, usa la guía de Tailscale en [Podman y Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

El lanzador manual lee solo una pequeña lista permitida de claves relacionadas con Podman desde `~/.openclaw/.env` y pasa variables de entorno de ejecución explícitas al contenedor; no entrega el archivo env completo a Podman.

<a id="podman-and-tailscale"></a>

## Podman y Tailscale

Para HTTPS o acceso remoto desde el navegador, sigue la documentación principal de Tailscale.

Notas específicas de Podman:

- Mantén el host de publicación de Podman en `127.0.0.1`.
- Prefiere `tailscale serve` gestionado por el host en lugar de `openclaw gateway --tailscale serve`.
- En macOS, si el contexto de autenticación de dispositivo del navegador local no es fiable, usa acceso mediante Tailscale en lugar de soluciones alternativas de túnel local ad hoc.

Consulta [Tailscale](/es/gateway/tailscale) y [UI de control](/es/web/control-ui).

## Systemd (Quadlet, opcional)

Si ejecutaste `./scripts/podman/setup.sh --quadlet`, la configuración instala un archivo Quadlet en `~/.config/containers/systemd/openclaw.container`.

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

Para persistencia al arranque en hosts SSH/sin monitor, habilita lingering para tu usuario actual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

El servicio Quadlet generado mantiene una forma predeterminada fija y reforzada: puertos publicados en `127.0.0.1` (`18789` Gateway, `18790` puente), `--bind lan` dentro del contenedor, espacio de nombres de usuario `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` y `TimeoutStartSec=300`. Lee `~/.openclaw/.env` como `EnvironmentFile` de ejecución para valores como `OPENCLAW_GATEWAY_TOKEN`, pero no consume la lista permitida de anulaciones específicas de Podman del lanzador manual. Para puertos de publicación personalizados, host de publicación u otras banderas de ejecución de contenedor, usa el lanzador manual en su lugar, o edita `~/.config/containers/systemd/openclaw.container` directamente y luego recarga y reinicia el servicio.

## Configuración, env y almacenamiento

- **Directorio de configuración:** `~/.openclaw`
- **Directorio de espacio de trabajo:** `~/.openclaw/workspace`
- **Archivo de token:** `~/.openclaw/.env`
- **Ayudante de inicio:** `./scripts/run-openclaw-podman.sh`

El script de inicio y Quadlet montan mediante bind el estado del host dentro del contenedor: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. De forma predeterminada, esos son directorios del host, no estado anónimo del contenedor, por lo que `openclaw.json`, `auth-profiles.json` por agente, el estado de canal/proveedor, las sesiones y el espacio de trabajo sobreviven al reemplazo del contenedor. La configuración también inicializa `gateway.controlUi.allowedOrigins` para `127.0.0.1` y `localhost` en el puerto publicado del Gateway para que el panel local funcione con el bind no local loopback del contenedor.

Variables de entorno útiles para el lanzador manual (persiste estas en `~/.openclaw/.env`; el lanzador lee ese archivo antes de finalizar los valores predeterminados de contenedor/imagen):

| Variable                                        | Valor predeterminado          | Efecto                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Nombre del contenedor                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Imagen que se ejecutará                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Puerto del host asignado al contenedor `18789`  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Puerto del host asignado al contenedor `18790`  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Interfaz del host para los puertos publicados     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Modo de bind del Gateway dentro del contenedor |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` o `host`           |

Si usas un `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR` no predeterminado, define las mismas variables tanto para `./scripts/podman/setup.sh` como para los comandos posteriores `./scripts/run-openclaw-podman.sh launch`; el lanzador local del repositorio no persiste anulaciones de rutas personalizadas entre shells.

## Comandos útiles

- **Registros del contenedor:** `podman logs -f openclaw`
- **Detener contenedor:** `podman stop openclaw`
- **Eliminar contenedor:** `podman rm -f openclaw`
- **Abrir URL del panel desde la CLI del host:** `openclaw dashboard --no-open`
- **Salud/estado mediante la CLI del host:** `openclaw gateway status --deep` (sonda RPC + escaneo adicional de servicio)

## Solución de problemas

- **Permiso denegado (EACCES) en configuración o espacio de trabajo:** El contenedor se ejecuta con `--userns=keep-id` y `--user <your uid>:<your gid>` de forma predeterminada. Asegúrate de que las rutas de configuración/espacio de trabajo del host sean propiedad de tu usuario actual.
- **Inicio del Gateway bloqueado (falta `gateway.mode=local`):** Asegúrate de que `~/.openclaw/openclaw.json` exista y defina `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea si falta.
- **Los comandos de CLI del contenedor apuntan al destino equivocado:** Usa `openclaw --container <name> ...` explícitamente, o exporta `OPENCLAW_CONTAINER=<name>` en tu shell.
- **`openclaw update` falla con `--container`:** Esperado. Recompila/descarga la imagen y luego reinicia el contenedor o el servicio Quadlet.
- **El servicio Quadlet no se inicia:** Ejecuta `systemctl --user daemon-reload`, luego `systemctl --user start openclaw.service`. En sistemas sin monitor, también puede que necesites `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloquea los montajes bind:** Deja intacto el comportamiento de montaje predeterminado; el lanzador agrega automáticamente `:Z` en Linux cuando SELinux está en modo enforcing o permissive.

## Relacionado

- [Docker](/es/install/docker)
- [Proceso en segundo plano del Gateway](/es/gateway/background-process)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
