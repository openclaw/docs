---
read_when:
    - Quieres un Gateway en contenedor en lugar de instalaciones locales
    - Estás validando el flujo de Docker
summary: Configuración e incorporación opcionales basadas en Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-05T11:27:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7666fabb7e4815cd541d23487a16f973183c5239a7be9a9b7b2ed2d82e640a47
    source_path: install/docker.md
    workflow: 16
---

Docker es **opcional**. Úsalo para un entorno de Gateway aislado y desechable, o para un host sin instalaciones locales. Si ya desarrollas en tu propia máquina, usa en su lugar el flujo de instalación normal.

El backend de sandbox predeterminado usa Docker cuando `agents.defaults.sandbox` está habilitado, pero el sandboxing está desactivado de forma predeterminada y no requiere que el Gateway se ejecute en Docker. También están disponibles los backends de sandbox SSH y OpenShell; consulta [Sandboxing](/es/gateway/sandboxing).

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para compilar la imagen (`pnpm install` puede ser terminado por OOM en hosts de 1 GB con salida 137)
- Espacio suficiente en disco para imágenes y registros
- En un VPS/host público, revisa [Refuerzo de seguridad para exposición de red](/es/gateway/security), especialmente la cadena de firewall `DOCKER-USER` de Docker

## Gateway en contenedor

