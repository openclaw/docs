---
read_when:
    - Quieres un Gateway en contenedor en lugar de instalaciones locales
    - Estás validando el flujo de Docker
summary: Configuración e incorporación opcionales basadas en Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-26T11:31:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker es **opcional**. Úsalo solo si quieres un Gateway en contenedor o validar el flujo de Docker.

## ¿Docker es adecuado para mí?

- **Sí**: quieres un entorno de Gateway aislado y desechable o ejecutar OpenClaw en un host sin instalaciones locales.
- **No**: lo estás ejecutando en tu propia máquina y solo quieres el ciclo de desarrollo más rápido. Usa el flujo de instalación normal en su lugar.
- **Nota sobre sandboxing**: el backend predeterminado de sandbox usa Docker cuando el sandboxing está habilitado, pero el sandboxing está desactivado de forma predeterminada y **no** requiere que todo el gateway se ejecute en Docker. También hay disponibles backends de sandbox SSH y OpenShell. Consulta [Sandboxing](/es/gateway/sandboxing).

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para compilar la imagen (`pnpm install` puede ser finalizado por OOM en hosts de 1 GB con salida 137)
- Espacio suficiente en disco para imágenes y registros
- Si se ejecuta en un VPS/host público, revisa
  [Refuerzo de seguridad para exposición de red](/es/gateway/security),
  especialmente la política de firewall Docker `DOCKER-USER`.

## Gateway en contenedor

