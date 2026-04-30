---
read_when:
    - Configurar OpenClaw en Oracle Cloud
    - Buscando alojamiento VPS de bajo costo para OpenClaw
    - Quieres OpenClaw 24/7 en un servidor pequeño
summary: OpenClaw en Oracle Cloud (ARM Always Free)
title: Oracle Cloud (plataforma)
x-i18n:
    generated_at: "2026-04-30T05:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw en Oracle Cloud (OCI)

## Objetivo

Ejecutar un Gateway de OpenClaw persistente en el nivel ARM **Always Free** de Oracle Cloud.

El nivel gratuito de Oracle puede encajar muy bien con OpenClaw (especialmente si ya tienes una cuenta de OCI), pero tiene contrapartidas:

- Arquitectura ARM (la mayoría de las cosas funcionan, pero algunos binarios pueden ser solo x86)
- La capacidad y el registro pueden ser delicados

## Comparación de costos (2026)

| Proveedor    | Plan            | Especificaciones        | Precio/mes | Notas                      |
| ------------ | --------------- | ----------------------- | ---------- | -------------------------- |
| Oracle Cloud | Always Free ARM | hasta 4 OCPU, 24 GB RAM | $0         | ARM, capacidad limitada    |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM        | ~ $4       | Opción de pago más barata  |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM        | $6         | UI sencilla, buena docs    |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM        | $6         | Muchas ubicaciones         |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM        | $5         | Ahora parte de Akamai      |

---

## Requisitos previos

