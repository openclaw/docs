---
read_when:
    - Quieres un Gateway en contenedor con Podman en lugar de Docker
summary: Ejecutar OpenClaw en un contenedor Podman sin root
title: Podman
x-i18n:
    generated_at: "2026-06-27T11:49:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

Ejecuta el Gateway de OpenClaw en un contenedor Podman sin root, gestionado por tu usuario actual no root.

El modelo previsto es:

- Podman ejecuta el contenedor del Gateway.
- Tu CLI `openclaw` del host es el plano de control.
- El estado persistente vive en el host bajo `~/.openclaw` de forma predeterminada.
- La gestión diaria usa `openclaw --container <name> ...` en lugar de `sudo -u openclaw`, `podman exec` o un usuario de servicio separado.

## Requisitos previos

- **Podman** en modo sin root
- **CLI de OpenClaw** instalada en el host
- **Opcional:** `systemd --user` si quieres inicio automático gestionado por Quadlet
- **Opcional:** `sudo` solo si quieres `loginctl enable-linger "$(whoami)"` para persistencia al arrancar en un host sin interfaz

## Inicio rápido

<Steps>
  <Step title="Configuración única">
    Desde la raíz del repo, ejecuta `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Iniciar el contenedor del Gateway">
    Inicia el contenedor con `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Ejecutar el onboarding dentro del contenedor">
    Ejecuta `./scripts/run-openclaw-podman.sh launch setup` y luego abre `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gestionar el contenedor en ejecución desde la CLI del host">
    Define `OPENCLAW_CONTAINER=openclaw` y luego usa comandos normales de `openclaw` desde el host.
  </Step>
</Steps>

Detalles de configuración:

- `./scripts/podman/setup.sh` construye `openclaw:local` en tu almacén Podman sin root de forma predeterminada, o usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si defines una.
- Crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` si falta.
- Crea `~/.openclaw/.env` con `OPENCLAW_GATEWAY_TOKEN` si falta.
- Para lanzamientos manuales, el auxiliar lee solo una pequeña lista permitida de claves relacionadas con Podman desde `~/.openclaw/.env` y pasa variables de entorno explícitas de runtime al contenedor; no entrega todo el archivo de entorno a Podman.

Configuración gestionada por Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet es una opción solo para Linux porque depende de servicios de usuario de systemd.

También puedes definir `OPENCLAW_PODMAN_QUADLET=1`.

Variables de entorno opcionales de construcción/configuración:

- `OPENCLAW_IMAGE` o `OPENCLAW_PODMAN_IMAGE` -- usa una imagen existente/descargada en lugar de construir `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- instala paquetes apt adicionales durante la construcción de la imagen (también acepta el heredado `OPENCLAW_DOCKER_APT_PACKAGES`)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- instala paquetes Python adicionales durante la construcción de la imagen; fija versiones y usa solo índices de paquetes en los que confíes
- `OPENCLAW_EXTENSIONS` -- preinstala dependencias de plugins durante la construcción
- `OPENCLAW_INSTALL_BROWSER` -- preinstala Chromium y Xvfb para automatización de navegador (define en `1` para habilitarlo)

Inicio del contenedor:

```bash
./scripts/run-openclaw-podman.sh launch
```

El script inicia el contenedor como tu uid/gid actual con `--userns=keep-id` y monta con bind tu estado de OpenClaw en el contenedor.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Luego abre `http://127.0.0.1:18789/` y usa el token de `~/.openclaw/.env`.

Autenticación de modelos en Podman:

- Usa la autenticación gestionada por OpenClaw durante la configuración: claves de API de Anthropic para Anthropic, o autenticación OAuth/código de dispositivo en navegador de OpenAI Codex para OpenAI respaldado por Codex.
- El lanzador de Podman no monta directorios de credenciales de la CLI del host como `~/.claude` o `~/.codex` en el contenedor de configuración o del Gateway.
- Los inicios de sesión existentes de la CLI del host son rutas de conveniencia en el mismo host. Para instalaciones en contenedores, conserva la autenticación del proveedor en el estado montado `~/.openclaw` que gestiona la configuración.

Valor predeterminado de la CLI del host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Entonces comandos como estos se ejecutarán automáticamente dentro de ese contenedor:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

