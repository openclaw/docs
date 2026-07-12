---
read_when:
    - Quieres que OpenClaw funcione las 24 horas del día, los 7 días de la semana, en un VPS en la nube (no en tu portátil)
    - Quieres un Gateway de nivel de producción y siempre activo en tu propio VPS
    - Quieres tener control total sobre la persistencia, los binarios y el comportamiento de reinicio.
    - Estás ejecutando OpenClaw en Docker en Hetzner o un proveedor similar
summary: Ejecuta OpenClaw Gateway las 24 horas del día, los 7 días de la semana, en un VPS económico de Hetzner (Docker), con estado persistente y binarios integrados
title: Hetzner
x-i18n:
    generated_at: "2026-07-11T23:12:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Ejecuta un Gateway persistente de OpenClaw en un VPS de Hetzner mediante Docker, con estado duradero, binarios integrados y un comportamiento de reinicio seguro.

Los precios de Hetzner cambian; elige el VPS Debian/Ubuntu más pequeño que cumpla tus necesidades y amplíalo si se producen errores por falta de memoria (OOM).

Puedes acceder al Gateway mediante el reenvío de puertos SSH desde tu portátil o mediante la exposición directa del puerto si gestionas por tu cuenta el cortafuegos y los tokens.

Recordatorio del modelo de seguridad:

- Los agentes compartidos en una empresa son adecuados cuando todos se encuentran dentro del mismo límite de confianza y el entorno de ejecución se utiliza exclusivamente para fines empresariales.
- Mantén una separación estricta: VPS y entorno de ejecución dedicados, además de cuentas dedicadas; no uses perfiles personales de Apple, Google, navegadores ni gestores de contraseñas en ese host.
- Si los usuarios pueden actuar de forma hostil entre sí, sepáralos por Gateway, host o usuario del sistema operativo.

Consulta [Seguridad](/es/gateway/security) y [Alojamiento en VPS](/es/vps).

Esta guía presupone que se utiliza Ubuntu o Debian en Hetzner. En otro VPS Linux, adapta los paquetes según corresponda. Para conocer el flujo genérico de Docker, consulta [Docker](/es/install/docker).

## Qué necesitas

- Un VPS de Hetzner con acceso root
- Acceso SSH desde tu portátil
- Docker y Docker Compose
- Credenciales de autenticación del modelo
- Credenciales opcionales de proveedores (código QR de WhatsApp, token de bot de Telegram, OAuth de Gmail)
- Unos 20 minutos

## Procedimiento rápido

1. Aprovisionar el VPS de Hetzner
2. Instalar Docker
3. Clonar el repositorio de OpenClaw
4. Crear directorios persistentes en el host
5. Configurar `.env` y `docker-compose.yml`
6. Integrar los binarios necesarios en la imagen
7. Ejecutar `docker compose up -d`
8. Verificar la persistencia y el acceso al Gateway

<Steps>
  <Step title="Aprovisionar el VPS">
    Crea un VPS con Ubuntu o Debian en Hetzner y, a continuación, conéctate como root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Trata el VPS como infraestructura con estado, no como infraestructura desechable.

  </Step>

  <Step title="Instalar Docker (en el VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Verifica la instalación:

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

    Esta guía crea una imagen personalizada para que los binarios integrados se conserven después de los reinicios.

  </Step>

  <Step title="Crear directorios persistentes en el host">
    Los contenedores Docker son efímeros; todo el estado de larga duración debe residir en el host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Establece como propietario al usuario del contenedor (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configurar las variables de entorno">
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

    Define `OPENCLAW_GATEWAY_TOKEN` para administrar el token estable del Gateway mediante
    `.env`; de lo contrario, configura `gateway.auth.token` antes de depender de clientes
    tras los reinicios. Si no se define ninguno de los dos, OpenClaw utiliza un token
    exclusivo del entorno de ejecución para ese inicio. Genera una contraseña para el llavero en `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **No confirmes este archivo en el repositorio.** Contiene variables de entorno del contenedor y del entorno de ejecución, como
    `OPENCLAW_GATEWAY_TOKEN`. La autenticación almacenada mediante OAuth o claves de API de los proveedores reside en
    el archivo montado `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

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
          # Recomendado: mantén el Gateway limitado a la interfaz de bucle invertido en el VPS y accede mediante un túnel SSH.
          # Para exponerlo públicamente, elimina el prefijo `127.0.0.1:` y configura el cortafuegos según corresponda.
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

    `--allow-unconfigured` solo facilita la inicialización; no sustituye una configuración real del Gateway. Configura de todos modos la autenticación (`gateway.auth.token` o una contraseña) y un modo de enlace seguro para tu despliegue.

  </Step>

  <Step title="Pasos compartidos del entorno de ejecución de la máquina virtual Docker">
    Sigue la guía compartida del entorno de ejecución para el flujo habitual en un host Docker:

    - [Integrar los binarios necesarios en la imagen](/es/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compilar e iniciar](/es/install/docker-vm-runtime#build-and-launch)
    - [Qué se conserva y dónde](/es/install/docker-vm-runtime#what-persists-where)
    - [Actualizaciones](/es/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acceso específico de Hetzner">
    Después de completar los pasos compartidos de compilación e inicio, abre el túnel.

    **Requisito previo:** asegúrate de que la configuración de sshd del VPS permita el reenvío TCP. Si
    has reforzado la configuración de SSH, revisa `/etc/ssh/sshd_config` y establece:

    ```text
    AllowTcpForwarding local
    ```

    `local` permite los reenvíos locales `ssh -L` desde tu portátil, a la vez que bloquea
    los reenvíos remotos desde el servidor. Si se establece en `no`, el túnel falla con:
    `channel 3: open failed: administratively prohibited: open failed`

    Después de confirmar que el reenvío TCP está habilitado, reinicia el servicio SSH
    (`systemctl restart ssh`) y ejecuta el túnel desde tu portátil:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abre `http://127.0.0.1:18789/` y pega el secreto compartido configurado.
    Esta guía utiliza de forma predeterminada el token del Gateway; si has cambiado a la autenticación
    mediante contraseña, utiliza en su lugar la contraseña configurada.

  </Step>
</Steps>

El mapa compartido de persistencia se encuentra en [Entorno de ejecución de máquina virtual Docker](/es/install/docker-vm-runtime#what-persists-where).

## Infraestructura como código (Terraform)

Para los equipos que prefieren flujos de trabajo de infraestructura como código, una configuración de Terraform mantenida por la comunidad proporciona:

- Configuración modular de Terraform con gestión remota del estado
- Aprovisionamiento automatizado mediante cloud-init
- Scripts de despliegue (inicialización, despliegue, copia de seguridad y restauración)
- Refuerzo de la seguridad (cortafuegos, UFW y acceso exclusivo mediante SSH)
- Configuración de un túnel SSH para acceder al Gateway

**Repositorios:**

- Infraestructura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuración de Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Este enfoque complementa la configuración de Docker anterior con despliegues reproducibles, infraestructura controlada por versiones y recuperación automatizada ante desastres.

<Note>
Mantenido por la comunidad. Para informar de problemas o realizar contribuciones, consulta los enlaces de los repositorios anteriores.
</Note>

## Pasos siguientes

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Fly.io](/es/install/fly)
- [Docker](/es/install/docker)
- [Alojamiento en VPS](/es/vps)
