---
read_when:
    - Configurar OpenClaw en una Raspberry Pi
    - Ejecución de OpenClaw en dispositivos ARM
    - Crear una IA personal económica y siempre activa
summary: OpenClaw en Raspberry Pi (configuración autoalojada económica)
title: Raspberry Pi (plataforma)
x-i18n:
    generated_at: "2026-04-30T05:50:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw en Raspberry Pi

## Objetivo

Ejecutar un OpenClaw Gateway persistente y siempre activo en una Raspberry Pi por un costo único de **~35-80 USD** (sin cuotas mensuales).

Perfecto para:

- Asistente personal de IA 24/7
- Centro de automatización del hogar
- Bot de Telegram/WhatsApp siempre disponible y de bajo consumo

## Requisitos de hardware

| Modelo de Pi    | RAM     | ¿Funciona? | Notas                                    |
| --------------- | ------- | ---------- | ---------------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Mejor   | La más rápida, recomendada               |
| **Pi 4**        | 4GB     | ✅ Buena   | Punto ideal para la mayoría de usuarios  |
| **Pi 4**        | 2GB     | ✅ OK      | Funciona, agrega swap                    |
| **Pi 4**        | 1GB     | ⚠️ Justa   | Posible con swap, configuración mínima   |
| **Pi 3B+**      | 1GB     | ⚠️ Lenta   | Funciona, pero con lentitud              |
| **Pi Zero 2 W** | 512MB   | ❌         | No recomendada                           |

**Especificaciones mínimas:** 1GB de RAM, 1 núcleo, 500MB de disco  
**Recomendado:** 2GB+ de RAM, SO de 64 bits, tarjeta SD de 16GB+ (o SSD USB)

## Lo que necesitas

- Raspberry Pi 4 o 5 (se recomiendan 2GB+)
- Tarjeta MicroSD (16GB+) o SSD USB (mejor rendimiento)
- Fuente de alimentación (se recomienda la fuente oficial de Pi)
- Conexión de red (Ethernet o WiFi)
- ~30 minutos

## 1) Grabar el SO

Usa **Raspberry Pi OS Lite (64-bit)**; no se necesita escritorio para un servidor sin monitor.

1. Descarga [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Elige el SO: **Raspberry Pi OS Lite (64-bit)**
3. Haz clic en el icono de engranaje (⚙️) para preconfigurar:
   - Establecer hostname: `gateway-host`
   - Habilitar SSH
   - Establecer nombre de usuario/contraseña
   - Configurar WiFi (si no usas Ethernet)
4. Graba en tu tarjeta SD / unidad USB
5. Inserta y arranca la Pi

## 2) Conectarse por SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) Configuración del sistema

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Instalar Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Agregar swap (importante para 2GB o menos)

El swap evita cierres por falta de memoria:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Instalar OpenClaw

### Opción A: instalación estándar (recomendada)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Opción B: instalación modificable (para experimentar)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

La instalación modificable te da acceso directo a los registros y al código, útil para depurar problemas específicos de ARM.

## 7) Ejecutar Onboarding

```bash
openclaw onboard --install-daemon
```

Sigue el asistente:

1. **Modo Gateway:** Local
2. **Autenticación:** se recomiendan claves de API (OAuth puede ser delicado en una Pi sin monitor)
3. **Canales:** Telegram es lo más fácil para empezar
4. **Daemon:** Sí (systemd)

## 8) Verificar la instalación

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) Acceder al panel de OpenClaw

Reemplaza `user@gateway-host` por el nombre de usuario y hostname o dirección IP de tu Pi.

En tu computadora, pide a la Pi que imprima una URL nueva del panel:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

El comando imprime `Dashboard URL:`. Según cómo esté configurado `gateway.auth.token`, la URL puede ser un enlace simple `http://127.0.0.1:18789/` o uno que incluya `#token=...`.

En otra terminal de tu computadora, crea el túnel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Luego abre la URL impresa del panel en tu navegador local.

Si la interfaz pide autenticación con secreto compartido, pega el token o la contraseña configurados en los ajustes de Control UI. Para autenticación por token, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).

Para acceso remoto siempre activo, consulta [Tailscale](/es/gateway/tailscale).

---

## Optimizaciones de rendimiento

### Usar un SSD USB (gran mejora)

Las tarjetas SD son lentas y se desgastan. Un SSD USB mejora drásticamente el rendimiento:

```bash
# Check if booting from USB
lsblk
```

Consulta la [guía de arranque USB de Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) para la configuración.

