---
read_when:
    - Quieres que OpenClaw se ejecute 24/7 en un VPS en la nube (no en tu portátil)
    - Quieres un Gateway siempre activo y listo para producción en tu propio VPS
    - Quieres control total sobre persistencia, binarios y comportamiento de reinicio
    - Estás ejecutando OpenClaw en Docker en Hetzner o un proveedor similar
summary: Ejecuta OpenClaw Gateway 24/7 en un VPS barato de Hetzner (Docker) con estado persistente y binarios integrados
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T05:34:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw en Hetzner (Docker, guía de producción en VPS)

## Objetivo

Ejecutar un Gateway persistente de OpenClaw en un VPS de Hetzner usando Docker, con estado persistente, binarios integrados y un comportamiento de reinicio seguro.

Si quieres «OpenClaw 24/7 por ~$5», esta es la configuración fiable más simple.
Los precios de Hetzner cambian; elige el VPS Debian/Ubuntu más pequeño y amplíalo si empiezas a tener OOM.

Recordatorio del modelo de seguridad:

- Los agentes compartidos de empresa están bien cuando todos están dentro del mismo límite de confianza y el runtime es solo para uso empresarial.
- Mantén una separación estricta: VPS/runtime dedicados + cuentas dedicadas; sin perfiles personales de Apple/Google/navegador/gestor de contraseñas en ese host.
- Si los usuarios son adversariales entre sí, sepáralos por Gateway/host/usuario del SO.

Consulta [Seguridad](/es/gateway/security) y [Alojamiento en VPS](/es/vps).

## Qué estamos haciendo (en términos simples)

- Alquilar un pequeño servidor Linux (VPS de Hetzner)
- Instalar Docker (runtime aislado para la app)
- Iniciar el Gateway de OpenClaw en Docker
- Conservar `~/.openclaw` + `~/.openclaw/workspace` en el host (sobrevive a reinicios/reconstrucciones)
- Acceder a la Control UI desde tu portátil mediante un túnel SSH

Ese estado montado en `~/.openclaw` incluye `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` por agente y `.env`.

Se puede acceder al Gateway mediante:

- Reenvío de puertos SSH desde tu portátil
- Exposición directa del puerto si tú mismo gestionas el firewall y los tokens

Esta guía asume Ubuntu o Debian en Hetzner.  
Si estás en otro VPS Linux, adapta los paquetes según corresponda.
Para el flujo Docker genérico, consulta [Docker](/es/install/docker).

---

## Ruta rápida (operadores experimentados)

1. Aprovisionar el VPS de Hetzner
2. Instalar Docker
3. Clonar el repositorio de OpenClaw
4. Crear directorios persistentes en el host
5. Configurar `.env` y `docker-compose.yml`
6. Integrar los binarios necesarios en la imagen
7. `docker compose up -d`
8. Verificar persistencia y acceso al Gateway

---

## Qué necesitas

- VPS de Hetzner con acceso root
- Acceso SSH desde tu portátil
- Comodidad básica con SSH + copiar/pegar
- ~20 minutos
- Docker y Docker Compose
- Credenciales de autenticación del modelo
- Credenciales opcionales de proveedor
  - QR de WhatsApp
  - Token de bot de Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Aprovisionar el VPS">
    Crea un VPS Ubuntu o Debian en Hetzner.

    Conéctate como root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Esta guía asume que el VPS tiene estado.
    No lo trates como infraestructura desechable.

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

    Esta guía asume que vas a construir una imagen personalizada para garantizar la persistencia de binarios.

  </Step>

  <Step title="Crear directorios persistentes en el host">
    Los contenedores Docker son efímeros.
    Todo el estado de larga duración debe vivir en el host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configurar variables de entorno">
    Crea `.env` en la raíz del repositorio.

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

    Deja `OPENCLAW_GATEWAY_TOKEN` vacío a menos que quieras explícitamente
    gestionarlo mediante `.env`; OpenClaw escribe un token aleatorio del Gateway en la
    configuración en el primer arranque. Genera una contraseña para el keyring y pégala en
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **No confirmes este archivo en git.**

    Este archivo `.env` es para env del contenedor/runtime como `OPENCLAW_GATEWAY_TOKEN`.
    La autenticación almacenada de proveedores con OAuth/clave API vive en el
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` montado.

  </Step>

  <Step title="Configuración de Docker Compose">
    Crea o actualiza `docker-compose.yml`.

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

    `--allow-unconfigured` es solo por comodidad durante el bootstrap; no reemplaza una configuración correcta del gateway. Aun así, configura autenticación (`gateway.auth.token` o contraseña) y usa ajustes de bind seguros para tu despliegue.

  </Step>

  <Step title="Pasos compartidos del runtime Docker VM">
    Usa la guía compartida de runtime para el flujo común del host Docker:

    - [Integrar los binarios necesarios en la imagen](/es/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Construir y lanzar](/es/install/docker-vm-runtime#build-and-launch)
    - [Qué persiste y dónde](/es/install/docker-vm-runtime#what-persists-where)
    - [Actualizaciones](/es/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acceso específico de Hetzner">
    Después de los pasos compartidos de construcción y lanzamiento, crea un túnel desde tu portátil:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abre:

    `http://127.0.0.1:18789/`

    Pega el secreto compartido configurado. Esta guía usa el token del Gateway por
    defecto; si cambiaste a autenticación por contraseña, usa esa contraseña.

  </Step>
</Steps>

El mapa compartido de persistencia está en [Docker VM Runtime](/es/install/docker-vm-runtime#what-persists-where).

## Infraestructura como código (Terraform)

Para equipos que prefieren flujos de trabajo de infraestructura como código, una configuración Terraform mantenida por la comunidad proporciona:

- Configuración modular de Terraform con gestión de estado remoto
- Aprovisionamiento automatizado mediante cloud-init
- Scripts de despliegue (bootstrap, deploy, backup/restore)
- Endurecimiento de seguridad (firewall, UFW, acceso solo por SSH)
- Configuración de túnel SSH para acceso al Gateway

**Repositorios:**

- Infraestructura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuración Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Este enfoque complementa la configuración de Docker anterior con despliegues reproducibles, infraestructura versionada y recuperación automatizada ante desastres.

> **Nota:** Mantenido por la comunidad. Para incidencias o contribuciones, consulta los enlaces de los repositorios anteriores.

## Siguientes pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Updating](/es/install/updating)

## Relacionado

- [Resumen de instalación](/es/install)
- [Fly.io](/es/install/fly)
- [Docker](/es/install/docker)
- [Alojamiento en VPS](/es/vps)
