---
read_when:
    - Quieres un Gateway en contenedor en lugar de instalaciones locales
    - Estás validando el flujo de Docker
summary: Configuración e incorporación opcionales basadas en Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-27T11:46:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker es **opcional**. Úsalo solo si quieres un Gateway en contenedor o validar el flujo de Docker.

## ¿Docker es adecuado para mí?

- **Sí**: quieres un entorno de Gateway aislado y desechable, o ejecutar OpenClaw en un host sin instalaciones locales.
- **No**: estás ejecutándolo en tu propia máquina y solo quieres el ciclo de desarrollo más rápido. Usa el flujo de instalación normal en su lugar.
- **Nota sobre el aislamiento**: el backend de aislamiento predeterminado usa Docker cuando el aislamiento está habilitado, pero el aislamiento está desactivado de forma predeterminada y **no** requiere que el Gateway completo se ejecute en Docker. También están disponibles los backends de aislamiento SSH y OpenShell. Consulta [Aislamiento](/es/gateway/sandboxing).

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para compilar la imagen (`pnpm install` puede ser terminado por OOM en hosts de 1 GB con salida 137)
- Suficiente espacio en disco para imágenes y registros
- Si se ejecuta en un VPS/host público, revisa
  [Endurecimiento de seguridad para exposición de red](/es/gateway/security),
  especialmente la política de firewall de Docker `DOCKER-USER`.

## Gateway en contenedor

<Steps>
  <Step title="Compilar la imagen">
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

  <Step title="Nueva ejecución sin conexión">
    En hosts sin conexión, transfiere y carga primero la imagen:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica que `OPENCLAW_IMAGE` ya exista localmente, deshabilita
    las descargas y compilaciones implícitas de Compose, y luego ejecuta el flujo
    de configuración normal, como la sincronización de `.env`, correcciones de
    permisos, incorporación, sincronización de configuración del Gateway e inicio
    de Compose.

    Si `OPENCLAW_SANDBOX=1`, la configuración sin conexión también comprueba las
    imágenes de aislamiento predeterminada configurada y activas por agente en el
    daemon detrás de `OPENCLAW_DOCKER_SOCKET`. Las imágenes de navegador respaldadas
    por Docker también deben llevar la etiqueta de contrato de navegador actual de
    OpenClaw. Cuando falta una imagen requerida o es incompatible, la configuración
    sale sin cambiar la configuración de aislamiento en lugar de informar éxito con
    un aislamiento inutilizable.

  </Step>

  <Step title="Completar la incorporación">
    El script de configuración ejecuta la incorporación automáticamente. Hará lo siguiente:

    - solicitar claves API del proveedor
    - generar un token de Gateway y escribirlo en `.env`
    - crear el directorio de clave secreta del perfil de autenticación
    - iniciar el Gateway mediante Docker Compose

    Durante la configuración, la incorporación previa al inicio y las escrituras
    de configuración se ejecutan directamente mediante `openclaw-gateway`.
    `openclaw-cli` es para comandos que ejecutas después de que el contenedor del
    Gateway ya existe.

  </Step>

  <Step title="Abrir la Control UI">
    Abre `http://127.0.0.1:18789/` en tu navegador y pega el secreto compartido
    configurado en Settings. El script de configuración escribe un token en `.env`
    de forma predeterminada; si cambias la configuración del contenedor a
    autenticación por contraseña, usa esa contraseña en su lugar.

    ¿Necesitas la URL de nuevo?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurar canales (opcional)">
    Usa el contenedor de CLI para agregar canales de mensajería:

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
o `OPENCLAW_HOME_VOLUME`, el script de configuración escribe `docker-compose.extra.yml`;
inclúyelo después de cualquier archivo de anulación estándar, por ejemplo
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
cuando ambos archivos de anulación existan.
</Note>