En macOS, Podman machine puede hacer que el navegador parezca no local para el Gateway.
Si la IU de control informa errores de autenticación de dispositivo después del lanzamiento, usa la guía de Tailscale en
[Podman y Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman y Tailscale

Para HTTPS o acceso de navegador remoto, sigue la documentación principal de Tailscale.

Nota específica de Podman:

- Mantén el host de publicación de Podman en `127.0.0.1`.
- Prefiere `tailscale serve` gestionado por el host antes que `openclaw gateway --tailscale serve`.
- En macOS, si el contexto de autenticación de dispositivo del navegador local no es fiable, usa acceso de Tailscale en lugar de soluciones improvisadas de túnel local.

Consulta:

- [Tailscale](/es/gateway/tailscale)
- [IU de control](/es/web/control-ui)

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

Para persistencia al arrancar en hosts SSH/sin interfaz, habilita lingering para tu usuario actual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuración, entorno y almacenamiento

- **Directorio de configuración:** `~/.openclaw`
- **Directorio de workspace:** `~/.openclaw/workspace`
- **Archivo de token:** `~/.openclaw/.env`
- **Auxiliar de lanzamiento:** `./scripts/run-openclaw-podman.sh`

El script de lanzamiento y Quadlet montan con bind el estado del host en el contenedor:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

De forma predeterminada, esos son directorios del host, no estado anónimo del contenedor, por lo que
`openclaw.json`, `auth-profiles.json` por agente, el estado de canales/proveedores,
sesiones y workspace sobreviven al reemplazo del contenedor.
La configuración de Podman también inicializa `gateway.controlUi.allowedOrigins` para `127.0.0.1` y `localhost` en el puerto publicado del Gateway, de modo que el dashboard local funcione con el bind no loopback del contenedor.

Variables de entorno útiles para el lanzador manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nombre del contenedor (`openclaw` de forma predeterminada)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- imagen que ejecutar
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- puerto del host asignado al `18789` del contenedor
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- puerto del host asignado al `18790` del contenedor
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfaz del host para puertos publicados; el valor predeterminado es `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modo de bind del Gateway dentro del contenedor; el valor predeterminado es `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (predeterminado), `auto` o `host`

El lanzador manual lee `~/.openclaw/.env` antes de finalizar los valores predeterminados del contenedor/imagen, por lo que puedes persistirlos allí.

Si usas un `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR` no predeterminado, define las mismas variables tanto para `./scripts/podman/setup.sh` como para comandos posteriores de `./scripts/run-openclaw-podman.sh launch`. El lanzador local del repo no persiste sobrescrituras de rutas personalizadas entre shells.

Nota de Quadlet:

- El servicio Quadlet generado conserva intencionalmente una forma predeterminada fija y endurecida: puertos publicados en `127.0.0.1`, `--bind lan` dentro del contenedor y espacio de nombres de usuario `keep-id`.
- Fija `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` y `TimeoutStartSec=300`.
- Publica tanto `127.0.0.1:18789:18789` (Gateway) como `127.0.0.1:18790:18790` (bridge).
- Lee `~/.openclaw/.env` como `EnvironmentFile` de runtime para valores como `OPENCLAW_GATEWAY_TOKEN`, pero no consume la lista permitida de sobrescrituras específicas de Podman del lanzador manual.
- Si necesitas puertos de publicación personalizados, host de publicación u otros flags de ejecución de contenedor, usa el lanzador manual o edita `~/.config/containers/systemd/openclaw.container` directamente, luego recarga y reinicia el servicio.

## Comandos útiles

- **Registros del contenedor:** `podman logs -f openclaw`
- **Detener contenedor:** `podman stop openclaw`
- **Eliminar contenedor:** `podman rm -f openclaw`
- **Abrir URL del dashboard desde la CLI del host:** `openclaw dashboard --no-open`
- **Salud/estado mediante la CLI del host:** `openclaw gateway status --deep` (sondeo RPC + escaneo adicional
  de servicios)

## Solución de problemas

- **Permiso denegado (EACCES) en configuración o workspace:** El contenedor se ejecuta con `--userns=keep-id` y `--user <your uid>:<your gid>` de forma predeterminada. Asegúrate de que las rutas de configuración/workspace del host pertenezcan a tu usuario actual.
- **Inicio del Gateway bloqueado (falta `gateway.mode=local`):** Asegúrate de que `~/.openclaw/openclaw.json` exista y defina `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea si falta.
- **Los comandos de la CLI del contenedor apuntan al destino incorrecto:** Usa `openclaw --container <name> ...` explícitamente, o exporta `OPENCLAW_CONTAINER=<name>` en tu shell.
- **`openclaw update` falla con `--container`:** Esperado. Reconstruye/descarga la imagen y luego reinicia el contenedor o el servicio Quadlet.
- **El servicio Quadlet no inicia:** Ejecuta `systemctl --user daemon-reload` y luego `systemctl --user start openclaw.service`. En sistemas sin interfaz, puede que también necesites `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloquea montajes bind:** Deja intacto el comportamiento de montaje predeterminado; el lanzador agrega automáticamente `:Z` en Linux cuando SELinux está en modo enforcing o permissive.

## Relacionado

- [Docker](/es/install/docker)
- [Proceso en segundo plano del Gateway](/es/gateway/background-process)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
