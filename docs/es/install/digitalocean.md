---
read_when:
    - Configurar OpenClaw en DigitalOcean
    - Buscando un VPS de pago sencillo para OpenClaw
summary: Alojar OpenClaw en un Droplet de DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-11T23:12:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Ejecuta un Gateway persistente de OpenClaw en un Droplet de DigitalOcean (~6 USD al mes para el plan Basic de 1 GB).

DigitalOcean es una opción sencilla de VPS de pago. Para alternativas más económicas o gratuitas:

- [Hetzner](/es/install/hetzner) -- más núcleos/RAM por dólar.
- [Oracle Cloud](/es/install/oracle) -- nivel Always Free con ARM (hasta 4 OCPU y 24 GB de RAM), pero el registro puede ser complicado y solo admite ARM.

## Requisitos previos

- Cuenta de DigitalOcean ([registro](https://cloud.digitalocean.com/registrations/new))
- Par de claves SSH (o disposición para usar autenticación por contraseña)
- Unos 20 minutos

## Configuración

<Steps>
  <Step title="Crear un Droplet">
    <Warning>
    Usa una imagen base limpia (Ubuntu 24.04 LTS). Evita las imágenes de terceros con instalación en un clic de Marketplace, a menos que hayas revisado sus scripts de inicio y la configuración predeterminada del cortafuegos.
    </Warning>

    1. Inicia sesión en [DigitalOcean](https://cloud.digitalocean.com/).
    2. Haz clic en **Create > Droplets**.
    3. Elige:
       - **Region:** la más cercana a ti
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** clave SSH (recomendado) o contraseña
    4. Haz clic en **Create Droplet** y anota la dirección IP.

  </Step>

  <Step title="Conectar e instalar">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Usa el shell de root únicamente para la preparación inicial del sistema. Ejecuta los comandos de OpenClaw como el usuario sin privilegios de root `openclaw`, para que el estado se almacene en `/home/openclaw/.openclaw/` y el Gateway se instale como servicio `--user` de systemd para dicho usuario.

  </Step>

  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --install-daemon
    ```

    El asistente te guía por la autenticación del modelo, la configuración de canales, la generación del token del Gateway y la instalación del demonio (servicio de usuario de systemd).

  </Step>

  <Step title="Añadir espacio de intercambio (recomendado para Droplets de 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verificar el Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acceder a la interfaz de control">
    El Gateway se vincula a local loopback de forma predeterminada. Elige una de estas opciones.

    **Opción A: túnel SSH (la más sencilla)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Después, abre `http://localhost:18789`.

    **Opción B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Después, abre `https://<magicdns>/` desde cualquier dispositivo de tu tailnet.

    Tailscale Serve autentica el tráfico de la interfaz de control y WebSocket mediante cabeceras de identidad de tailnet, lo que presupone que el propio host del Gateway es de confianza. Los endpoints de la API HTTP siguen utilizando el modo de autenticación normal del Gateway (token/contraseña), independientemente de esta configuración. Para exigir credenciales explícitas basadas en un secreto compartido mediante Serve, establece `gateway.auth.allowTailscale: false` y usa `gateway.auth.mode: "token"` o `"password"`.

    **Opción C: vinculación a tailnet (sin Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Después, abre `http://<tailscale-ip>:18789` (se requiere un token).

  </Step>
</Steps>

## Persistencia y copias de seguridad

El estado de OpenClaw se almacena en:

- `~/.openclaw/` -- `openclaw.json`, credenciales de canales/proveedores, `auth-profiles.json` por agente y datos de sesión.
- `~/.openclaw/workspace/` -- el espacio de trabajo del agente (SOUL.md, memoria y artefactos).

Estos datos sobreviven a los reinicios del Droplet. Para crear una instantánea portátil:

```bash
openclaw backup create
```

Las instantáneas de DigitalOcean respaldan todo el Droplet; `openclaw backup create` es portátil entre hosts.

## Consejos para 1 GB de RAM

El Droplet de 6 USD solo tiene 1 GB de RAM. Para mantener un funcionamiento fluido:

- Asegúrate de que el paso anterior para configurar el espacio de intercambio esté incluido en `/etc/fstab`, para que se mantenga tras los reinicios.
- Prefiere modelos basados en API (Claude, GPT) en lugar de modelos locales: la inferencia local de LLM no cabe en 1 GB.
- Establece `agents.defaults.model.primary` en un modelo más pequeño si se producen errores por falta de memoria con solicitudes grandes.
- Supervisa el sistema con `free -h` y `htop`.

## Solución de problemas

**El Gateway no se inicia** -- Ejecuta `openclaw doctor --non-interactive` y consulta los registros con `journalctl --user -u openclaw-gateway.service -n 50`.

**El puerto ya está en uso** -- Ejecuta `lsof -i :18789` para encontrar el proceso y, después, detenlo.

**Memoria insuficiente** -- Verifica que el espacio de intercambio esté activo con `free -h`. Si siguen produciéndose errores por falta de memoria, cambia a modelos basados en API (Claude, GPT) en lugar de modelos locales, o actualiza a un Droplet de 2 GB.

## Próximos pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración del Gateway](/es/gateway/configuration) -- todas las opciones de configuración
- [Actualización](/es/install/updating) -- mantén OpenClaw actualizado

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Fly.io](/es/install/fly)
- [Hetzner](/es/install/hetzner)
- [Alojamiento en VPS](/es/vps)
