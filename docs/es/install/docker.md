---
read_when:
    - Quieres un gateway en contenedor en lugar de instalaciones locales
    - Estás validando el flujo de Docker
summary: Configuración e incorporación opcionales basadas en Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-01T12:47:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker es **opcional**. Úsalo solo si quieres un Gateway en contenedor o validar el flujo de Docker.

## ¿Docker es adecuado para mí?

- **Sí**: quieres un entorno de Gateway aislado y desechable, o ejecutar OpenClaw en un host sin instalaciones locales.
- **No**: estás ejecutándolo en tu propia máquina y solo quieres el ciclo de desarrollo más rápido. Usa el flujo de instalación normal en su lugar.
- **Nota sobre aislamiento**: el backend de aislamiento predeterminado usa Docker cuando el aislamiento está habilitado, pero el aislamiento está desactivado de forma predeterminada y **no** requiere que todo el Gateway se ejecute en Docker. También están disponibles los backends de aislamiento SSH y OpenShell. Consulta [Aislamiento](/es/gateway/sandboxing).

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para compilar la imagen (`pnpm install` puede ser finalizado por OOM en hosts de 1 GB con salida 137)
- Espacio suficiente en disco para imágenes y registros
- Si lo ejecutas en un VPS/host público, revisa
  [Refuerzo de seguridad para exposición de red](/es/gateway/security),
  especialmente la política de firewall `DOCKER-USER` de Docker.

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

    Las imágenes precompiladas se publican primero en
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR es el registro principal para la automatización de versiones, despliegues fijados
    y comprobaciones de procedencia. El mismo flujo de lanzamiento también publica un mirror oficial en
    Docker Hub en `openclaw/openclaw` para hosts que prefieren Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Usa `ghcr.io/openclaw/openclaw` u `openclaw/openclaw`. Evita los mirrors comunitarios de
    Docker Hub porque OpenClaw no controla sus tiempos de publicación,
    recompilaciones ni política de retención. Etiquetas oficiales comunes: `main`, `latest`,
    `<version>` (por ejemplo, `2026.2.26`) y versiones beta como
    `2026.2.26-beta.1`. Las etiquetas beta no mueven `latest` ni `main`.

  </Step>

  <Step title="Reejecución sin conexión">
    En hosts sin conexión, transfiere y carga primero la imagen:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica que `OPENCLAW_IMAGE` ya exista localmente, desactiva
    pulls y compilaciones implícitas de Compose, y luego ejecuta el flujo de configuración normal, como
    la sincronización de `.env`, correcciones de permisos, onboarding, sincronización de configuración del Gateway
    e inicio de Compose.

    Si `OPENCLAW_SANDBOX=1`, la configuración sin conexión también comprueba las imágenes de aislamiento predeterminadas configuradas
    y las activas por agente en el daemon detrás de
    `OPENCLAW_DOCKER_SOCKET`. Las imágenes de navegador respaldadas por Docker también deben llevar la
    etiqueta actual de contrato de navegador de OpenClaw. Cuando falta una imagen requerida o
    es incompatible, la configuración sale sin cambiar la configuración de aislamiento en lugar de
    informar éxito con un aislamiento inutilizable.

  </Step>

  <Step title="Completar el onboarding">
    El script de configuración ejecuta el onboarding automáticamente. Hará lo siguiente:

    - solicitar claves de API del proveedor
    - generar un token de Gateway y escribirlo en `.env`
    - crear el directorio de clave secreta del perfil de autenticación
    - iniciar el Gateway mediante Docker Compose

    Durante la configuración, el onboarding previo al inicio y las escrituras de configuración se ejecutan directamente mediante
    `openclaw-gateway`. `openclaw-cli` es para comandos que ejecutas después de que
    el contenedor del Gateway ya existe.

  </Step>

  <Step title="Abrir la UI de Control">
    Abre `http://127.0.0.1:18789/` en tu navegador y pega el secreto compartido configurado
    en Settings. El script de configuración escribe un token en `.env` de forma
    predeterminada; si cambias la configuración del contenedor a autenticación por contraseña, usa esa
    contraseña en su lugar.

    ¿Necesitas la URL otra vez?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurar canales (opcional)">
    Usa el contenedor de la CLI para añadir canales de mensajería:

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
u `OPENCLAW_HOME_VOLUME`, el script de configuración escribe `docker-compose.extra.yml`;
inclúyelo después de cualquier archivo de anulación estándar, por ejemplo
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
cuando existan ambos archivos de anulación.
</Note>

