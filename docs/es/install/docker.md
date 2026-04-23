---
read_when:
    - Quieres un Gateway en contenedor en lugar de instalaciones locales
    - Estás validando el flujo de Docker
summary: Configuración e incorporación opcionales basadas en Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-23T14:03:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (opcional)

Docker es **opcional**. Úsalo solo si quieres un Gateway en contenedor o validar el flujo de Docker.

## ¿Docker es adecuado para mí?

- **Sí**: quieres un entorno de Gateway aislado y desechable o ejecutar OpenClaw en un host sin instalaciones locales.
- **No**: estás ejecutándolo en tu propia máquina y solo quieres el bucle de desarrollo más rápido. Usa el flujo de instalación normal en su lugar.
- **Nota sobre entorno aislado**: el backend predeterminado de entorno aislado usa Docker cuando el entorno aislado está habilitado, pero el entorno aislado está desactivado de forma predeterminada y **no** requiere que el Gateway completo se ejecute en Docker. También hay disponibles backends de entorno aislado SSH y OpenShell. Consulta [Sandboxing](/es/gateway/sandboxing).

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para la compilación de la imagen (`pnpm install` puede terminar por OOM en hosts de 1 GB con código de salida 137)
- Espacio suficiente en disco para imágenes y registros
- Si se ejecuta en un VPS/host público, revisa
  [Endurecimiento de seguridad para exposición de red](/es/gateway/security),
  especialmente la política de firewall `DOCKER-USER` de Docker.

## Gateway en contenedor

