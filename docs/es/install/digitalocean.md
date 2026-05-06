---
read_when:
    - Configurar OpenClaw en DigitalOcean
    - Buscas un VPS de pago sencillo para OpenClaw
summary: Aloja OpenClaw en un Droplet de DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T05:38:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

Ejecuta un Gateway de OpenClaw persistente en un Droplet de DigitalOcean (~6 USD/mes para el plan Basic de 1 GB).

DigitalOcean es la ruta de VPS de pago más sencilla. Si prefieres opciones más baratas o gratuitas:

- [Hetzner](/es/install/hetzner) — 3,79 €/mes, más núcleos/RAM por dólar.
- [Oracle Cloud](/es/install/oracle) — ARM Always Free (hasta 4 OCPU, 24 GB de RAM), pero el registro puede ser complicado y es solo ARM.

## Requisitos previos

- Cuenta de DigitalOcean ([registro](https://cloud.digitalocean.com/registrations/new))
- Par de claves SSH (o disposición para usar autenticación con contraseña)
- Unos 20 minutos

## Configuración

<Steps>
  <Step title="Crear un Droplet">
    <Warning>
    Usa una imagen base limpia (Ubuntu 24.04 LTS). Evita las imágenes de terceros de Marketplace con instalación de 1 clic, salvo que hayas revisado sus scripts de inicio y valores predeterminados de firewall.
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
    openclaw --version
    ```

  </Step>

  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --install-daemon
    ```

    El asistente te guía por la autenticación del modelo, la configuración de canales, la generación del token de Gateway y la instalación del daemon (systemd).

  </Step>

  <Step title="Añadir swap (recomendado para Droplets de 1 GB)">
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
    El Gateway se enlaza a loopback de forma predeterminada. Elige una de estas opciones.

    **Opción A: túnel SSH (la más sencilla)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Después abre `http://localhost:18789`.

    **Opción B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Después abre `https://<magicdns>/` desde cualquier dispositivo de tu tailnet.

    Tailscale Serve autentica la interfaz de control y el tráfico WebSocket mediante encabezados de identidad de tailnet, lo que asume que el host del Gateway es de confianza. Los endpoints de la API HTTP siguen el modo de autenticación normal del Gateway (token/contraseña) de todos modos. Para exigir credenciales explícitas de secreto compartido sobre Serve, configura `gateway.auth.allowTailscale: false` y usa `gateway.auth.mode: "token"` o `"password"`.

    **Opción C: enlace de tailnet (sin Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Después abre `http://<tailscale-ip>:18789` (requiere token).

  </Step>
</Steps>

## Persistencia y copias de seguridad

El estado de OpenClaw se encuentra en:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canales/proveedores y datos de sesión.
- `~/.openclaw/workspace/` — el espacio de trabajo del agente (SOUL.md, memoria, artefactos).

Estos sobreviven a los reinicios del Droplet. Para tomar una instantánea portátil:

```bash
openclaw backup create
```

Las instantáneas de DigitalOcean respaldan todo el Droplet; `openclaw backup create` es portátil entre hosts.

## Consejos para 1 GB de RAM

El Droplet de 6 USD solo tiene 1 GB de RAM. Para que todo vaya fluido:

- Asegúrate de que el paso de swap anterior esté en `/etc/fstab` para que sobreviva a los reinicios.
- Prefiere modelos basados en API (Claude, GPT) antes que modelos locales: la inferencia local de LLM no cabe en 1 GB.
- Configura `agents.defaults.model.primary` con un modelo más pequeño si encuentras errores de OOM en prompts grandes.
- Supervisa con `free -h` y `htop`.

## Solución de problemas

**El Gateway no arranca** -- Ejecuta `openclaw doctor --non-interactive` y revisa los logs con `journalctl --user -u openclaw-gateway.service -n 50`.

**El puerto ya está en uso** -- Ejecuta `lsof -i :18789` para encontrar el proceso y luego detenlo.

**Sin memoria** -- Verifica que el swap esté activo con `free -h`. Si aún encuentras OOM, usa modelos basados en API (Claude, GPT) en lugar de modelos locales, o actualiza a un Droplet de 2 GB.

## Próximos pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración del Gateway](/es/gateway/configuration) -- todas las opciones de configuración
- [Actualización](/es/install/updating) -- mantén OpenClaw actualizado

## Relacionado

- [Resumen de instalación](/es/install)
- [Fly.io](/es/install/fly)
- [Hetzner](/es/install/hetzner)
- [Alojamiento VPS](/es/vps)
