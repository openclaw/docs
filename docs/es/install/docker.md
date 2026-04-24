---
read_when:
    - Quieres un Gateway en contenedor en lugar de instalaciones locales
    - Estás validando el flujo de Docker
summary: Configuración e incorporación opcionales de OpenClaw basadas en Docker
title: Docker
x-i18n:
    generated_at: "2026-04-24T05:34:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker es **opcional**. Úsalo solo si quieres un Gateway en contenedor o validar el flujo de Docker.

## ¿Docker es adecuado para mí?

- **Sí**: quieres un entorno de Gateway aislado y desechable, o ejecutar OpenClaw en un host sin instalaciones locales.
- **No**: lo ejecutas en tu propia máquina y solo quieres el bucle de desarrollo más rápido. Usa el flujo de instalación normal en su lugar.
- **Nota sobre sandboxing**: el backend de sandbox predeterminado usa Docker cuando el sandboxing está habilitado, pero el sandboxing está desactivado por defecto y **no** requiere que todo el gateway se ejecute en Docker. También hay disponibles backends de sandbox SSH y OpenShell. Consulta [Sandboxing](/es/gateway/sandboxing).

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para compilar la imagen (`pnpm install` puede morir por OOM en hosts de 1 GB con salida 137)
- Suficiente disco para imágenes y registros
- Si se ejecuta en un VPS/host público, revisa
  [Refuerzo de seguridad para exposición de red](/es/gateway/security),
  especialmente la política de firewall `DOCKER-USER` de Docker.

## Gateway en contenedor

<Steps>
  <Step title="Compilar la imagen">
    Desde la raíz del repositorio, ejecuta el script de configuración:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Esto compila localmente la imagen del gateway. Para usar en su lugar una imagen precompilada:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Las imágenes precompiladas se publican en el
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Etiquetas comunes: `main`, `latest`, `<version>` (por ejemplo `2026.2.26`).

  </Step>

  <Step title="Completar la incorporación">
    El script de configuración ejecuta la incorporación automáticamente. Hará lo siguiente:

    - solicitar API keys de proveedor
    - generar un token del gateway y escribirlo en `.env`
    - iniciar el gateway mediante Docker Compose

    Durante la configuración, la incorporación previa al arranque y las escrituras de configuración se ejecutan mediante
    `openclaw-gateway` directamente. `openclaw-cli` es para comandos que ejecutas después
    de que el contenedor del gateway ya exista.

  </Step>

  <Step title="Abrir la Control UI">
    Abre `http://127.0.0.1:18789/` en tu navegador y pega el secreto compartido
    configurado en Settings. El script de configuración escribe por defecto un token en `.env`; si cambias la configuración del contenedor a autenticación por contraseña, usa esa
    contraseña en su lugar.

    ¿Necesitas otra vez la URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurar canales (opcional)">
    Usa el contenedor CLI para añadir canales de mensajería:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord)

  </Step>
</Steps>

### Flujo manual

Si prefieres ejecutar cada paso tú mismo en lugar de usar el script de configuración:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Ejecuta `docker compose` desde la raíz del repositorio. Si habilitaste `OPENCLAW_EXTRA_MOUNTS`
o `OPENCLAW_HOME_VOLUME`, el script de configuración escribe `docker-compose.extra.yml`;
inclúyelo con `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Como `openclaw-cli` comparte el espacio de nombres de red de `openclaw-gateway`, es una
herramienta posterior al arranque. Antes de `docker compose up -d openclaw-gateway`, ejecuta la incorporación
y las escrituras de configuración de tiempo de instalación a través de `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variables de entorno

El script de configuración acepta estas variables de entorno opcionales:

