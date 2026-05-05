---
read_when:
    - Quieres un Gateway en contenedor en lugar de instalaciones locales
    - Estás validando el flujo de Docker
summary: Configuración e incorporación opcionales basadas en Docker para OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:25:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker es **opcional**. Úsalo solo si quieres un Gateway en contenedor o validar el flujo de Docker.

## ¿Docker es adecuado para mí?

- **Sí**: quieres un entorno de Gateway aislado y desechable, o ejecutar OpenClaw en un host sin instalaciones locales.
- **No**: estás ejecutándolo en tu propia máquina y solo quieres el ciclo de desarrollo más rápido. Usa en su lugar el flujo de instalación normal.
- **Nota sobre aislamiento**: el backend de aislamiento predeterminado usa Docker cuando el aislamiento está habilitado, pero el aislamiento está desactivado de forma predeterminada y **no** requiere que todo el Gateway se ejecute en Docker. También están disponibles los backends de aislamiento SSH y OpenShell. Consulta [Aislamiento](/es/gateway/sandboxing).

## Requisitos previos

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Al menos 2 GB de RAM para compilar la imagen (`pnpm install` puede ser terminado por OOM en hosts de 1 GB con salida 137)
- Espacio suficiente en disco para imágenes y registros
- Si se ejecuta en un VPS/host público, revisa
  [Endurecimiento de seguridad para exposición de red](/es/gateway/security),
  especialmente la política de firewall de Docker `DOCKER-USER`.

## Gateway en contenedor