<Steps>
  <Step title="Compila la imagen">
    Desde la raíz del repositorio, ejecuta el script de configuración:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Esto compila la imagen del Gateway localmente. Para usar una imagen precompilada en su lugar:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Las imágenes precompiladas se publican en el
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Etiquetas comunes: `main`, `latest`, `<version>` (por ejemplo, `2026.2.26`).

  </Step>

  <Step title="Completa la incorporación">
    El script de configuración ejecuta la incorporación automáticamente. Hará lo siguiente:

    - solicitar claves API del proveedor
    - generar un token de Gateway y escribirlo en `.env`
    - iniciar el Gateway mediante Docker Compose

    Durante la configuración, la incorporación previa al inicio y las escrituras de configuración se ejecutan mediante
    `openclaw-gateway` directamente. `openclaw-cli` es para los comandos que ejecutas después de
    que el contenedor del gateway ya existe.

  </Step>

  <Step title="Abre la UI de control">
    Abre `http://127.0.0.1:18789/` en tu navegador y pega el
    secreto compartido configurado en Settings. El script de configuración escribe un token en `.env` de
    forma predeterminada; si cambias la configuración del contenedor a autenticación por contraseña, usa esa
    contraseña en su lugar.

    ¿Necesitas la URL otra vez?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configura canales (opcional)">
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
herramienta posterior al inicio. Antes de `docker compose up -d openclaw-gateway`, ejecuta la incorporación
y las escrituras de configuración en tiempo de configuración mediante `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variables de entorno

El script de configuración acepta estas variables de entorno opcionales:

| Variable                       | Propósito                                                       |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Usar una imagen remota en lugar de compilar localmente          |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Instalar paquetes apt adicionales durante la compilación (separados por espacios) |
| `OPENCLAW_EXTENSIONS`          | Preinstalar dependencias de plugins en tiempo de compilación (nombres separados por espacios) |
| `OPENCLAW_EXTRA_MOUNTS`        | Montajes bind adicionales del host (separados por comas `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Conservar `/home/node` en un volumen Docker con nombre         |
| `OPENCLAW_SANDBOX`             | Aceptar el arranque del entorno aislado (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`       | Anular la ruta del socket de Docker                             |

### Comprobaciones de estado

Endpoints de sondeo del contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # actividad
curl -fsS http://127.0.0.1:18789/readyz     # preparación
```

La imagen Docker incluye un `HEALTHCHECK` integrado que consulta `/healthz`.
Si las comprobaciones siguen fallando, Docker marca el contenedor como `unhealthy` y
los sistemas de orquestación pueden reiniciarlo o reemplazarlo.

Instantánea profunda autenticada del estado:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a loopback

`scripts/docker/setup.sh` usa de forma predeterminada `OPENCLAW_GATEWAY_BIND=lan` para que el acceso desde el host a
`http://127.0.0.1:18789` funcione con la publicación de puertos de Docker.

- `lan` (predeterminado): el navegador del host y el CLI del host pueden alcanzar el puerto publicado del gateway.
- `loopback`: solo los procesos dentro del espacio de nombres de red del contenedor pueden alcanzar
  directamente el gateway.

<Note>
Usa valores de modo de bind en `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), no alias de host como `0.0.0.0` o `127.0.0.1`.
</Note>

### Almacenamiento y persistencia

Docker Compose monta mediante bind `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw` y
`OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace`, por lo que esas rutas
sobreviven al reemplazo del contenedor.

Ese directorio de configuración montado es donde OpenClaw guarda:

- `openclaw.json` para la configuración de comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para autenticación almacenada del proveedor OAuth/clave API
- `.env` para secrets de tiempo de ejecución respaldados por variables de entorno, como `OPENCLAW_GATEWAY_TOKEN`

Para detalles completos de persistencia en implementaciones de VM, consulta
[Docker VM Runtime - Qué se conserva y dónde](/es/install/docker-vm-runtime#what-persists-where).

**Puntos críticos de crecimiento en disco:** vigila `media/`, archivos JSONL de sesión, `cron/runs/*.jsonl`
y los registros rotativos bajo `/tmp/openclaw/`.

### Ayudantes de shell (opcional)

Para facilitar la gestión diaria de Docker, instala `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si instalaste ClawDock desde la antigua ruta raw `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a ejecutar el comando de instalación anterior para que tu archivo ayudante local siga la nueva ubicación.

Luego usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Ejecuta
`clawdock-help` para ver todos los comandos.
Consulta [ClawDock](/es/install/clawdock) para la guía completa del ayudante.

<AccordionGroup>
  <Accordion title="Habilitar entorno aislado del agente para Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Ruta personalizada del socket (por ejemplo, Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    El script monta `docker.sock` solo después de que los requisitos previos del entorno aislado se cumplan. Si
    la configuración del entorno aislado no puede completarse, el script restablece `agents.defaults.sandbox.mode`
    a `off`.

  </Accordion>

  <Accordion title="Automatización / CI (no interactivo)">
    Deshabilita la asignación de pseudo-TTY de Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota de seguridad de red compartida">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los comandos
    CLI puedan alcanzar el gateway a través de `127.0.0.1`. Trata esto como un límite
    de confianza compartido. La configuración de Compose elimina `NET_RAW`/`NET_ADMIN` y habilita
    `no-new-privileges` en `openclaw-cli`.
  </Accordion>

  <Accordion title="Permisos y EACCES">
    La imagen se ejecuta como `node` (uid 1000). Si ves errores de permisos en
    `/home/node/.openclaw`, asegúrate de que los montajes bind del host pertenezcan a uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Reconstrucciones más rápidas">
    Ordena tu Dockerfile para que las capas de dependencias se mantengan en caché. Esto evita volver a ejecutar
    `pnpm install` a menos que cambien los archivos lock:

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
    La imagen predeterminada prioriza la seguridad y se ejecuta como `node` sin root. Para un
    contenedor con más funciones:

    1. **Conservar `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incorporar dependencias del sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Conservar descargas del navegador**: establece
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` y usa
       `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth de OpenAI Codex (Docker sin encabezado)">
    Si eliges OAuth de OpenAI Codex en el asistente, se abre una URL en el navegador. En
    configuraciones Docker o sin encabezado, copia la URL completa de redirección en la que termines y pégala
    de vuelta en el asistente para completar la autenticación.
  </Accordion>

  <Accordion title="Metadatos de imagen base">
    La imagen principal de Docker usa `node:24-bookworm` y publica anotaciones OCI de imagen base,
    incluidas `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` y otras. Consulta
    [anotaciones de imagen OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Se ejecuta en un VPS?

Consulta [Hetzner (Docker VPS)](/es/install/hetzner) y
[Docker VM Runtime](/es/install/docker-vm-runtime) para los pasos de implementación en VM compartida,
incluidos incorporación de binarios, persistencia y actualizaciones.

## Entorno aislado del agente

Cuando `agents.defaults.sandbox` está habilitado con el backend de Docker, el gateway
ejecuta la ejecución de herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores Docker
aislados mientras el gateway mismo permanece en el host. Esto te da un muro duro
alrededor de sesiones de agente no confiables o multiinquilino sin poner en contenedor todo el
gateway.

El alcance del entorno aislado puede ser por agente (predeterminado), por sesión o compartido. Cada alcance
obtiene su propio espacio de trabajo montado en `/workspace`. También puedes configurar
políticas de permitir/denegar herramientas, aislamiento de red, límites de recursos y contenedores
de navegador.

Para la configuración completa, imágenes, notas de seguridad y perfiles multiagente, consulta:

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa del entorno aislado
- [OpenShell](/es/gateway/openshell) -- acceso interactivo de shell a contenedores de entorno aislado
- [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente

### Habilitación rápida

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

Compila la imagen predeterminada del entorno aislado:

```bash
scripts/sandbox-setup.sh
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor de entorno aislado no se inicia">
    Compila la imagen del entorno aislado con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    o establece `agents.defaults.sandbox.docker.image` en tu imagen personalizada.
    Los contenedores se crean automáticamente por sesión bajo demanda.
  </Accordion>

  <Accordion title="Errores de permisos en el entorno aislado">
    Establece `docker.user` en un UID:GID que coincida con la propiedad de tu espacio de trabajo montado,
    o cambia el propietario de la carpeta del espacio de trabajo.
  </Accordion>

  <Accordion title="No se encuentran herramientas personalizadas en el entorno aislado">
    OpenClaw ejecuta comandos con `sh -lc` (shell de inicio de sesión), que carga
    `/etc/profile` y puede restablecer PATH. Establece `docker.env.PATH` para anteponer tus
    rutas de herramientas personalizadas, o añade un script en `/etc/profile.d/` en tu Dockerfile.
  </Accordion>

  <Accordion title="Finalizado por OOM durante la compilación de la imagen (salida 137)">
    La VM necesita al menos 2 GB de RAM. Usa una clase de máquina mayor y vuelve a intentarlo.
  </Accordion>

  <Accordion title="No autorizado o se requiere emparejamiento en la UI de control">
    Obtén un enlace nuevo al panel y aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más detalles: [Panel](/es/web/dashboard), [Dispositivos](/es/cli/devices).

  </Accordion>

  <Accordion title="El destino del Gateway muestra ws://172.x.x.x o errores de emparejamiento desde el CLI de Docker">
    Restablece el modo y el bind del gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen de instalación](/es/install) — todos los métodos de instalación
- [Podman](/es/install/podman) — alternativa Podman a Docker
- [ClawDock](/es/install/clawdock) — configuración comunitaria de Docker Compose
- [Actualización](/es/install/updating) — cómo mantener OpenClaw actualizado
- [Configuración](/es/gateway/configuration) — configuración del gateway después de la instalación