### Acelerar el inicio de la CLI (caché de compilación de módulos)

En hosts Pi de menor potencia, habilita la caché de compilación de módulos de Node para que las ejecuciones repetidas de la CLI sean más rápidas:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Notas:

- `NODE_COMPILE_CACHE` acelera ejecuciones posteriores (`status`, `health`, `--help`).
- `/var/tmp` sobrevive a reinicios mejor que `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` evita el costo adicional de inicio por el autorrespawn de la CLI.
- La primera ejecución calienta la caché; las ejecuciones posteriores son las que más se benefician.

### Ajustes de inicio de systemd (opcional)

Si esta Pi se dedica principalmente a ejecutar OpenClaw, agrega un drop-in de servicio para reducir la variación en los reinicios y mantener estable el entorno de inicio:

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

Luego aplica:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Si es posible, mantén el estado/caché de OpenClaw en almacenamiento respaldado por SSD para evitar cuellos de botella de E/S aleatoria de la tarjeta SD durante arranques en frío.

Si esta es una Pi sin monitor, habilita lingering una vez para que el servicio de usuario sobreviva al cierre de sesión:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Cómo ayudan las políticas `Restart=` a la recuperación automatizada:
[systemd puede automatizar la recuperación de servicios](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Reducir el uso de memoria

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### Supervisar recursos

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## Notas específicas de ARM

### Compatibilidad binaria

La mayoría de las funciones de OpenClaw funcionan en ARM64, pero algunos binarios externos pueden necesitar compilaciones para ARM:

| Herramienta        | Estado ARM64 | Notas                                      |
| ------------------ | ------------ | ------------------------------------------ |
| Node.js            | ✅           | Funciona muy bien                          |
| WhatsApp (Baileys) | ✅           | JS puro, sin problemas                     |
| Telegram           | ✅           | JS puro, sin problemas                     |
| gog (Gmail CLI)    | ⚠️           | Comprueba si hay una versión para ARM      |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser`        |

Si una Skill falla, comprueba si su binario tiene una compilación para ARM. Muchas herramientas Go/Rust la tienen; algunas no.

### 32 bits frente a 64 bits

**Usa siempre un SO de 64 bits.** Node.js y muchas herramientas modernas lo requieren. Compruébalo con:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## Configuración de modelo recomendada

Como la Pi es solo el Gateway (los modelos se ejecutan en la nube), usa modelos basados en API:

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

**No intentes ejecutar LLM locales en una Pi**: incluso los modelos pequeños son demasiado lentos. Deja que Claude/GPT hagan el trabajo pesado.

---

## Inicio automático al arrancar

Onboarding configura esto, pero para verificarlo:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## Solución de problemas

### Falta de memoria (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Rendimiento lento

- Usa un SSD USB en lugar de una tarjeta SD
- Deshabilita servicios no usados: `sudo systemctl disable cups bluetooth avahi-daemon`
- Comprueba la limitación de CPU: `vcgencmd get_throttled` (debería devolver `0x0`)

### El servicio no arranca

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problemas de binarios ARM

Si una Skill falla con "exec format error":

1. Comprueba si el binario tiene una compilación ARM64
2. Intenta compilar desde el código fuente
3. O usa un contenedor Docker con soporte ARM

### Cortes de WiFi

Para Pis sin monitor en WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Comparación de costos

| Configuración  | Costo único | Costo mensual | Notas                               |
| -------------- | ----------- | ------------- | ----------------------------------- |
| **Pi 4 (2GB)** | ~$45        | $0            | + energía (~$5/año)                 |
| **Pi 4 (4GB)** | ~$55        | $0            | Recomendada                         |
| **Pi 5 (4GB)** | ~$60        | $0            | Mejor rendimiento                   |
| **Pi 5 (8GB)** | ~$80        | $0            | Excesiva, pero preparada para futuro |
| DigitalOcean   | $0          | $6/mes        | $72/año                             |
| Hetzner        | $0          | €3.79/mes     | ~$50/año                            |

**Punto de equilibrio:** una Pi se amortiza en ~6-12 meses frente a un VPS en la nube.

---

## Relacionado

- [Guía de Linux](/es/platforms/linux) — configuración general de Linux
- [Guía de DigitalOcean](/es/install/digitalocean) — alternativa en la nube
- [Guía de Hetzner](/es/install/hetzner) — configuración con Docker
- [Tailscale](/es/gateway/tailscale) — acceso remoto
- [Nodes](/es/nodes) — empareja tu laptop/teléfono con el gateway de Pi
