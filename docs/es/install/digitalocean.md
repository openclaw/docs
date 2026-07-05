---
read_when:
    - Configuración de OpenClaw en DigitalOcean
    - Buscando un VPS de pago sencillo para OpenClaw
summary: Aloja OpenClaw en un Droplet de DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-05T11:25:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Ejecuta un Gateway de OpenClaw persistente en un Droplet de DigitalOcean (~6 USD/mes para el plan Basic de 1 GB).

DigitalOcean es una ruta de VPS de pago sencilla. Para opciones más baratas o gratuitas:

- [Hetzner](/es/install/hetzner) -- más núcleos/RAM por dólar.
- [Oracle Cloud](/es/install/oracle) -- nivel Always Free ARM (hasta 4 OCPU, 24 GB de RAM), pero el registro puede ser delicado y es solo ARM.

## Requisitos previos

- Cuenta de DigitalOcean ([registro](https://cloud.digitalocean.com/registrations/new))
- Par de claves SSH (o disposición a usar autenticación con contraseña)
- Aproximadamente 20 minutos

## Configuración

<Steps>
  <Step title="Crear un Droplet">
    <Warning>
    Usa una imagen base limpia (Ubuntu 24.04 LTS). Evita imágenes de un clic de Marketplace de terceros a menos que hayas revisado sus scripts de inicio y valores predeterminados del firewall.
    </Warning>

    1. Inicia sesión en [DigitalOcean](https://cloud.digitalocean.com/).
    2. Haz clic en **Create > Droplets**.
    3. Elige:
       - **Región:** La más cercana a ti
       - **Imagen:** Ubuntu 24.04 LTS
       - **Tamaño:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Autenticación:** Clave SSH (recomendado) o contraseña
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

    Usa el shell root solo para el arranque del sistema. Ejecuta los comandos de OpenClaw como el usuario no root `openclaw` para que el estado resida en `/home/openclaw/.openclaw/` y el Gateway se instale como el servicio systemd `--user` de ese usuario.

  </Step>

  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --install-daemon
    ```

    El asistente te guía por la autenticación del modelo, la configuración del canal, la generación del token del gateway y la instalación del daemon (servicio de usuario de systemd).

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

  <Step title="Verificar el gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acceder a la interfaz de usuario de Control">
    El gateway se enlaza a loopback de forma predeterminada. Elige una de estas opciones.

    **Opción A: túnel SSH (la más sencilla)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Luego abre `http://localhost:18789`.

    **Opción B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Luego abre `https://<magicdns>/` desde cualquier dispositivo de tu tailnet.

    Tailscale Serve autentica la interfaz de usuario de Control y el tráfico WebSocket mediante encabezados de identidad de tailnet, lo que asume que el propio host del gateway es de confianza. Los endpoints de la API HTTP siguen usando el modo de autenticación normal del gateway (token/contraseña) en cualquier caso. Para requerir credenciales explícitas de secreto compartido mediante Serve, establece `gateway.auth.allowTailscale: false` y usa `gateway.auth.mode: "token"` o `"password"`.

    **Opción C: enlace a tailnet (sin Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Luego abre `http://<tailscale-ip>:18789` (se requiere token).

  </Step>
</Steps>

## Persistencia y copias de seguridad

El estado de OpenClaw reside en:

- `~/.openclaw/` -- `openclaw.json`, credenciales de canales/proveedores, `auth-profiles.json` por agente y datos de sesión.
- `~/.openclaw/workspace/` -- el espacio de trabajo del agente (SOUL.md, memoria, artefactos).

Esto sobrevive a los reinicios del Droplet. Para tomar una instantánea portable:

```bash
openclaw backup create
```

Las instantáneas de DigitalOcean respaldan todo el Droplet; `openclaw backup create` es portable entre hosts.

## Consejos para 1 GB de RAM

El Droplet de 6 USD solo tiene 1 GB de RAM. Para mantener todo funcionando sin problemas:

- Asegúrate de que el paso de swap anterior esté en `/etc/fstab` para que sobreviva a los reinicios.
- Prefiere modelos basados en API (Claude, GPT) en lugar de locales -- la inferencia local de LLM no cabe en 1 GB.
- Establece `agents.defaults.model.primary` en un modelo más pequeño si te encuentras con OOM en prompts grandes.
- Supervisa con `free -h` y `htop`.

## Solución de problemas

**El Gateway no inicia** -- Ejecuta `openclaw doctor --non-interactive` y revisa los logs con `journalctl --user -u openclaw-gateway.service -n 50`.

**El puerto ya está en uso** -- Ejecuta `lsof -i :18789` para encontrar el proceso y luego detenerlo.

**Sin memoria** -- Verifica que swap esté activo con `free -h`. Si sigues encontrándote con OOM, cambia a modelos basados en API (Claude, GPT) en lugar de modelos locales, o actualiza a un Droplet de 2 GB.

## Siguientes pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración de Gateway](/es/gateway/configuration) -- todas las opciones de configuración
- [Actualización](/es/install/updating) -- mantén OpenClaw actualizado

## Relacionado

- [Resumen de instalación](/es/install)
- [Fly.io](/es/install/fly)
- [Hetzner](/es/install/hetzner)
- [Alojamiento VPS](/es/vps)
