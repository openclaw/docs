---
read_when:
    - Quieres un Gateway en contenedor en lugar de instalaciones locales
    - Está validando el flujo de Docker
summary: Configuración e incorporación opcionales mediante Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-12T14:36:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker es **opcional**. Úselo para disponer de un entorno de Gateway aislado y desechable o en un host sin instalaciones locales. Si ya desarrolla en su propia máquina, utilice en su lugar el flujo de instalación normal.

El backend de aislamiento predeterminado utiliza Docker cuando `agents.defaults.sandbox` está habilitado, pero el aislamiento está desactivado de forma predeterminada y no requiere que el propio Gateway se ejecute en Docker. También están disponibles los backends de aislamiento SSH y OpenShell; consulte [Aislamiento](/es/gateway/sandboxing).

¿Aloja a varios usuarios? Consulte [Alojamiento multiinquilino](/gateway/multi-tenant-hosting) para conocer el modelo de una celda por inquilino.

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para compilar la imagen (`pnpm install` puede finalizar por falta de memoria en hosts con 1 GB y código de salida 137)
- Espacio en disco suficiente para las imágenes y los registros
- En un VPS/host público, revise [Refuerzo de seguridad para la exposición de red](/es/gateway/security), especialmente la cadena de firewall `DOCKER-USER` de Docker

