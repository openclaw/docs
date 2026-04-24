---
read_when:
    - Configurar OpenClaw en una Raspberry Pi
    - Ejecutar OpenClaw en dispositivos ARM
    - Crear una IA personal barata y siempre activa
summary: OpenClaw en Raspberry Pi (configuración autoalojada económica)
title: Raspberry Pi (plataforma)
x-i18n:
    generated_at: "2026-04-24T05:39:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw en Raspberry Pi

## Objetivo

Ejecutar un Gateway persistente y siempre activo de OpenClaw en una Raspberry Pi por **~\$35-80** de costo único (sin cuotas mensuales).

Perfecto para:

- Asistente de IA personal 24/7
- Hub de automatización del hogar
- Bot de Telegram/WhatsApp de bajo consumo y siempre disponible

## Requisitos de hardware

| Modelo de Pi | RAM | ¿Funciona? | Notas |
| --------------- | ------- | -------- | ---------------------------------- |
| **Pi 5** | 4GB/8GB | ✅ Mejor | Más rápida, recomendada |
| **Pi 4** | 4GB | ✅ Buena | Punto ideal para la mayoría de usuarios |
| **Pi 4** | 2GB | ✅ OK | Funciona, agrega swap |
| **Pi 4** | 1GB | ⚠️ Justa | Posible con swap, configuración mínima |
| **Pi 3B+** | 1GB | ⚠️ Lenta | Funciona, pero con lentitud |
| **Pi Zero 2 W** | 512MB | ❌ | No recomendada |

**Especificaciones mínimas:** 1 GB de RAM, 1 núcleo, 500 MB de disco  
**Recomendado:** 2 GB+ de RAM, SO de 64 bits, tarjeta SD de 16 GB+ (o SSD USB)

## Qué necesitas

- Raspberry Pi 4 o 5 (2 GB+ recomendado)
- Tarjeta microSD (16 GB+) o SSD USB (mejor rendimiento)
- Fuente de alimentación (se recomienda la PSU oficial de Pi)
- Conexión de red (Ethernet o WiFi)
- ~30 minutos

## 1) Grabar el sistema operativo

Usa **Raspberry Pi OS Lite (64-bit)** — no hace falta escritorio para un servidor sin monitor.

