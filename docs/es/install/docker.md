---
read_when:
    - Quieres un Gateway en contenedor en lugar de instalaciones locales
    - Estás validando el flujo de Docker
summary: Configuración e incorporación opcionales basadas en Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:44:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker es **opcional**. Úsalo solo si quieres un Gateway en contenedor o validar el flujo de Docker.

## ¿Docker es adecuado para mí?

- **Sí**: quieres un entorno de Gateway aislado y descartable, o ejecutar OpenClaw en un host sin instalaciones locales.
- **No**: estás ejecutándolo en tu propia máquina y solo quieres el bucle de desarrollo más rápido. Usa en su lugar el flujo de instalación normal.
- **Nota sobre sandboxing**: el backend de sandbox predeterminado usa Docker cuando sandboxing está habilitado, pero sandboxing está desactivado de forma predeterminada y **no** requiere que todo el Gateway se ejecute en Docker. También están disponibles los backends de sandbox SSH y OpenShell. Consulta [Sandboxing](/es/gateway/sandboxing).

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para compilar la imagen (`pnpm install` puede ser terminado por OOM en hosts de 1 GB con salida 137)
- Espacio suficiente en disco para imágenes y registros
- Si se ejecuta en un VPS/host público, revisa
  [Endurecimiento de seguridad para exposición de red](/es/gateway/security),
  especialmente la política de firewall `DOCKER-USER` de Docker.

## Gateway en contenedor

<Steps>
  <Step title="Build the image">
    Desde la raíz del repositorio, ejecuta el script de configuración:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Esto compila la imagen del Gateway localmente. Para usar una imagen precompilada en su lugar:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Las imágenes precompiladas se publican primero en
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR es el registro principal para la automatización de lanzamientos, despliegues fijados
    y comprobaciones de procedencia. El mismo flujo de lanzamiento también publica un espejo oficial
    de Docker Hub en `openclaw/openclaw` para hosts que prefieren Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Usa `ghcr.io/openclaw/openclaw` u `openclaw/openclaw`. Evita los espejos comunitarios
    de Docker Hub porque OpenClaw no controla su calendario de lanzamiento,
    recompilaciones ni política de retención. Etiquetas oficiales comunes: `main`, `latest`,
    `<version>` (por ejemplo, `2026.2.26`) y versiones beta como
    `2026.2.26-beta.1`. Las etiquetas beta no mueven `latest` ni `main`.

  </Step>

  <Step title="Airgapped rerun">
    En hosts sin conexión, transfiere y carga primero la imagen:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica que `OPENCLAW_IMAGE` ya exista localmente, deshabilita
    extracciones y compilaciones implícitas de Compose, y luego ejecuta el flujo de configuración normal, como
    sincronización de `.env`, correcciones de permisos, onboarding, sincronización de configuración del Gateway
    e inicio de Compose.

    Si `OPENCLAW_SANDBOX=1`, la configuración sin conexión también comprueba las imágenes de sandbox predeterminadas configuradas
    y activas por agente en el daemon detrás de
    `OPENCLAW_DOCKER_SOCKET`. Las imágenes de navegador respaldadas por Docker también deben llevar la
    etiqueta actual del contrato de navegador de OpenClaw. Cuando falta una imagen requerida o
    es incompatible, la configuración sale sin cambiar la configuración de sandbox en lugar de
    informar éxito con un sandbox inutilizable.

  </Step>

  <Step title="Complete onboarding">
    El script de configuración ejecuta onboarding automáticamente. Hará lo siguiente:

    - solicitar claves API del proveedor
    - generar un token de Gateway y escribirlo en `.env`
    - crear el directorio de clave secreta de perfil de autenticación
    - iniciar el Gateway mediante Docker Compose

    Durante la configuración, el onboarding previo al inicio y las escrituras de configuración se ejecutan mediante
    `openclaw-gateway` directamente. `openclaw-cli` es para comandos que ejecutas después de que
    el contenedor del Gateway ya existe.

  </Step>

  <Step title="Open the Control UI">
    Abre `http://127.0.0.1:18789/` en tu navegador y pega el secreto compartido
    configurado en Settings. El script de configuración escribe un token en `.env` de forma
    predeterminada; si cambias la configuración del contenedor a autenticación por contraseña, usa esa
    contraseña en su lugar.

    ¿Necesitas la URL otra vez?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    Usa el contenedor de la CLI para agregar canales de mensajería:

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

