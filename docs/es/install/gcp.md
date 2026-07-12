---
read_when:
    - Quieres que OpenClaw se ejecute las 24 horas, los 7 días de la semana en GCP
    - Quieres un Gateway de nivel de producción, siempre activo, en tu propia máquina virtual
    - Quieres tener control total sobre la persistencia, los binarios y el comportamiento de reinicio
summary: Ejecuta OpenClaw Gateway 24/7 en una máquina virtual de GCP Compute Engine (Docker) con estado persistente
title: GCP
x-i18n:
    generated_at: "2026-07-11T23:12:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Ejecuta un Gateway persistente de OpenClaw en una VM de GCP Compute Engine mediante Docker, con estado duradero, binarios integrados y un comportamiento de reinicio seguro.

Los precios varían según el tipo de máquina y la región; elige la VM más pequeña que se adapte a tu carga de trabajo y amplíala si se producen errores de memoria insuficiente.

Puedes acceder al Gateway mediante el reenvío de puertos SSH desde tu portátil o exponiendo directamente el puerto si administras por tu cuenta el cortafuegos y los tokens.

Esta guía utiliza Debian en GCP Compute Engine. Ubuntu también funciona; adapta los paquetes según corresponda. Para consultar el flujo genérico de Docker, consulta [Docker](/es/install/docker).

## Lo que necesitas

