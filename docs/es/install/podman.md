---
read_when:
    - Quieres un gateway en contenedor con Podman en lugar de Docker
summary: Ejecutar OpenClaw en un contenedor rootless de Podman
title: Podman
x-i18n:
    generated_at: "2026-04-23T14:04:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

Ejecuta el Gateway de OpenClaw en un contenedor rootless de Podman, gestionado por tu usuario actual sin privilegios.

El modelo previsto es:

- Podman ejecuta el contenedor del gateway.
- Tu CLI `openclaw` del host es el plano de control.
- El estado persistente vive en el host bajo `~/.openclaw` de forma predeterminada.
- La gestión diaria usa `openclaw --container <name> ...` en lugar de `sudo -u openclaw`, `podman exec` o un usuario de servicio separado.

## Requisitos previos

- **Podman** en modo rootless
- **CLI de OpenClaw** instalada en el host
- **Opcional:** `systemd --user` si quieres arranque automático gestionado por Quadlet
- **Opcional:** `sudo` solo si quieres `loginctl enable-linger "$(whoami)"` para persistencia tras el arranque en un host sin interfaz

## Inicio rápido

<Steps>
  <Step title="Configuración inicial">
    Desde la raíz del repositorio, ejecuta `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Iniciar el contenedor del Gateway">
    Inicia el contenedor con `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Ejecutar el onboarding dentro del contenedor">
    Ejecuta `./scripts/run-openclaw-podman.sh launch setup`, luego abre `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gestionar el contenedor en ejecución desde la CLI del host">
    Establece `OPENCLAW_CONTAINER=openclaw`, luego usa comandos normales de `openclaw` desde el host.
  </Step>
</Steps>

Detalles de configuración:

- `./scripts/podman/setup.sh` compila `openclaw:local` en tu almacén rootless de Podman de forma predeterminada, o usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si estableces uno.
- Crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` si no existe.
- Crea `~/.openclaw/.env` con `OPENCLAW_GATEWAY_TOKEN` si no existe.
- Para arranques manuales, el ayudante lee solo una pequeña lista de permitidos de claves relacionadas con Podman desde `~/.openclaw/.env` y pasa variables de entorno explícitas de runtime al contenedor; no entrega el archivo env completo a Podman.

Configuración gestionada por Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet es una opción solo para Linux porque depende de servicios de usuario de systemd.

También puedes establecer `OPENCLAW_PODMAN_QUADLET=1`.

Variables de entorno opcionales de compilación/configuración:

- `OPENCLAW_IMAGE` o `OPENCLAW_PODMAN_IMAGE` -- usar una imagen existente/descargada en lugar de compilar `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instalar paquetes apt adicionales durante la compilación de la imagen
- `OPENCLAW_EXTENSIONS` -- preinstalar dependencias de plugins en tiempo de compilación

Inicio del contenedor:

```bash
./scripts/run-openclaw-podman.sh launch
```

El script inicia el contenedor con tu uid/gid actual usando `--userns=keep-id` y monta por enlace tu estado de OpenClaw dentro del contenedor.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Luego abre `http://127.0.0.1:18789/` y usa el token de `~/.openclaw/.env`.

