---
read_when:
    - Quieres que OpenClaw se ejecute 24/7 en un VPS en la nube (no en tu portátil)
    - Quieres un Gateway siempre activo y apto para producción en tu propio VPS
    - Quieres control total sobre la persistencia, los binarios y el comportamiento de reinicio
    - Estás ejecutando OpenClaw en Docker en Hetzner o un proveedor similar
summary: Ejecuta OpenClaw Gateway 24/7 en un VPS barato de Hetzner (Docker) con estado duradero y binarios integrados
title: Hetzner
x-i18n:
    generated_at: "2026-07-05T11:26:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Ejecuta un Gateway persistente de OpenClaw en un VPS de Hetzner usando Docker, con estado duradero, binarios integrados y comportamiento de reinicio seguro.

Los precios de Hetzner cambian; elige el VPS Debian/Ubuntu más pequeño que encaje y escala si encuentras OOM.

Se puede acceder al Gateway mediante reenvío de puertos SSH desde tu portátil, o mediante exposición directa del puerto si gestionas tú mismo el firewall y los tokens.

Recordatorio del modelo de seguridad:

- Los agentes compartidos por la empresa están bien cuando todos están dentro del mismo límite de confianza y el entorno de ejecución es solo empresarial.
- Mantén una separación estricta: VPS/entorno de ejecución dedicado + cuentas dedicadas; sin perfiles personales de Apple/Google/navegador/gestor de contraseñas en ese host.
- Si los usuarios son adversarios entre sí, sepáralos por gateway/host/usuario del SO.

Consulta [Seguridad](/es/gateway/security) y [Alojamiento en VPS](/es/vps).

Esta guía asume Ubuntu o Debian en Hetzner. En otro VPS Linux, asigna los paquetes según corresponda. Para el flujo genérico de Docker, consulta [Docker](/es/install/docker).

## Qué necesitas

- VPS de Hetzner con acceso root
- Acceso SSH desde tu portátil
- Docker y Docker Compose
- Credenciales de autenticación del modelo
- Credenciales opcionales de proveedores (QR de WhatsApp, token de bot de Telegram, OAuth de Gmail)
- ~20 minutos

## Ruta rápida

1. Aprovisionar el VPS de Hetzner
2. Instalar Docker
3. Clonar el repositorio de OpenClaw
4. Crear directorios persistentes en el host
5. Configurar `.env` y `docker-compose.yml`
6. Integrar los binarios requeridos en la imagen
7. `docker compose up -d`
8. Verificar la persistencia y el acceso al Gateway

<Steps>
  <Step title="Aprovisionar el VPS">
    Crea un VPS Ubuntu o Debian en Hetzner y luego conéctate como root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Trata el VPS como infraestructura con estado, no desechable.

  </Step>

  <Step title="Instalar Docker (en el VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Verifica:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clonar el repositorio de OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Esta guía compila una imagen personalizada para que cualquier binario que integres sobreviva a los reinicios.

  </Step>

  <Step title="Crear directorios persistentes en el host">
    Los contenedores Docker son efímeros; todo el estado de larga duración debe vivir en el host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configurar variables de entorno">
    Crea `.env` en la raíz del repositorio:

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Define `OPENCLAW_GATEWAY_TOKEN` para gestionar el token estable del gateway mediante
    `.env`; de lo contrario, configura `gateway.auth.token` antes de depender de clientes
    entre reinicios. Si no se define ninguno, OpenClaw usa un token solo de entorno de ejecución
    para ese arranque. Genera una contraseña de llavero para `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **No confirmes este archivo en Git.** Contiene variables de entorno del contenedor/entorno de ejecución como
    `OPENCLAW_GATEWAY_TOKEN`. La autenticación OAuth/clave de API almacenada del proveedor vive en el
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` montado.

  </Step>

  <Step title="Configuración de Docker Compose">
    Crea o actualiza `docker-compose.yml`:

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` es solo para facilitar el arranque inicial, no un sustituto de una configuración real del gateway. Aun así, define autenticación (`gateway.auth.token` o contraseña) y un modo de enlace seguro para tu despliegue.

  </Step>

  <Step title="Pasos compartidos del entorno de ejecución de VM Docker">
    Sigue la guía compartida del entorno de ejecución para el flujo común de host Docker:

    - [Integrar los binarios requeridos en la imagen](/es/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compilar y lanzar](/es/install/docker-vm-runtime#build-and-launch)
    - [Qué persiste dónde](/es/install/docker-vm-runtime#what-persists-where)
    - [Actualizaciones](/es/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acceso específico de Hetzner">
    Después de los pasos compartidos de compilación y lanzamiento, abre el túnel.

    **Requisito previo:** asegúrate de que la configuración de sshd de tu VPS permita el reenvío TCP. Si
    endureciste tu configuración SSH, revisa `/etc/ssh/sshd_config` y define:

    ```text
    AllowTcpForwarding local
    ```

    `local` permite reenvíos locales `ssh -L` desde tu portátil mientras bloquea
    reenvíos remotos desde el servidor. Establecerlo en `no` hace que el túnel falle con:
    `channel 3: open failed: administratively prohibited: open failed`

    Tras confirmar que el reenvío TCP está habilitado, reinicia el servicio SSH
    (`systemctl restart ssh`) y ejecuta el túnel desde tu portátil:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abre `http://127.0.0.1:18789/` y pega el secreto compartido configurado.
    Esta guía usa el token del gateway de forma predeterminada; usa tu contraseña configurada
    en su lugar si cambiaste a autenticación por contraseña.

  </Step>
</Steps>

El mapa de persistencia compartido está en [Entorno de ejecución de VM Docker](/es/install/docker-vm-runtime#what-persists-where).

## Infraestructura como código (Terraform)

Para equipos que prefieren flujos de trabajo de infraestructura como código, una configuración de Terraform mantenida por la comunidad proporciona:

- Configuración modular de Terraform con gestión remota de estado
- Aprovisionamiento automatizado mediante cloud-init
- Scripts de despliegue (arranque inicial, despliegue, copia de seguridad/restauración)
- Endurecimiento de seguridad (firewall, UFW, acceso solo por SSH)
- Configuración de túnel SSH para el acceso al gateway

**Repositorios:**

- Infraestructura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuración de Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Este enfoque complementa la configuración de Docker anterior con despliegues reproducibles, infraestructura versionada y recuperación automatizada ante desastres.

<Note>
Mantenido por la comunidad. Para problemas o contribuciones, consulta los enlaces de repositorio anteriores.
</Note>

## Próximos pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)

## Relacionado

- [Resumen de instalación](/es/install)
- [Fly.io](/es/install/fly)
- [Docker](/es/install/docker)
- [Alojamiento en VPS](/es/vps)
