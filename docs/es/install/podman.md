---
read_when:
    - Quieres un Gateway contenedorizado con Podman en lugar de Docker
summary: Ejecutar OpenClaw en un contenedor Podman sin root
title: Podman
x-i18n:
    generated_at: "2026-04-30T05:48:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Ejecuta el Gateway de OpenClaw en un contenedor Podman sin privilegios de root, administrado por tu usuario actual no root.

El modelo previsto es:

- Podman ejecuta el contenedor del Gateway.
- Tu CLI `openclaw` del host es el plano de control.
- El estado persistente vive en el host bajo `~/.openclaw` de forma predeterminada.
- La administración diaria usa `openclaw --container <name> ...` en lugar de `sudo -u openclaw`, `podman exec` o un usuario de servicio separado.

## Requisitos previos

- **Podman** en modo sin privilegios de root
- **CLI de OpenClaw** instalada en el host
- **Opcional:** `systemd --user` si quieres inicio automático administrado por Quadlet
- **Opcional:** `sudo` solo si quieres `loginctl enable-linger "$(whoami)"` para persistencia al arrancar en un host sin interfaz gráfica

## Inicio rápido

<Steps>
  <Step title="Configuración única">
    Desde la raíz del repositorio, ejecuta `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Iniciar el contenedor del Gateway">
    Inicia el contenedor con `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Ejecutar la incorporación dentro del contenedor">
    Ejecuta `./scripts/run-openclaw-podman.sh launch setup` y luego abre `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Administrar el contenedor en ejecución desde la CLI del host">
    Define `OPENCLAW_CONTAINER=openclaw` y luego usa comandos normales de `openclaw` desde el host.
  </Step>
</Steps>

Detalles de configuración:

- `./scripts/podman/setup.sh` construye `openclaw:local` en tu almacén Podman sin privilegios de root de forma predeterminada, o usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si defines una.
- Crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` si falta.
- Crea `~/.openclaw/.env` con `OPENCLAW_GATEWAY_TOKEN` si falta.
- Para inicios manuales, el ayudante lee solo una pequeña lista permitida de claves relacionadas con Podman desde `~/.openclaw/.env` y pasa variables de entorno de runtime explícitas al contenedor; no entrega el archivo de entorno completo a Podman.

Configuración administrada por Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet es una opción solo para Linux porque depende de servicios de usuario de systemd.

También puedes definir `OPENCLAW_PODMAN_QUADLET=1`.

Variables de entorno opcionales de compilación/configuración:

- `OPENCLAW_IMAGE` o `OPENCLAW_PODMAN_IMAGE` -- usa una imagen existente/descargada en lugar de construir `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instala paquetes apt adicionales durante la construcción de la imagen
- `OPENCLAW_EXTENSIONS` -- preinstala dependencias de Plugin durante la construcción
- `OPENCLAW_INSTALL_BROWSER` -- preinstala Chromium y Xvfb para automatización de navegador (define en `1` para habilitar)

Inicio del contenedor:

```bash
./scripts/run-openclaw-podman.sh launch
```

El script inicia el contenedor como tu uid/gid actual con `--userns=keep-id` y monta con bind tu estado de OpenClaw en el contenedor.

Incorporación:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Luego abre `http://127.0.0.1:18789/` y usa el token de `~/.openclaw/.env`.

Valor predeterminado de la CLI del host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Entonces comandos como estos se ejecutarán dentro de ese contenedor automáticamente:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

En macOS, Podman machine puede hacer que el navegador parezca no local para el Gateway.
Si la Control UI informa errores de autenticación de dispositivo después del inicio, usa la guía de Tailscale en
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Para HTTPS o acceso remoto desde navegador, sigue la documentación principal de Tailscale.

Nota específica de Podman:

- Mantén el host de publicación de Podman en `127.0.0.1`.
- Prefiere `tailscale serve` administrado por el host sobre `openclaw gateway --tailscale serve`.
- En macOS, si el contexto de autenticación de dispositivo del navegador local no es fiable, usa acceso con Tailscale en lugar de soluciones locales improvisadas con túneles.

Consulta:

- [Tailscale](/es/gateway/tailscale)
- [Control UI](/es/web/control-ui)

## Systemd (Quadlet, opcional)

Si ejecutaste `./scripts/podman/setup.sh --quadlet`, la configuración instala un archivo Quadlet en:

```bash
~/.config/containers/systemd/openclaw.container
```

Comandos útiles:

- **Iniciar:** `systemctl --user start openclaw.service`
- **Detener:** `systemctl --user stop openclaw.service`
- **Estado:** `systemctl --user status openclaw.service`
- **Registros:** `journalctl --user -u openclaw.service -f`