- Cuenta de Oracle Cloud ([registro](https://www.oracle.com/cloud/free/)) — consulta la [guía de registro de la comunidad](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si tienes problemas
- Cuenta de Tailscale (gratis en [tailscale.com](https://tailscale.com))
- ~30 minutos

## 1) Crear una instancia de OCI

1. Inicia sesión en [Oracle Cloud Console](https://cloud.oracle.com/)
2. Ve a **Compute → Instances → Create Instance**
3. Configura:
   - **Nombre:** `openclaw`
   - **Imagen:** Ubuntu 24.04 (aarch64)
   - **Forma:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (o hasta 4)
   - **Memoria:** 12 GB (o hasta 24 GB)
   - **Volumen de arranque:** 50 GB (hasta 200 GB gratis)
   - **Clave SSH:** Añade tu clave pública
4. Haz clic en **Create**
5. Anota la dirección IP pública

**Consejo:** Si la creación de la instancia falla con "Out of capacity", prueba con otro dominio de disponibilidad o inténtalo de nuevo más tarde. La capacidad del nivel gratuito es limitada.

## 2) Conectar y actualizar

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Nota:** `build-essential` es necesario para la compilación ARM de algunas dependencias.

## 3) Configurar usuario y nombre de host

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Instalar Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Esto habilita Tailscale SSH, para que puedas conectarte mediante `ssh openclaw` desde cualquier dispositivo en tu tailnet — sin necesitar una IP pública.

Verifica:

```bash
tailscale status
```

**A partir de ahora, conéctate mediante Tailscale:** `ssh ubuntu@openclaw` (o usa la IP de Tailscale).

## 5) Instalar OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Cuando se te pregunte "How do you want to hatch your bot?", selecciona **"Do this later"**.

> Nota: Si encuentras problemas de compilación nativa en ARM, empieza con paquetes del sistema (por ejemplo, `sudo apt install -y build-essential`) antes de recurrir a Homebrew.

## 6) Configurar Gateway (loopback + autenticación por token) y habilitar Tailscale Serve

Usa autenticación por token como opción predeterminada. Es predecible y evita necesitar indicadores de Control UI de “autenticación insegura”.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` aquí solo es para la gestión de IP reenviada/cliente local del proxy local de Tailscale Serve. **No** es `gateway.auth.mode: "trusted-proxy"`. Las rutas del visor de diffs mantienen un comportamiento de cierre por defecto en esta configuración: las solicitudes directas al visor desde `127.0.0.1` sin encabezados de proxy reenviados pueden devolver `Diff not found`. Usa `mode=file` / `mode=both` para adjuntos, o habilita intencionadamente visores remotos y configura `plugins.entries.diffs.config.viewerBaseUrl` (o pasa un `baseUrl` de proxy) si necesitas enlaces de visor compartibles.

## 7) Verificar

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) Bloquear la seguridad de VCN

Ahora que todo funciona, bloquea la VCN para impedir todo el tráfico excepto Tailscale. La Virtual Cloud Network de OCI actúa como firewall en el perímetro de red — el tráfico se bloquea antes de llegar a tu instancia.

1. Ve a **Networking → Virtual Cloud Networks** en la consola de OCI
2. Haz clic en tu VCN → **Security Lists** → Default Security List
3. **Elimina** todas las reglas de entrada excepto:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Mantén las reglas de salida predeterminadas (permitir todo el tráfico saliente)

Esto bloquea SSH en el puerto 22, HTTP, HTTPS y todo lo demás en el perímetro de red. A partir de ahora, solo puedes conectarte mediante Tailscale.

---

## Acceder a la Control UI

Desde cualquier dispositivo en tu red de Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Sustituye `<tailnet-name>` por el nombre de tu tailnet (visible en `tailscale status`).

No se necesita túnel SSH. Tailscale proporciona:

- Cifrado HTTPS (certificados automáticos)
- Autenticación mediante identidad de Tailscale
- Acceso desde cualquier dispositivo en tu tailnet (portátil, teléfono, etc.)

---

## Seguridad: VCN + Tailscale (base recomendada)

Con la VCN bloqueada (solo UDP 41641 abierto) y el Gateway vinculado a loopback, obtienes una defensa en profundidad sólida: el tráfico público se bloquea en el perímetro de red y el acceso administrativo ocurre a través de tu tailnet.

Esta configuración a menudo elimina la _necesidad_ de reglas adicionales de firewall basadas en host solo para detener ataques de fuerza bruta SSH desde todo Internet — pero aun así debes mantener el SO actualizado, ejecutar `openclaw security audit` y verificar que no estés escuchando accidentalmente en interfaces públicas.

### Ya protegido

| Paso tradicional             | ¿Necesario?       | Por qué                                                                      |
| ---------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| Firewall UFW                 | No                | VCN bloquea antes de que el tráfico llegue a la instancia                     |
| fail2ban                     | No                | No hay fuerza bruta si el puerto 22 está bloqueado en VCN                    |
| endurecimiento de sshd       | No                | Tailscale SSH no usa sshd                                                     |
| Deshabilitar inicio root     | No                | Tailscale usa identidad de Tailscale, no usuarios del sistema                 |
| Autenticación solo con clave SSH | No             | Tailscale autentica mediante tu tailnet                                       |
| Endurecimiento de IPv6       | Normalmente no    | Depende de la configuración de tu VCN/subred; verifica qué está realmente asignado/expuesto |

### Aún recomendado

- **Permisos de credenciales:** `chmod 700 ~/.openclaw`
- **Auditoría de seguridad:** `openclaw security audit`
- **Actualizaciones del sistema:** `sudo apt update && sudo apt upgrade` regularmente
- **Monitorizar Tailscale:** Revisa los dispositivos en la [consola de administración de Tailscale](https://login.tailscale.com/admin)

### Verificar postura de seguridad

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Alternativa: túnel SSH

Si Tailscale Serve no funciona, usa un túnel SSH:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Luego abre `http://localhost:18789`.

---

## Solución de problemas

### La creación de la instancia falla ("Out of capacity")

Las instancias ARM del nivel gratuito son populares. Prueba:

- Otro dominio de disponibilidad
- Reintentar durante horas de menor demanda (temprano por la mañana)
- Usar el filtro "Always Free" al seleccionar la forma

### Tailscale no se conecta

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### El Gateway no arranca

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### No se puede acceder a la Control UI

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### Problemas con binarios ARM

Algunas herramientas pueden no tener compilaciones ARM. Comprueba:

```bash
uname -m  # Should show aarch64
```

La mayoría de los paquetes npm funcionan bien. Para binarios, busca versiones `linux-arm64` o `aarch64`.

---

## Persistencia

Todo el estado vive en:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canal/proveedor y datos de sesión
- `~/.openclaw/workspace/` — espacio de trabajo (SOUL.md, memoria, artefactos)

Haz copias de seguridad periódicamente:

```bash
openclaw backup create
```

---

## Relacionado

- [Acceso remoto al Gateway](/es/gateway/remote) — otros patrones de acceso remoto
- [Integración con Tailscale](/es/gateway/tailscale) — documentación completa de Tailscale
- [Configuración del Gateway](/es/gateway/configuration) — todas las opciones de configuración
- [Guía de DigitalOcean](/es/install/digitalocean) — si quieres pago + registro más sencillo
- [Guía de Hetzner](/es/install/hetzner) — alternativa basada en Docker