Valor predeterminado de la CLI del host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Luego, comandos como estos se ejecutarán automáticamente dentro de ese contenedor:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # incluye exploración adicional de servicios
openclaw doctor
openclaw channels login
```

En macOS, Podman machine puede hacer que el navegador parezca no local para el gateway.
Si Control UI informa errores de autenticación de dispositivo después del arranque, usa la guía de Tailscale en
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Para HTTPS o acceso remoto al navegador, sigue la documentación principal de Tailscale.

Nota específica de Podman:

- Mantén el host publicado de Podman en `127.0.0.1`.
- Prefiere `tailscale serve` gestionado por el host sobre `openclaw gateway --tailscale serve`.
- En macOS, si el contexto local de autenticación de dispositivo del navegador no es fiable, usa acceso con Tailscale en lugar de soluciones ad hoc de túnel local.

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

Para persistencia tras el arranque en hosts SSH/sin interfaz, habilita lingering para tu usuario actual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuración, entorno y almacenamiento

- **Directorio de configuración:** `~/.openclaw`
- **Directorio de espacio de trabajo:** `~/.openclaw/workspace`
- **Archivo de token:** `~/.openclaw/.env`
- **Ayudante de arranque:** `./scripts/run-openclaw-podman.sh`

El script de arranque y Quadlet montan por enlace el estado del host dentro del contenedor:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

De forma predeterminada, esos son directorios del host, no estado anónimo del contenedor, por lo que `openclaw.json`, `auth-profiles.json` por agente, el estado de canal/proveedor, las sesiones y el espacio de trabajo sobreviven al reemplazo del contenedor.
La configuración de Podman también inicializa `gateway.controlUi.allowedOrigins` para `127.0.0.1` y `localhost` en el puerto publicado del gateway para que el panel local funcione con el enlace no loopback del contenedor.

Variables de entorno útiles para el iniciador manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nombre del contenedor (`openclaw` de forma predeterminada)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- imagen a ejecutar
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- puerto del host asignado al `18789` del contenedor
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- puerto del host asignado al `18790` del contenedor
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfaz del host para puertos publicados; el valor predeterminado es `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modo de enlace del gateway dentro del contenedor; el valor predeterminado es `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (predeterminado), `auto` o `host`

El iniciador manual lee `~/.openclaw/.env` antes de finalizar los valores predeterminados del contenedor/imagen, así que puedes conservarlos allí.

Si usas un `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR` no predeterminado, establece las mismas variables tanto para `./scripts/podman/setup.sh` como para los comandos posteriores `./scripts/run-openclaw-podman.sh launch`. El iniciador local del repositorio no conserva anulaciones de rutas personalizadas entre shells.

Nota sobre Quadlet:

- El servicio Quadlet generado mantiene intencionadamente una forma predeterminada fija y endurecida: puertos publicados en `127.0.0.1`, `--bind lan` dentro del contenedor y espacio de nombres de usuario `keep-id`.
- Fija `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` y `TimeoutStartSec=300`.
- Publica tanto `127.0.0.1:18789:18789` (gateway) como `127.0.0.1:18790:18790` (bridge).
- Lee `~/.openclaw/.env` como `EnvironmentFile` de runtime para valores como `OPENCLAW_GATEWAY_TOKEN`, pero no consume la lista de permitidos de anulaciones específicas de Podman del iniciador manual.
- Si necesitas puertos de publicación personalizados, host de publicación u otros indicadores de ejecución del contenedor, usa el iniciador manual o edita `~/.config/containers/systemd/openclaw.container` directamente, luego recarga y reinicia el servicio.

## Comandos útiles

- **Registros del contenedor:** `podman logs -f openclaw`
- **Detener contenedor:** `podman stop openclaw`
- **Eliminar contenedor:** `podman rm -f openclaw`
- **Abrir URL del panel desde la CLI del host:** `openclaw dashboard --no-open`
- **Salud/estado mediante la CLI del host:** `openclaw gateway status --deep` (sonda RPC + exploración adicional de servicios)

## Solución de problemas

- **Permiso denegado (EACCES) en configuración o espacio de trabajo:** el contenedor se ejecuta con `--userns=keep-id` y `--user <your uid>:<your gid>` de forma predeterminada. Asegúrate de que las rutas de configuración/espacio de trabajo del host pertenezcan a tu usuario actual.
- **Inicio del Gateway bloqueado (falta `gateway.mode=local`):** asegúrate de que exista `~/.openclaw/openclaw.json` y establezca `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea si falta.
- **Los comandos CLI del contenedor apuntan al destino equivocado:** usa `openclaw --container <name> ...` explícitamente, o exporta `OPENCLAW_CONTAINER=<name>` en tu shell.
- **`openclaw update` falla con `--container`:** es lo esperado. Vuelve a compilar/descargar la imagen y luego reinicia el contenedor o el servicio Quadlet.
- **El servicio Quadlet no se inicia:** ejecuta `systemctl --user daemon-reload`, luego `systemctl --user start openclaw.service`. En sistemas sin interfaz también puede que necesites `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloquea montajes por enlace:** deja intacto el comportamiento de montaje predeterminado; el iniciador añade automáticamente `:Z` en Linux cuando SELinux está en modo enforcing o permissive.

## Relacionado

- [Docker](/es/install/docker)
- [Proceso en segundo plano del Gateway](/es/gateway/background-process)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