Si prefieres ejecutar cada paso por tu cuenta en lugar de usar el script de configuración:

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
u `OPENCLAW_HOME_VOLUME`, el script de configuración escribe `docker-compose.extra.yml`;
inclúyelo después de cualquier archivo de sobrescritura estándar, por ejemplo
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
cuando ambos archivos de sobrescritura existan.
</Note>

<Note>
Como `openclaw-cli` comparte el espacio de nombres de red de `openclaw-gateway`, es una
herramienta posterior al inicio. Antes de `docker compose up -d openclaw-gateway`, ejecuta onboarding
y las escrituras de configuración en tiempo de configuración mediante `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variables de entorno

El script de configuración acepta estas variables de entorno opcionales:

| Variable                                   | Propósito                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usar una imagen remota en lugar de compilar localmente                  |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Instalar paquetes apt adicionales durante la compilación (separados por espacios) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Instalar paquetes de Python adicionales durante la compilación (separados por espacios) |
| `OPENCLAW_EXTENSIONS`                      | Preinstalar dependencias de plugins en tiempo de compilación (nombres separados por espacios) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montajes bind de host adicionales (separados por comas `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Persistir `/home/node` en un volumen Docker con nombre                 |
| `OPENCLAW_SANDBOX`                         | Optar por el arranque de sandbox (`1`, `true`, `yes`, `on`)            |
| `OPENCLAW_SKIP_ONBOARDING`                 | Omitir el paso de onboarding interactivo (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`                   | Sobrescribir la ruta del socket de Docker                              |
| `OPENCLAW_DISABLE_BONJOUR`                 | Deshabilitar anuncios Bonjour/mDNS (predeterminado en `1` para Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Deshabilitar superposiciones de montaje bind de código fuente de plugins incluidos |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint compartido del colector OTLP/HTTP para exportación de OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos de señal para trazas, métricas o registros |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Sobrescritura del protocolo OTLP. Hoy solo se admite `http/protobuf`   |
| `OTEL_SERVICE_NAME`                        | Nombre de servicio usado para recursos de OpenTelemetry                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Optar por los atributos semánticos experimentales GenAI más recientes  |
| `OPENCLAW_OTEL_PRELOADED`                  | Omitir el inicio de un segundo SDK de OpenTelemetry cuando uno ya está precargado |

La imagen oficial de Docker no incluye Homebrew. Durante onboarding, OpenClaw
oculta los instaladores de dependencias de Skills solo para brew cuando se está ejecutando en un contenedor
Linux sin `brew`; esas dependencias deben proporcionarse mediante una imagen personalizada
o instalarse manualmente. Para dependencias disponibles en paquetes Debian, usa
`OPENCLAW_IMAGE_APT_PACKAGES` durante la compilación de la imagen. El nombre heredado
`OPENCLAW_DOCKER_APT_PACKAGES` sigue siendo aceptado.
Para dependencias de Python, usa `OPENCLAW_IMAGE_PIP_PACKAGES`. Esto ejecuta
`python3 -m pip install --break-system-packages` durante la compilación de la imagen, así que fija
las versiones de paquetes y usa solo índices de paquetes en los que confíes.

Los mantenedores pueden probar el código fuente de plugins incluidos contra una imagen empaquetada montando
un directorio de código fuente de un plugin sobre su ruta de código empaquetada, por ejemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ese directorio de código fuente montado sobrescribe el paquete compilado correspondiente de
`/app/dist/extensions/synology-chat` para el mismo id de plugin.

### Observabilidad

La exportación de OpenTelemetry es saliente desde el contenedor del Gateway hacia tu colector
OTLP. No requiere un puerto Docker publicado. Si compilas la imagen
localmente y quieres que el exportador de OpenTelemetry incluido esté disponible dentro de la imagen,
incluye sus dependencias de runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instala el plugin oficial `@openclaw/diagnostics-otel` desde ClawHub en
instalaciones Docker empaquetadas antes de habilitar la exportación. Las imágenes personalizadas compiladas desde código fuente todavía pueden
incluir el código fuente local del plugin con
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Para habilitar la exportación, permite y habilita el
plugin `diagnostics-otel` en la configuración, luego establece
`diagnostics.otel.enabled=true` o usa el ejemplo de configuración en [Exportación de OpenTelemetry
](/es/gateway/opentelemetry). Los encabezados de autenticación del colector se configuran mediante
`diagnostics.otel.headers`, no mediante variables de entorno de Docker.

Las métricas de Prometheus usan el puerto del Gateway ya publicado. Instala
`clawhub:@openclaw/diagnostics-prometheus`, habilita el
plugin `diagnostics-prometheus` y luego recolecta:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La ruta está protegida por autenticación del Gateway. No expongas un puerto
público `/metrics` separado ni una ruta de proxy inverso no autenticada. Consulta
[Métricas de Prometheus](/es/gateway/prometheus).

### Comprobaciones de salud

Endpoints de prueba del contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

La imagen de Docker incluye un `HEALTHCHECK` integrado que hace ping a `/healthz`.
Si las comprobaciones siguen fallando, Docker marca el contenedor como `unhealthy` y
los sistemas de orquestación pueden reiniciarlo o reemplazarlo.

Instantánea profunda de salud autenticada:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a loopback

`scripts/docker/setup.sh` establece de forma predeterminada `OPENCLAW_GATEWAY_BIND=lan` para que el acceso desde el host a
`http://127.0.0.1:18789` funcione con la publicación de puertos de Docker.

- `lan` (predeterminado): el navegador del host y la CLI del host pueden alcanzar el puerto publicado del Gateway.
- `loopback`: solo los procesos dentro del espacio de nombres de red del contenedor pueden alcanzar
  el Gateway directamente.

<Note>
Usa valores de modo de bind en `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), no alias de host como `0.0.0.0` o `127.0.0.1`.
</Note>

### Proveedores locales del host

Cuando OpenClaw se ejecuta en Docker, `127.0.0.1` dentro del contenedor es el propio contenedor,
no tu máquina host. Usa `host.docker.internal` para proveedores de IA que
se ejecutan en el host:

| Proveedor | URL predeterminada del host | URL de configuración de Docker       |
| --------- | --------------------------- | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234`     | `http://host.docker.internal:1234`   |
| Ollama    | `http://127.0.0.1:11434`    | `http://host.docker.internal:11434`  |

La configuración de Docker incluida usa esas URL del host como valores predeterminados de incorporación para LM Studio y Ollama, y `docker-compose.yml` asigna `host.docker.internal` al Gateway del host de Docker para Docker Engine en Linux. Docker Desktop ya proporciona el mismo nombre de host en macOS y Windows.

Los servicios del host también deben escuchar en una dirección accesible desde Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Si usas tu propio archivo Compose o comando `docker run`, agrega tú mismo la misma asignación de host, por ejemplo
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI en Docker

La imagen oficial de Docker de OpenClaw no preinstala Claude Code. Instala e inicia sesión en Claude Code dentro del usuario del contenedor que ejecuta OpenClaw, y luego conserva ese directorio de inicio del contenedor para que las actualizaciones de imagen no borren el binario ni el estado de autenticación de Claude.

Para instalaciones nuevas de Docker, habilita un volumen persistente de `/home/node` antes de ejecutar la configuración:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para una instalación existente de Docker, detén primero la pila y vuelve a cargar los valores actuales de `.env` de Docker antes de ejecutar de nuevo la configuración. El script de configuración no lee `.env` por sí solo; reescribe `.env` desde el shell actual y los valores predeterminados. Para el `.env` generado, ejecuta:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Si tu `.env` contiene valores que tu shell no puede cargar, vuelve a exportar manualmente primero los valores existentes de los que dependes, como `OPENCLAW_IMAGE`, puertos, modo de enlace, rutas personalizadas, `OPENCLAW_EXTRA_MOUNTS`, sandbox y ajustes para omitir la incorporación. La superposición generada monta el volumen de inicio tanto para `openclaw-gateway` como para `openclaw-cli`.

Ejecuta los comandos restantes con la superposición Compose generada para que ambos servicios monten el inicio persistente. Si tu configuración también usa `docker-compose.override.yml`, inclúyelo antes de `docker-compose.extra.yml`.

Instala Claude Code en ese inicio persistente:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

El instalador nativo escribe el binario `claude` en
`/home/node/.local/bin/claude`. Indica a OpenClaw que use esa ruta del contenedor:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Inicia sesión y verifica desde dentro del mismo inicio persistente del contenedor:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Después de eso, puedes usar el backend `claude-cli` incluido:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` conserva la instalación nativa de Claude Code en
`/home/node/.local/bin` y `/home/node/.local/share/claude`, además de la configuración y el estado de autenticación de Claude Code en `/home/node/.claude` y `/home/node/.claude.json`. Conservar solo `/home/node/.openclaw` no es suficiente para reutilizar Claude CLI. Si usas `OPENCLAW_EXTRA_MOUNTS` en lugar de un volumen de inicio, monta todas esas rutas de Claude en ambos servicios de Docker.

<Note>
Para automatización de producción compartida o facturación predecible de Anthropic, prefiere la ruta con clave de API de Anthropic. La reutilización de Claude CLI sigue la versión instalada, el inicio de sesión de la cuenta, la facturación y el comportamiento de actualización de Claude Code.
</Note>

### Bonjour / mDNS

La red bridge de Docker normalmente no reenvía de forma fiable el multicast Bonjour/mDNS (`224.0.0.251:5353`). Por eso, la configuración Compose incluida establece de forma predeterminada
`OPENCLAW_DISABLE_BONJOUR=1` para que el Gateway no entre en un bucle de bloqueos ni reinicie repetidamente la publicidad cuando el bridge descarta tráfico multicast.

Usa la URL publicada del Gateway, Tailscale o DNS-SD de área amplia para hosts Docker. Establece `OPENCLAW_DISABLE_BONJOUR=0` solo cuando ejecutes con red de host, macvlan u otra red donde se sepa que el multicast mDNS funciona.

Para detalles y solución de problemas, consulta [detección Bonjour](/es/gateway/bonjour).

### Almacenamiento y persistencia

Docker Compose monta con bind `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace` y
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` en `/home/node/.config/openclaw`, por lo que esas rutas sobreviven al reemplazo del contenedor. Cuando alguna variable no está definida, el `docker-compose.yml` incluido recurre a `${HOME}`, o a `/tmp` cuando tampoco existe `HOME`. Eso evita que `docker compose up` emita una especificación de volumen con origen vacío en entornos básicos.

Ese directorio de configuración montado es donde OpenClaw mantiene:

- `openclaw.json` para la configuración de comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para la autenticación OAuth/clave de API de proveedor almacenada
- `.env` para secretos de runtime respaldados por env, como `OPENCLAW_GATEWAY_TOKEN`

El directorio de clave secreta de perfiles de autenticación almacena la clave de cifrado local usada para el material de tokens de perfiles de autenticación respaldados por OAuth. Mantenlo con el estado de tu host Docker, pero separado de `OPENCLAW_CONFIG_DIR`.

Los Plugins descargables instalados almacenan su estado de paquete bajo el inicio de OpenClaw montado, por lo que los registros de instalación de Plugins y las raíces de paquetes sobreviven al reemplazo del contenedor. El inicio del Gateway no genera árboles de dependencias de Plugins incluidos.

Para detalles completos de persistencia en implementaciones de VM, consulta
[Runtime de VM de Docker - Qué persiste dónde](/es/install/docker-vm-runtime#what-persists-where).

**Puntos críticos de crecimiento de disco:** vigila `media/`, los archivos JSONL de sesión, la base de datos de estado SQLite compartida, las raíces de paquetes de Plugins instalados y los registros de archivo rotativos en `/tmp/openclaw/`.

### Ayudantes de shell (opcional)

Para facilitar la gestión diaria de Docker, instala `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si instalaste ClawDock desde la ruta raw anterior `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a ejecutar el comando de instalación anterior para que tu archivo auxiliar local siga la nueva ubicación.

Luego usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Ejecuta
`clawdock-help` para ver todos los comandos.
Consulta [ClawDock](/es/install/clawdock) para ver la guía completa de ayudantes.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Ruta de socket personalizada (por ejemplo, Docker sin root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    El script monta `docker.sock` solo después de que se cumplan los requisitos previos del sandbox. Si la configuración del sandbox no puede completarse, el script restablece `agents.defaults.sandbox.mode`
    a `off`. Los turnos de modo de código de Codex siguen estando limitados a Codex
    `workspace-write` mientras el sandbox de OpenClaw está activo; no montes el socket de Docker del host en contenedores de sandbox de agente.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Deshabilita la asignación de pseudo-TTY de Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los comandos de CLI puedan llegar al Gateway a través de `127.0.0.1`. Trata esto como un límite de confianza compartido. La configuración de compose elimina `NET_RAW`/`NET_ADMIN` y habilita
    `no-new-privileges` tanto en `openclaw-gateway` como en `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    Algunas configuraciones de Docker Desktop fallan en las búsquedas DNS desde el sidecar de red compartida `openclaw-cli` después de eliminar `NET_RAW`, lo que aparece como
    `EAI_AGAIN` durante comandos respaldados por npm como `openclaw plugins install`.
    Mantén el archivo compose endurecido predeterminado para el funcionamiento normal del Gateway. La anulación local siguiente relaja la postura de seguridad del contenedor CLI al restaurar las capacidades predeterminadas de Docker, así que úsala solo para el comando CLI puntual que necesita acceso al registro de paquetes, no como tu invocación Compose predeterminada:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Si ya creaste un contenedor `openclaw-cli` de larga duración, recréalo con la misma anulación. `docker compose exec` y `docker exec` no pueden cambiar las capacidades de Linux en un contenedor ya creado.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    La imagen se ejecuta como `node` (uid 1000). Si ves errores de permisos en
    `/home/node/.openclaw`, asegúrate de que los montajes bind de tu host pertenezcan al uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    El mismo desacuerdo puede aparecer como una advertencia de Plugin como
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguida de `plugin present but blocked`. Eso significa que el uid del proceso y el propietario del directorio de Plugin montado no coinciden. Prefiere ejecutar el contenedor con el uid 1000 predeterminado y corregir la propiedad del montaje bind. Solo haz chown de
    `/path/to/openclaw-config/npm` a `root:root` si tienes la intención de ejecutar OpenClaw como root a largo plazo.

  </Accordion>

  <Accordion title="Faster rebuilds">
    Ordena tu Dockerfile para que las capas de dependencias queden en caché. Esto evita volver a ejecutar
    `pnpm install` a menos que cambien los lockfiles:

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

  <Accordion title="Power-user container options">
    La imagen predeterminada prioriza la seguridad y se ejecuta como `node` sin root. Para un contenedor con más funciones:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incorporar dependencias del sistema**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Incorporar dependencias de Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Incorporar Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **O instalar navegadores de Playwright en un volumen persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Persistir descargas del navegador**: usa `OPENCLAW_HOME_VOLUME` u
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw detecta automáticamente en Linux el Chromium
       gestionado por Playwright de la imagen Docker.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sin interfaz gráfica)">
    Si eliges OpenAI Codex OAuth en el asistente, se abre una URL del navegador. En
    Docker o configuraciones sin interfaz gráfica, copia la URL de redirección completa a la que llegues y pégala
    de nuevo en el asistente para completar la autenticación.
  </Accordion>

  <Accordion title="Metadatos de la imagen base">
    La imagen principal de runtime de Docker usa `node:24-bookworm-slim` e incluye `tini` como proceso init de punto de entrada (PID 1) para garantizar que los procesos zombis se recojan y las señales se gestionen correctamente en contenedores de larga ejecución. Publica anotaciones OCI de imagen base, incluidas `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` y otras. El resumen base de Node se
    actualiza mediante PRs de Dependabot para imágenes base Docker; las compilaciones de versión no ejecutan
    una capa de actualización de distribución. Consulta
    [anotaciones de imagen OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Ejecutando en un VPS?

Consulta [Hetzner (VPS Docker)](/es/install/hetzner) y
[Runtime de VM Docker](/es/install/docker-vm-runtime) para ver pasos compartidos de despliegue en VM,
incluida la incorporación de binarios, la persistencia y las actualizaciones.

## Sandbox de agente

Cuando `agents.defaults.sandbox` está habilitado con el backend de Docker, el Gateway
ejecuta la ejecución de herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores Docker
aislados mientras el propio Gateway permanece en el host. Esto te da un muro sólido
alrededor de sesiones de agente no confiables o multiinquilino sin contenerizar todo el
Gateway.

El alcance del sandbox puede ser por agente (predeterminado), por sesión o compartido. Cada alcance
obtiene su propio espacio de trabajo montado en `/workspace`. También puedes configurar
políticas de permitir/denegar herramientas, aislamiento de red, límites de recursos y contenedores de
navegador.

Para la configuración completa, imágenes, notas de seguridad y perfiles multiagente, consulta:

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa del sandbox
- [OpenShell](/es/gateway/openshell) -- acceso interactivo de shell a contenedores sandbox
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- sobrescrituras por agente

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

Compila la imagen de sandbox predeterminada (desde un checkout de código fuente):

```bash
scripts/sandbox-setup.sh
```

Para instalaciones npm sin checkout de código fuente, consulta [Sandboxing § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para comandos `docker build` en línea.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor sandbox no se inicia">
    Compila la imagen de sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout de código fuente) o el comando `docker build` en línea de [Sandboxing § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) (instalación npm),
    o establece `agents.defaults.sandbox.docker.image` en tu imagen personalizada.
    Los contenedores se crean automáticamente por sesión bajo demanda.
  </Accordion>

  <Accordion title="Errores de permisos en el sandbox">
    Establece `docker.user` en un UID:GID que coincida con la propiedad de tu espacio de trabajo montado,
    o cambia el propietario de la carpeta del espacio de trabajo.
  </Accordion>

  <Accordion title="Herramientas personalizadas no encontradas en el sandbox">
    OpenClaw ejecuta comandos con `sh -lc` (shell de inicio de sesión), que carga
    `/etc/profile` y puede restablecer PATH. Establece `docker.env.PATH` para anteponer tus
    rutas de herramientas personalizadas, o añade un script bajo `/etc/profile.d/` en tu Dockerfile.
  </Accordion>

  <Accordion title="Proceso terminado por OOM durante la compilación de la imagen (salida 137)">
    La VM necesita al menos 2 GB de RAM. Usa una clase de máquina más grande y reintenta.
  </Accordion>

  <Accordion title="No autorizado o emparejamiento requerido en la Control UI">
    Obtén un enlace de panel nuevo y aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más detalle: [Dashboard](/es/web/dashboard), [Dispositivos](/es/cli/devices).

  </Accordion>

  <Accordion title="El destino de Gateway muestra ws://172.x.x.x o errores de emparejamiento desde la CLI de Docker">
    Restablece el modo y la vinculación del Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen de instalación](/es/install) — todos los métodos de instalación
- [Podman](/es/install/podman) — alternativa de Podman a Docker
- [ClawDock](/es/install/clawdock) — configuración comunitaria de Docker Compose
- [Actualización](/es/install/updating) — mantener OpenClaw actualizado
- [Configuración](/es/gateway/configuration) — configuración del Gateway después de la instalación