- Cuenta de GCP (`e2-micro` cumple los requisitos del nivel gratuito)
- CLI de `gcloud` o [Cloud Console](https://console.cloud.google.com)
- Acceso SSH desde tu portátil
- Docker y Docker Compose
- Credenciales de autenticación del modelo
- Credenciales opcionales de proveedores (código QR de WhatsApp, token de bot de Telegram, OAuth de Gmail)
- Entre 20 y 30 minutos aproximadamente

## Ruta rápida

1. Crea un proyecto de GCP y habilita la facturación y la API de Compute Engine
2. Crea una VM de Compute Engine (`e2-small`, Debian 12, 20 GB)
3. Accede a la VM mediante SSH e instala Docker
4. Clona el repositorio de OpenClaw
5. Crea directorios persistentes en el host
6. Configura `.env` y `docker-compose.yml`
7. Integra los binarios necesarios, compila e inicia

<Steps>
  <Step title="Instalar la CLI de gcloud (o usar la consola)">
    Instálala desde [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) y, a continuación, ejecuta:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Como alternativa, realiza todos los pasos siguientes mediante la interfaz web de [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Crear un proyecto de GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Habilita la facturación en [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (es obligatoria para Compute Engine).

    Equivalente en la consola: IAM & Admin > Create Project, habilita la facturación y, a continuación, ve a APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Crear la VM">
    | Tipo      | Especificaciones          | Coste                  | Notas                                                   |
    | --------- | ------------------------- | ---------------------- | ------------------------------------------------------- |
    | e2-medium | 2 vCPU, 4 GB de RAM       | ~25 USD/mes            | La opción más fiable para compilaciones locales de Docker |
    | e2-small  | 2 vCPU, 2 GB de RAM       | ~12 USD/mes            | Mínimo recomendado para una compilación de Docker       |
    | e2-micro  | 2 vCPU (compartidas), 1 GB de RAM | Cumple los requisitos del nivel gratuito | Suele fallar por memoria insuficiente al compilar con Docker (salida 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Acceder a la VM mediante SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Consola: haz clic en "SSH" junto a la VM en el panel de Compute Engine.

    La propagación de la clave SSH puede tardar entre 1 y 2 minutos después de crear la VM; espera y vuelve a intentarlo si se rechaza la conexión.

  </Step>

  <Step title="Instalar Docker (en la VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Cierra la sesión y vuelve a iniciarla para que el cambio de grupo surta efecto; después, vuelve a conectarte mediante SSH:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    Esta guía compila una imagen personalizada para que todos los binarios que integres se conserven después de los reinicios.

  </Step>

  <Step title="Crear directorios persistentes en el host">
    Los contenedores de Docker son efímeros; todo el estado duradero debe residir en el host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configurar las variables de entorno">
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

    Establece `OPENCLAW_GATEWAY_TOKEN` para administrar el token estable del Gateway mediante
    `.env`; de lo contrario, configura `gateway.auth.token` antes de depender de clientes
    entre reinicios. Si no se establece ninguno, OpenClaw utiliza un token exclusivo del tiempo de ejecución para
    ese inicio. Genera una contraseña para el llavero en `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **No confirmes este archivo en el repositorio.** Contiene variables de entorno del contenedor y del tiempo de ejecución, como
    `OPENCLAW_GATEWAY_TOKEN`. La autenticación almacenada del proveedor mediante OAuth o clave de API reside en el archivo
    montado `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

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
          # Recomendado: mantén el Gateway accesible solo mediante loopback en la VM; accede a él mediante un túnel SSH.
          # Para exponerlo públicamente, elimina el prefijo `127.0.0.1:` y configura el cortafuegos como corresponda.
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

    `--allow-unconfigured` solo facilita la configuración inicial; no sustituye una configuración real del Gateway. Aun así, configura la autenticación (`gateway.auth.token` o una contraseña) y un modo de vinculación seguro para tu implementación.

  </Step>

  <Step title="Pasos compartidos del entorno de ejecución para una VM con Docker">
    Sigue la guía compartida del entorno de ejecución para el flujo habitual de un host Docker:

    - [Integrar los binarios necesarios en la imagen](/es/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compilar e iniciar](/es/install/docker-vm-runtime#build-and-launch)
    - [Qué se conserva y dónde](/es/install/docker-vm-runtime#what-persists-where)
    - [Actualizaciones](/es/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Notas de inicio específicas de GCP">
    Si la compilación falla con `Killed` o `exit code 137` durante `pnpm install --frozen-lockfile`, la VM se ha quedado sin memoria. Utiliza como mínimo `e2-small` o `e2-medium` para que las primeras compilaciones sean más fiables.

    Si vinculas el servicio a la LAN (`OPENCLAW_GATEWAY_BIND=lan`), configura un origen de navegador de confianza antes de continuar:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Sustituye `18789` por el puerto configurado si lo has cambiado.

  </Step>

  <Step title="Acceder desde tu portátil">
    Crea un túnel SSH para reenviar el puerto del Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Abre `http://127.0.0.1:18789/` en tu navegador.

    Vuelve a mostrar un enlace limpio al panel:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Si la interfaz solicita autenticación mediante un secreto compartido, pega el token o la
    contraseña configurados en los ajustes de Control UI (este flujo de Docker escribe un token de
    forma predeterminada; si has cambiado a la autenticación mediante contraseña, utiliza en su lugar la contraseña
    configurada).

    Si Control UI muestra `unauthorized` o `disconnected (1008): pairing required`, aprueba el dispositivo del navegador:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Consulta [Entorno de ejecución de una VM con Docker](/es/install/docker-vm-runtime#what-persists-where) para ver el mapa de persistencia compartido y el [flujo de actualización](/es/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Solución de problemas

**Conexión SSH rechazada**

La propagación de la clave SSH puede tardar entre 1 y 2 minutos después de crear la VM. Espera y vuelve a intentarlo.

**Problemas con OS Login**

Comprueba tu perfil de OS Login:

```bash
gcloud compute os-login describe-profile
```

Asegúrate de que tu cuenta tenga los permisos de IAM necesarios (Compute OS Login o Compute OS Admin Login).

**Memoria insuficiente (OOM)**

Si la compilación de Docker falla con `Killed` y `exit code 137`, el sistema finalizó la VM por falta de memoria:

```bash
# Detén primero la VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Cambia el tipo de máquina
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Inicia la VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Cuentas de servicio (práctica recomendada de seguridad)

Para uso personal, tu cuenta de usuario predeterminada funciona correctamente. Para automatización o CI/CD, crea una cuenta de servicio dedicada con permisos mínimos:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Evita el rol de propietario para la automatización; utiliza el rol más restrictivo que funcione. Consulta [Descripción de los roles](https://cloud.google.com/iam/docs/understanding-roles).

## Pasos siguientes

- Configura canales de mensajería: [Canales](/es/channels)
- Empareja dispositivos locales como nodos: [Nodos](/es/nodes)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Azure](/es/install/azure)
- [Alojamiento en VPS](/es/vps)
