---
read_when:
    - Configurar OpenClaw en una Raspberry Pi
    - Ejecutar OpenClaw en dispositivos ARM
    - Crear una IA personal barata y siempre activa
summary: Alojar OpenClaw en una Raspberry Pi para autoalojamiento siempre activo
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-24T05:36:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

Ejecuta un Gateway persistente y siempre activo de OpenClaw en una Raspberry Pi. Como la Pi es solo el gateway (los modelos se ejecutan en la nube mediante API), incluso una Pi modesta maneja bien la carga.

## Requisitos previos

- Raspberry Pi 4 o 5 con 2 GB+ de RAM (4 GB recomendado)
- Tarjeta microSD (16 GB+) o SSD USB (mejor rendimiento)
- Fuente de alimentación oficial de Pi
- Conexión de red (Ethernet o WiFi)
- Raspberry Pi OS de 64 bits (obligatorio -- no uses 32 bits)
- Aproximadamente 30 minutos

## Configuración

<Steps>
  <Step title="Grabar el sistema operativo">
    Usa **Raspberry Pi OS Lite (64-bit)** -- no hace falta escritorio para un servidor sin monitor.

    1. Descarga [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Elige SO: **Raspberry Pi OS Lite (64-bit)**.
    3. En el cuadro de diálogo de ajustes, preconfigura:
       - Nombre del host: `gateway-host`
       - Habilitar SSH
       - Establecer nombre de usuario y contraseña
       - Configurar WiFi (si no usas Ethernet)
    4. Grábalo en tu tarjeta SD o unidad USB, insértala y arranca la Pi.

  </Step>

  <Step title="Conectarse mediante SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Actualizar el sistema">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Instalar Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Agregar swap (importante para 2 GB o menos)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Instalar OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sigue el asistente. Las claves API son recomendables frente a OAuth en dispositivos sin monitor. Telegram es el canal más fácil para empezar.

  </Step>

  <Step title="Verificar">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acceder a la UI de Control">
    En tu ordenador, obtén una URL del panel desde la Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Luego crea un túnel SSH en otra terminal:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Abre la URL mostrada en tu navegador local. Para acceso remoto siempre activo, consulta [Integración con Tailscale](/es/gateway/tailscale).

  </Step>
</Steps>

## Consejos de rendimiento

**Usa un SSD USB** -- Las tarjetas SD son lentas y se desgastan. Un SSD USB mejora drásticamente el rendimiento. Consulta la [guía de arranque USB de Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Habilita la caché de compilación de módulos** -- Acelera invocaciones repetidas de la CLI en hosts Pi de menor potencia:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Reduce el uso de memoria** -- Para configuraciones sin monitor, libera memoria de GPU y desactiva servicios no usados:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Solución de problemas

**Memoria insuficiente** -- Verifica que el swap esté activo con `free -h`. Desactiva servicios no usados (`sudo systemctl disable cups bluetooth avahi-daemon`). Usa solo modelos basados en API.

**Rendimiento lento** -- Usa un SSD USB en lugar de una tarjeta SD. Comprueba si hay limitación térmica/eléctrica de CPU con `vcgencmd get_throttled` (debería devolver `0x0`).

**El servicio no se inicia** -- Comprueba los registros con `journalctl --user -u openclaw-gateway.service --no-pager -n 100` y ejecuta `openclaw doctor --non-interactive`. Si esta es una Pi sin monitor, verifica también que lingering esté habilitado: `sudo loginctl enable-linger "$(whoami)"`.

**Problemas con binarios ARM** -- Si una Skill falla con "exec format error", comprueba si el binario tiene una compilación ARM64. Verifica la arquitectura con `uname -m` (debería mostrar `aarch64`).

**Cortes de WiFi** -- Desactiva la gestión de energía del WiFi: `sudo iwconfig wlan0 power off`.

## Siguientes pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración de Gateway](/es/gateway/configuration) -- todas las opciones de configuración
- [Actualización](/es/install/updating) -- mantén OpenClaw al día

## Relacionado

- [Resumen de instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Plataformas](/es/platforms)