<Steps>
  <Step title="Build the image">
    Desde la raíz del repositorio, ejecuta el script de configuración:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Esto compila la imagen del Gateway localmente. Para usar en su lugar una imagen precompilada:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Las imágenes precompiladas se publican en
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Etiquetas comunes: `main`, `latest`, `<version>` (por ejemplo, `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    El script de configuración ejecuta la incorporación automáticamente. Hará lo siguiente:

    - solicitar claves de API del proveedor
    - generar un token de Gateway y escribirlo en `.env`
    - iniciar el Gateway mediante Docker Compose

    Durante la configuración, la incorporación previa al inicio y las escrituras de configuración se ejecutan directamente mediante
    `openclaw-gateway`. `openclaw-cli` es para comandos que ejecutas después de que
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
y las escrituras de configuración de tiempo de instalación mediante `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variables de entorno

El script de configuración acepta estas variables de entorno opcionales:

| Variable                                   | Propósito                                                        |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usar una imagen remota en lugar de compilar localmente           |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instalar paquetes apt adicionales durante la compilación (separados por espacios) |
| `OPENCLAW_EXTENSIONS`                      | Incluir ayudantes de plugins integrados seleccionados en tiempo de compilación |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montajes bind de host adicionales (`source:target[:opts]` separados por comas) |
| `OPENCLAW_HOME_VOLUME`                     | Persistir `/home/node` en un volumen Docker con nombre           |
| `OPENCLAW_SANDBOX`                         | Optar por el arranque de aislamiento (`1`, `true`, `yes`, `on`)  |
| `OPENCLAW_SKIP_ONBOARDING`                 | Omitir el paso de incorporación interactiva (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Sobrescribir la ruta del socket de Docker                        |
| `OPENCLAW_DISABLE_BONJOUR`                 | Deshabilitar el anuncio Bonjour/mDNS (predeterminado en `1` para Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Deshabilitar superposiciones de montaje bind de código fuente de plugins integrados |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint compartido del colector OTLP/HTTP para exportación de OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoints OTLP específicos de señal para trazas, métricas o registros |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Sobrescritura del protocolo OTLP. Hoy solo se admite `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nombre de servicio usado para recursos de OpenTelemetry          |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Optar por los atributos semánticos experimentales más recientes de GenAI |
| `OPENCLAW_OTEL_PRELOADED`                  | Omitir el inicio de un segundo SDK de OpenTelemetry cuando ya hay uno precargado |

Los mantenedores pueden probar el código fuente de plugins integrados contra una imagen empaquetada montando
un directorio de código fuente de plugin sobre su ruta de código fuente empaquetada, por ejemplo
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ese directorio de código fuente montado sobrescribe el paquete compilado coincidente de
`/app/dist/extensions/synology-chat` para el mismo id de plugin.

### Observabilidad

La exportación de OpenTelemetry es saliente desde el contenedor del Gateway hacia tu colector
OTLP. No requiere un puerto Docker publicado. Si compilas la imagen
localmente y quieres que el exportador de OpenTelemetry integrado esté disponible dentro de la imagen,
incluye sus dependencias de runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instala el plugin oficial `@openclaw/diagnostics-otel` desde ClawHub en
instalaciones Docker empaquetadas antes de habilitar la exportación. Las imágenes personalizadas compiladas desde código fuente
todavía pueden incluir el código fuente local del plugin con
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Para habilitar la exportación, permite y habilita el
plugin `diagnostics-otel` en la configuración, luego establece
`diagnostics.otel.enabled=true` o usa el ejemplo de configuración en [Exportación de OpenTelemetry
](/es/gateway/opentelemetry). Los encabezados de autenticación del colector se configuran mediante
`diagnostics.otel.headers`, no mediante variables de entorno de Docker.

Las métricas de Prometheus usan el puerto del Gateway ya publicado. Instala
`clawhub:@openclaw/diagnostics-prometheus`, habilita el
plugin `diagnostics-prometheus` y luego recopila:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La ruta está protegida por autenticación del Gateway. No expongas un puerto público
`/metrics` separado ni una ruta de proxy inverso no autenticada. Consulta
[Métricas de Prometheus](/es/gateway/prometheus).

### Comprobaciones de estado

Endpoints de sondeo de contenedor (no requieren autenticación):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

La imagen Docker incluye un `HEALTHCHECK` incorporado que hace ping a `/healthz`.
Si las comprobaciones siguen fallando, Docker marca el contenedor como `unhealthy` y
los sistemas de orquestación pueden reiniciarlo o reemplazarlo.

Instantánea profunda de estado autenticada:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN frente a loopback

`scripts/docker/setup.sh` usa de forma predeterminada `OPENCLAW_GATEWAY_BIND=lan` para que el acceso del host a
`http://127.0.0.1:18789` funcione con la publicación de puertos de Docker.

- `lan` (predeterminado): el navegador del host y la CLI del host pueden alcanzar el puerto publicado del Gateway.
- `loopback`: solo los procesos dentro del espacio de nombres de red del contenedor pueden alcanzar
  directamente el Gateway.

<Note>
Usa valores de modo bind en `gateway.bind` (`lan` / `loopback` / `custom` /
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

La configuración Docker integrada usa esas URL de host como valores predeterminados de incorporación para LM Studio y Ollama,
y `docker-compose.yml` asigna `host.docker.internal` al
Gateway del host de Docker para Docker Engine en Linux. Docker Desktop ya proporciona
el mismo nombre de host en macOS y Windows.

Los servicios del host también deben escuchar en una dirección alcanzable desde Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Si usas tu propio archivo Compose o comando `docker run`, agrega tú mismo la misma
asignación de host, por ejemplo
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Las redes bridge de Docker normalmente no reenvían multicast Bonjour/mDNS
(`224.0.0.251:5353`) de forma fiable. Por eso, la configuración Compose integrada usa de forma predeterminada
`OPENCLAW_DISABLE_BONJOUR=1` para que el Gateway no entre en un bucle de fallos ni reinicie repetidamente
la publicidad cuando el bridge descarta el tráfico multicast.

Usa la URL publicada del Gateway, Tailscale o DNS-SD de área amplia para hosts Docker.
Establece `OPENCLAW_DISABLE_BONJOUR=0` solo cuando ejecutes con redes de host, macvlan
u otra red donde se sepa que el multicast mDNS funciona.

Para problemas frecuentes y solución de problemas, consulta [Descubrimiento Bonjour](/es/gateway/bonjour).

### Almacenamiento y persistencia

Docker Compose monta con bind `OPENCLAW_CONFIG_DIR` en `/home/node/.openclaw` y
`OPENCLAW_WORKSPACE_DIR` en `/home/node/.openclaw/workspace`, por lo que esas rutas
sobreviven al reemplazo del contenedor. Cuando cualquiera de las variables no está definida, el
`docker-compose.yml` integrado vuelve a `${HOME}/.openclaw` (y
`${HOME}/.openclaw/workspace` para el montaje del workspace), o `/tmp/.openclaw`
cuando `HOME` también falta. Eso evita que `docker compose up`
emita una especificación de volumen con origen vacío en entornos básicos.

Ese directorio de configuración montado es donde OpenClaw conserva:

- `openclaw.json` para la configuración de comportamiento
- `agents/<agentId>/agent/auth-profiles.json` para autenticación OAuth/API-key almacenada de proveedores
- `.env` para secretos de runtime respaldados por entorno, como `OPENCLAW_GATEWAY_TOKEN`

Los plugins descargables instalados almacenan su estado de paquete bajo el home de OpenClaw
montado, por lo que los registros de instalación de plugins y las raíces de paquetes sobreviven al reemplazo
del contenedor. El arranque del Gateway no genera árboles de dependencias de plugins integrados.

Para detalles completos de persistencia en despliegues de VM, consulta
[Runtime de VM Docker: qué persiste dónde](/es/install/docker-vm-runtime#what-persists-where).

**Puntos críticos de crecimiento del disco:** vigila `media/`, los archivos JSONL de sesión,
`cron/runs/*.jsonl`, las raíces de paquetes de plugins instalados y los registros de archivo rotativos
bajo `/tmp/openclaw/`.

### Ayudantes de shell (opcional)

Para una gestión diaria más sencilla de Docker, instala `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si instalaste ClawDock desde la ruta raw antigua `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a ejecutar el comando de instalación anterior para que tu archivo auxiliar local siga la nueva ubicación.

Luego usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Ejecuta
`clawdock-help` para ver todos los comandos.
Consulta [ClawDock](/es/install/clawdock) para ver la guía completa de ayudantes.

<AccordionGroup>
  <Accordion title="Habilitar el sandbox del agente para Docker gateway">
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

    El script monta `docker.sock` solo después de que pasen los requisitos previos del sandbox. Si
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
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` para que los comandos de la CLI
    puedan llegar al Gateway mediante `127.0.0.1`. Trata esto como un límite de confianza compartido.
    La configuración de compose elimina `NET_RAW`/`NET_ADMIN` y habilita
    `no-new-privileges` tanto en `openclaw-gateway` como en `openclaw-cli`.
  </Accordion>

  <Accordion title="Permisos y EACCES">
    La imagen se ejecuta como `node` (uid 1000). Si ves errores de permisos en
    `/home/node/.openclaw`, asegúrate de que los montajes bind del host pertenezcan al uid 1000:

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
    La imagen predeterminada prioriza la seguridad y se ejecuta como `node` sin root. Para un contenedor con más
    funciones:

    1. **Persistir `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incluir dependencias del sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instalar navegadores de Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistir descargas de navegadores**: establece
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` y usa
       `OPENCLAW_HOME_VOLUME` u `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker sin interfaz)">
    Si eliges OpenAI Codex OAuth en el asistente, se abre una URL del navegador. En
    Docker o configuraciones sin interfaz, copia la URL de redirección completa a la que llegues y pégala
    de vuelta en el asistente para finalizar la autenticación.
  </Accordion>

  <Accordion title="Metadatos de la imagen base">
    La imagen principal de runtime de Docker usa `node:24-bookworm-slim` y publica anotaciones OCI
    de imagen base, incluidas `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` y otras. El digest base de Node se
    actualiza mediante PRs de imagen base Docker de Dependabot; las compilaciones de lanzamiento no ejecutan
    una capa de actualización de la distribución. Consulta
    [anotaciones de imagen OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### ¿Ejecutándolo en un VPS?

Consulta [Hetzner (VPS Docker)](/es/install/hetzner) y
[Runtime de VM Docker](/es/install/docker-vm-runtime) para ver los pasos de despliegue en una VM compartida,
incluida la integración de binarios, persistencia y actualizaciones.

## Sandbox del agente

Cuando `agents.defaults.sandbox` está habilitado con el backend de Docker, el Gateway
ejecuta la ejecución de herramientas del agente (shell, lectura/escritura de archivos, etc.) dentro de contenedores Docker
aislados mientras el propio Gateway permanece en el host. Esto te da una barrera sólida
alrededor de sesiones de agente no confiables o multiinquilino sin contenerizar todo el
Gateway.

El alcance del sandbox puede ser por agente (predeterminado), por sesión o compartido. Cada alcance
obtiene su propio espacio de trabajo montado en `/workspace`. También puedes configurar
políticas de permitir/denegar herramientas, aislamiento de red, límites de recursos y contenedores
de navegador.

Para la configuración completa, imágenes, notas de seguridad y perfiles multiagente, consulta:

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa del sandbox
- [OpenShell](/es/gateway/openshell) -- acceso interactivo de shell a contenedores de sandbox
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente

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

Compila la imagen de sandbox predeterminada (desde un checkout del código fuente):

```bash
scripts/sandbox-setup.sh
```

Para instalaciones npm sin un checkout del código fuente, consulta [Sandboxing § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) para ver comandos `docker build` inline.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la imagen o el contenedor de sandbox no inicia">
    Compila la imagen de sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout del código fuente) o el comando `docker build` inline de [Sandboxing § Imágenes y configuración](/es/gateway/sandboxing#images-and-setup) (instalación npm),
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

  <Accordion title="Finalizado por OOM durante la compilación de imagen (salida 137)">
    La VM necesita al menos 2 GB de RAM. Usa una clase de máquina más grande y vuelve a intentarlo.
  </Accordion>

  <Accordion title="No autorizado o emparejamiento requerido en Control UI">
    Obtén un enlace de panel nuevo y aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Más detalles: [Panel](/es/web/dashboard), [Dispositivos](/es/cli/devices).

  </Accordion>

  <Accordion title="El destino del Gateway muestra ws://172.x.x.x o errores de emparejamiento desde la CLI de Docker">
    Restablece el modo y el bind del Gateway:

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
