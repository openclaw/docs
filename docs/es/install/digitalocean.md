---
read_when:
    - Configurar OpenClaw en DigitalOcean
    - Buscar un VPS de pago sencillo para OpenClaw
summary: Alojar OpenClaw en un Droplet de DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T05:34:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

Ejecuta un Gateway persistente de OpenClaw en un Droplet de DigitalOcean.

## Requisitos previos

- Cuenta de DigitalOcean ([registro](https://cloud.digitalocean.com/registrations/new))
- Par de claves SSH (o disposición para usar autenticación por contraseña)
- Aproximadamente 20 minutos

## Configuración

<Steps>
  <Step title="Crear un Droplet">
    <Warning>
    Usa una imagen base limpia (Ubuntu 24.04 LTS). Evita imágenes de terceros tipo 1-click de Marketplace a menos que hayas revisado sus scripts de inicio y los valores predeterminados del firewall.
    </Warning>

    1. Inicia sesión en [DigitalOcean](https://cloud.digitalocean.com/).
    2. Haz clic en **Create > Droplets**.
    3. Elige:
       - **Región:** La más cercana a ti
       - **Imagen:** Ubuntu 24.04 LTS
       - **Tamaño:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Autenticación:** clave SSH (recomendado) o contraseña
    4. Haz clic en **Create Droplet** y anota la dirección IP.

  </Step>

  <Step title="Conectarse e instalar">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --install-daemon
    ```

    El asistente te guía a través de la autenticación del modelo, configuración de canales, generación del token de Gateway e instalación del daemon (systemd).

  </Step>

  <Step title="Agregar swap (recomendado para Droplets de 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verificar Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acceder a la UI de Control">
    Gateway se enlaza a loopback de forma predeterminada. Elige una de estas opciones.

    **Opción A: túnel SSH (más simple)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Luego abre `http://localhost:18789`.

    **Opción B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Luego abre `https://<magicdns>/` desde cualquier dispositivo de tu tailnet.

    **Opción C: bind de tailnet (sin Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Luego abre `http://<tailscale-ip>:18789` (se requiere token).

  </Step>
</Steps>

## Solución de problemas

**Gateway no se inicia** -- Ejecuta `openclaw doctor --non-interactive` y revisa los registros con `journalctl --user -u openclaw-gateway.service -n 50`.

**El puerto ya está en uso** -- Ejecuta `lsof -i :18789` para encontrar el proceso y luego detenlo.

**Memoria insuficiente** -- Verifica que el swap esté activo con `free -h`. Si sigues teniendo OOM, usa modelos basados en API (Claude, GPT) en lugar de modelos locales, o actualiza a un Droplet de 2 GB.

## Siguientes pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración de Gateway](/es/gateway/configuration) -- todas las opciones de configuración
- [Actualización](/es/install/updating) -- mantén OpenClaw al día

## Relacionado

- [Resumen de instalación](/es/install)
- [Fly.io](/es/install/fly)
- [Hetzner](/es/install/hetzner)
- [Alojamiento VPS](/es/vps)