## Gateway en contenedores

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

    Las imágenes precompiladas se publican primero en [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR es el registro principal para la automatización de versiones, los despliegues con versiones fijadas y las comprobaciones de procedencia. La misma versión publica un espejo en Docker Hub como `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Utilice `ghcr.io/openclaw/openclaw` u `openclaw/openclaw` y evite los espejos no oficiales, que no comparten la cadencia de publicación ni la política de retención de OpenClaw. Etiquetas oficiales: `main`, `latest`, `<version>` (por ejemplo, `2026.2.26`) y etiquetas beta como `2026.2.26-beta.1` (las versiones beta nunca modifican `latest`/`main`). La imagen predeterminada `main`/`latest`/`<version>` incluye los plugins `codex` y `diagnostics-otel`. Una variante `-browser` (por ejemplo, `latest-browser`) también incluye Chromium integrado, lo que resulta útil para la herramienta de [navegador aislado](/es/gateway/sandboxing#sandboxed-browser) sin tener que instalar Playwright en la primera ejecución.

  </Step>

  <Step title="Repetir la ejecución sin conexión">
    En hosts sin conexión, transfiera y cargue primero la imagen:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica que `OPENCLAW_IMAGE` ya exista localmente, deshabilita las descargas y compilaciones implícitas de Compose y, después, ejecuta el flujo normal: sincronización de `.env`, corrección de permisos, incorporación, sincronización de la configuración del Gateway e inicio de Compose.

    Si `OPENCLAW_SANDBOX=1`, la configuración sin conexión también comprueba las imágenes de aislamiento predeterminadas y específicas de cada agente configuradas en el daemon asociado a `OPENCLAW_DOCKER_SOCKET`, incluida la etiqueta de contrato del navegador en las imágenes de navegador basadas en Docker. Si falta una imagen necesaria o está desactualizada, la configuración finaliza sin modificar la configuración de aislamiento, en lugar de informar incorrectamente de que la operación se completó correctamente.

  </Step>

  <Step title="Completar la incorporación">
    El script de configuración ejecuta automáticamente la incorporación:

    - solicita las claves de API del proveedor
    - genera un token del Gateway y lo escribe en `.env`
    - crea el directorio de la clave secreta del perfil de autenticación
    - inicia el Gateway mediante Docker Compose

    La incorporación previa al inicio y las escrituras de configuración se ejecutan directamente mediante `openclaw-gateway` (con `--no-deps --entrypoint node`), ya que `openclaw-cli` comparte el espacio de nombres de red del Gateway y solo funciona cuando ya existe el contenedor del Gateway.

  </Step>

  <Step title="Abrir la interfaz de control">
    Abra `http://127.0.0.1:18789/` y pegue en Settings el token escrito en `.env`. Si cambió el contenedor para utilizar autenticación mediante contraseña, utilice esa contraseña en su lugar.

    ¿Necesita volver a obtener la URL?

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
como se muestra anteriormente, para que la pantalla Acerca de de la imagen indique el commit extraído y
una marca de tiempo de compilación. `scripts/docker/setup.sh` resuelve y pasa ambos valores
automáticamente.

<Note>
Ejecute `docker compose` desde la raíz del repositorio. Si habilitó `OPENCLAW_EXTRA_MOUNTS` u `OPENCLAW_HOME_VOLUME`, el script de configuración escribe `docker-compose.extra.yml`; inclúyalo después de cualquier `docker-compose.override.yml` que mantenga, por ejemplo, `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Actualizar imágenes de contenedor

Cuando sustituye la imagen de OpenClaw pero conserva el mismo estado y la misma configuración montados, el
nuevo Gateway ejecuta migraciones de actualización seguras durante el inicio y la convergencia de plugins antes de
estar listo. Las actualizaciones rutinarias de imágenes no deberían requerir una ejecución independiente de
`openclaw doctor --fix`.

Si el proceso de inicio no puede completar esas reparaciones de forma segura, el Gateway finaliza en lugar de
informar de que está en buen estado. Con una política de reinicio, Docker, Podman o Kubernetes pueden mostrar
el contenedor del Gateway reiniciándose. Conserve el volumen de estado montado y, a continuación, ejecute
una vez la misma imagen con `openclaw doctor --fix` como comando del contenedor, utilizando los
mismos montajes de estado y configuración que utiliza el Gateway:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Cuando doctor finalice, reinicie el contenedor del Gateway con su comando predeterminado.
En Kubernetes, ejecute el mismo comando en un Job de una sola ejecución o en un pod de depuración montado en el
mismo PVC y, a continuación, reinicie el Deployment o StatefulSet.

### Variables de entorno

Variables opcionales aceptadas por `scripts/docker/setup.sh` (y, para el contenedor del Gateway, directamente por `docker-compose.yml`):

| Variable                                        | Finalidad                                                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Utilizar una imagen remota en lugar de compilarla localmente                                                                       |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Instalar paquetes apt adicionales durante la compilación (separados por espacios). Alias heredado: `OPENCLAW_DOCKER_APT_PACKAGES` |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Instalar paquetes adicionales de Python durante la compilación (separados por espacios)                                            |
| `OPENCLAW_EXTENSIONS`                           | Compilar/empaquetar los plugins compatibles seleccionados e instalar sus dependencias de ejecución (identificadores separados por comas o espacios) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Sustituir las opciones de Node para la compilación local desde el código fuente (valor predeterminado: `--max-old-space-size=8192`) |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Sustituir el tamaño del montón de tsdown en MB para la compilación local desde el código fuente                                    |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Omitir la generación de declaraciones durante las compilaciones locales de imágenes solo para ejecución (valor predeterminado: `1`) |
| `OPENCLAW_INSTALL_BROWSER`                      | Integrar Chromium + Xvfb en la imagen durante la compilación                                                                       |
| `OPENCLAW_EXTRA_MOUNTS`                         | Montajes bind adicionales del host (valores `source:target[:opts]` separados por comas)                                            |
| `OPENCLAW_HOME_VOLUME`                          | Conservar `/home/node` en un volumen de Docker con nombre                                                                          |
| `OPENCLAW_SANDBOX`                              | Habilitar explícitamente la inicialización del aislamiento (`1`, `true`, `yes`, `on`)                                              |
| `OPENCLAW_SKIP_ONBOARDING`                      | Omitir el paso de incorporación interactivo (`1`, `true`, `yes`, `on`)                                                             |
| `OPENCLAW_DOCKER_SOCKET`                        | Sustituir la ruta del socket de Docker                                                                                              |
| `OPENCLAW_DISABLE_BONJOUR`                      | Forzar la activación (`0`) o desactivación (`1`) de la difusión Bonjour/mDNS; consulte [Bonjour / mDNS](#bonjour--mdns)             |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Deshabilitar las superposiciones de montaje bind del código fuente de los plugins incluidos                                        |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint compartido del recopilador OTLP/HTTP para la exportación de OpenTelemetry                                                 |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoints OTLP específicos de cada señal para trazas, métricas o registros                                                         |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Sustitución del protocolo OTLP. Actualmente solo se admite `http/protobuf`                                                         |
| `OTEL_SERVICE_NAME`                             | Nombre del servicio utilizado para los recursos de OpenTelemetry                                                                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Habilitar explícitamente los atributos semánticos experimentales más recientes de GenAI                                            |
| `OPENCLAW_OTEL_PRELOADED`                       | Omitir el inicio de un segundo SDK de OpenTelemetry cuando ya hay uno precargado                                                    |

La imagen oficial no incluye Homebrew. Durante la incorporación, OpenClaw oculta los instaladores de dependencias de Skills exclusivos de brew en un contenedor Linux sin `brew`; proporcione esas dependencias mediante una imagen personalizada o instálelas manualmente. Utilice `OPENCLAW_IMAGE_APT_PACKAGES` para las dependencias empaquetadas para Debian y `OPENCLAW_IMAGE_PIP_PACKAGES` para las dependencias de Python (ejecuta `python3 -m pip install --break-system-packages` durante la compilación, por lo que debe fijar las versiones y utilizar únicamente índices de confianza).

Si Docker informa de `ResourceExhausted`, `cannot allocate memory` o se interrumpe durante `tsdown`, aumente el límite de memoria del compilador de Docker o vuelva a intentarlo con tamaños de montón explícitos más pequeños:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Imágenes compiladas desde el código fuente con plugins seleccionados

`OPENCLAW_EXTENSIONS` selecciona los identificadores de manifiesto de los plugins del checkout del código fuente;
también se aceptan los nombres existentes de los directorios de código fuente cuando son diferentes. La compilación
de Docker resuelve una vez la selección en directorios de código fuente, instala las dependencias
de producción y, cuando un plugin seleccionado se publica por separado con
`openclaw.build.bundledDist: false`, compila su runtime en la distribución incluida
raíz. Este empaquetado exclusivo de Docker no cambia el contrato de artefactos npm ni
ClawHub del plugin. Los identificadores desconocidos, no válidos o ambiguos hacen que falle la compilación de la imagen.
Los identificadores conocidos que son solo de dependencia o código fuente conservan su preparación existente de código fuente y
dependencias sin obtener una entrada compilada en la distribución raíz. Un plugin seleccionado con
entradas de compilación unificadas debe compilarse correctamente; se eliminan el código fuente y la
salida del runtime de los plugins externos no seleccionados.

Por ejemplo, estos comandos compilan imágenes independientes y autónomas del Gateway
FakeCo para varias arquitecturas, destinadas a ClickClack, Slack y Microsoft Teams. ClawRouter ya
forma parte del runtime raíz de OpenClaw, por lo que la imagen de ClickClack selecciona únicamente
`clickclack`. El argumento de navegador vacío explícito mantiene la imagen predeterminada sin
Chromium:

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
única compilación local nativa. La salida multiplataforma y el SBOM y la procedencia adjuntos
requieren un registro u otra salida de Buildx que conserve las certificaciones. Después de
publicar, inspeccione el manifiesto e implemente el resumen inmutable en lugar de la
etiqueta mutable del SHA del código fuente:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Implementar: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Estas imágenes están destinadas a gateways autónomos basados en OCI y a usuarios genéricos de Docker.
Los gateways administrados por Crabhelm no las utilizan: esa vía de entrega compila un
archivo de dispositivo x86_64 independiente que contiene un tarball npm de OpenClaw y fija
los resúmenes de Node, del archivo y del manifiesto. Compile ese dispositivo por separado
a partir del mismo código fuente de OpenClaw incorporado.

Para probar el código fuente de un plugin incluido con una imagen empaquetada, monte un directorio de código fuente del plugin sobre su ruta de código fuente empaquetada, por ejemplo, `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Esto sustituye el paquete compilado correspondiente de `/app/dist/extensions/synology-chat` para el mismo identificador de plugin.

### Observabilidad

La exportación de OpenTelemetry es saliente desde el contenedor del Gateway hacia su recopilador OTLP; no necesita ningún puerto de Docker publicado. Para incluir el exportador incorporado en una imagen compilada localmente:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Las imágenes oficiales precompiladas ya incluyen `diagnostics-otel`; instale `clawhub:@openclaw/diagnostics-otel` por su cuenta únicamente si lo eliminó. Para habilitar la exportación, permita y habilite el plugin `diagnostics-otel` en la configuración y, después, establezca `diagnostics.otel.enabled=true` (consulte el ejemplo completo en [Exportación de OpenTelemetry](/es/gateway/opentelemetry)). Los encabezados de autenticación del recopilador se configuran mediante `diagnostics.otel.headers`, no mediante variables de entorno de Docker.

Las métricas de Prometheus reutilizan el puerto del Gateway ya publicado. Instale `clawhub:@openclaw/diagnostics-prometheus`, habilite el plugin `diagnostics-prometheus` y, después, recopile:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La ruta está protegida mediante la autenticación del Gateway; no exponga un puerto público `/metrics` independiente ni una ruta de proxy inverso sin autenticar. Consulte [Métricas de Prometheus](/es/gateway/prometheus).

### Comprobaciones de estado

Endpoints de sondeo del contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # actividad
curl -fsS http://127.0.0.1:18789/readyz     # disponibilidad
```

El `HEALTHCHECK` integrado de la imagen consulta `/healthz`; los fallos repetidos marcan el contenedor como `unhealthy` para que los orquestadores puedan reiniciarlo o reemplazarlo.

Instantánea detallada y autenticada del estado:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a loopback

`scripts/docker/setup.sh` establece de forma predeterminada `OPENCLAW_GATEWAY_BIND=lan` para que `http://127.0.0.1:18789` en el host funcione con la publicación de puertos de Docker.

- `lan` (predeterminado): el navegador y la CLI del host pueden acceder al puerto publicado del Gateway.
- `loopback`: solo los procesos dentro del espacio de nombres de red del contenedor pueden acceder directamente al Gateway.

<Note>
Use valores del modo de enlace en `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), no alias del host como `0.0.0.0` o `127.0.0.1`.
</Note>

### Proveedores locales del host

Dentro del contenedor, `127.0.0.1` es el propio contenedor, no el host. Use `host.docker.internal` para los proveedores que se ejecutan en el host:

| Proveedor | URL predeterminada del host | URL de configuración de Docker      |
| --------- | --------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`     | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`    | `http://host.docker.internal:11434` |

La configuración incluida usa esas URL como valores predeterminados de incorporación de LM Studio/Ollama, y `docker-compose.yml` asigna `host.docker.internal` al Gateway del host en Docker Engine para Linux (Docker Desktop proporciona el mismo alias en macOS/Windows). Los servicios del host deben escuchar en una dirección a la que Docker pueda acceder:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

¿Usa su propio archivo de Compose o `docker run`? Añada la misma asignación, por ejemplo, `--add-host=host.docker.internal:host-gateway`.

### Backend de Claude CLI en Docker

La imagen oficial no incluye Claude Code preinstalado. Instálelo e inicie sesión dentro del contenedor con el usuario `node` y, a continuación, conserve de forma persistente el directorio personal de ese contenedor para que las actualizaciones de la imagen no borren el binario ni el estado de autenticación.

Para una instalación nueva, habilite un volumen persistente en `/home/node` antes de ejecutar la configuración:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para una instalación existente, detenga el conjunto de servicios y vuelva a cargar primero los valores actuales de `.env`: el script de configuración siempre vuelve a escribir `.env` a partir del entorno de shell actual y los valores predeterminados; no lee el archivo por sí solo:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Si `.env` contiene valores que el shell no puede cargar, vuelva a exportar primero y de forma manual aquellos de los que depende (`OPENCLAW_IMAGE`, puertos, modo de enlace, rutas personalizadas, `OPENCLAW_EXTRA_MOUNTS`, entorno aislado, omisión de la incorporación). La superposición generada monta el volumen del directorio personal tanto para `openclaw-gateway` como para `openclaw-cli`; ejecute los comandos restantes con esa superposición (y primero con `docker-compose.override.yml`, si utiliza uno):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

El instalador nativo guarda `claude` en `/home/node/.local/bin/claude`. Configure OpenClaw para que utilice esa ruta:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Inicie sesión y verifique el funcionamiento desde el mismo directorio personal persistente:

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

A continuación, utilice el backend `claude-cli` incluido:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Saluda desde Claude CLI en Docker"
```

`OPENCLAW_HOME_VOLUME` conserva la instalación nativa en `/home/node/.local/bin` y `/home/node/.local/share/claude`, además de la configuración y autenticación de Claude Code en `/home/node/.claude` y `/home/node/.claude.json`. Conservar únicamente `/home/node/.openclaw` no es suficiente; si utiliza `OPENCLAW_EXTRA_MOUNTS` en lugar de un volumen para el directorio personal, monte todas esas rutas de Claude en ambos servicios.

<Note>
Para automatizaciones compartidas en producción o una facturación predecible de Anthropic, es preferible utilizar la vía de la clave de API de Anthropic. La reutilización de Claude CLI depende de la versión instalada de Claude Code, el inicio de sesión de la cuenta y su comportamiento de facturación y actualización.
</Note>

### Bonjour / mDNS

La red en puente de Docker no suele reenviar de forma fiable el tráfico multidifusión de Bonjour/mDNS (`224.0.0.251:5353`). Cuando `OPENCLAW_DISABLE_BONJOUR` no está definido, el Plugin de Bonjour incluido desactiva automáticamente la publicidad en la red LAN al detectar que se ejecuta en un contenedor, de modo que no entra en un bucle de fallos al reintentar el tráfico multidifusión que descarta el puente. Establezca `OPENCLAW_DISABLE_BONJOUR=1` para forzar su desactivación independientemente de la detección, o `0` para forzar su activación (solo con redes de host, macvlan u otra red donde se sepa que el tráfico multidifusión mDNS funciona).

En los demás casos, utilice la URL publicada del Gateway, Tailscale o DNS-SD de área amplia para los hosts de Docker. Consulte [Detección de Bonjour](/es/gateway/bonjour) para conocer las salvedades y solucionar problemas.

### Almacenamiento y persistencia

Docker Compose monta mediante enlace `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace` y `OPENCLAW_AUTH_PROFILE_SECRET_DIR` en `/home/node/.config/openclaw`, por lo que esas rutas sobreviven a la sustitución del contenedor. Cuando una variable no está definida, `docker-compose.yml` utiliza una ruta alternativa bajo `${HOME}`, o `/tmp` si tampoco existe `HOME`, por lo que `docker compose up` nunca genera una especificación de volumen con un origen vacío en entornos básicos.

Ese directorio de configuración montado contiene:

- `openclaw.json` para la configuración del comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para la autenticación almacenada mediante OAuth o claves de API de proveedores
- `.env` para secretos de ejecución proporcionados mediante variables de entorno, como `OPENCLAW_GATEWAY_TOKEN`

El directorio de secretos de los perfiles de autenticación almacena la clave de cifrado local del material de tokens de los perfiles de autenticación basados en OAuth. Consérvelo junto con el estado del host de Docker, pero separado de `OPENCLAW_CONFIG_DIR`.

Los plugins descargables instalados almacenan el estado de los paquetes en el directorio personal montado de OpenClaw, por lo que los registros de instalación y las raíces de los paquetes sobreviven a la sustitución del contenedor; el inicio del Gateway no vuelve a generar los árboles de dependencias de los plugins incluidos.

Para obtener información completa sobre la persistencia de máquinas virtuales, consulte [Entorno de ejecución de máquinas virtuales de Docker: qué se conserva y dónde](/es/install/docker-vm-runtime#what-persists-where).

**Puntos críticos de crecimiento del disco:** `media/`, las bases de datos SQLite de cada agente, las transcripciones JSONL de sesiones heredadas, la base de datos SQLite de estado compartido, las raíces de paquetes de los plugins instalados y los registros rotativos de archivos en `/tmp/openclaw/`.

### Ayudantes de shell (opcionales)

Para acortar los comandos de uso cotidiano, instale [ClawDock](/es/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si realizaste la instalación desde la antigua ruta `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a ejecutar el comando anterior para que tu ayudante local apunte a la ubicación actual. Después, usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. (ejecuta `clawdock-help` para consultar la lista completa).

<AccordionGroup>
  <Accordion title="Activar el entorno aislado del agente para el Gateway de Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Ruta de socket personalizada (por ejemplo, Docker sin privilegios de root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    El script monta `docker.sock` solo después de que se cumplan los requisitos previos del entorno aislado. Si no se puede completar la configuración del entorno aislado, restablece `agents.defaults.sandbox.mode` a `off`. El modo de código de Codex se desactiva en los turnos en los que el entorno aislado de OpenClaw está activo (consulta [Entorno aislado § Backend de Docker](/es/gateway/sandboxing#docker-backend)); nunca montes el socket de Docker del host en los contenedores del entorno aislado del agente.

  </Accordion>

  <Accordion title="Automatización/CI (no interactiva)">
    Desactiva la asignación de pseudo-TTY de Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota de seguridad sobre la red compartida">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los comandos de la CLI puedan acceder al Gateway mediante `127.0.0.1`. Considera esto un límite de confianza compartido. La configuración de Compose elimina `NET_RAW`/`NET_ADMIN` y activa `no-new-privileges` tanto en `openclaw-gateway` como en `openclaw-cli`.
  </Accordion>

  <Accordion title="Fallos de DNS de Docker Desktop en openclaw-cli">
    En algunas configuraciones de Docker Desktop, las consultas DNS fallan desde el contenedor auxiliar `openclaw-cli` de red compartida después de eliminar `NET_RAW`, lo que aparece como `EAI_AGAIN` durante comandos respaldados por npm, como `openclaw plugins install`. Mantén el archivo de Compose reforzado predeterminado para el funcionamiento normal. La sobrescritura siguiente restaura las capacidades predeterminadas únicamente para el contenedor `openclaw-cli`; úsala para el comando puntual que necesite acceso al registro, no como invocación predeterminada:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Si ya creaste un contenedor `openclaw-cli` de larga duración, vuelve a crearlo con la misma sobrescritura; `docker compose exec`/`docker exec` no pueden cambiar las capacidades de Linux de un contenedor ya creado.

  </Accordion>

  <Accordion title="Permisos y EACCES">
    La imagen se ejecuta como `node` (uid 1000). Si aparecen errores de permisos en `/home/node/.openclaw`, asegúrate de que los montajes enlazados del host pertenezcan al uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    La misma discrepancia puede aparecer como `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` seguido de `plugin present but blocked`: el uid del proceso y el propietario del directorio del plugin montado no coinciden. Es preferible ejecutar con el uid 1000 predeterminado y corregir la propiedad del montaje enlazado. Cambia la propiedad de `/path/to/openclaw-config/npm` a `root:root` únicamente si ejecutas OpenClaw como root de forma intencionada y permanente.

  </Accordion>

  <Accordion title="Reconstrucciones más rápidas">
    Ordena el Dockerfile para que las capas de dependencias se almacenen en caché y evitar volver a ejecutar `pnpm install` a menos que cambien los archivos de bloqueo:

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
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario sin privilegios de root `node`. Para disponer de un contenedor con más funciones:

    1. **Conservar `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependencias del sistema en la imagen**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Incluir dependencias de Python en la imagen**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Incluir Chromium de Playwright en la imagen**: `export OPENCLAW_INSTALL_BROWSER=1`, o usa la etiqueta de imagen oficial `-browser`
    5. **O instalar los navegadores de Playwright en un volumen persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Conservar las descargas del navegador**: usa `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`. OpenClaw detecta automáticamente en Linux el Chromium administrado por Playwright incluido en la imagen.

  </Accordion>

  <Accordion title="OAuth de OpenAI Codex (Docker sin interfaz gráfica)">
    Si eliges OAuth de OpenAI Codex en el asistente, se abre una URL en el navegador. En Docker o en configuraciones sin interfaz gráfica, copia la URL de redirección completa a la que llegues y pégala de nuevo en el asistente para finalizar la autenticación.
  </Accordion>

  <Accordion title="Metadatos de la imagen base">
    La imagen de ejecución usa `node:24-bookworm-slim` y ejecuta `tini` como PID 1 para que se recojan los procesos zombis y se gestionen correctamente las señales en contenedores de larga duración. Publica anotaciones de imagen base OCI, incluidas `org.opencontainers.image.base.name` y `org.opencontainers.image.source`. Dependabot actualiza el resumen fijado de la imagen base de Node; las compilaciones de versiones no ejecutan una capa independiente de actualización de la distribución. Consulta [Anotaciones de imágenes OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Lo ejecutas en un VPS?

Consulta [Hetzner (VPS con Docker)](/es/install/hetzner) y [Entorno de ejecución de VM con Docker](/es/install/docker-vm-runtime) para conocer los pasos de despliegue en una VM compartida, incluidos la inclusión de binarios en la imagen, la persistencia y las actualizaciones.

## Entorno aislado del agente

Cuando `agents.defaults.sandbox` está activado con el backend de Docker, el Gateway ejecuta las herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores Docker aislados, mientras que el propio Gateway permanece en el host. Esto crea una barrera sólida alrededor de las sesiones de agentes no confiables o multiinquilino sin contenerizar todo el Gateway.

El ámbito del entorno aislado puede ser por agente (opción predeterminada), por sesión o compartido; cada ámbito obtiene su propio espacio de trabajo montado en `/workspace`. También puedes configurar políticas de herramientas permitidas y denegadas, aislamiento de red, límites de recursos y contenedores de navegador.

Para consultar la configuración completa, las imágenes, las notas de seguridad y los perfiles multiagente:

- [Entorno aislado](/es/gateway/sandboxing) -- referencia completa del entorno aislado
- [OpenShell](/es/gateway/openshell) -- acceso interactivo mediante shell a los contenedores del entorno aislado
- [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- sobrescrituras por agente

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

Compila la imagen predeterminada del entorno aislado (desde un repositorio de código fuente):

```bash
scripts/sandbox-setup.sh
```

Para instalaciones de npm sin un repositorio de código fuente, consulta [Entorno aislado § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` en línea.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor del entorno aislado no se inicia">
    Compila la imagen del entorno aislado con [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (repositorio de código fuente) o con el comando `docker build` en línea de [Entorno aislado § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) (instalación mediante npm), o establece `agents.defaults.sandbox.docker.image` en tu imagen personalizada. Los contenedores se crean automáticamente por sesión cuando se necesitan.
  </Accordion>

  <Accordion title="Errores de permisos en el entorno aislado">
    Establece `docker.user` en un UID:GID que coincida con la propiedad del espacio de trabajo montado, o cambia la propiedad de la carpeta del espacio de trabajo.
  </Accordion>

  <Accordion title="No se encuentran herramientas personalizadas en el entorno aislado">
    OpenClaw ejecuta los comandos con `sh -lc` (shell de inicio de sesión), que carga `/etc/profile` y puede restablecer PATH. Establece `docker.env.PATH` para anteponer las rutas de tus herramientas personalizadas, o añade un script en `/etc/profile.d/` dentro del Dockerfile.
  </Accordion>

  <Accordion title="Proceso terminado por OOM durante la compilación de la imagen (salida 137)">
    La VM necesita al menos 2 GB de RAM. Usa una clase de máquina más grande y vuelve a intentarlo.
  </Accordion>

  <Accordion title="No autorizado o emparejamiento requerido en la interfaz de control">
    Obtén un enlace nuevo al panel y aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más información: [Panel](/es/web/dashboard), [Dispositivos](/es/cli/devices).

  </Accordion>

  <Accordion title="El destino del Gateway muestra ws://172.x.x.x o hay errores de emparejamiento desde la CLI de Docker">
    Restablece el modo y la dirección de enlace del Gateway:

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
