---
read_when:
    - Se prefiere un Gateway en contenedor en lugar de instalaciones locales
    - Estás validando el flujo de Docker
summary: Configuración e incorporación opcionales mediante Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-22T10:38:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7ec6302429fb22e12dfa2f59195b52130d3b337491db20d41922935ab5700c6c
    source_path: install/docker.md
    workflow: 16
---

Docker es **opcional**. Úselo para disponer de un entorno de Gateway aislado y desechable o en un host sin instalaciones locales. Si ya desarrolla en su propia máquina, utilice en su lugar el flujo de instalación normal.

El backend de entorno aislado predeterminado utiliza Docker cuando `agents.defaults.sandbox` está habilitado, pero el aislamiento está desactivado de forma predeterminada y no requiere que el propio Gateway se ejecute en Docker. También están disponibles los backends de entorno aislado SSH y OpenShell; consulte [Aislamiento](/es/gateway/sandboxing).

¿Aloja a varios usuarios? Consulte [Alojamiento multiinquilino](/es/gateway/multi-tenant-hosting) para conocer el modelo de una celda por inquilino.

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para compilar la imagen (`pnpm install` puede finalizarse por falta de memoria en hosts con 1 GB y el código de salida 137)
- Espacio en disco suficiente para imágenes y registros
- En un VPS/host público, revise el [Refuerzo de seguridad para la exposición de red](/es/gateway/security), especialmente la cadena de firewall `DOCKER-USER` de Docker

## Gateway en contenedor