<Steps>
  <Step title="Compila la imagen">
    Desde la raíz del repositorio, ejecuta el script de configuración:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Esto compila la imagen del gateway localmente. Para usar una imagen precompilada en su lugar:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Las imágenes precompiladas se publican en el
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Etiquetas comunes: `main`, `latest`, `<version>` (por ejemplo `2026.2.26`).

  </Step>

  <Step title="Completa la incorporación">
    El script de configuración ejecuta la incorporación automáticamente. Hará lo siguiente:

    - solicitar claves de API de proveedores
    - generar un token de gateway y escribirlo en `.env`
    - iniciar el gateway mediante Docker Compose

    Durante la configuración, la incorporación previa al inicio y las escrituras de configuración se ejecutan mediante
    `openclaw-gateway` directamente. `openclaw-cli` es para comandos que ejecutas después
    de que el contenedor del gateway ya exista.

  </Step>

  <Step title="Abre la UI de Control">
    Abre `http://127.0.0.1:18789/` en tu navegador y pega el
    secreto compartido configurado en Settings. El script de configuración escribe un token en `.env` de forma
    predeterminada; si cambias la configuración del contenedor a autenticación por contraseña, usa esa
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
Como `openclaw-cli` comparte el namespace de red de `openclaw-gateway`, es una
herramienta posterior al inicio. Antes de `docker compose up -d openclaw-gateway`, ejecuta la incorporación
y las escrituras de configuración de tiempo de configuración mediante `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variables de entorno

El script de configuración acepta estas variables de entorno opcionales:

| Variable                                   | Propósito                                                       |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usar una imagen remota en lugar de compilar localmente          |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instalar paquetes apt adicionales durante la compilación (nombres separados por espacios) |
| `OPENCLAW_EXTENSIONS`                      | Preinstalar dependencias de Plugins en tiempo de compilación (nombres separados por espacios) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mounts adicionales del host (separados por comas `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Persistir `/home/node` en un volumen Docker con nombre          |
| `OPENCLAW_SANDBOX`                         | Activar bootstrap de sandbox (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_DOCKER_SOCKET`                   | Sobrescribir la ruta del socket de Docker                       |
| `OPENCLAW_DISABLE_BONJOUR`                 | Deshabilitar la publicación Bonjour/mDNS (predeterminado `1` para Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Deshabilitar overlays de bind-mount de código fuente de Plugins incluidos |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint compartido del colector OTLP/HTTP para exportación OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos por señal para trazas, métricas o registros |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Sobrescritura del protocolo OTLP. Actualmente solo se admite `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nombre del servicio usado para recursos de OpenTelemetry        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Activa los atributos semánticos experimentales más recientes de GenAI |
| `OPENCLAW_OTEL_PRELOADED`                  | Omitir iniciar un segundo SDK de OpenTelemetry cuando ya hay uno precargado |

Los maintainers pueden probar el código fuente de Plugins incluidos contra una imagen empaquetada montando
un directorio de código fuente de un Plugin sobre su ruta empaquetada de código fuente, por ejemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ese directorio fuente montado sobrescribe el paquete compilado correspondiente
`/app/dist/extensions/synology-chat` para el mismo id de Plugin.

### Observabilidad

La exportación de OpenTelemetry es saliente desde el contenedor del Gateway hacia tu colector OTLP.
No requiere un puerto Docker publicado. Si compilas la imagen
localmente y quieres que el exportador OpenTelemetry incluido esté disponible dentro de la imagen,
incluye sus dependencias de runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

La imagen oficial Docker release de OpenClaw incluye el código fuente del Plugin incluido
`diagnostics-otel`. Dependiendo de la imagen y del estado de la caché, el
Gateway puede seguir preparando dependencias locales de runtime de OpenTelemetry del Plugin la
primera vez que se habilita el Plugin, así que permite que ese primer arranque alcance el registro de paquetes
o precalienta la imagen en tu release lane. Para habilitar la exportación, permite y
habilita el Plugin `diagnostics-otel` en la configuración, y luego establece
`diagnostics.otel.enabled=true` o usa el ejemplo de configuración de
[Exportación de OpenTelemetry](/es/gateway/opentelemetry). Los encabezados de autenticación del colector se
configuran mediante `diagnostics.otel.headers`, no mediante variables de entorno de Docker.

Las métricas de Prometheus usan el puerto del Gateway ya publicado. Habilita el
Plugin `diagnostics-prometheus` y luego haz scraping de:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La ruta está protegida por la autenticación del Gateway. No expongas un puerto público `/metrics`
separado ni una ruta de proxy inverso sin autenticación. Consulta
[Métricas de Prometheus](/es/gateway/prometheus).

### Comprobaciones de estado

Endpoints de sonda del contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # actividad
curl -fsS http://127.0.0.1:18789/readyz     # disponibilidad
```

La imagen Docker incluye un `HEALTHCHECK` integrado que consulta `/healthz`.
Si las comprobaciones siguen fallando, Docker marca el contenedor como `unhealthy` y
los sistemas de orquestación pueden reiniciarlo o reemplazarlo.

Instantánea profunda de estado autenticada:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a loopback

`scripts/docker/setup.sh` usa por defecto `OPENCLAW_GATEWAY_BIND=lan` para que el acceso desde el host a
`http://127.0.0.1:18789` funcione con la publicación de puertos de Docker.

- `lan` (predeterminado): el navegador del host y la CLI del host pueden alcanzar el puerto publicado del gateway.
- `loopback`: solo los procesos dentro del namespace de red del contenedor pueden alcanzar
  el gateway directamente.

<Note>
Usa valores de modo de enlace en `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), no alias de host como `0.0.0.0` o `127.0.0.1`.
</Note>

### Bonjour / mDNS

Las redes bridge de Docker normalmente no reenvían multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma fiable. Por eso la configuración Compose incluida usa por defecto
`OPENCLAW_DISABLE_BONJOUR=1` para que el Gateway no entre en bucle de fallos ni reinicie
repetidamente la publicación cuando el bridge descarta tráfico multicast.

Usa la URL publicada del Gateway, Tailscale o DNS-SD de área amplia para hosts Docker.
Establece `OPENCLAW_DISABLE_BONJOUR=0` solo cuando se ejecute con host networking, macvlan
u otra red donde se sepa que el multicast mDNS funciona.

Para consideraciones y solución de problemas, consulta [Descubrimiento Bonjour](/es/gateway/bonjour).

### Almacenamiento y persistencia

Docker Compose monta mediante bind `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw` y
`OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace`, por lo que esas rutas
sobreviven al reemplazo del contenedor.

Ese directorio de configuración montado es donde OpenClaw mantiene:

- `openclaw.json` para la configuración de comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para autenticación almacenada de proveedores OAuth/clave API
- `.env` para secretos de runtime respaldados por entorno como `OPENCLAW_GATEWAY_TOKEN`

Para más detalles sobre persistencia en despliegues de VM, consulta
[Docker VM Runtime - Qué persiste y dónde](/es/install/docker-vm-runtime#what-persists-where).

**Puntos críticos de crecimiento de disco:** vigila `media/`, archivos JSONL de sesiones, `cron/runs/*.jsonl`,
y archivos de registro rotativos bajo `/tmp/openclaw/`.

### Ayudantes de shell (opcional)

Para una gestión diaria más sencilla de Docker, instala `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si instalaste ClawDock desde la antigua ruta raw `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a ejecutar el comando de instalación anterior para que tu archivo ayudante local siga la nueva ubicación.

Después usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Ejecuta
`clawdock-help` para ver todos los comandos.
Consulta [ClawDock](/es/install/clawdock) para la guía completa del ayudante.

<AccordionGroup>
  <Accordion title="Habilitar sandbox del agente para el gateway Docker">
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

    El script monta `docker.sock` solo después de que los requisitos previos del sandbox se cumplan. Si
    la configuración del sandbox no puede completarse, el script restablece `agents.defaults.sandbox.mode`
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
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los
    comandos de CLI puedan alcanzar el gateway a través de `127.0.0.1`. Trátalo como un
    límite de confianza compartido. La configuración de Compose elimina `NET_RAW`/`NET_ADMIN` y habilita
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

  <Accordion title="Opciones avanzadas del contenedor">
    La imagen predeterminada prioriza la seguridad y se ejecuta como `node` sin privilegios de root. Para un
    contenedor con más funciones:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incorporar dependencias del sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores de Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistir descargas del navegador**: establece
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` y usa
       `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sin interfaz)">
    Si eliges OpenAI Codex OAuth en el asistente, se abre una URL en el navegador. En
    Docker o configuraciones sin interfaz, copia la URL completa de redirección a la que llegas y pégala
    de nuevo en el asistente para completar la autenticación.
  </Accordion>

  <Accordion title="Metadatos de la imagen base">
    La imagen Docker principal usa `node:24-bookworm` y publica anotaciones OCI de la imagen base
    incluyendo `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` y otras. Consulta
    [Anotaciones de imagen OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Ejecutándolo en un VPS?

Consulta [Hetzner (Docker VPS)](/es/install/hetzner) y
[Docker VM Runtime](/es/install/docker-vm-runtime) para ver pasos de despliegue en VM compartida
incluyendo incorporación de binarios, persistencia y actualizaciones.

## Agent Sandbox

Cuando `agents.defaults.sandbox` está habilitado con el backend Docker, el gateway
ejecuta la ejecución de herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores Docker
aislados mientras el propio gateway permanece en el host. Esto te da una barrera fuerte
alrededor de sesiones de agente no confiables o multiinquilino sin tener que poner en contenedor todo el
gateway.

El ámbito del sandbox puede ser por agente (predeterminado), por sesión o compartido. Cada ámbito
tiene su propio espacio de trabajo montado en `/workspace`. También puedes configurar
políticas de herramientas de permitir/denegar, aislamiento de red, límites de recursos y
contenedores de navegador.

Para la configuración completa, imágenes, notas de seguridad y perfiles multiagente, consulta:

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa del sandbox
- [OpenShell](/es/gateway/openshell) -- acceso interactivo al shell de contenedores sandbox
- [Multi-Agent Sandbox and Tools](/es/tools/multi-agent-sandbox-tools) -- sobrescrituras por agente

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

Compila la imagen sandbox predeterminada:

```bash
scripts/sandbox-setup.sh
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor sandbox no se inicia">
    Compila la imagen sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    o establece `agents.defaults.sandbox.docker.image` en tu imagen personalizada.
    Los contenedores se crean automáticamente por sesión cuando se necesitan.
  </Accordion>

  <Accordion title="Errores de permisos en el sandbox">
    Establece `docker.user` en un UID:GID que coincida con la propiedad de tu espacio de trabajo montado,
    o haz `chown` a la carpeta del espacio de trabajo.
  </Accordion>

  <Accordion title="Herramientas personalizadas no encontradas en el sandbox">
    OpenClaw ejecuta comandos con `sh -lc` (login shell), que carga
    `/etc/profile` y puede restablecer PATH. Establece `docker.env.PATH` para anteponer tus
    rutas de herramientas personalizadas, o añade un script bajo `/etc/profile.d/` en tu Dockerfile.
  </Accordion>

  <Accordion title="Finalizado por OOM durante la compilación de la imagen (exit 137)">
    La VM necesita al menos 2 GB de RAM. Usa una clase de máquina mayor y vuelve a intentarlo.
  </Accordion>

  <Accordion title="Unauthorized o pairing required en la UI de Control">
    Obtén un enlace nuevo del dashboard y aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más detalles: [Dashboard](/es/web/dashboard), [Devices](/es/cli/devices).

  </Accordion>

  <Accordion title="El destino del gateway muestra ws://172.x.x.x o errores de emparejamiento desde la CLI de Docker">
    Restablece el modo y el bind del gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general de la instalación](/es/install) — todos los métodos de instalación
- [Podman](/es/install/podman) — alternativa con Podman a Docker
- [ClawDock](/es/install/clawdock) — configuración comunitaria de Docker Compose
- [Actualización](/es/install/updating) — cómo mantener OpenClaw actualizado
- [Configuración](/es/gateway/configuration) — configuración del gateway después de la instalación
