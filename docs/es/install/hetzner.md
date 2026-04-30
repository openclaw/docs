---
read_when:
    - Quieres ejecutar OpenClaw 24/7 en un VPS en la nube (no en tu portátil)
    - Quieres un Gateway apto para producción y siempre activo en tu propio VPS
    - Quieres tener control total sobre la persistencia, los binarios y el comportamiento de reinicio
    - Está ejecutando OpenClaw en Docker en Hetzner o en un proveedor similar
summary: Ejecuta OpenClaw Gateway 24/7 en un VPS económico de Hetzner (Docker) con estado duradero y binarios integrados
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T05:48:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw en Hetzner (Docker, guía de VPS de producción)

## Objetivo

Ejecutar un Gateway de OpenClaw persistente en un VPS de Hetzner usando Docker, con estado duradero, binarios integrados y comportamiento de reinicio seguro.

Si quieres “OpenClaw 24/7 por ~$5”, esta es la configuración fiable más sencilla.
Los precios de Hetzner cambian; elige el VPS Debian/Ubuntu más pequeño y escala si encuentras errores de falta de memoria.

Recordatorio del modelo de seguridad:

- Los agentes compartidos por la empresa están bien cuando todos están dentro del mismo límite de confianza y el runtime es solo empresarial.
- Mantén una separación estricta: VPS/runtime dedicado + cuentas dedicadas; no uses perfiles personales de Apple/Google/navegador/gestor de contraseñas en ese host.
- Si los usuarios son adversarios entre sí, sepáralos por gateway/host/usuario del SO.

Consulta [Seguridad](/es/gateway/security) y [Alojamiento VPS](/es/vps).

## ¿Qué estamos haciendo (en términos sencillos)?

- Alquilar un servidor Linux pequeño (VPS de Hetzner)
- Instalar Docker (runtime de aplicación aislado)
- Iniciar el Gateway de OpenClaw en Docker
- Persistir `~/.openclaw` + `~/.openclaw/workspace` en el host (sobrevive a reinicios/recompilaciones)
- Acceder a la Control UI desde tu portátil mediante un túnel SSH

Ese estado montado de `~/.openclaw` incluye `openclaw.json`, el archivo por agente
`agents/<agentId>/agent/auth-profiles.json` y `.env`.

Se puede acceder al Gateway mediante:

- Reenvío de puertos SSH desde tu portátil
- Exposición directa del puerto si gestionas el firewall y los tokens por tu cuenta

Esta guía presupone Ubuntu o Debian en Hetzner.  
Si estás en otro VPS Linux, adapta los paquetes según corresponda.
Para el flujo genérico de Docker, consulta [Docker](/es/install/docker).

---

## Ruta rápida (operadores con experiencia)

1. Aprovisionar el VPS de Hetzner
2. Instalar Docker
3. Clonar el repositorio de OpenClaw
4. Crear directorios persistentes en el host
5. Configurar `.env` y `docker-compose.yml`
6. Integrar los binarios requeridos en la imagen
7. `docker compose up -d`
8. Verificar la persistencia y el acceso al Gateway

---

## Qué necesitas

- VPS de Hetzner con acceso root
- Acceso SSH desde tu portátil
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

    Esta guía presupone que el VPS mantiene estado.
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

    Esta guía presupone que compilarás una imagen personalizada para garantizar la persistencia de los binarios.

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

    Deja `OPENCLAW_GATEWAY_TOKEN` en blanco salvo que quieras explícitamente
    gestionarlo mediante `.env`; OpenClaw escribe un token de gateway aleatorio en la
    configuración durante el primer inicio. Genera una contraseña para el llavero y pégala en
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **No confirmes este archivo en el repositorio.**

    Este archivo `.env` es para variables de entorno de contenedor/runtime, como `OPENCLAW_GATEWAY_TOKEN`.
    La autenticación OAuth/clave API de proveedores almacenada vive en el archivo montado
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

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

    `--allow-unconfigured` es solo para facilitar el arranque inicial; no sustituye a una configuración adecuada del gateway. Aun así, configura la autenticación (`gateway.auth.token` o contraseña) y usa ajustes de bind seguros para tu despliegue.

  </Step>

  <Step title="Pasos compartidos del runtime de VM Docker">
    Usa la guía de runtime compartido para el flujo común de host Docker:

    - [Integrar los binarios requeridos en la imagen](/es/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compilar y lanzar](/es/install/docker-vm-runtime#build-and-launch)
    - [Qué persiste dónde](/es/install/docker-vm-runtime#what-persists-where)
    - [Actualizaciones](/es/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Acceso específico de Hetzner">
    Después de los pasos compartidos de compilación y lanzamiento, completa la siguiente configuración para abrir el túnel:

    **Requisito previo:** Asegúrate de que la configuración de sshd de tu VPS permita el reenvío TCP. Si has
    reforzado tu configuración de SSH, revisa `/etc/ssh/sshd_config` y establece:

    ```
    AllowTcpForwarding local
    ```

    `local` permite reenvíos locales `ssh -L` desde tu portátil mientras bloquea
    reenvíos remotos desde el servidor. Establecerlo en `no` hará que el túnel falle
    con:
    `channel 3: open failed: administratively prohibited: open failed`

    Después de confirmar que el reenvío TCP está habilitado, reinicia el servicio SSH
    (`systemctl restart ssh`) y ejecuta el túnel desde tu portátil:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Abre:

    `http://127.0.0.1:18789/`

    Pega el secreto compartido configurado. Esta guía usa el token de gateway de forma
    predeterminada; si cambiaste a autenticación por contraseña, usa esa contraseña en su lugar.

  </Step>
</Steps>

El mapa de persistencia compartida está en [Runtime de VM Docker](/es/install/docker-vm-runtime#what-persists-where).

## Infraestructura como código (Terraform)

Para los equipos que prefieren flujos de trabajo de infraestructura como código, una configuración de Terraform mantenida por la comunidad ofrece:

- Configuración modular de Terraform con gestión remota de estado
- Aprovisionamiento automatizado mediante cloud-init
- Scripts de despliegue (bootstrap, despliegue, copia de seguridad/restauración)
- Endurecimiento de seguridad (firewall, UFW, acceso solo por SSH)
- Configuración de túnel SSH para acceso al gateway

**Repositorios:**

- Infraestructura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuración de Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Este enfoque complementa la configuración de Docker anterior con despliegues reproducibles, infraestructura versionada y recuperación ante desastres automatizada.

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
- [Alojamiento VPS](/es/vps)
