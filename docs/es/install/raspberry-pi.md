---
read_when:
    - Configuración de OpenClaw en una Raspberry Pi
    - Ejecutar OpenClaw en dispositivos ARM
    - Crear una IA personal económica y siempre activa
summary: Aloja OpenClaw en una Raspberry Pi para autoalojamiento siempre activo
title: Raspberry Pi
x-i18n:
    generated_at: "2026-05-06T05:40:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96df076c2707b0b27751d452f15fad774356a86e96d10bce998581235776c4bc
    source_path: install/raspberry-pi.md
    workflow: 16
---

Ejecuta un OpenClaw Gateway persistente y siempre activo en una Raspberry Pi. Como la Pi es solo el Gateway (los modelos se ejecutan en la nube mediante API), incluso una Pi modesta maneja bien la carga de trabajo: el costo típico del hardware es de **$35–80 una sola vez**, sin cuotas mensuales.

## Compatibilidad de hardware

| Modelo de Pi | RAM    | ¿Funciona? | Notas                                  |
| ------------ | ------ | ---------- | -------------------------------------- |
| Pi 5         | 4/8 GB | Mejor      | La más rápida, recomendada.            |
| Pi 4         | 4 GB   | Bueno      | Punto óptimo para la mayoría de usuarios. |
| Pi 4         | 2 GB   | Aceptable  | Agrega swap.                           |
| Pi 4         | 1 GB   | Ajustado   | Posible con swap y configuración mínima. |
| Pi 3B+       | 1 GB   | Lento      | Funciona, pero con lentitud.           |
| Pi Zero 2 W  | 512 MB | No         | No recomendada.                        |

**Mínimo:** 1 GB de RAM, 1 núcleo, 500 MB de disco libre, SO de 64 bits.
**Recomendado:** 2 GB+ de RAM, tarjeta SD de 16 GB+ (o SSD USB), Ethernet.

## Requisitos previos

- Raspberry Pi 4 o 5 con 2 GB+ de RAM (4 GB recomendado)
- Tarjeta MicroSD (16 GB+) o SSD USB (mejor rendimiento)
- Fuente de alimentación oficial de Pi
- Conexión de red (Ethernet o WiFi)
- Raspberry Pi OS de 64 bits (obligatorio -- no uses 32 bits)
- Aproximadamente 30 minutos

## Configuración

<Steps>
  <Step title="Flash the OS">
    Usa **Raspberry Pi OS Lite (64-bit)** -- no se necesita escritorio para un servidor sin pantalla.

    1. Descarga [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Elige el SO: **Raspberry Pi OS Lite (64-bit)**.
    3. En el cuadro de configuración, preconfigura:
       - Nombre de host: `gateway-host`
       - Habilitar SSH
       - Establecer nombre de usuario y contraseña
       - Configurar WiFi (si no usas Ethernet)
    4. Graba en tu tarjeta SD o unidad USB, insértala y arranca la Pi.

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

    Sigue el asistente. Se recomiendan claves de API en lugar de OAuth para dispositivos sin pantalla. Telegram es el canal más fácil para empezar.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    En tu computadora, obtén una URL del panel desde la Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Luego crea un túnel SSH en otra terminal:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Abre la URL impresa en tu navegador local. Para acceso remoto siempre activo, consulta la [integración con Tailscale](/es/gateway/tailscale).

  </Step>
</Steps>

## Consejos de rendimiento

**Usa un SSD USB** -- Las tarjetas SD son lentas y se desgastan. Un SSD USB mejora drásticamente el rendimiento. Consulta la [guía de arranque USB para Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Habilita la caché de compilación de módulos** -- Acelera las invocaciones repetidas de la CLI en hosts Pi de menor potencia:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Reduce el uso de memoria** -- Para configuraciones sin pantalla, libera memoria de GPU y deshabilita servicios no utilizados:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**drop-in de systemd para reinicios estables** -- Si esta Pi ejecuta principalmente OpenClaw, agrega un drop-in de servicio:

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

Luego `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. En una Pi sin pantalla, habilita también lingering una vez para que el servicio de usuario sobreviva al cierre de sesión: `sudo loginctl enable-linger "$(whoami)"`.

## Configuración de modelo recomendada

Como la Pi solo ejecuta el Gateway, usa modelos de API alojados en la nube:

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

No ejecutes LLM locales en una Pi: incluso los modelos pequeños son demasiado lentos para ser útiles. Deja que Claude o GPT hagan el trabajo del modelo.

## Notas sobre binarios ARM

La mayoría de las funciones de OpenClaw funcionan en ARM64 sin cambios (Node.js, Telegram, WhatsApp/Baileys, Chromium). Los binarios que ocasionalmente no tienen compilaciones ARM suelen ser herramientas CLI opcionales de Go/Rust incluidas por Skills. Verifica la página de lanzamiento de un binario faltante para artefactos `linux-arm64` / `aarch64` antes de recurrir a compilar desde el código fuente.

## Persistencia y copias de seguridad

El estado de OpenClaw reside en:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canales/proveedores, sesiones.
- `~/.openclaw/workspace/` — espacio de trabajo del agente (SOUL.md, memoria, artefactos).

Esto sobrevive a los reinicios. Toma una instantánea portátil con:

```bash
openclaw backup create
```

Si mantienes esto en un SSD, tanto el rendimiento como la longevidad mejoran frente a la tarjeta SD.

## Solución de problemas

**Sin memoria** -- Verifica que swap esté activo con `free -h`. Deshabilita servicios no utilizados (`sudo systemctl disable cups bluetooth avahi-daemon`). Usa solo modelos basados en API.

**Rendimiento lento** -- Usa un SSD USB en lugar de una tarjeta SD. Comprueba si hay limitación de CPU con `vcgencmd get_throttled` (debería devolver `0x0`).

**El servicio no inicia** -- Revisa los registros con `journalctl --user -u openclaw-gateway.service --no-pager -n 100` y ejecuta `openclaw doctor --non-interactive`. Si esta es una Pi sin pantalla, verifica también que lingering esté habilitado: `sudo loginctl enable-linger "$(whoami)"`.

**Problemas con binarios ARM** -- Si una skill falla con "exec format error", comprueba si el binario tiene una compilación ARM64. Verifica la arquitectura con `uname -m` (debería mostrar `aarch64`).

**Caídas de WiFi** -- Deshabilita la administración de energía de WiFi: `sudo iwconfig wlan0 power off`.

## Próximos pasos

- [Canales](/es/channels) -- conecta Telegram, WhatsApp, Discord y más
- [Configuración de Gateway](/es/gateway/configuration) -- todas las opciones de configuración
- [Actualización](/es/install/updating) -- mantén OpenClaw actualizado

## Relacionado

- [Resumen de instalación](/es/install)
- [Servidor Linux](/es/vps)
- [Plataformas](/es/platforms)