<Note>
Como `openclaw-cli` comparte el espacio de nombres de red de `openclaw-gateway`,
es una herramienta posterior al inicio. Antes de `docker compose up -d openclaw-gateway`,
ejecuta la incorporación y las escrituras de configuración durante la preparación mediante
`openclaw-gateway` con `--no-deps --entrypoint node`.
</Note>

### Variables de entorno

El script de configuración acepta estas variables de entorno opcionales:

| Variable                                   | Propósito                                                             |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usar una imagen remota en lugar de compilar localmente                |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Instalar paquetes apt adicionales durante la compilación (separados por espacios) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Instalar paquetes de Python adicionales durante la compilación (separados por espacios) |
| `OPENCLAW_EXTENSIONS`                      | Preinstalar dependencias de plugins en tiempo de compilación (nombres separados por espacios) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montajes bind adicionales del host (separados por comas `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Persistir `/home/node` en un volumen Docker con nombre               |
| `OPENCLAW_SANDBOX`                         | Optar por el arranque de aislamiento (`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_SKIP_ONBOARDING`                 | Omitir el paso interactivo de incorporación (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Sobrescribir la ruta del socket de Docker                            |
| `OPENCLAW_DISABLE_BONJOUR`                 | Deshabilitar la publicidad Bonjour/mDNS (predeterminado en `1` para Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Deshabilitar superposiciones de montaje bind del código fuente de plugins incluidos |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint compartido del colector OTLP/HTTP para exportación de OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos por señal para trazas, métricas o registros |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Sobrescritura del protocolo OTLP. Hoy solo se admite `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nombre de servicio usado para recursos de OpenTelemetry              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Optar por los atributos semánticos experimentales de GenAI más recientes |
| `OPENCLAW_OTEL_PRELOADED`                  | Omitir el inicio de un segundo SDK de OpenTelemetry cuando ya hay uno precargado |

La imagen oficial de Docker no incluye Homebrew. Durante la incorporación, OpenClaw
oculta instaladores de dependencias de Skills exclusivos de brew cuando se ejecuta
en un contenedor Linux sin `brew`; esas dependencias deben proporcionarse mediante
una imagen personalizada o instalarse manualmente. Para dependencias disponibles
desde paquetes Debian, usa `OPENCLAW_IMAGE_APT_PACKAGES` durante la compilación de
la imagen. El nombre heredado `OPENCLAW_DOCKER_APT_PACKAGES` aún se acepta.
Para dependencias de Python, usa `OPENCLAW_IMAGE_PIP_PACKAGES`. Esto ejecuta
`python3 -m pip install --break-system-packages` durante la compilación de la imagen,
así que fija las versiones de paquetes y usa solo índices de paquetes en los que confíes.

Los mantenedores pueden probar el código fuente de plugins incluidos contra una imagen
empaquetada montando un directorio de código fuente de plugin sobre su ruta de código
fuente empaquetada, por ejemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ese directorio de código fuente montado sobrescribe el paquete compilado coincidente
`/app/dist/extensions/synology-chat` para el mismo id de plugin.

### Observabilidad

La exportación de OpenTelemetry sale desde el contenedor del Gateway hacia tu
colector OTLP. No requiere un puerto Docker publicado. Si compilas la imagen
localmente y quieres que el exportador de OpenTelemetry incluido esté disponible
dentro de la imagen, incluye sus dependencias de runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instala el plugin oficial `@openclaw/diagnostics-otel` desde ClawHub en
instalaciones Docker empaquetadas antes de habilitar la exportación. Las imágenes
personalizadas compiladas desde código fuente aún pueden incluir el código fuente
local del plugin con `OPENCLAW_EXTENSIONS=diagnostics-otel`. Para habilitar la
exportación, permite y habilita el plugin `diagnostics-otel` en la configuración,
y luego establece `diagnostics.otel.enabled=true` o usa el ejemplo de configuración
en [Exportación de OpenTelemetry](/es/gateway/opentelemetry). Los encabezados de
autenticación del colector se configuran mediante `diagnostics.otel.headers`, no
mediante variables de entorno de Docker.

Las métricas de Prometheus usan el puerto del Gateway ya publicado. Instala
`clawhub:@openclaw/diagnostics-prometheus`, habilita el plugin
`diagnostics-prometheus` y luego recopila:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La ruta está protegida por la autenticación del Gateway. No expongas un puerto
`/metrics` público separado ni una ruta de proxy inverso no autenticada. Consulta
[Métricas de Prometheus](/es/gateway/prometheus).

### Comprobaciones de estado

Endpoints de sonda del contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

La imagen Docker incluye un `HEALTHCHECK` integrado que hace ping a `/healthz`.
Si las comprobaciones siguen fallando, Docker marca el contenedor como `unhealthy`
y los sistemas de orquestación pueden reiniciarlo o reemplazarlo.

Instantánea profunda de estado autenticada:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a bucle local

`scripts/docker/setup.sh` establece `OPENCLAW_GATEWAY_BIND=lan` de forma predeterminada
para que el acceso del host a `http://127.0.0.1:18789` funcione con la publicación de
puertos de Docker.

- `lan` (predeterminado): el navegador del host y la CLI del host pueden llegar al puerto publicado del Gateway.
- `loopback`: solo los procesos dentro del espacio de nombres de red del contenedor pueden llegar
  directamente al Gateway.

<Note>
Usa valores de modo de enlace en `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), no alias de host como `0.0.0.0` o `127.0.0.1`.
</Note>

### Proveedores locales del host

Cuando OpenClaw se ejecuta en Docker, `127.0.0.1` dentro del contenedor es el propio
contenedor, no tu máquina host. Usa `host.docker.internal` para proveedores de IA que
se ejecutan en el host:

| Proveedor | URL predeterminada del host | URL de configuración de Docker       |
| --------- | --------------------------- | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234`     | `http://host.docker.internal:1234`   |
| Ollama    | `http://127.0.0.1:11434`    | `http://host.docker.internal:11434`  |

La configuración Docker incluida usa esas URL del host como valores predeterminados
de incorporación de LM Studio y Ollama, y `docker-compose.yml` asigna
`host.docker.internal` al Gateway del host de Docker para Linux Docker Engine.
Docker Desktop ya proporciona el mismo nombre de host en macOS y Windows.

Los servicios del host también deben escuchar en una dirección alcanzable desde Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Si usas tu propio archivo Compose o comando `docker run`, agrega tú mismo el
mismo mapeo de host, por ejemplo
`--add-host=host.docker.internal:host-gateway`.

### Backend de Claude CLI en Docker

La imagen oficial de Docker de OpenClaw no preinstala Claude Code. Instala e
inicia sesión en Claude Code dentro del usuario del contenedor que ejecuta
OpenClaw, y luego conserva ese directorio home del contenedor para que las
actualizaciones de imagen no borren el binario ni el estado de autenticación de
Claude.

Para instalaciones nuevas de Docker, habilita un volumen persistente
`/home/node` antes de ejecutar la configuración:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para una instalación existente de Docker, detén primero el stack y vuelve a
cargar los valores actuales de Docker `.env` antes de ejecutar de nuevo la
configuración. El script de configuración no lee `.env` por sí solo; reescribe
`.env` a partir del shell actual y los valores predeterminados. Para el `.env`
generado, ejecuta:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Si tu `.env` contiene valores que tu shell no puede cargar como fuente, vuelve a
exportar manualmente primero los valores existentes de los que dependes, como
`OPENCLAW_IMAGE`, puertos, modo de vinculación, rutas personalizadas,
`OPENCLAW_EXTRA_MOUNTS`, sandbox y ajustes de omisión de onboarding. La
superposición generada monta el volumen home tanto para `openclaw-gateway` como
para `openclaw-cli`.

Ejecuta los comandos restantes con la superposición Compose generada para que
ambos servicios monten el home persistente. Si tu configuración también usa
`docker-compose.override.yml`, inclúyelo antes de `docker-compose.extra.yml`.

Instala Claude Code en ese home persistente:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

El instalador nativo escribe el binario `claude` bajo
`/home/node/.local/bin/claude`. Indica a OpenClaw que use esa ruta del
contenedor:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Inicia sesión y verifica desde dentro del mismo home persistente del contenedor:

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

`OPENCLAW_HOME_VOLUME` conserva la instalación nativa de Claude Code bajo
`/home/node/.local/bin` y `/home/node/.local/share/claude`, además de los ajustes
y el estado de autenticación de Claude Code bajo `/home/node/.claude` y
`/home/node/.claude.json`. Conservar solo `/home/node/.openclaw` no basta para
reutilizar Claude CLI. Si usas `OPENCLAW_EXTRA_MOUNTS` en lugar de un volumen
home, monta todas esas rutas de Claude en ambos servicios Docker.

<Note>
Para automatización compartida de producción o facturación predecible de
Anthropic, prefiere la ruta de clave de API de Anthropic. La reutilización de
Claude CLI sigue la versión instalada, el inicio de sesión de cuenta, la
facturación y el comportamiento de actualización de Claude Code.
</Note>

### Bonjour / mDNS

La red bridge de Docker normalmente no reenvía multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma fiable. Por eso la configuración Compose incluida
usa de forma predeterminada `OPENCLAW_DISABLE_BONJOUR=1` para que el Gateway no
entre en un ciclo de fallos ni reinicie repetidamente el anuncio cuando el
bridge descarta el tráfico multicast.

Usa la URL publicada del Gateway, Tailscale o DNS-SD de área amplia para hosts
Docker. Establece `OPENCLAW_DISABLE_BONJOUR=0` solo cuando ejecutes con red de
host, macvlan u otra red donde se sepa que el multicast mDNS funciona.

Para advertencias y solución de problemas, consulta [descubrimiento de
Bonjour](/es/gateway/bonjour).

### Almacenamiento y persistencia

Docker Compose monta con bind `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace` y
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` en `/home/node/.config/openclaw`, por lo que
esas rutas sobreviven al reemplazo del contenedor. Cuando alguna variable no
está establecida, el `docker-compose.yml` incluido recurre a `${HOME}`, o a
`/tmp` cuando también falta `HOME`. Eso evita que `docker compose up` emita una
especificación de volumen con origen vacío en entornos mínimos.

Ese directorio de configuración montado es donde OpenClaw guarda:

- `openclaw.json` para la configuración de comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para la autenticación OAuth/clave de API de proveedores almacenada
- `.env` para secretos de runtime respaldados por variables de entorno, como `OPENCLAW_GATEWAY_TOKEN`

El directorio de clave secreta de perfiles de autenticación almacena la clave de
cifrado local usada para el material de tokens de perfiles de autenticación
respaldados por OAuth. Mantenlo con el estado de tu host Docker, pero separado
de `OPENCLAW_CONFIG_DIR`.

Los plugins descargables instalados almacenan su estado de paquete bajo el home
montado de OpenClaw, por lo que los registros de instalación de plugins y las
raíces de paquetes sobreviven al reemplazo del contenedor. El arranque del
Gateway no genera árboles de dependencias de plugins incluidos.

Para detalles completos de persistencia en despliegues de VM, consulta
[Runtime de VM Docker - Qué persiste dónde](/es/install/docker-vm-runtime#what-persists-where).

**Puntos críticos de crecimiento de disco:** vigila `media/`, archivos JSONL de
sesión, la base de datos de estado SQLite compartida, las raíces de paquetes de
plugins instalados y los logs de archivo rotativos bajo `/tmp/openclaw/`.

### Ayudantes de shell (opcional)

Para una gestión diaria de Docker más sencilla, instala `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si instalaste ClawDock desde la ruta raw anterior `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a ejecutar el comando de instalación anterior para que tu archivo auxiliar local siga la nueva ubicación.

Luego usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Ejecuta
`clawdock-help` para ver todos los comandos.
Consulta [ClawDock](/es/install/clawdock) para la guía completa del ayudante.

<AccordionGroup>
  <Accordion title="Habilitar sandbox de agente para el Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Ruta de socket personalizada (por ejemplo, Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    El script monta `docker.sock` solo después de que pasen los prerrequisitos
    de sandbox. Si la configuración de sandbox no puede completarse, el script
    restablece `agents.defaults.sandbox.mode` a `off`. Los turnos de modo de
    código de Codex siguen limitados a `workspace-write` de Codex mientras el
    sandbox de OpenClaw está activo; no montes el socket Docker del host en
    contenedores sandbox de agente.

  </Accordion>

  <Accordion title="Automatización / CI (no interactivo)">
    Deshabilita la asignación de pseudo-TTY de Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota de seguridad de red compartida">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los
    comandos CLI puedan alcanzar el Gateway por `127.0.0.1`. Trata esto como un
    límite de confianza compartido. La configuración compose elimina
    `NET_RAW`/`NET_ADMIN` y habilita `no-new-privileges` tanto en
    `openclaw-gateway` como en `openclaw-cli`.
  </Accordion>

  <Accordion title="Fallos de DNS de Docker Desktop en openclaw-cli">
    Algunas configuraciones de Docker Desktop fallan las búsquedas DNS desde el
    sidecar de red compartida `openclaw-cli` después de eliminar `NET_RAW`, lo
    que aparece como `EAI_AGAIN` durante comandos respaldados por npm como
    `openclaw plugins install`. Mantén el archivo compose reforzado
    predeterminado para la operación normal del Gateway. La anulación local
    siguiente relaja la postura de seguridad del contenedor CLI al restaurar las
    capacidades predeterminadas de Docker, así que úsala solo para el comando
    CLI puntual que necesita acceso al registro de paquetes, no como tu
    invocación Compose predeterminada:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Si ya creaste un contenedor `openclaw-cli` de larga duración, recréalo con
    la misma anulación. `docker compose exec` y `docker exec` no pueden cambiar
    capacidades de Linux en un contenedor ya creado.

  </Accordion>

  <Accordion title="Permisos y EACCES">
    La imagen se ejecuta como `node` (uid 1000). Si ves errores de permisos en
    `/home/node/.openclaw`, asegúrate de que tus montajes bind del host sean
    propiedad de uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    La misma discrepancia puede aparecer como una advertencia de Plugin, como
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguida de `plugin present but blocked`. Eso significa que el uid del
    proceso y el propietario del directorio de Plugin montado no coinciden.
    Prefiere ejecutar el contenedor con el uid 1000 predeterminado y corregir la
    propiedad del montaje bind. Usa chown en `/path/to/openclaw-config/npm` a
    `root:root` solo si ejecutas intencionalmente OpenClaw como root a largo
    plazo.

  </Accordion>

  <Accordion title="Reconstrucciones más rápidas">
    Ordena tu Dockerfile para que las capas de dependencias se almacenen en
    caché. Esto evita volver a ejecutar `pnpm install` salvo que cambien los
    lockfiles:

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
    La imagen predeterminada prioriza la seguridad y se ejecuta como `node` no
    root. Para un contenedor con más funciones:

    1. **Conservar `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependencias del sistema en la imagen**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Incluir dependencias de Python en la imagen**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Incluir Playwright Chromium en la imagen**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **O instalar navegadores Playwright en un volumen persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Conservar descargas de navegador**: usa `OPENCLAW_HOME_VOLUME` o
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw detecta automáticamente el Chromium
       administrado por Playwright de la imagen Docker en Linux.

  </Accordion>

  <Accordion title="OAuth de OpenAI Codex (Docker headless)">
    Si eliges OAuth de OpenAI Codex en el asistente, se abre una URL de
    navegador. En Docker o configuraciones headless, copia la URL de redirección
    completa a la que llegas y pégala de nuevo en el asistente para terminar la
    autenticación.
  </Accordion>

  <Accordion title="Metadatos de la imagen base">
    La imagen principal de runtime de Docker usa `node:24-bookworm-slim` e incluye `tini` como proceso init de punto de entrada (PID 1) para garantizar que se recojan los procesos zombis y que las señales se gestionen correctamente en contenedores de larga duración. Publica anotaciones OCI de imagen base, incluidas `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` y otras. El digest base de Node se
    actualiza mediante PRs de imagen base de Docker de Dependabot; las compilaciones de lanzamiento no ejecutan
    una capa de actualización de la distribución. Consulta
    [anotaciones de imagen OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Ejecutando en un VPS?

Consulta [Hetzner (VPS Docker)](/es/install/hetzner) y
[Runtime de VM Docker](/es/install/docker-vm-runtime) para ver pasos de despliegue en VM compartidas,
incluida la integración de binarios, la persistencia y las actualizaciones.

## Espacio aislado del agente

Cuando `agents.defaults.sandbox` está habilitado con el backend de Docker, el Gateway
ejecuta las herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores Docker
aislados mientras el propio Gateway permanece en el host. Esto te da un muro sólido
alrededor de sesiones de agentes no confiables o multiinquilino sin contenerizar todo el
Gateway.

El alcance del espacio aislado puede ser por agente (predeterminado), por sesión o compartido. Cada alcance
obtiene su propio espacio de trabajo montado en `/workspace`. También puedes configurar
políticas de permitir/denegar herramientas, aislamiento de red, límites de recursos y contenedores
de navegador.

Para la configuración completa, imágenes, notas de seguridad y perfiles multiagente, consulta:

- [Aislamiento](/es/gateway/sandboxing) -- referencia completa del espacio aislado
- [OpenShell](/es/gateway/openshell) -- acceso interactivo de shell a contenedores del espacio aislado
- [Espacio aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente

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

Compila la imagen predeterminada del espacio aislado (desde un checkout del código fuente):

```bash
scripts/sandbox-setup.sh
```

Para instalaciones npm sin un checkout del código fuente, consulta [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` en línea.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor del espacio aislado no se inicia">
    Compila la imagen del espacio aislado con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout del código fuente) o el comando `docker build` en línea de [Aislamiento § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) (instalación npm),
    o configura `agents.defaults.sandbox.docker.image` con tu imagen personalizada.
    Los contenedores se crean automáticamente por sesión bajo demanda.
  </Accordion>

  <Accordion title="Errores de permisos en el espacio aislado">
    Configura `docker.user` con un UID:GID que coincida con la propiedad de tu espacio de trabajo montado,
    o cambia el propietario de la carpeta del espacio de trabajo.
  </Accordion>

  <Accordion title="Herramientas personalizadas no encontradas en el espacio aislado">
    OpenClaw ejecuta comandos con `sh -lc` (shell de inicio de sesión), lo que carga
    `/etc/profile` y puede restablecer PATH. Configura `docker.env.PATH` para anteponer tus
    rutas de herramientas personalizadas, o agrega un script en `/etc/profile.d/` en tu Dockerfile.
  </Accordion>

  <Accordion title="Terminación por OOM durante la compilación de la imagen (salida 137)">
    La VM necesita al menos 2 GB de RAM. Usa una clase de máquina más grande y vuelve a intentarlo.
  </Accordion>

  <Accordion title="No autorizado o emparejamiento requerido en la interfaz de Control">
    Obtén un enlace nuevo del panel y aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más detalles: [Panel](/es/web/dashboard), [Dispositivos](/es/cli/devices).

  </Accordion>

  <Accordion title="El destino del Gateway muestra ws://172.x.x.x o errores de emparejamiento desde la CLI de Docker">
    Restablece el modo del Gateway y el enlace:

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
- [Actualización](/es/install/updating) — mantener OpenClaw actualizado
- [Configuración](/es/gateway/configuration) — configuración del Gateway después de la instalación