<Steps>
  <Step title="Compilar la imagen">
    Desde la raíz del repositorio:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Esto compila la imagen del Gateway localmente como `openclaw:local`. Para usar en su lugar una imagen precompilada:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Las imágenes precompiladas se publican primero en [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR es el registro principal para automatización de versiones, despliegues fijados y comprobaciones de procedencia. La misma versión publica un espejo de Docker Hub en `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Usa `ghcr.io/openclaw/openclaw` u `openclaw/openclaw` y evita espejos no oficiales, que no comparten la cadencia de publicación ni la política de retención de OpenClaw. Etiquetas oficiales: `main`, `latest`, `<version>` (por ejemplo, `2026.2.26`) y etiquetas beta como `2026.2.26-beta.1` (las betas nunca mueven `latest`/`main`). La imagen predeterminada `main`/`latest`/`<version>` incluye los plugins `codex` y `diagnostics-otel`. Una variante `-browser` (por ejemplo, `latest-browser`) también incluye Chromium integrado, útil para la herramienta de [navegador en sandbox](/es/gateway/sandboxing#sandboxed-browser) sin una instalación inicial de Playwright.

  </Step>

  <Step title="Reejecución sin conexión">
    En hosts sin conexión, transfiere y carga primero la imagen:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica que `OPENCLAW_IMAGE` ya exista localmente, desactiva las extracciones/compilaciones implícitas de Compose y luego ejecuta el flujo normal: sincronización de `.env`, correcciones de permisos, onboarding, sincronización de configuración del Gateway, arranque de Compose.

    Si `OPENCLAW_SANDBOX=1`, la configuración sin conexión también comprueba las imágenes de sandbox predeterminadas configuradas y por agente en el daemon detrás de `OPENCLAW_DOCKER_SOCKET`, incluida la etiqueta de contrato de navegador en imágenes de navegador respaldadas por Docker. Si falta una imagen requerida o está obsoleta, la configuración sale sin cambiar la configuración del sandbox en lugar de informar un éxito roto.

  </Step>

  <Step title="Completar el onboarding">
    El script de configuración ejecuta el onboarding automáticamente:

    - solicita claves de API del proveedor
    - genera un token de Gateway y lo escribe en `.env`
    - crea el directorio de claves secretas del perfil de autenticación
    - inicia el Gateway mediante Docker Compose

    El onboarding previo al arranque y las escrituras de configuración se ejecutan directamente mediante `openclaw-gateway` (con `--no-deps --entrypoint node`), ya que `openclaw-cli` comparte el espacio de nombres de red del Gateway y solo funciona una vez que existe el contenedor del Gateway.

  </Step>

  <Step title="Abrir la Control UI">
    Abre `http://127.0.0.1:18789/` y pega en Settings el token escrito en `.env`. Si cambiaste el contenedor a autenticación por contraseña, usa esa contraseña en su lugar.

    ¿Necesitas la URL otra vez?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurar canales (opcional)">
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

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Ejecuta `docker compose` desde la raíz del repositorio. Si habilitaste `OPENCLAW_EXTRA_MOUNTS` u `OPENCLAW_HOME_VOLUME`, el script de configuración escribe `docker-compose.extra.yml`; inclúyelo después de cualquier `docker-compose.override.yml` que mantengas tú mismo, por ejemplo, `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Variables de entorno

Variables opcionales aceptadas por `scripts/docker/setup.sh` (y, para el contenedor del Gateway, directamente por `docker-compose.yml`):

| Variable                                        | Propósito                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Usar una imagen remota en lugar de compilar localmente                                                  |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Instalar paquetes apt adicionales durante la compilación (separados por espacios). Alias heredado: `OPENCLAW_DOCKER_APT_PACKAGES` |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Instalar paquetes de Python adicionales durante la compilación (separados por espacios)                 |
| `OPENCLAW_EXTENSIONS`                           | Preinstalar dependencias de plugins en tiempo de compilación (ids separados por comas o espacios)       |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Sobrescribir las opciones de Node de compilación local desde código fuente (predeterminado `--max-old-space-size=8192`) |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Sobrescribir el heap de tsdown de compilación local desde código fuente en MB                           |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Omitir la salida de declaraciones durante compilaciones de imagen local solo para runtime (predeterminado `1`) |
| `OPENCLAW_INSTALL_BROWSER`                      | Incorporar Chromium + Xvfb en la imagen en tiempo de compilación                                        |
| `OPENCLAW_EXTRA_MOUNTS`                         | Montajes bind adicionales del host (separados por comas `source:target[:opts]`)                         |
| `OPENCLAW_HOME_VOLUME`                          | Persistir `/home/node` en un volumen Docker con nombre                                                  |
| `OPENCLAW_SANDBOX`                              | Optar por el arranque de sandbox (`1`, `true`, `yes`, `on`)                                             |
| `OPENCLAW_SKIP_ONBOARDING`                      | Omitir el paso interactivo de onboarding (`1`, `true`, `yes`, `on`)                                     |
| `OPENCLAW_DOCKER_SOCKET`                        | Sobrescribir la ruta del socket de Docker                                                               |
| `OPENCLAW_DISABLE_BONJOUR`                      | Forzar la publicidad Bonjour/mDNS activada (`0`) o desactivada (`1`); consulta [Bonjour / mDNS](#bonjour--mdns) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Desactivar superposiciones de montaje bind del código fuente de plugins incluidos                       |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint compartido del colector OTLP/HTTP para exportación de OpenTelemetry                           |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoints OTLP específicos de señal para trazas, métricas o registros                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Sobrescritura del protocolo OTLP. Hoy solo se admite `http/protobuf`                                    |
| `OTEL_SERVICE_NAME`                             | Nombre de servicio usado para recursos de OpenTelemetry                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Optar por los atributos semánticos experimentales más recientes de GenAI                                |
| `OPENCLAW_OTEL_PRELOADED`                       | Omitir el inicio de un segundo SDK de OpenTelemetry cuando ya hay uno precargado                        |

La imagen oficial no incluye Homebrew. Durante el onboarding, OpenClaw oculta instaladores de dependencias de Skills exclusivos de brew en un contenedor Linux sin `brew`; proporciona esas dependencias mediante una imagen personalizada o instálalas manualmente. Usa `OPENCLAW_IMAGE_APT_PACKAGES` para dependencias empaquetadas por Debian y `OPENCLAW_IMAGE_PIP_PACKAGES` para dependencias de Python (ejecuta `python3 -m pip install --break-system-packages` en tiempo de compilación, así que fija versiones y usa solo índices en los que confíes).

Si Docker informa `ResourceExhausted`, `cannot allocate memory` o se interrumpe durante `tsdown`, aumenta el límite de memoria del constructor de Docker o vuelve a intentarlo con heaps explícitos más pequeños:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

Para probar el código fuente de un plugin incluido contra una imagen empaquetada, monta un directorio de código fuente de plugin sobre su ruta de código fuente empaquetada, por ejemplo, `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Eso sobrescribe el paquete compilado correspondiente `/app/dist/extensions/synology-chat` para el mismo id de plugin.

### Observabilidad

La exportación de OpenTelemetry es saliente desde el contenedor del Gateway hacia tu colector OTLP; no necesita ningún puerto Docker publicado. Para incluir el exportador incluido en una imagen compilada localmente:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Las imágenes oficiales precompiladas ya incluyen `diagnostics-otel`; instala `clawhub:@openclaw/diagnostics-otel` tú mismo solo si lo eliminaste. Para habilitar la exportación, permite y habilita el plugin `diagnostics-otel` en la configuración y luego establece `diagnostics.otel.enabled=true` (consulta el ejemplo completo en [Exportación de OpenTelemetry](/es/gateway/opentelemetry)). Los encabezados de autenticación del colector van mediante `diagnostics.otel.headers`, no mediante variables de entorno de Docker.

Las métricas de Prometheus reutilizan el puerto del Gateway ya publicado. Instala `clawhub:@openclaw/diagnostics-prometheus`, habilita el plugin `diagnostics-prometheus` y luego recopila:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La ruta está protegida por la autenticación del Gateway; no expongas un puerto público `/metrics` separado ni una ruta de proxy inverso sin autenticación. Consulta [Métricas de Prometheus](/es/gateway/prometheus).

### Comprobaciones de estado

Endpoints de sondeo del contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

El `HEALTHCHECK` integrado de la imagen hace ping a `/healthz`; los fallos repetidos marcan el contenedor como `unhealthy` para que los orquestadores puedan reiniciarlo o reemplazarlo.

Instantánea profunda de estado autenticada:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a loopback

`scripts/docker/setup.sh` usa de forma predeterminada `OPENCLAW_GATEWAY_BIND=lan` para que `http://127.0.0.1:18789` en el host funcione con la publicación de puertos de Docker.

- `lan` (predeterminado): el navegador del host y la CLI del host pueden alcanzar el puerto publicado del gateway.
- `loopback`: solo los procesos dentro del espacio de nombres de red del contenedor pueden alcanzar el gateway directamente.

<Note>
Usa valores de modo de enlace en `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), no alias de host como `0.0.0.0` o `127.0.0.1`.
</Note>

### Proveedores locales del host

Dentro del contenedor, `127.0.0.1` es el propio contenedor, no el host. Usa `host.docker.internal` para proveedores que se ejecutan en el host:

| Proveedor | URL predeterminada del host | URL de configuración de Docker      |
| --------- | --------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`     | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`    | `http://host.docker.internal:11434` |

La configuración incluida usa esas URL como valores predeterminados de incorporación para LM Studio/Ollama, y `docker-compose.yml` asigna `host.docker.internal` al gateway del host en Linux Docker Engine (Docker Desktop proporciona el mismo alias en macOS/Windows). Los servicios del host deben escuchar en una dirección que Docker pueda alcanzar:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

¿Usas tu propio archivo Compose o `docker run`? Agrega tú mismo la misma asignación, por ejemplo `--add-host=host.docker.internal:host-gateway`.

### Backend de Claude CLI en Docker

La imagen oficial no preinstala Claude Code. Instálalo e inicia sesión dentro del usuario `node` del contenedor, luego conserva ese home del contenedor para que las actualizaciones de imagen no borren el binario ni el estado de autenticación.

Para una instalación nueva, habilita un volumen persistente de `/home/node` antes de ejecutar la configuración:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para una instalación existente, detén la pila y vuelve a cargar primero los valores actuales de `.env`: el script de configuración siempre reescribe `.env` desde el shell actual y los valores predeterminados; no lee el archivo por sí solo:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Si `.env` contiene valores que tu shell no puede cargar con source, vuelve a exportar manualmente primero aquello de lo que dependes (`OPENCLAW_IMAGE`, puertos, modo de enlace, rutas personalizadas, `OPENCLAW_EXTRA_MOUNTS`, sandbox, omitir incorporación). La superposición generada monta el volumen home tanto para `openclaw-gateway` como para `openclaw-cli`; ejecuta los comandos restantes con esa superposición (y `docker-compose.override.yml` primero, si usas uno):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

El instalador nativo escribe `claude` en `/home/node/.local/bin/claude`. Apunta OpenClaw a esa ruta:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Inicia sesión y verifica desde el mismo home persistente:

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

Luego usa el backend `claude-cli` incluido:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` conserva la instalación nativa en `/home/node/.local/bin` y `/home/node/.local/share/claude`, además de la configuración/autenticación de Claude Code en `/home/node/.claude` y `/home/node/.claude.json`. Conservar solo `/home/node/.openclaw` no es suficiente; si usas `OPENCLAW_EXTRA_MOUNTS` en lugar de un volumen home, monta todas esas rutas de Claude en ambos servicios.

<Note>
Para automatización de producción compartida o facturación predecible de Anthropic, prefiere la ruta de clave de API de Anthropic. La reutilización de Claude CLI sigue la versión instalada de Claude Code, el inicio de sesión de la cuenta, la facturación y el comportamiento de actualización.
</Note>

### Bonjour / mDNS

Las redes bridge de Docker normalmente no reenvían multicast Bonjour/mDNS (`224.0.0.251:5353`) de forma fiable. Cuando `OPENCLAW_DISABLE_BONJOUR` no está definido, el Plugin Bonjour incluido desactiva automáticamente la publicidad LAN una vez que detecta que se ejecuta en un contenedor, por lo que no entrará en un ciclo de fallos reintentando el multicast que el bridge descarta. Define `OPENCLAW_DISABLE_BONJOUR=1` para forzarlo a desactivarse independientemente de la detección, o `0` para forzarlo a activarse (solo en redes del host, macvlan u otra red donde se sepa que el multicast mDNS funciona).

De lo contrario, usa la URL publicada del Gateway, Tailscale o DNS-SD de área amplia para hosts Docker. Consulta [descubrimiento de Bonjour](/es/gateway/bonjour) para ver problemas habituales y solución de problemas.

### Almacenamiento y persistencia

Docker Compose monta mediante bind mount `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace` y `OPENCLAW_AUTH_PROFILE_SECRET_DIR` en `/home/node/.config/openclaw`, por lo que esas rutas sobreviven al reemplazo del contenedor. Cuando una variable no está definida, `docker-compose.yml` usa una ruta alternativa bajo `${HOME}`, o `/tmp` si falta el propio `HOME`, de modo que `docker compose up` nunca emite una especificación de volumen con origen vacío en entornos básicos.

Ese directorio de configuración montado contiene:

- `openclaw.json` para la configuración de comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para la autenticación OAuth/clave de API almacenada del proveedor
- `.env` para secretos de runtime respaldados por env, como `OPENCLAW_GATEWAY_TOKEN`

  El directorio secreto del perfil de autenticación almacena la clave de cifrado local para el material de tokens del perfil de autenticación respaldado por OAuth. Consérvalo con el estado de tu host Docker, pero separado de `OPENCLAW_CONFIG_DIR`.

  Los plugins descargables instalados almacenan el estado del paquete bajo el directorio principal de OpenClaw montado, por lo que los registros de instalación y las raíces de los paquetes sobreviven al reemplazo del contenedor; el inicio del gateway no regenera los árboles de dependencias de plugins incluidos.

  Para obtener detalles completos sobre la persistencia de la VM, consulta [Tiempo de ejecución de VM Docker - Qué persiste y dónde](/es/install/docker-vm-runtime#what-persists-where).

  **Puntos críticos de crecimiento del disco:** `media/`, archivos JSONL de sesión, la base de datos SQLite de estado compartido, las raíces de paquetes de plugins instalados y los registros de archivo rotativos bajo `/tmp/openclaw/`.

  ### Ayudantes de shell (opcional)

  Para comandos cotidianos más breves, instala [ClawDock](/es/install/clawdock):

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  Si instalaste desde la ruta anterior `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a ejecutar el comando anterior para que tu ayudante local siga la ubicación actual. Luego usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. (ejecuta `clawdock-help` para ver la lista completa).

  <AccordionGroup>
  <Accordion title="Habilitar el sandbox del agente para el gateway de Docker">
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

    El script monta `docker.sock` solo después de que se cumplan los requisitos previos del sandbox. Si la configuración del sandbox no puede completarse, restablece `agents.defaults.sandbox.mode` a `off`. El modo de código de Codex se deshabilita para los turnos en los que el sandbox de OpenClaw está activo (consulta [Sandboxing § Backend de Docker](/es/gateway/sandboxing#docker-backend)); nunca montes el socket Docker del host en contenedores sandbox de agentes.

  </Accordion>

  <Accordion title="Automatización / CI (no interactivo)">
    Deshabilita la asignación de pseudo-TTY de Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota de seguridad de red compartida">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los comandos de la CLI puedan llegar al gateway mediante `127.0.0.1`. Trátalo como un límite de confianza compartido. La configuración de compose descarta `NET_RAW`/`NET_ADMIN` y habilita `no-new-privileges` tanto en `openclaw-gateway` como en `openclaw-cli`.
  </Accordion>

  <Accordion title="Fallos de DNS de Docker Desktop en openclaw-cli">
    Algunas configuraciones de Docker Desktop fallan en las búsquedas DNS desde el contenedor auxiliar `openclaw-cli` de red compartida después de descartar `NET_RAW`, lo que aparece como `EAI_AGAIN` durante comandos respaldados por npm como `openclaw plugins install`. Mantén el archivo compose endurecido predeterminado para la operación normal. La anulación siguiente restaura las capacidades predeterminadas solo para el contenedor `openclaw-cli`; úsala para el comando puntual que necesita acceso al registro, no como invocación predeterminada:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Si ya creaste un contenedor `openclaw-cli` de larga duración, recréalo con la misma anulación; `docker compose exec`/`docker exec` no puede cambiar las capacidades de Linux en un contenedor ya creado.

  </Accordion>

  <Accordion title="Permisos y EACCES">
    La imagen se ejecuta como `node` (uid 1000). Si ves errores de permisos en `/home/node/.openclaw`, asegúrate de que los montajes bind del host sean propiedad del uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    La misma discrepancia puede aparecer como `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` seguido de `plugin present but blocked`: el uid del proceso y el propietario del directorio de plugins montado no coinciden. Prefiere ejecutar con el uid predeterminado 1000 y corregir la propiedad del montaje bind. Solo aplica chown a `/path/to/openclaw-config/npm` como `root:root` si tienes la intención de ejecutar OpenClaw como root a largo plazo.

  </Accordion>

  <Accordion title="Reconstrucciones más rápidas">
    Ordena tu Dockerfile para que las capas de dependencias se almacenen en caché, evitando volver a ejecutar `pnpm install` salvo que cambien los lockfiles:

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
    La imagen predeterminada prioriza la seguridad y se ejecuta como `node` no root. Para un contenedor con más funciones:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependencias del sistema en la imagen**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Incluir dependencias de Python en la imagen**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Incluir Playwright Chromium en la imagen**: `export OPENCLAW_INSTALL_BROWSER=1`, o usa la etiqueta oficial de imagen `-browser`
    5. **O instalar navegadores de Playwright en un volumen persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Persistir descargas del navegador**: usa `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`. OpenClaw detecta automáticamente el Chromium gestionado por Playwright de la imagen en Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sin interfaz)">
    Si eliges OpenAI Codex OAuth en el asistente, se abre una URL del navegador. En Docker o configuraciones sin interfaz, copia la URL de redirección completa a la que llegues y pégala de nuevo en el asistente para finalizar la autenticación.
  </Accordion>

  <Accordion title="Metadatos de imagen base">
    La imagen de runtime usa `node:24-bookworm-slim` y ejecuta `tini` como PID 1 para que los procesos zombi se recojan y las señales se gestionen correctamente en contenedores de larga duración. Publica anotaciones de imagen base OCI, incluidas `org.opencontainers.image.base.name` y `org.opencontainers.image.source`. Dependabot actualiza el digest base de Node fijado; las compilaciones de lanzamiento no ejecutan una capa separada de actualización de distribución. Consulta [anotaciones de imagen OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Ejecutar en un VPS?

Consulta [Hetzner (Docker VPS)](/es/install/hetzner) y [Docker VM Runtime](/es/install/docker-vm-runtime) para ver los pasos de despliegue de VM compartida, incluido el horneado del binario, la persistencia y las actualizaciones.

## Entorno aislado de agentes

Cuando `agents.defaults.sandbox` está habilitado con el backend de Docker, el Gateway ejecuta las herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores Docker aislados mientras el propio Gateway permanece en el host: una barrera rígida alrededor de sesiones de agente no confiables o multiinquilino sin contenerizar todo el Gateway.

El alcance del sandbox puede ser por agente (predeterminado), por sesión o compartido; cada alcance obtiene su propio workspace montado en `/workspace`. También puedes configurar políticas de herramientas de permitir/denegar, aislamiento de red, límites de recursos y contenedores de navegador.

Para la configuración completa, imágenes, notas de seguridad y perfiles multiagente:

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa del sandbox
- [OpenShell](/es/gateway/openshell) -- acceso interactivo de shell a contenedores de sandbox
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente

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

Compila la imagen de sandbox predeterminada (desde un checkout de código fuente):

```bash
scripts/sandbox-setup.sh
```

Para instalaciones npm sin un checkout de código fuente, consulta [Sandboxing § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` en línea.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor de sandbox no se inicia">
    Compila la imagen de sandbox con [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (checkout de código fuente), usa el comando `docker build` en línea de [Sandboxing § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) (instalación npm), o define `agents.defaults.sandbox.docker.image` con tu imagen personalizada. Los contenedores se crean automáticamente por sesión bajo demanda.
  </Accordion>

  <Accordion title="Errores de permisos en el sandbox">
    Define `docker.user` como un UID:GID que coincida con la propiedad de tu workspace montado, o cambia el propietario de la carpeta del workspace con chown.
  </Accordion>

  <Accordion title="No se encuentran herramientas personalizadas en el sandbox">
    OpenClaw ejecuta comandos con `sh -lc` (shell de inicio de sesión), que carga `/etc/profile` y puede restablecer PATH. Define `docker.env.PATH` para anteponer las rutas de tus herramientas personalizadas, o añade un script bajo `/etc/profile.d/` en tu Dockerfile.
  </Accordion>

  <Accordion title="Proceso terminado por OOM durante la compilación de la imagen (salida 137)">
    La VM necesita al menos 2 GB de RAM. Usa una clase de máquina más grande y vuelve a intentarlo.
  </Accordion>

  <Accordion title="No autorizado o emparejamiento requerido en Control UI">
    Obtén un enlace de dashboard nuevo y aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más detalles: [Dashboard](/es/web/dashboard), [Dispositivos](/es/cli/devices).

  </Accordion>

  <Accordion title="El destino del Gateway muestra ws://172.x.x.x o errores de emparejamiento desde Docker CLI">
    Restablece el modo y el enlace del Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionado

- [Resumen de instalación](/es/install) — todos los métodos de instalación
- [Podman](/es/install/podman) — alternativa de Podman a Docker
- [ClawDock](/es/install/clawdock) — configuración comunitaria con Docker Compose
- [Actualización](/es/install/updating) — mantener OpenClaw actualizado
- [Configuración](/es/gateway/configuration) — configuración del Gateway después de la instalación
