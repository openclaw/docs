---
read_when:
    - Quieres OpenClaw ejecutándose 24/7 en un VPS en la nube (no en tu laptop)
    - Quieres un Gateway de nivel de producción, siempre activo, en tu propio VPS
    - Quieres control total sobre la persistencia, los binarios y el comportamiento de reinicio
    - Estás ejecutando OpenClaw en Docker en Hetzner o un proveedor similar
summary: Ejecuta OpenClaw Gateway 24/7 en un VPS barato de Hetzner (Docker) con estado persistente y binarios integrados
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw en Hetzner (Docker, guía de VPS de producción)

## Objetivo

Ejecutar un Gateway de OpenClaw persistente en un VPS de Hetzner usando Docker, con estado duradero, binarios integrados y un comportamiento de reinicio seguro.

Si quieres “OpenClaw 24/7 por ~$5”, esta es la configuración confiable más simple.
Los precios de Hetzner cambian; elige el VPS más pequeño con Debian/Ubuntu y amplía si te encuentras con OOMs.

Recordatorio del modelo de seguridad:

- Los agentes compartidos por la empresa están bien cuando todos están dentro del mismo límite de confianza y el runtime es solo para uso empresarial.
- Mantén una separación estricta: VPS/runtime dedicado + cuentas dedicadas; sin perfiles personales de Apple/Google/navegador/gestor de contraseñas en ese host.
- Si los usuarios son adversariales entre sí, sepáralos por gateway/host/usuario del SO.

Consulta [Security](/es/gateway/security) y [VPS hosting](/es/vps).

## ¿Qué estamos haciendo (en términos simples)?

- Alquilar un pequeño servidor Linux (VPS de Hetzner)
- Instalar Docker (runtime de aplicación aislado)
- Iniciar el Gateway de OpenClaw en Docker
- Persistir `~/.openclaw` + `~/.openclaw/workspace` en el host (sobrevive a reinicios/reconstrucciones)
- Acceder a la UI de control desde tu laptop mediante un túnel SSH

Ese estado montado de `~/.openclaw` incluye `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` por agente y `.env`.

Se puede acceder al Gateway mediante:

- Reenvío de puertos SSH desde tu laptop
- Exposición directa del puerto si gestionas tú mismo el firewall y los tokens

Esta guía asume Ubuntu o Debian en Hetzner.  
Si estás en otro VPS Linux, adapta los paquetes según corresponda.
Para el flujo genérico de Docker, consulta [Docker](/es/install/docker).

---

## Ruta rápida (operadores con experiencia)

1. Aprovisionar un VPS de Hetzner
2. Instalar Docker
3. Clonar el repositorio de OpenClaw
4. Crear directorios persistentes en el host
5. Configurar `.env` y `docker-compose.yml`
6. Integrar los binarios necesarios en la imagen
7. `docker compose up -d`
8. Verificar la persistencia y el acceso al Gateway

---

## Lo que necesitas

- VPS de Hetzner con acceso root
- Acceso SSH desde tu laptop
- Comodidad básica con SSH + copiar/pegar
- ~20 minutos
- Docker y Docker Compose
- Credenciales de autenticación del modelo
- Credenciales de proveedor opcionales
  - QR de WhatsApp
  - Token de bot de Telegram
  - OAuth de Gmail

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

    Esta guía asume que construirás una imagen personalizada para garantizar la persistencia de los binarios.

  </Step>

  <Step title="Crear directorios persistentes en el host">
    Los contenedores Docker son efímeros.
    Todo el estado de larga duración debe vivir en el host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Establece la propiedad para el usuario del contenedor (uid 1000):
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

    Deja `OPENCLAW_GATEWAY_TOKEN` en blanco a menos que explícitamente quieras
    gestionarlo mediante `.env`; OpenClaw escribe un token aleatorio del gateway en
    la configuración en el primer arranque. Genera una contraseña de keyring y pégala en
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **No hagas commit de este archivo.**

    Este archivo `.env` es para el entorno del contenedor/runtime, como `OPENCLAW_GATEWAY_TOKEN`.
    La autenticación almacenada de OAuth/claves API de proveedores vive en el
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
          # Recomendado: mantén el Gateway solo en loopback en el VPS; accede mediante túnel SSH.
          # Para exponerlo públicamente, elimina el prefijo `127.0.0.1:` y configura el firewall en consecuencia.
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

    `--allow-unconfigured` es solo para comodidad durante el arranque inicial; no sustituye una configuración adecuada del gateway. Aun así, configura la autenticación (`gateway.auth.token` o contraseña) y usa ajustes de bind seguros para tu despliegue.

  </Step>

  <Step title="Pasos compartidos del runtime de Docker VM">
    Usa la guía de runtime compartido para el flujo común del host Docker:

    - [Integrar los binarios necesarios en la imagen](/es/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Construir e iniciar](/es/install/docker-vm-runtime#build-and-launch)
    - [Qué persiste y dónde](/es/install/docker-vm-runtime#what-persists-where)
    - [Actualizaciones](/es/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acceso específico de Hetzner">
    Después de los pasos compartidos de construcción e inicio, crea un túnel desde tu laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abre:

    `http://127.0.0.1:18789/`

    Pega el secreto compartido configurado. Esta guía usa el token del gateway de
    forma predeterminada; si cambiaste a autenticación por contraseña, usa esa contraseña en su lugar.

  </Step>
</Steps>

El mapa de persistencia compartido está en [Docker VM Runtime](/es/install/docker-vm-runtime#what-persists-where).

## Infraestructura como código (Terraform)

Para equipos que prefieren flujos de trabajo de infraestructura como código, una configuración de Terraform mantenida por la comunidad proporciona:

- Configuración modular de Terraform con gestión de estado remoto
- Aprovisionamiento automatizado mediante cloud-init
- Scripts de despliegue (bootstrap, deploy, backup/restore)
- Endurecimiento de seguridad (firewall, UFW, acceso solo por SSH)
- Configuración de túnel SSH para acceso al gateway

**Repositorios:**

- Infraestructura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuración de Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Este enfoque complementa la configuración de Docker anterior con despliegues reproducibles, infraestructura versionada y recuperación ante desastres automatizada.

> **Nota:** Mantenido por la comunidad. Para problemas o contribuciones, consulta los enlaces a los repositorios anteriores.

## Próximos pasos

- Configura los canales de mensajería: [Channels](/es/channels)
- Configura el Gateway: [Gateway configuration](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Updating](/es/install/updating)