<Steps>
  <Step title="Compilar la imagen">
    Desde la raíz del repositorio:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Esto compila localmente la imagen del Gateway como `openclaw:local`. Para utilizar en su lugar una imagen precompilada:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Las imágenes precompiladas se publican primero en [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR es el registro principal para la automatización de versiones, los despliegues con versiones fijadas y las comprobaciones de procedencia. La misma versión publica un espejo de Docker Hub en `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Utilice `ghcr.io/openclaw/openclaw` o `openclaw/openclaw` y evite los espejos no oficiales, que no comparten el calendario de publicación ni la política de retención de OpenClaw. Etiquetas oficiales: `main`, `latest`, `<version>` (p. ej., `2026.2.26`) y etiquetas beta como `2026.2.26-beta.1` (las betas nunca desplazan `latest`/`main`). La imagen predeterminada `main`/`latest`/`<version>` incluye los plugins `codex` y `diagnostics-otel`. También se distribuye una variante `-browser` (p. ej., `latest-browser`) con Chromium integrado, útil para la herramienta de [navegador aislado](/es/gateway/sandboxing#sandboxed-browser) sin necesidad de instalar Playwright en la primera ejecución.

  </Step>

  <Step title="Nueva ejecución sin conexión">
    En hosts sin conexión, transfiera y cargue primero la imagen:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica que `OPENCLAW_IMAGE` ya exista localmente, deshabilita las descargas y compilaciones implícitas de Compose y, a continuación, ejecuta el flujo normal: sincronización de `.env`, correcciones de permisos, incorporación, sincronización de la configuración del Gateway e inicio de Compose.

    Si `OPENCLAW_SANDBOX=1`, la configuración sin conexión también comprueba las imágenes de entorno aislado predeterminadas y por agente configuradas en el daemon detrás de `OPENCLAW_DOCKER_SOCKET`, incluida la etiqueta del contrato del navegador en las imágenes de navegador basadas en Docker. Si falta una imagen necesaria o está obsoleta, la configuración finaliza sin cambiar la configuración del entorno aislado, en lugar de informar erróneamente de que se completó correctamente.

  </Step>

  <Step title="Completar la incorporación">
    El script de configuración ejecuta automáticamente la incorporación:

    - solicita las claves de API del proveedor
    - genera un token del Gateway y lo escribe en `.env`
    - crea el directorio de la clave secreta del perfil de autenticación
    - inicia el Gateway mediante Docker Compose

    La incorporación previa al inicio y las escrituras de configuración se ejecutan directamente mediante `openclaw-gateway` (con `--no-deps --entrypoint node`), ya que `openclaw-cli` comparte el espacio de nombres de red del Gateway y solo funciona una vez que existe el contenedor del Gateway.

  </Step>

  <Step title="Abrir la interfaz de control">
    Abra `http://127.0.0.1:18789/` y pegue en Settings el token escrito en `.env`. Si cambió el contenedor para utilizar autenticación mediante contraseña, utilice esa contraseña en su lugar.

    ¿Necesita de nuevo la URL?

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
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

El contexto de Docker excluye `.git`. Pase la identidad del código fuente como argumentos de compilación
tal como se muestra anteriormente, para que la pantalla Acerca de de la imagen indique el commit extraído y
una marca temporal de compilación. `scripts/docker/setup.sh` resuelve y pasa ambos valores
automáticamente.

<Note>
Ejecute `docker compose` desde la raíz del repositorio. Si habilitó `OPENCLAW_EXTRA_MOUNTS` o `OPENCLAW_HOME_VOLUME`, el script de configuración escribe `docker-compose.extra.yml`; inclúyalo después de cualquier `docker-compose.override.yml` que mantenga por su cuenta, p. ej., `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Actualización de imágenes de contenedor

Cuando se sustituye la imagen de OpenClaw pero se conservan el mismo estado y la misma configuración montados, el
nuevo Gateway ejecuta migraciones de actualización seguras para el inicio y la convergencia de plugins antes
de estar listo. Las actualizaciones rutinarias de imágenes no deberían requerir una ejecución independiente de
`openclaw doctor --fix`.

Si el Gateway no puede completar esas reparaciones de forma segura durante el inicio, finaliza en lugar de
informar que está en buen estado. Con una política de reinicio, Docker, Podman o Kubernetes pueden mostrar
que el contenedor del Gateway se reinicia. Conserve el volumen de estado montado y, a continuación, ejecute
una vez la misma imagen con `openclaw doctor --fix` como comando del contenedor, utilizando los
mismos montajes de estado/configuración que utiliza el Gateway:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Cuando doctor termine, reinicie el contenedor del Gateway con su comando predeterminado.
En Kubernetes, ejecute el mismo comando en un Job de una sola ejecución o en un pod de depuración montado en el
mismo PVC y, a continuación, reinicie el Deployment o StatefulSet.

### Variables de entorno

Variables opcionales aceptadas por `scripts/docker/setup.sh` (y, para el contenedor del Gateway, directamente por `docker-compose.yml`):

| Variable                                        | Finalidad                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Utilizar una imagen remota en lugar de compilarla localmente                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Instalar paquetes apt adicionales durante la compilación (separados por espacios). Alias heredado: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Instalar paquetes Python adicionales durante la compilación (separados por espacios)                                                      |
| `OPENCLAW_EXTENSIONS`                           | Compilar/empaquetar los plugins seleccionados compatibles e instalar sus dependencias de ejecución (identificadores separados por comas o espacios) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Sustituir las opciones de Node para la compilación local desde el código fuente (valor predeterminado: `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Sustituir la memoria dinámica de tsdown para la compilación local desde el código fuente, en MB                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Omitir la generación de declaraciones durante las compilaciones locales de imágenes exclusivamente de ejecución (valor predeterminado: `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | Integrar Chromium + Xvfb en la imagen durante la compilación                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | Montajes bind adicionales del host (`source:target[:opts]` separados por comas)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | Conservar `/home/node` en un volumen de Docker con nombre                                                                     |
| `OPENCLAW_SANDBOX`                              | Habilitar explícitamente la inicialización del entorno aislado (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Omitir el paso interactivo de incorporación (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | Sustituir la ruta del socket de Docker                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Forzar la activación (`0`) o desactivación (`1`) de los anuncios Bonjour/mDNS; consulte [Bonjour/mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Deshabilitar las superposiciones de montajes bind del código fuente de plugins incluidos                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint compartido del recopilador OTLP/HTTP para la exportación de OpenTelemetry                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoints OTLP específicos de señales para trazas, métricas o registros                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Sustitución del protocolo OTLP. Actualmente solo se admite `http/protobuf`                                                   |
| `OTEL_SERVICE_NAME`                             | Nombre del servicio utilizado para los recursos de OpenTelemetry                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Habilitar explícitamente los atributos semánticos experimentales más recientes de GenAI                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | Omitir el inicio de un segundo SDK de OpenTelemetry cuando ya hay uno precargado                                                    |

La imagen oficial no incluye Homebrew. Durante la incorporación, OpenClaw oculta los instaladores de dependencias de Skills exclusivos de brew en un contenedor Linux sin `brew`; proporcione esas dependencias mediante una imagen personalizada o instálelas manualmente. Utilice `OPENCLAW_IMAGE_APT_PACKAGES` para dependencias empaquetadas para Debian y `OPENCLAW_IMAGE_PIP_PACKAGES` para dependencias de Python (ejecuta `python3 -m pip install --break-system-packages` durante la compilación, por lo que se deben fijar las versiones y utilizar únicamente índices de confianza).

Si Docker informa de `ResourceExhausted`, `cannot allocate memory` o se interrumpe durante `tsdown`, aumente el límite de memoria del compilador de Docker o vuelva a intentarlo con memorias dinámicas explícitas más pequeñas:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Imágenes compiladas desde el código fuente con plugins seleccionados

`OPENCLAW_EXTENSIONS` selecciona los identificadores de manifiesto de plugins del checkout de origen;
también se aceptan los nombres existentes de directorios de origen cuando difieren. La compilación
de Docker resuelve la selección en directorios de origen una sola vez, instala las dependencias
de producción y, cuando un plugin seleccionado se publica por separado con
`openclaw.build.bundledDist: false`, compila su runtime en el directorio dist incluido
en la raíz. Este empaquetado exclusivo de Docker no cambia el contrato de artefactos npm o ClawHub
del plugin. Los identificadores desconocidos, no válidos o ambiguos hacen que falle la compilación de la imagen.
Los identificadores conocidos que solo corresponden a dependencias o código fuente conservan su preparación
actual de código fuente y dependencias sin obtener una entrada dist compilada en la raíz. Un plugin seleccionado con
entradas de compilación unificadas debe compilarse correctamente; el código fuente y la salida de runtime
de plugins externos no seleccionados se eliminan.

Por ejemplo, estos comandos compilan imágenes de Gateway independientes y multiarquitectura
de FakeCo para ClickClack, Slack y Microsoft Teams. ClawRouter ya forma
parte del runtime raíz de OpenClaw, por lo que la imagen de ClickClack selecciona únicamente
`clickclack`. El argumento explícitamente vacío del navegador mantiene la imagen predeterminada libre
de Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Use `--platform linux/arm64 --load` o `--platform linux/amd64 --load` para una
única compilación local nativa. La salida multiplataforma y los SBOM/datos de procedencia adjuntos
requieren un registro u otra salida de Buildx que conserve las certificaciones. Después
de enviarla, inspeccione el manifiesto e implemente el resumen inmutable en lugar de la
etiqueta mutable del SHA de origen:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Implementar: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Estas imágenes están destinadas a gateways independientes basados en OCI y a usuarios genéricos de Docker.
Los gateways administrados por Crabhelm no las consumen: esa ruta de entrega compila un
archivo de dispositivo x86_64 independiente que contiene un tarball npm de OpenClaw y fija
los resúmenes de Node, del archivo y del manifiesto. Compile ese dispositivo por separado
a partir del mismo código fuente integrado de OpenClaw.

Para probar el código fuente de un plugin incluido con una imagen empaquetada, monte un directorio de código fuente del plugin sobre su ruta de código fuente empaquetada, por ejemplo, `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Esto sustituye el paquete compilado `/app/dist/extensions/synology-chat` correspondiente al mismo identificador de plugin.

### Observabilidad

La exportación de OpenTelemetry sale del contenedor del Gateway hacia su recopilador OTLP; no necesita ningún puerto Docker publicado. Para incluir el exportador incluido en una imagen compilada localmente:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Las imágenes oficiales precompiladas ya incluyen `diagnostics-otel`; instale `clawhub:@openclaw/diagnostics-otel` por su cuenta solo si lo eliminó. Para habilitar la exportación, permita y habilite el plugin `diagnostics-otel` en la configuración y, a continuación, establezca `diagnostics.otel.enabled=true` (consulte el ejemplo completo en [Exportación de OpenTelemetry](/es/gateway/opentelemetry)). Los encabezados de autenticación del recopilador se proporcionan mediante `diagnostics.otel.headers`, no mediante variables de entorno de Docker.

Las métricas de Prometheus reutilizan el puerto del Gateway ya publicado. Instale `clawhub:@openclaw/diagnostics-prometheus`, habilite el plugin `diagnostics-prometheus` y, a continuación, extraiga las métricas de:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La ruta está protegida por la autenticación del Gateway; no exponga un puerto público `/metrics` independiente ni una ruta de proxy inverso sin autenticación. Consulte [Métricas de Prometheus](/es/gateway/prometheus).

### Comprobaciones de estado

Endpoints de sondeo del contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # actividad
curl -fsS http://127.0.0.1:18789/readyz     # disponibilidad
```

El `HEALTHCHECK` integrado de la imagen sondea `/healthz`; los fallos repetidos marcan el contenedor como `unhealthy` para que los orquestadores puedan reiniciarlo o sustituirlo.

Instantánea de estado detallada y autenticada:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a loopback

`scripts/docker/setup.sh` utiliza de forma predeterminada `OPENCLAW_GATEWAY_BIND=lan` para que `http://127.0.0.1:18789` en el host funcione con la publicación de puertos de Docker.

- `lan` (predeterminado): el navegador y la CLI del host pueden acceder al puerto publicado del Gateway.
- `loopback`: solo los procesos dentro del espacio de nombres de red del contenedor pueden acceder directamente al Gateway.

<Note>
Use los valores del modo de enlace en `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), no alias del host como `0.0.0.0` o `127.0.0.1`.
</Note>

### Proveedores locales del host

Dentro del contenedor, `127.0.0.1` es el propio contenedor, no el host. Use `host.docker.internal` para proveedores que se ejecuten en el host:

| Proveedor | URL predeterminada del host | URL de configuración de Docker |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

La configuración incluida utiliza esas URL como valores predeterminados de incorporación de LM Studio/Ollama, y `docker-compose.yml` asigna `host.docker.internal` al Gateway del host en Docker Engine para Linux (Docker Desktop proporciona el mismo alias en macOS/Windows). Los servicios del host deben escuchar en una dirección accesible para Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

¿Usa su propio archivo de Compose o `docker run`? Añada usted mismo la misma asignación, por ejemplo, `--add-host=host.docker.internal:host-gateway`.

### Backend de la CLI de Claude en Docker

La imagen oficial no preinstala Claude Code. Instálelo e inicie sesión dentro del usuario `node` del contenedor y, a continuación, conserve el directorio principal de ese contenedor para que las actualizaciones de la imagen no borren el binario ni el estado de autenticación.

Para una instalación nueva, habilite un volumen persistente `/home/node` antes de ejecutar la configuración:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para una instalación existente, detenga la pila y vuelva a cargar primero los valores actuales de `.env`: el script de configuración siempre vuelve a escribir `.env` a partir del shell actual y los valores predeterminados; no lee el archivo por sí solo:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Si `.env` contiene valores que el shell no puede cargar, vuelva a exportar primero de forma manual aquellos de los que dependa (`OPENCLAW_IMAGE`, puertos, modo de enlace, rutas personalizadas, `OPENCLAW_EXTRA_MOUNTS`, entorno aislado, omisión de la incorporación). La superposición generada monta el volumen principal tanto para `openclaw-gateway` como para `openclaw-cli`; ejecute los comandos restantes con esa superposición (y primero `docker-compose.override.yml`, si utiliza uno):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

El instalador nativo escribe `claude` en `/home/node/.local/bin/claude`. La
imagen de OpenClaw incluye `/home/node/.local/bin` en `PATH`, por lo que el plugin
de Anthropic incluido lo resuelve sin sobrescribir la configuración del adaptador.

Inicie sesión y verifique desde el mismo directorio principal persistente:

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

A continuación, use el backend `claude-cli` incluido:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Saluda desde la CLI de Claude en Docker"
```

`OPENCLAW_HOME_VOLUME` conserva la instalación nativa en `/home/node/.local/bin` y `/home/node/.local/share/claude`, además de la configuración y autenticación de Claude Code en `/home/node/.claude` y `/home/node/.claude.json`. Conservar únicamente `/home/node/.openclaw` no es suficiente; si utiliza `OPENCLAW_EXTRA_MOUNTS` en lugar de un volumen principal, monte todas esas rutas de Claude en ambos servicios.

<Note>
Para automatizaciones de producción compartidas o una facturación predecible de Anthropic, se recomienda la ruta de clave de API de Anthropic. La reutilización de la CLI de Claude depende de la versión instalada de Claude Code, el inicio de sesión de la cuenta, la facturación y el comportamiento de las actualizaciones.
</Note>

### Bonjour / mDNS

Las redes de puente de Docker normalmente no reenvían de forma fiable el tráfico multidifusión de Bonjour/mDNS (`224.0.0.251:5353`). Cuando `OPENCLAW_DISABLE_BONJOUR` no está establecido, el plugin Bonjour incluido deshabilita automáticamente la publicidad en la LAN al detectar que se ejecuta en un contenedor, por lo que no entrará en un bucle de fallos intentando reenviar tráfico multidifusión que el puente descarta. Establezca `OPENCLAW_DISABLE_BONJOUR=1` para forzar su desactivación independientemente de la detección, o `0` para forzar su activación (solo con redes del host, macvlan u otra red donde se sepa que el tráfico multidifusión mDNS funciona).

En los demás casos, use la URL publicada del Gateway, Tailscale o DNS-SD de área extensa para los hosts de Docker. Consulte [Detección mediante Bonjour](/es/gateway/bonjour) para conocer las particularidades y solucionar problemas.

### Almacenamiento y persistencia

Docker Compose monta mediante enlace `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace` y `OPENCLAW_AUTH_PROFILE_SECRET_DIR` en `/home/node/.config/openclaw`, por lo que esas rutas sobreviven a la sustitución del contenedor. Cuando una variable no está establecida, `docker-compose.yml` recurre a una ubicación bajo `${HOME}`, o a `/tmp` si falta el propio `HOME`, por lo que `docker compose up` nunca genera una especificación de volumen con un origen vacío en entornos básicos.

Ese directorio de configuración montado contiene:

- `openclaw.json` para la configuración del comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para la autenticación almacenada del proveedor mediante OAuth/clave de API
- `.env` para secretos del runtime respaldados por el entorno, como `OPENCLAW_GATEWAY_TOKEN`

El directorio de secretos del perfil de autenticación almacena la clave de cifrado local del material de tokens del perfil de autenticación basado en OAuth. Consérvelo con el estado de su host Docker, pero separado de `OPENCLAW_CONFIG_DIR`.

Los plugins descargables instalados almacenan el estado de los paquetes bajo el directorio principal montado de OpenClaw, por lo que los registros de instalación y las raíces de los paquetes sobreviven a la sustitución del contenedor; el inicio del Gateway no vuelve a generar los árboles de dependencias de los plugins incluidos.

Para obtener todos los detalles de persistencia de máquinas virtuales, consulte [Runtime de máquinas virtuales Docker: qué se conserva y dónde](/es/install/docker-vm-runtime#what-persists-where).

**Puntos críticos de crecimiento del disco:** `media/`, bases de datos SQLite por agente, transcripciones de sesiones JSONL heredadas, la base de datos de estado SQLite compartida, las raíces de paquetes de plugins instalados y los registros rotativos de archivos en `/tmp/openclaw/`.

### Ayudantes de shell (opcionales)

Para acortar los comandos cotidianos, instale [ClawDock](/es/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si realizó la instalación desde la ruta anterior `scripts/shell-helpers/clawdock-helpers.sh`, vuelva a ejecutar el comando anterior para que el ayudante local siga la ubicación actual. A continuación, use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. (ejecute `clawdock-help` para ver la lista completa).

<AccordionGroup>
  <Accordion title="Activar el entorno aislado del agente para el Gateway de Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Ruta de socket personalizada (p. ej., Docker sin privilegios de administrador):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    El script monta `docker.sock` solo después de que se cumplan los requisitos previos del entorno aislado. Si no se puede completar la configuración del entorno aislado, restablece `agents.defaults.sandbox.mode` a `off`. El modo de código de Codex se desactiva en los turnos en los que el entorno aislado de OpenClaw está activo (consulte [Entorno aislado § Backend de Docker](/es/gateway/sandboxing#docker-backend)); nunca monte el socket de Docker del host en los contenedores del entorno aislado del agente.

  </Accordion>

  <Accordion title="Automatización / CI (no interactiva)">
    Desactive la asignación de seudoterminal de Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota de seguridad sobre la red compartida">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los comandos de la CLI puedan acceder al Gateway mediante `127.0.0.1`. Trate esto como un límite de confianza compartido. La configuración de Compose elimina `NET_RAW`/`NET_ADMIN` y activa `no-new-privileges` tanto en `openclaw-gateway` como en `openclaw-cli`.
  </Accordion>

  <Accordion title="Fallos de DNS de Docker Desktop en openclaw-cli">
    Algunas configuraciones de Docker Desktop no pueden realizar búsquedas DNS desde el contenedor auxiliar de red compartida `openclaw-cli` después de eliminar `NET_RAW`, lo que se manifiesta como `EAI_AGAIN` durante comandos respaldados por npm como `openclaw plugins install`. Mantenga el archivo de Compose reforzado predeterminado para el funcionamiento normal. La anulación siguiente restaura las capacidades predeterminadas únicamente para el contenedor `openclaw-cli`; úsela para el comando puntual que necesita acceso al registro, no como invocación predeterminada:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Si ya creó un contenedor `openclaw-cli` de ejecución prolongada, vuelva a crearlo con la misma anulación; `docker compose exec`/`docker exec` no pueden cambiar las capacidades de Linux en un contenedor ya creado.

  </Accordion>

  <Accordion title="Permisos y EACCES">
    La imagen se ejecuta como `node` (uid 1000). Si observa errores de permisos en `/home/node/.openclaw`, asegúrese de que los montajes vinculados del host pertenezcan al uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    La misma discrepancia puede manifestarse como `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` seguido de `plugin present but blocked`: el uid del proceso y el propietario del directorio del plugin montado no coinciden. Es preferible ejecutar con el uid 1000 predeterminado y corregir la propiedad del montaje vinculado. Cambie la propiedad de `/path/to/openclaw-config/npm` a `root:root` únicamente si ejecuta OpenClaw de forma intencionada como usuario root a largo plazo.

  </Accordion>

  <Accordion title="Reconstrucciones más rápidas">
    Ordene el Dockerfile de modo que las capas de dependencias se almacenen en caché para evitar volver a ejecutar `pnpm install` a menos que cambien los archivos de bloqueo:

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
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario sin privilegios de administrador `node`. Para disponer de un contenedor con más funciones:

    1. **Conservar `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incorporar las dependencias del sistema**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Incorporar las dependencias de Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Incorporar Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`, o use la etiqueta de imagen oficial `-browser`
    5. **O instalar los navegadores de Playwright en un volumen persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Conservar las descargas del navegador**: use `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`. OpenClaw detecta automáticamente en Linux el Chromium administrado por Playwright de la imagen.

  </Accordion>

  <Accordion title="OAuth de OpenAI Codex (Docker sin interfaz gráfica)">
    Si selecciona OAuth de OpenAI Codex en el asistente, se abre una URL en el navegador. En Docker o en configuraciones sin interfaz gráfica, copie la URL de redirección completa a la que llegue y péguela de nuevo en el asistente para finalizar la autenticación.
  </Accordion>

  <Accordion title="Metadatos de la imagen base">
    La imagen de ejecución usa `node:24-bookworm-slim` y ejecuta `tini` como PID 1 para recoger los procesos zombi y gestionar correctamente las señales en contenedores de ejecución prolongada. Publica anotaciones de la imagen base OCI, incluidas `org.opencontainers.image.base.name` y `org.opencontainers.image.source`. Dependabot actualiza el resumen fijado de la imagen base de Node; las compilaciones de versiones no ejecutan una capa independiente de actualización de la distribución. Consulte [Anotaciones de imágenes OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Ejecución en un VPS?

Consulte [Hetzner (VPS con Docker)](/es/install/hetzner) y [Entorno de ejecución de VM con Docker](/es/install/docker-vm-runtime) para conocer los pasos de implementación en una VM compartida, incluida la incorporación de binarios, la persistencia y las actualizaciones.

## Entorno aislado del agente

Cuando `agents.defaults.sandbox` está activado con el backend de Docker, el Gateway ejecuta las herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores Docker aislados, mientras que el propio Gateway permanece en el host: una barrera sólida alrededor de las sesiones de agente no fiables o multiinquilino sin contenerizar todo el Gateway.

El ámbito del entorno aislado puede ser por agente (valor predeterminado), por sesión o compartido; cada ámbito obtiene su propio espacio de trabajo montado en `/workspace`. También se pueden configurar políticas de herramientas permitidas/denegadas, aislamiento de red, límites de recursos y contenedores de navegador.

Para consultar la configuración completa, las imágenes, las notas de seguridad y los perfiles multiagente:

- [Entorno aislado](/es/gateway/sandboxing) -- referencia completa del entorno aislado
- [OpenShell](/es/gateway/openshell) -- acceso interactivo mediante shell a los contenedores del entorno aislado
- [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente

### Activación rápida

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // desactivado | no principal | todos
        scope: "agent", // sesión | agente | compartido
      },
    },
  },
}
```

Compile la imagen predeterminada del entorno aislado (desde una copia de trabajo del código fuente):

```bash
scripts/sandbox-setup.sh
```

Para instalaciones de npm sin una copia de trabajo del código fuente, consulte [Entorno aislado § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver los comandos `docker build` integrados.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor del entorno aislado no se inicia">
    Compile la imagen del entorno aislado con [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (copia de trabajo del código fuente) o con el comando `docker build` integrado de [Entorno aislado § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) (instalación de npm), o establezca `agents.defaults.sandbox.docker.image` en su imagen personalizada. Los contenedores se crean automáticamente por sesión cuando se necesitan.
  </Accordion>

  <Accordion title="Errores de permisos en el entorno aislado">
    Establezca `docker.user` en un UID:GID que coincida con la propiedad del espacio de trabajo montado, o cambie la propiedad de la carpeta del espacio de trabajo.
  </Accordion>

  <Accordion title="No se encuentran herramientas personalizadas en el entorno aislado">
    OpenClaw ejecuta los comandos con `sh -lc` (shell de inicio de sesión), que carga `/etc/profile` y puede restablecer PATH. Establezca `docker.env.PATH` para anteponer las rutas de sus herramientas personalizadas, o añada un script en `/etc/profile.d/` en el Dockerfile.
  </Accordion>

  <Accordion title="Proceso finalizado por OOM durante la compilación de la imagen (salida 137)">
    La VM necesita al menos 2 GB de RAM. Use una clase de máquina más grande y vuelva a intentarlo.
  </Accordion>

  <Accordion title="No autorizado o emparejamiento obligatorio en la interfaz de control">
    Obtenga un enlace nuevo al panel y apruebe el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más información: [Panel](/es/web/dashboard), [Dispositivos](/es/cli/devices).

  </Accordion>

  <Accordion title="El destino del Gateway muestra ws://172.x.x.x o se producen errores de emparejamiento desde la CLI de Docker">
    Restablezca el modo y el enlace del Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Temas relacionados

- [Descripción general de la instalación](/es/install) — todos los métodos de instalación
- [Podman](/es/install/podman) — alternativa a Docker basada en Podman
- [ClawDock](/es/install/clawdock) — configuración comunitaria de Docker Compose
- [Actualización](/es/install/updating) — cómo mantener OpenClaw actualizado
- [Configuración](/es/gateway/configuration) — configuración del Gateway después de la instalación