Después de editar el archivo Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Para persistencia al arrancar en hosts SSH/sin interfaz gráfica, habilita lingering para tu usuario actual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuración, entorno y almacenamiento

- **Directorio de configuración:** `~/.openclaw`
- **Directorio de espacio de trabajo:** `~/.openclaw/workspace`
- **Archivo de token:** `~/.openclaw/.env`
- **Ayudante de inicio:** `./scripts/run-openclaw-podman.sh`

El script de inicio y Quadlet montan con bind el estado del host en el contenedor:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

De forma predeterminada, esos son directorios del host, no estado anónimo del contenedor, así que
`openclaw.json`, los `auth-profiles.json` por agente, el estado de canales/proveedores,
las sesiones y el espacio de trabajo sobreviven al reemplazo del contenedor.
La configuración de Podman también inicializa `gateway.controlUi.allowedOrigins` para `127.0.0.1` y `localhost` en el puerto publicado del Gateway, de modo que el panel local funcione con el bind no loopback del contenedor.

Variables de entorno útiles para el lanzador manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nombre del contenedor (`openclaw` de forma predeterminada)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- imagen que se ejecutará
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- puerto del host asignado al `18789` del contenedor
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- puerto del host asignado al `18790` del contenedor
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfaz del host para puertos publicados; el valor predeterminado es `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modo de bind del Gateway dentro del contenedor; el valor predeterminado es `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (predeterminado), `auto` o `host`

El lanzador manual lee `~/.openclaw/.env` antes de finalizar los valores predeterminados de contenedor/imagen, así que puedes conservarlos allí.

Si usas un `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR` no predeterminado, define las mismas variables tanto para `./scripts/podman/setup.sh` como para comandos posteriores de `./scripts/run-openclaw-podman.sh launch`. El lanzador local del repositorio no conserva sobrescrituras de rutas personalizadas entre shells.

Nota de Quadlet:

- El servicio Quadlet generado mantiene intencionadamente una forma predeterminada fija y endurecida: puertos publicados en `127.0.0.1`, `--bind lan` dentro del contenedor y espacio de nombres de usuario `keep-id`.
- Fija `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` y `TimeoutStartSec=300`.
- Publica tanto `127.0.0.1:18789:18789` (Gateway) como `127.0.0.1:18790:18790` (puente).
- Lee `~/.openclaw/.env` como `EnvironmentFile` de runtime para valores como `OPENCLAW_GATEWAY_TOKEN`, pero no consume la lista permitida de sobrescrituras específicas de Podman del lanzador manual.
- Si necesitas puertos de publicación personalizados, host de publicación u otras flags de ejecución de contenedor, usa el lanzador manual o edita `~/.config/containers/systemd/openclaw.container` directamente; luego recarga y reinicia el servicio.

## Comandos útiles

- **Registros del contenedor:** `podman logs -f openclaw`
- **Detener contenedor:** `podman stop openclaw`
- **Eliminar contenedor:** `podman rm -f openclaw`
- **Abrir URL del panel desde la CLI del host:** `openclaw dashboard --no-open`
- **Salud/estado mediante la CLI del host:** `openclaw gateway status --deep` (sondeo RPC + escaneo adicional
  de servicios)

## Solución de problemas

- **Permiso denegado (EACCES) en configuración o espacio de trabajo:** El contenedor se ejecuta con `--userns=keep-id` y `--user <your uid>:<your gid>` de forma predeterminada. Asegúrate de que las rutas de configuración/espacio de trabajo del host pertenezcan a tu usuario actual.
- **Inicio del Gateway bloqueado (falta `gateway.mode=local`):** Asegúrate de que `~/.openclaw/openclaw.json` exista y defina `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea si falta.
- **Los comandos de CLI del contenedor apuntan al destino incorrecto:** Usa `openclaw --container <name> ...` explícitamente, o exporta `OPENCLAW_CONTAINER=<name>` en tu shell.
- **`openclaw update` falla con `--container`:** Esperado. Reconstruye/descarga la imagen y luego reinicia el contenedor o el servicio Quadlet.
- **El servicio Quadlet no inicia:** Ejecuta `systemctl --user daemon-reload` y luego `systemctl --user start openclaw.service`. En sistemas sin interfaz gráfica, puede que también necesites `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloquea montajes bind:** Deja intacto el comportamiento de montaje predeterminado; el lanzador añade automáticamente `:Z` en Linux cuando SELinux está en modo enforcing o permissive.

## Relacionado

- [Docker](/es/install/docker)
- [Proceso en segundo plano del Gateway](/es/gateway/background-process)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