1. Descarga [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Elige SO: **Raspberry Pi OS Lite (64-bit)**
3. Haz clic en el icono de engranaje (⚙️) para preconfigurar:
   - Establecer nombre del host: `gateway-host`
   - Habilitar SSH
   - Establecer usuario/contraseña
   - Configurar WiFi (si no usas Ethernet)
4. Graba en tu tarjeta SD / unidad USB
5. Insértala y arranca la Pi

## 2) Conectarse mediante SSH

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

## 5) Agregar swap (importante para 2 GB o menos)

El swap evita fallos por falta de memoria:

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

La instalación modificable te da acceso directo a registros y código — útil para depurar problemas específicos de ARM.

## 7) Ejecutar la incorporación

```bash
openclaw onboard --install-daemon
```

Sigue el asistente:

1. **Modo de Gateway:** Local
2. **Autenticación:** se recomiendan claves API (OAuth puede ser delicado en una Pi sin monitor)
3. **Canales:** Telegram es el más fácil para empezar
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

Sustituye `user@gateway-host` por tu nombre de usuario y nombre del host o dirección IP de la Pi.

En tu ordenador, pide a la Pi que imprima una URL nueva del panel:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

El comando imprime `Dashboard URL:`. Dependiendo de cómo esté configurado `gateway.auth.token`,
la URL puede ser un enlace simple `http://127.0.0.1:18789/` o uno
que incluya `#token=...`.

En otra terminal de tu ordenador, crea el túnel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Luego abre la URL impresa en tu navegador local.

Para acceso remoto siempre activo, consulta [Tailscale](/es/gateway/tailscale).

---

## Optimizaciones de rendimiento

### Usa un SSD USB (gran mejora)

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

- `NODE_COMPILE_CACHE` acelera las ejecuciones posteriores (`status`, `health`, `--help`).
- `/var/tmp` sobrevive mejor a los reinicios que `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` evita el costo adicional de inicio por el autorelanzamiento de la CLI.
- La primera ejecución calienta la caché; las posteriores son las que más se benefician.

### Ajuste de inicio con systemd (opcional)

Si esta Pi va a ejecutar sobre todo OpenClaw, agrega un drop-in del servicio para reducir
las oscilaciones de reinicio y mantener estable el entorno de inicio:

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

Si es posible, mantén el estado/caché de OpenClaw en almacenamiento con SSD para evitar
cuellos de botella de E/S aleatoria de tarjetas SD durante arranques en frío.

Si esta es una Pi sin monitor, habilita lingering una vez para que el servicio de usuario sobreviva
al cierre de sesión:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Cómo ayudan las políticas `Restart=` a la recuperación automatizada:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

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

### Compatibilidad de binarios

La mayoría de las funciones de OpenClaw funcionan en ARM64, pero algunos binarios externos pueden necesitar compilaciones ARM:

| Herramienta | Estado ARM64 | Notas |
| ------------------ | ------------ | ----------------------------------- |
| Node.js | ✅ | Funciona muy bien |
| WhatsApp (Baileys) | ✅ | JavaScript puro, sin problemas |
| Telegram | ✅ | JavaScript puro, sin problemas |
| gog (CLI de Gmail) | ⚠️ | Comprobar si hay versión ARM |
| Chromium (navegador) | ✅ | `sudo apt install chromium-browser` |

Si una Skill falla, comprueba si su binario tiene una compilación ARM. Muchas herramientas Go/Rust la tienen; otras no.

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

**No intentes ejecutar LLM locales en una Pi** — incluso los modelos pequeños son demasiado lentos. Deja que Claude/GPT hagan el trabajo pesado.

---

## Inicio automático al arrancar

La incorporación lo configura, pero para verificarlo:

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

### Memoria insuficiente (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Rendimiento lento

- Usa un SSD USB en lugar de una tarjeta SD
- Desactiva servicios no usados: `sudo systemctl disable cups bluetooth avahi-daemon`
- Comprueba si hay limitación térmica/eléctrica de CPU: `vcgencmd get_throttled` (debería devolver `0x0`)

### El servicio no se inicia

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problemas con binarios ARM

Si una Skill falla con "exec format error":

1. Comprueba si el binario tiene una compilación ARM64
2. Intenta compilarlo desde el código fuente
3. O usa un contenedor Docker con compatibilidad ARM

### Cortes de WiFi

Para Pi sin monitor conectadas por WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Comparación de costos

| Configuración | Costo único | Costo mensual | Notas |
| -------------- | ------------- | ------------ | ------------------------- |
| **Pi 4 (2GB)** | ~\$45 | \$0 | + energía (~\$5/año) |
| **Pi 4 (4GB)** | ~\$55 | \$0 | Recomendado |
| **Pi 5 (4GB)** | ~\$60 | \$0 | Mejor rendimiento |
| **Pi 5 (8GB)** | ~\$80 | \$0 | Excesivo pero preparado para el futuro |
| DigitalOcean | \$0 | \$6/mes | \$72/año |
| Hetzner | \$0 | €3.79/mes | ~\$50/año |

**Punto de equilibrio:** una Pi se amortiza en ~6-12 meses frente a un VPS en la nube.

---

## Relacionado

- [Guía de Linux](/es/platforms/linux) — configuración general en Linux
- [Guía de DigitalOcean](/es/install/digitalocean) — alternativa en la nube
- [Hetzner](/es/install/hetzner) — configuración con Docker
- [Tailscale](/es/gateway/tailscale) — acceso remoto
- [Nodos](/es/nodes) — empareja tu portátil/teléfono con el gateway de la Pi