| Variable                       | Propósito                                                       |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Usar una imagen remota en lugar de compilar localmente          |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Instalar paquetes apt adicionales durante la compilación (separados por espacios) |
| `OPENCLAW_EXTENSIONS`          | Preinstalar dependencias de Plugins en tiempo de compilación (nombres separados por espacios) |
| `OPENCLAW_EXTRA_MOUNTS`        | Bind mounts adicionales del host (separados por comas `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Persistir `/home/node` en un volumen Docker con nombre          |
| `OPENCLAW_SANDBOX`             | Activar el arranque del sandbox (`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_DOCKER_SOCKET`       | Sobrescribir la ruta del socket de Docker                       |

### Comprobaciones de estado

Endpoints de sonda del contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # actividad
curl -fsS http://127.0.0.1:18789/readyz     # preparación
```

La imagen Docker incluye un `HEALTHCHECK` integrado que hace ping a `/healthz`.
Si las comprobaciones siguen fallando, Docker marca el contenedor como `unhealthy` y
los sistemas de orquestación pueden reiniciarlo o sustituirlo.

Instantánea autenticada de estado profundo:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a loopback

`scripts/docker/setup.sh` usa por defecto `OPENCLAW_GATEWAY_BIND=lan` para que el acceso del host a
`http://127.0.0.1:18789` funcione con la publicación de puertos de Docker.

- `lan` (predeterminado): el navegador del host y la CLI del host pueden alcanzar el puerto publicado del gateway.
- `loopback`: solo los procesos dentro del espacio de nombres de red del contenedor pueden alcanzar
  el gateway directamente.

<Note>
Usa valores de modo de bind en `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), no alias de host como `0.0.0.0` o `127.0.0.1`.
</Note>

### Almacenamiento y persistencia

Docker Compose monta por bind `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw` y
`OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace`, por lo que esas rutas
sobreviven al reemplazo del contenedor.

Ese directorio de configuración montado es donde OpenClaw guarda:

- `openclaw.json` para la configuración de comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para la autenticación almacenada OAuth/API key de proveedores
- `.env` para secretos de runtime respaldados por env como `OPENCLAW_GATEWAY_TOKEN`

Para ver todos los detalles de persistencia en despliegues de VM, consulta
[Docker VM Runtime - Qué persiste y dónde](/es/install/docker-vm-runtime#what-persists-where).

**Puntos críticos de crecimiento en disco:** vigila `media/`, archivos JSONL de sesiones, `cron/runs/*.jsonl`
y registros rotativos bajo `/tmp/openclaw/`.

### Helpers de shell (opcional)

Para una gestión diaria más sencilla de Docker, instala `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si instalaste ClawDock desde la antigua ruta raw `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a ejecutar el comando de instalación anterior para que tu archivo helper local siga la nueva ubicación.

Después usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Ejecuta
`clawdock-help` para ver todos los comandos.
Consulta [ClawDock](/es/install/clawdock) para la guía completa de helpers.

<AccordionGroup>
  <Accordion title="Habilitar sandbox del agente para el Gateway en Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Ruta de socket personalizada (por ejemplo Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    El script monta `docker.sock` solo después de que se cumplan los requisitos previos del sandbox. Si
    la configuración del sandbox no puede completarse, el script restablece `agents.defaults.sandbox.mode`
    a `off`.

  </Accordion>

  <Accordion title="Automatización / CI (no interactivo)">
    Desactiva la asignación de pseudo-TTY de Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota de seguridad de red compartida">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los comandos de la CLI
    puedan alcanzar el gateway sobre `127.0.0.1`. Trata esto como un límite de
    confianza compartido. La configuración de compose elimina `NET_RAW`/`NET_ADMIN` y habilita
    `no-new-privileges` en `openclaw-cli`.
  </Accordion>

  <Accordion title="Permisos y EACCES">
    La imagen se ejecuta como `node` (uid 1000). Si ves errores de permisos en
    `/home/node/.openclaw`, asegúrate de que tus bind mounts del host pertenezcan a uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Reconstrucciones más rápidas">
    Ordena tu Dockerfile para que las capas de dependencias se almacenen en caché. Esto evita volver a ejecutar
    `pnpm install` salvo que cambien los lockfiles:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Opciones de contenedor para usuarios avanzados">
    La imagen predeterminada prioriza la seguridad y se ejecuta como `node` sin privilegios de root. Para un contenedor
    más completo:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependencias del sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores de Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistir descargas del navegador**: configura
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` y usa
       `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sin interfaz)">
    Si eliges OpenAI Codex OAuth en el asistente, este abre una URL en el navegador. En
    configuraciones Docker o headless, copia la URL completa de redirección a la que llegues y pégala
    de vuelta en el asistente para finalizar la autenticación.
  </Accordion>

  <Accordion title="Metadatos de imagen base">
    La imagen Docker principal usa `node:24-bookworm` y publica anotaciones OCI de imagen base
    que incluyen `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, entre otras. Consulta
    [Anotaciones de imagen OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Ejecución en un VPS?

Consulta [Hetzner (Docker VPS)](/es/install/hetzner) y
[Docker VM Runtime](/es/install/docker-vm-runtime) para pasos compartidos de despliegue en VM,
incluida la preparación de binarios, persistencia y actualizaciones.

## Agent Sandbox

Cuando `agents.defaults.sandbox` está habilitado con el backend Docker, el gateway
ejecuta la ejecución de herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores Docker aislados mientras el propio gateway permanece en el host. Esto te da una barrera dura
alrededor de sesiones de agente no confiables o multiinquilino sin tener que contenerizar todo el
gateway.

El ámbito del sandbox puede ser por agente (predeterminado), por sesión o compartido. Cada ámbito
obtiene su propio espacio de trabajo montado en `/workspace`. También puedes configurar
políticas de herramientas de permitir/denegar, aislamiento de red, límites de recursos y contenedores
de navegador.

Para ver la configuración completa, imágenes, notas de seguridad y perfiles multiagente, consulta:

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa de sandbox
- [OpenShell](/es/gateway/openshell) -- acceso interactivo de shell a contenedores de sandbox
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- sobrescrituras por agente

### Activación rápida

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Compila la imagen predeterminada del sandbox:

```bash
scripts/sandbox-setup.sh
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor sandbox no arranca">
    Compila la imagen del sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    o configura `agents.defaults.sandbox.docker.image` con tu imagen personalizada.
    Los contenedores se crean automáticamente por sesión cuando se necesitan.
  </Accordion>

  <Accordion title="Errores de permisos en el sandbox">
    Configura `docker.user` con un UID:GID que coincida con la propiedad de tu espacio de trabajo montado,
    o haz chown de la carpeta del espacio de trabajo.
  </Accordion>

  <Accordion title="No se encuentran herramientas personalizadas en el sandbox">
    OpenClaw ejecuta los comandos con `sh -lc` (shell de login), que carga
    `/etc/profile` y puede restablecer PATH. Configura `docker.env.PATH` para anteponer tus
    rutas de herramientas personalizadas, o añade un script bajo `/etc/profile.d/` en tu Dockerfile.
  </Accordion>

  <Accordion title="El proceso muere por OOM durante la compilación de la imagen (salida 137)">
    La VM necesita al menos 2 GB de RAM. Usa una clase de máquina mayor y vuelve a intentarlo.
  </Accordion>

  <Accordion title="Unauthorized o Pairing required en la Control UI">
    Obtén un enlace nuevo del dashboard y aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más detalle: [Dashboard](/es/web/dashboard), [Devices](/es/cli/devices).

  </Accordion>

  <Accordion title="El destino del gateway muestra ws://172.x.x.x o errores de Pairing desde la CLI de Docker">
    Restablece el modo y el bind del gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen de instalación](/es/install) — todos los métodos de instalación
- [Podman](/es/install/podman) — alternativa con Podman a Docker
- [ClawDock](/es/install/clawdock) — configuración comunitaria con Docker Compose
- [Actualización](/es/install/updating) — mantener OpenClaw actualizado
- [Configuración](/es/gateway/configuration) — configuración del gateway después de la instalación
