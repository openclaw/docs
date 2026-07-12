---
read_when:
    - Configuración de OpenClaw en una Raspberry Pi
    - Ejecución de OpenClaw en dispositivos ARM
    - Cómo crear una IA personal económica y siempre activa
summary: Aloja OpenClaw en una Raspberry Pi para un autoalojamiento siempre activo
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-11T23:13:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Ejecuta un Gateway de OpenClaw persistente y siempre activo en una Raspberry Pi. Como la Pi solo funciona como Gateway (los modelos se ejecutan en la nube mediante una API), incluso una Pi modesta gestiona bien la carga de trabajo: el costo habitual del hardware es de **$35-80 en un único pago**, sin cuotas mensuales.

## Compatibilidad de hardware

| Modelo de Pi | RAM    | ¿Funciona? | Notas                                      |
| ------------ | ------ | ---------- | ------------------------------------------ |
| Pi 5         | 4/8 GB | Óptimo     | La más rápida; recomendada.                |
| Pi 4         | 4 GB   | Bien       | La mejor opción para la mayoría.           |
| Pi 4         | 2 GB   | Aceptable  | Añade espacio de intercambio.              |
| Pi 4         | 1 GB   | Limitado   | Posible con intercambio y configuración mínima. |
| Pi 3B+       | 1 GB   | Lento      | Funciona, pero con lentitud.                |
| Pi Zero 2 W  | 512 MB | No         | No recomendada.                            |

**Mínimo:** 1 GB de RAM, 1 núcleo, 500 MB de espacio libre en disco y un SO de 64 bits.
**Recomendado:** 2 GB o más de RAM, tarjeta SD de 16 GB o más (o SSD USB) y Ethernet.

## Requisitos previos

- Raspberry Pi 4 o 5 con 2 GB o más de RAM (se recomiendan 4 GB)
- Tarjeta microSD (16 GB o más) o SSD USB (mejor rendimiento)
- Fuente de alimentación oficial para Pi
- Conexión de red (Ethernet o WiFi)
- Raspberry Pi OS de 64 bits (obligatorio; no uses la versión de 32 bits)
- Unos 30 minutos

## Configuración

<Steps>
  <Step title="Flash the OS">
    Usa **Raspberry Pi OS Lite (64 bits)**; no se necesita escritorio para un servidor sin monitor.

    1. Descarga [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Elige el SO: **Raspberry Pi OS Lite (64-bit)**.
    3. En el cuadro de configuración, configura previamente:
       - Nombre de host: `gateway-host`
       - Habilita SSH
       - Establece el nombre de usuario y la contraseña
       - Configura el WiFi (si no usas Ethernet)
    4. Graba la imagen en la tarjeta SD o unidad USB, insértala e inicia la Pi.

  </Step>

  <Step title="Connect via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Update the system">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Install Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Add swap (important for 2 GB or less)">
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

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sigue el asistente. Para dispositivos sin monitor, se recomiendan claves de API en lugar de OAuth. Telegram es el canal más sencillo para empezar.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    En tu computadora, obtén desde la Pi una URL para el panel:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Después, crea un túnel SSH en otra terminal:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Abre la URL mostrada en tu navegador local. Para disponer de acceso remoto permanente, consulta la [integración con Tailscale](/es/gateway/tailscale).

  </Step>
</Steps>

## Consejos de rendimiento

**Usa un SSD USB**: las tarjetas SD son lentas y se desgastan. Un SSD USB mejora considerablemente el rendimiento y soporta más ciclos de escritura; úsalo para `OPENCLAW_STATE_DIR` si mantienes el SO en la tarjeta SD. Consulta la [guía de arranque USB de Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Habilita la caché de compilación de módulos**: acelera las invocaciones repetidas de la CLI en hosts Pi de menor potencia. `OPENCLAW_NO_RESPAWN=1` mantiene en el mismo proceso los reinicios habituales del Gateway, lo que evita transferencias adicionales entre procesos y simplifica el seguimiento del PID en hosts pequeños:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Usa `/var/tmp`, no `/tmp`: algunas distribuciones borran `/tmp` al arrancar, lo que elimina la caché precalentada.

**Reduce el uso de memoria**: en configuraciones sin monitor, libera memoria de la GPU y deshabilita los servicios que no se utilicen:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Configuración complementaria de systemd para reinicios estables**: si esta Pi se utiliza principalmente para ejecutar OpenClaw, añade una configuración complementaria al servicio:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Después, ejecuta `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. En una Pi sin monitor, habilita también una vez la persistencia de la sesión para que el servicio de usuario siga activo después de cerrar sesión: `sudo loginctl enable-linger "$(whoami)"`.

## Configuración de modelo recomendada

Como la Pi solo ejecuta el Gateway, usa modelos de API alojados en la nube; no ejecutes LLM locales en una Pi, ya que incluso los modelos pequeños son demasiado lentos para resultar útiles:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

## Notas sobre binarios ARM

La mayoría de las funciones de OpenClaw funcionan en ARM64 sin modificaciones (Node.js, Telegram, WhatsApp/Baileys y Chromium). Los binarios que ocasionalmente no disponen de compilaciones para ARM suelen ser herramientas opcionales de la CLI escritas en Go o Rust y distribuidas mediante Skills. Comprueba la arquitectura con `uname -m` (debe mostrar `aarch64`) y revisa después la página de versiones del binario que falte para buscar artefactos `linux-arm64` / `aarch64` antes de recurrir a compilarlo desde el código fuente.

## Persistencia y copias de seguridad

El estado de OpenClaw se almacena en:

- `~/.openclaw/`: `openclaw.json`, archivos `auth-profiles.json` de cada agente, estado de canales y proveedores, y sesiones.
- `~/.openclaw/workspace/`: espacio de trabajo del agente (SOUL.md, memoria y artefactos).

Estos datos sobreviven a los reinicios y se benefician del uso de un SSD en lugar de una tarjeta SD, tanto en rendimiento como en durabilidad. Crea una instantánea portátil con:

```bash
openclaw backup create
```

## Solución de problemas

**Memoria insuficiente**: comprueba que el espacio de intercambio esté activo con `free -h`. Deshabilita los servicios que no utilices (`sudo systemctl disable cups bluetooth avahi-daemon`). Usa únicamente modelos basados en API.

**Rendimiento lento**: usa un SSD USB en lugar de una tarjeta SD. Comprueba si la CPU está reduciendo su frecuencia con `vcgencmd get_throttled` (debe devolver `0x0`).

**El servicio no se inicia**: consulta los registros con `journalctl --user -u openclaw-gateway.service --no-pager -n 100` y ejecuta `openclaw doctor --non-interactive`. Si se trata de una Pi sin monitor, comprueba también que la persistencia de la sesión esté habilitada: `sudo loginctl enable-linger "$(whoami)"`.

**Problemas con binarios ARM**: si una skill falla con `"exec format error"`, comprueba si el binario dispone de una compilación para ARM64. Verifica la arquitectura con `uname -m` (debe mostrar `aarch64`).

**Desconexiones de WiFi**: deshabilita la administración de energía del WiFi: `sudo iwconfig wlan0 power off`.

## Pasos siguientes

- [Canales](/es/channels): conecta Telegram, WhatsApp, Discord y otros servicios
- [Configuración del Gateway](/es/gateway/configuration): todas las opciones de configuración
- [Actualización](/es/install/updating): mantén OpenClaw actualizado

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Plataformas](/es/platforms)
