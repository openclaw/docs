---
read_when:
    - Quieres que OpenClaw se ejecute 24/7 en GCP
    - Quieres un Gateway siempre activo, de nivel de producción, en tu propia máquina virtual.
    - Desea tener control total sobre la persistencia, los binarios y el comportamiento de reinicio
summary: Ejecuta OpenClaw Gateway 24/7 en una VM de GCP Compute Engine (Docker) con estado durable
title: GCP
x-i18n:
    generated_at: "2026-07-05T11:27:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Ejecuta un Gateway persistente de OpenClaw en una VM de GCP Compute Engine usando Docker, con estado duradero, binarios integrados y comportamiento de reinicio seguro.

Los precios varían según el tipo de máquina y la región; elige la VM más pequeña que se ajuste a tu carga de trabajo y escala si encuentras OOM.

Se puede acceder al Gateway mediante reenvío de puertos SSH desde tu portátil, o mediante exposición directa del puerto si gestionas tú mismo el firewall y los tokens.

Esta guía usa Debian en GCP Compute Engine. Ubuntu también funciona; asigna los paquetes según corresponda. Para el flujo genérico de Docker, consulta [Docker](/es/install/docker).

## Lo que necesitas

- Cuenta de GCP (`e2-micro` es apta para el nivel gratuito)
- CLI de `gcloud`, o la [Cloud Console](https://console.cloud.google.com)
- Acceso SSH desde tu portátil
- Docker y Docker Compose
- Credenciales de autenticación del modelo
- Credenciales opcionales de proveedor (QR de WhatsApp, token de bot de Telegram, OAuth de Gmail)
- ~20-30 minutos

## Ruta rápida

1. Crea un proyecto de GCP, habilita la facturación y la API de Compute Engine
2. Crea una VM de Compute Engine (`e2-small`, Debian 12, 20GB)
3. Conéctate por SSH a la VM, instala Docker
4. Clona el repositorio de OpenClaw
5. Crea directorios persistentes en el host
6. Configura `.env` y `docker-compose.yml`
7. Integra los binarios requeridos, compila e inicia

<Steps>
  <Step title="Install gcloud CLI (or use Console)">
    Instala desde [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), luego:

    ```bash
    gcloud init
    gcloud auth login
    ```

    O realiza todos los pasos siguientes mediante la interfaz web de [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Create a GCP project">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Habilita la facturación en [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (obligatorio para Compute Engine).

    Equivalente en la consola: IAM & Admin > Create Project, habilita la facturación, luego APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Create the VM">
    | Tipo      | Especificaciones          | Costo              | Notas                                         |
    | --------- | ------------------------- | ------------------ | --------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM           | ~$25/mes           | Más fiable para compilaciones locales de Docker |
    | e2-small  | 2 vCPU, 2GB RAM           | ~$12/mes           | Mínimo recomendado para una compilación de Docker |
    | e2-micro  | 2 vCPU (compartida), 1GB RAM | Apto para el nivel gratuito | A menudo falla con OOM en la compilación de Docker (salida 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="SSH into the VM">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Consola: haz clic en "SSH" junto a la VM en el panel de Compute Engine.

    La propagación de claves SSH puede tardar 1-2 minutos después de crear la VM; espera y vuelve a intentarlo si se rechaza la conexión.

  </Step>

  <Step title="Install Docker (on the VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Cierra sesión y vuelve a iniciarla para que el cambio de grupo surta efecto; luego conéctate de nuevo por SSH:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Verifica:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Esta guía compila una imagen personalizada para que cualquier binario que integres sobreviva a los reinicios.

  </Step>

  <Step title="Create persistent host directories">
    Los contenedores Docker son efímeros; todo el estado de larga duración debe vivir en el host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configure environment variables">
    Crea `.env` en la raíz del repositorio:

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Define `OPENCLAW_GATEWAY_TOKEN` para gestionar el token estable del Gateway mediante
    `.env`; de lo contrario, configura `gateway.auth.token` antes de depender de clientes
    entre reinicios. Si no se define ninguno, OpenClaw usa un token solo de tiempo de ejecución para
    ese arranque. Genera una contraseña de llavero para `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **No confirmes este archivo en el repositorio.** Contiene variables de entorno de contenedor/tiempo de ejecución como
    `OPENCLAW_GATEWAY_TOKEN`. La autenticación OAuth/clave de API de proveedores almacenada vive en el
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` montado.

  </Step>

  <Step title="Docker Compose configuration">
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
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
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

    `--allow-unconfigured` es solo para facilitar el arranque inicial, no sustituye una configuración real del Gateway. Aun así, define autenticación (`gateway.auth.token` o contraseña) y un modo de enlace seguro para tu despliegue.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    Sigue la guía de tiempo de ejecución compartida para el flujo común del host Docker:

    - [Integra los binarios requeridos en la imagen](/es/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compila e inicia](/es/install/docker-vm-runtime#build-and-launch)
    - [Qué persiste y dónde](/es/install/docker-vm-runtime#what-persists-where)
    - [Actualizaciones](/es/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specific launch notes">
    Si la compilación falla con `Killed` o `exit code 137` durante `pnpm install --frozen-lockfile`, la VM no tiene memoria suficiente. Usa `e2-small` como mínimo, o `e2-medium` para primeras compilaciones más fiables.

    Al enlazar a LAN (`OPENCLAW_GATEWAY_BIND=lan`), configura un origen de navegador de confianza antes de continuar:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Sustituye `18789` por tu puerto configurado si lo cambiaste.

  </Step>

  <Step title="Access from your laptop">
    Crea un túnel SSH para reenviar el puerto del Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Abre `http://127.0.0.1:18789/` en tu navegador.

    Vuelve a imprimir un enlace limpio al panel:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Si la interfaz solicita autenticación de secreto compartido, pega el token configurado o
    la contraseña en la configuración de Control UI (este flujo de Docker escribe un token de forma
    predeterminada; usa tu contraseña configurada en su lugar si cambiaste a autenticación por
    contraseña).

    Si Control UI muestra `unauthorized` o `disconnected (1008): pairing required`, aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Consulta [Tiempo de ejecución de VM Docker](/es/install/docker-vm-runtime#what-persists-where) para el mapa de persistencia compartido y el [flujo de actualización](/es/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Solución de problemas

**Conexión SSH rechazada**

La propagación de claves SSH puede tardar 1-2 minutos después de crear la VM. Espera y vuelve a intentarlo.

**Problemas con OS Login**

Comprueba tu perfil de OS Login:

```bash
gcloud compute os-login describe-profile
```

Asegúrate de que tu cuenta tenga los permisos IAM requeridos (Compute OS Login o Compute OS Admin Login).

**Sin memoria (OOM)**

Si la compilación de Docker falla con `Killed` y `exit code 137`, la VM fue terminada por OOM:

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Cuentas de servicio (práctica recomendada de seguridad)

Para uso personal, tu cuenta de usuario predeterminada funciona bien. Para automatización o CI/CD, crea una cuenta de servicio dedicada con permisos mínimos:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Evita el rol Owner para automatización; usa el rol más limitado que funcione. Consulta [Comprender los roles](https://cloud.google.com/iam/docs/understanding-roles).

## Próximos pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Empareja dispositivos locales como nodos: [Nodos](/es/nodes)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)

## Relacionado

- [Resumen de instalación](/es/install)
- [Azure](/es/install/azure)
- [Alojamiento VPS](/es/vps)