<Note>
Como `openclaw-cli` comparte el espacio de nombres de red de `openclaw-gateway`, es una
herramienta posterior al inicio. Antes de `docker compose up -d openclaw-gateway`, ejecuta el onboarding
y las escrituras de configuración de tiempo de configuración mediante `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variables de entorno

El script de configuración acepta estas variables de entorno opcionales:

| Variable                                        | Propósito                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Usar una imagen remota en lugar de compilar localmente                |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Instalar paquetes apt adicionales durante la compilación (separados por espacios) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Instalar paquetes de Python adicionales durante la compilación (separados por espacios) |
| `OPENCLAW_EXTENSIONS`                           | Preinstalar dependencias de Plugin en tiempo de compilación (nombres separados por espacios) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Sobrescribir las opciones de Node para compilación local desde código fuente |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Sobrescribir el heap de tsdown de compilación local desde código fuente en MB |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Omitir la salida de declaraciones durante compilaciones locales de imagen solo para runtime |
| `OPENCLAW_EXTRA_MOUNTS`                         | Montajes bind adicionales del host (`source:target[:opts]` separados por comas) |
| `OPENCLAW_HOME_VOLUME`                          | Persistir `/home/node` en un volumen Docker con nombre               |
| `OPENCLAW_SANDBOX`                              | Activar el arranque de aislamiento (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_SKIP_ONBOARDING`                      | Omitir el paso de onboarding interactivo (`1`, `true`, `yes`, `on`)  |
| `OPENCLAW_DOCKER_SOCKET`                        | Sobrescribir la ruta del socket de Docker                            |
| `OPENCLAW_DISABLE_BONJOUR`                      | Desactivar anuncios Bonjour/mDNS (predeterminado en `1` para Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Desactivar overlays de montaje bind del código fuente de Plugin incluido |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint compartido de colector OTLP/HTTP para exportación de OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoints OTLP específicos de señal para trazas, métricas o registros |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Sobrescritura de protocolo OTLP. Hoy solo se admite `http/protobuf`   |
| `OTEL_SERVICE_NAME`                             | Nombre de servicio usado para recursos de OpenTelemetry               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Optar por los atributos semánticos experimentales más recientes de GenAI |
| `OPENCLAW_OTEL_PRELOADED`                       | Omitir el inicio de un segundo SDK de OpenTelemetry cuando ya hay uno precargado |

La imagen oficial de Docker no incluye Homebrew. Durante el onboarding, OpenClaw
oculta los instaladores de dependencias de Skills que solo usan brew cuando se ejecuta en un contenedor
Linux sin `brew`; esas dependencias deben proporcionarse mediante una imagen personalizada
o instalarse manualmente. Para dependencias disponibles desde paquetes Debian, usa
`OPENCLAW_IMAGE_APT_PACKAGES` durante la compilación de la imagen. El nombre heredado
`OPENCLAW_DOCKER_APT_PACKAGES` todavía se acepta.
Para dependencias de Python, usa `OPENCLAW_IMAGE_PIP_PACKAGES`. Esto ejecuta
`python3 -m pip install --break-system-packages` durante la compilación de la imagen, así que fija
las versiones de los paquetes y usa solo índices de paquetes en los que confíes.
Las compilaciones desde código fuente establecen de forma predeterminada `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` en
`--max-old-space-size=8192` y dejan
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` sin definir para que el wrapper de tsdown pueda
respetar los límites de memoria del contenedor. También establecen de forma predeterminada
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` porque las imágenes de runtime eliminan los archivos de declaración
después de la compilación. Si Docker informa `ResourceExhausted`, `cannot allocate
memory` o se interrumpe durante `tsdown`, aumenta el límite de memoria del builder de Docker o
vuelve a intentarlo con heaps explícitos más pequeños, por ejemplo
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Los mantenedores pueden probar el código fuente de un Plugin incluido contra una imagen empaquetada montando
un directorio de código fuente de Plugin sobre su ruta de código fuente empaquetada, por ejemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ese directorio de código fuente montado sobrescribe el paquete compilado coincidente de
`/app/dist/extensions/synology-chat` para el mismo id de Plugin.

### Observabilidad

La exportación de OpenTelemetry sale desde el contenedor del Gateway hacia tu colector
OTLP. No requiere un puerto Docker publicado. Si compilas la imagen
localmente y quieres que el exportador de OpenTelemetry incluido esté disponible dentro de la imagen,
incluye sus dependencias de runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instala el Plugin oficial `@openclaw/diagnostics-otel` desde ClawHub en
instalaciones Docker empaquetadas antes de habilitar la exportación. Las imágenes personalizadas compiladas desde código fuente aún pueden
incluir el código fuente del Plugin local con
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Para habilitar la exportación, permite y habilita el
Plugin `diagnostics-otel` en la configuración, luego establece
`diagnostics.otel.enabled=true` o usa el ejemplo de configuración en [Exportación de OpenTelemetry
](/es/gateway/opentelemetry). Los encabezados de autenticación del colector se configuran mediante
`diagnostics.otel.headers`, no mediante variables de entorno de Docker.

Las métricas de Prometheus usan el puerto del Gateway ya publicado. Instala
`clawhub:@openclaw/diagnostics-prometheus`, habilita el
Plugin `diagnostics-prometheus` y luego recopila:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La ruta está protegida por la autenticación del Gateway. No expongas un puerto público
`/metrics` separado ni una ruta de proxy inverso sin autenticar. Consulta
[Métricas de Prometheus](/es/gateway/prometheus).

### Comprobaciones de salud

Endpoints de sondeo de contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

La imagen de Docker incluye un `HEALTHCHECK` integrado que hace ping a `/healthz`.
Si las comprobaciones siguen fallando, Docker marca el contenedor como `unhealthy` y
los sistemas de orquestación pueden reiniciarlo o reemplazarlo.

Instantánea profunda de estado autenticada:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a loopback

`scripts/docker/setup.sh` usa de forma predeterminada `OPENCLAW_GATEWAY_BIND=lan` para que el acceso del host a
`http://127.0.0.1:18789` funcione con la publicación de puertos de Docker.

- `lan` (predeterminado): el navegador del host y la CLI del host pueden alcanzar el puerto publicado del gateway.
- `loopback`: solo los procesos dentro del espacio de nombres de red del contenedor pueden alcanzar
  el gateway directamente.

<Note>
Usa valores de modo de enlace en `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), no alias de host como `0.0.0.0` o `127.0.0.1`.
</Note>

### Proveedores locales del host

Cuando OpenClaw se ejecuta en Docker, `127.0.0.1` dentro del contenedor es el propio
contenedor, no tu máquina host. Usa `host.docker.internal` para proveedores de IA que
se ejecutan en el host:

| Proveedor | URL predeterminada del host | URL de configuración en Docker       |
| --------- | --------------------------- | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234`     | `http://host.docker.internal:1234`   |
| Ollama    | `http://127.0.0.1:11434`    | `http://host.docker.internal:11434`  |

La configuración de Docker incluida usa esas URL de host como valores predeterminados
de incorporación para LM Studio y Ollama, y `docker-compose.yml` asigna
`host.docker.internal` al gateway del host de Docker para Docker Engine en Linux.
Docker Desktop ya proporciona el mismo nombre de host en macOS y Windows.

Los servicios del host también deben escuchar en una dirección alcanzable desde Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Si usas tu propio archivo Compose o comando `docker run`, agrega tú mismo la misma
asignación de host, por ejemplo
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI en Docker

La imagen oficial de Docker de OpenClaw no preinstala Claude Code. Instala e
inicia sesión en Claude Code dentro del usuario del contenedor que ejecuta OpenClaw, y luego conserva
ese home del contenedor para que las actualizaciones de imagen no borren el binario ni el estado de autenticación
de Claude.

Para instalaciones nuevas de Docker, habilita un volumen persistente `/home/node` antes de ejecutar
la configuración:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Para una instalación de Docker existente, detén primero el stack y vuelve a cargar los valores
actuales de Docker `.env` antes de ejecutar de nuevo la configuración. El script de configuración no lee
`.env` por sí solo; reescribe `.env` a partir del shell actual y los valores predeterminados. Para
el `.env` generado, ejecuta:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Si tu `.env` contiene valores que tu shell no puede cargar con source, vuelve a exportar manualmente primero
los valores existentes de los que dependes, como `OPENCLAW_IMAGE`, puertos, modo de enlace,
rutas personalizadas, `OPENCLAW_EXTRA_MOUNTS`, sandbox y opciones para omitir la incorporación.
La superposición generada monta el volumen home tanto para `openclaw-gateway` como para
`openclaw-cli`.

Ejecuta los comandos restantes con la superposición Compose generada para que ambos servicios
monten el home persistido. Si tu configuración también usa `docker-compose.override.yml`,
inclúyelo antes de `docker-compose.extra.yml`.

Instala Claude Code en ese home persistido:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

El instalador nativo escribe el binario `claude` bajo
`/home/node/.local/bin/claude`. Indica a OpenClaw que use esa ruta del contenedor:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Inicia sesión y verifica desde dentro del mismo home de contenedor persistido:

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
`/home/node/.local/bin` y `/home/node/.local/share/claude`, además de la configuración
y el estado de autenticación de Claude Code bajo `/home/node/.claude` y `/home/node/.claude.json`.
Conservar solo `/home/node/.openclaw` no basta para reutilizar Claude CLI. Si
usas `OPENCLAW_EXTRA_MOUNTS` en lugar de un volumen home, monta todas esas
rutas de Claude en ambos servicios Docker.

<Note>
Para automatización de producción compartida o facturación predecible de Anthropic, prefiere la
ruta con clave de API de Anthropic. La reutilización de Claude CLI sigue la versión instalada,
el inicio de sesión de cuenta, la facturación y el comportamiento de actualización de Claude Code.
</Note>

### Bonjour / mDNS

La red bridge de Docker normalmente no reenvía multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma fiable. Por eso la configuración Compose incluida
usa de forma predeterminada `OPENCLAW_DISABLE_BONJOUR=1`, para que el Gateway no entre en un ciclo de fallos
ni reinicie repetidamente la publicidad cuando el bridge descarte el tráfico multicast.

Usa la URL publicada del Gateway, Tailscale o DNS-SD de área amplia para hosts Docker.
Configura `OPENCLAW_DISABLE_BONJOUR=0` solo cuando se ejecute con red de host, macvlan
u otra red donde se sepa que el multicast mDNS funciona.

Para advertencias y solución de problemas, consulta [descubrimiento Bonjour](/es/gateway/bonjour).

### Almacenamiento y persistencia

Docker Compose monta con bind `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace` y
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` en `/home/node/.config/openclaw`, de modo que esas
rutas sobreviven al reemplazo del contenedor. Cuando alguna variable no está definida, el
`docker-compose.yml` incluido recurre a `${HOME}`, o a `/tmp` cuando `HOME` también
falta. Eso evita que `docker compose up` emita una especificación de volumen con origen vacío
en entornos básicos.

Ese directorio de configuración montado es donde OpenClaw conserva:

- `openclaw.json` para la configuración de comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para autenticación OAuth/clave de API de proveedores almacenada
- `.env` para secretos de runtime respaldados por variables de entorno, como `OPENCLAW_GATEWAY_TOKEN`

El directorio de claves secretas de perfiles de autenticación almacena la clave de cifrado local usada para
el material de tokens de perfiles de autenticación basados en OAuth. Consérvalo con el estado de tu host Docker,
pero separado de `OPENCLAW_CONFIG_DIR`.

Los plugins descargables instalados almacenan el estado de su paquete bajo el home montado de
OpenClaw, de modo que los registros de instalación de plugins y las raíces de paquetes sobreviven al
reemplazo del contenedor. El arranque del Gateway no genera árboles de dependencias de plugins incluidos.

Para detalles completos de persistencia en despliegues de VM, consulta
[Runtime de VM de Docker - Qué persiste dónde](/es/install/docker-vm-runtime#what-persists-where).

**Puntos críticos de crecimiento de disco:** vigila `media/`, los archivos JSONL de sesión, la base de datos de estado
SQLite compartida, las raíces de paquetes de plugins instalados y los logs rotativos de archivo
bajo `/tmp/openclaw/`.

### Ayudantes de shell (opcional)

Para una gestión diaria de Docker más sencilla, instala `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si instalaste ClawDock desde la ruta raw antigua `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a ejecutar el comando de instalación anterior para que tu archivo local de ayudantes siga la nueva ubicación.

Luego usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Ejecuta
`clawdock-help` para ver todos los comandos.
Consulta [ClawDock](/es/install/clawdock) para la guía completa de ayudantes.

<AccordionGroup>
  <Accordion title="Habilitar sandbox de agente para Docker gateway">
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

    El script monta `docker.sock` solo después de que los prerrequisitos de sandbox pasen. Si
    la configuración de sandbox no puede completarse, el script restablece `agents.defaults.sandbox.mode`
    a `off`. Los turnos de modo código de Codex siguen restringidos al
    `workspace-write` de Codex mientras el sandbox de OpenClaw está activo; no montes el
    socket Docker del host en contenedores de sandbox de agente.

  </Accordion>

  <Accordion title="Automatización / CI (no interactivo)">
    Deshabilita la asignación pseudo-TTY de Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota de seguridad de red compartida">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los comandos
    de la CLI puedan alcanzar el gateway mediante `127.0.0.1`. Trata esto como un
    límite de confianza compartido. La configuración compose elimina `NET_RAW`/`NET_ADMIN` y habilita
    `no-new-privileges` tanto en `openclaw-gateway` como en `openclaw-cli`.
  </Accordion>

  <Accordion title="Fallos de DNS de Docker Desktop en openclaw-cli">
    Algunas configuraciones de Docker Desktop fallan en las búsquedas DNS desde el sidecar de red compartida
    `openclaw-cli` después de eliminar `NET_RAW`, lo que aparece como
    `EAI_AGAIN` durante comandos respaldados por npm como `openclaw plugins install`.
    Mantén el archivo compose reforzado predeterminado para la operación normal del gateway. La
    anulación local siguiente relaja la postura de seguridad del contenedor CLI al
    restaurar las capacidades predeterminadas de Docker, así que úsala solo para el comando CLI puntual
    que necesita acceso al registro de paquetes, no como tu invocación Compose
    predeterminada:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Si ya creaste un contenedor `openclaw-cli` de larga duración, recréalo
    con la misma anulación. `docker compose exec` y `docker exec` no pueden
    cambiar las capacidades de Linux en un contenedor ya creado.

  </Accordion>

  <Accordion title="Permisos y EACCES">
    La imagen se ejecuta como `node` (uid 1000). Si ves errores de permisos en
    `/home/node/.openclaw`, asegúrate de que tus montajes bind del host pertenezcan al uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    El mismo desacuerdo puede aparecer como una advertencia de plugin como
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguida de `plugin present but blocked`. Eso significa que el uid del proceso y el
    propietario del directorio de plugin montado no coinciden. Prefiere ejecutar el contenedor con el
    uid 1000 predeterminado y corregir la propiedad del montaje bind. Solo aplica chown a
    `/path/to/openclaw-config/npm` como `root:root` si ejecutas intencionalmente
    OpenClaw como root a largo plazo.

  </Accordion>

  <Accordion title="Reconstrucciones más rápidas">
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

  <Accordion title="Opciones de contenedor para usuarios avanzados">
    La imagen predeterminada prioriza la seguridad y se ejecuta como `node` sin
    privilegios de root. Para un contenedor con más funciones:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependencias del sistema**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Incluir dependencias de Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Incluir Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **O instalar navegadores de Playwright en un volumen persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Persistir las descargas del navegador**: usa `OPENCLAW_HOME_VOLUME` u
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw detecta automáticamente el Chromium
       administrado por Playwright de la imagen de Docker en Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sin interfaz gráfica)">
    Si eliges OpenAI Codex OAuth en el asistente, se abre una URL del navegador. En
    Docker o configuraciones sin interfaz gráfica, copia la URL completa de redirección
    a la que llegues y pégala de nuevo en el asistente para completar la autenticación.
  </Accordion>

  <Accordion title="Metadatos de la imagen base">
    La imagen principal de runtime de Docker usa `node:24-bookworm-slim` e incluye `tini` como proceso init de punto de entrada (PID 1) para garantizar que los procesos zombis se recojan y que las señales se gestionen correctamente en contenedores de larga duración. Publica anotaciones de imagen base OCI, incluidas `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` y otras. El digest base de Node se
    actualiza mediante PRs de Dependabot para imágenes base de Docker; las compilaciones de release no ejecutan
    una capa de actualización de la distribución. Consulta
    [anotaciones de imagen OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Ejecutar en un VPS?

Consulta [Hetzner (VPS con Docker)](/es/install/hetzner) y
[Runtime de VM de Docker](/es/install/docker-vm-runtime) para ver pasos compartidos de despliegue en VM,
incluida la inclusión de binarios, la persistencia y las actualizaciones.

## Entorno aislado del agente

Cuando `agents.defaults.sandbox` está habilitado con el backend de Docker, el Gateway
ejecuta las herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores de Docker
aislados mientras el propio Gateway permanece en el host. Esto te da una barrera firme
alrededor de sesiones de agente no confiables o multiinquilino sin contenerizar todo el
Gateway.

El alcance del entorno aislado puede ser por agente (predeterminado), por sesión o compartido. Cada alcance
obtiene su propio espacio de trabajo montado en `/workspace`. También puedes configurar
políticas de permitir/denegar herramientas, aislamiento de red, límites de recursos y contenedores
de navegador.

Para la configuración completa, imágenes, notas de seguridad y perfiles multiagente, consulta:

- [Entorno aislado](/es/gateway/sandboxing) -- referencia completa del entorno aislado
- [OpenShell](/es/gateway/openshell) -- acceso interactivo de shell a contenedores del entorno aislado
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

Compila la imagen predeterminada del entorno aislado (desde un checkout del código fuente):

```bash
scripts/sandbox-setup.sh
```

Para instalaciones de npm sin un checkout del código fuente, consulta [Entorno aislado § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` en línea.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor del entorno aislado no se inicia">
    Compila la imagen del entorno aislado con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout del código fuente) o el comando `docker build` en línea de [Entorno aislado § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) (instalación de npm),
    o establece `agents.defaults.sandbox.docker.image` en tu imagen personalizada.
    Los contenedores se crean automáticamente por sesión bajo demanda.
  </Accordion>

  <Accordion title="Errores de permisos en el entorno aislado">
    Establece `docker.user` en un UID:GID que coincida con la propiedad de tu espacio de trabajo montado,
    o cambia el propietario de la carpeta del espacio de trabajo.
  </Accordion>

  <Accordion title="No se encuentran herramientas personalizadas en el entorno aislado">
    OpenClaw ejecuta comandos con `sh -lc` (shell de inicio de sesión), lo que carga
    `/etc/profile` y puede restablecer PATH. Establece `docker.env.PATH` para anteponer tus
    rutas de herramientas personalizadas, o agrega un script bajo `/etc/profile.d/` en tu Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed durante la compilación de la imagen (salida 137)">
    La VM necesita al menos 2 GB de RAM. Usa una clase de máquina más grande y vuelve a intentarlo.
  </Accordion>

  <Accordion title="No autorizado o emparejamiento requerido en Control UI">
    Obtén un enlace nuevo del panel y aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más detalles: [Panel](/es/web/dashboard), [Dispositivos](/es/cli/devices).

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
